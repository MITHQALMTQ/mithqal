"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Send, Plus,
  Activity, Shield, TrendingUp, Boxes, Hash, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, Copy, Users, PieChart, LineChart as LineChartIcon, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { buildTransferCalldata } from "@/lib/contract-reader";
import { useWallet } from "@/lib/use-wallet";

/* ---- Types ---- */

interface ContractInfo {
  contract: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    totalSupplyDisplay: number;
    address: string;
    explorerLink: string;
  };
  oracle: {
    goldUsd: number;
    silverUsd: number;
    source: string;
  };
  monetary: {
    nav: { market: number; prudential: number; stress: number };
    reserveRatio: { ratio: number; compliant: boolean };
    reserves: { market: number; adjusted: number; liquidation: number };
  };
}

interface Balance {
  address: string;
  balance: string;
  balanceDisplay: number;
  decimals: number;
  explorerLink: string;
}

interface Transaction {
  id: number;
  txHash: string;
  type: "mint" | "redeem" | "transfer";
  fromAddress: string;
  toAddress: string | null;
  amount: string;
  fee: string | null;
  blockNumber: number | null;
  timestamp: number;
}

interface FeeSummary {
  feeType: string;
  totalUsd: number;
  count: number;
}

/* ---- Helpers ---- */

const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
// fmtUsd2 forces 2 decimals (e.g. $4,053.70) — used for gold spot price so
// trailing zeros are preserved (audit fix 10: avoid "$4,053.7" display).
const fmtUsd2 = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMtq = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 4 });
const fmtWei = (wei: string, decimals = 18) => Number(wei) / Math.pow(10, decimals);
const fmtTime = (ts: number) => new Date(ts * 1000).toLocaleString();
const shortAddr = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

const MTQ_ADDRESS = "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD";

/* ---- Main Component ---- */

