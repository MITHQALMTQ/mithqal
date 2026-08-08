/**
 * On-chain contract reader for the Mithqal Operating System.
 *
 * Reads MTQ token data (balanceOf, totalSupply, name, symbol, decimals) and
 * Governance contract data from the configured chain via eth_call.
 *
 * Defaults to Monad Testnet (chainId 10143). Arc Network Testnet (5042002)
 * is also supported — see src/lib/chains.ts. Callers that want to read from
 * Arc should use `getChainReader("arc")`.
 *
 * This is the read-only layer — it never submits transactions. Write
 * operations (mint/redeem/transfer) are signed client-side via MetaMask
 * and the resulting tx_hash is recorded in the `transactions` table.
 */

import { CHAINS, DEFAULT_CHAIN, type ChainConfig } from "@/lib/chains";

// Backward-compatible exports — legacy callers continue to use these.
// They are pinned to the default chain (Monad Testnet).
export const CONTRACTS = DEFAULT_CHAIN.contracts;
export const NETWORK = {
  name: DEFAULT_CHAIN.name,
  chainId: DEFAULT_CHAIN.chainId,
  rpcUrl: DEFAULT_CHAIN.rpcUrl,
  explorer: DEFAULT_CHAIN.explorer,
} as const;

// ERC-20 function selectors
const ERC20 = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231", // balanceOf(address)
  transfer: "0xa9059cbb", // transfer(address,uint256)
  allowance: "0xdd62ed3e", // allowance(address,address)
} as const;

async function rpcCall(method: string, params: unknown[], rpcUrl: string = DEFAULT_CHAIN.rpcUrl): Promise<unknown> {
  // Retry once on transient RPC errors (rate-limit / network blips).
  // Testnet RPCs occasionally return 429 or transient errors
  // when multiple eth_call requests fire in parallel.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 500)); continue; }
        throw new Error(`RPC HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 500)); continue; }
        throw new Error(`RPC error: ${json.error.message}`);
      }
      return json.result;
    } catch (err) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 500)); continue; }
      throw err;
    }
  }
  throw new Error("RPC call failed after retries");
}

async function ethCall(to: string, data: string, rpcUrl?: string): Promise<string> {
  return (await rpcCall("eth_call", [{ to, data }, "latest"], rpcUrl)) as string;
}

/**
 * Build a reader bound to a specific chain (defaults to Monad). All read
 * functions on the returned object target that chain's RPC + addresses.
 * Useful for cross-chain queries (e.g. /api/status probing both networks).
 */
export function getChainReader(chainKey: "monad" | "arc" = "monad") {
  const chain: ChainConfig = CHAINS[chainKey];
  const c = chain.contracts;
  const rpc = chain.rpcUrl;
  return {
    chain,
    async getContractInfo() {
      const [nameHex, symbolHex, decimalsHex, supplyHex] = await Promise.all([
        ethCall(c.MTQ_TOKEN, ERC20.name, rpc),
        ethCall(c.MTQ_TOKEN, ERC20.symbol, rpc),
        ethCall(c.MTQ_TOKEN, ERC20.decimals, rpc),
        ethCall(c.MTQ_TOKEN, ERC20.totalSupply, rpc),
      ]);
      const decimals = Number(decodeUint(decimalsHex));
      const totalSupply = decodeUint(supplyHex);
      return {
        address: c.MTQ_TOKEN,
        name: decodeString(nameHex),
        symbol: decodeString(symbolHex),
        decimals,
        totalSupply,
        totalSupplyDisplay: Number(totalSupply) / Math.pow(10, decimals),
        network: { name: chain.name, chainId: chain.chainId, rpcUrl: chain.rpcUrl, explorer: chain.explorer },
        explorerLink: `${chain.explorer}/address/${c.MTQ_TOKEN}`,
      };
    },
    async getBalance(address: string) {
      const data = ERC20.balanceOf + addressToHex(address);
      const balanceHex = await ethCall(c.MTQ_TOKEN, data, rpc);
      const balance = decodeUint(balanceHex);
      const decimalsHex = await ethCall(c.MTQ_TOKEN, ERC20.decimals, rpc);
      const decimals = Number(decodeUint(decimalsHex));
      return {
        address,
        balance,
        balanceDisplay: Number(balance) / Math.pow(10, decimals),
        decimals,
      };
    },
    async getBlockNumber(): Promise<number> {
      const result = (await rpcCall("eth_blockNumber", [], rpc)) as string;
      return Number(BigInt(result));
    },
    /**
     * Verify a contract is deployed by fetching its bytecode.
     * Returns true if eth_getCode returns anything other than "0x".
     */
    async contractExists(address: string): Promise<boolean> {
      const code = (await rpcCall("eth_getCode", [address, "latest"], rpc)) as string;
      return !!code && code !== "0x" && code.length > 4;
    },
  };
}

function decodeString(hex: string): string {
  if (!hex || hex === "0x") return "";
  const offset = parseInt(hex.slice(2, 66), 16);
  const length = parseInt(hex.slice(offset * 2 + 2, offset * 2 + 66), 16);
  const dataHex = hex.slice(offset * 2 + 66, offset * 2 + 66 + length * 2);
  return Buffer.from(dataHex, "hex").toString("utf-8");
}

function decodeUint(hex: string): bigint {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

function addressToHex(addr: string): string {
  return addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

/**
 * Read the full contract info: name, symbol, decimals, totalSupply.
 * (Operates on the default chain — Monad Testnet.)
 */
export async function getContractInfo() {
  return getChainReader("monad").getContractInfo();
}

/**
 * Get the MTQ balance of an address (on-chain).
 * (Operates on the default chain — Monad Testnet.)
 */
export async function getBalance(address: string): Promise<{
  address: string;
  balance: bigint;
  balanceDisplay: number;
  decimals: number;
}> {
  return getChainReader("monad").getBalance(address);
}

/**
 * Build the calldata for a transfer transaction (client signs via MetaMask).
 * Returns the calldata that the frontend sends to `eth_sendTransaction`.
 */
export function buildTransferCalldata(toAddress: string, amountWei: bigint): string {
  return ERC20.transfer + addressToHex(toAddress) + amountHex(amountWei);
}

function amountHex(wei: bigint): string {
  return wei.toString(16).padStart(64, "0");
}

/**
 * Get the latest block number (for transaction confirmation).
 * (Operates on the default chain — Monad Testnet.)
 */
export async function getBlockNumber(): Promise<number> {
  return getChainReader("monad").getBlockNumber();
}

/**
 * Get a transaction receipt (to confirm a tx was mined).
 */
export async function getTransactionReceipt(txHash: string): Promise<{
  status: "success" | "failed" | "pending";
  blockNumber: number | null;
  gasUsed: bigint | null;
} | null> {
  try {
    const result = (await rpcCall("eth_getTransactionReceipt", [txHash])) as string;
    if (!result || result === "0x" || result === "null") return null;
    const receipt = typeof result === "string" ? JSON.parse(result) : result;
    return {
      status: receipt.status === "0x1" ? "success" : "failed",
      blockNumber: receipt.blockNumber ? Number(BigInt(receipt.blockNumber)) : null,
      gasUsed: receipt.gasUsed ? BigInt(receipt.gasUsed) : null,
    };
  } catch {
    return null;
  }
}
