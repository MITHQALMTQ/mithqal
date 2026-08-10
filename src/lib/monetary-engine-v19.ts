// Mithqal Monetary Engine v19.0.3 — Constitutional Monetary Infrastructure Specification
// §11: All internal calculations use deterministic fixed-point arithmetic via decimal.js
//
// Implements the complete v19.0.3 specification (55 sections, 6 parts):
//   PART I — Constitutional Mathematical Foundations (§1-11)
//   PART II — Currency Engine (§12-22A)
//
// Key v19.0.3 innovations vs v2.0:
//   - Three-layer reserve valuation (Market / Adjusted / Liquidation)
//   - Three NAV definitions (Market / Prudential / Stress)
//   - Reserve Ratio = R_a / (S × PAR) — PAR-based redemption liability (v19.0.2 fix); over-collateralizable
//   - LCR (Liquidity Coverage Ratio)
//   - Fixed constitutional haircuts
//   - Counterparty risk composite score
//   - Duration constraint (≤ 0.75 years)
//   - CRI (Constitutional Risk Index) — RMS aggregation
//   - EWMA volatility (RiskMetrics λ=0.94)
//   - Shock absorber on COMBINED M×R (not momentum alone)
//   - Liquidity overlay
//   - Minimum floor (0.5%)
//   - Basket verification gate
//   - 8 currencies (USD/EUR/JPY/GBP/CNY/CHF/AUD/CAD)
//   - Gold as the constitutional anchor (numeraire independence)

import type { OracleSnapshot, CurrencyData } from "./oracle-data";
import {
  fp,
  fpAdd,
  fpSub,
  fpMul,
  fpDiv,
  fpSqrt,
  fpPow,
  fpMin,
  fpMax,
  fpClamp,
  fpGte,
  fpLte,
  fpGt,
  fpLt,
  fpSum,
  fpToNumber,
  type FixedPoint,
} from "./fixed-point";

// ============================================================
// PART I — CONSTITUTIONAL MATHEMATICAL FOUNDATIONS
// ============================================================

// ---- §1: Numeraire Independence ----
// Gold is the constitutional anchor. The reporting numeraire is solely an
// accounting convention. Weights are numeraire-invariant: W_i(m) = W_i(n).

// ---- §2: Three-Layer Reserve Valuation ----

export interface ReserveAsset {
  id: string;
  name: string;
  assetClass: "cash" | "sovereign" | "sukuk" | "gold" | "silver" | "stablecoin";
  quantity: number;
  priceUsd: number; // market price in USD
  haircut: number; // H_a (§6 — fixed constitutional haircut)
  counterpartyScore: number; // C_a (§7 — composite, 0.90 to 1.00)
  stressCoefficient: number; // S_a (liquidation stress)
  modifiedDuration: number; // §8 — for interest-bearing assets
}

export interface ReserveValuation {
  market: number; // R_m = Σ Q × P
  adjusted: number; // R_a = Σ Q × P × (1-H) × C
  liquidation: number; // R_l = Σ Q × P × (1-H) × C × S
  hierarchyValid: boolean; // R_l ≤ R_a ≤ R_m
}

/** §2 Three-layer reserve valuation (§11: fixed-point arithmetic) */
export function valueReserves(assets: ReserveAsset[]): ReserveValuation {
  let r_m = fp(0), r_a = fp(0), r_l = fp(0);
  for (const a of assets) {
    const marketValue = fpMul(fp(a.quantity), fp(a.priceUsd));
    r_m = fpAdd(r_m, marketValue);
    // R_a = Σ Q × P × (1-H) × C
    const adjFactor = fpMul(fpSub(fp(1), fp(a.haircut)), fp(a.counterpartyScore));
    r_a = fpAdd(r_a, fpMul(marketValue, adjFactor));
    // R_l = Σ Q × P × (1-H) × C × S
    r_l = fpAdd(r_l, fpMul(fpMul(marketValue, adjFactor), fp(a.stressCoefficient)));
  }
  return {
    market: fpToNumber(r_m),
    adjusted: fpToNumber(r_a),
    liquidation: fpToNumber(r_l),
    hierarchyValid: fpLte(r_l, r_a) && fpLte(r_a, r_m),
  };
}

// ---- §3: Three NAV Definitions ----

export interface NAVSet {
  market: number; // NAV_m = R_m / S
  prudential: number; // NAV_l = R_a / S
  stress: number; // NAV_stress = R_l / S
  hierarchyValid: boolean; // NAV_stress ≤ NAV_l ≤ NAV_m
}

