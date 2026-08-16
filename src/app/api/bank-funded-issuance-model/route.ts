import { NextResponse } from "next/server";
import { generateBankFundedIssuanceReport } from "@/lib/bank-funded-issuance-model";

// GET /api/bank-funded-issuance-model
// Returns the full MITHQAL v25.0 Bank-Funded / Prefunded Issuance & Capital Model
// reconciliation report (Task ID: V25-0-BANK-FUNDED-ISSUANCE-MODEL).
//
// This report does NOT create v25.1 — it is a reconciliation edit of v25.0.
// It preserves the 21.5432% modeled constitutional reserve-breach probability
// for Model A (current reserve model) and computes a different (lower) blended
// probability for Model B (bank-funded issuance) without manipulating assumptions.
//
// Final status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

export async function GET() {
  try {
    const report = generateBankFundedIssuanceReport();
    return NextResponse.json(report);
  } catch (err) {
    console.error("[bank-funded-issuance-model] failed:", err);
    return NextResponse.json(
      {
        error: "Could not generate bank-funded issuance model report.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
