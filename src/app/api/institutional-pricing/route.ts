import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  FEE_TYPES,
  FEE_TYPE_COUNT,
  PRICE_STAGES,
  PRICE_STAGE_COUNT,
  PRICE_STAGE_COUNT_PER_FEE_TYPE,
  TOTAL_PRICE_STAGE_RECORDS,
  FEE_INDEPENDENCE_RULE,
  NO_ILLUSTRATIVE_AS_CURRENT_RULE,
  PRICING_ARCHITECTURE_STATUS,
  PRICING_ARCHITECTURE_VERSION,
  PRICING_ARCHITECTURE_SOURCE,
  PRICING_ARCHITECTURE_HONEST_STATE,
  getFeeType,
  getOptionalFeeTypes,
  getMandatoryFeeTypes,
  type FeeTypeId,
  type PriceStage,
} from "@/lib/institutional-pricing-architecture";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/institutional-pricing
 *
 * P35 Institutional Pricing / Commercial Model Architecture.
 * Per PROMPT 35: 7 fee types × 7 price stages = 49 stage records.
 * ALL prices = PENDING (no commercial pricing set — per
 * NO_ILLUSTRATIVE_AS_CURRENT_RULE "No illustrative price may appear as
 * current commercial pricing").
 * Fees cannot influence MTQ issuance/reserve/risk/finality decisions
 * (per FEE_INDEPENDENCE_RULE).
 *
 * Query params:
 *  - ?feeTypeId=IMPLEMENTATION_FEE|CONNECTIVITY_FEE|SETTLEMENT_FEE|RECONCILIATION_EVIDENCE_FEE|ENTERPRISE_INTEGRATION_FEE|SUPPORT_SERVICE_FEE|OPTIONAL_INSTITUTIONAL_SERVICES
 *  - ?optional=true|false (filter mandatory vs optional fee types)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "institutional-pricing",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const feeTypeId = url.searchParams.get("feeTypeId") as FeeTypeId | null;
  const optionalFilter = url.searchParams.get("optional"); // "true" | "false"

  // Single-fee-type lookup by feeTypeId
  if (feeTypeId) {
    const feeType = getFeeType(feeTypeId);
    if (!feeType) {
      return NextResponse.json(
        { error: `Invalid feeTypeId: ${feeTypeId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: PRICING_ARCHITECTURE_SOURCE,
      },
      feeType,
    });
  }

  // Optional filter
  if (optionalFilter === "true") {
    const optionalFees = getOptionalFeeTypes();
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: PRICING_ARCHITECTURE_SOURCE,
      },
      optional: true,
      feeTypeCount: optionalFees.length,
      feeTypes: optionalFees,
    });
  }
  if (optionalFilter === "false") {
    const mandatoryFees = getMandatoryFeeTypes();
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: PRICING_ARCHITECTURE_SOURCE,
      },
      optional: false,
      feeTypeCount: mandatoryFees.length,
      feeTypes: mandatoryFees,
    });
  }

  // Default — full pricing architecture
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.20",
      source: PRICING_ARCHITECTURE_SOURCE,
      version: PRICING_ARCHITECTURE_VERSION,
      status: PRICING_ARCHITECTURE_STATUS,
      overrideRule:
        "Institutional Pricing / Commercial Model Architecture — 7 fee types × 7 price stages = 49 stage records. " +
        "ALL prices = PENDING (per NO_ILLUSTRATIVE_AS_CURRENT_RULE: 'No illustrative price may appear as current commercial pricing.'). " +
        "Fees cannot influence MTQ issuance authorization, reserve decisions, risk decisions or finality decisions " +
        "(per FEE_INDEPENDENCE_RULE). Pricing architecture is SEPARATE from the ROI engine (per v25.3.11 Q1) and " +
        "from all control-plane decisions (per v25.3.6 J3 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE).",
      changeRequest: "CR-2026-011 (per Architecture Freeze v25.3.15)",
    },
    feeTypeCount: FEE_TYPE_COUNT,
    priceStageCount: PRICE_STAGE_COUNT_PER_FEE_TYPE,
    totalPriceStageRecords: TOTAL_PRICE_STAGE_RECORDS,
    feeTypes: FEE_TYPES,
    priceStages: PRICE_STAGES,
    feeIndependenceRule: {
      ruleId: FEE_INDEPENDENCE_RULE.ruleId,
      rule: FEE_INDEPENDENCE_RULE.rule,
      description: FEE_INDEPENDENCE_RULE.description,
      whatItForbids: FEE_INDEPENDENCE_RULE.whatItForbids,
      whatItPermits: FEE_INDEPENDENCE_RULE.whatItPermits,
      enforcement: FEE_INDEPENDENCE_RULE.enforcement,
      controlPlaneDecisionsProtected:
        FEE_INDEPENDENCE_RULE.controlPlaneDecisionsProtected,
      siblingSubsystems: FEE_INDEPENDENCE_RULE.siblingSubsystems,
    },
    noIllustrativeAsCurrentRule: {
      ruleId: NO_ILLUSTRATIVE_AS_CURRENT_RULE.ruleId,
      rule: NO_ILLUSTRATIVE_AS_CURRENT_RULE.rule,
      description: NO_ILLUSTRATIVE_AS_CURRENT_RULE.description,
      whatItForbids: NO_ILLUSTRATIVE_AS_CURRENT_RULE.whatItForbids,
      whatItPermits: NO_ILLUSTRATIVE_AS_CURRENT_RULE.whatItPermits,
      enforcement: NO_ILLUSTRATIVE_AS_CURRENT_RULE.enforcement,
      honestState: NO_ILLUSTRATIVE_AS_CURRENT_RULE.honestState,
      notAQuote: NO_ILLUSTRATIVE_AS_CURRENT_RULE.notAQuote,
    },
    honestState: PRICING_ARCHITECTURE_HONEST_STATE,
    rule: "Per PROMPT 35: 'Create a canonical institutional pricing architecture separate from the ROI engine. 7 fee types × 7 price stages. Commercial fees cannot influence MTQ issuance authorization, reserve decisions, risk decisions or finality decisions. No illustrative price may appear as current commercial pricing.'",
  });
}
