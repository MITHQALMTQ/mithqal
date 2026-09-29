// src/lib/bank-value-model.ts
//
// MITHQAL v25.3.2 — CANONICAL BANK VALUE MODEL (single source of truth)
// Per Q-directive (trace 1a0ef134a48f2b99 / 1a0ef141e52acf31):
//   "Create a bank value model.
//    Calculate: Bank Net Value = Liquidity Benefit + FX Benefit + Operational
//    Savings + Compliance/Evidence Savings + Risk Value + New Revenue
//    - Integration Cost - Operating Cost - Compliance Cost - Risk Capital Cost
//    - Change Cost.
//    Allow the bank to enter its own baseline data.
//    Do not hard-code illustrative 7bps or sub-2-second numbers as universal claims.
//    Every output must clearly distinguish: SIMULATED, ILLUSTRATIVE, VALIDATED,
//    INSTITUTIONALLY VERIFIED."
//
// Cross-references:
//  - v25.3.2 controlled remediation layer (5-layer authority hierarchy +
//    4 status markers ACTIVE/SUPERSEDED/HISTORICAL/PENDING_VALIDATION).
//  - v25.3.4 control-plane boundary (CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE).
//    The bank value model is the CONTROL_PLANE_CORE half (bank-facing ROI),
//    decoupled from the MTQ settlement-side economics.
//  - v25.3.7 trust domains (Domain A Policy/Authorization, Domain B Finality
//    Attestation, Domain C Execution) — the bank value model is consumed by
//    Domain A decision-makers (Treasury, Compliance, Operations) when they
//    decide whether to participate.
//  - v25.3.8 canonical finality model F0-F7 + Institutional Evidence Fabric —
//    the Compliance/Evidence Savings component traces back to the Evidence
//    Fabric's 15-field portable evidence package (less manual evidence
//    generation cost).
//  - v25.3.9 Institutional Settlement Obligation Registry (O1, 13 fields) +
//    6 reconciliation tolerance policies (O2) — the Compliance Cost component
//    reflects the marginal ongoing cost of integrating with these registries.
//
// Honest-state discipline (per M-directive "Do not invent legal facts"):
//  - The SAMPLE_BASELINE is ILLUSTRATIVE — it is NOT a universal claim.
//  - The model NEVER hard-codes 7bps or sub-2-second numbers as universal
//    claims (per Q-directive). All percentages, spreads, durations, and
//    dollar figures are bank-entered via POST /api/bank-value-model.
//  - computeBankNetValue() is a pure function over bank-entered inputs.

// === Evidence Status Labels (per directive) ===
// Every output MUST carry one of these 4 labels.
// SIMULATED — computed from simulated/projected inputs (NOT real bank data)
// ILLUSTRATIVE — computed from illustrative example inputs (NOT real bank data, used for demos)
// VALIDATED — computed from validated inputs (bank has provided real data + it has been verified)
// INSTITUTIONALLY_VERIFIED — computed from inputs confirmed by an independent auditor or regulator

export type EvidenceStatus = "SIMULATED" | "ILLUSTRATIVE" | "VALIDATED" | "INSTITUTIONALLY_VERIFIED";

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  SIMULATED: "SIMULATED — computed from simulated/projected inputs. NOT real bank data. For modeling purposes only.",
  ILLUSTRATIVE: "ILLUSTRATIVE — computed from illustrative example inputs. NOT real bank data. For demonstration purposes only.",
  VALIDATED: "VALIDATED — computed from bank-provided real data that has been verified by MITHQAL.",
  INSTITUTIONALLY_VERIFIED: "INSTITUTIONALLY VERIFIED — computed from inputs confirmed by an independent auditor or regulator.",
};

// === Bank Baseline Data (bank-entered, NOT hard-coded) ===
// Per directive: "Allow the bank to enter its own baseline data."
// The bank provides ALL inputs. MITHQAL does NOT hard-code any numbers.

export interface BankBaselineData {
  // === Bank identity ===
  bankId: string;
  bankName: string;
  bankJurisdiction: string;  // ISO 3166-1 alpha-2

  // === Benefits (positive contributions to Bank Net Value) ===

