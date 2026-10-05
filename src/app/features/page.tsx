/**
 * MITHQAL — Features Page (/features)
 * Page 02 — continuation of the approved Home page.
 *
 * Same header, footer, palette, typography, button geometry.
 * Features nav is active.
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */


import "./features.css";
// ─── Shared Header (same as home) ──────────────────────────────────
const MithqalLogo = () => (
  <svg width="39" height="39" viewBox="0 0 39 39" fill="none" aria-hidden="true">
    <path d="M19.5 3L34 11.5v16L19.5 36L5 27.5v-16L19.5 3Z" stroke="#E8B96F" strokeWidth="2" fill="none" />
    <path d="M19.5 10L27 14.5v10L19.5 29L12 24.5v-10L19.5 10Z" fill="#E8B96F" />
    <path d="M19.5 3V10M34 11.5L27 14.5M5 11.5L12 14.5M19.5 36V29" stroke="#E8B96F" strokeWidth="1.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/#ecosystem", "/#roadmap", "/#about"];

// ─── Inline SVG Icons ──────────────────────────────────────────────
const SettlementIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>);
const PolicyIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const FinalityIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>);
const RailsIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const EvidenceIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>);
const ContinuityIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z"/></svg>);

const CAPABILITIES = [
  { num: "01", title: "Settlement Orchestration", desc: "Coordinate institutional workflows from instruction through completion.", icon: <SettlementIcon /> },
  { num: "02", title: "Policy & Authorization", desc: "Institutional policies, risk controls and authorization layers.", icon: <PolicyIcon /> },
  { num: "03", title: "Multi-Rail Interoperability", desc: "Complements existing financial messaging and payment infrastructure.", icon: <RailsIcon /> },
  { num: "04", title: "Reconciliation & Separation", desc: "Three-book architecture ensuring economic separation.", icon: <EvidenceIcon /> },
  { num: "05", title: "Evidence & Continuity", desc: "Immutable evidence, controlled backing and recovery.", icon: <ContinuityIcon /> },
];

const SETTLEMENT_FLOW = ["Request", "Validate", "Authorize", "Finality", "Settle", "Reconcile", "Evidence"];
const POLICY_FLOW = ["Participant", "Policy", "Risk", "Authorization", "Canonical Execution"];
const EVIDENCE_LAYERS = ["Identity", "Provenance", "Eligibility", "Encumbrance", "Availability", "Attestation"];
const FAILURE_FLOW = ["Normal", "Failure Detected", "Pause", "Preserve State", "Reconcile", "Verify", "Controlled Resume"];
const FAILURE_EXAMPLES = ["Bank outage", "Connectivity loss", "Gateway failure", "Key compromise", "Regulator hold", "MITHQAL outage"];
const RAILS = ["SWIFT / ISO 20022", "Domestic Payment Rails", "RTGS", "Bank APIs", "Authorized CBDC Gateways", "Tokenised Bank Money", "Approved Digital-Asset Rails"];

