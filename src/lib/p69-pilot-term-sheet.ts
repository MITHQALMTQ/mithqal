/**
 * MITHQAL — PROMPT 69: CONTROLLED PILOT TERM SHEET & MUTUAL PILOT COMMITMENTS
 *
 * Architecture FROZEN at v25.3.2. No architecture expansion.
 * Pilot term sheet FRAMEWORK — ALL data PROPOSED/UNKNOWN/BLOCKED.
 *
 * G0: G0_CONDITIONAL. G1: READY_FOR_COUNSEL (BLOCKED_BY_G0).
 * 0 banks contacted. 0 workshops conducted. 0 counsel engaged.
 *
 * PILOT_TERM_SHEET_STATUS: BLOCKED_BY_WORKSHOP
 * (no workshop evidence exists, no bank engaged)
 *
 * MTQ_STATUS: DISABLED (default, cannot change without 6 conditions)
 *
 * NOT PRODUCTION-AUTHORIZED. No term presented as agreed.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TermSheetTruthState = "BANK_CONFIRMED" | "MITHQAL_CONFIRMED" | "COUNSEL_CONFIRMED" | "EXTERNAL_SOURCE" | "PROPOSED" | "ASSUMED" | "UNKNOWN" | "BLOCKED" | "CONFLICTED";
export type PilotOutcome = "SUCCESS" | "PARTIAL_SUCCESS" | "INCONCLUSIVE" | "VALUE_NOT_DEMONSTRATED" | "CONTROL_FAILURE" | "PILOT_BLOCKED";
export type TermSheetGate = "DRAFT" | "INTERNAL_REVIEW" | "BANK_REVIEW" | "LEGAL_REVIEW" | "COMMERCIAL_REVIEW" | "PILOT_NEGOTIATION" | "EXECUTED";
export type PreCheckResult = "PASS" | "FAIL" | "PENDING" | "NOT_APPLICABLE";

export interface ConditionPrecedent {
  conditionId: string;
  description: string;
  owner: string;
  evidenceRequired: string;
  status: TermSheetTruthState;
  blocking: boolean;
  dependency: string;
  approvalRequired: string;
}

export interface PilotKPI {
  kpiId: string;
  definition: string;
  baseline: string;
  target: string;
  measurementMethod: string;
  source: string;
  frequency: string;
  owner: string;
  acceptanceThreshold: string;
  limitations: string;
  truthState: TermSheetTruthState;
}

export interface StopCondition {
  trigger: string;
  automaticResponse: string;
  safeState: string;
  notification: string;
  escalation: string;
  resolution: string;
  restartAuthority: string;
  evidenceRequired: string;
}

export interface CriticalBlocker {
  blockerId: string;
  category: string;
  description: string;
  impact: string;
  owner: string;
  requiredEvidence: string;
  dependency: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  status: string;
}

export interface GoNoGoPreCheck {
  checkId: string;
  check: string;
  result: PreCheckResult;
  evidence: string;
  owner: string;
}

export interface HumanExternalDependency {
  dependency: string;
  whyExternal: string;
  owner: string;
  requiredEvidence: string;
  status: string;
  nextAction: string;
}

export interface NegotiationTerm {
  term: string;
  mithqalProposal: string;
  bankPosition: string;
  counselInput: string;
  currentStatus: TermSheetTruthState;
  owner: string;
  nextAction: string;
}

export interface PilotTermSheetFramework {
  priorBaselines: string[];
  truthModel: { state: TermSheetTruthState; definition: string }[];
  pilotDefinition: {
    pilotName: string; pilotId: string; bank: string; corridor: string;
    jurisdiction: string; businessProblem: string; bankStatedProblem: string;
    pilotObjective: string; pilotScope: string; pilotMode: string;
    participants: string; settlementAsset: string; mtqStatus: string;
    environment: string; dataClass: string;
    pilotStartCondition: string; pilotEndCondition: string;
    truthState: TermSheetTruthState;
  };
  falsifiableHypothesis: { stage: string; content: string; truthState: TermSheetTruthState };
  scopeBoundary: { inScope: string[]; outOfScope: string[]; dependentOnExternalApproval: string[]; unknown: string[] };
  raciMatrix: { activity: string; responsible: string; accountable: string; consulted: string; informed: string }[];
  conditionsPrecedent: ConditionPrecedent[];
  pilotWorkflows: string[];
  finalityContract: { bankDefinition: string; mithqalModel: string; externalRail: string; legalFinality: string; evidenceRequired: string; truthState: TermSheetTruthState };
  dataSharingFramework: { principle: string; dataCategories: string[]; truthState: TermSheetTruthState };
  securitySchedule: { categories: string[]; truthState: TermSheetTruthState };
  complianceSchedule: { categories: string[]; truthState: TermSheetTruthState };
  reconciliationProtocol: { sources: string[]; matchingKey: string; toleranceClass: string; breakCategories: string[]; truthState: TermSheetTruthState };
  failureSafeHaltProtocol: StopCondition[];
  pilotSecurityOfValue: { valueType: string; controls: string[]; truthState: TermSheetTruthState };
  pilotLimits: { field: string; value: string; truthState: TermSheetTruthState }[];
  kpiFramework: PilotKPI[];
  valueTest: { currentVsPilot: string[]; truthState: TermSheetTruthState };
  successFailureLogic: { outcome: PilotOutcome; criteria: string }[];
  governance: { steeringCommittee: string; operatingTeam: string; escalationPath: string; decisionRights: string; truthState: TermSheetTruthState };
  changeControl: string[];
  evidencePackage: string[];
  assuranceReadiness: { status: string; truthState: TermSheetTruthState };
  commercialPrinciples: { costCategories: string[]; pricingStatus: TermSheetTruthState };
  ipFramework: { truthState: TermSheetTruthState; counselReviewRequired: boolean };
  confidentialityFramework: { categories: string[]; truthState: TermSheetTruthState };
  publicityControl: { restrictions: string[]; truthState: TermSheetTruthState };
  negotiationMatrix: NegotiationTerm[];
  exitWindDown: string[];
  postPilotDecision: string[];
  pilotReadinessStatus: {
    pilotId: string; bank: string; corridor: string;
    problemStatus: string; workshopStatus: string; legalStatus: string;
    regulatoryStatus: string; technicalStatus: string; securityStatus: string;
    complianceStatus: string; dataStatus: string; custodyStatus: string;
    settlementStatus: string; reconciliationStatus: string; participantStatus: string;
    termSheetStatus: string; conditionsPrecedent: string;
    criticalBlockers: string[]; unknowns: string[];
    proposedScope: string; mtqStatus: string;
    kpiBaselineStatus: string; kpiTargetStatus: string;
    evidenceReadiness: string; assuranceReadiness: string;
    productionAuthorized: boolean; institutionallyValidated: boolean;
    nextExternalEvidence: string;
  };
  termSheetGate: TermSheetGate;
  criticalBlockers: CriticalBlocker[];
  goNoGoPreChecks: GoNoGoPreCheck[];
  mtqControl: { status: string; conditions: string[]; extensionProposal: string };
  humanExternalDependencies: HumanExternalDependency[];
  finalDecision: {
    pilotTermSheetStatus: string;
    pilotValueHypothesis: string;
    pilotScopeSummary: string;
    topCriticalBlocker: string;
    owner: string;
    nextExternalEvidence: string;
  };
  honestState: {
    productionAuthorized: boolean;
    noTermPresentedAsAgreed: boolean;
    architectureNotModified: boolean;
    mtqDisabled: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Constants + Data                                                   */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T22:55:00Z";

