# Replay Protocol — 8 Reproducibility Targets (L-01..L-08)

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Replay Protocol Identity

| Field | Value |
|---|---|
| **Protocol ID** | `RP-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Protocol state** | `DESIGNED` |
| **Reproducibility target count** | 8 (L-01..L-08) |
| **Replay output states** | 3 (MATCH / MISMATCH / INSUFFICIENT_EVIDENCE) |
| **Determinism** | REQUIRED — non-deterministic replay is a finding |
| **Replays executed to date** | 0 |

## 2. Eight Reproducibility Targets

| # | Target ID | Name | Required reproducibility | Status |
|---|---|---|---|---|
| 1 | L-01 | Authorization decision replay | Same authorization inputs → same authorization output | DESIGNED |
| 2 | L-02 | Policy lookup replay | Same policy version + same inputs → same policy output | DESIGNED |
| 3 | L-03 | Compliance check replay | Same inputs → same compliance decision | DESIGNED |
| 4 | L-04 | Routing decision replay | Same inputs → same routing decision | DESIGNED |
| 5 | L-05 | Settlement workflow replay | Same workflow inputs → same state transitions | DESIGNED |
| 6 | L-06 | Finality state replay | Same inputs → same finality state (F0/F1/F2/F5; F3/F4 NOT_CLAIMED — MTQ DISABLED) | DESIGNED |
| 7 | L-07 | Ledger posting replay | Same inputs → same ledger entries (hash-equal) | DESIGNED |
| 8 | L-08 | Reconciliation replay | Same inputs → same reconciliation output (within tolerance — see `13_reconciliation-assurance.md`) | DESIGNED |

## 3. Replay Inputs

Each replay requires:
- The original event record (from the trace — see `06_transaction-traceability.md`).
- The frozen schema versions at the time of original execution ( Prompt 74: 9 of 10 frozen schemas MISSING; replay will report `INSUFFICIENT_EVIDENCE` for events that would have required those schemas).
- The input data used by the original event (per the 12-field trace record).
- The control configuration at the time of original execution.

## 4. Replay Output — Exactly 3 States

The replay tool must produce one of exactly three outputs:

| State | Meaning | Action |
|---|---|---|
| `MATCH` | The replayed output is identical to the originally recorded output | Record as ET-09 evidence (STRONG) |
| `MISMATCH` | The replayed output differs from the originally recorded output | Issue a finding per `23_finding-classification.md` (typically CRITICAL or HIGH) |
| `INSUFFICIENT_EVIDENCE` | The replay cannot be performed (missing schema, missing input, missing config) | Record as a limitation per `27_assurance-limitations.md` AND an open issue per `29_open-issues.md` |

The tool must NOT produce a fourth output. The tool must NOT mark a mismatch as a match. The tool must NOT silently downgrade `INSUFFICIENT_EVIDENCE` to `MATCH`.

## 5. Replay Tool Specification

| Field | Value |
|---|---|
| **Tool name** | Replay Tool (canonical spec — see `assurance-replay-specification.md`) |
| **Tool state** | DESIGNED — no tool implemented; only the specification is in this room |
| **Determinism** | REQUIRED — non-deterministic replay is a finding (CRITICAL) |
| **Input format** | JSON per 12-field trace record |
| **Output format** | JSON with `output_state`, `expected_output`, `actual_output`, `match_score` (0.0–1.0; 1.0 = MATCH, 0.0 = MISMATCH; absent = INSUFFICIENT_EVIDENCE) |
| **Logging** | Every replay attempt logged (per integrity controls K-01..K-12 in `08_evidence-integrity.md`) |
| **Access level** | INTERNAL (not PUBLIC; not RESTRICTED) |

## 6. Determinism Required

Determinism is REQUIRED for every reproducibility target. Any non-deterministic replay is a CRITICAL finding.

Determinism means: **given identical inputs (event record, schema versions, input data, control configuration), the replayed output must be byte-identical to the originally recorded output** (within hash equality; for floating-point, within tolerance per `13_reconciliation-assurance.md`).

## 7. Honest-State Markers

- 0 replays executed.
- 0 MATCH outputs.
- 0 MISMATCH outputs.
- 0 INSUFFICIENT_EVIDENCE outputs.
- All 8 reproducibility targets at state `DESIGNED`.
- Determinism contract specified but not yet tested.
- Replay tool specified but not implemented.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
