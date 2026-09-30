// src/lib/bank-onboarding-training-framework.ts
//
// MITHQAL v25.3.21 — BANK ONBOARDING + INSTITUTIONAL TRAINING FRAMEWORK
// (single source of truth for institutional training content + certification pathway)
//
// Per PROMPT 38 (verbatim):
//   "Create a bank onboarding and institutional training framework without
//    expanding the core architecture.
//    Include: executive briefing, legal briefing, compliance briefing,
//    risk briefing, treasury briefing, technical integration guide,
//    operator runbook, incident guide, reconciliation guide, evidence guide
//    and certification/training pathway.
//    Training must teach: what MITHQAL is, what it is not, the bank boundary,
//    MTQ optionality, finality, reconciliation, evidence, failure handling
//    and responsibilities.
//    Do not create a consumer/retail education product."
//
// CHANGE REQUEST: CR-2026-014 (per Architecture Freeze v25.3.15)
//   — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.21
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - All 11 modules in DRAFT — NO training has been delivered
//     (no live cohort, no certified operator, no certified trainer)
//   - NOT a consumer/retail product — institutional training only
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.0 (institutional-operating-model — JOZOUR_LLC_NJ bank-facing counterparty)
//   - v25.3.6 K5 (Pilot 1 config — gold=0%, digital=0%)
//   - v25.3.8 N1 (canonical finality model F0-F7 — taught in reconciliation guide)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage
//     taught in evidence guide)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — taught in
//     operator runbook)
//   - v25.3.10 O2 (6 reconciliation tolerance policies — taught in
//     reconciliation guide)
//   - v25.3.10 P2 (two pilot modes — PILOT_A_CONTROL_PLANE +
//     PILOT_B_MTQ_SETTLEMENT — taught in executive briefing)
//   - v25.3.11 Q2 (pilot gate framework — GATE-A1..GATE-B7 — taught in
//     certification pathway)
//   - v25.3.16 U1 (Accounting/Prudential/Tax Framework — taught in
//     compliance briefing)
//   - v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — taught
//     in incident guide + failure handling)
//   - v25.3.18 W1 (Bank Contracting Package — taught in legal briefing)
//   - v25.3.18 W2 (Enterprise Risk Register — taught in risk briefing)
//   - v25.3.19 X1 (Data Governance + Dispute & Exception Framework — taught
//     in compliance briefing)
//   - v25.3.20 Y2 (Institutionalization Operating Plan — taught in
//     certification pathway)
//   - v25.3.21 Z1 P40 (Sharia/AAOIFI Governance — referenced from legal briefing)
//   - v25.3.21 Z1 P41 (Jurisdiction Truth Model — referenced from legal briefing)
//
// HONEST-STATE RULES (per directive):
//   - "Do not create a consumer/retail education product." — this module is
//     INSTITUTIONAL TRAINING ONLY. No retail audience, no consumer curriculum.
//   - All 11 modules are DRAFT — no training delivered, no cohort trained,
//     no trainer certified, no operator certified. This is the HONEST state.
//   - The "what MITHQAL is / what it is not" curriculum reflects the
//     system's TRUE state: MTQ is a settlement optionality layer that
//     COORDINATES with banks; it does NOT replace banks, does NOT custody
//     client assets, does NOT offer consumer products, and has NOT been
//     certified as Sharia-compliant.
//   - The bank boundary is taught explicitly: MITHQAL operates WITHIN the
//     bank's contractual + regulatory perimeter — banks remain the obligor
//     of record, custodian of record, and regulated party of record.
//
// ============================================================================
// TYPES
// ============================================================================

// 11 training modules per directive (PROMPT 38 verbatim)
export type TrainingModuleId =
  | "EXECUTIVE_BRIEFING"
  | "LEGAL_BRIEFING"
  | "COMPLIANCE_BRIEFING"
  | "RISK_BRIEFING"
  | "TREASURY_BRIEFING"
  | "TECHNICAL_INTEGRATION_GUIDE"
  | "OPERATOR_RUNBOOK"
  | "INCIDENT_GUIDE"
  | "RECONCILIATION_GUIDE"
  | "EVIDENCE_GUIDE"
  | "CERTIFICATION_TRAINING_PATHWAY";

// Per directive: "Training must teach: what MITHQAL is, what it is not,
// the bank boundary, MTQ optionality, finality, reconciliation, evidence,
// failure handling and responsibilities." — 9 canonical curriculum topics.
export type CurriculumTopic =
  | "WHAT_MITHQAL_IS" // 1
  | "WHAT_MITHQAL_IS_NOT" // 2
  | "BANK_BOUNDARY" // 3
  | "MTQ_OPTIONALITY" // 4
  | "FINALITY" // 5
  | "RECONCILIATION" // 6
  | "EVIDENCE" // 7
  | "FAILURE_HANDLING" // 8
  | "RESPONSIBILITIES"; // 9

export type ModuleStatus =
  | "DRAFT" // default — no training delivered, no cohort trained
  | "PILOT_REVIEW" // under internal pilot review (still no delivery)
  | "DELIVERED" // training delivered to a real cohort
  | "CERTIFIED"; // cohort certified against this module

export type TargetAudience =
  | "BANK_EXECUTIVES" // C-suite + board observers
  | "BANK_LEGAL_COUNSEL" // GC office + external counsel
  | "BANK_COMPLIANCE_OFFICERS" // BSA/AML, KYC, sanctions
  | "BANK_RISK_OFFICERS" // CRO office + risk committee
  | "BANK_TREASURY" // Treasurer + liquidity desk + FX settlements
  | "BANK_TECHNICAL_INTEGRATION" // integration engineers + SRE
  | "BANK_OPERATIONS" // settlement ops + reconciliation ops
  | "BANK_INCIDENT_RESPONSE" // IR coordinator + on-call
  | "BANK_AUDIT_INTERNAL" // internal audit + independent assurance
  | "BANK_EXTERNAL_AUDITORS" // external audit firm engagement team
  | "ALL_BANK_AUDIENCES"; // cross-cutting

export interface TrainingModule {
  moduleId: TrainingModuleId;
  name: string;
  description: string;
  targetAudience: TargetAudience[];
  deliveryFormat: "INSTRUCTOR_LED" | "SELF_PACED" | "TABLETOP" | "DOCUMENT";
  durationHours: number; // DESIGN-TIME estimate — no cohort has timed it
  keyTopics: CurriculumTopic[]; // from the 9 canonical topics
  learningObjectives: string[];
  prerequisites: TrainingModuleId[]; // upstream modules required first
  crossReferences: string[]; // references to canonical modules / blueprints
  status: ModuleStatus; // DRAFT — honest, no training delivered
  cohortCount: number; // honest — 0 (no cohort trained)
  certifiedOperatorCount: number; // honest — 0
  lastDeliveryDate: string | null; // honest — null (never delivered)
  ownerRole: string; // SPEND JUSTIFICATION: which Y2 role owns delivery
}

// ============================================================================
// CRITICAL RULES (per directive)
// ============================================================================

export const NOT_CONSUMER_RETAIL_RULE = {
  ruleId: "NOT_CONSUMER_RETAIL_RULE",
  rule: "Per PROMPT 38: 'Do not create a consumer/retail education product.' This module is INSTITUTIONAL TRAINING ONLY. Target audiences are bank executives, bank legal counsel, bank compliance/risk/treasury officers, bank technical/operations staff, bank audit (internal + external), and bank incident-response coordinators. There is NO consumer curriculum, NO retail onboarding flow, NO end-user education path, and NO individual-investor training. Any request to extend this framework to retail audiences must be rejected as out-of-scope for PROMPT 38.",
  description:
    "PROMPT 38 explicitly forbids a consumer/retail education product. The Bank Onboarding + Institutional Training Framework is exclusively for institutional (bank-side) audiences. " +
    "The 11 modules are scoped to bank-relevant curricula: executive briefing, legal briefing, compliance briefing, risk briefing, treasury briefing, technical integration guide, operator runbook, incident guide, reconciliation guide, evidence guide, and certification/training pathway. " +
    "None of these modules has a consumer variant, retail module, or end-user pathway. The framework does NOT teach retail investors how to buy, hold, or redeem MTQ — because MTQ is an institutional settlement optionality layer and is NOT a consumer product.",
  whatItForbids: [
    "Any consumer/retail education pathway.",
    "Any retail-investor onboarding flow attached to this framework.",
    "Any end-user training module (e.g., 'How to buy MTQ', 'How to redeem MTQ for individuals').",
    "Any marketing education product positioned for retail audiences.",
    "Any certification pathway that grants an individual-investor credential.",
    "Any public-facing consumer curriculum built from these 11 modules.",
  ],
  whatItPermits: [
    "Institutional training for bank executives + bank staff.",
    "External auditor + external counsel briefing (under NDA).",
    "Internal pilot review of modules before delivery (still DRAFT — no delivery).",
    "Tabletop exercises involving bank counterparties under contract.",
    "Cross-bank training consortium (multiple banks, same curriculum, institutional audience only).",
  ],
  enforcement:
    "Runtime invariant `assertNotConsumerRetail` fails fast at module load if any module's targetAudience contains a non-institutional audience label, or if any module's description references consumer/retail/individual investor education. The CERTIFICATION_TRAINING_PATHWAY module explicitly states 'institutional certification only — no individual-investor credential'.",
  scopeStatement:
    "SCOPE: institutional training ONLY (banks, bank staff, bank-engaged external auditors/counsel). OUT OF SCOPE: consumer education, retail onboarding, individual-investor training, public marketing curriculum.",
} as const;

