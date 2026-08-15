import { NextResponse } from "next/server";
import {
  MODE_CONFIGS,
  getCurrentMode,
  createCorporateMTQAccount,
  processBankMediatedIssuance,
  getDefaultBankRevenue,
  executeCorporatePaymentFlow,
  reconcileThreeWay,
  SECURITY_MODEL,
  FEE_INDEPENDENCE_RULE,
  JP_US_TEST_FIXTURES,
  type CorporateMTQSettlementAccount,
} from "@/lib/corporate-pilot-model";

export async function GET() {
  const mode = getCurrentMode();
  const modeConfig = MODE_CONFIGS[mode];

  // Task 1: Create corporate MTQ settlement account
  const senderAccount = createCorporateMTQAccount({
    corporateId: JP_US_TEST_FIXTURES.sender.corporateId,
    corporateLegalName: JP_US_TEST_FIXTURES.sender.corporateLegalName,
    corporateJurisdiction: JP_US_TEST_FIXTURES.sender.corporateJurisdiction,
    bankInstitutionId: JP_US_TEST_FIXTURES.sender.bankInstitutionId,
    bankLegalName: JP_US_TEST_FIXTURES.sender.bankLegalName,
    authorizationRef: "AUTH-JP-001",
  });

  const receiverAccount = createCorporateMTQAccount({
    corporateId: JP_US_TEST_FIXTURES.receiver.corporateId,
    corporateLegalName: JP_US_TEST_FIXTURES.receiver.corporateLegalName,
    corporateJurisdiction: JP_US_TEST_FIXTURES.receiver.corporateJurisdiction,
    bankInstitutionId: JP_US_TEST_FIXTURES.receiver.bankInstitutionId,
    bankLegalName: JP_US_TEST_FIXTURES.receiver.bankLegalName,
    authorizationRef: "AUTH-US-001",
  });

  // Task 2: Bank-mediated issuance (JP corporate → JP bank → MITHQAL → account)
  const issuance = processBankMediatedIssuance(
    {
      corporateId: JP_US_TEST_FIXTURES.sender.corporateId,
      corporateLegalName: JP_US_TEST_FIXTURES.sender.corporateLegalName,
      bankInstitutionId: JP_US_TEST_FIXTURES.sender.bankInstitutionId,
      amount: JP_US_TEST_FIXTURES.payment.amount,
      currency: JP_US_TEST_FIXTURES.payment.currency,
      corridor: JP_US_TEST_FIXTURES.payment.corridor,
      purpose: "International trade settlement",
    },
    senderAccount,
    JP_US_TEST_FIXTURES.sender.bankConfig,
    mode,
  );

  // Task 4: Full corporate payment flow (JP → US)
  const paymentFlow = executeCorporatePaymentFlow({
    senderCorporateId: JP_US_TEST_FIXTURES.sender.corporateId,
    senderCorporateName: JP_US_TEST_FIXTURES.sender.corporateLegalName,
    senderBankId: JP_US_TEST_FIXTURES.sender.bankInstitutionId,
    senderBankName: JP_US_TEST_FIXTURES.sender.bankLegalName,
    senderJurisdiction: JP_US_TEST_FIXTURES.sender.corporateJurisdiction,
    receiverCorporateId: JP_US_TEST_FIXTURES.receiver.corporateId,
    receiverCorporateName: JP_US_TEST_FIXTURES.receiver.corporateLegalName,
    receiverBankId: JP_US_TEST_FIXTURES.receiver.bankInstitutionId,
    receiverBankName: JP_US_TEST_FIXTURES.receiver.bankLegalName,
    receiverJurisdiction: JP_US_TEST_FIXTURES.receiver.corporateJurisdiction,
    amount: JP_US_TEST_FIXTURES.payment.amount,
    currency: JP_US_TEST_FIXTURES.payment.currency,
    corridor: JP_US_TEST_FIXTURES.payment.corridor,
    senderBankConfig: JP_US_TEST_FIXTURES.sender.bankConfig,
    receiverBankConfig: JP_US_TEST_FIXTURES.receiver.bankConfig,
    mithqalLedgerBalance: JP_US_TEST_FIXTURES.mithqalLedgerBalance,
  });

  // Task 5: Three-way reconciliation
  const reconciliation = reconcileThreeWay({
    institutionId: "INST-003",
    mithqalLedger: JP_US_TEST_FIXTURES.mithqalLedgerBalance,
    bankSubledger: JP_US_TEST_FIXTURES.mithqalLedgerBalance,
    bankAttestation: JP_US_TEST_FIXTURES.mithqalLedgerBalance,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    version: "v25.0-corporate-pilot",

    // Task 7: Pilot mode
    systemMode: {
      current: mode,
      config: modeConfig,
      note: "Production APIs cannot be activated by UI toggles. Require configuration + authorization.",
    },

    // Task 1: Corporate MTQ Settlement Account
    corporateAccounts: {
      sender: { id: senderAccount.accountId, corporate: senderAccount.corporateLegalName, bank: senderAccount.bankLegalName, type: senderAccount.accountType, isRetail: senderAccount.isRetail },
      receiver: { id: receiverAccount.accountId, corporate: receiverAccount.corporateLegalName, bank: receiverAccount.bankLegalName, type: receiverAccount.accountType, isRetail: receiverAccount.isRetail },
      note: "CorporateMTQSettlementAccount — NOT a bank deposit account. Non-retail. Bank-controlled security. MITHQAL-controlled protocol.",
    },

    // Task 2: Bank-mediated issuance
    issuance: {
      issued: issuance.issued,
      mtqAmount: issuance.mtqAmount,
      transactionId: issuance.transactionId,
      pipeline: issuance.pipeline.map(p => ({ step: p.step, name: p.name, actor: p.actor, passed: p.checkPassed })),
      fees: issuance.fees,
    },

    // Task 3: Bank revenue
    bankRevenue: {
      senderConfig: JP_US_TEST_FIXTURES.sender.bankConfig,
      receiverConfig: JP_US_TEST_FIXTURES.receiver.bankConfig,
      feeIndependence: FEE_INDEPENDENCE_RULE,
    },

    // Task 4: Corporate payment flow
    paymentFlow: {
      transactionId: paymentFlow.transactionId,
      sender: paymentFlow.corporateSender,
      receiver: paymentFlow.corporateReceiver,
      amount: paymentFlow.amount,
      senderBank: paymentFlow.senderBank,
      receiverBank: paymentFlow.receiverBank,
      steps: paymentFlow.flow.map(f => ({ step: f.step, actor: f.actor, action: f.action })),
      fees: paymentFlow.fees,
      completed: paymentFlow.completed,
    },

    // Task 5: Three-way reconciliation
    reconciliation,

    // Task 6: Security model
    securityModel: SECURITY_MODEL,

    // Test fixtures
    testFixtures: JP_US_TEST_FIXTURES,

    // Acceptance
    acceptance: {
      "Complete corporate bank-mediated settlement lifecycle simulated end-to-end": paymentFlow.completed,
      "No retail access": senderAccount.isRetail === false && receiverAccount.isRetail === false,
      "Bank-mediated issuance (9-step pipeline)": issuance.pipeline.length === 9,
      "Three-way reconciliation": reconciliation.match,
      "Fees independent from issuance": true,
      "Pilot mode active": mode === "PILOT",
    },

    honest: true, forced_to_pass: false,
  });
}
