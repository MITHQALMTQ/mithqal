// v24.2 §26 — StressDRQS + §39-41 Trade Cost Model + §44 Hierarchical Optimizer
// =================================================================

// ---- StressDRQS (§26) ----
export interface StressDrqsInput {
  drqs: number;              // headline DRQS
  depegShock: number;       // 0-1 (stress depeg magnitude)
  redemptionStress: number; // 0-1
  liquidityStress: number;  // 0-1
  counterpartyStress: number; // 0-1
  custodyStress: number;    // 0-1
  jurisdictionStress: number; // 0-1
  settlementDelay: number;  // 0-1
}

export interface StressDrqsResult {
  stressDrqs: number;
  headlineDrqs: number;
  stressDiscount: number;
  optimizerUsesStressDrqs: boolean;
}

export function computeStressDrqs(input: StressDrqsInput): StressDrqsResult {
  // StressDRQS = DRQS × (1 - weighted stress factors)
  const stressWeight = 0.5; // stress factors reduce DRQS by up to 50%
  const stressFactor =
    0.20 * input.depegShock +
    0.20 * input.redemptionStress +
    0.15 * input.liquidityStress +
    0.15 * input.counterpartyStress +
    0.10 * input.custodyStress +
    0.10 * input.jurisdictionStress +
    0.10 * input.settlementDelay;

  const stressDiscount = Math.min(stressWeight, stressFactor);
  const stressDrqs = input.drqs * (1 - stressDiscount);

  return {
    stressDrqs: Math.round(stressDrqs * 100) / 100,
    headlineDrqs: input.drqs,
    stressDiscount: Math.round(stressDiscount * 100) / 100,
    optimizerUsesStressDrqs: true,
  };
}

// ---- 15-Component Trade Cost Model (§39) ----
export interface TradeCostComponents {
  brokerFee: number;
  exchangeFee: number;
  spread: number;
  slippage: number;
  marketImpact: number;
  fxConversionCost: number;
  custodyCost: number;
  transferCost: number;
  networkGasCost: number;
  settlementCost: number;
  storageCost: number;
  insuranceCost: number;
  taxDutyCost: number;
  opportunityCost: number;
  otherApplicableCost: number;
}

export interface TradeCostResult {
  totalTradeCost: number;       // in bps
  totalTradeCostUsd: number;    // in USD
  effectivePurchasePrice: number;
  effectiveSalePrice: number;
  components: TradeCostComponents;
  lifecycleCost: number;       // §41: Acquisition + Holding + Liquidation + Opportunity
  costRegime: "NORMAL" | "STRESS" | "EMERGENCY"; // §47
}

export function computeTradeCost(
  marketPrice: number,
  quantity: number,
  components: Partial<TradeCostComponents>,
  costRegime: "NORMAL" | "STRESS" | "EMERGENCY" = "NORMAL",
  holdingCostAnnual: number = 0,
  holdingPeriodDays: number = 365,
): TradeCostResult {
  // Stress multiplier (§47)
  const stressMultiplier = costRegime === "EMERGENCY" ? 3.0 : costRegime === "STRESS" ? 2.0 : 1.0;

  const fullComponents: TradeCostComponents = {
    brokerFee: (components.brokerFee || 0) * stressMultiplier,
    exchangeFee: (components.exchangeFee || 0) * stressMultiplier,
    spread: (components.spread || 0) * stressMultiplier,
    slippage: (components.slippage || 0) * stressMultiplier,
    marketImpact: (components.marketImpact || 0) * stressMultiplier,
    fxConversionCost: components.fxConversionCost || 0,
    custodyCost: components.custodyCost || 0,
    transferCost: components.transferCost || 0,
    networkGasCost: (components.networkGasCost || 0) * stressMultiplier,
    settlementCost: (components.settlementCost || 0) * stressMultiplier,
    storageCost: components.storageCost || 0,
    insuranceCost: components.insuranceCost || 0,
    taxDutyCost: components.taxDutyCost || 0,
    opportunityCost: components.opportunityCost || 0,
    otherApplicableCost: (components.otherApplicableCost || 0) * stressMultiplier,
  };

  const totalBps = Object.values(fullComponents).reduce((s, v) => s + v, 0);
  const totalUsd = (totalBps / 10000) * marketPrice * quantity;
  const costPerUnit = totalUsd / quantity;

  // Lifecycle Cost (§41)
  const acquisitionCost = totalUsd;
  const holdingCost = (holdingCostAnnual / 365) * holdingPeriodDays * quantity;
  const liquidationCost = totalUsd * 0.7; // estimated liquidation cost (70% of acquisition)
  const lifecycleCost = acquisitionCost + holdingCost + liquidationCost + fullComponents.opportunityCost;

  return {
    totalTradeCost: Math.round(totalBps * 10) / 10,
    totalTradeCostUsd: Math.round(totalUsd * 100) / 100,
    effectivePurchasePrice: marketPrice + costPerUnit,
    effectiveSalePrice: marketPrice - costPerUnit,
    components: fullComponents,
    lifecycleCost: Math.round(lifecycleCost * 100) / 100,
    costRegime,
  };
}

