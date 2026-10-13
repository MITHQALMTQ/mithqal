"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
 * Dashboard page — MITHQAL MASTER BLUEPRINT §5.5 + §16.1.
 *
 * Composition (per §5.5 UI/Dashboard Principles):
 *   1. DEMO DATA banner — every metric is labelled "DEMO DATA — NOT
 *      CUSTOMER OR MARKET PERFORMANCE".
 *   2. Metrics row — exception counts, time to resolution, mismatch
 *      rates, evidence completeness, system health.
 *   3. Charts row — exception status distribution (Bar) + evidence
 *      completeness (Pie).
 *   4. Tables row — recent validation cases + active exceptions.
 *
 * The dashboard uses "Validation Cases" terminology (NOT "Instructions")
 * per §16.1 API Boundary. The 10 source-specific evidence events from §5.4
 * are surfaced in the events row, replacing the legacy F0–F7 finality
 * labels.
 *
 * MTQ Σ is NOT AUTHORIZED — research-only (§9.1). Production authorization:
 * FALSE per cover page.
 */

const DEMO_DATA_LABEL = "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE";

/** §5.5 metrics — exception counts, time to resolution, mismatch rates,
 *  evidence completeness, system health. All values are demo data. */
const EXCEPTION_STATUS_DISTRIBUTION = [
  { status: "OPEN", count: 7, fill: "var(--chart-1, oklch(0.65 0.15 250))" },
  { status: "ESCALATED", count: 2, fill: "var(--chart-2, oklch(0.70 0.12 145))" },
  { status: "AWAITING_APPROVAL", count: 1, fill: "var(--chart-3, oklch(0.75 0.15 85))" },
  { status: "RESOLVED", count: 14, fill: "var(--chart-4, oklch(0.65 0.20 25))" },
];

const EVIDENCE_COMPLETENESS = [
  { name: "Complete", value: 18, fill: "var(--chart-2, oklch(0.70 0.12 145))" },
  { name: "Partial", value: 5, fill: "var(--chart-3, oklch(0.75 0.15 85))" },
  { name: "Missing deps", value: 1, fill: "var(--chart-4, oklch(0.65 0.20 25))" },
];

const RESOLUTION_TREND = [
  { day: "Mon", hours: 12.4 },
  { day: "Tue", hours: 9.8 },
  { day: "Wed", hours: 8.1 },
  { day: "Thu", hours: 6.5 },
  { day: "Fri", hours: 5.9 },
  { day: "Sat", hours: 4.2 },
  { day: "Sun", hours: 3.7 },
];

/** §5.4 — 10 source-specific evidence events (NOT F0–F7). */
const SOURCE_EVENTS = [
  { event: "RECORD_RECEIVED", count: 24 },
  { event: "SOURCE_AUTHENTICATED", count: 22 },
  { event: "VALIDATION_PASSED", count: 18 },
  { event: "EXCEPTION_OPENED", count: 8 },
  { event: "HUMAN_APPROVAL_RECORDED", count: 6 },
  { event: "PROVIDER_ACKNOWLEDGEMENT_RECEIVED", count: 14 },
  { event: "SETTLEMENT_CONFIRMATION_RECEIVED", count: 11 },
  { event: "RECONCILIATION_COMPLETED", count: 9 },
  { event: "EVIDENCE_CONFLICT_DETECTED", count: 2 },
  { event: "DISPUTE_OPENED", count: 1 },
];

const DEMO_RECENT_CASES = [
  {
    id: "VC-2027-0042",
    corridor: "AE→IN",
    sourceCurrency: "AED",
    targetCurrency: "INR",
    amount: "2,100,000.00",
    status: "EXCEPTION_OPENED",
  },
  {
    id: "VC-2027-0041",
    corridor: "AE→IN",
    sourceCurrency: "AED",
    targetCurrency: "INR",
    amount: "750,000.00",
    status: "VALIDATED",
  },
  {
    id: "VC-2027-0040",
    corridor: "AE→IN",
    sourceCurrency: "AED",
    targetCurrency: "INR",
    amount: "1,250,000.00",
    status: "RESOLVED",
  },
  {
    id: "VC-2027-0039",
    corridor: "AE→SA",
    sourceCurrency: "AED",
    targetCurrency: "SAR",
    amount: "425,000.00",
    status: "RECEIVED",
  },
  {
    id: "VC-2027-0038",
    corridor: "AE→IN",
    sourceCurrency: "AED",
    targetCurrency: "INR",
    amount: "3,200,000.00",
    status: "CLOSED",
  },
] satisfies Array<{
  id: string;
  corridor: string;
  sourceCurrency: string;
  targetCurrency: string;
  amount: string;
  status: string;
}>;

