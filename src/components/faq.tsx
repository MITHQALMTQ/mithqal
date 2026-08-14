"use client";

/**
 * FAQ — Frequently Asked Questions (Part 2 of Task FREE).
 *
 * A searchable, accordion-style FAQ covering the 20 most-asked questions
 * about Mithqal — what it is, how it differs from USDT/USDC, how reserves
 * are verified, the Constitution, Sharia compliance, fees, the Brain AI,
 * the wallet connection flow, and the amendment procedure.
 *
 * Design:
 *   - Search input at the top filters questions by keyword (title +
 *     answer + tags). Empty query shows all questions.
 *   - Each question is a button that toggles an AnimatePresence-powered
 *     expand/collapse panel (chevron rotates 90° on open).
 *   - Category pills above the search filter by topic; "All" is default.
 *   - Uses the existing dark/gold theme tokens (bg-ink, bg-ink-soft,
 *     bg-ink-card, border-line, text-gold, text-fg-muted, gold-text).
 *   - Reuses the shared Reveal component for scroll-triggered entrance.
 *   - "use client" so the useState + AnimatePresence run client-side.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  HelpCircle,
  X,
  ExternalLink,
  Shield,
  Banknote,
  Scale,
  Landmark,
  Coins,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";

/* ---------- FAQ data ---------- */

type Category =
  | "Identity"
  | "Reserves"
  | "Governance"
  | "Operations"
  | "Technical";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: Category;
  tags?: string[];
}

