"use client";

/**
 * Mithqal API Documentation page (audit rec #10).
 *
 * Fetches the OpenAPI 3.1 spec from /openapi.json on mount and renders the
 * endpoints grouped by tag (Public / Formation / Admin / Auth). Each endpoint
 * shows its HTTP method, path, and description. The page is a "use client"
 * component so the fetch happens in the browser (and is cached implicitly by
 * the browser for repeat visits).
 *
 * The spec itself lives at `public/openapi.json` so it is served verbatim by
 * Next.js as a static asset — no API route needed.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ExternalLink, Loader2, AlertCircle, Play, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---- OpenAPI types (minimal subset — only what we render) ---- */

interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: { name: string; url: string };
    license?: { name: string; url: string };
  };
  servers?: { url: string; description: string }[];
  tags?: { name: string; description: string }[];
  paths: Record<string, Record<string, any>>;
}

interface EndpointRow {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
}

/* ---- HTTP method → tailwind class for the colored pill ---- */

const METHOD_STYLES: Record<string, string> = {
  get: "border-reserve/40 bg-reserve/10 text-reserve",
  post: "border-gold/40 bg-gold/10 text-gold",
  put: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  delete: "border-destructive/40 bg-destructive/10 text-destructive",
  patch: "border-purple-400/40 bg-purple-400/10 text-purple-400",
};

/* ---- UI-FEATURES-1 · F2 — Interactive API explorer ----
 * A curated list of public read-only endpoints the visitor can hit live
 * from the page. Each entry has a short description so the explorer doubles
 * as a quick orientation to the public data surface.
 */
interface ExplorerEndpoint {
  path: string;
  label: string;
  description: string;
}

const EXPLORER_ENDPOINTS: ExplorerEndpoint[] = [
  { path: "/api/status", label: "Institution Status", description: "High-level health snapshot (DB / RPC / Oracle / SMTP + on-chain checks)." },
  { path: "/api/health", label: "Service Health", description: "Per-service connectivity report (database, RPC node, oracle feed, SMTP)." },
  { path: "/api/onchain-test", label: "On-chain Test", description: "Runs 15 contract-call checks against the MTQ token on Monad Testnet." },
  { path: "/api/oracle", label: "Oracle Feed", description: "Live gold & silver USD prices + the source attribution." },
  { path: "/api/transparency", label: "Transparency Report", description: "Full monetary state: NAV, reserve ratio, LCR, CRI, basket verification." },
  { path: "/api/reserve/status", label: "Reserve Status", description: "Reserve composition + market / adjusted / liquidation valuations." },
  { path: "/api/proofs/latest", label: "Latest Proofs", description: "Most recent per-proof-type attestation + a short recent-days history." },
];