export default function DashboardPage() {
  const exceptionsQuery = useExceptions();

  // Use live exceptions when available; fall back to demo seed otherwise.
  const liveExceptions = exceptionsQuery.data ?? [];
  const isLive = liveExceptions.length > 0;
  const recentExceptions = (isLive ? liveExceptions : DEMO_RECENT_CASES.map((c) => ({
    id: `EXC-${c.id.slice(-4)}`,
    validationCaseId: c.id,
    code: "UNSTRUCTURED_ADDRESS",
    severity: "MEDIUM" as const,
    owner: "ops@mithqal",
    status: "OPEN",
    openedAt: "2027-03-15T10:24:10Z",
  }))).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="MITHQAL Assurance — validation, exceptions, and evidence overview."
        actions={
          <Button asChild>
            <Link href="/timeline">View timeline</Link>
          </Button>
        }
      />

      {/* §5.5 DEMO DATA banner */}
      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>{DEMO_DATA_LABEL}</AlertTitle>
        <AlertDescription>
          All metrics below are demo data for illustration — not actual customer or market
          performance. MTQ Σ is research-only (§9.1). Production authorization: FALSE. Values
          become authoritative only when calculated from actual authorised records and
          documented definitions.
        </AlertDescription>
      </Alert>

      {/* Metrics Row — §5.5 vocabulary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open Exceptions"
          value="8"
          change="-2 vs prior week"
          trend="down"
          caption={DEMO_DATA_LABEL}
        />
        <MetricCard
          title="Time to Resolution"
          value="5.9h"
          change="-3.1h vs prior week"
          trend="down"
          caption={DEMO_DATA_LABEL}
        />
        <MetricCard
          title="Mismatch Rate"
          value="3.4%"
          change="-0.7pp vs prior week"
          trend="down"
          caption={DEMO_DATA_LABEL}
        />
        <MetricCard
          title="Evidence Completeness"
          value="92%"
          change="+4pp vs prior week"
          trend="up"
          caption={DEMO_DATA_LABEL}
        />
      </div>

      {/* System Health Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Health"
          value="OK"
          change="No active safe-halt"
          trend="up"
          caption={DEMO_DATA_LABEL}
        />
        <MetricCard
          title="Cases Received (24h)"
          value="24"
          change="+6 vs prior day"
          trend="up"
          caption={DEMO_DATA_LABEL}
        />
        <MetricCard
          title="Validation Pass Rate"
          value="75%"
          change="+2pp vs prior week"
          trend="up"
          caption={DEMO_DATA_LABEL}
        />
        <MetricCard
          title="Reconciliation Pass"
          value="9 / 24"
          change="37.5% matched"
          trend="neutral"
          caption={DEMO_DATA_LABEL}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exception Status Distribution</CardTitle>
            <CardDescription>{DEMO_DATA_LABEL}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EXCEPTION_STATUS_DISTRIBUTION} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence Completeness</CardTitle>
            <CardDescription>{DEMO_DATA_LABEL}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EVIDENCE_COMPLETENESS}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {EVIDENCE_COMPLETENESS.map((entry) => (
                    <Cell key={`evidence-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Time to Resolution (7-day trend, hours)</CardTitle>
          <CardDescription>{DEMO_DATA_LABEL}</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={RESOLUTION_TREND} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--chart-1, oklch(0.65 0.15 250))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* §5.4 Source-specific events — replaces F0–F7 */}
      <Card>
        <CardHeader>
          <CardTitle>Source-Specific Evidence Events (§5.4)</CardTitle>
          <CardDescription>
            10 events replace the legacy F0–F7 finality labels. {DEMO_DATA_LABEL}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Count (demo)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SOURCE_EVENTS.map((e) => (
                <TableRow key={e.event}>
                  <TableCell className="font-mono text-xs">{e.event}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tables Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Validation Cases</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/timeline">View all</Link>
              </Button>
            </div>
            <CardDescription>{DEMO_DATA_LABEL}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Corridor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_RECENT_CASES.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell>{c.corridor}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.amount} {c.sourceCurrency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Exceptions</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/exceptions">View all</Link>
              </Button>
            </div>
            <CardDescription>{DEMO_DATA_LABEL}</CardDescription>
          </CardHeader>
          <CardContent>
            {exceptionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading live exceptions…</p>
            ) : recentExceptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExceptions.map((exc) => (
                    <TableRow key={exc.id}>
                      <TableCell className="font-mono text-xs">{exc.code}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={exc.severity} />
                      </TableCell>
                      <TableCell>{exc.owner ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No live exceptions. Demo rows are shown above; real exceptions will render here
                once the API returns rows.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
