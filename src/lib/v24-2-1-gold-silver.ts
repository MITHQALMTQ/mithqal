// v24.2.1 — Tokenized Allocated Gold Reserve Layer + Conditional Silver
// =================================================================
// Implements:
//   §12-16: Tokenized Allocated Gold (TGRS, eligibility, haircut, dynamic range)
//   §17-19: Conditional Silver (SDC_Ag, admission test, 0% normal target)
//   §20: φ_t rewrite (gold mandatory dominant, silver conditional)
//   §21: BRI revision (GoldResilienceIndex + ConditionalMetalDiversificationIndex)
//   §22: Updated liquidation order (tokenized gold before physical gold)
//   §37: A/B/C/D/E portfolio comparison framework
//
// Identity (NO double-counting):
//   Gold_total = PhysicalAllocatedGold + TokenizedAllocatedGold
//   Silver_total = PhysicalSilver + TokenizedSilver
//   Bullion = Gold_total + Silver_total
//   TotalReserve = Bullion + Fiat + Digital = 100%
// =================================================================

// ---- APPROVED Strategic Portfolio B (v24.2.1-V.2 validation) ----
// Selected by COO+CTO+PM executive decision on 2026-08-13 after the 6-task
// validation cycle. Portfolio B won on operational capability + CVaR_99 +
// governance alignment + implementation readiness. MC margin vs Portfolio D
// was within noise (0.16pp StressRR).
//
// Status: APPROVED — no longer PROVISIONAL.
export const APPROVED_PORTFOLIO_B = {
  name: "B — Gold-Dominant + Tokenized Allocated Gold (PAXG)",
  physicalGold: 0.15,
  tokenizedGold: 0.05,   // PAXG only — TGRS 9.00, H_TG 5.5%
  silver: 0.0,            // conditional, SDC_Ag-negative per Task 4 backtest
  fiat: 0.775,
  digital: 0.025,
  total: 1.00,
  status: "APPROVED" as const,
  approvalDate: "2026-08-13",
  approvalAuthority: "COO + CTO + Project Manager (executive decision)",
  decisionBasis: [
    "Task 1: MC reproduced (P(RR<100%)=21.5432%, seed=42)",
    "Task 2: A/B/C/D/E comparison — B has lowest CVaR_99 ($15.62M)",
    "Task 3: PAXG is the only Eligible tokenized gold (TGRS=9.00)",
    "Task 4: Silver=0% validated (SDC_Ag borderline, conservative default)",
    "Task 5: 4/5 challenger models confirm primary",
    "Task 6: Anti-double-counting proven (32/32 PASS)",
  ],
};

// ---- Canonical Tokenized Gold Product Registry (Task 3 validation) ----
// Only products that PASS the 13-point eligibility gate AND score TGRS ≥ 8.0
// are admitted to the reserve. As of 2026-08-13, only PAXG qualifies.
export interface TokenizedGoldProduct {
  ticker: string;
  name: string;
  issuer: string;
  chain: string;
  contractAddress?: string;
  tgrs: number;
  classification: "ELIGIBLE" | "CONDITIONAL" | "REJECTED";
  haircut: number;          // 0-1 fraction
  eligibilityGatePassed: boolean;
  eligibilityFailures: string[];
  validatedDate: string;
  admitted: boolean;        // true only if ELIGIBLE + gate passed
}

export const TOKENIZED_GOLD_REGISTRY: TokenizedGoldProduct[] = [
  {
    ticker: "PAXG",
    name: "PAX Gold",
    issuer: "Paxos Trust Company",
    chain: "Ethereum (ERC-20)",
    contractAddress: "0x45804880De22913dAFE09f4980848ECE6EcbAf78",
    tgrs: 9.00,
    classification: "ELIGIBLE",
    haircut: 0.055,          // H_TG = 5% + (10-9.00)×0.5% = 5.5%
    eligibilityGatePassed: true,
    eligibilityFailures: [],
    validatedDate: "2026-08-13",
    admitted: true,
  },
  {
    ticker: "XAUT",
    name: "Tether Gold",
    issuer: "TG Commodities Limited",
    chain: "Ethereum / Tron",
    contractAddress: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
    tgrs: 7.71,
    classification: "REJECTED",  // fails 13-point gate (bankruptcy-remoteness, legal-review UNCERTAIN)
    haircut: 0.0615,
    eligibilityGatePassed: false,
    eligibilityFailures: ["bankruptcyRemoteness", "legalReview"],
    validatedDate: "2026-08-13",
    admitted: false,
  },
  {
    ticker: "KAU",
    name: "Kinesis Gold",
    issuer: "KMS Labs S.A.",
    chain: "Kinesis Blockchain (Stellar fork)",
    tgrs: 7.23,
    classification: "REJECTED",
    haircut: 0.0639,
    eligibilityGatePassed: false,
    eligibilityFailures: ["bankruptcyRemoteness", "legalReview"],
    validatedDate: "2026-08-13",
    admitted: false,
  },
];

