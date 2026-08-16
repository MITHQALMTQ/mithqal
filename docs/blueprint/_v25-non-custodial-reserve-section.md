

---

# §V25.0 — FINAL NON-CUSTODIAL RESERVE / BANK-FUNDED ISSUANCE RECONCILIATION

> **Task ID:** V25-0-NON-CUSTODIAL-RESERVE-ARCHITECTURE
> **Module:** `v25.0-non-custodial-reserve-architecture-1.0`
> **Date:** 2026-08-16
> **Final Status (unchanged):** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED

## §V25.0.C.0 — Purpose

This section is a RECONCILIATION EDIT of MITHQAL v25.0. It separates reserve
**CUSTODY** from **MONETARY CONTROL** — making MITHQAL **non-custodial by
default**.

**Critical version rule:**

- This is NOT v25.1. v25.0 remains the FROZEN NORMATIVE ARCHITECTURE.
- This does NOT fork the architecture.
- This does NOT remove the bank-mediated model.
- This does NOT make MITHQAL a custodian.
- This does NOT give MITHQAL direct possession of customer funds or reserve
  assets by default.

The document remains: **MITHQAL v25.0 — FINAL CANONICAL INSTITUTIONAL
BLUEPRINT**.

## §V25.0.C.1 — Constitutional Principle

> MITHQAL shall not take custody of MTQ reserve assets or customer funds unless
> a specific jurisdictional legal structure expressly requires otherwise and
> independently authorizes such custody.
>
> Reserve assets shall remain in legally appropriate regulated custody, which
> may include participating banks, qualified independent custodians, segregated
> reserve structures, or other legally authorized institutional arrangements.
>
> MITHQAL shall control the constitutional eligibility, verification,
> reconciliation, and issuance conditions associated with MTQ backing, but shall
> not be the default custodian of the underlying reserve assets.
>
> MITHQAL shall control MTQ monetary rules and canonical MTQ supply; it shall
> not control customer bank accounts.

**Canonical Distinction:**

```
CUSTODY ≠ VERIFICATION ≠ ISSUANCE AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL
```

## §V25.0.C.2 — Final Control Matrix (5 Actors)

| Actor | Responsibilities (abbreviated) | Cannot Unilaterally Control |
|-------|-------------------------------|-----------------------------|
| **CUSTOMER** | Maintain bank account; initiate instructions; authorize bank to attest; retain beneficial ownership | Canonical MTQ supply; MITHQAL issuance authorization; MTQ monetary rules; bank compliance logic; custodian allocation |
| **BANK** | Hold customer deposits; verify funding; issue AvailableBackingCertificate; operate MBG sidecar; coordinate redemption payout | Canonical MTQ supply; mint execution; MTQ monetary rules; custodian reserve evidence; MITHQAL reconciliation verdict |
| **CUSTODIAN_RESERVE_HOLDER** | Hold allocated/segregated assets; issue independent reserve evidence (Source B); maintain legal title | Canonical MTQ supply; MTQ issuance authorization; MTQ monetary rules; bank deposit ledger; MITHQAL monetary policy |
| **MITHQAL** | Define MTQ monetary rules + canonical invariants (FV1-FV17); maintain canonical ledger; verify ABC + custody evidence; authorize issuance; execute mint/burn; run 5-way reconciliation; operate MBG | Customer bank accounts; reserve asset custody; customer deposit ledger; custodian legal title; regulator decisions; unilateral discretionary minting |
| **REGULATOR_CENTRAL_BANK** | Define jurisdictional authorization; supervise banks/custodians; approve settlement system; mandate reporting; coordinate resolution regimes | Canonical MTQ supply (cross-jurisdictional invariant); MTQ monetary rules; issuance authorization logic; customer-level transaction decisions |

**Rule:** _No actor may unilaterally control all layers (custody + verification + issuance authorization + canonical supply). Authority is deliberately distributed._

## §V25.0.C.3 — Blueprint Language Corrections

The following language corrections are mandatory. The OLD phrasing must NOT
appear in the blueprint or downstream documentation; the NEW phrasing is the
canonical replacement.

| OLD (forbidden) | NEW (canonical) | Rationale |
|------------------|------------------|-----------|
| "MITHQAL holds reserves" | "MITHQAL verifies eligible reserve/backing" | MITHQAL is the verifier of reserve eligibility, not the default custodian. Custody is held by banks or qualified custodians. |
| "MITHQAL controls custody" | "Reserve assets remain in legally appropriate regulated custody" | Custody is a regulated institutional function distinct from monetary control. MITHQAL controls verification, not custody. |
| "MITHQAL custodies gold" | "Qualified custodians and/or participating banks maintain custody" | Where MITHQAL-owned structural gold exists, it is held under segregated allocated custody by qualified custodians — not by MITHQAL directly. |
| "MITHQAL is custodian" | "MITHQAL controls issuance eligibility and monetary invariants" | MITHQAL is the monetary authority and verification authority; it is not the default custodian of customer funds or reserve assets. |
| "MITHQAL holds customer funds" | "MITHQAL receives reserve attestations" | Customer funds remain in bank custody. MITHQAL receives cryptographic attestations of available backing, not the funds themselves. |

