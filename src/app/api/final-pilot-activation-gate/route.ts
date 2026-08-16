// v25.0 Institutional Closure 8/8 — FINAL PILOT ACTIVATION GATE API ROUTE
// =================================================================
// Task ID: 8/8-FINAL-PILOT-ACTIVATION-GATE
//
// Returns the full FINAL PILOT ACTIVATION GATE executive report.
// The report contains:
//   • 10 task gates (9 substantive + 1 FINAL_DECISION placeholder)
//   • 10 standing blockers (BLK-01..BLK-10)
//   • Final verdict (PILOT-READY, AMBER)
//   • 3 NEVER rules (enforced)
//   • 12 acceptance criteria (self-check)
//   • Markdown report string (for docs/verification/)
//
// HONEST STATE: This route returns the same verdict every call:
//   finalStatus = PILOT-READY
//   finalStatusColor = AMBER
//   realWorldEvidencePresent = false
//   10 standing blockers OPEN or PARTIALLY_ADDRESSED
//
// The verdict will only change when:
//   • Real custodians are contracted (CUST-1, CUST-2 PASS)
//   • Real banks are partnered (BANK-1, BANK-2 PASS)
//   • External reviewers engaged (EXT-1, EXT-2, EXT-3 PASS)
//   • Licenses obtained (REG-1..REG-7 PASS)
//   • Capital raised (ECON-2, ECON-5 PASS)
//   • SC changes deployed (BLK-06 RESOLVED)
//   • Sharia board empaneled (SHAR-1 PASS)
//   • DR / incident / recovery tested (OPS-1, OPS-2, OPS-4, OPS-5 PASS)
//   • 100+ pilot transactions executed (PIL-1 PASS)
// =================================================================

import { NextResponse } from "next/server";
import {
  generateExecutiveReport,
  formatExecutiveReportMarkdown,
  SHARIA_DISCLOSURE_BANNER,
  countAcceptancePasses,
  gateIsHonest,
  verdictSummary,
  MODULE_ID,
} from "@/lib/final-pilot-activation-gate";

export async function GET() {
  try {
    const report = generateExecutiveReport();
    const markdown = formatExecutiveReportMarkdown(report);
    const acceptance = countAcceptancePasses(report);
    const honest = gateIsHonest(report);
    const summary = verdictSummary(report);

    return NextResponse.json({
      generatedAt: report.generatedAt,
      moduleId: report.moduleId,
      series: "MITHQAL v25.0 Institutional Closure (1/8 → 8/8)",
      promptId: "8/8-FINAL-PILOT-ACTIVATION-GATE",

      // Final verdict (the headline)
      finalStatus: report.finalStatus,
      finalStatusReason: report.finalStatusReason,
      finalStatusColor: report.finalStatusColor,

      // Gate summary
      gates: report.gates,
      passedGates: report.passedGates,
      failedGates: report.failedGates,
      passedGateCount: report.passedGates.length,
      failedGateCount: report.failedGates.length,

      // Standing blockers
      standingBlockers: report.standingBlockers,
      openBlockerCount: report.openBlockerCount,
      partiallyAddressedCount: report.partiallyAddressedCount,
      resolvedCount: report.resolvedCount,

      // Final rules (3 NEVERs)
      rules: report.rules,

      // Honest state
      honest: report.honest,
      forcedToPass: report.forcedToPass,
      realWorldEvidencePresent: report.realWorldEvidencePresent,

      // Evidence summary
      evidenceSummary: report.evidenceSummary,

      // Recommended next actions
      recommendedNextAction: report.recommendedNextAction,
      recommendedNextActions: report.recommendedNextActions,

      // Acceptance criteria
      acceptance: report.acceptance,
      acceptancePassed: acceptance.passed,
      acceptanceTotal: acceptance.total,
      gateIsHonest: honest,

      // Verdict summary (compact)
      summary,

      // Sharia disclosure banner (SHAR-2 enforces display rule)
      shariaBanner: SHARIA_DISCLOSURE_BANNER,
      shariaBannerEnforcedBy: "SHAR-2",

      // Markdown report (for docs/verification/)
      markdownReport: markdown,

      // Final reminder (echoed from the module)
      finalReminder:
        "PILOT-READY ≠ PRODUCTION-READY. Software tests passing ≠ production-ready. Real-world evidence is ABSENT. 10 standing blockers OPEN or PARTIALLY_ADDRESSED.",
      moduleIdEcho: MODULE_ID,
    });
  } catch (err) {
    console.error("[final-pilot-activation-gate] failed:", err);
    return NextResponse.json(
      {
        error: "Could not generate final pilot activation gate report.",
        detail: err instanceof Error ? err.message : "unknown error",
        moduleId: "v25.0-final-pilot-activation-gate-8of8",
        promptId: "8/8-FINAL-PILOT-ACTIVATION-GATE",
      },
      { status: 500 },
    );
  }
}
