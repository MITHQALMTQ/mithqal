// src/lib/institutional-external-identity.ts
//
// MITHQAL v25.3.18 — INSTITUTIONAL EXTERNAL IDENTITY STANDARD (single source of truth)
// Per PROMPT 29:
//   "Create an Institutional Presence Standard. Replace informal/personal contact
//    with: controlled organizational email, controlled institutional domain,
//    consistent legal entity naming, document provenance, version/date/classification,
//    institutional contact role, controlled public website identity, consistent
//    disclaimer language. Never invent a legal entity, domain, address or
//    regulatory status. Until the contracting entity is legally finalized, use
//    an explicit PENDING_ENTITY_IDENTITY state rather than pretending the final
//    structure exists."

// === Entity Identity State ===
export type EntityIdentityState =
  | "PENDING_ENTITY_IDENTITY"     // entity not yet legally finalized
  | "OPERATING_ENTITY_ACTIVE"    // operating entity is active (JOZOUR LLC)
  | "CONTRACTING_ENTITY_FINALIZED"; // contracting entity is legally finalized (future)

// === The 8 Institutional Presence Standards (per directive) ===

export interface InstitutionalPresenceStandard {
  standardId: string;
  name: string;
  description: string;
  // Current state (honest — per directive: "Never invent a legal entity, domain,
  // address or regulatory status")
  currentState: EntityIdentityState;
  // What the standard requires
  requiredValue: string;
  // Current value (honest — may be PENDING)
  currentValue: string;
  // Whether the current value is honest (not invented)
  isHonest: boolean;
  // Honest note
  honestNote: string;
}

