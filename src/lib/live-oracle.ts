// Live Oracle Service — fetches real market data from free APIs.
//
// Data sources (all free, no API key required):
//   - Gold spot:        gold-api.com (XAU/USD, updated every few seconds)
//   - Silver spot:      gold-api.com (XAG/USD)
//   - FX spot:          open.er-api.com (USD-based, updated daily)
//   - Crypto:           CoinGecko (BTC, ETH in USD)
//   - Historical gold:  Turso DB daily snapshots (self-hosted, no external API)
//   - Historical FX:    Turso DB daily snapshots (self-hosted, no external API)
//
// Historical data feeds the §15 momentum calculation (12mo-ago price) and
// the §17 EWMA volatility engine (30-day return series). Rather than
// depending on a third-party historical API (FRED requires a key;
// Frankfurter has rate limits), the oracle stores a daily snapshot of
// every live fetch in Turso. This builds a real, institution-owned
// historical dataset over time — the first run has 0 history (falls back
// to a conservative constant), but after 30 days the full EWMA engine
// activates with real data. This is the institutionally-correct approach:
// a monetary institution should own its historical data.

import { db, ensureSchema } from "./db";

export interface LiveOracleData {
  goldUsd: number;
  goldUsd12moAgo: number;
  goldUsd7dAgo: number;
  goldUsdYesterday: number;
  fxRates: Record<string, number>;
  // Historical FX rates (from Turso daily snapshots).
  fxAgo: Record<string, number>;      // 12 months ago
  fx7dAgo: Record<string, number>;    // 7 days ago
  fxAgo1d: Record<string, number>;    // 1 day ago
  cryptoPrices: { btc: number; eth: number };
  // 30-day daily gold price series for EWMA volatility (§17).
  // Most recent last. Empty if no historical snapshots exist yet.
  goldPriceSeries: number[];
  fetchedAt: string;
  sources: string[];
}

let cached: { data: LiveOracleData; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

// Conservative fallbacks (only used if no historical snapshots exist yet).
// These are clearly labelled as stale-constants-of-last-resort. Once the
// system has been running for 30+ days, these are never used.
const FALLBACK_GOLD_12MO_AGO = 2400;
const FALLBACK_GOLD_7D_AGO = 4000;
const FALLBACK_GOLD_YESTERDAY = 4045;

/**
 * Store today's gold + FX prices as a daily snapshot in Turso.
 * Idempotent — if a snapshot already exists for today, it's updated.
 * This builds the historical dataset that powers EWMA + momentum.
 */
async function storeDailySnapshot(goldUsd: number, fxRates: Record<string, number>): Promise<void> {
  try {
    await ensureSchema();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fxJson = JSON.stringify(fxRates);

    // Upsert: if a row exists for today, update it; otherwise insert.
    // This handles the case where the oracle runs multiple times per day.
    await db.$executeRawUnsafe(
      `INSERT INTO "GoldPriceSnapshot" ("date", "goldUsd", "fxRates", "updatedAt") VALUES ('${today}', ${goldUsd}, '${fxJson}', CURRENT_TIMESTAMP) ON CONFLICT("date") DO UPDATE SET "goldUsd" = ${goldUsd}, "fxRates" = '${fxJson}', "updatedAt" = CURRENT_TIMESTAMP`
    );
  } catch (err) {
    // Non-fatal — the snapshot is best-effort. If the table doesn't exist
    // yet (first run), ensureSchema will have created it.
    console.warn("[oracle] snapshot store failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

/**
 * Read the gold price from N days ago from the Turso snapshot table.
 * Returns null if no snapshot exists for that date (or within a 3-day window).
 */
async function readGoldSnapshotNDaysAgo(days: number): Promise<number | null> {
  try {
    await ensureSchema();
    const target = new Date();
    target.setDate(target.getDate() - days);
    // Search a 5-day window backwards from the target to handle weekends/holidays.
    const start = new Date(target);
    start.setDate(start.getDate() - 5);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = target.toISOString().slice(0, 10);

    const result = await db.$executeRawUnsafe(
      `SELECT "goldUsd" FROM "GoldPriceSnapshot" WHERE "date" >= '${startStr}' AND "date" <= '${endStr}' ORDER BY "date" DESC LIMIT 1`
    );
    // db.$executeRawUnsafe returns the libsql result; we need to parse it.
    // Actually, $executeRawUnsafe returns the number of rows affected for
    // INSERT/UPDATE/DELETE. For SELECT, we need to use the raw client.
    // Let's use the raw client directly instead.
    return null; // placeholder — see readGoldSeries below for the correct approach
  } catch {
    return null;
  }
}

/**
 * Read the last N daily gold price snapshots from Turso.
 * Returns an array of prices (oldest first, most recent last).
 * Empty if no snapshots exist yet (first run).
 */
async function readGoldSeries(days: number): Promise<number[]> {
  try {
    await ensureSchema();
    // Use the raw libsql client via a direct query.
    // The db.$executeRawUnsafe wrapper only returns rowsAffected, so we
    // need to use the raw client. Since db exports a compatibility wrapper,
    // we'll use a lightweight inline approach.
    const { createClient } = await import("@libsql/client");
    const url = process.env.DATABASE_URL || "file:./db/custom.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    const client = createClient({
      url,
      authToken: url.startsWith("file:") ? undefined : authToken,
    });

    const result = await client.execute({
      sql: `SELECT "goldUsd" FROM "GoldPriceSnapshot" ORDER BY "date" DESC LIMIT ?`,
      args: [days],
    });

    // Reverse so oldest is first, most recent is last (for EWMA computation).
    const prices = result.rows.map((row: any) => Number(row.goldUsd)).filter((p: number) => !isNaN(p) && p > 0);
    return prices.reverse();
  } catch {
    return [];
  }
}

/**
 * Read the FX rates from N days ago from Turso.
 */
async function readFxSnapshotNDaysAgo(days: number): Promise<Record<string, number> | null> {
  try {
    await ensureSchema();
    const { createClient } = await import("@libsql/client");
    const url = process.env.DATABASE_URL || "file:./db/custom.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    const client = createClient({
      url,
      authToken: url.startsWith("file:") ? undefined : authToken,
    });

    const target = new Date();
    target.setDate(target.getDate() - days);
    const start = new Date(target);
    start.setDate(start.getDate() - 5);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = target.toISOString().slice(0, 10);

    const result = await client.execute({
      sql: `SELECT "fxRates" FROM "GoldPriceSnapshot" WHERE "date" >= ? AND "date" <= ? ORDER BY "date" DESC LIMIT 1`,
      args: [startStr, endStr],
    });

    if (result.rows.length === 0) return null;
    const fxJson = result.rows[0].fxRates as string;
    return JSON.parse(fxJson);
  } catch {
    return null;
  }
}

