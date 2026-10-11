"use client";

/**
 * TanStack Query hooks for the instructions resource — §4.2.1 + §4.4.
 *
 *   useInstructions()           → GET /api/v1/instructions
 *   useInstruction(id)          → GET /api/v1/instructions/[id]
 *   useSubmitInstruction()      → POST /api/v1/instructions (idempotent)
 *
 * All hooks use the shared `apiClient` (src/lib/api-client.ts) so error
 * envelopes and the `{ ok, data, error }` contract are uniform.
 *
 * Truth state: WIRED. The endpoints exist (see /api/v1/instructions/*)
 * and return synthetic data when the DB is unprovisioned.
 */

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { type ApiClientError, apiClient } from "@/lib/api-client";

/** Instruction shape returned by /api/v1/instructions. */
export interface InstructionSummary {
  id: string;
  institutionId: string;
  corridor: string;
  sourceCurrency: string;
  targetCurrency: string;
  amount: string;
  debtorName: string;
  creditorName: string;
  purpose: string;
  status: string;
  policyVersion: string;
  createdAt: string;
  updatedAt: string;
}

/** Full instruction payload with related aggregates. */
export interface InstructionDetail extends InstructionSummary {
  evidence: Array<{
    id: string;
    type: string;
    source: string;
    observedAt: string;
    hash: string;
    scope: string;
    status: string;
  }>;
  exceptions: Array<{
    id: string;
    code: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    owner: string | null;
    status: string;
    createdAt: string;
  }>;
  policyDecisions: Array<{
    id: string;
    policyVersion: string;
    decision: string;
    reasonCodes: string[] | null;
    evaluatedAt: string;
    actor: string;
  }>;
}

/** Payload for the submit-instruction mutation. Mirrors the Zod schema
 *  in /api/v1/instructions/route.ts. */
export interface SubmitInstructionInput {
  instructionId: string;
  institutionId: string;
  corridor: string;
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  debtor: { name: string; account: string };
  creditor: { name: string; account: string };
  purpose: string;
  requestedExecutionDate: string;
}

/** API response envelope from POST /api/v1/instructions. */
export interface SubmitInstructionResponse {
  instructionId: string;
  status: string;
  policyVersion: string;
  finalityState: string;
  createdAt: string;
}

const KEYS = {
  list: ["instructions"] as const,
  detail: (id: string) => ["instructions", id] as const,
};

export function useInstructions(): UseQueryResult<InstructionSummary[], ApiClientError> {
  return useQuery<InstructionSummary[], ApiClientError>({
    queryKey: KEYS.list,
    queryFn: () => apiClient.get<InstructionSummary[]>("/instructions"),
  });
}

export function useInstruction(
  id: string | null,
): UseQueryResult<InstructionDetail, ApiClientError> {
  return useQuery<InstructionDetail, ApiClientError>({
    queryKey: KEYS.detail(id ?? "_"),
    enabled: Boolean(id),
    queryFn: () => apiClient.get<InstructionDetail>(`/instructions/${id}`),
  });
}

export function useSubmitInstruction(): UseMutationResult<
  SubmitInstructionResponse,
  ApiClientError,
  SubmitInstructionInput,
  { previousList: InstructionSummary[] | undefined }
> {
  const qc = useQueryClient();
  return useMutation<
    SubmitInstructionResponse,
    ApiClientError,
    SubmitInstructionInput,
    { previousList: InstructionSummary[] | undefined }
  >({
    mutationFn: (input) =>
      apiClient.post<SubmitInstructionResponse>(
        "/instructions",
        input,
        // Idempotency key — derived from the instructionId so retries
        // are deduped server-side (see /api/v1/instructions POST).
        { idempotencyKey: input.instructionId },
      ),
    onSuccess: async () => {
      // Optimistic refresh: invalidate list + detail.
      await qc.invalidateQueries({ queryKey: KEYS.list });
    },
  });
}
