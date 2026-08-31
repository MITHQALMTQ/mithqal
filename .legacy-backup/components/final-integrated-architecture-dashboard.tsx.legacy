"use client";

/* ============================================================
 * FinalIntegratedArchitectureDashboard — §V25.0.D
 * ------------------------------------------------------------
 * Task ID: UI-GAP-ANALYSIS-DASHBOARDS
 *
 * Renders the §V25.0.D Final Integrated Architecture report.
 * Surfaces the canonical reconciliation of all v25.0 amendments:
 *   - 5 corporate entities (Founder / Holding / Operating / Tech / Foundation)
 *   - 7-layer MTQ settlement model (LAYER_0..LAYER_6)
 *   - DMCE (Dynamic Minting Capacity Engine) — MIN of 8 limits
 *   - 15 FV invariants (FV11..FV25)
 *   - 35 integrated test scenarios (INT-T01..INT-T35)
 *   - 12 versioned /gateway/v1/* API endpoints
 *   - 7×18 authority matrix (7 actors × 18 functions)
 *   - 44 acceptance criteria (44/44 met at spec level)
 *
 * Data provenance: /api/final-integrated-architecture →
 *   generateFinalIntegratedReport() in
 *   src/lib/final-integrated-architecture.ts
 *
 * Honest state preserved throughout:
 *   finalStatus = "APPROVED CANDIDATE FOR CONTROLLED TESTING —
 *                  NOT PRODUCTION-AUTHORIZED"
 *   honest=true, productionAuthorized=false, v25_0_Frozen=true
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
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
  Layers,
  Network,
  RefreshCw,
  AlertOctagon,
  Users,
  FlaskConical,
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

interface CorporateEntity {
  entityId: string;
  name: string;
  type: string;
  children?: string[];
  responsibilities: string[];
  cannotDo: string[];
  legalStatus?: string;
}

interface TestScenario {
  testId: string;
  description: string;
  category: string;
  expectedResult: string;
  status: string;
}

interface AuthorityMatrixRow {
  func: string;
  foundation: string;
  holding: string;
  operatingCo: string;
  techCo: string;
  bank: string;
  custodian: string;
  centralBankRegulator: string;
}

interface AcceptanceCriterion {
  id: string;
  criterion: string;
  met: boolean;
  evidence: string;
}

interface FVInvariant {
  name: string;
  statement: string;
  status: string;
  crossReference?: string;
}

interface FinalIntegratedReport {
  moduleId: string;
  architectureVersion: string;
  blueprintDesignation: string;
  corporateStructure: CorporateEntity[];
  corporateEntityCount: number;
  mtq7LayerModel: Record<string, string>;
  dmceFormula: string;
  dmceComponentDefinitions: Record<string, string>;
  dmceRule: string;
  fv11ThroughFv25: Record<string, FVInvariant>;
  fvInvariantCount: number;
  fvNewInvariantCount: number;
  testScenarios: TestScenario[];
  testScenarioCount: number;
  apiEndpoints: string[];
  authorityMatrix: AuthorityMatrixRow[];
  authorityMatrixRowCount: number;
  acceptanceCriteria: AcceptanceCriterion[];
  acceptanceCriteriaCount: number;
  acceptanceCriteriaMet: number;
  honestState: {
    honest: boolean;
    forcedToPass: boolean;
    productionAuthorized: boolean;
    nonCustodialByDefault: boolean;
    v25_0_Frozen: boolean;
    noV25_1Created: boolean;
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
  if (s === "DESIGNED") {
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
      {status}
    </Badge>
  );
}

function testStatusBadge(status: string) {
  const s = status.toUpperCase();
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

function authorityCell(value: string) {
  const v = (value || "").toUpperCase();
  if (v === "EXECUTE" || v === "AUTHORIZE") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        {value}
      </span>
    );
  }
  if (v === "STEWARD" || v === "VERIFY" || v === "MONITOR") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-700 dark:text-amber-300">
        <ShieldCheck className="h-3 w-3" />
        {value}
      </span>
    );
  }
  if (v === "NONE" || v === "BLOCKED") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
        <XCircle className="h-3 w-3" />
        {value}
      </span>
    );
  }
  return <span className="font-mono text-xs text-muted-foreground">{value}</span>;
}

export function FinalIntegratedArchitectureDashboard() {
  const [report, setReport] = useState<FinalIntegratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/final-integrated-architecture");
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
            <span>Loading Final Integrated Architecture dashboard...</span>
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
                Final Integrated Architecture dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the Final Integrated Architecture report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  const fvEntries = Object.entries(report.fv11ThroughFv25 || {});
  const dmceComponents = Object.entries(report.dmceComponentDefinitions || {});
  const acceptancePct =
    report.acceptanceCriteriaCount > 0
      ? Math.round((report.acceptanceCriteriaMet / report.acceptanceCriteriaCount) * 100)
      : 0;

  return (
    <section
      id="final-integrated-architecture-dashboard"
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
            <Scale className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Final Integrated{" "}
              <span className="gold-text">Architecture</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The §V25.0.D final integrated reconciliation: 5 corporate entities, a
            7-layer MTQ settlement stack, the Dynamic Minting Capacity Engine
            (DMCE), 15 formal verification invariants (FV11–FV25), 35 integrated
            test scenarios, 12 /gateway/v1/* endpoints, a 7×18 authority matrix,
            and 44 acceptance criteria — all met at the spec level only.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              {report.architectureVersion}
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Production-authorized: NO
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Non-custodial by default
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <Users className="mr-1 h-3 w-3" />
              {report.corporateEntityCount} entities
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <FileCheck className="mr-1 h-3 w-3" />
              {report.acceptanceCriteriaMet}/{report.acceptanceCriteriaCount} AC met
            </Badge>
          </div>
        </motion.div>

        {/* Honest-state callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    Honest State Declaration
                  </p>
                  <p className="text-muted-foreground">
                    {report.finalStatus}. The architecture is{" "}
                    <strong>FROZEN</strong> at v25.0 — no v25.1, no v26, no fork.
                    All 44 acceptance criteria are met at the logic / spec level
                    only. No real-world production authorization has been
                    granted.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    honest={String(report.honestState.honest)} ·{" "}
                    forcedToPass={String(report.honestState.forcedToPass)} ·{" "}
                    productionAuthorized=
                    {String(report.honestState.productionAuthorized)} ·{" "}
                    v25_0_Frozen={String(report.honestState.v25_0_Frozen)} ·{" "}
                    noV25_1Created={String(report.honestState.noV25_1Created)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §2 5 Corporate Entities */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold">
              5 Corporate Entities — Separation of Powers
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.corporateStructure.map((entity) => (
              <Card key={entity.entityId} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{entity.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
                    >
                      {entity.type}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {entity.entityId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-xs">
                  <div>
                    <p className="mb-1 font-semibold text-foreground">
                      Responsibilities
                    </p>
                    <ul className="max-h-32 space-y-1 overflow-y-auto pr-1 text-muted-foreground">
                      {entity.responsibilities.slice(0, 5).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-foreground">Cannot Do</p>
                    <ul className="max-h-32 space-y-1 overflow-y-auto pr-1 text-muted-foreground">
                      {entity.cannotDo.slice(0, 4).map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {entity.legalStatus && (
                    <p className="text-xs text-muted-foreground">
                      Legal status:{" "}
                      <span className="font-mono text-amber-700 dark:text-amber-300">
                        {entity.legalStatus}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §3 7-Layer MTQ Model + DMCE */}
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
                  <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  7-Layer MTQ Settlement Model
                </CardTitle>
                <CardDescription>
                  Sovereign → Bank money → MBG sidecar → MITHQAL core → MTQ → receiving
                  MBG → receiving bank
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(report.mtq7LayerModel || {}).map(([layer, desc]) => (
                    <div
                      key={layer}
                      className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/30 p-2.5"
                    >
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {layer}
                      </span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
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
            <Card className="h-full border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  DMCE — Dynamic Minting Capacity Engine
                </CardTitle>
                <CardDescription>
                  Capacity is the MINIMUM of 8 institutional limits — FV18 enforces
                  banks cannot mint outside DMCE.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="font-mono text-xs text-amber-800 dark:text-amber-200">
                    {report.dmceFormula}
                  </p>
                </div>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-2">
                  {dmceComponents.map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded border border-border/40 bg-muted/20 px-2 py-1.5"
                    >
                      <p className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {k}
                      </p>
                      <p className="text-xs text-muted-foreground">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs italic text-muted-foreground">
                  {report.dmceRule.slice(0, 220)}
                  {report.dmceRule.length > 220 ? "…" : ""}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* §4 FV11-FV25 Invariants */}
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
                FV11–FV25 — 15 Formal Verification Invariants
              </CardTitle>
              <CardDescription>
                7 cross-referenced from §V25.0.C + {report.fvNewInvariantCount} new
                (FV18-FV25). Each is PROVEN_AT_SPEC_LEVEL or DESIGNED.
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

        {/* §5 35 Test Scenarios */}
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
                <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                35 Integrated Test Scenarios (INT-T01..INT-T35)
              </CardTitle>
              <CardDescription>
                9 categories: RESERVE / REBALANCING / BANKING / CUSTODY / MINTING /
                FAILURE / REDEMPTION / GOVERNANCE / FOUNDATION.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-1.5 overflow-y-auto pr-2">
                {report.testScenarios.map((t) => (
                  <div
                    key={t.testId}
                    className="flex items-start gap-3 rounded border border-border/40 bg-muted/20 p-2.5"
                  >
                    <div className="flex w-24 shrink-0 flex-col gap-1">
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {t.testId}
                      </span>
                      <Badge
                        variant="outline"
                        className="w-fit border-border/60 text-xs"
                      >
                        {t.category}
                      </Badge>
                    </div>
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

        {/* §6 12 API Endpoints */}
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
                <Network className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                12 Versioned API Endpoints — /gateway/v1/*
              </CardTitle>
              <CardDescription>
                All endpoints require authentication, authorization, signed requests,
                idempotency, timestamp, expiry, and replay protection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {report.apiEndpoints.map((ep) => (
                  <div
                    key={ep}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/40 p-2.5"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-mono text-xs break-all">{ep}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §7 Authority Matrix 7 × 18 */}
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
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Authority Matrix — {report.authorityMatrixRowCount} Functions × 7 Actors
              </CardTitle>
              <CardDescription>
                No function may have ambiguous ownership. EXECUTE / AUTHORIZE =
                emerald, STEWARD / VERIFY / MONITOR = amber, NONE = muted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">Function</TableHead>
                      <TableHead>Foundation</TableHead>
                      <TableHead>Holding</TableHead>
                      <TableHead>Operating Co</TableHead>
                      <TableHead>Tech Co</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Custodian</TableHead>
                      <TableHead>CB / Regulator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.authorityMatrix.map((row) => (
                      <TableRow key={row.func}>
                        <TableCell className="sticky left-0 bg-card font-medium">
                          {row.func}
                        </TableCell>
                        <TableCell>{authorityCell(row.foundation)}</TableCell>
                        <TableCell>{authorityCell(row.holding)}</TableCell>
                        <TableCell>{authorityCell(row.operatingCo)}</TableCell>
                        <TableCell>{authorityCell(row.techCo)}</TableCell>
                        <TableCell>{authorityCell(row.bank)}</TableCell>
                        <TableCell>{authorityCell(row.custodian)}</TableCell>
                        <TableCell>{authorityCell(row.centralBankRegulator)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §8 44 Acceptance Criteria */}
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
                <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                44 Acceptance Criteria — Spec-Level Closure
              </CardTitle>
              <CardDescription>
                {report.acceptanceCriteriaMet}/{report.acceptanceCriteriaCount} criteria
                met at logic / spec level only. Real-world production authorization is
                NOT granted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Spec-level closure progress
                  </span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                    {report.acceptanceCriteriaMet}/{report.acceptanceCriteriaCount} ({acceptancePct}%)
                  </span>
                </div>
                <Progress value={acceptancePct} className="h-2" />
              </div>
              <div className="max-h-96 space-y-1.5 overflow-y-auto pr-2">
                {report.acceptanceCriteria.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded border border-border/40 bg-muted/20 p-2.5"
                  >
                    <span className="w-16 shrink-0 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {c.id}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{c.criterion}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Evidence: {c.evidence}
                      </p>
                    </div>
                    {c.met ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                ))}
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
                    Final Status — §V25.0.D Closing
                  </p>
                  <p className="text-muted-foreground italic">
                    &ldquo;{report.finalStatus}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Module: {report.moduleId} · Designation:{" "}
                    {report.blueprintDesignation}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    v25.0 remains the FROZEN NORMATIVE ARCHITECTURE. No v25.1 created,
                    no architecture fork, no reserve math redesign, no competing
                    rebalancing algorithm, USD not turned into monetary anchor,
                    MITHQAL not made custodian or bank, Foundation not made operator,
                    reserve appreciation not made commercial profit source.
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
