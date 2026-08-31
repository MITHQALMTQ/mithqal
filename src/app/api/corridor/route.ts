import { NextResponse } from "next/server";
import { generateCorridorReport, MODULE_ID } from "@/lib/corridor/aed-sgd";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateCorridorReport(), moduleId: MODULE_ID });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
