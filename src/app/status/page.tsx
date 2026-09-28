"use client";

/**
 * Mithqal System Status page (/status).
 *
 * A simple, public, single-page status dashboard. Polls:
 *   • /api/health      — DB / RPC / Oracle / SMTP service checks
 *   • /api/onchain-test — 15 live on-chain contract verification checks
 *
 * Auto-refreshes every 30 seconds. Uses the existing Mithqal dark/gold
 * institutional theme (no new dependencies).
 *
 * The page is intentionally low-friction: a single table per section with
 * green/red indicators, an overall status pill at the top, and a "last
 * updated" timestamp that ticks live (every second) so visitors can see the
 * page is alive even when nothing is changing.
 *
 * Constitutional context:
 *   Article IV (Transparency Cadence) requires continuously verifiable state.
 *   This page is the public-facing surface of that requirement — a citizen,
 *   auditor, or regulator can bookmark it and see at a glance whether the
 *   institution's public infrastructure is healthy.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHAINS, SOLANA_NETWORKS, type ChainConfig, type SolanaNetwork } from "@/lib/chains";

/* ---- Types matching the /api/health and /api/onchain-test responses ---- */

type CheckResult = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  detail?: string;
};

type HealthResponse = {
  status: "healthy" | "degraded" | "down";
  checks: {
    db: CheckResult;
    rpc: CheckResult;
    oracle: CheckResult;
    smtp: CheckResult;
  };
  generatedAt?: string;
  error?: string;
};

type OnchainTest = {
  name: string;
  passed: boolean;
  value?: string;
  detail?: string;
};

type OnchainResponse = {
  summary?: { total: number; passed: number; failed: number; score?: string };
  tests?: OnchainTest[];
  generatedAt?: string;
  error?: string;
};

const POLL_INTERVAL_MS = 30_000;

/* ---- Helper: render a single service row ---- */

function ServiceRow({
  name,
  description,
  result,
}: {
  name: string;
  description: string;
  result: CheckResult | undefined;
}) {
  const ok = result?.ok ?? false;
  const loading = !result;
  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-3 pr-4 align-middle">
        <div className="flex items-center gap-2.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />
          ) : ok ? (
            <CheckCircle2 className="h-4 w-4 text-reserve" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="font-medium text-foreground">{name}</span>
        </div>
      </td>
      <td className="py-3 pr-4 align-middle text-xs text-fg-muted">{description}</td>
      <td className="py-3 pr-4 align-middle">
        {loading ? (
          <span className="text-xs text-fg-muted">checking…</span>
        ) : ok ? (
          <span className="text-xs text-reserve">Operational</span>
        ) : (
          <span className="text-xs text-destructive">Down</span>
        )}
      </td>
      <td className="py-3 align-middle text-right text-xs text-fg-muted tabular-nums">
        {result?.latencyMs != null ? `${result.latencyMs}ms` : result?.detail ?? result?.error ?? "—"}
      </td>
    </tr>
  );
}

/* ---- Helper: overall status pill ---- */

function OverallStatusPill({ status }: { status: "healthy" | "degraded" | "down" | "loading" }) {
  if (status === "loading") {
    return (
      <Badge className="border-gold/40 bg-gold/10 text-gold">
        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Checking…
      </Badge>
    );
  }
  if (status === "healthy") {
    return (
      <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
        <ShieldCheck className="mr-1.5 h-3 w-3" /> All Systems Operational
      </Badge>
    );
  }
  if (status === "degraded") {
    return (
      <Badge className="border-gold/40 bg-gold/10 text-gold">
        <AlertTriangle className="mr-1.5 h-3 w-3" /> Degraded
      </Badge>
    );
  }
  return (
    <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
      <XCircle className="mr-1.5 h-3 w-3" /> Outage
    </Badge>
  );
}

/* ---- Helper: relative "Xs ago" timestamp ---- */

