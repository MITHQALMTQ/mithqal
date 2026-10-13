// =============================================================================
// src/lib/priority-score.ts
// MITHQAL · MTQ Canonical Blueprint v1.0 — §3 "Priority Score"
// =============================================================================
// Task ID: IMPL-V1-BLUEPRINT
//
// Per v1.0 §3 "Priority heuristic":
//
//   Priority Score = (Addressable Pain × Recoverable Value × Buyer Urgency ×
//     Repeatability) / (Integration Cost × Legal Complexity × Data Barriers ×
//     Competitive Pressure)
//
//   "This is an internal heuristic, not a validated financial formula. Score
//    on a documented scale, assign confidence and run sensitivity analysis."
//
// HONEST STATE (per v1.0 §0 "DESIGN-STAGE ONLY"):
//   - productionAuthorized = false
//   - This is an internal heuristic, NOT a validated financial formula
//   - Scores below are illustrative; buyers must run their own analysis
// =============================================================================

/**
 * Per §3, every factor is a 1–10 value with documented confidence, so the
 * demonstrator can distinguish "we measured this" from "we guessed this".
 */
export interface PriorityScoreFactor {
  value: number; // 1–10
  confidence: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
}

export interface PriorityScoreFactors {
  addressablePain: PriorityScoreFactor;
  recoverableValue: PriorityScoreFactor;
  buyerUrgency: PriorityScoreFactor;
  repeatability: PriorityScoreFactor;
  integrationCost: PriorityScoreFactor;
  legalComplexity: PriorityScoreFactor;
  dataBarriers: PriorityScoreFactor;
  competitivePressure: PriorityScoreFactor;
}

export type PriorityScoreConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface PriorityScore {
  corridorId: string;
  factors: PriorityScoreFactors;
  rawScore: number;
  /** Normalized to 0–100 per §3 "Score on a documented scale". */
  normalizedScore: number;
  confidence: PriorityScoreConfidence;
  sensitivityLow: number;
  sensitivityHigh: number;
  notes: string[];
  blueprint_ref: "v1.0 §3";
  /** Honest-state label per §0 — heuristic, not validated financial formula. */
  honestState: "HEURISTIC_NOT_VALIDATED_FORMULA";
}

const BLUEPRINT_REF = "v1.0 §3" as const;

// -----------------------------------------------------------------------------
// Sample corridor factors for Pilot A
// -----------------------------------------------------------------------------

/**
 * Sample factor sets for the three Pilot A corridors. These are SYNTHETIC
 * illustrative values — every factor carries a confidence label and
 * rationale, and the overall score is explicitly labeled a heuristic.
 */
