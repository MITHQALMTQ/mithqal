// v25.0 Institutional Closure 4/8 — Bank Partnership, Due Diligence, Institutional Onboarding
// =================================================================
// Complete institutional workflow to onboard real participating banks.
//
// IMPORTANT: Software creates readiness records and workflows.
// It must NOT claim a bank is partnered until evidence exists.
//
// Implements:
//   Task 1: Bank master record (9 entity types)
//   Task 2: Bank lifecycle (13 statuses with transitions)
//   Task 3: Bank evidence requirements (14 types)
//   Task 4: Bank authorization (4 block conditions)
//   Task 5: Bank commercial package (7 elements)
//   Task 6: Bank technical certification (10 tests)
//   Task 7: Bank readiness score (7 categories, LIVE_PILOT gate)
// =================================================================

import type { DataClass } from "./custody-execution";

// ---- Task 1: Bank Master Record (9 entity types) ----

// 1. Institution
export interface Institution {
  institutionId: string;
  legalName: string;
  legalEntity: string;
  parentGroupId: string;
  jurisdiction: string;
  institutionType: "COMMERCIAL_BANK" | "FINANCIAL_INSTITUTION" | "CENTRAL_BANK";
  isSIB: boolean;  // Systemically Important Bank
  dataClass: DataClass;
  createdAt: string;
  updatedAt: string;
}

// 2. InstitutionLicense
export interface InstitutionLicense {
  licenseId: string;
  institutionId: string;
  licenseType: string;  // "BANKING" | "PAYMENT_SERVICES" | "EMI" | "ART" | "OTHER"
  licenseNumber: string | null;
  issuingAuthority: string;
  issueDate: string | null;
  expiryDate: string | null;
  status: "VALID" | "EXPIRED" | "SUSPENDED" | "PENDING" | "NOT_OBTAINED";
  dataClass: DataClass;
}

// 3. InstitutionRegulator
export interface InstitutionRegulator {
  regulatorId: string;
  institutionId: string;
  regulatorName: string;
  regulatorType: "CENTRAL_BANK" | "BANKING_SUPERVISOR" | "PAYMENT_REGULATOR" | "FINANCIAL_INTELLIGENCE_UNIT" | "SECURITIES_REGULATOR" | "DATA_AUTHORITY";
  jurisdiction: string;
  registrationNumber: string | null;
  dataClass: DataClass;
}

// 4. InstitutionAuthorization
export interface InstitutionAuthorization {
  authorizationId: string;
  institutionId: string;
  participantClass: "A" | "B" | "C";
  permittedFunctions: string[];
  permittedCurrencies: string[];
  permittedCorridors: string[];
  maxTransactionSize: number;
  maxIssuanceLimit: number;
  maxRedemptionLimit: number;
  authorizedAt: string | null;
  expiresAt: string | null;
  status: "AUTHORIZED" | "PENDING" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  dataClass: DataClass;
}

// 5. InstitutionDueDiligence
export interface InstitutionDueDiligence {
  ddId: string;
  institutionId: string;
  ddType: "LEGAL" | "FINANCIAL" | "OPERATIONAL" | "SECURITY" | "REGULATORY" | "COMMERCIAL";
  conductedBy: string | null;
  conductedAt: string | null;
  findings: string;
  recommendation: "PROCEED" | "CONDITIONAL" | "DO_NOT_PROCEED" | "PENDING";
  dataClass: DataClass;
}

// 6. InstitutionAgreement
export interface InstitutionAgreement {
  agreementId: string;
  institutionId: string;
  agreementType: "MOU" | "PILOT_AGREEMENT" | "PRODUCTION_AGREEMENT";
  signedDate: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  governingLaw: string;
  status: "DRAFT" | "NEGOTIATING" | "SIGNED" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  dataClass: DataClass;
}

// 7. InstitutionTechnicalIntegration
export interface InstitutionTechnicalIntegration {
  integrationId: string;
  institutionId: string;
  apiVersion: string;
  authenticationMethod: "HSM_MPC" | "HSM" | "MPC" | "API_KEY";
  endpointsConfigured: string[];
  integrationStatus: "NOT_STARTED" | "IN_PROGRESS" | "TESTING" | "CERTIFIED" | "PRODUCTION_READY";
  certifiedAt: string | null;
  dataClass: DataClass;
}

