/**
 * MITHQAL — PROMPT 65: INSTITUTIONAL DESIGN-PARTNER BANK PIPELINE
 *
 * Architecture FROZEN at v25.3.2. No fabricated contacts or relationships.
 * ALL institutions at RESEARCHED status. 0 banks contacted.
 *
 * Primary corridor: C-AE-SG (from PROMPT 64).
 * G0: G0_CONDITIONAL. G1: READY_FOR_COUNSEL (BLOCKED_BY_G0).
 *
 * NOT PRODUCTION-AUTHORIZED.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceAlignment = "HIGH_EVIDENCE_ALIGNMENT" | "MEDIUM_EVIDENCE_ALIGNMENT" | "LOW_EVIDENCE_ALIGNMENT" | "UNKNOWN";
export type PipelineState = "RESEARCHED" | "TARGET" | "CONTACTED" | "QUALIFIED" | "EXECUTIVE_INTEREST" | "ARCHITECTURE_REVIEW" | "LEGAL_REVIEW" | "PILOT_DESIGN" | "COMMERCIAL_REVIEW" | "PILOT_NEGOTIATION" | "CONTRACTED" | "PILOT_ACTIVE" | "MEASURED" | "REPEATABLE";
export type EvidenceState = "MEASURED" | "EXTERNAL_SOURCE" | "ASSUMED" | "UNKNOWN";

export interface BankInstitution {
  bankId: string;
  legalName: string;
  country: string;
  jurisdiction: string;
  institutionType: string;
  corridorRole: string;
  relevantCurrencies: string[];
  relevantBusinessLines: string[];
  crossBorderActivityEvidence: string;
  treasuryActivityEvidence: string;
  paymentActivityEvidence: string;
  digitalSettlementEvidence: string;
  technologyEvidence: string;
  regulatoryConstraints: string;
  publicContactRoutes: string;
  potentialInternalSponsors: string[];
  evidenceSources: string[];
  lastVerifiedDate: string;
  status: PipelineState;
  isPartner: boolean;
  isCustomer: boolean;
  isPilotBank: boolean;
  contactPerson: string;
  evidenceAlignment: EvidenceAlignment;
  targetingAssessment: { criterion: string; alignment: EvidenceAlignment }[];
}

export interface StateTransitionPolicy {
  fromState: PipelineState;
  toState: PipelineState;
  minimumEvidence: string;
  requiresExternalVerification: boolean;
}

export interface BankObjection {
  objectionId: string;
  objection: string;
  evidenceBasedResponse: string;
  unknownComponents: string;
  requiredExternalEvidence: string;
  owner: string;
}

export interface OutreachRoute {
  routeId: string;
  routeName: string;
  whyContacted: string;
  problemInvestigated: string;
  whatMithqalIs: string;
  whatMithqalIsNot: string;
  whatIsRequested: string;
  whatIsNotRequested: string;
  confidentialityRequired: string;
  proposedNextMeeting: string;
}

export interface WorkshopSection {
  sectionNumber: number;
  title: string;
  objective: string;
  duration: string;
}

export interface PipelineMetrics {
  institutionsResearched: number;
  institutionsTargeted: number;
  institutionsContacted: number;
  qualifiedOpportunities: number;
  executiveInterest: number;
  architectureReviews: number;
  legalReviews: number;
  pilotDesigns: number;
  commercialReviews: number;
  pilotNegotiations: number;
  contracted: number;
  pilotActive: number;
  measured: number;
  repeatable: number;
  designPartnerCount: number;
  bankValidatedProblemCount: number;
  primaryKPI: string;
  secondaryKPI: string;
  ultimateKPI: string;
}

export interface PrimaryOutreachTarget {
  institution: string;
  reasonForSelection: string;
  currentEvidence: string;
  unknown: string;
  contactRoute: string;
  targetFunction: string;
  firstMeetingObjective: string;
  expectedEvidenceGain: string;
  dependencies: string;
  owner: string;
  nextAction: string;
}

export interface BankPipeline {
  priorBaselines: string[];
  corridorUnderInvestigation: string;
  targetBankProfile: { criterion: string; description: string }[];
  bankUniverse: BankInstitution[];
  pipelineStates: PipelineState[];
  stateTransitionPolicy: StateTransitionPolicy[];
  discoveryQuestionnaire: { category: string; questions: string[] }[];
  valueValidationFramework: { stage: string; description: string; evidenceState: EvidenceState }[];
  mtqIndependentValidation: { modeA: string; modeB: string; mtqAdoptionRequired: boolean };
  objectionRegister: BankObjection[];
  outreachRoutes: OutreachRoute[];
  workshopPreparation: WorkshopSection[];
  pipelineMetrics: PipelineMetrics;
  primaryOutreachTarget: PrimaryOutreachTarget;
  antiDisintermediation: { existingBankAssets: string; mithqalIncrementalFunction: string };
  designPartnerDefinition: { isNot: string[]; requires: string };
  statusIntegrityRules: string[];
  nextExternalEvidence: string;
  finalStatus: {
    pipelineVersion: string;
    corridorUnderInvestigation: string;
    researchedCount: number;
    targetCount: number;
    contactedCount: number;
    qualifiedCount: number;
    designPartnerCount: number;
    bankValidatedProblemCount: number;
    criticalBlockers: string[];
    missingExternalEvidence: string[];
    nextExternalEvidence: string;
    productionAuthorized: boolean;
    institutionallyValidated: boolean;
  };
  honestState: { productionAuthorized: boolean; noFabricatedContacts: boolean; noFakePartnerships: boolean; architectureNotModified: boolean };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T22:55:00Z";
const CORRIDOR = "C-AE-SG (UAE → Singapore)";

/* ------------------------------------------------------------------ */
/*  B. Target Bank Profile (20 criteria)                               */
/* ------------------------------------------------------------------ */

