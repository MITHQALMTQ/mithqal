// v25.0 Prompt 4/8 — Multi-Custodian, Bank Concentration, Corridor Liquidity, Institutional Exposure
// =================================================================
// Eliminates:
//   - 52% single-custodian concentration
//   - Bank concentration risk
//   - Corridor imbalance
//   - Institutional MTQ concentration risk
//
// Implements:
//   Task 1: Custody Caps (hard constitutional limits, 6-axis measurement)
//   Task 2: Custody Independence Score (CIS, 5-axis multiplication)
//   Task 3: Bank Concentration Limits (institution/SIB/parent/jurisdiction/corridor)
//   Task 4: Bank Failure Waterfall (6 scenarios)
//   Task 5: Corridor Liquidity Engine (7 metrics + CORRIDOR_LIQUIDITY_RATIO)
//   Task 6: Institutional MTQ Exposure Limit (7 factors)
//   Task 7: Settlement Inventory Management (NOT demurrage — monitoring, not penalty)
//   Task 8: Proof of Institutional Position (3-way reconciliation)
// =================================================================

// ---- Task 1: Custody Caps ----

export const CUSTODY_CONCENTRATION_CEILING = 0.25; // 25% hard constitutional cap
export const CUSTODY_CONCENTRATION_TARGET = 0.15;  // 15% operational target

export interface CustodyConcentrationAxis {
  legalEntity: string;
  parentGroup: string;
  jurisdiction: string;
  technology: string;
  vaultLocation: string;
  operationalDependency: string;
}

export interface CustodianRecord {
  custodianId: string;
  legalName: string;
  parentGroup: string;
  jurisdiction: string;
  technology: string;
  vaultLocation: string;
  operationalDependency: string;
  holdingUsd: number;
  concentrationPct: number;
  concentrationByAxis: {
    legalEntity: number;
    parentGroup: number;
    jurisdiction: number;
    technology: number;
    vaultLocation: number;
    operationalDependency: number;
  };
  capBreached: boolean;
  targetBreached: boolean;
}

export function checkCustodyConcentration(
  custodians: CustodianRecord[],
  totalReserve: number,
): { breaches: string[]; warnings: string[]; maxConcentration: number; allWithinCap: boolean } {
  const breaches: string[] = [];
  const warnings: string[] = [];
  let maxConcentration = 0;

  for (const c of custodians) {
    // Check each axis
    const axes = [
      { name: "legalEntity", value: c.concentrationByAxis.legalEntity },
      { name: "parentGroup", value: c.concentrationByAxis.parentGroup },
      { name: "jurisdiction", value: c.concentrationByAxis.jurisdiction },
      { name: "technology", value: c.concentrationByAxis.technology },
      { name: "vaultLocation", value: c.concentrationByAxis.vaultLocation },
      { name: "operationalDependency", value: c.concentrationByAxis.operationalDependency },
    ];

    for (const axis of axes) {
      maxConcentration = Math.max(maxConcentration, axis.value);
      if (axis.value > CUSTODY_CONCENTRATION_CEILING) {
        breaches.push(`${c.legalName} ${axis.name}=${(axis.value * 100).toFixed(1)}% > ${(CUSTODY_CONCENTRATION_CEILING * 100)}% cap`);
      } else if (axis.value > CUSTODY_CONCENTRATION_TARGET) {
        warnings.push(`${c.legalName} ${axis.name}=${(axis.value * 100).toFixed(1)}% > ${(CUSTODY_CONCENTRATION_TARGET * 100)}% target`);
      }
    }
  }

  // Check parent-group aggregation (do NOT treat subsidiaries as independent)
  const groupTotals: Record<string, number> = {};
  for (const c of custodians) {
    groupTotals[c.parentGroup] = (groupTotals[c.parentGroup] ?? 0) + c.holdingUsd;
  }
  for (const [group, total] of Object.entries(groupTotals)) {
    const pct = total / totalReserve;
    if (pct > CUSTODY_CONCENTRATION_CEILING) {
      breaches.push(`Parent group "${group}" aggregate=${(pct * 100).toFixed(1)}% > cap (subsidiaries are NOT independent)`);
    }
  }

  return {
    breaches,
    warnings,
    maxConcentration,
    allWithinCap: breaches.length === 0,
  };
}

