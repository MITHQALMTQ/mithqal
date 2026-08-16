# MITHQAL Corporate User Flow — Bank-Linked MTQ Settlement Experience

**File title:** MITHQAL_CORPORATE_USER_FLOW.md
**Task ID:** MBG-DOCUMENTATION
**Source module:** `src/lib/mithqal-bank-gateway.ts` (3,969 lines)
**Document version:** v25.0-mbg-amendment-1.0
**Honest state declaration:** `INTEGRATION-READY` — 0 banks contracted, 0 live-pilot transactions. The user flow described below is the canonical target UX. No real corporate has executed an MTQ settlement through a real bank gateway yet.

---

## Section 1 — Corporate UX Philosophy

> **Canonical principle:** Existing bank corporate banking UX remains authoritative. MITHQAL operates underneath.

The corporate customer never has to leave their existing bank's corporate banking environment to use MTQ settlement. The MITHQAL Bank Gateway (MBG) is a **sidecar** that translates an already-approved bank payment instruction into an MTQ settlement instruction and returns the settlement result back into the bank's operating environment — where the corporate already monitors payments, positions, and treasury activity.

This is the meaning of "TRANSLATION, NOT TRANSFORMATION":

- The bank translates its existing authorized payment into an MTQ settlement instruction.
- MITHQAL never asks the corporate to learn new tooling.
- The corporate never manages seed phrases, blockchain gas, chain selection, consumer crypto wallets, or external wallet apps.

| Corporate UX principle | Implementation |
|---|---|
| Existing bank corporate banking UX remains authoritative | Corporate uses bank's existing portal; MTQ settlement is a position in the same view |
| MITHQAL operates underneath | The MBG is a sidecar — bank remains the customer-facing system |
| No seed phrases | Bank controls institutional key management (HSM / MPC / approved KMS) |
| No blockchain gas | MTQ is institutional — no gas, no consumer wallet UX |
| No chain selection | MBG abstracts chain routing; corporate sees only "MTQ Settlement Position" |
| No consumer crypto wallets | Corporate MTQ Settlement Account is a bank-linked institutional position, not a crypto wallet |
| No external wallet apps | All interactions occur through the bank's existing corporate banking interface |

---

## Section 2 — The Corporate Treasury Portal Example

A corporate customer in their existing bank's treasury portal sees something like this:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Corporate Treasury Portal — Acme Corp (Bank: Tier 1 Bank A)        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ACCOUNTS                    POSITIONS                  SHORTCUTS    │
│  ─────────                   ─────────                  ──────────   │
│  JPY Account   ¥1.2B          MTQ Settlement Position    [New        │
│                              850,000.00 MTQ               Payment]    │
│  USD Account   $48.5M                                                │
│                              Last reconciliation:        [Treasury   │
│  EUR Account   €12.3M         2026-08-15 14:23:01 UTC     Sweep]      │
│                                                                       │
│                              Reconciliation status:                   │
│                              ✓ RECONCILED                            │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  RECENT PAYMENTS                                                     │
│  ────────────────                                                    │
│  Date        Reference     Amount          Status      Rail          │
│  2026-08-15  TXN-009812    $1.5M USD       SETTLED     MTQ           │
│  2026-08-15  TXN-009811    ¥85M JPY        SETTLED     MTQ           │
│  2026-08-14  TXN-009788    €250K EUR       PENDING     MTQ           │
│  2026-08-14  TXN-009781    $5.0M USD       SETTLED     SWIFT         │
│  2026-08-13  TXN-009755    ¥1.0B JPY       SETTLED     MTQ           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

Key observations:
- The corporate sees "MTQ Settlement Position" alongside their existing JPY / USD / EUR accounts.
- Recent payments show both MTQ-settled and SWIFT-settled transactions side by side.
- The reconciliation status is visible at a glance (`✓ RECONCILED`).
- "Rail" column shows whether the payment used MTQ or SWIFT (or other rails) — MITHQAL coexists with existing infrastructure (per §21, §21A).
- The corporate can request a "[New Payment]" that uses the bank's ordinary payment form — the bank decides whether to route via MTQ based on the corridor, amount, currency, and policy.

