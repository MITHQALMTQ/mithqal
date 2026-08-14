// v25.0 §5+§23+§24 — Corporate MTQ Settlement Account
// =================================================================
// Bank-linked corporate settlement account. The corporation is the
// beneficial economic holder; the bank is the regulated access and
// security layer; MITHQAL controls the MTQ settlement protocol.
//
// §5 — Corporate MTQ Settlement Account concept
// §23 — Bank-controlled wallet architecture (hybrid: on-chain + subaccounts)
// §24 — Corporate UX (treasury dashboard, no blockchain knowledge needed)
// =================================================================

// ---- §5 Corporate MTQ Settlement Account ----
export interface CorporateSettlementAccount {
  accountId: string;
  corporateId: string;
  corporateName: string;
  bankInstitutionId: string;       // The regulated bank that controls this account
  jurisdiction: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED" | "PENDING";
  // Bank controls:
  authenticationMethod: "HSM_MPC" | "HSM" | "MPC";
  corporateSignatories: string[];   // authorized signatory IDs
  transactionPolicy: TransactionPolicy;
  cybersecurityLevel: "STANDARD" | "ENHANCED" | "MAXIMUM";
  fraudControls: boolean;
  accountRecovery: "ENABLED" | "DISABLED";
  segregationOfDuties: boolean;
  // MITHQAL controls (protocol-level):
  mtqBalance: number;
  settlementLimits: {
    maxSingleTransaction: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  createdAt: string;
  lastActivity: string;
}

export interface TransactionPolicy {
  requireDualApproval: boolean;      // segregation of duties
  maxWithoutApproval: number;        // auto-approve threshold
  approvalThreshold: number;         // requires signatory approval
  allowedCorridors: string[];
  allowedCurrencies: string[];
  blackoutPeriods?: string[];        // time-based restrictions
}

// ---- §23 Bank-Controlled Wallet Architecture (hybrid) ----
export interface BankInstitutionalWallet {
  walletId: string;
  bankInstitutionId: string;
  onChainAddress: string;             // single on-chain institutional wallet
  totalMtqBalance: number;
  subaccounts: CorporateSubaccount[];
  status: "ACTIVE" | "SUSPENDED" | "FROZEN";
  cryptographicAttestation?: BankAttestation;
}

export interface CorporateSubaccount {
  subaccountId: string;
  corporateId: string;
  corporateName: string;
  balance: number;
  // Bank-internal attribution (NOT exposed to MITHQAL by default)
  internalReference: string;
  kycStatus: "VALID" | "EXPIRED" | "PENDING";
  amlStatus: "CLEAR" | "FLAGGED" | "UNDER_REVIEW";
  sanctionsStatus: "CLEAR" | "FLAGGED" | "BLOCKED";
}

export interface BankAttestation {
  attestationId: string;
  bankInstitutionId: string;
  totalWalletBalance: number;
  sumOfSubaccounts: number;
  reconciliationMatch: boolean;
  signedAt: string;
  signatureHash: string;
  // ZK proof that bank holds sufficient backing without revealing individual balances
  zkProof?: string;
}

// ---- §24 Corporate Treasury Dashboard (UX concept) ----
export interface CorporateTreasuryDashboard {
  corporateId: string;
  accounts: {
    domesticAccounts: Array<{ currency: string; balance: number; bank: string }>;
    mtqSettlementAccount: { mtqBalance: number; bankInstitutionId: string };
  };
  actions: Array<
    "MAKE_INTERNATIONAL_PAYMENT" |
    "RECEIVE_SETTLEMENT" |
    "CONVERT_REDEEM" |
    "VIEW_SETTLEMENT" |
    "RECONCILE"
  >;
  recentSettlements: Array<{
    transactionId: string;
    counterparty: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
  }>;
}

// ---- §5 Helper: create corporate settlement account ----
export function createCorporateSettlementAccount(
  corporateId: string,
  corporateName: string,
  bankInstitutionId: string,
  jurisdiction: string,
): CorporateSettlementAccount {
  const accountId = `CSA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    accountId,
    corporateId,
    corporateName,
    bankInstitutionId,
    jurisdiction,
    status: "PENDING",  // requires bank activation
    authenticationMethod: "HSM_MPC",
    corporateSignatories: [],
    transactionPolicy: {
      requireDualApproval: true,
      maxWithoutApproval: 100_000,
      approvalThreshold: 1_000_000,
      allowedCorridors: [],
      allowedCurrencies: [],
    },
    cybersecurityLevel: "ENHANCED",
    fraudControls: true,
    accountRecovery: "ENABLED",
    segregationOfDuties: true,
    mtqBalance: 0,
    settlementLimits: {
      maxSingleTransaction: 10_000_000,
      dailyLimit: 50_000_000,
      monthlyLimit: 500_000_000,
    },
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
}

// ---- §23 Helper: create bank institutional wallet ----
export function createBankInstitutionalWallet(
  bankInstitutionId: string,
  onChainAddress: string,
): BankInstitutionalWallet {
  return {
    walletId: `WALLET-${bankInstitutionId}`,
    bankInstitutionId,
    onChainAddress,
    totalMtqBalance: 0,
    subaccounts: [],
    status: "ACTIVE",
  };
}

// ---- §23 Helper: add corporate subaccount to bank wallet ----
export function addCorporateSubaccount(
  wallet: BankInstitutionalWallet,
  corporateId: string,
  corporateName: string,
): CorporateSubaccount {
  const subaccount: CorporateSubaccount = {
    subaccountId: `SUB-${wallet.walletId}-${corporateId}`,
    corporateId,
    corporateName,
    balance: 0,
    internalReference: `BANK-INT-${corporateId}`,
    kycStatus: "VALID",
    amlStatus: "CLEAR",
    sanctionsStatus: "CLEAR",
  };
  wallet.subaccounts.push(subaccount);
  return subaccount;
}

// ---- §22 Three-way reconciliation ----
export interface ReconciliationResult {
  timestamp: string;
  canonicalLedgerBalance: number;     // A: MITHQAL canonical ledger
  bankSubledgerBalance: number;        // B: Bank institutional subledger
  bankAttestationBalance: number;     // C: Signed bank attestation
  threeWayMatch: boolean;
  discrepancies: string[];
  action: "RECONCILED" | "MISMATCH" | "ESCALATION_REQUIRED";
}

export function reconcileThreeWay(
  canonicalLedger: number,
  bankSubledger: number,
  bankAttestation: number,
): ReconciliationResult {
  const discrepancies: string[] = [];

  if (canonicalLedger !== bankSubledger) {
    discrepancies.push(`Canonical ledger ($${canonicalLedger}) ≠ Bank subledger ($${bankSubledger})`);
  }
  if (canonicalLedger !== bankAttestation) {
    discrepancies.push(`Canonical ledger ($${canonicalLedger}) ≠ Bank attestation ($${bankAttestation})`);
  }
  if (bankSubledger !== bankAttestation) {
    discrepancies.push(`Bank subledger ($${bankSubledger}) ≠ Bank attestation ($${bankAttestation})`);
  }

  const threeWayMatch = discrepancies.length === 0;

  return {
    timestamp: new Date().toISOString(),
    canonicalLedgerBalance: canonicalLedger,
    bankSubledgerBalance: bankSubledger,
    bankAttestationBalance: bankAttestation,
    threeWayMatch,
    discrepancies,
    action: threeWayMatch ? "RECONCILED" : discrepancies.length >= 2 ? "ESCALATION_REQUIRED" : "MISMATCH",
  };
}

// ---- §5 Division of control (critical principle) ----
export const DIVISION_OF_CONTROL = {
  bank: {
    controls: [
      "authentication",
      "key management (HSM/MPC)",
      "corporate signatories",
      "transaction policy",
      "cybersecurity",
      "fraud controls",
      "account recovery",
      "segregation of duties",
    ],
    principle: "Bank controls the access/security layer.",
  },
  mithqal: {
    controls: [
      "MTQ protocol",
      "issuance rules",
      "supply",
      "settlement state",
      "institutional permissions",
      "reserve/monetary integrity",
    ],
    principle: "MITHQAL controls the MTQ settlement protocol.",
  },
} as const;
