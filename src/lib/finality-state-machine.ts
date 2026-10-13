/**
 * MITHQAL v26.0 §4.2 — F0..F7 Finality State Machine
 * MITHQAL v26.0 §4.4 — BM-15 / BM-16A / BM-16B Canonical Naming
 *
 * Finality is decomposed into eight discrete predicates (F0..F7).
 * Each state has:
 *   - a minimum-proof predicate (what must be true to enter)
 *   - a failure behavior (how the system reacts when the predicate
 *     cannot be satisfied)
 *
 * Pilot A: BM-16B Mint Execution is disabled by default. MTQ-related
 * progression through F3 is enforced via the MTQ gate (§3.2).
 */

import { assertMtqEnabled } from "./mtq-gate";

export type FinalityState = "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7";

export type FailureBehavior =
  | "REJECT_QUARANTINE"
  | "REMAIN_PENDING_OR_FAIL"
  | "BLOCK_MTQ_PROGRESSION"
  | "DENY_OR_SAFE_HALT"
  | "ROLLBACK_QUERY_IDEMPOTENCY"
  | "PENDING_REJECTED"
  | "DO_NOT_INFER_LEGAL_COMPLETION"
  | "NOT_FINAL_OR_HOLD";

export interface FinalityStateDefinition {
  state: FinalityState;
  name: string;
  meaning: string;
  minimumProofPredicate: string;
  failureBehavior: FailureBehavior;
  failureDescription: string;
}

export const FINALITY_STATE_MACHINE: Record<FinalityState, FinalityStateDefinition> = {
  F0: {
    state: "F0",
    name: "Instruction Accepted",
    meaning:
      "A settlement instruction has been syntactically + semantically accepted into the control plane.",
    minimumProofPredicate:
      "Appendix B.1 fields present, idempotencyKey unique, requestHash matches body, schemaVersion current.",
    failureBehavior: "REJECT_QUARANTINE",
    failureDescription:
      "Reject the instruction, write an Instruction record with currentState=REJECTED, and quarantine for forensic review.",
  },
  F1: {
    state: "F1",
    name: "Bank Funding Final",
    meaning:
      "Funding on the bank-facing leg is irrevocable. The instruction now has economically committed backing.",
    minimumProofPredicate:
      "Bank confirmation reference present, value-dated timestamp in the past, no reversal code observed.",
    failureBehavior: "REMAIN_PENDING_OR_FAIL",
    failureDescription:
      "Instruction remains PENDING; if the deadline lapses, mark FAILED and surface to operator. Never auto-advance.",
  },
  F2: {
    state: "F2",
    name: "Legally Controlled Backing Confirmed",
    meaning:
      "Backing is segregated, legally controlled by the operator, and admissible under the instruction's applicable law.",
    minimumProofPredicate:
      "EligibleBacking computation passed §3.3 (MIN of 4 dimensions) with all dimensions VERIFIED.",
    failureBehavior: "BLOCK_MTQ_PROGRESSION",
    failureDescription:
      "Mint progression is blocked until legal-control evidence is re-attested. No partial mints permitted.",
  },
  F3: {
    state: "F3",
    name: "MITHQAL Monetary Authorization Completed (BM-15)",
    meaning:
      "BM-15 Monetary Authorization has run, produced a PolicyDecision, and the MTQ gate (§3.2) has authorized progression.",
    minimumProofPredicate:
      "PolicyDecision row persisted, policyHash matches deployed policy, MTQ gate returns ok=true.",
    failureBehavior: "DENY_OR_SAFE_HALT",
    failureDescription:
      "Deny mint; safe-halt the instruction with reasonCodes. Operator review required before any retry.",
  },
  F4: {
    state: "F4",
    name: "MITHQAL Ledger State Committed",
    meaning:
      "The mint/redeem/transfer ledger state has been committed atomically to the authoritative writer (§6.1).",
    minimumProofPredicate:
      "Authoritative write returned; OutboxEvent PENDING; idempotency key written to InboxEvent consumerDedupeKey.",
    failureBehavior: "ROLLBACK_QUERY_IDEMPOTENCY",
    failureDescription:
      "Rollback ledger entry, query idempotency record to detect duplicate, and surface for operator reconciliation.",
  },
  F5: {
    state: "F5",
    name: "Receiving Institution Accepted",
    meaning:
      "The receiving institution accepted the credit instruction; explicit acceptance record present.",
    minimumProofPredicate:
      "Acknowledgement reference from the receiving institution observed within SLA window.",
    failureBehavior: "PENDING_REJECTED",
    failureDescription:
      "Mark PENDING_REJECTED; do not infer F6; surface to operator for re-dispatch decision.",
  },
  F6: {
    state: "F6",
    name: "External Rail Final",
    meaning:
      "The external settlement rail (e.g. RTGS, correspondent bank, on-chain bridge) has irrevocably executed.",
    minimumProofPredicate:
      "Rail-specific finality signal observed (block confirmation, RTGS confirmation, correspondent MT message).",
    failureBehavior: "DO_NOT_INFER_LEGAL_COMPLETION",
    failureDescription:
      "Do NOT auto-promote to F7. External rail finality is a necessary but not sufficient condition for legal settlement finality.",
  },
  F7: {
    state: "F7",
    name: "Legal Settlement Final",
    meaning:
      "Settlement is legally final under the instruction's applicable law: novation, discharge, and set-off are complete.",
    minimumProofPredicate:
      "Executed settlement document (EXECUTED_EXTERNAL_DOCUMENT) present and admissible in the instruction's jurisdiction.",
    failureBehavior: "NOT_FINAL_OR_HOLD",
    failureDescription:
      "Treat as NOT final; hold in escrow posture; require legal review to confirm or deny promotion to F7.",
  },
};

