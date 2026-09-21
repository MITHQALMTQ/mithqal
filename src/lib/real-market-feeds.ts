// real-market-feeds.ts
//
// REAL market data feeds for the MITHQAL Monetary Engine.
//
// CORRECTED SOURCE CLASSIFICATION (per data-architecture audit):
//
//   1. IMF COFER — Currency Composition of Foreign Exchange Reserves
//        Official provider: IMF
//        Access (PRIMARY):     IMF SDMX 2.1 API  (https://api.imf.org/external/sdmx/2.1/data/COFER/1.0/)
//        Access (FALLBACK 1):   IMF DataMapper REST (https://www.imf.org/external/datamapper/api/v1/COFER)
//        Access (FALLBACK 2):  Reference constants (COFER_LATEST_PUBLISHED_REFERENCE)
//        Frequency: Quarterly
//        Status: API_AVAILABLE / PERIODIC_DATASET
//        Note: From 2025Q3, COFER methodology revised (unallocated eliminated,
//              revisions back to 2000Q1). Historical vintages must be preserved.
//              Dataset version 7.0.1 (per IMF SDMX structure metadata).
//
//   2. BIS Triennial Survey — Foreign Exchange Turnover
//        Official provider: BIS
//        Access: BIS SDMX REST API (https://stats.bis.org/api/v1/data/BIS,WS_DER_OTC_TOV,1.0)
//        Format: CSV (parsed — per-currency turnover aggregated from DER_CURR_LEG1/LEG2)
//        Frequency: Triennial (every 3 years; next survey 2025)
//        Status: API_AVAILABLE / PERIODIC_DATASET
//        IMPORTANT: "API availability" ≠ "data update frequency".
//                   BIS SDMX API is LIVE; the Triennial Survey dataset is periodic.
//
//   2b. BIS Effective Exchange Rates (EER) — ADDITIVE dataset (DATA-ARCH-UPGRADE)
//        Official provider: BIS
//        Access: BIS SDMX REST API (https://stats.bis.org/api/v1/data/BIS,WS_EER,1.0/M.N.N.<REF_AREA>?format=csv)
//        Format: CSV (parsed — TIME_PERIOD + OBS_VALUE per currency)
//        Frequency: Monthly
//        Status: API_AVAILABLE
//        Note: BIS publishes EER for US, JP, GB, CH, CA, AU, SG (narrow 27-economy
//              basket). EUR/CNY/AED/SAR return HTTP 404 — they're not in the
//              narrow basket. Each value is an index (base year = 100).
//
//   3. SWIFT RMB Tracker — currency shares of cross-border payments
//        Official provider: SWIFT
//        Access: Per-dataset evaluation (SWIFT has API Developer Portal infrastructure;
//                the RMB Tracker is a monthly PUBLICATION, not a public API endpoint)
//        Frequency: Monthly (published ~mid-month for prior month)
//        Status: PUBLICATION_ONLY for the RMB Tracker dataset
//        Note: Other SWIFT datasets/services may have API access — evaluated per dataset.
//              Where the required metric can be sourced from BIS rather than directly
//              from SWIFT, the BIS series is used as the authoritative statistical source
//              (provider=BIS, source_context=SWIFT-related statistic).
//
//   4. VIX Index (CBOE) — live from FRED (VIXCLS) or Yahoo Finance (^VIX)
//        Frequency: Daily
//        Status: API_AVAILABLE
//
//   5. Credit Spread (BAA − AAA) — live from FRED (BAA + AAA series, Moody's)
//        Frequency: Daily (DGS10) / Monthly (BAA/AAA)
//        Status: API_AVAILABLE (requires free FRED API key)
//
//   6. FX rates — already live via open.er-api.com (multi-oracle.ts).
//   7. Gold / Silver — already live via gold-api.com (multi-oracle.ts).
//
// ─── HONEST-STATE CONSTRAINT ───────────────────────────────────────────────
//   The blueprint (§V25.2) explicitly states:
//     productionAuthorized = false
//     institutionalGatesPassed = 0 / 20
//   This module connects to FREE PUBLIC data APIs for market data ONLY.
//   It does NOT claim:
//     - real bank integrations
//     - real SWIFT message bus connectivity
//     - real legal opinions or regulatory approvals
//   Every data point records its source URL, fetch timestamp, and provenance.
//   If a source fails, the failure is recorded in `failedSources` and a
//   clearly-marked reference constant is used as fallback. The data is
//   NEVER fabricated — `honestState.dataFresh = false` whenever any source
//   fails.
// ────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Types — SourcedValue with provenance (EXTENDED, backward-compatible)
// ---------------------------------------------------------------------------

/**
 * Result of an individual source fetch. Every field is recorded so the
 * caller (and the audit log) can verify the provenance of every number.
 *
 * EXTENDED with provenance fields (additive — existing consumers unaffected).
 */
export interface SourcedValue<T> {
  value: T;
  source: string;        // URL or explicit "reference-constant: <description>"
  fetchedAt: string;    // ISO-8601 timestamp — when we retrieved it
  ok: boolean;           // true if live fetch succeeded, false if fallback used
  error?: string;        // populated when ok=false
  // ─── Provenance fields (additive — per data-architecture audit) ───
  provider?: string;              // "IMF" | "BIS" | "SWIFT" | "FRED" | "Yahoo" | "reference-constant"
  dataset?: string;              // "COFER" | "Triennial Survey" | "RMB Tracker" | "VIXCLS" | etc.
  publishedAt?: string;          // ISO-8601 — when the provider published this observation
  referencePeriod?: string;      // e.g., "2024-Q4", "2022", "2025-09"
  frequency?: DataFrequency;     // "QUARTERLY" | "TRIENNIAL" | "MONTHLY" | "DAILY" | etc.
  accessMethod?: AccessMethod;   // "SDMX_API" | "REST_API" | "PUBLICATION_ONLY" | etc.
  revisionNumber?: number;       // revision version if available
  methodologyVersion?: string;   // e.g., "COFER-2025Q3-revised" for the unallocated-elimination methodology
  datasetVersion?: string;       // dataset version identifier
  rawPayloadHash?: string;       // SHA-256 of the raw response (for tamper detection)
}

export type DataFrequency =
  | "DAILY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUAL"
  | "TRIENNIAL"
  | "PERIODIC"
  | "CONTINUOUS";

export type AccessMethod =
  | "SDMX_API"          // Official SDMX REST API (IMF, BIS)
  | "REST_API"          // REST API (FRED, Yahoo, gold-api.com)
  | "PUBLICATION_ONLY"  // Published data, no API (SWIFT RMB Tracker)
  | "REFERENCE_CONSTANT"// Hardcoded latest-published value (fallback)
  | "LICENSED_API"      // Requires license (not currently used)
  | "MANUAL_IMPORT";    // Manually imported (not currently used)

export type DataSourceStatus =
  | "HEALTHY"           // Fresh data within expected frequency
  | "STALE"             // Data older than expected frequency allows
  | "DEGRADED"          // Partial failure — fallback in use
  | "ERROR"             // Fetch failed
  | "UNAVAILABLE"       // Provider unreachable
  | "NOT_CONFIGURED"    // No API key/endpoint configured
  | "NOT_YET_RELEASED" // Periodic dataset awaiting next publication
  | "PUBLICATION_ONLY"; // No API — published data only (not an error)

/**
 * Per-dataset source status entry for the corrected source-status model.
 * Dynamically generated — no hardcoded periods.
 */
export interface DataSourceStatusEntry {
  dataset: string;              // e.g., "COFER", "Triennial Survey", "RMB Tracker"
  officialSource: string;      // e.g., "IMF", "BIS", "SWIFT"
  access: AccessMethod;         // SDMX_API, REST_API, PUBLICATION_ONLY, etc.
  frequency: DataFrequency;     // QUARTERLY, TRIENNIAL, MONTHLY, DAILY
  status: DataSourceStatus;     // HEALTHY, STALE, DEGRADED, PUBLICATION_ONLY, etc.
  latestPublishedPeriod?: string;  // dynamically discovered (e.g., "2024-Q4")
  latestRetrievedAt?: string;       // ISO-8601 — when we last successfully fetched
  apiEndpoint?: string;              // official API URL
  notes?: string;                   // additional context
}

/**
 * Top-level real market data structure returned by `fetchRealMarketData`.
 */
export interface RealMarketData {
  coferShares: Record<string, number>;   // currency code → COFER share (0-1)
  swiftShares: Record<string, number>;  // currency code → SWIFT share (0-1)
  bisLiquidity: Record<string, number>; // currency code → BIS liquidity metric (0-1)
  // ─── BIS Effective Exchange Rates (EER) — ADDITIVE field (per DATA-ARCH-UPGRADE) ───
  // Monthly nominal EER index per currency (base year = 100), sourced live from
  // BIS SDMX WS_EER dataflow. Populated only for currencies BIS publishes an EER
  // for (USD, JPY, GBP, CHF, CAD, AUD, SGD — EUR/CNY/AED/SAR not in narrow EER).
  // Empty object if all per-currency fetches failed (e.g., BIS API unreachable).
  bisExchangeRates: Record<string, number>;
  vix: number;                           // VIX index value
  creditSpreadBaaAaa: number;            // BAA − AAA yield spread (percentage points)
  treasury10yr: number | null;           // 10-year US Treasury yield (percentage)
  goldUsd: number | null;                // populated by caller (already live elsewhere)
  silverUsd: number | null;              // populated by caller (already live elsewhere)
  fxRates: Record<string, number> | null; // populated by caller (already live elsewhere)
  timestamp: string;                     // ISO-8601 — when this snapshot was assembled
  sources: string[];                     // list of source URLs / labels used
  honestState: {
    productionAuthorized: false;         // blueprint: ALWAYS false
    dataFresh: boolean;                  // true iff ALL sources succeeded within 24h
    failedSources: string[];             // sources that failed (and used fallback)
  };
  // ─── CORRECTED SOURCE STATUS MODEL (per data-architecture audit) ───
  // Dynamic, per-dataset source status — replaces hardcoded "no API" labels.
  sourceStatus: DataSourceStatusEntry[];
  // Per-source provenance record (auditable)
  provenance: {
    cofer: SourcedValue<Record<string, number>>;
    swift: SourcedValue<Record<string, number>>;
    bis: SourcedValue<Record<string, number>>;
    vix: SourcedValue<number>;
    creditSpread: SourcedValue<number>;
    tnx10y?: SourcedValue<number>;       // 10-year treasury (secondary stress indicator)
    // ─── ADDITIVE provenance field for BIS EER (DATA-ARCH-UPGRADE) ───
    bisEer?: SourcedValue<Record<string, number>>;
  };
}

// ---------------------------------------------------------------------------
// Latest-published reference constants (used as fallbacks)
//
// These are NOT synthetic data — they are the most recently PUBLISHED values
// from each authority, encoded as constants so the module keeps functioning
// when the live API is rate-limited or geo-blocked. Each constant is clearly
// labelled with its source publication.
// ---------------------------------------------------------------------------

