import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  ENTERPRISE_RISK_REGISTER,
  NO_INVENTED_PROBABILITIES_RULE,
  SINGULAR_OWNER_RULE,
  RISK_CATEGORIES,
  RISK_FIELDS,
  getRisk,
  getRisksByCategory,
  RISK_REGISTER_STATUS,
  RISK_REGISTER_VERSION,
  RISK_REGISTER_SOURCE,
  RISK_COUNT,
  RISK_FIELD_COUNT,
  RISK_CATEGORY_COUNT,
  type RiskCategory,
} from "@/lib/enterprise-risk-register";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "enterprise-risk-register",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const riskId = url.searchParams.get("riskId");
  const category = url.searchParams.get("category") as RiskCategory | null;

  // Single-risk lookup by riskId
  if (riskId) {
    const risk = getRisk(riskId);
    if (!risk) {
      return NextResponse.json(
        { error: `Invalid riskId: ${riskId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.18",
        source: RISK_REGISTER_SOURCE,
      },
      risk,
    });
  }

  // Category filter
  if (category) {
    const valid = RISK_CATEGORIES.some((c) => c.code === category);
    if (!valid) {
      return NextResponse.json(
        { error: `Invalid category: ${category}` },
        { status: 400 },
      );
    }
    const risks = getRisksByCategory(category);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.18",
        source: RISK_REGISTER_SOURCE,
      },
      category,
      riskCount: risks.length,
      risks,
    });
  }

  // Default — full register
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.18",
      source: RISK_REGISTER_SOURCE,
      version: RISK_REGISTER_VERSION,
      status: RISK_REGISTER_STATUS,
      overrideRule:
        "Enterprise Risk Register — 17 risks, 14 fields per risk. NO invented probabilities (qualitative severity only). Every owner is singular and explicit (COO or CTO of Jozour, LLC). All risks are OPEN.",
      changeRequest: "CR-2026-006 (per Architecture Freeze v25.3.15)",
    },
    riskCount: RISK_COUNT,
    riskFieldCount: RISK_FIELD_COUNT,
    riskCategoryCount: RISK_CATEGORY_COUNT,
    riskRegister: ENTERPRISE_RISK_REGISTER,
    categories: RISK_CATEGORIES,
    fields: RISK_FIELDS,
    noInventedProbabilitiesRule: NO_INVENTED_PROBABILITIES_RULE,
    singularOwnerRule: SINGULAR_OWNER_RULE,
    rule: "Per PROMPT 30: 'Convert the existing risk architecture into an actionable enterprise risk register. Each risk must have 14 fields. Do NOT invent probabilities. Cover 17 risk categories. Every risk owner must be singular and explicit.'",
  });
}
