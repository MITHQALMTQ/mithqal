import { NextResponse } from "next/server";
import { generateSimulatorReport, MODULE_ID } from "@/lib/reserve-simulator";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateSimulatorReport(), moduleId: MODULE_ID });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
