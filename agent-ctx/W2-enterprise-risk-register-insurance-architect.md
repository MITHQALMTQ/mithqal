# Agent W2 — Enterprise Risk Register + Insurance/Risk-Transfer Architect

## Task

**Task ID:** W2
**Agent:** Sub-agent (full-stack-developer) — Enterprise Risk Register + Insurance/Risk-Transfer Architect
**Task:**
- PROMPT 30 — Convert the existing risk architecture into an actionable enterprise risk register (17 risk categories, 14 fields per risk, qualitative probability only).
- PROMPT 31 — Create a structured insurance and contractual risk-transfer framework (7 coverage categories, DESIGNED -> QUOTED -> BOUND -> ACTIVE, never substitute for controls).

**Version:** v25.3.18
**Change Requests:** CR-2026-006 (P30) + CR-2026-007 (P31) — ADDITIVE, APPROVED (COO + CTO joint approval per Architecture Freeze v25.3.15)
**Commit SHA:** `c91de700807b1b8e78a292a85feaf73f4875db76`
**Pushed to:** `origin/main` (on top of `c92178c` P28/P29 v25.3.18 deployment)

## Files Created

1. **`src/lib/enterprise-risk-register.ts`** (canonical source — P30)
   - 17 risk entries (one per category): LEGAL, REGULATORY, LIQUIDITY, CREDIT, CUSTODY, SETTLEMENT, RECONCILIATION, CYBER, INSIDER, MODEL, ORACLE, VENDOR, CONCENTRATION, GEOPOLITICAL, DATA, OPERATIONAL, COMMERCIAL, REPUTATIONAL
   - 14 fields per risk (per directive): riskId, category, description, cause, affectedControl, owner, inherentSeverity, currentEvidenceState, mitigation, residualSeverity, trigger, escalationPath, requiredEvidence, dueDate, status
   - All owners singular + explicit (per directive): `COO (Jozour, LLC)` or `CTO (Jozour, LLC)` — no shared ownership, no committee, no TBD
   - Qualitative severity only (per directive "Do NOT invent probabilities"): LOW / MEDIUM / HIGH / CRITICAL
   - All 17 risks: `status=OPEN`, `currentEvidenceState=DESIGNED|PENDING_EXTERNAL_VALIDATION` — honest state
   - `NO_INVENTED_PROBABILITIES_RULE` — `calibratedEmpiricalDataExists=false`, `noNumericProbabilities` string
   - `SINGULAR_OWNER_RULE` — `permittedOwners = ["COO (Jozour, LLC)", "CTO (Jozour, LLC)"]`
   - `RISK_CATEGORIES` catalog (17 entries with `code` + `description`)
   - `RISK_FIELDS` readonly tuple of 15 keys (14 directive fields + status)
   - `getRisk(riskId)` + `getRisksByCategory(category)` API helpers
   - Status exports: `RISK_REGISTER_STATUS = "ACTIVE"`, `RISK_REGISTER_VERSION = "v25.3.18-W2-1.0"`, `RISK_REGISTER_SOURCE`, `RISK_COUNT = 17`, `RISK_FIELD_COUNT = 14`, `RISK_CATEGORY_COUNT = 17`

2. **`src/app/api/enterprise-risk-register/route.ts`** (GET endpoint)
   - `GET /api/enterprise-risk-register` — returns full register + categories + fields + both critical rules
   - `GET ?riskId=X` — single-risk lookup; 200 if valid, 400 if invalid
   - `GET ?category=X` — category filter; 200 if valid, 400 if invalid
   - Rate-limited 30 req/min per IP via `enforceRateLimit`
   - `_meta` envelope: activeModel=v25.3.18, source, version, status, overrideRule, changeRequest=CR-2026-006

3. **`src/lib/insurance-risk-transfer-framework.ts`** (canonical source — P31)
   - 7 insurance categories (per directive): Cyber, Tech E&O / Professional Indemnity, Crime/Fidelity, D&O, Custody/Asset Risk, Business Interruption, Other Institutionally Relevant
   - 10 fields per category (per directive): riskCovered, excludedRisk, insuredParty, policyStatus, requiredLimit, deductibleRetention, jurisdiction, brokerCarrierEvidence, contractDependency, validationState
   - All 7 categories: `policyStatus=DESIGNED` (none QUOTED/BOUND/ACTIVE) — honest state, "Evaluate, without assuming availability"
   - `PolicyStatus` type: `DESIGNED | QUOTED | BOUND | ACTIVE | PENDING_QUOTE | UNAVAILABLE`
   - `NO_SUBSTITUTE_RULE` (per directive "Never represent insurance as a substitute for legal segregation, capital, liquidity or operational controls"):
     - `whatInsuranceIs` / `whatInsuranceIsNot` strings
     - `fourForbiddenSubstitutions` array of 4 entries (legal segregation, capital, liquidity, operational controls) each with `forbidden` + `whyForbidden`
   - `POLICY_LIFECYCLE_RULE` — `stages = ["DESIGNED", "QUOTED", "BOUND", "ACTIVE"]`, `currentHonestState` string documenting all 7 at DESIGNED
   - `INSURANCE_FIELDS` readonly tuple of 10 keys
   - `getCategory(categoryId)` + `getCategoriesByStatus(status)` API helpers
   - Status exports: `INSURANCE_FRAMEWORK_STATUS = "ACTIVE"`, `INSURANCE_FRAMEWORK_VERSION = "v25.3.18-W2-1.0"`, `INSURANCE_FRAMEWORK_SOURCE`, `INSURANCE_CATEGORY_COUNT = 7`, `INSURANCE_FIELD_COUNT = 10`

