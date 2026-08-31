import { NextResponse } from "next/server";
import { generateSystemicExposureReport, MODULE_ID } from "@/lib/systemic-exposure-engine";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateSystemicExposureReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