/**
 * Per-state minimum-proof predicates supplied by the caller. Each
 * boolean reflects an independently attested fact (e.g. an
 * EvidenceArtifact row). The state machine does not infer missing
 * predicates.
 */
export interface FinalityPredicates {
  f0InstructionAccepted: boolean;
  f1BankFundingFinal: boolean;
  f2LegallyControlledBackingConfirmed: boolean;
  f3MonetaryAuthorizationCompleted: boolean;
  f4LedgerStateCommitted: boolean;
  f5ReceivingInstitutionAccepted: boolean;
  f6ExternalRailFinal: boolean;
  f7LegalSettlementFinal: boolean;
}

export interface FinalityEvaluation {
  transactionId: string;
  currentState: FinalityState;
  nextState: FinalityState | null;
  advanced: boolean;
  mtqGate: ReturnType<typeof assertMtqEnabled>;
  reason: string;
}

/**
 * Evaluate whether a transaction can advance from `currentState` to
 * the next finality state, given the supplied per-state predicates.
 *
 * For F3 specifically, the MTQ gate (§3.2) is additionally consulted.
 * If the MTQ gate denies, the transaction remains in F2 (BLOCK_MTQ_PROGRESSION).
 */
export function evaluateFinality(
  transactionId: string,
  currentState: FinalityState,
  predicates: FinalityPredicates,
): FinalityEvaluation {
  const order: FinalityState[] = ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"];
  const currentIndex = order.indexOf(currentState);
  const nextIndex = currentIndex + 1;
  if (nextIndex >= order.length) {
    return {
      transactionId,
      currentState,
      nextState: null,
      advanced: false,
      mtqGate: assertMtqEnabled(`evaluateFinality:${transactionId}`),
      reason: `Already at terminal state ${currentState}.`,
    };
  }

  const nextState = order[nextIndex] as FinalityState;
  const stateDef = FINALITY_STATE_MACHINE[nextState];

  // Determine the predicate corresponding to nextState.
  const predicateKey = `f${nextIndex}` as keyof FinalityPredicates;
  const predicateValue = predicates[predicateKey];

  if (!predicateValue) {
    return {
      transactionId,
      currentState,
      nextState,
      advanced: false,
      mtqGate: assertMtqEnabled(`evaluateFinality:${transactionId}`),
      reason: `Predicate for ${nextState} (${stateDef.name}) not satisfied. Failure behavior: ${stateDef.failureBehavior}.`,
    };
  }

  // F3 additionally requires the MTQ gate.
  if (nextState === "F3") {
    const gate = assertMtqEnabled(`BM-15:${transactionId}`);
    if (!gate.ok) {
      return {
        transactionId,
        currentState,
        nextState,
        advanced: false,
        mtqGate: gate,
        reason: `MTQ gate denied F3 progression: ${gate.reason ?? ""}`,
      };
    }
  }

  return {
    transactionId,
    currentState,
    nextState,
    advanced: true,
    mtqGate: assertMtqEnabled(`evaluateFinality:${transactionId}`),
    reason: `Advanced ${currentState} → ${nextState}; ${stateDef.minimumProofPredicate}`,
  };
}

