import { NextResponse } from "next/server";
import { generateV25_1Report, PROVIDER_REGISTRY, PROVIDER_RULE } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/providers
// Returns the 8 authorized external participant types (provider types) and
// the (currently EMPTY) provider registry. No provider is contracted yet.
// SIMULATED.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/providers",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        providerTypes: report.providerTypes,
        providerRegistryCount: report.providerRegistryCount,
        providerRegistry: PROVIDER_REGISTRY,
        providerRule: PROVIDER_RULE,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
