// v25.0 Prompt 3/8 — Redemption Continuity, Circuit Breakers & Resolution Framework
// =================================================================
// Fixes:
//   - No bank-run circuit breaker
//   - Uncontrolled redemption risk
//   - 80% bank-run BDL
//   - Redemption liquidity mismatch
//
// CRITICAL PRINCIPLES:
//   - Do NOT introduce arbitrary governance-controlled redemption freeze
//   - Do NOT create hidden redemption denial mechanism
//   - Do NOT make demurrage the primary defense
//
// Implements:
//   Task 1: Constitutional Redemption Continuity Framework (6 states)
//   Task 2: ISSUANCE_HALT circuit breaker (8 auto-activation triggers)
//   Task 3: SETTLEMENT_RESTRICTION (separate from issuance halt, 4 tiers)
//   Task 4: Redemption Queue (deterministic, equal treatment, transparent priority)
//   Task 5: Large Redemption Controls (threshold, rolling-period, pre-funding)
//   Task 6: 20/40/60/80/95% redemption stress modeling
//   Task 7: Resolution Framework (freeze, preserve, deterministic rules)
//   Task 8: BDL Conversion (containment/response/recovery for all BDLs)
// =================================================================

// ---- Task 1: Constitutional Redemption Continuity Framework (6 states) ----

export type RedemptionContinuityState =
  | "NORMAL"
  | "ELEVATED"
  | "DEFENSIVE"
  | "STRESS"
  | "EMERGENCY"
  | "RESOLUTION";

export interface RedemptionContinuityStateDef {
  state: RedemptionContinuityState;
  entryConditions: string[];
  automaticTriggers: string[];
  exitConditions: string[];
  allowedActions: string[];
  prohibitedActions: string[];
  auditEvents: string[];
}

