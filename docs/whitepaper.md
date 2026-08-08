
# MITHQAL Whitepaper

## Constitutional Monetary Institution for Neutral, Fully Reserved Trade Settlement

**Version:** 1.0  
**Date:** 3 August 2026  
**Prepared By:** MITHQAL Foundation (planned) — currently operated by JOZOUR LLC (New Jersey)  
**Contact:** Mohamed Eltonsy (meltonsy@icloud.com)

---

## Institutional Status Disclaimer

> MITHQAL is currently operated by JOZOUR LLC during the institutional
> development phase. The constitutional architecture described throughout this
> documentation represents the intended institutional destination of the
> project. Planned entities do not yet exist and are not currently operating.

The MITHQAL Foundation, Holding Company, Operations Ltd., and Markets Ltd.
are **planned** entities. They are part of the TARGET institutional
architecture and do **not** yet exist. Today the only operating entity is
**JOZOUR LLC (New Jersey)**, which performs platform development, software
engineering, APIs, website, infrastructure, AI platform, documentation,
institutional outreach, compliance operations, mint/redemption operations,
and day-to-day operations. JOZOUR LLC is **NOT** the Institution, the reserve
owner, the reserve custodian, or the constitutional authority.

### Reserve Independence (canonical wording)

> "Reserve assets are held in segregated custody under the Constitutional
> Reserve Framework through approved custodian institutions for the exclusive
> benefit of the MITHQAL reserve system. They are never operating assets and
> never corporate assets of JOZOUR LLC or any future operating entity."

### Target Architecture (planned — does not yet exist)

**Commercial side (planned):**

```
Founder → MITHQAL Holding Company (planned) → [Operations Ltd. (planned) | Markets Ltd. (planned)]
```

**Constitutional side (planned):**

```
MITHQAL Constitution → Independent Constitutional Foundation (planned)
                     → Approved Custodian Institutions
                     → Gold · Silver · Cash · Sukuk · Other Approved Reserve Assets
```

Operations Ltd. and Markets Ltd. are **sister companies** (never
parent/child). The Foundation is **never** connected underneath the Holding
Company. Reserves are **never** connected underneath Operations or Markets.

See [`docs/legal/institutional-principles.md`](legal/institutional-principles.md)
and [`docs/roadmap/organizational-roadmap.md`](roadmap/organizational-roadmap.md)
for the canonical rules and staged roadmap.

---

## Executive Summary

MITHQAL is a constitutional monetary institution that provides neutral, fully reserved (100%+), Sharia-compliant settlement infrastructure for international trade. It is not a bank, payment processor, or DeFi protocol—it is a settlement layer that complements existing banking systems.

**Key Differentiators:**

| Feature | Description |
|---------|-------------|
| **100%+ Reserve Backing** | Every unit is backed by tangible assets (cash, sukuk, gold, silver) |
| **Constitutional Governance** | Immutable principles, independent oversight, 4 absolute invariants |
| **Deterministic Monetary Engine** | Algorithmic weighting based on objective data (COFER, SWIFT, BIS) |
| **Sharia-Compliant by Design** | AAOIFI review submitted; independent Sharia Committee planned |
| **Formal Verification** | Certora specification completed; formal verification execution pending (same tool as Aave, Compound, US Treasury) |
| **Neutral** | No political, economic, or jurisdictional alignment |

**Current Status:**

- ✅ Constitution complete (500+ pages, 5 Layers, 65 Sections)
- ✅ Smart contracts deployed and verified on Monad Testnet (9 Protocol Smart Contracts + 1 Safe Multi-Signature Treasury + 1 Deployment Wallet (EOA))
- ✅ Certora specification completed (formal verification execution pending)
- ✅ Sharia review submitted to AAOIFI
- ✅ Live dashboard and open-source code available
- ✅ Operating entity established (JOZOUR LLC, NJ, EIN 84-3470275)

---

## 1. The Problem: International Trade Settlement

Today's cross-border trade settlement is:

| Issue | Impact |
|-------|--------|
| **Slow** | 1-3 days (SWIFT correspondent banking) |
| **Expensive** | $50-$200 per transaction |
| **Opaque** | No real-time visibility |
| **Inefficient** | Multiple intermediaries, reconciliation burden |
| **Centralised** | Single points of failure, counterparty risk |
| **Not Sharia-Compliant** | Islamic banks struggle to ensure compliance across jurisdictions |