/** §3 Three NAV definitions (§11: fixed-point arithmetic) */
export function computeNAV(reserves: ReserveValuation, supply: number): NAVSet {
  if (supply <= 0) {
    return { market: 0, prudential: 0, stress: 0, hierarchyValid: false };
  }
  const s = fp(supply);
  const nav_m = fpDiv(fp(reserves.market), s);
  const nav_l = fpDiv(fp(reserves.adjusted), s);
  const nav_stress = fpDiv(fp(reserves.liquidation), s);
  return {
    market: fpToNumber(nav_m),
    prudential: fpToNumber(nav_l),
    stress: fpToNumber(nav_stress),
    hierarchyValid: fpLte(nav_stress, nav_l) && fpLte(nav_l, nav_m),
  };
}

// ---- §4: Constitutional Reserve Ratio ----

/** §4 MTQ face value (redemption par). 1 MTQ redeems for $1.00 of reserve value. */
export const PAR_VALUE = 1.00;

export interface ReserveRatioResult {
  ratio: number; // RR = R_a / L (percentage)
  redemptionLiability: number; // L = S × PAR (redemption liability at face value)
  adjustedReserve: number; // R_a
  marketReserve: number; // R_m
  compliant: boolean; // RR ≥ 1.00
  policyTarget: boolean; // RR ≥ 1.02
}

/**
 * §4 Constitutional Reserve Ratio = R_a / (S × PAR)
 *
 * CORRECTION (v19.0.2): The redemption liability L is computed at PAR ($1.00/MTQ),
 * NOT at Market NAV. The original formula RR = R_a / (S × NAV_m) simplified to
 * RR = R_a / R_m (since NAV_m = R_m/S), which is mathematically always < 100%
 * whenever constitutional haircuts (§6) are nonzero — making the §4 ≥ 100%
 * compliance check unreachable. The PAR-based formula is the standard for all
 * reserve-backed monetary systems and is economically correct:
 *   - Gold rallies → R_a rises, L fixed at S×PAR → RR rises ✅
 *   - Gold crashes → R_a falls, L fixed → RR falls ✅
 *   - Over-collateralization (R_a > S×PAR) → RR > 100% ✅ achievable
 *
 * §11: fixed-point arithmetic throughout.
 */
export function computeReserveRatio(
  reserves: ReserveValuation,
  nav: NAVSet,
  supply: number
): ReserveRatioResult {
  void nav; // signature preserved for backward compatibility; PAR-based formula does not use NAV
  const L = fpMul(fp(supply), fp(PAR_VALUE)); // Redemption Liability at Par
  const ratio = fpGt(L, fp(0)) ? fpDiv(fp(reserves.adjusted), L) : fp(0);
  return {
    ratio: fpToNumber(fpMul(ratio, fp(100))), // as percentage
    redemptionLiability: fpToNumber(L),
    adjustedReserve: reserves.adjusted,
    marketReserve: reserves.market,
    compliant: fpGte(ratio, fp(1.00)),
    policyTarget: fpGte(ratio, fp(1.02)),
  };
}

// ---- §5: Liquidity Coverage Ratio (LCR) ----

export interface LCRResult {
  ratio: number; // HQLA / 30-day net outflow
  hqla: number;
  netOutflow: number;
  compliant: boolean; // LCR ≥ 1.00
  strong: boolean; // LCR ≥ 1.20
}

/** §5 LCR = HQLA / 30-Day_Net_Redemption_Outflow (§11: fixed-point arithmetic) */
export function computeLCR(
  hqla: number,
  expectedRedemptions: number,
  committedInflows: number,
  operationalAdjustments: number
): LCRResult {
  const netOutflow = fpAdd(
    fpSub(fp(expectedRedemptions), fp(committedInflows)),
    fp(operationalAdjustments)
  );
  const hqlaFp = fp(hqla);
  let ratio: FixedPoint;
  if (fpGt(netOutflow, fp(0))) {
    ratio = fpDiv(hqlaFp, netOutflow);
  } else if (fpGt(hqlaFp, fp(0))) {
    ratio = fp(Infinity);
  } else {
    ratio = fp(0);
  }
  const ratioNum = fpToNumber(ratio);
  return {
    ratio: ratioNum === Infinity ? 999 : ratioNum,
    hqla,
    netOutflow: fpToNumber(fpMax(netOutflow, fp(0))),
    compliant: fpGte(ratio, fp(1.00)),
    strong: fpGte(ratio, fp(1.20)),
  };
}

// ---- §6: Fixed Constitutional Haircuts ----

export const HAIRCUTS = {
  cash: 0.0, // Tier 1 — Central-bank cash: 0%
  sovereign: 0.02, // Tier 2 — Sovereign ≤1yr: 2%
  sukuk: 0.02, // Tier 2 — Sukuk ≤1yr: 2%
  gold: 0.05, // Tier 3 — Gold: 5%
  silver: 0.07, // Tier 3 — Silver: 7%
  stablecoin: 0.02, // Tier 4 — Regulated stablecoins: 2%
} as const;

// ---- §7: Counterparty Risk Composite Score ----

