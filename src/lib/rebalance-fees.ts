/**
 * §29.5 COMPREHENSIVE REBALANCING FEE MODEL — Task 4-b (Gap 3 / Req 10).
 *
 * Previously `generateRebalancePlan` in `v19-infrastructure.ts` (line 2814)
 * used a flat `0.1%` execution cost on every action:
 *
 *     estimatedCost: actions.reduce((sum, a) => sum + a.amount * 0.001, 0),
 *
 * This is too simplistic. Different asset classes have materially different
 * execution costs, slippage profiles, and bid-ask spreads. A $10M gold
 * rebalance does not cost the same as a $10M cash transfer or a $10M
 * stablecoin mint. This module codifies the per-asset-class fee structure
 * so the rebalance engine can produce a realistic, auditable cost estimate
 * for every plan.
 *
 * The model has FOUR components per asset class:
 *
 *   1. executionFeeBps  — the broker / venue fee for executing the trade.
 *   2. slippageBps      — expected market-impact slippage based on trade
 *                         size vs the asset class's typical market depth.
 *   3. spreadBps        — the bid-ask spread the trade crosses.
 *   4. methodMultiplier — a multiplier applied to (1)+(2) based on the
 *                         execution methodology selected under §29.5
 *                         (VWAP, TWAP, RFQ, negotiated_block, algorithmic).
 *
 * Total cost (USD) for a single action is:
 *
 *   cost = amount × [ (executionBps + slippageBps) × methodMultiplier
 *                     + spreadBps ] / 10_000
 *
 * All fee tables are constants (§11 determinism — every validator computes
 * the identical cost for the identical action).
 */

// ============================================================
// §29.5 Fee Model Types
// ============================================================

/** Per-asset-class fee components (all in basis points; 1 bp = 0.01%). */
export interface FeeModel {
  /** §29.5 Broker / venue execution fee (bps) per asset class. */
  executionFeeBps: Record<string, number>;
  /** §29.5 Expected market-impact slippage (bps) per asset class. */
  slippageBps: Record<string, number>;
  /** §29.5 Method multiplier (dimensionless) applied to (execution + slippage). */
  methodMultiplier: Record<string, number>;
  /** §29.5 Bid-ask spread estimate (bps) per asset class. */
  spreadBps: Record<string, number>;
}

/**
 * §29.5 Constitutional Fee Model — the default fee table applied to every
 * rebalancing action unless the Constitutional Council has approved a
 * bespoke schedule for a specific counterparty / venue.
 *
 * Fee values reflect institutional market realities (LBMA gold execution
 * runs ~5 bps all-in for blocks; silver is less liquid so ~7 bps; cash
 * transfers are free; sovereign T-bill execution ~2 bps).
 */
export const CONSTITUTIONAL_FEE_MODEL: FeeModel = {
  executionFeeBps: {
    cash: 0,           // 0 bps — no execution cost for cash transfers
    sovereign: 2,      // 2 bps — T-bill execution
    gold: 5,           // 5 bps — LBMA gold execution
    silver: 7,         // 7 bps — silver execution (less liquid than gold)
    stablecoin: 3,     // 3 bps — stablecoin redemption/mint
    fiat_fx: 4,        // 4 bps — FX conversion for fiat currencies
  },
  slippageBps: {
    cash: 0,           // no slippage on cash
    sovereign: 1,      // T-bill market is deep, minimal slippage
    gold: 3,           // gold has deep market, low slippage
    silver: 8,         // silver less deep → higher slippage
    stablecoin: 2,     // stablecoin redemptions have predictable slippage
    fiat_fx: 2,        // FX is highly liquid
  },
  methodMultiplier: {
    VWAP: 1.0,         // baseline methodology (§29.5 default)
    TWAP: 1.2,         // TWAP takes longer, slightly higher cost
    RFQ: 0.8,          // RFQ can get better pricing for large blocks
    negotiated_block: 1.5, // negotiated blocks carry premium
    algorithmic: 1.1,  // algorithmic execution between VWAP and TWAP
  },
  spreadBps: {
    cash: 0,           // no spread on cash
    sovereign: 1,      // T-bill spread
    gold: 2,           // tight gold spreads (LBMA)
    silver: 5,         // wider silver spreads
    stablecoin: 1,     // stablecoin mint/redeem spread
    fiat_fx: 1,        // FX spread
  },
};

// ============================================================
// Per-Action Fee Breakdown
// ============================================================

