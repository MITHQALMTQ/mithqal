/**
 * §23-29 DYNAMIC RESERVE ALLOCATION — shared module (Task 4-b).
 *
 * Previously the dynamic allocation logic that adjusts fiat/bullion/stablecoin
 * ratios based on reserve ratio + gold volatility lived INLINE inside
 * `/api/transparency/route.ts` (lines 71-130). Meanwhile
 * `/api/reserve/status/route.ts` used FIXED dollar amounts ($29.25M cash,
 * $13.5M sov, etc.). The two endpoints therefore disagreed on what "the
 * reserve composition" actually is.
 *
 * This module extracts the dynamic logic into a single pure function so that
 * every caller — the transparency API, the reserve-status API, the stress
 * test suites, and the stability comparison — derives the SAME target
 * allocation from the SAME inputs.
 *
 * KEY DESIGN INVARIANTS (must hold across all callers):
 *
 *   1. The LAYER RATIOS (fiat/bullion/stablecoin) and the BULLION SPLIT
 *      (gold/silver) are DYNAMIC — they respond to reserve ratio and gold
 *      volatility, clamped to the constitutional ranges in §23.3 and §25.2.
 *
 *   2. The PHYSICAL BULLION QUANTITIES are FIXED at 2,122.86 oz gold and
 *      36,758 oz silver (Task 2-a fix — the institution holds a fixed
 *      physical position; it does NOT buy/sell gold in response to every
 *      price tick). Only `priceUsd` moves.
 *
 *   3. The CASH AMOUNT is set to $29,250,000 — the v19.0.2 over-
 *      collateralization baseline that clears the §4 PAR-based reserve
 *      ratio at the 102% policy target with the engine's actual R_a formula
 *      (Task 3-a). Cash is a Tier 1 reserve; adjusting it via dynamic
 *      ratios would risk breaching §4, so we keep the cash baseline fixed
 *      and let the dynamic ratios drive the TARGET allocation (what we
 *      aim for) — the gap between current and target is what triggers
 *      rebalancing under §29.
 *
 *   4. Sovereign and stablecoin dollar values are derived from the dynamic
 *      fiat / stablecoin ratios × totalReserve so the API's reported
 *      "target layer weights" stay consistent with the live reserve total.
 *
 * The returned `reserveAssets` array is ready to feed directly into
 * `computeMonetaryStateV19` (it has the right haircuts, counterparty
 * scores, stress coefficients, and durations per §6-§8).
 */

import { HAIRCUTS, type ReserveAsset } from "./monetary-engine-v19";

// ============================================================
// §23-29 Constitutional Constants
// ============================================================

/** §24 Fiat sub-allocation: cash (2/3 of fiat) + sovereign (1/3 of fiat). */
export const FIAT_CASH_SHARE = 0.667;
/** §24 Fiat sub-allocation: sovereign complement of `FIAT_CASH_SHARE`. */
export const FIAT_SOVEREIGN_SHARE = 0.333;

/**
 * §23.1 Constitutional LAYER RANGES (these are BOUNDS, not targets).
 * The dynamic allocation MUST clamp to these ranges before normalization.
 */
export const LAYER_RANGES = {
  fiat: { min: 0.70, max: 0.80 },
  bullion: { min: 0.15, max: 0.25 },
  stablecoin: { min: 0.02, max: 0.08 },
} as const;

/**
 * §23.1 Policy TARGETS (the centre of each band — what we revert to when
 * no dynamic adjustment is warranted).
 */
export const LAYER_POLICY_TARGETS = {
  fiat: 0.75,
  bullion: 0.20,
  stablecoin: 0.05,
} as const;

/**
 * §25.2 Bullion sub-allocation band for gold (φ_t).
 * Silver is the complement (1 − φ_t), bounded to [0.05, 0.40].
 */
export const BULLION_GOLD_BAND = { min: 0.60, max: 0.95 } as const;

