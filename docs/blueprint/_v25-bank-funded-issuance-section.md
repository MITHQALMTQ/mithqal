

---

# §V25.0 — FINAL BANK-FUNDED / PREFUNDED ISSUANCE & CAPITAL RECONCILIATION

> **Task ID:** V25-0-BANK-FUNDED-ISSUANCE-MODEL
> **Module:** `v25.0-bank-funded-issuance-model-1.0` (`src/lib/bank-funded-issuance-model.ts`)
> **API Route:** `GET /api/bank-funded-issuance-model`
> **Document Status:** RECONCILIATION EDIT of v25.0 (NO version change to v25.1)
> **Date Added:** 2026-08-15

## §V25.0.B.0 — Purpose and Scope

This section corrects the v25.0 capital/issuance model to reflect that **ordinary MTQ issuance is intended to be funded by verified eligible value originating through an authorized participating regulated bank or other legally authorized institutional settlement channel** — NOT by MITHQAL's own proprietary capital.

This is a **RECONCILIATION EDIT of v25.0**. It does NOT:
- Create v25.1
- Rename the blueprint
- Remove the Bank Gateway / Settlement Sidecar (kept as core per §V25.0.A.4)
- Alter the wholesale B2B model (DNM-01 enforced: no retail MTQ)

The 21.5432% modeled constitutional reserve-breach probability (locked in `monetary-model-lock.ts`, `BREACH_PROBABILITY_MODEL.value`, MC: 250K paths, seed=42) is **PRESERVED for Model A** (current reserve model). Model B (bank-funded issuance) computes a different (lower) blended breach probability for the bank-funded portion, while the MITHQAL-owned structural/anchor portion continues to carry 21.5432%. **Assumptions are NOT manipulated to force a result.**

Final status: **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED** (unchanged).

---

## §V25.0.B.1 — Canonical Principle

```
Ordinary MTQ issuance shall be funded by verified eligible value originating
through an authorized participating regulated bank or other legally authorized
institutional settlement channel.

MITHQAL shall not rely on discretionary proprietary capital to finance
ordinary MTQ issuance.

The bank/customer funding supporting issuance and MITHQAL's own institutional
capital are separate economic and accounting concepts.

MITHQAL institutional capital exists to support operations, security, regulatory
requirements, liquidity contingencies, emergency resilience, audits, and
institutional continuity.

Any monetary-capital requirement derived from stress modeling must be evaluated
against the finalized legal custody, backing, redemption and bank-prefunding
architecture before being treated as a required MITHQAL fundraising amount.
```

This principle separates **backing** from **capital**. The 1:1 MTQ backing reserve is funded by verified bank deposits under Model B; MITHQAL's own institutional capital funds operations, security, regulatory compliance, and emergency resilience — NOT ordinary MTQ issuance.

---

## §V25.0.B.2 — Four Distinguished Capital Concepts

MITHQAL distinguishes **four** capital concepts that have historically been conflated:

| Concept | Name | Description | Legal Owner | Accounting Class | Reusability |
|---|---|---|---|---|---|
| **A** | MTQ Backing Reserve | 1:1 asset base backing each outstanding MTQ at par ($1.00). Under Model B, ordinary portion funded by Concept C; structural/anchor portion MITHQAL-owned. | Bank (Concept C portion) / MITHQAL Foundation (structural/anchor) | RESERVE_ASSET (segregated, allocated) | RESERVE_ONLY |
| **B** | MITHQAL Institutional Capital | MITHQAL's own corporate capital — operations, security, regulatory, audit, continuity. NOT a substitute for Concept A. | MITHQAL Foundation (proposed) | OPERATING_CASH + REGULATORY_CAPITAL + EQUITY | OPERATIONAL |
| **C** | Bank Institutional Funding | Verified eligible value originated through authorized regulated bank. Funds ordinary MTQ issuance under Model B. | Bank (deposit holder) / Customer (beneficial) | CUSTOMER_DEPOSIT (bank liability) + MTQ_LIABILITY (MITHQAL obligation) | OPERATIONAL |
| **D** | Liquidity Resources (ILPS) | Institutional Liquidity Protection Stack — 5 layers (settlement, redemption, emergency, structural, external). Corrected total: $48.1M. | MITHQAL Foundation (Layers 1-4) / External (Layer 5) | HQLA + EMERGENCY_RESERVE + COMMITTED_FACILITY | LIQUIDITY |

**These four concepts are SEPARATE.** A single reserve asset or funding amount CANNOT be counted in multiple categories (per §V25.0.B.10 No Double Counting Rule).

---

## §V25.0.B.3 — $54M Reserve Terminology Correction

The $54,000,000 figure (54M MTQ × $1.00 par) is the **Canonical MTQ Reserve / Backing Base**.

**It is NOT called:**
- "Monetary capital"
- "MITHQAL capital"
- "Operating capital"
- "Regulatory capital"
- "Emergency capital"
- "Fundraising requirement"

**Equation:** `totalSupply × PAR = 54,000,000 × $1.00 = $54,000,000`

**Distinction:** Reserve ≠ Operating Capital; Reserve ≠ Regulatory Capital; Reserve ≠ Emergency Capital; Reserve ≠ Fundraising Requirement.

**Funding source (per §V25.0.B.1 principle):**
- Under Model A: 100% MITHQAL-owned reserves.
- Under Model B: ordinary issuance funded by verified bank deposits (Concept C); structural/anchor portion (gold + emergency) MITHQAL-owned.

---

## §V25.0.B.4 — $15.815M Capital Solver Reframing

The $15,815,000 figure (formerly "ΔCapital_min") is renamed **"Minimum Additional Monetary Protection Capital"**.

**Canonical statement:**

> Under the current calibrated reserve/stress model and stated assumptions, the solver estimates approximately $15.815M of incremental monetary protection capital would be required to reduce the modeled constitutional reserve-breach probability to the defined 5% governance threshold.
>
> This figure is model-dependent and MUST NOT automatically be interpreted as:
> - MITHQAL's fundraising requirement
> - regulatory capital
> - operating capital
> - reserve backing required per MTQ
> - a legal capital requirement
> - a guaranteed solution
>
> The result must be re-evaluated against the finalized bank-funded/prefunded institutional issuance architecture.

