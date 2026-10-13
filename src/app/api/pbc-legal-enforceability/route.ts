import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  MITHQAL_VERIFICATION_RULE,
  AVAILABLE_BACKING_RULE,
  computePBCStatus,
  PBC_LEGAL_FRAMEWORK_STATUS,
  PBC_LEGAL_FRAMEWORK_VERSION,
  PBC_LEGAL_FRAMEWORK_SOURCE,
  PBC_FIELD_COUNT,
  PBC_FAILURE_STATE_COUNT,
  type ProtectedBackingCell,
} from "@/lib/pbc-legal-enforceability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "pbc-legal-enforceability",
    request,
    30,
    60_000
  );
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.16",
      source: PBC_LEGAL_FRAMEWORK_SOURCE,
      version: PBC_LEGAL_FRAMEWORK_VERSION,
      status: PBC_LEGAL_FRAMEWORK_STATUS,
      overrideRule:
        "PBC Legal Enforceability. 14 fields per PBC. 6 failure states. MITHQAL NEVER implies ownership/legal perfection/bankruptcy remoteness. PBC counts as AvailableBacking only when evidence exists.",
      mithqalVerificationRule: MITHQAL_VERIFICATION_RULE.rule,
      availableBackingRule: AVAILABLE_BACKING_RULE.rule,
      changeRequest: "CR-2026-002 (per Architecture Freeze v25.3.15)",
    },
    fieldCount: PBC_FIELD_COUNT,
    failureStateCount: PBC_FAILURE_STATE_COUNT,
    fields: [
      "legalOwner",
      "obligor",
      "custodyArrangement",
      "accountControl",
      "segregation",
      "pledgePerfectionStatus",
      "encumbrance",
      "reuseProhibition",
      "bankruptcyTreatment",
      "insolvencyPriority",
      "valuation",
      "liquidityAccessibility",
      "jurisdiction",
      "governingLaw",
      "evidenceArtifact",
    ],
    failureStates: [
      "LEGAL_CONTROL_UNPROVEN",
      "ENCUMBERED",
      "REUSED",
      "CUSTODY_UNPROVEN",
      "BANKRUPTCY_TREATMENT_UNKNOWN",
      "LIQUIDITY_UNAVAILABLE",
    ],
    mithqalVerificationRule: MITHQAL_VERIFICATION_RULE,
    availableBackingRule: AVAILABLE_BACKING_RULE,
    rule: "PBC counts as AvailableBacking only when ALL required legal + operational evidence exists AND ZERO failure states. MITHQAL verification NEVER implies ownership, legal perfection, or bankruptcy remoteness.",
  });
}

// POST — evaluate a PBC's status

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit(
    "pbc-legal-enforceability-post",
    request,
    10,
    60_000
  );
  if (rateLimited) return rateLimited;

  try {
    const pbc = (await request.json()) as ProtectedBackingCell;
    const result = computePBCStatus(pbc);
    return NextResponse.json({
      _meta: { activeModel: "v25.3.16", source: PBC_LEGAL_FRAMEWORK_SOURCE },
      pbcId: pbc.pbcId,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to evaluate PBC",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
