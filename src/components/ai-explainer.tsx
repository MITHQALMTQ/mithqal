"use client";

/**
 * AI Explainer — floating "ask the Brain" launcher (UI-FEATURES-1 · E1).
 *
 * Renders a small floating Brain button at the bottom-right corner. Clicking
 * opens a Popover (shadcn/ui) with a Textarea where the user can ask a plain-
 * English question about any Mithqal metric. The question is dispatched to
 * the existing POST /api/brain endpoint (multi-model consensus engine) and
 * the response is rendered with a "Powered by Mithqal Brain" footer.
 *
 * Behaviour:
 *   - Auto-dismisses on Escape (handled by Radix Popover) and on outside click.
 *   - Loading / error / empty states.
 *   - Disabled in print mode (.no-print).
 *
 * No new dependencies — uses only existing shadcn/ui components + lucide.
 */

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { Brain, Loader2, Send, Sparkles, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BrainResponse {
  consensusLevel?: "low" | "medium" | "high";
  answer?: string;
  combinedAnswer?: string;
  error?: string;
  detail?: string;
  responses?: Array<{ model?: string; response?: string; status?: string }>;
}

const EXAMPLE_PROMPTS = [
  "Why is the reserve ratio above 100%?",
  "What does NAV Prudential mean?",
  "Is the gold/silver basket compliant today?",
  "Explain the 0.05% mint fee.",
];

export function AiExplainer() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<BrainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, type: "general" }),
      });
      const data = (await res.json()) as BrainResponse;
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
      }
      setAnswer(data);
    } catch (e: any) {
      setError(e?.message || "Brain query failed.");
    } finally {
      setLoading(false);
    }
  }, [question]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter sends. Plain Enter inserts a newline.
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void ask();
      }
    },
    [ask],
  );

  const reset = useCallback(() => {
    setQuestion("");
    setAnswer(null);
    setError(null);
  }, []);

  const displayAnswer = answer?.combinedAnswer ?? answer?.answer ?? "";
  const consensus = answer?.consensusLevel;

  return (
    <div className="no-print fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      <Popover
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            aria-label="Ask the Mithqal Brain"
            title="Ask the Mithqal Brain"
            className="h-12 w-12 rounded-full bg-gold/90 p-0 text-ink shadow-lg shadow-gold/20 transition hover:bg-gold hover:shadow-gold/40"
          >
            <Brain className="h-5 w-5" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          sideOffset={10}
          className="w-[min(92vw,26rem)] border-line bg-ink-soft p-0 text-foreground"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
              <span className="font-display text-sm text-foreground">
                Ask the Brain
              </span>
              {consensus && (
                <span
                  className={
                    "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (consensus === "high"
                      ? "border-reserve/40 bg-reserve/10 text-reserve"
                      : consensus === "medium"
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-destructive/40 bg-destructive/10 text-destructive")
                  }
                >
                  {consensus}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="text-fg-muted transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <Textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about any metric — e.g. 'Why is the reserve ratio 104%?'"
              className="min-h-[72px] resize-none border-line bg-ink-card text-sm text-foreground placeholder:text-fg-muted focus-visible:border-gold"
              aria-label="Question for Mithqal Brain"
            />

            {!answer && !error && (
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuestion(p)}
                    className="rounded-full border border-line bg-ink-card px-2.5 py-1 text-[11px] text-fg-muted transition hover:border-gold/50 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            {displayAnswer && (
              <div className="max-h-[40vh] overflow-y-auto rounded-md border border-line bg-ink-card p-3 text-sm leading-relaxed text-foreground">
                {displayAnswer}
              </div>
            )}

            <Button
              type="button"
              onClick={() => void ask()}
              disabled={loading || !question.trim()}
              className="w-full bg-gold text-ink hover:bg-gold-soft"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Ask Brain
                </>
              )}
            </Button>

            <p className="text-center text-[10px] text-fg-muted">
              Powered by Mithqal Brain · ⌘/Ctrl + Enter to send
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
