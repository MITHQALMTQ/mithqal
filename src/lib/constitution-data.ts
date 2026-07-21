// Mithqal Constitution v18 FINAL — structured, citable reference.
// The blueprint is a 4-layer architecture (Institutional / Monetary /
// Governance & Policy / Technical / Operations) with ~47 articles.
// This module structures the full table of contents plus detailed
// provisions for the core Layer 1 articles (the constitutional identity).

export interface Section {
  /** short heading within an article */
  h: string;
  /** body text */
  p: string;
}

export interface Article {
  /** stable slug, e.g. "l1-art1" */
  id: string;
  /** display number, e.g. "Article I" */
  number: string;
  title: string;
  /** one-line purpose */
  purpose: string;
  /** detailed sections (optional — index articles omit this) */
  sections?: Section[];
  /** a permanently-frozen flag for invariants */
  frozen?: boolean;
}

export interface Layer {
  id: string;
  /** "Layer 1" etc. */
  label: string;
  name: string;
  blurb: string;
  articles: Article[];
}

/* ================================================================== */
/* LAYER 1 — INSTITUTIONAL CONSTITUTION                               */
/* ================================================================== */

const LAYER_1: Layer = {
  id: "layer-1",
  label: "Layer 1",
  name: "Institutional Constitution",
  blurb:
    "The identity, objectives, principles, hierarchy, neutrality, anti-platform provisions, adaptability, failure, yield separation, succession, emergency, regulatory adaptability, amendment philosophy, interpretation, lifecycle, success metrics, language standards and independent review of the Institution.",
  articles: [
    {
      id: "l1-art1",
      number: "Article I",
      title: "Constitutional Objectives",
      purpose:
        "The Institution exists to preserve six objectives. They are not ranked; each is essential.",
      sections: [
        {
          h: "01 · Monetary Integrity",
          p: "Stable purchasing power, anchored to a diversified basket of real assets. No discretionary expansion. A trade invoice denominated in MTQ today will purchase the same real basket of goods in a decade, within normal market bounds.",
        },
        {
          h: "02 · Full Redeemability",
          p: "Every MTQ is fully backed and redeemable for proportional reserves at any time. Redemption is not subject to discretionary approval and is never suspended except in constitutional emergency.",
        },
        {
          h: "03 · Reserve Solvency",
          p: "Reserves always equal or exceed supply. Reserves are held in custody, never lent or rehypothecated. Minting is permitted only upon verified deposit of equivalent value. The reserve ratio never falls below 100%.",
        },
        {
          h: "04 · Neutral Cross-border Settlement",
          p: "No political, economic or jurisdictional alignment. A settlement between a Chinese exporter and a Brazilian importer settles with the same finality, cost and speed as one between a US exporter and a German importer.",
        },
        {
          h: "05 · Institutional Trust",
          p: "Trust is earned through verifiable operations — daily cryptographic proofs of reserves, quarterly independent audits, real-time NAV — never declared, asserted or marketed.",
        },
        {
          h: "06 · Constitutional Stability",
          p: "The framework endures beyond technology, markets and founders. The Constitution does not reference specific technologies or individuals, and is amendable only through supermajority processes.",
        },
      ],
    },
    {
      id: "l1-art2",
      number: "Article II",
      title: "Constitutional Principles",
      purpose:
        "Where ambiguity exists, interpretation is guided by ten principles. No decision that clearly violates any principle is permitted.",
      sections: [
        { h: "Prudence", p: "Caution over speculation. Conservative assumptions, stress testing, preservation of capital over pursuit of returns. When in doubt, the prudent course is chosen." },
        { h: "Neutrality", p: "No political, economic or jurisdictional preference. Demonstrated through verifiable, non-discretionary processes — not by declaration." },
        { h: "Transparency", p: "Everything auditable, nothing hidden. All material information published; all operations verifiable; all decisions documented; all assumptions made explicit." },
        { h: "Proportionality", p: "Responses match risks. Resources allocated to the most significant risks; escalation calibrated to severity." },
        { h: "Simplicity", p: "Complexity is a liability. Clear provisions, straightforward operations; complexity justified only when necessary." },
        { h: "Auditability", p: "Every claim verifiable. No claim rests solely on institutional assertion — independent verification is the standard." },
        { h: "Resilience", p: "Survival through stress. Failure is assumed, not avoided; recovery is designed, not improvised. Redundancy throughout critical systems." },
        { h: "Interoperability", p: "Compatibility with existing systems. ISO 20022 messaging, existing custody and settlement standards — minimising adoption cost." },
        { h: "Technological Neutrality", p: "Technology serves the Institution; the Institution does not serve technology. If DLT evolves, the Institution adapts. Technology is implementation; the Institution is identity." },
        { h: "Legal Adaptability", p: "Compliance without invariant compromise. The Institution adapts operations to law while preserving constitutional principles — never violating invariants for regulatory convenience." },
      ],
    },
    {
      id: "l1-art3",
      number: "Article III",
      title: "Decision Hierarchy",
      purpose:
        "When objectives conflict, seven priorities govern. No lower-priority objective may override a higher one.",
      sections: [
        { h: "Priority 1 · Constitutional Invariants", p: "Never violated, never compromised, never amended without supermajority. The 100% reserve mandate, no discretionary minting, no lending of reserves, no commingling. Not subject to override by any vote or emergency." },
        { h: "Priority 2 · Solvency & Reserve Integrity", p: "Reserves must always equal or exceed supply. Never sacrificed for efficiency, innovation or any other objective." },
        { h: "Priority 3 · Redemption Certainty", p: "Every unit redeemable at all times. Redemption never suspended or subject to discretionary approval." },
        { h: "Priority 4 · Legal Compliance", p: "Operate within applicable law, achieved through operational adaptation — never requiring violation of higher priorities." },
        { h: "Priority 5 · Institutional Stability", p: "The Institution survives stress and crisis. Short-term adjustments must not compromise long-term stability." },
        { h: "Priority 6 · Operational Efficiency", p: "Cost-effective operations — pursued within constitutional constraints, never compromising higher priorities." },
        { h: "Priority 7 · Innovation", p: "The Institution evolves and improves — incrementally, never destabilising, never at the expense of higher priorities." },
      ],
    },
    {
      id: "l1-art4",
      number: "Article IV",
      title: "Institutional Neutrality",
      purpose:
        "The Institution is neutral. It does not take sides, set monetary policy, speculate, intervene, or favour any jurisdiction or participant.",
      sections: [
        { h: "No Political Alignment", p: "All political disputes are irrelevant to settlement operations. The Institution does not endorse any political position or align with any geopolitical bloc." },
        { h: "No Monetary Policy", p: "The Institution does not set interest rates, print money, engage in QE, or target inflation. Its only monetary function is reserve management. Supply is determined entirely by market demand." },
        { h: "No Speculation", p: "The Institution does not trade reserves for profit, take speculative positions, engage in arbitrage, or seek yield. Reserves are held for safety and redemption, not investment return." },
        { h: "No Economic Intervention", p: "The Institution does not buy or sell currencies, manage exchange rates, provide market liquidity, or act as market maker. MTQ value is determined by NAV, not by market operations." },
        { h: "No Preferential Jurisdiction", p: "All eligible jurisdictions are treated equally. No privileged access; jurisdictional differences managed through compliance, not privilege." },
        { h: "Equal Treatment", p: "All eligible participants treated equally — same fees, same redemption rights, same settlement rules, same access conditions. No volume discounts or special arrangements." },
        { h: "No Discrimination", p: "No discrimination except objective eligibility criteria applied uniformly. Eligibility is based on objective criteria, not subjective factors." },
        { h: "Neutrality vs. Legal Compliance", p: "Compliance with law does not constitute political alignment. Sanctions compliance is mandatory and neutral — a legal obligation, not a political endorsement." },
      ],
    },
    {
      id: "l1-art5",
      number: "Article V",
      title: "Anti-Platform / No Constitutional Drift",
      purpose:
        "The Institution shall not expand beyond its constitutional purpose. The anti-platform provisions are permanently frozen.",
      frozen: true,
      sections: [
        {
          h: "Permanent Prohibition",
          p: "The Institution shall never engage in: lending, exchange operations, brokerage, asset management, retail or investment banking, derivatives issuance, DeFi protocols, or any platform service.",
        },
        {
          h: "No Constitutional Drift",
          p: "No amendment may authorise prohibited activities — such amendments are constitutionally invalid regardless of vote count. The Constitution shall be interpreted narrowly; broad interpretations enabling prohibited activities are rejected. Incremental drift toward prohibited activities is prohibited.",
        },
        {
          h: "Permitted Activities",
          p: "Issue & redeem settlement units; maintain reserves in custody; govern the institution; publish transparency data; support interoperability; maintain technical infrastructure; ensure legal compliance; protect the institution.",
        },
        {
          h: "Prohibited Activities (detailed)",
          p: "Financial services (deposits, loans, credit, underwriting, bonds, trade finance, factoring). Trading & exchange (matching, order books, market making, brokerage, custody of participant funds). Asset management. DeFi (liquidity pools, yield farming, staking, lending, derivatives). Platform services (trade matching, logistics, customs, credit scoring, identity, dispute resolution).",
        },
        {
          h: "Permanently Frozen",
          p: "The anti-platform provisions cannot be amended, cannot be interpreted away, and cannot be eroded through incremental expansion. This protection is essential to the Institution's identity — without it, Mithqal would be a platform, not a constitutional monetary institution.",
        },
      ],
    },
    {
      id: "l1-art6",
      number: "Article VI",
      title: "Predictably Adaptive Definition",
      purpose:
        "The Institution is Predictably Adaptive. Every adaptation follows defined, transparent, bounded processes — no arbitrary change.",
    },
    {
      id: "l1-art7",
      number: "Article VII",
      title: "Failure Definition",
      purpose:
        "Failure is any event that prevents honoring redemption, maintaining reserve solvency, publishing proofs, or governing the Institution. Recovery requires restoration of all four conditions.",
    },
    {
      id: "l1-art8",
      number: "Article VIII",
      title: "Yield Separation",
      purpose:
        "The settlement function and yield generation are constitutionally separate. Reserves are never used for yield; the yield vehicle is a separate legal entity that never holds, lends or uses MTQ.",
    },
    {
      id: "l1-art9",
      number: "Article IX",
      title: "Founder Succession",
      purpose:
        "The Founder holds a Council seat during active involvement. Founder and affiliates shall not hold more than 20% of circulating supply. After departure, the Founder may serve in an advisory capacity with no voting rights.",
    },
    {
      id: "l1-art10",
      number: "Article X",
      title: "Emergency Governance",
      purpose:
        "A defined path through governance failure. The Emergency Custodian is a temporary, limited role that maintains reserves, honors redemptions, pauses minting, and convenes a new Council within 60 days.",
    },
    {
      id: "l1-art11",
      number: "Article XI",
      title: "Regulatory Adaptability",
      purpose:
        "The Institution can operate lawfully across jurisdictions without violating constitutional invariants. Compliance through operational adaptation, never constitutional compromise.",
    },
    {
      id: "l1-art12",
      number: "Article XII",
      title: "Amendment Philosophy",
      purpose:
        "The Constitution evolves only when necessary. Amendments must preserve identity, preserve invariants, improve stability, respect neutrality, and pass supermajority. Anti-platform provisions are permanently frozen.",
    },
    {
      id: "l1-art13",
      number: "Article XIII",
      title: "Interpretation Clause",
      purpose:
        "Establishes how the Constitution shall be interpreted. Constitutional identity is the foundation; invariants are non-negotiable; interpretation resolves ambiguity toward the constitutional purpose.",
    },
    {
      id: "l1-art14",
      number: "Article XIV",
      title: "Institutional Lifecycle",
      purpose:
        "Defines the stages the Institution may pass through — Formation, Operation, Expansion, Emergency, Resolution, Succession — determined by constitutional principles, not courts or circumstance.",
      sections: [
        { h: "Formation", p: "Establish the Institution. Foundation registered, Council appointed, initial reserves deposited, custody established, legal requirements met, institutional identity defined. Governed by the Formation Committee; transition to Council upon operational readiness. Typically 6–18 months, defined by milestones, not time." },
        { h: "Operation", p: "Ordinary operation. Settlement continues, reserve management continues, governance continues. The Institution fulfills its constitutional purpose under normal governance, indefinitely." },
        { h: "Expansion", p: "Grow the Institution. Onboard participants, integrate CBDCs (Digital Dirham → mBridge → Digital Euro/Yuan/Dollar), extend reach. Under normal governance, ongoing." },
        { h: "Emergency", p: "Preserve the Institution under stress. Limited, time-limited governance. Emergency Custodian maintains reserves and redemptions; convenes a new Council." },
        { h: "Resolution", p: "Orderly wind-down if ever required. Governed by the Resolution Committee. Holder protection first; defined protection." },
        { h: "Succession", p: "Governed transition. The Institution persists beyond founders, personnel and technology — the Constitution endures." },
      ],
    },
    {
      id: "l1-art15",
      number: "Article XV",
      title: "Constitutional Success Metrics",
      purpose:
        "Defines the conditions under which the Institution is succeeding: reserve ratio, redemption finality, settlement neutrality, transparency cadence, governance integrity.",
    },
    {
      id: "l1-art16",
      number: "Article XVI",
      title: "Language Standards",
      purpose:
        "Ensures all constitutional, policy and public documents use precise, unambiguous, durable language. Terms are defined once and used consistently.",
    },
    {
      id: "l1-art17",
      number: "Article XVII",
      title: "Five-Year Independent Review",
      purpose:
        "Every five years, an independent panel of nine experts (3 economists, 3 technologists, 3 lawyers) assesses reserve adequacy, algorithmic performance, governance effectiveness, compliance, security and constitutional integrity.",
    },
  ],
};

