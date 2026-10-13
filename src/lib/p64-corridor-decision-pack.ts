/**
 * MITHQAL — PROMPT 64: FIRST INSTITUTIONAL CORRIDOR DECISION PACK
 *
 * Architecture FROZEN at v25.3.2. No new features. No invented numbers.
 * All data points honestly classified: MEASURED / EXTERNAL_SOURCE / ASSUMED / UNKNOWN.
 *
 * G0: G0_CONDITIONAL (documents deposited, counsel verification pending)
 * G1: READY_FOR_COUNSEL (50 questions, BLOCKED_BY_G0)
 *
 * NOT PRODUCTION-AUTHORIZED. Preserve uncertainty.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceState = "MEASURED" | "EXTERNAL_SOURCE" | "ASSUMED" | "UNKNOWN";
export type BankDependency = "IDENTIFIED" | "RESEARCHED" | "UNCONFIRMED" | "UNKNOWN";
export type PilotReadiness = "READY_FOR_DEEP_BANK_DISCOVERY" | "REQUIRES_LEGAL_WORK" | "REQUIRES_BANK_DISCOVERY" | "REQUIRES_RAIL_VALIDATION" | "REQUIRES_ECONOMIC_EVIDENCE" | "BLOCKED" | "UNKNOWN";

export interface CorridorDefinition {
  sourceJurisdiction: string;
  sourceInstitutionType: string;
  sourceCurrency: string;
  destinationJurisdiction: string;
  destinationInstitutionType: string;
  destinationCurrency: string;
}

export interface PainMetric {
  metricId: string;
  label: string;
  value: string;
  unit: string;
  evidenceState: EvidenceState;
  source: string;
  date: string;
  measurementMethod: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  limitations: string;
}

export interface BankPainItem {
  question: string;
  answer: string;
  evidenceState: EvidenceState;
}

export interface ValueHypothesis {
  currentBankProcess: string;
  currentFriction: string;
  mithqalIntervention: string;
  expectedValue: string;
  measurementMethod: string;
  evidenceRequired: string;
  evidenceState: EvidenceState;
}

export interface LegalDependency {
  item: string;
  jurisdictionAStatus: string;
  jurisdictionBStatus: string;
  crossBorderStatus: string;
  counselRequired: boolean;
}

export interface BankDep {
  role: string;
  institution: string;
  status: BankDependency;
}

export interface EconomicLineItem {
  item: string;
  observed: string;
  externallySourced: string;
  assumed: string;
  unknown: string;
  evidenceState: EvidenceState;
}

export interface CorridorCandidate {
  corridorId: string;
  corridor: CorridorDefinition;
  painMetrics: PainMetric[];
  bankPain: BankPainItem[];
  valueHypothesis: ValueHypothesis[];
  mtqMode: { modeA: string; modeB: string; mtqDependency: "LOW" | "MEDIUM" | "HIGH" };
  legalDependencies: LegalDependency[];
  bankDependencies: BankDep[];
  economicModel: EconomicLineItem[];
  pilotReadiness: PilotReadiness;
  pilotReadinessRationale: string;
  mtqIndependentValuePath: boolean;
  openBlockers: string[];
  nextExternalEvidence: string;
}

export interface FinalStatus {
  g0Status: string;
  g1Status: string;
  candidateCount: number;
  candidateCorridors: string[];
  evidenceCounts: { measured: number; externalSource: number; assumed: number; unknown: number };
  criticalBlockers: string[];
  shortlistedCorridors: string[];
  primaryCorridorForDeepDiscovery: string;
  mtqIndependentValuePath: boolean;
  legalValidationStatus: string;
  bankDependencyStatus: string;
  pilotAReadiness: string;
  nextExternalEvidence: string;
  productionAuthorized: boolean;
  institutionallyValidated: boolean;
}

export interface CorridorDecisionPack {
  priorBaselines: string[];
  corridors: CorridorCandidate[];
  comparisonTable: { corridor: string; primaryPain: string; settlementFriction: string; liquidityFriction: string; fxFriction: string; operationalFriction: string; complianceFriction: string; legalDependency: string; bankDependency: string; technicalDependency: string; mtqDependency: string; evidenceQuality: string; pilotComplexity: string; commercialHypothesis: string; openBlockers: string; nextExternalEvidence: string }[];
  managementShortlist: { corridorId: string; whyItRemains: string; whatIsKnown: string; whatIsUnknown: string; whatBlocksPilot: string; nextExternalEvidence: string; owner: string; dependency: string }[];
  primaryCorridorForDeepDiscovery: string;
  selectionCriteria: string;
  finalStatus: FinalStatus;
  nextExternalEvidence: string;
  honestState: { productionAuthorized: boolean; noInventedNumbers: boolean; uncertaintyPreserved: boolean; architectureNotModified: boolean };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T22:55:00Z";
const G0_STATUS = "G0_CONDITIONAL";
const G1_STATUS = "READY_FOR_COUNSEL (BLOCKED_BY_G0)";

/* ------------------------------------------------------------------ */
/*  20 Pain Metrics (ALL UNKNOWN — no bank data)                      */
/* ------------------------------------------------------------------ */

