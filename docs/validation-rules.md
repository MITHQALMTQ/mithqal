# MITHQAL Validation Rules Specification

**Document ID:** MITHQAL-VALIDATION-RULES
**Status:** VERIFIED (Correction 5 — FULL-PLATFORM-BUILD)
**Source of truth:** `src/lib/validation-engine.ts` `VALIDATION_RULES`
array.
**Blueprint reference:** §5.2.B (Validation Rules Engine) + §5.6
(route-comparison parity) + §D.3 (truth-state separation).
**Rule version:** `2026-11-14`

## 1. Purpose

This document is the canonical specification of the deterministic
validation rules applied by the MITHQAL Assurance platform against
every record set submitted to `POST /api/v1/validation-cases`. The
specification exists so that an auditor, a regulator, or a bank
design partner can read these rules and answer the question "what
does the engine actually check?" without having to read TypeScript
source code.

Per §D.3, "specified" is distinct from "tested," "audited,"
"deployed," "legally approved," and "production-authorized." This
document is the **specification** of the rules; the
`src/lib/validation-engine.ts` module is the **implementation**; the
`src/lib/tests/` directory is the **test coverage**; the deployment
to `origin/main` at HEAD 9477c08 is the **deployed** state; the
legal review (pending) is the **legally approved** state;
`productionAuthorized=false` is the **production-authorization**
state.

## 2. Rule catalogue — 8 rules

All 8 rules are versioned at `2026-11-14`. The rule version is stored
on every `policy_decisions` row, every `validation_cases` row (via
`policy_version`), and every produced `evidence_events` row so that
replay computations can be reproduced exactly.

| # | rule_id | category | severity (validation) | severity (exception) | reason_code |
|---|---|---|---|---|---|
| 1 | CBPR-ADDR-001 | HARD_FAILURE | HARD_FAILURE | MEDIUM | UNSTRUCTURED_ADDRESS |
| 2 | AMT-MATCH-001 | SOURCE_CONFLICT | SOURCE_CONFLICT | HIGH | AMOUNT_MISMATCH |
| 3 | BENEF-VERIFY-001 | MISSING_DEPENDENCY | MISSING_DEPENDENCY | MEDIUM | BENEFICIARY_NOT_VERIFIED |
| 4 | DEBTOR-NAME-001 | WARNING | WARNING | LOW | SPECIAL_CHARACTERS_IN_NAME |
| 5 | CORRIDOR-TIME-001 | ANOMALY | ANOMALY | HIGH | UNUSUAL_PROCESSING_TIME |
| 6 | LEI-REQUIRED-001 | HARD_FAILURE | HARD_FAILURE | MEDIUM | MISSING_LEI |
| 7 | REF-UNIQUE-001 | HARD_FAILURE | HARD_FAILURE | HIGH | DUPLICATE_REFERENCE |
| 8 | CURRENCY-VALID-001 | HARD_FAILURE | HARD_FAILURE | HIGH | INVALID_CURRENCY_CODE |

The five validation-severity categories are defined in
`src/lib/validation-engine.ts`:

- `HARD_FAILURE` — message is malformed or a required field is
  missing. The case is blocked from progressing to settlement
  validation until corrected.
- `WARNING` — field present but in a non-preferred format. The
  case proceeds; the warning is recorded for audit.
- `MISSING_DEPENDENCY` — required external reference not available.
  The case is blocked until the dependency is supplied.
- `SOURCE_CONFLICT` — same transaction has different values in
  different source systems. The case is blocked pending
  reconciliation per §5.3.
- `ANOMALY` — unusual pattern that may indicate fraud or error.
  The case is routed to human investigation.

## 3. Rule-by-rule specification

### 3.1 CBPR-ADDR-001 — Creditor postal address structured (CBPR+)

