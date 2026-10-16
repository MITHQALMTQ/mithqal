/**
 * OpenRouter provider — OpenAI-compatible multi-model gateway.
 *
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Auth:     Authorization: Bearer ${OPENROUTER_API_KEY}
 * Headers:  HTTP-Referer + X-Title (per OpenRouter's attribution policy)
 *
 * Server-only. Uses fetch() — no SDK dependency.
 */

import type { AIProvider, AIRequest, AIResponse } from "./types";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-4o-mini",
  "google/gemini-flash-1.5",
  "anthropic/claude-3.5-sonnet",
] as const;

const DEFAULT_MODEL = OPENROUTER_MODELS[0];

interface OpenRouterChoice {
  message?: { content?: string | null };
}
interface OpenRouterResponseBody {
  choices?: OpenRouterChoice[];
  usage?: { total_tokens?: number };
  error?: { message?: string } | string;
}

export const openrouterProvider: AIProvider = {
  name: "openrouter",
  models: [...OPENROUTER_MODELS],

  available(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  },

  async chat(req: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = req.model || DEFAULT_MODEL;

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const body = {
      model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 1024,
    };

    let resp: Response;
    try {
      resp = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://mithqal.com",
          "X-Title": "MITHQAL Assurance",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        `openrouter fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`openrouter HTTP ${resp.status}: ${text.slice(0, 500)}`);
    }

    let data: OpenRouterResponseBody;
    try {
      data = (await resp.json()) as OpenRouterResponseBody;
    } catch (err) {
      throw new Error(
        `openrouter json parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const errMsg =
      typeof data.error === "string"
        ? data.error
        : (data.error?.message ?? "");

    if (errMsg) {
      throw new Error(`openrouter api error: ${errMsg}`);
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      throw new Error("openrouter returned empty content");
    }

    return {
      content,
      provider: "openrouter",
      model,
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens,
    };
  },
};
