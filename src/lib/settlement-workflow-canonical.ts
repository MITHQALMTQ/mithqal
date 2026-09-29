// src/lib/settlement-workflow-canonical.ts
//
// MITHQAL v25.3.2-J2 — CANONICAL SETTLEMENT WORKFLOW (BM-01..BM-16B)
// =====================================================================
//
// Per J-directive (2026-09-29):
//   "Canonicalize the settlement workflow.
//    Use exactly: BM-01–BM-08 = Bank/customer/MBG; BM-09 = Eligibility;
//    BM-10 = Jurisdiction; BM-11 = Backing Verification; BM-12 = Bank Risk;
//    BM-13 = System Risk; BM-14 = DMCE; BM-15 = Monetary Authorization;
//    BM-16A = Finality Verification; BM-16B = Mint Execution.
//    Remove every conflicting definition of BM-15 or BM-16.
//    The implementation and documentation must resolve to exactly one
//    meaning per ID."
//
// Per MITHQAL-V25.3.2-REMEDIATION-LAYER.md §2 canonical authority hierarchy:
//   1. v25.3.2 controlling remediation layer (THE ACTIVE MODEL)
//   2. approved constitutional rules (Constitution v19.0)
//   3. active machine-readable policy registry
//   4. validated external legal / regulatory evidence
//   5. historical material
//
// This file is the SINGLE CANONICAL SOURCE for all 17 BM-* steps (BM-01
// through BM-16B). Every other module that needs BM-* definitions MUST
// import from here. Any other BM-* definition in the codebase is a
// CONTRADICTION per the contradiction scanner and must be removed or
// re-pointed to this source.
//
// Capability boundary (per J-directive + Agent J3's CONTROL-PLANE-VS-MTQ
// boundary spec in docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md):
//   - CONTROL_PLANE_CORE       — asset-agnostic; works for bank money,
//                                 CBDC, RTGS, tokenized deposits,
//                                 wholesale CBDC, or MTQ. Owns BM-01..BM-16A.
//   - MTQ_SETTLEMENT_MODULE    — MTQ-specific; owns BM-16B only. OPTIONAL
//                                 (SKIPPED when settlement asset ≠ MTQ
//                                 OR when MTQ_SETTLEMENT_ENABLED = "false").
//
// API SURFACE CONTRACT (preserved for downstream consumers):
//   Exports (consumed by /api/control-plane/settlement-status and others):
//     - type CanonicalBMStep
//     - const CANONICAL_SETTLEMENT_WORKFLOW: CanonicalBMStep[]
//     - function getControlPlaneWorkflow(): CanonicalBMStep[]
//     - function getMTQSettlementWorkflow(): CanonicalBMStep[]
//     - function getStepStatusForAsset(step, assetType?): step.status
//   The interface shape (field names, optional fields, phase enum,
//   status enum, capability enum) MUST stay stable. The actual step
//   CONTENT (names, descriptions) is the J-directive canonical mapping
//   below — superseding J3's earlier draft names where they conflicted.
//
// Lifecycle statuses follow the v25.3.2 status markers. All 17 steps
// are ACTIVE in the canonical v25.3.2-J2 release; BM-16B can be marked
// COMPLETED-NOT-REQUIRED at runtime when MTQ settlement is disabled
// (see getMTQSettlementWorkflow + getStepStatusForAsset).

import {
  isMTQSettlementEnabled,
  type SettlementAssetType,
  DEFAULT_SETTLEMENT_ASSET,
} from "./mtq-settlement-config";

// ---- Step shape ------------------------------------------------------

