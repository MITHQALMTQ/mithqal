/**
 * Multi-provider AI consensus system — shared types.
 *
 * These types define the contract every AI provider must implement so that
 * the consensus engine can treat GROQ, OpenRouter, NVIDIA NIM, Google Gemini
 * and HuggingFace uniformly.
 *
 * Server-only. Never import this module from a client component.
 */

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Optional model override; if absent the provider picks its default. */
  model?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
}

export interface AIProviderError {
  provider: string;
  error: string;
}

export interface AIProvider {
  /** Stable identifier, e.g. "groq". */
  name: string;
  /** Returns true only when the underlying API key is configured. */
  available(): boolean;
  /** Perform a single chat completion. Must NOT throw — return an error result instead. */
  chat(req: AIRequest): Promise<AIResponse>;
  /** Models the provider exposes. */
  models: string[];
}

export type ConsensusStrategy =
  | "unanimous"
  | "majority"
  | "first-success"
  | "single-fallback";

export interface ConsensusResult {
  /** The agreed-upon response text. */
  consensus: string;
  /** All successful responses, including latency + model metadata. */
  responses: AIResponse[];
  /** Any provider failures with their error messages. */
  errors: AIProviderError[];
  /** Names of providers that returned a successful response. */
  providersUsed: string[];
  /** Which consensus strategy was applied. */
  strategy: ConsensusStrategy;
}
