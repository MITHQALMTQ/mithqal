/**
 * Multi-chain registry for the Mithqal Operating System.
 *
 * The protocol is deployed on THREE chains:
 *
 *   1. Monad Testnet (Chain ID 10143) — primary, all 9 contracts verified
 *   2. Arc Network Testnet (Chain ID 5042002) — secondary, all 9 contracts deployed
 *   3. Local Anvil (Chain ID 1337) — dev-only, all 9 contracts deployed
 *
 * The first two are public testnets; the third is a local persistent Anvil
 * node for development and testing. The local chain is genuinely "free +
 * no gas" — it uses synthetic ETH pre-funded into 10 Anvil accounts, and
 * state persists to .anvil/state.json across restarts.
 *
 * Architecture notes:
 *   - Existing endpoints continue to import { CONTRACTS, NETWORK } from
 *     contract-reader.ts, which now re-exports CHAINS.monad — so all legacy
 *     code paths work unchanged.
 *   - New endpoints that want to read from Arc or local can import the
 *     corresponding chain from CHAINS directly.
 *   - The /api/status endpoint reports ALL chains so consumers can verify
 *     either.
 *
 * Last verified deployment: 2026-08-09 (Monad + Arc + Local).
 */

export type ChainId = 10143 | 5042002 | 1337;

export interface ChainConfig {
  /** Short internal key — never changes once a chain is added. */
  key: "monad" | "arc" | "local";
  /** Human-readable name shown in UI / API responses. */
  name: string;
  /** EIP-155 chain ID. */
  chainId: ChainId;
  /** JSON-RPC endpoint (HTTPS, no auth). */
  rpcUrl: string;
  /** Block explorer base URL (no trailing slash). */
  explorer: string;
  /** Native currency label (informational only). */
  nativeCurrency: { name: string; symbol: string; decimals: number };
  /** All 11 on-chain addresses: 9 protocol contracts + Safe + deployer. */
  contracts: {
    MTQ_TOKEN: string;
    GOVERNANCE: string;
    SAFE_MULTI_SIG: string;
    ALGORITHM: string;
    RESERVE: string;
    MINT: string;
    REDEEM: string;
    ORACLE: string;
    TAKAFUL: string;
    DEPLOYER: string;
  };
}

export const CHAINS = {
  monad: {
    key: "monad",
    name: "Monad Testnet (Arc)",
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.io",
    explorer: "https://testnet.arcscan.app",
    nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
    contracts: {
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
    },
  },
  arc: {
    key: "arc",
    name: "Arc Network Testnet",
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.io",
    explorer: "https://testnet.arcscan.app",
    nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
    contracts: {
      MTQ_TOKEN: "0x237c3Aa2B79248f86f6523D3890095BCd1996601",
      GOVERNANCE: "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66",
      SAFE_MULTI_SIG: "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0",
      ALGORITHM: "0x62f8E5243f32eE5C87a14A7896C61104aD9e7727",
      RESERVE: "0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471",
      MINT: "0x0dd8b4F8DA7fB6E3eE04ea9F24f853647F84c3aa",
      REDEEM: "0xcAde4594177829597882555Ff57d0e34092daF8e",
      ORACLE: "0xFd2B8d176bf059287638Db30D02C6651dA02861e",
      TAKAFUL: "0xA3B89FfdE28577A7D30E2c22503dB33509044EF0",
      DEPLOYER: "0x3C3932F865892EFabE45892f453f81B64f6c8d8c",
    },
  },
  local: {
    key: "local",
    name: "Local Anvil Devnet",
    chainId: 1337,
    rpcUrl: "http://localhost:8545",
    explorer: "", // No public explorer for local Anvil.
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      // Deployed 2026-08-09 by scripts/deploy-local.sh.
      // State persisted to .anvil/state.json — restart anvil with
      // scripts/start-anvil.sh to restore these addresses.
      MTQ_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      GOVERNANCE: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      // Local dev only: Safe is a 1-of-1 placeholder using the deployer EOA.
      // In production this is a real Gnosis Safe.
      SAFE_MULTI_SIG: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      ALGORITHM: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
      RESERVE: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      MINT: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      REDEEM: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
      ORACLE: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      TAKAFUL: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      DEPLOYER: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    },
  },
} as const satisfies Record<string, ChainConfig>;

/** Default chain — used by all legacy endpoints that don't pass a chain key. */
export const DEFAULT_CHAIN = CHAINS.monad;

/** All chains as an array (for /api/status and similar enumerators). */
export const ALL_CHAINS = Object.values(CHAINS);

/** Look up a chain by its EIP-155 chain ID. */
export function chainById(chainId: number): ChainConfig | undefined {
  return ALL_CHAINS.find((c) => c.chainId === chainId);
}

/** Look up a chain by its short key. */
export function chainByKey(key: "monad" | "arc" | "local"): ChainConfig {
  return CHAINS[key];
}

// ---------------------------------------------------------------------------
// Solana (non-EVM) networks
// ---------------------------------------------------------------------------
//
// Solana is a completely different VM (Sealevel + SPL Token Program) — it
// cannot be modelled as an EVM ChainConfig. We expose it as a separate
// `SolanaNetwork` interface so consumers know they're dealing with a
// different runtime (no eth_getCode, no ERC-20 selectors — use the Solana
// JSON-RPC API instead, see src/lib/solana.ts).
//
// The MTQ token on Solana Devnet is a real SPL token, but it is a SEPARATE
// representation from the EVM MTQ: supply is NOT unified, balances are NOT
// bridged. It exists purely as a read-only public-facing reference.

export interface SolanaNetwork {
  /** Short internal key. */
  key: string;
  /** Human-readable name shown in UI / API responses. */
  name: string;
  /** Solana JSON-RPC endpoint (HTTPS, no auth). */
  rpcUrl: string;
  /** Block explorer base URL (no trailing slash). */
  explorer: string;
  /** SPL Token mint address (base58). */
  mintAddress: string;
  /** Deployer / treasury wallet holding the MTQ supply (base58). */
  walletAddress: string;
  /** Token symbol (informational — SPL mints don't enforce symbols). */
  symbol: string;
  /** Token decimals (SPL mints are configured at deploy-time). */
  decimals: number;
  /** Always false — distinguishes from EVM ChainConfig at the type level. */
  isEvm: false;
}

export const SOLANA_NETWORKS: SolanaNetwork[] = [
  {
    key: "solana-devnet",
    name: "Solana Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    explorer: "https://explorer.solana.com",
    mintAddress: "GAGRdrY6jcRTmD7A9KzvXA5sGMpNAkkRXwDoXBrEjxS4",
    walletAddress: "DbFjzWcD6kNmewadiG7ThjD7L4o3w3UhFhG31fPQhXb3",
    symbol: "MTQ",
    decimals: 18,
    isEvm: false,
  },
];

/** Default Solana network — convenience accessor. */
export const DEFAULT_SOLANA_NETWORK = SOLANA_NETWORKS[0];

/** Look up a Solana network by its short key. */
export function solanaByKey(key: string): SolanaNetwork | undefined {
  return SOLANA_NETWORKS.find((n) => n.key === key);
}
