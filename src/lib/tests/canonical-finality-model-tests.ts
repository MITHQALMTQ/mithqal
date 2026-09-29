/**
 * ============================================================================
 * MITHQAL v25.3.8 — CANONICAL FINALITY MODEL TESTS (Task N1)
 * ============================================================================
 *
 * Author   : Canonical Finality Model Architect (Agent N1)
 * Task ID  : N1
 * Trace    : 1a0ee5f25d2fbe79
 * Mandate  : Per the N-directive:
 *            "Create one canonical finality model. Use: F0-F7 (8 stages).
 *             Explicitly distinguish: technical finality, banking finality,
 *             legal finality. Use 'finality-coordinated settlement' when
 *             a common legal finality domain does not exist. Use 'atomic
 *             settlement' only when the transaction actually executes
 *             within a legally supported shared finality domain.
 *             Update all marketing language, examples and tests."
 *
 * Scope
 * -----
 *   1. All 8 F0-F7 stages exist (no more, no less).
 *   2. Each stage has the canonical name + correct finalityType assignment
 *      per the directive:
 *        F0 = TECHNICAL
 *        F1 = BANKING
 *        F2 = BANKING
 *        F3 = TECHNICAL
 *        F4 = TECHNICAL
 *        F5 = BANKING
 *        F6 = BANKING
 *        F7 = LEGAL
 *   3. determineSettlementMode() returns:
 *        - ATOMIC when all jurisdictions are identical
 *        - FINALITY_COORDINATED when jurisdictions differ
 *   4. Each F-stage maps to a valid BM-* step from the canonical
 *      settlement workflow (v25.3.4): BM-01..BM-16A, BM-16B.
 *   5. Each F-stage maps to a valid trust domain (v25.3.7 finality
 *      trust domains): Domain A (Policy/Authorization), Domain B
 *      (Finality Attestation), Domain C (Execution).
 *   6. The settlement MODE "ATOMIC" is reserved for the case where the
 *      transaction actually executes within a shared legal finality
 *      domain (per N-directive).
 *   7. The settlement MODE "FINALITY_COORDINATED" is used when no shared
 *      legal finality domain exists (per N-directive).
 *
 * Run:
 *   bun run src/lib/tests/canonical-finality-model-tests.ts
 * ============================================================================
 */

import {
  CANONICAL_FINALITY_STAGES,
  FINALITY_TYPES,
  SETTLEMENT_MODES,
  determineSettlementMode,
  getFinalityStage,
  getFinalityStagesByType,
  getFinalityTypeDefinition,
  getSettlementMode,
  CANONICAL_FINALITY_MODEL_STATUS,
  CANONICAL_FINALITY_MODEL_VERSION,
  CANONICAL_FINALITY_MODEL_SOURCE,
  type FinalityStageId,
  type FinalityType,
  type SettlementMode,
} from "@/lib/canonical-finality-model";

interface TestCase {
  name: string;
  pass: boolean;
  detail?: string;
}

const tests: TestCase[] = [];
function assert(name: string, cond: boolean, detail?: string) {
  tests.push({ name, pass: cond, detail });
}

// === TEST 1: All 8 F0-F7 stages exist (no more, no less) ===

const EXPECTED_STAGE_IDS: FinalityStageId[] = ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"];
const actualStageIds = CANONICAL_FINALITY_STAGES.map((s) => s.id);
assert(
  "All 8 F0-F7 stages present (no more, no less)",
  actualStageIds.length === 8 &&
    EXPECTED_STAGE_IDS.every((id) => actualStageIds.includes(id)) &&
    actualStageIds.every((id) => EXPECTED_STAGE_IDS.includes(id as FinalityStageId)),
  `Got: ${actualStageIds.join(", ")}`
);

// === TEST 2: Each stage has the canonical name (per directive) ===

const EXPECTED_NAMES: Record<FinalityStageId, string> = {
  F0: "Instruction Accepted",
  F1: "Funding Final",
  F2: "Legally Controlled Backing Confirmed",
  F3: "MITHQAL Authorization Final",
  F4: "MITHQAL Ledger Final",
  F5: "Receiving Institution Accepted",
  F6: "External Rail Final",
  F7: "Legal Settlement Final",
};
for (const id of EXPECTED_STAGE_IDS) {
  const stage = getFinalityStage(id);
  assert(
    `Stage ${id} has canonical name "${EXPECTED_NAMES[id]}"`,
    !!stage && stage.name === EXPECTED_NAMES[id],
    `Got: ${stage?.name ?? "<missing>"}`
  );
}

