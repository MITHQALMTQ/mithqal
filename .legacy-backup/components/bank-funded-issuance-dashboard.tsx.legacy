"use client";

/* ============================================================
 * BankFundedIssuanceDashboard — §V25.0.B
 * ------------------------------------------------------------
 * Task ID: UI-GAP-ANALYSIS-DASHBOARDS
 *
 * Renders the §V25.0.B Bank-Funded Issuance Model report.
 * Surfaces the dual-model capital architecture:
 *   - 4 capital concepts (A: MTQ Backing, B: MITHQAL Capital,
 *     C: Bank Funding, D: Liquidity)
 *   - Model A vs Model B side-by-side comparison
 *     (21.5432% vs 4.7086% breach probability)
 *   - ILPS reconciliation ($48.1M total — Emergency + Structural
 *     $23.8M is a SUBSET, NOT additional)
 *   - 6 capital categories (SEPARATE, doNotAutoCombine=true)
 *   - Sources & Uses table (7 rows, NOT auto-summed)
 *   - 5 bank failure scenarios
 *   - 9-stage evidence pipeline (zero-budget reality)
 *   - 18 acceptance criteria
 *
 * Data provenance: /api/bank-funded-issuance-model →
 *   src/lib/bank-funded-issuance-model.ts
 *
 * Honest state preserved throughout:
 *   finalStatus = "APPROVED CANDIDATE FOR CONTROLLED TESTING —
 *                  NOT PRODUCTION-AUTHORIZED"
 *   modelRequirementsNotPresentedAsFunded=true,
 *   bankFundedModelReducesButDoesNotEliminate=true
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
  DollarSign,
  TrendingDown,
  Wallet,
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

interface CapitalConcept {
  type: string;
  name: string;
  description: string;
  examples: string[];
}

interface MonetaryModel {
  modelName: string;
  description: string;
  totalMTQOutstanding: number;
  bankFundedIssuance: number;
  mithqalOwnedReserveExposure: number;
  reserveLiabilities: number;
  RR: number;
  StressRR: number;
  LCR: number;
  MLCR: number;
  ILPSTotal: number;
  SDR: number;
  modeledBreachProbability: number;
  capitalRequirement: number;
  capitalRequirementType: string;
  notes: string;
}

interface CapitalCategory {
  type: string;
  owner: string;
  purpose: string;
  legalStatus: string;
  accountingStatus: string;
  reusability: string;
  restrictions: string;
  amount: number;
  currentEvidenceState: string;
}

interface SourcesAndUsesRow {
  source: string;
  requirement: string;
  amount: number;
  purpose: string;
  legalOwner: string;
  accountingClass: string;
  reusability: string;
}

interface BankFailureScenario {
  scenarioId: string;
  name: string;
  description: string;
  whoHoldsBacking: string;
  whoOwesRedemption: string;
  mtqTreatment: string;
  newIssuanceStops: boolean;
  existingMTQRemainsTransferable: boolean;
  redemptionMechanism: string;
  reconciliationMechanism: string;
  customerClaimsTreatment: string;
  reserveSegregationProtection: string;
}

interface AcceptanceCriterion {
  id: number;
  criterion: string;
  met: boolean;
  evidence: string;
}

interface BankFundedReport {
  moduleId: string;
  principle: string;
  fourCapitalConcepts: CapitalConcept[];
  modelA: MonetaryModel;
  modelB: MonetaryModel;
  sixCapitalCategories: CapitalCategory[];
  ilpsReconciliation: {
    layer1_SettlementLiquidity: number;
    layer2_RedemptionLiquidity: number;
    layer3_EmergencyLiquidity: number;
    layer4_StructuralReserve: number;
    layer5_ExternalCommittedLiquidity: number;
    total: number;
    emergencyAndStructural: number;
    relationship: string;
    noDoubleCounting: boolean;
  };
  sourcesAndUsesTable: SourcesAndUsesRow[];
  bankFailureScenarios: BankFailureScenario[];
  zeroBudgetMode: {
    currentReality: string;
    modelRequirement: string;
    confirmedFunding: number;
    evidenceStates: string[];
    rule: string;
    currentEvidenceStateByCategory: Record<string, string>;
  };
  acceptanceCriteria: AcceptanceCriterion[];
  honestState: {
    honest: boolean;
    forcedToPass: boolean;
    productionAuthorized: boolean;
    modelRequirementsNotPresentedAsFunded: boolean;
    bankFundedModelReducesButDoesNotEliminate: boolean;
  };
  finalStatus: string;
}

function fmtUSD(n: number) {
  if (n === 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtPct(n: number) {
  return (n * 100).toFixed(4) + "%";
}

function evidenceStateBadge(state: string) {
  if (state === "FUNDED" || state === "AWARDED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
      >
        {state}
      </Badge>
    );
  }
  if (state === "MODELLED") {
    return (
      <Badge
        variant="outline"
        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
      >
        {state}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
    >
      {state}
    </Badge>
  );
}

const conceptIcon = (type: string) => {
  switch (type) {
    case "MTQ_BACKING_RESERVE":
      return <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    case "MITHQAL_INSTITUTIONAL_CAPITAL":
      return <Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    case "BANK_INSTITUTIONAL_FUNDING":
      return <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    case "LIQUIDITY_RESOURCES":
      return <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    default:
      return <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
  }
};

export function BankFundedIssuanceDashboard() {
  const [report, setReport] = useState<BankFundedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bank-funded-issuance-model");
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
            <span>Loading Bank-Funded Issuance dashboard...</span>
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
                Bank-Funded Issuance dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the Bank-Funded Issuance report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  const acceptanceMet = report.acceptanceCriteria.filter((c) => c.met).length;
  const acceptancePct =
    report.acceptanceCriteria.length > 0
      ? Math.round((acceptanceMet / report.acceptanceCriteria.length) * 100)
      : 0;

  const ilps = report.ilpsReconciliation;
  const ilpsLayers = [
    { label: "Layer 1 — Settlement Liquidity", value: ilps.layer1_SettlementLiquidity },
    { label: "Layer 2 — Redemption Liquidity", value: ilps.layer2_RedemptionLiquidity },
    { label: "Layer 3 — Emergency Liquidity", value: ilps.layer3_EmergencyLiquidity },
    { label: "Layer 4 — Structural Reserve", value: ilps.layer4_StructuralReserve },
    {
      label: "Layer 5 — External Committed Liquidity",
      value: ilps.layer5_ExternalCommittedLiquidity,
    },
  ];

  return (
    <section
      id="bank-funded-issuance-dashboard"
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
            <Wallet className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bank-Funded Issuance{" "}
              <span className="gold-text">Model</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The §V25.0.B architecture: ordinary MTQ issuance is funded by verified
            eligible value originating through an authorized participating
            regulated bank. MITHQAL shall NOT rely on discretionary proprietary
            capital to finance ordinary MTQ issuance.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              4 capital concepts distinguished
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
              <TrendingDown className="mr-1 h-3 w-3" />
              Model B reduces risk — does NOT eliminate
            </Badge>
            <Badge variant="outline" className="border-border/60">
              <FileCheck className="mr-1 h-3 w-3" />
              {acceptanceMet}/{report.acceptanceCriteria.length} AC met
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
                    {report.principle.slice(0, 360)}
                    {report.principle.length > 360 ? "…" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    honest={String(report.honestState.honest)} ·{" "}
                    productionAuthorized=
                    {String(report.honestState.productionAuthorized)} ·{" "}
                    modelRequirementsNotPresentedAsFunded=
                    {String(report.honestState.modelRequirementsNotPresentedAsFunded)}{" "}
                    · bankFundedModelReducesButDoesNotEliminate=
                    {String(report.honestState.bankFundedModelReducesButDoesNotEliminate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §2 4 Capital Concepts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold">
              4 Capital Concepts — A / B / C / D (distinguished, NOT combined)
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.fourCapitalConcepts.map((c) => (
              <Card key={c.type} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {conceptIcon(c.type)}
                    <span>{c.name}</span>
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {c.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-xs">
                  <p className="text-muted-foreground">{c.description}</p>
                  <div>
                    <p className="mb-1 font-semibold text-foreground">Examples</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {c.examples.slice(0, 3).map((e, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §3 Dual Model Comparison */}
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
                <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Dual Model Comparison — Model A vs Model B
              </CardTitle>
              <CardDescription>
                Model A preserves 21.5432% breach probability. Model B reduces blended
                breach to 4.7086% — below the 5% governance threshold. NO additional
                monetary-protection capital required at system level under Model B.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-red-700 dark:text-red-300">
                      MODEL A
                    </span>
                    <Badge
                      variant="outline"
                      className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
                    >
                      Above threshold
                    </Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {report.modelA.description}
                  </p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {fmtPct(report.modelA.modeledBreachProbability)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    P(RR&lt;100%) — capital requirement:{" "}
                    {fmtUSD(report.modelA.capitalRequirement)} (
                    {report.modelA.capitalRequirementType})
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      MODEL B
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                    >
                      Below threshold
                    </Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {report.modelB.description}
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {fmtPct(report.modelB.modeledBreachProbability)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Blended P(RR&lt;100%) — capital requirement:{" "}
                    {fmtUSD(report.modelB.capitalRequirement)} (
                    {report.modelB.capitalRequirementType})
                  </p>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Model A (Current Reserve)</TableHead>
                      <TableHead>Model B (Bank-Funded)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Total MTQ Outstanding</TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelA.totalMTQOutstanding)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelB.totalMTQOutstanding)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bank-Funded Issuance</TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelA.bankFundedIssuance)}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-700 dark:text-emerald-300">
                        {fmtUSD(report.modelB.bankFundedIssuance)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MITHQAL-Owned Reserve Exposure</TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelA.mithqalOwnedReserveExposure)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelB.mithqalOwnedReserveExposure)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">RR (Reserve Ratio)</TableCell>
                      <TableCell className="font-mono">{report.modelA.RR}</TableCell>
                      <TableCell className="font-mono">{report.modelB.RR}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">StressRR</TableCell>
                      <TableCell className="font-mono">{report.modelA.StressRR}</TableCell>
                      <TableCell className="font-mono">{report.modelB.StressRR}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">LCR</TableCell>
                      <TableCell className="font-mono">{report.modelA.LCR}</TableCell>
                      <TableCell className="font-mono">{report.modelB.LCR}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MLCR</TableCell>
                      <TableCell className="font-mono">{report.modelA.MLCR}</TableCell>
                      <TableCell className="font-mono">{report.modelB.MLCR}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ILPS Total</TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelA.ILPSTotal)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {fmtUSD(report.modelB.ILPSTotal)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">SDR</TableCell>
                      <TableCell className="font-mono">{report.modelA.SDR}</TableCell>
                      <TableCell className="font-mono">{report.modelB.SDR}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §4 ILPS Reconciliation */}
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
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ILPS Reconciliation — $48.1M (Corrected, No Double-Counting)
              </CardTitle>
              <CardDescription>
                {ilps.relationship} · noDoubleCounting=
                {String(ilps.noDoubleCounting)} · Emergency + Structural $23.8M is a
                SUBSET of the $48.1M total.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ILPS Layer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ilpsLayers.map((l) => (
                        <TableRow key={l.label}>
                          <TableCell className="font-medium text-xs">{l.label}</TableCell>
                          <TableCell className="text-right font-mono text-amber-700 dark:text-amber-300">
                            {fmtUSD(l.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 border-amber-500/40 bg-amber-500/5">
                        <TableCell className="font-bold">TOTAL</TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-700 dark:text-amber-300">
                          {fmtUSD(ilps.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
                    <p className="mb-1 font-semibold text-amber-700 dark:text-amber-300">
                      Emergency + Structural (Subset)
                    </p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {fmtUSD(ilps.emergencyAndStructural)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      These $23.8M are already counted within the $48.1M total above.
                      They are NOT additional. Any other representation is
                      double-counting and forbidden.
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      noDoubleCounting = true (enforced)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §5 6 Capital Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold">
              6 Capital Categories — SEPARATE, doNotAutoCombine=true
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.sixCapitalCategories.map((c) => (
              <Card key={c.type} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{c.type}</CardTitle>
                    {evidenceStateBadge(c.currentEvidenceState)}
                  </div>
                  <CardDescription className="font-mono text-xs">
                    Owner: {c.owner}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-xs">
                  <p className="text-muted-foreground">{c.purpose}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                        {fmtUSD(c.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Legal Status</p>
                      <p className="font-mono">{c.legalStatus}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Accounting</p>
                      <p className="font-mono">{c.accountingStatus}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reusability</p>
                      <p className="font-mono">{c.reusability}</p>
                    </div>
                  </div>
                  <p className="rounded border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-800 dark:text-red-200">
                    Restrictions: {c.restrictions}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §6 Sources & Uses Table */}
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
                Sources &amp; Uses Table — 7 Rows (NOT auto-summed)
              </CardTitle>
              <CardDescription>
                Each row is an independent source/requirement pair. Totaling is
                forbidden by design — these are distinct economic and accounting
                concepts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Legal Owner</TableHead>
                      <TableHead>Accounting Class</TableHead>
                      <TableHead>Reusability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.sourcesAndUsesTable.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs">{r.source}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.requirement}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-amber-700 dark:text-amber-300">
                          {fmtUSD(r.amount)}
                        </TableCell>
                        <TableCell className="text-xs">{r.legalOwner}</TableCell>
                        <TableCell className="font-mono text-xs">{r.accountingClass}</TableCell>
                        <TableCell className="font-mono text-xs">{r.reusability}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §7 5 Bank Failure Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold">
              5 Bank Failure Scenarios — Controlled Outcomes
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.bankFailureScenarios.map((s) => (
              <Card key={s.scenarioId} className="flex flex-col border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs"
                    >
                      {s.scenarioId}
                    </Badge>
                    <span className="text-sm">{s.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-xs">
                  <p className="text-muted-foreground">{s.description}</p>
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">Who holds backing: </span>
                      <span className="text-foreground">{s.whoHoldsBacking}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Who owes redemption: </span>
                      <span className="text-foreground">{s.whoOwesRedemption}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">MTQ treatment: </span>
                      <span className="text-foreground">{s.mtqTreatment}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.newIssuanceStops && (
                      <Badge
                        variant="outline"
                        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs"
                      >
                        New issuance HALTED
                      </Badge>
                    )}
                    {s.existingMTQRemainsTransferable && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                      >
                        Existing MTQ transferable
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* §8 Zero-Budget Reality (9-stage pipeline) */}
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
                <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Zero-Budget Reality — 9-Stage Evidence Pipeline
              </CardTitle>
              <CardDescription>
                {report.zeroBudgetMode.currentReality} · confirmed funding: $
                {report.zeroBudgetMode.confirmedFunding.toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {report.zeroBudgetMode.rule}
              </p>
              <div>
                <p className="mb-2 text-sm font-semibold">Evidence Pipeline Stages</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {report.zeroBudgetMode.evidenceStates.map((stage, i) => {
                    const reached =
                      report.zeroBudgetMode.currentEvidenceStateByCategory &&
                      Object.values(
                        report.zeroBudgetMode.currentEvidenceStateByCategory,
                      ).includes(stage);
                    return (
                      <div key={stage} className="flex items-center gap-1.5">
                        <div
                          className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-xs font-mono font-semibold ${
                            reached
                              ? "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "border-border/40 bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {i + 1}. {stage}
                        </div>
                        {i < report.zeroBudgetMode.evidenceStates.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">
                  Current evidence state by category
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(
                    report.zeroBudgetMode.currentEvidenceStateByCategory || {},
                  ).map(([cat, state]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded border border-border/40 bg-muted/20 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {cat}
                      </span>
                      {evidenceStateBadge(state)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Model requirement:{" "}
                </span>
                {report.zeroBudgetMode.modelRequirement}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* §9 18 Acceptance Criteria */}
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
                18 Acceptance Criteria — Spec-Level Closure
              </CardTitle>
              <CardDescription>
                {acceptanceMet}/{report.acceptanceCriteria.length} criteria met at the
                logic / spec level only. Production authorization is NOT granted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Spec-level closure progress
                  </span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                    {acceptanceMet}/{report.acceptanceCriteria.length} ({acceptancePct}%)
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
                    <span className="w-8 shrink-0 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
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
                    Final Status — §V25.0.B Closing
                  </p>
                  <p className="text-muted-foreground italic">
                    &ldquo;{report.finalStatus}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Module: {report.moduleId} · Bank-funded model REDUCES but does NOT
                    eliminate risk. Bank credit risk is NONZERO (~0.5% per 30 days
                    for TIER-1 bank). All assumptions documented, not manipulated.
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