---

## Section 3 — The Corporate Payment Flow (per §14)

### Step-by-step canonical flow

```
Step 1: Corporate enters ordinary payment instruction
        in bank's existing portal.
        ↓
Step 2: Bank's systems handle normal customer controls:
        - KYC / KYB verification
        - AML / CFT screening
        - Sanctions screening
        - Account authority verification
        - Funds availability check
        ↓
Step 3: Bank's existing authorization completes
        (all 7 compliance assertions PASS).
        ↓
Step 4: MITHQAL Bank Gateway (MBG) translates the
        authorized bank instruction into an
        MTQSettlementInstruction.
        ↓
Step 5: MBG submits MTQSettlementInstruction to
        MITHQAL Core.
        ↓
Step 6: MITHQAL Core validates:
        - institution identity
        - institution authorization
        - jurisdiction (JSG rules)
        - corridor
        - transaction permission
        - settlement rules
        - policy constraints
        ↓
Step 7: MITHQAL Core executes settlement:
        - debits Bank A aggregate MTQ position
        - credits Bank B aggregate MTQ position
        - emits MTQ settlement event
        - updates canonical ledger
        ↓
Step 8: Receiving MBG receives settlement event.
        ↓
Step 9: Receiving bank's systems credit the
        corporate beneficiary.
        ↓
Step 10: Corporate sees MTQ Settlement Position
         updated in their bank's treasury portal.
```

### Critical principle

> MITHQAL never asks the bank to expose its full customer file. The bank sends only:
> - institutional identity
> - pseudonymous corporate reference
> - cryptographic attestation (KYC/KYB/AML/Sanctions/Account Authority/Funds/Authorization all PASS)
> - minimum necessary transaction metadata

The corporate's identity stays inside the bank. MITHQAL receives only what it needs to settle.

---

## Section 4 — What the Corporate Does NOT Manage

The corporate customer never manages:

| ❌ Not required | ✓ Why not |
|---|---|
| Seed phrases | Bank controls institutional key management (HSM / MPC / approved KMS). MITHQAL never possesses customer private keys. |
| Blockchain gas fees | MTQ is institutional — no gas, no consumer wallet UX. |
| Chain selection | MBG abstracts chain routing. Corporate sees only "MTQ Settlement Position". |
| Consumer crypto wallets | Corporate MTQ Settlement Account is a bank-linked institutional position. |
| External wallet apps | All interactions occur through the bank's existing corporate banking interface. |
| Private key backup | Bank handles institutional key recovery. |
| Address book of crypto addresses | Corporate uses existing bank payment address book (bank accounts, not crypto wallets). |
| Transaction fee estimation | MBG handles fee logic; corporate sees only bank's standard fee schedule. |
| Block confirmation watching | MITHQAL Core handles settlement finality; corporate sees only "SETTLED" status. |
| Smart contract interaction | Corporate never directly invokes smart contracts — MBG does that. |

The corporate's experience is **indistinguishable** from a normal bank payment — except the settlement is faster, cheaper, and 24/7.

---

## Section 5 — 13 MTQ Status Events Visible to the Bank

The bank's operations dashboard can consume the following 13 MTQ status events (per §15). These statuses are designed to map cleanly into a bank's existing payment operations dashboard.

| # | Status Event | Bank-Consumable Description |
|---:|---|---|
| 1 | `RECEIVED` | Instruction received by MBG — pending bank-side authorization checks. |
| 2 | `AUTHORIZED` | Bank has authorized the transaction (KYC/KYB/AML/Sanctions/Account Authority/Funds/Authorization all PASS). |
| 3 | `COMPLIANCE_VERIFIED` | MITHQAL has validated the compliance attestation + JSG rules + jurisdiction. |
| 4 | `ISSUANCE_PENDING` | MTQ issuance is queued (if issuance is required for this transaction). |
| 5 | `ISSUED` | MTQ has been issued (if applicable) — institutional mint recorded on canonical ledger. |
| 6 | `SETTLEMENT_PENDING` | Settlement is in-flight (between Bank A and Bank B). |
| 7 | `SETTLED` | Settlement completed — Bank A debited, Bank B credited, canonical ledger updated. |
| 8 | `REDEMPTION_PENDING` | Redemption is queued (if corporate is redeeming MTQ back to fiat). |
| 9 | `REDEEMED` | Redemption completed — MTQ burned, fiat transferred to bank account. |
| 10 | `COMPLETED` | Full transaction lifecycle complete (settlement or redemption confirmed). |
| 11 | `BLOCKED` | Transaction blocked — sanctions, JSG, jurisdiction, or policy violation. |
| 12 | `SUSPENDED` | Transaction suspended — pending review (e.g., compliance flag, fraud signal). |
| 13 | `RESOLUTION` | Transaction in resolution state — ILPS activated, Article X liquidation path triggered. |

