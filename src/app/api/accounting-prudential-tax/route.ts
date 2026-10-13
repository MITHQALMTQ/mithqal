import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DECISION_MATRIX,
  getDecisionMatrixEntry,
  getExternallyValidatedCount,
  getPendingValidationCount,
  FRAMEWORK_STATUS,
  FRAMEWORK_VERSION,
  FRAMEWORK_SOURCE,
  CLASSIFICATION_AREA_COUNT,
  NO_UNVALIDATED_ASSERTION_RULE,
  ALL_ITEMS_PENDING,
  type ClassificationAreaId,
} from "@/lib/accounting-prudential-tax-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "accounting-prudential-tax",
    request,
    30,
    60_000
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const areaId = url.searchParams.get("areaId") as ClassificationAreaId | null;

  if (areaId) {
    const entry = getDecisionMatrixEntry(areaId);
    if (!entry) {
      return NextResponse.json(
        { error: `Invalid areaId: ${areaId}` },
        { status: 400 }
      );
    }
    return NextResponse.json({
      _meta: { activeModel: "v25.3.16", source: FRAMEWORK_SOURCE },
      entry,
    });
  }

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.16",
      source: FRAMEWORK_SOURCE,
      version: FRAMEWORK_VERSION,
      status: FRAMEWORK_STATUS,
      overrideRule:
        "Accounting/Prudential/Tax Classification Framework. 10 evidence-gated states. Decision matrix: DESIGN HYPOTHESIS → COUNSEL VIEW → ACCOUNTING VIEW → PRUDENTIAL VIEW → EXTERNAL VALIDATION. No unvalidated assertions.",
      noUnvalidatedAssertionRule: NO_UNVALIDATED_ASSERTION_RULE,
      allItemsPending: ALL_ITEMS_PENDING,
      changeRequest: "CR-2026-001 (per Architecture Freeze v25.3.15)",
    },
    classificationAreaCount: CLASSIFICATION_AREA_COUNT,
    externallyValidatedCount: getExternallyValidatedCount(),
    pendingValidationCount: getPendingValidationCount(),
    decisionMatrix: DECISION_MATRIX,
    rule: "Per PROMPT 25: 'Do NOT assert a classification that has not been independently validated.' All 10 areas are PENDING_EXTERNAL_VALIDATION.",
  });
}
