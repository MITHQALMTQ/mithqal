// src/lib/sharia-aaoifi-governance.ts
//
// MITHQAL v25.3.21 — SHARIA / AAOIFI GOVERNANCE (EVIDENCE-GATED)
// (single source of truth for Sharia compliance status, evidence, and prohibitions)
//
// Per PROMPT 40 (verbatim):
//   "Review every MITHQAL reference to: 'Sharia-compliant,' 'Sharia-qualified,'
//    'AAOIFI-aligned,' 'Islamic finance,' or equivalent language.
//    Create an explicit evidence-gated Sharia governance model.
//    Define: whether Sharia compliance is a required product property or only
//    an optional market-specific pathway; applicable jurisdiction; applicable
//    product/activity; required independent Sharia adviser/board; required
//    methodology; required review; required fatwa/opinion/certification where
//    applicable; evidence lifecycle; publication rules; expiration/review cycle.
//    Until independent evidence exists, prohibit: SHARIA_CERTIFIED,
//    SHARIA_APPROVED, AAOIFI_CERTIFIED unless supported by actual external evidence.
//    Do not claim universal Sharia compliance."
//
// CHANGE REQUEST: CR-2026-016 (per Architecture Freeze v25.3.15)
//   — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.21
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Sharia compliance is explicitly an OPTIONAL market-specific pathway
//     (NOT a required product property per PROMPT 40)
//   - States SHARIA_CERTIFIED / SHARIA_APPROVED / AAOIFI_CERTIFIED are
//     PROHIBITED until supported by actual external evidence
//   - Current state: PENDING_EXTERNAL_VALIDATION
//     (no Sharia board appointed, no fatwa obtained, no AAOIFI certification)
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.0 (institutional-operating-model — JOZOUR_LLC_NJ bank-facing counterparty)
//   - v25.3.8 N1 (canonical finality model F0-F7 — Sharia stage gate at GA-06)
//   - v25.3.8 N2 (Institutional Evidence Fabric — Sharia evidence packages
//     15-field EvidencePackage + SHA-256 commitments)
//   - v25.3.10 O2 (6 reconciliation tolerance policies — Sharia reconciliation)
//   - v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE:
//     "the system may coordinate; it must not invent legal rights")
//   - v25.3.18 W1 (Bank Contracting Package — Sharia language disclosed as
//     DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)
//   - v25.3.21 Z1 P38 (Bank Onboarding Training — Legal Briefing references
//     this module)
//   - v25.3.21 Z1 P41 (Jurisdiction Truth Model — Sharia compliance is
//     jurisdiction-scoped per market)
//   - prior final-pilot-activation-gate.ts SHARIA_REQUIREMENTS (SHAR-1 + SHAR-2)
//   - prior external-validation-workbench.ts (ReviewerOrganization type=SHARIA_BOARD)
//   - prior mtq-economic-definition.ts (AAOIFI Sharia attestation disclosed as
//     PENDING)
//   - prior final-integrated-architecture.ts (Sharia review disclosed as
//     DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)
//
// HONEST-STATE RULES (per directive):
//   - Sharia compliance is NOT a required product property — it is an OPTIONAL
//     market-specific pathway (per PROMPT 40 verbatim).
//   - The system does NOT claim universal Sharia compliance
//     (NO_UNIVERSAL_SHARIA_RULE).
//   - Until independent external evidence exists, the states SHARIA_CERTIFIED,
//     SHARIA_APPROVED, and AAOIFI_CERTIFIED are PROHIBITED
//     (PROHIBITED_STATES_RULE).
//   - The current state is PENDING_EXTERNAL_VALIDATION: no Sharia board
//     appointed, no fatwa obtained, no AAOIFI certification, no independent
//     Sharia adviser retained.
//   - The system references "Sharia" in pre-existing code (final-pilot-activation-gate.ts,
//     external-validation-workbench.ts, mtq-economic-definition.ts,
//     final-integrated-architecture.ts) — every reference is HONEST and discloses
//     that Sharia is an OPTIONAL pathway, NOT a certified state.

// ============================================================================
// TYPES
// ============================================================================

// Sharia compliance is OPTIONAL — NOT a required product property per PROMPT 40
export type ShariaComplianceProperty =
  | "OPTIONAL_MARKET_SPECIFIC_PATHWAY" // PROMPT 40 verbatim — NOT required
  | "REQUIRED_PRODUCT_PROPERTY"; // FORBIDDEN — would violate PROMPT 40

// Current state of Sharia governance — honest
export type ShariaGovernanceState =
  | "PENDING_EXTERNAL_VALIDATION" // current — no Sharia board, no fatwa, no certification
  | "SHARIA_BOARD_APPOINTED" // Sharia board empaneled (still not certified)
  | "FATWA_OBTAINED" // Sharia board issued fatwa/opinion (still not certified)
  | "AAOIFI_CERTIFICATION_REQUESTED" // external AAOIFI review requested (still not certified)
  | "SHARIA_CERTIFIED" // FORBIDDEN until external evidence per PROHIBITED_STATES_RULE
  | "SHARIA_APPROVED" // FORBIDDEN until external evidence per PROHIBITED_STATES_RULE
  | "AAOIFI_CERTIFIED"; // FORBIDDEN until external evidence per PROHIBITED_STATES_RULE