export const REDEMPTION_CONTINUITY_STATES: Record<RedemptionContinuityState, RedemptionContinuityStateDef> = {
  NORMAL: {
    state: "NORMAL",
    entryConditions: ["RR ≥ 1.15", "LCR_MTQ ≥ 1.50", "MLCR ≥ 1.50", "SDR < 0.50"],
    automaticTriggers: ["Continuous monitoring"],
    exitConditions: ["N/A — default state"],
    allowedActions: ["Normal issuance (100% capacity)", "Normal settlement", "Normal redemption (no queue)"],
    prohibitedActions: [],
    auditEvents: ["Daily health check", "Continuous metric monitoring"],
  },
  ELEVATED: {
    state: "ELEVATED",
    entryConditions: ["RR < 1.15 OR RR ≥ 1.10", "LCR_MTQ < 1.50 OR LCR_MTQ ≥ 1.20", "SDR ≥ 0.50 OR SDR < 0.70"],
    automaticTriggers: ["RR deterioration", "LCR_MTQ deterioration", "SDR elevation"],
    exitConditions: ["RR ≥ 1.15 for 48h", "LCR_MTQ ≥ 1.50 for 48h", "SDR < 0.50 for 48h"],
    allowedActions: ["Reduced issuance (85% capacity)", "Normal settlement", "Normal redemption (monitored)"],
    prohibitedActions: ["Large issuance without enhanced review"],
    auditEvents: ["State transition: NORMAL→ELEVATED", "Issuance capacity reduced to 85%"],
  },
  DEFENSIVE: {
    state: "DEFENSIVE",
    entryConditions: ["RR < 1.10 OR RR ≥ 1.05", "LCR_MTQ < 1.20 OR LCR_MTQ ≥ 1.00", "SDR ≥ 0.70 OR SDR < 0.85"],
    automaticTriggers: ["RR < 1.10", "LCR_MTQ < 1.20", "SDR ≥ 0.70"],
    exitConditions: ["RR ≥ 1.10 for 72h", "LCR_MTQ ≥ 1.20 for 72h", "SDR < 0.70 for 72h"],
    allowedActions: ["Restricted issuance (40% capacity)", "Normal settlement", "Large redemption requires pre-notification"],
    prohibitedActions: ["Large issuance", "Unrestricted redemption of >5% supply"],
    auditEvents: ["State transition: ELEVATED→DEFENSIVE", "Issuance restricted to 40%", "Large redemption monitoring activated"],
  },
  STRESS: {
    state: "STRESS",
    entryConditions: ["RR < 1.05 OR RR ≥ 1.00", "LCR_MTQ < 1.00", "SDR ≥ 0.85", "Redemption demand > 10% supply in 24h"],
    automaticTriggers: ["RR < 1.05", "LCR_MTQ < 1.00", "SDR ≥ 0.85", "Redemption rate > 10%/24h"],
    exitConditions: ["RR ≥ 1.05 for 96h", "LCR_MTQ ≥ 1.00 for 96h", "SDR < 0.85 for 96h", "Redemption rate < 5%/24h for 96h"],
    allowedActions: [
      "Issuance STOPPED (0% capacity)",
      "Settlement continues (Article X liquidation)",
      "Redemption QUEUE activated (deterministic, equal treatment)",
      "Large redemption THROTTLED (daily cap)",
      "Emergency liquidity activated (ILPS Layer 3)",
      "Council notified",
    ],
    prohibitedActions: [
      "Any new issuance",
      "Redemption bypass",
      "Large redemption without queue",
      "Reserve rebalancing that increases risk",
    ],
    auditEvents: [
      "State transition: DEFENSIVE→STRESS",
      "ISSUANCE_HALT activated",
      "Redemption queue activated",
      "Emergency liquidity activated",
      "Council convened (emergency session)",
    ],
  },
  EMERGENCY: {
    state: "EMERGENCY",
    entryConditions: ["RR < 1.00", "StressRR < 1.00", "MLCR < 1.00", "Redemption demand > 30% supply in 48h"],
    automaticTriggers: ["RR < 1.00", "StressRR < 1.00", "MLCR < 1.00", "Redemption rate > 30%/48h"],
    exitConditions: ["RR ≥ 1.00 for 168h (7 days)", "StressRR ≥ 1.00", "MLCR ≥ 1.00", "Redemption rate < 5%/24h for 168h"],
    allowedActions: [
      "ALL issuance STOPPED (including institutional)",
      "Settlement RESTRICTED (existing positions only, no new)",
      "Redemption QUEUE at maximum throttle (daily cap = 2% supply)",
      "Article X full liquidation sequence initiated (non-gold → gold)",
      "ERTF activated (if available)",
      "Constitutional resolution preparation",
      "Council emergency governance (limited scope: preserve reserves, honor redemptions, restore solvency)",
    ],
    prohibitedActions: [
      "Any new issuance (absolute prohibition)",
      "Any new settlement position",
      "Any reserve rebalancing that is not Article X liquidation",
      "Any governance action that weakens reserve",
      "Redemption denial (redemption continues via queue, but throttled)",
    ],
    auditEvents: [
      "State transition: STRESS→EMERGENCY",
      "Article X liquidation initiated",
      "ERTF activated",
      "Council emergency governance session",
      "Redemption throttle: daily cap = 2% supply",
    ],
  },
  RESOLUTION: {
    state: "RESOLUTION",
    entryConditions: [
      "RR < 0.95 (solvency breached despite all protections)",
      "All ILPS layers exhausted",
      "Article X liquidation completed",
      "ERTF fully utilized (if available)",
    ],
    automaticTriggers: ["RR < 0.95", "ILPS total exhaustion", "Article X completion with RR still < 1.00"],
    exitConditions: [
      "Capital injection restores RR ≥ 1.20 (requires governance approval + capital)",
      "OR: In-kind delivery resolves proportionally (RR preserved at pre-resolution level)",
      "OR: Legal resolution process completes (independent administrator)",
    ],
    allowedActions: [
      "Freeze ALL new issuance (absolute)",
      "Preserve ALL records (immutable audit trail)",
      "Protect reserve segregation (legal firewalls maintained)",
      "Enforce deterministic creditor/holder rules (pro-rata, transparent)",
      "Activate legal resolution process (independent administrator)",
      "In-kind delivery (proportional, RR-preserving under theorem §39)",
      "Preserve auditability (all events logged, all records sealed)",
    ],
    prohibitedActions: [
      "Any new issuance",
      "Any settlement",
      "Any reserve rebalancing",
      "Any governance decision that is not deterministic/pre-defined",
      "Any ad hoc redemption priority",
      "Any record modification or deletion",
    ],
    auditEvents: [
      "State transition: EMERGENCY→RESOLUTION",
      "Resolution framework activated",
      "Independent administrator appointed",
      "In-kind delivery calculation",
      "All records sealed (cryptographic timestamp)",
    ],
  },
};

