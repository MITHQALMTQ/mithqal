// GET /api/gateway/v1/evidence-passport
// Returns the Payment Evidence Passport for an instruction per v1.0 §5A.
// HONEST STATE: SYNTHETIC — all bundles are Pilot A synthetic data.
import { NextResponse } from "next/server";
import {
  generateEvidencePassport,
  exportEvidencePassport,
  listPilotAInstructionIds,
} from "@/lib/evidence-passport";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const instructionId = url.searchParams.get("instructionId");
    const format = (url.searchParams.get("format") as "json" | "summary" | null) ?? "json";
    const timestamp = new Date().toISOString();

    if (!instructionId) {
      return NextResponse.json(
        {
          endpoint: "/gateway/v1/evidence-passport",
          method: "GET",
          description:
            "Returns the Payment Evidence Passport for an instruction per v1.0 §5A.",
          status: "OK",
          honestState: "SYNTHETIC",
          usage: "Append ?instructionId=PILOT-A-INSTR-001 (or 002/003) to fetch a bundle.",
          availableInstructionIds: listPilotAInstructionIds(),
          supportedFormats: ["json", "summary"],
          timestamp,
        },
        { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
      );
    }

    const exported = exportEvidencePassport(instructionId, format);
    const passport = generateEvidencePassport(instructionId);

    return NextResponse.json(
      {
        endpoint: "/gateway/v1/evidence-passport",
        method: "GET",
        description: "Payment Evidence Passport (v1.0 §5A)",
        status: "OK",
        blueprint_ref: "v1.0 §5A",
        honestState: passport.honestState,
        classification: exported.classification,
        sensitiveDataMinimized: exported.sensitiveDataMinimized,
        instructionId,
        format: exported.format,
        passport,
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Evidence passport endpoint failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §5A",
      },
      { status: 500 },
    );
  }
}
