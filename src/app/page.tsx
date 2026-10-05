/**
 * MITHQAL — Home / Landing Page (/)
 * Page 01 — the institutional entry point.
 *
 * HOME = Vision | FEATURES = Control System | ECOSYSTEM = Network | ROADMAP = Evolution | ABOUT = Identity
 *
 * Design: dark-mode premium institutional fintech. Split hero (45% text /
 * 55% 3D portal visual) + mission strip + 5-column feature strip + CTA.
 * Matches the approved MITHQAL secondary-page design system
 * (site-header, brand-wordmark, eyebrow, hero-grid, book-row).
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./home.css";

// ─── Shared Header (same as secondary pages) ──────────────────────
const MithqalLogo = () => (
  <svg width="39" height="39" viewBox="0 0 39 39" fill="none" aria-hidden="true">
    <path d="M19.5 3L34 11.5v16L19.5 36L5 27.5v-16L19.5 3Z" stroke="var(--gold)" strokeWidth="2" fill="none" />
    <path d="M19.5 10L27 14.5v10L19.5 29L12 24.5v-10L19.5 10Z" fill="var(--gold)" />
    <path d="M19.5 3V10M34 11.5L27 14.5M5 11.5L12 14.5M19.5 36V29" stroke="var(--gold)" strokeWidth="1.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

// ─── Inline SVG Icons (line-art, gold stroke) ─────────────────────
const NeutralIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const WholesaleIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>);
const FinalityIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>);
const ReserveIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>);
const EvidenceIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>);
const ContinuityIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z"/></svg>);

const PILLARS = [
  { num: "01", title: "Neutral", desc: "A neutral wholesale settlement infrastructure — not a currency, not a CBDC, not a speculative asset.", icon: <NeutralIcon /> },
  { num: "02", title: "Wholesale", desc: "Built for institutional participants and controlled settlement workflows, not retail speculation.", icon: <WholesaleIcon /> },
  { num: "03", title: "Finality", desc: "7/7 finality enforcement — irrevocable settlement commitments with no rollback paths.", icon: <FinalityIcon /> },
  { num: "04", title: "Reserve", desc: "Mathematical 130% backing specification with protected backing cell and 80/18/2 allocation.", icon: <ReserveIcon /> },
  { num: "05", title: "Evidence", desc: "Immutable evidence layer — audit, reconciliation, attestation, traceability by design.", icon: <EvidenceIcon /> },
];

const STRIP = [
  { label: "Neutrality", desc: "Non-sovereign, non-speculative infrastructure." },
  { label: "Wholesale", desc: "Institutional participants, controlled access." },
  { label: "Finality", desc: "7/7 irrevocable settlement commitments." },
  { label: "Reserve", desc: "130% mathematical backing specification." },
  { label: "Evidence", desc: "Immutable audit and attestation by design." },
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

      <main>
        {/* ─── HERO ─── */}
        <section className="section hero-section">
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>MITHQAL — NEUTRAL WHOLESALE SETTLEMENT</span></div>
              <h1 className="hero-title">A Neutral Infrastructure for a <span className="gold-text">Limitless</span> Financial Future.</h1>
              <p className="body-text">MITHQAL coordinates institutional settlement workflows, policy, finality, reconciliation, multi-rail interoperability and audit-ready evidence through one controlled architecture — complementing existing financial messaging and payment infrastructure.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="/features">Explore the Architecture →</a>
                <a className="btn btn-secondary" href="/ecosystem">View the Ecosystem</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" role="img" aria-label="3D rendering of the MITHQAL portal" />
          </div>
        </section>

        <hr className="divider" />

        {/* ─── PILLARS ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>FIVE INSTITUTIONAL PILLARS</span></div>
          <h2 className="section-title">Built on <span className="gold-text">Principle.</span> Designed for <span className="gold-text">Institutions.</span></h2>
          <p className="section-sub">MITHQAL is grounded in five non-negotiable institutional pillars that govern every architectural decision — from the mathematical reserve specification to the finality enforcement model.</p>
          <div className="capabilities-grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            {PILLARS.map((p) => (
              <div className="cap-card" key={p.num}>
                <div className="cap-num">{p.num}</div>
                <div className="cap-icon">{p.icon}</div>
                <div className="cap-title">{p.title}</div>
                <div className="cap-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── COMMITMENT BANNER ─── */}
        <section className="cta-section">
          <div className="cta-inner">
            <div className="eyebrow"><span className="eyebrow-line" /><span>INSTITUTIONAL COMMITMENT</span></div>
            <h2 className="cta-title">A Controlled Path to a <span className="gold-text">Connected Financial Future.</span></h2>
            <p className="cta-sub">MITHQAL is not production-authorized. The build is frozen, the MTQ primitive is disabled, and every architectural commitment is documented for institutional review. Explore the roadmap, the ecosystem, and the evidence layer.</p>
            <div className="cta-actions">
              <a className="btn btn-primary" href="/roadmap">Read the Roadmap →</a>
              <a className="btn btn-secondary" href="/about">About MITHQAL</a>
            </div>
          </div>
        </section>

        {/* ─── FEATURE STRIP ─── */}
        <section className="strip-section" aria-label="MITHQAL institutional principles strip">
          <div className="strip-grid">
            {STRIP.map((s) => (
              <div className="strip-cell" key={s.label}>
                <div className="strip-label">{s.label}</div>
                <div className="strip-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p>MITHQAL — Neutral Institutional Settlement Control Plane</p>
          <p className="footer-state">NOT PRODUCTION-AUTHORIZED · BUILD_MODE = FROZEN · MTQ DISABLED</p>
        </div>
      </footer>
    </>
  );
}
