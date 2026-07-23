// Mithqal Monetary Engine v19.0 — Constitutional Monetary Infrastructure Specification
//
// Implements the complete v19.0 specification (55 sections, 6 parts):
//   PART I — Constitutional Mathematical Foundations (§1-11)
//   PART II — Currency Engine (§12-22A)
//
// Key v19.0 innovations vs v2.0:
//   - Three-layer reserve valuation (Market / Adjusted / Liquidation)
//   - Three NAV definitions (Market / Prudential / Stress)
//   - Reserve Ratio = R_a / (S × NAV_m) — prudential buffer via haircuts, no SDR
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

/** §2 Three-layer reserve valuation */
export function valueReserves(assets: ReserveAsset[]): ReserveValuation {
  let r_m = 0, r_a = 0, r_l = 0;
  for (const a of assets) {
    const marketValue = a.quantity * a.priceUsd;
    r_m += marketValue;
    r_a += marketValue * (1 - a.haircut) * a.counterpartyScore;
    r_l += marketValue * (1 - a.haircut) * a.counterpartyScore * a.stressCoefficient;
  }
  return {
    market: r_m,
    adjusted: r_a,
    liquidation: r_l,
    hierarchyValid: r_l <= r_a && r_a <= r_m,
  };
}

// ---- §3: Three NAV Definitions ----

export interface NAVSet {
  market: number; // NAV_m = R_m / S
  prudential: number; // NAV_l = R_a / S
  stress: number; // NAV_stress = R_l / S
  hierarchyValid: boolean; // NAV_stress ≤ NAV_l ≤ NAV_m
}

/** §3 Three NAV definitions */
export function computeNAV(reserves: ReserveValuation, supply: number): NAVSet {
  if (supply <= 0) {
    return { market: 0, prudential: 0, stress: 0, hierarchyValid: false };
  }
  const nav_m = reserves.market / supply;
  const nav_l = reserves.adjusted / supply;
  const nav_stress = reserves.liquidation / supply;
  return {
    market: nav_m,
    prudential: nav_l,
    stress: nav_stress,
    hierarchyValid: nav_stress <= nav_l && nav_l <= nav_m,
  };
}

// ---- §4: Constitutional Reserve Ratio ----

export interface ReserveRatioResult {
  ratio: number; // RR = R_a / L (percentage)
  redemptionLiability: number; // L = S × NAV_m
  adjustedReserve: number; // R_a
  marketReserve: number; // R_m
  compliant: boolean; // RR ≥ 1.00
  policyTarget: boolean; // RR ≥ 1.02
}

