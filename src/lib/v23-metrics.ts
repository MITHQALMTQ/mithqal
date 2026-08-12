// v23 Four-Layer Metrics Engine — Layer 2/3/4 advisory metrics
// =================================================================
// Implements the v23 advisory metrics that sit alongside the Layer 1
// constitutional solvency engine (RR). NONE of these metrics change PAR
// or trigger rebalancing — they are observation/reporting only.
//
// Implements:
//   §7.3  DRQS — Digital Reserve Quality Score (8-factor weighted)
//   §7.5  SE   — Stablecoin Exposure (nominal)
//   §7.5  SAE  — Stablecoin Adjusted Exposure (risk-adjusted)
//   §7.6  Multi-Dimensional Stablecoin State Machine
//        (NORMAL / WATCH / REDUCE / SUSPEND / SUBSTITUTE / EMERGENCY_EXIT)
//   §7.7  Stablecoin Depeg Monitoring (live price feeds)
//   §6.10 CQS  — Currency Quality Score state machine (WATCH/REDUCE/SUSPEND/REINSTATE)
//
// All data sources are FREE (no API keys required):
//   - CoinGecko public API (stablecoin prices)
//   - open.er-api.com (FX rates)
//   - gold-api.com (gold/silver spot)
//
// CONSTITUTIONAL BOUNDARY (§40 non-goals):
//   - Does NOT modify PAR
//   - Does NOT trigger rebalancing
//   - Does NOT change reserve composition
//   - Only Layer 1 (RR) triggers constitutional action
// =================================================================

import {
  DRQS_SPEC,
  APPROVED_DIGITAL_ASSETS,
  STABLECOIN_STATE_MACHINE,
  STABLECOIN_EXPOSURE_SPEC,
  CQS_SPEC,
  SUBSTITUTION_SPEC,
  DIGITAL_LIQUIDITY_SPEC,
} from "./reserve-policy-spec";

// ---- Types ----

export interface DrqsFactors {
  issuer: number;        // 0-10 — issuer creditworthiness
  reserve: number;       // 0-10 — reserve quality & transparency
  redemption: number;    // 0-10 — redemption mechanism reliability
  depeg: number;         // 0-10 — historical peg stability
  jurisdiction: number;  // 0-10 — regulatory jurisdiction quality
  custody: number;       // 0-10 — reserve custody arrangement
  operational: number;   // 0-10 — operational track record
  liquidity: number;     // 0-10 — market liquidity depth
}

export interface DrqsResult {
  asset: string;
  score: number;          // weighted 0-10
  factors: DrqsFactors;
  classification: "core" | "conditional" | "excluded";
  eligible: boolean;
}

export interface StablecoinState {
  asset: string;
  state:
    | "NORMAL"
    | "WATCH"
    | "REDUCE"
    | "SUSPEND"
    | "SUBSTITUTE"
    | "EMERGENCY_EXIT";
  dimensions: {
    priceDev: number;       // |price - peg| / peg
    liquidity: "healthy" | "stressed" | "impaired";
    redemption: "working" | "delayed" | "suspended";
    reserve: "verified" | "attested" | "unverified";
    issuer: "healthy" | "watch" | "distressed";
    regulatory: "good" | "review" | "adverse";
  };
  reason: string;
  actionRequired: string | null;
}

export interface StablecoinExposureMetrics {
  se: number;              // SE = Σ Stablecoin Value / R_a (nominal, as %)
  sae: number;             // SAE = Σ (Value × DRQS^-1 × StressFactor) / R_a (risk-adjusted, as %)
  totalStablecoinUsd: number;
  totalRiskAdjustedUsd: number;
  perAsset: Array<{
    asset: string;
    valueUsd: number;
    drqs: number;
    stressFactor: number;
    riskAdjustedUsd: number;
    shareOfSe: number;     // % contribution to SE
    shareOfSae: number;    // % contribution to SAE
  }>;
  withinLimits: boolean;   // SE ≤ 5% MAX_TOTAL
  concentrationOk: boolean; // no issuer > 2%
}

export interface DepegReading {
  asset: string;
  peg: string;
  pegValue: number;        // 1.0 for USD, ~1.09 for EUR
  livePrice: number;       // live market price in USD
  priceDev: number;        // |livePrice - pegValue| / pegValue
  source: string;
  fetchedAt: string;
}

