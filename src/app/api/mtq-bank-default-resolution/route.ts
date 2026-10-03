import { NextResponse } from "next/server";
import { generateBankDefaultReport, MODULE_ID } from "@/lib/bank-default-resolution";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateBankDefaultReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
