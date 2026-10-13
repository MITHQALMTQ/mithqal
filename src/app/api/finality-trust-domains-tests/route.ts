import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runAllFinalityTrustDomainTests } from "@/lib/tests/finality-trust-domain-tests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "finality-trust-domains-tests",
    request,
    10,
    60_000
  );
  if (rateLimited) return rateLimited;

  const testResults = runAllFinalityTrustDomainTests();

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      testSuite: "Cross-Domain Compromise + Privilege Escalation Tests",
      perMDirective:
        "Add tests for cross-domain compromise and privilege escalation.",
    },
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.results.length,
      allPassed: testResults.failed === 0,
    },
    results: testResults.results,
  });
}
