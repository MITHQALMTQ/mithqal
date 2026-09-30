// src/lib/institutional-data-governance.ts
//
// MITHQAL v25.3.19 — INSTITUTIONAL DATA GOVERNANCE FRAMEWORK (single source of truth)
// Per PROMPT 32:
//   "Create a canonical Institutional Data Governance Framework.
//    Define:
//    data classification, ownership, lineage, retention, immutability requirements,
//    jurisdictional residency, access control, encryption, key management,
//    deletion rules, legal holds, regulatory access, participant confidentiality,
//    evidence integrity and auditability.
//    Extend this to:
//    ledger data, bank data, legal-obligation data, reconciliation evidence,
//    compliance evidence, AI/model data and operational logs.
//    No evidence may be considered institutionally valid without provenance,
//    timestamp, source, integrity protection and verification status."
//
// CHANGE REQUEST: CR-2026-008 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine
//   - No existing functionality removed
//   - All governance dimensions start as DESIGNED / PENDING_EXTERNAL_VALIDATION — honest state
//   - INSTITUTIONAL_VALIDITY_RULE: no evidence institutionally valid without
//     provenance + timestamp + source + integrity protection + verification status
// Cross-references prior canonical modules:
//   - v25.3.7 M1 (institutional operating model — JOZOUR_LLC_NJ bank-facing counterparty)
//   - v25.3.7 M2 (finality trust domains — Domain A/B/C, 6 cross-domain isolation rules)
//   - v25.3.8 N1 (canonical finality model F0-F7 — 8 stages + 3 finality types)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage + SHA-256)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.9 O2 (Reconciliation Tolerance Policies — 6 tolerance bands)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle)
//   - v25.3.15 T2 (Controlled Architecture Freeze — 10 frozen schemas + 7-step change)
//   - v25.3.16 U1 (P25 Accounting/Prudential/Tax — 10 classification areas)
//   - v25.3.16 U2 (PBC Legal Enforceability — 14 fields + custody arrangement)
//   - v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions)
//   - v25.3.18 W1 (Bank Contracting Package — 17 sections + Institutional External Identity 8 standards)
//   - v25.3.18 W2 (Enterprise Risk Register 17 categories + Insurance Framework 7 categories)

// ============================================================================
// PART 1: Data Type and Dimension IDs (canonical, frozen by this module)
// ============================================================================

/**
 * The 7 canonical institutional data types — per directive "Extend this to:
 * ledger data, bank data, legal-obligation data, reconciliation evidence,
 * compliance evidence, AI/model data and operational logs."
 */
export type DataTypeId =
  | "LEDGER_DATA"
  | "BANK_DATA"
  | "LEGAL_OBLIGATION_DATA"
  | "RECONCILIATION_EVIDENCE"
  | "COMPLIANCE_EVIDENCE"
  | "AI_MODEL_DATA"
  | "OPERATIONAL_LOGS";

/**
 * The 15 canonical governance dimensions — per directive "Define:
 * data classification, ownership, lineage, retention, immutability requirements,
 * jurisdictional residency, access control, encryption, key management,
 * deletion rules, legal holds, regulatory access, participant confidentiality,
 * evidence integrity and auditability."
 */
export type GovernanceDimensionId =
  | "DATA_CLASSIFICATION"
  | "OWNERSHIP"
  | "LINEAGE"
  | "RETENTION"
  | "IMMUTABILITY"
  | "JURISDICTIONAL_RESIDENCY"
  | "ACCESS_CONTROL"
  | "ENCRYPTION"
  | "KEY_MANAGEMENT"
  | "DELETION_RULES"
  | "LEGAL_HOLDS"
  | "REGULATORY_ACCESS"
  | "PARTICIPANT_CONFIDENTIALITY"
  | "EVIDENCE_INTEGRITY"
  | "AUDITABILITY";

// ============================================================================
// PART 2: Type definitions
// ============================================================================

/**
 * The lifecycle state of a governance dimension's implementation.
 * Honest-state ladder — no dimension starts above DESIGNED.
 */
export type GovernanceState =
  | "DESIGNED" // the requirement is specified but no implementation exists
  | "IMPLEMENTED" // the implementation exists but has not been externally validated
  | "PENDING_EXTERNAL_VALIDATION"; // implementation is complete; awaiting external auditor/regulator sign-off

/**
 * A single governance dimension applied to a single data type — one cell in
 * the 15 × 7 governance matrix (105 total entries).
 */
export interface GovernanceDimensionCell {
  dataTypeId: DataTypeId;
  dimensionId: GovernanceDimensionId;
  name: string;
  description: string;
  requirement: string;
  currentState: GovernanceState;
  honestNote: string;
}

/**
 * A row of the matrix — all 15 governance dimensions applied to a single data
 * type.
 */
export interface DataTypeGovernanceRow {
  dataTypeId: DataTypeId;
  name: string;
  description: string;
  dimensions: GovernanceDimensionCell[]; // exactly 15 entries — one per dimension
}

// ============================================================================
// PART 3: Catalogs (data types + dimensions)
// ============================================================================

export const DATA_TYPES: {
  id: DataTypeId;
  name: string;
  description: string;
}[] = [
  {
    id: "LEDGER_DATA",
    name: "Ledger Data",
    description:
      "Canonical MTQ ledger entries — issuance, redemption, settlement, reserve backing, fee accrual. Deterministic, append-only, externally verifiable (per v25.3.8 N1 canonical finality model + v25.3.5 K2/K3).",
  },
  {
    id: "BANK_DATA",
    name: "Bank Data",
    description:
      "Bank-identifying and bank-relationship data — counterparty KYC/AML, account identifiers, bank contracts, bank-facing document set (per v25.3.18 W1 bank-contracting-package + v25.3.12 R1 bank-facing documents).",
  },
  {
    id: "LEGAL_OBLIGATION_DATA",
    name: "Legal-Obligation Data",
    description:
      "Data representing legal obligations — settlement obligations, contracts, regulatory undertakings, PBC legal enforceability fields (per v25.3.9 O1 obligation registry + v25.3.16 U2 PBC fields).",
  },
  {
    id: "RECONCILIATION_EVIDENCE",
    name: "Reconciliation Evidence",
    description:
      "Evidence produced by reconciliation processes — ledger-to-ledger, bank attestation, custody quantity, market valuation, FX valuation, stressed valuation (per v25.3.9 O2 tolerance policies).",
  },
  {
    id: "COMPLIANCE_EVIDENCE",
    name: "Compliance Evidence",
    description:
      "Evidence of compliance — KYC/AML attestations, sanctions screenings, regulatory filings, audit attestations, controlled-architecture-freeze attestations (per v25.3.15 T2).",
  },
  {
    id: "AI_MODEL_DATA",
    name: "AI / Model Data",
    description:
      "Data describing or produced by AI/ML models — model parameters, training data references, inference outputs, model cards, audit logs of model decisions.",
  },
  {
    id: "OPERATIONAL_LOGS",
    name: "Operational Logs",
    description:
      "Operational system logs — application logs, access logs, audit trail events, SettlementContinuityFabric events, incident response logs (per v25.3.13 S1).",
  },
];

