// ════════════════════════════════════════════════════════════
// MITHQAL §V25.2 — Institutional Engagement Data Models
// Centralized TypeScript types + config for all institutional UI
// ════════════════════════════════════════════════════════════

// ── §1: Institution Types ──
export type InstitutionType =
  | "CENTRAL_BANK"
  | "REGULATED_BANK"
  | "FINANCIAL_INSTITUTION"
  | "PAYMENT_INFRASTRUCTURE"
  | "GOVERNMENT_AUTHORITY"
  | "REGULATOR_SUPERVISOR"
  | "TECHNOLOGY_PROVIDER"
  | "CYBERSECURITY_ASSURANCE"
  | "LEGAL_REGULATORY"
  | "STANDARDS_RESEARCH"
  | "OTHER";

export const INSTITUTION_TYPES: { value: InstitutionType; label: string }[] = [
  { value: "CENTRAL_BANK", label: "Central Bank / Monetary Authority" },
  { value: "REGULATED_BANK", label: "Regulated Bank" },
  { value: "FINANCIAL_INSTITUTION", label: "Financial Institution" },
  { value: "PAYMENT_INFRASTRUCTURE", label: "Payment / Settlement Infrastructure" },
  { value: "GOVERNMENT_AUTHORITY", label: "Government Authority" },
  { value: "REGULATOR_SUPERVISOR", label: "Regulator / Supervisor" },
  { value: "TECHNOLOGY_PROVIDER", label: "Technology Infrastructure Provider" },
  { value: "CYBERSECURITY_ASSURANCE", label: "Cybersecurity / Assurance" },
  { value: "LEGAL_REGULATORY", label: "Legal / Regulatory Institution" },
  { value: "STANDARDS_RESEARCH", label: "Standards / Research" },
  { value: "OTHER", label: "Other" },
];

// ── §2: Institution Cards (10) ──
export interface InstitutionCard {
  type: InstitutionType;
  title: string;
  whoTheyAre: string;
  whatMithqalMayAsk: string;
  appropriateEngagement: string;
  icon: string;
}

