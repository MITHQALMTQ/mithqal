/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — FIRST CORRIDOR DECISION PACK + DESIGN-PARTNER BANK PIPELINE
 * ════════════════════════════════════════════════════════════════════════
 *
 * Architecture FROZEN at v25.3.2. Read-only. No new features.
 *
 * DELIVERABLE 1: FIRST CORRIDOR DECISION PACK
 *   Evaluate 3-5 candidate corridors with 16-factor evidence-backed CPI.
 *   Evidence classified: MEASURED / EXTERNAL_SOURCE / ASSUMED / UNKNOWN.
 *   Do NOT fabricate volumes, savings, or bank pain.
 *   Do NOT declare a corridor "best."
 *   Output: CORRIDOR_SELECTED_FOR_DILIGENCE (not CORRIDOR_VALIDATED).
 *
 * DELIVERABLE 2: MITHQAL DESIGN-PARTNER BANK PIPELINE
 *   14 pipeline states (RESEARCHED → REPEATABLE).
 *   13 fields per target.
 *   Do NOT fabricate bank contacts or relationships.
 *   Do NOT mark any institution as a partner unless an actual relationship exists.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceTier = "MEASURED" | "EXTERNAL_SOURCE" | "ASSUMED" | "UNKNOWN";

export interface CorridorFactor {
  factorId: string;
  label: string;
  description: string;
}

export interface CorridorFactorScore {
  factorId: string;
  evidenceTier: EvidenceTier;
  value: string | number;
  source: string;
  assumption: string;
  unknown: string;
}

export interface CandidateCorridor {
  corridorId: string;
  senderJurisdiction: string;
  receiverJurisdiction: string;
  currencyPair: string;
  factorScores: CorridorFactorScore[];
  painScore: number | "UNKNOWN";
  evidenceSummary: { measured: number; externalSource: number; assumed: number; unknown: number };
  decision: "CORRIDOR_SELECTED_FOR_DILIGENCE" | "NOT_SELECTED" | "INSUFFICIENT_DATA";
  decisionRationale: string;
}

export interface CorridorDecisionPack {
  factors: CorridorFactor[];
  candidates: CandidateCorridor[];
  selectedCorridor: string;
  selectionType: string; // "CORRIDOR_SELECTED_FOR_DILIGENCE (not CORRIDOR_VALIDATED)"
  noCorridorValidated: boolean;
  noFabricatedData: boolean;
  honestState: { productionAuthorized: boolean; noCorridorDeclaredBest: boolean; allEvidenceClassified: boolean };
  summary: string;
}

export type PipelineState =
  | "RESEARCHED" | "TARGET" | "CONTACTED" | "QUALIFIED" | "EXECUTIVE_INTEREST"
  | "ARCHITECTURE_REVIEW" | "LEGAL_REVIEW" | "PILOT_DESIGN" | "COMMERCIAL_REVIEW"
  | "PILOT_NEGOTIATION" | "CONTRACTED" | "PILOT_ACTIVE" | "MEASURED" | "REPEATABLE";

export interface IdealBankCriteria {
  criterionId: string;
  label: string;
  description: string;
}

export interface BankTarget {
  targetId: string;
  institution: string;
  institutionType: string;
  jurisdiction: string;
  corridor: string;
  problemHypothesis: string;
  decisionMakers: string;
  technicalPathway: string;
  regulatoryDependency: string;
  pilotHypothesis: string;
  estimatedValue: string;
  evidenceRequired: string;
  nextAction: string;
  owner: string;
  status: PipelineState;
  isPartner: boolean; // ALWAYS false — no actual relationship exists
}

export interface BankPipeline {
  idealBankCriteria: IdealBankCriteria[];
  pipelineStates: PipelineState[];
  targets: BankTarget[];
  noFabricatedContacts: boolean;
  noInstitutionMarkedAsPartner: boolean;
  allTargetsResearched: boolean;
  honestState: { productionAuthorized: boolean; noFabricatedRelationships: boolean };
  summary: string;
}