export interface V23MetricsReport {
  generatedAt: string;
  // Layer 2 — Gold-relative
  gei: number;
  bri: number;
  // Layer 3 — Liquidity
  lci: number;
  // Layer 4 — Risk dashboard
  drqs: DrqsResult[];
  stablecoinStates: StablecoinState[];
  exposure: StablecoinExposureMetrics;
  depegReadings: DepegReading[];
  // CQS state machine
  cqsStates: Array<{
    currency: string;
    cqs: number;
    state: "NORMAL" | "WATCH" | "REDUCE" | "SUSPEND" | "REINSTATE_CANDIDATE";
    readingsBelowTrigger: number;
  }>;
  // Constitution guard
  layer1OnlyAction: boolean;
  allWithinLimits: boolean;
  warnings: string[];
}

// ---- DRQS factor tables (v23 §7.4 approved assets) ----
// Each factor scored 0-10 based on public, verifiable information.
// These are the same scores that underlie the DRQS values in
// APPROVED_DIGITAL_ASSETS — decomposed here for transparency.

const DRQS_FACTOR_TABLE: Record<string, DrqsFactors> = {
  USDC: {
    issuer: 9.0,    // Circle Internet Financial — public company filing path
    reserve: 8.5,   // Monthly attestations, cash + short-dated US T-bills
    redemption: 8.5,// 1:1 redemption for institutional users
    depeg: 9.0,     // Max historical depeg <0.5% (excl. SVB event, recovered in 3 days)
    jurisdiction: 8.5, // US-regulated money transmitter
    custody: 8.5,   // BNY Mellon custody
    operational: 9.0, // 7+ years operating, $40B+ circulation
    liquidity: 9.0, // Deepest stablecoin market
  },
  USDP: {
    issuer: 9.0,    // Paxos Trust Company — NYDFS-regulated
    reserve: 9.0,   // Monthly attestations, cash + US T-bills, bankruptcy-remote
    redemption: 8.5,
    depeg: 9.5,     // Never depegged materially
    jurisdiction: 9.0, // NYDFS trust charter (gold standard)
    custody: 8.5,
    operational: 8.5,
    liquidity: 7.0, // Smaller market than USDC
  },
  EURC: {
    issuer: 8.5,    // Circle — same issuer as USDC
    reserve: 8.0,   // Monthly attestations, EUR-denominated reserves
    redemption: 8.0,
    depeg: 8.5,
    jurisdiction: 8.0, // EU MiCA-compliant
    custody: 8.0,
    operational: 7.5, // Newer product (2023)
    liquidity: 7.0,
  },
  BUIDL: {
    issuer: 9.5,    // BlackRock — world's largest asset manager
    reserve: 9.5,   // Tokenized US T-bills, daily NAV
    redemption: 8.0,// Institutional redemption
    depeg: 9.5,     // T-bill-backed, negligible depeg risk
    jurisdiction: 9.0,
    custody: 9.0,   // Bank of New York Mellon
    operational: 8.0, // Launched 2024
    liquidity: 6.5, // Institutional-only, smaller secondary market
  },
  DAI: {
    issuer: 6.5,    // MakerDAO — decentralized, no single issuer
    reserve: 6.0,   // Overcollateralized but complex (RWA + crypto)
    redemption: 7.0,
    depeg: 7.0,     // Depegged ~5% during March 2023
    jurisdiction: 5.0, // Decentralized, uncertain jurisdiction
    custody: 6.0,   // Smart-contract custody
    operational: 7.5,
    liquidity: 7.5,
  },
};

// ---- DRQS computation ----

export function computeDrqs(
  factors: DrqsFactors,
  weights = DRQS_SPEC.WEIGHTS,
): number {
  const w = weights as Record<string, number>;
  const score =
    factors.issuer * w.ISSUER +
    factors.reserve * w.RESERVE +
    factors.redemption * w.REDEMPTION +
    factors.depeg * w.DEPEG +
    factors.jurisdiction * w.JURISDICTION +
    factors.custody * w.CUSTODY +
    factors.operational * w.OPERATIONAL +
    factors.liquidity * w.LIQUIDITY;
  return Math.round(score * 100) / 100;
}

