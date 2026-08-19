// Mithqal public institutional site — content distilled from the v24.2.1
// Consolidated Implementation Specification. This is the credibility-layer
// copy that faces investors, advisors, anchor participants and the public.

/* ---- What Mithqal is (institutional identity) ---- */
export const IDENTITY = {
  name: "Mithqal",
  unit: "MTQ",
  tagline: "A constitutional settlement institution.",
  lede:
    "Mithqal is a neutral, fully-reserved settlement infrastructure for international trade. It is not a token, a platform, a bank, or a DeFi protocol. It is a monetary institution — governed by an immutable Constitution designed to endure beyond any single technology or market cycle.",
  not: [
    "Not a bank, exchange, or payment processor",
    "Not a speculative asset or DeFi protocol",
    "Not dependent on any specific blockchain",
    "Not a replacement for sovereign currencies",
  ],
  is: [
    "A constitutional settlement institution",
    "A fully-reserved settlement unit (MTQ)",
    "Complementary to sovereign currencies & CBDCs",
    "Infrastructure for banks and trade-finance platforms",
  ],
};

/* ---- Six constitutional objectives (Article I) ---- */
export const OBJECTIVES = [
  {
    n: "01",
    t: "Monetary Integrity",
    d: "Stable purchasing power, anchored to a diversified basket of real assets. No discretionary expansion.",
  },
  {
    n: "02",
    t: "Full Redeemability",
    d: "Every MTQ is fully backed and redeemable for proportional reserves at any time. No discretionary approval.",
  },
  {
    n: "03",
    t: "Reserve Solvency",
    d: "Reserves always equal or exceed supply. Held in custody, never lent or rehypothecated. 100%+ by invariant.",
  },
  {
    n: "04",
    t: "Neutral Cross-border Settlement",
    d: "No political, economic or jurisdictional alignment. A Chinese exporter settles with the same finality as a US exporter.",
  },
  {
    n: "05",
    t: "Institutional Trust",
    d: "Earned through verifiable operations — daily proofs of reserves, quarterly independent audits. Never declared.",
  },
  {
    n: "06",
    t: "Constitutional Stability",
    d: "The framework endures beyond technology, markets and founders. Amendable only through supermajority.",
  },
];

/* ---- The five constitutional invariants (Priority 1, Article III) ---- */
export const INVARIANTS_PUBLIC = [
  {
    t: "100%+ Reserve Mandate",
    d: "Reserve value must always equal or exceed circulating supply. Minting is permitted only upon verified deposit of equivalent value.",
  },
  {
    t: "No Discretionary Minting",
    d: "MTQ is never minted for operational funding, staff compensation, or any purpose other than verified reserve deposits.",
  },
  {
    t: "No Lending of Reserves",
    d: "Reserves are held in custody. They are never lent, rehypothecated, or used to generate yield.",
  },
  {
    t: "No Commingling",
    d: "Settlement reserves are segregated from all operational, commercial and yield-bearing activities — by constitutional invariant.",
  },
  {
    t: "No Redemption Suspension",
    d: "Redemption is never suspended or subject to discretionary approval. Dynamic congestion fees may apply, but the right to redeem is absolute.",
  },
];

/* ---- Anti-platform clause (Article V) — constitutionally constrained ---- */
export const ANTI_PLATFORM = {
  intro:
    "The Institution is a constitutional settlement institution, not a commercial platform. The anti-platform provisions are constitutionally constrained — they cannot be amended, interpreted away, or eroded through incremental expansion.",
  prohibited: [
    "Lending, credit & underwriting",
    "Exchange, brokerage & market-making",
    "Asset & wealth management",
    "Custody of participant funds",
    "Decentralized finance protocols",
    "Trade-matching & logistics platforms",
    "Dispute resolution & arbitration",
  ],
  permitted: [
    "Issue & redeem settlement units",
    "Maintain reserves in custody",
    "Govern the institution",
    "Publish transparency data",
    "Support interoperability (ISO 20022)",
    "Maintain technical infrastructure",
    "Comply with applicable law",
  ],
};

