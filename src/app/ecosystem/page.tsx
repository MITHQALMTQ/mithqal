/**
 * MITHQAL — Ecosystem Page (/ecosystem)
 * v25.19: PIXEL-PERFECT — uses the reference image DIRECTLY as the full-page background.
 * BUILD_MODE = FROZEN — no backend changes.
 */

import "../pixel-perfect.css";

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

export default function EcosystemPage() {
  return (
    <div
      className="pixel-page"
      style={{ backgroundImage: 'url("/assets/mithqal-ecosystem-full.png")' }}
      role="img"
      aria-label="MITHQAL ecosystem page — full reference design"
    >
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => (
              <a key={item} className={`nav-link ${item === "Ecosystem" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>
            ))}
          </nav>
          <a className="launch-btn" href="/features"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>
    </div>
  );
}
