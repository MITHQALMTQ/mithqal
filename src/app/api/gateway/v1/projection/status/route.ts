// GET /api/gateway/v1/projection/status
// v26.0 §6.8 — Projection watermarks (5 projections, all initially STALE in Pilot A).
import { NextResponse } from "next/server";
import { getWriterStatusSummary, type ProjectionWatermark } from "@/lib/db-authoritative";

const STALE_PROJECTIONS: ProjectionWatermark[] = [
  {
    projectionName: "instruction-list-by-institution",
    lastAppliedEventId: "(none)",
    lastAppliedSequence: -1,
    sourceSnapshotVersion: "(none)",
    updatedAt: new Date(0).toISOString(),
    projectionSchemaVersion: "1.0.0",
    isStale: true,
    lagMs: Number.POSITIVE_INFINITY,
  },
  {
    projectionName: "outbox-dispatch-state",
    lastAppliedEventId: "(none)",
    lastAppliedSequence: -1,
    sourceSnapshotVersion: "(none)",
    updatedAt: new Date(0).toISOString(),
    projectionSchemaVersion: "1.0.0",
    isStale: true,
    lagMs: Number.POSITIVE_INFINITY,
  },
  {
    projectionName: "evidence-artifact-by-claim",
    lastAppliedEventId: "(none)",
    lastAppliedSequence: -1,
    sourceSnapshotVersion: "(none)",
    updatedAt: new Date(0).toISOString(),
    projectionSchemaVersion: "1.0.0",
    isStale: true,
    lagMs: Number.POSITIVE_INFINITY,
  },
  {
    projectionName: "gate-decision-latest",
    lastAppliedEventId: "(none)",
    lastAppliedSequence: -1,
    sourceSnapshotVersion: "(none)",
    updatedAt: new Date(0).toISOString(),
    projectionSchemaVersion: "1.0.0",
    isStale: true,
    lagMs: Number.POSITIVE_INFINITY,
  },
  {
    projectionName: "reconciliation-case-open",
    lastAppliedEventId: "(none)",
    lastAppliedSequence: -1,
    sourceSnapshotVersion: "(none)",
    updatedAt: new Date(0).toISOString(),
    projectionSchemaVersion: "1.0.0",
    isStale: true,
    lagMs: Number.POSITIVE_INFINITY,
  },
];

export async function GET() {
  const writerSummary = getWriterStatusSummary();
  return NextResponse.json(
    {
      status: "OK",
      honestState: writerSummary.honestState,
      demoOnly: writerSummary.demoOnly,
      productionAuthorized: writerSummary.productionAuthorized,
      authoritativeBackend: writerSummary.authoritativeBackend,
      projectionBackend: writerSummary.projectionBackend,
      watermarks: STALE_PROJECTIONS,
      slo: {
        maxLagMs: 1000,
        blueprintRef: "v26.0 §5.3 EVENTUAL_CONSISTENCY_PROJECTION + §6.8",
      },
      notes: [
        "All 5 projections are STALE in Pilot A: the dispatcher is pending (§11.4 OD-007).",
        "Reads should route to the authoritative writer (Neon) while projections are STALE.",
        "When a projection's lagMs exceeds the 1000 ms SLO, the projection is marked STALE and reads flip back to Neon.",
      ],
      blueprintRef: "v26.0 §6.8 + §5.3 + §11.4 OD-007",
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "X-Endpoint-Status": "OK" } },
  );
}
