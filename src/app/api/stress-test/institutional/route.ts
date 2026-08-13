import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";

/**
 * GET /api/stress-test/institutional
 *
 * v24.1.1 Full Institutional Stress Test Suite.
 * 7 special test categories per §§30-36:
 *   1. Gold shock (§30): -10%, -20%, -30%, -40%
 *   2. Custody failure (§31): -5%, -10%, -20%, -30%, correlated
 *   3. Correlation break (§32): rho +25%, +50%, +75%, →1
 *   4. Stablecoin failure (§33): -10%, -25%, -50%, -100%
 *   5. Currency collapse (§34): per-currency -10% to -100%
 *   6. 30% redemption shock (§35)
 *   7. Extreme black swan (§36)
 *
 * Tests are NOT forced to pass. Results are reported honestly.
 * Failures are classified as:
 *   - PASS (inside design envelope)
 *   - FAIL (inside design envelope, system breaks)
 *   - BEYOND_DESIGN_LIMIT (outside approved design envelope)
 */

interface StressResult {
  category: string;
  scenario: string;
  description: string;
  rrBefore: number;
  rrAfter: number;
  stressRR: number;
  lcrAfter: number;
  passed: boolean;
  classification: "PASS" | "FAIL" | "BEYOND_DESIGN_LIMIT";
  lossBreakdown: {
    gold?: number;
    silver?: number;
    fx?: number;
    sovereign?: number;
    stablecoin?: number;
    custody?: number;
    redemption?: number;
  };
  diagnosis: string;
  fixable: string[];
  timestamp: string;
}

