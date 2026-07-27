"use client";

/**
 * useWallet — robust multi-wallet connection hook.
 *
 * Handles:
 *   - EIP-6963 (modern multi-wallet detection — announced providers)
 *   - EIP-1193 (window.ethereum — legacy single provider)
 *   - Multiple providers (window.ethereum.providers array)
 *   - window.web3 fallback (very old wallets)
 *   - Provider injection delay (wallets that inject after page load)
 *   - Account change + chain change event listeners
 *   - Auto-reconnect on page reload (sessionStorage)
 *
 * Supported wallets:
 *   - MetaMask
 *   - Coinbase Wallet
 *   - Rabby
 *   - Trust Wallet
 *   - Any EIP-1193 compatible wallet
 */

import { useEffect, useState, useCallback, useRef } from "react";

// ---- EIP-6963 types ----
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  providers?: EIP1193Provider[];
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    web3?: { currentProvider?: EIP1193Provider };
  }
}

// ---- Monad Testnet config ----
export const MONAD_CHAIN_ID = "0x27f7"; // 10143 in hex
export const MONAD_CHAIN_PARAMS = {
  chainId: MONAD_CHAIN_ID,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadscan.com"],
};

// ---- Hook state ----
interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  error: string | null;
  walletName: string | null;
}

/**
 * Detect all available wallet providers using EIP-6963 + legacy fallbacks.
 */
function detectProviders(): { provider: EIP1193Provider; name: string }[] {
  const providers: { provider: EIP1193Provider; name: string }[] = [];

  // 1. Check EIP-6963 announced providers (modern standard)
  // These are collected by the announceProvider event listener in useEffect
  // (stored in a global — see below)

  // 2. Check window.ethereum (legacy EIP-1193)
  if (typeof window !== "undefined" && window.ethereum) {
    // Check if multiple providers are nested
    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
      for (const p of window.ethereum.providers) {
        const name = getWalletName(p);
        providers.push({ provider: p, name });
      }
    } else {
      const name = getWalletName(window.ethereum);
      providers.push({ provider: window.ethereum, name });
    }
  }

  // 3. Check window.web3 (very old wallets)
  if (typeof window !== "undefined" && window.web3?.currentProvider) {
    const p = window.web3.currentProvider;
    if (p.request) {
      providers.push({ provider: p, name: "Legacy Wallet" });
    }
  }

  return providers;
}

function getWalletName(provider: EIP1193Provider): string {
  if (provider.isMetaMask) return "MetaMask";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isRabby) return "Rabby";
  if (provider.isTrust) return "Trust Wallet";
  return "Web3 Wallet";
}

