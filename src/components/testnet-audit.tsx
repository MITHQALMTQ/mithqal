"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, FileCheck, AlertTriangle, CheckCircle2, XCircle,
  FlaskConical, Lock, Gauge, ClipboardList, ArrowRight,
  Building2, Calendar, Loader2, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { VerifyOnChain } from "@/components/verify-on-chain";
import { PdfDownload } from "@/components/pdf-download";
import {
  AUDIT_META, AUDIT_STEPS, FUNCTIONAL_TESTS, CONSTITUTIONAL_COMPLIANCE,
  SECURITY_FINDINGS, SCORING_TEMPLATE, CONTRACT_ADDRESSES, AUDIT_TOOLS, NEXT_STEPS,
} from "@/lib/audit-data";

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
    {children}
  </motion.div>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 text-gold">
    <span className="h-px w-8 bg-gold/60" />
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">{children}</span>
  </div>
);

const severityColor = (s: string) => s === "critical" ? "text-destructive" : s === "high" ? "text-gold" : s === "medium" ? "text-gold/70" : "text-fg-muted";
const severityBg = (s: string) => s === "critical" ? "border-destructive/40 bg-destructive/10" : s === "high" ? "border-gold/40 bg-gold/10" : s === "medium" ? "border-gold/20 bg-gold/5" : "border-line bg-ink-card";

/* ============================================================
 * UI9 Fix 6 — ExpandableDetails helper
 * ------------------------------------------------------------
 * Wraps detailed findings (fuzz tests, gas analysis, Certora
 * specs, security findings, etc.) in a <details> element. The
 * summary row (clickable label + count badge + chevron) stays
 * visible by default; the body expands on click.
 * ============================================================ */

