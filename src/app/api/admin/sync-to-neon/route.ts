import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncAllTablesToNeon, TURSO_TABLE_COUNT } from "@/lib/turso-neon-sync";

/**
 * POST /api/admin/sync-to-neon — admin-only full Turso→Neon CDC sync.
 *
 * CR-2026-026 (v25.3.22): triggers a one-shot full-table copy of every
 * Turso table into the Neon Postgres analytics replica. The sync is
 * NOT a streaming CDC — it is a DESIGN-TIME mechanism for analytics.
 * Not production-authorized. See `src/lib/turso-neon-sync.ts` for the
 * honest-state comment + algorithm.
 *
 * Auth:
 *   Same gate as every other /api/admin/* route — `getServerSession`
 *   + authOptions. Operators must be logged in via the admin login
 *   flow (NextAuth credentials provider + 2FA per `src/lib/auth.ts`).
 *
 * Graceful degradation:
 *   - If `NEON_DATABASE_URL` is unset → every table's summary returns
 *     `{ synced: 0, errors: ["Neon not configured"] }`. The endpoint
 *     still returns 200 so the operator can see the structured state
 *     in the admin UI; the response `neonConfigured` flag is `false`.
 *   - If the operator is not authenticated → 401.
 *
 * Response shape:
 *   {
 *     ok: true,
 *     startedAt: ISO-8601,
 *     durationMs: number,
 *     neonConfigured: boolean,
 *     tableCount: number,                 // TURSO_TABLE_COUNT (19 as of v25.3.22)
 *     tables: TableSyncResult[]           // per-table summary
 *     totals: { synced, readFromTurso, errors }
 *   }
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const neonConfigured = !!process.env.NEON_DATABASE_URL;

  // Sync all tables concurrently. `syncTableToNeon` never throws, so a
  // slow / errored table never short-circuits the others.
  const tables = await syncAllTablesToNeon();

  const totals = tables.reduce(
    (acc, t) => {
      acc.synced += t.synced;
      acc.readFromTurso += t.readFromTurso;
      acc.errors += t.errors.length;
      return acc;
    },
    { synced: 0, readFromTurso: 0, errors: 0 },
  );

  return NextResponse.json({
    ok: true,
    startedAt,
    durationMs: Date.now() - startMs,
    neonConfigured,
    // Honest-state: 19 tables synced (task spec said 17 — discrepancy
    // honestly reported in the worklog entry for task 4-C; the actual
    // Turso schema in src/lib/db.ts has 19 tables defined).
    tableCount: TURSO_TABLE_COUNT,
    tables,
    totals,
    // Honest-state banner.
    _honestState:
      "CDC sync is a DESIGN-TIME mechanism for analytics. Not production-authorized.",
    triggeredBy: session.user?.email ?? "unknown",
  });
}