export const INSTITUTION_CARDS: InstitutionCard[] = [
  {
    type: "CENTRAL_BANK",
    title: "Central Banks / Monetary Authorities",
    whoTheyAre: "Sovereign monetary authorities responsible for currency issuance, reserve management, payment system oversight and financial stability.",
    whatMithqalMayAsk: "Review of the MTQ settlement model against monetary policy objectives, reserve-backing architecture, and systemic risk implications.",
    appropriateEngagement: "Architecture Review · Regulatory/Legal Review",
    icon: "Landmark",
  },
  {
    type: "REGULATED_BANK",
    title: "Regulated Banks",
    whoTheyAre: "Licensed deposit-taking institutions subject to prudential supervision, capital requirements and AML/CFT obligations.",
    whatMithqalMayAsk: "MBG integration assessment, ISO 20022 compatibility, KYC/KYB/AML/sanctions interface review, and pass-through settlement evaluation.",
    appropriateEngagement: "Bank Integration Pilot · Settlement Pilot · Sandbox Testing",
    icon: "Building2",
  },
  {
    type: "FINANCIAL_INSTITUTION",
    title: "Regulated Financial Institutions",
    whoTheyAre: "Non-bank financial institutions including money service businesses, treasury providers and authorized FX intermediaries.",
    whatMithqalMayAsk: "Settlement corridor evaluation, FX conversion interface, liquidity assessment and non-bank integration model review.",
    appropriateEngagement: "Architecture Review · Settlement Pilot",
    icon: "Briefcase",
  },
  {
    type: "PAYMENT_INFRASTRUCTURE",
    title: "Payment / Clearing / Settlement Infrastructure",
    whoTheyAre: "Operators of RTGS, ACH, instant payment, clearing and settlement systems that process interbank transfers.",
    whatMithqalMayAsk: "Multi-rail interoperability assessment, settlement finality model review, and infrastructure compatibility evaluation.",
    appropriateEngagement: "Architecture Review · Integration Assessment",
    icon: "Network",
  },
  {
    type: "GOVERNMENT_AUTHORITY",
    title: "Government / Sovereign Infrastructure Authorities",
    whoTheyAre: "Sovereign entities responsible for national payment infrastructure, digital identity, trade finance and sovereign settlement systems.",
    whatMithqalMayAsk: "Sovereign settlement corridor review, jurisdictional evaluation and public infrastructure interoperability assessment.",
    appropriateEngagement: "Architecture Review · Regulatory/Legal Review",
    icon: "Shield",
  },
  {
    type: "REGULATOR_SUPERVISOR",
    title: "Financial Regulators / Supervisory Authorities",
    whoTheyAre: "Regulatory bodies overseeing banking, payments, securities, digital assets and financial conduct within their jurisdiction.",
    whatMithqalMayAsk: "Classification review, licensing perimeter evaluation, liability chain assessment and sandbox framework engagement.",
    appropriateEngagement: "Regulatory/Legal Review · Sandbox Testing",
    icon: "Scale",
  },
  {
    type: "TECHNOLOGY_PROVIDER",
    title: "Banking Technology / Payment-Rail Providers",
    whoTheyAre: "Technology firms providing core banking systems, payment gateways, ISO 20022 messaging and treasury infrastructure.",
    whatMithqalMayAsk: "MBG adapter compatibility, API/schema review, ISO 20022 field mapping and technical integration assessment.",
    appropriateEngagement: "Architecture Review · Bank Integration Pilot",
    icon: "Cpu",
  },
  {
    type: "CYBERSECURITY_ASSURANCE",
    title: "Cybersecurity / Independent Assurance Institutions",
    whoTheyAre: "Independent security firms, auditors and assurance providers specializing in financial infrastructure security.",
    whatMithqalMayAsk: "Security architecture review, finality enforcement audit, penetration testing scope and reconciliation evidence verification.",
    appropriateEngagement: "Independent Assurance · Sandbox Testing",
    icon: "Lock",
  },
  {
    type: "LEGAL_REGULATORY",
    title: "Legal / Regulatory Institutions",
    whoTheyAre: "Law firms, regulatory advisors and legal institutions specializing in financial regulation, payments law and cross-border settlement.",
    whatMithqalMayAsk: "Legal classification review, jurisdictional liability analysis, regulatory perimeter assessment and governing law evaluation.",
    appropriateEngagement: "Regulatory/Legal Review",
    icon: "FileText",
  },
  {
    type: "STANDARDS_RESEARCH",
    title: "Standards / Research Institutions",
    whoTheyAre: "Academic, research and standards organizations studying monetary architecture, payment systems and settlement theory.",
    whatMithqalMayAsk: "Architecture review, comparative analysis, theoretical validation and publication of independent findings.",
    appropriateEngagement: "Architecture Review · Independent Assurance",
    icon: "BookOpen",
  },
];

// ── §3: Engagement Types (6) ──
export type EngagementType =
  | "ARCHITECTURE_REVIEW"
  | "REGULATORY_LEGAL_REVIEW"
  | "SANDBOX_TESTING"
  | "BANK_INTEGRATION_PILOT"
  | "SETTLEMENT_PILOT"
  | "INDEPENDENT_ASSURANCE";

export interface EngagementTypeDef {
  type: EngagementType;
  title: string;
  purpose: string;
  institutionInputs: string;
  mithqalInputs: string;
  expectedEvidence: string;
  status: string;
}

