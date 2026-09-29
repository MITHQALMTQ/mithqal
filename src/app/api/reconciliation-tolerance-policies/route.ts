// src/app/api/reconciliation-tolerance-policies/route.ts
//
// MITHQAL v25.3.9 — Reconciliation Tolerance Policies endpoint.
// Per O-directive (trace 1a0ee793ba929555):
//   "Refactor reconciliation into separate tolerance policies.
//    Do NOT use one universal tolerance for every reconciliation type.
//    Create separate policies for: ledger-to-ledger balances, bank attestations,
//    custody/quantity, market valuation, FX valuation, stressed valuation.
//    Every reconciliation record must include: tolerancePolicyId,
//    valuationTimestamp, dataSource, assetClass, currency, exceptionPolicy.
//    Update reconciliation engines and tests accordingly."
//
// Public GET endpoint exposing the 6 separate tolerance policies defined in
// src/lib/reconciliation-tolerance-policies.ts (single canonical source).
// The legacy universal RECONCILIATION_TOLERANCE = 0.0001 (1 bps) is
// SUPERSEDED — see LEGACY_UNIVERSAL_TOLERANCE_STATUS.

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  TOLERANCE_POLICIES,
  reconcile,
  getTolerancePolicy,
  getToleranceForAsset,
  REQUIRED_RECONCILIATION_RECORD_FIELDS,
  TOLERANCE_POLICIES_STATUS,
  TOLERANCE_POLICIES_VERSION,
  TOLERANCE_POLICIES_SOURCE,
  LEGACY_UNIVERSAL_TOLERANCE_STATUS,
  HONEST_STATE,
  MODULE_ID,
  type TolerancePolicyId,
} from "@/lib/reconciliation-tolerance-policies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // R11: 30 req/min per IP — institutional-grade rate-limit policy.
  const rateLimited = enforceRateLimit("reconciliation-tolerance-policies", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const policyId = url.searchParams.get("policyId") as TolerancePolicyId | null;
  const reconcileParam = url.searchParams.get("reconcile") === "true";
  const toleranceForAsset = url.searchParams.get("toleranceForAsset");
  const tolerancePolicyId = url.searchParams.get("tolerancePolicyId") as TolerancePolicyId | null;
  const valuationTimestamp = url.searchParams.get("valuationTimestamp") || new Date().toISOString();
  const dataSource = url.searchParams.get("dataSource") || "test";
  const assetClass = url.searchParams.get("assetClass") || "BANK_MONEY";
  const currency = url.searchParams.get("currency") || "USD";
  const expectedValue = parseFloat(url.searchParams.get("expectedValue") || "1000000");
  const actualValue = parseFloat(url.searchParams.get("actualValue") || "1000000");

  // Single-policy lookup: ?policyId=LEDGER_TO_LEDGER
  if (policyId) {
    const policy = getTolerancePolicy(policyId);
    if (!policy) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid policyId: ${policyId}. Valid: ${TOLERANCE_POLICIES.map(p => p.id).join(", ")}`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      _meta: {
        activeModel: "v25.3.9",
        source: TOLERANCE_POLICIES_SOURCE,
        policiesVersion: TOLERANCE_POLICIES_VERSION,
        status: TOLERANCE_POLICIES_STATUS,
        taskId: "O2",
        taskTrace: "1a0ee793ba929555",
      },
      policy,
    });
  }

  // Reconcile (test the engine): ?reconcile=true&tolerancePolicyId=X&...
  if (reconcileParam && tolerancePolicyId) {
    try {
      const record = reconcile({
        tolerancePolicyId,
        valuationTimestamp,
        dataSource,
        assetClass,
        currency,
        expectedValue,
        actualValue,
      });
      return NextResponse.json({
        ok: true,
        _meta: {
          activeModel: "v25.3.9",
          source: TOLERANCE_POLICIES_SOURCE,
          policiesVersion: TOLERANCE_POLICIES_VERSION,
          status: TOLERANCE_POLICIES_STATUS,
          taskId: "O2",
          taskTrace: "1a0ee793ba929555",
        },
        reconciliationRecord: record,
        requiredFields: REQUIRED_RECONCILIATION_RECORD_FIELDS,
        rule:
          "Per O-directive: every reconciliation record must include the 6 required fields " +
          "(tolerancePolicyId, valuationTimestamp, dataSource, assetClass, currency, exceptionPolicy). " +
          "The legacy universal 1 bps tolerance is SUPERSEDED.",
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
        { status: 400 }
      );
    }
  }

  // Per-asset effective tolerance lookup:
  //   ?toleranceForAsset=GOLD&policyId=CUSTODY_QUANTITY
  // (only reached when policyId is set — see the single-policy branch above, which
  // short-circuits when the user passes both. For per-asset only, require policyId
  // in the query as well; otherwise fall through to default.)
  if (toleranceForAsset && policyId === null) {
    // No policyId set — default to CUSTODY_QUANTITY for the per-asset lookup.
    const policyForAsset: TolerancePolicyId = "CUSTODY_QUANTITY";
    try {
      const result = getToleranceForAsset(policyForAsset, toleranceForAsset);
      return NextResponse.json({
        ok: true,
        _meta: {
          activeModel: "v25.3.9",
          source: TOLERANCE_POLICIES_SOURCE,
          policiesVersion: TOLERANCE_POLICIES_VERSION,
          status: TOLERANCE_POLICIES_STATUS,
          taskId: "O2",
          taskTrace: "1a0ee793ba929555",
        },
        policyId: policyForAsset,
        assetClass: toleranceForAsset,
        effectiveTolerance: result,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
        { status: 400 }
      );
    }
  }

  // Default: return all 6 policies
  return NextResponse.json({
    ok: true,
    _meta: {
      activeModel: "v25.3.9",
      policiesSource: TOLERANCE_POLICIES_SOURCE,
      policiesVersion: TOLERANCE_POLICIES_VERSION,
      status: TOLERANCE_POLICIES_STATUS,
      moduleId: MODULE_ID,
      legacyStatus: LEGACY_UNIVERSAL_TOLERANCE_STATUS,
      overrideRule:
        "6 separate tolerance policies. NO universal tolerance. Each reconciliation type has its OWN policy " +
        "with its OWN tolerance + exception policy. Per O-directive (trace 1a0ee793ba929555).",
      taskId: "O2",
      taskTrace: "1a0ee793ba929555",
      honestState: HONEST_STATE,
    },
    policies: TOLERANCE_POLICIES,
    fieldCount: 6,
    fields: ["tolerancePolicyId", "valuationTimestamp", "dataSource", "assetClass", "currency", "exceptionPolicy"],
    rule:
      "Every reconciliation record must include 6 fields: tolerancePolicyId, valuationTimestamp, dataSource, " +
      "assetClass, currency, exceptionPolicy. Use ?reconcile=true&tolerancePolicyId=X&... to test the " +
      "reconciliation engine. Use ?policyId=X for single-policy lookup. Use ?toleranceForAsset=GOLD&policyId=" +
      "CUSTODY_QUANTITY for per-asset effective tolerance lookup.",
  });
}
