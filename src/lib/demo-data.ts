export const DEMO_LABEL = "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE — STRESS TEST SIMULATION";
export const DEMO_INSTITUTIONS = [
  { id: "INST-DEMO-001", name: "Meridian Trust Bank (DEMO)", jurisdiction: "AE", type: "BANK" },
  { id: "INST-DEMO-002", name: "Atlas Payment Services (DEMO)", jurisdiction: "SG", type: "PSP" },
  { id: "INST-DEMO-003", name: "Northern Cross Treasury (DEMO)", jurisdiction: "CH", type: "CORPORATE" },
  { id: "INST-DEMO-004", name: "Helios Financial Solutions (DEMO)", jurisdiction: "AE", type: "FI_SERVICE" },
];
export const SCENARIO_TYPES = [
  { id: "S1", name: "Normal Flow", description: "Submit → Validate → Pass → Settle → Close", status: "CLOSED" },
  { id: "S2", name: "Amount Mismatch", description: "Submit → Validate → Exception → Investigate → Resolve", status: "RESOLVED" },
  { id: "S3", name: "Unstructured Address", description: "Submit → Validate → Exception → Correct → Resubmit", status: "RESOLVED" },
  { id: "S4", name: "Missing LEI", description: "Submit → Validate → Exception → Provide LEI → Resolve", status: "RESOLVED" },
  { id: "S5", name: "Unusual Processing Time", description: "Submit → Validate → Exception → Escalate → Investigate", status: "EXCEPTION_OPENED" },
  { id: "S6", name: "Safe Halt", description: "Submit → Safe Halt → Stop → Root Cause → Recover → Resume", status: "SAFE_HALTED" },
  { id: "S7", name: "Evidence Conflict", description: "Submit → Conflict → Investigation → Dispute", status: "EXCEPTION_OPENED" },
  { id: "S8", name: "Replay", description: "Historical case replayed with time-correct rules → Reproducible", status: "REPLAYED" },
  { id: "S9", name: "Reconciliation", description: "Cross-source mismatch → Reconcile → Match", status: "RESOLVED" },
  { id: "S10", name: "High Volume Batch", description: "50+ cases → Batch validated → 5 exceptions → 45 passed", status: "VALIDATED" },
];
export const DEMO_CASES = Array.from({ length: 20 }, (_, i) => {
  const c = ["AED→INR","SGD→USD","AED→PKR","SGD→JPY","CHF→GBP","USD→EUR","AED→EGP","GBP→USD"];
  const s = ["CLOSED","VALIDATED","EXCEPTION_OPENED","RESOLVED","RECEIVED","SAFE_HALTED","REPLAYED"];
  const a = [430000,540000,780000,950000,1850000,2100000,3200000,5600000,8900000,12000000];
  return { id: `VC-DEMO-${2001+i}`, institution: DEMO_INSTITUTIONS[i%4].name, corridor: c[i%8], amount: `$${a[i%10].toLocaleString()}`, status: s[i%7], date: "2027-03-15", scenario: SCENARIO_TYPES[i%10] };
});
export const DEMO_EVENTS = Array.from({ length: 30 }, (_, i) => {
  const t = ["RECORD_RECEIVED","SOURCE_AUTHENTICATED","VALIDATION_PASSED","EXCEPTION_OPENED","HUMAN_APPROVAL_RECORDED","PROVIDER_ACKNOWLEDGEMENT_RECEIVED","SETTLEMENT_CONFIRMATION_RECEIVED","RECONCILIATION_COMPLETED","EVIDENCE_CONFLICT_DETECTED","DISPUTE_OPENED"];
  const o = ["Sarah Chen (DEMO)","James Okafor (DEMO)","Maria Santos (DEMO)","David Kim (DEMO)","Aisha Rahman (DEMO)"];
  return { id: `EE-${String(i+1).padStart(4,"0")}`, caseId: `VC-DEMO-${2001+Math.floor(i/5)}`, type: t[i%10], source: o[i%5], time: `${9+Math.floor(i/5)}:${String((i*7)%60).padStart(2,"0")}:00`, sig: i%3===0?"VERIFIED":"UNVERIFIED" };
});
export const DEMO_EXCEPTIONS = Array.from({ length: 10 }, (_, i) => {
  const c = ["AMT-MATCH-001","CBPR-ADDR-001","BENEF-VERIFY-001","CORRIDOR-TIME-001","LEI-REQUIRED-001","DUPLICATE-REF-001","CURRENCY-VALID-001","DEBTOR-NAME-001","SANCTIONS-SCREEN-001","COMPLIANCE-HOLD-001"];
  const sv = ["LOW","MEDIUM","HIGH","CRITICAL"]; const st = ["OPEN","IN_PROGRESS","ESCALATED","RESOLVED","CLOSED"];
  const o = ["Sarah Chen (DEMO)","James Okafor (DEMO)","Maria Santos (DEMO)","David Kim (DEMO)","Aisha Rahman (DEMO)"];
  const act = ["Investigate $2 discrepancy","Correct address to structured format","Request beneficiary verification","Pending 8h exceeds 4h expected","Provide Legal Entity Identifier","Regenerate end-to-end reference","Correct currency code","Review debtor name encoding","Sanctions screening ambiguous match","Compliance hold — legal review required"];
  return { id: `EXC-${String(i+1).padStart(3,"0")}`, caseId: `VC-DEMO-${2001+i}`, code: c[i], severity: sv[i%4], owner: o[i%5], status: st[i%5], reason: c[i], action: act[i] };
});
export const STRESS_METRICS = { totalCases: 20, totalValue: "$48,850,000", exceptionRate: "50%", avgResolutionTime: "14 min", p95ResolutionTime: "32 min", scenariosCovered: 10, openExceptions: 4, evidenceEvents: 30, institutions: 6, corridors: 8 };
export const STRESS_RESULTS = { testName: "Full Platform Stress Test — All Scenarios", duration: "45 seconds", casesProcessed: 20, casesPassed: 10, casesWithExceptions: 10, exceptionsOpened: 10, exceptionsResolved: 3, safeHaltsTriggered: 1, replaysExecuted: 2, reconciliationCases: 5, evidenceEventsGenerated: 30, idempotencyKeysChecked: 20, duplicatePrevention: "100%", result: "PASS — all 10 scenarios executed successfully" };
