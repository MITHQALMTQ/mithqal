import { NextResponse } from "next/server";
import { computeCbgrs, runCbgrsStressSuite } from "@/lib/cbgrs";
import { computeLiveNav } from "@/lib/nav-compute";

/**
 * GET /api/cbgrs/stress — CBGRS Stress Test Suite (12 mandatory scenarios)
 *
 * Per v24.1.1 §3.7B, the following 12 deterministic stress scenarios MUST be run:
 *   A. One-currency -10% gold-relative shock
 *   B. One-currency -20% shock
 *   C. One-currency -30% shock
 *   D. CNY full impairment scenario
 *   E. EUR severe depreciation scenario
 *   F. USD severe depreciation scenario
 *   G. 20% simultaneous non-USD basket shock
 *   H. Broad multi-currency + gold/silver stress
 *   I. Complete stablecoin impairment
 *   J. Oracle stale-data scenario
 *   K. Currency exit and renormalization scenario
 *   L. Currency reinstatement scenario
 *
 * Each scenario reports: CBGRS before/after, weights before/after, exited
 * currencies, RR before/after, LCR after.
 *
 * CBGRS SHALL NEVER be interpreted as proof of solvency.
 */
export async function GET() {
  try {
    const [cbgrs, nav] = await Promise.all([
      computeCbgrs(),
      computeLiveNav(),
    ]);

    const scenarios = runCbgrsStressSuite(cbgrs, nav.reserveRatio);

    const passed = scenarios.filter((s) => s.passed).length;
    const failed = scenarios.filter((s) => !s.passed).length;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      baseCbgrs: cbgrs.cbgrs,
      baseRR: nav.reserveRatio,
      scenarioCount: scenarios.length,
      passed,
      failed,
      summary: `${passed}/${scenarios.length} scenarios passed (floor = RR ≥ 100%)`,
      scenarios: scenarios.map((s) => ({
        name: s.name,
        description: s.description,
        shocks: s.shocks,
        cbgrsBefore: s.cbgrsBefore,
        cbgrsAfter: s.cbgrsAfter,
        cbgrsChange: Math.round((s.cbgrsAfter - s.cbgrsBefore) * 1e8) / 1e8,
        rrBefore: s.rrBefore,
        rrAfter: s.rrAfter,
        exitedCurrencies: s.exitedCurrencies,
        passed: s.passed,
        weightsBefore: s.weightsBefore,
        weightsAfter: s.weightsAfter,
      })),
      disclaimer:
        "CBGRS is an advisory metric. Stress test results do NOT constitute proof of solvency. " +
        "RR remains the single legal solvency metric. CBGRS does NOT trigger rebalancing.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to run CBGRS stress suite",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
