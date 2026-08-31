// v25.0 CALM — Capital-Adaptive Liability Management
// =================================================================
// Implements CALM per §33 of the v25.0 canonical blueprint.
//
// v25.0 CORRECTION: Uses the v24.2 6-state machine (not the v24.1 5-state).
//   NORMAL → CAUTION → DEFENSIVE → STRESS → EMERGENCY → RECOVERY
//
// CALM is a SECONDARY defense. It prevents the liability side from
// expanding beyond current reserve risk capacity.
//
// Formula:
//   S_max,t = R_a,t / (RR_target,t × PAR)
//   Headroom_t = S_max,t - S_t
//
// CALM does NOT replace RR.
// CALM does NOT permit undercollateralization.
// =================================================================

import { ReserveStateV242 as ReserveState } from "./v24-2-state-machine";

export interface CalmInput {
  ra: number;          // current R_a (adjusted reserve value in USD)
  supply: number;      // current S (MTQ supply)
  par: number;         // PAR ($1.00)
  reserveState: ReserveState;
  rr: number;          // current RR (%)
}

export interface CalmResult {
  rrTarget: number;       // state-dependent RR target (fraction, e.g., 1.05)
  sMax: number;           // maximum supply allowed
  currentSupply: number;
  headroom: number;       // S_max - S (positive = can mint, negative = over-extended)
  headroomPct: number;    // headroom as % of current supply
  issuanceAllowed: boolean;
  issuanceRestricted: boolean;
  mintingDisabled: boolean;
  restrictionLevel: "NORMAL" | "ENHANCED" | "DISABLED";
  stabilizationFeeBps: number;  // risk-priced stabilization fee in basis points
  reason: string;
  formula: string;
  timestamp: string;
}

// State-dependent RR targets and stabilization fees
// v25.0 CORRECTION: Uses v24.2 6-state machine with corrected targets
// v24.2 had NORMAL=1.15 (WRONG — below strategic target 1.20)
// v25.0 (per §33): NORMAL=1.20, monotonically increasing
// Core invariant: Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓
const STATE_CONFIG: Record<ReserveState, {
  rrTarget: number;
  feeBps: number;
  feeRange: string;
}> = {
  NORMAL:     { rrTarget: 1.30, feeBps: 5,   feeRange: "0.05%" },
  CAUTION:    { rrTarget: 1.22, feeBps: 15,  feeRange: "0.10–0.20%" },
  DEFENSIVE:  { rrTarget: 1.23, feeBps: 25,  feeRange: "0.20–0.25%" },
  STRESS:     { rrTarget: 1.25, feeBps: 37,  feeRange: "0.25–0.50%" },
  EMERGENCY:  { rrTarget: 1.30, feeBps: 0,   feeRange: "minting disabled" },
  RECOVERY:   { rrTarget: 1.21, feeBps: 10,  feeRange: "0.05–0.10%" },
  // Legacy v24.1 ReserveState aliases (GAP-010 type-widening interop).
  // ELEVATED ≈ CAUTION, HIGH_STRESS ≈ STRESS, CRISIS ≈ EMERGENCY per the
  // v24.2 calmStateMap; the v24.2 state machine never emits these.
  ELEVATED:   { rrTarget: 1.22, feeBps: 15,  feeRange: "0.10–0.20%" },
  HIGH_STRESS:{ rrTarget: 1.25, feeBps: 37,  feeRange: "0.25–0.50%" },
  CRISIS:     { rrTarget: 1.30, feeBps: 0,   feeRange: "minting disabled" },
};

export function computeCalm(input: CalmInput): CalmResult {
  const config = STATE_CONFIG[input.reserveState];

  // S_max = R_a / (RR_target × PAR)
  const sMax = input.ra / (config.rrTarget * input.par);
  const headroom = sMax - input.supply;
  const headroomPct = input.supply > 0 ? (headroom / input.supply) * 100 : 0;

  // Determine restriction level
  let restrictionLevel: "NORMAL" | "ENHANCED" | "DISABLED" = "NORMAL";
  let issuanceAllowed = true;
  let issuanceRestricted = false;
  let mintingDisabled = false;
  let reason = "Normal issuance capacity";

  if (input.rr < 100) {
    restrictionLevel = "DISABLED";
    issuanceAllowed = false;
    issuanceRestricted = true;
    mintingDisabled = true;
    reason = `RR=${input.rr.toFixed(2)}% < 100% — minting MUST be disabled`;
  } else if (input.rr < 105) {
    restrictionLevel = "ENHANCED";
    issuanceAllowed = headroom > 0;
    issuanceRestricted = true;
    reason = `RR=${input.rr.toFixed(2)}% < 105% — enhanced issuance restrictions active`;
  } else if (headroom <= 0) {
    restrictionLevel = "ENHANCED";
    issuanceAllowed = false;
    issuanceRestricted = true;
    reason = `Headroom=${headroom.toFixed(0)} — supply at capacity for RR target ${(config.rrTarget * 100).toFixed(0)}%`;
  } else if (headroomPct < 5) {
    restrictionLevel = "ENHANCED";
    issuanceAllowed = true;
    issuanceRestricted = true;
    reason = `Headroom=${headroomPct.toFixed(1)}% — near capacity, restricted minting`;
  }

  // In EMERGENCY, minting is always disabled
  if (input.reserveState === "EMERGENCY") {
    restrictionLevel = "DISABLED";
    issuanceAllowed = false;
    mintingDisabled = true;
    reason = `Reserve state=EMERGENCY — minting disabled per §33`;
  }

  return {
    rrTarget: config.rrTarget,
    sMax: Math.round(sMax),
    currentSupply: input.supply,
    headroom: Math.round(headroom),
    headroomPct: Math.round(headroomPct * 100) / 100,
    issuanceAllowed,
    issuanceRestricted,
    mintingDisabled,
    restrictionLevel,
    stabilizationFeeBps: config.feeBps,
    reason,
    formula: `S_max = R_a / (RR_target × PAR) = ${input.ra.toLocaleString()} / (${config.rrTarget} × ${input.par}) = ${Math.round(sMax).toLocaleString()}`,
    timestamp: new Date().toISOString(),
  };
}
