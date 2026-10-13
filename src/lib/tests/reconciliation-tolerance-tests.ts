// src/lib/tests/reconciliation-tolerance-tests.ts
//
// MITHQAL v25.3.9 — Reconciliation Tolerance Policies test suite (8 tests).
// Per O-directive (trace 1a0ee793ba929555).
//
// Tests:
//   T1: 6 tolerance policies exist (NO universal — per directive)
//   T2: Each policy has a unique ID
//   T3: LEDGER_TO_LEDGER has toleranceBps=1 (tight)
//   T4: STRESSED_VALUATION has toleranceBps=200 (widest)
//   T5: Reconciliation record has all 6 required fields (per directive)
//   T6: Exact match returns VERIFIED
//   T7: 10% mismatch returns CRITICAL (hard limit)
//   T8: Asset-class override works (GOLD has tighter tolerance for CUSTODY_QUANTITY)
//
// Owner: Agent O2 — Reconciliation Tolerance Policies Architect.

import {
  TOLERANCE_POLICIES,
  reconcile,
  getToleranceForAsset,
  REQUIRED_RECONCILIATION_RECORD_FIELDS,
  TOLERANCE_POLICIES_STATUS,
  LEGACY_UNIVERSAL_TOLERANCE_STATUS,
  type TolerancePolicyId,
} from "../reconciliation-tolerance-policies";

export interface ReconciliationToleranceTestResult {
  passed: number;
  failed: number;
  results: Array<{ testName: string; passed: boolean; details: string }>;
}

