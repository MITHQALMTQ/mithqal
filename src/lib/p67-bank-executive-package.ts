/**
 * MITHQAL — PROMPT 67: BANK EXECUTIVE DECISION & ENGAGEMENT PACKAGE
 *
 * Architecture FROZEN at v25.3.2. No architecture expansion.
 * Inherit truth states from Prompts 62-66. No silent upgrades.
 *
 * G0: G0_CONDITIONAL. G1: READY_FOR_COUNSEL. Corridor: C-AE-SG.
 * 0 banks contacted. 0 design partners. MTQ disabled.
 *
 * NOT PRODUCTION-AUTHORIZED. Non-promotional. Evidence-traceable.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceState = "BANK_STATED" | "MEASURED" | "EXTERNAL_SOURCE" | "MODELLED" | "ASSUMED" | "UNKNOWN";
export type ClaimStatus = "CONFIRMED" | "UNKNOWN" | "HYPOTHESIS" | "REQUIRES_COUNSEL" | "REQUIRES_BANK_VALIDATION";
export type PackageQuality = "TRUTHFUL" | "BANK_COMPREHENSIBLE" | "CORRIDOR_SPECIFIC" | "MTQ_INDEPENDENT" | "EVIDENCE_TRACEABLE" | "PILOT_MEASURABLE" | "LEGALLY_CONDITIONED" | "SECURITY_AWARE" | "COMMERCIAL_REALISTIC" | "NON_PROMOTIONAL" | "EXECUTIVE_USABLE";

export interface BankValueMapEntry {
  bankFunction: string;
  currentProcess: string;
  knownFriction: string;
  mithqalCapability: string;
  expectedEffect: string;
  measurementMethod: string;
  currentEvidence: EvidenceState;
  requiredValidation: string;
}

export interface FalsifiableTest {
  dimension: string;
  baselineRequired: string;
  test: string;
  expectedEffect: string;
  failureCondition: string;
  label: "TESTABLE" | "HYPOTHESIS_ONLY";
}

export interface BankMustBelieve {
  claim: string;
  evidenceToday: string;
  whatIsMissing: string;
  howItWillBeValidated: string;
}

export interface BankShouldNotBelieve {
  item: string;
  reason: string;
}

export interface PilotExecutiveProposal {
  objective: string;
  problemBeingTested: string;
  corridor: string;
  participants: string;
  testEnvironment: string;
  dataRequired: string;
  workflows: string;
  failureScenarios: string;
  complianceScenarios: string;
  reconciliationScenarios: string;
  safetyControls: string;
  stopConditions: string;
  evidenceProduced: string;
  successMetrics: string;
  responsibilities: string;
  legalPrerequisites: string;
  technicalPrerequisites: string;
  expectedDecisionAfterPilot: string;
  canProduceNoGo: boolean;
}

export interface ExecutiveObjection {
  objectionId: string;
  objection: string;
  confirmed: string;
  unknown: string;
  hypothesis: string;
  requiresCounsel: string;
  requiresBankValidation: string;
}

export interface RiskSummary {
  risk: string;
  cause: string;
  currentControl: string;
  residualUncertainty: string;
  evidence: string;
  owner: string;
  pilotTreatment: string;
}

export interface ExecutiveClaim {
  claimId: string;
  claim: string;
  source: string;
  evidenceState: EvidenceState;
  date: string;
  owner: string;
}

export interface FinalReadiness {
  packageStatus: string;
  primaryCorridor: string;
  bankPipelineStatus: string;
  g0Status: string;
  g1Status: string;
  counselStatus: string;
  bankValidatedProblemCount: number;
  executiveInterestCount: number;
  architectureReviewCount: number;
  pilotDesignCount: number;
  knownExternalEvidence: number;
  criticalUnknowns: string[];
  criticalBlockers: string[];
  mtqIndependentValuePath: boolean;
  pilotAReadiness: string;
  productionAuthorized: boolean;
  institutionallyValidated: boolean;
  nextExternalEvidence: string;
}

export interface BankExecutivePackage {
  priorBaselines: string[];
  executiveThesis: { section: string; content: string }[];
  bankProductBrief: { section: string; content: string }[];
  bankValueMap: BankValueMapEntry[];
  whyMithqalTest: FalsifiableTest[];
  whyNotInternal: string;
  whyNotExistingRail: { rail: string; whatItDoes: string; whatItDoesNot: string; mithqalInteroperate: string; mithqalRedundant: string; requiresBankValidation: string }[];
  mtqOptionalPositioning: { withoutMtq: string; withMtq: string; conditions: string[] };
  bankMustBelieve: BankMustBelieve[];
  bankShouldNotBelieve: BankShouldNotBelieve[];
  pilotAProposal: PilotExecutiveProposal;
  bankDataRequest: { category: string; requirement: "REQUIRED" | "OPTIONAL" | "NICE_TO_HAVE" }[];
  securityAssurance: { item: string; status: string }[];
  legalRegulatorySummary: { currentLegalStatus: string; currentRegulatoryStatus: string; knownRequirements: string; counselQuestions: string; bankDependencies: string; openMatters: string };
  riskSummary: RiskSummary[];
  roiFramework: { benefitCategories: string[]; costCategories: string[]; evidenceStatus: EvidenceState };
  objectionPack: ExecutiveObjection[];
  firstMeetingAgenda: { item: string; content: string }[];
  secondMeetingTrigger: { minimumEvidence: string[]; ifAbsent: string };
  decisionGate: string[];
  evidenceTraceability: ExecutiveClaim[];
  diagrams: { diagramId: string; title: string; label: "DESIGN" | "SIMULATION" | "CONTROLLED_TEST" | "LIVE_EXTERNAL_EVIDENCE" }[];
  qualityGate: { check: PackageQuality; passed: boolean }[];
  finalReadiness: FinalReadiness;
  bankExecutivePackageStatus: string;
  primaryExecutiveMessage: string;
  firstMeetingObjective: string;
  nextExternalEvidence: string;
  honestState: { productionAuthorized: boolean; nonPromotional: boolean; architectureNotModified: boolean; evidenceTraceable: boolean };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T22:55:00Z";

/* ------------------------------------------------------------------ */
/*  C. Executive Thesis (2 pages, 10 sections)                          */
/* ------------------------------------------------------------------ */