  // 1. Liquidity Benefit
  // The reduction in liquidity costs (nostro/vostro pre-funding, liquidity buffer)
  liquidityBenefit: {
    annualSettlementVolumeUsd: number;  // bank's annual settlement volume in USD
    // Percentage reduction in nostro/vostro pre-funding (bank-entered, NOT hard-coded)
    preFundingReductionPct: number;  // e.g., 30.0 = 30% reduction
    // Current liquidity immobilization (bank-entered)
    currentLiquidityImmobilizationUsd: number;
    // Computed: liquidityBenefitUsd = currentLiquidityImmobilizationUsd * (preFundingReductionPct / 100)
  };

  // 2. FX Benefit
  // The reduction in FX costs (spread, legs, intermediary FX)
  fxBenefit: {
    annualFxVolumeUsd: number;  // bank's annual FX volume in USD
    // Current FX spread in bps (bank-entered, NOT hard-coded)
    currentFxSpreadBps: number;  // e.g., 50 = 50 bps spread
    // Expected FX spread reduction in bps (bank-entered, NOT hard-coded)
    fxSpreadReductionBps: number;  // e.g., 20 = 20 bps reduction
    // Computed: fxBenefitUsd = annualFxVolumeUsd * (fxSpreadReductionBps / 10000)
  };

  // 3. Operational Savings
  // The reduction in operational costs (manual processing, reconciliation, exception handling)
  operationalSavings: {
    annualOperationalCostUsd: number;  // bank's current annual operational cost
    // Expected operational cost reduction percentage (bank-entered)
    operationalCostReductionPct: number;  // e.g., 25.0 = 25% reduction
    // Computed: operationalSavingsUsd = annualOperationalCostUsd * (operationalCostReductionPct / 100)
  };

  // 4. Compliance/Evidence Savings
  // The reduction in compliance costs (AML/KYC/sanctions deduplication, evidence generation)
  complianceEvidenceSavings: {
    annualComplianceCostUsd: number;  // bank's current annual compliance cost
    // Expected compliance cost reduction percentage (bank-entered)
    complianceCostReductionPct: number;  // e.g., 15.0 = 15% reduction
    // Computed: complianceEvidenceSavingsUsd = annualComplianceCostUsd * (complianceCostReductionPct / 100)
  };

  // 5. Risk Value
  // The reduction in risk (failure rate, settlement risk, credit risk)
  riskValue: {
    annualRiskLossUsd: number;  // bank's current annual risk-related losses
    // Expected risk loss reduction percentage (bank-entered)
    riskLossReductionPct: number;  // e.g., 40.0 = 40% reduction
    // Computed: riskValueUsd = annualRiskLossUsd * (riskLossReductionPct / 100)
  };

  // 6. New Revenue
  // New revenue from MITHQAL services (new corridors, new customers, new products)
  newRevenue: {
    // Expected new annual revenue (bank-entered)
    expectedNewRevenueUsd: number;
  };

  // === Costs (negative contributions to Bank Net Value) ===

  // 7. Integration Cost (one-time)
  integrationCost: {
    // One-time integration cost (bank-entered)
    integrationCostUsd: number;  // e.g., 500000 = $500K one-time
  };

  // 8. Operating Cost (annual)
  operatingCost: {
    // Annual operating cost (bank-entered)
    annualOperatingCostUsd: number;  // e.g., 100000 = $100K/year
  };

  // 9. Compliance Cost (annual, additional)
  complianceCost: {
    // Annual additional compliance cost for MITHQAL (bank-entered)
    annualComplianceCostUsd: number;  // e.g., 50000 = $50K/year
  };

  // 10. Risk Capital Cost (annual)
  riskCapitalCost: {
    // Annual risk capital cost (bank-entered) — capital set aside for MITHQAL-related risks
    annualRiskCapitalCostUsd: number;  // e.g., 200000 = $200K/year
  };

  // 11. Change Cost (one-time)
  changeCost: {
    // One-time change management cost (bank-entered) — training, change management, transition
    changeCostUsd: number;  // e.g., 150000 = $150K one-time
  };
}

// === Bank Value Result ===

export interface BankValueResult {
  // The formula (per directive)
  formula: string;