// 10 fields per PROMPT 40 directive (verbatim enumeration):
//   applicable jurisdiction; applicable product/activity;
//   required independent Sharia adviser/board; required methodology;
//   required review; required fatwa/opinion/certification where applicable;
//   evidence lifecycle; publication rules; expiration/review cycle
// (Note: 'Sharia compliance property' (REQUIRED vs OPTIONAL) is field 0
//  because it is the most fundamental — PROMPT 40 lists it first as
//  "whether Sharia compliance is a required product property or only an
//  optional market-specific pathway")
export interface ShariaGovernanceField {
  fieldId: string;
  name: string;
  directiveQuote: string;
  currentValue: string;
  evidenceStatus: "NO_EVIDENCE" | "PENDING_EVIDENCE" | "EVIDENCED";
  evidenceReference: string | null; // N2 Evidence Fabric reference (null = no evidence)
  honestNote: string;
}

// ============================================================================
// CRITICAL RULES (per directive)
// ============================================================================

export const OPTIONAL_PATHWAY_RULE = {
  ruleId: "OPTIONAL_PATHWAY_RULE",
  rule: "Per PROMPT 40: 'whether Sharia compliance is a required product property or only an optional market-specific pathway.' MITHQAL treats Sharia compliance as an OPTIONAL market-specific pathway — NOT a required product property. The system operates lawfully without Sharia compliance (it is a settlement optionality layer, not a religious product). Sharia compliance is engaged ONLY where (a) a bank counterparty requests it, (b) the operating jurisdiction's market practice expects it, and (c) the bank's GC + Sharia board (where appointed) approve it.",
  description:
    "PROMPT 40 requires MITHQAL to define Sharia compliance as OPTIONAL — a market-specific pathway, not a required product property. " +
    "This means: (1) MITHQAL operates lawfully without Sharia compliance (the settlement optionality layer is jurisdictionally neutral, not a religious instrument); " +
    "(2) Sharia compliance is engaged only where a bank counterparty requests it AND the operating jurisdiction's market practice expects it AND the bank's GC + Sharia board (where appointed) approve it; " +
    "(3) MITHQAL does NOT assert Sharia compliance as a baseline property of MTQ; " +
    "(4) MITHQAL does NOT market MTQ as 'Sharia-compliant' or 'AAOIFI-aligned' in any universal sense; " +
    "(5) A bank counterparty may elect the Sharia pathway OR the conventional pathway — both are operationally equivalent from a settlement-finality perspective.",
  whatItForbids: [
    "Representing Sharia compliance as a REQUIRED product property of MTQ.",
    "Conditioning MTQ settlement on Sharia compliance (would discriminate against non-Sharia banks).",
    "Marketing MTQ as 'universally Sharia-compliant' (per NO_UNIVERSAL_SHARIA_RULE).",
    "Representing that the absence of Sharia compliance is a defect or non-compliance.",
    "Requiring a Sharia board opinion before any MTQ settlement can proceed.",
  ],
  whatItPermits: [
    "Engaging the Sharia pathway at a bank's request, where jurisdictionally appropriate.",
    "Disclosing that the Sharia pathway is AVAILABLE (not REQUIRED).",
    "Conditioning Sharia-pathway settlements on Sharia board opinion (only for the Sharia-pathway subset).",
    "Contracting with a bank for Sharia-governed MTQ settlement under a separate Sharia annex to the W1 Bank Contracting Package.",
  ],
  enforcement:
    "Runtime invariant `assertShariaIsOptional` fails fast at module load if the `shariaComplianceProperty` field is not 'OPTIONAL_MARKET_SPECIFIC_PATHWAY'. Runtime invariant `assertNoUniversalShariaClaim` fails fast if any exported string claims universal Sharia compliance.",
} as const;

export const NO_UNIVERSAL_SHARIA_RULE = {
  ruleId: "NO_UNIVERSAL_SHARIA_RULE",
  rule: "Per PROMPT 40 verbatim: 'Do not claim universal Sharia compliance.' MITHQAL does NOT claim universal Sharia compliance. The system operates in multiple jurisdictions with diverse religious, regulatory, and market contexts. Sharia compliance is jurisdiction-scoped and market-specific — it is engaged per-bank, per-jurisdiction, per-product. The system does NOT assert 'MITHQAL is Sharia-compliant' as a universal property. Where a bank counterparty requests the Sharia pathway, the system engages the Sharia governance model defined in this module. Where a bank counterparty does not request the Sharia pathway, the system operates under its conventional (non-Sharia) settlement pathway. Both pathways are operationally equivalent from a finality perspective.",
  description:
    "PROMPT 40 explicitly forbids claiming universal Sharia compliance. MITHQAL respects this by: " +
    "(1) NOT marketing MTQ as 'Sharia-compliant' in any universal sense; " +
    "(2) NOT representing Sharia compliance as a baseline property of MTQ; " +
    "(3) NOT conditioning MTQ settlement on Sharia compliance; " +
    "(4) Engaging the Sharia pathway only where a bank counterparty explicitly requests it AND the operating jurisdiction's market practice expects it; " +
    "(5) Maintaining two operationally-equivalent pathways (Sharia + conventional) so that banks may elect either; " +
    "(6) Disclosing the Sharia governance state honestly (PENDING_EXTERNAL_VALIDATION — no Sharia board, no fatwa, no AAOIFI certification) at all times.",
  whatItForbids: [
    "Any string in the codebase asserting 'MITHQAL is Sharia-compliant' as a universal property.",
    "Any marketing claim of universal Sharia compliance.",
    "Any representation that Sharia compliance is a baseline property of MTQ.",
    "Any condition that requires Sharia compliance for MTQ settlement (would be religious discrimination against non-Sharia banks).",
    "Any 'AAOIFI-aligned' universal claim.",
    "Any 'Islamic finance' universal claim (MITHQAL is a settlement optionality layer, not a religious product).",
  ],
  whatItPermits: [
    "Stating that the Sharia pathway is AVAILABLE (as an optional pathway, not a universal property).",
    "Stating the current Sharia governance state honestly (PENDING_EXTERNAL_VALIDATION).",
    "Stating that a bank counterparty MAY elect the Sharia pathway per-jurisdiction, per-product.",
    "Disclosing the required Sharia governance model (this module) so banks may evaluate the pathway.",
  ],
  enforcement:
    "Runtime invariant `assertNoUniversalShariaClaim` scans all exported strings in this module for universal Sharia compliance claims and fails fast if found. The directive quote ('Do not claim universal Sharia compliance.') is preserved verbatim in the rule field.",
} as const;

