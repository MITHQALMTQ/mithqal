import { NextResponse } from "next/server";
import { getBalance, NETWORK } from "@/lib/contract-reader";
import { db, ensureSchema } from "@/lib/db";

/**
 * GET /api/balance/[address] — public read-only MTQ balance lookup.
 *
 * Reads the live on-chain ERC-20 balanceOf for `address` against the
 * deployed MTQ token on Monad Testnet via eth_call (read-only — never
 * submits a transaction). Also upserts the address into the `users` table
 * so the institution has a registry of wallets that have queried their
 * balance (this is an observational record, not an authentication step).
 *
 * Path parameter (Next.js 16 App Router): `params` is a Promise and must
 * be awaited before use.
 *
 * Response shape:
 *   {
 *     address: "0x...",
 *     balance: "<wei string>",         // BigDecimal-safe
 *     balanceDisplay: 110.0,           // human-readable MTQ
 *     decimals: 18,
 *     explorerLink: "https://testnet.monadscan.com/address/0x..."
 *   }
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // ---- Validate the Ethereum address ----
    // 0x + 40 hex chars (case-insensitive). We accept EIP-55 checksummed
    // and lowercase forms. We do NOT accept ICAP or upper-case-only forms
    // because the on-chain reader lowercases the input anyway.
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        {
          error: "Invalid address.",
          detail: "Expected a 0x-prefixed 40-hex-character Ethereum address.",
        },
        { status: 400 }
      );
    }

    const normalized = address.toLowerCase();

    // ---- Read on-chain balance (read-only eth_call) ----
    const result = await getBalance(normalized);

    // ---- Upsert the user into the registry ----
    // Best-effort: a DB failure must NOT mask the on-chain balance, because
    // the balance is the primary deliverable of this endpoint. We log and
    // continue. The DB row is purely observational (when did this wallet
    // first query us?).
    try {
      await ensureSchema();
      await db.users.upsert(normalized);
    } catch (dbErr) {
      console.error("[balance] user upsert failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      address: result.address,
      balance: result.balance.toString(), // wei string — BigDecimal-safe
      balanceDisplay: result.balanceDisplay,
      decimals: result.decimals,
      explorerLink: `${NETWORK.explorer}/address/${result.address}`,
    });
  } catch (err) {
    console.error("[balance] failed:", err);
    return NextResponse.json(
      {
        error: "Could not fetch balance.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
