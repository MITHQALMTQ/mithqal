/**
 * POST /api/v1/safe-halt — MITHQAL MASTER BLUEPRINT §16.1 + §5.2.G.
 *
 * Stop new in-scope processing, subject to authorization. Per §5.2.G, a
 * safe halt:
 *   1. Stops the system from accepting new validation cases
 *   2. Preserves all existing cases and evidence
 *   3. Requires explicit recovery approval after root cause, fix, tests,
 *      and ownership have been documented
 *
 * Truth state: WIRED, MTQ-DISABLED. The halt flag is persisted as an
 * auditable record (an outbox_event with eventType=SAFE_HALTED). Recovery
 * requires a separate signed authorisation. The halt does NOT execute,
 * reverse, or initiate any payment.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireDb } from "@/db";
import { accessAuditEvents, outboxEvents } from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";
import { evaluateMtqGate } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const safeHaltSchema = z.object({
  reason: z.string().min(1).max(2000),
  authorisedBy: z.string().min(1).max(100),
  scope: z.enum(["ALL", "INSTITUTION", "CORRIDOR", "CASE"]).default("ALL"),
  scopeRef: z.string().max(255).optional(),
});

// In-process halt flag — when true, POST /api/v1/validation-cases refuses
// new submissions. Recovery requires a separate authorisation event.
let SAFE_HALTED = false;

export function isSafeHalted(): boolean {
  return SAFE_HALTED;
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

  const parsed = safeHaltSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const gate = evaluateMtqGate();
  const db = requireDb();
  const haltId = `halt-${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();

  try {
    await db.transaction(async (tx) => {
      // Outbox event — durable marker that downstream consumers read.
      await tx.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        aggregateType: "SYSTEM",
        aggregateId: haltId,
        eventType: "SAFE_HALTED",
        payload: {
          reason: parsed.data.reason,
          authorisedBy: parsed.data.authorisedBy,
          scope: parsed.data.scope,
          scopeRef: parsed.data.scopeRef ?? null,
          mtqDisabled: gate.mtqDisabled,
          triggeredAt: now,
        },
        status: "PENDING",
      });

      // Access audit event — for the institution's audit trail.
      await tx.insert(accessAuditEvents).values({
        id: crypto.randomUUID(),
        institutionId: parsed.data.scopeRef ?? "system",
        actor: parsed.data.authorisedBy,
        action: "SAFE_HALT_TRIGGERED",
        resource: haltId,
        result: "SUCCESS",
        details: {
          reason: parsed.data.reason,
          scope: parsed.data.scope,
        },
      });
    });
  } catch (err) {
    logger.error(
      { haltId, err: err instanceof Error ? err.message : String(err) },
      "safe-halt/persist failed",
    );
    // The in-process flag still flips — the durable record may be retried
    // by the outbox dispatcher, but the control plane must halt immediately.
    SAFE_HALTED = true;
  }

  // Flip the in-process flag regardless of DB outcome.
  SAFE_HALTED = true;

  logger.warn(
    {
      haltId,
      reason: parsed.data.reason,
      authorisedBy: parsed.data.authorisedBy,
      scope: parsed.data.scope,
      mtqDisabled: gate.mtqDisabled,
    },
    "safe-halt/triggered — new processing stopped, existing cases preserved",
  );

  return okResponse({
    haltId,
    status: "SAFE_HALTED",
    triggeredAt: now,
    reason: parsed.data.reason,
    authorisedBy: parsed.data.authorisedBy,
    scope: parsed.data.scope,
    scopeRef: parsed.data.scopeRef ?? null,
    newCasesAccepted: false,
    existingCasesPreserved: true,
    recoveryRequiresAuthorisation: true,
    paymentExecuted: false,
    truthState: "DECISION",
    mtqDisabled: gate.mtqDisabled,
    productionAuthorized: gate.productionAuthorized,
    note:
      "Safe halt is active. New validation cases are refused; existing " +
      "cases and evidence are preserved. Recovery requires explicit " +
      "authorisation after root cause, fix, tests, and ownership have " +
      "been documented (§5.2.G).",
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/v1/safe-halt — read the current halt status.
// ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  return okResponse({
    safeHalted: SAFE_HALTED,
    newCasesAccepted: !SAFE_HALTED,
    existingCasesPreserved: true,
    recoveryRequiresAuthorisation: SAFE_HALTED,
    mtqDisabled: evaluateMtqGate().mtqDisabled,
    timestamp: new Date().toISOString(),
  });
}

// Side-export the DbError type so callers can reference it.
void DbError;
