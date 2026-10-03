# Assurance Evidence Index — 13-Type Taxonomy + Per-Domain Expected Evidence + 0 Population + 4 Stores + 3 Access Levels (FROZEN)

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Evidence Index Identity

| Field | Value |
|---|---|
| **Evidence index ID** | `EIX-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Evidence type taxonomy** | 13 (per `07_evidence-chain.md`) |
| **Per-domain expected evidence** | YES — see Section 3 |
| **Current population** | 0 evidence records (none collected) |
| **Evidence store count** | 4 (see Section 4) |
| **Access level count** | 3 (see Section 5) — FROZEN |
| **Evidence records collected to date** | 0 |

## 2. 13-Type Evidence Taxonomy (recap)

Per `07_evidence-chain.md` Section 3, the 13 evidence types are ET-01..ET-13. ET-01..ET-09 are STRONG; ET-10 and ET-11 are MEDIUM; ET-12 and ET-13 are WEAK.

## 3. Per-Domain Expected Evidence

For each of the 23 in-scope domains (per `02_scope-and-boundaries.md` Section 2), the expected evidence types are:

| # | Domain | Expected evidence types | Status |
|---|---|---|---|
| 1 | Policy registry & versioning | ET-06 (primary); ET-09 (replay) | 0 collected |
| 2 | Authorization & transaction lifecycle | ET-01 (log); ET-07 (finality); ET-09 (replay) | 0 collected |
| 3 | Finality | ET-02 (ledger); ET-03 (recon); ET-04 (receipt); ET-07 (finality state) | 0 collected |
| 4 | Reconciliation & exception | ET-03 (recon); ET-09 (replay); ET-12 (attestation, WEAK only for closure) | 0 collected |
| 5 | Settlement workflow | ET-05 (state transitions); ET-04 (receipt) | 0 collected |
| 6 | Reserve domains | ET-01 (log); ET-09 (replay) | 0 collected |
| 7 | Settlement obligation registry | ET-06 (policy version); ET-04 (counterparty receipt) | 0 collected |
| 8 | Pilot gate framework | ET-01 (log); ET-11 (test execution) | 0 collected |
| 9 | MTQ economics | NONE — MTQ DISABLED; F3/F4 NOT_CLAIMED; no evidence collected | 0 collected |
| 10 | Architecture freeze | ET-10 (configuration snapshot) | 0 collected |
| 11 | Evidence fabric (EvidencePackage) | ET-01..ET-13 (this domain produces evidence FOR other domains) | 0 collected |
| 12 | Final pilot activation gate | ET-01 (log); ET-11 (test execution) | 0 collected |
| 13 | Security (18 areas) | ET-11 (test execution); ET-12 (reviewer attestation, WEAK) | 0 collected |
| 14 | Change management | ET-01 (log); ET-10 (configuration snapshot) | 0 collected |
| 15 | Failure scenarios | ET-11 (test execution); ET-09 (replay); ET-12 (reviewer attestation) | 0 collected |
| 16 | Safe halt | ET-01 (log); ET-07 (finality state); ET-09 (replay) | 0 collected |
| 17 | Liquidity measurement | ET-08 (independent recalculation); ET-04 (counterparty receipt) | 0 collected |
| 18 | KPI population | ET-08 (independent recalculation); ET-09 (replay) | 0 collected |
| 19 | ROI / Bank Value | ET-08 (independent recalculation); ET-04 (counterparty receipt) | 0 collected |
| 20 | Bank validation | ET-04 (counterparty-signed receipt); ET-12 (attestation, WEAK only for attendance — NOT for validation) | 0 collected |
| 21 | Replay & reproducibility | ET-09 (replay output) | 0 collected |
| 22 | Sampling methodology | ET-11 (test execution); ET-12 (attestation, WEAK) | 0 collected |
| 23 | Findings, response, remediation, retest | ET-08 (independent recalculation); ET-09 (replay); ET-12/ET-13 (attestations, WEAK only for management response) | 0 collected |

## 4. Four Evidence Stores

Evidence is stored in 4 stores:

| # | Store | Contents | Status |
|---|---|---|---|
| 1 | Evidence Ledger | All ET-01..ET-09 STRONG evidence (append-only per K-04) | DESIGNED — empty |
| 2 | Configuration Snapshot Store | All ET-10 (MEDIUM) configuration snapshots | DESIGNED — empty |
| 3 | Test Execution Store | All ET-11 (MEDIUM) test execution outputs | DESIGNED — empty |
| 4 | Attestation Store | All ET-12 and ET-13 (WEAK) attestations | DESIGNED — empty |

All 4 stores are at state `DESIGNED`. None contains any records.

## 5. Three Access Levels (FROZEN)

| # | Level | Who can read | Who can write | Status |
|---|---|---|---|---|
| 1 | PUBLIC | Anyone (after redaction) | NOBODY (only redacted summaries released publicly) | FROZEN — no public release yet |
| 2 | INTERNAL | Framework owner + reviewer + engineering | Reviewer (with audit log per K-10) | FROZEN — no internal access yet (no engagement) |
| 3 | RESTRICTED | Framework owner + lead reviewer only | Lead reviewer only (with separation of duties per K-05) | FROZEN — no restricted access yet |

Access levels are FROZEN at design state. No access has been granted to any party. The 3-level model is specified but not yet operational.

## 6. Honest-State Markers

- 0 evidence records collected.
- 0 evidence types populated.
- 0/23 domains have any evidence.
- 0/4 stores contain any records.
- 0/3 access levels granted.
- All 13 evidence types at state `DESIGNED`.
- All 23 domains' expected evidence at state `DESIGNED`.
- All 4 stores at state `DESIGNED`.
- All 3 access levels FROZEN.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