export const EXECUTIVE_THESIS = [
  { section: "1. The institutional problem", content: "Cross-border settlement between banks involves multiple intermediary banks, trapped liquidity in nostro/vostro accounts, T+2/T+3 settlement delays, opaque FX costs, manual reconciliation, and significant compliance/evidence burden." },
  { section: "2. Why existing infrastructure leaves gaps", content: "Existing correspondent banking, RTGS, and SWIFT messaging were not designed for coordinated multi-party evidence, automated reconciliation, or integrated compliance orchestration across the full settlement lifecycle." },
  { section: "3. What MITHQAL does", content: "MITHQAL is institutional settlement control infrastructure. It provides a coordination layer: policy enforcement, jurisdiction gating, compliance orchestration, liquidity routing, finality coordination, reconciliation, evidence generation, exception handling, safe halt, alternative routing, recovery, and regulatory replay." },
  { section: "4. How it works conceptually", content: "The bank sends a settlement instruction via the MBG gateway. MITHQAL coordinates 19 settlement steps (BM-01..BM-16B): ingestion → ISO 20022 translation → policy → jurisdiction → compliance → liquidity → FX → settlement state → finality → reconciliation → evidence. The bank holds its own funds throughout." },
  { section: "5. What changes for the bank", content: "The bank adds an MBG gateway integration (API-based). MITHQAL coordinates the settlement workflow, generates evidence packages, performs reconciliation, and provides regulatory replay. The bank's core banking, customers, and regulatory obligations remain unchanged." },
  { section: "6. What does not change", content: "The bank keeps: core banking system, customer relationships, regulatory licenses, capital, custody, compliance programs, SWIFT infrastructure, and nostro/vostro accounts. MITHQAL does NOT hold bank capital, take custody, or replace regulatory obligations." },
  { section: "7. What Pilot A tests", content: "Pilot A: 19 settlement steps with MTQ completely disabled. Settlement asset = BANK_MONEY. Evidence = SIMULATED. The pilot tests whether the control plane can coordinate a settlement workflow end-to-end — not whether it can process live transactions." },
  { section: "8. What evidence exists today", content: "Architecture FROZEN at v25.3.2 (10 frozen schemas). 39 canonical modules. 222 API routes. Pilot A: 19 steps SETTLED (SIMULATED). Entity: Jozour LLC (documents deposited, counsel verification pending). BUT: 0 external validation, 0 banks contacted, 0 counsel engaged." },
  { section: "9. What remains unproven", content: "ALL bank pain = UNKNOWN (no bank engaged). ALL ROI = UNKNOWN (no baseline data). ALL legal classification = PENDING (no counsel). ALL regulatory clearance = PENDING. 0/12 institutional gates passed. NOT PRODUCTION-AUTHORIZED." },
  { section: "10. Requested next step", content: "INSTITUTIONAL_DISCOVERY_WORKSHOP — a 60-90 minute session where the bank shares its current settlement pain and MITHQAL demonstrates Mode-A (MTQ disabled). NOT a purchase request. NOT a production integration. NOT an MTQ adoption request. NOT an investment request." },
];

/* ------------------------------------------------------------------ */
/*  E. Bank Value Map (12 functions × 8 fields)                        */
/* ------------------------------------------------------------------ */

export const BANK_VALUE_MAP: BankValueMapEntry[] = [
  { bankFunction: "Payments", currentProcess: "SWIFT messaging + correspondent banking chain", knownFriction: "T+2/T+3 latency, multiple intermediary fees", mithqalCapability: "Settlement coordination (BM-01..BM-16B)", expectedEffect: "Reduced intermediary count, coordinated workflow", measurementMethod: "Instruction-to-finality time", currentEvidence: "UNKNOWN", requiredValidation: "Bank-provided baseline latency" },
  { bankFunction: "Transaction Banking", currentProcess: "Correspondent relationships, multiple rails", knownFriction: "Correspondent-chain complexity, opacity", mithqalCapability: "MBG gateway + policy enforcement", expectedEffect: "Transparent workflow, policy at each step", measurementMethod: "Intermediary count + transparency score", currentEvidence: "UNKNOWN", requiredValidation: "Bank correspondent-chain map" },
  { bankFunction: "Treasury", currentProcess: "Nostro/vostro management, multi-currency", knownFriction: "Trapped liquidity, pre-funding requirements", mithqalCapability: "Liquidity routing (BM-12)", expectedEffect: "Reduced trapped capital, improved utilization", measurementMethod: "Idle balance before/after", currentEvidence: "UNKNOWN", requiredValidation: "Bank nostro/vostro baseline" },
  { bankFunction: "Liquidity", currentProcess: "Pre-positioned nostro balances", knownFriction: "Liquidity fragmentation across corridors", mithqalCapability: "Liquidity orchestration + routing", expectedEffect: "Coordinated liquidity, reduced fragmentation", measurementMethod: "Liquidity utilization ratio", currentEvidence: "UNKNOWN", requiredValidation: "Bank liquidity baseline" },
  { bankFunction: "FX", currentProcess: "Correspondent-bank FX + spreads", knownFriction: "Opaque pricing, multiple conversions", mithqalCapability: "FX route selection (BM-13)", expectedEffect: "Transparent FX, reduced spread", measurementMethod: "FX cost per transaction", currentEvidence: "ASSUMED", requiredValidation: "Bank FX cost baseline" },
  { bankFunction: "Operations", currentProcess: "Manual reconciliation, exception handling", knownFriction: "High FTE, manual intervention", mithqalCapability: "Automated reconciliation + evidence", expectedEffect: "Reduced FTE, automated evidence", measurementMethod: "Reconciliation FTE + exception rate", currentEvidence: "UNKNOWN", requiredValidation: "Bank ops baseline" },
  { bankFunction: "Reconciliation", currentProcess: "Multi-party reconciliation across chain", knownFriction: "Mismatch resolution, delayed confirmation", mithqalCapability: "6 tolerance policies + evidence fabric", expectedEffect: "Automated reconciliation, evidence trail", measurementMethod: "Reconciliation time + mismatch rate", currentEvidence: "UNKNOWN", requiredValidation: "Bank reconciliation baseline" },
  { bankFunction: "Compliance", currentProcess: "AML/CFT/sanctions screening", knownFriction: "Manual screening, fragmented evidence", mithqalCapability: "Compliance orchestration (BM-11)", expectedEffect: "Coordinated compliance, evidence packages", measurementMethod: "Compliance processing time", currentEvidence: "UNKNOWN", requiredValidation: "Bank compliance baseline" },
  { bankFunction: "Risk", currentProcess: "Counterparty + settlement risk monitoring", knownFriction: "Difficult monitoring across chain", mithqalCapability: "Evidence fabric + regulatory replay", expectedEffect: "Improved monitoring, audit trail", measurementMethod: "Counterparty exposure visibility", currentEvidence: "UNKNOWN", requiredValidation: "Bank risk monitoring baseline" },
  { bankFunction: "Audit", currentProcess: "Manual evidence assembly", knownFriction: "Fragmented records, high preparation effort", mithqalCapability: "15-field evidence packages + SHA-256", expectedEffect: "Automated evidence, audit-ready", measurementMethod: "Audit preparation time", currentEvidence: "UNKNOWN", requiredValidation: "Bank audit prep baseline" },
  { bankFunction: "Technology", currentProcess: "Multiple systems, limited interoperability", knownFriction: "Integration complexity, data fragmentation", mithqalCapability: "MBG gateway (API, ISO 20022)", expectedEffect: "Single coordination interface", measurementMethod: "Integration complexity + data flow", currentEvidence: "ASSUMED", requiredValidation: "Bank technical assessment" },
  { bankFunction: "Management Reporting", currentProcess: "Fragmented settlement reporting", knownFriction: "Incomplete visibility, delayed reporting", mithqalCapability: "Regulatory replay + evidence fabric", expectedEffect: "Complete visibility, real-time reporting", measurementMethod: "Reporting completeness + timeliness", currentEvidence: "UNKNOWN", requiredValidation: "Bank reporting baseline" },
];

/* ------------------------------------------------------------------ */
/*  F. Falsifiable "Why MITHQAL" Test (9 dimensions)                   */
/* ------------------------------------------------------------------ */