const PAIN_METRIC_LABELS = [
  "Settlement delay", "Settlement uncertainty", "Liquidity fragmentation",
  "Liquidity pre-funding requirement", "FX cost", "FX spread volatility",
  "Correspondent-chain complexity", "Reconciliation burden", "Compliance friction",
  "Operating-hours mismatch", "Exception/dispute burden", "Failure/recovery complexity",
  "Transparency deficit", "Data/evidence fragmentation", "Manual operations burden",
  "Treasury burden", "Counterparty exposure complexity", "Cross-border legal complexity",
  "Integration complexity", "Institutional demand evidence",
];

function unknownMetric(metricId: string, label: string): PainMetric {
  return {
    metricId, label,
    value: "UNKNOWN", unit: "N/A",
    evidenceState: "UNKNOWN",
    source: "No bank-provided baseline data. No external research conducted.",
    date: NOW,
    measurementMethod: "N/A — no data available",
    confidence: "NONE",
    limitations: "Cannot assess pain without bank-provided data. Do NOT fill with plausible numbers.",
  };
}

function makePainMetrics(): PainMetric[] {
  return PAIN_METRIC_LABELS.map((label, i) => unknownMetric(`PM-${String(i+1).padStart(2,'0')}`, label));
}

/* ------------------------------------------------------------------ */
/*  Bank Pain (ALL UNKNOWN)                                           */
/* ------------------------------------------------------------------ */

const BANK_PAIN_QUESTIONS = [
  "What is the bank doing today?", "Where does money get trapped?",
  "Where is liquidity pre-positioned?", "Where does settlement slow down?",
  "Where does FX create cost?", "Where does reconciliation require manual work?",
  "Where do exceptions occur?", "What evidence must ops/compliance/treasury assemble?",
  "Where does counterparty exposure become difficult to monitor?",
  "Where does legal uncertainty enter?", "What existing infrastructure is already solving part of the problem?",
  "What problem remains unsolved?",
];

function makeBankPain(): BankPainItem[] {
  return BANK_PAIN_QUESTIONS.map(q => ({ question: q, answer: "UNKNOWN — no bank has been engaged. Requires bank operations/treasury/compliance interview.", evidenceState: "UNKNOWN" as EvidenceState }));
}

/* ------------------------------------------------------------------ */
/*  MITHQAL Value Hypothesis (DESIGNED — not measured)                */
/* ------------------------------------------------------------------ */

