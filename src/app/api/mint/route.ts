import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { mintFee } from "@/lib/monetary-engine-v19";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/mint — Record a mint transaction (testnet-public, rate-limited).
 *
 * Constitutional context (§9 + §12 of v19.0):
 *   - Minting is gated by the Reserve Ratio invariant (RR ≥ 1.00). When RR
 *     is below 1.00, minting is paused. The on-chain MTQ contract enforces
 *     this; the backend simply records the resulting tx_hash.
 *   - Mint fee: 0.05% (5 bps), capped at $5,000 per Constitution §9.1.
 *
 * Trust model (testnet):
 *   - Public endpoint (no operator auth required for testnet simulation).
 *     The frontend submits a MetaMask-signed mock mint transaction and
 *     posts the resulting tx_hash here for the indexer to record.
 *   - Rate-limited to 20 mints/min/IP to prevent abuse.
 *   - On mainnet, this endpoint MUST be re-gated: custody partner verifies
 *     the deposit, then operator's MINTER_ROLE wallet mints MTQ to the
 *     user, and the resulting tx_hash is recorded here (audit trail only).
 *
 * Request body:
 *   { amountUsd: number, toAddress: string, txHash: string, blockNumber?: number }
 *
 * Returns:
 *   { ok: true, txHash, type: "mint", amountUsd, fee, recorded: true }
 */
export async function POST(req: Request) {
  // Public endpoint (testnet simulation), but rate-limited (20 mints/min/IP).
  // On mainnet this MUST be re-gated to operator auth + custody confirmation.
  const blocked = enforceRateLimit("mint", req, 20, 60_000);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const amountUsd =
    typeof data.amountUsd === "number" ? data.amountUsd : Number(data.amountUsd);
  const toAddress = typeof data.toAddress === "string" ? data.toAddress.trim() : "";
  const txHash = typeof data.txHash === "string" ? data.txHash.trim() : "";
  const blockNumber =
    typeof data.blockNumber === "number"
      ? data.blockNumber
      : typeof data.blockNumber === "string"
        ? Number(data.blockNumber)
        : undefined;

  // ---- Validation ----
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ error: "amountUsd must be a positive number." }, { status: 400 });
  }
  if (amountUsd > 1_000_000_000) {
    return NextResponse.json({ error: "amountUsd exceeds the 1B sanity cap." }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
    return NextResponse.json({ error: "toAddress must be a valid Ethereum address." }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ error: "txHash must be a valid 0x-prefixed 32-byte hash." }, { status: 400 });
  }
  if (blockNumber !== undefined && (!Number.isFinite(blockNumber) || blockNumber < 0)) {
    return NextResponse.json({ error: "blockNumber must be a non-negative integer." }, { status: 400 });
  }

  try {
    await ensureSchema();

    // §9.1 — Mint fee: 0.05% (5 bps), capped at $5,000.
    const fee = mintFee(amountUsd);

    // MTQ has 18 decimals. Testnet NAV is pinned at 1.0 (1 MTQ = 1 USD)
    // until the live oracle + reserve vault is wired into the indexer.
    const navUsd = 1.0;
    const mtqAmount = amountUsd / navUsd;

    // Convert USD/MTQ amounts to wei strings (18 decimals). Use string math
    // to avoid floating-point precision loss for large amounts.
    const amountWei = toWei(mtqAmount, 18);
    const feeWei = toWei(fee / navUsd, 18);

    // Fees table stores USD amounts with 8 decimals (matches MockOracle).
    const feeUsd8Dec = toFixedDecimals(fee, 8);

    // Mint: from zero address (special "mint source"), to the recipient.
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    await db.transactions.create({
      data: {
        txHash,
        type: "mint",
        fromAddress: ZERO_ADDRESS,
        toAddress,
        amount: amountWei,
        fee: feeWei,
        blockNumber: blockNumber ?? null,
      },
    });

    await db.fees.create({
      data: {
        txHash,
        feeType: "mint",
        amount: feeUsd8Dec,
      },
    });

    return NextResponse.json({
      ok: true,
      txHash,
      type: "mint",
      amountUsd,
      mtqAmount,
      nav: navUsd,
      fee,
      feeUsd8Dec,
      amountWei,
      feeWei,
      recorded: true,
    });
  } catch (err) {
    console.error("mint record failed:", err);
    return NextResponse.json(
      {
        error: "Could not record mint transaction.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

/**
 * Convert a decimal number to a fixed-decimal wei-style string using
 * string manipulation (avoids BigInt/Number precision limits).
 *
 *   toWei(1234.56, 18) -> "1234560000000000000000"
 *   toWei(0.05, 18)    -> "50000000000000000"
 */
function toWei(amount: number, decimals: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  // Use up to 6 fractional digits of USD input to avoid carrying float noise.
  const rounded = Math.round(abs * 1e6) / 1e6;
  const [wholeStr, fracStr = ""] = rounded.toString().split(".");
  const fracPadded = (fracStr + "0".repeat(decimals)).slice(0, decimals);
  const combined = (wholeStr + fracPadded).replace(/^0+(?=\d)/, "");
  return sign + (combined || "0");
}

/** Format a USD amount as a fixed-decimals string (e.g. 8 for fees table). */
function toFixedDecimals(amount: number, decimals: number): string {
  if (!Number.isFinite(amount)) return "0";
  // Round to the requested decimals, then represent as integer string.
  const scaled = Math.round(amount * Math.pow(10, decimals));
  return scaled.toString();
}