// ---- Task 2: Custody Independence Score (CIS) ----

export interface CustodyIndependenceInput {
  legalIndependence: number;       // 0-1: separate legal entity, separate ownership
  operationalIndependence: number; // 0-1: separate operational systems, staff, processes
  jurisdictionalIndependence: number; // 0-1: different legal jurisdiction
  technologyIndependence: number;  // 0-1: different tech stack, no shared infrastructure
  liquidityIndependence: number;   // 0-1: independent liquidity, no shared funding
}

export interface CISResult {
  cis: number; // 0-1 (multiplicative — ALL must be independent for high score)
  components: { name: string; value: number }[];
  classification: "INDEPENDENT" | "PARTIALLY_INDEPENDENT" | "NOT_INDEPENDENT";
  optimizerWeight: number; // weight in reserve optimization (higher CIS = higher allowed allocation)
}

export function computeCIS(input: CustodyIndependenceInput): CISResult {
  const cis = input.legalIndependence
    * input.operationalIndependence
    * input.jurisdictionalIndependence
    * input.technologyIndependence
    * input.liquidityIndependence;

  const classification = cis >= 0.80 ? "INDEPENDENT"
    : cis >= 0.50 ? "PARTIALLY_INDEPENDENT"
    : "NOT_INDEPENDENT";

  // Optimizer weight: independent custodians can hold more (up to 25% cap)
  // Partially independent: capped at 15%
  // Not independent: capped at 5%
  const optimizerWeight = classification === "INDEPENDENT" ? 1.0
    : classification === "PARTIALLY_INDEPENDENT" ? 0.6
    : 0.2;

  return {
    cis: Math.round(cis * 10000) / 10000,
    components: [
      { name: "Legal Independence", value: input.legalIndependence },
      { name: "Operational Independence", value: input.operationalIndependence },
      { name: "Jurisdictional Independence", value: input.jurisdictionalIndependence },
      { name: "Technology Independence", value: input.technologyIndependence },
      { name: "Liquidity Independence", value: input.liquidityIndependence },
    ],
    classification,
    optimizerWeight,
  };
}

// ---- Task 3: Bank Concentration Limits ----

export interface BankConcentrationLimits {
  institutionMtqExposureCap: number;   // max MTQ a single institution can hold (% of supply)
  sibCap: number;                      // Systemically Important Bank cap (lower)
  parentGroupCap: number;              // parent group aggregate cap
  jurisdictionCap: number;              // per-jurisdiction cap
  corridorCap: number;                 // per-corridor cap
}

export const BANK_CONCENTRATION_LIMITS: BankConcentrationLimits = {
  institutionMtqExposureCap: 0.15,  // 15% of total MTQ supply per institution
  sibCap: 0.10,                     // 10% for systemically important banks
  parentGroupCap: 0.20,             // 20% for parent group aggregate
  jurisdictionCap: 0.35,            // 35% per jurisdiction
  corridorCap: 0.25,               // 25% per corridor
};

export interface BankExposureRecord {
  institutionId: string;
  legalName: string;
  parentGroup: string;
  jurisdiction: string;
  isSIB: boolean;
  mtqHoldings: number;
  mtqHoldingsPct: number; // % of supply
  corridors: string[];
  breaches: string[];
}

