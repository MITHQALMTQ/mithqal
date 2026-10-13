import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  FROZEN_SCHEMAS,
  CHANGE_PROCESS,
  ENFORCEMENT_RULE,
  getFrozenSchema,
  isSchemaFrozen,
  requiresChangeProcess,
  ARCHITECTURE_FREEZE_STATUS,
  ARCHITECTURE_FREEZE_VERSION,
  ARCHITECTURE_FREEZE_SOURCE,
  FROZEN_SCHEMA_COUNT,
  CHANGE_PROCESS_STEP_COUNT,
  type FrozenSchemaId,
} from "@/lib/controlled-architecture-freeze";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("architecture-freeze", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const schemaId = url.searchParams.get("schemaId") as FrozenSchemaId | null;

  if (schemaId) {
    const schema = getFrozenSchema(schemaId);
    if (!schema) {
      return NextResponse.json({ error: `Invalid schemaId: ${schemaId}` }, { status: 400 });
    }
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: ARCHITECTURE_FREEZE_SOURCE },
      schema,
      isFrozen: isSchemaFrozen(schemaId),
      requiresChangeProcess: requiresChangeProcess(schemaId),
    });
  }

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: ARCHITECTURE_FREEZE_SOURCE,
      version: ARCHITECTURE_FREEZE_VERSION,
      status: ARCHITECTURE_FREEZE_STATUS,
      overrideRule: "Controlled Architecture Freeze. 10 frozen schemas. 7-step change process. No feature development may modify constitutional/institutional-control logic without the full process.",
      enforcementRule: ENFORCEMENT_RULE.rule,
      noFeatureDevelopmentOnConstitutionalLogic: ENFORCEMENT_RULE.noFeatureDevelopmentOnConstitutionalLogic,
    },
    frozenSchemaCount: FROZEN_SCHEMA_COUNT,
    changeProcessStepCount: CHANGE_PROCESS_STEP_COUNT,
    frozenSchemas: FROZEN_SCHEMAS,
    changeProcess: CHANGE_PROCESS,
    enforcementRule: ENFORCEMENT_RULE,
    rule: "From this point forward, every architectural change requires: CHANGE REQUEST -> IMPACT ANALYSIS -> REVIEW -> APPROVAL -> VERSION -> TEST -> EVIDENCE. No feature development may modify constitutional or institutional-control logic without this process.",
  });
}
