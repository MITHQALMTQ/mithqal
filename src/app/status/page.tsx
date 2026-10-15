"use client";

/**
 * Mithqal System Status page (/status).
 *
 * A simple, public, single-page status dashboard. Polls:
 *   • /api/v1/health  — public service-availability stub
 *
 * NOTE (BUILD-1 remediation):
 *   The previous implementation polled `/api/health` and `/api/onchain-test`,
 *   neither of which exist in the current build (both return 404 — see
 *   dev.log). The page therefore silently fell into a permanent "error"
 *   state. This version polls the real `/api/v1/health` route and treats the
 *   on-chain verification suite as gracefully "unavailable" (the deep
 *   per-service checks and the 15-check on-chain suite are populated only in
 *   the pilot phase).
 *
 * Auto-refreshes every 30 seconds. The static structure (header, title,
 * contract-address table, footer) renders regardless of whether the fetch
 * succeeds — a network failure only blanks the live health pill, it does not
 * blank the page.
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

/* ---- Types matching the /api/v1/health response ----
 * The real `/api/v1/health` route returns a compact stub:
 *   { status: "OK", product, version, productionAuthorized, mtqSigma, timestamp }
 * The deeper `{ status, checks: { db, rpc, oracle, smtp } }` shape is kept as
 * a union member so the page keeps working unchanged the moment a richer
 * health route is wired up. */

type CheckResult = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  detail?: string;
};

type HealthResponse = {
  // Real /api/v1/health stub shape.
  status: "OK" | "healthy" | "degraded" | "down";
  product?: string;
  version?: string;
  productionAuthorized?: boolean;
  mtqSigma?: string;
  timestamp?: string;
  generatedAt?: string;
  // Optional deeper per-service checks — present only in the pilot phase.
  checks?: {
    db: CheckResult;
    rpc: CheckResult;
    oracle: CheckResult;
    smtp: CheckResult;
  };
  error?: string;
};

const POLL_INTERVAL_MS = 30_000;

/* ---- Helper: render a single service row ----
 * `pageLoading` distinguishes "fetch in flight" from "fetch complete but the
 * real endpoint returns no per-service checks". The latter is rendered as a
 * neutral "Unavailable" state (amber AlertTriangle) rather than a red "Down"
 * state — the service is not down, we simply have no per-service telemetry
 * in the current build. */

function ServiceRow({
  name,
  description,
  result,
  pageLoading,
}: {
  name: string;
  description: string;
  result: CheckResult | undefined;
  pageLoading: boolean;
}) {
  const ok = result?.ok ?? false;
  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-3 pr-4 align-middle">
        <div className="flex items-center gap-2.5">
          {pageLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />
          ) : !result ? (
            <AlertTriangle className="h-4 w-4 text-gold" />
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
        {pageLoading ? (
          <span className="text-xs text-fg-muted">checking…</span>
        ) : !result ? (
          <span className="text-xs text-gold">Unavailable</span>
        ) : ok ? (
          <span className="text-xs text-reserve">Operational</span>
        ) : (
          <span className="text-xs text-destructive">Down</span>
        )}
      </td>
      <td className="py-3 align-middle text-right text-xs text-fg-muted tabular-nums">
        {result?.latencyMs != null
          ? `${result.latencyMs}ms`
          : result?.detail ?? result?.error ?? (pageLoading ? "—" : "no telemetry")}
      </td>
    </tr>
  );
}

/* ---- Helper: overall status pill ----
 * Maps the real `/api/v1/health` `status: "OK"` value onto the rich pill
 * vocabulary ("healthy" / "degraded" / "down") the page already supported. */

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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0); // forces re-render every second for the "Xs ago" label
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      // /api/onchain-test does not exist in the current build (404s on every
      // poll). Removed from the Promise.all to stop the page from spinning in
      // a permanent "error" state. The On-Chain Verification section below
      // renders a static "unavailable" message instead.
      const healthRes = await fetch("/api/v1/health", { cache: "no-store" });
      const healthData = (await healthRes.json().catch(() => null)) as HealthResponse | null;
      if (!mountedRef.current) return;
      setHealth(healthData);
      setLastUpdated(new Date().toISOString());
    } catch {
      // Network failure — leave previous state in place but mark updated time.
      // The static structure of the page still renders.
      if (!mountedRef.current) return;
      setLastUpdated(new Date().toISOString());
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Defer setState to next microtask to avoid synchronous effect→state loop
    // (React 19 react-hooks/set-state-in-effect rule).
    queueMicrotask(() => {
      setMounted(true);
      void fetchAll();
    });
    const pollId = setInterval(fetchAll, POLL_INTERVAL_MS);
    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [fetchAll]);

  /* ---- Derive the overall status from the health response ----
   * The real /api/v1/health stub returns `status: "OK"`. Map that onto the
   * "healthy" pill; any other value falls through to "down" so a genuinely
   * broken endpoint doesn't masquerade as healthy. */
  const rawStatus = health?.status;
  const serviceStatus: "healthy" | "degraded" | "down" | "loading" = loading
    ? "loading"
    : rawStatus === "healthy" || rawStatus === "OK"
      ? "healthy"
      : rawStatus === "degraded"
        ? "degraded"
        : "down";

  // On-chain verification suite — not wired up in the current build. The
  // /api/onchain-test route returns 404, so instead of polling a missing
  // endpoint every 30s we surface a static "unavailable" state.
  const onchainAvailable = false;

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
                onchainAvailable
                  ? "border-reserve/40 bg-reserve/10 text-reserve"
                  : "border-gold/40 bg-gold/10 text-gold"
              }
              title={
                onchainAvailable
                  ? undefined
                  : "The 15-check on-chain suite is not wired up in the current build."
              }
            >
              <Activity className="mr-1.5 h-3 w-3" />
              On-Chain: {onchainAvailable ? "—" : "Unavailable"}
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
            Probes the upstream dependencies the public app depends on (source:{" "}
            <code className="rounded bg-ink-card px-1 py-0.5 text-[11px] text-foreground">
              /api/v1/health
            </code>
            ). The current build returns a compact availability stub; deep
            per-service telemetry appears here once wired up in the pilot phase.
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
                  pageLoading={loading}
                />
                <ServiceRow
                  name="RPC"
                  description="Monad Testnet JSON-RPC (eth_blockNumber)"
                  result={health?.checks?.rpc}
                  pageLoading={loading}
                />
                <ServiceRow
                  name="Oracle"
                  description="Internal /api/oracle (gold + FX + crypto)"
                  result={health?.checks?.oracle}
                  pageLoading={loading}
                />
                <ServiceRow
                  name="SMTP"
                  description="Outbound email (SMTP_HOST configured)"
                  result={health?.checks?.smtp}
                  pageLoading={loading}
                />
              </tbody>
            </table>
          </div>
          {health?.error && (
            <p className="mt-2 text-xs text-destructive">Error: {health.error}</p>
          )}
        </section>

        {/* On-chain verification table — statically "unavailable" in current build */}
        <section className="mt-10">
          <h2 className="font-display text-lg text-foreground">On-Chain Verification</h2>
          <p className="mb-3 text-xs text-fg-muted">
            Live reads from the deployed MTQ v19.0.3 contract suite on Monad
            Testnet. The 15-check on-chain suite is not wired up in the current
            build — this section surfaces a static &ldquo;unavailable&rdquo;
            state instead of polling a missing endpoint.
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
              <tbody>
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-fg-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-gold" />
                      On-chain verification unavailable — DEMO — data available in pilot phase.
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