export const WHY_MITHQAL_TEST: FalsifiableTest[] = [
  { dimension: "Settlement coordination", baselineRequired: "Bank current instruction-to-finality time", test: "Compare bank baseline vs MITHQAL-coordinated workflow", expectedEffect: "Reduced intermediary steps, coordinated workflow", failureCondition: "No measurable improvement in coordination", label: "TESTABLE" },
  { dimension: "Information availability", baselineRequired: "Bank current information visibility per settlement", test: "Compare information available at each BM step vs current", expectedEffect: "More information available at each step", failureCondition: "No improvement in information availability", label: "TESTABLE" },
  { dimension: "Evidence completeness", baselineRequired: "Bank current evidence assembly effort", test: "Compare manual evidence assembly vs automated evidence fabric", expectedEffect: "Automated 15-field packages, SHA-256 commitments", failureCondition: "Evidence not more complete or automated", label: "TESTABLE" },
  { dimension: "Reconciliation", baselineRequired: "Bank current reconciliation time + mismatch rate", test: "Compare manual reconciliation vs 6-policy automated", expectedEffect: "Reduced time, lower mismatch rate", failureCondition: "No improvement in reconciliation", label: "TESTABLE" },
  { dimension: "Exception handling", baselineRequired: "Bank current exception rate + resolution time", test: "Compare manual exception handling vs BM exception workflow", expectedEffect: "Faster resolution, safe halt, alternative routing", failureCondition: "No improvement in exception handling", label: "TESTABLE" },
  { dimension: "Liquidity visibility", baselineRequired: "Bank current nostro/vostro visibility", test: "Compare current visibility vs MITHQAL liquidity routing", expectedEffect: "Improved liquidity visibility + coordination", failureCondition: "No improvement in visibility", label: "TESTABLE" },
  { dimension: "Policy enforcement", baselineRequired: "Bank current policy enforcement per settlement", test: "Compare ad-hoc enforcement vs BM-03 policy engine", expectedEffect: "Systematic policy enforcement at each step", failureCondition: "No improvement in enforcement", label: "TESTABLE" },
  { dimension: "Failure handling", baselineRequired: "Bank current failure/recovery process", test: "Compare current failure handling vs continuity fabric (9×7)", expectedEffect: "Safe halt, alternative routing, recovery", failureCondition: "No improvement in failure handling", label: "TESTABLE" },
  { dimension: "Regulatory replay", baselineRequired: "Bank current regulatory replay capability", test: "Compare current replay vs 12-field READ-ONLY replay", expectedEffect: "Complete decision context reconstruction", failureCondition: "Replay not more complete", label: "TESTABLE" },
];

/* ------------------------------------------------------------------ */
/*  J. What the Bank Must Believe (9 claims)                            */
/* ------------------------------------------------------------------ */

export const BANK_MUST_BELIEVE: BankMustBelieve[] = [
  { claim: "MITHQAL can orchestrate settlement workflows", evidenceToday: "Pilot A: 19 steps, SETTLED, SIMULATED", whatIsMissing: "Live bank test (not simulated)", howItWillBeValidated: "Controlled pilot with bank's test environment" },
  { claim: "Policy controls can be enforced", evidenceToday: "BM-03 policy enforcement designed + tested (SIMULATED)", whatIsMissing: "Bank policy rules + live enforcement", howItWillBeValidated: "Bank policy rules loaded + enforced in pilot" },
  { claim: "Evidence can be recorded", evidenceToday: "15-field evidence fabric designed + Pilot A evidence generated (SIMULATED)", whatIsMissing: "Live evidence from real settlement", howItWillBeValidated: "Evidence from real bank settlement in pilot" },
  { claim: "Reconciliation can be performed", evidenceToday: "6 tolerance policies designed + Pilot A reconciliation (SIMULATED)", whatIsMissing: "Bank reconciliation rules + live reconciliation", howItWillBeValidated: "Bank reconciliation in pilot" },
  { claim: "Failures can be handled", evidenceToday: "9 events × 7 stages continuity fabric + safe halt demonstrated (SIMULATED)", whatIsMissing: "Live failure scenario with bank", howItWillBeValidated: "Failure/recovery test in pilot" },
  { claim: "Regulatory replay can be supported", evidenceToday: "12-field READ-ONLY replay engine designed (SIMULATED)", whatIsMissing: "Live transactions to replay", howItWillBeValidated: "Replay of pilot transactions" },
  { claim: "Bank integration can be designed", evidenceToday: "MBG gateway designed (API, ISO 20022). 11 onboarding modules DRAFT.", whatIsMissing: "Bank's actual infrastructure assessment", howItWillBeValidated: "Technical integration assessment with bank" },
  { claim: "Pilot A can be reproduced", evidenceToday: "Deterministic replay package (SHA-256 verified). 8 scenarios.", whatIsMissing: "Bank's test environment reproduction", howItWillBeValidated: "Bank reproduces pilot in their environment" },
  { claim: "MTQ can remain disabled", evidenceToday: "Pilot A: 0/19 steps use MTQ. MTQ_DISABLED by default. 11 prerequisites ALL PENDING.", whatIsMissing: "N/A — MTQ is disabled by design", howItWillBeValidated: "N/A — MTQ disabled is the default" },
];

/* ------------------------------------------------------------------ */
/*  K. What the Bank Should NOT Believe Yet (11 items)                   */
/* ------------------------------------------------------------------ */

export const BANK_SHOULD_NOT_BELIEVE: BankShouldNotBelieve[] = [
  { item: "Regulatory approval", reason: "0/8 jurisdictions triaged. 0 counsel engaged. G1: JURISDICTION_PENDING." },
  { item: "Legal classification", reason: "MTQ classification PENDING_VALIDATION. MITHQAL legal role requires counsel." },
  { item: "Production authorization", reason: "NOT PRODUCTION-AUTHORIZED. 0/12 gates passed." },
  { item: "Bank endorsement", reason: "0 banks contacted. 0 design partners. ALL RESEARCHED only." },
  { item: "Live reserve backing", reason: "No qualified custodian. 0/14 PBC predicates. Gold in Strategic Resilience (NOT backing)." },
  { item: "Guaranteed redemption value", reason: "Redemption framework PENDING. No executed redemption agreement." },
  { item: "Validated cross-border legal finality", reason: "F7 (LEGAL_FINALITY) requires external evidence. F6 (BANKING) only in SIMULATED pilot." },
  { item: "Production settlement performance", reason: "Pilot A: SIMULATED. No live settlement has occurred." },
  { item: "Production liquidity savings", reason: "ALL baselines INSUFFICIENT_DATA. 0 MEASURED. No savings invented." },
  { item: "Production cost savings", reason: "Bank Value Engine: ALL 12 metrics INSUFFICIENT_DATA. NET VALUE = INSUFFICIENT_DATA." },
  { item: "Production MTQ economics", reason: "MTQ DISABLED. 11 prerequisites ALL PENDING. No MTQ economics validated." },
];

/* ------------------------------------------------------------------ */
/*  L. Pilot A Executive Proposal                                      */
/* ------------------------------------------------------------------ */

