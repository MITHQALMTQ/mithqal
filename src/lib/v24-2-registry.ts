// v24.2 §1 — Parameter Classification System + §0 Amendment Registry
// =================================================================
// Every monetary/risk parameter MUST be classified as exactly one of:
//   CLASS A — CONSTITUTIONAL INVARIANT (cannot be changed)
//   CLASS B — STRATEGIC POLICY (governance-selected long-term target)
//   CLASS C — OPERATING CORRIDOR (dynamic operating band)
//   CLASS D — MODEL PARAMETER (calibrated, version-controlled)
//
// V24_2_AMENDMENT_REGISTRY tracks all v24.1 → v24.2 changes.
// =================================================================

export type ParameterClass = "A" | "B" | "C" | "D";

export interface ParameterEntry {
  name: string;
  value: number | string;
  class: ParameterClass;
  version: string;
  authority: string;
  effectiveDate: string;
  description: string;
}

export interface AmendmentEntry {
  parameterName: string;
  v241Value: string;
  v242Value: string;
  classification: ParameterClass;
  reason: string;
  mathImpact: string;
  reserveImpact: string;
  liquidityImpact: string;
  capitalImpact: string;
  stressImpact: string;
  governanceAuthority: string;
  approvalRecord: string;
  effectiveVersion: string;
  implementationStatus: "PENDING" | "IMPLEMENTED" | "REGRESSION_PASSED";
}

