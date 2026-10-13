import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  FORBIDDEN_ASSUMPTIONS,
  REPLACEMENT_PATTERN_RULE,
  COORDINATION_RULE,
  getForbiddenAssumption,
  LEGAL_CONDITIONALITY_STATUS,
  LEGAL_CONDITIONALITY_VERSION,
  LEGAL_CONDITIONALITY_SOURCE,
  FORBIDDEN_ASSUMPTION_COUNT,
  type ForbiddenAssumptionId,
} from "@/lib/failure-resolution-legal-conditionality";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "failure-resolution-legal-conditionality",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const assumptionId = url.searchParams.get("assumptionId") as
    | ForbiddenAssumptionId
    | null;

  if (assumptionId) {
    const assumption = getForbiddenAssumption(assumptionId);
    if (!assumption) {
      return NextResponse.json(
        { error: `Invalid assumptionId: ${assumptionId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: { activeModel: "v25.3.17", source: LEGAL_CONDITIONALITY_SOURCE },
      assumption,
    });
  }

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.17",
      source: LEGAL_CONDITIONALITY_SOURCE,
      version: LEGAL_CONDITIONALITY_VERSION,
      status: LEGAL_CONDITIONALITY_STATUS,
      overrideRule:
        "Failure/Default/Resolution Legal Conditionality. 6 forbidden assumptions. Replace with DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE. System may coordinate; must not invent legal rights.",
      changeRequest: "CR-2026-003 (per Architecture Freeze v25.3.15)",
    },
    forbiddenAssumptionCount: FORBIDDEN_ASSUMPTION_COUNT,
    forbiddenAssumptions: FORBIDDEN_ASSUMPTIONS,
    replacementPatternRule: REPLACEMENT_PATTERN_RULE,
    coordinationRule: COORDINATION_RULE,
    rule: "Per PROMPT 27: 'The system may coordinate resolution; it must not invent legal rights.' All 6 forbidden assumptions are conditionalized with the DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE replacement pattern.",
  });
}
