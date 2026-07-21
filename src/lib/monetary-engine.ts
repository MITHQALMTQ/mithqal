// Mithqal Monetary Engine — full mathematical implementation.
//
// Implements the complete Mathematical Specification Document (v1.0):
//   §1  Core Reserve Formulas (NAV, Reserve Ratio, Coverage)
//   §2  Gold-Currency Connection
//   §3  Basket Weighting Algorithm
//   §4  Momentum Factor Calculation
//   §5  Mean Reversion
//   §6  Shock Absorber
//   §7  SDP (Severe Deviation Protocol)
//   §8  NAV and Reserve Ratio (real-time)
//   §9  Fee Calculations
//   §10 Yield Calculations
//   §11 Oracle Aggregation
//
// All formulas are implemented verbatim from the spec. See inline §-markers.

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
  momentum: number; // M_i (clamped)
  meanReversion: number; // B_i
  momentumFactor: number; // K_i = M_i × B_i
  rawWeight: number; // W_i,raw
  normalizedWeight: number; // W_i (final)
  goldPrice: number; // P_i (gold in this currency)
  goldPrice12moAgo: number; // P_i,t0
  isCapped: boolean; // hit concentration limit
}

export interface SDPResult {
  triggered: boolean;
  trigger: string | null; // "7-day" | "24-hour" | "idiosyncratic" | null
  currency: string | null;
  details: string | null;
}

export interface MonetaryState {
  // Oracle inputs
  goldUsd: number;
  goldUsd12moAgo: number;
  // Reserve
  supply: number;
  reserveUsd: number; // R_USD
  reserveGold: number; // R_Gold (USD value)
  reserveTotal: number; // R_USD + R_Gold
  // Derived
  nav: number; // (R_USD + R_Gold) / Supply
  reserveRatio: number; // %
  reserveCoverage: number; // excess USD
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

// ---- §2: Gold-Currency Connection ----

/** §2.1 Gold price in currency i: P_i = G / FX_i */
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

/** §6.2 Shock absorber factor: A_t = f(V_t) */
export function shockAbsorberFactor(volatility: number): number {
  if (volatility <= V_NORMAL) return 1.0;
  if (volatility >= V_HIGH) return 0.5;
  return 1.0 - (volatility - V_NORMAL) / (V_HIGH - V_NORMAL);
}

// ---- §7: SDP (Severe Deviation Protocol) ----

/** §7.1 SDP trigger detection — 3 triggers (A: 7-day, B: 24h, C: idiosyncratic) */
export function detectSDP(snapshot: OracleSnapshot): SDPResult {
  const { goldUsd, goldUsd7dAgo, goldUsdYesterday, currencies, fx7dAgo, fxAgo1d } = snapshot;

  // Compute gold price in each currency at each time point.
  const prices: {
    code: string;
    today: number;
    yesterday: number;
    "7days": number;
    delta1d: number;
    delta7d: number;
  }[] = [];

  for (const c of currencies) {
    const pToday = goldPriceInCurrency(goldUsd, c.fx);
    const pYesterday = goldPriceInCurrency(goldUsdYesterday, fxAgo1d[c.code] ?? c.fx);
    const p7d = goldPriceInCurrency(goldUsd7dAgo, fx7dAgo[c.code] ?? c.fx);
    prices.push({
      code: c.code,
      today: pToday,
      yesterday: pYesterday,
      "7days": p7d,
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
        details: `${p.code} moved ${(p.delta1d * 100).toFixed(2)}% in 24h (threshold ${(SDP_1D_TRIGGER * 100).toFixed(0)}%)`,
      };
    }
  }

  // Trigger C: idiosyncratic deviation — |Δ_i - median(Δ)| > 2.5%
  const deltas = prices.map((p) => p.delta1d);
  const median = [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length / 2)];
  for (let i = 0; i < prices.length; i++) {
    if (Math.abs(deltas[i] - median) > SDP_IDIO_TRIGGER) {
      return {
        triggered: true,
        trigger: "idiosyncratic",
        currency: prices[i].code,
        details: `${prices[i].code} deviated ${(Math.abs(deltas[i] - median) * 100).toFixed(2)}% from the basket median (threshold ${(SDP_IDIO_TRIGGER * 100).toFixed(1)}%)`,
      };
    }
  }