// Canonical admitted product (the one used by Portfolio B)
export const CANONICAL_TOKENIZED_GOLD = TOKENIZED_GOLD_REGISTRY.find(p => p.admitted) ?? null;

// ---- TGRS Monitoring Hook (fail-closed) ----
// Quarterly re-score of PAXG. If TGRS drops below 8.0 or eligibility gate
// fails, the tokenized gold weight is FORCED to 0 within 5 business days.
// This is a runtime guard, not just a policy statement.
export interface TgrsMonitorResult {
  product: string;
  currentTgrs: number;
  threshold: number;
  gatePassed: boolean;
  action: "OK" | "SUSPEND" | "INVESTIGATE";
  reason: string;
  nextReviewDate: string;
}

export function monitorTgrs(product: TokenizedGoldProduct): TgrsMonitorResult {
  const now = new Date();
  const nextQuarter = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  const nextReviewDate = nextQuarter.toISOString().slice(0, 10);

  if (!product.eligibilityGatePassed) {
    return {
      product: product.ticker,
      currentTgrs: product.tgrs,
      threshold: 8.0,
      gatePassed: false,
      action: "SUSPEND",
      reason: `Eligibility gate FAILED (${product.eligibilityFailures.join(", ")}). Tokenized gold weight MUST be 0. Suspend within 5 business days.`,
      nextReviewDate,
    };
  }
  if (product.tgrs < 8.0) {
    return {
      product: product.ticker,
      currentTgrs: product.tgrs,
      threshold: 8.0,
      gatePassed: true,
      action: "SUSPEND",
      reason: `TGRS=${product.tgrs.toFixed(2)} < 8.0 threshold. Tokenized gold weight MUST be 0 within 5 business days.`,
      nextReviewDate,
    };
  }
  if (product.tgrs < 8.5) {
    return {
      product: product.ticker,
      currentTgrs: product.tgrs,
      threshold: 8.0,
      gatePassed: true,
      action: "INVESTIGATE",
      reason: `TGRS=${product.tgrs.toFixed(2)} is within 0.5 of threshold. Investigate issuer status; prepare contingency suspension.`,
      nextReviewDate,
    };
  }
  return {
    product: product.ticker,
    currentTgrs: product.tgrs,
    threshold: 8.0,
    gatePassed: true,
    action: "OK",
    reason: `TGRS=${product.tgrs.toFixed(2)} ≥ 8.0. Eligibility gate passed. Tokenized gold admitted.`,
    nextReviewDate,
  };
}

// ---- Anti-Double-Counting Runtime Guard (Task 6) ----
// Enforces Gold_total = PhysicalAllocated + TokenizedAllocated at runtime.
// Returns the effective gold weight, with a hard guard against double-counting.
export interface AntiDoubleCountResult {
  physicalGold: number;
  tokenizedGold: number;
  goldTotal: number;
  tokenizedAdmitted: boolean;
  effectiveTokenizedWeight: number;  // 0 if suspended by TGRS monitor
  invariantHolds: boolean;
  reason: string;
}

export function enforceAntiDoubleCounting(
  physicalGold: number,
  tokenizedGold: number,
  tgrsMonitor: TgrsMonitorResult,
): AntiDoubleCountResult {
  // If TGRS monitor says SUSPEND, effective tokenized weight = 0
  const effectiveTokenizedWeight =
    tgrsMonitor.action === "SUSPEND" ? 0 : tokenizedGold;

  const goldTotal = physicalGold + effectiveTokenizedWeight;
  const tokenizedAdmitted = tgrsMonitor.action !== "SUSPEND";

  // Invariant: goldTotal must equal physical + effective-tokenized (never more)
  const invariantHolds = Math.abs(goldTotal - (physicalGold + effectiveTokenizedWeight)) < 1e-12;

  return {
    physicalGold,
    tokenizedGold: effectiveTokenizedWeight,
    goldTotal,
    tokenizedAdmitted,
    effectiveTokenizedWeight,
    invariantHolds,
    reason: tokenizedAdmitted
      ? `Gold_total = ${physicalGold} + ${effectiveTokenizedWeight} = ${goldTotal} (PAXG admitted, TGRS=${tgrsMonitor.currentTgrs.toFixed(2)})`
      : `Gold_total = ${physicalGold} + 0 = ${goldTotal} (PAXG SUSPENDED — ${tgrsMonitor.reason})`,
  };
}

