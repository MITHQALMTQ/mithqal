import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { CONTRACTS, NETWORK } from "@/lib/contract-reader";
import { ALL_CHAINS } from "@/lib/chains";

/**
 * GET /api/status — public health check for the Mithqal Operating System.
 *
 * Verifies (1) the API itself is reachable, (2) the Turso/libsql database is
 * reachable (via a trivial `SELECT 1` round-trip), and (3) reports the network
 * identity (Monad Testnet, chainId 10143) plus the deployed contract addresses
 * so consumers can self-verify they are talking to the right environment.
 *
 * As of 2026-08-09, the protocol is deployed on TWO testnets:
 *   - Monad Testnet (Chain ID 10143) — primary
 *   - Arc Network Testnet (Chain ID 5042002) — secondary
 *
 * The response includes a `networks` array listing both, alongside the legacy
 * `network` / `chainId` / `contracts` fields (Monad) for backward compat.
 *
 * Constitutional context:
 *   The v19.0 Constitution requires the institution to publish a continuously
 *   verifiable state surface. This endpoint is the lightweight liveness probe
 *   for that surface — it is intentionally cheap (no on-chain reads, no oracle
 *   fetches) so it can be polled aggressively by uptime monitors.
 *
 * Response shape:
 *   {
 *     ok: true,
 *     service: "Mithqal OS",
 *     version: "v19.0",
 *     timestamp: "<ISO 8601>",
 *     database: "connected" | "disconnected",
 *     network: "Monad Testnet",       // legacy field — primary chain
 *     chainId: 10143,                  // legacy field — primary chain
 *     contracts: { mtq, governance, safe, deployer },  // legacy — primary
 *     networks: [                      // NEW — all chains the protocol is on
 *       { key, name, chainId, rpcUrl, explorer, contracts: {...} },
 *       ...
 *     ]
 *   }
 */
export async function GET() {
  try {
    // Probe the database. We use a trivial `SELECT 1` rather than a schema
    // introspection query so that this works even on a freshly-provisioned
    // Turso database before ensureSchema() has ever run. ensureSchema() is
    // still invoked first because downstream endpoints depend on the OS
    // tables existing — calling it here warms the global schema-init flag so
    // subsequent requests skip the (cached) DDL pass.
    let database: "connected" | "disconnected" = "disconnected";
    try {
      await ensureSchema();
      await db.$executeRawUnsafe("SELECT 1");
      database = "connected";
    } catch (dbErr) {
      console.error("[status] database probe failed:", dbErr);
      // `database` stays "disconnected" — we still return 200 so that an
      // external uptime monitor can distinguish "API up, DB down" from
      // "API down". The outer `ok` flag stays true because the API itself
      // answered.
    }

    return NextResponse.json({
      ok: true,
      service: "Mithqal OS",
      version: "v19.0",
      timestamp: new Date().toISOString(),
      database,
      // Legacy fields — pinned to the primary (default) chain, Monad Testnet.
      // Kept for backward compat with any consumer that reads /api/status
      // expecting a single network.
      network: NETWORK.name,
      chainId: NETWORK.chainId,
      contracts: {
        mtq: CONTRACTS.MTQ_TOKEN,
        governance: CONTRACTS.GOVERNANCE,
        safe: CONTRACTS.SAFE_MULTI_SIG,
        deployer: CONTRACTS.DEPLOYER,
      },
      // New multi-chain field — lists every chain the protocol is deployed on.
      networks: ALL_CHAINS.map((c) => ({
        key: c.key,
        name: c.name,
        chainId: c.chainId,
        rpcUrl: c.rpcUrl,
        explorer: c.explorer,
        nativeCurrency: c.nativeCurrency,
        contracts: c.contracts,
      })),
    });
  } catch (err) {
    // Only reachable if NextResponse.json itself throws (e.g. serialization
    // of an unexpected non-serializable value). Defensive — keep it.
    console.error("[status] handler failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "status check failed",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
