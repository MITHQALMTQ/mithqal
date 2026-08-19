import { NextResponse } from "next/server";
import { generateV25_1Report, MULTI_RAIL_TYPES, MULTI_RAIL_RULE } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/rails
// Returns the 8 supported multi-rail settlement types.
// SIMULATED.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/rails",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        railTypes: report.railTypes,
        multiRailTypes: report.multiRailTypes,
        multiRailTypesList: MULTI_RAIL_TYPES,
        failureConditions: report.failureConditions,
        routingActions: report.routingActions,
        multiRailRule: MULTI_RAIL_RULE,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
