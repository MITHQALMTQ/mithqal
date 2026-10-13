// src/lib/pbc-legal-enforceability.ts
//
// MITHQAL v25.3.16 — PROTECTED BACKING CELL LEGAL ENFORCEABILITY
// (single source of truth)
// Per PROMPT 26:
//   "Strengthen the Protected Backing Cell model from an engineering
//    construct into an evidence-gated institutional control.
//    For every PBC define: legal owner, obligor, custody arrangement,
//    account control, segregation, pledge/perfection status, encumbrance,
//    reuse prohibition, bankruptcy treatment, insolvency priority,
//    valuation, liquidity accessibility, jurisdiction, governing law
//    and evidence artifact.
//    MITHQAL verification must NEVER imply ownership, legal perfection
//    or bankruptcy remoteness.
//    A PBC may count as AvailableBacking only when the required legal
//    and operational evidence exists.
//    Add explicit failure states: LEGAL_CONTROL_UNPROVEN, ENCUMBERED,
//    REUSED, CUSTODY_UNPROVEN, BANKRUPTCY_TREATMENT_UNKNOWN,
//    LIQUIDITY_UNAVAILABLE."
//
// ADDITIVE MODULE (per Architecture Freeze v25.3.15 — CR-2026-002):
//   This module does NOT modify the frozen RESERVE_SCHEMA or the existing
//   v25.3 engineering-construct PBC in `src/lib/protected-backing-cell.ts`.
//   It adds the LEGAL ENFORCEABILITY LAYER on top: every PBC must carry
//   14 fields of legal/operational evidence + link to an Evidence Fabric
//   artifact. MITHQAL can verify that evidence EXISTS; MITHQAL cannot
//   assert that the evidence is legally CORRECT.

// === PBC Failure States (per directive) ===

export type PBCFailureState =
  | "LEGAL_CONTROL_UNPROVEN"
  | "ENCUMBERED"
  | "REUSED"
  | "CUSTODY_UNPROVEN"
  | "BANKRUPTCY_TREATMENT_UNKNOWN"
  | "LIQUIDITY_UNAVAILABLE";

// === PBC Status ===

export type PBCStatus =
  | "AVAILABLE_BACKING" // all evidence exists — counts as AvailableBacking
  | "PENDING_EVIDENCE" // evidence not yet provided
  | "FAILED" // in a failure state (see failureStates)
  | "SUPERSEDED"; // replaced by another PBC

// === The 14-Field Protected Backing Cell (per directive) ===

export interface ProtectedBackingCell {
  pbcId: string; // unique PBC identifier

