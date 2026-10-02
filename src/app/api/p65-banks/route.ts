import { NextResponse } from "next/server";
import { getBankPipeline, P65_META } from "@/lib/p65-bank-pipeline";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    ok: true, meta: P65_META, pipeline: getBankPipeline(),
    honestState: { productionAuthorized: false, noFabricatedContacts: true, noFakePartnerships: true, architectureNotModified: true },
  });
}
