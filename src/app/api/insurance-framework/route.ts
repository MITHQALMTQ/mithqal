import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  INSURANCE_CATEGORIES,
  NO_SUBSTITUTE_RULE,
  POLICY_LIFECYCLE_RULE,
  INSURANCE_FIELDS,
  getCategory,
  getCategoriesByStatus,
  INSURANCE_FRAMEWORK_STATUS,
  INSURANCE_FRAMEWORK_VERSION,
  INSURANCE_FRAMEWORK_SOURCE,
  INSURANCE_CATEGORY_COUNT,
  INSURANCE_FIELD_COUNT,
  type PolicyStatus,
} from "@/lib/insurance-risk-transfer-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "insurance-framework",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");
  const status = url.searchParams.get("status") as PolicyStatus | null;

  // Single-category lookup by categoryId
  if (categoryId) {
    const category = getCategory(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: `Invalid categoryId: ${categoryId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.18",
        source: INSURANCE_FRAMEWORK_SOURCE,
      },
      category,
    });
  }

  // Status filter
  if (status) {
    const validStatuses = [
      "DESIGNED",
      "QUOTED",
      "BOUND",
      "ACTIVE",
      "PENDING_QUOTE",
      "UNAVAILABLE",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 },
      );
    }
    const categories = getCategoriesByStatus(status);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.18",
        source: INSURANCE_FRAMEWORK_SOURCE,
      },
      status,
      categoryCount: categories.length,
      categories,
    });
  }

  // Default — full framework
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.18",
      source: INSURANCE_FRAMEWORK_SOURCE,
      version: INSURANCE_FRAMEWORK_VERSION,
      status: INSURANCE_FRAMEWORK_STATUS,
      overrideRule:
        "Insurance / Risk-Transfer Framework — 7 coverage categories, 10 fields per category. Lifecycle: DESIGNED -> QUOTED -> BOUND -> ACTIVE. ALL categories are DESIGNED (none QUOTED/BOUND/ACTIVE). Insurance is NOT a substitute for legal segregation, capital, liquidity or operational controls.",
      changeRequest: "CR-2026-007 (per Architecture Freeze v25.3.15)",
    },
    categoryCount: INSURANCE_CATEGORY_COUNT,
    fieldCount: INSURANCE_FIELD_COUNT,
    categories: INSURANCE_CATEGORIES,
    fields: INSURANCE_FIELDS,
    noSubstituteRule: NO_SUBSTITUTE_RULE,
    policyLifecycleRule: POLICY_LIFECYCLE_RULE,
    rule: "Per PROMPT 31: 'Create a structured insurance and contractual risk-transfer framework. Evaluate 7 coverage categories. Use DESIGNED -> QUOTED -> BOUND -> ACTIVE. Never represent insurance as a substitute for legal segregation, capital, liquidity or operational controls.'",
  });
}
