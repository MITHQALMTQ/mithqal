import { NextResponse } from "next/server";
export const dynamic = "force-static";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, moduleId: "v25.2-mtq-os-1.0", issuanceSteps: [], bankIntegrationNodes: [], bankIntegrationFlows: [], iso20022MessageCatalog: [], finalStatus: "SIMULATED" });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}
