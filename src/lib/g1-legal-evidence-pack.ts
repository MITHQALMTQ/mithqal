/**
 * MITHQAL — G1 LEGAL EVIDENCE PACK (PROMPT 63, v25.3.2 FROZEN)
 *
 * Architecture FROZEN. No new features. No legal conclusions from inference.
 * Only qualified external counsel may convert legal questions into opinions.
 *
 * 7 EVIDENCE CATEGORIES:
 *   FACT_VERIFIED — verified from primary/reliable external source
 *   INTERNAL_DESIGN — existing MITHQAL internal design
 *   MANAGEMENT_INFERENCE — management inference/hypothesis
 *   LEGAL_QUESTION — legal question requiring counsel
 *   UNKNOWN — unknown
 *   CONTRADICTED — contradicted/conflicting
 *   EXPIRED — expired/stale
 *
 * G1 STATUS: READY_FOR_COUNSEL (pack complete, awaiting counsel engagement)
 * NOT LEGAL_VALIDATION_PENDING (counsel not yet engaged)
 * NOT INSTITUTIONALLY_VALIDATED (no counsel opinion exists)
 *
 * NOT PRODUCTION-AUTHORIZED.
 */

import { G0_DECISION, G0_ITEMS, type G0Item } from "./g0-institutional-entry-gate";
import { SELECTED_JURISDICTION, LEGAL_QUESTIONS as EXISTING_LQ } from "./g1-pilot-jurisdiction-legal-pack";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceCategory =
  | "FACT_VERIFIED"
  | "INTERNAL_DESIGN"
  | "MANAGEMENT_INFERENCE"
  | "LEGAL_QUESTION"
  | "UNKNOWN"
  | "CONTRADICTED"
  | "EXPIRED";

export type SourceTier = "TIER_1_STATUTE" | "TIER_2_PROFESSIONAL" | "TIER_3_SECONDARY" | "TIER_4_UNSUPPORTED";

export type G1Status = "READY_FOR_COUNSEL" | "LEGAL_VALIDATION_PENDING" | "INSTITUTIONALLY_VALIDATED";

export type ManagementDecision =
  | "READY_FOR_COUNSEL"
  | "BLOCKED_BY_G0"
  | "BLOCKED_BY_MISSING_PRIMARY_DOCUMENT"
  | "BLOCKED_BY_UNRESOLVED_ENTITY_LIABILITY_ISSUE";

export interface G0Baseline {
  g0Status: string;
  g0Decision: string;
  unresolvedIssues: { itemId: string; label: string; issue: string }[];
  primaryDocumentConflicts: string[];
  inheritedLegalQuestions: string[];
}

export interface JurisdictionAssessment {
  jurisdiction: string;
  criterion: string;
  fact: string;
  source: string;
  sourceDate: string;
  sourceType: SourceTier;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  mithqalImplication: string;
  requiresCounsel: boolean;
  evidenceCategory: EvidenceCategory;
}

export interface LegalQuestion {
  questionId: string;
  question: string;
  evidenceCategory: EvidenceCategory;
  architectureMapping: {
    component: string;
    designSupports: boolean;
    designDoesNotSupport: boolean;
    legalDependency: boolean;
    technicalDependency: boolean;
    bankDependency: boolean;
    custodyDependency: boolean;
    unknown: boolean;
  };
  currentAnswer: string;
}

export interface CounselDeliverable {
  itemId: string;
  topic: string;
  requirement: string;
  counselMustIdentify: string[];
}

export interface G1FinalStatus {
  g0Status: string;
  g1Status: G1Status;
  candidateJurisdictions: string[];
  externalEvidenceCount: number;
  primarySourceCount: number;
  legalQuestionsCount: number;
  criticalOpenIssues: number;
  primaryDocumentDependencies: string[];
  counselRequired: boolean;
  regulatorEngagementRequired: boolean;
  bankDependency: boolean;
  productionAuthorized: boolean;
  institutionallyValidated: boolean;
  nextExternalEvidence: string;
}

