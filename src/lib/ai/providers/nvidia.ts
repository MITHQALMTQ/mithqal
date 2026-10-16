/**
 * NVIDIA NIM provider — OpenAI-compatible chat completions endpoint.
 *
 * Endpoint: https://integrate.api.nvidia.com/v1/chat/completions
 * Auth:     Authorization: Bearer ${NVIDIA_API_KEY}
 *
 * Server-only. Uses fetch() — no SDK dependency.
 */

import type { AIProvider, AIRequest, AIResponse } from "./types";

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

const NVIDIA_MODELS = [
  "meta/llama-3.1-405b-instruct",
  "meta/llama-3.1-70b-instruct",
  "nvidia/llama-3.1-nemotron-70b-instruct",
] as const;

const DEFAULT_MODEL = NVIDIA_MODELS[0];

interface NvidiaChoice {
  message?: { content?: string | null };
}
interface NvidiaResponseBody {
  choices?: NvidiaChoice[];
  usage?: { total_tokens?: number };
  error?: { message?: string } | string;
}

export const nvidiaProvider: AIProvider = {
  name: "nvidia",
  models: [...NVIDIA_MODELS],

  available(): boolean {
    return !!process.env.NVIDIA_API_KEY;
  },

  async chat(req: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = req.model || DEFAULT_MODEL;

    if (!process.env.NVIDIA_API_KEY) {
      throw new Error("NVIDIA_API_KEY is not configured");
    }

    const body = {
      model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 1024,
    };

    let resp: Response;
    try {
      resp = await fetch(NVIDIA_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        `nvidia fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`nvidia HTTP ${resp.status}: ${text.slice(0, 500)}`);
    }

    let data: NvidiaResponseBody;
    try {
      data = (await resp.json()) as NvidiaResponseBody;
    } catch (err) {
      throw new Error(
        `nvidia json parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const errMsg =
      typeof data.error === "string" ? data.error : (data.error?.message ?? "");

    if (errMsg) {
      throw new Error(`nvidia api error: ${errMsg}`);
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      throw new Error("nvidia returned empty content");
    }

    return {
      content,
      provider: "nvidia",
      model,
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens,
    };
  },
};