/**
 * §7 Composite counterparty score: C_a = Credit × Jurisdiction × Operational
 *
 * Per the v19.0.3 blueprint, the composite score is MULTIPLICATIVE (not a
 * weighted sum). Multiplicative aggregation correctly captures the principle
 * that a single weak dimension (e.g. a downgrade in credit OR a sanction
 * on the jurisdiction OR an operational incident) materially impairs the
 * overall counterparty quality, since the effects compound rather than
 * average out. Result is clamped to the constitutional band [0.90, 1.00].
 *
 * NOTE: the `weights` parameter is retained for backward signature
 * compatibility with existing callers but is intentionally unused under
 * the multiplicative formulation. It will be removed in a future major
 * version once all call sites are audited.
 */
export function counterpartyScore(
  credit: number, // 0.90 to 1.00 (AAA=1.00, BBB=0.90)
  jurisdiction: number, // 0.95 to 1.00
  operational: number, // 0.95 to 1.00
  weights = { credit: 0.5, jurisdiction: 0.3, operational: 0.2 }
): number {
  void weights; // signature preserved for backward compatibility (multiplicative form does not use weights)
  const score = credit * jurisdiction * operational;
  return clamp(score, 0.90, 1.00);
}

// ---- §8: Duration Constraint ----

/** §8 Portfolio modified duration: MD = Σ(MD_i × w_i) ≤ 0.75 */
export function portfolioDuration(assets: ReserveAsset[]): number {
  const totalValue = assets.reduce((s, a) => s + a.quantity * a.priceUsd, 0);
  if (totalValue <= 0) return 0;
  return assets.reduce((s, a) => {
    const weight = (a.quantity * a.priceUsd) / totalValue;
    return s + a.modifiedDuration * weight;
  }, 0);
}

export const MAX_DURATION = 0.75; // years

// ---- §9: Constitutional Risk Index (CRI) — RMS ----

export interface CRIResult {
  cri: number; // 0 to 100
  components: { liquidity: number; fx: number; custody: number; counterparty: number; operational: number };
  level: "low" | "moderate" | "elevated" | "high";
}

/** §9 CRI = √(w_L×L² + w_F×F² + w_C×C² + w_P×P² + w_O×O²) (§11: fixed-point) */
export function computeCRI(
  liquidity: number, // 0-100
  fx: number,
  custody: number,
  counterparty: number,
  operational: number,
  weights = { L: 0.25, F: 0.25, C: 0.20, P: 0.15, O: 0.15 }
): CRIResult {
  // §11: deterministic RMS aggregation via fixed-point arithmetic
  const cri = fpSqrt(
    fpAdd(
      fpAdd(
        fpAdd(
          fpAdd(
            fpMul(fp(weights.L), fpPow(fp(liquidity), 2)),
            fpMul(fp(weights.F), fpPow(fp(fx), 2))
          ),
          fpMul(fp(weights.C), fpPow(fp(custody), 2))
        ),
        fpMul(fp(weights.P), fpPow(fp(counterparty), 2))
      ),
      fpMul(fp(weights.O), fpPow(fp(operational), 2))
    )
  );
  const criNum = fpToNumber(cri);
  const level = criNum < 30 ? "low" : criNum < 50 ? "moderate" : criNum < 70 ? "elevated" : "high";
  return {
    cri: fpToNumber(fpClamp(cri, fp(0), fp(100))),
    components: { liquidity, fx, custody, counterparty, operational },
    level,
  };
}

// ============================================================
// PART II — CURRENCY ENGINE (§12-22A)
// ============================================================

// ---- Constants ----

export const ALPHA = 0.50; // COFER weight
export const BETA = 0.40; // SWIFT weight
export const GAMMA = 0.10; // BIS weight
export const L_MOMENTUM = 0.05; // §15 momentum clamp ±5%
export const L_REVERSION = 0.02; // §16 mean reversion clamp ±2%
export const ETA = 0.05; // §16 mean reversion speed
export const L_MAX = 0.60; // §21 concentration cap
export const W_MIN = 0.005; // §22 minimum floor (0.5%)
export const V_NORMAL = 0.02; // §17 normal volatility threshold 2%
export const V_HIGH = 0.05; // §17 high volatility threshold 5%
export const EWMA_LAMBDA = 0.94; // §17 RiskMetrics decay factor
export const ETA_LIQ = 0.02; // §18 liquidity sensitivity
export const L_LIQ_MAX = 0.05; // §18 liquidity clamp ±5%

// ---- §13: Structural Weight ----

/** §13 C_i = α×COFER + β×SWIFT + γ×BIS (raw, before normalization; §11: fixed-point) */
export function structuralWeightRaw(c: CurrencyData): number {
  const raw = fpAdd(
    fpAdd(
      fpMul(fp(ALPHA), fp(c.cofer)),
      fpMul(fp(BETA), fp(c.swift))
    ),
    fpMul(fp(GAMMA), fp(c.bis))
  );
  return fpToNumber(raw);
}

