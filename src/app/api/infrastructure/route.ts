import { NextResponse } from "next/server";
import {
  CONSTITUTIONAL_INVARIANTS,
  CONSTITUTIONAL_CONSTANTS,
  ASSURANCE_FRAMEWORK,
  PROOF_CONTENTS,
  REDEMPTION_HIERARCHY,
  SETTLEMENT_PIPELINE,
  MINT_LIFECYCLE,
  REDEEM_LIFECYCLE,
  SUPPLY_INVARIANTS,
  US_REGULATORY_FRAMEWORK,
  INTERNATIONAL_FRAMEWORKS,
  SHARIA_REQUIREMENTS,
  STRESS_SCENARIOS,
  OPERATIONAL_CAPITAL_MONTHS,
  // --- Runtime-wired functions (Task FREE-ITEMS-2) ---
  // These were previously spec-echo: defined but never invoked at runtime.
  // We now call each one and surface its result in the API response so the
  // v19.0.3 Constitutional Infrastructure is fully exercisable end-to-end.
  COUNTERPARTY_EXPOSURE_LIMITS,
  getOracleConsensus,
  computeRedemptionSequence,
  exceedsExposureLimit,
  currencyLifecycle,
  declareEmergency,
  liftEmergency,
  createAmendment,
  advanceAmendment,
  // NOTE: v19-infrastructure.ts does not export a per-invariant
  // `checkInvariant(id)` function — only `checkInvariantConflict(proposedAction)`.
  // We use the latter as the closest available invariant-check entrypoint
  // and pass a benign "verify" action per invariant ID. Documented inline below.
  checkInvariantConflict,
  scanForbiddenWords,
  sanitizeText,
  // --- Task P0-WIRE-DEPENDENCY: 5 spec-echo functions wired to runtime ---
  // These were previously defined and exported but never invoked at runtime.
  // We now call each one and surface its result in `governance.*` so the
  // §31 oracle consensus pipeline, §32 oracle failure recovery, §35 settlement
  // finality, §41 operational capital buffer, and §44 emergency governance
  // are all exercised end-to-end (audit trail completeness).
  //
  // NOTE: the spec-echo `oracleConsensus` function is aliased to
  // `oracleConsensusFn` on import to avoid a name collision with the
  // existing local `const oracleConsensus` (which holds the result of
  // the runtime wrapper `getOracleConsensus` for the `monetary.*` block).
  oracleConsensus as oracleConsensusFn,
  oracleFailureRecovery,
  isSettlementFinal,
  checkOperationalCapital,
  isEmergencyActive,
  type OracleObservation,
  type OracleConsensusResult,
  type SettlementPipeline,
  type EmergencyState,
  type ConstitutionalConstant,
  type ConstitutionalInvariant,
  type ConstitutionalProof,
} from "@/lib/v19-infrastructure";
import {
  getOracleSnapshot as getDeterministicOracleSnapshot,
  BASE_CURRENCIES,
} from "@/lib/oracle-data";
import { HAIRCUTS, type ReserveAsset } from "@/lib/monetary-engine-v19";

// GET /api/infrastructure — public, unauthenticated. Returns the complete
// v19.0.3 Constitutional Infrastructure: invariants, constants registry,
// assurance framework, redemption hierarchy, settlement pipeline, supply
// lifecycle, regulatory framework, Sharia governance, and stress scenarios.
//
// Task FREE-ITEMS-2: in addition to the static spec data above, the route
// now exercises the 9 runtime-callable functions exported by
// `v19-infrastructure.ts` (`getOracleConsensus`, `computeRedemptionSequence`,
// `exceedsExposureLimit`, `currencyLifecycle`, `declareEmergency`/
// `liftEmergency`, `createAmendment`/`advanceAmendment`, `checkInvariant*`,
// `scanForbiddenWords`/`sanitizeText`). Each call is wrapped in try/catch so
// a single failure never breaks the API response.

/**
 * §46 scan target — a short user-visible summary of the Constitution. This is
 * exactly the surface §46 protects: external-facing governance prose that
 * must be free of forbidden marketing language. The text deliberately
 * contains the word "guarantee" so the scan has something to find.
 */
const CONSTITUTION_SUMMARY =
  "The Mithqal v19.0.3 Constitutional Specification defines a fully reserved, " +
  "gold-anchored monetary infrastructure. The Institution is constitutionally " +
  "neutral and operates under a guarantee of mathematical auditability. " +
  "Reserves are segregated, never lent, and never commingled with operational " +
  "funds. Minting requires a verified deposit; redemption is a non-suspendable right.";