/**
 * §25.2 Policy target for gold's share of the bullion layer (φ_t default).
 */
export const BULLION_GOLD_POLICY_TARGET = 0.80;

/**
 * FIXED PHYSICAL BULLION HOLDINGS (Task 2-a invariant).
 * These quantities NEVER change in gold/silver price scenarios; only
 * `priceUsd` moves. Rebalancing (§29) buys/sells to move the dollar value
 * toward the dynamic target, but the per-ounce physical quantity reported
 * in the reserveAssets array always starts from these fixed positions.
 */
export const FIXED_GOLD_OZ = 2_122.86;     // ≈ $8.654M at $4,076.9/oz
export const FIXED_SILVER_OZ = 36_758;     // ≈ $2.160M at $58.76/oz

/**
 * §4 Over-collateralization baseline (v19.0.2). Cash is set so that the
 * PAR-based reserve ratio RR = R_a / (S × PAR) clears the 102% policy
 * target at baseline, accounting for the engine's actual R_a formula
 * (which applies §7 counterparty score multipliers — see Task 3-a notes).
 *
 * Cash is NOT subject to dynamic adjustment — it is the Tier 1 anchor.
 * The dynamic fiat ratio instead governs the TARGET allocation reported
 * to clients and used by the rebalance engine.
 */
export const FIXED_CASH_USD = 32_450_000; // v19.0.9: raised to 8% buffer (constitutional Monte Carlo optimal — 99% survival)

// ============================================================
// Types
// ============================================================

export interface ReserveAllocationInput {
  /** Total reserve value in USD (R_m). Drives the target dollar amounts. */
  totalReserve: number;
  /** Live gold price (USD/oz). Drives bullion market value. */
  goldPrice: number;
  /** Live silver price (USD/oz). Drives bullion market value. */
  silverPrice: number;
  /**
   * Current §4 reserve ratio in PERCENT, e.g. 102.07 (RR_target = 100,
   * §53 policy target = 102). Used to shift fiat/bullion mix dynamically
   * per §29.1.
   */
  reserveRatio: number;
  /**
   * Current EWMA gold volatility (decimal, e.g. 0.015 for 1.5%). Used to
   * adjust the gold/silver split within the bullion layer per §25.2 / §17.
   */
  goldVolatility: number;
}

export interface ReserveAllocationResult {
  // ---- Layer ratios (dynamic, clamped to §23 ranges, normalized to 1.0) ----
  fiatRatio: number;          // 0.70-0.80
  bullionRatio: number;       // 0.15-0.25
  stablecoinRatio: number;    // 0.02-0.08
  // ---- Bullion sub-allocation (§25.2: φ_t dynamic in [0.60, 0.95]) ----
  goldShare: number;          // φ_t
  silverShare: number;        // 1 − φ_t
  // ---- TARGET dollar values (derived from ratios × totalReserve) ----
  cashValue: number;
  sovereignValue: number;
  goldValue: number;
  silverValue: number;
  stablecoinValue: number;
  // ---- PHYSICAL quantities (FIXED — do NOT derive from price) ----
  goldQtyOz: number;          // FIXED_GOLD_OZ = 2,122.86 oz
  silverQtyOz: number;        // FIXED_SILVER_OZ = 36,758 oz
  // ---- ReserveAssets array ready for computeMonetaryStateV19 ----
  reserveAssets: ReserveAsset[];
  // ---- Metadata for transparency API ----
  ranges: {
    fiat: { min: number; max: number };
    bullion: { min: number; max: number };
    stablecoin: { min: number; max: number };
  };
  bullionBand: { min: number; max: number };
  isDynamic: true;
  /** Human-readable list of dynamic adjustments applied (for audit / UI). */
  adjustments: string[];
}

// ============================================================
// Core function
// ============================================================