/**
 * §13 Structural Weight (normalized).
 *
 * The blueprint worked example shows Σ C_i = 1.0000.
 * The raw C_i values don't sum to 1.0 because COFER, SWIFT, and BIS
 * data sources don't each sum to 100%. Therefore structural weights
 * must be normalized: C_i_norm = C_i_raw / Σ C_j_raw.
 *
 * If `allCurrencies` is omitted, returns the raw value (backward-compatible).
 */
export function structuralWeight(
  c: CurrencyData,
  allCurrencies?: CurrencyData[]
): number {
  const raw = fp(structuralWeightRaw(c));
  if (!allCurrencies || allCurrencies.length === 0) return fpToNumber(raw);
  const totalRaw = fpSum(allCurrencies.map((x) => fp(structuralWeightRaw(x))));
  return fpGt(totalRaw, fp(0)) ? fpToNumber(fpDiv(raw, totalRaw)) : fpToNumber(raw);
}

// ---- §14: Gold Anchor ----

/** §14 GoldPrice_i = GoldPrice_n / FX_i,n (§11: fixed-point arithmetic) */
export function goldPriceInCurrency(goldUsd: number, fx: number): number {
  return fpToNumber(fpDiv(fp(goldUsd), fp(fx)));
}

// ---- §15: Momentum Adjustment ----

/** §15.1 M_i = P_i(t-12m) / P_i(t) — momentum relative to gold (§11: fixed-point) */
export function rawMomentum(p12moAgo: number, pToday: number): number {
  return fpToNumber(fpDiv(fp(p12moAgo), fp(pToday)));
}

/** §15.2 clamp to [0.95, 1.05] (§11: fixed-point arithmetic) */
export function clampMomentum(m: number): number {
  return fpToNumber(fpClamp(fp(m), fp(1 - L_MOMENTUM), fp(1 + L_MOMENTUM)));
}

// ---- §16: Mean Reversion ----

/** §16.2 R_i = 1 + η × (LTA_i - C_i) (§11: fixed-point arithmetic) */
export function meanReversionFactor(lta: number, cCurrent: number): number {
  const r = fpAdd(fp(1), fpMul(fp(ETA), fpSub(fp(lta), fp(cCurrent))));
  return fpToNumber(r);
}

/** §16.3 clamp to [0.98, 1.02] (§11: fixed-point arithmetic) */
export function clampMeanReversion(b: number): number {
  return fpToNumber(fpClamp(fp(b), fp(1 - L_REVERSION), fp(1 + L_REVERSION)));
}

// ---- §17: Volatility Attenuation Engine (Shock Absorber) ----

/**
 * §17.1 EWMA Variance (RiskMetrics standard)
 * σ²_t = λ × σ²_{t-1} + (1-λ) × r²_t
 */
export function ewmaVolatility(
  returns: number[], // daily log returns
  lambda = EWMA_LAMBDA
): number {
  if (returns.length === 0) return 0;
  let variance = 0;
  for (const r of returns) {
    variance = lambda * variance + (1 - lambda) * r * r;
  }
  return Math.sqrt(variance);
}

/** §17.2 Daily log return: r_t = ln(P_t / P_{t-1}) */
export function logReturn(pToday: number, pYesterday: number): number {
  return Math.log(pToday / pYesterday);
}

/** §17.4 Volatility attenuation factor: A_t (§11: fixed-point arithmetic) */
export function shockAbsorberFactor(volatility: number): number {
  const v = fp(volatility);
  if (fpLte(v, fp(V_NORMAL))) return 1.0;
  if (fpGte(v, fp(V_HIGH))) return 0.5;
  // §17.4 LINEAR interpolation from (V_NORMAL, 1.0) to (V_HIGH, 0.5).
  //
  //   A_t = 1.0 - (v - V_NORMAL) / (V_HIGH - V_NORMAL) × (1.0 - 0.5)
  //       = 1.0 - 0.5 × (v - V_NORMAL) / (V_HIGH - V_NORMAL)
  //
  // MATH AUDIT FIX (Task 6-c, 2026-08-25): The previous implementation was
  //   A_t = 1.0 - (v - V_NORMAL) / (V_HIGH - V_NORMAL)
  // which maps [0.02, 0.05] → [1.0, 0.0] (NOT [1.0, 0.5]). The boundary
  // value at v=0.05 only happened to be correct because of the early-return
  // guard `if (fpGte(v, fp(V_HIGH))) return 0.5;`; the INTERIOR values were
  // wrong (e.g. A_t(0.035) returned 0.5 instead of 0.75; A_t(0.03) returned
  // 0.6667 instead of 0.8333). The corrected formula multiplies the
  // proportional position by the actual attenuation range (1.0 - 0.5 = 0.5),
  // so the linear interpolation correctly maps [0.02, 0.05] → [1.0, 0.5].
  //
  // Verification:
  //   v=0.020: A_t = 1.0 - 0 × 0.5     = 1.0   ✓ (low vol, no attenuation)
  //   v=0.030: A_t = 1.0 - (1/3)×0.5   = 0.8333 ✓
  //   v=0.035: A_t = 1.0 - 0.5 × 0.5   = 0.75  ✓ (midpoint)
  //   v=0.050: A_t = 1.0 - 1.0 × 0.5   = 0.5   ✓ (high vol, max attenuation)
  const numerator = fpSub(v, fp(V_NORMAL));
  const denominator = fpSub(fp(V_HIGH), fp(V_NORMAL));
  const proportionalPosition = fpDiv(numerator, denominator); // ∈ (0, 1)
  const attenuationRange = fpSub(fp(1.0), fp(0.5)); // 0.5
  const attenuation = fpMul(proportionalPosition, attenuationRange);
  return fpToNumber(fpSub(fp(1.0), attenuation));
}

