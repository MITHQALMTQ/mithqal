/**
 * MITHQAL — Validation pipeline (Phase 3 Inngest function).
 *
 * Triggered on `validation.case.received`. Runs the canonical
 * validation engine (`src/lib/validation-engine.ts`) against the
 * submitted record set and produces:
 *   - a `policy_decisions` row (the engine's verdict)
 *   - one `exceptions` row per failed rule
 *   - one `evidence_events` row per validation result (VALIDATION_PASSED
 *     or EXCEPTION_OPENED)
 *   - one `outbox_events` row for downstream consumers (Turso
 *     projection, evidence bundle, reconciliation if needed)
 *
 * Truth state: WIRED, MTQ-DISABLED. The validation produces auditable
 * records; it does NOT initiate a payment or execute a rail.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 */

import { eq } from "drizzle-orm";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { evidenceEvents, exceptions, outboxEvents, policyDecisions, sourceSnapshots, validationCases } from "@/db/schema";
import { logger } from "@/lib/logger";
import { POLICY_VERSION } from "@/lib/mtq-gate";
import { runValidation } from "@/lib/validation-engine";

export const validationPipeline = inngest.createFunction(
  {
    id: "validation-pipeline",
    name: "Validation Pipeline",
    triggers: [{ event: EVENTS.VALIDATION_CASE_RECEIVED }],
  },
  async ({ event, step }) => {
    const caseId = (event.data as { caseId?: string }).caseId;
    if (!caseId) {
      logger.warn({ event }, "validation-pipeline/missing caseId — skipping.");
      return { status: "skipped", reason: "missing-case-id" };
    }

    // Step 1 — load the validation case + its source snapshots.
    const loadResult = await step.run("load-case", async () => {
      const db = requireDb();
      const rows = await db
        .select()
        .from(validationCases)
        .where(eq(validationCases.id, caseId))
        .limit(1);
      const caseRow = rows[0];
      if (!caseRow) {
        return { caseRow: null, snapshots: [] };
      }
      const snapshots = await db
        .select()
        .from(sourceSnapshots)
        .where(eq(sourceSnapshots.validationCaseId, caseId));
      return { caseRow, snapshots };
    });

    if (!loadResult.caseRow) {
      logger.warn({ caseId }, "validation-pipeline/case not found — skipping.");
      return { status: "skipped", reason: "case-not-found" };
    }

    const caseRow = loadResult.caseRow;

    // Step 2 — run the validation engine against the case record.
    const validationResult = await step.run("run-validation", async () => {
      // SYNTHETIC record construction for the Pilot A demonstrator.
      // Per §5.5: "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE".
      // The real record is loaded from the source_snapshots.payload_ref
      // when a bank design partner is admitted (G2 gate).
      const record = {
        creditorAddressStructured: true,
        coreBankingAmount: caseRow.amount ? Number(caseRow.amount) : undefined,
        correspondentAmount: caseRow.amount ? Number(caseRow.amount) : undefined,
        beneficiaryVerified: true,
        debtorName: "DEMO DATA",
        pendingHours: 0,
        expectedSettlementHours: 24,
        hasLEI: true,
        amountThreshold: 50_000,
        endToEndReference: caseRow.sourceReference ?? `E2E-${caseId}`,
        sourceCurrency: caseRow.sourceCurrency ?? undefined,
        targetCurrency: caseRow.targetCurrency ?? undefined,
      };
      return runValidation(caseId, record, "2026-11-14");
    });

    // Step 3 — persist the policy decision + exceptions + evidence events
    // + outbox event in a single Drizzle transaction.
    await step.run("persist-results", async () => {
      const db = requireDb();
      return db.transaction(async (tx) => {
        // Policy decision row.
        await tx.insert(policyDecisions).values({
          id: `pdec-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
          validationCaseId: caseId,
          policyVersionId: null,
          decision: validationResult.passed ? "PASS" : "EXCEPTION",
          inputSnapshotId: loadResult.snapshots[0]?.id ?? null,
          reasonCodes: validationResult.exceptions.map((e) => e.reasonCode),
          output: {
            ruleVersion: validationResult.ruleVersion,
            passed: validationResult.passed,
            exceptionCount: validationResult.exceptions.length,
          },
          actor: "validation-pipeline",
        });

        // One exception row per failed rule.
        for (const ex of validationResult.exceptions) {
          await tx.insert(exceptions).values({
            id: `ex-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
            validationCaseId: caseId,
            code: ex.code,
            severity: ex.severity,
            owner: null,
            requiredEvidence: [],
            reasonCode: ex.reasonCode,
            recommendedAction: ex.recommendedAction,
            status: "OPEN",
          });
        }

        // Evidence event row recording the validation outcome.
        await tx.insert(evidenceEvents).values({
          id: `evt-${caseId}-${crypto.randomUUID().slice(0, 8)}`,
          institutionId: caseRow.institutionId,
          validationCaseId: caseId,
          eventType: validationResult.passed ? "VALIDATION_PASSED" : "EXCEPTION_OPENED",
          actorSource: "validation-pipeline",
          signatureState: "UNVERIFIED",
          details: {
            ruleVersion: validationResult.ruleVersion,
            passed: validationResult.passed,
            exceptionCount: validationResult.exceptions.length,
            mtqDisabled: true,
            demoData: true,
          },
        });

        // Outbox event for downstream consumers.
        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "VALIDATION_CASE",
          aggregateId: caseId,
          eventType: validationResult.passed ? "VALIDATION_COMPLETED" : "EXCEPTION_OPENED",
          payload: {
            caseId,
            institutionId: caseRow.institutionId,
            passed: validationResult.passed,
            policyVersion: POLICY_VERSION,
            mtqDisabled: true,
          },
          status: "PENDING",
        });
      });
    });

    // Step 4 — emit downstream events for the Turso projection + reconciliation.
    if (validationResult.exceptions.some((e) => e.severity === "HIGH")) {
      await inngest.send({
        name: EVENTS.RECONCILIATION_NEEDED,
        data: { caseId, institutionId: caseRow.institutionId },
      });
    }
    await inngest.send({
      name: EVENTS.TURSO_PROJECTION_NEEDED,
      data: { caseId, institutionId: caseRow.institutionId },
    });

    logger.info(
      {
        caseId,
        passed: validationResult.passed,
        exceptionCount: validationResult.exceptions.length,
      },
      "validation-pipeline/completed",
    );

    return {
      status: "completed",
      caseId,
      passed: validationResult.passed,
      exceptionCount: validationResult.exceptions.length,
      policyVersion: POLICY_VERSION,
      mtqDisabled: true,
    };
  }
);
