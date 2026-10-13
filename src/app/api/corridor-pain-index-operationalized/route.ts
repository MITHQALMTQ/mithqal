import { NextResponse } from "next/server";
import { getOperationalizedCPI, CPI_OPERATIONALIZED_META } from "@/lib/corridor-pain-index-operationalized";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: CPI_OPERATIONALIZED_META,
    cpi: getOperationalizedCPI(),
    honestState: {
      noHardCodedCorridor: true,
      allScoresSimulated: true,
      noCorridorSelectedWithoutEvidence: true,
      productionAuthorized: false,
    },
  });
}
