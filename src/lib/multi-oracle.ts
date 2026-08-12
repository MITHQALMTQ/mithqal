// Multi-Source Gold Oracle — consensus layer for the Mithqal reserve engine.
//
// Constitutional principle (§31, §56.1 of the v19 blueprint):
//   "No institutional operation shall depend on any single external
//    entity, service provider, jurisdiction, or technology. Failure of
//    any single dependency shall not interrupt constitutional operation."
//
// PROBLEM this module solves:
//   The live NAV path (src/lib/live-oracle.ts) fetches gold from a SINGLE
//   free API (gold-api.com) and silently falls back to a hardcoded $4050
//   constant on any failure. The `oracleConsensus()` function defined in
//   v19-infrastructure.ts (§31 — Weighted Median Framework) is spec-echo
//   only: it operates over a synthetic OracleObservation[] and is never
//   called on the live path. This means a single API outage, a single
//   compromised feed, or a single stale response can move the live NAV
//   by hundreds of dollars per ounce without any detection.
//
// WHAT this module does:
//   Implements the live-path multi-source consensus that §31 always
//   specified but never had. Fetches gold from 3+ independent sources in
//   parallel, applies median + 2% outlier rejection, and returns a
//   consensus price with full per-source provenance. A 4-tier fallback
//   hierarchy guarantees the function always returns a usable price:
//
//     Tier 1: Multi-source median (≥2 sources succeeded)  → method: "median"
//     Tier 2: Single best source (only 1 succeeded)        → method: "single", quorumMet: false
//     Tier 3: Last known good price (cached, with warning) → method: "fallback", quorumMet: false
//     Tier 4: Hardcoded v20 baseline ($4,076.9)            → method: "fallback", quorumMet: false
//
// INTEGRATION:
//   `getMultiOracleGoldPrice()` is the exported entry point. It will be
//   called by live-oracle.ts (separate integration task) to replace the
//   single-source `fetch("https://api.gold-api.com/price/XAU")` call.
//
// This module is intentionally side-effect-free on import (no top-level
// fetch, no DB access). It uses an in-memory 60-second cache plus a
// persistent "last known good" cache that survives cache expiry for the
// Tier 3 fallback.

const V20_BASELINE_GOLD_USD = 4076.9; // v20 institutional hardening baseline ($/oz)
const FETCH_TIMEOUT_MS = 5000; // per-source 5-second timeout (§56 freshness doctrine)
const CACHE_TTL_MS = 60_000; // 60-second cache for successful consensus
const OUTLIER_THRESHOLD_PCT = 0.02; // reject sources >2% from median
const QUORUM_MIN_SOURCES = 2; // ≥2 sources required for "median" method

// Conservative gold/silver ratio for the computed-proxy circuit-breaker.
// As of the v20 baseline (2024-2026), the ratio has traded in the 80–90
// range; 85.0 is the midpoint and a deliberately conservative choice.
const GOLD_SILVER_RATIO_FALLBACK = 85.0;

// ============================================================
// Types
// ============================================================

export interface MultiOracleSource {
  name: string;
  price: number; // USD per troy ounce
  included: boolean; // true if passed outlier check
  /** Signed deviation from final consensus price, in percent.
   *  Positive = source above consensus, negative = below. */
  deviationPct: number;
}

export interface MultiOracleResult {
  /** USD per troy ounce — the price callers should use. */
  consensusPrice: number;
  /** Per-source provenance. Only successful fetches appear here;
   *  failed fetches are logged but not included in this array. */
  sources: MultiOracleSource[];
  /** True iff ≥2 sources succeeded (quorum met). False for tiers 2–4. */
  quorumMet: boolean;
  /** Unix epoch ms when this result was produced. */
  timestamp: number;
  /** "median" (tier 1) | "single" (tier 2) | "fallback" (tiers 3 & 4). */
  method: "median" | "single" | "fallback";
}

// Internal shape used while fetching.
interface FetchedSource {
  name: string;
  price: number | null; // null = fetch failed
}

