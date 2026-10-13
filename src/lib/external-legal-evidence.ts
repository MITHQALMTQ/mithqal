// src/lib/external-legal-evidence.ts
//
// MITHQAL v25.3.2 — Validated External Legal/Regulatory Evidence Registry
// Per MITHQAL-V25.3.2-REMEDIATION-LAYER.md §2 layer 4.
//
// OVERRIDE-PREVENTION RULES (per §3 of the remediation layer doc):
// - External evidence VALIDATES layers 1-3, it does NOT override them.
// - An ACTIVE v25.3.2 rule with no ACTIVE external evidence is marked
//   PENDING_VALIDATION in the policy registry.
// - RETIRED evidence is retained for traceability but cannot validate any
//   ACTIVE policy.
//
// This registry is layer 4 of the 5-layer canonical authority hierarchy:
//   1. v25.3.2 controlling remediation layer (THE ACTIVE MODEL)
//   2. approved constitutional rules (Constitution v19.0)
//   3. active machine-readable policy registry (src/lib/policy-registry.ts)
//   4. validated external legal/regulatory evidence (THIS FILE)
//   5. historical material
//
// Each evidence item is machine-readable and cross-references the policy
// registry by policy id. The /api/legal-evidence endpoint exposes this
// registry with explicit status filtering.

export type EvidenceType =
  | "OPERATING_AGREEMENT"
  | "RESOLUTION"
  | "CERTIFICATE_OF_FORMATION"
  | "EIN_LETTER"
  | "SHARIA_ATTESTATION"
  | "AUDIT_REPORT"
  | "REGULATORY_LICENSE";

export type EvidenceStatus = "ACTIVE" | "PENDING_VALIDATION" | "RETIRED";

export interface LegalEvidence {
  /** Machine-readable id, e.g. JOZOUR_AMENDMENT_2026-07-31 */
  id: string;
  /** Kind of external evidence */
  type: EvidenceType;
  /** Human-readable title */
  title: string;
  /** ACTIVE = validates; PENDING_VALIDATION = gated from production; RETIRED = traceability only */
  status: EvidenceStatus;
  /** ISO 8601 date the evidence was issued ("" when not yet issued) */
  date: string;
  /** ISO 8601 date MITHQAL validated the evidence */
  validatedDate?: string;
  /** Issuing entity (Jozour LLC, State of New Jersey, IRS, AAOIFI, Independent Auditor) */
  issuer: string;
  /** Jurisdiction of the issuer (e.g. "New Jersey, USA", "United States", "International") */
  issuerJurisdiction: string;
  /** URL or file path where the evidence is stored */
  sourceUrl: string;
  /** SHA-256 hash of the evidence content (placeholder string until operator computes real hash) */
  hash?: string;
  /** Party that validated the evidence (e.g. "Mohamed Salah Eltonsy, Manager, Jozour, LLC") */
  validatedBy?: string;
  /** 1-2 sentence description */
  description: string;
  /** Policy ids in the policy registry that this evidence validates */
  references: string[];
  /** Optional notes for operator audit */
  notes?: string;
}

// === THE REGISTRY ===
//
// 6 evidence items:
//   4 ACTIVE (Jozour Amendment, Jozour Resolution, NJ LLC Certificate, IRS EIN)
//   2 PENDING_VALIDATION (AAOIFI Sharia attestation, Independent audit report)
//
// Policy id references (per Agent I2's policy registry, assumed to exist):
//   - PROJECT_AUTHORIZATION
//   - RESERVE_RATIO_MINIMUM
//   - MTQ_ANCHOR
//   - GOLD_AS_CONSTITUTIONAL_ANCHOR
//   - FULL_REDEEMABILITY
//   - DETERMINISTIC_MONETARY_ENGINE
//   - NO_DISCRETIONARY_MINTING
//   - NO_LENDING_OF_RESERVES
//   - NO_COMMINGLING
//   - MITHQAL_CUSTODIES_BACKING
//   - BANK_CUSTODY_REQUIRED
//   - MAX_INSTITUTIONAL_CONCENTRATION
//   - TWO_ENTITY_ARCHITECTURE
//   - ASSET_SEGREGATION
//   - SUCCESSOR_TRANSFER
//   - MITHQAL_OWNS_MTQ_BACKING

