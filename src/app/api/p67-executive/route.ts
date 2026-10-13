import { NextResponse } from "next/server";
import { getBankExecutivePackage, P67_META } from "@/lib/p67-bank-executive-package";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    ok: true, meta: P67_META, pack: getBankExecutivePackage(),
    honestState: { productionAuthorized: false, nonPromotional: true, architectureNotModified: true, evidenceTraceable: true },
  });
}