// === TEST 3: finalityType assignments are correct (per directive) ===

const EXPECTED_FINALITY_TYPES: Record<FinalityStageId, FinalityType> = {
  F0: "TECHNICAL",
  F1: "BANKING",
  F2: "BANKING",
  F3: "TECHNICAL",
  F4: "TECHNICAL",
  F5: "BANKING",
  F6: "BANKING",
  F7: "LEGAL",
};
for (const id of EXPECTED_STAGE_IDS) {
  const stage = getFinalityStage(id);
  assert(
    `Stage ${id} finalityType = ${EXPECTED_FINALITY_TYPES[id]}`,
    !!stage && stage.finalityType === EXPECTED_FINALITY_TYPES[id],
    `Got: ${stage?.finalityType ?? "<missing>"}`
  );
}

// Per directive: "explicitly distinguish" — verify that exactly:
//   - TECHNICAL appears for F0, F3, F4 (3 stages)
//   - BANKING appears for F1, F2, F5, F6 (4 stages)
//   - LEGAL appears for F7 only (1 stage)
const technicalStages = getFinalityStagesByType("TECHNICAL");
const bankingStages = getFinalityStagesByType("BANKING");
const legalStages = getFinalityStagesByType("LEGAL");
assert(
  "TECHNICAL finality = exactly F0, F3, F4 (3 stages)",
  technicalStages.length === 3 &&
    technicalStages.every((s) => ["F0", "F3", "F4"].includes(s.id)),
  `Got: ${technicalStages.map((s) => s.id).join(", ")}`
);
assert(
  "BANKING finality = exactly F1, F2, F5, F6 (4 stages)",
  bankingStages.length === 4 &&
    bankingStages.every((s) => ["F1", "F2", "F5", "F6"].includes(s.id)),
  `Got: ${bankingStages.map((s) => s.id).join(", ")}`
);
assert(
  "LEGAL finality = exactly F7 (1 stage)",
  legalStages.length === 1 && legalStages[0].id === "F7",
  `Got: ${legalStages.map((s) => s.id).join(", ")}`
);

// === TEST 4: 3 finality types distinguished explicitly (TECHNICAL, BANKING, LEGAL) ===

assert(
  "Exactly 3 finality types defined",
  FINALITY_TYPES.length === 3 &&
    FINALITY_TYPES.map((t) => t.type).sort().join(",") === "BANKING,LEGAL,TECHNICAL",
  `Got: ${FINALITY_TYPES.map((t) => t.type).join(", ")}`
);

for (const t of FINALITY_TYPES) {
  assert(
    `Finality type ${t.type} has isTechnicalFinality/isBankingFinality/isLegalFinality flags set exclusively`,
    (t.isTechnicalFinality ? 1 : 0) + (t.isBankingFinality ? 1 : 0) + (t.isLegalFinality ? 1 : 0) === 1,
    `TECH=${t.isTechnicalFinality}, BANK=${t.isBankingFinality}, LEGAL=${t.isLegalFinality}`
  );
  assert(
    `Finality type ${t.type} has a non-empty name/description/meaning/example`,
    !!t.name && !!t.description && !!t.meaning && !!t.example,
    "One or more descriptive fields are empty"
  );
}

// === TEST 5: Each F-stage maps to a valid BM-* step (per v25.3.4) ===

