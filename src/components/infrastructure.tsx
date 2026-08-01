"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock, Scale, Settings, Shield, GitBranch, FileCheck, Network,
  Landmark, BookOpen, AlertTriangle, CheckCircle2, Globe, Activity,
  Search, ChevronRight, Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";
import { DetailModal } from "@/components/detail-modal";

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

/* ============================================================
 * P1: invariant-detail enrichment — the API returns only {name, reason,
 * amendable:false}. We layer additional context (constitutional section,
 * full description, related invariants) via a local map keyed by name.
 * This keeps the modal meaningful without requiring an API change.
 * ============================================================ */

const INVARIANT_DETAIL: Record<string, { section: string; description: string; related: string[] }> = {
  "Constitutional Identity": {
    section: "§1 — Constitutional Objectives",
    description:
      "The Institution's identity — a Constitutional Monetary Institution providing neutral, fully-reserved settlement infrastructure for international trade — cannot be changed by any amendment, governance decision, or emergency measure. This is the bedrock provision from which every other invariant derives.",
    related: ["Institutional Neutrality", "Non-Sovereign Monetary Status"],
  },
  "Institutional Neutrality": {
    section: "§2 — Constitutional Principles",
    description:
      "The Institution must remain politically, economically, and jurisdictionally neutral. Neutrality is demonstrated through verifiable non-discretionary processes — never by declaration. No decision may align the Institution with any state, bloc, or political movement.",
    related: ["Constitutional Identity", "Constitutional Transparency"],
  },
  "Non-Sovereign Monetary Status": {
    section: "§2 — Constitutional Principles",
    description:
      "MTQ shall never become, or be declared as, a sovereign currency. The Institution explicitly disclaims any aspiration to replace sovereign money; it complements international trade settlement through constitutional stability, transparency, and prudence.",
    related: ["Constitutional Identity", "Institutional Neutrality"],
  },
  "Gold Constitutional Anchor": {
    section: "§14 — Gold Numeraire",
    description:
      "Gold is the constitutional anchor of the basket — the ruler against which every currency's momentum is measured. Gold is held physically in allocated form (Tier 3 + Tier 4) and is never liquidated while sufficient eligible reserves remain (§34.2 Bullion Protection Rule).",
    related: ["Reserve Segregation", "No Lending of Reserves"],
  },
  "Reserve Segregation": {
    section: "§6 — Reserve Custody",
    description:
      "Reserves are held in segregated custody accounts at independent qualified custodians. They are never commingled with institutional operating funds, never pledged as collateral, and never subject to any third-party claim.",
    related: ["100% Reserve Minimum", "No Encumbrance of Reserves", "No Lending of Reserves"],
  },
  "100% Reserve Minimum": {
    section: "§4 — Reserve Ratio (RR)",
    description:
      "The reserve ratio (RR = R_a / (S × NAV_m)) must remain ≥ 100% at all times. Minting auto-pauses if RR drops below; the Safe Multi-Sig refuses any custodian action that would push RR below the floor. This invariant cannot be suspended even in constitutional emergency.",
    related: ["No Fractional Reserve", "Reserve Segregation", "Mandatory Proof of Reserves"],
  },
  "No Fractional Reserve": {
    section: "§6 — Reserve Custody",
    description:
      "Fractional reserve banking is constitutionally prohibited. The Institution cannot create MTQ against future expected reserves, against borrowed reserves, or against any reserve that is not yet settled and verified. Every MTQ in circulation is fully and presently backed.",
    related: ["100% Reserve Minimum", "No Lending of Reserves", "No Discretionary Minting"],
  },
  "No Lending of Reserves": {
    section: "§6 — Reserve Custody",
    description:
      "Reserves are never lent, rehypothecated, or deployed in any yield-generating activity. They sit in custody, fully segregated, and exist solely to back circulating MTQ. This invariant closes the principal systemic-risk vector that traditional fractional-reserve institutions run.",
    related: ["Reserve Segregation", "No Encumbrance of Reserves", "No Fractional Reserve"],
  },
  "No Encumbrance of Reserves": {
    section: "§6 — Reserve Custody",
    description:
      "Reserves may not be encumbered — pledged, lien'd, frozen by any creditor, or used as collateral for any obligation of the Institution. Title to all reserve assets remains with the Institution (and its depositors) at all times.",
    related: ["Reserve Segregation", "No Lending of Reserves"],
  },
  "No Discretionary Minting": {
    section: "§36 — Supply Lifecycle",
    description:
      "MTQ is minted ONLY upon verified deposit of equivalent value, following the 12-step mint lifecycle (§36.1). There is no admin mint path, no governance mint path, no emergency mint path. Every mint transaction is deterministic and verifiable on-chain.",
    related: ["No Discretionary Burning", "Deterministic Monetary Engine", "100% Reserve Minimum"],
  },
  "No Discretionary Burning": {
    section: "§36 — Supply Lifecycle",
    description:
      "MTQ is burned ONLY upon verified redemption, following the 13-step redeem lifecycle (§36.3). There is no admin burn path, no governance burn path, no emergency burn path. The contract has no admin burn function — burns are mechanical, executed by the redeem transaction itself.",
    related: ["No Discretionary Minting", "Deterministic Monetary Engine"],
  },
  "Mandatory Proof of Reserves": {
    section: "§37 — Proof of Reserves",
    description:
      "The 7-proof assurance framework (reserve existence, sufficiency, ratio, liquidity, risk, oracle integrity, constitutional compliance) runs continuously and is published daily. Publication cannot be paused, deferred, or redacted.",
    related: ["100% Reserve Minimum", "Constitutional Transparency", "Mathematical Auditability"],
  },
  "Deterministic Monetary Engine": {
    section: "§15-20 — Monetary Engine",
    description:
      "The monetary engine is deterministic: the same inputs always produce the same weights, NAVs, and ratios. There is no discretionary component, no committee vote on weights, no override path. The engine's parameters are public constitutional constants (§53).",
    related: ["No Discretionary Minting", "No Discretionary Burning", "Mathematical Auditability"],
  },
  "Redemption Rights": {
    section: "§34 — Redemption Sequencing",
    description:
      "Every MTQ holder has the right to redeem for proportional reserves at any time. Redemption is non-discretionary and follows the constitutional hierarchy (most-liquid tier first; gold is last resort). Redemption is suspended only under constitutional emergency, which itself cannot be invoked by a single role.",
    related: ["Constitutional Identity", "No Discretionary Burning"],
  },
  "Constitutional Transparency": {
    section: "§7 — Transparency",
    description:
      "All material information — reserves, NAV, ratio, operations, oracle inputs — is published in real time. Publication cannot be paused, deferred, or redacted except under constitutional emergency. The public dashboard is the canonical record.",
    related: ["Mandatory Proof of Reserves", "Mathematical Auditability", "Institutional Neutrality"],
  },
  "Oracle Independence": {
    section: "§30-33 — Oracle Engine",
    description:
      "The oracle engine is independent of the Institution's operators. Price feeds come from multiple independent sources; a single source failure cannot break the engine. Operators cannot override oracle inputs.",
    related: ["Deterministic Monetary Engine", "Mathematical Auditability"],
  },
  "Mathematical Auditability": {
    section: "§37 — Assurance Framework",
    description:
      "Every quantity — supply, NAV, ratio, weights — is reproducible from public inputs by anyone. The Constitution is the single source of truth; the code is its faithful implementation. Any divergence between code and Constitution is a defect to be fixed.",
    related: ["Constitutional Transparency", "Deterministic Monetary Engine", "Mandatory Proof of Reserves"],
  },
  "Constitutional Language Standards": {
    section: "§11 — Language Standards",
    description:
      "The Constitution uses precise, unambiguous language. Defined terms (NAV, RR, LCR, CRI, etc.) have one canonical meaning across all articles. This prevents drift between code, docs, and operator understanding.",
    related: ["Constitutional Identity", "Mathematical Auditability"],
  },
  "Constitutional Governance Process": {
    section: "§43 — Amendment Process",
    description:
      "Amendment requires supermajority Council approval PLUS independent technical, economic, legal, and Sharia review. Anti-platform and invariant provisions (this §45 set) are excluded from amendment entirely — the amendment process cannot reach them.",
    related: ["Constitutional Identity", "Institutional Neutrality"],
  },
  "Constitutional Constants Registry": {
    section: "§53 — Constants Registry",
    description:
      "Every quantitative parameter (α, β, γ, η, λ, V_normal, etc.) is a registered constitutional constant. Modifiable constants can be changed only through the full amendment process (§43); invariant constants (the §45 set) cannot be changed at all.",
    related: ["Deterministic Monetary Engine", "Mathematical Auditability"],
  },
};

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