export const HONEST_DRAFT_STATE_RULE = {
  ruleId: "HONEST_DRAFT_STATE_RULE",
  rule: "All 11 training modules are in DRAFT status. NO training has been delivered. NO cohort has been trained. NO operator has been certified. NO trainer has been certified. The `cohortCount`, `certifiedOperatorCount`, and `lastDeliveryDate` fields are 0/0/null respectively — they will NOT be advanced until an actual training event occurs and is independently evidenced (per N2 Evidence Fabric).",
  description:
    "PROMPT 38 requires an honest training framework. The honest state of a training framework that has not yet delivered training is DRAFT. " +
    "Each module's `status` field is `DRAFT`. Each module's `cohortCount` is 0. Each module's `certifiedOperatorCount` is 0. Each module's `lastDeliveryDate` is null. " +
    "These fields are NOT design-time placeholders to be massaged upward — they are HONEST counters that move ONLY when an actual event occurs and produces evidence (signed attendance, scored assessment, certification record stored in N2 Evidence Fabric with SHA-256 commitment).",
  whatItForbids: [
    "Setting any module status to PILOT_REVIEW, DELIVERED, or CERTIFIED without an actual training event.",
    "Setting any module's cohortCount > 0 without signed attendance records stored in N2 Evidence Fabric.",
    "Setting any module's certifiedOperatorCount > 0 without scored assessment records stored in N2 Evidence Fabric.",
    "Setting any module's lastDeliveryDate to a non-null value without an actual delivery timestamp.",
    "Representing these modules as 'training delivered' in any external marketing, RFP response, or regulatory filing without evidence.",
  ],
  whatItPermits: [
    "Pilot review of DRAFT modules by internal staff (does NOT advance status beyond DRAFT until delivery to a real cohort).",
    "Tabletop walkthroughs of DRAFT modules with bank counterparties under NDA (does NOT advance status beyond DRAFT unless the bank explicitly accepts the module as delivered).",
    "Iterative refinement of DRAFT content based on internal review.",
    "Adding new modules (ADDITIVE only — does NOT remove existing modules).",
  ],
  enforcement:
    "Runtime invariants at module load: `assertAllModulesDraft` (all 11 modules status === 'DRAFT'), `assertAllCohortCountsZero` (all 11 modules cohortCount === 0), `assertAllCertifiedOperatorCountsZero` (all 11 modules certifiedOperatorCount === 0), `assertAllLastDeliveryDatesNull` (all 11 modules lastDeliveryDate === null).",
  currentState:
    "ALL_11_MODULES_DRAFT — no training delivered, no cohort trained, no operator certified, no trainer certified. This is the HONEST state at v25.3.21.",
} as const;

export const BANK_BOUNDARY_RULE = {
  ruleId: "BANK_BOUNDARY_RULE",
  rule: "Per PROMPT 38: 'Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.' The BANK BOUNDARY is taught explicitly and is non-negotiable: MITHQAL operates WITHIN the bank's contractual + regulatory perimeter. Banks remain the obligor of record, the custodian of record, the regulated party of record, and the customer-facing party of record. MITHQAL is a settlement optionality layer that COORDINATES with banks; it does NOT replace banks, does NOT custody client assets, does NOT issue deposits, and does NOT offer consumer products.",
  description:
    "The bank boundary is one of the 9 canonical curriculum topics (BANK_BOUNDARY) and is taught in 6 of the 11 modules (executive briefing, legal briefing, compliance briefing, risk briefing, treasury briefing, operator runbook). " +
    "The boundary is explicit and operationalized through 4 invariants: (1) BANK_IS_OBLIGOR_OF_RECORD — the bank, not MITHQAL, signs the obligation to settle; (2) BANK_IS_CUSTODIAN_OF_RECORD — the bank's custodian chain (or its appointed sub-custodian), not MITHQAL, holds the assets; (3) BANK_IS_REGULATED_PARTY_OF_RECORD — the bank, not MITHQAL, holds the banking license and is the examination target; (4) BANK_IS_CUSTOMER_FACING_PARTY_OF_RECORD — the bank, not MITHQAL, has the direct customer relationship. " +
    "MITHQAL's role is to coordinate settlement finality, evidence, reconciliation, and failure handling — within the bank's perimeter. It does NOT take balance-sheet risk on the bank's behalf, does NOT take custody risk on the bank's behalf, and does NOT take regulatory risk on the bank's behalf.",
  whatItForbids: [
    "Teaching that MITHQAL replaces the bank as obligor of record.",
    "Teaching that MITHQAL takes custody of client assets.",
    "Teaching that MITHQAL is a regulated bank or holds a banking license.",
    "Teaching that MITHQAL has a direct customer relationship with the bank's client.",
    "Teaching that MITHQAL issues deposits, e-money, or stored-value instruments to consumers.",
    "Teaching that MITHQAL takes balance-sheet, custody, or regulatory risk on the bank's behalf.",
  ],
  whatItPermits: [
    "Teaching that MITHQAL coordinates settlement finality within the bank's perimeter.",
    "Teaching that MITHQAL coordinates evidence packaging (N2 Evidence Fabric) for the bank's reconciliation.",
    "Teaching that MITHQAL coordinates failure handling within the bank's contractual + regulatory perimeter.",
    "Teaching that MITHQAL is a settlement optionality layer (MTQ optionality) — banks may use it or not.",
  ],
  enforcement:
    "Runtime invariant `assertBankBoundaryTaught` fails fast if the 6 bank-boundary-relevant modules do not include BANK_BOUNDARY in their keyTopics. Runtime invariant `assertBankBoundaryStatementConsistent` fails fast if any module's learningObjectives contradict the 4 invariants (BANK_IS_OBLIGOR_OF_RECORD / BANK_IS_CUSTODIAN_OF_RECORD / BANK_IS_REGULATED_PARTY_OF_RECORD / BANK_IS_CUSTOMER_FACING_PARTY_OF_RECORD).",
} as const;

// ============================================================================
// 11 TRAINING MODULES (all DRAFT — honest)
// ============================================================================