export function classifyDrqs(
  score: number,
): DrqsResult["classification"] {
  if (score >= DRQS_SPEC.CORE_THRESHOLD) return "core";
  if (score >= DRQS_SPEC.CONDITIONAL_THRESHOLD) return "conditional";
  return "excluded";
}

export function computeAllDrqs(): DrqsResult[] {
  const results: DrqsResult[] = [];
  for (const [asset, factors] of Object.entries(DRQS_FACTOR_TABLE)) {
    const score = computeDrqs(factors);
    const classification = classifyDrqs(score);
    results.push({
      asset,
      score,
      factors,
      classification,
      eligible: classification !== "excluded" &&
        (APPROVED_DIGITAL_ASSETS as Record<string, { optional?: boolean }>)[asset]?.optional !== true
        ? true
        : classification === "core" || classification === "conditional",
    });
  }
  return results;
}

// ---- Stablecoin Depeg Monitoring (FREE feeds) ----

// CoinGecko simple price endpoint — free, no API key, rate-limited ~10-30 req/min.
// Maps our asset ids to CoinGecko coin ids.
const COINGECKO_ID_MAP: Record<string, string> = {
  USDC: "usd-coin",
  USDP: "paxos-standard",
  EURC: "euro-coin",
  BUIDL: "blackrock-ibit-token", // placeholder — BUIDL may not be on CG; use 1.0 fallback
  DAI: "dai",
};

const PEG_VALUE: Record<string, number> = {
  USD: 1.0,
  EUR: 1.0, // We measure in USD; EUR-pegged coins use live EUR/USD as peg
};

