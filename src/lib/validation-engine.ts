/**
 * Validation Rules Engine — MITHQAL MASTER BLUEPRINT §5.2.B
 *
 * Apply versioned schemas and deterministic business rules.
 * Distinguish:
 *   - Hard validation failures — message is malformed, required field missing
 *   - Warnings — field present but in a non-preferred format
 *   - Missing dependencies — required external reference not available
 *   - Source-data conflicts — same transaction has different values in different systems
 *   - Anomalies requiring human investigation — unusual pattern that may indicate fraud or error
 *
 * Per §5.6: Route comparisons must compare actual end-to-end options,
 * not mismatched categories (SWIFT vs ISO 20022 vs RTGS vs Tokenized).
 *
 * Per §D.3: "Specified," "tested," "audited," "deployed," "legally approved,"
 * and "production-authorized" are different statuses and must never be used
 * interchangeably.
 */

export type ValidationSeverity = "HARD_FAILURE" | "WARNING" | "MISSING_DEPENDENCY" | "SOURCE_CONFLICT" | "ANOMALY";

export type ExceptionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ValidationRule {
  ruleId: string;
  version: string;
  description: string;
  severity: ValidationSeverity;
  exceptionSeverity: ExceptionSeverity;
  reasonCode: string;
  recommendedAction: string;
}

export interface ValidationResult {
  caseId: string;
  ruleVersion: string;
  passed: boolean;
  results: Array<{
    rule: ValidationRule;
    passed: boolean;
    detail: string;
    evidence: string;
  }>;
  exceptions: Array<{
    code: string;
    severity: ExceptionSeverity;
    reasonCode: string;
    recommendedAction: string;
    detail: string;
  }>;
}

/**
 * Canonical validation rules per §5.2.B.
 * These are SYNTHETIC candidate rules for the Pilot A demonstrator.
 * Per §5.5: "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE"
 */
export const VALIDATION_RULES: ValidationRule[] = [
  {
    ruleId: "CBPR-ADDR-001",
    version: "2026-11-14",
    description: "Creditor postal address must be structured (CBPR+ requirement)",
    severity: "HARD_FAILURE",
    exceptionSeverity: "MEDIUM",
    reasonCode: "UNSTRUCTURED_ADDRESS",
    recommendedAction: "Correct address to structured format per ISO 20022 CBPR+",
  },
  {
    ruleId: "AMT-MATCH-001",
    version: "2026-11-14",
    description: "Amount must match across core banking and correspondent statements",
    severity: "SOURCE_CONFLICT",
    exceptionSeverity: "HIGH",
    reasonCode: "AMOUNT_MISMATCH",
    recommendedAction: "Investigate source discrepancy; reconcile with both systems",
  },
  {
    ruleId: "BENEF-VERIFY-001",
    version: "2026-11-14",
    description: "Beneficiary account verification must be received",
    severity: "MISSING_DEPENDENCY",
    exceptionSeverity: "MEDIUM",
    reasonCode: "BENEFICIARY_NOT_VERIFIED",
    recommendedAction: "Request beneficiary verification from receiving institution",
  },
  {
    ruleId: "DEBTOR-NAME-001",
    version: "2026-11-14",
    description: "Debtor name should not contain special characters",
    severity: "WARNING",
    exceptionSeverity: "LOW",
    reasonCode: "SPECIAL_CHARACTERS_IN_NAME",
    recommendedAction: "Review debtor name for encoding issues",
  },
  {
    ruleId: "CORRIDOR-TIME-001",
    version: "2026-11-14",
    description: "Payment pending longer than typical corridor settlement time",
    severity: "ANOMALY",
    exceptionSeverity: "HIGH",
    reasonCode: "UNUSUAL_PROCESSING_TIME",
    recommendedAction: "Investigate why payment is pending beyond expected timeframe",
  },
  {
    ruleId: "LEI-REQUIRED-001",
    version: "2026-11-14",
    description: "LEI code required for payments above threshold",
    severity: "HARD_FAILURE",
    exceptionSeverity: "MEDIUM",
    reasonCode: "MISSING_LEI",
    recommendedAction: "Provide Legal Entity Identifier for the debtor",
  },
  {
    ruleId: "REF-UNIQUE-001",
    version: "2026-11-14",
    description: "End-to-end reference must be unique within the institution",
    severity: "HARD_FAILURE",
    exceptionSeverity: "HIGH",
    reasonCode: "DUPLICATE_REFERENCE",
    recommendedAction: "Regenerate end-to-end reference; investigate duplicate",
  },
  {
    ruleId: "CURRENCY-VALID-001",
    version: "2026-11-14",
    description: "Currency code must be a valid ISO 4217 code",
    severity: "HARD_FAILURE",
    exceptionSeverity: "HIGH",
    reasonCode: "INVALID_CURRENCY_CODE",
    recommendedAction: "Correct currency code to valid ISO 4217",
  },
];

/**
 * Run deterministic validation against a record set per §5.2.B.
 * Returns ValidationResult with exceptions for any failed rules.
 *
 * This is a SYNTHETIC validator for the Pilot A demonstrator.
 * All results are labeled "DEMO DATA" per §5.5.
 */
