// =============================================================================
// src/lib/exception-resolution.ts
// MITHQAL · MTQ Canonical Blueprint v1.0 — §5C "Exception Resolution Network"
// =============================================================================
// Task ID: IMPL-V1-BLUEPRINT
//
// Future consent-based workflow for structured exception cases per v1.0 §5C:
//   missing item, responsible party, required evidence, applicable clock
//   and resulting state. Begin within one organization or a simulated
//   environment. Multi-institution use requires data-sharing agreements,
//   access control, privacy safeguards, identity and governance.
//
// Each exception has:
//   - stable code
//   - owner
//   - severity
//   - required evidence
//   - clock (deadline)
//   - allowed transitions
//   - escalation
//   - closure reason
// Closed cases retain the history and evidence that justified closure.
//
// HONEST STATE (per v1.0 §0 "DESIGN-STAGE ONLY"):
//   - productionAuthorized = false
//   - Workflow runs in a SIMULATED environment for Pilot A
//   - No multi-institution data sharing is configured
// =============================================================================

export type ExceptionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ExceptionStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

/**
 * History entry is append-only: once written it must not be mutated, so the
 * audit trail that justified closure is preserved per §5C.
 */
export interface ExceptionHistoryEntry {
  timestamp: string;
  actor: string;
  action: string;
  reason: string;
  evidenceRef: string;
}

export interface ExceptionCase {
  caseId: string;
  code: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  owner: string;
  requiredEvidence: string[];
  /** Deadline by which the case must be resolved/escalated. */
  clock: string;
  /** State machine: which statuses this case may legally transition to. */
  allowedTransitions: ExceptionStatus[];
  escalation: string;
  closureReason: string | null;
  /** Append-only audit trail. */
  history: ExceptionHistoryEntry[];
  blueprint_ref: "v1.0 §5C";
  provenance: "synthetic";
}

const BLUEPRINT_REF = "v1.0 §5C" as const;

// -----------------------------------------------------------------------------
// Standard exception codes per v1.0 §5C
// -----------------------------------------------------------------------------

export interface ExceptionCodeDefinition {
  code: string;
  label: string;
  description: string;
  defaultSeverity: ExceptionSeverity;
}

/**
 * Standard exception codes per v1.0 §5C "missing item, responsible party,
 * required evidence, applicable clock and resulting state."
 */
export const EXCEPTION_CODES: ExceptionCodeDefinition[] = [
  {
    code: "MISSING_ITEM",
    label: "Missing item",
    description: "Required settlement/reconciliation item is absent.",
    defaultSeverity: "MEDIUM",
  },
  {
    code: "RESPONSIBLE_PARTY_UNKNOWN",
    label: "Responsible party unknown",
    description: "Cannot determine which party owns the resolution.",
    defaultSeverity: "HIGH",
  },
  {
    code: "REQUIRED_EVIDENCE_MISSING",
    label: "Required evidence missing",
    description: "Evidence needed to close the case is unavailable.",
    defaultSeverity: "HIGH",
  },
  {
    code: "CLOCK_EXPIRED",
    label: "Clock expired",
    description: "Resolution deadline passed before closure.",
    defaultSeverity: "CRITICAL",
  },
  {
    code: "RECONCILIATION_BREAK",
    label: "Reconciliation break",
    description: "Tolerance breach between canonical, subledger, corporate, reserve, or POL.",
    defaultSeverity: "HIGH",
  },
  {
    code: "PROVIDER_OUTAGE",
    label: "Provider outage",
    description: "Provider API or rail unavailable during processing.",
    defaultSeverity: "HIGH",
  },
  {
    code: "DUPLICATE_EVENT",
    label: "Duplicate event",
    description: "Duplicate settlement message or evidence event detected.",
    defaultSeverity: "MEDIUM",
  },
  {
    code: "POLICY_CONTRADICTION",
    label: "Policy contradiction",
    description: "Active policy contradicts observed event or evidence.",
    defaultSeverity: "HIGH",
  },
  {
    code: "UNAUTHORIZED_ACCESS",
    label: "Unauthorized access",
    description: "Requesting identity lacks authorization for the action.",
    defaultSeverity: "CRITICAL",
  },
  {
    code: "EVIDENCE_EXPIRED",
    label: "Evidence expired",
    description: "Evidence referenced by the case has expired per §6 rules.",
    defaultSeverity: "MEDIUM",
  },
];

// -----------------------------------------------------------------------------
// State machine for allowed transitions per §5C
// -----------------------------------------------------------------------------

/**
 * Per §5C, "Each exception has stable code, owner, severity, required
 * evidence, clock, allowed transitions, escalation and closure reason."
 *
 * The allowed transitions follow a stable base state machine:
 *
 *   OPEN → IN_PROGRESS → RESOLVED → CLOSED
 *   OPEN | IN_PROGRESS | RESOLVED → ESCALATED
 *   ESCALATED → IN_PROGRESS | RESOLVED | CLOSED
 *
 * CLOSED is terminal (no further transitions). Closed cases retain the
 * history and evidence that justified closure.
 */
