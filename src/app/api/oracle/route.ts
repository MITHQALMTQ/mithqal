import { NextResponse } from "next/server";
import { getOracleSnapshot, priceToWei } from "@/lib/oracle-client";

/**
 * GET /api/oracle — public, unauthenticated snapshot of oracle prices.
 *
 * Returns the current gold, silver, and stablecoin prices from the
 * MockOracle contract on Monad Testnet (if deployed) or the live free
 * API fallback (if not yet deployed).
 *
 * Constitutional context (§30-33 v19.0.3):
 *   The Constitution requires a multi-oracle consensus. This endpoint
 *   currently serves the single-source mock for testnet. On mainnet, it
 *   will return the weighted median of Chainlink + Pyth + Chronicle.
 *
 * Response:
 *   {
 *     "goldUsd": 4053.50,
 *     "silverUsd": 25.00,
 *     "stablecoins": { "USDC": 1, "USDT": 1, "DAI": 1 },
 *     "lastUpdated": { "GOLD": 1785065051, ... },
 *     "source": "onchain" | "fallback",
 *     "oracleAddress": "0x..." | null,
 *     "rpcUrl": "https://testnet-rpc.monad.xyz",
 *     "fetchedAt": "2026-07-26T..."
 *   }
 */
export async function GET() {
  try {
    const snapshot = await getOracleSnapshot();
    return NextResponse.json({
      ...snapshot,
      // Helpful metadata for the dashboard
      contractNotDeployedYet: snapshot.source === "fallback",
      deploymentInstructions: snapshot.source === "fallback"
        ? "MockOracle.sol not yet deployed. Run: forge create src/contracts/oracle/MockOracle.sol:MockOracle --rpc-url https://testnet-rpc.monad.xyz --private-key <key>. Then set MOCK_ORACLE_ADDRESS env var."
        : null,
    });
  } catch (err) {
    console.error("oracle snapshot failed:", err);
    return NextResponse.json(
      { error: "Could not fetch oracle prices.", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