/** A single line-item in a fee breakdown (used for audit / UI). */
export interface FeeBreakdownLine {
  /** Fee component name (e.g. "execution", "slippage", "spread"). */
  component: string;
  /** Cost in basis points (post-method-multiplier where applicable). */
  bps: number;
  /** Cost in USD. */
  usd: number;
}

/** Full per-action fee breakdown returned by `computeRebalanceFee`. */
export interface FeeBreakdown {
  /** Asset class the fee was computed for. */
  assetClass: string;
  /** Notional amount the fee was computed on (USD). */
  amountUsd: number;
  /** §29.5 Execution methodology applied. */
  executionMethod: string;
  /** Broker / venue execution fee (USD). */
  executionFee: number;
  /** Market-impact slippage cost (USD). */
  slippageCost: number;
  /** Bid-ask spread cost (USD). */
  spreadCost: number;
  /** Total cost (execution + slippage + spread, USD). */
  totalCost: number;
  /** Total cost in basis points (totalCost / amountUsd × 10_000). */
  totalBps: number;
  /** Itemised breakdown for audit / UI display. */
  breakdown: FeeBreakdownLine[];
}

/**
 * §29.5 Compute the comprehensive fee for a single rebalancing action.
 *
 * Formula:
 *
 *   executionCost_usd  = amountUsd × executionBps × methodMultiplier / 10_000
 *   slippageCost_usd   = amountUsd × slippageBps  × methodMultiplier / 10_000
 *   spreadCost_usd     = amountUsd × spreadBps                     / 10_000
 *   totalCost_usd      = executionCost_usd + slippageCost_usd + spreadCost_usd
 *   totalBps           = totalCost_usd / amountUsd × 10_000
 *
 * Notes:
 *   • The method multiplier scales execution AND slippage (slower / faster
 *     execution changes both the broker fee and the market impact), but
 *     NOT the spread (the spread is a property of the asset class, not
 *     the execution method).
 *   • Unknown asset classes fall back to a conservative default
 *     (10 bps execution, 5 bps slippage, 2 bps spread) so the fee engine
 *     never silently returns 0 for a typo.
 *   • Unknown execution methods default to VWAP (multiplier 1.0).
 *   • If `amountUsd <= 0`, all costs are 0 (no trade → no fee).
 *
 * @param assetClass      Asset class key from `ReserveAsset.assetClass`
 *                        ("cash" | "sovereign" | "sukuk" | "gold" |
 *                         "silver" | "stablecoin") OR "fiat_fx" for FX
 *                         conversions.
 * @param amountUsd       Notional amount of the trade (USD).
 * @param executionMethod §29.5 execution methodology (default "TWAP" to
 *                        match `generateRebalancePlan`'s historical default).
 * @param model           Override the default fee model (used by tests / sims).
 */
export function computeRebalanceFee(
  assetClass: string,
  amountUsd: number,
  executionMethod: string = "TWAP",
  model: FeeModel = CONSTITUTIONAL_FEE_MODEL,
): FeeBreakdown {
  // Cash has zero cost regardless of amount.
  if (amountUsd <= 0) {
    return {
      assetClass,
      amountUsd,
      executionMethod,
      executionFee: 0,
      slippageCost: 0,
      spreadCost: 0,
      totalCost: 0,
      totalBps: 0,
      breakdown: [
        { component: "execution", bps: 0, usd: 0 },
        { component: "slippage",  bps: 0, usd: 0 },
        { component: "spread",    bps: 0, usd: 0 },
      ],
    };
  }

  // Look up fee components, with conservative defaults for unknown keys.
  // "sukuk" maps to the "sovereign" fee bucket (same Tier 2 haircut class).
  const feeKey = assetClass === "sukuk" ? "sovereign" : assetClass;
  const executionBps = model.executionFeeBps[feeKey] ?? 10;
  const slippageBps = model.slippageBps[feeKey] ?? 5;
  const spreadBps = model.spreadBps[feeKey] ?? 2;
  const methodMult = model.methodMultiplier[executionMethod] ?? 1.0;

  // Compute USD amounts.
  const executionFee = (amountUsd * executionBps * methodMult) / 10_000;
  const slippageCost = (amountUsd * slippageBps * methodMult) / 10_000;
  const spreadCost = (amountUsd * spreadBps) / 10_000;
  const totalCost = executionFee + slippageCost + spreadCost;
  const totalBps = (totalCost / amountUsd) * 10_000;

  return {
    assetClass,
    amountUsd,
    executionMethod,
    executionFee,
    slippageCost,
    spreadCost,
    totalCost,
    totalBps,
    breakdown: [
      { component: "execution", bps: executionBps * methodMult, usd: executionFee },
      { component: "slippage",  bps: slippageBps  * methodMult, usd: slippageCost },
      { component: "spread",    bps: spreadBps,                usd: spreadCost },
    ],
  };
}