export const GOVERNANCE_DIMENSIONS: {
  id: GovernanceDimensionId;
  name: string;
  description: string;
}[] = [
  {
    id: "DATA_CLASSIFICATION",
    name: "Data Classification",
    description:
      "Sensitivity tier assigned to the data — PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED / REGULATORY-SENSITIVE. Determines downstream handling rules.",
  },
  {
    id: "OWNERSHIP",
    name: "Ownership",
    description:
      "The singular, explicit accountable owner of the data — must be a named role, not a committee. Cross-references W1 SINGULAR_OWNER_RULE + W2 enterprise risk register owner field.",
  },
  {
    id: "LINEAGE",
    name: "Lineage",
    description:
      "End-to-end provenance chain — origin system, transformations applied, systems touched, in-bound and out-bound dependencies. Cross-references N2 Evidence Fabric provenance.",
  },
  {
    id: "RETENTION",
    name: "Retention",
    description:
      "The minimum and maximum retention period — including regulatory minimums and maximums (e.g., 7-year AML retention, indefinite freeze on legal hold).",
  },
  {
    id: "IMMUTABILITY",
    name: "Immutability",
    description:
      "Append-only / WORM / hash-chained guarantees. Whether the data may be modified post-creation, and if so, under what conditions and with what audit trail.",
  },
  {
    id: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency",
    description:
      "The legal jurisdiction(s) in which the data physically resides and to which data-residency obligations attach. Cross-references M1 JOZOUR_LLC_NJ formation + cross-border rail rules.",
  },
  {
    id: "ACCESS_CONTROL",
    name: "Access Control",
    description:
      "Role-based access control — who can read, who can write, who can authorize. Cross-references M2 trust domains A/B/C + 6 cross-domain isolation rules.",
  },
  {
    id: "ENCRYPTION",
    name: "Encryption",
    description:
      "Encryption requirements — at-rest, in-transit, field-level for sensitive PII. Algorithms, minimum key sizes, TLS version.",
  },
  {
    id: "KEY_MANAGEMENT",
    name: "Key Management",
    description:
      "Key lifecycle — generation, rotation, escrow, destruction. HSM requirement, dual-control, split knowledge. Cross-references V1 — no assumption of legal rights without contract.",
  },
  {
    id: "DELETION_RULES",
    name: "Deletion Rules",
    description:
      "When and how data may be deleted — soft-delete vs hard-delete, cryptographic erasure, retention-expiry mechanics, regulatory-minimum retention overrides.",
  },
  {
    id: "LEGAL_HOLDS",
    name: "Legal Holds",
    description:
      "Suspension of routine deletion/retention-expiry when litigation, regulatory inquiry, or audit is pending or anticipated. Overrides DELETION_RULES until released.",
  },
  {
    id: "REGULATORY_ACCESS",
    name: "Regulatory Access",
    description:
      "The mechanism by which regulators/law-enforcement may request and receive data — subpoena/consent-decree/SAR/CTR mechanics. Cross-references R2 RegulatoryReplayEngine (READ-ONLY).",
  },
  {
    id: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality",
    description:
      "Protection of participant-identifying data — bank counterparties, beneficiaries, intermediaries. Disclosure scope, masking rules, need-to-know enforcement.",
  },
  {
    id: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity",
    description:
      "Cryptographic integrity protection — SHA-256 commitments, Merkle roots, timestamp authority, tamper-evidence. Cross-references N2 Evidence Fabric 15-field EvidencePackage.",
  },
  {
    id: "AUDITABILITY",
    name: "Auditability",
    description:
      "The ability of an external auditor or regulator to reconstruct the data's history — completeness, correctness, verifiability, reproducibility. Cross-references N1 canonical finality model.",
  },
];

// ============================================================================
// PART 4: The 15 × 7 governance matrix (105 cells)
// ----------------------------------------------------------------------------
// Each data type has all 15 dimensions defined. Every cell starts at DESIGNED
// or PENDING_EXTERNAL_VALIDATION — honest state. No cell is IMPLEMENTED for
// cells requiring external auditor/regulator sign-off (e.g., REGULATORY_ACCESS,
// EVIDENCE_INTEGRITY for ledger data, AUDITABILITY for any data type).
// ============================================================================

