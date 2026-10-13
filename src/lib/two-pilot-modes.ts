// src/lib/two-pilot-modes.ts
//
// MITHQAL v25.3.2 — CANONICAL TWO PILOT MODES (single source of truth)
// Per P-directive (trace 1a0eec34b13085fd):
//   "Create two explicit pilot modes.
//    Pilot A — MITHQAL Control Plane (MTQ optional/not required).
//    Test: routing, liquidity optimization, compliance orchestration,
//    reconciliation, evidence, finality coordination, failure management,
//    bank integration.
//    Pilot B — MTQ Institutional Settlement (only enabled after legal/
//    accounting prerequisites pass). Test: PBC, obligor, issuance,
//    redemption, finality-before-mint, bank subledger, resolution.
//    Make the dependency between Pilot A and Pilot B explicit."
//
// This is the SINGLE CANONICAL SOURCE for the two pilot modes. The
// dependency between Pilot A and Pilot B is EXPLICIT — Pilot B can only
// be enabled after Pilot A passes its tests AND legal/accounting
// prerequisites are met.
//
// Cross-references to prior canonical work (worklog v25.3.2 → v25.3.9):
//   - v25.3.4 (J3): CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary
//     → encoded as the `capability` field on every PilotTestArea.
//   - v25.3.6 (K4/K5): reserve domains (A/B/C/D) — referenced from the
//     B1_PBC test area description (Protected Backing Cell).
//   - v25.3.7 (N2 trust domains A/B/C): Domain A authorization + Domain B
//     attestation referenced from the B3_ISSUANCE description.
//   - v25.3.8 (N1 F0-F7 + N2 15-field Evidence Fabric): referenced from
//     A6_FINALITY_COORDINATION + A5_EVIDENCE descriptions.
//   - v25.3.9 (O1 obligation registry + O2 6 tolerance policies):
//     referenced from B2_OBLIGOR (NO_LEGAL_OBLIGOR) + A4_RECONCILIATION.
//
// Honest-state discipline (per M-directive "Do not invent legal facts"):
//   The 6 legal/accounting prerequisites for Pilot B reflect the ACTUAL
//   honest state. Only LEGAL-1 (JOZOUR Amendment) is ACTIVE per the
//   v25.3.7 institutional operating model. The other 5 are
//   PENDING_LEGAL_VERIFICATION — they are NOT yet executed/obtained.

// === Pilot Mode IDs ===

export type PilotModeId = "PILOT_A_CONTROL_PLANE" | "PILOT_B_MTQ_SETTLEMENT";

// === Pilot Test Area ===

export interface PilotTestArea {
  id: string;
  name: string;
  description: string;
  // Which capability this tests (per v25.3.4 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)
  capability: "CONTROL_PLANE_CORE" | "MTQ_SETTLEMENT_MODULE";
  // Whether MTQ is required for this test
  mtqRequired: boolean;
  // Current status
  status: "NOT_STARTED" | "IN_PROGRESS" | "PASSED" | "FAILED" | "BLOCKED";
  // Prerequisites (other test area IDs that must pass first)
  prerequisites?: string[];
}

// === Pilot Mode ===

export interface PilotMode {
  id: PilotModeId;
  name: string;
  description: string;
  // Whether MTQ is required for this pilot mode
  mtqRequired: boolean;
  // The test areas for this pilot mode
  testAreas: PilotTestArea[];
  // Prerequisites for enabling this pilot mode (other pilot modes that must pass first)
  prerequisites: {
    pilotModeId: PilotModeId;
    rule: string;
    description: string;
  }[];
  // Legal/accounting prerequisites (for Pilot B only)
  legalAccountingPrerequisites?: {
    id: string;
    name: string;
    description: string;
    status: "PENDING_LEGAL_VERIFICATION" | "ACTIVE" | "BLOCKED";
    evidenceReference?: string; // links to /api/legal-evidence
  }[];
  // Status (per v25.3.2 status markers)
  status: "ACTIVE" | "PENDING_VALIDATION" | "BLOCKED";
  // Whether this pilot mode can be enabled
  canBeEnabled: boolean;
  // Reason if cannot be enabled
  cannotEnableReason?: string;
}

