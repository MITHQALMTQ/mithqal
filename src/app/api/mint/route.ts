import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { mintFee } from "@/lib/monetary-engine-v19";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  computeLiveNav,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/nav-compute";

/**
 * POST /api/mint — Record a mint transaction (testnet-public, rate-limited).
 *
 * Constitutional context (§9 + §12 + §36.2 of v19.0.2):
 *   - §36.2: Minted MTQ = Deposit Value (USD-equivalent) / Current NAV_m
 *     The NAV is DYNAMIC (§3.1: NAV_m = R_m / S) — NOT pinned to $1.00.
 *     With the v19.0.2 over-collateralized baseline (RR ≈ 102%), NAV_m is
 *     typically ~$1.04, so a $1,000 USD deposit mints ~962 MTQ.
 *   - §36.2: Minting is gated by the Reserve Ratio invariant (RR ≥ 100%)
 *     AND the §22A basket verification. When either fails, minting is
 *     paused (HTTP 409). The on-chain MTQ contract enforces this; the
 *     backend simply records the resulting tx_hash.
 *   - §36.2 multi-currency: deposits may be in any of the 8 basket
 *     currencies (USD/EUR/JPY/GBP/CNY/CHF/AUD/CAD) or in gold (XAU) /
 *     silver (XAG) ounces. The deposit is converted to USD-equivalent
 *     using the live FX rate, then divided by NAV to determine MTQ minted.
 *   - §9.1 Mint fee: 0.05% (5 bps), capped at $5,000.
 *
 * Trust model (testnet):
 *   - Public endpoint (no operator auth required for testnet simulation).
 *     The frontend submits a MetaMask-signed mock mint transaction and
 *     posts the resulting tx_hash here for the indexer to record.
 *   - Rate-limited to 10 mints/min/IP to prevent abuse.
 *   - On mainnet, this endpoint MUST be re-gated: custody partner verifies
 *     the deposit, then operator's MINTER_ROLE wallet mints MTQ to the
 *     user, and the resulting tx_hash is recorded here (audit trail only).
 *
 * Request body:
 *   {
 *     amount: number,        // deposit amount in `currency` units
 *     currency: string,      // one of: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD, XAU, XAG
 *     toAddress: string,     // 0x-prefixed 20-byte Ethereum address (MTQ recipient)
 *     txHash: string,        // 0x-prefixed 32-byte transaction hash
 *     blockNumber?: number,  // optional chain block number
 *   }
 *
 * Returns:
 *   {
 *     ok: true, txHash, type: "mint",
 *     amount, currency,       // echo of the original deposit
 *     depositUsd,             // USD-equivalent of the deposit (live FX conversion)
 *     nav,                    // dynamic NAV_m used (≈ $1.04 at baseline, NOT $1.00)
 *     mtqAmount,              // MTQ minted = depositUsd / nav
 *     fee,                    // §9.1 mint fee in USD
 *     fxRate,                 // FX rate used (foreign per USD), or null for USD/XAU/XAG
 *     goldUsd,                // live gold spot price (for transparency)
 *     reserveRatio,           // §4 reserve ratio (percentage)
 *     recorded: true
 *   }
 */