// ─── Page Component ───────────────────────────────────────────────
export default function FeaturesPage() {
  return (
    <>
      {/* ─── HEADER (reused from home) ─── */}
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => (
              <a key={item} className={`nav-link ${item === "Features" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>
            ))}
          </nav>
          <a className="launch-btn" href="/#platform"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>MITHQAL FEATURES</span></div>
              <h1 className="hero-title">The Control Plane Behind <span className="gold-text">Institutional Settlement.</span></h1>
              <p className="body-text">MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail interoperability and audit-ready evidence into one coordinated institutional control plane.</p>
              <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="#architecture">Explore the Architecture →</a>
                <a className="btn btn-secondary" href="/#ecosystem">View the Ecosystem</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" />
          </div>
        </section>

        <hr className="divider" />

        {/* ─── CORE CAPABILITIES ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CORE CAPABILITIES</span></div>
          <h2 className="section-title">Built as One Control System.</h2>
          <p className="section-sub">Each capability operates as part of one coordinated institutional architecture rather than as an isolated product feature.</p>
          <div className="capabilities-grid" style={{ marginTop: "40px" }}>
            {CAPABILITIES.map((cap) => (
              <div className="cap-card" key={cap.num}>
                <span className="cap-num">{cap.num}</span>
                <div className="cap-icon">{cap.icon}</div>
                <div className="cap-title">{cap.title}</div>
                <div className="cap-desc">{cap.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── SETTLEMENT ORCHESTRATION ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>SETTLEMENT ORCHESTRATION</span></div>
          <h2 className="section-title">From Instruction to Finality.</h2>
          <p className="section-sub">Every institutional settlement workflow is designed to remain controlled, traceable and auditable from instruction through final state.</p>
          <div className="flow-row">
            {SETTLEMENT_FLOW.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center" }}>
                <div className="flow-node"><div className="flow-circle">{step.charAt(0)}</div><div className="flow-label">{step}</div></div>
                {i < SETTLEMENT_FLOW.length - 1 && <span className="flow-arrow">→</span>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── POLICY / AUTHORIZATION ─── */}
        <section className="section">
          <div className="two-col">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>POLICY / AUTHORIZATION</span></div>
              <h2 className="section-title">Control Before Execution.</h2>
              <p className="section-sub">MITHQAL separates request, authorization and technical execution so that execution remains conditional on the required controls.</p>
            </div>
            <div className="layers">
              {POLICY_FLOW.map((step, i) => (
                <div key={step} className={`layer ${i === POLICY_FLOW.length - 1 ? "layer-gold" : ""}`}>{step}</div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── FINALITY ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>FINALITY</span></div>
          <h2 className="section-title">Three-Layer Finality Control.</h2>
          <div className="layers" style={{ marginTop: "40px" }}>
            <div className="layer">Technical Finality</div>
            <div className="layer">Applicable Legal / Institutional Finality</div>
            <div className="layer">Required Control Conditions</div>
            <div className="arch-arrow">↓</div>
            <div className="layer layer-gold">Execution Eligibility</div>
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>Execution eligibility is conditional on applicable policy, control and finality requirements.</p>
        </section>

        <hr className="divider" />

        {/* ─── MULTI-RAIL ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>MULTI-RAIL INTEROPERABILITY</span></div>
          <h2 className="section-title">One Control Plane. Multiple Institutional Rails.</h2>
          <div className="rail-center">MITHQAL</div>
          <div className="rails-grid">
            {RAILS.map((rail) => <div className="rail-pill" key={rail}>{rail}</div>)}
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>MITHQAL complements existing financial messaging and payment infrastructure.</p>
          <div className="book-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: "32px" }}>
            <div className="book"><div className="book-label">PRIMARY RAIL</div><div className="book-title">Controlled Routing</div></div>
            <div className="book"><div className="book-label">SECONDARY RAIL</div><div className="book-title">Controlled Routing</div></div>
            <div className="book"><div className="book-label">EMERGENCY RAIL</div><div className="book-title">Safe Halt / Restricted State</div></div>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── RECONCILIATION / THREE BOOKS ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>RECONCILIATION</span></div>
          <h2 className="section-title">Every State Must Reconcile.</h2>
          <div className="book-row">
            <div className="book"><div className="book-label">BOOK A</div><div className="book-title">MITHQAL Corporate</div></div>
            <div className="book"><div className="book-label">BOOK B</div><div className="book-title">Bank MTQ Obligations</div></div>
            <div className="book"><div className="book-label">BOOK C</div><div className="book-title">Participant Position</div></div>
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>Separate. Reconcile. Never economically commingle.</p>
        </section>

        <hr className="divider" />

        {/* ─── PROTECTED BACKING / EVIDENCE ─── */}
        <section className="section" id="architecture">
          <div className="eyebrow"><span className="eyebrow-line" /><span>EVIDENCE</span></div>
          <h2 className="section-title">Evidence Is a Control Layer.</h2>
          <div className="layers" style={{ marginTop: "40px" }}>
            {EVIDENCE_LAYERS.map((layer) => <div key={layer} className="layer">{layer}</div>)}
          </div>
          <div className="formula">Recognized <span style={{ color: "rgba(245,245,244,0.40)" }}>−</span> Encumbered <span style={{ color: "rgba(245,245,244,0.40)" }}>−</span> Allocated <span style={{ color: "rgba(245,245,244,0.40)" }}>=</span> <span className="gold">Available Backing</span></div>
          <p className="section-sub" style={{ marginTop: "20px" }}>Backing is treated as attributable evidence rather than a headline balance. Evidence must not be reused across multiple backing claims.</p>
        </section>

        <hr className="divider" />

        {/* ─── FAILURE / CONTINUITY ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CONTINUITY</span></div>
          <h2 className="section-title">Designed for Failure. Controlled Through Recovery.</h2>
          <div className="layers" style={{ marginTop: "40px" }}>
            {FAILURE_FLOW.map((step, i) => <div key={step} className={`layer ${i === 0 ? "" : i === 1 ? "layer-gold" : ""}`}>{step}</div>)}
          </div>
          <div className="book-row" style={{ marginTop: "32px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {FAILURE_EXAMPLES.slice(0, 3).map((ex) => <div className="book" key={ex}><div className="book-title">{ex}</div></div>)}
          </div>
          <div className="book-row" style={{ marginTop: "12px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {FAILURE_EXAMPLES.slice(3).map((ex) => <div className="book" key={ex}><div className="book-title">{ex}</div></div>)}
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>Controlled recovery preserves idempotency, prevents duplicate settlement and preserves the audit trail.</p>
        </section>

        <hr className="divider" />

        {/* ─── ARCHITECTURE OVERVIEW ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>ARCHITECTURE OVERVIEW</span></div>
          <h2 className="section-title">One Coordinated Architecture.</h2>
          <div className="two-col" style={{ marginTop: "40px" }}>
            <div className="arch-diagram">
              <div className="arch-layer">Participants</div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer gold">MITHQAL Control Plane</div>
              <div style={{ fontSize: "13px", color: "color-mix(in srgb, var(--foreground) 60%, transparent)", padding: "8px 0", textAlign: "center" }}>Policy · Risk · Authorization · Routing · Finality · Reconciliation</div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer">Approved Settlement Rails</div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer">Evidence — Audit · Reconciliation · Attestation · Traceability</div>
            </div>
            <div>
              <p className="section-sub">MITHQAL coordinates institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence through one controlled architecture.</p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ─── MTQ SECTION ─── */}
        <section className="section">
          <div className="mtq-box">
            <div className="mtq-label">OPTIONAL SETTLEMENT PRIMITIVE</div>
            <div className="mtq-title">MTQ</div>
            <p className="mtq-desc">MTQ is designed as a permissioned institutional settlement instrument within the broader MITHQAL architecture. MITHQAL's control-plane architecture must not depend on speculative public-market access to MTQ.</p>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="cta-section">
          <h2 className="cta-title">See the Architecture Behind the Control Plane.</h2>
          <p className="cta-sub">Explore how MITHQAL coordinates institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence through one controlled architecture.</p>
          <div className="cta-actions">
            <a className="btn btn-primary" href="/#ecosystem">Explore the Ecosystem →</a>
            <a className="btn btn-secondary" href="/#roadmap">Read the Roadmap</a>
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
