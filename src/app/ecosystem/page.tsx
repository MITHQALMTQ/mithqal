/**
 * MITHQAL — Ecosystem Page (/ecosystem)
 * Page 03 — continuation of the approved MITHQAL website.
 *
 * HOME = Vision | FEATURES = Control System | ECOSYSTEM = Institutional Network
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

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
        .hero-visual { position: relative; width: 100%; min-height: 500px; background: url("/assets/mithqal-ecosystem-hero.png") center center / cover no-repeat; opacity: 0.92; border-radius: 0; }

        .participant-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,17,31,0.40); }
        .participant-card { padding: 36px 28px; border-right: 1px solid rgba(255,255,255,0.10); border-bottom: 1px solid rgba(255,255,255,0.10); }
        .participant-card:nth-child(3n) { border-right: none; }
        .participant-card:nth-last-child(-n+2) { border-bottom: none; }
        .participant-card:last-child { border-right: none; }
        .participant-icon { color: #E8B96F; margin-bottom: 16px; }
        .participant-title { font-size: 18px; font-weight: 500; color: #f5f5f4; margin-bottom: 8px; }
        .participant-desc { font-size: 13px; line-height: 1.55; color: rgba(245,245,244,0.68); }

        .hierarchy { display: flex; flex-direction: column; gap: 0; max-width: 700px; margin-top: 40px; }
        .hier-level { display: grid; grid-template-columns: 60px 1fr; gap: 24px; padding: 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); }
        .hier-level:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); }
        .hier-num { color: #E8B96F; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; }
        .hier-title { color: #f5f5f4; font-size: 16px; font-weight: 500; margin-bottom: 4px; }
        .hier-desc { color: rgba(245,245,244,0.60); font-size: 13px; line-height: 1.5; }
        .hier-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 18px; padding: 4px 0; }

        .gateway-flow { display: flex; flex-direction: column; gap: 0; max-width: 500px; }
        .gw-node { padding: 16px 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); text-align: center; color: #f5f5f4; font-size: 14px; font-weight: 500; }
        .gw-node:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); }
        .gw-node.gold { border-color: rgba(232,185,111,0.3); background: rgba(232,185,111,0.06); color: #F3C879; }
        .gw-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 18px; padding: 2px 0; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .gw-label { color: #E8B96F; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; margin-top: 8px; }

        .sec-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
        .sec-pill { border: 1px solid rgba(232,185,111,0.25); border-radius: 9999px; padding: 8px 16px; color: rgba(245,245,244,0.80); font-size: 12px; background: rgba(7,17,31,0.30); }

        .rails-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 32px; }
        .rail-pill { border: 1px solid rgba(232,185,111,0.25); border-radius: 9999px; padding: 10px 20px; text-align: center; color: rgba(245,245,244,0.80); font-size: 13px; background: rgba(7,17,31,0.30); }
        .rail-center { text-align: center; margin-top: 28px; font-size: 20px; font-weight: 500; color: #E8B96F; letter-spacing: 0.1em; }

        .route-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
        .route-col { border: 1px solid rgba(255,255,255,0.12); padding: 28px; background: rgba(7,17,31,0.30); }
        .route-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 8px; }
        .route-title { color: #f5f5f4; font-size: 18px; font-weight: 500; margin-bottom: 8px; }
        .route-desc { color: rgba(245,245,244,0.60); font-size: 13px; line-height: 1.5; }

        .safe-box { border: 1px solid rgba(232,185,111,0.3); padding: 28px; background: rgba(232,185,111,0.04); margin-top: 32px; max-width: 700px; }
        .safe-title { color: #F3C879; font-size: 18px; font-weight: 500; margin-bottom: 8px; }
        .safe-desc { color: rgba(245,245,244,0.70); font-size: 14px; line-height: 1.6; }

        .flow-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 32px; }
        .flow-node { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 90px; }
        .flow-circle { width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(232,185,111,0.35); display: grid; place-items: center; color: #E8B96F; font-size: 10px; font-weight: 600; background: rgba(232,185,111,0.04); }
        .flow-label { font-size: 11px; color: rgba(245,245,244,0.65); text-align: center; }
        .flow-arrow { color: rgba(232,185,111,0.40); font-size: 16px; padding: 0 2px; }

        .cta-bg { position: relative; min-height: 500px; background: url("/assets/mithqal-ecosystem-cta.png") center center / cover no-repeat; display: flex; align-items: center; }
        .cta-bg::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,6,17,0.85) 0%, rgba(0,6,17,0.50) 50%, rgba(0,6,17,0.30) 100%); }
        .cta-content { position: relative; z-index: 1; max-width: 1380px; margin: 0 auto; padding: 80px 6vw; width: 100%; }

        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0; }
        .site-footer { border-top: 1px solid rgba(255,255,255,0.08); background: #000611; padding: 32px 6vw; text-align: center; color: rgba(245,245,244,0.40); font-size: 12px; }
        .footer-inner { max-width: 1380px; margin: 0 auto; }
        .footer-state { margin-top: 4px; color: rgba(232,185,111,0.40); }

        @media (max-width: 1200px) { .participant-grid { grid-template-columns: repeat(2, 1fr); } .participant-card:nth-child(3n) { border-right: 1px solid rgba(255,255,255,0.10); } .participant-card:nth-child(2n) { border-right: none; } .rails-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px) { .site-header { height: 70px; } .header-inner { display: flex; justify-content: space-between; } .primary-nav { display: none; } .launch-btn { min-width: auto; height: 36px; padding: 0 15px; } .hero-grid { grid-template-columns: 1fr; } .hero-visual { min-height: 300px; } .participant-grid { grid-template-columns: 1fr; } .participant-card { border-right: none !important; } .two-col { grid-template-columns: 1fr; } .route-grid { grid-template-columns: 1fr; } .rails-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px) { .launch-btn span:first-child { display: none; } .launch-btn { min-width: 44px; padding: 0 12px; } .flow-row { flex-direction: column; } .flow-arrow { transform: rotate(90deg); } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

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