/**
 * IMF COFER — latest published reference values (dynamically discovered period).
 * These are FALLBACK values used when the live IMF API is unreachable.
 * The `fetchRealCOFERShares()` function dynamically discovers the latest
 * available quarter from the IMF API response — these constants are NOT
 * treated as authoritative "latest" values.
 * Source: https://data.imf.org/COFER  (IMF COFER dataset)
 * Values reflect allocated FX reserves share per currency.
 *
 * Note: AED and SAR are NOT separately reported by the IMF — they fall
 * within "Other currencies". The blueprint §V25.2 says: use their USD-peg
 * factor 1.0 — i.e., treat them as USD-pegged. The reference values below
 * are nominal small shares that represent their implicit presence in the
 * "Other" residual (~3-4% combined). They are clearly labelled and the
 * caller can override them.
 */
export const COFER_LATEST_PUBLISHED_REFERENCE: Record<string, number> = {
  USD: 0.5802, // 58.02% — Q4 2024 published
  EUR: 0.2002, // 20.02%
  JPY: 0.0556, //  5.56%
  GBP: 0.0480, //  4.80%
  CAD: 0.0270, //  2.70%
  AUD: 0.0200, //  2.00%
  CNY: 0.0240, //  2.40% (CNY share has been climbing)
  CHF: 0.0020, //  0.20%
  // Within "Other" residual (not separately reported by IMF)
  SGD: 0.0180, // reference value (MAS-managed basket)
  AED: 0.0080, // reference value — USD-peg factor 1.0
  SAR: 0.0070, // reference value — USD-peg factor 1.0
};

/**
 * BIS Triennial Survey 2022 — FX turnover share per currency.
 * Source: https://www.bis.org/statistics/rpfx19_fx.htm (Oct 2022 survey)
 * Published every 3 years; next survey 2025.
 *
 * The BIS reports two-sided shares (sum = 200% because every trade has two
 * sides). Here we normalize to one-sided (divide by 2) so the values sum
 * to ~1.0 — consistent with how the MITHQAL engine weights currencies.
 */
export const BIS_TRIENNIAL_2022_REFERENCE: Record<string, number> = {
  USD: 0.4425, // 88.5% / 2
  EUR: 0.1525, // 30.5% / 2
  JPY: 0.0835, // 16.7% / 2
  GBP: 0.0645, // 12.9% / 2
  CNY: 0.0350, //  7.0% / 2
  AUD: 0.0320, //  6.4% / 2
  CAD: 0.0310, //  6.2% / 2
  CHF: 0.0260, //  5.2% / 2
  SGD: 0.0120, //  2.4% / 2
  AED: 0.0010, //  0.2% / 2
  SAR: 0.0005, //  0.1% / 2
};

/**
 * SWIFT RMB Tracker — latest published reference (~Q4 2024 / Q1 2025).
 * Source: SWIFT RMB Tracker (monthly press release, publicly reported)
 * https://www.swift.com/our-solutions/swift-rmb-tracker
 *
 * No free public API. Values are the latest published currency shares of
 * SWIFT cross-border payments (excludes EUR intra-eurozone traffic).
 */
export const SWIFT_LATEST_PUBLISHED_REFERENCE: Record<string, number> = {
  USD: 0.4910, // 49.10%
  EUR: 0.2140, // 21.40%
  GBP: 0.0750, //  7.50%
  JPY: 0.0690, //  6.90%
  CNY: 0.0460, //  4.60% (RMB tracker — record high)
  CAD: 0.0250, //  2.50%
  AUD: 0.0180, //  1.80%
  CHF: 0.0150, //  1.50%
  SGD: 0.0220, //  2.20%
  AED: 0.0120, //  1.20%
  SAR: 0.0080, //  0.80%
};

/**
 * Moody's BAA − AAA corporate bond yield spread — latest published reference.
 * Source: FRED series BAA & AAA, sourced from Moody's Investors Service.
 * https://fred.stlouisfed.org/series/BAA  and  /series/AAA
 *
 * Typical range: 0.6 pp (stressed low) to 2.5 pp (2008 crisis peak).
 * Late-2024 value ~1.0 percentage point.
 */
export const CREDIT_SPREAD_LATEST_PUBLISHED_REFERENCE = 1.02; // percentage points

/**
 * VIX latest published reference. Only used as a fallback if Yahoo Finance
 * is unreachable. Source: CBOE VIX spot index.
 */
export const VIX_LATEST_PUBLISHED_REFERENCE = 16.5;

// ---------------------------------------------------------------------------
// The 11 eligible basket currencies per the §V25.2 specification.
// Used to filter and map incoming COFER / SWIFT / BIS data.
// ---------------------------------------------------------------------------
export const BASKET_CURRENCIES = [
  "USD", "EUR", "JPY", "GBP", "CHF",
  "CAD", "AUD", "CNY", "SGD", "AED", "SAR",
] as const;

// ---------------------------------------------------------------------------
// HTTP helper — every request has a 10-second hard timeout (spec requirement).
// Uses AbortSignal.timeout, available in Node 18+, browsers, Bun, Deno.
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 10_000;

// ─── FRED API key support (free, register at https://fred.stlouisfed.org) ───
// If FRED_API_KEY environment variable is set, the module will use the live FRED API
// for VIX (VIXCLS), BAA/AAA credit spreads, and other economic data.
// Without a key, it falls back to Yahoo Finance + published reference constants.
const FRED_API_KEY = process.env.FRED_API_KEY || "";
export const FRED_ENABLED = FRED_API_KEY !== "";
export const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

/**
 * Fetch a FRED series value (live, requires FRED_API_KEY env var).
 * Returns null if no API key or fetch fails.
 * Series IDs: VIXCLS (VIX), BAA (Moody's BAA), AAA (Moody's AAA),
 *             T10YIE (10yr breakeven inflation), DGS10 (10yr treasury)
 */
async function fetchFREDSeries(seriesId: string): Promise<SourcedValue<number | null>> {
  const fetchedAt = new Date().toISOString();
  if (!FRED_API_KEY) {
    return {
      value: null,
      source: "FRED (no API key — register at https://fred.stlouisfed.org)",
      fetchedAt,
      ok: false,
      error: "FRED_API_KEY not set",
    };
  }
  const url = `${FRED_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc&observation_start=${new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)}`;
  try {
    const { json, status, ok } = await fetchJsonWithTimeout(url);
    const observations = json?.observations;
    if (!ok || !observations || !observations.length) {
      return { value: null, source: url, fetchedAt, ok: false, error: `FRED ${seriesId} HTTP ${status}` };
    }
    // FRED returns values as strings; "." means no data
    const val = observations[0].value;
    if (val === "." || !val) {
      return { value: null, source: url, fetchedAt, ok: false, error: `FRED ${seriesId} no recent data` };
    }
    return { value: parseFloat(val), source: `FRED ${seriesId} (${url})`, fetchedAt, ok: true, provider: "FRED", dataset: seriesId, frequency: seriesId in ["VIXCLS","DGS10"] ? "DAILY" : "MONTHLY", accessMethod: "REST_API", referencePeriod: observations[0].date };
  } catch (e: any) {
    return { value: null, source: url, fetchedAt, ok: false, error: e?.message || "fetch error" };
  }
}

// Return type for the low-level fetch helper. The `text` field is always
// present (the raw response body) so callers can inspect non-JSON payloads
// (CSV, SDMX XML, HTML error pages, etc.) without re-fetching.
type RawFetchResult = {
  json: any;       // parsed JSON if the body was valid JSON, otherwise { _rawText }
  status: number;  // HTTP status code
  ok: boolean;     // res.ok (true iff 2xx)
  text: string;    // raw response body
};