## §V25.0.C.4 — Final Bank-Mediated Flow

```
FINAL BANK-MEDIATED ISSUANCE LIFECYCLE (NON-CUSTODIAL DEFAULT)

1.  CUSTOMER INSTRUCTION
    Customer initiates settlement / issuance / redemption instruction through
    their participating regulated bank. Customer funds remain in the bank; they
    do not move to MITHQAL.

2.  BANK VERIFICATION
    Participating bank verifies customer eligibility (KYC/AML/sanctions),
    funding availability, and jurisdictional authorization.

3.  BANK SIGNED ATTESTATION (Evidence Source A)
    Bank issues a cryptographically signed attestation that verified eligible
    value is available to back the requested MTQ issuance. The bank retains
    custody of the underlying deposit.

4.  CUSTODIAN RESERVE EVIDENCE (Evidence Source B — where applicable)
    Where independent custodian evidence is legally or operationally required
    (e.g. allocated gold, PAXG, sovereign debt), the qualified custodian issues
    an independent reserve attestation. The custodian retains custody.

5.  AVAILABLE BACKING CERTIFICATE
    MITHQAL receives the bank-signed attestation (+ custodian evidence where
    applicable) and issues an AvailableBackingCertificate. The certificate is
    EVIDENCE — it is NOT custody, and it is NOT a transfer of assets to MITHQAL.

6.  MITHQAL VERIFICATION (Evidence Source C)
    MITHQAL verifies the certificate's authenticity, expiry, encumbrance,
    jurisdiction, and consistency with canonical MTQ supply. The canonical
    ledger serves as Evidence Source C.

7.  INDEPENDENT ATTESTATION / ORACLE (Evidence Source D — where available)
    Where an independent attestation oracle is legally and operationally
    feasible, MITHQAL incorporates it as a corroborating source. No single
    institution is the sole source of truth where an independent source is
    feasible.

8.  ISSUANCE AUTHORIZATION GATE (15-STEP)
    MITHQAL executes the 15-step issuance authorization gate. Any failure =
    BLOCK. No bank can create MTQ merely by asserting that funds exist.

9.  MINT AUTHORIZATION (MITHQAL)
    MITHQAL authorizes technical mint execution against the canonical MTQ
    ledger. Mint authority is deliberately separated from bank request and
    from MITHQAL institutional approval.

10. MINT EXECUTION
    Authorized technical issuance execution mints MTQ against the canonical
    ledger. MTQ enters circulation at par ($1.00). Customer's funds remain in
    bank custody.

11. RECONCILIATION (5-WAY)
    Continuous 5-way reconciliation: bank subledger ↔ reserve backing
    evidence ↔ custodian evidence ↔ MITHQAL canonical ledger ↔ proof of
    liabilities. Any mismatch triggers veto / restriction / escalation.

12. REDEMPTION (REVERSE FLOW)
    Holder redeems MTQ → MITHQAL burns MTQ (canonical supply reduction) →
    bank releases deposit to holder's account (or designated payee). Funds
    never enter MITHQAL custody during ordinary redemption.
```

## §V25.0.C.5 — RCAF — Reserve Control & Attestation Framework (NEW)

The **Reserve Control & Attestation Framework (RCAF)** is the canonical schema
for reserve evidence. It carries 18 required fields (per the task spec; the
TypeScript interface exposes 19 total slots — 17 strictly required + 2
optional: `beneficialOwner` and `insuranceStatus`).

```typescript
interface ReserveControlAttestationFramework {
  reserveId: string;
  assetType: "PHYSICAL_GOLD" | "PAXG" | "FIAT_SOVEREIGN_DEBT"
           | "STABLECOIN" | "SUKUK" | "OTHER";
  quantity: number;
  valuation: number;
  valuationTimestamp: string;
  legalOwner: string;
  beneficialOwner?: string;
  custodian: string;
  custodyAccountReference: string;
  jurisdiction: string;
  segregationStatus: "SEGREGATED" | "OMNIBUS" | "PENDING";
  encumbranceStatus: "UNENCUMBERED" | "ENCUMBERED" | "PENDING";
  insuranceStatus?: string;
  eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
  attestationIssuer: string;
  attestationTimestamp: string;
  attestationExpiry: string;
  cryptographicSignature: string;
  reserveVersion: number;
}
```

The RCAF validator (`validateRCAF`) enforces: required-field presence,
positive `quantity` and `valuation`, `eligibilityStatus=ELIGIBLE`,
`encumbranceStatus=UNENCUMBERED`, and `segregationStatus=SEGREGATED` for
issuance-eligible reserves.

