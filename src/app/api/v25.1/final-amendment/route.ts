import { NextResponse } from "next/server";
import { generateFinalAmendmentReport } from "@/lib/v25-1-final-amendment";

export async function GET() {
  try {
    const report = generateFinalAmendmentReport();
    return NextResponse.json(report);
  } catch (err) {
    console.error("[v25.1/final-amendment] failed:", err);
    return NextResponse.json(
      { error: "Could not generate final amendment report.", detail: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