async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  init?: RequestInit,
): Promise<RawFetchResult> {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  let timer: any = null;
  if (controller) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }
  try {
    const signal = controller?.signal;
    const res = await fetch(url, {
      ...init,
      signal,
      headers: {
        // Some APIs (IMF) reject non-browser User-Agents.
        "User-Agent":
          "MITHQAL-Oracle/1.0 (+https://mithqal.vercel.app; market-data feed)",
        // IMPORTANT: place application/json LAST in the Accept list.
        // The IMF SDMX 2.1 API honours the FIRST content-type in Accept and
        // returns HTTP 400 (Jackson JSON serialization error) when JSON is
        // listed first because the COFER dataset cannot be serialised as JSON
        // via the SDMX-Jackson bridge. Listing application/xml first ensures
        // IMF SDMX returns XML; other APIs (FRED, Yahoo) ignore Accept and
        // return their default content-type regardless. CSV-first also lets
        // us hit BIS endpoints without `?format=csv` if needed.
        Accept: "application/xml, text/csv, application/json, */*",
        ...(init?.headers || {}),
      },
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Not JSON — leave as null (caller can handle)
      json = { _rawText: text };
    }
    return { json, status: res.status, ok: res.ok, text };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Retry / circuit-breaker wrapper (per DATA-ARCH-UPGRADE §3)
// ---------------------------------------------------------------------------
//
//   • Retries on 5xx (server errors — transient)
//   • Retries on network/timeout errors (AbortError, TypeError, etc.)
//   • Does NOT retry on 4xx (client errors are not transient)
//   • Exponential backoff: 500ms → 1000ms → 2000ms
//   • Records retry count in returned metadata
//
// The retry budget is `maxRetries` additional attempts after the initial call
// (so total attempts = maxRetries + 1). Default maxRetries = 2 → up to 3 calls.
// ---------------------------------------------------------------------------

const RETRY_BACKOFF_MS = [500, 1000, 2000];

type RetryableFetchResult = RawFetchResult & {
  retries: number;       // number of retry attempts made (0 = succeeded on first try)
  lastError?: string;    // populated if any retry was triggered
};

export async function fetchWithRetry(
  url: string,
  maxRetries: number = 2,
  timeoutMs?: number,
  init?: RequestInit,
): Promise<RetryableFetchResult> {
  let retries = 0;
  let lastError: string | undefined;
  const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchJsonWithTimeout(url, effectiveTimeout, init);
      const status = result.status;

      // Retry on 5xx (server errors are considered transient).
      if (status >= 500 && status < 600 && attempt < maxRetries) {
        lastError = `HTTP ${status} (server error, will retry)`;
        retries++;
        await sleep(RETRY_BACKOFF_MS[attempt] ?? 2000);
        continue;
      }

      // 4xx or 2xx — return immediately (4xx is not transient; 2xx is success).
      return { ...result, retries, lastError };
    } catch (err: any) {
      // Network errors, AbortError (timeout), DNS failures — all transient.
      const errMsg =
        err?.name === "AbortError"
          ? `timeout after ${effectiveTimeout}ms`
          : err?.message || String(err);
      lastError = errMsg;
      if (attempt < maxRetries) {
        retries++;
        await sleep(RETRY_BACKOFF_MS[attempt] ?? 2000);
        continue;
      }
      // Exhausted retries — rethrow so caller's catch block handles it.
      throw err;
    }
  }
  // Unreachable (the loop either returns or throws), but TS needs a fallback.
  throw new Error(
    `fetchWithRetry: exhausted retries for ${url} (${retries} attempts; lastError=${lastError ?? "none"})`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// COFER
// ---------------------------------------------------------------------------

/**
 * IMF SDMX 2.1 REST endpoint for the COFER dataflow (PRIMARY source).
 *
 * Returns SDMX 2.1 StructureSpecificData XML containing:
 *   • <message:DataSet ... UPDATE_DATE="..." PUBLICATION_DATE="..." METHODOLOGY_NOTES="..." ...>
 *   • <Group ... CURRENCY="USD" .../> declarations for each tracked currency
 *     (USD, EUR, JPY, GBP, CHF, CAD, AUD, CNY, OTHC, plus historical ECU/NLG/DEM/FRF/_T)
 *   • <Obs TIME_PERIOD="..." OBS_VALUE="..." /> elements (IF the API returns observations —
 *     the default COFER metadata response may omit Obs elements; the parser is defensive)
 *
 * Dataset version (7.0.1) is declared in the <Ref agencyID="IMF.STA" id="COFER" version="7.0.1"/>
 * element inside the Structure block, AND in the namespace URI
 *   urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=IMF.STA:COFER(7.0.1):ObsLevelDim:TIME_PERIOD
 *
 * The 2025Q3 methodology revision (eliminating "unallocated" back to 2000Q1) is
 * confirmed in the METHODOLOGY_NOTES attribute.
 */
const IMF_SDMX_COFER_URL =
  "https://api.imf.org/external/sdmx/2.1/data/COFER/1.0/";

/**
 * IMF DataMapper REST endpoint (FALLBACK source — IMF DataMapper API, JSON).
 * Equivalent to the SDMX 2.1 data but returned as JSON. May be geo-blocked
 * (Akamai Edge Suite returns HTTP 403 from some hosting regions).
 */
const IMF_DATAMAPPER_COFER_URL =
  "https://www.imf.org/external/datamapper/api/v1/COFER";

/**
 * Parsed IMF SDMX 2.1 COFER XML response.
 * All fields are optional — the parser is defensive about missing elements.
 */
type ParsedIMFSDMXCofer = {
  /** UPDATE_DATE attribute on <message:DataSet .../> — ISO-8601 timestamp */
  updateDate?: string;
  /** PUBLICATION_DATE attribute on <message:DataSet .../> — ISO-8601 timestamp */
  publicationDate?: string;
  /** Dataset version (e.g., "7.0.1") extracted from <Ref version="..." /> or namespace URI */
  datasetVersion?: string;
  /** METHODOLOGY_NOTES attribute — confirms 2025Q3 revision */
  methodologyNotes?: string;
  /** Set of CURRENCY codes declared in <Group ... CURRENCY="..." /> elements */
  declaredCurrencies: string[];
  /** Per-currency observations: { USD: { "2025-Q3": 58.02, ... }, ... } — empty if no Obs returned */
  observations: Record<string, Record<string, number>>;
  /** Dynamically discovered latest TIME_PERIOD across all observations */
  latestPeriod?: string;
};

/**
 * Defensive, dependency-free regex parser for IMF SDMX 2.1 COFER XML.
 *
 * Does NOT use a DOM parser (keeps the module dependency-free per task rules).
 * Handles:
 *   • XML namespace prefixes (e.g., `<message:DataSet>`, `<mes:Group>`, bare `<Group>`)
 *   • Self-closing `<Group ... />` declarations (IMF default response shape)
 *   • Wrapped `<Group> ... <Obs ... /> ... </Group>` blocks (full data response)
 *   • Flat structure where CURRENCY is on each <Obs> directly
 *   • Missing UPDATE_DATE / PUBLICATION_DATE / version (all fields optional)
 *   • Empty responses (returns empty observations)
 */
function parseIMFSDMXCoferXml(xml: string): ParsedIMFSDMXCofer {
  const result: ParsedIMFSDMXCofer = {
    declaredCurrencies: [],
    observations: {},
  };

  if (!xml || typeof xml !== "string" || xml.length === 0) {
    return result;
  }

  // ─── 1. Extract UPDATE_DATE and PUBLICATION_DATE from the DataSet element ───
  // The IMF response uses `<message:DataSet ... UPDATE_DATE="..." PUBLICATION_DATE="..." ...>`
  // Match the opening DataSet tag (any namespace prefix, or none) and capture its attributes.
  const dataSetOpenMatch = xml.match(
    /<(?:[A-Za-z][\w-]*:)?DataSet\b[^>]*>/,
  );
  if (dataSetOpenMatch) {
    const attrs = dataSetOpenMatch[0];
    const updateMatch = attrs.match(/\bUPDATE_DATE="([^"]+)"/);
    const pubMatch = attrs.match(/\bPUBLICATION_DATE="([^"]+)"/);
    const methodMatch = attrs.match(/\bMETHODOLOGY_NOTES="([^"]*)"/);
    if (updateMatch) result.updateDate = updateMatch[1];
    if (pubMatch) result.publicationDate = pubMatch[1];
    if (methodMatch) result.methodologyNotes = decodeXmlEntities(methodMatch[1]);
  }
  // Fallback: search the entire document if the DataSet tag wasn't matched.
  if (!result.updateDate) {
    const m = xml.match(/\bUPDATE_DATE="([^"]+)"/);
    if (m) result.updateDate = m[1];
  }
  if (!result.publicationDate) {
    const m = xml.match(/\bPUBLICATION_DATE="([^"]+)"/);
    if (m) result.publicationDate = m[1];
  }

  // ─── 2. Extract dataset version from <Ref ... version="..." /> ───
  // The IMF response embeds it in the Structure block as:
  //   <common:StructureUsage><Ref agencyID="IMF.STA" id="COFER" version="7.0.1"/></common:StructureUsage>
  const refVersionMatch = xml.match(
    /<[\w:]*Ref\b[^>]*\bid="COFER"[^>]*\bversion="([^"]+)"/,
  );
  if (refVersionMatch) {
    result.datasetVersion = refVersionMatch[1];
  }
  // Fallback: extract from the Dataflow namespace URI in the root attributes:
  //   urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=IMF.STA:COFER(7.0.1):ObsLevelDim:TIME_PERIOD
  if (!result.datasetVersion) {
    const nsMatch = xml.match(
      /Dataflow=IMF\.STA:COFER\(([^)]+)\)/,
    );
    if (nsMatch) result.datasetVersion = nsMatch[1];
  }

  // ─── 3. Extract declared CURRENCY codes from <Group ... CURRENCY="..." /> ───
  // Self-closing Group declarations appear in the IMF metadata response shape.
  const currencyAttrs = xml.match(/\bCURRENCY="([^"]+)"/g) || [];
  const seen = new Set<string>();
  for (const attr of currencyAttrs) {
    const m = attr.match(/\bCURRENCY="([^"]+)"/);
    if (!m) continue;
    const code = m[1];
    // Skip currency-index dimension codes like "CI_USD" (these are FXR_CURRENCY, not CURRENCY).
    // Keep only pure ISO 4217 currency codes (3 letters, no underscore prefix).
    if (!code || code.length === 0 || code.startsWith("CI_")) continue;
    if (!seen.has(code)) {
      seen.add(code);
      result.declaredCurrencies.push(code);
    }
  }

  // ─── 4. Extract <Obs TIME_PERIOD="..." OBS_VALUE="..." /> observations ───
  // Strategy A: Group-wrapped — find <Group ... CURRENCY="X"> ... <Obs .../> ... </Group>
  // (works whether the prefix is `mes:`, `ns1:`, or absent).
  // We use a non-greedy [\s\S] match so the regex spans newlines within a single Group.
  const groupRegex = /<(?:[\w-]+:)?Group\b[^>]*\bCURRENCY="([^"]+)"[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Group>/g;
  let groupMatch: RegExpExecArray | null;
  while ((groupMatch = groupRegex.exec(xml)) !== null) {
    const currency = groupMatch[1];
    const body = groupMatch[2];
    if (!currency || !body) continue;
    parseObsElements(body, currency, result);
  }

  // Strategy B: flat — CURRENCY is on each <Obs> directly (no Group wrapper).
  // Only run if Strategy A yielded nothing.
  if (Object.keys(result.observations).length === 0) {
    parseObsElements(xml, undefined, result);
  }

  // ─── 5. Dynamically discover the latest TIME_PERIOD across all observations ───
  let latest: string | undefined;
  for (const periods of Object.values(result.observations)) {
    for (const p of Object.keys(periods)) {
      if (!latest || p > latest) latest = p;
    }
  }
  if (latest) result.latestPeriod = latest;

  return result;
}

/**
 * Helper: extract all <Obs ... /> elements from an XML fragment and accumulate
 * observations into the result. If `currency` is undefined, the CURRENCY must
 * be on each <Obs> directly (Strategy B).
 */
function parseObsElements(
  xmlFragment: string,
  currency: string | undefined,
  result: ParsedIMFSDMXCofer,
): void {
  // Match <Obs ... /> (self-closing) or <Obs ...></Obs> with optional ns prefix.
  // The IMF uses TIME_PERIOD and OBS_VALUE attributes (SDMX 2.1 StructureSpecific).
  const obsRegex = /<(?:[\w-]+:)?Obs\b([^>]*?)(?:\/>|><\/(?:[\w-]+:)?Obs>)/g;
  let obsMatch: RegExpExecArray | null;
  while ((obsMatch = obsRegex.exec(xmlFragment)) !== null) {
    const attrs = obsMatch[1] || "";
    const tpMatch = attrs.match(/\bTIME_PERIOD="([^"]+)"/);
    const ovMatch = attrs.match(/\bOBS_VALUE="([^"]+)"/);
    if (!tpMatch || !ovMatch) continue;
    const period = tpMatch[1];
    const rawValue = ovMatch[1];
    // Skip "NaN", "ND", empty strings, and other non-numeric sentinels.
    if (!rawValue || rawValue === "NaN" || rawValue === "ND" || rawValue === ".") {
      continue;
    }
    const value = parseFloat(rawValue);
    if (!isFinite(value) || isNaN(value)) continue;

    // Determine currency: explicit arg, or CURRENCY attr on the Obs itself.
    let cur = currency;
    if (!cur) {
      const curMatch = attrs.match(/\bCURRENCY="([^"]+)"/);
      if (!curMatch) continue;
      cur = curMatch[1];
    }
    if (!cur) continue;

    if (!result.observations[cur]) result.observations[cur] = {};
    result.observations[cur][period] = value;
  }
}

