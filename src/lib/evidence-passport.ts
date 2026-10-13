// =============================================================================
// src/lib/evidence-passport.ts
// MITHQAL · MTQ Canonical Blueprint v1.0 — §5A "Payment Evidence Passport"
// =============================================================================
// Task ID: IMPL-V1-BLUEPRINT
//
// For each instruction, provide an access-controlled evidence bundle per
// v1.0 §5A "Payment Evidence Passport":
//
//   event timeline; source and provenance; source/observed timestamps;
//   policy version; route rationale; authorized fee/FX references;
//   exception history; reconciliation status; and finality-domain status
//   only where supported. Distinguish provider-reported, MITHQAL-observed,
//   tested, independently verified and legally established facts.
//   Minimize sensitive data.
//
// HONEST STATE (per v1.0 §0 "DESIGN-STAGE ONLY"):
//   - productionAuthorized = false
//   - MTQ DISABLED
//   - All bundles below are SYNTHETIC for the Pilot A demonstrator
//   - No real bank, rail, custodian, or settlement system is connected
//   - Sensitive data (customer PII, account numbers, raw signatures) is
//     minimized and replaced with placeholder references
// =============================================================================

/**
 * Truth labels per v1.0 §5A. Every evidence field MUST be tagged with one of
 * these labels so consumers cannot mistake a provider-reported figure for an
 * independently verified fact.
 */
export type TruthLabel =
  | "PROVIDER_REPORTED"
  | "MITHQAL_OBSERVED"
  | "TESTED"
  | "INDEPENDENTLY_VERIFIED"
  | "LEGALLY_ESTABLISHED"
  | "UNKNOWN";

/**
 * Provenance descriptor. Identifies where a piece of evidence came from and
 * the chain of custody that supports its truth label. Sensitive material is
 * reduced to a hash or reference, never the raw payload.
 */
export interface EvidenceProvenance {
  source: string;
  sourceType: "PROVIDER_API" | "MITHQAL_GATEWAY" | "CUSTODIAN" | "REGULATOR" | "TEST_HARNESS" | "MANUAL";
  retrievedAt: string;
  /**
   * Hash or opaque reference to the underlying record. We never embed raw
   * sensitive payloads (account numbers, signatures, PII) per §5A
   * "Minimize sensitive data."
   */
  evidenceRef: string;
  /** Whether the original record is retained, summarized, or minimized. */
  retention: "FULL" | "SUMMARY" | "HASH_ONLY" | "MINIMIZED";
}

export interface EventTimelineEntry {
  eventId: string;
  timestamp: string;
  source: string;
  type: string;
  description: string;
  trustState: TruthLabel;
  provenance: EvidenceProvenance;
}

export interface RouteRationaleEntry {
  routeId: string;
  ranked: number;
  reasonCode: string;
  approved: boolean;
}

export interface FeeFxReferenceEntry {
  type: "FEE" | "FX_RATE" | "SPREAD" | "ALL_IN_COST";
  amount: number;
  currency: string;
  source: string;
  timestamp: string;
  provenance: EvidenceProvenance;
}

export interface ExceptionHistoryEntry {
  exceptionId: string;
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
}

export interface ReconciliationStatusEntry {
  caseId: string;
  class: string;
  status: "MATCHED" | "TOLERANCE_BREACH" | "UNRECONCILED" | "PENDING";
  tolerance: string;
}

export interface FinalityDomainStatusEntry {
  domain: string;
  status: "ACHIEVED" | "PENDING" | "NOT_SUPPORTED" | "UNKNOWN";
  evidenceRef: string;
  asOf: string;
}

export interface TruthLabelAnnotation {
  label: TruthLabel;
  scope: string;
  evidenceRef: string;
}

/**
 * The full Payment Evidence Passport bundle for a single instruction.
 * Per §5A, every field set must be traceable to a provenance record and
 * tagged with a truth label so consumers cannot mistake reported facts
 * for verified ones.
 */
export interface EvidencePassport {
  instructionId: string;
  eventTimeline: EventTimelineEntry[];
  routeRationale: RouteRationaleEntry[];
  feeFxReferences: FeeFxReferenceEntry[];
  exceptionHistory: ExceptionHistoryEntry[];
  reconciliationStatus: ReconciliationStatusEntry[];
  finalityDomainStatus: FinalityDomainStatusEntry[];
  policyVersion: string;
  truthLabels: TruthLabelAnnotation[];
  sensitiveDataMinimized: boolean;
  /** Always present — design-stage flag from §0. */
  blueprint_ref: "v1.0 §5A";
  /** SYNTHETIC for Pilot A. Never presented as live evidence. */
  honestState: "SYNTHETIC" | "AUTHORIZED_HISTORICAL";
}

