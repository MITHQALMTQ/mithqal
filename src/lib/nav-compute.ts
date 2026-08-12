// Shared Dynamic NAV Computer — v23 Four-Layer Architecture
// ============================================================
// Used by /api/mint, /api/redeem, /api/nav, /api/transparency.
//
// v23 changes from v19:
//   - 11-currency basket (Enhanced H++ weights) replaces 100% USD
//   - Digital liquidity sleeve (USDC/USDP/EURC/BUIDL) replaces generic stablecoin
//   - 20% solvency buffer (target RR ≥ 117%)
//   - GEI, BRI, LCI advisory metrics computed alongside NAV
//   - Multi-currency cash + sovereign with live FX revaluation
//
// FX convention: fxRates[c] is "USD per 1 unit foreign currency"
// (e.g. EUR=1.149 means 1 EUR = $1.149). Inverted for display.

import {
  computeMonetaryStateV19,
  HAIRCUTS,
  type ReserveAsset,
  type MonetaryStateV19,
} from "./monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "./live-oracle";
import { getOracleSnapshot } from "./oracle-client";

// ---- v23 Enhanced H++ Reserve Composition ----
// Three-pillar: Bullion 20% / Fiat 75% / Digital Liquidity 3.5%
// 20% solvency buffer → target R_a ≈ $63M (RR ≈ 117%)

// Pillar A: Bullion (20% — fixed physical quantities)
const GOLD_OZ = 2_122.86;
const SILVER_OZ = 36_758;

// Pillar B: Global Fiat Reserve (75% — 11 currencies, 60% cash / 40% sovereign)
// Enhanced H++ strategic target weights (fraction of total R_a)
const FIAT_WEIGHTS: Record<string, number> = {
  USD: 0.27, EUR: 0.18, CHF: 0.06, JPY: 0.06, GBP: 0.05,
  SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
};
// Counterparty scores per currency
const CP_SCORES: Record<string, number> = {
  USD: 1.00, EUR: 0.99, CHF: 1.00, JPY: 0.98, GBP: 0.98,
  SGD: 0.99, AED: 0.98, SAR: 0.97, CNY: 0.92, CAD: 0.99, AUD: 0.98,
};
// Sovereign issuers per currency
const SOV_ISSUERS: Record<string, string> = {
  USD: "US T-bills", EUR: "German Bubills", CHF: "Swiss MM", JPY: "JGB",
  GBP: "UK T-bills", SGD: "Singapore SGS", AED: "UAE bonds", SAR: "Saudi SAB",
  CNY: "Chinese T-bills", CAD: "Canada T-bills", AUD: "Australia T-bills",
};

// Pillar C: Digital Liquidity Sleeve (3.5% — v23 revised)
const DIGITAL_ASSETS = [
  { id: "usdc", name: "USDC", peg: "USD", drqs: 8.50, targetUsd: 1_260_000 },  // 2.0%
  { id: "usdp", name: "USDP", peg: "USD", drqs: 8.45, targetUsd: 315_000 },    // 0.5%
  { id: "eurc", name: "EURC", peg: "EUR", drqs: 7.80, targetUsd: 315_000 },    // 0.5%
  { id: "buidl", name: "BUIDL", peg: "USD", drqs: 8.55, targetUsd: 315_000 },   // 0.5%
];

// Target total R_a with 20% buffer
const TARGET_RA = 63_000_000; // $54M × 1.167 ≈ $63M

const BASELINE_SUPPLY = 54_000_000;
const FALLBACK_SILVER_USD = 58.76;

// Base date values for GEI/BRI normalization
const BASE_GOLD_PRICE = 4358; // Base date gold price for GEI/BRI normalization
const BASE_SILVER_PRICE = 65; // Base date silver price

// Conservative fallback silver price (only used if both the on-chain oracle
// AND the live API fail to return a usable value).
// (already defined above)

