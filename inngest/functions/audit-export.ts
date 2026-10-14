/**
 * MITHQAL — Audit export job (Phase 3 Inngest function).
 *
 * Triggered on `audit.export.requested`. Reads every
 * `access_audit_events` row + every `evidence_events` row + every
 * `policy_decisions` row for the specified time window + the
 * specified institution scope, assembles them into a single
 * immutable audit bundle (JSON), and stores the bundle's content
 * digest in an `outbox_events` row so the bundle is referenced by
 * the audit trail.
 *
 * Truth state: WIRED, MTQ-DISABLED. The bundle is an auditable
 * record; it does NOT initiate a payment or execute a rail.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 *
 * Per §5.5: "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE" — the
 * bundle is labelled "DEMO DATA" in the pilot.
 */

import { and, eq, gte, lte } from "drizzle-orm";
import { createHash } from "node:crypto";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { accessAuditEvents, evidenceEvents, outboxEvents, policyDecisions } from "@/db/schema";
import { logger } from "@/lib/logger";

export const auditExport = inngest.createFunction(
  {
    id: "audit-export",
    name: "Audit Export",
    triggers: [{ event: EVENTS.AUDIT_EXPORT_REQUESTED }],
  },
  async ({ event, step }) => {
    const institutionId = (event.data as { institutionId?: string }).institutionId;
    const fromIso = (event.data as { from?: string }).from;
    const toIso = (event.data as { to?: string }).to;
    const requestedBy = (event.data as { requestedBy?: string }).requestedBy ?? "audit-export";

    if (!institutionId || !fromIso || !toIso) {
      logger.warn({ event }, "audit-export/missing params — skipping.");
      return { status: "skipped", reason: "missing-params" };
    }

    const from = new Date(fromIso);
    const to = new Date(toIso);

    // Step 1 — load every audit row in the window for the institution.
    const load = await step.run("load-audit-rows", async () => {
      const db = requireDb();
      const [audit, evidence, decisions] = await Promise.all([
        db
          .select()
          .from(accessAuditEvents)
          .where(
            and(
              eq(accessAuditEvents.institutionId, institutionId),
              gte(accessAuditEvents.timestamp, from),
              lte(accessAuditEvents.timestamp, to),
            ),
          ),
        db
          .select()
          .from(evidenceEvents)
          .where(
            and(
              eq(evidenceEvents.institutionId, institutionId),
              gte(evidenceEvents.timestamp, from),
              lte(evidenceEvents.timestamp, to),
            ),
          ),
        db
          .select()
          .from(policyDecisions)
          .where(
            and(
              eq(policyDecisions.actor, requestedBy),
              gte(policyDecisions.evaluatedAt, from),
              lte(policyDecisions.evaluatedAt, to),
            ),
          ),
      ]);
      return { audit, evidence, decisions };
    });

    // Step 2 — assemble the bundle + compute the content digest.
    const bundle = await step.run("assemble-bundle", async () => {
      const assembled = {
        bundleId: `audit-bundle-${institutionId}-${crypto.randomUUID().slice(0, 8)}`,
        institutionId,
        from: fromIso,
        to: toIso,
        generatedAt: new Date().toISOString(),
        generatedBy: requestedBy,
        mtqDisabled: true,
        productionAuthorized: false,
        demoData: true,
        auditEvents: load.audit,
        evidenceEvents: load.evidence,
        policyDecisions: load.decisions,
      };
      const canon = JSON.stringify(assembled, null, 2);
      const digest = createHash("sha256").update(canon).digest("hex");
      return { assembled, digest, canon };
    });

    // Step 3 — persist the bundle reference outbox row.
    await step.run("persist-bundle-ref", async () => {
      const db = requireDb();
      await db.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        aggregateType: "AUDIT_BUNDLE",
        aggregateId: bundle.assembled.bundleId,
        eventType: "AUDIT_BUNDLE_GENERATED",
        payload: {
          institutionId,
          bundleId: bundle.assembled.bundleId,
          bundleDigest: bundle.digest,
          bundleSizeBytes: bundle.canon.length,
          from: fromIso,
          to: toIso,
          auditEventCount: load.audit.length,
          evidenceEventCount: load.evidence.length,
          policyDecisionCount: load.decisions.length,
          mtqDisabled: true,
        },
        status: "PENDING",
      });
    });

    logger.info(
      {
        institutionId,
        bundleId: bundle.assembled.bundleId,
        auditEventCount: load.audit.length,
        evidenceEventCount: load.evidence.length,
      },
      "audit-export/completed",
    );

    return {
      status: "completed",
      institutionId,
      bundleId: bundle.assembled.bundleId,
      bundleDigest: bundle.digest,
      bundleSizeBytes: bundle.canon.length,
      auditEventCount: load.audit.length,
      evidenceEventCount: load.evidence.length,
      policyDecisionCount: load.decisions.length,
      mtqDisabled: true,
      demoData: true,
    };
  }
);
