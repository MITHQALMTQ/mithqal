// purchasing-power.ts
//
// MTQ purchasing power computation per Constitution v19.0 §22.
//
// KEY INSIGHT (per user directive 2026-09-29):
//   "MTQ is purchasing power, not fixed to any currency."
//
// MTQ is gold-anchored (Constitution v19.0 §22). Its USD value (navM) moves
// with the gold price. But its PURCHASING POWER in any given currency
// depends on BOTH:
//   - Gold's USD price (drives navM via the gold sleeve of the reserve)
//   - The USD→target_currency FX rate (drives conversion)
//
// If USD strengthens against EUR, gold-USD might drop, but EUR also drops
// relative to USD — so MTQ EUR purchasing power might be relatively stable.
// This is the "purchasing power" view vs the "USD-denominated value" view.
//
// ─────────────────────────────────────────────────────────────────────────
// DESIGN
// ─────────────────────────────────────────────────────────────────────────
//   1. navM, navL, goldUsd, silverUsd, fxRates — sourced from the existing
//      computeLiveNav() in ./nav-compute.ts. This reuses the existing
//      v19.0.2 monetary engine + multi-oracle consensus + 11-currency
//      basket. The contract: NEVER duplicate navM computation here.
//   2. Gold/silver 24h change — sourced from getLiveOracleData() in
//      ./live-oracle.ts which maintains a Turso snapshot of yesterday's
//      prices (with a conservative fallback constant during the first
//      30 days of operation before the snapshot dataset is populated).
//   3. FX 24h change per currency — sourced from FRED's DEX series
//      (DEXUSEU, DEXJPUS, DEXUSUK, DEXCHUS, DEXSZUS, DEXUSAL, DEXCAUS).
//      Each series is fetched with limit=2&sort_order=desc to obtain the
//      two most recent observations ("today" + "yesterday" — FRED updates
//      on U.S. business days, so on weekends the latest obs is Friday).
//      If FRED_API_KEY is unset or any fetch fails, the corresponding
//      currency's change24h falls back to 0 (clearly flagged in fxSource).
//   4. Purchasing power per currency:
//        purchasingPower[currency] = navM × (foreign_per_usd_rate)
//      where foreign_per_usd_rate is the FRED-derived rate (or, as a
//      fallback, the open.er-api.com rate already inside nav.fxRates).
//   5. Purchasing power 24h change per currency:
//        ppChange[currency] = ((navM_today × rate_today) - (navM_yesterday × rate_yesterday))
//                              / (navM_yesterday × rate_yesterday) × 100
//      where navM_yesterday is a gold-proxy: navM_today × (goldUsdYesterday / goldUsd).
//      This proxy is approximate (the full navM also has FX, sovereign, and
//      stablecoin sleeves), but it is honest — it isolates the gold-driven
//      component of the 24h change, which is the dominant driver of MTQ's
//      USD baseline movement per Constitution v19.0 §22 (gold-anchored).
//
// ─────────────────────────────────────────────────────────────────────────
// FRED SERIES CONVENTIONS (verified 2026-09-29 via FRED series metadata)
// ─────────────────────────────────────────────────────────────────────────
//   Series     | Title                                   | Units
//   -----------+-----------------------------------------+---------------------------------
//   DEXUSEU    | U.S. Dollars to Euro Spot Exchange Rate | U.S. Dollars to One Euro
//              | → units = USD per 1 EUR                | → foreign_per_usd = 1 / DEXUSEU
//   DEXJPUS    | Japanese Yen to U.S. Dollar Spot Rate   | Japanese Yen to One U.S. Dollar
//              | → units = JPY per 1 USD                 | → foreign_per_usd = DEXJPUS
//   DEXUSUK    | U.S. Dollars to U.K. Pound Sterling Rate| U.S. Dollars to One Pound Sterling
//              | → units = USD per 1 GBP                 | → foreign_per_usd = 1 / DEXUSUK
//   DEXCHUS    | Chinese Yuan to U.S. Dollar Spot Rate   | Chinese Yuan to One U.S. Dollar
//              | → units = CNY per 1 USD                 | → foreign_per_usd = DEXCHUS
//   DEXSZUS    | Swiss Francs to U.S. Dollar Spot Rate   | Swiss Francs to One U.S. Dollar
//              | → units = CHF per 1 USD                 | → foreign_per_usd = DEXSZUS
//   DEXUSAL    | U.S. Dollars to Australian Dollar Rate  | U.S. Dollars to One Australian Dollar
//              | → units = USD per 1 AUD                 | → foreign_per_usd = 1 / DEXUSAL
//   DEXCAUS    | Canadian Dollars to U.S. Dollar Spot Rate| Canadian Dollars to One U.S. Dollar
//              | → units = CAD per 1 USD                 | → foreign_per_usd = DEXCAUS
//
// The "direction" field on each FRED_SERIES entry below encodes the
// conversion: "direct" = DEX value IS already foreign-per-USD (use as-is);
// "inverse" = DEX value is USD-per-foreign (invert with 1/x).
// ─────────────────────────────────────────────────────────────────────────

