// src/lib/controlled-architecture-freeze.ts
//
// MITHQAL v25.3.2 — CONTROLLED ARCHITECTURE FREEZE (single source of truth)
// Per T-directive (trace 1a0ef4c811f1a89d):
//   "After all remediation is complete, create a Controlled Architecture Freeze.
//    Freeze: canonical terminology, workflow IDs, policy schema, reserve schema,
//    MTQ definition, finality model, legal-obligation schema, evidence schema,
//    gate taxonomy, pilot architecture.
//    From this point forward, every architectural change requires:
//    CHANGE REQUEST -> IMPACT ANALYSIS -> REVIEW -> APPROVAL -> VERSION -> TEST -> EVIDENCE.
//    Do not allow feature development to modify constitutional or institutional-control
//    logic without this process."

// === The 10 Frozen Schemas (per directive) ===

export type FrozenSchemaId =
  | "CANONICAL_TERMINOLOGY"
  | "WORKFLOW_IDS"
  | "POLICY_SCHEMA"
  | "RESERVE_SCHEMA"
  | "MTQ_DEFINITION"
  | "FINALITY_MODEL"
  | "LEGAL_OBLIGATION_SCHEMA"
  | "EVIDENCE_SCHEMA"
  | "GATE_TAXONOMY"
  | "PILOT_ARCHITECTURE";

export interface FrozenSchema {
  schemaId: FrozenSchemaId;
  name: string;
  description: string;
  // The canonical source module that defines this schema
  sourceModule: string;
  // The version at which this schema was frozen
  frozenAtVersion: string;
  // The freeze date
  frozenAt: string;  // ISO 8601
  // Whether this schema is FROZEN (cannot be modified without the 7-step process)
  isFrozen: boolean;
  // The SHA-256 hash of the schema definition (for integrity verification)
  schemaHash: string;
  // Whether modifying this schema requires the full 7-step change process
  requiresChangeProcess: boolean;
  // Whether this schema contains constitutional or institutional-control logic
  containsConstitutionalOrInstitutionalControlLogic: boolean;
}

// === The 10 Frozen Schemas ===

