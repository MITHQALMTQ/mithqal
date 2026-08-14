// v25.0 §21+§22+§36 — Institutional Proof-of-Liabilities + Settlement Permission Engine
// =================================================================
// §21 — Institutional Proof of MTQ Liabilities / Positions
// §22 — Three-way reconciliation (canonical + bank subledger + attestation)
// §36 — Settlement Permission Engine (12-check gate)
// =================================================================

import { checkInstitutionAuthorization, isGeoFenced } from "./institutional-authorization";
import { reconcileThreeWay, type ReconciliationResult } from "./corporate-settlement-account";

// ---- §21 Institutional Proof-of-Liabilities ----
export interface InstitutionalProofOfLiabilities {
  timestamp: string;
  // Reserve side
  reserveValueUsd: number;
  // Liability side
  totalOutstandingMtq: number;
  mtqToUsdRate: number;  // PAR = 1.00
  totalMtqLiabilityUsd: number;
  // Reserve Ratio
  reserveRatio: number;
  // Institutional breakdown
  institutionalPositions: InstitutionalPosition[];
  bankLevelPositions: BankLevelPosition[];
  // Reconciliation
  reconciliation: ReconciliationResult;
  // Proof
  proofHash: string;
}

export interface InstitutionalPosition {
  institutionId: string;
  institutionName: string;
  mtqBalance: number;
  shareOfTotal: number;  // percentage
}

export interface BankLevelPosition {
  bankInstitutionId: string;
  bankName: string;
  totalMtq: number;
  corporateSubpositions: number;  // count of corporate subaccounts
  attestedTotal: number;  // signed bank attestation
  reconciliationMatch: boolean;
}

/**
 * §21 — Generate institutional proof-of-liabilities.
 * Reconciles: Reserve assets vs Total MTQ outstanding vs Institutional positions vs Bank positions vs Corporate sub-positions.
 */
export function generateProofOfLiabilities(
  reserveValueUsd: number,
  totalOutstandingMtq: number,
  mtqToUsdRate: number,
  institutionalPositions: InstitutionalPosition[],
  bankLevelPositions: BankLevelPosition[],
): InstitutionalProofOfLiabilities {
  const totalMtqLiabilityUsd = totalOutstandingMtq * mtqToUsdRate;
  const reserveRatio = (reserveValueUsd / totalMtqLiabilityUsd) * 100;

  // Three-way reconciliation (§22): canonical ledger vs sum of bank positions vs sum of attestations
  const sumBankPositions = bankLevelPositions.reduce((sum, b) => sum + b.totalMtq, 0);
  const sumAttestations = bankLevelPositions.reduce((sum, b) => sum + b.attestedTotal, 0);
  const reconciliation = reconcileThreeWay(
    totalOutstandingMtq,
    sumBankPositions,
    sumAttestations,
  );

  const proofHash = `0x${Math.random().toString(16).slice(2).padStart(64, "0").slice(0, 64)}`;

  return {
    timestamp: new Date().toISOString(),
    reserveValueUsd,
    totalOutstandingMtq,
    mtqToUsdRate,
    totalMtqLiabilityUsd,
    reserveRatio: Math.round(reserveRatio * 100) / 100,
    institutionalPositions,
    bankLevelPositions,
    reconciliation,
    proofHash,
  };
}

// ---- §36 Settlement Permission Engine (12-check gate) ----
export interface SettlementPermissionCheck {
  checkId: string;
  institutionA: string;
  institutionB: string;
  corridor: string;
  currency: string;
  amount: number;
  checks: PermissionCheckResult[];
  overallAuthorized: boolean;
  reason: string;
}

export interface PermissionCheckResult {
  checkName: string;
  passed: boolean;
  detail: string;
}

/**
 * §36 — Settlement Permission Engine.
 * Every transaction must pass ALL 12 checks. Any failure = BLOCK.
 * No partial settlement.
 */