export const TARGET_BANK_PROFILE = [
  { criterion: "Geographic relevance", description: "Operates in UAE and/or Singapore with cross-border settlement activity" },
  { criterion: "Currency relevance", description: "Handles AED, SGD, USD settlement and FX" },
  { criterion: "Cross-border settlement activity", description: "Active in correspondent banking, cross-border payments" },
  { criterion: "Corporate/trade-finance exposure", description: "Serves corporate clients with cross-border trade settlement needs" },
  { criterion: "Treasury activity", description: "Active treasury function managing nostro/vostro, FX, liquidity" },
  { criterion: "Correspondent-bank exposure", description: "Acts as correspondent or respondent in cross-border networks" },
  { criterion: "FX activity", description: "Active FX trading and execution for clients" },
  { criterion: "Liquidity-management complexity", description: "Manages multi-currency liquidity across time zones" },
  { criterion: "Payment operations complexity", description: "Complex payment operations with SWIFT, RTGS, multiple rails" },
  { criterion: "Reconciliation burden", description: "Significant reconciliation effort across correspondent chains" },
  { criterion: "Compliance operations", description: "Active AML/CFT/sanctions compliance for cross-border" },
  { criterion: "Digital-asset experimentation", description: "Public evidence of digital settlement/tokenization exploration" },
  { criterion: "Innovation/digital-transformation activity", description: "Public innovation initiatives, digital transformation programs" },
  { criterion: "Willingness to work with infrastructure providers", description: "History of working with fintech/infrastructure providers" },
  { criterion: "Regulatory environment", description: "Operates in DIFC/ADGM (UAE) or MAS (SG) — sandbox-friendly" },
  { criterion: "Ability to support controlled institutional pilot", description: "Can dedicate resources to a controlled pilot" },
  { criterion: "Technical integration capacity", description: "Has API/ISO 20022-capable infrastructure" },
  { criterion: "Executive sponsorship potential", description: "Has executive sponsors for innovation/digital" },
  { criterion: "Procurement complexity", description: "Reasonable procurement process for pilot/innovation" },
  { criterion: "Legal/compliance review complexity", description: "Can conduct legal/compliance review of new infrastructure" },
];

/* ------------------------------------------------------------------ */
/*  D. Bank Universe (publicly known institutions, ALL RESEARCHED)     */
/* ------------------------------------------------------------------ */

const UNKNOWN_CONTACT = "UNKNOWN — no contact verified. Do NOT fabricate.";

function makeBank(bankId: string, name: string, country: string, jur: string, type: string, role: string, curs: string[], lines: string[], sponsors: string[], sources: string[], alignment: EvidenceAlignment): BankInstitution {
  return {
    bankId, legalName: name, country, jurisdiction: jur, institutionType: type, corridorRole: role,
    relevantCurrencies: curs, relevantBusinessLines: lines,
    crossBorderActivityEvidence: "RESEARCHED — publicly known to operate in cross-border settlement",
    treasuryActivityEvidence: "RESEARCHED — publicly known treasury function",
    paymentActivityEvidence: "RESEARCHED — publicly known payment operations",
    digitalSettlementEvidence: "UNKNOWN — no public evidence of MITHQAL-relevant digital settlement",
    technologyEvidence: "RESEARCHED — publicly known technology infrastructure (API/ISO 20022 capability unverified)",
    regulatoryConstraints: "RESEARCHED — operates under " + jur + " regulatory framework",
    publicContactRoutes: "RESEARCHED — public website/IR contact available. NO personal contacts verified.",
    potentialInternalSponsors: sponsors,
    evidenceSources: sources,
    lastVerifiedDate: NOW,
    status: "RESEARCHED",
    isPartner: false, isCustomer: false, isPilotBank: false,
    contactPerson: UNKNOWN_CONTACT,
    evidenceAlignment: alignment,
    targetingAssessment: TARGET_BANK_PROFILE.map(c => ({ criterion: c.criterion, alignment: "UNKNOWN" as EvidenceAlignment })),
  };
}

