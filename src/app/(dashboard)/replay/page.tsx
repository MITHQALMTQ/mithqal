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
import { useReplayValidationCase } from "@/hooks/use-replay";

/**
 * Replay page — MITHQAL MASTER BLUEPRINT §16.1 + §5.2.F.
 *
 * Search form + replay result. The replay endpoint reconstructs the
 * policy decision tree using the policyVersion that was active at
 * decision time. Replay is read-only — it does NOT touch monetary state
 * or initiate a payment.
 *
 * Output fields:
 *   caseId              — validation case identifier
 *   policyVersion       — historical policy version at decision time
 *   currentPolicyVersion — current policy version (for comparison)
 *   softwareVersion     — MITHQAL-ASSURANCE build tag
 *   reproducible        — boolean: did the replay match the original?
 *   decision            — the stored policy decision (or current rule output)
 *   reason              — stored reason codes / decision trace
 *   missingDependencies — list of missing inputs that prevent reproduction
 *
 * All demo data is labelled per §5.5.
 */

const DEMO_DATA_LABEL = "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE";

const DEMO_REPLAY = {
  caseId: "VC-2027-0042",
  policyVersion: "POLICY-v1.2.3",
  currentPolicyVersion: "POLICY-v1.2.3",
  softwareVersion: "MITHQAL-ASSURANCE-1.0.3",
  reproducible: true,
  decision: "RECORDED",
  reason: "Replay reproduced the stored policy decision; inputs and rules matched.",
  missingDependencies: [] as string[],
  sourceSnapshotCount: 1,
  evidenceEventCount: 7,
  exceptionCount: 1,
  replayedAt: "2027-03-15T14:30:00Z",
  mtqDisabled: true,
  productionAuthorized: false,
  note:
    "Replay is read-only. No payment is initiated and no monetary state is touched.",
};

export default function ReplayPage() {
  const [caseId, setCaseId] = useState("VC-2027-0042");
  const replay = useReplayValidationCase();

  // Use the API result when available; fall back to the demo data.
  const result = replay.data ?? DEMO_REPLAY;
  const isFallback = !replay.data;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    replay.mutate(caseId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Replay"
        description="Reconstruct historical decisions with retained inputs and rule versions"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>{DEMO_DATA_LABEL}</AlertTitle>
        <AlertDescription>
          The replay below uses the canonical demo for VC-2027-0042. Per §5.2.F, the system
          identifies missing or non-reproducible dependencies rather than silently substituting
          current data or current rules. Replay is read-only — no monetary state is touched.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Search Validation Cases</CardTitle>
          <CardDescription>
            Enter a validation case ID to reconstruct its decision trace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="case-id">Validation Case ID</Label>
              <Input
                id="case-id"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="VC-2027-0042"
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
              <CardTitle className="font-mono">Replay Result — {result.caseId}</CardTitle>
              <CardDescription>
                Policy {result.policyVersion} · software {result.softwareVersion} · replayed{" "}
                {result.replayedAt}
              </CardDescription>
            </div>
            {isFallback ? (
              <Badge variant="secondary">demo data</Badge>
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
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Current Policy Version
              </dt>
              <dd className="text-sm font-mono">{result.currentPolicyVersion}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Missing Dependencies
              </dt>
              <dd className="text-sm">
                {result.missingDependencies.length === 0
                  ? "none — replay reproducible"
                  : result.missingDependencies.join(", ")}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Source Snapshots
              </dt>
              <dd className="text-sm tabular-nums">{result.sourceSnapshotCount}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Evidence Events
              </dt>
              <dd className="text-sm tabular-nums">{result.evidenceEventCount}</dd>
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
                    <span>No — missing dependencies prevent reproduction</span>
                  </>
                )}
              </dd>
            </div>
          </dl>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>
              Replay is read-only and MTQ-disabled — no monetary state is touched. When the
              historical policy version differs from the current one, the historical version is
              used.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
