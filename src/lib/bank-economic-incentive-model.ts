// src/lib/bank-economic-incentive-model.ts
//
// MITHQAL v25.3.21 — CANONICAL BANK ECONOMIC INCENTIVE MODEL
// (single source of truth for why a bank would participate in MITHQAL,
//  extending the v25.3.11 Q1 bank-value-model with 12 granular factors +
//  founding-bank economics; enforces that MITHQAL is NOT the network
//  pre-funder and that 'nostro release' is NOT promised without a
//  demonstrated mechanism; all incentives are SEPARATE from monetary
//  authorization, risk approval, and finality decisions)
//
// Per PROMPT 44 (verbatim):
//   "Extend the commercial model to quantify why a bank would participate.
//    Model: nostro/vostro liquidity usage, trapped liquidity, settlement
//    timing, FX spread economics, reconciliation cost, compliance/evidence
//    operating cost, exception-management cost, infrastructure cost,
//    service revenue, treasury/liquidity benefits, integration cost,
//    change-management cost.
//    Create a bank value equation based on measured or explicitly assumed
//    inputs.
//    Do NOT make MITHQAL the network pre-funder.
//    Do NOT promise 'nostro release' unless the mechanism is actually
//    demonstrated.
//    Add founding-bank economics such as: pilot pricing, implementation
//    concessions, fee rebates, corridor incentives, governance participation,
//    or other incentives only where legally and commercially appropriate.
//    All incentives must remain separate from monetary authorization, risk
//    approval and finality decisions."
//
// CHANGE REQUEST: CR-2026-020 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.21
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Does NOT make MITHQAL the network pre-funder (NOT_NETWORK_PREFUNDER_RULE)
//   - Does NOT promise 'nostro release' unless demonstrated (NO_NOSTRO_RELEASE_PROMISE_RULE)
//   - All founding-bank incentives are SEPARATE from monetary authorization,
//     risk approval, and finality decisions (INCENTIVE_SEPARATION_RULE)
//   - All founding-bank incentives are PENDING until the relevant contract,
//     license, or governance approval is in place (HONEST_STATE)
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.3.2 K2 (MTQ economic definition — canonical MTQ description)
//   - v25.3.4 J3 (control-plane boundary — CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience)
//   - v25.3.8 N1 (canonical finality model F0-F7)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.9 O2 (6 reconciliation tolerance policies)
//   - v25.3.10 P1 (Corridor Pain Index — 12 weighted factors)
//   - v25.3.10 P2 (two pilot modes — PILOT_A_CONTROL_PLANE + PILOT_B_MTQ_SETTLEMENT)
//   - v25.3.11 Q1 (bank value model + 4 evidence status labels — extends here
//     with 12 granular factors per PROMPT 44)
//   - v25.3.11 Q2 (pilot gate framework — 15 default gates GATE-A1..GATE-B7)
//   - v25.3.12 R1 (bank-facing document set)
//   - v25.3.13 P1 (Corridor Pain Index — settlement timing factor)
//   - v25.3.14 T2 (Architecture Freeze — 7-step change process)
//   - v25.3.16 U1 (Accounting/Prudential/Tax Framework — 10 classification areas)
//   - v25.3.18 W1 (Bank Contracting Package — 17 sections ALL DRAFT)
//   - v25.3.18 W2 (Enterprise Risk Register — 17 risks)
//   - v25.3.20 Y2 (Institutionalization Operating Plan — 11 role categories)

import {
  EVIDENCE_STATUS_LABELS,
  type EvidenceStatus,
} from "@/lib/bank-value-model";

// ============================================================================
// TYPES
// ============================================================================

// 12 economic factors per directive (PROMPT 44 verbatim order)
export type FactorId =
  | "NOSTRO_VOSTRO_LIQUIDITY_USAGE"
  | "TRAPPED_LIQUIDITY"
  | "SETTLEMENT_TIMING"
  | "FX_SPREAD_ECONOMICS"
  | "RECONCILIATION_COST"
  | "COMPLIANCE_EVIDENCE_OPERATING_COST"
  | "EXCEPTION_MANAGEMENT_COST"
  | "INFRASTRUCTURE_COST"
  | "SERVICE_REVENUE"
  | "TREASURY_LIQUIDITY_BENEFITS"
  | "INTEGRATION_COST"
  | "CHANGE_MANAGEMENT_COST";

// Direction: a positive contribution increases bank value; a negative
// contribution decreases it. The sign is fixed per the directive's
// definition of each factor.
export type FactorDirection = "POSITIVE" | "NEGATIVE";

// Honesty tier — the factor's stage of validation
// DESIGN-TIME: only the canonical definition exists; no measured inputs yet
// MEASURED: bank-entered measured inputs are accepted (still NOT institutional)
// INSTITUTIONAL: an independent auditor or regulator has attested the figure
export type FactorHonestyTier = "DESIGN_TIME" | "MEASURED" | "INSTITUTIONAL";

// Founding-bank economic incentive category (per directive)
export type FoundingBankIncentiveId =
  | "PILOT_PRICING"
  | "IMPLEMENTATION_CONCESSIONS"
  | "FEE_REBATES"
  | "CORRIDOR_INCENTIVES"
  | "GOVERNANCE_PARTICIPATION";

export interface EconomicFactor {
  // identity
  factorId: FactorId;
  name: string;
  description: string;

  // Direction (POSITIVE = increases bank value, NEGATIVE = decreases)
  direction: FactorDirection;

  // Whether this factor may use measured inputs from the bank
  // (some factors are POSITIVE in theory but only realized once a
  // mechanism is demonstrated — e.g., TRAPPED_LIQUIDITY release requires
  // the nostro-release mechanism to be demonstrated)
  mayUseMeasuredInputs: boolean;

  // Whether the benefit requires a demonstrated mechanism to be claimed
  // (e.g., nostro release requires demonstration; FX spread reduction
  // requires demonstration of the FX corridor)
  requiresDemonstratedMechanism: boolean;

  // Whether the mechanism has been demonstrated
  // (HONEST STATE: NO mechanism has been demonstrated yet — all are
  //  PENDING the relevant pilot / contract / governance milestone)
  mechanismDemonstrated: boolean;

  // Honesty tier
  honestyTier: FactorHonestyTier;

  // The formula for computing this factor's USD value
  formula: string;

  // Example inputs (ILLUSTRATIVE — bank-entered, NOT universal claims)
  illustrativeInputs: {
    label: string;
    value: string;
    unit: string;
  }[];

  // What the factor would prove IF the bank entered measured inputs AND
  // an independent auditor attested the inputs (institutional tier)
  whatItWouldProveAtInstitutionalTier: string[];

  // What the factor DOES NOT prove even at the institutional tier
  // (per INCENTIVE_SEPARATION_RULE — incentives remain separate from
  //  monetary authorization, risk approval, and finality decisions)
  whatItDoesNotProve: string[];

  // Cross-references to prior canonical modules
  crossReferences: string[];
}

export interface FoundingBankIncentive {
  incentiveId: FoundingBankIncentiveId;
  name: string;
  description: string;