export const TRANSITIONS: Record<ExceptionStatus, ExceptionStatus[]> = {
  OPEN: ["IN_PROGRESS", "ESCALATED"],
  IN_PROGRESS: ["ESCALATED", "RESOLVED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "ESCALATED"],
  CLOSED: [],
};

// -----------------------------------------------------------------------------
// Sample exception cases (Pilot A demo)
// -----------------------------------------------------------------------------

/**
 * Five sample exception cases for the Pilot A demonstrator. All entries are
 * synthetic and labeled accordingly per §0.
 */
export const EXCEPTION_CASES: ExceptionCase[] = [
  {
    caseId: "EXC-PILOTA-001",
    code: "DUPLICATE_EVENT",
    severity: "MEDIUM",
    status: "RESOLVED",
    owner: "ops-reconciliation",
    requiredEvidence: ["eventTimeline", "duplicateProof"],
    clock: "2026-10-11T09:30:00Z",
    allowedTransitions: TRANSITIONS["RESOLVED"],
    escalation: "If not closed within 24h, escalate to ops-lead.",
    closureReason: "Duplicate detected and suppressed; reconciliation matched.",
    history: [
      {
        timestamp: "2026-10-11T09:01:00Z",
        actor: "system",
        action: "OPEN",
        reason: "Duplicate settlement event detected.",
        evidenceRef: "sha256:EXC-001:open",
      },
      {
        timestamp: "2026-10-11T09:05:00Z",
        actor: "ops-reconciliation",
        action: "RESOLVED",
        reason: "Duplicate confirmed and suppressed.",
        evidenceRef: "sha256:EXC-001:resolve",
      },
    ],
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    caseId: "EXC-PILOTA-002",
    code: "RECONCILIATION_BREAK",
    severity: "HIGH",
    status: "IN_PROGRESS",
    owner: "ops-reconciliation",
    requiredEvidence: ["canonicalLedger", "bankSubledger", "toleranceBreachProof"],
    clock: "2026-10-11T12:00:00Z",
    allowedTransitions: TRANSITIONS["IN_PROGRESS"],
    escalation: "Escalate to finance-controller if not resolved by clock.",
    closureReason: null,
    history: [
      {
        timestamp: "2026-10-11T10:00:04Z",
        actor: "system",
        action: "OPEN",
        reason: "12 bps tolerance breach between canonical and bank subledger.",
        evidenceRef: "sha256:EXC-002:open",
      },
      {
        timestamp: "2026-10-11T10:05:00Z",
        actor: "ops-reconciliation",
        action: "IN_PROGRESS",
        reason: "Investigating source of break.",
        evidenceRef: "sha256:EXC-002:inprogress",
      },
    ],
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    caseId: "EXC-PILOTA-003",
    code: "PROVIDER_OUTAGE",
    severity: "HIGH",
    status: "ESCALATED",
    owner: "ops-reconciliation",
    requiredEvidence: ["providerStatusLog", "failoverProof"],
    clock: "2026-10-11T11:00:00Z",
    allowedTransitions: TRANSITIONS["ESCALATED"],
    escalation: "Escalated to ops-lead after 3-minute outage threshold.",
    closureReason: null,
    history: [
      {
        timestamp: "2026-10-11T10:30:00Z",
        actor: "system",
        action: "OPEN",
        reason: "Provider A API unreachable.",
        evidenceRef: "sha256:EXC-003:open",
      },
      {
        timestamp: "2026-10-11T10:33:00Z",
        actor: "system",
        action: "ESCALATED",
        reason: "Outage exceeded 3-minute threshold.",
        evidenceRef: "sha256:EXC-003:escalate",
      },
    ],
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    caseId: "EXC-PILOTA-004",
    code: "REQUIRED_EVIDENCE_MISSING",
    severity: "HIGH",
    status: "OPEN",
    owner: "ops-evidence",
    requiredEvidence: ["custodianConfirmation", "finalityProof"],
    clock: "2026-10-12T00:00:00Z",
    allowedTransitions: TRANSITIONS["OPEN"],
    escalation: "Escalate to ops-lead if not resolved by clock.",
    closureReason: null,
    history: [
      {
        timestamp: "2026-10-11T11:30:00Z",
        actor: "system",
        action: "OPEN",
        reason: "Custodian confirmation absent 90s after settlement.",
        evidenceRef: "sha256:EXC-004:open",
      },
    ],
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    caseId: "EXC-PILOTA-005",
    code: "POLICY_CONTRADICTION",
    severity: "HIGH",
    status: "CLOSED",
    owner: "policy-governance",
    requiredEvidence: ["policyDiff", "evidenceTrace"],
    clock: "2026-10-11T13:00:00Z",
    allowedTransitions: TRANSITIONS["CLOSED"],
    escalation: "n/a — case closed.",
    closureReason:
      "Policy v1.1 tightened tolerance mid-scenario; breach correctly flagged; no retroactive action required.",
    history: [
      {
        timestamp: "2026-10-11T12:05:00Z",
        actor: "system",
        action: "OPEN",
        reason: "Active policy v1.1 contradicted evidence recorded under v1.0.",
        evidenceRef: "sha256:EXC-005:open",
      },
      {
        timestamp: "2026-10-11T12:10:00Z",
        actor: "policy-governance",
        action: "RESOLVED",
        reason: "Verified policy boundary; breach correctly flagged.",
        evidenceRef: "sha256:EXC-005:resolve",
      },
      {
        timestamp: "2026-10-11T12:15:00Z",
        actor: "policy-governance",
        action: "CLOSED",
        reason: "No further action required; evidence retained for audit.",
        evidenceRef: "sha256:EXC-005:close",
      },
    ],
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
];

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Per §5C, opening a new case requires:
 *   - a stable code (one of EXCEPTION_CODES)
 *   - an owner
 *   - a severity (defaults from the code if not overridden)
 *   - required evidence appropriate to the code
 *
 * The case opens in status OPEN with the base OPEN allowed transitions.
 */
export function openExceptionCase(
  code: string,
  severity: ExceptionSeverity,
  owner: string,
  description: string,
): ExceptionCase {
  const codeDef = EXCEPTION_CODES.find((c) => c.code === code);
  const effectiveSeverity: ExceptionSeverity = severity ?? codeDef?.defaultSeverity ?? "MEDIUM";
  const caseId = `EXC-PILOTA-${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
  const now = new Date().toISOString();
  // 24h default clock — Pilot A synthetic; a real workflow would derive
  // the clock from the code/severity policy registry.
  const clock = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const requiredEvidence = deriveRequiredEvidence(code);

  return {
    caseId,
    code,
    severity: effectiveSeverity,
    status: "OPEN",
    owner,
    requiredEvidence,
    clock,
    allowedTransitions: TRANSITIONS["OPEN"],
    escalation: `Escalate to ops-lead if not resolved by clock (${clock}).`,
    closureReason: null,
    history: [
      {
        timestamp: now,
        actor: owner,
        action: "OPEN",
        reason: description || `New ${code} case opened.`,
        evidenceRef: `sha256:${caseId}:open`,
      },
    ],
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  };
}

/**
 * Per §5C, "Closed cases retain the history and evidence that justified
 * closure." transitionExceptionCase validates the requested transition
 * against the case's allowedTransitions before applying it, then appends an
 * immutable history entry. Invalid transitions throw.
 */
export function transitionExceptionCase(
  caseId: string,
  newStatus: ExceptionStatus,
  actor: string,
  reason: string,
  evidenceRef: string,
): ExceptionCase {
  const existing = EXCEPTION_CASES.find((c) => c.caseId === caseId);
  if (!existing) {
    throw new Error(`Exception case not found: ${caseId}`);
  }

  if (existing.status === newStatus) {
    throw new Error(`Case ${caseId} is already in status ${newStatus}.`);
  }

  if (!existing.allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Illegal transition for case ${caseId}: ${existing.status} → ${newStatus}. ` +
        `Allowed: ${existing.allowedTransitions.join(", ") || "(none — terminal)"}`,
    );
  }

  const now = new Date().toISOString();
  const isClosure = newStatus === "CLOSED";

  // Append-only history. Original history array is preserved unchanged.
  const updatedHistory: ExceptionHistoryEntry[] = [
    ...existing.history,
    {
      timestamp: now,
      actor,
      action: newStatus,
      reason,
      evidenceRef,
    },
  ];

  const updated: ExceptionCase = {
    ...existing,
    status: newStatus,
    allowedTransitions: TRANSITIONS[newStatus],
    closureReason: isClosure ? reason : existing.closureReason,
    history: updatedHistory,
  };

  return updated;
}

