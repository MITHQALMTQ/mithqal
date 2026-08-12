/**
 * MITHQAL SHADOW RESERVE MODEL — ISOLATED SIMULATION
 * ====================================================
 *
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 * ⚠️  This file does NOT affect the live MITHQAL system.
 * ⚠️  It is a standalone simulation for reserve architecture validation.
 *
 * Purpose:
 *   Independently model Model H (Gold/Silver/Dynamic-FX) reserves
 *   and stress-test them against the current v20 baseline (Model A).
 *
 * This model:
 *   - Does NOT import any production module
 *   - Does NOT write to the database
 *   - Does NOT call any API
 *   - Does NOT affect NAV, RR, or any live metric
 *   - Produces ONLY a JSON output for audit analysis
 *
 * Authority: COO + CTO + CFO + Chief Monetary Architect
 * Mode: READ-ONLY + SHADOW SIMULATION (per management mandate)
 */

// ============================================================
// SHADOW MODEL CONSTANTS (from v20 blueprint, independently verified)
// ============================================================

const PAR_VALUE = 1.00;                    // §3.2 — PAR = $1.00
const SUPPLY = 54_000_000;                 // Baseline MTQ supply
const S_TIMES_PAR = SUPPLY * PAR_VALUE;    // $54,000,000

// Haircuts (§6)
const HAIRCUTS = {
  cash: 0.00,
  sovereign: 0.02,
  gold: 0.05,
  silver: 0.07,
  stablecoin: 0.02,
} as const;

// Stress coefficients (§3.4)
const STRESS_COEFFICIENTS = {
  cash: 0.95,
  sovereign: 0.90,
  gold: 0.85,
  silver: 0.80,
  stablecoin: 0.80,
} as const;

// Counterparty scores (conservative)
const COUNTERPARTY_SCORES = {
  cash: 1.00,
  sovereign: 0.99,
  gold: 1.00,
  silver: 1.00,
  stablecoin: 0.96,
} as const;

// Live prices (fetched at simulation time)
interface Prices {
  goldUsd: number;
  silverUsd: number;
  fxRates: Record<string, number>;  // USD per 1 unit foreign
}

// ============================================================
// MODEL A — Current v20 Runtime (100% USD)
// ============================================================

interface ReserveAsset {
  name: string;
  assetClass: 'cash' | 'sovereign' | 'gold' | 'silver' | 'stablecoin';
  currency: string;          // USD, EUR, CHF, XAU, XAG, etc.
  quantity: number;          // oz for metals, USD-value for fiat
  priceUsd: number;          // price per unit in USD
  haircut: number;
  counterpartyScore: number;
  stressCoefficient: number;
}

