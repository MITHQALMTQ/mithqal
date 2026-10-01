/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — Corridor Pain Index (Operationalized)
 * ════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 *   Evaluate candidate settlement corridors using 14 measurable factors.
 *   Produce candidate score inputs, evidence, assumptions, unknowns, and
 *   recommended next-investigation corridors.
 *
 *   Do NOT hard-code AED-EGP, SAR-INR, AED-SGD, or ANY other corridor as
 *   predetermined. The corridor is recommended by the score, NOT by
 *   hard-coding.
 *
 *   Do NOT present a corridor as SELECTED until the required external
 *   evidence exists. All scores are SIMULATED (design-time). A corridor
 *   becomes "SELECTED" only when a bank provides real baseline data + an
 *   executed engagement agreement.
 *
 * 14 FACTORS (each with: weight, scoring methodology, data source, evidence status):
 *   1. transaction_volume
 *   2. correspondent_banking_friction
 *   3. nostro_vostro_liquidity_burden
 *   4. fx_spread
 *   5. settlement_latency
 *   6. cut_off_exposure
 *   7. compliance_burden
 *   8. reconciliation_burden
 *   9. failure_recovery_pain
 *   10. regulatory_feasibility
 *   11. available_banking_counterparties
 *   12. available_settlement_rails
 *   13. integration_feasibility
 *   14. evidence_reference_value
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceStatus = "SIMULATED" | "INSUFFICIENT_DATA" | "VALIDATED" | "INSTITUTIONALLY_VERIFIED";

export type FactorId =
  | "TRANSACTION_VOLUME"
  | "CORRESPONDENT_BANKING_FRICTION"
  | "NOSTRO_VOSTRO_LIQUIDITY_BURDEN"
  | "FX_SPREAD"
  | "SETTLEMENT_LATENCY"
  | "CUT_OFF_EXPOSURE"
  | "COMPLIANCE_BURDEN"
  | "RECONCILIATION_BURDEN"
  | "FAILURE_RECOVERY_PAIN"
  | "REGULATORY_FEASIBILITY"
  | "AVAILABLE_BANKING_COUNTERPARTIES"
  | "AVAILABLE_SETTLEMENT_RAILS"
  | "INTEGRATION_FEASIBILITY"
  | "EVIDENCE_REFERENCE_VALUE";

export interface FactorDefinition {
  id: FactorId;
  label: string;
  weight: number;        // 0..1, weights sum to 1.00
  direction: "HIGHER_IS_MORE_PAIN" | "LOWER_IS_MORE_PAIN";
  scoringMethodology: string;
  dataSource: string;
  evidenceStatus: EvidenceStatus;
  unit: string;
}

export interface CorridorFactorScore {
  factorId: FactorId;
  rawValue: number | "INSUFFICIENT_DATA";
  normalizedScore: number | "INSUFFICIENT_DATA";  // 0..100 (higher = more pain)
  evidence: string;
  assumption: string;
  unknown: string;
  evidenceStatus: EvidenceStatus;
}

export interface CandidateCorridor {
  corridorId: string;
  senderJurisdiction: string;
  receiverJurisdiction: string;
  currencyPair: string;
  factorScores: CorridorFactorScore[];
  totalPainScore: number | "INSUFFICIENT_DATA";
  evidence: string[];
  assumptions: string[];
  unknowns: string[];
  recommendation: "INVESTIGATE" | "NOT_RECOMMENDED" | "INSUFFICIENT_DATA";
  recommendationReason: string;
  selected: boolean;           // ALWAYS false — no corridor is selected without external evidence
  evidenceStatus: EvidenceStatus;
}

