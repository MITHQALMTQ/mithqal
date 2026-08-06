import { NextResponse } from "next/server";
import {
  evaluateRebalance,
  computeCompositeScore,
  estimateRebalanceBenefit,
  estimateRebalanceCost,
  REBALANCE_FACTOR_WEIGHTS,
  DECISION_THRESHOLDS,
  formatRebalanceSummary,
  emptyRebalanceFactors,
  type RebalanceFactors,
} from "@/lib/dynamic-rebalancing";

/**
 * GET /api/rebalancing
 *
 * Returns the current rebalance recommendation (Chapter XX §XX.15).
 *
 * Query params (all optional — defaults reflect live operational baseline):
 *   reserveDeviation       decimal (0.04 = 4%)
 *   volatility             decimal (0.015 = 1.5%)
 *   marketLiquidity        0-1
 *   ctacEstimate           USD
 *   expectedExecutionCost  USD
 *   dealerAvailability     0-1
 *   currentSpreads         bps
 *   transactionBatchingBenefit USD
 *   reserveConcentration   0-1
 *   custodianConcentration 0-1
 *   oracleConfidence       0-1
 *   timeSinceRebalance     hours
 *   netInflows             USD
 *   netOutflows            USD
 *   expectedNearTermFlows  USD (signed)
 *   totalReserves          USD (default $50M)
 *
 * If no params supplied, returns a realistic demo scenario.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    // If no params, use a realistic demo scenario (slight deviation, normal conditions)
    const hasParams = Array.from(sp.keys()).length > 0;

    const num = (key: keyof RebalanceFactors, fallback: number): number => {
      const raw = sp.get(key);
      if (raw == null || raw === "") return fallback;
      const v = Number(raw);
      return Number.isFinite(v) ? v : fallback;
    };

    // Demo baseline (a realistic "modest deviation, calm market" scenario)
    const demo: RebalanceFactors = {
      reserveDeviation: 0.035,        // 3.5% deviation
      volatility: 0.012,              // 1.2% gold vol
      marketLiquidity: 0.85,
      ctacEstimate: 25_000,
      expectedExecutionCost: 8_000,
      dealerAvailability: 0.92,
      currentSpreads: 3,              // 3 bps
      transactionBatchingBenefit: 5_000,
      reserveConcentration: 0.45,
      custodianConcentration: 0.38,
      oracleConfidence: 0.95,
      timeSinceRebalance: 12,         // 12h since last
      netInflows: 250_000,
      netOutflows: 80_000,
      expectedNearTermFlows: 100_000,
    };

    const factors: RebalanceFactors = hasParams
      ? {
          reserveDeviation: num("reserveDeviation", demo.reserveDeviation),
          volatility: num("volatility", demo.volatility),
          marketLiquidity: num("marketLiquidity", demo.marketLiquidity),
          ctacEstimate: num("ctacEstimate", demo.ctacEstimate),
          expectedExecutionCost: num("expectedExecutionCost", demo.expectedExecutionCost),
          dealerAvailability: num("dealerAvailability", demo.dealerAvailability),
          currentSpreads: num("currentSpreads", demo.currentSpreads),
          transactionBatchingBenefit: num("transactionBatchingBenefit", demo.transactionBatchingBenefit),
          reserveConcentration: num("reserveConcentration", demo.reserveConcentration),
          custodianConcentration: num("custodianConcentration", demo.custodianConcentration),
          oracleConfidence: num("oracleConfidence", demo.oracleConfidence),
          timeSinceRebalance: num("timeSinceRebalance", demo.timeSinceRebalance),
          netInflows: num("netInflows", demo.netInflows),
          netOutflows: num("netOutflows", demo.netOutflows),
          expectedNearTermFlows: num("expectedNearTermFlows", demo.expectedNearTermFlows),
        }
      : demo;

    // Validate [0,1] bounded factors
    const bounded: (keyof RebalanceFactors)[] = [
      "marketLiquidity", "dealerAvailability", "reserveConcentration",
      "custodianConcentration", "oracleConfidence",
    ];
    for (const k of bounded) {
      const v = factors[k] as number;
      if (v < 0 || v > 1) {
        return NextResponse.json(
          { ok: false, error: `${k} must be in [0, 1] (got ${v})` },
          { status: 400 },
        );
      }
    }

    const totalReservesStr = sp.get("totalReserves");
    const totalReserves = totalResenses_parse(totalReservesStr);

    const recommendation = evaluateRebalance(factors, totalReserves);
    const composite = computeCompositeScore(factors);
    const benefit = estimateRebalanceBenefit(factors, totalReserves);
    const cost = estimateRebalanceCost(factors);

    return NextResponse.json({
      ok: true,
      recommendation,
      factors,
      summary: formatRebalanceSummary(recommendation),
      composite,
      benefit,
      cost,
      netBenefit: benefit - cost,
      weights: REBALANCE_FACTOR_WEIGHTS,
      thresholds: DECISION_THRESHOLDS,
      isDemo: !hasParams,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[rebalancing GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not compute rebalance recommendation.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/rebalancing — accept a full RebalanceFactors object.
 * Useful for programmatic callers that prefer JSON body over query params.
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
    const factorsRaw = data.factors as Record<string, unknown> | undefined;
    if (!factorsRaw || typeof factorsRaw !== "object") {
      return NextResponse.json(
        { ok: false, error: "factors (RebalanceFactors) is required." },
        { status: 400 },
      );
    }
    const totalReserves =
      typeof data.totalReserves === "number" ? data.totalReserves : 50_000_000;

    const empty = emptyRebalanceFactors();
    const factors = { ...empty } as RebalanceFactors;
    for (const k of Object.keys(empty) as (keyof RebalanceFactors)[]) {
      const v = Number(factorsRaw[k]);
      if (!Number.isFinite(v)) {
        return NextResponse.json(
          { ok: false, error: `factors.${k} must be a finite number` },
          { status: 400 },
        );
      }
      factors[k] = v;
    }

    const bounded: (keyof RebalanceFactors)[] = [
      "marketLiquidity", "dealerAvailability", "reserveConcentration",
      "custodianConcentration", "oracleConfidence",
    ];
    for (const k of bounded) {
      if (factors[k] < 0 || factors[k] > 1) {
        return NextResponse.json(
          { ok: false, error: `factors.${k} must be in [0, 1]` },
          { status: 400 },
        );
      }
    }

    const recommendation = evaluateRebalance(factors, totalReserves);
    return NextResponse.json({
      ok: true,
      recommendation,
      factors,
      summary: formatRebalanceSummary(recommendation),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[rebalancing POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not compute rebalance recommendation.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

function totalResenses_parse(s: string | null): number {
  if (s == null || s === "") return 50_000_000;
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? v : 50_000_000;
}