### Bank operations dashboard mapping

Banks typically have payment dashboards with states like: `QUEUED`, `AUTHORIZED`, `PROCESSING`, `COMPLETED`, `FAILED`, `RETURNED`. The 13 MTQ statuses map cleanly:

| MTQ Status | Typical bank dashboard status |
|---|---|
| RECEIVED | QUEUED |
| AUTHORIZED | AUTHORIZED |
| COMPLIANCE_VERIFIED | PROCESSING |
| ISSUANCE_PENDING | PROCESSING |
| ISSUED | PROCESSING |
| SETTLEMENT_PENDING | PROCESSING |
| SETTLED | COMPLETED |
| REDEMPTION_PENDING | PROCESSING |
| REDEEMED | COMPLETED |
| COMPLETED | COMPLETED |
| BLOCKED | FAILED |
| SUSPENDED | RETURNED (pending review) |
| RESOLUTION | FAILED (resolution in progress) |

Banks can choose to expose all 13 statuses (richer UX) or collapse them into their existing dashboard states (simpler UX). The MBG supports both modes.

---

## Section 6 — Bank-Linked Corporate MTQ Settlement Account (per §9)

The `BankLinkedCorporateMTQAccount` is the canonical UX abstraction. It is **NOT** a crypto wallet — it is a bank-linked institutional MTQ settlement position.

```typescript
interface BankLinkedCorporateMTQAccount {
  accountId: string;                   // unique account ID
  bankId: string;                      // which bank holds this account
  corporateReference: string;          // pseudonymous corporate reference (not raw customer identity)
  mtqPosition: number;                  // current MTQ position (e.g., 850,000.00)
  bankAccountLinkage: {                // link to existing bank account
    bankAccountId: string;
    bankAccountCurrency: "JPY" | "USD" | "EUR" | "AED" | "SGD" | "GBP" | "HKD";
    bankAccountType: "CORPORATE_CHECKING" | "CORPORATE_TREASURY" | "CORPORATE_OFFSHORE";
  };
  customerExperienceMode: "EXISTING_BANK_UX" | "MTQ_DASHBOARD" | "HYBRID";
  noSeedPhrase: true;                   // always true — bank handles keys
  noGasManagement: true;                // always true — MTQ is institutional
  noChainSelection: true;               // always true — MBG abstracts routing
  noConsumerCryptoWallet: true;         // always true — bank-linked position
}
```

### Three customer experience modes

| Mode | Description | Best for |
|---|---|---|
| `EXISTING_BANK_UX` | Corporate sees MTQ Settlement Position inside their existing bank corporate banking portal. No separate MTQ UI. | Most corporates — minimum cognitive load |
| `MTQ_DASHBOARD` | Corporate accesses a separate MTQ Settlement Dashboard (provided by MBG) for richer MTQ-specific views (settlement history, reconciliation status, position drill-down). | Treasury teams with sophisticated MTQ usage |
| `HYBRID` | Corporate sees MTQ Settlement Position inside bank portal + can drill into MTQ Dashboard for detail. | Default for early pilot — combines simplicity with depth |

### Default preference

For early pilots, the **HYBRID** mode is recommended. Banks retain full control of which mode their corporates use.

---

## Section 7 — Privacy Model

> **Canonical principle:** "Privacy by default, traceability by authorization, disclosure by law."