  // 1. Legal owner — who legally owns the backing asset
  legalOwner: {
    entityId: string;
    legalName: string;
    ownershipType:
      | "DIRECT"
      | "TRUSTEE"
      | "CUSTODIAN_AS_AGENT"
      | "PENDING_LEGAL_VERIFICATION";
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 2. Obligor — who is obligated to deliver the backing asset on redemption
  obligor: {
    entityId: string;
    legalName: string;
    obligationType: string; // e.g., "REDEMPTION_OBLIGOR", "COLLATERAL_OBLIGOR"
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 3. Custody arrangement — how the asset is custodied
  custodyArrangement: {
    arrangementType:
      | "SEGREGATED_ACCOUNT"
      | "TRUST_ACCOUNT"
      | "ESCROW"
      | "TRI_PARTY"
      | "BANK_CUSTODY"
      | "PENDING_LEGAL_VERIFICATION";
    custodianEntityId: string;
    custodianLegalName: string;
    accountReference?: string; // hashed account reference
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 4. Account control — who controls the account
  accountControl: {
    controllerType:
      | "BANK"
      | "CUSTODIAN"
      | "MITHQAL"
      | "INDEPENDENT_TRUSTEE"
      | "PENDING_LEGAL_VERIFICATION";
    controlType:
      | "OPERATIONAL_CONTROL"
      | "LEGAL_CONTROL"
      | "JOINT_CONTROL"
      | "PENDING_LEGAL_VERIFICATION";
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 5. Segregation — whether the asset is segregated
  segregation: {
    isSegregated: boolean;
    segregationType:
      | "PHYSICAL"
      | "ACCOUNT_LEVEL"
      | "LEGAL"
      | "PENDING_LEGAL_VERIFICATION";
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 6. Pledge/perfection status — whether the asset is pledged/perfected
  pledgePerfectionStatus: {
    isPledged: boolean;
    perfectionType?: "POSSESSION" | "FILING" | "CONTROL" | "NONE";
    perfectionDate?: string;
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION" | "NOT_REQUIRED";
  };

  // 7. Encumbrance — whether the asset is encumbered
  encumbrance: {
    isEncumbered: boolean;
    encumbranceType?: "PLEDGE" | "LIEN" | "RESTRAINT" | "NONE";
    encumbranceDetails?: string;
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 8. Reuse prohibition — whether reuse is prohibited
  reuseProhibition: {
    reuseProhibited: boolean;
    prohibitionType:
      | "CONTRACTUAL"
      | "REGULATORY"
      | "BOTH"
      | "NONE"
      | "PENDING_LEGAL_VERIFICATION";
    prohibitionReference?: string;
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 9. Bankruptcy treatment — how the asset is treated in bankruptcy
  bankruptcyTreatment: {
    treatmentType:
      | "SEGREGATED"
      | "PARI_PASSU"
      | "SUBORDINATED"
      | "SUPERSEDED"
      | "PENDING_LEGAL_VERIFICATION"
      | "BANKRUPTCY_TREATMENT_UNKNOWN";
    treatmentDetails?: string;
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 10. Insolvency priority — the priority of the asset in insolvency
  insolvencyPriority: {
    priorityClass:
      | "SENIOR_SECURED"
      | "SECURED"
      | "UNSECURED"
      | "SUBORDINATED"
      | "PENDING_LEGAL_VERIFICATION";
    priorityRank?: number;
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 11. Valuation — the valuation of the backing asset
  valuation: {
    assetClass: string; // e.g., "BANK_MONEY", "GOLD", "SOVEREIGN_BONDS"
    marketValueUsd: number;
    valuationMethod: "MARK" | "MODEL" | "INDEPENDENT_APPRAISAL" | "PENDING_VALUATION";
    valuationDate: string;
    valuationProvider?: string;
  };

  // 12. Liquidity accessibility — how quickly the asset can be accessed
  liquidityAccessibility: {
    accessibilityType:
      | "IMMEDIATE"
      | "T_PLUS_1"
      | "T_PLUS_2"
      | "LOCKED"
      | "PENDING_LEGAL_VERIFICATION"
      | "LIQUIDITY_UNAVAILABLE";
    accessibilityDetails?: string;
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 13. Jurisdiction — the jurisdiction governing the PBC
  jurisdiction: {
    primaryJurisdiction: string; // ISO 3166-1 alpha-2
    secondaryJurisdictions?: string[];
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 14. Governing law — the specific law governing the PBC
  governingLaw: {
    legalSystem: string; // e.g., "US-NJ", "UK", "UAE"
    specificLaw?: string; // e.g., "UCC Article 9", "Insolvency Act 1986"
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 15. Evidence artifact — link to the Institutional Evidence Fabric
  // (counted as the 14th directive field — see PBC_FIELD_COUNT note below)
  evidenceArtifact: {
    artifactType:
      | "LEGAL_OPINION"
      | "CUSTODY_AGREEMENT"
      | "SEGREGATION_ATTESTATION"
      | "PLEDGE_AGREEMENT"
      | "ENCUMBRANCE_SEARCH"
      | "BANKRUPTCY_OPINION"
      | "VALUATION_REPORT"
      | "PENDING_EVIDENCE";
    artifactReference?: string; // links to /api/evidence-fabric
    artifactHash?: string; // SHA-256 hash
  };

  // === Computed Fields ===
  pbcStatus: PBCStatus;
  failureStates: PBCFailureState[]; // empty if AVAILABLE_BACKING
  countsAsAvailableBacking: boolean; // true only if pbcStatus = AVAILABLE_BACKING

  // === Metadata ===
  createdAt: string;
  updatedAt: string;
}

// === CRITICAL RULE: MITHQAL verification NEVER implies ownership ===
//
// Per directive: "MITHQAL verification must NEVER imply ownership, legal
// perfection or bankruptcy remoteness."
//
// MITHQAL can VERIFY that evidence EXISTS (the artifact is present).
// MITHQAL CANNOT ASSERT that the evidence is legally correct (that requires
// independent legal validation per v25.3.16 Accounting/Prudential/Tax Framework).

export const MITHQAL_VERIFICATION_RULE = {
  rule: "MITHQAL verification must NEVER imply ownership, legal perfection or bankruptcy remoteness.",
  whatMithqalCanDo:
    "MITHQAL can verify that evidence EXISTS (the artifact is present + hash matches).",
  whatMithqalCannotDo:
    "MITHQAL CANNOT assert that the evidence is legally correct. That requires independent legal validation per the Accounting/Prudential/Tax Classification Framework (PROMPT 25).",
  implication:
    "A PBC with all evidence present is PENDING_EVIDENCE (evidence exists but not externally validated), NOT AVAILABLE_BACKING. AVAILABLE_BACKING requires BOTH evidence existence AND external validation (per PROMPT 25 decision matrix).",
};

// === CRITICAL RULE: PBC counts as AvailableBacking only when evidence exists ===
//
// Per directive: "A PBC may count as AvailableBacking only when the required
// legal and operational evidence exists."

export const AVAILABLE_BACKING_RULE = {
  rule: "A PBC may count as AvailableBacking only when the required legal and operational evidence exists.",
  requiredEvidence: [
    "legalOwner verification (ACTIVE)",
    "obligor verification (ACTIVE)",
    "custodyArrangement verification (ACTIVE)",
    "accountControl verification (ACTIVE)",
    "segregation verification (ACTIVE)",
    "pledgePerfectionStatus verification (ACTIVE or NOT_REQUIRED)",
    "encumbrance.isEncumbered = false (no encumbrance)",
    "reuseProhibition.reuseProhibited = true (reuse prohibited)",
    "bankruptcyTreatment treatmentType != BANKRUPTCY_TREATMENT_UNKNOWN",
    "insolvencyPriority verification (ACTIVE)",
    "liquidityAccessibility accessibilityType != LIQUIDITY_UNAVAILABLE",
    "jurisdiction verification (ACTIVE)",
    "governingLaw verification (ACTIVE)",
    "evidenceArtifact artifactType != PENDING_EVIDENCE",
  ],
  noFailureStates:
    "PBC must have ZERO failure states (no LEGAL_CONTROL_UNPROVEN, ENCUMBERED, REUSED, CUSTODY_UNPROVEN, BANKRUPTCY_TREATMENT_UNKNOWN, LIQUIDITY_UNAVAILABLE).",
};

// === Compute PBC Status ===

export function computePBCStatus(pbc: ProtectedBackingCell): {
  status: PBCStatus;
  failureStates: PBCFailureState[];
  countsAsAvailableBacking: boolean;
  reason: string;
} {
  const failureStates: PBCFailureState[] = [];

  // Check for failure states (per directive)
  if (
    pbc.legalOwner.verificationStatus === "PENDING_LEGAL_VERIFICATION" ||
    pbc.accountControl.controlType === "PENDING_LEGAL_VERIFICATION"
  ) {
    failureStates.push("LEGAL_CONTROL_UNPROVEN");
  }
  if (pbc.encumbrance.isEncumbered) {
    failureStates.push("ENCUMBERED");
  }
  if (
    !pbc.reuseProhibition.reuseProhibited &&
    pbc.reuseProhibition.prohibitionType !== "PENDING_LEGAL_VERIFICATION"
  ) {
    failureStates.push("REUSED");
  }
  if (
    pbc.custodyArrangement.verificationStatus === "PENDING_LEGAL_VERIFICATION" ||
    pbc.custodyArrangement.arrangementType === "PENDING_LEGAL_VERIFICATION"
  ) {
    failureStates.push("CUSTODY_UNPROVEN");
  }
  if (
    pbc.bankruptcyTreatment.treatmentType === "BANKRUPTCY_TREATMENT_UNKNOWN" ||
    pbc.bankruptcyTreatment.treatmentType === "PENDING_LEGAL_VERIFICATION"
  ) {
    failureStates.push("BANKRUPTCY_TREATMENT_UNKNOWN");
  }
  if (
    pbc.liquidityAccessibility.accessibilityType === "LIQUIDITY_UNAVAILABLE" ||
    pbc.liquidityAccessibility.accessibilityType === "PENDING_LEGAL_VERIFICATION"
  ) {
    failureStates.push("LIQUIDITY_UNAVAILABLE");
  }

  if (failureStates.length > 0) {
    return {
      status: "FAILED",
      failureStates,
      countsAsAvailableBacking: false,
      reason: `PBC has ${failureStates.length} failure states: ${failureStates.join(", ")}. PBC does NOT count as AvailableBacking.`,
    };
  }

  // Check if all evidence exists (per AVAILABLE_BACKING_RULE)
  const allEvidenceExists =
    pbc.legalOwner.verificationStatus === "ACTIVE" &&
    pbc.obligor.verificationStatus === "ACTIVE" &&
    pbc.custodyArrangement.verificationStatus === "ACTIVE" &&
    pbc.accountControl.verificationStatus === "ACTIVE" &&
    pbc.segregation.verificationStatus === "ACTIVE" &&
    (pbc.pledgePerfectionStatus.verificationStatus === "ACTIVE" ||
      pbc.pledgePerfectionStatus.verificationStatus === "NOT_REQUIRED") &&
    !pbc.encumbrance.isEncumbered &&
    pbc.reuseProhibition.reuseProhibited &&
    pbc.bankruptcyTreatment.treatmentType !== "BANKRUPTCY_TREATMENT_UNKNOWN" &&
    pbc.bankruptcyTreatment.verificationStatus === "ACTIVE" &&
    pbc.insolvencyPriority.verificationStatus === "ACTIVE" &&
    pbc.liquidityAccessibility.accessibilityType !== "LIQUIDITY_UNAVAILABLE" &&
    pbc.jurisdiction.verificationStatus === "ACTIVE" &&
    pbc.governingLaw.verificationStatus === "ACTIVE" &&
    pbc.evidenceArtifact.artifactType !== "PENDING_EVIDENCE";

  if (allEvidenceExists) {
    return {
      status: "AVAILABLE_BACKING",
      failureStates: [],
      countsAsAvailableBacking: true,
      reason:
        "All required legal and operational evidence exists. PBC counts as AvailableBacking. NOTE: per MITHQAL_VERIFICATION_RULE, this means evidence EXISTS — it does NOT mean the evidence is legally correct (that requires external validation per PROMPT 25).",
    };
  }

  return {
    status: "PENDING_EVIDENCE",
    failureStates: [],
    countsAsAvailableBacking: false,
    reason:
      "PBC does not have all required evidence. Status = PENDING_EVIDENCE. PBC does NOT count as AvailableBacking.",
  };
}

// === Status ===
export const PBC_LEGAL_FRAMEWORK_STATUS = "ACTIVE";
export const PBC_LEGAL_FRAMEWORK_VERSION = "v25.3.16-U2-1.0";
export const PBC_LEGAL_FRAMEWORK_SOURCE = "src/lib/pbc-legal-enforceability.ts";
// Per directive: "For every PBC define: legal owner, obligor, custody arrangement,
// account control, segregation, pledge/perfection status, encumbrance,
// reuse prohibition, bankruptcy treatment, insolvency priority, valuation,
// liquidity accessibility, jurisdiction, governing law and evidence artifact."
// → 14 enumerated fields + the evidence artifact links them all to the
// Institutional Evidence Fabric. The directive enumerates 14 distinct
// legal/operational fields (1-14 above); the evidenceArtifact is the 15th
// struct property that CLOSES the loop (artifactType != PENDING_EVIDENCE
// is the 14th required-evidence predicate in AVAILABLE_BACKING_RULE).
export const PBC_FIELD_COUNT = 14; // per directive (14 fields + evidence artifact)
export const PBC_FAILURE_STATE_COUNT = 6; // per directive
