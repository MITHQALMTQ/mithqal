import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ALL_CHAINS } from "@/lib/chains";

/**
 * GET /api/health — service health check.
 *
 * Probes the upstream dependencies the public app depends on:
 *   - db       — Turso (libsql) connectivity (runs `SELECT 1`)
 *   - rpc      — Primary chain JSON-RPC (calls eth_blockNumber) — Monad Testnet
 *   - rpcArc   — Secondary chain JSON-RPC (calls eth_blockNumber) — Arc Network
 *   - rpcLocal — Local Anvil devnet JSON-RPC (informational; only present if
 *                a local Anvil node is running on localhost:8545)
 *   - oracle   — /api/oracle (returns 200 + a fetchedAt timestamp)
 *   - smtp     — checks SMTP_HOST env var is set (does NOT send email)
 *
 * Returns 200 + { status: "healthy", checks } when every gating probe passes.
 * Returns 503 + { status: "degraded", checks } when any gating probe fails.
 *
 * Gating: only `db`, `rpc` (Monad), `oracle`, and `smtp` gate the overall
 * status. `rpcArc` and `rpcLocal` are informational — they don't cause a 503
 * on their own.
 *
 * This endpoint is unauthenticated and not rate-limited so external
 * monitors (UptimeRobot, Vercel cron, etc.) can poll it freely.
 */
export async function GET() {
  const checks = await runChecks();

  // rpcArc + rpcLocal are informational only — they do NOT gate the status.
  const gatingChecks = Object.entries(checks)
    .filter(([key]) => key !== "rpcArc" && key !== "rpcLocal")
    .map(([, c]) => c);
  const allOk = gatingChecks.every((c) => c.ok);
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
  rpcArc: CheckResult;
  rpcLocal: CheckResult;
  oracle: CheckResult;
  smtp: CheckResult;
};

async function runChecks(): Promise<Checks> {
  // Run independent probes in parallel — total latency = slowest probe.
  const [dbCheck, rpcCheck, rpcArcCheck, rpcLocalCheck, oracleCheck, smtpCheck] = await Promise.all([
    checkDb(),
    checkRpc(),
    checkRpcArc(),
    checkRpcLocal(),
    checkOracle(),
    checkSmtp(),
  ]);

  return {
    db: dbCheck,
    rpc: rpcCheck,
    rpcArc: rpcArcCheck,
    rpcLocal: rpcLocalCheck,
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

/* ---- RPC: call eth_blockNumber on the primary chain (Monad Testnet) ---- */
async function checkRpc(): Promise<CheckResult> {
  // Primary chain = ALL_CHAINS[0] (Monad). This gates the overall status.
  const chain = ALL_CHAINS[0];
  return probeRpc(chain.rpcUrl, chain.name);
}

/* ---- RPC: call eth_blockNumber on the secondary chain (Arc Network) ----
 * Informational only — does NOT cause a 503 if it fails. */
async function checkRpcArc(): Promise<CheckResult> {
  const chain = ALL_CHAINS.find((c) => c.key === "arc")!;
  return probeRpc(chain.rpcUrl, chain.name);
}

/* ---- RPC: call eth_blockNumber on the local Anvil devnet ----
 * Informational only — only meaningful in local dev. On Vercel production
 * there is no Anvil node on localhost:8545, so this will fail; that's fine
 * because it does NOT gate the overall status. */
async function checkRpcLocal(): Promise<CheckResult> {
  const chain = ALL_CHAINS.find((c) => c.key === "local")!;
  return probeRpc(chain.rpcUrl, chain.name);
}

async function probeRpc(rpcUrl: string, label: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: `${label} RPC HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as { result?: string; error?: { message?: string } };
    if (json.error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: `${label}: ${json.error.message ?? "RPC error"}`,
      };
    }
    if (!json.result) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: `${label} returned no result`,
      };
    }
    return {
      ok: true,
      latencyMs: Date.now() - start,
      detail: `${label} block=${json.result}`,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: `${label}: ${err instanceof Error ? err.message : "rpc fetch failed"}`,
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

/* Resolve the deployment's public origin from Vercel env or fall back to localhost.
 * Prefers NEXTAUTH_URL (the stable production alias, e.g. mithqal.vercel.app)
 * over VERCEL_URL (the per-deployment URL, which can return HTML for internal
 * fetches on some Vercel configurations). */
function resolveOrigin(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}
