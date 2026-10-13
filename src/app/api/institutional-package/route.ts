import { NextResponse } from "next/server";
import { getInstitutionalPackage, PACKAGE_GENERATOR_META } from "@/lib/institutional-package-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: PACKAGE_GENERATOR_META,
    package: getInstitutionalPackage(),
    honestState: {
      allDocumentsDeriveFromCanonical: true,
      noDocumentIntroducesNewContent: true,
      productionAuthorized: false,
    },
  });
}
