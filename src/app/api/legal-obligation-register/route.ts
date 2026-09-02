import { NextResponse } from "next/server";
import { generateLegalObligationRegisterReport, MODULE_ID } from "@/lib/legal-obligation-register";

export const dynamic = "force-static";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...generateLegalObligationRegisterReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