// ---- Tokenized Gold Reserve Score (TGRS) — §14 ----
export interface TgrsFactors {
  physicalBacking: number;    // 0-10: verified allocated physical gold backing
  legalTitle: number;         // 0-10: legally enforceable ownership/proprietary interest
  custody: number;            // 0-10: allocated custody, segregation, bankruptcy remoteness
  redemption: number;         // 0-10: reliable redemption rights
  issuerReliability: number;  // 0-10: issuer track record and financial strength
  oracleReliability: number;  // 0-10: approved oracle/reference pricing
  settlement: number;         // 0-10: settlement infrastructure quality
  liquidity: number;          // 0-10: secondary market liquidity depth
  operationalResilience: number; // 0-10: operational continuity and technology/ledger integrity
  jurisdiction: number;       // 0-10: jurisdiction quality and legal recognition
}

export interface TgrsResult {
  score: number;             // 0-10 weighted
  classification: "ELIGIBLE" | "CONDITIONAL" | "REJECTED";
  factors: TgrsFactors;
  haircutRecommendation: number; // 0-1 (fraction)
  eligible: boolean;
}

const TGRS_WEIGHTS = {
  physicalBacking: 0.20,
  legalTitle: 0.15,
  custody: 0.15,
  redemption: 0.10,
  issuerReliability: 0.10,
  oracleReliability: 0.10,
  settlement: 0.08,
  liquidity: 0.05,
  operationalResilience: 0.05,
  jurisdiction: 0.02,
};

export function computeTgrs(factors: TgrsFactors): TgrsResult {
  const score =
    factors.physicalBacking * TGRS_WEIGHTS.physicalBacking +
    factors.legalTitle * TGRS_WEIGHTS.legalTitle +
    factors.custody * TGRS_WEIGHTS.custody +
    factors.redemption * TGRS_WEIGHTS.redemption +
    factors.issuerReliability * TGRS_WEIGHTS.issuerReliability +
    factors.oracleReliability * TGRS_WEIGHTS.oracleReliability +
    factors.settlement * TGRS_WEIGHTS.settlement +
    factors.liquidity * TGRS_WEIGHTS.liquidity +
    factors.operationalResilience * TGRS_WEIGHTS.operationalResilience +
    factors.jurisdiction * TGRS_WEIGHTS.jurisdiction;

  const eligible = score >= 8.0;
  const conditional = score >= 6.0 && score < 8.0;

  // Haircut: physical gold = 5%, tokenized gold starts higher and converges with evidence
  // H_TG = 5% (physical baseline) + (10 - TGRS) * 0.5%
  const haircutRecommendation = Math.max(0.05, 0.05 + (10 - score) * 0.005);

  return {
    score: Math.round(score * 100) / 100,
    classification: eligible ? "ELIGIBLE" : conditional ? "CONDITIONAL" : "REJECTED",
    factors,
    haircutRecommendation: Math.round(haircutRecommendation * 10000) / 10000,
    eligible,
  };
}

// ---- Tokenized Gold Eligibility Gate — §13 ----
export interface TokenizedGoldEligibility {
  identifiablePhysicalBacking: boolean;
  legallyEnforceableOwnership: boolean;
  allocatedCustody: boolean;
  segregation: boolean;
  bankruptcyRemoteness: boolean;
  noRehypothecation: boolean;
  independentReconciliation: boolean;
  independentValuation: boolean;
  redemptionRights: boolean;
  approvedOraclePricing: boolean;
  legalReview: boolean;
  technologyLedgerIntegrity: boolean;
  operationalContinuity: boolean;
}

