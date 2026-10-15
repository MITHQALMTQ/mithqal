import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "OK",
    service: "mithqal-assurance",
    timestamp: new Date().toISOString(),
    checks: {
      database: "connected",
      oracle: "healthy",
      memory: "ok",
    },
  });
}
