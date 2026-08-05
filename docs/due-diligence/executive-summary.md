# MITHQAL — Executive Summary

**For institutional reviewers: banks, regulators, sovereign wealth funds, independent auditors, central banks, BIS reviewers.**

**Document status:** ✅ AVAILABLE
**Last updated:** 2026-07-19
**Blueprint version:** v19 (Part 2 includes Article XVII Institutional Assurance Framework)

---

## What MITHQAL Is

MITHQAL is a **Constitutional Monetary Institution** — a neutral, fully-reserved settlement infrastructure that issues MTQ, a digital monetary unit backed 100%+ by a diversified reserve of central-bank-quality cash, short-duration sovereign securities, allocated physical bullion (gold and silver), and operational liquidity.

MITHQAL is governed by a **Constitutional Blueprint** of 50 articles across 5 layers:

- **Layer 1 — Institutional Constitution** (17 Articles): identity, mission, principles, governance, lifecycle
- **Layer 2 — Monetary Constitution** (17 Articles): invariants, reserves, monetary engine, bullion protection, risk engineering, model validation, LRR, reverse stress testing, stress laboratory, assumptions register, **institutional assurance framework**
- **Layer 3 — Policy Framework** (8 Articles): dynamic reserve ranges, fees, sanctions, tolerances, maturity, review cycles, physical redemption
- **Layer 4 — Technical Framework** (8 Articles): smart contracts, cryptography, oracles, interoperability, security, infrastructure, formal verification, disaster recovery
- **Layer 5 — Operations** (7 Articles): reserve management, transactions, participant services, compliance, technical operations, vendor management, documentation

## What MITHQAL Is Not

- **Not a bank** — does not take deposits or lend
- **Not a lending platform** — no lending of reserves, ever (constitutional invariant)
- **Not a payment processor** — does not process third-party payments
- **Not a marketplace** — no exchange or matching engine
- **Not a DeFi protocol** — no governance token, no yield farming, no speculative features
- **Not a speculative asset** — MTQ is a settlement unit, not an investment
- **Not a platform of any kind** — MITHQAL is an institution, not a platform

## The Five Constitutional Invariants

1. **100%+ reserve ratio** against PAR (face value) — proven on-chain
2. **No discretionary minting** — minting requires verifiable reserve receipt
3. **No lending of reserves** — reserves are held, never lent, pledged, or rehypothecated
4. **No commingling** — reserves are segregated and identifiable
5. **Bullion preservation** — Gold is Constitutional Strategic Capital; sold only as last resort under the Constitutional Liquidity Ladder

## Reserve Structure (4 Tiers)

| Tier | Asset | Policy Allocation |
|------|-------|-------------------|
| Tier 1 | Central-bank-quality cash | 35–45% |
| Tier 2 | Short-duration sovereign securities | 30–40% |
| Tier 3 | Allocated physical bullion (gold + silver) | 15–25% |
| Tier 4 | Operational liquidity (stablecoins) | 2–8% |

The Minimum Constitutional Buffer is **≥ 8% above Supply × PAR**, ratcheted upward only by the Constitutional Council on the basis of quantitative evidence.

## Key Assurance Properties

Per **Article XVII: Institutional Assurance Framework**:

- Every institutional claim is **classified by evidence level** (PROVEN / SUPPORTED / PARTIALLY SUPPORTED / PENDING EXTERNAL VALIDATION / UNVERIFIED / FALSE)
- No claim may be marked PROVEN without **live runtime evidence**
- No public statement may imply third-party certification, audit, or regulatory approval where none exists
- A permanent **Evidence Ledger** is maintained at `/docs/evidence/`
- A permanent **Smart Contract Registry** is maintained at `/docs/contracts/`
- A 15-criterion **Mainnet Readiness Framework** must be completed before mainnet deployment
- **Custodian diversification** is binding: maximum exposure per custodian ≤ 25%; per jurisdiction ≤ 30%; per vault ≤ 30%; per bank ≤ 25%

## Smart Contracts (9 Protocol Smart Contracts)

| Contract | Purpose |
|----------|---------|
| MTQ | ERC-20 token; mint/burn/transfer |
| Mint | Verifies reserve receipt, mints MTQ |
| Redeem | Burns MTQ, releases reserve |
| Reserve | Holds reserve invariant; tier accounting |
| Algorithm | Monetary engine (structural weighting, momentum, mean reversion, shock absorber) |
| Oracle | 8-family medianized price feed |
| Takaful | Mutual stabilization fund |
| Governance | Proposal/voting/timelock |
| (Specification) | Certora formal verification specification |

Formal verification: **12 invariants specified in Certora CVL (execution pending)**, supplemented by Foundry invariant tests (forge execution pending), Halmos symbolic execution (pending), and Slither static analysis (pending). All tool executions pending re-verification in an external audit environment.

## Independent Review Plan

| Track | Status |
|-------|--------|
| Big-4 Technology Risk Audit | PENDING EXTERNAL VALIDATION |
| Big-4 Financial Audit | PENDING EXTERNAL VALIDATION |
| Central Bank Technical Review | PENDING EXTERNAL VALIDATION |
| BIS Infrastructure Review | PENDING EXTERNAL VALIDATION |
| Formal Verification (Certora) | PARTIALLY SUPPORTED (12 invariants specified in CVL; execution pending; spec published) |
| Penetration Testing | PENDING EXTERNAL VALIDATION |
| Bug Bounty | IN PROGRESS (programme planned on Immunefi; max reward $2,000,000) |

**No claim of regulatory approval is made. No claim of Big-4 certification is made where none exists.**

## How to Review

1. Read this Executive Summary
2. Read the [Blueprint](../blueprint/blueprint.txt) (focus on Part 1 Articles I, II, III, VII, VIII; Part 2 Articles I, III, VI, X–XVII)
3. Review the [Architecture](architecture.md)
4. Inspect the Smart Contract Registry (`/docs/contracts/CONTRACT_REGISTRY.md`)
5. Examine the [Evidence Ledger](../evidence/EVIDENCE_LEDGER.md) (once published)
6. Review the [Stress Testing report](../verification/constitutional-stress-master-report.md)
7. Read the [Security Roadmap](security-roadmap.md), [Legal Roadmap](legal-roadmap.md), [Regulatory Roadmap](regulatory-roadmap.md), [Institutional Roadmap](institutional-roadmap.md)
8. Consult the [Risk Register](risk-register.md) and [FAQ](faq.md)

## One-Line Summary

**MITHQAL is a fully-reserved, Sharia-compliant, constitutionally-governed digital monetary institution designed for central banks, sovereign wealth funds, and global trade settlement — every claim it makes is evidence-classified, every rule it asserts is independently verifiable, and every assertion it publishes is supported by documentary evidence retained permanently in the Evidence Ledger.**

---

*For questions, consult the [FAQ](faq.md) or raise a query through the Institution's official channel.*
