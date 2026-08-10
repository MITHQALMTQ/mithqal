/**
 * Read-only Solana RPC client using the JSON-RPC API (no SDK).
 *
 * Why no `@solana/web3.js`?
 *   - It's a ~1 MB dependency with a heavy transitive tree (bn.js, buffer,
 *     bs58, borsh, …). The Mithqal web app only needs to READ the public
 *     MTQ SPL token state (balance, supply, existence) — it does not sign
 *     transactions, derive keypairs, or simulate programs.
 *   - The Solana JSON-RPC API is a thin HTTPS POST layer; any method can be
 *     invoked with `fetch` + a fixed JSON envelope. See:
 *       https://solana.com/docs/rpc
 *
 * Scope:
 *   - This module is READ-ONLY. There is no signer here, no `sendTransaction`.
 *   - It targets the public MTQ mint on Solana Devnet, the address of which
 *     is mirrored in src/lib/chains.ts as `SOLANA_NETWORKS[0]`. The two are
 *     intentionally kept in sync by hand (one source of truth per file).
 *
 * Network: Solana Devnet (https://api.devnet.solana.com)
 * Mint:    GAGRdrY6jcRTmD7A9KzvXA5sGMpNAkkRXwDoXBrEjxS4  (SPL Token Program)
 * Wallet:  DbFjzWcD6kNmewadiG7ThjD7L4o3w3UhFhG31fPQhXb3  (deployer / treasury)
 */

export const SOLANA_CONFIG = {
  rpc: "https://api.devnet.solana.com",
  mint: "GAGRdrY6jcRTmD7A9KzvXA5sGMpNAkkRXwDoXBrEjxS4",
  wallet: "DbFjzWcD6kNmewadiG7ThjD7L4o3w3UhFhG31fPQhXb3",
} as const;

/** Timeout (ms) for every Solana RPC call. Devnet can be slow. */
const RPC_TIMEOUT_MS = 15_000;

/**
 * Low-level Solana JSON-RPC caller.
 *
 * @param method Solana RPC method name, e.g. "getHealth", "getAccountInfo".
 * @param params Positional params array — Solana always uses positional.
 * @returns The `result` field of the JSON-RPC response.
 * @throws  On non-2xx HTTP, on a JSON-RPC `error` payload, or on timeout.
 */
