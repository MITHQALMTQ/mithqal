import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  replayDecisionContext,
  REGULATORY_REPLAY_ENGINE_STATUS,
  REGULATORY_REPLAY_ENGINE_VERSION,
  REGULATORY_REPLAY_ENGINE_SOURCE,
  DECISION_CONTEXT_FIELD_COUNT,
  DECISION_CONTEXT_FIELDS,
  REPLAY_IS_READ_ONLY_RULE,
  HISTORICAL_STATE_IMMUTABLE_RULE,
} from "@/lib/regulatory-replay-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/regulatory-replay?transactionId=X
// Reconstructs the exact decision context for a transaction.
// READ-ONLY — does NOT change historical state.

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "regulatory-replay",
    request,
    30,
    60_000
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId");

  if (!transactionId) {
    // Default: return schema
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: REGULATORY_REPLAY_ENGINE_SOURCE,
        version: REGULATORY_REPLAY_ENGINE_VERSION,
        status: REGULATORY_REPLAY_ENGINE_STATUS,
        overrideRule:
          "RegulatoryReplayEngine. Given a transaction ID, reconstructs the exact decision context (12 fields). READ-ONLY — does NOT change historical state.",
        replayIsReadOnlyRule: REPLAY_IS_READ_ONLY_RULE,
        historicalStateImmutableRule: HISTORICAL_STATE_IMMUTABLE_RULE,
      },
      fieldCount: DECISION_CONTEXT_FIELD_COUNT,
      fields: DECISION_CONTEXT_FIELDS,
      rule: "Use ?transactionId=X to replay the decision context for a specific transaction. The replay is READ-ONLY — historical state is NOT modified. The replay reads from the Institutional Evidence Fabric (per v25.3.8).",
    });
  }

  // Replay the decision context (READ-ONLY — no writes, no side effects)
  const result = replayDecisionContext(transactionId);

  if (!result.evidencePackageFound) {
    return NextResponse.json(
      {
        _meta: {
          activeModel: "v25.3.2",
          source: REGULATORY_REPLAY_ENGINE_SOURCE,
        },
        ...result,
        rule: "Evidence package not found. Use POST /api/evidence-fabric to generate an evidence package first.",
      },
      { status: 404 }
    );
  }

  // Defensive guard: verify the read-only contract holds before serving the
  // result. The directive is non-negotiable — "The replay must reproduce
  // the decision without changing historical state." If the engine ever
  // returned replayIsReadOnly=false or historicalStateUnchanged=false, we
  // refuse to serve the replay and return a 500 (so a contract regression
  // can never silently leak a historical-state mutation to a supervisor).
  if (!result.replayIsReadOnly || !result.historicalStateUnchanged) {
    return NextResponse.json(
      {
        _meta: {
          activeModel: "v25.3.2",
          source: REGULATORY_REPLAY_ENGINE_SOURCE,
        },
        transactionId,
        error:
          "Replay contract violation: replayIsReadOnly or historicalStateUnchanged was false. Refusing to serve the replay result.",
        replayIsReadOnly: result.replayIsReadOnly,
        historicalStateUnchanged: result.historicalStateUnchanged,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: REGULATORY_REPLAY_ENGINE_SOURCE,
      version: REGULATORY_REPLAY_ENGINE_VERSION,
      status: REGULATORY_REPLAY_ENGINE_STATUS,
      replayIsReadOnly: result.replayIsReadOnly,
      historicalStateUnchanged: result.historicalStateUnchanged,
      replayIsReadOnlyRule: REPLAY_IS_READ_ONLY_RULE,
      historicalStateImmutableRule: HISTORICAL_STATE_IMMUTABLE_RULE,
    },
    ...result,
  });
}