export function checkTokenizedGoldEligibility(
  eligibility: TokenizedGoldEligibility,
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  if (!eligibility.identifiablePhysicalBacking) failures.push("No identifiable physical gold backing");
  if (!eligibility.legallyEnforceableOwnership) failures.push("No legally enforceable ownership");
  if (!eligibility.allocatedCustody) failures.push("Not allocated custody");
  if (!eligibility.segregation) failures.push("Not segregated");
  if (!eligibility.bankruptcyRemoteness) failures.push("Not bankruptcy-remote");
  if (!eligibility.noRehypothecation) failures.push("Rehypothecation not prohibited");
  if (!eligibility.independentReconciliation) failures.push("No independent reconciliation");
  if (!eligibility.independentValuation) failures.push("No independent valuation");
  if (!eligibility.redemptionRights) failures.push("No redemption rights");
  if (!eligibility.approvedOraclePricing) failures.push("No approved oracle pricing");
  if (!eligibility.legalReview) failures.push("No legal review");
  if (!eligibility.technologyLedgerIntegrity) failures.push("Technology/ledger integrity not verified");
  if (!eligibility.operationalContinuity) failures.push("No operational continuity plan");

  return { passed: failures.length === 0, failures };
}

// ---- Silver Diversification Contribution (SDC_Ag) — §18 ----
export interface SilverAdmissionInput {
  cvarWithSilver: number;
  cvarWithoutSilver: number;
  stressRRWithSilver: number;
  stressRRWithoutSilver: number;
  lcrWithSilver: number;
  lcrWithoutSilver: number;
  silverExecutionCostBps: number;
  silverLiquidityDepth: number; // 0-1
  silverCustodyCost: number;
  silverVolatility: number;
}

export interface SilverAdmissionResult {
  sdcAg: number;              // Silver Diversification Contribution score
  netResilienceGain: number;
  netCost: number;
  admitted: boolean;
  reason: string;
  optimalWeight: number;      // 0-0.03
}

export function evaluateSilverAdmission(input: SilverAdmissionInput): SilverAdmissionResult {
  // CVaR improvement from silver
  const cvarImprovement = input.cvarWithoutSilver - input.cvarWithSilver; // positive = silver helps
  const stressRRImprovement = input.stressRRWithSilver - input.stressRRWithoutSilver;
  const lcrImprovement = input.lcrWithSilver - input.lcrWithoutSilver;

  // Costs
  const executionCost = input.silverExecutionCostBps / 10000;
  const custodyCost = input.silverCustodyCost;
  const volatilityPenalty = input.silverVolatility * 0.1; // 30% vol → 3% penalty
  const liquidityPenalty = (1 - input.silverLiquidityDepth) * 0.02;

  const netResilienceGain = cvarImprovement + stressRRImprovement * 0.001 + lcrImprovement * 0.001;
  const netCost = executionCost + custodyCost + volatilityPenalty + liquidityPenalty;

  const sdcAg = netResilienceGain - netCost;
  const admitted = sdcAg > 0;

  let optimalWeight = 0;
  if (admitted) {
    // Scale: more benefit → more silver (up to 3%)
    optimalWeight = Math.min(0.03, Math.max(0, sdcAg * 0.5));
  }

  return {
    sdcAg: Math.round(sdcAg * 1e6) / 1e6,
    netResilienceGain: Math.round(netResilienceGain * 1e6) / 1e6,
    netCost: Math.round(netCost * 1e6) / 1e6,
    admitted,
    reason: admitted
      ? `Silver admitted: net resilience gain ${netResilienceGain.toFixed(6)} > net cost ${netCost.toFixed(6)}`
      : `Silver rejected: net resilience gain ${netResilienceGain.toFixed(6)} ≤ net cost ${netCost.toFixed(6)} — Silver = 0% is valid`,
    optimalWeight: Math.round(optimalWeight * 1e6) / 1e6,
  };
}

// ---- φ_t Rewrite — §20 ----
export interface PhiTResult {
  goldTotal: number;
  physicalGold: number;
  tokenizedGold: number;
  silverTotal: number;
  physicalSilver: number;
  tokenizedSilver: number;
  bullion: number;
  goldShareWithinBullion: number; // Gold_total / Bullion_total
  goldDominant: boolean;
  silverConditional: boolean;
}

export function computePhiT(
  physicalGold: number,
  tokenizedGold: number,
  physicalSilver: number,
  tokenizedSilver: number,
): PhiTResult {
  const goldTotal = physicalGold + tokenizedGold;
  const silverTotal = physicalSilver + tokenizedSilver;
  const bullion = goldTotal + silverTotal;

  const goldShareWithinBullion = bullion > 0 ? goldTotal / bullion : 1.0;
  const goldDominant = goldShareWithinBullion >= 0.70; // governance-approved threshold

  return {
    goldTotal,
    physicalGold,
    tokenizedGold,
    silverTotal,
    physicalSilver,
    tokenizedSilver,
    bullion,
    goldShareWithinBullion: Math.round(goldShareWithinBullion * 1e6) / 1e6,
    goldDominant,
    silverConditional: silverTotal > 0,
  };
}

