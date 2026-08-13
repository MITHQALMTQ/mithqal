import { NextResponse } from "next/server";
import { computeCbgrs, runCbgrsStressSuite } from "@/lib/cbgrs";
import { computeLiveNav } from "@/lib/nav-compute";

/**
 * GET /api/cbgrs — Currency Basket Gold-Relative Strength (CBGRS)
 *
 * v24.1.1 §3.7B — Layer 2 Advisory metric.
 *
 * CBGRS measures the aggregate strength of the eligible reserve-currency
 * basket relative to gold using a weighted geometric mean.
 *
 * This is an ADVISORY metric only. It does NOT:
 *   - replace RR (the single legal solvency metric)
 *   - modify PAR
 *   - trigger rebalancing
 *   - authorize minting/redemption
 *   - serve as a trading signal
 *
 * Returns:
 *   - cbgrs: canonical weighted geometric mean
 *   - cbgrsArithmetic: DIAGNOSTIC ONLY (not canonical)
 *   - per-currency G_i(t), w_i(t), depreciation
 *   - oracle status, base date, methodology version
 *   - change from base
 */
export async function GET() {
  try {
    const [cbgrs, nav] = await Promise.all([
      computeCbgrs(),
      computeLiveNav(),
    ]);

    return NextResponse.json({
      ...cbgrs,
      rr: nav.reserveRatio,
      nav: {
        navM: nav.navM,
        navL: nav.navL,
        goldUsd: nav.goldUsd,
        silverUsd: nav.silverUsd,
        reserveRatio: nav.reserveRatio,
        usdConcentration: nav.usdConcentration,
      },
      spec: {
        name: "Currency Basket Gold-Relative Strength",
        abbreviation: "CBGRS",
        layer: "Layer 2 — Gold-Relative Strength (Advisory)",
        classification: [
          "Advisory",
          "Non-solvency",
          "Non-PAR",
          "Non-minting",
          "Non-redemption-trigger",
          "Non-trading-signal",
        ],
        formula: "CBGRS_t = PRODUCT[ G_i(t) ^ w_i(t) ]",
        canonicalMethod: "weighted geometric mean",
        diagnosticMethod: "weighted arithmetic mean (NOT canonical)",
        basePeriod: cbgrs.baseDate,
        prohibitedClaims: [
          "CBGRS proves MTQ is stable",
          "CBGRS guarantees MTQ appreciation",
          "CBGRS guarantees purchasing power",
          "Gold price increases automatically increase MTQ price",
          "CBGRS is a solvency ratio",
        ],
        correctLanguage:
          "CBGRS is an advisory measure of the aggregate gold-relative strength of the active reserve-currency basket.",
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to compute CBGRS",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