/**
 * §23-29 Compute the DYNAMIC reserve allocation from live conditions.
 *
 * Algorithm:
 *   1. Start with policy targets (75% fiat, 20% bullion, 5% stablecoin).
 *   2. Adjust fiat/bullion mix based on reserve ratio
 *      (RR > 110% → +2% bullion; RR < 102% → +2% fiat).
 *   3. Adjust gold/silver split based on gold EWMA volatility
 *      (high vol → 75/25; low vol → 85/15; default 80/20).
 *   4. Clamp every ratio to its constitutional range.
 *   5. Normalize layer ratios to 100% (§23.3 invariant).
 *   6. Compute TARGET dollar values from ratios × totalReserve.
 *   7. Build the reserveAssets array — BUT gold/silver use FIXED physical
 *      quantities (2,122.86 oz / 36,758 oz); their dollar value is
 *      qty × priceUsd, NOT (totalReserve × pct) / priceUsd. This is the
 *      Task 2-a fix. Cash is also fixed at $29.25M (v19.0.2 §4 over-
 *      collateralization baseline). The sovereign and stablecoin amounts
 *      are derived from their target ratios × totalReserve so the
 *      reported TARGET allocation stays consistent.
 *
 * @param input Live conditions (total reserve, prices, RR, vol).
 * @returns     The allocation result + reserveAssets array.
 */
