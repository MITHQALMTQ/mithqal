"use client";

/**
 * Root error boundary (D5).
 *
 * Next.js auto-routes any uncaught runtime error in a server or client
 * component to this file. The component:
 *   - Catches the error + reset action passed by Next.js
 *   - Renders a graceful "Something went wrong" page in the Mithqal
 *     dark/gold theme (matches not-found.tsx so the visual language
 *     is consistent across the unhappy paths)
 *   - Surfaces the error message in a collapsible <details> for power users
 *   - Provides a "Try again" button (calls reset()) + a "Reload page"
 *     fallback + a "Return to the Institution" link
 *
 * This file MUST start with "use client" — Next.js requires error
 * boundaries to be client components so the reset() action can re-render
 * the failing subtree without a full page navigation.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, RefreshCw, Home } from "lucide-react";
import { Logo } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the error to the browser console so it shows up in dev tooling +
  // any error-reporting service wired up later (Sentry, etc.).
  useEffect(() => {
    console.error("[mithqal] root error boundary caught:", error);
  }, [error]);

  return (
    <div className="grain-bg flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
      <Logo className="h-20 w-20" />

      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        Error
      </div>

      <h1 className="font-display mt-6 text-3xl text-foreground sm:text-5xl">
        Something went <span className="gold-text">wrong</span>
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted sm:text-base">
        An unexpected error occurred while rendering this page. The
        Constitution requires verifiable operations — and that includes
        owning failure when it happens. Try again, or return to the
        Institution.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
          className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
        >
          <RefreshCw className="h-4 w-4" />
          Reload page
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
        >
          <Home className="h-4 w-4" />
          Return to the Institution
        </Link>
      </div>

      {/* Collapsible error detail for power users / debugging. The digest
          is the stable id Next.js generates for server-side errors — useful
          when reporting to an operator. */}
      <details className="mt-10 w-full max-w-xl text-left">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted transition hover:text-gold">
          Technical details
        </summary>
        <div className="mt-3 rounded-lg border border-line bg-ink-soft p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">
            Error message
          </div>
          <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-destructive">
            {error.message || "Unknown error"}
          </pre>
          {error.digest ? (
            <>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Digest
              </div>
              <code className="mt-1 block font-mono text-[11px] text-fg-muted">
                {error.digest}
              </code>
            </>
          ) : null}
          {error.stack ? (
            <>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Stack trace
              </div>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-fg-muted">
                {error.stack}
              </pre>
            </>
          ) : null}
        </div>
      </details>
    </div>
  );
}
