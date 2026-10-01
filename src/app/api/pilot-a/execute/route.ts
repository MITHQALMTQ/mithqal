import { NextResponse } from "next/server";
import { executePilotA, DEFAULT_PILOT_A_INSTRUCTION, type PilotInstruction } from "@/lib/pilot-a-execution-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/pilot-a/execute
 * Executes the full Pilot A settlement workflow with MTQ DISABLED.
 * Uses BANK_MONEY as the settlement asset (never MTQ).
 * All results are SIMULATED — no live institutional integration claimed.
 */
export async function POST(request: Request) {
  let instruction = DEFAULT_PILOT_A_INSTRUCTION;
  try {
    const body = await request.json();
    if (body && body.instructionId) {
      instruction = body as PilotInstruction;
    }
  } catch {
    // Use default instruction
  }

  const result = executePilotA(instruction);
  return NextResponse.json({
    ok: true,
    result,
    honestState: {
      mtqCompletelyDisabled: result.honestState.mtqCompletelyDisabled,
      noSimulatedAsLive: result.honestState.noSimulatedAsLive,
      allStepsClassified: result.honestState.allStepsClassified,
      productionAuthorized: false,
    },
  });
}

/**
 * GET /api/pilot-a/execute
 * Returns the default Pilot A execution (for quick demo).
 */
export async function GET() {
  const result = executePilotA(DEFAULT_PILOT_A_INSTRUCTION);
  return NextResponse.json({
    ok: true,
    result,
    honestState: {
      mtqCompletelyDisabled: result.honestState.mtqCompletelyDisabled,
      noSimulatedAsLive: result.honestState.noSimulatedAsLive,
      allStepsClassified: result.honestState.allStepsClassified,
      productionAuthorized: false,
    },
  });
}
