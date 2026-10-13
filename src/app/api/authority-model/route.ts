import { NextResponse } from "next/server";
import {
  getAuthorityModelSummary,
  CURRENT_CLAIMS,
  FORBIDDEN_EQUIVALENCES,
  CONFLICT_HIERARCHY,
  AUTHORITY_MODEL_META,
} from "@/lib/definitive-authority-model";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    meta: AUTHORITY_MODEL_META,
    summary: getAuthorityModelSummary(),
    forbiddenEquivalences: FORBIDDEN_EQUIVALENCES,
    conflictHierarchy: CONFLICT_HIERARCHY,
    currentClaims: CURRENT_CLAIMS,
    honestState: {
      noCodeTreatedAsLegalAuthority: true,
      noTestTreatedAsInstitutionalValidation: true,
      noConfigTreatedAsRegulatoryAuthorization: true,
      noDocumentTreatedAsExecutionTruth: true,
      externallyValidatedClaims: 0,
      totalClaims: CURRENT_CLAIMS.length,
      productionAuthorized: false,
    },
  });
}