  // Whether the incentive is contractually in place
  // (HONEST STATE: all incentives are PENDING — none is contractually
  //  in place until the relevant contract / governance approval is obtained)
  contractuallyInPlace: boolean;

  // Whether the incentive is contingent on a pilot milestone
  contingentOnPilotMilestone: boolean;

  // The pilot milestone (per v25.3.11 Q2 pilot gate framework)
  pilotMilestoneGateId: string;

  // The legal/commercial vehicle (per v25.3.18 W1 Bank Contracting Package)
  contractingVehicle: string;

  // Honest status
  status: "DESIGN_TIME" | "PENDING_EXTERNAL_VALIDATION" | "ACTIVE";

  // What the incentive provides (in economic terms)
  provides: string[];

  // What the incentive DOES NOT provide (per INCENTIVE_SEPARATION_RULE)
  doesNotProvide: string[];
}

// ============================================================================
// CRITICAL RULES (per directive — verbatim)
// ============================================================================

export const NOT_NETWORK_PREFUNDER_RULE = {
  ruleId: "NOT_NETWORK_PREFUNDER_RULE",
  rule:
    "Per PROMPT 44: Do NOT make MITHQAL the network pre-funder. MITHQAL " +
    "is NOT the pre-funder of settlement liquidity for the institutional " +
    "network. Pre-funding obligations remain with the participating banks.",
  description:
    "MITHQAL operates an evidence-gated control-plane for institutional " +
    "settlement coordination (per v25.3.4 J3 control-plane boundary). " +
    "MITHQAL does NOT advance, lend, or pre-fund settlement liquidity. " +
    "Each participating bank remains responsible for pre-funding its own " +
    "settlement position. The TRAPPED_LIQUIDITY and NOSTRO_VOSTRO_LIQUIDITY_USAGE " +
    "factors may quantify the BENEFIT to a bank of reduced pre-funding " +
    "needs (if a demonstrated mechanism enables the reduction), but MITHQAL " +
    "does NOT itself provide the liquidity that replaces the pre-funding.",
  whatItForbids: [
    "Describes MITHQAL as the network pre-funder",
    "Claims that MITHQAL advances liquidity to banks",
    "Claims that MITHQAL holds settlement liquidity on behalf of banks",
    "Treats MITHQAL's reserves as a substitute for bank nostro/vostro pre-funding",
    "Implies that MITHQAL will fund the closed-loop network's settlement positions",
  ],
  whatItPermits: [
    "MITHQAL coordinates settlement evidence and finality among banks (per v25.3.8 N1 canonical finality model F0-F7)",
    "MITHQAL issues MTQ (a closed-loop institutional settlement unit) per the v25.3.2 K2 canonical MTQ economic definition",
    "MITHQAL publishes a bank value equation that quantifies the BENEFIT to a bank of reduced pre-funding needs (when a demonstrated mechanism enables the reduction)",
    "Each participating bank remains responsible for its own liquidity",
  ],
  enforcement:
    "Runtime invariant `assertMithqalNotPrefunder` fails fast at module " +
    "load if any factor describes MITHQAL as the network pre-funder. " +
    "The TRAPPED_LIQUIDITY and NOSTRO_VOSTRO_LIQUIDITY_USAGE factors carry " +
    "requiresDemonstratedMechanism=true and mechanismDemonstrated=false " +
    "(honest — no demonstrated nostro-release mechanism yet).",
} as const;

export const NO_NOSTRO_RELEASE_PROMISE_RULE = {
  ruleId: "NO_NOSTRO_RELEASE_PROMISE_RULE",
  rule:
    "Per PROMPT 44: Do NOT promise 'nostro release' unless the mechanism " +
    "is actually demonstrated. The TRAPPED_LIQUIDITY factor may quantify " +
    "the POTENTIAL benefit of nostro release IF a mechanism is demonstrated, " +
    "but it does NOT promise that nostro release will occur.",
  description:
    "Nostro release refers to the reduction of trapped liquidity in " +
    "nostro/vostro accounts (correspondent banking accounts where the bank " +
    "holds balances to support cross-border payment flows). MITHQAL may " +
    "enable nostro release through a demonstrated mechanism (e.g., the " +
    "MTQ closed-loop settlement unit replacing some correspondent flows) " +
    "— but this benefit is contingent on the mechanism being demonstrated " +
    "in the v25.3.10 P2 PILOT_B_MTQ_SETTLEMENT pilot. Until then, the " +
    "TRAPPED_LIQUIDITY factor carries mechanismDemonstrated=false and " +
    "the benefit is DESIGN-TIME.",
  whatItForbids: [
    "Promises 'nostro release' as a guaranteed outcome",
    "Claims a specific dollar amount of nostro release without a demonstrated mechanism",
    "Treats nostro release as automatic or unconditional",
    "Implies that participation in MITHQAL alone releases nostro liquidity",
  ],
  whatItPermits: [
    "Quantifies the POTENTIAL benefit of nostro release IF a mechanism is demonstrated (DESIGN-TIME)",
    "Carries the nostro-release benefit as a hypothesis contingent on the v25.3.10 P2 PILOT_B_MTQ_SETTLEMENT pilot",
    "Updates the factor to MEASURED tier when the pilot produces measured inputs",
    "Updates the factor to INSTITUTIONAL tier when an independent auditor attests the measured inputs",
  ],
  enforcement:
    "Runtime invariant `assertNoNostroReleasePromise` fails fast at module " +
    "load if any factor promises nostro release without a demonstrated " +
    "mechanism. The TRAPPED_LIQUIDITY factor carries " +
    "requiresDemonstratedMechanism=true, mechanismDemonstrated=false, and " +
    "honestyTier=DESIGN_TIME. The factor description explicitly states " +
    "that the benefit is contingent on a demonstrated mechanism.",
} as const;

