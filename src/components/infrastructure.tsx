"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock, Scale, Settings, Shield, GitBranch, FileCheck, Network,
  Landmark, BookOpen, AlertTriangle, CheckCircle2, Globe, Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";

interface Invariant { name: string; reason: string; amendable: false }
interface Constant { name: string; symbol: string; value: number; unit: string; section: string; modifiable: boolean; modificationRule: string }
interface Proof { type: string; purpose: string; frequency: string; verified: boolean }
interface LifecycleStep { step: number; name: string; completed: boolean }
interface RegItem { regulation: string; status: string; notes: string }

interface InfraData {
  specVersion: string;
  invariants: Invariant[];
  constants: Constant[];
  assuranceFramework: Proof[];
  proofContents: readonly string[];
  redemptionHierarchy: readonly string[];
  settlementPipeline: { stage: number; name: string; completed: boolean }[];
  mintLifecycle: LifecycleStep[];
  redeemLifecycle: LifecycleStep[];
  supplyInvariants: readonly string[];
  usRegulatory: RegItem[];
  internationalFrameworks: readonly string[];
  shariaRequirements: { requirement: string; standard: string; authority: string }[];
  stressScenarios: { category: string; scenarios: readonly string[] }[];
  operationalCapitalMonths: number;
  generatedAt: string;
}

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

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal><Eyebrow>{eyebrow}</Eyebrow><h2 className="font-display mt-4 text-2xl text-balance sm:text-4xl">{title}</h2>{intro ? <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">{intro}</p> : null}</Reveal>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export default function InfrastructureView() {
  const [data, setData] = useState<InfraData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/infrastructure", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mesh-bg min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2">
              <Badge className="glass border-gold/40 text-gold hover:bg-gold/10">v19.0 Constitutional Infrastructure</Badge>
              <Badge className="glass border-line text-fg-muted hover:bg-ink-card">Release Candidate</Badge>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Logo className="h-14 w-14 shrink-0" />
              <div>
                <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl"><span className="gold-text glow-text-gold">Infrastructure</span></h1>
                <p className="mt-2 font-display text-base text-fg-muted sm:text-xl">Oracle engine · SDP · Settlement · Supply · Proofs · Governance</p>
              </div>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
              The complete v19.0 constitutional infrastructure — 57 sections across 6 parts. Every module is implemented, auditable, and faithful to the specification. This is the institutional plumbing that makes Mithqal trustworthy.
            </p>
          </motion.div>
        </div>
      </section>

      {loading || !data ? (
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 shimmer rounded-xl" />)}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          {/* §45 Constitutional Invariants */}
          <Section id="invariants" eyebrow="§45 — Non-Amendable Provisions" title={<>21 Constitutional Invariants</>} intro="These provisions define the permanent identity of the Institution. They cannot be modified, suspended, overridden, or reinterpreted by any amendment, policy, emergency measure, or governance decision.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.invariants.map((inv, i) => (
                <div key={inv.name} className="glass card-hover rounded-lg border-gold/20 p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-gold" />
                    <span className="text-sm font-semibold text-foreground">{inv.name}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-fg-muted">{inv.reason}</p>
                  <Badge className="mt-2 border-gold/30 bg-gold/10 text-[9px] text-gold hover:bg-gold/10">PERMANENT</Badge>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §53 Constitutional Constants Registry */}
          <Section id="constants" eyebrow="§53 — Constitutional Constants" title={<>Constants Registry</>} intro="The quantitative parameters of the Monetary Engine. Modifiable only through the full Constitutional Amendment Process (§43) with independent technical, economic, legal, and Sharia review.">
            <div className="glass overflow-hidden rounded-xl">
              <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="sticky top-0 bg-ink-soft/95 backdrop-blur text-left text-[10px] uppercase tracking-wider text-fg-muted">
                    <tr><th className="px-4 py-3 font-semibold">Constant</th><th className="px-4 py-3 font-semibold">Symbol</th><th className="px-4 py-3 text-right font-semibold">Value</th><th className="px-4 py-3 font-semibold">Unit</th><th className="px-4 py-3 font-semibold">§</th><th className="px-4 py-3 font-semibold">Modifiable</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.constants.map((c) => (
                      <tr key={c.name} className="hover:bg-ink-card/40">
                        <td className="px-4 py-3 text-foreground">{c.name}</td>
                        <td className="px-4 py-3 font-mono text-gold">{c.symbol}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{c.value}</td>
                        <td className="px-4 py-3 text-fg-muted">{c.unit}</td>
                        <td className="px-4 py-3 text-fg-muted">{c.section}</td>
                        <td className="px-4 py-3">{c.modifiable ? <Badge className="border-reserve/30 bg-reserve/10 text-[9px] text-reserve hover:bg-reserve/10">Yes</Badge> : <Badge className="border-destructive/30 bg-destructive/10 text-[9px] text-destructive hover:bg-destructive/10">No (Invariant)</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §37 Assurance Framework */}
          <Section id="proofs" eyebrow="§37 — Proof of Reserves" title={<>7-Proof Assurance Framework</>} intro="Every circulating MTQ is continuously verified by 7 independent proofs — reserve existence, sufficiency, ratio, liquidity, risk, oracle integrity, and constitutional compliance. Published daily.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.assuranceFramework.map((proof) => (
                <div key={proof.type} className="glass card-hover rounded-lg p-4">
                  <FileCheck className="h-4 w-4 text-gold" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{proof.type}</h3>
                  <p className="mt-1 text-xs text-fg-muted">{proof.purpose}</p>
                  <Badge className="mt-2 border-line bg-ink-card text-[9px] text-fg-muted hover:bg-ink-card">{proof.frequency}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 glass rounded-lg p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gold">Proof Contents (§37.3)</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.proofContents.map((c) => <span key={c} className="rounded border border-line bg-ink px-2 py-1 text-[10px] text-fg-muted">{c}</span>)}
              </div>
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §34 Redemption Hierarchy */}
          <Section id="redemption" eyebrow="§34 — Redemption Sequencing" title={<>Constitutional Redemption Hierarchy</>} intro="Redemptions are satisfied using the most liquid assets first. Gold — the constitutional anchor — is NEVER liquidated while sufficient eligible assets remain.">
            <div className="glass rounded-xl p-6">
              <div className="space-y-2">
                {data.redemptionHierarchy.map((tier, i) => (
                  <div key={tier} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-ink text-xs font-bold text-gold">{i + 1}</span>
                    <span className={`text-sm ${tier === "gold" ? "font-semibold text-gold" : "text-foreground"}`}>{tier}</span>
                    {tier === "gold" ? <Badge className="border-gold/40 bg-gold/10 text-[9px] text-gold hover:bg-gold/10">CONSTITUTIONAL ANCHOR — LAST RESORT</Badge> : null}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-gold/30 bg-gold/[0.05] p-4 text-sm text-foreground">
                <strong className="text-gold">Bullion Protection Rule (§34.2):</strong> Gold may only be liquidated after all operational liquidity, cash reserves, short-duration sovereigns, and silver have been exhausted.
              </div>
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §35 Settlement Finality */}
          <Section id="settlement" eyebrow="§35 — Settlement Finality" title={<>6-Stage Settlement Pipeline</>} intro="Settlement is NOT final until all 6 constitutional validations complete. Each stage is deterministic, auditable, and independently verifiable.">
            <div className="glass rounded-xl p-6">
              <div className="space-y-2">
                {data.settlementPipeline.map((stage) => (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold">{stage.stage}</span>
                    <span className="text-sm text-foreground">{stage.name}</span>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-reserve" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-reserve/30 bg-reserve/[0.06] p-3 text-sm">
                <Shield className="h-4 w-4 text-reserve" />
                <span className="text-fg-muted">Constitutional Finality: all 6 stages complete → irrevocably committed to the Constitutional Ledger.</span>
              </div>
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §36 Supply Lifecycle */}
          <Section id="lifecycle" eyebrow="§36 — Supply Lifecycle" title={<>Mint & Redeem Lifecycles</>} intro="MTQ supply changes ONLY through constitutionally authorized mint or redeem procedures. Each has a 12-13 step lifecycle with constitutional validation at every stage.">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 text-reserve"><Activity className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Mint Lifecycle (12 steps)</span></div>
                <div className="mt-3 space-y-1.5">
                  {data.mintLifecycle.map((s) => (<div key={s.step} className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded border border-line text-[10px] text-fg-muted">{s.step}</span><span className="text-foreground">{s.name}</span></div>))}
                </div>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 text-gold"><AlertTriangle className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Redeem Lifecycle (13 steps)</span></div>
                <div className="mt-3 space-y-1.5">
                  {data.redeemLifecycle.map((s) => (<div key={s.step} className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded border border-line text-[10px] text-fg-muted">{s.step}</span><span className="text-foreground">{s.name}</span></div>))}
                </div>
              </div>
            </div>
            <div className="mt-4 glass rounded-lg p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gold">Supply Invariants (§36.4)</div>
              <ul className="mt-2 space-y-1">{data.supplyInvariants.map((inv) => (<li key={inv} className="flex items-start gap-2 text-xs text-fg-muted"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-reserve" />{inv}</li>))}</ul>
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §48 Regulatory */}
          <Section id="regulatory" eyebrow="§48 — Regulatory" title={<>US & International Compliance</>} intro="The Institution is designed to comply with applicable laws in every jurisdiction. Regulatory implementation adapts to jurisdiction-specific requirements while preserving Constitutional Invariants.">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 text-gold"><Globe className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.22em]">US Regulatory Framework</span></div>
                <div className="mt-3 space-y-1.5">
                  {data.usRegulatory.map((r) => (
                    <div key={r.regulation} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{r.regulation}</span>
                      <Badge className={r.status === "implemented" ? "border-reserve/30 bg-reserve/10 text-[9px] text-reserve hover:bg-reserve/10" : "border-gold/30 bg-gold/10 text-[9px] text-gold hover:bg-gold/10"}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 text-gold"><Network className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.22em]">International Frameworks</span></div>
                <div className="mt-3 flex flex-wrap gap-1.5">{data.internationalFrameworks.map((f) => <span key={f} className="rounded border border-line bg-ink px-2 py-1 text-[10px] text-fg-muted">{f}</span>)}</div>
              </div>
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §49 Sharia */}
          <Section id="sharia" eyebrow="§49 — Sharia Governance" title={<>Sharia Compliance Framework</>} intro="Continuous compliance with Islamic finance principles through an independent Constitutional Sharia Governance Framework. AAOIFI standards, independent Sharia Committee, prohibition of Riba, Gharar, and Haram industries.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.shariaRequirements.map((s) => (
                <div key={s.requirement} className="glass card-hover rounded-lg p-4">
                  <Scale className="h-4 w-4 text-gold" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{s.requirement}</h3>
                  <p className="mt-1 text-xs text-fg-muted">{s.standard}</p>
                  <p className="mt-1 text-[10px] text-gold">Authority: {s.authority}</p>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="bg-line" />

          {/* §40 Stress Testing */}
          <Section id="stress" eyebrow="§40 — Stress Testing" title={<>Constitutional Stress Scenarios</>} intro="Continuous quantitative stress testing demonstrates that constitutional solvency, liquidity, and settlement continuity remain preserved under adverse market conditions.">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.stressScenarios.map((cat) => (
                <div key={cat.category} className="glass card-hover rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gold">{cat.category}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cat.scenarios.map((s) => <span key={s} className="rounded border border-line bg-ink px-2 py-1 text-[10px] text-fg-muted">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="my-8 bg-line" />
          <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.05] p-4 text-xs text-fg-muted">
            <Shield className="h-4 w-4 shrink-0 text-gold" />
            <span>v19.0 Constitutional Release Candidate — Pending Independent External Validation. All 57 sections implemented. The specification is the single source of truth.</span>
          </div>
        </div>
      )}
    </div>
  );
}