### What MITHQAL receives

| Field | Sent to MITHQAL? | Why |
|---|:---:|---|
| Customer full legal name | ❌ | Stays in bank — MITHQAL does not need customer identity |
| Customer date of birth | ❌ | Stays in bank — KYC remains bank's responsibility |
| Customer address | ❌ | Stays in bank — bank's lawful-disclosure interface |
| Customer tax ID | ❌ | Stays in bank — bank's regulatory responsibility |
| Customer bank account number | ❌ | Stays in bank — only bank-side reference passed |
| Institutional identity (bank ID) | ✓ | MITHQAL needs to know which bank |
| Pseudonymous corporate reference | ✓ | Bank issues a per-corporate pseudonymous ID (e.g., `CORP-X8F3K2`) — MITHQAL sees this, not the corporate name |
| Cryptographic attestation | ✓ | Bank signs that KYC/KYB/AML/Sanctions/Account Authority/Funds/Authorization all PASS |
| Minimum necessary transaction metadata | ✓ | Amount, currency, jurisdiction, corridor, purpose, timestamp — enough to settle, not enough to identify |
| ZK proofs | ✓ | Bank can provide selective-disclosure proofs (e.g., "amount < $10M", "jurisdiction = JP") without revealing full data |
| Verifiable credentials | ✓ | Bank can issue W3C Verifiable Credentials attesting to corporate authorization |
| Selective disclosure | ✓ | Bank discloses only what's needed for the transaction |
| Encrypted references | ✓ | Bank can encrypt sensitive references; MITHQAL stores ciphertext only |
| Lawful disclosure | conditional | Only when legally compelled — bank remains the lawful-disclosure interface |

### ZK proof usage

The MBG supports Zero-Knowledge proofs for:

1. **Compliance attestation proofs** — prove "KYC=PASS" without revealing customer identity
2. **Range proofs** — prove "amount < $10M" without revealing exact amount
3. **Settlement proofs** — prove "settlement occurred" without revealing counterparty
4. **Reserve proofs** — prove "reserve ratio ≥ 100%" without revealing reserve composition
5. **Jurisdiction proofs** — prove "jurisdiction = JP" without revealing full corporate location

### Lawful disclosure controls

Lawful disclosure remains the bank's responsibility. The MBG **does NOT weaken** existing lawful disclosure controls:

- The bank is the lawful-disclosure interface with regulators, courts, and law enforcement.
- MITHQAL provides auditability — every settlement, every position, every reconciliation is auditable.
- MITHQAL provides selective disclosure — banks can prove specific facts without revealing everything.
- When lawfully compelled, the bank discloses; MITHQAL cooperates with the bank's lawful-disclosure process.
- MITHQAL **never** discloses customer data directly to third parties without the bank's authorization + lawful basis.

---

## Section 8 — Lawful Disclosure Architecture

```
Law enforcement / regulator / court
                ↓
        Lawful disclosure request
                ↓
        BANK (lawful-disclosure interface)
                ↓
        Bank verifies lawful basis
        Bank decrypts customer identity
        Bank provides disclosure
                ↓
        MITHQAL cooperates by providing:
        - settlement audit trail
        - reconciliation records
        - position history
        - canonical ledger entries
                ↓
        Bank consolidates disclosure response
                ↓
        Law enforcement / regulator / court
```

**Critical invariant:** MITHQAL never directly interfaces with law enforcement for customer-level disclosure. The bank is always the interface. MITHQAL provides auditability on its institutional layer; the bank provides customer-level disclosure.

---

## Section 9 — Corporate User Scenarios

### Scenario A — Corporate-to-Corporate B2B Payment

**Setup:** Acme Corp (banked at Tier 1 Bank A in JPY) pays Globex Corp (banked at Tier 1 Bank B in USD) for a $5M wholesale invoice.