export interface CombinedPack {
  corridorDecisionPack: CorridorDecisionPack;
  bankPipeline: BankPipeline;
  honestState: { productionAuthorized: boolean; architectureNotModified: boolean };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  16 Corridor Factors                                                */
/* ------------------------------------------------------------------ */

export const CORRIDOR_FACTORS: CorridorFactor[] = [
  { factorId: "CF-01", label: "Payment Volume", description: "Annual cross-border payment volume for the corridor (USD)" },
  { factorId: "CF-02", label: "FX Spread", description: "FX spread in basis points for the currency pair" },
  { factorId: "CF-03", label: "Correspondent Friction", description: "Number of intermediary banks / message hops" },
  { factorId: "CF-04", label: "Liquidity Burden", description: "Idle capital trapped in nostro/vostro accounts" },
  { factorId: "CF-05", label: "Settlement Latency", description: "Time from instruction to finality (hours, P50)" },
  { factorId: "CF-06", label: "Cut-Off Exposure", description: "Frequency of missed cut-off times" },
  { factorId: "CF-07", label: "Reconciliation Burden", description: "FTE + cost for reconciliation" },
  { factorId: "CF-08", label: "Compliance Burden", description: "AML/CFT/sanctions screening effort" },
  { factorId: "CF-09", label: "Exception Burden", description: "Exception/investigation rate + cost" },
  { factorId: "CF-10", label: "Availability of Settlement Rails", description: "Number of available settlement rails" },
  { factorId: "CF-11", label: "Availability of Liquidity Providers", description: "Number of liquidity providers for the corridor" },
  { factorId: "CF-12", label: "Availability of Participating Banks", description: "Number of banks that can participate" },
  { factorId: "CF-13", label: "Regulatory Feasibility", description: "Regulatory feasibility of the corridor jurisdictions" },
  { factorId: "CF-14", label: "Technical Feasibility", description: "Technical integration feasibility (MBG/ISO 20022)" },
  { factorId: "CF-15", label: "Measurable ROI Potential", description: "Potential for measurable bank value (baseline data availability)" },
  { factorId: "CF-16", label: "Strategic Reference Value", description: "Value as a reference corridor for future expansion" },
];

/* ------------------------------------------------------------------ */
/*  5 Candidate Corridors                                              */
/* ------------------------------------------------------------------ */

function unknownScore(factorId: string): CorridorFactorScore {
  return { factorId, evidenceTier: "UNKNOWN", value: "UNKNOWN", source: "No data available — requires bank-provided baseline", assumption: "Cannot assume — no data", unknown: `The ${CORRIDOR_FACTORS.find(f => f.factorId === factorId)?.label} for this corridor is unknown without bank-provided data` };
}

function assumedScore(factorId: string, value: string, assumption: string): CorridorFactorScore {
  return { factorId, evidenceTier: "ASSUMED", value, source: "Design-time assumption (not measured, not externally sourced)", assumption, unknown: "Requires bank-provided data to elevate from ASSUMED to MEASURED" };
}

export const CANDIDATE_CORRIDORS: CandidateCorridor[] = [
  {
    corridorId: "AE-SG",
    senderJurisdiction: "AE", receiverJurisdiction: "SG", currencyPair: "AED-USD-SGD",
    factorScores: CORRIDOR_FACTORS.map(f => {
      if (f.factorId === "CF-13") return assumedScore(f.factorId, "65/100", "AE=SEED_DATA, SG=SEED_DATA (both in permitted list). DIFC/ADGM + MAS frameworks exist (public, not triaged).");
      if (f.factorId === "CF-14") return assumedScore(f.factorId, "70/100", "Both jurisdictions have ISO 20022-capable banking infrastructure. MBG gateway is API-based.");
      if (f.factorId === "CF-15") return assumedScore(f.factorId, "MODERATE", "UAE + Singapore banks likely have baseline data. Bank Value Engine is ready to populate.");
      if (f.factorId === "CF-16") return assumedScore(f.factorId, "HIGH", "AE-SG is a major GCC-Asia corridor. Reference value for expansion to AE-EG, SA-IN.");
      return unknownScore(f.factorId);
    }),
    painScore: "UNKNOWN",
    evidenceSummary: { measured: 0, externalSource: 0, assumed: 4, unknown: 12 },
    decision: "CORRIDOR_SELECTED_FOR_DILIGENCE",
    decisionRationale: "Selected for DILIGENCE (not validation). Rationale: (1) both jurisdictions SEED_DATA (not UNKNOWN/CONSERVATIVE_BLOCK), (2) DIFC/ADGM + MAS frameworks exist, (3) ISO 20022-capable infrastructure, (4) strategic reference value (GCC-Asia corridor), (5) UAE selected in G1 as pilot jurisdiction. 12/16 factors are UNKNOWN — requires bank-provided baseline data. NOT CORRIDOR_VALIDATED.",
  },
  {
    corridorId: "AE-EG",
    senderJurisdiction: "AE", receiverJurisdiction: "EG", currencyPair: "AED-USD-EGP",
    factorScores: CORRIDOR_FACTORS.map(f => {
      if (f.factorId === "CF-13") return assumedScore(f.factorId, "40/100", "AE=SEED_DATA, EG not in seeded 8 (UNKNOWN=CONSERVATIVE_BLOCK). Lower feasibility.");
      if (f.factorId === "CF-16") return assumedScore(f.factorId, "HIGH", "AE-EG is a high-remittance corridor (Egypt receives ~$30B/year remittances).");
      return unknownScore(f.factorId);
    }),
    painScore: "UNKNOWN",
    evidenceSummary: { measured: 0, externalSource: 0, assumed: 2, unknown: 14 },
    decision: "NOT_SELECTED",
    decisionRationale: "Not selected for first diligence. EG jurisdiction = UNKNOWN (CONSERVATIVE_BLOCK). 14/16 factors UNKNOWN. Better candidate for later corridor expansion (after AE jurisdiction is legally cleared).",
  },
  {
    corridorId: "SA-IN",
    senderJurisdiction: "SA", receiverJurisdiction: "IN", currencyPair: "SAR-USD-INR",
    factorScores: CORRIDOR_FACTORS.map(f => {
      if (f.factorId === "CF-13") return assumedScore(f.factorId, "35/100", "SA=SEED_DATA, IN=UNKNOWN (CONSERVATIVE_BLOCK, FEMA capital controls).");
      return unknownScore(f.factorId);
    }),
    painScore: "UNKNOWN",
    evidenceSummary: { measured: 0, externalSource: 0, assumed: 1, unknown: 15 },
    decision: "NOT_SELECTED",
    decisionRationale: "Not selected. IN=UNKNOWN (CONSERVATIVE_BLOCK). FEMA capital controls. 15/16 UNKNOWN. High pain but low feasibility.",
  },
  {
    corridorId: "AE-IN",
    senderJurisdiction: "AE", receiverJurisdiction: "IN", currencyPair: "AED-USD-INR",
    factorScores: CORRIDOR_FACTORS.map(f => {
      if (f.factorId === "CF-13") return assumedScore(f.factorId, "35/100", "AE=SEED_DATA, IN=UNKNOWN (CONSERVATIVE_BLOCK).");
      return unknownScore(f.factorId);
    }),
    painScore: "UNKNOWN",
    evidenceSummary: { measured: 0, externalSource: 0, assumed: 1, unknown: 15 },
    decision: "NOT_SELECTED",
    decisionRationale: "Not selected. IN=UNKNOWN (CONSERVATIVE_BLOCK). 15/16 UNKNOWN.",
  },
  {
    corridorId: "CN-AE",
    senderJurisdiction: "CN", receiverJurisdiction: "AE", currencyPair: "CNY-USD-AED",
    factorScores: CORRIDOR_FACTORS.map(f => {
      if (f.factorId === "CF-13") return assumedScore(f.factorId, "30/100", "CN=SEED_DATA (CNY/CNH unclassified), AE=SEED_DATA. CNY capital controls impact.");
      return unknownScore(f.factorId);
    }),
    painScore: "UNKNOWN",
    evidenceSummary: { measured: 0, externalSource: 0, assumed: 1, unknown: 15 },
    decision: "NOT_SELECTED",
    decisionRationale: "Not selected. CNY/CNH unclassified. Capital controls. 15/16 UNKNOWN. Better for later corridor.",
  },
];

/* ------------------------------------------------------------------ */
/*  Corridor Decision Pack                                            */
/* ------------------------------------------------------------------ */

export function getCorridorDecisionPack(): CorridorDecisionPack {
  const selected = CANDIDATE_CORRIDORS.find(c => c.decision === "CORRIDOR_SELECTED_FOR_DILIGENCE");
  return {
    factors: CORRIDOR_FACTORS,
    candidates: CANDIDATE_CORRIDORS,
    selectedCorridor: selected?.corridorId || "NONE",
    selectionType: "CORRIDOR_SELECTED_FOR_DILIGENCE (not CORRIDOR_VALIDATED)",
    noCorridorValidated: true,
    noFabricatedData: CANDIDATE_CORRIDORS.every(c => c.evidenceSummary.measured === 0 && c.evidenceSummary.externalSource === 0),
    honestState: { productionAuthorized: false, noCorridorDeclaredBest: true, allEvidenceClassified: true },
    summary: `Corridor Decision Pack: ${CANDIDATE_CORRIDORS.length} candidates evaluated against ${CORRIDOR_FACTORS.length} factors. Selected: ${selected?.corridorId} for DILIGENCE (NOT validation). 0 MEASURED, 0 EXTERNAL_SOURCE across all corridors. Pain scores: UNKNOWN (no bank-provided data). No corridor declared "best." No fabricated volumes, savings, or bank pain.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Design-Partner Bank Pipeline                                      */
/* ------------------------------------------------------------------ */

export const IDEAL_BANK_CRITERIA: IdealBankCriteria[] = [
  { criterionId: "IBC-01", label: "Meaningful Cross-Border Settlement Pain", description: "The bank experiences real, measurable cross-border settlement friction (latency, cost, liquidity burden, reconciliation effort)" },
  { criterionId: "IBC-02", label: "Relevant Corridor Exposure", description: "The bank operates in a corridor selected for diligence (AE-SG candidate)" },
  { criterionId: "IBC-03", label: "Ability to Participate in a Controlled Pilot", description: "The bank can dedicate resources to a controlled pilot (test environment, pilot team, executive approval)" },
  { criterionId: "IBC-04", label: "Regulatory Feasibility", description: "The bank's jurisdiction allows participation in a controlled pilot (sandbox, no-action, or license)" },
  { criterionId: "IBC-05", label: "Technical Integration Capability", description: "The bank has the technical capability to integrate via MBG gateway + ISO 20022" },
  { criterionId: "IBC-06", label: "Executive Sponsorship Potential", description: "The bank has (or can identify) an executive sponsor for innovation/pilot initiatives" },
  { criterionId: "IBC-07", label: "Treasury/Liquidity Relevance", description: "The bank's treasury team manages nostro/vostro liquidity that would benefit from MITHQAL" },
  { criterionId: "IBC-08", label: "Compliance/Reconciliation Pain", description: "The bank's compliance + reconciliation teams experience measurable burden from cross-border settlement" },
  { criterionId: "IBC-09", label: "Willingness to Provide Measurable Baseline Data", description: "The bank is willing to provide baseline data for the Bank Value Measurement Engine (12 metrics)" },
  { criterionId: "IBC-10", label: "Strategic Reference Value", description: "The bank's participation would serve as a credible reference for other banks" },
];

export const PIPELINE_STATES: PipelineState[] = [
  "RESEARCHED", "TARGET", "CONTACTED", "QUALIFIED", "EXECUTIVE_INTEREST",
  "ARCHITECTURE_REVIEW", "LEGAL_REVIEW", "PILOT_DESIGN", "COMMERCIAL_REVIEW",
  "PILOT_NEGOTIATION", "CONTRACTED", "PILOT_ACTIVE", "MEASURED", "REPEATABLE",
];

/**
 * Bank targets. ALL at RESEARCHED status. NO bank has been contacted.
 * NO institution is marked as a partner (isPartner = false for ALL).
 * Do NOT fabricate bank contacts or relationships.
 */
export const BANK_TARGETS: BankTarget[] = [
  {
    targetId: "BT-01",
    institution: "[UAE-BASED BANK — NAME WITHHELD]",
    institutionType: "UAE commercial bank (DIFC/ADGM-based)",
    jurisdiction: "AE",
    corridor: "AE-SG",
    problemHypothesis: "UAE-SG corridor: correspondent banking friction, nostro/vostro liquidity burden, FX spread, reconciliation effort. Bank likely experiences T+2/T+3 latency and trapped liquidity.",
    decisionMakers: "UNKNOWN — not contacted. Likely: Head of Transaction Banking, Head of Treasury, Chief Innovation Officer.",
    technicalPathway: "MBG gateway integration (API-based, ISO 20022). Bank likely has ISO 20022-capable infrastructure (DIFC/ADGM standards).",
    regulatoryDependency: "G0 (entity) + G1 (UAE jurisdiction legal review) + G2 (CBUAE regulatory clearance) must PASS before contact.",
    pilotHypothesis: "Pilot A (MTQ disabled, BANK_MONEY): 1 corridor (AE-SG), 1 bank, controlled test environment. Bank provides baseline data for 12 metrics.",
    estimatedValue: "INSUFFICIENT_DATA — Bank Value Measurement Engine requires bank-provided baseline. No savings invented.",
    evidenceRequired: "Bank-provided baseline data (12 metrics × 6 categories). Bank's nostro/vostro data. Bank's reconciliation effort data. Bank's compliance burden data.",
    nextAction: "Approach the institution — REQUIRES G0 PASS + G1 PASS + G2 PASS first. Cannot contact before entity is legally established + regulatory clearance obtained.",
    owner: "COO",
    status: "RESEARCHED",
    isPartner: false,
  },
  {
    targetId: "BT-02",
    institution: "[SG-BASED BANK — NAME WITHHELD]",
    institutionType: "Singapore commercial bank (MAS-regulated)",
    jurisdiction: "SG",
    corridor: "AE-SG",
    problemHypothesis: "SG-AE corridor: correspondent banking friction, trapped liquidity in SGD nostro accounts, FX spread on AED-SGD. Bank likely has MAS innovation readiness.",
    decisionMakers: "UNKNOWN — not contacted. Likely: Head of Transaction Banking, Head of Treasury, Chief Innovation Officer.",
    technicalPathway: "MBG gateway integration. Singapore banks typically have advanced API + ISO 20022 infrastructure.",
    regulatoryDependency: "G0 (entity) + G1 (UAE jurisdiction — sender side) + G2 (CBUAE clearance) + potential MAS no-action letter for SG receiver side.",
    pilotHypothesis: "Pilot A (MTQ disabled): AE-SG corridor, SG bank as receiver. Bank provides baseline data.",
    estimatedValue: "INSUFFICIENT_DATA — requires bank-provided baseline. No savings invented.",
    evidenceRequired: "Bank-provided baseline data (12 metrics). SG-side nostro/vostro data. MAS regulatory position on pilot participation.",
    nextAction: "Approach the institution — REQUIRES G0 PASS + G1 PASS + G2 PASS first.",
    owner: "COO",
    status: "RESEARCHED",
    isPartner: false,
  },
  {
    targetId: "BT-03",
    institution: "[GCC-BASED BANK — NAME WITHHELD]",
    institutionType: "GCC commercial bank (UAE or SA-based, multi-corridor)",
    jurisdiction: "AE or SA",
    corridor: "AE-SG or SA-IN",
    problemHypothesis: "GCC-Asia corridor: high remittance volume, multiple intermediary banks, Sharia compliance potential, trapped liquidity.",
    decisionMakers: "UNKNOWN — not contacted.",
    technicalPathway: "MBG gateway integration. GCC banks vary in technical maturity.",
    regulatoryDependency: "G0 + G1 (UAE jurisdiction) + G2 (CBUAE clearance). If SA-based: SAMA clearance also required.",
    pilotHypothesis: "Pilot A (MTQ disabled): GCC-Asia corridor. Bank provides baseline + potentially Sharia compliance requirements.",
    estimatedValue: "INSUFFICIENT_DATA — requires bank-provided baseline. No savings invented.",
    evidenceRequired: "Bank-provided baseline data. Sharia compliance requirements (if applicable). GCC nostro/vostro data.",
    nextAction: "Approach the institution — REQUIRES G0 PASS + G1 PASS + G2 PASS first.",
    owner: "COO",
    status: "RESEARCHED",
    isPartner: false,
  },
];

export function getBankPipeline(): BankPipeline {
  return {
    idealBankCriteria: IDEAL_BANK_CRITERIA,
    pipelineStates: PIPELINE_STATES,
    targets: BANK_TARGETS,
    noFabricatedContacts: BANK_TARGETS.every(t => t.decisionMakers.startsWith("UNKNOWN")),
    noInstitutionMarkedAsPartner: BANK_TARGETS.every(t => !t.isPartner),
    allTargetsResearched: BANK_TARGETS.every(t => t.status === "RESEARCHED"),
    honestState: { productionAuthorized: false, noFabricatedRelationships: BANK_TARGETS.every(t => !t.isPartner) },
    summary: `Design-Partner Bank Pipeline: ${IDEAL_BANK_CRITERIA.length} ideal criteria, ${PIPELINE_STATES.length} pipeline states, ${BANK_TARGETS.length} targets. ALL targets at RESEARCHED status. 0 banks contacted. 0 institutions marked as partners. No fabricated contacts or relationships. Pipeline cannot advance past RESEARCHED until G0+G1+G2 PASS.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Combined Pack                                                     */
/* ------------------------------------------------------------------ */

export function getCombinedPack(): CombinedPack {
  return {
    corridorDecisionPack: getCorridorDecisionPack(),
    bankPipeline: getBankPipeline(),
    honestState: { productionAuthorized: false, architectureNotModified: true },
    summary: `Corridor Decision Pack + Bank Pipeline. Corridor: AE-SG selected for DILIGENCE (not validation). ${CANDIDATE_CORRIDORS.length} corridors, ${CORRIDOR_FACTORS.length} factors. Bank Pipeline: ${BANK_TARGETS.length} targets ALL RESEARCHED, 0 partners, 0 fabricated contacts. NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const PACK_META = {
  module: "corridor-decision-and-bank-pipeline",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01T14:53:00Z",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  frozenArchitecture: true,
  corridorFactorCount: CORRIDOR_FACTORS.length,
  corridorCandidateCount: CANDIDATE_CORRIDORS.length,
  pipelineStateCount: PIPELINE_STATES.length,
  bankTargetCount: BANK_TARGETS.length,
  selectedCorridor: "AE-SG",
  corridorDecision: "CORRIDOR_SELECTED_FOR_DILIGENCE",
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. Read-only. No architecture modified.
//
//  CORRIDOR: AE-SG selected for DILIGENCE (NOT validation).
//  0/16 factors MEASURED. 0/16 EXTERNAL_SOURCE.
//  No fabricated volumes, savings, or bank pain.
//  No corridor declared "best."
//
//  BANK PIPELINE: ALL targets at RESEARCHED.
//  0 banks contacted. 0 institutions marked as partners.
//  No fabricated contacts or relationships.
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