export function computeDynamicReserveAllocation(
  input: ReserveAllocationInput
): ReserveAllocationResult {
  const { totalReserve, goldPrice, silverPrice, reserveRatio, goldVolatility } = input;
  const adjustments: string[] = [];

  // ---- Step 1: policy targets (§23.1) ----
  let fiatRatio: number = LAYER_POLICY_TARGETS.fiat;        // 0.75
  let bullionRatio: number = LAYER_POLICY_TARGETS.bullion;  // 0.20
  let stablecoinRatio: number = LAYER_POLICY_TARGETS.stablecoin; // 0.05

  // ---- Step 2: dynamic adjustment based on reserve ratio (§4, §29.1) ----
  // If ratio is very high (>110%), institution can afford more bullion
  // (non-sovereign anchor) → shift 2% from fiat to bullion.
  // If ratio is below the 102% policy target, shift 2% from bullion to
  // fiat (conservative — protect §4 over-collateralization).
  if (reserveRatio > 110) {
    fiatRatio -= 0.02;
    bullionRatio += 0.02;
    adjustments.push(
      `§29.1 RR ${reserveRatio.toFixed(2)}% > 110% → +2% bullion / −2% fiat`
    );
  } else if (reserveRatio < 102) {
    fiatRatio += 0.02;
    bullionRatio -= 0.02;
    adjustments.push(
      `§29.1 RR ${reserveRatio.toFixed(2)}% < 102% policy target → +2% fiat / −2% bullion`
    );
  } else {
    adjustments.push(
      `§29.1 RR ${reserveRatio.toFixed(2)}% within [102, 110]% band → policy targets retained`
    );
  }

  // ---- Step 3: dynamic gold/silver split within bullion (§25.2: φ_t) ----
  let goldShare: number = BULLION_GOLD_POLICY_TARGET;   // 0.80
  let silverShare: number = 1 - goldShare;              // 0.20
  if (goldVolatility > 0.03) {
    // High gold volatility → reduce gold slightly, tilt to silver.
    goldShare = 0.75;
    silverShare = 0.25;
    adjustments.push(
      `§25.2 gold EWMA vol ${(goldVolatility * 100).toFixed(2)}% > 3% → φ_t = 75% (silver 25%)`
    );
  } else if (goldVolatility < 0.005) {
    // Low volatility → increase gold (more bullion conviction).
    goldShare = 0.85;
    silverShare = 0.15;
    adjustments.push(
      `§25.2 gold EWMA vol ${(goldVolatility * 100).toFixed(2)}% < 0.5% → φ_t = 85% (silver 15%)`
    );
  } else {
    adjustments.push(
      `§25.2 gold EWMA vol ${(goldVolatility * 100).toFixed(2)}% within [0.5, 3]% → φ_t = 80% (silver 20%)`
    );
  }

  // ---- Step 4: clamp to constitutional ranges (§23.3, §25.2) ----
  fiatRatio = clamp(fiatRatio, LAYER_RANGES.fiat.min, LAYER_RANGES.fiat.max);
  bullionRatio = clamp(bullionRatio, LAYER_RANGES.bullion.min, LAYER_RANGES.bullion.max);
  stablecoinRatio = clamp(stablecoinRatio, LAYER_RANGES.stablecoin.min, LAYER_RANGES.stablecoin.max);
  goldShare = clamp(goldShare, BULLION_GOLD_BAND.min, BULLION_GOLD_BAND.max);
  silverShare = clamp(1 - goldShare, 0.05, 0.40);

  // ---- Step 5: normalize layer ratios to 100% (§23.3 invariant) ----
  const layerSum = fiatRatio + bullionRatio + stablecoinRatio;
  fiatRatio /= layerSum;
  bullionRatio /= layerSum;
  stablecoinRatio /= layerSum;

  // ---- Step 6: compute TARGET dollar values from ratios × totalReserve ----
  const fiatValue = totalReserve * fiatRatio;
  const bullionValue = totalReserve * bullionRatio;
  const stablecoinValue = totalReserve * stablecoinRatio;
  const targetGoldValue = bullionValue * goldShare;
  const targetSilverValue = bullionValue * silverShare;
  const targetCashValue = fiatValue * FIAT_CASH_SHARE;
  const targetSovereignValue = fiatValue * FIAT_SOVEREIGN_SHARE;

  // ---- Step 7: build reserveAssets array ----
  // IMPORTANT (Task 2-a + 3-a):
  //   • goldQtyOz / silverQtyOz are FIXED physical quantities — their
  //     dollar value is qty × priceUsd, NOT target_value / priceUsd.
  //   • cashValue is FIXED at $29.25M (v19.0.2 §4 over-collateralization
  //     baseline). The dynamic fiat ratio reports the TARGET allocation;
  //     rebalancing (§29) is what would move cash toward the target.
  //   • sovereign and stablecoin dollar values are derived from their
  //     target ratios × totalReserve so the API's "current composition"
  //     stays consistent with the live reserve total and the dynamic
  //     targets reported alongside.
  const goldQtyOz = FIXED_GOLD_OZ;
  const silverQtyOz = FIXED_SILVER_OZ;
  const cashValue = FIXED_CASH_USD;
  const sovereignValue = targetSovereignValue;
  const stablecoinValueFinal = stablecoinValue;
  const goldValue = goldQtyOz * goldPrice;
  const silverValue = silverQtyOz * silverPrice;

  const reserveAssets: ReserveAsset[] = [
    // Fiat Layer (§24): cash + sovereign
    {
      id: "cash-1",
      name: "Central-bank cash",
      assetClass: "cash",
      quantity: cashValue,
      priceUsd: 1,
      haircut: HAIRCUTS.cash,
      counterpartyScore: 1.00,
      stressCoefficient: 0.95,
      modifiedDuration: 0,
    },
    {
      id: "sov-1",
      name: "US T-bills ≤1yr",
      assetClass: "sovereign",
      quantity: sovereignValue,
      priceUsd: 1,
      haircut: HAIRCUTS.sovereign,
      counterpartyScore: 0.99,
      stressCoefficient: 0.90,
      modifiedDuration: 0.5,
    },
    // Bullion Layer (§25): gold + silver — FIXED physical quantities.
    {
      id: "gold-1",
      name: "Allocated gold",
      assetClass: "gold",
      quantity: goldQtyOz,
      priceUsd: goldPrice,
      haircut: HAIRCUTS.gold,
      counterpartyScore: 1.00,
      stressCoefficient: 0.85,
      modifiedDuration: 0,
    },
    {
      id: "silver-1",
      name: "Allocated silver",
      assetClass: "silver",
      quantity: silverQtyOz,
      priceUsd: silverPrice,
      haircut: HAIRCUTS.silver,
      counterpartyScore: 1.00,
      stressCoefficient: 0.80,
      modifiedDuration: 0,
    },
    // Stablecoin Layer (§26)
    {
      id: "stab-1",
      name: "Regulated stablecoins",
      assetClass: "stablecoin",
      quantity: stablecoinValueFinal,
      priceUsd: 1,
      haircut: HAIRCUTS.stablecoin,
      counterpartyScore: 0.96,
      stressCoefficient: 0.80,
      modifiedDuration: 0,
    },
  ];

  return {
    fiatRatio,
    bullionRatio,
    stablecoinRatio,
    goldShare,
    silverShare,
    cashValue,
    sovereignValue,
    goldValue,
    silverValue,
    stablecoinValue: stablecoinValueFinal,
    goldQtyOz,
    silverQtyOz,
    reserveAssets,
    ranges: {
      fiat: { min: LAYER_RANGES.fiat.min, max: LAYER_RANGES.fiat.max },
      bullion: { min: LAYER_RANGES.bullion.min, max: LAYER_RANGES.bullion.max },
      stablecoin: { min: LAYER_RANGES.stablecoin.min, max: LAYER_RANGES.stablecoin.max },
    },
    bullionBand: { min: BULLION_GOLD_BAND.min, max: BULLION_GOLD_BAND.max },
    isDynamic: true,
    adjustments,
  };
}