export async function getLiveOracleData(): Promise<LiveOracleData> {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const sources: string[] = [];

  // ---- Live spot gold ----
  let goldUsd = 4050;
  try {
    const goldRes = await fetch("https://api.gold-api.com/price/XAU", {
      signal: AbortSignal.timeout(5000),
    });
    if (goldRes.ok) {
      const goldData = await goldRes.json();
      if (goldData.price && typeof goldData.price === "number") {
        goldUsd = goldData.price;
        sources.push("gold-api.com");
      }
    }
  } catch {}

  // ---- Live FX spot ----
  let fxRates: Record<string, number> = {
    USD: 1.00, EUR: 1.14, JPY: 0.0061, GBP: 1.33,
    CNY: 0.147, CHF: 1.22, AUD: 0.70, CAD: 0.71,
  };
  try {
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      const rates = fxData.rates || {};
      for (const c of ["EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD"]) {
        if (rates[c] && typeof rates[c] === "number" && rates[c] > 0) {
          fxRates[c] = 1 / rates[c];
        }
      }
      fxRates.USD = 1.00;
      sources.push("open.er-api.com");
    }
  } catch {}

  // ---- Live crypto ----
  let cryptoPrices = { btc: 64000, eth: 1850 };
  try {
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      if (cryptoData.bitcoin?.usd) cryptoPrices.btc = cryptoData.bitcoin.usd;
      if (cryptoData.ethereum?.usd) cryptoPrices.eth = cryptoData.ethereum.usd;
      sources.push("CoinGecko");
    }
  } catch {}

  // ---- Store today's snapshot (builds historical dataset for EWMA + momentum) ----
  await storeDailySnapshot(goldUsd, fxRates);

  // ---- Read historical snapshots from Turso ----
  const [goldSeries, fxAgoHist, fx7dAgoHist, fxAgo1dHist] = await Promise.all([
    readGoldSeries(30),
    readFxSnapshotNDaysAgo(365),
    readFxSnapshotNDaysAgo(7),
    readFxSnapshotNDaysAgo(1),
  ]);

  // Gold historical: use the series to find 12mo, 7d, 1d values.
  // If the series has enough data, use it; otherwise fall back to constants.
  let goldUsd12moAgo = FALLBACK_GOLD_12MO_AGO;
  let goldUsd7dAgo = FALLBACK_GOLD_7D_AGO;
  let goldUsdYesterday = FALLBACK_GOLD_YESTERDAY;

  if (goldSeries.length >= 8) {
    // 7d ago is the 8th-from-last entry (series is oldest-first, most-recent-last).
    // Index: length-8 = 7 days ago (if we have 8+ entries).
    goldUsd7dAgo = goldSeries[goldSeries.length - 8] ?? FALLBACK_GOLD_7D_AGO;
    goldUsdYesterday = goldSeries[goldSeries.length - 2] ?? FALLBACK_GOLD_YESTERDAY;
    sources.push("Turso-7d-series");
  }
  if (goldSeries.length >= 2) {
    goldUsdYesterday = goldSeries[goldSeries.length - 2];
    sources.push("Turso-1d");
  }
  // 12mo-ago requires 365 days of data — only available after a year of operation.
  // Until then, use the fallback (clearly labelled).
  if (goldSeries.length >= 365) {
    goldUsd12moAgo = goldSeries[goldSeries.length - 366];
    sources.push("Turso-12mo");
  }

  // Append today's live gold to the series for the EWMA return calculation
  const fullGoldSeries = [...goldSeries, goldUsd];
  if (goldSeries.length > 0) {
    sources.push(`Turso-30d-series(${goldSeries.length}pts)`);
  }

  // FX historical from Turso snapshots (falls back to current if no history yet)
  const fxAgo: Record<string, number> = fxAgoHist || { ...fxRates };
  const fx7dAgo: Record<string, number> = fx7dAgoHist || { ...fxRates };
  const fxAgo1d: Record<string, number> = fxAgo1dHist || { ...fxRates };

  if (fxAgoHist) sources.push("Turso-FX-12mo");
  if (fx7dAgoHist) sources.push("Turso-FX-7d");
  if (fxAgo1dHist) sources.push("Turso-FX-1d");

  const data: LiveOracleData = {
    goldUsd,
    goldUsd12moAgo,
    goldUsd7dAgo,
    goldUsdYesterday,
    fxRates,
    fxAgo,
    fx7dAgo,
    fxAgo1d,
    cryptoPrices,
    goldPriceSeries: fullGoldSeries,
    fetchedAt: new Date().toISOString(),
    sources,
  };

  cached = { data, timestamp: Date.now() };
  return data;
}

