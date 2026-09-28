import { NextResponse } from "next/server";
import { CHAINS } from "@/lib/chains";
import { Wallet, Interface } from "ethers";

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
 * Signing path (v25.6 / Task E2-A):
 *   - Pure-JS end-to-end — no Foundry `cast` binary required.
 *   - JSON-RPC plumbing (nonce, chainId, gasPrice, estimateGas,
 *     sendRawTransaction, receipt polling) uses the in-file wrappers below.
 *   - The ONLY step that needs an external library is the secp256k1 ECDSA
 *     signature itself, which is delegated to ethers v6 (`Wallet.signTransaction`).
 *   - This closes the v25.5 deployment-provenance caveat #1 (Foundry `cast`
 *     not on Vercel serverless PATH → /api/oracle/update returned 500 even
 *     with CRON_SECRET + DEPLOYER_PRIVATE_KEY correctly provisioned).
 *
 * Constitutional boundary (§30-33):
 *   - On-chain Oracle is the SECONDARY source (single-provider testnet mode)
 *   - Off-chain multi-oracle consensus remains the PRIMARY source
 *   - At mainnet: Chainlink + Pyth + Chronicle + RedStone (multi-oracle consensus)
 */

const RPC_URL = CHAINS.arc.rpcUrl;
const ORACLE_ADDRESS = CHAINS.arc.contracts.ORACLE;

// READ selectors — public-variable auto-getters. Verified against
// `src/lib/oracle-client.ts` and keccak256("goldPrice()")/("silverPrice()")
// via ethers. Shared with the GET handler below so the read path is
// consistent end-to-end.
const GOLD_PRICE_SELECTOR = "0x44501404"; // goldPrice()
const SILVER_PRICE_SELECTOR = "0xff391c06"; // silverPrice()

// WRITE selectors — computed dynamically by ethers v6 so we never ship a
// stale hardcoded 4-byte selector. Both setters are access-controlled by
// `ORACLE_PROVIDER_ROLE` in `foundry/src/Oracle.sol`.
const ORACLE_ABI = new Interface([
  "function setGoldPrice(uint256 price)",
  "function setSilverPrice(uint256 price)",
]);

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

// ---- EIP-1559 / legacy transaction signing ----
//
// v25.6 refactor (Task E2-A): the previous implementation shelled out to
// Foundry's `cast send` binary via `spawnSync('cast', [...])`. While that
// was hardened in Task 4-A (no shell injection — args passed as argv, not
// through `/bin/sh -c`), it still REQUIRED the `cast` binary to be present
// at `${process.env.HOME}/.foundry/bin/cast`. Vercel's serverless Node
// image does not include Foundry, so `/api/oracle/update` returned HTTP 500
// in production even when CRON_SECRET + DEPLOYER_PRIVATE_KEY were correctly
// provisioned (v25.5 deployment-provenance caveat #1).
//
// This implementation has zero external-binary dependencies:
//   - JSON-RPC plumbing (nonce/chainId/gasPrice/estimateGas/sendRawTx/
//     receipt polling) uses the in-file `fetch()` wrappers above.
//   - The secp256k1 ECDSA signature over the keccak256 tx hash is delegated
//     to ethers v6 (`Wallet.signTransaction`) — ethers is already a project
//     dependency (`package.json` -> `"ethers": "6"`).
//
// The `stripHex` and `toHex` helpers below are retained as utilities —
// they're useful for any future call site that needs to manually pack a
// hex value or zero-pad a bigint (e.g., constructing calldata inline).