/* ================================================================== */
/* LAYER 2 — MONETARY CONSTITUTION                                    */
/* ================================================================== */

const LAYER_2: Layer = {
  id: "layer-2",
  label: "Layer 2",
  name: "Monetary Constitution",
  blurb:
    "The invariants, monetary objectives, reserve principles, monetary metals, currency framework, monetary engine and proof of reserves that govern the settlement unit.",
  articles: [
    { id: "l2-art1", number: "Article I", title: "Invariants", purpose: "100% reserve mandate; no discretionary minting; no lending of reserves; no commingling; no redemption suspension. Absolute and permanent.", frozen: true },
    { id: "l2-art2", number: "Article II", title: "Monetary Objectives", purpose: "The Institution optimizes for stable purchasing power, full redeemability, reserve solvency and neutral value transfer." },
    { id: "l2-art3", number: "Article III", title: "Reserve Principles", purpose: "How reserves are structured, managed and protected: segregated custody, four-tier diversification, no lending, no rehypothecation, eligibility criteria." },
    { id: "l2-art4", number: "Article IV", title: "Monetary Metals", purpose: "The role of physical bullion in the Institution's reserves: allocated, audited, segregated — never paper gold or unallocated claims." },
    { id: "l2-art5", number: "Article V", title: "Currency Framework", purpose: "The principles by which currencies are selected for the reserve basket: COFER and SWIFT weighting, market depth, liquidity, resilience, no political adjustment." },
    { id: "l2-art6", number: "Article VI", title: "Monetary Engine", purpose: "The algorithmic core. Weighted-average basket with bounded momentum and mean reversion — not ML, not HFT. NAV is a function of composition, transparent and auditable." },
    { id: "l2-art7", number: "Article VII", title: "Proof of Reserves", purpose: "Daily cryptographic, privacy-preserving solvency proof. Anyone with sufficient technical capability can verify the reserve ratio independently." },
  ],
};

