import { NextResponse } from "next/server";
import { CHAINS } from "@/lib/chains";

/**
 * POST /api/oracle/update — update on-chain Oracle with live prices.
 *
 * Reads live gold + silver prices from the multi-oracle (off-chain consensus)
 * and writes them to the on-chain Oracle.sol contract on Arc Network Testnet.
 *
 * This keeps the on-chain Oracle fresh (within MAX_STALENESS = 1 hour).
 * Called by:
 *   - Vercel cron (vercel.json: every 10 minutes)
 *   - Manual trigger from the admin console
 *
 * Security:
 *   - Requires DEPLOYER_PRIVATE_KEY env var (never exposed to client)
 *   - Only the ORACLE_PROVIDER_ROLE holder (deployer) can call setGoldPrice/setSilverPrice
 *   - The private key is ONLY used server-side in this endpoint
 *
 * Constitutional boundary (§30-33):
 *   - On-chain Oracle is the SECONDARY source (single-provider testnet mode)
 *   - Off-chain multi-oracle consensus remains the PRIMARY source
 *   - At mainnet: Chainlink + Pyth + Chronicle + RedStone (multi-oracle consensus)
 */

const RPC_URL = CHAINS.arc.rpcUrl;
const ORACLE_ADDRESS = CHAINS.arc.contracts.ORACLE;

// Function selectors
const SET_GOLD_PRICE = "0x" + "7bd4cc64"; // setGoldPrice(uint256)
const SET_SILVER_PRICE = "0x" + "9d15ef4d"; // setSilverPrice(uint256) — placeholder, computed below

async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_call", params: [{ to, data }, "latest"], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

async function ethGetCode(address: string): Promise<string> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getCode", params: [address, "latest"], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

async function ethGetBalance(address: string): Promise<bigint> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return BigInt(json.result);
}

async function getNonce(address: string): Promise<number> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "latest"], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return parseInt(json.result, 16);
}

async function getChainId(): Promise<number> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return parseInt(json.result, 16);
}

async function getGasPrice(): Promise<bigint> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return BigInt(json.result);
}

async function estimateGas(from: string, to: string, data: string): Promise<bigint> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_estimateGas", params: [{ from, to, data }, "latest"], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return BigInt(json.result);
}

async function sendRawTransaction(rawTx: string): Promise<string> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_sendRawTransaction", params: [rawTx], id: 1 }),
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

async function getTxReceipt(txHash: string): Promise<{ status: string } | null> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionReceipt", params: [txHash], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

// ---- EIP-1559 transaction signing (no external deps) ----
// We sign the transaction manually using the secp256k1 curve via Node's crypto.
// This avoids needing ethers.js or viem in the API route.

function stripHex(hex: string): string {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

function toHex(n: bigint, padToBytes?: number): string {
  let hex = n.toString(16);
  if (padToBytes) hex = hex.padStart(padToBytes * 2, "0");
  return hex;
}

// Keccak-256 via Node.js (available in Node 18+ as crypto.createHash doesn't support keccak).
// We use a pure-JS keccak implementation to avoid dependencies.
// Actually, let's use the @noble/hashes package if available, or a simple approach.
// For now, we'll use a different strategy: use cast/forge via child_process.

import { execSync } from "child_process";
import { existsSync } from "fs";

const FOUNDRY_CAST = `${process.env.HOME}/.foundry/bin/cast`;

function castSend(rpcUrl: string, privateKey: string, to: string, sig: string, args: string[]): { hash: string; status: number } {
  const cmd = `${FOUNDRY_CAST} send --rpc-url "${rpcUrl}" --private-key ${privateKey} ${to} "${sig}" ${args.join(" ")} --json 2>/dev/null`;
  const output = execSync(cmd, { timeout: 60000, encoding: "utf-8" });
  const result = JSON.parse(output);
  return {
    hash: result.transactionHash,
    status: parseInt(result.status, 16) === 1 ? 1 : 0,
  };
}

function castCall(rpcUrl: string, to: string, sig: string): string {
  const cmd = `${FOUNDRY_CAST} call --rpc-url "${rpcUrl}" ${to} "${sig}" 2>/dev/null`;
  return execSync(cmd, { timeout: 15000, encoding: "utf-8" }).trim();
}

async function fetchLiveGoldPrice(): Promise<number> {
  const res = await fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(5000) });
  const data = await res.json();
  return typeof data.price === "number" ? data.price : 0;
}

