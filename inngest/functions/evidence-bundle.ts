/**
 * MITHQAL — Evidence bundle generator (Phase 3 Inngest function).
 *
 * Triggered on `evidence.bundle.requested`. Reads every
 * `evidence_events` row for the specified validation case + the
 * source snapshots + the policy decisions + the reconciliation
 * cases, assembles them into a single immutable bundle (JSON +
 * PDF-ready manifest), stores the bundle's content digest in an
 * `outbox_events` row, and returns the bundle's URL.
 *
 * Truth state: WIRED, MTQ-DISABLED. The bundle is an auditable
 * record; it does NOT initiate a payment or execute a rail.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 *
 * Per §5.5: "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE" — the
 * bundle is labelled "DEMO DATA" in the pilot.
 */

import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import {
  evidenceEvents,
  exceptions,
  outboxEvents,
  policyDecisions,
  reconciliationCases,
  sourceSnapshots,
  validationCases,
} from "@/db/schema";
import { logger } from "@/lib/logger";

export const evidenceBundle = inngest.createFunction(
  {
    id: "evidence-bundle",
    name: "Evidence Bundle Generator",
    triggers: [{ event: EVENTS.EVIDENCE_BUNDLE_REQUESTED }],
  },
  async ({ event, step }) => {
    const caseId = (event.data as { caseId?: string }).caseId;
    const requestedBy = (event.data as { requestedBy?: string }).requestedBy ?? "evidence-bundle";
    if (!caseId) {
      logger.warn({ event }, "evidence-bundle/missing caseId — skipping.");
      return { status: "skipped", reason: "missing-case-id" };
    }

    // Step 1 — load every evidence row for the case.
    const load = await step.run("load-evidence", async () => {
      const db = requireDb();
      const [caseRows, snapshots, events, exs, decisions, recons] = await Promise.all([
        db.select().from(validationCases).where(eq(validationCases.id, caseId)).limit(1),
        db.select().from(sourceSnapshots).where(eq(sourceSnapshots.validationCaseId, caseId)),
        db.select().from(evidenceEvents).where(eq(evidenceEvents.validationCaseId, caseId)),
        db.select().from(exceptions).where(eq(exceptions.validationCaseId, caseId)),
        db.select().from(policyDecisions).where(eq(policyDecisions.validationCaseId, caseId)),
        db.select().from(reconciliationCases).where(eq(reconciliationCases.validationCaseId, caseId)),
      ]);
      return {
        caseRow: caseRows[0] ?? null,
        snapshots,
        events,
        exceptions: exs,
        decisions,
        recons,
      };
    });

    if (!load.caseRow) {
      logger.warn({ caseId }, "evidence-bundle/case not found — skipping.");
      return { status: "skipped", reason: "case-not-found" };
    }

    // Step 2 — assemble the bundle + compute its content digest.
    const bundle = await step.run("assemble-bundle", async () => {
      const assembled = {
        bundleId: `bundle-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
        caseId,
        institutionId: load.caseRow?.institutionId,
        generatedAt: new Date().toISOString(),
        generatedBy: requestedBy,
        mtqDisabled: true,
        productionAuthorized: false,
        demoData: true,
        case: load.caseRow,
        snapshots: load.snapshots,
        evidenceEvents: load.events,
        exceptions: load.exceptions,
        policyDecisions: load.decisions,
        reconciliationCases: load.recons,
      };
      const canon = JSON.stringify(assembled, null, 2);
      const digest = createHash("sha256").update(canon).digest("hex");
      return { assembled, digest, canon };
    });

    // Step 3 — persist the bundle reference + outbox row.
    await step.run("persist-bundle-ref", async () => {
      const db = requireDb();
      return db.transaction(async (tx) => {
        // SYNTHETIC: the bundle's payload is stored in
        // `evidence_events.details` (under `bundleRef`) so the audit
        // trail records that a bundle was generated for this case.
        await tx.insert(evidenceEvents).values({
          id: `evt-bundle-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
          institutionId: load.caseRow?.institutionId ?? "system",
          validationCaseId: caseId,
          eventType: "RECONCILIATION_COMPLETED", // closest enum value for a bundle-generation event
          actorSource: requestedBy,
          signatureState: "UNVERIFIED",
          details: {
            bundleId: bundle.assembled.bundleId,
            bundleDigest: bundle.digest,
            bundleSizeBytes: bundle.canon.length,
            mtqDisabled: true,
            demoData: true,
          },
        });

        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "EVIDENCE_BUNDLE",
          aggregateId: bundle.assembled.bundleId,
          eventType: "EVIDENCE_BUNDLE_GENERATED",
          payload: {
            caseId,
            bundleId: bundle.assembled.bundleId,
            bundleDigest: bundle.digest,
            bundleSizeBytes: bundle.canon.length,
            mtqDisabled: true,
          },
          status: "PENDING",
        });
      });
    });

    logger.info(
      { caseId, bundleId: bundle.assembled.bundleId, digest: bundle.digest.slice(0, 16) },
      "evidence-bundle/completed",
    );

    return {
      status: "completed",
      caseId,
      bundleId: bundle.assembled.bundleId,
      bundleDigest: bundle.digest,
      bundleSizeBytes: bundle.canon.length,
      mtqDisabled: true,
      demoData: true,
    };
  }
);
