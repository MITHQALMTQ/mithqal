// Mithqal Constitution v24.2.1 — structured, citable reference.
// The blueprint is a 4-layer architecture (Institutional / Monetary /
// Governance & Policy / Technical / Operations) with ~47 articles.
// This module structures the full table of contents plus detailed
// provisions for the core Layer 1 articles (the constitutional identity).

export interface Section {
  /** short heading within an article (display string; includes sectionNumber + title for L3+ articles) */
  h: string;
  /** body text */
  p: string;
  /** stable source-document section number, e.g. "§2.1" — populated for L3+ articles sourced from Constitution v19.0 */
  sectionNumber?: string;
  /** canonical section title from Constitution v19.0 — populated for L3+ articles */
  title?: string;
  /** 1-2 sentence summary of the section (per F1 gap #2 architectural recommendation) */
  summary?: string;
  /** 3-5 key provisions, verbatim or paraphrased from Constitution v19.0 */
  keyProvisions?: string[];
  /** cross-references to other sections / articles / constitution version */
  references?: string[];
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
  /** a non-amendable flag for invariants */
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
        { h: "Priority 1 · Constitutional Invariants", p: "Never violated, never compromised, never amended without supermajority. The 100% reserve mandate, no discretionary minting, no lending of reserves, no commingling, bullion preservation (gold only liquidated after all superior tiers exhausted). Not subject to override by any vote or emergency." },
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
        "The Institution shall not expand beyond its constitutional purpose. The anti-platform provisions are non-amendable.",
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
          h: "Non-amendable",
          p: "The anti-platform provisions cannot be amended, cannot be interpreted away, and cannot be eroded through incremental expansion. This protection is essential to the Institution's identity — without it, Mithqal would be a platform, not a constitutional settlement institution.",
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
        "The settlement function and yield generation are constitutionally separate. Reserves are never used for yield; the technology company is a separate legal entity that never holds, lends or uses MTQ.",
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
        "The Constitution evolves only when necessary. Amendments must preserve identity, preserve invariants, improve stability, respect neutrality, and pass supermajority. Anti-platform provisions are non-amendable.",
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
    { id: "l2-art1", number: "Article I", title: "Invariants", purpose: "100% reserve mandate; no discretionary minting; no lending of reserves; no commingling; bullion preservation (gold liquidated only after all superior tiers exhausted). Absolute and permanent.", frozen: true },
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
    {
      id: "l3-art2",
      number: "Article II",
      title: "Committee Mandates",
      purpose:
        "Specific responsibilities, powers, decision thresholds and reporting for each committee (Risk, Technical, Audit, Compliance).",
      sections: [
        {
          sectionNumber: "§2.1",
          h: "§2.1 · Core Principles of Committee Mandates",
          p: "The committee framework rests on five principles: separation of powers, checks and balances, clear accountability, independence within mandates, and operational transparency. Each committee operates within a distinct scope, preventing concentration of authority.",
          title: "Core Principles of Committee Mandates",
          summary:
            "The committee framework rests on five principles: separation of powers, checks and balances, clear accountability, independence within mandates, and operational transparency. Each committee operates within a distinct scope, preventing concentration of authority.",
          keyProvisions: [
            "Separation of powers — Council sets policy; Risk / Technical / Audit / Sharia committees oversee distinct domains (risk, technical, audit, Sharia compliance).",
            "Checks and balances — Council oversees all committees; committees report to the Council; no single body has unchecked power.",
            "Clear accountability — committees report regularly, are subject to review, and are accountable to both Council and public.",
            "Independence — committees make independent decisions, free from improper influence and commercial interests.",
            "Transparency — committee decisions, minutes, and reports are published and auditable.",
          ],
          references: ["Constitution v19.0", "L3-Article-I", "L1-Article-III", "L1-Article-XIV"],
        },
        {
          sectionNumber: "§2.2",
          h: "§2.2 · Monetary Council Mandate",
          p: "The Monetary Council is the primary decision-making body, comprising 7-15 members serving 4-year staggered terms with a Chair elected by the Council. Most decisions require a simple majority with a 30-day timelock; reserve allocation changes require 66% supermajority and emergency actions require 75% supermajority with immediate effect.",
          title: "The Monetary Council Mandate",
          summary:
            "The Monetary Council is the primary decision-making body, comprising 7-15 members serving 4-year staggered terms with a Chair elected by the Council. Most decisions require a simple majority with a 30-day timelock; reserve allocation changes require 66% supermajority and emergency actions require 75% supermajority with immediate effect.",
          keyProvisions: [
            "Composition: 7-15 members, 4-year staggered terms, appointed by Council nomination with Independent Review Panel vetting.",
            "Meetings: quarterly minimum, with special meetings as needed; Chair elected by the Council.",
            "Decision thresholds — Policy/Budget/Committee Appointment/Fee Change = 50%+1 majority with 30-day timelock; Reserve Allocation Change = 66% supermajority with 30-day timelock; Emergency Action = 75% supermajority, immediate.",
            "Key responsibilities: policy approval, budget approval, committee appointment, oversight, reserve allocation, fee schedule, emergency action, quarterly reporting.",
            "Reporting: Council decisions (quarterly, public), Budget report (annual, public), Governance report (annual, public), Emergency actions (as needed, public).",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.1", "L1-Article-X"],
        },
        {
          sectionNumber: "§2.3",
          h: "§2.3 · Risk Committee Mandate",
          p: "The Risk Committee provides independent risk oversight with 3-7 members serving 3-year staggered terms. Risk identification, assessment, and mitigation recommendations require consensus (50%+1 quorum); emergency escalations require 66% supermajority. The committee covers six risk categories: market, credit, liquidity, operational, regulatory, reputational, and geopolitical.",
          title: "The Risk Committee Mandate",
          summary:
            "The Risk Committee provides independent risk oversight with 3-7 members serving 3-year staggered terms. Risk identification, assessment, and mitigation recommendations require consensus (50%+1 quorum); emergency escalations require 66% supermajority. The committee covers six risk categories: market, credit, liquidity, operational, regulatory, reputational, and geopolitical.",
          keyProvisions: [
            "Composition: 3-7 members, 3-year staggered terms, Council nomination, Chair elected by the Committee.",
            "Meetings: monthly minimum, with special meetings as needed.",
            "Decision thresholds — Risk Identification / Risk Assessment / Mitigation Recommendation = consensus (50%+1 quorum); Emergency Escalation = 66% supermajority.",
            "Risk categories: Market, Credit, Liquidity, Operational, Regulatory, Reputational, Geopolitical.",
            "Reporting: Risk dashboard (monthly, Council), Risk assessment (quarterly, Council), Stress test results (quarterly, Council), Annual risk report (annual, public).",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.2", "L3-Article-V"],
        },
        {
          sectionNumber: "§2.4",
          h: "§2.4 · Technical Committee Mandate",
          p: "The Technical Committee provides independent technical oversight with 3-7 members serving 3-year staggered terms, technically qualified and independent of technology vendors. Technical recommendations require consensus; security actions require 66% supermajority; emergency technical actions require 75% supermajority. The committee oversees six technical domains.",
          title: "The Technical Committee Mandate",
          summary:
            "The Technical Committee provides independent technical oversight with 3-7 members serving 3-year staggered terms, technically qualified and independent of technology vendors. Technical recommendations require consensus; security actions require 66% supermajority; emergency technical actions require 75% supermajority. The committee oversees six technical domains.",
          keyProvisions: [
            "Composition: 3-7 members, 3-year staggered terms, Council nomination with technical qualifications, Chair elected by the Committee.",
            "Decision thresholds — Technical Recommendation = consensus (50%+1 quorum); Security Action = 66% supermajority; Emergency Technical Action = 75% supermajority.",
            "Technical domains: Smart Contracts, Cryptography, Oracle Architecture, Infrastructure, Security, Interoperability.",
            "Key responsibilities: architecture oversight, security management, implementation, monitoring, quarterly reporting.",
            "Reporting: Technical status (monthly, Council), Security report (monthly, Council), Upgrade proposals (as needed, Council), Annual technical report (annual, public).",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.2", "L4-Article-I", "L4-Article-V"],
        },
        {
          sectionNumber: "§2.5",
          h: "§2.5 · Audit Committee Mandate",
          p: "The Audit Committee provides independent audit oversight with 3-5 members serving 3-year staggered terms, accounting/audit-qualified and independent of management. All decisions (auditor appointment, scope approval, finding escalation) require majority vote with 50%+1 quorum. The committee oversees five audit areas.",
          title: "The Audit Committee Mandate",
          summary:
            "The Audit Committee provides independent audit oversight with 3-5 members serving 3-year staggered terms, accounting/audit-qualified and independent of management. All decisions (auditor appointment, scope approval, finding escalation) require majority vote with 50%+1 quorum. The committee oversees five audit areas.",
          keyProvisions: [
            "Composition: 3-5 members, 3-year staggered terms, Council nomination with accounting/audit expertise, Chair elected by the Committee.",
            "Decision thresholds — Auditor Appointment / Audit Scope Approval / Audit Finding Escalation = majority (50%+1 quorum).",
            "Audit areas: Financial (annual), Reserve (quarterly), Operational (annual), Compliance (annual), Sharia (annual).",
            "Key responsibilities: auditor appointment, audit oversight, finding review, recommendation implementation, quarterly reporting.",
            "Reporting: Audit findings (quarterly, Council), Auditor appointment (annual, Council), Annual audit report (annual, public).",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.2", "L1-Article-XVII"],
        },
        {
          sectionNumber: "§2.6",
          h: "§2.6 · Sharia Committee Mandate",
          p: "The Sharia Committee provides independent Sharia oversight with a minimum of 3 AAOIFI-certified scholars serving 5-year staggered terms. The committee is self-governing (approves its own members), and all decisions (compliance rulings, annual certification, veto of non-compliant instruments) require 100% consensus — any single member can veto.",
          title: "The Sharia Committee Mandate",
          summary:
            "The Sharia Committee provides independent Sharia oversight with a minimum of 3 AAOIFI-certified scholars serving 5-year staggered terms. The committee is self-governing (approves its own members), and all decisions (compliance rulings, annual certification, veto of non-compliant instruments) require 100% consensus — any single member can veto.",
          keyProvisions: [
            "Composition: minimum 3 members, 5-year staggered terms, AAOIFI-certified scholars, self-governing (approves own members), Chair elected by the Committee.",
            "Decision thresholds — Compliance Ruling / Annual Certification / Veto Non-Compliant = 100% consensus (unanimity required).",
            "Review areas: Reserve assets (quarterly), Yield vehicle (quarterly), Takaful (quarterly), New structures (as needed), Annual compliance (annual).",
            "Key responsibilities: structure review, ruling issuance, annual certification, reserve review, veto power.",
            "Reporting: Compliance rulings (as needed, Council), Quarterly compliance report (quarterly, Council), Annual compliance certificate (annual, public).",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.2", "L1-Article-VIII"],
        },
        {
          sectionNumber: "§2.7",
          h: "§2.7 · Committee Interaction and Coordination",
          p: "All committees report to the Monetary Council, which provides oversight and resolves inter-committee conflicts. Committees coordinate with each other as needed to share information, address overlapping issues, and avoid duplication. The Council is the final authority for inter-committee dispute resolution.",
          title: "Committee Interaction and Coordination",
          summary:
            "All committees report to the Monetary Council, which provides oversight and resolves inter-committee conflicts. Committees coordinate with each other as needed to share information, address overlapping issues, and avoid duplication. The Council is the final authority for inter-committee dispute resolution.",
          keyProvisions: [
            "Council oversight — all committees report to the Council; the Council reviews committee performance and provides guidance.",
            "Committee coordination — committees share information, address overlapping issues, and avoid duplication.",
            "Conflict resolution — inter-committee conflicts are escalated to and resolved by the Council.",
            "Defined resolution prevents deadlock; Council authority ensures resolution and maintains institutional integrity.",
            "Coordination maintains institutional integrity and prevents fragmentation.",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.2"],
        },
        {
          sectionNumber: "§2.8",
          h: "§2.8 · Committee Mandates Summary Table",
          p: "A consolidated reference of all five committees: Monetary Council (7-15 members, 4-year term, quarterly reporting), Risk Committee (3-7, 3-year, quarterly), Technical Committee (3-7, 3-year, quarterly), Audit Committee (3-5, 3-year, quarterly), and Sharia Committee (3+, 5-year, annual). Each has defined responsibilities, decision thresholds, and reporting requirements.",
          title: "Committee Mandates Summary Table",
          summary:
            "A consolidated reference of all five committees: Monetary Council (7-15 members, 4-year term, quarterly reporting), Risk Committee (3-7, 3-year, quarterly), Technical Committee (3-7, 3-year, quarterly), Audit Committee (3-5, 3-year, quarterly), and Sharia Committee (3+, 5-year, annual). Each has defined responsibilities, decision thresholds, and reporting requirements.",
          keyProvisions: [
            "Monetary Council — 7-15 members, 4-year term, responsibilities: Policy/Budget/Oversight, reporting: Quarterly.",
            "Risk Committee — 3-7 members, 3-year term, responsibilities: Risk identification/assessment/mitigation, reporting: Quarterly.",
            "Technical Committee — 3-7 members, 3-year term, responsibilities: Technical oversight/security/implementation, reporting: Quarterly.",
            "Audit Committee — 3-5 members, 3-year term, responsibilities: Auditor appointment/audit oversight, reporting: Quarterly.",
            "Sharia Committee — 3+ members, 5-year term, responsibilities: Sharia compliance/rulings/certification, reporting: Annual.",
          ],
          references: ["Constitution v19.0", "L3-Article-II §2.2", "L3-Article-II §2.3", "L3-Article-II §2.4", "L3-Article-II §2.5", "L3-Article-II §2.6"],
        },
      ],
    },
    { id: "l3-art3", number: "Article III", title: "Fee Schedules", purpose: "Mint 0.01–0.10% · Redeem 0.01–0.10% · Transfer 0.00–0.05% · Custody 0.05–0.20%/yr. Transparent, published, adjusted in service of stability — never revenue." },
    { id: "l3-art4", number: "Article IV", title: "Sanctions Mechanics", purpose: "Procedures for screening (OFAC SDN/SSI, UN, EU, UK, MAS, UAE), enforcement, freeze procedures and reporting. Sanctions compliance is absolute and neutral." },
    { id: "l3-art5", number: "Article V", title: "Risk Tolerances", purpose: "Volatility thresholds, liquidity thresholds, concentration limits, stress test requirements across reserve and operational risk." },
    {
      id: "l3-art6",
      number: "Article VI",
      title: "Maturity Stages",
      purpose: "The distinct phases through which the Institution progresses: formation requirements, operational parameters, expansion criteria.",
      sections: [
        {
          sectionNumber: "§6.1",
          h: "§6.1 · Core Principles of Maturity Stages",
          p: "The maturity framework rests on four principles: constitutional supremacy (no stage can violate invariants), predictable adaptation (transitions follow defined criteria), transparency (current stage and transition criteria are published), and accountability (transitions require defined approvals).",
          title: "Core Principles of Maturity Stages",
          summary:
            "The maturity framework rests on four principles: constitutional supremacy (no stage can violate invariants), predictable adaptation (transitions follow defined criteria), transparency (current stage and transition criteria are published), and accountability (transitions require defined approvals).",
          keyProvisions: [
            "Constitutional supremacy — no stage can violate invariants, suspend constitutional protections, or exceed constitutional authority.",
            "Predictable adaptation — transitions are defined in advance, follow clear criteria, and are transparent and documented.",
            "Transparency — current stage is publicly disclosed; stage characteristics and transition criteria are published.",
            "Accountability — transitions require defined approvals that are documented, transparent, and subject to review.",
            "Even in the Emergency stage, the Institution maintains 100% reserves, honors redemptions, and preserves constitutional principles.",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.5", "L1-Article-VI", "L1-Article-VII", "L1-Article-XIV"],
        },
        {
          sectionNumber: "§6.2",
          h: "§6.2 · Stage 1: Formation",
          p: "Stage 1 establishes the Institution: governance bodies appointed, initial reserves deposited, operational infrastructure established, legal compliance achieved, and initial participants onboarded. Governance is by the Formation Committee; the Council takes over upon operational readiness. Typically 6-18 months, defined by milestones not time.",
          title: "Stage 1: Formation — Establishment of the Institution",
          summary:
            "Stage 1 establishes the Institution: governance bodies appointed, initial reserves deposited, operational infrastructure established, legal compliance achieved, and initial participants onboarded. Governance is by the Formation Committee; the Council takes over upon operational readiness. Typically 6-18 months, defined by milestones not time.",
          keyProvisions: [
            "Characteristics: initial governance bodies appointed, initial reserves deposited, operational infrastructure established, legal/regulatory requirements met, institutional identity defined.",
            "Requirements: governance bodies appointed and active, reserves at constitutional minimum, operational infrastructure operational, legal compliance achieved, initial participants onboarded.",
            "Governance: Formation Committee oversees; Council takes over upon operational readiness; initial appointments are transitional.",
            "Duration: typically 6-18 months, milestone-based (not time-based).",
            "Transition criteria: all governance bodies appointed and active, reserves at constitutional minimum, infrastructure operational, legal compliance achieved, initial participants onboarded, Council approval obtained, Independent Review Panel confirmation, transition published.",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.1", "L1-Article-XIV"],
        },
        {
          sectionNumber: "§6.3",
          h: "§6.3 · Stage 2: Operational",
          p: "Stage 2 is the Institution's default state — full operational capability, all reserves in place, all governance bodies active, all compliance procedures active, full transparency and reporting. Governance is normal by all bodies. Duration is indefinite, continuing until transition to another stage.",
          title: "Stage 2: Operational — Ordinary Operation of the Institution",
          summary:
            "Stage 2 is the Institution's default state — full operational capability, all reserves in place, all governance bodies active, all compliance procedures active, full transparency and reporting. Governance is normal by all bodies. Duration is indefinite, continuing until transition to another stage.",
          keyProvisions: [
            "Characteristics: normal settlement operations, normal reserve management, normal governance, normal compliance, normal transparency.",
            "Requirements: full operational capability, all reserves in place, all governance bodies active, all compliance procedures active, full transparency and reporting.",
            "Governance: normal governance by all bodies, full constitutional protections apply, regular reporting and accountability.",
            "Duration: indefinite — the default stage of the Institution; continues until transition to another stage.",
            "Transition criteria: Expansion (opportunity + Council approval), Emergency (emergency event, automatic or Council), Resolution (invariants permanently unattainable + Council + Independent Review Panel), Succession (voluntary transfer + Council + Review Panel + supermajority).",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.4", "L3-Article-VII"],
        },
        {
          sectionNumber: "§6.4",
          h: "§6.4 · Stage 3: Expansion",
          p: "Stage 3 grows the Institution by adding jurisdictions, counterparties, or functions consistent with constitutional purpose. Expansion is governed by Policy and cannot violate constitutional principles, change constitutional identity, or enable prohibited activities. Duration is ongoing, opportunity-based.",
          title: "Stage 3: Expansion — Addition of Jurisdictions, Counterparties, or Functions",
          summary:
            "Stage 3 grows the Institution by adding jurisdictions, counterparties, or functions consistent with constitutional purpose. Expansion is governed by Policy and cannot violate constitutional principles, change constitutional identity, or enable prohibited activities. Duration is ongoing, opportunity-based.",
          keyProvisions: [
            "Characteristics: new jurisdictions added, new counterparties added, new functions added (within constitutional limits), expansion governed by defined processes.",
            "Requirements: successful Operational stage, demonstrated capability, identified opportunities, constitutional compatibility confirmed, Council approval obtained.",
            "Governance: Council approves expansion, Policy defines expansion criteria, constitutional constraints apply.",
            "Duration: ongoing, as opportunities arise, managed through Policy, subject to constitutional constraints.",
            "Limitations: expansion cannot violate constitutional principles, change constitutional identity, or enable prohibited activities (anti-platform provisions remain non-amendable).",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.3", "L1-Article-V", "L1-Article-XI"],
        },
        {
          sectionNumber: "§6.5",
          h: "§6.5 · Stage 4: Emergency",
          p: "Stage 4 is invoked when an emergency occurs (governance failure, custody failure, oracle failure, solvency threat, security breach). Governance is limited and focused on preservation. Duration is time-limited and may not exceed 90 days without Council approval. The Emergency Custodian acts if the Council is unavailable.",
          title: "Stage 4: Emergency — Invocation of Emergency Protocols",
          summary:
            "Stage 4 is invoked when an emergency occurs (governance failure, custody failure, oracle failure, solvency threat, security breach). Governance is limited and focused on preservation. Duration is time-limited and may not exceed 90 days without Council approval. The Emergency Custodian acts if the Council is unavailable.",
          keyProvisions: [
            "Triggers: governance failure (Council no quorum for 90 days), custody failure (loss of reserve access), oracle failure (NAV cannot be calculated), solvency threat (reserve ratio below 100%), security breach (significant loss or compromise).",
            "Characteristics: emergency protocols activated, limited governance, focus on preservation, time-limited.",
            "Governance: Emergency Custodian (if Council unavailable), Council (if available), focus on preservation.",
            "Duration: limited, defined as necessary to resolve the emergency, not to exceed 90 days without Council approval.",
            "Transition criteria: Operational (emergency resolved + Council approval), Resolution (emergency cannot be resolved + Council + Independent Review Panel).",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.3", "L1-Article-X", "L4-Article-VIII"],
        },
        {
          sectionNumber: "§6.6",
          h: "§6.6 · Stage 5: Resolution",
          p: "Stage 5 begins if constitutional invariants become permanently unattainable (confirmed by the Independent Review Panel and declared by the Council). The Resolution Committee oversees an orderly wind-down, prioritizing MTQ holders (proportional share of reserves) over operating expenses and other creditors. Typically 6-24 months.",
          title: "Stage 5: Resolution — Orderly Wind-Down if Invariants Become Permanently Unattainable",
          summary:
            "Stage 5 begins if constitutional invariants become permanently unattainable (confirmed by the Independent Review Panel and declared by the Council). The Resolution Committee oversees an orderly wind-down, prioritizing MTQ holders (proportional share of reserves) over operating expenses and other creditors. Typically 6-24 months.",
          keyProvisions: [
            "Trigger: constitutional invariants permanently unattainable, confirmed by Independent Review Panel, declared by Council.",
            "Priority in resolution: (1) MTQ Holders — proportional share of reserves, (2) Operating Expenses — approved expenses before dissolution, (3) Other Creditors — after holders and expenses.",
            "Governance: Resolution Committee oversees, Council remains in oversight, Independent Review Panel monitors.",
            "Duration: defined as necessary for orderly wind-down, typically 6-24 months.",
            "Transition criteria: Wind-down (resolution complete + Wind-down Committee approval), Succession (successor identified + Council + Review Panel + supermajority).",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.5", "L1-Article-VII"],
        },
        {
          sectionNumber: "§6.7",
          h: "§6.7 · Stage 6: Succession",
          p: "Stage 6 transfers the Institution's functions, assets, and governance to a successor that can continue the constitutional purpose. Requires voluntary decision by the Council, confirmation by the Independent Review Panel, approval by supermajority, and a successor that meets constitutional criteria. Holders must be protected. Typically 6-18 months.",
          title: "Stage 6: Succession — Transfer of Governance and Assets to a Successor Institution",
          summary:
            "Stage 6 transfers the Institution's functions, assets, and governance to a successor that can continue the constitutional purpose. Requires voluntary decision by the Council, confirmation by the Independent Review Panel, approval by supermajority, and a successor that meets constitutional criteria. Holders must be protected. Typically 6-18 months.",
          keyProvisions: [
            "Requirements: voluntary decision by Council, confirmed by Independent Review Panel, approved by supermajority, successor meets constitutional criteria.",
            "Characteristics: functions transferred, assets transferred, governance transferred, constitutional identity continues.",
            "Governance: Council approves succession, successor must meet constitutional criteria, holders must be protected.",
            "Duration: defined as necessary for succession, typically 6-18 months.",
            "Transition criteria: Operational (succession complete + successor operational), Wind-down (succession complete + original Institution dissolves).",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.6", "L1-Article-IX"],
        },
        {
          sectionNumber: "§6.8",
          h: "§6.8 · Stage 7: Wind-down",
          p: "Stage 7 is the final stage: all units are redeemed, all reserves are distributed, the Institution is dissolved, and records are preserved. Completion follows Resolution (or post-Succession for the original Institution). Governed by the Wind-down Committee with final audit. Typically 3-12 months.",
          title: "Stage 7: Wind-down — Final Redemption of All Units, Return of Reserves, Dissolution",
          summary:
            "Stage 7 is the final stage: all units are redeemed, all reserves are distributed, the Institution is dissolved, and records are preserved. Completion follows Resolution (or post-Succession for the original Institution). Governed by the Wind-down Committee with final audit. Typically 3-12 months.",
          keyProvisions: [
            "Requirements: completion of Resolution, Council decision, confirmed by Independent Review Panel.",
            "Characteristics: final redemption of all units, distribution of all reserves, dissolution of the Institution, preservation of records.",
            "Governance: Wind-down Committee oversees, final audit conducted, records preserved.",
            "Duration: defined as necessary for wind-down, typically 3-12 months.",
            "Transition criteria: none — this is the final stage; dissolution completed; records preserved.",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.6", "L1-Article-XIV"],
        },
        {
          sectionNumber: "§6.9",
          h: "§6.9 · Stage Transitions",
          p: "Transitions between stages follow defined criteria and require appropriate approval: automatic for some emergency triggers, Council approval for routine transitions, Council + Independent Review Panel for invariant-unattainable transitions, and Council + Review Panel + supermajority for succession. Each transition is documented and published.",
          title: "Stage Transitions — Defined Criteria and Approvals",
          summary:
            "Transitions between stages follow defined criteria and require appropriate approval: automatic for some emergency triggers, Council approval for routine transitions, Council + Independent Review Panel for invariant-unattainable transitions, and Council + Review Panel + supermajority for succession. Each transition is documented and published.",
          keyProvisions: [
            "Formation → Operational: operational readiness achieved, Council approval.",
            "Operational → Emergency: emergency event occurs, automatic or Council approval.",
            "Operational → Resolution: invariants permanently unattainable, Council + Independent Review Panel.",
            "Operational → Succession: voluntary transfer, Council + Independent Review Panel + supermajority.",
            "Resolution → Wind-down: resolution complete, Wind-down Committee approval.",
          ],
          references: ["Constitution v19.0", "L3-Article-VI §6.2", "L3-Article-VI §6.3", "L3-Article-VI §6.4", "L3-Article-VI §6.5", "L3-Article-VI §6.6", "L3-Article-VI §6.7", "L3-Article-VI §6.8"],
        },
      ],
    },
    {
      id: "l3-art7",
      number: "Article VII",
      title: "Review Cycles",
      purpose: "Systematic schedule, scope and procedures for reviewing reserves, governance, compliance, security and constitutional integrity.",
      sections: [
        {
          sectionNumber: "§7.1",
          h: "§7.1 · Core Principles of Review Cycles",
          p: "The review framework rests on five principles: regularity (reviews at defined intervals), comprehensiveness (all aspects covered), independence (independent reviewers where appropriate), actionability (findings lead to action), and transparency (findings are published).",
          title: "Core Principles of Review Cycles",
          summary:
            "The review framework rests on five principles: regularity (reviews at defined intervals), comprehensiveness (all aspects covered), independence (independent reviewers where appropriate), actionability (findings lead to action), and transparency (findings are published).",
          keyProvisions: [
            "Regularity — review frequency is defined in advance; reviews occur on schedule; reviews are not skipped or delayed.",
            "Comprehensiveness — reviews cover all relevant areas; identify all material issues; leave no gaps.",
            "Independence — independent reviewers are qualified and objective; reviews are credible (especially the five-year Independent Review Panel).",
            "Actionability — review findings are addressed; recommendations are implemented; actions are tracked and reported.",
            "Transparency — review findings, recommendations, and actions are published, accessible, and auditable.",
          ],
          references: ["Constitution v19.0", "L1-Article-XV", "L1-Article-XVII"],
        },
        {
          sectionNumber: "§7.2",
          h: "§7.2 · Daily Reviews",
          p: "Daily reviews are the first line of defense: reserve ratio (daily proof of reserves by Technical Committee), NAV calculation (real-time), transaction monitoring (all transactions, Compliance Team), system monitoring (Technical Committee), and sanctions screening (all participants, Compliance Team). Any issue is detected immediately and addressed.",
          title: "Daily Reviews — Ongoing, Real-Time Monitoring",
          summary:
            "Daily reviews are the first line of defense: reserve ratio (daily proof of reserves by Technical Committee), NAV calculation (real-time), transaction monitoring (all transactions, Compliance Team), system monitoring (Technical Committee), and sanctions screening (all participants, Compliance Team). Any issue is detected immediately and addressed.",
          keyProvisions: [
            "Reserve Ratio — Technical Committee — daily proof of reserves.",
            "NAV Calculation — Technical Committee — real-time NAV.",
            "Transaction Monitoring — Compliance Team — transaction log (all transactions).",
            "System Monitoring — Technical Committee — system status report.",
            "Sanctions Screening — Compliance Team — screening log (all participants).",
          ],
          references: ["Constitution v19.0", "L3-Article-VII §7.5", "L2-Article-VII"],
        },
        {
          sectionNumber: "§7.3",
          h: "§7.3 · Weekly Reviews",
          p: "Weekly reviews identify trends and enable timely response: reserve composition (Reserve Management), redemption volume (Operations), settlement activity (Operations), compliance activity (Compliance Team), and incident review (Technical Committee). Trends are addressed before they become issues.",
          title: "Weekly Reviews — Short-Term Operational Review",
          summary:
            "Weekly reviews identify trends and enable timely response: reserve composition (Reserve Management), redemption volume (Operations), settlement activity (Operations), compliance activity (Compliance Team), and incident review (Technical Committee). Trends are addressed before they become issues.",
          keyProvisions: [
            "Reserve Composition — Reserve Management — weekly reserve report.",
            "Redemption Volume — Operations — redemption volume report.",
            "Settlement Activity — Operations — settlement activity report.",
            "Compliance Activity — Compliance Team — weekly compliance report.",
            "Incident Review — Technical Committee — incident report.",
          ],
          references: ["Constitution v19.0", "L3-Article-VII §7.2"],
        },
        {
          sectionNumber: "§7.4",
          h: "§7.4 · Monthly Reviews",
          p: "Monthly reviews provide in-depth assessment: risk assessment (Risk Committee — all risks), technical performance (Technical Committee), compliance review (Compliance Team), financial review (CFO), and key risk indicators (Risk Committee — KRI dashboard). The Council receives monthly reports and considers necessary action.",
          title: "Monthly Reviews — Mid-Term Operational Review",
          summary:
            "Monthly reviews provide in-depth assessment: risk assessment (Risk Committee — all risks), technical performance (Technical Committee), compliance review (Compliance Team), financial review (CFO), and key risk indicators (Risk Committee — KRI dashboard). The Council receives monthly reports and considers necessary action.",
          keyProvisions: [
            "Risk Assessment — Risk Committee — monthly risk report (all risks).",
            "Technical Performance — Technical Committee — monthly technical report.",
            "Compliance Review — Compliance Team — monthly compliance report.",
            "Financial Review — CFO — monthly financial report.",
            "Key Risk Indicators — Risk Committee — KRI dashboard.",
          ],
          references: ["Constitution v19.0", "L3-Article-VII §7.3", "L3-Article-V"],
        },
        {
          sectionNumber: "§7.5",
          h: "§7.5 · Quarterly Reviews",
          p: "Quarterly reviews are the core of governance oversight: reserve performance (Reserve Management), risk assessment (Risk Committee — comprehensive), compliance review (Compliance Team — comprehensive), technical performance (Technical Committee — comprehensive), audit findings (Audit Committee), Council review (institutional performance), and stress testing (Risk Committee).",
          title: "Quarterly Reviews — Strategic Operational Review",
          summary:
            "Quarterly reviews are the core of governance oversight: reserve performance (Reserve Management), risk assessment (Risk Committee — comprehensive), compliance review (Compliance Team — comprehensive), technical performance (Technical Committee — comprehensive), audit findings (Audit Committee), Council review (institutional performance), and stress testing (Risk Committee).",
          keyProvisions: [
            "Reserve Performance — Reserve Management — quarterly reserve report (adequacy and performance).",
            "Comprehensive Risk Assessment — Risk Committee — quarterly risk report.",
            "Comprehensive Compliance Review — Compliance Team — quarterly compliance report.",
            "Comprehensive Technical Review — Technical Committee — quarterly technical report.",
            "Audit Findings (Audit Committee) + Council Review (institutional performance, quarterly governance report) + Stress Testing (Risk Committee — stress test results).",
          ],
          references: ["Constitution v19.0", "L3-Article-VII §7.4", "L3-Article-II §2.3"],
        },
        {
          sectionNumber: "§7.6",
          h: "§7.6 · Annual Reviews",
          p: "Annual reviews are the foundation of accountability: policy review (Council — all policies), fee schedule review (Council), budget review (Council), financial audit (Audit Committee — financial statements), governance review (Council — effectiveness), reserve review (Reserve Management — comprehensive), Sharia compliance (Sharia Committee — full review), and institutional report (Council — comprehensive annual review).",
          title: "Annual Reviews — Comprehensive Institutional Review",
          summary:
            "Annual reviews are the foundation of accountability: policy review (Council — all policies), fee schedule review (Council), budget review (Council), financial audit (Audit Committee — financial statements), governance review (Council — effectiveness), reserve review (Reserve Management — comprehensive), Sharia compliance (Sharia Committee — full review), and institutional report (Council — comprehensive annual review).",
          keyProvisions: [
            "Policy Review — Council — all policies — policy review report.",
            "Fee Schedule Review — Council — all fees — fee schedule report.",
            "Budget Review — Council — annual budget — budget report.",
            "Financial Audit — Audit Committee — financial statements — annual audit report.",
            "Governance Review (Council — governance report) + Reserve Review (Reserve Management — annual reserve report) + Sharia Compliance (Sharia Committee — Sharia compliance certificate) + Institutional Report (Council — annual report).",
          ],
          references: ["Constitution v19.0", "L3-Article-VII §7.5", "L3-Article-II §2.5", "L3-Article-II §2.6", "L3-Article-III"],
        },
        {
          sectionNumber: "§7.7",
          h: "§7.7 · Five-Year Independent Review",
          p: "Every five years, an Independent Review Panel with no financial interest conducts a comprehensive assessment across six dimensions: reserve adequacy, algorithmic performance (Monetary Engine), governance effectiveness, regulatory compliance, technological security, and institutional review. The Panel publishes a full report with findings and recommendations.",
          title: "Five-Year Reviews — Comprehensive Independent Review",
          summary:
            "Every five years, an Independent Review Panel with no financial interest conducts a comprehensive assessment across six dimensions: reserve adequacy, algorithmic performance (Monetary Engine), governance effectiveness, regulatory compliance, technological security, and institutional review. The Panel publishes a full report with findings and recommendations.",
          keyProvisions: [
            "Reserve Adequacy — Independent Review Panel — reserve sufficiency and composition — reserve adequacy assessment.",
            "Algorithmic Performance — Independent Review Panel — Monetary Engine performance — algorithm assessment.",
            "Governance Effectiveness — Independent Review Panel — governance structure and practice — governance assessment.",
            "Regulatory Compliance — Independent Review Panel — legal and regulatory compliance — compliance assessment.",
            "Technological Security (security architecture and controls — security assessment) + Institutional Review (comprehensive assessment — comprehensive review report).",
          ],
          references: ["Constitution v19.0", "L1-Article-XVII", "L2-Article-VI"],
        },
        {
          sectionNumber: "§7.8",
          h: "§7.8 · Review Process and Coordination",
          p: "Every review follows an 8-step standard process: planning → data collection → analysis → findings → recommendations → reporting → action → follow-up. Reviews are coordinated to avoid duplication, ensure coverage, enable integration, and support decision-making. Findings are integrated into a single quarterly governance report for the Council.",
          title: "Standard Review Process and Review Coordination",
          summary:
            "Every review follows an 8-step standard process: planning → data collection → analysis → findings → recommendations → reporting → action → follow-up. Reviews are coordinated to avoid duplication, ensure coverage, enable integration, and support decision-making. Findings are integrated into a single quarterly governance report for the Council.",
          keyProvisions: [
            "Step 1 Planning: scope defined, timeline established, resources allocated, responsibilities assigned.",
            "Steps 2-3 Data Collection + Analysis: relevant data collected and verified, organized and analyzed; issues identified, trends assessed, conclusions developed.",
            "Steps 4-5 Findings + Recommendations: documented, categorized, prioritized, reviewed.",
            "Steps 6-7 Reporting + Action: report prepared, reviewed, finalized, published; actions identified, assigned, implemented, tracked.",
            "Step 8 Follow-up: implementation verified, effectiveness assessed, issues resolved, lessons learned; inter-review coordination prevents duplication and ensures coverage.",
          ],
          references: ["Constitution v19.0", "L3-Article-VII §7.2", "L3-Article-VII §7.3", "L3-Article-VII §7.4", "L3-Article-VII §7.5", "L3-Article-VII §7.6", "L3-Article-VII §7.7", "L3-Article-II §2.2"],
        },
      ],
    },
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
    "MITHQAL is a Constitutional Settlement Institution. The Digital Settlement Infrastructure is one constitutional function of the Institution. If the underlying technology evolves or is replaced, the Institution persists. Technology is implementation; the Institution is identity.",
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

/* ================================================================== */
/* THE 8 CONSTITUTIONAL PRINCIPLES (JOZOUR Amendment + MITHQAL v19.0) */
/* ================================================================== */
/*
 * These are the eight non-negotiable invariants the Monetary Engine
 * enforces on every cycle. They are drawn verbatim from the JOZOUR, LLC
 * Operating Agreement Amendment dated July 31, 2026 and the MITHQAL
 * Constitution v19.0. They are distinct from the ten *interpretive*
 * principles enumerated in Article II above — those guide interpretation
 * when ambiguity exists; the eight below are non-amendable invariants
 * the engine cannot cross.
 *
 * Surfaces:
 *   - src/components/monetary-engine-explained.tsx (GuardrailsSection)
 *   - /legal/institutional-trust (cross-linked in §1.4 commentary)
 *   - /legal/indemnification (Manager indemnification scope)
 */

export interface ConstitutionalPrinciple {
  /** stable slug, e.g. "p1-reserve-requirement" */
  id: string;
  /** constitutional number, e.g. "Principle 1" */
  number: string;
  /** short heading */
  title: string;
  /** one-line invariant statement (verbatim from JOZOUR Amendment) */
  invariant: string;
  /** operational elaboration */
  detail: string;
  /** whether the principle is non-amendable (all 8 are) */
  frozen: true;
}

export const CONSTITUTIONAL_PRINCIPLES: ConstitutionalPrinciple[] = [
  {
    id: "p1-reserve-requirement",
    number: "Principle 1",
    title: "100%+ Reserve Requirement",
    invariant:
      "Reserve Value ≥ Supply Value at all times. Every MTQ is fully backed by reserves, on-chain verifiable, on every cycle.",
    detail:
      "The reserve ratio never falls below 100%. Minting is permitted only upon verified deposit of equivalent value; the engine refuses any minting instruction that would push the reserve ratio below 100%. The Multi-Sig Safe blocks any action that would violate this invariant.",
    frozen: true,
  },
  {
    id: "p2-no-discretionary-minting",
    number: "Principle 2",
    title: "No Discretionary Minting",
    invariant:
      "Minting is permitted only upon verified deposit of equivalent value. No algorithmic expansion, no council-issued units, no emergency-liquidity printing.",
    detail:
      "MTQ supply is determined entirely by market demand — never by a council vote, never by an algorithmic expansion policy, never by an emergency-liquidity decision. The Monetary Engine will not mint a single unit without a verified deposit of equivalent value backing it.",
    frozen: true,
  },
  {
    id: "p3-no-lending-of-reserves",
    number: "Principle 3",
    title: "No Lending of Reserves",
    invariant:
      "Reserves are never lent, staked, or rehypothecated. No leverage, no fractional-reserve lending, no rehypothecation. Reserves sit idle, by constitutional design.",
    detail:
      "Settlement reserves are not available for yield generation, repo, securities lending, staking, or any other use that would encumber them. They are held for one purpose: redemption of MTQ units on demand. Any use that would subordinate the redemption claim is prohibited.",
    frozen: true,
  },
  {
    id: "p4-no-commingling",
    number: "Principle 4",
    title: "No Commingling",
    invariant:
      "Yield assets never mix with settlement reserves. Each layer is segregated: settlement reserves, operational funds, and any yield-bearing assets are kept in separate custody.",
    detail:
      "Settlement reserves, operational funds, and yield-bearing assets are held in separate custody accounts. There is no operational mechanism — no council vote, no administrative action, no emergency provision — that can move value between these layers in a way that would subordinate the redemption claim.",
    frozen: true,
  },
  {
    id: "p5-deterministic-monetary-engine",
    number: "Principle 5",
    title: "Deterministic Monetary Engine",
    invariant:
      "Identical inputs produce identical outputs. The Monetary Engine is an algorithm — not a council, not an ML model, not a market-making desk. Every NAV computation is reproducible.",
    detail:
      "The Monetary Engine is a deterministic function: given the same reserve composition, the same oracle prices, and the same supply, it produces the same NAV — every time, everywhere, by every calculator. There is no discretion, no parameter tuning by the council, no model selection by an operator.",
    frozen: true,
  },
  {
    id: "p6-institutional-neutrality",
    number: "Principle 6",
    title: "Institutional Neutrality",
    invariant:
      "No political, economic, or jurisdictional alignment. A settlement between any two participants settles with the same finality, cost, and speed regardless of geography or politics.",
    detail:
      "The Institution does not take sides, set monetary policy, speculate, intervene, or favour any jurisdiction or participant. Sanctions compliance is mandatory and neutral — a legal obligation, not a political endorsement. All eligible participants are treated equally: same fees, same redemption rights, same settlement rules.",
    frozen: true,
  },
  {
    id: "p7-full-redeemability",
    number: "Principle 7",
    title: "Full Redeemability",
    invariant:
      "Every unit is redeemable on demand. Redemption is not subject to discretionary approval and is never suspended except in constitutional emergency (and even then, only by a defined, time-limited process).",
    detail:
      "Every MTQ holder is entitled to redeem their units for proportional reserves at any time. Redemption is not subject to discretionary approval, gating, or suspension. In a constitutional emergency, redemption may be paused only by the Emergency Custodian and only for a defined, time-limited period during which the Custodian must convene a new Council within 60 days.",
    frozen: true,
  },
  {
    id: "p8-gold-as-constitutional-anchor",
    number: "Principle 8",
    title: "Gold as Constitutional Anchor",
    invariant:
      "Gold remains the permanent constitutional monetary anchor. Bullion preservation: gold is liquidated only after all superior reserve tiers are exhausted. Silver is the secondary bullion asset.",
    detail:
      "Gold is the permanent constitutional anchor of the MITHQAL reserve composition. The bullion layer (15–25% of total reserves) is allocated dynamically between gold (60–95% of bullion) and silver (5–40% of bullion), but gold cannot be removed from the bullion layer. In any liquidation cascade, gold is liquidated only after all superior reserve tiers (fiat, stablecoins, silver) are exhausted.",
    frozen: true,
  },
];
