"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Hexagon,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SLIDES, type Slide } from "@/lib/deck-data";
import { PdfDownload } from "@/components/pdf-download";
import { cn } from "@/lib/utils";

const TOTAL = SLIDES.length;
const PAD2 = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------------ */
/*  Presenter notes — per-slide talking points for the live presenter. */
/*  Authored from the v19.0 narrative; kept in the component so the     */
/*  data file stays presentation-format-only.                          */
/* ------------------------------------------------------------------ */

const PRESENTER_NOTES: Record<string, string> = {
  cover:
    "Open with conviction: this is an institutional settlement rail, not a token. Hold for 3 seconds. Do not pitch — establish credibility first.",
  thesis:
    "Lead with the analogy. Ask: 'What is the most boring, most trusted asset in traditional finance?' The answer is the T-bill. That is the wedge.",
  problem:
    "Do not name competitors by ticker. Frame the gap: 'Today, every settlement rail carries hidden risks.' Pause after the second bullet.",
  institution:
    "Emphasise 'permanently'. The anti-platform clause is frozen in the Constitution. This is the moat. Do not dwell on tech here — credibility first.",
  invariants:
    "Read all five aloud, slowly. Each one is a competitive moat against USDT/USDC. End with: 'These can never be broken, by any vote.'",
  mtq:
    "Walk through the spec table. The fee schedule is intentionally boring. Stress that NAV is anchored — not algorithmic.",
  reserves:
    "Pause on 'daily cryptographic Proof-of-Reserves'. This is what institutions ask for. Mention the 5-year independent constitutional review.",
  moat:
    "Credibility compounds. Each audit, each frozen clause, each Council seat filled is permanent. USDT/USDC structurally cannot copy this.",
  ask:
    "Be explicit: this is Entity B equity. MTQ is never sold. Lead investors co-design the cap table. Target close: 3 months. Soft-circles open now.",
  status:
    "Close on the Formation Committee. Ask for: advisor introductions, anchor candidate referrals, and pre-seed conversations. Then stop talking.",
};

function getPresenterNotes(slide: Slide): string {
  return PRESENTER_NOTES[slide.id] ?? "";
}

/* ------------------------------------------------------------------ */
/*  Slide body — shared by interactive viewer + print stack           */
/* ------------------------------------------------------------------ */

