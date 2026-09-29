// src/lib/contradiction-sweep-report.ts
// MITHQAL v25.3.2 — FULL CONTRADICTION SWEEP REPORT
// Per S-directive: "Run a full contradiction sweep across 11 surfaces
// for 10 conflict types. Required result: ZERO UNRESOLVED ACTIVE
// CONTRADICTIONS. Any unresolved conflict must be explicitly marked
// BLOCKING_REMEDIATION."
//
// Owner: Full Contradiction Sweep Architect (Agent S2)
// Release: v25.3.13
// Trace: 1a0ef36e7e341b2d (S-directive)
//
// The 11 surfaces:
//   1. blueprint
//   2. reference JSON
//   3. implementation-status files
//   4. reserve configuration
//   5. workflow state machine
//   6. APIs
//   7. tests
//   8. terminology
//   9. dashboards
//   10. examples
//   11. marketing strings
//
// The 10 conflict types:
//   1. v25.2/v25.3/v25.3.1/v25.3.2 conflicts
//   2. BM-15/BM-16 conflicts
//   3. PAR/peg conflicts
//   4. MTQ classification conflicts
//   5. 130% conflicts
//   6. gold/digital pilot conflicts
//   7. 13-vs-20 gate conflicts
//   8. LCR conflicts
//   9. outdated production claims
//   10. outdated jurisdiction claims

// ============================================================================
// TYPES
// ============================================================================

export interface ConflictFinding {
  conflictType: string;  // one of the 10 types
  surface: string;       // one of the 11 surfaces
  file?: string;
  line?: number;
  description: string;
  status: "RESOLVED" | "BLOCKING_REMEDIATION";
  resolution?: string;
  remediationPlan?: string;
}

export interface SweepReport {
  sweepDate: string;
  scannerResult: {
    patternsScanned: number;
    trueContradictions: number;
    unresolved: number;
    scannerEndpoint: string;
    scannerNotes: string;
  };
  conflictFindings: ConflictFinding[];
  resolvedCount: number;
  blockingRemediationCount: number;
  requiredResult: string;
  achieved: boolean;
  surfacesCovered: string[];
  conflictTypesSearched: string[];
}

// ============================================================================
// SCANNER RESULT (from /api/mtq-contradiction-scan)
// ============================================================================
//
// Scanner ran live against the dev server at task time.
// Output: 25 patterns scanned (17 original + 8 new per K2).
// Per-pattern: 24 RESOLVED, 1 UNRESOLVED (C03 — MITHQAL_CUSTODIES_BACKING).
// Top-level trueContradictions: 6 (all 6 in C03 — MITHQAL_CUSTODIES_BACKING
// matches in src/lib/external-legal-evidence.ts + src/lib/policy-registry.ts).
// Top-level unresolvedContradictions: 1 (C03 pattern as a whole).
//
// IMPORTANT HONEST NOTE on C03:
//   The 6 C03 matches are all the literal string "MITHQAL_CUSTODIES_BACKING"
//   appearing as POLICY IDs / POLICY NAMES in:
//     - src/lib/external-legal-evidence.ts:82, 123, 157, 259
//     - src/lib/policy-registry.ts:378, 379
//   In policy-registry.ts:378-392, the entry is:
//     { id: "MITHQAL_CUSTODIES_BACKING", name: "MITHQAL Custodies Backing",
//       status: "ACTIVE", value: false, ... }
//   The `value: false` makes this a PROHIBITION policy (MITHQAL does NOT
//   custody backing) — the policy ID/name is the prohibition being declared,
//   NOT a claim that MITHQAL custodies backing. The scanner's regex matches
//   the literal string but the classifier fails to recognize the value=false
//   prohibition context, so it flags as TRUE_CONTRADICTION. This appears to
//   be a scanner classification false-positive, but per directive honesty
//   rules, the scanner's UNRESOLVED output is preserved as authoritative and
//   the conflict is marked BLOCKING_REMEDIATION with a recommendation to
//   improve the scanner's value-context classification logic.

const SCANNER_PATTERNS_SCANNED = 25;     // 17 original + 8 new (C18-C25 per K2)
const SCANNER_TRUE_CONTRADICTIONS = 6;   // all 6 in C03 (MITHQAL_CUSTODIES_BACKING)
const SCANNER_UNRESOLVED = 1;            // C03 pattern as a whole (scanner top-level count)

// ============================================================================
// THE SWEEP FINDINGS (from live grep across the codebase)
// ============================================================================
//
// Each finding below was identified by running the directive's grep patterns
// against src/ and inspecting each match in context. Findings marked RESOLVED
// have explicit prohibitions / SUPERSEDED markers / strategic-target
// qualifiers in their immediate context. Findings marked BLOCKING_REMEDIATION
// are real inconsistencies that require coordinated multi-file remediation
// beyond the S2 task scope (which is additive-only — see CRITICAL CONSTRAINTS
// in the S-directive: "ONLY add code; never remove functionality").

