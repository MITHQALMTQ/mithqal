# Assurance Provider Scope of Work (SOW) — Neutral

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. SOW Identity

| Field | Value |
|---|---|
| **SOW ID** | `SOW-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` (template only — no provider engaged) |
| **Section count** | 19 |
| **Fee model** | NONE INVENTED — see Section 17 (no fee invented; no commercial terms invented) |
| **Providers engaged to date** | 0 |

## 2. Sections 1–19

### Section 1: Background

The framework owner (JOZOUR_LLC_NJ, G0_CONDITIONAL) has designed an institutional transaction system (the "MITHQAL system") and seeks an independent assurance provider to evaluate the system's design against the criteria, control objectives, controls, and tests specified in `/institutional/assurance/`.

### Section 2: Purpose

The purpose of this engagement is to provide a neutral, evidence-based, reproducibility-supporting evaluation of whether the MITHQAL system, as designed and (where executed) as operated, satisfies its declared control objectives, evidentiary requirements, and finality obligations.

### Section 3: Scope

The scope is the 23 in-scope domains defined in `02_scope-and-boundaries.md` Section 2. The 15 out-of-scope items (Section 3 of that file) are excluded.

### Section 4: Systems

The systems under review are:
- The committed source code at git HEAD (per `institutional/audit/prompt-74/baseline/repository-manifest.json`).
- The configuration (`.env.example`, `vercel.json`, `Caddyfile`, `package.json`).
- The institutional documentation (`/institutional/`).

The systems NOT under review:
- `node_modules/` (absent — Prompt 74 LD-19).
- `.env` contents (near-empty — LD-18).
- Uncommitted files (per `02_scope-and-boundaries.md` Section 6).

### Section 5: Pilot

No pilot is in scope (0 pilots executed — per `11_authorization-assurance.md` Section 4).

### Section 6: Control Domains

The 23 control domains per `02_scope-and-boundaries.md` Section 2.

### Section 7: Evidence

The 13-type evidence taxonomy per `07_evidence-chain.md` Section 3. All evidence is at state `DESIGNED` (0 collected).

### Section 8: Test Procedures

The 94 tests per `assurance-test-register.json`. All at status `DESIGNED`.

### Section 9: Deliverables

The provider must deliver:
1. The external report per `26_external-report-template.md` (12 sections).
2. The findings register per `23_finding-classification.md`.
3. The remediation records per `25_remediation-retest.md`.
4. The replay outputs per `09_replay-protocol.md` (MATCH/MISMATCH/INSUFFICIENT_EVIDENCE).

### Section 10: Limitations

The 15 mandatory limitations per `27_assurance-limitations.md` (in-body, NOT appendix).

### Section 11: Independence

The independence requirements per `01_assurance-charter.md` Section 6.

### Section 12: Conflicts

The 10 COI questions per `01_assurance-charter.md` Section 7. A "yes" to any of (1)–(7) is a DISQUALIFYING COI.

### Section 13: Data Security

The provider must:
- Treat all data accessed under this engagement as RESTRICTED (per `28_assurance-evidence-index.md` Section 5).
- Not retain data beyond the engagement close.
- Not transfer data to third parties without written approval.

### Section 14: Reporting

Reporting per `26_external-report-template.md`. Mandatory disclosure (Section 3 of that file) is required.

### Section 15: Retest

Retest per `25_remediation-retest.md` (7-stage pipeline; 9-step retest procedure).

### Section 16: Timeline

The engagement timeline is NOT specified in this SOW. The framework owner and provider will agree on a timeline at engagement time.

### Section 17: Commercial

**No fee is invented in this SOW.** The framework owner and provider will negotiate commercial terms (fee, payment schedule, expenses) at engagement time. No commercial term is specified, implied, or assumed here.

### Section 18: No Endorsement

The provider's engagement does NOT constitute endorsement of:
- The framework owner.
- The MITHQAL system.
- Any bank, counsel, regulator, or counterparty.
- Any MTQ-economic output (MTQ DISABLED; F3/F4 NOT_CLAIMED).

Any promotional use requires explicit written approval AND full disclosure of all 15 limitations per `27_assurance-limitations.md` Section 6.

### Section 19: Acceptance

The provider accepts this SOW by signing the COI disclosure (per `01_assurance-charter.md` Section 7) and the no-endorsement rule (per `01_assurance-charter.md` Section 8).

## 3. Honest-State Markers

- 0 providers engaged.
- 0 SOWs executed.
- 0 fees invented.
- 0 commercial terms invented.
- All 19 sections at state `DESIGNED`.
- No-endorsement rule enforced.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
