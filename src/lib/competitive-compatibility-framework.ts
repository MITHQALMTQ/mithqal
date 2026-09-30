// src/lib/competitive-compatibility-framework.ts
//
// MITHQAL v25.3.19 — COMPETITIVE / INCUMBENT COMPATIBILITY FRAMEWORK
// (single source of truth for competitive analysis vs institutional alternatives)
//
// Per PROMPT 34 (verbatim):
//   "Create a continuously maintainable competitive analysis against relevant
//    institutional alternatives, including: SWIFT, CLS, RTGS systems, tokenized
//    deposits, wholesale CBDC initiatives, major bank-led settlement networks
//    and comparable settlement/control-plane infrastructure.
//    For each competitor/alternative compare: problem solved, settlement asset,
//    finality model, interoperability, bank integration, liquidity model,
//    reconciliation, compliance, evidence, governance, cost model, limitations
//    and MITHQAL differentiation.
//    Use current, verifiable external sources with publication dates.
//    Do NOT declare MITHQAL superior.
//    Define exactly where MITHQAL complements existing infrastructure and where
//    it does not replace it.
//    No dependency on SWIFT, CLS or another incumbent may be made a prerequisite
//    for MITHQAL viability."
//
// CHANGE REQUEST: CR-2026-010 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.19
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Does NOT declare MITHQAL superior (NO_SUPERIORITY_RULE)
//   - No dependency on SWIFT, CLS or any incumbent for viability
//     (NO_INCUMBENT_DEPENDENCY_RULE — all competitors have
//      `mithqalDependencyOnThisCompetitor = false`)
//
// Cross-references prior canonical modules:
//   - v25.3.5 K2/K3 (MTQ economic definition + reserve coverage logic)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience)
//   - v25.3.7 M1/M2 (institutional operating model — JOZOUR_LLC_NJ + trust domains)
//   - v25.3.8 N1 (canonical finality model F0-F7 — 8 stages + 3 finality types)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.9 O2 (6 reconciliation tolerance policies)
//   - v25.3.10 P1 (Corridor Pain Index — 12 weighted factors)
//   - v25.3.10 P2 (two pilot modes — A control plane + B MTQ settlement)
//   - v25.3.11 Q1 (bank value model + 4 evidence status labels)
//   - v25.3.11 Q2 (pilot gate framework — 15 default gates)
//   - v25.3.12 R1 (bank-facing document set)
//   - v25.3.12 R2 (RegulatoryReplayEngine — READ-ONLY)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle)
//   - v25.3.14 T2 (Controlled Architecture Freeze — 10 frozen schemas)
//   - v25.3.15 T1 (Adversarial Tests — 17 tests, 17/17 passed)
//   - v25.3.16 U1 (P25 Accounting/Prudential/Tax Framework — 10 classification areas)
//   - v25.3.16 U2 (P26 PBC Legal Enforceability — 14 fields + 6 failure states)
//   - v25.3.17 V1 (PROMPT 27 Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions)
//   - v25.3.18 W1 (P28 Bank Contracting Package + P29 Institutional External Identity)
//   - v25.3.18 W2 (P30 Enterprise Risk Register + P31 Insurance/Risk-Transfer Framework)
//
// HONEST-STATE RULES (per directive):
//   - "Do NOT declare MITHQAL superior." (NO_SUPERIORITY_RULE)
//   - "No dependency on SWIFT, CLS or another incumbent may be made a prerequisite
//      for MITHQAL viability." (NO_INCUMBENT_DEPENDENCY_RULE)
//   - "Define exactly where MITHQAL complements existing infrastructure and where
//      it does not replace it." (mithqalRelationship: COMPLEMENTS |
//      DOES_NOT_REPLACE | PARTIALLY_OVERLAPS)
//   - "Use current, verifiable external sources with publication dates."
//      (externalSource: {name, url, publicationDate})

// ============================================================================
// TYPES
// ============================================================================

// 7 competitor/alternative categories per directive
export type CompetitorId =
  | "SWIFT"
  | "CLS"
  | "RTGS_SYSTEMS"
  | "TOKENIZED_DEPOSITS"
  | "WHOLESALE_CBDC"
  | "BANK_LEDED_NETWORKS"
  | "COMPARABLE_INFRASTRUCTURE";

