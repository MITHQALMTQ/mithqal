"use client";

/* ============================================================
 * SCDeploymentClosureDashboard — §V25.0.A
 * ------------------------------------------------------------
 * Task ID: UI-GAP-ANALYSIS-DASHBOARDS
 *
 * Renders the §V25.0.A Smart-Contract Deployment Closure report
 * — the 7-of-8 prompt that closes the v25.0 SC remediation series.
 *
 * Sections:
 *   - Verdict: BLOCKED — TESTNET-READY WITH CRITICAL GAPS (RED)
 *   - 37-row inventory matrix (by contract / by risk / by status)
 *   - 9 verification categories (128 tests · 114 passed · 14 blocked · 0 failed)
 *   - 28 bytecode certificates (by chain: monad / arc / anvil / solana)
 *   - 5 supply certification properties (all CERTIFIED)
 *   - 6 quarantined contracts (incl. Solana NON_CANONICAL)
 *   - 9 deployment gates (0 PRODUCTION · 2 BLOCKED · 7 TESTNET)
 *   - 10-stage release train (progress diagram)
 *   - Acceptance criteria (9 honest criteria)
 *
 * Data provenance: /api/contract/deployment-closure →
 *   src/lib/sc-deployment-closure.ts
 *
 * Honest state preserved throughout:
 *   honest=true, forced_to_pass=false, productionAuthorized=false,
 *   productionEligibleContracts=0, testnetAuthorized=true,
 *   quarantinedCount=0, blockedCount=2
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
  Ban,
  Database,
  Layers,
  FlaskConical,
  Rocket,
  ListChecks,
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

interface InventoryChange {
  changeId: string;
  contract: string;
  currentDeployedVersion: string;
  requiredV25Version: string;
  difference: string;
  risk: string;
  test: string;
  verification: string;
  deploymentStatus: string;
}

interface VerificationCategory {
  category: string;
  totalTests: number;
  passed: number;
  failed: number;
  blocked: number;
  evidenceDocument: string;
  status: string;
}

interface BytecodeCertificate {
  certificateId: string;
  chain: string;
  network: string;
  contractAddress: string;
  bytecodeHash: string;
  sourceVersion: string;
  compilerVersion: string;
  verificationStatus: string;
}

interface SupplyCertProperty {
  property: string;
  description: string;
  proof: string;
  status: string;
  evidence: string;
}

interface QuarantinedContract {
  contractName: string;
  chain: string;
  address: string;
  quarantineReason: string;
  quarantineStatus: string;
  nonCanonicalFlag: boolean;
  replacementPlan: string;
}

interface DeploymentGate {
  contractName: string;
  conditions: {
    sourceVerified: boolean;
    bytecodeVerified: boolean;
    formalPropertiesPass: boolean;
    deploymentRecorded: boolean;
    independentAuditStatus: string;
  };
  gateStatus: string;
  gateReason: string;
}

interface SCReport {
  generatedAt: string;
  moduleId: string;
  standingBlocker: string;
  inventory: {
    totalChanges: number;
    changes: InventoryChange[];
  };
  implementation: {
    total: number;
    implemented: number;
    pending: number;
    honestNote: string;
  };
  verification: {
    categories: VerificationCategory[];
    totals?: { totalTests: number; passed: number; failed: number; blocked: number };
    overall?: string;
  };
  bytecodeRegistry: {
    totalCertificates: number;
    certificates: BytecodeCertificate[];
    counts?: {
      byChain?: Record<string, number>;
      byVerificationStatus?: Record<string, number>;
    };
    honestNote?: string;
  };
  supplyCertification: {
    totalProperties: number;
    properties: SupplyCertProperty[];
  };
  quarantined: {
    count: number;
    contracts: QuarantinedContract[];
  };
  deploymentGates: {
    totalGates: number;
    gates: DeploymentGate[];
  };
  fvInvariants: Record<string, string>;
  finalCertification: {
    moduleId?: string;
    summary?: string;
    standingBlocker?: string;
    inventory?: {
      totalChanges?: number;
      byContract?: Record<string, number>;
      byRisk?: Record<string, number>;
      byDeploymentStatus?: Record<string, number>;
    };
    implementation?: { implemented: number; pending: number; honestNote?: string };
    verification?: {
      categories?: VerificationCategory[];
      totals?: { totalTests: number; passed: number; failed: number; blocked: number };
      overall?: string;
    };
    finalVerdict?: {
      label: string;
      color: string;
      explanation: string;
      nextActions: string[];
    };
  };
  honest: boolean;
  forced_to_pass: boolean;
  productionAuthorized: boolean;
  productionEligibleContracts: number;
  testnetAuthorized: boolean;
  quarantinedCount: number;
  blockedCount: number;
  acceptance: Record<string, boolean>;
}

function riskBadge(risk: string) {
  const r = (risk || "").toUpperCase();
  if (r === "CRITICAL") {
    return (
      <Badge
        variant="outline"
        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
      >
        <AlertTriangle className="mr-1 h-3 w-3" />
        {risk}
      </Badge>
    );
  }
  if (r === "HIGH") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
      >
        <Activity className="mr-1 h-3 w-3" />
        {risk}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {risk}
    </Badge>
  );
}

function deploymentStatusBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "QUARANTINED") {
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
  if (s === "IN_PROGRESS") {
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
  if (s === "NOT_STARTED") {
    return (
      <Badge
        variant="outline"
        className="border-border/60 text-muted-foreground text-xs"
      >
        <XCircle className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  if (s === "TESTNET") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
      >
        <Activity className="mr-1 h-3 w-3" />
        TESTNET
      </Badge>
    );
  }
  if (s === "BLOCKED") {
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
  if (s === "PRODUCTION") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        PRODUCTION
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

function verificationStatusBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PASSED") {
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
  if (s === "FAILED" || s === "BLOCKED") {
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
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

const CHAIN_COLORS: Record<string, string> = {
  "monad-testnet": "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "arc-testnet": "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "anvil-local": "border-border/60 bg-muted/40 text-muted-foreground",
  "solana-devnet": "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function SCDeploymentClosureDashboard() {
  const [report, setReport] = useState<SCReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/contract/deployment-closure");
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
            <span>Loading SC Deployment Closure dashboard...</span>
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
                SC Deployment Closure dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the SC Deployment Closure report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  // Pull from finalCertification when present (more compact aggregated form),
  // otherwise aggregate from the top-level arrays.
  const fc = report.finalCertification || {};
  const inventoryAgg = fc.inventory || {};
  const byContract = inventoryAgg.byContract || {};
  const byRisk = inventoryAgg.byRisk || {};
  const byStatus = inventoryAgg.byDeploymentStatus || {};

  const verificationCategories = report.verification?.categories || [];
  const verificationTotals =
    report.verification?.totals ||
    fc.verification?.totals || {
      totalTests: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
    };

  const certificates = report.bytecodeRegistry?.certificates || [];
  const byChain =
    report.bytecodeRegistry?.counts?.byChain ||
    certificates.reduce<Record<string, number>>((acc, c) => {
      acc[c.chain] = (acc[c.chain] || 0) + 1;
      return acc;
    }, {});

  const supplyProps = report.supplyCertification?.properties || [];
  const quarantined = report.quarantined?.contracts || [];
  const deploymentGates = report.deploymentGates?.gates || [];
  const finalVerdict = fc.finalVerdict || {
    label: "BLOCKED — TESTNET-READY WITH CRITICAL GAPS",
    color: "RED",
    explanation: report.inventory?.totalChanges
      ? `${report.inventory.totalChanges} changes pending external audit.`
      : "Pending.",
    nextActions: [],
  };

  // 10-stage release train: combine the 9 nextActions + 1 final "production authorization (BLOCKED)" stage
  const releaseTrainStages = [
    ...(finalVerdict.nextActions || []).slice(0, 9),
    "Production authorization — BLOCKED until all standing blockers resolved.",
  ].slice(0, 10);

  const acceptanceMet = Object.values(report.acceptance || {}).filter(Boolean).length;
  const acceptanceTotal = Object.keys(report.acceptance || {}).length;

  return (
    <section
      id="sc-deployment-closure-dashboard"
      className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* §1 Header + Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <Cpu className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Smart-Contract Deployment{" "}
              <span className="gold-text">Closure</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The §V25.0.A 7-of-8 prompt: 37 v25.0 SC changes are IMPLEMENTED at the
            logic level — DEPLOYED BYTECODE remains PENDING because external auditor
            sign-off (Standing Blocker #9 — NOT_STARTED) has not been obtained.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <Ban className="mr-1 h-3 w-3" />
              {finalVerdict.label}
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
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <Activity className="mr-1 h-3 w-3" />
              Testnet authorized: YES
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <FileCheck className="mr-1 h-3 w-3" />
              {report.inventory.totalChanges} SC changes
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <Database className="mr-1 h-3 w-3" />
              {report.bytecodeRegistry.totalCertificates} bytecode certs
            </Badge>
          </div>
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mr-1 inline h-4 w-4 text-red-600 dark:text-red-400" />
            {finalVerdict.explanation}
          </div>
        </motion.div>

        {/* Honest state callout */}
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
                  <p className="text-muted-foreground">{fc.summary || ""}</p>
                  <p className="text-xs text-muted-foreground">
                    honest={String(report.honest)} · forced_to_pass=
                    {String(report.forced_to_pass)} · productionAuthorized=
                    {String(report.productionAuthorized)} · productionEligibleContracts=
                    {report.productionEligibleContracts} · blockedCount=
                    {report.blockedCount} · quarantinedCount={report.quarantinedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Standing blocker:{" "}
                    <span className="font-mono text-red-700 dark:text-red-300">
                      {report.standingBlocker}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §2 37-Row Inventory Matrix */}
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
                <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                37-Row Inventory Matrix — by Contract / Risk / Deployment Status
              </CardTitle>
              <CardDescription>
                Implementation: {report.implementation.implemented} IMPLEMENTED ·{" "}
                {report.implementation.pending} PENDING (external-dependency blocked).
                Neither status means &ldquo;deployed bytecode.&rdquo;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    By Contract
                  </p>
                  <div className="space-y-1">
                    {Object.entries(byContract).map(([contract, count]) => (
                      <div
                        key={contract}
                        className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2 py-1"
                      >
                        <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
                          {contract}
                        </span>
                        <span className="font-mono text-xs font-semibold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    By Risk
                  </p>
                  <div className="space-y-1">
                    {Object.entries(byRisk).map(([risk, count]) => (
                      <div
                        key={risk}
                        className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2 py-1"
                      >
                        <span className="flex items-center gap-2">
                          {riskBadge(risk)}
                        </span>
                        <span className="font-mono text-xs font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    By Deployment Status
                  </p>
                  <div className="space-y-1">
                    {Object.entries(byStatus).map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2 py-1"
                      >
                        <span className="flex items-center gap-2">
                          {deploymentStatusBadge(status)}
                        </span>
                        <span className="font-mono text-xs font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Implementation honest note: </span>
                {report.implementation.honestNote}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §3 9 Verification Categories */}
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
                <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                9 Verification Categories — {verificationTotals.totalTests} tests ·{" "}
                {verificationTotals.passed} passed · {verificationTotals.blocked}{" "}
                blocked · {verificationTotals.failed} failed
              </CardTitle>
              <CardDescription>
                Overall: {report.verification?.overall || fc.verification?.overall}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Passed</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead className="text-center">Blocked</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationCategories.map((v) => (
                      <TableRow key={v.category}>
                        <TableCell className="font-medium text-xs">
                          {v.category}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {v.totalTests}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-emerald-700 dark:text-emerald-300">
                          {v.passed}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-red-700 dark:text-red-300">
                          {v.failed}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-amber-700 dark:text-amber-300">
                          {v.blocked}
                        </TableCell>
                        <TableCell>{verificationStatusBadge(v.status)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-amber-500/40 bg-amber-500/5">
                      <TableCell className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {verificationTotals.totalTests}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {verificationTotals.passed}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-red-700 dark:text-red-300">
                        {verificationTotals.failed}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-amber-700 dark:text-amber-300">
                        {verificationTotals.blocked}
                      </TableCell>
                      <TableCell>
                        {verificationStatusBadge(
                          report.verification?.overall || "PARTIAL",
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §4 28 Bytecode Certificates — by chain */}
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
                <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                28 Bytecode Certificates — by Chain
              </CardTitle>
              <CardDescription>
                27 EVM (source+bytecode verified) + 1 Solana (QUARANTINED). All
                certificates document the v24.2.1-deployed bytes — NOT the v25.0
                target bytes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(byChain).map(([chain, count]) => (
                  <div
                    key={chain}
                    className={`rounded-lg border-2 p-4 ${
                      CHAIN_COLORS[chain] || "border-border/60 bg-muted/40"
                    }`}
                  >
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider">
                      {chain}
                    </p>
                    <p className="mt-1 text-3xl font-bold">{count}</p>
                    <p className="text-xs opacity-80">
                      {chain === "solana-devnet"
                        ? "QUARANTINED / NON_CANONICAL"
                        : "Source + bytecode verified"}
                    </p>
                  </div>
                ))}
              </div>
              {report.bytecodeRegistry.honestNote && (
                <p className="mt-3 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  {report.bytecodeRegistry.honestNote}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* §5 5 Supply Certification Properties */}
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
                5 Supply Certification Properties — ALL CERTIFIED
              </CardTitle>
              <CardDescription>
                Theorem S1 (single canonical supply), S2 (no unrecognized mint), S3
                (bridge cannot inflate). Verified per
                docs/verification/v24.2.1-anti-double-counting-proof.md.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {supplyProps.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {p.property}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Proof: <span className="font-mono">{p.proof}</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §6 6 Quarantined Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-semibold">
              {quarantined.length} Quarantined Contracts — Including Solana NON_CANONICAL
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quarantined.map((q, i) => (
              <Card
                key={i}
                className={`flex flex-col ${
                  q.nonCanonicalFlag
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{q.contractName}</CardTitle>
                    {q.nonCanonicalFlag ? (
                      <Badge
                        variant="outline"
                        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
                      >
                        NON_CANONICAL
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
                      >
                        {q.quarantineStatus}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {q.chain} · {q.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-xs">
                  <p className="text-muted-foreground">{q.quarantineReason}</p>
                  <p className="rounded border border-border/40 bg-muted/20 p-2">
                    <span className="font-semibold text-foreground">
                      Replacement plan:{" "}
                    </span>
                    {q.replacementPlan}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §7 9 Deployment Gates */}
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
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                9 Deployment Gates — 0 PRODUCTION · {report.blockedCount} BLOCKED ·{" "}
                {deploymentGates.length - report.blockedCount} TESTNET
              </CardTitle>
              <CardDescription>
                Each gate has 5 conditions: source verified · bytecode verified ·
                formal properties pass · deployment recorded · independent audit
                status. No contract is promotion-eligible until all 5 pass.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead className="text-center">Src ✓</TableHead>
                      <TableHead className="text-center">Byte ✓</TableHead>
                      <TableHead className="text-center">Formal ✓</TableHead>
                      <TableHead className="text-center">Recorded ✓</TableHead>
                      <TableHead>Audit</TableHead>
                      <TableHead className="w-28">Gate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deploymentGates.map((g) => (
                      <TableRow key={g.contractName}>
                        <TableCell className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {g.contractName}
                        </TableCell>
                        <TableCell className="text-center">
                          {g.conditions.sourceVerified ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {g.conditions.bytecodeVerified ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {g.conditions.formalPropertiesPass ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {g.conditions.deploymentRecorded ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {g.conditions.independentAuditStatus}
                        </TableCell>
                        <TableCell>{deploymentStatusBadge(g.gateStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §8 10-Stage Release Train */}
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
                <Rocket className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                10-Stage Release Train — Progress Diagram
              </CardTitle>
              <CardDescription>
                The ordered sequence from external audit engagement to production
                authorization. Each stage requires the previous one to complete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {releaseTrainStages.map((stage, i) => {
                  const isFinal = i === releaseTrainStages.length - 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold ${
                          isFinal
                            ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
                            : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div
                        className={`flex-1 rounded-md border px-3 py-2 text-xs ${
                          isFinal
                            ? "border-red-500/40 bg-red-500/5 text-red-800 dark:text-red-200"
                            : "border-border/40 bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {stage}
                        {isFinal && (
                          <span className="ml-2 inline-flex items-center gap-1 align-middle">
                            <Ban className="h-3 w-3" />
                            <span className="font-mono font-semibold">BLOCKED</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §9 Acceptance Criteria */}
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
                Acceptance Criteria — {acceptanceMet}/{acceptanceTotal} Passed
              </CardTitle>
              <CardDescription>
                All acceptance criteria pass at the gate-evaluation level. NO contract
                is PRODUCTION-authorized. NO contract is promotion-eligible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {Object.entries(report.acceptance || {}).map(([k, v]) => (
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
                    Honest State Declaration — §V25.0.A 7-of-8
                  </p>
                  <p className="text-muted-foreground italic">
                    &ldquo;{finalVerdict.label}&rdquo; (color: {finalVerdict.color})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Module: {report.moduleId} · Standing blocker:{" "}
                    {report.standingBlocker} · honest={String(report.honest)} ·
                    forced_to_pass={String(report.forced_to_pass)} ·
                    productionAuthorized={String(report.productionAuthorized)} ·
                    productionEligibleContracts=
                    {report.productionEligibleContracts}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The MITHQAL smart-contract layer is architecturally complete at
                    the spec level — all 37 v25.0 changes have logic-level
                    implementations recorded. However, the deployed bytecode remains
                    v24.2.1. NO contract is PRODUCTION-authorized. Promote-to-production
                    count = 0. External auditor sign-off is the single largest
                    unaddressed operational gap.
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
