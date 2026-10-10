/**
 * MITHQAL v26.0 §9.1 — G0..G11 Critical-Path Gate Definitions
 * MITHQAL v26.0 §9.2 — 20-Control Legacy Mapping
 *
 * The G0..G11 grid is the v26.0 decision surface for instruction
 * progression. Each gate has a minimum exit condition and a default
 * failure behavior. The 20-control legacy map preserves audit
 * traceability onto the v25.x grid; it MUST NOT be used as the
 * decision surface.
 */

export type GateId = "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8" | "G9" | "G10" | "G11";

export type GateFailureBehavior =
  | "REJECT_QUARANTINE"
  | "BLOCKED"
  | "REMAIN_PENDING_OR_FAIL"
  | "BLOCK_MTQ_PROGRESSION"
  | "DENY_OR_SAFE_HALT"
  | "ROLLBACK_QUERY_IDEMPOTENCY"
  | "PENDING_REJECTED"
  | "DO_NOT_INFER_LEGAL_COMPLETION"
  | "NOT_FINAL_OR_HOLD";

export type FinalityStateAnchor =
  | "F0"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "PRE_F0"
  | "CROSS_CUTTING";

export interface GateDefinition {
  gateId: GateId;
  name: string;
  /** The finality state this gate anchors on (PRE_F0 for cross-cutting intake, CROSS_CUTTING for non-state-aligned gates). */
  finalityAnchor: FinalityStateAnchor;
  minimumExitCondition: string;
  defaultIfNotMet: GateFailureBehavior;
  /** Legacy control ids (from §9.2) that map primarily onto this gate. */
  primaryControlMappings: string[];
  blueprintRef: string;
}

