"use client";

/**
 * AI Explainer — exception analysis launcher (PHASE1D).
 *
 * Renders a compact trigger (icon | button | inline) that calls
 * POST /api/v1/explain and opens a Dialog showing the AI-generated
 * root-cause analysis (Root Cause Hypothesis · Impact · Recommended
 * Actions · Confidence). Three trigger variants cover table rows,
 * toolbar buttons, and inline callouts.
 *
 * Styling note: uses the project's gold/ink token palette so the
 * amber/gold dark theme is preserved.
 *
 * Backend contract (do not change without coordinating with the API):
 *   POST /api/v1/explain  body: ExceptionData  ->  { ok, explanation, disclaimer, ... }
 */

import { useState, useCallback } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface ExceptionData {
  exceptionId: string;
  caseId: string;
  code: string;
  severity: string;
  status: string;
  owner: string;
  reason: string;
  action: string;
}

export interface AIExplainerProps {
  exception: ExceptionData;
  /** Visual style of the trigger element. */
  triggerVariant?: "icon" | "button" | "inline";
}

interface ExplainResponse {
  ok: boolean;
  exceptionId?: string;
  explanation?: string;
  model?: string;
  timestamp?: string;
  disclaimer?: string;
  error?: string;
}

/**
 * Lightweight line-based markdown renderer (no external dep).
 *
 * Supports:
 *   - `## Heading`  → <h2>
 *   - `### Heading`  → <h3>
 *   - `1. item` / `- item` → <p className="ml-…">
 *   - blank lines → spacer
 *   - everything else → <p>
 *
 * Bold (`**text**`) and inline code (`` `text` ``) are rendered by
 * recursing over a single regex split per line — minimal but readable.
 */
function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-foreground">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (line.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="mt-3 text-xs font-semibold uppercase tracking-wide text-gold-soft"
            >
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mt-4 mb-1 text-sm font-semibold text-gold"
            >
              {line.slice(3)}
            </h2>
          );
        }
        const isListItem = /^(\d+\.|-|\*)\s+/.test(trimmed);
        return (
          <p
            key={i}
            className={
              isListItem
                ? "ml-4 text-xs text-fg-muted"
                : "text-xs text-foreground"
            }
          >
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/** Render **bold** and `code` inline. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gold-soft">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-ink-card px-1 py-0.5 font-mono text-[10px] text-gold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AIExplainer({
  exception,
  triggerVariant = "icon",
}: AIExplainerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string>(
    "AI-assisted analysis — not a definitive diagnosis. Human review required.",
  );

  const handleExplain = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    setOpen(true);
    try {
      const res = await fetch("/api/v1/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exception),
      });
      const data: ExplainResponse = await res.json();
      if (data.ok && data.explanation) {
        setExplanation(data.explanation);
        if (data.disclaimer) setDisclaimer(data.disclaimer);
      } else {
        setError(data.error || "Failed to generate explanation");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [exception]);

  // Render trigger based on variant
  const trigger =
    triggerVariant === "icon" ? (
      <button
        type="button"
        onClick={handleExplain}
        title="AI Explain"
        aria-label={`Get AI explanation for exception ${exception.code}`}
        className="rounded p-1 text-gold transition hover:bg-gold/10 hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </button>
    ) : triggerVariant === "button" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExplain}
        className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-soft"
      >
        <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> AI Explain
      </Button>
    ) : (
      <button
        type="button"
        onClick={handleExplain}
        className="text-xs text-gold underline-offset-2 hover:text-gold-soft hover:underline"
      >
        ✨ Explain this exception
      </button>
    );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-gold/20 bg-ink-soft text-foreground">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-gold">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              AI Exception Analysis
              <span className="ml-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[10px] text-gold-soft">
                {exception.code}
              </span>
            </DialogTitle>
            <DialogDescription className="text-fg-muted">
              Exception {exception.exceptionId} · Case {exception.caseId} ·
              Severity {exception.severity}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2
                  className="h-8 w-8 animate-spin text-gold"
                  aria-hidden="true"
                />
                <p className="text-sm text-fg-muted">Analyzing exception…</p>
                <p className="text-center text-[10px] text-fg-muted/80">
                  The AI is reviewing the exception context and generating a
                  root-cause hypothesis.
                </p>
              </div>
            )}

            {error && !loading && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-4"
              >
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-semibold">Analysis Failed</span>
                </div>
                <p className="mt-2 text-xs text-fg-muted">{error}</p>
              </div>
            )}

            {explanation && !loading && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gold/20 bg-gold/10 p-3 text-xs text-gold-soft">
                  ⚠️ {disclaimer}
                </div>
                <MarkdownLite text={explanation} />
              </div>
            )}

            {!loading && !error && !explanation && (
              <p className="py-8 text-center text-sm text-fg-muted">
                Click to generate analysis.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIExplainer;
