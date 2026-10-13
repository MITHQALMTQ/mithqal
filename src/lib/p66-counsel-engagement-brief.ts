/**
 * MITHQAL — PROMPT 66: COUNSEL ENGAGEMENT & LEGAL OPINION BRIEFING
 *
 * Architecture FROZEN at v25.3.2. NO legal opinions from MITHQAL.
 * This is QUESTION PREPARATION, not legal conclusion.
 *
 * G0: G0_CONDITIONAL (documents deposited, counsel verification pending)
 * G1: READY_FOR_COUNSEL (50 questions, BLOCKED_BY_G0)
 * Primary corridor: C-AE-SG (UAE → Singapore)
 *
 * CRITICAL RULE: MITHQAL engineering and AI systems MUST NOT issue
 * or imply the legal opinion. Only qualified external counsel may.
 *
 * NOT PRODUCTION-AUTHORIZED.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LegalEvidenceStatus =
  | "PRIMARY_LEGAL_SOURCE" | "OFFICIAL_REGULATORY_SOURCE"
  | "EXTERNAL_PROFESSIONAL_ANALYSIS" | "MITHQAL_INTERNAL_DESIGN"
  | "MANAGEMENT_HYPOTHESIS" | "COUNSEL_QUESTION" | "UNKNOWN" | "CONTRADICTED" | "STALE";

export type CounselVerdict = "PERMITTED" | "PERMITTED_WITH_CONDITIONS" | "REQUIRES_LICENSE" | "REQUIRES_REGULATORY_APPROVAL" | "REQUIRES_REGULATED_PARTNER" | "NOT_PERMITTED" | "INSUFFICIENT_INFORMATION";

export interface EntityLegalRole {
  entity: string;
  currentStatus: string;
  ownershipStatus: string;
  controlStatus: string;
  intendedFunction: string;
  contractingRole: string;
  financialObligationRole: string;
  mtqRole: string;
  redemptionRole: string;
  backingRole: string;
  custodyRole: string;
  technologyRole: string;
  dataRole: string;
  governanceRole: string;
  jurisdiction: string;
  requiredAuthorization: string;
  legalQuestion: string;
  evidence: string;
  status: LegalEvidenceStatus;
  conflict: boolean;
  conflictDescription: string;
}

export interface MTQClassificationQuestion {
  questionId: string;
  question: string;
  evidenceStatus: LegalEvidenceStatus;
  currentMithqalPosition: string;
  counselMustDetermine: string;
}

export interface LegalContradiction {
  contradictionId: string;
  description: string;
  sourceA: string;
  sourceB: string;
  currentAuthority: string;
  legalSignificance: string;
  blockingStatus: "BLOCKING" | "NON_BLOCKING";
  counselQuestion: string;
  owner: string;
}

export interface PilotLegalBoundary {
  activity: string;
  classification: "ALLOWED_FOR_DISCUSSION" | "ALLOWED_FOR_TESTING_SUBJECT_TO_COUNSEL" | "PROHIBITED_UNTIL_VALIDATED" | "PROHIBITED";
}

export interface RegulatoryPerimeterItem {
  activity: string;
  mithqalEntity: string;
  bankEntity: string;
  thirdParty: string;
  requiredLicense: string;
  requiredApproval: string;
  legalQuestion: string;
  currentEvidence: string;
  counselRequired: boolean;
}

export interface CounselDeliverableItem {
  itemId: string;
  section: string;
  requirement: string;
}

export interface FinalStatus {
  g0Status: string;
  g1Status: string;
  primaryCorridor: string;
  legalScopeDefined: boolean;
  entityStructureDefined: boolean;
  mtqQuestionSetComplete: boolean;
  backingQuestionsComplete: boolean;
  redemptionQuestionsComplete: boolean;
  finalityQuestionsComplete: boolean;
  crossBorderQuestionsComplete: boolean;
  regulatoryPerimeterComplete: boolean;
  contractArchitectureComplete: boolean;
  counselBriefComplete: boolean;
  dataRoomIndexComplete: boolean;
  criticalLegalContradictions: number;
  primaryDocumentMissing: number;
  counselRequired: boolean;
  legalOpinionObtained: boolean;
  validatedJurisdictionCount: number;
  productionAuthorized: boolean;
  institutionallyValidated: boolean;
  nextExternalEvidence: string;
}

export interface ManagementDecision {
  counselReadiness: "READY_FOR_COUNSEL" | "BLOCKED_BY_G0" | "BLOCKED_BY_MISSING_PRIMARY_DOCUMENT" | "BLOCKED_BY_CORRIDOR" | "BLOCKED_BY_UNRESOLVED_CRITICAL_CONTRADICTION";
  primaryLegalObjective: string;
  theSingleLegalQuestion: string;
  criticalDependencies: string[];
  owner: string;
  nextExternalEvidence: string;
}

export interface CounselEngagementBrief {
  priorBaselines: string[];
  engagementObjective: string;
  corridorScope: { source: string; destination: string; asset: string; workflow: string; bankDep: string; custodyDep: string; fxDep: string; mtqDep: string; legalDep: string };
  entityLegalRoles: EntityLegalRole[];
  mtqClassificationQuestions: MTQClassificationQuestion[];
  backingCustodyQuestions: string[];
  redemptionQuestions: string[];
  bankMediatedModel: string;
  finalityQuestions: string[];
  crossBorderQuestions: string[];
  regulatoryPerimeter: RegulatoryPerimeterItem[];
  amlKycMapping: { obligation: string; bank: string; mithqal: string; custodian: string; other: string; unknown: string }[];
  contractArchitecture: { agreement: string; parties: string; purpose: string; unresolvedQuestions: string }[];
  pilotLegalBoundaries: PilotLegalBoundary[];
  counselRequestLetter: { section: string; content: string }[];
  dataRoomIndex: { folder: string; description: string }[];
  legalContradictions: LegalContradiction[];
  counselDeliverableSpec: CounselDeliverableItem[];
  counselSelectionFramework: { criterion: string; requirement: string }[];
  costResourceModel: { item: string; status: "QUOTED" | "ESTIMATED" | "ASSUMED" | "UNKNOWN" }[];
  managementOwnership: { role: string; holder: string }[];
  finalStatus: FinalStatus;
  managementDecision: ManagementDecision;
  honestState: { productionAuthorized: boolean; noLegalOpinionIssued: boolean; architectureNotModified: boolean; onlyCounselMayAnswer: boolean };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T22:55:00Z";

/* ------------------------------------------------------------------ */
/*  E. Entity Legal Role Matrix                                        */
/* ------------------------------------------------------------------ */

