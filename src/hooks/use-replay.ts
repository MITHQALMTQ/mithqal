"use client";

/**
 * TanStack Query hook for historical replay — MITHQAL MASTER BLUEPRINT §16.1 + §5.2.F.
 *
 *   useReplayValidationCase()
 *
 * The hook wraps a useMutation that POSTs to /api/v1/validation-cases/[id]/replay.
 * The server reconstructs the policy decision tree using the policyVersion
 * that was active at decision time. Replay is read-only — it does NOT
 * touch monetary state or initiate a payment.
 *
 * Truth state: WIRED. Returns reproducibility status and any missing
 * dependencies. When the historical policy version differs from the
 * current one, the historical version is used.
 */

import { type UseMutationResult, useMutation } from "@tanstack/react-query";

import { type ApiClientError, apiClient } from "@/lib/api-client";

export interface ReplayResult {
  caseId: string;
  policyVersion: string;
  currentPolicyVersion: string;
  softwareVersion: string;
  reproducible: boolean;
  decision: string;
  reason: string;
  missingDependencies: string[];
  sourceSnapshotCount: number;
  evidenceEventCount: number;
  exceptionCount: number;
  replayedAt: string;
  mtqDisabled: boolean;
  productionAuthorized: boolean;
  note: string;
}

export type ReplayInput = string | { caseId: string } | { id: string };

/**
 * Mutation hook. The caller passes a validation case id (string),
 * `{ caseId }`, or `{ id }` — all shapes are normalised inside the
 * mutationFn before POSTing.
 */
export function useReplayValidationCase(): UseMutationResult<
  ReplayResult,
  ApiClientError,
  ReplayInput
> {
  return useMutation<ReplayResult, ApiClientError, ReplayInput>({
    mutationFn: (input) => {
      // Narrow the union — pick whichever field is present on the
      // caller's input object.
      const caseId =
        typeof input === "string"
          ? input
          : "caseId" in input
            ? input.caseId
            : input.id;
      if (!caseId) {
        throw new Error("Replay requires a validation case id.");
      }
      const idempotencyKey = `replay-${caseId}`;
      // POST with empty body — the case id is in the URL path.
      return apiClient.post<ReplayResult>(
        `/validation-cases/${caseId}/replay`,
        {},
        { idempotencyKey },
      );
    },
  });
}