/* ================================================================== */
/* LAYER 3 — GOVERNANCE & POLICY CONSTITUTION                         */
/* ================================================================== */

const LAYER_3: Layer = {
  id: "layer-3",
  label: "Layer 3",
  name: "Governance & Policy Constitution",
  blurb:
    "The policy framework, committee mandates, fee schedules, sanctions mechanics, risk tolerances, maturity stages, review cycles and physical redemption terms.",
  articles: [
    { id: "l3-art1", number: "Article I", title: "Policy Framework", purpose: "The structure for all institutional policy: who sets it, how it is amended, how it is published." },
    { id: "l3-art2", number: "Article II", title: "Committee Mandates", purpose: "Specific responsibilities, powers, decision thresholds and reporting for each committee (Risk, Technical, Audit, Compliance)." },
    { id: "l3-art3", number: "Article III", title: "Fee Schedules", purpose: "Mint 0.01–0.10% · Redeem 0.01–0.10% · Transfer 0.00–0.05% · Custody 0.05–0.20%/yr. Transparent, published, adjusted in service of stability — never revenue." },
    { id: "l3-art4", number: "Article IV", title: "Sanctions Mechanics", purpose: "Procedures for screening (OFAC SDN/SSI, UN, EU, UK, MAS, UAE), enforcement, freeze procedures and reporting. Sanctions compliance is absolute and neutral." },
    { id: "l3-art5", number: "Article V", title: "Risk Tolerances", purpose: "Volatility thresholds, liquidity thresholds, concentration limits, stress test requirements across reserve and operational risk." },
    { id: "l3-art6", number: "Article VI", title: "Maturity Stages", purpose: "The distinct phases through which the Institution progresses: formation requirements, operational parameters, expansion criteria." },
    { id: "l3-art7", number: "Article VII", title: "Review Cycles", purpose: "Systematic schedule, scope and procedures for reviewing reserves, governance, compliance, security and constitutional integrity." },
    { id: "l3-art8", number: "Article VIII", title: "Physical Redemption Terms", purpose: "Specific terms, conditions and procedures for physical redemption of monetary metals." },
  ],
};

