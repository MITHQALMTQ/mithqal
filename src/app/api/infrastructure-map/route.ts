import { NextResponse } from "next/server";
import { getInfrastructureMap, INFRA_MAP_META } from "@/lib/runtime-infrastructure-map";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: INFRA_MAP_META,
    map: getInfrastructureMap(),
    honestState: {
      productionAuthorized: false,
      noSilentCompetingSystems: true,
      zeroCostDevSupported: true,
      allWorkflowsHaveReliability: true,
    },
  });
}