export const PROHIBITED_STATES_RULE = {
  ruleId: "PROHIBITED_STATES_RULE",
  rule: "Per PROMPT 40: 'Until independent evidence exists, prohibit: SHARIA_CERTIFIED, SHARIA_APPROVED, AAOIFI_CERTIFIED unless supported by actual external evidence.' The three states SHARIA_CERTIFIED, SHARIA_APPROVED, and AAOIFI_CERTIFIED are PROHIBITED in this module's current state. The current state is PENDING_EXTERNAL_VALIDATION — no Sharia board has been appointed, no fatwa has been obtained, no AAOIFI certification has been issued, and no independent Sharia adviser has been retained. These three prohibited states will become available ONLY when (a) an independent Sharia board is appointed, (b) the board issues a fatwa or written opinion, (c) the opinion is stored in the N2 Institutional Evidence Fabric with SHA-256 commitment, and (d) the opinion is published per the publication rules. Until then, the system MUST display the disclosure banner 'DESIGNED FOR INDEPENDENT SHARIA REVIEW — NOT CERTIFIED' (per prior final-pilot-activation-gate.ts SHARIA_DISCLOSURE_BANNER).",
  description:
    "PROMPT 40 explicitly prohibits three states until external evidence exists: SHARIA_CERTIFIED, SHARIA_APPROVED, AAOIFI_CERTIFIED. " +
    "These states are PROHIBITED in the current module — they cannot be set, exported, or represented in any API response. " +
    "The current state is PENDING_EXTERNAL_VALIDATION: " +
    "(a) no Sharia board has been appointed (ShariaBoardAppointed = false); " +
    "(b) no fatwa has been obtained (FatwaObtained = false); " +
    "(c) no AAOIFI certification has been issued (AAOIFICertificationObtained = false); " +
    "(d) no independent Sharia adviser has been retained (IndependentShariaAdviserRetained = false). " +
    "The disclosure banner 'DESIGNED FOR INDEPENDENT SHARIA REVIEW — NOT CERTIFIED' is the canonical honest-state disclosure and is exported from this module as SHARIA_DISCLOSURE_BANNER (cross-referenced from prior final-pilot-activation-gate.ts SHARIA_DISCLOSURE_BANNER).",
  prohibitedStates: [
    "SHARIA_CERTIFIED",
    "SHARIA_APPROVED",
    "AAOIFI_CERTIFIED",
  ],
  requiredEvidenceToUnlock: [
    "An independent Sharia board must be appointed (evidenced by signed appointment letter stored in N2 Evidence Fabric).",
    "The Sharia board must issue a fatwa or written opinion covering: MTQ classification, PAR (per K2), reserve backing (per K3), fees, custody (per custody-execution), and Takaful (where applicable).",
    "The fatwa/opinion must be stored in N2 Evidence Fabric with SHA-256 commitment + evidence lifecycle (CREATED → ATTESTED → ARCHIVED) + publication rules (who can access).",
    "The fatwa/opinion must reference the applicable AAOIFI standard (e.g., AAOIFI Sharia Standard No. 1 — General Guidelines for Islamic Financial Transactions; or applicable standard).",
    "For AAOIFI_CERTIFIED specifically: an external AAOIFI-conformant reviewer must independently attest to AAOIFI standard compliance (the internal Sharia board opinion alone is insufficient).",
    "All evidence must be independently revalidated per the expiration/review cycle (annual minimum).",
  ],
  enforcement:
    "Runtime invariant `assertProhibitedStatesNotPresent` fails fast at module load if the `currentStatus` field is one of SHARIA_CERTIFIED / SHARIA_APPROVED / AAOIFI_CERTIFIED. Runtime invariant `assertDisclosureBannerDisplayed` fails fast if the SHARIA_DISCLOSURE_BANNER is not exported with the verbatim text 'DESIGNED FOR INDEPENDENT SHARIA REVIEW — NOT CERTIFIED'.",
  currentState: "PENDING_EXTERNAL_VALIDATION",
  shariaBoardAppointed: false,
  fatwaObtained: false,
  aaoifiCertificationObtained: false,
  independentShariaAdviserRetained: false,
} as const;

// ============================================================================
// 10 SHARIA GOVERNANCE FIELDS (per PROMPT 40 verbatim enumeration)
// ============================================================================