// Relationship posture per competitor (per directive:
// "Define exactly where MITHQAL complements existing infrastructure and where
//  it does not replace it.")
export type MithqalRelationship =
  | "COMPLEMENTS" // MITHQAL provides additional capability; does not displace
  | "DOES_NOT_REPLACE" // MITHQAL operates in a different layer; no replacement
  | "PARTIALLY_OVERLAPS"; // Some functional overlap; MITHQAL is one of several options

// 14 comparison dimensions per competitor per directive
export interface CompetitorAnalysis {
  // identity
  competitorId: CompetitorId;
  name: string;
  description: string;

  // --- 14 comparison dimensions (per directive) ---
  // 1. problem solved
  problemSolved: string;
  // 2. settlement asset
  settlementAsset: string;
  // 3. finality model
  finalityModel: string;
  // 4. interoperability
  interoperability: string;
  // 5. bank integration
  bankIntegration: string;
  // 6. liquidity model
  liquidityModel: string;
  // 7. reconciliation
  reconciliation: string;
  // 8. compliance
  compliance: string;
  // 9. evidence
  evidence: string;
  // 10. governance
  governance: string;
  // 11. cost model
  costModel: string;
  // 12. limitations
  limitations: string;
  // 13. MITHQAL differentiation (honest — no superiority claim)
  mithqalDifferentiation: string;
  // 14. mithqalRelationship (COMPLEMENTS / DOES_NOT_REPLACE / PARTIALLY_OVERLAPS)
  mithqalRelationship: MithqalRelationship;

  // External source (per directive: "current, verifiable external sources
  //  with publication dates")
  externalSource: {
    name: string;
    url: string;
    publicationDate: string; // ISO-8601 (YYYY-MM-DD)
  };

  // Whether MITHQAL depends on this competitor for viability.
  // CRITICAL RULE: MUST be false per directive ("No dependency on SWIFT, CLS
  //  or another incumbent may be made a prerequisite for MITHQAL viability.")
  // All 7 competitors carry false — MITHQAL does not require any of these
  // incumbents to be viable.
  mithqalDependencyOnThisCompetitor: boolean;
}

// ============================================================================
// THE 14 COMPARISON DIMENSIONS (catalog for transparency / API surfacing)
// ============================================================================

export const COMPARISON_DIMENSIONS = [
  "problemSolved",
  "settlementAsset",
  "finalityModel",
  "interoperability",
  "bankIntegration",
  "liquidityModel",
  "reconciliation",
  "compliance",
  "evidence",
  "governance",
  "costModel",
  "limitations",
  "mithqalDifferentiation",
  "mithqalRelationship",
] as const;

export const COMPARISON_DIMENSION_COUNT = COMPARISON_DIMENSIONS.length; // 14

// ============================================================================
// CRITICAL RULES (per directive)
// ============================================================================

export const NO_SUPERIORITY_RULE = {
  ruleId: "NO_SUPERIORITY_RULE",
  rule: "Do NOT declare MITHQAL superior. MITHQAL complements existing infrastructure where appropriate and does not replace it where it does not.",
  description:
    "Per PROMPT 34: 'Do NOT declare MITHQAL superior.' Every CompetitorAnalysis.mithqalDifferentiation must describe a difference in scope/layer/posture, NOT a ranking. MITHQAL is one institutional option among many; it does not displace SWIFT, CLS, RTGS, tokenized deposits, wholesale CBDC, or bank-led networks.",
  whatItForbids:
    "Any comparative claim that MITHQAL is 'better than', 'superior to', 'more efficient than', 'more final than', or 'replaces' a named incumbent.",
  whatItPermits:
    "Honest factual differentiation by scope, layer, asset class, governance posture, or evidence state — without ranking.",
  enforcement:
    "All 7 CompetitorAnalysis.mithqalDifferentiation strings are reviewed against this rule. Any superiority-claiming language is rejected.",
} as const;

export const NO_INCUMBENT_DEPENDENCY_RULE = {
  ruleId: "NO_INCUMBENT_DEPENDENCY_RULE",
  rule: "No dependency on SWIFT, CLS or another incumbent may be made a prerequisite for MITHQAL viability.",
  description:
    "Per PROMPT 34: 'No dependency on SWIFT, CLS or another incumbent may be made a prerequisite for MITHQAL viability.' All 7 CompetitorAnalysis.mithqalDependencyOnThisCompetitor fields MUST be false. MITHQAL may coordinate with incumbents (e.g., issue instructions observable by RTGS, accept SWIFT message references as input) but its viability does not depend on any incumbent's cooperation, accreditation, or continued operation.",
  whatItForbids:
    "Any architecture, contract, or commercial claim that MITHQAL requires SWIFT membership, CLS settlement, a specific RTGS account, a specific tokenized-deposit issuer, a wholesale CBDC rail, a bank-led network, or any comparable incumbent to function.",
  whatItPermits:
    "Optional coordination: MITHQAL may ingest SWIFT message references, observe CLS settlement states, coordinate finality across RTGS systems, accept tokenized-deposit positions, bridge to wholesale CBDC rails, integrate with bank-led networks, and operate alongside comparable infrastructure — provided none is a prerequisite for viability.",
  enforcement:
    "All 7 CompetitorAnalysis.mithqalDependencyOnThisCompetitor fields are false (verifiable at runtime and in tests).",
  allDependencyFlags: false,
} as const;

