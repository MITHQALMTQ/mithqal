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
 * Exceptions page — MITHQAL MASTER BLUEPRINT §16.1 + §5.5.
 *
 * Exception queue with severity/status filters. Live data is loaded via
 * /api/v1/exceptions (TanStack Query). When the API returns no rows, the
 * page shows DEMO DATA rows so operators can validate the filters and
 * table surface. All demo rows are labelled per §5.5.
 *
 * Schema (§16.3 Table 5):
 *   validationCaseId  (was instructionId in legacy schema)
 *   openedAt           (was createdAt)
 *   resolvedAt         (was closedAt)
 *   reasonCode         (new)
 *   recommendedAction  (new)
 */

const DEMO_DATA_LABEL = "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE";

interface DemoException {
  id: string;
  validationCaseId: string;
  code: string;
  severity: Severity;
  owner: string;
  reasonCode: string;
  recommendedAction: string;
  status: string;
  openedAt: string;
  resolvedAt: string | null;
}

const DEMO_EXCEPTIONS: DemoException[] = [
  {
    id: "EXC-001",
    validationCaseId: "VC-2027-0042",
    code: "RAIL_FINAL_TIMEOUT",
    severity: "HIGH",
    owner: "ops@mithqal",
    reasonCode: "RAIL_TIMEOUT",
    recommendedAction: "Retry with alternative rail (subject to approval)",
    status: "OPEN",
    openedAt: "2027-03-15T10:24:10Z",
    resolvedAt: null,
  },
  {
    id: "EXC-002",
    validationCaseId: "VC-2027-0047",
    code: "BANK_FUNDING_DELAY",
    severity: "MEDIUM",
    owner: "ops@mithqal",
    reasonCode: "FUNDING_DELAY",
    recommendedAction: "Await funding confirmation; do not retry",
    status: "OPEN",
    openedAt: "2027-03-15T11:05:00Z",
    resolvedAt: null,
  },
  {
    id: "EXC-003",
    validationCaseId: "VC-2027-0049",
    code: "POLICY_REVIEW_REQ",
    severity: "CRITICAL",
    owner: "risk@mithqal",
    reasonCode: "POLICY_REVIEW",
    recommendedAction: "Escalate to policy committee",
    status: "OPEN",
    openedAt: "2027-03-15T11:20:00Z",
    resolvedAt: null,
  },
  {
    id: "EXC-004",
    validationCaseId: "VC-2027-0052",
    code: "FX_RATE_STALE",
    severity: "LOW",
    owner: "ops@mithqal",
    reasonCode: "STALE_RATE",
    recommendedAction: "Refresh FX feed and revalidate",
    status: "RESOLVED",
    openedAt: "2027-03-15T09:30:00Z",
    resolvedAt: "2027-03-15T10:12:00Z",
  },
];

const STATUS_FILTERS = ["ALL", "OPEN", "RESOLVED"];
const SEVERITY_FILTERS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function ExceptionsPage() {
  const query = useExceptions();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Use live data when present; fall back to demo seed otherwise.
  const source = query.data && query.data.length > 0 ? query.data : DEMO_EXCEPTIONS;

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
      <PageHeader title="Exception Queue" description="Permitted exceptions — auditable records" />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>{isFallback ? DEMO_DATA_LABEL : "Live exceptions"}</AlertTitle>
        <AlertDescription>
          {isFallback
            ? "No live exceptions from /api/v1/exceptions — showing 4 demo rows. Marking an exception RESOLVED is an auditable state transition; no payment is executed."
            : "Exceptions loaded from the API. Updates auto-refresh every 60 seconds."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Open Exceptions</CardTitle>
              <CardDescription>
                {filtered.length} rows ({isFallback ? "demo" : "live"}) — {DEMO_DATA_LABEL}
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
                  <TableHead>Case</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
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
                      <TableCell className="font-mono text-xs">{e.validationCaseId}</TableCell>
                      <TableCell className="font-mono text-xs">{e.code}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={e.severity} />
                      </TableCell>
                      <TableCell>{e.owner ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {e.openedAt}
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