4. **`src/app/api/insurance-framework/route.ts`** (GET endpoint)
   - `GET /api/insurance-framework` — returns all 7 categories + fields + NO_SUBSTITUTE_RULE + POLICY_LIFECYCLE_RULE
   - `GET ?categoryId=X` — single-category lookup; 200 if valid, 400 if invalid
   - `GET ?status=X` — status filter (e.g., `?status=ACTIVE` returns `categoryCount=0`); 200 if valid, 400 if invalid
   - Rate-limited 30 req/min per IP via `enforceRateLimit`
   - `_meta` envelope: activeModel=v25.3.18, source, version, status, overrideRule, changeRequest=CR-2026-007

## Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings
- Dev server: GET endpoints all return 200 in 7–209ms (compile times on first hit, then 7-13ms warm)
- `GET /api/enterprise-risk-register` → riskCount=17, riskFieldCount=14, riskCategoryCount=17
- `GET ?riskId=RISK-CYBER-001` → full 14-field entry returned (owner="CTO (Jozour, LLC)", inherentSeverity=CRITICAL, residualSeverity=HIGH, status=OPEN)
- `GET ?riskId=INVALID` → 400 `{"error":"Invalid riskId: INVALID"}`
- `GET /api/insurance-framework` → categoryCount=7, fieldCount=10, all 7 categories policyStatus=DESIGNED
- `GET ?categoryId=INS-CYBER-001` → full category with 10 fields
- `GET ?status=ACTIVE` → categoryCount=0 (honest state — no policies ACTIVE)

## Preserved Invariants (Architecture Freeze v25.3.15)

- v19 monetary engine: NOT touched
- T2 Controlled Architecture Freeze: NOT touched
- No prior agent's module touched (I2/I3/I4/J2/J3/K2/K3/K4/K5/M1/M2/N1/N2/O1/O2/P1/P2/Q1/Q2/R1/R2/S1/S2/T1/T2/U1/U2/V1)
- Only ADDED code (4 new files); no existing functionality removed

## Cross-References

- v25.3.5 K2/K3 — MTQ economic definition + Required Coverage formula + Risk Buffer (cited in LIQUIDITY, CREDIT, CONCENTRATION, INS-CUSTODY, NO_SUBSTITUTE_RULE)
- v25.3.6 K4 — reserve domains + anti-double-counting (cited in LIQUIDITY, CREDIT, CUSTODY, CONCENTRATION, DATA, NO_SUBSTITUTE_RULE)
- v25.3.7 M1 — JOZOUR_LLC_NJ (cited in INS-CYBER, INS-TECH-EO, INS-CRIME, INS-DO insured party fields)
- v25.3.7 M2 — 3 trust domains + 6 cross-domain isolation rules (cited in CYBER, INSIDER, ORACLE, DATA risks)
- v25.3.8 N1 — F0-F7 finality model (cited in SETTLEMENT, MODEL, ORACLE)
- v25.3.8 N2 — Evidence Fabric + SHA-256 commitments (cited in DATA, REPUTATIONAL)
- v25.3.9 O1 — Obligation registry (cited in CREDIT, REPUTATIONAL, LEGAL)
- v25.3.9 O2 — 6 reconciliation tolerance policies (cited in RECONCILIATION, DATA)
- v25.3.10 P1 — Corridor Pain Index (cited in COMMERCIAL)
- v25.3.10 P2 — Two pilot modes (cited in COMMERCIAL)
- v25.3.11 Q1 — Bank value model + 4 evidence status labels (cited in COMMERCIAL, REPUTATIONAL)
- v25.3.11 Q2 — Pilot gate framework + canPassWithImplementationOnly=false (cited in INSIDER, OPERATIONAL)
- v25.3.12 R2 — RegulatoryReplayEngine READ-ONLY (cited in DATA)
- v25.3.13 S1 — SettlementContinuityFabric 9 events x 7-stage lifecycle (cited in LIQUIDITY, CREDIT, CUSTODY, SETTLEMENT, CYBER, ORACLE, GEOPOLITICAL, OPERATIONAL, NO_SUBSTITUTE_RULE)
- v25.3.15 T2 — Architecture Freeze 7-step change process (cited in OPERATIONAL, NO_SUBSTITUTE_RULE)
- v25.3.15 T1 — 17 adversarial tests (cited in MODEL)
- v25.3.16 U1 — P25 10 classification areas all PENDING_EXTERNAL_VALIDATION (cited in LEGAL, REGULATORY)
- v25.3.16 U2 — PBC legal enforceability 14 fields + custody arrangement field (cited in CREDIT, CUSTODY, INS-CUSTODY, NO_SUBSTITUTE_RULE)
- v25.3.17 V1 — Failure/Default/Resolution Legal Conditionality 6 forbidden assumptions (cited in CREDIT, COMMERCIAL, REPUTATIONAL)
