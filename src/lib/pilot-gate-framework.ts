// src/lib/pilot-gate-framework.ts
//
// MITHQAL v25.3.2 — CANONICAL PILOT GATE FRAMEWORK (single source of truth)
// Per Q-directive (trace 1a0ef141e52acf31):
//   "Build a pilot gate framework around evidence, not documentation volume.
//    Each gate must contain: objective, owner, dependency, acceptance
//    criterion, evidence artifact, evidence hash, reviewer, approval, expiry,
//    remediation, production impact.
//    No gate can become PASSED merely because code exists or tests pass.
//    Keep institutional validation separate from implementation/testing status."
//
// This is the SINGLE CANONICAL SOURCE for the pilot gate framework.
// Gates are EVIDENCE-BASED — not documentation-volume-based.
// No gate can become PASSED merely because code exists or tests pass.
//
// Lineage (per /home/z/my-project/worklog.md v25.3.2 -> v25.3.10):
//   - v25.3.2 (commit f1f2383): controlled remediation layer, 5-layer authority
//     hierarchy + 4 status markers (ACTIVE/SUPERSEDED/HISTORICAL/PENDING_VALIDATION).
//   - v25.3.4 (J3): CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE capability boundary.
//   - v25.3.7 (N2): 3 trust domains A/B/C + 15-field EvidencePackage.
//   - v25.3.8 (N1): canonical finality model F0-F7.
//   - v25.3.9 (O1/O2): obligation registry (13 fields) + 6 reconciliation tolerance
//     policies (LEDGER_TO_LEDGER, BANK_ATTESTATION, CUSTODY_QUANTITY,
//     MARKET_VALUATION, FX_VALUATION, STRESSED_VALUATION).
//   - v25.3.10 (P2): two explicit pilot modes — PILOT_A_CONTROL_PLANE (8 test
//     areas A1-A8, mtqRequired=false) + PILOT_B_MTQ_SETTLEMENT (7 test areas
//     B1-B7, mtqRequired=true, BLOCKED until Pilot A passes ALL 8 + 6 legal/
//     accounting prerequisites). This module's gate IDs map 1:1 to P2's test
//     area IDs (A1_ROUTING -> GATE-A1-ROUTING, B1_PBC -> GATE-B1-PBC, ...).

// === Gate Status (per directive: "Keep institutional validation separate") ===
//
// There are TWO independent status tracks:
// 1. Implementation/Testing Status — whether the code is implemented + tests pass
// 2. Institutional Validation Status — whether an independent reviewer has
//    validated the evidence + approved the gate
//
// A gate is FULLY PASSED only when BOTH tracks are PASSED.
// Code existing + tests passing does NOT automatically make a gate PASSED.

export type ImplementationStatus =
  | "NOT_IMPLEMENTED"
  | "IN_PROGRESS"
  | "IMPLEMENTED" // code exists
  | "TESTED" // tests pass
  | "IMPLEMENTATION_BLOCKED";

export type InstitutionalValidationStatus =
  | "NOT_REVIEWED" // no reviewer has looked at it
  | "UNDER_REVIEW" // reviewer is evaluating the evidence
  | "VALIDATED" // reviewer has validated the evidence
  | "APPROVED" // reviewer has approved the gate
  | "REJECTED" // reviewer has rejected (see remediation)
  | "EXPIRED"; // approval has expired (see expiry)

export type GateStatus =
  | "PENDING" // not yet fully passed
  | "PASSED" // BOTH implementation + institutional validation passed
  | "BLOCKED" // blocked by dependency or rejection
  | "EXPIRED"; // approval expired

// === The 11-Field Pilot Gate (per directive) ===

export interface PilotGate {
  // === Identification ===
  gateId: string; // e.g., "GATE-A1-ROUTING"
  gateName: string; // e.g., "Pilot A Gate 1: Routing"
  pilotModeId: "PILOT_A_CONTROL_PLANE" | "PILOT_B_MTQ_SETTLEMENT"; // per v25.3.10
  testAreaId: string; // links to v25.3.10 pilot test areas

  // === The 11 Required Fields (per directive) ===