// The canonical settlement workflow is BM-01..BM-16 (16 steps). The N1
// model subdivides BM-16 into BM-16A (Finality Verification) and
// BM-16B (Mint Execution) per the v25.3.7 trust-domain refinement.
const VALID_BM_STEPS = new Set([
  "BM-01", "BM-02", "BM-03", "BM-04", "BM-05", "BM-06", "BM-07", "BM-08",
  "BM-09", "BM-10", "BM-11", "BM-12", "BM-13", "BM-14", "BM-15",
  "BM-16", "BM-16A", "BM-16B",
]);
const EXPECTED_BM_MAPPING: Record<FinalityStageId, string> = {
  F0: "BM-01", // Corporate / customer initiates settlement request
  F1: "BM-04", // Bank Establishes / Verifies Eligible Funding
  F2: "BM-05", // Bank Issues AvailableBackingCertificate to MITHQAL
  F3: "BM-15", // Monetary Authorization
  F4: "BM-16B", // Mint Execution (sub-step of BM-16)
  F5: "BM-16A", // Finality Verification (receiving institution acceptance)
  F6: "BM-16A", // Finality Verification (external rail finality)
  F7: "BM-16A", // Finality Verification (legal settlement final)
};
for (const id of EXPECTED_STAGE_IDS) {
  const stage = getFinalityStage(id);
  assert(
    `Stage ${id} maps to a valid BM-* step`,
    !!stage && VALID_BM_STEPS.has(stage.mapsToBMStep),
    `Got: ${stage?.mapsToBMStep ?? "<missing>"}`
  );
  assert(
    `Stage ${id} maps to BM step ${EXPECTED_BM_MAPPING[id]} (per v25.3.4 canonical settlement workflow)`,
    !!stage && stage.mapsToBMStep === EXPECTED_BM_MAPPING[id],
    `Got: ${stage?.mapsToBMStep ?? "<missing>"}`
  );
}

// === TEST 6: Each F-stage maps to a valid trust domain (per v25.3.7) ===

const VALID_TRUST_DOMAINS = new Set([
  "DOMAIN_A_POLICY_AUTHORIZATION",
  "DOMAIN_B_FINALITY_ATTESTATION",
  "DOMAIN_C_EXECUTION",
]);
const EXPECTED_DOMAIN_MAPPING: Record<
  FinalityStageId,
  "DOMAIN_A_POLICY_AUTHORIZATION" | "DOMAIN_B_FINALITY_ATTESTATION" | "DOMAIN_C_EXECUTION"
> = {
  F0: "DOMAIN_A_POLICY_AUTHORIZATION", // Policy/Authorization — instruction intake
  F1: "DOMAIN_A_POLICY_AUTHORIZATION", // Policy/Authorization — funding verification
  F2: "DOMAIN_A_POLICY_AUTHORIZATION", // Policy/Authorization — backing attestation
  F3: "DOMAIN_A_POLICY_AUTHORIZATION", // Policy/Authorization — monetary authorization
  F4: "DOMAIN_C_EXECUTION", // Execution — ledger mint
  F5: "DOMAIN_B_FINALITY_ATTESTATION", // Finality Attestation — receiving acceptance
  F6: "DOMAIN_B_FINALITY_ATTESTATION", // Finality Attestation — external rail
  F7: "DOMAIN_B_FINALITY_ATTESTATION", // Finality Attestation — legal settlement
};
for (const id of EXPECTED_STAGE_IDS) {
  const stage = getFinalityStage(id);
  assert(
    `Stage ${id} maps to a valid trust domain (A/B/C)`,
    !!stage && VALID_TRUST_DOMAINS.has(stage.trustDomain),
    `Got: ${stage?.trustDomain ?? "<missing>"}`
  );
  assert(
    `Stage ${id} maps to trust domain ${EXPECTED_DOMAIN_MAPPING[id].replace("DOMAIN_", "D").replace("_", " ")} (per v25.3.7)`,
    !!stage && stage.trustDomain === EXPECTED_DOMAIN_MAPPING[id],
    `Got: ${stage?.trustDomain ?? "<missing>"}`
  );
}

// === TEST 7: Each stage has achievedByMithqal XOR achievedByExternalParty ===
// (A stage is achieved by EITHER MITHQAL OR an external party, never both,
//  never neither — per the canonical source design.)

for (const stage of CANONICAL_FINALITY_STAGES) {
  const x = stage.achievedByMithqal;
  const y = stage.achievedByExternalParty;
  assert(
    `Stage ${stage.id} has exactly one of achievedByMithqal / achievedByExternalParty (XOR)`,
    x !== y,
    `Mithqal=${x}, External=${y}`
  );
}

// === TEST 8: determineSettlementMode returns ATOMIC for same-jurisdiction ===

const atomicCases = [
  { sender: "US", receiver: "US", mithqal: "US" },
  { sender: "AE", receiver: "AE", mithqal: "AE" },
  { sender: "CN", receiver: "CN", mithqal: "CN" },
  { sender: "SG", receiver: "SG", mithqal: "SG" },
];
for (const c of atomicCases) {
  const m = determineSettlementMode({
    senderJurisdiction: c.sender,
    receiverJurisdiction: c.receiver,
    mithqalJurisdiction: c.mithqal,
  });
  assert(
    `determineSettlementMode(${c.sender}/${c.receiver}/${c.mithqal}) → ATOMIC`,
    m === "ATOMIC",
    `Got: ${m}`
  );
}

