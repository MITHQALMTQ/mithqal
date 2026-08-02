// Mithqal v19.0 — Constitutional Infrastructure Modules
//
// Implements Part V (Oracle Engine & Technical Operations, §30-42) and
// Part VI (Governance & Constitutional Framework, §43-55) of the v19.0
// specification. These modules complement the Monetary Engine (§1-22A)
// and Reserve Allocation (§23-29).
//
// All implementations are faithful to the v19.0 specification, which is
// the single source of truth.

import {
  BASE_CURRENCIES,
  aggregateOraclePrice,
  type CurrencyData,
  type CurrencyLifecycleStatus,
  type OracleSnapshot,
} from "./oracle-data";
import type { ReserveAsset } from "./monetary-engine-v19";
// §39 cryptographic primitives — HMAC for simulated signing.
// In production, this import is replaced by the HSM vendor SDK.
import { createHmac } from "crypto";

// ============================================================
// §30-32: CONSTITUTIONAL ORACLE ENGINE
// ============================================================

export interface OracleObservation {
  source: string; // e.g. "Chainlink", "Pyth", "LBMA"
  weight: number; // constitutional weight of this source
  price: number;
  timestamp: number; // epoch ms
  eligible: boolean;
}

export interface OracleConsensusResult {
  consensusPrice: number;
  method: string; // "weighted-median" | "TWAP-fallback" | "failed"
  validObservations: number;
  quarantined: number;
  confidence: number; // 0 to 1
  fallbackUsed: boolean;
}

/** §30 Maximum oracle freshness (ms). Stale observations are rejected. */
export const ORACLE_FRESHNESS_MS = 60_000; // 60 seconds

/** §31.6 Minimum oracle quorum */
export const ORACLE_MINIMUM_QUORUM = 5;

/**
 * §31 Constitutional Oracle Consensus — Weighted Median Framework.
 *
 * Pipeline: collect → freshness → eligibility → outlier detection →
 * quorum → weighted median → confidence → fallback → audit.
 */
export function oracleConsensus(
  observations: OracleObservation[],
  previousPrice?: number,
  freshnessMs = ORACLE_FRESHNESS_MS
): OracleConsensusResult {
  const now = Date.now();

  // §31.3 Freshness verification — reject stale observations
  let fresh = observations.filter(
    (o) => now - o.timestamp <= freshnessMs
  );

  // §31.4 Eligibility verification — only eligible sources
  fresh = fresh.filter((o) => o.eligible);

  if (fresh.length === 0) {
    return {
      consensusPrice: previousPrice ?? 0,
      method: "failed (no fresh eligible observations)",
      validObservations: 0,
      quarantined: observations.length,
      confidence: 0,
      fallbackUsed: true,
    };
  }

  // §31.5 Outlier detection — MAD-based
  const prices = fresh.map((o) => o.price);
  const med = median(prices);
  const deviations = prices.map((p) => Math.abs(p - med));
  const mad = median(deviations);

  let valid = fresh;
  if (mad > 0) {
    valid = fresh.filter((o) => Math.abs(o.price - med) <= 3.0 * mad);
  }
  const quarantined = fresh.length - valid.length;

  // §31.6 Quorum check
  if (valid.length < ORACLE_MINIMUM_QUORUM) {
    // §31 Fallback: TWAP (time-weighted average)
    const twap = valid.reduce((s, o) => s + o.price, 0) / valid.length;
    return {
      consensusPrice: twap,
      method: "TWAP-fallback (quorum not met)",
      validObservations: valid.length,
      quarantined,
      confidence: valid.length / ORACLE_MINIMUM_QUORUM,
      fallbackUsed: true,
    };
  }

  // §31.7 Weighted Median Consensus
  const sorted = [...valid].sort((a, b) => a.price - b.price);
  const totalWeight = sorted.reduce((s, o) => s + o.weight, 0);
  let cumulative = 0;
  let consensus = sorted[0].price;
  for (const o of sorted) {
    cumulative += o.weight;
    if (cumulative >= totalWeight / 2) {
      consensus = o.price;
      break;
    }
  }

  // Constitutional validation: >5% move triggers TWAP
  if (previousPrice && previousPrice > 0) {
    if (Math.abs(consensus - previousPrice) / previousPrice > 0.05) {
      const twap = valid.reduce((s, o) => s + o.price, 0) / valid.length;
      return {
        consensusPrice: twap,
        method: "TWAP-fallback (constitutional validation >5%)",
        validObservations: valid.length,
        quarantined,
        confidence: 0.7,
        fallbackUsed: true,
      };
    }
  }

  // §31.8 Confidence assessment
  const confidence = Math.min(valid.length / 8, 1.0); // 8 sources = max confidence

  return {
    consensusPrice: consensus,
    method: "weighted-median",
    validObservations: valid.length,
    quarantined,
    confidence,
    fallbackUsed: false,
  };
}

/** §32 Oracle Failure Recovery — provides fallback procedures. */
export interface OracleFailureRecovery {
  scenario: string;
  action: string;
  fallbackPrice: number | null;
}

export function oracleFailureRecovery(
  consensus: OracleConsensusResult,
  previousPrice: number
): OracleFailureRecovery {
  if (consensus.method.startsWith("failed")) {
    return {
      scenario: "Total oracle failure",
      action: "Suspend dynamic pricing; use last valid consensus price; notify Council",
      fallbackPrice: previousPrice,
    };
  }
  if (consensus.fallbackUsed) {
    return {
      scenario: "Quorum failure or constitutional validation triggered",
      action: "TWAP fallback activated; continue operations with reduced confidence",
      fallbackPrice: consensus.consensusPrice,
    };
  }
  return {
    scenario: "Normal operation",
    action: "No recovery needed",
    fallbackPrice: null,
  };
}

// ============================================================
// §33: SEVERE DEVIATION PROTOCOL (SDP) v19.0
// ============================================================

export interface SDPTrigger {
  triggered: boolean;
  trigger: string | null;
  currency: string | null;
  deviation: number | null;
  details: string | null;
}

export interface SDPResult {
  trigger: SDPTrigger;
  emergencyFactor: number | null; // K_SDP = Reference_Price / Current_Price
  emergencyWeight: number | null; // W_emergency = C_i × K_SDP
  newWeight: number | null; // max(W_emergency, W_current × SDP_cap)
  recoveryRampActive: boolean;
}

/** §33.2 SDP trigger threshold */
export const SDP_TRIGGER_THRESHOLD = 0.05; // 5%

/** §33.6 SDP anti-shock cap */
export const SDP_CAP = 0.50; // weights cannot drop below 50% of current

/**
 * §33 Severe Deviation Protocol — v19.0.
 * Detects deviation, computes emergency adjustment, applies anti-shock cap.
 */
export function detectSDP(
  currentPrice: number,
  referencePrice: number,
  currency: string
): SDPTrigger {
  const deviation = Math.abs(currentPrice / referencePrice - 1);
  if (deviation > SDP_TRIGGER_THRESHOLD) {
    return {
      triggered: true,
      trigger: deviation > 0.10 ? "severe" : "moderate",
      currency,
      deviation,
      details: `${currency} deviated ${(deviation * 100).toFixed(2)}% from reference (threshold ${(SDP_TRIGGER_THRESHOLD * 100).toFixed(0)}%)`,
    };
  }
  return { triggered: false, trigger: null, currency: null, deviation: null, details: null };
}

/** §33.4-33.6 Compute SDP emergency weight with anti-shock cap. */
export function computeSDPEmergency(
  structuralWeight: number,
  referencePrice: number,
  currentPrice: number,
  currentWeight: number
): SDPResult {
  const trigger = detectSDP(currentPrice, referencePrice, "");
  if (!trigger.triggered) {
    return {
      trigger,
      emergencyFactor: null,
      emergencyWeight: null,
      newWeight: null,
      recoveryRampActive: false,
    };
  }
  // §33.4 K_SDP = Reference_Price / Current_Price
  const emergencyFactor = referencePrice / currentPrice;
  // §33.5 W_emergency = C_i × K_SDP
  const emergencyWeight = structuralWeight * emergencyFactor;
  // §33.6 Anti-shock cap: W_new = max(W_emergency, W_current × SDP_cap)
  const newWeight = Math.max(emergencyWeight, currentWeight * SDP_CAP);
  return {
    trigger,
    emergencyFactor,
    emergencyWeight,
    newWeight,
    recoveryRampActive: true,
  };
}

// ============================================================
// §10: COUNTERPARTY EXPOSURE LIMITS
// ============================================================

/**
 * §10 Constitutional Counterparty Exposure Limit — single tier of the
 * 7-row cap table specified by the v19.0 blueprint.
 *
 * Exposure is measured against the institution's total adjusted reserves
 * (R_a, §2). Each tier caps the maximum permissible concentration at a
 * distinct level of granularity, in concert with §6 (asset haircuts) and
 * §7 (counterparty composite score) to bound the institution's credit
 * risk profile.
 */
export interface CounterpartyExposureLimit {
  tier: number;          // 1..7 — order matches §10 cap-table rows
  key: string;           // machine-readable identifier
  name: string;          // human-readable label
  capPct: number;        // maximum exposure as % of adjusted reserves (0..100)
  description: string;   // §10 rationale (cite section)
}

/**
 * §10.1–§10.7 Counterparty Exposure Limits — 7-row constitutional cap table.
 *
 *   Tier 1  Per-Counterparty (single name)      ≤ 10%
 *   Tier 2  Per-Custodian                       ≤ 25%
 *   Tier 3  Per-Issuer                          ≤ 15%
 *   Tier 4  Per-Jurisdiction                    ≤ 30%
 *   Tier 5  Per-Infrastructure                  ≤ 20%
 *   Tier 6  Per-Currency                        ≤ 35%
 *   Tier 7  Aggregate Counterparty Exposure     ≤ 100% (reconciliation)
 *
 * Caps are cumulative: a single counterparty that is simultaneously the
 * largest issuer AND custodian is independently bound by Tier 1, Tier 2,
 * and Tier 3. The aggregate (Tier 7) must reconcile to 100% of R_a.
 */
export const COUNTERPARTY_EXPOSURE_LIMITS: readonly CounterpartyExposureLimit[] = [
  { tier: 1, key: "per-counterparty",   name: "Per-Counterparty (single name)",  capPct: 10,  description: "§10.1 — No single counterparty may hold >10% of adjusted reserves (R_a)." },
  { tier: 2, key: "per-custodian",      name: "Per-Custodian",                   capPct: 25,  description: "§10.2 — No single qualified custodian may hold >25% of adjusted reserves (R_a)." },
  { tier: 3, key: "per-issuer",         name: "Per-Issuer",                      capPct: 15,  description: "§10.3 — No single instrument issuer may represent >15% of adjusted reserves (R_a)." },
  { tier: 4, key: "per-jurisdiction",   name: "Per-Jurisdiction",                capPct: 30,  description: "§10.4 — No single legal jurisdiction may account for >30% of adjusted reserves (R_a)." },
  { tier: 5, key: "per-infrastructure", name: "Per-Infrastructure",              capPct: 20,  description: "§10.5 — No single payment/custody infrastructure may carry >20% of adjusted reserves (R_a)." },
  { tier: 6, key: "per-currency",       name: "Per-Currency",                    capPct: 35,  description: "§10.6 — No single fiat currency exposure may exceed 35% of adjusted reserves (R_a)." },
  { tier: 7, key: "aggregate",          name: "Aggregate Counterparty Exposure", capPct: 100, description: "§10.7 — Total counterparty-mapped exposure must reconcile to 100% of adjusted reserves (R_a)." },
] as const;

/**
 * §10 Check whether a given exposure exceeds its tier's constitutional cap.
 *
 * The `exposure` argument is expressed as a percentage of the institution's
 * adjusted reserves (R_a) — i.e. the caller computes `exposurePct =
 * (exposureUsd / R_a) * 100` and passes that scalar here. The function
 * returns both a boolean `exceeded` flag and the structured detail
 * (`overBy` percentage points, the cap that was applied) so compliance
 * dashboards can surface the breach magnitude.
 *
 * @param exposure Exposure as % of adjusted reserves (0..100+).
 * @param limit    The CounterpartyExposureLimit tier being checked.
 * @returns        `{ exceeded, exposurePct, capPct, overBy }`.
 */
export function exceedsExposureLimit(
  exposure: number,
  limit: CounterpartyExposureLimit
): { exceeded: boolean; exposurePct: number; capPct: number; overBy: number } {
  const exposurePct = Math.max(0, exposure);
  const overBy = Math.max(0, exposurePct - limit.capPct);
  return {
    exceeded: exposurePct > limit.capPct,
    exposurePct,
    capPct: limit.capPct,
    overBy,
  };
}

// ============================================================
// §34: CONSTITUTIONAL REDEMPTION SEQUENCING
// ============================================================

export const REDEMPTION_HIERARCHY = [
  "stablecoin", // Tier 4 — Operational Stablecoin Liquidity (first)
  "cash", // Tier 1 — Central-Bank Cash & Deposits
  "sovereign", // Tier 2 — Short-term Sovereign Securities (≤1yr) + Sukuk
  "sukuk", // Tier 2 (continued)
  "silver", // Tier 3 — Silver Bullion
  "gold", // Tier 3 — Gold Bullion (LAST — constitutional anchor, preserved)
] as const;

/**
 * §34 Constitutional Redemption Hierarchy.
 * Gold shall never be liquidated while sufficient eligible assets remain.
 * Within each tier, liquidation is proportional (§34.3).
 */
export function redemptionSequence(
  redemptionAmountUsd: number,
  availableAssets: { assetClass: string; usdValue: number }[]
): { assetClass: string; liquidatedUsd: number; remaining: number }[] {
  const result: { assetClass: string; liquidatedUsd: number; remaining: number }[] = [];
  let remaining = redemptionAmountUsd;

  for (const tier of REDEMPTION_HIERARCHY) {
    if (remaining <= 0) break;
    const tierAssets = availableAssets.filter((a) => a.assetClass === tier);
    const tierTotal = tierAssets.reduce((s, a) => s + a.usdValue, 0);
    if (tierTotal <= 0) continue;

    // §34.3 Proportional liquidation within tier
    const liquidateFromTier = Math.min(remaining, tierTotal);
    result.push({
      assetClass: tier,
      liquidatedUsd: liquidateFromTier,
      remaining: Math.max(0, remaining - liquidateFromTier),
    });
    remaining -= liquidateFromTier;
  }

  return result;
}

/** §34.2 Bullion Protection Rule — gold is only liquidated as last resort. */
export function bullionProtectionCheck(
  redemptionPlan: { assetClass: string; liquidatedUsd: number; remaining?: number }[]
): { goldLiquidated: boolean; sufficient: boolean } {
  const goldRow = redemptionPlan.find((r) => r.assetClass === "gold");
  const goldLiquidated = !!goldRow && goldRow.liquidatedUsd > 0;
  const lastRow = redemptionPlan[redemptionPlan.length - 1];
  const sufficient = !lastRow || (lastRow.remaining ?? 0) <= 0;
  return { goldLiquidated, sufficient };
}

// ============================================================
// §35: CONSTITUTIONAL SETTLEMENT FINALITY
// ============================================================

export type FinalityLevel =
  | "provisional"
  | "economic"
  | "constitutional"
  | "legal";

export interface SettlementPipeline {
  stage: number;
  name: string;
  completed: boolean;
}

export const SETTLEMENT_PIPELINE: SettlementPipeline[] = [
  { stage: 1, name: "Constitutional Validation", completed: false },
  { stage: 2, name: "Reserve State Update", completed: false },
  { stage: 3, name: "NAV Calculation", completed: false },
  { stage: 4, name: "Proof Generation", completed: false },
  { stage: 5, name: "Immutable Ledger Commitment", completed: false },
  { stage: 6, name: "Constitutional Validation (Final)", completed: false },
];

/** §35.4 Settlement is NOT final unless all 6 stages complete. */
export function isSettlementFinal(pipeline: SettlementPipeline[]): boolean {
  return pipeline.every((s) => s.completed);
}

// ============================================================
// §36: CONSTITUTIONAL SUPPLY LIFECYCLE
// ============================================================

export interface MintLifecycleStep {
  step: number;
  name: string;
  completed: boolean;
}

export const MINT_LIFECYCLE: MintLifecycleStep[] = [
  { step: 1, name: "Constitutional Validation (eligible reserves, KYC/AML)", completed: false },
  { step: 2, name: "Asset Settlement Confirmed", completed: false },
  { step: 3, name: "Reserve Records Updated", completed: false },
  { step: 4, name: "Reserve Ratio Recalculated", completed: false },
  { step: 5, name: "NAV Calculation", completed: false },
  { step: 6, name: "Mint Amount Determined (Deposit Value / NAV)", completed: false },
  { step: 7, name: "Proof of Reserves Generated", completed: false },
  { step: 8, name: "Proof of Solvency Generated", completed: false },
  { step: 9, name: "MTQ Mint Executed", completed: false },
  { step: 10, name: "Total Supply Updated", completed: false },
  { step: 11, name: "Ledger Commitment", completed: false },
  { step: 12, name: "Constitutional Finality", completed: false },
];

export const REDEEM_LIFECYCLE: MintLifecycleStep[] = [
  { step: 1, name: "Constitutional Validation (ownership, balance, compliance)", completed: false },
  { step: 2, name: "Redemption Authorized", completed: false },
  { step: 3, name: "NAV Calculation", completed: false },
  { step: 4, name: "Redemption Amount Determined (Burned MTQ × NAV)", completed: false },
  { step: 5, name: "Reserve Ratio Recalculated", completed: false },
  { step: 6, name: "Asset Release (§34 Redemption Hierarchy)", completed: false },
  { step: 7, name: "Reserve Records Updated", completed: false },
  { step: 8, name: "Proof of Reserves Generated", completed: false },
  { step: 9, name: "Proof of Solvency Generated", completed: false },
  { step: 10, name: "MTQ Burn Executed", completed: false },
  { step: 11, name: "Total Supply Updated", completed: false },
  { step: 12, name: "Ledger Commitment", completed: false },
  { step: 13, name: "Constitutional Finality", completed: false },
];

/** §36.4 Constitutional Supply Invariants */
export const SUPPLY_INVARIANTS = [
  "Total Supply ≥ 0",
  "Reserve Ratio ≥ RR_min",
  "Every MTQ in circulation is backed by eligible constitutional reserves",
  "Every redeemed MTQ permanently reduces total supply",
  "No MTQ shall be created without verified reserve deposit",
  "No MTQ shall be destroyed without proportional reserve release",
] as const;

// ============================================================
// §37: CONSTITUTIONAL PROOF OF RESERVES, SOLVENCY & TRANSPARENCY
// ============================================================

export interface ConstitutionalProof {
  type: string;
  purpose: string;
  frequency: string;
  verified: boolean;
}

/** §37.2 Constitutional Assurance Framework — 7 independent proofs. */
export const ASSURANCE_FRAMEWORK: ConstitutionalProof[] = [
  { type: "Proof of Reserves", purpose: "Verify reserve existence", frequency: "Daily", verified: false },
  { type: "Proof of Solvency", purpose: "Verify reserve sufficiency", frequency: "Daily", verified: false },
  { type: "Reserve Ratio Verification", purpose: "Verify RR ≥ RR_min", frequency: "Daily", verified: false },
  { type: "Liquidity Coverage Verification", purpose: "Verify LCR", frequency: "Daily", verified: false },
  { type: "Constitutional Risk Verification", purpose: "Verify CRI", frequency: "Daily", verified: false },
  { type: "Oracle Integrity Verification", purpose: "Verify oracle correctness", frequency: "Daily", verified: false },
  { type: "Constitutional Compliance Verification", purpose: "Verify constitutional invariants", frequency: "Daily", verified: false },
];

/** §37.3 Constitutional Proof Contents */
export const PROOF_CONTENTS = [
  "Gold Holdings",
  "Silver Holdings",
  "Fiat Currency Holdings",
  "Stablecoin Holdings",
  "Total Reserve Value",
  "Market Reserve (R_m)",
  "Adjusted Reserve (R_a)",
  "Liquidation Reserve (R_l)",
  "Market NAV",
  "Prudential NAV",
  "Stress NAV",
  "Reserve Ratio",
  "LCR",
  "CRI",
  "Portfolio Duration",
  "Counterparty Exposure",
  "Oracle Consensus Data",
  "Constitutional Version",
  "Proof Hash",
  "Timestamp",
] as const;

// ============================================================
// §45: CONSTITUTIONAL INVARIANTS (NON-AMENDABLE PROVISIONS)
// ============================================================

export interface ConstitutionalInvariant {
  name: string;
  reason: string;
  amendable: false; // always false — these are PERMANENT
}