// --- 4.1 LEDGER_DATA — 15 dimensions ---
const LEDGER_DATA_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — Ledger Data",
    description:
      "Ledger entries are CONFIDENTIAL-RESTRICTED: not public, but verifiable by authorized auditors and regulators.",
    requirement:
      "Every ledger entry must carry a sensitivity tier. Default: CONFIDENTIAL-RESTRICTED (auditor-readable, regulator-readable, not public).",
    currentState: "DESIGNED",
    honestNote:
      "Classification scheme is designed; no ledger entry has been classified in production (per v25.3.7 M1 — operating entity ACTIVE, but production ledger not yet deployed).",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "OWNERSHIP",
    name: "Ownership — Ledger Data",
    description:
      "Canonical MTQ ledger is owned by a singular named role — the CTO (Jozour, LLC) per W1 SINGULAR_OWNER_RULE.",
    requirement:
      "Every ledger entry must declare its singular owner role. The canonical MTQ ledger is owned by CTO (Jozour, LLC).",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designation is designed; not yet bound in an executed operating-entity governance document.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "LINEAGE",
    name: "Lineage — Ledger Data",
    description:
      "Ledger entries must trace back to canonical finality model F0-F7 stage (per v25.3.8 N1) and to EvidencePackage provenance (per v25.3.8 N2).",
    requirement:
      "Every ledger entry must declare: originating F0-F7 finality stage, EvidencePackage ID, source system, transformation path.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; production ledger entries do not yet exist.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "RETENTION",
    name: "Retention — Ledger Data",
    description:
      "Ledger data retention: indefinite (canonical ledger is the single source of truth — must outlive any individual contract).",
    requirement:
      "Ledger entries must be retained indefinitely. Regulatory minimum (7-year AML) is the floor; canonical ledger imposes no maximum.",
    currentState: "DESIGNED",
    honestNote:
      "Retention policy designed; not yet ratified by an executed data-retention policy.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — Ledger Data",
    description:
      "Canonical ledger is append-only / hash-chained — no entry may be modified post-creation except via documented correction entry.",
    requirement:
      "Ledger entries must be append-only. Any correction must be a new entry referencing the original — never an in-place mutation.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Immutability mechanism designed (per v25.3.8 N1 hash-chained finality); external auditor validation pending.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — Ledger Data",
    description:
      "Canonical ledger must reside in the operating entity's home jurisdiction (US — per M1 JOZOUR_LLC_NJ formation).",
    requirement:
      "Ledger data must reside in US jurisdiction. Cross-border replication requires a documented data-residency legal opinion (per V1 — no assumption of cross-border rights without contract).",
    currentState: "DESIGNED",
    honestNote:
      "Residency designed as US (NJ); no production deployment yet, no cross-border replication request received.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — Ledger Data",
    description:
      "Ledger read access: M2 Trust Domain A (control-plane core, internal operator) + Domain B (auditor/regulator). Write access: Domain A only.",
    requirement:
      "Ledger reads permitted to Trust Domain A (read/write) + Domain B (read-only, auditor/regulator). Cross-domain access must pass M2's 6 cross-domain isolation rules.",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed per M2 trust domains; not yet enforced in production RBAC.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "ENCRYPTION",
    name: "Encryption — Ledger Data",
    description:
      "Ledger data must be encrypted at-rest (AES-256-GCM) and in-transit (TLS 1.3).",
    requirement:
      "At-rest AES-256-GCM, in-transit TLS 1.3, with field-level encryption for any participant-identifying fields.",
    currentState: "DESIGNED",
    honestNote:
      "Encryption requirement designed; production database not yet provisioned.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — Ledger Data",
    description:
      "Ledger encryption keys must be HSM-protected with dual-control + split knowledge. Quarterly rotation minimum.",
    requirement:
      "HSM-backed key store, dual-control + split-knowledge for key operations, quarterly rotation, documented escrow for legal hold.",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned. Cross-references V1 — key escrow requires executed legal agreement.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — Ledger Data",
    description:
      "Canonical ledger entries must NEVER be hard-deleted. Only soft-delete (tombstone) is permitted, and only via documented correction entry.",
    requirement:
      "No hard-delete. Tombstone-only, with audit-trail reference to the authorizing correction entry. Regulatory-minimum retention overrides any deletion request.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Deletion rules designed; tombstone mechanism pending external auditor sign-off (immutability attestation).",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — Ledger Data",
    description:
      "Legal hold on ledger data overrides any deletion/retention-expiry. Hold must be authorized by General Counsel + COO (dual-control).",
    requirement:
      "Legal hold must be a flag on the entry; once set, no deletion (soft or hard) may occur until the hold is released by dual-control (GC + COO).",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged yet (per W1 PENDING_ENTITY_IDENTITY).",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — Ledger Data",
    description:
      "Regulators may request ledger data via subpoena / consent-decree / examination. Access is logged and time-bound (per R2 RegulatoryReplayEngine — READ-ONLY).",
    requirement:
      "Regulator access requests must be logged with requestor, scope, time-bounds, and producing-party attestation. R2 engine is READ-ONLY — never modifies ledger.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — Ledger Data",
    description:
      "Bank counterparty identifiers in ledger entries must be masked unless disclosure is need-to-know (auditor/regulator with documented scope).",
    requirement:
      "Bank identifiers masked at RESTRICTED access tier; unmasked only at REGULATORY-SENSITIVE tier with scope-attestation.",
    currentState: "DESIGNED",
    honestNote:
      "Masking scheme designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — Ledger Data",
    description:
      "Every ledger entry must carry a SHA-256 commitment + Merkle-root inclusion proof + trusted-timestamp-authority stamp (per N2 Evidence Fabric).",
    requirement:
      "SHA-256(content) committed on creation, Merkle-root inclusion proof available, TSA stamp at every append. Tamper-evidence required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed per N2; production TSA + Merkle-tree integration pending external validation.",
  },
  {
    dataTypeId: "LEDGER_DATA",
    dimensionId: "AUDITABILITY",
    name: "Auditability — Ledger Data",
    description:
      "An external auditor must be able to reconstruct the canonical ledger from finality events + EvidencePackages without privileged access.",
    requirement:
      "Auditor-readable view must reconstruct ledger state from F0-F7 events + EvidencePackages. Reproducibility is required, not optional.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; external auditor not yet engaged (per V1 PENDING_EXTERNAL_VALIDATION pattern).",
  },
];

// --- 4.2 BANK_DATA — 15 dimensions ---
const BANK_DATA_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — Bank Data",
    description:
      "Bank-identifying data is REGULATORY-SENSITIVE (highest tier) — KYC/AML, account identifiers, contract terms.",
    requirement:
      "All bank-identifying data must be classified REGULATORY-SENSITIVE by default. Down-classification requires documented legal opinion.",
    currentState: "DESIGNED",
    honestNote:
      "Classification designed; no production bank data yet (per W1 — 0 contracts SIGNED).",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "OWNERSHIP",
    name: "Ownership — Bank Data",
    description:
      "Bank data is owned by COO (Jozour, LLC) for relationship data; CTO (Jozour, LLC) for technical identifiers.",
    requirement:
      "Singular owner per data subclass: relationship data → COO; technical identifiers → CTO. No data is ownerless.",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designation designed; not yet bound in an executed data-stewardship charter.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "LINEAGE",
    name: "Lineage — Bank Data",
    description:
      "Bank data lineage must trace to source system (bank-onboarding form, signed contract, KYC vendor).",
    requirement:
      "Every bank-data record must declare: source (onboarding form / contract / KYC vendor), ingestion time, transformation path, downstream consumers.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; no bank-onboarding pipeline in production yet.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "RETENTION",
    name: "Retention — Bank Data",
    description:
      "Bank-KYC/AML data retention: regulatory minimum 7 years post-relationship-termination; contracts retained indefinitely.",
    requirement:
      "KYC/AML data: 7 years post-termination minimum. Bank contracts: indefinite. Legal-hold overrides any expiry.",
    currentState: "DESIGNED",
    honestNote:
      "Retention designed per US BSA/AML rules; no production retention clock running yet (no banks onboarded).",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — Bank Data",
    description:
      "Bank-KYC evidence is immutable post-attestation. Bank-relationship metadata may be updated but only via documented change with audit trail.",
    requirement:
      "KYC/AML evidence immutable post-attestation. Relationship metadata (contact info, account IDs) updatable via audited correction.",
    currentState: "DESIGNED",
    honestNote:
      "Immutability rules designed; no KYC vendor integrated, no attestations produced.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — Bank Data",
    description:
      "Bank data residency follows the bank counterparty's jurisdiction + US (operating entity). Cross-border data transfer requires documented legal opinion.",
    requirement:
      "Bank data must reside in: (a) the bank counterparty's home jurisdiction OR (b) the operating entity's home jurisdiction (US), per contract. Cross-border transfer requires legal opinion.",
    currentState: "DESIGNED",
    honestNote:
      "Residency rules designed; no bank contracts executed, no residency opinion sought.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — Bank Data",
    description:
      "Bank data access: M2 Trust Domain A (operator, restricted) + Domain B (auditor/regulator). Bank counterparty has access ONLY to its own data (Domain C).",
    requirement:
      "Domain A: read/write. Domain B: read-only. Domain C: read-only, restricted to own bank's data only. Cross-domain isolation per M2 rules.",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "ENCRYPTION",
    name: "Encryption — Bank Data",
    description:
      "Bank data must be encrypted at-rest (AES-256-GCM) + in-transit (TLS 1.3) + field-level for KYC/AML PII.",
    requirement:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level AES-256-GCM for PII fields (name, DOB, account number).",
    currentState: "DESIGNED",
    honestNote:
      "Encryption designed; no production deployment, no field-level encryption enforced.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — Bank Data",
    description:
      "Bank-data encryption keys must be HSM-protected with dual-control; quarterly rotation; bank-specific keys where required.",
    requirement:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. Bank-specific KMS partition for cross-bank isolation.",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned, no bank-specific key partitions.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — Bank Data",
    description:
      "Bank-KYC evidence: NEVER hard-deleted (regulatory retention minimum). Bank-relationship metadata: soft-delete via tombstone post retention expiry.",
    requirement:
      "KYC evidence: never hard-delete. Relationship metadata: soft-delete via tombstone after retention expiry + dual-control (COO + GC) authorization.",
    currentState: "DESIGNED",
    honestNote:
      "Deletion rules designed; no production deletion clock running.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — Bank Data",
    description:
      "Legal hold on bank data overrides deletion/retention-expiry. Dual-control: General Counsel + COO.",
    requirement:
      "Legal-hold flag on bank-data records; once set, no deletion until released by GC + COO dual-control.",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged (per W1 PENDING_ENTITY_IDENTITY).",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — Bank Data",
    description:
      "Bank regulator access via subpoena / examination. SAR/CTR filings may be required.",
    requirement:
      "Regulator access requests logged with requestor, scope, time-bounds. SAR/CTR filed per BSA requirements when triggered. R2 engine READ-ONLY.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — Bank Data",
    description:
      "Bank-identifying data must be masked unless disclosure is need-to-know + scope-attested. No bank may read another bank's data.",
    requirement:
      "Bank-identifier masking at RESTRICTED tier; unmasked only at REGULATORY-SENSITIVE tier with scope attestation. Bank-to-bank isolation is mandatory.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Isolation design pending external validation; no bank-onboarding pipeline in production.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — Bank Data",
    description:
      "Bank-KYC evidence must carry SHA-256 commitment + provenance + TSA stamp (per N2 Evidence Fabric).",
    requirement:
      "SHA-256 evidence commitment, provenance chain, TSA stamp at attestation. Tamper-evidence required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed per N2; production KYC vendor integration pending.",
  },
  {
    dataTypeId: "BANK_DATA",
    dimensionId: "AUDITABILITY",
    name: "Auditability — Bank Data",
    description:
      "Bank data auditability: external auditor must reconstruct bank-relationship history from KYC evidence + contract execution records.",
    requirement:
      "Auditor-readable view must reconstruct bank-relationship timeline from KYC attestations + contract execution evidence + change-log.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; no external auditor engaged yet.",
  },
];