export const INCENTIVE_SEPARATION_RULE = {
  ruleId: "INCENTIVE_SEPARATION_RULE",
  rule:
    "Per PROMPT 44: All incentives must remain SEPARATE from monetary " +
    "authorization, risk approval, and finality decisions. Founding-bank " +
    "incentives (pilot pricing, implementation concessions, fee rebates, " +
    "corridor incentives, governance participation) cannot influence " +
    "the determination of: monetary authorization (whether a bank may " +
    "mint), risk approval (whether a settlement is risk-acceptable), or " +
    "finality decisions (whether a settlement is final).",
  description:
    "The control-plane boundary (per v25.3.4 J3) separates " +
    "CONTROL_PLANE_CORE (where incentives live) from MTQ_SETTLEMENT_MODULE " +
    "(where settlement authorization, risk approval, and finality decisions " +
    "live). Incentives influence the COMMERCIAL decision to participate; " +
    "they DO NOT influence the TECHNICAL/REGULATORY decisions to authorize, " +
    "approve risk, or finalize. The 12 economic factors compute the bank " +
    "value; the founding-bank incentives are layered on top of the bank " +
    "value as commercial terms — but the bank value and the incentives " +
    "together do NOT change the answer to: 'should this mint be authorized?', " +
    "'should this settlement be approved?', or 'is this settlement final?'.",
  whatItForbids: [
    "An incentive (e.g., fee rebate) that conditions monetary authorization",
    "An incentive (e.g., governance participation) that conditions risk approval",
    "An incentive (e.g., corridor incentive) that conditions finality decisions",
    "Treating incentives as substitutes for the v25.3.11 Q2 pilot gate framework gates",
    "Bypassing the v25.3.8 N1 canonical finality model F0-F7 via an incentive",
    "Waiving a v25.3.7 M2 trust domain (Domain A Policy/Authorization, Domain B Finality Attestation, Domain C Execution) via an incentive",
  ],
  whatItPermits: [
    "Founding-bank incentives that influence the COMMERCIAL decision to participate",
    "Pilot pricing that reduces service fees for founding banks during the pilot window",
    "Implementation concessions that reduce one-time integration cost for founding banks",
    "Fee rebates tied to corridor volume (commercial terms only)",
    "Corridor incentives that reward early participation in defined corridors (commercial terms only)",
    "Governance participation in commercial-governance forums (not in monetary-authorization forums)",
  ],
  enforcement:
    "Runtime invariant `assertIncentiveSeparation` fails fast at module " +
    "load if any founding-bank incentive has contractuallyInPlace=true " +
    "without an active contract (per v25.3.18 W1 Bank Contracting Package — " +
    "all 17 sections ALL DRAFT). The 5 founding-bank incentives all carry " +
    "status=PENDING_EXTERNAL_VALIDATION (honest — no contract executed yet). " +
    "The `doesNotProvide` field on each incentive explicitly enumerates the " +
    "forbidden equivalences per this rule.",
} as const;

// ============================================================================
// THE 12 ECONOMIC FACTORS (per directive — verbatim)
// ============================================================================