// ---- Canonical v24.2 Parameter Registry ----
export const V24_2_PARAMETERS: ParameterEntry[] = [
  // CLASS A — Constitutional Invariants
  { name: "PAR", value: 1.00, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Fixed USD-denominated settlement/accounting reference unit" },
  { name: "RR_floor", value: 1.00, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Hard solvency floor — auto-pauses minting if breached" },
  { name: "Bullion_min", value: 0.15, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Minimum bullion allocation" },
  { name: "Bullion_max", value: 0.25, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Maximum bullion allocation" },
  { name: "Fiat_min", value: 0.70, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Minimum fiat allocation" },
  { name: "Fiat_max", value: 0.85, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Maximum fiat allocation" },
  { name: "Digital_max", value: 0.05, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Maximum digital liquidity allocation" },
  { name: "USD_hard_cap", value: 0.35, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Hard cap on Effective USD Exposure" },
  { name: "PerCurrency_cap", value: 0.60, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "General per-currency cap" },
  { name: "PerCustodian_cap", value: 0.15, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Per-custodian hard cap" },
  { name: "PerJurisdiction_cap", value: 0.30, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Per-jurisdiction cap" },
  { name: "PerStablecoinIssuer_cap", value: 0.02, class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Per-stablecoin-issuer cap" },
  { name: "ArticleX_liquidation", value: "stablecoins→cash→sovereign→FX→silver→gold LAST", class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Sequential liquidation order — gold LAST" },
  { name: "AntiPlatform_clause", value: "PERMANENT — no lending/exchange/brokerage/DeFi", class: "A", version: "v24.2", authority: "Constitution", effectiveDate: "2026-08-12", description: "Permanently frozen anti-platform prohibition" },

  // CLASS B — Strategic Policy
  { name: "RR_policy", value: 1.05, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Policy operating floor" },
  { name: "RR_strategic_target", value: 1.20, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Strategic planning target — 20% excess reserve over liabilities" },
  { name: "Gold_strategic_target", value: 0.15, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Strategic gold allocation target" },
  { name: "Silver_strategic_target", value: 0.03, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Strategic silver allocation target (reduced from 5% in v24.1)" },
  { name: "Fiat_strategic_target", value: 0.795, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Strategic fiat allocation target (increased from 76.5%)" },
  { name: "Digital_strategic_target", value: 0.025, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Strategic digital liquidity target (reduced from 3.5%)" },
  { name: "EffectiveUSD_target", value: 0.30, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Strategic target for Effective USD Exposure (includes pegged AED/SAR)" },
  { name: "LCR_strategic_target", value: 1.20, class: "B", version: "v24.2", authority: "Governance", effectiveDate: "2026-08-12", description: "Preferred LCR operating target" },

  // CLASS C — Operating Corridors
  { name: "Gold_normal_range", value: "12%-20%", class: "C", version: "v24.2", authority: "Policy", effectiveDate: "2026-08-12", description: "Dynamic normal operating range for gold" },
  { name: "Silver_normal_range", value: "3%-6%", class: "C", version: "v24.2", authority: "Policy", effectiveDate: "2026-08-12", description: "Dynamic normal operating range for silver (narrowed from 3-8%)" },
  { name: "Digital_normal_range", value: "2%-3.5%", class: "C", version: "v24.2", authority: "Policy", effectiveDate: "2026-08-12", description: "Normal operating zone for digital liquidity" },
  { name: "Digital_stress_range", value: "0%-2%", class: "C", version: "v24.2", authority: "Policy", effectiveDate: "2026-08-12", description: "Stress operating zone for digital liquidity" },
  { name: "phi_t_normal_band", value: "75%-85%", class: "C", version: "v24.2", authority: "Policy", effectiveDate: "2026-08-12", description: "Normal gold share of bullion" },

  // CLASS D — Model Parameters
  { name: "StructuralWeight_COFER", value: 0.35, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "COFER weight in structural base (was 0.45)" },
  { name: "StructuralWeight_FXTurnover", value: 0.25, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "FX turnover weight (was 0.35 SWIFT)" },
  { name: "StructuralWeight_TradeSettlement", value: 0.20, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "Trade settlement weight (new)" },
  { name: "StructuralWeight_InstitutionalQuality", value: 0.20, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "Institutional quality weight (new, replaces 0.20 BIS)" },
  { name: "Hysteresis_band", value: 0.02, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "2% hysteresis band for rebalancing" },
  { name: "Hysteresis_confirmation", value: 2, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "2-cycle confirmation requirement" },
  { name: "StressFloor", value: 1.00, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "Default hard stress floor for StressRR" },
  { name: "Lambdas_count", value: 10, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "Number of optimizer lambda terms (was 6)" },
  { name: "AED_USD_equivalence", value: 1.0, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "AED pegged to USD at 3.6725 — 100% USD-equivalent" },
  { name: "SAR_USD_equivalence", value: 1.0, class: "D", version: "v24.2", authority: "Model Calibration", effectiveDate: "2026-08-12", description: "SAR pegged to USD at 3.75 — 100% USD-equivalent" },
];

// ---- V24_2 Amendment Registry ----
export const V24_2_AMENDMENT_REGISTRY: AmendmentEntry[] = [
  {
    parameterName: "Silver_strategic_target",
    v241Value: "5%",
    v242Value: "3%",
    classification: "B",
    reason: "Silver at 5% provided insufficient diversification benefit relative to its 30% volatility. Reduced to 3% to lower portfolio volatility.",
    mathImpact: "Bullion target changes from 20% (15% gold + 5% silver) to 18% (15% gold + 3% silver). Fiat absorbs 2pp.",
    reserveImpact: "Fiat pillar increases from 76.5% to 79.5%. More stable, lower-volatility allocation.",
    liquidityImpact: "Improved — more fiat liquidity, less volatile bullion.",
    capitalImpact: "Neutral — same total reserve, different composition.",
    stressImpact: "Silver -50% shock costs ~0.7pp (was 1.2pp). Improved resilience.",
    governanceAuthority: "CTO + COO + CFO approved",
    approvalRecord: "v24.2-AMD-001",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "Digital_strategic_target",
    v241Value: "3.5%",
    v242Value: "2.5%",
    classification: "B",
    reason: "Reduced from 3.5% to 2.5% for more conservative digital liquidity allocation. Normal range 2-3.5% allows expansion when needed.",
    mathImpact: "Digital target reduced by 1pp. Fiat absorbs 1pp.",
    reserveImpact: "Fiat pillar increases to 79.5%.",
    liquidityImpact: "Slightly reduced digital liquidity, offset by increased fiat cash.",
    capitalImpact: "Neutral — same total reserve.",
    stressImpact: "Stablecoin -100% costs less (~1.8pp vs 2.1pp). Improved resilience.",
    governanceAuthority: "CTO + COO approved",
    approvalRecord: "v24.2-AMD-002",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "Reserve_states",
    v241Value: "5 states (NORMAL/ELEVATED/HIGH_STRESS/CRISIS/RECOVERY)",
    v242Value: "6 states (NORMAL/CAUTION/DEFENSIVE/STRESS/EMERGENCY/RECOVERY)",
    classification: "C",
    reason: "Added CAUTION and DEFENSIVE states for more granular early warning. Renamed HIGH_STRESS→STRESS, CRISIS→EMERGENCY.",
    mathImpact: "More state transitions, finer-grained corridor allocation.",
    reserveImpact: "Earlier detection of stress — CAUTION triggers pre-emptive rebalancing.",
    liquidityImpact: "DEFENSIVE state increases cash before STRESS is reached.",
    capitalImpact: "Neutral — better allocation within same capital.",
    stressImpact: "Improved — earlier intervention prevents breach.",
    governanceAuthority: "CTO approved",
    approvalRecord: "v24.2-AMD-003",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "StructuralWeight_formula",
    v241Value: "0.45×COFER + 0.35×SWIFT + 0.20×BIS",
    v242Value: "0.35×COFER + 0.25×FXTurnover + 0.20×TradeSettlement + 0.20×InstitutionalQuality",
    classification: "D",
    reason: "Old formula double-counted quality (SWIFT is correlated with quality). New formula separates institutional quality as explicit factor and adds trade settlement.",
    mathImpact: "Currency weights shift — currencies with high trade-settlement utility but lower COFER (SGD, AED) may increase.",
    reserveImpact: "More diversified currency allocation reflecting actual settlement patterns.",
    liquidityImpact: "Neutral — same liquidity profile.",
    capitalImpact: "Neutral.",
    stressImpact: "Improved — better diversification reduces concentration risk.",
    governanceAuthority: "CTO + Monetary Systems Architect approved",
    approvalRecord: "v24.2-AMD-004",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "EffectiveUSDExposure",
    v241Value: "Direct USD only (35% cap on USD line item)",
    v242Value: "Effective USD Exposure including pegged AED/SAR (30% target, 35% ceiling)",
    classification: "B",
    reason: "AED and SAR are pegged to USD — they are economically USD exposure. Old metric hid ~6% of USD-linked risk.",
    mathImpact: "Effective USD Exposure = USD_direct + USDC + BUIDL + AED×1.0 + SAR×1.0. Target ≤30%.",
    reserveImpact: "May require reducing direct USD to compensate for AED/SAR pegged exposure.",
    liquidityImpact: "Neutral — AED/SAR remain liquid.",
    capitalImpact: "Neutral.",
    stressImpact: "Improved — prevents hidden USD concentration.",
    governanceAuthority: "CFO + CTO approved",
    approvalRecord: "v24.2-AMD-005",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "Optimizer_structure",
    v241Value: "6-λ flat optimizer",
    v242Value: "4-tier hierarchical optimizer (Hard Constraints → Risk Objectives → Economic Costs → Stability Preference) with 10-λ",
    classification: "D",
    reason: "Flat optimizer allowed risk objectives to compete with constitutional constraints. Hierarchical design ensures constraints are NEVER traded away.",
    mathImpact: "Tier 1 must pass before Tier 2 evaluated. Tier 2 optimized before Tier 3 costs considered.",
    reserveImpact: "More conservative — optimizer cannot sacrifice safety for efficiency.",
    liquidityImpact: "Neutral.",
    capitalImpact: "May require slightly more capital in some scenarios (optimizer is more conservative).",
    stressImpact: "Improved — constitutional invariants are hard-gated.",
    governanceAuthority: "CTO approved",
    approvalRecord: "v24.2-AMD-006",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "TradeCost_model",
    v241Value: "4 components (execution/slippage/spread/total)",
    v242Value: "15 components + LifecycleCost (acquisition + holding + liquidation + opportunity)",
    classification: "D",
    reason: "4-component model undercounted true execution costs. 15-component model captures all-in cost including custody, storage, insurance, transport.",
    mathImpact: "TotalTradeCost increases for most assets, especially bullion. Optimizer trades less.",
    reserveImpact: "Lower turnover — more realistic cost-aware rebalancing.",
    liquidityImpact: "Slightly improved — less unnecessary trading.",
    capitalImpact: "Neutral — costs are operational, not capital.",
    stressImpact: "Improved — stress-dependent cost model (Normal/Stress/Emergency) captures crisis spreads.",
    governanceAuthority: "CTO + CFO approved",
    approvalRecord: "v24.2-AMD-007",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "ModelValidityGate",
    v241Value: "Not implemented (model failure mentioned but not gated)",
    v242Value: "HARD GATE — model failure → fallback to LastApprovedDeterministicPolicyPortfolio",
    classification: "A",
    reason: "Model failure must NEVER expand risk. If model is unavailable/unreliable, system falls back to last approved safe portfolio.",
    mathImpact: "Model failure = optimizer disabled. No discretionary risk expansion.",
    reserveImpact: "Reserve allocation frozen at last approved state during model failure.",
    liquidityImpact: "Neutral — liquidity preserved.",
    capitalImpact: "Neutral — no new risk taken.",
    stressImpact: "Significantly improved — prevents model-driven risk expansion during stress.",
    governanceAuthority: "CTO + COO approved",
    approvalRecord: "v24.2-AMD-008",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "StressDRQS",
    v241Value: "Not implemented (headline DRQS only)",
    v242Value: "StressDRQS — stress-adjusted DRQS used by optimizer",
    classification: "D",
    reason: "Headline DRQS doesn't reflect stress conditions. StressDRQS incorporates depeg shock, redemption stress, liquidity stress, counterparty deterioration.",
    mathImpact: "Optimizer uses min(DRQS, StressDRQS) for stablecoin weight calculation.",
    reserveImpact: "Lower stablecoin allocation during stress (StressDRQS < DRQS).",
    liquidityImpact: "Slightly reduced digital during stress.",
    capitalImpact: "Neutral.",
    stressImpact: "Improved — stablecoin risk is properly stress-adjusted.",
    governanceAuthority: "CTO + Risk Architect approved",
    approvalRecord: "v24.2-AMD-009",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
  {
    parameterName: "CALM_RR_targets",
    v241Value: "NORMAL=1.15, ELEVATED=1.20, HIGH_STRESS=1.25, CRISIS=1.30",
    v242Value: "NORMAL=1.15, CAUTION=1.18, DEFENSIVE=1.20, STRESS=1.25, EMERGENCY=1.30, RECOVERY=1.20",
    classification: "C",
    reason: "6-state machine requires 6 RR targets. CAUTION and DEFENSIVE are intermediate levels.",
    mathImpact: "More granular minting restriction. Earlier restriction in CAUTION state.",
    reserveImpact: "Minting restricted earlier — CAUTION triggers at RR<112%.",
    liquidityImpact: "Neutral.",
    capitalImpact: "Neutral — no additional capital required.",
    stressImpact: "Improved — earlier intervention prevents RR from reaching 100%.",
    governanceAuthority: "CTO + COO approved",
    approvalRecord: "v24.2-AMD-010",
    effectiveVersion: "v24.2",
    implementationStatus: "IMPLEMENTED",
  },
];

export function getParameter(name: string): ParameterEntry | undefined {
  return V24_2_PARAMETERS.find(p => p.name === name);
}

export function getAmendments(): AmendmentEntry[] {
  return V24_2_AMENDMENT_REGISTRY;
}