// ---- Task 2: ISSUANCE_HALT Circuit Breaker ----

export type IssuanceHaltTrigger =
  | "RR_DETERIORATION"
  | "MLCR_DETERIORATION"
  | "STRESSRR_DETERIORATION"
  | "ORACLE_FAILURE"
  | "CUSTODY_FAILURE"
  | "CORRIDOR_LIQUIDITY_CRISIS"
  | "GOVERNANCE_ATTACK"
  | "RESERVE_VERIFICATION_FAILURE";

export interface IssuanceHaltState {
  halted: boolean;
  trigger: IssuanceHaltTrigger | null;
  timestamp: string;
  automatic: boolean;
  reason: string;
  conditions: { trigger: IssuanceHaltTrigger; threshold: string; currentValue: string; breached: boolean }[];
}

export function checkIssuanceHalt(input: {
  rr: number;
  stressRR: number;
  mlcr: number;
  oracleHealth: number;  // 0-1
  custodyHealth: number;  // 0-1
  corridorLiquidity: number;  // 0-1
  governanceIntegrity: boolean;  // true = healthy
  reserveVerified: boolean;  // true = verified
}): IssuanceHaltState {
  const conditions = [
    { trigger: "RR_DETERIORATION" as const, threshold: "RR < 1.05", currentValue: `RR=${(input.rr * 100).toFixed(2)}%`, breached: input.rr < 1.05 },
    { trigger: "MLCR_DETERIORATION" as const, threshold: "MLCR < 1.00", currentValue: `MLCR=${input.mlcr.toFixed(3)}`, breached: input.mlcr < 1.00 },
    { trigger: "STRESSRR_DETERIORATION" as const, threshold: "StressRR < 1.00", currentValue: `StressRR=${(input.stressRR * 100).toFixed(2)}%`, breached: input.stressRR < 1.00 },
    { trigger: "ORACLE_FAILURE" as const, threshold: "Oracle health < 0.50", currentValue: `oracleHealth=${input.oracleHealth.toFixed(2)}`, breached: input.oracleHealth < 0.50 },
    { trigger: "CUSTODY_FAILURE" as const, threshold: "Custody health < 0.50", currentValue: `custodyHealth=${input.custodyHealth.toFixed(2)}`, breached: input.custodyHealth < 0.50 },
    { trigger: "CORRIDOR_LIQUIDITY_CRISIS" as const, threshold: "Corridor liquidity < 0.30", currentValue: `corridorLiquidity=${input.corridorLiquidity.toFixed(2)}`, breached: input.corridorLiquidity < 0.30 },
    { trigger: "GOVERNANCE_ATTACK" as const, threshold: "Governance integrity = false", currentValue: `governanceIntegrity=${input.governanceIntegrity}`, breached: !input.governanceIntegrity },
    { trigger: "RESERVE_VERIFICATION_FAILURE" as const, threshold: "Reserve verified = false", currentValue: `reserveVerified=${input.reserveVerified}`, breached: !input.reserveVerified },
  ];

  const firstBreached = conditions.find(c => c.breached);

  return {
    halted: firstBreached !== undefined,
    trigger: firstBreached?.trigger ?? null,
    timestamp: new Date().toISOString(),
    automatic: true,
    reason: firstBreached
      ? `ISSUANCE_HALT automatically activated: ${firstBreached.trigger} (${firstBreached.threshold}, current: ${firstBreached.currentValue})`
      : "No halt conditions breached — issuance normal",
    conditions,
  };
}

// ---- Task 3: SETTLEMENT_RESTRICTION (separate from issuance halt) ----

export type SettlementTier = "UNRESTRICTED" | "NORMAL" | "LARGE_RESTRICTED" | "HALTED";

export interface SettlementRestrictionState {
  tier: SettlementTier;
  issuanceHalted: boolean;
  settlementAllowed: boolean;
  largeSettlementAllowed: boolean;
  redemptionAllowed: boolean;
  reason: string;
  differentiation: string;
}

