/**
 * Task-aware model router.
 *
 * Given a task category, returns the preferred (provider, model) pairs to
 * use. The consensus engine can use these to query a focused subset rather
 * than the entire pool when running a consensus round.
 *
 * The router itself does NOT call any provider — it only returns preferences.
 * The consensus engine is responsible for honouring them (or falling back to
 * all available providers if a preferred model is not configured).
 */

import { ALL_PROVIDERS } from "./consensus";

export type AITask = "code" | "analysis" | "quick" | "consensus";

interface ProviderModel {
  provider: string;
  model: string;
}

/** Static per-task preference lists. */
const TASK_PREFERENCES: Record<AITask, ProviderModel[]> = {
  code: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "openrouter", model: "openai/gpt-4o-mini" },
    { provider: "nvidia", model: "meta/llama-3.1-405b-instruct" },
  ],
  analysis: [
    { provider: "openrouter", model: "anthropic/claude-3.5-sonnet" },
    { provider: "gemini", model: "gemini-1.5-pro" },
    { provider: "groq", model: "mixtral-8x7b-32768" },
  ],
  quick: [
    { provider: "groq", model: "llama-3.1-8b-instant" },
    { provider: "gemini", model: "gemini-1.5-flash" },
  ],
  consensus: [],
};

/**
 * Resolve the model pair list for a given task.
 *
 * - For `consensus` (or any task with no static preferences) the router
 *   returns ALL available providers' default models. The consensus engine
 *   then queries everything configured and aggregates.
 * - For named tasks the router filters its static preference list down to
 *   those whose provider is currently available. If none of the preferred
 *   providers are configured, it falls back to all available providers.
 */
export function selectModelsForTask(task: AITask): ProviderModel[] {
  const staticPrefs = TASK_PREFERENCES[task] ?? [];

  if (staticPrefs.length === 0) {
    // "consensus" task: use every available provider's first model.
    return ALL_PROVIDERS.filter((p) => p.available()).map((p) => ({
      provider: p.name,
      model: p.models[0],
    }));
  }

  const availableNames = new Set(
    ALL_PROVIDERS.filter((p) => p.available()).map((p) => p.name),
  );

  const filtered = staticPrefs.filter((pref) =>
    availableNames.has(pref.provider),
  );

  if (filtered.length === 0) {
    // Fall back to every available provider's default model.
    return ALL_PROVIDERS.filter((p) => p.available()).map((p) => ({
      provider: p.name,
      model: p.models[0],
    }));
  }

  return filtered;
}