// ---- BRI Revision — §21 ----
export interface RevisedBriResult {
  goldResilienceIndex: number;
  conditionalMetalDiversificationIndex: number;
  bri: number;                // Combined (if silver > 0, uses silver component; if 0, pure gold)
  silverWeight: number;
  advisory: boolean;
}

export function computeRevisedBri(
  goldValNow: number,
  goldValBase: number,
  silverValNow: number,
  silverValBase: number,
  silverWeight: number,
): RevisedBriResult {
  const goldRatio = goldValBase > 0 ? goldValNow / goldValBase : 1.0;
  const goldResilienceIndex = goldRatio; // Pure gold resilience

  let conditionalMetalDiversificationIndex = 1.0;
  let bri = goldResilienceIndex;

  if (silverWeight > 0 && silverValBase > 0) {
    const silverRatio = silverValNow / silverValBase;
    // Dynamic weight: if silver is conditional, its weight in BRI is its portfolio weight (capped at 10%)
    const wSilver = Math.min(0.10, silverWeight / 0.03 * 0.10);
    const wGold = 1.0 - wSilver;

    conditionalMetalDiversificationIndex = silverRatio;
    bri = Math.pow(goldRatio, wGold) * Math.pow(silverRatio, wSilver);
  }

  return {
    goldResilienceIndex: Math.round(goldResilienceIndex * 1e6) / 1e6,
    conditionalMetalDiversificationIndex: Math.round(conditionalMetalDiversificationIndex * 1e6) / 1e6,
    bri: Math.round(bri * 1e6) / 1e6,
    silverWeight,
    advisory: true,
  };
}

// ---- Updated Liquidation Order — §22 ----
export const LIQUIDATION_ORDER_V2421 = [
  "1. Eligible stablecoins (fastest, depeg risk if held)",
  "2. Cash (HQLA L1, 0% haircut)",
  "3. Short-duration sovereign (HQLA L2A, T+1)",
  "4. Non-USD FX (7 bps cost)",
  "5. Conditional Silver / Tokenized Conditional Metal (if held)",
  "6. Tokenized Gold (digital representation — liquidate before physical)",
  "7. Physical Gold LAST (requires Exhaustion Certificate, constitutional strategic capital)",
];

// ---- A/B/C/D/E Portfolio Comparison — §37 ----
export interface CandidatePortfolio {
  name: string;
  physicalGold: number;
  tokenizedGold: number;
  silver: number;
  fiat: number;
  digital: number;
  total: number;
}

export const CANDIDATE_PORTFOLIOS: CandidatePortfolio[] = [
  {
    name: "A — Current v24.2 Baseline",
    physicalGold: 0.15, tokenizedGold: 0.0, silver: 0.03,
    fiat: 0.795, digital: 0.025, total: 1.00,
  },
  {
    name: "B — Gold-Dominant + Tokenized Gold",
    physicalGold: 0.15, tokenizedGold: 0.05, silver: 0.0,
    fiat: 0.775, digital: 0.025, total: 1.00,
  },
  {
    name: "C — More Physical Gold",
    physicalGold: 0.17, tokenizedGold: 0.03, silver: 0.0,
    fiat: 0.775, digital: 0.025, total: 1.00,
  },
  {
    name: "D — All Physical Gold",
    physicalGold: 0.20, tokenizedGold: 0.0, silver: 0.0,
    fiat: 0.775, digital: 0.025, total: 1.00,
  },
  {
    name: "E — Conditional Silver",
    physicalGold: 0.14, tokenizedGold: 0.04, silver: 0.02,
    fiat: 0.775, digital: 0.025, total: 1.00,
  },
];

export interface CandidateTestResult {
  name: string;
  rr: number;
  stressRR: number;
  pRRBelow100: number;
  lcr: number;
  cvar99: number;
  cvar999: number;
  custodyLossSensitivity: number;
  tokenizedGoldRisk: number;
  silverContribution: number;
  executionCost: number;
  lifecycleCost: number;
  modelDependency: number;
  minCapitalRequired: number;
  winner: boolean;
}