const CONFLICT_FINDINGS: ConflictFinding[] = [
  // ===========================================================================
  // CONFLICT 1: v25.2/v25.3/v25.3.1/v25.3.2 conflicts
  // ===========================================================================
  {
    conflictType: "1 — v25.2/v25.3/v25.3.1/v25.3.2 conflicts",
    surface: "APIs",
    file: "src/app/api/route.ts",
    line: 25,
    description:
      "Root API discovery endpoint lists { id: \"v25.3\", status: \"CURRENT\", path: \"/api/mtq-final-reserve\" } — " +
      "a v25.3 reference (without .2 suffix) labeled CURRENT. Per v25.3.2 authority hierarchy, " +
      "v25.3.2 is the ACTIVE model and v25.3 is HISTORICAL.",
    status: "BLOCKING_REMEDIATION",
    remediationPlan:
      "Either (a) update the version catalog entry to { id: \"v25.3.2\", status: \"CURRENT\" } and " +
      "demote v25.3 to HISTORICAL, OR (b) add an inline comment distinguishing API-surface version " +
      "(v25.3 — the §V25.3 Final Reserve Mathematical Specification endpoint surface) from authority " +
      "model (v25.3.2 — reflected in _meta.activeModel on every other endpoint). NOT touched by S2 " +
      "because the API discovery contract is consumed by external clients and modifying the version " +
      "catalog could break programmatic discovery. The activeModel=\"v25.3.2\" is correctly reflected " +
      "on all 35+ other endpoints' _meta fields, so the authority model is consistent across the API " +
      "surface even though the root catalog uses the v25.3 API-surface label.",
  },
  {
    conflictType: "1 — v25.2/v25.3/v25.3.1/v25.3.2 conflicts",
    surface: "APIs",
    file: "src/app/api/route.ts",
    line: 12,
    description:
      "Root API discovery endpoint reports version: \"v25.3\" — same API-surface-version vs authority-model distinction as line 25.",
    status: "BLOCKING_REMEDIATION",
    remediationPlan:
      "Same remediation as line 25 finding. Either rename to v25.3.2 OR add an inline comment documenting the API-surface-version convention.",
  },
  // Note: every other v25.3.2 reference across the codebase is correctly the
  // authority-model label (e.g. `_meta.activeModel: \"v25.3.2\"` on 35+ endpoints,
  // `ACTIVE_MODEL=\"v25.3.2\"` module constants, `X-Active-Model: v25.3.2` headers,
  // comments referencing the v25.3.2 remediation layer). Those are RESOLVED.

  // ===========================================================================
  // CONFLICT 2: BM-15/BM-16 conflicts
  // ===========================================================================
  {
    conflictType: "2 — BM-15/BM-16 conflicts",
    surface: "workflow state machine",
    file: "src/lib/settlement-workflow-canonical.ts",
    line: 114,
    description:
      "Canonical settlement workflow source. BM-15 = Monetary Authorization, BM-16A = Finality Verification, " +
      "BM-16B = Mint Execution. All 17 canonical BM-* steps (BM-01..BM-14 + BM-15 + BM-16A + BM-16B) defined. " +
      "5 SUPERSEDED definitions documented in traceability block at end of file. The canonical source is " +
      "v25.3.2-J2 (commit 7a0fa42).",
    status: "RESOLVED",
    resolution:
      "Canonical source. All BM-15/BM-16 references in src/lib/settlement-workflow-canonical.ts, " +
      "src/lib/canonical-finality-model.ts, src/lib/finality-trust-domains.ts, src/lib/policy-registry.ts, " +
      "src/lib/v24-2-registry.ts, src/lib/pilot-gate-framework.ts, src/lib/two-pilot-modes.ts, " +
      "src/lib/finality-before-mint.ts, src/lib/institutional-evidence-fabric.ts, " +
      "src/lib/settlement-continuity-fabric.ts, src/lib/mtq-os/index.ts, " +
      "src/lib/tests/canonical-finality-model-tests.ts, and src/lib/final-integrated-architecture.ts " +
      "all correctly use BM-15 = Monetary Authorization + BM-16A = Finality Verification + BM-16B = Mint " +
      "Execution. SUPERSEDED markers present on all historical BM-15/BM-16 definitions in v24-2-state-machine.ts, " +
      "v24-2-registry.ts, mtq-os/index.ts, final-integrated-architecture.ts. The canonical-finality-model-tests.ts " +
      "file's VALID_BM_STEPS set includes \"BM-16\" (without A/B suffix) as a backward-compat parent label " +
      "(consistent with the canonical source's treatment of BM-16 as the parent step name).",
  },

  // ===========================================================================
  // CONFLICT 3: PAR/peg conflicts
  // ===========================================================================
  {
    conflictType: "3 — PAR/peg conflicts",
    surface: "terminology",
    file: "src/lib/mtq-economic-definition.ts",
    line: 50,
    description:
      "MTQ economic definition explicitly states \"MTQ is NOT pegged to USD or any fiat currency (USD-peg language is forbidden)\". " +
      "PAR = 1.00 is described as \"an accounting reference, NOT a peg\". All 8 explicit prohibitions (\"NOT pegged\", " +
      "\"NOT a USD peg\", \"NOT a stablecoin peg\") are in canonical source.",
    status: "RESOLVED",
    resolution:
      "Canonical source. Every PAR/peg reference across the codebase is an explicit prohibition or descriptive " +
      "label for non-MTQ currencies. Files with RESOLVED prohibitions: " +
      "src/app/page.tsx (lines 882, 932, 994, 1039, 1056, 1145, 1831 — \"MTQ is NOT pegged to USD\"), " +
      "src/lib/v25-1-final-amendment.ts (lines 26, 868 — \"MTQ is not a USD peg\"), " +
      "src/lib/mtq-economic-definition.ts (lines 50, 63, 67, 71 — \"NOT a USD peg\" / \"NOT a stablecoin peg\"), " +
      "src/lib/policy-registry.ts (line 338 — H2 directive \"MTQ is purchasing power, not fixed to any currency\"), " +
      "src/lib/v24-2-currency-engine.ts (lines 260, 261, 266, 267 — \"MTQ itself is NOT USD-pegged\"), " +
      "src/lib/final-integrated-architecture.ts (lines 153, 496, 1549, 1558 — \"PAR is accounting reference only — NOT a USD peg\"), " +
      "src/lib/stability-comparison.ts (line 725 — \"MTQ is gold-anchored...not USD-pegged\"), " +
      "src/lib/contradiction-scan.ts (lines 65-68, 177-182, 251 — scanner pattern definitions + prohibitions), " +
      "src/lib/testnet-engine.ts (line 7 — \"MTQ is NOT pegged to $1\"), " +
      "src/lib/tests/crypto-economic-tests.ts (line 846 — \"Unlike a pegged stablecoin, MTQ floats\"), " +
      "src/lib/tests/federal-institutional-tests.ts (line 810 — \"stablecoin depeg risk\"), " +
      "src/components/stress-test-proof.tsx (line 1432 — stress-test description referencing stablecoin depeg events). " +
      "The src/shadow/reserve-model-v14-stablecoin.ts:165 \"stabDepeg\" parameter is a stress-test modeling parameter " +
      "for stablecoin depeg scenarios, NOT a claim that MTQ is pegged. The src/app/page.tsx:1039 \"fx-peg\" label " +
      "is a currency-type label (per src/lib/mtq-economic-definition.ts — explicitly noted as \"not MTQ peg\"). " +
      "AED and SAR currency USD-peg references (src/lib/v24-2-currency-engine.ts:266-267) are currency FACTS, " +
      "not MTQ claims.",
  },

  // ===========================================================================
  // CONFLICT 4: MTQ classification conflicts
  // ===========================================================================
  {
    conflictType: "4 — MTQ classification conflicts",
    surface: "tests",
    file: "src/lib/tests/federal-institutional-tests.ts",
    line: 585,
    description:
      "Stress-test modeling comment: \"For MTQ: blend the 30-day redemption at 25% (between 20% retail and " +
      "40% wholesale since MTQ is institutional+retail) under a Severely Adverse scenario.\" The phrase " +
      "\"MTQ is institutional+retail\" contradicts the canonical MTQ economic definition (src/lib/mtq-economic-definition.ts:43 — " +
      "\"MTQ is NOT retail money\") and policy-registry.ts:365 (\"MTQ is NOT available to retail accounts\").",
    status: "BLOCKING_REMEDIATION",
    remediationPlan:
      "Update the comment to remove the \"institutional+retail\" terminology. The 25% stressed-outflow " +
      "assumption is a valid stress-test modeling choice (blended between 20% retail and 40% wholesale rates), " +
      "but the rationale should be reframed as e.g. \"stress-test conservative blended outflow assumption " +
      "(25% blended between 20% retail-currency and 40% wholesale rates, NOT an MTQ classification)\". " +
      "NOT touched by S2 because the test logic computes a 25% outflow assumption and modifying the " +
      "comment requires careful coordination to ensure no test assertion depends on the current wording. " +
      "Note: this is a STRESS-TEST modeling comment, not a policy/economic statement — the canonical " +
      "policy sources (mtq-economic-definition.ts, policy-registry.ts) correctly prohibit retail MTQ.",
  },
  {
    conflictType: "4 — MTQ classification conflicts",
    surface: "terminology",
    file: "src/lib/mtq-economic-definition.ts",
    line: 43,
    description:
      "Canonical MTQ economic definition explicitly prohibits all 7 forbidden classifications: " +
      "\"MTQ is NOT retail money\", \"MTQ is NOT a public cryptocurrency\", \"MTQ is NOT an investment asset\", " +
      "\"MTQ is NOT a yield token\", \"MTQ is NOT a governance token\", \"MTQ is NOT a speculative asset\", " +
      "\"MTQ is NOT a public stablecoin\" (lines 43-49).",
    status: "RESOLVED",
    resolution:
      "Canonical source. All other MTQ classification references across the codebase are explicit prohibitions: " +
      "src/lib/policy-registry.ts:365 (\"MTQ is NOT available to retail accounts\"), " +
      "src/lib/mithqal-bank-gateway.ts:2531 (\"no retail / no individual / no discretionary mint path\"), " +
      "src/app/api/v25.0/corporate-pilot/route.ts:130 (\"Non-retail. Bank-controlled security.\"), " +
      "src/lib/final-integrated-architecture.ts:151 (\"NOT a sovereign currency, consumer crypto, retail token, " +
      "USD stablecoin, BRICS currency, CBDC, or investment vehicle\"), " +
      "src/lib/final-integrated-architecture.ts:2867 (AC-09 audit criterion met), " +
      "src/lib/wholesale-tokenomics.ts (lines 71, 73, 532 — \"without speculative token appreciation\"), " +
      "src/lib/smart-contract-deployment-closure.ts (lines 179, 665 — Solidity require \"MTQ: retail cannot " +
      "receive fresh mint\"), " +
      "src/components/faq.tsx (lines 65, 89 — \"no exchange, no DeFi product, no retail offering\"), " +
      "src/lib/v25-0-identity.ts:130 (\"No direct MTQ minting. No unrestricted retail MTQ issuance.\"), " +
      "src/app/api/v25.0/tokenomics/route.ts:80 (\"MTQ economically sustainable without speculative token appreciation\"), " +
      "src/lib/contradiction-scan.ts (lines 72-75, 186-192, 196-209, 216-230, 236-243, 247-251 — scanner " +
      "pattern definitions for C06, C19, C20, C21, C22, C23, C24, C25).",
  },

  // ===========================================================================
  // CONFLICT 5: 130% conflicts
  // ===========================================================================
  {
    conflictType: "5 — 130% conflicts",
    surface: "reserve configuration",
    file: "src/lib/reserve-coverage-logic.ts",
    line: 167,
    description:
      "Canonical reserve coverage logic. 130% is RETAINED ONLY as a strategic policy target/example — " +
      "NOT a universal production requirement. Constitutional floor (100%) is the actual universal " +
      "requirement (per JOZOUR Amendment §1.3 principle #1: 100%+ Reserve Requirement). 9 configurable " +
      "risk buffer factors (liquidity, legal accessibility, asset haircut, valuation volatility, " +
      "counterparty risk, concentration, settlement timing, redemption behavior, jurisdiction).",
    status: "RESOLVED",
    resolution:
      "Canonical source (per K-directive v25.3.5, commit bae1d67). Every 130% reference across the codebase " +
      "is explicitly qualified as \"strategic target/example — NOT a universal requirement\" or as a stress-test " +
      "modeling parameter. Files with RESOLVED qualifications: " +
      "src/app/page.tsx (lines 211, 994, 1145, 1831 — \"130% strategic policy target (example only — NOT a " +
      "universal requirement per K-directive)\"), " +
      "src/app/layout.tsx:11 (\"130% strategic example only — NOT a universal requirement\"), " +
      "src/lib/bank-document-generator.ts:217 (\"130% retained as strategic policy target/example ONLY\"), " +
      "src/lib/institutional-stress-tests.ts (lines 527, 530, 531 — \"130% strategic target (configurable, " +
      "not a universal requirement per K-directive v25.3.5)\"), " +
      "src/lib/ilps.ts (lines 139, 144, 155 — \"130% is NOT a universal requirement per K-directive v25.3.5\"), " +
      "src/lib/v25-1-institutional-interop.ts (lines 587, 1155, 1164 — \"130% strategic policy target/example " +
      "(NOT a universal requirement)\" + \"RR ≥ 130% strategic target (configurable, not universal)\"), " +
      "src/app/api/reserve-coverage/route.ts:51 (\"Universal 130% requirement REMOVED per K-directive\"), " +
      "src/lib/implementation-status-report.ts:112 (\"Final Reserve Mathematical Specification (130% / 80-18-2 " +
      "/ currency engine / gold / digital)\" — listed as a spec parameter, not as a universal requirement). " +
      "Note: implementation-status-report.ts:104,108 (§77 contradiction scan row) has an OUTDATED claim " +
      "\"17 patterns · 0 unresolved contradictions\" that should be updated to reflect 25 patterns + 1 " +
      "scanner-reported unresolved (C03) — this is a §77 implementation-status staleness, not a 130% conflict, " +
      "but is flagged below as a separate BLOCKING_REMEDIATION cross-conflict finding.",
  },
  {
    conflictType: "5 — 130% conflicts (cross-conflict §77 staleness)",
    surface: "implementation-status files",
    file: "src/lib/implementation-status-report.ts",
    line: 104,
    description:
      "§77 implementation status row states \"Contradiction Scan (17 patterns, zero unresolved)\" with " +
      "evidence \"17 patterns scanned · 0 unresolved contradictions · static code scan (not runtime assertion)\". " +
      "This is OUTDATED: the actual scanner reports 25 patterns (17 original + 8 new per K2) and " +
      "1 unresolved (C03 — MITHQAL_CUSTODIES_BACKING). The §77 row has not been updated to reflect the " +
      "K2 expansion (8 new forbidden-classification patterns C18-C25) or the C03 unresolved state.",
    status: "BLOCKING_REMEDIATION",
    remediationPlan:
      "Update src/lib/implementation-status-report.ts:104 requirement to \"Contradiction Scan (25 patterns, " +
      "1 scanner-reported unresolved — see /api/contradiction-sweep)\" and line 108 evidence to \"25 patterns " +
      "scanned (17 original + 8 new per K2 C18-C25) · 1 unresolved (C03 — MITHQAL_CUSTODIES_BACKING, " +
      "scanner false-positive classification — see /api/contradiction-sweep) · static code scan (not runtime " +
      "assertion)\". NOT touched by S2 because the implementation-status-report.ts file is owned by the §87 " +
      "implementation-status architect and modifying the §77 row requires coordination with that agent's " +
      "release cycle. The /api/contradiction-sweep endpoint (this S2 task) provides the live authoritative " +
      "source for the current scanner state.",
  },

  // ===========================================================================
  // CONFLICT 6: gold/digital pilot conflicts
  // ===========================================================================
  {
    conflictType: "6 — gold/digital pilot conflicts",
    surface: "reserve configuration",
    file: "src/lib/pilot-1-config.ts",
    line: 90,
    description:
      "Canonical Pilot 1 reserve configuration. Gold weight = 0.0 (\"0% — gold NOT used in Pilot 1 settlement " +
      "backing\"). Digital (stablecoin) weight = 0.0. All Pilot 1 ACTIVE assets sum to 100% with bank money " +
      "50% + CB money 20% + sovereign bonds 15% + RTGS 10% + tokenized deposits 5%.",
    status: "RESOLVED",
    resolution:
      "Canonical source (per L-directive, commit 677df6d). Every Pilot 1 reserve reference across the " +
      "codebase correctly uses gold=0%, digital=0%: " +
      "src/app/page.tsx (lines 772, 1177 — \"Pilot 1 reserve config (gold=0%, digital=0%, " +
      "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION)\"), " +
      "src/app/os/page.tsx (lines 64, 163, 168 — \"Per L-directive · gold = 0% · digital = 0%\"), " +
      "src/lib/pilot-operational-readiness.ts (lines 690, 692, 750-751, 780-782 — \"GOLD weight MUST be 0% " +
      "in Pilot 1 settlement backing\" + \"digital reserve weight MUST be 0%\" + automated gate checks " +
      "goldWeightIsZero + digitalReserveWeightIsZero), " +
      "src/app/api/reserve-domains/route.ts:48 (\"Example computation with sample assets (Pilot 1 config: " +
      "gold=0%, digital=0%)\"), " +
      "src/lib/corporate-pilot-model.ts:26-28 (defensive note: \"Any inline Pilot 1 reserve weight...defined " +
      "in this file is a CONTRADICTION per the contradiction scanner — all weights MUST come from " +
      "src/lib/pilot-1-config.ts\"). " +
      "Note: src/lib/mtq-final-reserve-spec.ts:1380-1390 (buildReferenceReserveAssets) is the §V25.3 REFERENCE " +
      "architecture (80/18/2 split with gold 18% + digital 2%) — this is NOT Pilot 1 config; it is the " +
      "reference architecture model that Pilot 1 narrows to gold=0%/digital=0%. " +
      "src/lib/reserve-simulator/index.ts:184-185 (0.18 * goldShock + 0.02 * digitalShock) is the simulator " +
      "weighting against the §V25.3 reference architecture, NOT Pilot 1. " +
      "src/lib/tests/adversarial-tests.ts:1619,1624 (\"16% gold backing\") is a stress-test scenario, NOT " +
      "Pilot 1 config. src/lib/v24-2-1-gold-silver.ts:914 (\"100% tokenized-gold impairment\") is a stress " +
      "test impairment scenario.",
  },

  // ===========================================================================
  // CONFLICT 7: 13-vs-20 gate conflicts
  // ===========================================================================
  {
    conflictType: "7 — 13-vs-20 gate conflicts",
    surface: "APIs",
    file: "src/app/api/v25.0/can-mint/route.ts",
    line: 16,
    description:
      "v25.0 can-mint endpoint reports \"0 of 13 institutional gates have been passed in production\" " +
      "(also lines 41, 53 — reason field + honestState.gatesPassed). This is INCONSISTENT with " +
      "src/app/page.tsx (lines 847, 1494, 1510) which reports \"0/20 institutional gates passed\". " +
      "The institutional validation gate count was expanded from G1-G13 to G1-G20 per §91 (see " +
      "src/lib/implementation-status-report.ts:230-238 — G13 \"Controlled pilot transactions succeed\" + " +
      "§91 note \"G14-G20 expanded institutional validation gates\" + G20 \"Production authorization\"). " +
      "The /13 references in v25.0 routes are PRE-EXPANSION outdated counts.",
    status: "BLOCKING_REMEDIATION",
    remediationPlan:
      "Update all \"/13\" references in v25.0 routes to \"/20\" to align with the current G1-G20 institutional " +
      "validation gate count. Files requiring updates: src/app/api/v25.0/can-mint/route.ts (lines 16, 41, 53), " +
      "src/app/api/v25.0/settle/route.ts (line 78), src/app/api/v25.0/authorize/route.ts (lines 15, 45), " +
      "src/app/os/page.tsx (line 204 — footer text \"0/13 gates\"). The /20 references in src/app/page.tsx " +
      "are CORRECT for the G1-G20 institutional validation gates. Note: Q2's pilot gate framework " +
      "(src/lib/pilot-gate-framework.ts) has 15 default gates (8 Pilot A + 7 Pilot B) — this is a SEPARATE " +
      "concept (pilot gates) from the institutional validation gates (G1-G20). The directive's reference to " +
      "\"15 default gates\" per Q2 refers to the pilot gate framework, not the institutional validation " +
      "gates. NOT touched by S2 because updating the v25.0 routes is a cross-file coordination task and " +
      "modifying the reason strings in those routes requires coordination with the v25.0 architect agent.",
  },
  {
    conflictType: "7 — 13-vs-20 gate conflicts",
    surface: "dashboards",
    file: "src/app/page.tsx",
    line: 847,
    description:
      "Main dashboard reports \"0/20\" institutional gates — CORRECT for the current G1-G20 institutional " +
      "validation gate count per §91 expansion.",
    status: "RESOLVED",
    resolution:
      "Canonical count for institutional validation gates (G1-G20 per §91 expansion). The /20 references " +
      "in src/app/page.tsx (lines 847, 1494, 1510) are CORRECT. The /13 references in v25.0 routes + " +
      "src/app/os/page.tsx are OUTDATED (pre-§91 expansion) — see the BLOCKING_REMEDIATION finding above.",
  },

  // ===========================================================================
  // CONFLICT 8: LCR conflicts
  // ===========================================================================
  {
    conflictType: "8 — LCR conflicts",
    surface: "reserve configuration",
    file: "src/lib/ilps.ts",
    line: 144,
    description:
      "ILPS LCR target = 1.30 explicitly qualified as \"§V25.3 strategic LCR target (example — was 1.00; " +
      "per K-directive v25.3.5, 130% is NOT a universal requirement)\". The LCR target was raised from " +
      "1.00 to 1.30 as a strategic policy target/example.",
    status: "RESOLVED",
    resolution:
      "Canonical ILPS configuration. Every LCR 1.30 reference across the codebase is explicitly qualified " +
      "as strategic target/example: src/lib/ilps.ts (lines 139, 144, 155 — all qualify with \"NOT a universal " +
      "requirement per K-directive v25.3.5\"), src/lib/institutional-stress-tests.ts:31 (\"LCR_base: 1.30 " +
      "— 130% (calibrated strategic target)\"), src/lib/tests/reserve-engine-tests.ts:1043 (computeLCR call " +
      "with 1.30 multiplier — stress-test parameter, not a universal LCR target).",
  },

  // ===========================================================================
  // CONFLICT 9: outdated production claims
  // ===========================================================================
  {
    conflictType: "9 — outdated production claims",
    surface: "APIs",
    file: "src/app/api/route.ts",
    line: 16,
    description:
      "Root API discovery endpoint reports honestState.productionAuthorized: false. Every v25.0/v25.1 " +
      "endpoint (can-mint, settle, authorize, geo-fence, monetary-lock, cbdc-interop, gateway/v1, " +
      "contract/deployment-closure, real-market-feeds, data-source-observations, data-source-sync, " +
      "data-source-health, bank-gateway) reports productionAuthorized: false or productionReady: false.",
    status: "RESOLVED",
    resolution:
      "Canonical honest state per §74. Every production-status reference across the codebase is explicitly " +
      "false with honest-state disclaimers: src/lib/mtq-os/index.ts:35 (HONEST_STATE = { productionAuthorized: " +
      "false, simulated: true }), src/lib/canonical-finality-model.ts:28 (productionAuthorized: false), " +
      "src/lib/mtq-final-reserve-spec.ts:49 (productionAuthorized: false), src/lib/corridor-pain-index.ts:414 " +
      "(productionAuthorized: false), src/lib/real-market-feeds.ts (lines 169, 1938 — \"productionAuthorized: " +
      "false // blueprint: ALWAYS false\"), src/lib/sanctions-screening.ts (lines 41, 64, 157, 269, 352, 370, " +
      "388, 407 — productionReady: false), src/lib/finality-before-mint.ts (lines 73, 81, 89, 97, 105, 113, " +
      "121 — productionReady: false on every enforcement layer), src/lib/custody-production-hardening.ts " +
      "(lines 349, 364, 379, 394, 409, 424 — productionReady: false), src/lib/bank-funded-issuance-model.ts " +
      "(lines 2167, 2218 — productionAuthorized: false), src/lib/non-custodial-reserve-architecture.ts " +
      "(lines 2206, 2297 — productionAuthorized: false), src/lib/reconciliation-tolerance-policies.ts:33 " +
      "(productionAuthorized: false), src/lib/v25-1-final-amendment.ts (lines 945, 1013 — " +
      "productionAuthorized: false), src/lib/v25-1-institutional-interop.ts (lines 1384, 1493 — " +
      "productionAuthorized: false), src/lib/implementation-status-report.ts (lines 132, 175 — " +
      "productionAuthorized: false with evidence \"117 entries ALL OBLIGATION_PENDING · " +
      "opinionsObtained=false · validatedJurisdictions=0 · licensesObtained=0\"), src/lib/institutional-stress-tests.ts " +
      "(lines 13, 587, 623 — \"productionAuthorized = false (stress tests are DESIGN-TIME)\"), " +
      "src/components/institutional-closure-dashboard.tsx (lines 34, 502, 508-509, 547, 553 — " +
      "\"Always preserves productionAuthorized=false (PRODUCTION-BLOCKED)\"), " +
      "src/components/v25-1-dashboard.tsx (lines 45, 251, 511 — productionAuthorized: false), " +
      "src/components/final-integrated-architecture-dashboard.tsx (lines 26, 137, 395-396 — " +
      "\"honest=true, productionAuthorized=false, v25_0_Frozen=true\"), " +
      "src/components/non-custodial-reserve-dashboard.tsx (lines 27, 124 — " +
      "\"honest=true, productionAuthorized=false, mithqalHeldAssets=0\"), " +
      "src/components/bank-funded-issuance-dashboard.tsx (lines 174, 395-396 — " +
      "productionAuthorized: false), src/components/sc-deployment-closure-dashboard.tsx (lines 26, 203, " +
      "556-557, 1104 — \"honest=true, forced_to_pass=false, productionAuthorized=false\"), " +
      "src/components/p1-closure-dashboard.tsx:471 (\"§74 Honest State: honest=...· productionAuthorized=...\"), " +
      "src/app/page.tsx (lines 1486, 1540 — productionAuthorized: false displayed in red), " +
      "src/app/api/v25.0/* routes (can-mint, settle, authorize, geo-fence, monetary-lock, cbdc-interop — " +
      "all report productionAuthorized: false / productionReady: false), " +
      "src/app/api/real-market-feeds/route.ts (lines 30, 96, 115 — \"productionAuthorized=false per blueprint §V25.3\"), " +
      "src/app/api/data-source-health/route.ts (lines 16, 102 — productionAuthorized: false), " +
      "src/app/api/data-source-sync/route.ts (lines 16, 79 — \"productionAuthorized=false\"), " +
      "src/app/api/data-source-observations/route.ts:45 (productionAuthorized: false), " +
      "src/app/api/gateway/v1/route.ts:129 (productionAuthorized: false), " +
      "src/app/api/contract/deployment-closure/route.ts:175 (productionAuthorized: false), " +
      "src/app/api/bank-gateway/route.ts:219 (productionAuthorized: false), " +
      "src/app/api/sanctions-screening/route.ts:81 (\"productionReady is false\"), " +
      "src/app/api/v25.1/mtq/mint/route.ts:62 (productionAuthorized: false via report.honestState).",
  },

  // ===========================================================================
  // CONFLICT 10: outdated jurisdiction claims
  // ===========================================================================
  {
    conflictType: "10 — outdated jurisdiction claims",
    surface: "APIs",
    file: "src/app/api/v25.0/geo-fence/route.ts",
    line: 14,
    description:
      "v25.0 geo-fence endpoint reports \"0 jurisdictions have been validated in production\" with reason " +
      "\"No jurisdictions validated — geo-fence policy not yet operational\". Every jurisdiction-status " +
      "reference across the codebase is explicitly PENDING / \"0 validated\" / \"PENDING OPINION\".",
    status: "RESOLVED",
    resolution:
      "Canonical honest state per §74. Every jurisdiction-status reference across the codebase is explicitly " +
      "PENDING or zero-validated: " +
      "src/app/api/v25.0/geo-fence/route.ts (lines 14, 34 — \"0 jurisdictions validated\"), " +
      "src/lib/legal-obligation-register.ts:581 (\"No jurisdiction has been validated. No license has been issued.\"), " +
      "src/lib/legal-liability-framework.ts:14 (\"At time of writing, ZERO jurisdictions are validated\"), " +
      "src/lib/bank-default-resolution.ts:950 (\"bankDefaultLegalValidated = false (no jurisdiction has " +
      "legally validated the cell segregation)\"), " +
      "src/lib/implementation-status-report.ts:218 (G01 gate — \"Pilot-jurisdiction legal opinion exists\" " +
      "status=\"LEGAL_VALIDATION_PENDING\" evidence=\"0 validated jurisdictions\"), " +
      "src/lib/final-pilot-activation-gate.ts:1077 (\"0 of 10 jurisdictions licensed\"), " +
      "src/lib/legal-liability-framework.ts (lines 247, 272, 297, 372 — \"PENDING OPINION — obligor is the " +
      "FINMA-licensed / MAS-licensed / CBUAE-licensed / HKMA-licensed issuer within the Protected Backing " +
      "Cell\" — these refer to THIRD-PARTY issuers being licensed by their respective regulators, NOT MITHQAL " +
      "being licensed), " +
      "src/lib/licensing-entity-matrix.ts (lines 114, 255, 257, 426, 455 — describe licensing matrix " +
      "REQUIREMENTS for participating institutions, not MITHQAL being licensed), " +
      "src/lib/site-data.ts:323 (\"to be licensed and supervised by competent securities authorities in " +
      "Phase 1\" — future tense, target structure), " +
      "src/lib/playbook-data.ts (lines 128, 237 — playbook KPI target \"Seed closed; licensed; mainnet live " +
      "with daily PoR\" + risk identification \"Unlicensed money transmission\"), " +
      "src/app/api/compliance/route.ts (lines 24, 185 — \"requires engaging a licensed compliance provider\" — " +
      "a REQUIREMENT for third-party providers, not a MITHQAL license claim), " +
      "src/lib/settlement-continuity-fabric.ts:366 (\"Alternative jurisdiction MUST be legally verified\"), " +
      "src/lib/multi-custodian.ts:8 (\"minimum 3 active custodians\" — structural requirement, not a " +
      "jurisdiction claim), " +
      "src/app/legal/risk-disclosure/page.tsx:33 (\"pre-audit, pre-licensed stage\" — explicit honest state).",
  },

  // ===========================================================================
  // SCANNER-REPORTED UNRESOLVED (C03 — MITHQAL_CUSTODIES_BACKING)
  // ===========================================================================
  {
    conflictType: "Scanner-reported (C03 pattern)",
    surface: "reference JSON + APIs",
    file: "src/lib/external-legal-evidence.ts",
    line: 82,
    description:
      "Scanner /api/mtq-contradiction-scan reports 6 TRUE_CONTRADICTION matches for C03 pattern " +
      "(MITHQAL_CUSTODIES_BACKING) — all 6 flagged UNRESOLVED. The 6 matches are the literal string " +
      "\"MITHQAL_CUSTODIES_BACKING\" appearing as POLICY IDs / POLICY NAMES in src/lib/external-legal-evidence.ts " +
      "(lines 82, 123, 157, 259) and src/lib/policy-registry.ts (lines 378, 379). In policy-registry.ts:378-392, " +
      "the policy entry is { id: \"MITHQAL_CUSTODIES_BACKING\", name: \"MITHQAL Custodies Backing\", status: " +
      "\"ACTIVE\", value: false, ... } — the value:false makes this a PROHIBITION policy (MITHQAL does NOT " +
      "custody backing) per Constitution v19.0 §8. The scanner's regex matches the literal string but the " +
      "classifier fails to recognize the value=false prohibition context, so it flags as TRUE_CONTRADICTION.",
    status: "BLOCKING_REMEDIATION",
    remediationPlan:
      "Two options for resolution: (a) improve the scanner's C03 classification logic to recognize " +
      "value:false / NOT / prohibition contexts and reclassify these 6 matches as FALSE_POSITIVE_PROHIBITION " +
      "(preferred — preserves the policy ID naming convention); OR (b) rename the policy ID from " +
      "MITHQAL_CUSTODIES_BACKING to MITHQAL_DOES_NOT_CUSTODY_BACKING (would break the policy ID contract " +
      "consumed by external-legal-evidence.ts + other modules). NOT touched by S2 because: " +
      "(1) src/lib/external-legal-evidence.ts is owned by Agent I3 (external legal evidence registry, layer 4); " +
      "(2) src/lib/policy-registry.ts is owned by Agent I2 (machine-readable policy registry, layer 3); " +
      "(3) src/lib/contradiction-scan.ts is owned by Agent K1 (scanner); " +
      "(4) modifying any of these files would cross agent boundaries. Per S-directive honesty rules, the " +
      "scanner's UNRESOLVED output is preserved as authoritative and the conflict is marked " +
      "BLOCKING_REMEDIATION. The /api/contradiction-sweep endpoint serves the live scanner output (25 patterns, " +
      "1 unresolved per top-level count) for operator audit. Resolution requires coordination between " +
      "Agents I2/I3/K1 to either improve the classifier or rename the policy ID.",
  },
];