export const ENTITY_LEGAL_ROLES: EntityLegalRole[] = [
  {
    entity: "Jozour, LLC",
    currentStatus: "G0_CONDITIONAL — Operating Agreement Amendment + Resolution deposited (July 31, 2026). Entity formed October 24, 2019, New Jersey LLC, EIN 84-3470275. NOT counsel-verified.",
    ownershipStatus: "Sole Member: Mohamed Salah Eltonsy. No cap table deposited. Single-member LLC structure.",
    controlStatus: "Manager: Mohamed Salah Eltonsy. §1.2 grants broad authority. NOT counsel-verified for sufficiency.",
    intendedFunction: "Interim operator of MITHQAL project (§1.1). For-profit LLC operating a non-profit-character project (§1.8).",
    contractingRole: "Bank-facing contracting entity (§1.2(a): 'Executing contracts, agreements, and instruments'). 17 contract sections ALL DRAFT.",
    financialObligationRole: "Company holds assets in trust for Foundation (§1.4(c)). §1.7: existing debts/judgment acknowledged. Liability boundaries in §1.5 (indemnification).",
    mtqRole: "MTQ DISABLED. §1.3 references '100%+ Reserve Requirement' + 'No Discretionary Minting' but does not define MTQ obligor. Obligor role = INTERNAL_DESIGN.",
    redemptionRole: "No executed redemption agreement. mtq-redemption-value-consistency.ts: ONE canonical, PENDING. Redemption role = INTERNAL_DESIGN.",
    backingRole: "reserve-domains.ts: 2 domains. No qualified custodian. PBC: 0/14 predicates. Backing role = INTERNAL_DESIGN.",
    custodyRole: "No executed custody agreement. No qualified custodian engaged. Custody role = PENDING.",
    technologyRole: "§1.2(c): 'Developing, acquiring, licensing, and protecting intellectual property.' Resolution §3: IP held by Company. GitHub (MITHQALMTQ), website (mithqal.vercel.app).",
    dataRole: "No Data Processing Agreement. institutional-data-governance.ts: 15×7, 28 PENDING. Data role = INTERNAL_DESIGN.",
    governanceRole: "Sole Member + Manager structure. No board. No multi-party governance. Governance = sole-manager.",
    jurisdiction: "New Jersey, USA (§3.1: Governing Law). Registered: 116 Mallory Ave, Jersey City, NJ 07304.",
    requiredAuthorization: "UNKNOWN — requires counsel to determine what licenses/authorizations Jozour LLC needs to operate MITHQAL.",
    legalQuestion: "Is a New Jersey LLC the appropriate entity for operating an international settlement control plane? Does the sole-manager structure provide sufficient governance for bank contracting?",
    evidence: "Operating Agreement Amendment No. 1 (July 31, 2026) + Resolution (July 31, 2026). Both deposited + signed by Mohamed Salah Eltonsy.",
    status: "MITHQAL_INTERNAL_DESIGN",
    conflict: true,
    conflictDescription: "§1.8 (non-profit character) vs for-profit LLC structure. §1.7 (existing judgment) may affect bankability. Code references 4-entity structure (Holding/Operating/Technology/Oversight) but documents define 2-entity structure (Jozour LLC + future Foundation).",
  },
  {
    entity: "MITHQAL Foundation (proposed)",
    currentStatus: "NOT YET FORMED. §1.6: 'Entity A (Nonprofit): constitutional settlement institution — to be formed as MITHQAL Foundation Inc. (or equivalent)'. §1.4: assets to be transferred when formed.",
    ownershipStatus: "UNKNOWN — entity does not exist. No formation documents.",
    controlStatus: "UNKNOWN — entity does not exist.",
    intendedFunction: "Constitutional settlement institution (§1.6). Hold constitutional authority, governance responsibility, reserve oversight.",
    contractingRole: "UNKNOWN — entity not formed. No contracting authority established.",
    financialObligationRole: "UNKNOWN — entity not formed.",
    mtqRole: "UNKNOWN — entity not formed. MTQ obligor role may transfer to Foundation per §1.4.",
    redemptionRole: "UNKNOWN — entity not formed.",
    backingRole: "UNKNOWN — entity not formed. Reserve oversight intended per §1.6.",
    custodyRole: "UNKNOWN — entity not formed.",
    technologyRole: "UNKNOWN — assets to be transferred from Jozour LLC per §1.4.",
    dataRole: "UNKNOWN — entity not formed.",
    governanceRole: "Intended: constitutional authority + governance + reserve oversight (§1.6). NOT established.",
    jurisdiction: "UNKNOWN — not yet formed. Intended: nonprofit jurisdiction (to be determined by counsel).",
    requiredAuthorization: "UNKNOWN — entity not formed. All authorizations PENDING.",
    legalQuestion: "When should the Foundation be formed? In what jurisdiction? What governance structure? What happens if Jozour LLC operates indefinitely without forming the Foundation?",
    evidence: "§1.6 of Amendment (described, not executed). NOT a primary document — the Foundation does not exist.",
    status: "MANAGEMENT_HYPOTHESIS",
    conflict: false,
    conflictDescription: "",
  },
];

/* ------------------------------------------------------------------ */
/*  F. MTQ Legal Classification Questions (20)                        */
/* ------------------------------------------------------------------ */

