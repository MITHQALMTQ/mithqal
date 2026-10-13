/**
 * MITHQAL v26.0 §6.11 — AI Consensus Model Matrix
 *
 * Per v26.0 §6.11, MITHQAL consumes AI from five providers
 * (Gemini, HuggingFace, Groq, OpenRouter, NVIDIA) and routes a
 * given task to the provider's best-suited model. The routing
 * is task-specific:
 *
 *   - risk       → models with strong numerical / financial reasoning
 *   - compliance → models with strong regulatory / legal grounding
 *   - anomaly    → low-latency models for streaming detection
 *   - general    → balanced default for synthesis / drafting
 *
 * AI outputs are ALWAYS advisory. Hard constraints (eligibility,
 * backing, finality, MTQ gate) cannot be overridden by any AI
 * recommendation per v26.0 §6.11 + §10.2 SCV-ATM-001.
 *
 * Blueprint: v26.0 §6.11 (AI consensus) + §6.10 (provider harmony)
 */

export type AITaskType = "general" | "risk" | "compliance" | "anomaly";

export type AIProvider =
  | "gemini"
  | "huggingface"
  | "groq"
  | "openrouter"
  | "nvidia";

/**
 * A single matrix cell. `primary` is the model the provider uses
 * for the task; `secondary` (optional) is the second model used
 * for cross-checking the primary's output. When `secondary` is
 * absent, consensus is computed from the primary alone across
 * the remaining providers.
 */
export interface ModelMatrixEntry {
  primary: string;
  secondary?: string;
  rationale: string;
}

/**
 * The canonical task × provider matrix.
 *
 *   4 tasks × 5 providers = 20 cells.
 *
 * Each cell lists the provider's best model for that task, with a
 * short rationale citing the model's strength. Secondary models
 * are listed only where the provider contributes two distinct
 * models to the consensus roster.
 */
export const TASK_MODEL_MATRIX: Record<AITaskType, Record<AIProvider, ModelMatrixEntry>> = {
  risk: {
    gemini: {
      primary: "gemini-2.5-pro",
      rationale:
        "Gemini 2.5 Pro has strong numerical and financial reasoning; preferred for risk scoring and corridor-pain decomposition per v26.0 §6.11.",
    },
    huggingface: {
      primary: "meta-llama/Llama-3.1-70B-Instruct",
      rationale:
        "Llama 3.1 70B offers open-weight transparency and reproducible inference, which is required for risk evidence provenance per §5.5.",
    },
    groq: {
      primary: "llama-3.3-70b-versatile",
      rationale:
        "Groq-hosted Llama 3.3 70B adds low-latency deterministic inference for risk scoring inside the 1000 ms projection SLO per §5.3.",
    },
    openrouter: {
      primary: "meta-llama/llama-3.3-70b-instruct",
      secondary: "deepseek/deepseek-chat-v3",
      rationale:
        "OpenRouter exposes both Llama 3.3 70B and DeepSeek V3; pairing them yields a cross-architecture cross-check on risk outputs per §6.11.",
    },
    nvidia: {
      primary: "nvidia/llama-3.1-nemotron-70b-instruct",
      rationale:
        "Nemotron 70B is NVIDIA-tuned for structured risk outputs aligned with enterprise policy schemas per §6.11.",
    },
  },
  compliance: {
    gemini: {
      primary: "gemini-2.5-flash",
      rationale:
        "Gemini 2.5 Flash balances compliance-context recall with cost-effective latency for high-volume screening per v26.0 §6.11.",
    },
    huggingface: {
      primary: "meta-llama/Llama-3.1-70B-Instruct",
      rationale:
        "Llama 3.1 70B's long context window supports full instrument-covenant review per §5.5 evidence scope.",
    },
    groq: {
      primary: "llama-3.3-70b-versatile",
      rationale:
        "Groq Llama 3.3 70B enables fast policy lookups against the v26.0 G0..G11 gate ledger per §9.1.",
    },
    openrouter: {
      primary: "qwen/qwen-2.5-72b-instruct",
      secondary: "microsoft/phi-4",
      rationale:
        "Qwen 2.5 72B and Phi-4 give cross-vendor compliance cross-check with strong jurisdictional recall per §6.11.",
    },
    nvidia: {
      primary: "nvidia/llama-3.1-nemotron-ultra-253b",
      rationale:
        "Nemotron Super 49B variant is NVIDIA's compliance-tuned model for legal-context adherence per §6.11.",
    },
  },
  anomaly: {
    gemini: {
      primary: "gemini-2.0-flash",
      rationale:
        "Gemini 2.0 Flash is optimized for streaming anomaly detection with sub-second first-token latency per v26.0 §6.11.",
    },
    huggingface: {
      primary: "mistralai/Mistral-7B-Instruct-v0.3",
      rationale:
        "Mistral 7B's small footprint enables edge-hosted anomaly inference with full provenance per §5.5.",
    },
    groq: {
      primary: "llama-3.1-8b-instant",
      rationale:
        "Groq Llama 3.1 8B instant delivers ultra-low-latency scoring for high-volume anomaly streams per §6.11.",
    },
    openrouter: {
      primary: "meta-llama/llama-3.3-70b-instruct",
      secondary: "microsoft/phi-4",
      rationale:
        "Llama 3.3 70B + Phi-4 cross-check reduces false-positive anomaly flags across heterogeneous model families per §6.11.",
    },
    nvidia: {
      primary: "nvidia/llama-3.1-nemotron-51b-instruct",
      rationale:
        "Nemotron 51B variant is NVIDIA's anomaly-tuned model with calibrated uncertainty per §6.11.",
    },
  },
  general: {
    gemini: {
      primary: "gemini-2.0-flash",
      rationale:
        "Gemini 2.0 Flash is the balanced default for synthesis, drafting, and summarization per v26.0 §6.11.",
    },
    huggingface: {
      primary: "meta-llama/Llama-3.1-70B-Instruct",
      rationale:
        "Llama 3.1 70B's open weights permit reproducible general-purpose inference with full provenance per §5.5.",
    },
    groq: {
      primary: "llama-3.3-70b-versatile",
      rationale:
        "Groq Llama 3.3 70B offers fast, deterministic general-purpose inference per §6.11.",
    },
    openrouter: {
      primary: "meta-llama/llama-3.3-70b-instruct",
      secondary: "google/gemini-2.0-flash",
      rationale:
        "Pairing Llama 3.3 70B with Gemini 2.0 Flash yields a cross-architecture general-purpose consensus per §6.11.",
    },
    nvidia: {
      primary: "nvidia/llama-3.1-nemotron-70b-instruct",
      rationale:
        "Nemotron 70B is NVIDIA's general-purpose model with enterprise-tuned alignment per §6.11.",
    },
  },
};