// --- 4.3 LEGAL_OBLIGATION_DATA — 15 dimensions ---
const LEGAL_OBLIGATION_DATA_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — Legal-Obligation Data",
    description:
      "Legal-obligation data is REGULATORY-SENSITIVE — contracts, settlement obligations, regulatory undertakings.",
    requirement:
      "All legal-obligation data classified REGULATORY-SENSITIVE. Down-classification requires General Counsel opinion.",
    currentState: "DESIGNED",
    honestNote:
      "Classification designed; no General Counsel engaged yet (per W1).",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "OWNERSHIP",
    name: "Ownership — Legal-Obligation Data",
    description:
      "Legal-obligation data is owned by COO (Jozour, LLC) — commercial/legal obligations; with CTO for technical obligation records.",
    requirement:
      "Singular owner: COO for commercial/legal obligations; CTO for technical obligation records. No ownerless obligation.",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designed; not yet bound in executed data-stewardship charter.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "LINEAGE",
    name: "Lineage — Legal-Obligation Data",
    description:
      "Legal-obligation lineage must trace to: contract execution record, regulatory filing, or settlement obligation registry entry (per O1).",
    requirement:
      "Every obligation record must declare: originating source (contract / filing / O1 registry entry), execution time, transformation path, downstream consumers.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; no production obligation registry populated.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "RETENTION",
    name: "Retention — Legal-Obligation Data",
    description:
      "Legal-obligation data retention: indefinite (matches underlying contract / obligation lifecycle).",
    requirement:
      "Retain indefinitely. Contract terminations do NOT trigger obligation-data deletion — obligation records outlive the contract.",
    currentState: "DESIGNED",
    honestNote:
      "Retention designed; no production obligation records yet.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — Legal-Obligation Data",
    description:
      "Obligation records must be immutable post-creation; status transitions (e.g., PENDING → SETTLED) are new records, not in-place mutations.",
    requirement:
      "Obligation records immutable post-creation. Status transitions are new records (PENDING → SETTLED → ARCHIVED chain) referencing the parent obligation.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Immutability mechanism designed (per O1); external auditor validation pending.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — Legal-Obligation Data",
    description:
      "Legal-obligation data must reside in US jurisdiction; cross-border obligations require a documented jurisdictional choice-of-law.",
    requirement:
      "Residency: US (operating entity). Cross-border obligations require choice-of-law clause (per W1 GOVERNING_LAW section).",
    currentState: "DESIGNED",
    honestNote:
      "Residency designed as US; no cross-border obligations yet (no contracts executed).",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — Legal-Obligation Data",
    description:
      "Trust Domain A (operator) + Domain B (auditor/regulator). Bank counterparty: only its own obligations (Domain C).",
    requirement:
      "Domain A read/write; Domain B read-only; Domain C read-only restricted to own obligations. Cross-domain isolation per M2.",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "ENCRYPTION",
    name: "Encryption — Legal-Obligation Data",
    description:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level encryption for contract terms.",
    requirement:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level encryption for contract-terms fields (fee schedule, liability allocation, governing law).",
    currentState: "DESIGNED",
    honestNote:
      "Encryption designed; no production deployment yet.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — Legal-Obligation Data",
    description:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation, escrow per executed legal agreement.",
    requirement:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. Key escrow requires executed legal agreement (per V1 — no assumption of rights without contract).",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned, no escrow agreement executed.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — Legal-Obligation Data",
    description:
      "No hard-delete of obligation records. Soft-delete via tombstone post retention expiry + dual-control.",
    requirement:
      "No hard-delete. Tombstone-only. Deletion authorized by GC + COO dual-control after retention expiry.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Deletion rules designed; pending external auditor sign-off on immutability attestation.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — Legal-Obligation Data",
    description:
      "Legal hold overrides deletion/retention-expiry. Dual-control: GC + COO. Especially relevant for litigation-pending obligations.",
    requirement:
      "Legal-hold flag on obligation records; once set, no deletion until released by GC + COO dual-control.",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged yet.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — Legal-Obligation Data",
    description:
      "Regulator access via subpoena / examination / consent-decree. R2 engine READ-ONLY.",
    requirement:
      "Regulator access requests logged with requestor, scope, time-bounds. R2 engine READ-ONLY — never modifies obligation records.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — Legal-Obligation Data",
    description:
      "Bank-identifying fields within obligation records must be masked unless disclosure is need-to-know + scope-attested.",
    requirement:
      "Bank-identifier masking at RESTRICTED tier; unmasked only at REGULATORY-SENSITIVE tier with scope attestation.",
    currentState: "DESIGNED",
    honestNote:
      "Masking scheme designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — Legal-Obligation Data",
    description:
      "Obligation records must carry SHA-256 commitment + provenance + TSA stamp (per N2 Evidence Fabric).",
    requirement:
      "SHA-256 obligation-record commitment, provenance chain, TSA stamp at creation. Tamper-evidence required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed per N2; production integration pending.",
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    dimensionId: "AUDITABILITY",
    name: "Auditability — Legal-Obligation Data",
    description:
      "External auditor must reconstruct obligation lifecycle from creation → status transitions → settlement → archival.",
    requirement:
      "Auditor-readable view must reconstruct full obligation lifecycle from creation through status transitions to settlement/archival. Reproducibility required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; no external auditor engaged yet.",
  },
];

