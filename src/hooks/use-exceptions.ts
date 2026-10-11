"use client";

/**
 * TanStack Query hooks for the exceptions resource — §4.4.
 *
 *   useExceptions()      → GET /api/v1/exceptions
 *   useException(id)     → GET /api/v1/exceptions/[id]
 *
 * Truth state: WIRED. Endpoints return synthetic rows when DB is not
 * provisioned (mtq-gate.ts: mtqDisabled=true).
 */

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { type ApiClientError, apiClient } from "@/lib/api-client";

export interface ExceptionSummary {
  id: string;
  instructionId: string;
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  owner: string | null;
  requiredEvidence: string[] | null;
  clock: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
}

export interface CreateExceptionInput {
  instructionId: string;
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  owner?: string;
  requiredEvidence?: string[];
}

const KEYS = {
  list: ["exceptions"] as const,
  detail: (id: string) => ["exceptions", id] as const,
};

export function useExceptions(): UseQueryResult<ExceptionSummary[], ApiClientError> {
  return useQuery<ExceptionSummary[], ApiClientError>({
    queryKey: KEYS.list,
    queryFn: () => apiClient.get<ExceptionSummary[]>("/exceptions"),
  });
}

export function useException(id: string | null): UseQueryResult<ExceptionSummary, ApiClientError> {
  return useQuery<ExceptionSummary, ApiClientError>({
    queryKey: KEYS.detail(id ?? "_"),
    enabled: Boolean(id),
    queryFn: () => apiClient.get<ExceptionSummary>(`/exceptions/${id}`),
  });
}

export function useCreateException(): UseMutationResult<
  ExceptionSummary,
  ApiClientError,
  CreateExceptionInput
> {
  const qc = useQueryClient();
  return useMutation<ExceptionSummary, ApiClientError, CreateExceptionInput>({
    mutationFn: (input) => apiClient.post<ExceptionSummary>("/exceptions", input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: KEYS.list });
    },
  });
}
