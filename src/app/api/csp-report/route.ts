import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// R12 — CSP violation report endpoint (v25.8)
//
// Receives POST reports from browsers when a CSP violation occurs
// (configured via `report-uri /api/csp-report` in the production CSP).
//
// Logs to console (production should forward to a monitoring service like
// Sentry / Datadog / Vercel Observatory — future work, not provisioned in
// v25.8).
//
// Browsers POST a JSON body of shape:
//   {
//     "csp-report": {
//       "document-uri": "https://mithqal.vercel.app/",
//       "violated-directive": "script-src-elem",
//       "blocked-uri": "inline",
//       "line-number": 42,
//       "source-file": "...",
//       "status-code": 0
//     }
//   }
//
// We always return 200 OK so the browser doesn't retry the report.

export async function POST(request: Request) {
  try {
    const report = await request.json();
    console.warn("[CSP] Violation:", JSON.stringify(report));
    return NextResponse.json({ ok: true });
  } catch {
    console.warn("[CSP] Invalid report body (not JSON).");
    return NextResponse.json(
      { ok: false, error: "Invalid report" },
      { status: 400 }
    );
  }
}

// GET handler — health probe. Returns 200 so monitors (Vercel, UptimeRobot)
// can verify the endpoint is alive without POSTing a fake report.

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/csp-report",
    method: "POST",
    description:
      "Receives CSP violation reports. POST a JSON body in browser csp-report format.",
  });
}
