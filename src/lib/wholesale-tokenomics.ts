// v25.0 Prompt 5/8 — Wholesale MTQ Tokenomics, Bank Economics, Monetary Supply Model
// =================================================================
// Rebuilds MTQ tokenomics around wholesale settlement utility.
//
// PROHIBITED (do NOT copy crypto tokenomics patterns):
//   - staking, farming, inflationary rewards, liquidity mining
//   - speculative yield, price appreciation mechanisms
//   - artificial velocity incentives, token-holder monetary governance
//
// Implements:
//   Task 1: MTQ Supply Model (elastic to demand, constrained by reserve)
//   Task 2: MTQ Value Role (settlement, reserve, redemption — NOT speculation)
//   Task 3: Bank Economics (8 configurable revenue streams)
//   Task 4: MITHQAL Revenue (5 infrastructure fee streams)
//   Task 5: Fee Separation (fees NEVER influence issuance)
//   Task 6: Velocity Model (measure, don't impose minimum)
//   Task 7: Settlement Inventory vs Hoarding (5 tiers)
//   Task 8: Economic Stress Model (8 scenarios)
// =================================================================

// ---- Task 1: MTQ Supply Model ----

export interface MTQSupplyModel {
  // Supply is ELASTIC to legitimate settlement demand
  // AND FULLY CONSTRAINED by verified reserve backing
  expansionMechanism: "verified institutional issuance only";
  contractionMechanism: "redemption / burn";
  elasticityRule: "Supply expands when (a) institutional demand exists AND (b) verified reserve backing exists AND (c) all constitutional checks pass";
  constraintRule: "Supply CANNOT expand without verified reserve backing (PAR=$1.00, RR≥100%)";
  formula: "S_max = R_a / (RR_target × PAR) — supply ceiling determined by reserves";
  prohibited: [
    "discretionary minting",
    "inflationary rewards",
    "staking yield",
    "liquidity mining",
    "speculative issuance",
  ];
}

export const SUPPLY_MODEL: MTQSupplyModel = {
  expansionMechanism: "verified institutional issuance only",
  contractionMechanism: "redemption / burn",
  elasticityRule: "Supply expands when (a) institutional demand exists AND (b) verified reserve backing exists AND (c) all constitutional checks pass",
  constraintRule: "Supply CANNOT expand without verified reserve backing (PAR=$1.00, RR≥100%)",
  formula: "S_max = R_a / (RR_target × PAR) — supply ceiling determined by reserves",
  prohibited: [
    "discretionary minting",
    "inflationary rewards",
    "staking yield",
    "liquidity mining",
    "speculative issuance",
  ],
};

// ---- Task 2: MTQ Value Role ----

export const MTQ_VALUE_ROLE = {
  basedOn: [
    "settlement reference (PAR=$1.00)",
    "reserve architecture (fully backed, RR≥100%)",
    "redemption rights/claims as legally defined",
    "institutional settlement utility",
  ],
  NOTbasedOn: [
    "speculation",
    "token appreciation",
    "staking yield",
    "market making",
    "exchange listing premium",
  ],
  valueStatement: "MTQ value = PAR × reserve backing ratio. MTQ has no floating price. Its value derives from (1) verified reserve backing, (2) redemption rights, and (3) settlement utility — NOT from speculative demand.",
  noAppreciation: "MTQ does NOT appreciate. It is not an investment. It is a settlement instrument.",
  sustainabilityPrinciple: "MTQ is economically sustainable WITHOUT speculative token appreciation because its utility (settlement) creates demand for issuance, and its reserve backing ensures redemption confidence.",
} as const;

// ---- Task 3: Bank Economics (8 configurable revenue streams) ----

export interface BankRevenueStream {
  streamId: string;
  name: string;
  description: string;
  feeType: "FIXED" | "BPS" | "PERCENTAGE" | "VOLUME_TIERED";
  defaultValue: number;
  configurable: boolean;
  legalCondition: "Subject to local law and institutional agreement";
}