const FAQS: FaqItem[] = [
  {
    id: "what-is-mithqal",
    question: "What is Mithqal?",
    answer:
      "A constitutional settlement institution that issues MTQ, a fully-reserved settlement unit for cross-border trade. Mithqal is constitutionally non-platform: it operates no exchange, no DeFi product, and no retail offering — by constitutional invariant.",
    category: "Identity",
    tags: ["intro", "overview", "mission"],
  },
  {
    id: "is-mtq-stablecoin",
    question: "Is MTQ a stablecoin?",
    answer:
      "No. MTQ is a constitutional settlement unit. Unlike stablecoins, it is governed by an immutable Constitution — not by a company's discretion. The reserve ratio, fee schedule, and basket weights are all defined by spec, not by board vote.",
    category: "Identity",
    tags: ["stablecoin", "definition"],
  },
  {
    id: "what-backs-mtq",
    question: "What backs MTQ?",
    answer:
      "100%+ reserves across fiat (70-80%), bullion (15-25%), and stablecoins (2-8%), verified on-chain daily. The exact composition is published on the Transparency page in real time, and a cryptographic Proof of Reserves is generated every 24 hours.",
    category: "Reserves",
    tags: ["backing", "reserves", "por", "proof"],
  },
  {
    id: "diff-usdt-usdc",
    question: "How is MTQ different from USDT/USDC?",
    answer:
      "MTQ is constitutionally non-platform (no exchange, no DeFi, no retail product), constitutionally frozen against drift, and governed by a Council — not a company board. USDT and USDC are issued by companies that can change their reserves, freeze balances, or pivot their business model. MTQ cannot — those powers are constitutionally removed by the Constitution.",
    category: "Identity",
    tags: ["usdt", "usdc", "comparison", "competitor"],
  },
  {
    id: "can-i-invest",
    question: "Can I invest in MTQ?",
    answer:
      "No. MTQ is never sold unbacked. You can mint MTQ by depositing eligible reserves, or invest in the Operating Company (Entity B) via equity. The entire ICO/IDO/IEO playbook is forbidden by the Constitution — by constitutional invariant.",
    category: "Operations",
    tags: ["invest", "ico", "equity", "fundraising"],
  },
  {
    id: "what-is-nav",
    question: "What is the NAV?",
    answer:
      "Net Asset Value = Reserve Value / Supply. Three NAVs are published: Market (mark-to-market), Prudential (after haircuts), and Stress (liquidation). The prudential NAV is the one used for the reserve ratio invariant (≥100%).",
    category: "Reserves",
    tags: ["nav", "valuation", "price"],
  },
  {
    id: "currency-weights",
    question: "How are currency weights determined?",
    answer:
      "Algorithmically, based on IMF COFER (50%), SWIFT (40%), and BIS (10%) data. No human discretion. Each currency's structural weight is then adjusted by momentum, mean-reversion, and liquidity overlays — but the cap (60% for USD) and floor (0.5%) are constitutional and cannot be waived.",
    category: "Technical",
    tags: ["basket", "weights", "cofer", "swift", "bis"],
  },
  {
    id: "why-gold-anchor",
    question: "Why is gold the anchor?",
    answer:
      "Gold has no central bank, no issuer, and nothing to gain from inflating itself. It is the one measurement nobody can manipulate. The Mithqal Constitution uses gold as the numeraire — every currency's weight is measured against its 12-month price vs gold, not against USD.",
    category: "Reserves",
    tags: ["gold", "anchor", "numeraire"],
  },
  {
    id: "fees",
    question: "What are the fees?",
    answer:
      "Mint: 0.05% (cap $5,000). Redeem: 0.05% (cap $5,000). Transfer: 0.01% (cap $1,000). Custody: 0.10%/yr. The fee schedule is defined in §9 of the Constitution — the caps are constitutional and cannot be raised without an amendment.",
    category: "Operations",
    tags: ["fees", "cost", "mint", "redeem", "transfer"],
  },
  {
    id: "can-minting-pause",
    question: "Can minting be paused?",
    answer:
      "Only transfers and minting can be paused (emergency). Burning/redeeming is NEVER pausable — it is a constitutional right. If the reserve ratio drops below 100%, minting auto-pauses (the on-chain contract enforces this), but redemption remains available 24/7.",
    category: "Governance",
    tags: ["pause", "emergency", "redeem", "burn"],
  },
  {
    id: "what-is-constitution",
    question: "What is the Constitution?",
    answer:
      "A 1.46M-character specification (v24.2.1) covering 57 sections across 6 parts: math, currency engine, reserves, oracles, governance, and compliance. It is the supreme law of the Institution — every operational decision must trace back to a clause in it. Read it on the Constitution view.",
    category: "Governance",
    tags: ["constitution", "spec", "v19", "law"],
  },
  {
    id: "sharia-compliant",
    question: "Is Mithqal Sharia-compliant?",
    answer:
      "Yes. No interest (riba), no speculation (gharar), no prohibited assets. Governed by AAOIFI standards. The Constitution explicitly prohibits lending at interest, derivative exposure, and any asset backed by haram activity — these are invariants, not policy.",
    category: "Governance",
    tags: ["sharia", "islamic", "aaoifi", "riba"],
  },
  {
    id: "what-network",
    question: "What network is MTQ on?",
    answer:
      "Monad Testnet (Chain ID 10143). Mainnet planned for Q3 2027. The contracts (MTQ token, Governance, Safe Multi-Sig) are deployed and verifiable on MonadScan — see the Contracts view or the footer link.",
    category: "Technical",
    tags: ["monad", "blockchain", "testnet", "chain", "mainnet"],
  },
  {
    id: "verify-reserves",
    question: "How can I verify the reserves?",
    answer:
      "Visit the Transparency page for live data, or check the on-chain contracts on MonadScan. Proof of Reserves is generated daily — the hash is reproducible from the public mint/redeem ledger. Anyone can audit it. That is the point.",
    category: "Reserves",
    tags: ["verify", "audit", "proof", "transparency", "por"],
  },
  {
    id: "formation-committee",
    question: "What is the Formation Committee?",
    answer:
      "The group of investors, advisors, and anchor participants who will form the initial Council and seat the Institution. Membership is by application — submit interest via the public site. Identities remain private until the Committee convenes.",
    category: "Governance",
    tags: ["council", "formation", "investors", "advisors"],
  },
  {
    id: "is-this-ico",
    question: "Is this an ICO?",
    answer:
      "No. The entire ICO/IDO/IEO playbook is forbidden by the Constitution — by constitutional invariant. Fundraising occurs through Entity B (equity), not through MTQ. MTQ is minted only against verified reserves; it is never sold unbacked to raise capital.",
    category: "Operations",
    tags: ["ico", "ido", "ieo", "token sale", "fundraising"],
  },
  {
    id: "brain-ai",
    question: "What is the Mithqal Brain AI?",
    answer:
      "A multi-model AI system (Gemini + HuggingFace + Groq) that provides risk monitoring, KYC screening, and anomaly detection — in consensus. All three models must agree on a finding before it is flagged; disagreement triggers human review. See the Brain view.",
    category: "Technical",
    tags: ["ai", "brain", "gemini", "groq", "huggingface", "risk"],
  },
  {
    id: "connect-wallet",
    question: "How do I connect my wallet?",
    answer:
      "Click \"Connect Wallet\" on the OS page. Supports MetaMask, Coinbase Wallet, WalletConnect (200+ mobile wallets — Coming soon, requires operator to configure the project ID), and any injected Web3 wallet. The wallet is only used to sign on-chain transactions — no private keys ever leave the user's device.",
    category: "Operations",
    tags: ["wallet", "metamask", "coinbase", "walletconnect", "connect"],
  },
  {
    id: "reserve-ratio",
    question: "What is the reserve ratio?",
    answer:
      "Reserve Ratio = Adjusted Reserve / (Supply × PAR), where PAR = $1.00. Must be ≥100% at all times (constitutional invariant). If it dips below, minting auto-pauses until it recovers. Redemption remains available regardless — it is a constitutional right that cannot be suspended.",
    category: "Reserves",
    tags: ["reserve ratio", "rr", "solvency", "invariant"],
  },
  {
    id: "amend-constitution",
    question: "Can the Constitution be amended?",
    answer:
      "Yes, through a supermajority Council vote + independent review. But the 10 on-chain invariants (§45) are non-amendable — non-amendable. These include the non-platform clause, the 100% reserve requirement, the prohibition on unbacked minting, and the redemption-never-paused rule. No vote can ever override them.",
    category: "Governance",
    tags: ["amend", "invariants", "frozen", "council", "vote"],
  },
];

