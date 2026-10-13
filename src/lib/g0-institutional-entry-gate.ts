/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — G0 INSTITUTIONAL ENTRY GATE PACKAGE (v25.3.2 FROZEN)
 * ════════════════════════════════════════════════════════════════════════
 *
 * GATE G0: CORPORATE / CONTRACTUAL INTEGRITY
 *
 * Objective: Determine whether MITHQAL has one legally coherent,
 * bank-facing institutional counterparty capable of entering an
 * institutional evaluation or pilot agreement.
 *
 * ARCHITECTURE IS FROZEN. This is a READ-ONLY audit. No new features.
 *
 * EVIDENCE CLASSIFICATIONS (6 — only these):
 *   VERIFIED_PRIMARY_DOCUMENT    — verified from an actual executed document in the repo
 *   EXECUTED_EXTERNAL_DOCUMENT   — an executed external document (government filing)
 *   INTERNAL_DESIGN              — designed in code/docs but not externally verified
 *   PENDING_PRIMARY_DOCUMENT     — the document should exist but hasn't been provided
 *   PENDING_LEGAL_REVIEW         — requires external legal counsel review
 *   UNKNOWN                      — status unknown
 *
 * CRITICAL HONEST FINDING:
 *   The code references "JOZOUR_LLC_NJ" (institutional-operating-model.ts) and
 *   "JOZOUR Amendment §1.6". However, NO executed Jozour instruments are
 *   present in the repository. No articles of incorporation, no operating
 *   agreement, no shareholder agreement, no executed amendments.
 *
 *   Per directive: "If the executed Jozour instruments are not present in
 *   the repository, mark them PRIMARY_DOCUMENT_MISSING. Do NOT invent their
 *   contents."
 *
 *   Do NOT infer legal status from the blueprint.
 *   Do NOT infer ownership from code.
 *   Do NOT infer authority from organizational diagrams.
 *   Do NOT treat a planned entity as an existing entity.
 *
 * NOT PRODUCTION-AUTHORIZED. Do NOT claim legal clearance.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type G0EvidenceClass =
  | "VERIFIED_PRIMARY_DOCUMENT"
  | "EXECUTED_EXTERNAL_DOCUMENT"
  | "INTERNAL_DESIGN"
  | "PENDING_PRIMARY_DOCUMENT"
  | "PENDING_LEGAL_REVIEW"
  | "UNKNOWN";

export type G0Decision = "G0_PASS" | "G0_CONDITIONAL" | "G0_FAIL";

export interface G0Item {
  itemId: string;
  label: string;
  description: string;
  evidenceClass: G0EvidenceClass;
  evidence: string;
  status: string;
  missingDocuments: string[];
  canonicalReference: string;
  owner: string;
}