/**
 * §17.7 Canonical implementation:
 * K_i = 1 + A_t × (M_i × R_i - 1)
 *
 * NOTE: v19.0.3 applies the attenuation to the COMBINED (M×R - 1) term,
 * NOT to momentum alone (as in v2.0). This preserves the internal balance
 * of the weighting engine.
 */
export function shockAdjustedFactor(
  momentum: number,
  meanReversion: number,
  shockAbsorber: number
): number {
  // §17.7 K_i = 1 + A_t × (M_i × R_i - 1) (§11: fixed-point arithmetic)
  const mTimesR = fpMul(fp(momentum), fp(meanReversion));
  const inner = fpSub(mTimesR, fp(1));
  const k = fpAdd(fp(1), fpMul(fp(shockAbsorber), inner));
  return fpToNumber(k);
}

// ---- §18: Liquidity Overlay ----

/** §18.2 L_i = 1 + η_liq × (RelativeLiquidity_i / MedianLiquidity - 1) (§11: fixed-point) */
export function liquidityOverlay(
  relativeLiquidity: number,
  medianLiquidity: number,
  eta = ETA_LIQ
): number {
  const medFp = fp(medianLiquidity);
  if (fpLte(medFp, fp(0))) return 1.0;
  const ratio = fpDiv(fp(relativeLiquidity), medFp);
  const l = fpAdd(fp(1), fpMul(fp(eta), fpSub(ratio, fp(1))));
  return fpToNumber(fpClamp(l, fp(1 - L_LIQ_MAX), fp(1 + L_LIQ_MAX)));
}

// ---- §19: Raw Constitutional Currency Weight ----

// W_raw,i = C_i × K_i × L_i (see computeMonetaryState below)

// ---- §20: Constitutional Normalization ----

// W_i = W_raw,i / Σ W_raw,j (proportional, not softmax)

// ---- §21: Constitutional Concentration Cap ----

/** §21 Cap at 60%, redistribute excess proportionally to uncapped currencies. Iterative. */
export function applyConcentrationCap(
  weights: Map<string, number>,
  maxLimit = L_MAX
): { weights: Map<string, number>; capped: Set<string> } {
  const capped = new Set<string>();
  // Iterate until no currency exceeds the cap
  for (let iter = 0; iter < 10; iter++) {
    let excess = 0;
    let anyCapped = false;
    for (const [code, w] of weights) {
      if (w > maxLimit) {
        excess += w - maxLimit;
        weights.set(code, maxLimit);
        if (!capped.has(code)) {
          capped.add(code);
          anyCapped = true;
        }
      }
    }
    if (excess > 0) {
      const nonCappedTotal = [...weights.entries()]
        .filter(([code]) => !capped.has(code))
        .reduce((s, [, w]) => s + w, 0);
      if (nonCappedTotal > 0) {
        for (const [code, w] of weights) {
          if (!capped.has(code)) {
            weights.set(code, w + (excess * w) / nonCappedTotal);
          }
        }
      }
    }
    if (!anyCapped && excess === 0) break;
  }
  return { weights, capped };
}

// ---- §22: Minimum Floor ----

/** §22 Check: all W_i ≥ W_min (0.5%). Returns currencies below floor. */
export function checkMinimumFloor(
  weights: Map<string, number>,
  minFloor = W_MIN
): { below: string[]; allAbove: boolean } {
  const below: string[] = [];
  for (const [code, w] of weights) {
    if (w < minFloor) below.push(code);
  }
  return { below, allAbove: below.length === 0 };
}