| Field | Value |
|---|---|
| `rule_id` | `CBPR-ADDR-001` |
| `version` | `2026-11-14` |
| `category` | HARD_FAILURE |
| `description` | Creditor postal address must be structured per the CBPR+ usage guideline of ISO 20022 (pacs.008 / pacs.009). Unstructured address fields (`PstlAdr/AdrLine`) are deprecated for cross-border payments; the engine requires `PstlAdr/StrtNm`, `PstlAdr/PstCd`, `PstlAdr/TwnNm`, and `PstlAdr/Ctry` to be present. |
| `severity` | `HARD_FAILURE` (validation); `MEDIUM` (exception) |
| `reason_code` | `UNSTRUCTURED_ADDRESS` |
| `recommended_action` | Correct address to structured format per ISO 20022 CBPR+ (provide street name, post code, town name, country). |
| `documentation reference` | ISO 20022 CBPR+ Usage Guidelines (CBPR+UGEd.2023Q4). Blueprint §5.2.B + §16.1 (POST /validation-cases). |
| `test coverage` | `src/lib/tests/canonical-finality-model-tests.ts` covers structured vs unstructured branches; `src/lib/tests/institutional-stress-tests.ts` covers the negative case (address unstructured → exception opened). |
| `replay behavior` | Deterministic — given the same record + rule version, the engine produces the same pass/fail result. No clock dependency. |

### 3.2 AMT-MATCH-001 — Amount must match across source systems

| Field | Value |
|---|---|
| `rule_id` | `AMT-MATCH-001` |
| `version` | `2026-11-14` |
| `category` | SOURCE_CONFLICT |
| `description` | The transaction amount reported by the core banking system MUST equal the amount reported by the correspondent statement (and the settlement confirmation when available). Any divergence opens a SOURCE_CONFLICT exception with `AMOUNT_MISMATCH` reason code. The case is routed to the `reconciliation_cases` table per §5.3 with the `discrepancy_class=AMOUNT`. |
| `severity` | `SOURCE_CONFLICT` (validation); `HIGH` (exception) |
| `reason_code` | `AMOUNT_MISMATCH` |
| `recommended_action` | Investigate source discrepancy; reconcile with both systems. Open a reconciliation case if not already opened. |
| `documentation reference` | Blueprint §5.2.B + §5.3 (reconciliation tolerance). |
| `test coverage` | `src/lib/tests/reconciliation-tolerance-tests.ts` covers the in-tolerance vs out-of-tolerance boundary; `src/lib/tests/financial-soundness-tests.ts` covers the `HARD_FAILURE` triggered when the divergence exceeds tolerance. |
| `replay behavior` | Deterministic — `coreBankingAmount` vs `correspondentAmount` is a numeric equality. |

### 3.3 BENEF-VERIFY-001 — Beneficiary account verification received

| Field | Value |
|---|---|
| `rule_id` | `BENEF-VERIFY-001` |
| `version` | `2026-11-14` |
| `category` | MISSING_DEPENDENCY |
| `description` | The beneficiary account verification (a confirmation from the receiving institution that the account exists and is owned by the named creditor) MUST be received before the case can progress to settlement validation. The engine checks the `beneficiaryVerified` flag on the source record. When missing, a `MISSING_DEPENDENCY` exception is opened with `BENEFICIARY_NOT_VERIFIED` reason code. |
| `severity` | `MISSING_DEPENDENCY` (validation); `MEDIUM` (exception) |
| `reason_code` | `BENEFICIARY_NOT_VERIFIED` |
| `recommended_action` | Request beneficiary verification from the receiving institution. |
| `documentation reference` | Blueprint §5.2.B + §5.2.C (exceptions). |
| `test coverage` | `src/lib/tests/obligation-registry-tests.ts` covers the obligation-registry linkage; `src/lib/tests/institutional-stress-tests.ts` covers the `MISSING_DEPENDENCY` exception lifecycle. |
| `replay behavior` | Deterministic — flag is set by an external system and is stable across replays within the same source-snapshot version. |

### 3.4 DEBTOR-NAME-001 — Debtor name should not contain special characters