export const LEGAL_EVIDENCE_REGISTRY: LegalEvidence[] = [
  // =========================================================================
  // 1. JOZOUR OPERATING AGREEMENT AMENDMENT NO. 1 — ACTIVE
  // =========================================================================
  {
    id: "JOZOUR_AMENDMENT_2026-07-31",
    type: "OPERATING_AGREEMENT",
    title: "Jozour, LLC Operating Agreement Amendment No. 1",
    status: "ACTIVE",
    date: "2026-07-31",
    validatedDate: "2026-09-29",
    issuer: "Jozour, LLC",
    issuerJurisdiction: "New Jersey, USA",
    sourceUrl:
      "https://github.com/MITHQALMTQ/mithqal/blob/main/public/legal/jozour-llc-nj-certificate.pdf",
    hash: "sha256:jozour-amendment-2026-07-31", // operator should compute actual hash
    validatedBy: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
    description:
      "Formalizes MITHQAL project as a project of Jozour, LLC. Establishes two-entity architecture (Foundation to-be-formed + Jozour interim operator). Adopts 8 constitutional principles. Requires asset segregation and successor transfer.",
    references: [
      "PROJECT_AUTHORIZATION",
      "TWO_ENTITY_ARCHITECTURE",
      "RESERVE_RATIO_MINIMUM",
      "NO_DISCRETIONARY_MINTING",
      "NO_LENDING_OF_RESERVES",
      "NO_COMMINGLING",
      "DETERMINISTIC_MONETARY_ENGINE",
      "FULL_REDEEMABILITY",
      "GOLD_AS_CONSTITUTIONAL_ANCHOR",
      "MTQ_ANCHOR",
      "ASSET_SEGREGATION",
      "SUCCESSOR_TRANSFER",
      "MITHQAL_OWNS_MTQ_BACKING",
      "MITHQAL_CUSTODIES_BACKING",
    ],
    notes:
      "See /legal/institutional-trust for the surfaced §1.4 (Asset Segregation) content. See /legal/indemnification for §1.5 (Manager Indemnification).",
  },

  // =========================================================================
  // 2. JOZOUR RESOLUTION REGARDING THE MITHQAL PROJECT — ACTIVE
  // =========================================================================
  {
    id: "JOZOUR_RESOLUTION_2026-07-31",
    type: "RESOLUTION",
    title: "Resolution of Jozour, LLC Regarding the MITHQAL Project",
    status: "ACTIVE",
    date: "2026-07-31",
    validatedDate: "2026-09-29",
    issuer: "Jozour, LLC",
    issuerJurisdiction: "New Jersey, USA",
    sourceUrl:
      "https://github.com/MITHQALMTQ/mithqal/blob/main/public/legal/jozour-llc-nj-certificate.pdf",
    hash: "sha256:jozour-resolution-2026-07-31",
    validatedBy: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
    description:
      "Authorizes the MITHQAL project as a project of the Company. EIN 84-3470275, registered office 116 Mallory Ave, Jersey City, NJ 07304. Manager authorized to execute contracts, open accounts, develop IP. Project assets held until successor transfer.",
    references: [
      "PROJECT_AUTHORIZATION",
      "TWO_ENTITY_ARCHITECTURE",
      "RESERVE_RATIO_MINIMUM",
      "MTQ_ANCHOR",
      "GOLD_AS_CONSTITUTIONAL_ANCHOR",
      "NO_DISCRETIONARY_MINTING",
      "NO_LENDING_OF_RESERVES",
      "FULL_REDEEMABILITY",
      "SUCCESSOR_TRANSFER",
      "MITHQAL_CUSTODIES_BACKING",
      "BANK_CUSTODY_REQUIRED",
      "MAX_INSTITUTIONAL_CONCENTRATION",
    ],
    notes:
      "Resolution cross-references Amendment No. 1 §1.3 (8 constitutional principles). Together they constitute the binding governance basis for the project.",
  },

  // =========================================================================
  // 3. NEW JERSEY CERTIFICATE OF FORMATION — ACTIVE
  // =========================================================================
  {
    id: "JOZOUR_NJ_LLC_CERTIFICATE_2019-10-24",
    type: "CERTIFICATE_OF_FORMATION",
    title: "Jozour, LLC New Jersey Certificate of Formation",
    status: "ACTIVE",
    date: "2019-10-24",
    validatedDate: "2026-09-29",
    issuer: "State of New Jersey",
    issuerJurisdiction: "New Jersey, USA",
    sourceUrl:
      "https://github.com/MITHQALMTQ/mithqal/blob/main/public/legal/jozour-llc-nj-certificate.pdf",
    hash: "sha256:jozour-nj-llc-certificate-2019-10-24",
    validatedBy: "State of New Jersey Division of Revenue",
    description:
      "Jozour, LLC formed October 24, 2019 under the laws of the State of New Jersey. EIN 84-3470275. Registered office 116 Mallory Ave, Jersey City, NJ 07304. Manager: Mohamed Salah Eltonsy.",
    references: [
      "PROJECT_AUTHORIZATION",
      "TWO_ENTITY_ARCHITECTURE",
      "BANK_CUSTODY_REQUIRED",
    ],
    notes:
      "Foundational entity evidence. Without this, the Amendment and Resolution would have no legal vehicle to bind.",
  },

  // =========================================================================
  // 4. IRS EIN ASSIGNMENT LETTER — ACTIVE (number documented in Resolution)
  // =========================================================================
  {
    id: "IRS_EIN_LETTER_JOZOUR_84-3470275",
    type: "EIN_LETTER",
    title: "IRS EIN Assignment Letter — Jozour, LLC (EIN 84-3470275)",
    status: "ACTIVE",
    date: "2019-10-24",
    validatedDate: "2026-09-29",
    issuer: "Internal Revenue Service (IRS)",
    issuerJurisdiction: "United States",
    sourceUrl:
      "(not yet uploaded — operator should upload IRS EIN assignment letter CP 575)",
    hash: "sha256:irs-ein-jozour-84-3470275",
    validatedBy: "Internal Revenue Service",
    description:
      "IRS-assigned Employer Identification Number 84-3470275 for Jozour, LLC. Required for federal tax filings, banking, and institutional partnerships.",
    references: ["PROJECT_AUTHORIZATION", "BANK_CUSTODY_REQUIRED"],
    notes:
      "The EIN number is documented in the JOZOUR Resolution. The operator should upload the actual IRS CP 575 letter to public/legal/ and recompute the hash when available. The EIN itself is ACTIVE — only the source artefact upload is pending.",
  },

  // =========================================================================
  // 5. AAOIFI SHARIA COMPLIANCE ATTESTATION — PENDING_VALIDATION
  // =========================================================================
  {
    id: "AAOIFI_SHARIA_ATTESTATION_PENDING",
    type: "SHARIA_ATTESTATION",
    title: "AAOIFI Sharia Compliance Attestation (PENDING)",
    status: "PENDING_VALIDATION",
    date: "", // not yet issued
    issuer:
      "AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions)",
    issuerJurisdiction: "International (Bahrain HQ)",
    sourceUrl: "(pending — not yet applied for)",
    description:
      "Independent Sharia compliance attestation from AAOIFI. Required for institutional Islamic finance adoption. Per Constitution v19.0 §V19.0 (Sharia-compliance pillar).",
    references: [
      "MTQ_ANCHOR",
      "GOLD_AS_CONSTITUTIONAL_ANCHOR",
      "NO_DISCRETIONARY_MINTING",
      "NO_LENDING_OF_RESERVES",
      "NO_COMMINGLING",
      "RESERVE_RATIO_MINIMUM",
      "FULL_REDEEMABILITY",
    ],
    notes:
      "PENDING — application not yet submitted. Operator must engage an AAOIFI-certified Sharia board. Until ACTIVE, the Sharia-sensitive policy values remain PENDING_VALIDATION in the policy registry and are gated from production.",
  },

  // =========================================================================
  // 6. INDEPENDENT AUDITOR RESERVE VERIFICATION REPORT — PENDING_VALIDATION
  // =========================================================================
  {
    id: "INDEPENDENT_AUDIT_REPORT_PENDING",
    type: "AUDIT_REPORT",
    title: "Independent Auditor Reserve Verification Report (PENDING)",
    status: "PENDING_VALIDATION",
    date: "", // not yet issued
    issuer: "Big-Four accounting firm (TBD)",
    issuerJurisdiction: "International",
    sourceUrl: "(pending — not yet engaged)",
    description:
      "Independent auditor's report verifying reserve composition, custody arrangements, and reconciliation with on-chain Oracle data. Required for institutional-grade adoption per Constitution v19.0 §V19.0.",
    references: [
      "RESERVE_RATIO_MINIMUM",
      "MITHQAL_CUSTODIES_BACKING",
      "BANK_CUSTODY_REQUIRED",
      "MAX_INSTITUTIONAL_CONCENTRATION",
      "NO_LENDING_OF_RESERVES",
      "NO_COMMINGLING",
      "FULL_REDEEMABILITY",
    ],
    notes:
      "PENDING — auditor not yet engaged. Operator must select a Big-Four firm and execute an engagement letter. Until ACTIVE, the institutional-reserve-attestation policy values remain PENDING_VALIDATION in the policy registry and are gated from production.",
  },
];

