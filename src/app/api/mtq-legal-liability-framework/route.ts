import { NextResponse } from "next/server";
import { generateLegalLiabilityReport, MODULE_ID } from "@/lib/legal-liability-framework";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateLegalLiabilityReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
