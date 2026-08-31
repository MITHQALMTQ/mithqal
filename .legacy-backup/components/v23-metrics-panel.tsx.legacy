"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, ShieldCheck, AlertTriangle, Layers, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface V23Metrics {
  generatedAt: string;
  gei: number;
  bri: number;
  lci: number;
  drqs: Array<{
    asset: string;
    score: number;
    classification: string;
    factors: Record<string, number>;
  }>;
  stablecoinStates: Array<{
    asset: string;
    state: string;
    dimensions: { priceDev: number };
    reason: string;
  }>;
  exposure: {
    se: number;
    sae: number;
    totalStablecoinUsd: number;
    withinLimits: boolean;
    concentrationOk: boolean;
  };
  depegReadings: Array<{
    asset: string;
    peg: string;
    livePrice: number;
    priceDev: number;
    source: string;
  }>;
  allWithinLimits: boolean;
  warnings: string[];
  nav?: {
    reserveRatio: number;
    usdConcentration: number;
    currencyConcentration: Record<string, number>;
    pillarBreakdown: { bullion: number; fiat: number; digital: number };
  };
}

export function V23MetricsPanel() {
  const [data, setData] = useState<V23Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/v23-metrics", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as V23Metrics;
        setData(json);
      }
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  if (loading && !data) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-ink-card p-6">
        <div className="animate-pulse text-sm text-fg-muted">Loading v23 advisory metrics…</div>
      </div>
    );
  }

  if (!data) return null;

  const stateColor = (s: string) => {
    switch (s) {
      case "NORMAL": return "text-reserve";
      case "WATCH": return "text-gold";
      case "REDUCE":
      case "SUSPEND":
      case "EMERGENCY_EXIT": return "text-destructive";
      default: return "text-fg-muted";
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.04] to-ink-soft p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gold">
          <Layers className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            v23 Four-Layer Advisory Metrics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-line bg-ink text-fg-muted hover:bg-ink-card">
            <Activity className="mr-1 h-3 w-3" /> Auto-refresh 30s
          </Badge>
          <Badge
            className={
              data.allWithinLimits
                ? "border-reserve/30 bg-reserve/10 text-reserve hover:bg-reserve/10"
                : "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/10"
            }
          >
            {data.allWithinLimits ? (
              <><ShieldCheck className="mr-1 h-3 w-3" /> All within limits</>
            ) : (
              <><AlertTriangle className="mr-1 h-3 w-3" /> {data.warnings.length} warning(s)</>
            )}
          </Badge>
        </div>
      </div>

      <p className="mt-2 text-xs text-fg-muted">
        Layer 2 (gold-relative) · Layer 3 (liquidity) · Layer 4 (risk dashboard). Advisory only —
        only Layer 1 (RR) triggers constitutional action.
      </p>

      {/* Layer 2 + Layer 3 metrics */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">GEI · Gold-Equivalent Index</div>
          <div className="font-display mt-1 text-lg text-gold">{data.gei.toFixed(4)}</div>
          <div className="text-[10px] text-fg-muted">Normalized to 1.0 · §3.7</div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">BRI · Bullion Resilience</div>
          <div className="font-display mt-1 text-lg text-gold">{data.bri.toFixed(4)}</div>
          <div className="text-[10px] text-fg-muted">w_gold=0.90, w_silver=0.10 · §3.8</div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">LCI · Liquidity Coverage</div>
          <div className="font-display mt-1 text-lg text-gold">{data.lci.toFixed(2)}×</div>
          <div className="text-[10px] text-fg-muted">HQLA / (S×0.10) · §3.9</div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">USD Concentration</div>
          <div className="font-display mt-1 text-lg text-gold">
            {data.nav?.usdConcentration?.toFixed(2) ?? "—"}%
          </div>
          <div className="text-[10px] text-fg-muted">Cap: 35% · v23 §6</div>
        </div>
      </div>

      {/* Pillar breakdown */}
      {data.nav?.pillarBreakdown && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Bullion Pillar</div>
            <div className="font-display mt-1 text-base text-gold">{data.nav.pillarBreakdown.bullion.toFixed(2)}%</div>
            <div className="text-[10px] text-fg-muted">Target: 20% (gold 15% + silver 5%)</div>
          </div>
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Fiat Pillar</div>
            <div className="font-display mt-1 text-base text-gold">{data.nav.pillarBreakdown.fiat.toFixed(2)}%</div>
            <div className="text-[10px] text-fg-muted">Target: 75% (11 currencies)</div>
          </div>
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Digital Liquidity Sleeve</div>
            <div className="font-display mt-1 text-base text-gold">{data.nav.pillarBreakdown.digital.toFixed(2)}%</div>
            <div className="text-[10px] text-fg-muted">Target: 3.5% · Cap: 5%</div>
          </div>
        </div>
      )}

      {/* Digital liquidity sleeve — DRQS + states */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          <Droplet className="h-3.5 w-3.5 text-gold" />
          Digital Liquidity Sleeve · DRQS & State Machine
        </div>
        <div className="mt-2 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Asset</th>
                <th className="px-3 py-2 text-right font-semibold">DRQS</th>
                <th className="px-3 py-2 text-center font-semibold">Class</th>
                <th className="px-3 py-2 text-right font-semibold">Price Dev</th>
                <th className="px-3 py-2 text-center font-semibold">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.drqs.map((d) => {
                const state = data.stablecoinStates.find(s => s.asset === d.asset);
                const depeg = data.depegReadings.find(r => r.asset === d.asset);
                return (
                  <tr key={d.asset} className="hover:bg-ink/50">
                    <td className="px-3 py-2 font-medium text-foreground">{d.asset}</td>
                    <td className="px-3 py-2 text-right font-display text-gold">{d.score.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className={
                        d.classification === "core" ? "border-reserve/30 text-reserve"
                        : d.classification === "conditional" ? "border-gold/30 text-gold"
                        : "border-destructive/30 text-destructive"
                      }>
                        {d.classification}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right text-fg-muted">
                      {depeg ? `${(depeg.priceDev * 100).toFixed(3)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-semibold ${stateColor(state?.state ?? "NORMAL")}`}>
                        {state?.state ?? "NORMAL"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exposure metrics */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">SE · Stablecoin Exposure</div>
          <div className="font-display mt-1 text-lg text-gold">{data.exposure.se.toFixed(2)}%</div>
          <div className="text-[10px] text-fg-muted">Nominal · Cap 5%</div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">SAE · Risk-Adjusted</div>
          <div className="font-display mt-1 text-lg text-gold">{data.exposure.sae.toFixed(2)}%</div>
          <div className="text-[10px] text-fg-muted">× DRQS⁻¹ × stress</div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Sleeve Total</div>
          <div className="font-display mt-1 text-lg text-gold">
            ${data.exposure.totalStablecoinUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-fg-muted">
            {data.exposure.withinLimits ? "✓ Within cap" : "✗ Exceeds cap"} ·{" "}
            {data.exposure.concentrationOk ? "✓ Diversified" : "✗ Concentrated"}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-gold/30 bg-gold/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gold">
            <AlertTriangle className="h-3.5 w-3.5" /> Advisory Warnings ({data.warnings.length})
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
            {data.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] text-fg-muted">
        <span>
          Data sources: CoinGecko (stablecoin prices) · gold-api.com · open.er-api.com · Turso (historical) — all free, no API keys.
        </span>
        <span>Updated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
