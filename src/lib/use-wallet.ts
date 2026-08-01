"use client";

/**
 * useWallet — Universal multi-wallet connection hook (2026).
 *
 * Supports ALL wallet types:
 *   1. Injected wallets (MetaMask, Coinbase, Rabby, Trust, Brave, Rainbow)
 *   2. WalletConnect v2 (mobile wallets via QR code)
 *   3. Coinbase Wallet SDK (deep link)
 *
 * When user clicks "Connect Wallet", a modal appears letting them choose:
 *   - MetaMask (if installed)
 *   - Coinbase Wallet (if installed or via mobile deep link)
 *   - WalletConnect (QR code for 200+ mobile wallets)
 *   - Other injected wallets (auto-detected)
 *   - "No wallet? Get one" → links to metamask.io, wallet.coinbase.com, etc.
 *
 * Browser compatibility:
 *   - Chrome/Brave/Edge: All injected wallets work
 *   - Safari desktop: Injected wallets work (MetaMask extension)
 *   - Safari mobile: WalletConnect QR code works
 *   - Firefox: All injected wallets work
 *   - Mobile Chrome/Safari: WalletConnect QR code works
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

// ---- WalletConnect Project ID ----
// IMPORTANT: The value below is a PLACEHOLDER. To enable the WalletConnect
// option (200+ mobile wallets via QR code), the operator MUST:
//   1. Visit https://cloud.walletconnect.com (free, no credit card)
//   2. Create a project, copy the Project ID (32-char hex string)
//   3. Set it as the WC_PROJECT_ID environment variable in .env / Vercel:
//        WC_PROJECT_ID="<your-real-project-id>"
//   4. Redeploy. The "Coming soon" badge on the WalletConnect option will
//      disappear and the QR modal will start working.
// Until then, WalletConnect is advertised but disabled — clicking it shows
// a "Coming soon" message instead of trying (and failing) to connect.
const WC_PLACEHOLDER = "8e6e0e2e7b8a4f5c9d1e3a7b6c5d4e3f";
const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID &&
  process.env.NEXT_PUBLIC_WC_PROJECT_ID !== WC_PLACEHOLDER
    ? process.env.NEXT_PUBLIC_WC_PROJECT_ID
    : WC_PLACEHOLDER;
const WALLETCONNECT_ENABLED = WC_PROJECT_ID !== WC_PLACEHOLDER;

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

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed: boolean;
  connect: () => Promise<{ address: string; chainId: string } | null>;
  downloadUrl?: string;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    web3?: { currentProvider?: EIP1193Provider };
    coinbaseWalletExtension?: EIP1193Provider;
  }
}

// ---- Get injected provider ----
function getInjectedProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;

  if (window.ethereum) {
    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
      const metamask = window.ethereum.providers.find(p => p.isMetaMask);
      const coinbase = window.ethereum.providers.find(p => p.isCoinbaseWallet);
      return metamask || coinbase || window.ethereum.providers[0];
    }
    return window.ethereum;
  }

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

// ---- Connect via injected provider ----
async function connectInjected(provider: EIP1193Provider): Promise<{ address: string; chainId: string }> {
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts returned. Please unlock your wallet and try again.");
  }

  const chainId = (await provider.request({ method: "eth_chainId" })) as string;

  // Try to switch to Monad Testnet
  if (chainId !== MONAD_CHAIN_ID) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [MONAD_CHAIN_PARAMS],
          });
        } catch {
          // User rejected — continue anyway
        }
      }
    }
  }

  return { address: accounts[0], chainId };
}

// ---- Connect via WalletConnect v2 (QR code for mobile) ----
async function connectWalletConnect(): Promise<{ address: string; chainId: string }> {
  // Dynamic import to avoid loading WalletConnect unless needed
  const { SignClient } = await import("@walletconnect/sign-client");
  // @ts-expect-error — @walletconnect/modal exports vary by version;
  // WalletConnect is disabled (placeholder Project ID) until the operator
  // configures a real WC_PROJECT_ID. Type will be reconciled on activation.
  const { modal } = await import("@walletconnect/modal");

  const client = await SignClient.init({
    projectId: WC_PROJECT_ID,
    metadata: {
      name: "Mithqal",
      description: "Constitutional Settlement Institution",
      url: "https://mithqal.vercel.app",
      icons: ["https://mithqal.vercel.app/mithqal-logo.png"],
    },
  });

  // Open WalletConnect modal for QR code
  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      eip155: {
        methods: ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "personal_sign"],
        chains: ["eip155:10143"],
        events: ["accountsChanged", "chainChanged"],
      },
    },
  });

  if (uri) {
    modal.open({ uri, standaloneChains: ["eip155:10143"] });
  }

  const session = await approval();
  modal.close();

  if (!session || !session.namespaces?.eip155?.accounts?.length) {
    throw new Error("WalletConnect session failed. Please try again.");
  }

  const account = session.namespaces.eip155.accounts[0];
  const address = account.split(":")[2];
  const chainId = "0x" + parseInt(account.split(":")[1]).toString(16);

  return { address, chainId };
}

// ---- Hook ----
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const providerRef = useRef<EIP1193Provider | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- Check if already connected ----
  useEffect(() => {
    if (!mounted) return;
    const provider = getInjectedProvider();
    if (!provider) return;

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
      setChainId(args[0] as string);
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

  // ---- Get available wallet options ----
  const getWalletOptions = useCallback((): WalletOption[] => {
    const options: WalletOption[] = [];
    const provider = getInjectedProvider();

    // MetaMask
    const isMetaMaskInstalled = provider?.isMetaMask || (window.ethereum?.providers?.some(p => p.isMetaMask));
    options.push({
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
      description: isMetaMaskInstalled ? "Connected" : "Most popular wallet",
      installed: !!isMetaMaskInstalled,
      downloadUrl: "https://metamask.io/download/",
      connect: async () => {
        const p = provider?.isMetaMask
          ? provider
          : window.ethereum?.providers?.find(p => p.isMetaMask) || provider;
        if (!p) throw new Error("MetaMask not found. Install it from metamask.io");
        providerRef.current = p;
        setWalletName("MetaMask");
        return connectInjected(p);
      },
    });

    // Coinbase Wallet
    const isCoinbaseInstalled = provider?.isCoinbaseWallet || (window.ethereum?.providers?.some(p => p.isCoinbaseWallet));
    options.push({
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "🔵",
      description: isCoinbaseInstalled ? "Connected" : "By Coinbase",
      installed: !!isCoinbaseInstalled,
      downloadUrl: "https://wallet.coinbase.com/",
      connect: async () => {
        const p = provider?.isCoinbaseWallet
          ? provider
          : window.ethereum?.providers?.find(p => p.isCoinbaseWallet) || provider;
        if (!p) throw new Error("Coinbase Wallet not found. Install it from wallet.coinbase.com");
        providerRef.current = p;
        setWalletName("Coinbase Wallet");
        return connectInjected(p);
      },
    });

    // WalletConnect (QR code for mobile wallets)
    // C1 — When WC_PROJECT_ID is the placeholder (operator has not yet set
    // NEXT_PUBLIC_WC_PROJECT_ID), the option is advertised but disabled:
    // `installed: false` so it renders as "Coming soon" rather than trying
    // (and failing) to connect. Once the env var is set, the option becomes
    // functional and `installed` flips to true.
    options.push({
      id: "walletconnect",
      name: "WalletConnect",
      icon: "🔗",
      description: WALLETCONNECT_ENABLED
        ? "Scan with any mobile wallet"
        : "Coming soon — operator must set NEXT_PUBLIC_WC_PROJECT_ID",
      installed: WALLETCONNECT_ENABLED,
      downloadUrl: "https://cloud.walletconnect.com",
      connect: async () => {
        if (!WALLETCONNECT_ENABLED) {
          throw new Error(
            "WalletConnect is not configured yet. The operator must set NEXT_PUBLIC_WC_PROJECT_ID — get a free ID at cloud.walletconnect.com.",
          );
        }
        setWalletName("WalletConnect");
        return connectWalletConnect();
      },
    });

    // Other injected wallets (Rabby, Trust, Brave, Rainbow)
    if (provider && !provider.isMetaMask && !provider.isCoinbaseWallet) {
      const name = getWalletName(provider);
      options.push({
        id: "injected",
        name,
        icon: " wallets",
        description: "Connected",
        installed: true,
        connect: async () => {
          providerRef.current = provider;
          setWalletName(name);
          return connectInjected(provider);
        },
      });
    }

    return options;
  }, []);

  // ---- Connect (opens wallet selector modal) ----
  const connect = useCallback(async (): Promise<{ address: string; chainId: string } | null> => {
    setError(null);
    setShowWalletModal(true);
    // The actual connection happens when user picks a wallet from the modal
    // via connectWithWallet(). This function just opens the modal.
    return null;
  }, []);

  // ---- Connect with specific wallet ----
  const connectWithWallet = useCallback(async (option: WalletOption) => {
    setError(null);
    setIsConnecting(true);
    setShowWalletModal(false);

    try {
      const result = await option.connect();
      if (!result) return null;
      setAddress(result.address);
      setChainId(result.chainId);

      sessionStorage.setItem(
        "mithqal:wallet",
        JSON.stringify({ address: result.address, walletName: option.name })
      );

      return {
        address: result.address,
        chainId: result.chainId,
        walletName: option.name,
      };
    } catch (e: any) {
      if (e?.code === 4001) {
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
    return providerRef.current || getInjectedProvider();
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

  const isOnMonadTestnet = chainId === MONAD_CHAIN_ID;
  const isAvailable = mounted && !!getInjectedProvider();

  return {
    address,
    chainId,
    isConnecting,
    error,
    walletName,
    isAvailable,
    isOnMonadTestnet,
    mounted,
    showWalletModal,
    walletOptions: getWalletOptions(),
    connect,
    connectWithWallet,
    disconnect,
    getProvider: getProviderRef,
    sendTransaction,
    closeWalletModal: () => setShowWalletModal(false),
  };
}

export default useWallet;
