# Custody Readiness Report

**Report Date:** 2026-08-09
**Author:** Chief Systems Architect / Technical Due-Diligence Lead (acting in concert)
**Status:** NOT READY — custody framework is documented but not operationally implemented
**Authority:** §11-§14 of `docs/blueprint/custody-framework-v2.md`

---

## Executive Summary

The MITHQAL Constitutional Custody Framework v2.0 is **documented but not operationally implemented**. The custody tier hierarchy, eligibility criteria, and geographic strategy are defined in three architecture documents (this report's siblings), but no custodian agreements have been executed, no central bank has agreed to custody MITHQAL reserves, and the current operational state has a **single-custodian 52% concentration** that violates the constitutional 25% per-custodian cap (§Article XVII §12).

**Verdict:** The custody architecture is **institutionally defensible in design** but **not yet operational**. Three blocking prerequisites are unmet:

1. The Safe Multi-Sig is 1-of-1 deployer-controlled (should be 3-of-5 — see `network-architecture-audit.md` F-CRITICAL-1).
2. The Constitutional Council is not seated (governance is founder-controlled).
3. The current single-custodian 52% concentration violates the constitutional 25% cap (Evidence Ledger E048).

Until these are resolved, MITHQAL cannot claim operational custody compliance. The framework documented in `custody-framework-v2.md` is the target; this report assesses readiness against that target.

---

## Readiness Checklist

### Constitutional Foundation

| Prerequisite | Status | Evidence |
|---|---|---|
| Safe Multi-Sig operationalized (3-of-5, 5 institutional signers) | ❌ **NOT READY** | `cast call getThreshold()` returns `1` on Monad + Arc; `getOwners()` returns `[deployerEOA]` (verified 2026-08-09) |
| Constitutional Council seated (7 members) | ❌ **NOT READY** | Monad + Arc have 1/7 council members (deployer EOA only); Local has 7 Anvil accounts (not institutional signers) |
| Admin roles transferred from deployer EOA to Safe Multi-Sig | ❌ **NOT READY** | Deployer EOA holds all admin roles on all 3 chains |
| Constitutional custody framework ratified | ⚠️ **DOCUMENTED, NOT RATIFIED** | `docs/blueprint/custody-framework-v2.md` is a proposal, pending Council ratification |
| Pre-existing constitutional defects resolved (merge conflict, conflicting concentration thresholds, Reserve.sol tier mismatch) | ❌ **NOT READY** | 4 critical defects identified in `custody-framework-v2.md` §11; none resolved |

### Custodian Eligibility

| Prerequisite | Status | Evidence |
|---|---|---|
| Custodian Eligibility Committee established | ❌ **NOT READY** | No committee exists; the Foundation is not yet operational |
| 12 eligibility criteria codified | ✅ **DOCUMENTED** | `docs/architecture/custodian-eligibility-matrix.md` defines all 12 criteria |
| Eligibility verification process defined | ✅ **DOCUMENTED** | The matrix specifies verification method + evidence required for each criterion |
| Independent legal counsel engaged | ❌ **NOT READY** | No legal firm engaged for custody agreement opinions |
| Independent auditor engaged | ❌ **NOT READY** | No auditor engaged for custody verification |

### Custodian Engagement

| Prerequisite | Status | Evidence |
|---|---|---|
| Tier 1 (Official-Sector) custodian engaged | ❌ **NOT READY** | No central bank has agreed to custody MITHQAL reserves; no engagement in progress |
| Tier 2 (Regulated Bank) custodian engaged | ❌ **NOT READY** | No custody agreement executed with JPMorgan, HSBC, BNY Mellon, State Street, or any other regulated bank |
| Tier 3 (Specialized Vault) custodian engaged | ❌ **NOT READY** | No vault agreement executed with Brink's, Loomis, Malca-Amit, or any other specialized vault |
| Tier 4 (Contingency) custodian pre-approved | ❌ **NOT READY** | No contingency custodian identified |
| Single-custodian 52% concentration resolved (E048) | ❌ **NOT READY** | Current operational state has 52% concentration with a single custodian (NY Fed in test commentary; likely a placeholder) |

### Geographic Diversification

| Prerequisite | Status | Evidence |
|---|---|---|
| 5-region geographic strategy documented | ✅ **DOCUMENTED** | `docs/architecture/geographic-custody-strategy.md` defines the 5-region strategy |
| Multi-jurisdictional custody achieved (≥3 jurisdictions) | ❌ **NOT READY** | Current operational state is single-jurisdiction (US, per E048) |
| 30% per-jurisdiction cap enforced | ⚠️ **DOCUMENTED, NOT ENFORCED** | The cap is in the constitution; the operational state violates it |
| 8% per-jurisdiction bullion cap enforced | ⚠️ **DOCUMENTED, NOT ENFORCED** | Same |

### Physical Gold Custody

| Prerequisite | Status | Evidence |
|---|---|---|
| Allocated physical bullion requirement codified | ✅ **DOCUMENTED** | §Article IV of the Constitution + `custody-framework-v2.md` §5 |
| LBMA Good Delivery standard required | ✅ **DOCUMENTED** | §Article IV + `custody-framework-v2.md` §5 |
| Bar-level identification (serial, weight, purity, assay, vault) required | ✅ **DOCUMENTED** | `custody-framework-v2.md` §5 allocation hierarchy |
| Independent quarterly physical bar count | ❌ **NOT READY** | No independent verifier engaged; no bars in custody |
| No rehypothecation / no lending | ✅ **DOCUMENTED** | §Article IV constitutional requirement |
| ETF / paper gold explicitly subordinated | ✅ **DOCUMENTED** | §Article IV prohibitions + `custody-framework-v2.md` §5 |

### Reporting & Transparency

| Prerequisite | Status | Evidence |
|---|---|---|
| Daily custody attestation mechanism designed | ⚠️ **PARTIAL** | The on-chain `Reserve.sol` contract has a custody attestation field, but it is not wired to real custodian reporting |
| Reserve Custody Status indicator designed | ✅ **DOCUMENTED** | `custody-framework-v2.md` §10 defines the 5-status indicator |
| Public bar-level reserve reporting designed | ⚠️ **PARTIAL** | `custody-framework-v2.md` §1 mentions it; no implementation |
| Continuous reconciliation (custody vs. on-chain supply) designed | ⚠️ **PARTIAL** | The Proof of Reserves framework (§Article VII) supports this; not implemented for real custody |

### Operational Resilience

| Prerequisite | Status | Evidence |
|---|---|---|
| Custodian failure playbook documented | ✅ **DOCUMENTED** | §Article XV Scenario #10 + §Article VIII Disaster Recovery |
| 7-day RTO for custodian substitution | ✅ **DOCUMENTED** | §Article VIII + `custody-framework-v2.md` §4 (Tier 4) |
| Tier 4 contingency custodian pre-approved | ❌ **NOT READY** | No contingency custodian identified |
| Insurance coverage for reserve assets | ❌ **NOT READY** | No insurance policy in place |

---

## Readiness Score

| Category | Criteria Met | Total | Score |
|---|---|---|---|
| Constitutional Foundation | 0 | 5 | 0% |
| Custodian Eligibility | 2 | 5 | 40% |
| Custodian Engagement | 0 | 5 | 0% |
| Geographic Diversification | 1 | 4 | 25% |
| Physical Gold Custody | 4 | 6 | 67% |
| Reporting & Transparency | 1 | 4 | 25% |
| Operational Resilience | 2 | 4 | 50% |
| **Total** | **10** | **33** | **30%** |

**Verdict: 10 of 33 criteria met. Custody operationalization is BLOCKED.**

The framework is well-documented (the documentation criteria score well), but the operational and governance prerequisites are unmet. The blocking factors are:

1. **F-CRITICAL-1** — Safe Multi-Sig is 1-of-1 (blocks all constitutional authority)
2. **E048** — Single-custodian 52% concentration (blocks custody compliance)
3. **No custodian agreements executed** (blocks operational custody)

---

## Risks of Premature Custody Claims

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| MITHQAL claims central-bank custody without agreement | Medium (marketing pressure) | Critical — reputational damage, legal liability, regulatory action | Strict policy: no public claim without executed agreement; Reserve Custody Status indicator only shows verified states |
| MITHQAL claims "allocated gold" without real bars in custody | Medium | Critical — false advertising, securities fraud | Strict policy: no "allocated gold" claim without independent bar-level verification |
| Single custodian fails | High (52% concentration) | Critical — 52% of reserves inaccessible | Engage 3+ custodians immediately (Phase G-1); reduce concentration below 25% |
| Custodian agreement lacks constitutional clauses | Medium | High — custody not bankruptcy-remote; reserves could be claimed in custodian insolvency | All 12 eligibility criteria must be met; legal opinion on enforceability required |
| Geographic concentration (single jurisdiction) | High (US-only currently) | High — sovereign risk, regulatory risk | Pursue 5-region diversification (Phase G-2) |

---

## Recommended Implementation Sequence

### Phase R-1 — Constitutional Cleanup (Immediate, Documentation Only)
1. Resolve the git merge conflict in `blueprint.txt` lines 9138–9380.
2. Reconcile the 4 conflicting concentration thresholds (25% / 30% / 40%) down to the §Article XVII §12 binding cap (25% per custodian, 30% per jurisdiction).
3. Update `Reserve.sol` tier definitions to match the constitution (Tier 1 = cash, Tier 2 = sovereign, Tier 3 = bullion, Tier 4 = stablecoins).
4. Recover or re-author §XX.16 (Multi-Custodian Diversification Doctrine).
5. Rename "Emergency Custodian" (Article X governance role) to "Emergency Steward" to avoid terminology collision.
6. Rename "§39.2 Key Hierarchy — four constitutional custody tiers" to "four constitutional key-storage tiers".

### Phase R-2 — Governance Operationalization (Blocking)
1. Seat the Constitutional Council (7 members, including the 5 named institutional signers).
2. Reconfigure the Safe Multi-Sig to 3-of-5 with 5 named institutional signers.
3. Transfer all admin roles from deployer EOA to the Safe Multi-Sig.
4. Ratify the Custody Framework v2.0.

### Phase R-3 — Custodian Engagement (Short-Term, Phase G-1)
1. Engage 3+ Tier 2 regulated bank custodians (JPMorgan, HSBC, BNY Mellon / State Street).
2. Engage 3+ Tier 3 specialized vaults (Brink's, Loomis, Malca-Amit).
3. Reduce single-custodian concentration below 25% (resolve E048).
4. Achieve 3-jurisdiction diversification (US, UK, Singapore).

### Phase R-4 — Geographic Expansion (Medium-Term, Phase G-2)
1. Engage Tier 2 custodians in UAE and Saudi Arabia.
2. Engage Tier 3 vaults in UAE and Hong Kong.
3. Achieve 5-region diversification.

### Phase R-5 — Official-Sector Engagement (Long-Term, Phase G-3)
1. Explore Tier 1 custody with CBUAE (most permissive rulebook).
2. Explore Tier 1 custody with Bank of England (for commercial firms).
3. Engage BIS for cross-border settlement infrastructure.
4. Explore Tier 1 custody with SAMA.
5. Long-term: explore NY Fed eligibility.

### Phase R-6 — Public Reporting (Ongoing, Phase G-4)
1. Publish Reserve Custody Status indicator (only verified states).
2. Publish bar-level reserve reports where legally permissible.
3. Continuous reconciliation (daily custody attestation vs. on-chain supply).

---

## Current State vs. Target State

| Aspect | Current State (2026-08-09) | Target State (per Custody Framework v2.0) | Gap |
|---|---|---|---|
| Custody tier hierarchy | Flat (no tiers) | 4-tier (Official / Bank / Vault / Contingency) | Framework documented; not ratified; not implemented |
| Number of custodians | 1 (single custodian, 52% concentration) | ≥3 (each ≤25%) | 2+ additional custodians needed |
| Number of jurisdictions | 1 (US only) | ≥3 (target: 5 regions) | 2+ additional jurisdictions needed |
| Custodian eligibility | Not formalized | 12 criteria, independently verified | Eligibility matrix documented; no verification process |
| Physical gold | None in custody | Allocated, LBMA Good Delivery, bar-level identification | No bars in custody; no vault agreements |
| Central bank engagement | None | Tier 1 where legally available (CBUAE, BoE, BIS, SAMA explored) | No engagement; no agreements |
| Safe Multi-Sig | 1-of-1 deployer-controlled | 3-of-5 with 5 institutional signers | F-CRITICAL-1 unremediated |
| Constitutional Council | 1/7 members (deployer only) | 7/7 members (5 named institutional signers) | F-CRITICAL-1 unremediated |
| Public custody reporting | None | Reserve Custody Status indicator + bar-level reports | Not implemented |
| Single-custodian concentration | 52% (violates 25% cap) | ≤25% per custodian | E048 unremediated |

---

## Conclusion

The MITHQAL custody architecture is **institutionally defensible in design** but **not yet operational**. The framework documented in `custody-framework-v2.md`, `custodian-eligibility-matrix.md`, and `geographic-custody-strategy.md` is sound — it establishes a tiered custody hierarchy, 12 eligibility criteria, 5-region geographic diversification, and allocated-physical-bullion requirements that are consistent with the BIS, Bank of England, and World Gold Council models.

However, the operational reality is that:
1. No custodian agreements have been executed.
2. No central bank has agreed to custody MITHQAL reserves.
3. The current single-custodian 52% concentration violates the constitutional 25% cap.
4. The Safe Multi-Sig is 1-of-1 deployer-controlled (F-CRITICAL-1).
5. The Constitutional Council is not seated.

**No public claim of custody, central-bank engagement, or allocated-gold holdings should be made until the prerequisites in this report are met.** The Reserve Custody Status indicator must show "Pending" until custodian agreements are executed and operational.

The path to operational custody compliance is:
1. **Phase R-1** (constitutional cleanup) — documentation only, can begin immediately.
2. **Phase R-2** (governance operationalization) — blocking, requires human/institutional action.
3. **Phase R-3** (custodian engagement) — depends on Phase R-2.
4. **Phase R-4** (geographic expansion) — depends on Phase R-3.
5. **Phase R-5** (official-sector engagement) — long-term, depends on Phase R-4.
6. **Phase R-6** (public reporting) — ongoing, depends on Phase R-3.

---

## No Code Changes Made

This report is **read-only**. No custody code was implemented. No custodian agreements were executed. The report documents the readiness state and informs the implementation sequencing.
