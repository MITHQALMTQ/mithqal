/**
 * MITHQAL — Ecosystem Page (/ecosystem)
 * Page 03 — the institutional network connected through MITHQAL.
 *
 * Design: split hero (text left / globe+cube image right) +
 * borderless 5-col ecosystem layer + multi-rail connectivity 3D stack +
 * 2-col controlled routing + CTA banner with cityscape background.
 * Matches the approved MITHQAL reference design (image 4).
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./ecosystem.css";

// ─── Shared Header (bare M monogram) ───────────────────────────────
const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    {/* Bare M monogram — no surrounding hexagon */}
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

// ─── Ecosystem layer icons (line-art, gold stroke) ──────────────────
const BankIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>);
const GlobeIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>);
const InstitutionIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>);
const TechIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const RegulatorIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);

const ECOSYSTEM_PARTNERS = [
  { num: "01", title: "Banks", desc: "Regulated commercial banks providing the primary institutional connection for settlement, treasury and FX.", icon: <BankIcon /> },
  { num: "02", title: "Payment Networks", desc: "Coordinated approved settlement paths across existing messaging and payment infrastructure.", icon: <GlobeIcon /> },
  { num: "03", title: "Authorized Institutions", desc: "Jurisdiction-controlled participation limited to institutions with the applicable legal basis.", icon: <InstitutionIcon /> },
  { num: "04", title: "Technology Partners", desc: "Connectivity, security, identity and infrastructure components for institutional interoperability.", icon: <TechIcon /> },
  { num: "05", title: "Regulators", desc: "Jurisdiction-specific policy, access-controlled reporting and supervisory observability.", icon: <RegulatorIcon /> },
];

const RAILS = [
  { code: "01", name: "SWIFT / ISO 20022", desc: "Cross-border messaging and payment instruction standard." },
  { code: "02", name: "Domestic Payment Rails", desc: "Local interbank settlement and clearing networks." },
  { code: "03", name: "RTGS", desc: "Real-time gross settlement at the central bank level." },
  { code: "04", name: "Tokenised Bank Money", desc: "On-chain representation of regulated bank liabilities." },
];

// ─── Routing icons (circular outlined) ────────────────────────────
const TargetIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>);
const SwapIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="M17 20l4-4-4-4"/><path d="M21 16H7"/></svg>);
const ZapIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z"/></svg>);

const ROUTES = [
  { name: "Primary Rail", title: "Preferred Path", desc: "The default approved settlement path under normal operating conditions.", icon: <TargetIcon /> },
  { name: "Secondary Rail", title: "Approved Fallback", desc: "An alternate approved path used when the primary is unavailable.", icon: <SwapIcon /> },
  { name: "Emergency Rail", title: "Controlled Emergency Path", desc: "A restricted path used only under defined emergency conditions.", icon: <ZapIcon /> },
];

