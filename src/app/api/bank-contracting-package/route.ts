import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  BANK_CONTRACTING_PACKAGE,
  NO_CONTRACT_WITHOUT_EVIDENCE_RULE,
  CONTRACTING_PACKAGE_STATUS,
  CONTRACTING_PACKAGE_VERSION,
  CONTRACTING_PACKAGE_SOURCE,
  CONTRACT_SECTION_COUNT,
} from "@/lib/bank-contracting-package";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "bank-contracting-package",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.18",
      source: CONTRACTING_PACKAGE_SOURCE,
      version: CONTRACTING_PACKAGE_VERSION,
      status: CONTRACTING_PACKAGE_STATUS,
      changeRequest: "CR-2026-004 (per Architecture Freeze v25.3.15)",
      overrideRule:
        "Bank Contracting Package. 17 sections. Legal/commercial checklist + term-sheet framework, NOT a legal opinion. No SIGNED/ACTIVE/VALIDATED without executed evidence.",
      noContractWithoutEvidenceRule: NO_CONTRACT_WITHOUT_EVIDENCE_RULE.rule,
    },
    sectionCount: CONTRACT_SECTION_COUNT,
    sections: BANK_CONTRACTING_PACKAGE,
    noContractWithoutEvidenceRule: NO_CONTRACT_WITHOUT_EVIDENCE_RULE,
    rule: "All 17 sections = DRAFT. 0 SIGNED. 0 ACTIVE. 0 VALIDATED. Honest state — no bank contract executed.",
  });
}