/**
 * A single step in the canonical settlement workflow.
 *
 * - id: stable identifier (e.g. "BM-09") used by callers to reference
 *   the step programmatically. Never changes.
 * - name: human-readable name. Per J-directive, the names are canonical
 *   (BM-09 = "Eligibility Check", BM-10 = "Jurisdiction Check", etc.).
 * - phase: lifecycle phase (REQUEST | AUTHORIZATION | VERIFICATION |
 *   AUTHORIZATION_FINAL | EXECUTION).
 * - capability: "CONTROL_PLANE_CORE" for asset-agnostic steps,
 *   "MTQ_SETTLEMENT_MODULE" for MTQ-specific steps.
 * - status: design-time status of the step definition. "ACTIVE" means
 *   the step is canonical and operationally required (or optional, per
 *   `optional` field). This is NOT a runtime status of a particular
 *   transaction; it's the status of the step definition in the
 *   canonical workflow.
 * - optional: true for MTQ-specific steps that are skipped when
 *   SettlementAssetType ≠ "MTQ" or when MTQ_SETTLEMENT_ENABLED = false.
 *   Default false (control-plane steps are never optional).
 * - description: 1-2 sentence description (J-directive canonical wording).
 *
 * v25.3.2-J2 ADDITIONS (additive only — preserved J3's interface shape):
 *   - previousStepId?: for state machine chaining
 *   - nextStepId?: for state machine chaining
 *   - failureMode?: BLOCK | ESCALATE | RETRY (default BLOCK)
 *   - auditRecordRequired?: whether an audit record MUST be emitted
 */
export interface CanonicalBMStep {
  id: string;
  name: string;
  phase:
    | "REQUEST"
    | "AUTHORIZATION"
    | "VERIFICATION"
    | "AUTHORIZATION_FINAL"
    | "EXECUTION";
  capability: "CONTROL_PLANE_CORE" | "MTQ_SETTLEMENT_MODULE";
  status: "ACTIVE" | "COMPLETED-NOT-REQUIRED" | "PENDING_VALIDATION";
  optional?: boolean;
  description?: string;
  // v25.3.2-J2 additive extensions (optional — J3 callers ignore):
  previousStepId?: string | null;
  nextStepId?: string | null;
  failureMode?: "BLOCK" | "ESCALATE" | "RETRY";
  auditRecordRequired?: boolean;
}

// ---- Canonical workflow (design-time) --------------------------------

/**
 * The full canonical BM-* settlement workflow — exactly 17 steps
 * (BM-01..BM-14 + BM-15 + BM-16A + BM-16B). NO MORE, NO LESS. Do not
 * add steps here without amending the J-directive and bumping
 * CANONICAL_WORKFLOW_VERSION.
 *
 * v25.3.2-J2 SUPERSESSIONS (over J3's earlier draft):
 *
 *   OLD (J3 draft)                            → NEW (J-directive canonical)
 *   BM-09 "Eligible Reserve / Settlement      → "Eligibility Check"
 *        Asset Verification"                   (per J-directive: BM-09 = Eligibility)
 *   BM-10 "Custody Verification"              → "Jurisdiction Check"
 *                                              (per J-directive: BM-10 = Jurisdiction)
 *   BM-11 "NAV Calculation (when applicable)" → "Backing Verification"
 *                                              (per J-directive: BM-11 = Backing Verification)
 *   BM-12 "Reserve Ratio / Stress-RR /        → "Bank-Specific Risk Assessment"
 *         Constitutional Checks"              (per J-directive: BM-12 = Bank Risk)
 *   BM-13 "Proof of Reserves"                → "System-Wide Risk / Concentration Check"
 *                                              (per J-directive: BM-13 = System Risk)
 *   BM-14 "Proof of Solvency"                → "DMCE — Dynamic Minting Capacity Evaluation"
 *                                              (per J-directive: BM-14 = DMCE)
 *   BM-15 "Deterministic Issuance            → "Monetary Authorization"
 *         Authorization"                       (per J-directive: BM-15 = Monetary Authorization)
 *   BM-16A "Settlement Authorization         → "Finality Verification"
 *         (Asset-Agnostic)"                    (per J-directive: BM-16A = Finality Verification)
 *   BM-16B "Mint Execution (MTQ-specific)"   → "Mint Execution (MTQ-specific)" (UNCHANGED — matches)
 *
 * The custody / NAV / proof-of-reserves / proof-of-solvency concerns
 * that appeared in J3's draft are NOT removed from the codebase — they
 * are folded INTO the canonical step descriptions where they belong
 * (Backing Verification includes custody; Bank Risk includes reserve
 * ratio + stress-RR; System Risk includes proof-of-reserves +
 * proof-of-solvency surfaces). They are no longer top-level BM-* steps
 * because the J-directive mandates exactly 17 IDs with the exact
 * names above.
 */