export interface G0Report {
  gateId: string;
  gateLabel: string;
  objective: string;
  items: G0Item[];
  decision: G0Decision;
  decisionRationale: string;
  passCriteria: {
    coherentBankFacingEntity: boolean;
    clearAuthorityToContract: boolean;
    clearServiceLiabilityBoundaries: boolean;
    noUnresolvedMaterialContradiction: boolean;
    documentedTransitionFromInterim: boolean;
  };
  finalStatements: {
    whatIsLegallyEstablished: string[];
    whatIsOnlyDesigned: string[];
    whatRequiresCounsel: string[];
    whatDocumentsAreMissing: string[];
    whatMustBeDoneBeforeBankReview: string[];
  };
  honestState: {
    productionAuthorized: boolean;
    legalClearanceClaimed: boolean;
    architectureNotModified: boolean;
    noInferenceFromCode: boolean;
    noInferenceFromBlueprint: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Shared Constants                                                  */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T14:53:00Z";

/* ------------------------------------------------------------------ */
/*  16 G0 Items                                                        */
/* ------------------------------------------------------------------ */

export const G0_ITEMS: G0Item[] = [
  // ── 1. AUTHORITATIVE ENTITY REGISTER ───────────────────────────────
  {
    itemId: "G0-01",
    label: "Authoritative Entity Register",
    description: "A complete register of all legal entities associated with MITHQAL — including the bank-facing contracting entity, the operating entity, the holding/foundation entity, and the technology entity. Each entity must have: legal name, jurisdiction of formation, registration number, registered address, and legal status (existing vs. planned).",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "institutional-operating-model.ts references 'JOZOUR_LLC_NJ' as bankFacingCounterpartyEntityId and 'JOZOUR Amendment §1.6' as the institutional operator. However, no executed articles of incorporation, operating agreement, or registration certificate are present in the repository. The entity is REFERENCED in code but NOT VERIFIED by any executed instrument.",
    status: "PRIMARY_DOCUMENT_MISSING — the entity 'JOZOUR_LLC_NJ' is designed in code but no executed legal instrument verifies its existence, formation, or registration. Cannot confirm legal name, jurisdiction, registration number, or registered address.",
    missingDocuments: [
      "Articles of Incorporation / Formation Certificate for JOZOUR_LLC_NJ",
      "Operating Agreement / Bylaws for JOZOUR_LLC_NJ",
      "Good Standing Certificate from the jurisdiction of formation",
      "Registered Agent confirmation",
    ],
    canonicalReference: "institutional-operating-model.ts:bankFacingCounterpartyEntityId = 'JOZOUR_LLC_NJ'",
    owner: "COO + external legal counsel",
  },
  // ── 2. OWNERSHIP / CONTROL GRAPH ───────────────────────────────────
  {
    itemId: "G0-02",
    label: "Ownership / Control Graph",
    description: "A complete ownership graph showing who owns each entity (shareholders, members, beneficiaries), control structures (voting rights, board appointments), and any chain of ownership between entities. Must be verified by executed shareholder agreements or cap tables.",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "No shareholder agreement, cap table, or ownership register is present in the repository. The institutional-operating-model.ts describes an internalSeparation structure (Holding/Operating/Technology/Oversight) but this is a DESIGN, not an executed ownership structure.",
    status: "PENDING_PRIMARY_DOCUMENT — no ownership instruments exist. The ownership graph is designed but not verified by any executed document.",
    missingDocuments: [
      "Shareholder Agreement / Cap Table",
      "Voting Rights Register",
      "Board Appointment Resolutions",
      "Beneficial Ownership Declaration",
    ],
    canonicalReference: "institutional-operating-model.ts:internalSeparation (4 entities, 3 PENDING)",
    owner: "COO + external legal counsel",
  },
  // ── 3. AUTHORITY MATRIX ────────────────────────────────────────────
  {
    itemId: "G0-03",
    label: "Authority Matrix",
    description: "A matrix defining who has authority to: sign contracts, bind the entity legally, approve transactions, appoint officers, open bank accounts, and represent the entity to external parties. Must be verified by executed board resolutions or power-of-attorney documents.",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "No board resolutions, power-of-attorney, or authority delegation documents are present. The institutional-operating-model.ts defines roles (COO, CTO, PM) but these are project roles, not legal authority delegations.",
    status: "PENDING_PRIMARY_DOCUMENT — no authority instruments exist. The authority matrix is designed but not verified by any executed document.",
    missingDocuments: [
      "Board Resolution authorizing contracting authority",
      "Power of Attorney for signatories",
      "Officer Appointment Resolutions",
      "Banking Resolution (authority to open accounts)",
    ],
    canonicalReference: "institutional-operating-model.ts:8 fields, 3 ACTIVE + 5 PENDING_LEGAL_VERIFICATION",
    owner: "COO + external legal counsel",
  },
  // ── 4. CONTRACTING ENTITY DEFINITION ──────────────────────────────
  {
    itemId: "G0-04",
    label: "Contracting Entity Definition",
    description: "The single legal entity that banks will contract with. Must have: legal name, jurisdiction, registration number, authorized signatories, and a clear statement of what the entity is responsible for vs. what other entities are responsible for.",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "institutional-operating-model.ts: bankFacingCounterpartyEntityId = 'JOZOUR_LLC_NJ'. The entity is defined in CODE as the bank-facing counterparty. However, no executed document verifies this entity exists, is registered, or has authority to contract.",
    status: "INTERNAL_DESIGN — the contracting entity is defined in code as 'JOZOUR_LLC_NJ' but is NOT verified by any executed instrument. Cannot confirm legal name, registration, or contracting authority.",
    missingDocuments: [
      "Articles of Incorporation confirming JOZOUR_LLC_NJ exists",
      "Operating Agreement defining contracting authority",
      "Board Resolution authorizing the entity to enter bank contracts",
    ],
    canonicalReference: "institutional-operating-model.ts:bankFacingCounterpartyEntityId",
    owner: "COO + external legal counsel",
  },
  // ── 5. BANK-FACING RESPONSIBILITY MATRIX ──────────────────────────
  {
    itemId: "G0-05",
    label: "Bank-Facing Responsibility Matrix",
    description: "A matrix defining what MITHQAL owes the bank (service obligations, liability scope, SLA commitments, indemnification) and what the bank owes MITHQAL (fees, data access, cooperation obligations). Must be verified by executed or draft contract terms.",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "bank-contracting-package.ts: 17 contract sections ALL DRAFT, 0 SIGNED. The responsibility matrix is DESIGNED in the contract sections but NO executed contract exists to verify the bank-facing obligations.",
    status: "INTERNAL_DESIGN — 17 contract sections define the responsibility matrix, but ALL are DRAFT (0 SIGNED). No executed instrument verifies the bank-facing obligations.",
    missingDocuments: [
      "Executed Bank Master Agreement (17 sections, currently ALL DRAFT)",
      "Service Level Agreement (SLA)",
      "Indemnification Agreement",
    ],
    canonicalReference: "bank-contracting-package.ts:17 sections ALL DRAFT",
    owner: "COO + external legal counsel (both sides)",
  },
  // ── 6. LEGAL OBLIGATION CHAIN ──────────────────────────────────────
  {
    itemId: "G0-06",
    label: "Legal Obligation Chain",
    description: "The chain of legal obligations from the bank → MITHQAL contracting entity → operating entity → technology entity → custodian → any other party. Each link must be verified by an executed instrument (contract, agreement, or legal obligation).",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "No executed instruments exist to verify ANY link in the obligation chain. The chain is designed in institutional-operating-model.ts (internalSeparation) and institutional-settlement-obligation-registry.ts (13-field obligation registry with NO_LEGAL_OBLIGOR).",
    status: "PENDING_PRIMARY_DOCUMENT — the obligation chain is designed but NO executed instruments verify any link. The obligation registry enforces NO_LEGAL_OBLIGOR → NO_INSTITUTIONAL_OBLIGATION.",
    missingDocuments: [
      "Executed inter-company agreements (Holding ↔ Operating ↔ Technology)",
      "Executed bank master agreement (bank ↔ contracting entity)",
      "Executed custody agreement (contracting entity ↔ custodian)",
    ],
    canonicalReference: "institutional-settlement-obligation-registry.ts:13 fields, NO_LEGAL_OBLIGOR enforced",
    owner: "COO + external legal counsel",
  },
  // ── 7. MTQ OBLIGOR / REDEMPTION ROLE MATRIX ───────────────────────
  {
    itemId: "G0-07",
    label: "MTQ Obligor / Redemption Role Matrix",
    description: "Defines which entity is the legal obligor for MTQ (if MTQ is ever activated), which entity handles redemption, and what the obligation chain looks like for MTQ holders. MTQ is currently DISABLED (Pilot B: MTQ_DISABLED, 0/11 prerequisites met).",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "mtq-economic-definition.ts defines MTQ as 'permissioned, institutional, closed-loop settlement unit'. pilot-b-mtq-lifecycle.ts: 4 states, 11 prerequisites, currentState=MTQ_DISABLED. The obligor role is DESIGNED but NO executed obligor agreement exists. IDENTIFIED_OBLIGOR prerequisite = PENDING_EXTERNAL.",
    status: "INTERNAL_DESIGN — the MTQ obligor role is designed (institutional-operating-model.ts) but no executed obligor agreement exists. MTQ is DISABLED. The obligor cannot be confirmed without executed instruments.",
    missingDocuments: [
      "Executed MTQ Obligor Agreement (if MTQ is ever activated)",
      "Executed Redemption Framework Agreement",
      "Legal opinion on MTQ obligor status",
    ],
    canonicalReference: "pilot-b-mtq-lifecycle.ts:IDENTIFIED_OBLIGOR = PENDING_EXTERNAL; mtq-redemption-value-consistency.ts:ONE canonical, PENDING",
    owner: "COO + external legal counsel",
  },
  // ── 8. RESERVE OWNERSHIP / CUSTODY ROLE MATRIX ────────────────────
  {
    itemId: "G0-08",
    label: "Reserve Ownership / Custody Role Matrix",
    description: "Defines who legally owns the reserves (gold, fiat, other backing assets), who holds custody, and what the legal relationship is between the owner and the custodian. Must be verified by executed custody agreements and ownership attestations.",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "reserve-domains.ts: 2 domains (SETTLEMENT_LIQUIDITY + STRATEGIC_RESILIENCE). Gold in STRATEGIC_RESILIENCE (NOT settlement backing). pbc-legal-enforceability.ts: 14 fields, 6 failure states, 0 evidence predicates met. No qualified custodian engaged. No executed custody agreement.",
    status: "INTERNAL_DESIGN — the reserve/custody role matrix is designed but NO executed custody agreement or ownership attestation exists. No qualified custodian is engaged.",
    missingDocuments: [
      "Executed Custody Agreement (contracting entity ↔ qualified custodian)",
      "Independent Reserve Attestation (external auditor)",
      "Beneficial Ownership Declaration for reserve assets",
    ],
    canonicalReference: "reserve-domains.ts:2 domains; pbc-legal-enforceability.ts:0/14 predicates met",
    owner: "COO + custody counsel + external auditor",
  },
  // ── 9. FOUNDATION / HOLDING / OPERATING / TECHNOLOGY BOUNDARIES ────
  {
    itemId: "G0-09",
    label: "Foundation / Holding / Operating / Technology Boundaries",
    description: "The legal boundaries between the foundation/holding entity, the operating entity, the technology entity, and any oversight entity. Each boundary must be defined by an executed inter-company agreement or governance document.",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "institutional-operating-model.ts: internalSeparation has 4 entities (Holding, Operating, Technology, Oversight). 3 are PENDING_LEGAL_VERIFICATION. The boundaries are DESIGNED but NO executed inter-company agreements exist to verify them.",
    status: "INTERNAL_DESIGN — the 4-entity boundary structure is designed but 3/4 are PENDING_LEGAL_VERIFICATION. No executed inter-company agreements verify the boundaries.",
    missingDocuments: [
      "Executed Inter-Company Agreement (Holding ↔ Operating)",
      "Executed Technology Services Agreement (Operating ↔ Technology)",
      "Executed Oversight/Governance Agreement",
      "Foundation/Trust Deed (if applicable)",
    ],
    canonicalReference: "institutional-operating-model.ts:internalSeparation (4 entities, 3 PENDING)",
    owner: "COO + external legal counsel",
  },
  // ── 10. CURRENT-ENTITY TRANSITION MODEL ────────────────────────────
  {
    itemId: "G0-10",
    label: "Current-Entity Transition Model",
    description: "A documented transition from any current interim entity (or individual) to the final institutional entity structure. Must include: current state, target state, transition steps, legal instruments required, and timeline.",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "institutional-external-identity.ts: 3 items PENDING_ENTITY_IDENTITY (email, domain, website). The transition from 'PENDING_ENTITY_IDENTITY' to 'ENTITY_ESTABLISHED' is DESIGNED but no transition plan or executed transition instrument exists.",
    status: "PENDING_PRIMARY_DOCUMENT — the transition model is designed (ENTITY_ESTABLISHED → CONTRACTING_AUTHORITY_VALIDATED) but no executed transition instrument or documented timeline exists.",
    missingDocuments: [
      "Documented Entity Transition Plan (current → target)",
      "Executed Transition Instrument (if any interim entity exists)",
      "Timeline with milestones",
    ],
    canonicalReference: "institutional-external-identity.ts:ENTITY_ESTABLISHED → CONTRACTING_AUTHORITY_VALIDATED",
    owner: "COO + external legal counsel",
  },
  // ── 11. EXECUTED-INSTRUMENT RECONCILIATION REGISTER ────────────────
  {
    itemId: "G0-11",
    label: "Executed-Instrument Reconciliation Register",
    description: "A complete register of ALL executed legal instruments related to MITHQAL — articles of incorporation, operating agreements, shareholder agreements, contracts, custody agreements, regulatory filings, etc. Each instrument must be present in the repository or verifiable externally.",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "REPOSITORY AUDIT: No executed legal instruments found. Files in repository: source documents (MTQ_modified.docx), blueprints (MITHQAL_MASTER_BLUEPRINT*.docx), publications (PDFs). NONE of these are executed legal instruments (articles, operating agreements, contracts, filings).",
    status: "PRIMARY_DOCUMENT_MISSING — no executed instruments found in the repository. The code REFERENCES entities and instruments (JOZOUR_LLC_NJ, JOZOUR Amendment §1.6) but the instruments themselves are NOT present. Per directive: mark PRIMARY_DOCUMENT_MISSING. Do NOT invent their contents.",
    missingDocuments: [
      "ALL executed legal instruments (articles, operating agreements, contracts, filings)",
      "JOZOUR Amendment §1.6 (referenced in code but NOT present in repository)",
      "Any government filing or registration certificate",
    ],
    canonicalReference: "Repository audit (find for *.pdf *.docx *jozour* — no executed instruments found)",
    owner: "COO + external legal counsel",
  },
  // ── 12. RELATED-PARTY / CONFLICT-OF-INTEREST REGISTER ─────────────
  {
    itemId: "G0-12",
    label: "Related-Party / Conflict-of-Interest Register",
    description: "A register of all related parties (founders, shareholders, directors, officers, affiliated entities) and any potential conflicts of interest. Must be verified by executed declarations or disclosure documents.",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "No related-party register, conflict-of-interest declaration, or disclosure document is present in the repository. The institutional-operating-model.ts references a Founder/COO role but no executed founder declaration or conflict disclosure exists.",
    status: "PENDING_PRIMARY_DOCUMENT — no related-party or conflict-of-interest instruments exist.",
    missingDocuments: [
      "Related-Party Register",
      "Conflict-of-Interest Declarations (founders, directors, officers)",
      "Beneficial Ownership Disclosures",
    ],
    canonicalReference: "N/A (no canonical module covers related-party register)",
    owner: "COO + external legal counsel",
  },
  // ── 13. IP OWNERSHIP REGISTER ──────────────────────────────────────
  {
    itemId: "G0-13",
    label: "IP Ownership Register",
    description: "A register defining who owns the intellectual property (source code, architecture, brand, trademarks, patents). Must be verified by executed IP assignment agreements or employment agreements with IP clauses.",
    evidenceClass: "UNKNOWN",
    evidence: "The source code is in GitHub (MITHQALMTQ/mithqal). No IP assignment agreement, employment agreement with IP clause, or trademark registration is present. The repository has no LICENSE file specifying IP terms. IP ownership is UNKNOWN.",
    status: "UNKNOWN — no IP ownership instruments exist. The code is in a public GitHub repository but the IP ownership terms are not documented. Cannot determine who owns the IP.",
    missingDocuments: [
      "IP Assignment Agreement (founder/developers → entity)",
      "Employment/Contractor Agreements with IP clauses",
      "Trademark Registration for MITHQAL/MTQ",
      "Open-source LICENSE file or proprietary IP statement",
    ],
    canonicalReference: "GitHub repository (no LICENSE file); institutional-external-identity.ts (no IP standards)",
    owner: "COO + external legal counsel",
  },
  // ── 14. DATA OWNERSHIP / PROCESSING ROLE MATRIX ───────────────────
  {
    itemId: "G0-14",
    label: "Data Ownership / Processing Role Matrix",
    description: "Defines who owns each data category, who processes it, under what legal basis, and what the data flows are between entities. Must align with the runtime-infrastructure-map.ts data classification.",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "runtime-infrastructure-map.ts: 6 data categories, each with ONE system-of-record. institutional-data-governance.ts: 15×7 matrix, 28 PENDING cells. The data ownership/processing roles are DESIGNED but no executed Data Processing Agreement (DPA) exists.",
    status: "INTERNAL_DESIGN — the data role matrix is designed (6 categories, 15×7 governance matrix) but no executed DPA, data sharing agreement, or privacy policy exists.",
    missingDocuments: [
      "Executed Data Processing Agreement (DPA) between entities",
      "Data Sharing Agreement (if data flows between entities)",
      "Privacy Policy (for any personal data processing)",
    ],
    canonicalReference: "runtime-infrastructure-map.ts:6 data categories; institutional-data-governance.ts:15×7, 28 PENDING",
    owner: "CTO + external legal counsel (data protection)",
  },
  // ── 15. BANK CONTRACT AUTHORITY MATRIX ─────────────────────────────
  {
    itemId: "G0-15",
    label: "Bank Contract Authority Matrix",
    description: "Defines who within MITHQAL has authority to: negotiate bank contracts, sign bank contracts, execute settlement agreements, and bind the entity. Must be verified by executed board resolutions or authority delegations.",
    evidenceClass: "PENDING_PRIMARY_DOCUMENT",
    evidence: "bank-contracting-package.ts: 17 sections ALL DRAFT, 0 SIGNED. No board resolution authorizing any individual to sign bank contracts. No authority delegation document exists.",
    status: "PENDING_PRIMARY_DOCUMENT — no bank contract authority instruments exist. No one is verified to have authority to sign bank contracts.",
    missingDocuments: [
      "Board Resolution authorizing contracting authority for bank contracts",
      "Authority Delegation Document (who can negotiate, who can sign)",
      "Signature Authority Register",
    ],
    canonicalReference: "bank-contracting-package.ts:17 sections ALL DRAFT, 0 SIGNED",
    owner: "COO + external legal counsel",
  },
  // ── 16. LIABILITY / ESCALATION MATRIX ──────────────────────────────
  {
    itemId: "G0-16",
    label: "Liability / Escalation Matrix",
    description: "Defines liability allocation between entities (who is liable for what), cap on liability, indemnification obligations, and the escalation path for disputes. Must be verified by executed liability agreements or contract terms.",
    evidenceClass: "INTERNAL_DESIGN",
    evidence: "dispute-exception-framework.ts: MITHQAL_COORDINATION_RULE (MITHQAL coordinates, NOT adjudicates, 5 is + 8 isNot). pbc-legal-enforceability.ts: MITHQAL_VERIFICATION_RULE (NEVER implies ownership/legal perfection/bankruptcy remoteness). The liability/escalation matrix is DESIGNED but no executed liability agreement or indemnification exists.",
    status: "INTERNAL_DESIGN — the liability/escalation matrix is designed (MITHQAL coordinates, NOT adjudicates) but no executed liability agreement, indemnification, or insurance policy exists (7 insurance categories ALL DESIGNED, 0 BOUND).",
    missingDocuments: [
      "Executed Liability Agreement (liability caps, allocation)",
      "Executed Indemnification Agreement",
      "Insurance Policy (7 categories ALL DESIGNED, 0 BOUND)",
    ],
    canonicalReference: "dispute-exception-framework.ts:MITHQAL_COORDINATION_RULE; insurance-risk-transfer-framework.ts:7 ALL DESIGNED",
    owner: "COO + external legal counsel + risk officer",
  },
];

/* ------------------------------------------------------------------ */
/*  G0 Decision                                                        */
/* ------------------------------------------------------------------ */

/**
 * G0 PASS CRITERIA (ALL must be true):
 *   1. One coherent bank-facing contracting entity (verified by executed instrument)
 *   2. Clear authority to contract (verified by board resolution)
 *   3. Clear service/liability boundaries (verified by executed agreements)
 *   4. No unresolved material contradiction in executed governing instruments
 *   5. Documented transition from any current interim entity
 *
 * HONEST ASSESSMENT:
 *   1. ❌ No executed instrument verifies the contracting entity exists
 *   2. ❌ No board resolution verifies authority to contract
 *   3. ❌ No executed agreement verifies service/liability boundaries
 *   4. ⚠️ Cannot assess — no executed governing instruments to check for contradictions
 *   5. ❌ No transition document exists
 *
 * DECISION: G0_FAIL
 * The entity 'JOZOUR_LLC_NJ' is DESIGNED in code but NOT LEGALLY ESTABLISHED.
 * No executed instruments verify its existence, authority, or boundaries.
 * Per directive: "Do NOT treat a planned entity as an existing entity."
 */
export const G0_DECISION: G0Decision = "G0_FAIL";

export const G0_DECISION_RATIONALE =
  "G0_FAIL. The bank-facing contracting entity 'JOZOUR_LLC_NJ' is DESIGNED in code " +
  "(institutional-operating-model.ts:bankFacingCounterpartyEntityId) but is NOT LEGALLY ESTABLISHED. " +
  "No executed instruments (articles of incorporation, operating agreement, board resolutions, " +
  "shareholder agreements, custody agreements, or inter-company agreements) are present in the repository. " +
  "The code REFERENCES 'JOZOUR Amendment §1.6' but the amendment itself is NOT in the repository — " +
  "marked PRIMARY_DOCUMENT_MISSING per directive. " +
  "Per directive: 'Do NOT treat a planned entity as an existing entity.' " +
  "The entity cannot enter an institutional evaluation or pilot agreement until: " +
  "(1) articles of incorporation are executed and deposited in the repository, " +
  "(2) an operating agreement defines authority + boundaries, " +
  "(3) a board resolution authorizes contracting, " +
  "(4) all 16 G0 items are re-classified from PENDING/INTERNAL_DESIGN to VERIFIED_PRIMARY_DOCUMENT. " +
  "Do NOT claim legal clearance.";

/* ------------------------------------------------------------------ */
/*  Pass Criteria Assessment                                           */
/* ------------------------------------------------------------------ */

export const PASS_CRITERIA = {
  coherentBankFacingEntity: false, // entity designed but not verified by executed instrument
  clearAuthorityToContract: false, // no board resolution
  clearServiceLiabilityBoundaries: false, // 17 contract sections ALL DRAFT, 0 SIGNED
  noUnresolvedMaterialContradiction: false, // cannot assess — no executed instruments to check
  documentedTransitionFromInterim: false, // no transition document
};

/* ------------------------------------------------------------------ */
/*  Final Statements                                                   */
/* ------------------------------------------------------------------ */

export const FINAL_STATEMENTS = {
  whatIsLegallyEstablished: [
    "NOTHING is legally established. No executed legal instruments exist in the repository.",
    "The GitHub repository (MITHQALMTQ/mithqal) exists and is publicly accessible — but this is a code repository, NOT a legal entity.",
    "The Vercel deployment (mithqal.vercel.app) is live — but this is a technical deployment, NOT a legal entity.",
    "The Turso database (mtq-fortleem) is operational — but this is a database, NOT a legal entity.",
  ],
  whatIsOnlyDesigned: [
    "The bank-facing contracting entity 'JOZOUR_LLC_NJ' is DESIGNED in code (institutional-operating-model.ts) but NOT legally established.",
    "The 4-entity internal separation (Holding/Operating/Technology/Oversight) is DESIGNED but 3/4 are PENDING_LEGAL_VERIFICATION.",
    "The 17-section bank contracting package is DESIGNED (ALL DRAFT, 0 SIGNED).",
    "The MTQ obligor role is DESIGNED but no executed obligor agreement exists.",
    "The reserve/custody role matrix is DESIGNED but no executed custody agreement exists.",
    "The liability/escalation matrix is DESIGNED but no executed liability agreement exists.",
    "The 3 institutional identity items (email, domain, website) are PENDING_ENTITY_IDENTITY.",
  ],
  whatRequiresCounsel: [
    "External legal counsel must verify whether 'JOZOUR_LLC_NJ' exists as a legal entity (jurisdiction, registration, good standing).",
    "External legal counsel must determine authority to contract (who can legally bind the entity).",
    "External legal counsel must review the 17-section bank contracting package (currently ALL DRAFT).",
    "External legal counsel must advise on the 4-entity internal separation (Holding/Operating/Technology/Oversight).",
    "External legal counsel must advise on the MTQ obligor role and redemption framework.",
    "External legal counsel must advise on IP ownership (source code, trademarks, brand).",
    "External legal counsel must advise on related-party/conflict-of-interest disclosures.",
    "External legal counsel must advise on data ownership/processing role matrix (DPA requirements).",
  ],
  whatDocumentsAreMissing: [
    "Articles of Incorporation / Formation Certificate for JOZOUR_LLC_NJ — PRIMARY_DOCUMENT_MISSING",
    "Operating Agreement / Bylaws for JOZOUR_LLC_NJ — PRIMARY_DOCUMENT_MISSING",
    "JOZOUR Amendment §1.6 (referenced in code, NOT in repository) — PRIMARY_DOCUMENT_MISSING",
    "Shareholder Agreement / Cap Table — PENDING_PRIMARY_DOCUMENT",
    "Board Resolution authorizing contracting authority — PENDING_PRIMARY_DOCUMENT",
    "Banking Resolution (authority to open accounts) — PENDING_PRIMARY_DOCUMENT",
    "Executed Inter-Company Agreements (Holding ↔ Operating ↔ Technology) — PENDING_PRIMARY_DOCUMENT",
    "Executed Bank Master Agreement (17 sections, ALL DRAFT) — PENDING_PRIMARY_DOCUMENT",
    "Executed Custody Agreement — PENDING_PRIMARY_DOCUMENT",
    "Independent Reserve Attestation — PENDING_PRIMARY_DOCUMENT",
    "Related-Party Register + Conflict-of-Interest Declarations — PENDING_PRIMARY_DOCUMENT",
    "IP Assignment Agreement — UNKNOWN (not present)",
    "Trademark Registration for MITHQAL/MTQ — UNKNOWN (not present)",
    "Data Processing Agreement (DPA) — PENDING_PRIMARY_DOCUMENT",
    "Privacy Policy — PENDING_PRIMARY_DOCUMENT",
    "Insurance Policies (7 categories ALL DESIGNED, 0 BOUND) — PENDING_PRIMARY_DOCUMENT",
    "Good Standing Certificate — PENDING_PRIMARY_DOCUMENT",
    "Any government filing or registration certificate — PENDING_PRIMARY_DOCUMENT",
  ],
  whatMustBeDoneBeforeBankReview: [
    "1. Engage external legal counsel to verify whether JOZOUR_LLC_NJ exists as a legal entity.",
    "2. If it exists: obtain + deposit articles of incorporation, operating agreement, good standing certificate.",
    "3. If it does NOT exist: form the entity (articles of incorporation) + register in the appropriate jurisdiction.",
    "4. Execute an operating agreement defining authority, boundaries, and governance.",
    "5. Obtain a board resolution authorizing the entity to enter bank contracts.",
    "6. Resolve the 3 PENDING_ENTITY_IDENTITY items (email, domain, website) as REAL (not self-asserted).",
    "7. Execute inter-company agreements (if the 4-entity structure is maintained).",
    "8. Execute or finalize the 17-section bank contracting package (at least the term sheet).",
    "9. Complete the related-party/conflict-of-interest register + declarations.",
    "10. Determine IP ownership (IP assignment agreements + trademark registration).",
    "11. Re-run the G0 assessment: all 16 items must be re-classified from PENDING/INTERNAL_DESIGN to VERIFIED_PRIMARY_DOCUMENT.",
    "12. Only after G0_PASS can the project proceed to G1 (Pilot-Jurisdiction Legal Analysis).",
  ],
};

/* ------------------------------------------------------------------ */
/*  Full G0 Report                                                     */
/* ------------------------------------------------------------------ */

export function getG0Report(): G0Report {
  return {
    gateId: "G0",
    gateLabel: "Corporate / Contractual Integrity",
    objective: "Determine whether MITHQAL has one legally coherent, bank-facing institutional counterparty capable of entering an institutional evaluation or pilot agreement.",
    items: G0_ITEMS,
    decision: G0_DECISION,
    decisionRationale: G0_DECISION_RATIONALE,
    passCriteria: PASS_CRITERIA,
    finalStatements: FINAL_STATEMENTS,
    honestState: {
      productionAuthorized: false,
      legalClearanceClaimed: false, // Do NOT claim legal clearance
      architectureNotModified: true,
      noInferenceFromCode: true, // Do NOT infer legal status from code
      noInferenceFromBlueprint: true, // Do NOT infer ownership from blueprint
    },
    summary:
      `G0 INSTITUTIONAL ENTRY GATE — DECISION: ${G0_DECISION}. ` +
      `${G0_ITEMS.length} items assessed. ` +
      `Items by evidence class: ` +
      `INTERNAL_DESIGN=${G0_ITEMS.filter(i => i.evidenceClass === "INTERNAL_DESIGN").length}, ` +
      `PENDING_PRIMARY_DOCUMENT=${G0_ITEMS.filter(i => i.evidenceClass === "PENDING_PRIMARY_DOCUMENT").length}, ` +
      `UNKNOWN=${G0_ITEMS.filter(i => i.evidenceClass === "UNKNOWN").length}, ` +
      `VERIFIED_PRIMARY_DOCUMENT=${G0_ITEMS.filter(i => i.evidenceClass === "VERIFIED_PRIMARY_DOCUMENT").length}, ` +
      `EXECUTED_EXTERNAL_DOCUMENT=${G0_ITEMS.filter(i => i.evidenceClass === "EXECUTED_EXTERNAL_DOCUMENT").length}. ` +
      `The entity 'JOZOUR_LLC_NJ' is DESIGNED in code but NOT LEGALLY ESTABLISHED. ` +
      `No executed instruments present in repository (PRIMARY_DOCUMENT_MISSING). ` +
      `Do NOT claim legal clearance. NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const G0_META = {
  module: "g0-institutional-entry-gate",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED — G0_FAIL",
  frozenArchitecture: true,
  itemCount: G0_ITEMS.length,
  decision: G0_DECISION,
  legalClearanceClaimed: false,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. This is a READ-ONLY audit. No architecture modified.
//
//  G0 DECISION: G0_FAIL
//  The entity 'JOZOUR_LLC_NJ' is DESIGNED in code but NOT LEGALLY ESTABLISHED.
//  No executed instruments in the repository. PRIMARY_DOCUMENT_MISSING.
//
//  Do NOT infer legal status from the blueprint.
//  Do NOT infer ownership from code.
//  Do NOT infer authority from organizational diagrams.
//  Do NOT treat a planned entity as an existing entity.
//  Do NOT invent contents of missing instruments.
//  Do NOT claim legal clearance.
//
//  0/5 pass criteria met. 0/16 items VERIFIED_PRIMARY_DOCUMENT.
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