const TRUTH_MODEL = [
  { state: "BANK_CONFIRMED" as TermSheetTruthState, definition: "Formally supplied or confirmed by the bank/institution" },
  { state: "MITHQAL_CONFIRMED" as TermSheetTruthState, definition: "Supported by current controlled MITHQAL implementation and evidence" },
  { state: "COUNSEL_CONFIRMED" as TermSheetTruthState, definition: "Supported by qualified external counsel evidence" },
  { state: "EXTERNAL_SOURCE" as TermSheetTruthState, definition: "Supported by identifiable external authoritative source" },
  { state: "PROPOSED" as TermSheetTruthState, definition: "MITHQAL proposal awaiting counterpart agreement" },
  { state: "ASSUMED" as TermSheetTruthState, definition: "Analytical assumption" },
  { state: "UNKNOWN" as TermSheetTruthState, definition: "Insufficient evidence" },
  { state: "BLOCKED" as TermSheetTruthState, definition: "Cannot progress without a dependency" },
  { state: "CONFLICTED" as TermSheetTruthState, definition: "Authoritative sources disagree" },
];

const PILOT_DEFINITION = {
  pilotName: "MITHQAL Pilot A — Controlled Institutional Settlement (MTQ Disabled)",
  pilotId: "PILOT-A-001",
  bank: "UNKNOWN — 0 banks contacted. 15 researched, 0 engaged.",
  corridor: "C-AE-SG (UAE → Singapore) — selected for deep discovery, NOT bank-confirmed",
  jurisdiction: "AE (DIFC/ADGM) — selected in G1, NOT counsel-confirmed",
  businessProblem: "Cross-border settlement friction: latency, trapped liquidity, FX cost, reconciliation burden, compliance/evidence effort",
  bankStatedProblem: "UNKNOWN — no bank has been engaged. Bank-stated pain does not exist.",
  pilotObjective: "Test whether MITHQAL control plane can coordinate a settlement workflow end-to-end with a real bank, producing measurable evidence about current vs proposed performance. Must be capable of producing a NO-GO result.",
  pilotScope: "PROPOSED — 1 bank, 1 corridor (AE-SG), BANK_MONEY, MTQ disabled, controlled test environment, 19 BM steps, SIMULATED → CONTROLLED TEST evidence",
  pilotMode: "MODE A — MTQ DISABLED. Settlement asset = BANK_MONEY. 0/19 steps use MTQ.",
  participants: "UNKNOWN — no participants confirmed. Bank: UNKNOWN. MITHQAL: Jozour LLC (G0_CONDITIONAL). Custodian: NONE. Rail: SIMULATED.",
  settlementAsset: "BANK_MONEY (PROPOSED — no bank confirmed)",
  mtqStatus: "DISABLED (default, cannot change without 6 conditions)",
  environment: "MITHQAL test environment (Vercel + Turso) + bank's test/staging environment (UNKNOWN — no bank engaged)",
  dataClass: "Synthetic/anonymized/aggregated (PROPOSED — no bank data confirmed)",
  pilotStartCondition: "BLOCKED — requires: G0_PASS + G1 counsel opinion + G2 regulatory clearance + G3 bank design partner + G4 bank contract + G5 technical integration + G6 backing/custody evidence + NDA + workshop completion",
  pilotEndCondition: "PROPOSED — pilot completion when: all workflows tested, evidence generated, KPIs measured, decision made (GO/NO-GO/CONDITIONAL)",
  truthState: "BLOCKED" as TermSheetTruthState,
};

const FALSIFIABLE_HYPOTHESIS = {
  stage: "CURRENT_BANK_PROBLEM → CURRENT_BANK_PROCESS → CURRENT_FRICTION → MITHQAL_INTERVENTION → EXPECTED_EFFECT → MEASUREMENT → GO/NO-GO_DECISION",
  content: "PROPOSED: Cross-border settlement involves T+2/T+3 latency, trapped liquidity, manual reconciliation, opaque FX. MITHQAL coordinates 19 settlement steps with automated evidence + reconciliation. Expected: reduced coordination friction, automated evidence, measurable improvement. Measurement: 12 KPIs with bank-provided baseline. Decision: GO if measurable improvement + acceptable legal/regulatory conditions; NO-GO if no improvement or conditions not met. The pilot MUST be capable of disproving the MITHQAL value hypothesis.",
  truthState: "PROPOSED" as TermSheetTruthState,
};

const SCOPE_BOUNDARY = {
  inScope: [
    "Institutional participants only (no retail)",
    "Limited controlled scope (1 bank, 1 corridor)",
    "Controlled environment (test/staging)",
    "Limited transaction types + predefined value/volume bounds",
    "Explicit authorization required",
    "Full audit trail + controlled exception handling",
    "Safe-halt capability + reconciliation + failure testing",
    "MTQ DISABLED (BANK_MONEY settlement)",
  ],
  outOfScope: [
    "Retail users", "Public secondary trading", "Speculative MTQ activity",
    "Public token distribution", "Unsupported reserve claims",
    "Unauthorized live settlement", "Unapproved cross-border activity",
    "Production claims", "Production MTQ issuance/settlement",
  ],
  dependentOnExternalApproval: [
    "Legal review (G1 counsel opinion)", "Regulatory clearance (G2)",
    "Bank approval (G3+G4)", "Custody arrangement (G6)",
    "Security review", "Compliance review", "Data-sharing agreement (NDA + DPA)",
  ],
  unknown: [
    "Specific transaction types (no bank engaged)",
    "Value/volume bounds (no bank baseline)",
    "Bank's test environment specifics",
    "Bank's compliance requirements",
    "Bank's security requirements",
    "Bank's reconciliation requirements",
  ],
};