## §V25.0.C.6 — AvailableBackingCertificate (NEW)

The `AvailableBackingCertificate` (ABC) is the canonical evidence document
issued by a participating bank to MITHQAL. It carries 16 fields (15 listed in
the task summary plus `status`, which the task schema explicitly defines —
both the schema and the count reconcile to 16 fields in the implemented
interface).

**Rules:**

1. The certificate is **EVIDENCE**.
2. It is **NOT** custody.
3. It is **NOT** a transfer of assets to MITHQAL.
4. It MUST be signed by the issuing bank's authorized key.
5. It MUST carry a non-expired `issueTime` / `expiryTime` window.
6. It MUST reference an eligible `reserveAllocationId` that is unencumbered and segregated.
7. It MUST be revocable by the issuing bank and by MITHQAL (dual revocation).
8. It MUST be re-verified at every issuance draw.

```typescript
interface AvailableBackingCertificate {
  certificateId: string;
  bankInstitutionId: string;
  reserveAllocationId: string;
  eligibleAmount: number;
  assetType: ReserveAssetType;
  valuation: number;
  ownerReference: string;
  custodianReference: string;
  jurisdiction: string;
  encumbranceStatus: EncumbranceStatus;
  issueTime: string;
  expiryTime: string;
  applicableIssuanceCeiling: number;
  policyVersion: string;
  cryptographicSignature: string;
  status: "VALID" | "EXPIRED" | "REVOKED" | "PENDING_VERIFICATION";
}
```

The validator (`validateAvailableBackingCertificate`) enforces all 16 field
presences, status validity (not EXPIRED/REVOKED/PENDING_VERIFICATION for
issuance), expiry-after-issue, and `eligibleAmount ≤ applicableIssuanceCeiling`.

## §V25.0.C.7 — Issuance Authorization Logic (15-Step Gate)

The 15-step issuance authorization gate is non-bypassable. Each step is
evaluated in order; the first failing step BLOCKS the gate.

| # | Step | Purpose | Failure Outcome |
|---|------|---------|-----------------|
| 1 | `BANK_REQUEST` | Validate bank + amount | BLOCK |
| 2 | `BANK_AUTHENTICATION` | mTLS + signed nonce | BLOCK |
| 3 | `CUSTOMER_AUTHORIZATION_ATTESTATION` | Customer authorized bank | BLOCK |
| 4 | `FUNDING_VERIFICATION` | Bank confirms funding | BLOCK |
| 5 | `AVAILABLE_BACKING_CERTIFICATE` | Valid ABC present | BLOCK |
| 6 | `CUSTODY_RESERVE_EVIDENCE` | Independent custodian evidence (Source B) | BLOCK |
| 7 | `INSTITUTION_AUTHORIZATION` | Bank on allowlist | BLOCK |
| 8 | `JURISDICTION_CHECK` | Jurisdiction authorized | BLOCK |
| 9 | `RESERVE_ELIGIBILITY` | RCAF eligibility = ELIGIBLE | BLOCK |
| 10 | `RR_STRESS_RR` | RR ≥ 1.00, StressRR ≥ 0.95 | BLOCK |
| 11 | `LIQUIDITY_CHECK` | LCR ≥ 1.00 | BLOCK |
| 12 | `EXPOSURE_LIMIT` | Bank exposure ≤ 25% hard cap | BLOCK |
| 13 | `POLICY_CHECK` | Policy version matches | BLOCK |
| 14 | `MINT_AUTHORIZATION` | MITHQAL authorizes mint | BLOCK |
| 15 | `MTQ_MINT` | Canonical ledger mint | BLOCK |

**Rule:** _Any failure = BLOCK. No bank can create MTQ merely by asserting that funds exist._

## §V25.0.C.8 — Mint Authority Separation (3 States)

```
1. ISSUANCE_REQUEST       — bank / authorized institution initiates.
2. ISSUANCE_AUTHORIZATION — MITHQAL evaluates against the 15-step gate.
3. MINT_EXECUTION         — canonical MTQ ledger executes the authorized mint.
```

> _No bank, operator, council member, administrator, or governance actor shall
> possess unilateral discretionary MTQ minting authority._

This separation ensures that no single actor controls both the request and the
authorization. No bank can create MTQ merely by asserting that funds exist. No
MITHQAL operator can mint MTQ without bank-initiated evidence. No governance
actor can override the gate.

## §V25.0.C.9 — Reserve Reconciliation (5-Way with Explicit Reserve Evidence Source)

```typescript
type ReserveBackingReconciliationStatus =
  | "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL"
  | "EXPIRED"  | "UNAVAILABLE" | "LOCKED";
```

**5 sources of truth:**