/* ---------- Category metadata ---------- */

const CATEGORIES: { id: Category | "All"; label: string; icon: typeof Shield }[] = [
  { id: "All", label: "All", icon: HelpCircle },
  { id: "Identity", label: "Identity", icon: Landmark },
  { id: "Reserves", label: "Reserves", icon: Banknote },
  { id: "Governance", label: "Governance", icon: Scale },
  { id: "Operations", label: "Operations", icon: Coins },
  { id: "Technical", label: "Technical", icon: Cpu },
];

/* ---------- helpers ---------- */

function matchesQuery(item: FaqItem, q: string): boolean {
  if (!q) return true;
  const haystack = [
    item.question,
    item.answer,
    item.category,
    ...(item.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  // Support multi-word queries: every space-separated token must match.
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

/* ---------- the component ---------- */

export default function FAQ() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FAQS.filter((f) => {
      const inCat = activeCategory === "All" || f.category === activeCategory;
      const inQuery = matchesQuery(f, query);
      return inCat && inQuery;
    });
  }, [query, activeCategory]);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="grain-bg min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-10 pt-12 sm:px-8 sm:pb-12 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_12%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-4xl">
          <Reveal>
            <div className="flex items-center gap-2">
              <Badge className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/10">
                <HelpCircle className="mr-1.5 h-3 w-3" />
                FAQ
              </Badge>
              <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
                {FAQS.length} questions · v24.2.1
              </Badge>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-6 flex items-center gap-4">
              <Logo className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
              <div>
                <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
                  <span className="gold-text">Frequently Asked</span>
                </h1>
                <p className="mt-2 font-display text-base text-fg-muted sm:text-xl">
                  The 20 questions every visitor asks — answered in plain language.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
              Mithqal is governed by a 1.46M-character Constitution, but the
              essentials fit on one page. Browse by category, search by
              keyword, or read top to bottom. If your question isn&apos;t
              here, the Constitution view has the canonical answer.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Controls: search + category pills */}
      <section className="mx-auto w-full max-w-4xl px-5 pb-6 sm:px-8">
        <Reveal>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search questions — try "reserve", "sharia", "fees"…'
              className="w-full rounded-lg border border-line bg-ink py-3 pl-10 pr-10 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              aria-label="Search FAQ"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted transition hover:bg-ink-card hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = activeCategory === c.id;
              const Icon = c.icon;
              const count =
                c.id === "All"
                  ? FAQS.length
                  : FAQS.filter((f) => f.category === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-gold bg-gold text-ink"
                      : "border-line bg-ink-card text-fg-muted hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                      active ? "bg-ink/20 text-ink" : "bg-ink text-fg-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* Question list */}
      <section className="mx-auto w-full max-w-4xl px-5 pb-20 sm:px-8">
        <Reveal>
          <div className="rounded-2xl border border-line bg-ink-soft/60">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <HelpCircle className="mx-auto h-10 w-10 text-fg-muted/60" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No questions match &ldquo;{query}&rdquo;
                  {activeCategory !== "All" ? ` in ${activeCategory}` : ""}.
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  Try a different keyword, or clear the search to see all{" "}
                  {FAQS.length} questions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-ink-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
                >
                  <X className="h-3.5 w-3.5" /> Reset filters
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {filtered.map((item, idx) => {
                  const isOpen = openId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${item.id}`}
                        className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-ink-card/40 sm:px-6 sm:py-5"
                      >
                        <span className="mt-0.5 font-mono text-[10px] font-bold tabular-nums text-gold/60">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-base font-medium text-foreground sm:text-lg">
                            {item.question}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                            <CategoryIcon category={item.category} />
                            {item.category}
                          </span>
                        </span>
                        <ChevronDown
                          className={`mt-1 h-5 w-5 shrink-0 text-fg-muted transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-gold" : ""
                          }`}
                          aria-hidden
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen ? (
                          <motion.div
                            id={`faq-panel-${item.id}`}
                            key="panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pl-14 pr-6 sm:px-6 sm:pb-6 sm:pl-16">
                              <p className="text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
                                {item.answer}
                              </p>
                              {item.tags && item.tags.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {item.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full border border-line bg-ink px-2 py-0.5 font-mono text-[10px] text-fg-muted"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>

        {/* Still have questions? CTA */}
        <Reveal delay={0.05}>
          <div className="mt-8 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] to-ink-soft p-6 text-center sm:p-8">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">
              Still have questions?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              The Constitution view contains the canonical, citable answer to
              every operational question. The Transparency page shows the live
              data behind every claim made here.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href="/?view=constitution#preamble"
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
              >
                <Scale className="h-4 w-4" />
                Read the Constitution
              </a>
              <a
                href="/?view=transparency"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
              >
                <Banknote className="h-4 w-4" />
                View live reserves
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </Reveal>

        <Separator className="my-8 bg-line" />
        <p className="text-center text-[10px] leading-relaxed text-fg-muted">
          {FAQS.length} questions · {CATEGORIES.length - 1} categories · Mithqal v24.2.1
          Constitutional Settlement Institution. Nothing here constitutes an
          offer to sell securities or any MTQ unit.
        </p>
      </section>
    </div>
  );
}

/* Category icon picker — small visual cue next to the category label. */
function CategoryIcon({ category }: { category: Category }) {
  switch (category) {
    case "Identity":
      return <Landmark className="h-3 w-3" aria-hidden />;
    case "Reserves":
      return <Banknote className="h-3 w-3" aria-hidden />;
    case "Governance":
      return <Scale className="h-3 w-3" aria-hidden />;
    case "Operations":
      return <Coins className="h-3 w-3" aria-hidden />;
    case "Technical":
      return <Cpu className="h-3 w-3" aria-hidden />;
    default:
      return <HelpCircle className="h-3 w-3" aria-hidden />;
  }
}
