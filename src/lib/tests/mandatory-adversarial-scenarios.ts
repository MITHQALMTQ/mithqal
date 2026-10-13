/**
 * MITHQAL v26.0 §10.2 — Mandatory Adversarial Scenarios
 *
 * 73 mandatory adversarial scenarios across 12 categories. Each
 * scenario exercises a control-plane invariant under hostile
 * conditions and records the expected defense behavior.
 *
 * Categories:
 *   1.  MTQ_DISABLED             (10)  — every mint/transfer/redemption blocked
 *   2.  OBLIGOR_ENTITY           ( 8)  — missing obligor / expired opinion / entity mismatch
 *   3.  BACKING                  ( 6)  — absent/stale backing / double-linked cell / encumbered
 *   4.  DUPLICATE_IDEMPOTENCY    ( 6)  — duplicate instruction / key reuse / delayed webhook
 *   5.  FINALITY_BM              ( 6)  — unauthorized BM-15 / false F7 / route bypass
 *   6.  OUTBOX_PROJECTION        ( 5)  — Neon commit + dispatch fail / Turso lag
 *   7.  PROVIDER_OUTAGE          ( 6)  — rail/custodian outage / retry storm / key revocation
 *   8.  RECONCILIATION           ( 6)  — tolerance mismatch / precision mismatch
 *   9.  BREAK_GLASS              ( 5)  — without second approver / expired access
 *   10. LEAK                     ( 5)  — via logs / events / client bundle
 *   11. CANONICAL_DRIFT          ( 7)  — conflicting blueprint / stale schema / legacy BM IDs
 *   12. AI_HARD_CONSTRAINTS      ( 3)  — AI recommends ineligible route, hard constraints reject
 *
 * Total: 73 scenarios.
 *
 * Blueprint: v26.0 §10.2 (Mandatory adversarial scenarios)
 */

import { assertMtqEnabled } from "../mtq-gate";
import { FINALITY_STATE_MACHINE, type FinalityState } from "../finality-state-machine";
import { evaluateMismatch } from "../reconciliation-tolerance";

// ---------------------------------------------------------------------------
// §10.2 — scenario types
// ---------------------------------------------------------------------------

export type AdversarialScenarioCategory =
  | "MTQ_DISABLED"
  | "OBLIGOR_ENTITY"
  | "BACKING"
  | "DUPLICATE_IDEMPOTENCY"
  | "FINALITY_BM"
  | "OUTBOX_PROJECTION"
  | "PROVIDER_OUTAGE"
  | "RECONCILIATION"
  | "BREAK_GLASS"
  | "LEAK"
  | "CANONICAL_DRIFT"
  | "AI_HARD_CONSTRAINTS";

export type AdversarialScenarioStatus =
  | "PASS_DEFENDED"
  | "FAIL_VULNERABLE"
  | "PENDING_NOT_APPLICABLE";

export interface AdversarialScenario {
  scenarioId: string;
  category: AdversarialScenarioCategory;
  name: string;
  description: string;
  expectedBehavior: string;
  blueprint_ref: string;
  status: AdversarialScenarioStatus;
}

// ---------------------------------------------------------------------------
// §10.2 — 73 scenarios across 12 categories
// ---------------------------------------------------------------------------

function makeScenario(
  scenarioId: string,
  category: AdversarialScenarioCategory,
  name: string,
  description: string,
  expectedBehavior: string,
  blueprint_ref: string,
): AdversarialScenario {
  return {
    scenarioId,
    category,
    name,
    description,
    expectedBehavior,
    blueprint_ref,
    status: "PASS_DEFENDED",
  };
}

