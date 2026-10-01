/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — Institutional Critical Path (v25.3.2)
 * ════════════════════════════════════════════════════════════════════════
 *
 * One single institutional critical path. 12 sequential gates (G0 → G11).
 * No gate can be skipped. No gate can be passed through internal software
 * completion alone.
 *
 * GATE SEQUENCE:
 *   G0  Corporate / Contractual Integrity
 *   → G1  Pilot-Jurisdiction Legal Analysis
 *   → G2  Regulatory Perimeter
 *   → G3  Bank Design Partner
 *   → G4  Bank Contract
 *   → G5  Technical Integration
 *   → G6  Backing / Custody Evidence
 *   → G7  Controlled Pilot
 *   → G8  Independent Assurance
 *   → G9  Measured Bank Outcome
 *   → G10 Repeatability
 *   → G11 Production Authorization Review
 *
 * PRIMARY MANAGEMENT KPI:
 *   "NEXT EXTERNAL EVIDENCE ACHIEVED"
 *
 *   NOT: number of features, number of pages, number of modules,
 *   or percentage of internal architecture completed.
 *
 *   Internal software completeness is NEVER a gate-pass criterion.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CriticalGate {
  gateId: string;           // "G0" through "G11"
  label: string;
  sequence: number;          // 0-11
  entryCriteria: string;
  owner: string;
  evidenceRequired: string;
  externalDependency: string;
  failureCondition: string;
  exitCriteria: string;
  decisionAuthority: string;
  currentStatus: "NOT_STARTED" | "IN_PROGRESS" | "PENDING_EXTERNAL" | "PASSED" | "FAILED";
  evidenceClass: "EXECUTED_LEGAL_INSTRUMENT" | "INDEPENDENT_VALIDATION" | "CONTROLLING_POLICY" | "DOCUMENT_CLAIM" | "SIMULATED" | "DESIGN_TIME";
  externallyValidated: boolean;
  softwareCanPass: boolean;  // ALWAYS false — no gate passes from software alone
  nextAction: string;
  timestamp: string;
}

