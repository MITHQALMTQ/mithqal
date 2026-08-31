import { NextResponse } from "next/server";
import { generateTokenizationReport, MODULE_ID } from "@/lib/tokenization";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateTokenizationReport(), moduleId: MODULE_ID });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