export function checkBankConcentration(
  banks: BankExposureRecord[],
  totalSupply: number,
): { breaches: string[]; warnings: string[]; maxInstitutionPct: number; maxGroupPct: number; maxJurisdictionPct: number } {
  const breaches: string[] = [];
  const warnings: string[] = [];
  let maxInstitutionPct = 0;
  let maxGroupPct = 0;
  let maxJurisdictionPct = 0;

  for (const bank of banks) {
    const cap = bank.isSIB ? BANK_CONCENTRATION_LIMITS.sibCap : BANK_CONCENTRATION_LIMITS.institutionMtqExposureCap;
    maxInstitutionPct = Math.max(maxInstitutionPct, bank.mtqHoldingsPct);

    if (bank.mtqHoldingsPct > cap) {
      breaches.push(`${bank.legalName} MTQ=${(bank.mtqHoldingsPct * 100).toFixed(1)}% > ${cap * 100}% cap${bank.isSIB ? " (SIB)" : ""}`);
    }
  }

  // Parent group aggregation
  const groupTotals: Record<string, number> = {};
  for (const bank of banks) {
    groupTotals[bank.parentGroup] = (groupTotals[bank.parentGroup] ?? 0) + bank.mtqHoldings;
  }
  for (const [group, total] of Object.entries(groupTotals)) {
    const pct = total / totalSupply;
    maxGroupPct = Math.max(maxGroupPct, pct);
    if (pct > BANK_CONCENTRATION_LIMITS.parentGroupCap) {
      breaches.push(`Parent group "${group}" aggregate=${(pct * 100).toFixed(1)}% > ${(BANK_CONCENTRATION_LIMITS.parentGroupCap * 100)}% cap`);
    }
  }

  // Jurisdiction aggregation
  const jurTotals: Record<string, number> = {};
  for (const bank of banks) {
    jurTotals[bank.jurisdiction] = (jurTotals[bank.jurisdiction] ?? 0) + bank.mtqHoldings;
  }
  for (const [jur, total] of Object.entries(jurTotals)) {
    const pct = total / totalSupply;
    maxJurisdictionPct = Math.max(maxJurisdictionPct, pct);
    if (pct > BANK_CONCENTRATION_LIMITS.jurisdictionCap) {
      breaches.push(`Jurisdiction "${jur}" aggregate=${(pct * 100).toFixed(1)}% > ${(BANK_CONCENTRATION_LIMITS.jurisdictionCap * 100)}% cap`);
    }
  }

  return { breaches, warnings, maxInstitutionPct, maxGroupPct, maxJurisdictionPct };
}

// ---- Task 4: Bank Failure Waterfall ----

export type BankFailureScenario =
  | "LARGEST_OFFLINE"
  | "LARGEST_INSOLVENT"
  | "LARGEST_SUSPENDED"
  | "TOP_TWO_FAILURE"
  | "CYBER_COMPROMISE"
  | "REGULATORY_FREEZE";

export interface BankFailureResult {
  scenario: BankFailureScenario;
  failedBanks: string[];
  mtqAffected: number;
  mtqAffectedPct: number;
  rrImpact: number;
  systemState: string;
  defined: boolean;
  responseActions: string[];
  alternatives: string[];
  recoveryPath: string;
}