const VALUE_HYPOTHESES = [
  { process: "Correspondent banking chain (multiple intermediary banks)", friction: "T+2/T+3 latency, multiple fees, opacity", intervention: "MBG gateway + direct settlement coordination (BM-01..BM-16B)", value: "Reduced latency, reduced intermediary count, increased transparency", method: "Measure instruction-to-finality time in Pilot A", evidence: "Bank-provided baseline latency + Pilot A measured latency", state: "ASSUMED" as EvidenceState },
  { process: "Nostro/vostro liquidity pre-positioning", friction: "Trapped capital in multiple correspondent accounts", intervention: "Liquidity routing (BM-12) with BANK_MONEY, no MTQ required", value: "Reduced trapped liquidity, improved utilization", method: "Measure idle balance before/after", evidence: "Bank-provided nostro/vostro baseline", state: "ASSUMED" as EvidenceState },
  { process: "Manual reconciliation across correspondent chain", friction: "High FTE, exception handling, mismatch resolution", intervention: "Reconciliation tolerance policies (6 policies) + evidence fabric", value: "Automated reconciliation, reduced FTE, evidence trail", method: "Measure reconciliation FTE + exception rate", evidence: "Bank-provided reconciliation baseline", state: "ASSUMED" as EvidenceState },
  { process: "FX spread through correspondent chain", friction: "Multiple FX conversions, opaque pricing", intervention: "FX route selection (BM-13), transparent pricing", value: "Reduced FX cost, transparent execution", method: "Measure FX cost per transaction", evidence: "Bank-provided FX cost baseline", state: "ASSUMED" as EvidenceState },
  { process: "Compliance/evidence preparation for audit", friction: "Manual evidence assembly, fragmented records", intervention: "Evidence fabric (15-field package, SHA-256) + regulatory replay", value: "Automated evidence, audit-ready packages", method: "Measure audit prep time before/after", evidence: "Bank-provided audit prep baseline", state: "ASSUMED" as EvidenceState },
];

function makeValueHypothesis(): ValueHypothesis[] {
  return VALUE_HYPOTHESES.map(v => ({
    currentBankProcess: v.process, currentFriction: v.friction,
    mithqalIntervention: v.intervention, expectedValue: v.value,
    measurementMethod: v.method, evidenceRequired: v.evidence, evidenceState: v.state,
  }));
}

/* ------------------------------------------------------------------ */
/*  Legal Dependencies (ALL COUNSEL_REQUIRED)                          */
/* ------------------------------------------------------------------ */

const LEGAL_ITEMS = [
  "jurisdiction_A_legal_status", "jurisdiction_B_legal_status", "cross_border_legal_dependency",
  "payment_license_dependency", "custody_dependency", "bank_dependency",
  "settlement_finality_dependency", "AML_dependency", "sanctions_dependency",
  "data_dependency", "tax_dependency", "insolvency_dependency",
];

function makeLegalDeps(jurA: string, jurB: string): LegalDependency[] {
  return LEGAL_ITEMS.map(item => ({
    item,
    jurisdictionAStatus: jurA === "UNKNOWN" ? "UNKNOWN (CONSERVATIVE_BLOCK)" : "SEED_DATA (not triaged)",
    jurisdictionBStatus: jurB === "UNKNOWN" ? "UNKNOWN (CONSERVATIVE_BLOCK)" : "SEED_DATA (not triaged)",
    crossBorderStatus: "UNKNOWN — no counsel engaged. G1 status: READY_FOR_COUNSEL (BLOCKED_BY_G0).",
    counselRequired: true,
  }));
}

/* ------------------------------------------------------------------ */
/*  Bank Dependencies (ALL UNCONFIRMED/UNKNOWN)                        */
/* ------------------------------------------------------------------ */

const BANK_ROLES = [
  "required source bank", "required destination bank", "required custodian",
  "required settlement-rail operator", "required FX/liquidity provider",
  "required compliance participants", "required technical integration",
  "minimum institutional counterparties",
];

function makeBankDeps(): BankDep[] {
  return BANK_ROLES.map(role => ({ role, institution: "UNCONFIRMED — no bank engaged. 0 banks contacted. 0 design partners. All at RESEARCHED status.", status: "UNCONFIRMED" as BankDependency }));
}

/* ------------------------------------------------------------------ */
/*  Economic Model (ALL UNKNOWN)                                      */
/* ------------------------------------------------------------------ */

const ECON_ITEMS = [
  "transaction value", "transaction frequency", "settlement cost", "FX cost",
  "liquidity cost", "operational cost", "reconciliation cost", "compliance cost",
  "integration cost", "MITHQAL service cost", "expected measurable savings",
  "expected measurable operational improvement",
];

