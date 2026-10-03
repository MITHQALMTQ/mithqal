# Assurance Provider Evaluation Framework — 12 Criteria (EC-01..EC-12) + 5-State Assessment + No-Ranking Rule

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Evaluation Framework Identity

| Field | Value |
|---|---|
| **Framework ID** | `APEF-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Criterion count** | 12 (EC-01..EC-12) |
| **Assessment state count** | 5 (per criterion) |
| **No-ranking rule** | ENFORCED — see Section 4 |
| **Evaluation matrix template** | YES — see Section 5 |
| **Providers evaluated to date** | 0 |

## 2. Twelve Evaluation Criteria (EC-01..EC-12)

| # | Criterion ID | Name | Description |
|---|---|---|---|
| 1 | EC-01 | Independence | Provider satisfies the 10 COI questions (per `01_assurance-charter.md` Section 7) with no DISQUALIFYING "yes" answers |
| 2 | EC-02 | Competence | Provider has demonstrated competence in institutional transaction systems, evidence-based assurance, and reproducibility |
| 3 | EC-03 | Capacity | Provider has the capacity (staff, time) to execute the 94 tests in `assurance-test-register.json` within the agreed timeline |
| 4 | EC-04 | Methodology | Provider's methodology aligns with the framework's 13-type evidence taxonomy, backward-trace procedure, and independent recalculation |
| 5 | EC-05 | Tools | Provider has (or will develop) the replay tool per `assurance-replay-specification.md` |
| 6 | EC-06 | Reputation | Provider has a clean reputation (no fraud, no professional misconduct, no material litigation) |
| 7 | EC-07 | Insurance | Provider maintains professional indemnity insurance |
| 8 | EC-08 | Data security | Provider meets the data security requirements per `assurance-provider-sow.md` Section 13 |
| 9 | EC-09 | Reporting | Provider commits to the 12-section report template per `26_external-report-template.md` (including mandatory disclosure) |
| 10 | EC-10 | Limitations acceptance | Provider accepts the 15 mandatory limitations per `27_assurance-limitations.md` |
| 11 | EC-11 | No-endorsement acceptance | Provider accepts the no-endorsement rule per `01_assurance-charter.md` Section 8 |
| 12 | EC-12 | No-promotional-use acceptance | Provider accepts the no-promotional-use rule per `27_assurance-limitations.md` Section 6 |

## 3. Five-State Assessment (per criterion)

For each criterion, the framework owner assesses the provider on a 5-state scale:

| State | Meaning |
|---|---|
| `EXCELLENT` | Provider exceeds the criterion |
| `GOOD` | Provider meets the criterion fully |
| `ACCEPTABLE` | Provider meets the criterion with minor concerns |
| `BELOW_EXPECTATION` | Provider does not fully meet the criterion; gap identified |
| `UNACCEPTABLE` | Provider fails the criterion; engagement cannot proceed |

## 4. No-Ranking Rule

> **The framework does NOT rank providers.** The framework evaluates each provider independently against the 12 criteria. If multiple providers are assessed, they are not ranked against each other.

The framework:
- Evaluates each provider against the 12 criteria (5-state scale per criterion).
- Does NOT compute a weighted score.
- Does NOT rank providers.
- Does NOT select a "winner."

The framework owner makes the final selection decision independently, based on the per-criterion assessments. The framework's role is to provide the assessments — not to make the selection.

If a provider is `UNACCEPTABLE` on any of EC-01 (Independence), EC-09 (Reporting), EC-10 (Limitations), EC-11 (No-endorsement), or EC-12 (No-promotional-use), the engagement cannot proceed regardless of the other criteria.

## 5. Evaluation Matrix Template

The evaluation matrix is a 12-row × 5-column table (per criterion × per state):

| Criterion | EXCELLENT | GOOD | ACCEPTABLE | BELOW_EXPECTATION | UNACCEPTABLE |
|---|---|---|---|---|---|
| EC-01 Independence | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-02 Competence | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-03 Capacity | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-04 Methodology | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-05 Tools | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-06 Reputation | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-07 Insurance | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-08 Data security | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-09 Reporting | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-10 Limitations | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-11 No-endorsement | ☐ | ☐ | ☐ | ☐ | ☐ |
| EC-12 No-promotional-use | ☐ | ☐ | ☐ | ☐ | ☐ |

For each criterion, exactly one cell is checked (the assessed state).

## 6. Honest-State Markers

- 0 providers evaluated.
- 0/12 criteria assessed.
- All 12 criteria at state `DESIGNED`.
- All 5 assessment states specified.
- No-ranking rule enforced.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