export const SAMPLE_CORRIDOR_FACTORS: Record<string, PriorityScoreFactors> = {
  "AED-SGD": {
    addressablePain: { value: 8, confidence: "MEDIUM", rationale: "Treasury pain in Gulf→SG corridor reported in interviews (synthetic)." },
    recoverableValue: { value: 7, confidence: "MEDIUM", rationale: "Recoverable FX+fee value estimated (synthetic)." },
    buyerUrgency: { value: 7, confidence: "HIGH", rationale: "Buyer indicated 90-day decision window (synthetic)." },
    repeatability: { value: 8, confidence: "HIGH", rationale: "Daily recurring corridor (synthetic)." },
    integrationCost: { value: 6, confidence: "LOW", rationale: "Integration cost estimate rough (synthetic)." },
    legalComplexity: { value: 5, confidence: "LOW", rationale: "Two-jurisdiction review pending (synthetic)." },
    dataBarriers: { value: 4, confidence: "MEDIUM", rationale: "Authorized data not yet in hand (synthetic)." },
    competitivePressure: { value: 6, confidence: "LOW", rationale: "Alternatives surveyed but not benchmarked (synthetic)." },
  },
  "USD-EUR": {
    addressablePain: { value: 6, confidence: "MEDIUM", rationale: "Wholesale USD/EUR pain moderate (synthetic)." },
    recoverableValue: { value: 6, confidence: "MEDIUM", rationale: "Recoverable value moderate (synthetic)." },
    buyerUrgency: { value: 5, confidence: "LOW", rationale: "Buyer urgency unverified (synthetic)." },
    repeatability: { value: 9, confidence: "HIGH", rationale: "High-frequency corridor (synthetic)." },
    integrationCost: { value: 7, confidence: "LOW", rationale: "Wholesale integration heavy (synthetic)." },
    legalComplexity: { value: 6, confidence: "MEDIUM", rationale: "Two mature jurisdictions (synthetic)." },
    dataBarriers: { value: 5, confidence: "MEDIUM", rationale: "Data access partially authorized (synthetic)." },
    competitivePressure: { value: 8, confidence: "HIGH", rationale: "Many alternatives exist (synthetic)." },
  },
  "cross-border-remittance": {
    addressablePain: { value: 9, confidence: "HIGH", rationale: "Remittance pain well documented (synthetic)." },
    recoverableValue: { value: 5, confidence: "LOW", rationale: "Per-tx value small; volume needed (synthetic)." },
    buyerUrgency: { value: 6, confidence: "MEDIUM", rationale: "Buyer urgency moderate (synthetic)." },
    repeatability: { value: 9, confidence: "HIGH", rationale: "High-volume corridor (synthetic)." },
    integrationCost: { value: 5, confidence: "LOW", rationale: "Integration cost moderate (synthetic)." },
    legalComplexity: { value: 7, confidence: "MEDIUM", rationale: "Multi-jurisdiction remittance rules (synthetic)." },
    dataBarriers: { value: 7, confidence: "MEDIUM", rationale: "Strong data barriers (synthetic)." },
    competitivePressure: { value: 8, confidence: "HIGH", rationale: "Many remittance alternatives (synthetic)." },
  },
};

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

const MIN_SCALE = 1;
const MAX_SCALE = 10;

function clampFactor(v: number): number {
  if (!Number.isFinite(v)) return MIN_SCALE;
  if (v < MIN_SCALE) return MIN_SCALE;
  if (v > MAX_SCALE) return MAX_SCALE;
  return v;
}