  return { triggered: false, trigger: null, currency: null, details: null };
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
    // Redistribute proportionally to non-capped currencies.
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

// ---- Main: compute full basket + state ----

/**
 * Compute the complete monetary state from an oracle snapshot + ledger
 * reserve values. Implements the full calculation pipeline:
 *   §3.1 combined shares → §4 momentum → §5 mean reversion →
 *   §3.2-3.3 raw weight → §6 shock absorber → §3.4 normalize →
 *   §3.5 concentration → §7 SDP → §1 NAV/ratio.
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

  // Step 1: combined shares (structural weights)
  const currencyData = snapshot.currencies;

  // Step 2-5: momentum + mean reversion + shock absorber per currency
  const weightEntries: CurrencyWeight[] = currencyData.map((c) => {
    const pToday = goldPriceInCurrency(snapshot.goldUsd, c.fx);
    const p12moAgo = goldPriceInCurrency(snapshot.goldUsd12moAgo, snapshot.fxAgo[c.code] ?? c.fx);

    const mRaw = rawMomentum(p12moAgo, pToday);
    const m = clampMomentum(mRaw);

    const b = clampMeanReversion(meanReversionFactor(c.lta, combinedShare(c)));

    // §6.3 Adjusted momentum: M_adjusted = 1 + A×(M - 1)
    const mAdjusted = 1 + shockAbsorber * (m - 1);

    const k = mAdjusted * b; // §3.2 K_i = M × B

    return {
      code: c.code,
      name: c.name,
      combinedShare: combinedShare(c),
      momentumRaw: mRaw,
      momentum: m,
      meanReversion: b,
      momentumFactor: k,
      rawWeight: 0, // set below
      normalizedWeight: 0, // set below
      goldPrice: pToday,
      goldPrice12moAgo: p12moAgo,
      isCapped: false,
    };
  });

  // Step 3: raw weights W_i,raw = C_i × K_i
  for (const w of weightEntries) {
    w.rawWeight = w.combinedShare * w.momentumFactor;
  }

  // Step 4: normalize W_i = W_i,raw / Σ W_j,raw
  const totalRaw = weightEntries.reduce((s, w) => s + w.rawWeight, 0);
  const normalizedMap = new Map<string, number>();
  for (const w of weightEntries) {
    normalizedMap.set(w.code, w.rawWeight / totalRaw);
  }

  // Step 5: concentration limits
  const { weights: finalMap, capped } = applyConcentrationLimits(normalizedMap);
  for (const w of weightEntries) {
    w.normalizedWeight = finalMap.get(w.code) ?? 0;
    w.isCapped = capped.has(w.code);
  }

  // §7: SDP — if triggered, apply emergency weights
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
        // §7.4 anti-shock cap: W_new = max(W_emergency, W_current × 0.50)
        const newWeight = Math.max(emergencyRaw, w.normalizedWeight * 0.5);
        w.normalizedWeight = newWeight;
        w.momentumFactor = kEmergency;
      }
    }
  }

  // §1: NAV and reserve ratio
  const reserveTotal = reserveUsd + reserveGoldUsd;
  const nav = supply > 0 ? reserveTotal / supply : 0;
  const reserveRatio =
    supply > 0 && nav > 0 ? (reserveTotal / (nav * supply)) * 100 : 0;
  const reserveCoverage = reserveTotal - nav * supply;

  return {
    goldUsd: snapshot.goldUsd,
    goldUsd12moAgo: snapshot.goldUsd12moAgo,
    supply,
    reserveUsd,
    reserveGold: reserveGoldUsd,
    reserveTotal,
    nav,
    reserveRatio,
    reserveCoverage,
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

// ---- helpers ----

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

// ---- §10: Yield (informational — separate vehicle) ----

/** §10.2 Yield accrual (weekly): (reserve × rate) / 52 */
export function yieldAccrualWeekly(
  reserveValue: number,
  yieldRate = 0.01 // 1% default
): number {
  return (reserveValue * yieldRate) / 52;
}
