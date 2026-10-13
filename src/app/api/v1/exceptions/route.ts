/**
 * GET / POST /api/v1/exceptions — MITHQAL MASTER BLUEPRINT §16.1 + §5.2.C.
 *
 * GET:  list permitted exceptions (newest first, ?limit cap).
 * POST: record an exception (manual escalation only — the Inngest
 *       exception-router writes the majority of exceptions automatically
 *       in Phase 3+). The exception is an auditable record; it does NOT
 *       authorise a payment or correction.
 *
 * Truth state: WIRED. Writes are MTQ-disabled (synthetic, auditable).
 * Per §5.2.C, recommendations must be distinguishable from automated
 * corrections — every row records its `reason_code` and `recommended_action`
 * as suggestions requiring human approval.
 *
 * Field changes vs the legacy schema (§16.3 Table 5):
 *   instructionId → validationCaseId
 *   createdAt      → openedAt
 *   closedAt       → resolvedAt
 *   + reasonCode, recommendedAction (new)
 */

import { desc } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireDb } from "@/db";
import { exceptions } from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";
import { evaluateMtqGate, POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const createExceptionSchema = z.object({
  validationCaseId: z.string().min(1).max(50),
  code: z.string().min(1).max(50),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  owner: z.string().max(100).optional(),
  requiredEvidence: z.array(z.string()).optional(),
  reasonCode: z.string().max(50).optional(),
  recommendedAction: z.string().max(2000).optional(),
});

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
      .from(exceptions)
      .orderBy(desc(exceptions.openedAt))
      .limit(safeLimit);

    return okResponse(rows);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "exception/list query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  const idempotencyKey = request.headers.get("X-Idempotency-Key");
  if (!idempotencyKey) {
    return errorResponse(
      400,
      "MISSING_IDEMPOTENCY_KEY",
      "X-Idempotency-Key header is required for write endpoints.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body is not valid JSON.");
  }

  const parsed = createExceptionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const gate = evaluateMtqGate();
  const db = requireDb();
  try {
    const [created] = await db
      .insert(exceptions)
      .values({
        id: crypto.randomUUID(),
        validationCaseId: parsed.data.validationCaseId,
        code: parsed.data.code,
        severity: parsed.data.severity,
        owner: parsed.data.owner ?? null,
        requiredEvidence: parsed.data.requiredEvidence ?? null,
        reasonCode: parsed.data.reasonCode ?? null,
        recommendedAction: parsed.data.recommendedAction ?? null,
        status: "OPEN",
      })
      .returning();

    if (!created) {
      throw new DbError("DB_TRANSACTION_FAILED", "Insert returned no rows.");
    }

    logger.info(
      {
        id: created.id,
        validationCaseId: parsed.data.validationCaseId,
        code: parsed.data.code,
        mtqDisabled: gate.mtqDisabled,
      },
      "exception/created (mtq-disabled, auditable record — no payment authorised)",
    );

    return okResponse(created, 201);
  } catch (err) {
    logger.error(
      {
        validationCaseId: parsed.data.validationCaseId,
        err: err instanceof Error ? err.message : String(err),
      },
      "exception/create failed",
    );
    return dbErrorResponse(
      new DbError(
        "DB_TRANSACTION_FAILED",
        err instanceof Error ? err.message : "Unknown transaction failure",
      ),
    );
  }
}

// Side-export POLICY_VERSION so test mocks can read it without dynamic import.
void POLICY_VERSION;