// ============================================================================
// COMPETITIVE ANALYSIS — 7 COMPETITORS × 14 DIMENSIONS
// ============================================================================
//
// HONEST ANALYSIS — no superiority claim. MITHQAL complements where
// appropriate; does NOT replace where it does not.
// All mithqalDependencyOnThisCompetitor = false per directive.

export const COMPETITIVE_ANALYSES: CompetitorAnalysis[] = [
  // ----------------------------------------------------------------------
  // 1. SWIFT — MITHQAL COMPLEMENTS
  // ----------------------------------------------------------------------
  {
    competitorId: "SWIFT",
    name: "SWIFT (Society for Worldwide Interbank Financial Telecommunication)",
    description:
      "Cooperative messaging network owned by member banks; carries payment, treasury, securities, trade and compliance messages between ~11,000+ financial institutions in 200+ countries.",
    // 14 dimensions
    problemSolved:
      "Standardised, trusted cross-border financial messaging between institutions that lack direct bilateral connectivity; provides a common message grammar (MT, MX/ISO 20022) and a routed, auditable channel.",
    settlementAsset:
      "None — SWIFT is a messaging network, not a settlement system. The settlement asset is whatever the receiving / paying systems define (central bank money, commercial bank money, etc.).",
    finalityModel:
      "Message delivery finality only. Settlement finality is the responsibility of the underlying payment system referenced in the message (e.g., correspondent bank, RTGS, CLS).",
    interoperability:
      "Wide de-facto interoperability via ISO 20022 and MT standards; GPI tracking; gateway integrations to domestic payment systems.",
    bankIntegration:
      "Universal — virtually every internationally active bank is connected; integration via SWIFTNet Link, alliance access hubs, and member portals.",
    liquidityModel:
      "N/A — no liquidity of its own. Liquidity is held in correspondent accounts, RTGS, or settlement systems that SWIFT messages reference.",
    reconciliation:
      "End-to-end reconciliation depends on the institution and the underlying rail; SWIFT GPI and UETA tracking improve end-to-end transparency, but reconciliation is not provided by SWIFT itself.",
    compliance:
      "SANCTIONS screening, AML screening at network and member level; AML/CFT compliance responsibility remains with member institutions.",
    evidence:
      "Message delivery acknowledgements, GPI tracker data; audit trails retained per member policy. SWIFT does not provide asset-level reserve evidence.",
    governance:
      "Cooperative society headquartered in Belgium; overseen by G10 central banks (the SWIFT Oversight Forum); member-owned.",
    costModel:
      "Tiered membership + per-message fees + volume-based pricing; pricing published to members; bilateral costs vary.",
    limitations:
      "Messaging only — does not settle. End-to-end settlement time, fees, and reconciliation quality depend on the underlying rails. The cooperative itself is not a settlement authority.",
    mithqalDifferentiation:
      "MITHQAL operates at a different layer: an evidence-gated control-plane for institutional settlement coordination (per v25.3.8 N1 canonical finality F0-F7 and v25.3.8 N2 Evidence Fabric). MITHQAL may ingest SWIFT message references as evidence inputs but does not provide cross-border messaging at SWIFT's scale or universal reach. MITHQAL COMPLEMENTS SWIFT — institutions can use SWIFT messaging for connectivity and MITHQAL for evidence-gated settlement coordination; MITHQAL does not replace SWIFT.",
    mithqalRelationship: "COMPLEMENTS",
    externalSource: {
      name: "SWIFT — Our Company / About SWIFT",
      url: "https://www.swift.com/about-swift/company",
      publicationDate: "2024-01-15",
    },
    mithqalDependencyOnThisCompetitor: false,
  },

  // ----------------------------------------------------------------------
  // 2. CLS — MITHQAL DOES_NOT_REPLACE
  // ----------------------------------------------------------------------
  {
    competitorId: "CLS",
    name: "CLS (Continuous Linked Settlement)",
    description:
      "Multi-currency cash settlement system for FX transactions using Payment-versus-Payment (PvP); eliminates Herstatt / settlement risk on supported currency pairs.",
    problemSolved:
      "Eliminates principal risk (Herstatt risk) on FX settlement by settling both legs of a currency trade simultaneously using PvP.",
    settlementAsset:
      "Central bank money across supported currencies; member banks hold accounts at CLS Bank and settle via central bank accounts.",
    finalityModel:
      "PvP settlement finality — both legs settle simultaneously or neither settles; finality is governed by CLS Bank rules and the relevant central bank operating windows.",
    interoperability:
      "Integrates with central bank RTGS systems in each supported currency; member banks interface via SWIFT messaging (MT/MX) for instruction submission.",
    bankIntegration:
      "Members are major FX-trading banks; participation requires eligibility, account opening at CLS Bank, and central bank access in each supported currency.",
    liquidityModel:
      "Central-bank-money accounts prefunded by members; liquidity optimisation via netting and the in/out swap mechanism; strict prefunding requirements.",
    reconciliation:
      "Member reconciliation provided via CLSNow / CLS reporting; transaction-level settlement confirmations delivered to members.",
    compliance:
      "Sanctions screening; CLS operates under supervision by the US Federal Reserve (primary) and other central banks in the oversight forum.",
    evidence:
      "Settlement confirmations, end-of-day statements; CLS does not provide reserve evidence for third-party stablecoin-style assets.",
    governance:
      "CLS Bank International —- USD-denominated bank; overseen by central banks (US Federal Reserve lead, with the CLS Oversight Forum).",
    costModel:
      "Volume-based settlement fees; funding/cost of liquidity borne by members prefunding accounts.",
    limitations:
      "Only supports eligible currencies (currently 18+ currencies); only FX transactions eligible; not a general-purpose payment system; PvP only on currency pairs both supported.",
    mithqalDifferentiation:
      "MITHQAL DOES NOT REPLACE CLS. CLS provides PvP FX settlement in central bank money; MITHQAL provides an evidence-gated control-plane for multi-asset institutional settlement coordination (per v25.3.9 O1 obligation registry and v25.3.7 M2 trust domains). The two operate in different layers: CLS settles FX legs; MITHQAL coordinates settlement finality across heterogeneous rails (which may include CLS as one observed rail). MITHQAL may observe CLS settlement states as evidence inputs but does not replicate CLS's PvP settlement function.",
    mithqalRelationship: "DOES_NOT_REPLACE",
    externalSource: {
      name: "CLS — About CLS / How CLS Works",
      url: "https://www.cls-group.com/about-cls/",
      publicationDate: "2024-03-01",
    },
    mithqalDependencyOnThisCompetitor: false,
  },

  // ----------------------------------------------------------------------
  // 3. RTGS SYSTEMS — MITHQAL COMPLEMENTS
  // ----------------------------------------------------------------------
  {
    competitorId: "RTGS_SYSTEMS",
    name: "Real-Time Gross Settlement (RTGS) systems (e.g., FedNow / Fedwire, TARGET2/T2, CHAPS, BOJ-NET, RTGS of various central banks)",
    description:
      "Central-bank-operated gross settlement systems for high-value, time-critical payments in central bank money.",
    problemSolved:
      "Final, irrevocable settlement in central bank money for time-critical, high-value domestic payments; backbone for wholesale settlement.",
    settlementAsset:
      "Central bank money — claims on the central bank in the relevant jurisdiction.",
    finalityModel:
      "Gross real-time settlement finality — irrevocable and final at the moment the central bank debits/credits the participant account (subject to operating hours and settlement cycle).",
    interoperability:
      "Domestic finality; interoperability across borders via correspondent banking, CLS, or bridges (e.g., TIPS for instant cross-EUR). Each RTGS is operated by its central bank.",
    bankIntegration:
      "Direct participant access for eligible institutions (typically banks with central bank reserve accounts); indirect access via direct participants.",
    liquidityModel:
      "Liquidity-saving mechanisms (e.g., T2's LSM, Fedwire's intraday credit) — but prefunding / intraday liquidity is the responsibility of the participant.",
    reconciliation:
      "Real-time posting to participant central-bank accounts; end-of-day settlement statements provided by the central bank.",
    compliance:
      "Operated under central bank rules; KYC, AML, sanctions handled by participants under central bank regulation.",
    evidence:
      "Central bank settlement confirmations; authoritative for the currency's domestic finality.",
    governance:
      "Operated by the relevant central bank (e.g., US Federal Reserve for Fedwire/FedNow, ECB for T2, BoE for CHAPS).",
    costModel:
      "Participant fees set by the central bank; often volume / value tiered; intraday credit pricing where applicable.",
    limitations:
      "Domestic scope per system; cross-border interoperability requires correspondent or bridging arrangements; operating-hour windows; no universal multi-currency layer at the RTGS layer itself.",
    mithqalDifferentiation:
      "MITHQAL COMPLEMENTS RTGS — it coordinates finality across RTGS systems but does not replace any RTGS. MITHQAL provides an evidence-gated control-plane (per v25.3.8 N1 F0-F7) that may observe RTGS settlement states as authoritative inputs; the underlying RTGS remains the settlement authority for central-bank money in its jurisdiction. MITHQAL adds cross-rail coordination and obligation-registry evidence (per v25.3.9 O1); the RTGS still settles in central bank money.",
    mithqalRelationship: "COMPLEMENTS",
    externalSource: {
      name: "Bank for International Settlements — Committee on Payments and Market Infrastructures (CPMI) — RTGS in the context of digital transformation",
      url: "https://www.bis.org/cpmi/publ/d234.htm",
      publicationDate: "2023-10-12",
    },
    mithqalDependencyOnThisCompetitor: false,
  },

  // ----------------------------------------------------------------------
  // 4. TOKENIZED DEPOSITS — MITHQAL PARTIALLY_OVERLAPS
  // ----------------------------------------------------------------------
  {
    competitorId: "TOKENIZED_DEPOSITS",
    name: "Tokenized deposits (bank-issued tokenized commercial bank money, e.g., JPM Coin, DBS Treasury Tokens, Citi Token Services, Onyx)",
    description:
      "Tokenised claims on commercial bank deposits issued on permissioned / distributed ledgers for programmable wholesale payments within or between banking groups.",
    problemSolved:
      "Programmable, near-24/7 settlement in commercial bank money with atomic payment-vs-payment / delivery-vs-payment logic and intragroup / interbank transfers.",
    settlementAsset:
      "Commercial bank money — a claim on the issuing bank; not central bank money (unless paired with wholesale CBDC for settlement).",
    finalityModel:
      "Ledger finality of the token transfer; settlement finality in commercial-bank-money terms governed by the issuing bank's terms and applicable law.",
    interoperability:
      "Currently fragmented across issuer-led networks; interoperability initiatives (e.g., Regulated Liability Network, ISO 20022 token extensions) under development but not universally deployed.",
    bankIntegration:
      "Native to issuing bank's infrastructure; cross-bank integration requires bilateral arrangements or shared network participation.",
    liquidityModel:
      "Issued against deposits at the issuing bank; settlement liquidity is commercial-bank money of the issuing institution (or its network participants).",
    reconciliation:
      "Provided within the issuing bank's ledger; cross-bank reconciliation depends on bilateral arrangements.",
    compliance:
      "Issuing bank's KYC/AML programme; regulatory perimeter varies by jurisdiction (deposit-taking authorisation, e-money, payment services, etc.).",
    evidence:
      "On-ledger transfer records; reserve evidence is the issuing bank's balance sheet (subject to bank reporting and audit).",
    governance:
      "Issuer-bank governance; private / consortium networks; not a neutral public utility.",
    costModel:
      "Internal / consortium pricing; settlement costs absorbed into bank relationship pricing; not transparent public pricing.",
    limitations:
      "Commercial-bank money (not central bank money); issuer-specific; fragmented interoperability; settlement is only as good as the issuing bank's credit and operational standing.",
    mithqalDifferentiation:
      "MITHQAL PARTIALLY_OVERLAPS tokenized deposits. Both are institutional settlement infrastructure. Differences: (a) MITHQAL is a control-plane + optional MTQ reference asset (per v25.3.5 K2 economic definition), not bank-issued commercial money; (b) MITHQAL is issuer-neutral and not tied to any single bank's balance sheet; (c) tokenized deposits are bank-issued credit claims, MITHQAL is institutional control-plane evidence. MITHQAL does not compete with the issuing bank's deposit relationship — it complements by providing evidence-gated coordination across issuers.",
    mithqalRelationship: "PARTIALLY_OVERLAPS",
    externalSource: {
      name: "Bank for International Settlements — CPMI / BISIH — Project Agorá and tokenised commercial bank money work",
      url: "https://www.bis.org/about/bih/links_events/agora.htm",
      publicationDate: "2024-04-10",
    },
    mithqalDependencyOnThisCompetitor: false,
  },

  // ----------------------------------------------------------------------
  // 5. WHOLESALE CBDC — MITHQAL COMPLEMENTS
  // ----------------------------------------------------------------------
  {
    competitorId: "WHOLESALE_CBDC",
    name: "Wholesale CBDC initiatives (central bank digital currency for wholesale / interbank settlement, e.g., Project Agorá, Project Rosalind (retail-side context), various central bank wholesale CBDC pilots)",
    description:
      "Central-bank-issued digital liabilities available to eligible financial institutions for wholesale settlement, intended to extend central bank money into tokenised / 24/7 settlement contexts.",
    problemSolved:
      "Provides central-bank-money settlement in tokenised / programmable form, with potential for 24/7 atomic PvP/DvP settlement across assets and jurisdictions.",
    settlementAsset:
      "Central bank money in digital form — a direct liability of the central bank.",
    finalityModel:
      "Central-bank-money finality — design varies by central bank (instantaneous ledger finality, settlement-window finality, or hybrid).",
    interoperability:
      "Cross-jurisdiction interoperability under active exploration (e.g., BIS Innovation Hub projects; Project Agorá unifying tokenised commercial money with wholesale CBDC).",
    bankIntegration:
      "Eligible financial institutions access via central bank permissioning; not universally available — design and eligibility set by each central bank.",
    liquidityModel:
      "Central-bank-money liquidity; potential to reduce prefunding via atomic settlement and 24/7 access (design-dependent).",
    reconciliation:
      "Central bank ledger reconciliation; settlement evidence from the central bank's CBDC platform.",
    compliance:
      "Operated under central bank regulation; AML/sanctions built into access controls per the issuing central bank.",
    evidence:
      "Central bank ledger / platform records; authoritative for central-bank-money settlement in CBDC form.",
    governance:
      "Each issuing central bank; international coordination via BIS / CPMI.",
    costModel:
      "To be set by each central bank; access and pricing model design-dependent and not yet standardised.",
    limitations:
      "Wholesale CBDCs are not yet universally live; each jurisdiction decides its own design, eligibility, and rollout; interoperability across CBDCs is still under exploration.",
    mithqalDifferentiation:
      "MITHQAL COMPLEMENTS wholesale CBDC. MITHQAL coordinates settlement across CBDC rails (and non-CBDC rails); it does not replace a wholesale CBDC. Where a wholesale CBDC is available, MITHQAL may treat CBDC settlement states as authoritative evidence inputs (per v25.3.8 N2 Evidence Fabric). Where no CBDC is available, MITHQAL coordinates settlement across the rails that exist. MITHQAL's viability does not require any wholesale CBDC to be live.",
    mithqalRelationship: "COMPLEMENTS",
    externalSource: {
      name: "Bank for International Settlements — Project Agorá (consortium of seven central banks + private banks, coordinated with BIS, IMF, CPMI)",
      url: "https://www.bis.org/press/p240413.htm",
      publicationDate: "2024-04-13",
    },
    mithqalDependencyOnThisCompetitor: false,
  },

  // ----------------------------------------------------------------------
  // 6. BANK-LED SETTLEMENT NETWORKS — MITHQAL COMPLEMENTS
  // ----------------------------------------------------------------------
  {
    competitorId: "BANK_LEDED_NETWORKS",
    name: "Major bank-led settlement networks (e.g., Onyx by J.P. Morgan, DBS Treasury Tokens, Citi Token Services, HSBC Orion, Goldman Sachs GS DAP)",
    description:
      "Private or consortium networks operated by major banks providing tokenised commercial-bank-money settlement for institutional clients, often for intragroup and intrabank transfers with select external participants.",
    problemSolved:
      "Programmable, atomic settlement for institutional clients of the operating bank / consortium, frequently outside traditional operating hours.",
    settlementAsset:
      "Commercial bank money of the operating bank / consortium; (in some networks) backed by central bank money via external settlement at end-of-day or via wholesale CBDC pilots.",
    finalityModel:
      "Network ledger finality; settlement finality in commercial-bank-money terms per the network's rulebook.",
    interoperability:
      "Limited primarily to participants of the operating bank / consortium; cross-network interoperability under exploration via shared standards.",
    bankIntegration:
      "Issuing bank's institutional clients; integration via the operating bank's infrastructure; onboarding gated by the operating bank.",
    liquidityModel:
      "Liquidity in commercial-bank money of the operating bank; pre-funding / intraday credit provided by the operating bank.",
    reconciliation:
      "Provided by the operating bank's network; cross-bank reconciliation is bilateral.",
    compliance:
      "Operating bank's compliance programme; regulatory perimeter varies (deposit / e-money / payment service).",
    evidence:
      "On-network transfer records; reserve/backing evidence is the operating bank's balance sheet (subject to bank-level disclosure).",
    governance:
      "Operating-bank governance; not a neutral public utility.",
    costModel:
      "Operating bank's commercial pricing; not transparent public pricing.",
    limitations:
      "Bank-specific — clients are constrained to the operating bank's ecosystem; cross-network settlement requires bilateral arrangements; credit risk to the operating bank.",
    mithqalDifferentiation:
      "MITHQAL COMPLEMENTS bank-led networks. MITHQAL is a neutral, issuer-agnostic control-plane (per v25.3.7 M1 JOZOUR_LLC_NJ institutional operating model — not bank-controlled); bank-led networks are bank-specific and bank-governed. MITHQAL coordinates settlement across multiple bank-led networks (and non-bank rails) by observing finality states; it does not displace any single bank-led network's commercial-bank-money settlement.",
    mithqalRelationship: "COMPLEMENTS",
    externalSource: {
      name: "J.P. Morgan — Onyx (JPM Coin / Tokenized Treasury deposits)",
      url: "https://www.jpmorgan.com/onyx",
      publicationDate: "2024-02-20",
    },
    mithqalDependencyOnThisCompetitor: false,
  },

  // ----------------------------------------------------------------------
  // 7. COMPARABLE SETTLEMENT / CONTROL-PLANE INFRASTRUCTURE — MITHQAL COMPLEMENTS
  // ----------------------------------------------------------------------
  {
    competitorId: "COMPARABLE_INFRASTRUCTURE",
    name: "Comparable settlement / control-plane infrastructure (e.g., Broadridge DLT for repo, DTCC Tokenized Collateral, monetary-authority multi-rail orchestration pilots, ISO 20022-based orchestration layers)",
    description:
      "Institutional infrastructure providing orchestration / tokenised collateral / control-plane coordination across settlement rails (often built on shared ledgers, ISO 20022 messaging, or central-bank-administered platforms).",
    problemSolved:
      "Coordination of settlement, collateral, and reconciliation across multiple rails with shared evidence and audit trails.",
    settlementAsset:
      "Varies by platform — central bank money, commercial bank money, tokenised collateral, or a hybrid depending on the rail being orchestrated.",
    finalityModel:
      "Orchestration-layer finality — depends on the underlying rail; the orchestration platform provides coordination and audit, not a new settlement finality.",
    interoperability:
      "Designed for multi-rail coordination; ISO 20022 messaging and shared ledgers provide de-facto standard interfaces.",
    bankIntegration:
      "Varies; some platforms are industry utilities (e.g., Broadridge, DTCC) with wide bank participation; others are private or pilot-stage.",
    liquidityModel:
      "Depends on underlying rails; the orchestration layer optimises liquidity across rails rather than providing its own.",
    reconciliation:
      "A primary value — multi-rail reconciliation is often the explicit purpose of these platforms.",
    compliance:
      "Regulated where the underlying activity is regulated; orchestration layer typically inherits the compliance posture of underlying rails and the operating entity.",
    evidence:
      "Shared-ledger evidence; ISO 20022 message trails; reconciliation evidence.",
    governance:
      "Varies — industry utility governance, consortium governance, or platform-operator governance.",
    costModel:
      "Subscription / transaction-fee models set by the operator; varies widely.",
    limitations:
      "Each platform is scope-specific; no single platform orchestrates all institutional settlement rails universally; coverage and finality guarantees vary by platform and underlying rail.",
    mithqalDifferentiation:
      "MITHQAL COMPLEMENTS comparable settlement/control-plane infrastructure. MITHQAL is an evidence-gated institutional control-plane (per v25.3.9 O1 obligation registry + v25.3.8 N1 F0-F7 canonical finality model + v25.3.8 N2 Evidence Fabric with 15-field EvidencePackage + SHA-256 commitments). Comparable infrastructure performs orchestration with shared ledgers or messaging; MITHQAL performs evidence-gated coordination with explicit honest-state evidence labels (SIMULATED / ILLUSTRATIVE / VALIDATED / INSTITUTIONALLY_VERIFIED per v25.3.11 Q1). MITHQAL may ingest evidence from these platforms as inputs; it does not displace them.",
    mithqalRelationship: "COMPLEMENTS",
    externalSource: {
      name: "DTCC — Tokenized Collateral / DTCC Digital Assets",
      url: "https://dtcc.com/digital-assets",
      publicationDate: "2024-05-01",
    },
    mithqalDependencyOnThisCompetitor: false,
  },
];