export async function solanaRpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(SOLANA_CONFIG.rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Solana RPC HTTP ${res.status} from ${SOLANA_CONFIG.rpc}`);
  const json = (await res.json()) as { result?: T; error?: { message: string; code: number } };
  if (json.error) throw new Error(`Solana RPC error (${json.error.code}): ${json.error.message}`);
  if (json.result === undefined) throw new Error(`Solana RPC returned no result for ${method}`);
  return json.result;
}

/**
 * Shape of `getTokenAccountsByOwner` (base64-encoded) for one token account.
 *
 * NOTE: the public Solana Devnet RPC (`api.devnet.solana.com`) does NOT
 * support `getParsedTokenAccountsByOwner` (returns -32601 Method not found)
 * — that method is deprecated on public endpoints. `getTokenAccountsByOwner`
 * with `{ encoding: "base64" }` is the supported alternative and returns
 * the raw SPL Token account data, which we parse manually below.
 */
interface RawTokenAccount {
  pubkey: string;
  account: {
    data: [string, "base64"];
    owner: string;
    executable: boolean;
    lamports: number;
  };
}

/**
 * SPL Token v2 account layout (165 bytes total).
 * Source: https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/state.rs#L14
 *
 *   0..32   mint            (Pubkey)
 *   32..64  owner           (Pubkey)
 *   64..72  amount          (u64 little-endian)
 *   72..76  delegateOption  (u32 LE — 0 or 1)
 *   76..108 delegate        (Pubkey)
 *   108     state           (u8 — 0=Uninitialized, 1=Initialized, 2=Frozen)
 *   ...remaining fields omitted (we only need amount)
 */
const SPL_AMOUNT_OFFSET = 64;
const SPL_AMOUNT_LEN = 8;

/** Parse the u64 amount from a base64-encoded SPL Token account buffer. */
function parseSplAmount(dataBase64: string): bigint {
  const buf = Buffer.from(dataBase64, "base64");
  if (buf.length < SPL_AMOUNT_OFFSET + SPL_AMOUNT_LEN) return 0n;
  // u64 little-endian read (Buffer.readBigUInt64LE)
  return buf.readBigUInt64LE(SPL_AMOUNT_OFFSET);
}

/**
 * Get the deployer wallet's SPL token balance for the MTQ mint.
 *
 * Uses `getTokenAccountsByOwner` (base64) filtered by `{ mint }` — typically
 * returns 0 or 1 ATA (Associated Token Account). If multiple are returned
 * (rare but possible for legacy wallets), we sum their raw amounts.
 *
 * The decimals are NOT part of the token account layout — they live on the
 * MINT account. We fetch them separately via `getMtqMintInfo()` in the API
 * route. Here we return `decimals: 18` as a placeholder default; the caller
 * should overwrite with the on-chain mint decimals.
 *
 * @returns balance (uiAmount, derived from raw + decimals fallback), the
 *          decimals used for the conversion, and the raw integer string.
 *          `{ balance: 0 }` when no token account exists for this wallet+mint.
 */
export async function getMtqBalance(): Promise<{
  balance: number;
  decimals: number;
  raw: string;
  tokenAccounts: { pubkey: string; amount: string; lamports: number }[];
}> {
  const result = await solanaRpc<{ value: RawTokenAccount[] }>(
    "getTokenAccountsByOwner",
    [SOLANA_CONFIG.wallet, { mint: SOLANA_CONFIG.mint }, { encoding: "base64" }]
  );
  const accounts = result?.value || [];
  if (accounts.length === 0) {
    return { balance: 0, decimals: 18, raw: "0", tokenAccounts: [] };
  }

  let totalRaw = 0n;
  const tokenAccounts: { pubkey: string; amount: string; lamports: number }[] = [];
  for (const acct of accounts) {
    const [dataB64] = acct?.account?.data || [];
    if (!dataB64) continue;
    const amt = parseSplAmount(dataB64);
    totalRaw += amt;
    tokenAccounts.push({
      pubkey: acct.pubkey,
      amount: amt.toString(),
      lamports: acct.account?.lamports ?? 0,
    });
  }

  // decimals are fetched by the caller from the mint account; we use 18 as
  // the placeholder default for the conversion below (overwritten in the
  // API route after getMtqMintInfo resolves).
  const decimals = 18;
  const balance = Number(totalRaw) / Math.pow(10, decimals);
  return { balance, decimals, raw: totalRaw.toString(), tokenAccounts };
}

/** Shape of `getAccountInfo` (jsonParsed) for an SPL Mint account. */
interface ParsedMintAccount {
  value: {
    data?: {
      parsed?: {
        info: {
          supply: string;
          decimals: number;
          mintAuthority?: string | null;
          freezeAuthority?: string | null;
          isInitialized?: boolean;
        };
      };
    };
    owner?: string;
  } | null;
}

/**
 * Get the MTQ mint account info — proves the mint exists and reports its
 * on-chain supply + decimals.
 *
 * @returns supply (raw integer string), decimals, and `exists` flag.
 *          `{ exists: false }` when `getAccountInfo` returns `null` (mint
 *          not found on this cluster).
 */
export async function getMtqMintInfo(): Promise<{
  supply: string;
  decimals: number;
  exists: boolean;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  owner: string | null;
}> {
  const result = await solanaRpc<ParsedMintAccount>("getAccountInfo", [
    SOLANA_CONFIG.mint,
    { encoding: "jsonParsed" },
  ]);
  const value = result?.value;
  if (!value) {
    return {
      supply: "0",
      decimals: 0,
      exists: false,
      mintAuthority: null,
      freezeAuthority: null,
      owner: null,
    };
  }
  const info = value?.data?.parsed?.info;
  return {
    supply: info?.supply ?? "0",
    decimals: info?.decimals ?? 18,
    exists: true,
    mintAuthority: info?.mintAuthority ?? null,
    freezeAuthority: info?.freezeAuthority ?? null,
    owner: value.owner ?? null,
  };
}

/**
 * Get cluster health — returns "ok" when the RPC is reachable and serving.
 * Used as a liveness probe by /api/solana/balance.
 */
export async function getSolanaHealth(): Promise<string> {
  return await solanaRpc<string>("getHealth", []);
}

/**
 * Get the current Solana slot (block height). Useful for showing "the RPC
 * is alive and current" beyond just a getHealth string.
 */
export async function getSolanaSlot(): Promise<number> {
  return await solanaRpc<number>("getSlot", []);
}