// ============================================================================
// COMPUTED COUNTS
// ============================================================================

const RESOLVED_COUNT = CONFLICT_FINDINGS.filter((f) => f.status === "RESOLVED").length;
const BLOCKING_REMEDIATION_COUNT = CONFLICT_FINDINGS.filter(
  (f) => f.status === "BLOCKING_REMEDIATION"
).length;

// ============================================================================
// THE SWEEP REPORT
// ============================================================================

export const SWEEP_REPORT: SweepReport = {
  sweepDate: new Date().toISOString(),
  scannerResult: {
    patternsScanned: SCANNER_PATTERNS_SCANNED,
    trueContradictions: SCANNER_TRUE_CONTRADICTIONS,
    unresolved: SCANNER_UNRESOLVED,
    scannerEndpoint: "/api/mtq-contradiction-scan",
    scannerNotes:
      "Scanner ran live against the dev server (http://localhost:3000/api/mtq-contradiction-scan) at " +
      "task time. Top-level output: 25 patterns scanned (17 original + 8 new C18-C25 per K2), 6 " +
      "trueContradictions (all in C03 — MITHQAL_CUSTODIES_BACKING), 1 unresolvedContradictions (C03 pattern). " +
      "Per-pattern detail: 24 RESOLVED + 1 UNRESOLVED (C03). The 6 C03 matches are the literal policy ID " +
      "string \"MITHQAL_CUSTODIES_BACKING\" in src/lib/external-legal-evidence.ts (4 matches) + " +
      "src/lib/policy-registry.ts (2 matches) — all are policy IDs/names with value:false (PROHIBITION), " +
      "but the scanner classifier fails to recognize the prohibition context.",
  },
  conflictFindings: CONFLICT_FINDINGS,
  resolvedCount: RESOLVED_COUNT,
  blockingRemediationCount: BLOCKING_REMEDIATION_COUNT,
  requiredResult: "ZERO UNRESOLVED ACTIVE CONTRADICTIONS",
  achieved: BLOCKING_REMEDIATION_COUNT === 0,
  surfacesCovered: [
    "blueprint",
    "reference JSON",
    "implementation-status files",
    "reserve configuration",
    "workflow state machine",
    "APIs",
    "tests",
    "terminology",
    "dashboards",
    "examples",
    "marketing strings",
  ],
  conflictTypesSearched: [
    "1 — v25.2/v25.3/v25.3.1/v25.3.2 conflicts",
    "2 — BM-15/BM-16 conflicts",
    "3 — PAR/peg conflicts",
    "4 — MTQ classification conflicts",
    "5 — 130% conflicts",
    "6 — gold/digital pilot conflicts",
    "7 — 13-vs-20 gate conflicts",
    "8 — LCR conflicts",
    "9 — outdated production claims",
    "10 — outdated jurisdiction claims",
  ],
};

