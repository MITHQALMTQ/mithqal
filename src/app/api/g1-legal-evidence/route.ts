import { NextResponse } from "next/server";
import { getG1LegalEvidencePack, G1_LEGAL_META } from "@/lib/g1-legal-evidence-pack";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: G1_LEGAL_META,
    pack: getG1LegalEvidencePack(),
    honestState: {
      productionAuthorized: false,
      noLegalConclusionByInference: true,
      architectureNotModified: true,
      onlyCounselMayConvertQuestions: true,
    },
  });
}