export const BANK_REVENUE_STREAMS: BankRevenueStream[] = [
  {
    streamId: "BR-01",
    name: "Origination Fee",
    description: "Fee for originating MTQ issuance request on behalf of corporate customer",
    feeType: "BPS",
    defaultValue: 5, // 5 bps on issuance amount
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-02",
    name: "Settlement Fee",
    description: "Fee for executing MTQ settlement between institutions",
    feeType: "BPS",
    defaultValue: 3, // 3 bps on settlement amount
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-03",
    name: "Redemption Fee",
    description: "Fee for processing MTQ redemption to local currency",
    feeType: "BPS",
    defaultValue: 5, // 5 bps on redemption amount
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-04",
    name: "FX Service Fee",
    description: "Fee for currency conversion services (JPY→MTQ→USD etc.)",
    feeType: "BPS",
    defaultValue: 8, // 8 bps on FX amount
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-05",
    name: "Treasury Service Fee",
    description: "Fee for treasury/liquidity management services",
    feeType: "FIXED",
    defaultValue: 10_000, // $10K/month flat
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-06",
    name: "Corporate MTQ Settlement Account Fee",
    description: "Monthly fee for maintaining corporate MTQ settlement account",
    feeType: "FIXED",
    defaultValue: 2_500, // $2.5K/month per corporate account
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-07",
    name: "API/Connectivity Fee",
    description: "Fee for API access and connectivity to MITHQAL infrastructure",
    feeType: "FIXED",
    defaultValue: 5_000, // $5K/month
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
  {
    streamId: "BR-08",
    name: "Liquidity Service Fee",
    description: "Fee for providing settlement liquidity to corridors",
    feeType: "BPS",
    defaultValue: 2, // 2 bps on liquidity provided
    configurable: true,
    legalCondition: "Subject to local law and institutional agreement",
  },
];

// ---- Task 4: MITHQAL Revenue (5 infrastructure fee streams) ----

export interface MithqalRevenueStream {
  streamId: string;
  name: string;
  description: string;
  feeType: "BPS" | "FIXED" | "PERCENTAGE";
  defaultValue: number;
}

export const MITHQAL_REVENUE_STREAMS: MithqalRevenueStream[] = [
  {
    streamId: "MR-01",
    name: "Issuance Infrastructure Fee",
    description: "Fee for using MITHQAL issuance infrastructure (per issuance event)",
    feeType: "BPS",
    defaultValue: 1, // 1 bp on issuance amount
  },
  {
    streamId: "MR-02",
    name: "Settlement Infrastructure Fee",
    description: "Fee for using MITHQAL settlement network (per settlement event)",
    feeType: "BPS",
    defaultValue: 1, // 1 bp on settlement amount
  },
  {
    streamId: "MR-03",
    name: "Redemption Infrastructure Fee",
    description: "Fee for using MITHQAL redemption infrastructure (per redemption event)",
    feeType: "BPS",
    defaultValue: 1, // 1 bp on redemption amount
  },
  {
    streamId: "MR-04",
    name: "Institutional Connectivity Fee",
    description: "Monthly fee for institutional connectivity (per institution)",
    feeType: "FIXED",
    defaultValue: 10_000, // $10K/month per institution
  },
  {
    streamId: "MR-05",
    name: "Enterprise Infrastructure Fee",
    description: "Fee for enterprise infrastructure (proof systems, audit, compliance)",
    feeType: "FIXED",
    defaultValue: 50_000, // $50K/month
  },
];

// ---- Task 5: Fee Separation ----

export const FEE_SEPARATION = {
  principle: "Fees must NEVER influence issuance eligibility.",
  issuanceSequence: [
    "1. Legal eligibility check",
    "2. Institutional authorization",
    "3. Funding verification",
    "4. Reserve backing verification",
    "5. Risk checks (RR, StressRR, MLCR, SDR)",
    "6. Constitutional checks",
    "7. Deterministic issuance authorization",
    "8. Mint execution",
    "9. Fee accounting (AFTER valid execution)",
  ],
  revenueSequence: "Fee accounting happens AFTER/alongside valid execution. NEVER: fee paid → MTQ issued.",
  separationRule: "The issuance pipeline (steps 1-8) is INDEPENDENT of the fee model (step 9). Fees are accounting, not gating.",
  auditTrail: "All fees recorded post-execution. Fee amounts do not appear in issuance decision logic.",
} as const;

// ---- Task 6: Velocity Model ----

export interface VelocityMetrics {
  mtqTurnover: number;           // Settled Trade Value / Average Outstanding MTQ
  averageHoldingTime: number;     // days
  legitimateSettlementInventory: number;
  inactiveBalancePct: number;     // % of supply inactive >30 days
  speculativeBehavior: boolean;   // flagged if abnormal
  abnormalMovement: boolean;
  velocityState: "NORMAL" | "WATCH" | "ELEVATED" | "LOW_ACTIVITY";
  note: string;
}

export function computeVelocity(input: {
  settledTradeValue: number;
  averageOutstandingMtq: number;
  periodDays: number;
  inactiveBalancePct: number;
  abnormalMovementDetected: boolean;
}): VelocityMetrics {
  const mtqTurnover = input.settledTradeValue / Math.max(1, input.averageOutstandingMtq);
  const averageHoldingTime = input.averageOutstandingMtq > 0
    ? (input.averageOutstandingMtq * input.periodDays) / Math.max(1, input.settledTradeValue)
    : 0;

  // Do NOT impose minimum velocity
  // Only flag for monitoring
  let velocityState: VelocityMetrics["velocityState"] = "NORMAL";
  if (input.inactiveBalancePct > 0.40) velocityState = "LOW_ACTIVITY";
  else if (mtqTurnover < 0.5) velocityState = "WATCH";
  else if (mtqTurnover > 10) velocityState = "ELEVATED";

  const speculativeBehavior = input.abnormalMovementDetected && mtqTurnover > 20;
  const note = speculativeBehavior
    ? "Abnormal movement detected — flagged for investigation (NOT penalty)"
    : velocityState === "LOW_ACTIVITY"
    ? "Low activity — monitor for sustainability (NOT penalty). Settlement inventory may be legitimate."
    : "Normal velocity. No action.";

  return {
    mtqTurnover: Math.round(mtqTurnover * 100) / 100,
    averageHoldingTime: Math.round(averageHoldingTime * 10) / 10,
    legitimateSettlementInventory: input.averageOutstandingMtq * 0.3, // ~30% held for settlement
    inactiveBalancePct: input.inactiveBalancePct,
    speculativeBehavior,
    abnormalMovement: input.abnormalMovementDetected,
    velocityState,
    note,
  };
}

// ---- Task 7: Settlement Inventory vs Hoarding ----

export type InventoryClassification =
  | "NORMAL_INVENTORY"
  | "OPERATIONAL_BUFFER"
  | "STRESS_BUFFER"
  | "EXCESS_INVENTORY"
  | "SUSPICIOUS_INVENTORY";

export interface InventoryClassificationResult {
  classification: InventoryClassification;
  amount: number;
  action: string;
  escalationTriggered: boolean;
}

export function classifyInventory(input: {
  expectedSettlementRequirement: number;
  actualHoldings: number;
  holdingDurationDays: number;
  settlementActivityRatio: number; // actual settlements / holdings
}): InventoryClassificationResult {
  const normal = input.expectedSettlementRequirement;
  const operational = normal * 1.2;
  const stress = normal * 1.5;

  if (input.actualHoldings <= normal) {
    return { classification: "NORMAL_INVENTORY", amount: input.actualHoldings, action: "No action", escalationTriggered: false };
  }
  if (input.actualHoldings <= operational) {
    return { classification: "OPERATIONAL_BUFFER", amount: input.actualHoldings, action: "Normal — operational buffer", escalationTriggered: false };
  }
  if (input.actualHoldings <= stress) {
    return { classification: "STRESS_BUFFER", amount: input.actualHoldings, action: "Stress buffer — legitimate treasury management", escalationTriggered: false };
  }

  // Above stress buffer
  if (input.holdingDurationDays > 90 && input.settlementActivityRatio < 0.05) {
    return {
      classification: "SUSPICIOUS_INVENTORY",
      amount: input.actualHoldings,
      action: "Risk escalation — review with institution: (1) purpose, (2) expected utilization, (3) potential velocity risk. NOT automatic penalty.",
      escalationTriggered: true,
    };
  }

  return {
    classification: "EXCESS_INVENTORY",
    amount: input.actualHoldings,
    action: "Excess — flagged for MONITORING (NOT penalty). Review inventory necessity with institution.",
    escalationTriggered: false,
  };
}

export const INVENTORY_PRINCIPLE = "Do NOT label legitimate treasury inventory as hoarding. Only suspicious/excess behavior triggers risk escalation. No automatic penalty." as const;

// ---- Task 8: Economic Stress Model ----

export interface EconomicStressScenario {
  scenario: string;
  description: string;
  impactOnRevenue: number;  // % change
  impactOnVelocity: number;  // % change
  impactOnSupply: number;    // % change in supply growth
  sustainability: "SUSTAINABLE" | "MARGINAL" | "UNSUSTAINABLE";
  mitigation: string;
  recoveryPath: string;
}

export const ECONOMIC_STRESS_SCENARIOS: EconomicStressScenario[] = [
  {
    scenario: "Fee Compression",
    description: "Competitive pressure reduces fees by 50%",
    impactOnRevenue: -0.50,
    impactOnVelocity: 0.10,
    impactOnSupply: 0.05,
    sustainability: "MARGINAL",
    mitigation: "Reduce operational costs; diversify revenue (enterprise infrastructure); volume growth compensates",
    recoveryPath: "Volume growth restores revenue; fee floor prevents race-to-zero",
  },
  {
    scenario: "Low Velocity",
    description: "Institutions hold MTQ longer (settlement inventory builds)",
    impactOnRevenue: -0.20,
    impactOnVelocity: -0.50,
    impactOnSupply: -0.10,
    sustainability: "SUSTAINABLE",
    mitigation: "Settlement inventory management (monitor, don't penalize); volume growth offsets lower velocity",
    recoveryPath: "As settlement volume grows, velocity naturally increases; inventory is legitimate treasury",
  },
  {
    scenario: "High Settlement Demand",
    description: "Large increase in cross-border settlement volume (+200%)",
    impactOnRevenue: 1.50,
    impactOnVelocity: 1.00,
    impactOnSupply: 0.50,
    sustainability: "SUSTAINABLE",
    mitigation: "Scale infrastructure; ensure reserve capacity; manage ILPS dynamically",
    recoveryPath: "Sustained high volume — most favorable scenario; revenue and utility both increase",
  },
  {
    scenario: "High Redemption Demand",
    description: "Redemption demand spikes to 20% of supply in 7 days",
    impactOnRevenue: 0.30, // redemption fees increase
    impactOnVelocity: 0.50,
    impactOnSupply: -0.20, // supply contracts via burn
    sustainability: "MARGINAL",
    mitigation: "Redemption queue activated; ILPS Layer 3 engaged; Article X prepared; communicate with institutions",
    recoveryPath: "Redemption wave subsides; supply stabilizes; confidence maintained by transparent response",
  },
  {
    scenario: "Low Bank Adoption",
    description: "Only 2 banks participate (vs target 10+)",
    impactOnRevenue: -0.70,
    impactOnVelocity: -0.30,
    impactOnSupply: -0.40,
    sustainability: "MARGINAL",
    mitigation: "Reduce fixed costs; focus on high-value corridors; pilot expansion; demonstrate ROI",
    recoveryPath: "Pilot results attract more banks; network effects; gradual adoption growth",
  },
  {
    scenario: "Bank Concentration",
    description: "Top 2 banks hold 50% of MTQ positions",
    impactOnRevenue: 0.10,
    impactOnVelocity: -0.10,
    impactOnSupply: 0,
    sustainability: "MARGINAL",
    mitigation: "Enforce bank concentration limits; diversify institution onboarding; cap SIB exposure",
    recoveryPath: "Diversification reduces concentration risk; more banks = more resilient network",
  },
  {
    scenario: "Corridor Imbalance",
    description: "One corridor (US-EU) handles 80% of flow",
    impactOnRevenue: 0.20,
    impactOnVelocity: 0.10,
    impactOnSupply: 0.10,
    sustainability: "MARGINAL",
    mitigation: "Develop additional corridors; balance flow through incentive structure; monitor corridor liquidity",
    recoveryPath: "Multi-corridor diversification; geographic expansion; network resilience",
  },
  {
    scenario: "Reserve Asset Drawdown",
    description: "Gold price drops 30%; fiat weakens 10%",
    impactOnRevenue: 0,
    impactOnVelocity: -0.20,
    impactOnSupply: -0.15,
    sustainability: "MARGINAL",
    mitigation: "CALM activates STRESS state; issuance halts; ILPS engaged; hold gold (don't liquidate at loss)",
    recoveryPath: "Asset prices recover; reserve rebuilds; CALM returns to NORMAL; issuance resumes",
  },
];

// ---- Sustainability Assessment ----

export interface SustainabilityAssessment {
  sustainableWithoutSpeculation: boolean;
  keyFactors: string[];
  risks: string[];
  recommendation: string;
}

export function assessSustainability(): SustainabilityAssessment {
  return {
    sustainableWithoutSpeculation: true,
    keyFactors: [
      "MTQ has no floating price — no speculation needed for value",
      "Settlement demand creates organic issuance demand (institutions need MTQ to settle)",
      "Reserve backing ensures redemption confidence (not speculation)",
      "Bank revenue model (8 streams) incentivizes participation without token speculation",
      "MITHQAL revenue (5 streams) covers infrastructure costs from operational fees",
      "Supply is elastic to demand but constrained by reserves — no inflationary pressure",
      "Velocity is measured (not imposed) — settlement inventory is legitimate, not penalized",
    ],
    risks: [
      "Low bank adoption would reduce volume and revenue (MARGINAL sustainability)",
      "Fee compression could erode MITHQAL infrastructure revenue",
      "High redemption demand creates supply contraction (but system handles via queue/ILPS)",
      "Corridor imbalance creates concentration risk (but managed by corridor engine)",
    ],
    recommendation: "MTQ is economically sustainable without speculative token appreciation. The model is wholesale-B2B-settlement-driven, not retail-speculation-driven. Sustainability depends on (1) bank adoption growth, (2) sufficient settlement volume, (3) fee discipline, and (4) reserve integrity. No staking, no farming, no yield — just settlement utility.",
  };
}