export function simulateBankFailure(
  scenario: BankFailureScenario,
  banks: BankExposureRecord[],
  supply: number,
  rr: number,
): BankFailureResult {
  const sortedByHoldings = [...banks].sort((a, b) => b.mtqHoldings - a.mtqHoldings);
  let failedBanks: string[] = [];
  let responseActions: string[] = [];
  let alternatives: string[] = [];

  switch (scenario) {
    case "LARGEST_OFFLINE":
      failedBanks = [sortedByHoldings[0].institutionId];
      responseActions = ["Route settlement through alternative banks", "Activate corridor backup liquidity", "Monitor for recovery"];
      alternatives = ["Other banks absorb settlement flow", "MTQ remains fully backed (offline ≠ insolvent)"];
      break;
    case "LARGEST_INSOLVENT":
      failedBanks = [sortedByHoldings[0].institutionId];
      responseActions = ["ISSUANCE_HALT", "Redemption queue for affected institution's customers", "Transfer MTQ positions to solvent banks", "Legal resolution for insolvent bank's assets"];
      alternatives = ["Customer MTQ transferred to solvent institution", "Reserves unaffected (bank insolvency ≠ reserve insolvency)"];
      break;
    case "LARGEST_SUSPENDED":
      failedBanks = [sortedByHoldings[0].institutionId];
      responseActions = ["SETTLEMENT_RESTRICTION for suspended bank", "Route through alternatives", "Regulatory communication"];
      alternatives = ["Suspended bank's MTQ frozen until resolution", "Other banks continue normally"];
      break;
    case "TOP_TWO_FAILURE":
      failedBanks = [sortedByHoldings[0].institutionId, sortedByHoldings[1].institutionId];
      responseActions = ["ISSUANCE_HALT", "Full redemption queue", "Activate ILPS Layer 3+4", "Emergency Council session", "Capital injection if RR < 1.05"];
      alternatives = ["Remaining banks absorb settlement", "ERTF activated", "Cross-jurisdiction routing"];
      break;
    case "CYBER_COMPROMISE":
      failedBanks = [sortedByHoldings[0].institutionId];
      responseActions = ["ISOLATE compromised bank", "Freeze MTQ transfers from compromised keys", "Key rotation (HSM/MPC)", "Forensic audit", "Customer communication"];
      alternatives = ["Compromised MTQ frozen (not lost)", "New keys issued", "Reserve backing intact"];
      break;
    case "REGULATORY_FREEZE":
      failedBanks = [sortedByHoldings[0].institutionId];
      responseActions = ["JSG isolation for affected jurisdiction", "Route through non-affected JSGs", "Legal/regulatory communication", "Compliance review"];
      alternatives = ["Other JSGs continue (jurisdictional isolation)", "MTQ in other jurisdictions unaffected"];
      break;
  }

  const mtqAffected = failedBanks.reduce((sum, id) => {
    const bank = banks.find(b => b.institutionId === id);
    return sum + (bank?.mtqHoldings ?? 0);
  }, 0);
  const mtqAffectedPct = mtqAffected / supply;
  const rrImpact = -mtqAffectedPct * 0.10; // approximate RR impact (10% of affected MTQ at risk)
  const rrAfter = rr + rrImpact;

  let systemState = "NORMAL";
  if (rrAfter < 0.95) systemState = "RESOLUTION";
  else if (rrAfter < 1.00) systemState = "EMERGENCY";
  else if (rrAfter < 1.05) systemState = "STRESS";
  else if (rrAfter < 1.10) systemState = "DEFENSIVE";

  const recoveryPath = rrAfter >= 1.05 ? "Automatic (bank failure contained)"
    : rrAfter >= 1.00 ? "Capital injection or ERTF"
    : "Resolution framework + position transfer";

  return {
    scenario,
    failedBanks,
    mtqAffected,
    mtqAffectedPct: Math.round(mtqAffectedPct * 10000) / 10000,
    rrImpact: Math.round(rrImpact * 10000) / 10000,
    systemState,
    defined: true, // ALWAYS DEFINED
    responseActions,
    alternatives,
    recoveryPath,
  };
}

// ---- Task 5: Corridor Liquidity Engine ----

export interface CorridorLiquidityMetrics {
  corridorId: string;
  expectedGrossInflow: number;
  expectedGrossOutflow: number;
  expectedNetFlow: number;
  intradayImbalance: number;
  stressImbalance: number;
  availableCorridorLiquidity: number;
  requiredCorridorBuffer: number;
  corridorLiquidityRatio: number; // CLR = available / required
  state: "NORMAL" | "WATCH" | "ELEVATED" | "DEFENSIVE" | "CRITICAL";
}

export function computeCorridorLiquidity(input: {
  corridorId: string;
  expectedGrossInflow: number;
  expectedGrossOutflow: number;
  intradayImbalance: number;
  stressImbalance: number;
  availableCorridorLiquidity: number;
}): CorridorLiquidityMetrics {
  const expectedNetFlow = input.expectedGrossInflow - input.expectedGrossOutflow;
  const requiredCorridorBuffer = Math.max(input.stressImbalance, input.intradayImbalance * 1.5);
  const corridorLiquidityRatio = input.availableCorridorLiquidity / Math.max(1, requiredCorridorBuffer);

  let state: CorridorLiquidityMetrics["state"] = "NORMAL";
  if (corridorLiquidityRatio < 1.00) state = "CRITICAL";
  else if (corridorLiquidityRatio < 1.20) state = "DEFENSIVE";
  else if (corridorLiquidityRatio < 1.50) state = "ELEVATED";
  else if (corridorLiquidityRatio < 2.00) state = "WATCH";

  return {
    corridorId: input.corridorId,
    expectedGrossInflow: input.expectedGrossInflow,
    expectedGrossOutflow: input.expectedGrossOutflow,
    expectedNetFlow: Math.round(expectedNetFlow),
    intradayImbalance: input.intradayImbalance,
    stressImbalance: input.stressImbalance,
    availableCorridorLiquidity: input.availableCorridorLiquidity,
    requiredCorridorBuffer: Math.round(requiredCorridorBuffer),
    corridorLiquidityRatio: Math.round(corridorLiquidityRatio * 10000) / 10000,
    state,
  };
}