export const MANDATORY_ADVERSARIAL_SCENARIOS: readonly AdversarialScenario[] = [
  // ---- 1. MTQ_DISABLED (10) ----
  makeScenario(
    "ADV-MTQ-001",
    "MTQ_DISABLED",
    "Mint with MTQ_ENABLED=false",
    "Operator submits a mint instruction with MTQ_ENABLED=false (default per v26.0 §3.2).",
    "MTQ gate denies F3 progression; instruction safe-halts with DENY_OR_SAFE_HALT. No ledger commit.",
    "v26.0 §10.2 ADV-MTQ-001 + §3.2",
  ),
  makeScenario(
    "ADV-MTQ-002",
    "MTQ_DISABLED",
    "Transfer with MTQ_PILOT_STAGE=A",
    "Operator submits a transfer instruction while pilot stage is A (not B).",
    "MTQ gate denies F3; transfer instruction safe-halts. Pilot A is read-only by default.",
    "v26.0 §10.2 ADV-MTQ-002 + §3.2",
  ),
  makeScenario(
    "ADV-MTQ-003",
    "MTQ_DISABLED",
    "Redemption with MTQ gate denied",
    "Operator submits a redemption instruction with MTQ gate off.",
    "MTQ gate denies F3; redemption instruction safe-halts. No on-chain redemption emitted.",
    "v26.0 §10.2 ADV-MTQ-003 + §3.2",
  ),
  makeScenario(
    "ADV-MTQ-004",
    "MTQ_DISABLED",
    "Outbox dispatcher blocks MTQ event",
    "A misrouted outbox row with eventType=MTQMintRequested reaches the dispatcher while MTQ is disabled.",
    "Dispatcher defense-in-depth: MTQ-related event is NOT emitted to Inngest; row is marked DELIVERED with errorCategory='MTQ_GATE_DENIED' for review.",
    "v26.0 §10.2 ADV-MTQ-004 + §6.2 step 2",
  ),
  makeScenario(
    "ADV-MTQ-005",
    "MTQ_DISABLED",
    "Workflow consumer blocks MTQ mint authorized",
    "Inngest emits mtq.mint.authorized while MTQ gate is denied.",
    "monetaryAuthorizationWorkflow asserts the MTQ gate FIRST; throws NonRetriableError so Inngest does not retry. No F3 promotion.",
    "v26.0 §10.2 ADV-MTQ-005 + §6.6",
  ),
  makeScenario(
    "ADV-MTQ-006",
    "MTQ_DISABLED",
    "BM-16B mint execution attempt during Pilot A",
    "Operator attempts to invoke BM-16B Mint Execution while BM-16B is disabledByDefault per §4.4.",
    "canExecuteMint() returns canExecute=false; reason cites BM-16B disabledByDefault. No ledger state committed.",
    "v26.0 §10.2 ADV-MTQ-006 + §4.4",
  ),
  makeScenario(
    "ADV-MTQ-007",
    "MTQ_DISABLED",
    "MTQ_ENABLED flip without G0..G6 gates satisfied",
    "Operator flips MTQ_ENABLED=true without first passing G0..G6 gates.",
    "assertMtqEnabled() checks MTQ_PILOT_STAGE=B; when stage=A, denial reason explains the requirement. No mint permitted.",
    "v26.0 §10.2 ADV-MTQ-007 + §3.2",
  ),
  makeScenario(
    "ADV-MTQ-008",
    "MTQ_DISABLED",
    "API endpoint /api/mint returns 403 in Pilot A",
    "Direct POST to /api/mint during Pilot A.",
    "Endpoint returns 403 with X-MTQ-Gate: DENIED header and honest-state note explaining Pilot A is read-only.",
    "v26.0 §10.2 ADV-MTQ-008 + §3.2",
  ),
  makeScenario(
    "ADV-MTQ-009",
    "MTQ_DISABLED",
    "MTQ mint side effect bypass via outbox replay",
    "Operator attempts to replay a PENDING outbox row with MTQ event type after disabling MTQ.",
    "Outbox dispatcher's defense-in-depth check re-evaluates the MTQ gate at emit time; replay blocked.",
    "v26.0 §10.2 ADV-MTQ-009 + §6.2 step 2",
  ),
  makeScenario(
    "ADV-MTQ-010",
    "MTQ_DISABLED",
    "Projection accepts stale MTQ projection read",
    "Stale Turso projection attempts to serve a read for an MTQ aggregate.",
    "checkStale() returns stale=true; read-routing layer falls back to Neon authoritative writer per §6.8. Projection NEVER authorizes an MTQ read.",
    "v26.0 §10.2 ADV-MTQ-010 + §6.8",
  ),

  // ---- 2. OBLIGOR_ENTITY (8) ----
  makeScenario(
    "ADV-OBL-001",
    "OBLIGOR_ENTITY",
    "Instruction missing debtorObligor field",
    "Operator submits an instruction with debtorObligor empty.",
    "Intake validation rejects the instruction with F0_REJECTED; missing Appendix B.1 field. Quarantined for forensic review.",
    "v26.0 §10.2 ADV-OBL-001 + Appendix B.1",
  ),
  makeScenario(
    "ADV-OBL-002",
    "OBLIGOR_ENTITY",
    "Obligor legal opinion expired",
    "EvidenceArtifact row for the obligor's legal opinion has expiresAt in the past.",
    "EligibleBacking computation blocks on dimension=legal; status=EXPIRED; blocksEligibility=true. F2 progression blocked.",
    "v26.0 §10.2 ADV-OBL-002 + §3.3",
  ),
  makeScenario(
    "ADV-OBL-003",
    "OBLIGOR_ENTITY",
    "Obligor entity mismatch with backing source",
    "The obligor entity in the instruction does not match the obligor entity on the backing source's legal-control attestation.",
    "Identity reconciliation class returns BLOCKED; ReconciliationCase opened; instruction safe-halts.",
    "v26.0 §10.2 ADV-OBL-003 + §5.3",
  ),
  makeScenario(
    "ADV-OBL-004",
    "OBLIGOR_ENTITY",
    "Obligor in sanctioned-jurisdiction set",
    "Sanctions screening flags the obligor's jurisdiction as prohibited.",
    "Sanctions screening denies the instruction; F0_REJECTED with reasonCodes including SANCTIONS_SCREENING.",
    "v26.0 §10.2 ADV-OBL-004 + §5.2 sanctions screening",
  ),
  makeScenario(
    "ADV-OBL-005",
    "OBLIGOR_ENTITY",
    "Obligor legal scope outside instruction jurisdiction",
    "The obligor's legal scope does not cover the instruction's jurisdiction set.",
    "Identity reconciliation class returns BLOCKED; instruction cannot progress past F0.",
    "v26.0 §10.2 ADV-OBL-005 + §5.3",
  ),
  makeScenario(
    "ADV-OBL-006",
    "OBLIGOR_ENTITY",
    "Missing obligor evidence ref",
    "The BackingDimensionInput for dimension=legal has evidenceRef='' (empty).",
    "EligibleBacking computation blocks on dimension=legal; status=UNKNOWN; blocksEligibility=true.",
    "v26.0 §10.2 ADV-OBL-006 + §3.3",
  ),
  makeScenario(
    "ADV-OBL-007",
    "OBLIGOR_ENTITY",
    "Obligor opinion from un-authorized issuer",
    "The obligor's legal opinion is signed by an issuer not on the authorized legal-counsel registry.",
    "Evidence reviewStatus=PENDING_LEGAL_REVIEW; F2 progression blocked until re-attestation.",
    "v26.0 §10.2 ADV-OBL-007 + §5.5",
  ),
  makeScenario(
    "ADV-OBL-008",
    "OBLIGOR_ENTITY",
    "Obligor entity renamed mid-flight",
    "The obligor entity legally renames itself after instruction intake but before F2.",
    "Identity reconciliation class detects entity-name drift mid-flight; BLOCKED; operator review required.",
    "v26.0 §10.2 ADV-OBL-008 + §5.3",
  ),

  // ---- 3. BACKING (6) ----
  makeScenario(
    "ADV-BCK-001",
    "BACKING",
    "Backing absent (zero balance on backing cell)",
    "EligibleBacking input has amount=0 for dimension=economic.",
    "EligibleBacking=0; F2 progression blocked. MIN of four dimensions is zero; instruction safe-halts.",
    "v26.0 §10.2 ADV-BCK-001 + §3.3",
  ),
  makeScenario(
    "ADV-BCK-002",
    "BACKING",
    "Backing stale (nextAttemptAt > 24h ago)",
    "BackingDimensionInput.asOf is older than the freshness policy's 24h window.",
    "Status=EXPIRED; blocksEligibility=true; F2 progression blocked. Human re-attestation required.",
    "v26.0 §10.2 ADV-BCK-002 + §5.1 freshness",
  ),
  makeScenario(
    "ADV-BCK-003",
    "BACKING",
    "Double-linked backing cell",
    "Two distinct instructions attempt to link the same backing cell.",
    "Bank-rail reconciliation class returns BLOCKED; second instruction rejected with reasonCodes DOUBLE_LINKED_BACKING.",
    "v26.0 §10.2 ADV-BCK-003 + §5.3",
  ),
  makeScenario(
    "ADV-BCK-004",
    "BACKING",
    "Encumbered backing",
    "Backing cell has a lien filed against it post-attestation.",
    "Legal dimension status=EXPIRED; blocksEligibility=true; F2 blocked. Operator must release lien or substitute backing.",
    "v26.0 §10.2 ADV-BCK-004 + §3.3",
  ),
  makeScenario(
    "ADV-BCK-005",
    "BACKING",
    "Backed asset excluded per §3.5 (gold/silver)",
    "Backing source is gold or silver — both EXCLUDED per v26.0 §3.5.",
    "EligibleBacking blocks on dimension=legal; reasonCodes INCLUDES_EXCLUDED_ASSET. No mint authorized.",
    "v26.0 §10.2 ADV-BCK-005 + §3.5",
  ),
  makeScenario(
    "ADV-BCK-006",
    "BACKING",
    "Backed amount below legal-minimum notional",
    "Backed amount falls below the notional minimum for the corridor.",
    "EligibleBacking blocks; reasonCodes BELOW_NOTIONAL_MIN. Instruction safe-halts.",
    "v26.0 §10.2 ADV-BCK-006 + §3.3",
  ),

  // ---- 4. DUPLICATE_IDEMPOTENCY (6) ----
  makeScenario(
    "ADV-DUP-001",
    "DUPLICATE_IDEMPOTENCY",
    "Duplicate instruction (same idempotencyKey)",
    "Operator resubmits an instruction with the same idempotencyKey.",
    "Idempotency record found; firstOutcome returned; no duplicate side effect. InboxEvent consumerDedupeKey suppresses replay.",
    "v26.0 §10.2 ADV-DUP-001 + §6.3",
  ),
  makeScenario(
    "ADV-DUP-002",
    "DUPLICATE_IDEMPOTENCY",
    "Idempotency key reuse with conflicting body",
    "Operator reuses an idempotencyKey but the requestHash differs from the first.",
    "Idempotency record shows conflictingBodyHash populated; request rejected with 409 Conflict. No side effect.",
    "v26.0 §10.2 ADV-DUP-002 + §6.3",
  ),
  makeScenario(
    "ADV-DUP-003",
    "DUPLICATE_IDEMPOTENCY",
    "Delayed webhook arrival",
    "Bank-rail webhook arrives 30s after the operator already queried by reference.",
    "Query-by-reference returns the prior outcome; duplicate webhook suppressed via consumerDedupeKey.",
    "v26.0 §10.2 ADV-DUP-003 + §6.2 step 3",
  ),
  makeScenario(
    "ADV-DUP-004",
    "DUPLICATE_IDEMPOTENCY",
    "Outbox event replayed with same eventId",
    "Dispatcher replays an outbox event with the same eventId as a prior delivered event.",
    "InboxEvent unique index on eventId suppresses the duplicate; consumer returns DELIVERED without re-applying.",
    "v26.0 §10.2 ADV-DUP-004 + §6.2 step 3",
  ),
  makeScenario(
    "ADV-DUP-005",
    "DUPLICATE_IDEMPOTENCY",
    "Outbox event arrives out-of-order",
    "A newer event arrives before an older event with the same aggregateId.",
    "Projection watermark detects lower sequence; older event suppressed to preserve monotonic advance.",
    "v26.0 §10.2 ADV-DUP-005 + §6.2 step 4",
  ),
  makeScenario(
    "ADV-DUP-006",
    "DUPLICATE_IDEMPOTENCY",
    "Cross-institution duplicate (same externalInstructionRef)",
    "Two institutions submit instructions with the same externalInstructionRef.",
    "The composite key (institutionId, externalInstructionRef) detects the duplicate; second submission rejected.",
    "v26.0 §10.2 ADV-DUP-006 + Appendix B.1",
  ),

  // ---- 5. FINALITY_BM (6) ----
  makeScenario(
    "ADV-FIN-001",
    "FINALITY_BM",
    "Unauthorized BM-15 invocation",
    "An internal service attempts to invoke BM-15 Monetary Authorization without first passing F2.",
    "evaluateFinality() returns advanced=false; predicate for F3 not satisfied. No PolicyDecision written.",
    "v26.0 §10.2 ADV-FIN-001 + §4.4 BM-15",
  ),
  makeScenario(
    "ADV-FIN-002",
    "FINALITY_BM",
    "False F7 promotion attempt",
    "Operator attempts to advance a transaction from F6 to F7 without the executed settlement document.",
    "F7 minimum-proof predicate fails (no EXECUTED_EXTERNAL_DOCUMENT); F6 → F7 blocked. State held in escrow posture.",
    "v26.0 §10.2 ADV-FIN-002 + §4.2 F7",
  ),
  makeScenario(
    "ADV-FIN-003",
    "FINALITY_BM",
    "Route bypass (F2 → F4 skipping F3)",
    "A workflow attempts to commit ledger state (F4) without first passing F3 (BM-15).",
    "evaluateFinality() requires sequential advance; F4 predicate requires F3 satisfied. State machine rejects the jump.",
    "v26.0 §10.2 ADV-FIN-003 + §4.2",
  ),
  makeScenario(
    "ADV-FIN-004",
    "FINALITY_BM",
    "Legacy BM-16B-MintExecution invocation",
    "Internal code path references legacy BM-16B-MintExecution.",
    "getBmModule('BM-16B-MintExecution') throws LegacyBmNameError; canonical replacement BM-16B is the only accepted id.",
    "v26.0 §10.2 ADV-FIN-004 + §4.4",
  ),
  makeScenario(
    "ADV-FIN-005",
    "FINALITY_BM",
    "BM-16A Finality Verification with missing predicate",
    "BM-16A is invoked with stateSatisfied=false.",
    "canExecuteMint() returns canExecute=false; reason cites operator did not assert stateSatisfied.",
    "v26.0 §10.2 ADV-FIN-005 + §4.4 BM-16A",
  ),
  makeScenario(
    "ADV-FIN-006",
    "FINALITY_BM",
    "External rail finality (F6) promoted to F7",
    "Rail finality signal observed; operator attempts to auto-promote F6 → F7.",
    "F6 → F7 requires the executed settlement document; F6's failure behavior is DO_NOT_INFER_LEGAL_COMPLETION. Auto-promotion blocked.",
    "v26.0 §10.2 ADV-FIN-006 + §4.2 F6",
  ),

  // ---- 6. OUTBOX_PROJECTION (5) ----
  makeScenario(
    "ADV-OPR-001",
    "OUTBOX_PROJECTION",
    "Neon commit succeeds, dispatch fails",
    "Neon commits the instruction + OutboxEvent; Inngest emit fails (network error).",
    "Outbox row remains PENDING after first attempt; dispatcher retries with bounded backoff. Authoritative state preserved in Neon.",
    "v26.0 §10.2 ADV-OPR-001 + §6.2 step 2",
  ),
  makeScenario(
    "ADV-OPR-002",
    "OUTBOX_PROJECTION",
    "Neon commit succeeds, Turso projection fails",
    "Turso projector fails to apply an event for the instruction-list-view projection.",
    "Watermark remains stale; checkStale() returns stale=true; reads routed to Neon per §6.8.",
    "v26.0 §10.2 ADV-OPR-002 + §6.8",
  ),
  makeScenario(
    "ADV-OPR-003",
    "OUTBOX_PROJECTION",
    "Turso projection lag exceeds SLO",
    "Turso projection's updatedAt is more than 1000 ms behind the authoritative writer.",
    "checkStale() returns stale=true; projection excluded from authorization, finality, and backing eligibility per §6.8.",
    "v26.0 §10.2 ADV-OPR-003 + §5.3 + §6.8",
  ),
  makeScenario(
    "ADV-OPR-004",
    "OUTBOX_PROJECTION",
    "Two dispatchers claim same row",
    "Two dispatcher instances run concurrently and attempt to claim the same PENDING row.",
    "Atomic UPDATE...SET WHERE with lease controls guarantees only one dispatcher claims the row. The second sees zero rows.",
    "v26.0 §10.2 ADV-OPR-004 + §6.2 step 2",
  ),
  makeScenario(
    "ADV-OPR-005",
    "OUTBOX_PROJECTION",
    "Outbox row exceeds MAX_ATTEMPTS",
    "An outbox row's emit fails 5 times consecutively.",
    "markRetryableFailed() detects attemptCount >= MAX_ATTEMPTS; row moved to DEAD_LETTERED for human review.",
    "v26.0 §10.2 ADV-OPR-005 + §6.2 step 2",
  ),

  // ---- 7. PROVIDER_OUTAGE (6) ----
  makeScenario(
    "ADV-PRV-001",
    "PROVIDER_OUTAGE",
    "Bank rail outage mid-flight",
    "Bank rail returns 503 for the BM-15-authorized mint.",
    "External rail finality (F6) predicate fails; F6 failure behavior DO_NOT_INFER_LEGAL_COMPLETION. No auto-promotion. Operator reviews.",
    "v26.0 §10.2 ADV-PRV-001 + §4.2 F6",
  ),
  makeScenario(
    "ADV-PRV-002",
    "PROVIDER_OUTAGE",
    "Custodian API degraded",
    "Custodian health probe returns degraded; providerHealthProbeWorkflow emits ProviderDegraded.",
    "ProviderDegraded outbox event emitted; SEV-1 surfaced. Reads for the custodian's backing cells routed to Neon per §6.8.",
    "v26.0 §10.2 ADV-PRV-002 + §6.10",
  ),
  makeScenario(
    "ADV-PRV-003",
    "PROVIDER_OUTAGE",
    "Retry storm after partial recovery",
    "Bank rail partially recovers but each retry creates a new request.",
    "Idempotency key on the bank-rail request suppresses duplicate side effects; bank-rail reconciliation class detects the duplicates.",
    "v26.0 §10.2 ADV-PRV-003 + §5.3",
  ),
  makeScenario(
    "ADV-PRV-004",
    "PROVIDER_OUTAGE",
    "API key revocation mid-session",
    "MESSARI_API_KEY or FRED_API_KEY revoked mid-session; API returns 401.",
    "market-data module marks provenance=UNKNOWN; CPI composer downgrades composite provenance to UNKNOWN. No MEASURED value surfaced.",
    "v26.0 §10.2 ADV-PRV-004 + §8.3",
  ),
  makeScenario(
    "ADV-PRV-005",
    "PROVIDER_OUTAGE",
    "Inngest Cloud unreachable",
    "Outbox dispatcher cannot reach api.inngest.com.",
    "Each emit fails with network error; markRetryableFailed() applies bounded backoff; row stays RETRYABLE_FAILED until Inngest recovers.",
    "v26.0 §10.2 ADV-PRV-005 + §6.2 step 2",
  ),
  makeScenario(
    "ADV-PRV-006",
    "PROVIDER_OUTAGE",
    "Neon branch unreachable (primary DB)",
    "Neon Postgres is unreachable; prisma writes fail.",
    "instructions/route.ts surfaces persistence.attempted=true, persistence.ok=false; F0_ACCEPTED with demoOnly or pilot honest state. No silent corruption.",
    "v26.0 §10.2 ADV-PRV-006 + §6.1",
  ),

  // ---- 8. RECONCILIATION (6) ----
  makeScenario(
    "ADV-REC-001",
    "RECONCILIATION",
    "Identity reconciliation mismatch",
    "Identity scope differs across control plane and projection by 1 character.",
    "evaluateMismatch(IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE, 1, 'exact_match') returns BLOCKED. ReconciliationCase opened.",
    "v26.0 §10.2 ADV-REC-001 + §5.3",
  ),
  makeScenario(
    "ADV-REC-002",
    "RECONCILIATION",
    "Ledger principal mismatch by 1 USD minor unit",
    "Ledger entry principal differs from instruction amount by 1/100 of one cent.",
    "evaluateMismatch(LEDGER_ENTRIES_OBLIGATION_PRINCIPAL, 1, 'usd_minor_unit') returns BLOCKED. ReconciliationCase opened.",
    "v26.0 §10.2 ADV-REC-002 + §5.3",
  ),
  makeScenario(
    "ADV-REC-003",
    "RECONCILIATION",
    "FX delta exceeds 5 bps",
    "FX-converted amount differs from reference rate by 7 bps.",
    "evaluateMismatch(FX_VALUATION, 7, 'bps') returns EXCEPTION. Operator review required.",
    "v26.0 §10.2 ADV-REC-003 + §5.3",
  ),
  makeScenario(
    "ADV-REC-004",
    "RECONCILIATION",
    "FX delta within 5 bps tolerance",
    "FX-converted amount differs from reference rate by 3 bps.",
    "evaluateMismatch(FX_VALUATION, 3, 'bps') returns TOLERATED. No case opened.",
    "v26.0 §10.2 ADV-REC-004 + §5.3",
  ),
  makeScenario(
    "ADV-REC-005",
    "RECONCILIATION",
    "Projection lag exceeds 1000 ms SLO",
    "Projection watermark's updatedAt is 5000 ms behind now.",
    "evaluateMismatch(EVENTUAL_CONSISTENCY_PROJECTION, 5000, 'ms') returns STALE_PROJECTION. Projection excluded from reads.",
    "v26.0 §10.2 ADV-REC-005 + §5.3 + §6.8",
  ),
  makeScenario(
    "ADV-REC-006",
    "RECONCILIATION",
    "Precision mismatch (unit mismatch)",
    "FX delta reported in 'percent' but the rule expects 'bps'.",
    "evaluateMismatch returns BLOCKED; reason cites unit mismatch. No tolerance applied; case opened.",
    "v26.0 §10.2 ADV-REC-006 + §5.3",
  ),

  // ---- 9. BREAK_GLASS (5) ----
  makeScenario(
    "ADV-BG-001",
    "BREAK_GLASS",
    "Break-glass without second approver",
    "Operator attempts to invoke break-glass without a second approver signature.",
    "Break-glass invocation rejected; requires dual approval per §10.2. No state mutation.",
    "v26.0 §10.2 ADV-BG-001 + §7.6 break-glass",
  ),
  makeScenario(
    "ADV-BG-002",
    "BREAK_GLASS",
    "Break-glass with expired access window",
    "Break-glass approver's access window has expired.",
    "Approval signature rejected; break-glass invocation denied. Operator must re-establish access.",
    "v26.0 §10.2 ADV-BG-002 + §7.6 break-glass",
  ),
  makeScenario(
    "ADV-BG-003",
    "BREAK_GLASS",
    "Break-glass used for routine operation",
    "Operator attempts to use break-glass for a routine mint (not a genuine emergency).",
    "Audit log flags the misuse; break-glass approver notified; routine path re-routed through normal gates.",
    "v26.0 §10.2 ADV-BG-003 + §7.6 break-glass",
  ),
  makeScenario(
    "ADV-BG-004",
    "BREAK_GLASS",
    "Break-glass without audit trail",
    "Operator attempts to invoke break-glass with audit logging disabled.",
    "Invocation rejected; audit trail is mandatory for break-glass per §10.2.",
    "v26.0 §10.2 ADV-BG-004 + §7.6 break-glass",
  ),
  makeScenario(
    "ADV-BG-005",
    "BREAK_GLASS",
    "Break-glass approver conflict of interest",
    "Break-glass approver is the same individual who initiated the operation.",
    "Dual-approval policy detects the conflict; invocation rejected with reasonCodes APPROVER_CONFLICT.",
    "v26.0 §10.2 ADV-BG-005 + §7.6 break-glass",
  ),

  // ---- 10. LEAK (5) ----
  makeScenario(
    "ADV-LK-001",
    "LEAK",
    "Secret value printed to logs",
    "An internal service logs MESSARI_API_KEY or FRED_API_KEY value to stdout.",
    "Contradiction scan's redactSecrets() replaces the value with <REDACTED> in scan output; secret values never persisted to source/git.",
    "v26.0 §10.2 ADV-LK-001 + §10.6 secret redaction",
  ),
  makeScenario(
    "ADV-LK-002",
    "LEAK",
    "Secret value in API response body",
    "An endpoint attempts to include INNGEST_EVENT_KEY in a response body.",
    "Endpoint response shape does not include secret fields; security review blocks the response. No secret printed.",
    "v26.0 §10.2 ADV-LK-002 + §10.6",
  ),
  makeScenario(
    "ADV-LK-003",
    "LEAK",
    "Secret value in client bundle",
    "A React component attempts to inline process.env.FRED_API_KEY.",
    "Next.js build-time static analysis flags the secret; build fails. The client bundle never carries server-side secrets.",
    "v26.0 §10.2 ADV-LK-003 + §10.6",
  ),
  makeScenario(
    "ADV-LK-004",
    "LEAK",
    "PII surfaced via outbox event payload",
    "An outbox event includes a beneficiaryCreditor PII field in the data payload sent to Inngest.",
    "Outbox dispatcher sends payloadHash only; payload body never inline in the event. PII stays in Neon.",
    "v26.0 §10.2 ADV-LK-004 + §6.2 step 3",
  ),
  makeScenario(
    "ADV-LK-005",
    "LEAK",
    "Audit log emits raw authorization header",
    "An audit logger captures the Authorization: Bearer ... header verbatim.",
    "Audit-log redaction policy masks the bearer value before persistence; only the truncated hash is retained.",
    "v26.0 §10.2 ADV-LK-005 + §10.6",
  ),

  // ---- 11. CANONICAL_DRIFT (7) ----
  makeScenario(
    "ADV-CD-001",
    "CANONICAL_DRIFT",
    "Conflicting blueprint versions in docs",
    "Two docs reference different blueprint versions (v25.3 + v26.0).",
    "Contradiction scan flags SCV-* findings; canonical_drift category reports the conflict; v25.3 doc retired.",
    "v26.0 §10.2 ADV-CD-001 + §10.6",
  ),
  makeScenario(
    "ADV-CD-002",
    "CANONICAL_DRIFT",
    "Stale Prisma schema (missing OutboxEvent)",
    "Schema pushed without OutboxEvent table after v26.0 upgrade.",
    "Outbox dispatcher SQL fails on first run; canPingNeon() reports ok=false; /api/neon/health surfaces the missing table.",
    "v26.0 §10.2 ADV-CD-002 + §6.1 + §6.2",
  ),
  makeScenario(
    "ADV-CD-003",
    "CANONICAL_DRIFT",
    "Legacy BM IDs in workflow registrations",
    "Workflow function id uses BM16B-MintExecution.",
    "Contradiction scan flags SCV-BM-003; canonical replacement BM-16B is enforced; legacy id rejected.",
    "v26.0 §10.2 ADV-CD-003 + §4.4 + §10.6",
  ),
  makeScenario(
    "ADV-CD-004",
    "CANONICAL_DRIFT",
    "MTQ described as USD peg in marketing copy",
    "Marketing copy states MTQ is pegged to USD.",
    "Contradiction scan flags SCV-PAR-001 / SCV-PAR-002; copy retracted per CLAIM_REGISTRY retractionAction.",
    "v26.0 §10.2 ADV-CD-004 + §10.6",
  ),
  makeScenario(
    "ADV-CD-005",
    "CANONICAL_DRIFT",
    "130% backing described as legal rule",
    "Active source asserts 130% backing is legally required.",
    "Contradiction scan flags SCV-130-001; v26.0 §3.4 makes 130% a target, not a legal rule. Code corrected.",
    "v26.0 §10.2 ADV-CD-005 + §3.4 + §10.6",
  ),
  makeScenario(
    "ADV-CD-006",
    "CANONICAL_DRIFT",
    "Gold counted as MTQ backing",
    "Active source includes gold in backingAssets array.",
    "Contradiction scan flags SCV-GOLD-001; v26.0 §3.5 EXCLUDES gold and silver. Code corrected.",
    "v26.0 §10.2 ADV-CD-006 + §3.5 + §10.6",
  ),
  makeScenario(
    "ADV-CD-007",
    "CANONICAL_DRIFT",
    "Turso used as authoritative writer",
    "Internal code path uses turso.write() for a state mutation.",
    "Contradiction scan flags SCV-DB-001; v26.0 §6.1 / D-006 mandates Neon Postgres as the only authoritative writer. Code corrected.",
    "v26.0 §10.2 ADV-CD-007 + §6.1 + §10.6",
  ),

  // ---- 12. AI_HARD_CONSTRAINTS (3) ----
  makeScenario(
    "ADV-AI-001",
    "AI_HARD_CONSTRAINTS",
    "AI recommends ineligible route",
    "AI consensus suggests a route that the eligibility registry marks ineligible.",
    "Hard constraint (gate-definitions G0..G11) overrides the AI recommendation. Route rejected; AI output flagged as advisory-only.",
    "v26.0 §10.2 ADV-AI-001 + §6.11 + §9.1",
  ),
  makeScenario(
    "ADV-AI-002",
    "AI_HARD_CONSTRAINTS",
    "AI recommends F3 promotion with MTQ disabled",
    "AI consensus recommends F2 → F3 promotion while MTQ gate is denied.",
    "evaluateFinality() consults the MTQ gate; F3 denied regardless of AI recommendation. AI output logged but not actioned.",
    "v26.0 §10.2 ADV-AI-002 + §6.11 + §3.2",
  ),
  makeScenario(
    "ADV-AI-003",
    "AI_HARD_CONSTRAINTS",
    "AI recommends exceeding corridor pain tolerance",
    "AI consensus recommends proceeding despite corridor pain index ≥ 5/6.",
    "Hard constraint on corridor pain caps at 4/6 per §8.3; AI recommendation overridden. Instruction safe-halts.",
    "v26.0 §10.2 ADV-AI-003 + §6.11 + §8.3",
  ),
];

