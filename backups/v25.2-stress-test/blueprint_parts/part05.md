# MITHQAL MASTER BLUEPRINT v25.2 — PART 05

**Sections 17–20 — Bank Default · Legal Liability · Licensing · Systemic Exposure**

**Task ID:** BP-SEC-05
**Directive Sections:** §48, §49, §50, §52
**Source of Truth Status:** SINGLE SOURCE OF TRUTH — CONTROLLING
**Version:** v25.2 (FINAL)
**Date:** 2026-08-22
**Status Flag:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
**Honest-State Discipline:** §74 — exact values quoted verbatim; no claim of production-authorization.

---

## TABLE OF CONTENTS — PART 05

- Section 17 — Bank Default & Resolution Framework (§48)
- Section 18 — Legal Liability Framework (§49)
- Section 19 — Licensing / Entity Matrix (§50)
- Section 20 — Systemic Exposure Engine (§52)
- Appendix 5.A — Cross-Section Consistency Map
- Appendix 5.B — Honest-State Field Reference (§74)
- Appendix 5.C — Source File Reference Index

---

# SECTION 17 — BANK DEFAULT & RESOLUTION FRAMEWORK (§48)

## 17.0 Module Identity

| Field | Value |
|---|---|
| Module ID | `v25.2-bank-default-resolution-1.0` |
| Spec version | v25.2 §48 — Bank Default & Resolution Framework |
| Directive section | §48 |
| Source file | `src/lib/bank-default-resolution.ts` (1,044 lines) |
| Final status | SPECIFIED, NOT CONTRACTED. APPROVED FOR INSTITUTIONAL ENGAGEMENT (banks, regulators, resolution authorities). NOT PRODUCTION-AUTHORIZED. |
| Final status color | AMBER |
| Controlling principle | **MITHQAL IS NOT THE FINANCIAL GUARANTOR.** |

The §48 framework specifies what happens to MTQ — and to MTQ holders — when a
participating MTQ-issuing bank weakens, defaults, becomes insolvent, enters
resolution, or exits the MITHQAL system. It is the contractual and legal
framework that any MTQ holder, receiving bank, regulator, or resolution
authority can rely upon to answer the eleven canonical questions enumerated
in §17.7 below.

The framework is **specified** — meaning the model exists, is internally
consistent, and is reflected in `src/lib/bank-default-resolution.ts`. It is
**not contracted** — meaning no real participating bank has signed the
contractual annex that codifies these obligations, and no real jurisdiction
has legally validated the segregation of the Protected Backing Cell.

## 17.1 Controlling Principle — MITHQAL is NOT the Financial Guarantor

This principle is stated repeatedly throughout §48 and is the
non-negotiable controlling invariant of the entire module. It is exported
as the literal string constant:

```
PRINCIPLE = "MITHQAL is NOT the financial guarantor"
```

### 17.1.1 What MITHQAL Operates

MITHQAL performs, and limits itself to, the following institutional
functions:

1. **Operates the protocol.** MITHQAL runs the technical systems that
   accept mint requests, verify backing, authorize issuance, record
   transfers, and reconcile balances. MITHQAL does not perform banking.
2. **Verifies backing.** MITHQAL confirms that the Protected Backing Cell
   held by a participating bank contains assets at least equal to the bank's
   on-chain MTQ supply, applying the 130% strategic reserve target.
3. **Applies constitutional rules.** MITHQAL enforces the reserve
   composition corridors, the concentration limits (§52), the currency
   lifecycle (§V25.2 reserve spec), and the finality invariants (§46).
4. **Calculates issuance capacity.** MITHQAL computes the dynamic monetary
   control equation (DMCE) inputs and the bank's verified issuance capacity,
   and refuses to authorize issuance beyond verified capacity.
5. **Authorizes issuance.** MITHQAL signs the issuance authorization that
   the on-chain mint contract requires before new MTQ can be created.
6. **Reconciles.** MITHQAL continuously reconciles on-chain supply
   (`S_bank`) against the Protected Backing Cell balance, on the cadence
   required by the bank's lifecycle state (see §17.4).
7. **Monitors systemic risk.** MITHQAL operates the §52 Systemic Exposure
   Engine across 13 concentration dimensions and surfaces concentration
   breaches for governance review.

### 17.1.2 What MITHQAL Does NOT Do

MITHQAL does NOT perform — and contractually commits to not perform — any
of the following:

1. **Does NOT guarantee the solvency of participating banks.** A bank's
   solvency is the bank's obligation and is supervised by the bank's home
   regulator. MITHQAL is not the bank's supervisor.
2. **Does NOT indemnify holders against bank default.** No MTQ holder has
   a claim against MITHQAL if a participating bank defaults, suspends
   redemptions, or fails. The holder's claim is against the issuing bank
   (the obligor) and against the Protected Backing Cell held for the
   benefit of holders.
3. **Does NOT step into the shoes of a bank's resolution authority.** When
   a bank enters resolution, the resolution authority (the bank's home
   regulator, deposit insurer, or central bank) controls the resolution.
   MITHQAL provides data and reconciliation; it does not direct the
   resolution.
4. **Does NOT hold the Protected Backing Cell.** The cell is held by the
   issuing bank (bank-side custody) or by a qualified custodian designated
   by the bank. MITHQAL verifies the cell; it does not custody it.
5. **Does NOT absorb losses.** If a Protected Backing Cell is insufficient
   to satisfy all holder claims at par, the shortfall is borne by the
   bank's shareholders, subordinated creditors, general creditors, and
   (where applicable) the deposit insurer / resolution fund — in that
   order. MITHQAL absorbs zero losses.
6. **Does NOT halt on-chain transfers.** MITHQAL is chain-neutral. The
   bank's gateway may be suspended by regulatory action, but on-chain MTQ
   held in non-custodial wallets or with other participating banks
   continues to transfer freely.
7. **Does NOT print money to make holders whole.** MITHQAL's issuance
   capacity is bounded by the constitutional reserve requirements; there
   is no emergency issuance power that would dilute existing holders to
   cover a failed bank's liabilities.
8. **Does NOT act as a deposit insurer.** No MTQ balance is insured by
   MITHQAL. Where deposit insurance applies (e.g., FDIC insurance in the
   US for qualifying deposits), it applies to the bank's deposit
   liabilities — which MTQ is not (MTQ is not a deposit; it is a
   settlement instrument backed by earmarked assets).
9. **Does NOT act as a lender of last resort.** Emergency liquidity
   assistance is the function of the central bank of the bank's home
   jurisdiction, not MITHQAL.
10. **Does NOT represent that the framework is contracted.** The
    framework is SPECIFIED and APPROVED FOR INSTITUTIONAL ENGAGEMENT
    (banks, regulators, resolution authorities may review it); it is NOT
    production-authorized (§74 honest state).

### 17.1.3 Implications of the Principle

The principle — "MITHQAL is NOT the financial guarantor" — has the
following direct implications for every counterparty in the system:

- For a **MTQ holder:** your counterparty is the issuing bank, not
  MITHQAL. Your ultimate source of recovery is (a) the Protected
  Backing Cell, which is earmarked customer property segregated from the
  bank's general estate, and (b) any residual claim against the bank's
  estate in resolution.
- For a **participating bank:** the bank, not MITHQAL, is the obligor.
  The bank must hold the Protected Backing Cell; the bank must honor
  redemptions; the bank must file its own regulatory returns; the bank
  must bear its own losses.
- For a **receiving bank:** when you accept incoming MTQ that originated
  from another bank, you draw on the originating bank's Protected
  Backing Cell via the cross-bank reconciliation protocol. You are NOT
  required to advance your own funds to make the migrating holders whole.
- For a **regulator / resolution authority:** you retain full control of
  the bank. MITHQAL cooperates with you (data, reconciliation, proof-of-
  liabilities receipts) but does not direct or constrain your resolution
  choices.
- For **MITHQAL itself:** the protocol survives any single bank failure.
  The system's continuity does not depend on MITHQAL indemnifying anyone.

## 17.2 Eight-State Lifecycle Overview

§48 defines the eight-state lifecycle for a participating MTQ-issuing
bank, in degradation order:

```
ACTIVE → RESTRICTED → LIQUIDITY_STRESS → SUSPENDED → DEFAULT →
INSOLVENT → RESOLUTION → EXIT
```

The lifecycle is **forward-only by default**. Recovery (e.g., transition
from `SUSPENDED` back to `ACTIVE` after corrective action) is permitted
by the framework but is **out of scope for this engine** — recovery
transitions require explicit regulatory / legal action that this engine
does not auto-trigger. The engine models only forward transitions.

### 17.2.1 Lifecycle States (Summary)

| # | State | Trigger (signal) | One-line characterization |
|---|---|---|---|
| 1 | `ACTIVE` | (initial) | Bank is healthy; full MTQ issuance, transfer, redemption. |
| 2 | `RESTRICTED` | `capitalAdequacyBreach` | Bank capital adequacy breached; issuance throttled. |
| 3 | `LIQUIDITY_STRESS` | `liquidityStress` | Bank LCR < 1.0; issuance suspended, redemption queue. |
| 4 | `SUSPENDED` | `regulatoryAction` | Regulatory action; bank operations frozen at source. |
| 5 | `DEFAULT` | `defaultDeclared` | Bank has defaulted on payment obligations. |
| 6 | `INSOLVENT` | `insolvencyDeclared` | Bankruptcy declared; liabilities exceed assets. |
| 7 | `RESOLUTION` | `resolutionTriggered` | Resolution authority executing resolution tools. |
| 8 | `EXIT` | `exitCompleted` | Bank wound down / exited the MITHQAL system. |

### 17.2.2 Signal Priority

When multiple signals are observed simultaneously, the most-severe (per
the priority order below) wins, but only if its target state is strictly
further along the lifecycle than the current state. Signal priority
(highest first):

1. `exitCompleted` → `EXIT`
2. `resolutionTriggered` → `RESOLUTION`
3. `insolvencyDeclared` → `INSOLVENT`
4. `defaultDeclared` → `DEFAULT`
5. `regulatoryAction` → `SUSPENDED`
6. `liquidityStress` → `LIQUIDITY_STRESS`
7. `capitalAdequacyBreach` → `RESTRICTED`

### 17.2.3 Nine Behavioral Dimensions per State

Each of the eight states is fully specified across nine behavioral
dimensions:

1. `newIssuance` — can the bank issue NEW MTQ against its Protected
   Backing Cell?
2. `existingTransfer` — can already-issued MTQ (held in wallets or with
   other banks) transfer on-chain or be re-deposited?
3. `redemption` — can holders redeem MTQ for fiat / asset through THIS
   bank?
4. `backingStatus` — state of the Protected Backing Cell.
5. `liquidity` — bank liquidity status (LCR, redemption buffer, etc.).
6. `customerTreatment` — how MTQ holders are treated at this state.
7. `receivingBankTreatment` — how a different participating bank treats
   incoming MTQ that originated from / passed through this bank.
8. `reconciliation` — reconciliation procedure with MITHQAL, custodians,
   regulators.
9. `resolutionProcedure` — the resolution procedure active at this state.

These dimensions are CONTRACTUAL PROSE (string fields), not discrete
flags. This design choice reflects that the answers to these questions
are legal and operational statements, not boolean gates.

## 17.3 State 1 — `ACTIVE`

### 17.3.1 Definition

`ACTIVE` is the initial and normal lifecycle state. A participating bank
in `ACTIVE` is healthy: it satisfies its regulatory capital and
liquidity requirements, its Protected Backing Cell is fully funded at or
above the 130% strategic reserve target, and it operates all MITHQAL
functions normally.

### 17.3.2 Nine Behavioral Dimensions

#### 17.3.2.1 `newIssuance`
**ALLOWED** — Bank may issue new MTQ up to its verified issuance capacity,
backed 1:1+ by its Protected Backing Cell at the 130% strategic target.
MITHQAL verifies backing and authorizes issuance per the DMCE
calculations in `mtq-final-reserve-spec.ts`.

#### 17.3.2.2 `existingTransfer`
**ALLOWED** — On-chain MTQ transfers freely between wallets and
participating banks. MITHQAL is chain-neutral and does not gate
transfers between healthy institutions. A transfer of MTQ from a holder
at one `ACTIVE` bank to a holder at another `ACTIVE` bank is processed
through the receiving bank's standard chain-transfer protocol.

#### 17.3.2.3 `redemption`
**ALLOWED** — Holders may redeem MTQ through the issuing bank on the
normal redemption queue per the redemption-continuity framework (§V25.2
redemption-continuity state = `NORMAL`). The bank honors redemptions in
fiat or asset at par (PAR = 1.00 USD per §2 of the reserve spec).

#### 17.3.2.4 `backingStatus`
**FULLY_BACKED** — The Protected Backing Cell holds ≥ 100% of issued MTQ
liability (target 130% strategic). The cell is earmarked and segregated
from the bank's general estate under banking law. The bank's general
creditors have no claim on the cell's assets.

#### 17.3.2.5 `liquidity`
**ADEQUATE** — Bank LCR ≥ 1.0, redemption buffer ≥ 2% of reserves, MTQ
redemption continuity state = `NORMAL`. The bank meets all Basel III
liquidity standards as enforced by its home regulator.

#### 17.3.2.6 `customerTreatment`
Normal banking services. Holders can deposit, transfer, redeem. No
special communication is required beyond routine disclosures (periodic
proof-of-reserves attestations, regulatory disclosures the bank is
already obliged to make).

#### 17.3.2.7 `receivingBankTreatment`
Accept incoming MTQ without restriction. Standard daily reconciliation
applies. No enhanced monitoring.

#### 17.3.2.8 `reconciliation`
Daily reconciliation per the bank-onboarding spec. MITHQAL verifies the
Protected Backing Cell balance against on-chain supply `S_bank`,
publishes a daily proof-of-reserves summary, and confirms that
issuance capacity is positive.

#### 17.3.2.9 `resolutionProcedure`
None — preventive monitoring only. MITHQAL monitors capital adequacy,
LCR, and redemption-continuity state continuously. If any signal
breaches the §17.2.2 trigger threshold, the engine transitions the bank
to `RESTRICTED` (or further, depending on the signal).

## 17.4 State 2 — `RESTRICTED`

### 17.4.1 Definition

`RESTRICTED` indicates the bank has breached its regulatory capital
adequacy minimum. The bank's supervisory authority has been notified
(or will be; MITHQAL coordinates but does not supervise). The bank
remains operational and solvent, but its capital position requires
corrective action.

### 17.4.2 Nine Behavioral Dimensions

#### 17.4.2.1 `newIssuance`
**CONDITIONAL** — Issuance capacity is throttled to ≤ 40% of verified
capacity. New issuance requires enhanced MITHQAL review and evidence
of full backing (cell-side), even though the bank's weakness is on its
capital side (general balance sheet), not on the cell side.

#### 17.4.2.2 `existingTransfer`
**ALLOWED** — On-chain MTQ continues to transfer freely. Existing
supply is unaffected by the bank's capital position; chain neutrality
is preserved. Holders may move MTQ to other wallets or banks at any
time.

#### 17.4.2.3 `redemption`
**ALLOWED** — Redemptions continue normally. The bank's capital
weakness does not (yet) impact its ability to honor redemptions. If
redemption-continuity state has not yet degraded to `STRESS`, the bank
honors redemptions at par on the normal queue.

#### 17.4.2.4 `backingStatus`
**FULLY_BACKED** — The Protected Backing Cell still holds ≥ 100% of
issued MTQ. The bank's weakness is on its capital side (general balance
sheet), not on the cell side. Cell segregation is preserved and
legally robust.

#### 17.4.2.5 `liquidity`
**MONITORING** — Bank LCR still ≥ 1.0 but trending. Redemption
continuity state = `ELEVATED`. Enhanced surveillance by MITHQAL: the
reconciliation cadence doubles (see §17.4.2.8).

#### 17.4.2.6 `customerTreatment`
Normal services but with proactive disclosure. The bank must publish a
capital restoration plan (typically filed with its home regulator and
disclosed to the public per the regulator's disclosure rules). Holders
may begin to migrate to other participating banks if they choose; no
penalty applies.

#### 17.4.2.7 `receivingBankTreatment`
Accept incoming MTQ. Begin concentration monitoring: track incoming MTQ
volume from the restricted bank against per-bank exposure limits (§52).
No restriction on acceptance.

#### 17.4.2.8 `reconciliation`
Enhanced reconciliation — twice daily. MITHQAL verifies backing and
capital restoration progress. The bank reports daily on capital ratios,
large exposures, and large redemption requests.

#### 17.4.2.9 `resolutionProcedure`
Corrective action plan agreed with the bank's regulator (NOT MITHQAL).
MITHQAL coordinates with the regulator on issuance-capacity throttling
but does NOT become the bank's supervisor. The bank's home regulator
retains all supervisory authority; MITHQAL's role is protocol-level
issuance throttling and reconciliation.

## 17.5 State 3 — `LIQUIDITY_STRESS`

### 17.5.1 Definition

`LIQUIDITY_STRESS` indicates the bank's LCR has fallen below 1.0 (it
no longer holds sufficient high-quality liquid assets to meet
projected 30-day net cash outflows), OR the redemption-continuity state
has transitioned to `STRESS`. This is a LIQUIDITY problem, not a
SOLVENCY problem: the bank's Protected Backing Cell is intact and
fully backed, but the bank cannot immediately convert all of its
assets to settlement currency at par.

### 17.5.2 Nine Behavioral Dimensions

#### 17.5.2.1 `newIssuance`
**SUSPENDED** — No new issuance. The bank's Protected Backing Cell is
preserved for existing supply only; no new MTQ may be created against
it while the bank is in liquidity stress. This is a defensive measure
to prevent the bank from issuing fresh MTQ against cell-side backing
that may be required to honor existing redemptions.

#### 17.5.2.2 `existingTransfer`
**ALLOWED** — On-chain MTQ continues to transfer. Chain neutrality is
preserved. Holders may move MTQ to other banks or wallets at any time,
and many will choose to do so as the redemption queue lengthens.

#### 17.5.2.3 `redemption`
**THROTTLED** — Redemption queue activated per the redemption-continuity
framework (`DEFENSIVE` / `STRESS` state). Large redemptions require
pre-notification. Equal-treatment queue enforced (no preference for
large holders over small holders, or for institutional over retail).

#### 17.5.2.4 `backingStatus`
**FULLY_BACKED** — The Protected Backing Cell holds ≥ 100% of issued
MTQ. This is a LIQUIDITY problem, not a SOLVENCY problem: the backing
exists but the bank cannot immediately convert it to settlement
currency at par. The cell remains earmarked and segregated; the bank's
general creditors have no claim on it.

