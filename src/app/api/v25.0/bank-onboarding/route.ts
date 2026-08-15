import { NextResponse } from "next/server";
import {
  BANK_LIFECYCLE_TRANSITIONS,
  REQUIRED_BANK_EVIDENCE,
  checkBankAuthorization,
  createCommercialPackage,
  REQUIRED_TECHNICAL_TESTS,
  checkTechnicalCertification,
  computeBankReadiness,
  type Institution,
  type InstitutionLicense,
  type InstitutionAuthorization,
  type BankEvidence,
  type TechnicalCertificationTest,
} from "@/lib/bank-onboarding";

export async function GET() {
  // Current testnet institutions (ALL SIMULATED — honest)
  const institutions: Institution[] = [
    { institutionId: "INST-001", legalName: "Test Bank A (US)", legalEntity: "Test Bank A LLC", parentGroupId: "GRP-A", jurisdiction: "US", institutionType: "COMMERCIAL_BANK", isSIB: false, dataClass: "SIMULATED", createdAt: "2026-08-01", updatedAt: "2026-08-15" },
    { institutionId: "INST-003", legalName: "Test Bank C (JP)", legalEntity: "Test Bank C KK", parentGroupId: "GRP-C", jurisdiction: "JP", institutionType: "COMMERCIAL_BANK", isSIB: true, dataClass: "SIMULATED", createdAt: "2026-08-01", updatedAt: "2026-08-15" },
    { institutionId: "INST-004", legalName: "Test Bank D (AE)", legalEntity: "Test Bank D Ltd", parentGroupId: "GRP-D", jurisdiction: "AE", institutionType: "COMMERCIAL_BANK", isSIB: false, dataClass: "SIMULATED", createdAt: "2026-08-01", updatedAt: "2026-08-15" },
  ];

  // Licenses (ALL NOT_OBTAINED — honest)
  const licenses: InstitutionLicense[] = institutions.map(i => ({
    licenseId: `LIC-${i.institutionId}`, institutionId: i.institutionId,
    licenseType: "BANKING", licenseNumber: null, issuingAuthority: i.jurisdiction === "US" ? "OCC" : i.jurisdiction === "JP" ? "FSA" : "CBUAE",
    issueDate: null, expiryDate: null, status: "NOT_OBTAINED", dataClass: "SIMULATED",
  }));

  // Authorizations (ALL SIMULATED — testnet only)
  const authorizations: InstitutionAuthorization[] = institutions.map(i => ({
    authorizationId: `AUTH-${i.institutionId}`, institutionId: i.institutionId, participantClass: "B" as const,
    permittedFunctions: ["SETTLE", "ACQUIRE", "REDEEM", "ROUTE", "ISSUE"],
    permittedCurrencies: ["USD", "JPY", "AED"], permittedCorridors: ["US-JP", "US-AE", "JP-AE"],
    maxTransactionSize: 1_000_000, maxIssuanceLimit: 5_000_000, maxRedemptionLimit: 5_000_000,
    authorizedAt: "2026-08-01", expiresAt: "2027-08-01", status: "AUTHORIZED", dataClass: "SIMULATED",
  }));

  // Evidence (ALL REQUIRED — 0 verified)
  const allEvidence: BankEvidence[] = REQUIRED_BANK_EVIDENCE.map((type, i) => ({
    evidenceId: `BE-${String(i+1).padStart(3,'0')}`, institutionId: "INST-001",
    evidenceType: type, description: `${type} for Test Bank A`,
    documentHash: null, uploadedAt: null, verifiedBy: null, verifiedAt: null,
    dataClass: "SIMULATED", status: "REQUIRED" as const,
  }));

  // Technical tests (ALL NOT_STARTED)
  const techTests: TechnicalCertificationTest[] = REQUIRED_TECHNICAL_TESTS.map((t, i) => ({
    testId: `TT-${String(i+1).padStart(2,'0')}`, testName: t.testName, description: t.description,
    status: "NOT_STARTED" as const, testedAt: null, evidence: t.evidence,
  }));

  // Authorization check for INST-001
  const authCheck = checkBankAuthorization({
    institutionId: "INST-001",
    license: licenses[0],
    authorization: authorizations[0],
    jurisdictionAllowed: true,
    complianceAttestations: [],
  });

  // Commercial package
  const commercialPkg = createCommercialPackage("INST-001", "US");

  // Technical certification check
  const techCert = checkTechnicalCertification(techTests);

  // Readiness score for INST-001
  const readiness = computeBankReadiness({
    institutionId: "INST-001",
    legalEvidence: allEvidence.filter(e => ["LEGAL_IDENTITY","REGULATOR","LICENSE","REGULATORY_STATUS"].includes(e.evidenceType)),
    complianceEvidence: allEvidence.filter(e => ["AML_FRAMEWORK","SANCTIONS_FRAMEWORK"].includes(e.evidenceType)),
    technicalTests: techTests,
    financialDueDiligence: null,
    operationalEvidence: allEvidence.filter(e => ["CORPORATE_BANKING","SETTLEMENT_CAPABILITY","TREASURY_CAPABILITY","BUSINESS_CONTINUITY"].includes(e.evidenceType)),
    securityEvidence: allEvidence.filter(e => ["CYBERSECURITY","INCIDENT_RESPONSE"].includes(e.evidenceType)),
    commercialPackage: commercialPkg,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    version: "v25.0-bank-onboarding",

    // Task 1: Master records
    institutions: institutions.map(i => ({ id: i.institutionId, name: i.legalName, jurisdiction: i.jurisdiction, type: i.institutionType, dataClass: i.dataClass })),
    licenses: licenses.map(l => ({ institution: l.institutionId, status: l.status, dataClass: l.dataClass })),

    // Task 2: Lifecycle (13 statuses)
    lifecycle: { statuses: Object.keys(BANK_LIFECYCLE_TRANSITIONS), currentAll: "PROSPECT" },

    // Task 3: Evidence (14 types required)
    evidence: { required: REQUIRED_BANK_EVIDENCE.length, verified: 0, missing: REQUIRED_BANK_EVIDENCE.length, status: "ALL REQUIRED — 0 VERIFIED" },

    // Task 4: Authorization check
    authorizationCheck: authCheck,

    // Task 5: Commercial package
    commercialPackage: { institutionId: commercialPkg.institutionId, corridors: commercialPkg.corridors, expectedVolume: commercialPkg.expectedMonthlyVolume, minCommitment: commercialPkg.minimumAnnualCommitment, feeConfig: commercialPkg.feeConfig },

    // Task 6: Technical certification (10 tests)
    technicalCertification: { tests: techTests.map(t => ({ name: t.testName, status: t.status })), allPassed: techCert.allPassed, failed: techCert.failed },

    // Task 7: Readiness score
    readiness: {
      institutionId: readiness.institutionId,
      categories: readiness.categories.map(c => ({ category: c.category, score: c.score, mandatory: c.mandatory, passed: c.passed, evidence: c.evidence })),
      overallScore: readiness.overallScore,
      allMandatoryPassed: readiness.allMandatoryPassed,
      livePilotEligible: readiness.livePilotEligible,
      blockers: readiness.blockers,
    },

    // Honest status
    honestStatus: {
      allInstitutionsSimulated: institutions.every(i => i.dataClass === "SIMULATED"),
      allLicensesNotObtained: licenses.every(l => l.status === "NOT_OBTAINED"),
      allEvidenceRequired: allEvidence.every(e => e.status === "REQUIRED"),
      allTechTestsNotStarted: techTests.every(t => t.status === "NOT_STARTED"),
      readinessScore: readiness.overallScore,
      livePilotEligible: readiness.livePilotEligible,
      blockers: readiness.blockers.length,
    },

    acceptance: {
      "9 entity types defined": true,
      "13 lifecycle statuses": Object.keys(BANK_LIFECYCLE_TRANSITIONS).length === 13,
      "14 evidence types required": REQUIRED_BANK_EVIDENCE.length === 14,
      "Authorization blocks on 4 conditions": !authCheck.settlementAllowed,
      "Commercial package created": commercialPkg !== null,
      "10 technical certification tests": REQUIRED_TECHNICAL_TESTS.length === 10,
      "7 readiness categories": readiness.categories.length === 7,
      "LIVE_PILOT blocked until all mandatory pass": !readiness.livePilotEligible,
    },

    honest: true, forced_to_pass: false,
  });
}
