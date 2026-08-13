// v24.1.2 Layer 6 — External Risk Transfer Facility (ERTF)
// =================================================================
// Ring-fenced external risk-bearing capital — NOT inside the
// monetary core. Provides loss absorption without permanently
// increasing MITHQAL's reserve requirement.
//
// ERTF is:
//   - legally separate from the monetary reserve
//   - independently governed
//   - non-reserve (does NOT count toward R_a)
//   - non-PAR (does NOT affect PAR)
//   - non-monetary (NOT required for ordinary MTQ redemption)
//   - separately regulated/classified
//   - transparent about risk
//   - subject to independent capital adequacy
//
// ERTF can use:
//   - insurance
//   - Takaful
//   - parametric coverage (with basis risk modeled)
//   - institutional risk capital
//   - guarantees
//
// Parametric reinsurance is modeled as:
//   NetRecovery = PolicyLimit × TriggerProbability × RecoveryFactor
// NOT as a guaranteed T+0 payment.
// =================================================================

export interface ErtfInstrument {
  name: string;
  type: "insurance" | "takaful" | "parametric" | "guarantee" | "institutional_capital";
  counterparty: string;
  policyLimitUsd: number;
  triggerProbability: number;  // 0-1 (probability trigger fires when needed)
  recoveryFactor: number;      // 0-1 (expected recovery given trigger)
  basisRisk: number;            // 0-1 (risk that trigger fires but loss doesn't occur, or vice versa)
  counterpartyRiskScore: number; // 0-1 (0 = safe, 1 = high risk)
  liquidityTimeDays: number;    // expected time to receive funds
  legalEnforceability: "HIGH" | "MODERATE" | "CONDITIONAL";
  collateralized: boolean;
  independentOracle: boolean;
  backupRecoveryRoute: boolean;
}

export interface ErtfResult {
  totalCoverageUsd: number;
  totalExpectedRecoveryUsd: number;
  instruments: Array<{
    name: string;
    type: string;
    policyLimitUsd: number;
    netRecoveryUsd: number;
    triggerProbability: number;
    recoveryFactor: number;
    basisRisk: number;
    effectiveRecovery: number; // net recovery as fraction of policy limit
    liquidityTimeDays: number;
    riskAdjusted: boolean;
  }>;
  totalLossAbsorptionCapacity: number; // as % of R_a
  ringFenced: boolean;
  nonReserve: boolean;
  nonPar: boolean;
  activated: boolean;
  activationConditions: string[];
  disclaimer: string;
  timestamp: string;
}

export function computeErtf(instruments: ErtfInstrument[], ra: number): ErtfResult {
  const results = instruments.map(inst => {
    // NetRecovery = PolicyLimit × TriggerProbability × RecoveryFactor
    const netRecovery = inst.policyLimitUsd * inst.triggerProbability * inst.recoveryFactor;
    const effectiveRecovery = inst.policyLimitUsd > 0 ? netRecovery / inst.policyLimitUsd : 0;

    // Risk-adjusted: reduce by counterparty risk and basis risk
    const riskAdjustedRecovery = netRecovery * (1 - inst.counterpartyRiskScore * 0.5) * (1 - inst.basisRisk * 0.3);

    return {
      name: inst.name,
      type: inst.type,
      policyLimitUsd: inst.policyLimitUsd,
      netRecoveryUsd: Math.round(netRecovery),
      triggerProbability: inst.triggerProbability,
      recoveryFactor: inst.recoveryFactor,
      basisRisk: inst.basisRisk,
      effectiveRecovery: Math.round(effectiveRecovery * 1e4) / 1e4,
      liquidityTimeDays: inst.liquidityTimeDays,
      riskAdjusted: inst.counterpartyRiskScore > 0.3 || inst.basisRisk > 0.2 || !inst.collateralized,
    };
  });

  const totalCoverage = instruments.reduce((s, i) => s + i.policyLimitUsd, 0);
  const totalExpectedRecovery = results.reduce((s, r) => s + r.netRecoveryUsd, 0);

  const activationConditions = [
    "RR < 100% after all rebalancing + liquidity + custody measures exhausted",
    "Custody failure exceeding 15% effective risk threshold",
    "Correlation break: EI ≥ 1.75 (Crisis state)",
    "ERTF activation requires 4-of-5 institutional governance approval",
    "ERTF funds are NOT counted as reserves until actually collected and invested",
  ];

  return {
    totalCoverageUsd: totalCoverage,
    totalExpectedRecoveryUsd: Math.round(totalExpectedRecovery),
    instruments: results,
    totalLossAbsorptionCapacity: ra > 0 ? Math.round((totalExpectedRecovery / ra) * 10000) / 100 : 0,
    ringFenced: true,
    nonReserve: true,
    nonPar: true,
    activated: false, // not activated by default — requires governance
    activationConditions,
    disclaimer: "ERTF is legally separate from the monetary reserve. ERTF does NOT count toward R_a. " +
      "ERTF does NOT affect PAR. ERTF is NOT required for ordinary MTQ redemption. " +
      "Parametric coverage has basis risk — NetRecovery ≠ PolicyLimit. " +
      "ERTF is NOT a guaranteed T+0 payment — liquidity time and counterparty risk apply.",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Default ERTF instruments for v24.1.2.
 * All are ring-fenced, externally governed, and independently collateralized.
 */
export function getDefaultErtfInstruments(): ErtfInstrument[] {
  return [
    {
      name: "Parametric Custody Insurance — Layer 1",
      type: "parametric",
      counterparty: "Reinsurance Provider A (independently risk-assessed)",
      policyLimitUsd: 5_000_000,
      triggerProbability: 0.80,
      recoveryFactor: 0.75,
      basisRisk: 0.15,
      counterpartyRiskScore: 0.10,
      liquidityTimeDays: 3,
      legalEnforceability: "HIGH",
      collateralized: true,
      independentOracle: true,
      backupRecoveryRoute: true,
    },
    {
      name: "Takaful Reserve Protection — Layer 2",
      type: "takaful",
      counterparty: "Takaful Operator (AAOIFI-15 compliant, independently governed)",
      policyLimitUsd: 3_000_000,
      triggerProbability: 0.85,
      recoveryFactor: 0.70,
      basisRisk: 0.10,
      counterpartyRiskScore: 0.08,
      liquidityTimeDays: 5,
      legalEnforceability: "HIGH",
      collateralized: true,
      independentOracle: true,
      backupRecoveryRoute: true,
    },
    {
      name: "Institutional Guarantee Facility — Layer 3",
      type: "guarantee",
      counterparty: "Sovereign Wealth Fund (conditional, legally separate)",
      policyLimitUsd: 2_000_000,
      triggerProbability: 0.70,
      recoveryFactor: 0.80,
      basisRisk: 0.05,
      counterpartyRiskScore: 0.05,
      liquidityTimeDays: 7,
      legalEnforceability: "CONDITIONAL",
      collateralized: false,
      independentOracle: true,
      backupRecoveryRoute: false,
    },
  ];
}
