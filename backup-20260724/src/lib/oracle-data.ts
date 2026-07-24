// Simulated oracle data for the Mithqal Monetary Engine.
//
// In production, this data comes from multiple oracle families (Chainlink,
// Pyth, Chronicle, RedStone, LBMA, CB FX) with medianization + outlier
// exclusion. Here we simulate deterministic, reproducible values so the
// engine is fully exercisable and auditable.
//
// All values are realistic as of the specification period and drift
// deterministically over "time" (operation index) so the engine's
// momentum, mean-reversion, shock-absorber and SDP mechanics are all live.

export interface CurrencyData {
  code: string;
  name: string;
  /** USD per unit of this currency (FX rate) */
  fx: number;
  /** IMF COFER share (2-quarter trailing avg) */
  cofer: number;
  /** SWIFT trade settlement share (3-month aggregate) */
  swift: number;
  /** BIS liquidity metric */
  bis: number;
  /** Long-term average combined share (20 quarters / 5 years) */
  lta: number;
}

export interface OracleSnapshot {
  /** USD gold price per ounce */
  goldUsd: number;
  /** Gold price 12 months ago (USD/oz) */
  goldUsd12moAgo: number;
  /** Gold price 7 days ago (USD/oz) */
  goldUsd7dAgo: number;
  /** Gold price yesterday (USD/oz) */
  goldUsdYesterday: number;
  currencies: CurrencyData[];
  /** historical FX (12 months ago) for momentum */
  fxAgo: Record<string, number>;
  /** FX 7 days ago for SDP */
  fx7dAgo: Record<string, number>;
  /** FX yesterday for SDP */
  fxAgo1d: Record<string, number>;
}

// The 8 eligible basket currencies per the v19.0 worked example (Part III).
export const BASE_CURRENCIES: CurrencyData[] = [
  { code: "USD", name: "US Dollar",      fx: 1.00,    cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110 },
  { code: "EUR", name: "Euro",            fx: 1.10,    cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100 },
  { code: "JPY", name: "Japanese Yen",    fx: 0.0067,  cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080 },
  { code: "GBP", name: "Pound Sterling",  fx: 1.27,    cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100 },
  { code: "CNY", name: "Chinese Yuan",    fx: 0.139,   cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830 },
  { code: "CHF", name: "Swiss Franc",     fx: 1.12,    cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230 },
  { code: "AUD", name: "Australian Dollar", fx: 0.66,  cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0145 },
  { code: "CAD", name: "Canadian Dollar", fx: 0.73,    cofer: 0.005, swift: 0.030, bis: 0.020, lta: 0.0125 },
];

const BASE_GOLD = 1850; // USD/oz
const GOLD_12MO_AGO = 1750;
const GOLD_7D_AGO = 1820;
const GOLD_YESTERDAY = 1845;

// Historical FX (12 months ago) — for momentum calculation.
const FX_12MO_AGO: Record<string, number> = {
  USD: 1.00, EUR: 1.05, JPY: 0.0072, GBP: 1.22, CNY: 0.145,
  CHF: 1.08, AUD: 0.68, CAD: 0.75,
};
// FX 7 days ago — for SDP 7-day trigger.
const FX_7D_AGO: Record<string, number> = {
  USD: 1.00, EUR: 1.095, JPY: 0.0068, GBP: 1.265, CNY: 0.140,
  CHF: 1.115, AUD: 0.655, CAD: 0.725,
};
// FX yesterday — for SDP 24h trigger. Kept close to today so SDP doesn't
// fire on every snapshot; the protocol is still fully exercisable when a
// large shock is injected.
const FX_YESTERDAY: Record<string, number> = {
  USD: 1.00, EUR: 1.099, JPY: 0.00668, GBP: 1.269, CNY: 0.1392,
  CHF: 1.118, AUD: 0.658, CAD: 0.728,
};

/**
 * Deterministic price drift per operation. Bounded ±0.4%, mean-reverting
 * toward the base, reproducible from the operation index alone (so the
 * ledger remains the source of truth — auditability principle).
 */
function drift(base: number, opIndex: number, seed: number): number {
  let s = (opIndex * 2654435761 + seed * 40503) >>> 0;
  const u = ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  const magnitude = (u - 0.5) * 0.008; // ±0.4%
  const meanReversion = -0.25;
  return base + magnitude * base + meanReversion * (base - base); // base anchor
}

/**
 * Produce an oracle snapshot at a given operation index. Deterministic.
 */
export function getOracleSnapshot(opIndex: number): OracleSnapshot {
  const goldUsd = drift(BASE_GOLD, opIndex, 1);
  const goldUsd12moAgo = GOLD_12MO_AGO;
  const goldUsd7dAgo = drift(GOLD_7D_AGO, opIndex, 2);
  const goldUsdYesterday = drift(GOLD_YESTERDAY, opIndex, 3);

  const currencies = BASE_CURRENCIES.map((c, i) => ({
    ...c,
    fx: drift(c.fx, opIndex, 10 + i),
  }));

  return {
    goldUsd,
    goldUsd12moAgo,
    goldUsd7dAgo,
    goldUsdYesterday,
    currencies,
    fxAgo: FX_12MO_AGO,
    fx7dAgo: FX_7D_AGO,
    fxAgo1d: FX_YESTERDAY,
  };
}

/**
 * Oracle price aggregation per §8 (v2.0 CORRECTED).
 * Simulates 6 oracle families (Chainlink, Pyth, Chronicle, RedStone, LBMA, CB FX)
 * with small deterministic variance around the true price. Uses MAD-based
 * outlier rejection (k=3.0) — statistically more robust than the fixed 2%
 * threshold in v1.0. Delegates to consensusPrice() in monetary-engine.ts.
 */
export function aggregateOraclePrice(
  truePrice: number,
  opIndex: number,
  previousPrice?: number
): { price: number; method: string; validCount: number; quarantined: number } {
  // We import lazily to avoid a circular import at module load.
  // (oracle-data is imported by monetary-engine; monetary-engine is
  // imported here only at call-time.)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { consensusPrice } = require("./monetary-engine") as typeof import("./monetary-engine");
  // Simulate 6 family reports with small deterministic variance.
  const families = 6;
  const reports: number[] = [];
  for (let i = 0; i < families; i++) {
    let s = (opIndex * 2654435761 + (i + 100) * 40503) >>> 0;
    const u = ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
    const variance = (u - 0.5) * 0.006; // ±0.3%
    reports.push(truePrice * (1 + variance));
  }
  return consensusPrice(reports, previousPrice);
}
