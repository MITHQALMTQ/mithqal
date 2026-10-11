/**
 * POST /api/v1/replay — MITHQAL-TECH-SPEC-001 §3.4.4 + §4.2.
 *
 * Reconstruct the policy decision tree that selected the route for an
 * instruction. Read-only — does NOT touch monetary state.
 *
 * Truth state: SYNTHETIC. The replay currently returns the canonical
 * demo for INS-003. When the policy-version store is wired (Phase 3),
 * the route will fetch the policyVersion + decision trace from the
 * `policy_decisions` table.
 *
 * Input  : { instructionId }
 * Output : { instructionId, policyVersion, decision, reason, finality,
 *            reproducible, replayedAt }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api-auth";
import { errorResponse, okResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { evaluateMtqGate, POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

const replaySchema = z.object({
  instructionId: z.string().min(1).max(50),
});

const SYNTHETIC_REPLAY = {
  instructionId: "INS-003",
  policyVersion: POLICY_VERSION,
  decision: "Route via RTGS",
  reason: "Lowest cost (18 bps), acceptable time (6h), RTGS finality expected at T+6h.",
  finality: "F6 not received — external rail timeout",
  reproducible: true,
  replayedAt: new Date().toISOString(),
};

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body is not valid JSON.");
  }

  const parsed = replaySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_SCHEMA", parsed.error.message, {
      issues: parsed.error.issues,
    });
  }

  const { instructionId } = parsed.data;
  const gate = evaluateMtqGate();

  // SYNTHETIC — return the canonical INS-003 replay for any id.
  // Phase 3: real replay against the policy_decisions table.
  logger.info(
    {
      instructionId,
      mtqDisabled: gate.mtqDisabled,
      policyVersion: POLICY_VERSION,
    },
    "replay/synthetic response served",
  );

  return okResponse({
    ...SYNTHETIC_REPLAY,
    instructionId,
    replayedAt: new Date().toISOString(),
    mtqDisabled: gate.mtqDisabled,
    productionAuthorized: gate.productionAuthorized,
  });
}
