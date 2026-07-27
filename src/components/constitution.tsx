"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Layers,
  ScrollText,
  BookOpen,
  X,
  ExternalLink,
  Link2,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LAYERS, ALL_ARTICLES, PREAMBLE, type Article } from "@/lib/constitution-data";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";

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


export default function ConstitutionDocs() {
  const [activeId, setActiveId] = useState<string>("preamble");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // P1: hash routing — read #article-<id> on mount + hashchange. Lets users
  // deep-link to a specific article (the "Copy link" button produces these).
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "preamble") {
        setActiveId("preamble");
      } else if (hash.startsWith("article-")) {
        const id = hash.slice("article-".length);
        const found = ALL_ARTICLES.find((a) => a.id === id);
        if (found) setActiveId(id);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

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
    // Update the URL hash without scrolling — the reading pane already
    // re-renders with the new article. This keeps the URL shareable.
    if (typeof window !== "undefined") {
      const newHash = id === "preamble" ? "#preamble" : `#article-${id}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
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
                  v19.0 · citable reference
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
        {/* Sidebar — TOC with active-article highlight (P1: also reflects
            the current scroll position within an article via SectionSpy) */}
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
                      {layerArticles.map((a) => {
                        const isActive = activeId === a.id;
                        return (
                          <li key={a.id}>
                            <button
                              onClick={() => go(a.id)}
                              className={`block w-full rounded-md px-3 py-1.5 text-left text-[13px] leading-snug transition ${
                                isActive
                                  ? "bg-gold/12 text-gold"
                                  : "text-fg-muted hover:bg-ink-card hover:text-foreground"
                              }`}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <span className="font-medium">{a.number}</span>
                              <span className="ml-1.5">{a.title}</span>
                              {a.frozen ? (
                                <Lock className="ml-1.5 inline h-3 w-3 align-text-bottom text-gold/60" />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
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
              <ArticleView
                key={activeArticle.id}
                article={activeArticle}
                layerName={activeLayer?.name ?? ""}
              />
            ) : null}

            {/* UI9 Fix 8 — Article progress indicator. Shows the current
                position in the 47-article sequence + a thin gold progress
                bar. Hidden on the preamble (currentIndex === 0 → 0 of 47). */}
            <div className="mt-10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                <span>
                  {activeId === "preamble"
                    ? "Preamble"
                    : `Article ${currentIndex} of ${ALL_ARTICLES.length}`}
                </span>
                <span className="font-mono tabular-nums text-gold">
                  {Math.round(
                    (currentIndex / Math.max(1, navItems.length - 1)) * 100
                  )}
                  % read
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink-card">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (currentIndex / Math.max(1, navItems.length - 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

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
                Mithqal Constitution v19.0 — {activeLayer?.name ?? "Institutional Constitution"}
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
        <Logo className="h-14 w-14 shrink-0" />
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

/* ---- Article view (P1: collapsible sections + copy link + in-page TOC) ---- */

function ArticleView({
  article,
  layerName,
}: {
  article: Article & { layerId?: string };
  layerName: string;
}) {
  const { toast } = useToast();
  // Track which sections are expanded. Default: all expanded.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  // Currently-visible section (scroll-spy) — highlighted in the in-page TOC.
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sections = article.sections ?? [];
  const allExpanded = collapsed.size === 0;

  const toggleSection = (i: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsed(new Set(sections.map((_, i) => i)));
  };
  const expandAll = () => {
    setCollapsed(new Set());
  };

  // Scroll-spy: observe each section heading, highlight the visible one.
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const idx = Number(visible[0].target.getAttribute("data-section-idx"));
          if (!Number.isNaN(idx)) setActiveSection(idx);
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections.length, article.id]);
  // Note: state reset on article change is handled by the parent passing a
  // `key={article.id}` prop — React remounts ArticleView, naturally
  // resetting `collapsed` and `activeSection` to their initial values.

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#article-${article.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: `Shareable URL for ${article.number}: ${article.title} is on your clipboard.`,
      });
    } catch {
      // Fallback for browsers without clipboard API.
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast({ title: "Link copied", description: "Shareable URL is on your clipboard." });
      } catch {
        toast({ title: "Copy failed", description: url, variant: "destructive" });
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <Reveal>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
            {sections.length > 0 ? (
              <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
                {sections.length} provisions
              </Badge>
            ) : (
              <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
                Index entry
              </Badge>
            )}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-ink-card px-2.5 py-1 text-[10px] font-medium text-fg-muted transition hover:border-gold/40 hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              aria-label={`Copy shareable link to ${article.number}: ${article.title}`}
              title="Copy shareable link to this article"
            >
              <Link2 className="h-3 w-3" /> Copy link
            </button>
          </div>
        </div>
      </div>
      <p className="mt-6 text-lg leading-relaxed text-foreground/90">{article.purpose}</p>

      {sections.length > 0 ? (
        <div className="mt-10 space-y-8">
          <Separator className="bg-line" />
          {/* In-page section TOC + collapse/expand controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                On this article:
              </span>
              {sections.map((s, i) => {
                const isActive = activeSection === i;
                return (
                  <a
                    key={i}
                    href={`#section-${i}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = sectionRefs.current[i];
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        // Update hash without jumping.
                        window.history.replaceState(null, "", `#section-${i}`);
                      }
                    }}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] transition ${
                      isActive
                        ? "border-gold/40 bg-gold/12 text-gold"
                        : "border-line bg-ink-card text-fg-muted hover:border-gold/30 hover:text-foreground"
                    }`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {s.h.split("·")[0].trim().split(" ")[0]}
                  </a>
                );
              })}
            </div>
            <button
              type="button"
              onClick={allExpanded ? collapseAll : expandAll}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-fg-muted transition hover:text-gold"
            >
              {allExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3 rotate-180" /> Collapse all
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Expand all
                </>
              )}
            </button>
          </div>

          {sections.map((s, i) => {
            const isCollapsed = collapsed.has(i);
            const isActive = activeSection === i;
            return (
              <div
                key={i}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                data-section-idx={i}
                id={`section-${i}`}
                className={`scroll-mt-32 rounded-lg border p-4 transition ${
                  isActive
                    ? "border-gold/30 bg-gold/[0.04]"
                    : "border-transparent hover:border-line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(i)}
                  aria-expanded={!isCollapsed}
                  aria-controls={`section-body-${i}`}
                  className="flex w-full items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gold transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-xl text-gold sm:text-2xl">{s.h}</h2>
                </button>
                {!isCollapsed ? (
                  <motion.p
                    key={`body-${i}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    id={`section-body-${i}`}
                    className="mt-3 overflow-hidden text-[15px] leading-relaxed text-foreground/90"
                  >
                    {s.p}
                  </motion.p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-line bg-ink-soft/50 p-5">
          <p className="text-sm leading-relaxed text-fg-muted">
            This article is part of the {layerName}. The full provisions are defined in the
            v19.0 specification. The summary above captures its purpose; detailed
            provisions are being progressively published.
          </p>
        </div>
      )}

      {/* Bottom copy-link confirmation row */}
      <div className="mt-8 flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-soft/50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] text-fg-muted">
          <Check className="h-3 w-3 text-reserve" aria-hidden="true" />
          <span>
            Article <span className="font-mono text-foreground">{article.id}</span> ·{" "}
            <button
              type="button"
              onClick={copyLink}
              className="text-gold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              copy shareable URL
            </button>
          </span>
        </div>
        {article.frozen ? (
          <Badge className="border-gold/40 bg-gold/10 text-[10px] text-gold hover:bg-gold/10">
            <Lock className="mr-1 h-2.5 w-2.5" /> Frozen · non-amendable
          </Badge>
        ) : null}
      </div>
    </Reveal>
  );
}