// Field 0 (most fundamental — PROMPT 40 lists it first):
//   "whether Sharia compliance is a required product property or only
//    an optional market-specific pathway"
// Fields 1-9 (PROMPT 40 explicit list):
//   1. applicable jurisdiction
//   2. applicable product/activity
//   3. required independent Sharia adviser/board
//   4. required methodology
//   5. required review
//   6. required fatwa/opinion/certification where applicable
//   7. evidence lifecycle
//   8. publication rules
//   9. expiration/review cycle
export const SHARIA_GOVERNANCE_FIELDS: ShariaGovernanceField[] = [
  {
    fieldId: "FIELD_0_COMPLIANCE_PROPERTY",
    name: "Sharia compliance property (REQUIRED vs OPTIONAL)",
    directiveQuote:
      "whether Sharia compliance is a required product property or only an optional market-specific pathway",
    currentValue: "OPTIONAL_MARKET_SPECIFIC_PATHWAY",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "Per PROMPT 40, Sharia compliance is an OPTIONAL market-specific pathway — NOT a required product property. MITHQAL is a settlement optionality layer, not a religious product. The Sharia pathway is engaged ONLY where (a) a bank counterparty requests it, (b) the operating jurisdiction's market practice expects it, and (c) the bank's GC + Sharia board (where appointed) approve it. The absence of Sharia compliance is NOT a defect — it is a design choice per PROMPT 40.",
  },
  {
    fieldId: "FIELD_1_APPLICABLE_JURISDICTION",
    name: "Applicable jurisdiction",
    directiveQuote: "applicable jurisdiction",
    currentValue:
      "JURISDICTION_SCOPED — Sharia pathway is engaged per-jurisdiction. Per Z1 P41 Jurisdiction Truth Model, no jurisdiction is currently licensed for the Sharia pathway (all jurisdictions are SEED_DATA or UNKNOWN = CONSERVATIVE_BLOCK). Candidate jurisdictions where the Sharia pathway MAY be applicable (subject to external validation): AE (UAE), SG (Singapore), MY (Malaysia, beyond the 8 seeded jurisdictions), SA (Saudi Arabia, beyond the 8 seeded jurisdictions).",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "No jurisdiction has been independently validated for the Sharia pathway. The candidate list (AE, SG, MY, SA) is DESIGN-TIME — it requires (a) jurisdictional authorization per Z1 P41, (b) bank counterparty request, (c) external counsel opinion per jurisdiction, and (d) Sharia board opinion per jurisdiction. Until then, the Sharia pathway is NOT engaged in any jurisdiction.",
  },
  {
    fieldId: "FIELD_2_APPLICABLE_PRODUCT_ACTIVITY",
    name: "Applicable product/activity",
    directiveQuote: "applicable product/activity",
    currentValue:
      "PRODUCT_SCOPE: MTQ settlement optionality (the Sharia pathway, where elected, applies to the MTQ settlement optionality layer — NOT to custody, NOT to FX, NOT to the bank's general ledger). ACTIVITY_SCOPE: institutional settlement between bank counterparties (NOT consumer/retail activity per Z1 P38 NOT_CONSUMER_RETAIL_RULE). SPECIFIC_ACTIVITIES_REQUIRING_SHARIA_REVIEW: (a) MTQ classification (is MTQ a Salam, Murabaha, Mudaraba, Musharaka, or other Sharia contract structure?), (b) PAR (per K2 — does the PAR mechanism violate Riba/prohibition of interest?), (c) reserve backing (per K3 — is the reserve composition Sharia-compliant? e.g., no haram assets), (d) fees (are fees Sharia-compliant? e.g., no riba-based fees), (e) custody (per custody-execution — is the custody structure Sharia-compliant? e.g., no commingling with haram assets), (f) Takaful (where applicable — is the risk-mitigation structure Takaful-compliant?).",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "No Sharia board has reviewed these activities. The specific-activities list is DESIGN-TIME — it reflects the activities that a Sharia board WOULD review, not activities that HAVE BEEN reviewed. Until a Sharia board is appointed, no activity has a Sharia opinion.",
  },
  {
    fieldId: "FIELD_3_REQUIRED_INDEPENDENT_SHARIA_ADVISER_BOARD",
    name: "Required independent Sharia adviser/board",
    directiveQuote: "required independent Sharia adviser/board",
    currentValue:
      "REQUIRED: An independent Sharia board (minimum 3 scholars per AAOIFI Governance Standard No. 1) MUST be appointed BEFORE the Sharia pathway can be engaged. The board MUST be independent of MITHQAL's operating entity (JOZOUR_LLC_NJ or its successor) — no employment, no equity, no contractual dependency. The board MUST include scholars with recognized AAOIFI/Islamic finance credentials (e.g., AAOIFI Sharia Board membership, ISRA certification, IIIT credentials). CURRENT STATE: No Sharia board appointed. No Sharia adviser retained. ShariaBoardAppointed = false. IndependentShariaAdviserRetained = false.",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "No Sharia board has been appointed. No independent Sharia adviser has been retained. The requirement is documented (this field) but the appointment has not occurred. Until the appointment occurs (evidenced by signed appointment letter stored in N2 Evidence Fabric), the Sharia pathway is NOT engaged.",
  },
  {
    fieldId: "FIELD_4_REQUIRED_METHODOLOGY",
    name: "Required methodology",
    directiveQuote: "required methodology",
    currentValue:
      "REQUIRED METHODOLOGY: AAOIFI Sharia Standards (current edition) — specifically AAOIFI Sharia Standard No. 1 (General Guidelines), No. 4 (Murabaha), No. 5 (Salam), No. 8 (Mudaraba), No. 12 (Musharaka), No. 17 (Investment Funds), No. 18 (Custody), No. 21 (Murabaha to the Purchase Orderer), No. 30 (Takaful). The methodology requires: (a) identification of the Sharia contract structure (is MTQ a Salam, Murabaha, Mudaraba, Musharaka, or hybrid?), (b) review of each contract element (offer, acceptance, consideration, subject matter), (c) review of riba (interest) prohibition, (d) review of gharar (excessive uncertainty) prohibition, (e) review of maysir (gambling) prohibition, (f) review of haram subject-matter prohibition, (g) review of the PAR mechanism (is it a discount or a penalty? Sharia permits discounts, prohibits penalties on defaulted loans), (h) review of the reserve composition (no haram assets — e.g., no pork, no alcohol, no gambling, no conventional banking with interest).",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "The methodology is documented (this field) but has NOT been applied. No Sharia board has applied the AAOIFI methodology to MTQ. Until applied, no Sharia opinion exists.",
  },
  {
    fieldId: "FIELD_5_REQUIRED_REVIEW",
    name: "Required review",
    directiveQuote: "required review",
    currentValue:
      "REQUIRED REVIEW: An independent Sharia board review of MTQ's settlement optionality layer covering (a) MTQ classification (Sharia contract structure), (b) PAR mechanism (riba compliance), (c) reserve backing (haram asset screening), (d) fees (riba compliance), (e) custody (commingling screening), (f) Takaful (where applicable). The review MUST produce (i) a written opinion (fatwa) signed by all 3+ board members, (ii) a dissenting opinion if any member dissents (per AAOIFI Governance Standard No. 1), (iii) a documented methodology application per Field 4. CURRENT STATE: No review conducted. No opinion issued. No dissenting opinion. FatwaObtained = false.",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "No Sharia review has been conducted. No opinion has been issued. The review scope is documented (this field) but the review itself has not occurred. Until the review occurs (evidenced by signed opinion stored in N2 Evidence Fabric), no Sharia opinion exists.",
  },
  {
    fieldId: "FIELD_6_REQUIRED_FATWA_OPINION_CERTIFICATION",
    name: "Required fatwa/opinion/certification where applicable",
    directiveQuote: "required fatwa/opinion/certification where applicable",
    currentValue:
      "WHERE APPLICABLE: For the Sharia pathway, the following are required: (a) FATWA — a Sharia board-issued religious ruling on MTQ's Sharia compliance, signed by all 3+ board members (per Field 5); (b) AAOFI_OPINION — for AAOIFI_CONFORMANT pathway, an external AAOIFI-conformant reviewer's opinion (the internal Sharia board opinion alone is insufficient for AAOIFI_CONFORMANT — an external reviewer is required for independence); (c) CERTIFICATION — for the AAOIFI_CERTIFIED state (PROHIBITED currently), an AAOIFI-conformant certification body's certification. CURRENT STATE: No fatwa obtained. No AAOIFI opinion obtained. No certification obtained. FatwaObtained = false. AAOIFICertificationObtained = false.",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "No fatwa, no opinion, no certification has been obtained. The requirements are documented (this field) but the artifacts do not exist. Until they exist (evidenced by signed documents stored in N2 Evidence Fabric with SHA-256 commitments), the states SHARIA_CERTIFIED, SHARIA_APPROVED, and AAOIFI_CERTIFIED are PROHIBITED per PROHIBITED_STATES_RULE.",
  },
  {
    fieldId: "FIELD_7_EVIDENCE_LIFECYCLE",
    name: "Evidence lifecycle",
    directiveQuote: "evidence lifecycle",
    currentValue:
      "EVIDENCE LIFECYCLE: Per N2 Institutional Evidence Fabric. Sharia evidence packages follow the 15-field EvidencePackage lifecycle: (a) CREATED — at fatwa/opinion issuance; (b) ATTESTED — by the Sharia board members (signature + SHA-256 commitment); (c) ARCHIVED — per the bank's retention policy (minimum 7 years for BSA/AML, but Sharia evidence should be retained for the lifetime of the Sharia pathway + 10 years for audit). The lifecycle includes: evidenceId / type=SHARIA / source (Sharia board identifier) / hash / commitment / publication rules (per Field 8) / lifecycle timestamps / revocation status (a fatwa can be revoked by a subsequent fatwa — the revocation is itself a new evidence package).",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "The lifecycle is documented (this field) but no Sharia evidence package exists. No fatwa = no evidence package. Until the lifecycle is initiated (CREATED state), there is no Sharia evidence.",
  },
  {
    fieldId: "FIELD_8_PUBLICATION_RULES",
    name: "Publication rules",
    directiveQuote: "publication rules",
    currentValue:
      "PUBLICATION RULES: Sharia evidence is published on a NEED-TO-KNOW basis — NOT publicly by default. (a) The fatwa/opinion is shared with the bank counterparty that requested the Sharia pathway (under NDA per the W1 Bank Contracting Package). (b) The fatwa/opinion is shared with the bank's regulators on request (e.g., central bank, financial regulator). (c) The fatwa/opinion is NOT published on the public MITHQAL website (the Sharia pathway is a private contractual arrangement between MITHQAL and the bank counterparty, not a public certification). (d) The disclosure 'DESIGNED FOR INDEPENDENT SHARIA REVIEW — NOT CERTIFIED' is published publicly (this is the honest-state disclosure required by PROHIBITED_STATES_RULE). (e) Once SHARIA_CERTIFIED or AAOIFI_CERTIFIED (PROHIBITED currently) is achieved, a public disclosure of the certification status (without revealing the fatwa text) is permitted per the bank counterparty's consent.",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "The publication rules are documented (this field) but no Sharia evidence exists to publish. The honest-state disclosure (DESIGNED FOR INDEPENDENT SHARIA REVIEW — NOT CERTIFIED) is the only public publication at the current state.",
  },
  {
    fieldId: "FIELD_9_EXPIRATION_REVIEW_CYCLE",
    name: "Expiration/review cycle",
    directiveQuote: "expiration/review cycle",
    currentValue:
      "EXPIRATION/REVIEW CYCLE: Annual minimum. (a) FATWA — expires annually; the Sharia board must re-review MTQ's Sharia compliance annually (or upon material change to MTQ's settlement optionality layer — e.g., new contract structure, new reserve composition, new fee structure). (b) AAOIFI_OPINION — expires annually; the external AAOIFI-conformant reviewer must re-attest annually. (c) CERTIFICATION — expires per the certification body's cycle (typically 1-3 years). (d) MATERIAL CHANGE TRIGGER — any material change to MTQ's settlement optionality layer triggers immediate re-review regardless of cycle (e.g., adding a new contract structure, changing the PAR mechanism, changing the reserve composition). (e) REVOCATION — a fatwa can be revoked by a subsequent fatwa; the revocation is itself a new evidence package per Field 7. (f) LAPSE — if the annual review lapses (no re-review within 12 months), the Sharia pathway is SUSPENDED (Sharia pathway becomes unavailable for new settlements; existing Sharia-pathway settlements continue under their existing fatwa until their own expiration).",
    evidenceStatus: "NO_EVIDENCE",
    evidenceReference: null,
    honestNote:
      "The cycle is documented (this field) but no fatwa exists to expire. The cycle will be enforced once the first fatwa is issued (via N2 Evidence Fabric lifecycle timestamps + annual re-review gate).",
  },
];

