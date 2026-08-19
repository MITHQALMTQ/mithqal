import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  FINALITY_BEFORE_MINT_RULE,
} from "@/lib/v25-1-institutional-interop";

// POST /api/v25.1/mtq/mint
// Returns a SIMULATED mint authorization that is always BLOCKED because
// the Finality-Before-Mint constitutional-grade rule is enforced. No MTQ
// is ever minted without confirmed final settlement.
//
// Body:
//   { institutionId, bankId, finalityId, amount }
// Task ID: PHASE3-V25-1-API-ENDPOINTS

interface MintBody {
  institutionId?: string;
  bankId?: string;
  finalityId?: string;
  amount?: number;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<MintBody>;
    const { institutionId, bankId, finalityId, amount } = body;

    if (
      !institutionId ||
      !bankId ||
      !finalityId ||
      typeof amount !== "number" ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Required: { institutionId, bankId, finalityId, amount (>0) }",
        },
        { status: 400 },
      );
    }

    const report = generateV25_1Report();

    return NextResponse.json({
      endpoint: "/api/v25.1/mtq/mint",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        canMint: false,
        reason:
          "NO_FINALITY_CONFIRMED — Finality-Before-Mint rule enforced",
        request: {
          institutionId,
          bankId,
          finalityId,
          amount,
        },
        finalityBeforeMintRule: report.finalityBeforeMintRule ?? FINALITY_BEFORE_MINT_RULE,
        blocked: true,
        productionAuthorized: report.honestState.productionAuthorized,
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
