/**
 * Turso → Neon CDC Sync — keeps Neon analytics replica in sync with Turso primary.
 *
 * Architecture:
 *   Turso (primary, edge-deployed SQLite — fast writes/reads)
 *     ↓ Inngest CDC sync event
 *   Neon (analytics replica + evidence archive — serverless Postgres, scales to zero)
 *
 * This separation gives:
 *   - Fast writes/reads on Turso (edge, <50ms)
 *   - Heavy analytics queries on Neon (offloaded from Turso)
 *   - No analytics query load on Turso (keeps Turso fast)
 *   - Durable evidence archive on Neon (survives Turso edge resets)
 *
 * BUILD_MODE = FROZEN — this is an integration layer, NOT a new architecture.
 * No settlement logic, no MTQ, no policy engine changes.
 */

import { createClient } from "@libsql/client";
import { neon } from "@neondatabase/serverless";

export interface SyncResult {
  table: string;
  synced: number;
  errors: string[];
  durationMs: number;
}

export interface SyncAllResult {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  tables: SyncResult[];
  totalSynced: number;
  totalErrors: number;
  tursoConnected: boolean;
  neonConnected: boolean;
}

// Tables to sync (whitelist — only institutional tables)
const SYNC_TABLES = [
  { name: "users", columns: "id, email, role, created_at" },
  { name: "transactions", columns: "id, type, amount, currency, status, created_at" },
  { name: "reserves", columns: "id, asset, amount, created_at" },
  { name: "fees", columns: "id, type, amount, created_at" },
  { name: "proposals", columns: "id, title, status, created_at" },
] as const;

async function getTursoClient() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!url) throw new Error("DATABASE_URL not set");
  return createClient({ url, authToken });
}

async function getNeonSql() {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error("NEON_DATABASE_URL not set");
  return neon(connectionString);
}

async function ensureNeonTables(sql: ReturnType<typeof neon>) {
  // Create tables on Neon if they don't exist (idempotent)
  await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, role TEXT, created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, type TEXT, amount REAL, currency TEXT, status TEXT, created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS reserves (id TEXT PRIMARY KEY, asset TEXT, amount REAL, created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS fees (id TEXT PRIMARY KEY, type TEXT, amount REAL, created_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, title TEXT, status TEXT, created_at TEXT)`;
}

export async function syncTableToNeon(
  tableName: string,
  columns: string
): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let synced = 0;

  try {
    const turso = await getTursoClient();
    const sql = await getNeonSql();

    // Read all rows from Turso
    const colArray = columns.split(",").map((c) => c.trim());
    const result = await turso.execute(`SELECT ${colArray.join(", ")} FROM ${tableName}`);

    // Upsert each row to Neon
    for (const row of result.rows) {
      try {
        const values = colArray.map((_, i) => (row as Record<string, unknown>)[colArray[i]]);
        const placeholders = colArray.map((_, i) => `$${i + 1}`).join(", ");
        const query = `INSERT INTO ${tableName} (${colArray.join(", ")}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${colArray.filter(c => c !== "id").map((c, i) => `${c} = EXCLUDED.${c}`).join(", ")}`;
        await sql(query, ...values);
        synced++;
      } catch (e) {
        errors.push(`Row upsert failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`Table sync failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    table: tableName,
    synced,
    errors: errors.slice(0, 10), // cap errors
    durationMs: Date.now() - start,
  };
}

export async function syncAllTablesToNeon(): Promise<SyncAllResult> {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  let tursoConnected = false;
  let neonConnected = false;
  const results: SyncResult[] = [];

  try {
    // Test connections
    const turso = await getTursoClient();
    await turso.execute("SELECT 1");
    tursoConnected = true;

    const sql = await getNeonSql();
    await sql`SELECT 1`;
    neonConnected = true;

    // Ensure Neon tables exist
    await ensureNeonTables(sql);

    // Sync each table
    for (const table of SYNC_TABLES) {
      const result = await syncTableToNeon(table.name, table.columns);
      results.push(result);
    }
  } catch (e) {
    results.push({
      table: "_connection",
      synced: 0,
      errors: [e instanceof Error ? e.message : String(e)],
      durationMs: 0,
    });
  }

  const finishedAt = new Date().toISOString();

  return {
    startedAt,
    finishedAt,
    totalDurationMs: Date.now() - start,
    tables: results,
    totalSynced: results.reduce((sum, r) => sum + r.synced, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    tursoConnected,
    neonConnected,
  };
}
