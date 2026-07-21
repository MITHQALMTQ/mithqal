"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Lock,
  ChevronRight,
  ChevronLeft,
  Layers,
  ScrollText,
  BookOpen,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LAYERS, ALL_ARTICLES, PREAMBLE, type Article } from "@/lib/constitution-data";

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
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

function Seal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gldC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold-soft)" />
          <stop offset="55%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--gold-deep)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="url(#gldC)" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="url(#gldC)" strokeWidth="0.7" opacity="0.6" />
      <text
        x="60"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize="34"
        fontWeight="600"
        fill="url(#gldC)"
      >
        M
      </text>
    </svg>
  );
}

export default function ConstitutionDocs() {
  const [activeId, setActiveId] = useState<string>("preamble");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ARTICLES;
    const q = query.toLowerCase();
    return ALL_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.purpose.toLowerCase().includes(q) ||
        a.number.toLowerCase().includes(q) ||
        a.sections?.some((s) => s.h.toLowerCase().includes(q) || s.p.toLowerCase().includes(q))
    );
  }, [query]);

  // Build the ordered list of navigable items: preamble + all articles.
  const navItems = useMemo(
    () => [
      { id: "preamble", label: "Preamble", layer: "Identity" },
      ...ALL_ARTICLES.map((a) => ({
        id: a.id,
        label: `${a.number}: ${a.title}`,
        layer: a.layerName,
      })),
    ],
    []
  );

  const currentIndex = navItems.findIndex((n) => n.id === activeId);
  const prev = currentIndex > 0 ? navItems[currentIndex - 1] : null;
  const next = currentIndex < navItems.length - 1 ? navItems[currentIndex + 1] : null;

  const go = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeArticle = ALL_ARTICLES.find((a) => a.id === activeId);
  const activeLayer = activeArticle
    ? LAYERS.find((l) => l.id === activeArticle.layerId)
    : null;

  return (
    <div className="grain-bg min-h-screen">
      {/* Top bar */}
      <header className="sticky top-[45px] z-40 border-b border-line/60 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-md border border-line p-2 text-foreground lg:hidden"
              aria-label="Toggle contents"
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <ScrollText className="h-5 w-5 text-gold" />
              <div>
                <div className="font-display text-sm font-semibold text-foreground sm:text-base">
                  The Constitution
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                  v18 FINAL · citable reference
                </div>
              </div>
            </div>
          </div>
          <div className="relative hidden max-w-xs flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full rounded-md border border-line bg-ink py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        {/* Sidebar */}
        <aside
          className={`no-print fixed inset-y-0 left-0 top-[109px] z-30 w-80 shrink-0 overflow-y-auto border-r border-line bg-ink-soft/95 backdrop-blur-xl transition-transform lg:sticky lg:top-[109px] lg:h-[calc(100vh-109px)] lg:translate-x-0 lg:bg-transparent ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
                Contents
              </span>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-fg-muted" />
              </button>
            </div>
            <button
              onClick={() => go("preamble")}
              className={`mb-4 block w-full rounded-md px-3 py-2 text-left text-sm transition ${
                activeId === "preamble"
                  ? "bg-gold/12 text-gold"
                  : "text-fg-muted hover:bg-ink-card hover:text-foreground"
              }`}
            >
              <span className="font-display">Preamble</span>
              <span className="block text-[10px] uppercase tracking-wider opacity-70">
                Identity & Mission
              </span>
            </button>
            <nav className="space-y-5">
              {LAYERS.map((layer) => {
                const layerArticles = filtered.filter((a) => a.layerId === layer.id);
                if (query && layerArticles.length === 0) return null;
                return (
                  <div key={layer.id}>
                    <div className="mb-2 flex items-center gap-2 px-3">
                      <Layers className="h-3.5 w-3.5 text-gold/70" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-muted">
                        {layer.label} · {layer.name}
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {layerArticles.map((a) => (
                        <li key={a.id}>
                          <button
                            onClick={() => go(a.id)}
                            className={`block w-full rounded-md px-3 py-1.5 text-left text-[13px] leading-snug transition ${
                              activeId === a.id
                                ? "bg-gold/12 text-gold"
                                : "text-fg-muted hover:bg-ink-card hover:text-foreground"
                            }`}
                          >
                            <span className="font-medium">{a.number}</span>
                            <span className="ml-1.5">{a.title}</span>
                            {a.frozen ? (
                              <Lock className="ml-1.5 inline h-3 w-3 align-text-bottom text-gold/60" />
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {query && filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-fg-muted">
                  No articles match &ldquo;{query}&rdquo;.
                </p>
              ) : null}
            </nav>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen ? (
          <div
            className="no-print fixed inset-0 top-[109px] z-20 bg-ink/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        {/* Reading pane */}
        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto w-full max-w-3xl">
            {activeId === "preamble" ? (
              <Preamble />
            ) : activeArticle ? (
              <ArticleView article={activeArticle} layerName={activeLayer?.name ?? ""} />
            ) : null}

            {/* Prev / Next */}
            <Separator className="my-10 bg-line" />
            <div className="flex items-stretch justify-between gap-4">
              {prev ? (
                <button
                  onClick={() => go(prev.id)}
                  className="group flex flex-1 items-center gap-3 rounded-xl border border-line bg-ink-soft p-4 text-left transition hover:border-gold/40"
                >
                  <ChevronLeft className="h-5 w-5 shrink-0 text-fg-muted transition group-hover:text-gold" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted">
                      Previous
                    </div>
                    <div className="truncate text-sm font-medium text-foreground">
                      {prev.label}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex-1" />
              )}
              {next ? (
                <button
                  onClick={() => go(next.id)}
                  className="group flex flex-1 items-center justify-end gap-3 rounded-xl border border-line bg-ink-soft p-4 text-right transition hover:border-gold/40"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted">
                      Next
                    </div>
                    <div className="truncate text-sm font-medium text-foreground">
                      {next.label}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-fg-muted transition group-hover:text-gold" />
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>

            {/* Footer */}
            <div className="mt-12 rounded-xl border border-line bg-ink-soft/50 p-5 text-xs leading-relaxed text-fg-muted">
              <div className="flex items-center gap-2 text-gold">
                <ScrollText className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                  Citation
                </span>
              </div>
              <p className="mt-2">
                Mithqal Constitution v18 FINAL — {activeLayer?.name ?? "Institutional Constitution"}
                {activeArticle ? `, ${activeArticle.number}: ${activeArticle.title}` : ", Preamble"}.
                The full specification is version-controlled at{" "}
                <a
                  href="https://github.com/MITHQALMTQ/mithqal"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-gold hover:underline"
                >
                  github.com/MITHQALMTQ <ExternalLink className="h-3 w-3" />
                </a>
                . Anti-platform and invariant provisions are permanently frozen and not subject to amendment.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---- Preamble view ---- */

function Preamble() {
  return (
    <Reveal>
      <div className="flex items-center gap-4">
        <Seal className="h-14 w-14 shrink-0" />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            Preamble
          </div>
          <h1 className="font-display text-3xl leading-tight text-balance sm:text-5xl">
            The Constitutional Mandate
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-6">
        <div>
          <h2 className="font-display text-lg text-gold">Identity</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
            {PREAMBLE.identity}
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-gold">Mission</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
            {PREAMBLE.mission}
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-gold">Institutional Humility</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
            {PREAMBLE.humility}
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-gold">What It Is Not</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {PREAMBLE.not.map((n) => (
              <li
                key={n}
                className="flex items-center gap-2 rounded-lg border border-line bg-ink-soft px-3 py-2 text-sm text-fg-muted"
              >
                <X className="h-3.5 w-3.5 shrink-0 text-gold/60" />
                {n}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-gold/30 bg-gold/[0.06] p-5">
          <p className="text-sm leading-relaxed text-foreground">
            The Constitution is organised in <span className="text-gold">four layers</span>:
            Institutional (the identity), Monetary (the unit), Governance & Policy (the rules),
            and Technical (the implementation), with a fifth Operations layer. Each layer is
            independent — if one evolves, the others persist. Use the contents to navigate all{" "}
            <span className="text-gold">{ALL_ARTICLES.length} articles</span>.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ---- Article view ---- */

function ArticleView({
  article,
  layerName,
}: {
  article: Article & { layerId?: string };
  layerName: string;
}) {
  return (
    <Reveal>
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
        {layerName}
      </div>
      <h1 className="font-display mt-3 text-3xl leading-tight text-balance sm:text-4xl">
        <span className="text-fg-muted">{article.number}:</span>{" "}
        <span className="text-foreground">{article.title}</span>
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {article.frozen ? (
          <Badge className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/10">
            <Lock className="mr-1 h-3 w-3" /> Permanently frozen
          </Badge>
        ) : null}
        {article.sections ? (
          <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
            {article.sections.length} provisions
          </Badge>
        ) : (
          <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
            Index entry
          </Badge>
        )}
      </div>
      <p className="mt-6 text-lg leading-relaxed text-foreground/90">{article.purpose}</p>

      {article.sections ? (
        <div className="mt-10 space-y-8">
          <Separator className="bg-line" />
          {article.sections.map((s, i) => (
            <div key={i} className="scroll-mt-32">
              <h2 className="font-display text-xl text-gold sm:text-2xl">{s.h}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{s.p}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-line bg-ink-soft/50 p-5">
          <p className="text-sm leading-relaxed text-fg-muted">
            This article is part of the {layerName}. The full provisions are defined in the
            v18 FINAL specification. The summary above captures its purpose; detailed
            provisions are being progressively published.
          </p>
        </div>
      )}
    </Reveal>
  );
}