export const CANONICAL_SETTLEMENT_WORKFLOW: CanonicalBMStep[] = [
  // ---- Phase: REQUEST (BM-01..BM-04 — Bank / Customer / MBG phase) ----
  // Per J-directive: BM-01..BM-08 = Bank / customer / MBG
  {
    id: "BM-01",
    name: "Corporate / Customer Initiates Settlement Request",
    phase: "REQUEST",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "Corporate / customer initiates settlement request with the bank (customer side). " +
      "Customer PII stays at the bank; only institutional reference is passed upstream. " +
      "Asset-agnostic — works with bank money, CBDC, RTGS, tokenized deposits, wholesale CBDC, or MTQ.",
    previousStepId: null,
    nextStepId: "BM-02",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-02",
    name: "Bank Receives Request + KYC / KYB Verification",
    phase: "REQUEST",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "Bank receives the settlement request and verifies customer KYC / KYB.",
    previousStepId: "BM-01",
    nextStepId: "BM-03",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-03",
    name: "AML / Sanctions / Beneficial Ownership Screening",
    phase: "REQUEST",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "Bank performs AML, sanctions, and beneficial ownership screening. " +
      "Asset-agnostic — the screening is on the parties + the transaction, not on the settlement asset.",
    previousStepId: "BM-02",
    nextStepId: "BM-04",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-04",
    name: "Bank Establishes / Verifies Eligible Funding",
    phase: "REQUEST",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "Bank verifies the customer has eligible funding (verified eligible value).",
    previousStepId: "BM-03",
    nextStepId: "BM-05",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },

  // ---- Phase: AUTHORIZATION (BM-05..BM-08 — Bank / MBG phase) ----
  // Per J-directive: BM-01..BM-08 = Bank / customer / MBG
  {
    id: "BM-05",
    name: "Bank Issues AvailableBackingCertificate to MITHQAL",
    phase: "AUTHORIZATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "Bank issues AvailableBackingCertificate (Evidence Source A — bank-signed).",
    previousStepId: "BM-04",
    nextStepId: "BM-06",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-06",
    name: "Bank Requests Settlement via MBG (MITHQAL Bank Gateway)",
    phase: "AUTHORIZATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "Bank requests settlement through the MBG (MITHQAL Bank Gateway sidecar).",
    previousStepId: "BM-05",
    nextStepId: "BM-07",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-07",
    name: "MBG Authenticates Bank Institution",
    phase: "AUTHORIZATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MBG authenticates the bank institution (mTLS + signed nonce + replay protection).",
    previousStepId: "BM-06",
    nextStepId: "BM-08",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-08",
    name: "MBG Translates (Not Transforms) Bank Request",
    phase: "AUTHORIZATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MBG translates the bank request to MITHQAL control-plane format. " +
      "Does NOT transform the underlying value.",
    previousStepId: "BM-07",
    nextStepId: "BM-09",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },

  // ---- Phase: VERIFICATION (BM-09..BM-14 — MITHQAL Control-Plane Core) ----
  // Per J-directive: BM-09 = Eligibility; BM-10 = Jurisdiction;
  //   BM-11 = Backing Verification; BM-12 = Bank Risk;
  //   BM-13 = System Risk; BM-14 = DMCE.
  {
    id: "BM-09",
    name: "Eligibility Check",
    phase: "VERIFICATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core verifies settlement eligibility (asset class, jurisdiction, participant status). " +
      "Asset-agnostic — works for bank money, central-bank money, RTGS, tokenized deposits, wholesale CBDC, " +
      "MTQ (when enabled), or other legally recognized settlement assets.",
    previousStepId: "BM-08",
    nextStepId: "BM-10",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-10",
    name: "Jurisdiction Check",
    phase: "VERIFICATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core verifies the settlement falls within authorized jurisdictions. " +
      "Asset-agnostic — the geo-fence + permitted-jurisdiction check is on the corridor + the parties, " +
      "not on the settlement asset.",
    previousStepId: "BM-09",
    nextStepId: "BM-11",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-11",
    name: "Backing Verification",
    phase: "VERIFICATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core verifies backing evidence (AvailableBackingCertificate + custodian evidence where " +
      "applicable). Includes custody verification — the custody verification pattern is shared across " +
      "asset types (the custodian differs, but the verification interface is the same).",
    previousStepId: "BM-10",
    nextStepId: "BM-12",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-12",
    name: "Bank-Specific Risk Assessment",
    phase: "VERIFICATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core evaluates bank-specific risk (RR ≥ 1.00, StressRR ≥ 0.95, LCR, MLCR). " +
      "Asset-agnostic — the invariants apply to the control plane as a whole, not to any specific asset. " +
      "Sovereign-Default-Risk check + Multi-Liquidity-Coverage-Ratio check are subsumed here.",
    previousStepId: "BM-11",
    nextStepId: "BM-13",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-13",
    name: "System-Wide Risk / Concentration Check",
    phase: "VERIFICATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core evaluates system-wide concentration (institutional exposure ≤ 25% cap, " +
      "concentration ≤ 25% cap). Includes proof-of-reserves + proof-of-solvency surfaces (the " +
      "cryptographic proofs are emitted at this step for institutional transparency). " +
      "Asset-agnostic.",
    previousStepId: "BM-12",
    nextStepId: "BM-14",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-14",
    name: "DMCE — Dynamic Minting Capacity Evaluation",
    phase: "VERIFICATION",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core computes Dynamic Minting Capacity (MIN of 8 limits per §V). " +
      "Asset-agnostic capacity ceiling — works for any settlement asset class (the limits differ " +
      "per asset, but the engine interface is shared).",
    previousStepId: "BM-13",
    nextStepId: "BM-15",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },

  // ---- Phase: AUTHORIZATION_FINAL (BM-15, BM-16A — MITHQAL Control-Plane Core) ----
  // Per J-directive: BM-15 = Monetary Authorization; BM-16A = Finality Verification.
  // v25.3.2-J2 SUPERSEDED the old "BM-15 = Mint Permission Engine" definition
  // that lived in src/lib/final-integrated-architecture.ts lines 1188-1189.
  {
    id: "BM-15",
    name: "Monetary Authorization",
    phase: "AUTHORIZATION_FINAL",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core issues Monetary Authorization — the control-plane's asset-agnostic authorization " +
      "for settlement. Works whether the settlement asset is bank money, CBDC, RTGS, tokenized " +
      "deposits, wholesale CBDC, or MTQ. Deterministic issuance authorization — all upstream checks " +
      "have passed; the control plane authorizes the bank to execute settlement via the chosen " +
      "asset rail.",
    previousStepId: "BM-14",
    nextStepId: "BM-16A",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
  {
    id: "BM-16A",
    name: "Finality Verification",
    phase: "AUTHORIZATION_FINAL",
    capability: "CONTROL_PLANE_CORE",
    status: "ACTIVE",
    description:
      "MITHQAL Core verifies settlement finality conditions are met (atomic, irrevocable, legally " +
      "certain). Asset-agnostic — works for any settlement asset. This is the FINAL control-plane " +
      "step; the bank then executes settlement via the chosen rail (BM-16B for MTQ, or the bank's " +
      "own rail for any other asset).",
    previousStepId: "BM-15",
    nextStepId: "BM-16B",
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },

  // ---- Phase: EXECUTION (BM-16B — MTQ Settlement Module, OPTIONAL) ----
  // Per J-directive: BM-16B = Mint Execution. OPTIONAL — capability is
  // MTQ_SETTLEMENT_MODULE, NOT CONTROL_PLANE_CORE. SKIPPED if the
  // settlement asset is bank money, CBDC, RTGS, tokenized deposits, or
  // wholesale CBDC — in those cases the bank executes settlement directly
  // via its own rails and BM-16B is marked COMPLETED-NOT-REQUIRED.
  {
    id: "BM-16B",
    name: "Mint Execution (MTQ-specific)",
    phase: "EXECUTION",
    capability: "MTQ_SETTLEMENT_MODULE",
    status: "ACTIVE",
    optional: true,
    description:
      "MTQ-specific mint execution. Only runs when SettlementAssetType = 'MTQ' AND " +
      "MTQ_SETTLEMENT_ENABLED = 'true'. For any other asset type, this step is marked " +
      "COMPLETED-NOT-REQUIRED (the bank executes settlement via its own rails — RTGS, CBDC, " +
      "correspondent banking, etc.). When MTQ_SETTLEMENT_ENABLED = 'false', this step is marked " +
      "COMPLETED-NOT-REQUIRED for ALL asset types.",
    previousStepId: "BM-16A",
    nextStepId: null,
    failureMode: "BLOCK",
    auditRecordRequired: true,
  },
];

// ---- Helpers (preserved from J3 — consumed by /api/control-plane/settlement-status) ----

/**
 * Returns the control-plane half of the canonical workflow (BM-01..BM-16A).
 *
 * These steps are asset-agnostic and ALWAYS run regardless of the chosen
 * SettlementAssetType or whether the MTQ module is enabled. They
 * constitute the CONTROL_PLANE_CORE capability.
 */
export function getControlPlaneWorkflow(): CanonicalBMStep[] {
  return CANONICAL_SETTLEMENT_WORKFLOW.filter(
    (s) => s.capability === "CONTROL_PLANE_CORE",
  );
}

/**
 * Returns the MTQ-specific half of the canonical workflow (BM-16B).
 *
 * This is the MTQ_SETTLEMENT_MODULE capability. The step is returned
 * regardless of the MTQ_SETTLEMENT_ENABLED flag — callers should inspect
 * the step's `status` field to determine whether it's ACTIVE or
 * COMPLETED-NOT-REQUIRED. When MTQ_SETTLEMENT_ENABLED = false, the step
 * is marked COMPLETED-NOT-REQUIRED (it's still in the canonical workflow
 * definition, but it will never execute).
 *
 * When MTQ_SETTLEMENT_ENABLED = true (default), the step is ACTIVE.
 */
export function getMTQSettlementWorkflow(): CanonicalBMStep[] {
  const mtqSteps = CANONICAL_SETTLEMENT_WORKFLOW.filter(
    (s) => s.capability === "MTQ_SETTLEMENT_MODULE",
  );

  // When MTQ is disabled, mark all MTQ-specific steps as COMPLETED-NOT-REQUIRED
  // (they remain in the canonical workflow definition, but they won't execute).
  if (!isMTQSettlementEnabled()) {
    return mtqSteps.map((s) => ({
      ...s,
      status: "COMPLETED-NOT-REQUIRED" as const,
    }));
  }
  return mtqSteps;
}

/**
 * Compute the runtime status of a given BM-* step for a specific
 * settlement asset type.
 *
 * - Control-plane steps (BM-01..BM-16A): always "ACTIVE" (they always
 *   run, regardless of asset type).
 * - MTQ-specific steps (BM-16B):
 *   - If SettlementAssetType = "MTQ" AND MTQ_SETTLEMENT_ENABLED = true → "ACTIVE"
 *   - Otherwise → "COMPLETED-NOT-REQUIRED"
 *
 * This helper is used by /api/control-plane/settlement-status to show
 * how the workflow adapts to the chosen asset type + MTQ-enabled state.
 */
export function getStepStatusForAsset(
  step: CanonicalBMStep,
  assetType: SettlementAssetType = DEFAULT_SETTLEMENT_ASSET,
): CanonicalBMStep["status"] {
  if (step.capability === "CONTROL_PLANE_CORE") {
    return "ACTIVE";
  }
  // MTQ_SETTLEMENT_MODULE step
  if (step.capability === "MTQ_SETTLEMENT_MODULE") {
    if (assetType === "MTQ" && isMTQSettlementEnabled()) {
      return "ACTIVE";
    }
    return "COMPLETED-NOT-REQUIRED";
  }
  return "ACTIVE";
}

// ============================================================================
// v25.3.2-J2 ADDITIVE EXTENSIONS (canonical BM-* lookup + state machine
// helpers, audit trail, terminology registry pointer).
//
// These exports are ADDITIVE — they do not conflict with J3's surface.
// They exist so other modules (final-integrated-architecture.ts,
// mtq-os/index.ts, v24-2-registry.ts, v24-2-state-machine.ts,
// policy-registry.ts, the contradiction scanner) can resolve BM-*
// definitions to exactly one meaning per ID per the J-directive.
// ============================================================================

/**
 * Return the canonical step definition for a BM-* id, or undefined if no
 * such canonical step exists (e.g. the legacy "BM-16" without an A/B
 * suffix is NOT canonical and will return undefined).
 */
export function getCanonicalBMStep(id: string): CanonicalBMStep | undefined {
  return CANONICAL_SETTLEMENT_WORKFLOW.find((s) => s.id === id);
}

/**
 * Return the subset of the canonical workflow owned by a given capability
 * module. CONTROL_PLANE_CORE owns 16 steps (BM-01..BM-16A);
 * MTQ_SETTLEMENT_MODULE owns 1 step (BM-16B).
 */
export function getWorkflowForCapability(
  capability: "CONTROL_PLANE_CORE" | "MTQ_SETTLEMENT_MODULE",
): CanonicalBMStep[] {
  return CANONICAL_SETTLEMENT_WORKFLOW.filter((s) => s.capability === capability);
}

/**
 * Returns true if the given BM-* id is canonical (i.e. present in
 * CANONICAL_SETTLEMENT_WORKFLOW). Use this in the contradiction scanner
 * to flag any inline BM-* definition in the codebase as a contradiction.
 */
export function isCanonicalBMId(id: string): boolean {
  return CANONICAL_SETTLEMENT_WORKFLOW.some((s) => s.id === id);
}

/**
 * Returns the list of canonical BM-* ids (17 total: BM-01..BM-14, BM-15,
 * BM-16A, BM-16B). Useful for the contradiction scanner to enumerate
 * exactly the IDs that may appear in the codebase.
 */
export function getCanonicalBMIds(): readonly string[] {
  return CANONICAL_SETTLEMENT_WORKFLOW.map((s) => s.id);
}

/**
 * Returns the entry step (BM-01) of the canonical workflow. Always
 * present; throws if missing (would indicate corruption of this file).
 */
export function getWorkflowEntryStep(): CanonicalBMStep {
  const entry = CANONICAL_SETTLEMENT_WORKFLOW.find((s) => s.previousStepId === null);
  if (!entry) {
    throw new Error(
      "settlement-workflow-canonical: no entry step found (corruption)",
    );
  }
  return entry;
}

/**
 * Returns the terminal step(s) of the canonical workflow. For the v25.3.2
 * canonical release this is exactly BM-16B. (BM-16A also terminates if
 * the settlement asset is not MTQ — see the Mermaid diagram in
 * docs/diagrams/settlement-workflow.mmd.)
 */
export function getWorkflowTerminalSteps(): CanonicalBMStep[] {
  return CANONICAL_SETTLEMENT_WORKFLOW.filter((s) => s.nextStepId === null);
}

// ============================================================================
// MODULE METADATA
// ============================================================================

export const CANONICAL_WORKFLOW_VERSION = "v25.3.2-J2-1.0";
export const CANONICAL_WORKFLOW_SOURCE = "src/lib/settlement-workflow-canonical.ts";
export const CANONICAL_WORKFLOW_ACTIVE_MODEL = "v25.3.2";
export const CANONICAL_WORKFLOW_STEP_COUNT = CANONICAL_SETTLEMENT_WORKFLOW.length; // 17

/**
 * Override-prevention meta (per MITHQAL-V25.3.2-REMEDIATION-LAYER.md §3).
 * Mirrors the _meta block on /api/policy-registry and /api/legal-evidence
 * so any consumer can verify this is the active canonical source.
 */
export const CANONICAL_WORKFLOW_META = {
  activeModel: CANONICAL_WORKFLOW_ACTIVE_MODEL,
  source: CANONICAL_WORKFLOW_SOURCE,
  version: CANONICAL_WORKFLOW_VERSION,
  stepCount: CANONICAL_WORKFLOW_STEP_COUNT,
  overridePreventionRule:
    "This file is the SINGLE CANONICAL SOURCE for BM-* definitions. " +
    "Any other BM-* definition in the codebase is a CONTRADICTION per the " +
    "contradiction scanner and must be removed or re-pointed to this source. " +
    "See MITHQAL-V25.3.2-REMEDIATION-LAYER.md §3 Rule 3 (No Silent Override).",
  capabilityBoundary:
    "CONTROL_PLANE_CORE owns BM-01..BM-16A (asset-agnostic). " +
    "MTQ_SETTLEMENT_MODULE owns BM-16B only (OPTIONAL — skipped when " +
    "settlement asset ≠ MTQ OR when MTQ_SETTLEMENT_ENABLED = false).",
} as const;

// ============================================================================
// SUPERSEDED DEFINITIONS (for traceability / contradiction scanner)
// ============================================================================
//
// The following definitions are SUPERSEDED by this canonical source. They
// are documented here so the contradiction scanner can match them and
// operators can audit what was removed:
//
//   SUPERSEDED-1 (was in src/lib/final-integrated-architecture.ts:1188):
//     "BM-15 — MITHQAL executes Mint Permission Engine (15-step issuance
//      authorization gate — ANY FAILURE = BLOCK)."
//   Replacement: BM-15 = "Monetary Authorization" (above).
//
//   SUPERSEDED-2 (was in src/lib/final-integrated-architecture.ts:1189):
//     "BM-16 — Technical Mint Execution: canonical ledger mints MTQ;
//      bank MTQ subledger updated; corporate MTQ settlement position
//      updated."
//   Replacement: BM-16A = "Finality Verification" + BM-16B = "Mint
//   Execution" (above).
//
//   SUPERSEDED-3 (was in src/lib/mtq-os/index.ts:25):
//     "BM-16 — Finality Verification + Mint — Finality verified →
//      deterministic mint"
//   Replacement: same as SUPERSEDED-2 — split into BM-16A + BM-16B.
//
//   SUPERSEDED-4 (was in src/lib/finality-before-mint.ts:79, 187, 190):
//     References to "BM-15 = finality verification" and
//     "BM-16 = mint" (the workflow engine treated BM-15 as the finality
//     gate and BM-16 as the mint). Under the canonical mapping, finality
//     is BM-16A and mint is BM-16B; BM-15 is Monetary Authorization.
//   Replacement: finality is BM-16A; mint is BM-16B; BM-15 is Monetary
//   Authorization (above).
//
//   SUPERSEDED-5 (was J3's earlier draft of this same file,
//   src/lib/settlement-workflow-canonical.ts):
//     BM-09 = "Eligible Reserve / Settlement Asset Verification"
//     BM-10 = "Custody Verification"
//     BM-11 = "NAV Calculation (when applicable)"
//     BM-12 = "Reserve Ratio / Stress-RR / Constitutional Checks"
//     BM-13 = "Proof of Reserves"
//     BM-14 = "Proof of Solvency"
//     BM-15 = "Deterministic Issuance Authorization"
//     BM-16A = "Settlement Authorization (Asset-Agnostic)"
//     BM-16B = "Mint Execution (MTQ-specific)"  (UNCHANGED — matches)
//   Replacement: per J-directive canonical mapping above (BM-09 =
//   "Eligibility Check", BM-10 = "Jurisdiction Check", BM-11 = "Backing
//   Verification", BM-12 = "Bank-Specific Risk Assessment", BM-13 =
//   "System-Wide Risk / Concentration Check", BM-14 = "DMCE", BM-15 =
//   "Monetary Authorization", BM-16A = "Finality Verification", BM-16B =
//   "Mint Execution (MTQ-specific)"). The custody / NAV / proof-of-
//   reserves / proof-of-solvency concerns from J3's draft are folded
//   INTO the canonical step descriptions where they belong (Backing
//   Verification includes custody; Bank Risk includes reserve ratio +
//   stress-RR; System Risk includes proof-of-reserves + proof-of-
//   solvency surfaces). They are no longer top-level BM-* steps because
//   the J-directive mandates exactly 17 IDs with the exact names above.