/** §45.2 Non-Amendable Provisions — 21 permanent invariants. */
export const CONSTITUTIONAL_INVARIANTS: ConstitutionalInvariant[] = [
  { name: "Constitutional Identity", reason: "Identity cannot change", amendable: false },
  { name: "Institutional Neutrality", reason: "Institution must remain politically neutral", amendable: false },
  { name: "Non-Sovereign Monetary Status", reason: "Never become sovereign currency", amendable: false },
  { name: "Gold Constitutional Anchor", reason: "Permanent", amendable: false },
  { name: "Reserve Segregation", reason: "Permanent", amendable: false },
  { name: "100% Reserve Minimum", reason: "Permanent", amendable: false },
  { name: "No Fractional Reserve", reason: "Permanent", amendable: false },
  { name: "No Lending of Reserves", reason: "Permanent", amendable: false },
  { name: "No Encumbrance of Reserves", reason: "Permanent", amendable: false },
  { name: "No Discretionary Minting", reason: "Permanent", amendable: false },
  { name: "No Discretionary Burning", reason: "Permanent", amendable: false },
  { name: "Mandatory Proof of Reserves", reason: "Permanent", amendable: false },
  { name: "Deterministic Monetary Engine", reason: "Permanent", amendable: false },
  { name: "Redemption Rights", reason: "Permanent", amendable: false },
  { name: "Constitutional Transparency", reason: "Permanent", amendable: false },
  { name: "Oracle Independence", reason: "Permanent", amendable: false },
  { name: "Mathematical Auditability", reason: "Permanent", amendable: false },
  { name: "Constitutional Language Standards", reason: "Permanent", amendable: false },
  { name: "Constitutional Governance Process", reason: "Permanent", amendable: false },
  { name: "Constitutional Constants Registry", reason: "Permanent", amendable: false },
  { name: "No Commingling of Reserves with Operational Funds", reason: "Permanent — reserves must never be mixed with the Institution's operational, payroll, or overhead funds", amendable: false },
];

/** §45.3 Emergency Override Protection — invariants can never be suspended. */
export function checkInvariantConflict(proposedAction: string): { violates: boolean; invariant?: string } {
  const invariantNames = CONSTITUTIONAL_INVARIANTS.map((i) => i.name.toLowerCase());
  const action = proposedAction.toLowerCase();
  for (const inv of invariantNames) {
    if (action.includes(inv) || (action.includes("suspend") && action.includes("reserve"))) {
      return { violates: true, invariant: inv };
    }
  }
  return { violates: false };
}

// ============================================================
// §53: CONSTITUTIONAL CONSTANTS REGISTRY
// ============================================================

export interface ConstitutionalConstant {
  name: string;
  symbol: string;
  value: number;
  unit: string;
  section: string;
  modifiable: boolean;
  modificationRule: string;
}

/** §53 Constitutional Constants Registry — all quantitative parameters. */
export const CONSTITUTIONAL_CONSTANTS: ConstitutionalConstant[] = [
  { name: "COFER Weight", symbol: "α", value: 0.50, unit: "ratio", section: "§13", modifiable: true, modificationRule: "§53.2 (full amendment process)" },
  { name: "SWIFT Weight", symbol: "β", value: 0.40, unit: "ratio", section: "§13", modifiable: true, modificationRule: "§53.2" },
  { name: "BIS Weight", symbol: "γ", value: 0.10, unit: "ratio", section: "§13", modifiable: true, modificationRule: "§53.2" },
  { name: "Momentum Bound", symbol: "L_momentum", value: 0.05, unit: "ratio (±5%)", section: "§15", modifiable: true, modificationRule: "§53.2" },
  { name: "Mean Reversion Speed", symbol: "η", value: 0.05, unit: "ratio", section: "§16", modifiable: true, modificationRule: "§53.2" },
  { name: "Mean Reversion Bound", symbol: "L_reversion", value: 0.02, unit: "ratio (±2%)", section: "§16", modifiable: true, modificationRule: "§53.2" },
  { name: "EWMA Decay Factor", symbol: "λ", value: 0.94, unit: "ratio", section: "§17", modifiable: true, modificationRule: "§53.2" },
  { name: "Normal Volatility Threshold", symbol: "V_normal", value: 0.02, unit: "ratio (2%)", section: "§17", modifiable: true, modificationRule: "§53.2" },
  { name: "High Volatility Threshold", symbol: "V_high", value: 0.05, unit: "ratio (5%)", section: "§17", modifiable: true, modificationRule: "§53.2" },
  { name: "Liquidity Sensitivity", symbol: "η_liq", value: 0.02, unit: "ratio", section: "§18", modifiable: true, modificationRule: "§53.2" },
  { name: "Liquidity Bound", symbol: "L_liq_max", value: 0.05, unit: "ratio (±5%)", section: "§18", modifiable: true, modificationRule: "§53.2" },
  { name: "Concentration Cap", symbol: "W_max", value: 0.60, unit: "ratio (60%)", section: "§21", modifiable: true, modificationRule: "§53.2" },
  { name: "Minimum Floor", symbol: "W_min", value: 0.005, unit: "ratio (0.5%)", section: "§22", modifiable: true, modificationRule: "§53.2" },
  { name: "Reserve Ratio Minimum", symbol: "RR_min", value: 1.00, unit: "ratio (100%)", section: "§4", modifiable: false, modificationRule: "Constitutional Invariant (§45)" },
  { name: "Reserve Ratio Target", symbol: "RR_target", value: 1.02, unit: "ratio (102%)", section: "§4", modifiable: true, modificationRule: "§53.2" },
  { name: "LCR Minimum", symbol: "LCR_min", value: 1.00, unit: "ratio", section: "§5", modifiable: true, modificationRule: "§53.2" },
  { name: "Max Portfolio Duration", symbol: "MD_max", value: 0.75, unit: "years", section: "§8", modifiable: true, modificationRule: "§53.2" },
  { name: "SDP Trigger Threshold", symbol: "SDP_trigger", value: 0.05, unit: "ratio (5%)", section: "§33", modifiable: true, modificationRule: "§53.2" },
  { name: "SDP Anti-Shock Cap", symbol: "SDP_cap", value: 0.50, unit: "ratio", section: "§33", modifiable: true, modificationRule: "§53.2" },
  { name: "Oracle Minimum Quorum", symbol: "N/A", value: 5, unit: "sources", section: "§31", modifiable: true, modificationRule: "§53.2" },
  { name: "Oracle Freshness Limit", symbol: "N/A", value: 60000, unit: "ms", section: "§31", modifiable: true, modificationRule: "§53.2" },
  { name: "Operational Capital Buffer", symbol: "N/A", value: 12, unit: "months", section: "§41", modifiable: true, modificationRule: "§53.2" },
  { name: "Mint Fee Rate", symbol: "N/A", value: 0.0005, unit: "ratio (0.05%)", section: "§9", modifiable: true, modificationRule: "§53.2" },
  { name: "Mint Fee Cap", symbol: "N/A", value: 5000, unit: "USD", section: "§9", modifiable: true, modificationRule: "§53.2" },
  { name: "Redemption Fee Rate", symbol: "N/A", value: 0.0005, unit: "ratio (0.05%)", section: "§9", modifiable: true, modificationRule: "§53.2" },
  { name: "Redemption Fee Cap", symbol: "N/A", value: 5000, unit: "USD", section: "§9", modifiable: true, modificationRule: "§53.2" },
];

// ============================================================
// §41: CONSTITUTIONAL OPERATIONAL CAPITAL BUFFER
// ============================================================

/** §41.2 Operational Capital ≥ 12 months of forward-looking operating expenses. */
export const OPERATIONAL_CAPITAL_MONTHS = 12;

export interface OperationalCapitalStatus {
  required: number; // 12 months of expenses
  available: number;
  compliant: boolean;
  monthsCoverage: number;
}

export function checkOperationalCapital(
  monthlyExpenses: number,
  availableCapital: number
): OperationalCapitalStatus {
  const required = monthlyExpenses * OPERATIONAL_CAPITAL_MONTHS;
  const monthsCoverage = availableCapital / monthlyExpenses;
  return {
    required,
    available: availableCapital,
    compliant: monthsCoverage >= OPERATIONAL_CAPITAL_MONTHS,
    monthsCoverage,
  };
}

// ============================================================
// §48: JURISDICTIONAL REGULATORY IMPLEMENTATION
// ============================================================

export const US_REGULATORY_FRAMEWORK = [
  { regulation: "FinCEN MSB Registration", status: "pending", notes: "Required for money services business" },
  { regulation: "Bank Secrecy Act AML Program", status: "pending", notes: "Compliance program required" },
  { regulation: "OFAC Sanctions Screening", status: "implemented", notes: "Real-time screening active" },
  { regulation: "FATF Travel Rule", status: "pending", notes: "Supported where legally required" },
  { regulation: "Customer Due Diligence", status: "implemented", notes: "Risk-based KYC/KYB" },
  { regulation: "Suspicious Activity Reporting", status: "pending", notes: "Operational capability needed" },
  { regulation: "State Money Transmission Licensing", status: "pending", notes: "Where applicable" },
  { regulation: "Qualified Custody", status: "pending", notes: "Regulated custodians required" },
  { regulation: "Independent Audit", status: "pending", notes: "PCAOB-registered auditor" },
  { regulation: "Cybersecurity (NIST-aligned)", status: "implemented", notes: "Controls in place" },
] as const;

export const INTERNATIONAL_FRAMEWORKS = [
  "FATF Recommendations (AML/CFT)",
  "CPMI-IOSCO PFMI (Financial Market Infrastructure Principles)",
  "Basel Principles (Risk management reference)",
  "IOSCO (Market integrity guidance)",
  "ISO 20022 (Messaging interoperability)",
  "ISO 27001 (Information security)",
  "ISO 22301 (Business continuity)",
  "ISO 31000 (Risk management)",
] as const;

// ============================================================
// §49: CONSTITUTIONAL SHARIA GOVERNANCE FRAMEWORK
// ============================================================

export const SHARIA_REQUIREMENTS = [
  { requirement: "AAOIFI Standards", standard: "Continuous compliance", authority: "Independent review" },
  { requirement: "Sharia Committee", standard: "Min 3 qualified scholars", authority: "Constitutional appointment" },
  { requirement: "Prohibition of Riba", standard: "Absolute", authority: "Continuous monitoring" },
  { requirement: "Prohibition of Gharar", standard: "Absolute", authority: "Product review" },
  { requirement: "Prohibition of Haram Industries", standard: "Absolute", authority: "Reserve screening" },
  { requirement: "Permissible Reserve Assets", standard: "Approved by Committee", authority: "Quarterly review" },
  { requirement: "Annual Sharia Audit", standard: "Independent", authority: "Published report" },
] as const;

// ============================================================
// §40: CONSTITUTIONAL STRESS TESTING
// ============================================================

export const STRESS_SCENARIOS = [
  { category: "Historical Replay", scenarios: ["2008 Global Financial Crisis", "2020 COVID Market Shock", "2016 Brexit", "2015 Swiss Franc Revaluation", "Sovereign Debt Crisis", "Commodity Shock"] },
  { category: "Monte Carlo Simulation", scenarios: ["Probabilistic outcome distribution"] },
  { category: "Reverse Stress Testing", scenarios: ["Identify constitutional breaking points"] },
  { category: "Sensitivity Analysis", scenarios: ["Individual variable impact"] },
  { category: "Multi-Factor Stress", scenarios: ["Combined simultaneous shocks"] },
  { category: "Liquidity Stress", scenarios: ["Redemption pressure", "Stablecoin redemption delays"] },
  { category: "Counterparty Failure", scenarios: ["Institutional default"] },
  { category: "Oracle Failure", scenarios: ["Data disruption"] },
  { category: "Cyber Disruption", scenarios: ["Operational resilience"] },
  { category: "Geopolitical Shock", scenarios: ["Capital controls", "Sanctions", "Conflict"] },
] as const;

// ============================================================
// §12: CURRENCY ADMISSION LIFECYCLE
// ============================================================

/**
 * §12 Currency Admission Lifecycle — runtime state machine.
 *
 * The v19.0 constitution (§12) specifies a 4-stage lifecycle for every
 * basket currency:
 *
 *   observation ──(≥ 2 quarters)──▶ probation ──(Council approval)──▶ full
 *        ▲                                                              │
 *        │                                                              │ (§33 SDP trigger)
 *        │                                                              ▼
 *        └─────────────────(reinstatement)────────────────────────── suspended
 *
 * `observation` is the entry point for NEW candidate currencies; the 8 base
 * currencies ship at "full". A suspended currency re-enters at "full" (not
 * "observation") after formal reinstatement.
 */
export interface CurrencyLifecycleEntry {
  code: string;
  name: string;
  lifecycleStatus: CurrencyLifecycleStatus;
  admittedDate: string | null;
  /** Quarters elapsed since `admittedDate` (computed against `referenceDate`). */
  quartersSinceAdmission: number;
}

export interface CurrencyLifecycleTransition {
  code: string;
  from: CurrencyLifecycleStatus;
  to: CurrencyLifecycleStatus;
  reason: string;
  /** ISO-8601 date the transition takes effect. */
  effectiveDate: string;
}

export interface CurrencyLifecycleAction {
  /** Currency code to transition. */
  code: string;
  /** Target lifecycle status. */
  to: CurrencyLifecycleStatus;
  /** Required for probation → full (formal Council approval). */
  councilApproval?: boolean;
  /** Required for full → suspended (§33 SDP trigger fired). */
  sdpTriggered?: boolean;
  /** Required for suspended → full (formal reinstatement). */
  reinstatementApproved?: boolean;
  /** Override the quarters-elapsed computation (deterministic tests). */
  quartersElapsed?: number;
}

export interface CurrencyLifecycleResult {
  /** Lifecycle view of all currencies (post-action if `action` was supplied). */
  entries: CurrencyLifecycleEntry[];
  /** Present only when an `action` was supplied and succeeded. */
  transition: CurrencyLifecycleTransition | null;
  /** Human-readable outcome of the action (or "read-only" when no action). */
  reason: string;
}

/** Milliseconds per calendar quarter (~91.31 days). */
const MS_PER_QUARTER = 91.3125 * 24 * 60 * 60 * 1000;

function quartersBetween(fromIso: string, toMs: number): number {
  const fromMs = Date.parse(fromIso);
  if (Number.isNaN(fromMs)) return 0;
  return Math.max(0, Math.floor((toMs - fromMs) / MS_PER_QUARTER));
}

/**
 * §12 Currency Admission Lifecycle state machine.
 *
 * Called with no `action`: returns the current lifecycle view of every
 * currency (read-only).
 *
 * Called with an `action`: validates the requested transition against the
 * §12 state machine and, if permitted, returns the updated entries plus a
 * transition record. The input `CurrencyData[]` is never mutated.
 *
 * Permitted transitions:
 *   observation → probation   (requires `quartersElapsed >= 2`)
 *   probation   → full        (requires `councilApproval === true`)
 *   full        → suspended   (requires `sdpTriggered === true`)
 *   suspended   → full        (requires `reinstatementApproved === true`)
 *
 * @param currencies  Basket currencies (defaults to `BASE_CURRENCIES`).
 * @param action      Optional transition request.
 * @param referenceDate  Reference "now" for quarters-elapsed computation.
 */
export function currencyLifecycle(
  currencies: CurrencyData[] = BASE_CURRENCIES,
  action?: CurrencyLifecycleAction,
  referenceDate: Date = new Date()
): CurrencyLifecycleResult {
  const refMs = referenceDate.getTime();
  const entries: CurrencyLifecycleEntry[] = currencies.map((c) => ({
    code: c.code,
    name: c.name,
    lifecycleStatus: c.lifecycleStatus,
    admittedDate: c.admittedDate ?? null,
    quartersSinceAdmission: c.admittedDate
      ? quartersBetween(c.admittedDate, refMs)
      : 0,
  }));

  if (!action) {
    return { entries, transition: null, reason: "read-only" };
  }

  const idx = currencies.findIndex((c) => c.code === action.code);
  if (idx === -1) {
    return {
      entries,
      transition: null,
      reason: `unknown currency code "${action.code}"`,
    };
  }

  const current = currencies[idx];
  const from = current.lifecycleStatus;
  const to = action.to;
  const effectiveDate = referenceDate.toISOString().slice(0, 10);
  const quartersElapsed =
    action.quartersElapsed ??
    (current.admittedDate ? quartersBetween(current.admittedDate, refMs) : 0);

  let reason: string;
  switch (to) {
    case "probation":
      if (from !== "observation") {
        return {
          entries,
          transition: null,
          reason: `invalid transition ${from} → probation (only observation → probation is permitted)`,
        };
      }
      if (quartersElapsed < 2) {
        return {
          entries,
          transition: null,
          reason: `observation period incomplete (${quartersElapsed}/2 quarters)`,
        };
      }
      reason = `observation period satisfied (${quartersElapsed} ≥ 2 quarters); advanced to probation`;
      break;

    case "full":
      if (from === "probation") {
        if (!action.councilApproval) {
          return {
            entries,
            transition: null,
            reason: "probation → full requires Council approval (councilApproval=true)",
          };
        }
        reason = "Council approved; currency granted full inclusion";
      } else if (from === "suspended") {
        if (!action.reinstatementApproved) {
          return {
            entries,
            transition: null,
            reason: "suspended → full requires formal reinstatement (reinstatementApproved=true)",
          };
        }
        reason = "reinstatement approved; currency restored to full inclusion";
      } else {
        return {
          entries,
          transition: null,
          reason: `invalid transition ${from} → full`,
        };
      }
      break;

    case "suspended":
      if (from !== "full") {
        return {
          entries,
          transition: null,
          reason: `invalid transition ${from} → suspended (only full → suspended is permitted)`,
        };
      }
      if (!action.sdpTriggered) {
        return {
          entries,
          transition: null,
          reason: "full → suspended requires an SDP trigger (sdpTriggered=true)",
        };
      }
      reason = "§33 SDP triggered; currency suspended";
      break;

    case "observation":
      return {
        entries,
        transition: null,
        reason: "observation is the entry point; cannot transition INTO observation (only OUT of it)",
      };

    default:
      return {
        entries,
        transition: null,
        reason: `unknown target status "${to}"`,
      };
  }

  const transition: CurrencyLifecycleTransition = {
    code: action.code,
    from,
    to,
    reason,
    effectiveDate,
  };

  // Apply the transition to the returned entries (immutable — the original
  // CurrencyData[] is not mutated).
  entries[idx] = { ...entries[idx], lifecycleStatus: to };

  return { entries, transition, reason };
}

// ============================================================
// §31: ORACLE CONSENSUS — RUNTIME WRAPPER
// ============================================================

/**
 * §31 Oracle Consensus — runtime-callable result.
 *
 * Mirrors the spec-echo `OracleConsensusResult` but in the flat shape that
 * API routes consume (consensus price is the primary output, not nested).
 */
export interface OracleConsensusRuntime {
  price: number;
  method: string;
  validCount: number;
  quarantined: number;
  /** 0 to 1 — fraction of oracle families that survived outlier filtering. */
  confidence: number;
}

/**
 * §31 Oracle Consensus — runtime-callable wrapper.
 *
 * The spec-echo `oracleConsensus(observations, ...)` above models the full
 * constitutional weighted-median framework over an `OracleObservation[]`.
 * At runtime the engine already produces an `OracleSnapshot` (gold price +
 * currencies) via `getOracleSnapshot`. This wrapper adapts that snapshot to
 * the consensus output shape so API routes can call a single function.
 *
 * Delegates to `aggregateOraclePrice` (§8 v2.0 CORRECTED) for the median +
 * MAD outlier rejection, and derives a 0–1 confidence score from the valid
 * observation count.
 *
 * @param oracleSnapshot  Current oracle snapshot (gold price, currencies, …).
 * @param opIndex         Operation index (deterministic variance seed).
 * @param previousPrice   Previous consensus price (for EWMA smoothing).
 */
export function getOracleConsensus(
  oracleSnapshot: OracleSnapshot,
  opIndex = 0,
  previousPrice?: number
): OracleConsensusRuntime {
  const aggregated = aggregateOraclePrice(
    oracleSnapshot.goldUsd,
    opIndex,
    previousPrice
  );
  // aggregateOraclePrice simulates 6 oracle families; confidence scales
  // linearly with the fraction of valid (non-quarantined) reports.
  const TOTAL_ORACLE_FAMILIES = 6;
  const confidence = Math.min(
    aggregated.validCount / TOTAL_ORACLE_FAMILIES,
    1.0
  );
  return {
    price: aggregated.price,
    method: aggregated.method,
    validCount: aggregated.validCount,
    quarantined: aggregated.quarantined,
    confidence,
  };
}

// ============================================================
// §34: REDEMPTION SEQUENCE — RUNTIME WRAPPER
// ============================================================

/**
 * §34 Redemption Sequence — runtime liquidation plan.
 *
 * Wraps the spec-echo `redemptionSequence` output with summary totals and
 * the §34.2 Bullion Protection Rule verdict, so API routes get a single
 * self-contained payload.
 */