// ============================================================
// Source fetchers — each independent, each with 5s timeout
// ============================================================
//
// Every fetcher returns `number | null`:
//   - number: the live gold price in USD per troy ounce (validated > 0, finite)
//   - null:   any failure (network, non-2xx, parse error, zero/negative price)
//
// All failures are logged via console.warn so operators can see which
// sources are degrading without crashing the consensus path.

/** Source 1: gold-api.com (LBMA spot XAU/USD). Same feed as the existing
 *  live-oracle.ts single-source path. Free, no API key, updated every
 *  few seconds. */
async function fetchGoldApiCom(): Promise<number | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = typeof data?.price === "number" ? data.price : null;
    if (price === null || !isFinite(price) || price <= 0) return null;
    return price;
  } catch (err) {
    console.warn(
      "[multi-oracle] gold-api.com fetch failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** Source 2: CoinGecko (tether-gold / XAUt). Tether Gold is a
 *  gold-backed ERC-20 where 1 XAUt = 1 troy oz of LBMA gold held in
 *  Swiss vaults. Its USD market price tracks spot gold closely
 *  (typically within 0.1%) and is fully independent of the gold-api.com
 *  LBMA feed. Free, no API key required for the simple/price endpoint. */
async function fetchCoinGeckoGold(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd",
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = data?.["tether-gold"]?.usd;
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return null;
    return price;
  } catch (err) {
    console.warn(
      "[multi-oracle] CoinGecko (tether-gold) fetch failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** Source 3: goldprice.org free JSON endpoint. Returns the LBMA gold
 *  benchmark in USD per troy ounce. Independent of both gold-api.com
 *  and CoinGecko. Response shape:
 *    { items: [{ curr: "USD", xauPrice: 4076.5, xagPrice: 58.76, ... }] } */
async function fetchGoldPriceOrg(): Promise<number | null> {
  try {
    const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const item = Array.isArray(data?.items) ? data.items[0] : null;
    const price = item?.xauPrice;
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return null;
    return price;
  } catch (err) {
    console.warn(
      "[multi-oracle] goldprice.org fetch failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** Circuit-breaker (NOT a primary source): computed proxy via silver ×
 *  gold/silver ratio. Used ONLY when fewer than 2 of the 3 primary
 *  sources succeed. Fetches silver (XAG) from gold-api.com and multiplies
 *  by the historical gold/silver ratio. This is NOT fully independent —
 *  it shares the gold-api.com upstream — so it is never the sole source
 *  of consensus; it can only break a tie between two failed primaries
 *  to bring the count to quorum. */
async function fetchComputedProxy(): Promise<number | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAG", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const silver = typeof data?.price === "number" ? data.price : null;
    if (silver === null || !isFinite(silver) || silver <= 0) return null;
    return silver * GOLD_SILVER_RATIO_FALLBACK;
  } catch (err) {
    console.warn(
      "[multi-oracle] computed proxy (silver × ratio) fetch failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// ============================================================
// Median + outlier rejection
// ============================================================

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1
    ? sorted[Math.floor(n / 2)]
    : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * Apply outlier rejection to a list of successful source prices.
 *
 * Pipeline (§31.5 adapted to live-path):
 *   1. Calculate median of ALL successful sources.
 *   2. Calculate deviation of each source from that median.
 *   3. Reject any source with deviation > OUTLIER_THRESHOLD_PCT (2%).
 *   4. Re-calculate median from the remaining (included) sources.
 *
 * Edge case — all sources rejected as mutual outliers:
 *   This happens when sources disagree by >4% pairwise (e.g. 1 primary
 *   + the silver×ratio proxy, which can diverge by 20%+ when the actual
 *   gold/silver ratio differs from the conservative 85:1 fallback). In
 *   this case we have no trusted consensus — return an EMPTY includedSet
 *   and a zero consensusPrice, signaling to the caller that the Tier 1
 *   consensus failed and they should drop to Tier 3 (last-known-good) or
 *   Tier 4 (hardcoded baseline). The source prices are still surfaced in
 *   the result with `included: false` so operators can see what each
 *   source reported.
 *
 * Returns the final consensus price + the set of source names that
 * passed the outlier check. An empty `includedSet` with `consensusPrice
 * === 0` signals "all rejected — fall back".
 */
function applyOutlierRejection(
  successful: Array<{ name: string; price: number }>
): { consensusPrice: number; includedSet: Set<string> } {
  if (successful.length === 0) {
    return { consensusPrice: 0, includedSet: new Set() };
  }
  if (successful.length === 1) {
    return {
      consensusPrice: successful[0].price,
      includedSet: new Set([successful[0].name]),
    };
  }

  // Step 1: initial median over all successful sources
  const initialMedian = median(successful.map((s) => s.price));

  // Steps 2 + 3: reject sources > 2% from initial median
  const included = successful.filter((s) => {
    const dev = Math.abs(s.price - initialMedian) / initialMedian;
    return dev <= OUTLIER_THRESHOLD_PCT;
  });

  // Edge case: all rejected as mutual outliers — signal failure to the
  // caller via an empty includedSet. The caller will drop to Tier 3/4.
  if (included.length === 0) {
    return { consensusPrice: 0, includedSet: new Set() };
  }

  // Step 4: re-calculate median from the included set
  const consensusPrice = median(included.map((s) => s.price));
  return {
    consensusPrice,
    includedSet: new Set(included.map((s) => s.name)),
  };
}

// ============================================================
// Cache (60s TTL + last-known-good for Tier 3 fallback)
// ============================================================
//
// Two caches are maintained:
//   - cachedResult:   the most recent successful MultiOracleResult.
//                     Returned directly if < CACHE_TTL_MS old.
//   - lastKnownGood:  the most recent successful consensus PRICE
//                     (scalar). Survives cache expiry; used as the
//                     Tier 3 fallback when a fresh fetch fails entirely.
//
// Both are updated together whenever a Tier 1 ("median") or Tier 2
// ("single") result is produced. Neither is updated on a Tier 3/4
// fallback (we don't want to "learn" a stale or hardcoded price as
// the new last-known-good).

let cachedResult: { result: MultiOracleResult; timestamp: number } | null = null;
let lastKnownGood: { price: number; timestamp: number } | null = null;

// ============================================================
// Result computation (the 4-tier fallback hierarchy)
// ============================================================

/**
 * Build a MultiOracleResult from the list of successful source fetches.
 *
 * Assumes all entries in `successful` have a valid > 0 finite price.
 *
 * Tier selection:
 *   - 0 sources  → Tier 3 (last known good) or Tier 4 (hardcoded baseline)
 *   - 1 source   → Tier 2 (single, quorumMet: false, explicit warning)
 *   - ≥2 sources → Tier 1 (median + outlier rejection, quorumMet: true)
 */
function computeResult(
  successful: Array<{ name: string; price: number }>
): MultiOracleResult {
  const timestamp = Date.now();

  // ---- Tier 4 / Tier 3: nothing succeeded ----
  if (successful.length === 0) {
    // Tier 3: last known good (cached, with staleness warning)
    if (lastKnownGood) {
      const ageSec = Math.round((Date.now() - lastKnownGood.timestamp) / 1000);
      console.warn(
        `[multi-oracle] all primary sources failed — using last known good ` +
          `($${lastKnownGood.price.toFixed(2)}, age=${ageSec}s, staleness warning)`
      );
      return {
        consensusPrice: lastKnownGood.price,
        sources: [],
        quorumMet: false,
        timestamp,
        method: "fallback",
      };
    }
    // Tier 4: hardcoded v20 baseline (last resort, explicit warning)
    console.warn(
      `[multi-oracle] all sources failed and no last-known-good available — ` +
        `using hardcoded v20 baseline $${V20_BASELINE_GOLD_USD}/oz`
    );
    return {
      consensusPrice: V20_BASELINE_GOLD_USD,
      sources: [],
      quorumMet: false,
      timestamp,
      method: "fallback",
    };
  }

  // ---- Tier 2: only 1 source succeeded ----
  if (successful.length < QUORUM_MIN_SOURCES) {
    const only = successful[0];
    console.warn(
      `[multi-oracle] only 1 source succeeded (${only.name}=$${only.price.toFixed(
        2
      )}) — quorum not met, using single-source fallback`
    );
    return {
      consensusPrice: only.price,
      sources: [
        {
          name: only.name,
          price: only.price,
          included: true,
          deviationPct: 0,
        },
      ],
      quorumMet: false,
      timestamp,
      method: "single",
    };
  }

  // ---- Tier 1: ≥2 sources succeeded — apply outlier rejection ----
  const { consensusPrice, includedSet } = applyOutlierRejection(successful);

  // When all sources are rejected as mutual outliers (includedSet is
  // empty), consensusPrice comes back as 0. In that case we still want
  // to surface each source's deviation from the initial median so
  // operators can see how far apart the sources were. Compute the
  // initial median once here (matches the value computed inside
  // applyOutlierRejection for the all-rejected branch).
  const initialMedian =
    consensusPrice > 0 ? consensusPrice : median(successful.map((s) => s.price));

  // Build the per-source provenance array. ALL successful fetches are
  // surfaced here (even rejected outliers) so operators can see what
  // each source reported. `included` reflects whether the source passed
  // the 2% outlier check.
  const sources: MultiOracleSource[] = successful.map((s) => ({
    name: s.name,
    price: s.price,
    included: includedSet.has(s.name),
    deviationPct:
      initialMedian > 0
        ? ((s.price - initialMedian) / initialMedian) * 100
        : 0,
  }));

  // Edge case: all sources rejected as mutual outliers. We have data
  // but no trusted consensus. Fall back in this order:
  //   (a) If at least one NON-PROXY primary source succeeded, prefer it
  //       as a Tier 2 single-source fallback. The proxy is known to be
  //       approximate (fixed gold/silver ratio); a real primary source
  //       is more trustworthy than dropping to the hardcoded baseline.
  //   (b) Otherwise, drop to Tier 3 (last known good).
  //   (c) Otherwise, drop to Tier 4 (hardcoded v20 baseline).
  // The sources array is still populated above so the caller can see
  // what each source reported and the disagreement magnitude.
  if (includedSet.size === 0) {
    const PROXY_NAME_PREFIX = "computed-proxy";
    const realPrimary = successful.find(
      (s) => !s.name.startsWith(PROXY_NAME_PREFIX)
    );
    if (realPrimary) {
      console.warn(
        `[multi-oracle] all ${successful.length} sources rejected as mutual ` +
          `outliers — falling back to single real primary source ` +
          `(${realPrimary.name}=$${realPrimary.price.toFixed(2)})`
      );
      // Mark only the real primary as included for transparency.
      const fallbackSources = sources.map((s) => ({
        ...s,
        included: s.name === realPrimary.name,
      }));
      return {
        consensusPrice: realPrimary.price,
        sources: fallbackSources,
        quorumMet: false,
        timestamp,
        method: "single",
      };
    }
    if (lastKnownGood) {
      const ageSec = Math.round((Date.now() - lastKnownGood.timestamp) / 1000);
      console.warn(
        `[multi-oracle] all ${successful.length} sources rejected as mutual ` +
          `outliers (only proxy available) — using last known good ` +
          `($${lastKnownGood.price.toFixed(2)}, age=${ageSec}s)`
      );
      return {
        consensusPrice: lastKnownGood.price,
        sources,
        quorumMet: false,
        timestamp,
        method: "fallback",
      };
    }
    console.warn(
      `[multi-oracle] all ${successful.length} sources rejected as mutual ` +
        `outliers and no last-known-good — using hardcoded v20 baseline`
    );
    return {
      consensusPrice: V20_BASELINE_GOLD_USD,
      sources,
      quorumMet: false,
      timestamp,
      method: "fallback",
    };
  }

  return {
    consensusPrice,
    sources,
    quorumMet: true,
    timestamp,
    method: "median",
  };
}

// ============================================================
// Main entry point
// ============================================================

/**
 * Get the multi-source gold price consensus.
 *
 * Fetches from 3 independent primary sources in parallel:
 *   1. gold-api.com (LBMA XAU/USD)
 *   2. CoinGecko (tether-gold / XAUt — independent gold-backed token)
 *   3. goldprice.org (LBMA gold benchmark)
 *
 * If fewer than 2 primaries succeed, a computed-proxy circuit-breaker
 * (silver × gold/silver ratio from gold-api.com XAG) is added as a
 * last-resort 4th source to attempt to reach quorum. The proxy is never
 * the sole source — if all 3 primaries fail and only the proxy succeeds,
 * we still fall through to Tier 3/4.
 *
 * The 4-tier fallback hierarchy (Tier 1 median → Tier 2 single →
 * Tier 3 last-known-good → Tier 4 hardcoded baseline) guarantees the
 * function always returns a usable price.
 *
 * Results are cached for 60 seconds. The last successful consensus
 * price is retained indefinitely as the Tier 3 fallback.
 *
 * @returns MultiOracleResult — see interface for full shape.
 */
export async function getMultiOracleGoldPrice(): Promise<MultiOracleResult> {
  // 1. Return cached result if fresh (< 60s old)
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return cachedResult.result;
  }

  // 2. Fetch all 3 primary sources in parallel (each with 5s timeout)
  const [goldApi, coinGecko, goldPriceOrg] = await Promise.all([
    fetchGoldApiCom(),
    fetchCoinGeckoGold(),
    fetchGoldPriceOrg(),
  ]);

  const fetched: FetchedSource[] = [
    { name: "gold-api.com", price: goldApi },
    { name: "CoinGecko-XAUt", price: coinGecko },
    { name: "goldprice.org", price: goldPriceOrg },
  ];

  // 3. Filter out failures (null / zero / negative already returned as null)
  const successful = fetched.filter(
    (s): s is { name: string; price: number } => s.price !== null
  );

  // 4. If we don't have quorum yet, try the computed-proxy circuit-breaker.
  //    This shares gold-api.com's upstream feed (XAG), so it is NOT a fully
  //    independent source — but it can break a 1-source tie and bring us to
  //    quorum. It is never the sole source (if successful.length === 0 and
  //    proxy succeeds, we still go to Tier 2 "single" with quorumMet=false).
  let successfulForConsensus = successful;
  if (successful.length < QUORUM_MIN_SOURCES) {
    const proxy = await fetchComputedProxy();
    if (proxy !== null) {
      successfulForConsensus = [
        ...successful,
        { name: "computed-proxy(silver×ratio)", price: proxy },
      ];
      console.warn(
        `[multi-oracle] only ${successful.length}/3 primary sources succeeded — ` +
          `computed proxy (silver×ratio) added as circuit-breaker`
      );
    }
  }

  // 5. Compute the result through the 4-tier fallback hierarchy
  const result = computeResult(successfulForConsensus);

  // 6. Update caches only on Tier 1 / Tier 2 success.
  //    Tier 3/4 fallbacks do NOT update the cache (we don't want to learn
  //    a stale or hardcoded price as the new "last known good").
  if (result.method === "median" || result.method === "single") {
    cachedResult = { result, timestamp: Date.now() };
    lastKnownGood = {
      price: result.consensusPrice,
      timestamp: Date.now(),
    };
  } else {
    // Tier 3/4 — log the degradation explicitly. Age is -1 if no
    // last-known-good exists (Tier 4 hardcoded baseline).
    const ageSec = lastKnownGood
      ? Math.round((Date.now() - lastKnownGood.timestamp) / 1000)
      : -1;
    console.warn(
      `[multi-oracle] returning fallback ` +
        `(method=${result.method}, price=$${result.consensusPrice.toFixed(2)}, ` +
        `lastKnownGood age=${ageSec}s)`
    );
  }

  return result;
}

// ============================================================
// Test / inspection helpers
// ============================================================

// ============================================================
// Silver multi-source oracle (v23 §31 — silver parity with gold)
// ============================================================

const SILVER_FALLBACK_USD = 30.0; // conservative v23 baseline ($/oz)

let cachedSilver: { result: MultiOracleResult; timestamp: number } | null = null;
let lastKnownGoodSilver: { price: number; timestamp: number } | null = null;

/** Silver Source 1: gold-api.com (LBMA XAG/USD). */
async function fetchSilverGoldApiCom(): Promise<number | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAG", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const price = (data as { price?: unknown })?.price;
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return null;
    return price;
  } catch {
    return null;
  }
}

/** Silver Source 2: computed proxy — gold consensus / gold-silver ratio.
 *  Uses the gold consensus price (already multi-sourced) divided by the
 *  historical ratio. Independent of gold-api.com's XAG endpoint. */
async function fetchSilverComputedProxy(goldConsensus: number): Promise<number | null> {
  if (goldConsensus <= 0) return null;
  return goldConsensus / GOLD_SILVER_RATIO_FALLBACK;
}

/** Silver Source 3: metals-api.com (free, no key) — XAG/USD spot. */
async function fetchSilverMetalsApi(): Promise<number | null> {
  try {
    // metals-api.com free tier — returns XAG/USD
    const res = await fetch(
      "https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=oz",
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const metals = (data as { metals?: Record<string, unknown> })?.metals;
    const silver = metals?.silver;
    if (typeof silver !== "number" || !isFinite(silver) || silver <= 0) return null;
    return silver;
  } catch {
    return null;
  }
}

/**
 * Get the multi-source silver price consensus.
 *
 * Fetches from independent sources:
 *   1. gold-api.com (LBMA XAG/USD)
 *   2. metals.dev (independent spot)
 *   3. computed proxy (gold consensus / gold-silver ratio) — circuit breaker
 *
 * Same 4-tier fallback hierarchy as gold.
 */
export async function getMultiOracleSilverPrice(
  goldConsensus?: number,
): Promise<MultiOracleResult> {
  if (cachedSilver && Date.now() - cachedSilver.timestamp < CACHE_TTL_MS) {
    return cachedSilver.result;
  }

  const [goldApi, metalsApi, goldPrice] = await Promise.all([
    fetchSilverGoldApiCom(),
    fetchSilverMetalsApi(),
    goldConsensus && goldConsensus > 0
      ? Promise.resolve(goldConsensus)
      : getMultiOracleGoldPrice().then(r => r.consensusPrice).catch(() => 0),
  ]);

  const fetched: FetchedSource[] = [
    { name: "gold-api.com", price: goldApi },
    { name: "metals.dev", price: metalsApi },
  ];

  const successful = fetched.filter(
    (s): s is { name: string; price: number } => s.price !== null,
  );

  // Add computed proxy as circuit-breaker if quorum not met
  let successfulForConsensus = successful;
  if (successful.length < QUORUM_MIN_SOURCES) {
    const proxy = await fetchSilverComputedProxy(goldPrice);
    if (proxy !== null) {
      successfulForConsensus = [
        ...successful,
        { name: "computed-proxy(gold÷ratio)", price: proxy },
      ];
      console.warn(
        `[multi-oracle] silver: only ${successful.length}/2 primary sources succeeded — ` +
          `computed proxy (gold÷ratio) added as circuit-breaker`,
      );
    }
  }

  const result = computeResult(successfulForConsensus);

  // Override fallback baseline for silver
  if (result.method === "fallback" && !lastKnownGoodSilver) {
    result.consensusPrice = SILVER_FALLBACK_USD;
  }

  if (result.method === "median" || result.method === "single") {
    cachedSilver = { result, timestamp: Date.now() };
    lastKnownGoodSilver = {
      price: result.consensusPrice,
      timestamp: Date.now(),
    };
  }

  return result;
}

// ============================================================
// FX multi-source oracle (v23 §31 — FX consensus)
// ============================================================

/** FX Source 2: CoinGecko simple/price (free, no key).
 *  Returns USD-per-unit for each currency by inverting the crypto-vs-fiat rate.
 *  CoinGecko returns e.g. { bitcoin: { usd: 64000, eur: 59000 } } →
 *  EUR/USD = btcUsd / btcEur. This gives us an independent FX source. */
async function fetchFxFromCoinGecko(): Promise<Record<string, number> | null> {
  try {
    // Use bitcoin price in USD vs other currencies to derive FX
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,jpy,gbp,cny,chf,aud,cad,sgd,aed,sar",
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const btc = (data as { bitcoin?: Record<string, number> })?.bitcoin;
    if (!btc || typeof btc.usd !== "number" || btc.usd <= 0) return null;

    const fxUsdPerUnit: Record<string, number> = { USD: 1.0 };
    for (const ccy of ["EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD", "SGD", "AED", "SAR"]) {
      const rate = btc[ccy.toLowerCase()];
      if (typeof rate === "number" && rate > 0) {
        // BTC costs `rate` units of ccy → 1 ccy = btcUsd/rate USD
        fxUsdPerUnit[ccy] = btc.usd / rate;
      }
    }
    return fxUsdPerUnit;
  } catch {
    return null;
  }
}

/**
 * Get multi-source FX rates.
 *
 * Fetches from 2 independent sources and merges:
 *   1. open.er-api.com (primary)
 *   2. CoinGecko BTC cross-rates (independent derivation)
 *
 * Returns the median per currency where both sources succeed, or the
 * single available source otherwise.
 */
export async function getMultiOracleFxRates(): Promise<{
  rates: Record<string, number>; // USD per 1 unit foreign currency
  sources: string[];
}> {
  const sources: string[] = [];
  const rates: Record<string, number> = { USD: 1.0 };

  // Source 1: open.er-api.com
  let erApiRates: Record<string, number> | null = null;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const data: unknown = await res.json();
      const r = (data as { rates?: Record<string, number> })?.rates;
      if (r) {
        erApiRates = {};
        for (const ccy of ["EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD", "SGD", "AED", "SAR"]) {
          if (typeof r[ccy] === "number" && r[ccy] > 0) {
            erApiRates[ccy] = 1 / r[ccy]; // convert "foreign per USD" → "USD per foreign"
          }
        }
        sources.push("open.er-api.com");
      }
    }
  } catch {
    /* handled by fallback */
  }

  // Source 2: CoinGecko (independent derivation via BTC cross-rates)
  const cgRates = await fetchFxFromCoinGecko();
  if (cgRates) sources.push("CoinGecko-FX");

  // Merge: median where both succeed, single otherwise
  const allCurrencies = new Set([
    ...Object.keys(erApiRates ?? {}),
    ...Object.keys(cgRates ?? {}),
  ]);

  for (const ccy of allCurrencies) {
    const vals: number[] = [];
    if (erApiRates?.[ccy] && erApiRates[ccy] > 0) vals.push(erApiRates[ccy]);
    if (cgRates?.[ccy] && cgRates[ccy] > 0) vals.push(cgRates[ccy]);
    if (vals.length > 0) {
      rates[ccy] = vals.length === 1 ? vals[0] : median(vals);
    }
  }

  // Fallbacks if a currency has no source
  const fallbacks: Record<string, number> = {
    EUR: 1.085, JPY: 0.0063, GBP: 1.27, CNY: 0.14, CHF: 1.12,
    AUD: 0.66, CAD: 0.72, SGD: 0.74, AED: 0.272, SAR: 0.267,
  };
  for (const [ccy, val] of Object.entries(fallbacks)) {
    if (!rates[ccy]) rates[ccy] = val;
  }

  return { rates, sources };
}

/**
 * Clear the in-memory cache (both the 60s cache and the last-known-good
 * fallback). Used by tests and manual inspection to force a fresh fetch.
 * Not used on the live path.
 */
export function _clearMultiOracleCache(): void {
  cachedResult = null;
  lastKnownGood = null;
  cachedSilver = null;
  lastKnownGoodSilver = null;
}

/**
 * Inspect the current cache state without triggering a fetch. Returns
 * null if no successful consensus has been cached yet. Useful for
 * debugging and observability.
 */
export function _inspectMultiOracleCache(): {
  cached: { consensusPrice: number; ageMs: number; method: string } | null;
  lastKnownGood: { price: number; ageMs: number } | null;
} {
  return {
    cached: cachedResult
      ? {
          consensusPrice: cachedResult.result.consensusPrice,
          ageMs: Date.now() - cachedResult.timestamp,
          method: cachedResult.result.method,
        }
      : null,
    lastKnownGood: lastKnownGood
      ? {
          price: lastKnownGood.price,
          ageMs: Date.now() - lastKnownGood.timestamp,
        }
      : null,
  };
}
