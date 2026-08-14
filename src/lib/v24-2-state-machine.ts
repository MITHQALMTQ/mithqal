// v24.2 §10-11 — 6-State Reserve State Machine
// =================================================================
// NORMAL → CAUTION → DEFENSIVE → STRESS → EMERGENCY → RECOVERY
//
// Each state specifies:
//   minting status, max mint capacity, digital ceiling, min liquid cash,
//   gold/silver target zones, rebalancing permissions, approval requirements,
//   LCR minimum, Stress-RR minimum, reporting frequency, stress-test frequency
// =================================================================

export type ReserveStateV242 =
  | "NORMAL" | "CAUTION" | "DEFENSIVE" | "STRESS" | "EMERGENCY" | "RECOVERY";

export interface StateConfigV242 {
  state: ReserveStateV242;
  bullionRange: { min: number; max: number };
  goldTarget: { min: number; max: number };
  silverTarget: { min: number; max: number };
  fiatRange: { min: number; max: number };
  digitalCeiling: number;
  minLiquidCashPct: number;  // min cash as % of fiat
  cashSovSplit: { cash: number; sovereign: number };
  mintingStatus: "ALLOWED" | "RESTRICTED" | "BLOCKED";
  maxMintCapacityPct: number;  // % of headroom allowed
  rebalancingPermission: "FULL" | "DEFENSIVE_ONLY" | "EMERGENCY_ONLY" | "BLOCKED";
  approvalRequired: "NONE" | "AUTO" | "3_OF_5" | "4_OF_5" | "5_OF_5";
  lcrMinimum: number;
  stressRRMinimum: number;
  reportingFrequency: "DAILY" | "HOURLY" | "REAL_TIME";
  stressTestFrequency: "WEEKLY" | "DAILY" | "HOURLY";
  stabilizationFeeBps: number;
  calMRRTarget: number;
}

