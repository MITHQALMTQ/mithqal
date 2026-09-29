// ════════════════════════════════════════════════════════════
// MITHQAL §V25.3 — MTQ Operating System
// 17-step canonical settlement pipeline + bank integration + ISO 20022
// ════════════════════════════════════════════════════════════
//
// v25.3.2 — CANONICAL SOURCE MOVED. The single canonical definition of
// the BM-01..BM-16B settlement workflow now lives in:
//
//     src/lib/settlement-workflow-canonical.ts
//
// (per the J-directive 2026-09-29 "Canonicalize the settlement workflow").
// This module re-exports the canonical workflow with MTQ-OS-specific
// presentation. The underlying BM-* definitions are NOT duplicated here.
//
// SUPERSEDED DEFINITIONS (removed in v25.3.2-J2):
//   OLD BM-15 = "Monetary Authorization — MITHQAL Monetary Control authorizes"
//     (the ID was correct; the description is now sourced from canonical)
//   OLD BM-16 = "Finality Verification + Mint — Finality verified →
//                deterministic mint"
//     (CONFLICT — old BM-16 conflated finality and mint into one step;
//      now split into BM-16A = Finality Verification + BM-16B = Mint
//      Execution per the J-directive)
//
// See SUPERSEDED-3 in src/lib/settlement-workflow-canonical.ts for the
// full traceability record.

import {
  CANONICAL_SETTLEMENT_WORKFLOW,
  CANONICAL_WORKFLOW_VERSION,
  CANONICAL_WORKFLOW_SOURCE,
  type CanonicalBMStep,
} from "../settlement-workflow-canonical";

export const MODULE_ID = "v25.3-mtq-os-1.0";
export const HONEST_STATE = { productionAuthorized: false, simulated: true };

// Re-export the canonical constants so callers that import from
// mtq-os can verify the canonical source at runtime.
export const MTQ_OS_WORKFLOW_VERSION = CANONICAL_WORKFLOW_VERSION;
export const MTQ_OS_WORKFLOW_SOURCE = CANONICAL_WORKFLOW_SOURCE;

// mtq-os presents the canonical workflow with its own per-step shape.
// The underlying definitions come from the single canonical source — DO
// NOT re-define BM-* inline here (any such re-definition is a
// contradiction per the contradiction scanner).
export interface IssuanceStep {
  id: string;
  name: string;
  description: string;
  phase: string;
  capability: "CONTROL_PLANE_CORE" | "MTQ_SETTLEMENT_MODULE";
  status: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION";
}

export const ISSUANCE_STEPS: IssuanceStep[] = CANONICAL_SETTLEMENT_WORKFLOW.map(
  (step: CanonicalBMStep) => ({
    id: step.id,
    name: step.name,
    description: step.description,
    phase: step.phase,
    capability: step.capability,
    status: step.status,
  }),
);

export interface BankNode { id: string; name: string; domain: string; description: string; }
export const BANK_INTEGRATION_NODES: BankNode[] = [
  { id: "BNK-01", name: "Corporate Treasury Portal", domain: "BANK", description: "Corporate treasury interface" },
  { id: "BNK-02", name: "Core Banking System", domain: "BANK", description: "Bank's authoritative core banking" },
  { id: "BNK-03", name: "KYC/KYB Engine", domain: "BANK", description: "Customer verification" },
  { id: "BNK-04", name: "AML/Sanctions Engine", domain: "BANK", description: "Compliance screening" },
  { id: "BNK-05", name: "FX/Treasury", domain: "BANK", description: "FX and treasury operations" },
  { id: "MBG-01", name: "MBG Adapter", domain: "MBG", description: "MITHQAL Bank Gateway adapter (translation)" },
  { id: "MBG-02", name: "ISO 20022 Layer", domain: "MBG", description: "ISO 20022 message translation" },
  { id: "MBG-03", name: "API Gateway", domain: "MBG", description: "REST API gateway" },
  { id: "MBG-04", name: "Host-to-Host", domain: "MBG", description: "H2H file transfer" },
  { id: "MTH-01", name: "MITHQAL Core", domain: "MITHQAL", description: "Core authorization engine" },
  { id: "MTH-02", name: "Ledger State Machine", domain: "MITHQAL", description: "MTQ ledger state transitions" },
  { id: "MTH-03", name: "Finality Gate", domain: "MITHQAL", description: "7-layer finality enforcement" },
];

export interface BankFlow { id: string; from: string; to: string; description: string; }
export const BANK_INTEGRATION_FLOWS: BankFlow[] = [
  { id: "F01", from: "BNK-01", to: "BNK-02", description: "Corporate → Core Banking" },
  { id: "F02", from: "BNK-02", to: "BNK-03", description: "Core → KYC/KYB" },
  { id: "F03", from: "BNK-03", to: "BNK-04", description: "KYC → AML/Sanctions" },
  { id: "F04", from: "BNK-04", to: "BNK-05", description: "AML → FX/Treasury" },
  { id: "F05", from: "BNK-05", to: "MBG-01", description: "Bank → MBG Adapter" },
  { id: "F06", from: "MBG-01", to: "MBG-02", description: "MBG → ISO 20022" },
  { id: "F07", from: "MBG-02", to: "MTH-01", description: "ISO 20022 → MITHQAL Core" },
  { id: "F08", from: "MTH-01", to: "MTH-02", description: "Core → Ledger" },
  { id: "F09", from: "MTH-02", to: "MTH-03", description: "Ledger → Finality Gate" },
];

export interface ISO20022Message { messageId: string; name: string; }
export const ISO_20022_MESSAGE_CATALOG: ISO20022Message[] = [
  { messageId: "pain.001", name: "Customer Credit Transfer Initiation" },
  { messageId: "pain.002", name: "Customer Payment Status Report" },
  { messageId: "pacs.002", name: "FIToFIPaymentStatusReport" },
  { messageId: "pacs.008", name: "FIToFICustomerCreditTransfer" },
  { messageId: "pacs.009", name: "FItoFICustomerDirectDebit" },
  { messageId: "camt.025", name: "Receipt" },
  { messageId: "camt.054", name: "BankToCustomerDebitCreditNotification" },
  { messageId: "camt.056", name: "FIToFIPaymentCancellationRequest" },
  { messageId: "head.001", name: "BusinessApplicationHeader" },
];

export function generateMTQOSReport() {
  return {
    moduleId: MODULE_ID,
    issuanceSteps: ISSUANCE_STEPS,
    bankIntegrationNodes: BANK_INTEGRATION_NODES,
    bankIntegrationFlows: BANK_INTEGRATION_FLOWS,
    iso20022MessageCatalog: ISO_20022_MESSAGE_CATALOG,
    honestState: HONEST_STATE,
    finalStatus: "SIMULATED — NOT PRODUCTION-AUTHORIZED",
  };
}