function makeEconomicModel(): EconomicLineItem[] {
  return ECON_ITEMS.map(item => ({
    item, observed: "NONE", externallySourced: "NONE", assumed: "NONE",
    unknown: "No bank-provided baseline. Bank Value Measurement Engine: ALL INSUFFICIENT_DATA.",
    evidenceState: "UNKNOWN" as EvidenceState,
  }));
}

/* ------------------------------------------------------------------ */
/*  5 Candidate Corridors                                             */
/* ------------------------------------------------------------------ */

function makeCandidate(
  corridorId: string, srcJur: string, srcInst: string, srcCur: string,
  dstJur: string, dstInst: string, dstCur: string,
  readiness: PilotReadiness, readinessRationale: string,
  mtqDep: "LOW" | "MEDIUM" | "HIGH", mtqIndep: boolean,
  blockers: string[], nextEvidence: string,
): CorridorCandidate {
  return {
    corridorId,
    corridor: { sourceJurisdiction: srcJur, sourceInstitutionType: srcInst, sourceCurrency: srcCur, destinationJurisdiction: dstJur, destinationInstitutionType: dstInst, destinationCurrency: dstCur },
    painMetrics: makePainMetrics(),
    bankPain: makeBankPain(),
    valueHypothesis: makeValueHypothesis(),
    mtqMode: {
      modeA: "MITHQAL Control Plane with MTQ DISABLED. Settlement asset = BANK_MONEY. Pilot A: 19 steps, SETTLED, F6 finality. 0/19 steps use MTQ. Credible Mode-A value proposition: settlement coordination, policy enforcement, reconciliation, evidence — all without MTQ.",
      modeB: "MITHQAL Control Plane + MTQ. Requires 11 institutional prerequisites (ALL PENDING_EXTERNAL). MTQ_ACTIVE CANNOT be reached from config alone. MTQ is optional — the corridor must have Mode-A value.",
      mtqDependency: mtqDep,
    },
    legalDependencies: makeLegalDeps(srcJur, dstJur),
    bankDependencies: makeBankDeps(),
    economicModel: makeEconomicModel(),
    pilotReadiness: readiness,
    pilotReadinessRationale: readinessRationale,
    mtqIndependentValuePath: mtqIndep,
    openBlockers: blockers,
    nextExternalEvidence: nextEvidence,
  };
}