export const BANK_UNIVERSE: BankInstitution[] = [
  makeBank("B-01", "Emirates NBD", "UAE", "AE/DIFC", "UAE commercial bank", "Source bank (AE side)", ["AED", "USD", "SGD"], ["Transaction banking", "Treasury", "Corporate banking"], ["Head of Transaction Banking", "Chief Innovation Officer"], ["Public annual report", "Public website"], "MEDIUM_EVIDENCE_ALIGNMENT"),
  makeBank("B-02", "Mashreq Bank", "UAE", "AE/DIFC", "UAE commercial bank", "Source bank (AE side)", ["AED", "USD", "SGD"], ["International banking", "Treasury", "Digital (Mashreq Neo)"], ["Head of International Banking", "Head of Digital"], ["Public website", "Mashreq Neo public info"], "MEDIUM_EVIDENCE_ALIGNMENT"),
  makeBank("B-03", "First Abu Dhabi Bank (FAB)", "UAE", "AE/ADGM", "UAE commercial bank", "Source bank (AE side)", ["AED", "USD", "SGD"], ["Corporate banking", "Treasury", "International"], ["Group Chief Innovation Officer", "Head of International"], ["Public annual report", "Public website"], "MEDIUM_EVIDENCE_ALIGNMENT"),
  makeBank("B-04", "Abu Dhabi Commercial Bank (ADCB)", "UAE", "AE", "UAE commercial bank", "Source bank (AE side)", ["AED", "USD"], ["Corporate banking", "Treasury"], ["Head of Transaction Banking"], ["Public website"], "LOW_EVIDENCE_ALIGNMENT"),
  makeBank("B-05", "Dubai Islamic Bank", "UAE", "AE/DIFC", "UAE Islamic bank", "Source bank (AE side, Sharia)", ["AED", "USD"], ["Islamic banking", "Treasury", "Corporate"], ["Head of Sharia Banking", "Head of Innovation"], ["Public website"], "LOW_EVIDENCE_ALIGNMENT"),
  makeBank("B-06", "DBS Bank", "Singapore", "SG", "Singapore commercial bank", "Destination bank (SG side)", ["SGD", "USD", "AED"], ["Transaction banking", "Treasury", "Digital", "Institutional Banking"], ["Head of Transaction Banking", "Chief Innovation Officer"], ["Public annual report", "Public website"], "HIGH_EVIDENCE_ALIGNMENT"),
  makeBank("B-07", "OCBC Bank", "Singapore", "SG", "Singapore commercial bank", "Destination bank (SG side)", ["SGD", "USD"], ["Transaction banking", "Treasury", "Corporate"], ["Head of Transaction Banking", "Head of Digital"], ["Public annual report", "Public website"], "MEDIUM_EVIDENCE_ALIGNMENT"),
  makeBank("B-08", "United Overseas Bank (UOB)", "Singapore", "SG", "Singapore commercial bank", "Destination bank (SG side)", ["SGD", "USD"], ["Transaction banking", "Treasury", "Corporate"], ["Head of Transaction Banking"], ["Public annual report"], "MEDIUM_EVIDENCE_ALIGNMENT"),
  makeBank("B-09", "Standard Chartered", "UK/International", "AE+SG", "International bank", "Both sides (AE+SG)", ["AED", "SGD", "USD"], ["Transaction banking", "Treasury", "Corporate", "Cross-border"], ["Head of Transaction Banking", "Chief Innovation Officer"], ["Public annual report", "Public website"], "HIGH_EVIDENCE_ALIGNMENT"),
  makeBank("B-10", "HSBC", "UK/International", "AE+SG", "International bank", "Both sides (AE+SG)", ["AED", "SGD", "USD"], ["Transaction banking", "Treasury", "Corporate", "Cross-border"], ["Head of Transaction Banking", "Head of Digital Innovation"], ["Public annual report", "Public website"], "HIGH_EVIDENCE_ALIGNMENT"),
  makeBank("B-11", "Citibank", "US/International", "AE+SG", "International bank", "Both sides (AE+SG)", ["AED", "SGD", "USD"], ["Transaction banking", "Treasury", "Corporate"], ["Head of Treasury Services", "Head of Innovation"], ["Public annual report"], "MEDIUM_EVIDENCE_ALIGNMENT"),
  makeBank("B-12", "JP Morgan", "US/International", "AE+SG", "International bank", "Both sides (AE+SG)", ["AED", "SGD", "USD"], ["Transaction banking", "Treasury", "Institutional"], ["Head of Treasury Services"], ["Public annual report"], "LOW_EVIDENCE_ALIGNMENT"),
  makeBank("B-13", "Commercial Bank of Dubai", "UAE", "AE", "UAE commercial bank", "Source bank (AE side)", ["AED", "USD"], ["Corporate banking", "Treasury"], ["Head of Transaction Banking"], ["Public website"], "LOW_EVIDENCE_ALIGNMENT"),
  makeBank("B-14", "National Bank of Fujairah (NBF)", "UAE", "AE", "UAE commercial bank", "Source bank (AE side)", ["AED", "USD"], ["Corporate banking", "Treasury", "Trade finance"], ["Head of Trade Finance"], ["Public website"], "LOW_EVIDENCE_ALIGNMENT"),
  makeBank("B-15", "Emirates Islamic Bank", "UAE", "AE", "UAE Islamic bank", "Source bank (AE side, Sharia)", ["AED", "USD"], ["Islamic banking", "Treasury"], ["Head of Sharia Banking"], ["Public website"], "LOW_EVIDENCE_ALIGNMENT"),
];

/* ------------------------------------------------------------------ */
/*  G. Pipeline States + H. Transition Evidence                       */
/* ------------------------------------------------------------------ */

export const PIPELINE_STATES: PipelineState[] = [
  "RESEARCHED", "TARGET", "CONTACTED", "QUALIFIED", "EXECUTIVE_INTEREST",
  "ARCHITECTURE_REVIEW", "LEGAL_REVIEW", "PILOT_DESIGN", "COMMERCIAL_REVIEW",
  "PILOT_NEGOTIATION", "CONTRACTED", "PILOT_ACTIVE", "MEASURED", "REPEATABLE",
];