export const ECONOMIC_FACTORS: EconomicFactor[] = [
  // =================================================================
  // 1. NOSTRO_VOSTRO_LIQUIDITY_USAGE (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "NOSTRO_VOSTRO_LIQUIDITY_USAGE",
    name: "Nostro/Vostro Liquidity Usage",
    description:
      "The reduction in nostro/vostro liquidity usage that a bank may " +
      "experience IF the MITHQAL closed-loop settlement unit (MTQ) " +
      "replaces some correspondent banking flows. This benefit is " +
      "contingent on a demonstrated mechanism (per NOT_NETWORK_PREFUNDER_RULE: " +
      "MITHQAL does NOT itself provide the liquidity; the bank's own " +
      "liquidity is reallocated from nostro/vostro to closed-loop " +
      "settlement).",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "nostroReductionBenefitUsd = currentNostroBalanceUsd × (nostroReductionPct / 100) × (annualCostOfNostroFundingBps / 10000)",
    illustrativeInputs: [
      { label: "currentNostroBalanceUsd", value: "500_000_000", unit: "USD" },
      { label: "nostroReductionPct", value: "20.0", unit: "%" },
      { label: "annualCostOfNostroFundingBps", value: "75", unit: "bps" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured nostro balance has been reduced by the demonstrated percentage",
      "The annual cost of funding the reduced nostro balance has been reduced accordingly",
      "An independent auditor has attested the measured inputs and the calculation",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (incentive ≠ authorization per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (incentive ≠ risk approval per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (incentive ≠ finality per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove that MITHQAL provided the liquidity (MITHQAL is NOT the pre-funder per NOT_NETWORK_PREFUNDER_RULE)",
      "Does NOT promise nostro release (per NO_NOSTRO_RELEASE_PROMISE_RULE)",
    ],
    crossReferences: [
      "v25.3.2 K2 (MTQ economic definition — closed-loop settlement unit)",
      "v25.3.4 J3 (control-plane boundary — CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)",
      "v25.3.10 P1 (Corridor Pain Index — nostro/trapped liquidity factor)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the mechanism)",
      "v25.3.11 Q1 (bank value model — liquidityBenefit component)",
    ],
  },

  // =================================================================
  // 2. TRAPPED_LIQUIDITY (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "TRAPPED_LIQUIDITY",
    name: "Trapped Liquidity",
    description:
      "The reduction in trapped liquidity (funds held in nostro/vostro " +
      "accounts that cannot be deployed productively) that a bank may " +
      "experience IF the MITHQAL closed-loop settlement unit replaces " +
      "some correspondent flows. This benefit is CONTINGENT on a " +
      "demonstrated mechanism (per NO_NOSTRO_RELEASE_PROMISE_RULE: " +
      "MITHQAL does NOT promise nostro release without demonstration). " +
      "Until the v25.3.10 P2 PILOT_B_MTQ_SETTLEMENT pilot produces " +
      "measured evidence, this factor is DESIGN-TIME.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "trappedLiquidityBenefitUsd = trappedLiquidityUsd × (releasePct / 100) × (opportunityCostBps / 10000)",
    illustrativeInputs: [
      { label: "trappedLiquidityUsd", value: "300_000_000", unit: "USD" },
      { label: "releasePct", value: "15.0", unit: "%" },
      { label: "opportunityCostBps", value: "200", unit: "bps" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured trapped liquidity has been reduced by the demonstrated percentage",
      "The opportunity cost of the released liquidity has been computed and attested",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove that MITHQAL provided the released liquidity (per NOT_NETWORK_PREFUNDER_RULE)",
      "Does NOT promise nostro release without demonstration (per NO_NOSTRO_RELEASE_PROMISE_RULE)",
    ],
    crossReferences: [
      "v25.3.10 P1 (Corridor Pain Index — trapped liquidity factor)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the mechanism)",
      "v25.3.11 Q1 (bank value model — liquidityBenefit component)",
    ],
  },

  // =================================================================
  // 3. SETTLEMENT_TIMING (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "SETTLEMENT_TIMING",
    name: "Settlement Timing",
    description:
      "The reduction in settlement time (from T+N days to seconds or " +
      "minutes) that a bank may experience. This benefit is contingent " +
      "on the v25.3.10 P2 PILOT_B_MTQ_SETTLEMENT pilot demonstrating " +
      "faster settlement. Per v25.3.11 Q1 bank-value-model directive: " +
      "'Do not hard-code illustrative 7bps or sub-2-second numbers as " +
      "universal claims.' Settlement time is bank-entered, NOT universal.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "timingBenefitUsd = (currentSettlementDays - mithqalSettlementDays) × averageDailySettlementUsd × (dailyCostOfCapitalBps / 10000)",
    illustrativeInputs: [
      { label: "currentSettlementDays", value: "2.0", unit: "days" },
      { label: "mithqalSettlementDays", value: "0.01", unit: "days" },
      { label: "averageDailySettlementUsd", value: "10_000_000", unit: "USD" },
      { label: "dailyCostOfCapitalBps", value: "5", unit: "bps" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured settlement time has been reduced as claimed",
      "The cost-of-capital saving has been computed from the bank's measured inputs",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove a universal sub-2-second settlement (per v25.3.11 Q1 — no hard-coded universal claims)",
    ],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7 — settlement timing per finality stage)",
      "v25.3.10 P1 (Corridor Pain Index — settlement timing factor)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the mechanism)",
      "v25.3.11 Q1 (bank value model — no hard-coded sub-2-second universal claims)",
    ],
  },

  // =================================================================
  // 4. FX_SPREAD_ECONOMICS (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "FX_SPREAD_ECONOMICS",
    name: "FX Spread Economics",
    description:
      "The reduction in FX spread costs that a bank may experience " +
      "IF the MITHQAL closed-loop settlement unit reduces the number of " +
      "FX legs (e.g., by netting flows in MTQ before FX conversion). " +
      "This benefit is contingent on a demonstrated mechanism. Per " +
      "v25.3.11 Q1: 'Do not hard-code illustrative 7bps or sub-2-second " +
      "numbers as universal claims.' FX spreads are bank-entered.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "fxBenefitUsd = annualFxVolumeUsd × (fxSpreadReductionBps / 10000)",
    illustrativeInputs: [
      { label: "annualFxVolumeUsd", value: "2_000_000_000", unit: "USD" },
      { label: "currentFxSpreadBps", value: "50", unit: "bps" },
      { label: "fxSpreadReductionBps", value: "20", unit: "bps" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured FX spread has been reduced as claimed",
      "The annual FX volume and the spread reduction have been computed from measured inputs",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove a universal 7bps FX spread reduction (per v25.3.11 Q1)",
    ],
    crossReferences: [
      "v25.3.10 P1 (Corridor Pain Index — FX spread factor)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the mechanism)",
      "v25.3.11 Q1 (bank value model — fxBenefit component, no universal 7bps claim)",
    ],
  },

  // =================================================================
  // 5. RECONCILIATION_COST (POSITIVE — bank value increase via savings)
  // =================================================================
  {
    factorId: "RECONCILIATION_COST",
    name: "Reconciliation Cost",
    description:
      "The reduction in reconciliation cost that a bank may experience " +
      "IF the MITHQAL Institutional Evidence Fabric (per v25.3.8 N2) " +
      "and the v25.3.9 O2 reconciliation tolerance policies reduce the " +
      "manual reconciliation burden. Reconciliation cost savings are " +
      "contingent on the v25.3.10 P2 PILOT_B_MTQ_SETTLEMENT pilot " +
      "demonstrating the reduction.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "reconciliationSavingsUsd = annualReconciliationCostUsd × (reconciliationCostReductionPct / 100)",
    illustrativeInputs: [
      { label: "annualReconciliationCostUsd", value: "500_000", unit: "USD" },
      { label: "reconciliationCostReductionPct", value: "30.0", unit: "%" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured reconciliation cost has been reduced as claimed",
      "The reduction has been computed from measured inputs (FTE hours saved × cost per FTE hour)",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT eliminate reconciliation (the v25.3.9 O2 tolerance policies still apply; the bank must still reconcile within tolerance)",
    ],
    crossReferences: [
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)",
      "v25.3.9 O2 (6 reconciliation tolerance policies — LEDGER_TO_LEDGER=1bps, etc.)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the reduction)",
      "v25.3.11 Q1 (bank value model — operationalSavings component)",
    ],
  },

  // =================================================================
  // 6. COMPLIANCE_EVIDENCE_OPERATING_COST (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "COMPLIANCE_EVIDENCE_OPERATING_COST",
    name: "Compliance/Evidence Operating Cost",
    description:
      "The reduction in compliance/evidence operating cost that a bank " +
      "may experience IF the MITHQAL Institutional Evidence Fabric (per " +
      "v25.3.8 N2) reduces duplicate AML/KYC/sanctions screening and " +
      "evidence generation. This is a POSITIVE factor (cost savings). " +
      "The benefit is contingent on a demonstrated mechanism.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "complianceSavingsUsd = annualComplianceCostUsd × (complianceCostReductionPct / 100)",
    illustrativeInputs: [
      { label: "annualComplianceCostUsd", value: "1_000_000", unit: "USD" },
      { label: "complianceCostReductionPct", value: "15.0", unit: "%" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured compliance cost has been reduced as claimed",
      "The reduction has been computed from measured inputs (FTE hours + technology cost)",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT eliminate compliance (the bank remains responsible for AML/KYC/sanctions compliance per its regulator)",
    ],
    crossReferences: [
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage + SHA-256)",
      "v25.3.11 Q1 (bank value model — complianceEvidenceSavings component)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the reduction)",
    ],
  },

  // =================================================================
  // 7. EXCEPTION_MANAGEMENT_COST (POSITIVE — bank value increase via savings)
  // =================================================================
  {
    factorId: "EXCEPTION_MANAGEMENT_COST",
    name: "Exception-Management Cost",
    description:
      "The reduction in exception-management cost that a bank may " +
      "experience IF the MITHQAL Dispute & Exception Framework (per " +
      "v25.3.19 X1 — 7 exception types × 9 stages) reduces the manual " +
      "exception-handling burden. Exception-management cost savings are " +
      "contingent on a demonstrated mechanism.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "exceptionSavingsUsd = annualExceptionCostUsd × (exceptionCostReductionPct / 100)",
    illustrativeInputs: [
      { label: "annualExceptionCostUsd", value: "250_000", unit: "USD" },
      { label: "exceptionCostReductionPct", value: "20.0", unit: "%" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured exception-management cost has been reduced as claimed",
      "The reduction has been computed from measured inputs (FTE hours + escalation cost)",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT eliminate exceptions (the Dispute & Exception Framework still applies; exceptions are handled per the framework)",
    ],
    crossReferences: [
      "v25.3.19 X1 (Dispute & Exception Framework — 7 types × 9 stages = 63 cells)",
      "v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle, exception handling per RECONCILE stage)",
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the reduction)",
    ],
  },

  // =================================================================
  // 8. INFRASTRUCTURE_COST (NEGATIVE — bank value decrease)
  // =================================================================
  {
    factorId: "INFRASTRUCTURE_COST",
    name: "Infrastructure Cost",
    description:
      "The ongoing infrastructure cost that a bank incurs to participate " +
      "in MITHQAL — the bank's share of network connectivity, " +
      "observability, and any bank-side infrastructure (HSM, secure " +
      "messaging, integration adapters). This is a NEGATIVE factor (cost). " +
      "Per v25.3.11 Q1: bank-entered, NOT universal.",
    direction: "NEGATIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: false,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "infrastructureCostUsd = annualNetworkConnectivityCost + annualBankSideInfraCost + annualHSMCost",
    illustrativeInputs: [
      { label: "annualNetworkConnectivityCost", value: "50_000", unit: "USD" },
      { label: "annualBankSideInfraCost", value: "75_000", unit: "USD" },
      { label: "annualHSMCost", value: "25_000", unit: "USD" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured infrastructure cost has been computed from measured inputs",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
    ],
    crossReferences: [
      "v25.3.4 J3 (control-plane boundary — bank-side infrastructure vs MITHQAL infrastructure)",
      "v25.3.11 Q1 (bank value model — operatingCost component)",
      "v25.3.20 Y2 (Operating Plan — INFRASTRUCTURE capital type)",
    ],
  },

  // =================================================================
  // 9. SERVICE_REVENUE (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "SERVICE_REVENUE",
    name: "Service Revenue",
    description:
      "The new service revenue that a bank may earn by participating in " +
      "MITHQAL — e.g., fees for serving as a custodian bank, fees for " +
      "operating a corridor, fees for providing settlement liquidity. " +
      "This is a POSITIVE factor (new revenue). Revenue is contingent " +
      "on the v25.3.18 W1 Bank Contracting Package being executed (the " +
      "fee schedule is in DRAFT).",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "serviceRevenueUsd = custodyFeesUsd + corridorFeesUsd + settlementLiquidityProvisionFeesUsd",
    illustrativeInputs: [
      { label: "custodyFeesUsd", value: "100_000", unit: "USD" },
      { label: "corridorFeesUsd", value: "75_000", unit: "USD" },
      { label: "settlementLiquidityProvisionFeesUsd", value: "50_000", unit: "USD" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured service revenue has been computed from executed contracts",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove a guaranteed revenue stream (revenue is contingent on contracts being executed and volumes materializing)",
    ],
    crossReferences: [
      "v25.3.18 W1 (Bank Contracting Package — 17 sections ALL DRAFT, fee schedule in DRAFT)",
      "v25.3.11 Q1 (bank value model — newRevenue component)",
      "v25.3.13 P1 (Corridor Pain Index — corridor-specific economics)",
    ],
  },

  // =================================================================
  // 10. TREASURY_LIQUIDITY_BENEFITS (POSITIVE — bank value increase)
  // =================================================================
  {
    factorId: "TREASURY_LIQUIDITY_BENEFITS",
    name: "Treasury/Liquidity Benefits",
    description:
      "The treasury and liquidity benefits that a bank's treasury function " +
      "may experience — e.g., improved liquidity forecasting, reduced " +
      "intraday liquidity stress, better collateral mobility. This is a " +
      "POSITIVE factor. Benefits are contingent on the v25.3.10 P2 " +
      "PILOT_B_MTQ_SETTLEMENT pilot demonstrating the improvements. " +
      "Per NOT_NETWORK_PREFUNDER_RULE: MITHQAL does NOT provide the " +
      "liquidity; the bank's treasury benefits from its own reallocated " +
      "liquidity.",
    direction: "POSITIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: true,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "treasuryBenefitUsd = (liquidityForecastAccuracyGainBps / 10000) × annualTreasuryFlowUsd + intradayStressReductionUsd",
    illustrativeInputs: [
      { label: "liquidityForecastAccuracyGainBps", value: "10", unit: "bps" },
      { label: "annualTreasuryFlowUsd", value: "5_000_000_000", unit: "USD" },
      { label: "intradayStressReductionUsd", value: "100_000", unit: "USD" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured treasury benefits have been computed from measured inputs",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove that MITHQAL provided the liquidity (per NOT_NETWORK_PREFUNDER_RULE)",
    ],
    crossReferences: [
      "v25.3.10 P2 (PILOT_B_MTQ_SETTLEMENT — pilot to demonstrate the benefits)",
      "v25.3.11 Q1 (bank value model — liquidityBenefit component)",
      "v25.3.20 Y2 (Operating Plan — TREASURY_LIQUIDITY role category)",
    ],
  },

  // =================================================================
  // 11. INTEGRATION_COST (NEGATIVE — bank value decrease, one-time)
  // =================================================================
  {
    factorId: "INTEGRATION_COST",
    name: "Integration Cost",
    description:
      "The one-time integration cost that a bank incurs to connect to " +
      "MITHQAL — engineering, API integration, custody adapter, " +
      "compliance adapter, oracle adapter. This is a NEGATIVE factor " +
      "(one-time cost). Per v25.3.11 Q1: bank-entered, NOT universal.",
    direction: "NEGATIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: false,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "integrationCostUsd = engineeringCostUsd + apiIntegrationCostUsd + custodyAdapterCostUsd + complianceAdapterCostUsd",
    illustrativeInputs: [
      { label: "engineeringCostUsd", value: "200_000", unit: "USD" },
      { label: "apiIntegrationCostUsd", value: "100_000", unit: "USD" },
      { label: "custodyAdapterCostUsd", value: "75_000", unit: "USD" },
      { label: "complianceAdapterCostUsd", value: "50_000", unit: "USD" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured integration cost has been computed from actual invoices",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
    ],
    crossReferences: [
      "v25.3.18 W1 (Bank Contracting Package — integration annex)",
      "v25.3.11 Q1 (bank value model — integrationCost component)",
      "v25.3.20 Y2 (Operating Plan — BANK_INTEGRATION role category + capital type)",
    ],
  },

  // =================================================================
  // 12. CHANGE_MANAGEMENT_COST (NEGATIVE — bank value decrease, one-time)
  // =================================================================
  {
    factorId: "CHANGE_MANAGEMENT_COST",
    name: "Change-Management Cost",
    description:
      "The one-time change-management cost that a bank incurs — training, " +
      "process redesign, change communication, transition management. " +
      "This is a NEGATIVE factor (one-time cost). Per v25.3.11 Q1: " +
      "bank-entered, NOT universal.",
    direction: "NEGATIVE",
    mayUseMeasuredInputs: true,
    requiresDemonstratedMechanism: false,
    mechanismDemonstrated: false,
    honestyTier: "DESIGN_TIME",
    formula:
      "changeCostUsd = trainingCostUsd + processRedesignCostUsd + changeCommunicationCostUsd + transitionManagementCostUsd",
    illustrativeInputs: [
      { label: "trainingCostUsd", value: "75_000", unit: "USD" },
      { label: "processRedesignCostUsd", value: "50_000", unit: "USD" },
      { label: "changeCommunicationCostUsd", value: "25_000", unit: "USD" },
      { label: "transitionManagementCostUsd", value: "50_000", unit: "USD" },
    ],
    whatItWouldProveAtInstitutionalTier: [
      "The bank's measured change-management cost has been computed from actual invoices",
      "An independent auditor has attested the measured inputs",
    ],
    whatItDoesNotProve: [
      "Does NOT prove monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT prove finality (per INCENTIVE_SEPARATION_RULE)",
    ],
    crossReferences: [
      "v25.3.11 Q1 (bank value model — changeCost component)",
      "v25.3.18 W1 (Bank Contracting Package — change-management annex)",
      "v25.3.20 Y2 (Operating Plan — OPERATIONS role category)",
    ],
  },
];

// ============================================================================
// BANK VALUE EQUATION (per directive)
// ============================================================================

// Per directive: "Create a bank value equation based on measured or
// explicitly assumed inputs."
//
// The 12 factors decompose into:
//   - 7 POSITIVE factors (benefits): NOSTRO_VOSTRO_LIQUIDITY_USAGE +
//     TRAPPED_LIQUIDITY + SETTLEMENT_TIMING + FX_SPREAD_ECONOMICS +
//     RECONCILIATION_COST + COMPLIANCE_EVIDENCE_OPERATING_COST +
//     EXCEPTION_MANAGEMENT_COST + SERVICE_REVENUE +
//     TREASURY_LIQUIDITY_BENEFITS (this is 9, not 7 — recheck)
//
// Re-tallying:
//   POSITIVE (benefits, 9): NOSTRO_VOSTRO_LIQUIDITY_USAGE,
//     TRAPPED_LIQUIDITY, SETTLEMENT_TIMING, FX_SPREAD_ECONOMICS,
//     RECONCILIATION_COST, COMPLIANCE_EVIDENCE_OPERATING_COST,
//     EXCEPTION_MANAGEMENT_COST, SERVICE_REVENUE,
//     TREASURY_LIQUIDITY_BENEFITS
//   NEGATIVE (costs, 3): INFRASTRUCTURE_COST, INTEGRATION_COST,
//     CHANGE_MANAGEMENT_COST

export const BANK_VALUE_EQUATION = {
  // The canonical equation (per directive)
  equation:
    "BankValue = NOSTRO_VOSTRO_LIQUIDITY_USAGE + TRAPPED_LIQUIDITY + " +
    "SETTLEMENT_TIMING + FX_SPREAD_ECONOMICS + RECONCILIATION_COST + " +
    "COMPLIANCE_EVIDENCE_OPERATING_COST + EXCEPTION_MANAGEMENT_COST + " +
    "SERVICE_REVENUE + TREASURY_LIQUIDITY_BENEFITS " +
    "- INFRASTRUCTURE_COST - INTEGRATION_COST - CHANGE_MANAGEMENT_COST",
  // Decomposition
  positiveFactors: ECONOMIC_FACTORS.filter((f) => f.direction === "POSITIVE").map((f) => f.factorId),
  negativeFactors: ECONOMIC_FACTORS.filter((f) => f.direction === "NEGATIVE").map((f) => f.factorId),
  // Honesty note
  honestyNote:
    "Per PROMPT 44: 'Create a bank value equation based on measured or " +
    "explicitly assumed inputs.' Every factor in this equation is " +
    "DESIGN-TIME — the inputs are EXPLICITLY ASSUMED (illustrative), not " +
    "measured. Banks may POST their own measured inputs (per v25.3.11 Q1 " +
    "bank-value-model endpoint). Until a bank enters measured inputs AND " +
    "an independent auditor attests them, every factor is DESIGN-TIME. " +
    "The equation is the canonical form; the inputs are the bank's to " +
    "provide.",
  // CRITICAL RULES enforced
  notPrefunderRule:
    "Per NOT_NETWORK_PREFUNDER_RULE: MITHQAL does NOT pre-fund the network. " +
    "The NOSTRO_VOSTRO_LIQUIDITY_USAGE and TRAPPED_LIQUIDITY factors " +
    "quantify the BENEFIT to a bank of reduced pre-funding needs (IF a " +
    "mechanism is demonstrated); MITHQAL does NOT itself provide the " +
    "liquidity.",
  noNostroReleasePromiseRule:
    "Per NO_NOSTRO_RELEASE_PROMISE_RULE: The TRAPPED_LIQUIDITY factor does " +
    "NOT promise nostro release. The benefit is contingent on a " +
    "demonstrated mechanism (per v25.3.10 P2 PILOT_B_MTQ_SETTLEMENT). " +
    "Until then, the factor is DESIGN-TIME.",
  incentiveSeparationRule:
    "Per INCENTIVE_SEPARATION_RULE: The bank value equation and the " +
    "founding-bank incentives do NOT influence monetary authorization, " +
    "risk approval, or finality decisions. They influence only the " +
    "COMMERCIAL decision to participate.",
} as const;

// ============================================================================
// FOUNDING-BANK ECONOMICS (per directive)
// ============================================================================

export const FOUNDING_BANK_INCENTIVES: FoundingBankIncentive[] = [
  // =================================================================
  // 1. PILOT_PRICING
  // =================================================================
  {
    incentiveId: "PILOT_PRICING",
    name: "Pilot Pricing",
    description:
      "Reduced service fees for founding banks during the pilot window " +
      "(per v25.3.10 P2 — PILOT_B_MTQ_SETTLEMENT pilot period). Pilot " +
      "pricing is a COMMERCIAL term; it does NOT influence monetary " +
      "authorization, risk approval, or finality decisions.",
    contractuallyInPlace: false,
    contingentOnPilotMilestone: true,
    pilotMilestoneGateId: "GATE-B1-PBC",
    contractingVehicle: "v25.3.18 W1 Bank Contracting Package — fee schedule section (DRAFT)",
    status: "DESIGN_TIME",
    provides: [
      "Reduced service fees for founding banks during the pilot window",
      "Defined pilot period (e.g., 12 months) with reduced fees",
      "Defined pilot scope (defined corridors + defined transaction types)",
    ],
    doesNotProvide: [
      "Does NOT provide monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT waive the v25.3.11 Q2 pilot gate framework gates",
      "Does NOT waive the v25.3.8 N1 canonical finality model F0-F7 stages",
      "Does NOT bypass the v25.3.7 M2 trust domains",
    ],
  },

  // =================================================================
  // 2. IMPLEMENTATION_CONCESSIONS
  // =================================================================
  {
    incentiveId: "IMPLEMENTATION_CONCESSIONS",
    name: "Implementation Concessions",
    description:
      "Concessions on the one-time integration cost for founding banks — " +
      "e.g., MITHQAL absorbs a defined portion of the engineering cost, " +
      "provides integration support at no charge, or contributes " +
      "engineering FTE to the bank's integration. Implementation " +
      "concessions are COMMERCIAL terms; they do NOT influence monetary " +
      "authorization, risk approval, or finality decisions.",
    contractuallyInPlace: false,
    contingentOnPilotMilestone: true,
    pilotMilestoneGateId: "GATE-A8-BANK_INTEGRATION",
    contractingVehicle: "v25.3.18 W1 Bank Contracting Package — implementation annex (DRAFT)",
    status: "DESIGN_TIME",
    provides: [
      "Defined portion of integration cost absorbed by MITHQAL",
      "Integration support at no charge (defined FTE-hours)",
      "Engineering FTE contribution to the bank's integration",
    ],
    doesNotProvide: [
      "Does NOT provide monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT waive the v25.3.11 Q2 pilot gate framework gates",
      "Does NOT waive the v25.3.14 T2 Architecture Freeze change process",
    ],
  },

  // =================================================================
  // 3. FEE_REBATES
  // =================================================================
  {
    incentiveId: "FEE_REBATES",
    name: "Fee Rebates",
    description:
      "Rebates on service fees tied to corridor volume — e.g., a founding " +
      "bank that achieves defined corridor-volume thresholds receives a " +
      "rebate on a portion of the service fees. Fee rebates are COMMERCIAL " +
      "terms; they do NOT influence monetary authorization, risk approval, " +
      "or finality decisions.",
    contractuallyInPlace: false,
    contingentOnPilotMilestone: true,
    pilotMilestoneGateId: "GATE-B6-BANK_SUBLEDGER",
    contractingVehicle: "v25.3.18 W1 Bank Contracting Package — rebate annex (DRAFT)",
    status: "DESIGN_TIME",
    provides: [
      "Rebate on service fees tied to corridor volume",
      "Defined corridor-volume thresholds",
      "Defined rebate percentage per threshold",
    ],
    doesNotProvide: [
      "Does NOT provide monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT waive the v25.3.11 Q2 pilot gate framework gates",
      "Does NOT waive the v25.3.13 P1 Corridor Pain Index thresholds",
    ],
  },

  // =================================================================
  // 4. CORRIDOR_INCENTIVES
  // =================================================================
  {
    incentiveId: "CORRIDOR_INCENTIVES",
    name: "Corridor Incentives",
    description:
      "Incentives that reward early participation in defined corridors — " +
      "e.g., a founding bank that participates in the AED-SGD corridor " +
      "(per v25.3.13 P1) during the pilot window receives a corridor " +
      "incentive bonus. Corridor incentives are COMMERCIAL terms; they " +
      "do NOT influence monetary authorization, risk approval, or " +
      "finality decisions.",
    contractuallyInPlace: false,
    contingentOnPilotMilestone: true,
    pilotMilestoneGateId: "GATE-A1-ROUTING",
    contractingVehicle: "v25.3.18 W1 Bank Contracting Package — corridor annex (DRAFT)",
    status: "DESIGN_TIME",
    provides: [
      "Bonus incentive for early participation in defined corridors",
      "Defined corridors (e.g., AED-SGD per v25.3.13 corridor data)",
      "Defined pilot window",
    ],
    doesNotProvide: [
      "Does NOT provide monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT waive the v25.3.11 Q2 pilot gate framework gates",
      "Does NOT waive the v25.3.13 P1 Corridor Pain Index thresholds",
    ],
  },

  // =================================================================
  // 5. GOVERNANCE_PARTICIPATION
  // =================================================================
  {
    incentiveId: "GOVERNANCE_PARTICIPATION",
    name: "Governance Participation",
    description:
      "Founding banks participate in COMMERCIAL-governance forums (per " +
      "v25.3.20 Y2 INDEPENDENT_ASSURANCE role + commercial-governance " +
      "forums) — e.g., the founding-bank advisory council, the corridor " +
      "prioritization committee, the commercial-pricing review board. " +
      "Governance participation is COMMERCIAL; it does NOT include " +
      "monetary-authorization, risk-approval, or finality-decision " +
      "forums (those remain with the v25.3.7 M2 trust domains: " +
      "Domain A Policy/Authorization, Domain B Finality Attestation, " +
      "Domain C Execution).",
    contractuallyInPlace: false,
    contingentOnPilotMilestone: true,
    pilotMilestoneGateId: "GATE-A8-BANK_INTEGRATION",
    contractingVehicle: "v25.3.18 W1 Bank Contracting Package — governance annex (DRAFT)",
    status: "DESIGN_TIME",
    provides: [
      "Seat on the founding-bank advisory council",
      "Seat on the corridor prioritization committee",
      "Seat on the commercial-pricing review board",
      "Defined voting / consensus rules (COMMERCIAL only)",
    ],
    doesNotProvide: [
      "Does NOT provide monetary authorization (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide risk approval (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT provide finality (per INCENTIVE_SEPARATION_RULE)",
      "Does NOT include a seat on monetary-authorization forums (per v25.3.7 M2 Domain A: Policy/Authorization)",
      "Does NOT include a seat on finality-attestation forums (per v25.3.7 M2 Domain B: Finality Attestation)",
      "Does NOT include a seat on execution forums (per v25.3.7 M2 Domain C: Execution)",
      "Does NOT waive the v25.3.11 Q2 pilot gate framework gates",
    ],
  },
];

// ============================================================================
// DERIVED CONSTANTS + HELPERS
// ============================================================================

export const FACTOR_COUNT = ECONOMIC_FACTORS.length; // 12
export const POSITIVE_FACTOR_COUNT = ECONOMIC_FACTORS.filter((f) => f.direction === "POSITIVE").length; // 9
export const NEGATIVE_FACTOR_COUNT = ECONOMIC_FACTORS.filter((f) => f.direction === "NEGATIVE").length; // 3
export const FOUNDING_BANK_INCENTIVE_COUNT = FOUNDING_BANK_INCENTIVES.length; // 5

// Map for O(1) factor lookup by id
export const FACTOR_MAP: Record<FactorId, EconomicFactor> = Object.fromEntries(
  ECONOMIC_FACTORS.map((f) => [f.factorId, f]),
) as Record<FactorId, EconomicFactor>;

export const FOUNDING_BANK_INCENTIVE_MAP: Record<FoundingBankIncentiveId, FoundingBankIncentive> =
  Object.fromEntries(
    FOUNDING_BANK_INCENTIVES.map((i) => [i.incentiveId, i]),
  ) as Record<FoundingBankIncentiveId, FoundingBankIncentive>;

export function getFactor(id: FactorId): EconomicFactor | null {
  return FACTOR_MAP[id] ?? null;
}

export function getFoundingBankIncentive(
  id: FoundingBankIncentiveId,
): FoundingBankIncentive | null {
  return FOUNDING_BANK_INCENTIVE_MAP[id] ?? null;
}

// ============================================================================
// RUNTIME INVARIANTS (fail-fast at module load)
// ============================================================================

function assertAllTwelveFactorsPresent(): void {
  const expected: FactorId[] = [
    "NOSTRO_VOSTRO_LIQUIDITY_USAGE",
    "TRAPPED_LIQUIDITY",
    "SETTLEMENT_TIMING",
    "FX_SPREAD_ECONOMICS",
    "RECONCILIATION_COST",
    "COMPLIANCE_EVIDENCE_OPERATING_COST",
    "EXCEPTION_MANAGEMENT_COST",
    "INFRASTRUCTURE_COST",
    "SERVICE_REVENUE",
    "TREASURY_LIQUIDITY_BENEFITS",
    "INTEGRATION_COST",
    "CHANGE_MANAGEMENT_COST",
  ];
  for (const id of expected) {
    if (!FACTOR_MAP[id]) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: missing factor ${id}`,
      );
    }
  }
  if (ECONOMIC_FACTORS.length !== 12) {
    throw new Error(
      `Bank Economic Incentive Model FATAL: expected 12 factors, got ${ECONOMIC_FACTORS.length}`,
    );
  }
}

function assertMithqalNotPrefunder(): void {
  // Per NOT_NETWORK_PREFUNDER_RULE: MITHQAL is NOT the network pre-funder.
  // The TRAPPED_LIQUIDITY and NOSTRO_VOSTRO_LIQUIDITY_USAGE factors must
  // have requiresDemonstratedMechanism=true and mechanismDemonstrated=false
  // (honest — no demonstrated mechanism yet).
  const prefunderCheckFactors: FactorId[] = [
    "NOSTRO_VOSTRO_LIQUIDITY_USAGE",
    "TRAPPED_LIQUIDITY",
  ];
  for (const id of prefunderCheckFactors) {
    const f = FACTOR_MAP[id];
    if (!f.requiresDemonstratedMechanism) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: factor ${id} MUST have requiresDemonstratedMechanism=true (per NOT_NETWORK_PREFUNDER_RULE)`,
      );
    }
    if (f.mechanismDemonstrated) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: factor ${id} MUST have mechanismDemonstrated=false (honest — no demonstrated mechanism yet, per NO_NOSTRO_RELEASE_PROMISE_RULE)`,
      );
    }
    // The factor description must NOT describe MITHQAL as the pre-funder
    if (
      f.description.toLowerCase().includes("mithqal is the pre-funder") ||
      f.description.toLowerCase().includes("mithqal pre-funds") ||
      f.description.toLowerCase().includes("mithqal advances liquidity")
    ) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: factor ${id} MUST NOT describe MITHQAL as the pre-funder (per NOT_NETWORK_PREFUNDER_RULE)`,
      );
    }
  }
}

