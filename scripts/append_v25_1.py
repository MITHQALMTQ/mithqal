#!/usr/bin/env python3
"""
append_v25_1.py — Idempotent append of §V25.1 to the MITHQAL v25 FINAL blueprint.

Task ID: PHASE4-5-V25-1-DASHBOARD-BLUEPRINT

Appends a new section to docs/blueprint/mithqal-v25-FINAL-blueprint.md:

    # §V25.1 — INSTITUTIONAL INTEROPERABILITY, GEOPOLITICAL RESILIENCE
    #          & MULTI-RAIL SETTLEMENT

The section documents:
  - All 34 new components (§4 through §34)
  - 4 UX control domains (§36)
  - Security requirements (§38)
  - 28 new database tables (§39)
  - 21 new API endpoints (§41)
  - 15 policy decisions (§42)
  - Stress test scenarios (§43)
  - 7 safe states (§44)
  - 18 absolute rules (§57)
  - Honest state declaration
  - Final status: APPROVED CANDIDATE FOR CONTROLLED TESTING —
                  NOT PRODUCTION-AUTHORIZED

Idempotent: if the marker string is already present, the script exits
without modifying the file.
"""

from __future__ import annotations

import sys
from pathlib import Path

# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
BLUEPRINT = ROOT / "docs" / "blueprint" / "mithqal-v25-FINAL-blueprint.md"

# Marker used for idempotency detection
MARKER = "<!-- §V25.1-START -->"
END_MARKER = "<!-- §V25.1-END -->"

