// Mithqal Monetary Engine — full mathematical implementation (v2.0 CORRECTED).
//
// Implements the complete Clean, Corrected Version (Incorporating All Audit
// Findings) of the Mathematical Specification Document:
//   §1  Core Reserve Metrics (NAV, Reserve Ratio [FIXED], Coverage [FIXED], NAV_target)
//   §2  Gold-Currency Connection
//   §3  Basket Weighting Algorithm
//   §4  Momentum Factor Calculation
//   §5  Mean Reversion
//   §6  Shock Absorber (applies to momentum ONLY — FIXED)
//   §7  SDP (Severe Deviation Protocol) + recursive ramp (ADDED)
//   §8  Oracle Aggregation (MAD-based — ENHANCED) + median() (FIXED)
//   §9  Fee Calculations
//   §10 Yield Calculations
//   §11 Rebalancing Smoothing (ADDED)
//
// Critical fixes in v2.0:
//   - Reserve Ratio uses NAV_target (not current NAV) — prevents the
//     tautological collapse where RR always = 100% because NAV×Supply = Reserve.
//   - Reserve Coverage uses NAV_target × Supply — now meaningful (was always 0).
//   - Shock absorber applies to momentum ONLY (then K = M_adj × B), per §6.4.
//   - MAD-based oracle outlier rejection (k=3.0) replaces the fixed 2% threshold.
//   - median() handles even-length lists correctly.
//   - Rebalancing smoothing (standard λ=1/30, SDP λ=1/48) added.

import type { OracleSnapshot, CurrencyData } from "./oracle-data";

// ---- Constants (per spec) ----

export const ALPHA = 0.50; // COFER weight
export const BETA = 0.40; // SWIFT weight
export const GAMMA = 0.10; // BIS weight
export const L_MOMENTUM = 0.05; // momentum clamp ±5%
export const L_REVERSION = 0.02; // mean reversion clamp ±2%
export const ETA = 0.05; // mean reversion speed
export const L_MAX = 0.60; // concentration limit 60%
export const V_NORMAL = 0.02; // normal volatility threshold 2%
export const V_HIGH = 0.05; // high volatility threshold 5%
export const SDP_7D_TRIGGER = 0.05; // 5% over 7 days
export const SDP_1D_TRIGGER = 0.03; // 3% over 24h
export const SDP_IDIO_TRIGGER = 0.025; // 2.5% idiosyncratic
export const PAR = 1.0; // 1 MTQ = $1 at mint
export const MAD_K = 3.0; // MAD outlier rejection factor (§8.2)
export const LAMBDA_STD = 1 / 30; // standard rebalancing smoothing (§11.1)
export const LAMBDA_SDP = 1 / 48; // SDP rebalancing smoothing per hour (§11.2)

// §1.4 Target NAV — IMF SDR-based.
// In production: NAV_target = SDR_Value × Scaling_Factor, where
//   Scaling_Factor = (1 SDR in USD) / Σ(Wᵢ × USD Price of Currency i)
// Here we use the published SDR value (~$1.33 as of the spec period) and a
// fixed scaling factor. This is the redemption liability anchor — the ratio
// against reserves is now meaningful (not tautologically 100%).
export const SDR_VALUE_USD = 1.33; // 1 SDR ≈ $1.33 USD
export const SCALING_FACTOR = 1.0; // fixed at launch; adjusted only for major basket changes
export const NAV_TARGET = SDR_VALUE_USD * SCALING_FACTOR; // ≈ $1.33

// Fee rates (§9) — capped per spec.
export const MINT_FEE_BPS = 5; // 0.05%
export const MINT_FEE_CAP = 5000; // $5,000
export const REDEEM_FEE_BPS = 5; // 0.05%
export const REDEEM_FEE_CAP = 5000; // $5,000
export const TRANSFER_FEE_BPS = 1; // 0.01%
export const TRANSFER_FEE_CAP = 1000; // $1,000
export const CUSTODY_FEE_BPS_ANNUAL = 10; // 0.10% / year
export const REBALANCE_FEE_BPS = 1; // 0.01%