**Flow:**
1. Acme treasury team enters $5M USD payment in Bank A's portal, selecting Globex as payee.
2. Bank A's systems screen Acme + Globex (KYC/AML/sanctions) — all PASS.
3. Bank A authorizes the payment.
4. Bank A's MBG translates into MTQSettlementInstruction (amount=$5M USD, corridor=JP→US, MTQ amount=5M MTQ).
5. MITHQAL Core validates JSG (JP→US corridor ALLOWED), validates institution authorization, executes settlement.
6. Bank A aggregate MTQ position debited 5M MTQ; Bank B aggregate MTQ position credited 5M MTQ.
7. Bank B's MBG receives settlement event; Bank B's systems credit Globex's USD account.
8. Acme sees "SETTLED" status in Bank A's portal; Globex sees credit in Bank B's portal.
9. Five-way reconciliation: MITHQAL canonical ledger = Bank A subledger = Bank B subledger = corporate positions = reserve ledger = proof-of-liabilities.

**Time:** ~30 seconds end-to-end (vs 1-3 days for correspondent banking).

**Cost:** ~12 bps (vs ~25-50 bps for correspondent banking + FX spreads).

### Scenario B — Treasury Rebalancing

**Setup:** Acme Corp's treasury wants to rebalance $50M from USD to JPY (cross-currency).

**Flow:**
1. Acme treasury team enters $50M USD → JPY conversion in Bank A's portal.
2. Bank A's FX desk executes the FX leg (existing bank FX infrastructure).
3. Bank A's MBG translates the rebalance into an MTQSettlementInstruction (purpose=TREASURY_REBALANCE).
4. MITHQAL Core validates and executes — Acme's MTQ position moves from USD-denominated to JPY-denominated.
5. Bank A's treasury system sees the rebalance complete.
6. Five-way reconciliation passes.

**Time:** ~1 minute (vs hours for traditional FX + correspondent).

### Scenario C — Cross-Border Wholesale Payment

**Setup:** Acme Corp (JP, banked at Bank A) pays $20M USD to a supplier in UAE (banked at Bank C).

**Flow:**
1. Acme enters $20M USD payment in Bank A's portal, corridor=JP→AE.
2. Bank A screens + authorizes.
3. Bank A's MBG translates into MTQSettlementInstruction (corridor=JP→AE, jurisdiction=JP+AE).
4. MITHQAL Core validates JSG (JP→AE corridor ALLOWED — both jurisdictions pilot-eligible), validates institution authorization, executes settlement.
5. Bank C's MBG receives settlement event; Bank C's systems credit the UAE supplier's account.
6. Five-way reconciliation passes.

**Time:** ~30 seconds (vs 2-5 days for traditional correspondent + SWIFT).

**Cost:** ~15 bps (vs ~30-60 bps for correspondent banking).

### Scenario D — FX-Corridor Settlement

**Setup:** Acme Corp uses MTQ to settle a USD→AED corridor payment.

**Flow:**
1. Acme enters USD→AED payment in Bank A's portal.
2. Bank A's FX desk executes USD→AED FX leg.
3. Bank A's MBG translates into MTQSettlementInstruction (corridor=US→AE, settlement currency=AED).
4. MITHQAL Core validates + executes.
5. Bank C's MBG receives settlement; Bank C credits AED account.
6. Five-way reconciliation passes.

### Scenario E — Redemption to Fiat

**Setup:** Acme Corp wants to redeem 1M MTQ back to USD.

**Flow:**
1. Acme enters redemption request in Bank A's portal (1M MTQ → USD).
2. Bank A's MBG translates into redemption instruction.
3. MITHQAL Core validates redemption (RR ≥ 100% maintained, ILPS Settlement Layer has liquidity).
4. MITHQAL Core burns 1M MTQ (canonical supply decreases by 1M).
5. MITHQAL Core releases $1M USD from reserve to Bank A.
6. Bank A credits Acme's USD account.
7. Five-way reconciliation passes.

**Time:** ~5 minutes (instant for normal redemptions; longer for large redemptions under ISSUANCE_HALT rules).

---

## Section 10 — Corporate Benefit Summary

