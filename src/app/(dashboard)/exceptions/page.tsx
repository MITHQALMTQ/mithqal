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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExceptions } from "@/hooks/use-exceptions";

/**
 * Exceptions page — MITHQAL-TECH-SPEC-001 §3.4.3.
 *
 * Exception queue with severity/severity/status filters. Live data is
 * loaded via /api/v1/exceptions (TanStack Query). When the API returns
 * no rows, the page shows SYNTHETIC rows so operators can validate the
 * filters and table surface.
 */

const SYNTHETIC_EXCEPTIONS = [
  {
    id: "EXC-001",
    instructionId: "INS-003",
    code: "RAIL_FINAL_TIMEOUT",
    severity: "HIGH" as Severity,
    owner: "ops@mithqal",
    status: "OPEN",
    createdAt: "2026-10-11T10:24:10Z",
  },
  {
    id: "EXC-002",
    instructionId: "INS-007",
    code: "BANK_FUNDING_DELAY",
    severity: "MEDIUM" as Severity,
    owner: "ops@mithqal",
    status: "OPEN",
    createdAt: "2026-10-11T11:05:00Z",
  },
  {
    id: "EXC-003",
    instructionId: "INS-009",
    code: "POLICY_REVIEW_REQ",
    severity: "CRITICAL" as Severity,
    owner: "risk@mithqal",
    status: "OPEN",
    createdAt: "2026-10-11T11:20:00Z",
  },
  {
    id: "EXC-004",
    instructionId: "INS-012",
    code: "FX_RATE_STALE",
    severity: "LOW" as Severity,
    owner: "ops@mithqal",
    status: "CLOSED",
    createdAt: "2026-10-11T09:30:00Z",
  },
] satisfies Array<{
  id: string;
  instructionId: string;
  code: string;
  severity: Severity;
  owner: string;
  status: string;
  createdAt: string;
}>;

const STATUS_FILTERS = ["ALL", "OPEN", "CLOSED"];
const SEVERITY_FILTERS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function ExceptionsPage() {
  const query = useExceptions();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Use live data when present; fall back to synthetic seed otherwise.
  const source = query.data && query.data.length > 0 ? query.data : SYNTHETIC_EXCEPTIONS;

  const filtered = useMemo(
    () =>
      source.filter(
        (e) =>
          (statusFilter === "ALL" || e.status === statusFilter) &&
          (severityFilter === "ALL" || e.severity === severityFilter),
      ),
    [source, statusFilter, severityFilter],
  );

  const isFallback = !query.data || query.data.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Exception Queue" description="Manage all settlement exceptions" />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>{isFallback ? "Synthetic exceptions" : "Live exceptions"}</AlertTitle>
        <AlertDescription>
          {isFallback
            ? "No live exceptions from /api/v1/exceptions — showing 4 synthetic seed rows. Real exceptions will appear once instructions are submitted and finality enforcement runs."
            : "Exceptions loaded from the API. Updates auto-refresh every 60 seconds."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Open Exceptions</CardTitle>
              <CardDescription>
                {filtered.length} rows ({isFallback ? "synthetic" : "live"})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" aria-label="Filter by status">
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
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40" aria-label="Filter by severity">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "ALL" ? "All severities" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Instruction</TableHead>
                  <TableHead>Code</TableHead>
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
                      No exceptions match the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.id}</TableCell>
                      <TableCell className="font-mono text-xs">{e.instructionId}</TableCell>
                      <TableCell className="font-mono text-xs">{e.code}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={e.severity} />
                      </TableCell>
                      <TableCell>{e.owner ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {e.createdAt}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