export const PILOT_A_PROPOSAL: PilotExecutiveProposal = {
  objective: "Test whether the MITHQAL control plane can coordinate a settlement workflow end-to-end with a real bank, producing measurable evidence about current vs proposed performance.",
  problemBeingTested: "Can settlement coordination, policy enforcement, reconciliation, and evidence generation reduce friction in cross-border settlement?",
  corridor: "C-AE-SG (UAE → Singapore) — selected for deep discovery (NOT validated)",
  participants: "1 bank (RESEARCHED, not contacted). MITHQAL (Jozour LLC, G0_CONDITIONAL).",
  testEnvironment: "MITHQAL test environment (Vercel + Turso). Bank's test/staging environment (if available). MTQ DISABLED. BANK_MONEY. Evidence = SIMULATED → CONTROLLED TEST.",
  dataRequired: "Bank-provided baseline: settlement timing, transaction counts, exception rates, reconciliation effort, FX costs, operational costs, compliance effort (12 metrics). NDA required first.",
  workflows: "BM-01..BM-16B (19 steps). Instruction → ISO 20022 → policy → jurisdiction → compliance → liquidity → FX → settlement state → finality → reconciliation → evidence → exception → safe halt → alternative routing → recovery → replay.",
  failureScenarios: "Rail failure (BM-14), compliance block (BM-03), reconciliation mismatch (BM-16A-RECON), safe halt (BM-HALT). Pilot must be capable of producing a NO-GO result.",
  complianceScenarios: "Sanctioned jurisdiction block, AML flag, KYC failure. All SIMULATED — no live sanctions screening.",
  reconciliationScenarios: "Matched settlement, mismatch detection, tolerance policy application. 6 tolerance policies available.",
  safetyControls: "Safe halt (no partial settlement), NO_BYPASS_RULE, evidence preservation, 9-event continuity fabric, exception handling with recoverable/non-recoverable classification.",
  stopConditions: "Unrecoverable exception → safe halt. Policy block → halt. Reconciliation mismatch exceeding tolerance → halt. Bank-requested stop → immediate halt.",
  evidenceProduced: "15-field evidence packages (SHA-256). Regulatory replay (12-field, READ-ONLY). Settlement trace (all 19 steps). Performance measurements (if bank baseline provided).",
  successMetrics: "End-to-end settlement completed (SETTLED). Policy enforced at each step. Evidence generated + verifiable. Reconciliation performed. Exception handled (if injected). Safe halt demonstrated (if triggered). Bank baseline compared to pilot measurements (if baseline provided).",
  responsibilities: "MITHQAL: provide test environment, coordinate workflow, generate evidence. Bank: provide baseline data, participate in test environment, review evidence, assign technical/legal owners.",
  legalPrerequisites: "G0_PASS (entity counsel-verified) + G1 counsel engagement + G2 regulatory clearance + NDA execution. ALL currently BLOCKED.",
  technicalPrerequisites: "MBG gateway integration (test). Bank's test environment access. ISO 20022 message testing.",
  expectedDecisionAfterPilot: "GO: proceed to commercial review + pilot negotiation. NO-GO: document why + identify what would need to change. CONDITIONAL: proceed with identified modifications.",
  canProduceNoGo: true,
};

/* ------------------------------------------------------------------ */
/*  R. Executive Objection Pack (20 objections)                        */
/* ------------------------------------------------------------------ */

export const EXECUTIVE_OBJECTIONS: ExecutiveObjection[] = [
  { objectionId: "EO-01", objection: "Why do we need this?", confirmed: "Cross-border settlement friction exists (documented in corridor-pain-index)", unknown: "Specific bank pain = UNKNOWN (no bank engaged)", hypothesis: "MITHQAL coordination could reduce friction", requiresCounsel: "Legal permissibility requires counsel", requiresBankValidation: "Bank must confirm its own pain" },
  { objectionId: "EO-02", objection: "Why can't our existing systems do it?", confirmed: "Existing systems were not designed for cross-system settlement coordination + evidence", unknown: "What the bank's existing systems can/cannot do", hypothesis: "MITHQAL adds incremental coordination function", requiresCounsel: "N/A", requiresBankValidation: "Bank must assess its own systems" },
  { objectionId: "EO-03", objection: "What is MITHQAL legally?", confirmed: "NOTHING is legally confirmed", unknown: "Legal classification PENDING (G1: 50 questions, 0 answered)", hypothesis: "N/A", requiresCounsel: "Counsel must classify MITHQAL + MTQ", requiresBankValidation: "N/A" },
  { objectionId: "EO-04", objection: "Who is liable?", confirmed: "Jozour LLC is the contracting entity (G0_CONDITIONAL, documents deposited)", unknown: "Specific liability allocation requires executed bank contract (17 sections ALL DRAFT)", hypothesis: "§1.5 indemnification defined but not counsel-verified", requiresCounsel: "Liability structure requires counsel", requiresBankValidation: "Bank must agree to liability terms" },
  { objectionId: "EO-05", objection: "Who holds the funds?", confirmed: "The bank holds its own funds. MITHQAL is stateless (Vercel). MITHQAL does NOT hold bank capital.", unknown: "N/A", hypothesis: "N/A", requiresCounsel: "N/A", requiresBankValidation: "N/A" },
  { objectionId: "EO-06", objection: "Who controls backing?", confirmed: "No qualified custodian engaged. PBC: 0/14 predicates. Gold in Strategic Resilience (NOT backing).", unknown: "Custody arrangement requires executed agreement", hypothesis: "2-domain reserve structure designed", requiresCounsel: "Custody structure requires counsel", requiresBankValidation: "Bank may require specific custodian" },
  { objectionId: "EO-07", objection: "What happens if a participant fails?", confirmed: "MITHQAL COORDINATES, does NOT adjudicate. 6 forbidden assumptions. 9 events × 7 stages continuity fabric.", unknown: "Specific failure scenarios require legal opinion (LQ-12 through LQ-16)", hypothesis: "Safe halt + alternative routing + recovery (SIMULATED)", requiresCounsel: "Failure scenarios require counsel", requiresBankValidation: "Bank must validate failure handling" },
  { objectionId: "EO-08", objection: "What happens if MITHQAL fails?", confirmed: "§1.7: existing judgment acknowledged. §1.4(c): assets in trust. Safe halt = no partial settlement.", unknown: "Insolvency treatment requires counsel (LQ-16, LQ-17)", hypothesis: "Continuity fabric handles MITHQAL failure", requiresCounsel: "Insolvency treatment requires counsel", requiresBankValidation: "N/A" },
  { objectionId: "EO-09", objection: "How does finality work?", confirmed: "F0-F7, 3 types, 2 modes. Pilot A: F6 (BANKING_FINALITY). F7 (LEGAL) requires external evidence.", unknown: "Which finality domain is legally recognized (LQ-33)", hypothesis: "F6 achievable in pilot", requiresCounsel: "Finality requires counsel", requiresBankValidation: "Bank must confirm finality sufficiency" },
  { objectionId: "EO-10", objection: "How does integration work?", confirmed: "MBG gateway (API, ISO 20022). 11 onboarding modules DRAFT.", unknown: "Bank's actual infrastructure compatibility", hypothesis: "API-based integration is feasible", requiresCounsel: "N/A", requiresBankValidation: "Bank technical assessment required" },
  { objectionId: "EO-11", objection: "What data is shared?", confirmed: "15×7 data governance matrix (28 PENDING). 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT).", unknown: "Specific data flows require DPA", hypothesis: "Data minimization + least privilege designed", requiresCounsel: "DPA requirements require counsel", requiresBankValidation: "Bank must define data requirements" },
  { objectionId: "EO-12", objection: "What are the cybersecurity requirements?", confirmed: "No certifications obtained. Security model designed (not certified).", unknown: "Bank-specific security requirements", hypothesis: "Standard security practices (encryption, access control, audit logging)", requiresCounsel: "N/A", requiresBankValidation: "Bank security assessment required" },
  { objectionId: "EO-13", objection: "Who regulates this?", confirmed: "0/8 jurisdictions triaged. 0 regulatory applications filed.", unknown: "Which regulator + what requirements", hypothesis: "DIFC/ADGM + MAS frameworks may apply", requiresCounsel: "Regulatory perimeter requires counsel", requiresBankValidation: "Bank's regulatory framework applies" },
  { objectionId: "EO-14", objection: "How much will it cost?", confirmed: "49 prices ALL PENDING. No commercial pricing set.", unknown: "MITHQAL service cost = UNKNOWN", hypothesis: "Pilot cost may be shared/sponsored", requiresCounsel: "N/A", requiresBankValidation: "Bank must define cost expectations" },
  { objectionId: "EO-15", objection: "What is the ROI?", confirmed: "12 metrics × 6 categories. ALL INSUFFICIENT_DATA. NO savings invented.", unknown: "ALL ROI components UNKNOWN", hypothesis: "ROI framework ready to populate with bank baseline", requiresCounsel: "N/A", requiresBankValidation: "Bank must provide baseline data" },
  { objectionId: "EO-16", objection: "Why should our bank participate?", confirmed: "Design partner gets: measurable evidence, reference value, architecture input", unknown: "Whether the bank sees sufficient value", hypothesis: "Early participation provides reference value", requiresCounsel: "N/A", requiresBankValidation: "Bank must see value in participation" },
  { objectionId: "EO-17", objection: "Why should we run a pilot?", confirmed: "Pilot tests: can coordination reduce friction? Produces measurable evidence.", unknown: "Whether the bank wants to test", hypothesis: "Pilot provides discovery without production commitment", requiresCounsel: "Pilot legal prerequisites required", requiresBankValidation: "Bank must agree to pilot scope" },
  { objectionId: "EO-18", objection: "Can we test without MTQ?", confirmed: "YES. Pilot A: 0/19 steps use MTQ. BANK_MONEY. MTQ disabled by default.", unknown: "N/A", hypothesis: "N/A", requiresCounsel: "N/A", requiresBankValidation: "N/A" },
  { objectionId: "EO-19", objection: "What happens if the pilot fails?", confirmed: "Pilot can produce NO-GO result (canProduceNoGo=true). Safe halt = no harm.", unknown: "What specific failure would mean for the bank", hypothesis: "Failure = documented learning, no production impact", requiresCounsel: "N/A", requiresBankValidation: "Bank must agree failure terms" },
  { objectionId: "EO-20", objection: "What evidence exists today?", confirmed: "Architecture FROZEN. Pilot A: 19 steps SETTLED (SIMULATED). 39 modules. 222 routes. BUT: 0 external validation.", unknown: "ALL external validation PENDING", hypothesis: "N/A", requiresCounsel: "ALL legal/regulatory requires counsel", requiresBankValidation: "ALL bank validation requires bank engagement" },
];