export const STATE_CONFIGS_V242: Record<ReserveStateV242, StateConfigV242> = {
  NORMAL: {
    state: "NORMAL",
    bullionRange: { min: 0.16, max: 0.20 },
    goldTarget: { min: 0.13, max: 0.17 },
    silverTarget: { min: 0.00, max: 0.03 },
    fiatRange: { min: 0.78, max: 0.82 },
    digitalCeiling: 0.035,
    minLiquidCashPct: 0.55,
    cashSovSplit: { cash: 0.60, sovereign: 0.40 },
    mintingStatus: "ALLOWED",
    maxMintCapacityPct: 1.0,
    rebalancingPermission: "FULL",
    approvalRequired: "NONE",
    lcrMinimum: 1.0,
    stressRRMinimum: 1.0,
    reportingFrequency: "DAILY",
    stressTestFrequency: "WEEKLY",
    stabilizationFeeBps: 5,
    calMRRTarget: 1.20, // v24.2.1: NORMAL = strategic target
  },
  CAUTION: {
    state: "CAUTION",
    bullionRange: { min: 0.17, max: 0.21 },
    goldTarget: { min: 0.14, max: 0.18 },
    silverTarget: { min: 0.00, max: 0.03 },
    fiatRange: { min: 0.77, max: 0.81 },
    digitalCeiling: 0.03,
    minLiquidCashPct: 0.60,
    cashSovSplit: { cash: 0.65, sovereign: 0.35 },
    mintingStatus: "ALLOWED",
    maxMintCapacityPct: 0.7,
    rebalancingPermission: "FULL",
    approvalRequired: "AUTO",
    lcrMinimum: 1.1,
    stressRRMinimum: 1.0,
    reportingFrequency: "DAILY",
    stressTestFrequency: "DAILY",
    stabilizationFeeBps: 10,
    calMRRTarget: 1.22, // v24.2.1: CAUTION
  },
  DEFENSIVE: {
    state: "DEFENSIVE",
    bullionRange: { min: 0.18, max: 0.22 },
    goldTarget: { min: 0.15, max: 0.19 },
    silverTarget: { min: 0.00, max: 0.03 },
    fiatRange: { min: 0.76, max: 0.80 },
    digitalCeiling: 0.025,
    minLiquidCashPct: 0.65,
    cashSovSplit: { cash: 0.70, sovereign: 0.30 },
    mintingStatus: "RESTRICTED",
    maxMintCapacityPct: 0.4,
    rebalancingPermission: "DEFENSIVE_ONLY",
    approvalRequired: "3_OF_5",
    lcrMinimum: 1.15,
    stressRRMinimum: 1.0,
    reportingFrequency: "HOURLY",
    stressTestFrequency: "DAILY",
    stabilizationFeeBps: 20,
    calMRRTarget: 1.23,
  },
  STRESS: {
    state: "STRESS",
    bullionRange: { min: 0.20, max: 0.24 },
    goldTarget: { min: 0.16, max: 0.20 },
    silverTarget: { min: 0.00, max: 0.03 },
    fiatRange: { min: 0.74, max: 0.79 },
    digitalCeiling: 0.02,
    minLiquidCashPct: 0.72,
    cashSovSplit: { cash: 0.75, sovereign: 0.25 },
    mintingStatus: "RESTRICTED",
    maxMintCapacityPct: 0.15,
    rebalancingPermission: "DEFENSIVE_ONLY",
    approvalRequired: "4_OF_5",
    lcrMinimum: 1.2,
    stressRRMinimum: 1.0,
    reportingFrequency: "HOURLY",
    stressTestFrequency: "HOURLY",
    stabilizationFeeBps: 37,
    calMRRTarget: 1.25,
  },
  EMERGENCY: {
    state: "EMERGENCY",
    bullionRange: { min: 0.22, max: 0.25 },
    goldTarget: { min: 0.18, max: 0.22 },
    silverTarget: { min: 0.00, max: 0.03 },
    fiatRange: { min: 0.75, max: 0.76 },
    digitalCeiling: 0.0,
    minLiquidCashPct: 0.78,
    cashSovSplit: { cash: 0.80, sovereign: 0.20 },
    mintingStatus: "BLOCKED",
    maxMintCapacityPct: 0.0,
    rebalancingPermission: "EMERGENCY_ONLY",
    approvalRequired: "5_OF_5",
    lcrMinimum: 1.3,
    stressRRMinimum: 1.0,
    reportingFrequency: "REAL_TIME",
    stressTestFrequency: "HOURLY",
    stabilizationFeeBps: 0,
    calMRRTarget: 1.30,
  },
  RECOVERY: {
    state: "RECOVERY",
    bullionRange: { min: 0.19, max: 0.22 },
    goldTarget: { min: 0.15, max: 0.18 },
    silverTarget: { min: 0.00, max: 0.03 },
    fiatRange: { min: 0.76, max: 0.80 },
    digitalCeiling: 0.025,
    minLiquidCashPct: 0.68,
    cashSovSplit: { cash: 0.70, sovereign: 0.30 },
    mintingStatus: "RESTRICTED",
    maxMintCapacityPct: 0.3,
    rebalancingPermission: "DEFENSIVE_ONLY",
    approvalRequired: "3_OF_5",
    lcrMinimum: 1.15,
    stressRRMinimum: 1.0,
    reportingFrequency: "HOURLY",
    stressTestFrequency: "DAILY",
    stabilizationFeeBps: 15,
    calMRRTarget: 1.21,
  },
};

export interface StateTransitionInputV242 {
  rr: number;
  stressRR: number;
  lcr: number;
  lrr: number;
  cbgrs: number;
  eigenvalueIndex: number;
  redemptionPressure: number;
  oracleHealth: number;
  custodyStress: number;
  correlationBreak: number;
}

export interface StateTransitionResultV242 {
  currentState: ReserveStateV242;
  previousState: ReserveStateV242;
  transitioned: boolean;
  reason: string;
  config: StateConfigV242;
  triggers: string[];
  timestamp: string;
}

let moduleStateV242: ReserveStateV242 = "NORMAL";

export function getCurrentStateV242(): ReserveStateV242 {
  return moduleStateV242;
}