#### 17.5.2.5 `liquidity`
**STRESSED** — Bank LCR < 1.0. Redemption continuity state = `STRESS`.
The bank draws on its front-line HQLA (high-quality liquid assets);
emergency liquidity facility (the bank's central bank, NOT MITHQAL)
may be invoked. MITHQAL is not the lender of last resort.

#### 17.5.2.6 `customerTreatment`
Transparent communication. Holders informed of redemption queue and
estimated settlement times. No new issuance. Holders may freely
transfer MTQ to other participating banks for normal redemption
service.

#### 17.5.2.7 `receivingBankTreatment`
Accept incoming MTQ. Flag for enhanced concentration monitoring.
Coordinate with MITHQAL on whether the receiving bank should stand
ready to provide redemption service for migrating holders (drawing on
the stressed bank's cell via cross-bank reconciliation, NOT on the
receiving bank's own balance sheet).

#### 17.5.2.8 `reconciliation`
Hourly reconciliation. MITHQAL tracks redemption queue depth, front-line
HQLA drawdown, and Protected Backing Cell integrity in near-real-time.
The hourly cadence is intended to detect any cell-side impairment quickly
and to provide the bank's regulator with the data needed to decide
whether to trigger a `SUSPENDED` transition.

#### 17.5.2.9 `resolutionProcedure`
Emergency liquidity facility engaged with the bank's central bank /
lender of last resort (NOT MITHQAL — MITHQAL is not the financial
guarantor). If liquidity cannot be restored, transition to `SUSPENDED`
on regulatory action. The decision to suspend rests with the regulator,
not MITHQAL.

## 17.6 State 4 — `SUSPENDED`

### 17.6.1 Definition

`SUSPENDED` indicates that the bank's home regulator has suspended the
bank's operations by regulatory action. The bank's gateway is frozen at
the source; the bank cannot process new transfers or redemptions through
its own systems. The on-chain MTQ supply is unaffected; chain neutrality
is absolute.

### 17.6.2 Nine Behavioral Dimensions

#### 17.6.2.1 `newIssuance`
**PROHIBITED** — No new issuance. The bank's MTQ issuance gateway is
suspended at the source by regulatory action. MITHQAL has revoked
issuance authorization.

#### 17.6.2.2 `existingTransfer`
**CHAIN_NEUTRAL** — The suspended bank cannot process new transfers
through ITS gateway, but on-chain MTQ continues to transfer between
other wallets and participating banks. MITHQAL cannot and does not
halt on-chain transfers; chain neutrality is absolute.

#### 17.6.2.3 `redemption`
**SUSPENDED_AT_SOURCE** — The suspended bank cannot process redemptions
through its gateway. Holders may redeem by transferring their MTQ to a
different participating bank (chain transfer) and redeeming there,
subject to that bank's reconciliation under the cross-bank
reconciliation protocol.

#### 17.6.2.4 `backingStatus`
**PRESERVED** — The Protected Backing Cell is preserved and locked.
Backing is NOT impaired; the bank's operational status is suspended,
not its balance sheet. The cell remains earmarked for MTQ holders.

#### 17.6.2.5 `liquidity`
**LOCKED** — Bank liquidity operations are frozen by regulatory action.
Cell-side backing remains intact and is verified by MITHQAL at the
snapshot reconciliation (see §17.6.2.8).

#### 17.6.2.6 `customerTreatment`
Notification issued by the regulator (suspension order) and by MITHQAL
(protocol-level notice). Holders may continue to hold, transfer to
other banks, or redeem via other participating banks. No loss of MTQ
value or backing occurs as a direct consequence of the suspension.

#### 17.6.2.7 `receivingBankTreatment`
Accept incoming MTQ (chain neutrality). Perform full snapshot
reconciliation against the suspended bank's last verified state.
Receiving bank honors normal redemption service for migrating holders,
drawing on the suspended bank's Protected Backing Cell via the
cross-bank reconciliation protocol (NOT on the receiving bank's own
balance sheet).

#### 17.6.2.8 `reconciliation`
Full snapshot reconciliation. MITHQAL captures the suspended bank's
on-chain supply `S_bank`, Protected Backing Cell balance, and
outstanding redemption queue. The snapshot is shared with the regulator
and any acquiring bank. The snapshot is the authoritative reference
state from which any subsequent resolution action proceeds.

#### 17.6.2.9 `resolutionProcedure`
Regulatory intervention. The regulator (NOT MITHQAL) decides whether
to (a) lift the suspension and restore `ACTIVE` status after corrective
action (recovery, out of scope for this engine but permitted by the
framework), (b) declare payment default (transition to `DEFAULT`), or
(c) move directly to insolvency / resolution (transition to `INSOLVENT`
or `RESOLUTION`). MITHQAL coordinates data sharing but does NOT make
the regulatory decision.

## 17.7 State 5 — `DEFAULT`

### 17.7.1 Definition

`DEFAULT` indicates that the bank has defaulted on a payment obligation.
This may be a missed payment to a counterparty, a breach of a covenant
that triggers an event of default, or a regulator-declared default.
Issuance authorization is permanently revoked. The MTQ itself is NOT in
default — only the bank is. Existing MTQ remains valid on-chain.

### 17.7.2 Nine Behavioral Dimensions

#### 17.7.2.1 `newIssuance`
**PROHIBITED** — No new issuance. The bank has defaulted on payment
obligations; MITHQAL has revoked issuance authorization. This is a
terminal condition for the bank's issuance privilege.

#### 17.7.2.2 `existingTransfer`
**CHAIN_NEUTRAL** — On-chain MTQ continues to transfer. MITHQAL cannot
halt chain transfers. Existing supply remains valid; the MTQ itself
is not in default — only the bank is.

#### 17.7.2.3 `redemption`
**CLAIM_FROZEN_AT_DEFAULTING_BANK** — The defaulting bank cannot
process redemptions. Holders may transfer MTQ to other participating
banks for redemption, drawing on the Protected Backing Cell via the
cross-bank reconciliation protocol. Any unredeemed balance becomes a
holder claim against the defaulting bank's estate (see contractual
question 3 in §17.13).

#### 17.7.2.4 `backingStatus`
**PROTECTED_BACKING_HELD** — The Protected Backing Cell is segregated /
earmarked from the bank's general estate under banking law. The cell
is held for the benefit of MTQ holders and is NOT available to the
bank's general creditors. MITHQAL verifies cell integrity continuously
and reports any cell-side shortfall as an honest disclosure (MITHQAL
does NOT cover the shortfall).

#### 17.7.2.5 `liquidity`
**ZERO** — The bank cannot meet payment obligations in normal course.
Liquidity is exhausted at the bank level; the cell-side backing
remains intact.

#### 17.7.2.6 `customerTreatment`
Holders are informed of the default and of their claim path:
(a) transfer MTQ to another participating bank and redeem via the
cross-bank reconciliation protocol against the Protected Backing
Cell, or (b) file a claim in the bank's resolution proceeding.
MITHQAL provides the reconciliation data holders need; MITHQAL does
NOT indemnify holders.

#### 17.7.2.7 `receivingBankTreatment`
Accept incoming MTQ (chain neutrality). Perform forensic
reconciliation per the forensic-rr-reconciliation spec against the
defaulting bank's snapshot. Receiving bank may redeem incoming MTQ
against the Protected Backing Cell via the cross-bank reconciliation
protocol — the receiving bank is NOT required to advance its own funds
to make holders whole.

#### 17.7.2.8 `reconciliation`
Forensic reconciliation per `forensic-rr-reconciliation.ts`. MITHQAL
produces a definitive on-chain-vs-backing reconciliation: `S_bank`
(on-chain supply) vs Protected Backing Cell (earmarked assets). Any
shortfall triggers an honest shortfall disclosure (MITHQAL does NOT
cover the shortfall).

#### 17.7.2.9 `resolutionProcedure`
MITHQAL triggers resolution-proceedings coordination. The resolution
authority (regulator / deposit insurer / central bank, NOT MITHQAL)
decides whether to attempt recovery, declare insolvency, or open
resolution tools. If insolvency is declared, transition to `INSOLVENT`.

## 17.8 State 6 — `INSOLVENT`

### 17.8.1 Definition

`INSOLVENT` indicates that bankruptcy has been formally declared by a
court or regulator. The bank's liabilities exceed its assets. The
Protected Backing Cell — being earmarked customer property under
banking law — is legally sequestered from the bankruptcy estate and is
returned to MTQ holders preferentially (pari passu at minimum,
preferential ideally per jurisdiction).

### 17.8.2 Nine Behavioral Dimensions

#### 17.8.2.1 `newIssuance`
**PROHIBITED** — Issuance authorization is permanently revoked. The
bank cannot issue MTQ in any state going forward.

#### 17.8.2.2 `existingTransfer`
**CHAIN_NEUTRAL** — On-chain MTQ continues to transfer. MITHQAL remains
chain-neutral; the bankruptcy of one participating bank does not
invalidate the MTQ supply. Holders may continue to hold, transfer, or
redeem via other participating banks.

#### 17.8.2.3 `redemption`
**CLAIM_IN_BANKRUPTCY** — Holders' redemption right becomes a claim in
the bank's insolvency proceeding. The Protected Backing Cell, being
earmarked / segregated customer property under banking law, is returned
to MTQ holders preferentially (pari passu at minimum, preferential
ideally per jurisdiction).

#### 17.8.2.4 `backingStatus`
**PROTECTED_BACKING_SEQUESTERED** — The Protected Backing Cell is
legally sequestered from the bankruptcy estate. The cell is distributed
to MTQ holders (and to acquiring banks on behalf of migrated holders)
under court / resolution-authority supervision. MITHQAL provides the
reconciliation data the court needs.

#### 17.8.2.5 `liquidity`
**ZERO** — Bank is in formal insolvency. No liquidity operations.

#### 17.8.2.6 `customerTreatment`
Holders file a claim in the insolvency proceeding. MITHQAL provides
each holder with a cryptographic proof-of-liability receipt (per
`proof-of-liabilities.ts`) that the holder can submit to the court /
resolution authority. The Protected Backing Cell is returned to holders
preferentially; any shortfall becomes a general unsecured claim (NOT
covered by MITHQAL).

#### 17.8.2.7 `receivingBankTreatment`
Accept incoming MTQ (chain neutrality). Reconciliation with the
insolvency administrator / resolution authority. Receiving bank may
redeem incoming MTQ against the Protected Backing Cell under court
supervision, on behalf of migrated holders.

#### 17.8.2.8 `reconciliation`
Insolvency-led reconciliation. MITHQAL cooperates with the insolvency
administrator: provides the on-chain supply record, the Protected
Backing Cell reconciliation, the per-holder proof-of-liabilities
receipts, and the historical issuance / redemption audit trail.

#### 17.8.2.9 `resolutionProcedure`
Resolution authority takes control. If resolution tools are invoked
(bail-in, sale, bridge bank), transition to `RESOLUTION`. If the bank
is wound down directly, transition to `EXIT` after the cell is
distributed and claims are settled.

## 17.9 State 7 — `RESOLUTION`

### 17.9.1 Definition

`RESOLUTION` indicates that the bank's resolution authority is
executing resolution tools. Resolution tools may include bail-in
(conversion of liabilities to equity), sale of business, or transfer
to a bridge bank. The Protected Backing Cell is transferred to the
successor entity (bridge bank, purchaser, or resolution fund), where
it remains earmarked for MTQ holders' benefit.

### 17.9.2 Nine Behavioral Dimensions

#### 17.9.2.1 `newIssuance`
**PROHIBITED** — The bank is under resolution; no new issuance. Any
successor entity (bridge bank, purchaser) must be separately onboarded
as a participating bank before it can issue MTQ. The successor's
onboarding is independent of the failed bank's exit.

#### 17.9.2.2 `existingTransfer`
**CHAIN_NEUTRAL** — On-chain MTQ continues to transfer. Resolution
tools do not affect the chain; they affect the bank's obligations and
the Protected Backing Cell.

#### 17.9.2.3 `redemption`
**RESOLUTION_AUTHORITY_CONTROLLED** — The resolution authority controls
the redemption / claims process. Holders redeem via the resolution
authority's mechanism (bail-in conversion, transfer to bridge bank,
claim payout). MITHQAL provides reconciliation data but does NOT control
the resolution.

#### 17.9.2.4 `backingStatus`
**TRANSFERRED_TO_RESOLVED_ENTITY** — The Protected Backing Cell is
transferred to the bridge bank / purchaser / resolution fund as directed
by the resolution authority. The cell remains earmarked for MTQ
holders' benefit; it is NOT absorbed into the bridge bank's general
estate. The successor entity holds the cell under the same segregation
obligations as the failed bank.

#### 17.9.2.5 `liquidity`
**UNDER_AUTHORITY** — Liquidity is managed by the resolution authority,
not by the bank or by MITHQAL.

#### 17.9.2.6 `customerTreatment`
Resolution authority communicates directly with holders. Holders' MTQ
claims are honored (a) by transfer of the cell to the bridge bank
(holders continue as MTQ holders of the bridge bank), (b) by bail-in
conversion, or (c) by claim payout. MITHQAL ensures the cell
reconciliation follows the holders, not the failed bank's general
creditors.

#### 17.9.2.7 `receivingBankTreatment`
Accept incoming MTQ (chain neutrality). Reconciliation with the
resolution authority. Receiving bank honors redemptions against the
transferred Protected Backing Cell on behalf of migrated holders, per
the resolution authority's directions.

#### 17.9.2.8 `reconciliation`
Resolution-led reconciliation. MITHQAL cooperates with the resolution
authority: provides the on-chain supply record, the Protected Backing
Cell reconciliation, the per-holder proof-of-liabilities receipts, and
the cell-transfer instructions.

#### 17.9.2.9 `resolutionProcedure`
Bail-in, sale of business, or bridge-bank transfer executed by the
resolution authority. MITHQAL coordinates data and ensures the
Protected Backing Cell is tracked to the successor entity (or
distributed to holders). When resolution is complete, transition to
`EXIT` for the failed bank.

## 17.10 State 8 — `EXIT`

### 17.10.1 Definition

`EXIT` is the terminal state. The bank has wound down and exited the
MITHQAL system. All redemption obligations have been fulfilled (via
cell transfer to an acquiring bank, claim payout, or direct redemption).
No open redemption claims remain. The bank is delisted from the
participating-bank registry.

### 17.10.2 Nine Behavioral Dimensions

#### 17.10.2.1 `newIssuance`
**PROHIBITED** — The bank has exited the MITHQAL system. It no longer
participates as an issuing bank. Any successor entity must be onboarded
separately.

#### 17.10.2.2 `existingTransfer`
**CHAIN_NEUTRAL** — Any residual on-chain MTQ continues to transfer
normally. The exit of one bank does not affect the MTQ supply or other
banks.

#### 17.10.2.3 `redemption`
**COMPLETED** — All redemption obligations of the exiting bank have
been fulfilled (via cell transfer to an acquiring bank, claim payout,
or direct redemption). No open redemption claims remain.

#### 17.10.2.4 `backingStatus`
**RETURNED_OR_TRANSFERRED** — The Protected Backing Cell has been
(a) transferred to an acquiring participating bank, (b) returned to the
MTQ holder community via the resolution authority, or (c) wound down
with all proceeds distributed to holders. No backing remains held for
this bank.

#### 17.10.2.5 `liquidity`
**NOT_APPLICABLE** — Bank is no longer in the MTQ system.

#### 17.10.2.6 `customerTreatment`
Customers have been transitioned (to an acquiring bank, to direct
redemption, or to claim payout). No open customer issues remain for
this bank. Holders' MTQ remains valid on-chain (either via the successor
entity or, where redemption has occurred, the supply has been burned).

#### 17.10.2.7 `receivingBankTreatment`
**NOT_APPLICABLE** — The exiting bank is no longer a participating
institution. It does not send or receive MTQ. Other participating banks
operate normally.

#### 17.10.2.8 `reconciliation`
**FINAL** — Final reconciliation completed. MITHQAL records the exit,
archives the bank's reconciliation history, and updates the
participating-bank registry. The bank is delisted.

#### 17.10.2.9 `resolutionProcedure`
Exit complete. The bank is delisted from the participating-bank
registry. If the bank was wound down through resolution, the resolution
authority closes its proceeding. MITHQAL records the exit in the
institutional audit trail.

## 17.11 Lifecycle Transition Engine

The engine that evaluates lifecycle transitions is implemented in
`src/lib/bank-default-resolution.ts` as the function
`assessBankTransition(currentState, signals)`.

### 17.11.1 Engine Behavior

1. **Forward-only.** The engine models forward transitions only. A
   recovery transition (e.g., from `SUSPENDED` back to `ACTIVE` after
   corrective action) is out of scope for this engine and requires
   explicit regulatory action. The engine never auto-recovers.
2. **Priority-based.** When multiple signals are true simultaneously,
   the most severe (per the §17.2.2 priority order) wins, but only if
   its target state is strictly further along the lifecycle than the
   current state.
3. **Idempotent.** If no advancing signal is true, or if all observed
   signals correspond to states at-or-before the current state, the
   bank remains in its current state.
4. **Deterministic.** Given the same `(currentState, signals)` pair,
   the engine always returns the same transition.

### 17.11.2 Engine Output

The engine returns a `BankLifecycleTransition` object containing:

- `from` — state before the transition.
- `to` — state after the transition (may equal `from` if no
  transition fires).
- `transitioned` — boolean, true if a transition occurred.
- `trigger` — the signal that drove the transition (null if no
  transition).
- `reason` — human-readable reason for the transition (or for no
  transition).
- `signals` — snapshot of the signals evaluated.

### 17.11.3 Scenario Simulation

The engine also supports scenario simulation via
`simulateBankDefaultScenario(startState, signalSequence)`, which walks
through a sequence of signal observations one step per time period.
This is used in the illustrative example in §17.16 below.

## 17.12 What Happens to MTQ If a Bank Defaults?

This is one of the most important questions the §48 framework must
answer. The full answer is given in contractual question 4 (§17.13.4)
and question 5 (§17.13.5) below; the summary is:

### 17.12.1 The MTQ Itself Does Not Default

When a participating bank defaults, only the bank defaults. The MTQ
issued by that bank remains valid on-chain. The MTQ represents:

1. A claim on the Protected Backing Cell (earmarked customer property).
2. A residual claim on the bank's estate in resolution.

The MTQ's on-chain existence is independent of the bank's operational
status. The bank's gateway may be suspended, but on-chain MTQ held in
non-custodial wallets or with other participating banks continues to
transfer freely.

### 17.12.2 The Chain Survives

MITHQAL is chain-neutral. The failure of one participating bank does
not invalidate the MTQ supply, the chain's consensus, or the protocol's
operation. Other participating banks continue to operate normally.
The system's continuity does not depend on any single bank's health.

### 17.12.3 Holders Have Three Options

A holder of MTQ issued by a defaulting bank has three options:

1. **Hold.** Continue to hold the MTQ. The MTQ remains valid on-chain.
   The holder's claim against the bank's Protected Backing Cell and
   residual claim against the bank's estate are preserved.
2. **Transfer to another participating bank.** Move the MTQ to a
   different participating bank via a chain transfer, then redeem via
   the cross-bank reconciliation protocol (which draws on the failing
   bank's cell, not the receiving bank's balance sheet).
3. **File a claim in the bank's resolution proceeding.** Submit the
   proof-of-liabilities receipt (provided by MITHQAL) to the resolution
   authority as evidence of the holder's claim against the cell and
   the estate.

## 17.13 The Eleven Contractual Questions

The §48 framework MUST answer the eleven canonical questions below.
Each question is presented with: the question itself, the framework's
binding answer, the controlling principle, and an explanation of why
the question matters and what the answer determines.

### 17.13.1 Question 1 — Who owes the holder?

**Question:** Who owes the holder?

**Answer:** The issuing bank owes the holder. The bank is the holder's
counterparty, not MITHQAL. The bank's obligation is to redeem MTQ at
par (against its Protected Backing Cell) and to honor transfers. In
default / insolvency, the holder's claim is against the bank's estate
and against the Protected Backing Cell (which is earmarked customer
property, not general estate).

**Principle:** MITHQAL is NOT the financial guarantor.

**Why it matters:** This question determines who the holder must sue
if their redemption is refused, and whose estate they must claim
against in insolvency. If the holder believed MITHQAL owed them, they
would waste time pursuing MITHQAL (which has no obligation) instead of
the bank.

**What it determines:** The legal counterparty, the venue for dispute
resolution (the bank's home jurisdiction), and the priority of the
holder's claim (earmarked customer property > general unsecured).

### 17.13.2 Question 2 — Who owes the receiving bank?

**Question:** Who owes the receiving bank?

**Answer:** The originating (defaulting) bank owes the receiving bank
for any MTQ the receiving bank honors on behalf of migrated holders
via the cross-bank reconciliation protocol. The receiving bank draws
on the originating bank's Protected Backing Cell, not on its own
balance sheet. MITHQAL facilitates the reconciliation but is not a
debtor in this relationship.

**Principle:** MITHQAL is NOT the financial guarantor.

**Why it matters:** Receiving banks need to know that accepting
incoming MTQ from a failing bank does NOT expose them to loss. If the
receiving bank were required to advance its own funds, no rational
bank would accept incoming MTQ during a counterparty failure, and
holders would be stranded.

**What it determines:** The cross-bank reconciliation protocol's
mechanics (receiving bank draws on the originating cell, not its own
balance sheet); the receiving bank's risk appetite for incoming MTQ
during a counterparty event (which should be unlimited, because the
receiving bank is not at risk).

### 17.13.3 Question 3 — What is the holder's claim?

**Question:** What is the holder's claim?

**Answer:** The holder's claim is (a) a redemption claim against the
Protected Backing Cell (earmarked customer property, returned
preferentially in insolvency), and (b) to the extent the cell is
insufficient, a general unsecured claim against the bank's estate in
resolution. The claim is denominated in the MTQ par value (PAR = 1.00
USD per §2 of the reserve spec). MITHQAL provides the
proof-of-liabilities receipt; it does NOT guarantee the claim.

**Principle:** MITHQAL is NOT the financial guarantor.

**Why it matters:** Holders need to know the seniority of their claim
(preferential to the extent of the cell, unsecured for any shortfall).
This determines the expected recovery in insolvency and the price at
which MTQ would trade in a secondary market during a bank failure.

**What it determines:** The expected recovery rate in insolvency; the
legal category of the holder's claim; the proof-of-liabilities receipt
format the holder needs to submit to the resolution authority.

### 17.13.4 Question 4 — What happens to existing MTQ?

**Question:** What happens to existing MTQ?

**Answer:** Existing MTQ remains valid. The MTQ is on-chain and is NOT
invalidated by the failure of its issuing bank. The MTQ represents a
claim on the Protected Backing Cell and a residual claim on the bank's
estate. Holders may continue to hold, transfer, or redeem (via another
participating bank).

**Principle:** Chain neutrality — MTQ supply survives bank failure.

**Why it matters:** This is the foundational continuity property of
the system. If MTQ were invalidated by bank failure, every holder of
every MTQ issued by a failing bank would lose everything, which would
destroy confidence in the system within hours of any bank stress
event. Chain neutrality ensures that bank failures do not cascade
into MTQ failures.

**What it determines:** The system's resilience to bank failure; the
holder's three options (hold, transfer-and-redeem, file-claim) upon
their bank's failure; the system-wide continuity guarantee.

### 17.13.5 Question 5 — Can it continue transferring?

**Question:** Can it continue transferring?

**Answer:** YES. On-chain transfers of MTQ continue in every state.
MITHQAL is chain-neutral and cannot halt on-chain transfers. The
bank's gateway may be suspended (in `SUSPENDED` / `DEFAULT` /
`INSOLVENT` / `RESOLUTION` / `EXIT` states), but on-chain MTQ held in
non-custodial wallets or with other participating banks transfers
freely.

**Principle:** Chain neutrality is absolute.

**Why it matters:** The transferability of MTQ during a bank failure
is what allows holders to escape a failing bank without loss. If
transfers were halted, holders would be locked into the failing bank's
redemption queue and would suffer whatever recovery the resolution
process produces — typically far below par.

**What it determines:** The holder's ability to migrate to a healthy
bank; the receiving bank's ability to accept incoming MTQ; the
system's ability to redistribute exposure away from a failing bank
without central coordination.

### 17.13.6 Question 6 — Can it redeem?

**Question:** Can it redeem?

**Answer:** Depends on state.
- `ACTIVE` / `RESTRICTED` / `LIQUIDITY_STRESS`: yes (normal / throttled).
- `SUSPENDED` / `DEFAULT` / `INSOLVENT` / `RESOLUTION`: the failing
  bank's gateway cannot redeem, BUT holders may transfer their MTQ to
  another participating bank and redeem there against the Protected
  Backing Cell via the cross-bank reconciliation protocol.
- `EXIT`: all redemptions completed.

MITHQAL never guarantees redemption; it provides the reconciliation
that makes redemption possible.

**Principle:** MITHQAL is NOT the financial guarantor.

**Why it matters:** This question establishes the conditions under
which a holder can convert MTQ to fiat / asset. It also makes clear
that even when the failing bank cannot redeem directly, the holder can
still redeem via another bank — provided the cross-bank reconciliation
protocol works as designed.

**What it determines:** The redemption-continuity state machine; the
cross-bank reconciliation protocol's role; the receiving bank's
redemption obligation to migrating holders.

### 17.13.7 Question 7 — Who absorbs losses?

**Question:** Who absorbs losses?

**Answer:** Losses are absorbed in this order:
1. The Protected Backing Cell (earmarked customer property — first
   loss for MTQ holders is zero IF the cell is fully backed).
2. The bank's equity / shareholders.
3. The bank's subordinated debt.
4. The bank's general creditors pro rata.
5. The bank's deposit insurer / resolution fund (where applicable).

MITHQAL absorbs NO losses. MITHQAL is not the financial guarantor, not
the deposit insurer, and not the resolution fund.

**Principle:** MITHQAL is NOT the financial guarantor.

**Why it matters:** This question makes the loss-allocation
waterfall explicit. Without an explicit waterfall, all counterparties
would assume someone else absorbs the loss, and the system would
collapse in finger-pointing during the first bank failure.

**What it determines:** The expected recovery for each class of
creditor; the bank's cost of capital (equity and subordinated debt
priced in to absorb losses); the deposit insurer's exposure (where
applicable — and note that MTQ is not a deposit, so deposit
insurance typically does NOT apply to MTQ).

### 17.13.8 Question 8 — What happens to backing?

**Question:** What happens to backing?

**Answer:** The Protected Backing Cell is preserved throughout the
lifecycle.
- In `ACTIVE` / `RESTRICTED` / `LIQUIDITY_STRESS`: fully-backed,
  operationally available.
- In `SUSPENDED`: preserved and locked.
- In `DEFAULT` / `INSOLVENT`: legally sequestered from the bank's
  general estate, returned to MTQ holders preferentially.
- In `RESOLUTION`: transferred to the bridge bank / purchaser (still
  earmarked for MTQ holders).
- In `EXIT`: returned / distributed / wound down.

MITHQAL tracks the cell across all transitions; it never absorbs or
repurposes the cell.

**Principle:** Protected Backing Cell is customer property, not
MITHQAL assets.

**Why it matters:** This question establishes that the cell is
segregated customer property — not MITHQAL assets, not bank general
assets. This is the legal foundation for the preferential treatment
of MTQ holders in insolvency.

**What it determines:** The cell's legal status in each state; the
preferential treatment of MTQ holders in insolvency; the cell's
tracking through resolution (transfer to bridge bank, not absorption
into the bridge bank's general estate).

### 17.13.9 Question 9 — What does the resolution authority control?

**Question:** What does the resolution authority control?

**Answer:** The resolution authority (regulator / deposit insurer /
central bank of the bank's home jurisdiction, NOT MITHQAL) controls:
(a) the resolution tool selected (bail-in, sale, bridge bank,
wind-down); (b) the distribution of the bank's estate; (c) the
transfer of the Protected Backing Cell to a successor entity; (d)
communication with creditors.

MITHQAL provides data, reconciliation, and proof-of-liabilities
receipts, but does NOT control the resolution. MITHQAL is not the
resolution authority.

**Principle:** Resolution authority is sovereign, MITHQAL is protocol.

**Why it matters:** This question draws a bright line between
MITHQAL's protocol role and the regulator's resolution role.
Regulators will not allow a private protocol to direct the resolution
of a bank; if MITHQAL attempted to do so, regulators would shut it
down. By deferring to the regulator, MITHQAL makes itself a useful
tool for the regulator, not a threat.

**What it determines:** MITHQAL's role in resolution (data provider,
not director); the regulator's authority over the bank's estate; the
cell's transfer mechanics (regulator-directed, MITHQAL-tracked).

### 17.13.10 Question 10 — How is reconciliation performed?

**Question:** How is reconciliation performed?

**Answer:** Reconciliation is performed continuously by MITHQAL across
the lifecycle, with cadence scaled to severity:
- `ACTIVE`: daily.
- `RESTRICTED`: twice daily.
- `LIQUIDITY_STRESS`: hourly.
- `SUSPENDED`: full snapshot.
- `DEFAULT`: forensic per `forensic-rr-reconciliation.ts`.
- `INSOLVENT`: insolvency-led, court-supervised.
- `RESOLUTION`: resolution-authority-led.
- `EXIT`: final reconciliation.

MITHQAL reconciles on-chain supply `S_bank` against the Protected
Backing Cell balance, per the canonical-supply-ledger theorems (S1,
S2, S3). Any shortfall is disclosed honestly, NOT covered by MITHQAL.

**Principle:** Honest reconciliation — shortfalls disclosed, not
covered.

**Why it matters:** Reconciliation cadence is the early-warning
system. If a bank's cell-side backing starts to drift (e.g., the bank
moves cell assets to satisfy a non-MTQ obligation), the cadence
determines how quickly MITHQAL detects the drift and discloses it.
Forensic reconciliation in `DEFAULT` is the authoritative reference
for any subsequent resolution proceeding.

