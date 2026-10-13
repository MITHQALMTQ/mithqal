// GET /api/legal-evidence
//
// Returns the external legal evidence registry (layer 4 of the canonical
// authority hierarchy per MITHQAL-V25.3.2-REMEDIATION-LAYER.md §2).
//
// Default: ALL evidence (ACTIVE + PENDING_VALIDATION + RETIRED — i.e. no
// status filter).
//
// Query params:
//   ?status=active|pending_validation|retired|all   (default: all)
//   ?policyId=POLICY_ID                              (returns evidence validating that policy)
//
// Response envelope:
//   {
//     _meta: {
//       activeModel: "v25.3.2",
//       evidenceSource: "src/lib/external-legal-evidence.ts",
//       registryVersion: "1.0.0",
//       layer: 4,
//       overrideRule: "External evidence VALIDATES layers 1-3, it does NOT override them. PENDING_VALIDATION items gate production authorization.",
//       statusParam: <status value used>,
//       policyIdFilter: <policyId value used or null>,
//     },
//     count: <number>,
//     evidence: [ ...LegalEvidence ],
//   }
//
// Rate-limited at 30 requests per 60s per IP (operator-audit tooling).

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  getActiveEvidence,
  getPendingEvidence,
  getRetiredEvidence,
  getEvidenceForPolicy,
  getAllEvidence,
  LEGAL_EVIDENCE_REGISTRY_VERSION,
  LEGAL_EVIDENCE_REGISTRY_SOURCE,
  type EvidenceStatus,
} from "@/lib/external-legal-evidence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OVERRIDE_RULE =
  "External evidence VALIDATES layers 1-3, it does NOT override them. PENDING_VALIDATION items gate production authorization.";

const VALID_STATUS_PARAMS = new Set<EvidenceStatus | "all">([
  "active",
  "pending_validation",
  "retired",
  "all",
]);

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("legal-evidence", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "all").toLowerCase();
  const policyId = url.searchParams.get("policyId");

  // Validate the status param up front so callers get an explicit 400.
  if (!VALID_STATUS_PARAMS.has(status as EvidenceStatus | "all")) {
    return NextResponse.json(
      {
        error:
          "Invalid ?status= value. Allowed: active, pending_validation, retired, all (default).",
        received: status,
      },
      { status: 400 },
    );
  }

  let evidence;
  if (policyId) {
    // Policy filter takes precedence over status filter — both can be
    // combined by re-filtering client-side if needed, but the API returns
    // all evidence validating the policy so the caller can audit the full
    // set (ACTIVE + PENDING_VALIDATION + RETIRED).
    evidence = getEvidenceForPolicy(policyId);
  } else {
    switch (status as EvidenceStatus | "all") {
      case "active":
        evidence = getActiveEvidence();
        break;
      case "pending_validation":
        evidence = getPendingEvidence();
        break;
      case "retired":
        evidence = getRetiredEvidence();
        break;
      case "all":
      default:
        evidence = getAllEvidence();
        break;
    }
  }

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      evidenceSource: LEGAL_EVIDENCE_REGISTRY_SOURCE,
      registryVersion: LEGAL_EVIDENCE_REGISTRY_VERSION,
      layer: 4,
      overrideRule: OVERRIDE_RULE,
      statusParam: status,
      policyIdFilter: policyId ?? null,
    },
    count: evidence.length,
    evidence,
  });
}