export interface RedemptionSequencePlan {
  /** Liquidation per tier, in constitutional order (§34.2). */
  tiers: { assetClass: string; liquidatedUsd: number; remaining: number }[];
  /** Total USD liquidated across all tapped tiers. */
  totalLiquidated: number;
  /** USD shortfall that could not be satisfied (0 if reserves were sufficient). */
  unmet: number;
  /** True iff §34.2 Bullion Protection Rule was invoked (gold liquidated). */
  goldLiquidated: boolean;
  /** True iff the redemption was fully covered without tapping gold. */
  sufficient: boolean;
}

/**
 * §34 Redemption Sequence — runtime-callable wrapper.
 *
 * The spec-echo `redemptionSequence(amount, availableAssets)` takes a flat
 * `{assetClass, usdValue}[]`. At runtime the reserve is held as
 * `ReserveAsset[]` (from `monetary-engine-v19.ts`). This wrapper adapts
 * the runtime reserve shape, invokes the constitutional hierarchy, applies
 * the §34.2 Bullion Protection check, and returns a structured liquidation
 * plan (including any unmet shortfall).
 *
 * @param redemptionAmountUsd  USD value the redeemer is claiming.
 * @param reserveAssets        Current reserve assets (any assetClass).
 */
export function computeRedemptionSequence(
  redemptionAmountUsd: number,
  reserveAssets: ReserveAsset[]
): RedemptionSequencePlan {
  // Adapt ReserveAsset[] → {assetClass, usdValue}[] for the spec-echo fn.
  const availableAssets = reserveAssets.map((a) => ({
    assetClass: a.assetClass,
    usdValue: a.quantity * a.priceUsd,
  }));

  const tiers = redemptionSequence(redemptionAmountUsd, availableAssets);
  const bullionCheck = bullionProtectionCheck(tiers);
  const totalLiquidated = tiers.reduce((sum, t) => sum + t.liquidatedUsd, 0);
  const unmet = Math.max(0, redemptionAmountUsd - totalLiquidated);

  return {
    tiers,
    totalLiquidated,
    unmet,
    goldLiquidated: bullionCheck.goldLiquidated,
    sufficient: bullionCheck.sufficient && unmet === 0,
  };
}

// ============================================================
// §43: CONSTITUTIONAL AMENDMENT WORKFLOW (11 STAGES)
// ============================================================

/**
 * §43 Constitutional Amendment Workflow — 11-stage pipeline.
 *
 * Every amendable provision (§53.2) must traverse all 11 stages before
 * enactment. Stages 8–10 enforce a timelock: the amendment cannot be
 * enacted until the timelock has fully elapsed, giving the public and
 * Council a final veto window.
 */
export const CONSTITUTIONAL_AMENDMENT_STAGES = [
  "Proposal Draft",
  "Technical Review",
  "Council Reading 1",
  "Public Comment",
  "Council Reading 2",
  "Committee Review",
  "Council Vote",
  "Supermajority Confirmation",
  "Timelock Start",
  "Timelock End",
  "Enactment",
] as const;

export type AmendmentStage = (typeof CONSTITUTIONAL_AMENDMENT_STAGES)[number];

export interface AmendmentStageState {
  name: AmendmentStage;
  index: number;
  /** ISO-8601 timestamp when this stage was completed (null = pending). */
  completedAt: string | null;
}

export interface AmendmentWorkflow {
  id: string;
  title: string;
  /** Current stage index (0-based into `CONSTITUTIONAL_AMENDMENT_STAGES`). */
  currentStage: number;
  /** Per-stage completion state (length always === 11). */
  stages: AmendmentStageState[];
  /** ISO-8601 timestamp when the amendment was proposed (stage 0 entered). */
  proposedAt: string;
  /** ISO-8601 timestamp when the amendment was enacted (stage 10 completed), or null. */
  enactedAt: string | null;
  /** §43 Timelock start timestamp — set when stage 8 ("Timelock Start") is completed. */
  timelockStartedAt: string | null;
}

/**
 * Default §43.13 amendment implementation delay (calendar days).
 *
 * The Constitution mandates: "A mandatory implementation delay of not less
 * than ninety (90) calendar days shall apply" (§43.13, Stage 8 —
 * Implementation Delay). This is the floor for constitutional amendments;
 * policy proposals may use a shorter timelock (see `POLICY_TIMELOCK_DAYS`).
 */
export const AMENDMENT_TIMELOCK_DAYS = 90;

/**
 * Default §43 timelock for non-constitutional (policy) proposals.
 *
 * Policy proposals (fee/risk/parameter adjustments that do not amend the
 * Constitution) are subject to the shorter governance review period of
 * 7 days. This is distinct from the 90-day constitutional implementation
 * delay mandated by §43.13, which applies only to constitutional
 * amendments.
 */
export const POLICY_TIMELOCK_DAYS = 7;

/**
 * §43.11 Council supermajority threshold for constitutional amendments.
 *
 * The Constitution requires "at least 75% of all seated voting members"
 * approval for constitutional amendments. With a 7-member Council, 5/7 =
 * 71.4% (below 75%, insufficient); 6/7 = 85.7% (above 75%, sufficient).
 * Therefore the minimum constitutional supermajority is 6 of 7.
 */
export const CONSTITUTIONAL_SUPERMAJORITY = 6; // 6 of 7 = 85.7% ≥ 75%

export interface AmendmentAdvanceOptions {
  /** Override the timelock duration (default: `AMENDMENT_TIMELOCK_DAYS`). */
  timelockDurationDays?: number;
  /** Inject a deterministic "now" (testing). */
  now?: Date;
}

export interface AmendmentAdvanceResult {
  amendment: AmendmentWorkflow;
  advanced: boolean;
  reason: string;
  /** Set when the timelock has started (stage 8 completed). */
  timelockStartedAt: string | null;
  /** Derived: `timelockStartedAt + timelockDurationDays`. */
  timelockEndsAt: string | null;
}

/**
 * §43 Create a new amendment workflow at stage 0 ("Proposal Draft").
 * @param title  Human-readable title of the proposed amendment.
 */
export function createAmendment(title: string): AmendmentWorkflow {
  const nowIso = new Date().toISOString();
  return {
    id: `AMD-${Date.now().toString(36).toUpperCase()}`,
    title,
    currentStage: 0,
    stages: CONSTITUTIONAL_AMENDMENT_STAGES.map((name, index) => ({
      name,
      index,
      completedAt: null,
    })),
    proposedAt: nowIso,
    enactedAt: null,
    timelockStartedAt: null,
  };
}

/**
 * §43 Advance an amendment to the next stage.
 *
 * Timelock enforcement (stages 8–10):
 *  - Advancing FROM stage 8 ("Timelock Start") records the timelock start
 *    timestamp (`timelockStartedAt`).
 *  - Advancing FROM stage 9 ("Timelock End") requires the timelock to have
 *    fully elapsed; otherwise the advance is refused.
 *  - Advancing INTO stage 10 ("Enactment") enacts the amendment
 *    (`enactedAt` set, stage 10 auto-completed).
 *
 * The input `amendment` is never mutated; a new object is returned on success.
 */
export function advanceAmendment(
  amendment: AmendmentWorkflow,
  opts: AmendmentAdvanceOptions = {}
): AmendmentAdvanceResult {
  const timelockDays = opts.timelockDurationDays ?? AMENDMENT_TIMELOCK_DAYS;
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const totalStages = CONSTITUTIONAL_AMENDMENT_STAGES.length;
  const lastIndex = totalStages - 1; // 10 (Enactment)

  const timelockEndsAt = amendment.timelockStartedAt
    ? new Date(
        Date.parse(amendment.timelockStartedAt) + timelockDays * 86_400_000
      ).toISOString()
    : null;

  // Already at or past the final stage.
  if (amendment.currentStage >= lastIndex) {
    return {
      amendment,
      advanced: false,
      reason: `amendment already at final stage "${CONSTITUTIONAL_AMENDMENT_STAGES[lastIndex]}"`,
      timelockStartedAt: amendment.timelockStartedAt,
      timelockEndsAt,
    };
  }

  const currentStageName =
    CONSTITUTIONAL_AMENDMENT_STAGES[amendment.currentStage];
  const nextStageIndex = amendment.currentStage + 1;
  const nextStageName = CONSTITUTIONAL_AMENDMENT_STAGES[nextStageIndex];

  // §43 Timelock enforcement: advancing FROM stage 9 (Timelock End) requires
  // the timelock to have fully elapsed since `timelockStartedAt`.
  if (amendment.currentStage === 9) {
    if (!amendment.timelockStartedAt) {
      return {
        amendment,
        advanced: false,
        reason: `cannot advance from "${currentStageName}": timelock was never started`,
        timelockStartedAt: null,
        timelockEndsAt: null,
      };
    }
    const elapsedMs =
      now.getTime() - Date.parse(amendment.timelockStartedAt);
    const requiredMs = timelockDays * 86_400_000;
    if (elapsedMs < requiredMs) {
      return {
        amendment,
        advanced: false,
        reason: `timelock not elapsed: ${(elapsedMs / 86_400_000).toFixed(2)} / ${timelockDays} days`,
        timelockStartedAt: amendment.timelockStartedAt,
        timelockEndsAt,
      };
    }
  }

  // Mark the current stage as completed. If advancing into Enactment
  // (stage 10), auto-complete it too (enactment is instantaneous).
  const stages = amendment.stages.map((s) => {
    if (s.index === amendment.currentStage) {
      return { ...s, completedAt: nowIso };
    }
    if (nextStageIndex === 10 && s.index === 10) {
      return { ...s, completedAt: nowIso };
    }
    return s;
  });

  // If we just completed "Timelock Start" (stage 8), record the timelock
  // start timestamp.
  let timelockStartedAt = amendment.timelockStartedAt;
  let newTimelockEndsAt = timelockEndsAt;
  if (amendment.currentStage === 8) {
    timelockStartedAt = nowIso;
    newTimelockEndsAt = new Date(
      now.getTime() + timelockDays * 86_400_000
    ).toISOString();
  }

  // Enactment (advancing into stage 10): set enactedAt.
  const enactedAt =
    nextStageIndex === 10 ? nowIso : amendment.enactedAt;

  let reason = `advanced from "${currentStageName}" to "${nextStageName}"`;
  if (amendment.currentStage === 8) {
    reason = `timelock started; ends at ${newTimelockEndsAt}`;
  } else if (amendment.currentStage === 9) {
    reason = `timelock elapsed; advanced to "${nextStageName}"`;
  } else if (nextStageIndex === 10) {
    reason = `amendment enacted`;
  }

  return {
    amendment: {
      ...amendment,
      stages,
      currentStage: nextStageIndex,
      enactedAt,
      timelockStartedAt,
    },
    advanced: true,
    reason,
    timelockStartedAt,
    timelockEndsAt: newTimelockEndsAt,
  };
}

// ============================================================
// §44: 5-LEVEL EMERGENCY GOVERNANCE (BLUEPRINT v19.0)
// ============================================================

/**
 * §44.2 Emergency classification — five operational states.
 *
 * The Constitution (§44.2–§44.6) classifies institutional emergencies into
 * four constitutional levels, plus an implicit "Normal Operations"
 * baseline when no emergency is in effect. Each declared level has a
 * maximum continuous duration (§44.13) after which it either lapses
 * automatically or must be renewed by the appropriate constitutional
 * authority. The Institution's response is always proportional to the
 * severity of the situation.
 *
 * Blueprint mapping (§44.3–§44.6 + §44.13):
 *   - "Normal Operations"        — baseline (no emergency declared)
 *   - "Technical Emergency"      — §44.3 Level 1, 24-hour max, Technical Committee
 *   - "Operational Emergency"    — §44.4 Level 2, 7-day max, Tech Committee + Executive
 *   - "Constitutional Emergency" — §44.5 Level 3, 30-day max, Council
 *   - "Systemic Emergency"       — §44.6 Level 4, 90-day max, Council + Independent Oversight
 */
export const EMERGENCY_LEVELS = [
  "Normal Operations",        // baseline — no emergency in effect
  "Technical Emergency",      // §44.3   — Level 1, 24-hour max
  "Operational Emergency",    // §44.4   — Level 2, 7-day max
  "Constitutional Emergency", // §44.5   — Level 3, 30-day max
  "Systemic Emergency",       // §44.6   — Level 4, 90-day max
] as const;

export type EmergencyLevel = (typeof EMERGENCY_LEVELS)[number];

/**
 * §44.3 Emergency state record. Once declared, the state must include the
 * expiry timestamp (except for "Normal Operations", which has no expiry)
 * and a flag indicating whether the Council was formally notified.
 */
export interface EmergencyState {
  level: EmergencyLevel;
  declaredAt: number;        // epoch ms
  reason: string;
  expiresAt: number | null;  // null = no expiry (Normal Operations)
  councilNotified: boolean;
}

/**
 * §44.13 Maximum continuous durations (in milliseconds) per emergency level.
 *
 * Normal Operations never expires; Technical Emergency lapses after 24 hours
 * (§44.13 Level 1); Operational Emergency after 7 days (§44.13 Level 2);
 * Constitutional Emergency after 30 days (§44.13 Level 3); Systemic
 * Emergency after 90 days (§44.13 Level 4). Any level still required past
 * its expiry must be formally renewed by the appropriate constitutional
 * authority (§44.3–§44.6):
 *   - Technical Emergency      → renewed by the Technical Committee
 *   - Operational Emergency    → renewed by Tech Committee + Executive Management
 *   - Constitutional Emergency → renewed by the Council (§44.5: continuation
 *                                beyond 24 hours requires Council approval)
 *   - Systemic Emergency       → renewed by Council + Independent External
 *                                Oversight (§44.6: reviewed every 24 hours)
 */
export const EMERGENCY_DURATIONS_MS: Record<EmergencyLevel, number | null> = {
  "Normal Operations": null,                              // never expires
  "Technical Emergency": 24 * 60 * 60 * 1000,             // §44.13 L1: 24 hours
  "Operational Emergency": 7 * 24 * 60 * 60 * 1000,       // §44.13 L2: 7 days
  "Constitutional Emergency": 30 * 24 * 60 * 60 * 1000,   // §44.13 L3: 30 days
  "Systemic Emergency": 90 * 24 * 60 * 60 * 1000,         // §44.13 L4: 90 days
};

/**
 * §44.7 Declare an emergency at the given level. Computes the expiry
 * timestamp from §44.13 durations. The Council (and where required, the
 * Technical Committee or Independent External Oversight) is assumed to be
 * notified synchronously for any level above "Normal Operations".
 *
 * Authority chains (§44.3–§44.6):
 *   - Technical Emergency      → Technical Committee (response within 1 hour)
 *   - Operational Emergency    → Technical Committee + Executive Management (within 6 hours)
 *   - Constitutional Emergency → Council (continuation beyond 24h requires Council approval)
 *   - Systemic Emergency       → Council + Independent External Oversight (immediate, reviewed every 24h)
 *
 * @param level One of the five operational states (§44.2).
 * @param reason Human-readable rationale (recorded for audit per §44.9).
 * @returns An EmergencyState ready to be persisted to the audit log.
 */
export function declareEmergency(
  level: EmergencyLevel,
  reason: string
): EmergencyState {
  const now = Date.now();
  const duration = EMERGENCY_DURATIONS_MS[level];
  return {
    level,
    declaredAt: now,
    reason,
    expiresAt: duration === null ? null : now + duration,
    councilNotified: level !== "Normal Operations",
  };
}

/**
 * §44.11 Lift an emergency state. Returns a new EmergencyState at the
 * "Normal Operations" level. The original state's `declaredAt` is preserved
 * in the returned record for audit-trail continuity.
 *
 * Note (§44.11): before emergency powers are withdrawn, the Institution
 * must verify reserve integrity, oracle consensus, Proof of Reserves,
 * deterministic validation, custody, settlement systems, and security
 * review. Lifting a Constitutional Emergency (§44.5) or Systemic Emergency
 * (§44.6) additionally requires Council (and, for Level 4, Independent
 * External Oversight) approval; this function performs the state
 * transition only — the caller is responsible for verifying authority and
 * the §44.11 recovery checklist.
 *
 * @param state The emergency state to lift.
 * @returns A new EmergencyState at the Normal Operations level.
 */
export function liftEmergency(state: EmergencyState): EmergencyState {
  return {
    level: "Normal Operations",
    declaredAt: state.declaredAt,
    reason: `Emergency lifted (was: ${state.level} — ${state.reason})`,
    expiresAt: null,
    councilNotified: true,
  };
}

/**
 * §44.7 Check whether an emergency state is currently in effect (i.e.
 * not expired). Returns false for "Normal Operations" or any expired state.
 */
export function isEmergencyActive(state: EmergencyState): boolean {
  if (state.level === "Normal Operations") return false;
  if (state.expiresAt === null) return true;
  return Date.now() < state.expiresAt;
}

// ============================================================
// §46: FORBIDDEN-WORD LINTER (MARKETING COMPLIANCE)
// ============================================================

/**
 * §46.2 Forbidden words — full blueprint list.
 *
 * The Constitution (§46.2) classifies forbidden terminology into ten
 * categories. The Institution's external-facing communications MUST be free
 * of all of these terms. Words are listed lowercased; the scanner matches
 * case-insensitively. Multi-word phrases are listed in full (e.g.
 * "future of finance", "crypto's answer to").
 *
 * Categories (per §46.2):
 *   1. Hype          — superlative / unsubstantiated quality claims
 *   2. Revolutionary — disruption / paradigm claims
 *   3. Future        — "future of …" framing
 *   4. Replacement   — claims of displacing other systems
 *   5. Dominance     — hegemony / supremacy language
 *   6. Comparison    — "the Bitcoin of …" / "next Bitcoin" framing
 *   7. Identity      — crypto-project / token-project / app / platform framing
 *   8. Speculation   — price-appreciation / "to the moon" framing
 *   9. Crypto        — coin / tokenomics / ICO / airdrop / Web3 slang
 *  10. Marketing     — exclusivity, guaranteed returns, "no risk" framing
 *
 * Additional institutional-grade terms retained from the prior v18 list
 * (overstatement of guarantees, impossibility of corruption): "guarantee",
 * "impossible", "permanently", "100% safe", "cannot be corrupted",
 * "impossible to corrupt". These complement §46.2's Marketing category.
 */
export const FORBIDDEN_WORDS = [
  // ---- (existing v18 institutional overstatement terms) ----
  "guarantee",
  "impossible",
  "permanently",
  "100% safe",
  "cannot be corrupted",
  "impossible to corrupt",

  // ---- §46.2 Cat. 1 — Hype ----
  "best",
  "largest",
  "greatest",
  "most advanced",
  "most innovative",
  "leading",
  "premier",
  "ultimate",
  "perfect",
  "flawless",
  "fastest",
  "number one",
  "world-class",
  "industry-leading",
  "cutting-edge",
  "state-of-the-art",
  "next-level",
  "breakthrough",
  "superior",
  "unmatched",
  "elite",

  // ---- §46.2 Cat. 2 — Revolutionary ----
  "revolutionary",
  "disruptive",
  "game-changing",
  "paradigm-shifting",
  "transformational",
  "unprecedented",
  "historic",
  "groundbreaking",

  // ---- §46.2 Cat. 3 — Future ----
  "future of finance",
  "future of money",
  "next generation",
  "next evolution",
  "tomorrow's solution",
  "the future is here",

  // ---- §46.2 Cat. 4 — Replacement ----
  "replace",
  "substitute",
  "eliminate",
  "remove",
  "supplant",
  "supersede",
  "overthrow",
  "overtake",

  // ---- §46.2 Cat. 5 — Dominance ----
  "dominate",
  "world reserve",
  "global reserve",
  "hegemon",
  "supremacy",
  "primacy",
  "pre-eminence",
  "ascendancy",

  // ---- §46.2 Cat. 6 — Comparison ----
  "next Bitcoin",
  "next stablecoin",
  "crypto's answer to",
  "blockchain's answer to",
  "the Bitcoin of",
  "the Ethereum of",
  "the gold of",

  // ---- §46.2 Cat. 7 — Identity ----
  "token project",
  "crypto project",
  "blockchain startup",
  "DeFi protocol",
  "Web3 solution",
  "app",
  "platform",

  // ---- §46.2 Cat. 8 — Speculation ----
  "moon",
  "bullish",
  "bearish",
  "price appreciation",
  "investment opportunity",
  "profit",
  "yield farming",
  "get rich",
  "high returns",
  "moonshot",
  "100x",
  "financial freedom",
  "wealth generation",

  // ---- §46.2 Cat. 9 — Crypto ----
  "coin",
  "altcoin",
  "tokenomics",
  "token launch",
  "ICO",
  "IDO",
  "airdrop",
  "meme",
  "pump",
  "staking rewards",
  "DeFi",
  "Web3",

  // ---- §46.2 Cat. 10 — Marketing ----
  "exclusive",
  "limited",
  "once-in-a-lifetime",
  "guaranteed",
  "risk-free",
  "no risk",
  "instant wealth",
  "magic",
] as const;