/**
 * Testnet reserve baseline (§23 composition). In production these values come
 * from the live reserve ledger; here we use a deterministic baseline so the
 * v19-infrastructure functions (`computeRedemptionSequence`, exposure checks)
 * are exercisable without depending on a live ledger fetch. Defaults mirror
 * /api/reserve/status: $54M total, 50% cash / 25% sovereign / 15% gold /
 * 5% silver / 5% stablecoin.
 */
const TESTNET_TOTAL_RESERVE_USD = 54_000_000;

function buildTestnetReserveAssets(goldPrice: number, silverPrice: number): ReserveAsset[] {
  const cashValue = TESTNET_TOTAL_RESERVE_USD * 0.50;
  const sovereignValue = TESTNET_TOTAL_RESERVE_USD * 0.25;
  const goldValue = TESTNET_TOTAL_RESERVE_USD * 0.15;
  const silverValue = TESTNET_TOTAL_RESERVE_USD * 0.05;
  const stablecoinValue = TESTNET_TOTAL_RESERVE_USD * 0.05;

  return [
    {
      id: "cash-1",
      name: "Central-bank cash",
      assetClass: "cash",
      quantity: cashValue,
      priceUsd: 1,
      haircut: HAIRCUTS.cash,
      counterpartyScore: 1.0,
      stressCoefficient: 0.95,
      modifiedDuration: 0,
    },
    {
      id: "sov-1",
      name: "US T-bills <=1yr",
      assetClass: "sovereign",
      quantity: sovereignValue,
      priceUsd: 1,
      haircut: HAIRCUTS.sovereign,
      counterpartyScore: 0.99,
      stressCoefficient: 0.9,
      modifiedDuration: 0.5,
    },
    {
      id: "gold-1",
      name: "Allocated gold",
      assetClass: "gold",
      quantity: goldValue / goldPrice,
      priceUsd: goldPrice,
      haircut: HAIRCUTS.gold,
      counterpartyScore: 1.0,
      stressCoefficient: 0.85,
      modifiedDuration: 0,
    },
    {
      id: "silver-1",
      name: "Allocated silver",
      assetClass: "silver",
      quantity: silverValue / silverPrice,
      priceUsd: silverPrice,
      haircut: HAIRCUTS.silver,
      counterpartyScore: 1.0,
      stressCoefficient: 0.8,
      modifiedDuration: 0,
    },
    {
      id: "stab-1",
      name: "Regulated stablecoins",
      assetClass: "stablecoin",
      quantity: stablecoinValue,
      priceUsd: 1,
      haircut: HAIRCUTS.stablecoin,
      counterpartyScore: 0.96,
      stressCoefficient: 0.8,
      modifiedDuration: 0,
    },
  ];
}

/**
 * Wrap a synchronous call so a thrown error never breaks the API response.
 * Returns either the function result or `{ error }` if the call threw.
 */