function assertNoNostroReleasePromise(): void {
  // Per NO_NOSTRO_RELEASE_PROMISE_RULE: Do NOT promise 'nostro release' unless
  // the mechanism is actually demonstrated.
  const f = FACTOR_MAP["TRAPPED_LIQUIDITY"];
  // The factor description must NOT promise nostro release unconditionally
  if (
    f.description.toLowerCase().includes("guaranteed nostro release") ||
    f.description.toLowerCase().includes("promises nostro release")
  ) {
    throw new Error(
      "Bank Economic Incentive Model FATAL: TRAPPED_LIQUIDITY MUST NOT promise nostro release (per NO_NOSTRO_RELEASE_PROMISE_RULE)",
    );
  }
  // The factor must require a demonstrated mechanism
  if (!f.requiresDemonstratedMechanism) {
    throw new Error(
      "Bank Economic Incentive Model FATAL: TRAPPED_LIQUIDITY MUST have requiresDemonstratedMechanism=true",
    );
  }
  if (f.mechanismDemonstrated) {
    throw new Error(
      "Bank Economic Incentive Model FATAL: TRAPPED_LIQUIDITY MUST have mechanismDemonstrated=false (honest)",
    );
  }
}

function assertIncentiveSeparation(): void {
  // Per INCENTIVE_SEPARATION_RULE: All incentives must remain SEPARATE from
  // monetary authorization, risk approval, and finality decisions.
  // Verify each founding-bank incentive has contractuallyInPlace=false
  // (honest — no contract executed yet per v25.3.18 W1 ALL DRAFT).
  for (const incentive of FOUNDING_BANK_INCENTIVES) {
    if (incentive.contractuallyInPlace) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: incentive ${incentive.incentiveId} MUST have contractuallyInPlace=false (honest — Bank Contracting Package ALL DRAFT per v25.3.18 W1)`,
      );
    }
    if (incentive.status === "ACTIVE") {
      throw new Error(
        `Bank Economic Incentive Model FATAL: incentive ${incentive.incentiveId} MUST NOT have status=ACTIVE (honest — no contract executed yet)`,
      );
    }
    // The doesNotProvide field must explicitly mention the 3 separations
    const doesNotProvideJoined = incentive.doesNotProvide.join(" ").toLowerCase();
    if (!doesNotProvideJoined.includes("monetary authorization")) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: incentive ${incentive.incentiveId} doesNotProvide MUST mention 'monetary authorization' (per INCENTIVE_SEPARATION_RULE)`,
      );
    }
    if (!doesNotProvideJoined.includes("risk approval")) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: incentive ${incentive.incentiveId} doesNotProvide MUST mention 'risk approval' (per INCENTIVE_SEPARATION_RULE)`,
      );
    }
    if (!doesNotProvideJoined.includes("finality")) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: incentive ${incentive.incentiveId} doesNotProvide MUST mention 'finality' (per INCENTIVE_SEPARATION_RULE)`,
      );
    }
  }
}