// Global store for EIP-6963 providers (collected by event listener)
let eip6963Providers: EIP6963ProviderDetail[] = [];

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    walletName: null,
  });
  const [providers, setProviders] = useState<{ provider: EIP1193Provider; name: string }[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const providerRef = useRef<EIP1193Provider | null>(null);

  // ---- Detect providers on mount + listen for EIP-6963 announcements ----
  useEffect(() => {
    // Collect EIP-6963 provider announcements
    const handleAnnounce = (event: Event) => {
      const detail = (event as CustomEvent).detail as EIP6963ProviderDetail;
      if (detail && detail.provider) {
        eip6963Providers = [...eip6963Providers.filter(p => p.info.uuid !== detail.info.uuid), detail];
        // Re-detect with the new provider
        refreshProviders();
      }
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    // Request providers to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Also check legacy detection
    refreshProviders();

    // Re-check after a delay (wallets that inject late)
    const timeout = setTimeout(refreshProviders, 1000);
    const timeout2 = setTimeout(refreshProviders, 3000);

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, []);

  function refreshProviders() {
    const detected = detectProviders();

    // Merge EIP-6963 providers
    for (const eip of eip6963Providers) {
      if (!detected.find(d => d.provider === eip.provider)) {
        detected.push({ provider: eip.provider, name: eip.info.name });
      }
    }

    // Deduplicate by name (keep first occurrence)
    const unique: { provider: EIP1193Provider; name: string }[] = [];
    const seen = new Set<string>();
    for (const d of detected) {
      if (!seen.has(d.name)) {
        unique.push(d);
        seen.add(d.name);
      }
    }

    setProviders(unique);
    setIsAvailable(unique.length > 0);
  }

  // ---- Auto-reconnect (sessionStorage) ----
  useEffect(() => {
    const saved = sessionStorage.getItem("mithqal:wallet");
    if (saved) {
      try {
        const { address, walletName } = JSON.parse(saved);
        if (address) {
          // Find the provider
          const p = providers.find(p => p.name === walletName);
          if (p) {
            providerRef.current = p.provider;
            setState(s => ({ ...s, address, walletName }));
            // Verify we're still connected
            p.provider.request({ method: "eth_accounts" }).then((accounts: unknown) => {
              const addrs = accounts as string[];
              if (!addrs.includes(address)) {
                // Disconnected
                sessionStorage.removeItem("mithqal:wallet");
                setState({ address: null, chainId: null, isConnecting: false, error: null, walletName: null });
              } else {
                // Get chain ID
                p.provider.request({ method: "eth_chainId" }).then((cid: unknown) => {
                  setState(s => ({ ...s, chainId: cid as string }));
                }).catch(() => {});
              }
            }).catch(() => {
              sessionStorage.removeItem("mithqal:wallet");
              setState({ address: null, chainId: null, isConnecting: false, error: null, walletName: null });
            });
          }
        }
      } catch {}
    }
  }, [providers]);

  // ---- Account/chain change listeners ----
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider?.on) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        // Disconnected
        sessionStorage.removeItem("mithqal:wallet");
        setState({ address: null, chainId: null, isConnecting: false, error: null, walletName: null });
        providerRef.current = null;
      } else {
        setState(s => ({ ...s, address: accounts[0] }));
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = args[0] as string;
      setState(s => ({ ...s, chainId }));
      // Reload on chain change (recommended by MetaMask)
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  });

  // ---- Connect ----
  const connect = useCallback(async (preferredWallet?: string) => {
    setState(s => ({ ...s, isConnecting: true, error: null }));

    try {
      // Refresh providers in case wallet was just installed
      refreshProviders();

      // Wait a bit for late injections
      await new Promise(r => setTimeout(r, 200));
      const available = detectProviders();

      // Merge EIP-6963
      for (const eip of eip6963Providers) {
        if (!available.find(d => d.provider === eip.provider)) {
          available.push({ provider: eip.provider, name: eip.info.name });
        }
      }

      if (available.length === 0) {
        throw new Error("No wallet found. Please install MetaMask or another Web3 wallet extension.");
      }

      // Pick provider
      let selected: { provider: EIP1193Provider; name: string };

      if (preferredWallet) {
        const found = available.find(p =>
          p.name.toLowerCase().includes(preferredWallet.toLowerCase())
        );
        selected = found || available[0];
      } else {
        // Prefer MetaMask, then Coinbase, then first available
        const metamask = available.find(p => p.name === "MetaMask");
        const coinbase = available.find(p => p.name === "Coinbase Wallet");
        selected = metamask || coinbase || available[0];
      }

      providerRef.current = selected.provider;

      // Request accounts
      const accounts = (await selected.provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned. Please unlock your wallet and try again.");
      }

      const address = accounts[0];

      // Get chain ID
      const chainId = (await selected.provider.request({
        method: "eth_chainId",
      })) as string;

      // Try to switch to Monad Testnet if not already
      if (chainId !== MONAD_CHAIN_ID) {
        try {
          await selected.provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // Chain not added — add it
          if (switchError.code === 4902 || switchError.code === -32603) {
            try {
              await selected.provider.request({
                method: "wallet_addEthereumChain",
                params: [MONAD_CHAIN_PARAMS],
              });
            } catch (addError: any) {
              // If adding fails, continue anyway — user might switch manually
              console.warn("Could not add Monad Testnet:", addError.message);
            }
          } else {
            // User rejected — continue anyway
            console.warn("Could not switch to Monad Testnet:", switchError.message);
          }
        }
      }

      // Save to sessionStorage for auto-reconnect
      sessionStorage.setItem("mithqal:wallet", JSON.stringify({
        address,
        walletName: selected.name,
      }));

      setState({
        address,
        chainId,
        isConnecting: false,
        error: null,
        walletName: selected.name,
      });

      return { address, chainId, walletName: selected.name };
    } catch (e: any) {
      // User rejected request
      if (e.code === 4001 || e.code === -32603) {
        setState(s => ({
          ...s,
          isConnecting: false,
          error: "Connection rejected. Please approve the request in your wallet.",
        }));
        throw new Error("User rejected the connection request.");
      }

      setState(s => ({
        ...s,
        isConnecting: false,
        error: e.message || "Failed to connect wallet.",
      }));
      throw e;
    }
  }, []);

  // ---- Disconnect ----
  const disconnect = useCallback(() => {
    sessionStorage.removeItem("mithqal:wallet");
    providerRef.current = null;
    setState({
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      walletName: null,
    });
  }, []);

  // ---- Get provider (for sending transactions) ----
  const getProvider = useCallback((): EIP1193Provider | null => {
    return providerRef.current;
  }, []);

  // ---- Send transaction ----
  const sendTransaction = useCallback(async (params: {
    to: string;
    data?: string;
    value?: string;
  }): Promise<string> => {
    const provider = providerRef.current;
    if (!provider) {
      throw new Error("Wallet not connected. Please connect first.");
    }
    if (!state.address) {
      throw new Error("No wallet address. Please connect first.");
    }

    const txParams: Record<string, string> = {
      to: params.to,
      from: state.address,
    };
    if (params.data) txParams.data = params.data;
    if (params.value) txParams.value = params.value;

    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [txParams],
    })) as string;

    return txHash;
  }, [state.address]);

  // ---- Check if on correct chain ----
  const isOnMonadTestnet = state.chainId === MONAD_CHAIN_ID;

  return {
    ...state,
    providers,
    isAvailable,
    isOnMonadTestnet,
    connect,
    disconnect,
    getProvider,
    sendTransaction,
  };
}

export default useWallet;