/* ================================================================== */
/* LAYER 4 — TECHNICAL CONSTITUTION                                   */
/* ================================================================== */

const LAYER_4: Layer = {
  id: "layer-4",
  label: "Layer 4",
  name: "Technical Constitution",
  blurb:
    "Smart contracts, cryptography, oracle architecture, interoperability, security, infrastructure, formal verification and disaster recovery.",
  articles: [
    { id: "l4-art1", number: "Article I", title: "Smart Contracts", purpose: "ERC-20 with Permit, Burnable, UUPS proxy. Micro-settlement precision (18 decimals). Pausable in emergency. Formal verification of all invariants." },
    { id: "l4-art2", number: "Article II", title: "Cryptography", purpose: "Post-quantum roadmap: Falcon-512 (2027), dual support (2028), required (2029). Lamport one-time signatures. Migration path monitored against NIST PQC standards." },
    { id: "l4-art3", number: "Article III", title: "Oracle Architecture", purpose: "Redundant, audited data feeds for NAV computation, reserve pricing and sanctions screening. No single point of failure." },
    { id: "l4-art4", number: "Article IV", title: "Interoperability", purpose: "ISO 20022 messaging, existing custody and settlement standards. Banks integrate without replacing SWIFT, core banking or regulatory reporting." },
    { id: "l4-art5", number: "Article V", title: "Security", purpose: "Comprehensive security framework: audits, formal verification, bug bounty, defense in depth, access control, pausability, incident response." },
    { id: "l4-art6", number: "Article VI", title: "Infrastructure", purpose: "Physical and logical infrastructure: geographically distributed reserves, redundant systems, fallback custody, emergency liquidity." },
    { id: "l4-art7", number: "Article VII", title: "Formal Verification", purpose: "Mathematical verification of invariants: Reserve_Value ≥ Supply × NAV; mint never without proof of deposit; redeem decreases supply and reserves proportionally; rebalance never exceeds 3% weekly." },
    { id: "l4-art8", number: "Article VIII", title: "Disaster Recovery", purpose: "Comprehensive recovery framework: custody loss, cryptographic failure, market crash, governance failure. Recovery designed, tested, continuously improved." },
  ],
};