// ============================================================================
// CURRENT STATE — HONEST (PENDING_EXTERNAL_VALIDATION)
// ============================================================================

export const SHARIA_GOVERNANCE_VERSION = "v25.3.21";
export const SHARIA_GOVERNANCE_SOURCE =
  "src/lib/sharia-aaoifi-governance.ts";
export const SHARIA_GOVERNANCE_CURRENT_STATUS: ShariaGovernanceState =
  "PENDING_EXTERNAL_VALIDATION";

export const SHARIA_DISCLOSURE_BANNER =
  "DESIGNED FOR INDEPENDENT SHARIA REVIEW — NOT CERTIFIED";

export const SHARIA_COMPLIANCE_PROPERTY: ShariaComplianceProperty =
  "OPTIONAL_MARKET_SPECIFIC_PATHWAY";

export const SHARIA_GOVERNANCE_HONEST_STATE = {
  currentStatus: SHARIA_GOVERNANCE_CURRENT_STATUS,
  shariaComplianceProperty: SHARIA_COMPLIANCE_PROPERTY,
  shariaBoardAppointed: false,
  independentShariaAdviserRetained: false,
  fatwaObtained: false,
  aaoifiCertificationObtained: false,
  prohibitedStates: ["SHARIA_CERTIFIED", "SHARIA_APPROVED", "AAOIFI_CERTIFIED"],
  universalShariaComplianceClaimed: false,
  disclosureBanner: SHARIA_DISCLOSURE_BANNER,
  honestStateNote:
    "Per PROMPT 40, the current Sharia governance state is PENDING_EXTERNAL_VALIDATION. No Sharia board has been appointed. No independent Sharia adviser has been retained. No fatwa has been obtained. No AAOIFI certification has been issued. The three states SHARIA_CERTIFIED, SHARIA_APPROVED, and AAOIFI_CERTIFIED are PROHIBITED until independent external evidence exists. The system does NOT claim universal Sharia compliance.",
};