/**
 * All five providers in the canonical order (used for roster
 * enumeration in §6.11 consensus computation).
 */
export const AI_PROVIDERS: readonly AIProvider[] = [
  "gemini",
  "huggingface",
  "groq",
  "openrouter",
  "nvidia",
] as const;

/**
 * All four task types in the canonical order.
 */
export const AI_TASK_TYPES: readonly AITaskType[] = [
  "general",
  "risk",
  "compliance",
  "anomaly",
] as const;

/**
 * Look up the primary model for a given (task, provider) cell.
 * Returns the matrix entry's `primary` model identifier. Throws
 * when the task or provider is unknown.
 */
export function getModelForTask(task: AITaskType, provider: AIProvider): string {
  const cell = TASK_MODEL_MATRIX[task]?.[provider];
  if (!cell) {
    throw new Error(
      `No model matrix entry for task="${task}" provider="${provider}".`,
    );
  }
  return cell.primary;
}

/**
 * Look up the primary (and optional secondary) model for a given
 * (task, provider) cell. Returns `[primary]` when no secondary
 * exists, or `[primary, secondary]` when the provider contributes
 * two models to the consensus roster.
 */
export function getModelsForTask(
  task: AITaskType,
  provider: AIProvider,
): string[] {
  const cell = TASK_MODEL_MATRIX[task]?.[provider];
  if (!cell) {
    throw new Error(
      `No model matrix entry for task="${task}" provider="${provider}".`,
    );
  }
  return cell.secondary ? [cell.primary, cell.secondary] : [cell.primary];
}

/**
 * Return the full consensus roster for a task: an array of
 * { provider, models } entries, one per provider, in the
 * canonical provider order. When `useSecondary` is true and a
 * provider has a secondary model configured, both models are
 * returned; otherwise only the primary is returned.
 *
 * Used by the §6.11 consensus orchestrator to fan out a task
 * across all five providers and merge their outputs.
 */
export function getConsensusRoster(
  task: AITaskType,
  useSecondary: boolean = true,
): Array<{ provider: AIProvider; models: string[]; rationale: string }> {
  const taskRow = TASK_MODEL_MATRIX[task];
  if (!taskRow) {
    throw new Error(`Unknown AITaskType "${task}".`);
  }
  return AI_PROVIDERS.map((provider) => {
    const cell = taskRow[provider];
    return {
      provider,
      models: useSecondary
        ? getModelsForTask(task, provider)
        : [cell.primary],
      rationale: cell.rationale,
    };
  });
}

/**
 * Human-readable summary of the entire matrix, grouped by task.
 * Used by the workflow catalog endpoint and the provider harmony
 * dashboard to surface the routing decisions in plain text.
 */
export interface ModelMatrixSummaryEntry {
  task: AITaskType;
  providers: Array<{
    provider: AIProvider;
    primary: string;
    secondary: string | null;
    rationale: string;
  }>;
}

export interface ModelMatrixSummary {
  tasks: ModelMatrixSummaryEntry[];
  totalCells: number;
  cellsWithSecondary: number;
  blueprintRef: string;
  hardConstraintReminder: string;
}

export function getModelMatrixSummary(): ModelMatrixSummary {
  const tasks: ModelMatrixSummaryEntry[] = AI_TASK_TYPES.map((task) => {
    const taskRow = TASK_MODEL_MATRIX[task];
    return {
      task,
      providers: AI_PROVIDERS.map((provider) => {
        const cell = taskRow[provider];
        return {
          provider,
          primary: cell.primary,
          secondary: cell.secondary ?? null,
          rationale: cell.rationale,
        };
      }),
    };
  });

  let cellsWithSecondary = 0;
  for (const entry of tasks) {
    for (const p of entry.providers) {
      if (p.secondary !== null) cellsWithSecondary += 1;
    }
  }

  return {
    tasks,
    totalCells: AI_TASK_TYPES.length * AI_PROVIDERS.length,
    cellsWithSecondary,
    blueprintRef: "v26.0 §6.11 — AI Consensus Model Matrix",
    hardConstraintReminder:
      "AI outputs are advisory only. Eligibility, backing, finality, and the MTQ gate CANNOT be overridden by any AI recommendation per v26.0 §6.11 + §10.2 SCV-ATM-001.",
  };
}