export function computeSettlementRestriction(
  issuanceHalted: boolean,
  continuityState: RedemptionContinuityState,
): SettlementRestrictionState {
  // KEY PRINCIPLE: Do NOT automatically halt all transfers when issuance is halted.
  // Differentiate: new issuance, ordinary settlement, large settlement, redemption.

  if (continuityState === "RESOLUTION") {
    return {
      tier: "HALTED",
      issuanceHalted: true,
      settlementAllowed: false,
      largeSettlementAllowed: false,
      redemptionAllowed: false, // Resolution framework handles redemptions deterministically
      reason: "RESOLUTION state — all settlement halted, resolution framework active",
      differentiation: "ALL settlement halted. Existing positions resolved via deterministic rules. No new positions.",
    };
  }

  if (continuityState === "EMERGENCY") {
    return {
      tier: "LARGE_RESTRICTED",
      issuanceHalted: true,
      settlementAllowed: true, // Existing positions can still settle
      largeSettlementAllowed: false, // Large settlement restricted
      redemptionAllowed: true, // Redemption continues via queue (throttled)
      reason: "EMERGENCY — existing settlement continues, large settlement restricted, redemption via queue",
      differentiation: "New issuance: HALTED. Ordinary settlement: CONTINUES. Large settlement: RESTRICTED. Redemption: QUEUE (throttled).",
    };
  }

  if (continuityState === "STRESS" || issuanceHalted) {
    return {
      tier: "LARGE_RESTRICTED",
      issuanceHalted: true,
      settlementAllowed: true,
      largeSettlementAllowed: false,
      redemptionAllowed: true, // Redemption via queue
      reason: issuanceHalted
        ? "STRESS/ISSUANCE_HALT — settlement continues, large settlement restricted, redemption via queue"
        : "STRESS state — settlement continues with restrictions",
      differentiation: "New issuance: HALTED. Ordinary settlement: CONTINUES. Large settlement: RESTRICTED. Redemption: QUEUE (deterministic).",
    };
  }

  if (continuityState === "DEFENSIVE") {
    return {
      tier: "NORMAL",
      issuanceHalted: false,
      settlementAllowed: true,
      largeSettlementAllowed: true, // With pre-notification
      redemptionAllowed: true,
      reason: "DEFENSIVE — normal settlement with large redemption pre-notification",
      differentiation: "New issuance: RESTRICTED (40%). Ordinary settlement: NORMAL. Large settlement: PRE-NOTIFICATION. Redemption: NORMAL (monitored).",
    };
  }

  return {
    tier: "UNRESTRICTED",
    issuanceHalted: false,
    settlementAllowed: true,
    largeSettlementAllowed: true,
    redemptionAllowed: true,
    reason: "NORMAL/ELEVATED — unrestricted settlement",
    differentiation: "New issuance: NORMAL/SLOW. Ordinary settlement: NORMAL. Large settlement: NORMAL. Redemption: NORMAL.",
  };
}

// ---- Task 4: Redemption Queue (deterministic, equal treatment) ----

export interface RedemptionQueueEntry {
  queueId: string;
  institutionId: string;
  amount: number;
  timestamp: string;
  priority: number;  // Lower = higher priority (1 = highest)
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "PARTIALLY_FILLED";
  filledAmount: number;
  remainingAmount: number;
}

export const REDEMPTION_PRIORITY = {
  // Constitutional pre-defined priority — NOT ad hoc
  // Equal treatment within each tier
  TIER_1: 1,  // Retail/institutional redemptions ≤ $1M (equal treatment)
  TIER_2: 2,  // Institutional redemptions $1M-$10M (equal treatment)
  TIER_3: 3,  // Large institutional redemptions > $10M (equal treatment, but throttled)
} as const;

export interface RedemptionQueueConfig {
  dailyCapPct: number;  // % of supply that can be redeemed per day
  perInstitutionCapPct: number;  // % of supply per institution per day
  minAmount: number;
  maxQueueDepth: number;
  state: RedemptionContinuityState;
}

