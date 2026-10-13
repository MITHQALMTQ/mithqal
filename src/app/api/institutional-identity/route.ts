import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  INSTITUTIONAL_PRESENCE_STANDARDS,
  NEVER_INVENT_RULE,
  INSTITUTIONAL_IDENTITY_STATUS,
  INSTITUTIONAL_IDENTITY_VERSION,
  INSTITUTIONAL_IDENTITY_SOURCE,
  PRESENCE_STANDARD_COUNT,
} from "@/lib/institutional-external-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "institutional-identity",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.18",
      source: INSTITUTIONAL_IDENTITY_SOURCE,
      version: INSTITUTIONAL_IDENTITY_VERSION,
      status: INSTITUTIONAL_IDENTITY_STATUS,
      changeRequest: "CR-2026-005 (per Architecture Freeze v25.3.15)",
      overrideRule:
        "Institutional Presence Standard. 8 standards. Never invent legal entity/domain/address/regulatory status. PENDING_ENTITY_IDENTITY until finalized.",
      neverInventRule: NEVER_INVENT_RULE.rule,
    },
    standardCount: PRESENCE_STANDARD_COUNT,
    standards: INSTITUTIONAL_PRESENCE_STANDARDS,
    neverInventRule: NEVER_INVENT_RULE,
    rule: "Replace informal/personal contact with controlled organizational identity. PENDING_ENTITY_IDENTITY until contracting entity finalized.",
  });
}