**The Opportunity:**

- Global trade finance volume: ~$8 trillion annually
- Settlement friction costs: ~2-3% of transaction value
- Islamic trade finance: growing at 10-15% annually

MITHQAL addresses these frictions by providing a faster, cheaper, and more transparent settlement layer.

---

## 2. The Solution: MITHQAL

### 2.1 Overview

MITHQAL is a **settlement utility** that operates alongside existing banking infrastructure. It issues a fully reserved settlement unit (MTQ) backed by identifiable reserve assets.

**Value Flow (Text):**

Participant Deposit (Cash, Sukuk, Gold, Stablecoins)
  -->
Verification (Asset eligibility, custodian confirmation, Sharia screening)
  -->
Minting (MTQ issued at current NAV, fee 0.05%, reserve ratio checked)
  -->
Settlement (10-minute soft finality, 0.01% fee)
  -->
Redemption (MTQ burned, proportional reserves released, 0.05% fee)

### 2.2 Reserve Structure

| Tier | Asset Class | Target | Sharia Consideration |
|------|-------------|--------|----------------------|
| 1 | Central-Bank-Quality Cash | 40% | Sharia-compliant if not interest-bearing |
| 2 | Short-Duration Sovereign Securities / Sukuk | 35% | Sukuk preferred (asset-backed) |
| 3 | Allocated Physical Bullion (Gold >=99.5%, Silver >=99.9%) | 20% | Tangible assets, zakatable |
| 4 | Regulated Stablecoins | 5% (<=8% max) | Requires Sharia review |

**Principal Reserve (Tiers 1-3):** >=95% of total reserves.

---

## 3. Constitutional Governance

MITHQAL is governed by a **5-layer constitution**:

| Layer | Content | Status |
|-------|---------|--------|
| **0** | Institutional Philosophy, Identity, Values, Trust | ✅ Complete |
| **1** | Institutional Constitution (17 Articles) | ✅ Complete |
| **2** | Monetary Constitution (4 Invariants) | ✅ Complete |
| **3** | Policy Framework (8 Articles) | ✅ Complete |
| **4** | Technical Framework (8 Articles) | ✅ Complete |
| **5** | Operations (7 Articles) | ✅ Complete |

**4 Absolute Invariants (Non-Amendable):**

1. **100% Reserve Ratio** — Reserve Value >= Supply × NAV
2. **No Discretionary Minting** — Minting only upon verified deposit
3. **No Lending of Reserves** — No leverage, no fractional reserve
4. **No Commingling** — Yield assets never mix with settlement reserves

**Governance Bodies:**

- **Monetary Council** (7-15 members) — Primary decision-making
- **Risk Committee** (3-7) — Risk oversight
- **Technical Committee** (3-7) — Technical architecture & security
- **Audit Committee** (3-5) — Independent verification
- **Sharia Committee** (3+ scholars) — Binding rulings, annual certification

---

## 4. Monetary Engine

The Monetary Engine determines currency basket weights algorithmically:

| Component | Description | Frequency |
|-----------|-------------|-----------|
| **Structural Weight** | COFER (IMF) 50% + SWIFT Settlement Share 40% + BIS Liquidity 10% | Quarterly |
| **Bounded Momentum** | +/-5% cap on annual adjustment | Monthly |
| **Mean Reversion** | +/-2% cap on quarterly adjustment | Quarterly |
| **Shock Absorber** | 50-100% attenuation during high volatility (sigma>2%) | Real-time |
| **Liquidity Overlay** | +/-5% cap | Real-time |
| **Concentration Cap** | No single currency >60% | Real-time |
| **Minimum Floor** | No currency <0.5% (removed after 4 quarters) | Real-time |

**Key Properties:**

- Deterministic — identical inputs produce identical outputs
- Numeraire-independent — weights do not change with reporting currency
- Neutral — no political or jurisdictional adjustment

---

## 5. Technical Readiness

### 5.1 Smart Contracts

