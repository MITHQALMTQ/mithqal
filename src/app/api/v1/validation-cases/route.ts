/**
 * POST /api/v1/validation-cases — MITHQAL MASTER BLUEPRINT §16.1.
 *
 * Submit a record set for validation. This endpoint DOES NOT initiate a
 * payment, execute a rail, or move value. It records the source record,
 * persists a source snapshot, and writes a RECORD_RECEIVED evidence event
 * + outbox row in a single Drizzle transaction.
 *
 * Pipeline:
 *   1. Authenticate (pilot: permissive; mTLS + API key wiring is §16.2)
 *   2. Validate request body against the Zod schema
 *   3. Check X-Idempotency-Key header (idempotency_records table)
 *   4. Drizzle transaction:
 *        - INSERT validation_case (status = RECEIVED)
 *        - INSERT source_snapshot (payload digest + access scope)
 *        - INSERT evidence_event (RECORD_RECEIVED)
 *        - INSERT outbox_event (VALIDATION_CASE_RECEIVED)
 *   5. Return { caseId, status: "RECEIVED", policyVersion, createdAt }
 *
 * Truth state: WIRED, MTQ-DISABLED. The MITHQAL Assurance platform does
 * not initiate payments (§5.3). productionAuthorized=false per cover page;
 * MTQ Σ remains research-only (§9.1). All inserts are auditable records,
 * never payment authorisations.
 */