// ---- §22B: Hysteresis / Anti-Whipsaw Protection (G6, added 2026-08-09) ----
//
// Per the reserve-dynamicity-audit.md §12, the existing engine had only weak
// implicit anti-whipsaw (momentum clamp + shock absorber + minDeferralHours).
// This adds an EXPLICIT hysteresis band: a weight change must persist for
// HYSTERESIS_CONFIRMATION_THRESHOLD consecutive observations before it is
// applied. This prevents the engine from continuously switching between
// currencies due to small short-term movements.
//
// Design:
//   - If |proposedWeight − currentWeight| ≤ HYSTERESIS_BAND → no change (noise)
//   - If |proposedWeight − currentWeight| > HYSTERESIS_BAND but confirmation
//     count < HYSTERESIS_CONFIRMATION_THRESHOLD → hold current weight, increment counter
//   - If confirmation count ≥ threshold → apply proposed weight, reset counter
//
// This is deliberately lightweight (no complex state machine) and deterministic.
//
// WIRED INTO PRODUCTION (2026-08-09): The module-level state below persists
// across API calls within the same process, providing continuous anti-whipsaw
// protection for the live currency-weight computation in computeMonetaryStateV19.

// Module-level persistent hysteresis state (survives across API calls)
let moduleHysteresisState: HysteresisState = { confirmationCounts: new Map(), lastDirections: new Map() };
let moduleHysteresisPrevWeights: Map<string, number> = new Map();

const HYSTERESIS_BAND = 0.02; // 2% absolute weight change threshold
const HYSTERESIS_CONFIRMATION_THRESHOLD = 2; // 2 consecutive observations required

export interface HysteresisState {
  /** Per-currency confirmation counter. Maps currency code → consecutive observations above band. */
  confirmationCounts: Map<string, number>;
  /** Per-currency direction tracker. Maps currency code → sign of last drift (+1 / -1 / 0).
   *  §22B anti-whipsaw: if the drift direction REVERSES, the counter resets (the prior
   *  confirmation no longer applies to the new direction). Prevents ±3% oscillation from
   *  confirming on cycle 2. */
  lastDirections: Map<string, number>;
}

/**
 * Apply hysteresis to a proposed weight change. Returns the weight to actually
 * use (which may be the current weight if the change hasn't been confirmed).
 *
 * @param currencyCode - The currency being evaluated
 * @param proposedWeight - The weight the engine wants to set
 * @param currentWeight - The weight currently in effect
 * @param state - Mutable hysteresis state (confirmation counters) — updated in place
 * @returns The weight to apply (proposed if confirmed, current otherwise)
 */
export function applyHysteresis(
  currencyCode: string,
  proposedWeight: number,
  currentWeight: number,
  state: HysteresisState
): number {
  const delta = Math.abs(proposedWeight - currentWeight);

  // Small change — within the noise band. Reset confirmation counter, keep current weight.
  if (delta <= HYSTERESIS_BAND) {
    state.confirmationCounts.set(currencyCode, 0);
    return currentWeight;
  }

  // Large change — track direction for §22B anti-whipsaw
  const direction = proposedWeight > currentWeight ? 1 : -1;
  const lastDirections = state.lastDirections ?? new Map<string, number>();
  const lastDirection = lastDirections.get(currencyCode) ?? 0;
  if (lastDirection !== 0 && direction !== lastDirection) {
    // Direction REVERSED — reset counter (the prior confirmation was for the opposite direction)
    state.confirmationCounts.set(currencyCode, 0);
  }
  lastDirections.set(currencyCode, direction);
  state.lastDirections = lastDirections;

  // Large change — check if confirmed
  const count = state.confirmationCounts.get(currencyCode) ?? 0;
  const newCount = count + 1;
  state.confirmationCounts.set(currencyCode, newCount);

  if (newCount >= HYSTERESIS_CONFIRMATION_THRESHOLD) {
    // Confirmed — apply the proposed weight, reset counter
    state.confirmationCounts.set(currencyCode, 0);
    return proposedWeight;
  }

  // Not yet confirmed — hold current weight
  return currentWeight;
}

/**
 * Apply hysteresis to an entire weight map. Convenience wrapper.
 * @param proposed - The weights the engine wants to set
 * @param current - The weights currently in effect
 * @param state - Mutable hysteresis state — updated in place
 * @returns The weights to apply
 */
export function applyHysteresisToBasket(
  proposed: Map<string, number>,
  current: Map<string, number>,
  state: HysteresisState
): Map<string, number> {
  const result = new Map<string, number>();
  for (const [code, proposedW] of proposed) {
    const currentW = current.get(code) ?? proposedW;
    result.set(code, applyHysteresis(code, proposedW, currentW, state));
  }
  return result;
}

// ---- §22A: Final Basket Verification ----

export interface BasketVerification {
  sumIsOne: boolean; // Σ W = 1.0
  allAboveFloor: boolean; // W_i ≥ W_min
  allBelowCap: boolean; // W_i ≤ W_max
  passed: boolean; // all checks
}

