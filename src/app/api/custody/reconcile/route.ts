import { NextResponse } from "next/server";
import { performReconciliation } from "@/lib/reconciliation";

/** POST /api/custody/reconcile — Trigger custodian reconciliation. */
export async function POST() {
  try {
    const result = await performReconciliation("exception");
    return NextResponse.json({ ok: true, reconciliation: result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