/* ---- The Settlement Unit (MTQ) ---- */
export const MTQ_SPEC = [
  { k: "Standard", v: "ERC-20 with extensions (Permit, Burnable)" },
  { k: "Decimals", v: "18 (micro-settlement precision)" },
  { k: "Total Supply", v: "Dynamic — mint/burn on reserve deposits" },
  { k: "Transferability", v: "Permissionless" },
  { k: "Pausability", v: "Yes (emergency only)" },
  { k: "Upgradeability", v: "UUPS proxy" },
  { k: "Backing", v: "100%+ diversified eligible reserves (target; testnet simulator currently displays simulator values)" },
  { k: "NAV", v: "Weighted basket, bounded momentum, mean reversion" },
];

export const FEES = [
  { type: "Minting", rate: "0.01–0.10%", method: "Deducted from minted amount", purpose: "Operational costs" },
  { type: "Redemption", rate: "0.01–0.10%", method: "Deducted from claim", purpose: "Operational costs" },
  { type: "Transfer", rate: "0.00–0.05%", method: "Deducted from transfer", purpose: "Network maintenance" },
  { type: "Custody", rate: "0.05–0.20% / yr", method: "Deducted from reserves", purpose: "Custody costs" },
];

/* ---- Reserves ---- */
export const RESERVE_TIERS = [
  {
    tier: "Tier 1",
    name: "Primary",
    weight: "≥ 60%",
    assets: "Cash at central banks, T-bills, central-bank reserves",
    quality: "Sovereign-grade, instantaneous liquidity",
  },
  {
    tier: "Tier 2",
    name: "Secondary",
    weight: "20–35%",
    assets: "G7 sovereign bonds, supranational instruments",
    quality: "High-grade, daily liquidity",
  },
  {
    tier: "Tier 3",
    name: "Tertiary",
    weight: "0–15%",
    assets: "Gold (allocated), high-grade money-market instruments",
    quality: "Diversification & collateral",
  },
  {
    tier: "Tier 4",
    name: "Strategic",
    weight: "0–10%",
    assets: "Physical gold, strategic reserve assets",
    quality: "Long-term preservation",
  },
];

export const TRANSPARENCY = [
  { cadence: "Daily", item: "Cryptographic Proof of Reserves", desc: "Privacy-preserving solvency proof" },
  { cadence: "Daily", item: "Reserve Summary", desc: "Aggregate reserve data" },
  { cadence: "Quarterly", item: "Independent Audit", desc: "Full reserve verification" },
  { cadence: "Annual", item: "Comprehensive Report", desc: "Complete reserve review" },
  { cadence: "5 years", item: "Independent Review", desc: "9-expert panel constitutional review" },
];

/* ---- Governance ---- */
export const GOVERNANCE = [
  {
    t: "The Council",
    d: "The principal governing body. Makes policy decisions within constitutional constraints. Appoints committees and officers.",
  },
  {
    t: "Risk Committee",
    d: "Volatility thresholds, liquidity thresholds, concentration limits, stress tests.",
  },
  {
    t: "Technical Committee",
    d: "Smart contracts, cryptography, post-quantum migration (Falcon-512), formal verification.",
  },
  {
    t: "Audit Committee",
    d: "Oversees independent audits and proofs of reserves.",
  },
  {
    t: "Compliance Committee",
    d: "Sanctions (OFAC, UN, EU, UK, MAS, UAE), KYC/KYB, reporting, monitoring.",
  },
  {
    t: "Independent Review Panel",
    d: "9 independent experts (3 economists, 3 technologists, 3 lawyers). Convened every 5 years. Assesses the entire institution.",
  },
];

export const GOVERNANCE_RULES = [
  { k: "Founder holdings cap", v: "≤ 20% of circulating supply" },
  { k: "Founder voting rights", v: "Limited / constrained" },
  { k: "Constitutional amendments", v: "Supermajority only; invariants never" },
  { k: "Anti-platform clause", v: "Constitutionally constrained" },
  { k: "Neutrality", v: "Absolute, except legal compliance" },
];

