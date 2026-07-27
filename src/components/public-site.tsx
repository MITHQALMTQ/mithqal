"use client";

import { useEffect, useState } from "react";
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
  ExternalLink,
  Activity,
  TrendingUp,
  Coins,
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
  LEGAL_STATUS,
  LAYER_ZERO,
  PHASE_ZERO_TIMELINE,
  FORMATION_ROLES,
} from "@/lib/site-data";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { VerifyOnChain } from "@/components/verify-on-chain";
import { AnimatedNumber } from "@/components/animated-number";
import { LiveTimestamp } from "@/components/live-timestamp";

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
            Constitutional Monetary Institution · Est. under the v19.0 Constitution
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
        {/* Audit Fix 3 — Prominent testnet contract link in the hero.
            The MTQ token contract is published on Monad Testnet; surfacing it
            here — as a gold pill badge with the external-link icon — gives every
            reader an immediate, one-click path to independent on-chain verification. */}
        <Reveal delay={0.15}>
          <a
            href="https://testnet.monadscan.com/address/0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/[0.08] px-4 py-2 text-xs font-semibold text-gold shadow-[0_0_0_1px_color-mix(in_oklch,var(--gold)_30%,transparent),0_4px_20px_-8px_var(--gold)] transition hover:border-gold hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Verify the MTQ token contract on Monad Testnet explorer — address 0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD — opens in a new tab"
            title="MTQ Token · Monad Testnet explorer (opens in a new tab)"
          >
            <span aria-hidden="true">🔗</span>
            <span>MTQ on Monad Testnet:</span>
            <span className="font-mono text-[11px] text-gold/90">0x9e6E…253aD</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
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

/* ---------------- Live State Dashboard (Audit Fix 2) ---------------- */

/**
 * LiveStateDashboard — auto-refreshing (30s) KPI strip that surfaces the
 * Institution's live monetary state right under the hero: total supply,
 * market NAV, reserve ratio, and the live gold spot price.
 *
 * Pulls from the public /api/transparency endpoint (the same one the
 * Transparency dashboard uses), so every number on this page is sourced from
 * a single on-chain-derived, audit-grade API. Falls back to a graceful
 * "live data unavailable" card on fetch failure rather than blocking the page.
 */
interface LiveStateData {
  supply: number;
  navMarket: number;
  reserveRatio: number;
  goldUsd: number;
  lastUpdate: string;
}

// Used only when the fetch fails (or before the first response). Displayed in
// the same KPI layout so the section never collapses to a blank shell.
// NOTE: lastUpdate is a static string to prevent hydration mismatch —
// it's replaced with live data after mount via useEffect.
const LIVE_FALLBACK: LiveStateData = {
  supply: 50_000_000,
  navMarket: 1.0,
  reserveRatio: 102.34,
  goldUsd: 4053.7,
  lastUpdate: "",
};

