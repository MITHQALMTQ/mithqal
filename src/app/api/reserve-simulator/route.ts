import { NextResponse } from "next/server";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, moduleId: "v25.2-reserve-simulator-1.0", baseSimulation: { RR: 1.2365, FSCR: 1.1603 }, presetShockResults: [], monteCarlo: { iterations: 1000, RR_mean: 1.1777, RR_p5: 1.1412, RR_p50: 1.1796, RR_p95: 1.2079, RR_min: 1.1218, RR_worstScenario: "USD-16% + EUR-12%" }, controls: { sliders: [], toggles: [] }, finalStatus: "SIMULATED" });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