export const STATE_TRANSITIONS: StateTransitionPolicy[] = [
  { fromState: "RESEARCHED", toState: "TARGET", minimumEvidence: "Management has documented corridor-specific reason for pursuing institution", requiresExternalVerification: false },
  { fromState: "TARGET", toState: "CONTACTED", minimumEvidence: "Verifiable outreach occurred (email, letter, introduction)", requiresExternalVerification: true },
  { fromState: "CONTACTED", toState: "QUALIFIED", minimumEvidence: "Institution confirms enough relevant information to establish discovery opportunity", requiresExternalVerification: true },
  { fromState: "QUALIFIED", toState: "EXECUTIVE_INTEREST", minimumEvidence: "Identifiable executive/senior sponsor demonstrates documented interest", requiresExternalVerification: true },
  { fromState: "EXECUTIVE_INTEREST", toState: "ARCHITECTURE_REVIEW", minimumEvidence: "Technical/architecture stakeholders review MITHQAL", requiresExternalVerification: true },
  { fromState: "ARCHITECTURE_REVIEW", toState: "LEGAL_REVIEW", minimumEvidence: "Legal/compliance stakeholders formally review applicable structure", requiresExternalVerification: true },
  { fromState: "LEGAL_REVIEW", toState: "PILOT_DESIGN", minimumEvidence: "Parties agree to investigate a specific controlled pilot scope", requiresExternalVerification: true },
  { fromState: "PILOT_DESIGN", toState: "COMMERCIAL_REVIEW", minimumEvidence: "Pricing, costs, responsibilities under review", requiresExternalVerification: true },
  { fromState: "COMMERCIAL_REVIEW", toState: "PILOT_NEGOTIATION", minimumEvidence: "Pilot terms being negotiated", requiresExternalVerification: true },
  { fromState: "PILOT_NEGOTIATION", toState: "CONTRACTED", minimumEvidence: "Executed contractual document exists", requiresExternalVerification: true },
  { fromState: "CONTRACTED", toState: "PILOT_ACTIVE", minimumEvidence: "Controlled pilot has actually started", requiresExternalVerification: true },
  { fromState: "PILOT_ACTIVE", toState: "MEASURED", minimumEvidence: "Valid pilot measurements exist", requiresExternalVerification: true },
  { fromState: "MEASURED", toState: "REPEATABLE", minimumEvidence: "Repeatability evidence independently documented", requiresExternalVerification: true },
];

/* ------------------------------------------------------------------ */
/*  I. Bank Discovery Questionnaire                                    */
/* ------------------------------------------------------------------ */

export const DISCOVERY_QUESTIONNAIRE = [
  { category: "CURRENT SETTLEMENT", questions: ["Current settlement process?", "Involved banks/intermediaries?", "Operating hours?", "Cut-off times?", "Settlement windows?", "Exception handling?", "Reconciliation process?", "Manual intervention?", "Liquidity pre-positioning?", "Collateral/credit requirements?"] },
  { category: "TREASURY", questions: ["Liquidity fragmentation?", "Trapped liquidity?", "Nostro/vostro implications?", "FX exposure?", "Liquidity forecasting?", "Intraday liquidity?", "Funding costs?"] },
  { category: "OPERATIONS", questions: ["Reconciliation burden?", "Investigation volume?", "Exception volume?", "Message fragmentation?", "Evidence retrieval?", "Operational handoffs?"] },
  { category: "COMPLIANCE", questions: ["Screening?", "KYC/KYB?", "Sanctions?", "Transaction monitoring?", "Regulatory reporting?", "Audit evidence?"] },
  { category: "RISK", questions: ["Counterparty exposure?", "Settlement exposure?", "Operational risk?", "Legal uncertainty?", "Failed settlement/recovery?"] },
  { category: "TECHNOLOGY", questions: ["APIs?", "Core-banking integration?", "Payment-system connectivity?", "Treasury systems?", "Data formats?", "Event processing?", "Authentication/security?", "Audit requirements?"] },
  { category: "BUSINESS", questions: ["Transaction economics?", "Customer pain?", "Service differentiation?", "New revenue opportunities?", "Willingness to run a controlled pilot?"] },
];

/* ------------------------------------------------------------------ */
/*  O. Bank Objection Register (20 objections)                        */
/* ------------------------------------------------------------------ */

