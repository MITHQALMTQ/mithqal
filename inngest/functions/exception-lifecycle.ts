/**
 * MITHQAL — Exception lifecycle (Phase 3 Inngest function).
 *
 * Triggered on `exception.opened` and `exception.resolved`. Drives
 * the exception state-machine transitions per §5.2.C:
 *
 *   OPEN → IN_REVIEW → AWAITING_EVIDENCE → READY_TO_RESOLVE → RESOLVED
 *                                  │
 *                                  └→ ESCALATED (severity bump)
 *
 * The function:
 *   - on `exception.opened`: records an `EXCEPTION_OPENED` evidence
 *     event + emits an `outbox` row so the dashboard projection
 *     surfaces the new exception in the queue.
 *   - on `exception.resolved`: records an `EXCEPTION_RESOLVED`
 *     evidence event (via the `HUMAN_APPROVAL_RECORDED` event_type
 *     enum) + emits an `outbox` row so the projection evicts the
 *     exception from the queue.
 *
 * Truth state: WIRED, MTQ-DISABLED. The transitions produce
 * auditable records; they do NOT initiate a payment or execute a
 * correction. productionAuthorized=false; MTQ Σ remains NOT
 * AUTHORIZED.
 */

import { eq } from "drizzle-orm";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { evidenceEvents, exceptions, outboxEvents } from "@/db/schema";
import { logger } from "@/lib/logger";

export const exceptionLifecycle = inngest.createFunction(
  {
    id: "exception-lifecycle",
    name: "Exception Lifecycle",
    triggers: [
      { event: EVENTS.EXCEPTION_OPENED },
      { event: EVENTS.EXCEPTION_RESOLVED },
    ],
  },
  async ({ event, step }) => {
    const exceptionId = (event.data as { exceptionId?: string }).exceptionId;
    const actor = (event.data as { actor?: string }).actor ?? "exception-lifecycle";
    if (!exceptionId) {
      logger.warn({ event }, "exception-lifecycle/missing exceptionId — skipping.");
      return { status: "skipped", reason: "missing-exception-id" };
    }

    // Step 1 — load the exception row.
    const loadResult = await step.run("load-exception", async () => {
      const db = requireDb();
      const rows = await db
        .select()
        .from(exceptions)
        .where(eq(exceptions.id, exceptionId))
        .limit(1);
      return { exceptionRow: rows[0] ?? null };
    });

    if (!loadResult.exceptionRow) {
      logger.warn({ exceptionId }, "exception-lifecycle/exception not found — skipping.");
      return { status: "skipped", reason: "exception-not-found" };
    }

    const exceptionRow = loadResult.exceptionRow;
    const isOpenedEvent = event.name === EVENTS.EXCEPTION_OPENED;

    // Step 2 — record the evidence event + outbox row.
    await step.run("persist-transition", async () => {
      const db = requireDb();
      return db.transaction(async (tx) => {
        await tx.insert(evidenceEvents).values({
          id: `evt-exc-${exceptionId}-${crypto.randomUUID().slice(0, 8)}`,
          institutionId: exceptionRow.validationCaseId, // closest field to institutionId
          validationCaseId: exceptionRow.validationCaseId,
          eventType: isOpenedEvent ? "EXCEPTION_OPENED" : "HUMAN_APPROVAL_RECORDED",
          actorSource: actor,
          signatureState: "UNVERIFIED",
          details: {
            exceptionId,
            code: exceptionRow.code,
            severity: exceptionRow.severity,
            reasonCode: exceptionRow.reasonCode,
            transition: isOpenedEvent ? "OPENED" : "RESOLVED",
            mtqDisabled: true,
            demoData: true,
          },
        });

        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "EXCEPTION",
          aggregateId: exceptionId,
          eventType: isOpenedEvent ? "EXCEPTION_OPENED" : "EXCEPTION_RESOLVED",
          payload: {
            exceptionId,
            validationCaseId: exceptionRow.validationCaseId,
            code: exceptionRow.code,
            severity: exceptionRow.severity,
            transition: isOpenedEvent ? "OPENED" : "RESOLVED",
            mtqDisabled: true,
          },
          status: "PENDING",
        });
      });
    });

    logger.info(
      { exceptionId, transition: isOpenedEvent ? "OPENED" : "RESOLVED" },
      "exception-lifecycle/completed",
    );

    return {
      status: "completed",
      exceptionId,
      transition: isOpenedEvent ? "OPENED" : "RESOLVED",
      mtqDisabled: true,
    };
  }
);