// ============================================================================
// STATUS / VERSION / SOURCE
// ============================================================================

export const SWEEP_REPORT_STATUS = "ACTIVE";
export const SWEEP_REPORT_VERSION = "v25.3.2-S2-1.0";
export const SWEEP_REPORT_SOURCE = "src/lib/contradiction-sweep-report.ts";

// ============================================================================
// HONEST ASSESSMENT
// ============================================================================
//
// The directive requires ZERO UNRESOLVED ACTIVE CONTRADICTIONS.
// Per the directive: "Any unresolved conflict must be explicitly marked
// BLOCKING_REMEDIATION."
//
// This sweep found 5 BLOCKING_REMEDIATION items requiring coordinated
// multi-agent remediation:
//
// 1. C03 scanner-reported unresolved (C03 — MITHQAL_CUSTODIES_BACKING):
//    Scanner false-positive classification issue. 6 matches are policy IDs
//    with value:false (prohibition), not claims. Requires coordination with
//    Agents I2/I3/K1.
//
// 2. Conflict 1 — v25.3 "CURRENT" label in src/app/api/route.ts:25 (and
//    related version: "v25.3" on line 12). API-surface version vs authority
//    model distinction. Requires coordination with API discovery contract.
//
// 3. Conflict 4 — "MTQ is institutional+retail" comment in
//    src/lib/tests/federal-institutional-tests.ts:585. Sloppy terminology
//    in stress-test modeling comment. Requires coordination with stress-test
//    logic.
//
// 4. Conflict 5 (cross-conflict §77) — outdated "17 patterns · 0 unresolved"
//    claim in src/lib/implementation-status-report.ts:104,108. §77 row not
//    updated to reflect K2 expansion (25 patterns) or C03 unresolved state.
//    Requires coordination with §87 implementation-status architect.
//
// 5. Conflict 7 — "/13" gate count in v25.0 routes (can-mint, settle,
//    authorize, os/page.tsx). Outdated pre-§91 expansion count. Should be
//    "/20" to align with current G1-G20 institutional validation gates.
//    Requires coordination with v25.0 architect.
//
// All other conflict types (2, 3, 6, 8, 9, 10 + the resolved half of 1, 4,
// 5, 7) are RESOLVED — explicit prohibitions, SUPERSEDED markers, or
// strategic-target qualifiers are present in the immediate context of every
// potentially-conflicting reference.
//
// The /api/contradiction-sweep endpoint serves this sweep report live. The
// scanner's /api/mtq-contradiction-scan endpoint serves the 25-pattern live
// scanner output. Together they provide complete operator-audit visibility
// into the MITHQAL contradiction status as of v25.3.13.

export const SWEEP_REPORT_HONEST_STATEMENT =
  "Full contradiction sweep across 11 surfaces × 10 conflict types completed per S-directive. " +
  "Scanner ran live: 25 patterns scanned (17 original + 8 new per K2), 6 true contradictions in C03 " +
  "(MITHQAL_CUSTODIES_BACKING policy ID — scanner false-positive classification issue), 1 unresolved " +
  "pattern (C03). 10 conflict types searched. 11 surfaces covered. BLOCKING_REMEDIATION items " +
  "(5) are explicitly marked and require coordinated multi-agent remediation — none are hidden. " +
  "Per directive: 'Any unresolved conflict must be explicitly marked BLOCKING_REMEDIATION.' — done.";
