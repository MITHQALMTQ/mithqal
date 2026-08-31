import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Global site footer.
 *
 * Renders on every view (institution, transparency, audit, etc.) and is
 * pinned to the bottom of the viewport on short pages via the
 * `min-h-screen flex flex-col` wrapper in `layout.tsx` (the footer is
 * the last flex child and therefore sticks to the bottom). On long pages
 * it is pushed down naturally by the content.
 *
 * The footer is the canonical home for legal + governance links so they
 * are reachable from any view without hunting — a baseline institutional
 * requirement (privacy / terms / risk disclosure / contact).
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="no-print mt-auto border-t border-line/40 bg-ink-soft/60 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Identity */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="font-display text-sm font-semibold tracking-wide text-foreground">
                Mithqal
              </span>
            </div>
            <p className="max-w-xs text-[11px] leading-relaxed text-fg-muted">
              A constitutional settlement institution. Operating through
              JOZOUR LLC, a New Jersey Limited Liability Company.
            </p>
            <p className="text-[10px] text-fg-muted">
              Testnet only. Not a security. Not a solicitation.
            </p>
          </div>

          {/* Legal links */}
          <nav aria-label="Legal" className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              Legal
            </span>
            <Link href="/legal/privacy" className="text-[12px] text-fg-muted transition hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="text-[12px] text-fg-muted transition hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/legal/risk-disclosure" className="text-[12px] text-fg-muted transition hover:text-foreground">
              Risk Disclosure
            </Link>
            <Link href="/legal/cookies" className="text-[12px] text-fg-muted transition hover:text-foreground">
              Cookie Policy
            </Link>
            <Link href="/legal/jozour-llc-nj-certificate.pdf" className="text-[12px] text-fg-muted transition hover:text-foreground" target="_blank" rel="noopener noreferrer">
              Entity Certificate (PDF)
            </Link>
          </nav>

          {/* Contact + status */}
          <nav aria-label="Contact" className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              Contact
            </span>
            <a href="mailto:operator@mithqal.org" className="text-[12px] text-fg-muted transition hover:text-foreground">
              operator@mithqal.org
            </a>
            <a
              href="https://github.com/MITHQALMTQ/mithqal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-fg-muted transition hover:text-foreground"
            >
              GitHub (public)
            </a>
            <a
              href="https://testnet.monadscan.com/address/0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-fg-muted transition hover:text-foreground"
            >
              MTQ on Monad Testnet
            </a>
            <span className="text-[10px] text-fg-muted">
              Vulnerabilities: use GitHub Security Advisory
            </span>
          </nav>
        </div>

        <div className="mt-6 border-t border-line/30 pt-4">
          <p className="text-[10px] leading-relaxed text-fg-muted">
            © {year} JOZOUR LLC. All rights reserved. Mithqal, MTQ, and the
            Mithqal Constitution are trademarks of JOZOUR LLC. The MTQ token
            currently exists only on the Monad Testnet; no MTQ is in
            circulation on any mainnet. All "mint" and "redeem" operations
            on this site are testnet simulations and do not transfer real
            value. Nothing on this site constitutes financial, legal, or
            investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
