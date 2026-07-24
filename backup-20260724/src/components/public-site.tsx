"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Landmark,
  Layers,
  Banknote,
  Check,
  X,
  ArrowRight,
  Scale,
  Lock,
  Eye,
  Users,
  Calendar,
  CircleDollarSign,
  Building2,
  Boxes,
  Boxes as BoxesIcon,
  Gauge,
  FileCheck,
  Network,
  Crown,
  Loader2,
  Quote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IDENTITY,
  OBJECTIVES,
  INVARIANTS_PUBLIC,
  ANTI_PLATFORM,
  MTQ_SPEC,
  FEES,
  RESERVE_TIERS,
  TRANSPARENCY,
  GOVERNANCE,
  GOVERNANCE_RULES,
  LIFECYCLE,
  ELIGIBILITY,
  INTEGRATION,
  STATUS_ITEMS,
  FORMATION_ROLES,
} from "@/lib/site-data";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 text-gold">
    <span className="h-px w-8 bg-gold/60" />
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
      {children}
    </span>
  </div>
);


/* ---------------- Hero ---------------- */

function SiteHero() {
  return (
    <section id="s-top" className="relative overflow-hidden grain-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <Reveal>
          <Badge className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/10">
            Constitutional Monetary Institution · Est. under the v18 Constitution
          </Badge>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-8 flex items-center gap-5">
            <Logo className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
            <div>
              <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
                <span className="gold-text">Mithqal</span>
              </h1>
              <p className="mt-2 font-display text-xl text-fg-muted sm:text-2xl">
                {IDENTITY.tagline}
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-foreground/90 sm:text-xl">
            {IDENTITY.lede}
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              onClick={() =>
                document.getElementById("s-institution")?.scrollIntoView({ behavior: "smooth" })
              }
              className="group inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink shadow-[0_0_0_1px_color-mix(in_oklch,var(--gold)_40%,transparent),0_8px_30px_-10px_var(--gold)] transition hover:bg-gold-soft"
            >
              What is Mithqal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() =>
                document.getElementById("s-contact")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
            >
              Express interest
            </button>
          </div>
        </Reveal>
      </div>
      <div className="gold-rule h-px w-full" />
    </section>
  );
}

/* ---------------- What Mithqal is / is not ---------------- */

