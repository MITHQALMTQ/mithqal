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
import { ArrowLeft, BookOpen, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

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
