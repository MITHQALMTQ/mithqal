import { NextResponse } from "next/server";
import {
  computeBestExecutionScore,
  BEST_EXECUTION_WEIGHTS,
  type BestExecutionCriteria,
} from "@/lib/commercial-governance";

/**
 * POST /api/commercial-governance/best-execution
 *
 * Computes the Best Execution Score for a transaction against the 12-criteria
 * weighted matrix (Chapter XX §XX.6).
 *
 * Body:
 *   {
 *     criteria: BestExecutionCriteria,  // { price, liquidity, counterparty, ... } 0-100 each
 *     approvalThreshold?: number        // default 75
 *   }
 *
 * Returns: BestExecutionResult { score, criteria, weightedBreakdown, rating, approved, approvalThreshold }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (jsonErr) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body.", detail: jsonErr instanceof Error ? jsonErr.message : "unknown" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const criteriaRaw = data.criteria as Record<string, unknown> | undefined;
    const approvalThreshold =
      typeof data.approvalThreshold === "number" ? data.approvalThreshold : 75;

    if (!criteriaRaw || typeof criteriaRaw !== "object") {
      return NextResponse.json(
        { ok: false, error: "criteria (BestExecutionCriteria) is required." },
        { status: 400 },
      );
    }

    const requiredKeys = Object.keys(BEST_EXECUTION_WEIGHTS) as (keyof BestExecutionCriteria)[];
    const criteria = {} as BestExecutionCriteria;
    for (const k of requiredKeys) {
      const v = Number(criteriaRaw[k]);
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        return NextResponse.json(
          { ok: false, error: `criteria.${k} must be a number in [0, 100] (got ${criteriaRaw[k]})` },
          { status: 400 },
        );
      }
      criteria[k] = v;
    }

    const result = computeBestExecutionScore(criteria, approvalThreshold);

    return NextResponse.json({
      ok: true,
      result,
      weights: BEST_EXECUTION_WEIGHTS,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[best-execution POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not compute best execution score.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
