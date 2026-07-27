"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Loader2,
  Send,
  ShieldCheck,
  AlertTriangle,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/**
 * Mithqal Brain — multi-model consensus AI panel.
 *
 * Rendered at the bottom of the authenticated Admin console (after the
 * Oracle section). Surfaces 4 capabilities:
 *
 *   1. Brain status     — 3 model cards (Gemini / HuggingFace / Groq) with
 *                         green/red connectivity dots + latency.
 *   2. Ask the Brain    — free-form prompt → consensus answer + recommendations.
 *   3. Risk Monitor     — live currency risk read; auto-refreshes every 5 min.
 *   4. Compliance check — KYC screening form (operator-only; POST /api/brain/compliance).
 *   5. Anomaly feed     — latest on-chain anomaly findings; auto-refreshes.
 *
 * Constitutional compliance:
 *   - The Brain is ADVISORY ONLY. It never touches NAV/weights/reserves.
 *   - All responses include the consensus level so the operator knows
 *     when to escalate to human review (red = needs review).
 *
 * Failure model:
 *   - If 1 of 3 models is down, the Brain still responds (consensus
 *     caps at "medium").
 *   - If all 3 are down, the Brain returns a "low" consensus with a
 *     degraded message — the operator sees the failure clearly.
 */

type Consensus = "high" | "medium" | "low";

interface ModelStatus {
  model: "gemini" | "huggingface" | "groq";
  label: string;
  connected: boolean;
  configured: boolean;
  latencyMs: number;
  error?: string;
}

interface BrainStatus {
  models: ModelStatus[];
  consensusEligible: boolean;
  timestamp: string;
}

interface BrainModelResponse {
  model: string;
  label: string;
  ok: boolean;
  confidence: number;
  latencyMs: number;
  error?: string;
}

interface BrainQueryResponse {
  query: string;
  type: string;
  consensus: Consensus;
  models: BrainModelResponse[];
  combinedAnswer: string;
  recommendations: string[];
  timestamp: string;
  modelsResponded: number;
}

interface RiskRow {
  currency: string;
  riskLevel: "low" | "medium" | "high";
  factors: string[];
  recommendation: string;
}

interface RiskMonitorResponse {
  risks: RiskRow[];
  consensus: Consensus;
  models: BrainModelResponse[];
  combinedAnswer: string;
  recommendations: string[];
  currencyData: {
    goldUsd?: number;
    silverUsd?: number;
    reserveRatio?: number;
    navUsd?: number;
    supplyMtq?: number;
    source?: string;
    timestamp?: string;
  };
  timestamp: string;
}

interface ComplianceResponse {
  riskScore: number;
  flags: string[];
  recommendation: "clear" | "review" | "escalate";
  consensus: Consensus;
  models: BrainModelResponse[];
  combinedAnswer: string;
  timestamp: string;
}

interface AnomalyFinding {
  txHash: string;
  type: string;
  reason: string;
  severity: "info" | "warning" | "critical";
}

interface AnomalyResponse {
  anomalies: AnomalyFinding[];
  consensus: Consensus;
  models: BrainModelResponse[];
  combinedAnswer: string;
  scannedCount: number;
  timestamp: string;
}

const CONSENSUS_STYLES: Record<
  Consensus,
  { label: string; tone: string; dot: string }
