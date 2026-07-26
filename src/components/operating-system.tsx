"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Send, Plus,
  Activity, Shield, TrendingUp, Boxes, Hash, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

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
const fmtMtq = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 4 });
const fmtWei = (wei: string, decimals = 18) => Number(wei) / Math.pow(10, decimals);
const fmtTime = (ts: number) => new Date(ts * 1000).toLocaleString();
const shortAddr = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

const MTQ_ADDRESS = "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD";
const MONAD_CHAIN_ID = "0x27f7"; // 10143 in hex
const MONAD_CHAIN_PARAMS = {
  chainId: MONAD_CHAIN_ID,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadscan.com"],
};

/* ---- Main Component ---- */

export function OperatingSystem() {
  const { toast } = useToast();
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

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
  useEffect(() => {
    Promise.all([fetchContract(), fetchTransactions()]).finally(() => setLoading(false));
  }, [fetchContract, fetchTransactions]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContract();
      fetchTransactions();
      if (walletAddress) fetchBalance(walletAddress);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchContract, fetchTransactions, fetchBalance, walletAddress]);

  // ---- MetaMask integration ----

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Install MetaMask browser extension to connect.",
        variant: "destructive",
      });
      return;
    }
    setConnecting(true);
    try {
      // Request accounts
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts[0];
      setWalletAddress(address);

      // Check if on Monad Testnet
      const chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      if (chainId !== MONAD_CHAIN_ID) {
        // Try to switch to Monad Testnet
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // Chain not added — add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [MONAD_CHAIN_PARAMS],
            });
          } else {
            throw switchError;
          }
        }
      }

      toast({
        title: "Wallet connected",
        description: `Connected as ${shortAddr(address)}`,
      });
      await fetchBalance(address);
    } catch (e: any) {
      toast({
        title: "Connection failed",
        description: e.message || "Could not connect to MetaMask",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  // Add MTQ token to MetaMask
  const addToMetaMask = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({ title: "MetaMask not found", variant: "destructive" });
      return;
    }
    try {
      await window.ethereum.request({
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
      });
      toast({ title: "MTQ added to MetaMask", description: "Token visible in your wallet" });
    } catch (e: any) {
      toast({ title: "Failed to add token", description: e.message, variant: "destructive" });
    }
  };

  // Mint (record a mint transaction — the actual on-chain mint requires MINTER_ROLE)
  const handleMint = async (amountUsd: number) => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    try {
      // In production, this would:
      // 1. User signs a deposit transaction (sending USD to the reserve)
      // 2. Operator's MINTER_ROLE wallet mints MTQ to the user
      // 3. txHash is recorded here
      // For now, this is a simulator that records the intent
      const mockTxHash = "0x" + "0".repeat(64); // placeholder
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUsd,
          toAddress: walletAddress,
          txHash: mockTxHash,
        }),
      });
      if (res.ok) {
        toast({ title: "Mint recorded", description: `${amountUsd} USD → MTQ (fee: 0.05%)` });
        await fetchTransactions();
        await fetchBalance(walletAddress);
      }
    } catch (e: any) {
      toast({ title: "Mint failed", description: e.message, variant: "destructive" });
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
              <Button onClick={connectWallet} disabled={connecting} size="sm">
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                Connect MetaMask
              </Button>
            ) : (
              <>
                <Button onClick={addToMetaMask} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add MTQ to MetaMask
                </Button>
                {balance && (
                  <a href={balance.explorerLink} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" /> View on MonadScan
                    </Button>
                  </a>
                )}
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
            value={fmtUsd(goldPrice)}
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
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MintCard onMint={handleMint} disabled={!walletAddress} />
            <RedeemCard disabled={!walletAddress} />
            <TransferCard disabled={!walletAddress} />
          </div>
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

function MintCard({ onMint, disabled }: { onMint: (usd: number) => void; disabled: boolean }) {
  const [amount, setAmount] = useState("");
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="h-5 w-5 text-reserve" />
        <h3 className="font-display text-lg text-foreground">Mint MTQ</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Deposit USD → receive MTQ at current NAV. Fee: 0.05% (cap $5,000).</p>
      <div className="mt-4 space-y-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="USD amount"
          className="w-full rounded-lg border border-line bg-ink-card px-3 py-2 text-sm text-foreground placeholder:text-fg-muted focus:border-gold focus:outline-none"
        />
        <Button
          onClick={() => {
            const usd = Number(amount);
            if (usd > 0) onMint(usd);
          }}
          disabled={disabled || !amount}
          className="w-full"
        >
          {disabled ? "Connect wallet first" : "Mint MTQ"}
        </Button>
      </div>
    </div>
  );
}

function RedeemCard({ disabled }: { disabled: boolean }) {
  const [amount, setAmount] = useState("");
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg text-foreground">Redeem MTQ</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Burn MTQ → receive USD from reserves. Fee: 0.05% (cap $5,000).</p>
      <div className="mt-4 space-y-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="MTQ amount"
          className="w-full rounded-lg border border-line bg-ink-card px-3 py-2 text-sm text-foreground placeholder:text-fg-muted focus:border-gold focus:outline-none"
        />
        <Button disabled={disabled || !amount} variant="outline" className="w-full">
          {disabled ? "Connect wallet first" : "Redeem MTQ"}
        </Button>
      </div>
    </div>
  );
}

function TransferCard({ disabled }: { disabled: boolean }) {
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-fg-muted" />
        <h3 className="font-display text-lg text-foreground">Transfer MTQ</h3>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Send MTQ to another address. Fee: 0.01% (cap $1,000).</p>
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
        <Button disabled={disabled || !toAddr || !amount} variant="outline" className="w-full">
          {disabled ? "Connect wallet first" : "Transfer MTQ"}
        </Button>
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
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- TypeScript global for window.ethereum ---- */

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
