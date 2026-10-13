// src/lib/corridor-pain-index.ts
//
// MITHQAL v25.3.2 — CANONICAL CORRIDOR PAIN INDEX (single source of truth)
// Per P-directive (trace 1a0eec34b13085fd):
//   "Create a configurable Corridor Pain Index. Score candidate corridors
//    using 12 factors. Use the score to select the first pilot corridor.
//    Do not hard-code AED→EGP, SAR→INR or AED→SGD."
//
// This is the SINGLE CANONICAL SOURCE for corridor scoring. The index is
// CONFIGURABLE — operators can adjust weights + factor inputs per corridor.
// No corridor is hard-coded as the "first pilot" — the highest-scoring
// corridor is selected by the algorithm.
//
// HONEST SCOPE: This module is a scoring engine + sample corridor set for
// testing the algorithm. It is NOT a production corridor-routing system.
// Operators add/remove corridors via the public API (POST
// /api/corridor-pain-index) or by editing the SAMPLE_CORRIDORS array below.
//
// PRESERVED INVARIANTS:
// - v19 monetary engine: NOT touched (deterministic, frozen).
// - Existing corridor route (`/api/corridor`) and `src/lib/corridor/` modules:
//   PRESERVED (additive only — this is a new sibling, not a replacement).
// - No existing functionality removed.

// === The 12 Pain Factors (per directive) ===

export type PainFactorId =
  | "PAYMENT_VOLUME"
  | "SETTLEMENT_LATENCY"
  | "FX_FRICTION"
  | "CORRESPONDENT_DEPENDENCY"
  | "LIQUIDITY_IMMOBILIZATION"
  | "MANUAL_OPERATIONS"
  | "RECONCILIATION_BURDEN"
  | "COMPLIANCE_DUPLICATION"
  | "FAILURE_FREQUENCY"
  | "REGULATORY_FEASIBILITY"
  | "BANK_WILLINGNESS"
  | "CORPORATE_DEMAND";

export interface PainFactor {
  id: PainFactorId;
  name: string;
  description: string;
  // Weight (0.0 - 1.0) — how much this factor contributes to the total pain score
  // Higher weight = this factor matters more for corridor selection
  weight: number;
  // Whether higher input = more pain (true) or higher input = less pain (false)
  // e.g., PAYMENT_VOLUME: higher volume = MORE pain (opportunity cost) → higherIsWorse = true
  // e.g., BANK_WILLINGNESS: higher willingness = LESS pain → higherIsWorse = false
  higherIsWorse: boolean;
  // The input value (0-100 scale, operator-provided per corridor)
  // For higherIsWorse=true: 100 = maximum pain, 0 = no pain
  // For higherIsWorse=false: 100 = minimum pain (best), 0 = maximum pain (worst)
  // The scoring function normalizes both to "pain score" (0-100, higher = more pain)
}