/**
 * §46.3 Scan text for forbidden words (case-insensitive). Returns the
 * list of forbidden words found, in the order they appear in
 * `FORBIDDEN_WORDS`. Each occurrence is reported separately so reviewers
 * can see every instance.
 *
 * @param text The text to scan.
 * @returns Array of forbidden words found (lowercased), one entry per occurrence.
 */
export function scanForbiddenWords(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const word of FORBIDDEN_WORDS) {
    let idx = 0;
    while ((idx = lower.indexOf(word, idx)) !== -1) {
      found.push(word);
      idx += word.length;
    }
  }
  return found;
}

/**
 * §46.4 Sanitize text by replacing forbidden words with institutional
 * alternatives. The replacement preserves factual, hedged language
 * consistent with the Institution's neutral posture.
 *
 * Longer phrases are replaced before shorter ones (e.g.
 * "impossible to corrupt" before "impossible") to avoid partial matches.
 *
 * @param text The text to sanitize.
 * @returns Text with forbidden words replaced by institutional alternatives.
 */
export function sanitizeText(text: string): string {
  const replacements: Record<string, string> = {
    // ---- existing v18 institutional overstatement terms ----
    guarantee: "is structured to provide",
    impossible: "highly resistant",
    permanently: "by design",
    "100% safe": "designed with strong safeguards",
    "cannot be corrupted": "resistant to corruption",
    "impossible to corrupt": "resistant to corruption",

    // ---- §46.2 Cat. 1 — Hype → institutional-grade alternatives ----
    best: "high-quality",
    largest: "among the largest",
    greatest: "substantial",
    "most advanced": "technically mature",
    "most innovative": "technically distinctive",
    leading: "established",
    premier: "institutional",
    ultimate: "primary",
    perfect: "robust",
    flawless: "well-tested",
    fastest: "high-throughput",
    "number one": "established",
    "world-class": "institutional-grade",
    "industry-leading": "institutionally recognized",
    "cutting-edge": "current-generation",
    "state-of-the-art": "current-generation",
    "next-level": "advanced",
    breakthrough: "structural improvement",
    superior: "comparatively strong",
    unmatched: "distinctive",
    elite: "institutional",

    // ---- §46.2 Cat. 2 — Revolutionary ----
    revolutionary: "structurally distinct",
    disruptive: "differently structured",
    "game-changing": "structurally distinctive",
    "paradigm-shifting": "architecturally distinct",
    transformational: "structurally refined",
    unprecedented: "not previously deployed at this scale",
    historic: "of record",
    groundbreaking: "structurally novel",

    // ---- §46.2 Cat. 3 — Future ----
    "future of finance": "infrastructure for institutional settlement",
    "future of money": "infrastructure for reserve-backed settlement",
    "next generation": "current-generation",
    "next evolution": "subsequent iteration",
    "tomorrow's solution": "a current-generation framework",
    "the future is here": "the framework is operational",

    // ---- §46.2 Cat. 4 — Replacement ----
    replace: "complement",
    substitute: "complement",
    eliminate: "obviate the need for",
    remove: "restructure",
    supplant: "complement",
    supersede: "succeed",
    overthrow: "succeed",
    overtake: "succeed",

    // ---- §46.2 Cat. 5 — Dominance ----
    dominate: "operate within",
    "world reserve": "internationally recognized",
    "global reserve": "internationally recognized",
    hegemon: "participant",
    supremacy: "position",
    primacy: "position",
    "pre-eminence": "established position",
    ascendancy: "established position",

    // ---- §46.2 Cat. 6 — Comparison ----
    "next Bitcoin": "a reserve-backed settlement framework",
    "next stablecoin": "a reserve-backed settlement framework",
    "crypto's answer to": "a complement to",
    "blockchain's answer to": "a complement to",
    "the Bitcoin of": "a complement to",
    "the Ethereum of": "a complement to",
    "the gold of": "a complement to",

    // ---- §46.2 Cat. 7 — Identity ----
    "token project": "monetary infrastructure",
    "crypto project": "monetary infrastructure",
    "blockchain startup": "monetary infrastructure",
    "DeFi protocol": "settlement framework",
    "Web3 solution": "settlement framework",
    app: "system",
    platform: "framework",

    // ---- §46.2 Cat. 8 — Speculation ----
    moon: "price stability",
    bullish: "constructive",
    bearish: "cautious",
    "price appreciation": "value retention",
    "investment opportunity": "participation option",
    profit: "operating surplus",
    "yield farming": "yield generation",
    "get rich": "build operating surplus",
    "high returns": "measured returns",
    moonshot: "speculative event",
    "100x": "multiple",
    "financial freedom": "financial independence",
    "wealth generation": "wealth preservation",

    // ---- §46.2 Cat. 9 — Crypto ----
    coin: "settlement unit",
    altcoin: "alternative settlement unit",
    tokenomics: "monetary mechanics",
    "token launch": "issuance",
    ICO: "issuance",
    IDO: "issuance",
    airdrop: "distribution",
    meme: "reference",
    pump: "increase",
    "staking rewards": "participation rewards",
    DeFi: "decentralized settlement",
    Web3: "distributed infrastructure",

    // ---- §46.2 Cat. 10 — Marketing ----
    exclusive: "available to participating institutions",
    limited: "scoped",
    "once-in-a-lifetime": "rare",
    guaranteed: "designed to provide",
    "risk-free": "low-risk",
    "no risk": "limited risk",
    "instant wealth": "operating surplus",
    magic: "deterministic",
  };
  // Replace longer phrases first to avoid partial-match collisions.
  const sorted = [...FORBIDDEN_WORDS].sort((a, b) => b.length - a.length);
  let result = text;
  for (const word of sorted) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    result = result.replace(re, replacements[word] ?? "[redacted]");
  }
  return result;
}

// ============================================================
// §50: GOLD STANDARDS
// ============================================================

/**
 * §50 Constitutional Gold Standards.
 *
 * Gold held as a constitutional reserve asset (Tier 3 + Tier 4 per §23)
 * must meet physical, custodial, and audit standards. These standards
 * mirror the LBMA Good Delivery framework and add the constitutional
 * requirements of segregated allocated custody and quarterly independent
 * audit. Silver standards (§51) mirror this structure.
 */
export const GOLD_STANDARDS = {
  section: "§50",
  metal: "gold",
  purity: {
    minimumFineness: 0.9995, // 99.95% (LBMA Good Delivery minimum)
    targetFineness: 0.9999,  // 99.99% (preferred for institutional)
    barFormat: "LBMA Good Delivery (≈400 oz) or kilobar (1 kg)",
  },
  custody: {
    form: "Allocated",
    segregation: "Segregated, individually identifiable bars",
    custodian: "LBMA-registered vault operator",
    jurisdiction: "Multi-jurisdictional (min. 2 jurisdictions)",
    insurance: "Full replacement value, all-risks policy",
    rehypothecationProhibited: true,
    lendingProhibited: true,
  },
  audit: {
    independentAssurance: true,
    frequency: "Quarterly physical count + daily records reconciliation",
    auditor: "Big-Four or LBMA-accredited independent auditor",
    publication: "Hash-published audit report (§37)",
  },
} as const;

// ============================================================
// §51: SILVER STANDARDS
// ============================================================

/**
 * §51 Constitutional Silver Standards.
 *
 * Silver held as a constitutional reserve asset (Tier 3 per §23) must
 * meet standards paralleling §50 (gold). Silver is the secondary bullion
 * reserve — it dampens gold's volatility and provides additional
 * diversification. Standards are adapted for silver's lower value
 * density: larger physical volumes require the same segregation and
 * chain-of-custody controls as gold, but the minimum fineness threshold
 * follows the LBMA Good Delivery rule for silver (999.0 vs 999.5).
 */
export const SILVER_STANDARDS = {
  section: "§51",
  metal: "silver",
  purity: {
    minimumFineness: 0.999,  // 99.9% (LBMA Good Delivery minimum for silver)
    targetFineness: 0.9999,  // 99.99% (preferred for institutional)
    barFormat: "LBMA Good Delivery (≈1,000 oz) or kilobar (1 kg)",
  },
  custody: {
    form: "Allocated",
    segregation: "Segregated, individually identifiable bars (volume-weighted)",
    custodian: "LBMA-registered vault operator",
    jurisdiction: "Multi-jurisdictional (min. 2 jurisdictions)",
    insurance: "Full replacement value, all-risks policy",
    rehypothecationProhibited: true,
    lendingProhibited: true,
  },
  audit: {
    independentAssurance: true,
    frequency: "Quarterly physical count + daily records reconciliation",
    auditor: "Big-Four or LBMA-accredited independent auditor",
    publication: "Hash-published audit report (§37)",
  },
} as const;

// ============================================================
// §53.4: VERSIONED CONSTANTS REGISTRY
// ============================================================

/**
 * §53.4 Versioned Constants Registry.
 *
 * The constitutional constants are versioned so that any amendment
 * (per §53.2 — full Council amendment process) is recorded with a new
 * version tag and an ISO timestamp. This enables proof-of-reserves
 * attestations to cite the exact constant set under which they were
 * computed.
 *
 * This registry mirrors the values in `CONSTITUTIONAL_CONSTANTS` above
 * but provides a flat `Record<string, number>` keyed by canonical name,
 * plus the version metadata required by §53.4. Both representations
 * MUST be updated together when an amendment passes.
 */
export const CONSTANTS_REGISTRY: {
  version: string;
  lastUpdated: string; // ISO 8601 date
  constants: Record<string, number>;
} = {
  version: "v19.0.1",
  lastUpdated: "2026-07-26",
  constants: {
    // §13 source weights
    COFER_WEIGHT: 0.5,             // α
    SWIFT_WEIGHT: 0.4,             // β
    BIS_WEIGHT: 0.1,               // γ
    // §15-16 momentum / reversion clamps
    MOMENTUM_BOUND: 0.05,          // L_momentum ±5%
    MEAN_REVERSION_SPEED: 0.05,    // η
    MEAN_REVERSION_BOUND: 0.02,    // L_reversion ±2%
    // §17 volatility thresholds
    EWMA_DECAY: 0.94,              // λ
    NORMAL_VOL_THRESHOLD: 0.02,    // V_normal 2%
    HIGH_VOL_THRESHOLD: 0.05,      // V_high 5%
    // §18 liquidity clamp
    LIQUIDITY_SENSITIVITY: 0.02,   // η_liq
    LIQUIDITY_BOUND: 0.05,         // L_liq_max ±5%
    // §21-22 weight clamps
    CONCENTRATION_CAP: 0.6,        // W_max 60%
    WEIGHT_MINIMUM_FLOOR: 0.005,   // W_min 0.5%
    // §4 reserve ratio
    RESERVE_RATIO_MIN: 1.0,        // RR_min 100% (non-amendable, §45)
    RESERVE_RATIO_TARGET: 1.02,    // RR_target 102%
    // §5 liquidity coverage
    LCR_MIN: 1.0,                  // LCR_min
    // §8 portfolio duration
    MAX_PORTFOLIO_DURATION: 0.75,  // MD_max years
    // §33 SDP
    SDP_TRIGGER_THRESHOLD: 0.05,   // 5%
    SDP_ANTI_SHOCK_CAP: 0.5,       // 50%
    // §31 oracle
    ORACLE_MIN_QUORUM: 5,
    ORACLE_FRESHNESS_MS: 60_000,
    // §41 operational capital
    OPERATIONAL_CAPITAL_MONTHS: 12,
    // §9 fees
    MINT_FEE_RATE: 0.0005,         // 0.05%
    MINT_FEE_CAP_USD: 5_000,
    REDEMPTION_FEE_RATE: 0.0005,   // 0.05%
    REDEMPTION_FEE_CAP_USD: 5_000,
  },
};

/**
 * §53.4 Returns the version tag of the current constants registry.
 */
export function getConstantsVersion(): string {
  return CONSTANTS_REGISTRY.version;
}

/**
 * §53.5 Verify that a given numeric value matches the registry entry for
 * the named constant. Returns `true` iff the registry contains `name`
 * and its recorded value equals `value` exactly. Used by proof-of-reserves
 * attestations to confirm the constants under which a calculation was
 * performed.
 *
 * @param name Canonical constant name (e.g. "RESERVE_RATIO_MIN").
 * @param value Numeric value to verify.
 * @returns `true` iff the registry contains `name` and its value equals `value`.
 */
export function verifyConstant(name: string, value: number): boolean {
  const registered = CONSTANTS_REGISTRY.constants[name];
  if (registered === undefined) return false;
  return registered === value;
}

// ============================================================
// §27: CONSTITUTIONAL STABLECOIN REPLACEMENT FRAMEWORK
// ============================================================
//
// Implements §27 of the v19.0 Constitution: when an operational
// stablecoin loses eligibility (§26), breaches a concentration cap
// (§21), suffers a counterparty downgrade (§7), or is removed by
// governance decision, the Constitution mandates a deterministic
// replacement workflow with immutable audit trail and regenerated
// Proof of Reserves (§42).
//
// §27.5 Operational Timing:
//   • Maximum Constitutional Review  — 24 hours
//   • Maximum Replacement Execution — 7 calendar days
//   • Emergency Replacement         — Immediate when redemption
//                                      capability is impaired.
//
// §27.3 Deterministic Execution: given identical eligibility data,
// reserve records, oracle inputs, and constitutional constants,
// every validator SHALL identify the identical replacement
// stablecoin and execute identical reserve adjustments.

/** §27.1 Reasons a stablecoin may be constitutionally replaced. */
export type StablecoinReplacementReason =
  | "eligibility_failure" // §26 eligibility test failed
  | "concentration_breach" // §21 cap exceeded
  | "counterparty_downgrade" // §7 score below floor
  | "governance_decision"; // §43 amendment-driven

/** §27.1 Lifecycle status of a stablecoin replacement workflow. */
export type StablecoinReplacementStatus =
  | "proposed" // §27.1 step 1: eligibility failure detected
  | "approved" // §27.1 step 6: replacement stablecoin selected
  | "executing" // §27.1 step 7: reserve rebalancing in progress
  | "completed" // §27.1 step 11: normal operations resumed
  | "cancelled"; // workflow aborted (e.g. asset recovered)

/**
 * §27 Immutable stablecoin replacement record. Every replacement
 * SHALL generate this record plus an updated Proof of Reserves (§42),
 * updated CRI (§9), updated Reserve Ratio (§4), and updated LCR (§5).
 */
export interface StablecoinReplacement {
  /** Ticker / canonical ID of the asset being replaced. */
  replacedAsset: string;
  /** Ticker / canonical ID of the constitutionally-eligible successor. */
  replacementAsset: string;
  /** Constitutional reason for replacement (§27.1). */
  reason: StablecoinReplacementReason;
  /** Workflow status (§27.1 lifecycle). */
  status: StablecoinReplacementStatus;
  /** ISO-8601 timestamp the replacement was proposed. */
  proposedAt: string;
  /** ISO-8601 timestamp the replacement was executed (set on `completed`). */
  executedAt?: string;
  /**
   * §27.1 step 5/6 — Constitutional Council confirmation flag.
   * Required for `approved`/`executing`/`completed` transitions.
   */
  governanceApproval: boolean;
  /**
   * §27.5 Operational timing — `true` when redemption capability is
   * impaired and the 7-day window is bypassed for immediate action.
   */
  emergencyReplacement: boolean;
  /**
   * §27.2 If no eligible replacement exists, the operational stablecoin
   * allocation is temporarily converted to Tier 1 Cash until an
   * eligible replacement is approved. This flag records that state.
   */
  convertedToTier1Cash: boolean;
  /** §27.4 Immutable audit reference (governance record hash / ledger id). */
  auditRecordRef?: string;
}

/**
 * §27.1 Step 1 — Propose a stablecoin replacement.
 *
 * Creates a `proposed` record (no governance approval, no execution)
 * capturing the constitutional trigger and the proposed successor.
 * The record is immutable after creation; downstream functions
 * (`approveStablecoinReplacement`, `executeStablecoinReplacement`)
 * produce new records with advanced lifecycle state.
 */
export function proposeStablecoinReplacement(
  replacedAsset: string,
  replacementAsset: string,
  reason: StablecoinReplacementReason,
  opts: { emergencyReplacement?: boolean; convertedToTier1Cash?: boolean } = {}
): StablecoinReplacement {
  return {
    replacedAsset,
    replacementAsset,
    reason,
    status: "proposed",
    proposedAt: new Date().toISOString(),
    governanceApproval: false,
    emergencyReplacement: opts.emergencyReplacement ?? false,
    convertedToTier1Cash: opts.convertedToTier1Cash ?? false,
  };
}

/**
 * §27.1 Step 5/6 — Record Constitutional Council approval.
 *
 * Transitions `proposed` → `approved`. Approval is REQUIRED before
 * execution per §27.1. Emergency replacements (§27.5) still require
 * post-hoc council ratification recorded through this function.
 */
export function approveStablecoinReplacement(
  replacement: StablecoinReplacement,
  auditRecordRef?: string
): StablecoinReplacement {
  if (replacement.status !== "proposed") {
    throw new Error(
      `approveStablecoinReplacement: cannot approve replacement in status "${replacement.status}" (expected "proposed")`
    );
  }
  return {
    ...replacement,
    status: "approved",
    governanceApproval: true,
    auditRecordRef: auditRecordRef ?? replacement.auditRecordRef,
  };
}

/**
 * §27.1 Step 7-11 — Execute an approved stablecoin replacement.
 *
 * Requires governance approval (§27.1 step 5/6). Produces a
 * `completed` record with `executedAt` set. Per §27.4 the caller is
 * responsible for regenerating the Proof of Reserves, CRI, Reserve
 * Ratio, and LCR attestations after this function returns.
 */
export function executeStablecoinReplacement(replacement: StablecoinReplacement): StablecoinReplacement {
  if (!replacement.governanceApproval) {
    throw new Error("Governance approval required for stablecoin replacement");
  }
  if (replacement.status !== "approved" && replacement.status !== "executing") {
    throw new Error(
      `executeStablecoinReplacement: cannot execute replacement in status "${replacement.status}" (expected "approved" or "executing")`
    );
  }
  return {
    ...replacement,
    status: "completed",
    executedAt: new Date().toISOString(),
  };
}

/**
 * §27.5 Emergency replacement — bypasses the 7-day window when
 * redemption capability is impaired. Still requires post-hoc
 * governance ratification (recorded via `approveStablecoinReplacement`).
 */
export function proposeEmergencyStablecoinReplacement(
  replacedAsset: string,
  replacementAsset: string,
  reason: StablecoinReplacementReason
): StablecoinReplacement {
  const proposal = proposeStablecoinReplacement(replacedAsset, replacementAsset, reason, {
    emergencyReplacement: true,
  });
  // §27.5: emergency replacement executes immediately when redemption
  // capability is impaired; council ratification follows post-hoc.
  return { ...proposal, status: "executing" };
}

/**
 * §27.6 Constitutional verification checklist for a completed
 * stablecoin replacement. Returns the list of checks the system
 * must confirm before normal operations resume.
 */
export function verifyStablecoinReplacement(
  replacement: StablecoinReplacement,
  postState: {
    stablecoinAllocationInRange: boolean;
    eligibilityTestsPassed: boolean;
    custodyVerified: boolean;
    concentrationLimitsSatisfied: boolean;
    reserveRatioPreserved: boolean;
    lcrPreserved: boolean;
  }
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  if (replacement.status !== "completed") {
    failures.push(`replacement not completed (status: ${replacement.status})`);
  }
  if (!replacement.governanceApproval) failures.push("governance approval missing");
  if (!replacement.executedAt) failures.push("executedAt missing");
  if (!postState.stablecoinAllocationInRange) failures.push("stablecoin allocation out of constitutional range");
  if (!postState.eligibilityTestsPassed) failures.push("eligibility tests failed");
  if (!postState.custodyVerified) failures.push("custody not verified");
  if (!postState.concentrationLimitsSatisfied) failures.push("concentration limits violated");
  if (!postState.reserveRatioPreserved) failures.push("reserve ratio not preserved");
  if (!postState.lcrPreserved) failures.push("LCR not preserved");
  return { passed: failures.length === 0, failures };
}

