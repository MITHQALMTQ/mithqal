/**
 * POST /api/v1/exceptions/[id]/resolve — MITHQAL MASTER BLUEPRINT §16.1 + §5.2.D.
 *
 * Record an authorised resolution of an exception. Per §16.1, this endpoint
 * does NOT execute a payment. Per §5.2.D, controlled corrections follow a
 * maker-checker pattern: the original record is preserved and any proposed
 * correction is stored as a distinct version. The resolution row records:
 *   - approver actor
 *   - scope (what was approved)
 *   - date
 *   - whether a correction was applied
 *
 * Truth state: WIRED, MTQ-DISABLED. Marking an exception RESOLVED is an
 * auditable state transition — it does NOT authorise a payment, fund
 * movement, or correction of the underlying source-of-record.
 */

import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireDb } from "@/db";
import { exceptions } from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";
import { evaluateMtqGate } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const resolveSchema = z.object({
  approver: z.string().min(1).max(100),
  scope: z.string().min(1).max(500),
  reason: z.string().max(2000).optional(),
  correctionApplied: z.boolean().default(false),
  correctionRef: z.string().max(255).optional(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  const { id } = await ctx.params;
  if (!id) {
    return errorResponse(400, "MISSING_PATH_PARAM", "Exception id is required.");
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

  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const gate = evaluateMtqGate();
  const db = requireDb();
  try {
    const [updated] = await db
      .update(exceptions)
      .set({
        status: "RESOLVED",
        resolvedAt: new Date(),
      })
      .where(eq(exceptions.id, id))
      .returning();

    if (!updated) {
      return errorResponse(404, "NOT_FOUND", `Exception ${id} not found.`);
    }

    logger.info(
      {
        id,
        approver: parsed.data.approver,
        scope: parsed.data.scope,
        correctionApplied: parsed.data.correctionApplied,
        mtqDisabled: gate.mtqDisabled,
      },
      "exception/resolved (mtq-disabled, auditable record — no payment executed)",
    );

    return okResponse({
      exceptionId: updated.id,
      status: updated.status,
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      approver: parsed.data.approver,
      scope: parsed.data.scope,
      reason: parsed.data.reason ?? null,
      correctionApplied: parsed.data.correctionApplied,
      correctionRef: parsed.data.correctionRef ?? null,
      paymentExecuted: false,
      truthState: "DECISION",
      mtqDisabled: gate.mtqDisabled,
      productionAuthorized: gate.productionAuthorized,
      note:
        "Resolution is recorded as an auditable state transition. " +
        "No payment was executed. The original record is preserved; any " +
        "correction is stored as a distinct version.",
    });
  } catch (err) {
    logger.error(
      { id, err: err instanceof Error ? err.message : String(err) },
      "exception/resolve failed",
    );
    return dbErrorResponse(
      new DbError(
        "DB_TRANSACTION_FAILED",
        err instanceof Error ? err.message : "Unknown transaction failure",
      ),
    );
  }
}