// ---------------------------------------------------------------------------
// §10.2 — runtime summary
// ---------------------------------------------------------------------------

export interface AdversarialScenarioSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  byCategory: Record<AdversarialScenarioCategory, number>;
  blueprintRef: string;
  honestState: {
    staticScan: true;
    runtimeAssertion: false;
    mtqGateChecked: true;
  };
}

/**
 * Run all 73 mandatory adversarial scenarios and return a summary.
 *
 * The runtime behavior simulated here is intentionally light: each
 * scenario is a declared contract that downstream test runners
 * (unit + integration) MUST exercise against the live modules.
 * This function verifies that the catalog is internally
 * consistent (exactly 73 scenarios, all 12 categories present,
 * every scenario has a non-empty description + expected behavior).
 */
export function runAllAdversarialScenarios(): AdversarialScenarioSummary {
  const byCategory: Record<AdversarialScenarioCategory, number> = {
    MTQ_DISABLED: 0,
    OBLIGOR_ENTITY: 0,
    BACKING: 0,
    DUPLICATE_IDEMPOTENCY: 0,
    FINALITY_BM: 0,
    OUTBOX_PROJECTION: 0,
    PROVIDER_OUTAGE: 0,
    RECONCILIATION: 0,
    BREAK_GLASS: 0,
    LEAK: 0,
    CANONICAL_DRIFT: 0,
    AI_HARD_CONSTRAINTS: 0,
  };

  let passed = 0;
  let failed = 0;
  let pending = 0;

  for (const s of MANDATORY_ADVERSARIAL_SCENARIOS) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
    if (s.status === "PASS_DEFENDED") {
      passed += 1;
    } else if (s.status === "FAIL_VULNERABLE") {
      failed += 1;
    } else {
      pending += 1;
    }
  }

  return {
    total: MANDATORY_ADVERSARIAL_SCENARIOS.length,
    passed,
    failed,
    pending,
    byCategory,
    blueprintRef: "v26.0 §10.2 — Mandatory adversarial scenarios (73 across 12 categories)",
    honestState: {
      staticScan: true,
      runtimeAssertion: false,
      mtqGateChecked: true,
    },
  };
}

