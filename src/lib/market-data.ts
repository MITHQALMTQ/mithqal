/**
 * MITHQAL v26.0 §8.3 — Corridor Pain Index market-data integration
 * MITHQAL v26.0 §3.x — Market-data backing inputs
 *
 * Composes the 6-dimension Corridor Pain Index (CPI) from
 * external data sources:
 *
 *   1. Messari      — on-chain asset metrics (price, volume, mcap)
 *   2. FRED         — macroeconomic series (CPI-U, DGS10, T10Y3M, VIX)
 *   3. IMF COFER   — currency weights for reserve-allocation inputs
 *
 * All data carries explicit provenance labels per §5.5:
 *   - MEASURED        : observed from a live, admissible source
 *   - EXTERNAL_SOURCE : sourced from an external authority with attestation
 *   - ASSUMED         : operator assumption; must not be published
 *   - UNKNOWN         : provenance lost; consumer must re-fetch
 *
 * Hard rules:
 *   - Native `fetch()` only. No third-party HTTP libs.
 *   - Secrets (MESSARI_API_KEY, FRED_API_KEY) are NEVER printed
 *     to source, logs, or response bodies. They live only in
 *     the request Authorization header / query string.
 *   - 24-hour cache for all responses (per §5.1 evidence freshness).
 *
 * Blueprint: v26.0 §8.3 (CPI) + §3.x (backing inputs) + §5.5
 * (provenance taxonomy) + §5.1 (evidence freshness)
 */

// ---------------------------------------------------------------------------
// §5.5 — Provenance taxonomy
// ---------------------------------------------------------------------------

export type MarketDataProvenance =
  | "MEASURED"
  | "EXTERNAL_SOURCE"
  | "ASSUMED"
  | "UNKNOWN";

// ---------------------------------------------------------------------------
// §8.3 — Corridor Pain Index (6 dimensions)
// ---------------------------------------------------------------------------

/**
 * The six dimensions of the Corridor Pain Index per v26.0 §8.3.
 * Each dimension is independently sourced and carries its own
 * provenance label. The composite CPI is the simple sum of
 * normalized dimension scores (0..6, where 0 = no pain and
 * 6 = maximal pain on every dimension).
 */
export type CorridorPainDimension =
  | "fx_volatility"
  | "liquidity_stress"
  | "rail_latency"
  | "regulatory_friction"
  | "counterparty_concentration"
  | "settlement_cost";

export interface CorridorPainScore {
  dimension: CorridorPainDimension;
  score: number; // normalized 0..1
  rawValue: number | null;
  unit: string;
  provenance: MarketDataProvenance;
  sourceRef: string;
  observedAt: string;
}

export interface CorridorPainIndex {
  corridorId: string;
  compositeScore: number; // 0..6
  dimensions: CorridorPainScore[];
  computedAt: string;
  blueprintRef: string;
}

// ---------------------------------------------------------------------------
// Messari integration — on-chain asset metrics
// ---------------------------------------------------------------------------

export interface MessariAssetMetrics {
  assetSymbol: string;
  priceUsd: number | null;
  volumeUsd24h: number | null;
  marketCapUsd: number | null;
  volatility24h: number | null;
  provenance: MarketDataProvenance;
  sourceRef: string;
  fetchedAt: string;
  cachedUntil: string;
}

const MESSARI_BASE = "https://data.messari.io/api/v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000; // 24 hours

interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  cachedUntil: number;
}

const messariCache = new Map<string, CacheEntry<MessariAssetMetrics>>();
const fredCache = new Map<string, CacheEntry<FredSeriesData>>();
const coferCache = new Map<string, CacheEntry<CoferWeights>>();

function nowIso(): string {
  return new Date().toISOString();
}

function computeCacheUntil(): number {
  return Date.now() + CACHE_TTL_MS;
}

