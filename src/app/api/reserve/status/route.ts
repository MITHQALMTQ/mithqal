import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { getOracleSnapshot } from "@/lib/oracle-client";
import {
  computeMonetaryStateV19,
  type ReserveAsset,
  HAIRCUTS,
} from "@/lib/monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "@/lib/live-oracle";
import { getContractInfo } from "@/lib/contract-reader";

/**
 * GET /api/reserve/status — public, unauthenticated snapshot of the
 * Mithqal reserve composition and live valuation per §23 of the v19.0
 * Constitutional Monetary Infrastructure Specification.
 *
 * Reserve composition (§23):
 *   Fiat 75%   → 50% central-bank cash + 25% sovereign T-bills (≤1yr)
 *   Bullion 20% → 15% allocated gold + 5% allocated silver
 *   Stablecoins 5% → regulated stablecoins (USDC/USDT/DAI)
 *
 * totalReserve baseline: $54,000,000 (testnet baseline).
 *
 * Returns:
 *   {
 *     totalReserveUsd,
 *     reserves: [{ assetType, amount, valueUsd, sharePct, haircut }],
 *     threeLayer:  { market, adjusted, liquidation },
 *     nav:         { market, prudential, stress },
 *     reserveRatio:{ ratio, compliant },
 *     goldPrice, silverPrice,
 *     oracleSource, lastUpdated
 *   }
 */
export async function GET() {
  try {
    await ensureSchema();

    // §23 Reserve composition baseline (testnet)
    const totalReserve = 54_000_000;

    // Live oracle data — try on-chain first, fall back to free APIs.
    const [oracle, liveData, latestReserves, contractInfo] = await Promise.all([
      getOracleSnapshot(),
      getLiveOracleData(),
      db.reserves.latest(),
      getContractInfo().catch(() => null),
    ]);

    const oracleSnapshot = toOracleSnapshot(liveData);
    const goldPrice = oracle.goldUsd;
    const silverPrice = oracle.silverUsd;

    // Build the §23 reserve composition with proper haircuts.
    const cashValue = totalReserve * 0.50;
    const sovereignValue = totalReserve * 0.25;
    const goldValue = totalReserve * 0.15;
    const silverValue = totalReserve * 0.05;
    const stablecoinValue = totalReserve * 0.05;

    const reserveAssets: ReserveAsset[] = [
      {
        id: "cash-1",
        name: "Central-bank cash",
        assetClass: "cash",
        quantity: cashValue,
        priceUsd: 1,
        haircut: HAIRCUTS.cash,
        counterpartyScore: 1.0,
        stressCoefficient: 0.95,
        modifiedDuration: 0,
      },
      {
        id: "sov-1",
        name: "US T-bills ≤1yr",
        assetClass: "sovereign",
        quantity: sovereignValue,
        priceUsd: 1,
        haircut: HAIRCUTS.sovereign,
        counterpartyScore: 0.99,
        stressCoefficient: 0.9,
        modifiedDuration: 0.5,
      },
      {
        id: "gold-1",
        name: "Allocated gold",
        assetClass: "gold",
        quantity: goldValue / goldPrice,
        priceUsd: goldPrice,
        haircut: HAIRCUTS.gold,
        counterpartyScore: 1.0,
        stressCoefficient: 0.85,
        modifiedDuration: 0,
      },
      {
        id: "silver-1",
        name: "Allocated silver",
        assetClass: "silver",
        quantity: silverValue / silverPrice,
        priceUsd: silverPrice,
        haircut: HAIRCUTS.silver,
        counterpartyScore: 1.0,
        stressCoefficient: 0.8,
        modifiedDuration: 0,
      },
      {
        id: "stab-1",
        name: "Regulated stablecoins",
        assetClass: "stablecoin",
        quantity: stablecoinValue,
        priceUsd: 1,
        haircut: HAIRCUTS.stablecoin,
        counterpartyScore: 0.96,
        stressCoefficient: 0.8,
        modifiedDuration: 0,
      },
    ];

    // Live MTQ supply from the on-chain contract (fallback to testnet baseline).
    const supply = contractInfo?.totalSupplyDisplay ?? 50_000_000;

    // Compute the full v19.0 monetary state (3-layer reserves, 3 NAVs, RR).
    const monetary = computeMonetaryStateV19(
      oracleSnapshot,
      reserveAssets,
      supply,
      {
        hqla: totalReserve * 0.6,
        expectedRedemptions: supply * 0.1,
        committedInflows: 0,
        operationalAdjustments: 0,
      },
      { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 },
      0.015,
      []
    );

    // Compose the public reserve composition view (per-asset share + haircut).
    const reserves = reserveAssets.map((a) => {
      const valueUsd = a.quantity * a.priceUsd;
      return {
        assetType: a.assetClass,
        name: a.name,
        amount: a.quantity,
        valueUsd,
        sharePct: (valueUsd / totalReserve) * 100,
        haircut: a.haircut,
      };
    });

    return NextResponse.json({
      totalReserveUsd: totalReserve,
      reserves,
      threeLayer: {
        market: monetary.reserves.market,
        adjusted: monetary.reserves.adjusted,
        liquidation: monetary.reserves.liquidation,
        hierarchyValid: monetary.reserves.hierarchyValid,
      },
      nav: {
        market: monetary.nav.market,
        prudential: monetary.nav.prudential,
        stress: monetary.nav.stress,
        hierarchyValid: monetary.nav.hierarchyValid,
      },
      reserveRatio: {
        ratio: monetary.reserveRatio.ratio,
        compliant: monetary.reserveRatio.compliant,
        policyTarget: monetary.reserveRatio.policyTarget,
      },
      goldPrice,
      silverPrice,
      oracleSource: oracle.source,
      oracleAddress: oracle.oracleAddress,
      // Latest persisted reserve snapshots from the DB (may be empty initially)
      dbSnapshots: latestReserves,
      // MTQ on-chain contract info (for cross-reference with the supply used)
      contract: contractInfo
        ? {
            address: contractInfo.address,
            name: contractInfo.name,
            symbol: contractInfo.symbol,
            decimals: contractInfo.decimals,
            totalSupply: contractInfo.totalSupplyDisplay,
            explorerLink: contractInfo.explorerLink,
            network: contractInfo.network,
          }
        : null,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("reserve status failed:", err);
    return NextResponse.json(
      {
        error: "Could not load reserve status.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