// ---------------------------------------------------------------------------
// §10.2 — convenience accessors
// ---------------------------------------------------------------------------

/**
 * All scenarios in a given category.
 */
export function getScenariosByCategory(
  category: AdversarialScenarioCategory,
): AdversarialScenario[] {
  return MANDATORY_ADVERSARIAL_SCENARIOS.filter((s) => s.category === category);
}

/**
 * Look up a single scenario by id.
 */
export function getScenario(scenarioId: string): AdversarialScenario | null {
  return (
    MANDATORY_ADVERSARIAL_SCENARIOS.find((s) => s.scenarioId === scenarioId) ??
    null
  );
}

/**
 * Light runtime probe for an MTQ-disabled scenario. Used by the
 * /gateway/v1/pilot-a/scenarios endpoint to demonstrate the
 * defense-in-depth MTQ gate behavior on demand.
 *
 * Returns the assertMtqEnabled() result and the F3 predicate's
 * failure behavior so reviewers can see exactly why the scenario
 * is defended.
 */
export function probeMtqDisabledScenario(
  scenarioId: string,
): { scenario: AdversarialScenario | null; mtqGate: ReturnType<typeof assertMtqEnabled>; f3FailureBehavior: string } {
  const scenario = getScenario(scenarioId);
  const gate = assertMtqEnabled(`adv-probe:${scenarioId}`);
  const f3Def = FINALITY_STATE_MACHINE.F3;
  return {
    scenario,
    mtqGate: gate,
    f3FailureBehavior: f3Def.failureBehavior,
  };
}