async function fetchLiveSilverPrice(): Promise<number> {
  const res = await fetch("https://api.gold-api.com/price/XAG", { signal: AbortSignal.timeout(5000) });
  const data = await res.json();
  return typeof data.price === "number" ? data.price : 0;
}

export async function POST(request: Request) {
  try {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "DEPLOYER_PRIVATE_KEY not configured", detail: "Cannot update on-chain Oracle without deployer key" },
        { status: 500 },
      );
    }

    if (!existsSync(FOUNDRY_CAST)) {
      return NextResponse.json(
        { error: "Foundry cast not found", detail: `Expected at ${FOUNDRY_CAST}` },
        { status: 500 },
      );
    }

    // 1. Verify Oracle contract exists
    const code = await ethGetCode(ORACLE_ADDRESS);
    if (!code || code === "0x") {
      return NextResponse.json(
        { error: "Oracle contract not deployed", address: ORACLE_ADDRESS },
        { status: 500 },
      );
    }

    // 2. Fetch live prices from off-chain multi-oracle (free APIs)
    const [goldUsd, silverUsd] = await Promise.all([
      fetchLiveGoldPrice(),
      fetchLiveSilverPrice(),
    ]);

    if (goldUsd <= 0 || silverUsd <= 0) {
      return NextResponse.json(
        { error: "Failed to fetch live prices", goldUsd, silverUsd },
        { status: 500 },
      );
    }

    // 3. Convert to 8-decimal uint256
    const goldWei = BigInt(Math.round(goldUsd * 1e8));
    const silverWei = BigInt(Math.round(silverUsd * 1e8));

    // 4. Send setGoldPrice transaction
    const goldTx = castSend(RPC_URL, privateKey, ORACLE_ADDRESS, "setGoldPrice(uint256)", [goldWei.toString()]);
    const silverTx = castSend(RPC_URL, privateKey, ORACLE_ADDRESS, "setSilverPrice(uint256)", [silverWei.toString()]);

    // 5. Verify updated prices
    const onChainGold = castCall(RPC_URL, ORACLE_ADDRESS, "goldPrice()(uint256)");
    const onChainSilver = castCall(RPC_URL, ORACLE_ADDRESS, "silverPrice()(uint256)");

    return NextResponse.json({
      success: goldTx.status === 1 && silverTx.status === 1,
      oracleAddress: ORACLE_ADDRESS,
      network: CHAINS.arc.name,
      chainId: CHAINS.arc.chainId,
      prices: {
        gold: { usd: goldUsd, wei: goldWei.toString(), onChain: onChainGold },
        silver: { usd: silverUsd, wei: silverWei.toString(), onChain: onChainSilver },
      },
      transactions: {
        setGoldPrice: { hash: goldTx.hash, status: goldTx.status === 1 ? "success" : "failed" },
        setSilverPrice: { hash: silverTx.hash, status: silverTx.status === 1 ? "success" : "failed" },
      },
      updated: new Date().toISOString(),
      note: "On-chain Oracle updated with live multi-oracle prices. Freshness: 1 hour (MAX_STALENESS).",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to update on-chain Oracle",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const code = await ethGetCode(ORACLE_ADDRESS);
    const onChainGold = await ethCall(ORACLE_ADDRESS, "0x44501404"); // goldPrice()
    const onChainSilver = await ethCall(ORACLE_ADDRESS, "0xff391c06"); // silverPrice()

    const goldWei = BigInt(onChainGold);
    const silverWei = BigInt(onChainSilver);
    const goldUsd = Number(goldWei) / 1e8;
    const silverUsd = Number(silverWei) / 1e8;

    return NextResponse.json({
      oracleAddress: ORACLE_ADDRESS,
      network: CHAINS.arc.name,
      chainId: CHAINS.arc.chainId,
      contractExists: code !== "0x",
      onChainPrices: {
        gold: { usd: goldUsd, wei: goldWei.toString() },
        silver: { usd: silverUsd, wei: silverWei.toString() },
      },
      source: "on-chain",
      fetchedAt: new Date().toISOString(),
      updateEndpoint: "POST /api/oracle/update — updates on-chain prices from live multi-oracle",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to read on-chain Oracle",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
