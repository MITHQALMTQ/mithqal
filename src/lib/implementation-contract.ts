// =============================================================================
// src/lib/implementation-contract.ts
// MITHQAL · MTQ Canonical Blueprint v1.0 — §15 "AI developer implementation contract"
// =============================================================================
// Task ID: IMPL-V1-BLUEPRINT
//
// Per v1.0 §15:
//
//   Mandate:
//     "Implement only approved scope. Do not infer legal facts, invent
//      providers/contracts, claim integrations without runtime evidence, add
//      live payment functions, enable MTQ, create paid resources, expose
//      secrets or change authority without approved change request."
//
//   Traceability:
//     Assign stable IDs to every requirement. Link each to design, code,
//     schema/config, tests, evidence, acceptance criteria, owner, status
//     and rollback. Missing links block completion claims.
//
//   Change control:
//     Change request → rationale/impact → security/legal/commercial review
//     where relevant → owner approval → versioned implementation → tests →
//     evidence → release manifest → rollback. Preserve historical decisions.
//
//   Acceptance:
//     Accept only when defined tests pass, evidence is attached, limitations
//     are recorded and owner accepts. Built, configured, deployed, tested,
//     externally reviewed and authorized are different states.
//
//   Required artifacts:
//     README/status; requirement register; architecture diagram; data
//     dictionary; interface contracts; policy registry; event/state model;
//     threat model; test plan/results; scenario fixtures; evidence schema;
//     cost plan; risk register; legal issue map; competitive evidence
//     register; demo runbook; release manifest; rollback/recovery runbook.
//
// NOTE ON COUNT: §15 of the blueprint enumerates 18 distinct artifacts in
// the canonical list above. The task brief mentions "17" but then enumerates
// the same 18 items. To remain faithful to the canonical §15 text we
// implement all 18 entries; the discrepancy is documented here per §15
// "Preserve historical decisions."
//
// HONEST STATE (per v1.0 §0 "DESIGN-STAGE ONLY"):
//   - productionAuthorized = false
//   - MTQ DISABLED
//   - All artifact statuses below are SYNTHETIC Pilot A tracking entries
// =============================================================================

export type ArtifactStatus =
  | "MISSING"
  | "DRAFT"
  | "COMPLETE"
  | "EVIDENCE_LINKED"
  | "ACCEPTED";

export interface RequiredArtifact {
  artifactId: string;
  name: string;
  description: string;
  status: ArtifactStatus;
  evidenceRef: string;
  owner: string;
  blueprint_ref: "v1.0 §15";
  provenance: "synthetic";
}

const BLUEPRINT_REF = "v1.0 §15" as const;

/**
 * The 18 required artifacts per v1.0 §15 canonical list. Each entry is
 * initially in the most-honest status for the current design stage
 * (typically DRAFT or MISSING), so the contract cannot be misrepresented
 * as ACCEPTED before evidence is attached.
 */
