import { NextResponse } from "next/server";
import { getContractInfo } from "@/lib/contract-reader";
import { getOracleSnapshot } from "@/lib/oracle-client";
import {
  computeMonetaryStateV19,
  HAIRCUTS,
  type ReserveAsset,
} from "@/lib/monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "@/lib/live-oracle";

/**
 * GET /api/contract/info — public read-only contract + monetary snapshot.
 *
 * Combines:
 *   (1) On-chain ERC-20 contract data for the deployed MTQ token on Monad
 *       Testnet (name, symbol, decimals, totalSupply, address, explorer link)
 *       — read via the read-only contract reader (eth_call, no transactions).
 *   (2) Live oracle prices (goldUsd, silverUsd, stablecoins) from the
 *       on-chain MockOracle if deployed, otherwise from the free public-API
 *       fallback (gold-api.com).
 *   (3) The full v19.0 Monetary Engine computation against the live gold
 *       price: 3-layer reserve valuation (market / prudential / liquidation),
 *       3 NAVs (market / prudential / stress), the Constitutional Reserve
 *       Ratio (§4 = R_a / (S × NAV_m)), and the 5-component reserve basket
 *       per §23 (50% cash, 25% sovereign, 15% gold, 5% silver, 5% stablecoin).
 *
 * Constitutional context:
 *   §2 Three-Layer Reserve Valuation (R_m / R_a / R_l).
 *   §3 Three NAV Definitions (NAV_m / NAV_l / NAV_stress).
 *   §4 Reserve Ratio = R_a / (S × NAV_m) — the 100%+ reserve invariant.
 *   §23 Reserve composition tiers (Fiat 75% / Bullion 20% / Stable 5%).
 *
 * This endpoint is the canonical "what is MTQ worth right now?" surface —
 * it is what the institutional dashboard and external integrations consume
 * to display NAV, reserve ratio and the live contract supply.
 */
