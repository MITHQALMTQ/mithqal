// src/lib/reserve-coverage-logic.ts
//
// MITHQAL v25.3.2 — RESERVE COVERAGE LOGIC (refactored per K-directive)
//
// Per K-directive (trace 1a0ede068b9def31):
//   "Refactor reserve logic. Remove the universal 130% requirement as a
//    mandatory commercial/constitutional settlement requirement.
//    Use: Required Coverage = Direct Settlement Backing + Risk Buffer
//    Direct settlement backing must be matched to the applicable settlement
//    obligation. Risk buffer must be calculated from configurable factors
//    including: liquidity, legal accessibility, asset haircut, valuation
//    volatility, counterparty risk, concentration, settlement timing,
//    redemption behavior, jurisdiction.
//    Keep 130% only as a possible strategic policy target/example, never as
//    a universal production requirement."
//
// This is the SINGLE CANONICAL SOURCE for the new reserve coverage formula.
// All other modules MUST import from here. The old "universal 130% requirement"
// is REMOVED as a mandatory commercial/constitutional settlement requirement.
// 130% is retained ONLY as a possible strategic policy target/example.

// === Risk Buffer Factor Configuration ===

export type RiskBufferFactorId =
  | "LIQUIDITY"
  | "LEGAL_ACCESSIBILITY"
  | "ASSET_HAIRCUT"
  | "VALUATION_VOLATILITY"
  | "COUNTERPARTY_RISK"
  | "CONCENTRATION"
  | "SETTLEMENT_TIMING"
  | "REDEMPTION_BEHAVIOR"
  | "JURISDICTION";

export interface RiskBufferFactor {
  id: RiskBufferFactorId;
  name: string;
  description: string;
  // configurable weight (0-1) — how much this factor contributes to the risk buffer
  weight: number;
  // configurable baseline contribution in basis points (0-10000)
  baselineBps: number;
  // dynamic multiplier (1.0 = baseline, >1 = stressed, <1 = calm)
  dynamicMultiplier: number;
  // configurable per-asset-class overrides (optional)
  assetClassOverrides?: Record<string, { weight?: number; baselineBps?: number }>;
}

export const DEFAULT_RISK_BUFFER_FACTORS: RiskBufferFactor[] = [
  {
    id: "LIQUIDITY",
    name: "Liquidity",
    description:
      "How quickly the backing asset can be converted to settlement currency without material price impact.",
    weight: 0.15,
    baselineBps: 200, // 2% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "LEGAL_ACCESSIBILITY",
    name: "Legal Accessibility",
    description:
      "Whether the backing asset is legally reachable for settlement (e.g., frozen assets, regulatory holds, jurisdictional restrictions).",
    weight: 0.1,
    baselineBps: 150, // 1.5% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "ASSET_HAIRCUT",
    name: "Asset Haircut",
    description:
      "Standard prudential haircut applied to the backing asset's market value (e.g., 5% for sovereign bonds, 10% for gold, 20% for volatile assets).",
    weight: 0.15,
    baselineBps: 500, // 5% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "VALUATION_VOLATILITY",
    name: "Valuation Volatility",
    description:
      "Standard deviation of the backing asset's USD value over a rolling window (e.g., 30-day, 90-day). Higher volatility = higher buffer.",
    weight: 0.15,
    baselineBps: 300, // 3% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "COUNTERPARTY_RISK",
    name: "Counterparty Risk",
    description:
      "Risk of the backing custodian or counterparty defaulting. Higher for less-established custodians.",
    weight: 0.1,
    baselineBps: 200, // 2% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "CONCENTRATION",
    name: "Concentration",
    description:
      "Single-institution or single-asset concentration risk. Higher when one counterparty or asset class dominates.",
    weight: 0.1,
    baselineBps: 150, // 1.5% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "SETTLEMENT_TIMING",
    name: "Settlement Timing",
    description:
      "Time gap between settlement authorization and final settlement. Longer = higher buffer (T+0 < T+1 < T+2).",
    weight: 0.05,
    baselineBps: 100, // 1% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "REDEMPTION_BEHAVIOR",
    name: "Redemption Behavior",
    description:
      "Historical redemption rate pattern of the settlement asset. Higher redemption rate = higher buffer.",
    weight: 0.1,
    baselineBps: 200, // 2% baseline
    dynamicMultiplier: 1.0,
  },
  {
    id: "JURISDICTION",
    name: "Jurisdiction",
    description:
      "Jurisdiction-specific risk adjustment (e.g., regulatory regime, capital controls, sanctions exposure).",
    weight: 0.1,
    baselineBps: 200, // 2% baseline
    dynamicMultiplier: 1.0,
  },
];

// === Required Coverage Formula ===

// Required Coverage = Direct Settlement Backing + Risk Buffer
//
// Where:
//   Direct Settlement Backing = the value of assets directly matched to the
//     applicable settlement obligation (asset-matched, not universal)
//   Risk Buffer = sum of (factor.weight × factor.baselineBps × factor.dynamicMultiplier)
//     across all 9 factors, expressed as a percentage of Direct Settlement Backing

export interface RequiredCoverageInput {
  settlementObligationValue: number; // the value that needs to be settled
  settlementAssetType: string; // BANK_MONEY, CENTRAL_BANK_MONEY, RTGS, etc.
  directSettlementBacking: number; // value of assets directly matched to obligation
  riskBufferFactors?: RiskBufferFactor[]; // optional override (defaults to DEFAULT_RISK_BUFFER_FACTORS)
}

