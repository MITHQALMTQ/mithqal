/**
 * HuggingFace provider — uses HuggingFace's OpenAI-compatible router.
 *
 * Endpoint: https://router.huggingface.co/v1/chat/completions
 * Auth:     Authorization: Bearer ${HUGGINGFACE_API_KEY}
 *
 * Using the OpenAI-compatible router keeps request/response handling uniform
 * with the other OpenAI-compatible providers (GROQ, OpenRouter, NVIDIA).
 *
 * Server-only. Uses fetch() — no SDK dependency.
 */

import type { AIProvider, AIRequest, AIResponse } from "./types";

const HUGGINGFACE_ENDPOINT =
  "https://router.huggingface.co/v1/chat/completions";

const HUGGINGFACE_MODELS = [
  "meta-llama/Llama-3.3-70B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
] as const;

const DEFAULT_MODEL = HUGGINGFACE_MODELS[0];

interface HuggingFaceChoice {
  message?: { content?: string | null };
}
interface HuggingFaceResponseBody {
  choices?: HuggingFaceChoice[];
  usage?: { total_tokens?: number };
  error?: { message?: string } | string;
}

export const huggingfaceProvider: AIProvider = {
  name: "huggingface",
  models: [...HUGGINGFACE_MODELS],

  available(): boolean {
    return !!process.env.HUGGINGFACE_API_KEY;
  },

  async chat(req: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = req.model || DEFAULT_MODEL;

    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not configured");
    }

    const body = {
      model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 1024,
    };

    let resp: Response;
    try {
      resp = await fetch(HUGGINGFACE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        `huggingface fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `huggingface HTTP ${resp.status}: ${text.slice(0, 500)}`,
      );
    }

    let data: HuggingFaceResponseBody;
    try {
      data = (await resp.json()) as HuggingFaceResponseBody;
    } catch (err) {
      throw new Error(
        `huggingface json parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const errMsg =
      typeof data.error === "string"
        ? data.error
        : (data.error?.message ?? "");

    if (errMsg) {
      throw new Error(`huggingface api error: ${errMsg}`);
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      throw new Error("huggingface returned empty content");
    }

    return {
      content,
      provider: "huggingface",
      model,
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens,
    };
  },
};