const CONDITIONS_PRECEDENT: ConditionPrecedent[] = [
  { conditionId: "CP-01", description: "Legal review completed to required threshold", owner: "External counsel", evidenceRequired: "Written legal opinion (22 deliverables CD-A through CD-V)", status: "BLOCKED", blocking: true, dependency: "G0_PASS + G1 counsel engagement", approvalRequired: "Counsel sign-off" },
  { conditionId: "CP-02", description: "Regulatory requirements understood", owner: "COO + regulatory counsel", evidenceRequired: "Regulatory clearance or no-action letter", status: "BLOCKED", blocking: true, dependency: "G1 PASS → G2", approvalRequired: "Regulator decision" },
  { conditionId: "CP-03", description: "Participating entities identified", owner: "COO", evidenceRequired: "Executed bank agreement (17 sections SIGNED)", status: "BLOCKED", blocking: true, dependency: "G0+G1+G2+G3+G4", approvalRequired: "Bilateral" },
  { conditionId: "CP-04", description: "Required licenses/permissions confirmed", owner: "External counsel", evidenceRequired: "License/permission documentation", status: "BLOCKED", blocking: true, dependency: "G1+G2", approvalRequired: "Regulator" },
  { conditionId: "CP-05", description: "Bank approval obtained", owner: "COO", evidenceRequired: "Bank board/executive approval documentation", status: "BLOCKED", blocking: true, dependency: "G3+G4", approvalRequired: "Bank executive" },
  { conditionId: "CP-06", description: "Technical scope agreed", owner: "CTO", evidenceRequired: "Technical scope document + integration plan", status: "BLOCKED", blocking: true, dependency: "Workshop completion + G5", approvalRequired: "Both CTOs" },
  { conditionId: "CP-07", description: "Security review completed", owner: "CTO + bank security", evidenceRequired: "Security assessment report", status: "BLOCKED", blocking: true, dependency: "Workshop + bank security team", approvalRequired: "Both CISOs" },
  { conditionId: "CP-08", description: "Data-sharing basis established", owner: "CTO + data counsel", evidenceRequired: "Executed NDA + DPA", status: "BLOCKED", blocking: true, dependency: "G0_PASS", approvalRequired: "Both legal teams" },
  { conditionId: "CP-09", description: "Compliance requirements established", owner: "CCO + bank compliance", evidenceRequired: "Compliance requirements document", status: "BLOCKED", blocking: true, dependency: "Workshop + G1", approvalRequired: "Both CCOs" },
  { conditionId: "CP-10", description: "Custody/backing requirements established", owner: "COO + custody counsel", evidenceRequired: "Executed custody agreement + attestation", status: "BLOCKED", blocking: true, dependency: "G6", approvalRequired: "Custodian + COO" },
  { conditionId: "CP-11", description: "Operating procedures agreed", owner: "COO + bank ops", evidenceRequired: "Operating procedures document", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both ops leads" },
  { conditionId: "CP-12", description: "Incident procedures agreed", owner: "CTO + bank ops", evidenceRequired: "Incident response plan", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both teams" },
  { conditionId: "CP-13", description: "Reconciliation methodology agreed", owner: "CTO + bank recon", evidenceRequired: "Reconciliation protocol document", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both teams" },
  { conditionId: "CP-14", description: "Success metrics agreed", owner: "COO + bank exec", evidenceRequired: "KPI agreement document", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both executives" },
  { conditionId: "CP-15", description: "Stop conditions agreed", owner: "COO + bank exec", evidenceRequired: "Stop conditions document", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both executives" },
  { conditionId: "CP-16", description: "Evidence ownership agreed", owner: "CTO + bank audit", evidenceRequired: "Evidence ownership document", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both teams" },
  { conditionId: "CP-17", description: "Confidentiality arrangements established", owner: "COO + bank legal", evidenceRequired: "Executed NDA", status: "BLOCKED", blocking: true, dependency: "G0_PASS", approvalRequired: "Both legal teams" },
  { conditionId: "CP-18", description: "Support/escalation arrangements established", owner: "COO + bank ops", evidenceRequired: "Support + escalation document", status: "BLOCKED", blocking: true, dependency: "Workshop", approvalRequired: "Both teams" },
];

const KPI_FRAMEWORK: PilotKPI[] = [
  { kpiId: "KPI-01", definition: "Instruction-to-finality time", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Time(BM-01 instruction received) → Time(BM-16A finality)", source: "MITHQAL execution log + bank confirmation", frequency: "Per transaction", owner: "CTO", acceptanceThreshold: "PROPOSED — to be agreed with bank", limitations: "No bank baseline exists", truthState: "UNKNOWN" },
  { kpiId: "KPI-02", definition: "End-to-end settlement time", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Time(instruction) → Time(settlement confirmed)", source: "MITHQAL + bank", frequency: "Per transaction", owner: "CTO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-03", definition: "Reconciliation duration", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Time(BM-16A-RECON start) → Time(matched)", source: "MITHQAL reconciliation log", frequency: "Per transaction", owner: "CTO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-04", definition: "Manual intervention rate", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Count(manual interventions) / Count(total transactions)", source: "MITHQAL + bank ops log", frequency: "Per pilot", owner: "CTO + bank ops", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-05", definition: "Exception rate", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Count(exceptions) / Count(total)", source: "MITHQAL exception log", frequency: "Per pilot", owner: "CTO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-06", definition: "Failure recovery time", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Time(failure detected) → Time(recovery complete)", source: "MITHQAL continuity log", frequency: "Per failure event", owner: "CTO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-07", definition: "Evidence retrieval time", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Time(evidence request) → Time(package delivered)", source: "MITHQAL evidence fabric", frequency: "Per retrieval", owner: "CTO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-08", definition: "Compliance processing time", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Time(BM-11 start) → Time(BM-11 pass)", source: "MITHQAL compliance log", frequency: "Per transaction", owner: "CTO + CCO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-09", definition: "Liquidity utilization", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Utilized / Available", source: "Bank treasury + MITHQAL", frequency: "Per pilot", owner: "Treasury", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-10", definition: "Liquidity pre-positioning", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Pre-positioned balance / Total", source: "Bank treasury", frequency: "Per pilot", owner: "Treasury", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-11", definition: "FX cost", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "FX spread + fees per transaction", source: "Bank FX + MITHQAL BM-13", frequency: "Per transaction", owner: "Treasury", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-12", definition: "Operational cost", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "FTE-hours + system cost", source: "Bank ops + MITHQAL", frequency: "Per pilot", owner: "Ops", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-13", definition: "Transaction processing cost", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Total cost / transaction count", source: "Bank + MITHQAL", frequency: "Per pilot", owner: "CFO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-14", definition: "Data completeness", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Fields populated / Fields required", source: "MITHQAL evidence fabric", frequency: "Per transaction", owner: "CTO", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
  { kpiId: "KPI-15", definition: "Evidence completeness", baseline: "UNKNOWN", target: "UNKNOWN", measurementMethod: "Evidence packages complete / total", source: "MITHQAL evidence fabric", frequency: "Per transaction", owner: "CTO + audit", acceptanceThreshold: "PROPOSED", limitations: "No bank baseline", truthState: "UNKNOWN" },
];

const STOP_CONDITIONS: StopCondition[] = [
  { trigger: "Unauthorized instruction", automaticResponse: "Block + safe halt", safeState: "BM-HALT (no partial settlement)", notification: "Notify both parties + counsel", escalation: "COO + bank exec + counsel", resolution: "Investigate + resolve + counsel approval to restart", restartAuthority: "Joint (COO + bank exec + counsel)", evidenceRequired: "Full audit trail of unauthorized instruction + halt" },
  { trigger: "Missing required authorization", automaticResponse: "Block + safe halt", safeState: "BM-HALT", notification: "Notify both parties", escalation: "COO + bank ops", resolution: "Provide authorization or cancel", restartAuthority: "Joint", evidenceRequired: "Authorization evidence or cancellation record" },
  { trigger: "Legal condition becomes invalid", automaticResponse: "Safe halt + notify counsel", safeState: "BM-HALT", notification: "Notify counsel immediately", escalation: "Counsel + COO + bank legal", resolution: "Counsel review + re-establish legal basis", restartAuthority: "Counsel only", evidenceRequired: "Counsel opinion on legal condition" },
  { trigger: "Compliance failure", automaticResponse: "Block + safe halt", safeState: "BM-HALT", notification: "Notify compliance + bank", escalation: "CCO + bank compliance", resolution: "Compliance investigation + resolution", restartAuthority: "Joint CCOs", evidenceRequired: "Compliance investigation record" },
  { trigger: "Settlement rail unavailable", automaticResponse: "Alternative routing or safe halt", safeState: "BM-HALT or BM-12-ALT", notification: "Notify ops", escalation: "CTO + bank ops", resolution: "Rail recovery or alternative rail", restartAuthority: "CTO + bank ops", evidenceRequired: "Rail failure record + alternative routing evidence" },
  { trigger: "Data integrity failure", automaticResponse: "Safe halt immediately", safeState: "BM-HALT", notification: "Notify security + counsel", escalation: "CTO + bank CISO + counsel", resolution: "Data integrity investigation + repair", restartAuthority: "Joint (CTO + bank CISO + counsel)", evidenceRequired: "Integrity failure record + repair evidence" },
  { trigger: "Unexplained reconciliation break", automaticResponse: "Safe halt + investigation", safeState: "BM-HALT", notification: "Notify ops + audit", escalation: "CTO + bank ops + audit", resolution: "Investigate break + resolve + re-reconcile", restartAuthority: "Joint", evidenceRequired: "Reconciliation break record + resolution" },
  { trigger: "Security compromise", automaticResponse: "Safe halt + revoke access + investigate", safeState: "BM-HALT + access revoked", notification: "Notify security + counsel + bank CISO", escalation: "CTO + bank CISO + counsel + COO", resolution: "Security investigation + remediation", restartAuthority: "Joint (CTO + bank CISO + counsel)", evidenceRequired: "Security incident report + remediation evidence" },
  { trigger: "Unexpected counterparty state", automaticResponse: "Safe halt", safeState: "BM-HALT", notification: "Notify ops", escalation: "COO + bank ops", resolution: "Verify counterparty state", restartAuthority: "Joint", evidenceRequired: "Counterparty state verification" },
  { trigger: "Stale policy", automaticResponse: "Safe halt + policy refresh", safeState: "BM-HALT", notification: "Notify governance", escalation: "COO + bank governance", resolution: "Policy update + re-authorization", restartAuthority: "Joint governance", evidenceRequired: "Policy update + re-auth evidence" },
  { trigger: "Critical system inconsistency", automaticResponse: "Safe halt immediately", safeState: "BM-HALT", notification: "Notify all parties", escalation: "CTO + bank CTO + COO", resolution: "System investigation + repair", restartAuthority: "Joint CTOs", evidenceRequired: "Inconsistency record + repair evidence" },
  { trigger: "Evidence integrity failure", automaticResponse: "Safe halt + investigation", safeState: "BM-HALT", notification: "Notify audit + counsel", escalation: "CTO + bank audit + counsel", resolution: "Integrity investigation + repair", restartAuthority: "Joint (CTO + bank audit + counsel)", evidenceRequired: "Integrity failure + repair evidence" },
];

const CRITICAL_BLOCKERS: CriticalBlocker[] = [
  { blockerId: "B-LEGAL", category: "LEGAL", description: "G0_CONDITIONAL + G1 BLOCKED — 0 counsel engaged, 50 legal questions unanswered, 3 BLOCKING contradictions", impact: "Cannot determine legal permissibility of pilot", owner: "COO + external counsel", requiredEvidence: "Counsel legal opinion (22 deliverables)", dependency: "G0_PASS → G1 counsel engagement", severity: "CRITICAL", status: "BLOCKED" },
  { blockerId: "B-REGULATORY", category: "REGULATORY", description: "0/8 jurisdictions triaged, 0 regulatory applications filed, 0 sandbox admissions", impact: "Cannot determine regulatory requirements for pilot", owner: "COO + regulatory counsel", requiredEvidence: "Regulatory clearance or no-action letter", dependency: "G1 PASS → G2", severity: "CRITICAL", status: "BLOCKED" },
  { blockerId: "B-BANK", category: "BANK", description: "0 banks contacted, 0 design partners, 0 workshops conducted, 0 bank-confirmed problems", impact: "No bank participant, no bank-stated problem, no bank baseline data", owner: "COO", requiredEvidence: "Bank engagement + workshop + baseline data", dependency: "G0+G1+G2 → G3+G4 → workshop", severity: "CRITICAL", status: "BLOCKED" },
  { blockerId: "B-TECHNICAL", category: "TECHNICAL", description: "MBG gateway designed but not tested with real bank. 11 onboarding modules DRAFT.", impact: "Cannot determine technical integration feasibility without bank", owner: "CTO", requiredEvidence: "Bank technical assessment + integration test", dependency: "Workshop + G5", severity: "MAJOR", status: "BLOCKED" },
  { blockerId: "B-SECURITY", category: "SECURITY", description: "No security certifications, no penetration test, no bank security assessment", impact: "Cannot determine security sufficiency for pilot", owner: "CTO + bank CISO", requiredEvidence: "Security assessment + penetration test", dependency: "Workshop + bank engagement", severity: "MAJOR", status: "BLOCKED" },
  { blockerId: "B-COMPLIANCE", category: "COMPLIANCE", description: "AML/CFT/sanctions SIMULATED only. No bank compliance requirements captured.", impact: "Cannot determine compliance allocation for pilot", owner: "CCO + bank compliance", requiredEvidence: "Compliance requirements document", dependency: "Workshop + G1", severity: "MAJOR", status: "BLOCKED" },
  { blockerId: "B-CUSTODY", category: "CUSTODY", description: "No qualified custodian, 0/14 PBC predicates, no executed custody agreement", impact: "Cannot establish backing/custody for pilot (if required)", owner: "COO + custody counsel", requiredEvidence: "Executed custody agreement + attestation", dependency: "G6", severity: "MAJOR", status: "BLOCKED" },
  { blockerId: "B-DATA", category: "DATA", description: "0 bank baseline data, ALL 15 KPI baselines UNKNOWN, no NDA/DPA executed", impact: "Cannot measure pilot outcomes without baseline", owner: "CTO + bank", requiredEvidence: "Bank baseline data (12 metrics) + NDA + DPA", dependency: "Workshop + bank engagement", severity: "CRITICAL", status: "BLOCKED" },
];

const GO_NOGO_PRECHECKS: GoNoGoPreCheck[] = [
  { checkId: "PC-LEGAL", check: "LEGAL_PRECHECK", result: "PENDING", evidence: "G1 counsel opinion required (not obtained)", owner: "External counsel" },
  { checkId: "PC-BANK", check: "BANK_APPROVAL_PRECHECK", result: "PENDING", evidence: "Bank executive approval required (0 banks contacted)", owner: "COO" },
  { checkId: "PC-REGULATORY", check: "REGULATORY_PRECHECK", result: "PENDING", evidence: "Regulatory clearance required (0 filed)", owner: "COO + counsel" },
  { checkId: "PC-SECURITY", check: "SECURITY_PRECHECK", result: "PENDING", evidence: "Security assessment required (0 conducted)", owner: "CTO + bank CISO" },
  { checkId: "PC-COMPLIANCE", check: "COMPLIANCE_PRECHECK", result: "PENDING", evidence: "Compliance requirements required (0 captured)", owner: "CCO + bank compliance" },
  { checkId: "PC-DATA", check: "DATA_PRECHECK", result: "PENDING", evidence: "NDA + DPA + bank baseline data required (0 obtained)", owner: "CTO + bank" },
  { checkId: "PC-TECHNICAL", check: "TECHNICAL_PRECHECK", result: "PENDING", evidence: "Bank technical assessment required (0 conducted)", owner: "CTO" },
  { checkId: "PC-OPERATIONS", check: "OPERATIONS_PRECHECK", result: "PENDING", evidence: "Operating procedures required (0 agreed)", owner: "COO + bank ops" },
  { checkId: "PC-RECONCILIATION", check: "RECONCILIATION_PRECHECK", result: "PENDING", evidence: "Reconciliation methodology required (0 agreed)", owner: "CTO + bank recon" },
  { checkId: "PC-FINALITY", check: "FINALITY_PRECHECK", result: "PENDING", evidence: "Finality mapping required (0 completed)", owner: "CTO + counsel" },
  { checkId: "PC-FAILURE", check: "FAILURE_PRECHECK", result: "PENDING", evidence: "Failure scenarios required (0 bank-confirmed)", owner: "CTO + bank ops" },
  { checkId: "PC-EVIDENCE", check: "EVIDENCE_PRECHECK", result: "PENDING", evidence: "Evidence plan required (0 agreed)", owner: "CTO + bank audit" },
];

const HUMAN_EXTERNAL_DEPS: HumanExternalDependency[] = [
  { dependency: "Legal counsel engagement + opinion", whyExternal: "Only qualified external counsel may issue legal opinions. MITHQAL cannot self-certify legal permissibility.", owner: "COO + external counsel", requiredEvidence: "Written legal opinion (22 deliverables CD-A through CD-V)", status: "NOT_STARTED", nextAction: "Engage counsel for UAE (DIFC/ADGM) jurisdiction" },
  { dependency: "Bank authorization", whyExternal: "Only the bank's executive can authorize participation. MITHQAL cannot self-declare bank participation.", owner: "COO", requiredEvidence: "Bank executive approval documentation", status: "NOT_STARTED", nextAction: "Approach DBS Bank (UAE-SG) after G0+G1+G2" },
  { dependency: "Regulatory engagement", whyExternal: "Only the regulator can authorize/clear the pilot. MITHQAL cannot self-declare regulatory approval.", owner: "COO + counsel", requiredEvidence: "Regulatory clearance or no-action letter", status: "NOT_STARTED", nextAction: "File regulatory application after G1+G2" },
  { dependency: "Execution of agreements (NDA, DPA, pilot agreement, custody)", whyExternal: "Contracts require bilateral execution. MITHQAL cannot self-execute.", owner: "COO + bank legal", requiredEvidence: "Executed contracts", status: "NOT_STARTED", nextAction: "Execute NDA after G0_PASS" },
  { dependency: "Custody arrangement", whyExternal: "Requires a qualified custodian (regulated, external). MITHQAL is not a custodian.", owner: "COO + custody counsel", requiredEvidence: "Executed custody agreement + independent attestation", status: "NOT_STARTED", nextAction: "Engage custodian after G1+G2" },
  { dependency: "Actual external rail access", whyExternal: "Settlement rails are operated by external entities (banks, RTGS operators). MITHQAL cannot self-provide rails.", owner: "CTO + bank", requiredEvidence: "Rail access agreement + test", status: "NOT_STARTED", nextAction: "Bank rail access after G4+G5" },
  { dependency: "Bank baseline data", whyExternal: "Only the bank can provide its own operational baseline. MITHQAL cannot measure the bank's current state without bank participation.", owner: "COO + bank ops/treasury", requiredEvidence: "12 metrics × 6 categories baseline data", status: "NOT_STARTED", nextAction: "Collect baseline in workshop after NDA" },
  { dependency: "Independent assurance", whyExternal: "Independent audit requires an external auditor. MITHQAL cannot self-audit.", owner: "COO + external auditor", requiredEvidence: "Clean audit report", status: "NOT_STARTED", nextAction: "Commission audit after G7 (pilot)" },
  { dependency: "Commercial approval", whyExternal: "Pricing and commercial terms require bilateral agreement. MITHQAL cannot self-set commercial terms.", owner: "COO + bank CFO", requiredEvidence: "Commercial agreement", status: "NOT_STARTED", nextAction: "Commercial negotiation after pilot design" },
];

const NEGOTIATION_MATRIX: NegotiationTerm[] = [
  { term: "Scope", mithqalProposal: "1 bank, 1 corridor (AE-SG), MTQ disabled, controlled test", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO", nextAction: "Bank review after workshop" },
  { term: "Duration", mithqalProposal: "PROPOSED — to be agreed", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO", nextAction: "Bank review" },
  { term: "Participants", mithqalProposal: "MITHQAL (Jozour LLC) + Bank + Custodian (if required)", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO", nextAction: "Bank confirmation" },
  { term: "Data", mithqalProposal: "Synthetic/anonymized/aggregated. NDA required.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "CTO", nextAction: "NDA + DPA" },
  { term: "Security", mithqalProposal: "Security assessment required. No certifications claimed.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "CTO + bank CISO", nextAction: "Security assessment" },
  { term: "Legal", mithqalProposal: "Counsel opinion required before pilot. LEGAL_VALIDATION_PENDING.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "BLOCKED", owner: "COO + counsel", nextAction: "Engage counsel" },
  { term: "Compliance", mithqalProposal: "Bank primary, MITHQAL coordination. Allocation requires counsel.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "BLOCKED", owner: "CCO + bank compliance", nextAction: "Compliance assessment" },
  { term: "Responsibilities", mithqalProposal: "RACI matrix defined (template). Bank confirms.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO", nextAction: "Bank confirmation" },
  { term: "Limits", mithqalProposal: "PROPOSED_FOR_NEGOTIATION — no numeric limits assigned", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO", nextAction: "Bank + counsel negotiation" },
  { term: "Support", mithqalProposal: "PROPOSED — support model to be agreed", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "CTO", nextAction: "Bank review" },
  { term: "Incident management", mithqalProposal: "Safe halt + escalation + joint resolution", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "CTO + bank ops", nextAction: "Bank confirmation" },
  { term: "Termination", mithqalProposal: "Either party may terminate. Wind-down procedures defined.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + bank legal", nextAction: "Legal review" },
  { term: "Shutdown", mithqalProposal: "Disable workflows + revoke access + reconcile + archive evidence", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "CTO", nextAction: "Bank confirmation" },
  { term: "IP", mithqalProposal: "Pre-existing IP preserved. Pilot artifacts ownership to be agreed.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + bank legal", nextAction: "Counsel review" },
  { term: "Confidentiality", mithqalProposal: "NDA covers all pilot information. No public attribution without authorization.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + bank legal", nextAction: "NDA execution" },
  { term: "Publicity", mithqalProposal: "No public claims without explicit authorization. PUBLIC_CLAIM_CONTROL_REGISTER.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO", nextAction: "Bank agreement" },
  { term: "Cost", mithqalProposal: "PROPOSED — pilot cost to be negotiated. 49 prices ALL PENDING.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + bank CFO", nextAction: "Commercial negotiation" },
  { term: "Assurance", mithqalProposal: "Independent assurance readiness prepared. Not yet conducted.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + external auditor", nextAction: "Commission audit" },
  { term: "Success metrics", mithqalProposal: "15 KPIs defined. ALL baselines UNKNOWN. Targets PROPOSED.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + bank exec", nextAction: "Bank + KPI agreement" },
  { term: "Decision process", mithqalProposal: "GO/NO-GO/CONDITIONAL after pilot. Joint sign-off.", bankPosition: "UNKNOWN", counselInput: "UNKNOWN", currentStatus: "PROPOSED", owner: "COO + bank exec", nextAction: "Bank agreement" },
];

/* ------------------------------------------------------------------ */
/*  Full Framework                                                     */
/* ------------------------------------------------------------------ */

export function getPilotTermSheetFramework(): PilotTermSheetFramework {
  return {
    priorBaselines: [
      "Prompt 62 G0: G0_CONDITIONAL",
      "Prompt 63 G1: READY_FOR_COUNSEL (BLOCKED_BY_G0)",
      "Prompt 64: C-AE-SG primary corridor (NOT validated)",
      "Prompt 65: 15 banks researched (0 contacted)",
      "Prompt 66: Counsel engagement brief (READY_FOR_COUNSEL, no opinion)",
      "Prompt 67: Bank executive package (READY_WITH_LIMITATIONS)",
      "Prompt 68: Bank workshop framework (NOT_READY, 0 workshops)",
      "v25.3.2 FROZEN: 10 frozen schemas, 39 modules, 222 routes",
    ],
    truthModel: TRUTH_MODEL,
    pilotDefinition: PILOT_DEFINITION,
    falsifiableHypothesis: FALSIFIABLE_HYPOTHESIS,
    scopeBoundary: SCOPE_BOUNDARY,
    raciMatrix: [
      "pilot governance: MITHQAL(R) / MITHQAL(A) / Bank(C) / Counsel(I)",
      "onboarding: MITHQAL(R) / COO(A) / Bank(C) / N/A(I)",
      "authorization: Bank(R) / Bank+MITHQAL(A) / Counsel(C) / N/A(I)",
      "data provision: Bank(R) / Bank+MITHQAL(A) / Counsel(C) / Audit(I)",
      "integration: MITHQAL(R) / CTO(A) / Bank IT(C) / N/A(I)",
      "testing: MITHQAL(R) / CTO(A) / Bank IT(C) / Audit(I)",
      "settlement instruction: Bank(R) / MITHQAL+Bank(A) / N/A(C) / Counsel(I)",
      "compliance: Bank(R) / Bank+MITHQAL(A) / Counsel(C) / Regulator(I)",
      "reconciliation: MITHQAL(R) / CTO(A) / Bank ops(C) / Audit(I)",
      "exception handling: MITHQAL(R) / CTO(A) / Bank ops(C) / Counsel(I)",
      "incident response: MITHQAL(R) / CTO(A) / Bank CISO(C) / Counsel(I)",
      "safe halt: MITHQAL(R) / CTO(A) / All(C) / Counsel(I)",
      "recovery: MITHQAL(R) / CTO(A) / Bank ops(C) / Counsel(I)",
      "evidence preservation: MITHQAL(R) / CTO(A) / Audit(C) / Counsel(I)",
      "reporting: MITHQAL(R) / COO(A) / Bank(C) / Counsel(I)",
      "legal review: Counsel(R) / COO(A) / Bank legal(C) / N/A(I)",
      "security review: MITHQAL+Bank(R) / CTO(A) / Bank CISO(C) / Counsel(I)",
      "pilot closeout: MITHQAL(R) / COO(A) / Bank(C) / Audit(I)",
    ].map(s => {
      const [activity, raci] = s.split(": ");
      const parts = raci.split(" / ");
      return { activity, responsible: parts[0], accountable: parts[1], consulted: parts[2], informed: parts[3] };
    }),
    conditionsPrecedent: CONDITIONS_PRECEDENT,
    pilotWorkflows: [
      "1. Normal transaction", "2. Compliance pass", "3. Compliance fail",
      "4. Authorization failure", "5. Insufficient funding", "6. Stale authorization",
      "7. Duplicate transaction", "8. Settlement-rail failure", "9. Counterparty unavailable",
      "10. Reconciliation mismatch", "11. Timeout", "12. Data inconsistency",
      "13. Security incident", "14. Safe halt", "15. Recovery", "16. Pilot shutdown",
    ],
    finalityContract: {
      bankDefinition: "UNKNOWN — no bank engaged. Bank's finality terminology not captured.",
      mithqalModel: "F0-F7, 3 types (TECHNICAL/BANKING/LEGAL), 2 modes (finality-coordinated/atomic). Pilot A: F6 (BANKING_FINALITY). F7 (LEGAL_FINALITY) requires counsel.",
      externalRail: "UNKNOWN — no external rail confirmed for pilot.",
      legalFinality: "LEGAL_VALIDATION_PENDING — F7 requires counsel opinion. Pilot tests orchestration + evidence, NOT legally final settlement (unless counsel confirms).",
      evidenceRequired: "MITHQAL evidence fabric (15-field packages, SHA-256). Bank confirmation of finality acceptance required.",
      truthState: "BLOCKED" as TermSheetTruthState,
    },
    dataSharingFramework: {
      principle: "Data minimization. Prefer synthetic/anonymized/aggregated. Do not request customer PII for initial discovery. NDA + DPA required before any bank data.",
      dataCategories: ["Settlement instructions", "Policy rules", "Compliance data", "Reconciliation data", "Evidence packages", "Performance metrics", "Audit logs", "Exception records"],
      truthState: "PROPOSED" as TermSheetTruthState,
    },
    securitySchedule: {
      categories: ["identity", "access", "privileged access", "credentials", "encryption", "key management", "network controls", "logging", "monitoring", "vulnerability management", "incident response", "secrets", "backup", "recovery", "third-party access", "environment isolation", "data retention", "evidence integrity"],
      truthState: "UNKNOWN" as TermSheetTruthState,
    },
    complianceSchedule: {
      categories: ["KYC/KYB", "sanctions", "transaction screening", "transaction monitoring", "approval workflow", "case management", "record keeping", "reporting", "audit trail"],
      truthState: "UNKNOWN" as TermSheetTruthState,
    },
    reconciliationProtocol: {
      sources: ["MITHQAL canonical ledger", "Bank transaction records", "Settlement-rail records", "Reserve/backing records (if relevant)", "Corporate position", "Obligation register"],
      matchingKey: "PROPOSED — instruction ID + settlement ID + timestamp",
      toleranceClass: "PROPOSED — 6 tolerance policies (1/5/10/50/20/200 bps). No universal tolerance. Bank must confirm which class applies.",
      breakCategories: ["Amount mismatch", "Timing mismatch", "Missing record", "Duplicate record", "Currency mismatch", "Counterparty mismatch"],
      truthState: "PROPOSED" as TermSheetTruthState,
    },
    failureSafeHaltProtocol: STOP_CONDITIONS,
    pilotSecurityOfValue: {
      valueType: "PROPOSED: Synthetic/no-value for initial pilot. If real value: requires legal/custody/bank controls before any transaction.",
      controls: ["No unauthorized value movement", "Authorization before settlement", "Finality evidence", "Duplicate protection", "Idempotency", "Transaction limits", "Participant limits", "Corridor limits", "Velocity controls", "Safe halt", "Emergency override restrictions", "Audit evidence"],
      truthState: "PROPOSED" as TermSheetTruthState,
    },
    pilotLimits: [
      { field: "maximum_transaction_value", value: "PROPOSED_FOR_NEGOTIATION", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_daily_value", value: "PROPOSED_FOR_NEGOTIATION", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_transaction_count", value: "PROPOSED_FOR_NEGOTIATION", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_participant_count", value: "PROPOSED: 2 (MITHQAL + 1 bank)", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_corridor_count", value: "PROPOSED: 1 (AE-SG)", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_concurrent_workflows", value: "PROPOSED_FOR_NEGOTIATION", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_exposure", value: "PROPOSED_FOR_NEGOTIATION", truthState: "PROPOSED" as TermSheetTruthState },
      { field: "maximum_operational_duration", value: "PROPOSED_FOR_NEGOTIATION", truthState: "PROPOSED" as TermSheetTruthState },
    ],
    kpiFramework: KPI_FRAMEWORK,
    valueTest: {
      currentVsPilot: [
        "CURRENT_STATE_COST vs PILOT_COST", "CURRENT_STATE_TIME vs PILOT_TIME",
        "CURRENT_STATE_MANUAL_EFFORT vs PILOT_MANUAL_EFFORT",
        "CURRENT_STATE_LIQUIDITY_BURDEN vs PILOT_LIQUIDITY_EFFECT",
        "CURRENT_STATE_EXCEPTION_BURDEN vs PILOT_EXCEPTION_BURDEN",
      ],
      truthState: "UNKNOWN" as TermSheetTruthState,
    },
    successFailureLogic: [
      { outcome: "SUCCESS", criteria: "ALL KPIs show measurable improvement + all workflows completed + all stop conditions respected + evidence complete + both parties sign off" },
      { outcome: "PARTIAL_SUCCESS", criteria: "SOME KPIs show improvement + most workflows completed + some conditions require modification" },
      { outcome: "INCONCLUSIVE", criteria: "Insufficient data to determine improvement (baseline incomplete or pilot scope too narrow)" },
      { outcome: "VALUE_NOT_DEMONSTRATED", criteria: "KPIs show no measurable improvement or MITHQAL adds complexity without value" },
      { outcome: "CONTROL_FAILURE", criteria: "Safe halt triggered + unable to recover + control deficiency identified" },
      { outcome: "PILOT_BLOCKED", criteria: "External blocker prevents pilot completion (legal, regulatory, bank withdrawal, security incident)" },
    ],
    governance: {
      steeringCommittee: "ROLE-BASED (no invented members): COO (MITHQAL), Bank Executive Sponsor, Counsel. Decision authority: pilot scope changes, halt authority, restart authority.",
      operatingTeam: "ROLE-BASED: CTO (MITHQAL), Bank Technical Lead, Bank Ops Lead. Daily operations, incident response, evidence generation.",
      escalationPath: "Operating Team → Steering Committee → Counsel → Executive Sponsor",
      decisionRights: "Pilot scope: Steering Committee. Halt: Operating Team (immediate) + Steering (restart). Legal: Counsel only. Commercial: Executive Sponsors.",
      truthState: "PROPOSED" as TermSheetTruthState,
    },
    changeControl: ["CHANGE_REQUEST", "IMPACT_ANALYSIS", "LEGAL_IMPACT", "SECURITY_IMPACT", "OPERATIONAL_IMPACT", "DATA_IMPACT", "RISK_IMPACT", "TEST_REQUIREMENT", "APPROVAL", "VERSION", "EVIDENCE"],
    evidencePackage: ["Transaction logs", "Authorization evidence", "Policy evidence", "Compliance evidence", "Finality evidence", "Reconciliation evidence", "Exception evidence", "Failure/recovery evidence", "Security evidence", "Performance evidence", "KPI measurements", "Cost measurements", "Participant observations", "Lessons learned", "Change history", "Incident history", "Final decision"],
    assuranceReadiness: { status: "PREPARED — pilot designed so independent assurance provider could inspect controls, logs, authorization, evidence, reconciliation, exceptions, incident handling, access, changes, KPIs. NOT CONDUCTED — no audit performed.", truthState: "PROPOSED" as TermSheetTruthState },
    commercialPrinciples: {
      costCategories: ["PILOT_COST", "PRODUCTION_COST", "INTEGRATION_COST", "LEGAL_COST", "SECURITY_COST", "ASSURANCE_COST", "ONGOING_SERVICE_COST"],
      pricingStatus: "PROPOSED" as TermSheetTruthState,
    },
    ipFramework: { truthState: "UNKNOWN" as TermSheetTruthState, counselReviewRequired: true },
    confidentialityFramework: {
      categories: ["Bank information", "MITHQAL information", "Technical information", "Security information", "Performance data", "Customer-related information", "Pilot results", "Public disclosure", "Marketing use", "References/case studies"],
      truthState: "PROPOSED" as TermSheetTruthState,
    },
    publicityControl: {
      restrictions: [
        "No public statement of bank partnership without explicit authorization",
        "No public statement of production deployment",
        "No public statement of regulatory approval",
        "No public statement of legal approval",
        "No public statement of live settlement",
        "No public statement of customer adoption",
        "No public statement of ROI",
        "No public statement of performance",
        "No public statement of endorsement",
      ],
      truthState: "PROPOSED" as TermSheetTruthState,
    },
    negotiationMatrix: NEGOTIATION_MATRIX,
    exitWindDown: [
      "Disable pilot workflows", "Revoke temporary access", "Reconcile all activity",
      "Resolve outstanding exceptions", "Preserve evidence", "Close incidents",
      "Archive data per agreed requirements", "Terminate temporary credentials",
      "Produce final report", "Obtain participant sign-off", "Update governance state",
    ],
    postPilotDecision: [
      "NO-GO: MITHQAL does not create measurable value — document + stop",
      "ITERATE: Value shown but modifications needed — document + iterate",
      "EXTEND_CONTROLLED_TEST: Value shown but more evidence needed — extend scope",
      "LEGAL_RESTRUCTURE: Value shown but legal structure needs change — counsel review",
      "TECHNICAL_REWORK: Value shown but technical changes needed — engineering",
      "COMMERCIAL_REVIEW: Value shown + commercial terms needed — negotiation",
      "PRODUCTION_AUTHORIZATION_REVIEW: Value shown + production gate (G11) — regulator",
    ],
    pilotReadinessStatus: {
      pilotId: "PILOT-A-001",
      bank: "UNKNOWN (0 banks contacted)",
      corridor: "C-AE-SG (NOT bank-confirmed)",
      problemStatus: "UNKNOWN (0 bank-validated problems)",
      workshopStatus: "NOT_READY (0 workshops conducted)",
      legalStatus: "LEGAL_VALIDATION_PENDING (0 counsel engaged)",
      regulatoryStatus: "JURISDICTION_PENDING (0/8 triaged)",
      technicalStatus: "PROPOSED (MBG designed, 0 bank technical assessments)",
      securityStatus: "UNKNOWN (0 bank security assessments, 0 certifications)",
      complianceStatus: "UNKNOWN (0 bank compliance requirements captured)",
      dataStatus: "UNKNOWN (0 bank data, 0 NDA, 0 DPA)",
      custodyStatus: "UNKNOWN (0 custodians, 0/14 PBC predicates)",
      settlementStatus: "PROPOSED (BANK_MONEY, MTQ disabled, SIMULATED)",
      reconciliationStatus: "PROPOSED (6 tolerance policies, 0 bank-confirmed)",
      participantStatus: "UNKNOWN (0 participants confirmed)",
      termSheetStatus: "BLOCKED_BY_WORKSHOP",
      conditionsPrecedent: `${CONDITIONS_PRECEDENT.filter(c => c.blocking).length}/${CONDITIONS_PRECEDENT.length} BLOCKING`,
      criticalBlockers: CRITICAL_BLOCKERS.map(b => `${b.blockerId}: ${b.description.slice(0, 60)}`),
      unknowns: ["ALL 15 KPI baselines UNKNOWN", "ALL bank requirements UNKNOWN", "ALL participant roles UNKNOWN", "ALL workshop data UNKNOWN", "ALL legal questions unanswered"],
      proposedScope: "1 bank, 1 corridor (AE-SG), MTQ disabled, BANK_MONEY, controlled test, 19 BM steps",
      mtqStatus: "DISABLED",
      kpiBaselineStatus: "UNKNOWN (0/15 baselines available)",
      kpiTargetStatus: "PROPOSED (0/15 targets agreed)",
      evidenceReadiness: "PROPOSED (evidence plan defined, 0 evidence collected)",
      assuranceReadiness: "PROPOSED (readiness prepared, 0 audits conducted)",
      productionAuthorized: false,
      institutionallyValidated: false,
      nextExternalEvidence: "G0_PASS (entity counsel-verified — currently G0_CONDITIONAL). Once G0 passes: engage counsel for G1 → approach bank → workshop → populate term sheet → negotiate → execute.",
    },
    termSheetGate: "DRAFT",
    criticalBlockers: CRITICAL_BLOCKERS,
    goNoGoPreChecks: GO_NOGO_PRECHECKS,
    mtqControl: {
      status: "DISABLED — MTQ remains disabled by default. No Pilot A workflow depends on MTQ.",
      conditions: [
        "Bank explicitly requests MTQ evaluation",
        "Legal review permits evaluation",
        "Accounting/prudential questions addressed",
        "Custody/backing requirements defined",
        "Regulatory conditions understood",
        "Governance approves the change",
      ],
      extensionProposal: "MTQ_EXTENSION_PROPOSAL — if MTQ is proposed, it creates a SEPARATE secondary scope with separate legal/regulatory/accounting/custody/backing/redemption/risk dependencies. Never combined with core control-plane pilot.",
    },
    humanExternalDependencies: HUMAN_EXTERNAL_DEPS,
    finalDecision: {
      pilotTermSheetStatus: "BLOCKED_BY_WORKSHOP",
      pilotValueHypothesis: "MITHQAL's control plane can coordinate cross-border settlement workflows (19 BM steps, MTQ disabled, BANK_MONEY) and produce measurable evidence about settlement coordination, evidence generation, and reconciliation — potentially reducing friction compared to the bank's current correspondent banking process.",
      pilotScopeSummary: "PROPOSED: 1 bank, 1 corridor (AE-SG), MTQ disabled, BANK_MONEY, controlled test environment, 19 BM steps, 16 workflow scenarios, 15 KPIs, 12 stop conditions, 18 conditions precedent. ALL data PROPOSED/UNKNOWN — no bank engaged, no workshop conducted, no counsel opinion.",
      topCriticalBlocker: "G0_CONDITIONAL — entity not counsel-verified. No bank can be approached, no counsel can provide jurisdiction-specific opinions, no workshop can be conducted, no term sheet can be negotiated until G0 PASSES.",
      owner: "COO (Mohamed Salah Eltonsy) + external legal counsel",
      nextExternalEvidence: "G0_PASS (entity counsel-verified — currently G0_CONDITIONAL). The JOZOUR documents are deposited but NOT counsel-verified. Once counsel verifies the entity (G0_PASS), the entire chain unlocks: G1 counsel engagement → G2 regulatory → G3 bank approach → G4 bank contract → G5 technical integration → G6 custody → G7 controlled pilot → this term sheet becomes negotiable.",
    },
    honestState: {
      productionAuthorized: false,
      noTermPresentedAsAgreed: true,
      architectureNotModified: true,
      mtqDisabled: true,
    },
    summary: `PROMPT 69: CONTROLLED PILOT TERM SHEET. PILOT_TERM_SHEET_STATUS: BLOCKED_BY_WORKSHOP. MTQ: DISABLED. 18 conditions precedent (ALL BLOCKED). 15 KPIs (ALL baselines UNKNOWN). 12 stop conditions (ALL defined). 8 critical blockers (4 CRITICAL, 4 MAJOR). 12 Go/No-Go prechecks (ALL PENDING). 20 negotiation terms (ALL PROPOSED). 9 human/external dependencies. Term sheet gate: DRAFT. NO term presented as agreed. ALL data PROPOSED/UNKNOWN/BLOCKED. 0 banks contacted. 0 workshops conducted. 0 counsel engaged. NEXT EXTERNAL EVIDENCE: G0_PASS. NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const P69_META = {
  module: "p69-pilot-term-sheet",
  version: "v25.3.2",
  prompt: "PROMPT 69",
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED — BLOCKED_BY_WORKSHOP",
  frozenArchitecture: true,
  g0Status: "G0_CONDITIONAL",
  g1Status: "READY_FOR_COUNSEL",
  corridor: "C-AE-SG",
  pilotTermSheetStatus: "BLOCKED_BY_WORKSHOP",
  mtqStatus: "DISABLED",
  conditionsPrecedentCount: CONDITIONS_PRECEDENT.length,
  kpiCount: KPI_FRAMEWORK.length,
  stopConditionCount: STOP_CONDITIONS.length,
  criticalBlockerCount: CRITICAL_BLOCKERS.length,
  goNoGoPreCheckCount: GO_NOGO_PRECHECKS.length,
  negotiationTermCount: NEGOTIATION_MATRIX.length,
  humanExternalDependencyCount: HUMAN_EXTERNAL_DEPS.length,
  termSheetGate: "DRAFT",
  nextExternalEvidence: "G0_PASS (entity counsel-verified)",
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. No architecture expansion.
//  PILOT_TERM_SHEET_STATUS: BLOCKED_BY_WORKSHOP.
//  MTQ_STATUS: DISABLED (default, 6 conditions to change).
//  NO term presented as agreed. ALL data PROPOSED/UNKNOWN/BLOCKED.
//  0 banks contacted. 0 workshops conducted. 0 counsel engaged.
//  18 conditions precedent (ALL BLOCKED).
//  15 KPIs (ALL baselines UNKNOWN).
//  12 stop conditions (ALL defined — framework ready).
//  8 critical blockers (4 CRITICAL, 4 MAJOR).
//  12 Go/No-Go prechecks (ALL PENDING).
//  20 negotiation terms (ALL PROPOSED — NONE agreed).
//  9 human/external dependencies (ALL NOT_STARTED).
//  Term sheet gate: DRAFT.
//  NEXT EXTERNAL EVIDENCE: G0_PASS.
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