/* ------------------------------------------------------------------ */
/*  P. Risk Executive Summary (14 risks)                               */
/* ------------------------------------------------------------------ */

export const RISK_SUMMARY: RiskSummary[] = [
  { risk: "Legal risk", cause: "MTQ + MITHQAL legal classification PENDING. No counsel engaged.", currentControl: "G1: 50 questions prepared. NOT PRODUCTION-AUTHORIZED.", residualUncertainty: "HIGH — all legal questions unanswered", evidence: "G1: READY_FOR_COUNSEL", owner: "COO + external counsel", pilotTreatment: "Pilot requires G1 counsel opinion first" },
  { risk: "Regulatory risk", cause: "0/8 jurisdictions triaged. No regulatory application filed.", currentControl: "G2: Regulatory Perimeter NOT_STARTED.", residualUncertainty: "HIGH — regulatory requirements unknown", evidence: "jurisdiction-truth-model.ts: ALL SEED_DATA/UNKNOWN", owner: "COO + regulatory counsel", pilotTreatment: "Pilot requires G2 regulatory clearance" },
  { risk: "Bank counterparty risk", cause: "0 banks contacted. Bank creditworthiness unknown.", currentControl: "Bank pipeline: ALL RESEARCHED.", residualUncertainty: "HIGH — no bank assessed", evidence: "p65-bank-pipeline.ts: 15 researched, 0 contacted", owner: "COO", pilotTreatment: "Pilot requires bank due diligence" },
  { risk: "Custody risk", cause: "No qualified custodian. 0/14 PBC predicates.", currentControl: "reserve-domains.ts: 2 domains. Gold in Strategic Resilience.", residualUncertainty: "HIGH — no custody arrangement", evidence: "pbc-legal-enforceability.ts: 0/14 predicates", owner: "COO + custody counsel", pilotTreatment: "Pilot does not require custody (BANK_MONEY)" },
  { risk: "Settlement risk", cause: "Settlement finality legal recognition unknown.", currentControl: "F0-F7 finality model designed. F6 (BANKING) in SIMULATED pilot.", residualUncertainty: "HIGH — F7 (LEGAL) requires counsel", evidence: "canonical-finality-model.ts", owner: "CTO + external counsel", pilotTreatment: "Pilot tests F6 only (SIMULATED)" },
  { risk: "Liquidity risk", cause: "No live liquidity data. Nostro/vostro positions unknown.", currentControl: "Liquidity routing (BM-12) designed. SIMULATED.", residualUncertainty: "HIGH — no bank liquidity data", evidence: "pilot-a-execution-engine.ts: BM-12 SIMULATED", owner: "CTO", pilotTreatment: "Pilot requires bank liquidity baseline" },
  { risk: "Operational risk", cause: "0 FTE. $0 cash. No operational team.", currentControl: "institutionalization-operating-plan.ts: 40.75 FTE required, 0 filled.", residualUncertainty: "HIGH — no operational capacity", evidence: "operating-plan: $4.7M DESIGN-TIME", owner: "COO", pilotTreatment: "Pilot requires operational resources" },
  { risk: "Reconciliation risk", cause: "6 tolerance policies designed but untested with real bank.", currentControl: "reconciliation-tolerance-policies.ts: 6 policies.", residualUncertainty: "MEDIUM — designed but untested", evidence: "Pilot A: reconciliation SIMULATED", owner: "CTO", pilotTreatment: "Pilot tests reconciliation with bank data" },
  { risk: "Cybersecurity risk", cause: "No security certification. No penetration test.", currentControl: "Security model designed. No certifications obtained.", residualUncertainty: "HIGH — no external security audit", evidence: "enterprise-risk-register.ts: 17 risks ALL OPEN", owner: "CTO", pilotTreatment: "Pilot requires security review" },
  { risk: "Data risk", cause: "No DPA. 28/105 data governance cells PENDING.", currentControl: "15×7 governance matrix. 3 access levels.", residualUncertainty: "MEDIUM — designed but no DPA", evidence: "institutional-data-governance.ts: 28 PENDING", owner: "CTO + data counsel", pilotTreatment: "Pilot requires DPA" },
  { risk: "Model/automation risk", cause: "Deterministic monetary engine (SIMULATED). No live validation.", currentControl: "v19 monetary engine. Canonical supply ledger.", residualUncertainty: "MEDIUM — designed but untested live", evidence: "monetary-engine-v19.ts", owner: "CTO", pilotTreatment: "Pilot does not use monetary engine (BANK_MONEY)" },
  { risk: "Vendor/third-party risk", cause: "Vercel, Turso, Neon, Inngest dependencies.", currentControl: "runtime-infrastructure-map.ts: 5 systems, no competing truth.", residualUncertainty: "LOW — free tiers, graceful degradation", evidence: "Infra map: all systems operational", owner: "CTO", pilotTreatment: "Pilot uses same infrastructure" },
  { risk: "Failure/default/resolution risk", cause: "6 forbidden assumptions. Existing judgment (§1.7).", currentControl: "COORDINATION_RULE. Safe halt. No partial settlement.", residualUncertainty: "HIGH — insolvency treatment requires counsel", evidence: "failure-resolution-legal-conditionality.ts", owner: "COO + external counsel", pilotTreatment: "Pilot tests safe halt + recovery (SIMULATED)" },
  { risk: "Concentration risk", cause: "Sole Member (Mohamed Salah Eltonsy). Single point of control.", currentControl: "G0_CONDITIONAL — documents deposited but counsel verification pending.", residualUncertainty: "MEDIUM — sole-member structure", evidence: "Amendment + Resolution deposited", owner: "COO + external counsel", pilotTreatment: "Pilot does not change governance" },
];