export const REQUIRED_ARTIFACTS: RequiredArtifact[] = [
  {
    artifactId: "ART-01",
    name: "README/status",
    description: "Repository README and canonical status (version, honest-state, scope).",
    status: "COMPLETE",
    evidenceRef: "/README + /VERSION-PROVENANCE.yml",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-02",
    name: "Requirement register",
    description: "Stable-ID requirements linked to design, code, schema/config, tests, evidence, acceptance criteria, owner, status, rollback.",
    status: "DRAFT",
    evidenceRef: "in-progress: requirements being numbered",
    owner: "product-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-03",
    name: "Architecture diagram",
    description: "System architecture diagram with components, data flows, trust boundaries.",
    status: "DRAFT",
    evidenceRef: "in-progress: gateway v1 architecture diagram",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-04",
    name: "Data dictionary",
    description: "Canonical field definitions for all persistence + API surfaces.",
    status: "DRAFT",
    evidenceRef: "in-progress: evidence passport + exception case schemas",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-05",
    name: "Interface contracts",
    description: "Versioned API contracts for every public endpoint including /gateway/v1/*.",
    status: "DRAFT",
    evidenceRef: "in-progress: gateway v1 route catalog",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-06",
    name: "Policy registry",
    description: "Versioned policy registry (gates, tolerances, exception transitions).",
    status: "DRAFT",
    evidenceRef: "POLICY-v1.0-PilotA",
    owner: "governance-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-07",
    name: "Event/state model",
    description: "Event and state machine model (finality state, exception state).",
    status: "DRAFT",
    evidenceRef: "in-progress: finality-state-machine + exception-resolution TRANSITIONS",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-08",
    name: "Threat model",
    description: "Threat model (STRIDE or equivalent) covering API, data, MTQ.",
    status: "MISSING",
    evidenceRef: "not yet started",
    owner: "security-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-09",
    name: "Test plan/results",
    description: "Test plan with results linked to requirements via stable IDs.",
    status: "DRAFT",
    evidenceRef: "in-progress: adversarial scenarios + e2e tests",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-10",
    name: "Scenario fixtures",
    description: "Scenario fixtures for the Corridor Digital Twin and Exception Network.",
    status: "COMPLETE",
    evidenceRef: "src/lib/corridor-digital-twin.ts + src/lib/exception-resolution.ts",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-11",
    name: "Evidence schema",
    description: "Evidence Passport schema with provenance + truth labels per §5A.",
    status: "COMPLETE",
    evidenceRef: "src/lib/evidence-passport.ts",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-12",
    name: "Cost plan",
    description: "Cost plan (integration cost, ongoing compliance cost, risk/capital cost, maintenance).",
    status: "MISSING",
    evidenceRef: "not yet started",
    owner: "ceo",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-13",
    name: "Risk register",
    description: "Risk register and stop/pivot rules per §14.",
    status: "COMPLETE",
    evidenceRef: "src/lib/risk-register.ts",
    owner: "governance-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-14",
    name: "Legal issue map",
    description: "Legal issue map (licensing, capital, liability, supervision) per §11.",
    status: "MISSING",
    evidenceRef: "not yet started; no external legal review",
    owner: "legal-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-15",
    name: "Competitive evidence register",
    description: "Competitive evidence register (alternatives, total cost/risk).",
    status: "DRAFT",
    evidenceRef: "in-progress: alternatives catalog",
    owner: "product-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-16",
    name: "Demo runbook",
    description: "Demo runbook covering Evidence + Exception Control Workbench per §16.",
    status: "DRAFT",
    evidenceRef: "in-progress: gateway v1 demo routes",
    owner: "product-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-17",
    name: "Release manifest",
    description: "Release manifest linking to built, configured, deployed, tested, externally reviewed, authorized states.",
    status: "MISSING",
    evidenceRef: "not yet started; design-stage only",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
  {
    artifactId: "ART-18",
    name: "Rollback/recovery runbook",
    description: "Rollback and recovery runbook per §15 change control + §14 financing-gap rule.",
    status: "MISSING",
    evidenceRef: "not yet started",
    owner: "engineering-lead",
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
  },
];

// -----------------------------------------------------------------------------
// AI developer mandate per §15
// -----------------------------------------------------------------------------

/**
 * The AI developer mandate per v1.0 §15. This is the canonical boundary
 * inside which the AI developer agent must operate; every line below is
 * a prohibition or required-behaviour rule drawn directly from §15.
 */
export const IMPLEMENTATION_MANDATE = {
  scope: "Implement only approved scope.",
  prohibitions: [
    "Do not infer legal facts.",
    "Do not invent providers/contracts.",
    "Do not claim integrations without runtime evidence.",
    "Do not add live payment functions.",
    "Do not enable MTQ.",
    "Do not create paid resources.",
    "Do not expose secrets.",
    "Do not change authority without an approved change request.",
  ],
  traceability:
    "Assign stable IDs to every requirement. Link each to design, code, schema/config, tests, evidence, acceptance criteria, owner, status and rollback. Missing links block completion claims.",
  acceptance:
    "Accept only when defined tests pass, evidence is attached, limitations are recorded and owner accepts. Built, configured, deployed, tested, externally reviewed and authorized are different states.",
  noAutomaticPhaseTransition:
    "Completion of this blueprint does not authorize Pilot B, bank integration, live settlement, MTQ, paid services or production deployment. Each requires a new explicit decision and evidence review.",
  blueprint_ref: BLUEPRINT_REF,
  honestState: "DESIGN-STAGE" as const,
} as const;

// -----------------------------------------------------------------------------
// Change control per §15
// -----------------------------------------------------------------------------

/**
 * The 8-step change control process per v1.0 §15 "Change control":
 *
 *   Change request → rationale/impact → security/legal/commercial review
 *   where relevant → owner approval → versioned implementation → tests →
 *   evidence → release manifest → rollback. Preserve historical decisions.
 */
export interface ChangeControlStep {
  step: number;
  name: string;
  description: string;
  required: boolean;
}

export const CHANGE_CONTROL_STEPS: ChangeControlStep[] = [
  {
    step: 1,
    name: "Change request",
    description: "Submit a documented change request with a stable ID.",
    required: true,
  },
  {
    step: 2,
    name: "Rationale/impact",
    description: "Document rationale and impact analysis (scope, cost, risk).",
    required: true,
  },
  {
    step: 3,
    name: "Security/legal/commercial review",
    description: "Conduct security, legal, and commercial review where relevant.",
    required: true,
  },
  {
    step: 4,
    name: "Owner approval",
    description: "Obtain owner approval before implementation.",
    required: true,
  },
  {
    step: 5,
    name: "Versioned implementation",
    description: "Implement the change in a versioned, reviewable way.",
    required: true,
  },
  {
    step: 6,
    name: "Tests",
    description: "Run defined tests; results linked to the change request.",
    required: true,
  },
  {
    step: 7,
    name: "Evidence",
    description: "Attach evidence that the change meets its acceptance criteria.",
    required: true,
  },
  {
    step: 8,
    name: "Release manifest + rollback",
    description:
      "Update the release manifest and confirm the rollback plan. Preserve historical decisions.",
    required: true,
  },
];

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Return the status of all required artifacts per §15. The summary breaks
 * down counts by status so callers can see at a glance which artifacts are
 * MISSING, DRAFT, COMPLETE, EVIDENCE_LINKED, or ACCEPTED.
 *
 * Per §15 "Acceptance": ACCEPTED is only set when defined tests pass,
 * evidence is attached, limitations are recorded, and the owner accepts.
 * As of v1.0 design-stage, NO artifact is ACCEPTED.
 */
export function getArtifactStatus(): {
  artifacts: RequiredArtifact[];
  summary: {
    total: number;
    missing: number;
    draft: number;
    complete: number;
    evidenceLinked: number;
    accepted: number;
    acceptanceRule: string;
    blueprint_ref: "v1.0 §15";
    honestState: "DESIGN-STAGE";
  };
  mandate: typeof IMPLEMENTATION_MANDATE;
  changeControlSteps: ChangeControlStep[];
} {
  const missing = REQUIRED_ARTIFACTS.filter((a) => a.status === "MISSING").length;
  const draft = REQUIRED_ARTIFACTS.filter((a) => a.status === "DRAFT").length;
  const complete = REQUIRED_ARTIFACTS.filter((a) => a.status === "COMPLETE").length;
  const evidenceLinked = REQUIRED_ARTIFACTS.filter(
    (a) => a.status === "EVIDENCE_LINKED",
  ).length;
  const accepted = REQUIRED_ARTIFACTS.filter((a) => a.status === "ACCEPTED").length;

  return {
    artifacts: REQUIRED_ARTIFACTS,
    summary: {
      total: REQUIRED_ARTIFACTS.length,
      missing,
      draft,
      complete,
      evidenceLinked,
      accepted,
      acceptanceRule:
        "Accept only when defined tests pass, evidence is attached, limitations are recorded " +
        "and owner accepts. Built, configured, deployed, tested, externally reviewed and " +
        "authorized are different states (v1.0 §15).",
      blueprint_ref: BLUEPRINT_REF,
      honestState: "DESIGN-STAGE",
    },
    mandate: IMPLEMENTATION_MANDATE,
    changeControlSteps: CHANGE_CONTROL_STEPS,
  };
}
