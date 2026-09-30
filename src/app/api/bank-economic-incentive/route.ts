import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  ECONOMIC_FACTORS,
  FOUNDING_BANK_INCENTIVES,
  BANK_VALUE_EQUATION,
  NOT_NETWORK_PREFUNDER_RULE,
  NO_NOSTRO_RELEASE_PROMISE_RULE,
  INCENTIVE_SEPARATION_RULE,
  FACTOR_COUNT,
  POSITIVE_FACTOR_COUNT,
  NEGATIVE_FACTOR_COUNT,
  FOUNDING_BANK_INCENTIVE_COUNT,
  FACTOR_MAP,
  FOUNDING_BANK_INCENTIVE_MAP,
  getFactor,
  getFoundingBankIncentive,
  BANK_ECONOMIC_INCENTIVE_MODEL_STATUS,
  BANK_ECONOMIC_INCENTIVE_MODEL_VERSION,
  BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
  BANK_ECONOMIC_INCENTIVE_HONEST_STATE,
  type FactorId,
  type FactorDirection,
  type FoundingBankIncentiveId,
} from "@/lib/bank-economic-incentive-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/bank-economic-incentive
 *
 * P44 Bank Economic Incentive Model.
 * Per PROMPT 44: 12 economic factors (9 positive + 3 negative) compose
 * the bank value equation. 5 founding-bank incentives (pilot pricing,
 * implementation concessions, fee rebates, corridor incentives,
 * governance participation) — ALL PENDING. MITHQAL is NOT the network
 * pre-funder. MITHQAL does NOT promise 'nostro release' without a
 * demonstrated mechanism. All incentives remain SEPARATE from monetary
 * authorization, risk approval, and finality decisions.
 *
 * Query params:
 *  - ?factorId=NOSTRO_VOSTRO_LIQUIDITY_USAGE|TRAPPED_LIQUIDITY|SETTLEMENT_TIMING|FX_SPREAD_ECONOMICS|RECONCILIATION_COST|COMPLIANCE_EVIDENCE_OPERATING_COST|EXCEPTION_MANAGEMENT_COST|INFRASTRUCTURE_COST|SERVICE_REVENUE|TREASURY_LIQUIDITY_BENEFITS|INTEGRATION_COST|CHANGE_MANAGEMENT_COST
 *  - ?incentiveId=PILOT_PRICING|IMPLEMENTATION_CONCESSIONS|FEE_REBATES|CORRIDOR_INCENTIVES|GOVERNANCE_PARTICIPATION
 *  - ?direction=POSITIVE|NEGATIVE
 *  - ?view=equation (bank value equation only)
 *  - ?view=incentives (founding-bank incentives only)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "bank-economic-incentive",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const factorId = url.searchParams.get("factorId") as FactorId | null;
  const incentiveId = url.searchParams.get("incentiveId") as
    | FoundingBankIncentiveId
    | null;
  const direction = url.searchParams.get("direction") as
    | FactorDirection
    | null;
  const view = url.searchParams.get("view");

  // Single-factor lookup
  if (factorId) {
    const factor = getFactor(factorId);
    if (!factor) {
      return NextResponse.json(
        { error: `Invalid factorId: ${factorId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
      },
      factor,
    });
  }

  // Single-incentive lookup
  if (incentiveId) {
    const incentive = getFoundingBankIncentive(incentiveId);
    if (!incentive) {
      return NextResponse.json(
        { error: `Invalid incentiveId: ${incentiveId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
      },
      incentive,
    });
  }

  // Direction filter
  if (direction) {
    const validDirections: FactorDirection[] = ["POSITIVE", "NEGATIVE"];
    if (!validDirections.includes(direction)) {
      return NextResponse.json(
        { error: `Invalid direction: ${direction}` },
        { status: 400 },
      );
    }
    const factors = ECONOMIC_FACTORS.filter((f) => f.direction === direction);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
      },
      direction,
      factorCount: factors.length,
      factors,
    });
  }

  // View: equation
  if (view === "equation") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
        version: BANK_ECONOMIC_INCENTIVE_MODEL_VERSION,
        status: BANK_ECONOMIC_INCENTIVE_MODEL_STATUS,
        overrideRule:
          "P44 Bank Economic Incentive Model — equation view. 12 factors " +
          "(9 positive + 3 negative). All DESIGN-TIME. MITHQAL is NOT the " +
          "network pre-funder. MITHQAL does NOT promise nostro release.",
        changeRequest: "CR-2026-020 (per Architecture Freeze v25.3.15)",
      },
      bankValueEquation: BANK_VALUE_EQUATION,
    });
  }

  // View: incentives (founding-bank incentives only)
  if (view === "incentives") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
        version: BANK_ECONOMIC_INCENTIVE_MODEL_VERSION,
        status: BANK_ECONOMIC_INCENTIVE_MODEL_STATUS,
        overrideRule:
          "P44 Bank Economic Incentive Model — founding-bank incentives view. " +
          "5 incentives, all PENDING. All separated from monetary authorization, " +
          "risk approval, and finality decisions (per INCENTIVE_SEPARATION_RULE).",
        changeRequest: "CR-2026-020 (per Architecture Freeze v25.3.15)",
      },
      incentiveCount: FOUNDING_BANK_INCENTIVE_COUNT,
      incentives: FOUNDING_BANK_INCENTIVES,
    });
  }

  // Default — full bank economic incentive model
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.21",
      source: BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE,
      version: BANK_ECONOMIC_INCENTIVE_MODEL_VERSION,
      status: BANK_ECONOMIC_INCENTIVE_MODEL_STATUS,
      overrideRule:
        "P44 Bank Economic Incentive Model — 12 economic factors (9 positive " +
        "+ 3 negative) compose the bank value equation. 5 founding-bank " +
        "incentives, all PENDING. MITHQAL is NOT the network pre-funder " +
        "(per NOT_NETWORK_PREFUNDER_RULE). MITHQAL does NOT promise nostro " +
        "release without a demonstrated mechanism " +
        "(per NO_NOSTRO_RELEASE_PROMISE_RULE). All incentives are SEPARATE " +
        "from monetary authorization, risk approval, and finality decisions " +
        "(per INCENTIVE_SEPARATION_RULE).",
      changeRequest: "CR-2026-020 (per Architecture Freeze v25.3.15)",
    },
    factorCount: FACTOR_COUNT,
    positiveFactorCount: POSITIVE_FACTOR_COUNT,
    negativeFactorCount: NEGATIVE_FACTOR_COUNT,
    foundingBankIncentiveCount: FOUNDING_BANK_INCENTIVE_COUNT,
    bankValueEquation: BANK_VALUE_EQUATION,
    economicFactors: ECONOMIC_FACTORS,
    foundingBankIncentives: FOUNDING_BANK_INCENTIVES,
    notNetworkPrefunderRule: {
      ruleId: NOT_NETWORK_PREFUNDER_RULE.ruleId,
      rule: NOT_NETWORK_PREFUNDER_RULE.rule,
      description: NOT_NETWORK_PREFUNDER_RULE.description,
      whatItForbids: NOT_NETWORK_PREFUNDER_RULE.whatItForbids,
      whatItPermits: NOT_NETWORK_PREFUNDER_RULE.whatItPermits,
      enforcement: NOT_NETWORK_PREFUNDER_RULE.enforcement,
    },
    noNostroReleasePromiseRule: {
      ruleId: NO_NOSTRO_RELEASE_PROMISE_RULE.ruleId,
      rule: NO_NOSTRO_RELEASE_PROMISE_RULE.rule,
      description: NO_NOSTRO_RELEASE_PROMISE_RULE.description,
      whatItForbids: NO_NOSTRO_RELEASE_PROMISE_RULE.whatItForbids,
      whatItPermits: NO_NOSTRO_RELEASE_PROMISE_RULE.whatItPermits,
      enforcement: NO_NOSTRO_RELEASE_PROMISE_RULE.enforcement,
    },
    incentiveSeparationRule: {
      ruleId: INCENTIVE_SEPARATION_RULE.ruleId,
      rule: INCENTIVE_SEPARATION_RULE.rule,
      description: INCENTIVE_SEPARATION_RULE.description,
      whatItForbids: INCENTIVE_SEPARATION_RULE.whatItForbids,
      whatItPermits: INCENTIVE_SEPARATION_RULE.whatItPermits,
      enforcement: INCENTIVE_SEPARATION_RULE.enforcement,
    },
    honestState: BANK_ECONOMIC_INCENTIVE_HONEST_STATE,
    rule: "Per PROMPT 44: 'Extend the commercial model to quantify why a bank would participate. Model: nostro/vostro liquidity usage, trapped liquidity, settlement timing, FX spread economics, reconciliation cost, compliance/evidence operating cost, exception-management cost, infrastructure cost, service revenue, treasury/liquidity benefits, integration cost, change-management cost. Create a bank value equation based on measured or explicitly assumed inputs. Do NOT make MITHQAL the network pre-funder. Do NOT promise \"nostro release\" unless the mechanism is actually demonstrated. Add founding-bank economics such as: pilot pricing, implementation concessions, fee rebates, corridor incentives, governance participation, or other incentives only where legally and commercially appropriate. All incentives must remain separate from monetary authorization, risk approval and finality decisions.'",
  });
}
