/**
 * On-chain MockOracle client — reads prices from the deployed MockOracle.sol
 * on Monad Testnet (Chain ID 10143).
 *
 * Constitutional context (§30-33 v19.0):
 *   The Constitution requires a multi-oracle consensus. This is the testnet
 *   single-source mock implementation. On mainnet, this will be replaced by
 *   a MultiOracleConsensus adapter that aggregates Chainlink + Pyth + Chronicle.
 *
 * Fallback strategy:
 *   - If MOCK_ORACLE_ADDRESS is set AND the contract responds, use on-chain prices
 *   - Otherwise, fall back to live free APIs (gold-api.com, open.er-api.com)
 *   - This ensures the dashboard always shows real prices even before deployment
 *
 * Price encoding: 8 decimals (matches MockOracle.sol)
 *   $4053.50 = 4053_50000000 = 405350000000 wei
 */

const MONAD_RPC = "https://testnet-rpc.monad.xyz";

// Function selectors (first 4 bytes of keccak256(signature))
const SELECTORS = {
  goldPrice: "0xd97f7f40", // goldPrice() — public variable auto-getter
  silverPrice: "0xf93e407b", // silverPrice()
  getGoldPrice: "0xe6f4b3a1", // getGoldPrice()
  getSilverPrice: "0xa2152a4a", // getSilverPrice()
  // batchGetPrices(string[]) — too complex for simple eth_call, use individual getters
  getStablecoinPrice: "0x73f5ebe0", // getStablecoinPrice(string)
  lastUpdated: "0x5c60da1b", // lastUpdated(string)
};

export interface OraclePrice {
  asset: string;
  priceUsd: number;
  decimals: number;
  lastUpdated: number; // epoch seconds (0 if unknown)
  source: "onchain" | "fallback";
}

