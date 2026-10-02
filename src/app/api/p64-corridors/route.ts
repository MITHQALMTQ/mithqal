import { NextResponse } from "next/server";
import { getCorridorDecisionPack, P64_META } from "@/lib/p64-corridor-decision-pack";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    ok: true, meta: P64_META, pack: getCorridorDecisionPack(),
    honestState: { productionAuthorized: false, noInventedNumbers: true, uncertaintyPreserved: true, architectureNotModified: true },
  });
}