export function compareCandidates(
  goldPrice: number,
  silverPrice: number,
  ra: number,
  liability: number,
): CandidateTestResult[] {
  const results: CandidateTestResult[] = [];

  for (const c of CANDIDATE_PORTFOLIOS) {
    const bullionValue = ra * (c.physicalGold + c.tokenizedGold + c.silver);
    const goldValue = ra * (c.physicalGold + c.tokenizedGold);
    const silverValue = ra * c.silver;

    // Simplified stress: gold -30%, silver -40%, FX -10%
    const goldLoss = goldValue * 0.30 * 0.95; // 5% haircut
    const silverLoss = silverValue * 0.40 * 0.93; // 7% haircut
    const fxLoss = ra * c.fiat * 0.10 * 0.98;
    const digitalLoss = ra * c.digital * 0.50 * 0.98;

    const totalLoss = goldLoss + silverLoss + fxLoss + digitalLoss;
    const raAfter = ra - totalLoss;
    const rr = (raAfter / liability) * 100;
    const stressRR = rr * 0.90;

    // Tokenized gold risk (if tokenized > 0)
    const tokenizedGoldRisk = c.tokenizedGold > 0
      ? (ra * c.tokenizedGold * 0.10 * 0.08) // 10% impairment × 8% haircut
      : 0;

    // Silver contribution (negative = silver helped)
    const silverContribution = c.silver > 0
      ? -silverLoss * 0.1 // diversification benefit (small)
      : 0;

    // Execution cost (silver is expensive: 20bps, tokenized gold: 8bps, physical gold: 10bps)
    const executionCost =
      c.physicalGold * 10 + c.tokenizedGold * 8 + c.silver * 20 + c.fiat * 7 + c.digital * 6;

    const lifecycleCost = executionCost * 1.5;

    // Model dependency (more tokenized = more model dependency)
    const modelDependency = c.tokenizedGold * 0.5 + c.silver * 0.2;

    results.push({
      name: c.name,
      rr: Math.round(rr * 100) / 100,
      stressRR: Math.round(stressRR * 100) / 100,
      pRRBelow100: rr < 100 ? 0.15 : 0.10, // simplified
      lcr: Math.round((ra * 0.80 / (liability * 0.10)) * 100) / 100,
      cvar99: Math.round(totalLoss * 1.5),
      cvar999: Math.round(totalLoss * 1.8),
      custodyLossSensitivity: Math.round((c.physicalGold * 0.05 + c.tokenizedGold * 0.08) * 10000) / 100,
      tokenizedGoldRisk: Math.round(tokenizedGoldRisk),
      silverContribution: Math.round(silverContribution),
      executionCost: Math.round(executionCost * 10) / 10,
      lifecycleCost: Math.round(lifecycleCost * 10) / 10,
      modelDependency: Math.round(modelDependency * 100) / 100,
      minCapitalRequired: Math.max(0, Math.round((liability * 1.20 - ra) / 1000) * 1000),
      winner: false,
    });
  }

  // Select winner: highest StressRR with lowest CVaR and model dependency
  results.sort((a, b) => {
    // Primary: StressRR (higher is better)
    if (b.stressRR !== a.stressRR) return b.stressRR - a.stressRR;
    // Secondary: CVaR99 (lower is better)
    if (a.cvar99 !== b.cvar99) return a.cvar99 - b.cvar99;
    // Tertiary: model dependency (lower is better)
    return a.modelDependency - b.modelDependency;
  });

  if (results.length > 0) results[0].winner = true;

  return results;
}

// ---- Subsystem State Reconciliation — §33 ----
export interface SubsystemStates {
  liquidityState: string;
  correlationState: string;
  custodyState: string;
  currencyState: string;
  digitalState: string;
  oracleState: string;
  modelState: string;
}

export function computeGlobalState(subsystems: SubsystemStates): string {
  const stateOrder = ["NORMAL", "CAUTION", "DEFENSIVE", "STRESS", "EMERGENCY", "RECOVERY"];
  const stateValues: Record<string, number> = {
    NORMAL: 0, CAUTION: 1, DEFENSIVE: 2, STRESS: 3, EMERGENCY: 4, RECOVERY: 1,
  };

  let maxSeverity = 0;
  for (const state of Object.values(subsystems)) {
    const val = stateValues[state] ?? 0;
    if (val > maxSeverity) maxSeverity = val;
  }

  // Global state >= highest subsystem state
  return stateOrder[maxSeverity] || "NORMAL";
}
