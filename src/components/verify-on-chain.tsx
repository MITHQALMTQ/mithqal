"use client";

/**
 * VerifyOnChain — small "Verify on Chain" button that opens the supplied
 * contract address on the Monad Testnet block explorer
 * (https://testnet.monadscan.com/address/{address}).
 *
 * Used anywhere a contract address or on-chain artifact is published and the
 * institution wants readers to be able to independently verify it.
 *
 * Accessibility:
 *   • rendered as a real <a> with target="_blank" + rel="noopener noreferrer"
 *   • aria-label fully describes the destination, label, and address
 *   • the external-link icon is aria-hidden so it isn't double-read
 */

import { ExternalLink } from "lucide-react";

export interface VerifyOnChainProps {
  /** The 0x-prefixed contract address (or tx hash, technically — anything
   * that resolves at /address/{x} on MonadScan). */
  address: string;
  /** Human label for the address (e.g. "MTQ Token"). Default "Contract". */
  label?: string;
  /** Visual size — "sm" (default) renders a compact pill button. */
  size?: "sm" | "md";
  /** Optional className override. */
  className?: string;
  /** Show the truncated address alongside the label. Default true. */
  showAddress?: boolean;
}

const MONAD_EXPLORER_BASE = "https://testnet.monadscan.com/address/";

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function VerifyOnChain({
  address,
  label = "Contract",
  size = "sm",
  className,
  showAddress = true,
}: VerifyOnChainProps) {
  const href = `${MONAD_EXPLORER_BASE}${address}`;
  const ariaLabel = `Verify ${label} on MonadScan: ${address} (opens in a new tab)`;
  const title = `${label} · ${address} · Monad Testnet explorer (new tab)`;
  const sizeCls =
    size === "md"
      ? "px-3 py-1.5 text-[11px]"
      : "px-2 py-1 text-[10px]";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={title}
      className={
        className ??
        `inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/[0.06] ${sizeCls} font-semibold text-gold transition hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60`
      }
    >
      <span>Verify on Chain</span>
      {showAddress && (
        <span className="hidden font-mono text-[9px] text-fg-muted sm:inline">
          ({truncateAddress(address)})
        </span>
      )}
      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
    </a>
  );
}

export default VerifyOnChain;