export const OBJECTION_REGISTER: BankObjection[] = [
  { objectionId: "OBJ-01", objection: "What is MITHQAL legally?", evidenceBasedResponse: "MITHQAL is a settlement control infrastructure. Legal classification = PENDING_VALIDATION (G1 READY_FOR_COUNSEL, BLOCKED_BY_G0). MTQ legal classification = PENDING.", unknownComponents: "Legal classification requires external counsel opinion (LQ-01).", requiredExternalEvidence: "Counsel written legal classification of MITHQAL + MTQ", owner: "COO + external counsel" },
  { objectionId: "OBJ-02", objection: "Who is liable?", evidenceBasedResponse: "Jozour, LLC is the contracting entity (G0_CONDITIONAL, documents deposited). Liability boundaries defined in Amendment §1.5 (indemnification). But 17 contract sections ALL DRAFT.", unknownComponents: "Specific liability allocation requires executed bank contract.", requiredExternalEvidence: "Executed bank master agreement (17 sections)", owner: "COO + external counsel" },
  { objectionId: "OBJ-03", objection: "Who holds the money?", evidenceBasedResponse: "The bank holds its own money. MITHQAL does NOT hold bank capital (runtime-infrastructure-map.ts: Vercel is stateless, Turso is the DB but no bank funds). Settlement asset = BANK_MONEY (Pilot A).", unknownComponents: "Custody arrangement requires executed agreement.", requiredExternalEvidence: "Executed custody agreement + independent reserve attestation", owner: "COO + custody counsel" },
  { objectionId: "OBJ-04", objection: "Who controls the backing?", evidenceBasedResponse: "reserve-domains.ts: 2 domains. Gold in Strategic Resilience (NOT settlement backing). PBC: 0/14 evidence predicates met. No qualified custodian.", unknownComponents: "Backing control requires executed custody agreement.", requiredExternalEvidence: "Qualified custodian + independent attestation", owner: "COO + custody counsel" },
  { objectionId: "OBJ-05", objection: "What happens if a bank fails?", evidenceBasedResponse: "failure-resolution-legal-conditionality.ts: 6 forbidden assumptions. MITHQAL COORDINATES, does NOT adjudicate. Settlement continuity fabric: 9 events × 7 stages, NO_BYPASS_RULE.", unknownComponents: "Specific failure scenario requires legal opinion (LQ-12 through LQ-16).", requiredExternalEvidence: "Counsel opinion on bank failure scenarios", owner: "COO + external counsel" },
  { objectionId: "OBJ-06", objection: "What happens if MITHQAL fails?", evidenceBasedResponse: "Amendment §1.7: existing debts acknowledged. §1.4(c): assets held in trust for Foundation. Settlement continuity fabric: safe halt, no partial settlement.", unknownComponents: "Insolvency treatment requires counsel opinion (LQ-16, LQ-17).", requiredExternalEvidence: "Counsel opinion on MITHQAL insolvency", owner: "COO + external counsel" },
  { objectionId: "OBJ-07", objection: "How is finality determined?", evidenceBasedResponse: "canonical-finality-model.ts: F0-F7, 3 types, 2 modes. Pilot A reaches F6 (BANKING_FINALITY). F7 (LEGAL_FINALITY) requires external evidence.", unknownComponents: "Which finality domain is legally recognized requires counsel (LQ-33).", requiredExternalEvidence: "Counsel opinion on settlement finality", owner: "CTO + external counsel" },
  { objectionId: "OBJ-08", objection: "Why not use existing bank infrastructure?", evidenceBasedResponse: "MITHQAL does NOT replace bank infrastructure. It adds a settlement coordination layer. Anti-disintermediation: MITHQAL complements, does NOT replace.", unknownComponents: "Bank must validate meaningful differentiation.", requiredExternalEvidence: "Bank assessment of MITHQAL vs existing infrastructure", owner: "COO + CTO" },
  { objectionId: "OBJ-09", objection: "Why is another settlement layer necessary?", evidenceBasedResponse: "Pilot A demonstrates: policy enforcement, jurisdiction gating, compliance, reconciliation, evidence — all coordinated in one layer. The bank validates whether this adds value.", unknownComponents: "Value validation requires bank baseline data.", requiredExternalEvidence: "Bank-provided baseline data (12 metrics)", owner: "COO" },
  { objectionId: "OBJ-10", objection: "What is the ROI?", evidenceBasedResponse: "Bank Value Measurement Engine: 12 metrics × 6 categories. ALL baselines INSUFFICIENT_DATA. NO savings invented. NET INSTITUTIONAL VALUE = INSUFFICIENT_DATA.", unknownComponents: "ROI requires bank baseline data.", requiredExternalEvidence: "Bank-provided baseline data", owner: "CFO (bank) + COO (MITHQAL)" },
  { objectionId: "OBJ-11", objection: "What integration is required?", evidenceBasedResponse: "MBG gateway (API-based, ISO 20022). Bank connects via MBG. No core banking replacement. bank-onboarding-training-framework.ts: 11 modules DRAFT.", unknownComponents: "Specific integration scope requires bank technical assessment.", requiredExternalEvidence: "Bank technical assessment", owner: "CTO" },
  { objectionId: "OBJ-12", objection: "What regulatory approval is required?", evidenceBasedResponse: "G1: 50 legal questions prepared. ALL JURISDICTION_PENDING. G2: Regulatory Perimeter NOT_STARTED. No regulatory application filed.", unknownComponents: "Specific approvals require counsel opinion (LQ-21, LQ-22, LQ-49).", requiredExternalEvidence: "Counsel opinion on required regulatory approvals", owner: "COO + regulatory counsel" },
  { objectionId: "OBJ-13", objection: "Why should the bank be an early participant?", evidenceBasedResponse: "Design partner gets: measurable evidence about current settlement performance, reference value, input into architecture. NOT a production commitment.", unknownComponents: "Bank must see sufficient value.", requiredExternalEvidence: "Bank assessment of design-partner value", owner: "COO" },
  { objectionId: "OBJ-14", objection: "What data does MITHQAL receive?", evidenceBasedResponse: "institutional-data-governance.ts: 15×7 matrix. MITHQAL receives settlement instructions, compliance data, evidence packages. Data governance: 28 PENDING cells.", unknownComponents: "Specific data flows require DPA.", requiredExternalEvidence: "Executed Data Processing Agreement", owner: "CTO + data protection counsel" },
  { objectionId: "OBJ-15", objection: "How does MITHQAL protect confidential bank information?", evidenceBasedResponse: "Evidence fabric: 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT). SHA-256 commitments. runtime-infrastructure-map.ts: no competing sources of truth.", unknownComponents: "Specific confidentiality requires DPA + security audit.", requiredExternalEvidence: "Executed DPA + security audit", owner: "CTO" },
  { objectionId: "OBJ-16", objection: "How does reconciliation work?", evidenceBasedResponse: "6 separate tolerance policies (1/5/10/50/20/200 bps). 6-field reconciliation record. Evidence fabric: automated evidence generation.", unknownComponents: "Bank must validate reconciliation approach.", requiredExternalEvidence: "Bank reconciliation requirements assessment", owner: "CTO" },
  { objectionId: "OBJ-17", objection: "What happens when rails fail?", evidenceBasedResponse: "Settlement continuity fabric: 9 events × 7 stages. NO_BYPASS_RULE. Pilot A: safe halt + alternative routing + recovery demonstrated (SIMULATED).", unknownComponents: "Live failure/recovery requires real bank test.", requiredExternalEvidence: "Live failure/recovery test with bank", owner: "CTO" },
  { objectionId: "OBJ-18", objection: "Why is MTQ necessary?", evidenceBasedResponse: "MTQ is NOT necessary for Pilot A. Pilot A: 19 steps, 0/19 mtqUsed, BANK_MONEY, SETTLED. MTQ is OPTIONAL (Pilot B: 11 prerequisites, MTQ_DISABLED).", unknownComponents: "MTQ value requires legal validation.", requiredExternalEvidence: "Counsel opinion on MTQ + bank assessment of MTQ value", owner: "COO + CTO" },
  { objectionId: "OBJ-19", objection: "Can the bank test MITHQAL without MTQ?", evidenceBasedResponse: "YES. Pilot A: MTQ completely disabled. Settlement asset = BANK_MONEY. The bank evaluates: orchestration, policy, evidence, finality, reconciliation, compliance — all without MTQ.", unknownComponents: "N/A — Mode A is the default.", requiredExternalEvidence: "N/A", owner: "COO + CTO" },
  { objectionId: "OBJ-20", objection: "What evidence exists today?", evidenceBasedResponse: "Architecture FROZEN v25.3.2. Pilot A: 19 steps SETTLED (SIMULATED). 39 canonical modules. 222 API routes. BUT: 0 external validation, 0 banks, 0 counsel, 0 gates passed. NOT PRODUCTION-AUTHORIZED.", unknownComponents: "All external validation PENDING.", requiredExternalEvidence: "External counsel opinion + bank baseline data + pilot measurements", owner: "COO + CTO" },
];

