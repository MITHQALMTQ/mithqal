import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  VALUATION_RULE,
  calculateValuation,
  type ValuationRequest,
} from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/conversions/quote
// Returns the v25.1 valuation calculation structure — the canonical
// inputs (ValuationRequest) and outputs (ValuationResult) plus an
// ILLUSTRATIVE (non-binding) calculation.
// SIMULATED — no live market data is connected.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();

    // Illustrative request + simulated market data — values are NOT live.
    const illustrativeRequest: ValuationRequest = {
      inputAsset: "USD",
      inputAmount: 1000,
      outputAsset: "MTQ",
      jurisdiction: "AE",
      provider: "PARTICIPATING_BANK",
    };
    const illustrativeMarket = {
      referencePrice: 1.0,
      bid: 0.9995,
      ask: 1.0005,
      liquidity: 1_000_000,
      haircut: 0,
      feeRate: 0.001,
    };
    const illustrativeResult = calculateValuation(illustrativeRequest, illustrativeMarket);

    return NextResponse.json({
      endpoint: "/api/v25.1/conversions/quote",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        valuationRule: VALUATION_RULE,
        inputFields: report.stablecoinEvaluationFields,
        requestStructure: Object.keys(illustrativeRequest),
        resultStructure: Object.keys(illustrativeResult),
        illustrative: {
          request: illustrativeRequest,
          marketData: illustrativeMarket,
          result: illustrativeResult,
        },
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
