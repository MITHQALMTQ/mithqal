import { NextResponse } from "next/server";
import { generateV25_1Report, REDEMPTION_RULE } from "@/lib/v25-1-institutional-interop";

// POST /api/v25.1/mtq/redeem
// Returns a SIMULATED redemption request — always PENDING. No real
// redemption is processed; no bank / provider / asset is contracted.
//
// Body:
//   { institutionId, bankId, mtqAmount, outputAsset }
// Task ID: PHASE3-V25-1-API-ENDPOINTS

interface RedeemBody {
  institutionId?: string;
  bankId?: string;
  mtqAmount?: number;
  outputAsset?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RedeemBody>;
    const { institutionId, bankId, mtqAmount, outputAsset } = body;

    if (
      !institutionId ||
      !bankId ||
      typeof mtqAmount !== "number" ||
      mtqAmount <= 0 ||
      !outputAsset
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Required: { institutionId, bankId, mtqAmount (>0), outputAsset }",
        },
        { status: 400 },
      );
    }

    const report = generateV25_1Report();
    const redemptionId = `SIMULATED-${Date.now()}`;

    return NextResponse.json({
      endpoint: "/api/v25.1/mtq/redeem",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        status: "PENDING",
        redemptionId: "SIMULATED",
        redemptionIdFull: redemptionId,
        request: {
          institutionId,
          bankId,
          mtqAmount,
          outputAsset,
        },
        redemptionRule: report.redemptionRule ?? REDEMPTION_RULE,
        note:
          "SIMULATED — no provider/bank/asset contracted. Redemption remains pending until a regulated provider is onboarded and final settlement is confirmed.",
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
