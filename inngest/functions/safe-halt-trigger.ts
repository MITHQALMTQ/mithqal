/**
 * MITHQAL — Safe-halt trigger (Phase 3 Inngest function).
 *
 * Triggered on `safe.halt.triggered`. Propagates the halt signal
 * to every downstream consumer (Turso projection, Inngest
 * pipelines, dashboard status-bar) by emitting an outbox row +
 * emitting child Inngest events. The function does NOT execute a
 * payment or reverse a payment — per §5.2.G a safe halt:
 *   1. Stops the system from accepting new validation cases.
 *   2. Preserves all existing cases and evidence.
 *   3. Requires explicit recovery approval after root cause, fix,
 *      tests, and ownership have been documented.
 *
 * Truth state: WIRED, MTQ-DISABLED. The halt is an auditable
 * record; it does NOT execute, reverse, or initiate any payment.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 *
 * The function is auto-triggered by the incident-severity
 * classifier when an incident's severity is SEV-0 (CUSTODY_SHORTFALL,
 * CREDENTIAL_LEAK). Recovery requires manual sign-off via the
 * `POST /api/v1/safe-halt` route with a separate authorisation.
 */

import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { accessAuditEvents, outboxEvents } from "@/db/schema";
import { logger } from "@/lib/logger";

export const safeHaltTrigger = inngest.createFunction(
  {
    id: "safe-halt-trigger",
    name: "Safe Halt Trigger",
    triggers: [{ event: EVENTS.SAFE_HALT_TRIGGERED }],
  },
  async ({ event, step }) => {
    const haltId = (event.data as { haltId?: string }).haltId ?? `halt-${crypto.randomUUID().slice(0, 12)}`;
    const reason = (event.data as { reason?: string }).reason ?? "unspecified";
    const authorisedBy = (event.data as { authorisedBy?: string }).authorisedBy ?? "incident-severity-classifier";
    const scope = (event.data as { scope?: string }).scope ?? "ALL";
    const incidentCategory = (event.data as { incidentCategory?: string }).incidentCategory;

    // Step 1 — persist the halt outbox row + access audit event.
    await step.run("persist-halt", async () => {
      const db = requireDb();
      const now = new Date().toISOString();
      return db.transaction(async (tx) => {
        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "SYSTEM",
          aggregateId: haltId,
          eventType: "SAFE_HALTED",
          payload: {
            haltId,
            reason,
            authorisedBy,
            scope,
            incidentCategory,
            mtqDisabled: true,
            triggeredAt: now,
          },
          status: "PENDING",
        });

        await tx.insert(accessAuditEvents).values({
          id: crypto.randomUUID(),
          institutionId: "system",
          actor: authorisedBy,
          action: "SAFE_HALT_TRIGGERED",
          resource: haltId,
          result: "SUCCESS",
          details: {
            reason,
            scope,
            incidentCategory,
            triggeredAt: now,
            mtqDisabled: true,
          },
        });
      });
    });

    // Step 2 — emit the Turso projection event so the dashboard
    // status-bar flips to "safe-halted" within the SLO.
    await inngest.send({
      name: EVENTS.TURSO_PROJECTION_NEEDED,
      data: { haltId, scope: "dashboard_summary" },
    });

    logger.warn(
      { haltId, reason, authorisedBy, scope, incidentCategory },
      "safe-halt-trigger/propagated — new processing stopped, existing cases preserved",
    );

    return {
      status: "completed",
      haltId,
      newCasesAccepted: false,
      existingCasesPreserved: true,
      recoveryRequiresAuthorisation: true,
      paymentExecuted: false,
      mtqDisabled: true,
      truthState: "DECISION",
    };
  }
);