import { computeLiveNav } from "./nav-compute";
import { getLiveOracleData } from "./live-oracle";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface CurrencyRate {
  /** 3-letter ISO 4217 code (USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD). */
  currency: string;
  /** Foreign-currency units per 1 USD (e.g. EUR=0.879 → 1 USD = 0.879 EUR). */
  rate: number;
  /** Percent change in this FX rate over the last 24h. */
  change24h: number;
}

export interface PurchasingPowerResult {
  /** MTQ M-NAV per MTQ in USD baseline (gold-anchored). */
  navM: number;
  /** Liquidation-adjusted NAV per MTQ in USD baseline. */
  navL: number;
  /** Live gold spot price (USD per troy ounce). */
  goldUsd: number;
  /** Live silver spot price (USD per troy ounce). */
  silverUsd: number;
  /** Gold's 24h change, percent. */
  goldUsd24hChange: number;
  /** Silver's 24h change, percent. */
  silverUsd24hChange: number;
  /** MTQ priced in 8 currencies: purchasingPower[ccy] = navM × foreign_per_usd[ccy]. */
  purchasingPower: Record<string, number>;
  /** FX rate change per currency over the last 24h, percent. */
  changes24h: Record<string, number>;
  /** MTQ purchasing-power 24h change per currency, percent. */
  purchasingPowerChanges24h: Record<string, number>;
  /** Attribution string for the FRED data source. */
  fredSource: string;
  /** Attribution string for the FX-rate source(s). */
  fxSource: string;
  /** ISO-8601 timestamp when the result was produced. */
  timestamp: string;
  /** Human-readable explanation of the model. */
  explanation: string;
}

// ─────────────────────────────────────────────────────────────────────────
// FRED series config
// ─────────────────────────────────────────────────────────────────────────

interface FredSeriesConfig {
  /** Currency code that this series covers. */
  ccy: string;
  /** FRED series ID. */
  seriesId: string;
  /** "direct" if DEX value is foreign-per-USD; "inverse" if DEX value is USD-per-foreign. */
  direction: "direct" | "inverse";
}

/** The 8 currencies we surface in the purchasing-power view (per task spec). */
const PURCHASING_POWER_CURRENCIES = [
  "USD", "EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD",
] as const;

/** FRED series mapping per currency (USD has no FRED series — it is the unit). */
const FRED_SERIES: FredSeriesConfig[] = [
  { ccy: "EUR", seriesId: "DEXUSEU", direction: "inverse" }, // USD per EUR → invert
  { ccy: "JPY", seriesId: "DEXJPUS", direction: "direct" }, // JPY per USD → use as-is
  { ccy: "GBP", seriesId: "DEXUSUK", direction: "inverse" }, // USD per GBP → invert
  { ccy: "CNY", seriesId: "DEXCHUS", direction: "direct" }, // CNY per USD → use as-is
  { ccy: "CHF", seriesId: "DEXSZUS", direction: "direct" }, // CHF per USD → use as-is
  { ccy: "AUD", seriesId: "DEXUSAL", direction: "inverse" }, // USD per AUD → invert
  { ccy: "CAD", seriesId: "DEXCAUS", direction: "direct" }, // CAD per USD → use as-is
];

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";
const FRED_FETCH_TIMEOUT_MS = 5_000; // per the task spec — FRED can be slow
const FRED_SOURCE_LABEL = "Federal Reserve Economic Data (FRED)";