/* ================================================================== */
/* LAYER 5 — OPERATIONS CONSTITUTION                                  */
/* ================================================================== */

const LAYER_5: Layer = {
  id: "layer-5",
  label: "Layer 5",
  name: "Operations Constitution",
  blurb:
    "Reserve management operations, transaction processing, participant services, compliance execution, technical operations, vendor management and documentation.",
  articles: [
    { id: "l5-art1", number: "Article I", title: "Reserve Management Operations", purpose: "Day-to-day procedures for managing reserves: custody, rebalancing, eligibility verification, tier management." },
    { id: "l5-art2", number: "Article II", title: "Transaction Processing Operations", purpose: "Day-to-day procedures for mint, redeem and transfer: verification, settlement finality, fee collection, logging." },
    { id: "l5-art3", number: "Article III", title: "Participant Services", purpose: "Onboarding, supporting and managing participants: KYC/KYB, UBO identification, enhanced due diligence, ongoing monitoring." },
    { id: "l5-art4", number: "Article IV", title: "Compliance Execution", purpose: "Operational procedures for sanctions screening, SAR/STR filing, regulatory reporting, audit trails." },
    { id: "l5-art5", number: "Article V", title: "Technical Operations", purpose: "Monitoring, maintaining and securing the technical infrastructure: uptime, incident response, change management." },
    { id: "l5-art6", number: "Article VI", title: "Vendor Management", purpose: "Selecting, onboarding, monitoring and terminating vendors (custodians, oracles, auditors): due diligence, agreements, performance review." },
    { id: "l5-art7", number: "Article VII", title: "Documentation & Reporting", purpose: "Maintaining comprehensive records: council decisions, risk reports, technical reports, audit reports — all published per cadence." },
  ],
};

export const LAYERS: Layer[] = [LAYER_1, LAYER_2, LAYER_3, LAYER_4, LAYER_5];

/** Flat list of all articles with their layer, for search + nav. */
export const ALL_ARTICLES = LAYERS.flatMap((layer) =>
  layer.articles.map((a) => ({ ...a, layerId: layer.id, layerName: layer.name }))
);

export const PREAMBLE = {
  identity:
    "MITHQAL is a Constitutional Monetary Institution. The Digital Settlement Infrastructure is one constitutional function of the Institution. If the underlying technology evolves or is replaced, the Institution persists. Technology is implementation; the Institution is identity.",
  mission:
    "To provide a constitutional, neutral, resilient, and fully reserved settlement infrastructure for international trade.",
  humility:
    "The Institution makes no claim of superiority over sovereign currencies, central banks, or existing payment systems. Its objective is to complement international trade settlement through constitutional stability, transparency, and prudence.",
  not: [
    "Not a bank",
    "Not a lending platform",
    "Not a payment processor",
    "Not a marketplace",
    "Not a DeFi protocol",
    "Not a speculative asset",
    "Not a platform of any kind",
  ],
};
