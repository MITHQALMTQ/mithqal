import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  CANONICAL_MTQ_CLASSIFICATION,
  PAR_DEFINITION,
  MTQ_DENOMINATION,
  MARKET_CONVERSION_VALUE,
  REDEMPTION_VALUE,
  ELIGIBLE_BACKING,
  HAIRCUT_SCHEDULE,
  RESERVE_COMPOSITION,
  REDEMPTION_MECHANISM,
  CONSISTENCY_ASSERTIONS,
  NO_HIDDEN_CONTRADICTION_RULE,
  MTQ_REDEMPTION_VALUE_STATUS,
  MTQ_REDEMPTION_VALUE_VERSION,
  MTQ_REDEMPTION_VALUE_SOURCE,
  MTQ_REDEMPTION_VALUE_HONEST_STATE,
  type ReserveAssetClass,
  type MTQStructureCandidate,
} from "@/lib/mtq-redemption-value-consistency";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/mtq-redemption-value
 *
 * P43 MTQ Redemption/Value Consistency.
 * Per PROMPT 43: ONE canonical explanation of MTQ's economic structure.
 * Resolves the full relationship between PAR, MTQ denomination, market/
 * conversion value, redemption value, eligible backing, haircuts, reserve
 * composition. NO hidden contradiction between PAR and redemption. Final
 * legal/economic classification = PENDING_EXTERNAL_VALIDATION.
 *
 * Query params:
 *  - ?view=par (PAR definition only)
 *  - ?view=redemptionMechanism (redemption mechanism spec only)
 *  - ?view=eligibleBacking (eligible backing asset list only)
 *  - ?view=haircuts (haircut schedule only)
 *  - ?view=reserveComposition (reserve composition only)
 *  - ?view=consistencyAssertions (consistency assertions only)
 *  - ?assetClass=BANK_MONEY|...|DIGITAL_GOLD (single eligible backing asset)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "mtq-redemption-value",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const assetClass = url.searchParams.get("assetClass") as
    | ReserveAssetClass
    | null;

  // Single-asset lookup
  if (assetClass) {
    const asset = ELIGIBLE_BACKING.find((a) => a.assetClass === assetClass);
    if (!asset) {
      return NextResponse.json(
        { error: `Invalid assetClass: ${assetClass}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
      },
      asset,
    });
  }

  // View: PAR definition
  if (view === "par") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
        version: MTQ_REDEMPTION_VALUE_VERSION,
        status: MTQ_REDEMPTION_VALUE_STATUS,
        overrideRule:
          "P43 MTQ Redemption/Value Consistency — PAR view. PAR = 1.00 is the " +
          "accounting/denomination reference ONLY. PAR is NOT a USD peg, NOT " +
          "a market price, NOT a redemption guarantee.",
        changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
      },
      par: PAR_DEFINITION,
    });
  }

  // View: Redemption mechanism
  if (view === "redemptionMechanism") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
        version: MTQ_REDEMPTION_VALUE_VERSION,
        status: MTQ_REDEMPTION_VALUE_STATUS,
        overrideRule:
          "P43 MTQ Redemption/Value Consistency — redemption mechanism view. " +
          "Exact calculation, pricing timestamp, valuation source, haircut " +
          "application, rounding, settlement currency, legal obligation. " +
          "DESIGN-TIME / PENDING_EXTERNAL_VALIDATION (honest).",
        changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
      },
      redemptionMechanism: REDEMPTION_MECHANISM,
    });
  }

  // View: Eligible backing
  if (view === "eligibleBacking") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
        version: MTQ_REDEMPTION_VALUE_VERSION,
        status: MTQ_REDEMPTION_VALUE_STATUS,
        overrideRule:
          "P43 MTQ Redemption/Value Consistency — eligible backing view. " +
          "Per v25.3.6 K4 reserve domains + 3 anti-double-counting rules. " +
          "All assets DESIGN-TIME.",
        changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
      },
      eligibleBackingCount: ELIGIBLE_BACKING.length,
      eligibleBacking: ELIGIBLE_BACKING,
    });
  }

  // View: Haircuts
  if (view === "haircuts") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
        version: MTQ_REDEMPTION_VALUE_VERSION,
        status: MTQ_REDEMPTION_VALUE_STATUS,
        overrideRule:
          "P43 MTQ Redemption/Value Consistency — haircut schedule view. " +
          "All haircuts DESIGN-TIME — calibration requires independent analysis.",
        changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
      },
      haircutCount: HAIRCUT_SCHEDULE.length,
      haircuts: HAIRCUT_SCHEDULE,
    });
  }

  // View: Reserve composition
  if (view === "reserveComposition") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
        version: MTQ_REDEMPTION_VALUE_VERSION,
        status: MTQ_REDEMPTION_VALUE_STATUS,
        overrideRule:
          "P43 MTQ Redemption/Value Consistency — reserve composition view. " +
          "Per v25.3.6 K4 + K5 Pilot 1 config (gold=0%, digital=0%).",
        changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
      },
      reserveComposition: RESERVE_COMPOSITION,
    });
  }

  // View: Consistency assertions
  if (view === "consistencyAssertions") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: MTQ_REDEMPTION_VALUE_SOURCE,
        version: MTQ_REDEMPTION_VALUE_VERSION,
        status: MTQ_REDEMPTION_VALUE_STATUS,
        overrideRule:
          "P43 MTQ Redemption/Value Consistency — consistency assertions view. " +
          "6 assertions verify: PAR is not a peg, PAR is not redemption value, " +
          "MTQ is not pegged while implying fixed-dollar redemption, " +
          "ONE canonical explanation exists, PENDING_EXTERNAL_VALIDATION, " +
          "redemption mechanism is fully specified.",
        changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
      },
      assertionCount: CONSISTENCY_ASSERTIONS.length,
      consistencyAssertions: CONSISTENCY_ASSERTIONS,
    });
  }

  // Default — full MTQ redemption/value consistency
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.21",
      source: MTQ_REDEMPTION_VALUE_SOURCE,
      version: MTQ_REDEMPTION_VALUE_VERSION,
      status: MTQ_REDEMPTION_VALUE_STATUS,
      overrideRule:
        "P43 MTQ Redemption/Value Consistency — ONE canonical explanation. " +
        "PAR is the accounting/denomination reference; redemption value is " +
        "computed by REDEMPTION_MECHANISM. PAR does NOT imply any particular " +
        "redemption value. Final legal/economic classification = " +
        "PENDING_EXTERNAL_VALIDATION.",
      changeRequest: "CR-2026-019 (per Architecture Freeze v25.3.15)",
    },
    canonicalClassification: CANONICAL_MTQ_CLASSIFICATION.canonicalClassification as MTQStructureCandidate,
    canonicalExplanation: CANONICAL_MTQ_CLASSIFICATION.canonicalExplanation,
    candidates: CANONICAL_MTQ_CLASSIFICATION.candidates,
    rationale: CANONICAL_MTQ_CLASSIFICATION.rationale,
    par: PAR_DEFINITION,
    mtqDenomination: MTQ_DENOMINATION,
    marketConversionValue: MARKET_CONVERSION_VALUE,
    redemptionValue: REDEMPTION_VALUE,
    eligibleBacking: ELIGIBLE_BACKING,
    haircutSchedule: HAIRCUT_SCHEDULE,
    reserveComposition: RESERVE_COMPOSITION,
    redemptionMechanism: REDEMPTION_MECHANISM,
    consistencyAssertions: CONSISTENCY_ASSERTIONS,
    noHiddenContradictionRule: {
      ruleId: NO_HIDDEN_CONTRADICTION_RULE.ruleId,
      rule: NO_HIDDEN_CONTRADICTION_RULE.rule,
      description: NO_HIDDEN_CONTRADICTION_RULE.description,
      whatItForbids: NO_HIDDEN_CONTRADICTION_RULE.whatItForbids,
      whatItPermits: NO_HIDDEN_CONTRADICTION_RULE.whatItPermits,
      enforcement: NO_HIDDEN_CONTRADICTION_RULE.enforcement,
    },
    honestState: MTQ_REDEMPTION_VALUE_HONEST_STATE,
    rule: "Per PROMPT 43: 'Resolve the full economic relationship between: PAR, MTQ denomination, market/conversion value, redemption value, eligible backing, haircuts, and reserve composition. There must be exactly one canonical explanation of whether MTQ is: a denomination/reference unit; a fixed-value settlement claim; a variable-value redeemable claim; or another legally defined structure. Do not leave a hidden contradiction where: PAR implies one value, while redemption produces another value. For any redemption mechanism based on a basket, haircut, FX conversion or market valuation: define the exact calculation, pricing timestamp, valuation source, haircut application, rounding, settlement currency, and legal obligation. Do not describe MTQ as \"not pegged\" while other sections economically imply a guaranteed fixed-dollar redemption. Until external legal/accounting validation exists, mark the final legal/economic classification: PENDING_EXTERNAL_VALIDATION.'",
  });
}
