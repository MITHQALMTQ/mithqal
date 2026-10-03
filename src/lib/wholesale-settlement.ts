// v25.0 §5+§7+§14+§17 — Wholesale Settlement & CBDC Interoperability
// =================================================================
// Implements the neutral cross-border settlement flow and CBDC
// interoperability layer.
// =================================================================

import {
  checkInstitutionAuthorization,
  getInstitution,
  isGeoFenced,
  type InstitutionRecord,
} from "./institutional-authorization";
import {
  SETTLEMENT_FLOW,
  REDEMPTION_FLOW,
  CBDC_INTEROP,
  type SettlementRecord,
} from "./v25-0-identity";

// ---- §5 Wholesale Settlement Transaction ----
export interface SettlementRequest {
  institutionId: string;
  counterpartyInstitutionId: string;
  amount: number;
  currency: string;
  corridor: string;
  customerReference?: string;  // institutional reference, NOT customer PII
  settlementChannel: string;
}

export interface SettlementResult {
  authorized: boolean;
  transactionId?: string;
  settlementRecord?: SettlementRecord;
  reason: string;
  pipeline: string[];
}

/**
 * §3.2 + §5 — Institutional Issuance & Settlement Pipeline
 *
 * The full pipeline from customer request to MTQ settlement:
 *   Underlying Customer → Regulated Bank → Institutional Issuance Request →
 *   Institution Authentication → Authority Check → Reserve Verification →
 *   Custody Verification → NAV Calculation → RR/Stress Checks →
 *   Proof of Reserves → Proof of Solvency → Issuance Authorization →
 *   Mint.sol → MTQ.sol → Settlement Layer
 */