/* ---- Institutional Lifecycle (Article XIV) ---- */
export const LIFECYCLE = [
  { stage: "Formation", gov: "Formation Committee", d: "Foundation registered, Council appointed, reserves deposited, custody established.", status: "current" },
  { stage: "Operation", gov: "Normal governance", d: "Ordinary settlement operations, reserve management, governance continues.", status: "next" },
  { stage: "Expansion", gov: "Normal governance", d: "Grow participants, integrate CBDCs (Digital Dirham → mBridge → Digital Euro/Yuan/Dollar).", status: "future" },
  { stage: "Emergency", gov: "Limited governance", d: "Preserve the Institution under stress — emergency custodian, time-limited.", status: "future" },
  { stage: "Resolution", gov: "Resolution Committee", d: "Orderly wind-down if ever required — holder protection first.", status: "future" },
  { stage: "Succession", gov: "Governed transition", d: "The Institution persists beyond founders and personnel.", status: "future" },
];

/* ---- Eligibility (who Mithqal serves) ---- */
export const ELIGIBILITY = [
  { who: "Commercial banks", why: "Integrate MTQ for neutral, fully-reserved cross-border settlement." },
  { who: "Trade-finance platforms", why: "Settle invoices with finality, neutrality and verifiable backing." },
  { who: "Corporate treasuries", why: "Neutral reserve asset for international trade hedging." },
  { who: "Payment institutions", why: "Bridge to existing rails via ISO 20022 messaging." },
  { who: "Sovereign & development finance", why: "Neutral settlement layer complementary to CBDCs." },
];

export const INTEGRATION = [
  { step: "01", t: "Eligibility", d: "Meet objective institutional criteria (KYB, sanctions, financial standing)." },
  { step: "02", t: "Onboarding", d: "KYC/KYB, UBO identification, enhanced due diligence, sanctions screening." },
  { step: "03", t: "Custody & reserves", d: "Establish segregated reserve custody with a qualified custodian." },
  { step: "04", t: "Mint", d: "Deposit eligible reserves → verified → MTQ minted at NAV." },
  { step: "05", t: "Settle", d: "Transfer MTQ permissionlessly; settle via ISO 20022 messaging." },
  { step: "06", t: "Redeem", d: "Burn MTQ → receive proportional reserves at NAV, any time." },
];

/* ---- Build-in-public status ---- */
export const STATUS_ITEMS = [
  { label: "Constitution", value: "v25.0", state: "Frozen — FINAL INSTITUTIONAL EDITION", tone: "done" },
  { label: "Specification", value: "1.46M chars", state: "Public on GitHub", tone: "done" },
  { label: "GitHub repository", value: "Live", state: "Open source", tone: "done" },
  { label: "Entity A — Settlement Institution", value: "JOZOUR LLC (NJ)", state: "Active — formation phase", tone: "done" },
  { label: "Entity B — Technology Company", value: "Not yet formed", state: "Planned Phase 1", tone: "next" },
  { label: "Article VIII — Yield Separation", value: "Absolute", state: "Constitutional invariant", tone: "done" },
  { label: "FinCEN MSB registration (Entity A)", value: "In preparation; not yet filed", state: "pending", tone: "next" },
  { label: "Testnet (MTQ)", value: "Live simulator", state: "Phase 0", tone: "done" },
  { label: "Qualified custody RFP", value: "Targeting Q4 2026", state: "Phase 1", tone: "next" },
  { label: "Independent audit", value: "Scheduled Q1 2027", state: "Phase 1", tone: "next" },
  { label: "Mainnet launch", value: "Planned Q3 2027", state: "Phase 3", tone: "future" },
];