**What it determines:** The reconciliation cadence per state; the
forensic reconciliation procedure in `DEFAULT`; the honest-shortfall
disclosure protocol (which exposes losses to the regulator and the
public, rather than concealing them).

### 17.13.11 Question 11 — What is the customer treatment?

**Question:** What is the customer treatment?

**Answer:** Customer treatment per state:
- `ACTIVE`: normal.
- `RESTRICTED`: normal with proactive disclosure.
- `LIQUIDITY_STRESS`: redemption queue, transparent communication.
- `SUSPENDED`: notification, ability to transfer MTQ to another bank
  and redeem normally.
- `DEFAULT`: choice of (a) transfer-and-redeem via another bank, or
  (b) file claim.
- `INSOLVENT`: file claim with proof-of-liabilities receipt, cell
  returned preferentially.
- `RESOLUTION`: resolution-authority communication.
- `EXIT`: customers transitioned.

MITHQAL provides the data customers need; MITHQAL does NOT compensate
customers for bank failure.

**Principle:** MITHQAL is NOT the financial guarantor.

**Why it matters:** Customer treatment is what holders experience
directly. If treatment is opaque or unfair, confidence collapses
rapidly even if the underlying framework is sound. The explicit
per-state treatment makes the framework auditable and gives holders a
clear expectation in each scenario.

**What it determines:** The communication protocol per state; the
holder's options at each state; the proof-of-liabilities receipt
issuance in `INSOLVENT`; the absence of any MITHQAL-funded
compensation scheme.

## 17.14 What Happens to Backing?

The Protected Backing Cell (PBC) — the earmarked customer property that
backs MTQ issuance — has a well-defined status in each lifecycle state.
This is summarized in contractual question 8 (§17.13.8) and detailed
across the per-state `backingStatus` dimension (§17.3.2.4 through
§17.10.2.4).

### 17.14.1 Status of the PBC by State

| State | `backingStatus` | Cell-side action |
|---|---|---|
| `ACTIVE` | `FULLY_BACKED` | Cell operationally available; daily verification. |
| `RESTRICTED` | `FULLY_BACKED` | Cell unaffected by capital weakness; twice-daily verification. |
| `LIQUIDITY_STRESS` | `FULLY_BACKED` | Cell intact but illiquid (not immediately convertible at par); hourly verification. |
| `SUSPENDED` | `PRESERVED` | Cell preserved and locked; full snapshot reconciliation. |
| `DEFAULT` | `PROTECTED_BACKING_HELD` | Cell segregated from general estate; forensic reconciliation. |
| `INSOLVENT` | `PROTECTED_BACKING_SEQUESTERED` | Cell legally sequestered; returned to holders preferentially. |
| `RESOLUTION` | `TRANSFERRED_TO_RESOLVED_ENTITY` | Cell transferred to successor (still earmarked for holders). |
| `EXIT` | `RETURNED_OR_TRANSFERRED` | Cell fully distributed; nothing remains. |

### 17.14.2 Key Properties of the PBC Across the Lifecycle

1. **Segregation is preserved.** The cell is earmarked customer property
   under banking law in every state. The bank's general creditors
   cannot reach the cell.
2. **MITHQAL tracks, does not hold.** MITHQAL verifies the cell's
   integrity but does not custody the cell's assets. Custody is bank-side
   (or by a qualified custodian designated by the bank).
3. **Cell follows the holders, not the failed bank.** In resolution, the
   cell is transferred to the successor entity (bridge bank, purchaser)
   and remains earmarked for MTQ holders' benefit. The cell is NOT
   absorbed into the successor's general estate.
4. **Cell shortfalls are disclosed honestly.** If at any state MITHQAL
   detects a cell-side shortfall (cell balance < on-chain supply
   `S_bank`), MITHQAL discloses the shortfall honestly to the regulator
   and the public. MITHQAL does NOT cover the shortfall.
5. **Cell preservation is continuous.** The cell is preserved from
   `ACTIVE` through `EXIT`. At no point in the lifecycle does the cell
   become available to the bank's general creditors.

## 17.15 Who Absorbs Losses?

The loss-allocation waterfall is given in contractual question 7
(§17.13.7) and is reproduced here with additional detail:

### 17.15.1 Loss-Absorption Waterfall

1. **Protected Backing Cell (first loss for MTQ holders is zero IF the
   cell is fully backed).** The cell is earmarked customer property. If
   the cell is fully backed (i.e., cell balance ≥ on-chain supply
   `S_bank`), MTQ holders suffer no first-loss absorption — their claim
   on the cell is satisfied in full at par. The cell absorbs any
   market-value impairment of its constituent assets between
   reconciliation snapshots.

2. **Bank equity / shareholders (first-loss absorption if cell is
   impaired).** If the cell is impaired (cell balance < `S_bank`),
   the shortfall is first absorbed by the bank's equity capital. This
   is consistent with the bank's regulatory capital hierarchy: common
   equity tier 1 (CET1) absorbs losses before additional tier 1 (AT1)
   and tier 2 (T2) instruments.

3. **Bank subordinated debt.** After equity is exhausted, subordinated
   debt holders absorb losses. Subordinated debt is structurally
   subordinated to senior debt and to deposits.

4. **Bank general creditors pro rata.** After subordinated debt, the
   bank's general (senior unsecured) creditors absorb losses pro rata
   in insolvency.

5. **Bank deposit insurer / resolution fund (where applicable).**
   Where the bank has deposit insurance (e.g., FDIC insurance in the
   US for qualifying deposits), the deposit insurer may absorb losses
   above the bank's general creditors, up to the insurance limit per
   depositor. NOTE: MTQ is NOT a deposit; deposit insurance typically
   does NOT apply to MTQ.

### 17.15.2 MITHQAL's Position in the Waterfall

**MITHQAL is NOT in the waterfall.** MITHQAL absorbs zero losses. The
framework is explicit: MITHQAL is the protocol operator, not a
loss-absorbing entity. If MITHQAL were to absorb losses, it would have
to hold capital against the risk, which would (a) make MITHQAL a
regulated financial institution itself, defeating the architecture, and
(b) require MITHQAL to charge a fee that would defeat the cost-efficiency
of the protocol.

### 17.15.3 Implications for Holders

The expected recovery for a MTQ holder in a bank failure depends on:

1. **Cell coverage.** If the cell is fully backed (`cell_balance ≥
   S_bank`), recovery is 100% at par. This is the design target (130%
   strategic reserve, 100% minimum).
2. **Bank capital position.** If the cell is impaired, recovery depends
   on the bank's equity capital, subordinated debt, and general
   creditor recoveries.
3. **Resolution tool selected.** If the resolution authority invokes a
   bail-in, the holder's claim may be converted to equity in the
   successor entity (which may have recovery value over time). If a
   sale or bridge bank transfer is invoked, the holder's claim is
   typically honored at par (with the cell transferred to the
   successor).

## 17.16 Illustrative Example — A Participating Bank Entering `LIQUIDITY_STRESS`

This example walks through a scenario in which a participating bank —
call it "Northern Anchor Bank" — transitions from `ACTIVE` to
`LIQUIDITY_STRESS`, then either recovers (out of scope for this engine
but permitted by the framework) or transitions further to `SUSPENDED`
and beyond.

### 17.16.1 Scenario Setup

Northern Anchor Bank (NAB) is a participating MTQ-issuing bank in the
`ACTIVE` state, with:
- On-chain MTQ supply `S_NAB` = 25,000,000 MTQ.
- Protected Backing Cell balance = 32,500,000 USD-equivalent (130%
  strategic reserve target met).
- LCR = 1.25 (well above the 1.0 regulatory minimum).
- Redemption continuity state = `NORMAL`.
- Reconciliation cadence = daily (per `ACTIVE`).

### 17.16.2 Step 1 — Initial Signal

A sudden deposit outflow (driven by a macro shock unrelated to NAB
specifically) drives NAB's HQLA below the 30-day net cash outflow
threshold. The bank's LCR falls to 0.85 (below 1.0). The
redemption-continuity state machine detects the LCR breach and
transitions to `STRESS`.

The §48 transition engine observes:
- `liquidityStress` = true (LCR < 1.0 AND redemption-continuity =
  STRESS).
- All other signals = false (no capital-adequacy breach, no regulatory
  action, no default, no insolvency, no resolution triggered, no exit).

The engine evaluates `assessBankTransition("ACTIVE", { liquidityStress: true })`:
- `liquidityStress` is true → target state = `LIQUIDITY_STRESS`.
- `LIQUIDITY_STRESS` (index 2) > `ACTIVE` (index 0) → transition fires.
- Result: `ACTIVE` → `LIQUIDITY_STRESS`.

### 17.16.3 Step 2 — Behavior in `LIQUIDITY_STRESS`

Per §17.5, NAB now operates under `LIQUIDITY_STRESS` rules:

#### 17.16.3.1 Issuance

`newIssuance` = `SUSPENDED`. NAB cannot issue new MTQ against its cell
while in liquidity stress. MITHQAL revokes issuance authorization. Any
pending issuance requests are rejected at the API layer (§46 finality
invariant: no issuance without verified backing; here the verified
backing is intact but the bank cannot honor fresh redemption claims,
so issuance is suspended defensively).

#### 17.16.3.2 Transfer

`existingTransfer` = `ALLOWED`. The 25M MTQ already issued by NAB
continues to transfer freely on-chain. Holders may move MTQ to other
participating banks. This is the chain-neutrality guarantee.

#### 17.16.3.3 Redemption

`redemption` = `THROTTLED`. NAB activates the redemption-continuity
queue (`DEFENSIVE` / `STRESS`). Holders requesting redemption enter a
queue; large redemptions require pre-notification. Equal-treatment is
enforced (no preference for large holders).

#### 17.16.3.4 Backing

`backingStatus` = `FULLY_BACKED`. NAB's Protected Backing Cell still
holds 32.5M USD-equivalent (≥ 100% of `S_NAB`). This is a LIQUIDITY
problem, not a SOLVENCY problem. The cell-side backing is intact.

#### 17.16.3.5 Liquidity

`liquidity` = `STRESSED`. NAB's LCR = 0.85. The bank draws on its
front-line HQLA. The bank's central bank (lender of last resort, NOT
MITHQAL) is contacted for emergency liquidity facility access.

#### 17.16.3.6 Customer Treatment

Holders are informed via the redemption-continuity communication
protocol. They see:
- Their redemption request entered the queue.
- Estimated settlement time (longer than normal due to queue depth).
- The option to transfer MTQ to another participating bank for normal
  redemption service.
- The fact that backing is intact (the cell-side problem is liquidity,
  not solvency).

#### 17.16.3.7 Receiving Bank Treatment

Other participating banks begin concentration monitoring for incoming
MTQ from NAB. They accept incoming MTQ without restriction. They
coordinate with MITHQAL on whether to stand ready to provide redemption
service for migrating holders (drawing on NAB's cell, not their own
balance sheets).

#### 17.16.3.8 Reconciliation Cadence

MITHQAL transitions from daily to **hourly** reconciliation for NAB.
MITHQAL tracks:
- `S_NAB` (on-chain supply).
- NAB's cell balance (32.5M, unchanged).
- NAB's redemption queue depth (growing as holders enter the queue).
- NAB's front-line HQLA drawdown.
- Any cell-side drift (none observed in this scenario — the cell is
  preserved).

#### 17.16.3.9 Resolution Procedure

Emergency liquidity facility engaged with NAB's central bank (NOT
MITHQAL). The central bank decides whether to extend emergency
liquidity assistance (ELA) to NAB. MITHQAL does NOT participate in
this decision; MITHQAL provides reconciliation data to the central
bank on request.

### 17.16.4 Step 3 — Possible Outcomes

#### Outcome A — Liquidity Restored (Recovery, out of scope for this engine)

If NAB's central bank extends ELA and NAB's LCR recovers above 1.0,
the regulator may lift the `STRESS` designation. The §48 engine does
not auto-recover; the regulator's action would be recorded as a manual
state override (from `LIQUIDITY_STRESS` back to `ACTIVE`). The
framework permits this; the engine does not implement it.

#### Outcome B — Liquidity Worsens → `SUSPENDED`

If NAB's LCR continues to deteriorate, the regulator may suspend NAB's
operations. The `regulatoryAction` signal fires. The engine evaluates
`assessBankTransition("LIQUIDITY_STRESS", { regulatoryAction: true })`:
- `regulatoryAction` is true → target state = `SUSPENDED`.
- `SUSPENDED` (index 3) > `LIQUIDITY_STRESS` (index 2) → transition fires.
- Result: `LIQUIDITY_STRESS` → `SUSPENDED`.

NAB now operates under `SUSPENDED` rules (§17.6): no new issuance, no
redemption at NAB's gateway, cell preserved and locked, full snapshot
reconciliation.

#### Outcome C — Default Declared

If NAB misses a payment obligation, the regulator declares default. The
`defaultDeclared` signal fires. The engine evaluates
`assessBankTransition("LIQUIDITY_STRESS", { defaultDeclared: true })`:
- `defaultDeclared` is true → target state = `DEFAULT`.
- `DEFAULT` (index 4) > `LIQUIDITY_STRESS` (index 2) → transition fires.
- Result: `LIQUIDITY_STRESS` → `DEFAULT`.

NAB now operates under `DEFAULT` rules (§17.7): no new issuance,
redemption claim frozen at NAB (holders may transfer-and-redeem via
another bank), cell-side backing held, forensic reconciliation.

### 17.16.5 Simulation Trace (using `simulateBankDefaultScenario`)

```typescript
const result = simulateBankDefaultScenario("ACTIVE", [
  { liquidityStress: true },                       // step 0: ACTIVE → LIQUIDITY_STRESS
  { liquidityStress: true, regulatoryAction: true }, // step 1: → SUSPENDED
  { defaultDeclared: true },                       // step 2: → DEFAULT
  { insolvencyDeclared: true },                    // step 3: → INSOLVENT
  { resolutionTriggered: true },                   // step 4: → RESOLUTION
  { exitCompleted: true },                         // step 5: → EXIT
]);
// result.endState === "EXIT"
// result.transitionsCount === 6
// result.cleanExit === true
```

This is the canonical forward-only walk through the full lifecycle.
The simulation is deterministic; the same input sequence always yields
the same trace. The simulation does NOT model the time intervals
between signals or the side-effects (reconciliation cadence changes,
customer communications, regulator actions) that accompany each
transition. The simulation is a structural / state-machine validation
tool, not a time-domain simulator.

## 17.17 Honest State (§74)

The §48 framework's honest-state disclosure per §74 of the master
directive is:

```typescript
BANK_DEFAULT_HONEST_STATE = {
  bankDefaultStateModelDesigned:  true,
  bankDefaultOperationalWorkflow: true,
  bankDefaultContractValidated:   false,
  bankDefaultLegalValidated:      false,
  bankDefaultProductionReady:     false,
}
```

These five fields are NON-NEGOTIABLE and exact:

1. **`bankDefaultStateModelDesigned = true`** — The lifecycle model
   (eight states, nine dimensions per state, transition engine, signal
   priority) is fully designed and implemented in
   `src/lib/bank-default-resolution.ts`.
2. **`bankDefaultOperationalWorkflow = true`** — The operational
   workflow (reconciliation cadences, customer communications,
   cross-bank reconciliation protocol, regulator coordination) is
   specified. The workflow is ready to be put in front of operational
   staff at a participating bank.
3. **`bankDefaultContractValidated = false`** — No real participating
   bank has signed the contractual annex that codifies these
   obligations. The framework is a specification, not a contract.
4. **`bankDefaultLegalValidated = false`** — No jurisdiction has
   legally validated the segregation of the Protected Backing Cell.
   The legal opinion that the cell is earmarked customer property
   under banking law in each §49 jurisdiction has not been obtained.
5. **`bankDefaultProductionReady = false`** — The framework is NOT
   production-authorized. It is approved for institutional engagement
   (banks, regulators, resolution authorities may review it); it is
   NOT approved for live MTQ issuance against real Protected Backing
   Cells.

### 17.17.1 Honesty Contract

- The model and workflow are SPECIFIED.
- The contracts and legal validation are NOT YET EXECUTED.
- The framework is APPROVED FOR INSTITUTIONAL ENGAGEMENT (put in
  front of banks, regulators, resolution authorities), NOT FOR
  PRODUCTION USE.

### 17.17.2 Final Status

```
§48 BANK DEFAULT & RESOLUTION FRAMEWORK — SPECIFIED, NOT CONTRACTED.
APPROVED FOR INSTITUTIONAL ENGAGEMENT (banks, regulators, resolution
authorities). NOT PRODUCTION-AUTHORIZED. MITHQAL IS NOT THE FINANCIAL
GUARANTOR.
```

Final status color: **AMBER** (spec-level, not production-authorized).

## 17.18 Cross-References

The §48 framework integrates with:

- **§47 Protected Backing Cell** — defines the 17-field schema for the
  cell that is tracked through every state of the §48 lifecycle.
- **§46 Finality Policy** — defines the seven finality layers that
  prevent unauthorized issuance (relevant when issuance is suspended
  in `LIQUIDITY_STRESS` and beyond).
- **§49 Legal Liability Framework** — defines the legal classification
  of MTQ in each jurisdiction, which governs the holder's claim
  priority in insolvency.
- **§50 Licensing / Entity Matrix** — defines the licenses required
  for the activities surrounding the cell (custody, banking,
  settlement), which determine whether the cell's custody is bank-side
  or by a qualified third-party custodian.
- **§52 Systemic Exposure Engine** — defines the concentration
  monitoring that surfaces when one bank's growth creates excessive
  system-wide concentration (relevant to the `RESTRICTED` state's
  receiving-bank treatment).
- **`forensic-rr-reconciliation.ts`** — implements the forensic
  reconciliation referenced in the `DEFAULT` state's reconciliation
  procedure.
- **`proof-of-liabilities.ts`** — implements the cryptographic
  proof-of-liabilities receipt referenced in the `INSOLVENT` state's
  customer treatment.

---

# SECTION 18 — LEGAL LIABILITY FRAMEWORK (§49)

## 18.0 Module Identity

| Field | Value |
|---|---|
| Module ID | `v25.2-legal-liability-framework-1.0` |
| Directive section | §49 |
| Source file | `src/lib/legal-liability-framework.ts` (724 lines) |
| Final status | LEGAL FRAMEWORK DESIGNED — ZERO JURISDICTIONS VALIDATED — PENDING EXTERNAL LEGAL OPINIONS |
| Controlling principle | **NEVER INVENT LEGAL CLASSIFICATIONS.** |

The §49 framework models the legal / economic liability characterization
of the MTQ instrument across jurisdictions. It is the LEGAL-CHARACTERIZATION
companion to the §V25.2 reserve mathematical specification. Where the
reserve spec defines WHAT the MTQ is mathematically (the reserve ratio,
the corridor composition, the concentration limits), §49 defines WHAT
THE MTQ IS LEGALLY in each jurisdiction.

## 18.1 Controlling Principle — Never Invent Legal Classifications

The single most important rule of §49 is:

> NEVER INVENT LEGAL CLASSIFICATIONS. Every jurisdiction begins life
> as `JURISDICTION_PENDING`. Only an external, evidence-backed legal
> opinion may transition a jurisdiction to `LEGAL_OPINION_OBTAINED`,
> and only an external, evidence-backed validation may transition it
> to `VALIDATED`. At time of writing, ZERO jurisdictions are
> validated.

This principle is enforced structurally:
1. Every jurisdiction's `classification` field defaults to
   `JURISDICTION_PENDING`.
2. The `registerLegalOpinion` function refuses to transition to
   `LEGAL_OPINION_OBTAINED` unless a non-empty `opinion.issuer`,
   `opinion.date`, and `opinion.artifact` are provided.
3. The `validateJurisdiction` function refuses to transition to
   `VALIDATED` unless (a) the jurisdiction is already
   `LEGAL_OPINION_OBTAINED`, and (b) validation evidence (validator +
   date + artifact) is provided.
4. `VALIDATED` is terminal — a validated jurisdiction cannot be reset
   by a new opinion.
5. The text strings inside the registry's speculative legal-nature
   fields are clearly marked as `PENDING OPINION` and suffixed with
   the speculative-note disclaimer: *"PENDING OPINION — speculative
   engineering triage, not legal advice."*

## 18.2 Honest State (§74)

```typescript
LegalLiabilityHonestState = {
  LEGAL_MODEL_DESIGNED:         true,
  LEGAL_REGISTRY_IMPLEMENTED:  true,
  LEGAL_OPINIONS_OBTAINED:     false,
  VALIDATED_JURISDICTIONS:      0,
}
```

These four fields are LITERAL and IMMUTABLE until an external legal-
opinion campaign actually obtains opinions and a subsequent external
validation campaign actually validates jurisdictions. At time of
writing, neither has occurred.

## 18.3 Legal Classification Lifecycle

The legal classification lifecycle is **one-way** and **evidence-gated**:

```
JURISDICTION_PENDING  →  LEGAL_OPINION_OBTAINED  →  VALIDATED
       (default)              (requires opinion)        (requires validation)
```

### 18.3.1 `JURISDICTION_PENDING`

The default state for every newly seeded jurisdiction. The jurisdiction's
speculative legal-nature fields are populated from the engineering
team's reading of PUBLIC regulatory materials for triage only; they are
NOT legal advice and MUST NOT be presented as a definitive
classification.

### 18.3.2 `LEGAL_OPINION_OBTAINED`

Transitioned from `JURISDICTION_PENDING` only when an external legal
opinion is registered via `registerLegalOpinion`. The opinion must
carry:
- `issuer` — the law firm or regulator that issued the opinion.
- `date` — the ISO-8601 date the opinion was issued.
- `artifact` — a stable identifier, URL, or hash for the opinion
  document.
- `dimensions` — the 13-dimension opinion text, populated from the
  actual opinion.
- `notes` — free-form notes from the opinion issuer.

A `LEGAL_OPINION_OBTAINED` jurisdiction is one step closer to
`VALIDATED` but is still not definitive; the opinion itself may be
challenged, superseded, or found to be based on incomplete facts.

### 18.3.3 `VALIDATED`

Transitioned from `LEGAL_OPINION_OBTAINED` only when external validation
evidence is registered via `validateJurisdiction`. The validation must
carry:
- `validator` — the external validator identity (regulator / auditor /
  independent counsel).
- `date` — the ISO-8601 date validation was completed.
- `artifact` — a stable identifier, URL, or hash for the validation
  document.
- `notes` — free-form notes from the validator.

`VALIDATED` is terminal — a validated jurisdiction cannot be reset by
a subsequent opinion. If the legal characterization changes (e.g., a
new regulation reclassifies MTQ), a new jurisdiction entry should be
created (e.g., `SG-V2`) and the old entry archived.

### 18.3.4 Lifecycle Constraints

- No jurisdiction may be seeded as `VALIDATED`.
- No jurisdiction may be seeded as `LEGAL_OPINION_OBTAINED`.
- Both transitions require external evidence.
- The `registerLegalOpinion` and `validateJurisdiction` functions
  refuse to advance the lifecycle without evidence (they return the
  current entry unchanged rather than inventing a transition).
- `VALIDATED` is terminal.

## 18.4 The 13 Legal / Economic Liability Dimensions

Every jurisdiction in the §49 registry is characterized across 13
dimensions. The dimensions are the canonical framework through which
any legal / economic analysis of MTQ must be expressed. The 13
dimensions, in canonical order:

```typescript
LEGAL_LIABILITY_DIMENSIONS = [
  "jurisdiction",                // 1
  "legalNature",                 // 2
  "obligor",                     // 3
  "holderRights",                // 4
  "redemption",                  // 5
  "settlementFinality",          // 6
  "creditorTreatment",           // 7
  "insolvencyTreatment",         // 8
  "transferability",             // 9
  "pledgeability",               // 10
  "governingLaw",                // 11
  "disputeResolution",           // 12
  "licensingClassification",     // 13
]
```