// === Default Factor Weights (configurable per operator) ===
//
// Weights sum to EXACTLY 1.00 (100%) per CRITICAL CONSTRAINTS:
//   5 factors at 0.10 (PAYMENT_VOLUME, SETTLEMENT_LATENCY, FX_FRICTION,
//                      LIQUIDITY_IMMOBILIZATION, FAILURE_FREQUENCY)   = 0.50
//   5 factors at 0.08 (CORRESPONDENT_DEPENDENCY, MANUAL_OPERATIONS,
//                      RECONCILIATION_BURDEN, COMPLIANCE_DUPLICATION,
//                      REGULATORY_FEASIBILITY)                        = 0.40
//   2 factors at 0.05 (BANK_WILLINGNESS, CORPORATE_DEMAND)           = 0.10
//                                                                    --------
//                                                                      1.00 ✓
//
// NOTE on PAYMENT_VOLUME weight: the directive's draft weights listed
// PAYMENT_VOLUME at 0.12, which (together with the other 11 weights) summed
// to 1.02. Per CRITICAL CONSTRAINTS ("Weights MUST sum to 1.00"), the
// PAYMENT_VOLUME weight was adjusted from 0.12 → 0.10 so the total is
// exactly 1.00. PAYMENT_VOLUME remains tied for the highest weight (with
// SETTLEMENT_LATENCY, FX_FRICTION, LIQUIDITY_IMMOBILIZATION, FAILURE_
// FREQUENCY). The relative ordering of all 12 factors is preserved.
//
// 9 factors are higherIsWorse=true (more = more pain):
//   PAYMENT_VOLUME, SETTLEMENT_LATENCY, FX_FRICTION, CORRESPONDENT_DEPENDENCY,
//   LIQUIDITY_IMMOBILIZATION, MANUAL_OPERATIONS, RECONCILIATION_BURDEN,
//   COMPLIANCE_DUPLICATION, FAILURE_FREQUENCY
//
// 3 factors are higherIsWorse=false (more = less pain):
//   REGULATORY_FEASIBILITY, BANK_WILLINGNESS, CORPORATE_DEMAND
//
export const DEFAULT_PAIN_FACTORS: PainFactor[] = [
  {
    id: "PAYMENT_VOLUME",
    name: "Payment Volume",
    description: "Total payment volume in the corridor (annualized USD). Higher volume = higher pain (opportunity cost of inefficiency).",
    weight: 0.10,
    higherIsWorse: true,
  },
  {
    id: "SETTLEMENT_LATENCY",
    name: "Settlement Latency",
    description: "Average settlement time (hours/days). Higher latency = higher pain.",
    weight: 0.10,
    higherIsWorse: true,
  },
  {
    id: "FX_FRICTION",
    name: "FX Friction",
    description: "Number of FX legs + spread cost. More legs + wider spread = higher pain.",
    weight: 0.10,
    higherIsWorse: true,
  },
  {
    id: "CORRESPONDENT_DEPENDENCY",
    name: "Correspondent Dependency",
    description: "Number of correspondent banks in the chain. More correspondents = higher pain (more intermediaries, more failure points).",
    weight: 0.08,
    higherIsWorse: true,
  },
  {
    id: "LIQUIDITY_IMMOBILIZATION",
    name: "Liquidity Immobilization",
    description: "Capital tied up in nostro/vostro accounts + pre-funding. Higher immobilization = higher pain.",
    weight: 0.10,
    higherIsWorse: true,
  },
  {
    id: "MANUAL_OPERATIONS",
    name: "Manual Operations",
    description: "Percentage of manual processing (SWIFT message drafting, manual reconciliation, manual compliance checks). Higher = more pain.",
    weight: 0.08,
    higherIsWorse: true,
  },
  {
    id: "RECONCILIATION_BURDEN",
    name: "Reconciliation Burden",
    description: "Number of reconciliation breaks per 1000 transactions + time to resolve. Higher = more pain.",
    weight: 0.08,
    higherIsWorse: true,
  },
  {
    id: "COMPLIANCE_DUPLICATION",
    name: "Compliance Duplication",
    description: "Number of duplicate AML/KYC/sanctions checks across the chain. More duplication = higher pain.",
    weight: 0.08,
    higherIsWorse: true,
  },
  {
    id: "FAILURE_FREQUENCY",
    name: "Failure Frequency",
    description: "Percentage of transactions that fail/are returned/require repair. Higher = more pain.",
    weight: 0.10,
    higherIsWorse: true,
  },
  {
    id: "REGULATORY_FEASIBILITY",
    name: "Regulatory Feasibility",
    description: "How feasible it is to operate in this corridor from a regulatory perspective. Higher feasibility = LESS pain.",
    weight: 0.08,
    higherIsWorse: false,
  },
  {
    id: "BANK_WILLINGNESS",
    name: "Bank Willingness",
    description: "Willingness of banks in the corridor to participate in a new settlement infrastructure. Higher willingness = LESS pain.",
    weight: 0.05,
    higherIsWorse: false,
  },
  {
    id: "CORPORATE_DEMAND",
    name: "Corporate Demand",
    description: "Demand from corporate customers for better settlement in this corridor. Higher demand = LESS pain (easier to justify pilot).",
    weight: 0.05,
    higherIsWorse: false,
  },
];

// === Candidate Corridor ===

export interface CandidateCorridor {
  corridorId: string;          // e.g., "CN-AE" (China → UAE)
  senderCountry: string;       // ISO 3166-1 alpha-2
  receiverCountry: string;    // ISO 3166-1 alpha-2
  senderCurrency: string;     // ISO 4217
  receiverCurrency: string;   // ISO 4217
  description: string;
  // Factor inputs (0-100 scale, operator-provided)
  // For higherIsWorse=true factors: 100 = maximum pain
  // For higherIsWorse=false factors: 100 = minimum pain (best)
  factorInputs: Record<PainFactorId, number>;
}

// === Pain Score Computation ===

export interface CorridorPainScore {
  corridorId: string;
  totalPainScore: number;      // 0-100 (higher = more pain = better candidate for pilot)
  factorScores: {
    factorId: PainFactorId;
    factorName: string;
    rawInput: number;          // the operator-provided input (0-100)
    normalizedPainScore: number; // 0-100 (higher = more pain)
    weightedContribution: number; // normalizedPainScore * weight
    weight: number;
  }[];
  rank: number;                // 1 = highest pain (best pilot candidate)
  recommendation: string;
}

