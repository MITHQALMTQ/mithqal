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
