"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { type Severity, SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Reconciliation page — MITHQAL-TECH-SPEC-001 §3.4 (reconciliation cases).
 *
 * Lists reconciliation cases per the §reconciliation-tolerance policy.
 * Each row: caseId, sourceSet, discrepancyClass, severity, owner, status.
 *
 * In pilot the table shows synthetic rows so operators can exercise the
 * filter UI. Live cases arrive when the Inngest `reconciliation-runner`
 * function is wired (Phase 3 of the spec).
 */

interface ReconCase {
  caseId: string;
  sourceSet: string;
  cutoff: string;
  discrepancyClass:
    | "NONE"
    | "TIMING"
    | "AMOUNT"
    | "CURRENCY"
    | "COUNTERPARTY"
    | "RAIL"
    | "POLICY"
    | "UNKNOWN";
  severity: Severity;
  owner: string | null;
  status: "OPEN" | "INVESTIGATING" | "TOLERATED" | "RESOLVED" | "ESCALATED";
  createdAt: string;
}

const SYNTHETIC_CASES: ReconCase[] = [
  {
    caseId: "REC-001",
    sourceSet: "RTGS-vs-BankA",
    cutoff: "2026-10-10T22:00:00Z",
    discrepancyClass: "TIMING",
    severity: "MEDIUM",
    owner: "ops@mithqal",
    status: "OPEN",
    createdAt: "2026-10-11T00:00:00Z",
  },
  {
    caseId: "REC-002",
    sourceSet: "RTGS-vs-BankB",
    cutoff: "2026-10-10T22:00:00Z",
    discrepancyClass: "AMOUNT",
    severity: "HIGH",
    owner: "risk@mithqal",
    status: "INVESTIGATING",
    createdAt: "2026-10-11T00:05:00Z",
  },
  {
    caseId: "REC-003",
    sourceSet: "FX-vs-Treasury",
    cutoff: "2026-10-10T22:00:00Z",
    discrepancyClass: "COUNTERPARTY",
    severity: "CRITICAL",
    owner: "risk@mithqal",
    status: "ESCALATED",
    createdAt: "2026-10-11T00:10:00Z",
  },
  {
    caseId: "REC-004",
    sourceSet: "CBDC-vs-BankD",
    cutoff: "2026-10-10T22:00:00Z",
    discrepancyClass: "TIMING",
    severity: "LOW",
    owner: null,
    status: "TOLERATED",
    createdAt: "2026-10-11T00:15:00Z",
  },
  {
    caseId: "REC-005",
    sourceSet: "SWIFT-vs-BankC",
    cutoff: "2026-10-10T22:00:00Z",
    discrepancyClass: "NONE",
    severity: "LOW",
    owner: null,
    status: "RESOLVED",
    createdAt: "2026-10-11T00:20:00Z",
  },
];

const DISCREPANCY_CLASSES = [
  "ALL",
  "NONE",
  "TIMING",
  "AMOUNT",
  "CURRENCY",
  "COUNTERPARTY",
  "RAIL",
  "POLICY",
  "UNKNOWN",
];
const STATUS_FILTERS = ["ALL", "OPEN", "INVESTIGATING", "TOLERATED", "RESOLVED", "ESCALATED"];

export default function ReconciliationPage() {
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = useMemo(
    () =>
      SYNTHETIC_CASES.filter(
        (c) =>
          (discrepancyFilter === "ALL" || c.discrepancyClass === discrepancyFilter) &&
          (statusFilter === "ALL" || c.status === statusFilter),
      ),
    [discrepancyFilter, statusFilter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation"
        description="Manage reconciliation cases per the tolerance policy"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Synthetic cases</AlertTitle>
        <AlertDescription>
          Showing 5 SYNTHETIC reconciliation cases. Live cases arrive once the Inngest
          reconciliation-runner workflow is wired and the tolerance-policy-version POLICY-v1.2.3 is
          enforced end-to-end.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Reconciliation Cases</CardTitle>
              <CardDescription>{filtered.length} rows (synthetic)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={discrepancyFilter} onValueChange={setDiscrepancyFilter}>
                <SelectTrigger className="w-48" aria-label="Filter by discrepancy class">
                  <SelectValue placeholder="Discrepancy" />
                </SelectTrigger>
                <SelectContent>
                  {DISCREPANCY_CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "ALL" ? "All discrepancies" : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "ALL" ? "All statuses" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Source Set</TableHead>
                <TableHead>Discrepancy</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No reconciliation cases match the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.caseId}>
                    <TableCell className="font-mono text-xs">{c.caseId}</TableCell>
                    <TableCell className="font-mono text-xs">{c.sourceSet}</TableCell>
                    <TableCell>{c.discrepancyClass}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={c.severity} />
                    </TableCell>
                    <TableCell>{c.owner ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{c.createdAt}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