export const TRAINING_MODULES: TrainingModule[] = [
  // 1. EXECUTIVE BRIEFING
  {
    moduleId: "EXECUTIVE_BRIEFING",
    name: "Executive Briefing — MITHQAL in 60 minutes for bank C-suite",
    description:
      "An institutional briefing for bank C-suite (CEO/COO/CFO/CRO/CTO/CCO) and board observers. Teaches what MITHQAL is (a settlement optionality layer that coordinates finality, evidence, reconciliation, and failure handling within a bank's perimeter), what MITHQAL is NOT (NOT a bank, NOT a custodian, NOT a deposit issuer, NOT a consumer product, NOT Sharia-certified), the bank boundary (banks remain obligor/custodian/regulated/customer-facing party of record), MTQ optionality (banks may use MITHQAL's settlement optionality or not — no coercion), the two pilot modes per P2 (PILOT_A_CONTROL_PLANE + PILOT_B_MTQ_SETTLEMENT — Pilot B BLOCKED until Pilot A passes), and the responsibilities of the bank's C-suite in sponsoring a MITHQAL integration. NOT a consumer/retail product.",
    targetAudience: ["BANK_EXECUTIVES", "BANK_AUDIT_INTERNAL"],
    deliveryFormat: "INSTRUCTOR_LED",
    durationHours: 1,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State what MITHQAL is: a settlement optionality layer that coordinates finality, evidence, reconciliation, and failure handling WITHIN a bank's contractual + regulatory perimeter.",
      "State what MITHQAL is NOT: NOT a bank, NOT a custodian, NOT a deposit issuer, NOT a consumer product, NOT Sharia-certified (per Z1 P40 — Sharia is an OPTIONAL market-specific pathway pending external validation).",
      "State the bank boundary: BANK_IS_OBLIGOR_OF_RECORD, BANK_IS_CUSTODIAN_OF_RECORD, BANK_IS_REGULATED_PARTY_OF_RECORD, BANK_IS_CUSTOMER_FACING_PARTY_OF_RECORD.",
      "State MTQ optionality: banks may use MITHQAL's settlement optionality or not — no coercion, no exclusivity, no minimum-volume commitment.",
      "Identify the two pilot modes per P2: PILOT_A_CONTROL_PLANE (8 test areas A1-A8, mtqRequired=false) and PILOT_B_MTQ_SETTLEMENT (7 test areas B1-B7, mtqRequired=true, BLOCKED until Pilot A passes ALL 8 + 6 legal/accounting prerequisites).",
      "State the executive sponsor's responsibilities: gate funding authorization per Y2 OPERATING_PLAN, gate legal/regulatory readiness per Q2 gates GATE-A3-COMPLIANCE_ORCHESTRATION + GATE-B2-OBLIGOR, gate risk acceptance per W2 ENTERPRISE_RISK_REGISTER.",
    ],
    prerequisites: [],
    crossReferences: [
      "v25.3.10 P2 (two pilot modes — PILOT_A_CONTROL_PLANE + PILOT_B_MTQ_SETTLEMENT)",
      "v25.3.11 Q2 (pilot gate framework — 15 default gates GATE-A1..GATE-B7)",
      "v25.3.18 W2 (Enterprise Risk Register — 17 risks)",
      "v25.3.20 Y2 (Institutionalization Operating Plan — 11 role categories)",
      "v25.3.21 Z1 P40 (Sharia/AAOIFI Governance — OPTIONAL pathway)",
      "v25.3.21 Z1 P41 (Jurisdiction Truth Model — UNKNOWN=CONSERVATIVE_BLOCK)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Bank Onboarding Manager (Y2 LEGAL_REGULATORY_EXPERTISE category, 0.5 FTE) — unblocks GATE-A8-BANK_INTEGRATION (next external gate), reduces W2 risk GOVERNANCE-001 (no executive sponsor identified), protects bank-pilot revenue protection (banks require executive briefing before sponsorship), produces training-delivery evidence artifact required by Q2 GATE-A8 acceptance criterion.",
  },

  // 2. LEGAL BRIEFING
  {
    moduleId: "LEGAL_BRIEFING",
    name: "Legal Briefing — MITHQAL legal perimeter for bank GC office + external counsel",
    description:
      "An institutional briefing for bank General Counsel office and bank-engaged external legal counsel. Teaches what MITHQAL is (a settlement optionality layer that coordinates WITHIN the bank's contractual + regulatory perimeter — NOT a substitute for the bank's legal entity, licenses, or regulatory filings), what MITHQAL is NOT (NOT a banking license holder, NOT a custodian, NOT an e-money issuer, NOT Sharia-certified — Sharia is an OPTIONAL market-specific pathway per Z1 P40), the bank boundary (the bank remains the legal obligor and the regulated party — MITHQAL coordinates; it does NOT invent legal rights per V1 COORDINATION_RULE), MTQ optionality from a legal standpoint (using MITHQAL's settlement optionality is a contractual election under the bank's own authority, not a delegation of authority), finality (canonical finality F0-F7 per N1 — legal conditionality attached to each stage), reconciliation (6 tolerance policies per O2 — legally enforceable thresholds), evidence (N2 Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments, admissible-intended but NOT yet tested in court), failure handling (V1 — 6 forbidden assumptions + DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE), and the bank's GC responsibilities. Cross-references W1 Bank Contracting Package (17 sections, ALL DRAFT). NOT a consumer/retail product.",
    targetAudience: ["BANK_LEGAL_COUNSEL"],
    deliveryFormat: "INSTRUCTOR_LED",
    durationHours: 2.5,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the legal perimeter: MITHQAL coordinates WITHIN the bank's contractual + regulatory perimeter — banks remain obligor of record, custodian of record, regulated party of record, customer-facing party of record.",
      "Quote V1 COORDINATION_RULE verbatim: 'the system may coordinate; it must not invent legal rights.' Apply the rule to 4 scenarios: settlement failure, custody failure, jurisdictional restriction, regulatory examination.",
      "Identify the 6 V1 forbidden assumptions (e.g., 'assume the bank can settle', 'assume the custodian will perform', 'assume the jurisdiction allows', 'assume the contract is enforceable', 'assume the regulator will accept', 'assume the evidence is admissible'). For each, identify the DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE.",
      "Map canonical finality stages F0-F7 (per N1) to legal conditionality: F0=INTENT (no legal obligation), F3=CONDITIONAL_COMMITMENT (contractually binding, contingent), F6=INSTITUTIONAL_FINALITY (bank + custodian attested), F7=REGULATORY_FINALITY (regulator-acknowledged where applicable).",
      "Map the 6 reconciliation tolerance policies (per O2) to legal enforceability: LEDGER_TO_LEDGER=1bps, BANK_ATTESTATION=5bps, CUSTODY_QUANTITY=10bps, MARKET_VALUATION=50bps, FX_VALUATION=20bps, STRESSED_VALUATION=200bps — each threshold is a contractually-enforceable dispute trigger.",
      "Identify the N2 Evidence Fabric (15-field EvidencePackage + SHA-256 commitments) as evidence-admissible-intended BUT NOT yet court-tested. State that the bank's GC must independently assess admissibility per jurisdiction.",
      "Identify the W1 Bank Contracting Package (17 sections, ALL DRAFT) as the upstream contractual framework — the bank's GC must complete W1 review BEFORE this briefing becomes operationally useful.",
      "State the GC responsibilities: (1) own the bank's W1 contracting decision; (2) own the bank's V1 failure-handling legal conditionality review; (3) own the bank's jurisdictional authorization review per Z1 P41 Jurisdiction Truth Model (UNKNOWN=CONSERVATIVE_BLOCK — no jurisdiction is 'ALLOWED' merely because an internal registry says so).",
    ],
    prerequisites: [],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7)",
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)",
      "v25.3.10 O2 (6 reconciliation tolerance policies)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE + 6 forbidden assumptions)",
      "v25.3.18 W1 (Bank Contracting Package — 17 sections ALL DRAFT)",
      "v25.3.21 Z1 P40 (Sharia/AAOIFI Governance — OPTIONAL pathway, PENDING_EXTERNAL_VALIDATION)",
      "v25.3.21 Z1 P41 (Jurisdiction Truth Model — UNKNOWN=CONSERVATIVE_BLOCK)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: External Counsel Relationship Manager (Y2 LEGAL_REGULATORY_EXPERTISE, 0.5 FTE) — unblocks GATE-B2-OBLIGOR (next external gate), reduces W2 risk LEGAL-001 (no external counsel engaged) + LEGAL-002 (no contracting package finalized), protects bank-pilot revenue protection (banks require GC sign-off before contracting), produces legal-briefing evidence artifact required by Q2 GATE-A3 + GATE-B2 acceptance criteria.",
  },

  // 3. COMPLIANCE BRIEFING
  {
    moduleId: "COMPLIANCE_BRIEFING",
    name: "Compliance Briefing — MITHQAL for BSA/AML + KYC + sanctions officers",
    description:
      "An institutional briefing for bank compliance officers (BSA-AML Officer, KYC Specialist, Sanctions Officer, Compliance Ops Analyst). Teaches what MITHQAL is (a settlement optionality layer that operates WITHIN the bank's BSA/AML program, sanctions screening program, and KYC/CIP program — NOT a substitute for the bank's compliance controls), what MITHQAL is NOT (NOT a KYC provider, NOT a sanctions screening engine, NOT a BSA/AML program, NOT a consumer-facing product, NOT Sharia-certified), the bank boundary (banks remain the compliance program of record — MITHQAL coordinates evidence WITHIN the bank's controls, it does NOT replace them), MTQ optionality from a compliance standpoint (using MITHQAL's settlement optionality triggers the bank's existing BSA/AML + sanctions + KYC workflows — no exemptions, no carve-outs), finality (canonical finality F0-F7 per N1 — compliance holds attach at F0/F1, releases at F6+), reconciliation (6 tolerance policies per O2 — compliance investigation triggers), evidence (N2 Evidence Fabric — compliance evidence packages admissible to examiners, NOT yet examiner-tested), failure handling (V1 — compliance escalation paths), and the bank compliance officer's responsibilities. Cross-references U1 Accounting/Prudential/Tax (10 areas, all PENDING_EXTERNAL_VALIDATION) + X1 Data Governance (15 dimensions × 7 data types = 105 cells) + X1 Dispute & Exception Framework (7 types × 9 stages = 63 cells). NOT a consumer/retail product.",
    targetAudience: ["BANK_COMPLIANCE_OFFICERS"],
    deliveryFormat: "INSTRUCTOR_LED",
    durationHours: 3,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the compliance perimeter: MITHQAL operates WITHIN the bank's BSA/AML program, sanctions screening program, and KYC/CIP program. The bank is the compliance program of record.",
      "State what MITHQAL is NOT: NOT a KYC provider, NOT a sanctions screening engine, NOT a BSA/AML program, NOT a consumer-facing product, NOT Sharia-certified.",
      "Apply MTQ optionality to compliance workflows: electing MITHQAL settlement optionality triggers the bank's existing KYC refresh, sanctions screening, transaction monitoring, and SAR/STR workflows. No exemptions, no carve-outs, no de-risking bypass.",
      "Map canonical finality stages F0-F7 (per N1) to compliance holds: F0=INTENT (KYC + sanctions screen required), F1=PRE_AUTHORIZATION (compliance hold attach), F3=CONDITIONAL_COMMITMENT (compliance release required), F6=INSTITUTIONAL_FINALITY (post-event monitoring), F7=REGULATORY_FINALITY (examiner-visible).",
      "Apply the 6 O2 reconciliation tolerance policies as compliance investigation triggers: e.g., a CUSTODY_QUANTITY breach > 10bps triggers a compliance investigation (not just a reconciliation break).",
      "Identify the N2 Evidence Fabric as admissible-intended to examiners BUT NOT yet examiner-tested. State that the bank's compliance officer must independently assess examiner acceptance per jurisdiction.",
      "Identify the U1 Accounting/Prudential/Tax Framework (10 classification areas, ALL PENDING_EXTERNAL_VALIDATION) and the X1 Data Governance (15 dimensions × 7 data types = 105 cells) and Dispute & Exception Framework (7 types × 9 stages = 63 cells) as upstream compliance controls.",
      "State the compliance officer's responsibilities: (1) own the bank's BSA/AML decision for MITHQAL settlement; (2) own sanctions screening integration; (3) own KYC refresh triggers; (4) own SAR/STR decision workflow; (5) own examiner-response evidence packaging via N2 Evidence Fabric.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7)",
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)",
      "v25.3.10 O2 (6 reconciliation tolerance policies)",
      "v25.3.16 U1 (Accounting/Prudential/Tax Framework — 10 areas ALL PENDING_EXTERNAL_VALIDATION)",
      "v25.3.19 X1 (Data Governance 15×7=105 cells + Dispute & Exception 7×9=63 cells)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE)",
      "v25.3.21 Z1 P41 (Jurisdiction Truth Model — UNKNOWN=CONSERVATIVE_BLOCK)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: BSA-AML Officer (Y2 COMPLIANCE category) — unblocks GATE-A3-COMPLIANCE_ORCHESTRATION (next external gate), reduces W2 risk COMPLIANCE-001 (no BSA/AML program integration defined), protects bank-pilot revenue protection (banks require compliance sign-off before transaction), produces compliance-briefing evidence artifact required by Q2 GATE-A3 acceptance criterion.",
  },

  // 4. RISK BRIEFING
  {
    moduleId: "RISK_BRIEFING",
    name: "Risk Briefing — MITHQAL for bank CRO office + risk committee",
    description:
      "An institutional briefing for bank Chief Risk Officer office and bank risk committee. Teaches what MITHQAL is (a settlement optionality layer that introduces new risk vectors — settlement risk, custody risk, jurisdictional risk, technology risk, legal-conditionality risk — that must be onboarded into the bank's enterprise risk register), what MITHQAL is NOT (NOT a risk taker, NOT a risk transfer mechanism, NOT a guarantee, NOT Sharia-certified), the bank boundary (banks retain ALL balance-sheet, custody, regulatory, and operational risk — MITHQAL does NOT take risk on the bank's behalf), MTQ optionality from a risk standpoint (electing MITHQAL settlement optionality is a risk acceptance decision per W2 ENTERPRISE_RISK_REGISTER), finality (canonical finality F0-F7 per N1 — risk transfer/retention maps to each stage), reconciliation (6 tolerance policies per O2 — risk limits attached to each tolerance), evidence (N2 Evidence Fabric — risk evidence packages, NOT yet independently audited), failure handling (V1 — 6 forbidden assumptions + DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE; S1 Settlement Continuity Fabric — 9 events × 7-stage lifecycle with NO_BYPASS_RULE), and the bank CRO's responsibilities. Cross-references W2 Enterprise Risk Register (17 risks, NO_INVENTED_PROBABILITIES_RULE) + W2 Insurance Framework (7 categories, NO_SUBSTITUTE_RULE) + S1 SettlementContinuityFabric. NOT a consumer/retail product.",
    targetAudience: ["BANK_RISK_OFFICERS"],
    deliveryFormat: "INSTRUCTOR_LED",
    durationHours: 3,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the risk perimeter: MITHQAL is a settlement optionality layer that introduces new risk vectors. Banks retain ALL balance-sheet, custody, regulatory, and operational risk. MITHQAL does NOT take risk on the bank's behalf.",
      "State what MITHQAL is NOT: NOT a risk taker, NOT a risk transfer mechanism, NOT a guarantee, NOT a credit enhancement, NOT Sharia-certified.",
      "Apply MTQ optionality as a risk acceptance decision: electing MITHQAL settlement optionality requires the bank's CRO to formally accept (or reject) the new risk vectors per W2 ENTERPRISE_RISK_REGISTER. Each risk must have a SINGULAR_OWNER and must NOT carry an invented probability (NO_INVENTED_PROBABILITIES_RULE).",
      "Map canonical finality stages F0-F7 (per N1) to risk transfer/retention: F0=INTENT (no risk transfer), F3=CONDITIONAL_COMMITMENT (settlement risk crystallizes), F6=INSTITUTIONAL_FINALITY (settlement risk extinguished), F7=REGULATORY_FINALITY (regulatory risk acknowledged).",
      "Apply the 6 O2 reconciliation tolerance policies as risk limits: each tolerance breach is a risk-limit breach (not just an accounting variance). E.g., a STRESSED_VALUATION breach > 200bps is a stress-test risk limit breach.",
      "Identify the N2 Evidence Fabric as risk-evidence-intended BUT NOT yet independently audited. State that the bank's CRO must commission an independent risk audit (W2 INSURANCE framework: NO_SUBSTITUTE_RULE — insurance is NOT a substitute for risk management).",
      "Identify the V1 failure-handling pattern (6 forbidden assumptions + 4-component replacement) and the S1 SettlementContinuityFabric (9 events: BANK_DEFAULT/CUSTODIAN_FAILURE/RAIL_OUTAGE/JURISDICTION_RESTRICTION/LIQUIDITY_FAILURE/CYBER_EVENT/FINALITY_ORACLE_FAILURE/POLICY_EXPIRATION/RECONCILIATION_BREAK × 7-stage lifecycle DETECT→FREEZE_SAFE_HALT→ASSESS→ALTERNATIVE_ROUTE→RESUME→RECONCILE→EVIDENCE) as the failure-handling framework.",
      "State the CRO responsibilities: (1) own the W2 risk register entries for MITHQAL settlement; (2) own the risk acceptance decision per gate; (3) own the independent risk audit commissioning; (4) own the W2 insurance framework decision (NO_SUBSTITUTE_RULE); (5) own the S1 SettlementContinuityFabric tabletop exercises.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING", "LEGAL_BRIEFING"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7)",
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)",
      "v25.3.10 O2 (6 reconciliation tolerance policies)",
      "v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle + NO_BYPASS_RULE)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions)",
      "v25.3.18 W2 (Enterprise Risk Register — 17 risks, NO_INVENTED_PROBABILITIES_RULE + SINGULAR_OWNER_RULE + Insurance Framework — 7 categories, NO_SUBSTITUTE_RULE)",
      "v25.3.21 Z1 P41 (Jurisdiction Truth Model — UNKNOWN=CONSERVATIVE_BLOCK)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: CRO (Y2 LEADERSHIP_ROLES category) — unblocks GATE-A7-FAILURE_MANAGEMENT (next external gate), reduces W2 risk GOVERNANCE-002 (no CRO sponsor identified) + TECHNOLOGY-001 (no independent risk audit), protects bank-pilot revenue protection (banks require CRO sign-off before transaction), produces risk-briefing + risk-register evidence artifact required by Q2 GATE-A7 + GATE-A4 acceptance criteria.",
  },

  // 5. TREASURY BRIEFING
  {
    moduleId: "TREASURY_BRIEFING",
    name: "Treasury Briefing — MITHQAL for Treasurer + liquidity desk + FX settlements",
    description:
      "An institutional briefing for bank Treasurer, Liquidity Manager, and FX Settlements Specialist. Teaches what MITHQAL is (a settlement optionality layer that coordinates finality for treasury-level obligations — typically wholesale, large-value, multi-currency), what MITHQAL is NOT (NOT a deposit, NOT an e-money, NOT a stored-value instrument, NOT a currency hedge, NOT a liquidity provider, NOT Sharia-certified), the bank boundary (banks remain the obligor of record for treasury operations — MITHQAL coordinates finality within the bank's treasury perimeter), MTQ optionality from a treasury standpoint (electing MITHQAL settlement optionality is a treasury decision per the bank's ALM policy), finality (canonical finality F0-F7 per N1 — treasury recognizes F6=INSTITUTIONAL_FINALITY as the binding stage), reconciliation (6 tolerance policies per O2 — treasury owns FX_VALUATION=20bps and STRESSED_VALUATION=200bps), evidence (N2 Evidence Fabric — treasury evidence packages for intraday + EOD reconciliation), failure handling (V1 + S1 — treasury coordinates liquidity failure + rail outage recovery), and the Treasurer's responsibilities. Includes a specific module on CNY/CNH per Z1 P41 (onshore CNY vs offshore CNH — distinguish custody jurisdiction, conversion venue, settlement rail, sanctions/capital-control constraints, legal accessibility; CRITICAL RULE: holding a currency in a reserve is NOT equivalent to having lawful access to its domestic settlement system). NOT a consumer/retail product.",
    targetAudience: ["BANK_TREASURY"],
    deliveryFormat: "INSTRUCTOR_LED",
    durationHours: 3,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the treasury perimeter: MITHQAL coordinates finality for treasury-level obligations — typically wholesale, large-value, multi-currency. The bank remains the obligor of record.",
      "State what MITHQAL is NOT: NOT a deposit, NOT an e-money, NOT a stored-value instrument, NOT a currency hedge, NOT a liquidity provider, NOT a Sharia-compliant instrument (per Z1 P40 — Sharia is OPTIONAL, PENDING_EXTERNAL_VALIDATION).",
      "Apply MTQ optionality as a treasury decision: electing MITHQAL settlement optionality requires the Treasurer's authorization per the bank's Asset-Liability Management (ALM) policy and liquidity coverage ratio (LCR) framework.",
      "Map canonical finality stages F0-F7 (per N1) to treasury recognition: F6=INSTITUTIONAL_FINALITY is the binding stage for treasury books; F7=REGULATORY_FINALITY is the regulator-acknowledged stage where applicable.",
      "Apply the 6 O2 reconciliation tolerance policies to treasury: FX_VALUATION=20bps (treasury owns), STRESSED_VALUATION=200bps (treasury owns under stress), BANK_ATTESTATION=5bps (treasury attests to bank ledger).",
      "Identify the N2 Evidence Fabric as treasury-reconciliation evidence-intended BUT NOT yet audit-confirmed.",
      "Identify V1 + S1 as the failure-handling framework for treasury: LIQUIDITY_FAILURE event → 7-stage lifecycle; RAIL_OUTAGE event → alternative route.",
      "Apply the CNY/CNH distinction per Z1 P41: onshore CNY (PRC domestic, capital-controlled), offshore CNH (offshore deliverable, freely traded), custody jurisdiction (where held), conversion venue (where converted), settlement rail (CIPS for CNY, correspondent banking for CNH), sanctions/capital-control constraints (PRC capital controls + US/OFAC sanctions screening), legal accessibility (CRITICAL RULE: holding CNY in a reserve is NOT equivalent to having lawful access to PRC's domestic settlement system).",
      "State the Treasurer's responsibilities: (1) own the bank's ALM decision for MITHQAL settlement; (2) own the liquidity coverage ratio (LCR) impact assessment; (3) own the FX settlement rail selection (CIPS for onshore CNY, correspondent for CNH); (4) own the reconciliation tolerance breaches per O2; (5) own the S1 LIQUIDITY_FAILURE + RAIL_OUTAGE response.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7)",
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)",
      "v25.3.10 O2 (6 reconciliation tolerance policies — FX_VALUATION + STRESSED_VALUATION)",
      "v25.3.13 S1 (SettlementContinuityFabric — LIQUIDITY_FAILURE + RAIL_OUTAGE events)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE)",
      "v25.3.21 Z1 P40 (Sharia/AAOIFI Governance — OPTIONAL pathway)",
      "v25.3.21 Z1 P41 (Jurisdiction Truth Model — CNY/CNH distinction + 8 canonical states)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Treasurer (Y2 TREASURY_LIQUIDITY category) — unblocks GATE-B1-PBC + GATE-B3-ISSUANCE + GATE-B4-REDEMPTION (next external gates), reduces W2 risk TREASURY-001 (no treasury integration defined) + LIQUIDITY-001 (no LCR impact assessment), protects bank-pilot revenue protection (banks require Treasury sign-off before settlement), produces treasury-briefing evidence artifact required by Q2 GATE-B1/B3/B4 acceptance criteria.",
  },

  // 6. TECHNICAL INTEGRATION GUIDE
  {
    moduleId: "TECHNICAL_INTEGRATION_GUIDE",
    name: "Technical Integration Guide — MITHQAL integration for bank engineers + SRE",
    description:
      "An institutional technical guide for bank integration engineers and Site Reliability Engineers (SRE). Teaches what MITHQAL is (a settlement optionality layer exposing API endpoints for finality coordination, evidence packaging, reconciliation, and failure handling — within the bank's technical perimeter), what MITHQAL is NOT (NOT a payment network, NOT a custody API, NOT a banking core replacement, NOT a smart contract platform for consumer dApps, NOT Sharia-certified), the bank boundary (the bank's integration engineers integrate MITHQAL APIs WITHIN the bank's security perimeter — MITHQAL does NOT exfiltrate data, does NOT hold credentials, does NOT impersonate bank staff), MTQ optionality from a technical standpoint (the API surface is opt-in per transaction — no auto-enrollment, no silent activation), finality (canonical finality F0-F7 per N1 — API callbacks at each stage), reconciliation (6 O2 tolerance policies — API reconciliation endpoints), evidence (N2 Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments — API evidence endpoints), failure handling (V1 + S1 — failure API + 7-stage lifecycle coordination), and the bank's technical responsibilities. Cross-references all existing API endpoints (READ-ONLY — no API surface modified). NOT a consumer/retail product.",
    targetAudience: ["BANK_TECHNICAL_INTEGRATION"],
    deliveryFormat: "SELF_PACED",
    durationHours: 8,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the technical perimeter: MITHQAL exposes API endpoints for finality coordination, evidence packaging, reconciliation, and failure handling. The bank's integration engineers integrate these APIs WITHIN the bank's security perimeter.",
      "State what MITHQAL is NOT: NOT a payment network, NOT a custody API, NOT a banking core replacement, NOT a smart contract platform for consumer dApps, NOT a Sharia-compliant instrument.",
      "State the bank boundary at the technical level: MITHQAL does NOT exfiltrate bank data, does NOT hold bank credentials, does NOT impersonate bank staff, does NOT write to the bank's general ledger without the bank's explicit per-transaction authorization.",
      "Apply MTQ optionality at the API surface: each MITHQAL API call is opt-in per transaction. No auto-enrollment, no silent activation, no background polling.",
      "Map canonical finality stages F0-F7 (per N1) to API callbacks: F0=INTENT (POST intent), F1=PRE_AUTHORIZATION (POST auth), F3=CONDITIONAL_COMMITMENT (POST commitment), F6=INSTITUTIONAL_FINALITY (POST finality), F7=REGULATORY_FINALITY (POST regulatory ack where applicable).",
      "Apply the 6 O2 reconciliation tolerance policies to API reconciliation endpoints: GET reconciliation status, POST reconciliation break.",
      "Identify the N2 Evidence Fabric evidence endpoints: GET evidence package (15-field + SHA-256 commitment), POST evidence attestation.",
      "Identify V1 + S1 failure-handling API: POST failure event (9 event types per S1), GET failure lifecycle (7-stage), POST alternative route.",
      "State the integration engineer's responsibilities: (1) integrate MITHQAL APIs within the bank's security perimeter; (2) maintain credential hygiene (no MITHQAL-side credential storage); (3) own the bank-side rate limiting + retry policy; (4) own the bank-side idempotency key management; (5) own the bank-side circuit breaker for MITHQAL API failures.",
      "State the SRE responsibilities: (1) own the bank-side observability stack (logs + metrics + traces for MITHQAL API calls); (2) own the bank-side incident response runbook for MITHQAL API outages; (3) own the bank-side chaos engineering exercises for MITHQAL API failure scenarios.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7 — API callbacks)",
      "v25.3.8 N2 (Institutional Evidence Fabric — evidence endpoints)",
      "v25.3.10 O2 (6 reconciliation tolerance policies — reconciliation endpoints)",
      "v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle — failure API)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE applies to API coordination)",
      "All existing /api/* endpoints (READ-ONLY — no API surface modified)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Lead Settlements Engineer + Integration Engineer (Y2 ENGINEERING category, 2 FTE) — unblocks GATE-A1-ROUTING + GATE-A8-BANK_INTEGRATION (next external gates), reduces W2 risk TECHNOLOGY-002 (no integration guide) + TECHNOLOGY-003 (no SRE runbook), protects bank-pilot revenue protection (banks require integration guide before connecting), produces technical-integration-guide evidence artifact required by Q2 GATE-A1 + GATE-A8 acceptance criteria.",
  },

  // 7. OPERATOR RUNBOOK
  {
    moduleId: "OPERATOR_RUNBOOK",
    name: "Operator Runbook — Day-in-the-life for settlement ops + reconciliation ops",
    description:
      "An institutional runbook for bank settlement operations analysts and reconciliation operations analysts. Teaches what MITHQAL is (a settlement optionality layer producing daily operations work — intent intake, authorization, commitment, finality, reconciliation, evidence packaging — within the bank's operations perimeter), what MITHQAL is NOT (NOT a self-executing system, NOT an autonomous agent, NOT a replacement for ops analysts, NOT Sharia-certified), the bank boundary (banks remain the operations party of record — MITHQAL coordinates work WITHIN the bank's operations runbook), MTQ optionality from an operations standpoint (each transaction's MITHQAL election is an explicit ops decision — no auto-election), finality (canonical finality F0-F7 per N1 — ops recognizes F6=INSTITUTIONAL_FINALITY as settlement-complete), reconciliation (6 O2 tolerance policies — ops runs daily reconciliation + breaks management), evidence (N2 Evidence Fabric — ops packages daily evidence per the bank's retention policy), failure handling (V1 + S1 — ops executes the 7-stage lifecycle under S1's NO_BYPASS_RULE), and the operations analyst's responsibilities. Cross-references O1 Institutional Settlement Obligation Registry (13 fields) + O2 reconciliation tolerance policies. NOT a consumer/retail product.",
    targetAudience: ["BANK_OPERATIONS"],
    deliveryFormat: "DOCUMENT",
    durationHours: 6,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the operations perimeter: MITHQAL produces daily operations work — intent intake, authorization, commitment, finality, reconciliation, evidence packaging — within the bank's operations perimeter.",
      "State what MITHQAL is NOT: NOT a self-executing system, NOT an autonomous agent, NOT a replacement for ops analysts, NOT a 'settle-itself' button.",
      "State the bank boundary at the operations level: banks remain the operations party of record. MITHQAL coordinates work WITHIN the bank's operations runbook; it does NOT replace the runbook.",
      "Apply MTQ optionality at the operations level: each transaction's MITHQAL election is an explicit ops decision per the bank's operations policy. No auto-election.",
      "Map canonical finality stages F0-F7 (per N1) to operations: F0=INTENT (ops intake), F1=PRE_AUTHORIZATION (ops authorization queue), F3=CONDITIONAL_COMMITMENT (ops commitment logged), F6=INSTITUTIONAL_FINALITY (ops marks settlement-complete), F7=REGULATORY_FINALITY (ops files regulator report where applicable).",
      "Run daily reconciliation using the 6 O2 tolerance policies: LEDGER_TO_LEDGER=1bps, BANK_ATTESTATION=5bps, CUSTODY_QUANTITY=10bps, MARKET_VALUATION=50bps, FX_VALUATION=20bps, STRESSED_VALUATION=200bps. Each breach triggers a reconciliation break + ops investigation.",
      "Package daily evidence per N2 Evidence Fabric: 15-field EvidencePackage + SHA-256 commitment. Store per the bank's retention policy (typically 7 years for BSA/AML purposes).",
      "Execute the S1 7-stage failure-handling lifecycle: DETECT → FREEZE_SAFE_HALT → ASSESS → ALTERNATIVE_ROUTE → RESUME → RECONCILE → EVIDENCE. Apply NO_BYPASS_RULE: ops may NOT bypass any stage.",
      "Maintain the O1 Institutional Settlement Obligation Registry (13 fields): obligation ID, obligor, beneficiary, principal, currency, finality domain, evidence reference, etc.",
      "State the ops analyst's responsibilities: (1) own daily intake + authorization + commitment + finality + reconciliation + evidence; (2) own the O1 obligation registry entries; (3) own the O2 tolerance breach investigations; (4) own the S1 lifecycle execution; (5) own the N2 evidence packaging.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING", "COMPLIANCE_BRIEFING"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7)",
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)",
      "v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)",
      "v25.3.10 O2 (6 reconciliation tolerance policies)",
      "v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle + NO_BYPASS_RULE)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Operations Manager + 2 Settlement Ops Analysts (Y2 OPERATIONS category, 3 FTE) — unblocks GATE-A4-RECONCILIATION (next external gate), reduces W2 risk OPERATIONS-001 (no ops runbook defined) + OPERATIONS-002 (no reconciliation ops), protects bank-pilot revenue protection (banks require ops runbook before transaction), produces operator-runbook evidence artifact required by Q2 GATE-A4 acceptance criterion.",
  },

  // 8. INCIDENT GUIDE
  {
    moduleId: "INCIDENT_GUIDE",
    name: "Incident Guide — MITHQAL incident response for bank IR coordinator + on-call",
    description:
      "An institutional incident guide for bank Incident Response Coordinator and on-call engineers. Teaches what MITHQAL is (a settlement optionality layer that may be a SOURCE of incidents (API outages, reconciliation breaks, finality failures) and a COORDINATOR of incident response (per S1 SettlementContinuityFabric 9 events × 7-stage lifecycle)), what MITHQAL is NOT (NOT an autonomous incident resolver, NOT a self-healing system, NOT a substitute for the bank's IR program, NOT Sharia-certified), the bank boundary (banks remain the IR program of record — MITHQAL coordinates evidence WITHIN the bank's IR runbook), MTQ optionality from an IR standpoint (each MITHQAL settlement is an IR exposure — incidents on MITHQAL settlement may cascade to the bank's books), finality (canonical finality F0-F7 per N1 — incidents at each stage have different blast radius), reconciliation (6 O2 tolerance policies — breach IS an incident), evidence (N2 Evidence Fabric — IR evidence packages admissible to regulators, NOT yet tested), failure handling (V1 6 forbidden assumptions + S1 9 events × 7-stage lifecycle with NO_BYPASS_RULE — IR coordinator owns the FREEZE_SAFE_HALT decision), and the IR coordinator's responsibilities. NOT a consumer/retail product.",
    targetAudience: ["BANK_INCIDENT_RESPONSE"],
    deliveryFormat: "TABLETOP",
    durationHours: 4,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the IR perimeter: MITHQAL may be a SOURCE of incidents (API outages, reconciliation breaks, finality failures, cyber events affecting MITHQAL APIs) and a COORDINATOR of incident response (per S1).",
      "State what MITHQAL is NOT: NOT an autonomous incident resolver, NOT a self-healing system, NOT a substitute for the bank's IR program, NOT a 'kill switch' that can shut down the bank.",
      "State the bank boundary at the IR level: banks remain the IR program of record. MITHQAL coordinates evidence WITHIN the bank's IR runbook; it does NOT replace the runbook and does NOT bypass the bank's incident commander.",
      "Apply MTQ optionality at the IR level: each MITHQAL settlement is an IR exposure. An incident on MITHQAL settlement may cascade to the bank's books — IR coordinator must understand the cascade.",
      "Map canonical finality stages F0-F7 (per N1) to incident blast radius: F0=INTENT (small — can cancel), F3=CONDITIONAL_COMMITMENT (medium — must unwind), F6=INSTITUTIONAL_FINALITY (large — settlement complete, books moved), F7=REGULATORY_FINALITY (extra-large — regulator-visible).",
      "Apply the 6 O2 reconciliation tolerance policies as incident triggers: any breach IS an incident (severity per tolerance: STRESSED_VALUATION=200bps breach is a Sev-2 incident, LEDGER_TO_LEDGER=1bps is a Sev-4 incident).",
      "Identify the N2 Evidence Fabric as IR-evidence-intended BUT NOT yet regulator-tested. State that the bank's IR coordinator must independently assess regulator acceptance per incident type.",
      "Apply the V1 6 forbidden assumptions to incident response: (1) do NOT assume the bank can settle — verify; (2) do NOT assume the custodian will perform — verify; (3) do NOT assume the jurisdiction allows — verify; (4) do NOT assume the contract is enforceable — verify; (5) do NOT assume the regulator will accept — verify; (6) do NOT assume the evidence is admissible — verify.",
      "Execute the S1 7-stage lifecycle under NO_BYPASS_RULE: DETECT (automated alert), FREEZE_SAFE_HALT (IR coordinator decision — must NOT be bypassed), ASSESS (impact assessment), ALTERNATIVE_ROUTE (manual selection), RESUME (IR coordinator authorization), RECONCILE (post-incident reconciliation), EVIDENCE (N2 evidence package).",
      "Identify the 9 S1 event types: BANK_DEFAULT, CUSTODIAN_FAILURE, RAIL_OUTAGE, JURISDICTION_RESTRICTION, LIQUIDITY_FAILURE, CYBER_EVENT, FINALITY_ORACLE_FAILURE, POLICY_EXPIRATION, RECONCILIATION_BREAK. Each has a distinct IR runbook annex.",
      "State the IR coordinator's responsibilities: (1) own the FREEZE_SAFE_HALT decision; (2) own the cascade impact assessment; (3) own the alternative-route authorization; (4) own the regulator notification (where required); (5) own the post-incident N2 evidence package; (6) own the post-incident review + runbook update.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING", "COMPLIANCE_BRIEFING", "RISK_BRIEFING"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7)",
      "v25.3.8 N2 (Institutional Evidence Fabric — IR evidence packages)",
      "v25.3.10 O2 (6 reconciliation tolerance policies — incident triggers)",
      "v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle + NO_BYPASS_RULE)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions + COORDINATION_RULE)",
      "v25.3.21 Z1 P41 (Jurisdiction Truth Model — JURISDICTION_RESTRICTION event + UNKNOWN=CONSERVATIVE_BLOCK)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Incident Response Coordinator (Y2 OPERATIONS category) — unblocks GATE-A7-FAILURE_MANAGEMENT (next external gate), reduces W2 risk OPERATIONS-003 (no IR coordinator) + TECHNOLOGY-004 (no IR runbook), protects bank-pilot revenue protection (banks require IR coordinator before transaction), produces incident-guide evidence artifact required by Q2 GATE-A7 acceptance criterion.",
  },

  // 9. RECONCILIATION GUIDE
  {
    moduleId: "RECONCILIATION_GUIDE",
    name: "Reconciliation Guide — MITHQAL reconciliation for ops + audit",
    description:
      "An institutional guide for bank reconciliation operations analysts, internal audit, and external audit engagement teams. Teaches what MITHQAL is (a settlement optionality layer producing reconciliation work across 6 dimensions per O2 — LEDGER_TO_LEDGER, BANK_ATTESTATION, CUSTODY_QUANTITY, MARKET_VALUATION, FX_VALUATION, STRESSED_VALUATION — within the bank's reconciliation perimeter), what MITHQAL is NOT (NOT a reconciliation engine, NOT an audit substitute, NOT a guarantee of ledger accuracy, NOT Sharia-certified), the bank boundary (banks remain the reconciliation party of record — MITHQAL coordinates evidence WITHIN the bank's reconciliation policy), MTQ optionality from a reconciliation standpoint (electing MITHQAL settlement optionality triggers 6-dimension reconciliation per O2), finality (canonical finality F0-F7 per N1 — reconciliation runs at F6+ post-settlement), reconciliation (6 O2 tolerance policies — this module's core), evidence (N2 Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments, audit-evidence-intended), failure handling (V1 — reconciliation breaks trigger the S1 RECONCILIATION_BREAK event), and the reconciliation analyst's responsibilities. NOT a consumer/retail product.",
    targetAudience: ["BANK_OPERATIONS", "BANK_AUDIT_INTERNAL", "BANK_EXTERNAL_AUDITORS"],
    deliveryFormat: "DOCUMENT",
    durationHours: 5,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the reconciliation perimeter: MITHQAL produces reconciliation work across 6 dimensions per O2 — within the bank's reconciliation perimeter. The bank remains the reconciliation party of record.",
      "State what MITHQAL is NOT: NOT a reconciliation engine, NOT an audit substitute, NOT a guarantee of ledger accuracy, NOT a 'true-up' calculator.",
      "State the bank boundary at the reconciliation level: banks remain the reconciliation party of record. MITHQAL coordinates evidence WITHIN the bank's reconciliation policy; it does NOT replace the bank's reconciliation engine and does NOT replace the bank's audit.",
      "Apply MTQ optionality at the reconciliation level: electing MITHQAL settlement optionality triggers 6-dimension reconciliation per O2 — each dimension has its own tolerance, its own owner, its own investigation trigger.",
      "Map canonical finality stages F0-F7 (per N1) to reconciliation timing: F0-F3 (intra-day reconciliation), F6+ (post-settlement reconciliation), F7 (regulator-acknowledged reconciliation).",
      "Run the 6 O2 reconciliation tolerance policies end-to-end: LEDGER_TO_LEDGER=1bps (core ledger to sub-ledger), BANK_ATTESTATION=5bps (bank attests to ledger), CUSTODY_QUANTITY=10bps (custody quantity to ledger), MARKET_VALUATION=50bps (mark-to-market to oracle), FX_VALUATION=20bps (FX rate to benchmark), STRESSED_VALUATION=200bps (stressed valuation to stress oracle). Each breach triggers a reconciliation break + investigation + S1 RECONCILIATION_BREAK event.",
      "Package N2 Evidence Fabric evidence for audit: 15-field EvidencePackage + SHA-256 commitment. The package is audit-evidence-intended BUT NOT yet independently audit-confirmed. The bank's audit (internal + external) must independently assess audit admissibility.",
      "Apply V1 to reconciliation breaks: a reconciliation break is a failure event — V1's 6 forbidden assumptions apply (do NOT assume the break is benign, do NOT assume the counterparty will true-up, do NOT assume the custodian is correct, do NOT assume the oracle is correct, do NOT assume the FX rate is correct, do NOT assume the stressed valuation is correct).",
      "Execute the S1 RECONCILIATION_BREAK event lifecycle: DETECT (tolerance breach alert) → FREEZE_SAFE_HALT (suspend further settlements) → ASSESS (root cause) → ALTERNATIVE_ROUTE (manual reconciliation if needed) → RESUME (post-fix) → RECONCILE (true-up) → EVIDENCE (N2 package).",
      "State the reconciliation analyst's responsibilities: (1) own daily 6-dimension reconciliation; (2) own the O2 tolerance breach investigations; (3) own the S1 RECONCILIATION_BREAK lifecycle execution; (4) own the N2 evidence packaging for audit; (5) own the audit-liaison for reconciliation evidence.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING", "OPERATOR_RUNBOOK"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7 — reconciliation timing)",
      "v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments)",
      "v25.3.10 O2 (6 reconciliation tolerance policies — this module's core)",
      "v25.3.13 S1 (SettlementContinuityFabric — RECONCILIATION_BREAK event × 7-stage lifecycle)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions)",
      "v25.3.18 W2 (Enterprise Risk Register — reconciliation risk entries)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Operations Manager + 2 Settlement Ops Analysts (Y2 OPERATIONS category, 3 FTE) + Internal Audit Lead + QA Analyst (Y2 INDEPENDENT_ASSURANCE category, 2 FTE) — unblocks GATE-A4-RECONCILIATION + GATE-A5-EVIDENCE (next external gates), reduces W2 risk OPERATIONS-002 (no reconciliation ops) + ASSURANCE-001 (no internal audit) + ASSURANCE-002 (no external audit firm engaged), protects bank-pilot revenue protection (banks require reconciliation guide before transaction), produces reconciliation-guide + audit-evidence artifact required by Q2 GATE-A4 + GATE-A5 acceptance criteria.",
  },

  // 10. EVIDENCE GUIDE
  {
    moduleId: "EVIDENCE_GUIDE",
    name: "Evidence Guide — MITHQAL evidence packaging for ops + audit + compliance",
    description:
      "An institutional guide for bank operations analysts, internal audit, external audit engagement teams, and compliance officers. Teaches what MITHQAL is (a settlement optionality layer producing evidence packages per N2 Institutional Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments — within the bank's evidence retention perimeter), what MITHQAL is NOT (NOT a primary record (the bank's ledger is the primary record), NOT an audit opinion, NOT a regulator filing, NOT Sharia-certified), the bank boundary (banks remain the evidence retention party of record — MITHQAL coordinates evidence packaging WITHIN the bank's evidence policy), MTQ optionality from an evidence standpoint (electing MITHQAL settlement optionality triggers N2 evidence packaging — opt-out means no MITHQAL evidence), finality (canonical finality F0-F7 per N1 — evidence packages per stage), reconciliation (6 O2 tolerance policies — each breach produces a reconciliation evidence package), evidence (N2 Evidence Fabric — this module's core; 15-field EvidencePackage + SHA-256 commitment + lifecycle + publication rules), failure handling (V1 + S1 — each failure event produces a failure evidence package), and the operations analyst's responsibilities for evidence packaging. NOT a consumer/retail product.",
    targetAudience: ["BANK_OPERATIONS", "BANK_AUDIT_INTERNAL", "BANK_EXTERNAL_AUDITORS", "BANK_COMPLIANCE_OFFICERS"],
    deliveryFormat: "DOCUMENT",
    durationHours: 5,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the evidence perimeter: MITHQAL produces evidence packages per N2 Institutional Evidence Fabric (15-field EvidencePackage + SHA-256 commitment) within the bank's evidence retention perimeter. The bank remains the evidence retention party of record.",
      "State what MITHQAL is NOT: NOT a primary record (the bank's general ledger is the primary record), NOT an audit opinion, NOT a regulator filing, NOT a court-admissible guarantee (admissibility is for the bank's counsel to assess).",
      "State the bank boundary at the evidence level: banks remain the evidence retention party of record. MITHQAL coordinates evidence packaging WITHIN the bank's evidence policy; it does NOT replace the bank's evidence retention system and does NOT replace the bank's audit trail.",
      "Apply MTQ optionality at the evidence level: electing MITHQAL settlement optionality triggers N2 evidence packaging. Opt-out means no MITHQAL evidence package (the bank's own ledger remains the primary record in either case).",
      "Map canonical finality stages F0-F7 (per N1) to evidence packages: F0=INTENT (intent evidence package), F3=CONDITIONAL_COMMITMENT (commitment evidence package), F6=INSTITUTIONAL_FINALITY (finality evidence package — primary), F7=REGULATORY_FINALITY (regulator-acknowledged evidence package).",
      "Apply the 6 O2 reconciliation tolerance policies to evidence: each tolerance breach produces a reconciliation break evidence package (with root-cause analysis + true-up record).",
      "Package N2 Evidence Fabric evidence end-to-end: 15-field EvidencePackage (evidenceId / type / source / hash / commitment / etc.) + SHA-256 commitment + lifecycle (CREATED → ATTESTED → ARCHIVED) + publication rules (who can access).",
      "Apply V1 + S1 to failure evidence: each S1 event (9 types) produces a failure evidence package per the 7-stage lifecycle (DETECT → FREEZE_SAFE_HALT → ASSESS → ALTERNATIVE_ROUTE → RESUME → RECONCILE → EVIDENCE). The EVIDENCE stage is where the N2 package is finalized.",
      "Apply N2 evidence lifecycle: CREATED (at F0 intent) → ATTESTED (at F6 finality) → ARCHIVED (per the bank's retention policy — typically 7 years for BSA/AML).",
      "State the operations analyst's evidence responsibilities: (1) own N2 evidence package creation at each finality stage; (2) own the SHA-256 commitment generation + storage; (3) own the lifecycle advancement (CREATED → ATTESTED → ARCHIVED); (4) own the publication-rule enforcement (who can access); (5) own the audit-liaison for evidence requests; (6) own the retention policy compliance.",
    ],
    prerequisites: ["EXECUTIVE_BRIEFING", "OPERATOR_RUNBOOK", "RECONCILIATION_GUIDE"],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7 — evidence packages per stage)",
      "v25.3.8 N2 (Institutional Evidence Fabric — this module's core; 15-field EvidencePackage + SHA-256 commitments + lifecycle + publication rules)",
      "v25.3.10 O2 (6 reconciliation tolerance policies — reconciliation break evidence)",
      "v25.3.13 S1 (SettlementContinuityFabric — failure evidence packages per 9 events × 7-stage lifecycle)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE applies to evidence packaging)",
      "v25.3.19 X1 (Data Governance 15×7=105 cells — evidence data governance)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Operations Manager + 2 Settlement Ops Analysts (Y2 OPERATIONS category, 3 FTE) + Internal Audit Lead + QA Analyst (Y2 INDEPENDENT_ASSURANCE category, 2 FTE) — unblocks GATE-A5-EVIDENCE (next external gate), reduces W2 risk ASSURANCE-001 (no internal audit) + ASSURANCE-002 (no external audit firm engaged) + DATA-001 (no evidence retention policy), protects bank-pilot revenue protection (banks require evidence guide before transaction), produces evidence-guide artifact required by Q2 GATE-A5 acceptance criterion.",
  },

  // 11. CERTIFICATION/TRAINING PATHWAY
  {
    moduleId: "CERTIFICATION_TRAINING_PATHWAY",
    name: "Certification/Training Pathway — Institutional certification only (no individual-investor credential)",
    description:
      "An institutional certification pathway for bank staff completing the 10 prior modules. This is institutional certification only — no individual-investor credential. Teaches what MITHQAL is (a settlement optionality layer requiring certified bank operators — operators who have completed the 10 prior modules and passed a scored assessment stored in N2 Evidence Fabric), what MITHQAL is NOT (NOT an individual-investor credential, NOT a public certification, NOT a consumer education product, NOT Sharia-certified), the bank boundary (banks remain the certification party of record — MITHQAL coordinates certification evidence WITHIN the bank's HR + compliance perimeter), MTQ optionality from a certification standpoint (certification is REQUIRED for bank operators handling MITHQAL settlement — not optional), finality (canonical finality F0-F7 per N1 — certified operators only at F6+), reconciliation (6 O2 tolerance policies — certified operators run reconciliation), evidence (N2 Evidence Fabric — certification evidence package + SHA-256 commitment + revocation lifecycle), failure handling (V1 + S1 — certified operators execute the 7-stage lifecycle), and the certification owner's responsibilities. The pathway has 4 levels: LEVEL_1_AWARE (Executive Briefing + Compliance Briefing), LEVEL_2_OPERATOR (+ Operator Runbook + Reconciliation Guide + Evidence Guide), LEVEL_3_INCIDENT (+ Incident Guide + Risk Briefing), LEVEL_4_INTEGRATION (+ Technical Integration Guide + Treasury Briefing + Legal Briefing). NOT a consumer/retail product. NOT an individual-investor credential. Institutional certification only — no individual-investor credential.",
    targetAudience: ["ALL_BANK_AUDIENCES"],
    deliveryFormat: "INSTRUCTOR_LED",
    durationHours: 40,
    keyTopics: [
      "WHAT_MITHQAL_IS",
      "WHAT_MITHQAL_IS_NOT",
      "BANK_BOUNDARY",
      "MTQ_OPTIONALITY",
      "FINALITY",
      "RECONCILIATION",
      "EVIDENCE",
      "FAILURE_HANDLING",
      "RESPONSIBILITIES",
    ],
    learningObjectives: [
      "State the certification perimeter: MITHQAL requires certified bank operators. Certification is institutional (bank-sponsored, bank-attested) — NOT an individual-investor credential, NOT a public certification.",
      "State what MITHQAL is NOT: NOT an individual-investor credential, NOT a public certification, NOT a consumer education product, NOT a CFA-style credential, NOT transferable between employers.",
      "State the bank boundary at the certification level: banks remain the certification party of record. MITHQAL coordinates certification evidence WITHIN the bank's HR + compliance perimeter; it does NOT issue credentials directly to individuals and does NOT bypass the bank's employment relationship.",
      "Apply MTQ optionality at the certification level: certification is REQUIRED for bank operators handling MITHQAL settlement (not optional). An uncertified operator must NOT execute MITHQAL settlement at F6+.",
      "Map canonical finality stages F0-F7 (per N1) to certification: F0-F5 (any operator under supervision), F6+ (LEVEL_2_OPERATOR+ certified operators only), F7 (LEVEL_3_INCIDENT+ certified operators only, with IR coordinator sign-off).",
      "Run reconciliation under certification: certified operators (LEVEL_2+) run the 6 O2 reconciliation tolerance policies. Uncertified staff must NOT execute reconciliation true-ups.",
      "Package certification evidence per N2 Evidence Fabric: certification evidence package (operator ID + module ID + score + certifier + timestamp + SHA-256 commitment + revocation status). Lifecycle: CERTIFIED → SUSPENDED (on incident) → REVOKED (on termination or material breach).",
      "Execute failure handling under certification: certified operators (LEVEL_3+) execute the S1 7-stage lifecycle under NO_BYPASS_RULE. Uncertified staff must NOT execute FREEZE_SAFE_HALT decisions.",
      "Identify the 4 certification levels: LEVEL_1_AWARE (Executive Briefing + Compliance Briefing — 4 hours), LEVEL_2_OPERATOR (+ Operator Runbook + Reconciliation Guide + Evidence Guide — +17 hours), LEVEL_3_INCIDENT (+ Incident Guide + Risk Briefing — +7 hours), LEVEL_4_INTEGRATION (+ Technical Integration Guide + Treasury Briefing + Legal Briefing — +13.5 hours). Total pathway = 41.5 hours of instruction + scored assessment per level.",
      "State the certification owner's responsibilities: (1) own the certification evidence package per N2; (2) own the revocation decision (on termination or material breach); (3) own the recertification cycle (annual); (4) own the bank's HR + compliance liaison; (5) own the Q2 GATE-A5-EVIDENCE acceptance criterion (certification evidence is required).",
    ],
    prerequisites: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
    ],
    crossReferences: [
      "v25.3.8 N1 (canonical finality model F0-F7 — certification gates per stage)",
      "v25.3.8 N2 (Institutional Evidence Fabric — certification evidence package + SHA-256 commitment + revocation lifecycle)",
      "v25.3.10 O2 (6 reconciliation tolerance policies — certified operators run reconciliation)",
      "v25.3.11 Q2 (pilot gate framework — GATE-A5-EVIDENCE requires certification evidence)",
      "v25.3.13 S1 (SettlementContinuityFabric — LEVEL_3+ certified operators execute 7-stage lifecycle)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — certified operators only at F6+)",
      "v25.3.20 Y2 (Institutionalization Operating Plan — 11 role categories feed certification levels)",
      "v25.3.21 Z1 P40 (Sharia/AAOIFI Governance — OPTIONAL pathway, NOT a certification criterion)",
    ],
    status: "DRAFT",
    cohortCount: 0,
    certifiedOperatorCount: 0,
    lastDeliveryDate: null,
    ownerRole:
      "SPEND JUSTIFICATION: Bank Onboarding Manager (Y2 LEGAL_REGULATORY_EXPERTISE, 0.5 FTE) + Internal Audit Lead (Y2 INDEPENDENT_ASSURANCE, 1 FTE) — unblocks GATE-A5-EVIDENCE + GATE-A8-BANK_INTEGRATION (next external gates), reduces W2 risk GOVERNANCE-003 (no certification pathway) + ASSURANCE-003 (no certified operators), protects bank-pilot revenue protection (banks require certification pathway before scaling), produces certification-pathway evidence artifact required by Q2 GATE-A5 + GATE-A8 acceptance criteria.",
  },
];

