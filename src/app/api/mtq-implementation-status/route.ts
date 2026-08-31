import { NextResponse } from "next/server";
import { generateImplementationStatusReport, MODULE_ID } from "@/lib/implementation-status-report";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateImplementationStatusReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