| Field | Value |
|---|---|
| `rule_id` | `DEBTOR-NAME-001` |
| `version` | `2026-11-14` |
| `category` | WARNING |
| `description` | The debtor name should not contain non-ASCII characters (per `[^\x00-\x7F]` regex). Names with accented characters, CJK characters, or emoji are flagged for human review (the case proceeds). This rule surfaces potential encoding issues that can cause downstream SWIFT message rejections. |
| `severity` | `WARNING` (validation); `LOW` (exception) |
| `reason_code` | `SPECIAL_CHARACTERS_IN_NAME` |
| `recommended_action` | Review debtor name for encoding issues; consider transliteration for SWIFT routing. |
| `documentation reference` | Blueprint §5.2.B. SWIFT MX message character set (UTF-8 with restricted code points for some fields). |
| `test coverage` | `src/lib/tests/adversarial-tests.ts` covers the encoding edge cases. |
| `replay behavior` | Deterministic — regex evaluation is stable. |

### 3.5 CORRIDOR-TIME-001 — Pending beyond 2× expected corridor settlement time

| Field | Value |
|---|---|
| `rule_id` | `CORRIDOR-TIME-001` |
| `version` | `2026-11-14` |
| `category` | ANOMALY |
| `description` | If the case has been pending longer than 2× the expected corridor settlement time (per the corridor reference data), the engine flags an ANOMALY. The anomaly may indicate a processing issue, a missing intermediary, or fraud. The case is routed to human investigation. |
| `severity` | `ANOMALY` (validation); `HIGH` (exception) |
| `reason_code` | `UNUSUAL_PROCESSING_TIME` |
| `recommended_action` | Investigate why the payment is pending beyond the expected timeframe; check with intermediaries. |
| `documentation reference` | Blueprint §5.2.B + §5.6 (route comparison). Corridor reference data in `reference_lookups` Turso projection. |
| `test coverage` | `src/lib/tests/adversarial-tests.ts` covers the timing-edge case; `src/lib/tests/business-continuity.ts` covers the operator response workflow. |
| `replay behavior` | Time-dependent — the `pendingHours` input is computed at validation time, NOT at replay time. The replay engine re-computes `pendingHours` from the source-snapshot timestamp relative to the replay's wall-clock; this is documented in `inngest/functions/replay-pipeline.ts`. |

### 3.6 LEI-REQUIRED-001 — LEI required for payments above threshold

| Field | Value |
|---|---|
| `rule_id` | `LEI-REQUIRED-001` |
| `version` | `2026-11-14` |
| `category` | HARD_FAILURE |
| `description` | For payments above the per-jurisdiction threshold (default: USD 50,000 equivalent), the debtor's Legal Entity Identifier (LEI) MUST be present and valid. The engine checks the `hasLEI` flag and the `amountThreshold` value. When the LEI is missing for an above-threshold payment, a `HARD_FAILURE` exception is opened with `MISSING_LEI` reason code. |
| `severity` | `HARD_FAILURE` (validation); `MEDIUM` (exception) |
| `reason_code` | `MISSING_LEI` |
| `recommended_action` | Provide the Legal Entity Identifier (LEI) for the debtor. The LEI is issued by GLEIF (Global LEI Foundation). |
| `documentation reference` | Blueprint §5.2.B. ISO 17442 (LEI). GLEIF reference data. |
| `test coverage` | `src/lib/tests/financial-soundness-tests.ts` covers the threshold boundary. |
| `replay behavior` | Deterministic — threshold and presence check are stable. |

### 3.7 REF-UNIQUE-001 — End-to-end reference must be unique within institution

| Field | Value |
|---|---|
| `rule_id` | `REF-UNIQUE-001` |
| `version` | `2026-11-14` |
| `category` | HARD_FAILURE |
| `description` | The end-to-end reference (`EndToEndId` in ISO 20022) MUST be unique within the institution's submitted records. Duplicate references are blocked at the API layer (the `idempotency_records` table collapses them) but the rule is also applied at the validation layer as defence-in-depth. |
| `severity` | `HARD_FAILURE` (validation); `HIGH` (exception) |
| `reason_code` | `DUPLICATE_REFERENCE` |
| `recommended_action` | Regenerate the end-to-end reference; investigate the duplicate. |
| `documentation reference` | Blueprint §5.2.B + §16.1 (idempotency). ISO 20022 `EndToEndId` field. |
| `test coverage` | `src/lib/tests/canonical-finality-model-tests.ts` covers the duplicate-detection path. |
| `replay behavior` | Deterministic — reference equality is stable. |