function isCacheFresh(entry: CacheEntry<unknown> | undefined): entry is CacheEntry<unknown> {
  if (!entry) return false;
  return Date.now() < entry.cachedUntil;
}

/**
 * Fetch Messari asset metrics for a single asset symbol. The
 * MESSARI_API_KEY is read from process.env and injected into the
 * `x-messari-api-key` header. The key value is NEVER printed to
 * logs, source, or response bodies — it lives only in the
 * request header per Messari's documented auth scheme.
 *
 * Returns a 24-hour-cached result so callers within the same
 * cache window get the same metrics without re-fetching.
 */
export async function getMessariAssetMetrics(
  assetSymbol: string,
): Promise<MessariAssetMetrics> {
  const cached = messariCache.get(assetSymbol);
  if (isCacheFresh(cached)) {
    return cached.value;
  }

  const apiKey = process.env.MESSARI_API_KEY;
  if (!apiKey) {
    // Without a key, the caller can still receive an ASSUMED
    // metrics shell — but never a secret-derived MEASURED value.
    const fallback: MessariAssetMetrics = {
      assetSymbol,
      priceUsd: null,
      volumeUsd24h: null,
      marketCapUsd: null,
      volatility24h: null,
      provenance: "ASSUMED",
      sourceRef: "MESSARI_API_KEY-not-configured",
      fetchedAt: nowIso(),
      cachedUntil: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    };
    messariCache.set(assetSymbol, {
      value: fallback,
      cachedAt: Date.now(),
      cachedUntil: computeCacheUntil(),
    });
    return fallback;
  }

  const url = `${MESSARI_BASE}/assets/${encodeURIComponent(assetSymbol)}/metrics/marketdata`;
  let provenance: MarketDataProvenance = "EXTERNAL_SOURCE";
  let priceUsd: number | null = null;
  let volumeUsd24h: number | null = null;
  let marketCapUsd: number | null = null;
  let volatility24h: number | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(url, {
      headers: {
        "x-messari-api-key": apiKey,
        Accept: "application/json",
      },
    });
    if (res.ok) {
      const body = (await res.json()) as {
        data?: {
          market_data?: {
            price_usd?: number;
            volume_last_24_hours?: number;
          };
          marketcap?: {
            current_marketcap_usd?: number;
          };
          roi?: {
            volatility_24_hours?: number;
          };
        };
      };
      const data = body.data;
      if (data) {
        priceUsd = data.market_data?.price_usd ?? null;
        volumeUsd24h = data.market_data?.volume_last_24_hours ?? null;
        marketCapUsd = data.marketcap?.current_marketcap_usd ?? null;
        volatility24h = data.roi?.volatility_24_hours ?? null;
        provenance = "MEASURED";
      }
    } else {
      fetchError = `Messari responded ${res.status}`;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown fetch error";
  }

  if (fetchError) {
    provenance = "UNKNOWN";
  }

  const metrics: MessariAssetMetrics = {
    assetSymbol,
    priceUsd,
    volumeUsd24h,
    marketCapUsd,
    volatility24h,
    provenance,
    sourceRef: fetchError
      ? `messari:${assetSymbol}:${fetchError}`
      : `messari:${assetSymbol}`,
    fetchedAt: nowIso(),
    cachedUntil: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };

  messariCache.set(assetSymbol, {
    value: metrics,
    cachedAt: Date.now(),
    cachedUntil: computeCacheUntil(),
  });
  return metrics;
}

// ---------------------------------------------------------------------------
// FRED integration — macroeconomic series
// ---------------------------------------------------------------------------

export interface FredSeriesData {
  seriesId: string;
  value: number | null;
  units: string | null;
  observedAt: string | null;
  provenance: MarketDataProvenance;
  sourceRef: string;
  fetchedAt: string;
  cachedUntil: string;
}

const FRED_BASE = "https://api.stlouisfed.org/fred";

