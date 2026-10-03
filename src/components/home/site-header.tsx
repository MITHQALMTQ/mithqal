import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * MITHQAL home — institutional site header.
 *
 * Full-width dark header (78px) absolutely positioned over the hero so
 * the hero image bleeds to the top edge. Three-column grid layout:
 * logo-mark (left) · primary nav (center) · platform CTA (right).
 *
 * Visual specification:
 *  - background rgba(0, 6, 17, 0.68) with 12px backdrop blur
 *  - 1px hairline bottom border (rgba(255,255,255,0.08))
 *  - wordmark "MITHQAL" at 27px / 0.27em letter-spacing
 *  - nav at 14px with 41px gap; active link carries a gold underline
 *  - CTA is an outlined gold pill, 999px radius, 38px height
 *
 * Responsive:
 *  - < 900px: primary nav collapses (hidden) — grid becomes 1fr / auto
 *  - < 620px: CTA label hidden, only the arrow glyph remains
 *
 * The header is a server component; the imported `Logo` is a client
 * island (it reads the active theme via MutationObserver).
 */

type NavLink = {
  label: string;
  href: string;
  active?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#home", active: true },
  { label: "Features", href: "#platform" },
  { label: "Ecosystem", href: "#platform" },
  { label: "Roadmap", href: "#platform" },
  { label: "About", href: "#platform" },
];

export function SiteHeader() {
  return (
    <header className="mithqal-site-header">
      <div className="mithqal-header-inner">
        {/* Logo + wordmark (left) */}
        <Link href="/" className="mithqal-logo-mark" aria-label="MITHQAL — home">
          <Logo className="mithqal-header-logo" />
          <span className="mithqal-wordmark">MITHQAL</span>
        </Link>

        {/* Primary nav (center) */}
        <nav aria-label="Primary" className="mithqal-nav">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={
                link.active
                  ? "mithqal-nav-link mithqal-nav-link--active"
                  : "mithqal-nav-link"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Platform CTA (right) */}
        <a href="#platform" className="mithqal-header-cta">
          <span className="mithqal-cta-text">Explore Platform</span>
          <span aria-hidden="true" className="mithqal-cta-arrow">
            →
          </span>
        </a>
      </div>
    </header>
  );
}
