"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Coins, FileCheck, Building2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

/**
 * V24.2.1 Portfolio B Panel
 * -------------------------
 * Displays the APPROVED Portfolio B configuration (15% physical gold + 5%
 * tokenized PAXG + 0% silver + 77.5% fiat + 2.5% digital) with:
 *   - Live gold split (physical vs tokenized)
 *   - PAXG attestation status (issuer, auditor, regulator, custody)
 *   - TGRS monitor (fail-closed gate)
 *   - Anti-double-counting runtime guard
 *
 * Fetches from /api/v24.2.1.
 */

interface V2421Data {
  version: string;
  status: string;
  productionDecision: string;
  approvedPortfolio: {
    name: string;
    physicalGold: number;
    tokenizedGold: number;
    silver: number;
    fiat: number;
    digital: number;
    status: string;
    approvalDate: string;
    approvalAuthority: string;
    decisionBasis: string[];
  };
  tokenizedGold: {
    tgrs: { score: number; classification: string; haircutRecommendation: number; eligible: boolean };
    eligibility: { passed: boolean; failures: string[] };
    canonicalProduct: {
      ticker: string;
      name: string;
      issuer: string;
      chain: string;
      contractAddress: string;
      tgrs: number;
      haircut: number;
      admitted: boolean;
    } | null;
    tgrsMonitor: {
      product: string;
      currentTgrs: number;
      threshold: number;
      gatePassed: boolean;
      action: "OK" | "SUSPEND" | "INVESTIGATE";
      reason: string;
      nextReviewDate: string;
    } | null;
    antiDoubleCountGuard: {
      physicalGold: number;
      tokenizedGold: number;
      goldTotal: number;
      tokenizedAdmitted: boolean;
      invariantHolds: boolean;
      reason: string;
    } | null;
    attestation: {
      issuer: string;
      auditor: string;
      regulator: string;
      formalVerification: string;
      custody: string;
      barSerials: string;
    };
  };
  conditionalSilver: {
    policy: string;
    admissionTest: { admitted: boolean; reason: string; sdcAg: number };
  };
  liveValues: {
    rr: number;
    goldUsd: number;
    silverUsd: number;
  };
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function StatusIcon({ ok, size = 16 }: { ok: boolean; size?: number }) {
  return ok
    ? <CheckCircle2 size={size} className="text-emerald-500" />
    : <XCircle size={size} className="text-rose-500" />;
}

export function PortfolioBPanel() {
  const [data, setData] = useState<V2421Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/v24.2.1");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60_000); // refresh every 60s
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border border-line bg-surface p-6">
        <div className="h-4 w-48 animate-pulse rounded bg-line" />
        <div className="mt-4 h-32 animate-pulse rounded bg-line/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-6 rounded-xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
        <AlertTriangle className="mb-2" size={18} />
        v24.2.1 Portfolio B data unavailable: {error ?? "no data"}
      </div>
    );
  }

  const tg = data.tokenizedGold;
  const monitor = tg.tgrsMonitor;
  const guard = tg.antiDoubleCountGuard;
  const portfolio = data.approvedPortfolio;

  return (
    <section
      aria-labelledby="portfolio-b-heading"
      className="mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Coins size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 id="portfolio-b-heading" className="text-base font-semibold text-fg">
            v24.2.1 — Portfolio B: Tokenized Allocated Gold + Conditional Silver
          </h3>
          <p className="text-xs text-fg-muted">
            APPROVED {portfolio.approvalDate} · {portfolio.approvalAuthority}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          <ShieldCheck size={14} />
          {data.productionDecision}
        </span>
      </header>

      {/* Portfolio composition bar */}
      <div className="mt-5">
        <div className="flex h-8 w-full overflow-hidden rounded-lg border border-line text-[10px] font-medium">
          <div
            className="flex items-center justify-center bg-amber-500 text-white"
            style={{ width: `${portfolio.physicalGold * 100}%` }}
            title={`Physical Gold: ${pct(portfolio.physicalGold)}`}
          >
            Au {pct(portfolio.physicalGold)}
          </div>
          <div
            className="flex items-center justify-center bg-amber-300 text-amber-900"
            style={{ width: `${portfolio.tokenizedGold * 100}%` }}
            title={`Tokenized Gold (PAXG): ${pct(portfolio.tokenizedGold)}`}
          >
            PAXG {pct(portfolio.tokenizedGold)}
          </div>
          <div
            className="flex items-center justify-center bg-slate-200 text-slate-700"
            style={{ width: `${portfolio.fiat * 100}%` }}
            title={`Fiat: ${pct(portfolio.fiat)}`}
          >
            Fiat {pct(portfolio.fiat)}
          </div>
          <div
            className="flex items-center justify-center bg-indigo-200 text-indigo-800"
            style={{ width: `${portfolio.digital * 100}%` }}
            title={`Digital: ${pct(portfolio.digital)}`}
          >
            Dig {pct(portfolio.digital)}
          </div>
        </div>
        <div className="mt-1.5 text-[11px] text-fg-muted">
          Silver: <span className="font-medium text-fg">0% (conditional)</span> ·
          Gold_total: <span className="font-medium text-fg">{pct(portfolio.physicalGold + portfolio.tokenizedGold)}</span> ·
          Bullion total: <span className="font-medium text-fg">{pct(portfolio.physicalGold + portfolio.tokenizedGold + portfolio.silver)}</span>
        </div>
      </div>

      {/* Gold split + TGRS monitor */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Gold split card */}
        <div className="rounded-lg border border-line bg-ink-card/30 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Coins size={15} className="text-amber-600" />
            Gold Reserve Split
          </h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-muted">Physical Allocated</span>
              <span className="font-mono font-medium">{pct(guard?.physicalGold ?? portfolio.physicalGold)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Tokenized (PAXG)</span>
              <span className="font-mono font-medium">
                {guard && !guard.tokenizedAdmitted
                  ? <span className="text-rose-600">0% (SUSPENDED)</span>
                  : pct(guard?.tokenizedGold ?? portfolio.tokenizedGold)}
              </span>
            </div>
            <div className="border-t border-line pt-2 flex justify-between">
              <span className="text-fg">Gold_total</span>
              <span className="font-mono font-bold text-amber-700">{pct(guard?.goldTotal ?? 0.20)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <StatusIcon ok={guard?.invariantHolds ?? false} size={14} />
              <span className="text-fg-muted">
                {guard?.invariantHolds
                  ? "Anti-double-counting invariant holds (Task 6: 32/32 PASS)"
                  : "INVARIANT VIOLATION — investigate immediately"}
              </span>
            </div>
          </div>
        </div>

        {/* TGRS monitor card */}
        <div className="rounded-lg border border-line bg-ink-card/30 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <ShieldCheck size={15} className="text-emerald-600" />
            TGRS Monitor (fail-closed)
          </h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-muted">Product</span>
              <span className="font-medium">{monitor?.product ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">TGRS Score</span>
              <span className="font-mono font-medium">{monitor?.currentTgrs.toFixed(2) ?? "—"} / 10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Threshold</span>
              <span className="font-mono">{monitor?.threshold.toFixed(1) ?? "8.0"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Action</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                monitor?.action === "OK"
                  ? "bg-emerald-100 text-emerald-700"
                  : monitor?.action === "INVESTIGATE"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              }`}>
                {monitor?.action ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-fg-muted">Next review</span>
              <span className="font-mono">{monitor?.nextReviewDate ?? "—"}</span>
            </div>
            <p className="text-xs text-fg-muted italic">{monitor?.reason}</p>
          </div>
        </div>
      </div>

      {/* PAXG attestation */}
      <div className="mt-4 rounded-lg border border-line bg-ink-card/30 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <FileCheck size={15} className="text-indigo-600" />
          PAXG Attestation Chain
        </h4>
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <Building2 size={12} /> Issuer
            </div>
            <div className="font-medium text-fg">{tg.attestation.issuer}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <FileCheck size={12} /> Auditor
            </div>
            <div className="font-medium text-fg">{tg.attestation.auditor}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <ShieldCheck size={12} /> Regulator
            </div>
            <div className="font-medium text-fg">{tg.attestation.regulator}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <CheckCircle2 size={12} /> Formal verification
            </div>
            <div className="font-medium text-fg">{tg.attestation.formalVerification}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <Coins size={12} /> Custody
            </div>
            <div className="font-medium text-fg">{tg.attestation.custody}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <ShieldAlert size={12} /> Bar serials
            </div>
            <div className="font-medium text-fg">{tg.attestation.barSerials}</div>
          </div>
        </div>
        {tg.canonicalProduct && (
          <div className="mt-3 border-t border-line pt-3 text-xs">
            <span className="text-fg-muted">Contract: </span>
            <span className="font-mono text-fg">{tg.canonicalProduct.contractAddress}</span>
            <span className="ml-2 text-fg-muted">· Haircut: </span>
            <span className="font-mono text-fg">{(tg.canonicalProduct.haircut * 100).toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Silver conditional */}
      <div className="mt-4 rounded-lg border border-line bg-ink-card/30 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <AlertTriangle size={15} className="text-amber-600" />
          Conditional Silver (SDC_Ag)
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-fg-muted">Policy: <span className="text-fg">{data.conditionalSilver.policy}</span></span>
          <span className="text-fg-muted">SDC_Ag: <span className="font-mono text-fg">{data.conditionalSilver.admissionTest.sdcAg}</span></span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
            data.conditionalSilver.admissionTest.admitted
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }`}>
            {data.conditionalSilver.admissionTest.admitted ? "ADMITTED" : "0% (valid)"}
          </span>
        </div>
        <p className="mt-1.5 text-xs italic text-fg-muted">{data.conditionalSilver.admissionTest.reason}</p>
      </div>

      {/* Decision basis */}
      <details className="mt-4 rounded-lg border border-line bg-ink-card/20 p-3 text-xs">
        <summary className="cursor-pointer font-medium text-fg">
          Decision basis (6-task validation)
        </summary>
        <ul className="mt-2 space-y-1 text-fg-muted">
          {portfolio.decisionBasis.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
