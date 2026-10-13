import { NextResponse } from "next/server";
import { getWorkshopFramework, P68_META } from "@/lib/p68-bank-workshop-framework";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    ok: true, meta: P68_META, framework: getWorkshopFramework(),
    honestState: { productionAuthorized: false, noInventedBankData: true, noInventedParticipants: true, architectureNotModified: true },
  });
}
