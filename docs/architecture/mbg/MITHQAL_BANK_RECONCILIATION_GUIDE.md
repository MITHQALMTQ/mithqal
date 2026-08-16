# MITHQAL Bank Reconciliation Guide

> **File:** MITHQAL_BANK_RECONCILIATION_GUIDE.md
> **Task ID:** MBG-DOCUMENTATION
> **Source module:** `src/lib/mithqal-bank-gateway.ts` (§11 AccountingReconciliationAdapter, §12 BankMTQSubledger, §13 Five-Way Reconciliation, §15 MTQ Status Events)
> **Document version:** v25.0-mbg-amendment-1.0
> **Honest state declaration:** **INTEGRATION-READY — 0 banks contracted.**
> **Canonical principle:** *"TRANSLATION, NOT TRANSFORMATION."*

---

## Table of Contents

1. [Reconciliation Philosophy — Canonical Ledger = Bank Subledger = Cryptographic Attestation](#1-reconciliation-philosophy--canonical-ledger--bank-subledger--cryptographic-attestation)
2. [BankMTQSubledger Architecture (Per-Bank Aggregate + Per-Corporate Positions)](#2-bankmtqsubledger-architecture-per-bank-aggregate--per-corporate-positions)
3. [The 5-Way Reconciliation Model (§13)](#3-the-5-way-reconciliation-model-13)
4. [5 Reconciliation States (RECONCILED / WARNING / MISMATCH / CRITICAL / LOCKED)](#4-5-reconciliation-states-reconciled--warning--mismatch--critical--locked)
5. [Reconciliation Cadence (Real-Time / Hourly / Daily / Weekly)](#5-reconciliation-cadence-real-time--hourly--daily--weekly)
6. [AccountingReconciliationAdapter — MITHQAL State → Bank-Compatible Accounting References](#6-accountingreconciliationadapter--mithqal-state--bank-compatible-accounting-references)
7. [Bank Transaction Reference Mapping (bankTransactionReference ↔ mtqSettlementId)](#7-bank-transaction-reference-mapping-banktransactionreference--mtqsettlementid)
8. [FX Reference Reconciliation (fxReference ↔ mtqPosition)](#8-fx-reference-reconciliation-fxreference--mtqposition)
9. [Reserve Reference Reconciliation (reserveReference ↔ mtqAmount)](#9-reserve-reference-reconciliation-reservereference--mtqamount)
10. [Mismatch Handling (Alert / Restrict / Forensic / Preserve Audit / Escalate)](#10-mismatch-handling-alert--restrict--forensic--preserve-audit--escalate)
11. [Reconciliation Reporting (Dashboard / Alerts / Audit Trail)](#11-reconciliation-reporting-dashboard--alerts--audit-trail)
12. [MITHQAL MUST NOT Dictate the Bank's Chart of Accounts](#12-mithqal-must-not-dictate-the-banks-chart-of-accounts)
13. [Honest State — Reconciliation Logic INTEGRATION-READY, No Real-Bank Reconciliation Yet](#13-honest-state--reconciliation-logic-integration-ready-no-real-bank-reconciliation-yet)

---

## 1. Reconciliation Philosophy — Canonical Ledger = Bank Subledger = Cryptographic Attestation

### 1.1 The Reconciliation Equation

The MBG reconciliation architecture rests on a single equation:

```
Canonical Ledger  =  Bank Subledger  =  Corporate Positions  =  Reserve Ledger  =  Proof-of-Liabilities
       (1)                (2)                (3)                    (4)                  (5)
```

If all 5 totals match exactly (deltaBps = 0), the system is `RECONCILED`. If any one diverges, the system is in `WARNING`, `MISMATCH`, `CRITICAL`, or `LOCKED` depending on the magnitude of divergence.

### 1.2 Why 5-Way (Not 3-Way or 2-Way)

| Reconciliation model | What it catches | What it misses |
|---|---|---|
| 2-way (canonical ↔ bank subledger) | Bank subledger drift | Corporate positions, reserve ledger, proof-of-liabilities drift |
| 3-way (canonical ↔ bank subledger ↔ corporate positions) | Corporate position drift | Reserve ledger, proof-of-liabilities drift |
| 5-way (canonical ↔ bank subledger ↔ corporate positions ↔ reserve ledger ↔ proof-of-liabilities) | All 5 forms of drift | Nothing |

The 5-way reconciliation is the canonical MITHQAL model. It catches:

- **Canonical ledger drift** — unauthorized minting, supply inconsistency (per Theorem S1 / S2 / S3 of `canonical-supply-ledger.ts`).
- **Bank subledger drift** — bank's record of corporate positions diverges from canonical.
- **Corporate positions drift** — individual corporate positions diverge from bank subledger.
- **Reserve ledger drift** — reserve liability diverges from canonical supply (S × PAR ratio).
- **Proof-of-liabilities drift** — proof-of-liabilities commitment diverges from actual liabilities.

### 1.3 The Cryptographic Attestation Layer

Each of the 5 totals is signed:

1. **Canonical ledger total** — signed by MITHQAL canonical ledger attestation key.
2. **Bank subledger total** — signed by bank's attestation key (`BankMTQSubledger.cryptographicAttestation`).
3. **Corporate positions total** — signed by bank's attestation key (sum of `BankLinkedCorporateMTQAccount.mtqPosition`).
4. **Reserve ledger total** — signed by MITHQAL reserve engine attestation key.
5. **Proof-of-liabilities total** — signed by proof-of-liabilities commitment key.

The 5-way reconciliation is therefore not just a numeric match — it's a **cryptographic** match. Each side attests to its total; the reconciliation verifies that all 5 attestations agree.

### 1.4 The Reconciliation Philosophy Statement

> *"Canonical Ledger = Bank Subledger = Cryptographic Attestation."*

This is not a marketing claim — it's an enforced invariant. The `runFiveWayReconciliation(input)` function returns `RECONCILED` only when all 5 totals match exactly (deltaBps = 0). Any deviation triggers the incident response matrix (§10 of this document).

---

## 2. BankMTQSubledger Architecture (Per-Bank Aggregate + Per-Corporate Positions)

### 2.1 The BankMTQSubledger Interface

```typescript
export interface BankMTQSubledger {
  bankId: string;
  corporatePositions: Array<{
    corporateReference: string;        // pseudonymous
    mtqPosition: number;
    lastUpdated: string;
  }>;
  aggregateMTQPosition: number;          // bank's net MTQ position
  cryptographicAttestation: string;      // bank's signed statement of accuracy
  lastReconciledAt: string;
}
```

### 2.2 The Two Levels of the Subledger

The subledger has two levels:

1. **Per-corporate positions** — one entry per corporate customer, recording that corporate's MTQ position.
2. **Aggregate MTQ position** — the sum of all corporate positions; the bank's net MTQ position.

### 2.3 The Aggregation Rule

```
aggregateMTQPosition = Σ corporatePositions[].mtqPosition
```

The aggregate is the sum of per-corporate positions. If the aggregate does not equal the sum of per-corporate positions, the subledger itself is internally inconsistent — a `MISMATCH` that triggers investigation.

### 2.4 The Cryptographic Attestation

Each `BankMTQSubledger` carries a `cryptographicAttestation` — the bank's signed statement that the subledger is accurate as of `lastReconciledAt`.

The attestation covers:

- `bankId`
- All `corporatePositions` (pseudonymous references + positions + lastUpdated timestamps)
- `aggregateMTQPosition`
- `lastReconciledAt`

The signature is generated by the bank's attestation key (held in bank HSM / MPC). MITHQAL verifies the signature against the bank's registered public key fingerprint.

### 2.5 The Reconciliation Cadence

The subledger is reconciled against the MITHQAL canonical ledger:

- **Real-time (per-transaction)** — every settled MTQ transaction updates the subledger immediately.
- **Hourly (batch)** — the bank runs an hourly batch reconciliation to catch any drift.
- **Daily (full)** — the bank runs a full daily reconciliation at end-of-day.
- **Weekly (audit)** — the bank + MITHQAL jointly run a weekly audit reconciliation.

(See §5 of this document for cadence details.)

### 2.6 What the Subledger Is NOT

| Misreading | Truth |
|---|---|
| The bank's authoritative ledger for MTQ | Yes — the bank's subledger is the bank's authoritative record. |
| The MITHQAL canonical ledger | No — the MITHQAL canonical ledger is separate; the bank's subledger is reconciled against it. |
| A copy of the canonical ledger | No — the subledger is the bank's own record, signed by the bank. |
| The corporate's record | No — the corporate sees its position through the bank's corporate portal (per `BankLinkedCorporateMTQAccount`, §9 of source). |

---

## 3. The 5-Way Reconciliation Model (§13)

### 3.1 The FiveWayReconciliationReport

```typescript
export interface FiveWayReconciliationReport {
  canonicalLedgerTotal: number;
  bankSubledgerTotal: number;
  corporatePositionsTotal: number;
  reserveLedgerTotal: number;
  proofOfLiabilitiesTotal: number;
  status: FiveWayReconciliationStatus;
  mismatches: ReconciliationMismatch[];
  timestamp: string;
  toleranceBps: number;             // basis points tolerance for WARNING threshold
  criticalThresholdBps: number;
}
```

### 3.2 The 5 Totals

| # | Total | Source | Signer |
|---|---|---|---|
| 1 | `canonicalLedgerTotal` | MITHQAL canonical MTQ supply ledger | MITHQAL canonical ledger attestation key |
| 2 | `bankSubledgerTotal` | Sum of all bank subledgers | Each bank's attestation key |
| 3 | `corporatePositionsTotal` | Sum of all corporate positions across all banks | Each bank's attestation key |
| 4 | `reserveLedgerTotal` | Reserve liability (S × PAR) | MITHQAL reserve engine attestation key |
| 5 | `proofOfLiabilitiesTotal` | Proof-of-liabilities commitment | Proof-of-liabilities commitment key |

### 3.3 The Reconciliation Function

```typescript
export function runFiveWayReconciliation(input: {
  canonicalLedgerTotal: number;
  bankSubledgerTotal: number;
  corporatePositionsTotal: number;
  reserveLedgerTotal: number;
  proofOfLiabilitiesTotal: number;
  toleranceBps?: number;
  criticalThresholdBps?: number;
}): FiveWayReconciliationReport {
  const toleranceBps = input.toleranceBps ?? 1;       // 0.01%
  const criticalThresholdBps = input.criticalThresholdBps ?? 100; // 1%

  const totals = [
    { ledger: "CANONICAL", actual: input.canonicalLedgerTotal },
    { ledger: "BANK_SUBLEDGER", actual: input.bankSubledgerTotal },
    { ledger: "CORPORATE_POSITIONS", actual: input.corporatePositionsTotal },
    { ledger: "RESERVE_LEDGER", actual: input.reserveLedgerTotal },
    { ledger: "PROOF_OF_LIABILITIES", actual: input.proofOfLiabilitiesTotal },
  ];

  const reference = input.canonicalLedgerTotal;
  const mismatches: ReconciliationMismatch[] = [];

  for (const t of totals) {
    if (reference === 0) {
      // Edge case: zero canonical supply (still pre-pilot). All must be 0.
      if (t.actual !== 0) {
        mismatches.push({
          ledger: t.ledger,
          expected: 0,
          actual: t.actual,
          deltaBps: Number.POSITIVE_INFINITY,
          severity: "CRITICAL",
          investigationStatus: "OPEN",
        });
      }
      continue;
    }
    const deltaBps = Math.abs(((t.actual - reference) / reference) * 10000);
    if (deltaBps === 0) continue;
    const severity =
      deltaBps >= criticalThresholdBps
        ? "CRITICAL"
        : deltaBps > toleranceBps
          ? "MISMATCH"
          : "WARNING";
    if (severity === "WARNING" && t.ledger === "CANONICAL") continue;
    mismatches.push({
      ledger: t.ledger,
      expected: reference,
      actual: t.actual,
      deltaBps,
      severity,
      investigationStatus: "OPEN",
    });
  }

  // ... status determination ...
}
```

### 3.4 The Status Determination Logic

```
hasCritical = mismatches.some(m => m.severity === "CRITICAL")
hasMismatch = mismatches.some(m => m.severity === "MISMATCH")
hasWarning  = mismatches.some(m => m.severity === "WARNING")

status = hasCritical ? "CRITICAL"
       : hasMismatch ? "MISMATCH"
       : hasWarning   ? "WARNING"
       :                "RECONCILED"
```

The status escalates monotonically: any `CRITICAL` mismatch makes the whole report `CRITICAL`; otherwise any `MISMATCH` makes it `MISMATCH`; otherwise any `WARNING` makes it `WARNING`; otherwise `RECONCILED`.

### 3.5 The Tolerance Thresholds

| Threshold | Default value | Meaning |
|---|---|---|
| `toleranceBps` | 1 (0.01%) | Within this tolerance → `WARNING` |
| `criticalThresholdBps` | 100 (1%) | Beyond this threshold → `CRITICAL` |
| Between (1bp - 100bp) | — | `MISMATCH` |

### 3.6 The Edge Case: Zero Canonical Supply

When `canonicalLedgerTotal = 0` (still pre-pilot — no MTQ has been issued), all 5 totals must be 0. Any non-zero total is `CRITICAL` (deltaBps = Infinity).

The current `HONEST_STATE` confirms: 0 banks contracted, 0 real bank integrations. The baseline reconciliation runs with all 5 totals = 0, status = `RECONCILED`.

### 3.7 ReconciliationMismatch

```typescript
export interface ReconciliationMismatch {
  ledger: "CANONICAL" | "BANK_SUBLEDGER" | "CORPORATE_POSITIONS" | "RESERVE_LEDGER" | "PROOF_OF_LIABILITIES";
  expected: number;
  actual: number;
  deltaBps: number;
  severity: "WARNING" | "MISMATCH" | "CRITICAL";
  investigationStatus: "OPEN" | "INVESTIGATING" | "RESOLVED" | "ESCALATED";
}
```

Each mismatch identifies:

- Which ledger diverged.
- What was expected (the canonical reference).
- What was actual.
- The divergence in basis points.
- The severity.
- The investigation status (open → investigating → resolved or escalated).

---

## 4. 5 Reconciliation States (RECONCILED / WARNING / MISMATCH / CRITICAL / LOCKED)

### 4.1 The FiveWayReconciliationStatus Type

```typescript
export type FiveWayReconciliationStatus =
  | "RECONCILED"
  | "WARNING"
  | "MISMATCH"
  | "CRITICAL"
  | "LOCKED";
```

### 4.2 State Definitions

| State | Definition | Trigger | Action |
|---|---|---|---|
| `RECONCILED` | All 5 totals match exactly (deltaBps = 0). | No mismatches. | Continue normal operations. |
| `WARNING` | At least one total diverges within tolerance (deltaBps ≤ 1bp). | Any `WARNING`-severity mismatch. | Continue operations with heightened monitoring; auto-open investigation ticket. |
| `MISMATCH` | At least one total diverges beyond tolerance (1bp < deltaBps ≤ 100bp). | Any `MISMATCH`-severity mismatch. | RESTRICT affected operations; auto-escalate within 1 hour; preserve forensic evidence. |
| `CRITICAL` | At least one total diverges beyond critical threshold (deltaBps > 100bp). | Any `CRITICAL`-severity mismatch. | SUSPEND all settlement operations; immediate page; manual controlled recovery only. |
| `LOCKED` | Operations suspended pending manual recovery. | `CRITICAL` not resolved + manual intervention. | Operations remain SUSPENDED; 4-of-7 Council + bank lead signoff required to RESTORE. |

### 4.3 State Transitions

```
+-------------+    WARNING     +-------------+    MISMATCH    +-------------+    CRITICAL    +-------------+    manual    +--------+
| RECONCILED  | ------------> |   WARNING   | -------------> |   MISMATCH  | -------------> |  CRITICAL  | ----------> | LOCKED |
+-------------+               +-------------+                +-------------+                +-------------+             +--------+
       ^                           |                               |                              |                          |
       |                           | resolve                       | resolve                      | resolve                  | RESTORE
       |                           v                               v                              v                          v
       +---------------------------+-------------------------------+------------------------------+--------------------------+
                                   (4-of-7 Council + bank lead signoff for LOCKED → RECONCILED)
```

### 4.4 The RECONCILED State

- All 5 totals match exactly (deltaBps = 0).
- No mismatches in the report.
- Settlement operations continue normally.
- No action required.

### 4.5 The WARNING State

- At least one total diverges within tolerance (deltaBps ≤ 1bp).
- Severity = `WARNING`.
- Actions:
  1. Continue settlement operations with heightened monitoring.
  2. Auto-open investigation ticket against each `WARNING` mismatch.
  3. Notify bank ops + MITHQAL ops within 4 hours.
  4. Next reconciliation cycle re-checks the same ledgers.

### 4.6 The MISMATCH State

- At least one total diverges beyond tolerance (1bp < deltaBps ≤ 100bp).
- Severity = `MISMATCH`.
- Actions:
  1. RESTRICT affected operations (issuance OR redemption OR settlement).
  2. Auto-escalate to bank ops + MITHQAL ops within 1 hour.
  3. Preserve forensic evidence (signed snapshots of all 5 ledgers).
  4. Investigation ticket required; resolution before RESTORE.

### 4.7 The CRITICAL State

- At least one total diverges beyond critical threshold (deltaBps > 100bp).
- Severity = `CRITICAL`.
- Actions:
  1. SUSPEND all settlement operations (gate moves to `LOCKED`).
  2. Immediate page bank ops lead + MITHQAL ops lead.
  3. Forensic evidence preservation (immutable snapshots).
  4. Manual controlled recovery only — no automated RESTORE.
  5. Regulatory notification where required by law.

### 4.8 The LOCKED State

- Operations remain SUSPENDED pending manual recovery.
- Only 4-of-7 Council + bank lead signoff can RESTORE.
- All instructions received during LOCKED state are queued, NOT executed.
- After RESTORE, re-run reconciliation; only RESUME if RECONCILED.

### 4.9 RESTORE Authority

Restoring from `LOCKED` to `RECONCILED` requires:

- 4-of-7 Council signoff.
- Bank lead signoff.
- Re-run reconciliation; only RESUME if `RECONCILED`.

This is the highest-friction restoration in the MBG architecture. It exists to prevent premature restoration from a critical reconciliation failure.

---

## 5. Reconciliation Cadence (Real-Time / Hourly / Daily / Weekly)

### 5.1 The Four Cadences

| Cadence | Frequency | What it reconciles | Severity threshold |
|---|---|---|---|
| Real-time | Per transaction | Single transaction's effect on bank subledger + corporate position | `MISMATCH` triggers immediate restrict |
| Hourly batch | Every hour | Hourly cumulative totals across bank subledger + canonical | `MISMATCH` triggers restrict; `CRITICAL` triggers suspend |
| Daily full | End-of-day (bank-local time) | Full 5-way reconciliation (canonical / bank / corporate / reserve / proof-of-liabilities) | Any non-`RECONCILED` triggers restrict; `CRITICAL` triggers suspend |
| Weekly audit | Once per week | Joint bank + MITHQAL audit reconciliation; signed by both sides | Any non-`RECONCILED` triggers restrict + escalation |

### 5.2 Real-Time Per-Transaction Reconciliation

Every settled MTQ transaction triggers an immediate reconciliation:

1. The bank's `BankMTQSubledger.corporatePositions[].mtqPosition` is updated for the affected corporate.
2. The bank's `BankMTQSubledger.aggregateMTQPosition` is updated.
3. The MITHQAL canonical ledger total is updated.
4. The corporate's `BankLinkedCorporateMTQAccount.mtqPosition` is updated.
5. A `WARNING`-level mismatch check runs: if `corporatePosition != bankSubledger.corporatePositions[i].mtqPosition`, a `WARNING` ticket opens.

This real-time reconciliation catches intra-transaction drift — if a transaction's effect on the bank's subledger diverges from its effect on the corporate's position, the system catches it immediately.

### 5.3 Hourly Batch Reconciliation

Every hour, the bank runs a batch reconciliation:

1. Sum all corporate positions: `Σ BankLinkedCorporateMTQAccount.mtqPosition`.
2. Compare to `BankMTQSubledger.aggregateMTQPosition`.
3. If divergent beyond tolerance, open `MISMATCH` ticket.

This catches drift that accumulates across multiple transactions within an hour.

### 5.4 Daily Full Reconciliation

At end-of-day (bank-local time), the bank runs the full 5-way reconciliation:

1. `canonicalLedgerTotal` — query MITHQAL canonical ledger.
2. `bankSubledgerTotal` — sum of all bank's MTQ positions.
3. `corporatePositionsTotal` — sum of all corporate MTQ positions held by the bank.
4. `reserveLedgerTotal` — query MITHQAL reserve engine.
5. `proofOfLiabilitiesTotal` — query proof-of-liabilities commitment.

`runFiveWayReconciliation(input)` is called with all 5 totals. The returned status determines the next day's operations.

### 5.5 Weekly Audit Reconciliation

Once per week, the bank + MITHQAL jointly run an audit reconciliation:

1. Both sides sign the 5 totals.
2. The signatures are compared.
3. Any signature mismatch triggers immediate investigation.
4. The signed reconciliation report is archived for regulatory retention (7 years).

### 5.6 The Cadence Decision Tree

```
Per-transaction
  └── Drift detected? → WARNING ticket → investigate before next transaction

Hourly batch
  └── Hourly totals match? → continue
  └── MISMATCH? → RESTRICT affected operations → investigate

Daily full
  └── 5-way RECONCILED? → continue
  └── WARNING? → heightened monitoring
  └── MISMATCH? → RESTRICT + escalate within 1 hour
  └── CRITICAL? → SUSPEND all operations → manual recovery

Weekly audit
  └── Both sides' signatures match? → continue
  └── Signature mismatch? → immediate investigation
```

### 5.7 The API Endpoint

The `/gateway/v1/reconciliation` endpoint (one of the 8 API endpoints) returns the latest 5-way reconciliation report:

```http
GET /gateway/v1/reconciliation?bankId=BANKXX00&asOf=2026-01-15 HTTP/1.1
Host: mbg.bankxx00.example
Authorization: Bearer <OAuth2 token>
X-MBG-Signature: <bank's signature>
```

Response:

```json
{
  "canonicalLedgerTotal": 1000000.00,
  "bankSubledgerTotal": 1000000.00,
  "corporatePositionsTotal": 1000000.00,
  "reserveLedgerTotal": 1000000.00,
  "proofOfLiabilitiesTotal": 1000000.00,
  "status": "RECONCILED",
  "mismatches": [],
  "timestamp": "2026-01-15T23:59:59Z",
  "toleranceBps": 1,
  "criticalThresholdBps": 100
}
```

---

## 6. AccountingReconciliationAdapter — MITHQAL State → Bank-Compatible Accounting References

### 6.1 The AccountingReconciliationAdapter Interface

```typescript
export interface AccountingReconciliationAdapter {
  adapterId: string;
  bankTransactionReference: string;       // bank's own GL reference
  mtqSettlementId: string;                // MITHQAL-side ID
  mtqPosition: number;                    // corporate's post-event position
  fxReference: string | null;              // if FX was involved
  settlementStatus: "PENDING" | "SETTLED" | "FAILED" | "REVERSED";
  redemptionStatus: "NOT_APPLICABLE" | "PENDING" | "COMPLETED" | "FAILED";
  reserveReference: string;
  reconciliationState: FiveWayReconciliationStatus;

  accountingMapping: {
    bankGlAssetAccount: string;            // bank-defined, NOT MITHQAL-defined
    bankGlLiabilityAccount: string;
    bankGlFeeAccount: string;
    bankGlFxFeeAccount: string;
    mappingVersion: string;
    bankAccountingSystemAcknowledged: boolean;
  };
}
```

### 6.2 What the Adapter Does

The `AccountingReconciliationAdapter` translates MITHQAL settlement events into bank-compatible accounting references:

1. **Bank transaction reference** — the bank's own GL transaction reference (e.g. `BTX-2026-0001`).
2. **MTQ settlement ID** — the MITHQAL-side settlement ID (e.g. `MTQ-SET-2026-0001`).
3. **MTQ position** — the corporate's post-event MTQ position.
4. **FX reference** — if FX was involved, the FX deal reference (preserved for treasury reconciliation).
5. **Settlement status** — `PENDING` / `SETTLED` / `FAILED` / `REVERSED`.
6. **Redemption status** — `NOT_APPLICABLE` / `PENDING` / `COMPLETED` / `FAILED`.
7. **Reserve reference** — ties the event to the MITHQAL canonical reserve ledger.
8. **Reconciliation state** — the current 5-way reconciliation status.

### 6.3 The Accounting Mapping Block

The `accountingMapping` block maps the MTQ event to the bank's own GL accounts:

| Field | Purpose |
|---|---|
| `bankGlAssetAccount` | The bank's GL asset account for the MTQ position. |
| `bankGlLiabilityAccount` | The bank's GL liability account for the corporate's MTQ position. |
| `bankGlFeeAccount` | The bank's GL fee account for settlement fees. |
| `bankGlFxFeeAccount` | The bank's GL FX fee account for FX spreads. |
| `mappingVersion` | The version of the bank's mapping table. |
| `bankAccountingSystemAcknowledged` | Whether the bank's accounting system has acknowledged receipt. |

### 6.4 Critical: MITHQAL Does NOT Dictate the Bank's GL Codes

The bank supplies its own GL codes. MITHQAL does NOT prescribe:

- Which GL account is the "asset" account.
- Which GL account is the "liability" account.
- Which GL account is the "fee" account.
- Which GL account is the "FX fee" account.
- The numbering / coding scheme (e.g. chart of accounts numbering).

The bank's chart of accounts remains authoritative. The adapter only records which GL accounts a given MTQ event touches — the bank's accounting system does the actual posting.

### 6.5 The Acknowledgment Flag

`bankAccountingSystemAcknowledged` is a boolean flag indicating whether the bank's accounting system has acknowledged receipt of the reconciliation record. If `false`, the reconciliation is `MISMATCH` (the bank's GL has not yet posted the event).

### 6.6 Settlement Status Mapping

The `MTQStatusEvent` (13 states — see §15 of source) maps to `settlementStatus` (4 states) as follows:

| MTQStatusEvent | settlementStatus |
|---|---|
| `RECEIVED`, `AUTHORIZED`, `COMPLIANCE_VERIFIED`, `ISSUANCE_PENDING`, `ISSUED`, `SETTLEMENT_PENDING` | `PENDING` |
| `SETTLED`, `COMPLETED` | `SETTLED` |
| `BLOCKED`, `RESOLUTION` (when reversal initiated) | `FAILED` |
| `REDEMPTION_PENDING` (when reversal confirmed) | `REVERSED` |
| `REDEEMED` | `SETTLED` (redemption settled) |
| `SUSPENDED` | `PENDING` (still pending) |
| `RESOLUTION` (when completed) | `SETTLED` |

### 6.7 Redemption Status Mapping

| MTQStatusEvent | redemptionStatus |
|---|---|
| `RECEIVED` through `SETTLED` | `NOT_APPLICABLE` (no redemption requested) |
| `REDEMPTION_PENDING` | `PENDING` |
| `REDEEMED` | `COMPLETED` |
| `BLOCKED` (during redemption) | `FAILED` |

---

## 7. Bank Transaction Reference Mapping (bankTransactionReference ↔ mtqSettlementId)

### 7.1 The 1:1 Mapping

Every `MTQSettlementInstruction` carries a `bankTransactionReference` (the bank's own GL transaction reference). Every settled MTQ transaction has a unique `mtqSettlementId` (the MITHQAL-side settlement ID).

The `AccountingReconciliationAdapter` records the 1:1 mapping:

```
bankTransactionReference  <-->  mtqSettlementId
   (BTX-2026-0001)              (MTQ-SET-2026-0001)
```

### 7.2 Why the Mapping Matters

The mapping enables the bank to:

1. **Reconcile** — for every GL transaction in the bank's accounting system, find the corresponding MITHQAL settlement ID.
2. **Audit** — for every MITHQAL settlement, find the corresponding bank GL transaction.
3. **Investigate** — when a mismatch occurs, identify which specific transactions are affected.
4. **Reverse** — when a reversal is initiated, identify both the bank-side and MITHQAL-side transaction IDs.

### 7.3 The Mapping Table

| bankTransactionReference | mtqSettlementId | mtqPosition | settlementStatus | timestamp |
|---|---|---|---|---|
| BTX-2026-0001 | MTQ-SET-2026-0001 | 1000.00 | SETTLED | 2026-01-15T10:30:00Z |
| BTX-2026-0002 | MTQ-SET-2026-0002 | 950.00 | SETTLED | 2026-01-15T11:15:00Z |
| BTX-2026-0003 | MTQ-SET-2026-0003 | 875.00 | PENDING | 2026-01-15T12:00:00Z |
| ... | ... | ... | ... | ... |

### 7.4 The Reverse Lookup

The bank can query by either direction:

- Given `bankTransactionReference`, return `mtqSettlementId` + status.
- Given `mtqSettlementId`, return `bankTransactionReference` + status.

This enables both bank-initiated queries (e.g. corporate customer asking about a specific payment) and MITHQAL-initiated queries (e.g. reconciliation investigation).

### 7.5 Idempotency Across the Mapping

The `bankTransactionReference` is unique per bank; the `mtqSettlementId` is unique globally. The mapping is 1:1 — no two bank transactions map to the same MITHQAL settlement, and vice versa.

If a bank submits the same `bankTransactionReference` twice (e.g. due to network retry), the second submission is rejected by the idempotency check (per §17 `ConnectivitySecurityProfile.idempotency`).

---

## 8. FX Reference Reconciliation (fxReference ↔ mtqPosition)

### 8.1 The FX Reference Field

```typescript
fxReference: string | null;   // if FX was involved
```

The `fxReference` field records the FX deal reference when FX was involved in the settlement. This is preserved for the bank's treasury reconciliation.

### 8.2 Why FX Reference Reconciliation Matters

When an MTQ settlement involves FX (e.g. JPY → USD conversion), the bank's treasury needs to:

1. Track the FX deal that generated the conversion rate.
2. Reconcile the FX exposure against the MTQ settlement.
3. Verify the FX spread was correctly applied.

The `fxReference` enables this reconciliation. The bank's treasury system can query by `fxReference` and find the corresponding MTQ settlement(s).

### 8.3 The FX Reference Mapping

```
fxReference  <-->  mtqSettlementId  <-->  mtqPosition (in source currency + target currency)
   (FX-2026-001)       (MTQ-SET-2026-0001)         (JPY 1,000,000,000 -> USD 6,666,667)
```

### 8.4 The Treasury Reconciliation Flow

1. Bank's treasury system executes an FX deal (e.g. JPY → USD).
2. Treasury system records `fxReference = FX-2026-001` with deal details (source amount, target amount, exchange rate).
3. The MTQ settlement uses the FX-deal-confirmed rate.
4. The `AccountingReconciliationAdapter` records `fxReference = FX-2026-001` on the settlement record.
5. Bank's treasury system queries by `fxReference` and finds the MTQ settlement(s).
6. Treasury reconciliation verifies: FX deal amount = MTQ settlement amount (in both source and target currencies).

### 8.5 FX Reference for Multi-Leg Settlements

Some MTQ settlements involve multiple FX legs (e.g. JPY → USD → EUR). In this case, the `fxReference` may be a composite reference (e.g. `FX-2026-001,FX-2026-002`) referring to multiple FX deals.

The reconciliation verifies each leg separately, then verifies the composite.

### 8.6 What the FX Reference Is NOT

| Misreading | Truth |
|---|---|
| MITHQAL's FX deal | No — MITHQAL is not an FX exchange. The FX deal is the bank's. |
| An FX exchange rate | No — the rate is recorded inside the FX deal, not in the `fxReference` field. |
| MITHQAL's FX authority | No — the bank remains the FX authority. MITHQAL is not an FX exchange. |

---

## 9. Reserve Reference Reconciliation (reserveReference ↔ mtqAmount)

### 9.1 The Reserve Reference Field

```typescript
reserveReference: string;   // ties the issuance to a reserve entry
```

The `reserveReference` field ties an MTQ issuance to a specific entry in the MITHQAL canonical reserve ledger.

### 9.2 Why Reserve Reference Reconciliation Matters

Every MTQ issuance is backed by verified reserves (RR ≥ 100%). The `reserveReference` enables the bank to:

1. Verify that the MTQ issuance is backed by reserves.
2. Reconcile the MTQ amount against the reserve liability (S × PAR).
3. Audit the reserve coverage.

### 9.3 The Reserve Reference Mapping

```
reserveReference  <-->  mtqAmount  <-->  reserve liability (S × PAR)
   (RES-2026-0001)        (1000.00 MTQ)     (1000.00 × PAR = $X reserve liability)
```

### 9.4 The Reserve Reconciliation Flow

1. The bank submits an MTQ settlement instruction with `amount` + `mtqAmount`.
2. MITHQAL canonical ledger mints MTQ against verified reserves.
3. The reserve engine records a reserve entry with `reserveReference = RES-2026-0001`.
4. The `MTQSettlementInstruction` carries `reserveReference = RES-2026-0001`.
5. The `AccountingReconciliationAdapter` records `reserveReference = RES-2026-0001`.
6. The 5-way reconciliation verifies: `canonicalLedgerTotal` × PAR = `reserveLedgerTotal`.

### 9.5 The Reserve Ratio (RR)

The reserve ratio (RR) is the ratio of reserve assets to MTQ supply:

```
RR = reserveAssets / (canonicalMTQSupply × PAR)
```

Per v25.0 architecture, RR ≥ 100% must always hold. If RR drops below 100%, the reserve engine halts new issuance until reserves are replenished.

### 9.6 What the Reserve Reference Is NOT

| Misreading | Truth |
|---|---|
| The bank's reserves | No — the `reserveReference` ties to the MITHQAL canonical reserve ledger, not the bank's reserves. |
| A claim on physical reserves | No — the `reserveReference` is a ledger entry; physical reserves are held by approved custodians. |
| The bank's liability | No — the bank's liability is to its corporate customer (recorded in `bankGlLiabilityAccount`); the reserve liability is MITHQAL's. |

---

## 10. Mismatch Handling (Alert / Restrict / Forensic / Preserve Audit / Escalate)

### 10.1 The RECONCILIATION_INCIDENT_RESPONSE Matrix

```typescript
export const RECONCILIATION_INCIDENT_RESPONSE: Record<
  "WARNING" | "MISMATCH" | "CRITICAL" | "LOCKED",
  string[]
> = {
  WARNING: [
    "1. Continue settlement operations with heightened monitoring.",
    "2. Auto-open investigation ticket against each WARNING mismatch.",
    "3. Notify bank ops + MITHQAL ops within 4 hours.",
    "4. Next reconciliation cycle re-checks the same ledgers.",
  ],
  MISMATCH: [
    "1. RESTRICT affected operations (issuance OR redemption OR settlement).",
    "2. Auto-escalate to bank ops + MITHQAL ops within 1 hour.",
    "3. Preserve forensic evidence (signed snapshots of all 5 ledgers).",
    "4. Investigation ticket required; resolution before RESTORE.",
  ],
  CRITICAL: [
    "1. SUSPEND all settlement operations (gate moves to LOCKED).",
    "2. Immediate page bank ops lead + MITHQAL ops lead.",
    "3. Forensic evidence preservation (immutable snapshots).",
    "4. Manual controlled recovery only — no automated RESTORE.",
    "5. Regulatory notification where required by law.",
  ],
  LOCKED: [
    "1. Operations remain SUSPENDED pending manual recovery.",
    "2. Only 4-of-7 Council + bank lead signoff can RESTORE.",
    "3. All instructions received during LOCKED state queued, NOT executed.",
    "4. After RESTORE, re-run reconciliation; only RESUME if RECONCILED.",
  ],
};
```

### 10.2 The 5 Mismatch Handling Steps

Regardless of severity, every mismatch triggers these 5 steps:

1. **Alert** — automated monitoring detects the mismatch and opens a ticket.
2. **Restrict** — affected operations are restricted (WARNING: heightened monitoring only; MISMATCH: RESTRICT affected; CRITICAL: SUSPEND all).
3. **Forensic** — signed snapshots of all 5 ledgers are preserved.
4. **Preserve audit** — both bank-side and MITHQAL-side audit trails are preserved.
5. **Escalate** — bank ops + MITHQAL ops are notified (WARNING: 4 hours; MISMATCH: 1 hour; CRITICAL: immediate).

### 10.3 Forensic Evidence Preservation

For `MISMATCH` and `CRITICAL` incidents, the following forensic evidence is preserved:

- Signed snapshots of all 5 reconciliation ledgers (canonical, bank subledger, corporate positions, reserve, proof-of-liabilities) at the time of mismatch.
- Full audit trail of all instructions in the affected time window.
- Gateway metrics (instructionsReceived / Settled / Rejected / Pending).
- Connectivity security state (mTLS cert fingerprints, IP allowlist, key fingerprints).
- Reconciliation report (the `FiveWayReconciliationReport` with mismatches[]).

Evidence is preserved for the regulatory retention period (typically 7 years).

### 10.4 Investigation Workflow

Each mismatch opens an investigation ticket with:

- `investigationStatus = "OPEN"` initially.
- Bank ops + MITHQAL ops jointly investigate.
- Status moves to `"INVESTIGATING"` once investigation begins.
- Status moves to `"RESOLVED"` once root cause is identified + remediated.
- Status moves to `"ESCALATED"` if investigation cannot resolve within the SLA.

### 10.5 RESTORE Workflow

After resolution, the RESTORE workflow:

1. Bank ops + MITHQAL ops jointly verify root cause resolved.
2. Re-run reconciliation: `runFiveWayReconciliation(input)`.
3. If `RECONCILED` — RESTORE affected operations.
4. If still `MISMATCH` or `CRITICAL` — continue investigation; do not RESTORE.
5. For `LOCKED` state — 4-of-7 Council + bank lead signoff required.

### 10.6 Regulatory Notification

For `CRITICAL` incidents, regulatory notification may be required:

- If the bank's regulator requires notification of settlement halts, the bank must notify its regulator.
- If MITHQAL's regulator requires notification, MITHQAL must notify its regulator.
- Notification timelines follow the bank's existing regulatory notification procedures.

---

## 11. Reconciliation Reporting (Dashboard / Alerts / Audit Trail)

### 11.1 The Reconciliation Dashboard

The bank's operations dashboard (existing) consumes the `/gateway/v1/reconciliation` endpoint and displays:

- Current 5-way reconciliation status (`RECONCILED` / `WARNING` / `MISMATCH` / `CRITICAL` / `LOCKED`).
- Each of the 5 totals.
- Any mismatches (with ledger, expected, actual, deltaBps, severity, investigationStatus).
- Last reconciliation timestamp.
- Reconciliation trend (last 24 hours / 7 days / 30 days).

### 11.2 The Incidents Dashboard

The `/gateway/v1/incidents` endpoint (one of the 8 API endpoints) returns active incidents:

```http
GET /gateway/v1/incidents?bankId=BANKXX00&severity=CRITICAL HTTP/1.1
Host: mbg.bankxx00.example
Authorization: Bearer <OAuth2 token>
X-MBG-Signature: <bank's signature>
```

Response:

```json
{
  "incidents": [
    {
      "type": "ReconciliationMismatch",
      "severity": "CRITICAL",
      "ledger": "BANK_SUBLEDGER",
      "expected": 1000000.00,
      "actual": 990000.00,
      "deltaBps": 100,
      "investigationStatus": "OPEN",
      "detectedAt": "2026-01-15T12:00:00Z"
    },
    {
      "type": "GatewayFailure",
      "failureType": "BANK_SIDE_OUTAGE",
      "failureId": "FAIL-2026-001",
      "affectedGatewayId": "MBG-BANKXX00-001",
      "detectedAt": "2026-01-15T11:30:00Z"
    }
  ]
}
```

### 11.3 Alert Routing

Alerts are routed based on severity:

| Severity | Routing |
|---|---|
| WARNING | Auto-ticket; email bank ops + MITHQAL ops. |
| MISMATCH | Auto-ticket; page bank ops + MITHQAL ops on-call within 1 hour. |
| CRITICAL | Immediate page bank ops lead + MITHQAL ops lead + council chair. |
| LOCKED | Immediate page; council convenes for RESTORE decision. |

### 11.4 Audit Trail

The audit trail records:

- Every reconciliation cycle (with full `FiveWayReconciliationReport`).
- Every mismatch (with full `ReconciliationMismatch`).
- Every investigation ticket (with status transitions).
- Every RESTORE (with signoffs).
- Every regulatory notification (with timestamps).

Audit trail is preserved for the regulatory retention period (typically 7 years).

### 11.5 The Weekly Audit Report

Once per week, the bank + MITHQAL jointly produce an audit report:

- All 5 totals for each day of the week.
- Any mismatches that occurred.
- Any investigations opened / resolved / escalated.
- Any RESTORE actions taken.
- Any regulatory notifications sent.

The weekly audit report is signed by both sides and archived.

---

## 12. MITHQAL MUST NOT Dictate the Bank's Chart of Accounts

### 12.1 The Canonical Rule

The `AccountingReconciliationAdapter.accountingMapping` block records the bank's GL account codes, but MITHQAL does NOT prescribe them:

```typescript
accountingMapping: {
  bankGlAssetAccount: string;            // bank-defined
  bankGlLiabilityAccount: string;         // bank-defined
  bankGlFeeAccount: string;               // bank-defined
  bankGlFxFeeAccount: string;              // bank-defined
  mappingVersion: string;
  bankAccountingSystemAcknowledged: boolean;
}
```

### 12.2 What MITHQAL Does NOT Prescribe

| Item | MITHQAL's role |
|---|---|
| Chart of accounts numbering | None — bank's own scheme. |
| Which GL account is the "asset" account | None — bank decides. |
| Which GL account is the "liability" account | None — bank decides. |
| Which GL account is the "fee" account | None — bank decides. |
| Which GL account is the "FX fee" account | None — bank decides. |
| Cost center / profit center coding | None — bank's own scheme. |
| Accounting periods | None — bank's own scheme. |
| Currency coding (functional vs presentation) | None — bank's own scheme. |

### 12.3 What MITHQAL Provides

MITHQAL provides:

- The MTQ settlement event (with `mtqSettlementId`, `mtqAmount`, `settlementStatus`).
- The reserve reference (`reserveReference`).
- The FX reference (`fxReference`, if applicable).
- The 5-way reconciliation status.

The bank maps these events to its own GL accounts via the `accountingMapping` block. The bank's accounting system does the actual posting; MITHQAL only records which GL accounts the event touched.

### 12.4 Why This Matters

Banks have invested decades in their chart of accounts. Each bank's chart of accounts is tied to its regulatory reporting, its tax reporting, its internal management reporting, and its audit trails. Forcing a bank to adopt MITHQAL's chart of accounts would be a non-starter — it would require the bank to re-do decades of accounting work.

By NOT dictating the chart of accounts, MITHQAL lets the bank continue using its existing accounting framework. The MBG's `AccountingReconciliationAdapter` is a thin translation layer that records which GL accounts each MTQ event touches — it does not replace the bank's accounting system.

### 12.5 The Acknowledgment Flag

`bankAccountingSystemAcknowledged` is the bank's accounting system's confirmation that it has received and posted the reconciliation record. If `false`, the reconciliation is `MISMATCH` (the bank's GL has not yet posted the event).

This flag is the bank's own accounting system's voice in the reconciliation — it lets the bank's accounting system signal "I have processed this event" or "I have not yet processed this event".

---

## 13. Honest State — Reconciliation Logic INTEGRATION-READY, No Real-Bank Reconciliation Yet

### 13.1 The Headline

```
IntegrationState = "INTEGRATION-READY"
Banks contracted = 0
Real bank reconciliations = 0
All 5 totals in the baseline reconciliation = 0
Baseline reconciliation status = RECONCILED (because all 5 totals = 0)
```

### 13.2 What "INTEGRATION-READY" Means for Reconciliation

`INTEGRATION-READY` means the reconciliation logic is fully specified:

- The `BankMTQSubledger` interface is defined.
- The `FiveWayReconciliationReport` interface is defined.
- The `runFiveWayReconciliation(input)` function is implemented.
- The `AccountingReconciliationAdapter` interface is defined.
- The `RECONCILIATION_INCIDENT_RESPONSE` matrix is defined.
- The 5 reconciliation states are defined.
- The 4 reconciliation cadences are documented.

It does **not** mean:

- ❌ A real bank has run a reconciliation.
- ❌ A real bank's GL has acknowledged receipt of a reconciliation record.
- ❌ A real bank's treasury has reconciled an FX reference.
- ❌ A real bank's reserve has been reconciled against the MITHQAL canonical ledger.

### 13.3 The Baseline Reconciliation

The source module's `generateMBGExecutiveReport()` runs a baseline reconciliation with all 5 totals = 0:

```typescript
const baselineReconciliation = runFiveWayReconciliation({
  canonicalLedgerTotal: 0,
  bankSubledgerTotal: 0,
  corporatePositionsTotal: 0,
  reserveLedgerTotal: 0,
  proofOfLiabilitiesTotal: 0,
});
```

This baseline returns `RECONCILED` because all 5 totals match exactly (deltaBps = 0). It's the pre-pilot baseline — no MTQ has been issued, no bank subledger exists, no corporate positions exist.

When a real bank contracts and the first MTQ is issued, the baseline moves to a non-zero reconciliation. The reconciliation logic will then exercise the full 5-way check.

### 13.4 What This Guide Is

This guide describes the reconciliation architecture a bank **would** use. It does not describe a reconciliation that has actually happened. No real bank has run a 5-way reconciliation. No real bank has experienced a `MISMATCH` or `CRITICAL` reconciliation.

### 13.5 What This Guide Is NOT

| Possible misreading | Truth |
|---|---|
| "Reconciliation has been tested against real banks" | No — all reconciliation runs are SIMULATED with zero totals. |
| "Banks can plug and play reconciliation" | No — the bank must configure its `accountingMapping` (GL codes) and run the 20 required tests. |
| "The 5-way reconciliation is production-proven" | No — it's logic-level spec complete. Production proof requires a real bank. |

### 13.6 The Final Reminder

> *INTEGRATION-READY (AMBER). Logic-level spec complete. 0 real banks contracted. 0 real bank reconciliations. Baseline 5-way reconciliation returns RECONCILED with all 5 totals = 0 (pre-pilot). Canonical principle: 'TRANSLATION, NOT TRANSFORMATION.' No core replacement. Minimal integration. Existing banking systems remain authoritative. The 10 standing blockers (per `final-pilot-activation-gate.ts`) remain open.*

---

## Appendix A — Cross-References

| Topic | Document |
|---|---|
| MBG architecture (canonical) | `docs/architecture/mbg/MITHQAL_BANK_GATEWAY_ARCHITECTURE.md` |
| Adapter standard (MSAS) | `docs/architecture/mbg/MITHQAL_ADAPTER_STANDARD_MSAS.md` |
| Bank integration playbook | `docs/architecture/mbg/MITHQAL_BANK_INTEGRATION_GUIDE.md` |
| Bank security guide | `docs/architecture/mbg/MITHQAL_BANK_SECURITY_GUIDE.md` |
| Bank ROI / cost model | `docs/architecture/mbg/MITHQAL_BANK_ROI_MODEL.md` |
| Corporate user flow | `docs/architecture/mbg/MITHQAL_CORPORATE_USER_FLOW.md` |
| Source module | `src/lib/mithqal-bank-gateway.ts` (§11, §12, §13, §15) |
| BankMTQSubledger | §12 of source module |
| FiveWayReconciliationReport | §13 of source module |
| AccountingReconciliationAdapter | §11 of source module |
| MTQ Status Events (13 states) | §15 of source module |
| Canonical supply ledger | `src/lib/canonical-supply-ledger.ts` (Theorem S1, S2, S3) |
| Final pilot activation gate | `docs/verification/v25-0-final-pilot-activation-gate.md` |

## Appendix B — Reconciliation Quick-Reference Card

```
THE 5 TOTALS THAT MUST MATCH:
  1. canonicalLedgerTotal        (MITHQAL canonical MTQ supply)
  2. bankSubledgerTotal          (sum of all bank subledgers)
  3. corporatePositionsTotal     (sum of all corporate positions)
  4. reserveLedgerTotal          (reserve liability: S × PAR)
  5. proofOfLiabilitiesTotal     (proof-of-liabilities commitment)

THE 5 STATES:
  RECONCILED — all 5 match exactly (deltaBps = 0)
  WARNING    — at least 1 within tolerance (deltaBps ≤ 1bp)
  MISMATCH   — at least 1 beyond tolerance (1bp < deltaBps ≤ 100bp)
  CRITICAL   — at least 1 beyond critical (deltaBps > 100bp)
  LOCKED     — operations suspended pending manual recovery

THE 4 CADENCES:
  Real-time (per-transaction) — corporate vs bank subledger drift
  Hourly batch                — bank subledger internal consistency
  Daily full (end-of-day)     — full 5-way reconciliation
  Weekly audit                — joint bank + MITHQAL signed audit

THE 3 MAPPINGS:
  bankTransactionReference  ↔  mtqSettlementId    (1:1)
  fxReference               ↔  mtqPosition        (FX deal ↔ settlement)
  reserveReference          ↔  mtqAmount          (reserve entry ↔ issuance)

THE 1 RULE:
  MITHQAL MUST NOT dictate the bank's chart of accounts.
  The bank's accountingMapping is bank-defined.
```

---

*End of MITHQAL_BANK_RECONCILIATION_GUIDE.md — v25.0-mbg-amendment-1.0 — INTEGRATION-READY, 0 banks contracted.*