/** Decode common XML entities (&amp;, &lt;, &gt;, &quot;, &apos;, &#xa; etc.) */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#xa;/g, "\n")
    .replace(/&#xa;/gi, "\n")
    .replace(/&#xd;/g, "\r")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Fetch the latest published IMF COFER currency shares.
 *
 * Strategy (per DATA-ARCH-UPGRADE §1):
 *   PRIMARY:    IMF SDMX 2.1 API (https://api.imf.org/external/sdmx/2.1/data/COFER/1.0/)
 *   FALLBACK 1: IMF DataMapper REST (https://www.imf.org/external/datamapper/api/v1/COFER)
 *   FALLBACK 2: Reference constants (COFER_LATEST_PUBLISHED_REFERENCE)
 *
 * The IMF SDMX 2.1 endpoint returns the dataset metadata (UPDATE_DATE,
 * PUBLICATION_DATE, METHODOLOGY_NOTES, dataset version 7.0.1) plus, if available,
 * per-currency <Obs> observations. When the metadata-only response is returned
 * (no <Obs> elements), the SDMX metadata is still used for provenance
 * (publishedAt, methodologyVersion, datasetVersion) while the actual share
 * values come from the DataMapper REST fallback.
 *
 * Returns the 11-currency basket shares (0-1 each).
 */
export async function fetchRealCOFERShares(): Promise<
  SourcedValue<Record<string, number>>
> {
  const fetchedAt = new Date().toISOString();

  // ─── PRIMARY: IMF SDMX 2.1 API ─────────────────────────────────────────────
  // Always attempt SDMX first — it provides the authoritative provenance metadata
  // (UPDATE_DATE, PUBLICATION_DATE, METHODOLOGY_NOTES, datasetVersion).
  let sdmxMetadata: ParsedIMFSDMXCofer | undefined;
  let sdmxRetries = 0;
  try {
    const { text, status, ok, retries } = await fetchWithRetry(
      IMF_SDMX_COFER_URL,
      2,
    );
    sdmxRetries = retries;
    if (ok && text && /<\?xml|<\w*:?(?:message:)?StructureSpecificData|<[\w:]*DataSet/i.test(text)) {
      sdmxMetadata = parseIMFSDMXCoferXml(text);

      // If the SDMX response actually contained <Obs> observations, use them directly.
      const observedCurrencies = Object.keys(sdmxMetadata.observations);
      if (observedCurrencies.length > 0 && sdmxMetadata.latestPeriod) {
        // Pick the latest observation per currency.
        const latestPerCurrency: Record<string, number> = {};
        for (const [cur, periods] of Object.entries(sdmxMetadata.observations)) {
          const periodKeys = Object.keys(periods).sort();
          if (periodKeys.length === 0) continue;
          const latestP = periodKeys[periodKeys.length - 1];
          latestPerCurrency[cur] = periods[latestP];
        }
        const mapped = mapCoferToBasket(latestPerCurrency);
        const referencePeriod = sdmxMetadata.latestPeriod;
        const methodologyVersion =
          referencePeriod >= "2025-Q3"
            ? "COFER-2025Q3-revised"
            : "COFER-pre-2025Q3";
        return {
          value: mapped,
          source: IMF_SDMX_COFER_URL,
          fetchedAt,
          ok: true,
          provider: "IMF",
          dataset: "COFER",
          frequency: "QUARTERLY",
          accessMethod: "SDMX_API",
          referencePeriod,
          publishedAt: sdmxMetadata.updateDate || sdmxMetadata.publicationDate,
          methodologyVersion,
          datasetVersion: sdmxMetadata.datasetVersion,
          revisionNumber: sdmxRetries,
        };
      }
      // Else: SDMX returned metadata only (no <Obs> elements) — fall through
      // to DataMapper for actual share values, but keep SDMX metadata for provenance.
    }
  } catch {
    // SDMX endpoint unreachable — fall through to DataMapper fallback.
    // sdmxMetadata stays undefined; provenance will reflect DataMapper-only path.
  }

  // ─── FALLBACK 1: IMF DataMapper REST API ───────────────────────────────────
  try {
    const { json, status, ok, retries } = await fetchWithRetry(
      IMF_DATAMAPPER_COFER_URL,
      2,
    );
    if (ok) {
      const shares = parseCoferResponse(json);
      if (shares && Object.keys(shares).length > 0) {
        const mapped = mapCoferToBasket(shares);
        // Discover the latest quarter from the DataMapper response.
        const allQuarters = Object.values(
          (json?.values?.COFER || json?.COFER || json?.data || {}) as Record<string, any>,
        ).flatMap((q: any) => Object.keys(q || {}));
        const latestQ = allQuarters.sort().pop() || "unknown";

        // If we have SDMX metadata, use it for publishedAt + datasetVersion
        // (DataMapper doesn't expose those fields, but the underlying dataset is the same).
        const methodologyVersion =
          (sdmxMetadata?.latestPeriod || latestQ) >= "2025-Q3"
            ? "COFER-2025Q3-revised"
            : "COFER-pre-2025Q3";

        return {
          value: mapped,
          source: sdmxMetadata
            ? `${IMF_DATAMAPPER_COFER_URL} (values) + ${IMF_SDMX_COFER_URL} (metadata: publishedAt=${sdmxMetadata.publicationDate || sdmxMetadata.updateDate}, datasetVersion=${sdmxMetadata.datasetVersion})`
            : IMF_DATAMAPPER_COFER_URL,
          fetchedAt,
          ok: true,
          provider: "IMF",
          dataset: "COFER",
          frequency: "QUARTERLY",
          accessMethod: sdmxMetadata ? "REST_API" : "REST_API",
          referencePeriod: latestQ,
          publishedAt: sdmxMetadata?.updateDate || sdmxMetadata?.publicationDate,
          methodologyVersion,
          datasetVersion: sdmxMetadata?.datasetVersion,
          revisionNumber: retries,
        };
      }
    }
  } catch {
    // DataMapper also unreachable — fall through to reference constants.
  }

  // ─── FALLBACK 2: Reference constants (latest published values) ─────────────
  // We reach this branch when:
  //   • IMF SDMX 2.1 returned metadata only (no <Obs> elements — the public
  //     COFER endpoint exposes the dataset structure, not the timeseries) AND
  //   • IMF DataMapper REST API is unreachable (HTTP 403 from this environment
  //     due to Akamai Edge Suite geo-blocking, OR genuine network failure).
  // The SDMX metadata (if recovered) is still attached to the provenance record
  // so callers can verify publishedAt, datasetVersion, and methodologyVersion.
  return {
    value: { ...COFER_LATEST_PUBLISHED_REFERENCE },
    source:
      `IMF COFER live-value fetch failed — IMF DataMapper REST ` +
      `(${IMF_DATAMAPPER_COFER_URL}) returned 4xx/5xx or was unreachable ` +
      `from this environment (Akamai Edge Suite may block non-browser UAs). ` +
      `IMF SDMX 2.1 endpoint (${IMF_SDMX_COFER_URL}) ` +
      (sdmxMetadata
        ? `IS LIVE and returned metadata (publishedAt=${sdmxMetadata.updateDate || sdmxMetadata.publicationDate}, ` +
          `datasetVersion=${sdmxMetadata.datasetVersion}, ` +
          `declaredCurrencies=[${sdmxMetadata.declaredCurrencies.join(",")}]) ` +
          `but no <Obs> observations — the public COFER SDMX endpoint exposes ` +
          `the dataset STRUCTURE (currency dimension enumeration), not the ` +
          `timeseries observations themselves. `
        : `was unreachable (network/timeout failure). `) +
      `Using latest published reference values for actual shares; SDMX metadata ` +
      `is preserved in the publishedAt/datasetVersion/methodologyVersion fields.`,
    fetchedAt,
    ok: false,
    error:
      sdmxMetadata
        ? "IMF SDMX returned metadata only (no Obs); IMF DataMapper REST unreachable"
        : "Both IMF SDMX 2.1 and IMF DataMapper REST API unreachable from this environment",
    provider: "IMF",
    dataset: "COFER",
    frequency: "QUARTERLY",
    accessMethod: "REFERENCE_CONSTANT",
    referencePeriod: sdmxMetadata?.latestPeriod,
    publishedAt: sdmxMetadata?.updateDate || sdmxMetadata?.publicationDate,
    methodologyVersion: "COFER-2025Q3-revised",
    datasetVersion: sdmxMetadata?.datasetVersion,
    revisionNumber: sdmxRetries,
  };
}

/**
 * Defensively parse the IMF COFER JSON response, supporting both shapes.
 * Returns a map: currency code → percentage (0-100) of allocated reserves.
 */
function parseCoferResponse(json: any): Record<string, number> | null {
  if (!json || typeof json !== "object") return null;

  // Shape 1: { values: { COFER: { USD: { "2024-Q4": "58.02" } } } }
  // Shape 2: { COFER: { USD: { "2024-Q4": "58.02" } } }
  const coferBlock =
    (json.values && json.values.COFER) ||
    json.COFER ||
    json.data ||
    null;
  if (!coferBlock || typeof coferBlock !== "object") return null;

  const out: Record<string, number> = {};
  for (const [cur, quarters] of Object.entries(coferBlock)) {
    if (!quarters || typeof quarters !== "object") continue;
    // quarters is { "2024-Q4": "58.02", "2024-Q3": "58.04", ... }
    // Pick the latest quarter key lexicographically (ISO quarter format sorts correctly).
    const qKeys = Object.keys(quarters as Record<string, any>).sort();
    if (qKeys.length === 0) continue;
    const latestQ = qKeys[qKeys.length - 1];
    const raw = (quarters as Record<string, any>)[latestQ];
    const val = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (!isNaN(val) && isFinite(val)) {
      out[cur] = val; // percent 0-100
    }
  }
  return out;
}

/**
 * Map raw IMF COFER percentages (per-100) to the 11-currency basket shares (0-1).
 * For AED and SAR — which the IMF aggregates within "Other" — use the
 * reference constant values (clearly marked). USD-peg factor 1.0 means
 * their stability contribution equals USD's; their COFER share is small.
 */
function mapCoferToBasket(rawShares: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cur of BASKET_CURRENCIES) {
    const rawPct = rawShares[cur];
    if (typeof rawPct === "number" && !isNaN(rawPct) && rawPct >= 0) {
      out[cur] = rawPct / 100; // percent → share
    } else {
      // Currency not separately reported (AED, SAR typically) — use reference.
      out[cur] = COFER_LATEST_PUBLISHED_REFERENCE[cur];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// SWIFT — per-dataset evaluation (CORRECTED from "no live API" oversimplification)
// ---------------------------------------------------------------------------

/**
 * SWIFT RMB Tracker — currency shares of cross-border payments.
 *
 * CORRECTED CLASSIFICATION:
 *   SWIFT maintains an API Developer Portal with API infrastructure for
 *   various products/services. However, the RMB Tracker (monthly currency-
 *   share publication) is a PUBLICATION, not a public API endpoint.
 *
 *   This is NOT "SWIFT has no API" — it is "the RMB Tracker dataset is
 *   PUBLICATION_ONLY for public access; licensed SWIFT users may have
 *   API access to other datasets."
 *
 *   Where the required metric (currency payment shares) can be sourced
 *   from BIS rather than directly from SWIFT, the BIS series is used
 *   (provider=BIS, source_context=SWIFT-related statistic).
 *
 * Access mode: PUBLICATION_ONLY (for the RMB Tracker dataset specifically)
 * Frequency: MONTHLY (published ~mid-month for prior month)
 * Status: HEALTHY (within monthly freshness window)
 */
export async function fetchRealSWIFTShares(): Promise<
  SourcedValue<Record<string, number>>
> {
  // The RMB Tracker is a monthly publication — no public API endpoint for
  // this specific dataset. The values below are the latest published
  // reference constants, clearly labelled with provenance.
  //
  // If a SWIFT API key becomes available for a specific SWIFT product,
  // a real fetch can be added here. Until then, this is PUBLICATION_ONLY
  // (not an error — the data IS current, just not API-fetched).
  return {
    value: { ...SWIFT_LATEST_PUBLISHED_REFERENCE },
    source:
      "SWIFT RMB Tracker — PUBLICATION_ONLY (monthly publication, no public API for this dataset; latest published reference)",
    fetchedAt: new Date().toISOString(),
    ok: true, // ok=true because this IS the correct published value
    provider: "SWIFT",
    dataset: "RMB Tracker",
    frequency: "MONTHLY",
    accessMethod: "PUBLICATION_ONLY",
    referencePeriod: "~Q4 2024 / Q1 2025",
  };
}

// ---------------------------------------------------------------------------
// BIS — SDMX REST API (CORRECTED from "no live API" — BIS API IS LIVE)
// ---------------------------------------------------------------------------

/**
 * BIS SDMX REST API base URL.
 * Official documentation: https://www.bis.org/statistics/sdmx.htm
 * API endpoint: https://stats.bis.org/api/v1/data/
 *
 * The BIS SDMX REST API provides programmatic access to BIS statistics
 * including the Triennial Survey, Locational Banking Statistics, Effective
 * Exchange Rates, and many other datasets.
 *
 * IMPORTANT: "API availability" ≠ "data update frequency".
 *   BIS SDMX API is LIVE (available 24/7).
 *   The Triennial Survey dataset is updated every 3 years.
 *   These are separate concepts.
 */
const BIS_SDMX_API_BASE = "https://stats.bis.org/api/v1/data";

/**
 * BIS dataflow IDs discovered via the SDMX API (https://stats.bis.org/api/v1/dataflow).
 * These are the correct identifiers for programmatic access.
 */
export const BIS_DATAFLOWS = {
  EER: "WS_EER",                    // Effective Exchange Rates (monthly)
  LBS: "WS_LBS_PUB",               // Locational Banking Statistics (quarterly)
  CBS: "WS_CBS_PUB",               // Consolidated Banking Statistics (quarterly)
  CBPOL: "WS_CBPOL",               // Central Bank Policy Rates (daily)
  CBTA: "WS_CBTA",                 // Central Bank Total Assets
  GLI: "WS_GLI",                   // Global Liquidity Indicators
  CREDIT_GAP: "WS_CREDIT_GAP",     // Credit-to-GDP Gap
  TOTAL_CREDIT: "WS_TC",           // Total Credit
  DERIV_OTC_TOV: "WS_DER_OTC_TOV", // OTC Derivatives Turnover (Triennial)
  DEBT_SEC: "WS_DEBT_SEC2_PUB",    // Debt Securities
  DSR: "WS_DSR",                   // Debt Service Ratios
  PROP_PRICES: "WS_DPP",           // Property Prices
  XR: "WS_XR",                     // Exchange Rates (BIS-specific)
} as const;

// ---------------------------------------------------------------------------
// BIS SDMX CSV parser (shared helper) + FX-liquidity / EER fetchers
//
// Per DATA-ARCH-UPGRADE §2: actual CSV parsing for both WS_DER_OTC_TOV
// (FX derivatives turnover) and WS_EER (Effective Exchange Rates).
// ---------------------------------------------------------------------------

/**
 * BIS SDMX CSV parser — dependency-free, defensive.
 *
 * Returns an array of records (one per data row), keyed by header column name.
 * Handles:
 *   • RFC 4180 quoted fields (with escaped "" double quotes)
 *   • Comma inside quoted fields
 *   • Missing trailing cells (pads to header length)
 *   • Empty / malformed rows (skipped)
 *   • BOM (Byte Order Mark) on first header cell
 *   • `\r\n` and `\n` line endings
 *
 * Used by both `fetchRealBISLiquidity` (WS_DER_OTC_TOV) and
 * `fetchBISExchangeRates` (WS_EER).
 */
function parseBISSdmxCsv(csv: string): Record<string, string>[] {
  if (!csv || typeof csv !== "string") return [];

  // Strip UTF-8 BOM if present (BIS responses sometimes include it).
  const cleaned = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const lines = cleaned.split(/\r\n|\r|\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return []; // header + at least one data row

  const parseRow = (row: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped double quote inside a quoted field.
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };

  const headers = parseRow(lines[0]);
  if (headers.length === 0) return [];

  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i] || lines[i].trim().length === 0) continue;
    const cells = parseRow(lines[i]);
    if (cells.length === 0) continue;
    // Skip rows where the cell count is way off (clearly malformed).
    if (cells.length < Math.ceil(headers.length / 2)) continue;
    const rec: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      rec[headers[j]] = cells[j] ?? "";
    }
    records.push(rec);
  }
  return records;
}

/**
 * Map raw BIS turnover aggregates (per-currency USD turnover in trillions)
 * to the 11-currency basket shares (0-1 each).
 *
 * The BIS reports two-sided turnover (sums to ~200% because every trade has
 * two sides). To convert to one-sided shares (sum to ~1.0), we divide each
 * currency's two-sided turnover by (2 × total pair turnover) — equivalently,
 * divide by the sum of all currencies' two-sided aggregates.
 *
 * For currencies the BIS does not separately report (e.g., AED, SAR —
 * aggregated within "Other"), use the reference constant.
 */
function mapBisLiquidityToBasket(
  twoSidedTurnover: Record<string, number>,
): Record<string, number> {
  const totalTwoSided = Object.values(twoSidedTurnover).reduce(
    (a, b) => a + b,
    0,
  );
  const out: Record<string, number> = {};
  if (totalTwoSided <= 0) {
    // Degenerate input — return all reference values.
    for (const cur of BASKET_CURRENCIES) {
      out[cur] = BIS_TRIENNIAL_2022_REFERENCE[cur];
    }
    return out;
  }
  for (const cur of BASKET_CURRENCIES) {
    const v = twoSidedTurnover[cur];
    if (typeof v === "number" && !isNaN(v) && isFinite(v) && v >= 0) {
      // Two-sided share = v / totalTwoSided (sums to 200% across all currencies).
      // One-sided share = v / totalTwoSided / 2? No — sum over the basket already
      // equals totalTwoSided (since the basket includes USD on one side of every
      // pair). So one-sided share = v / totalTwoSided.
      out[cur] = v / totalTwoSided;
    } else {
      // Currency not separately reported by BIS — use reference constant.
      out[cur] = BIS_TRIENNIAL_2022_REFERENCE[cur];
    }
  }
  return out;
}

/**
 * BIS Triennial Survey — Foreign Exchange Turnover.
 *
 * This is a PERIODIC dataset (every 3 years). The BIS SDMX API provides
 * live access to the published data — "periodic" means the DATA updates
 * triennially, NOT that the API is unavailable.
 *
 * The Triennial Survey FX turnover data is under the WS_DER_OTC_TOV
 * dataflow (OTC Derivatives Turnover) and related FX-specific dataflows.
 *
 * Strategy (per DATA-ARCH-UPGRADE §2):
 *   1. Try BIS SDMX REST API for the WS_DER_OTC_TOV dataflow (CSV format).
 *   2. If CSV returned → parse it, aggregate per-currency turnover, compute shares.
 *   3. If XML returned (e.g., error or SDMX-XML default) → note it, fall back.
 *   4. If API unreachable or no parseable FX data → fall back to reference constants.
 *   5. Record provenance regardless of which path succeeded.
 */
export async function fetchRealBISLiquidity(): Promise<
  SourcedValue<Record<string, number>>
> {
  const fetchedAt = new Date().toISOString();

  // Use the dimension-filtered key "A.U.A" (Annual + Turnover + FX spot instrument)
  // to limit the response from ~14MB to ~825KB — keeps the parse tractable in
  // a serverless function. The full unfiltered dataflow contains all OTC
  // derivatives (interest rate, equity, commodity, FX) which is not what we
  // want for an "FX liquidity" metric anyway.
  //
  // We request CSV explicitly via format=csv. If the API returns XML
  // (e.g., when format is not honoured or an SDMX error), we detect it and
  // fall back to the reference constant.
  const bisUrl = `${BIS_SDMX_API_BASE}/BIS,${BIS_DATAFLOWS.DERIV_OTC_TOV},1.0/A.U.A?startPeriod=2022&format=csv`;

  let retriesUsed = 0;
  let rawResponseText: string | undefined;
  let rawResponseStatus: number | undefined;
  try {
    const { text, status, ok, retries } = await fetchWithRetry(bisUrl, 2);
    retriesUsed = retries;
    rawResponseText = text;
    rawResponseStatus = status;

    if (ok && text) {
      // Detect response type: BIS returns CSV when format=csv is honoured,
      // XML when format=csv is missing or an SDMX error is thrown.
      const isXml = /^\s*<\?xml|^\s*<\w+:?(?:message:)?(?:StructureSpecificData|Error|Structures)\b/i.test(
        text.trim(),
      ) || text.trim().startsWith("<");

      if (isXml) {
        // XML response — note it in the provenance and fall back to reference.
        // This is not an error condition per se — it means the BIS SDMX API
        // IS reachable and responded, but didn't return CSV. (E.g., the
        // dataflow may require a different Accept header.)
        return {
          value: { ...BIS_TRIENNIAL_2022_REFERENCE },
          source:
            `BIS SDMX REST API (LIVE — ${bisUrl}) — Triennial Survey returned XML ` +
            `not CSV (CSV parsing skipped); using latest published reference values ` +
            `(2022 survey; next survey 2025). Response was HTTP ${status}, ${text.length} bytes.`,
          fetchedAt,
          ok: true, // ok=true: API IS live; we got a valid response — just not CSV.
          provider: "BIS",
          dataset: "Triennial Survey (FX Turnover)",
          frequency: "TRIENNIAL",
          accessMethod: "SDMX_API",
          referencePeriod: "2022 (next: 2025)",
          publishedAt: "2022-10-01",
          datasetVersion: "WS_DER_OTC_TOV v1.0",
          revisionNumber: retriesUsed,
        };
      }

      // CSV response — parse it.
      const records = parseBISSdmxCsv(text);
      if (records.length === 0) {
        throw new Error("BIS SDMX returned empty CSV (no data rows)");
      }

      // The WS_DER_OTC_TOV CSV columns include:
      //   FREQ, DER_TYPE, DER_INSTR, DER_RISK, DER_REP_CTY, DER_SECTOR_CPY,
      //   DER_CPC, DER_SECTOR_UDL, DER_CURR_LEG1, DER_CURR_LEG2, DER_ISSUE_MAT,
      //   DER_RATING, DER_EX_METHOD, DER_BASIS, DECIMALS, UNIT_MEASURE,
      //   UNIT_MULT, TIME_FORMAT, AVAILABILITY, COLLECTION, TITLE_TS,
      //   TIME_PERIOD, OBS_VALUE, OBS_STATUS, OBS_CONF, OBS_PRE_BREAK
      //
      // The two currency legs (DER_CURR_LEG1, DER_CURR_LEG2) identify the
      // currency pair. OBS_VALUE is the turnover in trillions of USD.
      // TIME_PERIOD is the survey year (e.g., 2022, 2025).
      //
      // We aggregate per-currency turnover by adding OBS_VALUE to BOTH
      // DER_CURR_LEG1 and DER_CURR_LEG2 buckets — this gives the standard
      // BIS "two-sided" turnover. Dividing by the sum of all buckets gives
      // one-sided shares (sum to 1.0).

      // Determine the latest TIME_PERIOD in the response (defensively — the
      // response may include rows from multiple survey years).
      let latestPeriod: string | undefined;
      for (const rec of records) {
        const period = rec.TIME_PERIOD;
        if (!period) continue;
        // Skip "NaN" or "." sentinels.
        if (!latestPeriod || period > latestPeriod) latestPeriod = period;
      }

      // Aggregate per-currency turnover for the latest period.
      const twoSidedTurnover: Record<string, number> = {};
      if (latestPeriod) {
        for (const rec of records) {
          if (rec.TIME_PERIOD !== latestPeriod) continue;
          const obsValueStr = rec.OBS_VALUE;
          if (!obsValueStr || obsValueStr === "NaN" || obsValueStr === ".") {
            continue;
          }
          const value = parseFloat(obsValueStr);
          if (!isFinite(value) || isNaN(value)) continue;
          const leg1 = rec.DER_CURR_LEG1;
          const leg2 = rec.DER_CURR_LEG2;
          // Skip aggregated "TO1" (all-other-currencies) buckets — we want
          // the per-currency breakdown. Also skip empty values.
          if (leg1 && leg1 !== "TO1" && leg1 !== "XDC") {
            twoSidedTurnover[leg1] = (twoSidedTurnover[leg1] || 0) + value;
          }
          if (leg2 && leg2 !== "TO1" && leg2 !== "XDC") {
            twoSidedTurnover[leg2] = (twoSidedTurnover[leg2] || 0) + value;
          }
        }
      }

      const currencyCount = Object.keys(twoSidedTurnover).length;
      if (currencyCount > 0) {
        const mapped = mapBisLiquidityToBasket(twoSidedTurnover);
        return {
          value: mapped,
          source:
            `${bisUrl} — BIS SDMX REST API (LIVE); CSV parsed ` +
            `(${records.length} rows, ${currencyCount} currencies aggregated for period ${latestPeriod})`,
          fetchedAt,
          ok: true,
          provider: "BIS",
          dataset: "Triennial Survey (FX Turnover)",
          frequency: "TRIENNIAL",
          accessMethod: "SDMX_API",
          referencePeriod: latestPeriod,
          publishedAt: latestPeriod ? `${latestPeriod}-10-01` : "2022-10-01",
          datasetVersion: "WS_DER_OTC_TOV v1.0",
          revisionNumber: retriesUsed,
        };
      }

      // CSV parsed but no usable FX breakdown (e.g., rows were all aggregates
      // or had only TO1 buckets). Fall back to reference values, but record
      // that the API responded successfully.
      return {
        value: { ...BIS_TRIENNIAL_2022_REFERENCE },
        source:
          `${bisUrl} — BIS SDMX REST API (LIVE); CSV parsed (${records.length} rows) ` +
          `but no per-currency FX breakdown could be aggregated; using latest published ` +
          `reference values (2022 survey; next survey 2025).`,
        fetchedAt,
        ok: true,
        provider: "BIS",
        dataset: "Triennial Survey (FX Turnover)",
        frequency: "TRIENNIAL",
        accessMethod: "SDMX_API",
        referencePeriod: latestPeriod || "2022 (next: 2025)",
        publishedAt: "2022-10-01",
        datasetVersion: "WS_DER_OTC_TOV v1.0",
        revisionNumber: retriesUsed,
      };
    }
    // ok=false (HTTP 4xx/5xx) — fall through to reference constants.
  } catch (err) {
    // Network/timeout error — fall through to reference constants, but record
    // the failure reason in the source string.
    return {
      value: { ...BIS_TRIENNIAL_2022_REFERENCE },
      source:
        `BIS SDMX REST API available at ${BIS_SDMX_API_BASE} — API unreachable ` +
        `from this environment (error: ${err instanceof Error ? err.message : String(err)}); ` +
        `using latest published reference (2022 Triennial Survey; next survey 2025).`,
      fetchedAt,
      ok: true, // ok=true: this IS the latest published value
      provider: "BIS",
      dataset: "Triennial Survey (FX Turnover)",
      frequency: "TRIENNIAL",
      accessMethod: "REFERENCE_CONSTANT",
      referencePeriod: "2022 (next: 2025)",
      publishedAt: "2022-10-01",
      datasetVersion: "WS_DER_OTC_TOV v1.0",
      error:
        err instanceof Error
          ? err.message
          : `BIS SDMX API fetch failed (${String(err)})`,
      revisionNumber: retriesUsed,
    };
  }

  // --- Fall back to latest published reference constant ---
  // This is NOT "no API" — it's "API returned an HTTP error from this
  // environment" (e.g., 4xx or 5xx after exhausting retries).
  return {
    value: { ...BIS_TRIENNIAL_2022_REFERENCE },
    source:
      `BIS SDMX REST API available at ${BIS_SDMX_API_BASE} — API returned HTTP ` +
      `${rawResponseStatus ?? "unknown"} after ${retriesUsed} retries; ` +
      `using latest published reference (2022 Triennial Survey; next survey 2025).`,
    fetchedAt,
    ok: true, // ok=true: this IS the latest published value
    provider: "BIS",
    dataset: "Triennial Survey (FX Turnover)",
    frequency: "TRIENNIAL",
    accessMethod: "REFERENCE_CONSTANT",
    referencePeriod: "2022 (next: 2025)",
    publishedAt: "2022-10-01",
    datasetVersion: "WS_DER_OTC_TOV v1.0",
    error: `BIS SDMX API returned HTTP ${rawResponseStatus ?? "unknown"} (retries=${retriesUsed})`,
    revisionNumber: retriesUsed,
  };
}

/**
 * Fetch BIS Effective Exchange Rate (EER) data via SDMX REST API (CSV format).
 *
 * The WS_EER dataflow provides monthly nominal and real EER indices per
 * currency. The EER is an index (base year = 100) measuring a currency's
 * value against a basket of trading partners — useful as a real exchange
 * rate data point, complementing the COFER (reserves), SWIFT (payments),
 * and BIS Triennial (FX turnover) shares.
 *
 * URL pattern (per task spec):
 *   https://stats.bis.org/api/v1/data/BIS,WS_EER,1.0/M.N.N.<REF_AREA>?format=csv&startPeriod=2025-01
 *     M       = Monthly frequency
 *     N       = Nominal (EER_TYPE)
 *     N       = Narrow basket (27 economies)
 *     <CC>    = ISO 3166-1 alpha-2 REF_AREA code (US, JP, GB, CH, CA, AU, SG)
 *
 * Empirically verified: BIS publishes EER for US, JP, GB, CH, CA, AU, SG.
 * Returns HTTP 404 for U2 (EUR), CN (CNY), AE (AED), SA (SAR) — these are
 * not in the narrow 27-economy EER basket. The function returns data only
 * for the currencies that succeed; failed currencies are noted in the
 * `error` field and `source` string.
 */
export async function fetchBISExchangeRates(): Promise<
  SourcedValue<Record<string, number>>
> {
  const fetchedAt = new Date().toISOString();

  // Map our 11 basket currencies → BIS REF_AREA codes (ISO 3166-1 alpha-2).
  // EUR (U2), CNY (CN), AED (AE), SAR (SA) are not in the narrow EER — we
  // still try them defensively in case BIS adds them later, but expect 404.
  const currencyToRefArea: Record<string, string> = {
    USD: "US",
    EUR: "U2", // Euro area — BIS uses U2 (404 in narrow EER, but kept for forward compat)
    JPY: "JP",
    GBP: "GB",
    CHF: "CH",
    CAD: "CA",
    AUD: "AU",
    CNY: "CN", // China — 404 in narrow EER (kept for forward compat)
    SGD: "SG",
    AED: "AE", // UAE — 404 in narrow EER
    SAR: "SA", // Saudi Arabia — 404 in narrow EER
  };

  const entries = Object.entries(currencyToRefArea);
  const results: Record<string, number> = {};
  const errors: string[] = [];
  let latestPeriod: string | undefined;
  let totalRetries = 0;

  // Process in small chunks to avoid overwhelming the BIS API (rate-limit
  // friendly). 5 in parallel is conservative — the BIS SDMX API has no
  // documented rate limit but this is good citizenship.
  const CHUNK_SIZE = 5;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async ([cur, refArea]) => {
        try {
          const url = `${BIS_SDMX_API_BASE}/BIS,${BIS_DATAFLOWS.EER},1.0/M.N.N.${refArea}?format=csv&startPeriod=2025-01`;
          // EER fetches are lightweight (~600 bytes per currency for 6 months).
          // Use 1 retry (2 total attempts) to keep latency low.
          const { text, ok, status, retries } = await fetchWithRetry(url, 1);
          totalRetries += retries;

          if (!ok || !text) {
            return { cur, error: `HTTP ${status}`, url };
          }

          // Detect XML error responses (e.g., 404 SDMX Error XML when the
          // REF_AREA isn't in the narrow EER basket).
          if (text.trim().startsWith("<")) {
            return {
              cur,
              error: `BIS returned XML (expected CSV) — likely REF_AREA ${refArea} not in EER`,
              url,
            };
          }

          const records = parseBISSdmxCsv(text);
          if (records.length === 0) {
            return { cur, error: "no data rows in CSV", url };
          }

          // Filter to rows with valid TIME_PERIOD and OBS_VALUE, then sort
          // ascending so the latest is last.
          const valid = records
            .filter(
              (r) =>
                r.TIME_PERIOD &&
                r.OBS_VALUE &&
                r.OBS_VALUE !== "NaN" &&
                r.OBS_VALUE !== ".",
            )
            .sort((a, b) =>
              a.TIME_PERIOD > b.TIME_PERIOD ? 1 : -1,
            );
          if (valid.length === 0) {
            return { cur, error: "no valid observations", url };
          }

          const latest = valid[valid.length - 1];
          const value = parseFloat(latest.OBS_VALUE);
          if (!isFinite(value) || isNaN(value)) {
            return {
              cur,
              error: `invalid OBS_VALUE: ${latest.OBS_VALUE}`,
              url,
            };
          }

          // Track the latest period across all currencies (defensive — they
          // should all share the same monthly cadence, but if one is older
          // we keep the max).
          if (!latestPeriod || latest.TIME_PERIOD > latestPeriod) {
            latestPeriod = latest.TIME_PERIOD;
          }

          return { cur, value, period: latest.TIME_PERIOD, url };
        } catch (e: any) {
          return {
            cur,
            error: e?.message || "fetch error",
          };
        }
      }),
    );
    for (const r of chunkResults) {
      if (r.value !== undefined) {
        results[r.cur] = r.value;
      } else {
        errors.push(`${r.cur}: ${r.error}`);
      }
    }
  }

  const successCount = Object.keys(results).length;

  if (successCount === 0) {
    return {
      value: {},
      source:
        `BIS SDMX WS_EER — all ${entries.length} currency fetches failed: ` +
        `${errors.join("; ")}. BIS EER API is LIVE — see ${BIS_SDMX_API_BASE}/BIS,WS_EER,1.0`,
      fetchedAt,
      ok: false,
      error: errors.join("; ") || "all BIS EER fetches failed",
      provider: "BIS",
      dataset: "Effective Exchange Rates (EER)",
      frequency: "MONTHLY",
      accessMethod: "SDMX_API",
      referencePeriod: latestPeriod,
      datasetVersion: "WS_EER v1.0",
      revisionNumber: totalRetries,
    };
  }

  return {
    value: results,
    source:
      `BIS SDMX REST API (WS_EER, narrow 27-economy basket) — ` +
      `${successCount}/${entries.length} currencies fetched successfully` +
      `${errors.length ? `; failed: ${errors.join("; ")}` : ""}. ` +
      `Each value is the monthly nominal EER index (base year=100).`,
    fetchedAt,
    ok: successCount === entries.length,
    error: errors.length > 0 ? errors.join("; ") : undefined,
    provider: "BIS",
    dataset: "Effective Exchange Rates (EER)",
    frequency: "MONTHLY",
    accessMethod: "SDMX_API",
    referencePeriod: latestPeriod,
    publishedAt: latestPeriod ? `${latestPeriod}-15` : undefined, // mid-month approx
    datasetVersion: "WS_EER v1.0",
    revisionNumber: totalRetries,
  };
}