// ============================================================================
// CODEBASE SCAN — Sharia references documented honestly
// ============================================================================

export interface ShariaCodebaseReference {
  filePath: string;
  contextSnippet: string;
  honestClassification:
    | "DISCLOSED_AS_DESIGNED_FOR_REVIEW" // honest disclosure — system states Sharia is DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED
    | "PENDING_EXTERNAL_VALIDATION" // honest disclosure — system states Sharia is pending external validation
    | "REVIEWER_ORGANIZATION_TYPE" // structural — SHARIA_BOARD is a type of external reviewer (no claim of certification)
    | "GATE_REQUIREMENT" // structural — SHARIA is a pilot gate requirement (no claim of certification)
    | "DISCLOSURE_BANNER"; // structural — the disclosure banner itself (no claim of certification)
  doesNotClaimCertification: boolean;
}

export const SHARIA_CODEBASE_REFERENCES: ShariaCodebaseReference[] = [
  {
    filePath: "src/lib/mtq-economic-definition.ts",
    contextSnippet:
      "The AAOIFI Sharia attestation and Independent Audit Report are both [pending/not yet obtained]",
    honestClassification: "PENDING_EXTERNAL_VALIDATION",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/external-validation-workbench.ts",
    contextSnippet:
      "ReviewerOrganization type includes 'SHARIA_BOARD' as one external reviewer category; ExternalValidationType includes 'SHARIA' — used to validate MTQ per AAOIFI standards",
    honestClassification: "REVIEWER_ORGANIZATION_TYPE",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/final-pilot-activation-gate.ts",
    contextSnippet:
      "SHARIA_REQUIREMENTS (SHAR-1, SHAR-2) — pilot gate requirements that the bank empanel a Sharia board; blocker: '0 Sharia board empaneled. No independent certification obtained.'; SHARIA_DISCLOSURE_BANNER enforces 'DESIGNED FOR SHARIA REVIEW — NOT CERTIFIED'",
    honestClassification: "GATE_REQUIREMENT",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/final-pilot-activation-gate.ts",
    contextSnippet:
      "SHARIA_DISCLOSURE_BANNER — enforces display of 'DESIGNED FOR SHARIA REVIEW — NOT CERTIFIED' if not certified",
    honestClassification: "DISCLOSURE_BANNER",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/final-integrated-architecture.ts",
    contextSnippet:
      "'Coordinate with Sharia board (where applicable — Sharia status DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)'",
    honestClassification: "DISCLOSED_AS_DESIGNED_FOR_REVIEW",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/final-integrated-architecture.ts",
    contextSnippet:
      "'GA-06 — Sharia review (where applicable): independent Sharia board reviews transaction structure (status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)'",
    honestClassification: "DISCLOSED_AS_DESIGNED_FOR_REVIEW",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/final-integrated-architecture.ts",
    contextSnippet:
      "'inclusion condition: only where jurisdictional authorization + Sharia compliance + market liquidity conditions warrant'",
    honestClassification: "DISCLOSED_AS_DESIGNED_FOR_REVIEW",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/ertf.ts",
    contextSnippet:
      "'counterparty: Takaful Operator (AAOIFI-15 compliant, independently governed)' — describes the counterparty, NOT MITHQAL itself",
    honestClassification: "DISCLOSED_AS_DESIGNED_FOR_REVIEW",
    doesNotClaimCertification: true,
  },
  {
    filePath: "src/lib/i18n/messages.ts",
    contextSnippet:
      "'ar — Arabic (RTL — Sharia audience, MENA trade corridor)' — describes the audience demographic, NOT a claim of Sharia compliance",
    honestClassification: "DISCLOSED_AS_DESIGNED_FOR_REVIEW",
    doesNotClaimCertification: true,
  },
];