export interface CriticalPath {
  gates: CriticalGate[];
  currentGate: string;        // the next gate to work on
  gatesPassed: number;
  gatesTotal: number;
  nextExternalEvidenceRequired: string;  // the PRIMARY KPI
  managementKPI: string;     // "NEXT EXTERNAL EVIDENCE ACHIEVED"
  nonKPIMetrics: string[];   // what NOT to track
  honestState: {
    noGatePassesFromSoftware: boolean;
    primaryKPIIsExternalEvidence: boolean;
    productionAuthorized: boolean;
    allGatesSequential: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  12 Gates (G0 → G11)                                               */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";

export const CRITICAL_GATES: CriticalGate[] = [
  // ── G0: Corporate / Contractual Integrity ────────────────────────────
  {
    gateId: "G0",
    label: "Corporate / Contractual Integrity",
    sequence: 0,
    entryCriteria: "MITHQAL institutionalization sprint initiated. Architecture frozen at v25.3.2. RELEASE_MANIFEST_V25_3_2 created.",
    owner: "Founder/COO + external legal counsel",
    evidenceRequired: "Executed incorporation documents, authorized signatories, corporate structure verified by external counsel. institutional-external-identity.ts: 3 PENDING_ENTITY_IDENTITY (email, domain, website) must be resolved.",
    externalDependency: "Legal entity formation (government registry), external legal counsel for corporate verification.",
    failureCondition: "No legal entity exists OR signatories not authorized OR corporate structure cannot be verified by external counsel.",
    exitCriteria: "Corporate structure verified by external counsel. Authorized signatories confirmed. Institutional identity items (email, domain, website) established as REAL (not self-asserted).",
    decisionAuthority: "Founder/COO + external legal counsel (joint sign-off required).",
    currentStatus: "PENDING_EXTERNAL",
    evidenceClass: "EXECUTED_LEGAL_INSTRUMENT",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Engage external legal counsel to verify corporate structure + authorize signatories. Resolve 3 PENDING_ENTITY_IDENTITY items (email, domain, website).",
    timestamp: NOW,
  },
  // ── G1: Pilot-Jurisdiction Legal Analysis ────────────────────────────
  {
    gateId: "G1",
    label: "Pilot-Jurisdiction Legal Analysis",
    sequence: 1,
    entryCriteria: "G0 PASSED — corporate structure verified by external counsel.",
    owner: "COO + regulatory counsel (pilot jurisdiction)",
    evidenceRequired: "Jurisdiction-specific legal opinion on MTQ legal classification (commodity? security? payment instrument? e-money? other?). mtq-economic-definition.ts: canonicalDescription = 'permissioned, institutional, closed-loop settlement unit' — legal classification = PENDING_VALIDATION.",
    externalDependency: "Regulatory counsel in the pilot jurisdiction. jurisdiction-truth-model.ts: 8 jurisdictions ALL SEED_DATA/UNKNOWN — at least 1 must reach PUBLIC_MATERIAL_TRIAGE or RESTRICTED.",
    failureCondition: "MTQ legal classification cannot be determined OR the pilot jurisdiction prohibits the MTQ construct entirely.",
    exitCriteria: "Legal classification of MTQ obtained for at least 1 pilot jurisdiction. The classification is externally validated (not self-asserted).",
    decisionAuthority: "COO + external regulatory counsel (joint — the classification is a legal opinion, not a software determination).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "INDEPENDENT_VALIDATION",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Select 1 pilot jurisdiction. Engage regulatory counsel for MTQ legal classification opinion.",
    timestamp: NOW,
  },
  // ── G2: Regulatory Perimeter ─────────────────────────────────────────
  {
    gateId: "G2",
    label: "Regulatory Perimeter",
    sequence: 2,
    entryCriteria: "G1 PASSED — MTQ legal classification obtained for the pilot jurisdiction.",
    owner: "COO + regulatory counsel",
    evidenceRequired: "Regulatory sandbox/admission application filed OR no-regulatory-action letter OR applicable license obtained. jurisdiction-truth-model.ts: pilot jurisdiction must reach RESTRICTED (authorized) status, not UNKNOWN (CONSERVATIVE_BLOCK).",
    externalDependency: "Regulator in the pilot jurisdiction (central bank, financial regulator, or sandbox authority).",
    failureCondition: "Regulator denies the application OR requires licensing that has not been obtained OR jurisdiction classified as PROHIBITED.",
    exitCriteria: "Regulatory clearance for pilot obtained: sandbox admission OR no-action letter OR applicable license. The clearance is an external decision (not self-asserted).",
    decisionAuthority: "Regulator (external authority — NOT MITHQAL). The regulator decides; MITHQAL applies.",
    currentStatus: "NOT_STARTED",
    evidenceClass: "EXECUTED_LEGAL_INSTRUMENT",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "File regulatory sandbox/admission application in the pilot jurisdiction (requires G1 legal classification first).",
    timestamp: NOW,
  },
  // ── G3: Bank Design Partner ──────────────────────────────────────────
  {
    gateId: "G3",
    label: "Bank Design Partner",
    sequence: 3,
    entryCriteria: "G2 PASSED — regulatory clearance for pilot obtained.",
    owner: "COO",
    evidenceRequired: "Signed term sheet with a founding bank. The bank has reviewed the MITHQAL architecture + agreed to participate as a design partner. bank-contracting-package.ts: 17 sections currently ALL DRAFT — a term sheet is the precursor to the full contract.",
    externalDependency: "A bank willing to participate as a design partner. institutional-gtm-framework.ts: ALL targets RESEARCHED, 0 banks contacted.",
    failureCondition: "No bank agrees to participate (after regulatory clearance is obtained).",
    exitCriteria: "Bank design partner identified + term sheet signed (executed instrument, not a document claim). The bank's decision is external.",
    decisionAuthority: "Bank (external — the bank decides whether to participate; MITHQAL cannot force a bank).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "EXECUTED_LEGAL_INSTRUMENT",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Approach prospective banks with the regulatory clearance + legal classification. Negotiate term sheet.",
    timestamp: NOW,
  },
  // ── G4: Bank Contract ────────────────────────────────────────────────
  {
    gateId: "G4",
    label: "Bank Contract",
    sequence: 4,
    entryCriteria: "G3 PASSED — bank design partner identified + term sheet signed.",
    owner: "COO + external legal counsel (both sides)",
    evidenceRequired: "Executed bank master agreement (all 17 sections SIGNED, not DRAFT). bank-contracting-package.ts: currently 17 sections ALL DRAFT, 0 SIGNED. No contract may become SIGNED without actual executed evidence.",
    externalDependency: "Bank's legal team (external). Contract negotiation is bilateral.",
    failureCondition: "Contract negotiation fails (terms not agreed, bank withdraws, legal review identifies material issues).",
    exitCriteria: "Bank master agreement executed (all 17 sections SIGNED). Both parties' legal counsel have reviewed + approved. The contract is an executed legal instrument.",
    decisionAuthority: "Bank + COO (both must sign — bilateral contract execution).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "EXECUTED_LEGAL_INSTRUMENT",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Negotiate + execute bank master agreement (17 sections: master, settlement, custody, FX, compliance, data, audit, etc.).",
    timestamp: NOW,
  },
  // ── G5: Technical Integration ───────────────────────────────────────
  {
    gateId: "G5",
    label: "Technical Integration",
    sequence: 5,
    entryCriteria: "G4 PASSED — bank master agreement executed.",
    owner: "CTO (MITHQAL + bank IT)",
    evidenceRequired: "Bank's systems integrated with MBG gateway. ISO 20022 messages tested end-to-end. Pilot A (BM-01..BM-16B with MTQ disabled) executed against the bank's test environment. settlement-workflow-canonical.ts: 17 steps verified with the bank's infrastructure.",
    externalDependency: "Bank's IT team + bank's existing infrastructure (core banking, SWIFT, compliance screening).",
    failureCondition: "Technical incompatibility OR bank IT cannot integrate OR end-to-end settlement test fails.",
    exitCriteria: "End-to-end settlement tested (BM-01..BM-16B) with the bank's systems. ISO 20022 translation verified. Evidence packages generated for the test settlement.",
    decisionAuthority: "CTO (both MITHQAL + bank sides — joint technical sign-off).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "INDEPENDENT_VALIDATION",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Integrate bank's systems with MBG gateway. Test ISO 20022 end-to-end. Execute Pilot A against bank's test environment.",
    timestamp: NOW,
  },
  // ── G6: Backing / Custody Evidence ──────────────────────────────────
  {
    gateId: "G6",
    label: "Backing / Custody Evidence",
    sequence: 6,
    entryCriteria: "G5 PASSED — technical integration verified with the bank.",
    owner: "COO + custody counsel + external auditor",
    evidenceRequired: "Independent attestation of physical reserves. Executed custody agreement (pbc-legal-enforceability.ts: ALL 14 evidence predicates met). reserve-domains.ts: SETTLEMENT_LIQUIDITY domain has a qualified custodian. Gold backing independently verified (not self-asserted).",
    externalDependency: "Qualified custodian (regulated, external). External auditor (for reserve attestation).",
    failureCondition: "No qualified custodian engaged OR backing cannot be independently verified OR PBC enforceability not confirmed by external counsel.",
    exitCriteria: "Custody agreement executed. Independent attestation of physical reserves obtained. PBC enforceability confirmed by external counsel. All 14 PBC evidence predicates exist.",
    decisionAuthority: "Custodian (external — agrees to provide custody) + COO (agrees to terms). External auditor provides attestation.",
    currentStatus: "NOT_STARTED",
    evidenceClass: "EXECUTED_LEGAL_INSTRUMENT",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Engage qualified custodian. Execute custody agreement. Commission independent reserve attestation.",
    timestamp: NOW,
  },
  // ── G7: Controlled Pilot ─────────────────────────────────────────────
  {
    gateId: "G7",
    label: "Controlled Pilot",
    sequence: 7,
    entryCriteria: "G6 PASSED — custody + backing evidence obtained.",
    owner: "COO + CTO (joint with bank)",
    evidenceRequired: "Pilot executed (BM-01..BM-16B) with the REAL bank + REAL settlement (BANK_MONEY, not simulated). Evidence packages generated + INSTITUTIONALLY_VERIFIED (not SIMULATED). pilot-gate-framework.ts: relevant gates PASSED (not just implementation track).",
    externalDependency: "Bank (live participation — real settlement instructions). Custodian (live backing verification). Regulator (pilot oversight, if required).",
    failureCondition: "Pilot fails — settlement error, exception, reconciliation mismatch, compliance breach, OR any BM step fails irrecoverably.",
    exitCriteria: "Pilot completed with SETTLED state. All evidence packages INSTITUTIONALLY_VERIFIED. Reconciliation matched. Regulatory replay successful. Both parties (bank + MITHQAL) sign off.",
    decisionAuthority: "COO + CTO + bank representative (joint sign-off — all three must agree the pilot was successful).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "INDEPENDENT_VALIDATION",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Execute controlled pilot with the bank. Generate + verify evidence packages. Obtain joint sign-off.",
    timestamp: NOW,
  },
  // ── G8: Independent Assurance ────────────────────────────────────────
  {
    gateId: "G8",
    label: "Independent Assurance",
    sequence: 8,
    entryCriteria: "G7 PASSED — controlled pilot completed + joint sign-off obtained.",
    owner: "COO + external audit firm",
    evidenceRequired: "Independent audit report covering: settlement workflow, evidence packages, controls, reconciliation, compliance, custody, backing, operational procedures. technical-evidence-classification.ts: evidence elevated from SIMULATED → INDEPENDENT_VALIDATION.",
    externalDependency: "External audit firm (Big 4 or equivalent institutional auditor).",
    failureCondition: "Audit findings — material weaknesses, control gaps, evidence insufficiency, OR the auditor cannot provide a clean opinion.",
    exitCriteria: "Clean audit report (no material findings). All workflows, evidence, and controls independently verified. Evidence class elevated to INDEPENDENT_VALIDATION.",
    decisionAuthority: "External auditor (the auditor's opinion is the decision — MITHQAL cannot self-assert).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "INDEPENDENT_VALIDATION",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Commission independent institutional audit. Provide all evidence packages + workflow logs + controls documentation.",
    timestamp: NOW,
  },
  // ── G9: Measured Bank Outcome ───────────────────────────────────────
  {
    gateId: "G9",
    label: "Measured Bank Outcome",
    sequence: 9,
    entryCriteria: "G8 PASSED — independent assurance (clean audit) obtained.",
    owner: "CFO (bank side) + COO (MITHQAL side)",
    evidenceRequired: "Bank-provided baseline data (all 12 metrics) + measured pilot outcomes. bank-value-measurement-engine.ts: deltas computed (BANK_BENEFIT - all costs = NET INSTITUTIONAL VALUE). The value must be POSITIVE + externally validated by the bank's CFO.",
    externalDependency: "Bank's CFO (provides baseline + validates outcomes). The bank's finance team must confirm the measured value.",
    failureCondition: "Bank outcome does not meet agreed criteria OR NET INSTITUTIONAL VALUE is negative OR bank's CFO disputes the measurement.",
    exitCriteria: "Bank outcome measured + NET INSTITUTIONAL VALUE computed (positive). Bank's CFO validates the measurement. Evidence class = INDEPENDENT_VALIDATION (CFO-validated).",
    decisionAuthority: "CFO (bank side — the bank's CFO decides whether the outcome is acceptable; MITHQAL cannot self-assert value).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "INDEPENDENT_VALIDATION",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Collect bank baseline data. Measure pilot outcomes. Compute NET INSTITUTIONAL VALUE. Obtain CFO validation.",
    timestamp: NOW,
  },
  // ── G10: Repeatability ───────────────────────────────────────────────
  {
    gateId: "G10",
    label: "Repeatability",
    sequence: 10,
    entryCriteria: "G9 PASSED — measured bank outcome validated by CFO.",
    owner: "COO + CTO",
    evidenceRequired: "Second pilot with a DIFFERENT bank OR a different corridor, achieving the SAME result quality (SETTLED, evidence INSTITUTIONALLY_VERIFIED, NET INSTITUTIONAL VALUE positive). corridor-pain-index-operationalized.ts: a second corridor selected (with bank-provided baseline data, not SIMULATED).",
    externalDependency: "Second bank (OR second corridor with the same bank). The repeatability must be demonstrated externally.",
    failureCondition: "Results not repeatable — different bank/corridor → different outcome quality, OR second pilot fails.",
    exitCriteria: "Results repeatable across at least 2 banks OR 2 corridors. Both pilots: SETTLED, evidence INSTITUTIONALLY_VERIFIED, NET value positive.",
    decisionAuthority: "COO + CTO (joint — both must confirm repeatability across 2 instances).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "INDEPENDENT_VALIDATION",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Execute second pilot (different bank or corridor). Verify same result quality. Confirm repeatability.",
    timestamp: NOW,
  },
  // ── G11: Production Authorization Review ─────────────────────────────
  {
    gateId: "G11",
    label: "Production Authorization Review",
    sequence: 11,
    entryCriteria: "G10 PASSED — repeatability demonstrated across 2 instances.",
    owner: "Founder/COO + external counsel + regulator",
    evidenceRequired: "All gates G0-G10 PASSED. Comprehensive evidence package (all evidence INSTITUTIONALLY_VERIFIED). Regulatory approval for production deployment. This is the FINAL gate — the decision is EXTERNAL.",
    externalDependency: "Regulator (production authorization). External counsel (final legal opinion). The decision authority is EXTERNAL — MITHQAL cannot self-authorize production.",
    failureCondition: "Regulator denies production authorization OR any gate G0-G10 retroactively fails OR external counsel identifies a material legal issue.",
    exitCriteria: "Production authorized by the regulator. External counsel provides final clean opinion. All evidence INSTITUTIONALLY_VERIFIED. This gate, once passed, changes the status from 'NOT PRODUCTION-AUTHORIZED' to 'PRODUCTION-AUTHORIZED'.",
    decisionAuthority: "Regulator (external — the ONLY authority that can authorize production. NOT reachable from software, NOT from config, NOT from internal decision).",
    currentStatus: "NOT_STARTED",
    evidenceClass: "EXECUTED_LEGAL_INSTRUMENT",
    externallyValidated: false,
    softwareCanPass: false,
    nextAction: "Submit production authorization application to the regulator. Provide all evidence (G0-G10). Await regulatory decision.",
    timestamp: NOW,
  },
];

/* ------------------------------------------------------------------ */
/*  Critical Path                                                      */
/* ------------------------------------------------------------------ */

export function getCriticalPath(): CriticalPath {
  const gatesPassed = CRITICAL_GATES.filter(g => g.currentStatus === "PASSED").length;

  // Find the current gate (first NOT_STARTED or PENDING_EXTERNAL)
  const currentGate = CRITICAL_GATES.find(g => g.currentStatus === "PENDING_EXTERNAL" || g.currentStatus === "NOT_STARTED") || CRITICAL_GATES[CRITICAL_GATES.length - 1];

  return {
    gates: CRITICAL_GATES,
    currentGate: currentGate.gateId,
    gatesPassed,
    gatesTotal: CRITICAL_GATES.length,
    nextExternalEvidenceRequired:
      `GATE ${currentGate.gateId}: ${currentGate.label} — ${currentGate.nextAction} ` +
      `(requires: ${currentGate.externalDependency}). ` +
      `Evidence class: ${currentGate.evidenceClass}. Software cannot pass this gate.`,
    managementKPI: "NEXT EXTERNAL EVIDENCE ACHIEVED",
    nonKPIMetrics: [
      "NOT: number of features (internal metric — does not advance any gate)",
      "NOT: number of pages (internal metric — does not advance any gate)",
      "NOT: number of modules (internal metric — does not advance any gate)",
      "NOT: percentage of internal architecture completed (internal metric — does not advance any gate)",
      "NOT: number of API routes (internal metric — does not advance any gate)",
      "NOT: number of tests passing (internal metric — does not advance any gate)",
      "NOT: Brain consensus level (internal metric — does not advance any gate)",
      "NOT: deployment health (operational metric — does not advance any gate)",
    ],
    honestState: {
      noGatePassesFromSoftware: CRITICAL_GATES.every(g => !g.softwareCanPass),
      primaryKPIIsExternalEvidence: true,
      productionAuthorized: false, // G11 not passed
      allGatesSequential: CRITICAL_GATES.every((g, i) => g.sequence === i),
    },
    summary:
      `Institutional Critical Path: ${CRITICAL_GATES.length} sequential gates (G0 → G11). ` +
      `${gatesPassed}/${CRITICAL_GATES.length} gates PASSED. ` +
      `Current gate: ${currentGate.gateId} (${currentGate.label}). ` +
      `Primary KPI: "NEXT EXTERNAL EVIDENCE ACHIEVED" (not features/pages/modules/% complete). ` +
      `NO gate can be passed through internal software completion alone. ` +
      `Production authorization (G11) requires EXTERNAL regulatory decision. ` +
      `NOT PRODUCTION-AUTHORIZED.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Module Metadata                                                   */
/* ------------------------------------------------------------------ */

export const CRITICAL_PATH_META = {
  module: "institutional-critical-path",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  description:
    "One single institutional critical path. 12 sequential gates (G0 → G11). " +
    "No gate passes from software alone. Primary KPI: NEXT EXTERNAL EVIDENCE ACHIEVED.",
  gateCount: CRITICAL_GATES.length,
  gatesPassed: 0,
  primaryKPI: "NEXT EXTERNAL EVIDENCE ACHIEVED",
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  12 gates (G0 → G11). ALL have softwareCanPass = false.
//  0/12 gates PASSED. ALL are NOT_STARTED or PENDING_EXTERNAL.
//
//  PRIMARY KPI: "NEXT EXTERNAL EVIDENCE ACHIEVED"
//    NOT: number of features
//    NOT: number of pages
//    NOT: number of modules
//    NOT: percentage of internal architecture completed
//
//  Internal software completeness is NEVER a gate-pass criterion.
//  213 API routes + 17 tests + 39 canonical modules + Brain consensus = 0 gates passed.
//
//  G11 (Production Authorization) requires EXTERNAL regulatory decision.
//  NOT reachable from software, config, or internal decision.
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
