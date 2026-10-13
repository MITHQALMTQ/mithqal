// src/lib/messari-data.ts
//
// MITHQAL v25.3.22 — MESSARI DATA SOURCE (CR-2026-032)
//
// Provides a thin client around the Messari market-data API
// (https://data.messari.io/api/v1). Messari aggregates price, volume,
// market-cap, supply, and on-chain metrics for digital assets.
//
// ─── HONEST-STATE NOTE (CRITICAL — DO NOT REMOVE) ────────────────────────
//   This module is a MARKET DATA SOURCE. It is NOT:
//     - a reserve oracle (use multi-oracle.ts for gold/silver/FX reserves)
//     - a NavPrice oracle (gold-anchored NAV is computed by nav-compute.ts)
//     - a sanctions / compliance screening source
//     - a price oracle for settlement authorization
//
//   Messari data is fetched live (with a short TTL cache) and recorded with
//   source + timestamp provenance. If MESSARI_API_KEY is missing, the
//   module degrades gracefully: fetchMessariAssetMetrics returns null and
//   fetchMessariMarketcap returns []. Callers MUST handle null/[] without
//   crashing the path — Messari is a SECONDARY market data source, not a
//   constitutional dependency. No institutional operation depends on
//   Messari availability (per §31 multi-source doctrine).
//
// NOT PRODUCTION-AUTHORIZED:
//   Market data is informational only. No Messari-sourced figure may be
//   used as the sole input to a settlement, reserve, or authorization
//   decision. Every Messari-sourced value must be paired with at least one
//   independent source (multi-oracle consensus, FRED, BIS, IMF, etc.)
//   before it can affect any institutional control plane.
// ───────────────────────────────────────────────────────────────────────────

// === Constants ===

const MESSARI_BASE_URL = "https://data.messari.io/api/v1";
const FETCH_TIMEOUT_MS = 8000; // per-request timeout
const CACHE_TTL_MS = 60_000; // 60-second cache — Messari metrics are reasonably fresh at this cadence

// === Types ===

/**
 * Subset of Messari's metrics endpoint (`GET /v1/assets/{asset}/metrics`)
 * that MITHQAL consumers care about. Messari returns many more fields; we
 * only surface the ones callers use to keep the typed contract narrow.
 */
export interface MessariMetrics {
  assetKey: string;
  name: string;
  symbol: string;
  /** ISO 4217-style asset id used by Messari (e.g., "1e312d9e-..."). */
  messariId?: string;
  marketData: {
    priceUsd: number | null;
    volumeLast24HoursUsd: number | null;
    realVolumeLast24HoursUsd: number | null;
    percentChangeUsdLast24Hours: number | null;
    percentChangeUsdLast7Days: number | null;
    percentChangeUsdLast30Days: number | null;
  };
  marketcap: {
    currentMarketcapUsd: number | null;
    marketcapRank: number | null;
  };
  supply: {
    circulatingSupply: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
  };
  /** ISO 8601 — when Messari last computed the metric snapshot. */
  lastComputedAt?: string;
  /** ISO 8601 — when this MITHQAL-side fetch happened. */
  fetchedAt: string;
  /** Live URL the data was fetched from (provenance). */
  sourceUrl: string;
}

export interface MessariAsset {
  assetKey: string;
  name: string;
  symbol: string;
  marketcapUsd: number | null;
  marketcapRank: number | null;
  priceUsd: number | null;
}

// === Internal cache ===

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const metricsCache = new Map<string, CacheEntry<MessariMetrics | null>>();
const marketcapCache: CacheEntry<MessariAsset[]> = {
  value: [],
  expiresAt: 0,
};

// === Env / key check ===

function getApiKey(): string | null {
  const key = process.env.MESSARI_API_KEY;
  if (!key) {
    console.warn(
      "[messari-data] MESSARI_API_KEY not set — fetchMessari* will return null/[]. " +
        "This is a graceful degradation; no institutional operation depends on Messari availability."
    );
    return null;
  }
  return key;
}

// === Internal fetch helper ===

