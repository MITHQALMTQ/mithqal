import { NextResponse } from "next/server";
import { getCombinedPack, PACK_META } from "@/lib/corridor-decision-and-bank-pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: PACK_META,
    pack: getCombinedPack(),
    honestState: {
      productionAuthorized: false,
      architectureNotModified: true,
      noCorridorValidated: true,
      noFabricatedContacts: true,
    },
  });
}
