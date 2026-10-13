/**
 * MITHQAL v26.0 §6.1 — Canonical Prisma Client
 *
 * Single shared PrismaClient instance wired to the authoritative
 * Postgres connection (Neon). Projections (Turso) are read via a
 * separate client and are never used for authoritative writes.
 *
 * Blueprint: §6.1 + §6.8 + Appendix B
 */

import { PrismaClient } from "@prisma/client";

let canonicalInstance: PrismaClient | null = null;

/**
 * Return the shared PrismaClient instance. The instance is created
 * lazily on first use and re-used for the lifetime of the process.
 * The connection is taken from DATABASE_URL (Neon Postgres).
 */
export function getCanonicalPrisma(): PrismaClient {
  if (canonicalInstance) {
    return canonicalInstance;
  }
  canonicalInstance = new PrismaClient();
  return canonicalInstance;
}

/**
 * Issue a low-cost `SELECT 1 AS one` against the authoritative
 * connection. Returns true on success, false on any error.
 *
 * Used by the Neon health endpoint and by startup probes.
 */
export async function canPingNeon(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = Date.now();
  try {
    const prisma = getCanonicalPrisma();
    const rows = await prisma.$queryRaw`SELECT 1 AS one`;
    const latencyMs = Date.now() - started;
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, latencyMs, error: "Expected at least one row from SELECT 1" };
    }
    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - started;
    return {
      ok: false,
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown Prisma error",
    };
  }
}

export interface NeonTableListing {
  tableName: string;
  tableSchema: string;
  tableType: string;
}

/**
 * List tables visible in the `information_schema.tables` view of the
 * authoritative connection. Used by the Neon health endpoint to
 * verify that the canonical schema has been pushed.
 */
export async function listNeonTables(): Promise<{
  ok: boolean;
  tables: NeonTableListing[];
  error?: string;
}> {
  try {
    const prisma = getCanonicalPrisma();
    const rows = (await prisma.$queryRaw`
      SELECT table_name, table_schema, table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `) as Array<{ table_name: string; table_schema: string; table_type: string }>;
    return {
      ok: true,
      tables: rows.map((r) => ({
        tableName: r.table_name,
        tableSchema: r.table_schema,
        tableType: r.table_type,
      })),
    };
  } catch (err) {
    return {
      ok: false,
      tables: [],
      error: err instanceof Error ? err.message : "Unknown Prisma error",
    };
  }
}

/**
 * Disconnect the shared instance (for tests / graceful shutdown).
 */
export async function disconnectCanonicalPrisma(): Promise<void> {
  if (canonicalInstance) {
    await canonicalInstance.$disconnect();
    canonicalInstance = null;
  }
}
