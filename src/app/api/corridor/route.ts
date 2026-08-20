import { NextResponse } from "next/server";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, moduleId: "v25.2-corridor-aed-sgd-1.0", sampleRunSummary: { amountAED: 1000000, outputSGD: 367365, fxRoute: "USD-bridge", aedRail: "TOKENIZED_DEPOSIT", sgdRail: "CBDC", compliancePassed: true, settlementStatus: "ATOMICALLY_SETTLED", mtqMinted: 272000, totalCostBps: 7.0, totalCostSGD: 257.29 }, corridorSteps: [], rails: [], finalStatus: "SIMULATED" });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