/* ---- Legal & Regulatory Status — Two-Entity Architecture ----
 * Per Constitution Article VIII (Yield Separation), the Mithqal ecosystem
 * comprises TWO legally separate entities:
 *
 *   Entity A — The Mithqal Institution (non-profit, constitutional settlement)
 *     • Operates the settlement function: mint / redeem MTQ against verified reserves
 *     • Governed by the Constitution v23 and the Monetary Council
 *     • Non-profit: purpose is settlement integrity, not yield generation
 *     • Reserves held in segregated custody (Custody Account A)
 *     • Currently operating through JOZOUR LLC during the formation phase
 *     • Will be re-domiciled as a Foundation (Entity A) in Phase 1
 *
 *   Entity B — Technology Company (for-profit, technology operator)
 *     • Separate regulated legal investment vehicle
 *     • Accepts fiat subscriptions only (never MTQ)
 *     • Invests in sukuk / asset-backed income instruments
 *     • Never holds, lends, stakes, or uses MTQ as collateral
 *     • Never commingles with Institution reserves
 *     • Has its own board, management, governance, auditors
 *     • Licensed and supervised by competent securities authorities
 *     • To be formed in Phase 1 (separate jurisdiction, separate license)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INSTITUTIONAL PRINCIPLES — READ BEFORE EDITING
 * ─────────────────────────────────────────────────────────────────────────
 * Entity A's "targetStructure" (Foundation) and Entity B are PLANNED — they
 * do not yet exist. The current operating entity is JOZOUR LLC (NJ).
 *
 *   • JOZOUR LLC is the current operating company — NOT the Institution, NOT
 *     the reserve owner, NOT the reserve custodian, NOT the constitutional
 *     authority.
 *   • The Foundation, Holding Company, Operations Ltd., and Markets Ltd.
 *     (per Chapter XX) do NOT yet exist. They are the TARGET institutional
 *     architecture.
 *   • Reserve assets are held in segregated custody under the Constitutional
 *     Reserve Framework through approved custodian institutions for the
 *     exclusive benefit of the MITHQAL reserve system. They are never
 *     operating assets and never corporate assets of JOZOUR LLC or any
 *     future operating entity.
 *
 * See `docs/legal/institutional-principles.md` for the canonical wording.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Source of truth: NJ Certificate of Formation (filed 22 Oct 2019, ID 0600463904)
 * and IRS CP 575 G notice (EIN 84-3470275, dated 24 Oct 2019).
 * Documents archived under /upload/Jozour USA_Part1.pdf (operator custody).
 */