  // Individual components (all in USD)
  liquidityBenefitUsd: number;
  fxBenefitUsd: number;
  operationalSavingsUsd: number;
  complianceEvidenceSavingsUsd: number;
  riskValueUsd: number;
  newRevenueUsd: number;
  integrationCostUsd: number;
  operatingCostUsd: number;
  complianceCostUsd: number;
  riskCapitalCostUsd: number;
  changeCostUsd: number;

  // The computed Bank Net Value
  bankNetValueUsd: number;

  // Annualized net value (excludes one-time costs: integration + change)
  annualizedNetValueUsd: number;

  // Payback period (years)
  paybackPeriodYears: number;

  // === CRITICAL: Evidence Status (per directive) ===
  // Every output MUST carry one of these 4 labels.
  evidenceStatus: EvidenceStatus;
  evidenceStatusLabel: string;

  // === CRITICAL: No hard-coded numbers (per directive) ===
  // "Do not hard-code illustrative 7bps or sub-2-second numbers as universal claims."
  noHardCodedNumbers: boolean;
  noHardCodedNumbersRule: string;

  // The bank's baseline data (for transparency)
  baselineData: BankBaselineData;
}

// === Compute Bank Net Value ===
//
// Per directive:
//   Bank Net Value = Liquidity Benefit + FX Benefit + Operational Savings
//   + Compliance/Evidence Savings + Risk Value + New Revenue
//   - Integration Cost - Operating Cost - Compliance Cost - Risk Capital Cost
//   - Change Cost

export function computeBankNetValue(baseline: BankBaselineData, evidenceStatus: EvidenceStatus = "SIMULATED"): BankValueResult {
  // Compute benefits
  const liquidityBenefitUsd = baseline.liquidityBenefit.currentLiquidityImmobilizationUsd * (baseline.liquidityBenefit.preFundingReductionPct / 100);
  const fxBenefitUsd = baseline.fxBenefit.annualFxVolumeUsd * (baseline.fxBenefit.fxSpreadReductionBps / 10000);
  const operationalSavingsUsd = baseline.operationalSavings.annualOperationalCostUsd * (baseline.operationalSavings.operationalCostReductionPct / 100);
  const complianceEvidenceSavingsUsd = baseline.complianceEvidenceSavings.annualComplianceCostUsd * (baseline.complianceEvidenceSavings.complianceCostReductionPct / 100);
  const riskValueUsd = baseline.riskValue.annualRiskLossUsd * (baseline.riskValue.riskLossReductionPct / 100);
  const newRevenueUsd = baseline.newRevenue.expectedNewRevenueUsd;

  // Compute costs
  const integrationCostUsd = baseline.integrationCost.integrationCostUsd;
  const operatingCostUsd = baseline.operatingCost.annualOperatingCostUsd;
  const complianceCostUsd = baseline.complianceCost.annualComplianceCostUsd;
  const riskCapitalCostUsd = baseline.riskCapitalCost.annualRiskCapitalCostUsd;
  const changeCostUsd = baseline.changeCost.changeCostUsd;

  // Bank Net Value = benefits - costs (per directive formula)
  const bankNetValueUsd =
    liquidityBenefitUsd +
    fxBenefitUsd +
    operationalSavingsUsd +
    complianceEvidenceSavingsUsd +
    riskValueUsd +
    newRevenueUsd -
    integrationCostUsd -
    operatingCostUsd -
    complianceCostUsd -
    riskCapitalCostUsd -
    changeCostUsd;

  // Annualized net value (excludes one-time costs)
  const annualizedNetValueUsd =
    liquidityBenefitUsd +
    fxBenefitUsd +
    operationalSavingsUsd +
    complianceEvidenceSavingsUsd +
    riskValueUsd +
    newRevenueUsd -
    operatingCostUsd -
    complianceCostUsd -
    riskCapitalCostUsd;

  // Payback period (years) = one-time costs / annualized net value
  const oneTimeCosts = integrationCostUsd + changeCostUsd;
  const paybackPeriodYears = annualizedNetValueUsd > 0 ? oneTimeCosts / annualizedNetValueUsd : Infinity;

  return {
    formula: "Bank Net Value = Liquidity Benefit + FX Benefit + Operational Savings + Compliance/Evidence Savings + Risk Value + New Revenue - Integration Cost - Operating Cost - Compliance Cost - Risk Capital Cost - Change Cost",
    liquidityBenefitUsd,
    fxBenefitUsd,
    operationalSavingsUsd,
    complianceEvidenceSavingsUsd,
    riskValueUsd,
    newRevenueUsd,
    integrationCostUsd,
    operatingCostUsd,
    complianceCostUsd,
    riskCapitalCostUsd,
    changeCostUsd,
    bankNetValueUsd,
    annualizedNetValueUsd,
    paybackPeriodYears,
    evidenceStatus,
    evidenceStatusLabel: EVIDENCE_STATUS_LABELS[evidenceStatus],
    noHardCodedNumbers: true,
    noHardCodedNumbersRule: "Per Q-directive: 'Do not hard-code illustrative 7bps or sub-2-second numbers as universal claims.' All inputs are bank-entered. No universal claims.",
    baselineData: baseline,
  };
}

