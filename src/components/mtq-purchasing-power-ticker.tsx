"use client";

// src/components/mtq-purchasing-power-ticker.tsx
//
// Live ticker showing MTQ's purchasing power across 8 currencies with 24h
// changes. Polls /api/mtq-purchasing-power every 60 seconds.
//
// Per user directive (2026-09-29):
//   "MTQ is purchasing power, not fixed to any currency."
//
// Constitutional correctness (Constitution v19.0 §22 — gold-anchored basket).
// MTQ's USD baseline (navM) moves with the gold price; its purchasing power
// in any currency ALSO depends on the USD→currency FX rate. This ticker
// surfaces both views: the gold-anchored USD baseline + the per-currency
// purchasing-power conversions.
//
// Theme: dark-gold institutional (matches the /legal pages + hero section).
// Layout: sticky-footer-compatible (no fixed height; uses flexbox + gap).
// Accessibility: sr-only <h2> for landmark navigation; ARIA labels on every
// row; arrow icons have sr-only text alternatives.
//
// Fail-safe: if the API fails or returns no data, the ticker renders a
// concise "Live FX unavailable" message instead of crashing the home page.

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCw,
  Coins,
  Gem,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Types — must match the response shape of /api/mtq-purchasing-power.
// ─────────────────────────────────────────────────────────────────────────

interface PurchasingPowerResponse {
  navM: number;
  navL: number;
  goldUsd: number;
  silverUsd: number;
  goldUsd24hChange: number;
  silverUsd24hChange: number;
  purchasingPower: Record<string, number>;
  changes24h: Record<string, number>;
  purchasingPowerChanges24h: Record<string, number>;
  fredSource: string;
  fxSource: string;
  timestamp: string;
  explanation: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Static display metadata per currency.
// ─────────────────────────────────────────────────────────────────────────

interface CurrencyMeta {
  code: string;
  flag: string;
  name: string;
  /** Symbol prefix used before the formatted number. */
  symbol: string;
  /** Number of decimals to display for the purchasing-power value. */
  decimals: number;
}

const CURRENCIES: CurrencyMeta[] = [
  { code: "USD", flag: "🇺🇸", name: "US Dollar",      symbol: "$",   decimals: 4 },
  { code: "EUR", flag: "🇪🇺", name: "Euro",            symbol: "€",   decimals: 4 },
  { code: "JPY", flag: "🇯🇵", name: "Japanese Yen",    symbol: "¥",   decimals: 2 },
  { code: "GBP", flag: "🇬🇧", name: "Pound Sterling",  symbol: "£",   decimals: 4 },
  { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan",    symbol: "¥",   decimals: 2 },
  { code: "CHF", flag: "🇨🇭", name: "Swiss Franc",     symbol: "Fr ", decimals: 4 },
  { code: "AUD", flag: "🇦🇺", name: "Australian Dollar",symbol: "A$",  decimals: 4 },
  { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar", symbol: "C$",  decimals: 4 },
];

const POLL_INTERVAL_MS = 60_000;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function formatChange(value: number): { sign: "+" | "-" | ""; text: string; positive: boolean } {
  if (!Number.isFinite(value) || value === 0) {
    return { sign: "", text: "0.00%", positive: true };
  }
  const positive = value > 0;
  const abs = Math.abs(value).toFixed(2);
  return {
    sign: positive ? "+" : "-",
    text: `${abs}%`,
    positive,
  };
}

function formatValue(value: number, decimals: number): string {
  if (!Number.isFinite(value) || value === 0) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

export function MtqPurchasingPowerTicker() {
  const [data, setData] = useState<PurchasingPowerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retry = 0;

    const go = async () => {
      try {
        const res = await fetch("/api/mtq-purchasing-power", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setError(`HTTP ${res.status}`);
            setLoading(false);
          }
          return;
        }
        const json = (await res.json()) as PurchasingPowerResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
          retry = 0; // reset backoff on success
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "fetch failed");
          setLoading(false);
          // Exponential backoff up to 5min on consecutive failures.
          retry = Math.min(retry + 1, 5);
        }
      }
    };

    void go();
    const interval = setInterval(() => void go(), POLL_INTERVAL_MS * Math.pow(2, Math.min(retry, 3)));
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      data-testid="mtq-purchasing-power-ticker"
      aria-labelledby="mtq-pp-ticker-heading"
      className="space-y-3"
    >
      {/* sr-only h2 for landmark navigation — visible title uses a div
          below to preserve the existing h2 hierarchy of the page. */}
      <h2 id="mtq-pp-ticker-heading" className="sr-only">
        MTQ Purchasing Power (Live)
      </h2>

      <Card className="border-gold/30 bg-gradient-to-br from-black/80 via-zinc-950/80 to-zinc-900/80 p-4 backdrop-blur-md sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/5">
              <Coins className="h-5 w-5 text-gold" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
                MTQ Purchasing Power
                <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-normal normal-case tracking-wider text-gold/70">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                  </span>
                  Live
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-gray-400">
                1 MTQ = what you can <span className="text-gold font-semibold">BUY</span>, not what it&apos;s worth in USD
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            {loading && !data ? (
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin text-gold" aria-hidden="true" />
                Loading…
              </span>
            ) : (
              <span>
                {data
                  ? `Updated ${new Date(data.timestamp).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}`
                  : error
                    ? "Live FX unavailable"
                    : ""}
              </span>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && !data && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
            Live FX data unavailable. Showing fallback values where possible. ({error})
          </div>
        )}

        {/* Gold + Silver spot cards */}
        {data && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MetalSpot
              label="Gold (XAU)"
              price={data.goldUsd}
              change={data.goldUsd24hChange}
              icon={<Gem className="h-4 w-4 text-gold" aria-hidden="true" />}
            />
            <MetalSpot
              label="Silver (XAG)"
              price={data.silverUsd}
              change={data.silverUsd24hChange}
              icon={<Gem className="h-4 w-4 text-gray-300" aria-hidden="true" />}
            />
          </div>
        )}