export const ENGAGEMENT_TYPES: EngagementTypeDef[] = [
  {
    type: "ARCHITECTURE_REVIEW",
    title: "Architecture Review",
    purpose: "Review the MITHQAL architecture alongside institutional infrastructure to assess compatibility, boundary design and integration feasibility.",
    institutionInputs: "Existing architecture overview, integration points, constraints and non-production environment description.",
    mithqalInputs: "Technical Architecture Package, Bank Boundary Architecture, MBG Integration Model, API/Schema Documentation.",
    expectedEvidence: "Architecture review notes, compatibility assessment, integration gap analysis.",
    status: "PROPOSED",
  },
  {
    type: "REGULATORY_LEGAL_REVIEW",
    title: "Regulatory / Legal Review",
    purpose: "Evaluate classification, licensing perimeter, liability chain and jurisdiction-specific requirements.",
    institutionInputs: "Jurisdiction, regulatory framework, licensing requirements, legal entity structure.",
    mithqalInputs: "Legal liability framework, licensing/entity matrix, jurisdiction registry (all PENDING), MTQ legal nature.",
    expectedEvidence: "Regulatory classification opinion, licensing perimeter assessment, liability analysis.",
    status: "PROPOSED",
  },
  {
    type: "SANDBOX_TESTING",
    title: "Sandbox Testing",
    purpose: "Conduct controlled testing in a regulator, bank, innovation sandbox or equivalent non-production environment.",
    institutionInputs: "Sandbox environment access, test identities, synthetic data, test accounts.",
    mithqalInputs: "Sandbox test scenarios, adversarial test scenarios, reconciliation test plan, DR/failure-injection test plan.",
    expectedEvidence: "Test execution reports, reconciliation evidence, security assessment, incident response validation.",
    status: "PROPOSED",
  },
  {
    type: "BANK_INTEGRATION_PILOT",
    title: "Bank Integration Pilot",
    purpose: "Evaluate MBG integration through API, ISO 20022, host-to-host, SFTP, treasury and ERP interfaces where applicable.",
    institutionInputs: "Technical architecture contact, existing integration capabilities, non-production environment, test corridor.",
    mithqalInputs: "MBG Integration Model, API/Schema Documentation, MTQSettlementInstruction, Issuance State Machine.",
    expectedEvidence: "Integration test results, API compatibility report, ISO 20022 field mapping validation.",
    status: "PROPOSED",
  },
  {
    type: "SETTLEMENT_PILOT",
    title: "Settlement Pilot",
    purpose: "Controlled institutional testing under the initial one-institution / one-jurisdiction / one-corridor model.",
    institutionInputs: "Named institutional sponsor, test corridor, settlement scenario, payment/finality reference mechanism.",
    mithqalInputs: "Finality-Before-Mint Control Specification, Protected Backing Cell Model, Three-Book Separation Model.",
    expectedEvidence: "Settlement execution records, reconciliation results, finality verification evidence.",
    status: "PROPOSED",
  },
  {
    type: "INDEPENDENT_ASSURANCE",
    title: "Independent Assurance",
    purpose: "Review security, finality, reconciliation, resilience, evidence and controls.",
    institutionInputs: "Security assessment methodology, audit framework, evidence requirements.",
    mithqalInputs: "Security Architecture, Privacy Architecture, Resilience and Failure Semantics, Five-Way Reconciliation Model.",
    expectedEvidence: "Independent assurance report, security assessment, reconciliation verification, resilience validation.",
    status: "PROPOSED",
  },
];

// ── §4: Pilot Readiness ──
export type ReadinessStatus = "NOT_ASSESSED" | "IN_REVIEW" | "EVIDENCE_REQUIRED" | "READY_FOR_SANDBOX" | "VALIDATED";

export interface ReadinessCategory {
  id: string;
  title: string;
  description: string;
  status: ReadinessStatus;
}

export const READINESS_CATEGORIES: ReadinessCategory[] = [
  { id: "institutional-authorization", title: "Institutional Authorization", description: "Named institutional sponsor, signatories and formal pilot authorization.", status: "NOT_ASSESSED" },
  { id: "legal-regulatory", title: "Legal / Regulatory Path", description: "Jurisdictional legal review, regulatory classification and licensing perimeter assessment.", status: "NOT_ASSESSED" },
  { id: "technical-integration", title: "Technical Integration", description: "API, ISO 20022, host-to-host, SFTP and treasury system compatibility.", status: "NOT_ASSESSED" },
  { id: "compliance-interface", title: "Compliance Interface", description: "KYC/KYB, AML/CFT, sanctions screening and regulatory reporting interfaces.", status: "NOT_ASSESSED" },
  { id: "security", title: "Security", description: "mTLS, HSM/MPC, network security, access controls and key management.", status: "NOT_ASSESSED" },
  { id: "settlement-finality", title: "Settlement / Finality", description: "Settlement finality model, payment/finality reference mechanism and reconciliation.", status: "NOT_ASSESSED" },
  { id: "backing-evidence", title: "Backing Evidence", description: "Protected Backing Cell verification, backing attribution and evidence packages.", status: "NOT_ASSESSED" },
  { id: "reconciliation", title: "Reconciliation", description: "Five-way reconciliation model, break detection and resolution procedures.", status: "NOT_ASSESSED" },
  { id: "resilience-dr", title: "Resilience / Disaster Recovery", description: "Business continuity, disaster recovery, failure-injection testing and incident response.", status: "NOT_ASSESSED" },
  { id: "independent-assurance", title: "Independent Assurance", description: "Independent security, finality, reconciliation and resilience verification.", status: "NOT_ASSESSED" },
];