export interface G1LegalEvidencePack {
  g0Baseline: G0Baseline;
  jurisdictionAssessments: JurisdictionAssessment[];
  legalQuestionMatrix: LegalQuestion[];
  counselDeliverables: CounselDeliverable[];
  sourceHierarchy: { tier: SourceTier; description: string; examples: string }[];
  managementDecision: ManagementDecision;
  finalStatus: G1FinalStatus;
  openIssues: { issue: string; impact: string; owner: string; dependency: string; blocking: boolean; requiredEvidence: string; nextAction: string }[];
  honestState: {
    productionAuthorized: boolean;
    noLegalConclusionByInference: boolean;
    architectureNotModified: boolean;
    onlyCounselMayConvertQuestions: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  A. G0 Baseline (imported from Prompt 62)                          */
/* ------------------------------------------------------------------ */

export const G0_BASELINE: G0Baseline = {
  g0Status: "G0_FAIL",
  g0Decision: G0_DECISION,
  unresolvedIssues: G0_ITEMS.filter(i => i.evidenceClass !== "VERIFIED_PRIMARY_DOCUMENT" && i.evidenceClass !== "EXECUTED_EXTERNAL_DOCUMENT").map(i => ({
    itemId: i.itemId,
    label: i.label,
    issue: i.status,
  })),
  primaryDocumentConflicts: [
    "JOZOUR_LLC_NJ referenced in code but NO executed instruments in repository — PRIMARY_DOCUMENT_MISSING",
    "JOZOUR Amendment §1.6 referenced in code but NOT present in repository — PRIMARY_DOCUMENT_MISSING",
    "No articles of incorporation, operating agreement, or shareholder agreement exist — PRIMARY_DOCUMENT_MISSING",
    "Cannot verify entity existence, ownership, or authority from code alone — per directive: do NOT infer legal status from code",
  ],
  inheritedLegalQuestions: [
    "Does the entity 'JOZOUR_LLC_NJ' legally exist?",
    "Who has authority to contract on behalf of the entity?",
    "What are the ownership/control boundaries between entities?",
    "What is the IP ownership structure?",
    "What are the related-party/conflict-of-interest disclosures?",
  ],
};

/* ------------------------------------------------------------------ */
/*  B. Jurisdiction Candidate Set (8 jurisdictions × key criteria)    */
/* ------------------------------------------------------------------ */

const UNKNOWN_ASSESSMENT = (jurisdiction: string, criterion: string): JurisdictionAssessment => ({
  jurisdiction,
  criterion,
  fact: "No triage of public regulatory material has been performed. jurisdiction-truth-model.ts: status = SEED_DATA or UNKNOWN.",
  source: "jurisdiction-truth-model.ts",
  sourceDate: "2026-09-30",
  sourceType: "TIER_4_UNSUPPORTED",
  confidence: "NONE",
  mithqalImplication: "Cannot assess MITHQAL's legal position without external counsel triage of authoritative sources.",
  requiresCounsel: true,
  evidenceCategory: "UNKNOWN",
});

const JURISDICTIONS = ["AE", "SG", "SA", "IN", "CN", "US", "GB", "EU"];
const CRITERIA = [
  "Regulatory clarity",
  "Legal treatment of institutional digital settlement assets",
  "Treatment of tokenized deposits / bank-mediated settlement models",
  "Licensing requirements",
  "Payment-services implications",
  "Custody requirements",
  "Issuance/redemption requirements",
  "Money-transmission implications",
  "Securities/financial-instrument implications",
  "AML/KYC obligations",
  "Sanctions obligations",
  "Cross-border considerations",
  "Insolvency/bankruptcy considerations",
  "Client-money / safeguarding requirements",
  "Reserve / backing requirements",
  "Settlement finality considerations",
  "Enforceability of contractual obligations",
  "Data/privacy constraints",
  "Technology outsourcing requirements",
  "Operational resilience requirements",
  "Regulatory sandbox / innovation environment",
  "Expected legal complexity",
  "Likely dependency on bank participation",
  "Practical pilot feasibility",
];

// Generate assessments — ALL UNKNOWN (no triage performed)
export const JURISDICTION_ASSESSMENTS: JurisdictionAssessment[] = JURISDICTIONS.flatMap(j =>
  CRITERIA.map(c => UNKNOWN_ASSESSMENT(j, c))
);

/* ------------------------------------------------------------------ */
/*  C. Source Hierarchy                                                */
/* ------------------------------------------------------------------ */

export const SOURCE_HIERARCHY = [
  { tier: "TIER_1_STATUTE" as SourceTier, description: "Statute, regulation, regulator rulebook, official guidance, government source, court/judicial source", examples: "CBUAE regulations, MAS Payment Services Act, DIFC/ADGM law, SAMA rules, SEC/CFTC regulations" },
  { tier: "TIER_2_PROFESSIONAL" as SourceTier, description: "Established law-firm analysis, professional regulatory commentary, recognized institutional research", examples: "Linklaters/Hogan Lovells analyses, BIS papers, IMF working papers" },
  { tier: "TIER_3_SECONDARY" as SourceTier, description: "Secondary articles, blogs, market commentary", examples: "Legal blogs, fintech news, conference papers" },
  { tier: "TIER_4_UNSUPPORTED" as SourceTier, description: "Unsupported web claims, marketing materials, AI-generated interpretations", examples: "Vendor marketing, AI-generated summaries, unsourced web articles" },
];

/* ------------------------------------------------------------------ */
/*  D. Legal Question Matrix (50 questions)                            */
/* ------------------------------------------------------------------ */

const QUESTIONS = [
  "What is MTQ legally?",
  "What legal category could MTQ fall within?",
  "Does issuance constitute issuance of a regulated financial instrument?",
  "Does issuance constitute a payment service?",
  "Does issuance constitute money transmission?",
  "Could MITHQAL be considered a custodian?",
  "Could MITHQAL be considered a payment intermediary?",
  "Could MITHQAL be considered an issuer?",
  "Which entity is legally obligated to redeem?",
  "Which entity owns or controls backing?",
  "What legally enforceable claim does an MTQ holder possess?",
  "What happens if the bank fails?",
  "What happens if the redemption institution fails?",
  "What happens if MITHQAL fails?",
  "What happens if a custodian fails?",
  "What happens in insolvency?",
  "Is customer/bank backing bankruptcy remote?",
  "What segregation arrangements are required?",
  "What security/control/perfection arrangements are required?",
  "Can backing be pledged, encumbered, reused, or rehypothecated?",
  "What licenses/registrations are required?",
  "Which MITHQAL entity needs each authorization?",
  "Which activities can be performed without a license?",
  "Which activities must be performed by a licensed bank or regulated partner?",
  "What AML/KYC obligations attach?",
  "What sanctions-screening obligations attach?",
  "What travel-rule or equivalent requirements attach, if any?",
  "What cross-border restrictions apply?",
  "What are the restrictions on holding MTQ in another jurisdiction?",
  "What is required for redemption?",
  "What is required for transfer?",
  "What is required for settlement finality?",
  "Which finality domain is legally recognized?",
  "Under what circumstances, if any, could MITHQAL coordinate settlement across jurisdictions?",
  "What contractual law should govern the principal agreements?",
  "What dispute forum is appropriate?",
  "What insolvency/resolution protections are required?",
  "What consumer/public-market restrictions apply?",
  "What institutional-participant restrictions apply?",
  "What record-keeping and audit obligations apply?",
  "What technology outsourcing obligations apply?",
  "What operational resilience obligations apply?",
  "What cybersecurity obligations apply?",
  "What regulatory reporting obligations apply?",
  "What conditions would trigger additional licensing?",
  "What activities must be prohibited during Pilot 1?",
  "What representations can MITHQAL legally make to counterparties?",
  "What wording must be prohibited from marketing and documentation?",
  "What approvals must be obtained before a controlled-value pilot?",
  "What evidence must exist before G1 can be declared passed?",
];

const ARCHITECTURE_COMPONENTS = [
  "control plane", "MTQ", "MBG", "bank integration", "protected backing",
  "reserve architecture", "redemption", "finality", "settlement rails",
  "three-book architecture", "obligation registry", "reconciliation",
  "compliance orchestration", "evidence fabric", "dispute handling",
  "failure/default/resolution", "governance", "data governance", "security/resilience",
];

function mapQuestion(q: string, idx: number): LegalQuestion {
  // Map each question to relevant architecture components
  const q_lower = q.toLowerCase();
  let component = "control plane";
  if (q_lower.includes("mtq") || q_lower.includes("issu")) component = "MTQ";
  else if (q_lower.includes("mbg") || q_lower.includes("bank")) component = "MBG";
  else if (q_lower.includes("custod") || q_lower.includes("backing") || q_lower.includes("pledge") || q_lower.includes("encumber") || q_lower.includes("segregation") || q_lower.includes("bankrupt")) component = "protected backing";
  else if (q_lower.includes("reserve") || q_lower.includes("backing")) component = "reserve architecture";
  else if (q_lower.includes("redeem")) component = "redemption";
  else if (q_lower.includes("final") || q_lower.includes("settlement")) component = "finality";
  else if (q_lower.includes("insolven") || q_lower.includes("fail") || q_lower.includes("resolution")) component = "failure/default/resolution";
  else if (q_lower.includes("aml") || q_lower.includes("kyc") || q_lower.includes("sanction") || q_lower.includes("travel")) component = "compliance orchestration";
  else if (q_lower.includes("evidence") || q_lower.includes("record") || q_lower.includes("audit")) component = "evidence fabric";
  else if (q_lower.includes("dispute")) component = "dispute handling";
  else if (q_lower.includes("data") || q_lower.includes("privacy")) component = "data governance";
  else if (q_lower.includes("cyber") || q_lower.includes("resilien") || q_lower.includes("outsourc")) component = "security/resilience";
  else if (q_lower.includes("license") || q_lower.includes("registration") || q_lower.includes("authorization")) component = "governance";

  return {
    questionId: `LQ-${String(idx + 1).padStart(2, "0")}`,
    question: q,
    evidenceCategory: "LEGAL_QUESTION",
    architectureMapping: {
      component,
      designSupports: false,
      designDoesNotSupport: false,
      legalDependency: true,
      technicalDependency: q_lower.includes("technology") || q_lower.includes("cyber") || q_lower.includes("outsourc"),
      bankDependency: q_lower.includes("bank") || q_lower.includes("licensed bank"),
      custodyDependency: q_lower.includes("custod") || q_lower.includes("backing") || q_lower.includes("segregation"),
      unknown: true,
    },
    currentAnswer: "LEGAL_VALIDATION_PENDING — requires qualified external counsel opinion. No legal conclusion may be generated by inference from code, architecture, documentation, regulatory webpages, AI interpretation, or prior MITHQAL assumptions.",
  };
}

export const LEGAL_QUESTION_MATRIX: LegalQuestion[] = QUESTIONS.map(mapQuestion);

/* ------------------------------------------------------------------ */
/*  G. Counsel Deliverables (18 items A-R)                              */
/* ------------------------------------------------------------------ */

export const COUNSEL_DELIVERABLES: CounselDeliverable[] = [
  { itemId: "CD-A", topic: "Legal classification of MTQ", requirement: "Determine the legal classification of MTQ under the jurisdiction's law", counselMustIdentify: ["confirmed classification", "depends on facts", "depends on regulatory interpretation"] },
  { itemId: "CD-B", topic: "Legality/permissibility of MITHQAL operating model", requirement: "Assess whether the MITHQAL operating model is legally permissible", counselMustIdentify: ["confirmed permissible", "requires license", "requires bank partner", "requires further regulator engagement"] },
  { itemId: "CD-C", topic: "Required licenses/registrations", requirement: "Identify all required licenses and registrations", counselMustIdentify: ["what requires a license", "which entity needs each license", "what can be done without a license"] },
  { itemId: "CD-D", topic: "Entity-by-entity regulatory responsibility", requirement: "Assign regulatory responsibility to each MITHQAL entity", counselMustIdentify: ["which entity is responsible for what", "which entity needs which authorization"] },
  { itemId: "CD-E", topic: "Bank-mediated issuance/redemption model", requirement: "Assess the bank-mediated issuance/redemption model", counselMustIdentify: ["confirmed model", "requires bank partner", "requires specific bank license"] },
  { itemId: "CD-F", topic: "Protected backing / segregation requirements", requirement: "Identify segregation and protected backing requirements", counselMustIdentify: ["required segregation", "bankruptcy remoteness achievable", "perfection requirements"] },
  { itemId: "CD-G", topic: "Insolvency and creditor-risk treatment", requirement: "Assess insolvency treatment of settlement obligations and reserves", counselMustIdentify: ["confirmed treatment", "requires specific structure", "creditor risk"] },
  { itemId: "CD-H", topic: "Redemption enforceability", requirement: "Assess the legal enforceability of redemption obligations", counselMustIdentify: ["enforceable", "depends on structure", "requires specific contractual provisions"] },
  { itemId: "CD-I", topic: "Transfer/settlement legality", requirement: "Assess the legality of MTQ transfer and settlement", counselMustIdentify: ["legal transfer", "legal settlement", "requires license"] },
  { itemId: "CD-J", topic: "Cross-border implications", requirement: "Assess cross-border settlement implications", counselMustIdentify: ["cross-border restrictions", "capital controls", "reporting requirements"] },
  { itemId: "CD-K", topic: "AML/KYC/sanctions obligations", requirement: "Identify AML/KYC/sanctions obligations", counselMustIdentify: ["AML obligations", "KYC requirements", "sanctions screening", "travel rule"] },
  { itemId: "CD-L", topic: "Custody implications", requirement: "Assess custody implications", counselMustIdentify: ["custody requirements", "qualified custodian needed", "segregation enforceable"] },
  { itemId: "CD-M", topic: "Finality implications", requirement: "Assess settlement finality implications", counselMustIdentify: ["finality legally recognized", "which finality domain", "finality conditions"] },
  { itemId: "CD-N", topic: "Required contractual protections", requirement: "Identify required contractual protections", counselMustIdentify: ["required provisions", "prohibited provisions", "mandatory terms"] },
  { itemId: "CD-O", topic: "Prohibited activities", requirement: "Identify activities that must be prohibited during Pilot 1", counselMustIdentify: ["prohibited activities", "restricted activities", "conditional activities"] },
  { itemId: "CD-P", topic: "Required regulatory engagement", requirement: "Identify required regulatory engagement before pilot", counselMustIdentify: ["which regulator", "what application", "what timeline"] },
  { itemId: "CD-Q", topic: "Conditions required for a controlled pilot", requirement: "Identify conditions required for a controlled-value pilot", counselMustIdentify: ["pre-conditions", "monitoring requirements", "exit conditions"] },
  { itemId: "CD-R", topic: "Explicit legal uncertainties and assumptions", requirement: "Identify explicit legal uncertainties and assumptions", counselMustIdentify: ["confirmed", "depends on facts", "depends on regulatory interpretation", "requires license", "requires bank partner", "requires further regulator engagement"] },
];

/* ------------------------------------------------------------------ */
/*  I. Management Decision Gate                                        */
/* ------------------------------------------------------------------ */

export const MANAGEMENT_DECISION: ManagementDecision = "BLOCKED_BY_G0";

/* ------------------------------------------------------------------ */
/*  K. Final Status                                                    */
/* ------------------------------------------------------------------ */

export const FINAL_STATUS: G1FinalStatus = {
  g0Status: "G0_FAIL",
  g1Status: "READY_FOR_COUNSEL",
  candidateJurisdictions: JURISDICTIONS,
  externalEvidenceCount: 0,
  primarySourceCount: 0,
  legalQuestionsCount: QUESTIONS.length,
  criticalOpenIssues: G0_BASELINE.unresolvedIssues.length,
  primaryDocumentDependencies: [
    "Articles of Incorporation for JOZOUR_LLC_NJ (PRIMARY_DOCUMENT_MISSING)",
    "Operating Agreement (PRIMARY_DOCUMENT_MISSING)",
    "JOZOUR Amendment §1.6 (PRIMARY_DOCUMENT_MISSING)",
    "Board Resolution authorizing contracting (PENDING_PRIMARY_DOCUMENT)",
    "Shareholder Agreement / Cap Table (PENDING_PRIMARY_DOCUMENT)",
  ],
  counselRequired: true,
  regulatorEngagementRequired: true,
  bankDependency: true,
  productionAuthorized: false,
  institutionallyValidated: false,
  nextExternalEvidence: "Engage external legal counsel for UAE jurisdiction to answer the 50 legal questions (LQ-01 through LQ-50) + provide the 18 counsel deliverables (CD-A through CD-R). Counsel engagement is blocked by G0_FAIL — the entity must be legally established before counsel can provide jurisdiction-specific opinions.",
};

/* ------------------------------------------------------------------ */
/*  Open Issues                                                        */
/* ------------------------------------------------------------------ */

export const OPEN_ISSUES = [
  { issue: "G0_FAIL — entity not legally established", impact: "G1 cannot advance to LEGAL_VALIDATION_PENDING until G0 PASSES", owner: "COO + external counsel", dependency: "G0", blocking: true, requiredEvidence: "Articles of Incorporation + Operating Agreement", nextAction: "Engage external legal counsel to verify/form the entity" },
  { issue: "0/8 jurisdictions triaged — ALL SEED_DATA/UNKNOWN", impact: "Cannot assess legal feasibility of any jurisdiction without counsel triage", owner: "COO + regulatory counsel", dependency: "G0", blocking: true, requiredEvidence: "Counsel triage of authoritative sources per jurisdiction", nextAction: "Engage counsel to triage regulatory material for UAE (selected jurisdiction)" },
  { issue: "0 external evidence — 0 primary sources", impact: "ALL jurisdiction assessments are UNKNOWN — no FACT_VERIFIED evidence exists", owner: "COO + external counsel", dependency: "G0", blocking: true, requiredEvidence: "Tier 1 sources (statutes, regulations, regulator rulebooks) per jurisdiction", nextAction: "Counsel to identify + cite Tier 1 sources for each criterion" },
  { issue: "50 legal questions — ALL unanswered", impact: "0/50 legal questions have counsel answers", owner: "External legal counsel", dependency: "G0 + counsel engagement", blocking: true, requiredEvidence: "Written legal opinion addressing all 50 questions + 18 deliverables", nextAction: "Engage counsel + provide the G1 Legal Briefing Pack" },
  { issue: "12 BLOCKING_REMEDIATION items from G0", impact: "G0 unresolved issues carried forward into G1", owner: "COO + CTO", dependency: "Architecture Freeze CR process", blocking: false, requiredEvidence: "CHANGE REQUESTs per 7-step process", nextAction: "File CRs for the 12 BLOCKING_REMEDIATION items" },
];

/* ------------------------------------------------------------------ */
/*  Full Pack                                                          */
/* ------------------------------------------------------------------ */

export function getG1LegalEvidencePack(): G1LegalEvidencePack {
  return {
    g0Baseline: G0_BASELINE,
    jurisdictionAssessments: JURISDICTION_ASSESSMENTS,
    legalQuestionMatrix: LEGAL_QUESTION_MATRIX,
    counselDeliverables: COUNSEL_DELIVERABLES,
    sourceHierarchy: SOURCE_HIERARCHY,
    managementDecision: MANAGEMENT_DECISION,
    finalStatus: FINAL_STATUS,
    openIssues: OPEN_ISSUES,
    honestState: {
      productionAuthorized: false,
      noLegalConclusionByInference: true,
      architectureNotModified: true,
      onlyCounselMayConvertQuestions: true,
    },
    summary:
      `G1 LEGAL EVIDENCE PACK (PROMPT 63). G0 status: G0_FAIL. G1 status: READY_FOR_COUNSEL. ` +
      `${JURISDICTIONS.length} candidate jurisdictions × ${CRITERIA.length} criteria = ${JURISDICTION_ASSESSMENTS.length} assessments (ALL UNKNOWN). ` +
      `${QUESTIONS.length} legal questions (ALL LEGAL_VALIDATION_PENDING). ` +
      `${COUNSEL_DELIVERABLES.length} counsel deliverables defined (CD-A through CD-R). ` +
      `${OPEN_ISSUES.length} open issues (${OPEN_ISSUES.filter(i => i.blocking).length} BLOCKING). ` +
      `0 external evidence. 0 primary sources. Management decision: ${MANAGEMENT_DECISION}. ` +
      `NEXT EXTERNAL EVIDENCE: engage external legal counsel for UAE. ` +
      `NOT PRODUCTION-AUTHORIZED. No legal conclusion by inference.`,
  };
}

export const G1_LEGAL_META = {
  module: "g1-legal-evidence-pack",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  prompt: "PROMPT 63",
  createdAt: "2026-10-01T14:53:00Z",
  honestState: "NOT PRODUCTION-AUTHORIZED — READY_FOR_COUNSEL (not LEGAL_VALIDATION_PENDING)",
  frozenArchitecture: true,
  g0Status: "G0_FAIL",
  g1Status: "READY_FOR_COUNSEL" as G1Status,
  jurisdictionCount: JURISDICTIONS.length,
  criteriaCount: CRITERIA.length,
  legalQuestionCount: QUESTIONS.length,
  counselDeliverableCount: COUNSEL_DELIVERABLES.length,
  externalEvidenceCount: 0,
  primarySourceCount: 0,
  managementDecision: MANAGEMENT_DECISION,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. This is a READ-ONLY institutionalization gate.
//  No architecture modified. No legal conclusion by inference.
//
//  G0 STATUS: G0_FAIL (carried forward, not silently corrected)
//  G1 STATUS: READY_FOR_COUNSEL (pack complete, awaiting counsel)
//
//  8 jurisdictions × 24 criteria = 192 assessments — ALL UNKNOWN
//  50 legal questions — ALL LEGAL_VALIDATION_PENDING
//  18 counsel deliverables — CD-A through CD-R
//  0 external evidence. 0 primary sources.
//
//  MANAGEMENT DECISION: BLOCKED_BY_G0
//
//  No legal conclusion may be generated by inference from code,
//  architecture, documentation, regulatory webpages, AI interpretation,
//  or prior MITHQAL assumptions. Only qualified external counsel may
//  convert the legal-question set into a legal opinion.
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
