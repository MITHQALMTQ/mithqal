"use client";

import { CheckCircle2, Info, RotateCcw, Search, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReplayInstruction } from "@/hooks/use-replay";

/**
 * Replay page — MITHQAL-TECH-SPEC-001 §3.4.4.
 *
 * Search form + replay result. The replay endpoint reconstructs the
 * policy decision tree that selected the route for an instruction,
 * using the policyVersion that was active at decision time.
 *
 * Output fields:
 *   policyVersion — e.g. POLICY-v1.2.3
 *   decision      — e.g. "Route via RTGS"
 *   reason        — e.g. "Lowest cost (18 bps), acceptable time"
 *   finality      — current finality state (e.g. "F6 not received")
 *   reproducible  — boolean: did the replay match the original decision?
 *
 * In pilot, the synthetic demo instruction INS-003 is the canonical
 * example. Submitting "INS-003" produces the documented synthetic replay.
 */

const SYNTHETIC_REPLAY = {
  instructionId: "INS-003",
  policyVersion: "POLICY-v1.2.3",
  decision: "Route via RTGS",
  reason: "Lowest cost (18 bps), acceptable time, RTGS finality expected at T+6h.",
  finality: "F6 not received — external rail timeout",
  reproducible: true,
  replayedAt: "2026-10-11T14:30:00Z",
};

export default function ReplayPage() {
  const [instructionId, setInstructionId] = useState("INS-003");
  const replay = useReplayInstruction(instructionId);

  // Use the API result when available; fall back to the synthetic demo
  // when the API is not provisioned.
  const result = replay.data ?? SYNTHETIC_REPLAY;
  const isFallback = !replay.data;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    replay.mutate(instructionId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulatory Replay"
        description="Reconstruct historical decisions with policy version"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Synthetic replay</AlertTitle>
        <AlertDescription>
          The replay below uses a SYNTHETIC decision tree for INS-003. Real replay requires the
          policy-version store (Phase 3) — until then, the synthetic output is the canonical pilot
          demonstration.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Search Instructions</CardTitle>
          <CardDescription>
            Enter an instruction ID to reconstruct its decision trace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="instruction-id">Instruction ID</Label>
              <Input
                id="instruction-id"
                value={instructionId}
                onChange={(e) => setInstructionId(e.target.value)}
                placeholder="INS-003"
                className="font-mono"
                required
              />
            </div>
            <Button type="submit" disabled={replay.isPending}>
              {replay.isPending ? (
                <RotateCcw className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
              Replay
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-mono">Replay Result — {result.instructionId}</CardTitle>
              <CardDescription>
                Policy {result.policyVersion} · replayed {result.replayedAt}
              </CardDescription>
            </div>
            {isFallback ? (
              <Badge variant="secondary">synthetic</Badge>
            ) : (
              <Badge variant="default">live</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Decision</dt>
              <dd className="text-sm font-medium">{result.decision}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Reason</dt>
              <dd className="text-sm">{result.reason}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Finality</dt>
              <dd className="text-sm font-mono">{result.finality}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Reproducible
              </dt>
              <dd className="flex items-center gap-1.5 text-sm">
                {result.reproducible ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
                    <span>Yes — replay matches original decision</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-rose-500" aria-hidden="true" />
                    <span>No — replay diverges from original decision</span>
                  </>
                )}
              </dd>
            </div>
          </dl>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>Replay is read-only and MTQ-disabled — no monetary state is touched.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
