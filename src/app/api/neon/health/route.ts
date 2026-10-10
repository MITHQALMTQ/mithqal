// GET /api/neon/health
// v26.0 §6.1 + §11.3 D-006 — Canonical Neon authoritative writer health probe.
import { NextResponse } from "next/server";
import { canPingNeon, listNeonTables, getCanonicalPrisma } from "@/lib/prisma-canonical";
import { getWriterStatusSummary } from "@/lib/db-authoritative";

const CANONICAL_TABLES = [
  "Instruction",
  "OutboxEvent",
  "InboxEvent",
  "IdempotencyRecord",
  "PolicyDecision",
  "EvidenceArtifact",
  "GateDecision",
  "ReconciliationCase",
  "ProjectionWatermark",
] as const;

function isNeonBackend(): boolean {
  const backend = (process.env.DATABASE_BACKEND ?? "").trim().toLowerCase();
  const url = process.env.DATABASE_URL ?? "";
  return backend === "neon" || url.startsWith("postgresql://") || url.startsWith("postgres://");
}

export async function GET() {
  const writerSummary = getWriterStatusSummary();

  if (!isNeonBackend()) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        honestState: writerSummary.honestState,
        reason:
          "DATABASE_BACKEND is not 'neon' or DATABASE_URL does not start with postgresql:// — Neon is not authoritative.",
        connectivity: null,
        schema: null,
        canonicalRowCount: null,
      },
      { status: 503, headers: { "X-Health-Status": "BLOCKED" } },
    );
  }

  const ping = await canPingNeon();
  if (!ping.ok) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        honestState: writerSummary.honestState,
        reason: `Neon ping failed: ${ping.error ?? "unknown"}`,
        connectivity: { ok: false, latencyMs: ping.latencyMs, error: ping.error ?? null },
        schema: null,
        canonicalRowCount: null,
      },
      { status: 503, headers: { "X-Health-Status": "BLOCKED" } },
    );
  }

  const tables = await listNeonTables();
  if (!tables.ok) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        honestState: writerSummary.honestState,
        reason: `information_schema read failed: ${tables.error ?? "unknown"}`,
        connectivity: { ok: true, latencyMs: ping.latencyMs, error: null },
        schema: { ok: false, error: tables.error ?? null, tables: [] },
        canonicalRowCount: null,
      },
      { status: 503, headers: { "X-Health-Status": "BLOCKED" } },
    );
  }

  const observed = new Set(tables.tables.map((t) => t.tableName.toLowerCase()));
  const missingCanonical = CANONICAL_TABLES.filter(
    (t) => !observed.has(t.toLowerCase()),
  );
  const schemaStatus = missingCanonical.length === 0 ? "VERIFIED" : "PARTIAL";

  // Count rows in the four core authoritative tables.
  let canonicalRowCount: {
    Instruction: number | null;
    OutboxEvent: number | null;
    EvidenceArtifact: number | null;
    GateDecision: number | null;
  } = {
    Instruction: null,
    OutboxEvent: null,
    EvidenceArtifact: null,
    GateDecision: null,
  };

  if (schemaStatus === "VERIFIED") {
    const prisma = getCanonicalPrisma();
    const [instruction, outbox, evidence, gate] = await Promise.all([
      prisma.instruction.count().catch(() => null),
      prisma.outboxEvent.count().catch(() => null),
      prisma.evidenceArtifact.count().catch(() => null),
      prisma.gateDecision.count().catch(() => null),
    ]);
    canonicalRowCount = {
      Instruction: instruction,
      OutboxEvent: outbox,
      EvidenceArtifact: evidence,
      GateDecision: gate,
    };
  }

  return NextResponse.json(
    {
      status: "VERIFIED",
      honestState: writerSummary.honestState,
      backend: writerSummary.authoritativeBackend,
      projection: writerSummary.projectionBackend,
      demoOnly: writerSummary.demoOnly,
      productionAuthorized: writerSummary.productionAuthorized,
      connectivity: { ok: true, latencyMs: ping.latencyMs, error: null },
      schema: {
        ok: true,
        status: schemaStatus,
        canonicalTablesExpected: CANONICAL_TABLES,
        canonicalTablesMissing: missingCanonical,
        observedTables: tables.tables.map((t) => ({
          name: t.tableName,
          schema: t.tableSchema,
          type: t.tableType,
        })),
      },
      canonicalRowCount,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "X-Health-Status": "VERIFIED" } },
  );
}
