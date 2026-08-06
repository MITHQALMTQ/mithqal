"use client";

/* ============================================================
 * InstitutionalEconomics — Chapter XX §XX.4 (Task 14-a)
 * ------------------------------------------------------------
 * Public-facing institutional economics explainer.
 *
 * Layout:
 *   §1  Header
 *   §2  Entity flow diagram — Foundation → Holding → Operations/Markets
 *        → Reserve → Participants (CSS-based, no chart library)
 *   §3  Revenue flow illustration — how fiat flows in and where it goes
 *   §4  Reserve integrity explanation — what protects the reserve
 *   §5  Entity responsibilities breakdown — 4 entity cards with duties
 *
 * Theming: institutional palette only — NO indigo/blue.
 *
 * Task ID: 14-a  ·  Agent: Chief Enterprise Software Engineer
 * ============================================================ */

import { motion } from "framer-motion";
import {
  Crown,
  Building2,
  Cog,
  Briefcase,
  Lock,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  Layers,
  Scale,
  Gavel,
  Eye,
  Coins,
  Banknote,
  Vault,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

/* ---------- shared local helpers ---------- */

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
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
      <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
        {children}
      </span>
    </div>
  );
}

/* ============================================================
 * Static data — 4 entities + their economic role
 * ============================================================ */

interface EntityRole {
  id: "foundation" | "holding" | "operations" | "markets";
  name: string;
  shortName: string;
  icon: typeof Crown;
  accent: string;
  ring: string;
  role: string;
  fundsFlow: string;
  responsibilities: string[];
  article: string;
}

// All four entities below are PLANNED — see docs/legal/institutional-principles.md.
// The current operating entity is JOZOUR LLC (NJ). UI surfaces the PLANNED badge.
const ENTITIES: EntityRole[] = [
  {
    id: "foundation",
    name: "MITHQAL Foundation",
    shortName: "Foundation",
    icon: Crown,
    accent: "text-gold",
    ring: "border-gold/40 bg-gold/5",
    role: "Constitutional oversight",
    fundsFlow: "Receives no commercial revenue. Funds training grants from a separate endowment.",
    responsibilities: [
      "Constitutional Council convening",
      "Reserve integrity protection",
      "Public trust stewardship",
      "Constitutional standards enforcement",
    ],
    article: "§XX.3.1",
  },
  {
    id: "holding",
    name: "MITHQAL Holding Company",
    shortName: "Holding",
    icon: Building2,
    accent: "text-reserve",
    ring: "border-reserve/40 bg-reserve/5",
    role: "Strategic ownership",
    fundsFlow: "Receives licensing + professional-services revenue (15% commercial share).",
    responsibilities: [
      "Strategic capital allocation",
      "Corporate governance",
      "Subsidiary oversight",
      "Licensing agreements",
    ],
    article: "§XX.3.2",
  },
  {
    id: "operations",
    name: "MITHQAL Operations Ltd.",
    shortName: "Operations",
    icon: Cog,
    accent: "text-fg-muted",
    ring: "border-line bg-ink-soft/40",
    role: "Technology + settlement",
    fundsFlow: "Receives mint/redeem/API/enterprise revenue (part of 15% commercial share).",
    responsibilities: [
      "Technology infrastructure",
      "API platform + settlement",
      "AI assistant",
      "Platform maintenance",
    ],
    article: "§XX.3.3",
  },
  {
    id: "markets",
    name: "MITHQAL Markets Ltd.",
    shortName: "Markets",
    icon: Briefcase,
    accent: "text-gold-deep",
    ring: "border-gold-deep/40 bg-gold-deep/5",
    role: "Reserve procurement",
    fundsFlow: "Receives 25% performance participation + execution fees. ONLY entity that touches reserves.",
    responsibilities: [
      "Gold + silver procurement",
      "Best execution + custody coordination",
      "Reserve rebalancing",
      "Dealer relationship management",
    ],
    article: "§XX.3.4",
  },
];

/* ============================================================
 * Main component
 * ============================================================ */