export const MTQ_CLASSIFICATION_QUESTIONS: MTQClassificationQuestion[] = [
  { questionId: "MTQ-LQ-01", question: "What is the legal nature of MTQ?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "mtq-economic-definition.ts: 'permissioned, institutional, closed-loop settlement unit'", counselMustDetermine: "Legal classification under applicable law" },
  { questionId: "MTQ-LQ-02", question: "Does MTQ constitute money?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "mtq-economic-definition.ts: 12 isNotStatements include 'NOT money' (self-asserted, not legally determined)", counselMustDetermine: "Whether MTQ meets the legal definition of money" },
  { questionId: "MTQ-LQ-03", question: "Does MTQ constitute a deposit?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "NOT a deposit per mtq-economic-definition.ts (self-asserted)", counselMustDetermine: "Whether MTQ is a deposit under banking law" },
  { questionId: "MTQ-LQ-04", question: "Does MTQ constitute a payment instrument?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "Described as 'settlement unit' — payment instrument classification PENDING", counselMustDetermine: "Whether MTQ is a payment instrument" },
  { questionId: "MTQ-LQ-05", question: "Does MTQ constitute electronic money (e-money)?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "mtq-economic-definition.ts: NOT e-money (self-asserted)", counselMustDetermine: "Whether MTQ meets e-money definition" },
  { questionId: "MTQ-LQ-06", question: "Does MTQ constitute a security?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "mtq-economic-definition.ts: NOT a security (self-asserted). Legal classification PENDING_VALIDATION.", counselMustDetermine: "Whether MTQ meets the Howey test or equivalent security definition" },
  { questionId: "MTQ-LQ-07", question: "Does MTQ constitute a financial instrument?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "NOT classified", counselMustDetermine: "Whether MTQ is a financial instrument under MiFID II or equivalent" },
  { questionId: "MTQ-LQ-08", question: "Does MTQ constitute a virtual/digital asset?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "mtq-economic-definition.ts: NOT a cryptocurrency (self-asserted). Digital asset classification PENDING.", counselMustDetermine: "Whether MTQ is a virtual asset under FATF/VASP frameworks" },
  { questionId: "MTQ-LQ-09", question: "Does MTQ constitute a contractual claim?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "institutional-settlement-obligation-registry.ts: NO_LEGAL_OBLIGOR → NO_INSTITUTIONAL_OBLIGATION. Obligor PENDING.", counselMustDetermine: "What contractual claim an MTQ holder possesses" },
  { questionId: "MTQ-LQ-10", question: "Does MTQ constitute a redeemable settlement obligation?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "mtq-redemption-value-consistency.ts: ONE canonical redemption framework, PENDING", counselMustDetermine: "Whether MTQ is a redeemable obligation" },
  { questionId: "MTQ-LQ-11", question: "Does issuance create a regulated activity?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "MTQ DISABLED (pilot-b-mtq-lifecycle.ts: MTQ_DISABLED, 0/11 prerequisites)", counselMustDetermine: "Whether MTQ issuance is a regulated activity" },
  { questionId: "MTQ-LQ-12", question: "Does transfer create a regulated activity?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "MTQ transfer not implemented (MTQ disabled)", counselMustDetermine: "Whether MTQ transfer is regulated" },
  { questionId: "MTQ-LQ-13", question: "Does redemption create a regulated activity?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "Redemption framework PENDING", counselMustDetermine: "Whether MTQ redemption is regulated" },
  { questionId: "MTQ-LQ-14", question: "Does holding create a regulated activity?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "MTQ holding not applicable (MTQ disabled)", counselMustDetermine: "Whether holding MTQ is regulated" },
  { questionId: "MTQ-LQ-15", question: "Who legally obligates redemption?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "Obligor PENDING (pilot-b-mtq-lifecycle.ts: IDENTIFIED_OBLIGOR = PENDING_EXTERNAL)", counselMustDetermine: "Which entity is the legal redemption obligor" },
  { questionId: "MTQ-LQ-16", question: "What rights does the holder possess?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "Holder rights not defined (MTQ disabled, no executed holder agreement)", counselMustDetermine: "What legal rights an MTQ holder possesses" },
  { questionId: "MTQ-LQ-17", question: "What happens upon issuer default?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "failure-resolution-legal-conditionality.ts: 6 forbidden assumptions, COORDINATION_RULE", counselMustDetermine: "Default treatment of MTQ holders" },
  { questionId: "MTQ-LQ-18", question: "What happens upon bank failure?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "failure-resolution-legal-conditionality.ts: MITHQAL coordinates, does NOT adjudicate", counselMustDetermine: "Bank failure treatment" },
  { questionId: "MTQ-LQ-19", question: "What happens upon custody failure?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "No custodian engaged. PBC: 0/14 predicates.", counselMustDetermine: "Custody failure treatment" },
  { questionId: "MTQ-LQ-20", question: "What happens upon MITHQAL insolvency?", evidenceStatus: "COUNSEL_QUESTION", currentMithqalPosition: "Amendment §1.7: existing judgment acknowledged. §1.4(c): assets in trust. §1.5: indemnification.", counselMustDetermine: "Insolvency treatment of settlement obligations + reserve assets" },
];

/* ------------------------------------------------------------------ */
/*  G. Backing/Custody Legal Questions                                 */
/* ------------------------------------------------------------------ */

export const BACKING_CUSTODY_QUESTIONS = [
  "Who legally owns the backing?", "Who holds the backing?", "Who controls the backing?",
  "Who may access the backing?", "What segregation arrangements are required?",
  "What account-control arrangements are required?", "What security/perfection arrangements are required?",
  "What bankruptcy-remoteness requirements apply?", "Can backing be pledged?", "Can backing be encumbered?",
  "Can backing be reused or rehypothecated?", "Under what conditions can backing be frozen?",
  "What is the redemption priority vs other creditors?", "How are backing assets treated in creditor claims?",
  "What is the insolvency treatment of backing assets?", "What happens if the custodian fails?",
  "What happens if the bank fails?", "What happens if MITHQAL fails?",
];

/* ------------------------------------------------------------------ */
/*  H. Redemption Legal Questions                                      */
/* ------------------------------------------------------------------ */

export const REDEMPTION_QUESTIONS = [
  "Who is the redemption obligor?", "Who is the redemption beneficiary?", "Who is an eligible holder?",
  "What triggers redemption?", "What notice is required?", "What is the settlement timing?",
  "What is the settlement asset?", "What pricing/reference mechanism applies?",
  "What deductions/haircuts apply?", "Is redemption legally enforceable?", "Under what conditions can redemption be suspended?",
  "What happens if the bank fails?", "What happens if the custodian fails?", "What happens in insolvency?",
  "What happens in dispute?", "What happens in fraud?", "What happens in sanctions restriction?",
  "What happens in regulatory intervention?", "Is redemption CONTRACTUAL, STATUTORY, REGULATORY, BANK-DEPENDENT, or UNDEFINED?",
];

/* ------------------------------------------------------------------ */
/*  J. Finality Legal Questions                                        */
/* ------------------------------------------------------------------ */

export const FINALITY_QUESTIONS = [
  "Which forms of finality are legally recognized in the jurisdiction?",
  "What is the legally relevant settlement point?",
  "What are the legal consequences of settlement completion?",
  "What reversal rights exist?", "What are the insolvency implications of settlement?",
  "Is contractual finality possible?", "Can external-rail finality be relied upon?",
  "What evidence is required to establish settlement completion?",
  "Distinguish: technical finality vs operational finality vs contractual finality vs legal finality vs settlement-system finality",
];

/* ------------------------------------------------------------------ */
/*  K. Cross-Border Questions                                          */
/* ------------------------------------------------------------------ */

export const CROSS_BORDER_QUESTIONS = [
  "What legal questions arise from: issuance jurisdiction, holding jurisdiction, participant jurisdiction, settlement jurisdiction, custody jurisdiction?",
  "What governing law should apply?", "What enforcement forum is appropriate?",
  "What AML obligations apply cross-border?", "What sanctions obligations apply?",
  "What data transfer restrictions apply?", "What record-keeping requirements apply cross-border?",
  "What tax implications arise?", "What insolvency/conflict-of-laws issues arise?",
  "Does the structure require: LOCAL_ENTITY, LICENSED_BANK, PAYMENT_PROVIDER, CUSTODIAN, REGULATORY_APPROVAL, or SANDBOX?",
];

/* ------------------------------------------------------------------ */
/*  L. Regulatory Perimeter Map (15 activities)                        */
/* ------------------------------------------------------------------ */

export const REGULATORY_PERIMETER: RegulatoryPerimeterItem[] = [
  { activity: "Issuance (MTQ)", mithqalEntity: "Jozour LLC (if MTQ enabled)", bankEntity: "Bank (bank-mediated)", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does MTQ issuance require a license? (MTQ disabled currently)", currentEvidence: "MTQ DISABLED", counselRequired: true },
  { activity: "Transfer (MTQ)", mithqalEntity: "Jozour LLC", bankEntity: "Bank", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does MTQ transfer require a license?", currentEvidence: "MTQ DISABLED", counselRequired: true },
  { activity: "Redemption (MTQ)", mithqalEntity: "Jozour LLC", bankEntity: "Bank", thirdParty: "Custodian", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does redemption require a license?", currentEvidence: "MTQ DISABLED", counselRequired: true },
  { activity: "Custody", mithqalEntity: "N/A (MITHQAL is not a custodian)", bankEntity: "Bank (own assets)", thirdParty: "Qualified custodian (required)", requiredLicense: "Custody license (custodian)", requiredApproval: "UNKNOWN", legalQuestion: "What custody structure is legally required?", currentEvidence: "No custodian engaged", counselRequired: true },
  { activity: "Settlement orchestration", mithqalEntity: "Jozour LLC", bankEntity: "Bank", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does settlement orchestration require a license?", currentEvidence: "Pilot A: SIMULATED", counselRequired: true },
  { activity: "Messaging (ISO 20022/MBG)", mithqalEntity: "Jozour LLC (MBG gateway)", bankEntity: "Bank", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does message translation require a license?", currentEvidence: "MBG gateway designed", counselRequired: true },
  { activity: "Payment initiation", mithqalEntity: "N/A (bank initiates)", bankEntity: "Bank", thirdParty: "N/A", requiredLicense: "Payment service license (bank)", requiredApproval: "N/A", legalQuestion: "Does MITHQAL initiate payments or does the bank?", currentEvidence: "Bank initiates (BM-01)", counselRequired: true },
  { activity: "FX coordination", mithqalEntity: "Jozour LLC (BM-13)", bankEntity: "Bank", thirdParty: "FX provider", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does FX coordination require a license?", currentEvidence: "SIMULATED (Pilot A)", counselRequired: true },
  { activity: "Liquidity management", mithqalEntity: "Jozour LLC (BM-12)", bankEntity: "Bank", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does liquidity routing require a license?", currentEvidence: "SIMULATED (Pilot A)", counselRequired: true },
  { activity: "Evidence management", mithqalEntity: "Jozour LLC (evidence fabric)", bankEntity: "Bank (access)", thirdParty: "Auditor (access)", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Are there record-keeping licensing requirements?", currentEvidence: "Evidence fabric designed", counselRequired: true },
  { activity: "Compliance orchestration", mithqalEntity: "Jozour LLC (BM-11)", bankEntity: "Bank (primary)", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Does compliance orchestration require a license?", currentEvidence: "SIMULATED (Pilot A)", counselRequired: true },
  { activity: "Reconciliation", mithqalEntity: "Jozour LLC", bankEntity: "Bank", thirdParty: "N/A", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Are there reconciliation licensing requirements?", currentEvidence: "6 tolerance policies designed", counselRequired: true },
  { activity: "Technical hosting", mithqalEntity: "Jozour LLC (Vercel + Turso)", bankEntity: "N/A", thirdParty: "Vercel/Turso/Neon/Inngest", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "Are there technology outsourcing requirements?", currentEvidence: "Infrastructure live", counselRequired: true },
  { activity: "Data processing", mithqalEntity: "Jozour LLC", bankEntity: "Bank (data provider)", thirdParty: "Cloud providers", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "What data processing obligations apply?", currentEvidence: "15×7 governance matrix, 28 PENDING", counselRequired: true },
  { activity: "Regulatory reporting", mithqalEntity: "Jozour LLC", bankEntity: "Bank (primary reporter)", thirdParty: "Regulator", requiredLicense: "UNKNOWN", requiredApproval: "UNKNOWN", legalQuestion: "What reporting obligations does MITHQAL have?", currentEvidence: "Regulatory replay engine designed", counselRequired: true },
];

/* ------------------------------------------------------------------ */
/*  O. Pilot Legal Boundaries                                          */
/* ------------------------------------------------------------------ */

export const PILOT_LEGAL_BOUNDARIES: PilotLegalBoundary[] = [
  { activity: "No retail participation", classification: "PROHIBITED" },
  { activity: "No public secondary trading of MTQ", classification: "PROHIBITED" },
  { activity: "No speculative MTQ activity", classification: "PROHIBITED" },
  { activity: "No unsupported MTQ representation", classification: "PROHIBITED" },
  { activity: "No unvalidated reserve claims", classification: "PROHIBITED" },
  { activity: "No unauthorized live settlement", classification: "PROHIBITED" },
  { activity: "No production MTQ issuance", classification: "PROHIBITED" },
  { activity: "No production MTQ settlement", classification: "PROHIBITED" },
  { activity: "No representation of regulatory approval", classification: "PROHIBITED" },
  { activity: "MTQ-disabled control plane (Mode A, BANK_MONEY)", classification: "ALLOWED_FOR_TESTING_SUBJECT_TO_COUNSEL" },
  { activity: "Simulated settlement (Pilot A, 19 steps)", classification: "ALLOWED_FOR_TESTING_SUBJECT_TO_COUNSEL" },
  { activity: "Bank-provided baseline data collection", classification: "ALLOWED_FOR_DISCUSSION" },
  { activity: "MBG gateway integration (test environment)", classification: "ALLOWED_FOR_TESTING_SUBJECT_TO_COUNSEL" },
  { activity: "MTQ evaluation (Mode B)", classification: "PROHIBITED_UNTIL_VALIDATED" },
  { activity: "Live settlement with real bank funds", classification: "PROHIBITED_UNTIL_VALIDATED" },
  { activity: "Custody arrangement execution", classification: "PROHIBITED_UNTIL_VALIDATED" },
];

/* ------------------------------------------------------------------ */
/*  R. Legal Contradiction Register                                    */
/* ------------------------------------------------------------------ */

export const LEGAL_CONTRADICTIONS: LegalContradiction[] = [
  { contradictionId: "CON-01", description: "Code references 4-entity structure (Holding/Operating/Technology/Oversight) but executed documents define 2-entity structure (Jozour LLC + future Foundation)", sourceA: "institutional-operating-model.ts:internalSeparation (4 entities)", sourceB: "Amendment §1.6: Two-Entity Architecture (2 entities)", currentAuthority: "Executed instruments (Amendment) control over code. Code is non-conforming.", legalSignificance: "Entity structure mismatch — counsel must determine which structure applies", blockingStatus: "BLOCKING", counselQuestion: "Which entity structure is legally controlling — the 4-entity design in code or the 2-entity structure in the executed Amendment?", owner: "COO + external counsel" },
  { contradictionId: "CON-02", description: "§1.8 (non-profit character: no profit distribution) vs for-profit LLC structure", sourceA: "Amendment §1.8: 'No profits shall be distributed to the Manager or Members'", sourceB: "Jozour LLC is a for-profit New Jersey LLC", currentAuthority: "Executed instrument (§1.8) controls. Counsel must assess enforceability.", legalSignificance: "Non-profit constraint on for-profit entity — counsel must determine legal effect", blockingStatus: "NON_BLOCKING", counselQuestion: "Is the non-profit character constraint in §1.8 legally enforceable for a for-profit LLC?", owner: "COO + external counsel" },
  { contradictionId: "CON-03", description: "§1.7 (existing judgment against Company) vs bankability assumption", sourceA: "Amendment §1.7: 'judgment entered against the Company'", sourceB: "MITHQAL assumes the entity can contract with banks", currentAuthority: "Executed instrument (§1.7) controls. Judgment is a material fact.", legalSignificance: "Existing judgment may affect the entity's ability to contract with banks or pass bank due diligence", blockingStatus: "BLOCKING", counselQuestion: "Does the existing judgment against Jozour LLC affect the entity's ability to enter bank contracts or pass bank KYB/due diligence?", owner: "COO + external counsel" },
  { contradictionId: "CON-04", description: "MTQ described as 'NOT money, NOT a security, NOT e-money' (self-asserted) — legal classification PENDING", sourceA: "mtq-economic-definition.ts: 12 isNotStatements (self-asserted)", sourceB: "No external legal opinion on MTQ classification", currentAuthority: "Self-asserted classifications have NO legal authority. Counsel must determine.", legalSignificance: "MTQ legal classification is UNKNOWN — all self-asserted 'NOT' classifications are unverified", blockingStatus: "BLOCKING", counselQuestion: "What is the legal classification of MTQ? (MTQ-LQ-01 through MTQ-LQ-20)", owner: "COO + external counsel" },
  { contradictionId: "CON-05", description: "Original Operating Agreement (Oct 24, 2019) referenced but NOT deposited", sourceA: "Amendment Art. II §2.1: 'Operating Agreement dated October 24, 2019'", sourceB: "Repository audit: original OA NOT present (only Amendment)", currentAuthority: "Amendment ratifies the original, but original is not available for review", legalSignificance: "Counsel cannot review the full governing instrument — original OA missing", blockingStatus: "NON_BLOCKING", counselQuestion: "Can counsel review the original Operating Agreement? What does it contain?", owner: "COO" },
];

/* ------------------------------------------------------------------ */
/*  S. Counsel Deliverable Specification (22 items A-V)                */
/* ------------------------------------------------------------------ */

export const COUNSEL_DELIVERABLE_SPEC: CounselDeliverableItem[] = [
  { itemId: "CD-A", section: "Executive legal conclusion", requirement: "Overall legal conclusion on whether the MITHQAL model can be structured for a controlled pilot" },
  { itemId: "CD-B", section: "Jurisdiction and scope", requirement: "Confirm jurisdiction(s) in scope + applicable law" },
  { itemId: "CD-C", section: "Entity analysis", requirement: "Legal analysis of Jozour LLC + proposed Foundation" },
  { itemId: "CD-D", section: "MTQ classification", requirement: "Legal classification of MTQ (MTQ-LQ-01 through MTQ-LQ-20)" },
  { itemId: "CD-E", section: "Issuance analysis", requirement: "Whether MTQ issuance is a regulated activity" },
  { itemId: "CD-F", section: "Transfer analysis", requirement: "Whether MTQ transfer is regulated" },
  { itemId: "CD-G", section: "Redemption analysis", requirement: "Redemption enforceability + obligor + mechanism" },
  { itemId: "CD-H", section: "Custody/backing analysis", requirement: "Segregation + bankruptcy remoteness + PBC enforceability" },
  { itemId: "CD-I", section: "Insolvency/resolution analysis", requirement: "Insolvency treatment of obligations + reserves" },
  { itemId: "CD-J", section: "Payment/financial-regulation analysis", requirement: "Whether MITHQAL is a payment service / money transmitter" },
  { itemId: "CD-K", section: "AML/KYC/sanctions", requirement: "AML/KYC/sanctions obligation allocation" },
  { itemId: "CD-L", section: "Cross-border analysis", requirement: "Cross-border legal implications for AE-SG corridor" },
  { itemId: "CD-M", section: "Data/privacy analysis", requirement: "Data protection + residency requirements" },
  { itemId: "CD-N", section: "Finality analysis", requirement: "Which finality forms are legally recognized" },
  { itemId: "CD-O", section: "Contractual requirements", requirement: "Required contractual provisions + prohibited provisions" },
  { itemId: "CD-P", section: "Licensing requirements", requirement: "Required licenses/registrations per entity" },
  { itemId: "CD-Q", section: "Regulatory-engagement requirements", requirement: "Required regulator engagement before pilot" },
  { itemId: "CD-R", section: "Pilot restrictions", requirement: "Activities prohibited during Pilot A" },
  { itemId: "CD-S", section: "Unresolved issues", requirement: "Explicit legal uncertainties + assumptions" },
  { itemId: "CD-T", section: "Assumptions", requirement: "Assumptions counsel relied upon" },
  { itemId: "CD-U", section: "Reliance limitations", requirement: "Limitations on the opinion's reliance" },
  { itemId: "CD-V", section: "Conditions precedent to pilot", requirement: "Conditions that must be satisfied before pilot" },
];

/* ------------------------------------------------------------------ */
/*  Counsel Selection Framework                                        */
/* ------------------------------------------------------------------ */

export const COUNSEL_SELECTION = [
  { criterion: "Relevant jurisdiction", requirement: "Licensed in UAE (DIFC/ADGM) or Singapore (MAS) or both" },
  { criterion: "Payments/financial regulation", requirement: "Experience in payment services, money transmission, settlement systems" },
  { criterion: "Digital assets/tokenization", requirement: "Experience with digital asset classification + tokenization frameworks" },
  { criterion: "Banking", requirement: "Banking regulation + bank contracting experience" },
  { criterion: "Custody", requirement: "Custody regulation + segregation/bankruptcy remoteness" },
  { criterion: "Insolvency", requirement: "Insolvency/resolution + creditor treatment" },
  { criterion: "Cross-border", requirement: "Cross-border settlement + conflict of laws" },
  { criterion: "AML/sanctions", requirement: "AML/CFT/sanctions + travel rule" },
  { criterion: "Technology/data", requirement: "Technology outsourcing + data protection" },
  { criterion: "Institutional settlement", requirement: "Institutional settlement systems experience" },
  { criterion: "Conflict availability", requirement: "No conflicts of interest with MITHQAL or target banks" },
  { criterion: "Written opinion capability", requirement: "Can issue formal written legal opinion" },
];

/* ------------------------------------------------------------------ */
/*  Cost/Resource Model                                                */
/* ------------------------------------------------------------------ */

export const COST_MODEL = [
  { item: "Legal engagement (counsel fees)", status: "UNKNOWN" as const },
  { item: "Document preparation (MITHQAL side)", status: "ESTIMATED" as const },
  { item: "Legal review cycles", status: "UNKNOWN" as const },
  { item: "Technical clarification", status: "ESTIMATED" as const },
  { item: "Commercial clarification", status: "ESTIMATED" as const },
  { item: "Management review", status: "ESTIMATED" as const },
  { item: "Regulatory interaction", status: "UNKNOWN" as const },
];

/* ------------------------------------------------------------------ */
/*  Management Ownership                                               */
/* ------------------------------------------------------------------ */

export const MANAGEMENT_OWNERSHIP = [
  { role: "LEGAL_WORKSTREAM_OWNER", holder: "COO" },
  { role: "DOCUMENT_OWNER", holder: "COO" },
  { role: "ENGINEERING_LIAISON", holder: "CTO" },
  { role: "BANK_LIAISON", holder: "COO" },
  { role: "COMMERCIAL_LIAISON", holder: "COO" },
  { role: "EXECUTIVE_APPROVER", holder: "Founder/COO (Mohamed Salah Eltonsy)" },
];

/* ------------------------------------------------------------------ */
/*  Final Status + Management Decision                                 */
/* ------------------------------------------------------------------ */

export const FINAL_STATUS: FinalStatus = {
  g0Status: "G0_CONDITIONAL",
  g1Status: "READY_FOR_COUNSEL",
  primaryCorridor: "C-AE-SG (UAE → Singapore)",
  legalScopeDefined: true,
  entityStructureDefined: true,
  mtqQuestionSetComplete: true,
  backingQuestionsComplete: true,
  redemptionQuestionsComplete: true,
  finalityQuestionsComplete: true,
  crossBorderQuestionsComplete: true,
  regulatoryPerimeterComplete: true,
  contractArchitectureComplete: true,
  counselBriefComplete: true,
  dataRoomIndexComplete: true,
  criticalLegalContradictions: LEGAL_CONTRADICTIONS.filter(c => c.blockingStatus === "BLOCKING").length,
  primaryDocumentMissing: 3,
  counselRequired: true,
  legalOpinionObtained: false,
  validatedJurisdictionCount: 0,
  productionAuthorized: false,
  institutionallyValidated: false,
  nextExternalEvidence: "Engage qualified external legal counsel for UAE (DIFC/ADGM) jurisdiction to answer the 50 G1 legal questions + 20 MTQ classification questions + backing/redemption/finality/cross-border question sets. Counsel must provide the 22 deliverables (CD-A through CD-V). BLOCKED by G0_CONDITIONAL — entity must be counsel-verified first.",
};

export const MANAGEMENT_DECISION: ManagementDecision = {
  counselReadiness: "READY_FOR_COUNSEL",
  primaryLegalObjective: "Determine whether the MITHQAL operating model can be legally structured and operated for a limited controlled institutional pilot in the UAE (DIFC/ADGM) jurisdiction, under what entity, licensing, contractual, custody, compliance, settlement, and regulatory conditions.",
  theSingleLegalQuestion: "Under UAE (DIFC/ADGM) law, can a New Jersey LLC (Jozour LLC) legally operate a permissioned institutional settlement control plane for a controlled pilot using bank money (BANK_MONEY) without MTQ, and if so, what licenses, regulatory engagements, custody arrangements, contractual structures, and compliance obligations are required?",
  criticalDependencies: [
    "G0_PASS (entity counsel-verified — currently G0_CONDITIONAL)",
    "Original Operating Agreement (Oct 24, 2019) must be deposited for counsel review",
    "Articles of Incorporation / Formation Certificate must be deposited",
    "Counsel must be engaged with UAE/DIFC/ADGM + payments + digital assets expertise",
    "§1.7 existing judgment must be assessed by counsel for bankability impact",
  ],
  owner: "COO (Mohamed Salah Eltonsy) + external legal counsel",
  nextExternalEvidence: "Engage qualified external legal counsel for UAE (DIFC/ADGM) jurisdiction. The counsel engagement is BLOCKED by G0_CONDITIONAL — the entity documents (Amendment + Resolution) are deposited but NOT counsel-verified. Counsel must first verify the entity (G0) before providing jurisdiction-specific legal opinions (G1).",
};

/* ------------------------------------------------------------------ */
/*  Full Brief                                                          */
/* ------------------------------------------------------------------ */

export function getCounselEngagementBrief(): CounselEngagementBrief {
  return {
    priorBaselines: [
      "Prompt 62 G0: G0_CONDITIONAL (8/16 verified, 8/16 pending, 5 material findings)",
      "Prompt 63 G1: READY_FOR_COUNSEL (50 questions, 18 deliverables, BLOCKED_BY_G0)",
      "Prompt 64: C-AE-SG primary corridor (NOT validated, 0 MEASURED, 0 EXTERNAL_SOURCE)",
      "Prompt 65: 15 banks researched (0 contacted, 0 design partners)",
      "v25.3.2 FROZEN: 10 frozen schemas, 39 canonical modules, 222 API routes",
      "JOZOUR documents deposited: Amendment (Jul 31 2026) + Resolution (Jul 31 2026)",
    ],
    engagementObjective: "Under the laws and regulations applicable to the proposed first institutional corridor (UAE → Singapore), can the MITHQAL operating model legally be structured and operated for a limited controlled institutional pilot, and under what entity, licensing, contractual, custody, compliance, settlement, and regulatory conditions?",
    corridorScope: {
      source: "UAE (DIFC/ADGM)", destination: "Singapore (MAS)", asset: "BANK_MONEY (USD, Pilot A, MTQ disabled)",
      workflow: "BM-01..BM-16B (19 steps, SETTLED, F6, SIMULATED)", bankDep: "UNCONFIRMED (0 banks contacted)",
      custodyDep: "PENDING (no custodian engaged)", fxDep: "SIMULATED", mtqDep: "DISABLED (0/19 steps, 11 prerequisites ALL PENDING)",
      legalDep: "ALL COUNSEL_REQUIRED (50 G1 questions + 20 MTQ questions + backing/redemption/finality/cross-border sets)",
    },
    entityLegalRoles: ENTITY_LEGAL_ROLES,
    mtqClassificationQuestions: MTQ_CLASSIFICATION_QUESTIONS,
    backingCustodyQuestions: BACKING_CUSTODY_QUESTIONS,
    redemptionQuestions: REDEMPTION_QUESTIONS,
    bankMediatedModel: "BANK → CONFIRMED FUNDING/BACKING → MITHQAL CONTROL PLANE → SETTLEMENT INSTRUCTION → FINALITY EVIDENCE → MTQ OPTIONAL → REDEMPTION/SETTLEMENT. Bank performs funding/backing. MITHQAL performs orchestration. Custodian holds backing. MTQ is OPTIONAL. All roles require counsel validation.",
    finalityQuestions: FINALITY_QUESTIONS,
    crossBorderQuestions: CROSS_BORDER_QUESTIONS,
    regulatoryPerimeter: REGULATORY_PERIMETER,
    amlKycMapping: [
      { obligation: "Customer identification (KYC/KYB)", bank: "PRIMARY", mithqal: "COORDINATION", custodian: "SECONDARY", other: "N/A", unknown: "Allocation requires counsel" },
      { obligation: "Transaction monitoring", bank: "PRIMARY", mithqal: "COORDINATION", custodian: "N/A", other: "N/A", unknown: "Allocation requires counsel" },
      { obligation: "Sanctions screening", bank: "PRIMARY", mithqal: "COORDINATION", custodian: "N/A", other: "Screening provider", unknown: "Allocation requires counsel" },
      { obligation: "SAR/STR reporting", bank: "PRIMARY", mithqal: "UNKNOWN", custodian: "N/A", other: "N/A", unknown: "MITHQAL reporting obligations require counsel" },
      { obligation: "Record keeping", bank: "PRIMARY", mithqal: "COORDINATION (evidence fabric)", custodian: "SECONDARY", other: "N/A", unknown: "Retention requirements require counsel" },
      { obligation: "Travel rule", bank: "PRIMARY", mithqal: "UNKNOWN", custodian: "N/A", other: "N/A", unknown: "Applicability requires counsel" },
    ],
    contractArchitecture: [
      { agreement: "Master Institutional Agreement", parties: "Jozour LLC ↔ Bank", purpose: "Overall relationship + scope", unresolvedQuestions: "Liability caps, termination, governing law" },
      { agreement: "SLA", parties: "Jozour LLC ↔ Bank", purpose: "Service levels + availability", unresolvedQuestions: "SLA metrics, penalties, force majeure" },
      { agreement: "Settlement Rules", parties: "Jozour LLC ↔ Bank", purpose: "BM-01..BM-16B rules", unresolvedQuestions: "Finality definition, reversal rights" },
      { agreement: "Bank Participation Terms", parties: "Jozour LLC ↔ Bank", purpose: "Bank's role + obligations", unresolvedQuestions: "Bank's regulatory obligations, capital treatment" },
      { agreement: "Backing/Custody Agreement", parties: "Jozour LLC ↔ Custodian ↔ Bank", purpose: "Custody + segregation + PBC", unresolvedQuestions: "Bankruptcy remoteness, perfection, custodian failure" },
      { agreement: "Redemption Terms", parties: "Jozour LLC ↔ Bank ↔ Holder", purpose: "Redemption mechanism", unresolvedQuestions: "Obligor, enforceability, suspension conditions" },
      { agreement: "Data Processing Agreement", parties: "Jozour LLC ↔ Bank", purpose: "Data flows + protection", unresolvedQuestions: "Data residency, retention, cross-border transfer" },
      { agreement: "Security Schedule", parties: "Jozour LLC ↔ Bank", purpose: "Security requirements", unresolvedQuestions: "Audit requirements, incident response" },
      { agreement: "Incident/Fault Schedule", parties: "Jozour LLC ↔ Bank", purpose: "Incident handling", unresolvedQuestions: "Liability allocation, escalation" },
      { agreement: "Default & Resolution Schedule", parties: "Jozour LLC ↔ Bank ↔ Custodian", purpose: "Failure scenarios", unresolvedQuestions: "Insolvency treatment, creditor priority" },
      { agreement: "Dispute & Escalation Schedule", parties: "Jozour LLC ↔ Bank", purpose: "Dispute resolution", unresolvedQuestions: "Forum, governing law, arbitration" },
      { agreement: "Pilot Term Sheet", parties: "Jozour LLC ↔ Bank", purpose: "Pilot scope + KPIs", unresolvedQuestions: "Pilot duration, exit conditions, evidence" },
      { agreement: "Regulatory Cooperation", parties: "Jozour LLC ↔ Bank ↔ Regulator", purpose: "Regulator access + reporting", unresolvedQuestions: "Reporting obligations, information sharing" },
    ],
    pilotLegalBoundaries: PILOT_LEGAL_BOUNDARIES,
    counselRequestLetter: [
      { section: "MITHQAL overview", content: "Permissioned institutional settlement control infrastructure. NOT a bank, custodian, or regulator. Architecture FROZEN at v25.3.2." },
      { section: "Problem", content: "Cross-border settlement friction: latency, trapped liquidity, FX cost, reconciliation burden, compliance/evidence effort." },
      { section: "Control-plane architecture", content: "19 settlement steps (BM-01..BM-16B). MTQ disabled. BANK_MONEY settlement. Policy, compliance, jurisdiction, finality, reconciliation, evidence." },
      { section: "MTQ optional architecture", content: "MTQ is OPTIONAL. 4-state lifecycle (DISABLED→ELIGIBLE→AUTHORIZED→ACTIVE). 11 prerequisites. MTQ_ACTIVE NOT reachable from config alone." },
      { section: "Selected corridor", content: "C-AE-SG (UAE → Singapore). Both SEED_DATA (not UNKNOWN). DIFC/ADGM + MAS frameworks. NOT validated." },
      { section: "Legal questions", content: "50 G1 questions + 20 MTQ classification questions + backing/redemption/finality/cross-border/regulatory-perimeter question sets." },
      { section: "Entity structure", content: "Jozour LLC (NJ, sole-member LLC, EIN 84-3470275). Amendment + Resolution deposited (Jul 31 2026). Foundation NOT yet formed." },
      { section: "Backing model", content: "2 reserve domains. PBC: 14 fields, 6 failure states, 0/14 predicates. No custodian." },
      { section: "Redemption model", content: "ONE canonical framework, PENDING. No executed redemption agreement. Obligor PENDING." },
      { section: "Finality model", content: "F0-F7, 3 types, 2 modes. Pilot A: F6 (BANKING_FINALITY). F7 (LEGAL_FINALITY) requires counsel." },
      { section: "Bank model", content: "Bank-mediated. Bank holds own funds. MITHQAL orchestrates. 17 contract sections ALL DRAFT." },
      { section: "Compliance model", content: "BM-11 compliance orchestration. AML/CFT/sanctions SIMULATED. Allocation requires counsel." },
      { section: "Failure/default model", content: "6 forbidden assumptions. COORDINATION_RULE. 9 events × 7 stages. Safe halt. No partial settlement." },
      { section: "Pilot A scope", content: "MTQ disabled, BANK_MONEY, 19 steps, SIMULATED. 1 bank, 1 corridor, controlled test." },
      { section: "Prohibited activities", content: "No retail, no public trading, no speculative MTQ, no unvalidated reserves, no live settlement, no production, no regulatory claims." },
      { section: "Requested deliverables", content: "22 deliverables (CD-A through CD-V). Executive conclusion + entity analysis + MTQ classification + all legal analyses." },
      { section: "Required assumptions", content: "Counsel must identify all assumptions relied upon. No assumption may be made by MITHQAL." },
      { section: "Requested timelines", content: "Counsel to propose timeline for: document review, question answering, draft opinion, final opinion." },
      { section: "Required source documents", content: "Amendment (Jul 31 2026), Resolution (Jul 31 2026), mtq-economic-definition.ts, pbc-legal-enforceability.ts, canonical-finality-model.ts, institutional-operating-model.ts, + all 39 canonical modules." },
    ],
    dataRoomIndex: [
      { folder: "00_Control_and_Versioning", description: "RELEASE_MANIFEST_V25_3_2, architecture freeze, version control" },
      { folder: "01_Corporate_and_Entity", description: "Jozour LLC: Amendment, Resolution, EIN, registered office" },
      { folder: "02_Executed_Instruments", description: "Operating Agreement Amendment (Jul 31 2026) + Resolution (Jul 31 2026)" },
      { folder: "03_MITHQAL_Controlled_Baseline", description: "v25.3.2 frozen baseline, 10 frozen schemas, RELEASE_MANIFEST" },
      { folder: "04_MTQ_Architecture", description: "mtq-economic-definition, mtq-settlement-config, pilot-b-mtq-lifecycle" },
      { folder: "05_Protected_Backing", description: "pbc-legal-enforceability, reserve-domains, reserve-coverage-logic" },
      { folder: "06_Redemption", description: "mtq-redemption-value-consistency" },
      { folder: "07_Finality", description: "canonical-finality-model, finality-trust-domains" },
      { folder: "08_Bank_Integration", description: "bank-contracting-package, mithqal-bank-gateway, bank-onboarding" },
      { folder: "09_Risk_and_Resolution", description: "failure-resolution-legal-conditionality, settlement-continuity-fabric, enterprise-risk-register" },
      { folder: "10_Compliance", description: "sanctions-screening, institutional-data-governance, dispute-exception-framework" },
      { folder: "11_Data_and_Security", description: "runtime-infrastructure-map, institutional-data-governance" },
      { folder: "12_Corridor", description: "corridor-pain-index-operationalized, p64-corridor-decision-pack" },
      { folder: "13_Pilot_A", description: "pilot-a-execution-engine, two-pilot-modes, pilot-gate-framework" },
      { folder: "14_Evidence_Register", description: "institutional-evidence-fabric, technical-evidence-classification, definitive-authority-model" },
      { folder: "15_Open_Issues", description: "G0 unresolved items, G1 open questions, 12 BLOCKING_REMEDIATION items" },
      { folder: "16_External_Sources", description: "jurisdiction-truth-model, external-legal-evidence" },
    ],
    legalContradictions: LEGAL_CONTRADICTIONS,
    counselDeliverableSpec: COUNSEL_DELIVERABLE_SPEC,
    counselSelectionFramework: COUNSEL_SELECTION,
    costResourceModel: COST_MODEL,
    managementOwnership: MANAGEMENT_OWNERSHIP,
    finalStatus: FINAL_STATUS,
    managementDecision: MANAGEMENT_DECISION,
    honestState: {
      productionAuthorized: false,
      noLegalOpinionIssued: true,
      architectureNotModified: true,
      onlyCounselMayAnswer: true,
    },
    summary: `PROMPT 66: COUNSEL ENGAGEMENT & LEGAL OPINION BRIEFING. G0: G0_CONDITIONAL. G1: READY_FOR_COUNSEL. Corridor: C-AE-SG. 2 entities (Jozour LLC + future Foundation). 20 MTQ classification questions. 18 backing/custody questions. 18 redemption questions. 9 finality questions. 10 cross-border questions. 15 regulatory perimeter activities. 16 pilot legal boundaries (9 PROHIBITED). 5 legal contradictions (3 BLOCKING). 22 counsel deliverables (CD-A through CD-V). 12 counsel selection criteria. Management decision: READY_FOR_COUNSEL. NO legal opinion issued. Only qualified external counsel may answer. NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const P66_META = {
  module: "p66-counsel-engagement-brief",
  version: "v25.3.2",
  prompt: "PROMPT 66",
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED — no legal opinion issued",
  frozenArchitecture: true,
  g0Status: "G0_CONDITIONAL",
  g1Status: "READY_FOR_COUNSEL",
  corridor: "C-AE-SG",
  entityCount: 2,
  mtqQuestionCount: MTQ_CLASSIFICATION_QUESTIONS.length,
  backingQuestionCount: BACKING_CUSTODY_QUESTIONS.length,
  redemptionQuestionCount: REDEMPTION_QUESTIONS.length,
  finalityQuestionCount: FINALITY_QUESTIONS.length,
  crossBorderQuestionCount: CROSS_BORDER_QUESTIONS.length,
  regulatoryPerimeterCount: REGULATORY_PERIMETER.length,
  contradictionCount: LEGAL_CONTRADICTIONS.length,
  deliverableCount: COUNSEL_DELIVERABLE_SPEC.length,
  counselReadiness: "READY_FOR_COUNSEL",
  legalOpinionObtained: false,
  nextExternalEvidence: FINAL_STATUS.nextExternalEvidence,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. NO legal opinion issued or implied.
//  This is QUESTION PREPARATION, not legal conclusion.
//  Only qualified external counsel may convert questions to opinions.
//
//  G0: G0_CONDITIONAL (documents deposited, NOT counsel-verified)
//  G1: READY_FOR_COUNSEL (pack complete, NOT LEGAL_VALIDATION_PENDING)
//  legalOpinionObtained: false
//  validatedJurisdictions: 0
//  productionAuthorized: false
//  institutionallyValidated: false
//
//  THE SINGLE LEGAL QUESTION:
//    "Under UAE (DIFC/ADGM) law, can Jozour LLC legally operate a
//    permissioned institutional settlement control plane for a controlled
//    pilot using bank money without MTQ, and if so, under what conditions?"
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
