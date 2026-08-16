import { NextResponse } from "next/server";
import { generateNonCustodialReserveReport } from "@/lib/non-custodial-reserve-architecture";

// GET /api/non-custodial-reserve-architecture
// Returns the full MITHQAL v25.0 Non-Custodial Reserve / Verification /
// Issuance Architecture report (Task ID: V25-0-NON-CUSTODIAL-RESERVE-ARCHITECTURE).
//
// This report does NOT create v25.1 — it is a reconciliation edit of v25.0
// that separates reserve CUSTODY from MONETARY CONTROL. MITHQAL becomes
// NON-CUSTODIAL BY DEFAULT: MITHQAL does not take custody of MTQ reserve
// assets or customer funds under ordinary operation.
//
// The 21.5432% modeled constitutional reserve-breach probability is PRESERVED
// for Model A (current reserve, 100% MITHQAL-owned). Model C (non-custodial
// bank-funded) has blended P(RR<100%) ≈ 4.7086% — same as Model B because the
// non-custodial aspect does NOT change the math; it changes WHO HOLDS the
// assets, not the risk profile.
//
// Final status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

export async function GET() {
  try {
    const report = generateNonCustodialReserveReport();
    return NextResponse.json(report);
  } catch (err) {
    console.error("[non-custodial-reserve-architecture] failed:", err);
    return NextResponse.json(
      {
        error: "Could not generate non-custodial reserve architecture report.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
