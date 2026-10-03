# Policy Assurance — 8-Field Policy Record + 6 Policy Tests (N-01..N-06)

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Policy Assurance Identity

| Field | Value |
|---|---|
| **Policy assurance ID** | `PA-POLICY-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Policy record fields** | 8 |
| **Policy tests** | 6 (N-01..N-06) |
| **Versioning states** | 4 |
| **Pre-assurance status** | All policies at `DESIGNED` — none yet assured |
| **Frozen schema dependency** | `policy-registry.ts` — REFERENCED_BUT_ABSENT (Prompt 74 finding LD-05) |

## 2. Policy Record Schema (8 fields)

| # | Field | Purpose |
|---|---|---|
| 1 | `policy_id` | Unique identifier for the policy |
| 2 | `policy_version` | Semantic version (e.g., 1.0.0) |
| 3 | `policy_status` | DRAFT / ACTIVE / SUPERSEDED / RETIRED (4-state versioning — see Section 4) |
| 4 | `policy_body` | The policy document (text or structured fields) |
| 5 | `effective_from` | ISO 8601 timestamp when policy becomes effective |
| 6 | `effective_to` | ISO 8601 timestamp when policy ceases (null if open-ended) |
| 7 | `approver_id` | Identifier of the approver (must satisfy separation of duties — K-05) |
| 8 | `prior_version_ref` | Reference to prior version (if any) — append-only chain per K-04 |

## 3. Six Policy Tests (N-01..N-06)

| # | Test ID | Name | Method | Expected result | Evidence | Status |
|---|---|---|---|---|---|---|
| 1 | N-01 | Policy versioning integrity | Verify every policy record has a `prior_version_ref` chain; verify no version is mutated in place | All versions traceable; no in-place mutation | ET-06 (policy version record) | DESIGNED |
| 2 | N-02 | Pre-activation status verification | Verify no policy with status=ACTIVE has effective_from > current time | No ACTIVE policy is "future-dated" | ET-06 | DESIGNED |
| 3 | N-03 | Effective-to enforcement | Verify no policy with effective_to < current time has status=ACTIVE | All expired policies are SUPERSEDED or RETIRED | ET-06 | DESIGNED |
| 4 | N-04 | Approver separation of duties | Verify approver_id differs from author_id for every ACTIVE policy | 100% separation | ET-06 | DESIGNED |
| 5 | N-05 | Policy body immutability | Verify policy_body hash matches hash stored at creation (K-01) | 100% match | ET-06 + integrity log | DESIGNED |
| 6 | N-06 | Policy retrieval at historical timestamp | Given a historical timestamp T, retrieve the version of policy P that was ACTIVE at T | Retrieved version matches expected historical version | ET-06 + replay (ET-09) | DESIGNED |

## 4. Four-State Versioning Model

| State | Meaning | Allowed transitions |
|---|---|---|
| `DRAFT` | Policy is being authored; not yet effective | → ACTIVE (with approver signature) or → RETIRED (withdrawn before activation) |
| `ACTIVE` | Policy is in force | → SUPERSEDED (when a new version becomes ACTIVE) |
| `SUPERSEDED` | Policy has been replaced by a newer ACTIVE version | → RETIRED (after retention period) |
| `RETIRED` | Policy is no longer in force and no longer referenced | (terminal state) |

A policy may NOT transition from ACTIVE back to DRAFT. A SUPERSEDED policy may NOT return to ACTIVE. Transitions are append-only (per K-04) and hashed (per K-01, K-02).

## 5. Pre-Assurance Status

All policies in the system are at `DESIGNED` for assurance purposes:
- No policy has been assured by this framework.
- No policy test (N-01..N-06) has been executed.
- No policy evidence (ET-06) has been collected.
- The policy registry frozen schema (`policy-registry.ts`) is MISSING (Prompt 74 finding LD-05).

When the frozen schema is restored AND a provider executes the policy tests, the pre-assurance status will move from `DESIGNED` to `EXECUTED` for each test that passes.

## 6. Honest-State Markers

- 0 policies assured.
- 0 policy tests executed.
- 0 policy evidence records collected.
- All 6 tests (N-01..N-06) at status `DESIGNED`.
- Frozen schema `policy-registry.ts` REFERENCED_BUT_ABSENT.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