async function fetchJsonWithTimeout(
  url: string,
  apiKey: string
): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-messari-api-key": apiKey,
        accept: "application/json",
      },
      signal: controller.signal,
      // Disable Next.js fetch caching on the route — we manage our own TTL.
      cache: "no-store" as RequestCache,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(
        `[messari-data] non-2xx from ${url}: HTTP ${res.status} ${res.statusText}`
      );
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(
      `[messari-data] fetch failed for ${url}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// === Public API ===

/**
 * Fetch market metrics for a single Messari asset (e.g., "bitcoin",
 * "ethereum", " tether"). Returns null on: missing API key, network error,
 * non-2xx, parse failure. Never throws.
 *
 * Cached for CACHE_TTL_MS (60s) per assetKey.
 */
export async function fetchMessariAssetMetrics(
  assetKey: string
): Promise<MessariMetrics | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const key = assetKey.trim().toLowerCase();
  if (!key) return null;

  const cached = metricsCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const url = `${MESSARI_BASE_URL}/assets/${encodeURIComponent(key)}/metrics`;
  const raw = await fetchJsonWithTimeout(url, apiKey);
  if (!raw) {
    metricsCache.set(key, { value: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }

  try {
    const data = (raw as { data?: Record<string, unknown> }).data;
    if (!data) {
      console.warn(`[messari-data] no .data field in metrics response for ${key}`);
      metricsCache.set(key, { value: null, expiresAt: now + CACHE_TTL_MS });
      return null;
    }

    const marketData = (data.market_data ?? {}) as Record<string, unknown>;
    const marketcap = (data.marketcap ?? {}) as Record<string, unknown>;
    const supply = (data.supply ?? {}) as Record<string, unknown>;
    const profile = (data.profile ?? {}) as Record<string, unknown>;
    const general = (profile.general ?? {}) as Record<string, unknown>;

    const numOr = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const metrics: MessariMetrics = {
      assetKey: key,
      name: (general.name as string) || (data.name as string) || key,
      symbol:
        (general.symbol as string) ||
        (profile.symbol as string) ||
        (data.symbol as string) ||
        key.toUpperCase(),
      messariId: typeof data.id === "string" ? (data.id as string) : undefined,
      marketData: {
        priceUsd: numOr(marketData.price_usd),
        volumeLast24HoursUsd: numOr(marketData.volume_last_24_hours),
        realVolumeLast24HoursUsd: numOr(marketData.real_volume_last_24_hours),
        percentChangeUsdLast24Hours: numOr(
          marketData.percent_change_usd_last_24_hours
        ),
        percentChangeUsdLast7Days: numOr(
          marketData.percent_change_usd_last_7_days
        ),
        percentChangeUsdLast30Days: numOr(
          marketData.percent_change_usd_last_30_days
        ),
      },
      marketcap: {
        currentMarketcapUsd: numOr(marketcap.current_marketcap_usd),
        marketcapRank: numOr(marketcap.marketcap_rank),
      },
      supply: {
        circulatingSupply: numOr(supply.circulating_supply),
        totalSupply: numOr(supply.total_supply),
        maxSupply: numOr(supply.max_supply),
      },
      lastComputedAt:
        typeof data.last_calculation_time === "string"
          ? (data.last_calculation_time as string)
          : undefined,
      fetchedAt: new Date().toISOString(),
      sourceUrl: url,
    };

    metricsCache.set(key, { value: metrics, expiresAt: now + CACHE_TTL_MS });
    return metrics;
  } catch (err) {
    console.warn(
      `[messari-data] parse failure for ${key}:`,
      err instanceof Error ? err.message : err
    );
    metricsCache.set(key, { value: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }
}

/**
 * Fetch the top-N digital assets by current market cap from Messari.
 * Returns [] on: missing API key, network error, non-2xx, parse failure.
 * Never throws. Cached for CACHE_TTL_MS (60s) regardless of `limit`.
 *
 * @param limit Number of assets to return (default 20, max 500 per Messari API).
 */
export async function fetchMessariMarketcap(
  limit: number = 20
): Promise<MessariAsset[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const now = Date.now();
  if (marketcapCache.expiresAt > now && marketcapCache.value.length > 0) {
    return marketcapCache.value.slice(0, limit);
  }

  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  const fields =
    "id,name,symbol,metrics/marketcap/current_marketcap_usd,metrics/marketcap/marketcap_rank,metrics/market_data/price_usd";
  const url =
    `${MESSARI_BASE_URL}/assets?fields=${encodeURIComponent(fields)}` +
    `&limit=${safeLimit}` +
    `&order-by=metrics.marketcap.current_marketcap_usd` +
    `&order-direction=desc`;

  const raw = await fetchJsonWithTimeout(url, apiKey);
  if (!raw) return [];

  try {
    const data = raw as { data?: Array<Record<string, unknown>> };
    if (!data.data || !Array.isArray(data.data)) {
      console.warn("[messari-data] marketcap response missing .data array");
      return [];
    }

    const assets: MessariAsset[] = data.data.map((entry) => {
      const metrics = (entry.metrics ?? {}) as Record<string, unknown>;
      const marketData = (metrics.market_data ?? {}) as Record<string, unknown>;
      const marketcap = (metrics.marketcap ?? {}) as Record<string, unknown>;
      const numOr = (v: unknown): number | null => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string" && v.trim() !== "") {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      };
      return {
        assetKey: (entry.slug as string) ||
          (entry.id as string) ||
          (entry.symbol as string) ||
          "",
        name: (entry.name as string) || "",
        symbol: (entry.symbol as string) || "",
        marketcapUsd: numOr(marketcap.current_marketcap_usd),
        marketcapRank: numOr(marketcap.marketcap_rank),
        priceUsd: numOr(marketData.price_usd),
      };
    });

    marketcapCache.value = assets;
    marketcapCache.expiresAt = now + CACHE_TTL_MS;
    return assets.slice(0, safeLimit);
  } catch (err) {
    console.warn(
      "[messari-data] marketcap parse failure:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

// === Module identity (mirrors the pattern in institutional-evidence-fabric.ts) ===

export const MESSARI_DATA_SOURCE_STATUS: "ACTIVE" | "PENDING_VALIDATION" = "ACTIVE";
export const MESSARI_DATA_SOURCE_VERSION = "v25.3.22-CR-2026-032-1.0";
export const MESSARI_DATA_SOURCE = "src/lib/messari-data.ts";
export const MESSARI_API_BASE = MESSARI_BASE_URL;