// ============================================================
// Helpers
// ============================================================

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/**
 * Convenience helper: derive the CURRENT layer weights from a list of
 * reserveAssets (used by the rebalance engine to compare current vs the
 * target layer weights computed by `computeDynamicReserveAllocation`).
 *
 *   {"fiat": cash + sovereign, "bullion": gold + silver, "stablecoin": stab}
 * each divided by the total market value.
 */
export function deriveCurrentLayerWeights(
  assets: ReserveAsset[]
): Map<string, number> {
  let fiat = 0, bullion = 0, stablecoin = 0;
  for (const a of assets) {
    const mv = a.quantity * a.priceUsd;
    if (a.assetClass === "cash" || a.assetClass === "sovereign" || a.assetClass === "sukuk") {
      fiat += mv;
    } else if (a.assetClass === "gold" || a.assetClass === "silver") {
      bullion += mv;
    } else if (a.assetClass === "stablecoin") {
      stablecoin += mv;
    }
  }
  const total = fiat + bullion + stablecoin;
  const w = new Map<string, number>();
  w.set("fiat", total > 0 ? fiat / total : 0);
  w.set("bullion", total > 0 ? bullion / total : 0);
  w.set("stablecoin", total > 0 ? stablecoin / total : 0);
  return w;
}

/**
 * Convenience helper: derive the CURRENT gold share of the bullion layer
 * (φ_t_current) from a list of reserveAssets. Used by the rebalance engine
 * to detect §25.2 band breaches.
 */
export function deriveCurrentBullionGoldShare(
  assets: ReserveAsset[]
): number {
  let goldMv = 0, silverMv = 0;
  for (const a of assets) {
    if (a.assetClass === "gold") goldMv += a.quantity * a.priceUsd;
    else if (a.assetClass === "silver") silverMv += a.quantity * a.priceUsd;
  }
  const bullionTotal = goldMv + silverMv;
  return bullionTotal > 0 ? goldMv / bullionTotal : 0;
}

/**
 * Convenience helper: build the target layer-weights Map from an
 * allocation result (so callers can pass it directly into
 * `generateCrossAssetRebalancePlan`).
 */
export function deriveTargetLayerWeights(
  alloc: ReserveAllocationResult
): Map<string, number> {
  const w = new Map<string, number>();
  w.set("fiat", alloc.fiatRatio);
  w.set("bullion", alloc.bullionRatio);
  w.set("stablecoin", alloc.stablecoinRatio);
  return w;
}
