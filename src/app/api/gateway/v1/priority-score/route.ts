// GET /api/gateway/v1/priority-score
// POST /api/gateway/v1/priority-score
// Returns and calculates Priority Scores per v1.0 §3.
// HONEST STATE: HEURISTIC — internal heuristic, not a validated financial formula.
import { NextResponse } from "next/server";
import {
  calculateAllSamplePriorityScores,
  calculatePriorityScore,
  runSensitivityAnalysis,
  type PriorityScoreFactors,
  type PriorityScoreFactor,
} from "@/lib/priority-score";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const scores = calculateAllSamplePriorityScores();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/priority-score",
        method: "GET",
        description: "Priority Scores for all sample Pilot A corridors per v1.0 §3",
        status: "OK",
        blueprint_ref: "v1.0 §3",
        honestState: "HEURISTIC_NOT_VALIDATED_FORMULA",
        scores,
        count: scores.length,
        formula:
          "Priority Score = (Addressable Pain × Recoverable Value × Buyer Urgency × Repeatability) / " +
          "(Integration Cost × Legal Complexity × Data Barriers × Competitive Pressure)",
        disclaimer:
          "Internal heuristic, not a validated financial formula. Score on a documented 0–100 scale, " +
          "assign confidence and run sensitivity analysis (v1.0 §3). All inputs are synthetic.",
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "HEURISTIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Priority score endpoint failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §3",
      },
      { status: 500 },
    );
  }
}

function isPriorityScoreFactor(v: unknown): v is PriorityScoreFactor {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.value === "number" &&
    typeof o.confidence === "string" &&
    typeof o.rationale === "string"
  );
}

function isPriorityScoreFactors(v: unknown): v is PriorityScoreFactors {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isPriorityScoreFactor(o.addressablePain) &&
    isPriorityScoreFactor(o.recoverableValue) &&
    isPriorityScoreFactor(o.buyerUrgency) &&
    isPriorityScoreFactor(o.repeatability) &&
    isPriorityScoreFactor(o.integrationCost) &&
    isPriorityScoreFactor(o.legalComplexity) &&
    isPriorityScoreFactor(o.dataBarriers) &&
    isPriorityScoreFactor(o.competitivePressure)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const factors = body?.factors as unknown;
    const corridorId = (body?.corridorId as string | undefined) ?? "POSTED";
    const timestamp = new Date().toISOString();

    if (!isPriorityScoreFactors(factors)) {
      return NextResponse.json(
        {
          error:
            "factors is required and must include all 8 factors (addressablePain, recoverableValue, buyerUrgency, repeatability, integrationCost, legalComplexity, dataBarriers, competitivePressure) each as { value:number, confidence:LOW|MEDIUM|HIGH, rationale:string }",
          blueprint_ref: "v1.0 §3",
        },
        { status: 400 },
      );
    }

    const score = calculatePriorityScore(factors, corridorId);
    const sensitivity = runSensitivityAnalysis(factors);

    return NextResponse.json(
      {
        endpoint: "/gateway/v1/priority-score",
        method: "POST",
        description: "Calculate Priority Score per v1.0 §3",
        status: "OK",
        blueprint_ref: "v1.0 §3",
        honestState: "HEURISTIC_NOT_VALIDATED_FORMULA",
        score,
        sensitivity: {
          low: sensitivity.low,
          base: sensitivity.base,
          high: sensitivity.high,
        },
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "HEURISTIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Priority score calculation failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §3",
      },
      { status: 500 },
    );
  }
}