> = {
  high: {
    label: "High consensus",
    tone: "border-reserve/40 bg-reserve/10 text-reserve",
    dot: "bg-reserve",
  },
  medium: {
    label: "Medium consensus",
    tone: "border-gold/40 bg-gold/10 text-gold",
    dot: "bg-gold",
  },
  low: {
    label: "Low consensus · needs review",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

const RISK_STYLES: Record<RiskRow["riskLevel"], string> = {
  low: "border-reserve/40 bg-reserve/10 text-reserve",
  medium: "border-gold/40 bg-gold/10 text-gold",
  high: "border-destructive/40 bg-destructive/10 text-destructive",
};

const SEVERITY_STYLES: Record<AnomalyFinding["severity"], string> = {
  info: "border-fg-muted/40 bg-fg-muted/5 text-fg-muted",
  warning: "border-gold/40 bg-gold/10 text-gold",
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function BrainPanel() {
  return (
    <div className="mt-8 space-y-6">
      <BrainHeader />
      <BrainModelCards />
      <BrainAskSection />
      <BrainRiskSection />
      <BrainComplianceSection />
      <BrainAnomalySection />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

function BrainHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/40 bg-gold/10">
        <Brain className="h-5 w-5 text-gold" />
      </div>
      <div>
        <h2 className="font-display text-2xl text-foreground">
          Mithqal <span className="gold-text">Brain</span>
        </h2>
        <p className="text-xs text-fg-muted">
          Multi-model consensus AI · Gemini + HuggingFace + Groq · advisory only
        </p>
      </div>
      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-[10px] font-semibold text-gold">
        <Sparkles className="h-3 w-3" /> 3-model consensus
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Model status cards                                                 */
/* ------------------------------------------------------------------ */

function BrainModelCards() {
  const [status, setStatus] = useState<BrainStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brain", { cache: "no-store" });
      if (res.ok) setStatus((await res.json()) as BrainStatus);
    } catch {
      // leave stale status if any
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000); // refresh status every minute
    return () => clearInterval(id);
  }, [refresh]);

  const models: ModelStatus[] = status?.models ?? [
    { model: "gemini", label: "Gemini", connected: false, configured: false, latencyMs: 0 },
    { model: "huggingface", label: "HuggingFace", connected: false, configured: false, latencyMs: 0 },
    { model: "groq", label: "Groq", connected: false, configured: false, latencyMs: 0 },
  ];

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-gold" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Brain status
        </h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1 text-[10px] text-fg-muted transition hover:text-gold disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {models.map((m) => (
          <div
            key={m.model}
            className={`rounded-lg border p-3 ${
              m.connected
                ? "border-reserve/30 bg-reserve/[0.04]"
                : "border-line bg-ink-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  m.connected
                    ? "bg-reserve animate-pulse"
                    : m.configured
                      ? "bg-gold"
                      : "bg-fg-muted/40"
                }`}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-foreground">
                {m.label}
              </span>
              {m.connected ? (
                <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-reserve" />
              ) : (
                <XCircle className="ml-auto h-3.5 w-3.5 text-destructive/60" />
              )}
            </div>
            <div className="mt-2 text-[10px] text-fg-muted">
              {m.connected
                ? `Connected · ${m.latencyMs}ms`
                : m.configured
                  ? m.error
                    ? `Error: ${m.error.slice(0, 60)}${m.error.length > 60 ? "…" : ""}`
                    : "Configured but unreachable"
                  : "Not configured (env var missing)"}
            </div>
          </div>
        ))}
      </div>
      {status && (
        <div className="mt-3 text-[10px] text-fg-muted">
          Consensus-eligible:{" "}
          <span className={status.consensusEligible ? "text-reserve" : "text-destructive"}>
            {status.consensusEligible ? "Yes (≥2 models online)" : "No (need ≥2 models online)"}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ask the Brain                                                      */
/* ------------------------------------------------------------------ */

function BrainAskSection() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BrainQueryResponse | null>(null);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt.trim(), type: "general" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as BrainQueryResponse;
      setResponse(json);
      toast({ title: "Brain consensus reached", description: `Consensus: ${json.consensus}` });
    } catch (err) {
      toast({
        title: "Brain query failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <Send className="h-3.5 w-3.5 text-gold" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Ask the Brain
        </h3>
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything about Mithqal, MTQ, the reserve, or risks…"
          disabled={loading}
          className="bg-ink-card"
        />
        <Button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="bg-gold text-ink hover:bg-gold-soft disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            <ConsensusBadge consensus={response.consensus} models={response.models} />
            <div className="rounded-lg border border-line bg-ink-card p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Combined answer
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {response.combinedAnswer}
              </p>
            </div>
            {response.recommendations.length > 0 && (
              <div className="rounded-lg border border-line bg-ink-card p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  Recommendations
                </div>
                <ul className="mt-2 space-y-1">
                  {response.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <span className="text-gold">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Risk Monitor                                                       */
/* ------------------------------------------------------------------ */

function BrainRiskSection() {
  const [data, setData] = useState<RiskMonitorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/brain/risk", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as RiskMonitorResponse;
        if (mounted.current) {
          setData(json);
          setLastUpdated(new Date());
        }
      }
    } catch {
      // leave stale data
    } finally {
      if (mounted.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh(false);
    // Auto-refresh every 5 minutes (silent — no spinner).
    const id = setInterval(() => refresh(true), 5 * 60_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-gold" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Risk Monitor
        </h3>
        <span className="ml-auto text-[10px] text-fg-muted">
          Auto-refresh: 5 min{lastUpdated ? ` · last: ${timeAgo(lastUpdated)}` : ""}
        </span>
        <button
          onClick={() => refresh(false)}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[10px] text-fg-muted transition hover:text-gold disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {data?.currencyData && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <MiniStat label="Gold" value={`$${data.currencyData.goldUsd?.toFixed(2) ?? "—"}`} />
          <MiniStat label="Silver" value={`$${data.currencyData.silverUsd?.toFixed(2) ?? "—"}`} />
          <MiniStat
            label="NAV"
            value={`$${data.currencyData.navUsd?.toFixed(4) ?? "—"}`}
          />
          <MiniStat
            label="Reserve ratio"
            value={`${((data.currencyData.reserveRatio ?? 0) * 100).toFixed(2)}%`}
          />
          <MiniStat
            label="Supply"
            value={`${data.currencyData.supplyMtq?.toLocaleString() ?? "—"}`}
          />
          <MiniStat label="Source" value={data.currencyData.source ?? "—"} />
        </div>
      )}

      {data && <ConsensusBadge consensus={data.consensus} models={data.models} />}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data?.risks.map((r) => (
          <div key={r.currency} className="rounded-lg border border-line bg-ink-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{r.currency}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${RISK_STYLES[r.riskLevel]}`}
              >
                {r.riskLevel}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {r.factors.map((f, i) => (
                <li key={i} className="text-[10px] text-fg-muted">· {f}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-foreground">{r.recommendation}</p>
          </div>
        ))}
      </div>

      {!data && loading && (
        <div className="mt-4 text-center text-xs text-fg-muted">
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-gold" />
          <p className="mt-2">Querying 3 models in parallel…</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compliance Assistant                                               */
/* ------------------------------------------------------------------ */

function BrainComplianceSection() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResponse | null>(null);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Missing required fields",
        description: "Full name and email are required.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/brain/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          org: org.trim() || undefined,
          role: role.trim() || undefined,
        }),
      });
      if (res.status === 401) {
        toast({
          title: "Authentication required",
          description: "Sign in as the operator to run KYC screening.",
          variant: "destructive",
        });
        return;
      }
      if (res.status === 429) {
        toast({
          title: "Rate limited",
          description: "Too many compliance checks. Wait a minute and retry.",
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ComplianceResponse;
      setResult(json);
      toast({
        title: "Compliance screening complete",
        description: `Score ${json.riskScore} · ${json.recommendation}`,
      });
    } catch (err) {
      toast({
        title: "Compliance screening failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-gold" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Compliance Assistant (KYC)
        </h3>
        <span className="ml-auto rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-gold">
          Operator only
        </span>
      </div>
      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Full name *
          </span>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            disabled={loading}
            className="mt-1 bg-ink-card"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Email *
          </span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@org.com"
            disabled={loading}
            className="mt-1 bg-ink-card"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Organization
          </span>
          <Input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Acme Capital"
            disabled={loading}
            className="mt-1 bg-ink-card"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Role interest
          </span>
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="investor | advisor | anchor"
            disabled={loading}
            className="mt-1 bg-ink-card"
          />
        </label>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gold text-ink hover:bg-gold-soft disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Screening…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Run KYC screening
              </>
            )}
          </Button>
        </div>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            <ConsensusBadge consensus={result.consensus} models={result.models} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-ink-card p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  Risk score
                </div>
                <div
                  className={`mt-1 font-display text-3xl ${
                    result.riskScore >= 70
                      ? "text-destructive"
                      : result.riskScore >= 40
                        ? "text-gold"
                        : "text-reserve"
                  }`}
                >
                  {result.riskScore}
                  <span className="ml-1 text-xs text-fg-muted">/ 100</span>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-ink-card p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  Recommendation
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      result.recommendation === "clear"
                        ? "border-reserve/40 bg-reserve/10 text-reserve"
                        : result.recommendation === "review"
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-destructive/40 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {result.recommendation === "clear" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {result.recommendation}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-ink-card p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  Flags
                </div>
                <div className="mt-1 text-2xl font-display text-foreground">
                  {result.flags.length}
                </div>
              </div>
            </div>
            {result.flags.length > 0 && (
              <div className="rounded-lg border border-line bg-ink-card p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  Detected flags
                </div>
                <ul className="mt-2 space-y-1">
                  {result.flags.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Anomaly feed                                                       */
/* ------------------------------------------------------------------ */

function BrainAnomalySection() {
  const [data, setData] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/brain/anomaly", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as AnomalyResponse;
        if (mounted.current) {
          setData(json);
          setLastUpdated(new Date());
        }
      }
    } catch {
      // leave stale data
    } finally {
      if (mounted.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh(false);
    // Auto-refresh every 5 minutes (silent).
    const id = setInterval(() => refresh(true), 5 * 60_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-gold" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Anomaly feed
        </h3>
        <span className="ml-auto text-[10px] text-fg-muted">
          Auto-refresh: 5 min{lastUpdated ? ` · last: ${timeAgo(lastUpdated)}` : ""}
        </span>
        <button
          onClick={() => refresh(false)}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[10px] text-fg-muted transition hover:text-gold disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {data && (
        <div className="mt-3 flex items-center gap-3 text-[10px] text-fg-muted">
          <span>
            Scanned <span className="text-foreground">{data.scannedCount}</span> txs
          </span>
          <span>·</span>
          <span>
            Found <span className="text-foreground">{data.anomalies.length}</span> anomalies
          </span>
        </div>
      )}

      {data && <ConsensusBadge consensus={data.consensus} models={data.models} />}

      <div className="mt-4 space-y-2">
        {data?.anomalies.length === 0 && (
          <div className="rounded-lg border border-reserve/30 bg-reserve/[0.04] p-4 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-reserve" />
            <p className="mt-2 text-sm text-foreground">No anomalies detected</p>
            <p className="text-[10px] text-fg-muted">
              All scanned transactions look normal.
            </p>
          </div>
        )}
        {data?.anomalies.map((a, i) => (
          <div key={`${a.txHash}-${i}`} className="rounded-lg border border-line bg-ink-card p-3">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${SEVERITY_STYLES[a.severity]}`}
              >
                {a.severity}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                {a.type}
              </span>
              <a
                href={`https://testnet.monadscan.com/tx/${a.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto truncate font-mono text-[10px] text-fg-muted transition hover:text-gold"
              >
                {a.txHash.slice(0, 10)}…{a.txHash.slice(-6)}
              </a>
            </div>
            <p className="mt-2 text-sm text-foreground">{a.reason}</p>
          </div>
        ))}
      </div>

      {!data && loading && (
        <div className="mt-4 text-center text-xs text-fg-muted">
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-gold" />
          <p className="mt-2">Scanning recent transactions…</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared subcomponents                                               */
/* ------------------------------------------------------------------ */

function ConsensusBadge({
  consensus,
  models,
}: {
  consensus: Consensus;
  models: BrainModelResponse[];
}) {
  const style = CONSENSUS_STYLES[consensus];
  const okCount = models.filter((m) => m.ok).length;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${style.tone}`}
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}
      </span>
      <span className="text-[10px] text-fg-muted">
        {okCount}/3 models responded
      </span>
      <div className="ml-auto flex gap-1">
        {models.map((m) => (
          <span
            key={m.model}
            title={
              m.ok
                ? `${m.label}: ${Math.round(m.confidence * 100)}% confidence · ${m.latencyMs}ms`
                : `${m.label}: ${m.error ?? "failed"}`
            }
            className={`inline-flex h-1.5 w-6 rounded-full ${
              m.ok
                ? "bg-reserve/60"
                : "bg-destructive/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-card p-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-fg-muted">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