All protocol contracts are deployed and verified on **Monad Testnet** (Chain ID 10143). The on-chain footprint comprises **9 Protocol Smart Contracts**, **1 Safe Multi-Signature Treasury** (Gnosis Safe — not an ERC-20), and **1 Deployment Wallet** (EOA — not a contract). See [`docs/contracts/CONTRACT_REGISTRY.md`](contracts/CONTRACT_REGISTRY.md) for the authoritative registry.

**Protocol Smart Contracts (9):**

| # | Contract | Address | Purpose |
|---|----------|---------|---------|
| 1 | **MTQ.sol** | `0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD` | Settlement unit (ERC-20) |
| 2 | **Governance.sol** | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` | Council voting, timelocks |
| 3 | **Algorithm.sol** | `0x8839ce50e8D414005518769999c0A5b961D00CB2` | Monetary Engine |
| 4 | **Reserve.sol** | `0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177` | Reserve management |
| 5 | **Mint.sol** | `0x197e9CB28216dfe18a199b4c2930F74C2F460809` | Minting logic |
| 6 | **Redeem.sol** | `0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4` | Redemption logic |
| 7 | **Oracle.sol** | `0xDfcA66ac0450C9AB86307af1942E157C5A4DB713` | Data feed aggregation |
| 8 | **Takaful.sol** | `0x3eC27BB283644eF0A98B9961E9FBED0583a02f19` | Risk protection (mutual insurance) |
| 9 | **MockOracle.sol** | (test only) | Test oracle (testnet only) |

**Operational Governance (1):**

| # | Entity | Address | Type |
|---|--------|---------|------|
| 1 | Safe Multi-Sig Treasury | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` | Gnosis Safe (not an ERC-20) |

**Deployment (1):**

| # | Entity | Address | Type |
|---|--------|---------|------|
| 1 | Deployment Wallet | `0x3C3932F865892EFabE45892f453f81B64f6c8d8c` | EOA (not a contract) |

**Roles Configured:** DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE.

### 5.2 Formal Verification

- **Tool:** Certora Prover (same as Aave, Compound, US Treasury)
- **Status:** Certora specification completed. Formal verification execution pending.
- **12 constitutional invariants** specified in CVL
- **Foundry test suite exists (10 test files); test execution requires forge installation**
- **Slither static analysis:** results pending (tool not run in audit environment)
- **Halmos symbolic execution:** results pending (tool not run in audit environment)

### 5.3 Oracle Architecture

- **8 independent oracle families:** Chainlink, Pyth, Chronicle, RedStone, LBMA Direct Feed, Central Bank FX Feeds, Internal Pricing Committee, Constitutional Oracle (48-hour TWAP)
- **Consensus:** Medianization, 2% outlier exclusion, >=5 of 8 families, +/-5% validation
- **Fallback hierarchy:** Chainlink -> Pyth -> Chronicle -> RedStone -> LBMA -> Central Bank Feeds -> Internal Pricing Committee -> Constitutional Oracle

### 5.4 Security & Resilience

- **Multi-party computation (MPC):** 3 of 5 key shares
- **Hardware Security Modules (HSMs)**
- **Geographic distribution:** UAE, Singapore, UK
- **Geopolitical silos:** no single jurisdiction >30% of reserves (§Article XVII §12 binding cap)
- **Disaster Recovery:** RTO <=4 hours, RPO <=5 minutes
- **Bug Bounty:** $2,000,000 total reward pool (planned)

---

## 6. Sharia Compliance

### 6.1 Design Principle

Sharia compliance is embedded from the beginning, not an afterthought. MITHQAL has been designed with reference to AAOIFI standards.

### 6.2 Standards Mapping

| AAOIFI Standard | MITHQAL Design Reference | Status |
|-----------------|--------------------------|--------|
| No. 57 (Cryptocurrencies) | Fully reserved, asset-backed, not speculative | ✅ Aligned |
| No. 10 (Murabaha) | Asset-backed, no riba | ✅ Aligned |
| No. 13 (Musharakah) | Profit-sharing, loss-sharing | ✅ Aligned |
| No. 15 (Takaful) | Mutual risk-sharing | ✅ Aligned |
| No. 53 (Digital Assets) | Settlement infrastructure, not speculation | ✅ Aligned |
| General Sharia | No riba, no gharar, tangible assets | ✅ Aligned |

### 6.3 Current Status

