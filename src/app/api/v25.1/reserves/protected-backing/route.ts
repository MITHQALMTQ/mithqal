import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  PBC_RULE,
  type ProtectedBackingCell,
} from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/reserves/protected-backing
// Returns the v25.1 Protected Backing Cell (PBC) rule and the structural
// model the system uses to distinguish ORDINARY_BANK_DEPOSIT from
// PROTECTED_MTQ_BACKING.
// SIMULATED — no PBCs are populated yet.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    const cellStructure: ProtectedBackingCell = {
      cellId: "SIMULATED-PBC-TEMPLATE",
      bankId: "N/A",
      assetId: "N/A",
      amount: 0,
      backingType: "PROTECTED_MTQ_BACKING",
      legalControl: "N/A — no bank contracted",
      segregationStatus: "PENDING",
      encumbranceStatus: "UNENCUMBERED",
      doubleCountingCheck: true,
      reconciliationStatus: "VERIFIED",
      evidence: "SIMULATED — no live backing recognized",
      insolvencyTreatment: "Per PBC rule — protected in bank insolvency",
      redemptionClaim: "N/A",
      jurisdictionalLegality: "PENDING",
    };
    return NextResponse.json({
      endpoint: "/api/v25.1/reserves/protected-backing",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        pbcRule: report.pbcRule ?? PBC_RULE,
        protectedBackingCellStructure: cellStructure,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