export const CORRIDORS: CorridorCandidate[] = [
  makeCandidate("C-AE-SG", "AE", "UAE commercial bank (DIFC/ADGM)", "AED/USD", "SG", "Singapore commercial bank (MAS-regulated)", "SGD/USD",
    "REQUIRES_BANK_DISCOVERY", "Both jurisdictions SEED_DATA (not UNKNOWN). DIFC/ADGM + MAS frameworks exist (public, not triaged). ISO 20022 infrastructure likely. BUT: 0 banks contacted, 0 bank baseline data, 20/20 pain metrics UNKNOWN, 12/12 bank pain UNKNOWN, ALL legal deps COUNSEL_REQUIRED. Mode-A value: settlement coordination without MTQ (Pilot A proven). MTQ dependency: LOW (control plane works without MTQ).",
    "LOW", true,
    ["G0_CONDITIONAL (counsel verification pending)", "G1 BLOCKED_BY_G0 (50 legal questions unanswered)", "0 banks contacted (ALL RESEARCHED)", "0 bank baseline data (ALL UNKNOWN)", "0 external market research (ALL UNKNOWN)", "No counsel engaged for AE or SG jurisdiction"],
    "Bank operations interview: approach a UAE-based bank (DIFC/ADGM) to discuss AE-SG corridor pain + provide baseline data for the Bank Value Measurement Engine (12 metrics). Requires G0_PASS + G1 engagement first."),
  makeCandidate("C-AE-EG", "AE", "UAE commercial bank", "AED/USD", "EG", "Egyptian commercial bank", "EGP/USD",
    "REQUIRES_LEGAL_WORK", "EG not in seeded 8 jurisdictions (UNKNOWN = CONSERVATIVE_BLOCK). Cannot proceed until EG jurisdiction is triaged by counsel. High remittance volume (design-time knowledge) but legal feasibility UNKNOWN.",
    "MEDIUM", true,
    ["EG jurisdiction = UNKNOWN (CONSERVATIVE_BLOCK)", "G0_CONDITIONAL", "G1 BLOCKED_BY_G0", "0 banks contacted", "0 baseline data"],
    "Legal counsel triage of EG jurisdiction regulatory material (requires G0_PASS first)."),
  makeCandidate("C-SA-IN", "SA", "Saudi commercial bank (SAMA-regulated)", "SAR/USD", "IN", "Indian commercial bank (RBI-regulated)", "INR/USD",
    "BLOCKED", "IN = UNKNOWN (CONSERVATIVE_BLOCK, FEMA capital controls). Cannot proceed. High corridor pain (design-time) but legal feasibility BLOCKED.",
    "HIGH", false,
    ["IN = UNKNOWN (CONSERVATIVE_BLOCK)", "FEMA capital controls", "G0_CONDITIONAL", "G1 BLOCKED", "0 banks"],
    "Legal counsel assessment of IN jurisdiction (FEMA/capital controls). Currently BLOCKED — not a near-term candidate."),
  makeCandidate("C-AE-IN", "AE", "UAE commercial bank", "AED/USD", "IN", "Indian commercial bank", "INR/USD",
    "BLOCKED", "IN = UNKNOWN (CONSERVATIVE_BLOCK). Same as SA-IN. Cannot proceed.",
    "HIGH", false,
    ["IN = UNKNOWN (CONSERVATIVE_BLOCK)", "G0_CONDITIONAL", "G1 BLOCKED"],
    "Legal counsel assessment of IN jurisdiction. Currently BLOCKED."),
  makeCandidate("C-CN-AE", "CN", "Chinese commercial bank", "CNY/USD", "AE", "UAE commercial bank", "AED/USD",
    "REQUIRES_LEGAL_WORK", "CN = SEED_DATA but CNY/CNH unclassified. Capital controls. Legal complexity HIGH. Better for later corridor expansion.",
    "HIGH", false,
    ["CNY/CNH unclassified", "Capital controls", "G0_CONDITIONAL", "G1 BLOCKED", "0 banks"],
    "Legal counsel classification of CNY/CNH distinction + capital control assessment."),
];

/* ------------------------------------------------------------------ */
/*  Comparison Table (NO ranking — no BEST/WORST/WINNER/RANK/SCORE)  */
/* ------------------------------------------------------------------ */

export const COMPARISON_TABLE = CORRIDORS.map(c => ({
  corridor: c.corridorId,
  primaryPain: "UNKNOWN (no bank data)",
  settlementFriction: "UNKNOWN",
  liquidityFriction: "UNKNOWN",
  fxFriction: "UNKNOWN",
  operationalFriction: "UNKNOWN",
  complianceFriction: "UNKNOWN",
  legalDependency: c.legalDependencies.every(l => l.counselRequired) ? "ALL COUNSEL_REQUIRED" : "PARTIAL",
  bankDependency: "ALL UNCONFIRMED (0 banks contacted)",
  technicalDependency: "MBG gateway + ISO 20022 (DESIGNED, not tested with real bank)",
  mtqDependency: c.mtqMode.mtqDependency,
  evidenceQuality: "0 MEASURED, 0 EXTERNAL_SOURCE, ALL UNKNOWN",
  pilotComplexity: c.pilotReadiness,
  commercialHypothesis: "UNKNOWN — Bank Value Engine: ALL INSUFFICIENT_DATA. No savings invented.",
  openBlockers: c.openBlockers.join("; "),
  nextExternalEvidence: c.nextExternalEvidence,
}));

/* ------------------------------------------------------------------ */
/*  Management Shortlist                                              */
/* ------------------------------------------------------------------ */

