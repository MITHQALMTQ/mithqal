import { NextResponse } from "next/server";
import {
  getMtqBalance,
  getMtqMintInfo,
  getSolanaHealth,
  getSolanaSlot,
  SOLANA_CONFIG,
} from "@/lib/solana";

/**
 * GET /api/solana/balance — live MTQ SPL token balance + supply on Solana Devnet.
 *
 * Returns the deployer/treasury wallet's SPL token balance for the MTQ mint,
 * the mint's on-chain total supply, decimals, mint authority, freeze
 * authority, cluster health, and current slot. All values are fetched live
 * via the Solana JSON-RPC API (no SDK — see src/lib/solana.ts).
 *
 * Response shape:
 *   {
 *     ok: true,
 *     network: "Solana Devnet",
 *     rpc, mint, wallet, symbol, health, tokenExists,
 *     totalSupply, totalSupplyUi, decimals,
 *     deployerBalance, deployerBalanceRaw, deployerBalanceUi,
 *     mintAuthority, freezeAuthority, ownerProgram,
 *     slot, explorer
 *   }
 *
 * Failure mode: if the Solana Devnet RPC is unreachable or errors, returns
 * `{ ok: false, error }` with HTTP 500.
 */
export async function GET() {
  try {
    const [balance, mintInfo, health, slot] = await Promise.all([
      getMtqBalance(),
      getMtqMintInfo(),
      getSolanaHealth().catch(() => "unknown"),
      getSolanaSlot().catch(() => 0),
    ]);

    // The mint's on-chain decimals are authoritative — recompute the
    // deployer's balance against them (getMtqBalance uses 18 as a fallback).
    const decimals = mintInfo.exists ? mintInfo.decimals : 18;
    const rawBalance = BigInt(balance.raw || "0");
    const balanceUi = Number(rawBalance) / Math.pow(10, decimals);

    // Convert the raw integer supply to a human-readable UI amount using the
    // mint's actual on-chain decimals (we don't trust the chains.ts default).
    const supplyUi =
      mintInfo.exists && decimals > 0
        ? Number(mintInfo.supply) / Math.pow(10, decimals)
        : Number(mintInfo.supply);

    return NextResponse.json({
      ok: true,
      network: "Solana Devnet",
      rpc: SOLANA_CONFIG.rpc,
      mint: SOLANA_CONFIG.mint,
      wallet: SOLANA_CONFIG.wallet,
      symbol: "MTQ",
      health,
      slot,
      tokenExists: mintInfo.exists,
      totalSupply: mintInfo.supply,
      totalSupplyUi: Number.isFinite(supplyUi) ? supplyUi.toFixed(decimals > 6 ? 2 : decimals) : "0",
      decimals,
      mintAuthority: mintInfo.mintAuthority,
      freezeAuthority: mintInfo.freezeAuthority,
      ownerProgram: mintInfo.owner, // Should be "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" (SPL Token Program)
      deployerBalance: balanceUi,
      deployerBalanceUi: balanceUi,
      deployerBalanceRaw: balance.raw,
      deployerBalanceDecimals: decimals,
      deployerTokenAccounts: balance.tokenAccounts,
      explorer: `https://explorer.solana.com/address/${SOLANA_CONFIG.mint}?cluster=devnet`,
      explorerWallet: `https://explorer.solana.com/address/${SOLANA_CONFIG.wallet}?cluster=devnet`,
      note:
        "Solana MTQ is a separate token representation. Supply is NOT unified with EVM MTQ.",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        network: "Solana Devnet",
        rpc: SOLANA_CONFIG.rpc,
        mint: SOLANA_CONFIG.mint,
        wallet: SOLANA_CONFIG.wallet,
        error: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