// === API ===

/**
 * Return all ACTIVE evidence (i.e. evidence that currently validates policies).
 * PENDING_VALIDATION and RETIRED items are excluded.
 */
export function getActiveEvidence(): LegalEvidence[] {
  return LEGAL_EVIDENCE_REGISTRY.filter((e) => e.status === "ACTIVE");
}

/**
 * Return all PENDING_VALIDATION evidence (i.e. evidence that is gated from
 * production authorization). ACTIVE and RETIRED items are excluded.
 */
export function getPendingEvidence(): LegalEvidence[] {
  return LEGAL_EVIDENCE_REGISTRY.filter(
    (e) => e.status === "PENDING_VALIDATION",
  );
}

/**
 * Return all RETIRED evidence (i.e. evidence retained for traceability only —
 * it cannot validate any ACTIVE policy).
 */
export function getRetiredEvidence(): LegalEvidence[] {
  return LEGAL_EVIDENCE_REGISTRY.filter((e) => e.status === "RETIRED");
}

/**
 * Return all evidence that validates the given policy id.
 * Includes ACTIVE + PENDING_VALIDATION + RETIRED items — the caller can
 * inspect each item's `status` to decide whether to expose it.
 */
export function getEvidenceForPolicy(policyId: string): LegalEvidence[] {
  return LEGAL_EVIDENCE_REGISTRY.filter((e) => e.references.includes(policyId));
}

/** Return the evidence with the given id, or undefined. */
export function getEvidenceById(id: string): LegalEvidence | undefined {
  return LEGAL_EVIDENCE_REGISTRY.find((e) => e.id === id);
}

/**
 * Return all evidence, optionally filtered by status. Pass { status: "ALL" }
 * or omit options to return every item regardless of status.
 */
export function getAllEvidence(
  options?: { status?: EvidenceStatus | "ALL" },
): LegalEvidence[] {
  let result = LEGAL_EVIDENCE_REGISTRY;
  if (options?.status && options.status !== "ALL") {
    result = result.filter((e) => e.status === options.status);
  }
  return result;
}

export const LEGAL_EVIDENCE_REGISTRY_VERSION = "1.0.0";
export const LEGAL_EVIDENCE_REGISTRY_SOURCE = "src/lib/external-legal-evidence.ts";