function SlideBody({
  slide,
  index,
  variant = "interactive",
}: {
  slide: Slide;
  index: number;
  variant?: "interactive" | "print";
}) {
  const isCover = slide.id === "cover";
  const isContact = slide.id === "status";
  const isFeature = isCover || isContact;

  return (
    <article
      className={cn(
        "relative flex h-full w-full flex-col",
        isFeature ? "items-center justify-center text-center" : "justify-center",
      )}
    >
      {/* Gold seal mark — corner */}
      <div
        className={cn(
          "pointer-events-none absolute flex items-center justify-center",
          isFeature
            ? "right-6 top-6 h-10 w-10 sm:h-12 sm:w-12"
            : "right-5 top-5 h-8 w-8 sm:right-7 sm:top-7 sm:h-10 sm:w-10",
        )}
        aria-hidden
      >
        <Hexagon
          className="absolute inset-0 h-full w-full text-gold/35"
          strokeWidth={1.25}
        />
        <span className="font-display text-[11px] font-semibold gold-text sm:text-sm">
          M
        </span>
      </div>

      {/* Eyebrow */}
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold sm:mb-5 sm:text-xs">
        {slide.eyebrow}
      </p>

      {/* Title */}
      <h2
        className={cn(
          "font-display font-medium leading-[1.05] text-balance",
          isFeature
            ? "text-3xl sm:text-5xl lg:text-6xl"
            : "text-2xl sm:text-4xl lg:text-[2.9rem]",
        )}
      >
        <span className="gold-text">{slide.title}</span>
      </h2>

      {/* Body */}
      {slide.body ? (
        <p
          className={cn(
            "mt-5 text-[15px] leading-relaxed text-fg-muted sm:mt-7 sm:text-lg",
            isFeature ? "max-w-2xl" : "max-w-2xl",
          )}
        >
          {slide.body}
        </p>
      ) : null}

      {/* Bullets */}
      {slide.bullets ? (
        <ul
          className={cn(
            "mt-7 space-y-3.5 sm:mt-9 sm:space-y-4",
            isFeature ? "max-w-2xl" : "max-w-2xl",
          )}
        >
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-left">
              <span
                className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"
                aria-hidden
              />
              <span className="text-[15px] leading-relaxed text-foreground/90 sm:text-base">
                {b}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Table */}
      {slide.table ? (
        <div className="mt-7 w-full max-w-2xl sm:mt-9">
          <dl className="divide-y divide-line/60 border-y border-line/60">
            {slide.table.rows.map(([spec, value], i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4 sm:py-3"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted sm:text-xs">
                  {spec}
                </dt>
                <dd className="text-[14px] text-foreground/95 sm:text-[15px]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {/* Footer */}
      {slide.footer ? (
        <p className="mt-7 max-w-2xl text-[12px] italic leading-relaxed text-fg-muted sm:mt-9 sm:text-[13px]">
          {slide.footer}
        </p>
      ) : null}

      {/* NOTE (audit fix, Task ID FIX · BUG 3): the per-slide counter badge
          ("01 / 10") that used to render here on feature slides has been
          removed — it duplicated the navigation counter shown next to the
          Prev/Next buttons below. Keep a single source of truth for the
          slide position to avoid the "01 / 10" + "01/10" double-counter. */}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main viewer                                                        */
/* ------------------------------------------------------------------ */

export default function InvestorDeck() {
  const [index, setIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const slide = SLIDES[index];
  const presenterNotes = getPresenterNotes(slide);

  const goTo = useCallback((next: number) => {
    setIndex((prev) => {
      const clamped = Math.max(0, Math.min(TOTAL - 1, next));
      return clamped === prev ? prev : clamped;
    });
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          setIndex((p) => Math.min(TOTAL - 1, p + 1));
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          setIndex((p) => Math.max(0, p - 1));
          break;
        case "Home":
          e.preventDefault();
          setIndex(0);
          break;
        case "End":
          e.preventDefault();
          setIndex(TOTAL - 1);
          break;
        case "n":
        case "N":
          // Toggle presenter notes
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setNotesOpen((v) => !v);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="print-page flex min-h-screen flex-col bg-ink text-foreground">
      {/* ===== Top bar (sticky, no-print) ===== */}
      <header className="no-print sticky top-0 z-40 border-b border-line/50 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ink-card">
              <Hexagon className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold sm:text-[11px]">
                Investor Teaser Deck
              </p>
              <p className="truncate text-[12px] text-fg-muted sm:text-[13px]">
                {slide.title.replace(/\.$/, "")}
              </p>
            </div>
          </div>
          <PdfDownload
            label="Download Deck as PDF"
            filename="mithqal-investor-deck.pdf"
            size="sm"
            variant="outline"
          />
        </div>
      </header>

      {/* ===== Interactive stage (no-print) ===== */}
      <section
        className="no-print flex flex-1 flex-col"
        aria-label="Slide viewer"
      >
        {/* Slide stage — horizontal scroll-snap container.
            The visible slide is set by the `index` state; the inner motion
            track translates left/right with a spring-like ease so the
            slide-in feels like a snap rather than a fade. */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
          <div
            className="print-card grain-bg relative flex min-h-[70vh] w-full overflow-hidden rounded-2xl border border-line/60 bg-ink-soft p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] sm:min-h-[78vh] sm:p-10 lg:p-14"
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
            }}
          >
            {/* subtle gold top rule */}
            <div className="gold-rule pointer-events-none absolute inset-x-0 top-0 h-px opacity-60" />

            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={slide.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -80, scale: 0.985 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
                className="flex h-full w-full"
              >
                <SlideBody slide={slide} index={index} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom chrome — eyebrow + counter (top row of controls) */}
          <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold sm:text-xs">
              {slide.eyebrow}
            </p>
            <p
              className="font-mono text-[11px] tabular-nums text-fg-muted sm:text-xs"
              aria-live="polite"
              aria-label={`Slide ${index + 1} of ${TOTAL}`}
            >
              <span className="text-foreground">{PAD2(index + 1)}</span>
              <span className="mx-1 text-fg-muted">/</span>
              <span>{PAD2(TOTAL)}</span>
            </p>
          </div>

          {/* Bottom chrome — dots + nav buttons */}
          <div className="mt-3 flex flex-col items-center gap-4 sm:mt-4 sm:flex-row sm:justify-between">
            {/* Progress dots */}
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="tablist"
              aria-label="Slide navigation"
            >
              {SLIDES.map((s, i) => {
                const active = i === index;
                return (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={active}
                    aria-label={`Go to slide ${i + 1}: ${s.title}`}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300",
                      active
                        ? "w-6 bg-gold"
                        : "w-2.5 bg-line hover:bg-gold-deep",
                    )}
                  />
                );
              })}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={index === 0}
                aria-label="Previous slide"
                className="h-10 min-w-11 px-4 text-foreground hover:bg-ink-card hover:text-gold disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={next}
                disabled={index === TOTAL - 1}
                aria-label="Next slide"
                className="h-10 min-w-11 border border-gold/50 bg-gold px-4 font-semibold text-ink hover:bg-gold-soft disabled:opacity-40"
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Presenter notes — expandable */}
          {presenterNotes ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-ink-soft">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                aria-expanded={notesOpen}
                aria-controls="presenter-notes-panel"
                className="no-print flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-card/60"
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  <StickyNote className="h-3.5 w-3.5" />
                  Presenter notes
                  <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-fg-muted">
                    · press N to toggle
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-fg-muted transition-transform duration-300",
                    notesOpen ? "rotate-180" : "rotate-0",
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {notesOpen ? (
                  <motion.div
                    id="presenter-notes-panel"
                    key="notes"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 pt-1 text-[13px] leading-relaxed text-fg-muted">
                      {presenterNotes}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          {/* Keyboard hint */}
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-fg-muted/70 sm:text-[11px]">
            Use ← → keys to navigate · Home / End to jump · N for presenter notes
          </p>
        </div>
      </section>

      {/* ===== Print-only stack — one slide per page ===== */}
      <div className="print-block hidden flex-col">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="print-card print:break-after-page flex min-h-screen w-full items-center justify-center bg-white p-10 sm:p-16"
          >
            <div className="flex h-full w-full max-w-4xl flex-col">
              <SlideBody slide={s} index={i} variant="print" />
              {/* Inline presenter notes in print output */}
              {getPresenterNotes(s) ? (
                <div className="mt-8 border-t border-line pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                    Presenter notes
                  </p>
                  <p className="mt-1 text-[12px] italic leading-relaxed text-fg-muted">
                    {getPresenterNotes(s)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* ===== Disclaimer footer (screen + print) ===== */}
      <footer className="mt-auto border-t border-line/50 bg-ink-soft/60 px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-center text-[10px] leading-relaxed text-fg-muted sm:text-[11px]">
            Confidential. Derived from the Mithqal v19.0 specification. Not
            an offer to sell securities or any MTQ unit. MTQ is minted
            exclusively against verified reserves.
          </p>
        </div>
      </footer>
    </div>
  );
}
