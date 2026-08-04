// Shared Dynamic NAV Computer — used by /api/mint and /api/redeem.
//
// Constitutional context (v19.0.2):
//   - §3.1: NAV_m = R_m / S  (Market NAV = Market Reserve Value / Supply)
//   - §36.2: Minted MTQ = Deposit Value (USD) / Current NAV_m
//   - §36.3: Redemption Value = Burned MTQ × Current NAV_m
//
// Previously, the mint and redeem routes pinned NAV at $1.00 ("testnet NAV
// is pinned at 1.0 (1 MTQ = 1 USD)"). This violates the v19.0.2 dynamic
// NAV requirement and the §36.2/§36.3 conversion formulas. This helper
// replaces that pin with the LIVE market NAV computed by the v19.0 engine
// against the canonical v19.0.2 over-collateralized baseline reserve
// composition established in Task 3-a:
//
//   - Cash:        $29,250,000  (over-collateralization to clear 102% RR)
//   - Sovereign:   $13,500,000  (US T-bills ≤1yr)
//   - Gold:        2,122.86 oz  (FIXED physical quantity, revalued at live P)
//   - Silver:      36,758 oz    (FIXED physical quantity, revalued at live P)
//   - Stablecoins: $2,700,000   (regulated USDC/USDT/DAI)
//   - Supply:      54,000,000 MTQ
//
// Gold and silver are revalued at the LIVE market price on every call, so
// the NAV moves with bullion prices (the v19.0.2 "dynamic NAV" guarantee).
// Quantities are intentionally NOT derived from price — that was the Task 2-a
// bug (computing Q from a target value / live price makes the dollar value
// drift independently of the actual metal held).
//
// FX convention: fxRates[c] is reported as "foreign currency units per 1 USD"
// (e.g. EUR=0.87 means 1 USD = 0.87 EUR; JPY=150 means 1 USD = 150 JPY).
// This is the convention required by §36.2 / §36.3 conversion formulas:
//   - depositUsd  = amount / fxRates[c]   (foreign → USD)
//   - claimAmount = claimUsd × fxRates[c] (USD → foreign)

import {
  computeMonetaryStateV19,
  HAIRCUTS,
  type ReserveAsset,
  type MonetaryStateV19,
} from "./monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "./live-oracle";
import { getOracleSnapshot } from "./oracle-client";

// ---- v19.0.2 baseline reserve composition (Task 3-a) ----
// Fixed physical quantities for gold/silver (NOT derived from price).
// Cash/sov/stab are USD-denominated (priceUsd = 1, quantity = USD value).
const CASH_USD = 30_850_000; // v19.0.8: raised to 5% buffer (federal CCAR compliance)
const SOVEREIGN_USD = 13_500_000;
const GOLD_OZ = 2_122.86; // fixed physical ounces
const SILVER_OZ = 36_758; // fixed physical ounces
const STABLECOIN_USD = 2_700_000;

// Baseline MTQ supply (Task 3-a baseline: 54M MTQ).
const BASELINE_SUPPLY = 54_000_000;

// Conservative fallback silver price (only used if both the on-chain oracle
// AND the live API fail to return a usable value).
const FALLBACK_SILVER_USD = 58.76;

export interface NavResult {
  /** §3.1 Market NAV (R_m / S) — used for §36.2 mint and §36.3 redeem */
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
  /** Live FX rates: foreign currency units per 1 USD for all 8 basket currencies */
  fxRates: Record<string, number>;
  /** MTQ supply used in NAV computation */
  supply: number;
  /** §22A+§4 Minting-pause flag (true if RR<100% OR basket verification failed) */
  mintingPaused: boolean;
  /** §22A Basket verification result */
  basketVerified: boolean;
  /** Total market reserve value (R_m) in USD */
  reserveMarketUsd: number;
  /** Total adjusted reserve value (R_a) in USD */
  reserveAdjustedUsd: number;
  /** Sources used by the live oracle (for transparency/debug) */
  sources: string[];
  /**
   * The v19.0.2 baseline reserveAssets array (cash $29.25M / sov $13.5M /
   * gold 2,122.86oz / silver 36,758oz / stablecoin $2.7M) revalued at the
   * live gold + silver spot price. Exposed so that `/api/contract/info`
   * and `/api/nav` can publish the exact same composition that produced
   * the NAV (Task 5-a unification — single source of truth).
   */
  reserveAssets: ReserveAsset[];
  /**
   * The full v19.0 MonetaryStateV19 object computed against the baseline
   * composition + live oracle. Exposed so that `/api/contract/info` can
   * surface reserves / lcr / cri / weights / basketVerification /
   * portfolioDuration / shockAbsorber without having to recompute them
   * against a divergent supply (Task 5-a — every "1 MTQ = $X" surface
   * reads from the SAME monetary state).
   */
  state: MonetaryStateV19;
}

