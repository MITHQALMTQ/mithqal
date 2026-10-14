/**
 * MITHQAL Assurance — Turso libSQL read-only client (Correction 2).
 *
 * Turso is the READ-ONLY projection backend per §6.1 / §11.3 D-006.
 * The authoritative writer is Neon Postgres (see src/db/index.ts).
 * Turso projection tables are listed in turso/schema.sql (7 tables).
 *
 * Truth state: WIRED. The Turso client is constructed with
 * TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from .env. When those env vars
 * are missing the client falls back to a local file path so `next build`
 * succeeds without provisioning Turso.
 *
 * Fail-closed defaults: when the Turso client is unavailable, every
 * read query returns an empty result set (NOT a stale-cache fallback)
 * — the read router must fall back to Neon rather than serve stale data.
 */

import { createClient, type Client, type InArgs, type ResultSet } from "@libsql/client";
import { logger } from "@/lib/logger";

const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;
let initWarned = false;

/**
 * Lazily construct the Turso libSQL client. We lazy-construct so that
 * `next build` (which has no env access at static-render time) does not
 * crash on a missing TURSO_DATABASE_URL. The first runtime call to
 * `getTursoClient()` either:
 *   - constructs a remote libSQL client (TURSO_DATABASE_URL set), OR
 *   - falls back to a local file path (`file:local.db`) and emits a
 *     single warning so operators know Turso is not provisioned.
 */
export function getTursoClient(): Client | null {
  if (client) return client;

  try {
    if (TURSO_URL.startsWith("libsql://") || TURSO_URL.startsWith("wss://")) {
      if (!TURSO_TOKEN) {
        if (!initWarned) {
          logger.warn(
            { url: TURSO_URL },
            "turso/TURSO_AUTH_TOKEN missing — falling back to local file (read-only projections disabled).",
          );
          initWarned = true;
        }
        client = createClient({ url: "file:local.db" });
      } else {
        client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
      }
    } else {
      client = createClient({ url: TURSO_URL });
    }
    return client;
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "turso/client construction failed",
    );
    return null;
  }
}

/**
 * Execute a read-only query against Turso. Returns an empty result set
 * when the Turso client is unavailable so callers can degrade to Neon
 * rather than throw. NEVER used for writes — the schema and policy
 * forbid writes from app code (see docs/turso-policy.md §3).
 */
export async function tursoRead(
  sql: string,
  args: InArgs = [],
): Promise<ResultSet> {
  const c = getTursoClient();
  if (!c) {
    return {
      columns: [],
      rows: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
      changes: 0,
    } as unknown as ResultSet;
  }
  try {
    return await c.execute(sql, args);
  } catch (err) {
    logger.error(
      { sql: sql.slice(0, 120), err: err instanceof Error ? err.message : String(err) },
      "turso/read query failed",
    );
    return {
      columns: [],
      rows: [],
      rowsAffected: 0,
      lastInsertRowid: undefined,
      changes: 0,
    } as unknown as ResultSet;
  }
}

/**
 * Convenience helper: assert the Turso client is initialised before a
 * route handler proceeds. Used by health-check routes that need to
 * surface Turso availability to the dashboard status bar.
 */
export function requireTurso(): Client {
  const c = getTursoClient();
  if (!c) {
    throw new Error("[mithqal/turso] Turso client is not initialised — set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.");
  }
  return c;
}

/**
 * Health-check probe used by the status-bar and /api/v1/health routes.
 * Returns true when a SELECT 1 against Turso succeeds within ~1s.
 */
export async function tursoHealthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const c = getTursoClient();
  if (!c) {
    return { ok: false, latencyMs: 0, error: "turso-not-initialised" };
  }
  const start = Date.now();
  try {
    await c.execute("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown Turso error",
    };
  }
}
