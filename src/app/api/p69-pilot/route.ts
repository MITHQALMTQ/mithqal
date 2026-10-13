import { NextResponse } from "next/server";
import { getPilotTermSheetFramework, P69_META } from "@/lib/p69-pilot-term-sheet";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    ok: true, meta: P69_META, framework: getPilotTermSheetFramework(),
    honestState: { productionAuthorized: false, noTermPresentedAsAgreed: true, architectureNotModified: true, mtqDisabled: true },
  });
}
