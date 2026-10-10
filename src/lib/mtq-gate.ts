/**
 * MTQ Activation Gate — Canonical v26.0 §3.2 Enforcement
 * MTQ is DISABLED BY DEFAULT in every environment.
 */

export type MtqGateDecision =
  | { ok: true; reason: null; productionAuthorized: false }
  | { ok: false; reason: string; productionAuthorized: false };

export function isMtqEnabled(): boolean {
  const flag = (process.env.MTQ_ENABLED ?? "false").trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

export function getMtqPilotStage(): "A" | "B" {
  const stage = (process.env.MTQ_PILOT_STAGE ?? "A").trim().toUpperCase();
  return stage === "B" ? "B" : "A";
}

export function assertMtqEnabled(action: string = "mtq-action"): MtqGateDecision {
  if (!isMtqEnabled()) {
    return {
      ok: false,
      reason: `MTQ is DISABLED by default per v26.0 §3.2. Action "${action}" denied. Set MTQ_ENABLED=true and MTQ_PILOT_STAGE=B only after G0..G6 gates pass and Pilot B is formally authorized.`,
      productionAuthorized: false,
    };
  }
  if (getMtqPilotStage() !== "B") {
    return {
      ok: false,
      reason: `MTQ_PILOT_STAGE is not "B" (current: ${getMtqPilotStage()}). MTQ actions are blocked during Pilot A per v26.0 §3.2. Action "${action}" denied.`,
      productionAuthorized: false,
    };
  }
  return { ok: true, reason: null, productionAuthorized: false };
}

export function getMtqStatusSummary(): string {
  const stage = getMtqPilotStage();
  if (!isMtqEnabled()) {
    return `MTQ DISABLED (Pilot ${stage}, MTQ_ENABLED=false) — per v26.0 §3.2.`;
  }
  if (stage !== "B") {
    return `MTQ DISABLED (Pilot A, MTQ_ENABLED=true but PILOT_STAGE=A) — per v26.0 §3.2.`;
  }
  return `MTQ ENABLED (Pilot B) — gate ledger G0..G6 must still pass.`;
}