function assertAllFactorsDesignTime(): void {
  // Honest state — every factor is DESIGN-TIME
  for (const f of ECONOMIC_FACTORS) {
    if (f.honestyTier !== "DESIGN_TIME") {
      throw new Error(
        `Bank Economic Incentive Model FATAL: factor ${f.factorId} MUST have honestyTier=DESIGN_TIME (honest — no measured or institutional evidence yet)`,
      );
    }
    // Every factor's whatItDoesNotProve MUST mention INCENTIVE_SEPARATION_RULE
    const doesNotProveJoined = f.whatItDoesNotProve.join(" ").toLowerCase();
    if (!doesNotProveJoined.includes("incentive_separation_rule")) {
      throw new Error(
        `Bank Economic Incentive Model FATAL: factor ${f.factorId} whatItDoesNotProve MUST reference INCENTIVE_SEPARATION_RULE`,
      );
    }
  }
}

assertAllTwelveFactorsPresent();
assertMithqalNotPrefunder();
assertNoNostroReleasePromise();
assertIncentiveSeparation();
assertAllFactorsDesignTime();

// ============================================================================
// MODULE METADATA (per v25.3.2 _meta envelope convention)
// ============================================================================

export const BANK_ECONOMIC_INCENTIVE_MODEL_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" =
  "ACTIVE";
