import { NextResponse } from "next/server";
import { generateTokenizationReport, MODULE_ID } from "@/lib/tokenization";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, moduleId: MODULE_ID, ...generateTokenizationReport() });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