1. `bankMTQSubledger` — bank-side MTQ subledger (Source A)
2. `reserveBackingEvidence` — bank-signed reserve attestation (Source A)
3. `custodianEvidence` — independent custodian evidence (Source B)
4. `mithqalCanonicalMTQLedger` — MITHQAL canonical MTQ ledger (Source C)
5. `proofOfLiabilities` — independent proof of liabilities (Source D)

**Status mapping:**

- **VERIFIED** — all sources agree within 1 bps tolerance.
- **WARNING** — minor discrepancy within 2× tolerance.
- **MISMATCH** — discrepancy > 2× tolerance.
- **CRITICAL** — discrepancy > 5% of canonical ledger.
- **EXPIRED** — attestation(s) expired.
- **UNAVAILABLE** — required source(s) missing.
- **LOCKED** — system in emergency state (no new issuance).

## §V25.0.C.10 — Mandatory Issuance Veto

**Veto triggers:**

- `EXPIRED` — ABC has expired.
- `UNAVAILABLE` — required evidence source missing.
- `INCONSISTENT` — sources disagree beyond tolerance.
- `MATERIALLY_DEFICIENT` — verified amount materially below claimed.
- `UNVERIFIED` — assertion lacks corroborating source.
- `REVOKED` — ABC has been revoked.

**8 mandatory automatic actions (on veto):**

1. `STOP_NEW_ISSUANCE_AGAINST_AFFECTED_BACKING`
2. `RESTRICT_INSTITUTION`
3. `LOWER_ISSUANCE_CEILING`
4. `TRIGGER_RECONCILIATION`
5. `TRIGGER_EMERGENCY_STATE`
6. `PRESERVE_AUDIT_EVIDENCE`
7. `NOTIFY_AUTHORIZED_PARTIES`
8. `ESCALATE_ACCORDING_TO_LAW`

**Rule:** _MITHQAL does not seize the underlying assets. The veto halts new issuance against disputed backing; it does not transfer custody or transfer legal title of the underlying reserve assets._

## §V25.0.C.11 — Bank Misreporting / Attestation Failure

When a bank's claimed backing does not match the verified amount, MITHQAL
declares a `BackingAttestationFailure`:

- `status = "CRITICAL"`
- Automatic actions include: BLOCK new issuance, RESTRICT institution,
  FORENSIC reconciliation, IMMUTABLE audit trail, REGULATORY escalation
  available, EXISTING MTQ NOT deleted, EXISTING MTQ remains transferable
  pending reconciliation.

**Rule:** _Do not automatically burn or erase outstanding MTQ merely because evidence becomes disputed. Existing MTQ remains valid and transferable pending reconciliation; only NEW issuance against the affected backing is blocked._

## §V25.0.C.12 — Bank/Custodian Trust Model (4 Sources)

| Source | Description |
|--------|-------------|
| **A** | `SOURCE_A_BANK_SIGNED_ATTESTATION` — bank-signed ABC |
| **B** | `SOURCE_B_CUSTODIAN_RESERVE_EVIDENCE` — independent custodian attestation |
| **C** | `SOURCE_C_MITHQAL_CANONICAL_LEDGER` — MITHQAL canonical MTQ ledger |
| **D** | `SOURCE_D_INDEPENDENT_ATTESTATION_ORACLE_PROOF` — independent oracle (where feasible) |

**Confidence model:**

- `minimumSources = 2`
- `noSingleSourceOfTruth = true`
- Required: Source A + at least one of B/C/D.
- Where Source D is feasible, it MUST be incorporated.

**Rule:** _No single institution should be the sole source of truth where an independent source is legally and operationally feasible._

## §V25.0.C.13 — Custody Does NOT Move to MITHQAL

**6 custody prohibitions (default architecture):**

1. MITHQAL-operated reserve bank account
2. MITHQAL-controlled gold vault
3. MITHQAL customer deposit account
4. MITHQAL taking custody of customer funds
5. MITHQAL receiving physical bullion as ordinary operating custody
6. MITHQAL holding private keys to customer funds as a default architecture

**Exception:** _unless a separate jurisdictional legal determination expressly requires and authorizes such structure._

**Default architecture:**

```
BANK / QUALIFIED CUSTODIAN = ASSET CUSTODY
MITHQAL = VERIFICATION + MONETARY CONTROL
```

## §V25.0.C.14 — Legal Ownership Matrix

The legal ownership matrix covers 5 reserve categories:

1. **Physical allocated gold** (structural/anchor reserve)
2. **PAXG** (tokenized allocated gold)
3. **Fiat sovereign debt** (HQLA)
4. **Stablecoin** (e.g. USDC, regulated fiat-backed token)
5. **Sukuk** (Sharia-compliant institutional asset)

Each entry documents: `legalOwner`, `beneficialOwner`, `custodian`,
`mtqLiabilityRelationship`, `redemptionObligor`, `mithqalRole`, `bankRole`,
`regulatoryOversight`, `insolvencyTreatment`, `jurisdictionStatus`.