function Section({ id, eyebrow, title, intro, children, count, defaultOpen = false }: { id: string; eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode; count?: React.ReactNode; defaultOpen?: boolean }) {
  // UI9 Fix 3 — Progressive disclosure: when `count` is provided the section
  // collapses into a <details> element with only the title + count visible
  // by default. Click to reveal the intro + content. When `count` is omitted
  // the section renders as before (always expanded).
  if (count !== undefined) {
    return (
      <section id={id} className="scroll-mt-24 px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <details open={defaultOpen} className="group rounded-2xl border border-line bg-ink-soft/40 p-5 sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <Eyebrow>{eyebrow}</Eyebrow>
                <h2 className="font-display mt-3 flex items-center gap-3 text-2xl text-balance sm:text-3xl">
                  <span>{title}</span>
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {count !== null ? (
                  <Badge className="border-gold/30 bg-gold/10 text-[10px] font-semibold text-gold hover:bg-gold/10">
                    {count}
                  </Badge>
                ) : null}
                <ChevronRight className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-open:rotate-90" />
              </div>
            </summary>
            <div className="mt-5">
              {intro ? <p className="max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">{intro}</p> : null}
              <div className="mt-6">{children}</div>
            </div>
          </details>
        </div>
      </section>
    );
  }
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
              The complete v19.0 constitutional infrastructure — 55 sections implemented across 6 parts (per the engine header; the 57-section blueprint is the source of truth, with 2 sections pending implementation). Every module is auditable and faithful to the specification. This is the institutional plumbing that makes Mithqal trustworthy.
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
          <Section id="invariants" eyebrow="§45 — Non-Amendable Provisions" title={<>Constitutional Invariants</>} intro="These provisions define the permanent identity of the Institution. They cannot be modified, suspended, overridden, or reinterpreted by any amendment, policy, emergency measure, or governance decision." count={`${data.invariants.length} provisions`}>
            <InvariantsSection invariants={data.invariants} />
          </Section>

          <Separator className="bg-line" />

          {/* §53 Constitutional Constants Registry */}
          <Section id="constants" eyebrow="§53 — Constitutional Constants" title={<>Constants Registry</>} intro="The quantitative parameters of the Monetary Engine. Modifiable only through the full Constitutional Amendment Process (§43) with independent technical, economic, legal, and Sharia review." count={`${data.constants.length} constants`}>
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
          <Section id="proofs" eyebrow="§37 — Proof of Reserves" title={<>Assurance Framework</>} intro="Every circulating MTQ is continuously verified by 7 independent proofs — reserve existence, sufficiency, ratio, liquidity, risk, oracle integrity, and constitutional compliance. Published daily." count={`${data.assuranceFramework.length} proofs`}>
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
          <Section id="redemption" eyebrow="§34 — Redemption Sequencing" title={<>Constitutional Redemption Hierarchy</>} intro="Redemptions are satisfied using the most liquid assets first. Gold — the constitutional anchor — is NEVER liquidated while sufficient eligible assets remain." count={`${data.redemptionHierarchy.length} tiers`}>
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
          <Section id="settlement" eyebrow="§35 — Settlement Finality" title={<>Settlement Pipeline</>} intro="Settlement is NOT final until all 6 constitutional validations complete. Each stage is deterministic, auditable, and independently verifiable." count={`${data.settlementPipeline.length} stages`}>
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
          <Section id="sharia" eyebrow="§49 — Sharia Governance" title={<>Sharia Compliance Framework</>} intro="Continuous compliance with Islamic finance principles through an independent Constitutional Sharia Governance Framework. AAOIFI standards, independent Sharia Committee, prohibition of Riba, Gharar, and Haram industries." count={`${data.shariaRequirements.length} requirements`}>
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
          <Section id="stress" eyebrow="§40 — Stress Testing" title={<>Constitutional Stress Scenarios</>} intro="Continuous quantitative stress testing demonstrates that constitutional solvency, liquidity, and settlement continuity remain preserved under adverse market conditions." count={`${data.stressScenarios.length} categories`}>
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
            <span>v19.0 Constitutional Release Candidate — Pending Independent External Validation. 55 of 57 sections implemented (per the engine header). The specification is the single source of truth.</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * InvariantsSection — P1: clickable invariant cards + search/filter.
 *
 * Each card is wrapped in a DetailModal trigger. Clicking opens a modal
 * showing the invariant number + name, constitutional basis (§section),
 * full description, and related invariants.
 *
 * A search input at the top filters by name / reason / section / description.
 * The "PERMANENT" badge stays on every card — these provisions are
 * non-amendable, full stop.
 * ============================================================ */

function InvariantsSection({ invariants }: { invariants: Invariant[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return invariants;
    const q = query.toLowerCase();
    return invariants.filter((inv) => {
      const detail = INVARIANT_DETAIL[inv.name];
      return (
        inv.name.toLowerCase().includes(q) ||
        inv.reason.toLowerCase().includes(q) ||
        (detail?.section.toLowerCase().includes(q) ?? false) ||
        (detail?.description.toLowerCase().includes(q) ?? false) ||
        (detail?.related.some((r) => r.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [invariants, query]);

  return (
    <div>
      {/* Search input + result count */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter invariants by name, section, or description…"
            aria-label="Filter constitutional invariants"
            className="w-full rounded-md border border-line bg-ink py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fg-muted hover:text-foreground"
              aria-label="Clear filter"
            >
              ×
            </button>
          ) : null}
        </div>
        <span className="shrink-0 text-[11px] text-fg-muted">
          Showing <span className="text-foreground">{filtered.length}</span> of{" "}
          <span className="text-foreground">{invariants.length}</span> invariants
        </span>
      </div>

      {/* Invariant card grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-ink-soft px-4 py-12 text-center text-sm text-fg-muted">
          No invariants match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inv, i) => {
            const detail = INVARIANT_DETAIL[inv.name];
            return (
              <DetailModal
                key={inv.name}
                title={inv.name}
                eyebrow={`Invariant ${String(i + 1).padStart(2, "0")} · §45`}
                description={detail?.section ?? "§45 — Constitutional Invariant"}
                sizeClassName="sm:max-w-xl"
                trigger={
                  <div
                    role="button"
                    tabIndex={0}
                    title={`Open details for invariant ${i + 1}: ${inv.name}`}
                    aria-label={`Open details for invariant ${i + 1}: ${inv.name}`}
                    className="glass card-hover rounded-lg border-gold/20 p-4 text-left transition hover:border-gold/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-[10px] font-bold text-gold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Lock className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span className="text-sm font-semibold text-foreground">{inv.name}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden="true" />
                    </div>
                    <p className="mt-1.5 text-xs text-fg-muted">{inv.reason}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge className="border-gold/30 bg-gold/10 text-[9px] text-gold hover:bg-gold/10">
                        PERMANENT
                      </Badge>
                      <span className="text-[9px] text-fg-muted">
                        {detail?.section.split("—")[0].trim() ?? "§45"}
                      </span>
                    </div>
                  </div>
                }
              >
                <InvariantDetailBody
                  index={i + 1}
                  name={inv.name}
                  reason={inv.reason}
                  detail={detail}
                />
              </DetailModal>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InvariantDetailBody({
  index,
  name,
  reason,
  detail,
}: {
  index: number;
  name: string;
  reason: string;
  detail?: { section: string; description: string; related: string[] };
}) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/[0.06] p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold">
          {String(index).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="font-display text-base text-foreground">{name}</div>
          <div className="mt-0.5 text-[11px] text-fg-muted">{reason}</div>
        </div>
        <Badge className="ml-auto shrink-0 border-gold/30 bg-gold/10 text-[9px] text-gold hover:bg-gold/10">
          <Lock className="mr-1 h-2.5 w-2.5" /> PERMANENT
        </Badge>
      </div>

      {/* Constitutional basis */}
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          <Link2 className="h-3 w-3" aria-hidden="true" /> Constitutional basis
        </div>
        <div className="rounded-lg border border-line bg-ink-card p-3">
          <code className="font-mono text-xs text-gold">
            {detail?.section ?? "§45 — Constitutional Invariant"}
          </code>
        </div>
      </div>

      {/* Full description */}
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          <BookOpen className="h-3 w-3" aria-hidden="true" /> Full description
        </div>
        <p className="rounded-lg border border-line bg-ink-card p-3 text-sm leading-relaxed text-foreground/90">
          {detail?.description ??
            "This provision is part of the §45 set of constitutional invariants — non-amendable provisions that define the permanent identity of the Institution. The full description is being progressively published in the v19.0 specification."}
        </p>
      </div>

      {/* Related invariants */}
      {detail?.related && detail.related.length > 0 ? (
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            <Network className="h-3 w-3" aria-hidden="true" /> Related invariants
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.related.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded border border-line bg-ink-card px-2 py-1 text-[11px] text-fg-muted"
              >
                <Link2 className="h-2.5 w-2.5 text-gold/60" aria-hidden="true" />
                {r}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-line bg-ink-card/50 p-3 text-[11px] leading-relaxed text-fg-muted">
        <strong className="text-gold">Non-amendable.</strong> This provision is permanently frozen
        under §45. The constitutional amendment process (§43) cannot reach it; no Council vote,
        no emergency measure, no governance decision can modify, suspend, or override it.
      </div>
    </div>
  );
}