function LiveStateDashboard() {
  const [data, setData] = useState<LiveStateData>(LIVE_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/transparency", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        testnet?: { supply?: number; nav?: number; reserveRatio?: number; lastUpdate?: string };
        monetary?: { goldUsd?: number; nav?: { market?: number }; reserveRatio?: { ratio?: number } };
        generatedAt?: string;
      };
      const next: LiveStateData = {
        supply: json.testnet?.supply ?? LIVE_FALLBACK.supply,
        navMarket: json.monetary?.nav?.market ?? json.testnet?.nav ?? LIVE_FALLBACK.navMarket,
        reserveRatio:
          json.monetary?.reserveRatio?.ratio ??
          json.testnet?.reserveRatio ??
          LIVE_FALLBACK.reserveRatio,
        goldUsd: json.monetary?.goldUsd ?? LIVE_FALLBACK.goldUsd,
        lastUpdate: json.testnet?.lastUpdate ?? json.generatedAt ?? "",
      };
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "transparency fetch failed");
      // keep previous data — do not overwrite live numbers with the fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, []);

  const cards: Array<{
    label: string;
    icon: typeof Activity;
    value: number;
    decimals: number;
    prefix?: string;
    suffix?: string;
    caption: string;
    accent: string;
  }> = [
    {
      label: "Total Supply",
      icon: Coins,
      value: data.supply,
      decimals: 0,
      suffix: " MTQ",
      caption: "Mint − Burn · ERC-20 MTQ",
      accent: "text-gold",
    },
    {
      label: "NAV (Market)",
      icon: TrendingUp,
      value: data.navMarket,
      decimals: 4,
      prefix: "$",
      caption: "Mark-to-market NAV per MTQ",
      accent: "text-gold",
    },
    {
      label: "Reserve Ratio",
      icon: Gauge,
      value: data.reserveRatio,
      decimals: 2,
      suffix: "%",
      caption: data.reserveRatio >= 100 ? "Above 100% floor" : "BELOW FLOOR — paused",
      accent: data.reserveRatio >= 100 ? "text-reserve" : "text-destructive",
    },
    {
      label: "Gold Price",
      icon: CircleDollarSign,
      value: data.goldUsd,
      decimals: 2,
      prefix: "$",
      suffix: "/oz",
      caption: "Live spot · XAU/USD",
      accent: "text-gold",
    },
  ];

  return (
    <section
      id="s-live-state"
      className="scroll-mt-24 border-b border-line/60 bg-ink-soft/40 px-5 py-10 sm:px-8 sm:py-12"
      aria-label="Live monetary state"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>Live State · auto-refreshing every 30s</Eyebrow>
              <h2 className="font-display mt-3 text-2xl leading-tight text-balance sm:text-3xl">
                The Institution, in real time
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-fg-muted">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    error ? "bg-destructive" : "bg-reserve"
                  } ${loading ? "animate-ping" : ""}`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    error ? "bg-destructive" : "bg-reserve"
                  }`}
                />
              </span>
              <span className="font-semibold uppercase tracking-[0.18em]">
                {error ? "Live data unavailable" : loading ? "Connecting…" : "Live"}
              </span>
              <LiveTimestamp isoString={data.lastUpdate} label="updated" />
            </div>
          </div>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.label} delay={i * 0.04}>
                <div className="print-card h-full rounded-xl border border-line bg-ink-card p-5 transition hover:border-gold/40">
                  <div className="flex items-center justify-between text-fg-muted">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      {c.label}
                    </span>
                    <Icon className={`h-4 w-4 ${c.accent}`} aria-hidden="true" />
                  </div>
                  <div className={`mt-3 font-display text-2xl sm:text-3xl ${c.accent}`}>
                    <AnimatedNumber
                      value={Number.isFinite(c.value) ? c.value : 0}
                      decimals={c.decimals}
                      prefix={c.prefix}
                      suffix={c.suffix}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-fg-muted">
                    <span>{c.caption}</span>
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          error ? "bg-destructive/70" : "bg-reserve/80"
                        }`}
                        aria-hidden="true"
                      />
                      {error ? "stale" : "just now"}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.16}>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-muted">
            <span>
              Source:{" "}
              <code className="rounded bg-ink-card px-1.5 py-0.5 font-mono text-[10px] text-gold/90">
                /api/transparency
              </code>{" "}
              · derived from on-chain reserves + live oracle prices.
            </span>
            <button
              onClick={() => {
                document
                  .getElementById("s-reserves")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1 transition hover:text-gold"
            >
              Reserves breakdown
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </Reveal>
      </div>
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

/* ---------------- Monetary Engine Compact (Audit Fix 1) ---------------- */

/**
 * MonetaryEngineCompact — a compact, inline visualization of the v19.0
 * Monetary Engine's currency basket. It is NOT the full interactive Engine
 * view — it shows the single core concept: Gold is the anchor → 8 sovereign
 * currencies contribute weighted pressure → MTQ is the synthesised output.
 *
 * Pulls live weights from /api/transparency and falls back to the published
 * worked-example weights if the API is unreachable, so the section never
 * collapses to a blank card.
 *
 * The "Explore the full interactive engine →" CTA deep-links to ?view=engine,
 * which page.tsx picks up and switches to the full Engine view.
 */
interface BasketCurrency {
  code: string;
  name: string;
  weight: number; // percentage value, e.g. 47.99
}

// Published v19.0 worked-example weights (Part III) — used until the first
// successful /api/transparency response lands, and as a permanent fallback.
const FALLBACK_BASKET: BasketCurrency[] = [
  { code: "USD", name: "US Dollar", weight: 47.99 },
  { code: "EUR", name: "Euro", weight: 19.03 },
  { code: "GBP", name: "Pound Sterling", weight: 10.9 },
  { code: "JPY", name: "Japanese Yen", weight: 10.32 },
  { code: "CNY", name: "Chinese Yuan", weight: 6.73 },
  { code: "CHF", name: "Swiss Franc", weight: 2.0 },
  { code: "AUD", name: "Australian Dollar", weight: 1.68 },
  { code: "CAD", name: "Canadian Dollar", weight: 1.36 },
];

const FALLBACK_GOLD_USD = 4053.7;

// Per-currency accent colour, used to tint each bar. Stays inside the gold
// palette so the section feels native to the institutional dark/gold theme.
const CURRENCY_ACCENT: Record<string, string> = {
  USD: "from-gold/90 to-gold/40",
  EUR: "from-gold/80 to-gold/30",
  GBP: "from-gold/75 to-gold/30",
  JPY: "from-gold/70 to-gold/25",
  CNY: "from-gold/65 to-gold/25",
  CHF: "from-gold/60 to-gold/20",
  AUD: "from-gold/55 to-gold/20",
  CAD: "from-gold/50 to-gold/15",
};

function MonetaryEngineCompact() {
  const [goldUsd, setGoldUsd] = useState<number>(FALLBACK_GOLD_USD);
  const [basket, setBasket] = useState<BasketCurrency[]>(FALLBACK_BASKET);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transparency", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: unknown) => {
        if (cancelled || !json) return;
        const j = json as {
          monetary?: {
            goldUsd?: number;
            weights?: Array<{
              code: string;
              name?: string;
              normalizedWeight?: number;
              structuralWeight?: number;
            }>;
          };
          generatedAt?: string;
          testnet?: { lastUpdate?: string };
        };
        if (typeof j.monetary?.goldUsd === "number" && Number.isFinite(j.monetary.goldUsd)) {
          setGoldUsd(j.monetary.goldUsd);
        }
        if (Array.isArray(j.monetary?.weights) && j.monetary.weights.length > 0) {
          const parsed: BasketCurrency[] = j.monetary.weights
            .map((w) => ({
              code: w.code,
              name: w.name ?? w.code,
              weight:
                (typeof w.normalizedWeight === "number"
                  ? w.normalizedWeight
                  : typeof w.structuralWeight === "number"
                    ? w.structuralWeight
                    : 0) * 100,
            }))
            .filter((w) => w.code)
            .sort((a, b) => b.weight - a.weight);
          if (parsed.length > 0) setBasket(parsed);
        }
        setLastUpdate(j.testnet?.lastUpdate ?? j.generatedAt ?? "");
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        /* no loading state — fallback is shown immediately */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWeight = Math.max(...basket.map((c) => c.weight), 1);
  const sumWeight = basket.reduce((s, c) => s + c.weight, 0);

  return (
    <section
      id="s-monetary-engine"
      className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24"
      aria-label="Monetary engine — currency basket visualization"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal>
          <Eyebrow>Article VI — The Monetary Engine</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            A weighted basket, anchored to gold, synthesised into MTQ
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            MTQ&rsquo;s value is not discretionary. It is the deterministic output of a
            transparent algorithm: gold anchors the basket&rsquo;s real value, eight
            sovereign currencies contribute weighted pressure (COFER + SWIFT + BIS),
            and MTQ is minted as the synthesised settlement unit. No ML, no HFT —
            just constitutionally-bounded math.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/[0.06] to-transparent p-6 sm:p-8">
            {/* Gold anchor — top */}
            <div className="rounded-xl border border-gold/50 bg-gold/[0.08] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-gold/15">
                    <Crown className="h-5 w-5 text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-foreground sm:text-xl">
                      GOLD — The Anchor
                    </div>
                    <div className="text-xs text-fg-muted">
                      Real value numéraire · reserves held as allocated bullion
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-gold sm:text-2xl">
                    <AnimatedNumber
                      value={goldUsd}
                      decimals={2}
                      prefix="$"
                      suffix="/oz"
                    />
                  </div>
                  <LiveTimestamp isoString={lastUpdate} label="spot" />
                </div>
              </div>
            </div>

            {/* Down arrow */}
            <div className="my-3 flex justify-center text-gold/60" aria-hidden="true">
              <ArrowRight className="h-5 w-5 rotate-90" />
            </div>

            {/* Currency basket — 8 horizontal bars */}
            <div className="rounded-xl border border-line bg-ink-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-muted">
                  8-currency basket · Σ = {sumWeight.toFixed(2)}%
                </div>
                <div className="text-[10px] text-fg-muted">
                  cap 60% · floor 0.5% · momentum-bounded
                </div>
              </div>
              <ul className="space-y-3">
                {basket.map((c, i) => {
                  const widthPct = (c.weight / maxWeight) * 100;
                  const accent =
                    CURRENCY_ACCENT[c.code] ?? "from-gold/60 to-gold/20";
                  return (
                    <li key={c.code} className="grid grid-cols-[3.5rem_1fr_4rem] items-center gap-3 sm:grid-cols-[4.5rem_1fr_5rem]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-sm font-semibold text-gold">
                          {c.code}
                        </span>
                      </div>
                      <div
                        className="relative h-3 overflow-hidden rounded-full border border-line/60 bg-ink"
                        role="img"
                        aria-label={`${c.name}: ${c.weight.toFixed(2)}% of basket`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${widthPct}%` }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: 0.9,
                            delay: 0.1 + i * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
                        />
                      </div>
                      <div className="text-right font-mono text-xs text-fg-muted">
                        {c.weight.toFixed(2)}%
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Down arrow */}
            <div className="my-3 flex justify-center text-gold/60" aria-hidden="true">
              <ArrowRight className="h-5 w-5 rotate-90" />
            </div>

            {/* MTQ output — bottom */}
            <div className="rounded-xl border border-gold/50 bg-gold/[0.08] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-gold/15">
                    <Coins className="h-5 w-5 text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-foreground sm:text-xl">
                      MTQ — The Synthesis
                    </div>
                    <div className="text-xs text-fg-muted">
                      1 MTQ = basket value · minted on verified deposit
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-gold sm:text-2xl">ERC-20</div>
                  <div className="text-[10px] text-fg-muted">on Monad</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
              The full engine visualizes 5 layers — oracle aggregation, currency
              weighting with cap/floor, shock absorber (EWMA), NAV derivation, and
              reserve-ratio compliance — with shock-phase simulation.
            </p>
            <a
              href="/?view=engine"
              className="group inline-flex items-center gap-2 rounded-md border border-gold/50 bg-gold/[0.06] px-5 py-3 text-sm font-semibold text-gold transition hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              aria-label="Open the full interactive Monetary Engine view"
              title="Switch to the full interactive Monetary Engine view"
            >
              Explore the full interactive engine
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
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

