# Assurance Replay Specification — ARS-PA-001

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Replay Specification Identity

| Field | Value |
|---|---|
| **Spec ID** | `ARS-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Companion file** | `09_replay-protocol.md` |
| **State** | `DESIGNED` |
| **Determinism contract** | REQUIRED — see Section 3 |
| **Reproducibility targets** | 8 (L-01..L-08) |
| **Sampling follows** | Census for small populations; purposive otherwise (per `22_sampling-methodology.md`) |
| **Replays executed to date** | 0 |

## 2. Determinism Contract

> **Given identical inputs (event record, schema versions, input data, control configuration), the replayed output must be byte-identical to the originally recorded output (within tolerance for floating-point per `13_reconciliation-assurance.md`).**

Determinism is REQUIRED. Any non-deterministic replay is a CRITICAL finding.

The determinism contract applies to all 8 reproducibility targets (L-01..L-08) per `09_replay-protocol.md`.

## 3. Input Schema

| Field | Type | Required | Purpose |
|---|---|---|---|
| `event_id` | string (UUID) | YES | Identifier of the event to replay |
| `event_type` | enum (12 stage types per `06_transaction-traceability.md`) | YES | Stage type |
| `frozen_schema_versions` | object | YES | Map of schema_id → version for each frozen schema at the time of original execution |
| `input_data` | object | YES | The 12-field trace record (per `06_transaction-traceability.md` Section 3) |
| `control_configuration` | object | YES | The control configuration at the time of original execution (policies, compliance rules, etc.) |
| `expected_output` | object | YES | The originally recorded output |

## 4. Output Schema

| Field | Type | Required | Purpose |
|---|---|---|---|
| `output_state` | enum (MATCH / MISMATCH / INSUFFICIENT_EVIDENCE) | YES | The replay result |
| `expected_output` | object | YES | The expected output (echoed from input) |
| `actual_output` | object | CONDITIONAL | Required if `output_state` ∈ {MATCH, MISMATCH}; absent if INSUFFICIENT_EVIDENCE |
| `match_score` | number (0.0–1.0) | CONDITIONAL | 1.0 = MATCH; 0.0 = MISMATCH; absent if INSUFFICIENT_EVIDENCE |
| `insufficient_evidence_reason` | string | CONDITIONAL | Required if `output_state = INSUFFICIENT_EVIDENCE`; describes why replay could not be performed |
| `replay_log_ref` | string | YES | Pointer to the replay log (per integrity control K-10) |

## 5. Eight Reproducibility Targets (L-01..L-08)

Per `09_replay-protocol.md` Section 2. All 8 targets are at state `DESIGNED`. None has been replayed.

## 6. Sampling Follows Census / Purposive

For small populations (N ≤ 30, per `22_sampling-methodology.md` Section 4):
- Replay sampling is CENSUS (replay every event).
- No statistical inference is drawn from replay outcomes.
- A replay mismatch is reported as a finding (per `23_finding-classification.md`), not as a statistical confidence.

For larger populations:
- Replay sampling is PURPOSIVE (select specific events based on risk, e.g., high-value transactions, edge cases).
- Replay outcomes are non-statistical even for larger populations.

## 7. Replay Tool Specification

| Field | Value |
|---|---|
| **Tool name** | Assurance Replay Tool (canonical) |
| **Tool state** | DESIGNED — not implemented |
| **Determinism** | REQUIRED (per Section 2) |
| **Input format** | JSON per Section 3 |
| **Output format** | JSON per Section 4 |
| **Logging** | Every replay attempt logged (per integrity controls K-01..K-12) |
| **Access level** | INTERNAL |
| **Tool tests executed to date** | 0 |

## 8. Honest-State Markers

- 0 replays executed.
- 0 MATCH / 0 MISMATCH / 0 INSUFFICIENT_EVIDENCE outputs.
- All 8 reproducibility targets at state `DESIGNED`.
- Tool at state `DESIGNED` (not implemented).
- Determinism contract specified but not tested.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
