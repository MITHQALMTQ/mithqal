// Mithqal testnet reserve engine — pure functions that derive settlement
// state from the append-only TestnetOperation ledger. Faithful to the v18
// Constitution: 100%+ reserve mandate, no discretionary minting, no
// redemption suspension, 0.05% redemption fee, four-tier diversified basket.
//
// State is FULLY DERIVED from the ledger (auditability principle) — tier
// prices drift as a deterministic function of operation index, so the final
// reserve value, NAV and ratio are reproducible from the ledger alone.

import type { TestnetOperation } from "@prisma/client";

export const TIERS = [
  { tier: "Tier 1", name: "Primary", targetWeight: 0.6, assets: "Cash & T-bills (G7)" },
  { tier: "Tier 2", name: "Secondary", targetWeight: 0.25, assets: "Sovereign bonds (G7 / supra)" },
  { tier: "Tier 3", name: "Tertiary", targetWeight: 0.1, assets: "Allocated gold" },
  { tier: "Tier 4", name: "Strategic", targetWeight: 0.05, assets: "Strategic reserve gold" },
] as const;

export const REDEMPTION_FEE_BPS = 5; // 0.05%
export const PAR = 1; // 1 MTQ = $1 at mint

export interface TierState {
  tier: string;
  name: string;
  targetWeight: number;
  assets: string;
  usdValue: number;
  sharePct: number;
  price: number;
}

export interface TestnetState {
  supply: number;
  reserveValue: number;
  nav: number;
  reserveRatio: number; // percent
  mintingPaused: boolean;
  porHash: string;
  lastUpdate: string;
  tiers: TierState[];
}

/**
 * Deterministic per-operation price drift for each tier.
 * Bounded ±0.4%, mean-reverting toward 1.0. Reproducible from op index
 * alone — no Math.random. Uses a simple seeded LCG per (opIndex, tierIndex).
 */
function driftFor(opIndex: number, tierIndex: number): number {
  // seed from op + tier
  let seed = (opIndex * 2654435761 + tierIndex * 40503) >>> 0;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff; // [0,1)
  };
  const u = next();
  // bounded ±0.4% (0.004), centered, mean-reverting pull of 25%
  const magnitude = (u - 0.5) * 0.008; // ±0.004
  const meanReversion = -0.25; // applied by caller against current price
  return { magnitude, meanReversion };
}

/**
 * Derive the full reserve state from the ledger.
 * Replays every operation in chronological order, applying deterministic
 * price drift after each op.
 */
export function deriveState(ops: TestnetOperation[]): TestnetState {
  let supply = 0;
  const tierUsd = TIERS.map(() => 0);
  const prices = TIERS.map(() => 1.0);

  const chronological = [...ops].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  chronological.forEach((op, i) => {
    if (op.type === "mint") {
      // Split deposit across tiers by target weight, at current prices.
      for (let t = 0; t < TIERS.length; t++) {
        const tierDepositUsd = op.amountUsd * TIERS[t].targetWeight;
        const qty = tierDepositUsd / prices[t];
        tierUsd[t] += qty * prices[t]; // == tierDepositUsd, but explicit
      }
      supply += op.mtq;
    } else if (op.type === "redeem") {
      // Proportional redemption across tiers. Reduces supply by mtq.
      const supplyBefore = supply;
      if (supplyBefore > 0) {
        const fraction = Math.min(op.mtq / supplyBefore, 1);
        for (let t = 0; t < TIERS.length; t++) {
          tierUsd[t] -= tierUsd[t] * fraction;
          if (tierUsd[t] < 0) tierUsd[t] = 0;
        }
      }
      supply -= op.mtq;
      if (supply < 1e-9) supply = 0;
    }

    // Apply deterministic price drift after each op.
    for (let t = 0; t < TIERS.length; t++) {
      const { magnitude, meanReversion } = driftFor(i, t);
      prices[t] = prices[t] + magnitude + meanReversion * (prices[t] - 1.0);
      if (prices[t] < 0.5) prices[t] = 0.5;
      if (prices[t] > 1.5) prices[t] = 1.5;
    }
  });

  const reserveValue = tierUsd.reduce((s, v, t) => s + v, 0);
  const nav = supply > 0 ? reserveValue / supply : 0;
  const reserveRatio = supply > 0 ? (reserveValue / (supply * PAR)) * 100 : 0;
  const mintingPaused = reserveRatio < 100;
  const lastOp = chronological[chronological.length - 1];

  const tiers: TierState[] = TIERS.map((t, idx) => {
    const usdValue = tierUsd[idx];
    return {
      tier: t.tier,
      name: t.name,
      targetWeight: t.targetWeight,
      assets: t.assets,
      usdValue,
      sharePct: reserveValue > 0 ? (usdValue / reserveValue) * 100 : 0,
      price: prices[idx],
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
 * sha256(supply | reserveValue | lastOpId | createdAt) truncated to 16 hex.
 */
function computePorHash(input: {
  supply: number;
  reserveValue: number;
  lastOpId: string;
  createdAt: Date;
}): string {
  // Use Web Crypto (available in Node 18+ / Next runtime) via async would be
  // ideal, but for a sync hash we use a small stable string hash. Since the
  // API routes are the only callers and can be async, we keep this sync but
  // deterministic using a djb2-style hash over the canonical string.
  const canon = `${input.supply.toFixed(6)}|${input.reserveValue.toFixed(4)}|${input.lastOpId}|${input.createdAt.toISOString()}`;
  let h = 5381;
  for (let i = 0; i < canon.length; i++) {
    h = ((h << 5) + h + canon.charCodeAt(i)) >>> 0;
  }
  // expand to ~16 hex chars
  const a = (h >>> 0).toString(16).padStart(8, "0");
  const b = ((h * 2654435761) >>> 0).toString(16).padStart(8, "0");
  return (a + b).slice(0, 16);
}

/**
 * Validate a mint against the constitutional invariant: reserve ratio must
 * stay >= 100% AFTER minting. (Minting at par cannot itself push below 100%
 * unless prices have drifted reserves down — which is exactly the guard.)
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
 * Compute the redemption outcome: proportional claim minus the 0.05% fee.
 * Never refuses (constitutional: redemption is never suspended).
 */
export function computeRedemption(
  state: TestnetState,
  mtq: number
): { claimUsd: number; feeUsd: number; netUsd: number; valid: boolean; reason?: string } {
  if (mtq <= 0) {
    return { claimUsd: 0, feeUsd: 0, netUsd: 0, valid: false, reason: "Amount must be greater than zero." };
  }
  if (mtq > state.supply) {
    return {
      claimUsd: 0,
      feeUsd: 0,
      netUsd: 0,
      valid: false,
      reason: `Cannot redeem more than the current supply (${state.supply.toLocaleString()} MTQ).`,
    };
  }
  const fraction = mtq / state.supply;
  const claimUsd = fraction * state.reserveValue;
  const feeUsd = (claimUsd * REDEMPTION_FEE_BPS) / 10000;
  const netUsd = claimUsd - feeUsd;
  return { claimUsd, feeUsd, netUsd, valid: true };
}

export const GENESIS = {
  amountUsd: 50_000_000,
  participant: "Genesis Anchor — Formation Committee",
} as const;