export const INSTITUTIONAL_PRESENCE_STANDARDS: InstitutionalPresenceStandard[] = [
  {
    standardId: "CONTROLLED_ORGANIZATIONAL_EMAIL",
    name: "Controlled Organizational Email",
    description:
      "All MITHQAL communication must use controlled organizational email (not personal email).",
    currentState: "PENDING_ENTITY_IDENTITY",
    requiredValue:
      "A controlled organizational email domain (e.g., @mithqal.org) — REQUIRES domain registration + DNS control + email hosting.",
    currentValue:
      "PENDING — no organizational email domain registered yet. Personal email may be in use (must be replaced).",
    isHonest: true,
    honestNote:
      "Per PROMPT 29: 'Replace informal/personal contact presentation with controlled organizational email.' Until the contracting entity registers a domain, use PENDING_ENTITY_IDENTITY.",
  },
  {
    standardId: "CONTROLLED_INSTITUTIONAL_DOMAIN",
    name: "Controlled Institutional Domain",
    description: "MITHQAL must have a controlled institutional domain (e.g., mithqal.org).",
    currentState: "PENDING_ENTITY_IDENTITY",
    requiredValue:
      "A registered domain under MITHQAL's control — REQUIRES domain registration + DNS control.",
    currentValue:
      "PENDING — the current website (mithqal.vercel.app) is a Vercel subdomain, NOT a controlled institutional domain. A custom domain (e.g., mithqal.org) must be registered.",
    isHonest: true,
    honestNote:
      "mithqal.vercel.app is a Vercel-managed subdomain. A controlled institutional domain must be registered by the contracting entity.",
  },
  {
    standardId: "CONSISTENT_LEGAL_ENTITY_NAMING",
    name: "Consistent Legal Entity Naming",
    description:
      "All references to MITHQAL's legal entity must be consistent (per v25.3.7 bankFacingCounterpartyEntityId).",
    currentState: "OPERATING_ENTITY_ACTIVE",
    requiredValue:
      "Consistent naming: 'Jozour, LLC (New Jersey)' for the operating entity, 'MITHQAL Foundation Inc. (to be formed)' for the future foundation.",
    currentValue:
      "Jozour, LLC (NJ, EIN 84-3470275) — ACTIVE as operating entity per JOZOUR Amendment. MITHQAL Foundation = PENDING (to be formed per §1.6).",
    isHonest: true,
    honestNote:
      "Operating entity is ACTIVE (JOZOUR). Contracting entity finalization (Foundation formation) is PENDING. Per v25.3.7: internalSeparation is PRESERVED but Holding/Technology/Oversight are PENDING_LEGAL_VERIFICATION.",
  },
  {
    standardId: "DOCUMENT_PROVENANCE",
    name: "Document Provenance",
    description:
      "Every MITHQAL document must have provenance (who issued it, when, what version).",
    currentState: "OPERATING_ENTITY_ACTIVE",
    requiredValue:
      "Every document carries: issuer, issue date, version, classification, document ID.",
    currentValue:
      "Per v25.3.2 authority hierarchy — every canonical module carries _meta.activeModel, _meta.source, _meta.version, _meta.status. Document provenance is ACTIVE for machine-readable outputs.",
    isHonest: true,
    honestNote:
      "Machine-readable provenance is ACTIVE. Human-readable document provenance (for legal/commercial docs) is PENDING.",
  },
  {
    standardId: "VERSION_DATE_CLASSIFICATION",
    name: "Version / Date / Classification",
    description:
      "Every document must carry version, date, and classification (PUBLIC / INSTITUTIONAL / CONFIDENTIAL / RESTRICTED).",
    currentState: "OPERATING_ENTITY_ACTIVE",
    requiredValue: "Version + date + classification on every document.",
    currentValue:
      "Machine-readable outputs carry version (per _meta.version) + date (per _meta.generatedAt or generatedAt). Classification: PUBLIC (API responses), INSTITUTIONAL (evidence packages at INSTITUTIONAL access), CONFIDENTIAL (evidence at AUDIT access).",
    isHonest: true,
    honestNote:
      "Machine-readable version+date is ACTIVE. Human-readable document classification is PENDING.",
  },
  {
    standardId: "INSTITUTIONAL_CONTACT_ROLE",
    name: "Institutional Contact Role",
    description: "Contact must be by institutional role (COO, CTO, etc.), not personal name.",
    currentState: "OPERATING_ENTITY_ACTIVE",
    requiredValue:
      "Contacts identified by role (e.g., 'COO, MITHQAL' / 'CTO, MITHQAL'), not personal name.",
    currentValue:
      "Per v25.3.7: owner roles are defined (COO, CTO, PM). Per v25.3.17 PROMPT 27: system coordinates by role, not personal identity. The current operating entity (JOZOUR LLC) has Manager: Mohamed Salah Eltonsy — referenced by role, not personal email.",
    isHonest: true,
    honestNote:
      "Role-based contact is ACTIVE in machine-readable modules. Personal email replacement requires organizational email (PENDING).",
  },
  {
    standardId: "CONTROLLED_PUBLIC_WEBSITE_IDENTITY",
    name: "Controlled Public Website Identity",
    description:
      "The public website must present a controlled institutional identity (not personal).",
    currentState: "PENDING_ENTITY_IDENTITY",
    requiredValue:
      "Website presents MITHQAL as an institution (not a personal project). Legal entity name, EIN (if disclosed), jurisdiction, governing law, disclaimer.",
    currentValue:
      "mithqal.vercel.app presents MITHQAL content but: (1) uses Vercel subdomain (not controlled domain), (2) no EIN disclosure on website, (3) no explicit legal entity identification on the homepage.",
    isHonest: true,
    honestNote:
      "Website identity must be resolved — register domain, add legal entity identification, add disclaimer language. Per PROMPT 29: 'must be resolved deliberately rather than silently.'",
  },
  {
    standardId: "CONSISTENT_DISCLAIMER_LANGUAGE",
    name: "Consistent Disclaimer Language",
    description:
      "All MITHQAL outputs must carry consistent disclaimer language (NOT PRODUCTION-AUTHORIZED, honest-state, no legal opinion, no investment advice).",
    currentState: "OPERATING_ENTITY_ACTIVE",
    requiredValue:
      "Consistent disclaimer on all outputs: NOT PRODUCTION-AUTHORIZED, no legal opinion, no investment advice, ILLUSTRATIVE/SIMULATED data labeled.",
    currentValue:
      "Per v25.3.2: all modules carry honest-state disclaimers (NOT PRODUCTION-AUTHORIZED). Per v25.3.5: MTQ definition carries 12 isNotStatements. Per v25.3.11: bank value model carries 4 evidence status labels (SIMULATED/ILLUSTRATIVE/VALIDATED/INSTITUTIONALLY_VERIFIED).",
    isHonest: true,
    honestNote:
      "Disclaimer language is ACTIVE in machine-readable modules. Website disclaimer language must be made consistent with the canonical modules.",
  },
];

// === CRITICAL RULE: Never invent a legal entity ===
export const NEVER_INVENT_RULE = {
  rule: "Per PROMPT 29: 'Never invent a legal entity, domain, address or regulatory status.'",
  pendingEntityIdentity:
    "Until the contracting entity is legally finalized, use an explicit PENDING_ENTITY_IDENTITY state rather than pretending the final structure exists.",
  currentBlueprintIssue:
    "Per PROMPT 29: 'The current blueprint still exposes personal email/contact presentation and the current operating entity as JOZOUR LLC, so this must be resolved deliberately rather than silently.'",
  resolution:
    "The operating entity (Jozour, LLC) is ACTIVE (per JOZOUR Amendment). The contracting entity (MITHQAL Foundation Inc.) is PENDING (to be formed per §1.6). All identity standards that depend on the contracting entity are PENDING_ENTITY_IDENTITY. All identity standards that depend on the operating entity are OPERATING_ENTITY_ACTIVE. No identity is invented.",
};

// === Status ===
export const INSTITUTIONAL_IDENTITY_STATUS = "ACTIVE";
export const INSTITUTIONAL_IDENTITY_VERSION = "v25.3.18-W1-1.0";
export const INSTITUTIONAL_IDENTITY_SOURCE = "src/lib/institutional-external-identity.ts";
export const PRESENCE_STANDARD_COUNT = 8;
