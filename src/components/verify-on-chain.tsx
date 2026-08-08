"use client";

/**
 * VerifyOnChain — small "Verify on Chain" button that opens the supplied
 * contract address on the appropriate block explorer.
 *
 * As of 2026-08-09, the protocol is deployed on TWO testnets:
 *   - Monad Testnet  → https://testnet.monadscan.com/address/{addr}
 *   - Arc Network    → https://testnet.arcscan.app/address/{addr}
 *
 * Pass `chainKey="monad"` or `chainKey="arc"` to pick the explorer. Default
 * is "monad" for backward compatibility.
 *
 * Accessibility:
 *   • rendered as a real <a> with target="_blank" + rel="noopener noreferrer"
 *   • aria-label fully describes the destination, label, and address
 *   • the external-link icon is aria-hidden so it isn't double-read
 */

import { ExternalLink } from "lucide-react";
import { CHAINS } from "@/lib/chains";

export interface VerifyOnChainProps {
  /** The 0x-prefixed contract address (or tx hash — anything that resolves
   * at /address/{x} on the chain's explorer). */
  address: string;
  /** Human label for the address (e.g. "MTQ Token"). Default "Contract". */
  label?: string;
  /** Visual size — "sm" (default) renders a compact pill button. */
  size?: "sm" | "md";
  /** Optional className override. */
  className?: string;
  /** Show the truncated address alongside the label. Default true. */
  showAddress?: boolean;
  /** Which chain's explorer to open. Default "monad" (backward compat).
   * For chains with no public explorer (e.g. local Anvil), the button
   * renders as disabled with a tooltip explaining why. */
  chainKey?: "monad" | "arc" | "local";
}

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
  chainKey = "monad",
}: VerifyOnChainProps) {
  const chain = CHAINS[chainKey];
  const hasExplorer = !!chain.explorer;
  const href = hasExplorer ? `${chain.explorer}/address/${address}` : undefined;
  const ariaLabel = hasExplorer
    ? `Verify ${label} on ${chain.name} explorer: ${address} (opens in a new tab)`
    : `${label} on ${chain.name}: no public explorer (local devnet)`;
  const title = hasExplorer
    ? `${label} · ${address} · ${chain.name} explorer (new tab)`
    : `${label} · ${chain.name} has no public explorer — address: ${address}`;
  const sizeCls =
    size === "md"
      ? "px-3 py-1.5 text-[11px]"
      : "px-2 py-1 text-[10px]";

  // For local chains with no explorer, render as a non-clickable badge
  // so users still see the address but can't click through.
  if (!hasExplorer) {
    return (
      <span
        aria-label={ariaLabel}
        title={title}
        className={
          className ??
          `inline-flex items-center gap-1 rounded-full border border-line bg-ink-card ${sizeCls} font-semibold text-fg-muted`
        }
      >
        <span>{chain.nativeCurrency.symbol} local</span>
        {showAddress && (
          <span className="hidden font-mono text-[9px] text-fg-muted sm:inline">
            ({truncateAddress(address)})
          </span>
        )}
      </span>
    );
  }

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