// ---------------------------------------------------------------------------
// §4.4 — BM-15 / BM-16A / BM-16B canonical naming
// ---------------------------------------------------------------------------

export type BmModule = "BM-15" | "BM-16A" | "BM-16B";

export interface BmModuleDefinition {
  id: BmModule;
  name: string;
  description: string;
  finalityAnchor: FinalityState;
  disabledByDefault: boolean;
  blueprintRef: string;
}

export const BM_MODULE_REGISTRY: Record<BmModule, BmModuleDefinition> = {
  "BM-15": {
    id: "BM-15",
    name: "Monetary Authorization",
    description:
      "Runs the policy engine and produces a PolicyDecision that authorizes or denies the monetary operation (mint/redeem/transfer).",
    finalityAnchor: "F3",
    disabledByDefault: false,
    blueprintRef: "v26.0 §4.4 BM-15",
  },
  "BM-16A": {
    id: "BM-16A",
    name: "Finality Verification",
    description:
      "Verifies that the minimum-proof predicate of the target finality state (F0..F7) is satisfied and writes a GateDecision row.",
    finalityAnchor: "F4",
    disabledByDefault: false,
    blueprintRef: "v26.0 §4.4 BM-16A",
  },
  "BM-16B": {
    id: "BM-16B",
    name: "Mint Execution",
    description:
      "Executes the BM-15-authorized mint: commits the ledger state (F4) and emits the OutboxEvent for projection fans-out.",
    finalityAnchor: "F4",
    disabledByDefault: true,
    blueprintRef: "v26.0 §4.4 BM-16B",
  },
};

const LEGACY_BM_NAMES = new Map<string, BmModule>([
  ["BM15", "BM-15"],
  ["BM-15-Mint", "BM-15"],
  ["BM16", "BM-16A"],
  ["BM-16", "BM-16A"],
  ["BM16B-MintExecution", "BM-16B"],
  ["BM-16B-Mint", "BM-16B"],
]);

/**
 * Resolve a BM module by canonical id. Throws when a legacy name is
 * supplied, with a message pointing to the canonical replacement.
 */
export function getBmModule(id: string): BmModuleDefinition {
  if (id === "BM-15" || id === "BM-16A" || id === "BM-16B") {
    return BM_MODULE_REGISTRY[id];
  }
  const legacy = LEGACY_BM_NAMES.get(id);
  if (legacy) {
    throw new Error(
      `Legacy BM module name "${id}" is no longer accepted. Use canonical id "${legacy}" per v26.0 §4.4.`,
    );
  }
  throw new Error(`Unknown BM module id "${id}". Valid ids: BM-15, BM-16A, BM-16B.`);
}

/**
 * Pilot-A guard for BM-16B mint execution. Returns true only when:
 *   - the transaction has reached F4 (ledger state committed), AND
 *   - the operator has explicitly passed stateSatisfied=true, AND
 *   - the MTQ gate (§3.2) authorizes the mint action.
 */
export function canExecuteMint(
  finalityState: FinalityState,
  stateSatisfied: boolean,
): { canExecute: boolean; reason: string; mtqGate: ReturnType<typeof assertMtqEnabled> } {
  const gate = assertMtqEnabled("BM-16B:mint-execution");
  if (!stateSatisfied) {
    return {
      canExecute: false,
      reason: "Operator did not assert stateSatisfied for the BM-16B mint attempt.",
      mtqGate: gate,
    };
  }
  if (finalityState !== "F4") {
    return {
      canExecute: false,
      reason: `BM-16B requires finalityState F4, observed ${finalityState}.`,
      mtqGate: gate,
    };
  }
  if (!gate.ok) {
    return {
      canExecute: false,
      reason: `MTQ gate denied mint: ${gate.reason ?? ""}`,
      mtqGate: gate,
    };
  }
  if (BM_MODULE_REGISTRY["BM-16B"].disabledByDefault) {
    return {
      canExecute: false,
      reason:
        "BM-16B is disabledByDefault per v26.0 §4.4. Pilot A does not execute mints; only simulated or read-only operations are permitted.",
      mtqGate: gate,
    };
  }
  return {
    canExecute: true,
    reason: "BM-16B mint execution authorized.",
    mtqGate: gate,
  };
}