export interface NavResult {
  /** §3.1 Market NAV (R_m / S) */
  navM: number;
  /** §3.2 Prudential NAV (R_a / S) */
  navL: number;
  /** §3.3 Stress NAV (R_l / S) */
  navStress: number;
  /** §4 Reserve Ratio (R_a / (S × PAR), as percentage) */
  reserveRatio: number;
  /** Live gold spot price (USD/oz) */
  goldUsd: number;
  /** Live silver spot price (USD/oz) */
  silverUsd: number;
  /** Live FX rates: foreign currency units per 1 USD */
  fxRates: Record<string, number>;
  /** MTQ supply */
  supply: number;
  /** Minting-pause flag */
  mintingPaused: boolean;
  /** Basket verification result */
  basketVerified: boolean;
  /** Total market reserve value (R_m) in USD */
  reserveMarketUsd: number;
  /** Total adjusted reserve value (R_a) in USD */
  reserveAdjustedUsd: number;
  /** Oracle sources */
  sources: string[];
  /** Reserve assets array */
  reserveAssets: ReserveAsset[];
  /** Full monetary state */
  state: MonetaryStateV19;
  // v23 Layer 2: Advisory metrics
  /** §3.7 Gold-Equivalent Index (normalized to 1.0 at base date) */
  gei: number;
  /** §3.8 Bullion Resilience Index (CVaR-optimized weights 0.90/0.10) */
  bri: number;
  /** §3.9 Liquidity Coverage Index (advisory stress) */
  lci: number;
  /** §3.10 Gold-Adjusted Coverage Ratio (= RR, reporting only) */
  gacr: number;
  /** v23: USD concentration (% of R_a) */
  usdConcentration: number;
  /** v23: Currency concentration breakdown */
  currencyConcentration: Record<string, number>;
  /** v23: Pillar breakdown */
  pillarBreakdown: { bullion: number; fiat: number; digital: number };
}

/**
 * v23: Compute live NAV with 11-currency basket + digital liquidity sleeve.
 * Replaces v19's 100% USD composition with Enhanced H++ weights.
 */