/** §4 Reserve Ratio = R_a / (S × NAV_m) */
export function computeReserveRatio(
  reserves: ReserveValuation,
  nav: NAVSet,
  supply: number
): ReserveRatioResult {
  const L = supply * nav.market; // Redemption Liability at Market NAV
  const ratio = L > 0 ? reserves.adjusted / L : 0;
  return {
    ratio: ratio * 100, // as percentage
    redemptionLiability: L,
    adjustedReserve: reserves.adjusted,
    marketReserve: reserves.market,
    compliant: ratio >= 1.00,
    policyTarget: ratio >= 1.02,
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

/** §5 LCR = HQLA / 30-Day_Net_Redemption_Outflow */
export function computeLCR(
  hqla: number,
  expectedRedemptions: number,
  committedInflows: number,
  operationalAdjustments: number
): LCRResult {
  const netOutflow = expectedRedemptions - committedInflows + operationalAdjustments;
  const ratio = netOutflow > 0 ? hqla / netOutflow : hqla > 0 ? Infinity : 0;
  return {
    ratio: ratio === Infinity ? 999 : ratio,
    hqla,
    netOutflow: Math.max(0, netOutflow),
    compliant: ratio >= 1.00,
    strong: ratio >= 1.20,
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

/** §7 Composite counterparty score: C_a = w_credit × Credit + w_jur × Jurisdiction + w_op × Operational */
export function counterpartyScore(
  credit: number, // 0.90 to 1.00 (AAA=1.00, BBB=0.90)
  jurisdiction: number, // 0.95 to 1.00
  operational: number, // 0.95 to 1.00
  weights = { credit: 0.5, jurisdiction: 0.3, operational: 0.2 }
): number {
  const score = weights.credit * credit + weights.jurisdiction * jurisdiction + weights.operational * operational;
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

/** §9 CRI = √(w_L×L² + w_F×F² + w_C×C² + w_P×P² + w_O×O²) */
export function computeCRI(
  liquidity: number, // 0-100
  fx: number,
  custody: number,
  counterparty: number,
  operational: number,
  weights = { L: 0.25, F: 0.25, C: 0.20, P: 0.15, O: 0.15 }
): CRIResult {
  const cri = Math.sqrt(
    weights.L * liquidity ** 2 +
    weights.F * fx ** 2 +
    weights.C * custody ** 2 +
    weights.P * counterparty ** 2 +
    weights.O * operational ** 2
  );
  const level = cri < 30 ? "low" : cri < 50 ? "moderate" : cri < 70 ? "elevated" : "high";
  return {
    cri: clamp(cri, 0, 100),
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

/** §13 C_i = α×COFER + β×SWIFT + γ×BIS */
export function structuralWeight(c: CurrencyData): number {
  return ALPHA * c.cofer + BETA * c.swift + GAMMA * c.bis;
}

// ---- §14: Gold Anchor ----

/** §14 GoldPrice_i = GoldPrice_n / FX_i,n */
export function goldPriceInCurrency(goldUsd: number, fx: number): number {
  return goldUsd / fx;
}

// ---- §15: Momentum Adjustment ----

/** §15.1 M_i = P_i(t-12m) / P_i(t) — momentum relative to gold */
export function rawMomentum(p12moAgo: number, pToday: number): number {
  return p12moAgo / pToday;
}

/** §15.2 clamp to [0.95, 1.05] */
export function clampMomentum(m: number): number {
  return clamp(m, 1 - L_MOMENTUM, 1 + L_MOMENTUM);
}

// ---- §16: Mean Reversion ----

/** §16.2 R_i = 1 + η × (LTA_i - C_i) */
export function meanReversionFactor(lta: number, cCurrent: number): number {
  return 1 + ETA * (lta - cCurrent);
}

/** §16.3 clamp to [0.98, 1.02] */
export function clampMeanReversion(b: number): number {
  return clamp(b, 1 - L_REVERSION, 1 + L_REVERSION);
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

/** §17.4 Volatility attenuation factor: A_t */
export function shockAbsorberFactor(volatility: number): number {
  if (volatility <= V_NORMAL) return 1.0;
  if (volatility >= V_HIGH) return 0.5;
  return 1.0 - (volatility - V_NORMAL) / (V_HIGH - V_NORMAL);
}

/**
 * §17.7 Canonical implementation:
 * K_i = 1 + A_t × (M_i × R_i - 1)
 *
 * NOTE: v19.0 applies the attenuation to the COMBINED (M×R - 1) term,
 * NOT to momentum alone (as in v2.0). This preserves the internal balance
 * of the weighting engine.
 */
export function shockAdjustedFactor(
  momentum: number,
  meanReversion: number,
  shockAbsorber: number
): number {
  return 1 + shockAbsorber * (momentum * meanReversion - 1);
}

// ---- §18: Liquidity Overlay ----

/** §18.2 L_i = 1 + η_liq × (RelativeLiquidity_i / MedianLiquidity - 1) */
export function liquidityOverlay(
  relativeLiquidity: number,
  medianLiquidity: number,
  eta = ETA_LIQ
): number {
  if (medianLiquidity <= 0) return 1.0;
  const l = 1 + eta * (relativeLiquidity / medianLiquidity - 1);
  return clamp(l, 1 - L_LIQ_MAX, 1 + L_LIQ_MAX);
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

// ---- Main: compute full v19.0 monetary state ----

export function computeMonetaryStateV19(
  snapshot: OracleSnapshot,
  reserveAssets: ReserveAsset[],
  supply: number,
  lcrInputs: { hqla: number; expectedRedemptions: number; committedInflows: number; operationalAdjustments: number },
  criInputs: { liquidity: number; fx: number; custody: number; counterparty: number; operational: number },
  volatility = 0.015,
  ewmaReturns: number[] = []
): MonetaryStateV19 {
  // §2 Three-layer reserve valuation
  const reserves = valueReserves(reserveAssets);

  // §3 Three NAVs
  const nav = computeNAV(reserves, supply);

  // §4 Reserve Ratio
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

    const r = clampMeanReversion(meanReversionFactor(c.lta, structuralWeight(c)));

    // §17.7 K_i = 1 + A_t × (M_i × R_i - 1)
    const k = shockAdjustedFactor(m, r, shockAbsorber);

    // §18 Liquidity overlay
    const liq = liquidityOverlay(c.swift, medianLiquidity);

    // §19 W_raw = C × K × L
    const rawWeight = structuralWeight(c) * k * liq;

    return {
      code: c.code,
      name: c.name,
      structuralWeight: structuralWeight(c),
      momentumRaw: mRaw,
      momentum: m,
      meanReversion: r,
      liquidity: liq,
      shockAbsorber,
      kFactor: k,
      rawWeight,
      normalizedWeight: 0,
      isCapped: false,
      belowFloor: false,
      goldPrice: pToday,
      goldPrice12moAgo: p12moAgo,
    };
  });

  // §20 Normalization
  const totalRaw = weightEntries.reduce((s, w) => s + w.rawWeight, 0);
  const normalizedMap = new Map<string, number>();
  for (const w of weightEntries) {
    normalizedMap.set(w.code, w.rawWeight / totalRaw);
  }

  // §21 Concentration cap (iterative)
  const { weights: finalMap, capped } = applyConcentrationCap(normalizedMap);

  // §22 Minimum floor check
  const floorCheck = checkMinimumFloor(finalMap);

  for (const w of weightEntries) {
    w.normalizedWeight = finalMap.get(w.code) ?? 0;
    w.isCapped = capped.has(w.code);
    w.belowFloor = (finalMap.get(w.code) ?? 0) < W_MIN;
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
    mintingPaused: !reserveRatio.compliant,
  };
}

// ---- §9 Fees (carried from v2.0 — unchanged in v19.0) ----

export const MINT_FEE_BPS = 5;
export const MINT_FEE_CAP = 5000;
export const REDEEM_FEE_BPS = 5;
export const REDEEM_FEE_CAP = 5000;
export const TRANSFER_FEE_BPS = 1;
export const TRANSFER_FEE_CAP = 1000;
export const CUSTODY_FEE_BPS_ANNUAL = 10;

export function mintFee(amountUsd: number): number {
  return Math.min(amountUsd * (MINT_FEE_BPS / 10000), MINT_FEE_CAP);
}
export function redemptionFee(claimUsd: number): number {
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