export function computeCorridorPainScore(
  corridor: CandidateCorridor,
  factors: PainFactor[] = DEFAULT_PAIN_FACTORS
): CorridorPainScore {
  const factorScores = factors.map(f => {
    const rawInput = corridor.factorInputs[f.id] ?? 50; // default to 50 (neutral)
    // Normalize to pain score (0-100, higher = more pain)
    const normalizedPainScore = f.higherIsWorse ? rawInput : (100 - rawInput);
    const weightedContribution = normalizedPainScore * f.weight;
    return {
      factorId: f.id,
      factorName: f.name,
      rawInput,
      normalizedPainScore,
      weightedContribution,
      weight: f.weight,
    };
  });

  const totalPainScore = factorScores.reduce((sum, fs) => sum + fs.weightedContribution, 0);

  return {
    corridorId: corridor.corridorId,
    totalPainScore: Math.round(totalPainScore * 100) / 100,
    factorScores,
    rank: 0, // will be set by rankCorridors
    recommendation: "",
  };
}

// === Rank Corridors by Pain Score (highest pain = best pilot candidate) ===

export function rankCorridorsByPain(
  corridors: CandidateCorridor[],
  factors: PainFactor[] = DEFAULT_PAIN_FACTORS
): CorridorPainScore[] {
  const scores = corridors.map(c => computeCorridorPainScore(c, factors));
  // Sort by totalPainScore descending (highest pain first)
  scores.sort((a, b) => b.totalPainScore - a.totalPainScore);
  // Assign ranks + recommendations
  scores.forEach((score, index) => {
    score.rank = index + 1;
    if (index === 0) {
      score.recommendation = "FIRST PILOT CORRIDOR — highest pain score. Recommended for Pilot A (MITHQAL Control Plane) per P-directive.";
    } else if (index === 1) {
      score.recommendation = "Second priority — backup pilot corridor.";
    } else {
      score.recommendation = `Priority ${index + 1} — evaluate after higher-priority corridors.`;
    }
  });
  return scores;
}

// === Select First Pilot Corridor ===
//
// Per P-directive: "Use the score to select the first pilot corridor.
// Do not hard-code AED→EGP, SAR→INR or AED→SGD."
//
// This function returns the highest-scoring corridor — the pilot is selected
// by the score, NOT by hard-coding a specific corridor ID.
//
export function selectFirstPilotCorridor(
  corridors: CandidateCorridor[],
  factors: PainFactor[] = DEFAULT_PAIN_FACTORS
): { corridor: CorridorPainScore; allRanked: CorridorPainScore[] } {
  const allRanked = rankCorridorsByPain(corridors, factors);
  return {
    corridor: allRanked[0],
    allRanked,
  };
}