// --- 4.4 RECONCILIATION_EVIDENCE — 15 dimensions ---
const RECONCILIATION_EVIDENCE_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — Reconciliation Evidence",
    description:
      "Reconciliation evidence is CONFIDENTIAL — auditor-readable, regulator-readable, not public.",
    requirement:
      "Default classification: CONFIDENTIAL. Tolerance-band breaches escalate to REGULATORY-SENSITIVE.",
    currentState: "DESIGNED",
    honestNote:
      "Classification designed; no production reconciliation runs yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "OWNERSHIP",
    name: "Ownership — Reconciliation Evidence",
    description:
      "Owned by CTO (Jozour, LLC) — technical reconciliation evidence; COO for commercial-impact escalations.",
    requirement:
      "Singular owner: CTO for technical reconciliation; COO for commercial-impact escalations.",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designed; not yet bound in data-stewardship charter.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "LINEAGE",
    name: "Lineage — Reconciliation Evidence",
    description:
      "Reconciliation evidence must trace to: source ledger snapshot, bank attestation, custody report, market data feed, FX feed, stress scenario (per O2 tolerance bands).",
    requirement:
      "Every reconciliation evidence record must declare: source(s) (6 tolerance bands per O2), inputs hash, reconciliation algorithm version, pass/fail result, variance bps.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; no production reconciliation pipeline yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "RETENTION",
    name: "Retention — Reconciliation Evidence",
    description:
      "Reconciliation evidence retention: 7 years minimum (matches bank-statement retention); exception evidence retained indefinitely.",
    requirement:
      "Pass-evidence: 7-year minimum. Exception-evidence (tolerance-band breach): indefinite. Legal-hold overrides.",
    currentState: "DESIGNED",
    honestNote:
      "Retention designed; no production reconciliation runs yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — Reconciliation Evidence",
    description:
      "Reconciliation evidence is immutable post-creation — pass/fail status cannot be retroactively changed.",
    requirement:
      "Reconciliation evidence immutable post-creation. Re-runs produce new evidence records, never modifying the original.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Immutability mechanism designed; pending external auditor validation.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — Reconciliation Evidence",
    description:
      "Reconciliation evidence resides in US (operating entity); cross-border reconciliation evidence requires residency opinion.",
    requirement:
      "Residency: US. Cross-border bank-attestation evidence requires documented residency opinion per bank-counterparty jurisdiction.",
    currentState: "DESIGNED",
    honestNote:
      "Residency designed as US; no cross-border reconciliation evidence produced yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — Reconciliation Evidence",
    description:
      "Trust Domain A (operator) + Domain B (auditor/regulator). Bank counterparty: only reconciliation evidence involving itself (Domain C).",
    requirement:
      "Domain A read/write; Domain B read-only; Domain C read-only restricted to own bank's reconciliation evidence.",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "ENCRYPTION",
    name: "Encryption — Reconciliation Evidence",
    description:
      "AES-256-GCM at-rest, TLS 1.3 in-transit. Field-level encryption for bank-identifying fields within evidence.",
    requirement:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level encryption for bank-identifier fields in evidence records.",
    currentState: "DESIGNED",
    honestNote:
      "Encryption designed; no production deployment yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — Reconciliation Evidence",
    description:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation.",
    requirement:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. No key escrow without executed agreement.",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — Reconciliation Evidence",
    description:
      "Pass-evidence: soft-delete via tombstone post retention expiry. Exception-evidence: NEVER deleted.",
    requirement:
      "Pass-evidence: tombstone post 7-year retention + dual-control. Exception-evidence: never deleted (indefinite retention).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Deletion rules designed; pending external auditor sign-off on exception-evidence immutability.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — Reconciliation Evidence",
    description:
      "Legal hold overrides deletion. Especially relevant for exception-evidence under litigation.",
    requirement:
      "Legal-hold flag on reconciliation evidence; once set, no deletion until released by GC + COO dual-control.",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — Reconciliation Evidence",
    description:
      "Regulator access via subpoena / examination. R2 engine READ-ONLY.",
    requirement:
      "Regulator access requests logged. R2 engine READ-ONLY — never modifies reconciliation evidence.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — Reconciliation Evidence",
    description:
      "Bank-identifying fields within evidence must be masked unless disclosure is need-to-know + scope-attested.",
    requirement:
      "Bank-identifier masking at RESTRICTED tier; unmasked only at REGULATORY-SENSITIVE tier with scope attestation.",
    currentState: "DESIGNED",
    honestNote:
      "Masking scheme designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — Reconciliation Evidence",
    description:
      "Reconciliation evidence must carry SHA-256 commitment + provenance + TSA stamp (per N2 Evidence Fabric).",
    requirement:
      "SHA-256 evidence commitment, provenance chain, TSA stamp at creation. Tamper-evidence required. Variance must be reproducible from inputs.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed per N2; production reconciliation pipeline pending.",
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    dimensionId: "AUDITABILITY",
    name: "Auditability — Reconciliation Evidence",
    description:
      "External auditor must reproduce reconciliation result from inputs + algorithm version. No privileged access required.",
    requirement:
      "Auditor-readable view must reproduce reconciliation result from inputs + algorithm version + tolerance band (per O2). Reproducibility required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; no external auditor engaged yet.",
  },
];