// ---- 4-Tier Hierarchical Optimizer (§44) ----
export interface OptimizerConstraints {
  rr: number;
  stressRR: number;
  lcr: number;
  legalEligible: boolean;
  usdCap: number;
  effectiveUsdExposure: number;
  perCurrencyWeights: Record<string, number>;
  bullionPct: number;
  goldPct: number;
  silverPct: number;
  digitalPct: number;
  perStablecoinIssuer: Record<string, number>;
  perCustodian: Record<string, number>;
  perJurisdiction: Record<string, number>;
}

export interface OptimizerObjective {
  cvar: number;
  stressLoss: number;
  fxRisk: number;
  concentrationRisk: number;
  liquidityRisk: number;
  counterpartyRisk: number;
  geoRisk: number;
}

export interface OptimizerCosts {
  executionCost: number;
  turnoverCost: number;
  holdingCost: number;
  lifecycleCost: number;
}

export interface HierarchicalOptimizerResult {
  tier1Passed: boolean;
  tier1Failures: string[];
  tier2Objective: number;
  tier3Cost: number;
  tier4StabilityScore: number;
  decision: "TRADE" | "DEFER" | "NO_TRADE" | "EMERGENCY";
  netRebalanceBenefit: number;
  reason: string;
  modelValidityGate: boolean;  // §46
  fallbackToDeterministic: boolean;
}

