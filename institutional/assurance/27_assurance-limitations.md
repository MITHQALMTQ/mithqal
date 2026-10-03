# Assurance Limitations — 15 Mandatory Limitations + No-Hidden-Assumption Rule + Manual-Attestation Rule + No-Promotional-Use Rule

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Limitations Identity

| Field | Value |
|---|---|
| **Limitations ID** | `LIM-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Mandatory limitation count** | 15 (L1–L15) |
| **No-hidden-assumption rule** | ENFORCED — 5 classes (see Section 3) |
| **Small-population disclosure** | ENFORCED — see Section 4 |
| **Manual-attestation rule** | ENFORCED — 13 evidence types (see Section 5) |
| **No-promotional-use rule** | ENFORCED — see Section 6 |
| **Location of limitations** | IN-BODY (NOT in appendix — limitations are mandatory reading, not optional appendix) |

## 2. Fifteen Mandatory Limitations (L1–L15)

| # | ID | Limitation | Source |
|---|---|---|---|
| 1 | L1 | The framework covers the 23 in-scope domains (per `02_scope-and-boundaries.md`); 15 items are out-of-scope. Out-of-scope items are NOT examined. | `02_scope-and-boundaries.md` |
| 2 | L2 | MTQ is DISABLED; F3 (asset-backed value) and F4 (gated-liquidity value) are NOT_CLAIMED. No MTQ-economic output is validated. | `12_finality-assurance.md` |
| 3 | L3 | VULNERABILITY_TEST and PENETRATION_TEST are NOT_CLAIMED (per `14_security-assurance.md`); no third-party security review engaged. | `14_security-assurance.md` |
| 4 | L4 | 0 banks attended; bank attendance ≠ bank validation. No bank solvency, capital adequacy, or liquidity provision is opined. | `21_bank-validation.md` |
| 5 | L5 | 0 counsel engaged. F5 settlement finality (legal portion) is NOT_CLAIMED. | `01_assurance-charter.md` |
| 6 | L6 | 0 regulators engaged. No regulatory approval is opined. | `01_assurance-charter.md` |
| 7 | L7 | 0 pilot executions. Expected results in `11_authorization-assurance.md` are DESIGNED, not observed. | `11_authorization-assurance.md` |
| 8 | L8 | 9 of 10 frozen schemas MISSING (Prompt 74 findings LD-01..LD-09). Reviewer cannot examine the internal logic of missing schemas. Replays against missing schemas will return INSUFFICIENT_EVIDENCE. | `08_evidence-integrity.md`, Prompt 74 LD-01..LD-09 |
| 9 | L9 | Manual-attestation (ET-12, ET-13) is WEAK. May NOT substitute for STRONG evidence (ET-01..ET-09). | `07_evidence-chain.md` |
| 10 | L10 | 16 authorization scenarios + 15 failure scenarios are too small for statistical inference. Sampling is census/purposive. No statistical confidence is claimed. | `22_sampling-methodology.md` |
| 11 | L11 | The framework does not opine on price discovery, capital adequacy, or liquidity provision (out of scope). | `02_scope-and-boundaries.md` |
| 12 | L12 | The framework does not validate marketing claims; it only validates that claims are NOT made without evidence. | `02_scope-and-boundaries.md` |
| 13 | L13 | The framework does not authorize architecture changes (BUILD_MODE = FROZEN). | `02_scope-and-boundaries.md` |
| 14 | L14 | The framework's evidence room has 0 evidence records (current population). All evidence types are DESIGNED. | `28_assurance-evidence-index.md` |
| 15 | L15 | The framework's KPI population has 0/15 baselines populated. No KPI has been observed or recalculated. | `19_kpi-assurance.md` |

## 3. No-Hidden-Assumption Rule — 5 Classes

> **Every assumption must be visible. If an assumption is not visible in this file or in `29_open-issues.md`, it does not exist for purposes of this framework.**

The 5 assumption classes:

| Class | Name | Where recorded |
|---|---|---|
| 1 | Design assumption | This file (Section 2) or `29_open-issues.md` |
| 2 | Operational assumption | This file (Section 2) or `29_open-issues.md` |
| 3 | Evidence assumption | This file (Section 2) or `28_assurance-evidence-index.md` |
| 4 | Sampling assumption | This file (Section 2) or `assurance-sampling-plan.md` |
| 5 | Replay/reproducibility assumption | This file (Section 2) or `09_replay-protocol.md` |

Any artifact in this room that depends on an assumption NOT listed in one of these 5 classes is non-conformant and must be retracted.

## 4. Small-Population Disclosure

The framework explicitly discloses (per `22_sampling-methodology.md`):
- The 15 mandatory failure scenarios (F-01..F-15) have N=15 — too small for statistical inference.
- The 16 authorization scenarios (O-01..O-10 plus 6 additional per `11_authorization-assurance.md`) have N≤16 — too small for statistical inference.

For these populations:
- Sampling is census (examine every item).
- Inference is non-statistical.
- No statistical confidence is claimed.

## 5. Manual-Attestation Rule — 13 Evidence Types

Per `07_evidence-chain.md` Section 4, manual-attestation (ET-12 reviewer-signed, ET-13 management-signed) is WEAK. The framework's rule:

- ET-12 and ET-13 may NOT substitute for STRONG evidence (ET-01..ET-09).
- ET-12 and ET-13 may NOT justify an `OBSERVED_RESULT` conclusion.
- ET-12 and ET-13 may NOT close a finding without independent retest (per `25_remediation-retest.md`).
- ET-12 and ET-13 may NOT endorse a value, capital, liquidity, or reserve benefit.

Any conclusion based solely on ET-12 or ET-13 must be labeled `CONCLUSION_BASED_ON_WEAK_EVIDENCE` and is NOT a basis for `OBSERVED_RESULT`.

## 6. No-Promotional-Use Rule

> **No party may use the framework's outputs for promotional purposes without (a) explicit written approval from the framework owner AND (b) full disclosure of all 15 limitations (Section 2).**

This means:
- No "we passed independent assurance" claim without explicit written approval.
- No "audited by [reviewer]" claim without full disclosure of limitations.
- No "certified" claim — the framework does NOT certify; it only concludes.
- No marketing use that omits any of L1–L15.

Any promotional use that omits limitations is a CRITICAL finding per `23_finding-classification.md` and the framework owner may retract the engagement.

## 7. Honest-State Markers

- 0 limitations "resolved" (all 15 remain active).
- 0 assumptions hidden (rule enforced).
- 0 small-population inferences claimed (rule enforced).
- 0 manual-attestation substitutions (rule enforced).
- 0 promotional uses authorized.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
