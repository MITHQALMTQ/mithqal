import { NextResponse } from "next/server";
import { generateFinalityReport, MODULE_ID } from "@/lib/finality-before-mint";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateFinalityReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