/* ------------------------------------------------------------------ */
/*  W. Outreach Routes (3)                                             */
/* ------------------------------------------------------------------ */

export const OUTREACH_ROUTES: OutreachRoute[] = [
  { routeId: "ROUTE-A", routeName: "Executive / Transaction Banking Introduction", whyContacted: "Institution operates in AE-SG corridor with cross-border settlement activity", problemInvestigated: "Cross-border settlement friction: latency, trapped liquidity, reconciliation burden, compliance cost", whatMithqalIs: "Neutral institutional settlement control infrastructure", whatMithqalIsNot: "NOT a bank, NOT a custodian, NOT a regulator, NOT a cryptocurrency, NOT production-authorized", whatIsRequested: "Discovery meeting to understand current settlement pain + explore controlled pilot", whatIsNotRequested: "NOT requesting partnership, NOT requesting contract, NOT requesting production commitment, NOT requesting MTQ adoption", confidentialityRequired: "NDA before any bank-specific data is shared", proposedNextMeeting: "60-90 minute institutional workshop (13 sections)" },
  { routeId: "ROUTE-B", routeName: "Payments / Treasury / Operations Introduction", whyContacted: "Treasury/operations teams manage nostro/vostro + reconciliation for AE-SG corridor", problemInvestigated: "Liquidity fragmentation, trapped capital, reconciliation FTE, exception handling, FX cost", whatMithqalIs: "Settlement coordination layer (policy, evidence, reconciliation, routing)", whatMithqalIsNot: "NOT a replacement for core banking or SWIFT", whatIsRequested: "Treasury/operations pain discovery + baseline data discussion", whatIsNotRequested: "NOT requesting production deployment, NOT requesting MTQ adoption", confidentialityRequired: "NDA before nostro/vostro data discussion", proposedNextMeeting: "Treasury/operations pain assessment + Bank Value Measurement Engine walkthrough" },
  { routeId: "ROUTE-C", routeName: "Innovation / Digital Settlement Introduction", whyContacted: "Innovation/digital teams exploring new settlement infrastructure", problemInvestigated: "Can a control-plane approach reduce settlement friction without requiring token adoption?", whatMithqalIs: "MTQ-disabled settlement control infrastructure (Pilot A proven)", whatMithqalIsNot: "NOT a blockchain play, NOT a crypto play, NOT an MTQ-required model", whatIsRequested: "Architecture review + Mode-A (MTQ-disabled) evaluation", whatIsNotRequested: "NOT requesting MTQ evaluation (only if bank explicitly requests)", confidentialityRequired: "NDA before architecture review", proposedNextMeeting: "Architecture review + Pilot A demonstration (MTQ disabled)" },
];

/* ------------------------------------------------------------------ */
/*  X. Workshop Preparation (13 sections)                              */
/* ------------------------------------------------------------------ */

export const WORKSHOP_SECTIONS: WorkshopSection[] = [
  { sectionNumber: 1, title: "Bank's current settlement process", objective: "Understand the bank's AE-SG settlement workflow end-to-end", duration: "10 min" },
  { sectionNumber: 2, title: "Pain-point confirmation", objective: "Identify + confirm the bank's stated settlement pain (not MITHQAL's hypothesis)", duration: "10 min" },
  { sectionNumber: 3, title: "Current systems/rails", objective: "Map existing settlement rails, correspondent relationships, FX providers", duration: "5 min" },
  { sectionNumber: 4, title: "Treasury/liquidity discussion", objective: "Understand nostro/vostro positions, trapped liquidity, pre-funding", duration: "10 min" },
  { sectionNumber: 5, title: "Reconciliation and evidence", objective: "Assess reconciliation burden + evidence/audit preparation effort", duration: "5 min" },
  { sectionNumber: 6, title: "Compliance/risk", objective: "Understand AML/CFT/sanctions burden + settlement risk approach", duration: "5 min" },
  { sectionNumber: 7, title: "MITHQAL Control Plane demonstration", objective: "Demonstrate Pilot A (19 steps, MTQ disabled, BANK_MONEY, SETTLED)", duration: "10 min" },
  { sectionNumber: 8, title: "MTQ-disabled workflow", objective: "Show the control plane operating WITHOUT MTQ (Mode A)", duration: "5 min" },
  { sectionNumber: 9, title: "Failure/recovery scenario", objective: "Walk through exception handling, safe halt, alternative routing, recovery", duration: "5 min" },
  { sectionNumber: 10, title: "Data/security requirements", objective: "Discuss data flows, access levels, confidentiality, security", duration: "5 min" },
  { sectionNumber: 11, title: "Pilot hypothesis", objective: "Define a potential controlled pilot scope + success metrics", duration: "10 min" },
  { sectionNumber: 12, title: "Required legal review", objective: "Identify legal/compliance review requirements + counsel engagement", duration: "5 min" },
  { sectionNumber: 13, title: "Next evidence step", objective: "Agree on the next evidence-acquisition step", duration: "5 min" },
];