# ---------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------
CONTENT = r"""<!-- §V25.1-START -->

---

# §V25.1 — INSTITUTIONAL INTEROPERABILITY, GEOPOLITICAL RESILIENCE & MULTI-RAIL SETTLEMENT

> **This section is the v25.1 amendment to the MITHQAL v25.0 FINAL blueprint.**
> v25.1 BUILDS ON TOP of the frozen v25.0 baseline. v25.0 remains the
> frozen normative architecture; v25.1 adds institutional interoperability,
> geopolitical resilience, multi-rail settlement, asset classification,
> stablecoin interop, and seven safe states. No v25.0 component is removed.

**Amendment Version:** 25.1
**Amendment Title:** Institutional Interoperability, Geopolitical Resilience & Multi-Rail Settlement Edition
**Task ID:** V25-1-MASTER-IMPLEMENTATION
**Module ID:** v25.1-institutional-interop-1.0
**Date:** 2026-08-17
**Supersedes:** Nothing (v25.0 remains FROZEN as baseline)
**Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED

---

## §V25.1.0 — Non-Negotiable Foundational Principles

v25.1 preserves and reinforces every foundational principle of v25.0:

1. **MITHQAL remains neutral wholesale institutional settlement infrastructure.**
2. **MTQ remains a neutral institutional cross-border settlement unit.**
3. **Bank-side architecture preserved — TRANSLATION, NOT TRANSFORMATION.**
4. **No core banking replacement.**
5. **No SWIFT replacement.**
6. **No USD peg.**
7. **No retail exchange.**

v25.1 does NOT redesign the reserve mathematics. It does NOT redesign the
monetary model. It does NOT create a competing rebalancing algorithm. It
ADDS institutional interoperability, geopolitical awareness, and multi-rail
settlement on top of the existing constitutional architecture.

---

## §V25.1.4 — MTQ Neutrality Constitution

MTQ neutrality is constitutional — it cannot be waived, voted away,
or made "configurable" by any single party. Neutrality is enforced
across multiple dimensions:

- **Issuer neutrality** — no single issuer / central bank dominates MTQ backing policy.
- **Currency neutrality** — MTQ is not pegged to any sovereign currency, including USD.
- **Rail neutrality** — no single settlement rail is mandatory or privileged.
- **Jurisdiction neutrality** — MTQ is not bound to any single legal jurisdiction.
- **Provider neutrality** — no single bank, custodian, or liquidity provider is required.
- **Asset neutrality** — no single asset class is required for reserve composition.
- **Network neutrality** — no single blockchain / DLT network is mandated.
- **Technology neutrality** — MTQ settlement is not bound to one technology stack.
- **Legal neutrality** — MTQ legal classification is jurisdiction-dependent, never universal.
- **Operational neutrality** — MITHQAL orchestrates; regulated institutions execute regulated conversion.

> Neutrality is enforced at the constitutional layer (audit, policy-as-code,
> cryptographic attestation) — not merely at the UI layer.

---

## §V25.1.5 — Geopolitical & Concentration-Aware Exposure Model

v25.1 introduces 13 explicit geopolitical exposure dimensions. Minting
capacity (`DMCE`) is calculated as risk-adjusted eligible backing, NOT
as `available_balance × fixed_ratio`.

### 13 Tracked Exposure Dimensions

1. `sovereign_country`
2. `currency`
3. `bank`
4. `banking_group`
5. `custodian`
6. `liquidity_provider`
7. `payment_network`
8. `technology_provider`
9. `legal_jurisdiction`
10. `stablecoin_issuer`
11. `reserve_asset_issuer`
12. `correspondent_banking_dependency`
13. `sanctions_regime`

### Correlated Exposure Analysis

The system must NOT hide concentration behind diversity in one
dimension. A position that looks diversified by country can still
be concentrated by banking group, custodian, or technology provider.
The correlated exposure engine cross-checks every pair of dimensions
and surfaces hidden concentration.

### Geopolitical DMCE Rule

> MTQ minting capacity must be risk-adjusted eligible backing.
> Not simply: `available_balance × fixed_ratio`

---

## §V25.1.6 — Settlement Sovereignty

MITHQAL must support continued operation through multiple legitimate
settlement and connectivity options. This is resilience, not
circumvention.

> Do NOT bypass laws, sanctions, regulatory restrictions, or
> institution-imposed controls. The fallback matrix routes through
> OTHER APPROVED rails — never through unapproved or sanctioned paths.

### 4 Routing Actions

| Action | Description |
|---|---|
| `RETRY` | Retry on the same rail after transient failure |
| `ALTERNATE_APPROVED_ROUTE` | Switch to a pre-approved secondary rail |
| `EMERGENCY_APPROVED_ROUTE` | Switch to the pre-approved emergency rail |
| `SAFE_HALT` | Halt — no further routing attempted |

---

## §V25.1.7 — Multi-Asset + Multi-Rail Architecture

MITHQAL must NOT be hard-coded to any single settlement rail.
MITHQAL must NOT be hard-coded to any single asset class.

### 7 Multi-Asset Types

1. `FIAT`
2. `BANK_MONEY`
3. `TOKENISED_BANK_MONEY`
4. `CBDC`
5. `APPROVED_STABLECOIN`
6. `APPROVED_GOLD_BACKED_INSTRUMENT`
7. `APPROVED_COMMODITY_INSTITUTIONAL_ASSET`

### 8 Multi-Rail Types

1. `SWIFT`
2. `ISO_20022`
3. `DOMESTIC_RTGS`
4. `DOMESTIC_PAYMENT_SYSTEM`
5. `INSTANT_PAYMENT_RAIL`
6. `TOKENISED_DEPOSIT_NETWORK`
7. `CBDC_INFRASTRUCTURE`
8. `INSTITUTIONAL_DIGITAL_ASSET_RAIL`

> **Rule:** Do not hard-code MITHQAL to any single rail.

---

## §V25.1.8 — Asset Classification Layer

An asset may have multiple permitted roles ONLY when policy explicitly
allows it. The system MUST NOT assume:

- input asset = reserve asset
- settlement asset = reserve asset
- liquidity asset = reserve asset

### 6 Asset Classifications

| Classification | Description |
|---|---|
| `RESERVE_ASSET` | Eligible to back outstanding MTQ |
| `INPUT_ASSET` | Accepted at the gateway for conversion |
| `SETTLEMENT_ASSET` | Used to settle a payment instruction |
| `LIQUIDITY_ASSET` | Held in settlement liquidity pools |
| `CONVERSION_ONLY` | Permitted for conversion, not reserve / settlement |
| `PROHIBITED` | Cannot be used in any capacity |

---

## §V25.1.9 — Asset Eligibility Registry

Every asset that can be presented to MITHQAL must pass full eligibility
evaluation. The registry contains 8 assets at v25.1 launch.

### 8 Assets (Initial Registry)

| ID | Name | Type | Reserve | Risk Tier | Haircut | Status |
|---|---|---|---|---|---|---|
| `USD` | US Dollar | FIAT | ✓ | TIER_A | 0% | ACTIVE |
| `EUR` | Euro | FIAT | ✓ | TIER_A | 0% | ACTIVE |
| `JPY` | Japanese Yen | FIAT | ✓ | TIER_A | 0% | ACTIVE |
| `AED` | UAE Dirham | FIAT | ✓ | TIER_A | 0% | ACTIVE |
| `XAU` | Physical Gold (Allocated) | GOLD_BACKED | ✓ | TIER_A | 5% | ACTIVE |
| `USDC` | USD Coin | STABLECOIN | ✗ | TIER_C | 3% | WATCH |
| `USDT` | Tether | STABLECOIN | ✗ | TIER_C | 5% | WATCH |
| `PAXG` | PAX Gold | GOLD_BACKED | ✓ | TIER_B | 8% | ACTIVE |

### Eligibility Flags per Asset

Each asset carries separate eligibility flags:

- `reserveEligibility`
- `inputEligibility`
- `settlementEligibility`
- `liquidityEligibility`

### Other Fields

- `riskTier` (TIER_A / TIER_B / TIER_C / TIER_D_CONVERSION_ONLY / PROHIBITED)
- `liquidityTier` (TIER_1 / TIER_2 / TIER_3 / TIER_4)
- `haircut` (0–1)
- `concentrationLimit` (0–1)
- `oracleRequirements`
- `sanctionsStatus` (CLEAR / WATCH / RESTRICTED / BLOCKED)
- `issuerStatus` and `status` (ACTIVE / WATCH / RESTRICTED / SUSPENDED / PROHIBITED / EMERGENCY)
- `redemptionStatus`
- `custodyRequirements`
- `approvedProviders`

---

## §V25.1.10 — MTQ Asset Interoperability Gateway (12-Step)

The gateway orchestrates and validates. A regulated external institution
executes the regulated conversion. MITHQAL must NOT become a crypto exchange.

### 12 Steps

1. `EXTERNAL_ASSET`
2. `ASSET_ELIGIBILITY`
3. `JURISDICTION_CHECK`
4. `KYC_KYB_AML`
5. `SANCTIONS`
6. `APPROVED_PROVIDER_SELECTION`
7. `QUOTE_PRICING`
8. `CONVERSION_EXECUTION`
9. `SETTLEMENT_FINALITY`
10. `BACKING_RECOGNITION`
11. `DMCE`
12. `MTQ_MINT`

> **Rule:** MITHQAL orchestrates and validates. A regulated external
> institution executes regulated conversion. Do NOT create a crypto exchange.

---

## §V25.1.11 — Authorized External Participant Model

Every external participant (provider) must be explicitly registered,
licensed, and scoped. No provider may execute an activity outside its
configured legal/operational scope.

### 8 Provider Types

1. `PARTICIPATING_BANK`
2. `REGULATED_FX_PROVIDER`
3. `APPROVED_LIQUIDITY_PROVIDER`
4. `REGULATED_CASP`
5. `QUALIFIED_CUSTODIAN`
6. `STABLECOIN_ISSUER`
7. `CBDC_PARTICIPANT`
8. `TOKENISED_DEPOSIT_ISSUING_BANK`

Each provider record carries:

- `providerId`
- `entityType`
- `name`
- `jurisdictions`
- `licenses`
- `regulatedServices`
- `approvedAssets`
- `approvedCorridors`
- `settlementMethods`
- `riskRating` (AAA → D)
- `limits` (perTransaction / daily / monthly)
- `status`

> **Honest state:** Provider registry is empty at v25.1 launch — no real
> provider is contracted. The registry exists; entries are added through
> formal admission policy.

---

## §V25.1.12 — Finality-Before-Mint (Constitutional-Grade Rule)

> **NO FINAL SETTLEMENT = NO MTQ MINT**

### Mandatory 8-Step Sequence

1. Asset Presented
2. Compliance Passed
3. Conversion Executed
4. Settlement Finality Confirmed
5. Backing Legally Recognized
6. Reserve Evidence Confirmed
7. DMCE Authorization
8. MTQ Mint

### Never mint MTQ based solely on

- instruction
- intent
- provisional transfer
- unconfirmed blockchain transaction
- pending bank transfer
- pending FX execution
- preliminary reserve statement

The `checkFinalityBeforeMint()` function returns `canMint: true` only
when every check is `confirmed: true`. A single unconfirmed check
blocks the mint and surfaces the blocking step.

---

## §V25.1.13 — Stablecoin Interoperability

Stablecoins are NOT automatically whitelisted. Each stablecoin must
pass full eligibility evaluation, including:

- `issuer`
- `legalStatus`
- `jurisdiction`
- `reserveModel`
- `redemption`
- `custody`
- `sanctions`
- `network`
- `liquidity`
- `depegBehavior` (STABLE / MINOR_DEPEG / MAJOR_DEPEG / SEVERE_DEPEG)
- `freezeCapability`
- `regulatoryEligibility` (ELIGIBLE / CONDITIONAL / INELIGIBLE)

> **Rule:** Do NOT automatically whitelist stablecoins. Each stablecoin
> must pass full eligibility evaluation.

---

## §V25.1.14 — Stablecoin Inputs Are NOT Automatic MTQ Reserves

> A stablecoin received as an input is NOT automatically an MTQ reserve asset.

### Preferred Workflow

```
USDC/USDT
   → Authorized Conversion Provider
   → Fiat / Eligible Backing Asset
   → Protected Backing Cell
   → Reserve Recognition
   → DMCE
   → MTQ Mint
```

Stablecoins should normally be treated as **INPUT / BRIDGE ASSETS** unless
a separate approved legal/regulatory framework explicitly permits another
treatment.

---

## §V25.1.15 — Stablecoin Depeg Protection (10 Threshold Controls)

The system must NOT assume `1 USDT = 1 MTQ` or `1 USDC = 1 MTQ` unless the
actual authorized settlement price supports it.

### 10 Threshold Controls

| # | Threshold | Deviation | Action | Description |
|---|---|---|---|---|
| 1 | `PCT_1` | 1% | MONITOR | Minor deviation — monitor closely |
| 2 | `PCT_3` | 3% | MONITOR | Elevated deviation — increase monitoring |
| 3 | `PCT_5` | 5% | HAIRCUT_INCREASE | Significant deviation — increase haircut |
| 4 | `PCT_10` | 10% | RESTRICT_INPUT | Major deviation — restrict new inputs |
| 5 | `PCT_20` | 20% | SUSPEND_INPUT | Severe deviation — suspend all inputs |
| 6 | `SEVERE` | 50% | PROHIBIT | Critical deviation — prohibit asset entirely |
| 7 | `ISSUER_FAILURE` | 100% | EMERGENCY_HALT | Issuer failure — emergency halt |
| 8 | `FREEZE` | event | SUSPEND_INPUT | Issuer freeze detected — suspend inputs |
| 9 | `LIQUIDITY_COLLAPSE` | event | SUSPEND_INPUT | Liquidity collapse — suspend inputs |
| 10 | `CHAIN_OUTAGE` | event | RESTRICT_INPUT | Chain outage — restrict until restored |

### Depeg Rule

> The system must NOT assume: `1 USDT = 1 MTQ` or `1 USDC = 1 MTQ`
> unless the actual authorized settlement price supports it.

---

## §V25.1.16 — MTQ Valuation Engine

PAR is a common accounting/reference unit. PAR is NOT a promise that
`1 MTQ = 1 USD`.

### Valuation Formula

```
MTQ value =
  MTQ authoritative valuation
  + external executable market / conversion price
  + fees
  + spread
  + slippage
  + market impact
  + settlement cost
```

Every conversion must be **reproducible after the fact**. The valuation
result records: `referencePrice`, `executablePrice`, `bid`, `ask`,
`spread`, `slippage`, `liquidity`, `haircut`, `netEligibleValue`,
`expectedMTQ`, `fees`, `marketImpact`, `settlementCost`, `totalCost`,
`reproducible=true`, `calculationTimestamp`, `evidence`.

---

## §V25.1.17 — Bank-Held Protected Backing (PBC)

> Ordinary bank deposits must NOT automatically equal constitutional MTQ backing.

The system must distinguish:

```
ORDINARY_BANK_DEPOSIT  ≠  PROTECTED_MTQ_BACKING
```

### Protected Backing Cell (PBC) — 11 Controls

1. `identification` — unique cell ID
2. `legalControl` — who can move the asset
3. `segregationStatus` — SEGREGATED / OMNIBUS / PENDING
4. `encumbranceStatus` — UNENCUMBERED / ENCUMBERED
5. `doubleCountingCheck` — boolean invariant
6. `reconciliationStatus` — VERIFIED / WARNING / MISMATCH
7. `evidence` — cryptographic + bank statement
8. `insolvencyTreatment` — what happens on bank failure
9. `redemptionClaim` — who can claim redemption
10. `jurisdictionalLegality` — VALID / PENDING / INVALID
11. `bankId` + `assetId` + `amount` — accounting fields

---

## §V25.1.18 — Reserve Architecture (v25.1 Updated)

### Strategic Target: 130%

The strategic target remains 130% — preserving the v25.0 solvency
buffer.

### Target Composition

| Asset Class | Target |
|---|---|
| FIAT | 80% |
| GOLD | 18% |
| DIGITAL | 2% |

### Adaptive Bands (per asset class)

| Class | Target | Min | Max | Stress Target | Emergency Target |
|---|---|---|---|---|---|
| FIAT | 80% | 70% | 85% | 75% | 70% |
| GOLD | 18% | 15% | 25% | 20% | 15% |
| DIGITAL | 2% | 0% | 5% | 3% | 0% |

> **Rule:** Do not hard-code these percentages as immutable business
> logic. Store `target` / `minimum` / `maximum` / `stress_target` /
> `emergency_target` as governance-controlled policy.

---

## §V25.1.19 — Reserve Asset Quality Tiers

The reserve engine calculates **Risk-Adjusted Eligible Backing**, not
merely nominal reserve balance.

| Tier | Description | Haircut Range | Examples |
|---|---|---|---|
| `TIER_A` | Highest quality — sovereign-grade, instantaneous liquidity | 0% – 2% | Cash at central banks, T-bills, G7 sovereign bonds |
| `TIER_B` | High quality — allocated gold, supranational instruments | 3% – 8% | Physical allocated gold, PAXG, World Bank bonds |
| `TIER_C` | Moderate quality — approved stablecoins, MMFs | 3% – 10% | USDC, USDT, Money market funds |
| `TIER_D_CONVERSION_ONLY` | Conversion-only — not reserve eligible | 100% | Pending FX, Provisional transfers |
| `PROHIBITED` | Prohibited — cannot be used in any capacity | 100% | Sanctioned assets, Unapproved tokens |

---

## §V25.1.20 — Reserve / Liquidity Separation

The system MUST explicitly separate:

1. **Constitutional solvency reserve** — backs outstanding MTQ
2. **Settlement liquidity** — funds day-to-day settlement
3. **Emergency liquidity** — ILPS / contingent funding
4. **Conversion liquidity** — funds conversion operations

> **Rule:** Never automatically count emergency credit lines as
> constitutional reserve.

---

## §V25.1.21 — Liquidity Coverage Framework

Liquidity coverage is tracked across four timeframes:

| Timeframe | Description |
|---|---|
| `IMMEDIATE` | T+0 settlement capacity |
| `1_DAY` | T+1 settlement capacity |
| `7_DAY` | 7-day rolling capacity |
| `30_DAY` | 30-day rolling capacity |

Each metric records: `coverage`, `required`, `ratio`, `status`
(SUFFICIENT / WARNING / INSUFFICIENT). The framework also tracks:

- `corridorLiquidity`
- `conversionLiquidity`
- `emergencyLiquidity`
- `providerConcentration`
- `bankConcentration`

---

## §V25.1.22 — Geopolitical + Concentration-Aware DMCE

The Dynamic Minting Capacity Engine (DMCE) is updated in v25.1 to
account for geopolitical exposure and concentration risk.

### Formula

```
DMCE =
  risk_adjusted_backing
  × stress_multiplier           (state-dependent, 0..1)
  × (1 - exposure_reduction)    (max 50% reduction)
  × liquidity_factor            (cap 1.0)
```

### Stress Multipliers by Safe State

| State | Multiplier |
|---|---|
| NORMAL | 1.0 |
| WATCH | 0.9 |
| RESTRICTED | 0.7 |
| EMERGENCY | 0.5 |
| MINT_FROZEN | 0.0 |
| SETTLEMENT_RESTRICTED | 0.3 |
| SAFE_HALT | 0.0 |

---

## §V25.1.23 — Emergency Liquidity Categories

The system must NOT blur these categories:

| Category | Purpose |
|---|---|
| `RESERVE` | Constitutional solvency backing |
| `LIQUIDITY_LINE` | Pre-arranged committed credit line |
| `CONTINGENT_FUNDING` | Standby funding (not drawn) |
| `EMERGENCY_LIQUIDITY` | Last-resort central bank / emergency facility |

> Reserve ≠ Liquidity Line ≠ Contingent Funding ≠ Emergency Liquidity.

---

## §V25.1.24 — Rebalancing (v25.1 Updated)

Rebalancing preserves the v25.0 13-step flow with two v25.1 enhancements:

1. Post-trade reserve value MUST deduct actual / estimated costs.
2. The cost model now includes 8 cost components:

| Component | Description |
|---|---|
| `fxSpread` | FX bid-ask spread |
| `dealerFee` | Dealer / broker fee |
| `slippage` | Execution slippage |
| `marketImpact` | Market impact of large trades |
| `custody` | Custody transfer fees |
| `settlement` | Settlement system fees |
| `taxes` | Withholding / transaction taxes |
| `otherExecutionCosts` | Other execution-related costs |

> Continuous monitoring, daily target calculation, trigger-based trading,
> normal no-trade threshold ~2%, dynamic adjustment based on
> volatility / liquidity / concentration / cost / stress.

---

## §V25.1.25 — Multi-Rail Fallback Matrix

> **Rule:** The system must fail safely.

Every corridor must declare:

- `primaryRail`
- `secondaryRail`
- `emergencyRail`
- `failureConditions[]`
- `routingAction` (one of RETRY / ALTERNATE_APPROVED_ROUTE /
  EMERGENCY_APPROVED_ROUTE / SAFE_HALT)

---

## §V25.1.26 — CBDC Interoperability

> CBDC = jurisdiction-controlled institutional interoperability.
> Do NOT assume public / general corporate access.

### Model

```
CBDC
  → Central-bank-authorized participant
  → Bank / institutional gateway
  → MITHQAL
  → MTQ
```

All CBDC connections must be jurisdiction-specific. There is no
"universal CBDC connector" — each jurisdiction requires its own
integration through the central bank's authorized participant model.

---

## §V25.1.27 — Tokenised Bank Money

> Support: `Bank Money → Tokenised Bank Money → MTQ`
> with bank-controlled issuance, compliance, and redemption.

Do NOT equate tokenised deposits with stablecoins. The system stores
legal and technical classification separately for each instrument.

---

## §V25.1.28 — MTQ ↔ External Asset Redemption

```
MTQ
  → Redemption Authorization
  → Compliance
  → Approved Provider
  → External Asset
  → Bank / Authorized Institutional Account
```

The same eligibility and jurisdiction rules apply in reverse. There are
NO unconditional promises of `1 MTQ = 1 USDT`, `1 MTQ = 1 USDC`,
or `1 MTQ = 1 USD`.

---

## §V25.1.29 — No Forced Conversion

The architecture must allow institutions, where legally permitted, to:

- Hold local currency
- Use MTQ for settlement only
- Maintain MTQ treasury positions
- Redeem MTQ
- Retain other currencies / assets

> MTQ must coexist with sovereign currencies.

---

## §V25.1.30 — Legal Claim / Liability Transparency

Each MTQ position carries jurisdiction-dependent legal metadata:

- `jurisdiction`
- `legalNature`
- `ownership`
- `redemption`
- `reserveClaim`
- `settlementFinality`
- `creditorTreatment`
- `insolvencyTreatment`
- `transferability`
- `pledgeability`
- `disputeResolution`
- `applicableLaw`

> **Rule:** Never hard-code one global legal classification as
> universally valid.

---

## §V25.1.31 — Proof of Liabilities (Elevated)

Proof of Liabilities is elevated to a core institutional control. The
system MUST reconcile all 5 sources:

1. `MITHQAL_CANONICAL_LEDGER`
2. `BANK_MTQ_SUBLEDGER`
3. `CORPORATE_MTQ_POSITIONS`
4. `RESERVE_LEDGER`
5. `PROOF_OF_LIABILITIES`

Complete auditability is preserved across all sources.

---

## §V25.1.32 — Independent Assurance

The system supports evidence packages and auditor/regulator access
WITHOUT giving auditors operational control.

### Scope of Independent Assurance

1. `reserves`
2. `liabilities`
3. `mint_burn`
4. `reconciliation`
5. `concentration`
6. `stress_metrics`

---

## §V25.1.33 — Regulatory Transparency API

A read-only Regulatory Transparency API exposes 15 fields:

1. `OUTSTANDING_MTQ`
2. `RESERVE_COVERAGE`
3. `RESERVE_COMPOSITION`
4. `LIABILITY_COMPOSITION`
5. `MINTING`
6. `BURNING`
7. `REDEMPTIONS`
8. `BANK_CONCENTRATION`
9. `CUSTODIAN_CONCENTRATION`
10. `COUNTRY_EXPOSURE`
11. `CURRENCY_EXPOSURE`
12. `LIQUIDITY`
13. `STRESS_STATE`
14. `SANCTIONS_EVENTS`
15. `OPERATIONAL_INCIDENTS`

> **Rule:** Implement strict RBAC and audit logging.

---

## §V25.1.34 — Corridor Certification

> Do not market MTQ as universally operational until specific corridors
> are actually validated.

Each corridor record carries:

- `corridorId`
- `origin`
- `destination`
- `supportedAssets[]`
- `eligibleProviders[]`
- `primaryRail` / `secondaryRail` / `emergencyRail`
- `legalStatus`
- `operationalStatus`
- `liquidityStatus` (SUFFICIENT / WARNING / INSUFFICIENT)
- `riskRating` (AAA → D)
- `certificationStatus` (CERTIFIED / PILOT / RESTRICTED / SUSPENDED / NOT_AVAILABLE)

> **Honest state:** The corridor registry is empty at v25.1 launch —
> no corridor is certified. Corridors are added through formal
> certification policy.

---

## §V25.1.36 — UX: Four Visible Institutional Control Domains

Keep existing internal engines but group them into four visible
institutional control domains. Do NOT remove underlying engines unless
existing implementation proves they are redundant.

### 4 Domains

| Domain | Underlying Engines | Description |
|---|---|---|
| **Reserve Protection Engine** | DMCE, PBC, FSCR, RSS | Constitutional solvency, reserve quality, protected backing |
| **Liquidity & Settlement Engine** | TTF, RV, ILPS, ERTF | Settlement liquidity, redemption, emergency liquidity |
| **Risk & Stress Engine** | DCAR, TCOG | Concentration, stress testing, geopolitical exposure |
| **Compliance & Eligibility Engine** | SARA | Sanctions, asset eligibility, regulatory reporting |

---

## §V25.1.38 — Security and Policy Enforcement

> **Rule:** Critical rules must be enforced server-side, not merely
> hidden in the UI.

### 14 Security Requirements

1. `RBAC`
2. `LEAST_PRIVILEGE`
3. `CRYPTOGRAPHIC_SIGNATURES`
4. `POLICY_AS_CODE`
5. `IMMUTABLE_AUDIT_TRAIL`
6. `IDEMPOTENCY`
7. `REPLAY_PROTECTION`
8. `APPROVAL_WORKFLOWS`
9. `DUAL_CONTROL_FOR_CRITICAL_OPERATIONS`
10. `SAFE_FAILURE`
11. `RATE_LIMITS`
12. `FRAUD_CONTROLS`
13. `PROVIDER_AUTHENTICATION`
14. `HSM_MPC_INTEGRATION`

---

## §V25.1.39 — Database / Turso Tables (28 new)

28 new tables added at v25.1. All schema migrations are versioned.

### Asset Layer (5)

1. `assets`
2. `asset_eligibility`
3. `asset_roles`
4. `asset_networks`
5. `asset_providers`

### Provider & Corridor Layer (5)

6. `providers`
7. `provider_licenses`
8. `corridors`
9. `corridor_routes`
10. `settlement_rails`

### Reserve & Liquidity Layer (5)

11. `reserve_cells`
12. `reserve_assets`
13. `protected_backing`
14. `liquidity_positions`
15. `liquidity_providers`

### Conversion & Mint Layer (5)

16. `conversion_quotes`
17. `conversion_executions`
18. `conversion_finality`
19. `mtq_mint_authorizations`
20. `mtq_redemptions`

### Risk & Stress Layer (4)

21. `geopolitical_exposure`
22. `concentration_metrics`
23. `risk_snapshots`
24. `stress_tests`

### Governance & Audit Layer (4)

25. `regulatory_views`
26. `assurance_evidence`
27. `legal_classifications`
28. `policy_versions`

---

## §V25.1.41 — New API Endpoints (21)

21 new endpoints under `/api/v25.1/*`. All return `status: SIMULATED`
until real providers / assets / banks are contracted.

### Asset & Provider Discovery (4)

| # | Endpoint | Method |
|---|---|---|
| 1 | `/api/v25.1/assets` | GET |
| 2 | `/api/v25.1/assets/eligibility` | GET |
| 3 | `/api/v25.1/providers` | GET |
| 4 | `/api/v25.1/providers/eligibility` | GET |

### Corridor & Rails (2)

| # | Endpoint | Method |
|---|---|---|
| 5 | `/api/v25.1/corridors` | GET |
| 6 | `/api/v25.1/rails` | GET |

### Conversion Flow (4)

| # | Endpoint | Method |
|---|---|---|
| 7 | `/api/v25.1/conversions` | GET |
| 8 | `/api/v25.1/conversions/quote` | GET |
| 9 | `/api/v25.1/conversions/execute` | POST |
| 10 | `/api/v25.1/conversions/finality` | GET |

### MTQ Mint & Redeem (2)

| # | Endpoint | Method |
|---|---|---|
| 11 | `/api/v25.1/mtq/mint` | POST |
| 12 | `/api/v25.1/mtq/redeem` | POST |

### Reserve & Liquidity (3)

| # | Endpoint | Method |
|---|---|---|
| 13 | `/api/v25.1/reserves` | GET |
| 14 | `/api/v25.1/reserves/protected-backing` | GET |
| 15 | `/api/v25.1/liquidity` | GET |

### Risk & Stress (5)

| # | Endpoint | Method |
|---|---|---|
| 16 | `/api/v25.1/risk` | GET |
| 17 | `/api/v25.1/geopolitical-exposure` | GET |
| 18 | `/api/v25.1/concentration` | GET |
| 19 | `/api/v25.1/stress` | GET |
| 20 | `/api/v25.1/regulatory` | GET |

### Assurance (1)

| # | Endpoint | Method |
|---|---|---|
| 21 | `/api/v25.1/assurance` | GET |

---

## §V25.1.42 — Policy-as-Code (15 Decisions)

Every critical decision is expressed as code, versioned, and auditable.

### 15 Policy Decisions

1. `asset_admission`
2. `provider_admission`
3. `corridor_admission`
4. `stablecoin_admission`
5. `conversion_allowed`
6. `mint_allowed`
7. `redeem_allowed`
8. `reserve_recognition`
9. `bank_backing_recognition`
10. `jurisdiction_allowed`
11. `sanctions_allowed`
12. `concentration_allowed`
13. `stress_state`
14. `settlement_route`
15. `finality_confirmed`

### Example: `conversion_allowed`

```
conversion_allowed = true
ONLY IF
  asset_eligible
  AND provider_authorized
  AND jurisdiction_allowed
  AND compliance_passed
  AND sanctions_passed
  AND executable_price_valid
  AND settlement_finality_confirmed
```

---

## §V25.1.43 — Stress Test Engine

> **Rule:** Do not hard-code illustrative calculations as truth. The
> engine must calculate dynamically from live policy data.

### Stablecoin Depeg Stress Shocks

`[1%, 3%, 5%, 10%, 20%, 50%, 100%]`

### FX Shocks

`[10%, 20%, 30%, 50%]`

### Gold Price Shocks

`[10%, 20%, 30%, 50%]`

### Operational Scenarios (9)

1. `BANK_OUTAGE`
2. `LP_FAILURE`
3. `CUSTODIAN_FAILURE`
4. `ORACLE_FAILURE`
5. `CHAIN_OUTAGE`
6. `RAIL_OUTAGE`
7. `SANCTIONS_EVENT`
8. `ISSUER_FREEZE`
9. `LIQUIDITY_SHOCK`

Each `StressTestResult` records:

- `scenario`
- `startingReserveRatio`
- `shock`
- `loss`
- `remainingReserve`
- `remainingCoverage`
- `liquidityImpact`
- `mintingCapacity`
- `resultingState`
- `requiredAction`

---

## §V25.1.44 — Safe States (7 States)

Every operational moment of MITHQAL exists in exactly one of seven safe
states. The state machine is monotone — it can only escalate or, with
explicit approval, recover.

### State 1: NORMAL

- **Allowed:** MINT, REDEEM, TRANSFER, CONVERT, SETTLE, REBALANCE
- **Blocked:** none
- **Approvals required:** none
- **Automatic actions:** none
- **Escalation:** None
- **Recovery:** N/A — normal operation

### State 2: WATCH

- **Allowed:** MINT, REDEEM, TRANSFER, CONVERT, SETTLE, REBALANCE
- **Blocked:** none
- **Approvals required:** none
- **Automatic actions:** INCREASE_MONITORING, HEDGE_IF_POSSIBLE
- **Escalation:** Notify risk committee
- **Recovery:** Indicators return to normal for 24h

### State 3: RESTRICTED

- **Allowed:** REDEEM, TRANSFER, SETTLE
- **Blocked:** MINT_BELOW_THRESHOLD, UNRESTRICTED_CONVERT
- **Approvals required:** RISK_COMMITTEE_APPROVAL_FOR_LARGE_MINTS
- **Automatic actions:** INCREASE_HAIRCUTS, RESTRICT_CORRIDORS
- **Escalation:** Notify board + regulators if applicable
- **Recovery:** RR ≥ 120% for 48h + risk indicators normalized

### State 4: EMERGENCY

- **Allowed:** REDEEM, TRANSFER
- **Blocked:** MINT, CONVERT, REBALANCE
- **Approvals required:** BOARD_APPROVAL_FOR_ANY_NEW_OPERATION
- **Automatic actions:** ACTIVATE_ILPS, FREEZE_NON_ESSENTIAL_OPERATIONS
- **Escalation:** Full institutional emergency response
- **Recovery:** RR ≥ 130% for 72h + board approval + regulator notification

### State 5: MINT_FROZEN

- **Allowed:** REDEEM, TRANSFER
- **Blocked:** MINT
- **Approvals required:** BOARD_APPROVAL_TO_UNFREEZE
- **Automatic actions:** STOP_ALL_NEW_ISSUANCE
- **Escalation:** Full board + regulator notification
- **Recovery:** Root cause resolved + RR ≥ 130% + board vote

### State 6: SETTLEMENT_RESTRICTED

- **Allowed:** REDEEM
- **Blocked:** MINT, TRANSFER, CONVERT, REBALANCE
- **Approvals required:** BOARD_APPROVAL_FOR_SETTLEMENT
- **Automatic actions:** RESTRICT_SETTLEMENT_TO_EMERGENCY_ONLY
- **Escalation:** Full institutional response + regulator
- **Recovery:** Settlement risk resolved + board approval

### State 7: SAFE_HALT

- **Allowed:** none
- **Blocked:** ALL
- **Approvals required:** UNANIMOUS_BOARD_APPROVAL_TO_RESUME
- **Automatic actions:** HALT_ALL_OPERATIONS, PRESERVE_EVIDENCE, NOTIFY_REGULATORS
- **Escalation:** Resolution committee activated
- **Recovery:** Root cause fully resolved + unanimous board + regulator approval

---

## §V25.1.47 — Blueprint Update Markers

Existing v25.0 components are marked with one of four labels:

- `EXISTING` — preserved unchanged from v25.0
- `ENHANCED` — v25.0 component extended with v25.1 features
- `NEW` — newly introduced in v25.1
- `DEPRECATED` — explicitly marked as no longer recommended

> **Rule:** Do not remove the old v25.0 architecture unless explicitly
> superseded.

---

## §V25.1.54 — Do Not Invent Regulatory Authorization

The software must NEVER display language implying:

- "globally regulated"
- "approved by central banks"
- "licensed worldwide"
- "universally compliant"
- "guaranteed reserve"

Use instead:

- "Jurisdiction-dependent"
- "Subject to applicable law"
- "Approved provider required"
- "Regulatory status configurable"

> The software is infrastructure. Legal permissions remain
> jurisdiction-specific.

---

## §V25.1.55 — Final Product Positioning

> MITHQAL is neutral institutional settlement infrastructure designed to
> connect regulated forms of money and eligible settlement assets
> through compliant, bank-compatible, multi-rail interoperability.
>
> MTQ is a neutral institutional settlement unit, not a replacement for
> sovereign currencies, banks, CBDCs, stablecoins, or SWIFT.

---

## §V25.1.57 — Absolute Architectural Rules (18)

Eighteen NON-NEGOTIABLE architectural rules. Every implementation choice
must defer to these. They are constitutional-grade invariants.

| # | Rule |
|---|---|
| 01 | `NO_CORE_BANKING_REPLACEMENT` |
| 02 | `NO_MITHQAL_RETAIL_EXCHANGE` |
| 03 | `NO_AUTOMATIC_STABLECOIN_TO_MTQ_1_TO_1_ASSUMPTION` |
| 04 | `NO_STABLECOIN_EQUALS_AUTOMATIC_RESERVE` |
| 05 | `NO_ORDINARY_BANK_DEPOSIT_EQUALS_AUTOMATIC_PROTECTED_BACKING` |
| 06 | `NO_FINALITY_EQUALS_NO_MINT` |
| 07 | `NO_UNAUTHORIZED_MINT` |
| 08 | `NO_UNCONTROLLED_CUSTODY` |
| 09 | `NO_SINGLE_RAIL_DEPENDENCY` |
| 10 | `NO_SINGLE_ASSET_DEPENDENCY` |
| 11 | `NO_SINGLE_JURISDICTION_DEPENDENCY` |
| 12 | `NO_SINGLE_BANK_DEPENDENCY` |
| 13 | `NO_SINGLE_PROVIDER_DEPENDENCY` |
| 14 | `NO_FORCED_CURRENCY_CONVERSION` |
| 15 | `NO_USD_PEG` |
| 16 | `NO_SWIFT_REPLACEMENT` |
| 17 | `NO_PERMISSIONLESS_INSTITUTIONAL_ACCESS` |
| 18 | `NO_UNSUPERVISED_GLOBAL_AVAILABILITY_CLAIM` |

---

## §V25.1.H — Honest State Declaration

```typescript
honestState: {
  honest: true,
  forcedToPass: false,
  productionAuthorized: false,
  v25_0Frozen: true,
  v25_1BuildsOnV25_0: true,
  noCoreBankingReplacement: true,
  noRetailExchange: true,
  noUsdPeg: true,
  finalityBeforeMintEnforced: true,
  stablecoinNotAutomaticReserve: true,
  ordinaryDepositNotAutomaticBacking: true,
}
```

### What this means

- v25.1 is honest — it does not claim production authorization.
- v25.0 is FROZEN — its normative content is preserved unchanged.
- v25.1 BUILDS ON TOP — it adds new components, it does NOT remove v25.0.
- No core banking system is replaced.
- No retail exchange is offered.
- No USD peg is introduced.
- Finality-before-mint is enforced at the constitutional layer.
- Stablecoins are NOT automatically counted as reserves.
- Ordinary bank deposits are NOT automatically counted as protected backing.

### Provider / Corridor / Bank state at v25.1 launch

- Providers contracted: **0**
- Corridors certified: **0**
- Banks contracted: **0**
- Real bank integrations: **0**
- All data is **SIMULATED** — exposed for review, not for production use.

---

## §V25.1.Closing — Closing Declaration

This v25.1 amendment:

- **PRESERVES** the frozen v25.0 baseline — no v25.0 component is removed.
- **INTRODUCES** 34 new architectural components (§4 through §34).
- **INTRODUCES** 4 visible institutional control domains (§36).
- **INTRODUCES** 14 security requirements enforced server-side (§38).
- **INTRODUCES** 28 new database tables (§39).
- **INTRODUCES** 21 new API endpoints (§41).
- **INTRODUCES** 15 policy-as-code decisions (§42).
- **INTRODUCES** the stress test engine with 9 operational scenarios (§43).
- **INTRODUCES** 7 safe states (§44) — NORMAL → WATCH → RESTRICTED →
  EMERGENCY → MINT_FROZEN → SETTLEMENT_RESTRICTED → SAFE_HALT.
- **INTRODUCES** 18 absolute architectural rules (§57).
- **DOES NOT** replace v25.0.
- **DOES NOT** replace core banking systems.
- **DOES NOT** replace SWIFT.
- **DOES NOT** peg MTQ to USD.
- **DOES NOT** offer retail exchange.
- **DOES NOT** automatically whitelist stablecoins as reserves.
- **DOES NOT** automatically treat ordinary bank deposits as protected backing.
- **DOES NOT** mint MTQ without confirmed settlement finality.
- **DOES NOT** claim global regulatory authorization.

### Final status (unchanged from v25.0):

**APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED**

---

**END OF §V25.1 — INSTITUTIONAL INTEROPERABILITY, GEOPOLITICAL RESILIENCE & MULTI-RAIL SETTLEMENT**

<!-- §V25.1-END -->
"""


def main() -> int:
    if not BLUEPRINT.exists():
        print(f"ERROR: blueprint file not found: {BLUEPRINT}", file=sys.stderr)
        return 1

    text = BLUEPRINT.read_text(encoding="utf-8")

    if MARKER in text:
        # Section already present — idempotent no-op.
        before = text.count("\n") + 1
        print(
            f"Idempotent skip — §V25.1 marker already present "
            f"({before} lines total, no change)."
        )
        return 0

    before_lines = text.count("\n") + 1

    # Ensure the file ends with exactly one trailing newline before appending.
    if not text.endswith("\n"):
        text += "\n"

    new_text = text + CONTENT + "\n"
    BLUEPRINT.write_text(new_text, encoding="utf-8")

    after_lines = new_text.count("\n") + 1
    added_lines = after_lines - before_lines

    print(f"Appended §V25.1 to blueprint: {BLUEPRINT}")
    print(f"  Lines before: {before_lines}")
    print(f"  Lines after:  {after_lines}")
    print(f"  Lines added:  {added_lines}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
