import { NextResponse } from "next/server";
import { getG0Report, G0_META } from "@/lib/g0-institutional-entry-gate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: G0_META,
    report: getG0Report(),
    honestState: {
      productionAuthorized: false,
      legalClearanceClaimed: false,
      architectureNotModified: true,
      noInferenceFromCode: true,
      noInferenceFromBlueprint: true,
    },
  });
}
