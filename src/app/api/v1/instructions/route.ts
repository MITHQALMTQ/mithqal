/**
 * POST /api/v1/instructions — MITHQAL-TECH-SPEC-001 §4.2.1.
 *
 * Submit instruction. Steps:
 *   1. Authenticate (mTLS + API key) — pilot: permissive
 *   2. Validate request body against the Zod schema
 *   3. Check X-Idempotency-Key header
 *   4. Drizzle transaction: insert instruction + outbox in one tx
 *   5. Send Inngest event AFTER the transaction commits
 *   6. Return { instructionId, status, policyVersion, finalityState, createdAt }
 *
 * Truth state: WIRED, MTQ-DISABLED. When DATABASE_URL is unset, the
 * route returns 500 DB_NOT_PROVISIONED. When the DB is provisioned but
 * tables are not migrated, the route returns the Drizzle error. When
 * the MTQ gate holds (future), the route's finalityState is upgraded
 * from F0 to the post-policy state — today it stays at F0 because all
 * writes are MTQ-disabled (mtq-gate.ts).
 *
 * Idempotency: the X-Idempotency-Key header MUST be set. The route
 * uses it as part of the outbox event payload so duplicate submits
 * (retry storms) collapse server-side — Phase 3 wiring will add a
 * `idempotency_keys` table for hard dedup.
 */

import { desc } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireDb } from "@/db";
import { instructions, outbox } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";
import { evaluateMtqGate, POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const submitInstructionSchema = z.object({
  instructionId: z.string().min(1).max(50),
  institutionId: z.string().min(1).max(50),
  corridor: z.string().min(1).max(50),
  sourceCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  amount: z.number().positive(),
  debtor: z.object({
    name: z.string().min(1).max(255),
    account: z.string().min(1).max(50),
  }),
  creditor: z.object({
    name: z.string().min(1).max(255),
    account: z.string().min(1).max(50),
  }),
  purpose: z.string().min(1).max(50),
  requestedExecutionDate: z.string(),
});

type SubmitInstructionInput = z.infer<typeof submitInstructionSchema>;

export async function POST(request: NextRequest) {
  // ────────────────────────────────────────────────────────────────
  // 1. Authenticate (mTLS + API key) — pilot: permissive.
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

  const parsed = submitInstructionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const data: SubmitInstructionInput = parsed.data;

  // ────────────────────────────────────────────────────────────────
  // 3. Idempotency key.
  // ────────────────────────────────────────────────────────────────
  const idempotencyKey = request.headers.get("X-Idempotency-Key");
  if (!idempotencyKey) {
    return errorResponse(
      400,
      "MISSING_IDEMPOTENCY_KEY",
      "X-Idempotency-Key header is required for write endpoints.",
    );
  }

  // ────────────────────────────────────────────────────────────────
  // MTQ gate — every write is synthetic in pilot. We still persist
  // the row for auditability; the gate just blocks downstream rails.
  // ────────────────────────────────────────────────────────────────
  const gate = evaluateMtqGate();

  // ────────────────────────────────────────────────────────────────
  // 4. Drizzle transaction: instruction + outbox in one tx.
  // ────────────────────────────────────────────────────────────────
  const db = requireDb();

  let result: { id: string; status: string; policyVersion: string; createdAt: Date };
  try {
    result = await db.transaction(async (tx) => {
      const [instruction] = await tx
        .insert(instructions)
        .values({
          id: data.instructionId,
          institutionId: data.institutionId,
          corridor: data.corridor,
          sourceCurrency: data.sourceCurrency,
          targetCurrency: data.targetCurrency,
          amount: data.amount.toString(),
          debtorName: data.debtor.name,
          creditorName: data.creditor.name,
          purpose: data.purpose,
          status: "RECEIVED",
          policyVersion: POLICY_VERSION,
        })
        .returning({
          id: instructions.id,
          status: instructions.status,
          policyVersion: instructions.policyVersion,
          createdAt: instructions.createdAt,
        });

      if (!instruction) {
        throw new DbError("DB_TRANSACTION_FAILED", "Insert returned no rows.");
      }

      await tx.insert(outbox).values({
        id: crypto.randomUUID(),
        aggregateType: "INSTRUCTION",
        aggregateId: data.instructionId,
        eventType: "INSTRUCTION_RECEIVED",
        payload: {
          instructionId: data.instructionId,
          idempotencyKey,
          mtqDisabled: gate.mtqDisabled,
          policyVersion: POLICY_VERSION,
        },
        status: "PENDING",
      });

      return instruction;
    });
  } catch (err) {
    logger.error(
      {
        instructionId: data.instructionId,
        err: err instanceof Error ? err.message : String(err),
      },
      "instruction/submit transaction failed",
    );
    if (err instanceof DbError) {
      return dbErrorResponse(err);
    }
    // Drizzle / Neon errors are wrapped Error instances — surface them
    // as DB_TRANSACTION_FAILED so the envelope stays stable.
    return dbErrorResponse(
      new DbError(
        "DB_TRANSACTION_FAILED",
        err instanceof Error ? err.message : "Unknown transaction failure",
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Send Inngest event AFTER the transaction commits.
  // ────────────────────────────────────────────────────────────────
  try {
    await inngest.send({
      name: "instruction/received",
      data: {
        instructionId: result.id,
        idempotencyKey,
        mtqDisabled: gate.mtqDisabled,
      },
    });
  } catch (err) {
    // Inngest failures must NOT roll back the committed transaction.
    // The outbox row remains PENDING and is drained by the outbox
    // sweeper (Phase 3). Log and continue.
    logger.warn(
      {
        instructionId: result.id,
        err: err instanceof Error ? err.message : String(err),
      },
      "inngest send failed — outbox will retry",
    );
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Return response.
  // ────────────────────────────────────────────────────────────────
  return okResponse({
    instructionId: result.id,
    status: result.status,
    policyVersion: result.policyVersion,
    finalityState: "F0",
    createdAt: result.createdAt.toISOString(),
    mtqDisabled: gate.mtqDisabled,
    productionAuthorized: gate.productionAuthorized,
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/v1/instructions — list instructions.
// ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  // Parse optional ?limit= query.
  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50;

  const db = requireDb();
  try {
    const rows = await db
      .select()
      .from(instructions)
      .orderBy(desc(instructions.createdAt))
      .limit(safeLimit);

    return okResponse(rows);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "instruction/list query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
