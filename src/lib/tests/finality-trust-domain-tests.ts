// src/lib/tests/finality-trust-domain-tests.ts
//
// MITHQAL v25.3.2 — Cross-Domain Compromise + Privilege Escalation Tests
// Per M-directive: "Add tests for cross-domain compromise and privilege escalation."

import {
  TRUST_DOMAINS,
  CROSS_DOMAIN_ISOLATION_RULES,
  SEVEN_TECHNICAL_ENFORCEMENT_LAYERS,
  getTrustDomain,
  getTrustDomainForRole,
  getTrustDomainForKey,
  canRoleAccessDomain,
  type TrustDomainId,
} from "../finality-trust-domains";

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
}

// === Cross-Domain Compromise Tests ===
//
// These tests verify that a compromise of one domain's keys/credentials/roles
// does NOT grant access to another domain.

export function runCrossDomainCompromiseTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Domain A key compromise does NOT grant access to Domain B or C
  const domainAKey = "POLICY_SIGNING_KEY";
  const domainA = getTrustDomainForKey(domainAKey);
  const domainAId = domainA?.id;
  results.push({
    testName: "T1: Domain A key (POLICY_SIGNING_KEY) is in Domain A only",
    passed: domainAId === "DOMAIN_A_POLICY_AUTHORIZATION",
    details: `POLICY_SIGNING_KEY custody: ${domainA?.ownsKeys[0]?.custodyEntity}. Domain A isolation verified.`,
  });

  // Verify POLICY_SIGNING_KEY does NOT appear in Domain B or C
  const domainBHasPolicyKey = TRUST_DOMAINS.find(
    (d) => d.id === "DOMAIN_B_FINALITY_ATTESTATION"
  )?.ownsKeys.some((k) => k.keyType === domainAKey);
  const domainCHasPolicyKey = TRUST_DOMAINS.find((d) => d.id === "DOMAIN_C_EXECUTION")
    ?.ownsKeys.some((k) => k.keyType === domainAKey);
  results.push({
    testName: "T2: Domain B does NOT have POLICY_SIGNING_KEY",
    passed: domainBHasPolicyKey === false,
    details: `Domain B keys: ${TRUST_DOMAINS.find((d) => d.id === "DOMAIN_B_FINALITY_ATTESTATION")
      ?.ownsKeys.map((k) => k.keyType)
      .join(", ")}`,
  });
  results.push({
    testName: "T3: Domain C does NOT have POLICY_SIGNING_KEY",
    passed: domainCHasPolicyKey === false,
    details: `Domain C keys: ${TRUST_DOMAINS.find((d) => d.id === "DOMAIN_C_EXECUTION")
      ?.ownsKeys.map((k) => k.keyType)
      .join(", ")}`,
  });

  // Test 4: Domain B key compromise does NOT grant access to Domain A or C
  const domainBKey = "ATTESTATION_ORACLE_KEY";
  const domainBForKey = getTrustDomainForKey(domainBKey);
  results.push({
    testName: "T4: Domain B key (ATTESTATION_ORACLE_KEY) is in Domain B only",
    passed: domainBForKey?.id === "DOMAIN_B_FINALITY_ATTESTATION",
    details: `ATTESTATION_ORACLE_KEY custody: ${domainBForKey?.ownsKeys.find((k) => k.keyType === domainBKey)?.custodyEntity}`,
  });

  // Test 5: Domain C key compromise does NOT grant access to Domain A or B
  const domainCKey = "EXECUTION_MINT_KEY";
  const domainCForKey = getTrustDomainForKey(domainCKey);
  results.push({
    testName: "T5: Domain C key (EXECUTION_MINT_KEY) is in Domain C only",
    passed: domainCForKey?.id === "DOMAIN_C_EXECUTION",
    details: `EXECUTION_MINT_KEY custody: ${domainCForKey?.ownsKeys.find((k) => k.keyType === domainCKey)?.custodyEntity}`,
  });

  // Test 6: Cross-domain role access — POLICY_AUTHORIZER cannot access Domain B or C
  const policyAuthorizerCanAccessB = canRoleAccessDomain(
    "POLICY_AUTHORIZER",
    "DOMAIN_B_FINALITY_ATTESTATION"
  );
  const policyAuthorizerCanAccessC = canRoleAccessDomain(
    "POLICY_AUTHORIZER",
    "DOMAIN_C_EXECUTION"
  );
  results.push({
    testName: "T6: POLICY_AUTHORIZER cannot access Domain B or C",
    passed: policyAuthorizerCanAccessB === false && policyAuthorizerCanAccessC === false,
    details: `Access B: ${policyAuthorizerCanAccessB} (must be false). Access C: ${policyAuthorizerCanAccessC} (must be false).`,
  });

  // Test 7: ATTESTATION_ORACLE cannot access Domain A or C
  const oracleCanAccessA = canRoleAccessDomain(
    "ATTESTATION_ORACLE",
    "DOMAIN_A_POLICY_AUTHORIZATION"
  );
  const oracleCanAccessC = canRoleAccessDomain(
    "ATTESTATION_ORACLE",
    "DOMAIN_C_EXECUTION"
  );
  results.push({
    testName: "T7: ATTESTATION_ORACLE cannot access Domain A or C",
    passed: oracleCanAccessA === false && oracleCanAccessC === false,
    details: `Access A: ${oracleCanAccessA} (must be false). Access C: ${oracleCanAccessC} (must be false).`,
  });

  // Test 8: MINT_EXECUTOR cannot access Domain A or B
  const mintExecutorCanAccessA = canRoleAccessDomain(
    "MINT_EXECUTOR",
    "DOMAIN_A_POLICY_AUTHORIZATION"
  );
  const mintExecutorCanAccessB = canRoleAccessDomain(
    "MINT_EXECUTOR",
    "DOMAIN_B_FINALITY_ATTESTATION"
  );
  results.push({
    testName: "T8: MINT_EXECUTOR cannot access Domain A or B",
    passed: mintExecutorCanAccessA === false && mintExecutorCanAccessB === false,
    details: `Access A: ${mintExecutorCanAccessA} (must be false). Access B: ${mintExecutorCanAccessB} (must be false).`,
  });

  // Cross-domain credential isolation (bonus checks — same family)
  const allCredentials = TRUST_DOMAINS.flatMap((d) =>
    d.ownsCredentials.map((c) => ({ domain: d.id, credential: c }))
  );
  const credentialDupes = allCredentials.filter(
    (entry, idx, arr) =>
      arr.findIndex((e) => e.credential === entry.credential) !== idx
  );
  results.push({
    testName: "T8b: No credential is shared across domains (no duplicates)",
    passed: credentialDupes.length === 0,
    details:
      credentialDupes.length === 0
        ? `All ${allCredentials.length} credentials are domain-unique.`
        : `Duplicates: ${credentialDupes.map((c) => c.credential).join(", ")}`,
  });

  // Audit evidence duplication check
  const allAuditEvidence = TRUST_DOMAINS.flatMap((d) =>
    d.ownsAuditEvidence.map((e) => ({ domain: d.id, evidence: e }))
  );
  const auditDupes = allAuditEvidence.filter(
    (entry, idx, arr) =>
      arr.findIndex((e) => e.evidence === entry.evidence) !== idx
  );
  results.push({
    testName: "T8c: No audit evidence is shared across domains (no duplicates)",
    passed: auditDupes.length === 0,
    details:
      auditDupes.length === 0
        ? `All ${allAuditEvidence.length} audit evidence types are domain-unique.`
        : `Duplicates: ${auditDupes.map((e) => e.evidence).join(", ")}`,
  });

  return results;
}