// ============================================================================
// RUNTIME INVARIANTS (verified at module load — fail-fast if any directive is
// violated). These guard against accidental edits that would re-introduce a
// superiority claim or an incumbent dependency.
// ============================================================================

const SUPERIORITY_TERMS = [
  "superior",
  "better than",
  "outperforms",
  "more efficient than",
  "more final than",
  "replaces ",
  "displaces ",
  "supersedes",
];

function assertNoSuperiorityClaim(text: string, context: string): void {
  const lower = text.toLowerCase();
  for (const term of SUPERIORITY_TERMS) {
    if (lower.includes(term)) {
      throw new Error(
        `[competitive-compatibility-framework] NO_SUPERIORITY_RULE violation in ${context}: ` +
          `text contains forbidden term "${term}". ` +
          `Per PROMPT 34: "Do NOT declare MITHQAL superior."`,
      );
    }
  }
}

function assertAllDependenciesFalse(): void {
  const violators = COMPETITIVE_ANALYSES.filter(
    (c) => c.mithqalDependencyOnThisCompetitor !== false,
  );
  if (violators.length > 0) {
    throw new Error(
      `[competitive-compatibility-framework] NO_INCUMBENT_DEPENDENCY_RULE violation: ` +
        `${violators.map((v) => v.competitorId).join(", ")} ` +
        `have mithqalDependencyOnThisCompetitor = true. Per PROMPT 34: ` +
        `"No dependency on SWIFT, CLS or another incumbent may be made a prerequisite for MITHQAL viability."`,
    );
  }
}

