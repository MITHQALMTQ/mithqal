import { NextResponse } from "next/server";
import { isReserveStateInitialized, initializeReserveState, getReserveState, type AssetClass } from "@/lib/reserve-state";
import { getCustodianAdapter } from "@/lib/custodian-adapter";

/** Per-row shape returned by GET /api/custody/holdings. */
interface CustodyHolding {
  assetId: string;
  assetClass: AssetClass;
  custodianId: string;
  custodianName: string;
  custodyAccountId: string | null;
  confirmedQuantity: number;
  unit: "oz" | "USD" | "units";
  confirmedAt: string | null;
}

/** GET /api/custody/holdings — Custodian-confirmed holdings. */
export async function GET() {
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  const state = getReserveState();
  const holdings: CustodyHolding[] = [];
  for (const asset of state.custodian) {
    if (!asset.custodianId) continue;
    const adapter = getCustodianAdapter(asset.custodianId);
    if (!adapter) continue;
    const custodianHoldings = await adapter.getHoldings(asset.custodyAccountId ?? "");
    holdings.push({
      assetId: asset.assetId,
      assetClass: asset.assetClass,
      custodianId: asset.custodianId,
      custodianName: adapter.custodianName,
      custodyAccountId: asset.custodyAccountId,
      confirmedQuantity: custodianHoldings.assets.find((a) => a.assetId === asset.assetId)?.quantity ?? 0,
      unit: asset.unit,
      confirmedAt: custodianHoldings.assets.find((a) => a.assetId === asset.assetId)?.confirmedAt ?? null,
    });
  }
  return NextResponse.json({ ok: true, holdings });
}