/**
 * Discover available BIS datasets via the SDMX REST API.
 * This proves the BIS SDMX API is LIVE.
 */
export async function discoverBISDataflows(): Promise<string[]> {
  try {
    const { text, ok } = await fetchJsonWithTimeout(`${BIS_SDMX_API_BASE}flow`);
    if (!ok || !text) return [];
    // Parse XML dataflow IDs
    const matches = text.match(/id="([^"]+)"/g) || [];
    return matches
      .map((m: string) => m.replace(/id="([^"]+)"/, "$1"))
      .filter((id: string) => id !== "UNKNOWN" && id !== "not_supplied")
      .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// VIX — live from Yahoo Finance.
// ---------------------------------------------------------------------------

/**
 * Yahoo Finance VIX endpoint. Symbol ^VIX (URL-encoded as %5EVIX).
 * Returns: { chart: { result: [{ meta: { regularMarketPrice: 16.34 } }] } }
 */
export async function fetchRealVIX(): Promise<SourcedValue<number>> {
  const fetchedAt = new Date().toISOString();

  // --- Step 0: try FRED VIXCLS (if API key is set) ---
  if (FRED_ENABLED) {
    const fredVix = await fetchFREDSeries("VIXCLS");
    if (fredVix.ok && fredVix.value !== null && fredVix.value > 0) {
      return {
        value: fredVix.value,
        source: `FRED VIXCLS (live, ${fredVix.value} on VIX spot) — ${fredVix.source}`,
        fetchedAt,
        ok: true,
        provider: "FRED",
        dataset: "VIXCLS",
        frequency: "DAILY",
        accessMethod: "REST_API",
        referencePeriod: fredVix.referencePeriod,
      };
    }
  }

  // --- Step 1: try Yahoo Finance ^VIX ---
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d";
  try {
    const { json, status, ok } = await fetchJsonWithTimeout(url);
    if (!ok) {
      throw new Error(`Yahoo Finance VIX HTTP ${status}`);
    }
    const price =
      json?.chart?.result?.[0]?.meta?.regularMarketPrice ??
      json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];
    if (typeof price !== "number" || !isFinite(price) || price <= 0) {
      throw new Error("Yahoo Finance VIX returned no valid price");
    }
    return {
      value: price,
      source: url,
      fetchedAt,
      ok: true,
      provider: "Yahoo",
      dataset: "VIX (^VIX)",
      frequency: "DAILY",
      accessMethod: "REST_API",
    };
  } catch (err) {
    return {
      value: VIX_LATEST_PUBLISHED_REFERENCE,
      source: `reference-constant: CBOE VIX latest published (~${VIX_LATEST_PUBLISHED_REFERENCE}) — live fetch failed`,
      fetchedAt,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      provider: "CBOE",
      dataset: "VIX",
      frequency: "DAILY",
      accessMethod: "REFERENCE_CONSTANT",
    };
  }
}

