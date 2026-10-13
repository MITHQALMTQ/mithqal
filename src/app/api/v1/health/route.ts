/**
 * GET /api/v1/health — MITHQAL MASTER BLUEPRINT §16.1 + cover page.
 *
 * Lightweight liveness probe — no DB / Inngest calls. Returns the MITHQAL
 * Assurance identity, the 5 truth states (§D.4), and the MTQ Σ NOT
 * AUTHORIZED status (§9.1 / cover page).
 *
 *   {
 *     status: "OK",
 *     identity: "MITHQAL Assurance",
 *     tagline: "Financial-Operations Assurance Platform",
 *     database: "connected" | "not-provisioned",
 *     version: "v1.0.0",
 *     productionAuthorized: false,
 *     mtqSigma: "NOT AUTHORIZED",
 *     mtqSigmaNote: "Research-only (§9.1). No mainnet deployment, no issuance.",
 *     truthStates: [ "VERIFIED", "HYPOTHESIS", "DECISION", "UNRESOLVED", "NOT AUTHORIZED" ],
 *     honestState: <human summary>,
 *     timestamp: ISO8601
 *   }
 *
 * The health response is honest by construction — it never claims
 * production authorisation that the gate does not hold.
 */

import { type NextRequest } from "next/server";

import { db } from "@/db";
import { evaluateMtqGate, POLICY_VERSION } from "@/lib/mtq-gate";

export const dynamic = "force-dynamic";

/** The 5 truth-state vocabulary per §D.4 of the Master Blueprint. */
export const TRUTH_STATES = [
  "VERIFIED",
  "HYPOTHESIS",
  "DECISION",
  "UNRESOLVED",
  "NOT AUTHORIZED",
] as const;

export async function GET(_request: NextRequest) {
  const gate = evaluateMtqGate();
  return Response.json({
    status: "OK",
    identity: "MITHQAL Assurance",
    tagline: "Financial-Operations Assurance Platform",
    description:
      "An independent financial-operations assurance platform that helps " +
      "institutions validate payment data, resolve operational exceptions, " +
      "and produce reproducible evidence across authorized systems.",
    database: db ? "connected" : "not-provisioned",
    version: "v1.0.0",
    policyVersion: POLICY_VERSION,
    productionAuthorized: gate.productionAuthorized,
    mtqSigma: "NOT AUTHORIZED",
    mtqSigmaStatus: "research-only",
    mtqSigmaNote:
      "MTQ Σ is research-only (§9.1). No mainnet deployment, no issuance. " +
      "MITHQAL Assurance is commercially viable without MTQ Σ.",
    truthStates: TRUTH_STATES,
    honestState: gate.honestState,
    timestamp: new Date().toISOString(),
  });
}
