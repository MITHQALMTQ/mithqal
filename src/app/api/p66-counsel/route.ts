import { NextResponse } from "next/server";
import { getCounselEngagementBrief, P66_META } from "@/lib/p66-counsel-engagement-brief";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    ok: true, meta: P66_META, brief: getCounselEngagementBrief(),
    honestState: { productionAuthorized: false, noLegalOpinionIssued: true, architectureNotModified: true, onlyCounselMayAnswer: true },
  });
}
