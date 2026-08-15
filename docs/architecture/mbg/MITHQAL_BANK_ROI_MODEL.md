# MITHQAL Bank ROI Model

> **File:** MITHQAL_BANK_ROI_MODEL.md
> **Task ID:** MBG-DOCUMENTATION
> **Source module:** `src/lib/mithqal-bank-gateway.ts` (§22 BankIntegrationCostModel, §23 BankROIModel)
> **Document version:** v25.0-mbg-amendment-1.0
> **Honest state declaration:** **INTEGRATION-READY — 0 banks contracted.**
> **Canonical principle:** *"TRANSLATION, NOT TRANSFORMATION."*

---

## Table of Contents

1. [ROI Philosophy — "Minimum core-banking change, not zero bank work"](#1-roi-philosophy--minimum-core-banking-change-not-zero-bank-work)
2. [Bank Integration Cost Model (§22) — 7 Cost Components](#2-bank-integration-cost-model-22--7-cost-components)
3. [Cost Estimates by Bank Tier](#3-cost-estimates-by-bank-tier)
4. [Bank ROI Model (§23) — Revenue Components](#4-bank-roi-model-23--revenue-components)
5. [ROI Calculation Methodology (Payback / ROI% / NPV / Break-Even)](#5-roi-calculation-methodology-payback--roi--npv--break-even)
6. [Sample ROI by Bank Tier](#6-sample-roi-by-bank-tier)
7. [Honest Disclaimer — "Do not promise specific savings before pilots. Measure instead."](#7-honest-disclaimer--do-not-promise-specific-savings-before-pilots-measure-instead)
8. [Sensitivity Analysis (Volume ±50% / Fee ±20% / Cost ±30%)](#8-sensitivity-analysis-volume-50--fee-20--cost-30)
9. [Bank Sales Positioning — "MTQ Settlement Service" / "MITHQAL Settlement Network"](#9-bank-sales-positioning--mtq-settlement-service--mithqal-settlement-network)
10. [Comparison with Alternative Rails (SWIFT / Correspondent / Stablecoins)](#10-comparison-with-alternative-rails-swift--correspondent--stablecoins)
11. [Commercial Model Integration with Model C (Corridor Subscription)](#11-commercial-model-integration-with-model-c-corridor-subscription)

---

## 1. ROI Philosophy — "Minimum core-banking change, not zero bank work"

### 1.1 The Three Sentences

The MBG ROI philosophy is captured in three sentences, drawn directly from the source module's `BankIntegrationCostModel.honestNote`:

```
No core replacement.
Minimal integration.
Existing banking systems remain authoritative.
```

These are not slogans. They are enforced invariants:

- `coreBankingReplacementRequired: false` is a hard-typed invariant on the `BankIntegrationCostModel` interface.
- "Minimal integration" is the required language; "zero integration" is forbidden by `MBG_NEVER_RULES.neverClaimZeroIntegrationWhenMinimalIsRequired`.
- The bank's existing systems (KYC, AML, sanctions, treasury, FX, accounting) remain authoritative.

### 1.2 What "Minimum core-banking change" Means

The MBG requires the bank to make *additive* changes, not *replacement* changes:

| What the bank adds | What the bank does NOT replace |
|---|---|
| The MBG sidecar (deployed per chosen deployment model) | Core banking system |
| The MSAS adapter instances (one per selected connector class) | Customer KYC / AML / sanctions screening |
| The bank-controlled key management (HSM / MPC) for new attestation keys | Customer deposits / accounts / lending / corporate services |
| The compliance attestation signing process (7 assertions) | FX infrastructure |
| The `AccountingReconciliationAdapter` mapping (GL codes for MTQ events) | Treasury infrastructure |
| The corporate customer's bank-linked MTQ settlement account | Customer UX / corporate portal (default `EXISTING_BANK_UX`) |

### 1.3 What "Not zero bank work" Means

The bank does incur real costs:

- Technical integration cost (engineering effort to adapt upstream systems to feed the MBG).
- Security review cost (independent security firm review per §22 cost model).
- Compliance review cost (bank's compliance team designs attestation signing process).
- Legal review cost (legal counsel reviews integration agreement + jurisdictional issues).
- Operations cost (training, documentation, operational readiness).
- Certification cost (MSAS certification fees).
- Annual maintenance cost (recurring cost for ongoing operations + annual recertification).

These costs are real. The ROI model below quantifies them and the offsetting revenue + savings.

### 1.4 Why This Philosophy Matters for Bank Adoption

A bank CTO/CIO evaluating the MBG asks three questions:

1. **"How much will this cost?"** — Answered by the `BankIntegrationCostModel` (§2 below).
2. **"What's the ROI?"** — Answered by the `BankROIModel` (§4 below).
3. **"Is this a speculative bet or a measurable return?"** — Answered by the honest disclaimer (§7 below): "Do not promise specific savings before pilots. Measure instead."

The honest answer to all three questions makes the MBG adoptable. A bank can budget the integration cost, project the ROI, and pilot the integration before committing to full production.

---

## 2. Bank Integration Cost Model (§22) — 7 Cost Components

### 2.1 The BankIntegrationCostModel Interface

```typescript
export interface BankIntegrationCostModel {
  bankId: string;
  bankSize: "TIER_1" | "TIER_2" | "TIER_3";
  costs: {
    technicalIntegration: number;       // USD, one-time
    securityReview: number;            // USD, one-time
    complianceReview: number;          // USD, one-time
    legalReview: number;               // USD, one-time
    operations: number;                // USD, one-time
    certification: number;             // USD, one-time
    maintenance: number;               // USD, annual recurring
  };
  totalOneTime: number;
  annualRecurring: number;
  estimatedImplementationWeeks: number;
  integrationDepth: "MINIMAL" | "MODERATE" | "DEEP";
  coreBankingReplacementRequired: false;   // ALWAYS false
  honestNote: string;
}
```

### 2.2 The 7 Cost Components

| # | Cost component | Type | Purpose |
|---|---|---|---|
| 1 | `technicalIntegration` | One-time | Engineering effort to adapt upstream systems (ISO 20022 gateway, REST API, H2H, SFTP, payment gateway, TMS, ERP integration) to feed the MBG sidecar. |
| 2 | `securityReview` | One-time | Independent security firm review of the MSAS adapter implementation, connectivity security profile, key management, zero-trust verification. |
| 3 | `complianceReview` | One-time | Bank's compliance team designs the attestation signing process for the 7 required compliance assertions. |
| 4 | `legalReview` | One-time | Legal counsel reviews the integration agreement + jurisdictional issues (cross-border data flow, regulatory reporting, etc.). |
| 5 | `operations` | One-time | Training, documentation, operational readiness, disaster recovery drill preparation. |
| 6 | `certification` | One-time | MSAS certification fees (paid to the MITHQAL certification authority). |
| 7 | `maintenance` | Annual recurring | Ongoing operations + annual recertification + monitoring + incident response. |

### 2.3 The Canonical Invariant

```typescript
coreBankingReplacementRequired: false;   // ALWAYS false
```

This is a hard-typed invariant. A module-load assertion verifies it for all three bank tiers (TIER_1, TIER_2, TIER_3). No cost model — past, present, or future — may set this to `true`.

### 2.4 The calculateBankIntegrationCost Function

```typescript
export function calculateBankIntegrationCost(
  bankSize: "TIER_1" | "TIER_2" | "TIER_3",
): Omit<BankIntegrationCostModel, "bankId"> {
  const profiles = {
    TIER_1: {
      costs: {
        technicalIntegration: 180_000,
        securityReview: 60_000,
        complianceReview: 50_000,
        legalReview: 50_000,
        operations: 30_000,
        certification: 30_000,
        maintenance: 80_000,
      },
      weeks: 16,
      depth: "DEEP" as const,
    },
    TIER_2: {
      costs: {
        technicalIntegration: 90_000,
        securityReview: 30_000,
        complianceReview: 25_000,
        legalReview: 25_000,
        operations: 15_000,
        certification: 15_000,
        maintenance: 40_000,
      },
      weeks: 12,
      depth: "MODERATE" as const,
    },
    TIER_3: {
      costs: {
        technicalIntegration: 35_000,
        securityReview: 12_000,
        complianceReview: 10_000,
        legalReview: 10_000,
        operations: 6_000,
        certification: 7_000,
        maintenance: 20_000,
      },
      weeks: 8,
      depth: "MINIMAL" as const,
    },
  };
  // ... totals computation ...
}
```

### 2.5 The Honest Note

```typescript
honestNote:
  "No core replacement. Minimal integration. Existing banking systems remain authoritative. " +
  "Estimates are planning ranges; actual costs depend on bank's existing infrastructure, " +
  "chosen connector class(es), deployment model, and integration depth.",
```

These are **planning estimates**, not quotes. Actual costs depend on:

- The bank's existing infrastructure (which systems need adaptation).
- The chosen connector classes (more connectors = more integration work).
- The deployment model (MODEL_C has additional managed-service provider costs).
- The integration depth (MINIMAL / MODERATE / DEEP).

---

## 3. Cost Estimates by Bank Tier

### 3.1 Tier-1 (Global SIB / Major Money-Center Bank > $1T Assets)

| Cost component | Tier-1 cost (USD) |
|---|---|
| Technical integration | $180,000 |
| Security review | $60,000 |
| Compliance review | $50,000 |
| Legal review | $50,000 |
| Operations | $30,000 |
| Certification | $30,000 |
| **Total one-time** | **$400,000** |
| Maintenance (annual recurring) | $80,000 |
| **Estimated implementation weeks** | **16 weeks** |
| **Integration depth** | **DEEP** |

### 3.2 Tier-2 (Regional / Large Commercial Bank $100B-$1T Assets)

| Cost component | Tier-2 cost (USD) |
|---|---|
| Technical integration | $90,000 |
| Security review | $30,000 |
| Compliance review | $25,000 |
| Legal review | $25,000 |
| Operations | $15,000 |
| Certification | $15,000 |
| **Total one-time** | **$200,000** |
| Maintenance (annual recurring) | $40,000 |
| **Estimated implementation weeks** | **12 weeks** |
| **Integration depth** | **MODERATE** |

### 3.3 Tier-3 (Smaller Commercial Bank < $100B Assets)

| Cost component | Tier-3 cost (USD) |
|---|---|
| Technical integration | $35,000 |
| Security review | $12,000 |
| Compliance review | $10,000 |
| Legal review | $10,000 |
| Operations | $6,000 |
| Certification | $7,000 |
| **Total one-time** | **$80,000** |
| Maintenance (annual recurring) | $20,000 |
| **Estimated implementation weeks** | **8 weeks** |
| **Integration depth** | **MINIMAL** |

### 3.4 Cost Comparison Table

| Cost component | Tier-1 | Tier-2 | Tier-3 |
|---|---|---|---|
| Technical integration | $180,000 | $90,000 | $35,000 |
| Security review | $60,000 | $30,000 | $12,000 |
| Compliance review | $50,000 | $25,000 | $10,000 |
| Legal review | $50,000 | $25,000 | $10,000 |
| Operations | $30,000 | $15,000 | $6,000 |
| Certification | $30,000 | $15,000 | $7,000 |
| **Total one-time** | **$400,000** | **$200,000** | **$80,000** |
| Annual recurring | $80,000 | $40,000 | $20,000 |
| Implementation weeks | 16 | 12 | 8 |
| Integration depth | DEEP | MODERATE | MINIMAL |

### 3.5 Why Tier-1 Costs More

Tier-1 banks have more upstream systems to integrate (typically 3-4 MSAS connector classes vs 1-2 for Tier-3), more complex security review requirements (the security firm must review a more complex adapter implementation), more complex legal review (multiple jurisdictions, more counterparties), and longer implementation timelines.

### 3.6 Why the Recurring Cost Is Lower Than One-Time

The annual maintenance cost (Tier-1: $80K, Tier-2: $40K, Tier-3: $20K) covers:

- Annual recertification.
- Monitoring + incident response operations.
- Key rotation operations.
- Periodic security audits.
- Software updates + patch management.

It does NOT include re-engineering costs (those are covered by the one-time integration cost). The recurring cost is intentionally lower than the one-time cost — the MBG is designed to be cheap to operate after initial integration.

---

## 4. Bank ROI Model (§23) — Revenue Components

### 4.1 The BankROIModel Interface

```typescript
export interface BankROIModel {
  bankId: string;
  bankSize: "TIER_1" | "TIER_2" | "TIER_3";
  integrationCost: BankIntegrationCostModel;
  annualOperatingCost: number;
  // Revenue streams (USD annual)
  settlementRevenue: number;
  fxRevenue: number;
  treasuryRevenue: number;
  corporateServicesRevenue: number;
  // Cost savings (USD annual)
  reconciliationSavings: number;
  operationalSavings: number;
  liquiditySavings: number;
  // Totals
  totalAnnualRevenue: number;
  totalAnnualCost: number;
  netAnnualBenefit: number;
  paybackPeriodMonths: number;
  roiPercent: number;
  npv5Year: number;
  breakEvenVolumeMonthly: number;
  honestNote: string;
}
```

### 4.2 The 4 Revenue Streams

| # | Revenue stream | Description | Fee model (illustrative) |
|---|---|---|---|
| 1 | `settlementRevenue` | Revenue from MTQ settlement fees. | Tier-1: 12 bps; Tier-2: 15 bps; Tier-3: 18 bps. |
| 2 | `fxRevenue` | Revenue from FX spreads on MTQ settlements involving FX. | Tier-1: 8 bps; Tier-2: 10 bps; Tier-3: 12 bps. |
| 3 | `treasuryRevenue` | Revenue from treasury services (Nostro/Vostro rebalancing, liquidity sweeps). | Tier-1: 5 bps; Tier-2: 6 bps; Tier-3: 7 bps. |
| 4 | `corporateServicesRevenue` | Revenue from corporate services (corporate portal, ERP integration, value-added services). | Tier-1: 4 bps; Tier-2: 5 bps; Tier-3: 6 bps. |

### 4.3 The 3 Cost Savings Streams

| # | Savings stream | Description | Savings rate (illustrative) |
|---|---|---|---|
| 1 | `reconciliationSavings` | Savings from automated 5-way reconciliation vs manual reconciliation. | Tier-1: 18% of pre-MITHQAL reconciliation cost; Tier-2: 15%; Tier-3: 12%. |
| 2 | `operationalSavings` | Savings from reduced manual ops (fewer manual investigations, fewer manual reversals). | Tier-1: 12%; Tier-2: 10%; Tier-3: 8%. |
| 3 | `liquiditySavings` | Savings from reduced liquidity lock-up (faster settlement = less capital tied up). | Tier-1: 8%; Tier-2: 6%; Tier-3: 4%. |

### 4.4 Pre-MITHQAL Annual Costs (Illustrative Baselines)

| Pre-MITHQAL cost | Tier-1 | Tier-2 | Tier-3 |
|---|---|---|---|
| Reconciliation cost | $1,200,000 | $500,000 | $180,000 |
| Operational cost | $2,400,000 | $1,000,000 | $350,000 |
| Liquidity cost | $4,000,000 | $1,500,000 | $450,000 |

These baselines are illustrative — they represent typical pre-MITHQAL costs for banks at each tier. Actual baselines vary by bank.

### 4.5 The Fee Model (Illustrative)

The fee model assumes:

- Settlement fee: 12-18 bps of settlement volume (lower for higher volumes).
- FX spread: 8-12 bps of FX volume.
- Treasury service: 5-7 bps of treasury volume.
- Corporate services: 4-6 bps of corporate services volume.

These are illustrative fee models. Actual fees depend on the bank's pricing strategy, the competitive landscape, and the value perceived by corporate customers.

### 4.6 The calculateBankROI Function

```typescript
export function calculateBankROI(
  bankSize: "TIER_1" | "TIER_2" | "TIER_3",
  monthlyVolumeUSD: number,
): Omit<BankROIModel, "bankId"> {
  const integrationCost = calculateBankIntegrationCost(bankSize);
  const annualVolumeUSD = monthlyVolumeUSD * 12;

  const feeModel = {
    TIER_1: { settlementBps: 12, fxBps: 8, treasuryBps: 5, corporateServicesBps: 4,
              reconciliationSavingsRate: 0.18, operationalSavingsRate: 0.12, liquiditySavingsRate: 0.08,
              preMithqalAnnualReconciliationCost: 1_200_000,
              preMithqalAnnualOperationalCost: 2_400_000,
              preMithqalAnnualLiquidityCost: 4_000_000 },
    TIER_2: { settlementBps: 15, fxBps: 10, treasuryBps: 6, corporateServicesBps: 5,
              reconciliationSavingsRate: 0.15, operationalSavingsRate: 0.10, liquiditySavingsRate: 0.06,
              preMithqalAnnualReconciliationCost: 500_000,
              preMithqalAnnualOperationalCost: 1_000_000,
              preMithqalAnnualLiquidityCost: 1_500_000 },
    TIER_3: { settlementBps: 18, fxBps: 12, treasuryBps: 7, corporateServicesBps: 6,
              reconciliationSavingsRate: 0.12, operationalSavingsRate: 0.08, liquiditySavingsRate: 0.04,
              preMithqalAnnualReconciliationCost: 180_000,
              preMithqalAnnualOperationalCost: 350_000,
              preMithqalAnnualLiquidityCost: 450_000 },
  };

  // ... compute revenue + savings + totals + NPV + break-even ...
}
```

---

## 5. ROI Calculation Methodology (Payback / ROI% / NPV / Break-Even)

### 5.1 Payback Period

```typescript
const paybackPeriodMonths =
  netAnnualBenefit > 0
    ? Math.ceil((integrationCost.totalOneTime / netAnnualBenefit) * 12)
    : Number.POSITIVE_INFINITY;
```

**Formula:** `paybackPeriodMonths = (totalOneTime / netAnnualBenefit) * 12`

**Interpretation:** How many months of net annual benefit it takes to recover the one-time integration cost.

### 5.2 ROI Percentage

```typescript
const roiPercent =
  netAnnualBenefit > 0
    ? (netAnnualBenefit / integrationCost.totalOneTime) * 100
    : 0;
```

**Formula:** `roiPercent = (netAnnualBenefit / totalOneTime) * 100`

**Interpretation:** The annual return on the one-time integration cost, as a percentage.

### 5.3 5-Year NPV (Net Present Value at 10% Discount Rate)

```typescript
const discountRate = 0.10;
let npv5Year = -integrationCost.totalOneTime;
for (let year = 1; year <= 5; year++) {
  npv5Year += netAnnualBenefit / Math.pow(1 + discountRate, year);
}
```

**Formula:** `NPV = -initialCost + Σ (annualBenefit / (1 + r)^year) for year = 1 to 5`, where `r = 0.10`.

**Interpretation:** The present value of 5 years of net annual benefit, minus the one-time integration cost, discounted at 10% per year.

### 5.4 Break-Even Monthly Volume

```typescript
const totalBps = fm.settlementBps + fm.fxBps + fm.treasuryBps + fm.corporateServicesBps;
const annualFixedSavings = reconciliationSavings + operationalSavings + liquiditySavings;
const annualFixedCost = totalAnnualCost;
const breakEvenVolumeMonthly =
  totalBps > 0
    ? Math.max(0, ((annualFixedCost - annualFixedSavings) * 10000) / (12 * totalBps))
    : Number.POSITIVE_INFINITY;
```

**Formula:** `breakEvenVolumeMonthly = ((annualCost - annualSavings) * 10000) / (12 * totalBps)`

**Interpretation:** The monthly MTQ settlement volume (USD) at which net annual benefit = 0. Below this volume, the bank loses money; above this volume, the bank profits.

### 5.5 Net Annual Benefit

```typescript
const netAnnualBenefit =
  totalAnnualRevenue + reconciliationSavings + operationalSavings + liquiditySavings - totalAnnualCost;
```

**Formula:** `netAnnualBenefit = (revenue + savings) - cost`

**Interpretation:** The bank's annual net benefit, considering both revenue and cost savings, minus the annual operating cost.

### 5.6 Total Annual Revenue

```typescript
const totalAnnualRevenue =
  settlementRevenue + fxRevenue + treasuryRevenue + corporateServicesRevenue;
```

**Formula:** `totalAnnualRevenue = settlement + FX + treasury + corporateServices`

**Interpretation:** The sum of all 4 revenue streams.

### 5.7 Total Annual Cost

```typescript
const totalAnnualCost = integrationCost.annualRecurring;
```

**Formula:** `totalAnnualCost = integrationCost.annualRecurring`

**Interpretation:** The annual recurring cost (maintenance). The one-time integration cost is NOT included here — it's accounted for in the NPV calculation.

---

## 6. Sample ROI by Bank Tier

The source module's `generateMBGExecutiveReport()` calculates sample ROI at illustrative monthly volumes:

| Tier | Sample monthly volume | Sample annual volume |
|---|---|---|
| TIER_1 | $500M | $6B |
| TIER_2 | $100M | $1.2B |
| TIER_3 | $20M | $240M |

### 6.1 Tier-1 Sample ROI (at $500M/month volume)

| Metric | Value |
|---|---|
| Settlement revenue (12 bps) | $7,200,000 |
| FX revenue (8 bps) | $4,800,000 |
| Treasury revenue (5 bps) | $3,000,000 |
| Corporate services revenue (4 bps) | $2,400,000 |
| **Total annual revenue** | **$17,400,000** |
| Reconciliation savings (18% of $1.2M) | $216,000 |
| Operational savings (12% of $2.4M) | $288,000 |
| Liquidity savings (8% of $4M) | $320,000 |
| **Total annual savings** | **$824,000** |
| Annual operating cost (maintenance) | $80,000 |
| **Net annual benefit** | **$18,144,000** |
| Payback period (one-time $400K) | 1 month |
| ROI % | 4,536% |
| 5-year NPV @ 10% discount | $68.4M |
| Break-even monthly volume | ~$0 (well below $500M) |

### 6.2 Tier-2 Sample ROI (at $100M/month volume)

| Metric | Value |
|---|---|
| Settlement revenue (15 bps) | $1,800,000 |
| FX revenue (10 bps) | $1,200,000 |
| Treasury revenue (6 bps) | $720,000 |
| Corporate services revenue (5 bps) | $600,000 |
| **Total annual revenue** | **$4,320,000** |
| Reconciliation savings (15% of $500K) | $75,000 |
| Operational savings (10% of $1M) | $100,000 |
| Liquidity savings (6% of $1.5M) | $90,000 |
| **Total annual savings** | **$265,000** |
| Annual operating cost (maintenance) | $40,000 |
| **Net annual benefit** | **$4,545,000** |
| Payback period (one-time $200K) | 1 month |
| ROI % | 2,272.5% |
| 5-year NPV @ 10% discount | $17.0M |
| Break-even monthly volume | ~$0 (well below $100M) |

### 6.3 Tier-3 Sample ROI (at $20M/month volume)

| Metric | Value |
|---|---|
| Settlement revenue (18 bps) | $432,000 |
| FX revenue (12 bps) | $288,000 |
| Treasury revenue (7 bps) | $168,000 |
| Corporate services revenue (6 bps) | $144,000 |
| **Total annual revenue** | **$1,032,000** |
| Reconciliation savings (12% of $180K) | $21,600 |
| Operational savings (8% of $350K) | $28,000 |
| Liquidity savings (4% of $450K) | $18,000 |
| **Total annual savings** | **$67,600** |
| Annual operating cost (maintenance) | $20,000 |
| **Net annual benefit** | **$1,079,600** |
| Payback period (one-time $80K) | 1 month |
| ROI % | 1,349.5% |
| 5-year NPV @ 10% discount | $4.0M |
| Break-even monthly volume | ~$0 (well below $20M) |

### 6.4 The Honest Caveat

The sample ROIs above are strikingly high (4,536% for Tier-1, 2,272% for Tier-2, 1,349% for Tier-3). This is because:

1. The integration cost is low relative to the projected revenue (one-time $400K vs annual revenue $17.4M for Tier-1).
2. The break-even volume is well below the sample volume — the bank profits from the first dollar of settlement.

**However**, these are **planning estimates based on illustrative fee models**. Actual ROI depends on:

- The bank's actual fee model (fees may be lower than the illustrative 12-18 bps).
- The bank's actual volume mix (corporate customers may not all adopt MTQ immediately).
- The bank's actual operational efficiency baseline (savings may be lower if the bank is already efficient).

> **Warning:** These sample ROIs should not be presented to a bank as guaranteed returns. The honest disclaimer (§7 below) applies.

---

## 7. Honest Disclaimer — "Do not promise specific savings before pilots. Measure instead."

### 7.1 The Canonical Honest Note

```typescript
honestNote:
  "ROI figures are PLANNING ESTIMATES based on illustrative fee models. " +
  "Per §30 v25.0 architecture: 'Do not promise specific savings before pilots. " +
  "Measure instead.' Actual ROI depends on the bank's actual fee model, volume mix, " +
  "and operational efficiency baseline. liquiditySavings is included only where " +
  "demonstrable (i.e., where pre-MITHQAL liquidity cost is measurable).",
```

### 7.2 Why This Disclaimer Matters

The sample ROIs (4,536% / 2,272% / 1,349%) are strikingly high. A bank CTO/CIO seeing these numbers will ask:

- "Is this realistic?"
- "What assumptions underlie these numbers?"
- "What's the downside risk?"

The honest disclaimer answers all three:

- **Realistic?** The numbers are mathematically correct given the illustrative fee model. But the fee model is illustrative, not actual. Actual fees may be lower.
- **Assumptions?** The fee model assumes 12-18 bps settlement fee, 8-12 bps FX spread, 5-7 bps treasury service, 4-6 bps corporate services. Plus 18%/15%/12% reconciliation savings, 12%/10%/8% operational savings, 8%/6%/4% liquidity savings.
- **Downside risk?** See §8 (Sensitivity Analysis) below.

### 7.3 The §30 Rule

Per §30 of the v25.0 architecture:

> *"Do not promise specific savings before pilots. Measure instead."*

This means:

- Do NOT present the sample ROIs as guaranteed returns.
- DO present them as planning estimates for budgeting purposes.
- DO measure actual ROI during the pilot phase.
- DO adjust the fee model + savings estimates based on real pilot data.

### 7.4 What "Measure instead" Means Practically

When a bank pilots the MBG:

1. Track actual settlement volume (USD/month).
2. Track actual settlement fees (bps actually charged).
3. Track actual FX revenue, treasury revenue, corporate services revenue.
4. Track actual reconciliation savings (pre-MITHQAL vs post-MITHQAL reconciliation cost).
5. Track actual operational savings.
6. Track actual liquidity savings (where measurable).
7. Compute actual ROI based on actual data.
8. Adjust the fee model + savings estimates for future planning.

### 7.5 The Liquidity Savings Caveat

```typescript
// liquiditySavings is included only where demonstrable
// (i.e., where pre-MITHQAL liquidity cost is measurable)
```

The `liquiditySavings` line item is included in the ROI model only where the bank can demonstrably measure its pre-MITHQAL liquidity cost. For banks that cannot measure this baseline, `liquiditySavings` should be excluded from the ROI calculation (treated as $0).

This is the conservative approach. The MBG does not promise liquidity savings it cannot verify.

---

## 8. Sensitivity Analysis (Volume ±50% / Fee ±20% / Cost ±30%)

### 8.1 Sensitivity to Volume (±50%)

How does ROI change if the actual volume is 50% lower or 50% higher than projected?

| Tier | Sample volume | Volume -50% | Volume +50% |
|---|---|---|---|
| TIER_1 | $500M/mo | $250M/mo | $750M/mo |
| TIER_1 net annual benefit | $18.1M | $9.07M | $27.2M |
| TIER_1 payback period | 1 month | 1 month | 1 month |
| TIER_1 ROI % | 4,536% | 2,268% | 6,804% |
| TIER_2 net annual benefit | $4.55M | $2.27M | $6.82M |
| TIER_2 payback period | 1 month | 1 month | 1 month |
| TIER_2 ROI % | 2,272% | 1,136% | 3,408% |
| TIER_3 net annual benefit | $1.08M | $540K | $1.62M |
| TIER_3 payback period | 1 month | 2 months | 1 month |
| TIER_3 ROI % | 1,349% | 675% | 2,025% |

**Interpretation:** Even at 50% lower volume, all three tiers remain highly profitable. The integration cost is low enough that even modest volume generates positive ROI.

### 8.2 Sensitivity to Fee (±20%)

How does ROI change if the actual fees are 20% lower or 20% higher than the illustrative fee model?

| Tier | Illustrative fees | Fees -20% | Fees +20% |
|---|---|---|---|
| TIER_1 settlement bps | 12 | 9.6 | 14.4 |
| TIER_1 net annual benefit | $18.1M | $14.8M | $21.5M |
| TIER_1 ROI % | 4,536% | 3,700% | 5,375% |
| TIER_2 net annual benefit | $4.55M | $3.66M | $5.44M |
| TIER_2 ROI % | 2,272% | 1,830% | 2,720% |
| TIER_3 net annual benefit | $1.08M | $864K | $1.30M |
| TIER_3 ROI % | 1,349% | 1,080% | 1,625% |

**Interpretation:** Even at 20% lower fees, all three tiers remain highly profitable. The fee model is robust to competitive fee pressure.

### 8.3 Sensitivity to Cost (±30%)

How does ROI change if the actual integration cost is 30% higher or 30% lower than estimated?

| Tier | Estimated cost | Cost +30% | Cost -30% |
|---|---|---|---|
| TIER_1 one-time | $400K | $520K | $280K |
| TIER_1 payback period | 1 month | 1 month | 1 month |
| TIER_1 ROI % | 4,536% | 3,489% | 6,480% |
| TIER_2 one-time | $200K | $260K | $140K |
| TIER_2 payback period | 1 month | 1 month | 1 month |
| TIER_2 ROI % | 2,272% | 1,748% | 3,246% |
| TIER_3 one-time | $80K | $104K | $56K |
| TIER_3 payback period | 1 month | 2 months | 1 month |
| TIER_3 ROI % | 1,349% | 1,038% | 1,928% |

**Interpretation:** Even at 30% higher cost, all three tiers remain highly profitable. The cost model is robust to integration overruns.

### 8.4 Combined Sensitivity (Worst Case: -50% volume, -20% fees, +30% cost)

How does ROI change in the worst-case combination?

| Tier | Worst-case volume | Worst-case fees | Worst-case cost | Worst-case net annual benefit | Worst-case ROI % | Worst-case payback |
|---|---|---|---|---|---|---|
| TIER_1 | $250M/mo | 9.6 bps settlement | $520K | $7.4M | 1,423% | 1 month |
| TIER_2 | $50M/mo | 12 bps settlement | $260K | $1.83M | 704% | 2 months |
| TIER_3 | $10M/mo | 14.4 bps settlement | $104K | $432K | 415% | 3 months |

**Interpretation:** Even in the worst-case combination (50% lower volume + 20% lower fees + 30% higher cost), all three tiers remain profitable. The MBG's economic model is robust.

> **Note:** This worst-case analysis is for planning purposes only. The honest disclaimer (§7) applies — actual ROI must be measured during pilot, not assumed from these projections.

---

## 9. Bank Sales Positioning — "MTQ Settlement Service" / "MITHQAL Settlement Network"

### 9.1 The COMMERCIAL_TERMS Constant

```typescript
export const COMMERCIAL_TERMS = {
  shortName: "MBG",
  commercialName: "MTQ Bank Gateway",
  adapterStandard: "MSAS",
  settlementService: "MTQ Settlement Service",
  institutionalAccount: "MTQ Institutional Settlement Account",
  networkName: "MITHQAL Settlement Network",
} as const;
```

### 9.2 The Recommended Sales Positioning

When positioning the MBG to a bank's CTO/CIO/treasury lead, use these terms:

| Term | When to use |
|---|---|
| **"MTQ Settlement Service"** | When describing the service the bank offers to its corporate customers. Emphasizes that the bank provides a settlement service; MITHQAL is the underlying infrastructure. |
| **"MITHQAL Settlement Network"** | When describing the MITHQAL network as a whole. Emphasizes that MITHQAL is a network, not a single product. |
| **"MTQ Bank Gateway" (MBG)** | When describing the technical sidecar the bank deploys. |
| **"MSAS adapter"** | When describing the open standard for connecting bank upstream systems. |
| **"MTQ Institutional Settlement Account"** | When describing the bank-linked corporate account. |

### 9.3 What NOT to Say

| Phrase to avoid | Why |
|---|---|
| "Crypto settlement" | MTQ is not a cryptocurrency; it is a settlement instrument backed by verified reserves. |
| "Blockchain settlement" | While MTQ uses a canonical ledger (which may use DLT), the MBG is not marketed as a "blockchain" product. |
| "Stablecoin" | MTQ is not a stablecoin; it is a neutral wholesale settlement unit backed by reserves. |
| "DeFi" | MTQ is not decentralized finance; it is institutional wholesale settlement infrastructure. |
| "Token" | Avoid the word "token" — it carries speculative connotations. Use "settlement unit" or "MTQ" instead. |
| "Zero integration" | Forbidden by `MBG_NEVER_RULES.neverClaimZeroIntegrationWhenMinimalIsRequired`. |
| "Plug and play" | Misleading; the bank must complete the 6-phase integration journey. |
| "Free" | Misleading; the bank incurs real integration + maintenance costs. |

### 9.4 Positioning as Infrastructure

The MBG should be positioned as **infrastructure**, not as a speculative product:

> *"MITHQAL Bank Gateway is institutional wholesale settlement infrastructure that translates your existing authorized banking instructions into MTQ settlement. It does not replace your core banking, your customer relationship, your compliance program, or your treasury. It adds an additional neutral wholesale settlement layer on top of your existing infrastructure."*

This positioning resonates with bank CTOs/CIOs because:

- It respects the bank's existing investments.
- It does not require surrendering key custody or customer identity.
- It is additive, not replacement.
- It is measurable (ROI model) rather than speculative.

### 9.5 The Honest Sales Pitch

A bank CTO/CIO evaluating the MBG should be told:

1. **What it is:** An additional neutral wholesale settlement layer that translates your existing authorized banking instructions into MTQ settlement.
2. **What it costs:** Tier-dependent one-time + annual recurring cost (TIER_1: $400K + $80K/yr; TIER_2: $200K + $40K/yr; TIER_3: $80K + $20K/yr).
3. **What the projected ROI is:** Planning estimates at illustrative fee models (see §6 above).
4. **What the honest disclaimer is:** "Do not promise specific savings before pilots. Measure instead."
5. **What the next step is:** A pilot integration to measure actual ROI before committing to full production.

---

## 10. Comparison with Alternative Rails (SWIFT / Correspondent / Stablecoins)

### 10.1 Comparison Table

| Rail | Settlement speed | Cost (typical) | Bank key custody | Customer identity | Replacement? |
|---|---|---|---|---|---|
| **SWIFT messaging** | 1-5 days (messaging) + correspondent settlement | $25-50 per message + correspondent fees | Bank retains | Bank retains | Not replaced by MBG — coexists |
| **Correspondent banking** | 1-5 days | 50-200 bps (FX + correspondent fees) | Bank retains | Bank retains | Not replaced by MBG — coexists |
| **Domestic payment systems** (Fedwire/ACH/SEPA/FPS) | Real-time to 1 day | Low (varies) | Bank retains | Bank retains | Not replaced by MBG — coexists |
| **Stablecoins** (USDC, USDT, etc.) | Minutes to hours | Variable (gas + bridge fees) | Often NOT bank-controlled | Often NOT bank-mediated | Different model — not directly comparable |
| **CBDCs** | Real-time | Low (central bank operated) | Central bank | Central bank | Not replaced by MBG — coexists |
| **MTQ (MITHQAL Settlement Network)** | Real-time to minutes | Tier-dependent (12-18 bps settlement fee illustrative) | Bank retains (HSM/MPC) | Bank retains | Adds additional layer — does not replace existing rails |

### 10.2 MBG's Differentiators

The MBG's differentiators vs other rails:

1. **Bank-controlled key custody.** Unlike stablecoins, MTQ keys stay in the bank's HSM/MPC.
2. **Bank-mediated customer identity.** Unlike stablecoins, MTQ customer identity stays at the bank.
3. **Neutral across jurisdictions.** Unlike CBDCs (which are sovereign liabilities), MTQ is jurisdiction-neutral.
4. **Coexists with existing rails.** Unlike replacement-style projects, MTQ does not require abandoning SWIFT / correspondent / domestic payment systems.
5. **5-way reconciliation.** The MBG enforces 5-way reconciliation (canonical / bank subledger / corporate positions / reserve / proof-of-liabilities) — most other rails do not have this level of reconciliation.
6. **No speculative tokenomics.** MTQ is a settlement instrument, not a speculative token.
7. **No retail.** MTQ is wholesale B2B only.

### 10.3 What MBG Does NOT Claim

The MBG does NOT claim:

- ❌ "Faster than SWIFT" — comparative speed claims belong in commercial materials, not architectural documents.
- ❌ "Cheaper than correspondent banking" — comparative cost claims belong in commercial materials.
- ❌ "Better than stablecoins" — comparative quality claims belong in commercial materials.
- ❌ "Replaces any existing rail" — the MBG coexists with all existing rails.

The MBG claims to provide an **additional neutral wholesale settlement layer** that translates existing authorized banking instructions into MTQ settlement. Comparative claims (faster, cheaper, better) require pilot measurement, not architectural assertion.

---

## 11. Commercial Model Integration with Model C (Corridor Subscription)

### 11.1 The Three Deployment Models Recap

| Model | Description | Bank preference |
|---|---|---|
| `MODEL_A_BANK_HOSTED` | Bank operates sidecar in own data center / VPC. | DEFAULT |
| `MODEL_B_BANK_SECURED_PRIVATE` | Sidecar in bank-approved private cloud / co-location. | DEFAULT |
| `MODEL_C_APPROVED_MANAGED` | Sidecar operated by approved managed-service provider under bank contract. | EXCEPTION |

### 11.2 Model C's Commercial Structure

Under `MODEL_C_APPROVED_MANAGED`:

1. The bank contracts with an approved managed-service provider (MSP) to operate the sidecar.
2. The MSP operates the sidecar under bank contract — bank retains key custody.
3. The MSP sees only signed messages — never private keys.
4. The bank pays the MSP for managed services (in addition to the MBG integration cost).
5. The MSP may also charge a corridor subscription fee for access to specific settlement corridors.

### 11.3 Corridor Subscription

The corridor subscription model (per Prompt 3/8 of the closure series) allows:

- A bank to subscribe to specific settlement corridors (e.g. "JP-US-WHOLESALE", "AE-GB-WHOLESALE").
- The MSP charges a per-corridor subscription fee.
- The bank pays only for corridors it actually uses.

This is a more granular commercial model than a flat per-bank fee. It allows smaller banks to subscribe to only the corridors they need.

### 11.4 The Cost Impact of Model C

Under `MODEL_C_APPROVED_MANAGED`, the bank's cost includes:

| Cost | Source | Tier-1 | Tier-2 | Tier-3 |
|---|---|---|---|---|
| MBG integration cost (one-time) | MITHQAL | $400K | $200K | $80K |
| MBG maintenance (annual) | MITHQAL | $80K | $40K | $20K |
| MSP managed-service fee (annual) | MSP | $50K-$200K | $25K-$100K | $10K-$40K |
| Corridor subscription fees (annual) | MSP | $10K-$50K per corridor | $5K-$25K per corridor | $2K-$10K per corridor |

The MSP managed-service fee + corridor subscription fees are in addition to the MBG integration cost. Banks considering `MODEL_C` should budget for these additional costs.

### 11.5 Why Model C May Still Be Cost-Effective

For Tier-3 banks that lack in-house sidecar operations capability, `MODEL_C` may still be cost-effective because:

1. The MSP provides operations expertise the bank lacks.
2. The MSP provides 24/7 monitoring + incident response.
3. The MSP provides disaster recovery capabilities.
4. The bank's internal operations cost (hiring, training, benefits) is higher than the MSP fee.

For Tier-1 and Tier-2 banks with mature operations teams, `MODEL_A` or `MODEL_B` is typically more cost-effective (no MSP fees).

### 11.6 The Honest Note on Model C

The MBG documentation does not recommend `MODEL_C` for banks that can operate `MODEL_A` or `MODEL_B`. `MODEL_C` is an EXCEPTION, reserved for banks that genuinely lack sidecar operations capability.

```typescript
bankPreference: "EXCEPTION";   // MODEL_C is EXCEPTION, not DEFAULT
```

Banks considering `MODEL_C` should:

1. Verify the MSP meets the bank's security requirements (SOC 2 Type II, ISO 27001, etc.).
2. Verify the MSP's contractual obligations (SLA, incident response, data sovereignty).
3. Budget for the additional MSP fees + corridor subscription fees.
4. Compare total cost of `MODEL_C` vs hiring + training an internal operations team for `MODEL_A`.

---

## Appendix A — Cross-References

| Topic | Document |
|---|---|
| MBG architecture (canonical) | `docs/architecture/mbg/MITHQAL_BANK_GATEWAY_ARCHITECTURE.md` |
| Adapter standard (MSAS) | `docs/architecture/mbg/MITHQAL_ADAPTER_STANDARD_MSAS.md` |
| Bank integration playbook | `docs/architecture/mbg/MITHQAL_BANK_INTEGRATION_GUIDE.md` |
| Bank security guide | `docs/architecture/mbg/MITHQAL_BANK_SECURITY_GUIDE.md` |
| Reconciliation architecture | `docs/architecture/mbg/MITHQAL_BANK_RECONCILIATION_GUIDE.md` |
| Corporate user flow | `docs/architecture/mbg/MITHQAL_CORPORATE_USER_FLOW.md` |
| Source module | `src/lib/mithqal-bank-gateway.ts` (§22 BankIntegrationCostModel, §23 BankROIModel) |
| Cost model function | `calculateBankIntegrationCost(bankSize)` in source module §22 |
| ROI model function | `calculateBankROI(bankSize, monthlyVolumeUSD)` in source module §23 |
| COMMERCIAL_TERMS constant | `COMMERCIAL_TERMS` in source module §1 |
| Deployment models | `DEPLOYMENT_MODEL_DESCRIPTIONS` in source module §16 |
| Final pilot activation gate | `docs/verification/v25-0-final-pilot-activation-gate.md` |
| Commercial model (Prompt 3/8) | `src/lib/bank-onboarding.ts` (corridor subscription model) |

## Appendix B — ROI Quick-Reference Card

```
THE 7 COST COMPONENTS (per §22):
  1. Technical integration (one-time)
  2. Security review (one-time)
  3. Compliance review (one-time)
  4. Legal review (one-time)
  5. Operations (one-time)
  6. Certification (one-time)
  7. Maintenance (annual recurring)

COST BY TIER (one-time / annual):
  TIER_1: $400K / $80K per year
  TIER_2: $200K / $40K per year
  TIER_3: $80K / $20K per year

THE 4 REVENUE STREAMS (per §23):
  1. Settlement revenue (12-18 bps)
  2. FX revenue (8-12 bps)
  3. Treasury revenue (5-7 bps)
  4. Corporate services revenue (4-6 bps)

THE 3 SAVINGS STREAMS (per §23):
  1. Reconciliation savings (12-18% of pre-MITHQAL reconciliation cost)
  2. Operational savings (8-12% of pre-MITHQAL operational cost)
  3. Liquidity savings (4-8% of pre-MITHQAL liquidity cost, where demonstrable)

ROI METHODOLOGY:
  paybackPeriodMonths = (totalOneTime / netAnnualBenefit) * 12
  roiPercent = (netAnnualBenefit / totalOneTime) * 100
  npv5Year = -totalOneTime + Σ (netAnnualBenefit / 1.10^year) for year = 1..5
  breakEvenVolumeMonthly = ((annualCost - annualSavings) * 10000) / (12 * totalBps)

SAMPLE ROI (illustrative):
  TIER_1 ($500M/mo): payback=1mo, ROI=4,536%, NPV5=$68.4M
  TIER_2 ($100M/mo): payback=1mo, ROI=2,272%, NPV5=$17.0M
  TIER_3 ($20M/mo):  payback=1mo, ROI=1,349%, NPV5=$4.0M

HONEST DISCLAIMER:
  "Do not promise specific savings before pilots. Measure instead."
  (Per §30 v25.0 architecture)
```

---

*End of MITHQAL_BANK_ROI_MODEL.md — v25.0-mbg-amendment-1.0 — INTEGRATION-READY, 0 banks contracted.*
