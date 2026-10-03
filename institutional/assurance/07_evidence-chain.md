# Evidence Chain — EVENT → CONTROL → EVIDENCE → KPI → CONCLUSION

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Evidence Chain Identity

| Field | Value |
|---|---|
| **Chain model ID** | `EC-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Chain state** | `DESIGNED` |
| **Chain stages** | 5 (EVENT → CONTROL → EVIDENCE → KPI → CONCLUSION) |
| **Evidence types** | 13 (see Section 3) |
| **Current population** | 0 evidence records (none collected) |

## 2. The 5-Stage Chain

```
EVENT  →  CONTROL  →  EVIDENCE  →  KPI  →  CONCLUSION
```

| Stage | Question answered | Status |
|---|---|---|
| **EVENT** | What happened in the system? | DESIGNED |
| **CONTROL** | Which control should have caught this event? | DESIGNED |
| **EVIDENCE** | What evidence record was produced? | DESIGNED (0 collected) |
| **KPI** | Which KPI does this evidence populate? | DESIGNED (0/15 baselines) |
| **CONCLUSION** | What conclusion can be drawn from the evidence? | DESIGNED (0 conclusions) |

A conclusion may NOT be drawn without:
- An EVENT that was actually observed.
- A CONTROL that was actually executed.
- An EVIDENCE record that was actually produced.
- A KPI that was actually populated.

The 4 above must all be present. If any is missing, the chain is `INSUFFICIENT_EVIDENCE` and the conclusion must be `NO_CONCLUSION_DRAWN`.

## 3. 13-Type Evidence Taxonomy

| # | Type code | Name | Strength | Status |
|---|---|---|---|---|
| 1 | `ET-01` | System log (immutable, hashed) | STRONG | DESIGNED |
| 2 | `ET-02` | Ledger entry (immutable, hashed) | STRONG | DESIGNED |
| 3 | `ET-03` | Reconciliation output (immutable, hashed) | STRONG | DESIGNED |
| 4 | `ET-04` | Cryptographic receipt (counterparty-signed) | STRONG | DESIGNED |
| 5 | `ET-05` | Settlement workflow state transition (immutable) | STRONG | DESIGNED |
| 6 | `ET-06` | Policy version record (immutable) | STRONG | DESIGNED |
| 7 | `ET-07` | Finality state record (F0/F1/F2/F5 only — F3/F4 NOT_CLAIMED) | STRONG | DESIGNED |
| 8 | `ET-08` | Independent recalculation output (reviewer-generated) | STRONG | DESIGNED |
| 9 | `ET-09` | Replay output (MATCH/MISMATCH/INSUFFICIENT_EVIDENCE) | STRONG | DESIGNED |
| 10 | `ET-10` | System configuration snapshot (frozen at engagement) | MEDIUM | DESIGNED |
| 11 | `ET-11` | Test execution output (scripted, repeatable) | MEDIUM | DESIGNED |
| 12 | `ET-12` | Manual reviewer attestation (reviewer-signed) | **WEAK** | DESIGNED |
| 13 | `ET-13` | Management attestation (management-signed) | **WEAK** | DESIGNED |

## 4. Manual-Attestation-Is-WEAK

`ET-12` (manual reviewer attestation) and `ET-13` (management attestation) are **WEAK** evidence. They may NOT be used to:
- Substitute for an `ET-01..ET-09` (STRONG) record where one would otherwise be required.
- Justify a conclusion that an `OBSERVED_RESULT` was achieved.
- Close a finding without independent retest (per `25_remediation-retest.md`).
- Endorse a value, capital, liquidity, or reserve benefit.

Manual attestation may be used to:
- Document a limitation (per `27_assurance-limitations.md`).
- Record a management response (per `24_management-response.md`).
- Explain why a stronger evidence type was not collectable (e.g., system did not log the event).

Any conclusion that relies solely on `ET-12` or `ET-13` must be labeled `CONCLUSION_BASED_ON_WEAK_EVIDENCE` and is NOT a basis for `OBSERVED_RESULT`.

## 5. Backward-Trace Procedure

When a conclusion is to be drawn, the reviewer must work **backward** through the chain:

1. Identify the **CONCLUSION** being considered (e.g., "KPI X = Y").
2. Identify the **KPI** that the conclusion references.
3. Identify the **EVIDENCE** record(s) that populated the KPI.
   - If the evidence type is `ET-12` or `ET-13`, mark the conclusion `WEAK`.
4. Identify the **CONTROL** that produced the evidence.
   - If the control was not executed (e.g., the system did not run that check), the evidence is `MISSING`.
5. Identify the **EVENT** that triggered the control.
   - If no event was observed, the chain is `INSUFFICIENT_EVIDENCE` and the conclusion must be `NO_CONCLUSION_DRAWN`.
6. Record the full chain in the findings register (per `23_finding-classification.md`).

## 6. Honest-State Markers

- 0 evidence records collected.
- 0 conclusions drawn.
- All 13 evidence types at state `DESIGNED`.
- Manual-attestation rule enforced (ET-12/ET-13 = WEAK; cannot substitute for STRONG).
- MTQ DISABLED; F3/F4 NOT_CLAIMED — no ET-07 record may carry finality_class F3 or F4.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