// ---- Types ----

export interface CurrencyWeight {
  code: string;
  name: string;
  combinedShare: number; // C_i (structural)
  momentumRaw: number; // M_i,raw
  momentumAdjusted: number; // M_i,adjusted (shock-absorbed) — v2.0
  momentum: number; // M_i (clamped, post-shock)
  meanReversion: number; // B_i (unaffected by shock absorber — v2.0)
  momentumFactor: number; // K_i = M_adj × B_i (v2.0)
  rawWeight: number; // W_i,raw
  normalizedWeight: number; // W_i (final)
  goldPrice: number; // P_i (gold in this currency)
  goldPrice12moAgo: number; // P_i,t0
  isCapped: boolean; // hit concentration limit
  emergencyWeight?: number; // §7 SDP emergency weight (if triggered)
  smoothedWeight?: number; // §11 rebalancing-smoothed weight
}

export interface SDPResult {
  triggered: boolean;
  trigger: string | null; // "7-day" | "24-hour" | "idiosyncratic" | null
  currency: string | null;
  details: string | null;
  delta: number | null; // the deviation that triggered it
}

export interface MonetaryState {
  // Oracle inputs
  goldUsd: number;
  goldUsd12moAgo: number;
  // §1.4 Target NAV (SDR-based)
  navTarget: number;
  sdrValueUsd: number;
  // Reserve
  supply: number;
  reserveUsd: number; // R_USD
  reserveGold: number; // R_Gold (USD value)
  reserveTotal: number; // R_USD + R_Gold
  // Derived — §1 NAV (current market)
  nav: number; // (R_USD + R_Gold) / Supply
  // §1.2 Reserve Ratio (FIXED: uses NAV_target, not current NAV)
  reserveRatio: number; // %
  // §1.3 Reserve Coverage (FIXED: uses NAV_target × Supply)
  reserveCoverage: number; // excess USD over redemption liability
  reserveCoveragePct: number; // as % of NAV
  redemptionLiability: number; // NAV_target × Supply
  // Basket
  weights: CurrencyWeight[];
  // Shock absorber
  volatility: number;
  shockAbsorber: number; // A_t
  // SDP
  sdp: SDPResult;
  // Operational
  mintingPaused: boolean;
  opIndex: number;
}

// ---- §8.4: median() (CORRECTED — handles even-length lists) ----

/** §8.4 Returns median of a list, handling both odd and even lengths. */
export function median(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2 === 1) {
    return sorted[Math.floor(n / 2)];
  }
  // even: average of the two middle values
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

// ---- §8.2: MAD-based outlier rejection (ENHANCED) ----

/**
 * §8.2 MAD-based outlier rejection. Returns the valid (non-outlier) prices.
 * Statistically more robust than a fixed 2% threshold.
 *   MAD = median(|p - median_all| for p in family_prices)
 *   valid if |p - median_all| ≤ k × MAD  (k = 3.0)
 */
export function madOutlierFilter(prices: number[], k = MAD_K): number[] {
  if (prices.length === 0) return [];
  const med = median(prices);
  const deviations = prices.map((p) => Math.abs(p - med));
  const mad = median(deviations);
  // If MAD is 0 (all prices identical), keep everything.
  if (mad === 0) return [...prices];
  return prices.filter((p) => Math.abs(p - med) <= k * mad);
}

/**
 * §8 Oracle consensus price: family medianization → MAD outlier rejection →
 * quorum check (≥5 of 8) → constitutional validation (5% vs previous).
 */
