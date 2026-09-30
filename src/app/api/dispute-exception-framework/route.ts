import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DISPUTE_FRAMEWORK,
  DISPUTE_TYPES,
  LIFECYCLE_STAGES,
  MITHQAL_COORDINATION_RULE,
  LIFECYCLE_STAGE_FIELDS,
  DISPUTE_TYPE_FIELDS,
  getDisputeType,
  getDisputeStage,
  getDisputesByResolutionAuthority,
  DISPUTE_FRAMEWORK_STATUS,
  DISPUTE_FRAMEWORK_VERSION,
  DISPUTE_FRAMEWORK_SOURCE,
  DISPUTE_TYPE_COUNT,
  LIFECYCLE_STAGE_COUNT,
  DISPUTE_LIFECYCLE_CELL_COUNT,
  type DisputeTypeId,
  type LifecycleStageId,
} from "@/lib/dispute-exception-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Standard 30 req/min per-IP rate limit per directive.
  const rateLimited = enforceRateLimit(
    "dispute-exception-framework",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const typeId = url.searchParams.get("typeId") as DisputeTypeId | null;
  const stageId = url.searchParams.get("stageId") as LifecycleStageId | null;
  const resolutionAuthority = url.searchParams.get("resolutionAuthority");

  // Single-stage lookup by (typeId, stageId)
  if (typeId && stageId) {
    const validTypes = DISPUTE_TYPES.map((d) => d.id);
    const validStages = LIFECYCLE_STAGES.map((s) => s.id);
    if (!validTypes.includes(typeId)) {
      return NextResponse.json(
        { error: `Invalid typeId: ${typeId}` },
        { status: 400 },
      );
    }
    if (!validStages.includes(stageId)) {
      return NextResponse.json(
        { error: `Invalid stageId: ${stageId}` },
        { status: 400 },
      );
    }
    const stage = getDisputeStage(typeId, stageId);
    if (!stage) {
      return NextResponse.json(
        { error: `Stage not found: ${typeId} × ${stageId}` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: DISPUTE_FRAMEWORK_SOURCE,
      },
      stage,
    });
  }

  // Single-type lookup by typeId
  if (typeId) {
    const validTypes = DISPUTE_TYPES.map((d) => d.id);
    if (!validTypes.includes(typeId)) {
      return NextResponse.json(
        { error: `Invalid typeId: ${typeId}` },
        { status: 400 },
      );
    }
    const disputeType = getDisputeType(typeId);
    if (!disputeType) {
      return NextResponse.json(
        { error: `Dispute type not found: ${typeId}` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: DISPUTE_FRAMEWORK_SOURCE,
      },
      typeId,
      typeCount: 1,
      disputeType,
    });
  }

  // Resolution-authority filter
  if (resolutionAuthority) {
    const disputes = getDisputesByResolutionAuthority(resolutionAuthority);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: DISPUTE_FRAMEWORK_SOURCE,
      },
      resolutionAuthoritySubstring: resolutionAuthority,
      disputeCount: disputes.length,
      disputes,
    });
  }

  // Default — full framework
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.19",
      source: DISPUTE_FRAMEWORK_SOURCE,
      version: DISPUTE_FRAMEWORK_VERSION,
      status: DISPUTE_FRAMEWORK_STATUS,
      overrideRule:
        "Dispute & Exception Framework — 7 dispute types × 9-stage lifecycle = 63 cells. ALL dispute types have resolution authority != MITHQAL. MITHQAL coordinates evidence + workflow but must NOT present itself as an arbitrator, court or commercial dispute adjudicator.",
      changeRequest: "CR-2026-009 (per Architecture Freeze v25.3.15)",
    },
    disputeTypeCount: DISPUTE_TYPE_COUNT,
    lifecycleStageCount: LIFECYCLE_STAGE_COUNT,
    cellCount: DISPUTE_LIFECYCLE_CELL_COUNT,
    disputeTypes: DISPUTE_TYPES,
    lifecycleStages: LIFECYCLE_STAGES,
    framework: DISPUTE_FRAMEWORK,
    disputeTypeFields: DISPUTE_TYPE_FIELDS,
    lifecycleStageFields: LIFECYCLE_STAGE_FIELDS,
    mithqalCoordinationRule: MITHQAL_COORDINATION_RULE,
    rule: "Per PROMPT 33: 'Create a formal dispute and exception framework. Separate: technical incident, reconciliation exception, settlement instruction dispute, unauthorized transaction, duplicate transaction, bank-versus-bank operational dispute, legal dispute. For each define: detection -> freeze/safe handling -> evidence capture -> notification -> investigation -> correction/rollback where legally permitted -> escalation -> resolution authority -> final record. MITHQAL must coordinate evidence and workflow but must NOT present itself as an arbitrator, court or commercial dispute adjudicator.'",
  });
}
