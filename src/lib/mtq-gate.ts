/**
 * MITHQAL — MTQ gate enforcement (MITHQAL-TECH-SPEC-001 §1.1 + §7.1).
 *
 * Golden rule: "No production authorization. All writes are MTQ-disabled."
 *
 * This module is the single source of truth for whether MTQ (the optional,
 * permissioned, closed-loop settlement module) is permitted to act.
 * It is consulted by every API route that intends to write monetary
 * state. When mtqDisabled=true (current honest state), all writes are
 * downgraded to SYNTHETIC / SIMULATED — the DB row is recorded for
 * auditability but no external rail is engaged and no value moves.
 *
 * Truth state: DESIGN-STAGE. productionAuthorized=false. No bank
 * partnership, no license, no legal opinion, no live backing cells.
 * MTQ is disabled until all eight canonical gates pass.
 *
 * The eight canonical gates (per §7.3 of the MITHQAL Master Blueprint):
 *   G1  Legal opinion             — NOT HELD (0 opinions)
 *   G2  Bank design partner       — NONE (0 signed contracts)
 *   G3  Regulatory license        — NONE (0 licenses)
 *   G4  Custody arrangement       — NONE (0 live custodians)
 *   G5  Backing cell eligibility  — 0 eligible backing cells
 *   G6  Accounting integration    — 0 live integrations
 *   G7  Reconciliation tolerance  — policy defined but 0 reconciliations
 *   G8  Production authorization — FALSE (CEO sign-off not granted)
 */

export type GateKey =
  | "legalOpinion"
  | "bankPartner"
  | "regulatoryLicense"
  | "custodyArrangement"
  | "backingEligibility"
  | "accountingIntegration"
  | "reconciliationTolerance"
  | "productionAuthorization";

export interface GateState {
  key: GateKey;
  held: boolean;
  evidence: string; // human-readable truth statement
}

export interface MtqGateResult {
  /** Master switch — true when MTQ is DISABLED (current honest state). */
  mtqDisabled: boolean;
  /** True when production is authorized (current: false). */
  productionAuthorized: boolean;
  /** Per-gate state map. */
  gates: Record<GateKey, GateState>;
  /** Stable policy version tag. */
  policyVersion: string;
  /** Honest state summary for embedding in API responses. */
  honestState: string;
}

/**
 * Canonical gate evaluation. The result is HARD-CODED to the honest
 * state — this is intentional: gate transitions only happen via signed
 * commits that update this file. There is no runtime path that flips
 * the gate — that would defeat the entire control plane.
 *
 * When an institution joins the pilot and provides evidence for a
 * gate, a new release is cut that updates the corresponding `held`
 * field. Auditors verify by reading this file at the deployed commit.
 */
export function evaluateMtqGate(): MtqGateResult {
  const gates: Record<GateKey, GateState> = {
    legalOpinion: {
      key: "legalOpinion",
      held: false,
      evidence: "0 legal opinions on file (target: 1 from a US-licensed firm).",
    },
    bankPartner: {
      key: "bankPartner",
      held: false,
      evidence: "0 signed bank design-partner contracts (target: 1).",
    },
    regulatoryLicense: {
      key: "regulatoryLicense",
      held: false,
      evidence: "0 regulatory licenses (target: 1 — e.g., NYDFSBitLicense or equivalent).",
    },
    custodyArrangement: {
      key: "custodyArrangement",
      held: false,
      evidence: "0 live qualified-custodian arrangements (target: ≥1).",
    },
    backingEligibility: {
      key: "backingEligibility",
      held: false,
      evidence: "0 eligible backing cells admitted (target: ≥1 per eligible-backing.ts).",
    },
    accountingIntegration: {
      key: "accountingIntegration",
      held: false,
      evidence: "0 live accounting-integration feeds (target: 1).",
    },
    reconciliationTolerance: {
      key: "reconciliationTolerance",
      held: false,
      evidence:
        "Tolerance policy defined (§reconciliation-tolerance) but 0 production reconciliations executed.",
    },
    productionAuthorization: {
      key: "productionAuthorization",
      held: false,
      evidence: "productionAuthorized = FALSE. CEO sign-off not granted. Pre-pilot, pre-financing.",
    },
  };

  const productionAuthorized = gates.productionAuthorization.held;
  const allHeld = (Object.values(gates) as GateState[]).every((g) => g.held);
  const mtqDisabled = !allHeld; // MTQ is enabled only when every gate is held

  return {
    mtqDisabled,
    productionAuthorized,
    gates,
    policyVersion: "POLICY-v1.2.3",
    honestState:
      "MITHQAL is a neutral institutional settlement control plane. " +
      "MTQ is optional and remains disabled until all legal, regulatory, custody, " +
      "backing, accounting, and bank gates pass. " +
      "Current status: design-stage, pre-pilot, pre-financing, " +
      "productionAuthorized=false.",
  };
}

/**
 * Convenience accessor: true when MTQ writes are disabled (always true
 * in the current honest state). API routes import this directly so the
 * check is a single boolean read.
 */
export const MTQ_DISABLED: boolean = evaluateMtqGate().mtqDisabled;

/**
 * Convenience accessor: the canonical policy version tag.
 */
export const POLICY_VERSION: string = evaluateMtqGate().policyVersion;
