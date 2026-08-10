import { NextResponse } from "next/server";
import { SOLANA_CONFIG } from "@/lib/solana";

/**
 * GET /api/solana/info — static Solana network + token config (no RPC calls).
 *
 * A lightweight endpoint that returns just the cached Solana config (network
 * name, RPC URL, mint address, wallet address, decimals, explorer links).
 * Makes zero network calls so it's safe to use as a fast first paint /
 * skeleton filler before /api/solana/balance resolves.
 *
 * Use /api/solana/balance for live on-chain data (balance, supply, slot, …).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    network: "Solana Devnet",
    cluster: "devnet",
    rpc: SOLANA_CONFIG.rpc,
    mint: SOLANA_CONFIG.mint,
    wallet: SOLANA_CONFIG.wallet,
    symbol: "MTQ",
    decimals: 18,
    explorer: `https://explorer.solana.com/address/${SOLANA_CONFIG.mint}?cluster=devnet`,
    explorerWallet: `https://explorer.solana.com/address/${SOLANA_CONFIG.wallet}?cluster=devnet`,
    explorerMintTx: `https://explorer.solana.com/address/${SOLANA_CONFIG.mint}?cluster=devnet`,
    note:
      "Solana MTQ is a separate token representation. Supply is NOT unified with EVM MTQ.",
    runtime: "Sealevel VM (NOT EVM)",
    tokenStandard: "SPL Token Program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)",
    integrationStatus: "read-only",
  });
}