// ---- Task 6: Institutional MTQ Exposure Limit ----

export interface InstitutionalExposureInput {
  institutionId: string;
  settlementVolume: number;       // historical 30d settlement volume
  historicalUtilization: number;  // 0-1: how much of allocated limit they typically use
  projectedFlows: number;         // projected next-30d flows
  institutionalRisk: number;       // 0-1: risk score (lower = safer)
  liquidity: number;              // institution's available liquidity
  capital: number;                // institution's capital
  corridorActivity: number;       // number of active corridors
  totalSupply: number;
}

export interface InstitutionalExposureResult {
  institutionId: string;
  exposureLimit: number;
  exposureLimitPct: number; // % of supply
  factors: { name: string; value: number; weight: number }[];
  bindingFactor: string;
}

export function computeInstitutionalExposureLimit(input: InstitutionalExposureInput): InstitutionalExposureResult {
  // Base limit: 15% of supply (institutional cap)
  const baseLimit = input.totalSupply * BANK_CONCENTRATION_LIMITS.institutionMtqExposureCap;

  // Adjust based on 7 factors
  const factors = [
    { name: "Settlement Volume", value: input.settlementVolume, weight: 0.20 },
    { name: "Historical Utilization", value: input.historicalUtilization, weight: 0.15 },
    { name: "Projected Flows", value: input.projectedFlows, weight: 0.15 },
    { name: "Institutional Risk", value: input.institutionalRisk, weight: 0.20 },
    { name: "Liquidity", value: input.liquidity, weight: 0.10 },
    { name: "Capital", value: input.capital, weight: 0.10 },
    { name: "Corridor Activity", value: input.corridorActivity, weight: 0.10 },
  ];

  // Risk adjustment: higher risk → lower limit
  const riskAdjustment = 1 - input.institutionalRisk * 0.5; // up to 50% reduction for high risk
  // Utilization adjustment: if historically using little, don't need huge limit
  const utilizationAdjustment = 0.5 + input.historicalUtilization * 0.5; // 50-100% based on utilization
  // Liquidity/capital adjustment: must have sufficient backing
  const liquidityRatio = Math.min(1, input.liquidity / (baseLimit * 0.3)); // need 30% liquidity coverage
  const capitalRatio = Math.min(1, input.capital / (baseLimit * 0.2)); // need 20% capital coverage

  const exposureLimit = baseLimit * riskAdjustment * utilizationAdjustment * liquidityRatio * capitalRatio;
  const bindingFactor = riskAdjustment < utilizationAdjustment ? "Institutional Risk"
    : liquidityRatio < capitalRatio ? "Liquidity" : "Capital";

  return {
    institutionId: input.institutionId,
    exposureLimit: Math.round(exposureLimit),
    exposureLimitPct: Math.round((exposureLimit / input.totalSupply) * 10000) / 10000,
    factors,
    bindingFactor,
  };
}

// ---- Task 7: Settlement Inventory Management (NOT demurrage) ----

export interface SettlementInventoryMetrics {
  expectedSettlementRequirement: number;
  operationalBuffer: number;
  stressBuffer: number;
  totalInventory: number;
  actualHoldings: number;
  excessInventory: number;
  excessFlagged: boolean;
  monitoringOnly: boolean; // TRUE — no automatic penalty
  recommendation: string;
}

