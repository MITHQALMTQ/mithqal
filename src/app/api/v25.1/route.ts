// ============================================================================
// ⚠ VERSIONED API ROUTE — v25.3.2 remediation layer (2026-09-29)
// ============================================================================
// This is a versioned API route (/api/v25.1). Per the v25.3.2 authority hierarchy:
//   - Versioned routes are HISTORICAL — they implement API versioning for
//     backward compatibility
//   - The current normative API is the unversioned /api/* endpoints
//   - This route is PRESERVED (not deleted) because it is referenced by
//     other modules and external integrations
//
// All versioned API routes respond with header:
//   X-Mithqal-API-Version: v25.1 (historical; current normative layer = v25.3.2)
//
// HISTORICAL VERSIONS RETAIN TRACEABILITY ONLY.
// ============================================================================

import { NextResponse } from "next/server";
import { generateV25_1Report } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1
// Discovery route — returns the FULL MITHQAL v25.1 executive report
// (Institutional Interoperability, Geopolitical Resilience & Multi-Rail
// Settlement Edition). All data is SIMULATED — no real bank / provider /
// asset contracted yet.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to generate v25.1 executive report",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