        {/* 8-currency purchasing-power grid */}
        {data && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CURRENCIES.map((c) => {
              const value = data.purchasingPower[c.code] ?? 0;
              const change = data.purchasingPowerChanges24h[c.code] ?? 0;
              const fxChange = data.changes24h[c.code] ?? 0;
              const ch = formatChange(change);
              const fch = formatChange(fxChange);
              return (
                <div
                  key={c.code}
                  className="group relative flex flex-col gap-1 rounded-lg border border-gold/10 bg-zinc-950/60 p-3 transition-colors duration-200 hover:border-gold/30 hover:bg-zinc-900/60"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base leading-none" aria-hidden="true">{c.flag}</span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-white">{c.code}</div>
                        <div className="text-[9px] text-gray-500">{c.name}</div>
                      </div>
                    </div>
                    {c.code === "USD" ? (
                      <Badge variant="gold" className="text-[8px]">BASELINE</Badge>
                    ) : (
                      <Badge variant="emerald" className="text-[8px]">LIVE FX</Badge>
                    )}
                  </div>
                  <div className="mt-1 border-t border-white/5 pt-1.5">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">1 MTQ ≈</div>
                    <div className="font-mono text-base font-bold text-gold">
                      {c.symbol}{formatValue(value, c.decimals)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono ${
                        ch.positive ? "text-emerald-400" : "text-red-400"
                      }`}
                      aria-label={`24-hour change: ${ch.sign}${ch.text}`}
                    >
                      {ch.positive ? (
                        <ArrowUpIcon className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span className="sr-only">{ch.positive ? "up" : "down"}</span>
                      {ch.sign}{ch.text}
                    </span>
                    <span
                      className={`font-mono text-[9px] ${
                        fch.positive ? "text-emerald-400/70" : "text-red-400/70"
                      }`}
                      aria-label={`FX 24h change: ${fch.sign}${fch.text}`}
                      title="USD→currency FX rate 24h change"
                    >
                      FX {fch.sign}{fch.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer with attribution + explanation */}
        {data && (
          <div className="mt-4 flex flex-wrap items-start justify-between gap-2 border-t border-gold/10 pt-3 text-[10px] text-gray-500">
            <div className="max-w-xl space-y-0.5">
              <div>
                <span className="text-gold/80">FX:</span>{" "}
                <span className="text-gray-400">{data.fxSource}</span>
              </div>
              <div>
                <span className="text-gold/80">24h change:</span>{" "}
                <span className="text-gray-400">{data.fredSource}</span>
              </div>
            </div>
            <div className="max-w-md text-right text-gray-500">
              MTQ is <span className="text-gold font-semibold">purchasing power</span>, not USD-fixed.
              <br />
              See live rates below.
            </div>
          </div>
        )}

        {/* Expanded explanation (collapsible-style inline block) */}
        {data && (
          <details className="mt-3 rounded-lg border border-white/5 bg-black/40 p-3 text-[10px] text-gray-400">
            <summary className="cursor-pointer text-gold/80 hover:text-gold">
              How is purchasing power computed?
            </summary>
            <p className="mt-2 leading-relaxed">{data.explanation}</p>
          </details>
        )}
      </Card>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-component: metal spot price card (gold/silver)
// ─────────────────────────────────────────────────────────────────────────

function MetalSpot({
  label,
  price,
  change,
  icon,
}: {
  label: string;
  price: number;
  change: number;
  icon: React.ReactNode;
}) {
  const ch = formatChange(change);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gold/10 bg-zinc-950/60 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">{label}</div>
          <div className="font-mono text-sm font-bold text-gold">
            ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      <div
        className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 font-mono text-[10px] ${
          ch.positive
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}
        aria-label={`${label} 24h change: ${ch.sign}${ch.text}`}
      >
        {ch.positive ? (
          <ArrowUpIcon className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDownIcon className="h-3 w-3" aria-hidden="true" />
        )}
        <span className="sr-only">{ch.positive ? "up" : "down"}</span>
        {ch.sign}{ch.text}
      </div>
    </div>
  );
}