/**
 * Derive required evidence types per exception code. In a real workflow
 * this would come from a policy registry; for Pilot A it is a stable
 * synthetic mapping that satisfies §5C's "required evidence" requirement.
 */
function deriveRequiredEvidence(code: string): string[] {
  switch (code) {
    case "MISSING_ITEM":
      return ["expectedItemsManifest", "missingItemRef"];
    case "RESPONSIBLE_PARTY_UNKNOWN":
      return ["partyManifest", "auditTrail"];
    case "REQUIRED_EVIDENCE_MISSING":
      return ["requiredEvidenceManifest"];
    case "CLOCK_EXPIRED":
      return ["clockState", "escalationLog"];
    case "RECONCILIATION_BREAK":
      return ["canonicalLedger", "bankSubledger", "toleranceBreachProof"];
    case "PROVIDER_OUTAGE":
      return ["providerStatusLog", "failoverProof"];
    case "DUPLICATE_EVENT":
      return ["eventTimeline", "duplicateProof"];
    case "POLICY_CONTRADICTION":
      return ["policyDiff", "evidenceTrace"];
    case "UNAUTHORIZED_ACCESS":
      return ["identityProof", "authorizationMatrix"];
    case "EVIDENCE_EXPIRED":
      return ["evidenceExpiryLog", "policyVersion"];
    default:
      return ["evidenceRef"];
  }
}

/**
 * Return all sample exception cases (Pilot A demo catalog).
 */
export function listExceptionCases(): ExceptionCase[] {
  return EXCEPTION_CASES;
}
