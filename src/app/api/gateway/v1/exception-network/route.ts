// GET /api/gateway/v1/exception-network
// POST /api/gateway/v1/exception-network
// Returns and opens Exception Resolution Network cases per v1.0 §5C.
// HONEST STATE: SYNTHETIC — Pilot A simulated environment.
import { NextResponse } from "next/server";
import {
  listExceptionCases,
  openExceptionCase,
  EXCEPTION_CODES,
  type ExceptionSeverity,
} from "@/lib/exception-resolution";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const cases = listExceptionCases();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/exception-network",
        method: "GET",
        description: "List exception cases per v1.0 §5C",
        status: "OK",
        blueprint_ref: "v1.0 §5C",
        provenance: "synthetic",
        cases,
        count: cases.length,
        availableCodes: EXCEPTION_CODES.map((c) => ({
          code: c.code,
          label: c.label,
          defaultSeverity: c.defaultSeverity,
        })),
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Exception network endpoint failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §5C",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = body?.code as string | undefined;
    const severity = body?.severity as ExceptionSeverity | undefined;
    const owner = body?.owner as string | undefined;
    const description = body?.description as string | undefined;
    const timestamp = new Date().toISOString();

    if (!code || !owner) {
      return NextResponse.json(
        {
          error: "code and owner are required; severity is optional (defaults from code)",
          availableCodes: EXCEPTION_CODES.map((c) => c.code),
          blueprint_ref: "v1.0 §5C",
        },
        { status: 400 },
      );
    }

    const validCode = EXCEPTION_CODES.find((c) => c.code === code);
    if (!validCode) {
      return NextResponse.json(
        {
          error: `Unknown exception code: ${code}`,
          availableCodes: EXCEPTION_CODES.map((c) => c.code),
          blueprint_ref: "v1.0 §5C",
        },
        { status: 400 },
      );
    }

    const validSeverities: ExceptionSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const effectiveSeverity: ExceptionSeverity =
      severity && validSeverities.includes(severity)
        ? severity
        : validCode.defaultSeverity;

    const newCase = openExceptionCase(
      code,
      effectiveSeverity,
      owner,
      description ?? `New ${code} case opened via gateway v1.`,
    );

    return NextResponse.json(
      {
        endpoint: "/gateway/v1/exception-network",
        method: "POST",
        description: "Open a new exception case per v1.0 §5C",
        status: "OK",
        blueprint_ref: "v1.0 §5C",
        provenance: "synthetic",
        case: newCase,
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Exception network open failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §5C",
      },
      { status: 500 },
    );
  }
}