export function testTolerancePolicies(): ReconciliationToleranceTestResult {
  const results: Array<{ testName: string; passed: boolean; details: string }> = [];

  // Test 1: 6 policies exist (per directive — NO universal)
  results.push({
    testName: "T1: 6 tolerance policies exist (per O-directive — NO universal tolerance)",
    passed: TOLERANCE_POLICIES.length === 6,
    details:
      `Policy count: ${TOLERANCE_POLICIES.length} (should be 6 per directive). ` +
      `Policies: ${TOLERANCE_POLICIES.map(p => p.id).join(", ")}. ` +
      `Status: ${TOLERANCE_POLICIES_STATUS}. ` +
      `Legacy: ${LEGACY_UNIVERSAL_TOLERANCE_STATUS.slice(0, 60)}...`,
  });

  // Test 2: Each policy has a unique ID
  const ids = TOLERANCE_POLICIES.map(p => p.id);
  const uniqueIds = new Set(ids);
  results.push({
    testName: "T2: Each policy has a unique ID",
    passed: ids.length === uniqueIds.size && uniqueIds.size === 6,
    details: `IDs: ${ids.join(", ")}. Unique count: ${uniqueIds.size} (should be 6).`,
  });

  // Test 3: LEDGER_TO_LEDGER has tight tolerance (1 bps)
  const ledgerPolicy = TOLERANCE_POLICIES.find(p => p.id === "LEDGER_TO_LEDGER");
  results.push({
    testName: "T3: LEDGER_TO_LEDGER has toleranceBps=1 (tight tolerance per directive)",
    passed: ledgerPolicy?.toleranceBps === 1 && ledgerPolicy?.isHardLimit === true,
    details:
      `toleranceBps: ${ledgerPolicy?.toleranceBps} (should be 1). ` +
      `isHardLimit: ${ledgerPolicy?.isHardLimit} (should be true). ` +
      `exceptionPolicy: ${ledgerPolicy?.exceptionPolicy}.`,
  });

  // Test 4: STRESSED_VALUATION has widest tolerance (200 bps)
  const stressedPolicy = TOLERANCE_POLICIES.find(p => p.id === "STRESSED_VALUATION");
  results.push({
    testName: "T4: STRESSED_VALUATION has toleranceBps=200 (widest tolerance per directive)",
    passed:
      stressedPolicy?.toleranceBps === 200 &&
      stressedPolicy?.isHardLimit === false &&
      stressedPolicy?.exceptionPolicy === "TOLERATE_WITHIN_BOUNDS",
    details:
      `toleranceBps: ${stressedPolicy?.toleranceBps} (should be 200). ` +
      `isHardLimit: ${stressedPolicy?.isHardLimit} (should be false — widest, tolerate). ` +
      `exceptionPolicy: ${stressedPolicy?.exceptionPolicy}.`,
  });

  // Test 5: Reconciliation record has all 6 required fields (per directive)
  const record = reconcile({
    tolerancePolicyId: "LEDGER_TO_LEDGER",
    valuationTimestamp: "2026-09-29T17:00:00Z",
    dataSource: "canonical-ledger",
    assetClass: "BANK_MONEY",
    currency: "USD",
    expectedValue: 1000000,
    actualValue: 1000000,
  });
  const requiredFieldCheck: Record<string, boolean> = {};
  for (const f of REQUIRED_RECONCILIATION_RECORD_FIELDS) {
    requiredFieldCheck[f] = f in record && record[f] !== undefined && record[f] !== null;
  }
  const hasAllFields = Object.values(requiredFieldCheck).every(v => v === true);
  results.push({
    testName: "T5: Reconciliation record has all 6 required fields (per directive)",
    passed: hasAllFields,
    details:
      `Required fields: tolerancePolicyId=${record.tolerancePolicyId}, ` +
      `valuationTimestamp=${record.valuationTimestamp}, ` +
      `dataSource=${record.dataSource}, ` +
      `assetClass=${record.assetClass}, ` +
      `currency=${record.currency}, ` +
      `exceptionPolicy=${record.exceptionPolicy}. ` +
      `Field count: ${REQUIRED_RECONCILIATION_RECORD_FIELDS.length} (should be 6).`,
  });

  // Test 6: Reconciliation within tolerance returns VERIFIED
  const withinTolerance = reconcile({
    tolerancePolicyId: "LEDGER_TO_LEDGER",
    valuationTimestamp: "2026-09-29T17:00:00Z",
    dataSource: "test",
    assetClass: "BANK_MONEY",
    currency: "USD",
    expectedValue: 1000000,
    actualValue: 1000000,  // exact match
  });
  results.push({
    testName: "T6: Exact match returns VERIFIED",
    passed:
      withinTolerance.reconciliationStatus === "VERIFIED" &&
      withinTolerance.isWithinTolerance === true &&
      withinTolerance.difference === 0 &&
      withinTolerance.differenceBps === 0,
    details:
      `Status: ${withinTolerance.reconciliationStatus}, ` +
      `isWithinTolerance: ${withinTolerance.isWithinTolerance}, ` +
      `difference: ${withinTolerance.difference}, ` +
      `differenceBps: ${withinTolerance.differenceBps}.`,
  });

  // Test 7: Reconciliation outside tolerance returns CRITICAL (hard limit)
  const outsideTolerance = reconcile({
    tolerancePolicyId: "LEDGER_TO_LEDGER",
    valuationTimestamp: "2026-09-29T17:00:00Z",
    dataSource: "test",
    assetClass: "BANK_MONEY",
    currency: "USD",
    expectedValue: 1000000,
    actualValue: 1100000,  // 10% off — way outside 1 bps tolerance
  });
  results.push({
    testName: "T7: 10% mismatch returns CRITICAL (hard limit, BLOCK_ON_MISMATCH)",
    passed:
      outsideTolerance.reconciliationStatus === "CRITICAL" &&
      outsideTolerance.isWithinTolerance === false &&
      outsideTolerance.exceptionPolicy === "BLOCK_ON_MISMATCH",
    details:
      `Status: ${outsideTolerance.reconciliationStatus}, ` +
      `isWithinTolerance: ${outsideTolerance.isWithinTolerance}, ` +
      `differenceBps: ${outsideTolerance.differenceBps.toFixed(2)} (should be ~1000 bps), ` +
      `exceptionPolicy: ${outsideTolerance.exceptionPolicy}.`,
  });

  // Test 8: Asset-class override works (GOLD has tighter tolerance for CUSTODY_QUANTITY)
  const goldTolerance = getToleranceForAsset("CUSTODY_QUANTITY", "GOLD");
  const silverTolerance = getToleranceForAsset("CUSTODY_QUANTITY", "SILVER");
  const defaultCustody = TOLERANCE_POLICIES.find(p => p.id === "CUSTODY_QUANTITY");
  results.push({
    testName: "T8: Asset-class override works (GOLD tighter than default for CUSTODY_QUANTITY)",
    passed:
      goldTolerance.toleranceBps === 5 &&  // override is 5
      defaultCustody?.toleranceBps === 10 &&  // default is 10
      silverTolerance.toleranceBps === 10,  // silver stays at default 10
    details:
      `GOLD toleranceBps: ${goldTolerance.toleranceBps} (should be 5 — override from default 10). ` +
      `SILVER toleranceBps: ${silverTolerance.toleranceBps} (should be 10 — default). ` +
      `CUSTODY_QUANTITY default toleranceBps: ${defaultCustody?.toleranceBps}.`,
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  return { passed, failed, results };
}
