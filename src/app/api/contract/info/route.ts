import { NextResponse } from "next/server";
import { getContractInfo } from "@/lib/contract-reader";
import { getOracleSnapshot } from "@/lib/oracle-client";
import { MAX_DURATION } from "@/lib/monetary-engine-v19";
import { computeLiveNav } from "@/lib/nav-compute";

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
 *   (3) The full v19.0.3 Monetary Engine computation, sourced from the
 *       UNIFIED `computeLiveNav()` helper (Task 5-a — single source of
 *       truth). This is the SAME computation that /api/mint, /api/redeem,
 *       /api/transfer, /api/transparency (monetary.nav override),
 *       /api/nav, the public-site hero, the testnet banner, and the
 *       stress-test-proof component all consume, so every "1 MTQ = $X"
 *       surface in the application reports the identical number.
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
 *
 * Task 5-a — Price Unification:
 *   Previously this route built its own reserve composition inline
 *   ($54M total / 50% cash / 25% sovereign / 15% gold / 5% silver / 5%
 *   stablecoin) and used totalSupply = 50_000_000 for NAV = R / S, which
 *   produced a NAV different from /api/mint + /api/redeem (which used
 *   computeLiveNav() against the v19.0.2 baseline composition with 54M
 *   supply). Now both paths funnel through computeLiveNav(), so every
 *   caller agrees.
 */
export async function GET() {
  try {
    // ---- (1) On-chain contract data (name/symbol/decimals/supply) ----
    const contract = await getContractInfo();

    // ---- (2) Live oracle prices (published snapshot for display) ----
    // Two oracle surfaces are intentionally distinguished:
    //   - `oracleSnapshot` (oracle-client) is the published gold/silver
    //     surface that the MockOracle contract would expose on mainnet —
    //     this is what the public sees in the response payload.
    //   - `navResult` (from computeLiveNav) additionally carries the
    //     8-currency FX basket, historical anchors and momentum inputs
    //     that the v19.0.3 Currency Engine (§12-22) needs to compute basket
    //     weights. We do NOT publish this entire blob here — only the
    //     top-level NAV / reserve / ratio outputs that depend on it.
    const oracleSnapshot = await getOracleSnapshot();

    // ---- (3) UNIFIED live NAV computation (Task 5-a) ----
    // Same path as /api/mint, /api/redeem, /api/transfer, /api/nav →
    // every "1 MTQ = $X" surface in the app reports the identical number.
    const navResult = await computeLiveNav();
    const monetary = navResult.state;
    const reserveAssets = navResult.reserveAssets;

    /**
     * Monetary-engine supply: the v19.0.2 baseline circulation
     * (54,000,000 MTQ — the over-collateralized supply that backs the
     * institutional NAV). The on-chain ERC-20 totalSupply (≈110 MTQ) is
     * only the deployer's initial mint, NOT the institutional supply —
     * using it for NAV would give $54M / 110 = $490,909 per MTQ instead
     * of the target ~$1.04. The actual on-chain supply is published below
     * as `onChainTotalSupply` / `onChainTotalSupplyDisplay` for
     * verification (audit fix, Task ID FIX · BUG 2).
     */
    const onChainTotalSupply = contract.totalSupply; // bigint (wei)
    const onChainTotalSupplyDisplay = contract.totalSupplyDisplay; // number (e.g. 110 MTQ)
    const totalSupply = navResult.supply; // 54,000,000 — unified baseline

    return NextResponse.json({
      // ---- (1) On-chain contract metadata ----
      contract: {
        name: contract.name,
        symbol: contract.symbol,
        decimals: contract.decimals,
        // Unified baseline supply (54M MTQ) — what the monetary engine uses
        // for NAV = R / S. Returned in wei for BigDecimal-safe consumers.
        totalSupply: (BigInt(totalSupply) * BigInt(10) ** BigInt(contract.decimals)).toString(),
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
      // ---- (3) v19.0.3 Monetary Engine outputs (UNIFIED — Task 5-a) ----
      monetary: {
        // §2 Three-layer reserve valuation
        reserves: {
          market: monetary.reserves.market,
          prudential: monetary.reserves.adjusted, // R_a
          stress: monetary.reserves.liquidation, // R_l
          hierarchyValid: monetary.reserves.hierarchyValid,
        },
        // §3 Three NAVs — sourced from computeLiveNav() (same as /api/mint)
        nav: {
          market: navResult.navM,
          prudential: navResult.navL,
          stress: navResult.navStress,
          hierarchyValid: monetary.nav.hierarchyValid,
        },
        // §4 Reserve Ratio (RR = R_a / (S × NAV_m))
        reserveRatio: {
          ratio: navResult.reserveRatio,
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
      // Reserve composition published for transparency — sourced from the
      // SAME reserveAssets array that produced the NAV (Task 5-a invariant:
      // the displayed composition and the displayed NAV cannot drift apart).
      reserves: {
        totalReserve: monetary.reserves.market,
        allocation: reserveAssets.map((a) => ({
          id: a.id,
          name: a.name,
          assetClass: a.assetClass,
          quantity: a.quantity,
          priceUsd: a.priceUsd,
          marketValue: a.quantity * a.priceUsd,
          haircut: a.haircut,
        })),
        // §23 live composition summary (v19.0.2 — Task 6-a fix).
        // Previously this field was hardcoded to the §23 policy TARGETS
        // (cash 50% / sov 25% / gold 15% / silver 5% / stablecoin 5%) and
        // labeled as the "current composition", which was misleading — the
        // actual composition (computed from the live reserveAssets revalued
        // at the live gold + silver price) drifts from the policy targets
        // as bullion prices move. Now we compute the per-asset-class share
        // from the SAME reserveAssets array that produced the NAV, so the
        // displayed composition always matches the displayed price.
        composition: (() => {
          const totals: Record<string, number> = {};
          let grandTotal = 0;
          for (const a of reserveAssets) {
            const v = a.quantity * a.priceUsd;
            totals[a.assetClass] = (totals[a.assetClass] ?? 0) + v;
            grandTotal += v;
          }
          const out: Record<string, number> = {};
          for (const cls of ["cash", "sovereign", "gold", "silver", "stablecoin"]) {
            out[cls] = grandTotal > 0
              ? parseFloat(((totals[cls] ?? 0) / grandTotal).toFixed(6))
              : 0;
          }
          return out;
        })(),
      },
      // §8 portfolio duration metadata (compliance flag + constitutional max)
      duration: {
        portfolio: monetary.portfolioDuration,
        compliant: monetary.durationCompliant,
        max: MAX_DURATION,
      },
      // Task 5-a — surface the unified-source identifier so auditors can
      // verify the displayed NAV comes from the same path as /api/mint.
      source: "live-oracle-v19.0.2",
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