  // 1. Objective — what this gate is testing
  objective: string;

  // 2. Owner — who is responsible for passing this gate
  owner: {
    entityId: string;
    role: string; // e.g., "COO", "CTO", "Independent Auditor"
    bankFacingCounterpartyEntityId?: string; // per v25.3.7
  };

  // 3. Dependency — which other gates must pass first
  dependency: {
    dependsOnGateIds: string[]; // gate IDs that must be PASSED first
    rule: string; // e.g., "Gate A1 must pass before A2"
  };

  // 4. Acceptance criterion — what evidence is required to pass
  acceptanceCriterion: string; // e.g., "3 live routing transactions complete with VERIFIED reconciliation"

  // 5. Evidence artifact — what document/data proves the gate passed
  evidenceArtifact: {
    artifactType: string; // e.g., "TRANSACTION_LOG", "AUDIT_REPORT", "EVIDENCE_PACKAGE"
    artifactReference: string; // e.g., "/api/evidence-fabric?transactionId=TX-001"
    artifactDescription: string;
  };

  // 6. Evidence hash — cryptographic hash of the evidence artifact (for integrity)
  evidenceHash: string; // SHA-256 hash of the evidence artifact

  // 7. Reviewer — who reviews the evidence (independent from owner)
  reviewer: {
    reviewerId: string;
    reviewerRole: string; // e.g., "Independent Auditor", "Council Member"
    reviewerIndependenceVerified: boolean; // reviewer is independent from owner
  };

  // 8. Approval — the approval record
  approval: {
    approved: boolean;
    approvedBy?: string; // reviewer ID
    approvedAt?: string; // ISO 8601
    approvalNotes?: string;
  };

  // 9. Expiry — when the approval expires (must be re-validated)
  expiry: {
    expiryDate?: string; // ISO 8601 — when approval expires
    isExpired: boolean;
    revalidationRequired: boolean;
  };

  // 10. Remediation — what to do if the gate fails
  remediation: {
    remediationPlan?: string;
    remediationOwner?: string;
    remediationDueDate?: string;
    remediationStatus?:
      | "NOT_REQUIRED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "BLOCKED";
  };

  // 11. Production impact — what happens to production if this gate passes/fails
  productionImpact: {
    ifPassed: string; // e.g., "Pilot A routing can go to production"
    ifFailed: string; // e.g., "Pilot A routing BLOCKED — cannot go to production"
    ifExpired: string; // e.g., "Production access suspended until re-validation"
  };

  // === Status (TWO INDEPENDENT TRACKS per directive) ===
  implementationStatus: ImplementationStatus;
  institutionalValidationStatus: InstitutionalValidationStatus;
  gateStatus: GateStatus; // computed from both tracks

  // === Metadata ===
  createdAt: string;
  updatedAt: string;
}

// === Gate Status Computation ===
//
// Per directive: "No gate can become PASSED merely because code exists or
// tests pass." A gate is PASSED only when:
// 1. implementationStatus = TESTED (code exists AND tests pass)
// 2. institutionalValidationStatus = APPROVED (reviewer has approved)
// 3. expiry.isExpired = false (approval has not expired)
// 4. All dependency gates are PASSED

export function computeGateStatus(
  gate: PilotGate,
  allGates: PilotGate[]
): GateStatus {
  // Check expiry first
  if (gate.expiry.isExpired) {
    return "EXPIRED";
  }

  // Check dependencies — all dependency gates must be PASSED
  for (const depId of gate.dependency.dependsOnGateIds) {
    const depGate = allGates.find((g) => g.gateId === depId);
    if (!depGate || depGate.gateStatus !== "PASSED") {
      return "BLOCKED";
    }
  }

  // Check implementation status — must be TESTED (code exists + tests pass)
  // Per directive: "No gate can become PASSED merely because code exists or tests pass."
  // So IMPLEMENTED alone is NOT enough — must be TESTED.
  if (gate.implementationStatus !== "TESTED") {
    return "PENDING";
  }

  // Check institutional validation — must be APPROVED
  // Per directive: "Keep institutional validation separate from implementation/testing status."
  // So even if implementation is TESTED, the gate is NOT PASSED until
  // institutional validation is APPROVED.
  if (gate.institutionalValidationStatus !== "APPROVED") {
    return "PENDING";
  }

  // All conditions met — gate is PASSED
  return "PASSED";
}