// 8. InstitutionComplianceAttestation
export interface InstitutionComplianceAttestation {
  attestationId: string;
  institutionId: string;
  attestationType: string;
  attestedBy: string | null;
  attestedAt: string | null;
  validUntil: string | null;
  status: "VALID" | "EXPIRED" | "PENDING" | "NOT_ATTESTED";
  dataClass: DataClass;
}

// 9. InstitutionStatus
export interface InstitutionStatus {
  statusId: string;
  institutionId: string;
  lifecycleStatus: BankLifecycleStatus;
  dataClass: DataClass;
  updatedAt: string;
  notes: string;
}

// ---- Task 2: Bank Lifecycle (13 statuses) ----

export type BankLifecycleStatus =
  | "PROSPECT"
  | "NDA"
  | "TECHNICAL_DISCOVERY"
  | "LEGAL_REVIEW"
  | "COMPLIANCE_REVIEW"
  | "COMMERCIAL_REVIEW"
  | "MOU_PENDING"
  | "MOU_SIGNED"
  | "PILOT_PENDING"
  | "PILOT_ACTIVE"
  | "APPROVED"
  | "SUSPENDED"
  | "TERMINATED";

export const BANK_LIFECYCLE_TRANSITIONS: Record<BankLifecycleStatus, BankLifecycleStatus[]> = {
  PROSPECT:           ["NDA", "TERMINATED"],
  NDA:               ["TECHNICAL_DISCOVERY", "TERMINATED"],
  TECHNICAL_DISCOVERY: ["LEGAL_REVIEW", "TERMINATED"],
  LEGAL_REVIEW:       ["COMPLIANCE_REVIEW", "TERMINATED"],
  COMPLIANCE_REVIEW:  ["COMMERCIAL_REVIEW", "TERMINATED"],
  COMMERCIAL_REVIEW:  ["MOU_PENDING", "TERMINATED"],
  MOU_PENDING:        ["MOU_SIGNED", "TERMINATED"],
  MOU_SIGNED:         ["PILOT_PENDING", "SUSPENDED", "TERMINATED"],
  PILOT_PENDING:      ["PILOT_ACTIVE", "TERMINATED"],
  PILOT_ACTIVE:       ["APPROVED", "SUSPENDED", "TERMINATED"],
  APPROVED:           ["SUSPENDED", "TERMINATED"],
  SUSPENDED:          ["PILOT_ACTIVE", "APPROVED", "TERMINATED"],
  TERMINATED:         [],
};

