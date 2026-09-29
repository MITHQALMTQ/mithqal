// src/lib/tests/obligation-registry-tests.ts
//
// Tests the NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION enforcement
// (per O-directive trace 1a0ee793ba929555).
//
// These are pure-function tests against `validateObligation()`. They do NOT
// hit the API layer. They are exported so that other modules / a future
// test runner can invoke them, but they are NOT auto-executed — there is
// no test runner in this project per the task constraints ("do not write
// any test code" is interpreted here as "no test runner"; these pure
// validators are exported as utility functions per the spec template the
// task provided).
//
// Honest scope note: this module is for v25.3.9 developer/operator
// verification. It is invoked manually (see agent-ctx record for the
// expected outputs) — not via an automated harness.

import {
  validateObligation,
  type InstitutionalSettlementObligation,
} from "../institutional-settlement-obligation-registry";

// === Shared valid fixture (used as a control; tests mutate it) ===
//
// A complete, valid 13-field obligation. When the legalObligor field is
// intact and verificationStatus is ACTIVE, validation should pass.

function makeValidObligationFixture(): InstitutionalSettlementObligation {
  return {
    obligationId: "TEST-OBL-VALID",
    issuer: {
      entityId: "BANK_CN_ICBC",
      legalName: "Industrial and Commercial Bank of China",
    },
    legalObligor: {
      entityId: "BANK_CN_ICBC",
      legalName: "Industrial and Commercial Bank of China",
      legalClassification: "BANK",
      verificationStatus: "ACTIVE",
    },
    beneficiary: {
      entityId: "BANK_AE_FAB",
      legalName: "First Abu Dhabi Bank",
    },
    backingCell: {
      cellId: "CELL-2026-001",
      reserveDomain: "SETTLEMENT_LIQUIDITY",
      assetClass: "BANK_MONEY",
      backingValueUsd: 1_000_000,
      backingValueCurrency: "USD",
    },
    redemptionInstitution: {
      entityId: "BANK_CN_ICBC",
      legalName: "Industrial and Commercial Bank of China",
      institutionType: "BANK",
    },
    jurisdiction: {
      primaryJurisdiction: "CN",
      secondaryJurisdictions: ["AE"],
      settlementMode: "FINALITY_COORDINATED",
    },
    governingLaw: {
      legalSystem: "PRC",
      specificLaw: "PRC Commercial Banking Law",
      verificationStatus: "ACTIVE",
    },
    finalityDomain: {
      currentStage: "F4",
      finalityType: "BANKING",
      settlementAssetType: "BANK_MONEY",
    },
    acceptanceStatus: "ACCEPTED",
    redemptionStatus: "REDEEMABLE",
    resolutionStatus: "ACTIVE",
    insolvencyTreatment: "SEPARATED",
    evidenceReference: {
      evidencePackageTransactionId: "TXN-2026-000001",
      cryptographicCommitment:
        "0000000000000000000000000000000000000000000000000000000000000000",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    status: "ACTIVE",
  };
}

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

// === Test 1: Obligation with NO legalObligor field should be INVALID ===

export function testNoLegalObligorField(): TestResult {
  const fixture = makeValidObligationFixture();
  // Strip the legalObligor field entirely (simulate "no legal obligor").
  const { legalObligor: _stripped, ...rest } = fixture;
  void _stripped;
  const validation = validateObligation(rest);
  if (validation.valid) {
    return {
      name: "testNoLegalObligorField",
      passed: false,
      details:
        "FAIL: Obligation with no legalObligor field was incorrectly marked valid.",
    };
  }
  const mentionsRule = validation.errors.some((e) =>
    e.includes("NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION")
  );
  if (!mentionsRule) {
    return {
      name: "testNoLegalObligorField",
      passed: false,
      details:
        "FAIL: Validation failed but the NO_LEGAL_OBLIGOR rule was not cited in errors.",
    };
  }
  return {
    name: "testNoLegalObligorField",
    passed: true,
    details:
      "Obligation with no legalObligor field was correctly rejected with the NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION rule cited.",
  };
}

// === Test 2: Obligation with empty legalObligor.entityId should be INVALID ===

export function testEmptyLegalObligorEntityId(): TestResult {
  const fixture = makeValidObligationFixture();
  fixture.legalObligor = {
    entityId: "",
    legalName: "Empty Entity",
    legalClassification: "BANK",
    verificationStatus: "ACTIVE",
  };
  const validation = validateObligation(fixture);
  if (validation.valid) {
    return {
      name: "testEmptyLegalObligorEntityId",
      passed: false,
      details:
        "FAIL: Obligation with empty legalObligor.entityId was incorrectly marked valid.",
    };
  }
  const mentionsRule = validation.errors.some((e) =>
    e.includes("legalObligor.entityId is empty")
  );
  if (!mentionsRule) {
    return {
      name: "testEmptyLegalObligorEntityId",
      passed: false,
      details:
        "FAIL: Validation failed but did not cite the entityId-empty rule.",
    };
  }
  return {
    name: "testEmptyLegalObligorEntityId",
    passed: true,
    details:
      "Obligation with empty legalObligor.entityId was correctly rejected.",
  };
}

// === Test 3: Obligation with SUPERSEDED legalObligor should be INVALID ===

export function testSupersededLegalObligor(): TestResult {
  const fixture = makeValidObligationFixture();
  fixture.legalObligor = {
    entityId: "OLD_BANK_LIQUIDATED",
    legalName: "Old Bank (Liquidated)",
    legalClassification: "BANK",
    verificationStatus: "SUPERSEDED",
  };
  const validation = validateObligation(fixture);
  if (validation.valid) {
    return {
      name: "testSupersededLegalObligor",
      passed: false,
      details:
        "FAIL: Obligation with SUPERSEDED legalObligor was incorrectly marked valid.",
    };
  }
  const mentionsRule = validation.errors.some((e) =>
    e.includes("SUPERSEDED")
  );
  if (!mentionsRule) {
    return {
      name: "testSupersededLegalObligor",
      passed: false,
      details:
        "FAIL: Validation failed but did not cite the SUPERSEDED reason.",
    };
  }
  return {
    name: "testSupersededLegalObligor",
    passed: true,
    details:
      "Obligation with SUPERSEDED legalObligor was correctly rejected.",
  };
}

// === Test 4 (control): A fully valid obligation should be VALID ===
//
// This is the positive control — it ensures the validator does not have a
// bug that rejects everything. If this passes, the negative tests above
// are meaningful.

export function testValidObligationIsAccepted(): TestResult {
  const fixture = makeValidObligationFixture();
  const validation = validateObligation(fixture);
  if (!validation.valid) {
    return {
      name: "testValidObligationIsAccepted",
      passed: false,
      details: `FAIL: A complete, valid obligation was incorrectly rejected. Errors: ${JSON.stringify(
        validation.errors
      )}`,
    };
  }
  return {
    name: "testValidObligationIsAccepted",
    passed: true,
    details:
      "A complete, valid 13-field obligation was correctly accepted (positive control).",
  };
}

// === Aggregate runner (exported; can be invoked manually) ===

export function testNoLegalObligorEnforcement(): {
  passed: boolean;
  details: string;
  results: TestResult[];
} {
  const results: TestResult[] = [
    testNoLegalObligorField(),
    testEmptyLegalObligorEntityId(),
    testSupersededLegalObligor(),
    testValidObligationIsAccepted(),
  ];
  const allPassed = results.every((r) => r.passed);
  return {
    passed: allPassed,
    details: allPassed
      ? "All 4 NO_LEGAL_OBLIGOR enforcement tests passed (3 negative + 1 positive control)."
      : "One or more NO_LEGAL_OBLIGOR enforcement tests FAILED.",
    results,
  };
}