// === Helper: Check if implementation alone would pass (it should NOT) ===
export function canPassWithImplementationOnly(gate: PilotGate): {
  canPass: boolean;
  reason: string;
} {
  // Per directive: "No gate can become PASSED merely because code exists or tests pass."
  return {
    canPass: false, // ALWAYS false — implementation alone NEVER passes a gate
    reason:
      "Per Q-directive: 'No gate can become PASSED merely because code exists or tests pass.' Institutional validation (reviewer approval) is REQUIRED separately.",
  };
}

// === Helper: return a shallow clone of a gate with its status recomputed ===
//
// Used by the API layer so the shared module-level gate array is NOT mutated
// across requests (which would otherwise leak stale recompute state).
export function recomputeStatusInPlace(
  gate: PilotGate,
  allGates: PilotGate[]
): PilotGate {
  return {
    ...gate,
    gateStatus: computeGateStatus(gate, allGates),
  };
}

// === The Default Gates (for Pilot A + Pilot B per v25.3.10) ===
//
// Pilot A — MITHQAL Control Plane: 8 gates (A1-A8) — no Pilot B dependency.
// Pilot B — MTQ Institutional Settlement: 7 gates (B1-B7) — gate-level
// dependencies on Pilot A gates + on earlier Pilot B gates, per v25.3.10 P2
// test-area prerequisites. Pilot B also remains BLOCKED at the pilot-mode
// level (per v25.3.10 P2.PILOT_B_MTQ_SETTLEMENT.status=BLOCKED) until
// Pilot A passes ALL 8 + 6 legal/accounting prerequisites.
//
// All gates start HONESTLY: implementationStatus=NOT_IMPLEMENTED,
// institutionalValidationStatus=NOT_REVIEWED, gateStatus=PENDING. None
// auto-pass. Evidence hashes are placeholder `sha256:pending-*` strings
// (real hashes are stamped when the Evidence Fabric packages the artifacts).

const EPOCH_ISO = "2026-09-29T20:00:00Z";

