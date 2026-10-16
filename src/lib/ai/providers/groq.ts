/**
 * GROQ Cloud provider — OpenAI-compatible chat completions endpoint.
 *
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 * Auth:     Authorization: Bearer ${GROQ_API_KEY}
 *
 * GROQ is the primary/fastest provider in the consensus pool.
 *
 * Server-only. Uses fetch() — no SDK dependency.
 */

import type { AIProvider, AIRequest, AIResponse } from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
] as const;

const DEFAULT_MODEL = GROQ_MODELS[0];

interface GroqChoice {
  message?: { content?: string | null };
}
interface GroqResponseBody {
  choices?: GroqChoice[];
  usage?: { total_tokens?: number };
  error?: { message?: string } | string;
}

export const groqProvider: AIProvider = {
  name: "groq",
  models: [...GROQ_MODELS],

  available(): boolean {
    return !!process.env.GROQ_API_KEY;
  },

  async chat(req: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = req.model || DEFAULT_MODEL;

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const body = {
      model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 1024,
    };

    let resp: Response;
    try {
      resp = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        `groq fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`groq HTTP ${resp.status}: ${text.slice(0, 500)}`);
    }

    let data: GroqResponseBody;
    try {
      data = (await resp.json()) as GroqResponseBody;
    } catch (err) {
      throw new Error(
        `groq json parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const errMsg =
      typeof data.error === "string"
        ? data.error
        : (data.error?.message ?? "");

    if (errMsg) {
      throw new Error(`groq api error: ${errMsg}`);
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      throw new Error("groq returned empty content");
    }

    return {
      content,
      provider: "groq",
      model,
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens,
    };
  },
};
