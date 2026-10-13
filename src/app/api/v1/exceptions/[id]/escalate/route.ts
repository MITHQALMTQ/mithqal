/**
 * POST /api/v1/exceptions/[id]/escalate — MITHQAL MASTER BLUEPRINT §16.1.
 *
 * Escalate a case. Escalation promotes the exception's severity and
 * reassigns ownership. It does NOT initiate a payment, fire a rail, or
 * alter the underlying source-of-record.
 *
 * Per §5.2.G (Safe Halt and Recovery), escalation may precede a safe-halt
 * trigger when the root cause spans multiple cases. The escalation row is
 * an auditable record.
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

const escalateSchema = z.object({
  newSeverity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  newOwner: z.string().max(100).optional(),
  reason: z.string().min(1).max(2000),
  recommendSafeHalt: z.boolean().default(false),
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

  const parsed = escalateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const gate = evaluateMtqGate();
  const db = requireDb();
  try {
    const patch: { severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; owner?: string | null } = {};
    if (parsed.data.newSeverity) {
      patch.severity = parsed.data.newSeverity;
    }
    if (parsed.data.newOwner !== undefined) {
      patch.owner = parsed.data.newOwner ?? null;
    }

    const [updated] = await db
      .update(exceptions)
      .set(patch)
      .where(eq(exceptions.id, id))
      .returning();

    if (!updated) {
      return errorResponse(404, "NOT_FOUND", `Exception ${id} not found.`);
    }

    logger.info(
      {
        id,
        newSeverity: parsed.data.newSeverity ?? "unchanged",
        newOwner: parsed.data.newOwner ?? "unchanged",
        recommendSafeHalt: parsed.data.recommendSafeHalt,
        mtqDisabled: gate.mtqDisabled,
      },
      "exception/escalated (mtq-disabled, auditable record — no payment authorised)",
    );

    return okResponse({
      exceptionId: updated.id,
      severity: updated.severity,
      owner: updated.owner,
      status: updated.status,
      escalationReason: parsed.data.reason,
      recommendSafeHalt: parsed.data.recommendSafeHalt,
      safeHaltTriggered: false, // Escalation never auto-triggers a safe-halt.
      paymentExecuted: false,
      truthState: "DECISION",
      mtqDisabled: gate.mtqDisabled,
      productionAuthorized: gate.productionAuthorized,
      note:
        "Escalation promotes severity and reassigns ownership. No payment was " +
        "executed. If recommendSafeHalt=true, an authorised operator must " +
        "separately invoke POST /api/v1/safe-halt to halt new processing.",
    });
  } catch (err) {
    logger.error(
      { id, err: err instanceof Error ? err.message : String(err) },
      "exception/escalate failed",
    );
    return dbErrorResponse(
      new DbError(
        "DB_TRANSACTION_FAILED",
        err instanceof Error ? err.message : "Unknown transaction failure",
      ),
    );
  }
}
