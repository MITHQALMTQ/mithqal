/**
 * GET /api/v1/health — MITHQAL-TECH-SPEC-001 §4.2 (health endpoint).
 *
 * Lightweight liveness probe — no DB / Inngest calls. The shape is
 * intentionally honest:
 *
 *   {
 *     status: "OK",
 *     database: "connected" | "not-provisioned",
 *     inngest: "registered",
 *     version: "v1.0.0",
 *     productionAuthorized: false,
 *     mtqDisabled: true,
 *     timestamp: ISO8601
 *   }
 *
 * `database` reflects whether the Drizzle client was able to construct
 * (i.e. DATABASE_URL is set). It does NOT verify a live connection —
 * use the /api/v1/instructions list route for a real probe.
 */

import { type NextRequest } from "next/server";

import { db } from "@/db";
import { evaluateMtqGate, POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const gate = evaluateMtqGate();
  return Response.json({
    status: "OK",
    database: db ? "connected" : "not-provisioned",
    inngest: "registered",
    version: "v1.0.0",
    policyVersion: POLICY_VERSION,
    productionAuthorized: gate.productionAuthorized,
    mtqDisabled: gate.mtqDisabled,
    honestState: gate.honestState,
    timestamp: new Date().toISOString(),
  });
}