// === Pilot A — MITHQAL Control Plane ===
//
// Per P-directive:
//   "Pilot A — MITHQAL Control Plane
//    MTQ optional/not required.
//    Test: routing, liquidity optimization, compliance orchestration,
//    reconciliation, evidence, finality coordination, failure management,
//    bank integration."

export const PILOT_A_CONTROL_PLANE: PilotMode = {
  id: "PILOT_A_CONTROL_PLANE",
  name: "Pilot A — MITHQAL Control Plane",
  description:
    "Tests the MITHQAL control plane WITHOUT requiring MTQ. MTQ is optional " +
    "(per v25.3.4 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary). " +
    "The control plane operates on bank money, CB money, RTGS, tokenized deposits, " +
    "wholesale CBDC, or other legally recognized settlement assets — MTQ is NOT required.",
  mtqRequired: false,
  testAreas: [
    {
      id: "A1_ROUTING",
      name: "Routing",
      description:
        "Test settlement routing across the MITHQAL control plane — bank-to-bank, cross-border, multi-currency.",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A2_LIQUIDITY_OPTIMIZATION",
      name: "Liquidity Optimization",
      description:
        "Test liquidity optimization — pre-funding reduction, nostro/vostro optimization, ILPS management.",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A3_COMPLIANCE_ORCHESTRATION",
      name: "Compliance Orchestration",
      description:
        "Test compliance orchestration — AML/KYC/sanctions screening orchestration across the chain, compliance deduplication.",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A4_RECONCILIATION",
      name: "Reconciliation",
      description:
        "Test reconciliation — ledger-to-ledger, bank attestations, custody/quantity, market/FX/stressed valuation (per v25.3.9 tolerance policies).",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A5_EVIDENCE",
      name: "Evidence",
      description:
        "Test evidence generation + retrieval — Institutional Evidence Fabric (per v25.3.8), 15-field portable evidence package, 3 access levels.",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A6_FINALITY_COORDINATION",
      name: "Finality Coordination",
      description:
        "Test finality coordination — F0-F7 canonical finality model (per v25.3.8), finality-coordinated settlement (not atomic), 3 trust domains (A/B/C per v25.3.7).",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A7_FAILURE_MANAGEMENT",
      name: "Failure Management",
      description:
        "Test failure management — transaction failure handling, rollback, exception policy, escalation path.",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
    {
      id: "A8_BANK_INTEGRATION",
      name: "Bank Integration",
      description:
        "Test bank integration — MBG (MITHQAL Bank Gateway), mTLS authentication, bank-facing counterparty (per v25.3.7), SLA/support/billing.",
      capability: "CONTROL_PLANE_CORE",
      mtqRequired: false,
      status: "NOT_STARTED",
    },
  ],
  prerequisites: [], // Pilot A has NO prerequisites — it can start first
  status: "ACTIVE", // Pilot A is ready to start
  canBeEnabled: true,
};

// === Pilot B — MTQ Institutional Settlement ===
//
// Per P-directive:
//   "Pilot B — MTQ Institutional Settlement
//    Only enabled after legal/accounting prerequisites pass.
//    Test: PBC, obligor, issuance, redemption, finality-before-mint,
//    bank subledger, resolution."

export const PILOT_B_MTQ_SETTLEMENT: PilotMode = {
  id: "PILOT_B_MTQ_SETTLEMENT",
  name: "Pilot B — MTQ Institutional Settlement",
  description:
    "Tests the MTQ settlement module (MTQ_SETTLEMENT_MODULE per v25.3.4). " +
    "ONLY enabled after Pilot A passes its 8 test areas AND legal/accounting " +
    "prerequisites are met. This pilot tests MTQ-specific settlement: PBC, " +
    "obligor, issuance, redemption, finality-before-mint, bank subledger, resolution.",
  mtqRequired: true,
  testAreas: [
    {
      id: "B1_PBC",
      name: "PBC (Protected Backing Cell)",
      description:
        "Test Protected Backing Cell — backing cell creation, verification, anti-double-counting (per v25.3.6 reserve domains).",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["A4_RECONCILIATION"], // requires reconciliation to pass first
    },
    {
      id: "B2_OBLIGOR",
      name: "Obligor",
      description:
        "Test obligor — legal obligor registration per v25.3.9 Institutional Settlement Obligation Registry, NO_LEGAL_OBLIGOR enforcement.",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["A5_EVIDENCE"], // requires evidence to pass first
    },
    {
      id: "B3_ISSUANCE",
      name: "Issuance",
      description:
        "Test MTQ issuance — mint execution (BM-16B), requires Domain A authorization (BM-15) + Domain B attestation (BM-16A) per v25.3.7 trust domains.",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["B1_PBC", "B2_OBLIGOR"],
    },
    {
      id: "B4_REDEMPTION",
      name: "Redemption",
      description:
        "Test MTQ redemption — burn + backing release, redemption obligor per v25.3.9 obligation registry.",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["B3_ISSUANCE"],
    },
    {
      id: "B5_FINALITY_BEFORE_MINT",
      name: "Finality-Before-Mint",
      description:
        "Test finality-before-mint — the §54 invariant that finality must be verified BEFORE mint execution (BM-16A before BM-16B).",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["B3_ISSUANCE"],
    },
    {
      id: "B6_BANK_SUBLEDGER",
      name: "Bank Subledger",
      description:
        "Test bank subledger — bank-side MTQ subledger, 5-way reconciliation per P36.",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["A4_RECONCILIATION", "B3_ISSUANCE"],
    },
    {
      id: "B7_RESOLUTION",
      name: "Resolution",
      description:
        "Test resolution — insolvency treatment, resolution status, bank default resolution (per v25.3.9 obligation registry insolvency treatment).",
      capability: "MTQ_SETTLEMENT_MODULE",
      mtqRequired: true,
      status: "NOT_STARTED",
      prerequisites: ["B4_REDEMPTION", "B6_BANK_SUBLEDGER"],
    },
  ],
  // === EXPLICIT DEPENDENCY: Pilot B depends on Pilot A ===
  prerequisites: [
    {
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      rule: "Pilot B (MTQ Institutional Settlement) can ONLY be enabled after Pilot A (MITHQAL Control Plane) passes ALL 8 test areas.",
      description:
        "Per P-directive: 'Only enabled after legal/accounting prerequisites pass.' " +
        "The dependency is EXPLICIT: Pilot A must pass its 8 test areas (routing, " +
        "liquidity optimization, compliance orchestration, reconciliation, evidence, " +
        "finality coordination, failure management, bank integration) BEFORE Pilot B " +
        "can be enabled. Pilot A tests the control plane WITHOUT MTQ — Pilot B tests " +
        "the MTQ settlement module. The control plane must work before MTQ is added.",
    },
  ],
  // === Legal/Accounting Prerequisites (for Pilot B only) ===
  // HONEST STATE per M-directive "Do not invent legal facts":
  //   Only LEGAL-1 (JOZOUR Amendment) is ACTIVE per v25.3.7 institutional
  //   operating model. The other 5 are PENDING_LEGAL_VERIFICATION —
  //   they are NOT yet executed/obtained. Pilot B is BLOCKED.
  legalAccountingPrerequisites: [
    {
      id: "LEGAL-1_JOZOUR_AMENDMENT",
      name: "Jozour LLC Operating Agreement Amendment",
      description:
        "The JOZOUR Amendment (July 31, 2026) must be ACTIVE — it formalizes MITHQAL as a project of Jozour, LLC.",
      status: "ACTIVE", // verified per v25.3.7 institutional operating model
      evidenceReference: "/api/legal-evidence?policyId=PROJECT_AUTHORIZATION",
    },
    {
      id: "LEGAL-2_SLA_EXECUTED",
      name: "SLA Executed with First Bank",
      description:
        "A Service Level Agreement must be executed with the first participating bank.",
      status: "PENDING_LEGAL_VERIFICATION", // SLA not yet executed
    },
    {
      id: "LEGAL-3_DPA_EXECUTED",
      name: "Data Processing Agreement Executed",
      description:
        "A Data Processing Agreement (DPA) must be executed with the first participating bank.",
      status: "PENDING_LEGAL_VERIFICATION", // DPA not yet executed
    },
    {
      id: "LEGAL-4_SECURITY_ACCREDITATION",
      name: "Security Accreditation (SOC 2 / ISO 27001)",
      description:
        "Security accreditation must be obtained from an independent auditor.",
      status: "PENDING_LEGAL_VERIFICATION", // not yet accredited
    },
    {
      id: "ACCT-1_MTQ_LEGAL_CLASSIFICATION",
      name: "MTQ Legal Classification",
      description:
        "MTQ's legal classification (deposit / e-money / stored-value / security / payment token) must be legally established in the pilot jurisdiction.",
      status: "PENDING_LEGAL_VERIFICATION", // not yet classified
    },
    {
      id: "ACCT-2_RESERVE_AUDIT",
      name: "Independent Reserve Audit",
      description:
        "An independent auditor must verify the reserve composition + custody arrangements.",
      status: "PENDING_LEGAL_VERIFICATION", // not yet audited
    },
  ],
  // === STATUS: Pilot B is BLOCKED until prerequisites pass ===
  status: "BLOCKED", // cannot start until Pilot A passes + legal/accounting prerequisites pass
  canBeEnabled: false,
  cannotEnableReason:
    "Pilot B is BLOCKED. Per P-directive: 'Only enabled after legal/accounting prerequisites pass.' " +
    "Prerequisites: (1) Pilot A must pass ALL 8 test areas, (2) 2 of 6 legal/accounting " +
    "prerequisites are ACTIVE (JOZOUR Amendment + JOZOUR Resolution), 4 are PENDING_LEGAL_VERIFICATION " +
    "(SLA, DPA, Security Accreditation, MTQ Legal Classification, Reserve Audit). " +
    "Pilot B CANNOT be enabled until ALL prerequisites are ACTIVE.",
};

// === The Two Pilot Modes (canonical array) ===
export const PILOT_MODES: PilotMode[] = [
  PILOT_A_CONTROL_PLANE,
  PILOT_B_MTQ_SETTLEMENT,
];

// === Explicit Dependency Rule ===
export const PILOT_DEPENDENCY_RULE = {
  rule: "Pilot B (MTQ Institutional Settlement) DEPENDS ON Pilot A (MITHQAL Control Plane).",
  description:
    "Per P-directive: 'Make the dependency between Pilot A and Pilot B explicit.' " +
    "Pilot A tests the control plane WITHOUT MTQ. Pilot B tests the MTQ settlement module. " +
    "The control plane must work before MTQ is added. Pilot B can ONLY be enabled after " +
    "Pilot A passes ALL 8 test areas AND legal/accounting prerequisites are ACTIVE.",
  dependency: "PILOT_A_CONTROL_PLANE -> PILOT_B_MTQ_SETTLEMENT (one-way dependency)",
  cannotSkip: "Pilot A CANNOT be skipped. Pilot B CANNOT start before Pilot A passes.",
};

// === API ===

export function getPilotMode(id: PilotModeId): PilotMode | undefined {
  return PILOT_MODES.find((m) => m.id === id);
}

export function canEnablePilotB(pilotAStatus: PilotMode): {
  canEnable: boolean;
  pilotAPassed: boolean;
  legalAccountingPrerequisitesPassed: boolean;
  blockedBy: string[];
} {
  // Check if Pilot A has passed ALL 8 test areas
  const pilotAPassed = pilotAStatus.testAreas.every((ta) => ta.status === "PASSED");

  // Check if ALL legal/accounting prerequisites are ACTIVE
  const legalAccountingPrerequisitesPassed = (
    PILOT_B_MTQ_SETTLEMENT.legalAccountingPrerequisites ?? []
  ).every((pre) => pre.status === "ACTIVE");

  const blockedBy: string[] = [];
  if (!pilotAPassed) {
    blockedBy.push("Pilot A has not passed ALL 8 test areas");
  }
  if (!legalAccountingPrerequisitesPassed) {
    const pendingCount = (
      PILOT_B_MTQ_SETTLEMENT.legalAccountingPrerequisites ?? []
    ).filter((p) => p.status === "PENDING_LEGAL_VERIFICATION").length;
    blockedBy.push(
      `${pendingCount} legal/accounting prerequisites are PENDING_LEGAL_VERIFICATION`
    );
  }

  return {
    canEnable: pilotAPassed && legalAccountingPrerequisitesPassed,
    pilotAPassed,
    legalAccountingPrerequisitesPassed,
    blockedBy,
  };
}

// === Status ===
export const PILOT_MODES_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" =
  "ACTIVE";
export const PILOT_MODES_VERSION = "v25.3.2-P2-1.0";
export const PILOT_MODES_SOURCE = "src/lib/two-pilot-modes.ts";