function timeAgo(iso: string | null, mounted: boolean): string {
  if (!iso) return "never";
  if (!mounted) return "…";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/* ---- Main page ---- */

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [onchain, setOnchain] = useState<OnchainResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0); // forces re-render every second for the "Xs ago" label
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, onchainRes] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/onchain-test", { cache: "no-store" }),
      ]);
      const healthData = (await healthRes.json().catch(() => null)) as HealthResponse | null;
      const onchainData = (await onchainRes.json().catch(() => null)) as OnchainResponse | null;
      if (!mountedRef.current) return;
      setHealth(healthData);
      setOnchain(onchainData);
      setLastUpdated(new Date().toISOString());
    } catch {
      // Network failure — leave previous state in place but mark updated time.
      if (!mountedRef.current) return;
      setLastUpdated(new Date().toISOString());
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    fetchAll();
    const pollId = setInterval(fetchAll, POLL_INTERVAL_MS);
    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [fetchAll]);

  /* ---- Derive the overall status from the health response ---- */
  const serviceStatus: "healthy" | "degraded" | "down" | "loading" = loading
    ? "loading"
    : health?.status === "healthy"
      ? "healthy"
      : health?.status === "degraded"
        ? "degraded"
        : "down";

  // On-chain summary score (15/15 = full pass).
  const ocSummary = onchain?.summary;
  const ocTotal = ocSummary?.total ?? 0;
  const ocPassed = ocSummary?.passed ?? 0;
  const ocFailed = ocSummary?.failed ?? 0;
  const onchainHealthy = ocTotal > 0 && ocFailed === 0;

  return (
    <main className="grain-bg min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-fg-muted transition hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Mithqal
          </Link>
          <Logo className="h-9 w-9" />
        </div>

        {/* Title + overall status */}
        <div className="mt-6">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            Mithqal System Status
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Real-time health of the Mithqal public infrastructure — database,
            RPC, oracle, SMTP, and the 15-check on-chain contract verification
            suite. Auto-refreshes every 30 seconds.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <OverallStatusPill status={serviceStatus} />
            <Badge
              className={
                onchainHealthy
                  ? "border-reserve/40 bg-reserve/10 text-reserve"
                  : ocTotal === 0
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
              }
            >
              <Activity className="mr-1.5 h-3 w-3" />
              On-Chain: {ocTotal === 0 ? "—" : `${ocPassed}/${ocTotal}`}
            </Badge>
            <span className="text-xs text-fg-muted">
              Last updated: <span className="tabular-nums">{timeAgo(lastUpdated, mounted)}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchAll();
              }}
              className="inline-flex items-center gap-1 text-xs text-fg-muted transition hover:text-gold"
              aria-label="Refresh now"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Service health table */}
        <section className="mt-8">
          <h2 className="font-display text-lg text-foreground">Service Health</h2>
          <p className="mb-3 text-xs text-fg-muted">
            Probes the four upstream dependencies the public app depends on
            (source:{" "}
            <code className="rounded bg-ink-card px-1 py-0.5 text-[11px] text-foreground">
              /api/health
            </code>
            ).
          </p>
          <div className="overflow-x-auto rounded-lg border border-line bg-ink-card/60">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-soft/40">
                <tr className="text-xs uppercase tracking-wider text-fg-muted">
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="px-4">
                <ServiceRow
                  name="Database"
                  description="Turso (libsql) — operational datastore"
                  result={health?.checks?.db}
                />
                <ServiceRow
                  name="RPC"
                  description="Monad Testnet JSON-RPC (eth_blockNumber)"
                  result={health?.checks?.rpc}
                />
                <ServiceRow
                  name="Oracle"
                  description="Internal /api/oracle (gold + FX + crypto)"
                  result={health?.checks?.oracle}
                />
                <ServiceRow
                  name="SMTP"
                  description="Outbound email (SMTP_HOST configured)"
                  result={health?.checks?.smtp}
                />
              </tbody>
            </table>
          </div>
          {health?.error && (
            <p className="mt-2 text-xs text-destructive">Error: {health.error}</p>
          )}
        </section>

        {/* On-chain verification table */}
        <section className="mt-10">
          <h2 className="font-display text-lg text-foreground">On-Chain Verification</h2>
          <p className="mb-3 text-xs text-fg-muted">
            Live reads from the deployed MTQ v19.0.3 contract suite on Monad
            Testnet (source:{" "}
            <code className="rounded bg-ink-card px-1 py-0.5 text-[11px] text-foreground">
              /api/onchain-test
            </code>
            ). Target: 15/15.
          </p>
          <div className="overflow-x-auto rounded-lg border border-line bg-ink-card/60">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink-soft/40">
                <tr className="text-xs uppercase tracking-wider text-fg-muted">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Check</th>
                  <th className="px-4 py-2.5 font-medium">Result</th>
                  <th className="px-4 py-2.5 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="px-4">
                {onchain?.tests && onchain.tests.length > 0 ? (
                  onchain.tests.map((t, i) => (
                    <tr key={t.name + i} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5 text-xs text-fg-muted tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {t.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-reserve" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                          )}
                          <span className="text-foreground">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={t.passed ? "text-xs text-reserve" : "text-xs text-destructive"}>
                          {t.passed ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-fg-muted tabular-nums">
                        {t.value ?? "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-fg-muted">
                      {loading ? "Loading on-chain checks…" : "No on-chain test data available."}
                    </td>
                  </tr>
                )}
              </tbody>
              {ocSummary && (
                <tfoot className="border-t border-line bg-ink-soft/40">
                  <tr className="text-xs text-fg-muted">
                    <td colSpan={2} className="px-4 py-2.5 font-medium">
                      Summary
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          onchainHealthy ? "text-reserve" : "text-destructive"
                        }
                      >
                        {ocPassed}/{ocTotal} pass
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {ocSummary.score ?? "—"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {onchain?.error && (
            <p className="mt-2 text-xs text-destructive">Error: {onchain.error}</p>
          )}
        </section>

        {/* Contract addresses (Defect 8 fix, audit 2-A): display the raw 0x
            contract addresses for every deployed network on the status page
            itself, with copy-to-clipboard buttons. Sourced from
            src/lib/chains.ts (the same module /api/contract/info and
            /api/status consume) so the displayed addresses cannot drift from
            the canonical registry. */}
        <ContractAddressesSection />

        {/* Footer link back to main site */}
        <footer className="mt-12 border-t border-line pt-6 text-xs text-fg-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Need details? See the{" "}
              <Link href="/api-docs" className="text-gold hover:underline">
                API reference
              </Link>{" "}
              or{" "}
              <Link href="/" className="text-gold hover:underline">
                return to the institution
              </Link>
              .
            </span>
            <span className="tabular-nums">
              {lastUpdated
                ? `Fetched: ${new Date(lastUpdated).toISOString()}`
                : "Not yet fetched"}
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Contract Addresses section (Defect 8 — audit 2-A)                 */
/* ------------------------------------------------------------------ */
/*
 * Renders the canonical EVM (Monad / Arc / Local) + Solana contract
 * addresses directly on the public status page, each with a
 * copy-to-clipboard button. Sourced from src/lib/chains.ts so there is a
 * single source of truth (the same module /api/contract/info and
 * /api/status consume).
 */

type ContractEntry = {
  /** Short label, e.g. "MTQ Token", "Governance". */
  name: string;
  /** 0x… EVM address OR base58 Solana mint/wallet. */
  address: string;
  /** Optional explorer URL for this address on its chain. */
  explorerUrl?: string;
};

function buildEvmEntries(chain: ChainConfig): ContractEntry[] {
  const c = chain.contracts;
  const base = chain.explorer;
  const link = (addr: string) => (base ? `${base}/address/${addr}` : undefined);
  return [
    { name: "MTQ Token", address: c.MTQ_TOKEN, explorerUrl: link(c.MTQ_TOKEN) },
    { name: "Governance", address: c.GOVERNANCE, explorerUrl: link(c.GOVERNANCE) },
    { name: "Safe Multi-Sig", address: c.SAFE_MULTI_SIG, explorerUrl: link(c.SAFE_MULTI_SIG) },
    { name: "Algorithm", address: c.ALGORITHM, explorerUrl: link(c.ALGORITHM) },
    { name: "Reserve", address: c.RESERVE, explorerUrl: link(c.RESERVE) },
    { name: "Mint", address: c.MINT, explorerUrl: link(c.MINT) },
    { name: "Redeem", address: c.REDEEM, explorerUrl: link(c.REDEEM) },
    { name: "Oracle", address: c.ORACLE, explorerUrl: link(c.ORACLE) },
    { name: "Takaful", address: c.TAKAFUL, explorerUrl: link(c.TAKAFUL) },
    { name: "Deployer", address: c.DEPLOYER, explorerUrl: link(c.DEPLOYER) },
  ];
}

function buildSolanaEntries(net: SolanaNetwork): ContractEntry[] {
  const base = net.explorer;
  return [
    {
      name: "SPL Mint Address",
      address: net.mintAddress,
      explorerUrl: `${base}/address/${net.mintAddress}`,
    },
    {
      name: "Treasury Wallet",
      address: net.walletAddress,
      explorerUrl: `${base}/address/${net.walletAddress}`,
    },
  ];
}

function ContractAddressesSection() {
  // Hide the local Anvil chain on the public status page — it only exists
  // in developer sandboxes, never in production. Monad + Arc + Solana are
  // the publicly verifiable deployments.
  const evmChains = [CHAINS.monad, CHAINS.arc];
  const solanaNets = SOLANA_NETWORKS;

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg text-foreground">Contract Addresses</h2>
      <p className="mb-3 text-xs text-fg-muted">
        Canonical deployment addresses for every public network Mithqal is
        deployed on. Sourced from{" "}
        <code className="rounded bg-ink-card px-1 py-0.5 text-[11px] text-foreground">
          src/lib/chains.ts
        </code>{" "}
        — the same module{" "}
        <code className="rounded bg-ink-card px-1 py-0.5 text-[11px] text-foreground">
          /api/contract/info
        </code>{" "}
        consumes. Tap an address to copy it.
      </p>

      <div className="space-y-6">
        {evmChains.map((chain) => (
          <ContractCard
            key={chain.key}
            heading={chain.name}
            subheading={`Chain ID ${chain.chainId} · ${chain.rpcUrl}`}
            entries={buildEvmEntries(chain)}
          />
        ))}

        {solanaNets.map((net) => (
          <ContractCard
            key={net.key}
            heading={net.name}
            subheading={`Non-EVM SPL · ${net.rpcUrl}`}
            entries={buildSolanaEntries(net)}
          />
        ))}
      </div>
    </section>
  );
}

function ContractCard({
  heading,
  subheading,
  entries,
}: {
  heading: string;
  subheading: string;
  entries: ContractEntry[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-ink-card/60">
      <div className="border-b border-line bg-ink-soft/40 px-4 py-2.5">
        <div className="text-sm font-semibold text-foreground">{heading}</div>
        <div className="mt-0.5 break-all text-[11px] text-fg-muted">{subheading}</div>
      </div>
      <div className="divide-y divide-line/60">
        {entries.map((entry) => (
          <ContractRow key={entry.name + entry.address} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function ContractRow({ entry }: { entry: ContractEntry }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(entry.address);
      } else {
        // Legacy fallback for headless / older browsers.
        const ta = document.createElement("textarea");
        ta.value = entry.address;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op — clipboard may be blocked in some sandbox contexts */
    }
  }, [entry.address]);

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground">{entry.name}</div>
        <code className="block break-all font-mono text-[11px] text-fg-muted">
          {entry.address}
        </code>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {entry.explorerUrl && (
          <a
            href={entry.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-fg-muted transition hover:text-gold"
            aria-label={`Open ${entry.name} on block explorer`}
            title="Open on block explorer"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          aria-label={`Copy ${entry.name} address to clipboard`}
          title="Copy to clipboard"
          className="h-8 gap-1.5 px-2.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-reserve" />
              <span className="text-[11px] text-reserve">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