/**
 * §29.5 Aggregate fee breakdown for an entire rebalancing plan.
 *
 * Sums the per-action breakdowns and reports the total cost in USD and
 * in basis points (total cost / total notional traded).
 */
export interface AggregatedFeeBreakdown {
  /** Total execution fee across all actions (USD). */
  totalExecutionFee: number;
  /** Total slippage cost across all actions (USD). */
  totalSlippageCost: number;
  /** Total spread cost across all actions (USD). */
  totalSpreadCost: number;
  /** Grand total cost (USD). */
  totalCost: number;
  /** Total notional traded across all actions (USD). */
  totalNotional: number;
  /** Blended cost in basis points (totalCost / totalNotional × 10_000). */
  blendedBps: number;
  /** Per-action breakdowns (preserves order). */
  perAction: FeeBreakdown[];
}

/**
 * §29.5 Aggregate per-action fee breakdowns into a single plan-level view.
 *
 * @param perAction The fee breakdowns for each action in a rebalance plan.
 */
export function aggregateRebalanceFees(
  perAction: FeeBreakdown[]
): AggregatedFeeBreakdown {
  let totalExecutionFee = 0;
  let totalSlippageCost = 0;
  let totalSpreadCost = 0;
  let totalNotional = 0;
  for (const f of perAction) {
    totalExecutionFee += f.executionFee;
    totalSlippageCost += f.slippageCost;
    totalSpreadCost += f.spreadCost;
    totalNotional += f.amountUsd;
  }
  const totalCost = totalExecutionFee + totalSlippageCost + totalSpreadCost;
  const blendedBps = totalNotional > 0 ? (totalCost / totalNotional) * 10_000 : 0;
  return {
    totalExecutionFee,
    totalSlippageCost,
    totalSpreadCost,
    totalCost,
    totalNotional,
    blendedBps,
    perAction,
  };
}

/**
 * §6 Trade Suppression Rule (Phase 3 rebalancing-policy.md)
 *
 * Do not execute a trade if:
 *   expected_benefit ≤ transaction_cost + slippage + market_impact + risk_buffer
 *
 * unless an emergency constitutional condition exists.
 *
 * This centralizes the suppression rule so callers don't reimplement it.
 * Used by execution-engine.ts validateRebalanceProposal and the test suite.
 */
export function shouldSuppressTrade(
  expectedBenefitUsd: number,
  assetClass: string,
  tradeValueUsd: number,
  method: string = "TWAP",
  marketImpactBps: number = 0,
  activeEmergencyOverrides: readonly string[] = []
): { suppress: boolean; reason: string; totalCostUsd: number; benefitUsd: number } {
  // Emergency override — never suppress if an emergency condition is active
  if (activeEmergencyOverrides.length > 0) {
    return {
      suppress: false,
      reason: `emergency override active: ${activeEmergencyOverrides.join(", ")}`,
      totalCostUsd: 0,
      benefitUsd: expectedBenefitUsd,
    };
  }

  const fee = computeRebalanceFee(assetClass, tradeValueUsd, method);
  const riskBufferUsd = (tradeValueUsd * 2) / 10_000; // RISK_BUFFER_BPS = 2 (Phase 3 §6.2)
  const marketImpactUsd = (tradeValueUsd * marketImpactBps) / 10_000;
  const totalCostUsd = fee.totalCost + riskBufferUsd + marketImpactUsd;

  const suppress = expectedBenefitUsd <= totalCostUsd;
  return {
    suppress,
    reason: suppress
      ? `benefit $${expectedBenefitUsd.toFixed(2)} ≤ cost $${totalCostUsd.toFixed(2)} (fee ${fee.totalCost.toFixed(2)} + risk_buffer ${riskBufferUsd.toFixed(2)} + impact ${marketImpactUsd.toFixed(2)})`
      : "benefit exceeds cost",
    totalCostUsd,
    benefitUsd: expectedBenefitUsd,
  };
}