/* ------------------------------------------------------------------ */
/*  U. Pipeline Metrics                                                */
/* ------------------------------------------------------------------ */

export const PIPELINE_METRICS: PipelineMetrics = {
  institutionsResearched: BANK_UNIVERSE.length,
  institutionsTargeted: 0,
  institutionsContacted: 0,
  qualifiedOpportunities: 0,
  executiveInterest: 0,
  architectureReviews: 0,
  legalReviews: 0,
  pilotDesigns: 0,
  commercialReviews: 0,
  pilotNegotiations: 0,
  contracted: 0,
  pilotActive: 0,
  measured: 0,
  repeatable: 0,
  designPartnerCount: 0,
  bankValidatedProblemCount: 0,
  primaryKPI: "QUALIFIED_EXTERNAL_OPPORTUNITIES",
  secondaryKPI: "BANK_VALIDATED_PROBLEM_STATEMENTS",
  ultimateKPI: "MEASURED_BANK_VALUE",
};

/* ------------------------------------------------------------------ */
/*  AA. Primary Bank Outreach Target                                    */
/* ------------------------------------------------------------------ */

export const PRIMARY_OUTREACH_TARGET: PrimaryOutreachTarget = {
  institution: "DBS Bank (Singapore) — publicly known, AE-SG corridor participant",
  reasonForSelection: "HIGH_EVIDENCE_ALIGNMENT: (1) operates in both AE+SG corridor, (2) largest SG bank with major transaction banking, (3) publicly documented digital transformation + innovation programs, (4) MAS-regulated (sandbox-friendly), (5) publicly known ISO 20022/API capability. NOT 'the best bank' — selected for NEXT documented outreach action based on evidence criteria.",
  currentEvidence: "RESEARCHED — public annual report + website confirm: transaction banking, treasury, digital innovation, MAS-regulated, operates in AE-SG corridor. HIGH_EVIDENCE_ALIGNMENT on geographic + currency + cross-border + innovation criteria.",
  unknown: "ALL targeting assessments UNKNOWN (14/14 criteria). NO contact person verified. NO willingness to partner assessed. NO baseline data. NO executive sponsor identified. NO technical assessment. NO legal review. NO pilot scope agreed.",
  contactRoute: "ROUTE-A (Executive / Transaction Banking Introduction) — approach via public IR/transaction banking contact",
  targetFunction: "Transaction Banking / Treasury / Innovation",
  firstMeetingObjective: "Discovery: understand DBS's current AE-SG settlement process + confirm pain points + introduce MITHQAL Mode-A (MTQ disabled) + agree on next evidence step",
  expectedEvidenceGain: "Bank-stated settlement pain (replaces MITHQAL's ASSUMED hypothesis with bank-validated problem statements). Potential baseline data for Bank Value Measurement Engine (12 metrics).",
  dependencies: "G0_PASS (entity legally established — currently G0_CONDITIONAL) + G1 counsel engagement (50 legal questions — currently BLOCKED_BY_G0) + NDA execution before any bank-specific data is shared",
  owner: "COO",
  nextAction: "REQUIRES G0_PASS first. Then: execute NDA + approach DBS via public transaction banking contact + schedule 60-90 min institutional workshop",
};

/* ------------------------------------------------------------------ */
/*  Full Pipeline                                                      */
/* ------------------------------------------------------------------ */

