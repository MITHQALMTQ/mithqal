import { NextResponse } from "next/server";
import { generateThreeBookReport, MODULE_ID } from "@/lib/three-book-separation";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, moduleId: MODULE_ID, ...generateThreeBookReport() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