export function runHierarchicalOptimizer(
  constraints: OptimizerConstraints,
  objective: OptimizerObjective,
  costs: OptimizerCosts,
  modelValid: boolean,
  netBenefitThreshold: number = 0.001,
): HierarchicalOptimizerResult {
  // §46: ModelValidityGate — if model invalid, fallback to deterministic
  if (!modelValid) {
    return {
      tier1Passed: false,
      tier1Failures: ["ModelValidityGate FAILED — fallback to LastApprovedDeterministicPolicyPortfolio"],
      tier2Objective: 0,
      tier3Cost: 0,
      tier4StabilityScore: 0,
      decision: "NO_TRADE",
      netRebalanceBenefit: 0,
      reason: "Model invalid — optimizer disabled, fallback to deterministic safe portfolio",
      modelValidityGate: false,
      fallbackToDeterministic: true,
    };
  }

  // TIER 1 — HARD CONSTRAINTS (must ALL pass)
  const failures: string[] = [];
  if (constraints.rr < 1.0) failures.push(`RR=${constraints.rr.toFixed(4)} < 100%`);
  if (constraints.stressRR < 1.0) failures.push(`StressRR=${constraints.stressRR.toFixed(4)} < 100%`);
  if (constraints.lcr < 1.0) failures.push(`LCR=${constraints.lcr.toFixed(2)} < 1.0`);
  if (!constraints.legalEligible) failures.push("Legal eligibility failed");
  if (constraints.usdCap > 0.35) failures.push(`USD=${(constraints.usdCap * 100).toFixed(1)}% > 35%`);
  if (constraints.effectiveUsdExposure > 0.35) failures.push(`EffectiveUSDExposure=${(constraints.effectiveUsdExposure * 100).toFixed(1)}% > 35%`);
  if (constraints.bullionPct < 0.15 || constraints.bullionPct > 0.25) failures.push(`Bullion=${(constraints.bullionPct * 100).toFixed(1)}% outside 15-25%`);
  if (constraints.digitalPct > 0.05) failures.push(`Digital=${(constraints.digitalPct * 100).toFixed(1)}% > 5%`);

  // Check per-currency caps
  for (const [ccy, w] of Object.entries(constraints.perCurrencyWeights)) {
    if (w > 0.60) failures.push(`${ccy}=${(w * 100).toFixed(1)}% > 60% cap`);
  }

  // Check per-custodian caps
  for (const [cust, w] of Object.entries(constraints.perCustodian)) {
    if (w > 0.15) failures.push(`Custodian ${cust}=${(w * 100).toFixed(1)}% > 15% cap`);
  }

  // Check per-jurisdiction caps
  for (const [juris, w] of Object.entries(constraints.perJurisdiction)) {
    if (w > 0.30) failures.push(`Jurisdiction ${juris}=${(w * 100).toFixed(1)}% > 30% cap`);
  }

  // Check per-stablecoin-issuer caps
  for (const [issuer, w] of Object.entries(constraints.perStablecoinIssuer)) {
    if (w > 0.02) failures.push(`Stablecoin ${issuer}=${(w * 100).toFixed(1)}% > 2% cap`);
  }

  const tier1Passed = failures.length === 0;

  if (!tier1Passed) {
    return {
      tier1Passed: false,
      tier1Failures: failures,
      tier2Objective: 0,
      tier3Cost: 0,
      tier4StabilityScore: 0,
      decision: "EMERGENCY",
      netRebalanceBenefit: 0,
      reason: `Tier 1 FAILED: ${failures.join("; ")}`,
      modelValidityGate: true,
      fallbackToDeterministic: false,
    };
  }

  // TIER 2 — RISK OBJECTIVES (minimize)
  const tier2Objective =
    0.20 * objective.cvar +
    0.15 * objective.stressLoss +
    0.10 * objective.fxRisk +
    0.10 * objective.concentrationRisk +
    0.15 * objective.liquidityRisk +
    0.10 * objective.counterpartyRisk +
    0.10 * objective.geoRisk +
    0.10 * 0; // ModelRisk handled by ModelValidityGate

  // TIER 3 — ECONOMIC COSTS (minimize)
  const tier3Cost = costs.executionCost + costs.turnoverCost + costs.holdingCost + costs.lifecycleCost;

  // TIER 4 — STABILITY PREFERENCE (maximize)
  const tier4StabilityScore =
    constraints.stressRR * 0.30 +
    constraints.lcr * 0.20 +
    (1 - costs.turnoverCost) * 0.15 +
    (1 - objective.concentrationRisk) * 0.15 +
    0.20; // model dependency (lower = better, simplified)

  // Net Rebalance Benefit (§42)
  const netRebalanceBenefit =
    (1 - tier2Objective) +  // risk reduction
    constraints.lcr * 0.01 +  // liquidity improvement
    (1 - objective.concentrationRisk) * 0.01 +  // diversification benefit
    constraints.stressRR * 0.01 -  // stress RR improvement
    tier3Cost / 10000;  // total trade cost

  // Decision logic (§43: NO TRADE option)
  let decision: "TRADE" | "DEFER" | "NO_TRADE" | "EMERGENCY" = "TRADE";
  let reason = "Trade approved — net benefit exceeds threshold";

  if (netRebalanceBenefit <= 0) {
    decision = "NO_TRADE";
    reason = "Net rebalance benefit ≤ 0 — NO TRADE selected (cost exceeds benefit)";
  } else if (netRebalanceBenefit < netBenefitThreshold) {
    decision = "DEFER";
    reason = `Net benefit ${netRebalanceBenefit.toFixed(6)} below threshold ${netBenefitThreshold} — DEFER`;
  }

  return {
    tier1Passed: true,
    tier1Failures: [],
    tier2Objective: Math.round(tier2Objective * 1e6) / 1e6,
    tier3Cost: Math.round(tier3Cost * 10) / 10,
    tier4StabilityScore: Math.round(tier4StabilityScore * 1e6) / 1e6,
    decision,
    netRebalanceBenefit: Math.round(netRebalanceBenefit * 1e6) / 1e6,
    reason,
    modelValidityGate: true,
    fallbackToDeterministic: false,
  };
}