export async function GET() {
  try {
    // ---- (1) On-chain contract data (name/symbol/decimals/supply) ----
    const contract = await getContractInfo();

    // ---- (2) Live oracle prices (for display + monetary engine) ----
    // Two oracle surfaces are intentionally distinguished:
    //   - `oracleSnapshot` (oracle-client) is the published gold/silver
    //     surface that the MockOracle contract would expose on mainnet —
    //     this is what the public sees in the response payload.
    //   - `liveData` + `oracleForEngine` (live-oracle) additionally carries
    //     the 8-currency FX basket, historical anchors and momentum inputs
    //     that the v19.0 Currency Engine (§12-22) needs to compute basket
    //     weights. We do NOT publish this entire blob here — only the
    //     top-level NAV / reserve / ratio outputs that depend on it.
    const oracleSnapshot = await getOracleSnapshot();
    const liveData = await getLiveOracleData();
    const oracleForEngine = toOracleSnapshot(liveData);

    // ---- (3) Build the reserve basket per §23 ----
    // Testnet baseline reserve: $54M (per COO/CTO directive — chosen so that
    // the prudential NAV is comfortably above 1.0 even after haircuts, which
    // keeps the testnet dashboard off the minting-pause threshold).
    const totalReserve = 54_000_000;
    const goldPrice = liveData.goldUsd; // live USD/oz
    const silverPrice = oracleSnapshot.silverUsd || 25;

    const reserveAssets: ReserveAsset[] = [
      // Fiat Layer (75%): 50% cash + 25% sovereign (≤1yr)
      {
        id: "cash-1",
        name: "Central-bank cash",
        assetClass: "cash",
        quantity: totalReserve * 0.50,
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
        quantity: totalReserve * 0.25,
        priceUsd: 1,
        haircut: HAIRCUTS.sovereign,
        counterpartyScore: 0.99,
        stressCoefficient: 0.9,
        modifiedDuration: 0.5,
      },
      // Bullion Layer (20%): 15% gold + 5% silver (priced in oz)
      {
        id: "gold-1",
        name: "Allocated gold",
        assetClass: "gold",
        quantity: (totalReserve * 0.15) / goldPrice,
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
        quantity: (totalReserve * 0.05) / silverPrice,
        priceUsd: silverPrice,
        haircut: HAIRCUTS.silver,
        counterpartyScore: 1.0,
        stressCoefficient: 0.8,
        modifiedDuration: 0,
      },
      // Stablecoin Layer (5%): regulated stablecoins
      {
        id: "stab-1",
        name: "Regulated stablecoins",
        assetClass: "stablecoin",
        quantity: totalReserve * 0.05,
        priceUsd: 1,
        haircut: HAIRCUTS.stablecoin,
        counterpartyScore: 0.96,
        stressCoefficient: 0.8,
        modifiedDuration: 0,
      },
    ];

    /**
     * Monetary-engine supply: the testnet simulator's baseline circulation
     * (50,000,000 MTQ). The on-chain ERC-20 totalSupply (≈110 MTQ) is only
     * the deployer's initial mint, NOT the simulator's circulating supply —
     * using it for NAV would give $54M / 110 = $490,909 per MTQ instead of
     * the target ~$1.00 peg. The actual on-chain supply is published below
     * as `onChainTotalSupply` / `onChainTotalSupplyDisplay` for verification
     * (audit fix, Task ID FIX · BUG 2).
     */
    const onChainTotalSupply = contract.totalSupply; // bigint (wei)
    const onChainTotalSupplyDisplay = contract.totalSupplyDisplay; // number (e.g. 110 MTQ)
    const totalSupply = 50_000_000; // simulator baseline (MTQ units, used for NAV = R / S)

    // LCR inputs (§5): 60% of reserves qualify as HQLA; 10% of supply is the
    // 30-day expected redemption assumption; no committed inflows on testnet.
    const lcr = {
      hqla: totalReserve * 0.6,
      expectedRedemptions: totalSupply * 0.1,
      committedInflows: 0,
      operationalAdjustments: 0,
    };

    // CRI inputs (§9): synthetic risk-component scores (0-100 each). These
    // are placeholder values appropriate for a testnet baseline; on mainnet
    // they will be sourced from live counterparty / custody / FX monitoring.
    const cri = {
      liquidity: 20,
      fx: 30,
      custody: 25,
      counterparty: 40,
      operational: 15,
    };

    const monetary = computeMonetaryStateV19(
      oracleForEngine,
      reserveAssets,
      totalSupply,
      lcr,
      cri,
      0.015, // baseline EWMA volatility fallback
      [] // no daily-return series on testnet — engine falls back to the above
    );

    return NextResponse.json({
      // ---- (1) On-chain contract metadata ----
      contract: {
        name: contract.name,
        symbol: contract.symbol,
        decimals: contract.decimals,
        // Simulator baseline supply (50M MTQ) — what the monetary engine uses
        // for NAV = R / S. Returned in wei for BigDecimal-safe consumers.
        totalSupply: (BigInt(totalSupply) * 10n ** BigInt(contract.decimals)).toString(),
        totalSupplyDisplay: totalSupply,
        // Actual on-chain ERC-20 totalSupply (≈110 MTQ = deployer's initial
        // mint). Published separately for verification — NOT used for NAV.
        onChainTotalSupply: onChainTotalSupply.toString(),
        onChainTotalSupplyDisplay: onChainTotalSupplyDisplay,
        address: contract.address,
        explorerLink: contract.explorerLink,
        network: contract.network,
      },
      // ---- (2) Live oracle prices ----
      oracle: {
        goldUsd: oracleSnapshot.goldUsd,
        silverUsd: oracleSnapshot.silverUsd,
        stablecoins: oracleSnapshot.stablecoins,
        source: oracleSnapshot.source,
        oracleAddress: oracleSnapshot.oracleAddress,
        fetchedAt: oracleSnapshot.fetchedAt,
      },
      // ---- (3) v19.0 Monetary Engine outputs ----
      monetary: {
        // §2 Three-layer reserve valuation
        reserves: {
          market: monetary.reserves.market,
          prudential: monetary.reserves.adjusted, // R_a
          stress: monetary.reserves.liquidation, // R_l
          hierarchyValid: monetary.reserves.hierarchyValid,
        },
        // §3 Three NAVs
        nav: {
          market: monetary.nav.market,
          prudential: monetary.nav.prudential,
          stress: monetary.nav.stress,
          hierarchyValid: monetary.nav.hierarchyValid,
        },
        // §4 Reserve Ratio (RR = R_a / (S × NAV_m))
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
        // §9 CRI
        cri: {
          cri: monetary.cri.cri,
          level: monetary.cri.level,
          components: monetary.cri.components,
        },
      },
      // Reserve composition published for transparency
      reserves: {
        totalReserve,
        allocation: reserveAssets.map((a) => ({
          id: a.id,
          name: a.name,
          assetClass: a.assetClass,
          quantity: a.quantity,
          priceUsd: a.priceUsd,
          marketValue: a.quantity * a.priceUsd,
          haircut: a.haircut,
        })),
        // §23 allocation summary
        composition: {
          cash: 0.5,
          sovereign: 0.25,
          gold: 0.15,
          silver: 0.05,
          stablecoin: 0.05,
        },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[contract/info] failed:", err);
    return NextResponse.json(
      {
        error: "Could not fetch contract info.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