// ============================================================================
// CURRICULUM TOPIC INDEX (the 9 canonical topics per directive)
// ============================================================================

export const CURRICULUM_TOPICS: {
  topicId: CurriculumTopic;
  name: string;
  directiveQuote: string;
  taughtIn: TrainingModuleId[];
}[] = [
  {
    topicId: "WHAT_MITHQAL_IS",
    name: "What MITHQAL is",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "WHAT_MITHQAL_IS_NOT",
    name: "What MITHQAL is not",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "BANK_BOUNDARY",
    name: "The bank boundary",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "MTQ_OPTIONALITY",
    name: "MTQ optionality",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "FINALITY",
    name: "Finality",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "RECONCILIATION",
    name: "Reconciliation",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "EVIDENCE",
    name: "Evidence",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "FAILURE_HANDLING",
    name: "Failure handling",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
  {
    topicId: "RESPONSIBILITIES",
    name: "Responsibilities",
    directiveQuote:
      "Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities.",
    taughtIn: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "CERTIFICATION_TRAINING_PATHWAY",
    ],
  },
];

// ============================================================================
// CERTIFICATION LEVELS (4 levels per CERTIFICATION_TRAINING_PATHWAY module)
// ============================================================================

export type CertificationLevel =
  | "LEVEL_1_AWARE"
  | "LEVEL_2_OPERATOR"
  | "LEVEL_3_INCIDENT"
  | "LEVEL_4_INTEGRATION";

