import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  CONTINUITY_EVENTS,
  RESPONSE_LIFECYCLE,
  NO_BYPASS_RULE,
  getEvent,
  getResponseStage,
  getResponseLifecycleForEvent,
  SETTLEMENT_CONTINUITY_FABRIC_STATUS,
  SETTLEMENT_CONTINUITY_FABRIC_VERSION,
  SETTLEMENT_CONTINUITY_FABRIC_SOURCE,
  EVENT_COUNT,
  LIFECYCLE_STAGE_COUNT,
  type ContinuityEventId,
} from "@/lib/settlement-continuity-fabric";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/settlement-continuity-fabric
//   Default: returns the 9 continuity events + 7-stage lifecycle + no-bypass rule.
// GET /api/settlement-continuity-fabric?eventId=X
//   Returns a single event + the 7-stage lifecycle applicable to it.
// GET /api/settlement-continuity-fabric?stageId=X
//   Returns a single lifecycle stage definition.

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "settlement-continuity-fabric",
    request,
    30,
    60_000
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId") as ContinuityEventId | null;
  const stageId = url.searchParams.get("stageId") as
    | (typeof RESPONSE_LIFECYCLE)[number]["stageId"]
    | null;

  // ?stageId=X — single stage lookup (highest precedence — narrowest filter)
  if (stageId) {
    const stage = getResponseStage(stageId);
    if (!stage) {
      return NextResponse.json(
        {
          error: `Invalid stageId: ${stageId}`,
          validStageIds: RESPONSE_LIFECYCLE.map((s) => s.stageId),
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: SETTLEMENT_CONTINUITY_FABRIC_SOURCE,
        version: SETTLEMENT_CONTINUITY_FABRIC_VERSION,
        status: SETTLEMENT_CONTINUITY_FABRIC_STATUS,
        noBypassRule: NO_BYPASS_RULE,
      },
      stage,
    });
  }

  // ?eventId=X — event + its 7-stage lifecycle
  if (eventId) {
    const event = getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        {
          error: `Invalid eventId: ${eventId}`,
          validEventIds: CONTINUITY_EVENTS.map((e) => e.eventId),
        },
        { status: 404 }
      );
    }
    const result = getResponseLifecycleForEvent(eventId);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: SETTLEMENT_CONTINUITY_FABRIC_SOURCE,
        version: SETTLEMENT_CONTINUITY_FABRIC_VERSION,
        status: SETTLEMENT_CONTINUITY_FABRIC_STATUS,
        noBypassRule: NO_BYPASS_RULE,
      },
      event: result.event,
      lifecycle: result.lifecycle,
      noBypassRule: result.noBypassRule,
    });
  }

  // Default — full fabric surface
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: SETTLEMENT_CONTINUITY_FABRIC_SOURCE,
      version: SETTLEMENT_CONTINUITY_FABRIC_VERSION,
      status: SETTLEMENT_CONTINUITY_FABRIC_STATUS,
      overrideRule:
        "SettlementContinuityFabric. 9 event types × 7-stage lifecycle. No automatic rerouting may bypass legal/compliance/authorization/finality controls.",
      noBypassRule: NO_BYPASS_RULE,
    },
    eventCount: EVENT_COUNT,
    lifecycleStageCount: LIFECYCLE_STAGE_COUNT,
    events: CONTINUITY_EVENTS,
    lifecycle: RESPONSE_LIFECYCLE,
    rule: "For each event: DETECT -> FREEZE/SAFE-HALT -> ASSESS -> ALTERNATIVE ROUTE -> RESUME -> RECONCILE -> EVIDENCE. No automatic rerouting may bypass legal, compliance, authorization or finality controls.",
  });
}