- ✅ Sharia compliance request submitted to AAOIFI (31 July 2026)
- ✅ Independent Sharia Committee planned (minimum 3 scholars)
- ✅ Annual Sharia certification commitment
- ✅ Open to engagement with institutional Sharia scholars

---

## 7. Institutional Partnership Opportunities

### 7.1 Value Proposition for Banks & Financial Institutions

| Benefit | Description |
|---------|-------------|
| **Faster Settlement** | 10-15 minutes vs 1-3 days (modelled) |
| **Cost Reduction** | 90%+ reduction in transaction costs (modelled) |
| **Sharia Compliance** | Built-in framework with AAOIFI reference |
| **Transparency** | Real-time dashboard, daily proof of reserves |
| **Differentiation** | Early adopter positioning in Islamic fintech |

### 7.2 Collaboration Model

| Phase | Activity | Duration |
|-------|----------|----------|
| 1 | Introductory Meeting | Immediate |
| 2 | Technical Briefing | 1-2 weeks |
| 3 | Feasibility Assessment | 2-4 weeks |
| 4 | Sharia Engagement | 4-8 weeks |
| 5 | Pilot Design | 2-3 months |
| 6 | Pilot Execution | 3-6 months |

---

## 8. Current Status & Roadmap

### 8.1 Completed

- ✅ Constitution v19.0 (500+ pages, 5 Layers, 65 Sections)
- ✅ Smart contracts deployed and verified (9 Protocol Smart Contracts + 1 Safe Multi-Signature Treasury + 1 Deployment Wallet (EOA) on Monad Testnet)
- ✅ Certora specification completed (formal verification execution pending)
- ✅ Sharia review submitted to AAOIFI
- ✅ Live dashboard and open-source code
- ✅ Operating entity established (JOZOUR LLC, NJ, EIN 84-3470275)
- ✅ Legal outreach initiated (Romero, Schwartz, Kennedy)
- ✅ Institutional outreach initiated (Emirates Islamic, Standard Chartered, ADQ, Mubadala, IsDB)

### 8.2 In Progress

- ⏳ Awaiting responses: AAOIFI, legal contacts, institutional partners
- ⏳ Security audit preparation (materials ready)
- ⏳ Economic review (whitepaper – this document)

### 8.3 Next Milestones

| Phase | Milestone | Timeline |
|-------|-----------|----------|
| **Phase 3** | Complete External Validation | Q3 2026 |
| **Phase 4** | Mainnet Deployment | Q4 2026 |
| **Phase 4** | Institutional Onboarding | Q1 2027 |
| **Phase 4** | Public Launch | Q2 2027 |

---

## 9. Operating Entity & Legal Status

| Attribute | Detail |
|-----------|--------|
| Legal Name | JOZOUR LLC |
| State | New Jersey |
| Filing Number | 0600463904 |
| Formation Date | October 22, 2019 |
| IRS EIN | 84-3470275 |
| Registered Agent | Edward M Lombard |
| Address | 116 Mallory Ave, Jersey City, NJ 07304 |
| Status | Active |

**Note:** The MITHQAL Foundation (nonprofit) is **planned** to be formed as the
permanent constitutional entity. JOZOUR LLC is the current operating entity
and is **NOT** the Institution, the reserve owner, the reserve custodian, or
the constitutional authority. The future commercial structure (Holding
Company, Operations Ltd., Markets Ltd.) is also **planned** — none of these
entities exist today. See
[`docs/legal/institutional-principles.md`](legal/institutional-principles.md).

---

## 10. Supporting Documentation

| Document | Location |
|----------|----------|
| Constitution | `docs/constitution/` on GitHub |
| Technical Overview & Sharia Dossier | `docs/shariah/` on GitHub |
| Formal Verification Report | `docs/verification/` on GitHub |
| Live Dashboard | https://mithqal.vercel.app |
| GitHub Repository | https://github.com/MITHQALMTQ/mithqal |
| X (Twitter) | https://x.com/MithqalMTQ |

---

## 11. Contact

**Mohamed Eltonsy**
Founder & CEO
JOZOUR LLC (current operating entity for MITHQAL)
MITHQAL Foundation (planned)
meltonsy@icloud.com

---

*"The Institution exists. The Constitution defines it. The Framework implements it. Operations sustain it."*

---