function WhatItIs() {
  return (
    <section id="s-institution" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>The Institution</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            A monetary authority, not a platform
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Institution is not a software project, a blockchain application, or a
            product. It is a constitutional entity whose sole function is to issue and
            redeem a fully-reserved settlement unit. If the underlying technology is
            replaced, the Institution persists — because it is an institution, not a
            technology.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <div className="flex items-center gap-2 text-gold">
                <X className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Mithqal is not
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {IDENTITY.not.map((n) => (
                  <li key={n} className="flex items-center gap-3 text-sm text-fg-muted">
                    <span className="h-1 w-1 rounded-full bg-gold/60" />
                    <span className="line-through decoration-gold/40">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-reserve/40 bg-reserve/[0.06] p-6 sm:p-7">
              <div className="flex items-center gap-2 text-reserve">
                <Check className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Mithqal is
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {IDENTITY.is.map((n) => (
                  <li key={n} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reserve" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Six objectives ---------------- */

function Objectives() {
  return (
    <section id="s-objectives" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Article I — Constitutional Objectives</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Six objectives the Institution exists to preserve
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            They are not ranked. Each is essential. Any decision that advances one at the
            expense of another is critically examined; any that undermines one without
            proportionally strengthening another is rejected.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {OBJECTIVES.map((o, i) => (
            <Reveal key={o.n} delay={i * 0.05}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6 transition-colors hover:border-gold/40">
                <div className="font-display text-3xl text-gold">{o.n}</div>
                <h3 className="font-display mt-3 text-lg text-foreground">{o.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{o.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Invariants ---------------- */

function Invariants() {
  return (
    <section id="s-invariants" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Priority 1 — Constitutional Invariants</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Five rules that can never be broken
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            These are not subject to override by any vote, referendum, or emergency.
            They are the non-negotiable foundation of every other constitutional provision.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INVARIANTS_PUBLIC.map((inv, i) => (
            <Reveal key={inv.t} delay={i * 0.05}>
              <div className="print-card h-full rounded-xl border border-gold/30 bg-gold/[0.05] p-6">
                <Lock className="h-5 w-5 text-gold" />
                <h3 className="font-display mt-4 text-lg text-foreground">{inv.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{inv.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Anti-platform ---------------- */

function AntiPlatform() {
  return (
    <section id="s-anti-platform" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Article V — Anti-Platform</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Permanently frozen against constitutional drift
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {ANTI_PLATFORM.intro}
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="print-card h-full rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <div className="flex items-center gap-2 text-gold">
                <X className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Permanently prohibited
                </span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {ANTI_PLATFORM.prohibited.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-fg-muted">
                    <span className="h-1 w-1 rounded-full bg-gold/60" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="print-card h-full rounded-2xl border border-reserve/40 bg-reserve/[0.06] p-6 sm:p-7">
              <div className="flex items-center gap-2 text-reserve">
                <Check className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Permitted activities
                </span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {ANTI_PLATFORM.permitted.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reserve" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- The Settlement Unit (MTQ) ---------------- */

function SettlementUnit() {
  return (
    <section id="s-mtq" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>The Settlement Unit — MTQ</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            One unit. Fully reserved. Always redeemable.
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            MTQ is an ERC-20 token with micro-settlement precision. Supply is dynamic —
            minted only on verified deposit, burned only on redemption. Its value is its
            NAV: a weighted basket of eligible reserve assets with bounded momentum and
            mean reversion.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <h3 className="font-display text-lg text-foreground">Token specification</h3>
              <dl className="mt-4 divide-y divide-line">
                {MTQ_SPEC.map((s) => (
                  <div key={s.k} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="text-sm text-fg-muted">{s.k}</dt>
                    <dd className="text-right text-sm font-medium text-foreground">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <h3 className="font-display text-lg text-foreground">Fee schedule</h3>
              <p className="mt-2 text-xs text-fg-muted">
                Illustrative ranges. Actual rates are set by Policy. Fees fund operations, never reserves.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-ink-card text-left text-[11px] uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {FEES.map((f) => (
                      <tr key={f.type}>
                        <td className="px-3 py-2 font-medium text-foreground">{f.type}</td>
                        <td className="px-3 py-2 text-gold">{f.rate}</td>
                        <td className="px-3 py-2 text-fg-muted">{f.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Reserves ---------------- */

function Reserves() {
  return (
    <section id="s-reserves" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Reserves & Transparency</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Reserves always equal or exceed supply
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Reserves are held in custody across a four-tier structure of central-bank-quality
            assets. Every claim is verifiable — daily cryptographic proofs, quarterly
            independent audits, and a five-year independent constitutional review.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RESERVE_TIERS.map((t, i) => (
            <Reveal key={t.tier} delay={i * 0.05}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg text-gold">{t.tier}</span>
                  <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                    {t.weight}
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                  {t.name}
                </div>
                <p className="mt-3 text-sm text-foreground">{t.assets}</p>
                <p className="mt-2 text-xs text-fg-muted">{t.quality}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 overflow-hidden rounded-2xl border border-line">
            <div className="border-b border-line bg-ink-card px-6 py-3">
              <div className="flex items-center gap-2 text-gold">
                <Eye className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Transparency cadence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
              {TRANSPARENCY.map((t) => (
                <div key={t.item} className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {t.cadence}
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">{t.item}</div>
                  <div className="mt-1 text-xs text-fg-muted">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Governance ---------------- */

function Governance() {
  return (
    <section id="s-governance" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Governance</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Governed by Council, audited by independent review
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Council is the principal governing body, supported by specialised
            committees. Every five years, an independent panel of nine experts audits the
            entire institution. The founder's influence is constitutionally capped.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {GOVERNANCE.map((g, i) => (
            <Reveal key={g.t} delay={i * 0.04}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6">
                <div className="flex items-center gap-2 text-gold">
                  {i === GOVERNANCE.length - 1 ? (
                    <Crown className="h-4 w-4" />
                  ) : (
                    <Scale className="h-4 w-4" />
                  )}
                </div>
                <h3 className="font-display mt-3 text-lg text-foreground">{g.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{g.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {GOVERNANCE_RULES.map((r) => (
              <div
                key={r.k}
                className="rounded-lg border border-line bg-ink-card p-4"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  {r.k}
                </div>
                <div className="mt-1 text-sm font-medium text-gold">{r.v}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Lifecycle / roadmap ---------------- */

function Lifecycle() {
  const toneClass = (s: string) =>
    s === "current"
      ? "border-gold/50 bg-gold/[0.08] text-gold"
      : s === "next"
        ? "border-line bg-ink-soft text-fg-muted"
        : "border-line/60 bg-ink-soft/50 text-fg-muted";
  return (
    <section id="s-lifecycle" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Article XIV — Institutional Lifecycle</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            A path determined by principles, not circumstance
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            By defining every stage in advance — formation through wind-down and succession —
            the Constitution ensures the Institution's path is never determined by courts or
            crisis.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LIFECYCLE.map((l, i) => (
            <Reveal key={l.stage} delay={i * 0.04}>
              <div className={`print-card h-full rounded-xl border p-6 ${toneClass(l.status)}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-foreground">{l.stage}</h3>
                  {l.status === "current" ? (
                    <Badge className="border-gold/40 bg-gold/15 text-[10px] text-gold hover:bg-gold/15">
                      Current
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-fg-muted">
                  {l.gov}
                </div>
                <p className="mt-3 text-sm text-foreground/90">{l.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Eligibility & integration ---------------- */

function Eligibility() {
  return (
    <section id="s-eligibility" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Who Mithqal serves</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Institutional settlement, by design
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Mithqal serves institutions — not retail speculators. Eligibility is objective
            and applied uniformly. Equal fees, equal rights, equal rules for every eligible
            participant.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ELIGIBILITY.map((e, i) => (
            <Reveal key={e.who} delay={i * 0.04}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6">
                <Building2 className="h-5 w-5 text-gold" />
                <h3 className="font-display mt-4 text-base text-foreground">{e.who}</h3>
                <p className="mt-2 text-sm text-fg-muted">{e.why}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 rounded-2xl border border-line bg-ink-soft p-6 sm:p-8">
            <h3 className="font-display text-xl text-foreground sm:text-2xl">
              How institutions integrate
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {INTEGRATION.map((s, i) => (
                <div key={s.step} className="relative">
                  <div className="font-display text-2xl text-gold">{s.step}</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{s.t}</div>
                  <p className="mt-1 text-xs text-fg-muted">{s.d}</p>
                  {i < INTEGRATION.length - 1 ? (
                    <ArrowRight className="absolute -right-2 top-3 hidden h-4 w-4 text-line xl:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Build-in-public status ---------------- */

function StatusBoard() {
  const tone = (t: string) =>
    t === "done"
      ? "border-reserve/40 bg-reserve/[0.08] text-reserve"
      : t === "next"
        ? "border-gold/40 bg-gold/[0.08] text-gold"
        : "border-line bg-ink-soft text-fg-muted";
  return (
    <section id="s-status" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Build in public</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Current status
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Trust is earned through verifiable operations, not declared. This status board
            tracks where the Institution stands against its own constitutional lifecycle.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATUS_ITEMS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.04}>
              <div className={`print-card rounded-xl border p-5 ${tone(s.tone)}`}>
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  {s.label}
                </div>
                <div className="mt-2 font-display text-lg text-foreground">{s.value}</div>
                <div className="mt-1 text-xs">{s.state}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Formation Committee contact form ---------------- */

function ContactForm() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    org: "",
    role: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.fullName.trim() || !form.email.trim() || !form.role) {
      toast({
        title: "Missing details",
        description: "Please add your name, email and select a role.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/formation-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Submission failed");
      }
      toast({
        title: "Interest recorded",
        description:
          "Thank you. The Formation Committee will be in touch. Check your email.",
      });
      setForm({ fullName: "", email: "", org: "", role: "", message: "" });
    } catch (err) {
      toast({
        title: "Could not submit",
        description:
          err instanceof Error ? err.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="s-contact" className="scroll-mt-24 border-t border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <Eyebrow>Formation Committee</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Express your interest
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Formation Committee convenes to establish the Institution: register the
            Foundation, seat the Council, and deposit initial reserves. If you are an
            investor, advisor, anchor participant, or Council nominee, leave your details.
            We read every submission.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <form
            onSubmit={submit}
            className="mt-8 rounded-2xl border border-line bg-ink-soft p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Full name *
                </span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Email *
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@org.com"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Organisation
                </span>
                <input
                  type="text"
                  value={form.org}
                  onChange={(e) => set("org", e.target.value)}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  I am interested as *
                </span>
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  required
                >
                  <option value="">Select a role…</option>
                  {FORMATION_ROLES.map((r) => (
                    <option key={r.v} value={r.v}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-5 block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Message
              </span>
              <textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                rows={4}
                placeholder="Tell us how you'd like to engage with the Institution."
                className="mt-2 w-full resize-none rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    Submit interest
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <span className="text-xs text-fg-muted">
                We store submissions securely and never share them.
              </span>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Public footer ---------------- */

function PublicFooter() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <div className="font-display text-base font-semibold text-foreground">
                MITHQAL
              </div>
              <div className="text-xs text-fg-muted">
                Constitutional Settlement Institution
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
            <a
              href="https://x.com/MithqalMTQ"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-gold"
            >
              <Network className="h-4 w-4" /> @MithqalMTQ
            </a>
            <a
              href="https://github.com/MITHQALMTQ/mithqal"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-gold"
            >
              <BoxesIcon className="h-4 w-4" /> GitHub
            </a>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Constitution v18 FINAL
            </span>
          </div>
        </div>
        <Separator className="my-6 bg-line" />
        <p className="text-xs leading-relaxed text-fg-muted">
          Mithqal is a constitutional monetary institution. MTQ is minted exclusively
          against verified reserve deposits and is never sold unbacked, per the
          Constitution's invariants. Nothing on this page constitutes an offer to sell
          securities or any MTQ unit. Eligibility is objective and applied uniformly.
        </p>
      </div>
    </footer>
  );
}

/* ---------------- Shell ---------------- */

export default function PublicSite() {
  return (
    <div className="flex flex-col">
      <SiteHero />
      <WhatItIs />
      <Objectives />
      <Invariants />
      <AntiPlatform />
      <SettlementUnit />
      <Reserves />
      <Governance />
      <Lifecycle />
      <Eligibility />
      <StatusBoard />
      <ContactForm />
      <PublicFooter />
    </div>
  );
}