export function InstitutionalEconomics() {
  return (
    <section
      id="institutional-economics"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="ie-heading"
    >
      <Reveal>
        <Eyebrow>Chapter XX · §XX.4 Institutional Economics</Eyebrow>
        <h2
          id="ie-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Institutional Economics
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-fg-muted sm:text-base">
          The Mithqal Institution is structured as four constitutionally
          separated legal entities. Funds flow in from commercial activity,
          through the procurement pipeline, into the reserve, and back to
          participants via redemption. Every step is governed, audited, and
          disclosed.
        </p>

        {/* TARGET-architecture notice — required by institutional-principles.md */}
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          <strong className="font-semibold">TARGET architecture.</strong>{" "}
          The organizational structure below represents the TARGET
          architecture. Currently, MITHQAL is operated by{" "}
          <strong>JOZOUR LLC</strong> (New Jersey). Planned entities do not
          yet exist and are not currently operating. See{" "}
          <code className="rounded bg-ink-soft px-1 py-0.5">docs/legal/institutional-principles.md</code>{" "}
          for the canonical rules.
        </div>
      </Reveal>

      {/* ---- §2 Entity flow diagram ---- */}
      <Reveal delay={0.1}>
        <Card className="mt-8 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-gold" aria-hidden="true" />
              Entity Flow Diagram
            </CardTitle>
            <CardDescription>
              Constitutional authority flows top-down; commercial funds flow
              bottom-up. The reserve is ring-fenced — only Markets touches it,
              and only on behalf of the Institution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Row 1: Foundation */}
              <FlowNode
                icon={Crown}
                label="MITHQAL Foundation"
                sub="Non-profit · Constitutional Council"
                article="§XX.3.1"
                accent="gold"
                hint="Constitutional oversight"
                planned
              />

              <FlowConnector label="Constitutional authority" />

              {/* Row 2: Holding */}
              <FlowNode
                icon={Building2}
                label="MITHQAL Holding Company"
                sub="For-profit · Board of Directors"
                article="§XX.3.2"
                accent="reserve"
                hint="Strategic ownership"
                planned
              />

              <FlowConnector label="Strategic direction" split />

              {/* Row 3: Operations + Markets (split) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FlowNode
                  icon={Cog}
                  label="MITHQAL Operations Ltd."
                  sub="Operational · CTO"
                  article="§XX.3.3"
                  accent="muted"
                  hint="Technology + settlement"
                  compact
                  planned
                />
                <FlowNode
                  icon={Briefcase}
                  label="MITHQAL Markets Ltd."
                  sub="Commercial · Markets Committee"
                  article="§XX.3.4"
                  accent="gold-deep"
                  hint="Reserve procurement"
                  compact
                  planned
                />
              </div>

              <FlowConnector label="Procurement + custody" />

              {/* Row 4: Reserve (the ring-fenced layer) */}
              <div className="rounded-xl border-2 border-reserve/40 bg-reserve/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-reserve/40 bg-reserve/10 p-2.5">
                      <Vault className="h-5 w-5 text-reserve" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Constitutional Reserve Pool
                      </div>
                      <div className="text-xs text-fg-muted">
                        Gold · silver · sovereign · stablecoin · sukuk — segregated
                      </div>
                    </div>
                  </div>
                  <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                    <Lock className="h-3 w-3" /> Ring-fenced
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                  Reserve assets are held in segregated custody under the
                  Constitutional Reserve Framework through approved custodian
                  institutions for the exclusive benefit of the MITHQAL reserve
                  system. They are never operating assets and never corporate
                  assets of JOZOUR LLC or any future operating entity. Every
                  MTQ in circulation is backed 1:1 (≥102%) by assets in this
                  pool. (Markets Ltd. is the planned procurement entity; it
                  does not yet exist.)
                </p>
              </div>

              <FlowConnector label="Proof of Reserve · redemption" />

              {/* Row 5: Participants */}
              <FlowNode
                icon={Users}
                label="MTQ Participants"
                sub="Minters · redeemers · holders · merchants"
                article="§XX.2"
                accent="gold"
                hint="Always-on redemption"
              />
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §3 Revenue flow ---- */}
      <Reveal delay={0.15}>
        <Card className="mt-6 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-gold" aria-hidden="true" />
              Revenue Flow
            </CardTitle>
            <CardDescription>
              How fiat enters the Institution, flows through commercial
              activity, and lands in the reserve or commercial revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FlowStep
                step={1}
                icon={Banknote}
                title="Participant deposits fiat"
                description="Fiat enters via mint (5 bps fee). MTQ is minted 1:1 against the prevailing NAV."
              />
              <FlowArrow />
              <FlowStep
                step={2}
                icon={Cog}
                title="Operations processes the mint"
                description="Fee revenue (capped at $5K) accrues to Operations. Mint fee funds settlement + platform."
              />
              <FlowArrow />
              <FlowStep
                step={3}
                icon={Briefcase}
                title="Markets procures reserves"
                description="The minted fiat is sent to Markets, which initiates the 12-stage procurement workflow (RFQ → best execution → settlement → custody)."
              />
              <FlowArrow />
              <FlowStep
                step={4}
                icon={Scale}
                title="Best execution + savings"
                description="If execution beats the constitutional benchmark, savings emerge. 60% → reserve growth, 25% → Markets, 15% → commercial revenue."
              />
              <FlowArrow />
              <FlowStep
                step={5}
                icon={Vault}
                title="Reserve assets enter custody"
                description="Gold/silver/sovereign delivered to segregated custody. Proof of Reserve updated. MTQ supply now backed by the new asset."
              />
              <FlowArrow />
              <FlowStep
                step={6}
                icon={Users}
                title="Participant redeems (always-on)"
                description="MTQ is burned; reserve asset is liquidated at NAV; fiat is returned. Redeem fee (5 bps, cap $5K) accrues to Operations."
              />
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §4 Reserve integrity ---- */}
      <Reveal delay={0.2}>
        <Card className="mt-6 border-reserve/30 bg-reserve/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-reserve" aria-hidden="true" />
              Reserve Integrity
            </CardTitle>
            <CardDescription>
              Five constitutional guardrails protect the reserve at all times.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: Lock,
                  title: "Segregation",
                  body: "Reserve assets are held in segregated custody accounts — never commingled with operational funds.",
                },
                {
                  icon: Eye,
                  title: "Public Proof",
                  body: "Proof of Reserve is published daily with on-chain attestation. Every MTQ is auditable back to a reserve asset.",
                },
                {
                  icon: Gavel,
                  title: "Constitutional Lock",
                  body: "The Foundation may block any reserve transaction that violates the constitution. Reserve integrity supersedes commercial interest.",
                },
                {
                  icon: ShieldCheck,
                  title: "102% Floor",
                  body: "Reserve ratio never falls below 102%. Minting pauses if RR < 102%; redemption remains always-on regardless.",
                },
                {
                  icon: Vault,
                  title: "Multi-Custodian",
                  body: "Reserves are split across multiple institutional custodians to eliminate single-custodian risk.",
                },
              ].map((g) => {
                const Icon = g.icon;
                return (
                  <div
                    key={g.title}
                    className="rounded-lg border border-reserve/20 bg-ink-soft/40 p-3"
                  >
                    <div className="flex items-center gap-2 text-reserve">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {g.title}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-fg-muted">
                      {g.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §5 Entity responsibilities ---- */}
      <Reveal delay={0.25}>
        <div className="mt-8">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Entity Responsibilities
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            Each entity has a strictly scoped constitutional mandate. No entity
            may exceed its mandate; the Foundation enforces this.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ENTITIES.map((e, i) => {
              const Icon = e.icon;
              return (
                <Reveal key={e.id} delay={i * 0.05}>
                  <Card className={`h-full bg-ink-card/60 ${e.ring}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`rounded-lg border p-2 ${e.ring}`}>
                          <Icon className={`h-4 w-4 ${e.accent}`} aria-hidden="true" />
                        </div>
                        <Badge className="border-line bg-ink-soft text-fg-muted">
                          {e.article}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-sm font-semibold text-foreground">
                        <span className="flex items-center gap-2">
                          <span>{e.name}</span>
                          <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200">
                            PLANNED
                          </Badge>
                        </span>
                      </CardTitle>
                      <CardDescription className="text-[11px] uppercase tracking-wider text-fg-muted">
                        {e.role}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] leading-snug text-fg-muted">
                        {e.fundsFlow}
                      </p>
                      <ul className="mt-3 space-y-1">
                        {e.responsibilities.map((r) => (
                          <li
                            key={r}
                            className="flex items-start gap-1.5 text-[11px] text-foreground"
                          >
                            <CheckCircle2
                              className="mt-0.5 h-3 w-3 shrink-0 text-reserve"
                              aria-hidden="true"
                            />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <p className="mt-8 text-center text-xs text-fg-muted">
          Constitutional reference:{" "}
          <code className="rounded bg-ink-soft px-1.5 py-0.5 text-gold">§XX.3 · §XX.4 · §XX.13</code>{" "}
          · Reserve ratio floor:{" "}
          <code className="rounded bg-ink-soft px-1.5 py-0.5 text-reserve">102%</code>
        </p>
      </Reveal>
    </section>
  );
}

/* ============================================================
 * Sub-components for the flow diagram
 * ============================================================ */

function FlowNode({
  icon: Icon,
  label,
  sub,
  article,
  accent,
  hint,
  compact = false,
  planned = false,
}: {
  icon: typeof Crown;
  label: string;
  sub: string;
  article: string;
  accent: "gold" | "reserve" | "gold-deep" | "muted";
  hint: string;
  compact?: boolean;
  planned?: boolean;
}) {
  const accentClass =
    accent === "gold"
      ? "text-gold border-gold/30 bg-gold/5"
      : accent === "reserve"
        ? "text-reserve border-reserve/30 bg-reserve/5"
        : accent === "gold-deep"
          ? "text-gold-deep border-gold-deep/30 bg-gold-deep/5"
          : "text-fg-muted border-line bg-ink-soft/40";
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${accentClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`rounded-lg border p-2 shrink-0 ${accentClass}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"} flex items-center gap-2 flex-wrap`}>
              <span>{label}</span>
              {planned && (
                <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200 text-[9px]">
                  PLANNED
                </Badge>
              )}
            </div>
            <div className="truncate text-xs text-fg-muted">{sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-fg-muted">{hint}</span>
          <Badge className="border-line bg-ink-soft text-fg-muted">{article}</Badge>
        </div>
      </div>
    </div>
  );
}

function FlowConnector({ label, split = false }: { label: string; split?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <ArrowDown className="h-4 w-4 text-fg-muted" aria-hidden="true" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-fg-muted">{label}</span>
      {split && (
        <div className="mt-1 h-px w-24 bg-gradient-to-r from-transparent via-line to-transparent" aria-hidden="true" />
      )}
    </div>
  );
}

function FlowStep({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: typeof Coins;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-ink-soft/40 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-mono text-xs font-semibold tabular-nums text-gold">
        {step}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <p className="mt-1 text-xs leading-snug text-fg-muted">{description}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5">
      <ArrowRight className="h-4 w-4 rotate-90 text-fg-muted" aria-hidden="true" />
    </div>
  );
}