// === TEST 9: determineSettlementMode returns FINALITY_COORDINATED for different-jurisdiction ===

const coordinatedCases = [
  { sender: "CN", receiver: "AE", mithqal: "US" },
  { sender: "AE", receiver: "SG", mithqal: "US" },
  { sender: "JP", receiver: "US", mithqal: "US" },
  { sender: "US", receiver: "AE", mithqal: "US" },
  { sender: "CN", receiver: "US", mithqal: "US" },
  { sender: "INTL", receiver: "US", mithqal: "US" }, // cross-jurisdictional stablecoin
  { sender: "US", receiver: "INTL", mithqal: "US" }, // cross-jurisdictional stablecoin
];
for (const c of coordinatedCases) {
  const m = determineSettlementMode({
    senderJurisdiction: c.sender,
    receiverJurisdiction: c.receiver,
    mithqalJurisdiction: c.mithqal,
  });
  assert(
    `determineSettlementMode(${c.sender}/${c.receiver}/${c.mithqal}) → FINALITY_COORDINATED`,
    m === "FINALITY_COORDINATED",
    `Got: ${m}`
  );
}

// === TEST 10: determineSettlementMode honors intermediaryJurisdictions ===

const mWithInt = determineSettlementMode({
  senderJurisdiction: "US",
  receiverJurisdiction: "US",
  mithqalJurisdiction: "US",
  intermediaryJurisdictions: ["GB"], // UK correspondent bank — different legal domain
});
assert(
  "determineSettlementMode(US/US/US + intermediary GB) → FINALITY_COORDINATED",
  mWithInt === "FINALITY_COORDINATED",
  `Got: ${mWithInt}`
);

const mNoInt = determineSettlementMode({
  senderJurisdiction: "US",
  receiverJurisdiction: "US",
  mithqalJurisdiction: "US",
  intermediaryJurisdictions: [],
});
assert(
  "determineSettlementMode(US/US/US + no intermediaries) → ATOMIC",
  mNoInt === "ATOMIC",
  `Got: ${mNoInt}`
);

// === TEST 11: Settlement MODE ATOMIC is reserved for shared legal finality domain ===

const atomicDef = getSettlementMode("ATOMIC");
assert(
  "ATOMIC settlement mode definition: sharedLegalFinalityDomain === true",
  !!atomicDef && atomicDef.sharedLegalFinalityDomain === true,
  `Got: ${atomicDef?.sharedLegalFinalityDomain}`
);
assert(
  "ATOMIC settlement mode definition: name === 'Atomic Settlement'",
  !!atomicDef && atomicDef.name === "Atomic Settlement",
  `Got: ${atomicDef?.name}`
);
assert(
  "ATOMIC settlement mode: whenToUse mentions 'legally supported shared finality domain'",
  !!atomicDef && /legally supported shared finality domain/i.test(atomicDef.whenToUse),
  `Got: ${atomicDef?.whenToUse?.slice(0, 80)}…`
);

// === TEST 12: Settlement MODE FINALITY_COORDINATED is used when no shared legal finality domain ===

const coordDef = getSettlementMode("FINALITY_COORDINATED");
assert(
  "FINALITY_COORDINATED settlement mode definition: sharedLegalFinalityDomain === false",
  !!coordDef && coordDef.sharedLegalFinalityDomain === false,
  `Got: ${coordDef?.sharedLegalFinalityDomain}`
);
assert(
  "FINALITY_COORDINATED settlement mode definition: name === 'Finality-Coordinated Settlement'",
  !!coordDef && coordDef.name === "Finality-Coordinated Settlement",
  `Got: ${coordDef?.name}`
);
assert(
  "FINALITY_COORDINATED: whenToUse mentions 'common legal finality domain does not exist'",
  !!coordDef && /common legal finality domain does not exist/i.test(coordDef.whenToUse),
  `Got: ${coordDef?.whenToUse?.slice(0, 80)}…`
);

// === TEST 13: Exactly 2 settlement modes ===

assert(
  "Exactly 2 settlement modes defined",
  SETTLEMENT_MODES.length === 2 &&
    SETTLEMENT_MODES.map((m) => m.mode).sort().join(",") ===
      "ATOMIC,FINALITY_COORDINATED",
  `Got: ${SETTLEMENT_MODES.map((m) => m.mode).join(", ")}`
);

