# ROI / Bank Value Assurance — 9-Field Verification Surface + 4 Class Labels + Bank Value Measurement Engine (12×6=72 cells)

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. ROI / Bank Value Assurance Identity

| Field | Value |
|---|---|
| **ROI/value assurance ID** | `RVA-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Verification surface field count** | 9 |
| **Class label count** | 4 (never merge) |
| **Bank Value Measurement Engine** | 12 rows × 6 columns = 72 cells (all UNKNOWN) |
| **Realized ROI claim rule** | NO REALIZED ROI without evidence (see Section 4) |
| **ROI observations to date** | 0 |

## 2. Nine-Field Verification Surface

| # | Field | Purpose |
|---|---|---|
| 1 | `claim_id` | Unique identifier for the ROI/bank-value claim |
| 2 | `claim_text` | The claim being verified (e.g., "the system reduces settlement cost by X%") |
| 3 | `claim_source` | Where the claim was made (markdown file, marketing, etc.) |
| 4 | `claim_class` | OBSERVED_RESULT / MODELED_RESULT / ASSUMPTION / UNKNOWN (never merge) |
| 5 | `claim_evidence_ref` | Pointer to EvidencePackage record (must be STRONG for OBSERVED_RESULT) |
| 6 | `claim_basis` | The basis for the claim (independent quote / model / attestation / none) |
| 7 | `claim_reviewer_recalc` | Reviewer's independent recalculation |
| 8 | `claim_match` | MATCH / MISMATCH / INSUFFICIENT_EVIDENCE |
| 9 | `claim_status` | DESIGNED / VERIFIED / REFUTED / INSUFFICIENT_EVIDENCE |

## 3. Four Class Labels (NEVER MERGE)

| Class | Meaning | Allowed evidence | May merge with |
|---|---|---|---|
| `OBSERVED_RESULT` | The claim was observed in real execution (e.g., pilot run produced the result) | ET-08 (independent recalculation) OR ET-04 (counterparty-signed receipt) | NONE — never merge |
| `MODELED_RESULT` | The claim is the output of a model (e.g., a Monte Carlo simulation) | ET-11 (test output) | NONE — never merge |
| `ASSUMPTION` | The claim is an assumption (e.g., "we assume the rate is X%") | ET-12 or ET-13 (manual attestation, WEAK) | NONE — never merge |
| `UNKNOWN` | The claim cannot be classified (insufficient evidence to classify) | NONE | NONE — never merge |

If any artifact in this room claims a result with merged classes (e.g., "OBSERVED_RESULT and MODELED_RESULT"), the reviewer must issue a CRITICAL finding per `23_finding-classification.md` — this is a class-merge violation (parallel to the F0–F5 finality-merge violation in `12_finality-assurance.md`).

## 4. No Realized ROI Without Evidence

The framework's rule:

> **No file in this room may claim a realized ROI without independent evidence (ET-08 or ET-04).**

This means:
- No file may claim "the system achieved X% ROI" without independent recalculation.
- No file may claim "the system delivered $X in bank value" without an independent counterparty quote.
- Modeled results may be claimed as `MODELED_RESULT` (never `OBSERVED_RESULT`).
- Assumptions may be claimed as `ASSUMPTION` (never `OBSERVED_RESULT` or `MODELED_RESULT`).
- If the reviewer cannot classify a claim, it must be `UNKNOWN` (not silently downgraded).

## 5. Bank Value Measurement Engine (12 rows × 6 columns = 72 cells)

The Bank Value Measurement Engine is a 12-row × 6-column matrix. Each cell must be classified per Section 3.

### 12 Rows (Bank Value Categories)

| # | Row | Description |
|---|---|---|
| 1 | Settlement cost reduction | Reduction in settlement cost vs. baseline |
| 2 | Reconciliation cost reduction | Reduction in reconciliation cost |
| 3 | Failure recovery cost reduction | Reduction in failure recovery cost |
| 4 | Safe-halt response time | Time-to-safe-halt |
| 5 | Capital efficiency | Capital required per unit of throughput |
| 6 | Liquidity efficiency | Liquidity required per unit of throughput |
| 7 | Reserve adequacy | Reserve coverage ratio |
| 8 | Counterparty risk reduction | Counterparty risk mitigation |
| 9 | Audit-trail integrity | Audit-trail completeness |
| 10 | Policy stability | Policy version stability |
| 11 | Finality achievement | Finality achievement rate |
| 12 | Closure efficiency | Time-to-closure |

### 6 Columns (Classification + Verification)

| # | Column | Description |
|---|---|---|
| 1 | Baseline | Baseline value (per Prompt 69: 0/15 baselines populated) |
| 2 | Observed | Observed value (none observed) |
| 3 | Modeled | Modeled value (none modeled) |
| 4 | Assumption | Assumption value (none assumed) |
| 5 | Independent_recalc | Reviewer's recalculation (none performed) |
| 6 | Status | UNKNOWN for all 72 cells |

### 72-Cell Honest State

ALL 72 cells are at status `UNKNOWN`. No cell may be moved to `OBSERVED` without independent evidence.

## 6. Honest-State Markers

- 0 ROI observations.
- 0 Bank Value Measurement Engine cells populated (all 72 = UNKNOWN).
- 0/15 baselines populated.
- All 9 verification fields at state `DESIGNED`.
- All 4 class labels enforced (never merge).
- MTQ DISABLED; F3/F4 NOT_CLAIMED.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
