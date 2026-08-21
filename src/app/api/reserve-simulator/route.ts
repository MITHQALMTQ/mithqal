import { NextResponse } from "next/server";
import { generateSimulatorReport, MODULE_ID } from "@/lib/reserve-simulator";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, moduleId: MODULE_ID, ...generateSimulatorReport() });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
