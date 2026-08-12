import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { CONTRACTS, NETWORK } from "@/lib/contract-reader";
import { ALL_CHAINS, SOLANA_NETWORKS } from "@/lib/chains";

/**
 * GET /api/status — public health check for the Mithqal Operating System.
 *
 * Verifies (1) the API itself is reachable, (2) the Turso/libsql database is
 * reachable (via a trivial `SELECT 1` round-trip), and (3) reports all networks
 * the protocol is deployed on with their contract addresses.
 *
 * As of 2026-08-12, the protocol is deployed on THREE networks:
 *   - Monad Testnet (Chain ID 10143) — primary EVM, RPC: testnet-rpc.monad.xyz
 *   - Arc Network Testnet (Chain ID 5042002) — secondary EVM, RPC: rpc.testnet.arc.io
 *   - Solana Devnet (non-EVM) — SPL token MTQ
 *
 * These are THREE SEPARATE networks with different chain IDs, RPCs, explorers,
 * and contract addresses. Do NOT treat any as aliases of another.
 *
 * Constitutional context:
 *   The v23 Constitution requires the institution to publish a continuously
 *   verifiable state surface. This endpoint is the lightweight liveness probe
 *   for that surface.
 */
export async function GET() {
  try {
    let database: "connected" | "disconnected" = "disconnected";
    try {
      await ensureSchema();
      await db.$executeRawUnsafe("SELECT 1");
      database = "connected";
    } catch (dbErr) {
      console.error("[status] database probe failed:", dbErr);
    }

    return NextResponse.json({
      ok: true,
      service: "Mithqal OS",
      version: "v23",
      timestamp: new Date().toISOString(),
      database,
      // Legacy fields — pinned to the primary (default) chain, Monad Testnet.
      network: NETWORK.name,
      chainId: NETWORK.chainId,
      contracts: {
        mtq: CONTRACTS.MTQ_TOKEN,
        governance: CONTRACTS.GOVERNANCE,
        safe: CONTRACTS.SAFE_MULTI_SIG,
        deployer: CONTRACTS.DEPLOYER,
      },
      // All EVM chains the protocol is deployed on.
      networks: ALL_CHAINS.map((c) => ({
        key: c.key,
        name: c.name,
        chainId: c.chainId,
        rpcUrl: c.rpcUrl,
        explorer: c.explorer,
        nativeCurrency: c.nativeCurrency,
        contracts: c.contracts,
      })),
      // Non-EVM networks (Solana SPL token representation).
      solana: SOLANA_NETWORKS.map((s) => ({
        key: s.key,
        name: s.name,
        rpcUrl: s.rpcUrl,
        explorer: s.explorer,
        mintAddress: s.mintAddress,
        walletAddress: s.walletAddress,
        symbol: s.symbol,
        decimals: s.decimals,
        isEvm: false,
      })),
    });
  } catch (err) {
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