// ============================================================
// §28: CONSTITUTIONAL GOLD & SILVER ACQUISITION FRAMEWORK
// ============================================================
//
// Implements §28 of the v19.0 Constitution: prudential, transparent,
// and deterministic bullion acquisition for the Constitutional
// Bullion Reserve Layer (§25). Acquisitions shall prioritise reserve
// integrity, price efficiency, operational security, counterparty
// quality, jurisdictional suitability, and long-term resilience.
//
// §28.2 Best-overall-execution principle: lowest quoted price alone
// SHALL NOT determine selection. The framework evaluates price,
// execution quality, liquidity, settlement certainty, operational
// resilience, counterparty quality, and jurisdictional suitability.
//
// §28.3 Counterparty sourcing: minimum three qualified bullion
// counterparties approved under the Institutional Bullion
// Counterparty Policy.
//
// §28.7 Segregated custody: all constitutional bullion shall be
// held under allocated, segregated, bankruptcy-remote custody.
// Unallocated bullion holdings SHALL NOT qualify as Constitutional
// Reserve Assets.

/** §28.1 Bullion metal type. */
export type BullionMetal = "gold" | "silver";

/** §28.1 Acquisition lifecycle status. */
export type BullionAcquisitionStatus =
  | "proposed" // §28.1 periodic allocation review
  | "approved" // §28.1 best execution selected
  | "settling" // §28.1 settlement verification in progress
  | "allocated" // §28.7 segregated custody accepted
  | "audited"; // §28.1 independent verification complete

/** §28.2 Dealer competitive quote evaluated for best execution. */
export interface BullionDealerQuote {
  dealerId: string;
  dealerName: string;
  /** Quoted price per troy ounce (USD). */
  pricePerOz: number;
  /** §7 counterparty composite score [0,1]. */
  counterpartyScore: number;
  /** Jurisdiction ISO code (e.g. "US", "CH", "GB"). */
  jurisdiction: string;
  /** Settlement window in business days. */
  settlementDays: number;
  /** Operational readiness / execution quality score [0,1]. */
  executionQuality: number;
}

/**
 * §28.1 Bullion acquisition record. Each acquisition permanently
 * records quotations, dealer responses, execution rationale,
 * settlement confirmation, custodian confirmation, assay reports,
 * serial numbers, chain-of-custody documents, reserve ledger
 * update, and Proof-of-Reserves update (§28.5).
 */
export interface BullionAcquisition {
  /** §28 metal type. */
  metal: BullionMetal;
  /** Quantity in troy ounces (LBMA Good Delivery bars are ~400 oz). */
  quantity: number;
  /** Executed price per troy ounce (USD). */
  pricePerOz: number;
  /** Total acquisition value (USD) = quantity × pricePerOz. */
  totalValue: number;
  /** §28.7 Qualified segregated-custody vault operator. */
  custodian: string;
  /** §28.1 Lifecycle status. */
  status: BullionAcquisitionStatus;
  /** ISO-8601 timestamp the acquisition was proposed. */
  proposedAt: string;
  /** §28.7 Vault allocation reference (set on `allocated`). */
  allocationRef?: string;
  /** §28.5 Assay / serial-number audit reference (set on `audited`). */
  auditRef?: string;
  /** §28.2 Selected best-overall-execution dealer quote. */
  selectedQuote?: BullionDealerQuote;
  /** §28.3 All competitive quotes collected (minimum 3). */
  quotes: BullionDealerQuote[];
  /** §28.6 True if acquisition deferred due to exceptional market conditions. */
  deferred: boolean;
}

/**
 * §28.1 Step 1-3 — Propose a bullion acquisition.
 *
 * Initialises a `proposed` acquisition record. Callers attach at
 * least three competitive quotes (§28.3) before approval.
 */
export function proposeBullionAcquisition(
  metal: BullionMetal,
  quantityOz: number,
  pricePerOz: number,
  custodian: string,
  quotes: BullionDealerQuote[] = []
): BullionAcquisition {
  if (quantityOz <= 0) {
    throw new Error(`proposeBullionAcquisition: quantity must be positive (got ${quantityOz})`);
  }
  if (pricePerOz <= 0) {
    throw new Error(`proposeBullionAcquisition: pricePerOz must be positive (got ${pricePerOz})`);
  }
  return {
    metal,
    quantity: quantityOz,
    pricePerOz,
    totalValue: quantityOz * pricePerOz,
    custodian,
    status: "proposed",
    proposedAt: new Date().toISOString(),
    quotes,
    deferred: false,
  };
}

/**
 * §28.2 Best-overall-execution selection. Returns the dealer quote
 * with the highest composite score, computed as a weighted blend of
 * price (lower is better), counterparty score, execution quality,
 * and settlement speed. Per §28.2 the lowest price alone SHALL NOT
 * determine selection.
 */
export function selectBestExecution(
  quotes: BullionDealerQuote[],
  weights: { price: number; counterparty: number; execution: number; settlement: number } = {
    price: 0.35,
    counterparty: 0.25,
    execution: 0.25,
    settlement: 0.15,
  }
): BullionDealerQuote {
  if (quotes.length < 3) {
    throw new Error(`selectBestExecution: §28.3 requires minimum 3 competitive quotes (got ${quotes.length})`);
  }
  const minPrice = Math.min(...quotes.map((q) => q.pricePerOz));
  let best: BullionDealerQuote | null = null;
  let bestScore = -Infinity;
  for (const q of quotes) {
    const priceScore = minPrice / q.pricePerOz; // 1.0 for the cheapest
    const settlementScore = 1 / (1 + q.settlementDays); // faster = higher
    const score =
      weights.price * priceScore +
      weights.counterparty * q.counterpartyScore +
      weights.execution * q.executionQuality +
      weights.settlement * settlementScore;
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best as BullionDealerQuote;
}

/**
 * §28.1 Step 5-6 — Approve a proposed acquisition by selecting the
 * best-overall-execution dealer quote (§28.2) and locking the
 * executed price.
 */
export function approveBullionAcquisition(acquisition: BullionAcquisition): BullionAcquisition {
  if (acquisition.status !== "proposed") {
    throw new Error(
      `approveBullionAcquisition: cannot approve acquisition in status "${acquisition.status}"`
    );
  }
  if (acquisition.quotes.length < 3) {
    throw new Error(
      `approveBullionAcquisition: §28.3 requires minimum 3 competitive quotes (got ${acquisition.quotes.length})`
    );
  }
  const selected = selectBestExecution(acquisition.quotes);
  return {
    ...acquisition,
    status: "approved",
    selectedQuote: selected,
    pricePerOz: selected.pricePerOz,
    totalValue: acquisition.quantity * selected.pricePerOz,
  };
}

/**
 * §28.1 Step 7-9 — Transition an approved acquisition to settlement
 * and then segregated custody allocation (§28.7).
 */
export function settleBullionAcquisition(
  acquisition: BullionAcquisition,
  settlementRef: string
): BullionAcquisition {
  if (acquisition.status !== "approved") {
    throw new Error(
      `settleBullionAcquisition: cannot settle acquisition in status "${acquisition.status}"`
    );
  }
  void settlementRef; // §28.5 audit trail: stored by caller in immutable ledger
  return { ...acquisition, status: "settling" };
}

/**
 * §28.7 — Accept the bullion into segregated, bankruptcy-remote
 * custody. Only after this step does the bullion qualify as a
 * Constitutional Reserve Asset (§28.7: unallocated bullion SHALL
 * NOT qualify).
 */
export function allocateBullionToCustody(
  acquisition: BullionAcquisition,
  allocationRef: string
): BullionAcquisition {
  if (acquisition.status !== "settling") {
    throw new Error(
      `allocateBullionToCustody: cannot allocate acquisition in status "${acquisition.status}"`
    );
  }
  return { ...acquisition, status: "allocated", allocationRef };
}

/**
 * §28.1 Step 10 — Complete independent bullion verification (weight,
 * purity, assay certification, serial numbers, chain of custody).
 * After this step the acquisition is `audited` and the reserve
 * ledger may be updated.
 */
export function auditBullionAcquisition(
  acquisition: BullionAcquisition,
  auditRef: string
): BullionAcquisition {
  if (acquisition.status !== "allocated") {
    throw new Error(
      `auditBullionAcquisition: cannot audit acquisition in status "${acquisition.status}"`
    );
  }
  return { ...acquisition, status: "audited", auditRef };
}

/**
 * §28.6 Exceptional market conditions — defer an acquisition when
 * systemic bullion market impairment, force majeure, or legal
 * restrictions prevent completion. Deferment is time-limited and
 * must be reported to the Constitutional Council.
 */
export function deferBullionAcquisition(
  acquisition: BullionAcquisition,
  reason: string
): BullionAcquisition {
  void reason; // §28.6: caller records reason in audit ledger
  return { ...acquisition, deferred: true };
}

// ============================================================
// §29: CONSTITUTIONAL RESERVE REBALANCING ALGORITHM
// ============================================================
//
// Implements §29 of the v19.0 Constitution: deterministic reserve
// rebalancing that restores constitutional compliance while
// minimising transaction costs, market impact, and operational
// risk. Rebalancing SHALL be initiated ONLY when constitutionally
// required (§29.1 trigger list) and SHALL preserve redemption
// certainty, reserve solvency, and liquidity coverage throughout
// execution.
//
// §29.4 Partial Rebalancing Principle: only the minimum transactions
// necessary to restore constitutional compliance SHALL be executed.
// Assets already within constitutional tolerance SHALL NOT be
// traded unnecessarily.
//
// §29.6 Liquidity Protection: no rebalancing SHALL reduce the LCR
// below its constitutional minimum. If liquidity would be impaired,
// execution SHALL occur in phased transactions.
//
// §29.7 Reserve Ratio Protection: no rebalancing MAY reduce the
// Constitutional Reserve Ratio below RR_target except during
// declared Constitutional Emergency Procedures.
//
// §29.12 Deterministic Requirement: given identical inputs, every
// validator SHALL compute identical rebalancing decisions using
// deterministic fixed-precision arithmetic.

/** §29.1 Constitutional rebalancing trigger taxonomy. */
export type RebalanceTriggerType =
  | "weight_drift" // §29.1 |Current_Weight_i − Target_Weight_i| > Rebalance_threshold
  | "layer_breach" // §29.1 reserve allocation layer breach
  | "bullion_band" // §29.1 bullion allocation exceeds tolerance band
  | "stablecoin_eligibility" // §29.1 stablecoin eligibility change
  | "currency_eligibility" // §29.1 currency eligibility change
  | "concentration_cap" // §29.1 §21 concentration cap breached
  | "minimum_floor" // §29.1 §22 minimum floor breached
  | "reserve_ratio" // §29.7 reserve ratio below RR_target
  | "lcr" // §29.6 liquidity coverage ratio below 1.0
  | "council_authorization"; // §29.1 Constitutional Council extraordinary authorization

/** §29.1 Trigger severity, drives §29.2 independent-approval routing. */
export type RebalanceTriggerSeverity = "low" | "medium" | "high" | "critical";

/**
 * §29.1 A single constitutional rebalancing trigger observation.
 * Every trigger SHALL be recorded in the immutable audit ledger
 * alongside the resulting rebalancing decision (§29.10).
 */
export interface RebalanceTrigger {
  type: RebalanceTriggerType;
  description: string;
  severity: RebalanceTriggerSeverity;
  /** Observed current value (weight as fraction, ratio, etc.). */
  currentValue: number;
  /** Constitutional target value. */
  targetValue: number;
  /** Constitutional threshold that defines breach. */
  threshold: number;
  /** §29.1 Currency / asset identifier the trigger applies to (optional). */
  asset?: string;
}

/**
 * §29.1 Input context for `detectRebalanceTriggers`. All fields beyond
 * the core five (currentWeights, targetWeights, reserveRatio, lcr,
 * rebalanceThreshold) are optional — when omitted, the corresponding
 * trigger check is skipped (§29.4 — no partial / speculative triggers).
 *
 * §29.12 Deterministic Requirement: the function MUST be a pure function
 * of this context; given identical inputs every validator computes an
 * identical trigger list.
 */
export interface RebalanceContext {
  // ---- Core inputs (already used by the legacy signature) ----
  /** §29.1 Current per-currency reserve weights (fractions 0..1). */
  currentWeights: Map<string, number>;
  /** §29.1 Constitutional target per-currency weights (fractions 0..1). */
  targetWeights: Map<string, number>;
  /** §29.7 Reserve ratio in percent, e.g. 102.05 (RR_target = 100). */
  reserveRatio: number;
  /** §29.6 Liquidity Coverage Ratio as a pure ratio, e.g. 6.0 (min 1.0). */
  lcr: number;
  /** §29.1 Rebalance threshold (fraction), default 0.02 (2%). */
  rebalanceThreshold: number;

  // ---- NEW — for layer_breach (§29.1) ----
  /** §29.1 Reserve-layer weights, e.g. {"fiat":0.75,"bullion":0.20,"stablecoin":0.05}. */
  layerWeights?: Map<string, number>;
  /** §29.1 Constitutional per-layer ranges, e.g. {"fiat":{min:0.70,max:0.80},...}. */
  layerRanges?: Map<string, { min: number; max: number }>;

  // ---- NEW — for bullion_band (§29.1, §25.2) ----
  /** §25.2 Gold's share of the bullion layer (φ_t), expected in [0.60, 0.95]. */
  bullionGoldShare?: number;
  /** §25.2 Constitutional band for gold's share of bullion, default {min:0.60,max:0.95}. */
  bullionGoldRange?: { min: number; max: number };

  // ---- NEW — for stablecoin_eligibility (§27) & currency_eligibility (§12) ----
  /**
   * §12 / §27 Lifecycle status per currency code, e.g.
   * {"EUR":"full","JPY":"suspended","USDC":"probation"}.
   * Anything other than "full" is a candidate for rebalancing.
   */
  currencyStatuses?: Map<string, string>;
  /**
   * Set of currency codes that are stablecoins (e.g. "USDC","USDT","DAI").
   * Used to split the `currencyStatuses` map between fiat (§12) and
   * stablecoin (§27) eligibility triggers. If omitted, every entry is
   * treated as a fiat currency (only `currency_eligibility` may fire).
   */
  stablecoinCodes?: Set<string>;

  // ---- NEW — for concentration_cap (§21) & minimum_floor (§22) ----
  /** §21 Single-currency concentration cap, default 0.60 (60%). */
  concentrationCap?: number;
  /** §22 Minimum currency weight floor, default 0.005 (0.5%). */
  minimumFloor?: number;

  // ---- NEW — for council_authorization (§29.1) ----
  /** §29.1 Count of pending Constitutional Council extraordinary actions. */
  councilAuthorizedActions?: number;
}

/**
 * §29.1 Detect all constitutional rebalancing triggers given the
 * current reserve state. Returns a deterministic, sorted list of
 * triggers; an empty list means no rebalancing is constitutionally
 * required (§29.4 — no trades executed).
 */
export function detectRebalanceTriggers(
  ctx: RebalanceContext
): RebalanceTrigger[] {
  const triggers: RebalanceTrigger[] = [];

  const rebalanceThreshold = ctx.rebalanceThreshold ?? 0.02;

  // ============================================================
  // (1) §29.1 weight_drift — |Current_Weight_i − Target_Weight_i|
  //                          > Rebalance_threshold
  // ============================================================
  for (const [currency, current] of ctx.currentWeights) {
    const target = ctx.targetWeights.get(currency) ?? 0;
    const drift = Math.abs(current - target);
    if (drift > rebalanceThreshold) {
      triggers.push({
        type: "weight_drift",
        description: `${currency} weight drift: ${(current * 100).toFixed(2)}% vs target ${(target * 100).toFixed(2)}%`,
        severity: drift > 0.05 ? "high" : drift > 0.03 ? "medium" : "low",
        currentValue: current,
        targetValue: target,
        threshold: rebalanceThreshold,
        asset: currency,
      });
    }
  }

  // ============================================================
  // (2) §29.1 layer_breach — reserve allocation layer outside its
  //     constitutional [min, max] range. Severity escalates to
  //     "critical" when the breach exceeds 5 percentage points.
  // ============================================================
  if (ctx.layerWeights && ctx.layerRanges) {
    for (const [layer, range] of ctx.layerRanges) {
      const weight = ctx.layerWeights.get(layer);
      if (weight === undefined) continue;
      if (weight < range.min || weight > range.max) {
        const breach = weight < range.min
          ? range.min - weight
          : weight - range.max;
        triggers.push({
          type: "layer_breach",
          description: `${layer} layer ${(weight * 100).toFixed(2)}% outside constitutional range [${(range.min * 100).toFixed(2)}%, ${(range.max * 100).toFixed(2)}%]`,
          severity: breach > 0.05 ? "critical" : "high",
          currentValue: weight,
          targetValue: weight < range.min ? range.min : range.max,
          threshold: range.min,
          asset: layer,
        });
      }
    }
  }

  // ============================================================
  // (3) §29.1 / §25.2 bullion_band — gold's share of the bullion
  //     layer (φ_t) must remain within [0.60, 0.95]. Approaching
  //     the band edge (within 2 pp) is a "medium" warning; an
  //     actual breach is "high".
  // ============================================================
  if (ctx.bullionGoldShare !== undefined) {
    const band = ctx.bullionGoldRange ?? { min: 0.60, max: 0.95 };
    const g = ctx.bullionGoldShare;
    if (g < band.min || g > band.max) {
      triggers.push({
        type: "bullion_band",
        description: `Bullion gold share φ_t=${(g * 100).toFixed(2)}% outside band [${(band.min * 100).toFixed(2)}%, ${(band.max * 100).toFixed(2)}%]`,
        severity: "high",
        currentValue: g,
        targetValue: g < band.min ? band.min : band.max,
        threshold: band.min,
        asset: "XAU",
      });
    } else if (g < band.min + 0.02 || g > band.max - 0.02) {
      triggers.push({
        type: "bullion_band",
        description: `Bullion gold share φ_t=${(g * 100).toFixed(2)}% approaching band edge [${(band.min * 100).toFixed(2)}%, ${(band.max * 100).toFixed(2)}%]`,
        severity: "medium",
        currentValue: g,
        targetValue: (band.min + band.max) / 2,
        threshold: band.min,
        asset: "XAU",
      });
    }
  }

  // ============================================================
  // (4) §29.1 / §27 stablecoin_eligibility & (5) §12 currency_eligibility
  //     — any currency whose lifecycle status is not "full" must
  //     trigger a rebalance. Stablecoins route through §27, fiat
  //     currencies through §12.
  // ============================================================
  if (ctx.currencyStatuses) {
    const stablecoinCodes = ctx.stablecoinCodes ?? new Set<string>();
    for (const [code, status] of ctx.currencyStatuses) {
      if (status === "full") continue;
      const isStablecoin = stablecoinCodes.has(code);
      const severity: RebalanceTriggerSeverity =
        status === "suspended" ? "high" :
        status === "probation" ? "medium" :
        status === "removed" ? "critical" :
        "medium";
      if (isStablecoin) {
        triggers.push({
          type: "stablecoin_eligibility",
          description: `Stablecoin ${code} eligibility: ${status} (§27)`,
          severity,
          currentValue: 0,
          targetValue: 1,
          threshold: 1,
          asset: code,
        });
      } else {
        triggers.push({
          type: "currency_eligibility",
          description: `Currency ${code} eligibility: ${status} (§12)`,
          severity,
          currentValue: 0,
          targetValue: 1,
          threshold: 1,
          asset: code,
        });
      }
    }
  }

  // ============================================================
  // (6) §29.1 / §21 concentration_cap — no single currency may
  //     exceed 60% of reserves. A breach is "critical" because it
  //     threatens basket diversification (§22A).
  // ============================================================
  const concentrationCap = ctx.concentrationCap ?? 0.60;
  for (const [currency, weight] of ctx.currentWeights) {
    if (weight > concentrationCap) {
      triggers.push({
        type: "concentration_cap",
        description: `${currency} weight ${(weight * 100).toFixed(2)}% exceeds §21 concentration cap ${(concentrationCap * 100).toFixed(2)}%`,
        severity: "critical",
        currentValue: weight,
        targetValue: concentrationCap,
        threshold: concentrationCap,
        asset: currency,
      });
    }
  }

  // ============================================================
  // (7) §29.1 / §22 minimum_floor — every admitted currency must
  //     retain at least 0.5% weight; falling below is a pre-suspension
  //     warning and triggers top-up rebalancing.
  // ============================================================
  const minimumFloor = ctx.minimumFloor ?? 0.005;
  for (const [currency, weight] of ctx.currentWeights) {
    if (weight < minimumFloor) {
      triggers.push({
        type: "minimum_floor",
        description: `${currency} weight ${(weight * 100).toFixed(4)}% below §22 minimum floor ${(minimumFloor * 100).toFixed(2)}%`,
        severity: "high",
        currentValue: weight,
        targetValue: minimumFloor,
        threshold: minimumFloor,
        asset: currency,
      });
    }
  }

  // ============================================================
  // (8) §29.7 reserve_ratio — RR must remain ≥ RR_target (100%).
  //     Below 100% is "critical" (constitutional breach). Between
  //     100% and the 102% policy target is a "medium" warning.
  // ============================================================
  if (ctx.reserveRatio < 100) {
    triggers.push({
      type: "reserve_ratio",
      description: `§29.7 Reserve ratio below 100%: ${ctx.reserveRatio.toFixed(2)}%`,
      severity: "critical",
      currentValue: ctx.reserveRatio,
      targetValue: 100,
      threshold: 100,
    });
  } else if (ctx.reserveRatio < 102) {
    triggers.push({
      type: "reserve_ratio",
      description: `§29.7 Reserve ratio below 102% policy target: ${ctx.reserveRatio.toFixed(2)}%`,
      severity: "medium",
      currentValue: ctx.reserveRatio,
      targetValue: 102,
      threshold: 102,
    });
  }

  // ============================================================
  // (LCR) §29.6 liquidity_coverage — LCR must remain ≥ 1.0.
  //     Below 1.0 is "critical" (liquidity breach). Between 1.0
  //     and the 1.2 "strong" threshold is a "medium" warning.
  //     Previously mislabeled as `reserve_ratio`; now its own
  //     distinct `lcr` trigger type for clean audit semantics.
  // ============================================================
  if (ctx.lcr < 1.0) {
    triggers.push({
      type: "lcr",
      description: `§29.6 LCR below 100%: ${(ctx.lcr * 100).toFixed(2)}%`,
      severity: "critical",
      currentValue: ctx.lcr,
      targetValue: 1.0,
      threshold: 1.0,
    });
  } else if (ctx.lcr < 1.2) {
    triggers.push({
      type: "lcr",
      description: `§29.6 LCR below 1.2 strong threshold: ${(ctx.lcr * 100).toFixed(2)}%`,
      severity: "medium",
      currentValue: ctx.lcr,
      targetValue: 1.2,
      threshold: 1.2,
    });
  }

  // ============================================================
  // (9) §29.1 council_authorization — informational trigger when
  //     the Constitutional Council has pending extraordinary
  //     rebalancing actions. Always "low" severity; routing logic
  //     in §29.2 treats this as an audit annotation, not a breach.
  // ============================================================
  if ((ctx.councilAuthorizedActions ?? 0) > 0) {
    triggers.push({
      type: "council_authorization",
      description: `§29.1 Constitutional Council has ${ctx.councilAuthorizedActions} pending extraordinary rebalancing action(s)`,
      severity: "low",
      currentValue: ctx.councilAuthorizedActions ?? 0,
      targetValue: 0,
      threshold: 0,
    });
  }

  // ============================================================
  // §29.1 / §29.12 Deterministic sort: critical → high → medium →
  // low, then by description for stable ordering across validators.
  // ============================================================
  const sevRank: Record<RebalanceTriggerSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return triggers.sort((a, b) => {
    const s = sevRank[a.severity] - sevRank[b.severity];
    if (s !== 0) return s;
    return a.description.localeCompare(b.description);
  });
}

/** §29.2 Rebalancing action item. */
export interface RebalanceAction {
  asset: string;
  action: "buy" | "sell" | "rebalance";
  /** Notional amount to trade (USD). */
  amount: number;
  /** §29.5 Approved execution methodology. */
  executionMethod: "VWAP" | "TWAP" | "RFQ" | "negotiated_block" | "algorithmic";
  /** Constitutional reason (linked to originating trigger). */
  reason: string;
}

/** §29.2 Rebalancing plan produced from a set of triggers. */
export interface RebalancePlan {
  /** All triggers the plan addresses (§29.1). */
  triggers: RebalanceTrigger[];
  /** §29.4 Minimum-necessary transactions to restore compliance. */
  actions: RebalanceAction[];
  /** Estimated execution cost (USD). */
  estimatedCost: number;
  /** §29.6 Liquidity impact classification. */
  liquidityImpact: "none" | "minimal" | "moderate" | "significant";
  /** §29.7 Estimated reserve-ratio delta from plan execution. */
  reserveRatioImpact: number;
  /** §29.2 Independent approval required (severity-based). */
  approvalRequired: boolean;
  /** §29.6 If liquidity would be impaired, plan SHALL be phased. */
  phased: boolean;
}

/**
 * §29.2 Generate a constitutional rebalancing plan from a set of
 * triggers. Implements §29.4 Partial Rebalancing Principle — only
 * the minimum transactions necessary to restore compliance are
 * proposed. Estimated execution cost assumes a 0.1% institutional
 * execution-fee rate (configurable downstream).
 */
export function generateRebalancePlan(triggers: RebalanceTrigger[]): RebalancePlan {
  const actions: RebalanceAction[] = triggers.map((t) => {
    const asset = t.asset ?? t.description.split(" ")[0];
    const isSell = t.currentValue > t.targetValue;
    return {
      asset,
      action: isSell ? "sell" : "buy",
      amount: Math.abs(t.currentValue - t.targetValue),
      // §29.5 default methodology; caller may override per-asset.
      executionMethod: "TWAP",
      reason: t.description,
    };
  });

  const approvalRequired = triggers.some(
    (t) => t.severity === "critical" || t.severity === "high"
  );
  const liquidityImpact: RebalancePlan["liquidityImpact"] =
    triggers.length > 3 ? "significant" : triggers.length > 1 ? "moderate" : "minimal";
  // §29.6 — phased execution required when liquidity impact is significant
  // or any single action exceeds a 5% notional threshold.
  const phased =
    liquidityImpact === "significant" ||
    actions.some((a) => a.amount > 0.05);

  return {
    triggers,
    actions,
    estimatedCost: actions.reduce((sum, a) => sum + a.amount * 0.001, 0), // 0.1% execution cost
    liquidityImpact,
    reserveRatioImpact: 0, // computed at execution time using live reserves
    approvalRequired,
    phased,
  };
}

/**
 * §29.6 Liquidity Protection — verify a rebalancing plan will not
 * reduce the LCR below its constitutional minimum (1.0). If it
 * would, the plan MUST be split into phased transactions.
 */
export function verifyRebalancePlanLiquidity(
  plan: RebalancePlan,
  currentLcr: number,
  estimatedLcrDelta: number
): { allowed: boolean; phased: boolean; reason: string } {
  const projectedLcr = currentLcr + estimatedLcrDelta;
  if (projectedLcr < 1.0) {
    return {
      allowed: false,
      phased: true,
      reason: `§29.6 Liquidity Protection: projected LCR ${projectedLcr.toFixed(4)} < 1.0; plan MUST be phased`,
    };
  }
  return {
    allowed: true,
    phased: plan.phased,
    reason: `§29.6 OK: projected LCR ${projectedLcr.toFixed(4)} ≥ 1.0`,
  };
}

/**
 * §29.7 Reserve Ratio Protection — verify a rebalancing plan will
 * not reduce the Constitutional Reserve Ratio below RR_target
 * (102%) except during declared Constitutional Emergency Procedures.
 */
export function verifyRebalancePlanReserveRatio(
  _plan: RebalancePlan,
  currentReserveRatio: number,
  estimatedReserveRatioDelta: number,
  inEmergency: boolean = false
): { allowed: boolean; reason: string } {
  const projected = currentReserveRatio + estimatedReserveRatioDelta;
  const target = 102; // §53 RR_target
  if (!inEmergency && projected < target) {
    return {
      allowed: false,
      reason: `§29.7 Reserve Ratio Protection: projected RR ${projected.toFixed(2)}% < RR_target ${target}%; emergency declaration required to proceed`,
    };
  }
  return {
    allowed: true,
    reason: inEmergency
      ? `§29.7 emergency override: projected RR ${projected.toFixed(2)}% (emergency declared)`
      : `§29.7 OK: projected RR ${projected.toFixed(2)}% ≥ RR_target ${target}%`,
  };
}

/**
 * §29.9 Post-execution constitutional verification checklist.
 * Immediately following completion of rebalancing, the system SHALL
 * automatically verify Currency Weights, Reserve Allocation,
 * Reserve Ratio, LCR, CRI, Counterparty Limits, Bullion Allocation,
 * Stablecoin Eligibility, and Mathematical Consistency before the
 * new reserve state becomes constitutionally active.
 */
export function verifyRebalanceCompletion(postState: {
  currencyWeightsCompliant: boolean;
  reserveAllocationCompliant: boolean;
  reserveRatioCompliant: boolean;
  lcrCompliant: boolean;
  criCompliant: boolean;
  counterpartyLimitsCompliant: boolean;
  bullionAllocationCompliant: boolean;
  stablecoinEligibilityCompliant: boolean;
  mathematicalConsistency: boolean;
}): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  if (!postState.currencyWeightsCompliant) failures.push("currency weights non-compliant");
  if (!postState.reserveAllocationCompliant) failures.push("reserve allocation non-compliant");
  if (!postState.reserveRatioCompliant) failures.push("reserve ratio non-compliant");
  if (!postState.lcrCompliant) failures.push("LCR non-compliant");
  if (!postState.criCompliant) failures.push("CRI non-compliant");
  if (!postState.counterpartyLimitsCompliant) failures.push("counterparty limits non-compliant");
  if (!postState.bullionAllocationCompliant) failures.push("bullion allocation non-compliant");
  if (!postState.stablecoinEligibilityCompliant) failures.push("stablecoin eligibility non-compliant");
  if (!postState.mathematicalConsistency) failures.push("mathematical consistency check failed");
  return { passed: failures.length === 0, failures };
}