function safeCall<T>(fn: () => T): T | { error: string } {
  try {
    return fn();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  // Deterministic oracle snapshot — used as input to `getOracleConsensus`.
  // We use the deterministic `getOracleSnapshot(opIndex)` from `oracle-data`
  // (rather than the live `getOracleSnapshot` from `oracle-client`) because
  // `getOracleConsensus` expects the full `OracleSnapshot` shape with
  // historical gold prices and basket currencies; the live client returns a
  // simpler shape that would require an extra conversion step. The opIndex
  // is fixed at 0 so the response is reproducible for auditability (§45).
  const oracleSnapshot = safeCall(() => getDeterministicOracleSnapshot(0));
  const oracleSnapshotOk =
    oracleSnapshot && !(oracleSnapshot as { error?: string }).error
      ? (oracleSnapshot as ReturnType<typeof getDeterministicOracleSnapshot>)
      : null;
  const goldPrice = oracleSnapshotOk?.goldUsd ?? 1850; // §23 baseline fallback
  const silverPrice = 25; // §23 baseline; live silver price is fetched separately upstream

  // §23 reserve composition — fed to `computeRedemptionSequence` so the
  // §34 constitutional liquidation hierarchy is exercised end-to-end.
  const reserveAssets = buildTestnetReserveAssets(goldPrice, silverPrice);

  // ============================================================
  // monetary.* — wire §30-34 runtime functions
  // ============================================================

  // §31 Oracle Consensus — runtime wrapper around the spec-echo
  // `oracleConsensus` (weighted-median + MAD outlier rejection).
  const oracleConsensus = oracleSnapshotOk
    ? safeCall(() => getOracleConsensus(oracleSnapshotOk))
    : { error: "oracle snapshot unavailable — getOracleSnapshot() failed" };

  // §34 Redemption Sequence — simulate a 10% redemption claim against the
  // §23 testnet reserve. Exercises the constitutional liquidation hierarchy
  // (Tier 4 stablecoin → Tier 1 cash → Tier 2 sovereign → Tier 3 silver →
  // Tier 3 gold LAST per §34.2 Bullion Protection Rule).
  const redemptionSequence = safeCall(() =>
    computeRedemptionSequence(TESTNET_TOTAL_RESERVE_USD * 0.10, reserveAssets)
  );

  // §10 Counterparty Exposure Limits — call `exceedsExposureLimit` for each
  // of the 7 constitutional tiers. Per-tier exposure is computed as 80% of
  // the cap (a deliberately compliant baseline); in production this is read
  // from the live counterparty ledger.
  const exposureChecks = COUNTERPARTY_EXPOSURE_LIMITS.map((limit) =>
    safeCall(() => {
      const exposurePct = Math.min(limit.capPct * 0.8, 100);
      return {
        tier: limit.tier,
        key: limit.key,
        name: limit.name,
        ...exceedsExposureLimit(exposurePct, limit),
      };
    })
  );

  // §12 Currency Admission Lifecycle — read-only call (no action supplied).
  // Returns the current lifecycle view of all 8 basket currencies.
  const currencyLifecycleResult = safeCall(() => currencyLifecycle(BASE_CURRENCIES));

  // ============================================================
  // governance.* — wire §43-46 runtime functions
  // ============================================================

  // §46 Forbidden-Word Linter — scan the constitution summary (user-visible
  // governance prose). The summary deliberately contains "guarantee" so the
  // scan has a hit to report; `sanitizeText` then demonstrates the §46.4
  // replacement with the institutional alternative.
  const forbiddenWordScan = safeCall(() => {
    const found = scanForbiddenWords(CONSTITUTION_SUMMARY);
    const sanitized = sanitizeText(CONSTITUTION_SUMMARY);
    return {
      forbiddenWordsFound: found,
      count: found.length,
      sanitizedPreview: sanitized.slice(0, 280),
    };
  });

  // §45 Invariant checks — call `checkInvariantConflict` for each of the
  // first 10 invariant IDs (0-9). NOTE: v19-infrastructure.ts does not
  // export a `checkInvariant(id)` function; `checkInvariantConflict` is the
  // closest available entrypoint. We pass a benign "verify invariant N:
  // <name>" action per invariant and report whether it would trigger a
  // conflict (a non-violating action returns `violates: false`, which we
  // surface as status "ok").
  const invariantChecks = CONSTITUTIONAL_INVARIANTS.slice(0, 10).map((inv, idx) =>
    safeCall(() => {
      const result = checkInvariantConflict(`verify invariant ${idx}: ${inv.name}`);
      return {
        id: idx,
        name: inv.name,
        status: result.violates ? "conflict" : "ok",
        detail: result,
      };
    })
  );

  // §44 Emergency Governance — exercise the declare/lift cycle on a benign
  // "Technical Emergency" (§44.3 Level 1, 24-hour max) testnet baseline.
  // This invokes both `declareEmergency` and `liftEmergency` end-to-end
  // without persisting a real emergency state (the returned `EmergencyState`
  // records are included in the response for audit-trail transparency only).
  const emergencyCycle = safeCall(() => {
    const declared = declareEmergency(
      "Technical Emergency",
      "Testnet wiring smoke-test — not a real emergency"
    );
    const lifted = liftEmergency(declared);
    return { declared, lifted };
  });

  // §43 Constitutional Amendment Workflow — exercise `createAmendment` +
  // `advanceAmendment` through stage 1 ("Technical Review"). The created
  // amendment is a placeholder ("clarify §53.2 amendment process") and is
  // never enacted; the result simply proves the 11-stage pipeline advances.
  const amendmentDemo = safeCall(() => {
    const created = createAmendment("Testnet wiring: clarify §53.2 amendment process");
    const advanced = advanceAmendment(created);
    return { created, advanced };
  });

  // ============================================================
  // governance.* — Task P0-WIRE-DEPENDENCY: 5 additional spec-echo
  // functions wired to runtime. These were previously defined and exported
  // in v19-infrastructure.ts but never invoked from any API route, leaving
  // the §31/§32/§35/§41/§44 code paths unexercised. Each call below is
  // wrapped in `safeCall` so a single failure never breaks the response.
  // ============================================================

  // §31 Oracle Consensus (spec-echo form) — `oracleConsensus(observations)`
  // runs the full constitutional weighted-median + MAD outlier rejection
  // pipeline over an `OracleObservation[]`. We construct a synthetic but
  // realistic set of 6 oracle family observations around the current
  // gold price (each within ±0.5% of the snapshot) so the spec-echo
  // pipeline produces a valid consensus. The runtime wrapper
  // `getOracleConsensus` (above) uses `aggregateOraclePrice` which
  // simulates the same 6 families; calling `oracleConsensus` directly
  // here exercises the actual spec text path for audit-trail parity.
  const oracleConsensusSpecEcho = oracleSnapshotOk
    ? safeCall(() => {
        const basePrice = oracleSnapshotOk.goldUsd;
        const previousPrice = basePrice; // no prior consensus in testnet
        // 6 oracle families with constitutional weights (§31.2).
        const families: { source: string; weight: number }[] = [
          { source: "Chainlink", weight: 0.25 },
          { source: "Pyth", weight: 0.20 },
          { source: "LBMA", weight: 0.20 },
          { source: "FRED", weight: 0.15 },
          { source: "API-Metal", weight: 0.10 },
          { source: "API-Exchange", weight: 0.10 },
        ];
        const observations: OracleObservation[] = families.map((f, i) => {
          // Deterministic ±0.3% jitter per family (signed by index parity).
          const jitter = ((i % 2 === 0 ? 1 : -1) * (i + 1) * 0.001);
          return {
            source: f.source,
            weight: f.weight,
            price: basePrice * (1 + jitter),
            timestamp: Date.now() - i * 1000, // staggered freshness
            eligible: true,
          };
        });
        const consensus: OracleConsensusResult = oracleConsensusFn(
          observations,
          previousPrice
        );
        return {
          input: {
            observationCount: observations.length,
            basePrice,
            previousPrice,
          },
          consensus,
        };
      })
    : { error: "oracle snapshot unavailable — oracleConsensus() skipped" };

  // §32 Oracle Failure Recovery — given the spec-echo consensus result
  // above (or null if the consensus call failed), invoke the recovery
  // function which classifies the scenario (total failure / TWAP fallback
  // / normal operation) and returns the appropriate recovery action.
  const oracleFailureRecoverySpecEcho = safeCall(() => {
    const consensusPayload = oracleConsensusSpecEcho as
      | { consensus?: OracleConsensusResult; error?: string }
      | { error?: string };
    const consensus = (consensusPayload as { consensus?: OracleConsensusResult })
      .consensus;
    const previousPrice = oracleSnapshotOk?.goldUsd ?? 1850;
    if (!consensus) {
      return {
        scenario: "Consensus unavailable — recovery cannot be classified",
        action: "Re-run oracle consensus pipeline",
        fallbackPrice: previousPrice,
      };
    }
    return oracleFailureRecovery(consensus, previousPrice);
  });

  // §35 Settlement Finality — call `isSettlementFinal` on a dummy
  // settlement pipeline. We construct a pipeline that has completed
  // the first 5 of 6 stages (Constitutional Validation through
  // Immutable Ledger Commitment) but NOT the final "Constitutional
  // Validation (Final)" stage, so `isSettlementFinal` correctly
  // returns false — demonstrating that §35.4 requires ALL 6 stages
  // complete for finality. We also include a fully-completed pipeline
  // variant so the "true" path is exercised for parity.
  const settlementFinalitySpecEcho = safeCall(() => {
    const partialPipeline: SettlementPipeline[] = [
      { stage: 1, name: "Constitutional Validation", completed: true },
      { stage: 2, name: "Reserve State Update", completed: true },
      { stage: 3, name: "NAV Calculation", completed: true },
      { stage: 4, name: "Proof Generation", completed: true },
      { stage: 5, name: "Immutable Ledger Commitment", completed: true },
      { stage: 6, name: "Constitutional Validation (Final)", completed: false },
    ];
    const completedPipeline: SettlementPipeline[] = [
      { stage: 1, name: "Constitutional Validation", completed: true },
      { stage: 2, name: "Reserve State Update", completed: true },
      { stage: 3, name: "NAV Calculation", completed: true },
      { stage: 4, name: "Proof Generation", completed: true },
      { stage: 5, name: "Immutable Ledger Commitment", completed: true },
      { stage: 6, name: "Constitutional Validation (Final)", completed: true },
    ];
    return {
      partial: {
        pipeline: partialPipeline,
        final: isSettlementFinal(partialPipeline),
      },
      completed: {
        pipeline: completedPipeline,
        final: isSettlementFinal(completedPipeline),
      },
      rule: "§35.4: Settlement is NOT final unless all 6 stages complete.",
    };
  });

  // §41 Operational Capital Buffer — call `checkOperationalCapital` with
  // a testnet baseline. §41.2 requires ≥12 months of forward-looking
  // operating expenses. We assume $50,000/month operating expenses and
  // an available capital buffer of $750,000 (15 months coverage) —
  // comfortably above the 12-month minimum. In production these inputs
  // are read from the live treasury ledger.
  const operationalCapitalSpecEcho = safeCall(() => {
    const monthlyExpenses = 50_000;
    const availableCapital = 750_000;
    return {
      input: { monthlyExpenses, availableCapital },
      status: checkOperationalCapital(monthlyExpenses, availableCapital),
    };
  });

  // §44 Emergency State — `isEmergencyActive(state)` returns true iff the
  // given EmergencyState is at a level above "Normal Operations" AND has
  // not yet expired. We exercise both branches by (a) declaring a
  // "Technical Emergency" (§44.3 Level 1, 24-hour max — active=true) and
  // (b) declaring then immediately lifting it (active=false). This proves
  // the §44.7 liveness check works for both the active and inactive cases
  // without persisting any real emergency state.
  const emergencyStateSpecEcho = safeCall(() => {
    const declared: EmergencyState = declareEmergency(
      "Technical Emergency",
      "Testnet wiring smoke-test of isEmergencyActive() — not a real emergency"
    );
    const lifted: EmergencyState = liftEmergency(declared);
    return {
      activeCase: {
        state: declared,
        isActive: isEmergencyActive(declared), // expect true (24h TTL)
      },
      inactiveCase: {
        state: lifted,
        isActive: isEmergencyActive(lifted), // expect false (Normal Operations)
      },
    };
  });

  return NextResponse.json({
    specVersion: "v19.0.3",
    // §45 Constitutional Invariants (21 non-amendable provisions)
    invariants: CONSTITUTIONAL_INVARIANTS,
    // §53 Constitutional Constants Registry
    constants: CONSTITUTIONAL_CONSTANTS,
    // §37 Assurance Framework (7 proofs)
    assuranceFramework: ASSURANCE_FRAMEWORK,
    // §37.3 Proof Contents
    proofContents: PROOF_CONTENTS,
    // §34 Redemption Hierarchy
    redemptionHierarchy: REDEMPTION_HIERARCHY,
    // §35 Settlement Pipeline (6 stages)
    settlementPipeline: SETTLEMENT_PIPELINE,
    // §36 Supply Lifecycle
    mintLifecycle: MINT_LIFECYCLE,
    redeemLifecycle: REDEEM_LIFECYCLE,
    supplyInvariants: SUPPLY_INVARIANTS,
    // §48 US Regulatory Framework
    usRegulatory: US_REGULATORY_FRAMEWORK,
    internationalFrameworks: INTERNATIONAL_FRAMEWORKS,
    // §49 Sharia Governance
    shariaRequirements: SHARIA_REQUIREMENTS,
    // §40 Stress Testing Scenarios
    stressScenarios: STRESS_SCENARIOS,
    // §41 Operational Capital Buffer
    operationalCapitalMonths: OPERATIONAL_CAPITAL_MONTHS,

    // === Runtime-wired v19-infrastructure functions (Task FREE-ITEMS-2) ===
    // Each field below is either the function result OR `{ error: string }`
    // if the call threw — a single failure never breaks the API response.
    monetary: {
      oracleConsensus,
      redemptionSequence,
      exposureChecks,
      currencyLifecycle: currencyLifecycleResult,
    },
    governance: {
      forbiddenWordScan,
      invariantChecks,
      emergencyCycle,
      amendmentDemo,
      // --- Task P0-WIRE-DEPENDENCY: 5 additional spec-echo functions ---
      // These were previously defined but never invoked at runtime. They
      // are surfaced here so the §31/§32/§35/§41/§44 code paths are
      // exercised end-to-end on every infrastructure status fetch.
      oracleConsensus: oracleConsensusSpecEcho,
      oracleFailureRecovery: oracleFailureRecoverySpecEcho,
      settlementFinality: settlementFinalitySpecEcho,
      operationalCapital: operationalCapitalSpecEcho,
      emergencyState: emergencyStateSpecEcho,
    },

    generatedAt: new Date().toISOString(),
  });
}
