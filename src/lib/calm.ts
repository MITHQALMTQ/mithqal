// v24.1.1 CALM — Capital-Adaptive Liability Management
// =================================================================
// Implements CALM per §26 of the Institutional Dynamic Reserve
// Rebalancing specification.
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

import { ReserveState } from "./reserve-state-engine";

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
// v24.2.1 CORRECTION: NORMAL target must = strategic target (1.20)
// v24.2 had NORMAL=1.15 which was BELOW strategic target 1.20 — inconsistent.
// v24.2.1 fix: NORMAL=1.20, monotonically increasing with risk.
// Core invariant: Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓
const STATE_CONFIG: Record<ReserveState, {
  rrTarget: number;
  feeBps: number;
  feeRange: string;
}> = {
  NORMAL:     { rrTarget: 1.20, feeBps: 5,   feeRange: "0.05%" },
  ELEVATED:   { rrTarget: 1.22, feeBps: 15,  feeRange: "0.10–0.20%" },
  HIGH_STRESS:{ rrTarget: 1.25, feeBps: 37,  feeRange: "0.25–0.50%" },
  CRISIS:     { rrTarget: 1.30, feeBps: 0,   feeRange: "minting disabled" },
  RECOVERY:   { rrTarget: 1.21, feeBps: 10,  feeRange: "0.05–0.10%" },
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

  // In CRISIS, minting is always disabled
  if (input.reserveState === "CRISIS") {
    restrictionLevel = "DISABLED";
    issuanceAllowed = false;
    mintingDisabled = true;
    reason = `Reserve state=CRISIS — minting disabled per §26`;
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
