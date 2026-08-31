import { NextResponse } from "next/server";
import { generateMTQOSReport, MODULE_ID } from "@/lib/mtq-os";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateMTQOSReport(), moduleId: MODULE_ID });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