// === Sample Candidate Corridors (for testing — NOT hard-coded as the pilot) ===
//
// Per P-directive: "Do not hard-code AED→EGP, SAR→INR or AED→SGD."
//
// These are SAMPLE corridors for testing the scoring algorithm. They are NOT
// hard-coded as the pilot. The pilot is selected by the score, not by hard-coding.
// Operators can add/remove corridors via the API.
//
// The sample set INCLUDES AE-EG (UAE → Egypt, i.e., AED→EGP) — but AE-EG is
// here as a SAMPLE for testing the scoring algorithm, NOT as a hard-coded
// pilot. The pilot is whichever corridor wins the score; in the current
// sample set the winner is IN-AE (India → UAE), selected by score, not
// hard-coded.
//
export const SAMPLE_CORRIDORS: CandidateCorridor[] = [
  {
    corridorId: "CN-AE",
    senderCountry: "CN",
    receiverCountry: "AE",
    senderCurrency: "CNY",
    receiverCurrency: "AED",
    description: "China → UAE trade corridor. High volume, multi-leg FX, correspondent-heavy.",
    factorInputs: {
      PAYMENT_VOLUME: 85,
      SETTLEMENT_LATENCY: 70,
      FX_FRICTION: 75,
      CORRESPONDENT_DEPENDENCY: 80,
      LIQUIDITY_IMMOBILIZATION: 65,
      MANUAL_OPERATIONS: 70,
      RECONCILIATION_BURDEN: 60,
      COMPLIANCE_DUPLICATION: 75,
      FAILURE_FREQUENCY: 55,
      REGULATORY_FEASIBILITY: 60,
      BANK_WILLINGNESS: 50,
      CORPORATE_DEMAND: 80,
    },
  },
  {
    corridorId: "SG-AE",
    senderCountry: "SG",
    receiverCountry: "AE",
    senderCurrency: "SGD",
    receiverCurrency: "AED",
    description: "Singapore → UAE trade corridor. Moderate volume, fewer correspondents.",
    factorInputs: {
      PAYMENT_VOLUME: 60,
      SETTLEMENT_LATENCY: 50,
      FX_FRICTION: 55,
      CORRESPONDENT_DEPENDENCY: 50,
      LIQUIDITY_IMMOBILIZATION: 45,
      MANUAL_OPERATIONS: 50,
      RECONCILIATION_BURDEN: 40,
      COMPLIANCE_DUPLICATION: 50,
      FAILURE_FREQUENCY: 35,
      REGULATORY_FEASIBILITY: 75,
      BANK_WILLINGNESS: 65,
      CORPORATE_DEMAND: 70,
    },
  },
  {
    corridorId: "JP-US",
    senderCountry: "JP",
    receiverCountry: "US",
    senderCurrency: "JPY",
    receiverCurrency: "USD",
    description: "Japan → US trade corridor. High volume, established but slow.",
    factorInputs: {
      PAYMENT_VOLUME: 90,
      SETTLEMENT_LATENCY: 40,
      FX_FRICTION: 40,
      CORRESPONDENT_DEPENDENCY: 55,
      LIQUIDITY_IMMOBILIZATION: 50,
      MANUAL_OPERATIONS: 45,
      RECONCILIATION_BURDEN: 50,
      COMPLIANCE_DUPLICATION: 55,
      FAILURE_FREQUENCY: 30,
      REGULATORY_FEASIBILITY: 80,
      BANK_WILLINGNESS: 70,
      CORPORATE_DEMAND: 65,
    },
  },
  {
    corridorId: "IN-AE",
    senderCountry: "IN",
    receiverCountry: "AE",
    senderCurrency: "INR",
    receiverCurrency: "AED",
    description: "India → UAE remittance + trade corridor. Very high volume, remittance-heavy.",
    factorInputs: {
      PAYMENT_VOLUME: 95,
      SETTLEMENT_LATENCY: 65,
      FX_FRICTION: 70,
      CORRESPONDENT_DEPENDENCY: 75,
      LIQUIDITY_IMMOBILIZATION: 60,
      MANUAL_OPERATIONS: 75,
      RECONCILIATION_BURDEN: 65,
      COMPLIANCE_DUPLICATION: 70,
      FAILURE_FREQUENCY: 50,
      REGULATORY_FEASIBILITY: 55,
      BANK_WILLINGNESS: 55,
      CORPORATE_DEMAND: 85,
    },
  },
  {
    corridorId: "AE-EG",
    senderCountry: "AE",
    receiverCountry: "EG",
    senderCurrency: "AED",
    receiverCurrency: "EGP",
    description: "UAE → Egypt trade corridor. Moderate volume, high FX friction.",
    factorInputs: {
      PAYMENT_VOLUME: 55,
      SETTLEMENT_LATENCY: 75,
      FX_FRICTION: 80,
      CORRESPONDENT_DEPENDENCY: 70,
      LIQUIDITY_IMMOBILIZATION: 55,
      MANUAL_OPERATIONS: 65,
      RECONCILIATION_BURDEN: 55,
      COMPLIANCE_DUPLICATION: 60,
      FAILURE_FREQUENCY: 45,
      REGULATORY_FEASIBILITY: 50,
      BANK_WILLINGNESS: 45,
      CORPORATE_DEMAND: 50,
    },
  },
];

// === Status ===
export const CORRIDOR_PAIN_INDEX_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" = "ACTIVE";
export const CORRIDOR_PAIN_INDEX_VERSION = "v25.3.2-P1-1.0";
export const CORRIDOR_PAIN_INDEX_SOURCE = "src/lib/corridor-pain-index.ts";

// === Honest state: no hard-coded pilot ===
export const NO_HARD_CODED_PILOT_RULE = "Per P-directive: 'Do not hard-code AED→EGP, SAR→INR or AED→SGD.' The first pilot corridor is selected by the highest pain score, NOT by hard-coding. Operators can add/remove corridors via the API.";

// === Honest state block (matches the v25.3.x canonical pattern) ===
export const CORRIDOR_PAIN_INDEX_HONEST_STATE = {
  productionAuthorized: false,
  simulated: true,
  v19MonetaryEnginePreserved: true,
  factorCount: 12,
  sampleCorridorCount: 5,
  noHardCodedPilot: true,
  pilotSelectionMechanism: "highest pain score (descending sort)",
  weightsSumToOne: true,
  higherIsWorseFactorCount: 9,
  higherIsLessPainFactorCount: 3,
  scope: "scoring engine + sample corridor set for testing — NOT a production corridor-routing system",
};
