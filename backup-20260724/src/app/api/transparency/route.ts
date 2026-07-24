import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";
import { computeMonetaryStateV19, mintFee, redemptionFee, HAIRCUTS, MAX_DURATION, type ReserveAsset } from "@/lib/monetary-engine-v19";
import { getOracleSnapshot } from "@/lib/oracle-data";

// GET /api/transparency — public, unauthenticated snapshot of the
// Institution's live state per the v19.0 Constitutional Monetary Infrastructure
// Specification. Returns: 3-layer reserves, 3 NAVs, Reserve Ratio (§4), LCR (§5),
// duration (§8), CRI (§9), 8-currency basket with momentum/reversion/liquidity,
// shock absorber (EWMA), basket verification (§22A), and fee schedule.
export async function GET() {
  try {
    await ensureSchema();
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

    // Build reserve assets for the v19.0 three-layer valuation.
    // Simulate a diversified portfolio: 50% cash, 20% sovereign, 15% gold, 10% stablecoins, 5% silver.
    const totalReserve = state.reserveValue || 50_000_000;
    const reserveAssets: ReserveAsset[] = [
      { id: "cash-1", name: "Central-bank cash", assetClass: "cash", quantity: totalReserve * 0.50, priceUsd: 1, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0 },
      { id: "sov-1", name: "US T-bills ≤1yr", assetClass: "sovereign", quantity: totalReserve * 0.20, priceUsd: 1, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5 },
      { id: "gold-1", name: "Allocated gold", assetClass: "gold", quantity: (totalReserve * 0.15) / 1850, priceUsd: 1850, haircut: HAIRCUTS.gold, counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0 },
      { id: "stab-1", name: "Regulated stablecoins", assetClass: "stablecoin", quantity: totalReserve * 0.10, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0 },
      { id: "silver-1", name: "Allocated silver", assetClass: "silver", quantity: (totalReserve * 0.05) / 25, priceUsd: 25, haircut: HAIRCUTS.silver, counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0 },
    ];

    const opIndex = ops.length;
    const oracle = getOracleSnapshot(opIndex);
    const monetary = computeMonetaryStateV19(
      oracle,
      reserveAssets,
      state.supply || 50_000_000,
      // LCR inputs (simulated — in production from actual redemption history)
      {
        hqla: totalReserve * 0.60, // 60% of reserves are HQLA
        expectedRedemptions: (state.supply || 50_000_000) * 0.10, // 10% expected redemption
        committedInflows: 0,
        operationalAdjustments: 0,
      },
      // CRI inputs (simulated — in production from live risk monitoring)
      { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 },
      0.015, // volatility
      [] // EWMA returns (use fallback volatility for now)
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
      // v19.0 Monetary Engine
      monetary: {
        specVersion: "v19.0",
        goldUsd: monetary.goldUsd,
        // §2 Three-layer reserve valuation
        reserves: {
          market: monetary.reserves.market,
          adjusted: monetary.reserves.adjusted,
          liquidation: monetary.reserves.liquidation,
          hierarchyValid: monetary.reserves.hierarchyValid,
        },
        // §3 Three NAVs
        nav: {
          market: monetary.nav.market,
          prudential: monetary.nav.prudential,
          stress: monetary.nav.stress,
          hierarchyValid: monetary.nav.hierarchyValid,
        },
        // §4 Reserve Ratio
        reserveRatio: {
          ratio: monetary.reserveRatio.ratio,
          redemptionLiability: monetary.reserveRatio.redemptionLiability,
          adjustedReserve: monetary.reserveRatio.adjustedReserve,
          marketReserve: monetary.reserveRatio.marketReserve,
          compliant: monetary.reserveRatio.compliant,
          policyTarget: monetary.reserveRatio.policyTarget,
        },
        // §5 LCR
        lcr: {
          ratio: monetary.lcr.ratio,
          hqla: monetary.lcr.hqla,
          netOutflow: monetary.lcr.netOutflow,
          compliant: monetary.lcr.compliant,
          strong: monetary.lcr.strong,
        },
        // §8 Duration
        portfolioDuration: monetary.portfolioDuration,
        durationCompliant: monetary.durationCompliant,
        maxDuration: MAX_DURATION,
        // §9 CRI
        cri: {
          cri: monetary.cri.cri,
          level: monetary.cri.level,
          components: monetary.cri.components,
        },
        // §17 Shock absorber (EWMA)
        volatility: monetary.volatility,
        shockAbsorber: monetary.shockAbsorber,
        // §22A Basket verification
        basketVerification: monetary.basketVerification,
        // §12-22 Currency basket
        weights: monetary.weights.map((w) => ({
          code: w.code,
          name: w.name,
          structuralWeight: w.structuralWeight,
          momentumRaw: w.momentumRaw,
          momentum: w.momentum,
          meanReversion: w.meanReversion,
          liquidity: w.liquidity,
          kFactor: w.kFactor,
          rawWeight: w.rawWeight,
          normalizedWeight: w.normalizedWeight,
          isCapped: w.isCapped,
          belowFloor: w.belowFloor,
          goldPrice: w.goldPrice,
          goldPrice12moAgo: w.goldPrice12moAgo,
        })),
        // §6 Haircut schedule
        haircuts: HAIRCUTS,
        // §9 Fees
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
  { id: "blueprint", label: "Constitution v19.0 published", done: true },
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
