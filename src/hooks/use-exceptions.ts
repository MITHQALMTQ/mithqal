"use client";

/**
 * TanStack Query hooks for the exceptions resource — MITHQAL MASTER BLUEPRINT §16.1.
 *
 *   useExceptions()      → GET /api/v1/exceptions
 *
 * Truth state: WIRED. Endpoints return auditable rows. productionAuthorized=false.
 * MTQ Σ is NOT AUTHORIZED (§9.1). All exceptions are design-stage records —
 * no payment is executed, no value moves.
 *
 * Schema (§16.3 Table 5):
 *   validationCaseId  (was instructionId in legacy schema)
 *   openedAt           (was createdAt)
 *   resolvedAt         (was closedAt)
 *   reasonCode         (new)
 *   recommendedAction  (new)
 */

import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { type ApiClientError, apiClient } from "@/lib/api-client";

export interface ExceptionSummary {
  id: string;
  validationCaseId: string;
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  owner: string | null;
  requiredEvidence: string[] | null;
  reasonCode: string | null;
  recommendedAction: string | null;
  status: string;
  openedAt: string;
  resolvedAt: string | null;
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