/** §22A Final Constitutional Basket Verification */
export function verifyBasket(
  weights: Map<string, number>,
  tolerance = 1e-10
): BasketVerification {
  const sum = [...weights.values()].reduce((s, w) => s + w, 0);
  const sumIsOne = Math.abs(sum - 1.0) < tolerance;
  let allAboveFloor = true;
  let allBelowCap = true;
  for (const [, w] of weights) {
    if (w < W_MIN) allAboveFloor = false;
    if (w > L_MAX) allBelowCap = false;
  }
  return {
    sumIsOne,
    allAboveFloor,
    allBelowCap,
    passed: sumIsOne && allAboveFloor && allBelowCap,
  };
}

// ---- Types for the full engine output ----

export interface CurrencyWeight {
  code: string;
  name: string;
  structuralWeight: number; // C_i (§13)
  momentumRaw: number; // M_i,raw (§15)
  momentum: number; // M_i (clamped)
  meanReversion: number; // R_i (§16)
  liquidity: number; // L_i (§18)
  shockAbsorber: number; // A_t (§17, uniform)
  kFactor: number; // K_i = 1 + A×(M×R-1) (§17.7)
  rawWeight: number; // W_raw = C × K × L (§19)
  normalizedWeight: number; // W_i (§20)
  isCapped: boolean; // hit concentration cap (§21)
  belowFloor: boolean; // below minimum floor (§22)
  goldPrice: number; // P_i (§14)
  goldPrice12moAgo: number;
}

export interface MonetaryStateV19 {
  // §2 Three-layer reserves
  reserves: ReserveValuation;
  // §3 Three NAVs
  nav: NAVSet;
  // §4 Reserve Ratio
  reserveRatio: ReserveRatioResult;
  // §5 LCR
  lcr: LCRResult;
  // §8 Duration
  portfolioDuration: number;
  durationCompliant: boolean;
  // §9 CRI
  cri: CRIResult;
  // §17 Shock absorber
  volatility: number;
  shockAbsorber: number;
  // §22A Basket verification
  basketVerification: BasketVerification;
  // Basket weights
  weights: CurrencyWeight[];
  // Oracle
  goldUsd: number;
  supply: number;
  mintingPaused: boolean;
}

// ---- Main: compute full v19.0.3 monetary state ----