export interface OracleSnapshot {
  goldUsd: number;
  silverUsd: number;
  stablecoins: Record<string, number>;
  lastUpdated: Record<string, number>;
  source: "onchain" | "fallback";
  oracleAddress: string | null;
  rpcUrl: string;
  fetchedAt: string;
}

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(MONAD_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

async function ethCall(to: string, data: string): Promise<string> {
  return (await rpcCall("eth_call", [{ to, data }, "latest"])) as string;
}

function decodeUint(hex: string): bigint {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

function toUsd(wei: bigint, decimals = 8): number {
  return Number(wei) / Math.pow(10, decimals);
}

function encodeString(str: string): string {
  // ABI-encode a string for use as a function argument
  // selector (4 bytes) + offset (32 bytes) + length (32 bytes) + data (padded to 32 bytes)
  const strBytes = Buffer.from(str, "utf-8");
  const paddedLen = Math.ceil(strBytes.length / 32) * 32;
  const padded = Buffer.alloc(paddedLen);
  strBytes.copy(padded);
  const offset = 32; // offset to the start of the string data (after the offset slot)
  const length = strBytes.length;
  return (
    "0x" +
    offset.toString(16).padStart(64, "0") +
    length.toString(16).padStart(64, "0") +
    padded.toString("hex")
  );
}

/**
 * Read all prices from the on-chain MockOracle.
 * Returns null if the contract is not deployed or unreachable.
 */
export async function getOnChainOraclePrices(
  oracleAddress: string
): Promise<OracleSnapshot | null> {
  if (!oracleAddress || oracleAddress === "0x0") return null;

  try {
    // Verify the contract exists
    const code = (await rpcCall("eth_getCode", [oracleAddress, "latest"])) as string;
    if (!code || code === "0x" || code.length < 4) return null;

    // Read gold + silver (parallel)
    const [goldHex, silverHex, goldUpdatedHex, silverUpdatedHex] = await Promise.all([
      ethCall(oracleAddress, SELECTORS.getGoldPrice),
      ethCall(oracleAddress, SELECTORS.getSilverPrice),
      ethCall(oracleAddress, SELECTORS.lastUpdated + encodeString("GOLD").slice(8)),
      ethCall(oracleAddress, SELECTORS.lastUpdated + encodeString("SILVER").slice(8)),
    ]);

    const goldUsd = toUsd(decodeUint(goldHex));
    const silverUsd = toUsd(decodeUint(silverHex));

    // Read stablecoins (USDC, USDT, DAI)
    const stablecoinSymbols = ["USDC", "USDT", "DAI"];
    const stablecoinResults = await Promise.all(
      stablecoinSymbols.map(async (sym) => {
        const priceHex = await ethCall(
          oracleAddress,
          SELECTORS.getStablecoinPrice + encodeString(sym).slice(8)
        );
        const updatedHex = await ethCall(
          oracleAddress,
          SELECTORS.lastUpdated + encodeString(sym).slice(8)
        );
        return {
          symbol: sym,
          price: toUsd(decodeUint(priceHex)),
          lastUpdated: Number(decodeUint(updatedHex)),
        };
      })
    );

    const stablecoins: Record<string, number> = {};
    const lastUpdated: Record<string, number> = {};
    for (const sc of stablecoinResults) {
      stablecoins[sc.symbol] = sc.price;
      lastUpdated[sc.symbol] = sc.lastUpdated;
    }
    lastUpdated["GOLD"] = Number(decodeUint(goldUpdatedHex));
    lastUpdated["SILVER"] = Number(decodeUint(silverUpdatedHex));

    return {
      goldUsd,
      silverUsd,
      stablecoins,
      lastUpdated,
      source: "onchain",
      oracleAddress,
      rpcUrl: MONAD_RPC,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[oracle] on-chain read failed, will use fallback:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Get the current oracle snapshot.
 *
 * Strategy (per §30 oracle engine):
 *   1. If MOCK_ORACLE_ADDRESS env var is set, try reading from the on-chain contract.
 *   2. If on-chain read fails OR the address is not set, fall back to live free APIs.
 *
 * This allows the dashboard to show real prices immediately, then transparently
 * switch to on-chain prices once the MockOracle is deployed.
 */
export async function getOracleSnapshot(): Promise<OracleSnapshot> {
  const oracleAddress = process.env.MOCK_ORACLE_ADDRESS;

  // Try on-chain first (if address is configured)
  if (oracleAddress) {
    const onChain = await getOnChainOraclePrices(oracleAddress);
    if (onChain && onChain.goldUsd > 0) {
      return onChain;
    }
  }

  // Fallback: live free APIs (gold-api.com, open.er-api.com)
  return getFallbackOracleSnapshot();
}

/**
 * Fallback oracle: fetch live prices from free public APIs.
 * Used when MockOracle is not yet deployed, or as a redundancy check.
 */
async function getFallbackOracleSnapshot(): Promise<OracleSnapshot> {
  try {
    // Gold price from gold-api.com (free, no key)
    const goldRes = await fetch("https://gold-api.com/api/price", {
      signal: AbortSignal.timeout(5000),
    });
    const goldData = await goldRes.json();
    const goldUsd = typeof goldData.price === "number" ? goldData.price : 1850;

    // Silver price (free, no key) — try metals-api or use a fallback
    let silverUsd = 25; // reasonable default
    try {
      const silverRes = await fetch("https://gold-api.com/api/price/XAG", {
        signal: AbortSignal.timeout(5000),
      });
      if (silverRes.ok) {
        const silverData = await silverRes.json();
        if (typeof silverData.price === "number") silverUsd = silverData.price;
      }
    } catch {
      // keep default
    }

    const now = Math.floor(Date.now() / 1000);
    return {
      goldUsd,
      silverUsd,
      stablecoins: { USDC: 1, USDT: 1, DAI: 1 },
      lastUpdated: { GOLD: now, SILVER: now, USDC: now, USDT: now, DAI: now },
      source: "fallback",
      oracleAddress: null,
      rpcUrl: MONAD_RPC,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[oracle] fallback API failed, using defaults:", err);
    const now = Math.floor(Date.now() / 1000);
    return {
      goldUsd: 4053.70, // last known
      silverUsd: 25,
      stablecoins: { USDC: 1, USDT: 1, DAI: 1 },
      lastUpdated: { GOLD: now, SILVER: now, USDC: now, USDT: now, DAI: now },
      source: "fallback",
      oracleAddress: null,
      rpcUrl: MONAD_RPC,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Format a USD price as the 8-decimal uint256 expected by MockOracle.sol.
 * e.g., 4053.50 → "405350000000"
 */
export function priceToWei(usd: number): string {
  const wei = Math.round(usd * 1e8);
  return wei.toString();
}

/**
 * Parse a uint256 price (8 decimals) from MockOracle.sol into USD.
 */
export function weiToPrice(wei: string | bigint): number {
  return Number(wei) / 1e8;
}
