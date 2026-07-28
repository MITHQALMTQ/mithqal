import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health — service health check.
 *
 * Probes the four upstream dependencies the public app depends on:
 *   - db     — Turso (libsql) connectivity (runs `SELECT 1`)
 *   - rpc    — Monad Testnet JSON-RPC (calls eth_blockNumber)
 *   - oracle — /api/oracle (returns 200 + a fetchedAt timestamp)
 *   - smtp   — checks SMTP_HOST env var is set (does NOT send email)
 *
 * Returns 200 + { status: "healthy", checks } when every probe passes.
 * Returns 503 + { status: "degraded", checks } when any probe fails —
 * the failing probe's `ok: false` + an `error` string is in the payload.
 *
 * This endpoint is unauthenticated and not rate-limited so external
 * monitors (UptimeRobot, Vercel cron, etc.) can poll it freely.
 */
export async function GET() {
  const checks = await runChecks();

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? "healthy" : "degraded";

  return NextResponse.json(
    { status, checks, generatedAt: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}

type CheckResult = { ok: boolean; latencyMs?: number; error?: string; detail?: string };
type Checks = {
  db: CheckResult;
  rpc: CheckResult;
  oracle: CheckResult;
  smtp: CheckResult;
};

async function runChecks(): Promise<Checks> {
  // Run independent probes in parallel — total latency = slowest probe.
  const [dbCheck, rpcCheck, oracleCheck, smtpCheck] = await Promise.all([
    checkDb(),
    checkRpc(),
    checkOracle(),
    checkSmtp(),
  ]);

  return {
    db: dbCheck,
    rpc: rpcCheck,
    oracle: oracleCheck,
    smtp: smtpCheck,
  };
}

/* ---- DB: try `SELECT 1` via the libsql client ---- */
async function checkDb(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // db.$executeRawUnsafe runs the raw SQL via the libsql client.
    // SELECT 1 is the canonical "is the DB alive" probe.
    await db.$executeRawUnsafe("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown db error",
    };
  }
}

/* ---- RPC: call eth_blockNumber on Monad Testnet ---- */
async function checkRpc(): Promise<CheckResult> {
  const start = Date.now();
  const MONAD_RPC = "https://testnet-rpc.monad.xyz";
  try {
    const res = await fetch(MONAD_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: `RPC HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as { result?: string; error?: { message?: string } };
    if (json.error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: json.error.message ?? "RPC error",
      };
    }
    if (!json.result) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: "RPC returned no result",
      };
    }
    return {
      ok: true,
      latencyMs: Date.now() - start,
      detail: `block=${json.result}`,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "rpc fetch failed",
    };
  }
}

/* ---- Oracle: hit /api/oracle relative to this deployment ----
 * Uses the request URL's origin so it works on any Vercel preview/staging
 * deploy as well as localhost.
 *
 * Note: the request object isn't passed here for simplicity; we resolve
 * the origin lazily from the env (VERCEL_URL) and fall back to localhost.
 */
async function checkOracle(): Promise<CheckResult> {
  const start = Date.now();
  const origin = resolveOrigin();
  try {
    const res = await fetch(`${origin}/api/oracle`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: `oracle HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as { fetchedAt?: string; error?: string };
    if (json.error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: json.error,
      };
    }
    return {
      ok: true,
      latencyMs: Date.now() - start,
      detail: json.fetchedAt ? `fetchedAt=${json.fetchedAt}` : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "oracle fetch failed",
    };
  }
}

/* ---- SMTP: check that SMTP_HOST is configured (does NOT send email) ---- */
function checkSmtp(): CheckResult {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return {
      ok: false,
      error: "SMTP_HOST is not set — outbound email disabled",
    };
  }
  return {
    ok: true,
    detail: `SMTP_HOST=${host}`,
  };
}

/* Resolve the deployment's public origin from Vercel env or fall back to localhost. */
function resolveOrigin(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}
