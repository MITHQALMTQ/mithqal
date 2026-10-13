import { NextResponse } from "next/server";
import { getG0ReAssessment, G0_REASSESSMENT_META } from "@/lib/g0-re-assessment";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: G0_REASSESSMENT_META,
    reAssessment: getG0ReAssessment(),
    honestState: {
      productionAuthorized: false,
      noLegalConclusionByInference: true,
      documentsNotInvented: true,
    },
  });
}