export const BANK_ECONOMIC_INCENTIVE_MODEL_VERSION = "v25.3.21-P44-1.0";
export const BANK_ECONOMIC_INCENTIVE_MODEL_SOURCE =
  "src/lib/bank-economic-incentive-model.ts";

export const BANK_ECONOMIC_INCENTIVE_HONEST_STATE = {
  allFactorsDesignTime: true,
  noMechanismDemonstrated: true,
  mithqalNotPrefunder: true,
  noNostroReleasePromise: true,
  allIncentivesPending: true,
  allIncentivesSeparatedFromMonetaryAuthorization: true,
  allIncentivesSeparatedFromRiskApproval: true,
  allIncentivesSeparatedFromFinality: true,
  honestNote:
    "Per PROMPT 44: 12 economic factors (9 positive + 3 negative) " +
    "compose the bank value equation. MITHQAL is NOT the network " +
    "pre-funder (per NOT_NETWORK_PREFUNDER_RULE). MITHQAL does NOT " +
    "promise nostro release (per NO_NOSTRO_RELEASE_PROMISE_RULE — the " +
    "TRAPPED_LIQUIDITY factor carries requiresDemonstratedMechanism=true " +
    "and mechanismDemonstrated=false). 5 founding-bank incentives are " +
    "DESIGN-TIME — none is contractually in place (per v25.3.18 W1 Bank " +
    "Contracting Package ALL DRAFT). All incentives are SEPARATE from " +
    "monetary authorization, risk approval, and finality decisions " +
    "(per INCENTIVE_SEPARATION_RULE). The 12 factors and 5 incentives " +
    "are PENDING_EXTERNAL_VALIDATION until measured inputs are bank-entered " +
    "AND independently attested.",
} as const;

// Re-export the 4 evidence status labels (per v25.3.11 Q1 — used by this module
// to tag the honesty tier of any computed bank value)
export {
  EVIDENCE_STATUS_LABELS,
  type EvidenceStatus,
};
