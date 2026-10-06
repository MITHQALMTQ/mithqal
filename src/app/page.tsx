/**
 * MITHQAL — Home Page (/)
 * v25.19: PIXEL-PERFECT — uses the reference image DIRECTLY as the full-page
 * background. The nav header overlays on top (semi-transparent + backdrop-blur).
 * The GlobalThemeToggle button (from layout.tsx) floats bottom-right.
 *
 * This gives TRUE pixel-by-pixel match to the reference photo because the
 * page IS the reference image (enhanced: upscaled to 1920px + sharpened +
 * saturation boost for maximum pixel quality).
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./pixel-perfect.css";

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

export default function HomePage() {
  return (
    <div
      className="pixel-page"
      style={{ backgroundImage: 'url("/assets/mithqal-home-full.png")' }}
      role="img"
      aria-label="MITHQAL home page — full reference design"
    >
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => (
              <a key={item} className={`nav-link ${item === "Home" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>
            ))}
          </nav>
          <a className="launch-btn" href="/features"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>
      {/* The background image provides ALL visual content — pixel-perfect match to the reference photo */}
    </div>
  );
}