export const LEGAL_STATUS = {
  // Canonical disclaimer — surfaced on all institutional surfaces.
  // Wording is fixed by docs/legal/institutional-principles.md (Principle 4
  // and the canonical disclaimer paragraph). Do NOT paraphrase.
  canonicalDisclaimer:
    "MITHQAL is currently operated by JOZOUR LLC during the institutional development phase. The constitutional architecture described throughout this documentation represents the intended institutional destination of the project. Planned entities do not yet exist and are not currently operating.",
  // Canonical reserve-independence wording (Principle 4).
  reserveIndependence:
    "Reserve assets are held in segregated custody under the Constitutional Reserve Framework through approved custodian institutions for the exclusive benefit of the MITHQAL reserve system. They are never operating assets and never corporate assets of JOZOUR LLC or any future operating entity.",
  // Entity A — The Institution (non-profit settlement)
  entityA: {
    name: "The Mithqal Institution",
    type: "Non-profit constitutional settlement institution",
    role: "Operates the settlement function (mint/redeem MTQ against verified reserves). Governed by the Constitution v25.0 and the Monetary Council. Non-profit — purpose is settlement integrity, not yield.",
    currentOperator: "JOZOUR LLC (formation-phase operator)",
    targetStructure: "Foundation (Entity A) — to be registered in a reputable jurisdiction in Phase 1",
    ein: "84-3470275",
    njRegistration: "Filed 22 Oct 2019 (ID 0600463904)",
    registeredAgent: "Edward M Lombard — 116 Mallory Ave, Jersey City, NJ 07304",
    soleMember: "Mohamed S. Eltonsy",
    dissolution: "Perpetual",
    irsNotice: "CP 575 G (24 Oct 2019)",
    nameControl: "JOZO",
    custodyAccount: "Custody Account A — segregated reserve custody (to be established with a qualified custodian in Phase 1)",
  },
  // Entity B — Technology Company (for-profit technology operator)
  entityB: {
    name: "Mithqal Technology Company",
    type: "For-profit regulated investment fund (separate legal entity)",
    role: "Accepts fiat subscriptions only, invests in sukuk / asset-backed income. Never holds, lends, stakes, or uses MTQ as collateral. Never commingles with Institution reserves.",
    targetStructure: "Technology company (for-profit) or similar entity — to be licensed and supervised by competent securities authorities in Phase 1",
    status: "Not yet formed — targeted for Phase 1",
    governance: "Own board, own management, own auditors — independent of the Monetary Council",
    custodyAccount: "Custody Account B — separate from Institution reserves",
    mtqExposure: "Zero — The Technology Company never holds, lends, or accepts MTQ",
  },
  // Constitutional + regulatory status (applies to Entity A)
  fincenMSB: "FinCEN Form 107 — In preparation (Entity A)",
  njMTL: "In progress (Entity A)",
  constitutionalVersion: "v25.0 — FINAL INSTITUTIONAL EDITION (non-custodial, bank-funded, gold-anchored)",
  constitutionalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  // The two-entity separation is constitutionally mandated by Article VIII
  articleVIII: "Yield Separation — the settlement function and yield generation are absolutely separate. No assets, liabilities, or risks cross between Entity A and Entity B.",
  items: [
    // Entity A items
    { label: "Entity A — Settlement Institution", value: "The Mithqal Institution (non-profit)", status: "Formation phase" },
    { label: "Entity A — Current Operator", value: "JOZOUR LLC (NJ LLC)", status: "Active" },
    { label: "Entity A — Jurisdiction", value: "New Jersey, USA", status: "Active" },
    { label: "Entity A — NJ Filing", value: "0600463904 (22 Oct 2019)", status: "Filed" },
    { label: "Entity A — IRS EIN", value: "84-3470275", status: "Assigned" },
    { label: "Entity A — IRS Notice", value: "CP 575 G (24 Oct 2019)", status: "On file" },
    { label: "Entity A — Registered Agent", value: "Edward M Lombard, NJ", status: "Active" },
    { label: "Entity A — Sole Member", value: "Mohamed S. Eltonsy", status: "On file" },
    { label: "Entity A — Target Structure", value: "Foundation (re-domicile in Phase 1)", status: "Planned" },
    // Entity B items
    { label: "Entity B — Technology Company", value: "Mithqal Technology Company (for-profit)", status: "Not yet formed" },
    { label: "Entity B — Target Structure", value: "Technology company (for-profit)", status: "Planned Phase 1" },
    { label: "Entity B — MTQ Exposure", value: "Zero (never holds/lends/accepts MTQ)", status: "Constitutional invariant" },
    { label: "Entity B — Custody", value: "Custody Account B (separate from A)", status: "Planned" },
    // Regulatory
    { label: "FinCEN MSB Registration", value: "FinCEN Form 107 (MSB) — preparation in progress; not yet filed", status: "In preparation" },
    { label: "NJ Money Transmitter License", value: "Application pending", status: "In progress" },
    { label: "Constitutional Version", value: "v25.0 (FINAL INSTITUTIONAL EDITION)", status: "Frozen" },
    { label: "Constitutional Status", value: "APPROVED CANDIDATE FOR CONTROLLED TESTING", status: "NOT PRODUCTION-AUTHORIZED" },
    { label: "Article VIII — Yield Separation", value: "Absolute separation between Entity A and Entity B", status: "Constitutional invariant" },
  ],
};