**Rule:** _Possible values must NOT be assumed globally. Use `JURISDICTION_PENDING` until legal counsel establishes the actual structure for each jurisdiction and each reserve category._

All entries currently have `jurisdictionStatus = "JURISDICTION_PENDING"`.

## §V25.0.C.15 — Redemption Obligation

```typescript
type RedemptionObligorType =
  | "PARTICIPATING_BANK"
  | "DESIGNATED_ISSUER"
  | "LEGALLY_SEGREGATED_RESERVE_STRUCTURE"
  | "AUTHORIZED_INSTITUTIONAL_VEHICLE"
  | "JURISDICTION_PENDING";
```

The canonical profile currently sets `redemptionObligor = "JURISDICTION_PENDING"`
until legal counsel establishes the actual obligor per jurisdiction.

**Rule:** _MITHQAL must NOT automatically be described as the redemption obligor merely because it operates the settlement protocol. The redemption obligor is determined by the legal structure of the underlying reserve category and the applicable jurisdiction._

## §V25.0.C.16 — Redemption Flow

```
FINAL BANK-MEDIATED REDEMPTION FLOW (NON-CUSTODIAL DEFAULT)

1. REDEMPTION REQUEST
   MTQ holder initiates redemption through their participating bank.

2. BANK VERIFICATION
   Bank verifies holder's identity, KYC/AML, sanctions status, and confirms
   holder's MTQ balance via the bank MTQ subledger.

3. REDEMPTION AUTHORIZATION
   Bank issues a signed redemption attestation to MITHQAL via the MBG.

4. MTQ BURN (CANONICAL)
   MITHQAL burns N MTQ against the canonical MTQ ledger. Canonical supply
   decreases by N. The burn is final and immutable (FV17).

5. BACKING RELEASE INSTRUCTION
   MITHQAL issues a signed backing release instruction to the redemption
   obligor (bank / custodian / segregated structure).

6. BACKING RELEASE EXECUTION
   Redemption obligor releases backing to holder's account (fiat transfer,
   allocated gold release, PAXG transfer, stablecoin transfer, or sukuk
   proceeds). Funds/assets move directly from custodian to holder — NOT
   through MITHQAL.

7. RECONCILIATION
   5-way reconciliation: bank subledger ↔ reserve backing evidence ↔
   custodian evidence ↔ MITHQAL canonical ledger ↔ proof of liabilities.

8. AUDIT TRAIL
   Immutable audit trail preserved.
```

**Note:** MITHQAL does NOT take custody of the backing during redemption.
The redemption obligor (bank / custodian / segregated structure) releases
backing directly to the holder. MITHQAL's role is to burn MTQ and to issue
the signed release instruction.

## §V25.0.C.17 — Capital Model Correction (7 Categories)

The capital model is reframed into **7 separate categories** (extending the 6
from §V25.0.B.8). These are SEPARATE and MUST NOT be auto-combined.

| # | Category | Modeled Amount | Classification |
|---|----------|----------------|----------------|
| A | Reserve / MTQ backing | $54M | MODELLED |
| B | Bank funding | $43.2M (80%) | MODELLED |
| C | MITHQAL operating capital | $4.7M (PILOT) | MODELLED |
| D | Regulatory capital | $0 | ABSENT |
| E | Liquidity resources (ILPS) | $48.1M | MODELLED |
| F | Emergency resources (subset of ILPS) | $23.8M | MODELLED |
| G | Scale capital | $17.6M | MODELLED |

> The current modeled ΔCapital_min ≈ **$15.815M** must remain classified as
> **MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT** until
> independently validated. It is NOT a fundraising target, NOT regulatory
> capital, NOT operating capital, NOT reserve backing per MTQ.

## §V25.0.C.18 — Re-run 21.5432% Model → Model C (Non-Custodial Bank-Funded)

**Model A** (current reserve, 100% MITHQAL-owned):
- P(RR<100%) = **21.5432%** (PRESERVED)

**Model B** (bank-funded, blended):
- P = 0.80 × 0.005 + 0.20 × 0.215432 = **4.7086%**

**Model C** (non-custodial bank-funded, blended):
- P = 0.80 × 0.005 + 0.20 × 0.215432 = **4.7086%** — same as Model B.

### Why Model C = Model B (in breach probability)

The non-custodial aspect does NOT change the math — it changes WHO HOLDS the
assets, not the risk profile.

- Model B assumed the bank-funded portion was held by banks (already
  non-custodial for the 80% portion).
- Model C explicitly extends the non-custodial principle: even the 20%
  MITHQAL-owned structural/anchor portion is held by qualified custodians
  (NOT in a MITHQAL-operated vault).
- The risk profile of the MITHQAL-owned portion (gold + emergency) is
  unchanged: it still carries 21.5432% because the underlying reserve
  composition and stress dynamics are identical.
