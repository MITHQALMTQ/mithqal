import { NextResponse } from "next/server";
import { getFinalDossier, DOSSIER_META } from "@/lib/final-institutional-dossier";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: DOSSIER_META,
    dossier: getFinalDossier(),
    honestState: {
      productionAuthorized: false,
      noStatePromotedMerelyBecauseFileExists: true,
      allCapabilitiesHaveEvidenceClass: true,
      architectureNotModifiedDuringDossier: true,
    },
  });
}