/* ---- Layer 0 — Institutional Philosophy ---- */
export const LAYER_ZERO = {
  title: "Layer 0 — The Institutional Foundation",
  intro:
    "Every constitutional provision derives its authority from Layer 0, which establishes the permanent identity, trust doctrine, and constitutional interpretation rules of the Institution.",
  pillars: [
    {
      title: "Institutional Identity",
      desc: "A permanent, neutral, fully-reserved monetary institution — not a technology product, not a platform, not a token project.",
    },
    {
      title: "Trust Doctrine",
      desc: "Trust is earned through verifiable operations, never declared. Every claim is backed by independently auditable evidence.",
    },
    {
      title: "Evidence Doctrine",
      desc: "Every claim is supported by independently verifiable evidence. No assertion rests on institutional declaration alone.",
    },
    {
      title: "Human Governance Doctrine",
      desc: "Governance is exercised by qualified human professionals — not algorithms, not token votes, not automated systems.",
    },
    {
      title: "Longevity Doctrine",
      desc: "Designed for multi-decade endurance. The Institution is designed to endure beyond any single technology or market cycle.",
    },
  ],
};

/* ---- Formation Phase 0 Timeline ---- */
export const PHASE_ZERO_TIMELINE = [
  { milestone: "Constitution v25.0 (FINAL INSTITUTIONAL EDITION)", status: "done", date: "August 2026" },
  { milestone: "NJ LLC formation (JOZOUR LLC)", status: "done", date: "22 Oct 2019 (ID 0600463904)" },
  { milestone: "IRS EIN assigned", status: "done", date: "24 Oct 2019 (84-3470275)" },
  { milestone: "Testnet deployment (Monad Testnet, 9/9 on-chain tests PASS)", status: "done", date: "Live" },
  { milestone: "Monetary Engine v25.0 (8-prompt institutional closure + MBG + non-custodial reserve + bank-funded issuance + final integrated architecture)", status: "done", date: "August 2026" },
  { milestone: "Institutional due-diligence audit (15-panel simulation)", status: "done", date: "29 July 2026" },
  { milestone: "Self-assessment corrected (honest scoring 7.5/10)", status: "done", date: "29 July 2026" },
  { milestone: "Legal pages (privacy, terms, risk-disclosure, cookies)", status: "done", date: "29 July 2026" },
  { milestone: "Anti-platform clause enforced on-chain (selector checks)", status: "done", date: "29 July 2026" },
  { milestone: "attestReserves drift guard + rate limit (±10% / 1hr)", status: "pending", date: "Solidity guards implemented; TS wrapper + API route pending" },
  { milestone: "PII consent gate on Brain compliance endpoint", status: "done", date: "29 July 2026" },
  { milestone: "SECURITY.md rewritten (honest [CURRENT]/[PLANNED]/[TARGETED] labelling)", status: "done", date: "29 July 2026" },
  { milestone: "Formation team — being assembled (advisors + Council nominees)", status: "in-progress", date: "Q3 2026" },
  { milestone: "FinCEN Form 107 (MSB registration)", status: "pending", date: "Target Q3 2026" },
  { milestone: "Qualified custody arrangement", status: "in-progress", date: "Q4 2026" },
  { milestone: "Independent third-party security audit", status: "scheduled", date: "Q1 2027" },
  { milestone: "Foundry fuzz tests + Certora formal verification (CI)", status: "scheduled", date: "Q1 2027" },
  { milestone: "SOC 2 Type II / ISO 27001 pursuit", status: "planned", date: "2027" },
  { milestone: "Mainnet launch", status: "planned", date: "Q3 2027" },
];

export const FORMATION_ROLES = [
  { v: "investor", label: "Investor (pre-seed / seed)" },
  { v: "advisor", label: "Advisor (ex-central-bank, custody, trade-finance, compliance)" },
  { v: "anchor", label: "Anchor participant (bank / trade-finance platform)" },
  { v: "council-nominee", label: "Council nominee" },
  { v: "partner", label: "Integration / technology partner" },
  { v: "other", label: "Other" },
];
