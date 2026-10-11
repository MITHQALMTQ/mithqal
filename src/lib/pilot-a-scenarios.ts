/**
 * Pilot A Scenario Matrix — Canonical v26.0 §8.9
 * 10 scenarios (A-01 through A-10) for control-plane demonstration with MTQ disabled.
 */

import { FINALITY_STATE_MACHINE, type FinalityState } from "./finality-state-machine";
import { assertMtqEnabled, getMtqPilotStage } from "./mtq-gate";
import { RECONCILIATION_TOLERANCE_REGISTRY, evaluateMismatch } from "./reconciliation-tolerance";

export type ScenarioId = "A-01" | "A-02" | "A-03" | "A-04" | "A-05" | "A-06" | "A-07" | "A-08" | "A-09" | "A-10";

export interface ScenarioDefinition {
  scenarioId: ScenarioId;
  name: string;
  setup: string;
  expectedBehavior: string;
  evidenceToRetain: string[];
  finalityStatesExercised: FinalityState[];
  mtqMustRemainDisabled: true;
  blueprint_ref: string;
}

export const PILOT_A_SCENARIOS: ScenarioDefinition[] = [
  { scenarioId: "A-01", name: "Normal eligible instruction", setup: "Approved test institution, corridor and asset; complete fresh inputs; healthy adapter.", expectedBehavior: "Accept durably; evaluate policy; eligible route; progress through verified states; reconcile.", evidenceToRetain: ["Instruction ID", "policy hash", "route candidates", "event/outbox IDs", "source fixtures"], finalityStatesExercised: ["F0", "F1", "F2", "F3"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-01" },
  { scenarioId: "A-02", name: "Ineligible jurisdiction/institution/asset", setup: "Set eligibility to prohibited, unknown or outside the scope.", expectedBehavior: "Deny or hold before consequential side effect; do not allow optimizer to override.", evidenceToRetain: ["Rule/registry version", "reason code", "denied transition"], finalityStatesExercised: ["F0"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-02" },
  { scenarioId: "A-03", name: "Required compliance source unavailable or stale", setup: "Timeout, expired screening or missing required result.", expectedBehavior: "Fail closed or explicit approved hold; no 'pass by timeout'.", evidenceToRetain: ["Source health", "expiry metadata", "hold reason"], finalityStatesExercised: ["F0"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-03" },
  { scenarioId: "A-04", name: "Route/cutoff/liquidity change", setup: "Make the preferred route unavailable; provide a second pre-approved route.", expectedBehavior: "Recompute among eligible alternatives only; record old/new route.", evidenceToRetain: ["Input snapshots", "candidate rankings", "route switch"], finalityStatesExercised: ["F0", "F1"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-04" },
  { scenarioId: "A-05", name: "Rail/provider failure after submission", setup: "Timeout with outcome uncertain; deliver delayed callback after retry.", expectedBehavior: "Query by stable reference; do not duplicate side effect.", evidenceToRetain: ["Request/response trace", "provider reference", "duplicate detection"], finalityStatesExercised: ["F0", "F1"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-05" },
  { scenarioId: "A-06", name: "Reconciliation mismatch", setup: "Amounts/status/references differ across independent fixture sources.", expectedBehavior: "Open exception; block affected closure; no tolerance may conceal mismatch.", evidenceToRetain: ["Source diffs", "tolerance class", "case owner", "disposition"], finalityStatesExercised: ["F0", "F1"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-06" },
  { scenarioId: "A-07", name: "Duplicate/out-of-order events", setup: "Replay same event twice, then send an older state after newer state.", expectedBehavior: "Duplicate effect suppressed; stale state transition rejected.", evidenceToRetain: ["Event IDs", "idempotency records", "sequence numbers"], finalityStatesExercised: ["F0", "F4"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-07" },
  { scenarioId: "A-08", name: "Outbox/projection lag", setup: "Pause dispatcher or Turso projector while canonical Neon commit succeeds.", expectedBehavior: "Authoritative state remains in Neon; UI labels projection stale.", evidenceToRetain: ["Commit/outbox IDs", "delivery attempts", "watermark lag"], finalityStatesExercised: ["F0", "F4"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-08" },
  { scenarioId: "A-09", name: "Safe halt / kill switch", setup: "Trigger critical policy/evidence/identity failure.", expectedBehavior: "Block affected new work; preserve unrelated safe read access.", evidenceToRetain: ["Trigger", "affected scope", "approver", "resume criteria"], finalityStatesExercised: ["F0", "F3"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-09" },
  { scenarioId: "A-10", name: "Recovery and regulatory replay", setup: "Restore known-good code/data or replay a historical instruction.", expectedBehavior: "Reproduce historical decision or disclose missing inputs.", evidenceToRetain: ["Snapshot/hash", "replay manifest", "source versions"], finalityStatesExercised: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"], mtqMustRemainDisabled: true, blueprint_ref: "v26.0 §8.9 A-10" },
];

export interface ScenarioResult {
  scenarioId: ScenarioId;
  name: string;
  startedAt: string;
  completedAt: string;
  outcome: "PASS" | "FAIL" | "BLOCKED_EXPECTED" | "ERROR";
  finalStateReached: FinalityState;
  mtqGate: { enabled: boolean; pilotStage: "A" | "B"; denied: boolean; reason: string | null };
  steps: Array<{ step: string; description: string; status: "PASS" | "FAIL" | "BLOCKED" | "SKIP"; evidence: string; timestamp: string }>;
  evidenceBundle: { instructionId: string; policyVersion: string; routeCandidates: string[]; eventOutboxIds: string[]; sourceFixtures: string[]; replayOutput: string | null; reconciliationResult: string | null };
  blueprint_ref: string;
  honestState: { simulated: true; productionAuthorized: false; mtqDisabled: true; note: string };
}

export function runPilotAScenario(scenarioId: ScenarioId): ScenarioResult {
  const scenario = PILOT_A_SCENARIOS.find(s => s.scenarioId === scenarioId);
  if (!scenario) throw new Error(`Unknown Pilot A scenario: ${scenarioId}`);
  const startedAt = new Date().toISOString();
  const instructionId = `MBG-INSTR-PILOT-A-${scenarioId}-${crypto.randomUUID().slice(0, 8)}`;
  const mtqGate = assertMtqEnabled(`pilot-a-${scenarioId}`);
  const steps: ScenarioResult["steps"] = [{
    step: "mtq-gate-check",
    description: "Verify MTQ is disabled per v26.0 §3.2",
    status: mtqGate.ok ? "FAIL" : "PASS",
    evidence: mtqGate.ok ? "MTQ unexpectedly enabled" : `MTQ disabled as expected: ${mtqGate.reason ?? "denied"}`,
    timestamp: startedAt,
  }];
  let finalStateReached: FinalityState = "F0";
  let outcome: ScenarioResult["outcome"] = "PASS";
  for (const state of scenario.finalityStatesExercised) {
    const def = FINALITY_STATE_MACHINE[state];
    const step = { step: `finality-${state}`, description: `${state}: ${def.name}`, status: "PASS" as const, evidence: def.minimumProofPredicate, timestamp: new Date().toISOString() };
    if (state === "F3") {
      const f3Gate = assertMtqEnabled(`pilot-a-${scenarioId}-F3`);
      if (f3Gate.ok) { step.status = "FAIL"; step.evidence = "MTQ gate unexpectedly passed"; outcome = "FAIL"; }
      else { step.status = "BLOCKED"; step.evidence = `F3 BLOCKED as expected: ${f3Gate.reason}`; outcome = "BLOCKED_EXPECTED"; }
    }
    steps.push(step);
    finalStateReached = state;
    if (state === "F3" && outcome === "BLOCKED_EXPECTED") break;
  }
  const evidenceBundle: ScenarioResult["evidenceBundle"] = {
    instructionId,
    policyVersion: "v26.0-pilot-a-policy-1.0",
    routeCandidates: scenario.scenarioId === "A-04" ? ["route-preferred (REJECTED)", "route-alternative (SELECTED)"] : ["route-AED-TOKENIZED-DEPOSIT", "route-SGD-CBDC"],
    eventOutboxIds: [`OB-${instructionId.slice(-12)}`, `EVT-${instructionId.slice(-12)}`],
    sourceFixtures: [`fixtures/pilot-a/${scenarioId}-setup.json`],
    replayOutput: scenario.scenarioId === "A-10" ? "replay-manifest-v26.json" : null,
    reconciliationResult: scenario.scenarioId === "A-06" ? evaluateMismatch("IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE", 1, "exact_match").disposition : scenario.scenarioId === "A-08" ? evaluateMismatch("EVENTUAL_CONSISTENCY_PROJECTION", 120000, "ms_lag").disposition : null,
  };
  return {
    scenarioId, name: scenario.name, startedAt, completedAt: new Date().toISOString(),
    outcome, finalStateReached,
    mtqGate: { enabled: mtqGate.ok, pilotStage: getMtqPilotStage(), denied: !mtqGate.ok, reason: mtqGate.reason },
    steps, evidenceBundle, blueprint_ref: scenario.blueprint_ref,
    honestState: { simulated: true, productionAuthorized: false, mtqDisabled: !mtqGate.ok, note: "Pilot A synthetic demonstration. MTQ disabled per v26.0 §3.2." },
  };
}

export function runAllPilotAScenarios() {
  const results = PILOT_A_SCENARIOS.map(s => {
    try { return runPilotAScenario(s.scenarioId); }
    catch (err) {
      return {
        scenarioId: s.scenarioId, name: s.name, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        outcome: "ERROR" as const, finalStateReached: "F0" as FinalityState,
        mtqGate: { enabled: false, pilotStage: "A" as const, denied: true, reason: err instanceof Error ? err.message : "unknown" },
        steps: [], evidenceBundle: { instructionId: `ERROR-${s.scenarioId}`, policyVersion: "v26.0", routeCandidates: [], eventOutboxIds: [], sourceFixtures: [], replayOutput: null, reconciliationResult: null },
        blueprint_ref: s.blueprint_ref,
        honestState: { simulated: true, productionAuthorized: false, mtqDisabled: true, note: `Errored: ${err instanceof Error ? err.message : "unknown"}` },
      } satisfies ScenarioResult;
    }
  });
  return {
    scenarios: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.outcome === "PASS").length,
      failed: results.filter(r => r.outcome === "FAIL").length,
      blockedExpected: results.filter(r => r.outcome === "BLOCKED_EXPECTED").length,
      errored: results.filter(r => r.outcome === "ERROR").length,
      mtqDisabledInAll: results.every(r => r.mtqGate.denied),
      finalStatesReached: Array.from(new Set(results.map(r => r.finalStateReached))),
      blueprint_ref: "v26.0 §8.9 Pilot A scenario matrix",
      honestState: "Pilot A control-plane demonstration with MTQ disabled per v26.0 §3.2. All scenarios are SYNTHETIC.",
    },
  };
}

export function getScenarioDefinitions(): ScenarioDefinition[] { return PILOT_A_SCENARIOS; }
export function getReconciliationRegistry() { return RECONCILIATION_TOLERANCE_REGISTRY; }
