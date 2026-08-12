"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Activity, AlertTriangle, Layers, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CbgrsCurrency {
  currency: string;
  goldRelativeStrength: number;
  finalWeight: number;
  goldRelativeDepreciation: number;
}

interface CbgrsData {
  cbgrs: number;
  cbgrsArithmetic: number;
  baseDate: string;
  valuationTimestamp: string;
  eligibleCurrencyUniverse: string[];
  currencies: CbgrsCurrency[];
  weightsSumToOne: boolean;
  changeFromBase: number;
  oracleStatus: {
    goldSource: string;
    fxSource: string;
    staleInputs: string[];
  };
  rr: number;
  nav: {
    navM: number;
    goldUsd: number;
    usdConcentration: number;
  };
}

export function CbgrsPanel() {
  const [data, setData] = useState<CbgrsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCbgrs = useCallback(async () => {
    try {
      const res = await fetch("/api/cbgrs", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as CbgrsData;
        setData(json);
      }
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCbgrs();
    const id = setInterval(fetchCbgrs, 30_000);
    return () => clearInterval(id);
  }, [fetchCbgrs]);

  if (loading && !data) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-ink-card p-6">
        <div className="animate-pulse text-sm text-fg-muted">Loading CBGRS metric…</div>
      </div>
    );
  }

  if (!data) return null;

  const strengthTone =
    data.cbgrs >= 1.0 ? "text-reserve" : data.cbgrs >= 0.95 ? "text-gold" : "text-destructive";

  return (
    <div className="mt-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.04] to-ink-soft p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gold">
          <Globe className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            CBGRS · Currency Basket Gold-Relative Strength
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-line bg-ink text-fg-muted hover:bg-ink-card">
            <Activity className="mr-1 h-3 w-3" /> Auto-refresh 30s
          </Badge>
          <Badge className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/10">
            Layer 2 · Advisory
          </Badge>
        </div>
      </div>

      <p className="mt-2 text-xs text-fg-muted">
        Weighted geometric mean of reserve-currency strength relative to gold. Advisory only — does
        NOT replace RR, trigger rebalancing, or modify PAR.
      </p>

      {/* Main CBGRS value */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gold/30 bg-gold/[0.06] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            CBGRS (Canonical)
          </div>
          <div className={`font-display mt-1 text-2xl ${strengthTone}`}>
            {data.cbgrs.toFixed(6)}
          </div>
          <div className="text-[10px] text-fg-muted">
            Weighted geometric mean · Base: {data.baseDate}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            CBGRS Arithmetic (Diagnostic)
          </div>
          <div className="font-display mt-1 text-lg text-fg-muted">
            {data.cbgrsArithmetic.toFixed(6)}
          </div>
          <div className="text-[10px] text-fg-muted">NOT canonical — diagnostic only</div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Change from Base
          </div>
          <div
            className={`font-display mt-1 text-lg ${
              data.changeFromBase >= 0 ? "text-reserve" : "text-destructive"
            }`}
          >
            {data.changeFromBase >= 0 ? "+" : ""}
            {(data.changeFromBase * 100).toFixed(4)}%
          </div>
          <div className="text-[10px] text-fg-muted">
            {data.changeFromBase >= 0 ? "Basket strengthening vs gold" : "Basket weakening vs gold"}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            RR (Legal Solvency)
          </div>
          <div className="font-display mt-1 text-lg text-reserve">
            {data.rr.toFixed(2)}%
          </div>
          <div className="text-[10px] text-fg-muted">
            Single legal solvency metric · CBGRS ≠ RR
          </div>
        </div>
      </div>

      {/* Per-currency table */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          <TrendingUp className="h-3.5 w-3.5 text-gold" />
          Per-Currency Gold-Relative Strength (G_i) & Final Weight (w_i)
        </div>
        <div className="mt-2 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Currency</th>
                <th className="px-3 py-2 text-right font-semibold">G_i(t)</th>
                <th className="px-3 py-2 text-right font-semibold">w_i(t)</th>
                <th className="px-3 py-2 text-right font-semibold">Depreciation vs Gold</th>
                <th className="px-3 py-2 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.currencies.map((c) => {
                const tone =
                  c.goldRelativeStrength >= 1.0
                    ? "text-reserve"
                    : c.goldRelativeStrength >= 0.95
                      ? "text-gold"
                      : "text-destructive";
                const status =
                  c.goldRelativeStrength >= 1.0
                    ? "Strengthening"
                    : c.goldRelativeStrength >= 0.95
                      ? "Stable"
                      : "Weakening";
                return (
                  <tr key={c.currency} className="hover:bg-ink/50">
                    <td className="px-3 py-2 font-medium text-foreground">{c.currency}</td>
                    <td className={`px-3 py-2 text-right font-display ${tone}`}>
                      {c.goldRelativeStrength.toFixed(6)}
                    </td>
                    <td className="px-3 py-2 text-right text-fg-muted">
                      {(c.finalWeight * 100).toFixed(4)}%
                    </td>
                    <td className="px-3 py-2 text-right text-fg-muted">
                      {(c.goldRelativeDepreciation * 100).toFixed(4)}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-semibold ${tone}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification + oracle status */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Verification
          </div>
          <div className="mt-1 text-xs text-fg-muted">
            Weights sum to 1.0000: {data.weightsSumToOne ? "✓" : "✗"}
          </div>
          <div className="text-xs text-fg-muted">
            Eligible universe: {data.eligibleCurrencyUniverse.length} currencies
          </div>
          <div className="text-xs text-fg-muted">
            Methodology: {data.valuationTimestamp ? "v24.1.1 geometric mean" : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-ink p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Oracle Status
          </div>
          <div className="mt-1 text-xs text-fg-muted">Gold: {data.oracleStatus.goldSource}</div>
          <div className="text-xs text-fg-muted">FX: {data.oracleStatus.fxSource}</div>
          {data.oracleStatus.staleInputs.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gold">
              <AlertTriangle className="h-3 w-3" /> Stale: {data.oracleStatus.staleInputs.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Prohibited claims disclaimer */}
      <div className="mt-3 rounded-lg border border-line bg-ink-card p-3 text-[10px] leading-relaxed text-fg-muted">
        <strong>CBGRS</strong> is an advisory measure of the aggregate gold-relative strength of the
        active reserve-currency basket. It does NOT prove MTQ is stable, does NOT guarantee
        appreciation or purchasing power, and is NOT a solvency ratio. RR remains the single legal
        solvency metric. Gold is the constitutional anchor, NOT a peg.
      </div>
    </div>
  );
}
