"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Shield,
  Landmark,
  Building2,
  Layers,
  Target,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  Crown,
  Banknote,
  FileText,
  Globe,
  Lock,
  TrendingUp,
  CircleDollarSign,
  Users,
  Calendar,
  Download,
  Quote,
  Scale,
  Boxes,
  Wallet,
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  STATUS,
  INVARIANTS,
  ENTITIES,
  PHASES,
  SPRINT,
  FUNDING_SOURCES,
  RISKS,
  MOAT,
  POSITIONING,
  NEXT_ACTIONS,
} from "@/lib/playbook-data";

/* ------------------------------------------------------------------ */
/*  Primitives                                                        */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
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
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-gold">
      <span className="h-px w-8 bg-gold/60" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
        {children}
      </span>
    </div>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {title}
          </h2>
          {intro ? (
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
              {intro}
            </p>
          ) : null}
        </Reveal>
        <div className="mt-10 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Seal                                                               */
/* ------------------------------------------------------------------ */

function Seal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold-soft)" />
          <stop offset="55%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--gold-deep)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="url(#gld)" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="url(#gld)" strokeWidth="0.7" opacity="0.6" />
      <g stroke="url(#gld)" strokeWidth="0.8" opacity="0.85">
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const x1 = 60 + Math.cos(a) * 49;
          const y1 = 60 + Math.sin(a) * 49;
          const x2 = 60 + Math.cos(a) * 44;
          const y2 = 60 + Math.sin(a) * 44;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <text
        x="60"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize="34"
        fontWeight="600"
        fill="url(#gld)"
      >
        M
      </text>
      <text
        x="60"
        y="82"
        textAnchor="middle"
        fontFamily="var(--font-geist-sans), sans-serif"
        fontSize="6"
        letterSpacing="3"
        fill="url(#gld)"
        opacity="0.8"
      >
        MITHQAL
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Top nav                                                            */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: "status", label: "Status" },
  { id: "truth", label: "Reality" },
  { id: "architecture", label: "Architecture" },
  { id: "positioning", label: "Positioning" },
  { id: "funding", label: "Funding" },
  { id: "roadmap", label: "Roadmap" },
  { id: "sprint", label: "90-Day" },
  { id: "moat", label: "Moat" },
  { id: "risks", label: "Risks" },
  { id: "actions", label: "Actions" },
];

