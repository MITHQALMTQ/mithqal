"use client";

/* ============================================================
 * FinalPilotGateDashboard — §V25.0
 * ------------------------------------------------------------
 * Task ID: UI-GAP-ANALYSIS-DASHBOARDS
 *
 * Renders the §V25.0 Final Pilot Activation Gate report — the
 * 8-of-8 final-status prompt for the v25.0 architecture series.
 *
 * Sections:
 *   - Final status: PILOT-READY (AMBER) — PRODUCTION-BLOCKED
 *   - 10 task gates (Monetary / Custody / Banking / Economics /
 *     External / Regulatory / Sharia / Operations / Pilot /
 *     Final Decision)
 *   - 10 standing blockers (0 RESOLVED, 9 PARTIALLY_ADDRESSED,
 *     1 OPEN; all realWorldEvidence=ABSENT)
 *   - 3 NEVER rules (0 violations each)
 *   - Evidence classification (4 REAL / 13 SIMULATED / 0
 *     CONTRACTED / 0 LIVE / 33 ABSENT)
 *   - 10 external dependencies
 *   - 10 recommended next actions
 *   - 12 acceptance criteria
 *
 * Data provenance: /api/final-pilot-activation-gate →
 *   src/lib/final-pilot-activation-gate.ts
 *
 * Honest state preserved throughout:
 *   finalStatus = PILOT-READY (AMBER, NOT PRODUCTION-READY)
 *   honest=true, forcedToPass=false, realWorldEvidencePresent=false
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Landmark,
  Scale,
  Boxes,
  Lock,
  Cpu,
  FileCheck,
  Globe,
  RefreshCw,
  AlertOctagon,
  Users,
  Ban,
  Flag,
  Target,
  ListChecks,
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface GateRequirement {
  id: string;
  description: string;
  status: string;
  evidenceClass: string;
  evidence: string;
  blocker: string | null;
  source: string;
}

interface TaskGate {
  taskId: string;
  taskName: string;
  requirements: GateRequirement[];
  gateStatus: string;
  passedCount: number;
  failedCount: number;
  partialCount: number;
  notStartedCount: number;
  blockedCount: number;
  honestNote?: string;
}

interface StandingBlocker {
  blockerId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  resolutionPath: string;
  resolvedByPromptId: string;
  realWorldEvidence: string;
}

interface FinalPilotGateReport {
  moduleId: string;
  finalStatus: string;
  finalStatusReason: string;
  finalStatusColor: string;
  gates: TaskGate[];
  passedGateCount: number;
  failedGateCount: number;
  standingBlockers: StandingBlocker[];
  openBlockerCount: number;
  partiallyAddressedCount: number;
  resolvedCount: number;
  rules: {
    neverConvertSimulatedToLive: boolean;
    neverConvertInternalTestToExternalAudit: boolean;
    neverConvertPilotReadyToProductionReady: boolean;
    simulatedEntitiesConvertedToLive: number;
    internalTestsConvertedToExternalAudit: number;
    pilotReadyConvertedToProductionReady: number;
  };
  honest: boolean;
  forcedToPass: boolean;
  realWorldEvidencePresent: boolean;
  evidenceSummary: {
    realEvidenceCount: number;
    simulatedEvidenceCount: number;
    contractedEvidenceCount: number;
    liveEvidenceCount: number;
    absentEvidenceCount: number;
    externalDependencies: string[];
  };
  recommendedNextActions: string[];
  acceptance: Record<string, boolean>;
  acceptancePassed: number;
  acceptanceTotal: number;
  shariaBanner: string;
  shariaBannerEnforcedBy: string;
  finalReminder: string;
}

function gateStatusBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PASS" || s === "PASSED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  if (s === "FAIL" || s === "FAILED") {
    return (
      <Badge
        variant="outline"
        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
      >
        <XCircle className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  if (s === "BLOCKED") {
    return (
      <Badge
        variant="outline"
        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
      >
        <Ban className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  if (s === "PARTIAL") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
      >
        <Activity className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {status || "—"}
    </Badge>
  );
}

function blockerStatusBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "OPEN") {
    return (
      <Badge
        variant="outline"
        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
      >
        <XCircle className="mr-1 h-3 w-3" />
        OPEN
      </Badge>
    );
  }
  if (s === "PARTIALLY_ADDRESSED" || s === "PARTIALLY ADDRESSED") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
      >
        <Activity className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  if (s === "RESOLVED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        RESOLVED
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

export function FinalPilotGateDashboard() {
  const [report, setReport] = useState<FinalPilotGateReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/final-pilot-activation-gate");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setReport(data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "unknown error");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading Final Pilot Activation Gate dashboard...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="border-red-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertOctagon className="h-5 w-5" />
                Final Pilot Activation Gate dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the Final Pilot Activation Gate report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  const evidence = report.evidenceSummary;
  const totalEvidence =
    evidence.realEvidenceCount +
    evidence.simulatedEvidenceCount +
    evidence.contractedEvidenceCount +
    evidence.liveEvidenceCount +
    evidence.absentEvidenceCount;
  const evidenceBars = [
    { label: "REAL", value: evidence.realEvidenceCount, color: "bg-emerald-500" },
    { label: "SIMULATED", value: evidence.simulatedEvidenceCount, color: "bg-amber-500" },
    { label: "CONTRACTED", value: evidence.contractedEvidenceCount, color: "bg-amber-400" },
    { label: "LIVE", value: evidence.liveEvidenceCount, color: "bg-emerald-400" },
    { label: "ABSENT", value: evidence.absentEvidenceCount, color: "bg-red-500" },
  ];
  const acceptancePct =
    report.acceptanceTotal > 0
      ? Math.round((report.acceptancePassed / report.acceptanceTotal) * 100)
      : 0;

  return (
    <section
      id="final-pilot-gate-dashboard"
      className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* §1 Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Final Pilot{" "}
              <span className="gold-text">Activation Gate</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The §V25.0 8-of-8 final-status prompt: spec-level institutional closure
            is complete (8/8 prompts), but real-world evidence is absent. The system
            is PILOT-READY — NOT PRODUCTION-READY.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <Flag className="mr-1 h-3 w-3" />
              {report.finalStatus} ({report.finalStatusColor})
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <Ban className="mr-1 h-3 w-3" />
              PRODUCTION-BLOCKED
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Real-world evidence: {report.realWorldEvidencePresent ? "PRESENT" : "ABSENT"}
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <ListChecks className="mr-1 h-3 w-3" />
              {report.acceptancePassed}/{report.acceptanceTotal} acceptance criteria
            </Badge>
          </div>
        </motion.div>

        {/* §2 Final Status prominent display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-5 text-center">
                  <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Final Status
                  </p>
                  <p className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {report.finalStatus}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-2 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  >
                    Color: {report.finalStatusColor}
                  </Badge>
                </div>
                <div className="rounded-lg border-2 border-red-500/50 bg-red-500/10 p-5 text-center">
                  <Lock className="mx-auto mb-2 h-8 w-8 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Production State
                  </p>
                  <p className="mt-1 text-3xl font-bold text-red-700 dark:text-red-300">
                    PRODUCTION-BLOCKED
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-2 border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                  >
                    Real-world evidence: ABSENT
                  </Badge>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <AlertTriangle className="mr-1 inline h-4 w-4 text-amber-600 dark:text-amber-400" />
                {report.finalStatusReason}
              </p>
              <div className="mt-3 rounded-md bg-muted/40 p-3 text-center text-xs">
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                  {report.shariaBanner}
                </span>
                <span className="text-muted-foreground"> (enforced by {report.shariaBannerEnforcedBy})</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §3 10 Task Gates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                10 Task Gates — PASS / PARTIAL / FAIL / BLOCKED
              </CardTitle>
              <CardDescription>
                {report.passedGateCount} passed · {report.failedGateCount} not passed ·
                0 gates have all requirements PASS — gate is HONEST, not forced.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="w-32">Task ID</TableHead>
                      <TableHead>Task Name</TableHead>
                      <TableHead className="text-center">PASS</TableHead>
                      <TableHead className="text-center">PARTIAL</TableHead>
                      <TableHead className="text-center">FAIL</TableHead>
                      <TableHead className="text-center">BLOCKED</TableHead>
                      <TableHead className="text-center">NOT STARTED</TableHead>
                      <TableHead className="w-32">Gate Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.gates.map((g) => (
                      <TableRow key={g.taskId}>
                        <TableCell className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {g.taskId}
                        </TableCell>
                        <TableCell className="text-sm">{g.taskName}</TableCell>
                        <TableCell className="text-center font-mono text-emerald-700 dark:text-emerald-300">
                          {g.passedCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-amber-700 dark:text-amber-300">
                          {g.partialCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-red-700 dark:text-red-300">
                          {g.failedCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-red-700 dark:text-red-300">
                          {g.blockedCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {g.notStartedCount}
                        </TableCell>
                        <TableCell>{gateStatusBadge(g.gateStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §4 10 Standing Blockers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-semibold">
              10 Standing Blockers — All realWorldEvidence=ABSENT
            </h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {report.resolvedCount} RESOLVED · {report.partiallyAddressedCount}{" "}
            PARTIALLY_ADDRESSED · {report.openBlockerCount} OPEN — none have REAL
            evidence yet.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {report.standingBlockers.map((b) => (
              <Card
                key={b.blockerId}
                className={`flex flex-col ${
                  b.severity === "CRITICAL"
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {b.blockerId}
                      </span>
                      <span className="ml-2 block text-sm">{b.title}</span>
                    </CardTitle>
                    {blockerStatusBadge(b.status)}
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {b.category} · {b.severity}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-xs">
                  <p>
                    <span className="text-muted-foreground">Resolution path: </span>
                    <span className="text-foreground">{b.resolutionPath}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Real evidence: {b.realWorldEvidence}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {b.resolvedByPromptId}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §5 3 NEVER Rules */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                3 NEVER Rules — All Violations = 0
              </CardTitle>
              <CardDescription>
                The honesty firewall: simulated entities never become live, internal
                tests never become external audits, pilot-ready never becomes
                production-ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      NEVER convert SIMULATED → LIVE
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {report.rules.simulatedEntitiesConvertedToLive}
                  </p>
                  <p className="text-xs text-muted-foreground">violations</p>
                </div>
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      NEVER convert INTERNAL TEST → EXTERNAL AUDIT
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {report.rules.internalTestsConvertedToExternalAudit}
                  </p>
                  <p className="text-xs text-muted-foreground">violations</p>
                </div>
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      NEVER convert PILOT-READY → PRODUCTION-READY
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {report.rules.pilotReadyConvertedToProductionReady}
                  </p>
                  <p className="text-xs text-muted-foreground">violations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §6 Evidence Classification bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Evidence Classification — {totalEvidence} Items
              </CardTitle>
              <CardDescription>
                {evidence.realEvidenceCount} REAL ·{" "}
                {evidence.simulatedEvidenceCount} SIMULATED ·{" "}
                {evidence.contractedEvidenceCount} CONTRACTED ·{" "}
                {evidence.liveEvidenceCount} LIVE ·{" "}
                {evidence.absentEvidenceCount} ABSENT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evidenceBars.map((b) => {
                  const pctVal =
                    totalEvidence > 0
                      ? Math.round((b.value / totalEvidence) * 100)
                      : 0;
                  return (
                    <div key={b.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold">{b.label}</span>
                        <span className="text-muted-foreground">
                          {b.value} ({pctVal}%)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${b.color}`}
                          style={{ width: `${pctVal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                Real-world evidence is ABSENT in {evidence.absentEvidenceCount} of{" "}
                {totalEvidence} cases. The architecture is PILOT-READY at the spec
                level only — production authorization requires real-world
                resolution of all 10 standing blockers.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* §7 10 External Dependencies */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                10 External Dependencies — Real-World Counterparts Required
              </CardTitle>
              <CardDescription>
                None currently contracted. Each must be engaged before any
                production authorization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {evidence.externalDependencies.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded border border-border/40 bg-muted/20 p-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {i + 1}
                    </span>
                    <span className="text-xs text-foreground">{d}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §8 10 Recommended Next Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                10 Recommended Next Actions
              </CardTitle>
              <CardDescription>
                Ordered list — first action: {report.recommendedNextActions[0]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {report.recommendedNextActions.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded border border-border/40 bg-muted/20 p-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-semibold text-amber-700 dark:text-amber-300">
                      {i + 1}
                    </span>
                    <span className="text-xs">{a}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </motion.div>

        {/* §9 12 Acceptance Criteria */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                12 Acceptance Criteria — All Passed (Spec-Level)
              </CardTitle>
              <CardDescription>
                All {report.acceptanceTotal} criteria are passed at the gate-evaluation
                level. Passing the gate does NOT grant production authorization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gate-evaluation progress</span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                    {report.acceptancePassed}/{report.acceptanceTotal} ({acceptancePct}%)
                  </span>
                </div>
                <Progress value={acceptancePct} className="h-2" />
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {Object.entries(report.acceptance).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start gap-2 rounded border border-border/40 bg-muted/20 p-2"
                  >
                    {v ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-xs text-muted-foreground">{k}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Closing honest state */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    Honest State Declaration — §V25.0 8-of-8
                  </p>
                  <p className="text-muted-foreground italic">
                    &ldquo;{report.finalReminder}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Module: {report.moduleId} · honest={String(report.honest)} ·
                    forcedToPass={String(report.forcedToPass)} ·
                    realWorldEvidencePresent=
                    {String(report.realWorldEvidencePresent)} · finalStatus=
                    {report.finalStatus} (NOT PRODUCTION-READY).
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The architecture is spec-level closed (8/8 prompts). Real-world
                    evidence remains absent in {evidence.absentEvidenceCount} of{" "}
                    {totalEvidence} evidence items. No simulated entity has been
                    converted to LIVE. No internal test has been converted to external
                    audit. No PILOT-READY status has been converted to
                    PRODUCTION-READY.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
