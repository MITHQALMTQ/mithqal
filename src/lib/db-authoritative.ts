/**
 * MITHQAL v26.0 §6.1 / D-006 — Authoritative Database Writer Pattern
 *
 * Single authoritative writer = Neon Postgres. Turso (libSQL) is a
 * read-only projection that consumes OutboxEvents via at-least-once
 * delivery + InboxEvent idempotency. There is exactly one writer per
 * instruction; there is no dual-write; there is no projection that
 * can fail back to being authoritative.
 *
 * Blueprint:
 *   - §6.1 authoritative writer definition
 *   - §6.2 outbox/inbox pattern
 *   - §6.8 projection watermarks
 *   - §11.3 D-006 — Neon authoritative, Turso projection
 *   - Appendix B.1..B.4 — record shapes
 */

export type AuthoritativeBackend = "neon" | "turso-demo-only";

/**
 * The authoritative backend. Defaults to "neon" per v26.0 §6.1 / §11.3 D-006.
 * Setting MITHQAL_AUTHORITATIVE_BACKEND to "turso-demo-only" is
 * PERMITTED only for local demo environments; production reads will
 * fail closed if this is not "neon".
 */
export function getAuthoritativeBackend(): AuthoritativeBackend {
  const raw = (process.env.MITHQAL_AUTHORITATIVE_BACKEND ?? "neon").trim().toLowerCase();
  if (raw === "turso-demo-only" || raw === "turso") {
    // Normalize the legacy "turso" string for the demo-only path.
    return "turso-demo-only";
  }
  return "neon";
}

/**
 * The projection backend. Defaults to "turso" (libSQL) per §6.1 / D-006.
 * Projections are eventually consistent, watermark-gated, and must
 * never be used as authoritative writers.
 */
export function getProjectionBackend(): "turso" | "none" {
  const raw = (process.env.MITHQAL_PROJECTION_BACKEND ?? "turso").trim().toLowerCase();
  return raw === "none" ? "none" : "turso";
}

/**
 * True when the operator is running in demo-only mode
 * (MITHQAL_AUTHORITATIVE_BACKEND != "neon"). Demo-only mode MUST be
 * surfaced on every external response so reviewers can never
 * mistake a demo for production-authorized state.
 */
export function isDemoOnlyMode(): boolean {
  return getAuthoritativeBackend() !== "neon";
}

export interface WriterStatusSummary {
  authoritativeBackend: AuthoritativeBackend;
  projectionBackend: "turso" | "none";
  demoOnly: boolean;
  productionAuthorized: boolean;
  honestState: string;
}

export function getWriterStatusSummary(): WriterStatusSummary {
  const authoritativeBackend = getAuthoritativeBackend();
  const projectionBackend = getProjectionBackend();
  const demoOnly = isDemoOnlyMode();
  const productionAuthorized =
    (process.env.MITHQAL_PRODUCTION_AUTHORIZED ?? "false").trim().toLowerCase() === "true";

  const honestState = demoOnly
    ? "DEMO-ONLY — Neon is not authoritative; productionAuthorized MUST remain false."
    : productionAuthorized
      ? "PRODUCTION-AUTHORIZED — Neon authoritative, Turso projection. All G0..G11 gates must be satisfied."
      : "PILOT — Neon authoritative, Turso projection. Production authorization is false per default (D-012).";

  return {
    authoritativeBackend,
    projectionBackend,
    demoOnly,
    productionAuthorized,
    honestState,
  };
}

// ---------------------------------------------------------------------------
// Appendix B.3 — OutboxEvent row (§6.2 step 1)
// ---------------------------------------------------------------------------

/**
 * OutboxEvent row as emitted by the authoritative writer.
 * Every authoritative write MUST be accompanied by an OutboxEvent
 * row in the same transaction (transactional outbox pattern).
 */
export interface OutboxRow {
  outboxId: string;
  eventId: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  eventType: string;
  schemaVersion: string;
  payloadRef: string | null;
  payloadHash: string;
  createdAt: string;
  nextAttemptAt: string;
  attemptCount: number;
  dispatchStatus: "PENDING" | "DISPATCHED" | "DEAD_LETTER" | "REPLAYED";
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
  consumerDedupeKey: string;
  traceId: string | null;
  errorCategory: string | null;
}