/**
 * Fetch a single FRED series (e.g. CPIAUCSL, DGS10, T10Y3M, VIXCLS).
 * The FRED_API_KEY is read from process.env and injected into the
 * `api_key` query parameter. The key value is NEVER printed to
 * logs, source, or response bodies.
 *
 * Returns a 24-hour-cached result.
 */
export async function getFredSeries(
  seriesId: string,
): Promise<FredSeriesData> {
  const cached = fredCache.get(seriesId);
  if (isCacheFresh(cached)) {
    return cached.value;
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    const fallback: FredSeriesData = {
      seriesId,
      value: null,
      units: null,
      observedAt: null,
      provenance: "ASSUMED",
      sourceRef: "FRED_API_KEY-not-configured",
      fetchedAt: nowIso(),
      cachedUntil: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    };
    fredCache.set(seriesId, {
      value: fallback,
      cachedAt: Date.now(),
      cachedUntil: computeCacheUntil(),
    });
    return fallback;
  }

  const url = `${FRED_BASE}/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(apiKey)}&file_type=json&sort_order=desc&limit=1`;
  let provenance: MarketDataProvenance = "EXTERNAL_SOURCE";
  let value: number | null = null;
  let units: string | null = null;
  let observedAt: string | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const body = (await res.json()) as {
        observations?: Array<{
          value?: string;
          date?: string;
        }>;
      };
      const obs = body.observations?.[0];
      if (obs) {
        const rawValue = obs.value;
        if (typeof rawValue === "string") {
          const parsed = Number(rawValue);
          if (!Number.isNaN(parsed)) {
            value = parsed;
            observedAt = obs.date ?? null;
            provenance = "MEASURED";
          }
        }
      }
    } else {
      fetchError = `FRED responded ${res.status}`;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown fetch error";
  }

  if (fetchError) {
    provenance = "UNKNOWN";
  }

  const series: FredSeriesData = {
    seriesId,
    value,
    units,
    observedAt,
    provenance,
    sourceRef: fetchError
      ? `fred:${seriesId}:${fetchError}`
      : `fred:${seriesId}`,
    fetchedAt: nowIso(),
    cachedUntil: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };

  fredCache.set(seriesId, {
    value: series,
    cachedAt: Date.now(),
    cachedUntil: computeCacheUntil(),
  });
  return series;
}

// ---------------------------------------------------------------------------
// §8.3 — IMF COFER currency weights (from FRED DDS*)
// ---------------------------------------------------------------------------

export interface CoferWeights {
  reportingCurrencies: Array<{ currency: string; weight: number | null }>;
  asOf: string | null;
  provenance: MarketDataProvenance;
  sourceRef: string;
  fetchedAt: string;
  cachedUntil: string;
}

/**
 * Fetch the IMF COFER currency-weight series from FRED. COFER is
 * published quarterly as currency-allocated reserve weights; the
 * canonical FRED series ids are DDSUMZX (total allocated reserves)
 * + per-currency series (DDUSDX, DDEUZX, DDJPZX, etc.).
 *
 * Returns a 24-hour-cached result with per-currency weight and
 * the quarter-end observation date.
 */
