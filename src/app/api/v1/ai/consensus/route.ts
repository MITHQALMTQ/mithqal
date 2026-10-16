/**
 * POST /api/v1/ai/consensus
 *
 * Runs a multi-provider consensus round.
 *
 * Request body:
 *   {
 *     "messages":  AIMessage[],                       // required
 *     "task":      "code" | "analysis" | "quick" | "consensus",  // optional
 *     "minProviders": number                          // optional
 *   }
 *
 * Response (200):
 *   ConsensusResult (consensus text + every response + errors + providers
 *   used + the strategy applied).
 *
 * Response (503):
 *   { "ok": false, "errors": AIProviderError[], "message": string }
 */

import { NextResponse } from "next/server";

import { runConsensus, selectModelsForTask } from "@/lib/ai";
import type { AIMessage } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConsensusRequestBody {
  messages?: AIMessage[];
  task?: "code" | "analysis" | "quick" | "consensus";
  minProviders?: number;
  temperature?: number;
  maxTokens?: number;
}

function isAIMessageArray(value: unknown): value is AIMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (m) =>
      m &&
      typeof m === "object" &&
      typeof (m as { role?: unknown }).role === "string" &&
      typeof (m as { content?: unknown }).content === "string",
  );
}

export async function POST(req: Request): Promise<Response> {
  let body: ConsensusRequestBody;
  try {
    body = (await req.json()) as ConsensusRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 },
    );
  }

  if (!isAIMessageArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "messages[] is required and must be non-empty",
      },
      { status: 400 },
    );
  }

  // Resolve the provider subset from the task router if a task was given.
  const task = body.task ?? "consensus";
  const selected = selectModelsForTask(task);
  const providerNames = selected.map((s) => s.provider);

  try {
    const result = await runConsensus(
      {
        messages: body.messages,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      },
      {
        minProviders: body.minProviders ?? 1,
        // For the "consensus" task we pass undefined so runConsensus uses
        // every available provider. For named tasks we pass the router's
        // provider list.
        providers:
          task === "consensus" ? undefined : providerNames.length > 0 ? providerNames : undefined,
      },
    );

    return NextResponse.json(
      {
        ok: true,
        task,
        consensus: result.consensus,
        responses: result.responses,
        errors: result.errors,
        providersUsed: result.providersUsed,
        strategy: result.strategy,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        // Re-extract errors embedded in the aggregate message — best-effort.
      },
      { status: 503 },
    );
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "POST /api/v1/ai/consensus",
      body: {
        messages: "AIMessage[] (required)",
        task: '"code" | "analysis" | "quick" | "consensus" (optional)',
        minProviders: "number (optional, default 1)",
        temperature: "number (optional)",
        maxTokens: "number (optional)",
      },
    },
    { status: 200 },
  );
}