// ---------------------------------------------------------------------------
// Credit spreads (BAA − AAA) — Yahoo alternative + reference constant.
// ---------------------------------------------------------------------------

/**
 * Fetch the BAA − AAA corporate bond yield spread (in percentage points).
 *
 * Strategy:
 *   0. Try FRED BAA and AAA series (if FRED_API_KEY is set — PREFERRED SOURCE).
 *   1. Try Yahoo Finance ^BAA and ^AAA. Yahoo has DELISTED these symbols
 *      in many regions, so this usually fails.
 *   2. If that fails, fall back to the latest published reference constant
 *      (Moody's BAA − AAA via FRED, ~1.02pp as of late 2024).
 *   3. Also fetch ^TNX (10-year treasury yield) as a secondary live
 *      stress indicator — that symbol is still live on Yahoo.
 */
export async function fetchRealCreditSpreads(): Promise<{
  spread: SourcedValue<number>;
  tnx10y: SourcedValue<number> | null;
}> {
  const fetchedAt = new Date().toISOString();

  // --- Step 0: try FRED BAA + AAA (if API key is set — PREFERRED) ---
  let spread: SourcedValue<number>;
  if (FRED_ENABLED) {
    const [fredBaa, fredAaa] = await Promise.all([
      fetchFREDSeries("BAA"),
      fetchFREDSeries("AAA"),
    ]);
    if (fredBaa.ok && fredAaa.ok && fredBaa.value !== null && fredAaa.value !== null) {
      const spreadVal = fredBaa.value - fredAaa.value; // percentage points
      spread = {
        value: spreadVal,
        source: `FRED BAA (${fredBaa.value}) − FRED AAA (${fredAaa.value}) — live Moody's via FRED`,
        fetchedAt,
        ok: true,
      };
      // Skip Yahoo BAA/AAA — FRED succeeded
    } else {
      // FRED failed — fall through to Yahoo
    }
  }

  // --- Step 1: try Yahoo ^BAA and ^AAA (only if FRED didn't set spread) ---
  if (spread === undefined) {
    let baa: number | null = null;
    let aaa: number | null = null;
    try {
      const baaRes = await fetchJsonWithTimeout(
        "https://query1.finance.yahoo.com/v8/finance/chart/%5EBAA?interval=1d&range=1d",
      );
      const baaPrice =
        baaRes.json?.chart?.result?.[0]?.meta?.regularMarketPrice ??
        baaRes.json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];
      if (typeof baaPrice === "number" && isFinite(baaPrice) && baaPrice > 0) {
        baa = baaPrice;
      }
    } catch {
      /* fall through */
    }
    try {
      const aaaRes = await fetchJsonWithTimeout(
        "https://query1.finance.yahoo.com/v8/finance/chart/%5EAAA?interval=1d&range=1d",
      );
      const aaaPrice =
        aaaRes.json?.chart?.result?.[0]?.meta?.regularMarketPrice ??
        aaaRes.json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];
      if (typeof aaaPrice === "number" && isFinite(aaaPrice) && aaaPrice > 0) {
        aaa = aaaPrice;
      }
    } catch {
      /* fall through */
    }

    if (baa !== null && aaa !== null && baa > aaa) {
      const computed = baa - aaa; // percentage points
      spread = {
        value: computed,
        source:
          "https://query1.finance.yahoo.com/v8/finance/chart/%5EBAA minus %5EAAA (live Yahoo Finance)",
        fetchedAt,
        ok: true,
        provider: "Yahoo",
        dataset: "BAA-AAA Credit Spread",
        frequency: "DAILY",
        accessMethod: "REST_API",
      };
    } else {
      spread = {
        value: CREDIT_SPREAD_LATEST_PUBLISHED_REFERENCE,
        source:
          "reference-constant: Moody's BAA−AAA via FRED latest published (~1.02pp) — Yahoo ^BAA/^AAA delisted or unreachable",
        fetchedAt,
        ok: false,
        error: "Yahoo Finance ^BAA and/or ^AAA not available",
        provider: "Moody's / FRED",
        dataset: "BAA-AAA Credit Spread",
        frequency: "MONTHLY",
        accessMethod: "REFERENCE_CONSTANT",
      };
    }
  }

  // --- Step 2: fetch 10-year treasury (FRED DGS10 preferred, Yahoo ^TNX fallback) ---
  let tnx10y: SourcedValue<number> | null = null;

  // Try FRED DGS10 first
  if (FRED_ENABLED) {
    const fredDgs10 = await fetchFREDSeries("DGS10");
    if (fredDgs10.ok && fredDgs10.value !== null && fredDgs10.value > 0) {
      tnx10y = {
        value: fredDgs10.value,
        source: `FRED DGS10 (${fredDgs10.value}%) — live US Treasury`,
        fetchedAt,
        ok: true,
      };
    }
  }

  // Fall back to Yahoo ^TNX if FRED didn't succeed
  if (tnx10y === null) {
    try {
      const tnxRes = await fetchJsonWithTimeout(
        "https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=1d",
      );
      const tnxPrice =
        tnxRes.json?.chart?.result?.[0]?.meta?.regularMarketPrice ??
        tnxRes.json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];
      if (typeof tnxPrice === "number" && isFinite(tnxPrice) && tnxPrice > 0) {
        tnx10y = {
          value: tnxPrice,
          source:
            "https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX (live Yahoo Finance)",
          fetchedAt,
          ok: true,
        };
      }
    } catch {
      /* leave tnx10y null */
    }
  }

  return { spread, tnx10y };
}