export async function computeLiveNav(): Promise<NavResult> {
  const [liveData, oracleSnapshotData] = await Promise.all([
    getLiveOracleData(),
    getOracleSnapshot(),
  ]);

  const oracle = toOracleSnapshot(liveData);
  const goldPrice = liveData.goldUsd;

  // Silver: prefer multi-oracle consensus, fall back to oracle snapshot, then constant
  let silverPrice = oracleSnapshotData.silverUsd > 0
    ? oracleSnapshotData.silverUsd
    : FALLBACK_SILVER_USD;
  try {
    const { getMultiOracleSilverPrice } = await import("./multi-oracle");
    const silverOracle = await getMultiOracleSilverPrice(goldPrice);
    if (silverOracle.consensusPrice > 0) {
      silverPrice = silverOracle.consensusPrice;
    }
  } catch {
    // keep single-source silver
  }

  // Build FX rate map (USD per 1 unit foreign currency)
  const fxMap: Record<string, number> = { USD: 1.0 };
  for (const c of oracle.currencies) {
    fxMap[c.code] = c.fx;
  }
  // Ensure all 11 currencies have FX rates (fallback to live-oracle defaults)
  for (const ccy of Object.keys(FIAT_WEIGHTS)) {
    if (!fxMap[ccy] || fxMap[ccy] <= 0) {
      fxMap[ccy] = (liveData.fxRates as Record<string, number>)[ccy] || 1.0;
    }
  }

  // ---- Build v23 reserve assets ----
  const reserveAssets: ReserveAsset[] = [];

  // Calculate fiat allocation: TARGET_RA × 75% = ~$47.25M
  const fiatTotal = TARGET_RA * 0.75;
  const wSum = Object.values(FIAT_WEIGHTS).reduce((a, b) => a + b, 0);

  // Pillar B: Cash (60% of fiat) + Sovereign (40% of fiat) per currency
  for (const [ccy, w] of Object.entries(FIAT_WEIGHTS)) {
    const ccyTotal = fiatTotal * (w / wSum);
    const fx = fxMap[ccy] || 1.0;
    const cp = CP_SCORES[ccy] || 0.95;

    // Cash (60%)
    const cashUsd = ccyTotal * 0.60;
    reserveAssets.push({
      id: `cash-${ccy.toLowerCase()}`,
      name: `${ccy} Cash`,
      assetClass: "cash",
      quantity: cashUsd / fx, // in foreign currency units
      priceUsd: fx,
      haircut: HAIRCUTS.cash,
      counterpartyScore: cp,
      stressCoefficient: 0.95,
      modifiedDuration: 0,
    });

    // Sovereign (40%)
    const sovUsd = ccyTotal * 0.40;
    reserveAssets.push({
      id: `sov-${ccy.toLowerCase()}`,
      name: SOV_ISSUERS[ccy] || `${ccy} Sovereign`,
      assetClass: "sovereign",
      quantity: sovUsd / fx,
      priceUsd: fx,
      haircut: HAIRCUTS.sovereign,
      counterpartyScore: cp,
      stressCoefficient: 0.90,
      modifiedDuration: 0.5,
    });
  }

  // Pillar A: Gold (15%)
  reserveAssets.push({
    id: "gold-1",
    name: "Allocated gold",
    assetClass: "gold",
    quantity: GOLD_OZ,
    priceUsd: goldPrice,
    haircut: HAIRCUTS.gold,
    counterpartyScore: 1.00,
    stressCoefficient: 0.85,
    modifiedDuration: 0,
  });

  // Pillar A: Silver (5%)
  reserveAssets.push({
    id: "silver-1",
    name: "Allocated silver",
    assetClass: "silver",
    quantity: SILVER_OZ,
    priceUsd: silverPrice,
    haircut: HAIRCUTS.silver,
    counterpartyScore: 1.00,
    stressCoefficient: 0.80,
    modifiedDuration: 0,
  });

  // Pillar C: Digital Liquidity Sleeve (3.5%)
  for (const da of DIGITAL_ASSETS) {
    const fx = da.peg === "EUR" ? (fxMap["EUR"] || 1.15) : 1.0;
    reserveAssets.push({
      id: `stab-${da.id}`,
      name: da.name,
      assetClass: "stablecoin",
      quantity: da.targetUsd / fx,
      priceUsd: fx,
      haircut: HAIRCUTS.stablecoin,
      counterpartyScore: 0.90 + (da.drqs / 100), // DRQS-based CP score
      stressCoefficient: 0.80,
      modifiedDuration: 0,
    });
  }

  // ---- EWMA returns for shock absorber ----
  const goldSeries = (oracle as { goldPriceSeries?: number[] }).goldPriceSeries;
  const ewmaReturns: number[] = [];
  if (goldSeries && goldSeries.length >= 2) {
    for (let i = 1; i < goldSeries.length; i++) {
      const prev = goldSeries[i - 1];
      const curr = goldSeries[i];
      if (prev > 0 && curr > 0) {
        ewmaReturns.push(Math.log(curr / prev));
      }
    }
  }

  // ---- HQLA for LCR ----
  const hqla = reserveAssets
    .filter(a => a.assetClass === "cash" || a.assetClass === "sovereign" || a.assetClass === "stablecoin")
    .reduce((s, a) => {
      let adj = 1;
      if (a.assetClass === "sovereign") adj = 0.98;
      if (a.assetClass === "stablecoin") adj = 0.98;
      return s + a.quantity * a.priceUsd * adj;
    }, 0);

  const monetary = computeMonetaryStateV19(
    oracle,
    reserveAssets,
    BASELINE_SUPPLY,
    {
      hqla,
      expectedRedemptions: BASELINE_SUPPLY * 0.10,
      committedInflows: 0,
      operationalAdjustments: 0,
    },
    { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 },
    0.015,
    ewmaReturns,
  );

  // ---- v23 Layer 2: Advisory metrics ----
  const rA = monetary.reserves.adjusted; // R_a
  const rM = monetary.reserves.market;   // R_m

  // GEI: (R_a,t / G_t) / (R_a,0 / G_0) — normalized to 1.0
  const baseRa = TARGET_RA; // Base date R_a
  const gei = (rA / goldPrice) / (baseRa / BASE_GOLD_PRICE);

  // BRI: (GoldVal_t/GoldVal_0)^0.90 × (SilverVal_t/SilverVal_0)^0.10
  const goldVal = GOLD_OZ * goldPrice;
  const silverVal = SILVER_OZ * silverPrice;
  const baseGoldVal = GOLD_OZ * BASE_GOLD_PRICE;
  const baseSilverVal = SILVER_OZ * BASE_SILVER_PRICE;
  const bri = Math.pow(goldVal / baseGoldVal, 0.90) * Math.pow(silverVal / baseSilverVal, 0.10);

  // LCI: HQLA / (S × 0.10)
  const lci = hqla / (BASELINE_SUPPLY * 0.10);

  // GACR: = RR (reporting only)
  const gacr = monetary.reserveRatio.ratio;

  // ---- Currency concentration analysis ----
  const ccyConc: Record<string, number> = {};
  for (const a of reserveAssets) {
    const ccy = a.assetClass === "gold" ? "XAU" : a.assetClass === "silver" ? "XAG" : a.priceUsd === 1.0 ? "USD" : Object.keys(fxMap).find(k => fxMap[k] === a.priceUsd) || "USD";
    const val = a.quantity * a.priceUsd * (1 - a.haircut) * a.counterpartyScore;
    ccyConc[ccy] = (ccyConc[ccy] || 0) + val;
  }
  for (const c in ccyConc) ccyConc[c] = (ccyConc[c] / rA) * 100;
  const usdConc = ccyConc["USD"] || 0;

  // ---- Pillar breakdown ----
  const bullionVal = (goldVal + silverVal) / rM * 100;
  const digitalVal = DIGITAL_ASSETS.reduce((s, d) => s + d.targetUsd, 0) / rM * 100;
  const fiatVal = 100 - bullionVal - digitalVal;

  // ---- FX rates for display (foreign per 1 USD) ----
  const fxRatesForeignPerUsd: Record<string, number> = {};
  for (const c of oracle.currencies) {
    fxRatesForeignPerUsd[c.code] = c.fx > 0 ? 1 / c.fx : 0;
  }

  return {
    navM: monetary.nav.market,
    navL: monetary.nav.prudential,
    navStress: monetary.nav.stress,
    reserveRatio: monetary.reserveRatio.ratio,
    goldUsd: goldPrice,
    silverUsd: silverPrice,
    fxRates: fxRatesForeignPerUsd,
    supply: BASELINE_SUPPLY,
    mintingPaused: monetary.mintingPaused,
    basketVerified: monetary.basketVerification.passed,
    reserveMarketUsd: rM,
    reserveAdjustedUsd: rA,
    sources: liveData.sources,
    reserveAssets,
    state: monetary,
    // v23 advisory metrics
    gei,
    bri,
    lci,
    gacr,
    usdConcentration: usdConc,
    currencyConcentration: ccyConc,
    pillarBreakdown: { bullion: bullionVal, fiat: fiatVal, digital: digitalVal },
  };
}

/**
 * The 10 supported deposit/redeem currencies.
 *   - 8 basket currencies per §12 (USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD)
 *   - XAU (gold ounces, per §25.1 bullion layer)
 *   - XAG (silver ounces, per §25.2 bullion layer)
 */
export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "CHF", "JPY", "GBP", "SGD", "AED", "SAR", "CNY", "CAD", "AUD",
  "XAU", "XAG",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(c: string): c is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(c);
}