### 18.4.1 Dimension 1 — `jurisdiction`

**What it is:** The canonical jurisdiction code (ISO-3166-1 alpha-2
where applicable) AND the owning regulator / supervisory authority.
This dimension doubles as the registry key.

**Why it matters:** The jurisdiction determines which regulator has
supervisory authority, which statutes apply, and which courts have
jurisdiction over disputes. Without a clear jurisdictional anchor,
the other 12 dimensions cannot be answered.

**What it determines:** The applicable regulatory regime; the
regulator's identity; the governing statute; the supervisory
authority for the issuing bank; the court system for dispute
resolution.

**How it is populated:** Seeded at registry initialization with the
ISO-2 code (e.g., `US`, `EU`, `UK`, `CH`, `SG`, `AE`, `SA`, `JP`).
The regulator is identified by reference to public regulatory
materials (e.g., for `US`: FinCEN, SEC, CFTC, NYDFS). All seeded
content is marked `PENDING OPINION`.

### 18.4.2 Dimension 2 — `legalNature`

**What it is:** What the instrument legally IS in this jurisdiction.
Is it a deposit? A stored-value instrument? An e-money token? An
asset-referenced token? A security? A commodity? A digital payment
token?

**Why it matters:** The legal nature determines which regulatory
regime applies. A "deposit" triggers banking regulation and deposit
insurance; a "stored-value instrument" triggers payment-services
regulation; a "security" triggers securities regulation; etc. The
legal nature also determines the holder's claim priority in
insolvency.

**What it determines:** The applicable regulatory regime; the
licensing classification (dimension 13); the holder's claim priority
(dimension 7); the insolvency treatment (dimension 8).

**How it is populated:** Seeded with the engineering team's reading
of public regulatory materials. For example, for `US`: "likely
treated as a stored-value / settlement instrument (not a deposit,
not a security)". All seeded content is marked `PENDING OPINION`.

### 18.4.3 Dimension 3 — `obligor`

**What it is:** Who stands behind the redemption promise. The obligor
is the entity legally bound to redeem MTQ at par.

**Why it matters:** The obligor is the holder's legal counterparty. If
the obligor is the issuing bank (as the framework specifies), then
the holder's claim is against the bank, not against MITHQAL. This is
the legal expression of the §48 principle "MITHQAL is NOT the
financial guarantor."

**What it determines:** The legal counterparty; the entity against
which the holder may bring a claim; the entity whose insolvency
triggers the insolvency-treatment analysis (dimension 8).

**How it is populated:** Seeded with the framework's design: "obligor
is the issuing bank within the Protected Backing Cell, not MITHQAL.
MITHQAL performs verification / governance only." All seeded content
is marked `PENDING OPINION`.

### 18.4.4 Dimension 4 — `holderRights`

**What it is:** The enforceable rights of the holder. What can the
holder demand? When? From whom? On what legal basis?

**Why it matters:** The holder's rights determine what the holder can
legally compel. If the holder has a contractual redemption right at
par, the holder can sue to enforce it. If the holder has only an
unsecured claim, the holder's recovery depends on the insolvency
waterfall.

**What it determines:** The holder's enforcement options; the legal
basis for the holder's claim; the priority of the holder's claim in
insolvency (dimension 7).

**How it is populated:** Seeded with the framework's expectation:
"holder is expected to hold a contractual claim on the earmarked
backing, enforceable against the obligor bank, not against MITHQAL."
All seeded content is marked `PENDING OPINION`.

### 18.4.5 Dimension 5 — `redemption`

**What it is:** The redemption mechanism, frequency, and conditions.
How does the holder redeem MTQ for fiat / asset? On what timeline?
At what price? Are there redemption limits, redemption fees, or
redemption gates?

**Why it matters:** Redemption is the primary economic function of
MTQ. If redemption is uncertain (e.g., the issuer has discretion to
suspend redemption), MTQ will trade at a discount to par. If
redemption is firmly contractual at par within a defined timeline,
MTQ will trade at or near par.

**What it determines:** The expected market price of MTQ (par vs.
discount); the redemption-continuity framework (§V25.2 redemption-
continuity state machine); the holder's optionality in a stress event.

**How it is populated:** Seeded with the framework's expectation:
"redemption in fiat at PAR expected via the obligor bank;
physical-bullion redemption subject to custody / bank terms." For
`SG`, the seeded content notes the MAS SCS framework's 5-business-day
redemption expectation. All seeded content is marked
`PENDING OPINION`.

### 18.4.6 Dimension 6 — `settlementFinality`

**What it is:** When an MTQ transfer becomes irrevocable. Settlement
finality is the point at which the transfer is legally binding and
cannot be reversed (except in cases of fraud or court order).

**Why it matters:** Settlement finality is critical for any payment
system. Without finality, the recipient cannot rely on the transfer;
with finality, the recipient can treat the transfer as cash. The
timing of finality affects credit risk (the recipient is exposed to
the sender's bank between submission and finality).

**What it determines:** The credit-risk window for the recipient;
the legal status of a transfer in flight at the moment of a bank
failure; the integration with existing payment-system finality
regimes (e.g., FedNow finality, T2 finality, CHAPS finality).

**How it is populated:** Seeded with the framework's expectation:
"settlement finality expected to follow the underlying rail
(FedNow / wire / stablecoin) and chain finality." For `EU`, the
seeded content references CSDR / T+1 for cash legs and chain finality
for token legs. All seeded content is marked `PENDING OPINION`.

### 18.4.7 Dimension 7 — `creditorTreatment`

**What it is:** Whether / how the holder ranks as a creditor of the
obligor. Is the holder an unsecured creditor? A secured creditor
(to the extent of the segregated backing)? A preferential creditor?

**Why it matters:** Creditor treatment determines the holder's
recovery in insolvency. An unsecured creditor recovers pro rata with
other unsecured creditors (typically a fraction of par). A secured
creditor (with a perfected security interest in the segregated
backing) recovers in full from the segregated assets. A preferential
creditor ranks ahead of general unsecured creditors.

**What it determines:** The expected recovery rate in insolvency;
the legal mechanism for enforcing the holder's claim on the
segregated backing; the holder's seniority in the insolvency
waterfall.

**How it is populated:** Seeded with the framework's expectation:
"holder expected to rank as an unsecured creditor of the obligor
absent a perfected security interest / segregation." For `EU` (under
MiCA), the seeded content notes that the holder "expected to rank
ahead of ordinary unsecured creditors to the extent of the
segregated reserve under MiCA art.48." All seeded content is marked
`PENDING OPINION`.

### 18.4.8 Dimension 8 — `insolvencyTreatment`

**What it is:** What happens to the holder on obligor insolvency.
Is the holder's claim accelerated? Is the segregated backing
excluded from the insolvency estate? Is the holder paid out from
the segregated backing, or does the holder have to file a claim in
the insolvency proceeding?

**Why it matters:** Insolvency treatment is the most important
dimension for holder protection. If the segregated backing is excluded
from the estate (as the framework expects), the holder recovers in
full from the backing without waiting for the insolvency proceeding
to resolve. If the backing is NOT excluded, the holder is an unsecured
creditor and recovers a fraction of par over years.

**What it determines:** The holder's recovery timeline; the
holder's recovery amount; the legal mechanism for accessing the
segregated backing; the resolution authority's obligations to the
holder.

**How it is populated:** Seeded with the framework's expectation:
"on obligor insolvency, holder expected to be an unsecured creditor
unless backing is segregated / earmarked under applicable [law]."
For `CH`, the seeded content references art. 37a Swiss Banking Act
(segregation of client assets). For `JP`, the seeded content
references the PSA trust rules. All seeded content is marked
`PENDING OPINION`.

### 18.4.9 Dimension 9 — `transferability`

**What it is:** May the instrument be freely transferred? Are there
restrictions on who may hold MTQ? Are there transfer limits, transfer
fees, or transfer-gating mechanisms?

**Why it matters:** Transferability determines the liquidity of MTQ.
If MTQ is freely transferable, it can circulate as a near-cash
instrument. If transfers are restricted (e.g., to KYC-cleared
institutional counterparties), MTQ is a wholesale settlement
instrument, not a retail currency.

**What it determines:** The holder's ability to monetize MTQ in a
stress event; the secondary market for MTQ; the regulatory
classification (some regimes — e.g., the EU's MiCA — distinguish
between professional and retail transferability).

**How it is populated:** Seeded with the framework's expectation:
"transferability expected to be restricted to KYC / AML-vetted
institutional counterparties." For `EU` (under MiCA), the seeded
content notes that "transferability expected to MiCA-compliant
professional holders; retail transferability depends on
classification." All seeded content is marked `PENDING OPINION`.

### 18.4.10 Dimension 10 — `pledgeability`

**What it is:** May the instrument be pledged as collateral? Can a
holder grant a security interest in MTQ to a lender? If so, how is
the security interest perfected?

**Why it matters:** Pledgeability determines whether MTQ can be used
as collateral in repo, securities lending, and other collateralized
transactions. If MTQ is pledgeable, it can support a wide range of
wholesale funding and hedging transactions. If not, MTQ is a
settlement-only instrument.

**What it determines:** The holder's ability to use MTQ as
collateral; the perfection mechanism (e.g., UCC Article 9 in the
US, German BGB §1274 in the EU, Swiss OR art. 901 in Switzerland);
the integration with central counterparty (CCP) margining systems.

**How it is populated:** Seeded with the framework's expectation:
"pledgeability expected to require obligor consent and perfection
under [applicable law]." For `US`, the seeded content references
UCC Article 9. For `CH`, the seeded content references Swiss OR art.
901 (cession). All seeded content is marked `PENDING OPINION`.

### 18.4.11 Dimension 11 — `governingLaw`

**What it is:** The substantive law chosen to govern the instrument.
Which jurisdiction's law applies to the interpretation and enforcement
of the MTQ terms?

**Why it matters:** Governing law determines the legal framework for
resolving disputes. If the governing law is, e.g., New York law, then
New York contract law applies to the interpretation of the MTQ terms.
This affects the holder's ability to enforce rights and the
predictability of outcomes.

**What it determines:** The legal framework for contract
interpretation; the conflict-of-laws rules; the choice of forum
(dimension 12).

**How it is populated:** Seeded with the framework's expectation:
"governing law expected to be [the obligor bank's home jurisdiction]."
For `US`, the seeded content notes "New York or the obligor bank's
home US state." For `AE`, the seeded content notes "UAE law (onshore)
or ADGM / DFSA law (financial free zone)." All seeded content is
marked `PENDING OPINION`.

### 18.4.12 Dimension 12 — `disputeResolution`

**What it is:** The forum / arbitration / courts for resolving
disputes. Are disputes resolved in court? In arbitration? Which
courts? Which arbitration rules?

**Why it matters:** Dispute resolution determines the speed, cost,
and predictability of resolving any disagreement about MTQ (e.g., a
refused redemption, a transfer dispute, an insolvency claim). Court
litigation is typically slower but more appealable; arbitration is
faster but more final.

**What it determines:** The holder's procedural rights; the
enforceability of judgments across borders; the cost of dispute
resolution; the typical timeline for resolution.

**How it is populated:** Seeded with the framework's expectation:
"disputes expected to be submitted to [the jurisdiction's courts or
arbitration]." For `US`, the seeded content references "US federal /
state courts or NY-seated arbitration." For `CH`, the seeded content
references "Swiss courts or Zurich / Geneva-seated arbitration." All
seeded content is marked `PENDING OPINION`.

### 18.4.13 Dimension 13 — `licensingClassification`

**What it is:** What license regime applies to issuance. What
license(s) must the obligor obtain to issue MTQ in this jurisdiction?
What regulatory authorization is required?

**Why it matters:** Licensing classification determines the regulatory
cost of issuing MTQ. A banking-license requirement is high-friction
(months-to-years to obtain, significant capital requirements). A
payment-services license is medium-friction. An MSB registration is
lower-friction. The licensing classification also determines the
ongoing supervisory regime.

**What it determines:** The obligor's licensing burden; the
regulatory cost of MTQ issuance; the supervisory regime; the
integration with the §50 Licensing / Entity Matrix.

**How it is populated:** Seeded with the framework's expectation
about the likely license regime. For `US`: "FinCEN MSB registration,
state MTL coverage, and NYDFS BitLicense where applicable." For
`EU`: "EBA-authorized ART issuer authorization (MiCA Title III) and
CASP authorization where applicable." For `SG`: "MAS SCS issuer
approval and/or DPT license under the PSA." All seeded content is
marked `PENDING OPINION`.

## 18.5 Jurisdiction Registry — Eight Jurisdictions, ALL `JURISDICTION_PENDING`

The §49 registry seeds eight jurisdictions: `US`, `EU` (EU/EEA), `UK`,
`CH`, `SG`, `AE`, `SA`, `JP`. Every jurisdiction is seeded with
`classification = JURISDICTION_PENDING`. The seeded text is the
engineering team's reading of PUBLIC regulatory materials for triage
only; it is NOT legal advice and MUST NOT be presented as a definitive
classification.

For each jurisdiction below, we provide: (a) what is known (the public
regulatory materials the seeded text references), (b) what is pending
(the specific legal questions an opinion must answer), and (c) what
requires legal opinion (the credentials / scope of the legal opinion
that would be needed to transition the jurisdiction out of
`JURISDICTION_PENDING`).

### 18.5.1 Jurisdiction `US` — United States

#### 18.5.1.1 What is Known

- The primary federal regulators for MTQ-like instruments are FinCEN
  (BSA / MSB), SEC (securities), CFTC (commodities), and NYDFS
  (BitLicense for NY-resident customers).
- A stablecoin that does NOT promise a return and is redeemable at par
  on demand is generally treated as a stored-value / settlement
  instrument, not a security and not a deposit.
- FinCEN MSB registration is required for money transmission.
- State-by-state Money Transmitter Licenses (MTLs) are required in
  most states.
- NYDFS BitLicense is required for NY-resident customers (or for
  activity involving NY).
- The Uniform Commercial Code (UCC) Article 9 governs perfection of
  security interests in MTQ (as a "general intangible" or
  "payment intangible").
- Bankruptcy is governed by the US Bankruptcy Code; segregated customer
  property may be protected under 11 U.S.C. § 541 (exclusions from
  property of the estate) or applicable state law (e.g., NY
  segregation statutes).
- FDIC deposit insurance applies to deposits at FDIC-insured banks;
  MTQ is NOT a deposit and is NOT insured by FDIC.

#### 18.5.1.2 What is Pending

- Whether MTQ's specific structure (bank-issued, Protected Backing
  Cell, multi-currency backing) qualifies for any federal pre-emption
  or streamlined state MTL treatment.
- Whether the SEC's "investment contract" test (Howey) applies to
  MTQ (likely no, because MTQ does not promise a return).
- Whether the CFTC's "commodity" classification applies to MTQ
  (likely no, because MTQ is not a derivative).
- Whether the NYDFS BitLicense regime applies to MTQ issuance by a
  NY-chartered bank (potentially exempt under the limited-purpose
  trust company exclusion).
- Whether UCC Article 9 perfection requires filing a UCC-1 financing
  statement (likely yes, for general intangibles) or whether
  "control" under UCC Article 12 (2023 amendments) suffices.
- Whether MTQ holders' claims on the Protected Backing Cell are
  protected under 11 U.S.C. § 541(d) (legal title) or applicable
  state segregation statutes.
- Whether MITHQAL's role (verification, not custody) subjects it
  to MSB registration (likely no, because MITHQAL does not transmit
  money).

#### 18.5.1.3 What Requires Legal Opinion

A US legal opinion for MTQ would need to cover, at minimum:
- The legal nature of MTQ under federal and (relevant) state law,
  with specific reference to FinCEN, SEC, CFTC, and NYDFS guidance.
- The licensing classification (MSB + MTL + BitLicense analysis).
- The obligor's identity and the holder's contractual claim.
- The perfection mechanism for the Protected Backing Cell under UCC
  Article 9 (and Article 12 if applicable).
- The insolvency treatment of the Protected Backing Cell under the
  US Bankruptcy Code (specifically, whether the cell is excluded from
  the estate under § 541(d) or applicable state law).
- The governing-law and dispute-resolution recommendations (NY law
  + federal courts vs. arbitration).

The opinion should be issued by a US-qualified law firm with
demonstrable experience in BSA / MSB, NYDFS BitLicense, UCC Article 9,
and US Bankruptcy Code matters.

### 18.5.2 Jurisdiction `EU` — European Union / EEA

#### 18.5.2.1 What is Known

- The primary EU regulation for crypto-assets is MiCA (Regulation
  (EU) 2023/1114), which establishes three categories: asset-referenced
  tokens (ARTs), e-money tokens (EMTs), and other crypto-assets (so-
  called "category 3" tokens).
- An ART references one or more fiat currencies as its reserve; an EMT
  references one single fiat currency. MTQ, referencing multiple
  currencies, would likely be classified as an ART.
- ART issuance requires EBA authorization (MiCA Title III).
- The holder has a MiCA-art.17 claim against the issuer, including
  the right to be reimbursed at par.
- MiCA art.48 requires the issuer to segregate the reserve from its
  own assets; on issuer insolvency, the segregated reserve is expected
  to be excluded from the insolvency estate under MiCA art.48 / 55.
- CSDR (Regulation (EU) 909/2014) governs securities settlement
  finality for cash legs.
- PSD2 (and the upcoming PSD3 / PSR1) governs payment services,
  including the e-money / payment-institution regimes.
- MiFID II governs investment firms (relevant for FX derivatives and
  securities dealing).

#### 18.5.2.2 What is Pending

- Whether MTQ qualifies as an ART (multi-currency reserve) or an EMT
  (single currency) under MiCA art.3-6.
- Whether the issuing bank's home Member State law (e.g., German
  BGB, French Code civil) recognizes the segregation of the
  Protected Backing Cell in insolvency.
- Whether MiCA art.48 segregation applies to bank-issued MTQ (where
  the bank is also a credit institution under CRD VI) or whether
  the banking-resolution framework (BRRD II) supersedes MiCA for
  bank-issued tokens.
- Whether transferability to retail holders is permitted (depends
  on the ART / EMT classification).
- Whether pledgeability is recognized under national civil law
  (e.g., German BGB §1274 for assignment-as-security).
- The governing-law choice (issuer's home Member State vs. another
  EU Member State).

#### 18.5.2.3 What Requires Legal Opinion

An EU legal opinion would need to cover:
- The MiCA classification (ART vs. EMT) and the implications for
  the issuer's reserve composition, investment-policy, and
  disclosure obligations.
- The interaction between MiCA and the bank-resolution framework
  (BRRD II), specifically whether the Protected Backing Cell is
  treated as a MiCA-segregated reserve or as a bank asset subject
  to bail-in.
- The national civil-law treatment of the cell segregation in the
  issuer's home Member State.
- The licensing path: EBA-authorized ART issuer authorization
  under MiCA Title III, plus CASP authorization where the issuer
  also provides CASP services (custody, exchange).
- The governing-law and dispute-resolution recommendations (issuer's
  home Member State law + courts vs. EU arbitration).

The opinion should be issued by an EU-qualified law firm with
demonstrable MiCA experience, ideally admitted in the issuer's home
Member State.

### 18.5.3 Jurisdiction `UK` — United Kingdom

#### 18.5.3.1 What is Known

- The UK's crypto-asset regime is governed by the FCA's
  Cryptoasset Register (under MLRs 2017, as amended), the
  Financial Services and Markets Act 2000 (FSMA), and (for
  stablecoins) the upcoming UK stablecoin regime.
- The UK e-money regulations 2011 govern e-money issuance.
- The FCA's safeguarding rules (SYSC 16A) require e-money
  issuers to safeguard customer funds (segregation or
  insurance).
- On issuer insolvency, safeguarded funds are expected to be
  excluded from the estate under the FCA safeguarding rules.
- The Bank of England operates RTGS / CHAPS for sterling
  settlement.
- English law is widely chosen for international financial
  contracts; LCIA arbitration is a common alternative to
  court litigation.

#### 18.5.3.2 What is Pending

- Whether MTQ qualifies as e-money under the E-Money Regulations
  2011, as a "digital settlement asset" under the upcoming UK
  stablecoin regime, or as another category.
- Whether the issuing bank's FCA safeguarding obligations are
  satisfied by the Protected Backing Cell structure (likely yes,
  but needs opinion).
- Whether the cell is excluded from the bank's estate in
  insolvency under the FCA safeguarding rules.
- Whether transferability is restricted to FCA-registered / KYC
  counterparties.
- Whether pledgeability is recognized under English law (likely
  yes, subject to issuer consent and perfection).
- Whether MITHQAL's role (verification, not custody) subjects it
  to FCA registration (likely no, because MITHQAL does not hold
  client money).

#### 18.5.3.3 What Requires Legal Opinion

A UK legal opinion would need to cover:
- The classification of MTQ under the UK crypto-asset regime
  (MLRs 2017 as amended, FSMA, and the upcoming stablecoin regime).
- The applicability of the E-Money Regulations 2011.
- The FCA safeguarding analysis (whether the cell satisfies the
  safeguarding rules).
- The licensing path: FCA crypto-asset registration, e-money /
  payment-systems authorization.
- The insolvency treatment of the cell under the FCA safeguarding
  rules and the UK Special Resolution Regime (for banks).
- The governing-law and dispute-resolution recommendations
  (English law + courts vs. LCIA arbitration).

The opinion should be issued by an England-and-Wales-qualified
law firm with demonstrable FCA crypto-asset and bank-resolution
experience.

### 18.5.4 Jurisdiction `CH` — Switzerland

#### 18.5.4.1 What is Known

- The Swiss Financial Services Act (FinSA) and Financial
  Institutions Act (FinIA) govern financial services and
  institutions.
- FINMA guidance (2018 / 2021) classifies crypto-assets under
  existing categories (e.g., "qualified Swiss stablecoin" for
  payment stablecoins).
- Swiss Banking Act art. 37a provides for the segregation of
  client assets in bank insolvency.
- The Swiss Code of Obligations (OR) art. 901 governs
  assignment-as-security (cession).
- The Swiss Financial Market Infrastructure Act (FMIA) governs
  market infrastructure.
- The SIC system (operated by SIX on behalf of the SNB) is the
  primary Swiss payment rail.
- FINMA offers a "fintech license" (lighter than a full banking
  license) for deposit-taking up to CHF 100m.

#### 18.5.4.2 What is Pending

- Whether MTQ qualifies as a "qualifying Swiss stablecoin" under
  FINMA guidance.
- Whether the issuing bank is required to hold a full FINMA
  banking license or whether a fintech license suffices.
- Whether art. 37a Swiss Banking Act applies to the Protected
  Backing Cell (likely yes for bank-held assets).
- Whether FinSA prospectus duties apply to MTQ issuance (likely
  yes for professional clients; possibly no for institutional
  private placements).
- Whether transferability is limited to professional clients per
  FinSA.
- Whether the SIC system's finality rules apply to MTQ settlement.

#### 18.5.4.3 What Requires Legal Opinion

A Swiss legal opinion would need to cover:
- The FinSA / FinIA classification of MTQ.
- The FINMA licensing path (banking license vs. fintech license
  vs. other).
- The art. 37a segregation analysis for the Protected Backing
  Cell.
- The FinSA prospectus-duty analysis.
- The transferability restrictions (professional-client
  requirement).
- The governing-law and dispute-resolution recommendations (Swiss
  substantive law + Swiss courts vs. Zurich / Geneva arbitration).

The opinion should be issued by a Swiss-qualified law firm with
demonstrable FinSA / FinIA and FINMA experience.

### 18.5.5 Jurisdiction `SG` — Singapore

#### 18.5.5.1 What is Known

- The Monetary Authority of Singapore (MAS) regulates
  crypto-assets and payment services under the Payment
  Services Act 2019 (PSA).
- The MAS Single-Currency Stablecoin (SCS) framework (2023)
  establishes a regulatory regime for SCS issuance in Singapore.
- An SCS issuer must hold low-risk, highly liquid reserve assets
  segregated from the issuer's own assets.