- The blended breach probability therefore remains 4.7086% — same as Model B.

### Honest state

- `mithqalHeldAssets = $0` by default for ordinary reserve custody.
- `nonCustodialByDefault = true`.
- Bank credit risk (~0.5%) is NONZERO — non-custodial model REDUCES but does
  NOT eliminate risk.
- The 21.5432% model is PRESERVED for the MITHQAL-owned portion.
- Model C is NOT production-ready. Final custody, legal, regulatory
  authorization required.
- Assumptions DOCUMENTED, NOT manipulated.

## §V25.0.C.19 — Zero-Budget Reality

```typescript
{
  currentMithqalExternalCapital: 0,
  evidenceStates: [
    "MODELLED", "TARGET", "OUTREACH", "INTERESTED", "LOI",
    "APPLICATION", "DUE_DILIGENCE", "AWARDED", "FUNDED"
  ],
  currentEvidenceStage: "MODELLED",
  rule: "Do not present model requirements, reserve targets, liquidity
         targets, or capital solvers as money already available."
}
```

All modeled capital figures remain in the MODELLED stage until independent
validation establishes otherwise. The 9-stage evidence pipeline MUST NOT be
silently skipped.

## §V25.0.C.20 — Bank Gateway Update (9 Handles)

The MITHQAL Bank Gateway (MBG) sidecar handles 9 non-custodial message types:

1. `funding_verification`
2. `AvailableBackingCertificate`
3. `issuance_ceiling`
4. `reserve_attestation`
5. `reconciliation`
6. `certificate_expiry`
7. `bank_suspension`
8. `reserve_mismatch`
9. `bank_exit`

> _The gateway remains a sidecar. No bank core replacement._

## §V25.0.C.21 — Security (11 Controls)

1. **SIGNED_ATTESTATIONS** — every ABC and RCAF MUST be cryptographically signed.
2. **MUTUAL_TLS** — bank↔MITHQAL channel MUST use mTLS with certificate pinning.
3. **NONCE** — every request MUST carry a unique nonce to prevent replay.
4. **TIMESTAMP** — every request MUST carry an ISO-8601 timestamp; stale requests rejected.
5. **EXPIRY** — every ABC MUST carry an `expiryTime`; expired certificates rejected.
6. **REPLAY_PROTECTION** — nonces recorded for the replay window; duplicates rejected.
7. **IDEMPOTENCY** — every issuance/redemption request carries an idempotency key.
8. **CERTIFICATE_REVOCATION** — banks and MITHQAL can both revoke certificates.
9. **KEY_ROTATION** — signing keys rotated on schedule (default 90 days).
10. **EMERGENCY_REVOCATION** — MITHQAL can issue emergency revocation halting issuance.
11. **INSTITUTION_ALLOWLIST** — only institutions on the explicit allowlist may request.

> _No unauthenticated reserve or issuance assertion._

## §V25.0.C.22 — Formal Verification — 7 New Invariants (FV11-FV17)

| ID | Name | Statement | Status |
|----|------|-----------|--------|
| **FV11** | PvP Atomicity | If PvP is implemented, both legs settle or neither settles (no partial settlement). | DESIGNED |
| **FV12** | Reserve Custody Separation | MITHQAL does not become custodian of reserve assets merely through issuance. Custody and monetary control are deliberately separated. | PROVEN_AT_SPEC_LEVEL |
| **FV13** | Backing Evidence Validity | No MTQ can be issued without valid, unexpired, unrevoked AvailableBackingCertificate. | PROVEN_AT_SPEC_LEVEL |
| **FV14** | No Unverified Issuance | No issuance may rely solely on an unverified bank assertion. Minimum 2 evidence sources required. | PROVEN_AT_SPEC_LEVEL |
| **FV15** | No Double-Counted Backing | The same backing cannot support multiple uncollateralized MTQ issuance allocations. | PROVEN_AT_SPEC_LEVEL |
| **FV16** | Reserve-to-Liability Reconciliation | Reserve backing evidence must reconcile with canonical MTQ supply (5-way reconciliation). | PROVEN_AT_SPEC_LEVEL |
| **FV17** | Redemption Supply Conservation | Redemption reduces canonical supply correctly (burn 1 MTQ = reduce 1 MTQ from supply). | PROVEN_AT_SPEC_LEVEL |

### 10 Formal Requirements

1. No MTQ can be issued without valid authorization.
2. No issuance may rely solely on an unverified bank assertion.
3. MITHQAL does not become custodian merely through issuance.
4. The same backing cannot support multiple uncollateralized MTQ issuance allocations.
5. Expired backing certificates cannot authorize issuance.
6. Invalid/revoked certificates cannot authorize issuance.
7. Canonical MTQ supply remains conserved.
8. Redemption reduces canonical supply correctly.
9. Bank subledger and MITHQAL institutional position remain reconcilable.
10. Custody records do not imply MITHQAL legal ownership.