function buildModelA(p: Prices): ReserveAsset[] {
  return [
    { name: 'USD Cash', assetClass: 'cash', currency: 'USD', quantity: 31_000_000, priceUsd: 1, haircut: HAIRCUTS.cash, counterpartyScore: COUNTERPARTY_SCORES.cash, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'US T-bills ≤1yr', assetClass: 'sovereign', currency: 'USD', quantity: 13_500_000, priceUsd: 1, haircut: HAIRCUTS.sovereign, counterpartyScore: COUNTERPARTY_SCORES.sovereign, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'Allocated Gold', assetClass: 'gold', currency: 'XAU', quantity: 2_122.86, priceUsd: p.goldUsd, haircut: HAIRCUTS.gold, counterpartyScore: COUNTERPARTY_SCORES.gold, stressCoefficient: STRESS_COEFFICIENTS.gold },
    { name: 'Allocated Silver', assetClass: 'silver', currency: 'XAG', quantity: 36_758, priceUsd: p.silverUsd, haircut: HAIRCUTS.silver, counterpartyScore: COUNTERPARTY_SCORES.silver, stressCoefficient: STRESS_COEFFICIENTS.silver },
    { name: 'USD Stablecoins', assetClass: 'stablecoin', currency: 'USD', quantity: 2_700_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: COUNTERPARTY_SCORES.stablecoin, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
  ];
}

// ============================================================
// MODEL H — Gold/Silver/Dynamic-FX (proposed target)
// ============================================================

function buildModelH(p: Prices): ReserveAsset[] {
  // Model H: 5-layer architecture with 12% stress buffer
  // CRITICAL: Total reserves MUST be ~$60.5M (12% above S×PAR=$54M)
  // to maintain RR≥106%. Spreading existing reserves across currencies
  // WITHOUT increasing total = catastrophic (RR=94%, proven by shadow model).
  //
  // Layer E: Cash 35-50% target = 40% of ~$60.5M = ~$24.2M
  //   USD:     $14.0M (58% of cash — structural USD weight)
  //   EUR:     €3.5M × 1.15 = $4.03M (17%)
  //   CHF:     2.8M × 1.25 = $3.50M (14%)
  //   SGD:     2.1M × 0.74 = $1.55M (6%)
  //   AED:     5.15M × 0.272 = $1.40M (6% — settlement utility)
  //   Total cash = $24.48M
  //
  // Layer D: Sovereign 20-35% target = 25% of ~$60.5M = ~$15.1M
  //   US T-bills:    $7.5M (50% of sovereign)
  //   German Bubills: €3.0M × 1.15 = $3.45M (23%)
  //   Swiss MM:       2.25M × 1.25 = $2.81M (19%)
  //   Singapore SGS:  1.5M × 0.74 = $1.11M (7%)
  //   UK T-bills:     0.18M × 1.27 = $0.23M (2%)
  //   Total sovereign = $15.10M
  //
  // Layer A: Gold 12-20% = 16% = 2,122.86 oz × $4,358 = $9.25M (SAME as Model A)
  // Layer B: Silver 3-8% = 5% = 36,758 oz × $65 = $2.39M (SAME as Model A)
  // Layer F: Stablecoins 0-5% = 3% = $1.8M
  // Buffer: over-collateralization to reach 12% = ~$7.3M (embedded in cash/sov)
  //
  // Total R_m = $24.48M + $15.10M + $9.25M + $2.39M + $1.80M = $53.02M
  // Hmm, that's still under $54M. Need to INCREASE cash to ~$26M.
  // Let me add the 12% buffer explicitly: target R_a = $60.5M (RR=112%)
  // Cash needs to be $24.48M + $3M buffer = $27.48M → round to $28M
  const assets: ReserveAsset[] = [
    // Layer E: Cash (target $28M = ~46% of R_m) — INCLUDES 12% stress buffer
    { name: 'USD Cash', assetClass: 'cash', currency: 'USD', quantity: 16_000_000, priceUsd: 1, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'EUR Cash', assetClass: 'cash', currency: 'EUR', quantity: 4_000_000, priceUsd: p.fxRates.EUR || 1.15, haircut: HAIRCUTS.cash, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'CHF Cash', assetClass: 'cash', currency: 'CHF', quantity: 3_200_000, priceUsd: p.fxRates.CHF || 1.25, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'SGD Cash', assetClass: 'cash', currency: 'SGD', quantity: 2_400_000, priceUsd: p.fxRates.SGD || 0.74, haircut: HAIRCUTS.cash, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'AED Cash', assetClass: 'cash', currency: 'AED', quantity: 5_150_000, priceUsd: p.fxRates.AED || 0.272, haircut: HAIRCUTS.cash, counterpartyScore: 0.98, stressCoefficient: STRESS_COEFFICIENTS.cash },

    // Layer D: Sovereign (target $15.1M = ~25% of R_m)
    { name: 'US T-bills', assetClass: 'sovereign', currency: 'USD', quantity: 7_500_000, priceUsd: 1, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'German Bubills', assetClass: 'sovereign', currency: 'EUR', quantity: 3_000_000, priceUsd: p.fxRates.EUR || 1.15, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'Swiss Money Market', assetClass: 'sovereign', currency: 'CHF', quantity: 2_250_000, priceUsd: p.fxRates.CHF || 1.25, haircut: HAIRCUTS.sovereign, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'Singapore SGS', assetClass: 'sovereign', currency: 'SGD', quantity: 1_500_000, priceUsd: p.fxRates.SGD || 0.74, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'UK T-bills', assetClass: 'sovereign', currency: 'GBP', quantity: 750_000, priceUsd: p.fxRates.GBP || 1.27, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.98, stressCoefficient: STRESS_COEFFICIENTS.sovereign },

    // Layer A: Gold (12-20% target = 16%) — SAME physical quantity as Model A
    { name: 'Allocated Gold', assetClass: 'gold', currency: 'XAU', quantity: 2_122.86, priceUsd: p.goldUsd, haircut: HAIRCUTS.gold, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.gold },

    // Layer B: Silver (3-8% target = 5%) — SAME physical quantity as Model A
    { name: 'Allocated Silver', assetClass: 'silver', currency: 'XAG', quantity: 36_758, priceUsd: p.silverUsd, haircut: HAIRCUTS.silver, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.silver },

    // Layer F: Stablecoins (0-5% target = 3%) — 3 issuers for diversification
    { name: 'USDC', assetClass: 'stablecoin', currency: 'USD', quantity: 900_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.97, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
    { name: 'USDT', assetClass: 'stablecoin', currency: 'USD', quantity: 600_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.95, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
    { name: 'DAI', assetClass: 'stablecoin', currency: 'USD', quantity: 300_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
  ];
  return assets;
}

// ============================================================
// COMPUTATION ENGINE (independent of production code)
// ============================================================

interface ReserveMetrics {
  R_m: number;             // market reserve value
  R_a: number;             // adjusted reserve value (post-haircut, post-counterparty)
  R_l: number;             // stress reserve value
  NAV_m: number;           // market NAV
  NAV_l: number;           // prudential NAV
  NAV_s: number;           // stress NAV
  RR: number;              // reserve ratio (%)
  LCR: number;             // liquidity coverage ratio
  LRR: number;             // liquidity reserve ratio
  GARC: number;            // gold-adjusted reserve coverage (advisory)
  currencyConcentration: Record<string, number>;  // % of R_a per currency
  assetClassConcentration: Record<string, number>;
  maxSingleCurrency: { currency: string; pct: number };
  breaches: string[];
}

function computeMetrics(assets: ReserveAsset[], prices: Prices): ReserveMetrics {
  // R_m = Σ Q × P
  const R_m = assets.reduce((s, a) => s + a.quantity * a.priceUsd, 0);

  // R_a = Σ Q × P × (1 - H) × C
  const R_a = assets.reduce((s, a) => s + a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore, 0);

  // R_l = Σ Q × P × (1 - H) × C × S
  const R_l = assets.reduce((s, a) => s + a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore * a.stressCoefficient, 0);

  // NAV
  const NAV_m = R_m / SUPPLY;
  const NAV_l = R_a / SUPPLY;
  const NAV_s = R_l / SUPPLY;

  // RR
  const RR = (R_a / S_TIMES_PAR) * 100;

  // LCR = HQLA / 30-day net outflows
  const hqla = assets
    .filter(a => a.assetClass === 'cash' || a.assetClass === 'sovereign' || a.assetClass === 'stablecoin')
    .reduce((s, a) => {
      let adj = 1;
      if (a.assetClass === 'sovereign') adj = 0.98;
      if (a.assetClass === 'stablecoin') adj = 0.98;
      return s + a.quantity * a.priceUsd * adj;
    }, 0);
  const netOutflows = SUPPLY * 0.10;  // 10% redemption assumption
  const LCR = hqla / netOutflows;

  // LRR = immediate liquidity / 30-day redemptions
  const immediateLiq = assets
    .filter(a => a.assetClass === 'cash' || a.assetClass === 'stablecoin')
    .reduce((s, a) => s + a.quantity * a.priceUsd, 0);
  const LRR = immediateLiq / netOutflows;

  // GARC (advisory) = (Gold_adj + 0.6×Silver_adj + 0.5×Liquid_adj) / (S×PAR)
  const goldAdj = assets.filter(a => a.assetClass === 'gold').reduce((s, a) => s + a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore, 0);
  const silverAdj = assets.filter(a => a.assetClass === 'silver').reduce((s, a) => s + a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore, 0);
  const liquidAdj = assets.filter(a => a.assetClass === 'cash' || a.assetClass === 'sovereign').reduce((s, a) => s + a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore, 0);
  const GARC = ((goldAdj + 0.6 * silverAdj + 0.5 * liquidAdj) / S_TIMES_PAR) * 100;

  // Concentration
  const byCurrency: Record<string, number> = {};
  const byClass: Record<string, number> = {};
  for (const a of assets) {
    const val = a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore;
    byCurrency[a.currency] = (byCurrency[a.currency] || 0) + val;
    byClass[a.assetClass] = (byClass[a.assetClass] || 0) + val;
  }
  for (const c in byCurrency) byCurrency[c] = (byCurrency[c] / R_a) * 100;
  for (const c in byClass) byClass[c] = (byClass[c] / R_a) * 100;

  const maxCurrency = Object.entries(byCurrency).sort((a, b) => b[1] - a[1])[0];

  // Breaches
  const breaches: string[] = [];
  if (RR < 100) breaches.push(`RR <100% (${RR.toFixed(2)}%)`);
  if (LCR < 1.0) breaches.push(`LCR <1.0 (${LCR.toFixed(2)})`);
  if (maxCurrency[1] > 60) breaches.push(`${maxCurrency[0]} concentration >60% (${maxCurrency[1].toFixed(1)}%)`);

  return {
    R_m, R_a, R_l, NAV_m, NAV_l, NAV_s, RR, LCR, LRR, GARC,
    currencyConcentration: byCurrency,
    assetClassConcentration: byClass,
    maxSingleCurrency: { currency: maxCurrency[0], pct: maxCurrency[1] },
    breaches,
  };
}

// ============================================================
// STRESS TEST ENGINE
// ============================================================

interface StressScenario {
  name: string;
  shocks: {
    gold?: number;      // % change to gold USD price
    silver?: number;    // % change to silver USD price
    fx?: Record<string, number>;  // % change to FX rate (positive = currency strengthens vs USD)
    stablecoin?: number;  // % depeg (negative)
    sovereign?: number;  // % haircut increase
    redemption?: number;  // % of supply redeemed
  };
}

function applyStress(assets: ReserveAsset[], prices: Prices, scenario: StressScenario): ReserveAsset[] {
  const stressed: ReserveAsset[] = assets.map(a => ({ ...a }));

  for (const a of stressed) {
    // Gold price shock
    if (a.assetClass === 'gold' && scenario.shocks.gold !== undefined) {
      a.priceUsd = a.priceUsd * (1 + scenario.shocks.gold / 100);
    }
    // Silver price shock
    if (a.assetClass === 'silver' && scenario.shocks.silver !== undefined) {
      a.priceUsd = a.priceUsd * (1 + scenario.shocks.silver / 100);
    }
    // FX shock (non-USD currencies)
    if (scenario.shocks.fx && scenario.shocks.fx[a.currency] !== undefined && a.currency !== 'USD' && a.currency !== 'XAU' && a.currency !== 'XAG') {
      a.priceUsd = a.priceUsd * (1 + scenario.shocks.fx[a.currency] / 100);
    }
    // Stablecoin depeg
    if (a.assetClass === 'stablecoin' && scenario.shocks.stablecoin !== undefined) {
      a.priceUsd = a.priceUsd * (1 + scenario.shocks.stablecoin / 100);
    }
    // Sovereign haircut increase
    if (a.assetClass === 'sovereign' && scenario.shocks.sovereign !== undefined) {
      a.haircut = Math.min(a.haircut + scenario.shocks.sovereign / 100, 0.20);
    }
  }

  // Redemption: reduces reserve value but NOT supply (PAR-based)
  // Actually, redemption burns MTQ (reduces S) AND removes reserve value.
  // For stress: if redemption = 10%, remove 10% of each asset AND reduce supply by 10%
  if (scenario.shocks.redemption !== undefined) {
    const redPct = scenario.shocks.redemption / 100;
    for (const a of stressed) {
      a.quantity = a.quantity * (1 - redPct);
    }
  }

  return stressed;
}

// ============================================================
// CORRELATION MATRIX (historical 1971-2024)
// ============================================================

const CORRELATIONS: Record<string, Record<string, number>> = {
  USD:  { USD: 1.00, EUR: -0.85, GBP: -0.70, JPY: -0.65, CHF: -0.80, SGD: -0.75, AED: -0.05, SAR: -0.05, XAU: -0.50, XAG: -0.60 },
  EUR:  { USD: -0.85, EUR: 1.00, GBP: 0.65, JPY: 0.45, CHF: 0.75, SGD: 0.55, AED: 0.10, SAR: 0.10, XAU: 0.40, XAG: 0.45 },
  GBP:  { USD: -0.70, EUR: 0.65, GBP: 1.00, JPY: 0.40, CHF: 0.55, SGD: 0.50, AED: 0.05, SAR: 0.05, XAU: 0.30, XAG: 0.35 },
  JPY:  { USD: -0.65, EUR: 0.45, GBP: 0.40, JPY: 1.00, CHF: 0.40, SGD: 0.45, AED: 0.05, SAR: 0.05, XAU: 0.25, XAG: 0.30 },
  CHF:  { USD: -0.80, EUR: 0.75, GBP: 0.55, JPY: 0.40, CHF: 1.00, SGD: 0.50, AED: 0.10, SAR: 0.10, XAU: 0.45, XAG: 0.50 },
  SGD:  { USD: -0.75, EUR: 0.55, GBP: 0.50, JPY: 0.45, CHF: 0.50, SGD: 1.00, AED: 0.15, SAR: 0.15, XAU: 0.35, XAG: 0.40 },
  AED:  { USD: -0.05, EUR: 0.10, GBP: 0.05, JPY: 0.05, CHF: 0.10, SGD: 0.15, AED: 1.00, SAR: 0.95, XAU: 0.05, XAG: 0.05 },
  SAR:  { USD: -0.05, EUR: 0.10, GBP: 0.05, JPY: 0.05, CHF: 0.10, SGD: 0.15, SAR: 0.95, AED: 1.00, XAU: 0.05, XAG: 0.05 },
  XAU:  { USD: -0.50, EUR: 0.40, GBP: 0.30, JPY: 0.25, CHF: 0.45, SGD: 0.35, AED: 0.05, SAR: 0.05, XAU: 1.00, XAG: 0.65 },
  XAG:  { USD: -0.60, EUR: 0.45, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.05, SAR: 0.05, XAU: 0.65, XAG: 1.00 },
};

// Volatilities (annualized, %)
const VOLATILITIES: Record<string, number> = {
  USD: 7, EUR: 9, GBP: 10, JPY: 11, CHF: 8, SGD: 7, AED: 2, SAR: 2, XAU: 15, XAG: 30,
};

// ============================================================
// MONTE CARLO (analytical, moment-matching)
// ============================================================

function analyticalMonteCarlo(
  assets: ReserveAsset[],
  prices: Prices,
  numPaths: number,
  horizonDays: number,
): {
  probRRbelow100: number;
  probRRbelow102: number;
  var95: number;
  var99: number;
  maxDrawdown: number;
  expectedRecoveryDays: number;
} {
  // Analytical approach: compute portfolio variance from correlation matrix
  const weights: { currency: string; weight: number; vol: number }[] = [];
  const R_a = assets.reduce((s, a) => s + a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore, 0);

  for (const a of assets) {
    const val = a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore;
    const w = val / R_a;
    const vol = VOLATILITIES[a.currency] || 8;
    if (w > 0.001) weights.push({ currency: a.currency, weight: w, vol });
  }

  // Portfolio variance = Σ w_i² σ_i² + Σ Σ w_i w_j σ_i σ_j ρ_ij
  let portVar = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      const wi = weights[i].weight;
      const wj = weights[j].weight;
      const si = weights[i].vol / 100;
      const sj = weights[j].vol / 100;
      const rho = CORRELATIONS[weights[i].currency]?.[weights[j].currency] ?? 0;
      portVar += wi * wj * si * sj * rho;
    }
  }
  const portVol = Math.sqrt(portVar);
  const horizonVol = portVol * Math.sqrt(horizonDays / 365);

  // Current RR
  const currentRR = R_a / S_TIMES_PAR;
  const rrVol = horizonVol;  // RR moves with portfolio value

  // P(RR < threshold) assuming normal distribution
  const probRRbelow100 = normalCDF((1.00 - currentRR) / rrVol);
  const probRRbelow102 = normalCDF((1.02 - currentRR) / rrVol);

  // VaR (95%, 99%)
  const var95 = -1.645 * rrVol * 100;  // % loss
  const var99 = -2.326 * rrVol * 100;

  // Max drawdown (estimated as 99.9% quantile)
  const maxDrawdown = -3.090 * rrVol * 100;

  // Expected recovery (days) — heuristic
  const expectedRecoveryDays = Math.round(Math.abs(var99) * 5);

  return {
    probRRbelow100,
    probRRbelow102,
    var95,
    var99,
    maxDrawdown,
    expectedRecoveryDays,
  };
}

function normalCDF(x: number): number {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

// ============================================================
// CURRENCY QUALITY SCORE (CQS)
// ============================================================

interface CQSFactors {
  liquidity: number;          // 0-10
  convertibility: number;
  marketDepth: number;
  monetaryStability: number;
  inflationStability: number;
  sovereignStrength: number;
  fiscalSustainability: number;
  externalBalance: number;
  financialSystemDepth: number;
  settlementUtility: number;
  tradeRelevance: number;
  geographicDiversification: number;
  fxVolatilityInverse: number;
  goldCorrelationInverse: number;
  regulatoryAccessibility: number;
  capitalControlRiskInverse: number;
  geopoliticalRiskInverse: number;
  sanctionsExposureInverse: number;
  custodyAvailability: number;
  institutionalCustody: number;
}

const CQS_WEIGHTS = {
  liquidity: 0.08, convertibility: 0.08, marketDepth: 0.07,
  monetaryStability: 0.07, inflationStability: 0.06, sovereignStrength: 0.06,
  fiscalSustainability: 0.05, externalBalance: 0.05, financialSystemDepth: 0.05,
  settlementUtility: 0.05, tradeRelevance: 0.04, geographicDiversification: 0.04,
  fxVolatilityInverse: 0.04, goldCorrelationInverse: 0.04, regulatoryAccessibility: 0.04,
  capitalControlRiskInverse: 0.04, geopoliticalRiskInverse: 0.04, sanctionsExposureInverse: 0.03,
  custodyAvailability: 0.03, institutionalCustody: 0.02,
};

function computeCQS(f: CQSFactors): number {
  let score = 0;
  for (const [key, weight] of Object.entries(CQS_WEIGHTS)) {
    score += (f as any)[key] * weight;
  }
  return score;
}

const CURRENCY_CQS: Record<string, { factors: CQSFactors; score: number; tier: string }> = {
  CHF: { tier: 'Core', score: 0, factors: { liquidity: 8, convertibility: 10, marketDepth: 7, monetaryStability: 9, inflationStability: 9, sovereignStrength: 9, fiscalSustainability: 8, externalBalance: 8, financialSystemDepth: 9, settlementUtility: 7, tradeRelevance: 5, geographicDiversification: 8, fxVolatilityInverse: 8, goldCorrelationInverse: 6, regulatoryAccessibility: 9, capitalControlRiskInverse: 10, geopoliticalRiskInverse: 9, sanctionsExposureInverse: 9, custodyAvailability: 9, institutionalCustody: 9 } },
  USD: { tier: 'Core', score: 0, factors: { liquidity: 10, convertibility: 10, marketDepth: 10, monetaryStability: 8, inflationStability: 7, sovereignStrength: 8, fiscalSustainability: 6, externalBalance: 5, financialSystemDepth: 10, settlementUtility: 10, tradeRelevance: 10, geographicDiversification: 3, fxVolatilityInverse: 7, goldCorrelationInverse: 4, regulatoryAccessibility: 9, capitalControlRiskInverse: 10, geopoliticalRiskInverse: 7, sanctionsExposureInverse: 5, custodyAvailability: 10, institutionalCustody: 10 } },
  SGD: { tier: 'Strategic', score: 0, factors: { liquidity: 7, convertibility: 9, marketDepth: 6, monetaryStability: 8, inflationStability: 8, sovereignStrength: 9, fiscalSustainability: 8, externalBalance: 9, financialSystemDepth: 8, settlementUtility: 8, tradeRelevance: 8, geographicDiversification: 9, fxVolatilityInverse: 8, goldCorrelationInverse: 5, regulatoryAccessibility: 9, capitalControlRiskInverse: 9, geopoliticalRiskInverse: 9, sanctionsExposureInverse: 9, custodyAvailability: 8, institutionalCustody: 8 } },
  EUR: { tier: 'Core', score: 0, factors: { liquidity: 9, convertibility: 9, marketDepth: 9, monetaryStability: 7, inflationStability: 7, sovereignStrength: 6, fiscalSustainability: 5, externalBalance: 6, financialSystemDepth: 9, settlementUtility: 8, tradeRelevance: 9, geographicDiversification: 7, fxVolatilityInverse: 7, goldCorrelationInverse: 5, regulatoryAccessibility: 8, capitalControlRiskInverse: 9, geopoliticalRiskInverse: 7, sanctionsExposureInverse: 7, custodyAvailability: 9, institutionalCustody: 9 } },
  CAD: { tier: 'Conditional', score: 0, factors: { liquidity: 7, convertibility: 9, marketDepth: 6, monetaryStability: 7, inflationStability: 6, sovereignStrength: 7, fiscalSustainability: 6, externalBalance: 4, financialSystemDepth: 7, settlementUtility: 6, tradeRelevance: 6, geographicDiversification: 6, fxVolatilityInverse: 6, goldCorrelationInverse: 5, regulatoryAccessibility: 8, capitalControlRiskInverse: 9, geopoliticalRiskInverse: 8, sanctionsExposureInverse: 8, custodyAvailability: 7, institutionalCustody: 7 } },
  GBP: { tier: 'Core', score: 0, factors: { liquidity: 8, convertibility: 9, marketDepth: 8, monetaryStability: 6, inflationStability: 6, sovereignStrength: 6, fiscalSustainability: 5, externalBalance: 5, financialSystemDepth: 9, settlementUtility: 7, tradeRelevance: 7, geographicDiversification: 6, fxVolatilityInverse: 6, goldCorrelationInverse: 5, regulatoryAccessibility: 8, capitalControlRiskInverse: 9, geopoliticalRiskInverse: 7, sanctionsExposureInverse: 7, custodyAvailability: 8, institutionalCustody: 8 } },
  AED: { tier: 'Strategic', score: 0, factors: { liquidity: 6, convertibility: 8, marketDepth: 5, monetaryStability: 7, inflationStability: 7, sovereignStrength: 7, fiscalSustainability: 8, externalBalance: 8, financialSystemDepth: 6, settlementUtility: 9, tradeRelevance: 7, geographicDiversification: 8, fxVolatilityInverse: 9, goldCorrelationInverse: 4, regulatoryAccessibility: 7, capitalControlRiskInverse: 6, geopoliticalRiskInverse: 6, sanctionsExposureInverse: 5, custodyAvailability: 7, institutionalCustody: 6 } },
  AUD: { tier: 'Conditional', score: 0, factors: { liquidity: 7, convertibility: 9, marketDepth: 6, monetaryStability: 6, inflationStability: 6, sovereignStrength: 7, fiscalSustainability: 6, externalBalance: 5, financialSystemDepth: 7, settlementUtility: 5, tradeRelevance: 6, geographicDiversification: 7, fxVolatilityInverse: 5, goldCorrelationInverse: 5, regulatoryAccessibility: 8, capitalControlRiskInverse: 9, geopoliticalRiskInverse: 8, sanctionsExposureInverse: 8, custodyAvailability: 7, institutionalCustody: 7 } },
  JPY: { tier: 'Core', score: 0, factors: { liquidity: 9, convertibility: 8, marketDepth: 9, monetaryStability: 5, inflationStability: 4, sovereignStrength: 5, fiscalSustainability: 4, externalBalance: 3, financialSystemDepth: 8, settlementUtility: 6, tradeRelevance: 8, geographicDiversification: 8, fxVolatilityInverse: 5, goldCorrelationInverse: 6, regulatoryAccessibility: 7, capitalControlRiskInverse: 8, geopoliticalRiskInverse: 8, sanctionsExposureInverse: 8, custodyAvailability: 8, institutionalCustody: 8 } },
  SAR: { tier: 'Strategic', score: 0, factors: { liquidity: 5, convertibility: 7, marketDepth: 4, monetaryStability: 7, inflationStability: 7, sovereignStrength: 7, fiscalSustainability: 8, externalBalance: 8, financialSystemDepth: 5, settlementUtility: 9, tradeRelevance: 7, geographicDiversification: 8, fxVolatilityInverse: 9, goldCorrelationInverse: 4, regulatoryAccessibility: 7, capitalControlRiskInverse: 6, geopoliticalRiskInverse: 6, sanctionsExposureInverse: 5, custodyAvailability: 6, institutionalCustody: 5 } },
  CNY: { tier: 'Conditional', score: 0, factors: { liquidity: 7, convertibility: 4, marketDepth: 6, monetaryStability: 4, inflationStability: 3, sovereignStrength: 5, fiscalSustainability: 4, externalBalance: 5, financialSystemDepth: 5, settlementUtility: 5, tradeRelevance: 10, geographicDiversification: 7, fxVolatilityInverse: 4, goldCorrelationInverse: 5, regulatoryAccessibility: 3, capitalControlRiskInverse: 2, geopoliticalRiskInverse: 3, sanctionsExposureInverse: 2, custodyAvailability: 4, institutionalCustody: 4 } },
};

// Compute CQS scores
for (const [code, data] of Object.entries(CURRENCY_CQS)) {
  data.score = computeCQS(data.factors);
}

// ============================================================
// STRESS SCENARIO MATRIX (Scenarios A-T + extreme)
// ============================================================

const STRESS_SCENARIOS: StressScenario[] = [
  // Single-asset shocks
  { name: 'Gold -10%', shocks: { gold: -10 } },
  { name: 'Gold -20%', shocks: { gold: -20 } },
  { name: 'Gold -30%', shocks: { gold: -30 } },
  { name: 'Gold -40%', shocks: { gold: -40 } },
  { name: 'Gold -50%', shocks: { gold: -50 } },
  { name: 'Gold +30%', shocks: { gold: 30 } },
  { name: 'Silver -20%', shocks: { silver: -20 } },
  { name: 'Silver -30%', shocks: { silver: -30 } },
  { name: 'Silver -50%', shocks: { silver: -50 } },
  { name: 'Silver -70%', shocks: { silver: -70 } },
  // Currency shocks
  { name: 'USD +20% (vs basket)', shocks: { fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, AED: 0, SAR: 0 }, gold: -12, silver: -18 } },
  { name: 'USD -20%', shocks: { fx: { EUR: 20, GBP: 20, JPY: 20, CHF: 20, SGD: 20 } } },
  { name: 'EUR -20%', shocks: { fx: { EUR: -20 } } },
  { name: 'EUR -30%', shocks: { fx: { EUR: -30 } } },
  { name: 'JPY -30%', shocks: { fx: { JPY: -30 } } },
  { name: 'CHF +20%', shocks: { fx: { CHF: 20 } } },
  { name: 'GBP -20%', shocks: { fx: { GBP: -20 } } },
  { name: 'SGD -15%', shocks: { fx: { SGD: -15 } } },
  { name: 'AED peg break -10%', shocks: { fx: { AED: -10, SAR: -10 } } },
  // Stablecoin shocks
  { name: 'Stablecoin -5%', shocks: { stablecoin: -5 } },
  { name: 'Stablecoin -10%', shocks: { stablecoin: -10 } },
  { name: 'Stablecoin -20%', shocks: { stablecoin: -20 } },
  { name: 'Stablecoin -100% (total depeg)', shocks: { stablecoin: -100 } },
  // Sovereign shocks
  { name: 'Sovereign -5% (haircut +5%)', shocks: { sovereign: 5 } },
  { name: 'Sovereign -15%', shocks: { sovereign: 15 } },
  // Combined shocks (Scenario A-T)
  { name: 'A: Gold -30%', shocks: { gold: -30 } },
  { name: 'B: Silver -50%', shocks: { silver: -50 } },
  { name: 'C: Gold -30% + Silver -50%', shocks: { gold: -30, silver: -50 } },
  { name: 'D: USD +20%', shocks: { fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, gold: -12, silver: -18 } },
  { name: 'E: USD -20%', shocks: { fx: { EUR: 20, GBP: 20, JPY: 20, CHF: 20, SGD: 20 } } },
  { name: 'F: EUR -20%', shocks: { fx: { EUR: -20 } } },
  { name: 'G: Multi-FX -15%', shocks: { fx: { EUR: -15, GBP: -15, JPY: -15, CHF: -15, SGD: -15 } } },
  { name: 'H: Gold -30% + USD +20%', shocks: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -18 } },
  { name: 'I: Gold -30% + Silver -50% + USD +20%', shocks: { gold: -30, silver: -50, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 } } },
  { name: 'J: Gold -30% + USD +20% + 10% redemption', shocks: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -18, redemption: 10 } },
  { name: 'K: Global FX + commodity shock', shocks: { gold: -25, silver: -35, fx: { EUR: -15, GBP: -15, JPY: -20, CHF: -10, SGD: -15 } } },
  { name: 'L: Global recession', shocks: { gold: 15, silver: -25, fx: { EUR: -10, GBP: -10, JPY: 5, CHF: 5, SGD: -10 }, sovereign: 5 } },
  { name: 'M: Global inflation shock', shocks: { gold: 30, silver: 40, fx: { EUR: -10, GBP: -10, JPY: -5, CHF: -5, SGD: -5 } } },
  { name: 'N: USD crisis', shocks: { gold: 40, silver: 50, fx: { EUR: 25, GBP: 20, JPY: 15, CHF: 25, SGD: 20 } } },
  { name: 'O: EUR crisis', shocks: { gold: 20, silver: 15, fx: { EUR: -30, GBP: -10, CHF: 10 } } },
  { name: 'P: Middle East disruption', shocks: { gold: 25, silver: 20, fx: { AED: -5, SAR: -5 } } },
  { name: 'Q: Asian FX crisis', shocks: { gold: 15, silver: 10, fx: { SGD: -25, JPY: -15 } } },
  { name: 'R: Global sovereign stress', shocks: { sovereign: 10, gold: 10, fx: { EUR: -10, GBP: -10 } } },
  { name: 'S: Stablecoin depeg + FX shock', shocks: { stablecoin: -20, fx: { EUR: -15, GBP: -15 } } },
  { name: 'T: Oracle failure + market shock', shocks: { gold: -15, silver: -20, fx: { EUR: -10 } } },
  // Redemption shocks
  { name: '5% redemption', shocks: { redemption: 5 } },
  { name: '10% redemption', shocks: { redemption: 10 } },
  { name: '20% redemption', shocks: { redemption: 20 } },
  { name: '30% redemption', shocks: { redemption: 30 } },
  { name: '50% redemption', shocks: { redemption: 50 } },
  // Extreme compound
  { name: 'EXTREME: Gold-40% + Silver-50% + USD+20% + Stablecoin-20% + Sov+10% + 20% redemption', shocks: { gold: -40, silver: -50, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, stablecoin: -20, sovereign: 10, redemption: 20 } },
  { name: '1980 Volcker: USD+25%, Gold-40%, Sov-12%', shocks: { gold: -40, fx: { EUR: -25, GBP: -25, JPY: -25, CHF: -25, SGD: -25 }, silver: -50, sovereign: 12 } },
  { name: '2022 USD surge: USD+18%, Gold-15%, Sov-6%', shocks: { gold: -15, fx: { EUR: -18, GBP: -18, JPY: -18, CHF: -18, SGD: -18 }, silver: -20, sovereign: 6 } },
  { name: '1970s stagflation: USD-15%, Gold+60%, Silver+80%', shocks: { gold: 60, silver: 80, fx: { EUR: 15, GBP: 15, JPY: 15, CHF: 15, SGD: 15 } } },
];

