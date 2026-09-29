// src/app/api/adversarial-tests/route.ts
//
// MITHQAL v25.3.2 — Adversarial Architecture Tests endpoint.
// Per T-directive (trace 1a0ef4c811f1a89d):
//   "Create and run adversarial tests for the redesigned architecture.
//    Test at minimum: MTQ disabled, unauthorized mint, invalid finality,
//    stale authorization, legal-obligation missing, backing unavailable,
//    backing encumbered, duplicate backing, bank failure, custodian failure,
//    rail failure, reconciliation mismatch, policy version mismatch,
//    jurisdiction change, privileged-admin compromise, finality-domain
//    compromise, cross-domain credential compromise.
//    No test passes based on expected output alone.
//    Produce machine-readable evidence for every test."
//
// Public GET endpoint exposing the 17 adversarial test scenarios defined in
// src/lib/tests/adversarial-architecture-tests.ts (single canonical source).
//
// GET /api/adversarial-tests
//   Default: returns the 17 test scenarios (without running them).
// GET /api/adversarial-tests?run=true
//   Actually RUNS all 17 tests against the live system and returns the
//   results + machine-readable evidence (SHA-256 hash) for every test.

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  runAdversarialTests,
  ADVERSARIAL_TEST_SCENARIOS,
} from "@/lib/tests/adversarial-architecture-tests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Rate limit: 5 req/min per IP — tests are expensive (each test makes
  // 1-3 HTTP calls to the live system, total ~30-50 HTTP requests per run).
  const rateLimited = enforceRateLimit(
    "adversarial-tests",
    request,
    5,
    60_000
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const runTests = url.searchParams.get("run") === "true";

  if (runTests) {
    // Actually RUN all 17 adversarial tests against the live system.
    const results = await runAdversarialTests();
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        testType: "Adversarial Architecture Tests",
        perTDirective:
          "Create and run adversarial tests for the redesigned architecture.",
        noExpectedOutputOnlyRule:
          "No test passes based on expected output alone. Each test verifies actual system behavior by calling the live API + parsing the actual response.",
        machineReadableEvidenceRule:
          "Every test produces machine-readable evidence with a SHA-256 hash of the full evidence package.",
        source: "src/lib/tests/adversarial-architecture-tests.ts",
        release: "v25.3.15",
        taskId: "T1",
        taskTrace: "1a0ef4c811f1a89d",
      },
      ...results,
    });
  }

  // Default: return the test scenarios (without running)
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      testType: "Adversarial Architecture Tests",
      perTDirective:
        "Create and run adversarial tests for the redesigned architecture.",
      noExpectedOutputOnlyRule:
        "No test passes based on expected output alone. Each test verifies actual system behavior. Use ?run=true to execute all tests.",
      machineReadableEvidenceRule:
        "Every test produces machine-readable evidence (SHA-256 hash) when run with ?run=true.",
      source: "src/lib/tests/adversarial-architecture-tests.ts",
      release: "v25.3.15",
      taskId: "T1",
      taskTrace: "1a0ef4c811f1a89d",
    },
    testCount: ADVERSARIAL_TEST_SCENARIOS.length,
    scenarios: ADVERSARIAL_TEST_SCENARIOS,
    rule: `${ADVERSARIAL_TEST_SCENARIOS.length} adversarial test scenarios. Each test ACTUALLY CALLS the system (via HTTP) and verifies actual behavior. Machine-readable evidence (SHA-256 hash) produced for every test when run with ?run=true. Use ?run=true to execute all tests.`,
  });
}
