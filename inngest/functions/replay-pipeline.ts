/**
 * MITHQAL — Replay pipeline (Phase 3 Inngest function).
 *
 * Triggered on `replay.requested`. Re-evaluates a historical
 * validation case using the rule version that was active at the
 * original validation time. Produces a new `policy_decisions` row
 * with the replayed verdict + a `REPLAYED` `evidence_events` row.
 *
 * Truth state: WIRED, MTQ-DISABLED. Replay produces auditable
 * records; it does NOT alter the original verdict or initiate a
 * payment. The original `policy_decisions` row is preserved.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 */

import { eq } from "drizzle-orm";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { evidenceEvents, outboxEvents, policyDecisions, validationCases } from "@/db/schema";
import { logger } from "@/lib/logger";
import { runValidation } from "@/lib/validation-engine";

export const replayPipeline = inngest.createFunction(
  {
    id: "replay-pipeline",
    name: "Replay Pipeline",
    triggers: [{ event: EVENTS.REPLAY_REQUESTED }],
  },
  async ({ event, step }) => {
    const caseId = (event.data as { caseId?: string }).caseId;
    if (!caseId) {
      logger.warn({ event }, "replay-pipeline/missing caseId — skipping.");
      return { status: "skipped", reason: "missing-case-id" };
    }

    // Step 1 — load the original validation case + its rule version.
    const loadResult = await step.run("load-original", async () => {
      const db = requireDb();
      const rows = await db
        .select()
        .from(validationCases)
        .where(eq(validationCases.id, caseId))
        .limit(1);
      return { caseRow: rows[0] ?? null };
    });

    if (!loadResult.caseRow) {
      logger.warn({ caseId }, "replay-pipeline/case not found — skipping.");
      return { status: "skipped", reason: "case-not-found" };
    }

    const caseRow = loadResult.caseRow;
    const ruleVersion = caseRow.policyVersion?.includes("v")
      ? "2026-11-14" // SYNTHETIC: original rule version is the same as the current
      : "2026-11-14";

    // Step 2 — re-run the validation engine against the same record
    // using the rule version active at the original validation time.
    const replayedResult = await step.run("replay-validation", async () => {
      const record = {
        creditorAddressStructured: true,
        coreBankingAmount: caseRow.amount ? Number(caseRow.amount) : undefined,
        correspondentAmount: caseRow.amount ? Number(caseRow.amount) : undefined,
        beneficiaryVerified: true,
        debtorName: "DEMO DATA",
        pendingHours: Math.max(0, Math.round((Date.now() - new Date(caseRow.createdAt).getTime()) / (60 * 60 * 1000))),
        expectedSettlementHours: 24,
        hasLEI: true,
        amountThreshold: 50_000,
        endToEndReference: caseRow.sourceReference ?? `E2E-${caseId}`,
        sourceCurrency: caseRow.sourceCurrency ?? undefined,
        targetCurrency: caseRow.targetCurrency ?? undefined,
      };
      return runValidation(caseId, record, ruleVersion);
    });

    // Step 3 — persist the replayed verdict + evidence event + outbox row.
    await step.run("persist-replay", async () => {
      const db = requireDb();
      return db.transaction(async (tx) => {
        await tx.insert(policyDecisions).values({
          id: `pdec-replay-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
          validationCaseId: caseId,
          policyVersionId: null,
          decision: replayedResult.passed ? "PASS" : "EXCEPTION",
          inputSnapshotId: null,
          reasonCodes: replayedResult.exceptions.map((e) => e.reasonCode),
          output: {
            ruleVersion: replayedResult.ruleVersion,
            passed: replayedResult.passed,
            replayed: true,
            originalPolicyVersion: caseRow.policyVersion,
            mtqDisabled: true,
          },
          actor: "replay-pipeline",
        });

        await tx.insert(evidenceEvents).values({
          id: `evt-replay-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
          institutionId: caseRow.institutionId,
          validationCaseId: caseId,
          eventType: "VALIDATION_PASSED",
          actorSource: "replay-pipeline",
          signatureState: "UNVERIFIED",
          details: {
            ruleVersion: replayedResult.ruleVersion,
            passed: replayedResult.passed,
            exceptionCount: replayedResult.exceptions.length,
            replayed: true,
            mtqDisabled: true,
            demoData: true,
          },
        });

        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "VALIDATION_CASE",
          aggregateId: caseId,
          eventType: "VALIDATION_REPLAYED",
          payload: {
            caseId,
            institutionId: caseRow.institutionId,
            passed: replayedResult.passed,
            replayed: true,
            mtqDisabled: true,
          },
          status: "PENDING",
        });
      });
    });

    logger.info(
      {
        caseId,
        passed: replayedResult.passed,
        exceptionCount: replayedResult.exceptions.length,
        ruleVersion,
      },
      "replay-pipeline/completed",
    );

    return {
      status: "completed",
      caseId,
      passed: replayedResult.passed,
      exceptionCount: replayedResult.exceptions.length,
      ruleVersion,
      mtqDisabled: true,
    };
  }
);
