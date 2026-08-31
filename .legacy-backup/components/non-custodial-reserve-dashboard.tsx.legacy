"use client";

/* ============================================================
 * NonCustodialReserveDashboard — §V25.0.C
 * ------------------------------------------------------------
 * Task ID: UI-GAP-ANALYSIS-DASHBOARDS
 *
 * Renders the §V25.0.C Non-Custodial Reserve Architecture report.
 * Surfaces the canonical reserve / custody separation architecture:
 *   - Canonical principle: CUSTODY ≠ VERIFICATION ≠ ISSUANCE
 *     AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL
 *   - 5-actor control matrix (Customer, Bank, Custodian, MITHQAL, Regulator)
 *   - RCAF schema (18 mandatory fields)
 *   - AvailableBackingCertificate schema (16 fields, 8 rules)
 *   - 15-step Issuance Authorization Gate
 *   - 6 custody prohibitions
 *   - 7 FV invariants (FV11..FV17)
 *   - 18 test scenarios (NC-T01..NC-T18)
 *   - Model A vs Model C breach comparison (21.5432% vs 4.7086%)
 *
 * Data provenance: /api/non-custodial-reserve-architecture →
 *   src/lib/non-custodial-reserve-architecture.ts
 *
 * Honest state preserved throughout:
 *   finalStatus = "APPROVED CANDIDATE FOR CONTROLLED TESTING —
 *                  NOT PRODUCTION-AUTHORIZED"
 *   honest=true, productionAuthorized=false, mithqalHeldAssets=0
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
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
  GitBranch,
  Ban,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface FinalControlMatrixEntry {
  role: string;
  responsibilities: string[];
  cannotUnilaterallyControl: string[];
}

interface RCAFSchema {
  interfaceName: string;
  requiredFields: number;
  fieldList: string[];
}

interface ABCSchema {
  interfaceName: string;
  fieldCount: number;
  rules: string[];
}

interface FVInvariant {
  name: string;
  statement: string;
  status: string;
}

interface TestScenario {
  testId: string;
  description: string;
  expectedResult: string;
  status: string;
}

interface NonCustodialReport {
  moduleId: string;
  principle: string;
  canonicalDistinction: string;
  finalControlMatrix: FinalControlMatrixEntry[];
  finalControlRule: string;
  rcafSchema: RCAFSchema;
  availableBackingCertificateSchema: ABCSchema;
  issuanceGateSteps: number;
  issuanceGateRule: string;
  mintAuthorityStates: string[];
  custodyProhibitions: string[];
  custodyProhibitionException: string;
  defaultArchitecture: string;
  newFVInvariants: Record<string, FVInvariant>;
  fvInvariantCount: number;
  testScenarios: TestScenario[];
  testScenarioCount: number;
  modelA_breach: number;
  modelB_breach: number;
  modelC_breach: number;
  honestState: {
    honest: boolean;
    forcedToPass: boolean;
    productionAuthorized: boolean;
    nonCustodialByDefault: boolean;
    mithqalHeldAssets: number;
  };
  finalStatus: string;
}

function fvStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "PROVEN_AT_SPEC_LEVEL" || s === "PROVEN") {
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

function testStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "PASS" || s === "PASSED" || s === "AUTHORIZED") {
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
  if (s === "FAIL" || s === "BLOCKED") {
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

function pct(n: number) {
  return (n * 100).toFixed(4) + "%";
}

export function NonCustodialReserveDashboard() {
  const [report, setReport] = useState<NonCustodialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/non-custodial-reserve-architecture");
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
            <span>Loading Non-Custodial Reserve dashboard...</span>
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
                Non-Custodial Reserve dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the Non-Custodial Reserve report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  const fvEntries = Object.entries(report.newFVInvariants || {});

  return (
    <section
      id="non-custodial-reserve-dashboard"
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
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Non-Custodial Reserve{" "}
              <span className="gold-text">Architecture</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The §V25.0.C architecture: MITHQAL shall NOT take custody of MTQ
            reserve assets or customer funds unless a specific jurisdictional
            legal structure expressly requires and independently authorizes such
            custody. Reserve assets remain in regulated institutional custody.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              {report.defaultArchitecture}
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              MITHQAL-held assets: ${report.honestState.mithqalHeldAssets.toLocaleString()}
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Production-authorized: NO
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <FileCheck className="mr-1 h-3 w-3" />
              {report.testScenarioCount} tests (NC-T01..NC-T18)
            </Badge>
          </div>
        </motion.div>

        {/* §2 Canonical Distinction */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Canonical Distinction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center font-mono text-sm font-semibold tracking-tight text-amber-700 dark:text-amber-300 sm:text-base">
                {report.canonicalDistinction}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {report.finalControlRule}
              </p>
              <div className="mt-4 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Canonical Principle:{" "}
                </span>
                {report.principle.slice(0, 380)}
                {report.principle.length > 380 ? "…" : ""}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §3 5-Actor Control Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold">
              5-Actor Control Matrix — Distributed Authority
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {report.finalControlMatrix.map((actor) => (
              <Card key={actor.role} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
                    >
                      {actor.role}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-xs">
                  <div>
                    <p className="mb-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      Responsibilities
                    </p>
                    <ul className="max-h-32 space-y-1 overflow-y-auto pr-1 text-muted-foreground">
                      {actor.responsibilities.slice(0, 6).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-red-700 dark:text-red-300">
                      Cannot Unilaterally Control
                    </p>
                    <ul className="max-h-32 space-y-1 overflow-y-auto pr-1 text-muted-foreground">
                      {actor.cannotUnilaterallyControl.slice(0, 5).map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §4 RCAF + ABC Schemas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  RCAF Schema
                </CardTitle>
                <CardDescription>
                  {report.rcafSchema.interfaceName} — {report.rcafSchema.requiredFields}{" "}
                  mandatory fields per §V25.0.C.5
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 space-y-1 overflow-y-auto pr-2">
                  {report.rcafSchema.fieldList.map((f) => (
                    <div
                      key={f}
                      className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2 py-1"
                    >
                      <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
                        {f}
                      </span>
                      <span className="text-xs text-muted-foreground">required</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  AvailableBackingCertificate Schema
                </CardTitle>
                <CardDescription>
                  {report.availableBackingCertificateSchema.interfaceName} —{" "}
                  {report.availableBackingCertificateSchema.fieldCount} fields ·
                  evidence, NOT custody.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 space-y-1.5 overflow-y-auto pr-2">
                  {report.availableBackingCertificateSchema.rules.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded border border-border/40 bg-muted/20 px-2 py-1.5"
                    >
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* §5 15-Step Issuance Authorization Gate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                {report.issuanceGateSteps}-Step Issuance Authorization Gate
              </CardTitle>
              <CardDescription>
                {report.issuanceGateRule} Mint authority is deliberately separated
                across {report.mintAuthorityStates.length} states:{" "}
                {report.mintAuthorityStates.join(" → ")}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: report.issuanceGateSteps }, (_, i) => i + 1).map(
                  (step, idx, arr) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          {step}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {report.mintAuthorityStates.map((s, i) => (
                  <div
                    key={s}
                    className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5"
                  >
                    <p className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                      State {i + 1}: {s}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs italic text-muted-foreground">
                No single actor controls both the request and the authorization —
                separation of duties is enforced at the protocol level.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* §6 6 Custody Prohibitions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-semibold">
              6 Custody Prohibitions — MITHQAL Shall NOT Operate
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.custodyProhibitions.map((p, i) => (
              <Card key={i} className="border-red-500/40 bg-red-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="mb-1 font-mono text-xs font-semibold text-red-700 dark:text-red-300">
                        PROHIBITION #{i + 1}
                      </p>
                      <p className="text-sm text-foreground">{p}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Exception clause: {report.custodyProhibitionException}
          </p>
        </motion.div>

        {/* §7 7 FV Invariants (FV11-FV17) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                {report.fvInvariantCount} FV Invariants — FV11..FV17
              </CardTitle>
              <CardDescription>
                PvP atomicity, custody separation, backing evidence validity, no
                unverified issuance, no double-counted backing, 5-way
                reconciliation, redemption conservation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Statement</TableHead>
                      <TableHead className="w-44">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fvEntries.map(([id, inv]) => (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {id}
                        </TableCell>
                        <TableCell className="font-medium">{inv.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inv.statement}
                        </TableCell>
                        <TableCell>{fvStatusBadge(inv.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §8 18 Test Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                {report.testScenarioCount} Test Scenarios (NC-T01..NC-T18)
              </CardTitle>
              <CardDescription>
                Issuance authorization gate, custody prohibitions, reconciliation
                states, redemption, and failure-mode handling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-1.5 overflow-y-auto pr-2">
                {report.testScenarios.map((t) => (
                  <div
                    key={t.testId}
                    className="flex items-start gap-3 rounded border border-border/40 bg-muted/20 p-2.5"
                  >
                    <span className="w-20 shrink-0 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {t.testId}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{t.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Expected: {t.expectedResult}
                      </p>
                    </div>
                    <div className="shrink-0">{testStatusBadge(t.status)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §9 Model A vs Model C breach comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Model A vs Model C — Reserve Breach Comparison
              </CardTitle>
              <CardDescription>
                Model A (current reserve) preserves 21.5432% breach probability.
                Model C (non-custodial bank-funded) reduces blended breach to
                4.7086% — below the 5% governance threshold. Bank-funded model
                REDUCES but does NOT eliminate risk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-red-700 dark:text-red-300">
                      MODEL A — Current Reserve
                    </span>
                    <Badge
                      variant="outline"
                      className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
                    >
                      Above threshold
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {pct(report.modelA_breach)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    P(RR&lt;100%) — 100% MITHQAL-owned reserve exposure. ΔCapital_min
                    = $15.815M to reach the 5% governance threshold.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      MODEL C — Non-Custodial Bank-Funded
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                    >
                      Below threshold
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {pct(report.modelC_breach)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Blended P(RR&lt;100%) — 80% bank-funded deposits + 20% structural
                    MITHQAL reserve. NO additional monetary-protection capital
                    required at system level.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  Reconciliation: Emergency + Structural ($23.8M) is a SUBSET of the
                  $48.1M ILPS total — NOT additional. No double-counting permitted.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Closing final status */}
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
                    Final Status — §V25.0.C Closing
                  </p>
                  <p className="text-muted-foreground italic">
                    &ldquo;{report.finalStatus}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Module: {report.moduleId} · MITHQAL-held reserve assets: $
                    {report.honestState.mithqalHeldAssets.toLocaleString()} ·
                    Non-custodial by default:{" "}
                    {String(report.honestState.nonCustodialByDefault)}
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
