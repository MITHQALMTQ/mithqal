import { NextResponse } from "next/server";
import { runAllPilotAScenarios } from "@/lib/pilot-a-scenarios";

export async function GET() {
  try {
    const result = runAllPilotAScenarios();
    return NextResponse.json({
      endpoint: "/gateway/v1/pilot-a/results",
      method: "GET",
      blueprint_ref: "v26.0 §8.9 Pilot A scenario matrix — institutional dossier",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: "Pilot A results compilation failed.", detail: err instanceof Error ? err.message : "unknown", blueprint_ref: "v26.0 §8.9" }, { status: 500 });
  }
}