- The holder has a redemption-at-par claim against the issuer
  under MAS SCS conditions, with redemption within 5 business
  days.
- On issuer insolvency, the segregated reserve is expected to be
  held on trust / segregated per MAS SCS conditions.
- Singapore law is widely chosen for international financial
  contracts in Asia.
- The SIAC (Singapore International Arbitration Centre) is a
  leading arbitral institution.

#### 18.5.5.2 What is Pending

- Whether MTQ qualifies as an SCS under the MAS SCS framework
  (single-currency requirement: MTQ is multi-currency, so the SCS
  framework may NOT directly apply).
- Whether MTQ qualifies as a Digital Payment Token (DPT) under
  the PSA (if not an SCS).
- Whether the issuing bank must hold a MAS Major Payment
  Institution License (PSN02) for MTQ issuance.
- Whether the Protected Backing Cell satisfies the MAS SCS
  segregation requirements (if MTQ is classified as an SCS).
- Whether the Singapore trust-law segregation analysis applies
  to the cell.
- Whether transferability is restricted to non-prohibited persons
  under MAS PD / PDPA rules.

#### 18.5.5.3 What Requires Legal Opinion

A Singapore legal opinion would need to cover:
- The SCS vs. DPT classification under the MAS framework.
- The licensing path (MAS SCS issuer approval, DPT service
  license under the PSA, or other).
- The trust-law segregation analysis for the Protected Backing
  Cell.
- The holder's redemption claim under the MAS SCS conditions.
- The insolvency treatment of the cell under Singapore trust law
  and the Companies Act.
- The transferability restrictions.
- The governing-law and dispute-resolution recommendations
  (Singapore law + Singapore courts vs. SIAC arbitration).

The opinion should be issued by a Singapore-qualified law firm
with demonstrable MAS payment-services experience.

### 18.5.6 Jurisdiction `AE` — United Arab Emirates

#### 18.5.6.1 What is Known

- The Central Bank of the UAE (CBUAE) regulates banking and
  payment services, including the Stored Value Facility (SVF)
  regime.
- VARA (Virtual Asset Regulatory Authority) in Dubai and the
  ADGM (Abu Dhabi Global Market) FSRA regulate virtual-asset
  activities in their respective free zones.
- The UAE Civil Transactions Law (Federal Law No. 5 of 1985)
  provides the general contract framework.
- The UAE AML law (Federal Decree-Law No. 20/2018) governs AML /
  CTF obligations.
- The onshore / free-zone distinction is significant: onshore
  activity is governed by CBUAE / federal law; free-zone activity
  (DIFC, ADGM) is governed by the free-zone regulator.
- ADGM and DIFC have their own commercial laws (based on English
  common law for ADGM; DIFC also has its own common-law-based
  system).

#### 18.5.6.2 What is Pending

- Whether MTQ qualifies as a Stored Value Facility (SVF) under
  the CBUAE SVF Regulation.
- Whether MTQ issuance is subject to CBUAE SVF licensing or to
  VARA / ADGM virtual-asset authorization (depending on the
  free zone).
- Whether the issuing bank's CBUAE banking license covers MTQ
  issuance or whether a separate SVF / VASP authorization is
  required.
- Whether the Protected Backing Cell satisfies CBUAE / VARA /
  ADGM segregation requirements.
- Whether transferability is restricted to KYC-cleared
  counterparties per UAE AML rules.
- Whether pledgeability is recognized under UAE Civil
  Transactions Law or under ADGM / DFSA commercial law.

#### 18.5.6.3 What Requires Legal Opinion

A UAE legal opinion would need to cover:
- The classification of MTQ under the CBUAE SVF regime and the
  VARA / ADGM virtual-asset regimes.
- The licensing path (CBUAE SVF, VARA VASP, or ADGM virtual-asset
  authorization).
- The segregation analysis under CBUAE / VARA / ADGM rules.
- The applicability of UAE Civil Transactions Law vs. ADGM / DFSA
  commercial law (depending on the operating entity's domicile).
- The transferability and pledgeability analysis.
- The governing-law and dispute-resolution recommendations (UAE
  law vs. ADGM / DIFC law; UAE courts vs. DIFC / ADGM arbitration).

The opinion should be issued by a UAE-qualified law firm (or a
firm qualified in ADGM / DIFC law, as applicable) with
demonstrable CBUAE / VARA / ADGM experience.

### 18.5.7 Jurisdiction `SA` — Saudi Arabia

#### 18.5.7.1 What is Known

- The Saudi Central Bank (SAMA) regulates banking and payment
  services under the Saudi Central Bank Law and the Payment
  Systems Law.
- The Saudi Capital Market Authority (CMA) regulates securities
  and commodity activities.
- SAMA has operated a regulatory sandbox for fintech / payment-
  services innovation.
- The Saudi Civil Transactions Law (Royal Decree M/190 of
  1444H / 2023) governs general contract and property law.
- Shariah compliance is required for financial products in
  Saudi Arabia (per SAMA and CMA rules).
- Cross-border transfers may be subject to SAMA foreign-exchange
  controls.

#### 18.5.7.2 What is Pending

- Whether MTQ qualifies as a "payment instrument" or "experimental
  stablecoin" under the SAMA sandbox framework.
- Whether the issuing bank must hold a SAMA payment-services
  license or whether sandbox approval suffices.
- Whether the Protected Backing Cell satisfies SAMA ring-fencing
  requirements.
- Whether MTQ is Shariah-compliant (specifically, whether the
  multi-currency reserve structure and the gold sleeve comply
  with Shariah principles).
- Whether transferability is restricted to SAMA-cleared
  institutional counterparties.
- Whether cross-border redemption is restricted by SAMA
  foreign-exchange controls.

#### 18.5.7.3 What Requires Legal Opinion

A Saudi legal opinion would need to cover:
- The classification of MTQ under SAMA's payment-services regime
  and sandbox framework.
- The Shariah-compliance analysis (likely requiring a separate
  Shariah opinion from a recognized Shariah advisory firm).
- The licensing path (SAMA payment-services license, sandbox
  approval).
- The segregation analysis under SAMA rules and the Saudi Civil
  Transactions Law.
- The cross-border transferability analysis.
- The governing-law and dispute-resolution recommendations (Saudi
  law vs. ADGM / DIFC law; Saudi courts vs. GCC Commercial
  Arbitration Centre).

The opinion should be issued by a Saudi-qualified law firm with
demonstrable SAMA and CMA experience, plus a Shariah opinion
from a recognized Shariah advisory firm.

### 18.5.8 Jurisdiction `JP` — Japan

#### 18.5.8.1 What is Known

- The Payment Services Act (PSA), as amended in 2023, governs
  crypto-assets (formerly "virtual currencies", now "crypto-assets")
  and stablecoins.
- The 2023 stablecoin amendments (PSA Title III-3) establish a
  stablecoin-issuer authorization regime.
- Stablecoins are treated as electronically recorded monetary
  claims; the issuer must hold matching reserve assets (cash and
  deposits) segregated from its own assets.
- The holder has a redemption claim at par against the issuer per
  PSA art. 3-3.
- On issuer insolvency, segregated assets are expected to be
  excluded from the bankruptcy estate under PSA trust rules.
- The Japanese Financial Services Agency (JFSA) supervises
  crypto-asset exchange businesses and stablecoin issuers.
- The Japanese Civil Code art. 364 governs assignment-as-security.

#### 18.5.8.2 What is Pending

- Whether MTQ qualifies as a stablecoin under the PSA Title III-3
  (single-currency requirement may not be satisfied by MTQ's
  multi-currency reserve).
- Whether MTQ qualifies as an "electronically recorded monetary
  claim" under the PSA.
- Whether the issuing bank must hold JFSA crypto-asset exchange
  registration and stablecoin-issuer authorization.
- Whether the Protected Backing Cell satisfies the PSA trust-rule
  segregation.
- Whether transferability is restricted to JFSA-cleared
  counterparties.
- Whether transfers to sanctioned parties are prohibited (likely
  yes, per JFSA sanctions requirements).

#### 18.5.8.3 What Requires Legal Opinion

A Japanese legal opinion would need to cover:
- The PSA classification of MTQ (stablecoin vs. crypto-asset vs.
  electronically recorded monetary claim).
- The licensing path (JFSA crypto-asset exchange registration,
  stablecoin-issuer authorization).
- The PSA trust-rule segregation analysis for the Protected
  Backing Cell.
- The insolvency treatment of the cell under the PSA and the
  Civil Rehabilitation Act / Bankruptcy Act.
- The transferability and pledgeability analysis (Japanese Civil
  Code art. 364).
- The governing-law and dispute-resolution recommendations
  (Japanese law + Tokyo courts vs. JCAA arbitration).

The opinion should be issued by a Japanese-qualified law firm
with demonstrable JFSA payment-services experience.

## 18.6 Speculative-Note Discipline

Every dimension field in every jurisdiction's seeded entry is
prefixed or suffixed with the speculative-note disclaimer:

> "PENDING OPINION — speculative engineering triage, not legal
> advice."

This is enforced structurally: the `pendingEvidenceState()`
helper appends the speculative note to the `notes` field of every
seeded entry. No downstream consumer can mistake the seeded text
for a definitive legal classification.

## 18.7 Registry Query Functions

The §49 module exposes the following query functions:

### 18.7.1 `getJurisdictionLegalStatus(jurisdiction)`

Returns the registry entry for a jurisdiction, or a conservative
`PENDING` placeholder when the jurisdiction is not seeded. NEVER
returns null; NEVER returns an invented classification.

### 18.7.2 `registerLegalOpinion(jurisdiction, opinion)`

Registers an external legal opinion against a jurisdiction.
Lifecycle rule:
- `JURISDICTION_PENDING` → `LEGAL_OPINION_OBTAINED` (allowed when
  evidence is provided).
- `LEGAL_OPINION_OBTAINED` → `LEGAL_OPINION_OBTAINED` (idempotent
  refresh; no `VALIDATED` jump).
- `VALIDATED` → (no-op; validated jurisdictions cannot be reset by
  opinion).

This function NEVER transitions to `VALIDATED`. Only
`validateJurisdiction` may do that, and only when validation evidence
is provided.

### 18.7.3 `validateJurisdiction(jurisdiction, evidence)`

Transitions a jurisdiction to `VALIDATED` using external validation
evidence. Only callable when:
1. The jurisdiction is currently `LEGAL_OPINION_OBTAINED`.
2. Validation evidence (validator + date + artifact) is provided.

Returns the updated entry, or the existing entry unchanged when the
preconditions are not met. NEVER invents a validation.

### 18.7.4 `listPendingJurisdictions()`

Returns all jurisdictions currently classified as
`JURISDICTION_PENDING`. At time of writing, this includes ALL 8
seeded jurisdictions.

### 18.7.5 `listValidatedJurisdictions()`

Returns all jurisdictions currently classified as `VALIDATED`. At
time of writing, this list is EMPTY (validatedCount = 0).

### 18.7.6 `holderRightsSummary(jurisdiction)`

Returns a summary of holder rights for a jurisdiction. Until the
jurisdiction is `VALIDATED`, the summary is explicitly
`PENDING OPINION` and MUST NOT be presented as a definitive holder-
rights characterization.

### 18.7.7 `redemptionFramework(jurisdiction)`

Returns the redemption framework for a jurisdiction. Until
`VALIDATED`, the framework is explicitly `PENDING OPINION`.

### 18.7.8 `insolvencyTreatment(jurisdiction)`

Returns the insolvency treatment for a jurisdiction. Until
`VALIDATED`, the treatment is explicitly `PENDING OPINION`.

## 18.8 Illustrative Example — What a Legal Opinion for Singapore Would Need to Cover

This example illustrates the scope of a legal opinion that would
transition Singapore (`SG`) from `JURISDICTION_PENDING` to
`LEGAL_OPINION_OBTAINED`. The example is illustrative; no opinion
has been obtained. The opinion must be issued by a Singapore-
qualified law firm with demonstrable MAS payment-services experience.

### 18.8.1 Opinion Scope

The opinion should address, at minimum:

#### 18.8.1.1 Classification

- Whether MTQ qualifies as a Single-Currency Stablecoin (SCS) under
  the MAS SCS framework, given that MTQ's reserve is multi-currency
  (11 reserve currencies per §V25.2 reserve spec).
- If not an SCS, whether MTQ qualifies as a Digital Payment Token
  (DPT) under the PSA.
- If neither, what classification applies under Singapore law.

#### 18.8.1.2 Licensing Path

- Whether the issuing bank must hold a MAS Major Payment Institution
  License (PSN02) for MTQ issuance.
- Whether MAS SCS issuer approval is required (if MTQ is classified
  as an SCS).
- Whether a DPT service license under the PSA is required (if MTQ
  is classified as a DPT).
- Whether the bank's existing MAS banking license covers MTQ issuance
  (likely not, because MTQ is not a deposit).

#### 18.8.1.3 Reserve Segregation

- Whether the Protected Backing Cell satisfies the MAS SCS
  segregation requirements (if MTQ is an SCS).
- Whether the cell is held on trust for MTQ holders under Singapore
  trust law.
- Whether the cell is excluded from the bank's estate in insolvency
  under Singapore trust law and the Companies Act.

#### 18.8.1.4 Holder Rights

- The holder's contractual redemption claim at par under the MAS SCS
  conditions (redemption within 5 business days).
- The holder's claim priority in the bank's insolvency.
- The holder's enforcement options (court action, regulatory
  complaint).

#### 18.8.1.5 Settlement Finality

- Whether MTQ settlement finality follows the MAS-designated
  payment systems (MEPS+, MAS Project Orchid / Ubin+) or chain
  finality.
- The interaction between MTQ finality and Singapore's Designated
  Payment System oversight regime.

#### 18.8.1.6 Transferability and Pledgeability

- Whether transferability is restricted to non-prohibited persons
  under MAS PD / PDPA rules.
- Whether pledgeability is recognized under Singapore law subject
  to issuer consent.
- The perfection mechanism for security interests in MTQ.

#### 18.8.1.7 Governing Law and Dispute Resolution