// === TEST 14: FinalityTypeDefinition getter works ===

assert(
  "getFinalityTypeDefinition('LEGAL') returns the LEGAL definition",
  getFinalityTypeDefinition("LEGAL")?.type === "LEGAL",
  "Lookup failed"
);
assert(
  "getFinalityTypeDefinition('BANKING') returns the BANKING definition",
  getFinalityTypeDefinition("BANKING")?.type === "BANKING",
  "Lookup failed"
);
assert(
  "getFinalityTypeDefinition('TECHNICAL') returns the TECHNICAL definition",
  getFinalityTypeDefinition("TECHNICAL")?.type === "TECHNICAL",
  "Lookup failed"
);

// === TEST 15: Model status / version / source ===

assert(
  "Canonical finality model status = ACTIVE",
  CANONICAL_FINALITY_MODEL_STATUS === "ACTIVE",
  `Got: ${CANONICAL_FINALITY_MODEL_STATUS}`
);
assert(
  "Canonical finality model version = v25.3.2-N1-1.0",
  CANONICAL_FINALITY_MODEL_VERSION === "v25.3.2-N1-1.0",
  `Got: ${CANONICAL_FINALITY_MODEL_VERSION}`
);
assert(
  "Canonical finality model source = src/lib/canonical-finality-model.ts",
  CANONICAL_FINALITY_MODEL_SOURCE === "src/lib/canonical-finality-model.ts",
  `Got: ${CANONICAL_FINALITY_MODEL_SOURCE}`
);

// === TEST 16: Cross-check the directive's quoted phrase appears in the model ===
// (Honest guard — if someone tries to remove the phrase, this fires.)

const allModelText =
  JSON.stringify({
    FINALITY_TYPES,
    CANONICAL_FINALITY_STAGES,
    SETTLEMENT_MODES,
  }) +
  CANONICAL_FINALITY_MODEL_VERSION +
  CANONICAL_FINALITY_MODEL_SOURCE;
assert(
  'Directive phrase "finality-coordinated settlement" appears in the canonical model',
  /finality-coordinated settlement/i.test(allModelText),
  "Phrase missing — directive compliance broken"
);
assert(
  'Directive phrase "atomic settlement" appears in the canonical model',
  /atomic settlement/i.test(allModelText),
  "Phrase missing — directive compliance broken"
);
assert(
  'Directive phrase "legally supported shared finality domain" appears in the canonical model',
  /legally supported shared finality domain/i.test(allModelText),
  "Phrase missing — directive compliance broken"
);
assert(
  'Directive phrase "common legal finality domain does not exist" appears in the canonical model',
  /common legal finality domain does not exist/i.test(allModelText),
  "Phrase missing — directive compliance broken"
);

// === RUN ===

function banner(t: string) {
  console.log("\n" + "=".repeat(70));
  console.log(t);
  console.log("=".repeat(70));
}

function main() {
  banner("MITHQAL v25.3.8 — CANONICAL FINALITY MODEL TESTS (Task N1)");
  console.log("Author : Canonical Finality Model Architect (Agent N1)");
  console.log("Trace  : 1a0ee5f25d2fbe79");
  console.log(`Tests  : ${tests.length}`);
  console.log("");

  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    if (t.pass) {
      pass++;
      console.log(`  ✓ ${t.name}`);
    } else {
      fail++;
      console.log(`  ✗ ${t.name}`);
      if (t.detail) console.log(`      ${t.detail}`);
    }
  }

  banner("SUMMARY");
  console.log(`  PASS: ${pass}/${tests.length}`);
  console.log(`  FAIL: ${fail}/${tests.length}`);
  if (fail > 0) {
    console.log("\n  ✗ CANONICAL FINALITY MODEL TESTS FAILED");
    process.exit(1);
  }
  console.log("\n  ✓ ALL CANONICAL FINALITY MODEL TESTS PASS — directive compliance verified.");
  console.log("");
  console.log("  Worklog confirmation:");
  console.log("    Task ID   : N1");
  console.log("    Agent     : Canonical Finality Model Architect");
  console.log("    Trace     : 1a0ee5f25d2fbe79");
  console.log("    Result    : " + pass + "/" + tests.length + " PASS");
  console.log("    Test file : src/lib/tests/canonical-finality-model-tests.ts");
  console.log("");
  process.exit(0);
}

main();