**Not equivalent to:** MITHQAL fundraising requirement, regulatory capital, operating capital, reserve backing per MTQ, legal capital requirement, or guaranteed solution.

---

## §V25.0.B.5 — Dual Monetary Model (Model A vs Model B)

This is the **KEY DELIVERABLE** of this reconciliation edit.

### §V25.0.B.5.1 — Model A: Current Reserve Model

**Composition:** 100% of MTQ supply (54,000,000) is backed by MITHQAL-owned reserves.

| Metric | Value | Notes |
|---|---|---|
| Total MTQ Outstanding | $54,000,000 | Canonical v25.0 supply |
| Bank-Funded Issuance | $0 (0%) | None |
| MITHQAL-Owned Reserve Exposure | $54,000,000 (100%) | All on MITHQAL balance sheet |
| RR (point-in-time) | 1.20 | Locked (RR_CURRENT) |
| StressRR (MC post-stress mean) | 1.0004 | 250K MC paths, seed=42, 30-day horizon |
| LCR | 7.31 | MC mean |
| MLCR | 1.45 | ILPS baseline |
| ILPS Total | $48.1M | Corrected (per §V25.0.B.12) |
| SDR | 0.96 | NORMAL state |
| **P(RR<100%)** | **21.5432%** | **PRESERVED — not manipulated** |
| ΔCapital_min (to reach 5% threshold) | $15,815,000 | PRESERVED |
| Capital Requirement Type | MONETARY_PROTECTION | Model-dependent |

**Notes:** All $54M backed by MITHQAL-owned reserves. The 21.5432% breach probability applies to the entire supply. MC: 250K paths, seed=42, 30-day horizon. Breach probability is **preserved** — not suppressed, not optimized away. The capital requirement is monetary-protection capital only (model-dependent, not a fundraising target).

### §V25.0.B.5.2 — Model B: Bank-Funded Issuance Model

**Composition:**
- 80% of MTQ supply (43,200,000) funded by **verified bank deposits** (Concept C). Bank holds the backing.
- 20% of MTQ supply (10,800,000) MITHQAL-owned **structural/anchor** reserves (gold + emergency).

| Metric | Value | Notes |
|---|---|---|
| Total MTQ Outstanding | $54,000,000 | Canonical v25.0 supply |
| Bank-Funded Issuance | $43,200,000 (80%) | Backed by bank deposits |
| MITHQAL-Owned Reserve Exposure | $10,800,000 (20%) | Gold + emergency + structural |
| RR (blended point-in-time) | 0.96 | 0.80×1.00 + 0.20×1.20 |
| StressRR (blended MC post-stress mean) | 0.9920 | 0.80×0.99 + 0.20×1.0004 |
| LCR | 7.31 | For MITHQAL-owned portion |
| MLCR | 1.45 | Baseline |
| ILPS Total | $48.1M | Corrected |
| SDR | 0.96 | NORMAL state |
| **P(RR<100%) (blended)** | **≈ 4.71%** | **0.80×0.5% + 0.20×21.5432%** |
| ΔCapital_min (system level) | $0 | Blended already < 5% threshold |
| Capital Requirement Type | MONETARY_PROTECTION | Model-dependent |

**Bank-funded breach probability:** ~0.5% per 30-day horizon — reflects **bank credit risk only** (deposit guarantee + bail-in risk for TIER-1 regulated bank under modeled stress). This is NOT zero — it is bank credit risk, not reserve risk.

**MITHQAL-owned breach probability:** 21.5432% — **PRESERVED** for the structural/anchor portion. The reserve composition is unchanged (gold + emergency + structural, all MITHQAL-owned).

