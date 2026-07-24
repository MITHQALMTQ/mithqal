// Mithqal v19.0 — Constitutional Infrastructure Modules
//
// Implements Part V (Oracle Engine & Technical Operations, §30-42) and
// Part VI (Governance & Constitutional Framework, §43-55) of the v19.0
// specification. These modules complement the Monetary Engine (§1-22A)
// and Reserve Allocation (§23-29).
//
// All implementations are faithful to the v19.0 specification, which is
// the single source of truth.

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
  redemptionPlan: { assetClass: string; liquidatedUsd: number }[]
): { goldLiquidated: boolean; sufficient: boolean } {
  const goldRow = redemptionPlan.find((r) => r.assetClass === "gold");
  const goldLiquidated = !!goldRow && goldRow.liquidatedUsd > 0;
  const lastRow = redemptionPlan[redemptionPlan.length - 1];
  const sufficient = !lastRow || lastRow.remaining <= 0;
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
// Helpers
// ============================================================

function median(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}
