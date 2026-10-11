"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { useInstructions } from "@/hooks/use-instructions";

/**
 * Dashboard page — MITHQAL-TECH-SPEC-001 §3.4.1.
 *
 * Composition:
 *   1. Metrics row — 4 MetricCards (Instructions Today, Value Today,
 *      Exception Rate, Avg Settlement Time).
 *   2. Charts row  — Route Distribution (Bar) + Cost Distribution (Pie).
 *   3. Tables row  — Recent Instructions + Active Exceptions.
 *
 * All values are SYNTHETIC — mtq-gate.ts (mtqDisabled=true). The
 * MetricCards and charts display fixed pilot numbers so the dashboard
 * has an honest, reproducible visual baseline. Recent instructions and
 * active exceptions are loaded from /api/v1/* via TanStack Query; when
 * the API returns no rows (DB not provisioned yet), the page falls back
 * to an honest "no live data — synthetic pilot" message.
 */

const ROUTE_DISTRIBUTION = [
  { route: "RTGS", count: 42, fill: "var(--chart-1, oklch(0.65 0.15 250))" },
  { route: "SWIFT", count: 28, fill: "var(--chart-2, oklch(0.70 0.12 145))" },
  { route: "ISO 20022", count: 18, fill: "var(--chart-3, oklch(0.75 0.15 85))" },
  { route: "CBDC", count: 6, fill: "var(--chart-4, oklch(0.65 0.20 25))" },
];

const COST_DISTRIBUTION = [
  { name: "0–10 bps", value: 12, fill: "var(--chart-1, oklch(0.65 0.15 250))" },
  { name: "11–20 bps", value: 38, fill: "var(--chart-2, oklch(0.70 0.12 145))" },
  { name: "21–30 bps", value: 32, fill: "var(--chart-3, oklch(0.75 0.15 85))" },
  { name: "31+ bps", value: 12, fill: "var(--chart-4, oklch(0.65 0.20 25))" },
];

export default function DashboardPage() {
  const instructionsQuery = useInstructions();
  const exceptionsQuery = useExceptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Synthetic pilot overview — MTQ disabled, production not authorised."
        actions={
          <Button asChild>
            <Link href="/timeline">View timeline</Link>
          </Button>
        }
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Pilot — synthetic data</AlertTitle>
        <AlertDescription>
          All metrics below are SYNTHETIC. No live instructions have been submitted (see
          mtq-gate.ts). The dashboard exists to validate the control plane surface, not to report
          production volumes.
        </AlertDescription>
      </Alert>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Instructions Today"
          value="12,450"
          change="+12%"
          trend="up"
          caption="synthetic — pilot baseline"
        />
        <MetricCard
          title="Value Today"
          value="$245M"
          change="+8%"
          trend="up"
          caption="synthetic — notional only"
        />
        <MetricCard
          title="Exception Rate"
          value="5.6%"
          change="-2.1%"
          trend="down"
          caption="synthetic — design target"
        />
        <MetricCard
          title="Avg Settlement Time"
          value="6h"
          change="-1.5h"
          trend="down"
          caption="synthetic — RTGS leg only"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Route Distribution</CardTitle>
            <CardDescription>Instructions per rail (synthetic, today)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ROUTE_DISTRIBUTION} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="route" tickLine={false} axisLine={false} fontSize={12} />
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
            <CardTitle>Cost Distribution</CardTitle>
            <CardDescription>Instructions per cost band (synthetic, bps)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COST_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {COST_DISTRIBUTION.map((entry) => (
                    <Cell key={`cost-${entry.name}`} fill={entry.fill} />
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

      {/* Tables Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Instructions</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/timeline">View all</Link>
              </Button>
            </div>
            <CardDescription>
              Latest submitted instructions (live API when provisioned)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instructionsQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : instructionsQuery.data && instructionsQuery.data.length > 0 ? (
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
                  {instructionsQuery.data.slice(0, 5).map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-mono text-xs">{ins.id}</TableCell>
                      <TableCell>{ins.corridor}</TableCell>
                      <TableCell>
                        <StatusBadge status={ins.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{ins.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No live instructions. Synthetic pilot baseline will appear once the database is
                provisioned and instructions are submitted.
              </p>
            )}
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
            <CardDescription>Open exception queue</CardDescription>
          </CardHeader>
          <CardContent>
            {exceptionsQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : exceptionsQuery.data && exceptionsQuery.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptionsQuery.data.slice(0, 5).map((exc) => (
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
                No live exceptions (synthetic badge count: 3). When the API returns rows they will
                render here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