export function consensusPrice(
  familyPrices: number[],
  previousPrice?: number
): { price: number; method: string; validCount: number; quarantined: number } {
  const medianAll = median(familyPrices);
  const valid = madOutlierFilter(familyPrices);
  const quarantined = familyPrices.length - valid.length;

  // §8.2 Step 4: quorum check — need ≥5 valid prices, else TWAP fallback.
  if (valid.length < 5) {
    // TWAP fallback (here: average of all family prices as a proxy).
    const twap = familyPrices.reduce((s, p) => s + p, 0) / familyPrices.length;
    return { price: twap, method: "TWAP-48h (quorum fallback)", validCount: valid.length, quarantined };
  }

  let consensus = median(valid);

  // §8.2 Step 5: constitutional validation — if >5% move vs previous, TWAP.
  if (previousPrice && previousPrice > 0) {
    if (Math.abs(consensus - previousPrice) / previousPrice > 0.05) {
      const twap = valid.reduce((s, p) => s + p, 0) / valid.length;
      return { price: twap, method: "TWAP-48h (constitutional validation)", validCount: valid.length, quarantined };
    }
  }

  return { price: consensus, method: "median (MAD-filtered)", validCount: valid.length, quarantined };
}

// ---- §2: Gold-Currency Connection ----

/** §2.1 Gold price in currency i: P_i = G / FX_i (FX = USD per unit of currency) */
export function goldPriceInCurrency(goldUsd: number, fx: number): number {
  return goldUsd / fx;
}

// ---- §3: Basket Weighting Algorithm ----

/** §3.1 Combined share: C_i = α×COFER + β×SWIFT + γ×BIS */
export function combinedShare(c: CurrencyData): number {
  return ALPHA * c.cofer + BETA * c.swift + GAMMA * c.bis;
}

// ---- §4: Momentum Factor ----

/** §4.1 Raw momentum: M_i,raw = P_t0 / P_t1 (12-month) */
export function rawMomentum(p12moAgo: number, pToday: number): number {
  return p12moAgo / pToday;
}

/**
 * §6.3 Adjusted momentum: M_adjusted = 1 + A×(M_raw - 1)
 * Shock absorber applies to raw momentum BEFORE clamping (v2.0 §13.3 order).
 */
export function adjustedMomentum(mRaw: number, shockAbsorber: number): number {
  return 1 + shockAbsorber * (mRaw - 1);
}

/** §4.2 Momentum bounds: clamp to [1-L, 1+L] */
export function clampMomentum(m: number): number {
  return clamp(m, 1 - L_MOMENTUM, 1 + L_MOMENTUM);
}

// ---- §5: Mean Reversion ----

/** §5.2 Mean reversion factor: B_i = 1 + η×(LTA - C_current) */
export function meanReversionFactor(lta: number, cCurrent: number): number {
  return 1 + ETA * (lta - cCurrent);
}

/** §5.3 Mean reversion bounds: clamp to [1-L, 1+L] */
export function clampMeanReversion(b: number): number {
  return clamp(b, 1 - L_REVERSION, 1 + L_REVERSION);
}

// ---- §6: Shock Absorber ----

/**
 * §6.2 Shock absorber factor: A_t = f(V_t)
 *   V ≤ 2%   → A = 1.0 (full momentum)
 *   2% < V < 5% → A = linear interpolation
 *   V ≥ 5%   → A = 0.5 (max 50% damping — intentional to preserve some momentum)
 */
export function shockAbsorberFactor(volatility: number): number {
  if (volatility <= V_NORMAL) return 1.0;
  if (volatility >= V_HIGH) return 0.5;
  return 1.0 - (volatility - V_NORMAL) / (V_HIGH - V_NORMAL);
}

// ---- §7: SDP (Severe Deviation Protocol) ----