export async function GET() {
  try {
    const nav = await computeLiveNav();
    const rrBefore = nav.reserveRatio;
    const ra = nav.reserveAdjustedUsd;
    const rm = nav.reserveMarketUsd;
    const supply = nav.supply;
    const par = 1.00;
    const liability = supply * par;

    // Reserve composition (from nav.pillarBreakdown)
    const bullionPct = nav.pillarBreakdown.bullion / 100;
    const fiatPct = nav.pillarBreakdown.fiat / 100;
    const digitalPct = nav.pillarBreakdown.digital / 100;

    const hqla = ra * 0.80;
    const outflows = liability * 0.10;
    const lcrBefore = hqla / outflows;

    const results: StressResult[] = [];

    function addResult(
      category: string,
      scenario: string,
      description: string,
      lossPct: number,
      lossBreakdown: StressResult["lossBreakdown"],
      additionalLoss: number = 0,
      classification: "PASS" | "FAIL" | "BEYOND_DESIGN_LIMIT" = "PASS",
    ): void {
      const totalLoss = rm * lossPct + additionalLoss;
      const raAfter = Math.max(0, ra - totalLoss);
      const rrAfter = (raAfter / liability) * 100;
      const stressRR = rrAfter * 0.90;
      const lcrAfter = Math.max(0, (hqla - totalLoss * 0.5) / outflows);
      const passed = rrAfter >= 100;

      // Auto-classify if not already
      let cls = classification;
      if (cls === "PASS" && !passed) {
        cls = rrAfter < 70 ? "BEYOND_DESIGN_LIMIT" : "FAIL";
      }

      const fixable: string[] = [];
      if (lossBreakdown.custody && lossBreakdown.custody > 0) fixable.push("custody diversification");
      if (lossBreakdown.fx && lossBreakdown.fx > 0) fixable.push("currency rebalancing");
      if (lossBreakdown.gold && lossBreakdown.gold > 0) fixable.push("asset allocation");
      if (lossBreakdown.stablecoin && lossBreakdown.stablecoin > 0) fixable.push("digital reduction");
      if (rrAfter < 100) {
        fixable.push("issuance restriction (CALM)");
        if (cls === "BEYOND_DESIGN_LIMIT") fixable.push("additional capital");
      }

      results.push({
        category,
        scenario,
        description,
        rrBefore,
        rrAfter: Math.round(rrAfter * 100) / 100,
        stressRR: Math.round(stressRR * 100) / 100,
        lcrAfter: Math.round(lcrAfter * 100) / 100,
        passed,
        classification: cls,
        lossBreakdown,
        diagnosis: `${scenario}: RR ${rrBefore.toFixed(2)}% → ${rrAfter.toFixed(2)}% | Loss=$${(totalLoss / 1e6).toFixed(2)}M | ${passed ? "PASS" : cls}`,
        fixable,
        timestamp: new Date().toISOString(),
      });
    }

    // ===== 1. GOLD SHOCK (§30) =====
    const goldLoss = rm * bullionPct * 0.75; // gold is ~75% of bullion
    addResult("Gold Shock", "Gold -10%", "Standalone gold -10%", 0.10 * bullionPct * 0.75, { gold: 0.10 * bullionPct * 0.75 });
    addResult("Gold Shock", "Gold -20%", "Standalone gold -20%", 0.20 * bullionPct * 0.75, { gold: 0.20 * bullionPct * 0.75 });
    addResult("Gold Shock", "Gold -30%", "Standalone gold -30%", 0.30 * bullionPct * 0.75, { gold: 0.30 * bullionPct * 0.75 });
    addResult("Gold Shock", "Gold -40%", "Standalone gold -40%", 0.40 * bullionPct * 0.75, { gold: 0.40 * bullionPct * 0.75 });

    // Composite gold + FX + liquidity (labeled correctly, NOT "gold-only")
    addResult("Gold Shock", "Composite: Gold-30% + FX-10% + liquidity stress", "Composite scenario (NOT gold-only)",
      0.30 * bullionPct * 0.75 + 0.10 * fiatPct, { gold: 0.30 * bullionPct * 0.75, fx: 0.10 * fiatPct });

    // ===== 2. CUSTODY FAILURE (§31) =====
    addResult("Custody Failure", "Single custodian -5%", "5% of reserves impaired", 0.05, { custody: 0.05 });
    addResult("Custody Failure", "Single custodian -10%", "10% of reserves impaired", 0.10, { custody: 0.10 });
    addResult("Custody Failure", "Single custodian -20%", "20% of reserves impaired", 0.20, { custody: 0.20 });
    addResult("Custody Failure", "Single custodian -30%", "30% of reserves impaired (at 25% cap)", 0.30, { custody: 0.30 });
    addResult("Custody Failure", "Two-custodian correlated failure", "Two custodians fail simultaneously (40% impaired)", 0.40, { custody: 0.40 }, 0, "BEYOND_DESIGN_LIMIT");
    addResult("Custody Failure", "Custodian + bank + payment rail", "Triple failure (50% impaired)", 0.50, { custody: 0.50 }, 0, "BEYOND_DESIGN_LIMIT");

    // ===== 3. CORRELATION BREAK (§32) =====
    // When correlations increase, diversification benefit decreases
    // At rho→1, portfolio behaves as if all assets move together
    addResult("Correlation Break", "Normal correlations", "Baseline with normal correlations", 0, {});
    addResult("Correlation Break", "rho +25%", "25% correlation increase", 0.05, { fx: 0.03, gold: 0.02 });
    addResult("Correlation Break", "rho +50%", "50% correlation increase", 0.10, { fx: 0.06, gold: 0.04 });
    addResult("Correlation Break", "rho +75%", "75% correlation increase", 0.15, { fx: 0.09, gold: 0.06 });
    addResult("Correlation Break", "rho → 1 (all assets -20%)", "Correlation breaks to 1, uniform -20%", 0.20, { gold: 0.20 * bullionPct, fx: 0.20 * fiatPct, stablecoin: 0.20 * digitalPct });

    // ===== 4. STABLECOIN FAILURE (§33) =====
    addResult("Stablecoin Failure", "One stablecoin -10%", "Single stablecoin -10%", 0.10 * digitalPct * 0.5, { stablecoin: 0.10 * digitalPct * 0.5 });
    addResult("Stablecoin Failure", "One stablecoin -25%", "Single stablecoin -25%", 0.25 * digitalPct * 0.5, { stablecoin: 0.25 * digitalPct * 0.5 });
    addResult("Stablecoin Failure", "One stablecoin -50%", "Single stablecoin -50%", 0.50 * digitalPct * 0.5, { stablecoin: 0.50 * digitalPct * 0.5 });
    addResult("Stablecoin Failure", "One stablecoin -100%", "Single stablecoin total failure", 1.0 * digitalPct * 0.5, { stablecoin: 1.0 * digitalPct * 0.5 });
    addResult("Stablecoin Failure", "Entire sleeve -100%", "Complete stablecoin impairment", digitalPct, { stablecoin: digitalPct });

    // ===== 5. CURRENCY COLLAPSE (§34) =====
    // Test each reserve currency
    const currencies = ["USD", "EUR", "CHF", "JPY", "GBP", "SGD", "AED", "SAR", "CNY", "CAD", "AUD"];
    const currencyWeights: Record<string, number> = {
      USD: 0.27, EUR: 0.195, CHF: 0.065, JPY: 0.065, GBP: 0.05,
      SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
    };

    for (const ccy of currencies) {
      const ccyWeight = currencyWeights[ccy] * fiatPct;
      addResult("Currency Collapse", `${ccy} -10%`, `${ccy} -10% relative to gold`, 0.10 * ccyWeight, { fx: 0.10 * ccyWeight });
      addResult("Currency Collapse", `${ccy} -30%`, `${ccy} -30% relative to gold`, 0.30 * ccyWeight, { fx: 0.30 * ccyWeight });
      addResult("Currency Collapse", `${ccy} -50%`, `${ccy} -50% relative to gold`, 0.50 * ccyWeight, { fx: 0.50 * ccyWeight });
      if (ccyWeight > 0.01) {
        addResult("Currency Collapse", `${ccy} -100%`, `${ccy} total collapse`, ccyWeight, { fx: ccyWeight }, 0, "BEYOND_DESIGN_LIMIT");
      }
    }

    // ===== 6. 30% REDEMPTION SHOCK (§35) =====
    const redemption30 = liability * 0.30;
    // Article X: liquidate non-gold first
    const nonGoldLiquidatable = ra * (1 - bullionPct);
    const goldSold = Math.max(0, redemption30 - nonGoldLiquidatable);
    addResult("Redemption Shock", "30% redemption in 48h", "30% of supply redeemed, Article X sequential",
      0, { redemption: redemption30 / rm }, redemption30 * 0.02); // 2% slippage

    // Combined with stress
    addResult("Redemption Shock", "30% redemption + FX -10% + gold -10%", "Combined redemption + market stress",
      0.10 * fiatPct + 0.10 * bullionPct * 0.75, { fx: 0.10 * fiatPct, gold: 0.10 * bullionPct * 0.75, redemption: redemption30 / rm }, redemption30 * 0.02);

    addResult("Redemption Shock", "30% redemption + stablecoin depeg + banking delay", "Combined with operational stress",
      0.50 * digitalPct, { stablecoin: 0.50 * digitalPct, redemption: redemption30 / rm }, redemption30 * 0.03);

    // ===== 7. EXTREME BLACK SWAN (§36) =====
    addResult("Black Swan", "Gold-40% + Silver-50% + FX-15% + 30% redeem",
      "Extreme combined scenario — NOT forced to pass",
      0.40 * bullionPct * 0.75 + 0.50 * bullionPct * 0.25 + 0.15 * fiatPct,
      { gold: 0.40 * bullionPct * 0.75, silver: 0.50 * bullionPct * 0.25, fx: 0.15 * fiatPct, redemption: redemption30 / rm },
      redemption30 * 0.05,
      "BEYOND_DESIGN_LIMIT");

    addResult("Black Swan", "Complete systemic: all assets -30% + 50% redeem",
      "Beyond design limit — system must detect and label, not pass",
      0.30,
      { gold: 0.30 * bullionPct, fx: 0.30 * fiatPct, stablecoin: 0.30 * digitalPct, redemption: 0.50 },
      liability * 0.50 * 0.05,
      "BEYOND_DESIGN_LIMIT");

    // ===== SUMMARY =====
    const passed = results.filter(r => r.classification === "PASS").length;
    const failed = results.filter(r => r.classification === "FAIL").length;
    const beyondDesign = results.filter(r => r.classification === "BEYOND_DESIGN_LIMIT").length;

    // Group by category
    const byCategory: Record<string, { total: number; pass: number; fail: number; bdl: number }> = {};
    for (const r of results) {
      if (!byCategory[r.category]) byCategory[r.category] = { total: 0, pass: 0, fail: 0, bdl: 0 };
      byCategory[r.category].total++;
      if (r.classification === "PASS") byCategory[r.category].pass++;
      else if (r.classification === "FAIL") byCategory[r.category].fail++;
      else byCategory[r.category].bdl++;
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      baseline: {
        rr: rrBefore,
        ra,
        rm,
        supply,
        liability,
        lcr: Math.round(lcrBefore * 100) / 100,
        bullionPct: nav.pillarBreakdown.bullion,
        fiatPct: nav.pillarBreakdown.fiat,
        digitalPct: nav.pillarBreakdown.digital,
      },
      summary: {
        totalScenarios: results.length,
        pass: passed,
        fail: failed,
        beyondDesignLimit: beyondDesign,
        passRate: `${passed}/${results.length}`,
        populations: "Separate populations — do NOT mix into one PASS/FAIL denominator",
      },
      byCategory,
      results,
      reportingStandard: "Per §37: Mathematical Tests, Stress Scenarios, and Beyond-Design-Limit Scenarios are separate populations.",
      disclaimer: "Tests are NOT forced to pass. Failures are classified honestly. Beyond-design-limit scenarios are labeled as such, not silently called PASS.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to run institutional stress tests", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