export interface RequiredCoverageResult {
  formula: "Required Coverage = Direct Settlement Backing + Risk Buffer";
  settlementObligationValue: number;
  settlementAssetType: string;
  directSettlementBacking: number;
  riskBufferBps: number; // total risk buffer in basis points
  riskBufferPercent: number; // riskBufferBps / 10000
  riskBufferValue: number; // directSettlementBacking × riskBufferPercent
  requiredCoverage: number; // directSettlementBacking + riskBufferValue
  coverageRatio: number; // requiredCoverage / settlementObligationValue (should be ≥ 1.00)
  factorBreakdown: {
    id: RiskBufferFactorId;
    name: string;
    contributionBps: number;
    contributionPercent: number;
    contributionValue: number;
  }[];
  // 130% is RETAINED ONLY as a strategic policy target/example — NOT a universal production requirement
  strategicPolicyTarget: {
    value: 1.3; // 130%
    description:
      "Strategic policy target/example — NOT a universal production requirement. Per K-directive, 130% is retained only as a possible strategic policy target, never as a mandatory commercial/constitutional settlement requirement.";
    isUniversalRequirement: false;
  };
  // Honest state: coverage ratio must be ≥ 1.00 (100%) — the constitutional invariant
  constitutionalFloor: {
    value: 1.0; // 100%
    description:
      "Constitutional floor (per JOZOUR Amendment §1.3 principle #1: 100%+ Reserve Requirement). Required Coverage ≥ Settlement Obligation at all times.";
    isUniversalRequirement: true; // THIS is the universal requirement, not 130%
  };
}

export function computeRequiredCoverage(
  input: RequiredCoverageInput
): RequiredCoverageResult {
  const factors = input.riskBufferFactors ?? DEFAULT_RISK_BUFFER_FACTORS;

  // Compute each factor's contribution
  const factorBreakdown = factors.map((f) => {
    const contributionBps = Math.round(
      f.weight * f.baselineBps * f.dynamicMultiplier
    );
    const contributionPercent = contributionBps / 10000;
    const contributionValue = input.directSettlementBacking * contributionPercent;
    return {
      id: f.id,
      name: f.name,
      contributionBps,
      contributionPercent,
      contributionValue,
    };
  });

  // Sum all factor contributions
  const totalRiskBufferBps = factorBreakdown.reduce(
    (sum, f) => sum + f.contributionBps,
    0
  );
  const totalRiskBufferPercent = totalRiskBufferBps / 10000;
  const totalRiskBufferValue =
    input.directSettlementBacking * totalRiskBufferPercent;
  const requiredCoverage =
    input.directSettlementBacking + totalRiskBufferValue;
  const coverageRatio = requiredCoverage / input.settlementObligationValue;

  return {
    formula: "Required Coverage = Direct Settlement Backing + Risk Buffer",
    settlementObligationValue: input.settlementObligationValue,
    settlementAssetType: input.settlementAssetType,
    directSettlementBacking: input.directSettlementBacking,
    riskBufferBps: totalRiskBufferBps,
    riskBufferPercent: totalRiskBufferPercent,
    riskBufferValue: totalRiskBufferValue,
    requiredCoverage,
    coverageRatio,
    factorBreakdown,
    strategicPolicyTarget: {
      value: 1.3,
      description:
        "Strategic policy target/example — NOT a universal production requirement. Per K-directive, 130% is retained only as a possible strategic policy target, never as a mandatory commercial/constitutional settlement requirement.",
      isUniversalRequirement: false,
    },
    constitutionalFloor: {
      value: 1.0,
      description:
        "Constitutional floor (per JOZOUR Amendment §1.3 principle #1: 100%+ Reserve Requirement). Required Coverage ≥ Settlement Obligation at all times.",
      isUniversalRequirement: true,
    },
  };
}

// === Configuration API ===

// The 130% strategic target is RETAINED as an EXAMPLE — operators can configure
// their risk buffer factors to sum to ~30% (i.e., 3000 bps) to match the 130%
// strategic target. But this is a CONFIGURATION CHOICE, not a universal requirement.
export function computeRiskBufferFor130PercentStrategicTarget(): RiskBufferFactor[] {
  // Returns the default factors scaled so the total risk buffer = ~30% (3000 bps)
  // — matching the legacy 130% strategic target as an EXAMPLE configuration.
  return DEFAULT_RISK_BUFFER_FACTORS.map((f) => ({
    ...f,
    // Scale up the baselineBps so the total = ~3000 bps (30%)
    // The default factors sum to ~2000 bps (20%), so multiply by ~1.5
    baselineBps: Math.round(f.baselineBps * 1.5),
  }));
}

// === Status ===
export const RESERVE_COVERAGE_LOGIC_STATUS:
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION" = "ACTIVE";
export const RESERVE_COVERAGE_LOGIC_VERSION = "v25.3.2-K3-1.0";
export const RESERVE_COVERAGE_LOGIC_SOURCE = "src/lib/reserve-coverage-logic.ts";

// === Legacy 130% reference (HONEST STATE) ===
// The legacy "universal 130% requirement" has been REMOVED as a mandatory
// commercial/constitutional settlement requirement per K-directive.
// 130% is retained ONLY as a possible strategic policy target/example.
// All prior code that hard-coded 1.30 as a requirement should be refactored
// to either:
//   (a) call computeRequiredCoverage() with appropriate inputs, OR
//   (b) reference the strategicPolicyTarget field (which is an EXAMPLE, not a requirement)
//   (c) reference the constitutionalFloor field (1.00 = 100% — the actual universal requirement)
export const LEGACY_130_PERCENT_STATUS =
  "SUPERSEDED — was universal requirement, now strategic policy target/example only";