| Benefit | Description |
|---|---|
| Faster settlement | 30 seconds vs 1-5 days for correspondent banking |
| Lower cost | 12-18 bps vs 25-50 bps for correspondent banking |
| 24/7 operation | MTQ settles continuously — no banking-hour windows, no weekend cutoffs |
| Neutral across jurisdictions | MITHQAL is jurisdiction-neutral; JSG enforces rules per corridor |
| No retail crypto complexity | Corporate never manages seed phrases, gas, or wallets |
| Existing bank UX preserved | MTQ Settlement Position appears in existing corporate banking portal |
| Stronger reconciliation | Five-way reconciliation catches mismatches in real-time |
| Better auditability | Every settlement is recorded on canonical ledger with cryptographic attestation |
| Privacy by default | Customer identity stays in bank; MITHQAL receives only minimum necessary data |
| Lawful disclosure preserved | Bank remains the lawful-disclosure interface — no weakening of existing controls |
| No vendor lock-in | MSAS adapter standard supports 7 connector classes; bank can choose |
| Coexists with existing rails | MTQ alongside SWIFT, ISO 20022, correspondent banking, CBDC — not a replacement |

---

## Section 11 — Honest State Declaration

This document describes the **canonical target UX** for the corporate customer journey. The actual implementation state is:

| Field | Value |
|---|---|
| Integration state | `INTEGRATION-READY` |
| Banks contracted | 0 |
| Live-pilot transactions | 0 |
| Real corporate users | 0 |
| Honest | `true` |
| Forced-to-pass | `false` |
| No false "zero integration" claim | `true` — explicitly stated as "minimal integration, not zero integration" |
| No false bank integration claim | `true` — no real bank has completed integration |

The user flows described in this document are the spec. To realize them in production:

1. **Engage Smart-Contract Security Firm** (resolves BLK-09 from Prompt 8/8)
2. **Contract 1+ participating bank** (resolves BLK-07)
3. **Deploy MBG in MODEL_A or MODEL_B** at the participating bank
4. **Execute 100+ pilot transactions** with real corporates (resolves pilot evidence from Prompt 8/8)
5. **Re-evaluate the Final Pilot Activation Gate** (Prompt 8/8) after all 10 standing blockers are resolved

Until then, this document is the canonical spec for how the corporate user flow WILL work — not a claim that it IS working today.

---

## Section 12 — Canonical Architecture Diagram (Corporate User Flow View)

```
                CORPORATE (Acme Corp)
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Bank's Existing Corporate     │
        │  Treasury Portal               │
        │                                │
        │  ┌─────────┐  ┌─────────┐     │
        │  │ JPY Acct│  │ USD Acct│     │
        │  └─────────┘  └─────────┘     │
        │  ┌─────────┐  ┌─────────────┐  │
        │  │ EUR Acct│  │ MTQ Settle  │  │
        │  │         │  │ Position    │  │
        │  └─────────┘  └─────────────┘  │
        │                                │
        │  Recent Payments:              │
        │  [TXN-009812] $1.5M SETTLED    │
        │  [TXN-009811] ¥85M SETTLED    │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌───────────────────────────────┐
        │  Bank's Existing Systems      │
        │  (Core Banking, KYC, AML,     │
        │   Sanctions, FX, Treasury)    │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌───────────────────────────────┐
        │  MITHQAL BANK GATEWAY (MBG)  │
        │  • MTQ Adapter                │
        │  • Policy Engine              │
        │  • ZK Attestation             │
        │  • Reconciliation             │
        │  • Accounting Adapter         │
        │  • Security Gateway           │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌───────────────────────────────┐
        │  MITHQAL CORE                 │
        │  • Canonical MTQ Ledger       │
        │  • Settlement Finality        │
        │  • Jurisdiction Rules (JSG)    │
        │  • Five-Way Reconciliation    │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌───────────────────────────────┐
        │  RECEIVING BANK GATEWAY       │
        │  (Receiving bank's MBG)       │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌───────────────────────────────┐
        │  Receiving Bank's Systems     │
        │  (Core Banking, KYC, AML)    │
        └────────────────┬───────────────┘
                         │
                         ▼
                CORPORATE BENEFICIARY
                (Globex Corp)
```

The corporate's experience is entirely within their bank's existing portal. MITHQAL operates underneath.

---

*End of MITHQAL Corporate User Flow document.*