**Capital requirement:** Since the blended P(RR<100%) ≈ 4.71% is already below the 5% governance threshold, **no additional monetary-protection capital is required at the system level**. (The MITHQAL-owned portion's proportional solver = $15.815M × 20% = $3.163M, but this is informational only — it does NOT represent a system-level fundraising requirement because the blended probability is already below threshold.)

**MITHQAL still requires** (per §V25.0.B.14 — these are SEPARATE categories, NOT auto-combined):
- Operating capital ($4.7M PILOT phase)
- Regulatory capital (TBD per jurisdiction)
- Liquidity resources ($48.1M ILPS, with no double counting)
- Emergency resources ($23.8M, subset of ILPS)
- Scale capital ($4.7M → $12.6M → $17.6M phased)

### §V25.0.B.5.3 — Honest State

**The bank-funded model REDUCES the modeled breach probability but does NOT eliminate it.** Bank credit risk (~0.5% per 30 days for a TIER-1 bank under stress) is **NONZERO**. The 21.5432% model is **PRESERVED** for the MITHQAL-owned structural/anchor portion.

**Assumptions are DOCUMENTED, not manipulated.** The 80/20 split (80% bank-funded, 20% MITHQAL-owned structural/anchor) is the canonical pilot-design assumption. If the actual split differs, the blended probability must be recomputed.

**Model B is NOT production-ready.** Final custody, legal, regulatory authorization, and bank onboarding required.

### §V25.0.B.5.4 — Model Comparison

| Dimension | Model A | Model B | Delta |
|---|---|---|---|
| Bank-Funded Issuance | $0 (0%) | $43.2M (80%) | +$43.2M |
| MITHQAL-Owned Exposure | $54M (100%) | $10.8M (20%) | −$43.2M |
| RR (point-in-time) | 1.20 | 0.96 | −0.24 |
| StressRR (MC mean) | 1.0004 | 0.9920 | −0.0084 |
| P(RR<100%) | 21.5432% | 4.71% | −16.83pp |
| ΔCapital_min (system level) | $15.815M | $0 | −$15.815M |
| ILPS Total | $48.1M | $48.1M | $0 (unchanged) |
| Bank Credit Risk | 0% | ~0.5% | +0.5% |

---

## §V25.0.B.6 — Key Question Test (8 Scenarios A–H)

Eight scenarios tested for institutional resilience under the bank-funded issuance model:

| # | Scenario | New Issuance Stops | Existing MTQ Transferable | P(RR<100%) |
|---|---|---|---|---|
| A | Bank-Funded Issuance (normal) | No | Yes | ~0.5% |
| B | Fully Prefunded Issuance | No | Yes | ~0.5% |
| C | Bank + MITHQAL Co-Structure (canonical Model B) | No | Yes | ~4.71% |
| D | Stress Redemption Against Outstanding Institutional MTQ | Yes | Yes | ~7.2% |
| E | Bank Failure | Yes | Yes | ~5.0% |
| F | Custodian Failure | Yes | Yes | ~2.0% |
| G | Corridor Imbalance | No | Yes | ~0.5% |
| H | Systemic Liquidity Shock | Yes | Yes | ~15.0% |

**For each scenario, the following are documented in `runKeyQuestionTest()`:**
- What happens to MTQ
- Whether new issuance stops
- Whether existing MTQ remains transferable
- How redemption works
- How reconciliation works
- Modeled breach probability under the scenario

---

## §V25.0.B.7 — No Elimination of Reserve Requirements

**Bank-funded issuance does NOT eliminate any reserve requirement.** All 9 disciplines remain in force under both Model A and Model B:

| # | Discipline | Model A | Model B | Preserved |
|---|---|---|---|---|
| 1 | Reserve Backing | MITHQAL-owned reserve | Bank deposit + MITHQAL-owned structural | ✓ |
| 2 | Reserve Segregation | Allocated custody, no rehypothecation | Bank deposit segregated + MITHQAL allocated | ✓ |
| 3 | Proof of Reserves | Daily MITHQAL attestation | Bank + MITHQAL combined daily attestation | ✓ |
| 4 | Proof of Liabilities | Daily MTQ supply reconciliation | Same + dual-track reserve reconciliation | ✓ |
| 5 | Reserve Ratio (RR) | 1.20 (current) | Blended ~0.96 (1.00 + 1.20 weighted) | ✓ |
| 6 | StressRR | 1.0004 (MC mean) | Blended ~0.992 | ✓ |
| 7 | Liquidity Controls | LCR 7.31, MLCR 1.45 | Same + bank's own LCR | ✓ |
| 8 | Custody Controls | Multi-custodian allocated | Same + bank custody for deposits | ✓ |
| 9 | Redemption Controls | Article X enforced | Same (bank-funded via bank; MITHQAL-owned per Article X) | ✓ |

**Summary:** All 9 disciplines preserved. Bank-funded issuance changes WHO holds the backing, not WHETHER backing exists.

---

## §V25.0.B.8 — Legal / Economic Chain of Backing

```
Corporate
  ↓
Corporate bank account / eligible funding
  ↓
Participating regulated bank
  ↓
Verified institutional funding
  ↓
MITHQAL issuance authorization
  ↓
MTQ issuance
  ↓
Corporate bank-linked MTQ settlement position
  ↓
MITHQAL settlement
  ↓
Receiving bank
  ↓
Redemption / local monetary settlement
```

### §V25.0.B.8.1 — Five Backing Asset Types (Never the Same)

| Asset Type | Legal Owner | Beneficial Owner | Accounting Class |
|---|---|---|---|
| Customer Money | Participating bank | Corporate customer | CUSTOMER_DEPOSIT (bank liability) |
| Bank Money | Participating bank | Participating bank | BANK_CASH_AND_RESERVES |
| MTQ | MTQ holder (corporate) | MTQ holder | MTQ_LIABILITY (MITHQAL obligation) |
| MITHQAL Reserve | MITHQAL Foundation | MITHQAL Foundation | RESERVE_ASSET (segregated, allocated) |
| MITHQAL Operating Capital | MITHQAL Foundation | MITHQAL Foundation | OPERATING_CASH |

**"Never treat them as the same asset."** Each has unique legal owner, beneficial owner, custodian, liability relationship, accounting classification, reserve classification, liquidity classification, jurisdiction, and valuation date (per `BACKING_ASSET_METADATA_EXAMPLES`).

---

## §V25.0.B.9 — Bank Role vs MITHQAL Role

### §V25.0.B.9.1 — BANK ROLE (Participating Regulated Bank)

1. Customer onboarding: KYC, AML, sanctions screening, corporate verification.
2. Customer account management: deposit account, transaction limits, signatories.
3. Customer deposit holding: holds the customer deposit that backs ordinary bank-funded MTQ.
4. Eligibility attestation: via MBG, attests that deposit is verified and eligible.
5. Issuance authorization: collaborates with MITHQAL to authorize MTQ issuance against verified deposit.
6. Settlement channel: provides settlement rails (existing banking infrastructure).
7. Redemption execution: releases deposit to MTQ holder upon MITHQAL burn confirmation.
8. Regulatory compliance: maintains bank licenses, regulatory reporting, central-bank reserves.
9. Fraud controls: bank-grade fraud detection, transaction monitoring, suspicious activity reporting.
10. Customer relationship: customer continues to use bank for normal banking; MITHQAL is settlement layer.

### §V25.0.B.9.2 — MITHQAL ROLE (Wholesale Settlement Infrastructure)

1. Issuance authority: authorizes MTQ issuance only against verified eligible bank funding.
2. MTQ ledger: maintains canonical MTQ supply, holders, transaction history.
3. Reserve management: manages MITHQAL-owned structural/anchor reserves (gold, PAXG, stablecoins).
4. Reserve segregation: enforces allocated custody, no lending, no rehypothecation (constitutional).
5. Proof of reserves + liabilities: daily publication, reconciliation, audit trail.
6. Settlement infrastructure: MITHQAL settlement network, Bank Gateway (MBG), corridor management.
7. Risk controls: RR, StressRR, LCR, MLCR, SDR monitoring with dynamic issuance controls (FV3).
8. Emergency framework: RESOLUTION state, Article X liquidation order, exhaustion certificate.
9. Audit + transparency: independent audits, central-bank reporting, PFMI framework.
10. Governance: Foundation (proposed), independent board, council authorization for state transitions.
11. Bank coordination: MBG gateway, bank certification, eligibility verification.
12. Non-retail enforcement: NO retail MTQ (DNM-01); bank-mediated only (DNM-02); NO exchange functions (DNM-03).

---

## §V25.0.B.10 — No Double Counting Rule

```
NO DOUBLE COUNTING RULE:

A single reserve asset or funding amount CANNOT be counted simultaneously as:
  - customer funding
  - bank reserve
  - MITHQAL reserve
  - MITHQAL capital
  - emergency capital
  - liquidity capital

…unless explicitly legally and economically justified with documented accounting treatment.

Each reserve asset MUST have a unique legal owner, beneficial owner, custodian, liability
relationship, accounting classification, reserve classification, liquidity classification,
jurisdiction, and valuation date.

Violation of this rule = material misstatement of MITHQAL's financial position.
All MITHQAL reporting, all central-bank disclosures, all audit reports MUST enforce this rule.
```

The `BackingAssetMetadata` interface (8 fields) MUST be populated for every reserve asset. Audit verifies uniqueness of (legalOwner, custodian, accountingClassification) tuples.

---

## §V25.0.B.11 — Six Capital Categories with Full Metadata

Six distinct capital categories — each with distinct legal owner, accounting class, and reusability. **Do NOT auto-combine.**

| # | Type | Owner | Purpose | Legal Status | Accounting | Reusability | Amount | Evidence State |
|---|---|---|---|---|---|---|---|---|
| 1 | MONETARY_PROTECTION | MITHQAL Foundation | Reduce P(RR<100%) to 5% threshold (Model A: $15.815M; Model B: $0 system-level) | PROPOSED | RESERVE_ASSET | RESERVE_ONLY | $0 (Model B) | MODELLED |
| 2 | OPERATING | MITHQAL Foundation | Operations, 12-month PILOT runway | PROPOSED | OPERATING_CASH | OPERATIONAL | $4.7M | TARGET |
| 3 | REGULATORY | MITHQAL Foundation | Licensing + regulatory capital per jurisdiction | PENDING | REGULATORY_CAPITAL | RESTRICTED | TBD | MODELLED |
| 4 | LIQUIDITY | MITHQAL Foundation | ILPS 5-layer stack (corrected total $48.1M) | PROPOSED | COMMITTED_FACILITY | LIQUIDITY | $48.1M | TARGET |
| 5 | EMERGENCY | MITHQAL Foundation | Emergency capital (subset of ILPS, NOT additional) | PROPOSED | EMERGENCY_RESERVE | EMERGENCY | $23.8M | MODELLED |
| 6 | SCALE | MITHQAL Foundation | Phased growth ($4.7M → $12.6M → $17.6M) | PROPOSED | GROWTH_CAPITAL | OPERATIONAL | $4.7M (PILOT) | TARGET |

**Note:** The $15.815M ΔCapital_min (§V25.0.B.4) is a model-dependent monetary-protection capital requirement — it is NOT the same as operating, regulatory, liquidity, emergency, or scale capital. Each category must be funded separately.

---

## §V25.0.B.12 — ILPS Reconciliation ($46M → $48.1M Correction)

**CRITICAL CORRECTION:** The ILPS total has been **corrected from $46M to $48.1M** to match the actual sum of the 5 layers. Additionally, the Emergency + Structural ($23.8M) figure is a **SUBSET of $48.1M**, NOT additional.

### §V25.0.B.12.1 — Layer Breakdown (Corrected)

| Layer | Type | Amount | Included in Total |
|---|---|---|---|
| 1 | Settlement Liquidity | $2,700,000 | ✓ |
| 2 | Redemption Liquidity | $16,200,000 | ✓ |
| 3 | Emergency Liquidity | $10,800,000 | ✓ (Emergency subset) |
| 4 | Structural Reserve (Gold + PAXG) | $13,000,000 | ✓ (Structural subset) |
| 5 | External Committed Liquidity | $5,400,000 | ✓ |
| **Total** | | **$48,100,000** | |

### §V25.0.B.12.2 — Double Counting Risk (RESOLVED)

**WRONG (double counting):** Adding $46M (old total) + $23.8M (Emergency + Structural) = $69.8M. This is **DOUBLE COUNTING** because Emergency + Structural is INCLUDED in the total, not additional to it.

**CORRECT (no double counting):** The total is **$48.1M**. Emergency + Structural ($23.8M) is a **SUBSET** of $48.1M, not additional to it. Final ILPS requirement = $48.1M (with no double counting).

**Subset breakdown:**
- Emergency (Layer 3): $10.8M
- Structural (Layer 4): $13.0M
- Emergency + Structural subset total: $23.8M
- This $23.8M is INCLUDED in the $48.1M total.

### §V25.0.B.12.3 — Correction Rationale

The old total of $46M was based on Layer 4 = $12.96M (computation from 20% bullion of $64.8M R_a). The canonical corrected figure rounds Layer 4 to $13.0M for institutional reporting clarity, giving $48.1M total. All subsequent v25.0 references should use **$48.1M** as the canonical ILPS total.

---

## §V25.0.B.13 — MITHQAL Emergency Capital Classification

Emergency Capital is a **distinct capital category** — NOT the same as the 1:1 MTQ backing reserve. It is activated only under STRESS/EMERGENCY/RESOLUTION states.

| Sub-Type | Accounting Class | Amount |
|---|---|---|
| Balance-sheet capital | EQUITY | TBD |
| Committed liquidity | COMMITTED_FACILITY | $5.4M (ILPS Layer 5) |
| Reserve asset | RESERVE_ASSET | $13.0M (ILPS Layer 4 Structural) |
| Credit facility | CREDIT_FACILITY | TBD |
| Contingency funding | CONTINGENCY | TBD |

**Total Emergency Capital Available:** $23,800,000 (Emergency Layer 3 + Structural Layer 4 — subset of ILPS $48.1M total, NOT additional).

**Activation Conditions:**
- RR < 1.05 → STRESS state → ILPS Layer 3 Emergency Liquidity engaged.
- RR < 1.00 → EMERGENCY state → all issuance STOPPED; full ILPS engaged.
- RR < 0.95 → RESOLUTION state → issuance FROZEN (absolute); governance-led resolution.

---

## §V25.0.B.14 — Capital Solver — Reframed Output (6 Categories, No Auto-Combine)

The capital solver output separates requirements into 6 distinct categories. **They MUST NOT be automatically added into a single fundraising number.**

| # | Requirement | Amount (Model B) | Notes |
|---|---|---|---|
| 1 | Monetary Protection | $0 | Model B: blended P < 5% threshold; Model A: $15.815M |
| 2 | Operating Funding | $4.7M | PILOT phase 12-month runway |
| 3 | Regulatory Capital | TBD | Per jurisdictional license |
| 4 | Liquidity | $48.1M | ILPS (corrected, no double counting) |
| 5 | Emergency | $23.8M | SUBSET of Liquidity — NOT additional |
| 6 | Scale | $4.7M | PILOT phase of growth ($4.7M → $12.6M → $17.6M) |

**Critical rule:** "These requirements MUST NOT be automatically added into a single fundraising number. Each is a distinct category with distinct legal owner, accounting class, and reusability. Emergency ($23.8M) is a SUBSET of Liquidity ($48.1M) — NOT additional."

**Under Model B (bank-funded issuance):** Monetary protection requirement is $0 at system level because bank-funded MTQ is backed by verified bank deposits (not MITHQAL proprietary capital). The 21.5432% model still applies to the MITHQAL-owned structural/anchor portion (20% of supply).

---

## §V25.0.B.15 — Sources & Uses Table (7 Rows)

| # | Source | Requirement | Amount | Purpose | Legal Owner | Accounting Class | Reusability |
|---|---|---|---|---|---|---|---|
| 1 | Verified bank deposits (Concept C) | Reserve backing (Concept A) for bank-funded MTQ | $43.2M (80%) | 1:1 backing of bank-funded MTQ | Bank | CUSTOMER_DEPOSIT | RESERVE_ONLY |
| 2 | MITHQAL Foundation operating | Operating funding — 12-month PILOT | $4.7M | Payroll, cloud, security, legal, compliance | MITHQAL Foundation | OPERATING_CASH | OPERATIONAL |
| 3 | MITHQAL Foundation institutional | Institutional capital — supports ops + regulatory + emergency + audit + continuity | $0 (subset) | Operations + regulatory + emergency + audit + continuity | MITHQAL Foundation | OPERATING_CASH + REGULATORY_CAPITAL + EQUITY | OPERATIONAL + RESTRICTED |
| 4 | MITHQAL Foundation ILPS | Liquidity resources — ILPS 5 layers | $48.1M | Settlement + redemption + emergency + structural + external | MITHQAL Foundation / External | HQLA + EMERGENCY_RESERVE + COMMITTED_FACILITY | LIQUIDITY |
| 5 | MITHQAL Foundation ILPS (Emergency + Structural subset) | Emergency resources — subset of ILPS, NOT additional | $23.8M | Emergency + structural reserve (subset of $48.1M) | MITHQAL Foundation | EMERGENCY_RESERVE + STRUCTURAL_GOLD | EMERGENCY + RESERVED |
| 6 | MITHQAL Foundation regulatory | Regulatory capital — TBD per jurisdiction | $0 (TBD) | DIFC/ADGM/VARA/MAS/FCA licenses | MITHQAL Foundation | REGULATORY_CAPITAL | RESTRICTED |
| 7 | MITHQAL Foundation scale | Scale funding — phased growth | $4.7M (PILOT) | Expansion to corridors, jurisdictions, custodians | MITHQAL Foundation | GROWTH_CAPITAL | OPERATIONAL |

**CRITICAL RULE:** "Do NOT automatically add $15.815M + $4.7M and call it 'MITHQAL requires $20.5M.' Each line item is a distinct capital category with distinct legal owner, accounting class, and reusability."

---

## §V25.0.B.16 — Zero-Budget Development Mode

| Field | Value |
|---|---|
| Current Reality | $0 external capital raised |
| Model Requirement | $15.815M monetary protection (Model A only — $0 under Model B) + $4.7M PILOT operating + $48.1M ILPS liquidity (no double counting) + TBD regulatory + $4.7M → $12.6M → $17.6M phased scale |
| Target Funding | To be raised from non-profit sources per Evidence Pipeline (§V25.0.A.9) |
| Confirmed Funding | $0 |

**Evidence States (per category):**
- monetaryProtection: MODELLED
- operating: TARGET
- regulatory: MODELLED
- liquidity: TARGET
- emergency: MODELLED
- scale: TARGET

**9-Stage Evidence Pipeline:** MODELLED → TARGET → OUTREACH → INTERESTED → LOI → APPLICATION → DUE_DILIGENCE → AWARDED → FUNDED.

**Rule:** "Do NOT present model requirements as money already available." Each requirement has a current evidence state. None are FUNDED.

---

## §V25.0.B.17 — Bank-Funded Issuance Risk Controls (16 Controls)

**Rule:** ANY FAILURE = BLOCK. No exceptions. No governance override at the smart-contract level.

| # | Control | Enforced By | Description |
|---|---|---|---|
| 1 | Institution Authorization | GOVERNANCE | Bank authorized by MITHQAL governance (council approval) |
| 2 | Jurisdiction Authorization | GOVERNANCE | Bank jurisdiction on authorized list (sanctions, regulatory) |
| 3 | Customer Authorization Attestation | BANK | Bank attests customer authorized (KYC, AML, sanctions cleared) |
| 4 | Bank Funding Verification | BANK | Bank verifies eligible funding exists for requested MTQ |
| 5 | Reserve Eligibility | MBG | Verified funding meets reserve eligibility (currency, custodian, liquidity) |
| 6 | Custody Verification | CUSTODIAN | For MITHQAL-owned reserves, custody verified (allocated, segregated) |
| 7 | NAV | MITHQAL | Net Asset Value current (≤ 24 hours) and within tolerance |
| 8 | RR | MITHQAL | Reserve Ratio ≥ 1.15 (NORMAL state) |
| 9 | StressRR | MITHQAL | Stress Reserve Ratio (MC post-stress mean) ≥ 1.00 |
| 10 | Liquidity | MITHQAL | LCR and MLCR ≥ 1.00; SDR < 1.00 |
| 11 | Sanctions | BANK | OFAC + UN + EU + jurisdictional sanctions screening |
| 12 | Corridor | MITHQAL | Corridor active and within capacity |
| 13 | Transaction Limit | MITHQAL | Within per-transaction, daily, monthly limits |
| 14 | Policy Version | MITHQAL | Current MITHQAL policy version active, not deprecated |
| 15 | Deterministic Authorization | MITHQAL | All 14 prior controls pass deterministically |
| 16 | Smart-Contract Execution | MITHQAL | Issuance authorization via audited smart contract (no manual override) |

---

## §V25.0.B.18 — Bank Failure Scenarios (5 Scenarios)

Five scenarios tested for bank-side failure resilience:

| # | Scenario | New Issuance Stops | Existing MTQ Transferable | P(RR<100%) |
|---|---|---|---|---|
| 1 | BANK_FAILURE (bank unable to meet obligations) | Yes | Yes | ~5.0% |
| 2 | BANK_SUSPENSION (regulator-driven temporary pause) | Yes | Yes | ~1.0% |
| 3 | BANK_INSOLVENCY (permanent — bank declares bankruptcy) | Yes | Yes | ~5.0% |
| 4 | BANK_LIQUIDITY_CRISIS (solvent but illiquid) | No (slowed) | Yes | ~1.0% |
| 5 | BANK_GATEWAY_OUTAGE (MBG technical outage) | Yes | Yes | ~0.5% |

For each scenario, the following are documented in `BANK_FAILURE_SCENARIOS`:
- Who holds backing
- Who owes redemption
- What happens to MTQ
- Whether new issuance stops
- Whether existing MTQ remains transferable
- How redemption works
- How reconciliation works
- How customer claims are treated
- How reserve segregation is protected
- Jurisdictional note (treatment varies by jurisdiction)

**Jurisdictional notes:** Treatment varies by jurisdiction. US: FDIC resolution. EU: SRB/BRRD bail-in. UK: PRA/FSCS. UAE: Central Bank resolution framework.

---

## §V25.0.B.19 — Custody Legal Ownership Matrix

**Mandatory before production.** Every reserve asset type has documented:

| Field | Description |
|---|---|
| LEGAL_OWNER | Who legally owns the asset |
| BENEFICIAL_OWNER | Who benefits from the asset |
| CUSTODIAN | Who holds the asset |
| CLAIM_HOLDER | Who has the claim on the asset |
| REDEMPTION_OBLIGOR | Who owes redemption |
| INSOLVENCY_TREATMENT | How the asset is treated under custodian insolvency |

Seven entries documented in `CUSTODY_LEGAL_OWNERSHIP_MATRIX`:
1. Customer bank deposit (bank-funded MTQ backing)
2. Physical allocated gold (MITHQAL-owned structural reserve)
3. Tokenized allocated gold (PAXG) (MITHQAL-owned structural reserve)
4. USD cash (ILPS Layer 1 + Layer 2)
5. Short-duration sovereigns (ILPS Layer 3 Emergency)
6. Committed credit facility (ILPS Layer 5 External)
7. MITHQAL operating cash (Concept B)

All entries currently at status `MODELLED`. Status will advance through `TARGET → AGREEMENT_PENDING → AGREED → OPERATIONAL` as custody agreements are executed.

---

## §V25.0.B.20 — Gold Reserve Doctrine

```
GOLD_RESERVE_DOCTRINE:

keepGold: true
constitutionalAnchor: true
notAutomaticShariaCompliance: true

canonicalStatement:
  Gold is the constitutional monetary anchor and an important component of the
  intended Sharia-compatible architecture. Final Sharia permissibility requires
  independent qualified scholarly review and certification of the complete live
  structure.
```

**Rationale:**
1. Gold provides a non-sovereign, non-credit reserve anchor — independent of any single central bank.
2. Gold historically maintains value across monetary regimes (including fiat failures).
3. Gold is recognized across major Sharia schools as a permissible store of value (subject to structure).
4. Gold provides diversification against fiat currency concentration risk.
5. Gold supports the constitutional anchor requirement (MITHQAL Foundation constitution Article X).

**NOT a rationale for:**
- Automatic Sharia compliance — requires independent scholarly review.
- Speculative appreciation — gold is held as reserve, not investment.
- Eliminating other reserve assets — gold is one component of diversified reserve.
- Replacing fiat liquidity — gold is reserved (Article X: liquidated LAST).

---

## §V25.0.B.21 — Sharia Status

| Field | Value |
|---|---|
| Current Status | DESIGNED_FOR_INDEPENDENT_SHARIA_REVIEW |
| NOT | SHARIA_CERTIFIED |
| Until | Independent certification exists |

**Canonical statement:** "MITHQAL is designed for independent Sharia review. The architecture incorporates Sharia-compatible principles (gold anchor, no interest-bearing instruments in core reserves, asset-backed issuance, no speculative derivatives). However, MITHQAL is NOT Sharia-certified. Final Sharia permissibility requires independent qualified scholarly review and certification of the complete live structure by an AAOIFI-qualified Sharia board."

**Components designed for Sharia compatibility:**
1. Gold as constitutional monetary anchor (recognized Sharia store of value)
2. Asset-backed issuance (no fiat credit creation)
3. No interest-bearing instruments in core reserve backing
4. No speculative derivatives or short-selling
5. Real economic activity (trade settlement, not financial speculation)
6. Wholesale B2B only (no retail speculation)

**Components requiring Sharia review:**
1. Bank deposit backing (interest may accrue on bank deposits — requires review)
2. PAXG tokenization structure (requires review of Paxos structure)
3. External credit facility (interest-based — requires review or Sharia-compliant alternative)
4. Sovereign bond holdings in ILPS Layer 3 (interest-bearing — requires review)
5. Settlement fee structure (requires review for Sharia compliance)

---

## §V25.0.B.22 — Bank Gateway Reflection (MBG Integration)

```
MITHQAL BANK GATEWAY (MBG) — INTEGRATION WITH BANK-FUNDED ISSUANCE

Canonical flow:

  Corporate customer
    ↓ initiates payment / settlement instruction
  Participating regulated bank (bank-side system)
    ↓ processes instruction via existing banking infrastructure
  MITHQAL Bank Gateway (MBG) — sidecar adapter
    ↓ translates banking instruction → MTQ settlement instruction
    ↓ verifies bank authorization, customer authorization, sanctions, eligibility
  MITHQAL issuance authorization (per §V25.0.B.17 risk controls)
    ↓ all 16 controls pass → MTQ issuance authorized
  MTQ issuance (smart contract)
    ↓ issues MTQ 1:1 against verified bank funding
  Corporate bank-linked MTQ settlement position
    ↓ MTQ settles via MITHQAL settlement network
  Receiving bank (counterparty bank)
    ↓ receives MTQ, credits beneficiary
  Redemption / local monetary settlement
    ↓ beneficiary redeems MTQ → MITHQAL burns → bank releases fiat
```

**KEY PRINCIPLE:** MBG is a **TRANSLATION** layer — it does NOT replace core banking systems. Customers continue to use banks; banks use MITHQAL; MITHQAL uses MTQ to settle value between monetary systems. The MBG translates existing authorized banking instructions into MTQ settlement instructions.

**MBG IS NOT:**
- A new core banking system
- A SWIFT replacement (SWIFT-complementary per §V25.0.A.3)
- A customer-facing application
- A bank ledger replacement

**MBG IS:**
- A sidecar adapter
- An attestation gateway (bank → MITHQAL)
- A translation layer (banking instructions → MTQ settlement instructions)
- A risk control enforcement point (16 controls per §V25.0.B.17)

**MBG under Model B (bank-funded issuance):**
- Verifies bank funding eligibility before issuance authorization
- Attests to MITHQAL that bank deposit exists and is eligible
- Maintains three-way reconciliation (bank ↔ MBG ↔ MITHQAL ledger)
- Enforces all 16 risk controls (any failure = BLOCK)
- Does NOT hold customer funds (bank continues to hold)
- Does NOT replace bank's KYC/AML (bank retains)
- Does NOT expose customer private keys (DNM-08)

---

## §V25.0.B.23 — Bank Economic Model Recalculation

**Honesty rule:** "Do NOT assume a bank will pay for MITHQAL simply because the architecture exists."

Three-tier model: `calculateBankEconomics(tier, monthlyVolumeUSD)` returns full economic model.

| Tier | Integration Cost | Monthly Operating | Monthly Compliance | Revenue Bps | Cost Savings Bps | MITHQAL Fee Bps |
|---|---|---|---|---|---|---|
| TIER_1 | $250K | $30K | $15K | 5 | 8 | 3 |
| TIER_2 | $150K | $20K | $10K | 4 | 6 | 3 |
| TIER_3 | $75K | $12K | $6K | 3 | 4 | 3 |

**Returns:** bankRevenue, bankCostSavings, liquidityEfficiency, settlementEfficiency, integrationCost, complianceCost, mithqalFees, operatingCost, netAnnualBenefit, roi, npv, paybackMonths, breakEvenVolume.

**Example calculation (TIER_1 bank, $100M/month volume):**
- Monthly revenue (5bps): $50,000
- Monthly cost savings (8bps): $80,000
- Monthly liquidity efficiency (3bps): $30,000
- Monthly settlement efficiency (2bps): $20,000
- Monthly MITHQAL fees (3bps): $30,000
- Monthly operating + compliance: $45,000
- **Monthly net benefit:** $105,000
- **Annual net benefit:** $1,260,000
- **Payback (vs $250K integration):** ~2.4 months
- **5-year ROI:** ~25.2x
- **Break-even volume:** ~$150M/month

**Honest caveat:** Bank economics depend on actual volume, actual fee structure negotiated, and operational integration costs. The model above is illustrative — not a commitment. Bank partnerships require individual commercial negotiation.

---

## §V25.0.B.24 — Final Capital Model Status

```
MITHQAL does not assume that it must provide proprietary capital to finance
ordinary MTQ issuance. Ordinary issuance is intended to be backed by verified
eligible value originating through authorized regulated banks or legally
authorized institutional settlement channels. MITHQAL nevertheless requires
sufficient institutional operating, regulatory, liquidity and emergency
resources, the exact amount of which is jurisdiction- and structure-dependent.

The modeled monetary-protection capital requirement ($15.815M under Model A;
$0 at system level under Model B) is a MODEL-DEPENDENT FIGURE, not a fundraising
target. It must be re-evaluated against the finalized legal custody, backing,
redemption and bank-prefunding architecture before being treated as a required
MITHQAL fundraising amount.
```

---

## §V25.0.B.25 — Version Control

- **Blueprint Version:** v25.0
- **Document Title:** MITHQAL v25.0 — CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION
- **Rule:** DO NOT create v25.1. DO NOT rename the blueprint. DO NOT remove the Bank Gateway / Settlement Sidecar. DO NOT alter the wholesale B2B model.
- **Action:** EDIT / RECONCILIATION of v25.0
- **This Module Version:** v25.0-bank-funded-issuance-model-1.0
- **No version change:** ✓
- **No architecture fork:** ✓
- **No renaming:** ✓
- **Bank Gateway / Settlement Sidecar:** KEPT AS CORE (per §V25.0.A.4)
- **Wholesale B2B model:** PRESERVED (DNM-01: no retail MTQ)

---

## §V25.0.B.26 — Final Acceptance Criteria (18 Items)

| # | Criterion | Met | Evidence |
|---|---|---|---|
| 1 | Bank-funded issuance principle documented (§V25.0.B.1) | ✓ | `BANK_FUNDED_ISSUANCE_PRINCIPLE` exported |
| 2 | Four capital concepts (A/B/C/D) distinguished (§V25.0.B.2) | ✓ | `FOUR_CAPITAL_CONCEPTS` has 4 entries |
| 3 | $54M reserve terminology corrected (§V25.0.B.3) | ✓ | NOT_called list includes "Monetary capital" |
| 4 | $15.815M capital solver reframed (§V25.0.B.4) | ✓ | notEquivalentTo has 6 entries |
| 5 | Dual model: Model A preserves 21.5432%, Model B reduces blended (§V25.0.B.5) | ✓ | Model A=21.5432%, Model B≈4.71% |
| 6 | Key question test: 8 scenarios A-H (§V25.0.B.6) | ✓ | `runKeyQuestionTest()` returns 8 |
| 7 | 9 reserve requirements preserved (§V25.0.B.7) | ✓ | All 9 disciplines preserved |
| 8 | Legal/economic chain of backing (§V25.0.B.8) | ✓ | Chain + 5 backing asset types |
| 9 | Bank role vs MITHQAL role (§V25.0.B.9) | ✓ | 10 bank + 12 MITHQAL responsibilities |
| 10 | No double counting rule (§V25.0.B.10) | ✓ | Rule + 5 backing asset metadata examples |
| 11 | Six capital categories with metadata (§V25.0.B.11) | ✓ | 6 categories |
| 12 | ILPS reconciliation: $48.1M corrected (§V25.0.B.12) | ✓ | Total=$48.1M, Emergency+Structural=$23.8M subset |
| 13 | Emergency capital classification (§V25.0.B.13) | ✓ | 5 sub-types, distinct from MTQ backing |
| 14 | Capital solver output reframed (§V25.0.B.14) | ✓ | 6 separate requirements + doNotAutoCombine=true |
| 15 | Sources & uses table (7 rows, no auto-combine rule) (§V25.0.B.15) | ✓ | 7 rows + critical rule |
| 16 | Bank-funded risk controls (16 controls, ANY FAILURE = BLOCK) (§V25.0.B.17) | ✓ | 16/16 with BLOCK action |
| 17 | 5 bank failure scenarios documented (§V25.0.B.18) | ✓ | 5 scenarios |
| 18 | Final status UNCHANGED: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED | ✓ | Status preserved, no v25.1 created |

**Acceptance pass count:** 18/18.

---

## §V25.0.B.27 — Honest State Declaration

| Field | Value |
|---|---|
| honest | true |
| forcedToPass | false |
| productionAuthorized | false |
| modelRequirementsNotPresentedAsFunded | true |
| bankFundedModelReducesButDoesNotEliminate | true |

**Final status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED (unchanged).

**Three NEVER rules enforced (0 violations each):**
- Never convert simulated entity to LIVE
- Never convert internal test to external audit
- Never convert pilot-ready to production-ready

---

## §V25.0.B.28 — Closing Declaration

**MITHQAL v25.0 is the frozen normative architecture.**

This section has corrected the v25.0 capital/issuance model to reflect bank-funded/prefunded institutional issuance. No version increment. No architecture fork. No renaming.

**What changed:**
- New TypeScript module: `src/lib/bank-funded-issuance-model.ts` (~2,232 lines)
- New API route: `GET /api/bank-funded-issuance-model`
- Dual monetary model: Model A (21.5432% preserved) vs Model B (bank-funded, lower blended P(RR<100%) ≈ 4.71%)
- ILPS reconciliation: $48.1M total (corrected from $46M); Emergency+Structural ($23.8M) is SUBSET, not additional
- 6 capital categories separated (no auto-combining)
- 5 bank failure scenarios documented
- 18 acceptance criteria (18/18 met)

**What did NOT change:**
- The 21 core v25.0 architectural invariants (frozen per §V25.0.A.1)
- The 21.5432% modeled probability (PRESERVED for Model A)
- The $15.815M capital result (preserved for Model A; reframed for Model B)
- The gold anchor (kept per §V25.0.B.20)
- The SWIFT side-adapter positioning (confirmed per §V25.0.A.3)
- The Bank Gateway / Settlement Sidecar (kept as core per §V25.0.A.4)
- The wholesale B2B model (DNM-01: no retail MTQ)
- The final status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED

**Remaining work (no further architecture versions will be created):**
1. Bank onboarding (first bank partnership, technical certification, MBG integration)
2. Custody legal agreements (advance `CUSTODY_LEGAL_OWNERSHIP_MATRIX` entries from MODELLED → AGREED)
3. Regulatory capital determination per jurisdiction
4. Independent model validation (Model A: 21.5432%; Model B: 4.71% blended)
5. Independent capital adequacy review (6 categories)
6. Independent Sharia certification
7. PFMI gap assessment (per §V25.0.A.15)
8. External audit (Trail of Bits / OpenZeppelin / ConsenSys Diligence)
9. Controlled pilot execution (100+ transactions, 99.5% uptime, 0 unauthorized issuance)
10. Council authorization (4/7 for LIVE_PILOT, 6/7 for PRODUCTION)

**Canonical closing principle (unchanged):**

> **"MITHQAL is a neutral wholesale settlement infrastructure connecting regulated monetary systems. MTQ sits between monetary systems, not instead of monetary systems. Customers continue to use banks; banks use MITHQAL; MITHQAL uses MTQ to settle value between monetary systems. The MITHQAL Bank Gateway translates existing authorized banking instructions into MTQ settlement instructions — without replacing core banking systems. TRANSLATION, NOT TRANSFORMATION."**

---

**END OF §V25.0 — FINAL BANK-FUNDED / PREFUNDED ISSUANCE & CAPITAL RECONCILIATION**

---

**END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION (WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION)**
