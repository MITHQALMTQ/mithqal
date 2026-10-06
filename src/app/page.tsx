/**
 * MITHQAL — Home / Landing Page (/)
 * Page 01 — the institutional entry point.
 *
 * Design: full-bleed hero overlay (text on bg image) + 5-icon strip.
 * Matches the approved MITHQAL reference design (image 2).
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./home.css";

// ─── Shared Header (same as secondary pages) ──────────────────────
const MithqalLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    {/* Sharp geometric "M" cutout inside a diamond/hexagon */}
    <path d="M16 2L29 9.5v13L16 30L3 22.5v-13L16 2Z" stroke="var(--gold)" strokeWidth="1.5" fill="none" />
    <path d="M9 22V11L16 17L23 11V22" stroke="var(--gold)" strokeWidth="2" fill="none" strokeLinejoin="miter" />
    <path d="M16 17V22" stroke="var(--gold)" strokeWidth="2" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

// ─── Inline SVG Icons for the 5-icon strip ────────────────────────
const BrainIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/></svg>);
const CoinsIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h6v4"/><path d="M5 10h2"/></svg>);
const ShieldIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const NodesIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const BoltIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z"/></svg>);

const STRIP = [
  { icon: <BrainIcon />, title: "AI-Powered", desc: "Smarter decisions. Greater opportunities." },
  { icon: <CoinsIcon />, title: "DeFi & Finance", desc: "Build, earn, and grow with confidence." },
  { icon: <ShieldIcon />, title: "Digital Ownership", desc: "Your assets. Your control." },
  { icon: <NodesIcon />, title: "Global Ecosystem", desc: "Connect. Collaborate. Create." },
  { icon: <BoltIcon />, title: "Built for the Future", desc: "Next-gen technology. Real-world impact." },
];

// ─── Page Component ───────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      {/* ─── HEADER ─── */}
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

      {/* ─── FULL-BLEED HERO OVERLAY ─── */}
      <section className="hero-fullbleed" aria-label="Hero">
        <div className="hero-bg" aria-hidden="true" role="img" aria-label="3D rendering of the MITHQAL portal" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line" /><span>THE INTELLIGENCE LAYER FOR A NEW ECONOMY</span></div>
          <h1 className="hero-title">Your Digital Capital. Unified. Intelligent. <span className="gold-text">Limitless.</span></h1>
          <p className="hero-sub">Mithqal is the next-generation platform for AI, finance, and digital ownership — built for creators, investors, and visionaries who see beyond.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/features">Get Started →</a>
            <a className="btn btn-secondary" href="/ecosystem">Explore Ecosystem</a>
          </div>
        </div>

        {/* 5-icon strip at bottom of hero */}
        <div className="hero-strip" aria-label="MITHQAL capabilities strip">
          {STRIP.map((s) => (
            <div className="strip-cell" key={s.title}>
              <div className="strip-icon">{s.icon}</div>
              <div className="strip-text">
                <div className="strip-title">{s.title}</div>
                <div className="strip-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