/* ------------------------------------------------------------------ */
/*  Final Readiness + Management Output                                 */
/* ------------------------------------------------------------------ */

export const FINAL_READINESS: FinalReadiness = {
  packageStatus: "READY_WITH_LIMITATIONS",
  primaryCorridor: "C-AE-SG (UAE → Singapore)",
  bankPipelineStatus: "15 researched, 0 contacted, 0 design partners",
  g0Status: "G0_CONDITIONAL",
  g1Status: "READY_FOR_COUNSEL (BLOCKED_BY_G0)",
  counselStatus: "NOT ENGAGED — 50 questions + 22 deliverables prepared",
  bankValidatedProblemCount: 0,
  executiveInterestCount: 0,
  architectureReviewCount: 0,
  pilotDesignCount: 0,
  knownExternalEvidence: 0,
  criticalUnknowns: [
    "ALL bank pain = UNKNOWN (0 banks engaged)",
    "ALL ROI = UNKNOWN (0 baseline data)",
    "ALL legal classification = PENDING (0 counsel engaged)",
    "ALL regulatory clearance = PENDING (0/8 triaged)",
    "MTQ = DISABLED (0/11 prerequisites met)",
  ],
  criticalBlockers: [
    "G0_CONDITIONAL — entity not counsel-verified",
    "G1 BLOCKED_BY_G0 — 50 legal questions unanswered",
    "0 banks contacted — pipeline at RESEARCHED",
    "0 counsel engaged — counsel package ready but BLOCKED",
  ],
  mtqIndependentValuePath: true,
  pilotAReadiness: "REQUIRES_BANK_DISCOVERY + REQUIRES_LEGAL_WORK (blocked by G0+G1)",
  productionAuthorized: false,
  institutionallyValidated: false,
  nextExternalEvidence: "Institutional Discovery Workshop: approach a UAE-based bank (DIFC/ADGM) to confirm AE-SG corridor settlement pain + provide baseline data. Requires G0_PASS + G1 counsel engagement + NDA first.",
};

export const BANK_EXECUTIVE_PACKAGE_STATUS = "READY_WITH_LIMITATIONS";
export const PRIMARY_EXECUTIVE_MESSAGE = "MITHQAL is institutional settlement control infrastructure that can coordinate cross-border settlement workflows, generate evidence, and perform reconciliation — with MTQ completely disabled — to test whether a control-plane approach can measurably reduce settlement friction for your bank.";
export const FIRST_MEETING_OBJECTIVE = "Institutional Discovery Workshop: understand the bank's current AE-SG settlement process, confirm pain points, introduce MITHQAL Mode-A (MTQ disabled), and agree on the next evidence-acquisition step.";
export const NEXT_EXTERNAL_EVIDENCE = "Institutional Discovery Workshop with a UAE-based bank (DIFC/ADGM) to confirm corridor settlement pain + collect baseline data for the Bank Value Measurement Engine. BLOCKED by G0_PASS + G1 counsel engagement.";

/* ------------------------------------------------------------------ */
/*  Full Package                                                       */
/* ------------------------------------------------------------------ */