function TopNav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const ids = ["top", ...NAV.map((n) => n.id)];
    const onScroll = () => {
      let cur = "top";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-50 border-b border-line/60 bg-ink/85 backdrop-blur-xl">
      <motion.div
        style={{ scaleX }}
        className="absolute left-0 top-0 h-[2px] w-full origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-soft"
      />
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <button
          onClick={() => go("top")}
          className="flex items-center gap-2.5"
          aria-label="Mithqal — top"
        >
          <Seal className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-wide text-foreground">
            MITHQAL
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] text-fg-muted sm:inline">
            Execution Playbook
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active === n.id
                  ? "bg-gold/12 text-gold"
                  : "text-fg-muted hover:text-foreground"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden items-center gap-1.5 rounded-md border border-line bg-ink-card px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-gold/50 hover:text-gold sm:flex"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-line p-2 text-foreground lg:hidden"
            aria-label="Menu"
          >
            <div className="space-y-1">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {open ? (
        <nav className="grid grid-cols-2 gap-1 border-t border-line/60 px-5 py-3 lg:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className="rounded-md px-3 py-2 text-left text-[13px] font-medium text-fg-muted hover:bg-ink-card hover:text-foreground"
            >
              {n.label}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden grain-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <Reveal>
          <div className="flex items-center gap-2">
            <Badge className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/10">
              v18 FINAL · Consolidated Specification
            </Badge>
            <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
              Prepared for the COO / PM
            </Badge>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Seal className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              <span className="gold-text">Mithqal</span>
              <span className="block text-2xl font-normal text-fg-muted sm:text-3xl">
                a constitutional settlement institution
              </span>
            </h1>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted sm:text-xl">
            A fully-reserved, neutral rail for cross-border trade — built on an
            institution-grade Constitution. We have <span className="text-gold">no company,
            no team, no budget</span>. We have the single most valuable thing a monetary
            institution can hold: a credible, un-gameable blueprint. This is the A-to-Z
            plan to convert that blueprint into capital, custody and a live settlement rail.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              onClick={() =>
                document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" })
              }
              className="group inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink shadow-[0_0_0_1px_color-mix(in_oklch,var(--gold)_40%,transparent),0_8px_30px_-10px_var(--gold)] transition hover:bg-gold-soft"
            >
              Read the roadmap
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() =>
                document.getElementById("actions")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
            >
              Start this week
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-line px-5 py-3 text-sm font-semibold text-fg-muted transition hover:text-foreground"
            >
              <Download className="h-4 w-4" /> Save as PDF
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[
              { k: "Blueprint", v: "v18 FINAL", s: "850k-char Constitution" },
              { k: "Capital", v: "$0", s: "Zero budget — sweat equity" },
              { k: "Entity", v: "None", s: "No company, yet" },
              { k: "Target raise", v: "$0.25–8M", s: "Pre-seed → Seed (Entity B)" },
            ].map((c) => (
              <div key={c.k} className="bg-ink-soft p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
                  {c.k}
                </div>
                <div className="font-display mt-2 text-2xl text-foreground">{c.v}</div>
                <div className="mt-1 text-xs text-fg-muted">{c.s}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <div className="gold-rule h-px w-full" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Status snapshot                                                    */
/* ------------------------------------------------------------------ */

function StatusSection() {
  return (
    <SectionShell
      id="status"
      eyebrow="Where we stand"
      title={<>We are honest about the starting line</>}
      intro="Mithqal is not a 10-page whitepaper. It is an institution-grade constitutional specification. But an institution is not a specification. Here is exactly what we hold — and exactly what is missing."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
            <div className="flex items-center gap-2 text-reserve">
              <Check className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                What we hold
              </span>
            </div>
            <ul className="mt-5 space-y-4">
              {STATUS.have.map((h) => (
                <li key={h.label} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-reserve" />
                  <div>
                    <div className="font-medium text-foreground">{h.label}</div>
                    <div className="text-sm text-fg-muted">{h.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
            <div className="flex items-center gap-2 text-gold">
              <X className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                What is missing
              </span>
            </div>
            <ul className="mt-5 space-y-4">
              {STATUS.missing.map((m) => (
                <li key={m.label} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <div>
                    <div className="font-medium text-foreground">{m.label}</div>
                    <div className="text-sm text-fg-muted">{m.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] p-6">
          <Quote className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-[15px] leading-relaxed text-foreground">
            The asset is not the token, the brand or the GitHub. The asset is the{" "}
            <span className="text-gold">constitutional credibility</span> the blueprint
            already encodes. Every step in this plan is engineered to convert that
            credibility into capital, custody, and a live reserve — without ever selling
            a single unbacked unit of MTQ.
          </p>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  The brutal truth — invariants                                      */
/* ------------------------------------------------------------------ */

function TruthSection() {
  return (
    <SectionShell
      id="truth"
      eyebrow="The brutal truth"
      title={
        <>
          You cannot fundraise by{" "}
          <span className="gold-text">selling MTQ</span>
        </>
      }
      intro="The Constitution forbids it — permanently. The entire crypto fundraising playbook (ICO / IDO / IEO / liquidity mining / airdrop farming) is off the table by design. That is not a weakness. It is the single feature that makes Mithqal legitimate. Internalise these five invariants — they define the entire strategy."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {INVARIANTS.map((inv, i) => (
          <Reveal key={inv.k} delay={i * 0.05}>
            <div className="print-card group h-full rounded-xl border border-line bg-ink-soft p-6 transition-colors hover:border-gold/40">
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-gold" />
                <h3 className="font-display text-lg text-foreground">{inv.k}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{inv.v}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-6 rounded-xl border border-line bg-ink-card p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold text-foreground">Consequence:</span>
            <span className="text-fg-muted">
              fundraising must flow through a
            </span>
            <span className="font-semibold text-gold">separate equity vehicle</span>
            <span className="text-fg-muted">— not the monetary institution, and never via MTQ.</span>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Three-entity architecture                                          */
/* ------------------------------------------------------------------ */

function ArchitectureSection() {
  return (
    <SectionShell
      id="architecture"
      eyebrow="The structural unlock"
      title={
        <>
          A three-entity split makes fundraising{" "}
          <span className="gold-text">possible</span>
        </>
      }
      intro="The Institution must stay neutral and non-profit — it cannot take equity or distribute profit without destroying itself. So we separate the monetary authority from the commercial engineering company. Investors buy into the company, not the institution. This is the single most important structural decision in the entire plan."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {ENTITIES.map((e, i) => (
          <Reveal key={e.tag} delay={i * 0.08}>
            <div
              className={`print-card relative h-full overflow-hidden rounded-2xl border p-6 sm:p-7 ${
                e.raiseHere
                  ? "border-gold/50 bg-gold/[0.06]"
                  : "border-line bg-ink-soft"
              }`}
            >
              {e.raiseHere ? (
                <span className="absolute right-5 top-5 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                  Raise here
                </span>
              ) : null}
              <div className="flex items-center gap-3">
                <span className="font-display flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-ink-card text-lg font-semibold text-gold">
                  {e.tag}
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
                    Entity {e.tag}
                  </div>
                  <div className="text-xs text-fg-muted">{e.type}</div>
                </div>
              </div>
              <h3 className="font-display mt-5 text-xl text-foreground">{e.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{e.purpose}</p>
              <Separator className="my-5 bg-line" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Funded by
              </div>
              <p className="mt-1.5 text-sm text-foreground">{e.fundedBy}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12}>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Scale,
              t: "Neutrality preserved",
              d: "The Institution never touches investor money or profit, so its settlement decisions stay unbiased.",
            },
            {
              icon: Banknote,
              t: "Investors get real equity",
              d: "Entity B is a normal company — shares, options, dividends, an eventual exit. Fundable by VCs and angels.",
            },
            {
              icon: Layers,
              t: "Clean regulatory surface",
              d: "The Institution is a utility; the company is a vendor. Regulators can licence each on its own terms.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-line bg-ink-soft p-5">
              <c.icon className="h-5 w-5 text-gold" />
              <div className="mt-3 font-semibold text-foreground">{c.t}</div>
              <p className="mt-1.5 text-sm text-fg-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Positioning reframe                                                */
/* ------------------------------------------------------------------ */

function PositioningSection() {
  return (
    <SectionShell
      id="positioning"
      eyebrow="Reframing the mission"
      title={
        <>
          “#1 choice for traders” becomes{" "}
          <span className="gold-text">#1 neutral settlement rail</span>
        </>
      }
      intro="Chasing retail speculation would violate the no-speculation invariant and invite regulatory catastrophe. The real users of Mithqal are institutions — banks, trade-finance platforms, corporates, eventually CBDCs. Success is measured in reserve-backed supply, settling participants and settlement volume — never token price action."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="print-card h-full rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
            <div className="flex items-center gap-2 text-gold">
              <X className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                Mithqal is NOT
              </span>
            </div>
            <ul className="mt-5 space-y-3">
              {POSITIONING.not.map((n) => (
                <li key={n} className="flex items-center gap-3 text-sm text-fg-muted">
                  <span className="h-1 w-1 rounded-full bg-gold/60" />
                  <span className="line-through decoration-gold/40">{n}</span>
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
                Mithqal IS
              </span>
            </div>
            <ul className="mt-5 space-y-3">
              {POSITIONING.is.map((n) => (
                <li key={n} className="flex items-start gap-3 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reserve" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <p className="mt-6 text-center font-display text-xl text-fg-muted sm:text-2xl">
          The positioning is the{" "}
          <span className="text-gold">T-bill of crypto settlement</span> — boring,
          neutral, over-collateralised. That is what institutions actually want.
        </p>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Funding sources                                                    */
/* ------------------------------------------------------------------ */

function FundingSection() {
  return (
    <SectionShell
      id="funding"
      eyebrow="Where the money comes from"
      title={
        <>
          Six sources, sequenced — not{" "}
          <span className="gold-text">a token sale</span>
        </>
      }
      intro="Every dollar enters the Operating Company (Entity B) as equity, or the Institution (Entity A) as a grant or reserve deposit. None of it mints MTQ. Ranked from most accessible at zero budget to the end-state of self-sustaining fee revenue."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FUNDING_SOURCES.map((s, i) => (
          <Reveal key={s.who} delay={i * 0.05}>
            <div className="print-card flex h-full flex-col rounded-xl border border-line bg-ink-soft p-6">
              <div className="flex items-start justify-between gap-3">
                <CircleDollarSign className="h-5 w-5 shrink-0 text-gold" />
                <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                  {s.dilution}
                </Badge>
              </div>
              <h3 className="font-display mt-4 text-lg text-foreground">{s.who}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">{s.why}</p>
              <div className="mt-4 rounded-md bg-ink-card px-3 py-2 text-sm">
                <span className="text-[11px] uppercase tracking-wider text-fg-muted">
                  Ticket
                </span>{" "}
                <span className="font-semibold text-gold">{s.ticket}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-6 rounded-xl border border-line bg-ink-card p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <TrendingUp className="h-4 w-4 text-reserve" />
            <span className="font-semibold text-foreground">End state:</span>
            <span className="text-fg-muted">
              the Institution self-funds from mint / redeem / transfer / custody fees
              (0.01–0.20%) — and the Operating Company from its service contract. No
              perpetual dilution, no token to pump.
            </span>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Roadmap                                                            */
/* ------------------------------------------------------------------ */

function RoadmapSection() {
  return (
    <SectionShell
      id="roadmap"
      eyebrow="The five phases"
      title={
        <>
          From zero budget to a live settlement rail in{" "}
          <span className="gold-text">~30 months</span>
        </>
      }
      intro="Built directly on the Constitution's own Institutional Lifecycle (Formation → Operation → Expansion). Each phase has one capital milestone, one structural milestone, and one KPI. Capital enters Entity B (equity) and Entity A (grants/reserves) — never as MTQ."
    >
      <div className="relative">
        <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-gold via-gold/40 to-transparent sm:left-[26px]" />
        <div className="space-y-5">
          {PHASES.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.04}>
              <div className="relative pl-14 sm:pl-16">
                <span className="absolute left-0 top-1 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-ink text-sm font-bold text-gold sm:h-[52px] sm:w-[52px]">
                  {i}
                </span>
                <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-gold/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
                      {p.n}
                    </span>
                    <h3 className="font-display text-xl text-foreground sm:text-2xl">
                      {p.title}
                    </h3>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-fg-muted">
                      <Calendar className="h-3.5 w-3.5" /> {p.window}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-md border border-line bg-ink-card px-2.5 py-1 text-xs text-fg-muted">
                      Capital: <span className="text-foreground">{p.capital}</span>
                    </span>
                    <span className="rounded-md border border-line bg-ink-card px-2.5 py-1 text-xs text-fg-muted">
                      Raise: <span className="text-gold">{p.raise}</span>
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-fg-muted">{p.goal}</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {p.milestones.map((m) => (
                      <div
                        key={m}
                        className="flex items-start gap-2 rounded-lg bg-ink-card px-3 py-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reserve" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-2 text-xs text-foreground">
                    <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    <span>
                      <span className="font-semibold text-gold">KPI:</span> {p.kpi}
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  90-day sprint                                                      */
/* ------------------------------------------------------------------ */

function SprintSection() {
  return (
    <SectionShell
      id="sprint"
      eyebrow="The next 90 days"
      title={
        <>
          Zero-budget sprint —{" "}
          <span className="gold-text">week by week</span>
        </>
      }
      intro="No capital required for the first 12 weeks. The deliverable of this sprint is a Term-Sheet-ready narrative: a live testnet, a public Constitution, named advisors and an open data room."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SPRINT.map((s, i) => (
          <Reveal key={s.week} delay={i * 0.04}>
            <div className="print-card flex h-full flex-col rounded-xl border border-line bg-ink-soft p-5">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
                    {s.week}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{s.focus}</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {s.tasks.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-fg-muted">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Moat                                                               */
/* ------------------------------------------------------------------ */

function MoatSection() {
  return (
    <SectionShell
      id="moat"
      eyebrow="Becoming #1"
      title={
        <>
          The moat is{" "}
          <span className="gold-text">credibility you cannot fake</span>
        </>
      }
      intro="Technology is copyable. Marketing is bought. The thing USDT, USDC and every commercial stablecoin structurally cannot replicate is a permanently-frozen anti-platform Constitution with verifiable 100%+ reserves. That is how Mithqal becomes the default neutral settlement rail."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MOAT.map((m, i) => (
          <Reveal key={m.title} delay={i * 0.05}>
            <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6">
              <Shield className="h-5 w-5 text-gold" />
              <h3 className="font-display mt-4 text-lg text-foreground">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{m.body}</p>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.25}>
          <div className="flex h-full flex-col justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-gold/[0.1] to-transparent p-6">
            <Crown className="h-5 w-5 text-gold" />
            <p className="mt-4 font-display text-lg text-foreground">
              The wedge
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              Be the most boring, most audited, most over-collateralised settlement unit
              in crypto. Institutions do not want alpha from their settlement rail — they
              want finality, neutrality and a guarantee it cannot be corrupted.
            </p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Risks                                                              */
/* ------------------------------------------------------------------ */

function RisksSection() {
  return (
    <SectionShell
      id="risks"
      eyebrow="Risk register"
      title={<>What kills us — and how we survive it</>}
      intro="A constitutional institution is a fortress, not a gamble. These are the eight ways this fails, and the structural mitigation already written into the blueprint for each."
    >
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="hidden grid-cols-12 gap-4 border-b border-line bg-ink-card px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted sm:grid">
          <div className="col-span-4">Risk</div>
          <div className="col-span-3">Impact</div>
          <div className="col-span-5">Mitigation (in the blueprint)</div>
        </div>
        <div className="divide-y divide-line">
          {RISKS.map((r, i) => (
            <Reveal key={r.risk} delay={i * 0.03}>
              <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-12 sm:gap-4">
                <div className="col-span-4 flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span className="text-sm font-medium text-foreground">{r.risk}</span>
                </div>
                <div className="col-span-3 text-sm text-fg-muted">{r.impact}</div>
                <div className="col-span-5 text-sm text-foreground">{r.mitigation}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Next actions + footer                                              */
/* ------------------------------------------------------------------ */

function ActionsSection() {
  return (
    <SectionShell
      id="actions"
      eyebrow="Start now"
      title={
        <>
          Your immediate next actions
        </>
      }
      intro="Everything below is executable this week with zero capital. Begin with the blueprint lock and the domain. End the week with a real operating company."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {NEXT_ACTIONS.map((a, i) => (
          <Reveal key={a.t} delay={i * 0.04}>
            <div className="flex items-start gap-3 rounded-xl border border-line bg-ink-soft p-5">
              <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-sm font-bold text-gold">
                {i + 1}
              </span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  {a.d}
                </div>
                <div className="mt-1 text-sm text-foreground">{a.t}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12}>
        <div className="mt-8 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/[0.12] via-ink-soft to-ink-soft p-8 sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-2xl text-foreground sm:text-3xl">
                The blueprint is the asset. Let&apos;s build the institution around it.
              </h3>
              <p className="mt-3 max-w-xl text-sm text-fg-muted">
                Lock the spec. Incorporate the operating company. Publish the Constitution.
                Ship the testnet. Open the data room. Close the pre-seed.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                onClick={() =>
                  document.getElementById("sprint")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
              >
                <Rocket className="h-4 w-4" /> Run the 90-day sprint
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
              >
                <Download className="h-4 w-4" /> Export PDF
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Seal className="h-9 w-9" />
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
              <Globe className="h-4 w-4" /> @MithqalMTQ
            </a>
            <a
              href="https://github.com/MITHQALMTQ/mithqal"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-gold"
            >
              <FileText className="h-4 w-4" /> GitHub
            </a>
            <span className="inline-flex items-center gap-1.5">
              <Boxes className="h-4 w-4" /> Blueprint v18
            </span>
          </div>
        </div>
        <Separator className="my-6 bg-line" />
        <p className="text-xs leading-relaxed text-fg-muted">
          This playbook is a strategic execution document derived from the Mithqal v18
          FINAL Consolidated Implementation Specification. It does not constitute an
          offer to sell securities or any MTQ unit. MTQ is minted exclusively against
          verified reserve deposits and is never sold unbacked, per the Constitution's
          invariants. All fundraising referenced herein occurs in a separate operating
          company, not the monetary institution.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Page() {
  return (
    <div className="print-page flex min-h-screen flex-col bg-ink text-foreground">
      <TopNav />
      <main className="flex-1">
        <Hero />
        <StatusSection />
        <TruthSection />
        <ArchitectureSection />
        <PositioningSection />
        <FundingSection />
        <RoadmapSection />
        <SprintSection />
        <MoatSection />
        <RisksSection />
        <ActionsSection />
      </main>
      <Footer />
    </div>
  );
}
