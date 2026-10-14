import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ status: "OK", product: "MITHQAL Assurance", version: "v1.0.0", productionAuthorized: false, mtqSigma: "NOT AUTHORIZED", timestamp: new Date().toISOString() });
}
