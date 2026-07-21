import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";
import { computeMonetaryState, mintFee, redemptionFee } from "@/lib/monetary-engine";
import { getOracleSnapshot } from "@/lib/oracle-data";

// GET /api/transparency — public, unauthenticated snapshot of the
// Institution's live state. Embodies the Constitution's transparency
// principle: every claim here is verifiable from the public ledger.
//
// Returns: live testnet state (supply, reserves, NAV, ratio, PoR), the
// operation count, the Formation Committee submission count (number only —
// no PII ever leaks), the formation milestone checklist, AND the full
// Monetary Engine state (gold-currency basket, momentum, mean-reversion,
// shock absorber, SDP status, fees per the Mathematical Specification).
export async function GET() {
  try {
    await ensureSchema()
    const [ops, submissionCount] = await Promise.all([
      db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } }),
      db.formationInterest.count(),
    ]);

    const state = deriveState(ops);
    const recent = [...ops]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map((o) => ({
        type: o.type,
        participant: o.participant,
        amountUsd: o.amountUsd,
        mtq: o.mtq,
        reserveRatio: o.reserveRatio,
        porHash: o.porHash,
        createdAt: o.createdAt.toISOString(),
      }));

    // Compute the full Monetary Engine state from the v2.0 CORRECTED spec.
    const opIndex = ops.length;
    const oracle = getOracleSnapshot(opIndex);
    const reserveUsd = state.reserveValue * 0.90; // 90% in stablecoins/securities
    const reserveGoldUsd = state.reserveValue * 0.10; // 10% in gold
    const monetary = computeMonetaryState(
      oracle,
      reserveUsd,
      reserveGoldUsd,
      state.supply,
      opIndex,
      0.015 // current volatility (below normal threshold)
    );

    return NextResponse.json({
      testnet: {
        supply: state.supply,
        reserveValue: state.reserveValue,
        nav: state.nav,
        reserveRatio: state.reserveRatio,
        mintingPaused: state.mintingPaused,
        porHash: state.porHash,
        lastUpdate: state.lastUpdate,
        operationCount: ops.length,
        tiers: state.tiers,
        recentOperations: recent,
      },
      // Full Monetary Engine (Mathematical Specification v2.0 CORRECTED)
      monetary: {
        goldUsd: monetary.goldUsd,
        goldUsd12moAgo: monetary.goldUsd12moAgo,
        // §1.4 Target NAV (SDR-based) — the redemption liability anchor
        navTarget: monetary.navTarget,
        sdrValueUsd: monetary.sdrValueUsd,
        reserveUsd: monetary.reserveUsd,
        reserveGold: monetary.reserveGold,
        reserveTotal: monetary.reserveTotal,
        // §1.1 Current market NAV
        nav: monetary.nav,
        // §1.2 FIXED: Reserve Ratio = Reserve / (NAV_target × Supply)
        reserveRatio: monetary.reserveRatio,
        // §1.3 FIXED: Coverage = Reserve - (NAV_target × Supply)
        reserveCoverage: monetary.reserveCoverage,
        reserveCoveragePct: monetary.reserveCoveragePct,
        redemptionLiability: monetary.redemptionLiability,
        volatility: monetary.volatility,
        shockAbsorber: monetary.shockAbsorber,
        sdp: monetary.sdp,
        mintingPaused: monetary.mintingPaused,
        weights: monetary.weights.map((w) => ({
          code: w.code,
          name: w.name,
          combinedShare: w.combinedShare,
          momentumRaw: w.momentumRaw,
          momentumAdjusted: w.momentumAdjusted,
          momentum: w.momentum,
          meanReversion: w.meanReversion,
          momentumFactor: w.momentumFactor,
          rawWeight: w.rawWeight,
          normalizedWeight: w.normalizedWeight,
          goldPrice: w.goldPrice,
          goldPrice12moAgo: w.goldPrice12moAgo,
          isCapped: w.isCapped,
          emergencyWeight: w.emergencyWeight,
          smoothedWeight: w.smoothedWeight,
        })),
        // Fee schedule (§9)
        fees: {
          mint: { rate: "0.05%", cap: "$5,000", sample: mintFee(1_000_000) },
          redemption: { rate: "0.05%", cap: "$5,000", sample: redemptionFee(1_000_000) },
          transfer: { rate: "0.01%", cap: "$1,000" },
          custody: { rate: "0.10%/yr" },
        },
      },
      formation: {
        submissionCount,
        milestones: FORMATION_MILESTONES,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("transparency failed", err);
    return NextResponse.json({ error: "Could not load state." }, { status: 500 });
  }
}

const FORMATION_MILESTONES = [
  { id: "blueprint", label: "Constitution v18 FINAL published", done: true },
  { id: "github", label: "GitHub repository live", done: true },
  { id: "x", label: "X / Twitter presence", done: true },
  { id: "docs", label: "Public Constitution reference", done: true },
  { id: "testnet", label: "MTQ testnet simulator live", done: true },
  { id: "deck", label: "Investor teaser deck", done: true },
  { id: "intake", label: "Formation Committee intake open", done: true },
  { id: "operating-co", label: "Operating company incorporated (Entity B)", done: false },
  { id: "foundation", label: "Foundation registered (Entity A)", done: false },
  { id: "council", label: "Formation Committee seated", done: false },
  { id: "custody", label: "Qualified custody RFP issued", done: false },
  { id: "audit", label: "First independent security audit", done: false },
  { id: "anchor", label: "Anchor participant MOU signed", done: false },
  { id: "mainnet", label: "MTQ mainnet launched", done: false },
];