export const CERTIFICATION_LEVELS: {
  levelId: CertificationLevel;
  name: string;
  requiredModules: TrainingModuleId[];
  cumulativeHours: number;
  finalityStageUnlocked: string;
  certifiedOperatorsCurrent: number;
}[] = [
  {
    levelId: "LEVEL_1_AWARE",
    name: "Level 1 — Aware",
    requiredModules: ["EXECUTIVE_BRIEFING", "COMPLIANCE_BRIEFING"],
    cumulativeHours: 4,
    finalityStageUnlocked: "F0-F5 (under supervision)",
    certifiedOperatorsCurrent: 0,
  },
  {
    levelId: "LEVEL_2_OPERATOR",
    name: "Level 2 — Operator",
    requiredModules: [
      "EXECUTIVE_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "OPERATOR_RUNBOOK",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
    ],
    cumulativeHours: 21,
    finalityStageUnlocked: "F6+ (institutional finality)",
    certifiedOperatorsCurrent: 0,
  },
  {
    levelId: "LEVEL_3_INCIDENT",
    name: "Level 3 — Incident",
    requiredModules: [
      "EXECUTIVE_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "OPERATOR_RUNBOOK",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
      "INCIDENT_GUIDE",
      "RISK_BRIEFING",
    ],
    cumulativeHours: 28,
    finalityStageUnlocked: "F7 (regulatory finality + IR coordinator sign-off)",
    certifiedOperatorsCurrent: 0,
  },
  {
    levelId: "LEVEL_4_INTEGRATION",
    name: "Level 4 — Integration",
    requiredModules: [
      "EXECUTIVE_BRIEFING",
      "LEGAL_BRIEFING",
      "COMPLIANCE_BRIEFING",
      "RISK_BRIEFING",
      "TREASURY_BRIEFING",
      "TECHNICAL_INTEGRATION_GUIDE",
      "OPERATOR_RUNBOOK",
      "INCIDENT_GUIDE",
      "RECONCILIATION_GUIDE",
      "EVIDENCE_GUIDE",
    ],
    cumulativeHours: 41.5,
    finalityStageUnlocked: "All stages + integration + treasury + legal",
    certifiedOperatorsCurrent: 0,
  },
];