export const READINESS_STATUS_LABELS: Record<ReadinessStatus, { label: string; color: string }> = {
  NOT_ASSESSED: { label: "NOT ASSESSED", color: "gray" },
  IN_REVIEW: { label: "IN REVIEW", color: "amber" },
  EVIDENCE_REQUIRED: { label: "EVIDENCE REQUIRED", color: "amber" },
  READY_FOR_SANDBOX: { label: "READY FOR SANDBOX", color: "gold" },
  VALIDATED: { label: "VALIDATED", color: "emerald" },
};

// ── §5: Jurisdiction Workflow ──
export type JurisdictionStatus =
  | "SUBMITTED"
  | "INITIAL_REVIEW"
  | "JURISDICTION_ASSESSMENT"
  | "LEGAL_REGULATORY_REVIEW"
  | "TECHNICAL_REVIEW"
  | "SANDBOX_CANDIDATE"
  | "PILOT_CANDIDATE"
  | "INSTITUTIONALLY_VALIDATED";

export const JURISDICTION_STATUSES: { status: JurisdictionStatus; label: string; description: string }[] = [
  { status: "SUBMITTED", label: "SUBMITTED", description: "Jurisdiction evaluation request received. This is an evaluation state, not an approval." },
  { status: "INITIAL_REVIEW", label: "INITIAL REVIEW", description: "MITHQAL has begun reviewing the submission. No institutional commitment implied." },
  { status: "JURISDICTION_ASSESSMENT", label: "JURISDICTION ASSESSMENT", description: "Assessing jurisdictional regulatory environment, infrastructure and corridor feasibility." },
  { status: "LEGAL_REGULATORY_REVIEW", label: "LEGAL / REGULATORY REVIEW", description: "Legal classification and regulatory perimeter under evaluation. No license implied." },
  { status: "TECHNICAL_REVIEW", label: "TECHNICAL REVIEW", description: "Technical integration, API and rail compatibility under assessment." },
  { status: "SANDBOX_CANDIDATE", label: "SANDBOX CANDIDATE", description: "Identified as a potential sandbox testing candidate. Not yet validated." },
  { status: "PILOT_CANDIDATE", label: "PILOT CANDIDATE", description: "Identified as a potential pilot candidate. Subject to formal authorization." },
  { status: "INSTITUTIONALLY_VALIDATED", label: "INSTITUTIONALLY VALIDATED", description: "Validated through documented institutional review. Requires authorized institutional evidence." },
];

// ── §6: Institutional Readiness Checklist (33 items) ──
export interface ReadinessItem {
  id: number;
  label: string;
  category: string;
}

export const READINESS_CHECKLIST: ReadinessItem[] = [
  { id: 1, label: "Named institutional sponsor", category: "Institutional" },
  { id: 2, label: "Named technical contact", category: "Institutional" },
  { id: 3, label: "Named compliance contact", category: "Institutional" },
  { id: 4, label: "Named legal/regulatory contact", category: "Institutional" },
  { id: 5, label: "Legal entity identity", category: "Institutional" },
  { id: 6, label: "Institution type", category: "Institutional" },
  { id: 7, label: "Jurisdiction", category: "Institutional" },
  { id: 8, label: "Regulatory/supervisory authority", category: "Regulatory" },
  { id: 9, label: "Regulatory status", category: "Regulatory" },
  { id: 10, label: "Sandbox / innovation framework information", category: "Regulatory" },
  { id: 11, label: "Legal/regulatory review path", category: "Regulatory" },
  { id: 12, label: "Technical architecture contact", category: "Technical" },
  { id: 13, label: "Existing integration capabilities", category: "Technical" },
  { id: 14, label: "Non-production/sandbox environment", category: "Technical" },
  { id: 15, label: "Synthetic test identities/data", category: "Technical" },
  { id: 16, label: "Test accounts where appropriate", category: "Technical" },
  { id: 17, label: "Test corridor", category: "Settlement" },
  { id: 18, label: "Settlement scenario", category: "Settlement" },
  { id: 19, label: "Payment/finality reference mechanism", category: "Settlement" },
  { id: 20, label: "KYC/KYB interface", category: "Compliance" },
  { id: 21, label: "AML/CFT interface", category: "Compliance" },
  { id: 22, label: "Sanctions interface", category: "Compliance" },
  { id: 23, label: "Authority attestation", category: "Assurance" },
  { id: 24, label: "Funds-availability attestation", category: "Assurance" },
  { id: 25, label: "mTLS/certificate requirements", category: "Security" },
  { id: 26, label: "HSM/MPC requirements", category: "Security" },
  { id: 27, label: "Security/network requirements", category: "Security" },
  { id: 28, label: "Reconciliation requirements", category: "Reconciliation" },
  { id: 29, label: "Privacy/data-residency requirements", category: "Privacy" },
  { id: 30, label: "Business continuity / disaster-recovery requirements", category: "Resilience" },
  { id: 31, label: "Formal pilot authorization/agreement", category: "Authorization" },
  { id: 32, label: "Acceptance criteria", category: "Authorization" },
  { id: 33, label: "Responsible institutional signatories", category: "Authorization" },
];