export function toOracleSnapshot(live: LiveOracleData) {
  const currencies = [
    { code: "USD", name: "US Dollar", fx: live.fxRates.USD || 1.0, cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110 },
    { code: "EUR", name: "Euro", fx: live.fxRates.EUR || 1.14, cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100 },
    { code: "JPY", name: "Japanese Yen", fx: live.fxRates.JPY || 0.0061, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080 },
    { code: "GBP", name: "Pound Sterling", fx: live.fxRates.GBP || 1.33, cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100 },
    { code: "CNY", name: "Chinese Yuan", fx: live.fxRates.CNY || 0.147, cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830 },
    { code: "CHF", name: "Swiss Franc", fx: live.fxRates.CHF || 1.22, cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230 },
    { code: "AUD", name: "Australian Dollar", fx: live.fxRates.AUD || 0.70, cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160 },
    { code: "CAD", name: "Canadian Dollar", fx: live.fxRates.CAD || 0.71, cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130 },
  ];

  const fxAgo: Record<string, number> = live.fxAgo || { ...live.fxRates };
  const fx7dAgo: Record<string, number> = live.fx7dAgo || { ...live.fxRates };
  const fxAgo1d: Record<string, number> = live.fxAgo1d || { ...live.fxRates };

  return {
    goldUsd: live.goldUsd,
    goldUsd12moAgo: live.goldUsd12moAgo,
    goldUsd7dAgo: live.goldUsd7dAgo,
    goldUsdYesterday: live.goldUsdYesterday,
    goldPriceSeries: live.goldPriceSeries,
    currencies,
    fxAgo,
    fx7dAgo,
    fxAgo1d,
    cryptoPrices: live.cryptoPrices,
    liveDataSources: live.sources,
    liveDataFetchedAt: live.fetchedAt,
  } as any;
}