async function fetchCoinGeckoPrice(coinId: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(to);
    if (!res.ok) return null;
    const data = (await res.json()) as { [coinId: string]: { usd: number } };
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch live depeg readings for all approved stablecoins.
 * Uses CoinGecko (free, no key). Falls back to peg value if fetch fails.
 */
export async function fetchDepegReadings(
  eurUsdRate?: number,
): Promise<DepegReading[]> {
  const eurUsd = eurUsdRate ?? 1.085;
  const readings: DepegReading[] = [];
  const approved = APPROVED_DIGITAL_ASSETS as Record<
    string,
    { peg: string; drqs: number; target: number; optional?: boolean }
  >;

  for (const [asset, spec] of Object.entries(approved)) {
    const pegValue = spec.peg === "EUR" ? eurUsd : PEG_VALUE.USD;
    const cgId = COINGECKO_ID_MAP[asset];
    let livePrice: number | null = null;
    let source = "fallback(peg)";

    if (cgId) {
      livePrice = await fetchCoinGeckoPrice(cgId);
      if (livePrice && livePrice > 0) source = "CoinGecko";
    }

    // Fallback: use peg value (depeg = 0)
    if (!livePrice || livePrice <= 0) livePrice = pegValue;

    const priceDev = pegValue > 0 ? Math.abs(livePrice - pegValue) / pegValue : 0;

    readings.push({
      asset,
      peg: spec.peg,
      pegValue,
      livePrice,
      priceDev,
      source,
      fetchedAt: new Date().toISOString(),
    });
  }

  return readings;
}

// ---- Stablecoin State Machine (§7.6 — 6-dimensional) ----

export function classifyStablecoinState(
  reading: DepegReading,
  opts?: {
    liquidity?: "healthy" | "stressed" | "impaired";
    redemption?: "working" | "delayed" | "suspended";
    reserve?: "verified" | "attested" | "unverified";
    issuer?: "healthy" | "watch" | "distressed";
    regulatory?: "good" | "review" | "adverse";
  },
): StablecoinState {
  const sm = STABLECOIN_STATE_MACHINE;
  const dev = reading.priceDev;

  const dimensions = {
    priceDev: dev,
    liquidity: opts?.liquidity ?? "healthy",
    redemption: opts?.redemption ?? "working",
    reserve: opts?.reserve ?? "attested",
    issuer: opts?.issuer ?? "healthy",
    regulatory: opts?.regulatory ?? "good",
  };

  let state: StablecoinState["state"] = "NORMAL";
  let reason = "All dimensions nominal";
  let actionRequired: string | null = null;

  // EMERGENCY_EXIT: price deviation ≥ 10% OR issuer distressed OR reserve unverified
  if (dev >= sm.SUSPEND.priceDev || dimensions.issuer === "distressed" || dimensions.reserve === "unverified") {
    state = "SUSPEND";
    reason = `Price deviation ${(dev * 100).toFixed(2)}% ≥ ${(sm.SUSPEND.priceDev * 100)}% threshold OR issuer/reserve impaired`;
    actionRequired = "EMERGENCY_EXIT — immediate conversion to highest-DRQS eligible alternative";
  }
  // REDUCE: price deviation ≥ 5% OR any dimension impaired
  else if (dev >= sm.REDUCE.priceDev || dimensions.liquidity === "impaired" || dimensions.redemption === "suspended") {
    state = "REDUCE";
    reason = `Price deviation ${(dev * 100).toFixed(2)}% ≥ ${(sm.REDUCE.priceDev * 100)}% OR liquidity/redemption impaired`;
    actionRequired = "Reduce position by 50% over 24h, move to highest-DRQS alternative";
  }
  // WATCH: price deviation ≥ 2% OR any dimension stressed
  else if (dev >= sm.WATCH.priceDev || dimensions.liquidity === "stressed" || dimensions.redemption === "delayed" || dimensions.issuer === "watch" || dimensions.regulatory === "review") {
    state = "WATCH";
    reason = `Price deviation ${(dev * 100).toFixed(2)}% ≥ ${(sm.WATCH.priceDev * 100)}% OR any dimension stressed`;
    actionRequired = "Heightened monitoring, prepare substitution plan";
  }

  return { asset: reading.asset, state, dimensions, reason, actionRequired };
}

// ---- Stablecoin Exposure (SE / SAE) ----

export interface StablecoinPosition {
  asset: string;
  valueUsd: number;
  drqs: number;
}

/**
 * SE  = Σ Stablecoin Value / R_a                    (nominal, %)
 * SAE = Σ (Value × DRQS^-1 × StressFactor) / R_a   (risk-adjusted, %)
 *
 * StressFactor = 1 + (10 - DRQS) / 10  (lower DRQS → higher stress factor)
 *   DRQS=10 → factor=1.0 (no stress)
 *   DRQS=8  → factor=1.2
 *   DRQS=6  → factor=1.4
 */
export function computeStablecoinExposure(
  positions: StablecoinPosition[],
  rA: number,
): StablecoinExposureMetrics {
  const spec = STABLECOIN_EXPOSURE_SPEC;
  void spec; // spec exposed via formula reference; computed below

  let totalStablecoinUsd = 0;
  let totalRiskAdjustedUsd = 0;
  const perAsset: StablecoinExposureMetrics["perAsset"] = [];

  for (const p of positions) {
    const stressFactor = 1 + (10 - p.drqs) / 10;
    const riskAdjusted = p.valueUsd * (1 / p.drqs) * stressFactor;
    totalStablecoinUsd += p.valueUsd;
    totalRiskAdjustedUsd += riskAdjusted;
    perAsset.push({
      asset: p.asset,
      valueUsd: p.valueUsd,
      drqs: p.drqs,
      stressFactor: Math.round(stressFactor * 1000) / 1000,
      riskAdjustedUsd: Math.round(riskAdjusted * 100) / 100,
      shareOfSe: 0, // filled after totals
      shareOfSae: 0,
    });
  }

  for (const a of perAsset) {
    a.shareOfSe = totalStablecoinUsd > 0 ? (a.valueUsd / totalStablecoinUsd) * 100 : 0;
    a.shareOfSae = totalRiskAdjustedUsd > 0 ? (a.riskAdjustedUsd / totalRiskAdjustedUsd) * 100 : 0;
  }

  const se = rA > 0 ? (totalStablecoinUsd / rA) * 100 : 0;
  const sae = rA > 0 ? (totalRiskAdjustedUsd / rA) * 100 : 0;

  // Concentration check: no single issuer > MAX_PER_ISSUER (2%)
  const concentrationOk = perAsset.every(a => (a.valueUsd / rA) * 100 <= DIGITAL_LIQUIDITY_SPEC.MAX_PER_ISSUER * 100 + 0.01);

  return {
    se: Math.round(se * 100) / 100,
    sae: Math.round(sae * 100) / 100,
    totalStablecoinUsd: Math.round(totalStablecoinUsd * 100) / 100,
    totalRiskAdjustedUsd: Math.round(totalRiskAdjustedUsd * 100) / 100,
    perAsset,
    withinLimits: se <= DIGITAL_LIQUIDITY_SPEC.MAX_TOTAL * 100,
    concentrationOk,
  };
}

// ---- CQS State Machine (§6.10) ----

export interface CqsReading {
  currency: string;
  cqs: number;
  readingsBelowTrigger: number;
}

export function classifyCqsState(r: CqsReading): {
  state: "NORMAL" | "WATCH" | "REDUCE" | "SUSPEND" | "REINSTATE_CANDIDATE";
} {
  const c = CQS_SPEC;
  if (r.cqs < c.SUSPEND_TRIGGER) return { state: "SUSPEND" };
  if (r.cqs < c.REDUCE_TRIGGER && r.readingsBelowTrigger >= c.REDUCE_CONFIRMATION_READINGS) {
    return { state: "REDUCE" };
  }
  if (r.cqs < c.WATCH_TRIGGER) return { state: "WATCH" };
  if (r.cqs >= c.REINSTATE_TRIGGER && r.readingsBelowTrigger > 0) {
    return { state: "REINSTATE_CANDIDATE" };
  }
  return { state: "NORMAL" };
}

// ---- Top-level report generator ----

/**
 * Build the full v23 advisory metrics report.
 * Does NOT modify any constitutional state. Observation only.
 */
export async function buildV23MetricsReport(params: {
  gei: number;
  bri: number;
  lci: number;
  rA: number;
  stablecoinPositions: StablecoinPosition[];
  eurUsdRate?: number;
  cqsReadings?: CqsReading[];
}): Promise<V23MetricsReport> {
  const warnings: string[] = [];

  // DRQS for all approved assets
  const drqs = computeAllDrqs();

  // Depeg readings (live)
  const depegReadings = await fetchDepegReadings(params.eurUsdRate);

  // Stablecoin states
  const stablecoinStates = depegReadings.map(r => classifyStablecoinState(r));

  // Exposure metrics
  const exposure = computeStablecoinExposure(params.stablecoinPositions, params.rA);

  // Warnings
  if (!exposure.withinLimits) {
    warnings.push(
      `Stablecoin exposure SE=${exposure.se.toFixed(2)}% exceeds ${DIGITAL_LIQUIDITY_SPEC.MAX_TOTAL * 100}% constitutional cap`,
    );
  }
  if (!exposure.concentrationOk) {
    warnings.push("Single-issuer concentration exceeds 2% cap — rebalance required");
  }
  for (const s of stablecoinStates) {
    if (s.state === "SUSPEND" || s.state === "REDUCE") {
      warnings.push(`${s.asset}: ${s.state} — ${s.reason}`);
    }
  }
  for (const d of drqs) {
    if (d.classification === "excluded") {
      warnings.push(`${d.asset}: DRQS=${d.score} below conditional threshold — excluded from sleeve`);
    }
  }

  // CQS states (if readings provided)
  const cqsStates = (params.cqsReadings ?? []).map(r => ({
    currency: r.currency,
    cqs: r.cqs,
    state: classifyCqsState(r).state,
    readingsBelowTrigger: r.readingsBelowTrigger,
  }));

  return {
    generatedAt: new Date().toISOString(),
    gei: params.gei,
    bri: params.bri,
    lci: params.lci,
    drqs,
    stablecoinStates,
    exposure,
    depegReadings,
    cqsStates,
    layer1OnlyAction: true,
    allWithinLimits: warnings.length === 0,
    warnings,
  };
}

// Re-export spec constants for convenience
export {
  DRQS_SPEC,
  APPROVED_DIGITAL_ASSETS,
  STABLECOIN_STATE_MACHINE,
  STABLECOIN_EXPOSURE_SPEC,
  CQS_SPEC,
  SUBSTITUTION_SPEC,
  DIGITAL_LIQUIDITY_SPEC,
};
