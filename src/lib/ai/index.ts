/**
 * Public entrypoint for the multi-provider AI consensus system.
 *
 * Re-exports:
 *   - runConsensus()   — the parallel multi-provider consensus engine
 *   - selectModelsForTask() — task-aware model router
 *   - ALL_PROVIDERS / providers — the provider registry
 *   - all relevant TypeScript types
 *
 * Server-only. Do NOT import from client components.
 */

export { runConsensus, ALL_PROVIDERS } from "./consensus";
export type { ConsensusOptions } from "./consensus";

export { selectModelsForTask } from "./router";
export type { AITask } from "./router";

export { groqProvider } from "./providers/groq";
export { openrouterProvider } from "./providers/openrouter";
export { nvidiaProvider } from "./providers/nvidia";
export { geminiProvider } from "./providers/gemini";
export { huggingfaceProvider } from "./providers/huggingface";

export type {
  AIMessage,
  AIRequest,
  AIResponse,
  AIProvider,
  AIProviderError,
  ConsensusResult,
  ConsensusStrategy,
  AIRole,
} from "./providers/types";

import { groqProvider } from "./providers/groq";
import { openrouterProvider } from "./providers/openrouter";
import { nvidiaProvider } from "./providers/nvidia";
import { geminiProvider } from "./providers/gemini";
import { huggingfaceProvider } from "./providers/huggingface";

/**
 * Convenience registry of every configured provider. Useful for status
 * dashboards and the consensus engine's internal pool.
 */
export const providers = [
  groqProvider,
  openrouterProvider,
  nvidiaProvider,
  geminiProvider,
  huggingfaceProvider,
];