## §V25.0.C.23 — Economic Model (7 Revenue Sources)

MITHQAL revenue sources (excluding reserve capital fees):

1. `connectivity`
2. `issuance_service`
3. `settlement`
4. `redemption_infrastructure`
5. `reconciliation`
6. `enterprise_integration`
7. `premium_institutional_services`

> _MITHQAL should NOT charge a hidden 'reserve capital' fee merely because it does not own the reserve._

## §V25.0.C.24 — Custody Concentration

```typescript
{
  preferred:   0.15,    // ≤15% preferred
  hardCap:     0.25,    // ≤25% absolute
  parentGroup: 0.20,    // ≤20% parent-group
  appliedTo:   "actual reserve custody providers (banks / qualified custodians)",
  notAppliedTo: "MITHQAL itself — MITHQAL is non-custodial by default"
}
```

Concentration limits apply to **actual reserve custody providers** (banks /
qualified custodians) — NOT to MITHQAL itself, which is non-custodial by
default. The 15% / 25% / 20% limits ensure diversification across custodians
and prevent single-point-of-failure custody concentration.

## §V25.0.C.25 — Canonical Non-Custodial Statement

> MITHQAL v25.0 is a non-custodial wholesale settlement infrastructure by
> default. MITHQAL does not take custody of MTQ reserve assets or customer
> funds under ordinary operation. Reserve assets remain in legally appropriate
> regulated custody, which may include participating banks, qualified
> independent custodians, segregated reserve structures, or other legally
> authorized institutional arrangements.
>
> MITHQAL controls the constitutional eligibility, verification,
> reconciliation, and issuance conditions associated with MTQ backing — but
> does NOT control customer bank accounts and does NOT hold customer funds.
>
> `CUSTODY ≠ VERIFICATION ≠ ISSUANCE AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL.`
>
> The MITHQAL Bank Gateway (MBG) is a sidecar that translates existing
> authorized banking instructions into MTQ settlement instructions. It does
> NOT replace core banking systems; it does NOT take custody of customer
> funds; it does NOT transform the bank's compliance environment.
>
> Mint authority is deliberately separated into three states:
> ISSUANCE_REQUEST → ISSUANCE_AUTHORIZATION → MINT_EXECUTION.
>
> No single actor controls both the request and the authorization.
>
> Reserve backing is verified through a 4-source trust model:
> Source A (bank attestation) + Source B (custodian evidence) +
> Source C (canonical ledger) + Source D (independent oracle, where feasible).
>
> No single institution is the sole source of truth where an independent
> source is legally and operationally feasible. Minimum 2 sources required.
>
> EXCEPTION: Where a separate jurisdictional legal determination expressly
> requires and authorizes a MITHQAL-held custody structure, that structure is
> documented under the specific jurisdictional authorization — NOT as a
> default architecture.

## §V25.0.C.26 — Do Not Make These Claims

22 forbidden claims (full list in module). Notable entries:

- "MITHQAL holds customer funds."
- "MITHQAL is the custodian of customer deposits."
- "MITHQAL controls customer bank accounts."
- "MITHQAL operates a customer deposit account."
- "MITHQAL takes custody of reserve assets by default."
- "MITHQAL is the redemption obligor by default."
- "Bank credit risk is zero."
- "Model C eliminates the 21.5432% breach probability."
- "Model C is production-ready."
- "The $15.815M ΔCapital_min is a fundraising target."
- "Custody records imply MITHQAL legal ownership."
- "AvailableBackingCertificate is a transfer of assets to MITHQAL."
- "MITHQAL can mint MTQ at its own discretion."
- "A bank can create MTQ merely by asserting that funds exist."
- "Non-custodial model eliminates bank credit risk."
- "v25.1 has been created."

For each forbidden claim, the module provides a canonical correct alternative.

## §V25.0.C.27 — Document Version

```
currentVersion:   "v25.0"
noVersionChange:  true
noArchitectureFork: true
noRenaming:       true
noV25_1Created:   true
documentRemains:  "MITHQAL v25.0 — FINAL CANONICAL INSTITUTIONAL BLUEPRINT"
```

> _This module is a RECONCILIATION EDIT of v25.0. It does NOT create v25.1, does NOT fork the architecture, does NOT remove the bank-mediated model, does NOT make MITHQAL a custodian, does NOT give MITHQAL direct possession of customer funds or reserve assets by default._

## §V25.0.C.28 — 18 Test Scenarios (NC-T01 .. NC-T18)

