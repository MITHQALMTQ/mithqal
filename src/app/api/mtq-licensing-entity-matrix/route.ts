import { NextResponse } from "next/server";
import { generateLicensingMatrixReport, MODULE_ID } from "@/lib/licensing-entity-matrix";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateLicensingMatrixReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