// ============================================================================
// AGGREGATES + STATUS
// ============================================================================

export const BANK_ONBOARDING_TRAINING_VERSION = "v25.3.21";
export const BANK_ONBOARDING_TRAINING_SOURCE =
  "src/lib/bank-onboarding-training-framework.ts";
export const BANK_ONBOARDING_TRAINING_STATUS =
  "ALL_11_MODULES_DRAFT — no training delivered, no cohort trained, no operator certified, no trainer certified.";

export const MODULE_COUNT = TRAINING_MODULES.length; // 11
export const CURRICULUM_TOPIC_COUNT = CURRICULUM_TOPICS.length; // 9
export const CERTIFICATION_LEVEL_COUNT = CERTIFICATION_LEVELS.length; // 4

export const TOTAL_HOURS = TRAINING_MODULES.reduce(
  (sum, m) => sum + m.durationHours,
  0,
);

export const TOTAL_COHORTS_TRAINED = TRAINING_MODULES.reduce(
  (sum, m) => sum + m.cohortCount,
  0,
); // 0 (honest)

export const TOTAL_CERTIFIED_OPERATORS =
  CERTIFICATION_LEVELS.reduce((sum, l) => sum + l.certifiedOperatorsCurrent, 0); // 0 (honest)

export const BANK_ONBOARDING_TRAINING_HONEST_STATE = {
  allModulesDraft: TRAINING_MODULES.every((m) => m.status === "DRAFT"),
  allCohortCountsZero: TRAINING_MODULES.every((m) => m.cohortCount === 0),
  allCertifiedOperatorCountsZero: TRAINING_MODULES.every(
    (m) => m.certifiedOperatorCount === 0,
  ),
  allLastDeliveryDatesNull: TRAINING_MODULES.every(
    (m) => m.lastDeliveryDate === null,
  ),
  allCertificationLevelsZero: CERTIFICATION_LEVELS.every(
    (l) => l.certifiedOperatorsCurrent === 0,
  ),
  isConsumerRetailProduct: false,
  institutionalScopeOnly: true,
  honestStateNote:
    "PROMPT 38 requires an honest training framework. The honest state of a training framework that has not yet delivered training is DRAFT. All 11 modules are DRAFT, all cohort counts are 0, all certified-operator counts are 0, all last-delivery dates are null. This is the HONEST state at v25.3.21.",
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

export function getModule(
  moduleId: TrainingModuleId,
): TrainingModule | undefined {
  return TRAINING_MODULES.find((m) => m.moduleId === moduleId);
}

export function getModulesByTopic(
  topic: CurriculumTopic,
): TrainingModule[] {
  return TRAINING_MODULES.filter((m) => m.keyTopics.includes(topic));
}

export function getModulesByAudience(
  audience: TargetAudience,
): TrainingModule[] {
  return TRAINING_MODULES.filter((m) => m.targetAudience.includes(audience));
}

export function getCertificationLevel(
  levelId: CertificationLevel,
): { levelId: CertificationLevel; name: string; requiredModules: TrainingModuleId[]; cumulativeHours: number; finalityStageUnlocked: string; certifiedOperatorsCurrent: number } | undefined {
  return CERTIFICATION_LEVELS.find((l) => l.levelId === levelId);
}

// ============================================================================
// RUNTIME INVARIANTS (fail-fast at module load)
// ============================================================================

function assertAllElevenModulesPresent(): void {
  const expected: TrainingModuleId[] = [
    "EXECUTIVE_BRIEFING",
    "LEGAL_BRIEFING",
    "COMPLIANCE_BRIEFING",
    "RISK_BRIEFING",
    "TREASURY_BRIEFING",
    "TECHNICAL_INTEGRATION_GUIDE",
    "OPERATOR_RUNBOOK",
    "INCIDENT_GUIDE",
    "RECONCILIATION_GUIDE",
    "EVIDENCE_GUIDE",
    "CERTIFICATION_TRAINING_PATHWAY",
  ];
  const actual = TRAINING_MODULES.map((m) => m.moduleId);
  for (const id of expected) {
    if (!actual.includes(id)) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: missing required module ${id} (PROMPT 38 requires all 11 modules)`,
      );
    }
  }
  if (TRAINING_MODULES.length !== 11) {
    throw new Error(
      `BANK_ONBOARDING_TRAINING: expected exactly 11 modules, got ${TRAINING_MODULES.length}`,
    );
  }
}

function assertAllModulesDraft(): void {
  for (const m of TRAINING_MODULES) {
    if (m.status !== "DRAFT") {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${m.moduleId} must be DRAFT (got ${m.status}) per HONEST_DRAFT_STATE_RULE`,
      );
    }
  }
}