export const G0_G11_GATE_DEFINITIONS: GateDefinition[] = [
  {
    gateId: "G0",
    name: "Instruction Intake Accepted",
    finalityAnchor: "F0",
    minimumExitCondition:
      "Appendix B.1 fields present, idempotencyKey unique, requestHash matches body, schemaVersion current.",
    defaultIfNotMet: "REJECT_QUARANTINE",
    primaryControlMappings: ["C01"],
    blueprintRef: "v26.0 §9.1 G0 + Appendix B.1",
  },
  {
    gateId: "G1",
    name: "Identity + Authorization Scope Verified",
    finalityAnchor: "PRE_F0",
    minimumExitCondition:
      "Identity scope drift zero-tolerance per §5.3 IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE; authorization scope explicitly attested.",
    defaultIfNotMet: "BLOCKED",
    primaryControlMappings: ["C02", "C03"],
    blueprintRef: "v26.0 §9.1 G1 + §5.3",
  },
  {
    gateId: "G2",
    name: "Bank-Facing Counterparty Contracted",
    finalityAnchor: "PRE_F0",
    minimumExitCondition:
      "Executed counterparty agreement present (EXECUTED_EXTERNAL_DOCUMENT); sandbox integration test passed; one counterparty per Pilot A (§11.3 D-009).",
    defaultIfNotMet: "BLOCKED",
    primaryControlMappings: ["C05"],
    blueprintRef: "v26.0 §9.1 G2 + §11.3 D-009",
  },
  {
    gateId: "G3",
    name: "Legal Scope + Applicable Law Verified",
    finalityAnchor: "PRE_F0",
    minimumExitCondition:
      "External counsel sign-off on applicable law (§11.4 OD-005, OD-008); jurisdiction set explicit and within Pilot A scope.",
    defaultIfNotMet: "BLOCKED",
    primaryControlMappings: ["C04", "C06"],
    blueprintRef: "v26.0 §9.1 G3 + §11.4 OD-005/OD-008",
  },
  {
    gateId: "G4",
    name: "Eligible Backing Verified",
    finalityAnchor: "F2",
    minimumExitCondition:
      "EligibleBacking computation passed §3.3 (MIN of economic, legal, liquid, settlementAvailable); all four dimensions VERIFIED; direct-matched to obligation.",
    defaultIfNotMet: "BLOCK_MTQ_PROGRESSION",
    primaryControlMappings: ["C07", "C08", "C09", "C20"],
    blueprintRef: "v26.0 §9.1 G4 + §3.3 + §3.4",
  },
  {
    gateId: "G5",
    name: "Bank Funding Final (F1)",
    finalityAnchor: "F1",
    minimumExitCondition:
      "Bank confirmation reference present; value-dated timestamp in the past; no reversal code observed.",
    defaultIfNotMet: "REMAIN_PENDING_OR_FAIL",
    primaryControlMappings: ["C10"],
    blueprintRef: "v26.0 §9.1 G5 + §4.2 F1",
  },
  {
    gateId: "G6",
    name: "Legally Controlled Backing Confirmed (F2)",
    finalityAnchor: "F2",
    minimumExitCondition:
      "Backing is segregated, legally controlled by the operator, admissible under the instruction's applicable law (§3.3 LegalBacking = VERIFIED_PRIMARY_DOCUMENT).",
    defaultIfNotMet: "BLOCK_MTQ_PROGRESSION",
    primaryControlMappings: ["C11"],
    blueprintRef: "v26.0 §9.1 G6 + §4.2 F2 + §3.3",
  },
  {
    gateId: "G7",
    name: "MTQ Authorization (F3)",
    finalityAnchor: "F3",
    minimumExitCondition:
      "BM-15 Monetary Authorization ran; PolicyDecision row persisted; MTQ gate (§3.2) returns ok=true; pilot stage=B.",
    defaultIfNotMet: "DENY_OR_SAFE_HALT",
    primaryControlMappings: ["C12", "C13"],
    blueprintRef: "v26.0 §9.1 G7 + §4.4 BM-15 + §3.2",
  },
  {
    gateId: "G8",
    name: "Ledger State Committed (F4)",
    finalityAnchor: "F4",
    minimumExitCondition:
      "Authoritative write returned (Neon); OutboxEvent PENDING; InboxEvent consumerDedupeKey written; BM-16A Finality Verification ran.",
    defaultIfNotMet: "ROLLBACK_QUERY_IDEMPOTENCY",
    primaryControlMappings: ["C14", "C15", "C16"],
    blueprintRef: "v26.0 §9.1 G8 + §4.4 BM-16A + §6.2",
  },
  {
    gateId: "G9",
    name: "Receiving Institution Accepted (F5)",
    finalityAnchor: "F5",
    minimumExitCondition:
      "Acknowledgement reference from the receiving institution observed within SLA window.",
    defaultIfNotMet: "PENDING_REJECTED",
    primaryControlMappings: ["C17"],
    blueprintRef: "v26.0 §9.1 G9 + §4.2 F5",
  },
  {
    gateId: "G10",
    name: "External Rail Final (F6)",
    finalityAnchor: "F6",
    minimumExitCondition:
      "Rail-specific finality signal observed (block confirmation, RTGS confirmation, correspondent MT message); bank-rail transaction mapping 1:1 with instruction.",
    defaultIfNotMet: "DO_NOT_INFER_LEGAL_COMPLETION",
    primaryControlMappings: ["C18", "C20"],
    blueprintRef: "v26.0 §9.1 G10 + §4.2 F6 + §5.3 BANK_RAIL_TRANSACTION_MAPPING",
  },
  {
    gateId: "G11",
    name: "Legal Settlement Final (F7)",
    finalityAnchor: "F7",
    minimumExitCondition:
      "Executed settlement document (EXECUTED_EXTERNAL_DOCUMENT) present and admissible in the instruction's jurisdiction; reporting aggregate reconciled to USD minor unit.",
    defaultIfNotMet: "NOT_FINAL_OR_HOLD",
    primaryControlMappings: ["C19", "C20"],
    blueprintRef: "v26.0 §9.1 G11 + §4.2 F7 + §5.3 REPORTING_AGGREGATE",
  },
];

// ---------------------------------------------------------------------------
// §9.2 — 20-Control Legacy Mapping
// ---------------------------------------------------------------------------

export interface LegacyControlDefinition {
  controlId: string; // C01..C20
  name: string;
  primaryGateMapping: GateId;
  blueprintRef: string;
}

