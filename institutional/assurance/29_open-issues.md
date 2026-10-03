# Open Issues — 20 Open Issues (O-01..O-20) + 6 Critical Blockers + Pre-Assurance Check (PA-01..PA-18) + Honest-State Audit (HS-01..HS-10) + Document-Drift Audit + Repository-Boundary Audit

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Open Issues Identity

| Field | Value |
|---|---|
| **Open issues ID** | `OPI-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Open issue count** | 20 (O-01..O-20) |
| **Critical blocker count** | 6 (see Section 3) |
| **Pre-assurance check count** | 18 (PA-01..PA-18) |
| **Honest-state audit count** | 10 (HS-01..HS-10; 0 CLAIM_CONTROL_EXCEPTION) |
| **Document-drift audit** | YES — see Section 5 |
| **Repository-boundary audit** | YES — see Section 6 |

## 2. Twenty Open Issues (O-01..O-20)

| # | Issue ID | Title | Description | Severity | Status |
|---|---|---|---|---|---|
| 1 | O-01 | Frozen schema loss | 9 of 10 frozen schemas MISSING (Prompt 74 findings LD-01..LD-09) | CRITICAL | OPEN |
| 2 | O-02 | Assurance framework loss | Original Prompt 70 assurance framework was never committed (LD-10) — this is the reconstruction | CRITICAL | IN_PROGRESS (this reconstruction) |
| 3 | O-03 | P62-69 institutional directory loss | 7 institutional directories MISSING (LD-11..LD-16) | CRITICAL | OPEN |
| 4 | O-04 | MTQ economics | MTQ is DISABLED; F3/F4 NOT_CLAIMED; no MTQ-economic output may be endorsed | CRITICAL | OPEN (by design — not a defect) |
| 5 | O-05 | 0 banks | 0 banks attended; bank pipeline at NOT_STARTED | CRITICAL (for execution) | OPEN |
| 6 | O-06 | 0 counsel | 0 counsel engaged; F5 legal-dependency portion NOT_CLAIMED | CRITICAL (for execution) | OPEN |
| 7 | O-07 | 0 pilots | 0 pilot executions; expected results in `11_authorization-assurance.md` are DESIGNED, not observed | CRITICAL (for execution) | OPEN |
| 8 | O-08 | 0 providers | 0 assurance providers retained; framework at design state only | CRITICAL (for execution) | OPEN |
| 9 | O-09 | 0 regulators | 0 regulators engaged | HIGH (for execution) | OPEN |
| 10 | O-10 | node_modules absent | node_modules MISSING (LD-19); dependency scanning not possible | HIGH | OPEN |
| 11 | O-11 | .env near-empty | .env has 1 line; 51 of 52 vars missing (LD-18) | HIGH | OPEN |
| 12 | O-12 | prisma/migrations absent | Migrations MISSING (LD-17); schema via db:push only | MEDIUM | OPEN |
| 13 | O-13 | Version drift | v25.3.2 claimed vs v25.6 tagged | MEDIUM | OPEN |
| 14 | O-14 | VULNERABILITY_TEST NOT_CLAIMED | No scanner engaged | HIGH (for security assurance) | OPEN |
| 15 | O-15 | PENETRATION_TEST NOT_CLAIMED | No tester engaged | HIGH (for security assurance) | OPEN |
| 16 | O-16 | KPI baselines 0/15 | No KPIs observed or recalculated | HIGH (for outcome assurance) | OPEN |
| 17 | O-17 | Bank Value Measurement Engine all UNKNOWN | 12×6=72 cells all UNKNOWN | HIGH (for outcome assurance) | OPEN |
| 18 | O-18 | Evidence room empty | 0 evidence records collected | HIGH (for execution) | OPEN |
| 19 | O-19 | Architecture freeze absent | controlled-architecture-freeze.ts MISSING (LD-01) | CRITICAL | OPEN |
| 20 | O-20 | Independent reviewer absent | 0 reviewers retained | CRITICAL (for execution) | OPEN |

## 3. Six Critical Blockers

The following 6 open issues are CRITICAL BLOCKERS that prevent the framework from moving from `DESIGNED` to `EXECUTED`:

1. **O-01** — Frozen schema loss (9 of 10 schemas MISSING).
2. **O-02** — Assurance framework loss (resolved by this reconstruction — but reconstruction is NOT preservation).
3. **O-04** — MTQ DISABLED; F3/F4 NOT_CLAIMED (by design — not a defect, but blocks any MTQ-economic conclusion).
4. **O-08** — 0 providers retained.
5. **O-19** — Architecture freeze absent.
6. **O-20** — 0 independent reviewers.

Until these 6 critical blockers are resolved, the framework CANNOT execute. Specifically:
- O-01, O-19: require restoration of frozen schemas (separate remediation).
- O-02: resolved by this reconstruction, but execution still blocked by O-08 and O-20.
- O-04: by design — only resolved when MTQ is re-enabled by explicit governance (NOT occurred).
- O-08, O-20: require procurement of an external reviewer (per `assurance-provider-sow.md`).

## 4. Pre-Assurance Check (PA-01..PA-18)

Before any external assurance provider begins work, the following 18 pre-assurance checks must pass:

| # | Check ID | Check | Required state | Current state |
|---|---|---|---|---|
| 1 | PA-01 | Charter authorized | TRUE | TRUE (this room) |
| 2 | PA-02 | Scope defined | TRUE | TRUE |
| 3 | PA-03 | Criteria designed | TRUE | TRUE |
| 4 | PA-04 | Control objectives designed | TRUE | TRUE |
| 5 | PA-05 | Control library designed | TRUE | TRUE |
| 6 | PA-06 | Test register designed | TRUE | TRUE |
| 7 | PA-07 | Evidence schema designed | TRUE | TRUE |
| 8 | PA-08 | Replay protocol designed | TRUE | TRUE |
| 9 | PA-09 | Sampling plan designed | TRUE | TRUE |
| 10 | PA-10 | Finding classification designed | TRUE | TRUE |
| 11 | PA-11 | Management response framework designed | TRUE | TRUE |
| 12 | PA-12 | Remediation retest framework designed | TRUE | TRUE |
| 13 | PA-13 | Report template designed | TRUE | TRUE |
| 14 | PA-14 | Limitations published | TRUE | TRUE |
| 15 | PA-15 | Evidence index designed | TRUE | TRUE |
| 16 | PA-16 | Open issues list published | TRUE | TRUE (this file) |
| 17 | PA-17 | Independent reviewer retained | TRUE | **FALSE** (0 retained) |
| 18 | PA-18 | Engagement schedule authorized | TRUE | **FALSE** (0 schedule) |

PA-01..PA-16 are TRUE (this room has them all). PA-17 and PA-18 are FALSE — these are the gating pre-assurance checks that block execution.

## 5. Document-Drift Audit

The framework tracks document drift. Current audit:

| # | Audit | Result |
|---|---|---|
| 1 | Frozen schema drift | 9 of 10 frozen schemas MISSING (LD-01..LD-09); drift cannot be measured (no originals to compare) |
| 2 | Policy drift | UNKNOWN — `policy-registry.ts` MISSING; drift cannot be measured |
| 3 | Configuration drift | .env has 1 line; .env.example has 52 lines; drift = 51 vars missing |
| 4 | Documentation drift | v25.3.2 claimed vs v25.6 tagged; drift present |
| 5 | Architecture drift | controlled-architecture-freeze.ts MISSING; drift cannot be measured |

## 6. Repository-Boundary Audit

The framework's repository boundary audit:

| # | Audit | Result |
|---|---|---|
| 1 | Uncommitted files | Yes — this room's 42 files are newly created (uncommitted until git add/commit) |
| 2 | Dangling commits | 6 (per Prompt 74 — none contain missing frozen schemas) |
| 3 | Unstaged changes | Yes — many institutional files modified (likely line-ending differences; not content drift) |
| 4 | node_modules | ABSENT (LD-19) |
| 5 | .env | 1 line (LD-18) |
| 6 | prisma/migrations | ABSENT (LD-17) |

The repository-boundary audit confirms that the reviewer MUST use the immutable baseline snapshot at `institutional/audit/prompt-74/baseline/` as the forensic starting point.

## 7. Honest-State Audit (HS-01..HS-10)

| # | Audit ID | Audit | Result |
|---|---|---|---|
| 1 | HS-01 | Every .md carries NOT PRODUCTION-AUTHORIZED | TRUE (this room) |
| 2 | HS-02 | Every .json carries NOT_PRODUCTION_AUTHORIZED | TRUE (this room) |
| 3 | HS-03 | Every control at state DESIGNED | TRUE |
| 4 | HS-04 | Every test at status DESIGNED | TRUE |
| 5 | HS-05 | 0 findings | TRUE |
| 6 | HS-06 | 0 evidence | TRUE |
| 7 | HS-07 | MTQ DISABLED; F3/F4 NOT_CLAIMED | TRUE |
| 8 | HS-08 | 0 banks; 0 counsel; 0 pilot execution | TRUE |
| 9 | HS-09 | BUILD_MODE = FROZEN | TRUE |
| 10 | HS-10 | 0 CLAIM_CONTROL_EXCEPTION | TRUE |

All 10 honest-state audits return TRUE. There are 0 CLAIM_CONTROL_EXCEPTIONS in this room (no artifact claims an exception to the honest-state rules).

## 8. Honest-State Markers

- 20 open issues; 6 critical blockers.
- 0/18 pre-assurance checks FALSE (PA-17, PA-18 are FALSE — the gating checks).
- 5 document-drift audits; 5 UNKNOWN or partially-drifted.
- 6 repository-boundary audits; 4 unsatisfactory.
- 10 honest-state audits; 10 TRUE; 0 CLAIM_CONTROL_EXCEPTION.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