function assertAllCohortCountsZero(): void {
  for (const m of TRAINING_MODULES) {
    if (m.cohortCount !== 0) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${m.moduleId} cohortCount must be 0 (got ${m.cohortCount}) per HONEST_DRAFT_STATE_RULE`,
      );
    }
  }
}

function assertAllCertifiedOperatorCountsZero(): void {
  for (const m of TRAINING_MODULES) {
    if (m.certifiedOperatorCount !== 0) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${m.moduleId} certifiedOperatorCount must be 0 (got ${m.certifiedOperatorCount}) per HONEST_DRAFT_STATE_RULE`,
      );
    }
  }
}

function assertAllLastDeliveryDatesNull(): void {
  for (const m of TRAINING_MODULES) {
    if (m.lastDeliveryDate !== null) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${m.moduleId} lastDeliveryDate must be null (got ${m.lastDeliveryDate}) per HONEST_DRAFT_STATE_RULE`,
      );
    }
  }
}

function assertNotConsumerRetail(): void {
  for (const m of TRAINING_MODULES) {
    const lowerDesc = m.description.toLowerCase();
    if (lowerDesc.includes("consumer") || lowerDesc.includes("retail")) {
      // The only allowed mention is the explicit "NOT a consumer/retail product" disclaimer.
      if (
        lowerDesc.includes("not a consumer") ||
        lowerDesc.includes("not a retail") ||
        lowerDesc.includes("not a consumer/retail")
      ) {
        continue;
      }
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${m.moduleId} description references consumer/retail without disclaimer — violates NOT_CONSUMER_RETAIL_RULE`,
      );
    }
  }
  // The CERTIFICATION_TRAINING_PATHWAY must explicitly state 'institutional certification only — no individual-investor credential'.
  const pathway = getModule("CERTIFICATION_TRAINING_PATHWAY");
  if (!pathway) {
    throw new Error(
      "BANK_ONBOARDING_TRAINING: CERTIFICATION_TRAINING_PATHWAY module missing",
    );
  }
  const pathDesc = pathway.description.toLowerCase();
  if (
    !pathDesc.includes("institutional certification only") ||
    !pathDesc.includes("no individual-investor credential")
  ) {
    throw new Error(
      "BANK_ONBOARDING_TRAINING: CERTIFICATION_TRAINING_PATHWAY must state 'institutional certification only — no individual-investor credential' per NOT_CONSUMER_RETAIL_RULE",
    );
  }
}