// ─── Page Component ───────────────────────────────────────────────
export default function EcosystemPage() {
  return (
    <>
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

      <main>
        {/* ─── HERO (split: text left / globe+cube image right) ─── */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>THE MITHQAL ECOSYSTEM</span></div>
              <h1 className="hero-title">Institutional Participants. Connected Through <span className="gold-text">MITHQAL</span>.</h1>
              <p className="body-text">MITHQAL connects participating institutions, banking infrastructure, payment networks and approved settlement rails through one coordinated institutional control plane.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#ecosystem-layer">Explore Participants →</a>
                <a className="btn btn-secondary" href="/features">View Architecture</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" role="img" aria-label="3D rendering of the MITHQAL ecosystem globe and central cube" />
          </div>
        </section>

        <hr className="divider" />

        {/* ─── ECOSYSTEM LAYER (borderless 5-col row) ─── */}
        <section className="section" id="ecosystem-layer">
          <div className="eyebrow"><span className="eyebrow-line" /><span>THE ECOSYSTEM LAYER</span></div>
          <h2 className="section-title">Trusted Partners. Unified <span className="gold-text">Infrastructure.</span></h2>
          <p className="section-sub">MITHQAL is designed to coordinate institutional participants and existing financial infrastructure without requiring participants to replace their existing operating systems.</p>
          <div className="eco-row" style={{ marginTop: "48px" }}>
            {ECOSYSTEM_PARTNERS.map((p) => (
              <div className="eco-item" key={p.num}>
                <span className="eco-num">{p.num}</span>
                <div className="eco-icon">{p.icon}</div>
                <div className="eco-title">{p.title}</div>
                <div className="eco-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── MULTI-RAIL CONNECTIVITY (re-inserted) ─── */}
        <section className="section" id="multi-rail">
          <div className="eyebrow"><span className="eyebrow-line" /><span>MULTI-RAIL CONNECTIVITY</span></div>
          <h2 className="section-title">One Control Plane. Many Institutional <span className="gold-text">Rails.</span></h2>
          <p className="section-sub">MITHQAL complements existing financial messaging and payment infrastructure — coordinating approved settlement rails through one controlled institutional layer.</p>
          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <a className="btn btn-secondary" href="#multi-rail">View Rail Details →</a>
          </div>
          <div className="rail-section" style={{ marginTop: "48px" }}>
            <div className="rail-3d-stack" aria-hidden="true" role="img" aria-label="3D layered stack of institutional settlement rails">
              <div className="rail-3d-layer layer-1">SWIFT / ISO 20022</div>
              <div className="rail-3d-layer layer-2">DOMESTIC PAYMENT RAILS</div>
              <div className="rail-3d-layer layer-3">RTGS</div>
              <div className="rail-3d-layer layer-4">TOKENISED BANK MONEY</div>
            </div>
            <ul className="rail-list">
              {RAILS.map((r) => (
                <li className="rail-list-item" key={r.code}>
                  <span className="rail-bullet" />
                  <div className="rail-content">
                    <div className="rail-code">{r.code}</div>
                    <div className="rail-name">{r.name}</div>
                    <div className="rail-desc">{r.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── CONTROLLED ROUTING (2-col: text left / rails right) ─── */}
        <section className="section" id="routing">
          <div className="two-col">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>CONTROLLED ROUTING</span></div>
              <h2 className="section-title">Primary. Secondary. <span className="gold-text">Emergency.</span></h2>
              <p className="section-sub">Routing selects among approved lawful paths based on configured policy, operational conditions and applicable institutional controls.</p>
            </div>
            <ul className="route-list">
              {ROUTES.map((r) => (
                <li className="route-list-item" key={r.name}>
                  <div className="route-icon">{r.icon}</div>
                  <div className="route-content">
                    <div className="route-name">{r.name}</div>
                    <div className="route-detail">{r.title}</div>
                    <div className="route-detail-desc">{r.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="safe-box" style={{ marginTop: "32px", maxWidth: "100%" }}>
            <div className="safe-title">No Compliant Path — Safe Restricted State</div>
            <p className="safe-desc">Where no compliant or approved settlement path exists, MITHQAL is designed to enter a controlled restricted or safe-halt state rather than force execution.</p>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── CTA FOOTER BANNER (cityscape background) ─── */}
        <section className="cta-section" aria-label="Expand with confidence">
          <div className="cta-content">
            <div className="eyebrow"><span className="eyebrow-line" /><span>EXPAND WITH CONFIDENCE</span></div>
            <h2 className="cta-title">A Growing Ecosystem. A <span className="gold-text">Stronger Future.</span></h2>
            <p className="cta-sub">MITHQAL is designed to evolve through approved participants, additional settlement rails and controlled institutional interoperability while preserving policy, security and operational control.</p>
            <div className="cta-actions">
              <a className="btn btn-primary" href="/features">Explore the Architecture →</a>
              <a className="btn btn-secondary" href="/roadmap">View the Roadmap</a>
            </div>
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
