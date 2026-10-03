# Transaction Traceability — 12-Field Per-Event Trace Model

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Trace Model Identity

| Field | Value |
|---|---|
| **Trace model ID** | `TRACE-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Trace state** | `DESIGNED` (no traces yet recorded) |
| **Per-event field count** | 12 |
| **Trace chain length** | 12 stages (instruction → closure) |
| **MTQ-disabled trace** | YES — MTQ DISABLED; F3/F4 NOT_CLAIMED; no MTQ-economic event in the trace |

## 2. The 12-Stage Trace Chain

Every transaction traceable by this framework follows this 12-stage chain:

```
instruction → authorization → policy → compliance → funding → routing →
settlement → finality → ledger → reconciliation → exception → closure
```

| Stage | Field in trace record | Status |
|---|---|---|
| 1. Instruction | `instruction_event` | DESIGNED |
| 2. Authorization | `authorization_event` | DESIGNED |
| 3. Policy | `policy_lookup_event` | DESIGNED |
| 4. Compliance | `compliance_check_event` | DESIGNED |
| 5. Funding | `funding_event` | DESIGNED |
| 6. Routing | `routing_event` | DESIGNED |
| 7. Settlement | `settlement_event` | DESIGNED |
| 8. Finality | `finality_event` (F0 / F1 / F2 / F5 only; F3/F4 NOT_CLAIMED) | DESIGNED |
| 9. Ledger | `ledger_posting_event` | DESIGNED |
| 10. Reconciliation | `reconciliation_event` | DESIGNED |
| 11. Exception | `exception_event` (if any) | DESIGNED |
| 12. Closure | `closure_event` | DESIGNED |

## 3. Per-Event 12 Fields

Every event recorded in the trace must carry these 12 fields:

| # | Field | Purpose |
|---|---|---|
| 1 | `event_id` | Unique identifier for the event |
| 2 | `event_type` | One of the 12 stage types |
| 3 | `event_timestamp` | ISO 8601 UTC |
| 4 | `actor_id` | Identifier of the actor (system, user, counterparty) |
| 5 | `actor_role` | Role of the actor (originator, authorizer, settler, etc.) |
| 6 | `input_refs` | Array of upstream event_ids (backward trace) |
| 7 | `output_refs` | Array of downstream event_ids (forward trace) |
| 8 | `state_before` | State of the affected entity before the event |
| 9 | `state_after` | State of the affected entity after the event |
| 10 | `evidence_ref` | Pointer to the EvidencePackage record (13-type taxonomy — see `07_evidence-chain.md`) |
| 11 | `finality_class` | F0 / F1 / F2 / F5 — or `NOT_CLAIMED` for F3/F4 (MTQ disabled) |
| 12 | `integrity_hash` | Hash of fields (1)–(11) for tamper-evidence (see `08_evidence-integrity.md` K-01..K-12) |

## 4. MTQ-Disabled Trace

The trace model is **MTQ-disabled**:
- No event in the trace may claim an MTQ-economic output.
- No event may carry `finality_class = F3` (asset-backed value) or `finality_class = F4` (gated-liquidity value).
- Any event that would require F3 or F4 finality must be marked `finality_class = NOT_CLAIMED` and recorded as a `DESIGNED` event awaiting external evidence.

## 5. 19 BM Steps (Business-Milestone Trace)

The trace model recognizes 19 BM (business milestone) steps from instruction to closure. These steps are the canonical milestones used by the trace-reconstruction procedure (Section 6 below).

| # | BM step | Trace stage(s) | Status |
|---|---|---|---|
| BM-01 | Instruction received | instruction | DESIGNED |
| BM-02 | Policy lookup | policy | DESIGNED |
| BM-03 | Compliance gate | compliance | DESIGNED |
| BM-04 | Authorization decision | authorization | DESIGNED |
| BM-05 | Funding authorization | funding | DESIGNED |
| BM-06 | Routing decision | routing | DESIGNED |
| BM-07 | Settlement initiation | settlement | DESIGNED |
| BM-08 | Counterparty confirmation | settlement | DESIGNED |
| BM-09 | Settlement completion | settlement | DESIGNED |
| BM-10 | F0 authorization finality | finality (F0) | DESIGNED |
| BM-11 | F1 ledger finality | finality (F1) | DESIGNED |
| BM-12 | F2 reconciliation finality | finality (F2) | DESIGNED |
| BM-13 | F5 settlement finality (legal dependency) | finality (F5) | DESIGNED |
| BM-14 | Ledger posting | ledger | DESIGNED |
| BM-15 | Reconciliation run | reconciliation | DESIGNED |
| BM-16A | Exception raised | exception | DESIGNED |
| BM-16B | Exception resolved | exception | DESIGNED |
| BM-17 | Closure authorized | closure | DESIGNED |
| BM-18 | Closure recorded | closure | DESIGNED |
| BM-19 | Audit trail sealed | closure | DESIGNED |

Note: BM-15/BM-16A/BM-16B per Prompt 74 finding 12_finality-mint-audit are UNKNOWN at runtime (settlement-workflow-canonical.ts MISSING); however, the **trace model for these steps is DESIGNED** even though runtime evidence is absent.

## 6. Trace Reconstruction Procedure

When the trace record for a transaction is incomplete (e.g., some events missing), the reviewer must follow this procedure:

1. Identify the missing events by comparing observed events to the 12-stage chain.
2. For each missing event, search the evidence room for evidence records that would have produced the event.
3. If evidence is found, reconstruct the event and mark it `RECONSTRUCTED_FROM_EVIDENCE` (NOT `OBSERVED`).
4. If evidence is not found, mark the event `MISSING` and issue a finding per `23_finding-classification.md`.
5. NEVER mark a reconstructed event as `OBSERVED`.
6. NEVER merge `RECONSTRUCTED` and `OBSERVED` event classes (parallel to the no-merge rule in `20_roi-value-assurance.md`).

## 7. Honest-State Markers

- 0 traces recorded.
- 0 events captured.
- All 19 BM steps at state `DESIGNED`.
- MTQ DISABLED; F3/F4 NOT_CLAIMED.
- No transaction has been executed end-to-end through this trace model.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