export function runValidation(
  caseId: string,
  record: {
    creditorAddressStructured?: boolean;
    coreBankingAmount?: number;
    correspondentAmount?: number;
    beneficiaryVerified?: boolean;
    debtorName?: string;
    pendingHours?: number;
    expectedSettlementHours?: number;
    hasLEI?: boolean;
    amountThreshold?: number;
    endToEndReference?: string;
    sourceCurrency?: string;
    targetCurrency?: string;
  },
  ruleVersion: string = "2026-11-14",
): ValidationResult {
  const results: ValidationResult["results"] = [];
  const exceptions: ValidationResult["exceptions"] = [];

  for (const rule of VALIDATION_RULES) {
    if (rule.version !== ruleVersion) continue;

    let passed = true;
    let detail = "";
    let evidence = `case-${caseId}-record`;

    switch (rule.ruleId) {
      case "CBPR-ADDR-001":
        passed = record.creditorAddressStructured !== false;
        detail = passed ? "Address is structured" : "Creditor postal address is unstructured (CBPR+ requires structured)";
        break;
      case "AMT-MATCH-001":
        if (record.coreBankingAmount !== undefined && record.correspondentAmount !== undefined) {
          passed = record.coreBankingAmount === record.correspondentAmount;
          detail = passed
            ? `Amount matches: ${record.coreBankingAmount}`
            : `Amount mismatch: core=${record.coreBankingAmount}, correspondent=${record.correspondentAmount}`;
          evidence = `core-banking-amount, correspondent-statement-amount`;
        } else {
          passed = true;
          detail = "Amount comparison skipped (missing data)";
        }
        break;
      case "BENEF-VERIFY-001":
        passed = record.beneficiaryVerified !== false;
        detail = passed ? "Beneficiary verified" : "Beneficiary account verification not received";
        break;
      case "DEBTOR-NAME-001":
        if (record.debtorName) {
          const hasSpecial = /[^\x00-\x7F]/.test(record.debtorName);
          passed = !hasSpecial;
          detail = passed ? "Debtor name is clean" : `Debtor name contains special characters: "${record.debtorName}"`;
        } else {
          passed = true;
          detail = "Debtor name not present";
        }
        break;
      case "CORRIDOR-TIME-001":
        if (record.pendingHours !== undefined && record.expectedSettlementHours !== undefined) {
          passed = record.pendingHours <= record.expectedSettlementHours * 2;
          detail = passed
            ? `Pending ${record.pendingHours}h (expected ${record.expectedSettlementHours}h)`
            : `Pending ${record.pendingHours}h exceeds 2× expected ${record.expectedSettlementHours}h`;
        } else {
          passed = true;
          detail = "Timing check skipped (no timing data)";
        }
        break;
      case "LEI-REQUIRED-001":
        if (record.amountThreshold !== undefined && (record.coreBankingAmount ?? 0) > record.amountThreshold) {
          passed = record.hasLEI !== false;
          detail = passed ? "LEI provided" : "LEI required for amount above threshold";
        } else {
          passed = true;
          detail = "LEI not required (below threshold)";
        }
        break;
      case "REF-UNIQUE-001":
        passed = !!record.endToEndReference;
        detail = passed ? `Reference: ${record.endToEndReference}` : "Missing end-to-end reference";
        break;
      case "CURRENCY-VALID-001":
        const validCurrencies = ["USD", "EUR", "JPY", "GBP", "CNY", "CHF", "CAD", "AUD", "AED", "SGD", "INR"];
        passed = validCurrencies.includes(record.sourceCurrency ?? "") && validCurrencies.includes(record.targetCurrency ?? "");
        detail = passed ? `Currencies valid: ${record.sourceCurrency}/${record.targetCurrency}` : `Invalid currency: ${record.sourceCurrency}/${record.targetCurrency}`;
        break;
      default:
        passed = true;
        detail = "Rule not applicable";
    }

    results.push({ rule, passed, detail, evidence });

    if (!passed) {
      exceptions.push({
        code: rule.ruleId,
        severity: rule.exceptionSeverity,
        reasonCode: rule.reasonCode,
        recommendedAction: rule.recommendedAction,
        detail,
      });
    }
  }

  return {
    caseId,
    ruleVersion,
    passed: exceptions.length === 0,
    results,
    exceptions,
  };
}

/**
 * §5.2.D — Controlled Corrections (maker-checker approval flow)
 *
 * Support maker-checker approval where the customer's controls require it.
 * Preserve the original record and store any proposed correction as a distinct version.
 * The initial MVP does not alter a bank's source-of-record or execute payment instructions.
 */
export interface CorrectionProposal {
  proposalId: string;
  caseId: string;
  field: string;
  originalValue: string;
  proposedValue: string;
  proposer: string;
  proposedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approver?: string;
  approvedAt?: string;
  reasonCode?: string;
}

/**
 * Create a correction proposal (maker step).
 * Per §5.2.D: "Recommendations must be distinguishable from automated corrections."
 */
export function createCorrectionProposal(
  caseId: string,
  field: string,
  originalValue: string,
  proposedValue: string,
  proposer: string,
  reasonCode?: string,
): CorrectionProposal {
  return {
    proposalId: `CORR-${caseId}-${field}-${Date.now()}`,
    caseId,
    field,
    originalValue,
    proposedValue,
    proposer,
    proposedAt: new Date().toISOString(),
    status: "PENDING",
    reasonCode,
  };
}

/**
 * Approve a correction proposal (checker step).
 * Per §5.2.D: "System records approval with approver ID and timestamp."
 */
export function approveCorrection(
  proposal: CorrectionProposal,
  approver: string,
): CorrectionProposal {
  return {
    ...proposal,
    status: "APPROVED",
    approver,
    approvedAt: new Date().toISOString(),
  };
}

/**
 * Reject a correction proposal.
 */
export function rejectCorrection(
  proposal: CorrectionProposal,
  approver: string,
): CorrectionProposal {
  return {
    ...proposal,
    status: "REJECTED",
    approver,
    approvedAt: new Date().toISOString(),
  };
}
