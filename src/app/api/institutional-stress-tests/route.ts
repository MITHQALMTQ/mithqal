import { NextResponse } from "next/server";
import { runAllStressTests, MODULE_ID } from "@/lib/institutional-stress-tests";

export const dynamic = "force-static";

export async function GET() {
  try {
    const report = runAllStressTests();
    return NextResponse.json({ ok: true, moduleId: MODULE_ID, ...report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