// === Sample Baseline (ILLUSTRATIVE — for demo only, NOT a universal claim) ===
// Per directive: "Do not hard-code illustrative 7bps or sub-2-second numbers
// as universal claims." This sample is ILLUSTRATIVE — it uses example numbers
// for demonstration. Banks enter their OWN data via the API.
//
// The numbers below (50 bps FX spread, 20 bps reduction, 30% pre-funding
// reduction, etc.) are ILLUSTRATIVE EXAMPLES for demonstration only. They
// are NOT universal claims. Real banks POST their OWN verified numbers.

export const SAMPLE_BASELINE: BankBaselineData = {
  bankId: "SAMPLE_BANK",
  bankName: "Sample Bank (ILLUSTRATIVE)",
  bankJurisdiction: "US",
  liquidityBenefit: {
    annualSettlementVolumeUsd: 10_000_000_000,  // $10B annual settlement
    preFundingReductionPct: 30.0,  // 30% reduction (ILLUSTRATIVE — bank enters own)
    currentLiquidityImmobilizationUsd: 500_000_000,  // $500M immobilized
  },
  fxBenefit: {
    annualFxVolumeUsd: 2_000_000_000,  // $2B annual FX
    currentFxSpreadBps: 50,  // 50 bps current (ILLUSTRATIVE — bank enters own)
    fxSpreadReductionBps: 20,  // 20 bps reduction (ILLUSTRATIVE)
  },
  operationalSavings: {
    annualOperationalCostUsd: 5_000_000,  // $5M annual ops cost
    operationalCostReductionPct: 25.0,  // 25% reduction (ILLUSTRATIVE)
  },
  complianceEvidenceSavings: {
    annualComplianceCostUsd: 3_000_000,  // $3M annual compliance
    complianceCostReductionPct: 15.0,  // 15% reduction (ILLUSTRATIVE)
  },
  riskValue: {
    annualRiskLossUsd: 1_000_000,  // $1M annual risk losses
    riskLossReductionPct: 40.0,  // 40% reduction (ILLUSTRATIVE)
  },
  newRevenue: {
    expectedNewRevenueUsd: 2_000_000,  // $2M new revenue (ILLUSTRATIVE)
  },
  integrationCost: {
    integrationCostUsd: 500_000,  // $500K one-time (ILLUSTRATIVE)
  },
  operatingCost: {
    annualOperatingCostUsd: 100_000,  // $100K/year (ILLUSTRATIVE)
  },
  complianceCost: {
    annualComplianceCostUsd: 50_000,  // $50K/year (ILLUSTRATIVE)
  },
  riskCapitalCost: {
    annualRiskCapitalCostUsd: 200_000,  // $200K/year (ILLUSTRATIVE)
  },
  changeCost: {
    changeCostUsd: 150_000,  // $150K one-time (ILLUSTRATIVE)
  },
};

// === Status ===
export const BANK_VALUE_MODEL_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" = "ACTIVE";
export const BANK_VALUE_MODEL_VERSION = "v25.3.2-Q1-1.0";
export const BANK_VALUE_MODEL_SOURCE = "src/lib/bank-value-model.ts";
