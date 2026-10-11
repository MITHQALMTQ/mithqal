"use client";

import { Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Corridor page — MITHQAL-TECH-SPEC-001 §3.4.5.
 *
 * Corridor diagnostic for UAE → India. Displays:
 *   - CorridorMetrics: avgCost, avgTime, failureRate, providers, readinessScore
 *   - ProviderTable: per-provider comparison
 *
 * All numbers SYNTHETIC. Readiness score is computed against the
 * §pilot-a-scenarios readiness matrix (per §corridor-decision-status).
 */

interface CorridorMetric {
  label: string;
  value: string;
  caption?: string;
}

const CORRIDOR_METRICS: CorridorMetric[] = [
  { label: "Avg Cost", value: "28 bps", caption: "synthetic — across all rails" },
  { label: "Avg Time", value: "6 hours", caption: "synthetic — RTGS leg only" },
  { label: "Failure Rate", value: "5.6%", caption: "synthetic — design target" },
  { label: "Providers", value: "3 eligible", caption: "synthetic — RTGS, SWIFT, ISO 20022" },
];

const READINESS_SCORE = 78;

interface Provider {
  name: string;
  rail: "RTGS" | "SWIFT" | "ISO 20022" | "CBDC";
  costBps: number;
  avgTimeHours: number;
  failureRate: number;
  status: string;
}

const PROVIDERS: Provider[] = [
  {
    name: "Bank A RTGS",
    rail: "RTGS",
    costBps: 18,
    avgTimeHours: 6,
    failureRate: 0.042,
    status: "ACTIVE",
  },
  {
    name: "Bank C SWIFT",
    rail: "SWIFT",
    costBps: 32,
    avgTimeHours: 24,
    failureRate: 0.058,
    status: "ACTIVE",
  },
  {
    name: "Bank D ISO 20022",
    rail: "ISO 20022",
    costBps: 24,
    avgTimeHours: 12,
    failureRate: 0.035,
    status: "ELIGIBLE",
  },
  {
    name: "Bank E CBDC",
    rail: "CBDC",
    costBps: 10,
    avgTimeHours: 1,
    failureRate: 0.12,
    status: "PROVISIONAL",
  },
];

export default function CorridorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Corridor Diagnostic"
        description="Analyze corridor cost, time, and readiness"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Synthetic corridor</AlertTitle>
        <AlertDescription>
          UAE → India is the canonical pilot corridor. All metrics are SYNTHETIC. Readiness is
          computed against the §pilot-a-scenarios matrix (target readiness ≥ 80 for pilot launch).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>UAE → India</CardTitle>
          <CardDescription>Source: AED · Target: INR · Corridor ID: AED-INR-AE-IN</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORRIDOR_METRICS.map((m) => (
              <div key={m.label} className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
                {m.caption ? (
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {m.caption}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Readiness score</span>
              <span className="font-medium tabular-nums">{READINESS_SCORE} / 100</span>
            </div>
            <Progress
              value={READINESS_SCORE}
              aria-label={`Corridor readiness score: ${READINESS_SCORE} out of 100`}
            />
            <p className="text-xs text-muted-foreground">
              {READINESS_SCORE >= 80
                ? "Ready for pilot launch."
                : "Below pilot threshold (80). Address outstanding items in §pilot-a-scenarios."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Comparison</CardTitle>
          <CardDescription>Eligible rails for the UAE→INR corridor</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Rail</TableHead>
                <TableHead className="text-right">Cost (bps)</TableHead>
                <TableHead className="text-right">Avg Time (h)</TableHead>
                <TableHead className="text-right">Failure Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROVIDERS.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.rail}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.costBps}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.avgTimeHours}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(p.failureRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
