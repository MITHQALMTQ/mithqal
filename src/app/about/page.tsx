/**
 * MITHQAL — About Page (/about)
 * Page 05 — institutional identity.
 *
 * Design: split hero (text left / portal image right) + Mission/Vision 2-col +
 * 6-item Values grid + 4-col Principles grid + commitment banner.
 * Matches reference image 1.
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./about.css";

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);
const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

// ─── Values Icons (6 items) ────────────────────────────────────────
const NeutralityIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const InstitutionIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>);
const SecurityIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const InteropIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const TransparencyIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20M2 12h20"/></svg>);
const OversightIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/></svg>);

const VALUES = [
  { title: "Neutrality", desc: "Non-sovereign, non-speculative infrastructure.", icon: <NeutralityIcon /> },
  { title: "Institutional Focus", desc: "Built for institutions, not retail speculation.", icon: <InstitutionIcon /> },
  { title: "Security & Control", desc: "Cryptographic auditability on every state.", icon: <SecurityIcon /> },
  { title: "Interoperability", desc: "Complements existing financial infrastructure.", icon: <InteropIcon /> },
  { title: "Transparency", desc: "Every settlement state is attributable.", icon: <TransparencyIcon /> },
  { title: "Human Oversight", desc: "Operators retain all decision authority.", icon: <OversightIcon /> },
];

// ─── Principles Icons (4 items) ─────────────────────────────────────
const IntegrityIcon = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const ResilienceIcon = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z"/></svg>);
const CollaborationIcon = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const ImpactIcon = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>);

const PRINCIPLES = [
  { title: "Integrity", desc: "Every state leaves attributable evidence.", icon: <IntegrityIcon /> },
  { title: "Resilience", desc: "Controlled through failure and recovery.", icon: <ResilienceIcon /> },
  { title: "Collaboration", desc: "Institutional participants, connected.", icon: <CollaborationIcon /> },
  { title: "Impact", desc: "A more connected financial future.", icon: <ImpactIcon /> },
];

export default function AboutPage() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => (
              <a key={item} className={`nav-link ${item === "About" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>
            ))}
          </nav>
          <a className="launch-btn" href="/features"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>

      <main>
        {/* ─── HERO (split: text left / portal image right) ─── */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>ABOUT MITHQAL</span></div>
              <h1 className="hero-title">A Neutral Infrastructure for a <span className="gold-text">More Connected Financial Future.</span></h1>
              <p className="body-text">MITHQAL is a neutral wholesale settlement control plane — built to coordinate institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence through one controlled architecture.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="/features">Explore the Architecture →</a>
                <a className="btn btn-secondary" href="/ecosystem">View the Ecosystem</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" role="img" aria-label="MITHQAL portal" />
          </div>
        </section>

        <hr className="divider" />

        {/* ─── MISSION / VISION (2-col) ─── */}
        <section className="section">
          <div className="two-col" style={{ gap: "60px" }}>
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>OUR MISSION</span></div>
              <h2 className="section-title">Enable Institutional Settlement at <span className="gold-text">Scale.</span></h2>
              <p className="section-sub">MITHQAL coordinates settlement workflows, policy, finality, reconciliation, multi-rail interoperability and audit-ready evidence through one controlled architecture — complementing existing financial infrastructure.</p>
            </div>
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>OUR VISION</span></div>
              <h2 className="section-title">A More Connected <span className="gold-text">Financial Ecosystem.</span></h2>
              <p className="section-sub">A neutral infrastructure that connects institutional participants across jurisdictions — without displacing sovereign currencies, central-bank money, or existing financial institutions.</p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── VALUES (6-item icon grid) ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>OUR VALUES</span></div>
          <h2 className="section-title">What MITHQAL <span className="gold-text">Stands For.</span></h2>
          <div className="values-grid" style={{ marginTop: "48px" }}>
            {VALUES.map((v) => (
              <div className="value-card" key={v.title}>
                <div className="value-icon">{v.icon}</div>
                <div className="value-title">{v.title}</div>
                <div className="value-desc">{v.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── PRINCIPLES (4-col grid) ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>OUR PRINCIPLES</span></div>
          <h2 className="section-title">Built on <span className="gold-text">Principle.</span></h2>
          <div className="principles-grid" style={{ marginTop: "48px" }}>
            {PRINCIPLES.map((p) => (
              <div className="principle-card" key={p.title}>
                <div className="principle-icon">{p.icon}</div>
                <div className="principle-title">{p.title}</div>
                <div className="principle-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── COMMITMENT BANNER ─── */}
        <section className="cta-section">
          <h2 className="cta-title">A Controlled Path to a <span className="gold-text">Connected Financial Future.</span></h2>
          <p className="cta-sub">MITHQAL is not production-authorized. The build is frozen, the MTQ primitive is disabled, and every architectural commitment is documented for institutional review.</p>
          <div className="cta-actions">
            <a className="btn btn-primary" href="/ecosystem">Explore the Ecosystem →</a>
            <a className="btn btn-secondary" href="/roadmap">View the Roadmap</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>MITHQAL — Neutral Institutional Settlement Control Plane</p>
          <p className="footer-state">NOT PRODUCTION-AUTHORIZED · BUILD_MODE = FROZEN · MTQ DISABLED</p>
        </div>
      </footer>
    </>
  );
}
