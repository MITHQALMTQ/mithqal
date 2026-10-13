import { NextResponse } from "next/server";
import { getCriticalPath, CRITICAL_PATH_META } from "@/lib/institutional-critical-path";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: CRITICAL_PATH_META,
    path: getCriticalPath(),
    honestState: {
      noGatePassesFromSoftware: true,
      primaryKPIIsExternalEvidence: true,
      productionAuthorized: false,
      allGatesSequential: true,
    },
  });
}