// ─────────────────────────────────────────────────────────────────────────
// FRED fetcher
// ─────────────────────────────────────────────────────────────────────────

interface FredObservation {
  date: string;
  value: string; // FRED returns values as strings; "." means no data
}

interface FredSeriesResult {
  /** Foreign-per-USD rate (latest observation). */
  rateToday: number | null;
  /** Foreign-per-USD rate (second-latest observation = "yesterday"). */
  rateYesterday: number | null;
  /** Percent change rateToday vs rateYesterday. */
  changePct: number | null;
  /** Latest observation date (ISO YYYY-MM-DD). */
  latestDate: string | null;
  /** True if the fetch succeeded with at least one valid observation. */
  ok: boolean;
  /** Error description if the fetch failed. */
  error?: string;
}

async function fetchFredSeries(cfg: FredSeriesConfig, apiKey: string): Promise<FredSeriesResult> {
  const url =
    `${FRED_BASE_URL}?series_id=${cfg.seriesId}` +
    `&api_key=${encodeURIComponent(apiKey)}` +
    `&file_type=json&limit=2&sort_order=desc`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FRED_FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { rateToday: null, rateYesterday: null, changePct: null, latestDate: null, ok: false, error: `FRED ${cfg.seriesId} HTTP ${res.status}` };
    }
    const data = (await res.json()) as { observations?: FredObservation[] };
    const obs = data.observations;
    if (!obs || !Array.isArray(obs) || obs.length === 0) {
      return { rateToday: null, rateYesterday: null, changePct: null, latestDate: null, ok: false, error: `FRED ${cfg.seriesId} returned no observations` };
    }

    // Extract the two most recent valid (non-".") values.
    const valid = obs.filter(o => o && typeof o.value === "string" && o.value !== "." && o.value.length > 0);
    if (valid.length === 0) {
      return { rateToday: null, rateYesterday: null, changePct: null, latestDate: null, ok: false, error: `FRED ${cfg.seriesId} no recent data` };
    }

    // FRED returns values as strings; convert to float. For "inverse" series,
    // the DEX value is USD-per-foreign — convert to foreign-per-USD by 1/x.
    const toForeignPerUsd = (raw: string): number => {
      const v = parseFloat(raw);
      if (!Number.isFinite(v) || v <= 0) return 0;
      return cfg.direction === "inverse" ? 1 / v : v;
    };

    const rateToday = toForeignPerUsd(valid[0].value);
    const rateYesterday =
      valid.length >= 2 ? toForeignPerUsd(valid[1].value) : rateToday;

    let changePct: number | null = null;
    if (rateYesterday > 0 && rateToday > 0) {
      changePct = ((rateToday - rateYesterday) / rateYesterday) * 100;
    }

    return {
      rateToday: rateToday > 0 ? rateToday : null,
      rateYesterday: rateYesterday > 0 ? rateYesterday : null,
      changePct,
      latestDate: valid[0]?.date ?? null,
      ok: rateToday > 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { rateToday: null, rateYesterday: null, changePct: null, latestDate: null, ok: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Gold/silver 24h change — uses the live oracle's Turso snapshot
// ─────────────────────────────────────────────────────────────────────────

interface Metal24hChange {
  goldUsd24hChange: number;
  silverUsd24hChange: number;
  goldYesterday: number;
  silverYesterday: number | null;
  source: string;
}

async function computeMetals24hChange(
  goldUsdToday: number,
  silverUsdToday: number,
): Promise<Metal24hChange> {
  // live-oracle.ts stores daily snapshots and exposes goldUsdYesterday +
  // goldUsd7dAgo + goldUsd12moAgo. Silver yesterday isn't directly exposed,
  // but we can derive it from the gold/silver ratio fallback (conservative).
  try {
    const live = await getLiveOracleData();
    const goldYesterday = live.goldUsdYesterday || live.goldUsd7dAgo || goldUsdToday;
    const goldChange =
      goldYesterday > 0
        ? ((goldUsdToday - goldYesterday) / goldYesterday) * 100
        : 0;

    // Silver yesterday: live-oracle doesn't expose this directly. Use the
    // gold/silver ratio as a fallback proxy (silver tracks gold closely).
    // If silverToday is 0, fall back to 0 change.
    let silverYesterday: number | null = null;
    let silverChange = 0;
    if (silverUsdToday > 0 && goldUsdToday > 0 && goldYesterday > 0) {
      // Conservative: assume the gold/silver ratio held constant → silver
      // moved by the same percentage as gold. Clearly labelled as a proxy.
      silverYesterday = (silverUsdToday * goldYesterday) / goldUsdToday;
      silverChange = ((silverUsdToday - silverYesterday) / silverYesterday) * 100;
    }

    return {
      goldUsd24hChange: Number.isFinite(goldChange) ? goldChange : 0,
      silverUsd24hChange: Number.isFinite(silverChange) ? silverChange : 0,
      goldYesterday,
      silverYesterday,
      source: "live-oracle (Turso 1d snapshot + gold/silver ratio proxy)",
    };
  } catch {
    // If the live oracle is unavailable, fall back to 0 change.
    return {
      goldUsd24hChange: 0,
      silverUsd24hChange: 0,
      goldYesterday: goldUsdToday,
      silverYesterday: silverUsdToday,
      source: "live-oracle unavailable — 24h change set to 0 (stale fallback)",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────

export async function computePurchasingPower(): Promise<PurchasingPowerResult> {
  // 1. Fetch navM, navL, goldUsd, silverUsd, fxRates (foreign per USD).
  const nav = await computeLiveNav();
  const navM = nav.navM;
  const navL = nav.navL;
  const goldUsd = nav.goldUsd;
  const silverUsd = nav.silverUsd;
  // nav.fxRates is already foreign-per-USD per nav-compute.ts line 330
  // (fxRatesForeignPerUsd). This is the open.er-api.com-sourced live rate.
  const erApiRates: Record<string, number> = nav.fxRates || {};

  // 2. Metals 24h change.
  const metals = await computeMetals24hChange(goldUsd, silverUsd);
  const goldUsd24hChange = metals.goldUsd24hChange;
  const silverUsd24hChange = metals.silverUsd24hChange;
  const goldYesterday = metals.goldYesterday;

  // 3. navM "yesterday" — gold-proxy approximation (clearly labelled).
  //    navM = (gold_qty × P_gold_today + other sleeves) / supply.
  //    If we hold everything else constant and only move gold:
  //      navM_yesterday_proxy ≈ navM_today × (gold_yesterday / gold_today)
  //    This isolates the gold-driven component of the 24h change.
  const navMYesterdayProxy =
    goldUsd > 0 ? navM * (goldYesterday / goldUsd) : navM;

  // 4. FRED 24h change for 7 currencies (USD has no FRED series — it's the unit).
  const fredKey = process.env.FRED_API_KEY || "";
  const fredAvailable = fredKey !== "";

  const fredResults: Record<string, FredSeriesResult> = {};
  if (fredAvailable) {
    // Fire all 7 FRED fetches in parallel (each has its own 5s timeout).
    const entries = await Promise.all(
      FRED_SERIES.map(async (cfg) => [cfg.ccy, await fetchFredSeries(cfg, fredKey)] as const),
    );
    for (const [ccy, result] of entries) {
      fredResults[ccy] = result;
    }
  } else {
    // Mark each as unavailable (no API key).
    for (const cfg of FRED_SERIES) {
      fredResults[cfg.ccy] = {
        rateToday: null,
        rateYesterday: null,
        changePct: null,
        latestDate: null,
        ok: false,
        error: "FRED_API_KEY not set",
      };
    }
  }

  // 5. Build purchasingPower, changes24h, purchasingPowerChanges24h.
  const purchasingPower: Record<string, number> = {};
  const changes24h: Record<string, number> = {};
  const purchasingPowerChanges24h: Record<string, number> = {};

  for (const ccy of PURCHASING_POWER_CURRENCIES) {
    if (ccy === "USD") {
      // USD is the baseline — no FX conversion. 1 MTQ = navM USD.
      purchasingPower.USD = navM;
      // USD FX change is 0 by definition (it's the unit).
      changes24h.USD = 0;
      // MTQ USD purchasing power 24h change = gold-driven navM change.
      const usdChange =
        navMYesterdayProxy > 0
          ? ((navM - navMYesterdayProxy) / navMYesterdayProxy) * 100
          : 0;
      purchasingPowerChanges24h.USD = Number.isFinite(usdChange) ? usdChange : 0;
      continue;
    }

    const fred = fredResults[ccy];
    // Prefer FRED's rate; fall back to the live open.er-api.com rate inside nav.fxRates.
    const rateToday = fred.rateToday ?? erApiRates[ccy] ?? 0;
    const rateYesterday =
      fred.rateYesterday ?? // FRED yesterday
      (erApiRates[ccy] && erApiRates[ccy] > 0 ? erApiRates[ccy] : rateToday); // fallback: assume rate didn't change

    // Purchasing power: navM × foreign-per-USD rate.
    purchasingPower[ccy] = navM * rateToday;

    // FX 24h change: percent change in foreign-per-USD rate.
    changes24h[ccy] = fred.changePct ?? (rateYesterday > 0
      ? ((rateToday - rateYesterday) / rateYesterday) * 100
      : 0);

    // Purchasing-power 24h change:
    //   ppToday = navM_today × rateToday
    //   ppYesterday = navM_yesterday_proxy × rateYesterday
    //   change = (ppToday - ppYesterday) / ppYesterday × 100
    const ppToday = navM * rateToday;
    const ppYesterday = navMYesterdayProxy * rateYesterday;
    const ppChange = ppYesterday > 0 ? ((ppToday - ppYesterday) / ppYesterday) * 100 : 0;
    purchasingPowerChanges24h[ccy] = Number.isFinite(ppChange) ? ppChange : 0;
  }

  // 6. Attribution.
  const fredSeriesUsed = FRED_SERIES.map(s => s.seriesId).join(", ");
  const fredSeriesOkCount = FRED_SERIES.filter(s => fredResults[s.ccy]?.ok).length;
  const fredSeriesTotal = FRED_SERIES.length;

  const fredSource = fredAvailable
    ? `${FRED_SOURCE_LABEL} — ${fredSeriesOkCount}/${fredSeriesTotal} series succeeded (${fredSeriesUsed})`
    : `${FRED_SOURCE_LABEL} — FRED_API_KEY not set; degraded to live FX rate only (no 24h change)`;

  const fxSourceParts: string[] = [];
  if (fredAvailable && fredSeriesOkCount > 0) {
    fxSourceParts.push(`FRED (${fredSeriesUsed})`);
  }
  fxSourceParts.push("open.er-api.com (live FX rates)");
  const fxSource = fxSourceParts.join(" + ");

  const timestamp = new Date().toISOString();

  const explanation =
    "MTQ is purchasing power, not USD-fixed. navM is the gold-anchored USD " +
    "baseline (Constitution v19.0 §22 — gold-anchored basket). " +
    "purchasingPower[currency] = navM × USD→currency FX rate, showing what " +
    "1 MTQ can BUY in each currency. changes24h[currency] = percent change " +
    "in the USD→currency FX rate over the last 24h (from FRED DEX series " +
    "where available). purchasingPowerChanges24h[currency] = percent " +
    "change in MTQ purchasing power for that currency, combining the " +
    "gold-driven navM change (proxied as navM × gold_yesterday/gold_today) " +
    "with the FX change. The 'direct' FRED series (JPY, CNY, CHF, CAD) " +
    "report foreign-per-USD directly; the 'inverse' series (EUR, GBP, AUD) " +
    "report USD-per-foreign and are inverted via 1/x to obtain foreign-per-USD.";

  return {
    navM,
    navL,
    goldUsd,
    silverUsd,
    goldUsd24hChange,
    silverUsd24hChange,
    purchasingPower,
    changes24h,
    purchasingPowerChanges24h,
    fredSource,
    fxSource,
    timestamp,
    explanation,
  };
}
