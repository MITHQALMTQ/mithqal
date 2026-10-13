"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * TanStack Query hooks for validation cases per §16.1 API boundary.
 * Replaces the old use-instructions.ts hook.
 */

export interface ValidationCase {
  id: string;
  institutionId: string;
  sourceReference: string | null;
  corridor: string | null;
  sourceCurrency: string | null;
  targetCurrency: string | null;
  amount: string | null;
  status: string;
  policyVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationCaseDetail extends ValidationCase {
  evidenceEvents?: EvidenceEvent[];
  exceptions?: ExceptionCase[];
  policyDecisions?: PolicyDecision[];
}

export interface EvidenceEvent {
  id: string;
  eventType: string;
  actorSource: string;
  timestamp: string;
  signatureState: string;
  details: unknown;
}

export interface ExceptionCase {
  id: string;
  code: string;
  severity: string;
  owner: string | null;
  status: string;
  reasonCode: string | null;
  recommendedAction: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

export interface PolicyDecision {
  id: string;
  decision: string;
  reasonCodes: unknown;
  actor: string;
  evaluatedAt: string;
}

const BASE = "/api/v1";

export function useValidationCases(limit = 50) {
  return useQuery({
    queryKey: ["validation-cases", limit],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation-cases?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch validation cases");
      const data = await res.json();
      return (data.cases ?? data.data ?? []) as ValidationCase[];
    },
    staleTime: 30_000,
  });
}

export function useValidationCase(id: string | null) {
  return useQuery({
    queryKey: ["validation-case", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation-cases/${id}`);
      if (!res.ok) throw new Error("Failed to fetch validation case");
      return (await res.json()) as ValidationCaseDetail;
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useValidationCaseTimeline(id: string | null) {
  return useQuery({
    queryKey: ["validation-case-timeline", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation-cases/${id}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      const data = await res.json();
      return (data.events ?? data.timeline ?? []) as EvidenceEvent[];
    },
    enabled: !!id,
  });
}

export function useValidationCaseEvidence(id: string | null) {
  return useQuery({
    queryKey: ["validation-case-evidence", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation-cases/${id}/evidence`);
      if (!res.ok) throw new Error("Failed to fetch evidence");
      const data = await res.json();
      return (data.evidence ?? data.events ?? []) as EvidenceEvent[];
    },
    enabled: !!id,
  });
}

export function useReplayValidationCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/validation-cases/${id}/replay`, { method: "POST" });
      if (!res.ok) throw new Error("Replay failed");
      return res.json();
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["validation-case", id] });
      qc.invalidateQueries({ queryKey: ["validation-case-timeline", id] });
    },
  });
}

export function useResolveException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const res = await fetch(`${BASE}/exceptions/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      if (!res.ok) throw new Error("Resolve failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exceptions"] });
    },
  });
}

export function useEscalateException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`${BASE}/exceptions/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Escalate failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exceptions"] });
    },
  });
}

export function useSafeHalt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reason, scope }: { reason: string; scope?: string }) => {
      const res = await fetch(`${BASE}/safe-halt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, scope }),
      });
      if (!res.ok) throw new Error("Safe-halt failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