// --- 4.5 COMPLIANCE_EVIDENCE — 15 dimensions ---
const COMPLIANCE_EVIDENCE_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — Compliance Evidence",
    description:
      "Compliance evidence is REGULATORY-SENSITIVE — KYC/AML attestations, sanctions screenings, audit attestations.",
    requirement:
      "Default classification: REGULATORY-SENSITIVE. Never down-classified without GC opinion.",
    currentState: "DESIGNED",
    honestNote:
      "Classification designed; no compliance evidence produced yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "OWNERSHIP",
    name: "Ownership — Compliance Evidence",
    description:
      "Owned by COO (Jozour, LLC) — compliance evidence is a COO accountability.",
    requirement:
      "Singular owner: COO (Jozour, LLC). All compliance evidence reports to COO.",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designed; not yet bound in data-stewardship charter.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "LINEAGE",
    name: "Lineage — Compliance Evidence",
    description:
      "Compliance evidence lineage must trace to: KYC vendor report, sanctions-screening result, regulatory filing, audit attestation.",
    requirement:
      "Every compliance-evidence record must declare: source (KYC vendor / screening service / regulator / auditor), ingestion time, transformation path, downstream consumers.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; no compliance vendor integrated yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "RETENTION",
    name: "Retention — Compliance Evidence",
    description:
      "Compliance evidence retention: 7 years minimum (KYC/AML), indefinite for audit attestations + freeze attestations.",
    requirement:
      "KYC/AML evidence: 7-year minimum. Audit/freeze attestations: indefinite. Legal-hold overrides.",
    currentState: "DESIGNED",
    honestNote:
      "Retention designed; no production compliance evidence yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — Compliance Evidence",
    description:
      "Compliance evidence is immutable post-attestation. Re-attestations produce new records, never modifying the original.",
    requirement:
      "Compliance evidence immutable post-attestation. Re-attestations (e.g., refresh of KYC) produce new records referencing the prior attestation.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Immutability mechanism designed; pending external auditor validation.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — Compliance Evidence",
    description:
      "Compliance evidence resides in US (operating entity); cross-border compliance evidence requires residency opinion.",
    requirement:
      "Residency: US. Cross-border compliance evidence (e.g., non-US KYC vendor) requires documented residency opinion.",
    currentState: "DESIGNED",
    honestNote:
      "Residency designed as US; no cross-border compliance vendors engaged yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — Compliance Evidence",
    description:
      "Trust Domain A (operator) + Domain B (auditor/regulator). Bank counterparty: only its own compliance evidence (Domain C).",
    requirement:
      "Domain A read/write; Domain B read-only; Domain C read-only restricted to own bank's compliance evidence.",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "ENCRYPTION",
    name: "Encryption — Compliance Evidence",
    description:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level encryption for PII within KYC/AML evidence.",
    requirement:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level AES-256-GCM for PII fields within compliance evidence.",
    currentState: "DESIGNED",
    honestNote:
      "Encryption designed; no production deployment yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — Compliance Evidence",
    description:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation.",
    requirement:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. No key escrow without executed agreement.",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — Compliance Evidence",
    description:
      "No hard-delete. KYC/AML evidence: tombstone post 7-year retention. Audit/freeze attestations: never deleted.",
    requirement:
      "No hard-delete. KYC/AML: tombstone post 7-year retention + dual-control. Audit/freeze: never deleted (indefinite retention).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Deletion rules designed; pending external auditor sign-off.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — Compliance Evidence",
    description:
      "Legal hold overrides deletion/retention-expiry. Dual-control: GC + COO.",
    requirement:
      "Legal-hold flag on compliance evidence; once set, no deletion until released by GC + COO dual-control.",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — Compliance Evidence",
    description:
      "Regulator access via subpoena / examination / consent-decree. R2 engine READ-ONLY.",
    requirement:
      "Regulator access requests logged with requestor, scope, time-bounds. R2 engine READ-ONLY.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — Compliance Evidence",
    description:
      "Bank-identifying + beneficiary-identifying fields must be masked unless disclosure is need-to-know + scope-attested.",
    requirement:
      "Bank-identifier + beneficiary-PII masking at RESTRICTED tier; unmasked only at REGULATORY-SENSITIVE tier with scope attestation.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Masking scheme pending external validation; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — Compliance Evidence",
    description:
      "Compliance evidence must carry SHA-256 commitment + provenance + TSA stamp (per N2 Evidence Fabric).",
    requirement:
      "SHA-256 evidence commitment, provenance chain, TSA stamp at attestation. Tamper-evidence required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed per N2; production KYC vendor integration pending.",
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    dimensionId: "AUDITABILITY",
    name: "Auditability — Compliance Evidence",
    description:
      "External auditor must reconstruct compliance evidence chain from vendor reports + attestations + filings.",
    requirement:
      "Auditor-readable view must reconstruct full compliance-evidence chain. Reproducibility required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; no external auditor engaged yet.",
  },
];

// --- 4.6 AI_MODEL_DATA — 15 dimensions ---
const AI_MODEL_DATA_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — AI / Model Data",
    description:
      "AI/model data classification: model parameters INTERNAL; training-data references CONFIDENTIAL; inference outputs match the classification of the input data.",
    requirement:
      "Model parameters: INTERNAL. Training-data references: CONFIDENTIAL. Inference outputs: inherit input classification (do not down-classify).",
    currentState: "DESIGNED",
    honestNote:
      "Classification designed; no production AI/ML models deployed.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "OWNERSHIP",
    name: "Ownership — AI / Model Data",
    description:
      "Owned by CTO (Jozour, LLC) — model artifacts, training pipelines, inference outputs.",
    requirement:
      "Singular owner: CTO (Jozour, LLC). All AI/model data reports to CTO.",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designed; not yet bound in data-stewardship charter.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "LINEAGE",
    name: "Lineage — AI / Model Data",
    description:
      "Model lineage must trace to: training-data sources, model version, training run, evaluation metrics, deployment target.",
    requirement:
      "Every model artifact must declare: training-data sources, model version, training-run ID, evaluation metrics, deployment target, downstream consumers.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; no production models deployed yet.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "RETENTION",
    name: "Retention — AI / Model Data",
    description:
      "Model artifacts + training-data references: indefinite (reproducibility). Inference outputs: match input-data retention.",
    requirement:
      "Model artifacts + training-data references: indefinite. Inference outputs: match input-data retention (e.g., ledger-data inference outputs = indefinite).",
    currentState: "DESIGNED",
    honestNote:
      "Retention designed; no production models deployed yet.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — AI / Model Data",
    description:
      "Model artifacts immutable post-deployment. Re-trains produce new model versions, never modifying deployed versions.",
    requirement:
      "Model artifacts immutable post-deployment. Re-trains produce new model version references; deployed versions remain immutable until explicit deprecation (audited).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Immutability mechanism designed; pending external auditor validation on reproducibility.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — AI / Model Data",
    description:
      "Model artifacts + training-data references reside in US. Inference outputs inherit input-data residency.",
    requirement:
      "Model artifacts: US. Training-data references: US. Inference outputs: inherit input-data residency (no cross-border inference without residency opinion).",
    currentState: "DESIGNED",
    honestNote:
      "Residency designed as US; no production models deployed.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — AI / Model Data",
    description:
      "Trust Domain A (operator) for model artifacts; Domain B (auditor/regulator) for inference-output audit logs.",
    requirement:
      "Model artifacts: Domain A read/write. Inference-output audit logs: Domain A + B read-only. Bank counterparty: only inference outputs involving its own data (Domain C).",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "ENCRYPTION",
    name: "Encryption — AI / Model Data",
    description:
      "AES-256-GCM at-rest, TLS 1.3 in-transit. Field-level encryption for PII in training-data references.",
    requirement:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level AES-256-GCM for PII fields in training-data references.",
    currentState: "DESIGNED",
    honestNote:
      "Encryption designed; no production models deployed yet.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — AI / Model Data",
    description:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. Model-serving keys may require per-model partition.",
    requirement:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. Per-model KMS partition where cross-model isolation is required.",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned, no model-serving keys provisioned.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — AI / Model Data",
    description:
      "Model artifacts: NEVER hard-deleted (reproducibility). Inference outputs: tombstone post input-data retention expiry.",
    requirement:
      "Model artifacts: never deleted (indefinite). Inference outputs: tombstone post input-data retention expiry + dual-control.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Deletion rules designed; pending external auditor sign-off on reproducibility immutability.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — AI / Model Data",
    description:
      "Legal hold overrides deletion. Especially relevant for AI-bias / AI-fairness litigation.",
    requirement:
      "Legal-hold flag on AI/model data; once set, no deletion until released by GC + COO dual-control.",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged yet.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — AI / Model Data",
    description:
      "Regulator access via subpoena / examination / consent-decree. Model cards + audit logs available to regulators.",
    requirement:
      "Regulator access requests logged. Model cards + audit logs available to regulators. R2 engine READ-ONLY.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — AI / Model Data",
    description:
      "Participant-identifying fields in training data + inference outputs must be masked unless need-to-know + scope-attested.",
    requirement:
      "Masking at RESTRICTED tier; unmasked only at REGULATORY-SENSITIVE tier with scope attestation. No bank counterparty may see another's training-data references.",
    currentState: "DESIGNED",
    honestNote:
      "Masking scheme designed; no production models deployed.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — AI / Model Data",
    description:
      "Model artifacts must carry SHA-256 commitment + training-data provenance + TSA stamp. Inference outputs: same integrity protections as EvidencePackage (per N2).",
    requirement:
      "SHA-256 model-artifact commitment, training-data provenance chain, TSA stamp at deployment. Inference outputs: SHA-256 + provenance + TSA stamp (per N2).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed per N2; production model deployment pending.",
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    dimensionId: "AUDITABILITY",
    name: "Auditability — AI / Model Data",
    description:
      "External auditor must be able to reproduce inference outputs from model artifact + training-data references + input. No privileged access.",
    requirement:
      "Auditor-readable view must reproduce inference outputs from model artifact + training-data references + input. Reproducibility required (no black-box inferences).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; no production models deployed, no external auditor engaged.",
  },
];