export const DEFAULT_PILOT_A_GATES: PilotGate[] = [
  {
    gateId: "GATE-A1-ROUTING",
    gateName: "Pilot A Gate 1: Routing",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A1_ROUTING",
    objective:
      "Verify that settlement routing works across the MITHQAL control plane — bank-to-bank, cross-border, multi-currency.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "CTO" },
    dependency: { dependsOnGateIds: [], rule: "No dependencies — first gate" },
    acceptanceCriterion:
      "3 live routing transactions complete with VERIFIED reconciliation (per v25.3.9 tolerance policies).",
    evidenceArtifact: {
      artifactType: "EVIDENCE_PACKAGE",
      artifactReference: "/api/evidence-fabric?transactionId=ROUTING-TX-001",
      artifactDescription:
        "Institutional Evidence Fabric package for 3 routing transactions.",
    },
    evidenceHash: "sha256:pending-ROUTING-TX-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A routing can go to production.",
      ifFailed: "Pilot A routing BLOCKED — cannot go to production.",
      ifExpired: "Production access suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A2-LIQUIDITY_OPTIMIZATION",
    gateName: "Pilot A Gate 2: Liquidity Optimization",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A2_LIQUIDITY_OPTIMIZATION",
    objective:
      "Verify that liquidity optimization reduces capital immobilization across routed legs without introducing reconciliation breaks.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "CTO" },
    dependency: {
      dependsOnGateIds: ["GATE-A1-ROUTING"],
      rule: "Routing must pass before Liquidity Optimization can be exercised.",
    },
    acceptanceCriterion:
      "Demonstrated >=20% reduction in immobilized capital across 3 routing transactions, with VERIFIED reconciliation preserved.",
    evidenceArtifact: {
      artifactType: "EVIDENCE_PACKAGE",
      artifactReference:
        "/api/evidence-fabric?transactionId=LIQUIDITY-TX-001",
      artifactDescription:
        "Evidence Fabric package for liquidity optimization runs.",
    },
    evidenceHash: "sha256:pending-LIQUIDITY-TX-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A liquidity optimization can go to production.",
      ifFailed:
        "Pilot A liquidity optimization BLOCKED — manual fallback remains required.",
      ifExpired:
        "Liquidity optimization production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A3-COMPLIANCE_ORCHESTRATION",
    gateName: "Pilot A Gate 3: Compliance Orchestration",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A3_COMPLIANCE_ORCHESTRATION",
    objective:
      "Verify that compliance screening is orchestrated once per transaction (no duplication) and the verdicts are reproducible.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "Chief Compliance Officer" },
    dependency: {
      dependsOnGateIds: ["GATE-A1-ROUTING"],
      rule: "Compliance orchestration rides on top of routing.",
    },
    acceptanceCriterion:
      "3 routed transactions each show exactly 1 compliance screening verdict, reproducible from the same inputs.",
    evidenceArtifact: {
      artifactType: "COMPLIANCE_LOG",
      artifactReference: "/api/evidence-fabric?screeningId=COMPLIANCE-001",
      artifactDescription:
        "Compliance screening verdict log for the 3 routing transactions.",
    },
    evidenceHash: "sha256:pending-COMPLIANCE-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A compliance orchestration can go to production.",
      ifFailed:
        "Pilot A compliance orchestration BLOCKED — manual screening fallback required.",
      ifExpired:
        "Compliance orchestration production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A4-RECONCILIATION",
    gateName: "Pilot A Gate 4: Reconciliation",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A4_RECONCILIATION",
    objective:
      "Verify that ledger-to-ledger, bank attestations, custody/quantity, market/FX/stressed valuation reconcile within v25.3.9 tolerance policies.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "Controller" },
    dependency: {
      dependsOnGateIds: ["GATE-A1-ROUTING"],
      rule: "Reconciliation rides on top of routing.",
    },
    acceptanceCriterion:
      "All 6 v25.3.9 tolerance policies (LEDGER_TO_LEDGER, BANK_ATTESTATION, CUSTODY_QUANTITY, MARKET_VALUATION, FX_VALUATION, STRESSED_VALUATION) verified within tolerance across 3 transactions.",
    evidenceArtifact: {
      artifactType: "RECONCILIATION_REPORT",
      artifactReference:
        "/api/evidence-fabric?reconciliationId=RECON-001",
      artifactDescription:
        "Reconciliation report covering all 6 tolerance policies.",
    },
    evidenceHash: "sha256:pending-RECON-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A reconciliation can go to production.",
      ifFailed:
        "Pilot A reconciliation BLOCKED — manual reconciliation fallback required.",
      ifExpired:
        "Reconciliation production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A5-EVIDENCE",
    gateName: "Pilot A Gate 5: Evidence",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A5_EVIDENCE",
    objective:
      "Verify that the Institutional Evidence Fabric (per v25.3.8) packages 15-field portable evidence for every routed transaction at all 3 access levels.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "CTO" },
    dependency: {
      dependsOnGateIds: ["GATE-A1-ROUTING"],
      rule: "Evidence Fabric rides on top of routing.",
    },
    acceptanceCriterion:
      "Every routed transaction produces a complete 15-field EvidencePackage with cryptographic hash, verifiable at public/regulator/internal access levels.",
    evidenceArtifact: {
      artifactType: "EVIDENCE_PACKAGE",
      artifactReference: "/api/evidence-fabric?packageId=EVIDENCE-001",
      artifactDescription:
        "Sample 15-field EvidencePackage for one routed transaction.",
    },
    evidenceHash: "sha256:pending-EVIDENCE-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A evidence packaging can go to production.",
      ifFailed: "Pilot A evidence packaging BLOCKED — transactions cannot prove provenance.",
      ifExpired:
        "Evidence packaging production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A6-FINALITY_COORDINATION",
    gateName: "Pilot A Gate 6: Finality Coordination",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A6_FINALITY_COORDINATION",
    objective:
      "Verify that finality-coordinated settlement (NOT atomic) proceeds through F0-F7 canonical stages (per v25.3.8) across 3 trust domains A/B/C (per v25.3.7).",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "COO" },
    dependency: {
      dependsOnGateIds: ["GATE-A4-RECONCILIATION"],
      rule: "Finality coordination requires reconciliation to pass.",
    },
    acceptanceCriterion:
      "3 transactions each complete F0-F7 with each stage's evidence captured in the Evidence Fabric; no atomic rollback relied upon.",
    evidenceArtifact: {
      artifactType: "FINALITY_LOG",
      artifactReference: "/api/evidence-fabric?finalityId=FINALITY-001",
      artifactDescription: "Finality-stage log for the 3 transactions.",
    },
    evidenceHash: "sha256:pending-FINALITY-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A finality coordination can go to production.",
      ifFailed: "Pilot A finality coordination BLOCKED — no production settlements.",
      ifExpired:
        "Finality coordination production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A7-FAILURE_MANAGEMENT",
    gateName: "Pilot A Gate 7: Failure Management",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A7_FAILURE_MANAGEMENT",
    objective:
      "Verify that failure + rollback paths handle the 3 failure modes (technical/banking/legal finality) without losing reconciliation integrity.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "COO" },
    dependency: {
      dependsOnGateIds: ["GATE-A6-FINALITY_COORDINATION"],
      rule: "Failure management requires finality coordination to pass.",
    },
    acceptanceCriterion:
      "Simulated failure injection across all 3 finality types results in clean rollback with reconciliation integrity preserved (per v25.3.9).",
    evidenceArtifact: {
      artifactType: "FAILURE_TEST_REPORT",
      artifactReference: "/api/evidence-fabric?failureTestId=FAILURE-001",
      artifactDescription:
        "Failure injection test report covering 3 finality types.",
    },
    evidenceHash: "sha256:pending-FAILURE-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot A failure management can go to production.",
      ifFailed: "Pilot A failure management BLOCKED — no production settlements until rollback paths verified.",
      ifExpired:
        "Failure management production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-A8-BANK_INTEGRATION",
    gateName: "Pilot A Gate 8: Bank Integration",
    pilotModeId: "PILOT_A_CONTROL_PLANE",
    testAreaId: "A8_BANK_INTEGRATION",
    objective:
      "Verify that the first bank-facing counterparty (per v25.3.7) is integrated end-to-end across routing + reconciliation + evidence + finality.",
    owner: {
      entityId: "JOZOUR_LLC_NJ",
      role: "COO",
      bankFacingCounterpartyEntityId: "FIRST_BANK_TBD",
    },
    dependency: {
      dependsOnGateIds: [
        "GATE-A1-ROUTING",
        "GATE-A4-RECONCILIATION",
        "GATE-A6-FINALITY_COORDINATION",
      ],
      rule: "Bank integration requires routing + reconciliation + finality coordination.",
    },
    acceptanceCriterion:
      "First bank counterparty completes 3 end-to-end transactions with VERIFIED reconciliation + evidence packages + F0-F7 finality.",
    evidenceArtifact: {
      artifactType: "BANK_INTEGRATION_REPORT",
      artifactReference:
        "/api/evidence-fabric?bankIntegrationId=BANK-INTEGRATION-001",
      artifactDescription:
        "End-to-end bank integration report covering the 3 transactions.",
    },
    evidenceHash: "sha256:pending-BANK-INTEGRATION-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed:
        "Pilot A bank integration can go to production. Pilot A is COMPLETE — Pilot B prerequisites met (per v25.3.10 P2 dependency rule).",
      ifFailed: "Pilot A bank integration BLOCKED — Pilot B cannot start.",
      ifExpired:
        "Bank integration production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
];

