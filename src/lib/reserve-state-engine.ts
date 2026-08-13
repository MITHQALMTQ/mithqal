// v24.1.1 Reserve State Engine — Dynamic Reserve State Management
// =================================================================
// Implements the 5-state reserve state engine per §3 of the
// Institutional Dynamic Reserve Rebalancing specification.
//
// States:
//   NORMAL → ELEVATED → HIGH_STRESS → CRISIS → RECOVERY → NORMAL
//
// Each state has dynamic operating corridors for Bullion/Fiat/Digital.
// The optimizer determines the exact allocation within the corridor.
// =================================================================

export type ReserveState = "NORMAL" | "ELEVATED" | "HIGH_STRESS" | "CRISIS" | "RECOVERY";

export interface StateCorridor {
  bullionMin: number;
  bullionMax: number;
  fiatMin: number;
  fiatMax: number;
  digitalMin: number;
  digitalMax: number;
  cashPct: number;    // within fiat: cash %
  sovereignPct: number; // within fiat: sovereign %
}

export const STATE_CORRIDORS: Record<ReserveState, StateCorridor> = {
  NORMAL: {
    bullionMin: 0.18, bullionMax: 0.22,
    fiatMin: 0.75, fiatMax: 0.79,
    digitalMin: 0.02, digitalMax: 0.04,
    cashPct: 0.60, sovereignPct: 0.40,
  },
  ELEVATED: {
    bullionMin: 0.20, bullionMax: 0.23,
    fiatMin: 0.75, fiatMax: 0.78,
    digitalMin: 0.01, digitalMax: 0.03,
    cashPct: 0.65, sovereignPct: 0.35,
  },
  HIGH_STRESS: {
    bullionMin: 0.22, bullionMax: 0.24,
    fiatMin: 0.74, fiatMax: 0.78,
    digitalMin: 0.00, digitalMax: 0.02,
    cashPct: 0.75, sovereignPct: 0.25,
  },
  CRISIS: {
    bullionMin: 0.24, bullionMax: 0.25,
    fiatMin: 0.75, fiatMax: 0.76,
    digitalMin: 0.00, digitalMax: 0.00,
    cashPct: 0.80, sovereignPct: 0.20,
  },
  RECOVERY: {
    // Gradually move toward NORMAL bands
    bullionMin: 0.20, bullionMax: 0.23,
    fiatMin: 0.75, fiatMax: 0.78,
    digitalMin: 0.01, digitalMax: 0.03,
    cashPct: 0.70, sovereignPct: 0.30,
  },
};

export interface StateTransitionInput {
  rr: number;           // current Reserve Ratio (%)
  stressRR: number;     // Stress-RR (%)
  lcr: number;          // Liquidity Coverage Ratio
  lrr: number;          // Liquidity Reserve Ratio
  cbgrs: number;        // CBGRS (advisory)
  redemptionPressure: number; // 0-1 (0 = none, 1 = extreme)
  oracleHealth: number; // 0-1 (0 = failed, 1 = healthy)
  custodyStress: number; // 0-1 (0 = none, 1 = severe)
}

export interface StateTransitionResult {
  currentState: ReserveState;
  previousState: ReserveState;
  transitioned: boolean;
  reason: string;
  corridor: StateCorridor;
  timestamp: string;
}

let moduleState: ReserveState = "NORMAL";

export function getCurrentState(): ReserveState {
  return moduleState;
}

export function transitionState(input: StateTransitionInput): StateTransitionResult {
  const previousState = moduleState;
  let newState: ReserveState = previousState;

  // Crisis: RR < 100% or LCR < 0.5 or extreme custody stress
  if (input.rr < 100 || input.lcr < 0.5 || input.custodyStress > 0.8) {
    newState = "CRISIS";
  }
  // High stress: RR < 105% or LCR < 1.0 or high redemption pressure
  else if (input.rr < 105 || input.lcr < 1.0 || input.redemptionPressure > 0.6 || input.custodyStress > 0.5) {
    newState = "HIGH_STRESS";
  }
  // Elevated: RR < 110% or LCR < 1.5 or moderate stress signals
  else if (input.rr < 110 || input.lcr < 1.5 || input.redemptionPressure > 0.3 || input.oracleHealth < 0.7 || input.custodyStress > 0.2) {
    newState = "ELEVATED";
  }
  // Recovery: coming from crisis/high_stress, conditions improving
  else if ((previousState === "CRISIS" || previousState === "HIGH_STRESS") && input.rr >= 110 && input.lcr >= 1.5) {
    newState = "RECOVERY";
  }
  // Normal: all indicators healthy
  else if (input.rr >= 115 && input.lcr >= 2.0 && input.redemptionPressure < 0.2 && input.oracleHealth > 0.8) {
    newState = "NORMAL";
  }

  const transitioned = newState !== previousState;
  if (transitioned) {
    moduleState = newState;
  }

  let reason = "No state change";
  if (transitioned) {
    if (newState === "CRISIS") reason = `RR=${input.rr.toFixed(1)}% or LCR=${input.lcr.toFixed(2)} or custody stress=${input.custodyStress.toFixed(2)} triggered CRISIS`;
    else if (newState === "HIGH_STRESS") reason = `RR=${input.rr.toFixed(1)}% or LCR=${input.lcr.toFixed(2)} or redemption pressure=${input.redemptionPressure.toFixed(2)} triggered HIGH_STRESS`;
    else if (newState === "ELEVATED") reason = `RR=${input.rr.toFixed(1)}% or LCR=${input.lcr.toFixed(2)} or oracle health=${input.oracleHealth.toFixed(2)} triggered ELEVATED`;
    else if (newState === "RECOVERY") reason = `Recovery from ${previousState}: RR=${input.rr.toFixed(1)}%, LCR=${input.lcr.toFixed(2)} improving`;
    else if (newState === "NORMAL") reason = `All indicators healthy: RR=${input.rr.toFixed(1)}%, LCR=${input.lcr.toFixed(2)}`;
  }

  return {
    currentState: newState,
    previousState,
    transitioned,
    reason,
    corridor: STATE_CORRIDORS[newState],
    timestamp: new Date().toISOString(),
  };
}

export function resetState(): void {
  moduleState = "NORMAL";
}
