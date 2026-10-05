/**
 * MITHQAL — Ecosystem Page (/ecosystem)
 * Page 03 — continuation of the approved MITHQAL website.
 *
 * HOME = Vision | FEATURES = Control System | ECOSYSTEM = Institutional Network
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./ecosystem.css";

const MithqalLogo = () => (
  <svg width="39" height="39" viewBox="0 0 39 39" fill="none" aria-hidden="true">
    <path d="M19.5 3L34 11.5v16L19.5 36L5 27.5v-16L19.5 3Z" stroke="#E8B96F" strokeWidth="2" fill="none" />
    <path d="M19.5 10L27 14.5v10L19.5 29L12 24.5v-10L19.5 10Z" fill="#E8B96F" />
    <path d="M19.5 3V10M34 11.5L27 14.5M5 11.5L12 14.5M19.5 36V29" stroke="#E8B96F" strokeWidth="1.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/#roadmap", "/#about"];

const BankIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>);
const GlobeIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>);
const BuildingIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>);
const PeopleIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 7a4 4 0 0 1 0 8"/></svg>);
const ShieldIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const LinkIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>);

const PARTICIPANTS = [
  { icon: <BankIcon />, title: "Banks", desc: "Regulated commercial banks provide the primary institutional connection for settlement, treasury, FX and related bank-side operations." },
  { icon: <GlobeIcon />, title: "Payment Networks", desc: "MITHQAL is designed to complement existing messaging and payment infrastructure and coordinate approved settlement paths." },
  { icon: <BuildingIcon />, title: "Authorized Institutions", desc: "Participation is jurisdiction-controlled and limited to institutions with the applicable legal and regulatory basis." },
  { icon: <PeopleIcon />, title: "Corporate Participants", desc: "Corporate and trade customers access applicable settlement functionality through authorized institutional channels." },
  { icon: <LinkIcon />, title: "Technology Partners", desc: "Technology components provide connectivity, security, identity, infrastructure and interoperability functions." },
  { icon: <ShieldIcon />, title: "Regulatory Interfaces", desc: "MITHQAL supports jurisdiction-specific policy, access-controlled reporting, evidence and supervisory observability." },
];

const RAILS = ["SWIFT / ISO 20022", "RTGS", "Domestic Payment Rails", "Bank APIs", "Authorized CBDC Gateways", "Tokenised Bank Money", "Approved Digital-Asset Rails"];
const HIERARCHY = [
  { level: "01", title: "Central Bank / Sovereign Monetary Authority", desc: "Sovereign monetary authority and regulatory oversight." },
  { level: "02", title: "Regulated Commercial Bank", desc: "Primary bank-side settlement, treasury and operational authority." },
  { level: "03", title: "Approved Regulated Financial Institution", desc: "Authorized institutional participants under bank/regulator oversight." },
  { level: "04", title: "Corporate / Trade Customer", desc: "Access through authorized institutional channels, not direct retail." },
];
const BANK_GATEWAY_FLOW = ["Corporate Customer", "Bank Corporate Portal", "Existing Bank Core", "Bank MTQ Subledger", "MITHQAL Bank Gateway", "MITHQAL Core"];
const SECURITY_LAYERS = ["Mutual TLS", "Signed Messages", "Nonce Protection", "Idempotency", "HSM / Controlled Key Management"];
const ECOSYSTEM_FLOW = ["Participant", "Bank / Institution", "MITHQAL Control Plane", "Approved Rail", "Settlement", "Reconciliation", "Evidence"];

export default function EcosystemPage() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => <a key={item} className={`nav-link ${item === "Ecosystem" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>)}
          </nav>
          <a className="launch-btn" href="/#platform"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>THE MITHQAL ECOSYSTEM</span></div>
              <h1 className="hero-title">Institutional Participants. Connected Through <span className="gold-text">MITHQAL</span>.</h1>
              <p className="body-text">MITHQAL connects participating institutions, banking infrastructure, payment networks and approved settlement rails through one coordinated institutional control plane.</p>
              <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="#participants">Explore Participants →</a>
                <a className="btn btn-secondary" href="/features">View Architecture</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" />
          </div>
        </section>

        <hr className="divider" />

        {/* ─── ECOSYSTEM PARTICIPANTS ─── */}
        <section className="section" id="participants">
          <div className="eyebrow"><span className="eyebrow-line" /><span>THE ECOSYSTEM LAYER</span></div>
          <h2 className="section-title">Trusted Infrastructure. Connected Through One Control Plane.</h2>
          <p className="section-sub">MITHQAL is designed to coordinate institutional participants and existing financial infrastructure without requiring every participant to replace its existing operating systems.</p>
          <div className="participant-grid" style={{ marginTop: "40px" }}>
            {PARTICIPANTS.map((p) => (
              <div className="participant-card" key={p.title}>
                <div className="participant-icon">{p.icon}</div>
                <div className="participant-title">{p.title}</div>
                <div className="participant-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── PARTICIPANT HIERARCHY ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>PARTICIPANT HIERARCHY</span></div>
          <h2 className="section-title">Institutional Participant Model.</h2>
          <div className="hierarchy">
            {HIERARCHY.map((h, i) => (
              <div key={h.level}>
                <div className="hier-level">
                  <span className="hier-num">{h.level}</span>
                  <div><div className="hier-title">{h.title}</div><div className="hier-desc">{h.desc}</div></div>
                </div>
                {i < HIERARCHY.length - 1 && <div className="hier-arrow">↓</div>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── BANK GATEWAY ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>BANK GATEWAY</span></div>
          <h2 className="section-title">Connect Without Replacing the Bank.</h2>
          <div className="two-col" style={{ marginTop: "40px" }}>
            <div>
              <p className="section-sub">MITHQAL is designed to integrate with bank infrastructure as an additive institutional sidecar rather than requiring replacement of the bank's core systems.</p>
              <p className="section-sub" style={{ marginTop: "16px" }}>Existing Bank Systems remain authoritative for applicable: KYC / KYB, AML / sanctions, FX, treasury, accounting, custody / bank-side operations. MITHQAL provides the controlled settlement and interoperability layer.</p>
              <div className="sec-pills">
                {SECURITY_LAYERS.map((s) => <div className="sec-pill" key={s}>{s}</div>)}
              </div>
            </div>
            <div>
              <div className="gateway-flow">
                {BANK_GATEWAY_FLOW.map((step, i) => (
                  <div key={step}>
                    <div className={`gw-node ${step.includes("MITHQAL") ? "gold" : ""}`}>{step}</div>
                    {i < BANK_GATEWAY_FLOW.length - 1 && <div className="gw-arrow">↓</div>}
                  </div>
                ))}
              </div>
              <div className="gw-label">TRANSLATION, NOT TRANSFORMATION</div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── MULTI-RAIL CONNECTIVITY ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>MULTI-RAIL CONNECTIVITY</span></div>
          <h2 className="section-title">One Control Plane. Many Institutional Rails.</h2>
          <div className="rail-center">MITHQAL</div>
          <div className="rails-grid">
            {RAILS.map((rail) => <div className="rail-pill" key={rail}>{rail}</div>)}
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>MITHQAL complements existing financial messaging and payment infrastructure.</p>
        </section>

        <hr className="divider" />

        {/* ─── CONTROLLED ROUTING ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CONTROLLED ROUTING</span></div>
          <h2 className="section-title">Primary. Secondary. Emergency.</h2>
          <p className="section-sub">Routing selects among approved lawful paths based on configured policy, operational conditions and applicable institutional controls.</p>
          <div className="route-grid">
            <div className="route-col"><div className="route-label">PRIMARY RAIL</div><div className="route-title">Preferred Path</div><div className="route-desc">The default approved settlement path under normal operating conditions.</div></div>
            <div className="route-col"><div className="route-label">SECONDARY RAIL</div><div className="route-title">Approved Fallback</div><div className="route-desc">An alternate approved path used when the primary is unavailable.</div></div>
            <div className="route-col"><div className="route-label">EMERGENCY RAIL</div><div className="route-title">Controlled Emergency Path</div><div className="route-desc">A restricted path used only under defined emergency conditions.</div></div>
          </div>
          <div className="safe-box">
            <div className="safe-title">No Compliant Path — Safe Restricted State</div>
            <p className="safe-desc">Where no compliant or approved settlement path exists, MITHQAL is designed to enter a controlled restricted or safe-halt state rather than force execution.</p>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── ECOSYSTEM FLOW ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>ECOSYSTEM FLOW</span></div>
          <h2 className="section-title">From Participant to Evidence.</h2>
          <div className="flow-row">
            {ECOSYSTEM_FLOW.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center" }}>
                <div className="flow-node"><div className="flow-circle">{step.charAt(0)}</div><div className="flow-label">{step}</div></div>
                {i < ECOSYSTEM_FLOW.length - 1 && <span className="flow-arrow">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* ─── CLOSING CTA ─── */}
        <section className="cta-bg">
          <div className="cta-content">
            <div className="eyebrow"><span className="eyebrow-line" /><span>EXPAND WITH CONFIDENCE</span></div>
            <h2 className="section-title">A Connected Ecosystem. A Stronger Settlement Architecture.</h2>
            <p className="section-sub">MITHQAL is designed to evolve through approved participants, additional settlement rails and controlled institutional interoperability while preserving policy, security and operational control.</p>
            <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="/features">Explore the Architecture →</a>
              <a className="btn btn-secondary" href="/#roadmap">View the Roadmap</a>
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