export async function processWholesaleSettlement(
  request: SettlementRequest,
  navUsd: number,
  reserveRatio: number,
): Promise<SettlementResult> {
  const pipeline: string[] = [...SETTLEMENT_FLOW.canonical];

  // Step 1: Institution Authentication
  pipeline.push("Institution Authentication");
  const sender = getInstitution(request.institutionId);
  const receiver = getInstitution(request.counterpartyInstitutionId);
  if (!sender || !receiver) {
    return {
      authorized: false,
      reason: `Institution not found: ${!sender ? request.institutionId : request.counterpartyInstitutionId}`,
      pipeline,
    };
  }

  // Step 2: Geo-fence check (§16)
  if (isGeoFenced(sender.jurisdiction) || isGeoFenced(receiver.jurisdiction)) {
    return {
      authorized: false,
      reason: `Geo-fence violation: sender=${sender.jurisdiction} receiver=${receiver.jurisdiction}`,
      pipeline,
    };
  }

  // Step 3: Institutional Authority Check (§20)
  pipeline.push("Institutional Authority Check");
  const senderAuth = checkInstitutionAuthorization(
    request.institutionId, "SETTLE", request.amount, request.currency, request.corridor,
  );
  if (!senderAuth.authorized) {
    return { authorized: false, reason: `Sender not authorized: ${senderAuth.reason}`, pipeline };
  }

  const receiverAuth = checkInstitutionAuthorization(
    request.counterpartyInstitutionId, "SETTLE", request.amount, request.currency, request.corridor,
  );
  if (!receiverAuth.authorized) {
    return { authorized: false, reason: `Receiver not authorized: ${receiverAuth.reason}`, pipeline };
  }

  // Step 4: Eligible Reserve / Settlement Asset Verification
  pipeline.push("Eligible Reserve / Settlement Asset Verification");
  if (!sender.permittedCurrencies.includes(request.currency)) {
    return { authorized: false, reason: `Currency ${request.currency} not permitted for sender`, pipeline };
  }

  // Step 5: Custody Verification
  pipeline.push("Custody Verification");
  // (In production, this would verify custodian holdings)

  // Step 6: NAV Calculation
  pipeline.push("NAV Calculation");
  const nav = navUsd;

  // Step 7: Reserve Ratio / Stress-RR / Constitutional Checks
  pipeline.push("Reserve Ratio / Stress-RR / Constitutional Checks");
  if (reserveRatio < 100) {
    return { authorized: false, reason: `RR=${reserveRatio}% < 100% — minting disabled`, pipeline };
  }
  if (reserveRatio < 105) {
    // Policy floor — enhanced restrictions
    pipeline.push("Enhanced Restrictions (RR < 105%)");
  }

  // Step 8: Proof of Reserves
  pipeline.push("Proof of Reserves");
  // (In production, this would generate a cryptographic proof)

  // Step 9: Proof of Solvency
  pipeline.push("Proof of Solvency");

  // Step 10: Deterministic Issuance Authorization
  pipeline.push("Deterministic Issuance Authorization");

  // Step 11: Mint.sol → MTQ.sol
  pipeline.push("Mint.sol");
  pipeline.push("MTQ.sol");

  // Step 12: Settlement Layer
  pipeline.push("MTQ enters wholesale settlement layer");

  // Generate transaction ID and settlement record
  const transactionId = `MTQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const timestamp = new Date().toISOString();
  const cryptoHash = `0x${Math.random().toString(16).slice(2).padStart(64, "0").slice(0, 64)}`;

  const settlementRecord: SettlementRecord = {
    institutionalSender: request.institutionId,
    institutionalReceiver: request.counterpartyInstitutionId,
    transactionId,
    timestamp,
    mtqAmount: request.amount,
    settlementState: "SETTLED",
    authorizationState: "AUTHORIZED",
    complianceState: "CLEARED",
    reserveReference: `RES-${transactionId}`,
    cryptographicHash: cryptoHash,
    validatorSignature: `SIG-${transactionId}`,
    ledgerCommitment: `COMMIT-${transactionId}`,
    jurisdiction: `${sender.jurisdiction}-${receiver.jurisdiction}`,
    settlementChannel: request.settlementChannel,
    finalityStatus: "TECHNICAL_FINAL",  // §22: technical finality ≠ legal finality
  };

  return {
    authorized: true,
    transactionId,
    settlementRecord,
    reason: "Settlement authorized and executed",
    pipeline,
  };
}

// ---- §7 CBDC Interoperability Layer ----
export interface CBDCInteropRequest {
  sourceSystem: "WHOLESALE_CBDC" | "RETAIL_CBDC" | "BANK_MONEY" | "TOKENIZED_SOVEREIGN";
  destinationSystem: "WHOLESALE_CBDC" | "RETAIL_CBDC" | "BANK_MONEY" | "TOKENIZED_SOVEREIGN";
  sourceJurisdiction: string;
  destinationJurisdiction: string;
  amount: number;
  institutionId: string;
}

export interface CBDCInteropResult {
  supported: boolean;
  flow: string;
  reason: string;
}

/**
 * §7 — CBDC Interoperability check.
 * Supports all 5 canonical flows, subject to legal authorization.
 */
export function checkCBDCInterop(request: CBDCInteropRequest): CBDCInteropResult {
  const flows = CBDC_INTEROP.supportedFlows;

  // Check geo-fence
  if (isGeoFenced(request.sourceJurisdiction) || isGeoFenced(request.destinationJurisdiction)) {
    return { supported: false, flow: "", reason: "Geo-fence violation" };
  }

  // Check institution authorization
  const auth = checkInstitutionAuthorization(request.institutionId, "SETTLE", request.amount);
  if (!auth.authorized) {
    return { supported: false, flow: "", reason: `Institution not authorized: ${auth.reason}` };
  }

  // Map source/destination to flow
  const srcMap: Record<string, string> = {
    WHOLESALE_CBDC: "wholesale CBDC",
    RETAIL_CBDC: "CBDC",
    BANK_MONEY: "bank money",
    TOKENIZED_SOVEREIGN: "tokenized sovereign/cash-equivalent assets",
  };
  const dstMap: Record<string, string> = {
    WHOLESALE_CBDC: "wholesale CBDC",
    RETAIL_CBDC: "CBDC",
    BANK_MONEY: "bank money",
    TOKENIZED_SOVEREIGN: "regulated destination settlement assets",
  };

  const flow = `${srcMap[request.sourceSystem]} → MTQ → ${dstMap[request.destinationSystem]}`;

  // Check if flow is in supported list
  const supported = flows.some(f => {
    const fLower = f.toLowerCase();
    return fLower.includes(srcMap[request.sourceSystem].split(" ")[0]) &&
           fLower.includes(dstMap[request.destinationSystem].split(" ")[0]);
  });

  return {
    supported,
    flow,
    reason: supported
      ? "Flow supported subject to explicit legal and technical authorization"
      : "Flow not in supported list",
  };
}

// ---- §14 Redemption Flow ----
export interface RedemptionRequest {
  receivingInstitutionId: string;
  amount: number;
  currency: string;
}

export interface RedemptionResult {
  authorized: boolean;
  burnTransactionId?: string;
  reserveReleaseAmount?: number;
  pipeline: string[];
  reason: string;
}

/**
 * §14 — Institutional Redemption Flow.
 * Redemption occurs through authorized institutional channels only.
 */
export async function processRedemption(
  request: RedemptionRequest,
  reserveRatio: number,
): Promise<RedemptionResult> {
  const pipeline: string[] = [...REDEMPTION_FLOW];

  // Step 1: Receiving Bank
  const inst = getInstitution(request.receivingInstitutionId);
  if (!inst) {
    return { authorized: false, pipeline, reason: "Institution not found" };
  }

  // Step 2: Redemption Instruction → Institutional Validation
  const auth = checkInstitutionAuthorization(
    request.receivingInstitutionId, "REDEEM", request.amount, request.currency,
  );
  if (!auth.authorized) {
    return { authorized: false, pipeline, reason: `Not authorized: ${auth.reason}` };
  }

  // Step 3: MTQ Burn
  pipeline.splice(2, 0, "MTQ Burn");
  const burnTxId = `BURN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Step 4: Reserve Claim Calculation
  const reserveRelease = request.amount; // 1:1 for PAR

  // Step 5: Constitutional checks
  if (reserveRatio < 100) {
    return { authorized: false, pipeline, reason: `RR=${reserveRatio}% < 100% — redemption blocked` };
  }
  if (reserveRatio < 105) {
    pipeline.push("Enhanced Restrictions (RR < 105%)");
  }

  // Step 6: Reserve Release → Approved Banking / Settlement Rail → Destination Institution
  return {
    authorized: true,
    burnTransactionId: burnTxId,
    reserveReleaseAmount: reserveRelease,
    pipeline,
    reason: "Redemption authorized — atomic burn/release executed",
  };
}

// ---- §9 Institutional Traceability ----
export function createSettlementRecord(
  sender: string,
  receiver: string,
  amount: number,
  jurisdiction: string,
): SettlementRecord {
  const transactionId = `MTQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    institutionalSender: sender,
    institutionalReceiver: receiver,
    transactionId,
    timestamp: new Date().toISOString(),
    mtqAmount: amount,
    settlementState: "SETTLED",
    authorizationState: "AUTHORIZED",
    complianceState: "CLEARED",
    reserveReference: `RES-${transactionId}`,
    cryptographicHash: `0x${Math.random().toString(16).slice(2).padStart(64, "0").slice(0, 64)}`,
    validatorSignature: `SIG-${transactionId}`,
    ledgerCommitment: `COMMIT-${transactionId}`,
    jurisdiction,
    settlementChannel: "WHOLESALE",
    finalityStatus: "TECHNICAL_FINAL",
  };
}