/**
 * Compute the live dynamic NAV (§3.1) and full monetary state against the
 * v19.0.2 over-collateralized baseline reserve composition.
 *
 * Revaluates gold and silver at the LIVE market price on every call so the
 * returned NAV moves with bullion prices — the v19.0.2 dynamic NAV guarantee.
 * Uses the same `computeMonetaryStateV19` engine as /api/transparency so the
 * mint/redeem NAV is identical to what the public transparency dashboard
 * reports (under the baseline composition).
 */
export async function computeLiveNav(): Promise<NavResult> {
  // Fetch live oracle data (gold spot, FX spot, 30d gold series) AND the
  // on-chain MockOracle snapshot (silver spot) in parallel.
  const [liveData, oracleSnapshotData] = await Promise.all([
    getLiveOracleData(),
    getOracleSnapshot(),
  ]);

  const oracle = toOracleSnapshot(liveData);
  const goldPrice = liveData.goldUsd;
  const silverPrice =
    oracleSnapshotData.silverUsd > 0
      ? oracleSnapshotData.silverUsd
      : FALLBACK_SILVER_USD;

  // Build the v19.0.2 baseline reserve composition with FIXED physical
  // gold/silver quantities (NOT derived from price).
  const reserveAssets: ReserveAsset[] = [
    // Fiat Layer (§24): cash + sovereign ≤1yr
    {
      id: "cash-1",
      name: "Central-bank cash",
      assetClass: "cash",
      quantity: CASH_USD,
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
      quantity: SOVEREIGN_USD,
      priceUsd: 1,
      haircut: HAIRCUTS.sovereign,
      counterpartyScore: 0.99,
      stressCoefficient: 0.90,
      modifiedDuration: 0.5,
    },
    // Bullion Layer (§25): gold + silver (fixed physical quantities)
    {
      id: "gold-1",
      name: "Allocated gold",
      assetClass: "gold",
      quantity: GOLD_OZ,
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
      quantity: SILVER_OZ,
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
      quantity: STABLECOIN_USD,
      priceUsd: 1,
      haircut: HAIRCUTS.stablecoin,
      counterpartyScore: 0.96,
      stressCoefficient: 0.80,
      modifiedDuration: 0,
    },
  ];

  // Build the EWMA return series from the live 30-day gold price series (§17).
  // This powers the shock absorber; falls back to a conservative constant
  // (0.015) if no historical snapshots exist yet.
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

  const totalReserve =
    CASH_USD + SOVEREIGN_USD + STABLECOIN_USD +
    GOLD_OZ * goldPrice + SILVER_OZ * silverPrice;

  const monetary = computeMonetaryStateV19(
    oracle,
    reserveAssets,
    BASELINE_SUPPLY,
    // LCR inputs — same simulated values as /api/transparency:
    //   HQLA ≈ 60% of total reserve; expected redemptions ≈ 10% of supply.
    {
      hqla: totalReserve * 0.60,
      expectedRedemptions: BASELINE_SUPPLY * 0.10,
      committedInflows: 0,
      operationalAdjustments: 0,
    },
    // CRI inputs — same simulated values as /api/transparency.
    { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 },
    0.015, // fallback volatility (used only if ewmaReturns is empty)
    ewmaReturns,
  );

  // FX convention conversion:
  //   live-oracle returns fxRates[c] as "USD per 1 unit of foreign currency"
  //   (e.g. EUR=1.149 means 1 EUR = 1.149 USD). For §36.2/§36.3 we need the
  //   inverse convention: "foreign currency units per 1 USD" (EUR=0.87 means
  //   1 USD = 0.87 EUR). Invert here so mint/redeem formulas read naturally.
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
    reserveMarketUsd: monetary.reserves.market,
    reserveAdjustedUsd: monetary.reserves.adjusted,
    sources: liveData.sources,
    reserveAssets,
    state: monetary,
  };
}

/**
 * The 10 supported deposit/redeem currencies.
 *   - 8 basket currencies per §12 (USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD)
 *   - XAU (gold ounces, per §25.1 bullion layer)
 *   - XAG (silver ounces, per §25.2 bullion layer)
 */
export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD",
  "XAU", "XAG",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(c: string): c is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(c);
}
