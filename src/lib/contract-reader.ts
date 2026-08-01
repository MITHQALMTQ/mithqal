/**
 * On-chain contract reader for the Mithqal Operating System.
 *
 * Reads MTQ token data (balanceOf, totalSupply, name, symbol, decimals) and
 * Governance contract data from Monad Testnet via eth_call.
 *
 * This is the read-only layer — it never submits transactions. Write
 * operations (mint/redeem/transfer) are signed client-side via MetaMask
 * and the resulting tx_hash is recorded in the `transactions` table.
 */

const MONAD_RPC = "https://testnet-rpc.monad.xyz";

export const CONTRACTS = {
  MTQ_TOKEN: "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD",
  GOVERNANCE: "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66",
  SAFE_MULTI_SIG: "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0",
  ALGORITHM: "0x8839ce50e8D414005518769999c0A5b961D00CB2",
  RESERVE: "0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177",
  MINT: "0x197e9CB28216dfe18a199b4c2930F74C2F460809",
  REDEEM: "0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4",
  ORACLE: "0xDfcA66ac0450C9AB86307af1942E157C5A4DB713",
  TAKAFUL: "0x3eC27BB283644eF0A98B9961E9FBED0583a02f19",
  DEPLOYER: "0x3C3932F865892EFabE45892f453f81B64f6c8d8c",
} as const;

export const NETWORK = {
  name: "Monad Testnet",
  chainId: 10143,
  rpcUrl: MONAD_RPC,
  explorer: "https://testnet.monadscan.com",
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

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  // Retry once on transient RPC errors (rate-limit / network blips).
  // The Monad testnet RPC occasionally returns 429 or transient errors
  // when multiple eth_call requests fire in parallel.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(MONAD_RPC, {
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

async function ethCall(to: string, data: string): Promise<string> {
  return (await rpcCall("eth_call", [{ to, data }, "latest"])) as string;
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
 */
export async function getContractInfo() {
  const [nameHex, symbolHex, decimalsHex, supplyHex] = await Promise.all([
    ethCall(CONTRACTS.MTQ_TOKEN, ERC20.name),
    ethCall(CONTRACTS.MTQ_TOKEN, ERC20.symbol),
    ethCall(CONTRACTS.MTQ_TOKEN, ERC20.decimals),
    ethCall(CONTRACTS.MTQ_TOKEN, ERC20.totalSupply),
  ]);

  const decimals = Number(decodeUint(decimalsHex));
  const totalSupply = decodeUint(supplyHex);

  return {
    address: CONTRACTS.MTQ_TOKEN,
    name: decodeString(nameHex),
    symbol: decodeString(symbolHex),
    decimals,
    totalSupply,
    totalSupplyDisplay: Number(totalSupply) / Math.pow(10, decimals),
    network: NETWORK,
    explorerLink: `${NETWORK.explorer}/address/${CONTRACTS.MTQ_TOKEN}`,
  };
}

/**
 * Get the MTQ balance of an address (on-chain).
 */
export async function getBalance(address: string): Promise<{
  address: string;
  balance: bigint;
  balanceDisplay: number;
  decimals: number;
}> {
  const data = ERC20.balanceOf + addressToHex(address);
  const balanceHex = await ethCall(CONTRACTS.MTQ_TOKEN, data);
  const balance = decodeUint(balanceHex);
  const decimalsHex = await ethCall(CONTRACTS.MTQ_TOKEN, ERC20.decimals);
  const decimals = Number(decodeUint(decimalsHex));
  return {
    address,
    balance,
    balanceDisplay: Number(balance) / Math.pow(10, decimals),
    decimals,
  };
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
 */
export async function getBlockNumber(): Promise<number> {
  const result = (await rpcCall("eth_blockNumber", [])) as string;
  return Number(BigInt(result));
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