/* ---- Component ---- */

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/openapi.json", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<OpenApiSpec>;
      })
      .then((json) => {
        if (cancelled) return;
        setSpec(json);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load OpenAPI spec.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Flatten the paths object into a flat list of endpoint rows.
  const endpoints: EndpointRow[] = [];
  if (spec) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;
        const operation = op as any;
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary ?? "",
          description: operation.description ?? "",
          tags: operation.tags ?? ["Untagged"],
        });
      }
    }
  }

  // Group endpoints by tag, preserving the spec's `tags` order (Public,
  // Formation, Admin, Auth). Any tag not declared in `spec.tags` is appended
  // at the end under "Other".
  const tagOrder = (spec?.tags ?? []).map((t) => t.name);
  const grouped: Record<string, EndpointRow[]> = {};
  for (const ep of endpoints) {
    for (const tag of ep.tags) {
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(ep);
    }
  }
  const orderedTags = [
    ...tagOrder,
    ...Object.keys(grouped).filter((t) => !tagOrder.includes(t)),
  ].filter((t) => grouped[t] && grouped[t].length > 0);

  return (
    <div className="grain-bg min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-fg-muted transition hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Institution
            </Link>
            <Logo className="h-10 w-10" />
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Badge className="border-gold/40 bg-gold/10 text-gold">
              <BookOpen className="mr-1 h-3 w-3" /> API Reference
            </Badge>
            {spec && (
              <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                OpenAPI {spec.openapi}
              </Badge>
            )}
          </div>

          <h1 className="font-display mt-3 text-3xl text-foreground sm:text-4xl">
            Mithqal API Documentation
          </h1>

          {spec ? (
            <>
              <p className="mt-3 max-w-2xl text-sm text-fg-muted">
                {spec.info.description ?? "Public + operator API surface for the Mithqal Constitutional Settlement Institution."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                <span>Version: <span className="text-foreground">{spec.info.version}</span></span>
                {spec.info.contact && (
                  <a
                    href={spec.info.contact.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-gold hover:underline"
                  >
                    {spec.info.contact.name} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {spec.info.license && (
                  <a
                    href={spec.info.license.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-gold hover:underline"
                  >
                    {spec.info.license.name} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <a
                  href="/openapi.json"
                  className="inline-flex items-center gap-1 text-gold hover:underline"
                >
                  raw openapi.json <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {spec.servers && spec.servers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {spec.servers.map((s) => (
                    <Badge key={s.url} className="border-line bg-ink-card text-fg-muted">
                      {s.description}: <code className="ml-1 text-foreground">{s.url}</code>
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : !loading && error ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          ) : null}
        </motion.div>

        {/* UI-FEATURES-1 · F2 — Interactive API Explorer.
            Rendered before the full spec so visitors can immediately fire a
            live request without scrolling through the full endpoint listing. */}
        <ApiExplorer />

        {/* Body */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-3 text-fg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
            <p className="text-sm">Loading OpenAPI spec…</p>
          </div>
        ) : !spec ? (
          <div className="mt-12 rounded-xl border border-line bg-ink-soft p-8 text-center text-sm text-fg-muted">
            No spec available.
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {orderedTags.map((tag) => {
              const tagMeta = spec.tags?.find((t) => t.name === tag);
              const rows = grouped[tag];
              return (
                <section key={tag} id={`tag-${tag.toLowerCase()}`}>
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl text-foreground">{tag}</h2>
                    <Badge className="border-line bg-ink-card text-fg-muted">
                      {rows.length} endpoint{rows.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {tagMeta?.description && (
                    <p className="mt-1 text-xs text-fg-muted">{tagMeta.description}</p>
                  )}
                  <div className="mt-4 overflow-hidden rounded-xl border border-line">
                    <div className="divide-y divide-line">
                      {rows.map((ep) => {
                        const style =
                          METHOD_STYLES[ep.method.toLowerCase()] ??
                          "border-line bg-ink-card text-fg-muted";
                        return (
                          <div
                            key={`${ep.method}-${ep.path}`}
                            className="flex flex-col gap-2 p-4 transition hover:bg-ink-card/40 sm:flex-row sm:items-start sm:gap-4"
                          >
                            <div className="flex shrink-0 items-center gap-2 sm:w-32">
                              <span
                                className={`inline-flex w-14 justify-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style}`}
                              >
                                {ep.method}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <code className="block break-all font-mono text-sm text-foreground">
                                {ep.path}
                              </code>
                              {ep.summary && (
                                <div className="mt-1 text-sm font-medium text-foreground">
                                  {ep.summary}
                                </div>
                              )}
                              {ep.description && (
                                <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                                  {ep.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-line pt-6 text-center text-xs text-fg-muted">
          <p>
            © 2026 Mithqal Constitutional Monetary Institution · v19.0 specification.
          </p>
          <p className="mt-1">
            This page is auto-generated from{" "}
            <a href="/openapi.json" className="text-gold hover:underline">
              /openapi.json
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---- UI-FEATURES-1 · F2 — Interactive API Explorer component ----
 * A dropdown of curated public read-only endpoints + a "Try it" button that
 * fetches the endpoint live and renders the JSON response in a formatted
 * code block. Reuses the existing Mithqal dark/gold theme via the standard
 * token classes (border-line / bg-ink-soft / text-gold / text-fg-muted).
 *
 * No new dependencies: shadcn Select + Button + Tailwind.
 */
function ApiExplorer() {
  const [selected, setSelected] = useState<string>(EXPLORER_ENDPOINTS[0].path);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<unknown>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatus(null);
    setLatencyMs(null);
    const started = performance.now();
    try {
      const res = await fetch(selected, { cache: "no-store" });
      setStatus(res.status);
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* leave as raw text */
      }
      setResponse(parsed);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLatencyMs(Math.round(performance.now() - started));
      setLoading(false);
      setHasRun(true);
    }
  };

  const endpoint = EXPLORER_ENDPOINTS.find((e) => e.path === selected);
  const ok = status !== null && status >= 200 && status < 300;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="mt-8 overflow-hidden rounded-xl border border-line bg-ink-soft"
    >
      <div className="flex items-center gap-2 border-b border-line bg-ink-card/40 px-4 py-3">
        <Terminal className="h-4 w-4 text-gold" aria-hidden="true" />
        <h2 className="font-display text-lg text-foreground">Live API Explorer</h2>
        <Badge className="border-gold/40 bg-gold/10 text-gold">Interactive</Badge>
      </div>

      <div className="p-4">
        <p className="text-xs text-fg-muted">
          Pick a public read-only endpoint and fire a live request. The JSON
          response is rendered inline so you can verify the schema without
          leaving the page.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="api-explorer-endpoint" className="mb-1 block text-[11px] uppercase tracking-wider text-fg-muted">
              Endpoint
            </label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger
                id="api-explorer-endpoint"
                className="w-full bg-ink-card text-foreground"
                aria-label="Select endpoint to try"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPLORER_ENDPOINTS.map((ep) => (
                  <SelectItem key={ep.path} value={ep.path}>
                    <span className="font-mono text-foreground">{ep.path}</span>
                    <span className="ml-2 text-fg-muted">— {ep.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="bg-gold text-ink hover:bg-gold-soft sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Try it
              </>
            )}
          </Button>
        </div>

        {endpoint && (
          <p className="mt-2 text-xs text-fg-muted">
            <span className="text-foreground">{endpoint.label}.</span>{" "}
            {endpoint.description}
          </p>
        )}

        {error && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        {hasRun && !error && status !== null && (
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded border border-line bg-ink-card px-2 py-1">
                {ok ? (
                  <CheckCircle2 className="h-3 w-3 text-reserve" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive" />
                )}
                <span className={ok ? "text-reserve" : "text-destructive"}>
                  HTTP {status}
                </span>
              </span>
              {latencyMs !== null && (
                <span className="rounded border border-line bg-ink-card px-2 py-1 text-fg-muted">
                  {latencyMs} ms
                </span>
              )}
              <span className="rounded border border-line bg-ink-card px-2 py-1 font-mono text-fg-muted">
                GET {selected}
              </span>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-lg border border-line bg-ink p-4 text-xs leading-relaxed text-foreground">
              <code className="font-mono">
                {typeof response === "string"
                  ? response
                  : JSON.stringify(response, null, 2)}
              </code>
            </pre>
          </div>
        )}
      </div>
    </motion.section>
  );
}
