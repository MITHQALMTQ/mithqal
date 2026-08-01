"use client";

/**
 * Root error boundary.
 *
 * Security note: production users see only a generic message + a stable
 * `digest` identifier (server-generated). The full `error.message` and
 * `error.stack` are NEVER rendered to the client in production — they
 * are logged server-side only (`console.error`) so an operator can
 * correlate the digest back to a stack trace without leaking internal
 * paths, source file names, or implementation detail to end users.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, RefreshCw, Home } from "lucide-react";
import { Logo } from "@/components/logo";

const isProd = process.env.NODE_ENV === "production";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        An unexpected error occurred while rendering this page. Please try
        again, or return to the Institution.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft">
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <button type="button" onClick={() => { if (typeof window !== "undefined") window.location.reload(); }} className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold">
          <RefreshCw className="h-4 w-4" />
          Reload page
        </button>
        <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold">
          <Home className="h-4 w-4" />
          Return to the Institution
        </Link>
      </div>
      <details className="mt-10 w-full max-w-xl text-left">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted transition hover:text-gold">
          Reference details
        </summary>
        <div className="mt-3 rounded-lg border border-line bg-ink-soft p-4">
          {error.digest ? (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                Reference ID
              </div>
              <code className="mt-1 block font-mono text-[11px] text-fg-muted">
                {error.digest}
              </code>
              <p className="mt-3 text-[11px] text-fg-muted">
                Quote this reference when contacting the operator.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-fg-muted">
              No reference ID available.
            </p>
          )}
          {/* Stack trace is shown ONLY in development — never in production. */}
          {!isProd && error.message ? (
            <>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Dev message
              </div>
              <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-destructive">
                {error.message}
              </pre>
            </>
          ) : null}
          {!isProd && error.stack ? (
            <>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Stack trace (dev only)
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