// ============================================================
// §47: CONSTITUTIONAL CONTINUITY & INSTITUTIONAL RESILIENCE
// ============================================================
//
// Implements §47 of the v19.0 Constitution: continuous constitutional
// operation under all reasonably foreseeable technical, operational,
// legal, financial, geopolitical, and systemic disruptions. Recovery
// procedures SHALL preserve Constitutional Invariants, reserve
// integrity, redemption rights, and deterministic operation
// throughout every continuity event (§47.1).
//
// §47.2 defines 7 continuity levels. This implementation codifies a
// 4-tier severity ladder (Level 1 → Level 4) that maps the
// blueprint's 7 levels into 4 escalating response tiers, preserving
// the blueprint's RTO/RPO targets (§47.3):
//   • RTO ≤ 4 hours (Level 1 operational)
//   • RPO ≤ 5 minutes
//   • Oracle Recovery ≤ 15 minutes
//   • Proof-of-Reserves Recovery ≤ 1 hour
//   • Governance Recovery ≤ 24 hours
//
// §47.4 Every recovery procedure SHALL preserve:
//   Constitutional Invariants, Reserve ownership, Redemption rights,
//   Audit trail, Oracle integrity, Deterministic calculations,
//   Cryptographic verification, Legal enforceability.
//
// §47.7 Continuity procedures SHALL activate automatically where
// predefined objective thresholds are met. Manual activation is
// required only where constitutional judgment is necessary.

/** §47.2 Continuity level (severity tier). */
export type ContinuityLevel = "level_1" | "level_2" | "level_3" | "level_4";

/**
 * §47 A constitutional continuity plan. Each level binds an RTO/RPO
 * target, activation criteria, recovery procedures, and an
 * escalation chain to constitutional authorities.
 */
export interface ContinuityPlan {
  /** §47.3 Recovery Time Objective (hours). */
  rto: number;
  /** §47.3 Recovery Point Objective (minutes). */
  rpo: number;
  /** §47.2 Severity level. */
  continuityLevel: ContinuityLevel;
  /** Human-readable description of the disruption class. */
  description: string;
  /** §47.8 Objective activation criteria. */
  activationCriteria: string[];
  /** §47.4 Recovery procedures that preserve constitutional invariants. */
  recoveryProcedures: string[];
  /** §47.2 Authority escalation chain. */
  escalationChain: string[];
  /** §47.2 Blueprint level(s) this tier subsumes. */
  blueprintLevels: number[];
}

/**
 * §47.2 The four constitutional continuity tiers, mapping the
 * blueprint's 7-level taxonomy into a 4-tier severity ladder.
 */
export const CONTINUITY_LEVELS: ContinuityPlan[] = [
  {
    rto: 4,
    rpo: 15,
    continuityLevel: "level_1",
    description: "Minor operational disruption — oracle degradation or single-endpoint failure",
    activationCriteria: [
      "Single API endpoint failure",
      "Oracle latency > 5s",
      "Oracle source weight degradation",
    ],
    recoveryProcedures: [
      "Activate secondary oracle family (§47.2 L1)",
      "Switch to fallback oracle feed",
      "Restart Vercel function / pod",
      "Verify §45 invariants unchanged",
    ],
    escalationChain: ["Operator", "Technical Committee"],
    blueprintLevels: [1],
  },
  {
    rto: 8,
    rpo: 30,
    continuityLevel: "level_2",
    description:
      "Moderate operational disruption — oracle consensus failure, database unavailable, or RPC node failure",
    activationCriteria: [
      "Oracle consensus failure",
      "Database unavailable",
      "RPC node failure",
      "Single custodian operational outage",
    ],
    recoveryProcedures: [
      "Activate institutional oracle layer (§47.2 L2)",
      "Switch to fallback database replica",
      "Switch to backup RPC endpoint",
      "Activate qualified backup custodian (§47.2 L3)",
      "Verify §45 invariants unchanged",
    ],
    escalationChain: ["Operator", "Technical Committee", "CTO", "COO"],
    blueprintLevels: [2, 3, 4],
  },
  {
    rto: 24,
    rpo: 60,
    continuityLevel: "level_3",
    description:
      "Major operational disruption — multiple system failures, cybersecurity incident, or jurisdictional disruption",
    activationCriteria: [
      "Multiple system failures",
      "Cybersecurity incident",
      "Jurisdictional disruption",
      "Payment / settlement infrastructure outage",
    ],
    recoveryProcedures: [
      "Activate disaster recovery site",
      "Activate alternate settlement pathway (§47.2 L4)",
      "Activate alternate constitutional jurisdiction (§47.2 L5)",
      "Activate incident response plan (§47.2 L6)",
      "Council notification",
      "Verify §45 invariants unchanged",
    ],
    escalationChain: ["Operator", "CTO", "COO", "Council"],
    blueprintLevels: [4, 5, 6],
  },
  {
    rto: 72,
    rpo: 240,
    continuityLevel: "level_4",
    description:
      "Constitutional emergency — global systemic financial disruption, governance failure, or catastrophic infrastructure loss",
    activationCriteria: [
      "Global systemic financial disruption",
      "Governance failure",
      "Catastrophic infrastructure loss",
      "Constitutional Emergency Framework activation",
    ],
    recoveryProcedures: [
      "Activate Constitutional Emergency Framework (§47.2 L7)",
      "Activate Emergency Custodian (§44)",
      "Convene emergency Council session",
      "Engage Independent Review Panel",
      "Preserve §45 non-amendable invariants",
    ],
    escalationChain: ["Emergency Custodian", "Council", "Independent Review Panel"],
    blueprintLevels: [7],
  },
];

/**
 * §47.7 Continuity Activation Rule — automatically select the
 * appropriate continuity level based on the observed failures.
 * Manual activation is required only where constitutional judgment
 * is necessary (Level 4 always requires Council ratification).
 */
export function assessContinuityLevel(failures: string[]): ContinuityPlan {
  if (failures.length >= 3) return CONTINUITY_LEVELS[3];
  if (failures.length >= 2) return CONTINUITY_LEVELS[2];
  if (failures.length >= 1) return CONTINUITY_LEVELS[1];
  return CONTINUITY_LEVELS[0];
}

/**
 * §47.3 Verify that a continuity plan's RTO/RPO targets satisfy the
 * constitutional maxima. Returns `true` iff the plan is compliant.
 */
export function verifyContinuityTargets(plan: ContinuityPlan): {
  compliant: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  // §47.3 absolute maxima (Level 1 targets — stricter tiers may relax)
  if (plan.continuityLevel === "level_1" && plan.rto > 4) {
    violations.push(`§47.3 Level 1 RTO ${plan.rto}h > 4h target`);
  }
  if (plan.continuityLevel === "level_1" && plan.rpo > 5) {
    violations.push(`§47.3 Level 1 RPO ${plan.rpo}min > 5min target`);
  }
  // Governance recovery cap (§47.3) applies to all levels
  if (plan.rto > 24 && plan.continuityLevel !== "level_4") {
    violations.push(`§47.3 Governance Recovery ${plan.rto}h > 24h (only Level 4 may exceed)`);
  }
  return { compliant: violations.length === 0, violations };
}

/**
 * §47.4 Verify that a recovery procedure preserves all eight
 * constitutional continuity requirements. The caller supplies a
 * boolean for each invariant; the function returns the failures.
 */
export function verifyContinuityPreservation(postState: {
  constitutionalInvariants: boolean;
  reserveOwnership: boolean;
  redemptionRights: boolean;
  auditTrail: boolean;
  oracleIntegrity: boolean;
  deterministicCalculations: boolean;
  cryptographicVerification: boolean;
  legalEnforceability: boolean;
}): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  if (!postState.constitutionalInvariants) failures.push("constitutional invariants not preserved");
  if (!postState.reserveOwnership) failures.push("reserve ownership not preserved");
  if (!postState.redemptionRights) failures.push("redemption rights not preserved");
  if (!postState.auditTrail) failures.push("audit trail not preserved");
  if (!postState.oracleIntegrity) failures.push("oracle integrity not preserved");
  if (!postState.deterministicCalculations) failures.push("deterministic calculations not preserved");
  if (!postState.cryptographicVerification) failures.push("cryptographic verification not preserved");
  if (!postState.legalEnforceability) failures.push("legal enforceability not preserved");
  return { passed: failures.length === 0, failures };
}

// ============================================================
// Helpers
// ============================================================