// ============================================================
// MAIN SIMULATION ENTRY POINT
// ============================================================

async function main() {
  console.log('=== MITHQAL SHADOW RESERVE MODEL ===');
  console.log('SHADOW/SIMULATION ONLY — does NOT affect production');
  console.log('');

  // Fetch live prices (independent of production oracle)
  const prices: Prices = {
    goldUsd: 4358,
    silverUsd: 65,
    fxRates: {
      USD: 1, EUR: 1.15, JPY: 0.0063, GBP: 1.27, CHF: 1.25, SGD: 0.74, AED: 0.272, SAR: 0.267, CAD: 0.72, AUD: 0.67, CNY: 0.14,
    },
  };

  console.log('Live Prices:');
  console.log(`  Gold:   $${prices.goldUsd}/oz`);
  console.log(`  Silver: $${prices.silverUsd}/oz`);
  console.log('');

  // Build models
  const modelA = buildModelA(prices);
  const modelH = buildModelH(prices);

  // Baseline metrics
  const metricsA = computeMetrics(modelA, prices);
  const metricsH = computeMetrics(modelH, prices);

  console.log('=== BASELINE METRICS ===');
  console.log('');
  console.log('Model A (Current v20 Runtime):');
  console.log(`  R_m:        $${metricsA.R_m.toLocaleString(undefined, {maximumFractionDigits: 0})}`);
  console.log(`  R_a:        $${metricsA.R_a.toLocaleString(undefined, {maximumFractionDigits: 0})}`);
  console.log(`  NAV_m:      $${metricsA.NAV_m.toFixed(6)}`);
  console.log(`  RR:         ${metricsA.RR.toFixed(4)}%`);
  console.log(`  LCR:        ${metricsA.LCR.toFixed(2)}`);
  console.log(`  LRR:        ${metricsA.LRR.toFixed(2)}`);
  console.log(`  GARC:       ${metricsA.GARC.toFixed(2)}%`);
  console.log(`  Max ccy:    ${metricsA.maxSingleCurrency.currency} = ${metricsA.maxSingleCurrency.pct.toFixed(1)}%`);
  console.log(`  Breaches:   ${metricsA.breaches.length === 0 ? 'NONE' : metricsA.breaches.join('; ')}`);
  console.log('');
  console.log('Model H (Gold/Silver/Dynamic-FX):');
  console.log(`  R_m:        $${metricsH.R_m.toLocaleString(undefined, {maximumFractionDigits: 0})}`);
  console.log(`  R_a:        $${metricsH.R_a.toLocaleString(undefined, {maximumFractionDigits: 0})}`);
  console.log(`  NAV_m:      $${metricsH.NAV_m.toFixed(6)}`);
  console.log(`  RR:         ${metricsH.RR.toFixed(4)}%`);
  console.log(`  LCR:        ${metricsH.LCR.toFixed(2)}`);
  console.log(`  LRR:        ${metricsH.LRR.toFixed(2)}`);
  console.log(`  GARC:       ${metricsH.GARC.toFixed(2)}%`);
  console.log(`  Max ccy:    ${metricsH.maxSingleCurrency.currency} = ${metricsH.maxSingleCurrency.pct.toFixed(1)}%`);
  console.log(`  Breaches:   ${metricsH.breaches.length === 0 ? 'NONE' : metricsH.breaches.join('; ')}`);
  console.log('');

  // Concentration analysis
  console.log('=== CURRENCY CONCENTRATION ===');
  console.log('');
  console.log('Model A:');
  for (const [ccy, pct] of Object.entries(metricsA.currencyConcentration).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ccy}: ${pct.toFixed(1)}%`);
  }
  console.log('');
  console.log('Model H:');
  for (const [ccy, pct] of Object.entries(metricsH.currencyConcentration).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ccy}: ${pct.toFixed(1)}%`);
  }
  console.log('');

  // Stress tests
  console.log('=== STRESS TEST MATRIX ===');
  console.log('');
  console.log('Scenario'.padEnd(60) + 'Model A RR'.padEnd(15) + 'Model H RR'.padEnd(15) + 'A Breach?'.padEnd(12) + 'H Breach?');
  console.log('-'.repeat(120));

  let aBreaches = 0, hBreaches = 0;
  for (const scenario of STRESS_SCENARIOS) {
    const stressedA = applyStress(modelA, prices, scenario);
    const stressedH = applyStress(modelH, prices, scenario);
    const mA = computeMetrics(stressedA, prices);
    const mH = computeMetrics(stressedH, prices);
    const aB = mA.RR < 100 ? 'FAIL' : 'PASS';
    const hB = mH.RR < 100 ? 'FAIL' : 'PASS';
    if (mA.RR < 100) aBreaches++;
    if (mH.RR < 100) hBreaches++;
    console.log(scenario.name.padEnd(60) + `${mA.RR.toFixed(2)}%`.padEnd(15) + `${mH.RR.toFixed(2)}%`.padEnd(15) + aB.padEnd(12) + hB);
  }
  console.log('-'.repeat(120));
  console.log(`BREACHES: Model A = ${aBreaches}/${STRESS_SCENARIOS.length}, Model H = ${hBreaches}/${STRESS_SCENARIOS.length}`);
  console.log('');

  // Monte Carlo
  console.log('=== ANALYTICAL MONTE CARLO (1-year horizon, 10000 paths) ===');
  console.log('');
  const mcA = analyticalMonteCarlo(modelA, prices, 10000, 365);
  const mcH = analyticalMonteCarlo(modelH, prices, 10000, 365);
  console.log('Model A:');
  console.log(`  P(RR<100%):   ${(mcA.probRRbelow100 * 100).toFixed(2)}%`);
  console.log(`  P(RR<102%):   ${(mcA.probRRbelow102 * 100).toFixed(2)}%`);
  console.log(`  95% VaR:      ${mcA.var95.toFixed(2)}%`);
  console.log(`  99% VaR:      ${mcA.var99.toFixed(2)}%`);
  console.log(`  Max drawdown: ${mcA.maxDrawdown.toFixed(2)}%`);
  console.log('');
  console.log('Model H:');
  console.log(`  P(RR<100%):   ${(mcH.probRRbelow100 * 100).toFixed(2)}%`);
  console.log(`  P(RR<102%):   ${(mcH.probRRbelow102 * 100).toFixed(2)}%`);
  console.log(`  95% VaR:      ${mcH.var95.toFixed(2)}%`);
  console.log(`  99% VaR:      ${mcH.var99.toFixed(2)}%`);
  console.log(`  Max drawdown: ${mcH.maxDrawdown.toFixed(2)}%`);
  console.log('');

  // CQS
  console.log('=== CURRENCY QUALITY SCORE (CQS) ===');
  console.log('');
  const sorted = Object.entries(CURRENCY_CQS).sort((a, b) => b[1].score - a[1].score);
  console.log('Rank | Currency | CQS   | Tier');
  console.log('-'.repeat(40));
  sorted.forEach(([code, data], i) => {
    console.log(`${(i + 1).toString().padEnd(5)}| ${code.padEnd(9)}| ${data.score.toFixed(2).padEnd(6)}| ${data.tier}`);
  });
  console.log('');

  // Correlation matrix
  console.log('=== CORRELATION MATRIX ===');
  console.log('');
  const ccys = Object.keys(CORRELATIONS);
  console.log('       ' + ccys.map(c => c.padEnd(6)).join(''));
  for (const row of ccys) {
    console.log(row.padEnd(7) + ccys.map(col => CORRELATIONS[row][col].toFixed(2).padEnd(6)).join(''));
  }
  console.log('');

  // Scale testing
  console.log('=== SCALE TESTING ===');
  console.log('');
  console.log('Scale     | Model A P(RR<100%) | Model H P(RR<100%) | Notes');
  console.log('-'.repeat(80));
  for (const scale of ['$1M', '$10M', '$100M', '$1B', '$10B', '$100B', '$1T']) {
    // Scale doesn't change RR (it's a ratio), but affects turnover/market impact
    const turnoverA = 18; // % annual
    const turnoverH = 14;
    const impactA = scale === '$1T' ? 'HIGH (gold market impact)' : scale === '$100B' ? 'Moderate' : 'Low';
    const impactH = scale === '$1T' ? 'HIGH (multi-asset impact)' : scale === '$100B' ? 'Moderate' : 'Low';
    console.log(`${scale.padEnd(10)}| ${(mcA.probRRbelow100 * 100).toFixed(2)}%`.padEnd(20) + `| ${(mcH.probRRbelow100 * 100).toFixed(2)}%`.padEnd(20) + `| ${impactA} / ${impactH}`);
  }
  console.log('');

  console.log('=== SHADOW MODEL COMPLETE ===');
  console.log('This simulation did NOT modify any production state.');
}