// ---------------------------------------------------------------------------
// §6.8 — Projection Watermark
// ---------------------------------------------------------------------------

/**
 * Watermark for a single projection. Projections are considered
 * STALE when `lagMs` exceeds the EVENTUAL_CONSISTENCY_PROJECTION
 * tolerance (1000 ms) per §5.3.
 */
export interface ProjectionWatermark {
  projectionName: string;
  lastAppliedEventId: string;
  lastAppliedSequence: number;
  sourceSnapshotVersion: string;
  updatedAt: string;
  projectionSchemaVersion: string;
  isStale: boolean;
  lagMs: number;
}

// ---------------------------------------------------------------------------
// Appendix B.1 — Instruction record (authoritative write shape)
// ---------------------------------------------------------------------------

export interface InstructionRecord {
  instructionId: string;
  schemaVersion: string;
  institutionId: string;
  tenantId: string;
  sourceSystem: string;
  externalInstructionRef: string | null;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  causationId: string | null;
  assetId: string;
  amount: string;
  debtorObligor: string;
  beneficiaryCreditor: string;
  purpose: string | null;
  requestedExecutionAt: string | null;
  dueAt: string | null;
  fees: string | null;
  applicableLawId: string | null;
  settlementDomainId: string | null;
  jurisdictionSet: string;
  corridorId: string | null;
  contractRef: string | null;
  authorizationScope: string | null;
  dataClassification: string;
  currentState: string;
  stateVersion: number;
  policyVersion: string;
  policyHash: string;
  routeCandidates: string;
  selectedRouteId: string | null;
  reasonCodes: string;
  expiry: string | null;
  cancellationRules: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// §6.3 — Idempotency record
// ---------------------------------------------------------------------------

export interface IdempotencyRecord {
  idempotencyKey: string;
  institutionId: string;
  operation: string;
  businessObjectId: string;
  requestHash: string;
  firstOutcome: string;
  firstOutcomeAt: string;
  conflictingBodyHash: string | null;
}

// ---------------------------------------------------------------------------
// Appendix B.2 — Policy decision record
// ---------------------------------------------------------------------------

export interface PolicyDecisionRecord {
  decisionId: string;
  subjectIds: string;
  policyVersion: string;
  policyHash: string;
  inputsHash: string;
  decision: string;
  reasonCodes: string;
  evaluatedAt: string;
  actorService: string;
  evidenceRefs: string;
  conditions: string | null;
  conditionsExpiry: string | null;
  conditionsOwner: string | null;
  conditionsApproval: string | null;
}

// ---------------------------------------------------------------------------
// Appendix B.4 — EvidenceArtifact record
// ---------------------------------------------------------------------------

export interface EvidenceArtifactRecord {
  evidenceId: string;
  claimOrDecisionId: string;
  sourceKind: string;
  provenance: string;
  issuer: string;
  sourceSystem: string | null;
  operator: string | null;
  observedAt: string;
  ingestedAt: string;
  effectiveAt: string;
  expiresAt: string | null;
  contentHash: string;
  signature: string | null;
  scope: string;
  limitations: string | null;
  reviewStatus: string;
  classification: string;
  linkedCommitSha: string | null;
  linkedPolicyHash: string | null;
  linkedTransactionId: string | null;
  linkedGateId: string | null;
}

// ---------------------------------------------------------------------------
// §9.1 + Appendix B.4 — Gate decision record
// ---------------------------------------------------------------------------

export interface GateDecisionRecord {
  decisionId: string;
  gateId: string;
  scope: string;
  evidenceRefs: string;
  unmetRequirements: string;
  decision: string;
  conditions: string | null;
  conditionsExpiry: string | null;
  approvers: string;
  decisionAt: string;
  blueprintReleaseHash: string | null;
  priorDecisionId: string | null;
  nextReviewAt: string | null;
}

// ---------------------------------------------------------------------------
// Appendix B.4 + §5.3 — Reconciliation case record
// ---------------------------------------------------------------------------

export interface ReconciliationCaseRecord {
  caseId: string;
  sourceSet: string;
  sourceVersion: string;
  cutoff: string;
  expected: string;
  actual: string;
  discrepancyClass: string;
  tolerancePolicyVersion: string;
  severity: string;
  owner: string;
  correction: string | null;
  closureApprover: string | null;
  closedAt: string | null;
}