export const LEGACY_20_GATE_MAP: LegacyControlDefinition[] = [
  { controlId: "C01", name: "Instruction intake validation", primaryGateMapping: "G0", blueprintRef: "v26.0 §9.2 C01 → G0" },
  { controlId: "C02", name: "Identity scope enforcement", primaryGateMapping: "G1", blueprintRef: "v26.0 §9.2 C02 → G1" },
  { controlId: "C03", name: "Authorization scope check", primaryGateMapping: "G1", blueprintRef: "v26.0 §9.2 C03 → G1" },
  { controlId: "C04", name: "Legal scope review", primaryGateMapping: "G3", blueprintRef: "v26.0 §9.2 C04 → G3" },
  { controlId: "C05", name: "Bank counterparty onboarding", primaryGateMapping: "G2", blueprintRef: "v26.0 §9.2 C05 → G2" },
  { controlId: "C06", name: "Applicable law attestation", primaryGateMapping: "G3", blueprintRef: "v26.0 §9.2 C06 → G3" },
  { controlId: "C07", name: "Eligible backing computation", primaryGateMapping: "G4", blueprintRef: "v26.0 §9.2 C07 → G4" },
  { controlId: "C08", name: "Direct-matched backing test", primaryGateMapping: "G4", blueprintRef: "v26.0 §9.2 C08 → G4" },
  { controlId: "C09", name: "Risk buffer separation", primaryGateMapping: "G4", blueprintRef: "v26.0 §9.2 C09 → G4" },
  { controlId: "C10", name: "Bank funding confirmation", primaryGateMapping: "G5", blueprintRef: "v26.0 §9.2 C10 → G5" },
  { controlId: "C11", name: "Legally controlled backing confirmation", primaryGateMapping: "G6", blueprintRef: "v26.0 §9.2 C11 → G6" },
  { controlId: "C12", name: "MTQ gate", primaryGateMapping: "G7", blueprintRef: "v26.0 §9.2 C12 → G7" },
  { controlId: "C13", name: "BM-15 monetary authorization", primaryGateMapping: "G7", blueprintRef: "v26.0 §9.2 C13 → G7" },
  { controlId: "C14", name: "BM-16A finality verification", primaryGateMapping: "G8", blueprintRef: "v26.0 §9.2 C14 → G8" },
  { controlId: "C15", name: "BM-16B mint execution", primaryGateMapping: "G8", blueprintRef: "v26.0 §9.2 C15 → G8" },
  { controlId: "C16", name: "OutboxEvent emission", primaryGateMapping: "G8", blueprintRef: "v26.0 §9.2 C16 → G8" },
  { controlId: "C17", name: "Receiver acknowledgement", primaryGateMapping: "G9", blueprintRef: "v26.0 §9.2 C17 → G9" },
  { controlId: "C18", name: "External rail finality", primaryGateMapping: "G10", blueprintRef: "v26.0 §9.2 C18 → G10" },
  { controlId: "C19", name: "Legal settlement document", primaryGateMapping: "G11", blueprintRef: "v26.0 §9.2 C19 → G11" },
  { controlId: "C20", name: "Reconciliation class tolerance", primaryGateMapping: "G4", blueprintRef: "v26.0 §9.2 C20 → G4 (FX) / G8 (LEDGER) / G10 (BANK_RAIL) / G11 (REPORTING)" },
];

/**
 * Look up a G0..G11 gate definition by id.
 */
export function getGateDefinition(gateId: GateId): GateDefinition {
  const def = G0_G11_GATE_DEFINITIONS.find((g) => g.gateId === gateId);
  if (!def) {
    throw new Error(`Unknown gateId "${gateId}". Valid ids: G0..G11.`);
  }
  return def;
}

/**
 * Look up a legacy control by id (C01..C20).
 */
export function getLegacyControl(controlId: string): LegacyControlDefinition {
  const def = LEGACY_20_GATE_MAP.find((c) => c.controlId === controlId);
  if (!def) {
    throw new Error(`Unknown legacy controlId "${controlId}". Valid ids: C01..C20.`);
  }
  return def;
}
