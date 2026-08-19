import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  INTEROP_GATEWAY_STEPS,
  type ValuationRequest,
} from "@/lib/v25-1-institutional-interop";

// POST /api/v25.1/conversions/execute
// Accepts a conversion request and returns a SIMULATED execution result
// that walks through the 12-step interop gateway pipeline. No real
// bank / provider / asset is contracted yet.
//
// Body:
//   { inputAsset, inputAmount, outputAsset, provider, jurisdiction }
// Task ID: PHASE3-V25-1-API-ENDPOINTS

type ExecuteBody = ValuationRequest;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ExecuteBody>;
    const {
      inputAsset,
      inputAmount,
      outputAsset,
      provider,
      jurisdiction,
    } = body;

    if (
      !inputAsset ||
      typeof inputAmount !== "number" ||
      inputAmount <= 0 ||
      !outputAsset ||
      !provider ||
      !jurisdiction
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Required: { inputAsset, inputAmount (>0), outputAsset, provider, jurisdiction }",
        },
        { status: 400 },
      );
    }

    const report = generateV25_1Report();
    const executedAt = new Date().toISOString();
    const executionId = `SIM-EXEC-${Date.now()}`;

    // Walk through the 12-step interop gateway. Every step is SIMULATED
    // — no live compliance / settlement / finality check is performed.
    const pipelineSteps = INTEROP_GATEWAY_STEPS.map((step, idx) => ({
      step: idx + 1,
      name: step,
      status: "SIMULATED_PASSED",
      evidence: "SIMULATED — no live provider or asset contracted",
      timestamp: executedAt,
    }));

    return NextResponse.json({
      endpoint: "/api/v25.1/conversions/execute",
      status: "SIMULATED",
      timestamp: executedAt,
      data: {
        executionId,
        request: {
          inputAsset,
          inputAmount,
          outputAsset,
          provider,
          jurisdiction,
        },
        pipeline: pipelineSteps,
        finalityConfirmed: false,
        mintAuthorized: false,
        reason:
          "SIMULATED execution — Finality-Before-Mint rule not satisfied (no live settlement).",
        assetRegistryCount: report.assetRegistryCount,
        corridorRegistryCount: report.corridorRegistryCount,
        providerRegistryCount: report.providerRegistryCount,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