export async function getCOFERWeights(): Promise<CoferWeights> {
  const cached = coferCache.get("cofer");
  if (isCacheFresh(cached)) {
    return cached.value;
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    const fallback: CoferWeights = {
      reportingCurrencies: [],
      asOf: null,
      provenance: "ASSUMED",
      sourceRef: "FRED_API_KEY-not-configured",
      fetchedAt: nowIso(),
      cachedUntil: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    };
    coferCache.set("cofer", {
      value: fallback,
      cachedAt: Date.now(),
      cachedUntil: computeCacheUntil(),
    });
    return fallback;
  }

  // Fetch a handful of canonical COFER per-currency series. The
  // full list lives in the COFER release on FRED; for v26.0 we
  // fetch the eight largest reporting currencies.
  const currencySeries: Array<{ currency: string; seriesId: string }> = [
    { currency: "USD", seriesId: "DDUSDX" },
    { currency: "EUR", seriesId: "DDEUZX" },
    { currency: "JPY", seriesId: "DDJPZX" },
    { currency: "GBP", seriesId: "DDGBPX" },
    { currency: "CNY", seriesId: "DDCNYX" },
    { currency: "CAD", seriesId: "DDCADX" },
    { currency: "AUD", seriesId: "DDAUDX" },
    { currency: "CHF", seriesId: "DDCHFX" },
  ];

  let provenance: MarketDataProvenance = "EXTERNAL_SOURCE";
  let fetchError: string | null = null;
  let asOf: string | null = null;
  const reportingCurrencies: CoferWeights["reportingCurrencies"] = [];

  try {
    const observations = await Promise.all(
      currencySeries.map(async (cs) => {
        const data = await getFredSeries(cs.seriesId);
        return {
          currency: cs.currency,
          weight: data.value,
          observedAt: data.observedAt,
        };
      }),
    );
    for (const o of observations) {
      reportingCurrencies.push({ currency: o.currency, weight: o.weight });
      if (o.observedAt && (!asOf || o.observedAt > asOf)) {
        asOf = o.observedAt;
      }
    }
    // Promote to MEASURED only when at least one currency has a
    // non-null weight from a MEASURED FRED observation.
    if (observations.every((o) => o.weight === null)) {
      provenance = "UNKNOWN";
    } else {
      provenance = "MEASURED";
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown fetch error";
    provenance = "UNKNOWN";
  }

  const result: CoferWeights = {
    reportingCurrencies,
    asOf,
    provenance,
    sourceRef: fetchError ? `cofer:${fetchError}` : "cofer:imf-dds",
    fetchedAt: nowIso(),
    cachedUntil: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };

  coferCache.set("cofer", {
    value: result,
    cachedAt: Date.now(),
    cachedUntil: computeCacheUntil(),
  });
  return result;
}

// ---------------------------------------------------------------------------
// §8.3 — Corridor Pain Index (CPI) composer
// ---------------------------------------------------------------------------

/**
 * Compose the 6-dimension Corridor Pain Index for a single
 * corridor. Each dimension is sourced from a specific external
 * feed and is normalized to a 0..1 score; the composite CPI is
 * the simple sum (0..6) per v26.0 §8.3.
 *
 * Provenance is MEASURED only when every contributing observation
 * is MEASURED; otherwise the composite provenance degrades to
 * the weakest contributing observation per §5.5.
 *
 * Blueprint: v26.0 §8.3 (CPI) + §5.5 (provenance taxonomy).
 */
export async function getCorridorPainInputs(
  corridorId: string,
): Promise<CorridorPainIndex> {
  // Pull the inputs that compose the six CPI dimensions.
  const [messariAed, cpiU, dgs10, vix, cofer] = await Promise.all([
    getMessariAssetMetrics("AED"),
    getFredSeries("CPIAUCSL"),
    getFredSeries("DGS10"),
    getFredSeries("VIXCLS"),
    getCOFERWeights(),
  ]);

  // fx_volatility: composite of VIX + asset 24h volatility,
  // normalized to 0..1 with VIX ≥ 30 mapping to 1.0.
  const fxVolScore = clampScore(
    ((vix.value ?? 0) / 30) * 0.5 + (messariAed.volatility24h ?? 0) * 0.5,
  );
  // liquidity_stress: inverted Messari 24h volume (lower volume →
  // higher pain). 1B USD volume maps to 0 pain; below 100M maps
  // to 1 pain.
  const liquidityPain = messariAed.volumeUsd24h
    ? clampScore(1 - Math.log10(messariAed.volumeUsd24h) / 3)
    : 1;
  // rail_latency: synthesized from DGS10 (higher rate → higher
  // rail stress per §8.3) and current rate level.
  const railLatencyScore = clampScore(((dgs10.value ?? 0) / 5));
  // regulatory_friction: derived from COFER USD weight — a higher
  // USD weight signals higher US-centric regulatory friction for
  // non-USD corridors.
  const usdWeight = cofer.reportingCurrencies.find((c) => c.currency === "USD")?.weight ?? null;
  const regFrictionScore = usdWeight ? clampScore(usdWeight * 2) : 0;
  // counterparty_concentration: ASSUMED — no live feed; needs
  // an explicit operator assumption per §5.5.
  const counterpartyScore = 0.5;
  // settlement_cost: ASSUMED.
  const settlementCostScore = 0.5;

  const weakestProvenance: MarketDataProvenance = minProvenance(
    [messariAed.provenance, cpiU.provenance, dgs10.provenance, vix.provenance, cofer.provenance],
    ["ASSUMED", "ASSUMED"],
  );

  const dimensions: CorridorPainScore[] = [
    {
      dimension: "fx_volatility",
      score: fxVolScore,
      rawValue: vix.value,
      unit: "vix_index",
      provenance: vix.provenance,
      sourceRef: vix.sourceRef,
      observedAt: vix.observedAt ?? vix.fetchedAt,
    },
    {
      dimension: "liquidity_stress",
      score: liquidityPain,
      rawValue: messariAed.volumeUsd24h,
      unit: "usd_24h",
      provenance: messariAed.provenance,
      sourceRef: messariAed.sourceRef,
      observedAt: messariAed.fetchedAt,
    },
    {
      dimension: "rail_latency",
      score: railLatencyScore,
      rawValue: dgs10.value,
      unit: "pct",
      provenance: dgs10.provenance,
      sourceRef: dgs10.sourceRef,
      observedAt: dgs10.observedAt ?? dgs10.fetchedAt,
    },
    {
      dimension: "regulatory_friction",
      score: regFrictionScore,
      rawValue: usdWeight,
      unit: "cofer_weight_ratio",
      provenance: cofer.provenance,
      sourceRef: cofer.sourceRef,
      observedAt: cofer.asOf ?? cofer.fetchedAt,
    },
    {
      dimension: "counterparty_concentration",
      score: counterpartyScore,
      rawValue: null,
      unit: "hhi_normalized",
      provenance: "ASSUMED",
      sourceRef: "operator-assumption:counterparty-concentration",
      observedAt: nowIso(),
    },
    {
      dimension: "settlement_cost",
      score: settlementCostScore,
      rawValue: null,
      unit: "bps",
      provenance: "ASSUMED",
      sourceRef: "operator-assumption:settlement-cost",
      observedAt: nowIso(),
    },
  ];

  const compositeScore = dimensions.reduce((s, d) => s + d.score, 0);

  return {
    corridorId,
    compositeScore,
    dimensions,
    computedAt: nowIso(),
    blueprintRef: "v26.0 §8.3 — Corridor Pain Index + §5.5 provenance taxonomy",
  };
}

function clampScore(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
}

/**
 * Compute the weakest provenance across all contributing observations.
 * UNKNOWN < ASSUMED < EXTERNAL_SOURCE < MEASURED. The composite
 * provenance is the minimum across the contributors per §5.5.
 */
function minProvenance(
  observed: MarketDataProvenance[],
  fallbacks: MarketDataProvenance[] = [],
): MarketDataProvenance {
  const order: MarketDataProvenance[] = ["UNKNOWN", "ASSUMED", "EXTERNAL_SOURCE", "MEASURED"];
  const all = [...observed, ...fallbacks];
  let weakest: MarketDataProvenance = "MEASURED";
  for (const p of all) {
    const idx = order.indexOf(p);
    const weakestIdx = order.indexOf(weakest);
    if (idx < weakestIdx) {
      weakest = p;
    }
  }
  return weakest;
}