export async function POST(req: Request) {
  // Public endpoint (testnet simulation), but rate-limited (10 mints/min/IP).
  // On mainnet this MUST be re-gated to operator auth + custody confirmation.
  const blocked = enforceRateLimit("mint", req, 10, 60_000);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const amount =
    typeof data.amount === "number" ? data.amount : Number(data.amount);
  const currencyRaw =
    typeof data.currency === "string" ? data.currency.trim().toUpperCase() : "";
  const toAddress = typeof data.toAddress === "string" ? data.toAddress.trim() : "";
  const txHash = typeof data.txHash === "string" ? data.txHash.trim() : "";
  const blockNumber =
    typeof data.blockNumber === "number"
      ? data.blockNumber
      : typeof data.blockNumber === "string"
        ? Number(data.blockNumber)
        : undefined;

  // ---- Validation ----
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive number." },
      { status: 400 }
    );
  }
  // 1B sanity cap is applied in USD-equivalent below (post-FX conversion) —
  // but for USD/XAU/XAG we can short-circuit here.
  if (amount > 1_000_000_000_000) {
    return NextResponse.json(
      { error: "amount exceeds the 1T sanity cap." },
      { status: 400 }
    );
  }
  if (!currencyRaw || !isSupportedCurrency(currencyRaw)) {
    return NextResponse.json(
      {
        error: `currency must be one of: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD, XAU, XAG. Got: ${currencyRaw || "(empty)"}`,
      },
      { status: 400 }
    );
  }
  const currency = currencyRaw as SupportedCurrency;
  if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
    return NextResponse.json(
      { error: "toAddress must be a valid Ethereum address." },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: "txHash must be a valid 0x-prefixed 32-byte hash." },
      { status: 400 }
    );
  }
  if (blockNumber !== undefined && (!Number.isFinite(blockNumber) || blockNumber < 0)) {
    return NextResponse.json(
      { error: "blockNumber must be a non-negative integer." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();

    // ---- Fetch the LIVE dynamic NAV (§3.1, §36.2) ----
    // Previously pinned at $1.00 — this was the v19.0.2 critical bug.
    const navResult = await computeLiveNav();

    // §4 + §22A minting-pause gate (NOT checked for redemption — §36.3
    // redemption is NEVER suspended, even when minting is paused).
    if (navResult.mintingPaused) {
      return NextResponse.json(
        {
          error:
            "Minting is currently paused (reserve ratio < 100% or basket verification failed). Redemption remains available.",
          reserveRatio: navResult.reserveRatio,
          mintingPaused: true,
        },
        { status: 409 }
      );
    }

    // ---- Convert deposit to USD-equivalent (§36.2) ----
    // FX convention: fxRates[c] is "foreign currency units per 1 USD"
    // (e.g. EUR=0.87 means 1 USD = 0.87 EUR). So USD = amount / fx.
    let depositUsd: number;
    let fxRateEcho: number | null;
    if (currency === "USD") {
      depositUsd = amount;
      fxRateEcho = 1;
    } else if (currency === "XAU") {
      depositUsd = amount * navResult.goldUsd; // gold ounces → USD
      fxRateEcho = null;
    } else if (currency === "XAG") {
      depositUsd = amount * navResult.silverUsd; // silver ounces → USD
      fxRateEcho = null;
    } else {
      const fx = navResult.fxRates[currency];
      if (!fx || fx <= 0) {
        return NextResponse.json(
          { error: `Unsupported or unavailable currency: ${currency}` },
          { status: 400 }
        );
      }
      depositUsd = amount / fx;
      fxRateEcho = fx;
    }

    if (!Number.isFinite(depositUsd) || depositUsd <= 0) {
      return NextResponse.json(
        { error: "Deposit USD-equivalent must be positive." },
        { status: 400 }
      );
    }
    if (depositUsd > 1_000_000_000) {
      return NextResponse.json(
        { error: "Deposit USD-equivalent exceeds the 1B sanity cap." },
        { status: 400 }
      );
    }

    // ---- §36.2 Mint formula: Minted MTQ = Deposit Value / Current NAV ----
    const navUsd = navResult.navM; // dynamic market NAV (≈ $1.04 at baseline)
    const mtqAmount = depositUsd / navUsd;

    // §9.1 — Mint fee: 0.05% (5 bps), capped at $5,000.
    const fee = mintFee(depositUsd);

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
      // Echo of the original deposit (multi-currency)
      amount,
      currency,
      depositUsd,
      // Dynamic NAV used (NOT $1.00 — this is the v19.0.2 fix)
      nav: navUsd,
      mtqAmount,
      // §9.1 fee
      fee,
      feeUsd8Dec,
      // wei strings (for on-chain parity)
      amountWei,
      feeWei,
      // FX transparency
      fxRate: fxRateEcho,
      goldUsd: navResult.goldUsd,
      silverUsd: navResult.silverUsd,
      // §4 reserve ratio (so the UI can show health)
      reserveRatio: navResult.reserveRatio,
      basketVerified: navResult.basketVerified,
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
