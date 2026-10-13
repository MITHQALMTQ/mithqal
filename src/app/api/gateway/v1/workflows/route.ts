import { NextResponse } from "next/server";
import { assertMtqEnabled } from "@/lib/mtq-gate";

const WORKFLOWS = [
  { id: "instruction-accepted", name: "Instruction Accepted (F0 → F1)", description: "Validates event schema, checks durable workflow state (idempotency), progresses F0 → F1 (Bank funding final), records outcome to Neon.", blueprint_ref: "v26.0 §4.1 step 3 + §4.2 F1 + §6.2 step 3 + §6.6" },
  { id: "backing-confirmation", name: "Backing Confirmation (F1 → F2)", description: "Computes EligibleBacking = MIN(Economic, Legal, Liquid, SettlementAvailable) per §3.3; blocks MTQ progression if backing is unverified.", blueprint_ref: "v26.0 §4.2 F2 + §3.3 Eligible Backing + §6.6" },
  { id: "monetary-authorization", name: "Monetary Authorization (F2 → F3, BM-15)", description: "CRITICAL: ALWAYS asserts MTQ gate first. In Pilot A (MTQ disabled), F3 hard-fails with DENY_OR_SAFE_HALT — no MTQ side effects.", blueprint_ref: "v26.0 §3.2 + §4.2 F3 + §4.4 BM-15 + §6.6" },
  { id: "reconciliation-sweep", name: "Reconciliation Sweep (§5.3)", description: "Sweeps all open reconciliation cases every 5 min; evaluates each against its class-specific tolerance (NO global tolerance per §5.3).", blueprint_ref: "v26.0 §5.3 + §7.6" },
  { id: "evidence-expiry-sweep", name: "Evidence Expiry Sweep (§5.2)", description: "Marks expired evidence per §5.2 — does NOT auto-refresh; human approval required where mandated.", blueprint_ref: "v26.0 §5.2" },
  { id: "provider-health-probe", name: "Provider Health Probe (§6.10)", description: "Probes all 5 providers (GitHub/Vercel/Neon/Turso/Inngest) every 10 min; alerts SEV-1 if any degraded.", blueprint_ref: "v26.0 §6.10 + §7.6" },
  { id: "data-source-sync", name: "Data Source Sync (legacy)", description: "Refreshes the real-market-data snapshot (VIX, gold spot, timestamp).", blueprint_ref: "Legacy v19 — retained for backward compatibility" },
];

export async function GET() {
  const mtqGate = assertMtqEnabled("workflow-catalog-info");
  return NextResponse.json({
    endpoint: "/gateway/v1/workflows",
    method: "GET",
    blueprint_ref: "v26.0 §6.6 — Inngest workflow requirements + §6.10 provider harmony",
    workflows: WORKFLOWS,
    mtqGate: { enabled: mtqGate.ok, denied: !mtqGate.ok, reason: mtqGate.reason },
    honestState: { productionAuthorized: false, mtqDisabled: !mtqGate.ok, note: "Per v26.0 §3.2, monetaryAuthorizationWorkflow (F3/BM-15) ALWAYS asserts the MTQ gate." },
    inngestWebhook: "/api/inngest",
    inngestCloud: "https://app.inngest.com",
    timestamp: new Date().toISOString(),
  });
}