export function computeSettlementInventory(input: {
  expectedSettlementRequirement: number;
  operationalBufferPct: number; // e.g., 0.20 = 20% buffer
  stressBufferPct: number;     // e.g., 0.50 = 50% stress buffer
  actualHoldings: number;
}): SettlementInventoryMetrics {
  const operationalBuffer = input.expectedSettlementRequirement * input.operationalBufferPct;
  const stressBuffer = input.expectedSettlementRequirement * input.stressBufferPct;
  const totalInventory = input.expectedSettlementRequirement + operationalBuffer + stressBuffer;
  const excessInventory = Math.max(0, input.actualHoldings - totalInventory);
  const excessFlagged = excessInventory > 0;

  let recommendation = "Inventory within normal range.";
  if (excessFlagged) {
    recommendation = `Excess inventory of $${excessInventory.toLocaleString()} flagged for MONITORING. No automatic penalty. Review with institution: (1) Is excess for expected future settlement? (2) Is excess creating velocity risk? (3) Should limit be adjusted?`;
  }

  return {
    expectedSettlementRequirement: input.expectedSettlementRequirement,
    operationalBuffer,
    stressBuffer,
    totalInventory,
    actualHoldings: input.actualHoldings,
    excessInventory: Math.round(excessInventory),
    excessFlagged,
    monitoringOnly: true, // DO NOT implement mandatory demurrage
    recommendation,
  };
}

// ---- Task 8: Proof of Institutional Position ----

export interface InstitutionalPositionProof {
  timestamp: string;
  institutionId: string;
  bankMtqPosition: number;           // What MITHQAL ledger says
  bankSubledgerTotal: number;         // What bank's internal subledger says
  bankAttestationTotal: number;       // What bank's cryptographic attestation says
  corporateSubpositions: { corporateId: string; balance: number }[];
  threeWayMatch: boolean;
  mismatchDetails: string[];
  status: "RECONCILED" | "MISMATCH" | "RECONCILIATION_FAILURE";
  action: string;
}

export function reconcileInstitutionalPosition(input: {
  institutionId: string;
  bankMtqPosition: number;
  bankSubledgerTotal: number;
  bankAttestationTotal: number;
  corporateSubpositions: { corporateId: string; balance: number }[];
}): InstitutionalPositionProof {
  const mismatches: string[] = [];

  if (input.bankMtqPosition !== input.bankSubledgerTotal) {
    mismatches.push(`MITHQAL ledger ($${input.bankMtqPosition.toLocaleString()}) ≠ Bank subledger ($${input.bankSubledgerTotal.toLocaleString()})`);
  }
  if (input.bankMtqPosition !== input.bankAttestationTotal) {
    mismatches.push(`MITHQAL ledger ($${input.bankMtqPosition.toLocaleString()}) ≠ Bank attestation ($${input.bankAttestationTotal.toLocaleString()})`);
  }
  if (input.bankSubledgerTotal !== input.bankAttestationTotal) {
    mismatches.push(`Bank subledger ($${input.bankSubledgerTotal.toLocaleString()}) ≠ Bank attestation ($${input.bankAttestationTotal.toLocaleString()})`);
  }

  // Check subposition sum
  const subSum = input.corporateSubpositions.reduce((s, c) => s + c.balance, 0);
  if (subSum !== input.bankSubledgerTotal) {
    mismatches.push(`Sum of corporate subpositions ($${subSum.toLocaleString()}) ≠ Bank subledger ($${input.bankSubledgerTotal.toLocaleString()})`);
  }

  const threeWayMatch = mismatches.length === 0;
  const status = threeWayMatch ? "RECONCILED"
    : mismatches.length >= 2 ? "RECONCILIATION_FAILURE"
    : "MISMATCH";

  const action = threeWayMatch ? "No action — reconciliation successful"
    : status === "RECONCILIATION_FAILURE" ? "RECONCILIATION_FAILURE — escalate to Council, restrict institution operations, forensic audit"
    : "MISMATCH — investigate, 48h resolution window, monitor";

  return {
    timestamp: new Date().toISOString(),
    institutionId: input.institutionId,
    bankMtqPosition: input.bankMtqPosition,
    bankSubledgerTotal: input.bankSubledgerTotal,
    bankAttestationTotal: input.bankAttestationTotal,
    corporateSubpositions: input.corporateSubpositions,
    threeWayMatch,
    mismatchDetails: mismatches,
    status,
    action,
  };
}