export function transitionStateV242(
  input: StateTransitionInputV242,
): StateTransitionResultV242 {
  const previousState = moduleStateV242;
  const triggers: string[] = [];

  // Score the stress level from multiple dimensions
  let stressScore = 0;

  // RR dimension
  if (input.rr < 100) { stressScore += 5; triggers.push(`RR=${input.rr.toFixed(1)}% < 100%`); }
  else if (input.rr < 105) { stressScore += 4; triggers.push(`RR=${input.rr.toFixed(1)}% < 105%`); }
  else if (input.rr < 110) { stressScore += 2; triggers.push(`RR=${input.rr.toFixed(1)}% < 110%`); }
  else if (input.rr < 115) { stressScore += 1; triggers.push(`RR=${input.rr.toFixed(1)}% < 115%`); }

  // LCR dimension
  if (input.lcr < 1.0) { stressScore += 5; triggers.push(`LCR=${input.lcr.toFixed(2)} < 1.0`); }
  else if (input.lcr < 1.15) { stressScore += 3; triggers.push(`LCR=${input.lcr.toFixed(2)} < 1.15`); }
  else if (input.lcr < 1.5) { stressScore += 1; triggers.push(`LCR=${input.lcr.toFixed(2)} < 1.5`); }

  // Eigenvalue dimension
  if (input.eigenvalueIndex >= 1.75) { stressScore += 4; triggers.push(`EI=${input.eigenvalueIndex.toFixed(2)} ≥ 1.75`); }
  else if (input.eigenvalueIndex >= 1.50) { stressScore += 3; triggers.push(`EI=${input.eigenvalueIndex.toFixed(2)} ≥ 1.50`); }
  else if (input.eigenvalueIndex >= 1.25) { stressScore += 1; triggers.push(`EI=${input.eigenvalueIndex.toFixed(2)} ≥ 1.25`); }

  // Redemption pressure
  if (input.redemptionPressure > 0.7) { stressScore += 4; triggers.push(`Redemption pressure=${input.redemptionPressure.toFixed(2)} > 0.7`); }
  else if (input.redemptionPressure > 0.4) { stressScore += 2; triggers.push(`Redemption pressure=${input.redemptionPressure.toFixed(2)} > 0.4`); }
  else if (input.redemptionPressure > 0.2) { stressScore += 1; triggers.push(`Redemption pressure=${input.redemptionPressure.toFixed(2)} > 0.2`); }

  // Oracle health
  if (input.oracleHealth < 0.5) { stressScore += 3; triggers.push(`Oracle health=${input.oracleHealth.toFixed(2)} < 0.5`); }
  else if (input.oracleHealth < 0.7) { stressScore += 1; triggers.push(`Oracle health=${input.oracleHealth.toFixed(2)} < 0.7`); }

  // Custody stress
  if (input.custodyStress > 0.7) { stressScore += 4; triggers.push(`Custody stress=${input.custodyStress.toFixed(2)} > 0.7`); }
  else if (input.custodyStress > 0.4) { stressScore += 2; triggers.push(`Custody stress=${input.custodyStress.toFixed(2)} > 0.4`); }
  else if (input.custodyStress > 0.2) { stressScore += 1; triggers.push(`Custody stress=${input.custodyStress.toFixed(2)} > 0.2`); }

  // Stress-RR
  if (input.stressRR < 100) { stressScore += 5; triggers.push(`StressRR=${input.stressRR.toFixed(1)}% < 100%`); }
  else if (input.stressRR < 105) { stressScore += 2; triggers.push(`StressRR=${input.stressRR.toFixed(1)}% < 105%`); }

  // Determine new state based on stress score
  let newState: ReserveStateV242;

  if (stressScore >= 15 || input.rr < 100 || input.lcr < 1.0) {
    newState = "EMERGENCY";
  } else if (stressScore >= 10) {
    newState = "STRESS";
  } else if (stressScore >= 6) {
    newState = "DEFENSIVE";
  } else if (stressScore >= 3) {
    newState = "CAUTION";
  } else if (previousState === "EMERGENCY" || previousState === "STRESS" || previousState === "DEFENSIVE") {
    // Recovery: stress score low but coming from elevated state
    newState = "RECOVERY";
  } else {
    newState = "NORMAL";
  }

  // RECOVERY → NORMAL requires sustained low stress
  if (previousState === "RECOVERY" && stressScore === 0 && input.rr >= 115 && input.lcr >= 1.5) {
    newState = "NORMAL";
  }

  const transitioned = newState !== previousState;
  if (transitioned) {
    moduleStateV242 = newState;
  }

  const reason = transitioned
    ? `${previousState} → ${newState} (stress score: ${stressScore}, triggers: ${triggers.length > 0 ? triggers.join("; ") : "none"})`
    : `Staying in ${newState} (stress score: ${stressScore})`;

  return {
    currentState: newState,
    previousState,
    transitioned,
    reason,
    config: STATE_CONFIGS_V242[newState],
    triggers,
    timestamp: new Date().toISOString(),
  };
}

export function resetStateV242(): void {
  moduleStateV242 = "NORMAL";
}
