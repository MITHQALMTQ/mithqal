/**
 * MITHQAL — Reconciliation pipeline (Phase 3 Inngest function).
 *
 * Triggered on `reconciliation.needed`. Reads the affected
 * validation case + its source snapshots, compares the values
 * across source systems, applies the tolerance policy (per
 * `src/lib/reconciliation-tolerance-policies.ts`), and produces:
 *   - a `reconciliation_cases` row with the discrepancy class +
 *     tolerance result
 *   - an `exceptions` row when the discrepancy is out-of-tolerance
 *   - an `outbox_events` row for the dashboard projection
 *
 * Truth state: WIRED, MTQ-DISABLED. Reconciliation produces
 * auditable records; it does NOT execute a payment or initiate a
 * correction. productionAuthorized=false; MTQ Σ remains NOT
 * AUTHORIZED.
 */

import { eq } from "drizzle-orm";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { exceptions, outboxEvents, reconciliationCases, sourceSnapshots, validationCases } from "@/db/schema";
import { logger } from "@/lib/logger";
import {
  getTolerancePolicy,
  type TolerancePolicyId,
} from "@/lib/reconciliation-tolerance-policies";

type DiscrepancyClass = "NO_DISCREPANCY" | "AMOUNT" | "TIMING" | "REFERENCE" | "UNKNOWN";

interface ClassificationResult {
  discrepancyClass: DiscrepancyClass;
  tolerancePolicy: TolerancePolicyId;
  toleranceLimit: string;
  inTolerance: boolean;
  expectedValue: string;
  actualValue: string;
}

function classify(input: {
  expected: string;
  actual: string;
  sourceCount: number;
}): ClassificationResult {
  const expected = input.expected;
  const actual = input.actual;
  const same = expected === actual;
  const discrepancyClass: DiscrepancyClass = same
    ? "NO_DISCREPANCY"
    : input.sourceCount > 1
      ? "AMOUNT"
      : "UNKNOWN";
  // SYNTHETIC tolerance policy: pilot uses LEDGER_TO_LEDGER for amount
  // reconciliation. A bank design partner (G2 gate) will replace this
  // with the per-institution policy.
  const policyId: TolerancePolicyId = "LEDGER_TO_LEDGER";
  const policy = getTolerancePolicy(policyId);
  return {
    discrepancyClass,
    tolerancePolicy: policyId,
    toleranceLimit: policy?.toleranceBps?.toString() ?? "1",
    inTolerance: same,
    expectedValue: expected,
    actualValue: actual,
  };
}

export const reconciliationPipeline = inngest.createFunction(
  {
    id: "reconciliation-pipeline",
    name: "Reconciliation Pipeline",
    triggers: [{ event: EVENTS.RECONCILIATION_NEEDED }],
  },
  async ({ event, step }) => {
    const caseId = (event.data as { caseId?: string }).caseId;
    const institutionId = (event.data as { institutionId?: string }).institutionId;
    if (!caseId || !institutionId) {
      logger.warn({ event }, "reconciliation-pipeline/missing caseId or institutionId — skipping.");
      return { status: "skipped", reason: "missing-params" };
    }

    // Step 1 — load the validation case + its source snapshots.
    const loadResult = await step.run("load-case", async () => {
      const db = requireDb();
      const caseRows = await db
        .select()
        .from(validationCases)
        .where(eq(validationCases.id, caseId))
        .limit(1);
      const snapshots = await db
        .select()
        .from(sourceSnapshots)
        .where(eq(sourceSnapshots.validationCaseId, caseId));
      return { caseRow: caseRows[0] ?? null, snapshots };
    });

    if (!loadResult.caseRow) {
      logger.warn({ caseId }, "reconciliation-pipeline/case not found — skipping.");
      return { status: "skipped", reason: "case-not-found" };
    }

    const caseRow = loadResult.caseRow;
    const snapshots = loadResult.snapshots;

    // Step 2 — classify the discrepancy + apply the tolerance policy.
    const classification = await step.run("classify-discrepancy", async () => {
      // SYNTHETIC: when a bank design partner is admitted (G2 gate),
      // this loads the real source-system values from the
      // source_snapshots.payload_ref. For the pilot, we synthesise a
      // single-source scenario and classify as NO_DISCREPANCY.
      const expectedValue = caseRow.amount?.toString() ?? "0";
      const actualValue = caseRow.amount?.toString() ?? "0";
      return classify({
        expected: expectedValue,
        actual: actualValue,
        sourceCount: snapshots.length,
      });
    });

    // Step 3 — persist the reconciliation case + optional exception + outbox.
    await step.run("persist-reconciliation", async () => {
      const db = requireDb();
      return db.transaction(async (tx) => {
        const reconciliationId = `recon-${caseId}-${crypto.randomUUID().slice(0, 8)}`;
        await tx.insert(reconciliationCases).values({
          id: reconciliationId,
          validationCaseId: caseId,
          sources: snapshots.map((s) => ({ system: s.sourceSystem, digest: s.payloadDigest })),
          expectedValue: classification.expectedValue,
          actualValue: classification.actualValue,
          discrepancyClass: classification.discrepancyClass,
          tolerancePolicy: classification.tolerancePolicy,
          resolution: classification.inTolerance ? "WITHIN_TOLERANCE" : null,
          status: classification.inTolerance ? "CLOSED" : "OPEN",
        });

        if (!classification.inTolerance) {
          await tx.insert(exceptions).values({
            id: `ex-recon-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
            validationCaseId: caseId,
            code: "RECONCILIATION_DRIFT",
            severity: "HIGH",
            owner: null,
            requiredEvidence: [],
            reasonCode: "RECONCILIATION_OUT_OF_TOLERANCE",
            recommendedAction: "Investigate the source-data conflict; reconcile both systems.",
            status: "OPEN",
          });
        }

        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "RECONCILIATION_CASE",
          aggregateId: reconciliationId,
          eventType: "RECONCILIATION_COMPLETED",
          payload: {
            caseId,
            institutionId,
            discrepancyClass: classification.discrepancyClass,
            inTolerance: classification.inTolerance,
            mtqDisabled: true,
          },
          status: "PENDING",
        });
      });
    });

    logger.info(
      {
        caseId,
        discrepancyClass: classification.discrepancyClass,
        inTolerance: classification.inTolerance,
      },
      "reconciliation-pipeline/completed",
    );

    return {
      status: "completed",
      caseId,
      discrepancyClass: classification.discrepancyClass,
      inTolerance: classification.inTolerance,
      mtqDisabled: true,
    };
  }
);
