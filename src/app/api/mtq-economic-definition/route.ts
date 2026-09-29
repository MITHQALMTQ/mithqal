import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  MTQ_ECONOMIC_DEFINITION,
  getMTQCanonicalDescription,
  getMTQCanonicalDescriptionLong,
  getMTQIsStatements,
  getMTQIsNotStatements,
  getPARDefinition,
  getLegalClassificationRule,
  MTQ_ECONOMIC_DEFINITION_STATUS,
  MTQ_ECONOMIC_DEFINITION_VERSION,
  MTQ_ECONOMIC_DEFINITION_SOURCE,
} from "@/lib/mtq-economic-definition";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("mtq-economic-definition", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      definitionSource: MTQ_ECONOMIC_DEFINITION_SOURCE,
      definitionVersion: MTQ_ECONOMIC_DEFINITION_VERSION,
      status: MTQ_ECONOMIC_DEFINITION_STATUS,
      overrideRule:
        "This is the SINGLE CANONICAL SOURCE for MTQ's economic identity. Any inline MTQ economic description elsewhere is a CONTRADICTION.",
    },
    canonicalDescription: getMTQCanonicalDescription(),
    canonicalDescriptionLong: getMTQCanonicalDescriptionLong(),
    isStatements: getMTQIsStatements(),
    isNotStatements: getMTQIsNotStatements(),
    parDefinition: getPARDefinition(),
    legalClassification: {
      status: MTQ_ECONOMIC_DEFINITION.legalClassification.status,
      rule: getLegalClassificationRule(),
      claimsForbidden: MTQ_ECONOMIC_DEFINITION.legalClassification.claimsForbidden,
    },
    sourceLayers: MTQ_ECONOMIC_DEFINITION.sourceLayers,
  });
}