export interface OperationalizedCPI {
  factors: FactorDefinition[];
  candidateCorridors: CandidateCorridor[];
  recommendedForInvestigation: string[];   // corridor IDs — NOT "selected"
  noCorridorSelected: boolean;              // true — no corridor is selected
  selectionRequiresExternalEvidence: boolean;
  honestState: {
    noHardCodedCorridor: boolean;
    allScoresSimulated: boolean;
    noCorridorSelectedWithoutEvidence: boolean;
    productionAuthorized: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  14 Factor Definitions (weights sum to 1.00)                       */
/* ------------------------------------------------------------------ */

export const FACTOR_DEFINITIONS: FactorDefinition[] = [
  {
    id: "TRANSACTION_VOLUME",
    label: "Transaction Volume",
    weight: 0.10,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher volume = higher absolute cost of friction = higher MITHQAL value. Normalized 0-100 by rank.",
    dataSource: "REQUIRES: bank-provided or SWIFT/BIS reference data. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "USD/year",
  },
  {
    id: "CORRESPONDENT_BANKING_FRICTION",
    label: "Correspondent-Banking Friction",
    weight: 0.08,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "More intermediary banks / message hops = more friction. Count of intermediary banks per corridor.",
    dataSource: "REQUIRES: bank-provided correspondent network map. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "count (intermediary banks)",
  },
  {
    id: "NOSTRO_VOSTRO_LIQUIDITY_BURDEN",
    label: "Nostro/Vostro Liquidity Burden",
    weight: 0.10,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher idle balance in nostro/vostro = more trapped capital. Normalized by volume.",
    dataSource: "REQUIRES: bank-provided nostro/vostro balances. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "USD (idle balance)",
  },
  {
    id: "FX_SPREAD",
    label: "FX Spread",
    weight: 0.08,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher spread bps = more FX cost = higher MITHQAL value. Market reference data.",
    dataSource: "REQUIRES: live FX spread data (Bloomberg/Refinitiv/Messari). Currently SIMULATED.",
    evidenceStatus: "SIMULATED",
    unit: "bps",
  },
  {
    id: "SETTLEMENT_LATENCY",
    label: "Settlement Latency",
    weight: 0.08,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Longer instruction-to-finality time = more pain. Hours, P50.",
    dataSource: "REQUIRES: bank-provided processing time data. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "hours (P50)",
  },
  {
    id: "CUT_OFF_EXPOSURE",
    label: "Cut-Off Exposure",
    weight: 0.06,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "More cut-off times missed = higher exposure. Count of missed cut-offs per quarter.",
    dataSource: "REQUIRES: bank-provided cut-off data. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "count/quarter",
  },
  {
    id: "COMPLIANCE_BURDEN",
    label: "Compliance Burden",
    weight: 0.08,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher AML/CFT/sanctions screening effort = more pain. FTE or cost.",
    dataSource: "REQUIRES: bank-provided compliance effort. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "FTE or USD/year",
  },
  {
    id: "RECONCILIATION_BURDEN",
    label: "Reconciliation Burden",
    weight: 0.08,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher reconciliation effort = more pain. FTE or cost.",
    dataSource: "REQUIRES: bank-provided reconciliation effort. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "FTE or USD/year",
  },
  {
    id: "FAILURE_RECOVERY_PAIN",
    label: "Failure/Recovery Pain",
    weight: 0.07,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher MTTR + cost per incident = more pain.",
    dataSource: "REQUIRES: bank-provided failure data. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "hours + USD/incident",
  },
  {
    id: "REGULATORY_FEASIBILITY",
    label: "Regulatory Feasibility",
    weight: 0.08,
    direction: "LOWER_IS_MORE_PAIN",
    scoringMethodology: "Lower feasibility = more pain (harder to operate). Based on jurisdiction-truth-model.ts.",
    dataSource: "jurisdiction-truth-model.ts: 8 jurisdictions ALL SEED_DATA/UNKNOWN. UNKNOWN = CONSERVATIVE_BLOCK.",
    evidenceStatus: "SIMULATED",
    unit: "score 0-100 (100 = feasible)",
  },
  {
    id: "AVAILABLE_BANKING_COUNTERPARTIES",
    label: "Available Banking Counterparties",
    weight: 0.07,
    direction: "LOWER_IS_MORE_PAIN",
    scoringMethodology: "Fewer counterparties = more pain (harder to route). Count of eligible banks.",
    dataSource: "REQUIRES: bank-provided counterparty list. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "count (eligible banks)",
  },
  {
    id: "AVAILABLE_SETTLEMENT_RAILS",
    label: "Available Settlement Rails",
    weight: 0.06,
    direction: "LOWER_IS_MORE_PAIN",
    scoringMethodology: "Fewer rails = more pain. Count of available rails (SWIFT, RTGS, CBDC, etc.).",
    dataSource: "REQUIRES: bank-provided rail inventory. Currently INSUFFICIENT_DATA.",
    evidenceStatus: "INSUFFICIENT_DATA",
    unit: "count (rails)",
  },
  {
    id: "INTEGRATION_FEASIBILITY",
    label: "Integration Feasibility",
    weight: 0.03,
    direction: "LOWER_IS_MORE_PAIN",
    scoringMethodology: "Lower feasibility = more pain. Based on technical compatibility.",
    dataSource: "SIMULATED: MBG gateway + ISO 20022 support. Design-time estimate.",
    evidenceStatus: "SIMULATED",
    unit: "score 0-100 (100 = easy)",
  },
  {
    id: "EVIDENCE_REFERENCE_VALUE",
    label: "Evidence/Reference Value",
    weight: 0.03,
    direction: "HIGHER_IS_MORE_PAIN",
    scoringMethodology: "Higher reference value = more pain (more to gain from evidence automation).",
    dataSource: "SIMULATED: institutional-evidence-fabric.ts (15-field package). Design-time estimate.",
    evidenceStatus: "SIMULATED",
    unit: "score 0-100",
  },
];

// Verify weights sum to 1.00
export const WEIGHT_SUM = FACTOR_DEFINITIONS.reduce((s, f) => s + f.weight, 0);

/* ------------------------------------------------------------------ */
/*  Candidate Corridors (SIMULATED — no hard-coded selection)          */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";

/**
 * Candidate corridors for evaluation.
 *
 * HONEST STATE:
 *   - These corridors are CANDIDATES for investigation, NOT selections.
 *   - ALL factor scores are SIMULATED or INSUFFICIENT_DATA.
 *   - NO corridor is "selected" — all have `selected: false`.
 *   - The `recommendation` field says "INVESTIGATE" (not "SELECTED").
 *   - A corridor becomes "SELECTED" only when:
 *     (a) A bank provides real baseline data for all 14 factors, AND
 *     (b) An executed engagement agreement exists, AND
 *     (c) External regulatory feasibility evidence is obtained.
 *
 * The corridors below are SIMULATED examples to demonstrate the engine.
 * They are NOT hard-coded selections.
 */
function makeSimulatedCorridor(
  corridorId: string,
  sender: string,
  receiver: string,
  currencyPair: string,
  simulatedScores: Partial<Record<FactorId, { score: number; evidence: string; assumption: string; unknown: string }>>,
): CandidateCorridor {
  const factorScores: CorridorFactorScore[] = FACTOR_DEFINITIONS.map((f) => {
    const sim = simulatedScores[f.id];
    if (sim) {
      return {
        factorId: f.id,
        rawValue: "INSUFFICIENT_DATA",
        normalizedScore: sim.score,
        evidence: sim.evidence,
        assumption: sim.assumption,
        unknown: sim.unknown,
        evidenceStatus: "SIMULATED" as EvidenceStatus,
      };
    }
    return {
      factorId: f.id,
      rawValue: "INSUFFICIENT_DATA",
      normalizedScore: "INSUFFICIENT_DATA",
      evidence: `No data available for ${f.label}. REQUIRES: bank-provided ${f.dataSource}`,
      assumption: `Cannot score — no data. Treated as INSUFFICIENT_DATA (score = 0, NOT 0 pain — unknown).`,
      unknown: `The ${f.label} for this corridor is unknown without bank-provided data.`,
      evidenceStatus: "INSUFFICIENT_DATA" as EvidenceStatus,
    };
  });

  const scoredFactors = factorScores.filter((fs) => typeof fs.normalizedScore === "number");
  const totalWeight = scoredFactors.reduce((s, fs) => {
    const def = FACTOR_DEFINITIONS.find((f) => f.id === fs.factorId)!;
    return s + def.weight;
  }, 0);
  const weightedSum = scoredFactors.reduce((s, fs) => {
    const def = FACTOR_DEFINITIONS.find((f) => f.id === fs.factorId)!;
    return s + (fs.normalizedScore as number) * def.weight;
  }, 0);
  const totalPainScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : "INSUFFICIENT_DATA";

  const evidence = factorScores.filter((fs) => fs.evidenceStatus === "SIMULATED").map((fs) => fs.evidence);
  const assumptions = factorScores.map((fs) => fs.assumption);
  const unknowns = factorScores.filter((fs) => fs.evidenceStatus === "INSUFFICIENT_DATA").map((fs) => fs.unknown);
  const insufficientCount = factorScores.filter((fs) => fs.evidenceStatus === "INSUFFICIENT_DATA").length;

  return {
    corridorId,
    senderJurisdiction: sender,
    receiverJurisdiction: receiver,
    currencyPair,
    factorScores,
    totalPainScore,
    evidence,
    assumptions,
    unknowns,
    recommendation: insufficientCount > 7 ? "INSUFFICIENT_DATA" : "INVESTIGATE",
    recommendationReason:
      insufficientCount > 7
        ? `${insufficientCount}/14 factors have INSUFFICIENT_DATA. Cannot recommend investigation — too many unknowns.`
        : `SIMULATED pain score: ${totalPainScore}/100. Recommended for INVESTIGATION (NOT selection). Selection requires: (a) bank-provided baseline data for all 14 factors, (b) executed engagement agreement, (c) external regulatory feasibility evidence.`,
    selected: false, // ALWAYS false — no corridor is selected without external evidence
    evidenceStatus: "SIMULATED",
  };
}

export const CANDIDATE_CORRIDORS: CandidateCorridor[] = [
  // ── AE → SG (UAE → Singapore) ──────────────────────────────────────
  makeSimulatedCorridor("AE-SG", "AE", "SG", "AED-SGD", {
    FX_SPREAD: { score: 55, evidence: "SIMULATED: open.er-api.com rate (design-time). No live spread.", assumption: "Assumes ~55bps spread (design-time).", unknown: "Real FX spread unknown — requires live Bloomberg/Refinitiv data." },
    REGULATORY_FEASIBILITY: { score: 65, evidence: "jurisdiction-truth-model.ts: AE + SG both SEED_DATA (not UNKNOWN = CONSERVATIVE_BLOCK).", assumption: "Assumes AE+SG are more feasible than UNKNOWN jurisdictions.", unknown: "Real regulatory feasibility unknown — requires regulatory counsel triage." },
    INTEGRATION_FEASIBILITY: { score: 70, evidence: "SIMULATED: MBG gateway + ISO 20022 support.", assumption: "Assumes ISO 20022-compatible bank infrastructure.", unknown: "Real integration feasibility unknown — requires bank technical assessment." },
    EVIDENCE_REFERENCE_VALUE: { score: 60, evidence: "SIMULATED: evidence-fabric.ts 15-field package.", assumption: "Assumes moderate evidence reference value.", unknown: "Real evidence value unknown — requires bank audit assessment." },
  }),
  // ── AE → EG (UAE → Egypt) ──────────────────────────────────────────
  makeSimulatedCorridor("AE-EG", "AE", "EG", "AED-EGP", {
    FX_SPREAD: { score: 75, evidence: "SIMULATED: AED-EGP historically wider spread.", assumption: "Assumes ~75bps spread (design-time).", unknown: "Real FX spread unknown — requires live data." },
    REGULATORY_FEASIBILITY: { score: 50, evidence: "jurisdiction-truth-model.ts: AE=SEED_DATA, EG not in seeded 8 (UNKNOWN = CONSERVATIVE_BLOCK).", assumption: "Assumes EG is less feasible (UNKNOWN).", unknown: "Real EG regulatory status unknown — requires triage." },
    INTEGRATION_FEASIBILITY: { score: 60, evidence: "SIMULATED: MBG gateway support.", assumption: "Assumes moderate integration feasibility.", unknown: "Real integration feasibility unknown." },
    EVIDENCE_REFERENCE_VALUE: { score: 65, evidence: "SIMULATED: evidence-fabric.ts.", assumption: "Assumes moderate-high evidence value.", unknown: "Real evidence value unknown." },
  }),
  // ── SA → IN (Saudi Arabia → India) ──────────────────────────────────
  makeSimulatedCorridor("SA-IN", "SA", "IN", "SAR-INR", {
    FX_SPREAD: { score: 70, evidence: "SIMULATED: SAR-INR wide spread.", assumption: "Assumes ~70bps spread.", unknown: "Real FX spread unknown." },
    REGULATORY_FEASIBILITY: { score: 45, evidence: "jurisdiction-truth-model.ts: SA=SEED_DATA, IN not in seeded 8 (UNKNOWN).", assumption: "Assumes IN is UNKNOWN (CONSERVATIVE_BLOCK).", unknown: "Real IN regulatory status unknown." },
    INTEGRATION_FEASIBILITY: { score: 55, evidence: "SIMULATED.", assumption: "Assumes moderate integration feasibility.", unknown: "Real integration feasibility unknown." },
    EVIDENCE_REFERENCE_VALUE: { score: 60, evidence: "SIMULATED.", assumption: "Assumes moderate evidence value.", unknown: "Real evidence value unknown." },
  }),
  // ── AE → IN (UAE → India) ───────────────────────────────────────────
  makeSimulatedCorridor("AE-IN", "AE", "IN", "AED-INR", {
    FX_SPREAD: { score: 65, evidence: "SIMULATED: AED-INR spread.", assumption: "Assumes ~65bps spread.", unknown: "Real FX spread unknown." },
    REGULATORY_FEASIBILITY: { score: 45, evidence: "jurisdiction-truth-model.ts: AE=SEED_DATA, IN=UNKNOWN.", assumption: "Assumes IN is UNKNOWN.", unknown: "Real IN regulatory status unknown." },
    INTEGRATION_FEASIBILITY: { score: 55, evidence: "SIMULATED.", assumption: "Assumes moderate.", unknown: "Real feasibility unknown." },
    EVIDENCE_REFERENCE_VALUE: { score: 55, evidence: "SIMULATED.", assumption: "Assumes moderate.", unknown: "Real value unknown." },
  }),
  // ── CN → AE (China → UAE) ───────────────────────────────────────────
  makeSimulatedCorridor("CN-AE", "CN", "AE", "CNY-AED", {
    FX_SPREAD: { score: 60, evidence: "SIMULATED: CNY-AED spread.", assumption: "Assumes ~60bps spread.", unknown: "Real FX spread unknown." },
    REGULATORY_FEASIBILITY: { score: 40, evidence: "jurisdiction-truth-model.ts: CN=SEED_DATA (CNY/CNH unclassified), AE=SEED_DATA.", assumption: "Assumes CN is less feasible (CNY/CNH UNKNOWN).", unknown: "Real CN regulatory status unknown — CNY/CNH classification critical." },
    INTEGRATION_FEASIBILITY: { score: 50, evidence: "SIMULATED.", assumption: "Assumes moderate-low (CNY capital controls).", unknown: "Real feasibility unknown — CNY capital controls may impact." },
    EVIDENCE_REFERENCE_VALUE: { score: 50, evidence: "SIMULATED.", assumption: "Assumes moderate.", unknown: "Real value unknown." },
  }),
];

/* ------------------------------------------------------------------ */
/*  Operationalized CPI Output                                         */
/* ------------------------------------------------------------------ */

export function getOperationalizedCPI(): OperationalizedCPI {
  const recommendedForInvestigation = CANDIDATE_CORRIDORS
    .filter((c) => c.recommendation === "INVESTIGATE")
    .sort((a, b) => {
      const aScore = typeof a.totalPainScore === "number" ? a.totalPainScore : 0;
      const bScore = typeof b.totalPainScore === "number" ? b.totalPainScore : 0;
      return bScore - aScore;
    })
    .map((c) => c.corridorId);

  return {
    factors: FACTOR_DEFINITIONS,
    candidateCorridors: CANDIDATE_CORRIDORS,
    recommendedForInvestigation,
    noCorridorSelected: true, // ALWAYS true — no corridor is selected without external evidence
    selectionRequiresExternalEvidence: true,
    honestState: {
      noHardCodedCorridor: CANDIDATE_CORRIDORS.every((c) => !c.selected),
      allScoresSimulated: CANDIDATE_CORRIDORS.every((c) => c.evidenceStatus === "SIMULATED"),
      noCorridorSelectedWithoutEvidence: CANDIDATE_CORRIDORS.every((c) => !c.selected),
      productionAuthorized: false,
    },
    summary:
      `Corridor Pain Index operationalized with ${FACTOR_DEFINITIONS.length} factors (weights sum to ${WEIGHT_SUM.toFixed(2)}). ` +
      `${CANDIDATE_CORRIDORS.length} candidate corridors evaluated. ALL scores are SIMULATED or INSUFFICIENT_DATA. ` +
      `${recommendedForInvestigation.length} corridors recommended for INVESTIGATION (NOT selection). ` +
      `NO corridor is selected. Selection requires: (a) bank-provided baseline data for all ${FACTOR_DEFINITIONS.length} factors, ` +
      `(b) executed engagement agreement, (c) external regulatory feasibility evidence.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Module Metadata                                                   */
/* ------------------------------------------------------------------ */

export const CPI_OPERATIONALIZED_META = {
  module: "corridor-pain-index-operationalized",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  description:
    "Operationalized Corridor Pain Index — 14 factors, candidate corridors with SIMULATED scores. " +
    "NO corridor is selected. All require external evidence before selection.",
  factorCount: FACTOR_DEFINITIONS.length,
  weightSum: WEIGHT_SUM,
  candidateCount: CANDIDATE_CORRIDORS.length,
  noHardCodedCorridor: true,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  NO corridor is hard-coded as predetermined.
//  NO corridor is "selected" — all have `selected: false`.
//  ALL factor scores are SIMULATED or INSUFFICIENT_DATA.
//  The `recommendedForInvestigation` list is based on SIMULATED scores.
//  A corridor becomes "SELECTED" only when:
//    (a) A bank provides real baseline data for ALL 14 factors, AND
//    (b) An executed engagement agreement exists, AND
//    (c) External regulatory feasibility evidence is obtained.
//
//  DO NOT:
//    - Present a SIMULATED score as a validated pain score
//    - Present a "recommended for investigation" corridor as "selected"
//    - Hard-code any corridor as the pilot corridor
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
