"use client";

/* ============================================================
 * MBGDashboard — MITHQAL v25.0 FINAL ARCHITECTURAL AMENDMENT
 * ------------------------------------------------------------
 * Task ID: MBG-FINAL-ARCHITECTURAL-AMENDMENT
 *
 * Institutional Bank Gateway Dashboard — surfaces the canonical
 * architecture of the MITHQAL Bank Gateway (MBG) sidecar amendment.
 *
 * Layout (12 sections per §29 of the amendment prompt):
 *   §1   Header + integration state badge (INTEGRATION-READY / AMBER)
 *   §2   Gateway Status (3 SIMULATED gateways)
 *   §3   Connectivity (MSAS adapter standard, 7 connector classes)
 *   §4   Pending Instructions (canonical MTQSettlementInstruction fields)
 *   §5   Settlements (13 MTQ status events)
 *   §6   Reconciliation (5-way reconciliation states)
 *   §7   MTQ Position (BankMTQSubledger architecture)
 *   §8   Compliance Attestations (7 assertions)
 *   §9   JSG Status (jurisdictional rules)
 *   §10  Incidents (gateway + MITHQAL failure handling)
 *   §11  Limits (deployment models + connectivity security)
 *   §12  Audit & DR Status (honest state, ROI, recommended next actions)
 *
 * Theming: reuses institutional palette tokens (gold, ink, line).
 * Green = passed/verified, amber = conditional/integration-ready,
 * red = blocked/fail. NO indigo/blue.
 *
 * Data provenance: fetched from /api/bank-gateway (GET) which calls
 * generateMBGExecutiveReport() in src/lib/mithqal-bank-gateway.ts.
 *
 * HONEST STATE:
 *   Integration state = INTEGRATION-READY (NOT BANK-CONTRACTED)
 *   Banks contracted = 0
 *   All 20 tests = SIMULATED (no real bank yet)
 *   All 18 acceptance criteria = met at logic/spec level only
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Network,
  Building2,
  Lock,
  Scale,
  Boxes,
  Flame,
  ArrowRight,
  Cpu,
  Zap,
  FileCheck,
  RefreshCw,
  AlertOctagon,
  TrendingUp,
  DollarSign,
  Server,
  KeyRound,
  Eye,
  Globe,
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

interface MBGReport {
  moduleId: string;
  integrationState: string;
  honestState: {
    banksContracted: number;
    banksLivePilot: number;
    realBankIntegrations: number;
    honest: boolean;
    forcedToPass: boolean;
    noFalseZeroIntegrationClaim: boolean;
    noFalseBankIntegrationClaim: boolean;
  };
  tests: Array<{
    testId: string;
    description: string;
    category: string;
    expectedResult: string;
    status: string;
    evidence: string;
  }>;
  acceptanceCriteria: Array<{
    criterionId: string;
    criterion: string;
    met: boolean;
    evidence: string;
  }>;
  apiEndpoints: Array<{
    path: string;
    method: string;
    description: string;
    requiresIdempotency: boolean;
    requiresSignedMessage: boolean;
  }>;
  deploymentModels: Array<{
    modelId: string;
    name: string;
    description: string;
    defaultPreference: boolean;
  }>;
  adapters: {
    msasStandard?: {
      supportedConnectorClasses?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  connectorClasses?: string[];
  banksContracted?: number;
  integrationCostSummary: Record<
    string,
    {
      bankSize: string;
      totalOneTime: number;
      annualRecurring: number;
      estimatedImplementationWeeks: number;
      integrationDepth: string;
      coreBankingReplacementRequired: boolean;
    }
  >;
  roiSummary: Record<
    string,
    {
      bankSize: string;
      paybackPeriodMonths: number;
      roiPercent: number;
      npv5Year: number;
      breakEvenVolumeMonthly: number;
    }
  > & { sampleMonthlyVolumesUSD?: Record<string, number> };
  recommendedNextActions: string[];
  finalArchitectureDiagram: string;
  acceptance: Record<string, boolean>;
}

export function MBGDashboard() {
  const [report, setReport] = useState<MBGReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bank-gateway");
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
            <span>Loading MBG dashboard...</span>
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
                MBG Dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the MITHQAL Bank Gateway report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  const testsPassed = report.tests.filter((t) => t.status === "PASS").length;
  const testsSimulated = report.tests.filter((t) => t.status === "SIMULATED").length;
  const acceptanceMet = report.acceptanceCriteria.filter((c) => c.met).length;
  const banksContracted = report.honestState?.banksContracted ?? report.banksContracted ?? 0;
  const costModels = Object.values(report.integrationCostSummary || {}).filter(
    (v): v is { bankSize: string; totalOneTime: number; annualRecurring: number; estimatedImplementationWeeks: number; integrationDepth: string; coreBankingReplacementRequired: boolean } =>
      typeof v === "object" && v !== null && "bankSize" in v,
  );
  const roiModels = Object.values(report.roiSummary || {}).filter(
    (v): v is { bankSize: string; paybackPeriodMonths: number; roiPercent: number; npv5Year: number; breakEvenVolumeMonthly: number } =>
      typeof v === "object" && v !== null && "bankSize" in v,
  );

  return (
    <section
      id="mbg-dashboard"
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
            <Landmark className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              MITHQAL Bank Gateway{" "}
              <span className="gold-text">Dashboard</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The strategic final architectural amendment:{" "}
            <em>&ldquo;TRANSLATION, NOT TRANSFORMATION.&rdquo;</em> Banks connect
            through a standardized sidecar/adapter that converts existing
            authorized banking instructions into MTQ settlement instructions —
            without replacing core banking systems.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <Activity className="mr-1 h-3 w-3" />
              {report.integrationState}
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Banks contracted: {String(banksContracted)}
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Acceptance: {acceptanceMet}/{report.acceptanceCriteria.length}
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <FileCheck className="mr-1 h-3 w-3" />
              Tests: {report.tests.length} (all SIMULATED)
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <Network className="mr-1 h-3 w-3" />
              {report.apiEndpoints.length} API endpoints
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
                    The MBG amendment is{" "}
                    <strong>INTEGRATION-READY</strong> at the spec level — all
                    20 required tests are SIMULATED, all 18 acceptance criteria
                    are met at the logic/spec level only. No real bank has
                    completed integration. No false &ldquo;zero
                    integration&rdquo; claim is made — this is{" "}
                    <em>minimal integration</em>, not zero integration.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Canonical principle: MITHQAL never asks banks to replace
                    core banking systems. Banks remain the authoritative
                    customer, compliance, treasury, accounting and security
                    environment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §2-§3 Gateway + Connectivity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Gateway Status
              </CardTitle>
              <CardDescription>
                3 SIMULATED gateway instances across deployment models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  // API returns deploymentModels as an object keyed by model ID
                  const dmArr: Array<{ modelId: string; name: string; description: string; defaultPreference: boolean; bankPreference?: string }> = [];
                  if (report.deploymentModels && Array.isArray(report.deploymentModels) && report.deploymentModels.length > 0) {
                    dmArr.push(...report.deploymentModels);
                  } else if (report.deploymentModels && typeof report.deploymentModels === "object") {
                    for (const [k, v] of Object.entries(report.deploymentModels as unknown as Record<string, { name?: string; description?: string; bankPreference?: string }>)) {
                      if (v && typeof v === "object" && (v.name || v.description)) {
                        dmArr.push({
                          modelId: k,
                          name: v.name ?? k,
                          description: v.description ?? "",
                          defaultPreference: v.bankPreference === "DEFAULT",
                          bankPreference: v.bankPreference,
                        });
                      }
                    }
                  }
                  if (dmArr.length === 0) {
                    dmArr.push(
                      { modelId: "MODEL_A_BANK_HOSTED", name: "Bank Hosted", description: "Gateway deployed inside bank-controlled infrastructure", defaultPreference: true },
                      { modelId: "MODEL_B_BANK_SECURED_PRIVATE", name: "Bank-Secured Private", description: "Gateway deployed in bank-approved isolated environment", defaultPreference: true },
                      { modelId: "MODEL_C_APPROVED_MANAGED", name: "Approved Managed", description: "Gateway operated by approved provider under strict institutional controls", defaultPreference: false },
                    );
                  }
                  return dmArr.map((m) => (
                    <div
                      key={m.modelId}
                      className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {m.modelId}
                          </span>
                          {m.defaultPreference && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                            >
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.description}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Network className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Connectivity — MSAS Adapter Standard
              </CardTitle>
              <CardDescription>
                {report.adapters?.msasStandard?.supportedConnectorClasses?.length
                  ?? report.connectorClasses?.length
                  ?? 7} bank-specific connector classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(() => {
                  const cls = report.adapters?.msasStandard?.supportedConnectorClasses
                    ?? report.connectorClasses
                    ?? ["ISO_20022", "BANK_REST_API", "HOST_TO_HOST", "SECURE_FILE_EXCHANGE_SFTP", "EXISTING_PAYMENT_GATEWAY", "TREASURY_SYSTEM", "CORPORATE_ERP_CONNECTIVITY"];
                  return cls.map((c: string) => (
                    <div
                      key={c}
                      className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/40 p-2"
                    >
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs">{c}</span>
                    </div>
                  ));
                })()}
              </div>
              <div className="mt-4 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">
                  Architecture
                </p>
                BANK-SPECIFIC CONNECTOR → MSAS STANDARD FORMAT → MTQ
                SETTLEMENT INSTRUCTION → MITHQAL CORE
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §4-§5 Instructions + Status Events */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Pending Instructions
              </CardTitle>
              <CardDescription>
                MTQSettlementInstruction canonical object (22 fields)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-2 text-xs">
                {[
                  "instructionId",
                  "institutionId",
                  "originBankId",
                  "destinationBankId",
                  "corporateReference",
                  "customerAuthorizationReference",
                  "amount",
                  "settlementCurrency",
                  "mtqAmount",
                  "transactionPurpose",
                  "jurisdiction",
                  "corridor",
                  "complianceAttestation",
                  "sanctionsStatus",
                  "policyVersion",
                  "liquidityStatus",
                  "reserveReference",
                  "timestamp",
                  "expiry",
                  "finalityState",
                  "cryptographicSignature",
                  "idempotencyKey",
                  "bankTransactionReference",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-2 py-1"
                  >
                    <span className="font-mono text-amber-700 dark:text-amber-300">
                      {f}
                    </span>
                    <span className="text-muted-foreground">field</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Settlements — MTQ Status Events
              </CardTitle>
              <CardDescription>
                13 bank-consumable status events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-2 text-xs">
                {[
                  { s: "RECEIVED", c: "amber" },
                  { s: "AUTHORIZED", c: "amber" },
                  { s: "COMPLIANCE_VERIFIED", c: "amber" },
                  { s: "ISSUANCE_PENDING", c: "amber" },
                  { s: "ISSUED", c: "amber" },
                  { s: "SETTLEMENT_PENDING", c: "amber" },
                  { s: "SETTLED", c: "emerald" },
                  { s: "REDEMPTION_PENDING", c: "amber" },
                  { s: "REDEEMED", c: "emerald" },
                  { s: "COMPLETED", c: "emerald" },
                  { s: "BLOCKED", c: "red" },
                  { s: "SUSPENDED", c: "red" },
                  { s: "RESOLUTION", c: "red" },
                ].map((e) => (
                  <div
                    key={e.s}
                    className={`flex items-center justify-between rounded border px-2 py-1 ${
                      e.c === "emerald"
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : e.c === "red"
                          ? "border-red-500/40 bg-red-500/5"
                          : "border-amber-500/40 bg-amber-500/5"
                    }`}
                  >
                    <span className="font-mono font-semibold">{e.s}</span>
                    <span className="text-muted-foreground">
                      {e.c === "emerald"
                        ? "success"
                        : e.c === "red"
                          ? "blocked"
                          : "in-flight"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §6-§7 Reconciliation + MTQ Position */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Reconciliation — Five-Way
              </CardTitle>
              <CardDescription>
                Canonical Ledger = Bank Subledger = Corporate Positions =
                Reserve Ledger = Proof-of-Liabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { s: "RECONCILED", desc: "All 5 totals match", c: "emerald" },
                  {
                    s: "WARNING",
                    desc: "Minor variance — investigate",
                    c: "amber",
                  },
                  {
                    s: "MISMATCH",
                    desc: "Detected — restrict affected operations",
                    c: "red",
                  },
                  {
                    s: "CRITICAL",
                    desc: "Forensic review triggered",
                    c: "red",
                  },
                  {
                    s: "LOCKED",
                    desc: "Settlement suspended pending escalation",
                    c: "red",
                  },
                ].map((r) => (
                  <div
                    key={r.s}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                      r.c === "emerald"
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : r.c === "red"
                          ? "border-red-500/40 bg-red-500/5"
                          : "border-amber-500/40 bg-amber-500/5"
                    }`}
                  >
                    <span className="font-mono font-semibold text-sm">
                      {r.s}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.desc}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  On mismatch: alert → restrict → forensic review → preserve
                  audit evidence → escalate. MITHQAL never silently ignores
                  reconciliation variance.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                MTQ Position — Bank Subledger
              </CardTitle>
              <CardDescription>
                BankMTQSubledger architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="rounded-md border border-border/60 bg-muted/30 p-3 font-mono">
                  <div className="font-semibold text-amber-700 dark:text-amber-300">
                    BANK A
                  </div>
                  <div className="ml-3 mt-1">
                    ├── Corporate X (pseudonymous)
                  </div>
                  <div className="ml-3">├── Corporate Y</div>
                  <div className="ml-3">├── Corporate Z</div>
                  <div className="ml-3 font-semibold">
                    └── Aggregate MTQ Position
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/30 p-3 font-mono">
                  <div className="font-semibold text-amber-700 dark:text-amber-300">
                    MITHQAL Canonical Ledger
                  </div>
                  <div className="ml-3 mt-1">Bank A = X MTQ ✓</div>
                  <div className="ml-3">Bank B = Y MTQ ✓</div>
                  <div className="ml-3">Bank C = Z MTQ ✓</div>
                </div>
                <div className="rounded-md bg-emerald-500/5 border border-emerald-500/40 p-3 text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Required:
                  </span>{" "}
                  MITHQAL Canonical Ledger = Bank Subledger = Cryptographic
                  Attestation (5-way reconciliation)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §8-§9 Compliance + JSG */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Compliance Attestations
              </CardTitle>
              <CardDescription>
                7 bank-side assertions required per settlement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                {[
                  "KYC = PASS",
                  "KYB = PASS",
                  "AML = PASS",
                  "SANCTIONS = PASS",
                  "ACCOUNT_AUTHORITY = PASS",
                  "FUNDS_AVAILABLE = PASS",
                  "TRANSACTION_AUTHORIZED = PASS",
                ].map((a) => (
                  <div
                    key={a}
                    className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2 py-1.5"
                  >
                    <span className="font-mono text-xs">{a}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                MITHQAL validates the attestation — does NOT request the
                bank&rsquo;s entire customer file. Customer identity stays in
                the bank.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                JSG Status
              </CardTitle>
              <CardDescription>
                Jurisdictional Settlement Gateway — independent US/BRICS
                blocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                {[
                  { j: "US", s: "CONDITIONAL", c: "amber" },
                  { j: "JP", s: "CONDITIONAL", c: "amber" },
                  { j: "AE", s: "CONDITIONAL", c: "amber" },
                  { j: "EU", s: "CONDITIONAL", c: "amber" },
                  { j: "SG", s: "CONDITIONAL", c: "amber" },
                  { j: "GB", s: "CONDITIONAL", c: "amber" },
                  { j: "HK", s: "CONDITIONAL", c: "amber" },
                  { j: "CN", s: "PROHIBITED", c: "red" },
                  { j: "IN", s: "UNKNOWN=BLOCK", c: "red" },
                  { j: "BR", s: "UNKNOWN=BLOCK", c: "red" },
                ].map((j) => (
                  <div
                    key={j.j}
                    className={`flex items-center justify-between rounded border px-2 py-1 ${
                      j.c === "red"
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-amber-500/40 bg-amber-500/5"
                    }`}
                  >
                    <span className="font-mono font-semibold">{j.j}</span>
                    <span className="text-muted-foreground">{j.s}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §10-§11 Incidents + Limits */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertOctagon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Incidents — Failure Handling
              </CardTitle>
              <CardDescription>
                Deterministic recovery for gateway + MITHQAL failures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
                  <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                    Gateway Failure
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>Do NOT mint duplicate MTQ</li>
                    <li>Do NOT duplicate settlement</li>
                    <li>Preserve idempotency</li>
                    <li>Reconcile pending instructions</li>
                    <li>Allow manual controlled recovery</li>
                    <li>Preserve bank + MITHQAL audit trails</li>
                  </ul>
                </div>
                <div className="rounded-md border border-red-500/40 bg-red-500/5 p-3">
                  <div className="font-semibold text-red-700 dark:text-red-300 mb-1">
                    MITHQAL-side Failure
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>
                      Bank systems must NOT assume settlement completed
                    </li>
                    <li>
                      Require{" "}
                      <span className="font-mono">
                        PENDING_MITHQAL_CONFIRMATION
                      </span>{" "}
                      until finality
                    </li>
                    <li>
                      Never imply technical failure = payment completion
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Limits — Connectivity Security
              </CardTitle>
              <CardDescription>
                Zero-trust architecture — 12 connectivity controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                {[
                  "mutual TLS",
                  "signed requests",
                  "hardware-backed signing",
                  "nonce",
                  "timestamp",
                  "replay protection",
                  "idempotency",
                  "message expiration",
                  "IP / network controls",
                  "institution allowlist",
                  "key rotation",
                  "emergency revocation",
                ].map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-1.5 rounded border border-border/40 bg-muted/20 px-2 py-1"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-muted/30 p-3 text-xs">
                <span className="font-semibold">Rule:</span> No unauthenticated
                bank-to-MITHQAL settlement request. Every request must
                authenticate institution + gateway + signing key + policy
                version + transaction authorization.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §12 Audit + DR + ROI */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Bank Cost Model
              </CardTitle>
              <CardDescription>By bank tier</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>One-time</TableHead>
                    <TableHead>Annual</TableHead>
                    <TableHead>Weeks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costModels.map((c) => (
                    <TableRow key={c.bankSize}>
                      <TableCell className="font-mono text-xs">
                        {c.bankSize}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${(c.totalOneTime / 1000).toFixed(0)}K
                      </TableCell>
                      <TableCell className="text-xs">
                        ${(c.annualRecurring / 1000).toFixed(0)}K
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.estimatedImplementationWeeks}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
                ✓ coreBankingReplacementRequired = false (always)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Bank ROI Model
              </CardTitle>
              <CardDescription>By bank tier</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Payback</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>5-yr NPV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roiModels.map((r) => (
                    <TableRow key={r.bankSize}>
                      <TableCell className="font-mono text-xs">
                        {r.bankSize}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.paybackPeriodMonths}mo
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.roiPercent.toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-xs">
                        ${(r.npv5Year / 1_000_000).toFixed(1)}M
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 text-xs text-muted-foreground">
                Do not promise specific savings before pilots. Measure instead.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Privacy Model
              </CardTitle>
              <CardDescription>3-layer privacy architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="rounded border border-border/40 bg-muted/20 p-2">
                  <span className="font-mono text-amber-700 dark:text-amber-300">
                    Layer 1:
                  </span>{" "}
                  Bank Identity Vault (customer stays in bank)
                </div>
                <div className="rounded border border-border/40 bg-muted/20 p-2">
                  <span className="font-mono text-amber-700 dark:text-amber-300">
                    Layer 2:
                  </span>{" "}
                  MITHQAL Institutional (pseudonymous + ZK)
                </div>
                <div className="rounded border border-border/40 bg-muted/20 p-2">
                  <span className="font-mono text-amber-700 dark:text-amber-300">
                    Layer 3:
                  </span>{" "}
                  Authorized Disclosure (lawful basis required)
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Privacy by default. Traceability by authorization. Disclosure
                by law.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests + Acceptance Criteria */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Required Tests — {report.tests.length} total
              </CardTitle>
              <CardDescription>
                All SIMULATED (no real bank yet) · {testsPassed} PASS ·{" "}
                {testsSimulated} SIMULATED
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 space-y-1.5 overflow-y-auto pr-2 text-xs">
                {report.tests.map((t) => (
                  <div
                    key={t.testId}
                    className="rounded border border-border/40 bg-muted/20 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                        {t.testId}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {t.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Acceptance Criteria — {acceptanceMet}/
                {report.acceptanceCriteria.length} met
              </CardTitle>
              <CardDescription>
                Met at logic/spec level — INTEGRATION-READY
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={
                  (acceptanceMet / report.acceptanceCriteria.length) * 100
                }
                className="mb-3 h-2"
              />
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-2 text-xs">
                {report.acceptanceCriteria.map((c) => (
                  <div
                    key={c.criterionId}
                    className="flex items-start gap-2 rounded border border-border/40 bg-muted/20 p-2"
                  >
                    {c.met ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.criterionId}
                      </span>
                      <div className="text-foreground">{c.criterion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API endpoints */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Versioned API — /gateway/v1/*
            </CardTitle>
            <CardDescription>
              {report.apiEndpoints.length} stable versioned endpoints — strict
              schemas, idempotency, signed messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {report.apiEndpoints.map((e) => (
                <div
                  key={e.path}
                  className="rounded border border-border/40 bg-muted/20 p-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                    >
                      {e.method}
                    </Badge>
                    {e.requiresIdempotency && (
                      <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="mt-1 font-mono text-xs text-amber-700 dark:text-amber-300">
                    {e.path}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended next actions */}
        <Card className="mt-6 border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Recommended Next Actions
            </CardTitle>
            <CardDescription>
              Ordered — execute top to bottom to move from INTEGRATION-READY →
              BANK-CONTRACTED → LIVE-PILOT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {report.recommendedNextActions.slice(0, 6).map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded border border-border/40 bg-muted/20 p-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-semibold text-amber-700 dark:text-amber-300">
                    {i + 1}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Final honest closing statement */}
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
                <DollarSign className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    Canonical Commercial Statement
                  </p>
                  <p className="text-muted-foreground italic">
                    &ldquo;MITHQAL is designed to integrate with existing
                    regulated banking infrastructure rather than replace it.
                    Banks remain the authoritative customer, compliance,
                    treasury, accounting and security environment. The MITHQAL
                    Bank Gateway provides a standardized sidecar/adapter that
                    converts existing authorized banking instructions into MTQ
                    settlement instructions and returns settlement and
                    reconciliation status into the bank&rsquo;s operating
                    environment.&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Module: {report.moduleId} ·{" "}
                    <span className="font-mono">
      No core replacement. Minimal integration. Existing banking systems
      remain authoritative.
                    </span>
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
