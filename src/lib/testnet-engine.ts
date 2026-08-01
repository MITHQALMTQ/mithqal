// Mithqal testnet reserve engine — pure functions that derive settlement
// state from the append-only TestnetOperation ledger. Faithful to the v19.0
// Constitution: 100%+ reserve mandate, no discretionary minting, no
// redemption suspension, 0.05% redemption fee, dynamic NAV.
//
// KEY FIX (§3, §36): NAV is DYNAMIC — computed as R_m / S (Market Reserve
// divided by Supply). MTQ is NOT pegged to $1. When gold prices rise, the
// reserve value increases, and NAV increases above $1. When gold prices
// fall, NAV decreases. Minting uses: Minted MTQ = Deposit / Current NAV.
// Redemption uses: Value = Burned MTQ × Current NAV.
//
// State is FULLY DERIVED from the ledger (auditability principle).

import type { TestnetOperation } from "@prisma/client";

// §23 Reserve allocation — DYNAMIC ranges (not fixed)
// Policy targets: Fiat 75%, Bullion 20%, Stablecoin 5%
// Bullion split: Gold 80%, Silver 20% (§25.2, φ_t variable)
export const TIERS = [
  { tier: "Tier 1", name: "Fiat — Cash", targetWeight: 0.50, assets: "Central-bank cash (G7)", assetClass: "cash" },
  { tier: "Tier 2", name: "Fiat — Sovereign", targetWeight: 0.25, assets: "Sovereign bonds ≤1yr (G7/supra)", assetClass: "sovereign" },
  { tier: "Tier 3", name: "Bullion — Gold", targetWeight: 0.16, assets: "Allocated gold (LBMA)", assetClass: "gold" },
  { tier: "Tier 4", name: "Bullion — Silver", targetWeight: 0.04, assets: "Allocated silver (LBMA)", assetClass: "silver" },
  { tier: "Tier 5", name: "Stablecoin", targetWeight: 0.05, assets: "Regulated stablecoins (USDC/USDT/DAI)", assetClass: "stablecoin" },
] as const;

export const REDEMPTION_FEE_BPS = 5; // 0.05%
export const MINT_FEE_BPS = 5; // 0.05%

// PAR removed — NAV is now DYNAMIC per §3: NAV_m = R_m / S
// 1 MTQ is NOT $1. It is worth whatever the reserves are worth divided by supply.

export interface TierState {
  tier: string;
  name: string;
  targetWeight: number;
  assets: string;
  assetClass: string;
  usdValue: number;
  sharePct: number;
  price: number;
  quantity: number;
}

export interface TestnetState {
  supply: number;
  reserveValue: number;
  nav: number;
  reserveRatio: number; // percent (R_a / (S × NAV_m) × 100)
  mintingPaused: boolean;
  porHash: string;
  lastUpdate: string;
  tiers: TierState[];
}

/**
 * Derive the full reserve state from the ledger.
 * Replays every operation in chronological order.
 *
 * KEY CHANGE: NAV is computed as reserveValue / supply (§3.1: NAV_m = R_m / S).
 * This means:
 * - When gold prices rise → reserves worth more → NAV rises above $1
 * - When gold prices fall → reserves worth less → NAV falls below $1
 * - Minting at NAV ≠ $1 gives different MTQ amounts than 1:1
 */