// ── §7: What MITHQAL Provides ──
export const MITHQAL_PROVIDES: string[] = [
  "Technical Architecture Package",
  "Bank Boundary Architecture",
  "MBG Integration Model",
  "API / Schema Documentation",
  "MTQSettlementInstruction",
  "Issuance State Machine",
  "Finality-Before-Mint Control Specification",
  "Protected Backing Cell Model",
  "Three-Book Separation Model",
  "Five-Way Reconciliation Model",
  "Security Architecture",
  "Privacy Architecture",
  "Resilience and Failure Semantics",
  "Sandbox Test Scenarios",
  "Adversarial Test Scenarios",
  "Reconciliation Test Plan",
  "DR / Failure-Injection Test Plan",
  "Pilot Acceptance Criteria",
  "Institutional Readiness Framework",
  "Jurisdiction-Specific Integration Assessment",
];

// ── §8: Pilot Model Flow ──
export const PILOT_FLOW: string[] = [
  "ONE REGULATED INSTITUTION",
  "ONE JURISDICTION",
  "ONE CORRIDOR",
  "INSTITUTIONAL CORPORATES",
  "CONTROLLED TEST ENVIRONMENT",
  "MTQ PASS-THROUGH SETTLEMENT",
  "RECONCILIATION",
  "SECURITY / RESILIENCE TESTING",
  "INDEPENDENT / INSTITUTIONAL REVIEW",
];

// ── §9: Institutional Review Package ──
export const REVIEW_PACKAGE: string[] = [
  "Architecture Review Package",
  "Integration / API Package",
  "Security Questionnaire",
  "Legal / Regulatory Questionnaire",
  "Pilot Test Plan",
  "Test-Case Matrix",
  "Reconciliation Evidence Plan",
  "Incident / DR Test Plan",
  "Acceptance Criteria",
  "Institutional Sign-Off Record",
];

// ── §10: Evidence Status ──
export type EvidenceStatus = "PROPOSED" | "UNDER_REVIEW" | "EVIDENCE_REQUIRED" | "SANDBOX_CANDIDATE" | "VALIDATED";

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, { label: string; variant: string }> = {
  PROPOSED: { label: "PROPOSED", variant: "gray" },
  UNDER_REVIEW: { label: "UNDER REVIEW", variant: "amber" },
  EVIDENCE_REQUIRED: { label: "EVIDENCE REQUIRED", variant: "amber" },
  SANDBOX_CANDIDATE: { label: "SANDBOX CANDIDATE", variant: "gold" },
  VALIDATED: { label: "VALIDATED", variant: "emerald" },
};

// ── §11: Contact ──
export const INSTITUTIONAL_EMAIL = "meltonsy@icloud.com";
export const SECURITY_NOTICE = "Do not submit passwords, private keys, seed phrases, customer credentials, confidential customer information, production banking credentials, or other secrets. Initial contact should contain only institutional and non-sensitive information.";
export const DISCLAIMER = "CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.";

// ── §12: Technical capabilities ──
export const TECH_CAPABILITIES = [
  "API / REST", "ISO 20022", "Host-to-Host", "SFTP",
  "Payment Gateway", "Treasury", "ERP", "Other",
];

// ── §13: Institutional Inquiry Type (for future CRM) ──
export interface InstitutionalInquiry {
  id: string;
  organizationName: string;
  institutionType: InstitutionType;
  country: string;
  website?: string;
  regulator?: string;
  regulatoryStatus?: string;
  contactName: string;
  jobTitle: string;
  email: string;
  phone?: string;
  preferredContact?: string;
  engagementTypes: EngagementType[];
  proposedCorridors?: string;
  localCurrencies?: string;
  sandboxAvailable?: string;
  technicalCapabilities?: string[];
  timeline?: string;
  evaluationRequest?: string;
  regulatoryQuestions?: string;
  technicalQuestions?: string;
  additionalNotes?: string;
  authorized: boolean;
  understandsDisclaimer: boolean;
  submittedAt: string;
}
