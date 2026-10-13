import { NextResponse } from "next/server";
import { getCFOOutput, VALUE_ENGINE_META } from "@/lib/bank-value-measurement-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/bank-value-engine
 * Returns the CFO-ready Bank Value Measurement Engine output.
 * HONEST: all baselines INSUFFICIENT_DATA, no invented savings.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: VALUE_ENGINE_META,
    cfoOutput: getCFOOutput(),
    honestState: {
      noInventedSavings: true,
      allBaselinesInsufficientData: true,
      mithqalAssistedSimulated: true,
      productionAuthorized: false,
      cfoReadyButNotValidated: true,
    },
  });
}