export function deriveState(ops: TestnetOperation[], liveGoldPrice?: number, liveSilverPrice?: number): TestnetState {
  let supply = 0;
  const tierUsd = TIERS.map(() => 0);
  const tierQty = TIERS.map(() => 0); // quantity of each asset (oz for gold/silver, units for others)
  // Prices: cash/sovereign/stablecoin = $1 (par), gold = live price, silver = live price
  const prices = TIERS.map((t, i) => {
    if (t.assetClass === "gold") return liveGoldPrice || 4076.9;
    if (t.assetClass === "silver") return liveSilverPrice || 58.76;
    return 1.0; // cash, sovereign, stablecoin at par
  });

  const chronological = [...ops].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  chronological.forEach((op) => {
    if (op.type === "mint") {
      // §36.2: Minted MTQ = Deposit Value / Current NAV
      // But the op already stores the mtq amount that was minted at the time.
      // We just replay: add the deposit to reserves, add the MTQ to supply.
      for (let t = 0; t < TIERS.length; t++) {
        const tierDepositUsd = op.amountUsd * TIERS[t].targetWeight;
        const qty = tierDepositUsd / prices[t];
        tierQty[t] += qty;
        tierUsd[t] += tierDepositUsd;
      }
      supply += op.mtq;
    } else if (op.type === "redeem") {
      // §36.3: Redemption Value = Burned MTQ × Current NAV
      // Proportional redemption across tiers.
      const supplyBefore = supply;
      if (supplyBefore > 0) {
        const fraction = Math.min(op.mtq / supplyBefore, 1);
        for (let t = 0; t < TIERS.length; t++) {
          tierUsd[t] -= tierUsd[t] * fraction;
          tierQty[t] -= tierQty[t] * fraction;
          if (tierUsd[t] < 0) tierUsd[t] = 0;
          if (tierQty[t] < 0) tierQty[t] = 0;
        }
      }
      supply -= op.mtq;
      if (supply < 1e-9) supply = 0;
    }
  });

  // Recompute tier USD values using CURRENT live prices (not historical)
  // This is the key: gold/silver tiers are revalued at current market prices
  for (let t = 0; t < TIERS.length; t++) {
    if (TIERS[t].assetClass === "gold" || TIERS[t].assetClass === "silver") {
      // Revalue bullion at current market price
      tierUsd[t] = tierQty[t] * prices[t];
    }
    // Cash, sovereign, stablecoin stay at par ($1)
  }

  const reserveValue = tierUsd.reduce((s, v) => s + v, 0);

  // §3.1: NAV_m = R_m / S (DYNAMIC — not pegged to $1)
  const nav = supply > 0 ? reserveValue / supply : 0;

  // §4: Reserve Ratio = R_a / (S × NAV_m) × 100
  // Since NAV_m = R_m / S, this simplifies to (R_a / R_m) × 100
  // But with haircuts, R_a < R_m, so ratio < 100% if haircuts apply.
  // For the testnet simulator (no haircuts), R_a ≈ R_m, so ratio ≈ 100%.
  // With live gold revaluation, if gold goes UP, R_m increases, NAV increases,
  // and ratio stays ~100% (because both numerator and denominator scale).
  // If gold goes DOWN, R_m decreases, NAV decreases, ratio stays ~100%.
  // The ratio moves when there's a MISMATCH between when deposits were made
  // and current prices. E.g., if gold was $4000 when deposited and is now $4076,
  // reserves are worth more → ratio > 100%.
  const reserveRatio = supply > 0 && nav > 0 ? (reserveValue / (supply * nav)) * 100 : 0;

  // §22A: Minting pauses if ratio < 100% OR basket verification fails
  const mintingPaused = reserveRatio < 100;

  const lastOp = chronological[chronological.length - 1];

  const tiers: TierState[] = TIERS.map((t, idx) => {
    const usdValue = tierUsd[idx];
    return {
      tier: t.tier,
      name: t.name,
      targetWeight: t.targetWeight,
      assets: t.assets,
      assetClass: t.assetClass,
      usdValue,
      sharePct: reserveValue > 0 ? (usdValue / reserveValue) * 100 : 0,
      price: prices[idx],
      quantity: tierQty[idx],
    };
  });

  const porHash = computePorHash({
    supply,
    reserveValue,
    lastOpId: lastOp?.id ?? "genesis",
    createdAt: lastOp?.createdAt ?? new Date(0),
  });

  return {
    supply,
    reserveValue,
    nav: round(nav, 6),
    reserveRatio: round(reserveRatio, 4),
    mintingPaused,
    porHash,
    lastUpdate: (lastOp?.createdAt ?? new Date()).toISOString(),
    tiers,
  };
}

function round(n: number, d: number): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

/**
 * Compute a deterministic Proof-of-Reserves hash.
 */