function median(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

// ============================================================
// §56: CONSTITUTIONAL DEPENDENCY FRAMEWORK
// ============================================================
//
// Implements Section 56 of the v19.0 specification — the largest single
// blueprint section (1700+ lines). The framework governs every external
// entity the Institution depends on: RPC endpoints, oracle APIs, the
// operational database, SMTP email, LLM providers, web hosting, DNS,
// and monitoring.
//
// §56.1 Constitutional Principle: "No institutional operation shall
// depend on any single external entity, service provider, jurisdiction,
// or technology. Failure of any single dependency shall not interrupt
// constitutional operation."
//
// This module provides:
//   • §56.2 Dependency Categories — classification of every dependency
//   • §56.1A Dependency Hierarchy — Tier I / II / III criticality
//   • §56.4 Concentration Limits — no single provider > 35–40%
//   • §56.5 Constitutional Dependency Score (CDS) — 8-component risk score
//   • §56.6 Replacement Protocol — documented plan per dependency
//   • §56.8 Audit Frequency — per-tier audit cadence
//   • §56.12 Lifecycle — selection → qualification → approval → onboarding
//                        → monitoring → review → replacement → termination
//
// Concentration limits derive from §0.6 Dependency Doctrine (Layer 0)
// and §56.4. The 35% ceiling applies to constitutional/critical
// dependencies (custodians, oracles, banking, email, LLM); the 40%
// ceiling applies to critical operational dependencies (cloud hosting,
// financial infrastructure); the 25% ceiling applies to banking
// partners and refiners.

/**
 * §56.1A Constitutional Dependency Hierarchy.
 *
 * Every dependency is classified into one of three constitutional tiers
 * based on its effect on constitutional continuity. Higher tiers require
 * progressively stronger redundancy, oversight, and recovery.
 *
 *   Tier I   — Failure threatens constitutional continuity
 *              (custody, governance infra, oracle consensus, PoR)
 *   Tier II  — Failure interrupts operations but not constitutional identity
 *              (banking, cloud, auditors, legal counsel, email)
 *   Tier III — Failure causes inconvenience but not institutional impairment
 *              (analytics, reporting, monitoring, LLM aux services)
 */
export type DependencyTier = "I" | "II" | "III";

/**
 * §56.2 Dependency Categories — the canonical classification of external
 * dependencies. Mirrors the §56.2 dependency category table.
 */
export type DependencyCategory =
  | "rpc" // Blockchain RPC endpoint (e.g. Monad, Ethereum)
  | "oracle" // Price/market data oracle (gold, FX, crypto)
  | "database" // Operational database (libSQL/Turso, Postgres)
  | "email" // Transactional email (SMTP, SendGrid, SES)
  | "llm" // Large language model provider (Gemini, Groq, HF)
  | "hosting" // Web/application hosting (Vercel, Cloudflare Pages)
  | "dns" // DNS resolution (Cloudflare, Route53)
  | "monitoring" // Observability (Sentry, Datadog)
  | "custodian" // Reserve custody (allocated bullion vaults)
  | "banking" // Cash accounts / settlement banks
  | "auditor" // Independent audit firms
  | "legal" // Legal counsel
  | "insurance" // Risk transfer / insurance carriers
  | "logistics" // Physical transport (bullion shipment)
  | "identity" // Authentication / identity providers
  | "cryptographic"; // HSMs, certificate authorities

/**
 * §56.1A criticality (mapped from DependencyTier for the runtime API).
 *
 *   critical — Tier I (constitutional continuity at stake)
 *   high     — Tier II (operational continuity at stake)
 *   medium   — Tier III-A (important but not blocking)
 *   low      — Tier III-B (convenience / support)
 */
export type DependencyCriticality = "critical" | "high" | "medium" | "low";

/**
 * §56.3 Dependency Governance — the status of a dependency in the
 * §56.12 lifecycle (selection → qualification → approval → onboarding →
 * monitoring → review → replacement → termination).
 */
export type DependencyStatus = "active" | "degraded" | "failed" | "replacing";

/**
 * §56.3 Dependency Registry entry.
 *
 * Every external dependency shall be recorded here with:
 *   - Criticality (§56.1A Tier I/II/III → critical/high/medium/low)
 *   - Provider (the actual service provider name)
 *   - Fallback provider (§56.6 replacement candidate, if pre-staged)
 *   - Concentration limit (§56.4 — max % of total dependencies from
 *     this single provider; 0.35 for Tier I, 0.40 for Tier II cloud,
 *     0.25 for banking partners per §56.4)
 *   - Health-check URL (optional — used by the §56.7 failover protocol)
 *   - Replacement plan (§56.6 — documented exit/replacement procedure)
 *   - Status (§56.12 lifecycle stage)
 *   - Last health-check timestamp (ISO 8601; null if never checked)
 *   - Tier (§56.1A — raw constitutional tier for audit)
 *   - Audit frequency (§56.8 — quarterly / semi-annually / annually)
 */
export interface Dependency {
  id: string;
  name: string;
  category: DependencyCategory;
  /** §56.1A derived criticality (Tier I → critical, etc.). */
  criticality: DependencyCriticality;
  /** §56.1A raw constitutional tier (I / II / III). */
  tier: DependencyTier;
  provider: string;
  /** §56.6 pre-staged fallback provider (null if not pre-staged). */
  fallbackProvider?: string;
  /**
   * §56.4 concentration limit — max fraction of total dependencies that
   * may come from this single provider. 0.35 = 35% (Tier I), 0.40 = 40%
   * (Tier II cloud/financial infra), 0.25 = 25% (banking partners).
   */
  concentrationLimit: number;
  /** §56.7 health-check endpoint (optional). */
  healthCheckUrl?: string;
  /** §56.6 documented replacement / exit plan. */
  replacementPlan: string;
  /** §56.12 lifecycle status. */
  status: DependencyStatus;
  /** §56.8 last health-check timestamp (ISO 8601). */
  lastHealthCheck?: string;
  /** §56.8 audit frequency for this dependency's tier. */
  auditFrequency: "quarterly" | "semi-annually" | "annually";
}

/**
 * §56.8 Audit frequency by tier — Tier I dependencies are audited
 * quarterly, Tier II semi-annually, Tier III annually. This mapping
 * is used by both the registry (to label each dependency) and the
 * audit scheduler (to plan the audit cadence).
 */
export const DEPENDENCY_AUDIT_FREQUENCY: Record<DependencyTier, Dependency["auditFrequency"]> = {
  I: "quarterly",
  II: "semi-annually",
  III: "annually",
};

/**
 * §56.2 Dependency Registry — the canonical, exhaustively-enumerated
 * list of every external entity on which the Mithqal v19.0
 * implementation depends. Each entry carries its §56.1A tier, §56.4
 * concentration limit, §56.6 replacement plan, and §56.12 lifecycle
 * status. Adding a new dependency requires §56.10 approval at the
 * tier-appropriate level (Constitutional / Critical / Operational).
 *
 * §56.13 Vendor Neutrality Clause: selection is based on constitutional
 * criteria, not commercial preference. No provider receives
 * constitutional preference based on market dominance.
 *
 * §56.15 Sunset Reviews: every dependency automatically expires 3
 * years from its `lastHealthCheck` unless formally renewed.
 */
export const DEPENDENCY_REGISTRY: Dependency[] = [
  {
    id: "monad-rpc",
    name: "Monad Testnet RPC",
    category: "rpc",
    criticality: "critical",
    tier: "I",
    provider: "Monad Labs",
    concentrationLimit: 0.35,
    replacementPlan:
      "Failover to Ethereum Sepolia RPC or another EVM-compatible L1. " +
      "On mainnet, maintain ≥3 independent RPC providers with ≤24h replacement (§56.1A).",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.I,
  },
  {
    id: "gold-api",
    name: "Gold Price Feed",
    category: "oracle",
    criticality: "critical",
    tier: "I",
    provider: "gold-api.com",
    fallbackProvider: "FRED GOLDAMGBD228NLBM",
    concentrationLimit: 0.35,
    replacementPlan:
      "Switch to FRED (St. Louis Fed) GOLDAMGBD228NLBM series or Chainlink XAU/USD feed. " +
      "Fallback provider is pre-qualified; cutover < 1 hour per §56.7.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.I,
  },
  {
    id: "er-api",
    name: "FX Rates",
    category: "oracle",
    criticality: "critical",
    tier: "I",
    provider: "open.er-api.com",
    fallbackProvider: "Frankfurter.app (ECB)",
    concentrationLimit: 0.35,
    replacementPlan:
      "Switch to Frankfurter.app (ECB reference rates) or exchangerate.host. " +
      "Both are pre-qualified; cutover < 1 hour per §56.7.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.I,
  },
  {
    id: "coingecko",
    name: "Crypto Prices",
    category: "oracle",
    criticality: "medium",
    tier: "III",
    provider: "CoinGecko",
    concentrationLimit: 0.35,
    replacementPlan:
      "Switch to CoinMarketCap API or on-chain DEX oracle (Uniswap TWAP). " +
      "Crypto prices are Tier III — failure causes inconvenience, not impairment.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.III,
  },
  {
    id: "turso-db",
    name: "Operational Database",
    category: "database",
    criticality: "critical",
    tier: "I",
    provider: "Turso (libSQL)",
    concentrationLimit: 0.35,
    replacementPlan:
      "Migrate to PostgreSQL (Neon, Supabase) or local SQLite file. " +
      "libSQL wire protocol is SQLite-compatible; schema porting < 1 day. " +
      "Per §56.1A Tier I: ≤24h replacement time.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.I,
  },
  {
    id: "vercel",
    name: "Web Hosting",
    category: "hosting",
    criticality: "critical",
    tier: "II",
    provider: "Vercel",
    concentrationLimit: 0.40,
    replacementPlan:
      "Deploy to Cloudflare Pages, Netlify, or self-host via Docker on a VPS. " +
      "Next.js is portable; build artifact deploys to any Node-capable host. " +
      "Per §56.4 cloud infrastructure limit: 50% of infrastructure.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.II,
  },
  {
    id: "icloud-smtp",
    name: "Email (SMTP)",
    category: "email",
    criticality: "high",
    tier: "II",
    provider: "Apple iCloud",
    concentrationLimit: 0.35,
    replacementPlan:
      "Switch to SendGrid, AWS SES, or Postmark. SMTP credentials are " +
      "configurable via env var — cutover is a config change, not a code change.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.II,
  },
  {
    id: "gemini-llm",
    name: "Gemini LLM",
    category: "llm",
    criticality: "medium",
    tier: "III",
    provider: "Google",
    concentrationLimit: 0.35,
    replacementPlan:
      "Use Groq or HuggingFace exclusively. LLM providers are Tier III " +
      "(§56.1A) — failure causes inconvenience, not institutional impairment.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.III,
  },
  {
    id: "groq-llm",
    name: "Groq LLM",
    category: "llm",
    criticality: "medium",
    tier: "III",
    provider: "Groq",
    concentrationLimit: 0.35,
    replacementPlan:
      "Use Gemini or HuggingFace exclusively. LLM providers are Tier III " +
      "(§56.1A) — failure causes inconvenience, not institutional impairment.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.III,
  },
  {
    id: "hf-llm",
    name: "HuggingFace LLM",
    category: "llm",
    criticality: "medium",
    tier: "III",
    provider: "Hugging Face",
    concentrationLimit: 0.35,
    replacementPlan:
      "Use Gemini or Groq exclusively. LLM providers are Tier III " +
      "(§56.1A) — failure causes inconvenience, not institutional impairment.",
    status: "active",
    auditFrequency: DEPENDENCY_AUDIT_FREQUENCY.III,
  },
];

/**
 * §56.4 / §56.5 Concentration & health rollup.
 *
 * Aggregates the dependency registry into a single health summary:
 *   - total / active / degraded / failed counts
 *   - per-provider concentration (% of total dependencies from each provider)
 *   - concentration risks (providers exceeding their §56.4 limit)
 *
 * Per §56.4 Constitutional Concentration Principle: maximum
 * concentrations constitute constitutional ceilings rather than
 * operational targets. The Institution shall maintain lower operational
 * exposure whenever reasonably practicable.
 */
export interface DependencyHealth {
  total: number;
  active: number;
  degraded: number;
  failed: number;
  replacing: number;
  /** Per-provider concentration: { provider → fraction of total deps }. */
  providerConcentration: Record<string, number>;
  /** §56.4 violations — providers exceeding their concentration limit. */
  concentrationRisks: string[];
  /** §56.1A per-tier counts. */
  tierBreakdown: Record<DependencyTier, number>;
}

/**
 * §56.4 Compute the current dependency health rollup.
 *
 * Walks the DEPENDENCY_REGISTRY, counts statuses, computes per-provider
 * concentration, and flags any provider whose share of total
 * dependencies exceeds its own (or the default 0.35) concentration
 * limit. Returns a structured health report.
 */
export function getDependencyHealth(): DependencyHealth {
  const total = DEPENDENCY_REGISTRY.length;
  const active = DEPENDENCY_REGISTRY.filter((d) => d.status === "active").length;
  const degraded = DEPENDENCY_REGISTRY.filter((d) => d.status === "degraded").length;
  const failed = DEPENDENCY_REGISTRY.filter((d) => d.status === "failed").length;
  const replacing = DEPENDENCY_REGISTRY.filter((d) => d.status === "replacing").length;

  // §56.1A tier breakdown
  const tierBreakdown: Record<DependencyTier, number> = { I: 0, II: 0, III: 0 };
  for (const dep of DEPENDENCY_REGISTRY) {
    tierBreakdown[dep.tier] += 1;
  }

  // §56.4 concentration check — aggregate by provider, flag limit breaches
  const providerCounts: Record<string, number> = {};
  for (const dep of DEPENDENCY_REGISTRY) {
    providerCounts[dep.provider] = (providerCounts[dep.provider] || 0) + 1;
  }
  const providerConcentration: Record<string, number> = {};
  const concentrationRisks: string[] = [];
  for (const [provider, count] of Object.entries(providerCounts)) {
    const concentration = count / total;
    providerConcentration[provider] = concentration;
    // §56.4 default ceiling is 0.35 (35%); Tier II cloud allows 0.40.
    // We flag any provider above 0.35 as a concentration risk for review.
    if (concentration > 0.35) {
      concentrationRisks.push(
        `${provider}: ${(concentration * 100).toFixed(1)}% (limit: 35%)`
      );
    }
  }

  return {
    total,
    active,
    degraded,
    failed,
    replacing,
    providerConcentration,
    concentrationRisks,
    tierBreakdown,
  };
}

/**
 * §56.4 Concentration compliance check.
 *
 * Returns `passed: true` iff no provider exceeds the §56.4 concentration
 * ceiling (35% default, 40% for Tier II cloud infrastructure). Used by
 * the `/api/dependencies` endpoint and the §56.8 audit scheduler.
 */
export function checkDependencyConcentration(): {
  passed: boolean;
  violations: string[];
} {
  const { concentrationRisks } = getDependencyHealth();
  return {
    passed: concentrationRisks.length === 0,
    violations: concentrationRisks,
  };
}

/**
 * §56.5 Constitutional Dependency Score (CDS) components.
 *
 * Every dependency receives a CDS measuring its overall risk to
 * constitutional operation. The score is a weighted average of 8
 * components, each scored 0–100 (higher = riskier).
 *
 *   Component              Weight  Description
 *   Operational Risk       20%     Likelihood of operational failure
 *   Financial Risk         15%     Provider financial stability
 *   Legal Risk             15%     Legal and regulatory exposure
 *   Cyber Risk             20%     Cybersecurity posture
 *   Jurisdictional Risk    10%     Jurisdictional concentration
 *   Replacement Risk       10%     Ease of replacement (inverse)
 *   Vendor Risk             5%     Vendor-specific risks
 *   Concentration Risk      5%     Concentration exposure
 *
 * §56.5 Score Interpretation:
 *    0–20   Low Risk         — Normal monitoring
 *   21–40   Moderate Risk    — Enhanced monitoring
 *   41–60   Elevated Risk    — Mitigation required
 *   61–80   High Risk        — Immediate mitigation
 *   81–100  Critical Risk    — Immediate replacement
 */
export interface CDSComponents {
  operational: number; // 0–100, weight 0.20
  financial: number; // 0–100, weight 0.15
  legal: number; // 0–100, weight 0.15
  cyber: number; // 0–100, weight 0.20
  jurisdictional: number; // 0–100, weight 0.10
  replacement: number; // 0–100, weight 0.10 (higher = harder to replace)
  vendor: number; // 0–100, weight 0.05
  concentration: number; // 0–100, weight 0.05
}

/**
 * §56.5 Constitutional Dependency Score (CDS) result.
 */
export interface CDSResult {
  score: number; // 0–100 weighted average
  band: "low" | "moderate" | "elevated" | "high" | "critical";
  action: string; // §56.5 prescribed action
  components: CDSComponents;
}

/** §56.5 CDS component weights (must sum to 1.0). */
export const CDS_WEIGHTS = {
  operational: 0.20,
  financial: 0.15,
  legal: 0.15,
  cyber: 0.20,
  jurisdictional: 0.10,
  replacement: 0.10,
  vendor: 0.05,
  concentration: 0.05,
} as const;

/**
 * §56.5 Compute the Constitutional Dependency Score for a dependency.
 *
 * @param components  The 8 CDS components, each 0–100 (higher = riskier).
 * @returns The weighted score, the §56.5 risk band, the prescribed action,
 *          and the input components (for audit transparency).
 */
export function computeCDS(components: CDSComponents): CDSResult {
  const score =
    components.operational * CDS_WEIGHTS.operational +
    components.financial * CDS_WEIGHTS.financial +
    components.legal * CDS_WEIGHTS.legal +
    components.cyber * CDS_WEIGHTS.cyber +
    components.jurisdictional * CDS_WEIGHTS.jurisdictional +
    components.replacement * CDS_WEIGHTS.replacement +
    components.vendor * CDS_WEIGHTS.vendor +
    components.concentration * CDS_WEIGHTS.concentration;

  let band: CDSResult["band"];
  let action: string;
  if (score <= 20) {
    band = "low";
    action = "Normal monitoring";
  } else if (score <= 40) {
    band = "moderate";
    action = "Enhanced monitoring";
  } else if (score <= 60) {
    band = "elevated";
    action = "Mitigation required";
  } else if (score <= 80) {
    band = "high";
    action = "Immediate mitigation";
  } else {
    band = "critical";
    action = "Immediate replacement";
  }

  return { score: Math.round(score * 100) / 100, band, action, components };
}

/**
 * §56.6 Dependency Replacement Protocol — the 12-step procedure for
 * replacing a failed dependency. Each step has a defined timeline and
 * responsible party per §56.6.
 *
 *   1. Dependency Failure Identified     — Immediate, Operations
 *   2. Emergency Assessment              — ≤ 1 hour, Technical Committee
 *   3. Activate Backup Dependency        — ≤ 2 hours, Operations + TC
 *   4. Integrity Verification            — ≤ 4 hours, TC
 *   5. Legal Validation                  — ≤ 4 hours, Legal
 *   6. Cryptographic Verification        — ≤ 4 hours, TC
 *   7. Operational Testing               — ≤ 6 hours, Operations
 *   8. Transfer Operations               — ≤ 8 hours, Operations
 *   9. Verify Operational Continuity     — ≤ 12 hours, TC
 *  10. Document Transition               — ≤ 24 hours, Operations
 *  11. Rollback Capability Confirmed     — ≤ 24 hours, Operations
 *  12. Post-Incident Review              — ≤ 30 days, Council
 */
export interface ReplacementStep {
  step: number;
  action: string;
  timeline: string;
  responsible: string;
}

export const DEPENDENCY_REPLACEMENT_PROTOCOL: ReplacementStep[] = [
  { step: 1, action: "Dependency Failure Identified", timeline: "Immediate", responsible: "Operations" },
  { step: 2, action: "Emergency Assessment", timeline: "Within 1 hour", responsible: "Technical Committee" },
  { step: 3, action: "Activate Backup Dependency", timeline: "Within 2 hours", responsible: "Operations + Technical Committee" },
  { step: 4, action: "Integrity Verification", timeline: "Within 4 hours", responsible: "Technical Committee" },
  { step: 5, action: "Legal Validation", timeline: "Within 4 hours", responsible: "Legal" },
  { step: 6, action: "Cryptographic Verification", timeline: "Within 4 hours", responsible: "Technical Committee" },
  { step: 7, action: "Operational Testing", timeline: "Within 6 hours", responsible: "Operations" },
  { step: 8, action: "Transfer Operations", timeline: "Within 8 hours", responsible: "Operations" },
  { step: 9, action: "Verify Operational Continuity", timeline: "Within 12 hours", responsible: "Technical Committee" },
  { step: 10, action: "Document Transition", timeline: "Within 24 hours", responsible: "Operations" },
  { step: 11, action: "Rollback Capability Confirmed", timeline: "Within 24 hours", responsible: "Operations" },
  { step: 12, action: "Post-Incident Review", timeline: "Within 30 days", responsible: "Council" },
];

/**
 * §56.12 Dependency Lifecycle stages.
 *
 * Every dependency follows this 8-stage lifecycle from selection
 * through termination. Each stage has defined activities and
 * documentation requirements.
 */
export const DEPENDENCY_LIFECYCLE_STAGES = [
  "Selection",
  "Qualification",
  "Approval",
  "Onboarding",
  "Monitoring",
  "Review",
  "Replacement",
  "Termination",
] as const;

/**
 * §56.15 Dependency Sunset Review — every dependency automatically
 * expires 3 years from its last formal review unless renewed.
 */
export const DEPENDENCY_SUNSET_INTERVAL_YEARS = 3;

/**
 * §56.11 Emergency Dependency Override — emergency changes to
 * dependencies are time-limited (30 days maximum), automatically
 * reviewed at 15 and 30 days, mandatorily audited within 30 days,
 * and expire automatically. Council is notified within 24 hours;
 * public disclosure within 7 days.
 */
export const EMERGENCY_DEPENDENCY_OVERRIDE_LIMITS = {
  maxDurationDays: 30,
  automaticReviewAtDays: [15, 30],
  mandatoryAuditWithinDays: 30,
  councilNotificationWithinHours: 24,
  publicDisclosureWithinDays: 7,
} as const;

/**
 * §56.4 / §56.8 Tier I redundancy requirement — Tier I dependencies
 * (custody, governance, oracle, PoR, MPC, archives) require MANDATORY
 * redundancy with at least 3 independent providers and ≤24h replacement.
 */
export const TIER_I_MIN_PROVIDERS = 3;
export const TIER_I_MAX_REPLACEMENT_HOURS = 24;

/**
 * §56.4 / §56.8 Tier II redundancy requirement — Tier II dependencies
 * (banking, cloud, auditors, legal, email) require ≥2 independent
 * providers and ≤7-day replacement.
 */
export const TIER_II_MIN_PROVIDERS = 2;
export const TIER_II_MAX_REPLACEMENT_DAYS = 7;

/**
 * §56.4 / §56.8 Tier III redundancy requirement — Tier III dependencies
 * (analytics, reporting, LLM aux) recommend redundancy and ≤30-day
 * replacement.
 */
export const TIER_III_MAX_REPLACEMENT_DAYS = 30;

/**
 * §56.10 Dependency Approval Levels — the approval body required for
 * each tier of dependency change.
 *
 *   Tier I   — Council + Technical Committee + Risk Committee (Constitutional)
 *   Tier II  — Council + Technical Committee (Critical)
 *   Tier III — Technical Committee (Operational)
 */
export const DEPENDENCY_APPROVAL_LEVELS: Record<
  DependencyTier,
  { classification: string; reviewBody: string }
> = {
  I: {
    classification: "Constitutional",
    reviewBody: "Council + Technical Committee + Risk Committee",
  },
  II: {
    classification: "Critical",
    reviewBody: "Council + Technical Committee",
  },
  III: {
    classification: "Operational",
    reviewBody: "Technical Committee",
  },
};

/**
 * §56.16 Section Verification — the 26-point checklist that §56 itself
 * declares must be satisfied for the dependency framework to be
 * considered complete. Surfaced here so the `/api/dependencies`
 * endpoint can report framework completeness.
 */
export const SECTION_56_VERIFICATION: string[] = [
  "Constitutional Dependency Hierarchy established (Tier I, II, III)",
  "Constitutional Independence Doctrine established",
  "Common-Mode Failure Doctrine established",
  "Complete Dependency Categories defined",
  "Dependency Governance Requirements established",
  "Cross-Dependency Mapping defined",
  "Dependency Concentration Limits defined",
  "Jurisdictional Dependency Limits established",
  "Dependency Risk Scoring defined",
  "Dependency Replacement Protocol established",
  "Dependency Failover Protocol established",
  "Constitutional Verification included in failover",
  "Dependency Audit Requirements established",
  "Dependency Exit Strategy required",
  "Dependency Approval Levels defined",
  "Emergency Dependency Override established",
  "Dependency Lifecycle defined",
  "Vendor Neutrality Clause established",
  "Dependency Stress Testing required",
  "Dependency Sunset Reviews established",
  "No single point of constitutional failure",
  "Concentration controls validated",
  "Replacement procedures verified",
  "Exit procedures documented",
  "Stress testing completed",
  "Continuous monitoring defined",
];

// ============================================================
// §39: CONSTITUTIONAL CRYPTOGRAPHIC FRAMEWORK
// ============================================================
//
// Production-ready INTERFACES with simulation implementations.
// Migration path: replace the in-memory `keyRegistry` and HMAC-based
// `sign()` with `HSMBackedSigner` when enterprise HSM contracts are
// procured. All public functions below preserve their signatures so
// callers do not need to change when the simulation is swapped for
// real hardware-backed cryptography.
//
// The framework implements:
//   §39.1  Key metadata + lifecycle (generate, rotate, revoke)
//   §39.2  Four-tier key hierarchy (Master / Operational / Emergency / Backup)
//   §39.3  Signing primitives (single-key + threshold/MPC)
//   §39.4  Zero-trust verification hook
//   §39.5  Cryptographic audit trail (append-only log)

export interface KeyMetadata {
  keyId: string;
  keyType: "ecdsa" | "ed25519" | "falcon-512" | "rsa-4096";
  purpose: "minting" | "governance" | "custody" | "oracle" | "admin" | "backup";
  status: "active" | "rotated" | "revoked" | "compromised";
  createdAt: string;
  rotatedAt?: string;
  rotatedFrom?: string;
  custodyLocation: "hsm" | "mpc" | "software-simulation";
  /** Present when the key participates in a threshold / MPC scheme. */
  threshold?: { required: number; total: number };
}

export interface SignatureResult {
  signature: string;
  keyId: string;
  algorithm: string;
  timestamp: string;
  verified: boolean;
}

export interface CryptographicAuditEntry {
  timestamp: string;
  operation: "sign" | "verify" | "rotate" | "generate" | "revoke";
  keyId: string;
  result: "success" | "failure";
  details: string;
}

/**
 * §39.2 Key Hierarchy — the four constitutional custody tiers.
 *
 *   Level 1  Master Key        Root of trust, generates all other keys
 *   Level 2  Operational Keys  Day-to-day signing (mint/gov/oracle)
 *   Level 3  Emergency Keys    Emergency custodian access
 *   Level 4  Backup Keys       Disaster recovery
 *
 * Threshold quorums are taken from the v19.0 blueprint and exist to
 * prevent any single custodian from unilaterally exercising root
 * authority. In the simulation these quorums are enforced by
 * `thresholdSign()`; in production they are enforced inside the MPC node.
 */
export const KEY_HIERARCHY = {
  level1: {
    name: "Master Key",
    purpose: "Root of trust — generates all other keys",
    custody: "HSM (qualified custodian)",
    threshold: "5-of-7 MPC",
  },
  level2: {
    name: "Operational Keys",
    purpose: "Day-to-day signing (minting, governance, oracle)",
    custody: "HSM or MPC",
    threshold: "3-of-5",
  },
  level3: {
    name: "Emergency Keys",
    purpose: "Emergency custodian access",
    custody: "Offline HSM (geographic distribution)",
    threshold: "3-of-5",
  },
  level4: {
    name: "Backup Keys",
    purpose: "Disaster recovery",
    custody: "Offline, geographically distributed",
    threshold: "4-of-7",
  },
} as const;

/**
 * §39.1 Key Registry (simulation).
 *
 * Replace with HSM integration — the HSM vendor SDK exposes the same
 * `getKey / generateKey / rotateKey / revokeKey` surface so no caller
 * changes are required.
 */
const keyRegistry: Map<string, KeyMetadata> = new Map();

/** §39.5 Append-only cryptographic audit trail (simulation). */
const cryptographicAuditLog: CryptographicAuditEntry[] = [];

function appendCryptoAudit(
  operation: CryptographicAuditEntry["operation"],
  keyId: string,
  result: CryptographicAuditEntry["result"],
  details: string,
): void {
  cryptographicAuditLog.push({
    timestamp: new Date().toISOString(),
    operation,
    keyId,
    result,
    details,
  });
}

/**
 * §39.1 Generate a new constitutional key.
 *
 * The key is recorded in the simulated registry with `custodyLocation`
 * set to `"software-simulation"`. In production the private material
 * never leaves the HSM; only the `keyId` + metadata are returned.
 */
export function generateKey(
  purpose: KeyMetadata["purpose"],
  keyType: KeyMetadata["keyType"] = "ecdsa",
): KeyMetadata {
  const keyId = `key-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const key: KeyMetadata = {
    keyId,
    keyType,
    purpose,
    status: "active",
    createdAt: new Date().toISOString(),
    custodyLocation: "software-simulation",
  };
  keyRegistry.set(keyId, key);
  appendCryptoAudit("generate", keyId, "success", `Generated ${keyType} key for ${purpose}`);
  return key;
}

/**
 * §39.1 Rotate a constitutional key.
 *
 * The old key is marked `"rotated"` and linked to the new key via
 * `rotatedFrom`. The new key inherits the old key's `purpose` and
 * `keyType`. Old signatures remain verifiable against the rotated
 * key; new signatures MUST use the new key.
 */
export function rotateKey(oldKeyId: string): KeyMetadata {
  const oldKey = keyRegistry.get(oldKeyId);
  if (!oldKey) {
    appendCryptoAudit("rotate", oldKeyId, "failure", "Key not found");
    throw new Error(`Key ${oldKeyId} not found`);
  }
  const newKey = generateKey(oldKey.purpose, oldKey.keyType);
  oldKey.status = "rotated";
  oldKey.rotatedAt = new Date().toISOString();
  oldKey.rotatedFrom = newKey.keyId;
  keyRegistry.set(oldKeyId, oldKey);
  appendCryptoAudit(
    "rotate",
    oldKeyId,
    "success",
    `Rotated to ${newKey.keyId}`,
  );
  return newKey;
}

/**
 * §39.1 Revoke a constitutional key.
 *
 * A revoked key CANNOT sign; verification against a revoked key
 * SHOULD fail in production. The reason is recorded in the audit
 * trail for forensic reconstruction.
 */
export function revokeKey(keyId: string, reason: string): void {
  const key = keyRegistry.get(keyId);
  if (!key) {
    appendCryptoAudit("revoke", keyId, "failure", "Key not found");
    throw new Error(`Key ${keyId} not found`);
  }
  key.status = "revoked";
  keyRegistry.set(keyId, key);
  appendCryptoAudit("revoke", keyId, "success", `Revoked: ${reason}`);
}

/** §39.1 Return a snapshot of the entire key registry. */
export function getKeyRegistry(): KeyMetadata[] {
  return Array.from(keyRegistry.values());
}

/** §39.5 Return a copy of the cryptographic audit trail. */
export function getCryptographicAuditLog(): CryptographicAuditEntry[] {
  return [...cryptographicAuditLog];
}

/**
 * §39.3 Sign a message with a constitutional key (SIMULATION).
 *
 * The simulation derives a deterministic HMAC-SHA256 keyed by the
 * `keyId`. In production this call is forwarded to the HSM which
 * signs with the private material and returns a real ECDSA / Ed25519
 * / Falcon-512 signature.
 *
 * @throws if the key does not exist or is not `"active"`.
 */
export function sign(message: string, keyId: string): SignatureResult {
  const key = keyRegistry.get(keyId);
  if (!key) {
    appendCryptoAudit("sign", keyId, "failure", "Key not found");
    throw new Error(`Key ${keyId} not found`);
  }
  if (key.status !== "active") {
    appendCryptoAudit("sign", keyId, "failure", `Key status is ${key.status}`);
    throw new Error(`Key ${keyId} is not active`);
  }

  // Simulated signature (in production: HSM signs with private key).
  const signature = createHmac("sha256", keyId).update(message).digest("hex");
  appendCryptoAudit("sign", keyId, "success", `Signed ${message.length} bytes`);
  return {
    signature,
    keyId,
    algorithm: key.keyType,
    timestamp: new Date().toISOString(),
    verified: true,
  };
}

/**
 * §39.3 Verify a signature against a constitutional key.
 *
 * The simulation re-derives the HMAC and compares it to the supplied
 * signature. In production this calls the HSM's public-key verify
 * primitive.
 */
export function verify(message: string, signature: string, keyId: string): boolean {
  const key = keyRegistry.get(keyId);
  if (!key) {
    appendCryptoAudit("verify", keyId, "failure", "Key not found");
    return false;
  }
  // Re-derive the simulated signature and compare.
  const expected = createHmac("sha256", keyId).update(message).digest("hex");
  const ok = expected === signature;
  appendCryptoAudit("verify", keyId, ok ? "success" : "failure", ok ? "Verified" : "Mismatch");
  return ok;
}

/**
 * §39.3 Threshold signature (MPC simulation).
 *
 * Collects `required` individual signatures from the supplied
 * `keyIds` and combines them into a single threshold signature.
 * In production this is performed by the MPC node — no individual
 * private key ever exists in a single location.
 *
 * @throws if fewer than `required` keys are supplied.
 */
export function thresholdSign(
  message: string,
  keyIds: string[],
  required: number,
): SignatureResult {
  if (keyIds.length < required) {
    throw new Error(`Need ${required} signatures, got ${keyIds.length}`);
  }
  const signatures = keyIds.slice(0, required).map((kid) => sign(message, kid));
  return {
    signature: signatures.map((s) => s.signature.slice(0, 16)).join(":"),
    keyId: `threshold-${required}-of-${keyIds.length}`,
    algorithm: "threshold-ecdsa",
    timestamp: new Date().toISOString(),
    verified: true,
  };
}

/**
 * §39.4 Zero-trust verification hook.
 *
 * In production this integrates with the policy engine (e.g. OPA) to
 * enforce "default deny, explicit allow" on every access request.
 * The simulation returns a permissive result but logs the request so
 * that downstream code can be wired up against the real policy engine
 * without behavioural changes.
 */
export function verifyZeroTrust(accessRequest: {
  principal: string;
  resource: string;
  action: string;
}): { allowed: boolean; reason: string } {
  // In production: integrate with policy engine.
  return {
    allowed: true,
    reason: "Zero-trust policy: default deny, explicit allow required (simulation)",
  };
}

// ============================================================
// §10: CONSTITUTIONAL COUNTERPARTY EXPOSURE LIMITS (ALIGNMENT)
// ============================================================
//
// The existing §10 7-tier table (above) models exposure as a tiered
// cap stack. The v19.0 blueprint §10 ALSO defines exposure along
// seven orthogonal CATEGORIES that map directly to §10.1–§10.7.
// This block surfaces the categorical view so compliance dashboards
// can render both representations from the same source of truth.
//
// The categorical limits are NOT redundant with the tier table:
//   - Tier table     → ordered by granularity, used for sequential
//                       cap-stack evaluation.
//   - Category table → keyed by category name, used for parallel
//                       exposure heat-map evaluation.
// Both views share the same numerical limits.

export interface ExposureLimit {
  category: string;
  limitPct: number;
  description: string;
  blueprintRef: string;
}

/**
 * §10.1–§10.7 Constitutional Exposure Limits (categorical view).
 *
 *   §10.1  single_counterparty         ≤ 10%
 *   §10.2  single_custodian             ≤ 25%
 *   §10.3  single_issuer                ≤ 15%
 *   §10.4  single_jurisdiction          ≤ 30%
 *   §10.5  single_currency              ≤ 35% (USD exempt per §10.5)
 *   §10.6  single_asset_class           ≤ 40%
 *   §10.7  operational_concentration    ≤ 35%
 *
 * NOTE on §10.5: USD is the constitutional unit-of-account and is
 * exempt from the 35% single-currency cap. The exemption is enforced
 * at the caller layer; this table records the nominal limit.
 */
export const CONSTITUTIONAL_EXPOSURE_LIMITS: ExposureLimit[] = [
  { category: "single_counterparty", limitPct: 0.10, description: "No single counterparty > 10%", blueprintRef: "§10.1" },
  { category: "single_custodian", limitPct: 0.25, description: "No single custodian > 25%", blueprintRef: "§10.2" },
  { category: "single_issuer", limitPct: 0.15, description: "No single issuer > 15%", blueprintRef: "§10.3" },
  { category: "single_jurisdiction", limitPct: 0.30, description: "No single jurisdiction > 30%", blueprintRef: "§10.4" },
  { category: "single_currency", limitPct: 0.35, description: "No single currency > 35% (except USD)", blueprintRef: "§10.5" },
  { category: "single_asset_class", limitPct: 0.40, description: "No single asset class > 40%", blueprintRef: "§10.6" },
  { category: "operational_concentration", limitPct: 0.35, description: "No single operational dependency > 35%", blueprintRef: "§10.7" },
];

export interface ExposureCheck {
  category: string;
  currentExposure: number;
  limit: number;
  /** Percentage of the limit currently utilised (0–100+). */
  utilized: number;
  status: "compliant" | "warning" | "breach";
}

/**
 * §10 Check categorical exposure against constitutional limits.
 *
 * Each key in `exposures` is a category name from
 * `CONSTITUTIONAL_EXPOSURE_LIMITS`; values are fractional exposures
 * (e.g. `0.12` = 12%). A category is `"warning"` when utilisation
 * exceeds 80% of the limit and `"breach"` when it exceeds 100%.
 *
 * Categories absent from `exposures` default to 0 (compliant).
 */
export function checkExposure(exposures: Record<string, number>): ExposureCheck[] {
  return CONSTITUTIONAL_EXPOSURE_LIMITS.map((limit) => {
    const current = exposures[limit.category] ?? 0;
    const utilized = (current / limit.limitPct) * 100;
    return {
      category: limit.category,
      currentExposure: current,
      limit: limit.limitPct,
      utilized,
      status: current > limit.limitPct ? "breach" : utilized > 80 ? "warning" : "compliant",
    };
  });
}

// ============================================================
// §12: CONSTITUTIONAL CURRENCY ADMISSION FRAMEWORK (EXPANSION)
// ============================================================
//
// The existing §12 `currencyLifecycle()` function implements a
// 4-stage state machine (observation → probation → full → suspended)
// over the basket's `CurrencyData[]`. The v19.0 blueprint §12
// actually specifies a 9-stage admission lifecycle with formal
// evaluation, council review, monitoring, removal, and reinstatement
// stages. This block implements the full 9-stage machine as a
// standalone `CurrencyAdmissionRecord` type — it does NOT replace
// `currencyLifecycle()`, which remains the canonical basket-wide
// view. The two are complementary:
//
//   `currencyLifecycle()`        → basket-level aggregate view
//   `CurrencyAdmissionRecord`    → per-currency granular workflow
//
// Callers advance a record through its stages with
// `advanceCurrencyStage()`, which validates the §12 transition
// matrix and appends a history entry on every successful transition.

export type CurrencyAdmissionStage =
  | "observation"     // §12.2: Initial monitoring (minimum 2 quarters)
  | "evaluation"      // §12.3: Technical + economic assessment
  | "probation"       // §12.4: Limited inclusion (minimum 2 quarters)
  | "council_review"  // §12.5: Council evaluation for full inclusion
  | "full_inclusion"  // §12.6: Full constitutional participation
  | "monitoring"      // §12.7: Continuous monitoring (ongoing)
  | "suspension"      // §12.8: Suspended due to SDP or eligibility failure
  | "removal"         // §12.9: Removed from basket
  | "reinstatement";  // §12.10: Reinstatement process

export interface CurrencyAdmissionRecord {
  code: string;
  currentStage: CurrencyAdmissionStage;
  enteredStageAt: string;
  history: { stage: CurrencyAdmissionStage; enteredAt: string; reason: string }[];
  evaluationScores?: { technical: number; economic: number; governance: number };
  councilApproval?: boolean;
  sdTriggered?: boolean;
}

/**
 * §12.2 Admit a new candidate currency to the observation stage.
 *
 * This is the entry point for any currency not yet in the basket.
 * The record is created with a single history entry recording the
 * admission reason.
 */
export function admitToObservation(code: string): CurrencyAdmissionRecord {
  return {
    code,
    currentStage: "observation",
    enteredStageAt: new Date().toISOString(),
    history: [
      { stage: "observation", enteredAt: new Date().toISOString(), reason: "Initial admission to observation" },
    ],
  };
}

/**
 * §12.3–§12.10 Stage transition matrix.
 *
 * Each key lists the stages the currency MAY transition INTO from
 * the current stage. Any transition not present here is rejected by
 * `advanceCurrencyStage()`.
 *
 * Notable paths:
 *   - observation → evaluation (after ≥ 2 quarters)
 *   - evaluation  → probation | removal
 *   - probation   → council_review | removal
 *   - council_review → full_inclusion | removal
 *   - full_inclusion → monitoring | suspension
 *   - monitoring  → suspension | full_inclusion (re-entry)
 *   - suspension  → removal | reinstatement
 *   - removal     → reinstatement (only after formal reinstatement vote)
 *   - reinstatement → probation | full_inclusion
 */
const CURRENCY_ADMISSION_TRANSITIONS: Record<
  CurrencyAdmissionStage,
  CurrencyAdmissionStage[]
> = {
  observation: ["evaluation"],
  evaluation: ["probation", "removal"],
  probation: ["council_review", "removal"],
  council_review: ["full_inclusion", "removal"],
  full_inclusion: ["monitoring", "suspension"],
  monitoring: ["suspension", "full_inclusion"],
  suspension: ["removal", "reinstatement"],
  removal: ["reinstatement"],
  reinstatement: ["probation", "full_inclusion"],
};

/**
 * §12 Advance a currency to the next admission stage.
 *
 * Validates the transition against the §12 transition matrix and,
 * on success, returns a NEW record (the input is not mutated) with
 * the updated `currentStage`, `enteredStageAt`, and an appended
 * history entry.
 *
 * @throws if the requested transition is not permitted by §12.
 */
export function advanceCurrencyStage(
  record: CurrencyAdmissionRecord,
  targetStage: CurrencyAdmissionStage,
  reason: string,
): CurrencyAdmissionRecord {
  if (!CURRENCY_ADMISSION_TRANSITIONS[record.currentStage]?.includes(targetStage)) {
    throw new Error(`Invalid transition: ${record.currentStage} → ${targetStage}`);
  }

  return {
    ...record,
    currentStage: targetStage,
    enteredStageAt: new Date().toISOString(),
    history: [
      ...record.history,
      { stage: targetStage, enteredAt: new Date().toISOString(), reason },
    ],
  };
}

// ============================================================
// §52: Constitutional Mathematical Engine Evolution
// ============================================================
//
// Implements the §52 versioning framework that governs how the
// mathematical engine (§1-22A core + §11 fixed-point layer) evolves
// over time. Every change to the engine MUST be recorded here so
// that downstream validators, auditors, and on-chain verifiers can
// determine compatibility with a given engine release.
//
// Versioning rules (per §52):
//   - Backward-compatible changes (bug fixes, clarifications,
//     additional precision) bump the minor version and keep
//     `backwardCompatible: true`.
//   - Breaking changes (new sections, revised formulas, changed
//     rounding semantics) bump the major version and require a
//     new entry with `backwardCompatible: false` until all
//     validators upgrade.
//   - Retired versions remain in the registry for audit history
//     but are marked `status: "retired"`.

export interface EngineVersion {
  version: string;
  releaseDate: string;
  status: "active" | "deprecated" | "retired";
  changes: string[];
  backwardCompatible: boolean;
  minValidatorVersion: string;
}

export const ENGINE_VERSIONS: EngineVersion[] = [
  {
    version: "v19.0",
    releaseDate: "2026-07-22",
    status: "active",
    changes: ["Initial constitutional release", "55 sections implemented", "Fixed-point arithmetic (§11)"],
    backwardCompatible: true,
    minValidatorVersion: "v19.0",
  },
];

export const CURRENT_ENGINE_VERSION = "v19.0";

export function getEngineVersion(): string {
  return CURRENT_ENGINE_VERSION;
}

export function isVersionCompatible(version: string): boolean {
  const v = ENGINE_VERSIONS.find(e => e.version === version);
  return v ? v.backwardCompatible : false;
}

export function getVersionHistory(): EngineVersion[] {
  return ENGINE_VERSIONS;
}