export const DEFAULT_PILOT_B_GATES: PilotGate[] = [
  {
    gateId: "GATE-B1-PBC",
    gateName: "Pilot B Gate 1: Protected Backing Cell",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B1_PBC",
    objective:
      "Verify the Protected Backing Cell (PBC) creation, verification, and anti-double-counting per v25.3.6 reserve domains.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "Treasurer" },
    dependency: {
      dependsOnGateIds: ["GATE-A4-RECONCILIATION"],
      rule: "PBC requires Pilot A reconciliation to pass (per v25.3.10 P2 B1_PBC prerequisite = A4_RECONCILIATION).",
    },
    acceptanceCriterion:
      "PBC creation + verification + anti-double-counting verified across 3 sample reserve assets with VERIFIED reconciliation.",
    evidenceArtifact: {
      artifactType: "EVIDENCE_PACKAGE",
      artifactReference: "/api/evidence-fabric?pbcId=PBC-001",
      artifactDescription: "Evidence Fabric package for 3 PBC creations.",
    },
    evidenceHash: "sha256:pending-PBC-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot B PBC creation can go to production.",
      ifFailed: "Pilot B PBC creation BLOCKED — no MTQ issuance possible.",
      ifExpired:
        "PBC production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-B2-OBLIGOR",
    gateName: "Pilot B Gate 2: Obligor",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B2_OBLIGOR",
    objective:
      "Verify legal obligor registration per v25.3.9 Institutional Settlement Obligation Registry, with NO_LEGAL_OBLIGOR enforcement.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "General Counsel" },
    dependency: {
      dependsOnGateIds: ["GATE-A5-EVIDENCE"],
      rule: "Obligor requires Pilot A evidence (per v25.3.10 P2 B2_OBLIGOR prerequisite = A5_EVIDENCE).",
    },
    acceptanceCriterion:
      "Legal obligor registered in the obligation registry (13 fields per v25.3.9 O1), with NO_LEGAL_OBLIGOR enforcement verified.",
    evidenceArtifact: {
      artifactType: "OBLIGATION_REGISTRY_ENTRY",
      artifactReference: "/api/legal-obligation-register?obligorId=OBLIGOR-001",
      artifactDescription: "Obligor entry in the Institutional Settlement Obligation Registry.",
    },
    evidenceHash: "sha256:pending-OBLIGOR-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot B obligor registration can go to production.",
      ifFailed: "Pilot B obligor registration BLOCKED — no MTQ issuance possible.",
      ifExpired:
        "Obligor production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-B3-ISSUANCE",
    gateName: "Pilot B Gate 3: Issuance",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B3_ISSUANCE",
    objective:
      "Verify MTQ mint execution (BM-16B), requiring Domain A authorization (BM-15) + Domain B attestation (BM-16A) per v25.3.7 trust domains.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "CTO" },
    dependency: {
      dependsOnGateIds: ["GATE-B1-PBC", "GATE-B2-OBLIGOR"],
      rule: "Issuance requires PBC + obligor (per v25.3.10 P2 B3_ISSUANCE prerequisites).",
    },
    acceptanceCriterion:
      "3 MTQ issuances complete with BM-15 Domain A authorization + BM-16A Domain B attestation + BM-16B mint, all captured in Evidence Fabric.",
    evidenceArtifact: {
      artifactType: "EVIDENCE_PACKAGE",
      artifactReference: "/api/evidence-fabric?issuanceId=ISSUANCE-001",
      artifactDescription: "Evidence Fabric package for 3 MTQ issuances.",
    },
    evidenceHash: "sha256:pending-ISSUANCE-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot B MTQ issuance can go to production.",
      ifFailed: "Pilot B MTQ issuance BLOCKED — no production MTQ minting.",
      ifExpired:
        "Issuance production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-B4-REDEMPTION",
    gateName: "Pilot B Gate 4: Redemption",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B4_REDEMPTION",
    objective:
      "Verify MTQ redemption (burn) against the Protected Backing Cell, returning reserve to the obligor per v25.3.6 reserve domains.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "Treasurer" },
    dependency: {
      dependsOnGateIds: ["GATE-B3-ISSUANCE"],
      rule: "Redemption requires issuance (per v25.3.10 P2 B4_REDEMPTION prerequisite).",
    },
    acceptanceCriterion:
      "3 MTQ redemptions complete with verified reserve release from PBC + burn record + reconciliation preserved.",
    evidenceArtifact: {
      artifactType: "EVIDENCE_PACKAGE",
      artifactReference: "/api/evidence-fabric?redemptionId=REDEMPTION-001",
      artifactDescription: "Evidence Fabric package for 3 MTQ redemptions.",
    },
    evidenceHash: "sha256:pending-REDEMPTION-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot B MTQ redemption can go to production.",
      ifFailed: "Pilot B MTQ redemption BLOCKED — no production MTQ redemption.",
      ifExpired:
        "Redemption production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-B5-FINALITY_BEFORE_MINT",
    gateName: "Pilot B Gate 5: Finality-Before-Mint",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B5_FINALITY_BEFORE_MINT",
    objective:
      "Verify the Finality-Before-Mint invariant: no MTQ is minted before banking + legal finality are established (per §54 Finality-Before-Mint).",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "CTO" },
    dependency: {
      dependsOnGateIds: ["GATE-B3-ISSUANCE"],
      rule: "Finality-Before-Mint requires issuance (per v25.3.10 P2 B5 prerequisite).",
    },
    acceptanceCriterion:
      "For 3 issuance attempts, mint is BLOCKED whenever banking/legal finality is missing; mint proceeds only when both are present.",
    evidenceArtifact: {
      artifactType: "INVARIANT_TEST_REPORT",
      artifactReference:
        "/api/evidence-fabric?invariantId=FINALITY-BEFORE-MINT-001",
      artifactDescription:
        "Finality-Before-Mint invariant test report covering positive + negative cases.",
    },
    evidenceHash: "sha256:pending-FINALITY-BEFORE-MINT-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot B Finality-Before-Mint invariant can go to production.",
      ifFailed:
        "Pilot B Finality-Before-Mint invariant BLOCKED — no production MTQ minting until enforced.",
      ifExpired:
        "Finality-Before-Mint invariant production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-B6-BANK_SUBLEDGER",
    gateName: "Pilot B Gate 6: Bank Subledger",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B6_BANK_SUBLEDGER",
    objective:
      "Verify that the bank-facing counterparty's subledger records every issuance/redemption with VERIFIED reconciliation per v25.3.9 tolerance policies.",
    owner: {
      entityId: "JOZOUR_LLC_NJ",
      role: "Controller",
      bankFacingCounterpartyEntityId: "FIRST_BANK_TBD",
    },
    dependency: {
      dependsOnGateIds: ["GATE-A4-RECONCILIATION", "GATE-B3-ISSUANCE"],
      rule: "Bank subledger requires Pilot A reconciliation + Pilot B issuance (per v25.3.10 P2 B6 prerequisites).",
    },
    acceptanceCriterion:
      "Bank subledger reconciles against MITHQAL ledger within tolerance for 3 issuance/redemption cycles, all 6 v25.3.9 tolerance policies met.",
    evidenceArtifact: {
      artifactType: "RECONCILIATION_REPORT",
      artifactReference:
        "/api/evidence-fabric?subledgerId=SUBLEDGER-001",
      artifactDescription:
        "Bank subledger reconciliation report covering 3 cycles.",
    },
    evidenceHash: "sha256:pending-SUBLEDGER-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed: "Pilot B bank subledger integration can go to production.",
      ifFailed:
        "Pilot B bank subledger integration BLOCKED — no production MTQ settlement with bank.",
      ifExpired:
        "Bank subledger production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
  {
    gateId: "GATE-B7-RESOLUTION",
    gateName: "Pilot B Gate 7: Resolution",
    pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
    testAreaId: "B7_RESOLUTION",
    objective:
      "Verify the MTQ bank-default resolution playbook — what happens if the first bank counterparty defaults, per v25.3.4 control-plane boundary + v25.3.9 obligation registry.",
    owner: { entityId: "JOZOUR_LLC_NJ", role: "General Counsel" },
    dependency: {
      dependsOnGateIds: ["GATE-B4-REDEMPTION", "GATE-B6-BANK_SUBLEDGER"],
      rule: "Resolution requires redemption + bank subledger (per v25.3.10 P2 B7 prerequisites).",
    },
    acceptanceCriterion:
      "Simulated bank-default scenario triggers resolution playbook: PBC reserve release, obligor obligation satisfaction, subledger freeze — all captured in Evidence Fabric.",
    evidenceArtifact: {
      artifactType: "RESOLUTION_TEST_REPORT",
      artifactReference:
        "/api/evidence-fabric?resolutionId=RESOLUTION-001",
      artifactDescription:
        "Bank-default resolution playbook test report.",
    },
    evidenceHash: "sha256:pending-RESOLUTION-001",
    reviewer: {
      reviewerId: "INDEPENDENT_AUDITOR_TBD",
      reviewerRole: "Independent Auditor",
      reviewerIndependenceVerified: false,
    },
    approval: { approved: false },
    expiry: { isExpired: false, revalidationRequired: true },
    remediation: { remediationStatus: "NOT_REQUIRED" },
    productionImpact: {
      ifPassed:
        "Pilot B resolution playbook can go to production. Pilot B is COMPLETE.",
      ifFailed:
        "Pilot B resolution playbook BLOCKED — no production MTQ settlement until resolution verified.",
      ifExpired:
        "Resolution production flag suspended until re-validation.",
    },
    implementationStatus: "NOT_IMPLEMENTED",
    institutionalValidationStatus: "NOT_REVIEWED",
    gateStatus: "PENDING",
    createdAt: EPOCH_ISO,
    updatedAt: EPOCH_ISO,
  },
];