function rawScoreFor(factors: PriorityScoreFactors): number {
  const numerator =
    clampFactor(factors.addressablePain.value) *
    clampFactor(factors.recoverableValue.value) *
    clampFactor(factors.buyerUrgency.value) *
    clampFactor(factors.repeatability.value);
  const denominator =
    clampFactor(factors.integrationCost.value) *
    clampFactor(factors.legalComplexity.value) *
    clampFactor(factors.dataBarriers.value) *
    clampFactor(factors.competitivePressure.value);
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

/**
 * Normalize the raw score (numerator/denominator) to a 0–100 scale per
 * §3 "Score on a documented scale".
 *
 * The maximum possible raw score occurs when every numerator factor is 10
 * and every denominator factor is 1, i.e. raw_max = 10^4 / 1^4 = 10_000.
 * normalized = (raw / raw_max) * 100, clamped to [0, 100].
 */
function normalizeRaw(raw: number): number {
  const RAW_MAX = 10_000;
  const v = (raw / RAW_MAX) * 100;
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return Math.round(v * 100) / 100;
}

/**
 * Derive overall confidence from factor confidences per §3 "assign
 * confidence". The rule: confidence = the WEAKEST link, because a score
 * is only as reliable as its least-justified input.
 */
function deriveConfidence(factors: PriorityScoreFactors): PriorityScoreConfidence {
  const all = [
    factors.addressablePain.confidence,
    factors.recoverableValue.confidence,
    factors.buyerUrgency.confidence,
    factors.repeatability.confidence,
    factors.integrationCost.confidence,
    factors.legalComplexity.confidence,
    factors.dataBarriers.confidence,
    factors.competitivePressure.confidence,
  ];
  if (all.includes("LOW")) return "LOW";
  if (all.includes("MEDIUM")) return "MEDIUM";
  return "HIGH";
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Calculate the Priority Score for a corridor factor set per §3.
 *
 * Formula:
 *   raw = (AP × RV × BU × RP) / (IC × LC × DB × CP)
 *   normalized = (raw / 10_000) * 100
 *
 * Per §3, every result includes:
 *   - the raw + normalized score
 *   - overall confidence (weakest-link rule)
 *   - sensitivity low/high (see runSensitivityAnalysis)
 *   - explicit notes labeling this as a heuristic, not a validated formula
 */
export function calculatePriorityScore(
  factors: PriorityScoreFactors,
  corridorId = "UNKNOWN",
  skipSensitivity = false,
): PriorityScore {
  const raw = rawScoreFor(factors);
  const normalized = normalizeRaw(raw);
  const confidence = deriveConfidence(factors);

  // Avoid infinite recursion: only run sensitivity analysis on the top-level call,
  // not when called from within runSensitivityAnalysis itself.
  let sensitivityLow = normalized;
  let sensitivityHigh = normalized;
  if (!skipSensitivity) {
    try {
      const sensitivity = runSensitivityAnalysis(factors);
      sensitivityLow = sensitivity.low.normalizedScore;
      sensitivityHigh = sensitivity.high.normalizedScore;
    } catch {
      // If sensitivity analysis fails (e.g. recursion guard), use base score
    }
  }

  return {
    corridorId,
    factors,
    rawScore: Math.round(raw * 1_000_000) / 1_000_000,
    normalizedScore: normalized,
    confidence,
    sensitivityLow,
    sensitivityHigh,
    notes: [
      "Internal heuristic, not a validated financial formula (v1.0 §3).",
      "Score on a documented 0–100 scale; confidence assigned per weakest-link rule.",
      "Sensitivity analysis varies every factor ±20%.",
      "All inputs are synthetic illustrative values for the Pilot A demonstrator.",
    ],
    blueprint_ref: BLUEPRINT_REF,
    honestState: "HEURISTIC_NOT_VALIDATED_FORMULA",
  };
}

/**
 * Per §3, run a sensitivity analysis by varying each factor ±20%.
 *
 * Returns {low, base, high}:
 *   - low: every numerator factor × 0.8 and every denominator factor × 1.2
 *   - high: every numerator factor × 1.2 and every denominator factor × 0.8
 *
 * Each branch returns a full PriorityScore so callers can see the spread.
 * Factors are clamped to [1,10] after variation.
 */
export function runSensitivityAnalysis(factors: PriorityScoreFactors): {
  low: PriorityScore;
  base: PriorityScore;
  high: PriorityScore;
} {
  const vary = (factor: PriorityScoreFactor, mult: number): PriorityScoreFactor => ({
    value: clampFactor(factor.value * mult),
    confidence: factor.confidence,
    rationale: factor.rationale,
  });

  const lowFactors: PriorityScoreFactors = {
    addressablePain: vary(factors.addressablePain, 0.8),
    recoverableValue: vary(factors.recoverableValue, 0.8),
    buyerUrgency: vary(factors.buyerUrgency, 0.8),
    repeatability: vary(factors.repeatability, 0.8),
    integrationCost: vary(factors.integrationCost, 1.2),
    legalComplexity: vary(factors.legalComplexity, 1.2),
    dataBarriers: vary(factors.dataBarriers, 1.2),
    competitivePressure: vary(factors.competitivePressure, 1.2),
  };

  const highFactors: PriorityScoreFactors = {
    addressablePain: vary(factors.addressablePain, 1.2),
    recoverableValue: vary(factors.recoverableValue, 1.2),
    buyerUrgency: vary(factors.buyerUrgency, 1.2),
    repeatability: vary(factors.repeatability, 1.2),
    integrationCost: vary(factors.integrationCost, 0.8),
    legalComplexity: vary(factors.legalComplexity, 0.8),
    dataBarriers: vary(factors.dataBarriers, 0.8),
    competitivePressure: vary(factors.competitivePressure, 0.8),
  };

  return {
    low: calculatePriorityScore(lowFactors, "sensitivity-low", true),
    base: calculatePriorityScore(factors, "sensitivity-base", true),
    high: calculatePriorityScore(highFactors, "sensitivity-high", true),
  };
}

/**
 * Calculate scores for all sample Pilot A corridors (catalog view).
 */
export function calculateAllSamplePriorityScores(): PriorityScore[] {
  return Object.entries(SAMPLE_CORRIDOR_FACTORS).map(([corridorId, factors]) =>
    calculatePriorityScore(factors, corridorId),
  );
}