export function canTransitionBank(from: BankLifecycleStatus, to: BankLifecycleStatus): boolean {
  return BANK_LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---- Task 3: Bank Evidence Requirements (14 types) ----

export type BankEvidenceType =
  | "LEGAL_IDENTITY"
  | "REGULATOR"
  | "LICENSE"
  | "REGULATORY_STATUS"
  | "AML_FRAMEWORK"
  | "SANCTIONS_FRAMEWORK"
  | "CYBERSECURITY"
  | "CUSTOMER_ONBOARDING"
  | "CORPORATE_BANKING"
  | "SETTLEMENT_CAPABILITY"
  | "API_CAPABILITY"
  | "TREASURY_CAPABILITY"
  | "INCIDENT_RESPONSE"
  | "BUSINESS_CONTINUITY";

export const REQUIRED_BANK_EVIDENCE: BankEvidenceType[] = [
  "LEGAL_IDENTITY", "REGULATOR", "LICENSE", "REGULATORY_STATUS",
  "AML_FRAMEWORK", "SANCTIONS_FRAMEWORK", "CYBERSECURITY",
  "CUSTOMER_ONBOARDING", "CORPORATE_BANKING", "SETTLEMENT_CAPABILITY",
  "API_CAPABILITY", "TREASURY_CAPABILITY", "INCIDENT_RESPONSE", "BUSINESS_CONTINUITY",
];

export interface BankEvidence {
  evidenceId: string;
  institutionId: string;
  evidenceType: BankEvidenceType;
  description: string;
  documentHash: string | null;
  uploadedAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  dataClass: DataClass;
  status: "REQUIRED" | "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
}

export function checkBankEvidenceComplete(evidence: BankEvidence[]): { complete: boolean; missing: BankEvidenceType[] } {
  const obtained = new Set(evidence.filter(e => e.status === "VERIFIED").map(e => e.evidenceType));
  const missing = REQUIRED_BANK_EVIDENCE.filter(t => !obtained.has(t));
  return { complete: missing.length === 0, missing };
}

// ---- Task 4: Bank Authorization (4 block conditions) ----

export interface BankAuthorizationCheck {
  institutionId: string;
  licenseValid: boolean;
  authorizationValid: boolean;
  jurisdictionAllowed: boolean;
  complianceStatusPassed: boolean;
  settlementAllowed: boolean;
  blockReason: string | null;
}

export function checkBankAuthorization(input: {
  institutionId: string;
  license: InstitutionLicense;
  authorization: InstitutionAuthorization;
  jurisdictionAllowed: boolean;
  complianceAttestations: InstitutionComplianceAttestation[];
}): BankAuthorizationCheck {
  const licenseValid = input.license.status === "VALID";
  const authorizationValid = input.authorization.status === "AUTHORIZED"
    && (input.authorization.expiresAt === null || new Date(input.authorization.expiresAt) > new Date());
  const jurisdictionAllowed = input.jurisdictionAllowed;
  const complianceValid = input.complianceAttestations.length > 0
    && input.complianceAttestations.every(a => a.status === "VALID");

  const settlementAllowed = licenseValid && authorizationValid && jurisdictionAllowed && complianceValid;

  let blockReason: string | null = null;
  if (!licenseValid) blockReason = `License ${input.license.status} — settlement BLOCKED`;
  else if (!authorizationValid) blockReason = `Authorization ${input.authorization.status} — settlement BLOCKED`;
  else if (!jurisdictionAllowed) blockReason = `Jurisdiction prohibited — settlement BLOCKED`;
  else if (!complianceValid) blockReason = `Compliance attestation failed — settlement BLOCKED`;

  return { institutionId: input.institutionId, licenseValid, authorizationValid, jurisdictionAllowed, complianceStatusPassed: complianceValid, settlementAllowed, blockReason };
}

// ---- Task 5: Bank Commercial Package (7 elements) ----

export interface BankCommercialPackage {
  institutionId: string;
  feeConfig: {
    originationFeeBps: number;
    settlementFeeBps: number;
    redemptionFeeBps: number;
    fxServiceFeeBps: number;
    treasuryServiceMonthly: number;
    corporateAccountMonthly: number;
    apiConnectivityMonthly: number;
    liquidityServiceFeeBps: number;
  };
  corridors: string[];
  expectedMonthlyVolume: number;
  minimumAnnualCommitment: number;
  revenueSharing: {
    bankShare: number;  // 0-1 fraction
    mithqalShare: number;
  };
  settlementLimits: {
    maxSingleTransaction: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  serviceLevels: {
    settlementTime: string;
    supportResponse: string;
    reconciliationInterval: string;
    incidentResponse: string;
  };
}

export function createCommercialPackage(institutionId: string, jurisdiction: string): BankCommercialPackage {
  return {
    institutionId,
    feeConfig: {
      originationFeeBps: jurisdiction === "US" ? 4 : 5,
      settlementFeeBps: 3,
      redemptionFeeBps: jurisdiction === "US" ? 4 : 5,
      fxServiceFeeBps: jurisdiction === "JP" ? 6 : 8,
      treasuryServiceMonthly: 10_000,
      corporateAccountMonthly: 2_500,
      apiConnectivityMonthly: 5_000,
      liquidityServiceFeeBps: 2,
    },
    corridors: [],
    expectedMonthlyVolume: 5_000_000,
    minimumAnnualCommitment: 360_000,
    revenueSharing: { bankShare: 0.70, mithqalShare: 0.30 },
    settlementLimits: { maxSingleTransaction: 1_000_000, dailyLimit: 5_000_000, monthlyLimit: 50_000_000 },
    serviceLevels: {
      settlementTime: "Hours (technical); T+1 (legal/banking)",
      supportResponse: "P2 within 1 hour; P3 within 4 hours",
      reconciliationInterval: "15 minutes (3-way) + daily (5-way)",
      incidentResponse: "P1 within 15 minutes; Council within 1 hour",
    },
  };
}

// ---- Task 6: Bank Technical Certification (10 tests) ----

export interface TechnicalCertificationTest {
  testId: string;
  testName: string;
  description: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "PASSED" | "FAILED";
  testedAt: string | null;
  evidence: string;
}

export const REQUIRED_TECHNICAL_TESTS: Omit<TechnicalCertificationTest, "testId" | "testedAt">[] = [
  { testName: "Authentication", description: "Bank can authenticate via HSM/MPC and MFA", status: "NOT_STARTED", evidence: "Auth test log" },
  { testName: "Issuance", description: "Bank can submit and complete institutional issuance (9-step pipeline)", status: "NOT_STARTED", evidence: "Issuance test transaction" },
  { testName: "Settlement", description: "Bank can send and receive MTQ settlement", status: "NOT_STARTED", evidence: "Settlement test transaction" },
  { testName: "Redemption", description: "Bank can process redemption (atomic burn+release)", status: "NOT_STARTED", evidence: "Redemption test transaction" },
  { testName: "Reconciliation", description: "Bank can perform 3-way reconciliation (ledger=subledger=attestation)", status: "NOT_STARTED", evidence: "Reconciliation report" },
  { testName: "Attestation", description: "Bank can generate cryptographic attestation of positions", status: "NOT_STARTED", evidence: "Attestation proof" },
  { testName: "Sanctions", description: "Bank sanctions screening integrated with MITHQAL sanctions gate", status: "NOT_STARTED", evidence: "Sanctions screening log" },
  { testName: "Jurisdiction", description: "Bank JSG enforcement verified (permitted corridors only)", status: "NOT_STARTED", evidence: "JSG test results" },
  { testName: "Emergency", description: "Bank can respond to ISSUANCE_HALT and SETTLEMENT_RESTRICTION", status: "NOT_STARTED", evidence: "Emergency response test" },
  { testName: "Recovery", description: "Bank can recover from failed settlement (rollback+retry)", status: "NOT_STARTED", evidence: "Recovery test log" },
];

export function checkTechnicalCertification(tests: TechnicalCertificationTest[]): { allPassed: boolean; failed: string[] } {
  const failed = tests.filter(t => t.status !== "PASSED").map(t => t.testName);
  return { allPassed: failed.length === 0, failed };
}

// ---- Task 7: Bank Readiness Score (7 categories) ----

export type ReadinessCategory = "LEGAL" | "COMPLIANCE" | "TECHNICAL" | "FINANCIAL" | "OPERATIONAL" | "SECURITY" | "COMMERCIAL";

export interface CategoryScore {
  category: ReadinessCategory;
  score: number;  // 0-100
  mandatory: boolean;
  passed: boolean;
  evidence: string;
}

export interface BankReadinessScore {
  institutionId: string;
  categories: CategoryScore[];
  overallScore: number;
  allMandatoryPassed: boolean;
  livePilotEligible: boolean;
  blockers: string[];
}

export function computeBankReadiness(input: {
  institutionId: string;
  legalEvidence: BankEvidence[];
  complianceEvidence: BankEvidence[];
  technicalTests: TechnicalCertificationTest[];
  financialDueDiligence: InstitutionDueDiligence | null;
  operationalEvidence: BankEvidence[];
  securityEvidence: BankEvidence[];
  commercialPackage: BankCommercialPackage | null;
}): BankReadinessScore {
  const categories: CategoryScore[] = [];
  const blockers: string[] = [];

  // LEGAL
  const legalVerified = input.legalEvidence.filter(e => e.status === "VERIFIED").length;
  const legalRequired = ["LEGAL_IDENTITY", "REGULATOR", "LICENSE", "REGULATORY_STATUS"];
  const legalPassed = legalRequired.every(t => input.legalEvidence.find(e => e.evidenceType === t && e.status === "VERIFIED"));
  categories.push({ category: "LEGAL", score: Math.round(legalVerified / legalRequired.length * 100), mandatory: true, passed: legalPassed, evidence: `${legalVerified}/${legalRequired.length} verified` });
  if (!legalPassed) blockers.push("LEGAL: not all required evidence verified");

  // COMPLIANCE
  const complianceVerified = input.complianceEvidence.filter(e => e.status === "VERIFIED").length;
  const complianceRequired = ["AML_FRAMEWORK", "SANCTIONS_FRAMEWORK"];
  const compliancePassed = complianceRequired.every(t => input.complianceEvidence.find(e => e.evidenceType === t && e.status === "VERIFIED"));
  categories.push({ category: "COMPLIANCE", score: Math.round(complianceVerified / complianceRequired.length * 100), mandatory: true, passed: compliancePassed, evidence: `${complianceVerified}/${complianceRequired.length} verified` });
  if (!compliancePassed) blockers.push("COMPLIANCE: AML/sanctions not verified");

  // TECHNICAL
  const techPassed = input.technicalTests.filter(t => t.status === "PASSED").length;
  const techAll = input.technicalTests.length;
  const techPassedAll = techPassed === techAll;
  categories.push({ category: "TECHNICAL", score: Math.round(techPassed / techAll * 100), mandatory: true, passed: techPassedAll, evidence: `${techPassed}/${techAll} tests passed` });
  if (!techPassedAll) blockers.push("TECHNICAL: not all certification tests passed");

  // FINANCIAL
  const finDD = input.financialDueDiligence?.recommendation === "PROCEED";
  categories.push({ category: "FINANCIAL", score: finDD ? 100 : 0, mandatory: true, passed: finDD, evidence: input.financialDueDiligence?.recommendation ?? "PENDING" });
  if (!finDD) blockers.push("FINANCIAL: due diligence not complete");

  // OPERATIONAL
  const opVerified = input.operationalEvidence.filter(e => e.status === "VERIFIED").length;
  const opRequired = ["CORPORATE_BANKING", "SETTLEMENT_CAPABILITY", "TREASURY_CAPABILITY", "BUSINESS_CONTINUITY"];
  const opPassed = opRequired.every(t => input.operationalEvidence.find(e => e.evidenceType === t && e.status === "VERIFIED"));
  categories.push({ category: "OPERATIONAL", score: Math.round(opVerified / opRequired.length * 100), mandatory: true, passed: opPassed, evidence: `${opVerified}/${opRequired.length} verified` });
  if (!opPassed) blockers.push("OPERATIONAL: not all capabilities verified");

  // SECURITY
  const secVerified = input.securityEvidence.filter(e => e.status === "VERIFIED").length;
  const secRequired = ["CYBERSECURITY", "INCIDENT_RESPONSE"];
  const secPassed = secRequired.every(t => input.securityEvidence.find(e => e.evidenceType === t && e.status === "VERIFIED"));
  categories.push({ category: "SECURITY", score: Math.round(secVerified / secRequired.length * 100), mandatory: true, passed: secPassed, evidence: `${secVerified}/${secRequired.length} verified` });
  if (!secPassed) blockers.push("SECURITY: cybersecurity/incident response not verified");

  // COMMERCIAL
  const commReady = input.commercialPackage !== null;
  categories.push({ category: "COMMERCIAL", score: commReady ? 100 : 0, mandatory: false, passed: commReady, evidence: commReady ? "Commercial package created" : "Not created" });

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  const allMandatoryPassed = categories.filter(c => c.mandatory).every(c => c.passed);

  return {
    institutionId: input.institutionId,
    categories,
    overallScore,
    allMandatoryPassed,
    livePilotEligible: allMandatoryPassed,
    blockers,
  };
}