function assertAllNineCurriculumTopicsCovered(): void {
  const expected: CurriculumTopic[] = [
    "WHAT_MITHQAL_IS",
    "WHAT_MITHQAL_IS_NOT",
    "BANK_BOUNDARY",
    "MTQ_OPTIONALITY",
    "FINALITY",
    "RECONCILIATION",
    "EVIDENCE",
    "FAILURE_HANDLING",
    "RESPONSIBILITIES",
  ];
  for (const topic of expected) {
    const modulesCovering = TRAINING_MODULES.filter((m) =>
      m.keyTopics.includes(topic),
    );
    if (modulesCovering.length === 0) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: curriculum topic ${topic} not covered in any module (PROMPT 38 requires all 9 topics)`,
      );
    }
  }
  if (CURRICULUM_TOPICS.length !== 9) {
    throw new Error(
      `BANK_ONBOARDING_TRAINING: expected 9 curriculum topics, got ${CURRICULUM_TOPICS.length}`,
    );
  }
}

function assertBankBoundaryTaught(): void {
  const bankBoundaryRequiredIn: TrainingModuleId[] = [
    "EXECUTIVE_BRIEFING",
    "LEGAL_BRIEFING",
    "COMPLIANCE_BRIEFING",
    "RISK_BRIEFING",
    "TREASURY_BRIEFING",
    "OPERATOR_RUNBOOK",
  ];
  for (const id of bankBoundaryRequiredIn) {
    const m = getModule(id);
    if (!m || !m.keyTopics.includes("BANK_BOUNDARY")) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${id} must include BANK_BOUNDARY in keyTopics per BANK_BOUNDARY_RULE`,
      );
    }
  }
}

function assertAllModulesHaveSpendJustification(): void {
  for (const m of TRAINING_MODULES) {
    if (!m.ownerRole || !m.ownerRole.includes("SPEND JUSTIFICATION:")) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: module ${m.moduleId} ownerRole must include 'SPEND JUSTIFICATION:' marker per Y2 SPEND_JUSTIFICATION_RULE`,
      );
    }
  }
}

function assertFourCertificationLevelsPresent(): void {
  const expected: CertificationLevel[] = [
    "LEVEL_1_AWARE",
    "LEVEL_2_OPERATOR",
    "LEVEL_3_INCIDENT",
    "LEVEL_4_INTEGRATION",
  ];
  const actual = CERTIFICATION_LEVELS.map((l) => l.levelId);
  for (const id of expected) {
    if (!actual.includes(id)) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: missing certification level ${id}`,
      );
    }
  }
  if (CERTIFICATION_LEVELS.length !== 4) {
    throw new Error(
      `BANK_ONBOARDING_TRAINING: expected 4 certification levels, got ${CERTIFICATION_LEVELS.length}`,
    );
  }
}

function assertAllCertificationLevelsZero(): void {
  for (const l of CERTIFICATION_LEVELS) {
    if (l.certifiedOperatorsCurrent !== 0) {
      throw new Error(
        `BANK_ONBOARDING_TRAINING: certification level ${l.levelId} certifiedOperatorsCurrent must be 0 (got ${l.certifiedOperatorsCurrent}) per HONEST_DRAFT_STATE_RULE`,
      );
    }
  }
}

// Execute all invariants at module load
assertAllElevenModulesPresent();
assertAllModulesDraft();
assertAllCohortCountsZero();
assertAllCertifiedOperatorCountsZero();
assertAllLastDeliveryDatesNull();
assertNotConsumerRetail();
assertAllNineCurriculumTopicsCovered();
assertBankBoundaryTaught();
assertAllModulesHaveSpendJustification();
assertFourCertificationLevelsPresent();
assertAllCertificationLevelsZero();