function stripHex(hex: string): string {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

function toHex(n: bigint, padToBytes?: number): string {
  let hex = n.toString(16);
  if (padToBytes) hex = hex.padStart(padToBytes * 2, "0");
  return hex;
}

/**
 * Poll `eth_getTransactionReceipt` until the tx is mined (or timeout).
 *
 * The Arc Network Testnet typically mines blocks every ~2-3s; a 60s
 * budget gives ~30 polls, sufficient even under mild congestion.
 */
async function waitForReceipt(txHash: string, timeoutMs = 60000): Promise<{ status: string } | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const receipt = await getTxReceipt(txHash);
    if (receipt) return receipt;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

/**
 * Sign + submit an EVM transaction to the Arc Network Testnet Oracle.
 *
 * Pure-JS end-to-end — no Foundry `cast` binary required (Task E2-A).
 *
 * Flow:
 *   1. Derive the signer address from the private key via ethers `Wallet`.
 *   2. Gather tx params (nonce, chainId, gasPrice, gas estimate) via the
 *      existing in-file JSON-RPC wrappers.
 *   3. Build a legacy (type-0) tx. Arc Network Testnet accepts legacy txs;
 *      the manual EIP-1559 base-fee + priority-fee helpers aren't fully
 *      implemented in this file, so legacy is the safest default.
 *   4. Sign with ethers v6 (secp256k1 ECDSA over the keccak256 tx hash).
 *      The deployer private key NEVER appears in any shell argv or env
 *      var passed to a child process — it stays inside this Node process.
 *   5. Submit the signed raw tx via `eth_sendRawTransaction` (in-file wrapper).
 *   6. Poll `eth_getTransactionReceipt` until mined (in-file wrapper).
 *
 * @returns `{ hash, status }` where `status` is `1` on success, `0` on
 *          revert, or `0` if the tx wasn't mined within `timeoutMs`.
 */
async function signAndSendTx(
  privateKey: string,
  to: string,
  data: string,
): Promise<{ hash: string; status: number }> {
  const wallet = new Wallet(privateKey);
  const from = wallet.address;

  // 1. Gather tx params via existing JSON-RPC wrappers
  const nonce = await getNonce(from);
  const chainId = await getChainId();
  const gasPrice = await getGasPrice();
  const gasLimit = await estimateGas(from, to, data);

  // 2. Build a legacy (type-0) transaction
  const unsignedTx = {
    to,
    data,
    nonce,
    chainId,
    gasPrice,
    gasLimit,
    type: 0,
  };

  // 3. Sign with ethers v6 — secp256k1 ECDSA over keccak256(rlp(tx))
  const rawTx = await wallet.signTransaction(unsignedTx);

  // 4. Submit via the existing JSON-RPC wrapper
  const txHash = await sendRawTransaction(rawTx);

  // 5. Poll for receipt via the existing JSON-RPC wrapper
  const receipt = await waitForReceipt(txHash);
  return {
    hash: txHash,
    status: receipt && parseInt(receipt.status, 16) === 1 ? 1 : 0,
  };
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
    // SECURITY FIX (Task 4-A / Defect 2): require a CRON_SECRET header on
    // every POST. This route signs on-chain transactions with the deployer
    // private key — it must NEVER accept unauthenticated public requests.
    // If CRON_SECRET is unset in the environment, return 503 (refuse to
    // operate unauthenticated) rather than allow public on-chain writes.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: "Service unavailable", detail: "CRON_SECRET not configured — oracle update endpoint is disabled until the operator provisions a cron secret" },
        { status: 503 },
      );
    }
    if (request.headers.get("x-cron-secret") !== cronSecret) {
      return NextResponse.json(
        { error: "unauthorized", detail: "missing or invalid x-cron-secret header" },
        { status: 401 },
      );
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "DEPLOYER_PRIVATE_KEY not configured", detail: "Cannot update on-chain Oracle without deployer key" },
        { status: 500 },
      );
    }

    // Task E2-A: removed the `existsSync(FOUNDRY_CAST)` gate. The signing
    // path is now pure-JS (ethers v6 for secp256k1, in-file fetch() wrappers
    // for JSON-RPC) and has zero external-binary dependency. This closes
    // v25.5 deployment-provenance caveat #1 (Foundry `cast` not on Vercel
    // serverless PATH → spurious 500 even with secrets provisioned).

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

    // 4. Encode calldata dynamically via ethers v6 (correct 4-byte selectors
    //    computed from keccak256 of the canonical signatures — no stale
    //    hardcoded constants). See `ORACLE_ABI` declaration above.
    const goldData = ORACLE_ABI.encodeFunctionData("setGoldPrice", [goldWei]);
    const silverData = ORACLE_ABI.encodeFunctionData("setSilverPrice", [silverWei]);

    // 5. Sign + send both transactions SEQUENTIALLY (not Promise.all).
    //    Both txs originate from the same deployer account, so the nonce
    //    must increment between submissions — the second `getNonce()` call
    //    inside `signAndSendTx` will observe the now-mined first tx and
    //    return nonce+1. Running them in parallel would race on the nonce
    //    and one tx would fail with "nonce too low".
    const goldTx = await signAndSendTx(privateKey, ORACLE_ADDRESS, goldData);
    const silverTx = await signAndSendTx(privateKey, ORACLE_ADDRESS, silverData);

    // 6. Verify updated prices — read via `ethCall` (same JSON-RPC wrapper
    //    the GET handler uses, same selector constants). This replaces the
    //    previous `castCall(...)` shell-out. The read path was already pure
    //    JS; we just route through the existing wrapper consistently.
    const onChainGold = await ethCall(ORACLE_ADDRESS, GOLD_PRICE_SELECTOR);
    const onChainSilver = await ethCall(ORACLE_ADDRESS, SILVER_PRICE_SELECTOR);

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
      note: "On-chain Oracle updated with live multi-oracle prices. Freshness: 1 hour (MAX_STALENESS). Signed via ethers v6 (pure-JS, no Foundry cast binary required).",
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
