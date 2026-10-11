/**
 * GET / POST /api/v1/exceptions — MITHQAL-TECH-SPEC-001 §4.4.
 *
 * GET: list exceptions (newest first, ?limit cap).
 * POST: create an exception (manual escalation only — Inngest writes
 *       the majority of exceptions automatically in Phase 3).
 *
 * Truth state: WIRED. Writes are MTQ-disabled (synthetic). When the
 * Inngest `exception-router` function fires against a failing
 * instruction, the function (not this route) writes the row.
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
import { POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const createExceptionSchema = z.object({
  instructionId: z.string().min(1).max(50),
  code: z.string().min(1).max(50),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  owner: z.string().max(100).optional(),
  requiredEvidence: z.array(z.string()).optional(),
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
      .orderBy(desc(exceptions.createdAt))
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

  const db = requireDb();
  try {
    const [created] = await db
      .insert(exceptions)
      .values({
        id: crypto.randomUUID(),
        instructionId: parsed.data.instructionId,
        code: parsed.data.code,
        severity: parsed.data.severity,
        owner: parsed.data.owner ?? null,
        requiredEvidence: parsed.data.requiredEvidence ?? null,
        status: "OPEN",
      })
      .returning();

    if (!created) {
      throw new DbError("DB_TRANSACTION_FAILED", "Insert returned no rows.");
    }

    logger.info(
      { id: created.id, instructionId: parsed.data.instructionId, code: parsed.data.code },
      "exception/created (mtq-disabled, synthetic)",
    );

    return okResponse(created, 201);
  } catch (err) {
    logger.error(
      {
        instructionId: parsed.data.instructionId,
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