- The recommendation for governing law (Singapore law vs. the
  obligor bank's home law).
- The recommendation for dispute resolution (Singapore courts vs.
  SIAC arbitration).
- The enforceability of Singapore judgments / arbitral awards in
  the obligor's home jurisdiction.

### 18.8.2 Opinion Evidence Required

To register the opinion via `registerLegalOpinion`, the following
evidence is required:

- `opinion.issuer` — the name of the Singapore-qualified law firm
  (e.g., "Allen & Gledhill" or "Drew & Napier" — illustrative
  names only; the actual issuer must be verified).
- `opinion.date` — the ISO-8601 date the opinion was issued.
- `opinion.artifact` — a stable identifier, URL, or hash for the
  opinion document (e.g., a digital signature hash, a law-firm
  reference number, or a public registry URL if filed).
- `opinion.dimensions` — the 13-dimension opinion text, populated
  from the actual opinion (replacing the seeded `PENDING OPINION`
  text with the firm's actual analysis).
- `opinion.notes` — free-form notes from the opinion issuer
  (e.g., scope limitations, assumptions, reliance matters).

### 18.8.3 Lifecycle Transition

On successful registration, the `SG` registry entry transitions:

- `classification`: `JURISDICTION_PENDING` →
  `LEGAL_OPINION_OBTAINED`.
- `legalOpinionsObtained`: `false` → `true`.
- The 13 dimension fields are updated with the firm's actual
  analysis (replacing the speculative triage text).
- `evidenceState.legalOpinionArtifact / Issuer / Date` are
  populated.
- `source`: updated to "External legal opinion: [firm] ([date])."
- `lastReviewed`: updated to the opinion date.

After the opinion is registered, the `SG` entry is
`LEGAL_OPINION_OBTAINED` — one step closer to `VALIDATED`. To
transition to `VALIDATED`, a subsequent external validation
campaign (e.g., by a regulator or an independent counsel) must
register validation evidence via `validateJurisdiction`.

### 18.8.4 Honest-State Implications

After the opinion is registered:
- `legalOpinionsObtained = true` for `SG` (the registry entry's
  field).
- The §74 honest-state `LEGAL_OPINIONS_OBTAINED = false` reflects
  the SYSTEM-WIDE state, not the per-jurisdiction state. At time
  of writing, the system-wide field is `false` because no opinion
  has been obtained for any jurisdiction. After the `SG` opinion is
  registered, the system-wide field would be updated to `true`
  (but this requires a directive amendment; the module does not
  auto-update the §74 field).
- `VALIDATED_JURISDICTIONS = 0` remains unchanged (the opinion
  does not validate the jurisdiction; only validation evidence
  does that).

## 18.9 Cross-References

The §49 framework integrates with:

- **§47 Protected Backing Cell** — the cell's segregation is the
  legal fact that dimensions 7 (creditor treatment) and 8
  (insolvency treatment) analyze.
- **§48 Bank Default & Resolution Framework** — the lifecycle
  states depend on the legal characterization (e.g., the
  insolvency-treatment dimension governs what happens in `INSOLVENT`).
- **§50 Licensing / Entity Matrix** — dimension 13 (licensing
  classification) provides the legal basis for the §50 licensing
  requirements.
- **`proof-of-liabilities.ts`** — the proof-of-liabilities receipt
  is the cryptographic evidence the holder submits to the
  resolution authority, supported by the §49 legal characterization
  of the holder's claim.

---

# SECTION 19 — LICENSING / ENTITY MATRIX (§50)

## 19.0 Module Identity

| Field | Value |
|---|---|
| Module ID | `v25.2-licensing-entity-matrix-1.0` |
| Directive section | §50 |
| Source file | `src/lib/licensing-entity-matrix.ts` (784 lines) |
| Final status | IMPLEMENTED BLUEPRINT — 0 LICENSES OBTAINED — NOT REGULATORY-AUTHORIZED — NOT PRODUCTION-AUTHORIZED |
| Controlling principle | **Technical implementation is NOT regulatory authorization.** |

The §50 framework defines the Licensing / Entity Matrix: a
comprehensive map of every (financial activity × jurisdiction) pair
in which MITHQAL or a participating entity would conduct regulated
activity, and the license / authorization required for that activity
in that jurisdiction.

## 19.1 Controlling Principle — Technical Implementation is NOT Regulatory Authorization

The single most important rule of §50 is:

> Technical implementation is NOT regulatory authorization. A working
> payment rail, custody smart contract, FX bridge, settlement
> engine, or CASP integration is NOT a license. MITHQAL may ENGINEER
> a regulated activity, but may not OPERATE it (and may not represent
> it as operative) until the participating regulated entity has
> obtained the required authorization from the competent regulator in
> that jurisdiction.

This principle is enforced structurally:

1. Every matrix entry's `status` field defaults to
   `REQUIRED_NOT_OBTAINED`.
2. The `registerLicenseObtained` function refuses to transition to
   `OBTAINED` unless a non-empty `evidence` string is provided.
   Evidence must be a verifiable reference: a regulator register
   URL, a license / certificate number, or a public-record citation.
3. The matrix invariant is asserted at module load:
   `licensesObtained === 0` (every entry must default to
   `REQUIRED_NOT_OBTAINED`).
4. The `mithqalRole` invariant is asserted at module load: every
   entry's `mithqalRole` must be one of `{NONE, VERIFICATION,
   ORCHESTRATION, INFRASTRUCTURE}`. The roles `GUARANTOR` and
   `FINANCIAL_GUARANTOR` are PROHIBITED.

## 19.2 Honest State (§74)

```typescript
{
  licensingMatrixImplemented: true,
  licensesObtained: 0,
}
```

- `licensingMatrixImplemented = true` — the matrix is fully built:
  72 entries (9 activities × 8 jurisdictions).
- `licensesObtained = 0` — no license, registration, or authorization
  has been obtained by MITHQAL, JOZOUR LLC (the current operating
  entity, New Jersey), or any planned commercial subsidiary
  (Foundation / Holding / Operations Ltd. / Markets Ltd. /
  Technology Co.) in ANY of the 8 jurisdictions × 9 activities
  catalogued below. Every entry defaults to
  `status = REQUIRED_NOT_OBTAINED` and `evidence = NONE`.

## 19.3 Scope — 9 Activities × 8 Jurisdictions = 72 Matrix Entries

### 19.3.1 The 9 Financial Activities

1. `banking` — Taking deposits / extending credit / treasury &
   deposit banking.
2. `payment-services` — Money transmission / payment services /
   stored-value / payment-account operation.
3. `custody` — Safekeeping / segregation / allocated custody of
   reserve assets (fiat, bullion, securities, digital).
4. `fx` — Foreign-exchange dealing / conversion / spot & forward FX
   execution.
5. `digital-asset-casp` — Crypto-asset service provider (CASP) —
   exchange, transfer, custody, or issuance of crypto-assets.
6. `securities` — Dealing in / arranging deals in / advising on
   securities (including tokenized securities).
7. `commodity` — Commodity dealing / arranging commodity-derivative
   trades / operating a commodity market.
8. `cbdc-access` — Access to / participation in central-bank money
   settlement infrastructure (CBDC, RTGS, instant-payment rails).
9. `settlement-activities` — Operation of / participation in a
   securities, payment, or digital-asset settlement system.

### 19.3.2 The 8 Jurisdictions

1. `US` — United States.
2. `UAE` — United Arab Emirates.
3. `UK` — United Kingdom.
4. `EU` — European Union.
5. `SINGAPORE` — Singapore.
6. `SWITZERLAND` — Switzerland.
7. `HONG_KONG` — Hong Kong SAR.
8. `KSA` — Kingdom of Saudi Arabia.

The jurisdictions were selected to cover: the operating entity's
home jurisdiction (US), the AED-peg jurisdiction (UAE), the major
financial centers (UK, EU, Singapore, Switzerland, Hong Kong), and
the GCC counterpart to the AED peg (KSA).

### 19.3.3 Matrix Size

9 activities × 8 jurisdictions = **72 matrix entries**. Every entry
is populated; no entry is left blank. Every entry defaults to
`status = REQUIRED_NOT_OBTAINED` and `evidence = NONE`.

## 19.4 Licensing Lifecycle

The lifecycle of a licensing requirement is one-way and
evidence-gated:

```
REQUIRED_NOT_OBTAINED  →  PENDING_APPLICATION  →  OBTAINED
                                                  ↘ EXEMPT
                                                  ↘ PROHIBITED
```

### 19.4.1 `REQUIRED_NOT_OBTAINED`

The DEFAULT state for every matrix entry. The license is required
and has NOT been obtained. Technical implementation alone does not
authorize the activity to proceed.

### 19.4.2 `PENDING_APPLICATION`

The license is required, an application has been filed with the
regulator, and the regulator has not yet granted authorization.
The activity MAY NOT proceed until the license is granted.

### 19.4.3 `OBTAINED`

The license has been granted by the competent regulator AND
verifiable evidence (regulator URL, certificate reference, register
entry) exists. The activity may proceed.

### 19.4.4 `EXEMPT`

The regulator has formally confirmed the activity is exempt from
licensing in that jurisdiction (still requires written evidence).
The activity may proceed within the exemption scope.

### 19.4.5 `PROHIBITED`

The activity is legally prohibited in that jurisdiction and MITHQAL
must not facilitate it.

### 19.4.6 Lifecycle Constraints

- `REQUIRED_NOT_OBTAINED` is the default for every matrix entry.
- The `registerLicenseObtained` function only transitions an entry
  to `OBTAINED` when a non-empty `evidence` string is provided.
- `OBTAINED` is terminal for the lifecycle (no auto-revert to
  `REQUIRED_NOT_OBTAINED`).
- The matrix invariant asserts `licensesObtained === 0` at module
  load.

## 19.5 MITHQAL Role — NEVER `GUARANTOR`

The `mithqalRole` field of every matrix entry is constrained to one
of four values:

```
ALLOWED_MITHQAL_ROLES = { "NONE", "VERIFICATION", "ORCHESTRATION", "INFRASTRUCTURE" }
```

The roles `GUARANTOR` and `FINANCIAL_GUARANTOR` are PROHIBITED. This
is asserted at module load by `assertMithqalRoleInvariant()`, which
throws if any entry's `mithqalRole` prefix is not in the allowed
set.

### 19.5.1 Role Definitions

#### 19.5.1.1 `NONE`

MITHQAL has no direct role in the activity. The activity is
conducted entirely by the regulated entity (typically the bank).
Example: `banking` activity — MITHQAL does not perform banking;
licensed banks retain the activity.

#### 19.5.1.2 `VERIFICATION`

MITHQAL verifies the regulated entity's compliance with the
architecture's requirements. MITHQAL does not perform the activity
itself. Example: `custody` activity — MITHQAL verifies bank-side
earmarked / allocation and reconciliation proofs; it does NOT itself
custody assets.

#### 19.5.1.3 `ORCHESTRATION`

MITHQAL orchestrates the workflow of the activity; the regulated
entity (typically a bank or an authorized FX provider) executes the
trade under its own license. Example: `fx` activity — MITHQAL
orchestrates FX execution flow; banks or authorized FX providers
execute trades under their own license.

#### 19.5.1.4 `INFRASTRUCTURE`

MITHQAL engineers the technical infrastructure for the activity;
the regulated entity (typically the OPERATING_CO subsidiary)
obtains the license and operates the service. Example:
`payment-services` activity — MITHQAL engineers the payment rail;
the regulated OPERATING_CO obtains the license and operates the
service.

### 19.5.2 Role-Activity Matrix

| Activity | MITHQAL Role |
|---|---|
| `banking` | `NONE` |
| `payment-services` | `INFRASTRUCTURE` |
| `custody` | `VERIFICATION` |
| `fx` | `ORCHESTRATION` |
| `digital-asset-casp` | `INFRASTRUCTURE` |
| `securities` | `INFRASTRUCTURE` |
| `commodity` | `INFRASTRUCTURE` |
| `cbdc-access` | `NONE` |
| `settlement-activities` | `ORCHESTRATION` |

MITHQAL is NEVER `GUARANTOR` or `FINANCIAL_GUARANTOR` for any
activity in any jurisdiction.

## 19.6 The 9 Activities — Detailed Analysis

For each activity, we provide: (a) what the activity is, (b) why
MITHQAL might need it, (c) what license is typically required, and
(d) the per-jurisdiction license text.

### 19.6.1 Activity 1 — `banking`

#### 19.6.1.1 What it means

Taking deposits / extending credit / treasury & deposit banking.
This is the regulated business of accepting deposits from customers
and using those deposits to extend credit.

#### 19.6.1.2 Why MITHQAL might need it

MITHQAL does NOT perform banking and does NOT need a banking
license. The `mithqalRole = NONE`. Banking is conducted entirely by
licensed participating banks. The activity is included in the
matrix for completeness: every jurisdiction in which MITHQAL
operates has at least one licensed participating bank, and that
bank's banking license underpins the bank's ability to issue MTQ
against its Protected Backing Cell.

#### 19.6.1.3 What license is typically required

A full banking license from the competent regulator. The license
imposes capital adequacy, liquidity, governance, and reporting
requirements.

#### 19.6.1.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | Federal or state banking charter + BSA authorization (OCC / Federal Reserve / state DFI). |
| UAE | CBUAE Commercial Banking License (Federal Decree-Law No. 14/2018). |
| UK | PRA Banking Authorization (CRR firm) + FCA permissions. |
| EU | ECB SSM Banking Authorization (CRD VI / CRR 3). |
| SINGAPORE | MAS Full Bank or Wholesale Bank License (Banking Act 1970). |
| SWITZERLAND | FINMA Banking License (Banking Act of 1934, as amended). |
| HONG_KONG | HKMA Licensed Bank (Banking Ordinance, Cap. 155). |
| KSA | SAMA Banking License (Banking Control Law, Royal Decree M/5). |

#### 19.6.1.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: FULL — licensed depository institution conducts
  all deposit, credit, and treasury activity.
- **Custodian role**: Not directly involved (banks custody own
  deposits under separate authorization).
- **Liquidity provider role**: Not directly involved.

### 19.6.2 Activity 2 — `payment-services`

#### 19.6.2.1 What it means

Money transmission / payment services / stored-value / payment-
account operation. This covers the regulated business of moving
money between parties, including payment initiation, account
information, and money transmission.

#### 19.6.2.2 Why MITHQAL might need it

MITHQAL engineers the payment rail (the MITHQAL Bank Gateway, or
MBG). The MBG connects corporate treasuries to their banks for MTQ
settlement. To operate the MBG as a regulated service, the
OPERATING_CO subsidiary would need a payment-services license in
each jurisdiction where the service is offered to customers.

#### 19.6.2.3 What license is typically required

A payment-services license from the competent regulator. The license
imposes safeguarding, AML / CTF, governance, and reporting
requirements.

#### 19.6.2.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | FinCEN MSB registration + state-by-state Money Transmitter Licenses (BSA). |
| UAE | CBUAE Stored Value Facility (SVF) License (RPB). |
| UK | FCA Authorized Payment Institution or EMI Authorization (PSRs 2017). |
| EU | EMI or PI License under PSD2 (transposing into PSD3 / PSR1). |
| SINGAPORE | MAS Major Payment Institution License (PSN02, Payment Services Act). |
| SWITZERLAND | FINMA FinTech License or Bank-type license for payment services. |
| HONG_KONG | HKMA Stored Value Facility (SVF) License (SVFSA). |
| KSA | SAMA Payment Service Provider License (PSP Rules). |

#### 19.6.2.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: Customer-facing payment processing and bank-side
  settlement.
- **Custodian role**: Holds settlement-account balances (not
  customer-facing funds movement).
- **Liquidity provider role**: Intraday liquidity provision for
  payment cycles (where authorized).

### 19.6.3 Activity 3 — `custody`

#### 19.6.3.1 What it means

Safekeeping / segregation / allocated custody of reserve assets
(fiat, bullion, securities, digital). This is the regulated
business of holding assets on behalf of clients, segregated from
the custodian's own assets.

#### 19.6.3.2 Why MITHQAL might need it

The Protected Backing Cell (PBC) holds the assets that back MTQ
issuance. The PBC must be held in qualified custody, segregated
from the bank's general estate. MITHQAL verifies the custody
arrangements (via the proof-of-reserves attestation); MITHQAL does
NOT itself custody the assets. The custodian may be the issuing
bank (under its banking license) or a third-party qualified
custodian.

#### 19.6.3.3 What license is typically required

A custody license / authorization from the competent regulator,
with segregation, allocated-accounting, and proof-of-reserves
requirements.

#### 19.6.3.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | Trust Company charter (state) or SEC adviser-custody compliance under Rule 206(4)-2. |
| UAE | CBUAE Custody Authorization / ADGM or DIFC Custody License. |
| UK | FCA Custody & Safekeeping Authorization (CASS rules). |
| EU | CSDR Authorized CSD or MiCAR CASP Custody (for digital assets). |
| SINGAPORE | MAS Capital Markets Services License — Custody Services (SFA). |
| SWITZERLAND | FINMA Custodian Bank License (Banking Act). |
| HONG_KONG | SFC Type 1 (Dealing) + Custody authorization (SFO). |
| KSA | CMA Custody Services Authorization (CML). |

#### 19.6.3.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: Holds the Protected Backing Cell as a segregated,
  earmarked allocation (bank-side custody, not MITHQAL custody).
- **Custodian role**: FULL — qualified custodian holds assets in
  allocated, segregated, bankruptcy-remote custody; provides
  proof-of-reserves.
- **Liquidity provider role**: Not directly involved.

### 19.6.4 Activity 4 — `fx`

#### 19.6.4.1 What it means

Foreign-exchange dealing / conversion / spot & forward FX
execution. This is the regulated business of converting one
currency into another.

#### 19.6.4.2 Why MITHQAL might need it

MTQ is multi-currency (11 reserve currencies); FX conversion is
required when an MTQ issued against one currency's cell is redeemed
in another currency. MITHQAL orchestrates the FX execution flow;
the FX trade itself is executed by a licensed bank or an authorized
FX provider under its own license.

#### 19.6.4.3 What license is typically required

An FX dealer license / authorization from the competent regulator.
The license imposes market-conduct, risk-management, and reporting
requirements.

#### 19.6.4.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | NFA membership + CFTC FCM registration or state Money Transmitter License (for retail FX). |
| UAE | CBUAE FX Authorization (Retail FX Rules where retail clients are served). |
| UK | FCA Authorized Payment Institution with FX scope (or Investment Firm for FX derivatives). |
| EU | EMI / PI License with FX scope under PSD2 (or MiFID II for FX derivatives). |
| SINGAPORE | MAS Major Payment Institution License — Merchant FX (PSN02). |
| SWITZERLAND | FINMA Bank License (FX dealing treated as banking activity). |
| HONG_KONG | HKMA Authorized Institution (AI) status for FX dealing. |
| KSA | SAMA Authorized FX Dealer License (SAMA FX Rules). |

#### 19.6.4.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: FULL — licensed bank or authorized FX dealer
  executes the FX conversion and bears market & counterparty risk.
- **Custodian role**: Settles resulting balances (no direct FX
  dealing role).
- **Liquidity provider role**: May act as authorized FX liquidity
  provider (PSP / ECN) under its own license.

### 19.6.5 Activity 5 — `digital-asset-casp`

#### 19.6.5.1 What it means

Crypto-asset service provider (CASP) — exchange, transfer,
custody, or issuance of crypto-assets. This is the regulated
business of providing services related to crypto-assets (broadly
including stablecoins, security tokens, and utility tokens).

#### 19.6.5.2 Why MITHQAL might need it

MTQ is a tokenized settlement instrument. Issuance, transfer, and
custody of MTQ are crypto-asset services in most jurisdictions. To
operate these services as a regulated business, the OPERATING_CO
subsidiary would need a CASP license in each jurisdiction where
the service is offered to customers.

#### 19.6.5.3 What license is typically required

A CASP / VASP license / authorization from the competent regulator.
The license imposes AML / CTF, safeguarding, governance, and
reporting requirements.

#### 19.6.5.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | FinCEN MSB registration + state MTLs; NYDFS BitLicense if NY-resident customers are served. |
| UAE | VARA VASP License (or ADGM / DCCA equivalent, depending on the Free Zone). |
| UK | FCA Cryptoasset Registration under MLRs 2017 (as amended). |
| EU | MiCAR CASP Authorization (Regulation (EU) 2023/1114). |
| SINGAPORE | MAS Digital Payment Token (DPT) Service License (PSN02). |
| SWITZERLAND | FINMA FinSA License (Bank or FinTech authorization for digital assets). |
| HONG_KONG | SFC VATP License under the VATP regime (effective June 2023). |
| KSA | CMA Crypto-Asset Activities Rules (note: several CASP activities are prohibited). |

#### 19.6.5.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: May hold fiat-side settlement accounts; (where
  permitted) may provide banking to the CASP.
- **Custodian role**: Qualified custodian for digital-asset
  holdings (where the CASP does not self-custody).
- **Liquidity provider role**: Authorized stablecoin / digital-asset
  liquidity provider (DRQS-qualified).

### 19.6.6 Activity 6 — `securities`

#### 19.6.6.1 What it means

Dealing in / arranging deals in / advising on securities (including
tokenized securities). This is the regulated business of securities
brokerage, advisory, and underwriting.

#### 19.6.6.2 Why MITHQAL might need it

MTQ itself is NOT a security (it does not promise a return). But
the MITHQAL architecture includes a tokenization layer for RWAs
(tokenized commercial paper, tokenized securities, tokenized
commodities). To deal in or arrange deals in these tokenized
securities, the OPERATING_CO subsidiary would need a securities
license.

#### 19.6.6.3 What license is typically required

A broker-dealer / investment-firm license / authorization from
the competent regulator. The license imposes capital adequacy,
market-conduct, best-execution, and reporting requirements.

#### 19.6.6.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | SEC Broker-Dealer registration (FINRA member) + ATS registration under Reg. ATS (where applicable). |
| UAE | SCA Financial Activities License (Securities & Commodities Authority). |
| UK | FCA Investment Firm Authorization under MiFID II (IFD / IFR). |
| EU | MiFID II Investment Firm Authorization (IFD / IFR, transposed nationally). |
| SINGAPORE | MAS Capital Markets Services License — Dealing in Capital Markets Products. |
| SWITZERLAND | FINMA Securities Dealer License (FinSA / FinSO). |
| HONG_KONG | SFC Type 1 (Dealing in Securities) License (SFO). |
| KSA | CMA Authorized Person License (CML). |

#### 19.6.6.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: May underwrite or place securities under its own
  license.
- **Custodian role**: CSD / registrar custody of securities
  (including tokenized securities where eligible).
- **Liquidity provider role**: Authorized market-maker / liquidity
  provider for secondary-market liquidity.

### 19.6.7 Activity 7 — `commodity`

#### 19.6.7.1 What it means

Commodity dealing / arranging commodity-derivative trades /
operating a commodity market. This is the regulated business of
commodity brokerage and market-making.

#### 19.6.7.2 Why MITHQAL might need it

The MITHQAL architecture includes gold as a constitutional monetary
anchor (18% of the reserve). Tokenized gold (and other commodities)
may be in scope for the tokenization layer. To deal in or arrange
commodity-derivative trades, the OPERATING_CO subsidiary would
need a commodity license.

#### 19.6.7.3 What license is typically required

A commodity dealer / FCM license / authorization from the competent
regulator. The license imposes position limits, market-conduct,
and reporting requirements.

#### 19.6.7.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | CFTC registration (FCM / CTA / CPO) + NFA membership (Commodity Exchange Act). |
| UAE | SCA Commodity Activities License (or ADGM / DIFC equivalent). |
| UK | FCA Authorized Firm scope for Commodity Derivatives (MiFID II). |
| EU | MiFID II Commodity Derivatives Authorization (RTS 20 / RTS 21 position limits). |
| SINGAPORE | MAS Recognized Market Operator (RMO) or CMS License (commodity derivatives). |
| SWITZERLAND | FINMA Securities Dealer License (where commodity derivatives are in scope). |
| HONG_KONG | SFC Type 2 (Dealing in Futures Contracts) and / or Type 11 (where applicable). |
| KSA | CMA Commodity Activities Authorization (CML). |

#### 19.6.7.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: May deal in commodity derivatives under separate
  banking-license scope.
- **Custodian role**: Holds commodity warehouse receipts / tokenized
  commodity positions.
- **Liquidity provider role**: Authorized commodity liquidity
  provider / market-maker.

### 19.6.8 Activity 8 — `cbdc-access`

#### 19.6.8.1 What it means

Access to / participation in central-bank money settlement
infrastructure (CBDC, RTGS, instant-payment rails). This is the
regulated access to the central bank's settlement infrastructure.

#### 19.6.8.2 Why MITHQAL might need it

MITHQAL has NO direct CBDC access; only central-bank-eligible
settlement banks participate in CBDC rails. The `mithqalRole = NONE`.
The activity is included in the matrix for completeness: each
participating bank in a given jurisdiction may participate in
that jurisdiction's CBDC / RTGS / instant-payment rail, and that
participation is a precondition for the bank's ability to settle
MTQ redemptions in central-bank money.

#### 19.6.8.3 What license is typically required

Settlement-bank status with the central bank. The license imposes
operational, risk-management, and liquidity requirements.

#### 19.6.8.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | Federal Reserve Master Account access (FedNow / Fedwire) — Fed-licensed institution only. |
| UAE | CBUAE mBridge / Digital Dirham participant status (CBUAE-approved settlement bank). |
| UK | Bank of England Settlement Bank status (RTGS / CHAPS access). |
| EU | ECB TIPS / TARGET2 (T2) participant status (Eurosystem-eligible settlement bank). |
| SINGAPORE | MAS MEPS+ / Project Orchid / Ubin+ participant (MAS-approved settlement bank). |
| SWITZERLAND | SNB SIC system participant status (SNB-licensed settlement bank). |
| HONG_KONG | HKMA e-HKD / Project mBridge participant (HKMA-approved settlement bank). |
| KSA | SAMA Project mBridge / SARIE participant (SAMA-approved settlement bank). |

#### 19.6.8.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: FULL — settlement bank with central-bank master
  account / RTGS / CBDC participation rights.
- **Custodian role**: Supports segregated settlement-account
  balances; no direct CBDC access.
- **Liquidity provider role**: Intraday liquidity provision to
  settlement banks (where authorized).

### 19.6.9 Activity 9 — `settlement-activities`

#### 19.6.9.1 What it means

Operation of / participation in a securities, payment, or digital-
asset settlement system. This is the regulated business of operating
or participating in a settlement system.

#### 19.6.9.2 Why MITHQAL might need it

MITHQAL orchestrates settlement-finality workflow (§46). To operate
a settlement system as a regulated business, the OPERATING_CO
subsidiary would need a settlement-system license in each
jurisdiction. MITHQAL itself does not operate the settlement
system; the regulated OPERATING_CO operates it under its own
license.

#### 19.6.9.3 What license is typically required

A settlement-system license / authorization from the competent
regulator. The license imposes operational, risk-management, and
reporting requirements.

#### 19.6.9.4 Per-jurisdiction required licenses

| Jurisdiction | Required License |
|---|---|
| US | FRB Settlement Account access / DTC participant / NSS for Treasury settlement. |
| UAE | CBUAE Settlement System Authorization (or DFM / ADX clearing participant). |
| UK | Bank of England Settlement Bank status + CREST participant (for securities settlement). |
| EU | ECB T2 / T2S / TIPS participant status (Central Securities Depositories Regulation). |
| SINGAPORE | MAS Electronic Payment System (MEPS+) participant + CDP clearing. |
| SWITZERLAND | SIC System participant (SNB-licensed) + SIX SIS clearing participant. |
| HONG_KONG | HKMA CHATS participant + CMU clearing participant. |
| KSA | SAMA SARIE participant + mada clearing (where applicable). |

#### 19.6.9.5 Bank / Custodian / Liquidity Provider Roles

- **Bank role**: Settlement bank providing central-bank money
  settlement legs (where applicable).
- **Custodian role**: CSD / token-registry custody for delivery
  legs of DvP / PvP settlement.
- **Liquidity provider role**: Settlement liquidity provider for
  time-critical settlement windows.

## 19.7 The 8 Jurisdictions — Per-Jurisdiction View

For each jurisdiction, the matrix contains 9 entries (one per
activity). The following summarizes the per-jurisdiction view.

### 19.7.1 `US` — United States

| Activity | Responsible Entity | MITHQAL Role | Status |
|---|---|---|---|
| banking | BANK | NONE | REQUIRED_NOT_OBTAINED |
| payment-services | OPERATING_CO | INFRASTRUCTURE | REQUIRED_NOT_OBTAINED |
| custody | CUSTODIAN | VERIFICATION | REQUIRED_NOT_OBTAINED |
| fx | BANK | ORCHESTRATION | REQUIRED_NOT_OBTAINED |
| digital-asset-casp | OPERATING_CO | INFRASTRUCTURE | REQUIRED_NOT_OBTAINED |
| securities | OPERATING_CO | INFRASTRUCTURE | REQUIRED_NOT_OBTAINED |
| commodity | OPERATING_CO | INFRASTRUCTURE | REQUIRED_NOT_OBTAINED |
| cbdc-access | BANK | NONE | REQUIRED_NOT_OBTAINED |
| settlement-activities | OPERATING_CO | ORCHESTRATION | REQUIRED_NOT_OBTAINED |

### 19.7.2 `UAE` — United Arab Emirates

Same activity structure as `US`, with UAE-specific license texts
(see §19.6 per-activity tables). All entries
`REQUIRED_NOT_OBTAINED`.

### 19.7.3 `UK` — United Kingdom

Same activity structure, with UK-specific license texts. All
entries `REQUIRED_NOT_OBTAINED`.

### 19.7.4 `EU` — European Union

Same activity structure, with EU-specific license texts. All
entries `REQUIRED_NOT_OBTAINED`.

### 19.7.5 `SINGAPORE`

Same activity structure, with Singapore-specific license texts. All
entries `REQUIRED_NOT_OBTAINED`.

### 19.7.6 `SWITZERLAND`

Same activity structure, with Switzerland-specific license texts.
All entries `REQUIRED_NOT_OBTAINED`.

### 19.7.7 `HONG_KONG`

Same activity structure, with Hong Kong-specific license texts.
All entries `REQUIRED_NOT_OBTAINED`.

### 19.7.8 `KSA` — Kingdom of Saudi Arabia

Same activity structure, with KSA-specific license texts. All
entries `REQUIRED_NOT_OBTAINED`. NOTE: For `digital-asset-casp`,
several CASP activities may be `PROHIBITED` in KSA — this status
must be confirmed by a CMA legal opinion (see §18.5.7) before any
CASP activity is undertaken.

## 19.8 Matrix Invariants

The following invariants are asserted at module load by
`assertMithqalRoleInvariant()`. If any invariant is violated, the
module throws at import time.

1. **Size invariant**: `_MATRIX.length === ACTIVITIES.length *
   JURISDICTIONS.length` (9 × 8 = 72).
2. **Uniqueness invariant**: every `(activity, jurisdiction)` pair
   appears exactly once in the matrix.
3. **Completeness invariant**: every `(activity, jurisdiction)`
   pair (across all 9 activities × 8 jurisdictions) is present.
4. **Evidence invariant**: every entry's `evidence` is a non-empty
   string (default `"NONE"`).
5. **MITHQAL role invariant**: every entry's `mithqalRole` prefix
   is in `ALLOWED_MITHQAL_ROLES` (`NONE`, `VERIFICATION`,
   `ORCHESTRATION`, `INFRASTRUCTURE`). `GUARANTOR` and
   `FINANCIAL_GUARANTOR` are PROHIBITED.
6. **Default-state invariant**: at module load, every entry's
   `status` is `REQUIRED_NOT_OBTAINED`.
7. **Honest-state invariant**: at module load, `licensesObtained
   === 0`.

## 19.9 Query / Mutation API

The §50 module exposes the following functions:

### 19.9.1 `getLicensingEntry(activity, jurisdiction)`

Returns the single matrix entry for a given (activity, jurisdiction)
pair. Throws if the pair is not in the matrix (every valid pair
should resolve).

### 19.9.2 `listByActivity(activity)`

Returns all matrix entries for a given activity (one per
jurisdiction, 8 total).

### 19.9.3 `listByJurisdiction(jurisdiction)`

Returns all matrix entries for a given jurisdiction (one per
activity, 9 total).

### 19.9.4 `registerLicenseObtained(activity, jurisdiction, evidence)`

Transitions a matrix entry to `OBTAINED` status. ONLY mutates state
when a non-empty `evidence` string is provided. Returns `null` if
the evidence argument is empty or the (activity, jurisdiction) pair
was not found.

### 19.9.5 `countLicensesObtained()`

Returns the count of matrix entries with `status = OBTAINED`.
Returns 0 in the default module state.

### 19.9.6 `assessActivityLegality(activity, jurisdiction)`

Returns `{ mayProceed, reason, status }`. An activity may proceed
ONLY if `status === OBTAINED` or `status === EXEMPT`. It may NOT
proceed if `status` is `REQUIRED_NOT_OBTAINED`,
`PENDING_APPLICATION`, or `PROHIBITED`. Technical implementation
alone NEVER authorizes an activity to proceed.

### 19.9.7 `mithqalRoleForActivity(activity)`

Returns MITHQAL's role for a given activity. The role is ALWAYS
a non-financial-guarantor role.

### 19.9.8 `licensingHonestState()`

Returns the §74 honest-state snapshot:
`{ licensingMatrixImplemented: true, licensesObtained: 0 }`.

## 19.10 Illustrative Example — What a UAE CASP License Application Would Involve

This example illustrates the scope of a CASP (Crypto-Asset Service
Provider) license application in the UAE. The example is illustrative;
no license has been obtained.

### 19.10.1 The Matrix Entry

The matrix entry for `(digital-asset-casp, UAE)` is:

```typescript
{
  activity: "digital-asset-casp",
  jurisdiction: "UAE",
  legalActivity: "Crypto-asset service provider (CASP) — exchange, transfer, custody, or issuance of crypto-assets",
  requiredLicense: "VARA VASP License (or ADGM / DCCA equivalent, depending on the Free Zone)",
  responsibleEntity: "OPERATING_CO",
  mithqalRole: "INFRASTRUCTURE — MITHQAL engineers the digital-asset rail; the regulated OPERATING_CO obtains the CASP license and operates the service",
  bankRole: "May hold fiat-side settlement accounts; (where permitted) may provide banking to the CASP",
  custodianRole: "Qualified custodian for digital-asset holdings (where the CASP does not self-custody)",
  liquidityProviderRole: "Authorized stablecoin / digital-asset liquidity provider (DRQS-qualified)",
  status: "REQUIRED_NOT_OBTAINED",
  evidence: "NONE",
}
```

### 19.10.2 Application Path

The UAE has three principal CASP / VASP regulators:

1. **VARA** (Virtual Asset Regulatory Authority) — Dubai-specific,
   governs VASP activity in Dubai (excluding the DIFC).
2. **ADGM FSRA** (Abu Dhabi Global Market Financial Services
   Regulatory Authority) — governs VASP activity in the ADGM free
   zone.
3. **DFSA** (Dubai Financial Services Authority) — governs VASP
   activity in the DIFC free zone.

The OPERATING_CO would choose ONE regulator based on the entity's
domicile and the target customer base. The application typically
involves:

#### 19.10.2.1 Pre-Application Phase

- Entity formation in the chosen jurisdiction (Dubai mainland, ADGM,
  or DIFC).
- Corporate governance setup (board, risk committee, AML officer).
- Capital requirements (varies by regulator; ADGM FSRA typically
  requires USD 100k+ for a VASP).
- Business plan submission.

#### 19.10.2.2 Application Submission

- License application form (regulator-specific).
- Compliance manual (AML / CTF, market conduct, governance).
- Risk-management framework.
- Technology and security architecture (including the MITHQAL
  integration architecture).
- Key-personnel disclosures (fit-and-proper testing).
- Source-of-funds documentation.

#### 19.10.3 Review Phase

- Regulator review (typically 6-12 months).
- In-principle approval (subject to conditions).
- Conditions satisfaction (e.g., capital injection, system testing).
- Final approval.

#### 19.10.2.4 Post-Licensing

- Ongoing supervision (regulator reporting, audit).
- Annual license fee.
- Continuous compliance with AML / CTF, safeguarding, and
  market-conduct rules.

### 19.10.3 Required Evidence for Matrix Transition

To transition the `(digital-asset-casp, UAE)` entry from
`REQUIRED_NOT_OBTAINED` to `OBTAINED`, the following evidence
would be registered via `registerLicenseObtained`:

- A reference to the regulator's public register entry (e.g., the
  VARA VASP register URL for the OPERATING_CO entity).
- The license / certificate number.
- The license effective date.

The evidence must be a verifiable public-record citation. "We built
it" is NOT evidence — technical implementation is not regulatory
authorization.

### 19.10.4 Honest-State Implications

After the license is registered:
- The `(digital-asset-casp, UAE)` entry's `status` transitions to
  `OBTAINED`.
- The entry's `evidence` field is populated with the citation.
- The system-wide `licensesObtained` count increments to 1 (but
  this requires a directive amendment; the module's default
  state remains `licensesObtained = 0`).
- The §74 honest-state field `licensesObtained` would be updated
  (but only by directive amendment; the module does not auto-update
  §74 fields).

After this single transition, 71 of 72 matrix entries remain
`REQUIRED_NOT_OBTAINED`. The MITHQAL architecture is NOT
regulatory-authorized to operate any of those 71 activities in
their respective jurisdictions.

## 19.11 Cross-References

The §50 framework integrates with:

- **§47 Protected Backing Cell** — the cell's custody falls under the
  `custody` activity (§19.6.3).
- **§48 Bank Default & Resolution Framework** — the bank's lifecycle
  transitions are conditioned on the bank's licenses (e.g., a bank
  in `RESTRICTED` may have its `banking` license under supervisory
  review).
- **§49 Legal Liability Framework** — the legal classification of
  MTQ in each jurisdiction (§49 dimension 13) drives the licensing
  requirements in §50.
- **§52 Systemic Exposure Engine** — concentration limits include
  jurisdictional concentration, which interacts with the licensing
  matrix (e.g., a high concentration in a single jurisdiction
  increases regulatory risk if that jurisdiction's license is
  suspended).
- **MTQ Operating System (§22)** — the MBG (MITHQAL Bank Gateway)
  is the technical infrastructure for the `payment-services` activity
  (§19.6.2).

---

# SECTION 20 — SYSTEMIC EXPOSURE ENGINE (§52)

## 20.0 Module Identity

| Field | Value |
|---|---|
| Module ID | `v25.2-systemic-exposure-engine-1.0` |
| Spec version | v25.2 §52 System-Wide Exposure & Concentration |
| Directive section | §52 |
| Source file | `src/lib/systemic-exposure-engine.ts` (1,295 lines) |
| Final status | APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED |
| Controlling principle | **Measure concentration across 13 dimensions. Answer per-bank (A) individual-limit and (B) system-wide-growth questions. Honest state per §74: designed + implemented; live monitoring + production validation NOT claimed.** |

The §52 framework implements the System-Wide Exposure &
Concentration Engine. It provides:

1. A 13-dimension concentration measurement framework.
2. The two pivotal systemic-risk questions (Question A:
   individual-limit; Question B: system-wide-growth).
3. A `SystemicExposureSnapshot` — a cross-dimensional view of all
   institutional exposures.
4. A per-bank `BankVsSystemWideResult` answering Questions A & B.
5. A reference input bundle for the §3 DMCE engine.

## 20.1 Honest State (§74)

```typescript
SYSTEMIC_EXPOSURE_HONEST_STATE = {
  systemicRiskEngineDesigned:       true,
  systemicRiskEngineImplemented:    true,
  systemicRiskMonitoringLive:       false,  // NO live institutional data feeds
  systemicRiskProductionValidated:  false,  // NO production deployment
}
```

These four fields are LITERAL and IMMUTABLE until live institutional
data feeds are integrated and a production deployment is
validated.

### 20.1.1 Honesty Contract

- The engine is a DESIGN-TIME systemic exposure measurement engine.
- It operates on declarative bank / custodian / provider / asset
  inputs (currently SIMULATED reference data in
  `buildReferenceSystemicSnapshot`).
- It does NOT poll live bank balances, live custodian holdings, or
  live oracle feeds.
- Any live-monitoring claim would be dishonest and is therefore NOT
  made.

## 20.2 The 13 Concentration Dimensions

The §52 framework measures concentration across 13 dimensions. Each
dimension is a distinct axis along which the system's exposure may
concentrate. The 13 dimensions, in canonical order:

```typescript
ALL_DIMENSIONS = [
  "bank",                          // 1
  "banking-group",                 // 2
  "country",                       // 3
  "currency",                      // 4
  "custodian",                      // 5
  "correspondent",                 // 6
  "settlement-rail",               // 7
  "liquidity-provider",            // 8
  "stablecoin-issuer",             // 9
  "technology-provider",           // 10
  "geopolitical-correlation",      // 11
  "operational-correlation",       // 12
  "bank-exposure",                 // 13 (§76 — also measured as a distinct dimension)
]
```

For each dimension below, we explain: (a) what it measures, (b) why
it matters, (c) how it's calculated, and (d) the preferred / hard
limits.

### 20.2.1 Dimension 1 — `bank`

#### 20.2.1.1 What it measures

Concentration of exposure to a single participating bank. Each bank's
exposure is the USD-notional amount of the bank's Protected Backing
Cell and on-chain MTQ supply attributed to that bank.

#### 20.2.1.2 Why it matters

A single bank's failure should not propagate systemic losses. If
one bank holds, e.g., 40% of total system exposure, that bank's
failure would impair 40% of the system's MTQ supply and potentially
trigger a system-wide redemption run. The bank dimension is the
primary concentration measure for idiosyncratic bank risk.

#### 20.2.1.3 How it's calculated

For each bank `b` in the input:
```
exposurePct_b = b.exposureAmount / totalExposure
```
where `totalExposure = max(bankTotal, assetTotal, custodianTotal,
providerTotal, 1)`. The status is classified as `within` (≤
preferred), `near-breach` (> preferred, ≤ hard), or `breach` (>
hard).

#### 20.2.1.4 Limits

- Preferred: 15% (`preferredBankExposure = 0.15`).
- Hard: 20% (`hardBankExposure = 0.20`).

The master directive specifies the preferred bank exposure range as
10-15%; the engine adopts the upper bound (15%) as the operational
preferred threshold.

### 20.2.2 Dimension 2 — `banking-group`

#### 20.2.2.1 What it measures

Concentration of exposure to a single banking group (parent company).
Banks under common ownership are aggregated; the group's total
exposure is the sum of its member banks' exposures.

#### 20.2.2.2 Why it matters

A parent company's failure (e.g., a holding-company insolvency) can
impair all member banks simultaneously. Even if no single bank
breaches the bank limit (15%), the group as a whole may be a
systemic concentration point. The banking-group dimension surfaces
this risk explicitly.

#### 20.2.2.3 How it's calculated

```
For each bank b in input:
  groupAgg[b.bankingGroup] += b.exposureAmount

For each group g:
  exposurePct_g = groupAgg[g] / totalExposure
```

The metadata's `parentGroup` field is set to the group name, so
cross-dimension correlation (`bank ↔ banking-group`) can match on
`parentGroup`.

#### 20.2.2.4 Limits

- Preferred: 15% (`preferredBankingGroupExposure = 0.15`).
- Hard: 20% (`hardBankingGroupExposure = 0.20`).

Same thresholds as the `bank` dimension, to surface group-level
concentration explicitly.

### 20.2.3 Dimension 3 — `country`

#### 20.2.3.1 What it measures

Concentration of exposure to a single country (jurisdiction). Banks
are aggregated by their `country` attribute.

#### 20.2.3.2 Why it matters

A country-specific shock (e.g., a sovereign downgrade, a
macroeconomic crisis, a sanctions event) can impair all banks in
that country simultaneously. The country dimension surfaces
sovereign-risk concentration.

#### 20.2.3.3 How it's calculated

```
For each bank b in input:
  countryAgg[b.country] += b.exposureAmount

For each country c:
  exposurePct_c = countryAgg[c] / totalExposure
```

The metadata's `jurisdiction` field is set to the country code, so
cross-dimension correlation (`bank ↔ country`) can match on
`jurisdiction`. NOTE: Custodian jurisdictions are surfaced via the
custodian dimension's metadata, NOT added here, to avoid
double-counting the same reserve dollars.

#### 20.2.3.4 Limits

- Preferred: 20% (`preferredCountryExposure = 0.20`).
- Hard: 25% (`hardCountryExposure = 0.25`).

Country limits are higher than bank / custodian limits because
country diversification is harder to achieve (there are fewer
credible banking jurisdictions than there are credible banks).

### 20.2.4 Dimension 4 — `currency`

#### 20.2.4.1 What it measures

Concentration of exposure to a single currency. Assets are
aggregated by their `currency` attribute.

#### 20.2.4.2 Why it matters

A currency-specific shock (e.g., a USD depreciation, an EUR
crisis, a JPY intervention) can impair all assets denominated in
that currency simultaneously. The currency dimension surfaces
FX-risk concentration.

#### 20.2.4.3 How it's calculated

```
For each asset a in input:
  currencyAgg[a.currency] += a.exposureAmount

For each currency ccy:
  exposurePct_ccy = currencyAgg[ccy] / totalExposure
```

NOTE: Banks' `currency` field is reserved as descriptive metadata;
it is NOT summed into the currency dimension to avoid double-counting
(the bank's holding IS the asset's currency).

#### 20.2.4.4 Limits

- Preferred: 15% (`preferredCurrencyExposure = 0.15`).
- Hard: 20% (`hardCurrencyExposure = 0.20`).

### 20.2.5 Dimension 5 — `custodian`

#### 20.2.5.1 What it measures

Concentration of exposure to a single qualified custodian. Each
custodian's exposure is its `exposureAmount` attribute (the USD-
notional amount of assets held by the custodian).

#### 20.2.5.2 Why it matters

A custodian's failure (e.g., a custody-bank insolvency) can impair
all assets held by that custodian. Even if the assets are legally
segregated from the custodian's estate, the operational disruption
can be severe. The custodian dimension surfaces custody-risk
concentration.

#### 20.2.5.3 How it's calculated

```
For each custodian c in input:
  exposurePct_c = c.exposureAmount / totalExposure
```

The metadata's `parentGroup` and `jurisdiction` fields are set
to the custodian's parent group and jurisdiction, so cross-dimension
correlation (`custodian ↔ banking-group`, `custodian ↔ country`,
`custodian ↔ technology-provider`) can match.

#### 20.2.5.4 Limits

- Preferred: 15% (`preferredCustodianExposure = 0.15`).
- Hard: 20% (`hardCustodianExposure = 0.20`).

### 20.2.6 Dimension 6 — `correspondent`

#### 20.2.6.1 What it measures

Concentration of exposure to a single correspondent banking network.
Banks are aggregated by their `correspondent` attribute.

#### 20.2.6.2 Why it matters

A correspondent's failure (e.g., a correspondent-bank insolvency)
can impair all banks that rely on that correspondent for cross-
border payments. The correspondent dimension surfaces correspondent-
banking-risk concentration.

#### 20.2.6.3 How it's calculated

```
For each bank b in input where b.correspondent is set:
  corrAgg[b.correspondent] += b.exposureAmount

For each correspondent c:
  exposurePct_c = corrAgg[c] / totalExposure
```

The metadata's `parentGroup` field is set to the contributing
bank's banking group, so cross-dimension correlation
(`correspondent ↔ banking-group`) can identify systemic linkage.

#### 20.2.6.4 Limits

- Preferred: 15% (`preferredCorrespondentExposure = 0.15`).
- Hard: 20% (`hardCorrespondentExposure = 0.20`).

### 20.2.7 Dimension 7 — `settlement-rail`

#### 20.2.7.1 What it measures

Concentration of exposure to a single settlement rail (e.g., SWIFT,
CIPS, CHIPS, TARGET2). Banks are aggregated by their
`settlementRail` attribute.

#### 20.2.7.2 Why it matters

A settlement-rail outage (e.g., a SWIFT disruption, a CIPS
operational incident) can impair all banks that rely on that rail.
The settlement-rail dimension surfaces operational-risk concentration.

#### 20.2.7.3 How it's calculated

```
For each bank b in input where b.settlementRail is set:
  railAgg[b.settlementRail] += b.exposureAmount

For each rail r:
  exposurePct_r = railAgg[r] / totalExposure
```

#### 20.2.7.4 Limits

- Preferred: 25% (`preferredSettlementRailExposure = 0.25`).
- Hard: 35% (`hardSettlementRailExposure = 0.35`).

Rail limits are higher than bank / custodian limits because rails
are naturally concentrated (there are only a handful of global
settlement rails).

### 20.2.8 Dimension 8 — `liquidity-provider`

#### 20.2.8.1 What it measures

Concentration of exposure to a single liquidity provider. Banks are
aggregated by their `liquidityProvider` attribute.

#### 20.2.8.2 Why it matters

A liquidity provider's failure can impair all banks that rely on
that provider for intraday liquidity. The liquidity-provider dimension
surfaces liquidity-provider-risk concentration.

#### 20.2.8.3 How it's calculated

```
For each bank b in input where b.liquidityProvider is set:
  lpAgg[b.liquidityProvider] += b.exposureAmount

For each liquidity provider lp:
  exposurePct_lp = lpAgg[lp] / totalExposure
```

#### 20.2.8.4 Limits

- Preferred: 20% (`preferredLiquidityProviderExposure = 0.20`).
- Hard: 30% (`hardLiquidityProviderExposure = 0.30`).

### 20.2.9 Dimension 9 — `stablecoin-issuer`

#### 20.2.9.1 What it measures

Concentration of exposure to a single stablecoin issuer. Assets of
type `stablecoin` are aggregated by their `stablecoinIssuer`
attribute.

#### 20.2.9.2 Why it matters

A stablecoin issuer's failure (e.g., a USDC de-peg, a USDT
insolvency event) can impair all stablecoin assets issued by that
issuer. The stablecoin-issuer dimension surfaces stablecoin-
issuer-risk concentration.

#### 20.2.9.3 How it's calculated

```
For each asset a in input where a.stablecoinIssuer is set:
  sciAgg[a.stablecoinIssuer] += a.exposureAmount

For each stablecoin issuer sci:
  exposurePct_sci = sciAgg[sci] / totalExposure
```

#### 20.2.9.4 Limits

- Preferred: 10% (`preferredStablecoinIssuerExposure = 0.10`).
- Hard: 15% (`hardStablecoinIssuerExposure = 0.15`).

Stablecoin-issuer limits are tighter than bank / custodian limits
because stablecoin issuers are perceived as higher-risk
(counterparty risk to the issuer's reserve and redemption
mechanism).

### 20.2.10 Dimension 10 — `technology-provider`

#### 20.2.10.1 What it measures

Concentration of exposure to a single technology provider (e.g., a
custody-technology vendor, a blockchain-infrastructure provider).
Custodians are aggregated by their `technologyProvider` attribute.

#### 20.2.10.2 Why it matters

A technology provider's failure (e.g., a custody-tech-vendor
outage, a blockchain bridge exploit) can impair all custodians that
rely on that technology. The technology-provider dimension surfaces
technology-risk concentration.

#### 20.2.10.3 How it's calculated

```
For each custodian c in input where c.technologyProvider is set:
  techAgg[c.technologyProvider] += c.exposureAmount

For each technology provider tp:
  exposurePct_tp = techAgg[tp] / totalExposure
```

#### 20.2.10.4 Limits

- Preferred: 15% (`preferredTechnologyProviderExposure = 0.15`).
- Hard: 20% (`hardTechnologyProviderExposure = 0.20`).

### 20.2.11 Dimension 11 — `geopolitical-correlation`

#### 20.2.11.1 What it measures

Concentration of exposure to a single geopolitical-correlation
block. Banks are grouped by their `geopoliticalCorrelation`
attribute (`low`, `medium`, or `high`).

#### 20.2.11.2 Why it matters

Banks within the same geopolitical-correlation block are exposed
to the same geopolitical shocks (e.g., sanctions, trade
restrictions, regional conflicts). The geopolitical-correlation
dimension surfaces correlated-geopolitical-risk concentration.

#### 20.2.11.3 How it's calculated

```
For each bank b in input:
  block = b.geopoliticalCorrelation ?? "low"
  geoItems.push({value: "geo-" + block, amount: b.exposureAmount})

geoAgg = aggregate(geoItems)

For each block b:
  exposurePct_b = geoAgg[b] / totalExposure
```

#### 20.2.11.4 Limits

- Preferred: 30% (`preferredGeopoliticalCorrelationExposure = 0.30`).
- Hard: 40% (`hardGeopoliticalCorrelationExposure = 0.40`).

Geopolitical-correlation limits are higher than entity-specific
limits because correlation blocks are coarser (only 3 blocks).

### 20.2.12 Dimension 12 — `operational-correlation`

#### 20.2.12.1 What it measures

Concentration of exposure to a single operational-correlation block.
Banks are grouped by their `operationalCorrelation` attribute
(`low`, `medium`, or `high`).

#### 20.2.12.2 Why it matters

Banks within the same operational-correlation block share
operational dependencies (e.g., common cloud providers, common
blockchain nodes, common settlement rails). The operational-
correlation dimension surfaces correlated-operational-risk
concentration.

#### 20.2.12.3 How it's calculated

```
For each bank b in input:
  block = b.operationalCorrelation ?? "low"
  opItems.push({value: "op-" + block, amount: b.exposureAmount})

opAgg = aggregate(opItems)

For each block b:
  exposurePct_b = opAgg[b] / totalExposure
```

#### 20.2.12.4 Limits

- Preferred: 30% (`preferredOperationalCorrelationExposure = 0.30`).
- Hard: 40% (`hardOperationalCorrelationExposure = 0.40`).

### 20.2.13 Dimension 13 — `bank-exposure`

#### 20.2.13.1 What it measures

The §76 bank-exposure dimension. Same per-bank underlying data as
the `bank` dimension (dimension 1), but surfaced as a distinct
dimension so §76 governance can apply separate thresholds for
"individual bank exposure" vs. the §52 bank concentration view.

#### 20.2.13.2 Why it matters

§76 introduces a distinct governance view of bank exposure,
separate from the §52 bank concentration view. The two views may
have different thresholds (e.g., §52 may use 15% preferred / 20%
hard; §76 may use 10% preferred / 20% hard for the individual-bank-
exposure view). The `bank-exposure` dimension allows both governance
views to coexist.

#### 20.2.13.3 How it's calculated

Same as dimension 1 (`bank`): for each bank `b` in the input,
`exposurePct_b = b.exposureAmount / totalExposure`. The metadata
includes a note: "§76 bank-exposure dimension (preferred 10-15%,
hard 20%)".

#### 20.2.13.4 Limits

- Preferred: 15% (`preferredBankExposureDimension = 0.15`, the
  upper bound of the §76 10-15% range).
- Hard: 20% (`hardBankExposureDimension = 0.20`).

## 20.3 Concentration Limits (§76)

The full set of concentration limits, as defined in the §76
CONCENTRATION_LIMITS constant:

```typescript
CONCENTRATION_LIMITS = {
  // Currency (§76) — preferred 15%, hard 20%
  preferredCurrencyExposure:                       0.15,
  hardCurrencyExposure:                            0.20,
  // Bank (§76) — preferred 10-15% (upper bound adopted), hard 20%
  preferredBankExposure:                            0.15,
  hardBankExposure:                                 0.20,
  // Custodian (§76) — preferred 15%, hard 20%
  preferredCustodianExposure:                       0.15,
  hardCustodianExposure:                            0.20,
  // Country (§76) — preferred 20%, hard 25%
  preferredCountryExposure:                         0.20,
  hardCountryExposure:                              0.25,
  // Banking group — preferred 15%, hard 20%
  preferredBankingGroupExposure:                    0.15,
  hardBankingGroupExposure:                         0.20,
  // Correspondent — preferred 15%, hard 20%
  preferredCorrespondentExposure:                   0.15,
  hardCorrespondentExposure:                        0.20,
  // Settlement rail — preferred 25%, hard 35%
  preferredSettlementRailExposure:                  0.25,
  hardSettlementRailExposure:                       0.35,
  // Liquidity provider — preferred 20%, hard 30%
  preferredLiquidityProviderExposure:               0.20,
  hardLiquidityProviderExposure:                    0.30,
  // Stablecoin issuer — preferred 10%, hard 15%
  preferredStablecoinIssuerExposure:                0.10,
  hardStablecoinIssuerExposure:                     0.15,
  // Technology provider — preferred 15%, hard 20%
  preferredTechnologyProviderExposure:              0.15,
  hardTechnologyProviderExposure:                   0.20,
  // Geopolitical correlation block — preferred 30%, hard 40%
  preferredGeopoliticalCorrelationExposure:         0.30,
  hardGeopoliticalCorrelationExposure:              0.40,
  // Operational correlation block — preferred 30%, hard 40%
  preferredOperationalCorrelationExposure:           0.30,
  hardOperationalCorrelationExposure:                0.40,
  // Bank-exposure dimension (§76) — preferred 10-15% (upper bound), hard 20%
  preferredBankExposureDimension:                   0.15,
  hardBankExposureDimension:                        0.20,
}
```

### 20.3.1 Status Classification

For each dimension-bucket, the status is classified as:

- `within` — `exposurePct ≤ preferred` (with 1e-9 tolerance).
- `near-breach` — `exposurePct > preferred` but `≤ hard` (with
  1e-9 tolerance).
- `breach` — `exposurePct > hard`.
- `unknown` — reserved for future use; not currently produced.

### 20.3.2 Limit Lookup Function

The `limitsForDimension(d)` function returns the
`{ preferred, hard }` pair for a given dimension. The default (for
unknown dimensions) is `{ preferred: 0.15, hard: 0.20 }`.

## 20.4 Bank-vs-System-Wide Assessment (Questions A & B)

The §52 framework answers two pivotal questions for each bank:

### 20.4.1 Question A — Individual Limit

**Question A:** Is Bank A within its individual limit?

**Calculation:** Compare the bank's `exposurePct` against its
individual `hardLimit`. The bank's individual limit defaults to
the hard bank cap (20%); an optional `individualLimitPct` field
allows per-bank customization.

**Output:** `individualLimitOk = (individualExposurePct ≤
individualLimit + 1e-9)`.

### 20.4.2 Question B — System-Wide Concentration

**Question B:** Does Bank A's growth create excessive system-wide
concentration?

**Calculation:**
1. Project the bank's exposure forward by its `growthDelta` (in
   percentage points; convert to fraction).
2. Check whether the projected exposure breaches the hard cap or
   preferred cap.
3. Check whether the bank (or its parent group) already appears in
   the snapshot's violation list.

**Output:** `growthCreatesExcessConcentration = wouldBreachHard ||
wouldBreachPreferred || (violationsForBank.length > 0)`.

### 20.4.3 Bank-vs-System-Wide Result

The `BankVsSystemWideResult` object contains:

- `bankId`, `bankName`.
- Question A fields: `individualLimitOk`, `individualExposurePct`,
  `individualLimit`.
- Question B fields: `systemWideConcentrationOk`,
  `growthCreatesExcessConcentration`, `projectedExposurePct`,
  `projectedSystemConcentrationScore`.
- Context: `details` (human-readable trace), `recommendation`.

### 20.4.4 Recommendation Logic

The recommendation is derived from the Question A and B results:

- If `!individualLimitOk`: "REDUCE exposure to bank immediately —
  individual hard limit already breached."
- Else if `wouldBreachHard`: "HOLD growth — projected exposure
  would breach the system-wide hard cap."
- Else if `wouldBreachPreferred`: "MONITOR growth — projected
  exposure would exceed the preferred system-wide cap."
- Else if `violationsForBank.length > 0`: "REMEDIATE existing
  system-wide violations attributed to this bank / group before
  expanding exposure."
- Else: "Within limits; continue routine systemic monitoring."

## 20.5 Enhanced DMCE Inputs (How Systemic Risk Feeds into Minting Capacity)

The §52 framework produces a reference input bundle for the §3 DMCE
(Dynamic Monetary Control Equation) engine. This bundle is NOT a
re-computation of DMCE — DMCE is owned by the canonical monetary
engine in `mtq-final-reserve-spec.ts`. The §52 module surfaces the
systemic-risk context for DMCE to consume.

### 20.5.1 The `EnhancedDMCEInput` Object

```typescript
interface EnhancedDMCEInput {
  bankId: string;
  bankName: string;
  bankExposurePct: number;            // bank's exposure as % of system
  bankGrowthDelta: number;            // pp period-over-period
  bankHardLimit: number;
  bankPreferredLimit: number;
  systemConcentrationScore: number;   // 0-1 HHI-style
  systemWideViolations: number;       // count of hard-limit breaches
  systemWideNearBreaches: number;    // count of preferred-limit breaches
  correlatedDimensions: Array<{       // correlated exposure across dimensions
    dimension: ConcentrationDimension;
    entityId: string;
    exposurePct: number;
  }>;
  note: string;                       // "REFERENCE input for §3 DMCE..."
}
```

### 20.5.2 How DMCE Consumes the Bundle

The DMCE engine (in `mtq-final-reserve-spec.ts`) consumes the
`EnhancedDMCEInput` alongside its canonical monetary inputs (the
reserve ratio, the corridor composition, the currency weights, the
liquidity overlay, etc.). The systemic-risk inputs modulate the
bank's issuance capacity:

- A bank with `bankExposurePct > bankPreferredLimit` has its
  issuance capacity reduced (the DMCE engine throttles issuance
  proportionally).
- A bank with `bankExposurePct > bankHardLimit` has its issuance
  capacity set to zero (no new issuance until exposure is reduced).
- A bank with `systemWideViolations > 0` attributed to it has its
  issuance capacity held at zero until the violations are
  remediated.
- A bank with `bankGrowthDelta > 0` projecting a future breach has
  its issuance capacity scaled to keep projected exposure below
  the preferred limit.

### 20.5.3 Honest-State Note

The DMCE engine's consumption of the `EnhancedDMCEInput` is a
REFERENCE contract — the §52 module does NOT recompute DMCE itself.
If the DMCE engine's consumption logic changes, the §52 module's
contract does NOT change; the §52 module continues to surface the
same systemic-risk context.

## 20.6 Systemic Concentration Score

The §52 framework computes a single 0-1 score summarizing system-
wide concentration. The score is computed by
`computeSystemicConcentrationScore(snapshot)`.

### 20.6.1 Formula

The score uses a normalized Herfindahl-Hirschman Index (HHI)
averaged across the 13 dimensions. For each dimension:

```
HHI_d = Σ_b (exposurePct_b^2)
```

where the sum is over all buckets in dimension `d`. A dimension with
a single bucket holding 100% of exposure has `HHI = 1.0`; a
dimension with `n` equally-distributed buckets has
`HHI = 1/n`.

The final score is:

```
concentrationScore = Σ_d HHI_d / dimCount
```

where `dimCount` is the number of populated dimensions.

### 20.6.2 Interpretation

| Score range | Interpretation |
|---|---|
| < 0.15 | Diversified (low concentration). |
| 0.15 - 0.30 | Moderate concentration. |
| > 0.30 | High concentration. |
| > 0.50 | Extreme concentration (single entity or near-monopoly). |

### 20.6.3 Use in the Engine

The concentration score is computed by
`computeSystemicConcentrationScore` and surfaced in the
`SystemicExposureSnapshot.concentrationScore` field. It is also
used in the `BankVsSystemWideResult.projectedSystemConcentrationScore`
field to estimate the impact of a bank's growth on system-wide
concentration.

## 20.7 Correlated Exposure Detection

The §52 framework detects correlated exposure between two dimensions
via `correlatedExposure(dimensionA, dimensionB, snapshot)`.

### 20.7.1 Correlation Criterion

Two buckets (one in each dimension) are "correlated" when they
share:

- `entityId` — the same entity identifier (e.g., a bank's ID matches
  a custodian's ID, indicating the bank also acts as custodian).
- `parentGroup` — the same parent group (e.g., a bank and a
  custodian are both members of the same banking group).
- `jurisdiction` — the same jurisdiction (e.g., a bank and a
  custodian are both in the same country).

### 20.7.2 Combined Exposure

For each correlated pair, the combined exposure is the sum of the
two buckets' exposure percentages:

```
combinedExposurePct = a.exposurePct + b.exposurePct
```

### 20.7.3 Systemic Correlation Risk

If the combined exposure exceeds the hard limit in either
dimension, the correlation indicates systemic correlation risk that
warrants governance review. The `CorrelatedExposureResult` object
surfaces these pairs, sorted by combined exposure (descending).

### 20.7.4 Use Cases

The correlated exposure function is used to detect, for example:

- A bank and a custodian that share a parent group (concentration
  of trust within a single corporate family).
- A bank and a stablecoin issuer that share a jurisdiction
  (concentration of jurisdictional risk).
- A custodian and a technology provider that share an entityId
  (vertical integration that concentrates operational risk).

## 20.8 Snapshot Structure — `SystemicExposureSnapshot`

The full 13-dimension snapshot is returned by
`evaluateSystemicExposure(banks, assets, custodians, providers)`:

```typescript
interface SystemicExposureSnapshot {
  timestamp: string;                                  // ISO-8601
  dimensions: Record<ConcentrationDimension, ExposureBucket[]>;
  totalExposure: number;                              // USD notional
  constraintsMet: boolean;                            // true if no violations
  violations: ExposureBucket[];                       // hard-limit breaches
  nearBreaches: ExposureBucket[];                     // preferred-limit breaches
  concentrationScore: number;                         // 0-1 HHI-style
}
```

### 20.8.1 Total Exposure Computation

`totalExposure` is taken as the maximum single-dimension total
(banks, assets, custodians, providers). This represents the size
of the systemic reserve: in a well-formed system, each dimension's
exposure total should approximate the same underlying reserve.
Taking the max guards against partial inputs and prevents
artificial deflation of concentration percentages when one input
list is incomplete.

### 20.8.2 Violation and Near-Breach Collection

After computing all 13 dimensions, the engine collects:
- `violations` — all buckets with `status = breach`.
- `nearBreaches` — all buckets with `status = near-breach`.

`constraintsMet = (violations.length === 0)`.

## 20.9 Simulated Reference Snapshot

The §52 module exposes `buildReferenceSystemicSnapshot()`, which
returns an illustrative `SystemicExposureSnapshot` built from
SIMULATED reference inputs. The snapshot intentionally includes at
least one near-breach and one actual breach to demonstrate the
engine.

### 20.9.1 SIMULATED DATA — NOT LIVE

No real bank / custodian / provider / asset is contracted. Names
are illustrative only. The simulated data:

#### 20.9.1.1 Banks (4)

| Bank ID | Bank Name | Group | Country | Currency | Exposure | Growth Δ |
|---|---|---|---|---|---|---|
| BANK-001 | Northern Anchor Bank | Mithqal-North-Africa-Group | AE | USD | $25M | 3.0pp |
| BANK-002 | Sovereign Trust Bank | Sovereign-Asia-Group | SA | SAR | $18M (near-breach) | 6.0pp |
| BANK-003 | Euro Reserve Custody | Euro-Reserve-Group | CH | EUR | $32M (breach) | 1.0pp |
| BANK-004 | Pacific Bridge Bank | Pacific-Finance-Group | SG | SGD | $25M (breach) | 2.0pp |

#### 20.9.1.2 Custodians (3)

| Custodian ID | Custodian Name | Group | Jurisdiction | Exposure | Growth Δ |
|---|---|---|---|---|---|
| CUST-A | Northern Custody Trust | NC-Trust-Group | AE | $48M (breach) | 2.0pp |
| CUST-B | Sovereign Custody Corp | SC-Corp-Group | SA | $35M (breach) | 4.0pp |
| CUST-C | Alpine Vault AG | AV-AG-Group | CH | $17M (near-breach) | 0.0pp |

#### 20.9.1.3 Assets (9)

A simulated reserve portfolio of USD/EUR/CHF/JPY/SAR/SGD cash and
treasury bills, plus USDC, EURC, and USDT stablecoins.

#### 20.9.1.4 Providers (2)

Reserved for forward-compatibility (provider-direct counterparty
exposure). The bank `liquidityProvider` field attributes the
bank-routed exposure.

### 20.9.2 Snapshot Analysis

The simulated snapshot produces:
- Multiple breaches in the `bank` dimension (BANK-003 at 32%,
  BANK-004 at 25% — both above the 20% hard limit).
- Multiple breaches in the `custodian` dimension (CUST-A at 48%,
  CUST-B at 35% — both above the 20% hard limit).
- Near-breaches in the `bank` dimension (BANK-002 at 18% — above
  the 15% preferred, below the 20% hard).
- Near-breaches in the `custodian` dimension (CUST-C at 17% —
  above the 15% preferred, below the 20% hard).
- A high concentration score (reflecting the multiple breaches).
- Correlated exposure between BANK-001 (AE) and CUST-A (AE) via
  the shared jurisdiction.

## 20.10 Illustrative Example — A Bank Growing to 18% of System Exposure

This example walks through what happens when a participating bank —
"Sovereign Trust Bank" (BANK-002 in the simulated snapshot) — grows
to 18% of total system exposure.

### 20.10.1 Initial State

BANK-002 is in the `RESTRICTED` lifecycle state (§17.4 — its
capital adequacy is below the regulatory minimum). Its exposure is
$18M out of a $100M total system exposure, i.e., 18%.

Question A (individual limit): Is BANK-002 within its individual
limit?
- `individualExposurePct = 18%`.
- `individualLimit = 20%` (hard bank cap).
- `individualExposurePct ≤ individualLimit + 1e-9` → `true`.
- `individualLimitOk = true`.

BANK-002 is within its individual hard limit (it has not breached
the 20% cap). However, 18% is above the 15% preferred limit, so
BANK-002's status is `near-breach` (preferred-limit breach, hard-
limit satisfied).

### 20.10.2 Question B Analysis

Question B: Does BANK-002's growth create excessive system-wide
concentration?

#### 20.10.2.1 Growth Projection

BANK-002 has `growthDelta = 6.0pp` (the highest in the simulated
snapshot). The projected exposure is:

```
projectedExposurePct = max(0, 18% + 6.0%) = 24%
```

#### 20.10.2.2 Hard-Limit Breach Check

```
wouldBreachHard = (projectedExposurePct > individualLimit + 1e-9)
                = (24% > 20%)
                = true
```

The projected exposure (24%) would breach the hard limit (20%).

#### 20.10.2.3 Preferred-Limit Breach Check

```
wouldBreachPreferred = (projectedExposurePct > preferredLimit + 1e-9)
                      && !wouldBreachHard
                    = (24% > 15%) && !true
                    = false
```

(Not relevant — `wouldBreachHard` already triggers.)

#### 20.10.2.4 Existing Violations Check

The engine searches for any snapshot violations that touch
BANK-002 or its parent group (Sovereign-Asia-Group):

```
violationsForBank = snapshot.violations.filter(v =>
  v.entityId === "BANK-002" ||
  v.metadata?.parentGroup === "Sovereign-Asia-Group"
)
```

In the simulated snapshot, BANK-002 itself is a `near-breach` (not
a violation), but its parent group has no other members in the
simulated data. So `violationsForBank = []` (no existing
violations touch this bank / group).

#### 20.10.2.5 Final Question B Result

```
growthCreatesExcessConcentration = wouldBreachHard ||
                                   wouldBreachPreferred ||
                                   (violationsForBank.length > 0)
                                 = true || false || false
                                 = true
```

### 20.10.3 Recommendation

The engine's recommendation:

> "HOLD growth — projected exposure would breach the system-wide
> hard cap."

This recommendation is surfaced to the MITHQAL governance layer,
which:

1. **Suspends new issuance capacity for BANK-002.** The DMCE engine
   (per the `EnhancedDMCEInput` bundle in §20.5) receives
   `bankExposurePct = 18%`, `bankGrowthDelta = 6.0pp`,
   `bankHardLimit = 20%`, `bankPreferredLimit = 15%`. The DMCE
   engine sets issuance capacity to zero until exposure is reduced
   below the preferred limit (15%).

2. **Notifies BANK-002's regulator.** MITHQAL coordinates with the
   bank's home regulator (NOT MITHQAL's supervisory decision — the
   regulator decides whether to require exposure reduction).

3. **Triggers enhanced reconciliation.** BANK-002 transitions from
   `ACTIVE` daily reconciliation to `RESTRICTED` twice-daily
   reconciliation (per §17.4.2.8).

4. **Surfaces the breach to the systemic-risk dashboard.** The
   bank's `near-breach` status and projected-hard-breach projection
   are visible to the governance committee.

5. **Activates the receiving-bank concentration monitoring
   protocol.** Other participating banks begin concentration
   monitoring for incoming MTQ from BANK-002 (per §17.4.2.7).

### 20.10.4 What Happens If BANK-002 Continues to Grow?

If BANK-002's actual exposure grows past 20% (the hard limit), the
`bank` dimension's bucket for BANK-002 transitions from
`near-breach` to `breach`. At that point:

- The engine's `violations` list adds BANK-002's bucket.
- `constraintsMet` becomes `false`.
- BANK-002's lifecycle transitions to `SUSPENDED` (or further,
   depending on the regulator's action — see §17.6).
- The §48 framework's `receivingBankTreatment` becomes: "Accept
   incoming MTQ (chain neutrality). Perform full snapshot
   reconciliation against the suspended bank's last verified state."

### 20.10.5 What Happens to the System-Wide Concentration Score?

As BANK-002 grows, the `bank` dimension's HHI increases:

```
HHI_bank = Σ_b exposurePct_b^2
```

At 18% exposure for BANK-002 (and the other banks' exposures as
simulated), `HHI_bank` reflects the increased concentration. The
overall `concentrationScore` (averaged across the 13 dimensions)
increases. If the score crosses 0.30, the system moves from
"moderate concentration" to "high concentration"; the governance
committee reviews the system's overall diversification strategy.

### 20.10.6 Projected System Concentration Score

The engine also computes a projected system concentration score
(heuristic upper bound):

```
projectedScore = min(1, currentScore +
                        max(0, growthDeltaPp/100) *
                        individualExposurePct * 0.5)
```

For BANK-002:
```
projectedScore = min(1, currentScore + 0.06 * 0.18 * 0.5)
               = min(1, currentScore + 0.0054)
```

A modest increase of 0.54pp in the concentration score from a
single bank's growth. The system-wide impact is bounded by the
0-1 normalization.

## 20.11 Cross-References

The §52 framework integrates with:

- **§3 DMCE (Dynamic Monetary Control Equation)** — the
  `EnhancedDMCEInput` bundle is consumed by the DMCE engine to
  modulate bank issuance capacity.
- **§47 Protected Backing Cell** — the cell-side backing is the
  underlying exposure that the `bank` dimension measures.
- **§48 Bank Default & Resolution Framework** — the lifecycle
  transitions in §48 are triggered by signals that include
  systemic-risk events (e.g., a bank's growth creating excessive
  concentration).
- **§49 Legal Liability Framework** — the country dimension's
  concentration interacts with the §49 jurisdictional analysis.
- **§50 Licensing / Entity Matrix** — concentration in a single
  jurisdiction increases regulatory risk if that jurisdiction's
  license is suspended.
- **§76 CONCENTRATION_LIMITS** — the preferred / hard caps that
  drive the status classification.

---

# APPENDIX 5.A — Cross-Section Consistency Map

The four sections in Part 05 are tightly coupled. The following
table maps the key integration points:

| From Section | To Section | Integration Point |
|---|---|---|
| §17 (Bank Default) | §47 (PBC) | The Protected Backing Cell's `backingStatus` is tracked through every state of the §17 lifecycle. |
| §17 (Bank Default) | §46 (Finality) | Issuance suspension in `LIQUIDITY_STRESS` and beyond is enforced by the §46 finality layers. |
| §17 (Bank Default) | §49 (Legal) | The holder's claim priority in `INSOLVENT` is governed by the §49 legal characterization of MTQ. |
| §17 (Bank Default) | §50 (Licensing) | The bank's licenses (per §50) determine whether the cell's custody is bank-side or by a third-party custodian. |
| §17 (Bank Default) | §52 (Systemic) | Concentration breaches detected by §52 may trigger the `RESTRICTED` lifecycle transition. |
| §18 (Legal) | §47 (PBC) | The cell's segregation is the legal fact that §49 dimensions 7 (creditor treatment) and 8 (insolvency treatment) analyze. |
| §18 (Legal) | §48 (Bank Default) | The §49 legal characterization governs the holder's claim in `INSOLVENT`. |
| §18 (Legal) | §50 (Licensing) | §49 dimension 13 (licensing classification) provides the legal basis for the §50 licensing requirements. |
| §19 (Licensing) | §47 (PBC) | The cell's custody falls under the `custody` activity (§19.6.3). |
| §19 (Licensing) | §48 (Bank Default) | The bank's licenses (per §50) condition its lifecycle transitions. |
| §19 (Licensing) | §49 (Legal) | §49 dimension 13 drives the licensing requirements in §50. |
| §19 (Licensing) | §52 (Systemic) | Concentration in a single jurisdiction increases regulatory risk if that jurisdiction's license is suspended. |
| §20 (Systemic) | §3 (DMCE) | The `EnhancedDMCEInput` bundle modulates bank issuance capacity. |
| §20 (Systemic) | §47 (PBC) | The cell-side backing is the underlying exposure that the `bank` dimension measures. |
| §20 (Systemic) | §48 (Bank Default) | Concentration breaches may trigger the `RESTRICTED` lifecycle transition. |
| §20 (Systemic) | §49 (Legal) | The country dimension's concentration interacts with the §49 jurisdictional analysis. |
| §20 (Systemic) | §50 (Licensing) | Concentration in a single jurisdiction increases regulatory risk. |
| §20 (Systemic) | §76 (Limits) | The preferred / hard caps that drive the status classification. |

---

# APPENDIX 5.B — Honest-State Field Reference (§74)

The following §74 honest-state fields are touched by the four
sections in Part 05:

| Field | Section | Value |
|---|---|---|
| `bankDefaultStateModelDesigned` | §17 | `true` |
| `bankDefaultOperationalWorkflow` | §17 | `true` |
| `bankDefaultContractValidated` | §17 | `false` |
| `bankDefaultLegalValidated` | §17 | `false` |
| `bankDefaultProductionReady` | §17 | `false` |
| `noMithqalFinancialGuarantee` | §17 | `true` |
| `legalRegistryImplemented` | §18 | `true` |
| `legalOpinionsObtained` | §18 | `false` |
| `validatedJurisdictions` | §18 | `0` |
| `licensingMatrixImplemented` | §19 | `true` |
| `licensesObtained` | §19 | `0` |
| `systemicRiskEngineDesigned` | §20 | `true` |
| `systemicRiskEngineImplemented` | §20 | `true` |
| `systemicRiskMonitoringLive` | §20 | `false` |
| `systemicRiskProductionValidated` | §20 | `false` |
| `protectedBackingModelImplemented` | §17 / §18 | `true` (referenced) |
| `protectedBackingLiveCells` | §17 / §18 | `0` (referenced) |

These fields are LITERAL and IMMUTABLE until external evidence
(opinions, validations, license registrations, live data feeds,
production deployments) is registered. The §74 discipline forbids
claiming a state that has not been externally evidenced.

---

# APPENDIX 5.C — Source File Reference Index

The four sections in Part 05 are implemented in the following
source files:

| Section | Source File | Lines |
|---|---|---|
| §17 — Bank Default & Resolution | `src/lib/bank-default-resolution.ts` | 1,044 |
| §18 — Legal Liability Framework | `src/lib/legal-liability-framework.ts` | 724 |
| §19 — Licensing / Entity Matrix | `src/lib/licensing-entity-matrix.ts` | 784 |
| §20 — Systemic Exposure Engine | `src/lib/systemic-exposure-engine.ts` | 1,295 |
| **Total** | | **3,848** |

All four source files:

1. Export their honest-state fields per §74.
2. Assert their invariants at module load.
3. Expose an executive-report generator function
   (`generateBankDefaultReport`, `generateLegalLiabilityReport`,
   `generateLicensingMatrixReport`, `generateSystemicExposureReport`).
4. Contain explicit comments referencing the master directive
   section (§48, §49, §50, §52).

---

# END OF PART 05

**Sections 17–20 complete.**

- §17 — Bank Default & Resolution Framework (8 states, 9 dimensions
  per state, 11 contractual questions, lifecycle transition engine,
  scenario simulation, illustrative example).
- §18 — Legal Liability Framework (13 dimensions, 8 jurisdictions,
  classification lifecycle, speculative-note discipline, illustrative
  example).
- §19 — Licensing / Entity Matrix (9 activities × 8 jurisdictions =
  72 entries, 5-state lifecycle, MITHQAL role invariant, illustrative
  example).
- §20 — Systemic Exposure Engine (13 concentration dimensions,
  §76 limits, Questions A & B, Enhanced DMCE inputs, concentration
  score, correlated exposure detection, illustrative example).

**Honest-state discipline preserved throughout:**

- §17: `bankDefaultContractValidated = false`, `bankDefaultLegalValidated
  = false`. SPECIFIED, NOT CONTRACTED.
- §18: `validatedJurisdictions = 0`, `legalOpinionsObtained = false`.
  ZERO JURISDICTIONS VALIDATED.
- §19: `licensesObtained = 0`. NOT REGULATORY-AUTHORIZED.
- §20: `systemicRiskMonitoringLive = false`,
  `systemicRiskProductionValidated = false`. NOT PRODUCTION-AUTHORIZED.

**Single source of truth:** This Part 05 document is the SINGLE
SOURCE OF TRUTH for sections 17, 18, 19, and 20 of the MITHQAL Master
Blueprint v25.2. No older versions are controlling. Where this
document conflicts with any older specification, this document
controls per the v25.2 reconciliation directive.

---
**END OF PART 05 — SECTIONS 17-20**