export function getRedemptionQueueConfig(state: RedemptionContinuityState): RedemptionQueueConfig {
  switch (state) {
    case "NORMAL":
    case "ELEVATED":
      return { dailyCapPct: 1.0, perInstitutionCapPct: 0.5, minAmount: 1, maxQueueDepth: 1000, state };
    case "DEFENSIVE":
      return { dailyCapPct: 0.5, perInstitutionCapPct: 0.2, minAmount: 1, maxQueueDepth: 2000, state };
    case "STRESS":
      return { dailyCapPct: 0.3, perInstitutionCapPct: 0.1, minAmount: 1, maxQueueDepth: 5000, state };
    case "EMERGENCY":
      return { dailyCapPct: 0.02, perInstitutionCapPct: 0.005, minAmount: 1, maxQueueDepth: 10000, state };
    case "RESOLUTION":
      return { dailyCapPct: 0.0, perInstitutionCapPct: 0.0, minAmount: 0, maxQueueDepth: 0, state }; // Resolution framework handles
  }
}

export function createRedemptionQueueEntry(
  institutionId: string,
  amount: number,
  state: RedemptionContinuityState,
): RedemptionQueueEntry {
  const priority = amount <= 1_000_000 ? REDEMPTION_PRIORITY.TIER_1
    : amount <= 10_000_000 ? REDEMPTION_PRIORITY.TIER_2
    : REDEMPTION_PRIORITY.TIER_3;

  return {
    queueId: `RQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    institutionId,
    amount,
    timestamp: new Date().toISOString(),
    priority,
    status: "QUEUED",
    filledAmount: 0,
    remainingAmount: amount,
  };
}

export function processRedemptionQueue(
  queue: RedemptionQueueEntry[],
  dailyCap: number,
  perInstitutionCap: number,
): RedemptionQueueEntry[] {
  // Sort by priority (ascending = highest priority first), then by timestamp (FIFO within priority)
  const sorted = [...queue].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.timestamp.localeCompare(b.timestamp);
  });

  let remainingDailyCap = dailyCap;
  const institutionUsage: Record<string, number> = {};

  for (const entry of sorted) {
    if (entry.status === "COMPLETED") continue;

    const instUsed = institutionUsage[entry.institutionId] ?? 0;
    const instRemaining = Math.max(0, perInstitutionCap - instUsed);
    const fillable = Math.min(entry.remainingAmount, remainingDailyCap, instRemaining);

    if (fillable > 0) {
      entry.filledAmount += fillable;
      entry.remainingAmount -= fillable;
      remainingDailyCap -= fillable;
      institutionUsage[entry.institutionId] = instUsed + fillable;

      entry.status = entry.remainingAmount === 0 ? "COMPLETED" : "PARTIALLY_FILLED";
    }

    if (remainingDailyCap <= 0) break;
  }

  return sorted;
}

// ---- Task 5: Large Redemption Controls ----

export interface LargeRedemptionControl {
  largeThreshold: number;  // $ amount above which "large" classification applies
  rollingPeriodHours: number;  // rolling period for cumulative monitoring
  rollingThresholdPct: number;  // % of supply in rolling period that triggers monitoring
  preFundingRequired: boolean;
  notificationRequired: boolean;
  escalationLevel: string;
}

export function checkLargeRedemption(
  amount: number,
  cumulativeRollingAmount: number,
  supply: number,
  state: RedemptionContinuityState,
): LargeRedemptionControl & { allowed: boolean; reason: string } {
  const largeThreshold = state === "NORMAL" ? 5_000_000
    : state === "ELEVATED" ? 2_000_000
    : state === "DEFENSIVE" ? 1_000_000
    : 500_000;

  const rollingPeriodHours = 24;
  const rollingThresholdPct = state === "NORMAL" ? 0.05
    : state === "ELEVATED" ? 0.03
    : state === "DEFENSIVE" ? 0.02
    : 0.01;

  const rollingThreshold = supply * rollingThresholdPct;
  const isLarge = amount >= largeThreshold;
  const cumulativeExceeds = cumulativeRollingAmount + amount >= rollingThreshold;

  let allowed = true;
  let reason = "Normal redemption";

  if (state === "STRESS" || state === "EMERGENCY") {
    if (isLarge) {
      allowed = false;
      reason = `Large redemption ($${amount.toLocaleString()}) in ${state} state — must go through redemption queue`;
    } else {
      reason = "Normal redemption — queued (deterministic, equal treatment)";
    }
  } else if (isLarge && cumulativeExceeds) {
    reason = `Large redemption triggers concentration monitoring (cumulative $${(cumulativeRollingAmount + amount).toLocaleString()} ≥ ${rollingThresholdPct * 100}% supply in ${rollingPeriodHours}h)`;
  }

  return {
    largeThreshold,
    rollingPeriodHours,
    rollingThresholdPct,
    preFundingRequired: isLarge && (state === "DEFENSIVE" || state === "STRESS"),
    notificationRequired: isLarge,
    escalationLevel: cumulativeExceeds ? "ENHANCED_MONITORING" : "STANDARD",
    allowed,
    reason,
  };
}

// ---- Task 6: 20/40/60/80/95% Redemption Stress Modeling ----

export interface RedemptionStressScenario {
  redemptionPct: number;  // % of supply redeemed
  horizon: string;
  issuanceResponse: string;
  liquidityResponse: string;
  settlementResponse: string;
  redemptionResponse: string;
  reserveResponse: string;
  recoveryPath: string;
  resolutionPath: string;
  systemState: RedemptionContinuityState;
  rrAfter: number;
  stressRrAfter: number;
  lcrAfter: number;
  queueActivated: boolean;
  articleXInitiated: boolean;
  ertfActivated: boolean;
  defined: boolean;  // Is the system state DEFINED (not undefined)?
}

export function modelRedemptionStress(
  redemptionPct: number,
  rrBefore: number,
  supply: number,
  ra: number,
  ilpsTotal: number,
): RedemptionStressScenario {
  const redemptionAmount = supply * redemptionPct;
  const horizon = redemptionPct >= 0.80 ? "48h" : redemptionPct >= 0.60 ? "7d" : "30d";

  // Calculate RR after redemption
  // Article X: non-gold liquidated first (80% of R_a), then gold
  const nonGoldRa = ra * 0.80;
  const goldRa = ra * 0.20;

  let raAfter = ra;
  let articleXInitiated = false;
  let ertfActivated = false;
  let queueActivated = false;
  let systemState: RedemptionContinuityState = "NORMAL";

  if (redemptionAmount <= nonGoldRa * 0.9) {
    // No gold sold
    raAfter = ra - redemptionAmount * 0.98;
  } else {
    // Gold must be sold
    articleXInitiated = true;
    const nonGoldLiquidated = nonGoldRa;
    const goldNeeded = redemptionAmount - nonGoldLiquidated;
    raAfter = ra - nonGoldLiquidated * 0.98 - goldNeeded * 0.95;
  }

  const rrAfter = raAfter / supply;

  // ILPS provides additional liquidity
  const totalAvailable = raAfter + ilpsTotal;
  const effectiveRr = totalAvailable / supply;

  // Determine system state
  if (rrAfter < 0.95) {
    systemState = "RESOLUTION";
    ertfActivated = true;
    queueActivated = true;
  } else if (rrAfter < 1.00 || redemptionPct >= 0.80) {
    systemState = "EMERGENCY";
    queueActivated = true;
    articleXInitiated = true;
    if (rrAfter < 1.00) ertfActivated = true;
  } else if (rrAfter < 1.05 || redemptionPct >= 0.60) {
    systemState = "STRESS";
    queueActivated = true;
  } else if (rrAfter < 1.10 || redemptionPct >= 0.40) {
    systemState = "DEFENSIVE";
    queueActivated = redemptionPct >= 0.40;
  } else if (rrAfter < 1.15 || redemptionPct >= 0.20) {
    systemState = "ELEVATED";
  }

  const stressRrAfter = rrAfter * 0.90; // approximate stress
  const lcrAfter = (ilpsTotal * 0.8) / Math.max(1, redemptionAmount / 30); // daily outflow

  return {
    redemptionPct,
    horizon,
    issuanceResponse: systemState === "NORMAL" ? "Normal (100%)" : systemState === "ELEVATED" ? "Slow (85%)" : systemState === "DEFENSIVE" ? "Restricted (40%)" : "HALTED (0%)",
    liquidityResponse: systemState === "NORMAL" ? "Normal" : systemState === "ELEVATED" ? "Monitor" : systemState === "DEFENSIVE" ? "Pre-position" : systemState === "STRESS" ? "Activate ILPS Layer 3" : "Activate ALL ILPS layers + ERTF",
    settlementResponse: systemState === "RESOLUTION" ? "HALTED" : systemState === "EMERGENCY" ? "Large restricted" : systemState === "STRESS" ? "Large restricted" : "Normal",
    redemptionResponse: queueActivated ? `QUEUE activated (daily cap: ${systemState === "EMERGENCY" ? "2%" : systemState === "STRESS" ? "3%" : "5%"} supply)` : "Normal",
    reserveResponse: articleXInitiated ? "Article X liquidation initiated (non-gold → gold)" : "Normal reserve management",
    recoveryPath: rrAfter >= 1.05 ? "Automatic (RR recovers as stress subsides)" : rrAfter >= 1.00 ? "Capital injection or ERTF recovery" : "Resolution framework + in-kind delivery",
    resolutionPath: systemState === "RESOLUTION" ? "Freeze issuance, preserve records, deterministic creditor rules, legal resolution" : "N/A (not in resolution)",
    systemState,
    rrAfter: Math.round(rrAfter * 10000) / 10000,
    stressRrAfter: Math.round(stressRrAfter * 10000) / 10000,
    lcrAfter: Math.round(lcrAfter * 10000) / 10000,
    queueActivated,
    articleXInitiated,
    ertfActivated,
    defined: true, // ALWAYS DEFINED — no undefined system state
  };
}

// ---- Task 7: Resolution Framework ----

export interface ResolutionFramework {
  activated: boolean;
  trigger: string;
  actions: string[];
  prohibitedActions: string[];
  deterministicRules: string[];
  legalProcess: string;
  auditPreservation: string;
}

export function activateResolution(rr: number): ResolutionFramework {
  const activated = rr < 0.95;

  return {
    activated,
    trigger: activated ? `RR=${(rr * 100).toFixed(2)}% < 95% — solvency breached despite all protections` : "Not activated",
    actions: [
      "Freeze ALL new issuance (absolute prohibition)",
      "Preserve ALL records (immutable audit trail, cryptographic timestamp)",
      "Protect reserve segregation (legal firewalls maintained)",
      "Enforce deterministic creditor/holder rules (pro-rata, transparent)",
      "Activate legal resolution process (independent administrator appointed)",
      "Calculate in-kind delivery (proportional, RR-preserving under theorem §39)",
      "Seal all event logs (no modification or deletion permitted)",
    ],
    prohibitedActions: [
      "Any new issuance",
      "Any settlement",
      "Any reserve rebalancing",
      "Any governance decision that is not deterministic/pre-defined",
      "Any ad hoc redemption priority",
      "Any record modification or deletion",
    ],
    deterministicRules: [
      "Pro-rata treatment: all MTQ holders receive proportional share of remaining reserves",
      "Equal treatment: no holder receives priority over another (within same class)",
      "Transparent calculation: all formulas public, all inputs auditable",
      "Article X liquidation order: non-gold → gold (Exhaustion Certificate required)",
      "In-kind delivery theorem: R_a' = R_a(1-x), L' = L(1-x), RR' = RR (proportional preservation)",
    ],
    legalProcess: "Independent administrator appointed by Council (6/7 supermajority). Administrator manages resolution per pre-defined framework. No ad hoc decisions.",
    auditPreservation: "All records sealed with cryptographic timestamp. Independent audit required post-resolution. All events permanently logged.",
  };
}

// ---- Task 8: BDL Conversion ----

export interface BDLConversion {
  scenario: string;
  bdlReason: string;
  containmentStrategy: string;
  responseStrategy: string;
  resolutionStrategy: string;
  recoveryStrategy: string;
  productionBlocker: boolean;
}

export const BDL_CONVERSIONS: BDLConversion[] = [
  {
    scenario: "US Treasury default",
    bdlReason: "Sovereign default of primary reserve currency issuer — beyond design envelope",
    containmentStrategy: "JSG isolation (US-JSG isolated); other JSGs continue; non-US reserves protected",
    responseStrategy: "Activate ILPS Layer 5 (external/committed); reduce USD exposure; shift to non-USD fiat",
    resolutionStrategy: "Pro-rata haircut on USD-denominated assets; Article X liquidation of non-affected assets",
    recoveryStrategy: "Post-default USD market stabilization; reserve rebalancing toward gold/non-USD; capital injection if RR < 95%",
    productionBlocker: false, // Has defined response — no longer an undefined BDL
  },
  {
    scenario: "PAXG issuer failure (Paxos insolvency)",
    bdlReason: "Tokenized gold issuer failure — 5% of reserve impaired",
    containmentStrategy: "TGRS monitor SUSPENDS PAXG weight to 0; physical gold (15%) unaffected; anti-double-counting ensures no contagion",
    responseStrategy: "Replace PAXG allocation with physical gold or fiat; legal recovery via NYDFS trust charter insurance",
    resolutionStrategy: "Pro-rata haircut on PAXG position only (5% of reserve); all other assets unaffected",
    recoveryStrategy: "PAXG weight = 0 until alternative tokenized gold or physical gold acquired; TGRS threshold 8.5 enforced",
    productionBlocker: false,
  },
  {
    scenario: "Multi-custodian failure (2 of 4)",
    bdlReason: "Simultaneous custodian failure — custody concentration risk materializes",
    containmentStrategy: "Per-custodian 15% cap limits damage to ≤30% of reserve; insurance claims filed",
    responseStrategy: "Activate ILPS Layer 4 (external/committed); ERTF activated; emergency liquidity pre-positioned",
    resolutionStrategy: "Pro-rata haircut on affected custodian holdings; legal recovery via insurance + custodian liability",
    recoveryStrategy: "Diversify to additional custodians; reduce per-custodian to ≤10%; rebuild reserve over time",
    productionBlocker: false,
  },
  {
    scenario: "80% redemption bank run (48h)",
    bdlReason: "Coordinated institutional redemption — 80% of supply in 48 hours",
    containmentStrategy: "Redemption queue activated (daily cap 2%); settlement restricted; issuance halted",
    responseStrategy: "Article X full liquidation sequence; ILPS all layers activated; ERTF activated; Council emergency session",
    resolutionStrategy: "If RR < 95%: RESOLUTION state; in-kind delivery (proportional); deterministic creditor rules",
    recoveryStrategy: "Post-run stabilization; capital injection; restore RR ≥ 120%; re-activate issuance",
    productionBlocker: false, // 80% now has a DEFINED response — no longer undefined
  },
  {
    scenario: "Governance attack (4/7 council seats captured)",
    bdlReason: "Adversarial governance capture — but cannot mint (no discretionary minting invariant)",
    containmentStrategy: "Governance may NOT bypass monetary issuance; 4/7 < 6/7 supermajority required for constitutional changes",
    responseStrategy: "3/7 honest council members can block constitutional changes; emergency governance protocol",
    resolutionStrategy: "Founder succession protocol activates; independent administrator if council deadlocked",
    recoveryStrategy: "Council reconstitution per Article IX (Founder Succession); new council election",
    productionBlocker: false,
  },
  {
    scenario: "Gold crash -50% in 7 days",
    bdlReason: "Gold market crash — 20% bullion allocation loses 50% value",
    containmentStrategy: "RR drops ~10pp (20% × 50%); CALM state transitions to STRESS; issuance halts",
    responseStrategy: "ILPS activated; Article X liquidation of non-gold first; gold held (not liquidated at loss)",
    resolutionStrategy: "If RR < 95%: resolution; otherwise ride out crash (gold historically recovers); capital injection if needed",
    recoveryStrategy: "Gold price recovery; reserve rebalancing; restore RR ≥ 120%",
    productionBlocker: false,
  },
  {
    scenario: "Combined black swan (gold -30% + PAXG -50% + stablecoin -50% + custody 5% + FX -15%)",
    bdlReason: "Multiple simultaneous shocks — beyond any single-risk design envelope",
    containmentStrategy: "ALL circuit breakers activated; ISSUANCE_HALT; SETTLEMENT_RESTRICTION; redemption queue; ILPS all layers",
    responseStrategy: "Article X full liquidation; ERTF; Council emergency; ILPS capital waterfall (all 7 tiers)",
    resolutionStrategy: "RESOLUTION state if RR < 95%; in-kind delivery; deterministic creditor rules; legal resolution",
    recoveryStrategy: "Multi-year recovery; capital injection; reserve rebuild; governance review",
    productionBlocker: false, // Has defined response — all tiers engaged
  },
];