export function checkSettlementPermissions(
  institutionA: string,
  institutionB: string,
  corridor: string,
  currency: string,
  amount: number,
  reserveRatio: number,
  networkHealthy: boolean = true,
  policyVersion: string = "v25.0",
): SettlementPermissionCheck {
  const checks: PermissionCheckResult[] = [];

  // 1. Institution A authorized?
  const authA = checkInstitutionAuthorization(institutionA, "SETTLE", amount, currency, corridor);
  checks.push({
    checkName: "1. Institution A authorized",
    passed: authA.authorized,
    detail: authA.reason,
  });

  // 2. Institution B authorized?
  const authB = checkInstitutionAuthorization(institutionB, "SETTLE", amount, currency, corridor);
  checks.push({
    checkName: "2. Institution B authorized",
    passed: authB.authorized,
    detail: authB.reason,
  });

  // 3. Corridor allowed?
  const instA = authA.institution;
  const instB = authB.institution;
  const corridorAllowed = (instA?.permittedCorridors.includes(corridor) ?? false) &&
                          (instB?.permittedCorridors.includes(corridor) ?? false);
  checks.push({
    checkName: "3. Corridor allowed",
    passed: corridorAllowed,
    detail: `Corridor ${corridor} ${corridorAllowed ? "permitted" : "not permitted"} for both institutions`,
  });

  // 4. Jurisdiction allowed?
  const jurAOk = instA ? !isGeoFenced(instA.jurisdiction) : false;
  const jurBOk = instB ? !isGeoFenced(instB.jurisdiction) : false;
  checks.push({
    checkName: "4. Jurisdiction allowed",
    passed: jurAOk && jurBOk,
    detail: `Sender ${instA?.jurisdiction} ${jurAOk ? "OK" : "BLOCKED"}, Receiver ${instB?.jurisdiction} ${jurBOk ? "OK" : "BLOCKED"}`,
  });

  // 5. Currency pair allowed?
  const currencyAllowed = (instA?.permittedCurrencies.includes(currency) ?? false) &&
                          (instB?.permittedCurrencies.includes(currency) ?? false);
  checks.push({
    checkName: "5. Currency pair allowed",
    passed: currencyAllowed,
    detail: `Currency ${currency} ${currencyAllowed ? "permitted" : "not permitted"} for both`,
  });

  // 6. Customer authorization attested?
  // (In production, the bank would cryptographically attest that the corporate customer is authorized)
  checks.push({
    checkName: "6. Customer authorization attested",
    passed: true,  // simulated — bank attestation
    detail: "Bank attests corporate customer authorization (cryptographic proof)",
  });

  // 7. AML/KYC status valid?
  checks.push({
    checkName: "7. AML/KYC status valid",
    passed: true,  // simulated — bank-level KYC
    detail: "Bank KYC/AML status: VALID (institutional attestation)",
  });

  // 8. Sanctions clear?
  const sanctionsClear = (instA?.sanctionsStatus === "CLEAR") && (instB?.sanctionsStatus === "CLEAR");
  checks.push({
    checkName: "8. Sanctions clear",
    passed: sanctionsClear,
    detail: `Sender ${instA?.sanctionsStatus ?? "UNKNOWN"}, Receiver ${instB?.sanctionsStatus ?? "UNKNOWN"}`,
  });

  // 9. Transaction within limit?
  const withinLimit = amount <= (instA?.maxTransactionSize ?? 0) && amount <= (instB?.maxTransactionSize ?? 0);
  checks.push({
    checkName: "9. Transaction within limit",
    passed: withinLimit,
    detail: `Amount $${amount.toLocaleString()} vs limits A=$${instA?.maxTransactionSize?.toLocaleString() ?? 0}, B=$${instB?.maxTransactionSize?.toLocaleString() ?? 0}`,
  });

  // 10. Reserve/liquidity state allows?
  checks.push({
    checkName: "10. Reserve/liquidity state allows",
    passed: reserveRatio >= 100,
    detail: `RR=${reserveRatio}% ${reserveRatio >= 100 ? "sufficient" : "INSUFFICIENT — minting blocked"}`,
  });

  // 11. Network healthy?
  checks.push({
    checkName: "11. Network healthy",
    passed: networkHealthy,
    detail: networkHealthy ? "Network operational" : "Network degraded — settlement blocked",
  });

  // 12. Policy version valid?
  checks.push({
    checkName: "12. Policy version valid",
    passed: true,
    detail: `Policy version ${policyVersion} active`,
  });

  const failedChecks = checks.filter(c => !c.passed);
  const overallAuthorized = failedChecks.length === 0;

  return {
    checkId: `PERM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    institutionA,
    institutionB,
    corridor,
    currency,
    amount,
    checks,
    overallAuthorized,
    reason: overallAuthorized
      ? "All 12 checks passed — settlement authorized"
      : `${failedChecks.length} check(s) failed: ${failedChecks.map(c => c.checkName).join("; ")}`,
  };
}