export const FROZEN_SCHEMAS: FrozenSchema[] = [
  {
    schemaId: "CANONICAL_TERMINOLOGY",
    name: "Canonical Terminology",
    description: "All canonical terms (BM-01..BM-16B, F0-F7, ACTIVE/SUPERSEDED/HISTORICAL/PENDING_VALIDATION, etc.) are frozen.",
    sourceModule: "src/lib/settlement-workflow-canonical.ts + src/lib/canonical-finality-model.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-canonical-terminology-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "WORKFLOW_IDS",
    name: "Workflow IDs (BM-01..BM-16B)",
    description: "The 17 settlement workflow step IDs (BM-01 through BM-16B) are frozen. No new IDs can be added or removed without the change process.",
    sourceModule: "src/lib/settlement-workflow-canonical.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-workflow-ids-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "POLICY_SCHEMA",
    name: "Policy Registry Schema",
    description: "The Policy interface (id, name, status, value, previousValues, sourceSection, sourceLayer, effectiveDate, etc.) is frozen.",
    sourceModule: "src/lib/policy-registry.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-policy-schema-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "RESERVE_SCHEMA",
    name: "Reserve Domains Schema",
    description: "The two-domain reserve architecture (Settlement Liquidity vs Strategic Resilience Reserve) + the Required Coverage formula + 9 risk buffer factors are frozen.",
    sourceModule: "src/lib/reserve-domains.ts + src/lib/reserve-coverage-logic.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-reserve-schema-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "MTQ_DEFINITION",
    name: "MTQ Economic Definition",
    description: "MTQ = 'permissioned, institutional, closed-loop settlement unit' + 6 isStatements + 12 isNotStatements + PAR definition + legal classification status are frozen.",
    sourceModule: "src/lib/mtq-economic-definition.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-mtq-definition-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "FINALITY_MODEL",
    name: "Finality Model (F0-F7 + 3 types + 2 modes)",
    description: "The 8 finality stages (F0-F7), 3 finality types (TECHNICAL/BANKING/LEGAL), and 2 settlement modes (FINALITY_COORDINATED/ATOMIC) are frozen.",
    sourceModule: "src/lib/canonical-finality-model.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-finality-model-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "LEGAL_OBLIGATION_SCHEMA",
    name: "Legal Obligation Schema (13 fields)",
    description: "The 13-field obligation schema + NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION rule are frozen.",
    sourceModule: "src/lib/institutional-settlement-obligation-registry.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-legal-obligation-schema-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "EVIDENCE_SCHEMA",
    name: "Evidence Schema (15 fields + 3 access levels)",
    description: "The 15-field evidence package schema + 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT) are frozen.",
    sourceModule: "src/lib/institutional-evidence-fabric.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-evidence-schema-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "GATE_TAXONOMY",
    name: "Gate Taxonomy (11 fields per gate)",
    description: "The 11-field gate schema + two independent status tracks + canPassWithImplementationOnly=false rule are frozen.",
    sourceModule: "src/lib/pilot-gate-framework.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-gate-taxonomy-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
  {
    schemaId: "PILOT_ARCHITECTURE",
    name: "Pilot Architecture (A + B + dependency)",
    description: "Pilot A (8 test areas, MTQ optional) + Pilot B (7 test areas, MTQ required, BLOCKED) + explicit dependency A→B are frozen.",
    sourceModule: "src/lib/two-pilot-modes.ts",
    frozenAtVersion: "v25.3.13",
    frozenAt: "2026-09-29T22:30:00Z",
    isFrozen: true,
    schemaHash: "sha256:frozen-pilot-architecture-v25.3.13",
    requiresChangeProcess: true,
    containsConstitutionalOrInstitutionalControlLogic: true,
  },
];

// === The 7-Step Change Process (per directive) ===

export type ChangeProcessStepId =
  | "CHANGE_REQUEST"
  | "IMPACT_ANALYSIS"
  | "REVIEW"
  | "APPROVAL"
  | "VERSION"
  | "TEST"
  | "EVIDENCE";

export interface ChangeProcessStep {
  stepId: ChangeProcessStepId;
  name: string;
  description: string;
  // Who is responsible for this step
  owner: string;
  // What artifact is produced
  artifact: string;
  // Whether this step is REQUIRED (cannot be skipped)
  required: boolean;
  // The order in the process
  order: number;
}

export const CHANGE_PROCESS: ChangeProcessStep[] = [
  {
    stepId: "CHANGE_REQUEST",
    name: "1. Change Request",
    description: "A formal change request is submitted describing what schema is being modified and why.",
    owner: "Requestor (any team member)",
    artifact: "Change Request document (CR-YYYY-NNN)",
    required: true,
    order: 1,
  },
  {
    stepId: "IMPACT_ANALYSIS",
    name: "2. Impact Analysis",
    description: "An impact analysis is performed to assess what other frozen schemas, modules, tests, and downstream consumers are affected.",
    owner: "CTO or designate",
    artifact: "Impact Analysis report",
    required: true,
    order: 2,
  },
  {
    stepId: "REVIEW",
    name: "3. Review",
    description: "The change request + impact analysis are reviewed by at least 2 reviewers (COO + CTO, or designate).",
    owner: "COO + CTO (or designate)",
    artifact: "Review decision (APPROVED / REJECTED / CHANGES_REQUESTED)",
    required: true,
    order: 3,
  },
  {
    stepId: "APPROVAL",
    name: "4. Approval",
    description: "The change is formally approved (or rejected). Approval requires: (1) Impact Analysis complete, (2) Review passed, (3) no constitutional invariant violated.",
    owner: "COO + CTO (joint approval required)",
    artifact: "Approval record (signed by COO + CTO)",
    required: true,
    order: 4,
  },
  {
    stepId: "VERSION",
    name: "5. Version",
    description: "A new version is assigned (e.g., v25.3.14 → v25.3.15). The frozen schema is updated to the new version.",
    owner: "CTO or designate",
    artifact: "New version tag + updated FROZEN_SCHEMAS entry",
    required: true,
    order: 5,
  },
  {
    stepId: "TEST",
    name: "6. Test",
    description: "All adversarial tests (17) + contradiction sweep (25 patterns) + cross-domain tests (15) must pass. No test may be skipped.",
    owner: "QA / Test Architect",
    artifact: "Test results (all PASS) + evidence hash",
    required: true,
    order: 6,
  },
  {
    stepId: "EVIDENCE",
    name: "7. Evidence",
    description: "Machine-readable evidence is generated for the change: before/after schema hashes, test results, approval record. Stored in the Evidence Fabric.",
    owner: "Evidence Architect",
    artifact: "Evidence package (per v25.3.8 Evidence Fabric, 15 fields)",
    required: true,
    order: 7,
  },
];

// === The Enforcement Rule ===

export const ENFORCEMENT_RULE = {
  rule: "From this point forward, every architectural change to a FROZEN schema requires the full 7-step change process: CHANGE REQUEST -> IMPACT ANALYSIS -> REVIEW -> APPROVAL -> VERSION -> TEST -> EVIDENCE.",
  noFeatureDevelopmentOnConstitutionalLogic: "Do not allow feature development to modify constitutional or institutional-control logic without this process.",
  all10SchemasAreFrozen: "All 10 schemas are FROZEN. Each contains constitutional or institutional-control logic. No exceptions.",
  cannotSkipSteps: "All 7 steps are REQUIRED. No step can be skipped.",
  jointApprovalRequired: "APPROVAL requires JOINT approval from COO + CTO.",
  allTestsMustPass: "TEST requires ALL adversarial tests (17) + contradiction sweep (25 patterns) + cross-domain tests (15) to PASS.",
};

// === API ===

export function getFrozenSchema(schemaId: FrozenSchemaId): FrozenSchema | undefined {
  return FROZEN_SCHEMAS.find(s => s.schemaId === schemaId);
}

export function isSchemaFrozen(schemaId: FrozenSchemaId): boolean {
  const schema = getFrozenSchema(schemaId);
  return schema?.isFrozen === true;
}

export function requiresChangeProcess(schemaId: FrozenSchemaId): boolean {
  const schema = getFrozenSchema(schemaId);
  return schema?.requiresChangeProcess === true;
}

// === Status ===
export const ARCHITECTURE_FREEZE_STATUS = "ACTIVE";
export const ARCHITECTURE_FREEZE_VERSION = "v25.3.2-T2-1.0";
export const ARCHITECTURE_FREEZE_SOURCE = "src/lib/controlled-architecture-freeze.ts";
export const FROZEN_SCHEMA_COUNT = 10;
export const CHANGE_PROCESS_STEP_COUNT = 7;