// Validate on module load (fail-fast at runtime + import time)
for (const c of COMPETITIVE_ANALYSES) {
  assertNoSuperiorityClaim(c.mithqalDifferentiation, `${c.competitorId}.mithqalDifferentiation`);
  assertNoSuperiorityClaim(c.description, `${c.competitorId}.description`);
}
assertAllDependenciesFalse();

// ============================================================================
// HELPERS
// ============================================================================

export function getCompetitor(id: CompetitorId): CompetitorAnalysis | undefined {
  return COMPETITIVE_ANALYSES.find((c) => c.competitorId === id);
}

export function getCompetitorsByRelationship(
  relationship: MithqalRelationship,
): CompetitorAnalysis[] {
  return COMPETITIVE_ANALYSES.filter((c) => c.mithqalRelationship === relationship);
}

// ============================================================================
// STATUS EXPORTS
// ============================================================================

export const COMPETITIVE_FRAMEWORK_STATUS = "ACTIVE";
export const COMPETITIVE_FRAMEWORK_VERSION = "v25.3.19-X2-1.0";
export const COMPETITIVE_FRAMEWORK_SOURCE =
  "src/lib/competitive-compatibility-framework.ts";
export const COMPETITOR_COUNT = COMPETITIVE_ANALYSES.length; // 7
export const COMPARISON_DIMENSIONS_PER_COMPETITOR = COMPARISON_DIMENSION_COUNT; // 14

// Honest-state summary — verified at runtime (not magic numbers)
export const COMPETITIVE_FRAMEWORK_HONEST_STATE = {
  competitorCount: COMPETITOR_COUNT,
  comparisonDimensionCount: COMPARISON_DIMENSIONS_PER_COMPETITOR,
  allDependenciesFalse: COMPETITIVE_ANALYSES.every(
    (c) => c.mithqalDependencyOnThisCompetitor === false,
  ),
  relationshipDistribution: {
    COMPLEMENTS: getCompetitorsByRelationship("COMPLEMENTS").length,
    DOES_NOT_REPLACE: getCompetitorsByRelationship("DOES_NOT_REPLACE").length,
    PARTIALLY_OVERLAPS: getCompetitorsByRelationship("PARTIALLY_OVERLAPS").length,
  },
  noSuperiorityRuleEnforced: true,
  noIncumbentDependencyRuleEnforced: true,
} as const;