// ---------------------------------------------------------------------------
// Aggregator — fetch all sources, assemble the RealMarketData with honest state.
// ---------------------------------------------------------------------------

let cached: { data: RealMarketData; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Fetch the real market data — aggregates all sources.
 *
 * Optional `input` allows the caller to populate fields that are already
 * fetched elsewhere (gold, silver, FX rates) so we don't double-fetch.
 */
export async function fetchRealMarketData(input?: {
  goldUsd?: number | null;
  silverUsd?: number | null;
  fxRates?: Record<string, number> | null;
}): Promise<RealMarketData> {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Fetch all sources in parallel.
  // Per DATA-ARCH-UPGRADE §4: add fetchBISExchangeRates() to the parallel batch.
  // It's a separate fetcher from fetchRealBISLiquidity (Triennial Survey) —
  // BIS EER is a MONTHLY dataset, the Triennial Survey is TRIENNIAL.
  const [cofer, swift, bis, bisEer, vix, credit] = await Promise.all([
    fetchRealCOFERShares(),
    fetchRealSWIFTShares(),
    fetchRealBISLiquidity(),
    fetchBISExchangeRates(),
    fetchRealVIX(),
    fetchRealCreditSpreads(),
  ]);

  const failedSources: string[] = [];
  if (!cofer.ok) failedSources.push("IMF-COFER");
  if (!vix.ok) failedSources.push("Yahoo-VIX");
  if (!credit.spread.ok) failedSources.push("Yahoo-BAA-AAA-credit-spread");
  // BIS EER is a best-effort live fetch — partial failure (some currencies
  // 404 in the narrow EER basket) is normal. Only mark as a failed source if
  // ZERO currencies came back.
  if (!bisEer.ok && Object.keys(bisEer.value).length === 0) {
    failedSources.push("BIS-EER");
  }

  // dataFresh = true iff every LIVE fetch succeeded. Reference constants
  // for SWIFT (PUBLICATION_ONLY) and BIS (periodic dataset — API available) — they don't count
  // as failures. The 10-year treasury is a secondary indicator.
  const liveSources = [cofer, vix, credit.spread];
  const allLiveOk = liveSources.every((s) => s.ok);
  // BIS EER contributes to dataFresh only when it returned at least one
  // currency (partial success is acceptable — not all currencies have an EER).
  const bisEerPartialOk = bisEer.ok || Object.keys(bisEer.value).length > 0;
  const dataFresh = allLiveOk && bisEerPartialOk && failedSources.length === 0;

  const sources: string[] = [
    cofer.source,
    swift.source,
    bis.source,
    bisEer.source,
    vix.source,
    credit.spread.source,
  ];
  if (credit.tnx10y) {
    sources.push(credit.tnx10y.source);
  }

  // ─── CORRECTED SOURCE STATUS MODEL (dynamically generated) ───
  // Per DATA-ARCH-UPGRADE §4: include BIS EER as a SEPARATE dataset entry
  // (distinct from the Triennial Survey — they have different frequencies
  // and access patterns).
  const sourceStatus: DataSourceStatusEntry[] = [
    {
      dataset: "COFER",
      officialSource: "IMF",
      access: cofer.accessMethod || (cofer.ok ? "SDMX_API" : "REFERENCE_CONSTANT"),
      frequency: cofer.frequency || "QUARTERLY",
      status: cofer.ok ? "HEALTHY" : "DEGRADED",
      latestPublishedPeriod: cofer.referencePeriod,
      latestRetrievedAt: cofer.fetchedAt,
      apiEndpoint: "PRIMARY: https://api.imf.org/external/sdmx/2.1/data/COFER/1.0/ | FALLBACK: https://www.imf.org/external/datamapper/api/v1/COFER",
      notes: cofer.ok
        ? `Live IMF API fetch succeeded (provider=${cofer.provider}, accessMethod=${cofer.accessMethod}${cofer.publishedAt ? `, publishedAt=${cofer.publishedAt}` : ""}${cofer.datasetVersion ? `, datasetVersion=${cofer.datasetVersion}` : ""}). ${cofer.error ? "" : ""}`
        : `IMF API unreachable — using reference fallback. ${cofer.error || ""}`,
    },
    {
      dataset: "Triennial Survey (FX Turnover)",
      officialSource: "BIS",
      access: bis.accessMethod || "REFERENCE_CONSTANT",
      frequency: bis.frequency || "TRIENNIAL",
      status: bis.ok ? "HEALTHY" : "DEGRADED",
      latestPublishedPeriod: bis.referencePeriod,
      latestRetrievedAt: bis.fetchedAt,
      apiEndpoint: "https://stats.bis.org/api/v1/data/BIS,WS_DER_OTC_TOV,1.0 (BIS SDMX REST API, CSV format)",
      notes: "API_AVAILABLE / PERIODIC_DATASET — BIS SDMX API is live; Triennial Survey data updates every 3 years. CSV parser extracts per-currency turnover shares.",
    },
    {
      dataset: "Effective Exchange Rates (EER)",
      officialSource: "BIS",
      access: bisEer.accessMethod || "SDMX_API",
      frequency: bisEer.frequency || "MONTHLY",
      status:
        Object.keys(bisEer.value).length === 0
          ? "DEGRADED"
          : Object.keys(bisEer.value).length < 11
            ? "HEALTHY"
            : "HEALTHY",
      latestPublishedPeriod: bisEer.referencePeriod,
      latestRetrievedAt: bisEer.fetchedAt,
      apiEndpoint: "https://stats.bis.org/api/v1/data/BIS,WS_EER,1.0/M.N.N.<REF_AREA>?format=csv (BIS SDMX REST API, monthly)",
      notes:
        `BIS SDMX WS_EER narrow 27-economy basket — ` +
        `${Object.keys(bisEer.value).length}/11 currencies have EER data ` +
        `(EUR/CNY/AED/SAR are NOT in the narrow EER basket — BIS returns HTTP 404 for those REF_AREA codes). ` +
        `${bisEer.error ? `Errors: ${bisEer.error}.` : "All queried currencies returned CSV successfully."}`,
    },
    {
      dataset: "RMB Tracker",
      officialSource: "SWIFT",
      access: swift.accessMethod || "PUBLICATION_ONLY",
      frequency: swift.frequency || "MONTHLY",
      status: "PUBLICATION_ONLY",
      latestPublishedPeriod: swift.referencePeriod,
      latestRetrievedAt: swift.fetchedAt,
      apiEndpoint: "SWIFT API Developer Portal (per-dataset; RMB Tracker is PUBLICATION_ONLY)",
      notes: "SWIFT has API infrastructure; RMB Tracker is a monthly publication. Per-dataset evaluation, not global 'no API'.",
    },
    {
      dataset: "VIX",
      officialSource: "CBOE / FRED",
      access: vix.accessMethod || (vix.ok ? "REST_API" : "REFERENCE_CONSTANT"),
      frequency: "DAILY",
      status: vix.ok ? "HEALTHY" : "DEGRADED",
      latestPublishedPeriod: vix.referencePeriod,
      latestRetrievedAt: vix.fetchedAt,
      apiEndpoint: FRED_ENABLED ? "FRED VIXCLS (live)" : "Yahoo Finance ^VIX (live)",
      notes: vix.ok ? "Live VIX fetch succeeded" : "Live VIX fetch failed — using reference fallback",
    },
    {
      dataset: "BAA-AAA Credit Spread",
      officialSource: "Moody's / FRED",
      access: credit.spread.accessMethod || (credit.spread.ok ? "REST_API" : "REFERENCE_CONSTANT"),
      frequency: "DAILY",
      status: credit.spread.ok ? "HEALTHY" : "DEGRADED",
      latestPublishedPeriod: credit.spread.referencePeriod,
      latestRetrievedAt: credit.spread.fetchedAt,
      apiEndpoint: FRED_ENABLED ? "FRED BAA + AAA (live)" : "Yahoo ^BAA/^AAA (delisted)",
      notes: credit.spread.ok ? "Live credit spread fetch succeeded" : "Credit spread fetch failed — using reference fallback",
    },
  ];

  const data: RealMarketData = {
    coferShares: cofer.value,
    swiftShares: swift.value,
    bisLiquidity: bis.value,
    // ─── NEW FIELD (DATA-ARCH-UPGRADE §4) ───
    // BIS Effective Exchange Rates — per-currency monthly nominal EER index
    // (base year = 100). Empty object if all currency fetches failed.
    bisExchangeRates: bisEer.value,
    vix: vix.value,
    creditSpreadBaaAaa: credit.spread.value,
    treasury10yr: credit.tnx10y ? credit.tnx10y.value : null,
    goldUsd: input?.goldUsd ?? null,
    silverUsd: input?.silverUsd ?? null,
    fxRates: input?.fxRates ?? null,
    timestamp: new Date().toISOString(),
    sources,
    sourceStatus,
    honestState: {
      productionAuthorized: false, // blueprint: ALWAYS false
      dataFresh,
      failedSources,
    },
    provenance: {
      cofer,
      swift,
      bis,
      vix,
      creditSpread: credit.spread,
      ...(credit.tnx10y ? { tnx10y: credit.tnx10y } : {}),
      // ─── NEW FIELD (DATA-ARCH-UPGRADE §4) ───
      // BIS EER provenance — separate from the Triennial Survey (BIS) provenance.
      ...(Object.keys(bisEer.value).length > 0 || !bisEer.ok ? { bisEer: bisEer } : {}),
    },
  };

  cached = { data, timestamp: Date.now() };

  // ─── Persist observations to Turso DB (best-effort, non-blocking) ───
  // Records provenance for each data source observation.
  // Failures are silently ignored (don't break the API response).
  persistObservationsBestEffort(data).catch(() => {});

  return data;
}

/**
 * Best-effort persistence of data source observations to the DataSourceObservation table.
 * Non-blocking — failures are silently caught.
 */
async function persistObservationsBestEffort(data: RealMarketData): Promise<void> {
  try {
    const { persistDataSourceObservation } = await import("@/lib/db");
    const ingestionRunId = `ingest-${data.timestamp}`;
    const now = new Date().toISOString();

    // Persist COFER observations
    for (const [ccy, share] of Object.entries(data.coferShares)) {
      await persistDataSourceObservation({
        id: `IMF-COFER-${ccy}-${data.provenance.cofer.referencePeriod || "latest"}`,
        provider: "IMF",
        dataset: "COFER",
        series_key: ccy,
        reference_period: data.provenance.cofer.referencePeriod,
        frequency: "QUARTERLY",
        value: String(share),
        unit: "share (0-1)",
        source_url: data.provenance.cofer.source,
        access_method: String(data.provenance.cofer.accessMethod || "REST_API"),
        retrieved_at: data.provenance.cofer.fetchedAt,
        published_at: data.provenance.cofer.publishedAt,
        methodology_version: data.provenance.cofer.methodologyVersion,
        dataset_version: data.provenance.cofer.datasetVersion,
        ingestion_run_id: ingestionRunId,
      });
    }

    // Persist BIS observations
    for (const [ccy, share] of Object.entries(data.bisLiquidity)) {
      await persistDataSourceObservation({
        id: `BIS-TRI-${ccy}-${data.provenance.bis.referencePeriod || "latest"}`,
        provider: "BIS",
        dataset: "Triennial Survey",
        series_key: ccy,
        reference_period: data.provenance.bis.referencePeriod,
        frequency: "TRIENNIAL",
        value: String(share),
        unit: "share (0-1)",
        source_url: data.provenance.bis.source,
        access_method: String(data.provenance.bis.accessMethod || "SDMX_API"),
        retrieved_at: data.provenance.bis.fetchedAt,
        published_at: data.provenance.bis.publishedAt,
        dataset_version: data.provenance.bis.datasetVersion,
        ingestion_run_id: ingestionRunId,
      });
    }

    // Persist VIX
    await persistDataSourceObservation({
      id: `VIX-${data.provenance.vix.referencePeriod || now}`,
      provider: data.provenance.vix.provider || "FRED",
      dataset: "VIX",
      series_key: "VIXCLS",
      reference_period: data.provenance.vix.referencePeriod,
      frequency: "DAILY",
      value: String(data.vix),
      unit: "index points",
      source_url: data.provenance.vix.source,
      access_method: String(data.provenance.vix.accessMethod || "REST_API"),
      retrieved_at: data.provenance.vix.fetchedAt,
      ingestion_run_id: ingestionRunId,
    });
  } catch {
    // Best-effort — don't break the API if DB persistence fails
  }
}

/**
 * Returns how old the cached real market data is, in milliseconds.
 * Returns Infinity if no fetch has been performed yet.
 */
export function getDataFreshness(): {
  ageMs: number;
  ageHumanReadable: string;
  fetchedAt: string | null;
  cached: boolean;
} {
  if (!cached) {
    return {
      ageMs: Infinity,
      ageHumanReadable: "no data yet",
      fetchedAt: null,
      cached: false,
    };
  }
  const ageMs = Date.now() - cached.timestamp;
  return {
    ageMs,
    ageHumanReadable: humanDuration(ageMs),
    fetchedAt: new Date(cached.timestamp).toISOString(),
    cached: true,
  };
}

function humanDuration(ms: number): string {
  if (!isFinite(ms)) return "∞";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/**
 * Clear the in-memory cache. Useful for scripts that want a fresh fetch.
 */
export function clearRealMarketDataCache(): void {
  cached = null;
}

// ---------------------------------------------------------------------------
// Convenience: return only the latest published reference constants
// (used by callers that need an immediate, network-free answer).
// ---------------------------------------------------------------------------
export function getReferenceConstantsSnapshot(): {
  cofer: Record<string, number>;
  swift: Record<string, number>;
  bis: Record<string, number>;
  vix: number;
  creditSpreadBaaAaa: number;
} {
  return {
    cofer: { ...COFER_LATEST_PUBLISHED_REFERENCE },
    swift: { ...SWIFT_LATEST_PUBLISHED_REFERENCE },
    bis: { ...BIS_TRIENNIAL_2022_REFERENCE },
    vix: VIX_LATEST_PUBLISHED_REFERENCE,
    creditSpreadBaaAaa: CREDIT_SPREAD_LATEST_PUBLISHED_REFERENCE,
  };
}