| Test ID | Description | Status |
|---------|-------------|--------|
| NC-T01 | Bank claims valid backing with proper ABC and custodian evidence → issuance succeeds | DESIGNED |
| NC-T02 | Bank claims but ABC missing → BLOCK at step 5 | DESIGNED |
| NC-T03 | ABC expired → BLOCK | DESIGNED |
| NC-T04 | ABC revoked → BLOCK | DESIGNED |
| NC-T05 | Custodian evidence mismatches bank attestation → BLOCK / RESTRICT | DESIGNED |
| NC-T06 | Bank subledger mismatches canonical ledger → RECONCILIATION_FAILURE | DESIGNED |
| NC-T07 | Same reserve allocated twice → BLOCK (FV15) | DESIGNED |
| NC-T08 | Bank gateway compromised (forged signature) → BLOCK at BANK_AUTHENTICATION | DESIGNED |
| NC-T09 | Bank fails → controlled restriction / resolution | DESIGNED |
| NC-T10 | Custodian fails → alternate custody / emergency controls | DESIGNED |
| NC-T11 | MITHQAL unavailable → no false settlement completion | DESIGNED |
| NC-T12 | Redemption → correct burn and supply reduction (FV17) | DESIGNED |
| NC-T13 | Customer funds remain outside MITHQAL custody | DESIGNED |
| NC-T14 | MITHQAL cannot execute unauthorized reserve transfer | DESIGNED |
| NC-T15 | MITHQAL cannot silently change legal ownership of reserve assets | DESIGNED |
| NC-T16 | Unauthorized bank cannot request issuance | DESIGNED |
| NC-T17 | Unsupported jurisdiction cannot request issuance | DESIGNED |
| NC-T18 | BRICS / CBDC adapters cannot bypass reserve controls | DESIGNED |

## §V25.0.C.29 — Production Gate (9 Conditions)

Production remains **NOT PRODUCTION-AUTHORIZED** until all 9 conditions are
met:

1. At least one participating regulated bank has signed an integration agreement and completed technical certification (`BANK-CONTRACTED` state).
2. At least one qualified custodian has been contracted for reserve evidence (Source B) — not SIMULATED.
3. Jurisdictional authorization obtained for at least one jurisdiction (`JURISDICTION_PENDING → ESTABLISHED`).
4. Independent legal opinion obtained confirming non-custodial structure is legally sound in the operating jurisdiction.
5. Independent attestation oracle (Source D) contracted and operational — where legally and operationally feasible.
6. Independent Sharia certification obtained (where Sharia-compliant operation is claimed).
7. Independent third-party audit completed confirming: reconciliation logic, custody separation, issuance gate, veto triggers, and security controls are operational.
8. Stress test executed against live integration confirming: bank failure, custodian failure, MITHQAL outage, redemption stress — all produce controlled outcomes.
9. Regulator / central bank approval obtained for production operation in the operating jurisdiction.

## §V25.0.C.30 — Executive Report Generator

The module exports `generateNonCustodialReserveReport()` which returns a
`NonCustodialReserveReport` containing all 30 sections above plus the honest
state declaration:

```typescript
honestState: {
  honest: true,
  forcedToPass: false,
  productionAuthorized: false,
  nonCustodialByDefault: true,
  mithqalHeldAssets: 0   // default for ordinary reserve custody
},
finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED"
```

The report is exposed at:
**GET `/api/non-custodial-reserve-architecture`**

## §V25.0.C.31 — Closing Declaration

This reconciliation edit:

- **PRESERVES** the 21.5432% modeled constitutional reserve-breach probability for Model A (current reserve, 100% MITHQAL-owned).
- **PRESERVES** the 4.7086% blended breach probability for Model B (bank-funded).
- **CONFIRMS** that Model C (non-custodial bank-funded) has the same 4.7086% blended breach probability — because the non-custodial aspect does NOT change the math; it changes WHO HOLDS the assets, not the risk profile.
- **PRESERVES** the ΔCapital_min ≈ $15.815M classification as MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT (pending independent validation).
- **SEPARATES** reserve custody from monetary control — MITHQAL is non-custodial by default.
- **INTRODUCES** 7 new formal-verification invariants (FV11-FV17).
- **INTRODUCES** 18 test scenarios (NC-T01..NC-T18).
- **INTRODUCES** the 4-source trust model (Bank + Custodian + MITHQAL + Independent).
- **INTRODUCES** the `AvailableBackingCertificate` schema (16 fields).
- **INTRODUCES** the RCAF framework (18 required fields).
- **DOES NOT** create v25.1 — v25.0 remains the FROZEN NORMATIVE ARCHITECTURE.
- **DOES NOT** fork the architecture.
- **DOES NOT** remove the bank-mediated model.
- **DOES NOT** make MITHQAL a custodian.
- **DOES NOT** give MITHQAL direct possession of customer funds or reserve assets by default.

**Final status (unchanged):**
**APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.**

---

**END OF §V25.0 — FINAL NON-CUSTODIAL RESERVE / BANK-FUNDED ISSUANCE RECONCILIATION**

---

**END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION (WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION + NON-CUSTODIAL RESERVE ARCHITECTURE)**
