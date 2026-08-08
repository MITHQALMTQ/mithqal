/**
 * Multi-chain registry for the Mithqal Operating System.
 *
 * The protocol is deployed on TWO testnets:
 *
 *   1. Monad Testnet (Chain ID 10143) — primary, all 9 contracts verified
 *   2. Arc Network Testnet (Chain ID 5042002) — secondary, all 9 contracts deployed
 *
 * Both networks share the same deployer wallet and Safe Multi-Sig Treasury
 * address. The 7 remaining contract addresses differ between networks because
 * each deployment produced a fresh address.
 *
 * Architecture notes:
 *   - Existing endpoints continue to import { CONTRACTS, NETWORK } from
 *     contract-reader.ts, which now re-exports CHAINS.monad — so all legacy
 *     code paths work unchanged.
 *   - New endpoints that want to read from Arc can import CHAINS.arc directly.
 *   - The /api/status endpoint reports BOTH networks so consumers can verify
 *     either.
 *
 * Last verified deployment: 2026-08-09 (Monad) + 2026-08-09 (Arc).
 */

export type ChainId = 10143 | 5042002;

export interface ChainConfig {
  /** Short internal key — never changes once a chain is added. */
  key: "monad" | "arc";
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
    name: "Monad Testnet",
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    explorer: "https://testnet.monadscan.com",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
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
export function chainByKey(key: "monad" | "arc"): ChainConfig {
  return CHAINS[key];
}