// -----------------------------------------------------------------------------
// Pilot A synthetic evidence store
// -----------------------------------------------------------------------------

const BLUEPRINT_REF = "v1.0 §5A" as const;

const SYNTHETIC_PROVENANCE: EvidenceProvenance = {
  source: "pilot-a-synthetic-harness",
  sourceType: "TEST_HARNESS",
  retrievedAt: "2026-10-11T00:00:00Z",
  evidenceRef: "sha256:SyntheticPilotA:0000000000000000000000000000000000000000",
  retention: "MINIMIZED",
};

/**
 * Three synthetic Pilot A instructions for demonstrator use. Real instruction
 * passports require an authorized bank/rail feed and per-§6 MTQ activation
 * prerequisites; none of those exist as of v1.0.
 */
const SYNTHETIC_PASSPORTS: EvidencePassport[] = [
  {
    instructionId: "PILOT-A-INSTR-001",
    eventTimeline: [
      {
        eventId: "EVT-001-001",
        timestamp: "2026-10-11T09:00:00Z",
        source: "origin-bank-treasury",
        type: "INSTRUCTION_RECEIVED",
        description: "Treasury submitted outbound payment instruction (synthetic).",
        trustState: "PROVIDER_REPORTED",
        provenance: SYNTHETIC_PROVENANCE,
      },
      {
        eventId: "EVT-001-002",
        timestamp: "2026-10-11T09:00:02Z",
        source: "mithqal-gateway",
        type: "GATE_DECISION",
        description: "MITHQAL gate evaluated instruction; no MTQ action authorized.",
        trustState: "MITHQAL_OBSERVED",
        provenance: SYNTHETIC_PROVENANCE,
      },
      {
        eventId: "EVT-001-003",
        timestamp: "2026-10-11T09:00:05Z",
        source: "destination-bank-treasury",
        type: "SETTLEMENT_CONFIRMATION",
        description: "Receiving treasury confirmed receipt (synthetic, not live).",
        trustState: "PROVIDER_REPORTED",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    routeRationale: [
      { routeId: "ROUTE-A", ranked: 1, reasonCode: "LOWEST_ALL_IN_COST", approved: true },
      { routeId: "ROUTE-B", ranked: 2, reasonCode: "HIGHER_FX_SPREAD", approved: false },
      { routeId: "ROUTE-C", ranked: 3, reasonCode: "INSUFFICIENT_LIQUIDITY", approved: false },
    ],
    feeFxReferences: [
      {
        type: "FX_RATE",
        amount: 0.2723,
        currency: "AED/SGD",
        source: "synthetic-oracle",
        timestamp: "2026-10-11T09:00:00Z",
        provenance: SYNTHETIC_PROVENANCE,
      },
      {
        type: "FEE",
        amount: 12.5,
        currency: "USD",
        source: "synthetic-fee-table",
        timestamp: "2026-10-11T09:00:00Z",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    exceptionHistory: [
      {
        exceptionId: "EXC-001",
        code: "DUPLICATE_EVENT",
        severity: "MEDIUM",
        status: "RESOLVED",
        openedAt: "2026-10-11T09:01:00Z",
        closedAt: "2026-10-11T09:05:00Z",
      },
    ],
    reconciliationStatus: [
      {
        caseId: "RECON-001",
        class: "CANONICAL_VS_BANK_SUBLEDGER",
        status: "MATCHED",
        tolerance: "±1 bps",
      },
    ],
    finalityDomainStatus: [
      {
        domain: "SYNTHETIC_FINALITY",
        status: "ACHIEVED",
        evidenceRef: "sha256:SyntheticFinality:0000000000000000000000000000000000000000",
        asOf: "2026-10-11T09:00:05Z",
      },
      {
        domain: "LIVE_RAIL_FINALITY",
        status: "NOT_SUPPORTED",
        evidenceRef: "n/a — no live rail contracted",
        asOf: "2026-10-11T00:00:00Z",
      },
    ],
    policyVersion: "POLICY-v1.0-PilotA",
    truthLabels: [
      { label: "PROVIDER_REPORTED", scope: "eventTimeline[0]", evidenceRef: SYNTHETIC_PROVENANCE.evidenceRef },
      { label: "MITHQAL_OBSERVED", scope: "eventTimeline[1]", evidenceRef: SYNTHETIC_PROVENANCE.evidenceRef },
      { label: "TESTED", scope: "gateDecision", evidenceRef: "test:pilot-a:gate-eval" },
      { label: "UNKNOWN", scope: "liveRailFinality", evidenceRef: "n/a" },
    ],
    sensitiveDataMinimized: true,
    blueprint_ref: BLUEPRINT_REF,
    honestState: "SYNTHETIC",
  },
  {
    instructionId: "PILOT-A-INSTR-002",
    eventTimeline: [
      {
        eventId: "EVT-002-001",
        timestamp: "2026-10-11T10:00:00Z",
        source: "origin-bank-treasury",
        type: "INSTRUCTION_RECEIVED",
        description: "Treasury submitted outbound payment instruction (synthetic).",
        trustState: "PROVIDER_REPORTED",
        provenance: SYNTHETIC_PROVENANCE,
      },
      {
        eventId: "EVT-002-002",
        timestamp: "2026-10-11T10:00:04Z",
        source: "mithqal-gateway",
        type: "EXCEPTION_RAISED",
        description: "Reconciliation tolerance breach detected (synthetic).",
        trustState: "MITHQAL_OBSERVED",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    routeRationale: [
      { routeId: "ROUTE-A", ranked: 1, reasonCode: "STANDARD", approved: true },
    ],
    feeFxReferences: [
      {
        type: "ALL_IN_COST",
        amount: 0.42,
        currency: "%",
        source: "synthetic-cost-engine",
        timestamp: "2026-10-11T10:00:00Z",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    exceptionHistory: [
      {
        exceptionId: "EXC-002",
        code: "RECONCILIATION_BREAK",
        severity: "HIGH",
        status: "IN_PROGRESS",
        openedAt: "2026-10-11T10:00:04Z",
        closedAt: null,
      },
    ],
    reconciliationStatus: [
      {
        caseId: "RECON-002",
        class: "BANK_SUBLEDGER_VS_CORPORATE",
        status: "TOLERANCE_BREACH",
        tolerance: "±1 bps",
      },
    ],
    finalityDomainStatus: [
      {
        domain: "SYNTHETIC_FINALITY",
        status: "PENDING",
        evidenceRef: "sha256:SyntheticPendingFinality:0000000000000000000000000000000000000000",
        asOf: "2026-10-11T10:00:04Z",
      },
    ],
    policyVersion: "POLICY-v1.0-PilotA",
    truthLabels: [
      { label: "PROVIDER_REPORTED", scope: "eventTimeline[0]", evidenceRef: SYNTHETIC_PROVENANCE.evidenceRef },
      { label: "MITHQAL_OBSERVED", scope: "eventTimeline[1]", evidenceRef: SYNTHETIC_PROVENANCE.evidenceRef },
      { label: "UNKNOWN", scope: "liveRailFinality", evidenceRef: "n/a" },
    ],
    sensitiveDataMinimized: true,
    blueprint_ref: BLUEPRINT_REF,
    honestState: "SYNTHETIC",
  },
  {
    instructionId: "PILOT-A-INSTR-003",
    eventTimeline: [
      {
        eventId: "EVT-003-001",
        timestamp: "2026-10-11T11:00:00Z",
        source: "origin-bank-treasury",
        type: "INSTRUCTION_RECEIVED",
        description: "Treasury submitted outbound payment instruction (synthetic).",
        trustState: "PROVIDER_REPORTED",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    routeRationale: [
      { routeId: "ROUTE-A", ranked: 1, reasonCode: "LOWEST_ALL_IN_COST", approved: true },
    ],
    feeFxReferences: [
      {
        type: "FX_RATE",
        amount: 0.9231,
        currency: "USD/EUR",
        source: "synthetic-oracle",
        timestamp: "2026-10-11T11:00:00Z",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    exceptionHistory: [],
    reconciliationStatus: [
      {
        caseId: "RECON-003",
        class: "CANONICAL_VS_BANK_SUBLEDGER",
        status: "MATCHED",
        tolerance: "±1 bps",
      },
    ],
    finalityDomainStatus: [
      {
        domain: "SYNTHETIC_FINALITY",
        status: "ACHIEVED",
        evidenceRef: "sha256:SyntheticFinality:0000000000000000000000000000000000000000",
        asOf: "2026-10-11T11:00:02Z",
      },
    ],
    policyVersion: "POLICY-v1.0-PilotA",
    truthLabels: [
      { label: "PROVIDER_REPORTED", scope: "eventTimeline[0]", evidenceRef: SYNTHETIC_PROVENANCE.evidenceRef },
    ],
    sensitiveDataMinimized: true,
    blueprint_ref: BLUEPRINT_REF,
    honestState: "SYNTHETIC",
  },
];

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Returns the synthetic EvidencePassport for a Pilot A instruction. Falls
 * back to a generated placeholder bundle if the instructionId is not in the
 * synthetic store, so the demonstrator can still surface a complete view.
 *
 * Per §5A, the returned bundle:
 *   - distinguishes provider-reported, MITHQAL-observed, tested,
 *     independently verified, and legally established facts via truthLabels
 *   - minimizes sensitive data (sensitiveDataMinimized = true)
 *   - carries blueprint_ref + honestState on every response
 *
 * NOTE: This is design-stage synthetic data per v1.0 §0. It is NOT a live
 * evidence package and must not be presented as bank, rail, or settlement
 * evidence.
 */
export function generateEvidencePassport(instructionId: string): EvidencePassport {
  const existing = SYNTHETIC_PASSPORTS.find((p) => p.instructionId === instructionId);
  if (existing) {
    return existing;
  }

  // Generate a deterministic synthetic placeholder so unknown IDs still
  // return a structurally complete bundle, clearly labeled SYNTHETIC.
  return {
    instructionId,
    eventTimeline: [
      {
        eventId: `EVT-${instructionId}-001`,
        timestamp: "2026-10-11T00:00:00Z",
        source: "pilot-a-synthetic-harness",
        type: "INSTRUCTION_RECEIVED",
        description:
          "Synthetic instruction event for demonstrator. No live bank, rail, or settlement system.",
        trustState: "UNKNOWN",
        provenance: SYNTHETIC_PROVENANCE,
      },
    ],
    routeRationale: [],
    feeFxReferences: [],
    exceptionHistory: [],
    reconciliationStatus: [],
    finalityDomainStatus: [
      {
        domain: "LIVE_RAIL_FINALITY",
        status: "NOT_SUPPORTED",
        evidenceRef: "n/a — design-stage only",
        asOf: "2026-10-11T00:00:00Z",
      },
    ],
    policyVersion: "POLICY-v1.0-PilotA",
    truthLabels: [
      { label: "UNKNOWN", scope: "all", evidenceRef: SYNTHETIC_PROVENANCE.evidenceRef },
    ],
    sensitiveDataMinimized: true,
    blueprint_ref: BLUEPRINT_REF,
    honestState: "SYNTHETIC",
  };
}

/**
 * Export an EvidencePassport in a requested format.
 *
 * Currently supports:
 *   - "json"   : full bundle as JSON with classification + provenance labels
 *   - "summary": minimized summary suitable for sharing externally
 *
 * Per §5A, the JSON export always carries classification (truthLabels) and
 * provenance labels so consumers cannot mistake reported facts for verified
 * ones. Sensitive data is always minimized.
 */
export function exportEvidencePassport(
  instructionId: string,
  format: "json" | "summary" = "json",
): {
  format: string;
  blueprint_ref: string;
  honestState: string;
  classification: string;
  sensitiveDataMinimized: boolean;
  payload: unknown;
} {
  const passport = generateEvidencePassport(instructionId);
  const classification = passport.truthLabels
    .map((t) => `${t.label}:${t.scope}`)
    .join(", ");

  if (format === "summary") {
    return {
      format,
      blueprint_ref: BLUEPRINT_REF,
      honestState: passport.honestState,
      classification,
      sensitiveDataMinimized: passport.sensitiveDataMinimized,
      payload: {
        instructionId: passport.instructionId,
        policyVersion: passport.policyVersion,
        eventCount: passport.eventTimeline.length,
        exceptionsOpen: passport.exceptionHistory.filter(
          (e) => e.status !== "CLOSED" && e.status !== "RESOLVED",
        ).length,
        finalitySummary: passport.finalityDomainStatus.map((f) => ({
          domain: f.domain,
          status: f.status,
        })),
        truthLabels: passport.truthLabels,
      },
    };
  }

  // Default: full JSON with classification + provenance labels.
  return {
    format,
    blueprint_ref: BLUEPRINT_REF,
    honestState: passport.honestState,
    classification,
    sensitiveDataMinimized: passport.sensitiveDataMinimized,
    payload: passport,
  };
}

/**
 * List all synthetic Pilot A instruction IDs known to the demonstrator.
 * Used by the gateway route to surface the demo catalog.
 */
export function listPilotAInstructionIds(): string[] {
  return SYNTHETIC_PASSPORTS.map((p) => p.instructionId);
}
