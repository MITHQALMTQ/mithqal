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
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; }
        body { background: #000611; color: #f5f5f4; font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        a { color: inherit; text-decoration: none; }

        .site-header { position: fixed; inset: 0 0 auto 0; z-index: 50; height: 78px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,6,17,0.68); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .header-inner { height: 100%; max-width: 1380px; margin: 0 auto; padding: 0 6vw; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; }
        .brand { display: inline-flex; align-items: center; gap: 18px; justify-self: start; }
        .brand-wordmark { font-size: 27px; font-weight: 400; letter-spacing: 0.27em; line-height: 1; color: #f5f5f4; }
        .primary-nav { display: flex; align-items: center; justify-content: center; gap: 41px; }
        .nav-link { position: relative; padding: 30px 0 27px; color: rgba(245,245,244,0.86); font-size: 14px; font-weight: 400; transition: color 180ms ease; }
        .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 18px; height: 1px; transform: scaleX(0); transform-origin: center; background: #E8B96F; transition: transform 180ms ease; }
        .nav-link:hover, .nav-link.active { color: #f5f5f4; }
        .nav-link.active::after { transform: scaleX(1); }
        .launch-btn { justify-self: end; min-width: 157px; height: 38px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid rgba(232,185,111,0.9); border-radius: 9999px; font-size: 14px; color: #f5f5f4; transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease; background: transparent; }
        .launch-btn:hover { background: rgba(232,185,111,0.08); box-shadow: 0 0 24px rgba(232,185,111,0.10); transform: translateY(-1px); }

        .section { max-width: 1380px; margin: 0 auto; padding: 100px 6vw; }
        .eyebrow { display: flex; align-items: center; gap: 14px; color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 20px; }
        .eyebrow-line { width: 3px; height: 18px; background: #E8B96F; display: inline-block; }
        h1, h2, h3 { margin: 0; }
        .hero-title { font-size: clamp(44px, 5vw, 72px); font-weight: 400; line-height: 1.0; letter-spacing: -0.043em; color: #f5f5f4; max-width: 700px; }
        .gold-text { color: #F3C879; }
        .body-text { color: rgba(245,245,244,0.80); font-size: 18px; line-height: 1.62; max-width: 560px; margin-top: 28px; }
        .section-title { font-size: clamp(36px, 4vw, 56px); font-weight: 400; line-height: 1.05; letter-spacing: -0.04em; color: #f5f5f4; }
        .section-sub { color: rgba(245,245,244,0.70); font-size: 17px; line-height: 1.6; max-width: 600px; margin-top: 20px; }

        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 46px; padding: 0 29px; border-radius: 9999px; font-size: 14px; cursor: pointer; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; text-decoration: none; }
        .btn-primary { background: #E8B96F; color: #06080c; font-weight: 500; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 42px rgba(232,185,111,0.24); }
        .btn-secondary { border: 1px solid #E8B96F; color: #f5f5f4; background: rgba(0,0,0,0.18); }
        .btn-secondary:hover { transform: translateY(-2px); background: rgba(232,185,111,0.06); }

        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; min-height: calc(100vh - 78px); padding-top: 78px; }
        .hero-visual { position: relative; width: 100%; height: 500px; background: url("/assets/mithqal-features-hero.png") center center / cover no-repeat; border-radius: 0; opacity: 0.92; }

        .capabilities-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); border-radius: 0; background: rgba(7,17,31,0.40); }
        .cap-card { padding: 40px 28px; border-right: 1px solid rgba(255,255,255,0.10); display: flex; flex-direction: column; gap: 16px; }
        .cap-card:last-child { border-right: none; }
        .cap-num { color: #E8B96F; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; }
        .cap-icon { color: #E8B96F; margin-bottom: 4px; }
        .cap-title { font-size: 17px; font-weight: 500; color: #f5f5f4; }
        .cap-desc { font-size: 13px; line-height: 1.55; color: rgba(245,245,244,0.68); }

        .flow-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 32px; }
        .flow-node { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 100px; }
        .flow-circle { width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(232,185,111,0.4); display: grid; place-items: center; color: #E8B96F; font-size: 11px; font-weight: 600; background: rgba(232,185,111,0.04); }
        .flow-label { font-size: 12px; color: rgba(245,245,244,0.70); text-align: center; }
        .flow-arrow { color: rgba(232,185,111,0.40); font-size: 18px; padding: 0 4px; }

        .layers { display: flex; flex-direction: column; gap: 0; margin-top: 32px; max-width: 500px; }
        .layer { padding: 18px 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); color: #f5f5f4; font-size: 14px; font-weight: 500; text-align: center; }
        .layer:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); }
        .layer-gold { border-color: rgba(232,185,111,0.3); background: rgba(232,185,111,0.06); color: #F3C879; }

        .book-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
        .book { border: 1px solid rgba(255,255,255,0.12); padding: 28px; text-align: center; background: rgba(7,17,31,0.30); }
        .book-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 8px; }
        .book-title { color: #f5f5f4; font-size: 16px; font-weight: 500; }

        .rails-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 32px; }
        .rail-pill { border: 1px solid rgba(232,185,111,0.25); border-radius: 9999px; padding: 10px 20px; text-align: center; color: rgba(245,245,244,0.80); font-size: 13px; background: rgba(7,17,31,0.30); }
        .rail-center { text-align: center; margin-top: 28px; font-size: 20px; font-weight: 500; color: #E8B96F; letter-spacing: 0.1em; }

        .formula { text-align: center; margin-top: 32px; font-size: 22px; color: #f5f5f4; font-weight: 400; letter-spacing: 0.02em; }
        .formula .gold { color: #F3C879; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .arch-diagram { border: 1px solid rgba(255,255,255,0.10); padding: 40px; background: rgba(7,17,31,0.30); }
        .arch-layer { text-align: center; padding: 16px; border: 1px solid rgba(255,255,255,0.10); margin-bottom: 8px; font-size: 14px; color: #f5f5f4; background: rgba(0,6,17,0.4); }
        .arch-layer.gold { border-color: rgba(232,185,111,0.3); color: #F3C879; }
        .arch-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 20px; margin: 4px 0; }

        .mtq-box { border: 1px solid rgba(255,255,255,0.10); padding: 40px; text-align: center; background: rgba(7,17,31,0.30); max-width: 700px; margin: 0 auto; }
        .mtq-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 16px; }
        .mtq-title { font-size: 28px; font-weight: 400; color: #f5f5f4; margin-bottom: 20px; }
        .mtq-desc { color: rgba(245,245,244,0.70); font-size: 16px; line-height: 1.6; }

        .cta-section { text-align: center; padding: 120px 6vw; max-width: 1380px; margin: 0 auto; }
        .cta-title { font-size: clamp(32px, 4vw, 52px); font-weight: 400; line-height: 1.1; color: #f5f5f4; letter-spacing: -0.04em; }
        .cta-sub { color: rgba(245,245,244,0.70); font-size: 17px; line-height: 1.6; max-width: 640px; margin: 20px auto 36px; }
        .cta-actions { display: flex; gap: 19px; justify-content: center; flex-wrap: wrap; }

        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0; }

        .site-footer { border-top: 1px solid rgba(255,255,255,0.08); background: #000611; padding: 32px 6vw; text-align: center; color: rgba(245,245,244,0.40); font-size: 12px; }
        .footer-inner { max-width: 1380px; margin: 0 auto; }
        .footer-state { margin-top: 4px; color: rgba(232,185,111,0.40); }

        @media (max-width: 1200px) { .capabilities-grid { grid-template-columns: repeat(3, 1fr); } .cap-card:nth-child(3) { border-right: none; } .rails-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px) { .site-header { height: 70px; } .header-inner { display: flex; justify-content: space-between; } .primary-nav { display: none; } .launch-btn { min-width: auto; height: 36px; padding: 0 15px; } .hero-grid { grid-template-columns: 1fr; } .hero-visual { height: 300px; } .capabilities-grid { grid-template-columns: repeat(2, 1fr); } .cap-card:nth-child(2) { border-right: none; } .two-col { grid-template-columns: 1fr; } .book-row { grid-template-columns: 1fr; } .rails-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px) { .capabilities-grid { grid-template-columns: 1fr; } .cap-card { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.10); } .cap-card:last-child { border-bottom: none; } .launch-btn span:first-child { display: none; } .launch-btn { min-width: 44px; padding: 0 12px; } .flow-row { flex-direction: column; } .flow-arrow { transform: rotate(90deg); } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

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
          <div className="book-row" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: "32px" }}>
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
          <div className="book-row" style={{ marginTop: "32px", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {FAILURE_EXAMPLES.slice(0, 3).map((ex) => <div className="book" key={ex}><div className="book-title">{ex}</div></div>)}
          </div>
          <div className="book-row" style={{ marginTop: "12px", gridTemplateColumns: "repeat(3, 1fr)" }}>
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
              <div style={{ fontSize: "13px", color: "rgba(245,245,244,0.60); padding: 8px 0; text-align: center;" }}>Policy · Risk · Authorization · Routing · Finality · Reconciliation</div>
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