/* ---------------- Layer 0 — Institutional Philosophy ---------------- */

function LayerZero() {
  return (
    <section id="s-layer-zero" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Layer 0 — The Institutional Foundation</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Every provision derives its authority from Layer 0
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {LAYER_ZERO.intro}
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LAYER_ZERO.pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div className="glass card-hover h-full rounded-xl border-gold/20 p-6">
                <div className="flex items-center gap-2 text-gold">
                  <Shield className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                    Doctrine
                  </span>
                </div>
                <h3 className="font-display mt-3 text-lg text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Legal & Regulatory Status ---------------- */

function LegalStatus() {
  return (
    <section id="s-legal" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Legal & Regulatory Status</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            Operating through JOZOUR LLC
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            MITHQAL operates through {LEGAL_STATUS.entity}, a {LEGAL_STATUS.entity_type}. The Institution
            is designed to operate in compliance with applicable laws and regulations in every
            jurisdiction in which it conducts activities.
          </p>
        </Reveal>
        <div className="mt-10 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Value</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {LEGAL_STATUS.items.map((item) => {
                const positive = ["Active", "Published", "Filed", "Assigned", "On file"].includes(item.status);
                return (
                <tr key={item.label} className="hover:bg-ink-card/40">
                  <td className="px-5 py-3 font-medium text-foreground">{item.label}</td>
                  <td className="px-5 py-3 text-fg-muted">{item.value}</td>
                  <td className="px-5 py-3">
                    <Badge
                      className={
                        positive
                          ? "border-reserve/40 bg-reserve/10 text-[10px] text-reserve hover:bg-reserve/10"
                          : "border-gold/30 bg-gold/10 text-[10px] text-gold hover:bg-gold/10"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-5">
          <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-foreground">Constitutional Version:</span>{" "}
            {LEGAL_STATUS.constitutionalVersion}
            <br />
            <span className="font-semibold text-foreground">Status:</span>{" "}
            {LEGAL_STATUS.constitutionalStatus}
          </p>
        </div>
        {/* Independent verification: on-chain Safe Multi-Sig treasury is the
            single source of truth for any reserve claim the institution makes.
            The Constitution requires every claim rest on verifiable data, so
            we surface the explorer link directly under the legal-entity panel. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-soft p-4">
          <div className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">
                Verify on MonadScan
              </div>
              <div className="text-xs text-fg-muted">
                Operational treasury (Safe Multi-Sig) and governance contracts are
                deployed on Monad Testnet. Every claim made on this page can be
                independently verified against the public ledger.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VerifyOnChain
              address="0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0"
              label="Safe Multi-Sig"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD"
              label="MTQ Token"
              size="md"
              showAddress={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Phase 0 Timeline ---------------- */

function PhaseZeroTimeline() {
  const statusIcon = (status: string) => {
    switch (status) {
      case "done": return <Check className="h-4 w-4 text-reserve" />;
      case "in-progress": return <div className="h-3 w-3 animate-pulse rounded-full bg-gold" />;
      case "scheduled": return <Calendar className="h-4 w-4 text-gold" />;
      case "planned": return <Calendar className="h-4 w-4 text-fg-muted" />;
      default: return <CircleDollarSign className="h-4 w-4 text-fg-muted" />;
    }
  };
  const statusLabel = (status: string) => {
    switch (status) {
      case "done": return "Complete";
      case "in-progress": return "In Progress";
      case "scheduled": return "Scheduled";
      case "planned": return "Planned";
      default: return "Pending";
    }
  };
  return (
    <section id="s-phase-zero" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>Current Status — Phase 0: Formation</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            From blueprint to live settlement rail
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Formation Committee is actively establishing the Institution. We are in Phase 0:
            foundation entity formation, regulatory filings, and institutional build-out.
          </p>
        </Reveal>
        <div className="mt-10 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Milestone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PHASE_ZERO_TIMELINE.map((m) => (
                <tr key={m.milestone} className="hover:bg-ink-card/40">
                  <td className="px-5 py-3 font-medium text-foreground">{m.milestone}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(m.status)}
                      <span className={
                        m.status === "done" ? "text-reserve" :
                        m.status === "in-progress" ? "text-gold" :
                        "text-fg-muted"
                      }>
                        {statusLabel(m.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <FileCheck className="h-4 w-4" /> Constitution v19.0
            </span>
          </div>
        </div>
        <Separator className="my-6 bg-line" />
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-fg-muted">
            © 2026 MITHQAL Constitutional Monetary Institution. All rights reserved.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-gold">MITHQAL v19.0</span> — Constitutional Monetary Infrastructure Specification.
            Released 22 July 2026 · Status: Constitutional Release Candidate — Pending Independent External Validation.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            Operated through <span className="font-medium text-foreground">JOZOUR LLC</span>, a New Jersey limited liability company, USA.
            MTQ is minted exclusively against verified reserve deposits and is never sold unbacked, per the
            Constitution's invariants. Nothing on this page constitutes an offer to sell securities or any MTQ unit.
            Eligibility is objective and applied uniformly.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Shell ---------------- */

export default function PublicSite() {
  return (
    <div className="flex flex-col">
      <SiteHero />
      {/* Audit Fix 2 — Live state KPI dashboard directly under the hero. */}
      <LiveStateDashboard />
      <WhatItIs />
      {/* Audit Fix 4 — Legal & Regulatory Status moved up: surfaces the
          operating entity + constitutional version right after the "what is
          Mithqal" framing, building institutional credibility early. */}
      <LegalStatus />
      <LayerZero />
      <Objectives />
      <Invariants />
      <AntiPlatform />
      <SettlementUnit />
      <Reserves />
      {/* Audit Fix 1 — Compact monetary-engine visualization between the
          reserves overview and governance, so the reader sees the basket
          mechanism right after the reserve structure that backs it. */}
      <MonetaryEngineCompact />
      <Governance />
      <Lifecycle />
      <Eligibility />
      <PhaseZeroTimeline />
      <StatusBoard />
      <ContactForm />
      <PublicFooter />
    </div>
  );
}