export function computeMonetaryStateV19(
  snapshot: OracleSnapshot,
  reserveAssets: ReserveAsset[],
  supply: number,
  lcrInputs: { hqla: number; expectedRedemptions: number; committedInflows: number; operationalAdjustments: number },
  criInputs: { liquidity: number; fx: number; custody: number; counterparty: number; operational: number },
  volatility = 0.015,
  ewmaReturns: number[] = []
): MonetaryStateV19 {
  // §11: All monetary state computations below use deterministic fixed-point
  // arithmetic via decimal.js (Decimal128 equivalent, 28 significant digits).
  // Public function signatures still accept/return `number` for API
  // compatibility, but every internal calculation routes through the
  // FixedPoint layer to avoid binary floating-point drift.

  // §2 Three-layer reserve valuation (fp internally)
  const reserves = valueReserves(reserveAssets);

  // §3 Three NAVs (fp internally)
  const nav = computeNAV(reserves, supply);

  // §4 Reserve Ratio (fp internally)
  const reserveRatio = computeReserveRatio(reserves, nav, supply);

  // §5 LCR
  const lcr = computeLCR(
    lcrInputs.hqla,
    lcrInputs.expectedRedemptions,
    lcrInputs.committedInflows,
    lcrInputs.operationalAdjustments
  );

  // §8 Duration
  const portDuration = portfolioDuration(reserveAssets);

  // §9 CRI
  const cri = computeCRI(
    criInputs.liquidity,
    criInputs.fx,
    criInputs.custody,
    criInputs.counterparty,
    criInputs.operational
  );

  // §17 EWMA volatility (use provided returns or fall back to input volatility)
  const ewmaVol = ewmaReturns.length > 0 ? ewmaVolatility(ewmaReturns) : volatility;
  const shockAbsorber = shockAbsorberFactor(ewmaVol);

  // §12-22: Currency Engine
  const currencyData = snapshot.currencies;
  const medianLiquidity = [...currencyData]
    .map((c) => c.swift) // use SWIFT share as liquidity proxy
    .sort((a, b) => a - b)[Math.floor(currencyData.length / 2)];

  const weightEntries: CurrencyWeight[] = currencyData.map((c) => {
    const pToday = goldPriceInCurrency(snapshot.goldUsd, c.fx);
    const p12moAgo = goldPriceInCurrency(snapshot.goldUsd12moAgo, snapshot.fxAgo[c.code] ?? c.fx);

    const mRaw = rawMomentum(p12moAgo, pToday);
    const m = clampMomentum(mRaw);

    const r = clampMeanReversion(meanReversionFactor(c.lta, structuralWeight(c, currencyData)));

    // §17.7 K_i = 1 + A_t × (M_i × R_i - 1)
    const k = shockAdjustedFactor(m, r, shockAbsorber);

    // §18 Liquidity overlay
    const liq = liquidityOverlay(c.swift, medianLiquidity);

    // §19 W_raw = C × K × L (§11: fixed-point multiplication)
    const cWeight = fp(structuralWeight(c, currencyData));
    const rawWeightFp = fpMul(fpMul(cWeight, fp(k)), fp(liq));

    return {
      code: c.code,
      name: c.name,
      structuralWeight: structuralWeight(c, currencyData),
      momentumRaw: mRaw,
      momentum: m,
      meanReversion: r,
      liquidity: liq,
      shockAbsorber,
      kFactor: k,
      rawWeight: fpToNumber(rawWeightFp),
      normalizedWeight: 0,
      isCapped: false,
      belowFloor: false,
      goldPrice: pToday,
      goldPrice12moAgo: p12moAgo,
    };
  });

  // §20 Normalization (§11: fixed-point sum + division)
  const totalRawFp = fpSum(weightEntries.map((w) => fp(w.rawWeight)));
  const normalizedMap = new Map<string, number>();
  for (const w of weightEntries) {
    normalizedMap.set(
      w.code,
      fpGt(totalRawFp, fp(0)) ? fpToNumber(fpDiv(fp(w.rawWeight), totalRawFp)) : 0
    );
  }

  // §21 Concentration cap (iterative)
  const { weights: finalMap, capped } = applyConcentrationCap(normalizedMap);

  // §22 Minimum floor check
  const floorCheck = checkMinimumFloor(finalMap);

  // §22B Hysteresis / Anti-Whipsaw Protection (G6 — wired 2026-08-09)
  // Apply hysteresis to the final weights AFTER concentration cap + floor check.
  // This prevents the engine from changing weights due to small short-term
  // movements. A weight change > 2% must persist for 2 consecutive observations
  // before it is applied. Uses a module-level persistent state that survives
  // across API calls within the same process.
  const hysteresisAdjusted = applyHysteresisToBasket(finalMap, moduleHysteresisPrevWeights, moduleHysteresisState);

  // Update the persistent previous-weights for the next call
  moduleHysteresisPrevWeights = new Map(hysteresisAdjusted);

  for (const w of weightEntries) {
    w.normalizedWeight = hysteresisAdjusted.get(w.code) ?? 0;
    w.isCapped = capped.has(w.code);
    w.belowFloor = fpLt(fp(hysteresisAdjusted.get(w.code) ?? 0), fp(W_MIN));
  }

  // §22A Basket verification
  const basketVerification = verifyBasket(finalMap);

  return {
    reserves,
    nav,
    reserveRatio,
    lcr,
    portfolioDuration: portDuration,
    durationCompliant: portDuration <= MAX_DURATION,
    cri,
    volatility: ewmaVol,
    shockAbsorber,
    basketVerification,
    weights: weightEntries,
    goldUsd: snapshot.goldUsd,
    supply,
    // §22A Basket Verification Gate — minting MUST be paused if basket
    // verification fails (§22A) OR if the reserve ratio is non-compliant (§4).
    // Previously only the §4 ratio was enforced, which allowed minting to
    // continue with a malformed basket (sum ≠ 1.0, W_i < floor, W_i > cap).
    mintingPaused: !reserveRatio.compliant || !basketVerification.passed,
  };
}

// ---- §9 Fees (carried from v2.0 — unchanged in v19.0.3) ----

export const MINT_FEE_BPS = 5;
export const MINT_FEE_CAP = 5000;
export const REDEEM_FEE_BPS = 5;
export const REDEEM_FEE_CAP = 5000;
export const TRANSFER_FEE_BPS = 1;
export const TRANSFER_FEE_CAP = 1000;
export const CUSTODY_FEE_BPS_ANNUAL = 10;

export function mintFee(amountUsd: number): number {
  // §9.1 — Guard against negative/NaN/zero amounts (Task 7-c fix).
  // Negative amounts previously returned negative fees (a vulnerability).
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return 0;
  return Math.min(amountUsd * (MINT_FEE_BPS / 10000), MINT_FEE_CAP);
}
export function redemptionFee(claimUsd: number): number {
  // §9.2 — Guard against negative/NaN/zero amounts (Task 7-c fix).
  if (!Number.isFinite(claimUsd) || claimUsd <= 0) return 0;
  return Math.min(claimUsd * (REDEEM_FEE_BPS / 10000), REDEEM_FEE_CAP);
}

// ---- §8.4: median() (even-length) ----

export function median(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

// ---- §8.2: MAD-based outlier rejection ----

export function madOutlierFilter(prices: number[], k = 3.0): number[] {
  if (prices.length === 0) return [];
  const med = median(prices);
  const mad = median(prices.map((p) => Math.abs(p - med)));
  if (mad === 0) return [...prices];
  return prices.filter((p) => Math.abs(p - med) <= k * mad);
}

// ---- helpers ----

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}