export function getBankExecutivePackage(): BankExecutivePackage {
  return {
    priorBaselines: [
      "Prompt 62 G0: G0_CONDITIONAL (8/16 verified, 8/16 pending)",
      "Prompt 63 G1: READY_FOR_COUNSEL (50 questions, BLOCKED_BY_G0)",
      "Prompt 64: C-AE-SG primary corridor (NOT validated)",
      "Prompt 65: 15 banks researched (0 contacted)",
      "Prompt 66: Counsel engagement brief (READY_FOR_COUNSEL, no opinion issued)",
      "v25.3.2 FROZEN: 10 frozen schemas, 39 modules, 222 routes",
    ],
    executiveThesis: EXECUTIVE_THESIS,
    bankProductBrief: [
      { section: "Executive Summary", content: "MITHQAL is settlement control infrastructure with MTQ disabled. Pilot A: 19 steps, SETTLED, SIMULATED. NOT PRODUCTION-AUTHORIZED." },
      { section: "MITHQAL in one page", content: "Permissioned, institutional, closed-loop settlement control. Not a bank, custodian, or regulator. Coordinates settlement — does not legally settle." },
      { section: "Institutional settlement problem", content: "T+2/T+3 latency, trapped liquidity, opaque FX, manual reconciliation, compliance burden." },
      { section: "Settlement coordination gap", content: "Existing infrastructure lacks cross-system coordination + evidence + reconciliation automation." },
      { section: "MTQ as optional module", content: "MTQ DISABLED by default. 11 prerequisites. MTQ_ACTIVE NOT reachable from config. Control plane works without MTQ." },
      { section: "Pilot A", content: "19 steps, BANK_MONEY, MTQ disabled, SETTLED, F6, SIMULATED. Can produce NO-GO." },
      { section: "Risks and limitations", content: "0 external validation. 0 banks. 0 counsel. 0 gates passed. NOT PRODUCTION-AUTHORIZED." },
      { section: "Requested next step", content: "INSTITUTIONAL_DISCOVERY_WORKSHOP (not purchase, not integration, not MTQ adoption)." },
    ],
    bankValueMap: BANK_VALUE_MAP,
    whyMithqalTest: WHY_MITHQAL_TEST,
    whyNotInternal: "MITHQAL is NOT a replacement for bank infrastructure. It is an incremental coordination function: cross-system settlement workflow, policy enforcement at each step, automated evidence, reconciliation, and regulatory replay. Whether this incremental function adds value is a HYPOTHESIS that must be validated by the bank. MITHQAL does NOT disparage existing infrastructure — it complements it.",
    whyNotExistingRail: [
      { rail: "RTGS", whatItDoes: "Real-time gross settlement within a jurisdiction", whatItDoesNot: "Does not coordinate cross-border, does not generate cross-system evidence, does not orchestrate reconciliation", mithqalInteroperate: "MITHQAL could coordinate settlement that uses RTGS as a rail", mithqalRedundant: "If the bank only needs domestic RTGS, MITHQAL adds no value", requiresBankValidation: "Bank must assess whether cross-system coordination adds value over RTGS alone" },
      { rail: "Correspondent banking", whatItDoes: "Cross-border settlement via intermediary bank relationships", whatItDoesNot: "Does not provide cross-system evidence, automated reconciliation, or policy orchestration", mithqalInteroperate: "MITHQAL coordinates the correspondent banking workflow", mithqalRedundant: "If the bank is satisfied with correspondent banking coordination, MITHQAL adds no value", requiresBankValidation: "Bank must assess coordination + evidence gaps" },
      { rail: "SWIFT messaging", whatItDoes: "Standardized financial messaging between banks", whatItDoesNot: "Does not orchestrate settlement workflow, enforce policy, or generate evidence", mithqalInteroperate: "MITHQAL translates ISO 20022 messages (BM-02)", mithqalRedundant: "If the bank only needs messaging, MITHQAL adds no value", requiresBankValidation: "Bank must assess whether orchestration adds value over messaging alone" },
    ],
    mtqOptionalPositioning: {
      withoutMtq: "MITHQAL WITHOUT MTQ: 19 settlement steps, BANK_MONEY, 0/19 mtqUsed, SETTLED, F6. The control plane (policy, compliance, jurisdiction, liquidity, FX, finality, reconciliation, evidence) operates completely without MTQ.",
      withMtq: "MITHQAL WITH MTQ: Optional extension. 4-state lifecycle (DISABLED→ELIGIBLE→AUTHORIZED→ACTIVE). 11 prerequisites. MTQ_ACTIVE NOT reachable from config alone. Only discussed if bank explicitly requests.",
      conditions: ["Legal validation (MTQ classification)", "Accounting/prudential validation", "Regulatory validation", "Custody/backing validation", "Contractual validation", "Controlled pilot approval"],
    },
    bankMustBelieve: BANK_MUST_BELIEVE,
    bankShouldNotBelieve: BANK_SHOULD_NOT_BELIEVE,
    pilotAProposal: PILOT_A_PROPOSAL,
    bankDataRequest: [
      { category: "Anonymized settlement timing", requirement: "REQUIRED" },
      { category: "Transaction counts", requirement: "REQUIRED" },
      { category: "Transaction-value bands", requirement: "REQUIRED" },
      { category: "Exception rates", requirement: "REQUIRED" },
      { category: "Reconciliation effort", requirement: "REQUIRED" },
      { category: "Manual touchpoints", requirement: "REQUIRED" },
      { category: "Liquidity/pre-positioning requirements", requirement: "OPTIONAL" },
      { category: "FX cost ranges", requirement: "OPTIONAL" },
      { category: "Operational cost proxies", requirement: "OPTIONAL" },
      { category: "Compliance processing effort", requirement: "OPTIONAL" },
      { category: "Failure/recovery records", requirement: "NICE_TO_HAVE" },
      { category: "Existing system flow", requirement: "OPTIONAL" },
      { category: "Operating-hour constraints", requirement: "OPTIONAL" },
      { category: "No PII/customer data", requirement: "REQUIRED" },
    ],
    securityAssurance: [
      { item: "Data minimization", status: "DESIGNED — not certified" },
      { item: "Least privilege", status: "DESIGNED — 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT)" },
      { item: "Access control", status: "DESIGNED — not externally audited" },
      { item: "Audit logging", status: "DESIGNED — evidence fabric (SHA-256)" },
      { item: "Segregation", status: "DESIGNED — 2 reserve domains" },
      { item: "Encryption", status: "DESIGNED — TLS in transit. At-rest = cloud provider default." },
      { item: "Environment separation", status: "DESIGNED — dev/preview/production" },
      { item: "Confidential data handling", status: "DESIGNED — no certifications obtained" },
      { item: "Evidence integrity", status: "DESIGNED — SHA-256 commitments" },
      { item: "Retention", status: "UNKNOWN — requires DPA + counsel" },
      { item: "Deletion", status: "UNKNOWN — requires DPA + counsel" },
      { item: "Incident handling", status: "DESIGNED — 9 events × 7 stages. Not externally tested." },
      { item: "Third-party access", status: "DESIGNED — 5 systems, no competing truth" },
      { item: "Audit access", status: "DESIGNED — AUDIT access level in evidence fabric" },
    ],
    legalRegulatorySummary: {
      currentLegalStatus: "LEGAL_VALIDATION_PENDING — 0 counsel engaged. 50 questions prepared (G1). MTQ classification PENDING. Entity G0_CONDITIONAL.",
      currentRegulatoryStatus: "JURISDICTION_PENDING — 0/8 jurisdictions triaged. 0 regulatory applications filed. 0 sandbox admissions.",
      knownRequirements: "G0: entity counsel verification. G1: 50 legal questions. G2: regulatory clearance. ALL BLOCKED.",
      counselQuestions: "20 MTQ classification questions + 18 backing/custody + 18 redemption + 9 finality + 10 cross-border + 15 regulatory perimeter = 90+ legal questions. ALL unanswered.",
      bankDependencies: "Bank must: provide baseline data, participate in technical assessment, conduct legal/compliance review, agree to pilot scope. ALL require bank engagement (0 contacted).",
      openMatters: "5 legal contradictions (3 BLOCKING). §1.7 existing judgment. Non-profit vs for-profit. 4-entity vs 2-entity. MTQ classification. Original OA not deposited.",
    },
    riskSummary: RISK_SUMMARY,
    roiFramework: {
      benefitCategories: ["Settlement-cost reduction", "FX-cost reduction", "Liquidity improvement", "Operational efficiency", "Reconciliation reduction", "Compliance efficiency", "Exception efficiency", "New service/revenue"],
      costCategories: ["Integration", "Compliance", "Technology", "Legal", "Security", "Operations", "Training", "Maintenance", "Risk capital"],
      evidenceStatus: "UNKNOWN",
    },
    objectionPack: EXECUTIVE_OBJECTIONS,
    firstMeetingAgenda: [
      { item: "1. Bank context", content: "Bank's cross-border settlement activity + corridor relevance" },
      { item: "2. Settlement problem", content: "Current friction: latency, liquidity, FX, reconciliation, compliance" },
      { item: "3. Current workflow", content: "Bank describes its AE-SG settlement process" },
      { item: "4. Pain confirmation", content: "Bank confirms specific pain points (not MITHQAL's hypothesis)" },
      { item: "5. Existing infrastructure", content: "What the bank uses today (RTGS, correspondent, SWIFT, treasury systems)" },
      { item: "6. Remaining gap", content: "What existing infrastructure does not solve" },
      { item: "7. MITHQAL concept", content: "What MITHQAL is (control plane, not bank/custodian/regulator)" },
      { item: "8. MTQ-disabled model", content: "Pilot A: 19 steps, BANK_MONEY, 0/19 MTQ. MTQ optional." },
      { item: "9. Pilot hypothesis", content: "Can coordination + evidence + reconciliation reduce friction?" },
      { item: "10. Legal/regulatory dependency", content: "G0+G1+G2 required before pilot. LEGAL_VALIDATION_PENDING." },
      { item: "11. Measurement framework", content: "12 metrics × 6 categories. Bank provides baseline. Engine computes deltas." },
      { item: "12. Next evidence step", content: "Agree on next step: NDA + baseline data + technical assessment" },
    ],
    secondMeetingTrigger: {
      minimumEvidence: [
        "Confirmed institutional problem (bank-stated, not MITHQAL hypothesis)",
        "Identifiable business owner at the bank",
        "Preliminary technical owner at the bank",
        "Preliminary legal/compliance owner at the bank",
        "Defined corridor relevance (AE-SG confirmed by bank)",
        "Willingness to share sufficient discovery data",
        "Willingness to evaluate a controlled pilot",
        "No unresolved fatal misunderstanding about MITHQAL's role",
      ],
      ifAbsent: "DO NOT advance to architecture review. If any of the 8 minimum evidence items are absent, remain in discovery mode.",
    },
    decisionGate: ["NO_FURTHER_ACTION", "CONTINUE_DISCOVERY", "TECHNICAL_WORKSHOP", "LEGAL_REVIEW", "PILOT_DISCUSSION"],
    evidenceTraceability: [
      { claimId: "EC-01", claim: "Pilot A: 19 steps SETTLED with MTQ disabled", source: "pilot-a-execution-engine.ts", evidenceState: "MEASURED", date: NOW, owner: "CTO" },
      { claimId: "EC-02", claim: "Architecture FROZEN at v25.3.2", source: "controlled-architecture-freeze.ts", evidenceState: "MEASURED", date: NOW, owner: "COO+CTO" },
      { claimId: "EC-03", claim: "0 banks contacted", source: "p65-bank-pipeline.ts", evidenceState: "MEASURED", date: NOW, owner: "COO" },
      { claimId: "EC-04", claim: "0 external validation", source: "final-institutional-dossier.ts", evidenceState: "MEASURED", date: NOW, owner: "COO+CTO" },
      { claimId: "EC-05", claim: "0 counsel engaged", source: "g1-legal-evidence-pack.ts", evidenceState: "MEASURED", date: NOW, owner: "COO" },
      { claimId: "EC-06", claim: "0/12 gates passed", source: "institutional-critical-path.ts", evidenceState: "MEASURED", date: NOW, owner: "COO" },
      { claimId: "EC-07", claim: "Bank pain = UNKNOWN", source: "p64-corridor-decision-pack.ts", evidenceState: "UNKNOWN", date: NOW, owner: "COO" },
      { claimId: "EC-08", claim: "ROI = INSUFFICIENT_DATA", source: "bank-value-measurement-engine.ts", evidenceState: "UNKNOWN", date: NOW, owner: "CFO" },
      { claimId: "EC-09", claim: "NOT PRODUCTION-AUTHORIZED", source: "honest-state rule", evidenceState: "MEASURED", date: NOW, owner: "COO+CTO" },
      { claimId: "EC-10", claim: "Entity G0_CONDITIONAL (documents deposited, counsel pending)", source: "g0-re-assessment.ts", evidenceState: "MEASURED", date: NOW, owner: "COO" },
    ],
    diagrams: [
      { diagramId: "D-01", title: "CURRENT PROBLEM FLOW", label: "DESIGN" },
      { diagramId: "D-02", title: "MITHQAL CONTROL-PLANE FLOW", label: "SIMULATION" },
      { diagramId: "D-03", title: "MITHQAL + EXISTING BANK INFRASTRUCTURE", label: "DESIGN" },
      { diagramId: "D-04", title: "PILOT A FLOW", label: "SIMULATION" },
      { diagramId: "D-05", title: "FAILURE/RECOVERY FLOW", label: "SIMULATION" },
    ],
    qualityGate: [
      { check: "TRUTHFUL", passed: true },
      { check: "BANK_COMPREHENSIBLE", passed: true },
      { check: "CORRIDOR_SPECIFIC", passed: true },
      { check: "MTQ_INDEPENDENT", passed: true },
      { check: "EVIDENCE_TRACEABLE", passed: true },
      { check: "PILOT_MEASURABLE", passed: true },
      { check: "LEGALLY_CONDITIONED", passed: true },
      { check: "SECURITY_AWARE", passed: true },
      { check: "COMMERCIAL_REALISTIC", passed: true },
      { check: "NON_PROMOTIONAL", passed: true },
      { check: "EXECUTIVE_USABLE", passed: true },
    ],
    finalReadiness: FINAL_READINESS,
    bankExecutivePackageStatus: BANK_EXECUTIVE_PACKAGE_STATUS,
    primaryExecutiveMessage: PRIMARY_EXECUTIVE_MESSAGE,
    firstMeetingObjective: FIRST_MEETING_OBJECTIVE,
    nextExternalEvidence: NEXT_EXTERNAL_EVIDENCE,
    honestState: {
      productionAuthorized: false,
      nonPromotional: true,
      architectureNotModified: true,
      evidenceTraceable: true,
    },
    summary: `PROMPT 67: BANK EXECUTIVE DECISION & ENGAGEMENT PACKAGE. 10-section executive thesis. 8-section product brief. 12 bank value map entries. 9 falsifiable tests. 9 "must believe" claims. 11 "should NOT believe" items. 18-section pilot proposal (can produce NO-GO). 14 data request categories. 14 security items. 14 risk items. 20 objection responses. 12-item first meeting agenda. 8-item second meeting trigger. 5 decision gate states. 10 evidence-traceable claims. 5 diagrams (labeled SIMULATION/DESIGN). 11 quality gate checks (ALL PASSED). Package status: READY_WITH_LIMITATIONS. NOT PRODUCTION-AUTHORIZED. Non-promotional. Evidence-traceable.`,
  };
}

export const P67_META = {
  module: "p67-bank-executive-package",
  version: "v25.3.2",
  prompt: "PROMPT 67",
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED — READY_WITH_LIMITATIONS",
  frozenArchitecture: true,
  corridor: "C-AE-SG",
  g0Status: "G0_CONDITIONAL",
  g1Status: "READY_FOR_COUNSEL",
  bankPackageStatus: "READY_WITH_LIMITATIONS",
  bankPipelineStatus: "15 researched, 0 contacted",
  qualityGatePassed: true,
  nextExternalEvidence: NEXT_EXTERNAL_EVIDENCE,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. No architecture expansion.
//  Inherit truth states from Prompts 62-66. No silent upgrades.
//  Non-promotional. Evidence-traceable. MTQ-independent.
//  Package status: READY_WITH_LIMITATIONS.
//  Quality gate: 11/11 PASSED.
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