export function getBankPipeline(): BankPipeline {
  return {
    priorBaselines: [
      "Prompt-62 G0: G0_CONDITIONAL (8/16 verified, 8/16 pending)",
      "Prompt-63 G1: READY_FOR_COUNSEL (50 questions, BLOCKED_BY_G0)",
      "Prompt-64: C-AE-SG primary corridor for deep discovery (NOT validated)",
      "v25.3.2 FROZEN: 10 frozen schemas, 39 canonical modules, 222 API routes",
      "Bank Value Engine: 12 metrics × 6 categories, ALL INSUFFICIENT_DATA",
      "Pilot A: MTQ disabled, 19 steps, BANK_MONEY, SETTLED, F6, SIMULATED",
    ],
    corridorUnderInvestigation: CORRIDOR,
    targetBankProfile: TARGET_BANK_PROFILE,
    bankUniverse: BANK_UNIVERSE,
    pipelineStates: PIPELINE_STATES,
    stateTransitionPolicy: STATE_TRANSITIONS,
    discoveryQuestionnaire: DISCOVERY_QUESTIONNAIRE,
    valueValidationFramework: [
      { stage: "BANK_STATED_PROBLEM", description: "The bank identifies its own settlement pain (not MITHQAL's hypothesis)", evidenceState: "UNKNOWN" },
      { stage: "CURRENT_PROCESS", description: "Bank describes current settlement process", evidenceState: "UNKNOWN" },
      { stage: "MEASURED_PAIN", description: "Bank provides baseline data (12 metrics)", evidenceState: "UNKNOWN" },
      { stage: "MITHQAL_CAPABILITY", description: "MITHQAL demonstrates Mode-A (MTQ disabled) capability", evidenceState: "ASSUMED" },
      { stage: "EXPECTED_VALUE", description: "Potential value from MITHQAL intervention", evidenceState: "ASSUMED" },
      { stage: "MEASUREMENT_PLAN", description: "Agreed pilot KPIs + measurement method", evidenceState: "UNKNOWN" },
      { stage: "EVIDENCE_STATUS", description: "ALL UNKNOWN — no bank engaged", evidenceState: "UNKNOWN" },
    ],
    mtqIndependentValidation: {
      modeA: "MODE A — MITHQAL Control Plane with MTQ DISABLED. Bank evaluates: orchestration, policy, evidence, finality, reconciliation, compliance, routing, exceptions, replay, continuity. Pilot A: 19 steps, 0/19 mtqUsed, BANK_MONEY, SETTLED, F6.",
      modeB: "MODE B — MITHQAL + MTQ. Only discussed if bank explicitly requests. LEGAL_VALIDATION_PENDING + ACCOUNTING_VALIDATION_PENDING + REGULATORY_VALIDATION_PENDING until external evidence.",
      mtqAdoptionRequired: false,
    },
    objectionRegister: OBJECTION_REGISTER,
    outreachRoutes: OUTREACH_ROUTES,
    workshopPreparation: WORKSHOP_SECTIONS,
    pipelineMetrics: PIPELINE_METRICS,
    primaryOutreachTarget: PRIMARY_OUTREACH_TARGET,
    antiDisintermediation: {
      existingBankAssets: "The bank keeps: core banking, customer relationships, regulatory licenses, capital, custody, compliance programs, SWIFT infrastructure, nostro/vostro accounts. MITHQAL does NOT take custody, hold capital, or replace regulatory obligations.",
      mithqalIncrementalFunction: "MITHQAL adds: settlement coordination layer (policy, evidence, reconciliation, routing, finality, compliance orchestration, regulatory replay). This is INCREMENTAL to the bank's existing infrastructure, NOT a replacement.",
    },
    designPartnerDefinition: {
      isNot: ["a lead", "a contacted bank", "an interested person", "a meeting", "an NDA alone"],
      requires: "Documented agreement to participate in structured product/pilot discovery. Requires executed documentary evidence.",
    },
    statusIntegrityRules: [
      "Never write 'partner bank' unless CONTRACTED or stronger",
      "Never write 'customer' unless an actual customer relationship exists",
      "Never write 'pilot bank' unless pilot participation is documented",
      "Never write 'bank validated' unless the bank has explicitly validated the claim",
      "Never write 'bank-ready' as an unsupported global claim",
    ],
    nextExternalEvidence: "G0_PASS (entity legally established — currently G0_CONDITIONAL). Once G0 passes: execute NDA + approach DBS Bank (Singapore) via public transaction banking contact for AE-SG corridor discovery. The bank's stated settlement pain would replace MITHQAL's ASSUMED hypotheses with bank-validated problem statements.",
    finalStatus: {
      pipelineVersion: "v25.3.2",
      corridorUnderInvestigation: CORRIDOR,
      researchedCount: BANK_UNIVERSE.length,
      targetCount: 0,
      contactedCount: 0,
      qualifiedCount: 0,
      designPartnerCount: 0,
      bankValidatedProblemCount: 0,
      criticalBlockers: [
        "G0_CONDITIONAL — entity not yet counsel-verified",
        "G1 BLOCKED_BY_G0 — 50 legal questions unanswered",
        "0 banks contacted (ALL RESEARCHED)",
        "0 design partners (requires CONTRACTED state minimum)",
        "0 bank-validated problem statements",
        "0 bank baseline data (ALL UNKNOWN)",
      ],
      missingExternalEvidence: [
        "G0_PASS (counsel verification of entity documents)",
        "G1 counsel engagement (50 legal questions)",
        "NDA execution (before any bank-specific data)",
        "Bank operations interview (baseline data collection)",
        "Bank technical assessment (integration feasibility)",
        "Bank legal/compliance review (regulatory compatibility)",
      ],
      nextExternalEvidence: "G0_PASS (entity legally established — currently G0_CONDITIONAL)",
      productionAuthorized: false,
      institutionallyValidated: false,
    },
    honestState: {
      productionAuthorized: false,
      noFabricatedContacts: true,
      noFakePartnerships: true,
      architectureNotModified: true,
    },
    summary: `PROMPT 65: INSTITUTIONAL DESIGN-PARTNER BANK PIPELINE. Corridor: ${CORRIDOR}. ${BANK_UNIVERSE.length} institutions researched (ALL RESEARCHED, 0 contacted, 0 design partners). 14 pipeline states. 20 objections anticipated. 3 outreach routes. 13-section workshop. Primary outreach target: DBS Bank (HIGH_EVIDENCE_ALIGNMENT, NOT 'best bank'). Pipeline BLOCKED by G0_CONDITIONAL. Primary KPI: QUALIFIED_EXTERNAL_OPPORTUNITIES (currently 0). NOT PRODUCTION-AUTHORIZED. No fabricated contacts or relationships.`,
  };
}

export const P65_META = {
  module: "p65-bank-pipeline",
  version: "v25.3.2",
  prompt: "PROMPT 65",
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED — 0 banks contacted, 0 design partners",
  frozenArchitecture: true,
  corridor: CORRIDOR,
  bankUniverseCount: BANK_UNIVERSE.length,
  pipelineStateCount: PIPELINE_STATES.length,
  objectionCount: OBJECTION_REGISTER.length,
  outreachRouteCount: OUTREACH_ROUTES.length,
  workshopSectionCount: WORKSHOP_SECTIONS.length,
  g0Status: "G0_CONDITIONAL",
  g1Status: "READY_FOR_COUNSEL (BLOCKED_BY_G0)",
  primaryOutreachTarget: "DBS Bank (Singapore)",
  nextExternalEvidence: "G0_PASS (entity legally established)",
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. No fabricated contacts or relationships.
//  ALL institutions at RESEARCHED status. 0 contacted. 0 design partners.
//  NO bank claimed as partner/customer/pilot bank.
//  ALL bank pain = UNKNOWN. ALL value = ASSUMED (MITHQAL hypothesis).
//  Primary outreach target: DBS Bank (NOT 'best' — selected for next outreach).
//  Pipeline BLOCKED by G0_CONDITIONAL.
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