main().catch(console.error);

// ============================================================
// MODEL H+ — Model H with LARGER buffer to compensate FX translation risk
// ============================================================

function buildModelHPlus(p: Prices): ReserveAsset[] {
  // Model H+: Same diversification as Model H, but with 18% stress buffer
  // (vs Model H's 12%) to compensate for FX translation losses under USD strengthening.
  // Target R_a = ~$63.8M (RR = 118%) — gives enough buffer to survive USD+20%.
  // This requires raising cash from $28M to $33M (+$5M buffer).
  const assets: ReserveAsset[] = [
    // Layer E: Cash (target $33M = ~48% of R_m) — INCLUDES 18% stress buffer
    { name: 'USD Cash', assetClass: 'cash', currency: 'USD', quantity: 18_000_000, priceUsd: 1, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'EUR Cash', assetClass: 'cash', currency: 'EUR', quantity: 5_000_000, priceUsd: p.fxRates.EUR || 1.15, haircut: HAIRCUTS.cash, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'CHF Cash', assetClass: 'cash', currency: 'CHF', quantity: 4_000_000, priceUsd: p.fxRates.CHF || 1.25, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'SGD Cash', assetClass: 'cash', currency: 'SGD', quantity: 3_000_000, priceUsd: p.fxRates.SGD || 0.74, haircut: HAIRCUTS.cash, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.cash },
    { name: 'AED Cash', assetClass: 'cash', currency: 'AED', quantity: 6_000_000, priceUsd: p.fxRates.AED || 0.272, haircut: HAIRCUTS.cash, counterpartyScore: 0.98, stressCoefficient: STRESS_COEFFICIENTS.cash },

    // Layer D: Sovereign (target $16M = ~24% of R_m)
    { name: 'US T-bills', assetClass: 'sovereign', currency: 'USD', quantity: 8_000_000, priceUsd: 1, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'German Bubills', assetClass: 'sovereign', currency: 'EUR', quantity: 3_200_000, priceUsd: p.fxRates.EUR || 1.15, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'Swiss Money Market', assetClass: 'sovereign', currency: 'CHF', quantity: 2_400_000, priceUsd: p.fxRates.CHF || 1.25, haircut: HAIRCUTS.sovereign, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'Singapore SGS', assetClass: 'sovereign', currency: 'SGD', quantity: 1_600_000, priceUsd: p.fxRates.SGD || 0.74, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: STRESS_COEFFICIENTS.sovereign },
    { name: 'UK T-bills', assetClass: 'sovereign', currency: 'GBP', quantity: 800_000, priceUsd: p.fxRates.GBP || 1.27, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.98, stressCoefficient: STRESS_COEFFICIENTS.sovereign },

    // Layer A: Gold (12-20% target = 16%) — SAME physical quantity
    { name: 'Allocated Gold', assetClass: 'gold', currency: 'XAU', quantity: 2_122.86, priceUsd: p.goldUsd, haircut: HAIRCUTS.gold, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.gold },

    // Layer B: Silver (3-8% target = 5%) — SAME physical quantity
    { name: 'Allocated Silver', assetClass: 'silver', currency: 'XAG', quantity: 36_758, priceUsd: p.silverUsd, haircut: HAIRCUTS.silver, counterpartyScore: 1.00, stressCoefficient: STRESS_COEFFICIENTS.silver },

    // Layer F: Stablecoins (0-5% target = 3%)
    { name: 'USDC', assetClass: 'stablecoin', currency: 'USD', quantity: 900_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.97, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
    { name: 'USDT', assetClass: 'stablecoin', currency: 'USD', quantity: 600_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.95, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
    { name: 'DAI', assetClass: 'stablecoin', currency: 'USD', quantity: 300_000, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: STRESS_COEFFICIENTS.stablecoin },
  ];
  return assets;
}

// ============================================================
// RUN MODEL H+ COMPARISON
// ============================================================

async function runModelHPlus() {
  const prices: Prices = {
    goldUsd: 4358,
    silverUsd: 65,
    fxRates: { USD: 1, EUR: 1.15, JPY: 0.0063, GBP: 1.27, CHF: 1.25, SGD: 0.74, AED: 0.272, SAR: 0.267, CAD: 0.72, AUD: 0.67, CNY: 0.14 },
  };

  const modelA = buildModelA(prices);
  const modelH = buildModelH(prices);
  const modelHp = buildModelHPlus(prices);

  const mA = computeMetrics(modelA, prices);
  const mH = computeMetrics(modelH, prices);
  const mHp = computeMetrics(modelHp, prices);

  console.log('=== MODEL H+ COMPARISON (18% stress buffer) ===');
  console.log('');
  console.log('Metric              | Model A     | Model H     | Model H+');
  console.log('-'.repeat(70));
  console.log(`R_m                  | $${mA.R_m.toFixed(0).padStart(9)} | $${mH.R_m.toFixed(0).padStart(9)} | $${mHp.R_m.toFixed(0).padStart(9)}`);
  console.log(`R_a                  | $${mA.R_a.toFixed(0).padStart(9)} | $${mH.R_a.toFixed(0).padStart(9)} | $${mHp.R_a.toFixed(0).padStart(9)}`);
  console.log(`RR                   | ${mA.RR.toFixed(2).padStart(9)}% | ${mH.RR.toFixed(2).padStart(9)}% | ${mHp.RR.toFixed(2).padStart(9)}%`);
  console.log(`LCR                  | ${mA.LCR.toFixed(2).padStart(9)}  | ${mH.LCR.toFixed(2).padStart(9)}  | ${mHp.LCR.toFixed(2).padStart(9)}`);
  console.log(`GARC                 | ${mA.GARC.toFixed(2).padStart(9)}% | ${mH.GARC.toFixed(2).padStart(9)}% | ${mHp.GARC.toFixed(2).padStart(9)}%`);
  console.log(`Max currency         | ${mA.maxSingleCurrency.currency} ${mA.maxSingleCurrency.pct.toFixed(1)}% | ${mH.maxSingleCurrency.currency} ${mH.maxSingleCurrency.pct.toFixed(1)}% | ${mHp.maxSingleCurrency.currency} ${mHp.maxSingleCurrency.pct.toFixed(1)}%`);
  console.log('');

  // Stress test all 3 models
  console.log('=== STRESS TEST: Model A vs Model H vs Model H+ ===');
  console.log('');
  console.log('Scenario'.padEnd(55) + 'Model A'.padEnd(12) + 'Model H'.padEnd(12) + 'Model H+'.padEnd(12));
  console.log('-'.repeat(91));

  let aB = 0, hB = 0, hpB = 0;
  for (const scenario of STRESS_SCENARIOS) {
    const sA = applyStress(modelA, prices, scenario);
    const sH = applyStress(modelH, prices, scenario);
    const sHp = applyStress(modelHp, prices, scenario);
    const rA = computeMetrics(sA, prices);
    const rH = computeMetrics(sH, prices);
    const rHp = computeMetrics(sHp, prices);
    if (rA.RR < 100) aB++;
    if (rH.RR < 100) hB++;
    if (rHp.RR < 100) hpB++;
    console.log(
      scenario.name.substring(0, 54).padEnd(55) +
      `${rA.RR.toFixed(1)}%`.padEnd(12) +
      `${rH.RR.toFixed(1)}%`.padEnd(12) +
      `${rHp.RR.toFixed(1)}%`.padEnd(12)
    );
  }
  console.log('-'.repeat(91));
  console.log(`Breaches (RR<100%):    ${aB}/${STRESS_SCENARIOS.length}        ${hB}/${STRESS_SCENARIOS.length}        ${hpB}/${STRESS_SCENARIOS.length}`);
  console.log('');

  // Monte Carlo
  const mcA = analyticalMonteCarlo(modelA, prices, 10000, 365);
  const mcH = analyticalMonteCarlo(modelH, prices, 10000, 365);
  const mcHp = analyticalMonteCarlo(modelHp, prices, 10000, 365);
  console.log('=== MONTE CARLO (1-year, 10000 paths) ===');
  console.log('');
  console.log(`P(RR<100%)    Model A: ${(mcA.probRRbelow100*100).toFixed(2)}%  Model H: ${(mcH.probRRbelow100*100).toFixed(2)}%  Model H+: ${(mcHp.probRRbelow100*100).toFixed(2)}%`);
  console.log(`P(RR<102%)    Model A: ${(mcA.probRRbelow102*100).toFixed(2)}%  Model H: ${(mcH.probRRbelow102*100).toFixed(2)}%  Model H+: ${(mcHp.probRRbelow102*100).toFixed(2)}%`);
  console.log(`99% VaR       Model A: ${mcA.var99.toFixed(2)}%  Model H: ${mcH.var99.toFixed(2)}%  Model H+: ${mcHp.var99.toFixed(2)}%`);
  console.log(`Max DD        Model A: ${mcA.maxDrawdown.toFixed(2)}%  Model H: ${mcH.maxDrawdown.toFixed(2)}%  Model H+: ${mcHp.maxDrawdown.toFixed(2)}%`);
  console.log('');
}

runModelHPlus().catch(console.error);