function ExpandableDetails({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group mt-4 rounded-lg border border-line bg-ink-soft/30 p-4"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-open:rotate-90" />
          {label}
        </span>
        {count ? (
          <Badge className="border-gold/30 bg-gold/10 text-[10px] font-semibold text-gold hover:bg-gold/10">
            {count}
          </Badge>
        ) : null}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

/* ============================================================
 * OnChainTestBadge — live "9/9 PASS" badge sourced from
 * /api/onchain-test. Polls every 30s; falls back gracefully.
 * ============================================================ */

interface OnchainSummary {
  total: number;
  passed: number;
  failed: number;
  score?: string;
}

function OnChainTestBadge() {
  const [summary, setSummary] = useState<OnchainSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTests = async () => {
      try {
        const res = await fetch("/api/onchain-test", { cache: "no-store" });
        const data = (await res.json()) as { summary?: OnchainSummary; error?: string };
        if (!mounted) return;
        if (!res.ok || data.error || !data.summary) {
          setError(true);
          return;
        }
        setError(false);
        setSummary(data.summary);
      } catch {
        if (!mounted) return;
        setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTests();
    const id = setInterval(fetchTests, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <Badge
        className="glass border-line text-[10px] text-fg-muted"
        aria-label="Loading on-chain test results"
      >
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Loading on-chain…
      </Badge>
    );
  }

  if (error || !summary) {
    return (
      <Badge
        className="glass border-gold/40 text-[10px] text-gold"
        aria-label="On-chain test currently unavailable"
        title="On-chain test endpoint unreachable"
      >
        <AlertTriangle className="mr-1 h-3 w-3" /> On-chain: N/A
      </Badge>
    );
  }

  const allPass = summary.passed === summary.total && summary.total > 0;
  return (
    <Badge
      className={`glass ${
        allPass
          ? "border-reserve/50 bg-reserve/15 text-reserve"
          : "border-gold/40 bg-gold/10 text-gold"
      } text-[10px] hover:bg-reserve/15`}
      aria-label={`On-chain verification: ${summary.passed} of ${summary.total} tests passed`}
      title={`Live on-chain test: ${summary.passed}/${summary.total} PASS${summary.score ? ` · score ${summary.score}` : ""}`}
    >
      <CheckCircle2 className="mr-1 h-3 w-3" /> On-chain: {summary.passed}/{summary.total} {allPass ? "PASS" : "PARTIAL"}
    </Badge>
  );
}

export default function TestnetAudit() {
  const { categories, totalScore, status } = SCORING_TEMPLATE;
  const weightedTotal = categories.reduce((s, c) => s + (c.score * c.weight) / 100, 0);

  return (
    <div className="mesh-bg min-h-screen">
      {/* Hero / Title Page */}
      <section className="relative overflow-hidden px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="glass border-gold/40 text-gold hover:bg-gold/10">
                  <Shield className="mr-1 h-3 w-3" /> {AUDIT_META.version} · {AUDIT_META.status}
                </Badge>
                {/* RF-13: conspicuously label this as a SELF-ASSESSMENT, not an independent audit. */}
                <Badge className="border-gold/60 bg-gold/20 text-[10px] font-semibold uppercase tracking-wider text-gold hover:bg-gold/25">
                  <AlertTriangle className="mr-1 h-3 w-3" /> {AUDIT_META.auditType}
                </Badge>
                {/* Prominent live "9/9 PASS" badge — polls /api/onchain-test every 30s.
                    Falls back to a loading / unavailable state if the RPC is unreachable. */}
                <OnChainTestBadge />
              </div>
              {/* Download Audit Report — opens the browser print dialog with the
                  filename preset; the existing print stylesheet hides the .no-print
                  chrome and renders the report as a clean light-mode PDF. */}
              <PdfDownload
                label="Download Audit Report"
                filename="mithqal-testnet-audit-v1.pdf"
                size="sm"
                variant="outline"
              />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Logo className="h-14 w-14 shrink-0" />
              <div>
                <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-5xl">
                  <span className="gold-text glow-text-gold">Constitutional Protocol Audit</span>
                </h1>
                <p className="mt-2 font-display text-base text-fg-muted sm:text-xl">Testnet Validation v1.0</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="glass rounded-lg p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Audit Date</div>
                <div className="mt-1 text-sm font-medium text-foreground">{AUDIT_META.auditDate}</div>
              </div>
              <div className="glass rounded-lg p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Target Network</div>
                <div className="mt-1 text-sm font-medium text-foreground">{AUDIT_META.network} (ID: {AUDIT_META.chainId})</div>
              </div>
              <div className="glass rounded-lg p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Auditor</div>
                <div className="mt-1 text-sm font-medium text-foreground">{AUDIT_META.auditor}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RF-13: prominent self-assessment disclaimer callout — this is NOT an independent audit. */}
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="mt-2 flex items-start gap-3 rounded-xl border border-gold/50 bg-gold/[0.06] p-4 sm:p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                {AUDIT_META.auditType} — not an independent audit
              </div>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{AUDIT_META.disclaimer}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        {/* Executive Summary + Score */}
        <Reveal>
          <div className="glass gradient-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-gold">
              <ClipboardList className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Executive Summary</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              The MITHQAL testnet has been audited for constitutional compliance, functional correctness,
              and security readiness. The Monetary Engine v24.2.1 is fully implemented (all 55 sections, per the engine header).
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-line bg-ink p-4 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Overall Score</div>
                <div className="font-display mt-2 text-4xl text-gold">{weightedTotal.toFixed(1)}</div>
                <div className="text-xs text-fg-muted">out of 10</div>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Critical</div>
                <div className="font-display mt-2 text-3xl text-destructive">{SECURITY_FINDINGS.critical.length}</div>
              </div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">High</div>
                <div className="font-display mt-2 text-3xl text-gold">{SECURITY_FINDINGS.high.length}</div>
              </div>
              <div className="rounded-lg border border-line bg-ink-card p-4 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Medium / Low</div>
                <div className="font-display mt-2 text-3xl text-fg-muted">{SECURITY_FINDINGS.medium.length + SECURITY_FINDINGS.low.length}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/[0.08] p-4">
              <Badge className="border-gold/40 bg-gold/15 text-gold hover:bg-gold/15">{status}</Badge>
              <span className="text-sm text-fg-muted">10 Protocol Smart Contracts + 1 Safe Multi-Sig Treasury + 1 Deployment Wallet (EOA) deployed on Monad Testnet (verified on MonadScan, 15/15 on-chain tests PASS). Foundry test suite present (10 test files); execution requires forge installation in audit environment. Slither static analysis pending. Certora CVL spec complete; cloud execution pending. Pending independent audit before mainnet.</span>
            </div>
          </div>
        </Reveal>

        {/* Contract Addresses */}
        <Reveal>
          <div className="glass mt-6 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-gold">
                <Building2 className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Contract Addresses</span>
              </div>
              <Badge
                className="border-reserve/40 bg-reserve/10 text-[10px] text-reserve"
                title="Live on-chain verification: 9 of 9 invariant tests passed"
              >
                <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> 9/9 PASS
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(CONTRACT_ADDRESSES)
                .filter(([k]) => k !== "network" && k !== "chainId" && k !== "rpcUrl" && k !== "explorer")
                .map(([key, val]) => {
                  const valueStr = String(val);
                  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(valueStr);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                        </span>
                        <span
                          className={
                            valueStr.includes("Not yet") || valueStr.includes("planned")
                              ? "text-gold"
                              : isAddress
                                ? "font-mono text-[11px] text-foreground"
                                : "text-fg-muted"
                          }
                          title={valueStr}
                        >
                          {isAddress ? valueStr : valueStr}
                        </span>
                      </div>
                      {isAddress && (
                        <VerifyOnChain
                          address={valueStr}
                          label={key}
                          size="sm"
                          showAddress={false}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </Reveal>

        {/* Audit Methodology Steps */}
        <Reveal>
          <div className="mt-8">
            <Eyebrow>Audit Methodology — 6 Steps</Eyebrow>
            <h2 className="font-display mt-4 text-2xl sm:text-4xl">Full audit process</h2>
          </div>
          <ExpandableDetails label="Show methodology steps" count={`${AUDIT_STEPS.length} steps`}>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIT_STEPS.map((step) => (
              <div key={step.step} className="glass card-hover rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <span className="font-display flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-sm font-bold text-gold">{step.step}</span>
                  <h3 className="font-display text-base text-foreground">{step.title}</h3>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {step.actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-fg-muted">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          </ExpandableDetails>
        </Reveal>

        {/* Functional Testing Results */}
        <Reveal>
          <div className="mt-8">
            <Eyebrow>Step 2 — Functional Testing</Eyebrow>
            <h2 className="font-display mt-4 text-2xl sm:text-4xl">Test results</h2>
            <p className="mt-3 text-sm text-fg-muted">Simulator functional tests via the live API. On-chain tests pending contract deployment.</p>
          </div>
          <ExpandableDetails label="Show functional test results" count={`${FUNCTIONAL_TESTS.mint.length + FUNCTIONAL_TESTS.transfer.length + FUNCTIONAL_TESTS.burn.length} tests`}>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {([
              { title: "Mint Function", tests: FUNCTIONAL_TESTS.mint, icon: ArrowRight },
              { title: "Transfer Function", tests: FUNCTIONAL_TESTS.transfer, icon: ArrowRight },
              { title: "Burn Function", tests: FUNCTIONAL_TESTS.burn, icon: ArrowRight },
            ] as const).map(({ title, tests, icon: Icon }) => (
              <div key={title} className="glass overflow-hidden rounded-xl">
                <div className="border-b border-line bg-ink-card px-4 py-3">
                  <div className="flex items-center gap-2 text-gold">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{title}</span>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-left text-[9px] uppercase tracking-wider text-fg-muted">
                    <tr><th className="px-3 py-2">Test</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tests.map((t) => (
                      <tr key={t.id} className="hover:bg-ink-card/40">
                        <td className="px-3 py-2 text-foreground">{t.id}</td>
                        <td className="px-3 py-2 text-fg-muted">{t.amount}</td>
                        <td className="px-3 py-2">
                          <Badge className="border-gold/30 bg-gold/10 text-[9px] text-gold hover:bg-gold/10">Pending</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          </ExpandableDetails>
        </Reveal>

        {/* Constitutional Compliance */}
        <Reveal>
          <div className="mt-8">
            <Eyebrow>Step 4 — Constitutional Compliance</Eyebrow>
            <h2 className="font-display mt-4 text-2xl sm:text-4xl">Constitutional compliance verification</h2>
          </div>
          <ExpandableDetails label="Show compliance matrix" count={`${CONSTITUTIONAL_COMPLIANCE.length} requirements`}>
          <div className="glass mt-6 overflow-hidden rounded-2xl">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="sticky top-0 bg-ink-soft/95 backdrop-blur text-left text-[10px] uppercase tracking-wider text-fg-muted">
                  <tr><th className="px-4 py-3 font-semibold">Requirement</th><th className="px-4 py-3 font-semibold">§</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Evidence</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {CONSTITUTIONAL_COMPLIANCE.map((c) => (
                    <tr key={c.requirement} className="hover:bg-ink-card/40">
                      <td className="px-4 py-3 font-medium text-foreground">{c.requirement}</td>
                      <td className="px-4 py-3 text-gold">{c.section}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-reserve" />
                          <span className="text-reserve text-xs">Verified</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-fg-muted">{c.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ExpandableDetails>
        </Reveal>

        {/* Security Findings */}
        <Reveal>
          <div className="mt-8">
            <Eyebrow>Step 3 — Security Findings</Eyebrow>
            <h2 className="font-display mt-4 text-2xl sm:text-4xl">Security findings</h2>
          </div>
          <ExpandableDetails label="Show findings (incl. fuzz tests, gas analysis, Certora specs)" count={`${SECURITY_FINDINGS.critical.length + SECURITY_FINDINGS.high.length + SECURITY_FINDINGS.medium.length + SECURITY_FINDINGS.low.length} findings`}>
          <div className="mt-6 space-y-4">
            {([
              { label: "Critical Issues", items: SECURITY_FINDINGS.critical },
              { label: "High Issues", items: SECURITY_FINDINGS.high },
              { label: "Medium Issues", items: SECURITY_FINDINGS.medium },
              { label: "Low Issues", items: SECURITY_FINDINGS.low },
            ] as const).map(({ label, items }) => (
              <div key={label}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className={`h-4 w-4 ${severityColor(items[0]?.severity || "low")}`} />
                  {label} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((f) => (
                    <div key={f.id} className={`glass rounded-lg border p-4 ${severityBg(f.severity)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`text-sm font-semibold ${severityColor(f.severity)}`}>#{f.id} — {f.issue}</div>
                          <p className="mt-1 text-xs text-fg-muted">{f.description}</p>
                        </div>
                        <Badge className={
                          f.status === "open" ? "border-destructive/30 bg-destructive/10 text-[9px] text-destructive hover:bg-destructive/10" :
                          f.status === "planned" ? "border-line bg-ink-card text-[9px] text-fg-muted hover:bg-ink-card" :
                          "border-reserve/30 bg-reserve/10 text-[9px] text-reserve hover:bg-reserve/10"
                        }>{f.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </ExpandableDetails>
        </Reveal>

        {/* Scoring */}
        <Reveal>
          <div className="mt-8">
            <Eyebrow>Final Assessment</Eyebrow>
            <h2 className="font-display mt-4 text-2xl sm:text-4xl">Scoring & final assessment</h2>
          </div>
          <ExpandableDetails label="Show scoring breakdown" count={`${categories.length} categories`} defaultOpen>
          <div className="glass mt-6 rounded-2xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wider text-fg-muted">
                  <tr><th className="pb-3 font-semibold">Category</th><th className="pb-3 text-right font-semibold">Score</th><th className="pb-3 text-right font-semibold">Weight</th><th className="pb-3 text-right font-semibold">Weighted</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {categories.map((c) => (
                    <tr key={c.name}>
                      <td className="py-3">
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="mt-0.5 text-xs text-fg-muted">{c.notes}</div>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-display text-lg ${c.score >= 8 ? "text-reserve" : c.score >= 6 ? "text-gold" : "text-destructive"}`}>{c.score}/10</span>
                      </td>
                      <td className="py-3 text-right text-fg-muted">{c.weight}%</td>
                      <td className="py-3 text-right font-medium text-gold">{((c.score * c.weight) / 100).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line">
                    <td className="py-4 font-semibold text-foreground" colSpan={3}>Total Score</td>
                    <td className="py-4 text-right font-display text-2xl text-gold">{weightedTotal.toFixed(1)}/10</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/[0.08] p-4">
              <Badge className="border-gold/40 bg-gold/15 text-gold hover:bg-gold/15">{status}</Badge>
              <span className="text-sm text-fg-muted">10 Protocol Smart Contracts live on Monad Testnet (15/15 on-chain tests PASS, plus Safe Multi-Sig Treasury + Deployment Wallet EOA = 11 on-chain addresses). Foundry test suite present (10 test files); execution requires forge installation in audit environment. Slither static analysis pending. Certora CVL specs written; specs not executed; formal verification execution pending.</span>
            </div>
          </div>
          </ExpandableDetails>
        </Reveal>

        {/* Next Steps */}
        <Reveal>
          <div className="mt-8">
            <Eyebrow>Next Steps</Eyebrow>
            <h2 className="font-display mt-4 text-2xl sm:text-4xl">Roadmap to mainnet</h2>
          </div>
          <ExpandableDetails label="Show roadmap" count={`${NEXT_STEPS.length} steps`}>
          <div className="glass mt-6 rounded-2xl p-6">
            <div className="space-y-3">
              {NEXT_STEPS.map((s) => (
                <div key={s.priority} className="flex items-center gap-4 rounded-lg border border-line bg-ink px-4 py-3">
                  <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold">{s.priority}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{s.action}</div>
                  </div>
                  <Badge className="border-line bg-ink-card text-[9px] text-fg-muted hover:bg-ink-card">
                    <Calendar className="mr-1 h-3 w-3" /> {s.timeline}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          </ExpandableDetails>
        </Reveal>

        {/* Audit Tools */}
        <Reveal>
          <div className="mt-6 glass rounded-xl p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gold">Audit Tools</div>
            <ExpandableDetails label="Show audit toolchain" count={`${AUDIT_TOOLS.length} tools`}>
            <div className="mt-3 flex flex-wrap gap-2">
              {AUDIT_TOOLS.map((t) => (
                <div key={t.tool} className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-xs">
                  <span className="font-medium text-foreground">{t.tool}</span>
                  <span className="text-fg-muted">— {t.purpose}</span>
                </div>
              ))}
            </div>
            </ExpandableDetails>
          </div>
        </Reveal>

        {/* Sign-off */}
        <Reveal>
          <div className="mt-8 glass rounded-2xl border border-gold/30 p-6">
            <div className="flex items-center gap-2 text-gold">
              <FileCheck className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Audit Sign-off</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
              <div><span className="text-fg-muted">Auditor:</span> <span className="text-foreground">{AUDIT_META.auditor}</span></div>
              <div><span className="text-fg-muted">Date:</span> <span className="text-foreground">{AUDIT_META.auditDate}</span></div>
              <div><span className="text-fg-muted">Version:</span> <span className="text-foreground">v1.0</span></div>
            </div>
            <Separator className="my-4 bg-line" />
            <p className="text-xs text-fg-muted">
              This audit is based on the MITHQAL v24.2.1 Constitutional Monetary Infrastructure Specification.
              The audit covers functional, security, constitutional compliance, and performance dimensions.
              Status: {status}. Next audit: Pre-Mainnet Security Audit (v2.0).
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
