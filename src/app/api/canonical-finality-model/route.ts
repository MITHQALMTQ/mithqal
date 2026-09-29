// src/app/api/canonical-finality-model/route.ts
//
// MITHQAL v25.3.8 — Canonical Finality Model endpoint.
// Per N-directive (trace 1a0ee5f25d2fbe79):
//   "Create one canonical finality model. Use: F0-F7 (8 stages).
//    Explicitly distinguish: technical finality, banking finality, legal finality.
//    Use 'finality-coordinated settlement' when a common legal finality domain
//    does not exist. Use 'atomic settlement' only when the transaction actually
//    executes within a legally supported shared finality domain.
//    Update all marketing language, examples and tests."
//
// Public GET endpoint exposing the canonical finality model defined in
// src/lib/canonical-finality-model.ts (single canonical source). All
// downstream marketing / dashboard / OS pages MUST consume this endpoint
// rather than inline finality-stage definitions.

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  CANONICAL_FINALITY_STAGES,
  FINALITY_TYPES,
  SETTLEMENT_MODES,
  determineSettlementMode,
  getFinalityStage,
  getFinalityStagesByType,
  getFinalityTypeDefinition,
  getSettlementMode,
  getCanonicalFinalityModelSummary,
  CANONICAL_FINALITY_MODEL_STATUS,
  CANONICAL_FINALITY_MODEL_VERSION,
  CANONICAL_FINALITY_MODEL_SOURCE,
  type FinalityStageId,
  type FinalityType,
  type SettlementMode,
} from "@/lib/canonical-finality-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // R11: 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("canonical-finality-model", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const stageId = url.searchParams.get("stage") as FinalityStageId | null;
  const type = url.searchParams.get("type") as FinalityType | null;
  const mode = url.searchParams.get("mode") as SettlementMode | null;
  const determineMode = url.searchParams.get("determineMode") === "true";
  const senderJurisdiction = url.searchParams.get("senderJurisdiction") || "US";
  const receiverJurisdiction = url.searchParams.get("receiverJurisdiction") || "AE";
  const mithqalJurisdiction = url.searchParams.get("mithqalJurisdiction") || "US";
  const intermediaryRaw = url.searchParams.get("intermediaryJurisdictions");
  const intermediaryJurisdictions = intermediaryRaw
    ? intermediaryRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  // Single-stage lookup: ?stage=F4
  if (stageId) {
    const stage = getFinalityStage(stageId);
    if (!stage) {
      return NextResponse.json(
        { ok: false, error: `Invalid stage: ${stageId}. Valid: F0-F7` },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      _meta: {
        activeModel: "v25.3.8",
        modelSource: CANONICAL_FINALITY_MODEL_SOURCE,
        modelVersion: CANONICAL_FINALITY_MODEL_VERSION,
        status: CANONICAL_FINALITY_MODEL_STATUS,
      },
      stage,
    });
  }

  // Filter by finality type: ?type=TECHNICAL
  if (type) {
    const typeDef = getFinalityTypeDefinition(type);
    if (!typeDef) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid type: ${type}. Valid: TECHNICAL, BANKING, LEGAL`,
        },
        { status: 400 }
      );
    }
    const stages = getFinalityStagesByType(type);
    return NextResponse.json({
      ok: true,
      _meta: {
        activeModel: "v25.3.8",
        modelSource: CANONICAL_FINALITY_MODEL_SOURCE,
        modelVersion: CANONICAL_FINALITY_MODEL_VERSION,
        status: CANONICAL_FINALITY_MODEL_STATUS,
      },
      type: typeDef,
      stages,
    });
  }

  // Settlement mode lookup: ?mode=ATOMIC
  if (mode) {
    const modeDef = getSettlementMode(mode);
    if (!modeDef) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid mode: ${mode}. Valid: FINALITY_COORDINATED, ATOMIC`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      _meta: {
        activeModel: "v25.3.8",
        modelSource: CANONICAL_FINALITY_MODEL_SOURCE,
        modelVersion: CANONICAL_FINALITY_MODEL_VERSION,
        status: CANONICAL_FINALITY_MODEL_STATUS,
      },
      mode: modeDef,
    });
  }

  // Determine settlement mode for a transaction:
  // ?determineMode=true&senderJurisdiction=CN&receiverJurisdiction=AE&mithqalJurisdiction=US
  if (determineMode) {
    const determinedMode = determineSettlementMode({
      senderJurisdiction,
      receiverJurisdiction,
      mithqalJurisdiction,
      intermediaryJurisdictions,
    });
    return NextResponse.json({
      ok: true,
      _meta: {
        activeModel: "v25.3.8",
        modelSource: CANONICAL_FINALITY_MODEL_SOURCE,
        modelVersion: CANONICAL_FINALITY_MODEL_VERSION,
        status: CANONICAL_FINALITY_MODEL_STATUS,
      },
      inputs: { senderJurisdiction, receiverJurisdiction, mithqalJurisdiction, intermediaryJurisdictions },
      determinedMode,
      modeDefinition: getSettlementMode(determinedMode),
      rule:
        determinedMode === "ATOMIC"
          ? "Atomic settlement — all parties in a single shared legal finality domain (per N-directive: 'only when the transaction actually executes within a legally supported shared finality domain')."
          : "Finality-coordinated settlement — parties span multiple legal finality domains (per N-directive: 'when a common legal finality domain does not exist').",
    });
  }

  // Default: return everything (single canonical source)
  const summary = getCanonicalFinalityModelSummary();
  return NextResponse.json({
    ok: true,
    _meta: {
      activeModel: "v25.3.8",
      modelSource: CANONICAL_FINALITY_MODEL_SOURCE,
      modelVersion: CANONICAL_FINALITY_MODEL_VERSION,
      status: CANONICAL_FINALITY_MODEL_STATUS,
      overrideRule:
        "One canonical finality model. F0-F7 (8 stages). 3 finality types (technical, banking, legal). " +
        "Finality-coordinated vs atomic settlement distinguished.",
      taskId: "N1",
      taskTrace: "1a0ee5f25d2fbe79",
    },
    finalityTypes: FINALITY_TYPES,
    stages: CANONICAL_FINALITY_STAGES,
    settlementModes: SETTLEMENT_MODES,
    rule: summary.rule,
    overlayRule: summary.overlayRule,
    honestState: summary.honestState,
  });
}