### 3.8 CURRENCY-VALID-001 — Currency code must be valid ISO 4217

| Field | Value |
|---|---|
| `rule_id` | `CURRENCY-VALID-001` |
| `version` | `2026-11-14` |
| `category` | HARD_FAILURE |
| `description` | The source and target currency codes MUST be valid ISO 4217 codes. The engine maintains a allowlist of 11 pilot currencies (USD, EUR, JPY, GBP, CNY, CHF, CAD, AUD, AED, SGD, INR). Currency codes outside the allowlist are rejected at validation. The allowlist is per-jurisdiction and is versioned with the rule. |
| `severity` | `HARD_FAILURE` (validation); `HIGH` (exception) |
| `reason_code` | `INVALID_CURRENCY_CODE` |
| `recommended_action` | Correct the currency code to a valid ISO 4217 code in the allowlist. |
| `documentation reference` | Blueprint §5.2.B. ISO 4217 currency code list. |
| `test coverage` | `src/lib/tests/canonical-finality-model-tests.ts` covers the allowlist path. |
| `replay behavior` | Deterministic — allowlist is hardcoded in the rule version. |

## 4. Versioning + change control

### 4.1 Rule version semantics

The rule version is a date string (`YYYY-MM-DD`) that identifies the
release date of the rule set. All 8 rules in the catalogue share the
same version. When any rule's logic, severity, or reason code changes,
the version is bumped for ALL rules and a new `policy_versions` row
is inserted.

### 4.2 Rule additions / removals

Adding a new rule to the catalogue requires:

1. A signed commit that updates `src/lib/validation-engine.ts` and
   this document.
2. A new `policy_versions` row with the bumped version.
3. Update of the `policy_cache` Turso projection by the
   `policy-publish` Inngest function.
4. A worklog entry describing the rule, its rationale, and its test
   coverage.

Removing a rule is treated identically — the rule is removed from
`VALIDATION_RULES`, the version is bumped, and the policy_versions
row records the removal in its `approval_record`. The removed rule
MAY NOT be re-added under the same `rule_id`; a new `rule_id` is
required to prevent confusion across the rule version history.

### 4.3 Backward compatibility

Replay computations (see `inngest/functions/replay-pipeline.ts`)
re-evaluate every historical case using the rule version that was
active when the case was originally validated. The
`validation_cases.policyVersion` column is the source of truth for
which rule version applied at validation time.

## 5. Truth-state labelling

Per §5.5 ("DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE"), all 8
rules and their test coverage are labelled **DEMO DATA** in the
honest state. They are SYNTHETIC candidate rules for the Pilot A
demonstrator. They are not validated against real bank data, real
regulator expectations, or real settlement system behaviour. When
a bank design partner is admitted (G2 gate), the rules will be
reviewed and updated against that partner's actual validation
requirements.

The truth-state labelling is enforced by:

- The `DEMO DATA` comment block in `src/lib/validation-engine.ts`.
- The `mtqDisabled` flag persisted on every `evidence_events` row
  that records a validation result.
- The `productionAuthorized=false` flag in every API response.

## 6. References

- `src/lib/validation-engine.ts` — implementation.
- `src/lib/tests/` — test coverage (multiple files).
- `inngest/functions/validation-pipeline.ts` — the Inngest function
  that runs the engine against submitted records.
- `inngest/functions/replay-pipeline.ts` — the Inngest function
  that re-evaluates historical cases against their rule version.
- `docs/blueprint/mithqal-canonical-v24.2.1.md` — blueprint source
  for the rule catalogue (§5.2.B).