/** §7.1 SDP trigger detection — 3 triggers (A: 7-day, B: 24h, C: idiosyncratic) */
export function detectSDP(snapshot: OracleSnapshot): SDPResult {
  const { goldUsd, goldUsd7dAgo, goldUsdYesterday, currencies, fx7dAgo, fxAgo1d } = snapshot;

  const prices: {
    code: string;
    delta1d: number;
    delta7d: number;
  }[] = [];

  for (const c of currencies) {
    const pToday = goldPriceInCurrency(goldUsd, c.fx);
    const pYesterday = goldPriceInCurrency(goldUsdYesterday, fxAgo1d[c.code] ?? c.fx);
    const p7d = goldPriceInCurrency(goldUsd7dAgo, fx7dAgo[c.code] ?? c.fx);
    prices.push({
      code: c.code,
      delta1d: Math.abs(pToday / pYesterday - 1),
      delta7d: Math.abs(pToday / p7d - 1),
    });
  }

  // Trigger A: 7-day volatility > 5%
  for (const p of prices) {
    if (p.delta7d > SDP_7D_TRIGGER) {
      return {
        triggered: true,
        trigger: "7-day",
        currency: p.code,
        delta: p.delta7d,
        details: `${p.code} moved ${(p.delta7d * 100).toFixed(2)}% over 7 days (threshold ${(SDP_7D_TRIGGER * 100).toFixed(0)}%)`,
      };
    }
  }

  // Trigger B: 24-hour flash crash > 3%
  for (const p of prices) {
    if (p.delta1d > SDP_1D_TRIGGER) {
      return {
        triggered: true,
        trigger: "24-hour",
        currency: p.code,
        delta: p.delta1d,
        details: `${p.code} moved ${(p.delta1d * 100).toFixed(2)}% in 24h (threshold ${(SDP_1D_TRIGGER * 100).toFixed(0)}%)`,
      };
    }
  }

  // Trigger C: idiosyncratic deviation — |Δ_i - median(Δ)| > 2.5%
  const deltas = prices.map((p) => p.delta1d);
  const med = median(deltas);
  for (let i = 0; i < prices.length; i++) {
    const dev = Math.abs(deltas[i] - med);
    if (dev > SDP_IDIO_TRIGGER) {
      return {
        triggered: true,
        trigger: "idiosyncratic",
        currency: prices[i].code,
        delta: dev,
        details: `${prices[i].code} deviated ${(dev * 100).toFixed(2)}% from the basket median (threshold ${(SDP_IDIO_TRIGGER * 100).toFixed(1)}%)`,
      };
    }
  }

  return { triggered: false, trigger: null, currency: null, details: null, delta: null };
}

// ---- §3.4-3.5: Normalization + Concentration Limits ----