// Combined default gate set (15 gates: 8 Pilot A + 7 Pilot B).
export const DEFAULT_ALL_PILOT_GATES: PilotGate[] = [
  ...DEFAULT_PILOT_A_GATES,
  ...DEFAULT_PILOT_B_GATES,
];

// === API ===

export function getGate(
  gateId: string,
  allGates: PilotGate[]
): PilotGate | undefined {
  return allGates.find((g) => g.gateId === gateId);
}

export function getGatesForPilotMode(
  pilotModeId: string,
  allGates: PilotGate[]
): PilotGate[] {
  return allGates.filter((g) => g.pilotModeId === pilotModeId);
}

export function getPassedGates(allGates: PilotGate[]): PilotGate[] {
  return allGates.filter((g) => g.gateStatus === "PASSED");
}

export function getBlockedGates(allGates: PilotGate[]): PilotGate[] {
  return allGates.filter((g) => g.gateStatus === "BLOCKED");
}

export function getPendingGates(allGates: PilotGate[]): PilotGate[] {
  return allGates.filter((g) => g.gateStatus === "PENDING");
}

// === Status ===
export const PILOT_GATE_FRAMEWORK_STATUS:
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION" = "ACTIVE";
export const PILOT_GATE_FRAMEWORK_VERSION = "v25.3.2-Q2-1.0";
export const PILOT_GATE_FRAMEWORK_SOURCE = "src/lib/pilot-gate-framework.ts";

// === Rule Constants ===
export const NO_CODE_ONLY_PASS_RULE =
  "No gate can become PASSED merely because code exists or tests pass. Institutional validation (reviewer approval) is REQUIRED separately.";
export const INSTITUTIONAL_VALIDATION_SEPARATE_RULE =
  "Institutional validation is SEPARATE from implementation/testing status. A gate with IMPLEMENTED+TESTED status but NOT_REVIEWED institutional validation is still PENDING, not PASSED.";
export const EVIDENCE_NOT_DOCUMENTATION_RULE =
  "Gates are EVIDENCE-BASED, not documentation-volume-based. The evidence artifact + evidence hash are the proof — not the number of pages of documentation.";

// === The 11 Required Field Names (for programmatic verification) ===
export const PILOT_GATE_FIELDS: readonly string[] = [
  "objective",
  "owner",
  "dependency",
  "acceptanceCriterion",
  "evidenceArtifact",
  "evidenceHash",
  "reviewer",
  "approval",
  "expiry",
  "remediation",
  "productionImpact",
] as const;

export const PILOT_GATE_FIELD_COUNT = PILOT_GATE_FIELDS.length; // 11