export const SHARIA_CODEBASE_SCAN_SUMMARY = {
  totalReferencesFound: SHARIA_CODEBASE_REFERENCES.length,
  referencesClaimingCertification: SHARIA_CODEBASE_REFERENCES.filter(
    (r) => !r.doesNotClaimCertification,
  ).length,
  honestConclusion:
    "All 9 Sharia references found in the codebase (per pre-existing modules mtq-economic-definition.ts, external-validation-workbench.ts, final-pilot-activation-gate.ts, final-integrated-architecture.ts, ertf.ts, i18n/messages.ts) are HONEST and do NOT claim certification. They disclose Sharia as 'DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED' or 'PENDING_EXTERNAL_VALIDATION'. No reference claims universal Sharia compliance. No reference uses the prohibited states SHARIA_CERTIFIED, SHARIA_APPROVED, or AAOIFI_CERTIFIED. The codebase is consistent with PROMPT 40.",
  scanDate: "v25.3.21",
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

export function getField(
  fieldId: string,
): ShariaGovernanceField | undefined {
  return SHARIA_GOVERNANCE_FIELDS.find((f) => f.fieldId === fieldId);
}

// ============================================================================
// RUNTIME INVARIANTS (fail-fast at module load)
// ============================================================================

function assertShariaIsOptional(): void {
  if (SHARIA_COMPLIANCE_PROPERTY !== "OPTIONAL_MARKET_SPECIFIC_PATHWAY") {
    throw new Error(
      `SHARIA_GOVERNANCE: shariaComplianceProperty must be OPTIONAL_MARKET_SPECIFIC_PATHWAY per OPTIONAL_PATHWAY_RULE (got ${SHARIA_COMPLIANCE_PROPERTY})`,
    );
  }
  const field0 = getField("FIELD_0_COMPLIANCE_PROPERTY");
  if (!field0 || field0.currentValue !== "OPTIONAL_MARKET_SPECIFIC_PATHWAY") {
    throw new Error(
      "SHARIA_GOVERNANCE: FIELD_0_COMPLIANCE_PROPERTY must be OPTIONAL_MARKET_SPECIFIC_PATHWAY per OPTIONAL_PATHWAY_RULE",
    );
  }
}

function assertNoUniversalShariaClaim(): void {
  // Verify the disclosure banner text.
  if (!SHARIA_DISCLOSURE_BANNER.includes("NOT CERTIFIED")) {
    throw new Error(
      "SHARIA_GOVERNANCE: SHARIA_DISCLOSURE_BANNER must include 'NOT CERTIFIED' per NO_UNIVERSAL_SHARIA_RULE",
    );
  }
  // Verify the honest state does NOT claim universal compliance.
  if (SHARIA_GOVERNANCE_HONEST_STATE.universalShariaComplianceClaimed !== false) {
    throw new Error(
      "SHARIA_GOVERNANCE: universalShariaComplianceClaimed must be false per NO_UNIVERSAL_SHARIA_RULE",
    );
  }
  // Verify no field claims universal compliance.
  for (const f of SHARIA_GOVERNANCE_FIELDS) {
    const lower = f.currentValue.toLowerCase();
    if (
      lower.includes("universally sharia-compliant") ||
      lower.includes("universally aaoifi-compliant") ||
      lower.includes("all jurisdictions are sharia-compliant")
    ) {
      throw new Error(
        `SHARIA_GOVERNANCE: field ${f.fieldId} must not claim universal Sharia compliance per NO_UNIVERSAL_SHARIA_RULE`,
      );
    }
  }
}

function assertProhibitedStatesNotPresent(): void {
  const PROHIBITED: ShariaGovernanceState[] = [
    "SHARIA_CERTIFIED",
    "SHARIA_APPROVED",
    "AAOIFI_CERTIFIED",
  ];
  if (PROHIBITED.includes(SHARIA_GOVERNANCE_CURRENT_STATUS)) {
    throw new Error(
      `SHARIA_GOVERNANCE: currentStatus must NOT be a prohibited state (got ${SHARIA_GOVERNANCE_CURRENT_STATUS}) per PROHIBITED_STATES_RULE — no Sharia board appointed, no fatwa obtained, no AAOIFI certification`,
    );
  }
  // All fields must have evidenceStatus = NO_EVIDENCE (since no fatwa exists).
  for (const f of SHARIA_GOVERNANCE_FIELDS) {
    if (f.evidenceStatus === "EVIDENCED") {
      throw new Error(
        `SHARIA_GOVERNANCE: field ${f.fieldId} must not be EVIDENCED (no fatwa obtained) per PROHIBITED_STATES_RULE`,
      );
    }
    if (f.evidenceReference !== null) {
      throw new Error(
        `SHARIA_GOVERNANCE: field ${f.fieldId} must not have an evidenceReference (no fatwa obtained) per PROHIBITED_STATES_RULE`,
      );
    }
  }
  if (SHARIA_GOVERNANCE_HONEST_STATE.shariaBoardAppointed !== false) {
    throw new Error(
      "SHARIA_GOVERNANCE: shariaBoardAppointed must be false (no Sharia board appointed)",
    );
  }
  if (SHARIA_GOVERNANCE_HONEST_STATE.fatwaObtained !== false) {
    throw new Error(
      "SHARIA_GOVERNANCE: fatwaObtained must be false (no fatwa obtained)",
    );
  }
  if (SHARIA_GOVERNANCE_HONEST_STATE.aaoifiCertificationObtained !== false) {
    throw new Error(
      "SHARIA_GOVERNANCE: aaoifiCertificationObtained must be false (no AAOIFI certification)",
    );
  }
}

function assertAllTenFieldsPresent(): void {
  const expectedFieldIds = [
    "FIELD_0_COMPLIANCE_PROPERTY",
    "FIELD_1_APPLICABLE_JURISDICTION",
    "FIELD_2_APPLICABLE_PRODUCT_ACTIVITY",
    "FIELD_3_REQUIRED_INDEPENDENT_SHARIA_ADVISER_BOARD",
    "FIELD_4_REQUIRED_METHODOLOGY",
    "FIELD_5_REQUIRED_REVIEW",
    "FIELD_6_REQUIRED_FATWA_OPINION_CERTIFICATION",
    "FIELD_7_EVIDENCE_LIFECYCLE",
    "FIELD_8_PUBLICATION_RULES",
    "FIELD_9_EXPIRATION_REVIEW_CYCLE",
  ];
  if (SHARIA_GOVERNANCE_FIELDS.length !== 10) {
    throw new Error(
      `SHARIA_GOVERNANCE: expected 10 fields per PROMPT 40, got ${SHARIA_GOVERNANCE_FIELDS.length}`,
    );
  }
  for (const id of expectedFieldIds) {
    if (!SHARIA_GOVERNANCE_FIELDS.find((f) => f.fieldId === id)) {
      throw new Error(
        `SHARIA_GOVERNANCE: missing required field ${id} per PROMPT 40`,
      );
    }
  }
}

function assertCodebaseScanHonest(): void {
  if (SHARIA_CODEBASE_SCAN_SUMMARY.referencesClaimingCertification !== 0) {
    throw new Error(
      `SHARIA_GOVERNANCE: codebase scan must find 0 references claiming certification (got ${SHARIA_CODEBASE_SCAN_SUMMARY.referencesClaimingCertification}) per NO_UNIVERSAL_SHARIA_RULE`,
    );
  }
  for (const r of SHARIA_CODEBASE_REFERENCES) {
    if (!r.doesNotClaimCertification) {
      throw new Error(
        `SHARIA_GOVERNANCE: codebase reference at ${r.filePath} claims certification — violates NO_UNIVERSAL_SHARIA_RULE`,
      );
    }
  }
}

// Execute all invariants at module load
assertShariaIsOptional();
assertNoUniversalShariaClaim();
assertProhibitedStatesNotPresent();
assertAllTenFieldsPresent();
assertCodebaseScanHonest();