// --- 4.7 OPERATIONAL_LOGS — 15 dimensions ---
const OPERATIONAL_LOGS_DIMENSIONS: GovernanceDimensionCell[] = [
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "DATA_CLASSIFICATION",
    name: "Data Classification — Operational Logs",
    description:
      "Operational logs: CONFIDENTIAL by default; REGULATORY-SENSITIVE if they contain PII or audit-trail events.",
    requirement:
      "Default: CONFIDENTIAL. Logs containing PII or audit-trail events: REGULATORY-SENSITIVE.",
    currentState: "DESIGNED",
    honestNote:
      "Classification designed; no production log pipeline deployed.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "OWNERSHIP",
    name: "Ownership — Operational Logs",
    description:
      "Owned by CTO (Jozour, LLC) — operational logs are a CTO accountability.",
    requirement:
      "Singular owner: CTO (Jozour, LLC). All operational logs report to CTO.",
    currentState: "DESIGNED",
    honestNote:
      "Ownership designed; not yet bound in data-stewardship charter.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "LINEAGE",
    name: "Lineage — Operational Logs",
    description:
      "Operational log lineage must trace to: source system, log-emitting component, log-emission time, correlating transaction ID (where applicable).",
    requirement:
      "Every log event must declare: source system, component, emission time, transaction ID (where applicable), severity, category.",
    currentState: "DESIGNED",
    honestNote:
      "Lineage schema designed; no production log pipeline deployed.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "RETENTION",
    name: "Retention — Operational Logs",
    description:
      "Operational log retention: 1 year minimum (operational), 7 years for audit-trail events (regulatory), indefinite for incident-response logs (per S1 SettlementContinuityFabric events).",
    requirement:
      "Operational logs: 1-year minimum. Audit-trail events: 7-year minimum. SettlementContinuityFabric incident-response logs: indefinite.",
    currentState: "DESIGNED",
    honestNote:
      "Retention designed; no production log retention clock running yet.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "IMMUTABILITY",
    name: "Immutability — Operational Logs",
    description:
      "Operational logs are append-only / hash-chained — no log entry may be modified or deleted in-place.",
    requirement:
      "Append-only / hash-chained logs. No in-place modification. Any 'correction' is a new log entry referencing the original (with audit-trail attestation).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Immutability mechanism designed; pending external auditor validation on log-tamper-evidence.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "JURISDICTIONAL_RESIDENCY",
    name: "Jurisdictional Residency — Operational Logs",
    description:
      "Operational logs reside in US (operating entity). Cross-border log replication requires residency opinion.",
    requirement:
      "Residency: US. Cross-border log replication (e.g., to a cloud-region outside US) requires documented residency opinion.",
    currentState: "DESIGNED",
    honestNote:
      "Residency designed as US; no production log pipeline deployed.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "ACCESS_CONTROL",
    name: "Access Control — Operational Logs",
    description:
      "Trust Domain A (operator) read/write; Domain B (auditor/regulator) read-only. Bank counterparty: only logs involving its own transactions (Domain C).",
    requirement:
      "Domain A read/write; Domain B read-only; Domain C read-only restricted to logs involving its own transactions.",
    currentState: "DESIGNED",
    honestNote:
      "Access-control matrix designed; no production RBAC enforcement yet.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "ENCRYPTION",
    name: "Encryption — Operational Logs",
    description:
      "AES-256-GCM at-rest, TLS 1.3 in-transit. Field-level encryption for PII within log payloads.",
    requirement:
      "AES-256-GCM at-rest, TLS 1.3 in-transit, field-level AES-256-GCM for PII fields within log payloads.",
    currentState: "DESIGNED",
    honestNote:
      "Encryption designed; no production log pipeline deployed.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "KEY_MANAGEMENT",
    name: "Key Management — Operational Logs",
    description:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation.",
    requirement:
      "HSM-backed, dual-control + split-knowledge, quarterly rotation. No key escrow without executed agreement.",
    currentState: "DESIGNED",
    honestNote:
      "KMS design pending; no HSM provisioned yet.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "DELETION_RULES",
    name: "Deletion Rules — Operational Logs",
    description:
      "No hard-delete. Soft-delete via tombstone post retention expiry. Audit-trail events: never deleted. Incident-response logs: never deleted.",
    requirement:
      "No hard-delete. Operational: tombstone post 1-year retention. Audit-trail + incident-response: never deleted (indefinite).",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Deletion rules designed; pending external auditor sign-off on log immutability.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "LEGAL_HOLDS",
    name: "Legal Holds — Operational Logs",
    description:
      "Legal hold overrides deletion. Especially relevant for incident-response logs under litigation.",
    requirement:
      "Legal-hold flag on log events; once set, no deletion until released by GC + COO dual-control.",
    currentState: "DESIGNED",
    honestNote:
      "Legal-hold mechanism designed; no General Counsel engaged yet.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "REGULATORY_ACCESS",
    name: "Regulatory Access — Operational Logs",
    description:
      "Regulator access via subpoena / examination. R2 engine READ-ONLY.",
    requirement:
      "Regulator access requests logged. R2 engine READ-ONLY — never modifies log entries.",
    currentState: "DESIGNED",
    honestNote:
      "Regulatory access process designed; no production regulator request received.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "PARTICIPANT_CONFIDENTIALITY",
    name: "Participant Confidentiality — Operational Logs",
    description:
      "Participant-identifying fields in log payloads must be masked unless need-to-know + scope-attested.",
    requirement:
      "Masking at RESTRICTED tier; unmasked only at REGULATORY-SENSITIVE tier with scope attestation. No bank counterparty may see another's log entries.",
    currentState: "DESIGNED",
    honestNote:
      "Masking scheme designed; no production log pipeline deployed.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "EVIDENCE_INTEGRITY",
    name: "Evidence Integrity — Operational Logs",
    description:
      "Operational logs must be hash-chained (each entry references SHA-256 of prior entry). TSA stamp at chain-sealing intervals.",
    requirement:
      "Hash-chained log entries (SHA-256 prior-entry reference). TSA stamp at chain-sealing intervals (e.g., hourly / daily). Tamper-evidence required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Integrity mechanism designed; pending external auditor validation on log-chain tamper-evidence.",
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    dimensionId: "AUDITABILITY",
    name: "Auditability — Operational Logs",
    description:
      "External auditor must reconstruct operational timeline from log chain. No privileged access required.",
    requirement:
      "Auditor-readable view must reconstruct operational timeline from hash-chained log entries. Reproducibility required.",
    currentState: "PENDING_EXTERNAL_VALIDATION",
    honestNote:
      "Auditability design complete; no external auditor engaged yet.",
  },
];

