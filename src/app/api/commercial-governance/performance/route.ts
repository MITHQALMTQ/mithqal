import { NextResponse } from "next/server";
import {
  calculatePerformanceParticipation,
  PERFORMANCE_PARTICIPATION_SPLIT,
  type PerformanceParticipation,
} from "@/lib/commercial-governance";

/**
 * POST /api/commercial-governance/performance
 *
 * Calculates the Performance Participation split for a procurement
 * (Chapter XX §XX.8).
 *
 * Savings (benchmark - execution × quantity) are split:
 *   - 60% → reserve growth     (constitutional priority)
 *   - 25% → Markets Ltd        (procurement performance)
 *   - 15% → commercial revenue (operations + holding)
 *
 * Body: { benchmarkPrice: number, executionPrice: number, quantity: number }
 * Returns: PerformanceParticipation
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
    const benchmarkPrice = Number(data.benchmarkPrice);
    const executionPrice = Number(data.executionPrice);
    const quantity = Number(data.quantity);

    if (!Number.isFinite(benchmarkPrice) || benchmarkPrice <= 0) {
      return NextResponse.json({ ok: false, error: "benchmarkPrice must be > 0" }, { status: 400 });
    }
    if (!Number.isFinite(executionPrice) || executionPrice <= 0) {
      return NextResponse.json({ ok: false, error: "executionPrice must be > 0" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ ok: false, error: "quantity must be > 0" }, { status: 400 });
    }

    const result: PerformanceParticipation = calculatePerformanceParticipation(
      benchmarkPrice,
      executionPrice,
      quantity,
    );

    return NextResponse.json({
      ok: true,
      result,
      split: PERFORMANCE_PARTICIPATION_SPLIT,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[performance POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not calculate performance participation.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