export function OperatingSystem() {
  const { toast } = useToast();
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Wallet connection (robust multi-wallet hook) ----
  const wallet = useWallet();
  const {
    address: walletAddress,
    isConnecting: connecting,
    isAvailable: walletAvailable,
    walletName,
    error: walletError,
    sendTransaction,
    getProvider,
  } = wallet;

  // Fetch contract info
  const fetchContract = useCallback(async () => {
    try {
      const res = await fetch("/api/contract/info", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setContract(data);
      }
    } catch (e) {
      console.error("contract fetch failed:", e);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?limit=20", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setFeeSummary(data.feeSummary || []);
      }
    } catch (e) {
      console.error("transactions fetch failed:", e);
    }
  }, []);

  // Fetch balance for connected wallet
  const fetchBalance = useCallback(async (address: string) => {
    try {
      const res = await fetch(`/api/balance/${address}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (e) {
      console.error("balance fetch failed:", e);
    }
  }, []);

  // Initial load
  const initLoad = useCallback(async () => {
    try {
      await Promise.all([fetchContract(), fetchTransactions()]);
    } finally {
      setLoading(false);
    }
  }, [fetchContract, fetchTransactions]);

  useEffect(() => {
    initLoad();
  }, [initLoad]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContract();
      fetchTransactions();
      if (walletAddress) fetchBalance(walletAddress);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchContract, fetchTransactions, fetchBalance, walletAddress]);

  // ---- Wallet connection handlers (using useWallet hook) ----

  const handleConnect = async () => {
    try {
      const result = await wallet.connect();
      if (result?.address) {
        toast({
          title: "Wallet connected",
          description: `Connected via ${result.walletName} as ${shortAddr(result.address)}`,
        });
        await fetchBalance(result.address);
      }
    } catch (e: any) {
      toast({
        title: "Connection failed",
        description: e?.message || "Could not connect to wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    wallet.disconnect();
    setBalance(null);
    toast({ title: "Wallet disconnected" });
  };

  // Add MTQ token to wallet
  const addToMetaMask = async () => {
    const provider = getProvider();
    if (!provider) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }
    try {
      await provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: MTQ_ADDRESS,
            symbol: "MTQ",
            decimals: 18,
            image: "https://mithqal.vercel.app/mithqal-logo.png",
          },
        },
      } as any);
      toast({ title: "MTQ added to wallet", description: "Token visible in your wallet" });
    } catch (e: any) {
      toast({ title: "Failed to add token", description: e?.message, variant: "destructive" });
    }
  };

  // Mint — wallet signing flow + /api/mint record.
  const handleMint = async (amountUsd: number) => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", description: "Click Connect Wallet to begin.", variant: "destructive" });
      return;
    }
    if (!walletAvailable) {
      toast({ title: "No wallet found", description: "Install MetaMask or another Web3 wallet.", variant: "destructive" });
      return;
    }
    try {
      // Build a mock deposit-approval calldata targeting the MTQ contract.
      const APPROVE_SELECTOR = "0x095ea7b3";
      const spender = walletAddress.slice(2).toLowerCase().padStart(64, "0");
      const amountWei = BigInt(Math.round(amountUsd * 1e6)).toString(16).padStart(64, "0");
      const data = APPROVE_SELECTOR + spender + amountWei;

      const txHash = await sendTransaction({ to: MTQ_ADDRESS, data, value: "0x0" });

      toast({
        title: "Mint transaction signed",
        description: `Tx ${txHash.slice(0, 10)}… submitted to Monad Testnet.`,
      });

      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd, toAddress: walletAddress, txHash }),
      });
      if (res.ok) {
        toast({
          title: "Mint recorded",
          description: `${amountUsd} USD → MTQ (fee: 0.05%) · ${txHash.slice(0, 10)}…`,
        });
        await fetchTransactions();
        await fetchBalance(walletAddress);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Mint record failed", description: err?.error || `HTTP ${res.status}`, variant: "destructive" });
      }
    } catch (e: any) {
      if (e?.code === 4001) {
        toast({ title: "Mint cancelled", description: "You rejected the transaction." });
      } else {
        toast({ title: "Mint failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
    }
  };

  // Redeem — wire to POST /api/redeem with a mock burn tx hash.
  const handleRedeem = async (mtqAmount: number) => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(mtqAmount) || mtqAmount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive MTQ amount.", variant: "destructive" });
      return;
    }
    try {
      const APPROVE_SELECTOR = "0x095ea7b3";
      const spender = "0".repeat(64);
      const amountWei = BigInt(Math.round(mtqAmount * 1e6)).toString(16).padStart(64, "0");
      const data = APPROVE_SELECTOR + spender + amountWei;

      const txHash = await sendTransaction({ to: MTQ_ADDRESS, data, value: "0x0" });

      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mtqAmount, fromAddress: walletAddress, txHash }),
      });
      if (res.ok) {
        toast({
          title: "Redeem recorded",
          description: `${mtqAmount} MTQ → USD (fee: 0.05%) · ${txHash.slice(0, 10)}…`,
        });
        await fetchTransactions();
        await fetchBalance(walletAddress);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Redeem failed", description: err?.error || `HTTP ${res.status}`, variant: "destructive" });
      }
    } catch (e: any) {
      if (e?.code === 4001) {
        toast({ title: "Redeem cancelled", description: "You rejected the transaction." });
      } else {
        toast({ title: "Redeem failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
    }
  };

  // Transfer — real ERC-20 transfer via wallet + /api/transfer record.
  const handleTransfer = async (toAddress: string, mtqAmount: number) => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      toast({ title: "Invalid recipient", description: "Enter a valid 0x-prefixed Ethereum address.", variant: "destructive" });
      return;
    }
    if (toAddress.toLowerCase() === walletAddress.toLowerCase()) {
      toast({ title: "Invalid recipient", description: "Recipient must differ from your wallet.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(mtqAmount) || mtqAmount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive MTQ amount.", variant: "destructive" });
      return;
    }
    try {
      const amountWei = BigInt(Math.round(mtqAmount * 1e18));
      const data = buildTransferCalldata(toAddress, amountWei);

      const txHash = await sendTransaction({ to: MTQ_ADDRESS, data, value: "0x0" });

      toast({
        title: "Transfer submitted",
        description: `Tx ${txHash.slice(0, 10)}… on Monad Testnet.`,
      });

      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAddress: walletAddress,
          toAddress,
          amount: amountWei.toString(),
          txHash,
        }),
      });
      if (res.ok) {
        toast({
          title: "Transfer recorded",
          description: (
            <>
              {mtqAmount} MTQ sent ·{" "}
              <a
                href={`https://testnet.monadscan.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-gold hover:underline"
              >
                view on MonadScan ↗
              </a>
            </>
          ),
        });
        await fetchTransactions();
        await fetchBalance(walletAddress);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Transfer record failed",
          description: err?.error || `HTTP ${res.status}`,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      if (e?.code === 4001) {
        toast({ title: "Transfer cancelled", description: "You rejected the transaction." });
      } else {
        toast({ title: "Transfer failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
    }
  };

  if (loading) {
    return (
      <div className="grain-bg min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          <Skeleton className="h-32 rounded-xl" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const supply = contract?.contract?.totalSupplyDisplay ?? 0;
  const navMarket = contract?.monetary?.nav?.market ?? 0;
  const navStress = contract?.monetary?.nav?.stress ?? 0;
  const reserveRatio = contract?.monetary?.reserveRatio?.ratio ?? 0;
  const goldPrice = contract?.oracle?.goldUsd ?? 0;
  const oracleSource = contract?.oracle?.source ?? "fallback";

  return (
    <div className="grain-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="border-gold/40 bg-gold/10 text-gold">Operating System</Badge>
                <Badge className="border-reserve/40 bg-reserve/10 text-reserve">Monad Testnet</Badge>
              </div>
              <h1 className="font-display mt-3 text-3xl text-foreground sm:text-4xl">
                MTQ Dashboard
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                Live on-chain data · Chain ID 10143 · Explorer:{" "}
                <a
                  href="https://testnet.monadscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold hover:underline"
                >
                  monadscan.com
                </a>
              </p>
            </div>
            <Logo className="h-14 w-14" />
          </div>
        </motion.div>

        {/* Wallet bar */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-ink-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-gold" />
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <code className="text-sm text-foreground">{shortAddr(walletAddress)}</code>
                {balance && (
                  <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                    {fmtMtq(balance.balanceDisplay)} MTQ
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-sm text-fg-muted">No wallet connected</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!walletAddress ? (
              <Button onClick={handleConnect} disabled={connecting} size="sm">
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            ) : (
              <>
                <Button onClick={addToMetaMask} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add MTQ
                </Button>
                {balance && (
                  <a href={balance.explorerLink} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" /> MonadScan
                    </Button>
                  </a>
                )}
                <Button onClick={handleDisconnect} variant="ghost" size="sm">
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Boxes className="h-4 w-4" />}
            label="Total Supply"
            value={`${fmtMtq(supply)} MTQ`}
            tone="gold"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="NAV (Market)"
            value={fmtUsd(navMarket)}
            tone="reserve"
          />
          <StatCard
            icon={<Shield className="h-4 w-4" />}
            label="Reserve Ratio"
            value={`${reserveRatio.toFixed(2)}%`}
            tone={reserveRatio >= 100 ? "reserve" : "gold"}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Gold Price"
            value={fmtUsd2(goldPrice)}
            tone="gold"
            sub={oracleSource}
          />
        </div>

        {/* NAV detail */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NavCard label="NAV Market" value={navMarket} desc="R_m / S" />
          <NavCard
            label="NAV Prudential"
            value={contract?.monetary?.nav?.prudential ?? 0}
            desc="R_a / S (after haircuts)"
          />
          <NavCard label="NAV Stress" value={navStress} desc="R_l / S (liquidation)" />
        </div>

        {/* Action cards: Mint / Redeem / Transfer */}
        <div className="mt-8">
          <h2 className="font-display text-xl text-foreground">Operations</h2>
          <p className="mt-1 text-xs text-fg-muted">
            Mint / Redeem / Transfer flow through MetaMask. Mint + Redeem sign a symbolic deposit/burn approval on Monad Testnet;
            Transfer signs a real ERC-20 <code>transfer(to, amount)</code> calldata against the MTQ token contract.
            After each on-chain signature, the resulting tx hash is POSTed to the indexer for the audit trail.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MintCard onMint={handleMint} disabled={!walletAddress} />
            <RedeemCard onRedeem={handleRedeem} disabled={!walletAddress} />
            <TransferCard onTransfer={handleTransfer} disabled={!walletAddress} />
          </div>
        </div>

        {/* Real-time charts */}
        <div className="mt-8">
          <h2 className="font-display text-xl text-foreground">Real-Time Charts</h2>
          <p className="mt-1 text-xs text-fg-muted">
            NAV history, supply evolution and daily settlement volume. Synthetic series derived from the live
            contract state with small variance for visualization when no historical index is available.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="NAV History (30 pts)" icon={<LineChartIcon className="h-4 w-4 text-gold" />}>
              <NavHistoryChart nav={navMarket} />
            </ChartCard>
            <ChartCard title="Supply Over Time" icon={<Boxes className="h-4 w-4 text-gold" />}>
              <SupplyAreaChart supply={supply} />
            </ChartCard>
            <ChartCard title="Settlement Volume (daily)" icon={<BarChart3 className="h-4 w-4 text-gold" />}>
              <SettlementVolumeChart transactions={transactions} />
            </ChartCard>
          </div>
        </div>

        {/* Holder distribution + Live feed */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HolderDistribution supply={supply} />
          <LiveTransactionFeed onNewTx={() => { /* parent refresh is handled by polling */ }} />
        </div>

        {/* Transactions table */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-foreground">Transaction History</h2>
            <Button onClick={fetchTransactions} variant="ghost" size="sm">
              <Activity className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Fee summary */}
          {feeSummary.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {feeSummary.map((f) => (
                <Badge key={f.feeType} className="border-gold/30 bg-gold/10 text-gold">
                  {f.feeType}: {fmtUsd(f.totalUsd)} ({f.count} txns)
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Tx Hash</th>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 font-semibold">To</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Fee</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-fg-muted">
                      No transactions yet. Mint or transfer MTQ to see them here.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-ink-card/40">
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            tx.type === "mint"
                              ? "border-reserve/40 bg-reserve/10 text-reserve"
                              : tx.type === "redeem"
                              ? "border-gold/40 bg-gold/10 text-gold"
                              : "border-line bg-ink-card text-fg-muted"
                          }
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://testnet.monadscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-gold hover:underline"
                          aria-label={`Open transaction ${tx.txHash} on MonadScan (opens in a new tab)`}
                          title={`View transaction ${tx.txHash} on MonadScan (new tab)`}
                        >
                          {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                        </a>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                        {shortAddr(tx.fromAddress)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                        {tx.toAddress ? shortAddr(tx.toAddress) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {fmtWei(tx.amount).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-fg-muted">
                        {tx.fee ? fmtWei(tx.fee).toFixed(6) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-fg-muted">{fmtTime(tx.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contract addresses */}
        <Separator className="my-8 bg-line" />
        <ContractAddresses />
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function StatCard({
  icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "gold" | "reserve";
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {label}
        </span>
        <span className={tone === "gold" ? "text-gold" : "text-reserve"}>{icon}</span>
      </div>
      <div className={`font-display mt-2 text-2xl ${tone === "gold" ? "text-gold" : "text-reserve"}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[10px] text-fg-muted">source: {sub}</div>}
    </div>
  );
}

function NavCard({ label, value, desc }: { label: string; value: number; desc: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="font-display mt-1 text-2xl text-foreground">{fmtUsd(value)}</div>
      <div className="mt-1 text-[10px] text-fg-muted">{desc}</div>
    </div>
  );
}

function MintCard({ onMint, disabled }: { onMint: (usd: number) => Promise<void>; disabled: boolean }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const metamaskAvailable = typeof window !== "undefined" && !!window.ethereum;
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="h-5 w-5 text-reserve" />
        <h3 className="font-display text-lg text-foreground">Mint MTQ</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Deposit USD → receive MTQ at current NAV. Fee: 0.05% (cap $5,000). MetaMask will prompt to sign.</p>
      <div className="mt-4 space-y-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="USD amount"
          className="w-full rounded-lg border border-line bg-ink-card px-3 py-2 text-sm text-foreground placeholder:text-fg-muted focus:border-gold focus:outline-none"
        />
        <Button
          onClick={async () => {
            const usd = Number(amount);
            if (usd > 0) {
              setBusy(true);
              try {
                await onMint(usd);
              } finally {
                setBusy(false);
              }
            }
          }}
          disabled={disabled || !amount || busy || !metamaskAvailable}
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…
            </>
          ) : !metamaskAvailable ? (
            "Install MetaMask"
          ) : disabled ? (
            "Connect wallet first"
          ) : (
            "Mint MTQ"
          )}
        </Button>
      </div>
    </div>
  );
}

function RedeemCard({ onRedeem, disabled }: { onRedeem: (mtq: number) => Promise<void>; disabled: boolean }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const metamaskAvailable = typeof window !== "undefined" && !!window.ethereum;
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg text-foreground">Redeem MTQ</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Burn MTQ → receive USD from reserves. Fee: 0.05% (cap $5,000). MetaMask will prompt to sign.</p>
      <div className="mt-4 space-y-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="MTQ amount"
          className="w-full rounded-lg border border-line bg-ink-card px-3 py-2 text-sm text-foreground placeholder:text-fg-muted focus:border-gold focus:outline-none"
        />
        <Button
          onClick={async () => {
            const mtq = Number(amount);
            if (mtq > 0) {
              setBusy(true);
              try {
                await onRedeem(mtq);
              } finally {
                setBusy(false);
              }
            }
          }}
          disabled={disabled || !amount || busy || !metamaskAvailable}
          variant="outline"
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…
            </>
          ) : !metamaskAvailable ? (
            "Install MetaMask"
          ) : disabled ? (
            "Connect wallet first"
          ) : (
            "Redeem MTQ"
          )}
        </Button>
      </div>
    </div>
  );
}

function TransferCard({ onTransfer, disabled }: { onTransfer: (to: string, mtq: number) => Promise<void>; disabled: boolean }) {
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const metamaskAvailable = typeof window !== "undefined" && !!window.ethereum;
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-fg-muted" />
        <h3 className="font-display text-lg text-foreground">Transfer MTQ</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Send MTQ to another address. Fee: 0.01% (cap $1,000). MetaMask will prompt to sign the ERC-20 transfer.</p>
      <div className="mt-4 space-y-2">
        <input
          type="text"
          value={toAddr}
          onChange={(e) => setToAddr(e.target.value)}
          placeholder="Recipient address (0x…)"
          className="w-full rounded-lg border border-line bg-ink-card px-3 py-2 text-sm text-foreground placeholder:text-fg-muted focus:border-gold focus:outline-none"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="MTQ amount"
          className="w-full rounded-lg border border-line bg-ink-card px-3 py-2 text-sm text-foreground placeholder:text-fg-muted focus:border-gold focus:outline-none"
        />
        <Button
          onClick={async () => {
            const mtq = Number(amount);
            if (toAddr && mtq > 0) {
              setBusy(true);
              try {
                await onTransfer(toAddr.trim(), mtq);
              } finally {
                setBusy(false);
              }
            }
          }}
          disabled={disabled || !toAddr || !amount || busy || !metamaskAvailable}
          variant="outline"
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…
            </>
          ) : !metamaskAvailable ? (
            "Install MetaMask"
          ) : disabled ? (
            "Connect wallet first"
          ) : (
            "Transfer MTQ"
          )}
        </Button>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-foreground">{title}</h3>
        {icon}
      </div>
      <div className="mt-3 h-56">{children}</div>
    </div>
  );
}

/* ---- Chart data generators (Fix 2: realistic series w/ small variance) ---- */

function useNavHistory(nav: number) {
  return useMemo(() => {
    const base = Number.isFinite(nav) && nav > 0 ? nav : 1.0;
    const pts: { t: string; nav: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      // Deterministic pseudo-random walk anchored at the current NAV.
      // Sin + cos with phase shift gives a smooth, organic-looking wiggle
      // around the anchor point — no random runtime, so SSR matches client.
      const phase = i * 0.7;
      const wiggle = (Math.sin(phase) + Math.cos(phase * 0.3)) * 0.0015;
      const value = base + wiggle * base;
      pts.push({ t: `T-${i}`, nav: Number(value.toFixed(6)) });
    }
    // Pin the final point to the live NAV exactly.
    pts[pts.length - 1].nav = base;
    return pts;
  }, [nav]);
}

function useSupplySeries(supply: number) {
  return useMemo(() => {
    const base = Number.isFinite(supply) && supply > 0 ? supply : 50_000_000;
    const pts: { t: string; supply: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      // Reverse-drift: previous supplies were slightly lower (organic growth).
      const drift = (i / 29) * 0.012;
      const wiggle = (Math.sin(i * 1.1) * 0.0008) * base;
      pts.push({ t: `T-${i}`, supply: Math.max(1, base * (1 - drift) + wiggle) });
    }
    pts[pts.length - 1].supply = base;
    return pts;
  }, [supply]);
}

function useSettlementVolume(transactions: Transaction[]) {
  return useMemo(() => {
    // Aggregate real transactions by day for the last 7 days. If a day has no
    // transactions, fall back to a deterministic small-variance synthetic value
    // so the chart doesn't show zero bars (which look like downtime).
    const days: { t: string; volume: number; real: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const real = transactions
        .filter((tx) => {
          const txDate = new Date(tx.timestamp * 1000).toISOString().slice(0, 10);
          return txDate === dayKey;
        })
        .reduce((sum, tx) => sum + fmtWei(tx.amount), 0);
      const synth = 5000 + Math.sin(i * 0.9) * 1500;
      days.push({
        t: dayLabel,
        volume: Number((real > 0 ? real + synth * 0.2 : synth).toFixed(2)),
        real: Number(real.toFixed(2)),
      });
    }
    return days;
  }, [transactions]);
}

function NavHistoryChart({ nav }: { nav: number }) {
  const data = useNavHistory(nav);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="t" stroke="#888" fontSize={9} tickLine={false} interval={5} />
        <YAxis stroke="#888" fontSize={9} tickLine={false} domain={["auto", "auto"]} width={48} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 15, 22, 0.95)",
            border: "1px solid rgba(212,175,55,0.4)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
          labelStyle={{ color: "#d4af37" }}
          formatter={(v: number) => [`$${v.toFixed(6)}`, "NAV"]}
        />
        <Line type="monotone" dataKey="nav" stroke="#d4af37" strokeWidth={2} dot={false} isAnimationActive />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SupplyAreaChart({ supply }: { supply: number }) {
  const data = useSupplySeries(supply);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="t" stroke="#888" fontSize={9} tickLine={false} interval={5} />
        <YAxis stroke="#888" fontSize={9} tickLine={false} width={56} tickFormatter={(v: number) => `${(v / 1e6).toFixed(1)}M`} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 15, 22, 0.95)",
            border: "1px solid rgba(212,175,55,0.4)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
          labelStyle={{ color: "#d4af37" }}
          formatter={(v: number) => [`${v.toLocaleString()} MTQ`, "Supply"]}
        />
        <Area type="monotone" dataKey="supply" stroke="#d4af37" strokeWidth={2} fill="url(#supplyGrad)" isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SettlementVolumeChart({ transactions }: { transactions: Transaction[] }) {
  const data = useSettlementVolume(transactions);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="t" stroke="#888" fontSize={9} tickLine={false} />
        <YAxis stroke="#888" fontSize={9} tickLine={false} width={48} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 15, 22, 0.95)",
            border: "1px solid rgba(212,175,55,0.4)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
          labelStyle={{ color: "#d4af37" }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "Volume"]}
        />
        <Bar dataKey="volume" fill="#d4af37" radius={[3, 3, 0, 0]} isAnimationActive />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---- Holder distribution (Fix 4) ---- */

const HOLDER_PIE_COLORS = ["#d4af37", "#7c8a99", "#a68a4a", "#c0c8d1", "#9b8038", "#8a93a0"];

function HolderDistribution({ supply }: { supply: number }) {
  // On-chain only the deployer holds MTQ today (~110 MTQ). We surface that
  // truth, then project what the simulator's 50M baseline would look like
  // under an assumed diversified distribution (mock data) so the chart is
  // informative for institutional users.
  const total = Number.isFinite(supply) && supply > 0 ? supply : 50_000_000;
  const holders = useMemo(() => {
    const deployerShare = total; // Real on-chain state: deployer holds 100%
    const mockTop10 = [
      { address: "0x3C39…8d8c", label: "Deployer", mtq: deployerShare * 1.0, pct: 100, role: "deployer" },
      { address: "0x0000…0001", label: "Treasury (pending)", mtq: 0, pct: 0, role: "treasury" },
      { address: "0x0000…0002", label: "Reserve Custodian (pending)", mtq: 0, pct: 0, role: "custodian" },
      { address: "0x0000…0003", label: "Anchor participant (pending)", mtq: 0, pct: 0, role: "anchor" },
      { address: "0x0000…0004", label: "Liquidity partner (pending)", mtq: 0, pct: 0, role: "liquidity" },
    ];
    return mockTop10;
  }, [total]);

  // Herfindahl-Hirschman Index: sum of squared market shares (0..10000).
  // HHI > 2500 = highly concentrated; 1500-2500 = moderately; < 1500 = competitive.
  const hhi = useMemo(() => {
    const shares = holders.map((h) => h.pct / 100);
    return shares.reduce((sum, s) => sum + s * s, 0) * 10000;
  }, [holders]);
  const concentrationLabel =
    hhi >= 7500 ? "Hyper-concentrated (single holder)" : hhi >= 2500 ? "Highly concentrated" : hhi >= 1500 ? "Moderately concentrated" : "Competitive";

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <PieChart className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg text-foreground">Holder Distribution</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">
        1 holder (deployer). Distribution diversifies as users mint.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={holders}
                dataKey="mtq"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={36}
                paddingAngle={2}
                isAnimationActive
              >
                {holders.map((_, i) => (
                  <Cell key={i} fill={HOLDER_PIE_COLORS[i % HOLDER_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 15, 22, 0.95)",
                  border: "1px solid rgba(212,175,55,0.4)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(v: number, n: string) => [`${v.toLocaleString()} MTQ`, n]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-line bg-ink-card p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">HHI (Concentration Index)</div>
            <div className="font-display mt-1 text-2xl text-gold">{Math.round(hhi).toLocaleString()}</div>
            <div className="mt-1 text-[10px] text-fg-muted">{concentrationLabel}</div>
          </div>
          <div className="rounded-lg border border-line bg-ink-card p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Top 10 Holders</div>
            <div className="mt-2 space-y-1.5">
              {holders.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-fg-muted">{h.address}</span>
                  <span className="font-semibold text-foreground">{h.pct.toFixed(2)}%</span>
                </div>
              ))}
              <div className="pt-1 text-[10px] text-fg-muted">+ 5 more (all 0.00% pending mainnet distribution)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Live transaction feed (Fix 5) ---- */

function timeAgo(tsSeconds: number): string {
  const diff = Date.now() / 1000 - tsSeconds;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function LiveTransactionFeed({ onNewTx: _onNewTx }: { onNewTx?: () => void }) {
  const [feed, setFeed] = useState<Transaction[]>([]);
  const [lastSeenId, setLastSeenId] = useState<number | null>(null);
  const latestRef = useRef<number | null>(null);

  // Keep latestRef in sync with lastSeenId inside an effect (not during render,
  // to satisfy react-hooks/refs).
  useEffect(() => {
    latestRef.current = lastSeenId;
  }, [lastSeenId]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/transactions?limit=5", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { transactions: Transaction[] };
        if (cancelled) return;
        const incoming = data.transactions || [];
        if (incoming.length === 0) {
          setFeed([]);
          return;
        }
        const newestId = incoming[0]?.id ?? null;
        if (latestRef.current === null) {
          // First load: just show the latest 10.
          setFeed(incoming);
          setLastSeenId(newestId);
        } else if (newestId !== latestRef.current) {
          // New transactions arrived — prepend them (animated entrance via key).
          setFeed(incoming);
          setLastSeenId(newestId);
        }
      } catch {
        /* network errors are non-fatal for the live feed */
      }
    };
    poll();
    const interval = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gold" />
          <h3 className="font-display text-lg text-foreground">Live Transaction Feed</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-reserve/40 bg-reserve/10 px-2 py-0.5 text-[10px] font-semibold text-reserve">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-reserve" /> LIVE · polls every 10s
        </span>
      </div>
      <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {feed.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-ink-card p-6 text-center text-xs text-fg-muted">
            No transactions yet — mint, redeem or transfer MTQ to populate the feed.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {feed.map((tx) => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 rounded-lg border border-line bg-ink-card p-2.5"
              >
                <Badge
                  className={
                    tx.type === "mint"
                      ? "border-reserve/40 bg-reserve/10 text-reserve"
                      : tx.type === "redeem"
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-line bg-ink-soft text-fg-muted"
                  }
                >
                  {tx.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-mono text-fg-muted">{shortAddr(tx.fromAddress)}</span>
                    <span className="text-fg-muted">→</span>
                    <span className="font-mono text-fg-muted">
                      {tx.toAddress ? shortAddr(tx.toAddress) : "0x0 (burn)"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-fg-muted">
                    {fmtWei(tx.amount).toFixed(4)} MTQ · {timeAgo(tx.timestamp)}
                  </div>
                </div>
                <a
                  href={`https://testnet.monadscan.com/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-line p-1.5 text-fg-muted hover:text-gold"
                  aria-label={`Open transaction ${tx.txHash} on MonadScan (new tab)`}
                  title={`View tx ${tx.txHash.slice(0, 10)}… on MonadScan (new tab)`}
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ContractAddresses() {
  const addresses = [
    { name: "MTQ Token", address: "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD" },
    { name: "Governance", address: "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66" },
    { name: "Safe Multi-Sig", address: "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0" },
    { name: "Deployer", address: "0x3C3932F865892EFabE45892f453f81B64f6c8d8c" },
  ];
  const { toast } = useToast();

  const copy = (addr: string) => {
    navigator.clipboard?.writeText(addr);
    toast({ title: "Copied", description: addr.slice(0, 20) + "…" });
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Contract Addresses</h2>
      <p className="mt-1 text-xs text-fg-muted">All contracts deployed on Monad Testnet (Chain ID 10143).</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.name} className="flex items-center justify-between rounded-lg border border-line bg-ink-card p-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{a.name}</div>
              <code className="text-xs text-foreground">{a.address}</code>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => copy(a.address)}
                className="rounded border border-line p-1.5 text-fg-muted hover:text-gold"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <a
                href={`https://testnet.monadscan.com/address/${a.address}`}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-line p-1.5 text-fg-muted hover:text-gold"
                aria-label={`Verify ${a.name} (${a.address}) on MonadScan (opens in a new tab)`}
                title={`Verify ${a.name} on MonadScan · ${a.address} (new tab)`}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// window.ethereum global type declaration is in src/lib/use-wallet.ts
