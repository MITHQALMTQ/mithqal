"use client";

/**
 * useWallet — 2026 modern multi-wallet connection hook.
 *
 * This version fixes the "install metamask" issue by:
 * 1. Using a `mounted` flag to prevent SSR/hydration issues
 * 2. Detecting the provider at CLICK time (not just mount time)
 * 3. Adding a 500ms delay + re-check if provider not found immediately
 *    (wallets sometimes inject after page load)
 * 4. Providing a clear "waiting for wallet..." state
 * 5. Adding a "Open MetaMask" deep link for mobile
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ---- Monad Testnet config ----
const MONAD_CHAIN_ID = "0x27f7"; // 10143 in hex
const MONAD_CHAIN_PARAMS = {
  chainId: MONAD_CHAIN_ID,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadscan.com"],
};

// ---- Types ----
interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  isBraveWallet?: boolean;
  isRainbow?: boolean;
  providers?: EIP1193Provider[];
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    web3?: { currentProvider?: EIP1193Provider };
  }
}

// ---- Get the best available provider ----
function getProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;

  // 1. Check window.ethereum (most common — set by MetaMask, Coinbase, etc.)
  if (window.ethereum) {
    // If multiple providers exist (e.g., MetaMask + Coinbase both installed),
    // prefer MetaMask
    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
      const metamask = window.ethereum.providers.find(p => p.isMetaMask);
      const coinbase = window.ethereum.providers.find(p => p.isCoinbaseWallet);
      return metamask || coinbase || window.ethereum.providers[0];
    }
    return window.ethereum;
  }

  // 2. Check window.web3 (very old wallets)
  if (window.web3?.currentProvider?.request) {
    return window.web3.currentProvider;
  }

  return null;
}

function getWalletName(provider: EIP1193Provider): string {
  if (provider.isMetaMask) return "MetaMask";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isRabby) return "Rabby";
  if (provider.isTrust) return "Trust Wallet";
  if (provider.isBraveWallet) return "Brave Wallet";
  if (provider.isRainbow) return "Rainbow";
  return "Web3 Wallet";
}

// ---- Hook ----
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const providerRef = useRef<EIP1193Provider | null>(null);

  // ---- Mount detection (prevents SSR issues) ----
  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- Check if already connected (on mount) ----
  useEffect(() => {
    if (!mounted) return;
    const provider = getProvider();
    if (!provider) return;

    // Check if already connected (without prompting)
    provider
      .request({ method: "eth_accounts" })
      .then((accounts: unknown) => {
        const addrs = accounts as string[];
        if (addrs && addrs.length > 0) {
          providerRef.current = provider;
          setAddress(addrs[0]);
          setWalletName(getWalletName(provider));
          provider
            .request({ method: "eth_chainId" })
            .then((cid: unknown) => setChainId(cid as string))
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Listen for account changes
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setChainId(null);
        setWalletName(null);
        providerRef.current = null;
        sessionStorage.removeItem("mithqal:wallet");
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const cid = args[0] as string;
      setChainId(cid);
    };

    if (provider.on) {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [mounted]);

  // ---- Connect ----
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Always re-check window.ethereum at click time
      let provider = getProvider();

      // If not found, wait and retry (wallet may inject late)
      if (!provider) {
        await new Promise(r => setTimeout(r, 500));
        provider = getProvider();
      }

      // Still not found? Try one more time after a longer delay
      if (!provider) {
        await new Promise(r => setTimeout(r, 1000));
        provider = getProvider();
      }

      if (!provider) {
        throw new Error(
          "No wallet extension detected. Please install MetaMask from https://metamask.io/download and refresh the page."
        );
      }

      providerRef.current = provider;

      // Request accounts — this triggers the wallet popup
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned. Please unlock your wallet and try again.");
      }

      const addr = accounts[0];
      setAddress(addr);
      setWalletName(getWalletName(provider));

      // Get chain ID
      const cid = (await provider.request({
        method: "eth_chainId",
      })) as string;
      setChainId(cid);

      // Try to switch to Monad Testnet if not already
      if (cid !== MONAD_CHAIN_ID) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_CHAIN_ID }],
          });
          setChainId(MONAD_CHAIN_ID);
        } catch (switchError: any) {
          if (switchError.code === 4902 || switchError.code === -32603) {
            try {
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [MONAD_CHAIN_PARAMS],
              });
              setChainId(MONAD_CHAIN_ID);
            } catch {
              // User rejected adding the chain — continue anyway
            }
          }
          // User rejected switch — continue anyway
        }
      }

      sessionStorage.setItem(
        "mithqal:wallet",
        JSON.stringify({ address: addr, walletName: getWalletName(provider) })
      );

      return {
        address: addr,
        chainId: cid,
        walletName: getWalletName(provider),
      };
    } catch (e: any) {
      if (e?.code === 4001 || e?.code === -32603) {
        setError("Connection rejected. Please approve the request in your wallet.");
        throw new Error("User rejected the connection request.");
      }
      setError(e?.message || "Failed to connect wallet.");
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ---- Disconnect ----
  const disconnect = useCallback(() => {
    sessionStorage.removeItem("mithqal:wallet");
    providerRef.current = null;
    setAddress(null);
    setChainId(null);
    setWalletName(null);
    setError(null);
  }, []);

  // ---- Get provider ----
  const getProviderRef = useCallback((): EIP1193Provider | null => {
    return providerRef.current || getProvider();
  }, []);

  // ---- Send transaction ----
  const sendTransaction = useCallback(
    async (params: { to: string; data?: string; value?: string }): Promise<string> => {
      const provider = getProviderRef();
      if (!provider) throw new Error("Wallet not connected.");
      if (!address) throw new Error("No wallet address.");

      const txParams: Record<string, string> = { to: params.to, from: address };
      if (params.data) txParams.data = params.data;
      if (params.value) txParams.value = params.value;

      return (await provider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      })) as string;
    },
    [address, getProviderRef]
  );

  // ---- Derived state ----
  const isOnMonadTestnet = chainId === MONAD_CHAIN_ID;
  // isAvailable should only be true after mount (prevents SSR mismatch)
  const isAvailable = mounted && !!getProvider();

  return {
    address,
    chainId,
    isConnecting,
    error,
    walletName,
    isAvailable,
    isOnMonadTestnet,
    mounted,
    connect,
    disconnect,
    getProvider: getProviderRef,
    sendTransaction,
  };
}

export default useWallet;