// ============================================================================
// PART 5: The assembled matrix — 7 data types × 15 dimensions = 105 cells
// ============================================================================

export const GOVERNANCE_MATRIX: DataTypeGovernanceRow[] = [
  {
    dataTypeId: "LEDGER_DATA",
    name: "Ledger Data",
    description: DATA_TYPES[0].description,
    dimensions: LEDGER_DATA_DIMENSIONS,
  },
  {
    dataTypeId: "BANK_DATA",
    name: "Bank Data",
    description: DATA_TYPES[1].description,
    dimensions: BANK_DATA_DIMENSIONS,
  },
  {
    dataTypeId: "LEGAL_OBLIGATION_DATA",
    name: "Legal-Obligation Data",
    description: DATA_TYPES[2].description,
    dimensions: LEGAL_OBLIGATION_DATA_DIMENSIONS,
  },
  {
    dataTypeId: "RECONCILIATION_EVIDENCE",
    name: "Reconciliation Evidence",
    description: DATA_TYPES[3].description,
    dimensions: RECONCILIATION_EVIDENCE_DIMENSIONS,
  },
  {
    dataTypeId: "COMPLIANCE_EVIDENCE",
    name: "Compliance Evidence",
    description: DATA_TYPES[4].description,
    dimensions: COMPLIANCE_EVIDENCE_DIMENSIONS,
  },
  {
    dataTypeId: "AI_MODEL_DATA",
    name: "AI / Model Data",
    description: DATA_TYPES[5].description,
    dimensions: AI_MODEL_DATA_DIMENSIONS,
  },
  {
    dataTypeId: "OPERATIONAL_LOGS",
    name: "Operational Logs",
    description: DATA_TYPES[6].description,
    dimensions: OPERATIONAL_LOGS_DIMENSIONS,
  },
];

// ============================================================================
// PART 6: The INSTITUTIONAL_VALIDITY_RULE — the critical directive rule
// ============================================================================

export const INSTITUTIONAL_VALIDITY_RULE = {
  rule: "Per PROMPT 32: 'No evidence may be considered institutionally valid without provenance, timestamp, source, integrity protection and verification status.'",
  description:
    "Every evidence record produced or consumed by the MITHQAL system MUST declare five mandatory fields before it may be treated as institutionally valid: (1) provenance — origin system + transformation path; (2) timestamp — TSA-stamped creation time; (3) source — declared source system + source-record reference; (4) integrity protection — SHA-256 commitment + (where applicable) Merkle-root inclusion proof; (5) verification status — UNVERIFIED / SELF_VERIFIED / EXTERNALLY_VERIFIED / REGULATOR_VERIFIED. Evidence missing any of these five fields is institutionally INVALID and must be rejected by downstream consumers.",
  fiveMandatoryFields: [
    {
      field: "provenance",
      description:
        "Origin system + transformation path. Cross-references N2 Evidence Fabric provenance field.",
    },
    {
      field: "timestamp",
      description:
        "Trusted-Timestamp-Authority-stamped creation time. Cross-references N2 Evidence Fabric timestamp field.",
    },
    {
      field: "source",
      description:
        "Declared source system + source-record reference. Cross-references N2 Evidence Fabric source field.",
    },
    {
      field: "integrityProtection",
      description:
        "SHA-256 commitment + (where applicable) Merkle-root inclusion proof. Cross-references N2 Evidence Fabric integrityHash field.",
    },
    {
      field: "verificationStatus",
      description:
        "UNVERIFIED / SELF_VERIFIED / EXTERNALLY_VERIFIED / REGULATOR_VERIFIED. Cross-references N2 Evidence Fabric verificationStatus field.",
    },
  ] as const,
  verificationStatusLadder: [
    "UNVERIFIED",
    "SELF_VERIFIED",
    "EXTERNALLY_VERIFIED",
    "REGULATOR_VERIFIED",
  ] as const,
  currentHonestState:
    "ALL 105 governance-matrix cells (15 dimensions × 7 data types) are at DESIGNED or PENDING_EXTERNAL_VALIDATION state. ZERO cells at IMPLEMENTED+validated. No evidence record has been produced under this framework yet. The INSTITUTIONAL_VALIDITY_RULE is the binding directive that any evidence record MUST satisfy before being treated as institutionally valid.",
  notLegalOpinion:
    "This framework is a DATA GOVERNANCE specification, NOT a legal opinion. Residency opinions, key-escrow agreements, and regulatory-access orders must be obtained from qualified external counsel (per V1 — no assumption of legal rights without contract).",
};

// ============================================================================
// PART 7: Helpers + status exports
// ============================================================================

export function getDataType(
  dataTypeId: DataTypeId,
): DataTypeGovernanceRow | undefined {
  return GOVERNANCE_MATRIX.find((r) => r.dataTypeId === dataTypeId);
}

export function getGovernanceCell(
  dataTypeId: DataTypeId,
  dimensionId: GovernanceDimensionId,
): GovernanceDimensionCell | undefined {
  const row = getDataType(dataTypeId);
  if (!row) return undefined;
  return row.dimensions.find((d) => d.dimensionId === dimensionId);
}

export function getCellsByState(
  state: GovernanceState,
): GovernanceDimensionCell[] {
  return GOVERNANCE_MATRIX.flatMap((r) => r.dimensions).filter(
    (d) => d.currentState === state,
  );
}

export const DATA_GOVERNANCE_STATUS = "ACTIVE";
export const DATA_GOVERNANCE_VERSION = "v25.3.19-X1-1.0";
export const DATA_GOVERNANCE_SOURCE =
  "src/lib/institutional-data-governance.ts";
export const DATA_TYPE_COUNT = 7;
export const GOVERNANCE_DIMENSION_COUNT = 15;
export const GOVERNANCE_CELL_COUNT = 105; // 15 × 7

// === Field-name catalog (15 dimensions, per directive) ===
export const GOVERNANCE_DIMENSION_FIELDS: readonly string[] = [
  "dataClassification",
  "ownership",
  "lineage",
  "retention",
  "immutability",
  "jurisdictionalResidency",
  "accessControl",
  "encryption",
  "keyManagement",
  "deletionRules",
  "legalHolds",
  "regulatoryAccess",
  "participantConfidentiality",
  "evidenceIntegrity",
  "auditability",
] as const;

// === Data-type-name catalog (7 data types, per directive) ===
export const GOVERNANCE_DATA_TYPE_FIELDS: readonly string[] = [
  "ledgerData",
  "bankData",
  "legalObligationData",
  "reconciliationEvidence",
  "complianceEvidence",
  "aiModelData",
  "operationalLogs",
] as const;