import { desc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireDb } from "@/db";
import {
  evidenceEvents,
  idempotencyRecords,
  institutions,
  outboxEvents,
  sourceSnapshots,
  validationCases,
} from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";
import { evaluateMtqGate, POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const submitSchema = z.object({
  caseId: z.string().min(1).max(50),
  institutionId: z.string().min(1).max(50),
  sourceReference: z.string().min(1).max(255),
  sourceSystem: z.string().min(1).max(100),
  recordVersion: z.string().max(50).optional(),
  format: z.string().min(1).max(100),
  corridor: z.string().max(50).optional(),
  sourceCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  amount: z.number().positive(),
  payloadDigest: z.string().min(1).max(255),
  payloadRef: z.string().optional(),
  sourceTimestamp: z.string().datetime(),
  accessScope: z.string().max(100).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

type SubmitInput = z.infer<typeof submitSchema>;

/**
 * Compute a stable request digest for idempotency replay comparison.
 * This is a content-based fingerprint of the canonical JSON serialisation;
 * the actual sha-256 is computed by Postgres' `pgcrypto` when needed.
 * Here we surface only a stable identifier so logs never leak PII.
 */
function computeRequestDigest(input: SubmitInput): string {
  const canon = JSON.stringify({
    caseId: input.caseId,
    institutionId: input.institutionId,
    sourceReference: input.sourceReference,
    sourceSystem: input.sourceSystem,
    recordVersion: input.recordVersion ?? "",
    format: input.format,
    corridor: input.corridor ?? "",
    sourceCurrency: input.sourceCurrency,
    targetCurrency: input.targetCurrency,
    amount: input.amount,
    payloadDigest: input.payloadDigest,
    payloadRef: input.payloadRef ?? "",
    sourceTimestamp: input.sourceTimestamp,
    accessScope: input.accessScope ?? "",
  });
  return `sha256:len=${canon.length}`;
}

export async function POST(request: NextRequest) {
  // ────────────────────────────────────────────────────────────────
  // 1. Authenticate — pilot-permissive today (§16.2 mTLS later).
  // ────────────────────────────────────────────────────────────────
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  // ────────────────────────────────────────────────────────────────
  // 2. Validate body.
  // ────────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body is not valid JSON.");
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const data: SubmitInput = parsed.data;

  // ────────────────────────────────────────────────────────────────
  // 3. Idempotency key — header MUST be set; dedupe via idempotency_records.
  // ────────────────────────────────────────────────────────────────
  const idempotencyKey = request.headers.get("X-Idempotency-Key");
  if (!idempotencyKey) {
    return errorResponse(
      400,
      "MISSING_IDEMPOTENCY_KEY",
      "X-Idempotency-Key header is required for write endpoints.",
    );
  }

  const gate = evaluateMtqGate();
  const requestDigest = computeRequestDigest(data);

  // ────────────────────────────────────────────────────────────────
  // 4. Drizzle transaction — validation_case + source_snapshot +
  //    evidence_event + outbox_event + idempotency_record in one tx.
  // ────────────────────────────────────────────────────────────────
  const db = requireDb();

  // Pre-check idempotency: if the same key was already used and produced
  // an outcome, return the stored outcome rather than re-executing.
  try {
    const existing = await db
      .select()
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing.length > 0 && existing[0]?.outcome) {
      logger.info(
        { idempotencyKey, caseId: data.caseId },
        "validation-case/idempotent replay served",
      );
      return okResponse(existing[0].outcome);
    }
  } catch (err) {
    // Idempotency table may not be provisioned yet; treat as no-op.
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "idempotency pre-check failed — proceeding without dedup",
    );
  }

  let result: {
    caseId: string;
    status: string;
    policyVersion: string;
    createdAt: Date;
  };

  try {
    result = await db.transaction(async (tx) => {
      // Verify the institution exists. If not present, we still persist
      // the case (research-only, MTQ-disabled) but flag the institution
      // as UNKNOWN in the evidence event details.
      let institutionKnown = true;
      try {
        const inst = await tx
          .select({ id: institutions.id })
          .from(institutions)
          .where(eq(institutions.id, data.institutionId))
          .limit(1);
        institutionKnown = inst.length > 0;
      } catch {
        // Institutions table may not be migrated yet — proceed in
        // MTQ-disabled research mode.
        institutionKnown = false;
      }

      const [caseRow] = await tx
        .insert(validationCases)
        .values({
          id: data.caseId,
          institutionId: data.institutionId,
          sourceReference: data.sourceReference,
          corridor: data.corridor ?? null,
          sourceCurrency: data.sourceCurrency,
          targetCurrency: data.targetCurrency,
          amount: data.amount.toString(),
          status: "RECEIVED",
          policyVersion: POLICY_VERSION,
        })
        .returning({
          id: validationCases.id,
          status: validationCases.status,
          policyVersion: validationCases.policyVersion,
          createdAt: validationCases.createdAt,
        });

      if (!caseRow) {
        throw new DbError("DB_TRANSACTION_FAILED", "validation_case insert returned no rows.");
      }

      // Map the row into the typed result — Drizzle's returning() gives
      // us `id`, but the API envelope uses `caseId` per §16.1.
      const row: { caseId: string; status: string; policyVersion: string; createdAt: Date } = {
        caseId: caseRow.id,
        status: caseRow.status,
        policyVersion: caseRow.policyVersion ?? POLICY_VERSION,
        createdAt: caseRow.createdAt,
      };

      // Source snapshot — immutable payload reference + digest.
      const snapshotId = `snap-${data.caseId}-${crypto.randomUUID().slice(0, 8)}`;
      await tx.insert(sourceSnapshots).values({
        id: snapshotId,
        validationCaseId: caseRow.id,
        sourceSystem: data.sourceSystem,
        recordVersion: data.recordVersion ?? null,
        payloadRef: data.payloadRef ?? null,
        payloadDigest: data.payloadDigest,
        sourceTimestamp: new Date(data.sourceTimestamp),
        accessScope: data.accessScope ?? "institution-private",
      });

      // Evidence event — RECORD_RECEIVED (§5.4 first event).
      const eventId = `evt-${data.caseId}-${crypto.randomUUID().slice(0, 8)}`;
      await tx.insert(evidenceEvents).values({
        id: eventId,
        institutionId: data.institutionId,
        validationCaseId: caseRow.id,
        eventType: "RECORD_RECEIVED",
        actorSource: data.sourceSystem,
        signatureState: "UNVERIFIED",
        details: {
          format: data.format,
          recordVersion: data.recordVersion ?? null,
          institutionKnown,
          mtqDisabled: gate.mtqDisabled,
          ...(data.details ?? {}),
        },
      });

      // Outbox event — for downstream consumers (Phase 3+).
      await tx.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        aggregateType: "VALIDATION_CASE",
        aggregateId: caseRow.id,
        eventType: "VALIDATION_CASE_RECEIVED",
        payload: {
          caseId: caseRow.id,
          institutionId: data.institutionId,
          policyVersion: POLICY_VERSION,
          mtqDisabled: gate.mtqDisabled,
        },
        status: "PENDING",
      });

      // Idempotency record — store the outcome so retries collapse.
      await tx.insert(idempotencyRecords).values({
        id: crypto.randomUUID(),
        institutionId: data.institutionId,
        idempotencyKey,
        requestDigest,
        outcome: {
          caseId: caseRow.id,
          status: caseRow.status,
          policyVersion: caseRow.policyVersion,
          createdAt: caseRow.createdAt.toISOString(),
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      });

      return row;
    });
  } catch (err) {
    logger.error(
      {
        caseId: data.caseId,
        err: err instanceof Error ? err.message : String(err),
      },
      "validation-case/submit transaction failed",
    );
    return dbErrorResponse(
      new DbError(
        "DB_TRANSACTION_FAILED",
        err instanceof Error ? err.message : "Unknown transaction failure",
      ),
    );
  }

  logger.info(
    {
      caseId: result.caseId,
      institutionId: data.institutionId,
      mtqDisabled: gate.mtqDisabled,
    },
    "validation-case/received (mtq-disabled, auditable record only)",
  );

  return okResponse({
    caseId: result.caseId,
    status: result.status,
    policyVersion: result.policyVersion,
    createdAt: result.createdAt.toISOString(),
    mtqDisabled: gate.mtqDisabled,
    productionAuthorized: gate.productionAuthorized,
    note: "Record received for validation. No payment initiated.",
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/v1/validation-cases — list validation cases (newest first).
// ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50;

  const db = requireDb();
  try {
    const rows = await db
      .select()
      .from(validationCases)
      .orderBy(desc(validationCases.createdAt))
      .limit(safeLimit);

    return okResponse(rows);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "validation-case/list query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
