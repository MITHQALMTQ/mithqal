import { NextResponse } from "next/server";
import { getG1Report, G1_META } from "@/lib/g1-pilot-jurisdiction-legal-pack";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: G1_META,
    report: getG1Report(),
    honestState: {
      productionAuthorized: false,
      noJurisdictionSelectedAsLegalConclusion: true,
      systemRemainsJurisdictionPending: true,
      noIntuitionBasedSelection: true,
    },
  });
}