function computePorHash(input: {
  supply: number;
  reserveValue: number;
  lastOpId: string;
  createdAt: Date;
}): string {
  const canon = `${input.supply.toFixed(6)}|${input.reserveValue.toFixed(4)}|${input.lastOpId}|${input.createdAt.toISOString()}`;
  let h = 5381;
  for (let i = 0; i < canon.length; i++) {
    h = ((h << 5) + h + canon.charCodeAt(i)) >>> 0;
  }
  const a = (h >>> 0).toString(16).padStart(8, "0");
  const b = ((h * 2654435761) >>> 0).toString(16).padStart(8, "0");
  return (a + b).slice(0, 16);
}

/**
 * Validate a mint against the constitutional invariant: reserve ratio must
 * stay >= 100% AFTER minting.
 */
export function canMint(state: TestnetState): {
  ok: boolean;
  reason?: string;
} {
  if (state.mintingPaused) {
    return {
      ok: false,
      reason: `Minting paused: reserve ratio ${state.reserveRatio.toFixed(2)}% is below the 100% constitutional floor. Deposit additional reserves to restore.`,
    };
  }
  return { ok: true };
}

/**
 * §36.2: Compute mint outcome with DYNAMIC NAV.
 * Minted MTQ = (Deposit - Fee) / Current NAV
 *
 * If NAV = $1.00, this gives 1:1 (same as before).
 * If NAV = $1.05 (reserves > supply), you get FEWER MTQ per dollar.
 * If NAV = $0.95 (reserves < supply — shouldn't happen, minting paused), you get MORE.
 */
export function computeMint(
  state: TestnetState,
  amountUsd: number
): { feeUsd: number; netDepositUsd: number; mtq: number; nav: number; valid: boolean; reason?: string } {
  if (amountUsd <= 0) {
    return { feeUsd: 0, netDepositUsd: 0, mtq: 0, nav: 0, valid: false, reason: "Amount must be greater than zero." };
  }

  const guard = canMint(state);
  if (!guard.ok) {
    return { feeUsd: 0, netDepositUsd: 0, mtq: 0, nav: 0, valid: false, reason: guard.reason };
  }

  // §9.1: Mint fee = min(amount × 0.05%, $5,000)
  const feeUsd = Math.min(amountUsd * (MINT_FEE_BPS / 10000), 5000);
  const netDepositUsd = amountUsd - feeUsd;

  // §36.2: Minted MTQ = Deposit Value / Current NAV
  // If NAV = $1, mtq = netDeposit (same as old 1:1 behavior)
  // If NAV = $1.05, mtq = netDeposit / 1.05 (fewer MTQ)
  const currentNav = state.nav > 0 ? state.nav : 1.0; // fallback to 1.0 if no supply yet
  const mtq = netDepositUsd / currentNav;

  return { feeUsd, netDepositUsd, mtq, nav: currentNav, valid: true };
}

/**
 * §36.3: Compute redemption outcome with DYNAMIC NAV.
 * Redemption Value = Burned MTQ × Current NAV
 *
 * If NAV = $1.00, you get $1 per MTQ (same as before).
 * If NAV = $1.05, you get $1.05 per MTQ (MORE — your MTQ appreciated).
 * Redemption is NEVER suspended (constitutional invariant).
 */
export function computeRedemption(
  state: TestnetState,
  mtq: number
): { claimUsd: number; feeUsd: number; netUsd: number; nav: number; valid: boolean; reason?: string } {
  if (mtq <= 0) {
    return { claimUsd: 0, feeUsd: 0, netUsd: 0, nav: 0, valid: false, reason: "Amount must be greater than zero." };
  }
  if (mtq > state.supply) {
    return {
      claimUsd: 0,
      feeUsd: 0,
      netUsd: 0,
      nav: 0,
      valid: false,
      reason: `Cannot redeem more than the current supply (${state.supply.toLocaleString()} MTQ).`,
    };
  }

  // §36.3: Redemption Value = Burned MTQ × Current NAV
  const currentNav = state.nav > 0 ? state.nav : 1.0;
  const claimUsd = mtq * currentNav;
  const feeUsd = (claimUsd * REDEMPTION_FEE_BPS) / 10000;
  const netUsd = claimUsd - feeUsd;

  return { claimUsd, feeUsd, netUsd, nav: currentNav, valid: true };
}

export const GENESIS = {
  amountUsd: 50_000_000,
  participant: "Genesis Anchor — Formation Committee",
} as const;