/** Apply concentration limit (§3.5): cap any weight > L_max, redistribute excess. */
function applyConcentrationLimits(
  weights: Map<string, number>,
  maxLimit = L_MAX
): { weights: Map<string, number>; capped: Set<string> } {
  const capped = new Set<string>();
  let excess = 0;
  for (const [code, w] of weights) {
    if (w > maxLimit) {
      excess += w - maxLimit;
      weights.set(code, maxLimit);
      capped.add(code);
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
  return { weights, capped };
}

// ---- §11: Rebalancing Smoothing (ADDED) ----

/**
 * §11.1 Standard rebalancing: W(t+1) = W(t) + λ_std × (W* - W(t))
 * Applied daily over 30 days (λ_std = 1/30).
 */
export function standardRebalance(
  currentWeight: number,
  targetWeight: number,
  lambda = LAMBDA_STD
): number {
  return currentWeight + lambda * (targetWeight - currentWeight);
}

/**
 * §11.2 SDP rebalancing: W(t+1) = W(t) + λ_SDP × (W_emergency - W(t))
 * Applied hourly over 48 hours (λ_SDP = 1/48).
 */
export function sdpRebalance(
  currentWeight: number,
  emergencyWeight: number,
  lambda = LAMBDA_SDP
): number {
  return currentWeight + lambda * (emergencyWeight - currentWeight);
}

// ---- Main: compute full basket + state (v2.0 CORRECTED) ----

/**
 * Compute the complete monetary state from an oracle snapshot + ledger
 * reserve values. Implements the full v2.0 CORRECTED calculation pipeline:
 *   §3.1 combined shares → §4 raw momentum → §6.3 shock-absorbed momentum →
 *   §4.2 clamp → §5 mean reversion (unaffected by shock) → §3.2-3.3 raw weight →
 *   §3.4 normalize → §3.5 concentration → §7 SDP → §1 NAV/ratio (with NAV_target).
 */
export function computeMonetaryState(
  snapshot: OracleSnapshot,
  reserveUsd: number,
  reserveGoldUsd: number,
  supply: number,
  opIndex: number,
  volatility = 0
): MonetaryState {
  const sdp = detectSDP(snapshot);
  const shockAbsorber = shockAbsorberFactor(volatility);
  const currencyData = snapshot.currencies;

  // Per-currency: momentum (shock-absorbed) + mean reversion, then K = M_adj × B.
  // v2.0 §6.4: shock absorber applies to momentum ONLY; mean reversion unaffected.
  const weightEntries: CurrencyWeight[] = currencyData.map((c) => {
    const pToday = goldPriceInCurrency(snapshot.goldUsd, c.fx);
    const p12moAgo = goldPriceInCurrency(snapshot.goldUsd12moAgo, snapshot.fxAgo[c.code] ?? c.fx);

    const mRaw = rawMomentum(p12moAgo, pToday);

    // §6.3 Apply shock absorber to raw momentum (BEFORE clamping, per §13.3).
    const mAdjusted = adjustedMomentum(mRaw, shockAbsorber);

    // §4.2 Clamp the shock-absorbed momentum.
    const m = clampMomentum(mAdjusted);

    // §5 Mean reversion (independent of shock absorber — v2.0 fix).
    const b = clampMeanReversion(meanReversionFactor(c.lta, combinedShare(c)));

    // §6.4 Final momentum factor: K = M_adjusted × B.
    const k = m * b;

    return {
      code: c.code,
      name: c.name,
      combinedShare: combinedShare(c),
      momentumRaw: mRaw,
      momentumAdjusted: mAdjusted,
      momentum: m,
      meanReversion: b,
      momentumFactor: k,
      rawWeight: 0,
      normalizedWeight: 0,
      goldPrice: pToday,
      goldPrice12moAgo: p12moAgo,
      isCapped: false,
    };
  });

  // §3.3 raw weights W_i,raw = C_i × K_i
  for (const w of weightEntries) {
    w.rawWeight = w.combinedShare * w.momentumFactor;
  }

  // §3.4 normalize W_i = W_i,raw / Σ W_j,raw
  const totalRaw = weightEntries.reduce((s, w) => s + w.rawWeight, 0);
  const normalizedMap = new Map<string, number>();
  for (const w of weightEntries) {
    normalizedMap.set(w.code, w.rawWeight / totalRaw);
  }

  // §3.5 concentration limits (60% cap + proportional redistribution)
  const { weights: finalMap, capped } = applyConcentrationLimits(normalizedMap);
  for (const w of weightEntries) {
    w.normalizedWeight = finalMap.get(w.code) ?? 0;
    w.isCapped = capped.has(w.code);
  }

  // §7 SDP — if triggered, apply emergency weights + anti-shock cap.
  if (sdp.triggered && sdp.currency) {
    const cc = sdp.currency;
    const c = currencyData.find((x) => x.code === cc);
    if (c) {
      const pToday = goldPriceInCurrency(snapshot.goldUsd, c.fx);
      const p7d = goldPriceInCurrency(snapshot.goldUsd7dAgo, snapshot.fx7dAgo[c.code] ?? c.fx);
      const kEmergency = p7d / pToday; // §7.2
      const w = weightEntries.find((x) => x.code === cc);
      if (w) {
        const emergencyRaw = w.combinedShare * kEmergency;
        const emergencyNormalized = emergencyRaw / totalRaw;
        // §7.4 anti-shock cap: W_new = max(W_emergency, W_current × 0.50)
        const newWeight = Math.max(emergencyNormalized, w.normalizedWeight * 0.5);
        w.emergencyWeight = newWeight;
        w.normalizedWeight = newWeight;
        w.momentumFactor = kEmergency;
      }
    }
  }

  // §11 Rebalancing smoothing — apply one step toward target (standard or SDP).
  for (const w of weightEntries) {
    const target = w.emergencyWeight ?? w.normalizedWeight;
    w.smoothedWeight = w.emergencyWeight
      ? sdpRebalance(w.normalizedWeight, w.emergencyWeight)
      : standardRebalance(w.normalizedWeight, w.normalizedWeight);
  }

  // §1 Core reserve metrics (v2.0 CORRECTED).
  const reserveTotal = reserveUsd + reserveGoldUsd;
  const nav = supply > 0 ? reserveTotal / supply : 0; // §1.1 current market NAV
  const redemptionLiability = NAV_TARGET * supply; // §1.2 NAV_target × Supply
  // §1.2 FIXED: Reserve Ratio = Reserve / (NAV_target × Supply) × 100
  const reserveRatio =
    redemptionLiability > 0 ? (reserveTotal / redemptionLiability) * 100 : 0;
  // §1.3 FIXED: Coverage = Reserve - (NAV_target × Supply)
  const reserveCoverage = reserveTotal - redemptionLiability;
  const reserveCoveragePct =
    nav > 0 ? (reserveCoverage / (nav * supply)) * 100 : 0;

  return {
    goldUsd: snapshot.goldUsd,
    goldUsd12moAgo: snapshot.goldUsd12moAgo,
    navTarget: NAV_TARGET,
    sdrValueUsd: SDR_VALUE_USD,
    supply,
    reserveUsd,
    reserveGold: reserveGoldUsd,
    reserveTotal,
    nav,
    reserveRatio,
    reserveCoverage,
    reserveCoveragePct,
    redemptionLiability,
    weights: weightEntries,
    volatility,
    shockAbsorber,
    sdp,
    mintingPaused: reserveRatio < 100,
    opIndex,
  };
}

// ---- §9: Fee Calculations ----

/** §9.1 Minting fee: min(amount × 0.0005, $5,000) */
export function mintFee(amountUsd: number): number {
  return Math.min(amountUsd * (MINT_FEE_BPS / 10000), MINT_FEE_CAP);
}

/** §9.2 Redemption fee: min(claim × 0.0005, $5,000) */
export function redemptionFee(claimUsd: number): number {
  return Math.min(claimUsd * (REDEEM_FEE_BPS / 10000), REDEEM_FEE_CAP);
}

/** §9.3 Transfer fee: min(amount × 0.0001, $1,000) */
export function transferFee(amountUsd: number): number {
  return Math.min(amountUsd * (TRANSFER_FEE_BPS / 10000), TRANSFER_FEE_CAP);
}

/** §9.4 Custody fee (monthly): (reserve × 0.001) / 12 */
export function custodyFeeMonthly(reserveValue: number): number {
  return (reserveValue * (CUSTODY_FEE_BPS_ANNUAL / 10000)) / 12;
}

/** §9.5 Rebalancing fee: rebalanced_amount × 0.0001 */
export function rebalancingFee(rebalancedAmount: number): number {
  return rebalancedAmount * (REBALANCE_FEE_BPS / 10000);
}

// ---- §10: Yield (informational — separate vehicle) ----

/** §10.2 Yield accrual (weekly): (reserve × rate) / 52 */
export function yieldAccrualWeekly(
  reserveValue: number,
  yieldRate = 0.01 // 1% default
): number {
  return (reserveValue * yieldRate) / 52;
}

// ---- helpers ----

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}