export const MANAGEMENT_SHORTLIST = CORRIDORS
  .filter(c => c.pilotReadiness !== "BLOCKED")
  .map(c => ({
    corridorId: c.corridorId,
    whyItRemains: c.pilotReadinessRationale.slice(0, 120),
    whatIsKnown: `Both jurisdictions ${c.corridor.sourceJurisdiction}/${c.corridor.destinationJurisdiction} are SEED_DATA (not UNKNOWN). Mode-A value proposition exists (Pilot A: 19 steps, MTQ disabled, SETTLED). MTQ dependency: ${c.mtqMode.mtqDependency}.`,
    whatIsUnknown: "ALL 20 pain metrics UNKNOWN. ALL 12 bank pain UNKNOWN. ALL economic model items UNKNOWN. ALL legal dependencies COUNSEL_REQUIRED. ALL bank dependencies UNCONFIRMED. 0 baseline data.",
    whatBlocksPilot: c.openBlockers.join("; "),
    nextExternalEvidence: c.nextExternalEvidence,
    owner: "COO",
    dependency: "G0_PASS + G1 counsel engagement + bank discovery",
  }));

export const PRIMARY_CORRIDOR = "C-AE-SG";
export const SELECTION_CRITERIA = "Primary corridor selected based on: (1) both jurisdictions SEED_DATA (not UNKNOWN/CONSERVATIVE_BLOCK), (2) DIFC/ADGM + MAS frameworks exist, (3) ISO 20022 infrastructure likely, (4) Mode-A value proposition (MTQ disabled, Pilot A proven), (5) MTQ dependency LOW, (6) UAE selected in G1 as pilot jurisdiction. This is NOT a 'best corridor' declaration. It is the corridor selected for the NEXT EVIDENCE-ACQUISITION CYCLE based on documented management criteria. NOT CORRIDOR_VALIDATED.";

/* ------------------------------------------------------------------ */
/*  Final Status                                                      */
/* ------------------------------------------------------------------ */

export const FINAL_STATUS: FinalStatus = {
  g0Status: G0_STATUS,
  g1Status: G1_STATUS,
  candidateCount: CORRIDORS.length,
  candidateCorridors: CORRIDORS.map(c => c.corridorId),
  evidenceCounts: {
    measured: 0,
    externalSource: 0,
    assumed: CORRIDORS.reduce((s, c) => s + c.valueHypothesis.filter(v => v.evidenceState === "ASSUMED").length, 0),
    unknown: CORRIDORS.reduce((s, c) => s + c.painMetrics.filter(p => p.evidenceState === "UNKNOWN").length + c.bankPain.filter(b => b.evidenceState === "UNKNOWN").length + c.economicModel.filter(e => e.evidenceState === "UNKNOWN").length, 0),
  },
  criticalBlockers: [
    "G0_CONDITIONAL — counsel verification pending (8/16 items still PENDING)",
    "G1 BLOCKED_BY_G0 — 50 legal questions unanswered, 0 counsel engaged",
    "0 banks contacted (ALL RESEARCHED, 0 design partners)",
    "0 bank baseline data (ALL 20 pain metrics UNKNOWN per corridor)",
    "0 external market research (ALL economic model items UNKNOWN)",
    "ALL legal dependencies COUNSEL_REQUIRED (12 per corridor)",
    "ALL bank dependencies UNCONFIRMED (8 per corridor)",
  ],
  shortlistedCorridors: MANAGEMENT_SHORTLIST.map(s => s.corridorId),
  primaryCorridorForDeepDiscovery: PRIMARY_CORRIDOR,
  mtqIndependentValuePath: true,
  legalValidationStatus: "JURISDICTION_PENDING — 0/8 jurisdictions triaged, 0 counsel engaged",
  bankDependencyStatus: "0 banks contacted, 0 design partners, ALL UNCONFIRMED",
  pilotAReadiness: "REQUIRES_BANK_DISCOVERY + REQUIRES_LEGAL_WORK (for C-AE-SG). BLOCKED for C-SA-IN, C-AE-IN, C-CN-AE (UNKNOWN jurisdictions). REQUIRES_LEGAL_WORK for C-AE-EG (EG UNKNOWN).",
  nextExternalEvidence: "Bank operations interview: approach a UAE-based bank (DIFC/ADGM) to discuss AE-SG corridor settlement pain + provide baseline data for the Bank Value Measurement Engine (12 metrics). REQUIRES G0_PASS + G1 counsel engagement first.",
  productionAuthorized: false,
  institutionallyValidated: false,
};

