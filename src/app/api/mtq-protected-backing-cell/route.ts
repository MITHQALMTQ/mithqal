import { NextResponse } from "next/server";
import { generateProtectedBackingCellReport, MODULE_ID } from "@/lib/protected-backing-cell";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateProtectedBackingCellReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