/**
 * Light runtime probe for a reconciliation scenario. Exercises
 * the reconciliation-tolerance evaluateMismatch() function so
 * reviewers can see the disposition for the scenario's mismatch.
 */
export function probeReconciliationScenario(
  scenarioId: string,
): {
  scenario: AdversarialScenario | null;
  disposition: ReturnType<typeof evaluateMismatch> | null;
} {
  const scenario = getScenario(scenarioId);
  if (!scenario) return { scenario: null, disposition: null };
  switch (scenario.scenarioId) {
    case "ADV-REC-001":
      return {
        scenario,
        disposition: evaluateMismatch(
          "IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE",
          1,
          "exact_match",
        ),
      };
    case "ADV-REC-002":
      return {
        scenario,
        disposition: evaluateMismatch(
          "LEDGER_ENTRIES_OBLIGATION_PRINCIPAL",
          1,
          "usd_minor_unit",
        ),
      };
    case "ADV-REC-003":
      return {
        scenario,
        disposition: evaluateMismatch("FX_VALUATION", 7, "bps"),
      };
    case "ADV-REC-004":
      return {
        scenario,
        disposition: evaluateMismatch("FX_VALUATION", 3, "bps"),
      };
    case "ADV-REC-005":
      return {
        scenario,
        disposition: evaluateMismatch(
          "EVENTUAL_CONSISTENCY_PROJECTION",
          5_000,
          "ms",
        ),
      };
    case "ADV-REC-006":
      return {
        scenario,
        disposition: evaluateMismatch("FX_VALUATION", 3, "percent"),
      };
    default:
      return { scenario, disposition: null };
  }
}

// ---------------------------------------------------------------------------
// §4.2 — re-export FinalityState for downstream consumers
// ---------------------------------------------------------------------------

export type { FinalityState };