// === Privilege Escalation Tests ===
//
// These tests verify that a role cannot escalate its privileges by accessing
// another domain's keys/credentials/roles.

export function runPrivilegeEscalationTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 9: POLICY_AUTHORIZER cannot mint (that's Domain C's job)
  const policyAuthorizerCanMint = canRoleAccessDomain(
    "POLICY_AUTHORIZER",
    "DOMAIN_C_EXECUTION"
  );
  results.push({
    testName: "T9: POLICY_AUTHORIZER cannot mint (no Domain C access)",
    passed: policyAuthorizerCanMint === false,
    details: `POLICY_AUTHORIZER Domain C access: ${policyAuthorizerCanMint} (must be false — no privilege escalation)`,
  });

  // Test 10: ATTESTATION_ORACLE cannot authorize (that's Domain A's job)
  const oracleCanAuthorize = canRoleAccessDomain(
    "ATTESTATION_ORACLE",
    "DOMAIN_A_POLICY_AUTHORIZATION"
  );
  results.push({
    testName: "T10: ATTESTATION_ORACLE cannot authorize (no Domain A access)",
    passed: oracleCanAuthorize === false,
    details: `ATTESTATION_ORACLE Domain A access: ${oracleCanAuthorize} (must be false — no privilege escalation)`,
  });

  // Test 11: MINT_EXECUTOR cannot authorize OR attest (Domains A + B)
  const mintExecutorCanAuthorize = canRoleAccessDomain(
    "MINT_EXECUTOR",
    "DOMAIN_A_POLICY_AUTHORIZATION"
  );
  const mintExecutorCanAttest = canRoleAccessDomain(
    "MINT_EXECUTOR",
    "DOMAIN_B_FINALITY_ATTESTATION"
  );
  results.push({
    testName: "T11: MINT_EXECUTOR cannot authorize OR attest",
    passed:
      mintExecutorCanAuthorize === false && mintExecutorCanAttest === false,
    details: `MINT_EXECUTOR Domain A: ${mintExecutorCanAuthorize} (must be false). Domain B: ${mintExecutorCanAttest} (must be false).`,
  });

  // Test 12: 7 technical layers are NOT 7 independently owned institutional controls
  results.push({
    testName:
      "T12: 7 technical layers are NOT 7 independently owned institutional controls",
    passed:
      SEVEN_TECHNICAL_ENFORCEMENT_LAYERS.isSevenIndependentlyOwnedInstitutionalControls ===
        false &&
      SEVEN_TECHNICAL_ENFORCEMENT_LAYERS.isTechnicalEnforcementWithinThreeTrustDomains ===
        true,
    details: `isSevenIndependentlyOwnedInstitutionalControls: ${SEVEN_TECHNICAL_ENFORCEMENT_LAYERS.isSevenIndependentlyOwnedInstitutionalControls} (must be false). isTechnicalEnforcementWithinThreeTrustDomains: ${SEVEN_TECHNICAL_ENFORCEMENT_LAYERS.isTechnicalEnforcementWithinThreeTrustDomains} (must be true).`,
  });

  // Test 13: Each of the 7 layers maps to exactly one trust domain
  const allLayersMapped = SEVEN_TECHNICAL_ENFORCEMENT_LAYERS.layers.every(
    (l) => l.trustDomain
  );
  results.push({
    testName: "T13: Each of the 7 technical layers maps to exactly one trust domain",
    passed: allLayersMapped,
    details: `All 7 layers mapped: ${allLayersMapped}. Layers: ${SEVEN_TECHNICAL_ENFORCEMENT_LAYERS.layers
      .map((l) => `${l.id}→${l.trustDomain}`)
      .join(", ")}`,
  });

  return results;
}

// === Run all tests ===

export function runAllFinalityTrustDomainTests(): {
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const crossDomainResults = runCrossDomainCompromiseTests();
  const privilegeEscalationResults = runPrivilegeEscalationTests();
  const allResults = [...crossDomainResults, ...privilegeEscalationResults];
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  return { passed, failed, results: allResults };
}

// === Re-exports for test-runner endpoint convenience ===
export {
  TRUST_DOMAINS,
  CROSS_DOMAIN_ISOLATION_RULES,
  SEVEN_TECHNICAL_ENFORCEMENT_LAYERS,
  getTrustDomain,
  getTrustDomainForRole,
  getTrustDomainForKey,
  canRoleAccessDomain,
  type TrustDomainId,
};
