import { NextResponse } from "next/server";
import { getBankEvaluationPack, BANK_PACK_META } from "@/lib/bank-evaluation-pack";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: BANK_PACK_META,
    pack: getBankEvaluationPack(),
    honestState: {
      noUnsupportedClaims: true,
      allClaimsHaveEvidenceRecord: true,
      productionAuthorized: false,
      architectureNotModified: true,
    },
  });
}