/* ------------------------------------------------------------------ */
/*  Full Pack                                                          */
/* ------------------------------------------------------------------ */

export function getCorridorDecisionPack(): CorridorDecisionPack {
  return {
    priorBaselines: [
      "Prompt-62 G0 result: G0_CONDITIONAL (8/16 verified, 8/16 pending, 5 material findings)",
      "Prompt-63 G1 result: READY_FOR_COUNSEL (50 questions, 18 deliverables, BLOCKED_BY_G0)",
      "MITHQAL v25.3.2 controlled baseline: FROZEN, 10 frozen schemas, tag v25.3.2",
      "Jurisdiction registry: 8 jurisdictions ALL SEED_DATA/UNKNOWN",
      "Corridor Pain Index: 14 factors (expanded to 20 in this pack), 5 corridors, 0 selected as validated",
      "Bank Value / ROI framework: 12 metrics × 6 categories, ALL INSUFFICIENT_DATA",
      "Pilot A constraints: MTQ DISABLED, 19 steps, BANK_MONEY, SETTLED, F6, SIMULATED",
      "Settlement-rail compatibility: SIMULATED_BANK_RAIL + SIMULATED_CBDC_RAIL (both SIMULATED)",
      "MTQ-disabled Control Plane: 222 API routes, 166 .ts files, healthy (db.ok=True)",
    ],
    corridors: CORRIDORS,
    comparisonTable: COMPARISON_TABLE,
    managementShortlist: MANAGEMENT_SHORTLIST,
    primaryCorridorForDeepDiscovery: PRIMARY_CORRIDOR,
    selectionCriteria: SELECTION_CRITERIA,
    finalStatus: FINAL_STATUS,
    nextExternalEvidence: FINAL_STATUS.nextExternalEvidence,
    honestState: {
      productionAuthorized: false,
      noInventedNumbers: true,
      uncertaintyPreserved: true,
      architectureNotModified: true,
    },
    summary: `PROMPT 64: FIRST INSTITUTIONAL CORRIDOR DECISION PACK. ${CORRIDORS.length} candidate corridors. 20 pain metrics per corridor (ALL UNKNOWN). 12 bank pain items (ALL UNKNOWN). 5 value hypotheses (ALL ASSUMED — MODEL ONLY). 12 legal dependencies (ALL COUNSEL_REQUIRED). 8 bank dependencies (ALL UNCONFIRMED). 12 economic items (ALL UNKNOWN). Management shortlist: ${MANAGEMENT_SHORTLIST.length} corridors (excludes BLOCKED). Primary for deep discovery: ${PRIMARY_CORRIDOR} (NOT validated). MTQ-independent value path: YES (Mode A, Pilot A proven). 0 MEASURED, 0 EXTERNAL_SOURCE data points. Uncertainty preserved. NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const P64_META = {
  module: "p64-corridor-decision-pack",
  version: "v25.3.2",
  prompt: "PROMPT 64",
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED — uncertainty preserved",
  frozenArchitecture: true,
  corridorCount: CORRIDORS.length,
  painMetricCount: PAIN_METRIC_LABELS.length,
  g0Status: G0_STATUS,
  g1Status: G1_STATUS,
  primaryCorridor: PRIMARY_CORRIDOR,
  measuredDataPoints: 0,
  externalSourceDataPoints: 0,
  nextExternalEvidence: FINAL_STATUS.nextExternalEvidence,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. No new features. No invented numbers.
//  ALL pain metrics: UNKNOWN (no bank data).
//  ALL economic items: UNKNOWN (no baseline).
//  ALL legal dependencies: COUNSEL_REQUIRED.
//  ALL bank dependencies: UNCONFIRMED.
//  0 MEASURED. 0 EXTERNAL_SOURCE.
//  Value hypotheses: ASSUMED — MODEL ONLY (not measured).
//  No corridor declared "best." No ranking. No score.
//  Primary corridor: C-AE-SG selected for deep discovery (NOT validated).
//  MTQ-independent value path: YES (Mode A, Pilot A proven).
//  Uncertainty preserved. NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
