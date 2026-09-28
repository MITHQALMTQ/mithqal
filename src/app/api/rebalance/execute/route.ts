import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { executeRebalanceProposal, confirmSettlement } from "@/lib/execution-engine";
import type { ReserveState } from "@/lib/reserve-state";
import { getExecutionMode } from "@/lib/reserve-state";

/**
 * POST /api/rebalance/execute — Execute an approved proposal.
 *
 * Per §12: In SIMULATION mode, executes against simulated custodian.
 * In PRODUCTION mode (disabled), would execute against real custodian APIs.
 *
 * Per §28: Idempotent — duplicate execution requests return the same result.
 */
export async function POST(request: Request) {
  // SECURITY FIX (Task 4-A / Defect 6): auth bypass in SIMULATION mode is
  // closed. Even in SIMULATION, the caller must present EITHER (a) a valid
  // operator session via getServerSession(authOptions), OR (b) a valid
  // x-cron-secret header matching process.env.CRON_SECRET. If CRON_SECRET
  // is unset AND the caller has no session, return 401 — never silently
  // execute state-mutating rebalance proposals as an unauthenticated
  // public caller.
  //
  // Per audit 2-C defect 6: the prior code only required auth when
  // `getExecutionMode() !== 'SIMULATION'`. Since SIMULATION is the default
  // testnet mode (and the only mode that ever runs in this environment),
  // the prior code in practice had NO auth gate. confirmSettlement()
  // mutates reserve state — that must always require operator auth.
  const session = await getServerSession(authOptions);
  const cronSecret = process.env.CRON_SECRET;
  const hasCronSecret = cronSecret
    ? request.headers.get("x-cron-secret") === cronSecret
    : false;
  if (!session && !hasCronSecret) {
    return NextResponse.json(
      {
        error: "Unauthorized — institutional authentication or valid x-cron-secret header required",
      },
      { status: 401 },
    );
  }
  const mode = getExecutionMode();
  try {
    // SECURITY FIX (Task 4-A / Defect 6): wrap `await request.json()` in
    // its own try/catch so malformed JSON returns 400 (not 500 — matches
    // the pattern in /api/mint, /api/redeem, /api/transfer per audit 2-B
    // DEFECT-2).
    let proposalId: string;
    let confirm: boolean | undefined;
    try {
      const parsed = await request.json() as { proposalId?: string; confirm?: boolean };
      if (typeof parsed.proposalId !== "string" || !parsed.proposalId.trim()) {
        return NextResponse.json(
          { ok: false, error: "proposalId must be a non-empty string" },
          { status: 400 },
        );
      }
      proposalId = parsed.proposalId;
      confirm = parsed.confirm;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const result = await executeRebalanceProposal(proposalId);

    if (result.failed) {
      return NextResponse.json({ ok: false, error: result.failureReason, result }, { status: 500 });
    }

    // SECURITY FIX (Task 4-A / Defect 6): proper null-init typing for
    // `reserveState`. Previously `let reserveState = null` was widened to
    // `null` literal type by TS, so `reserveState = confirmSettlement(...)`
    // (returning `ReserveState`) was TS2322, and the subsequent property
    // accesses (`reserveState.reserveStateVersion`) were TS2339 on `never`.
    // Fix: declare with the correct union type and narrow before access.
    let reserveState: ReserveState | null = null;
    if (confirm && !result.failed) {
      reserveState = confirmSettlement(proposalId);
    }

    return NextResponse.json({
      ok: true,
      executionMode: mode,
      isSimulation: mode === "SIMULATION",
      result,
      reserveState: reserveState ? {
        reserveStateVersion: reserveState.reserveStateVersion,
        timestamp: reserveState.timestamp,
      } : null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
