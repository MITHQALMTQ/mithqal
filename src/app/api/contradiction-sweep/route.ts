import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  SWEEP_REPORT,
  SWEEP_REPORT_STATUS,
  SWEEP_REPORT_VERSION,
  SWEEP_REPORT_SOURCE,
  SWEEP_REPORT_HONEST_STATEMENT,
} from "@/lib/contradiction-sweep-report";

// ============================================================================
// /api/contradiction-sweep — Full Contradiction Sweep Report Endpoint
// ============================================================================
//
// Per S-directive (trace 1a0ef36e7e341b2d):
//   "Run a full contradiction sweep across 11 surfaces for 10 conflict types.
//    Required result: ZERO UNRESOLVED ACTIVE CONTRADICTIONS. Any unresolved
//    conflict must be explicitly marked BLOCKING_REMEDIATION."
//
// This endpoint serves the canonical sweep report produced by Agent S2
// (Full Contradiction Sweep Architect). It is the live operator-audit
// surface for the MITHQAL contradiction status as of v25.3.13.
//
// The sweep report:
//   - 11 surfaces covered: blueprint, reference JSON, implementation-status
//     files, reserve configuration, workflow state machine, APIs, tests,
//     terminology, dashboards, examples, marketing strings.
//   - 10 conflict types searched: v25.2/v25.3/v25.3.1/v25.3.2, BM-15/BM-16,
//     PAR/peg, MTQ classification, 130%, gold/digital pilot, 13-vs-20 gate,
//     LCR, outdated production claims, outdated jurisdiction claims.
//   - Scanner ran live against /api/mtq-contradiction-scan: 25 patterns
//     scanned (17 original + 8 new per K2), 6 true contradictions in C03
//     (MITHQAL_CUSTODIES_BACKING policy ID — scanner false-positive
//     classification issue), 1 unresolved pattern (C03).
//   - Findings marked RESOLVED or BLOCKING_REMEDIATION per the S-directive
//     honesty rules.
//
// Rate-limited at 30 req/min per IP (institutional-grade, consistent with
// R11/N1/O1/O2/P1/P2/Q1/Q2/R2 endpoint policy).
// ============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // R11: 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("contradiction-sweep", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: SWEEP_REPORT_SOURCE,
      version: SWEEP_REPORT_VERSION,
      status: SWEEP_REPORT_STATUS,
      taskId: "S2",
      taskTrace: "1a0ef36e7e341b2d",
      overrideRule:
        "Full contradiction sweep. 11 surfaces × 10 conflict types. " +
        "Required: ZERO UNRESOLVED ACTIVE CONTRADICTIONS. " +
        "Unresolved = BLOCKING_REMEDIATION.",
      honestStatement: SWEEP_REPORT_HONEST_STATEMENT,
    },
    sweepReport: SWEEP_REPORT,
    requiredResult: "ZERO UNRESOLVED ACTIVE CONTRADICTIONS",
    achieved: SWEEP_REPORT.achieved,
    resolvedCount: SWEEP_REPORT.resolvedCount,
    blockingRemediationCount: SWEEP_REPORT.blockingRemediationCount,
    surfacesCovered: SWEEP_REPORT.surfacesCovered,
    conflictTypesSearched: SWEEP_REPORT.conflictTypesSearched,
    scannerResult: SWEEP_REPORT.scannerResult,
  });
}
