# MITHQAL — Institutional Roadmap

**Document status:** ✅ AVAILABLE
**Last updated:** 2026-07-19
**Constitutional basis:** Blueprint Part 2 Article XVII §5 (Institutional Readiness Matrix), §6 (Independent Review Policy), §9 (Mainnet Readiness Framework)

---

## Overview

The MITHQAL Institutional Roadmap defines the path from current state to full institutional credibility. It is the operationalization of **Article XVII §5 (Institutional Readiness Matrix)** — a ten-dimension matrix tracking institutional maturity against objective, evidence-based criteria.

**Critical principle:** No dimension may be marked Complete or Verified without documentary evidence. No claim of institutional readiness may be made without citation to the Evidence Ledger.

---

## Ten Dimensions of Institutional Readiness

| # | Dimension | Current Status | Target |
|---|-----------|----------------|--------|
| 1 | Technical | IN PROGRESS | VERIFIED |
| 2 | Mathematical | SUBSTANTIALLY COMPLETE | VERIFIED |
| 3 | Security | PARTIALLY SUPPORTED | VERIFIED |
| 4 | Governance | IN PROGRESS | VERIFIED |
| 5 | Documentation | SUBSTANTIALLY COMPLETE | VERIFIED |
| 6 | Operational | IN PROGRESS | VERIFIED |
| 7 | Legal | IN PROGRESS | VERIFIED |
| 8 | Regulatory | NOT STARTED | VERIFIED |
| 9 | Commercial | NOT STARTED | VERIFIED |
| 10 | Institutional | NOT STARTED | VERIFIED |

Each dimension is tracked with: **Status**, **Evidence** (Evidence Ledger entries), **Owner**, **Next Milestone**, and **Blocking Items**. The Matrix is reviewed by the Constitutional Council at least quarterly.

---

## Dimension 1 — Technical

**Owner:** Technical Committee
**Status:** IN PROGRESS

### Scope

- Smart contract deployment (9 Protocol Smart Contracts)
- Oracle integration (8 families)
- Infrastructure (multi-cloud, multi-region)
- Monitoring (real-time)
- Disaster recovery (RTO/RPO tested)

### Evidence

- EV-014 (smart contract deployment on testnet — SUPPORTED)
- EV-015 (oracle integration — PARTIALLY SUPPORTED)
- EV-016 (monitoring — PENDING EXTERNAL VALIDATION)
- Certora formal verification reports (EV-031)
- Foundry test suite
- Disaster recovery test plan

### Next Milestone

Mainnet deployment of MTQ, Mint, Redeem, Reserve, Algorithm contracts — gated by Mainnet Readiness Framework (Article XVII §9).

### Blocking Items

- Independent security audit (Track 2 of [Security Roadmap](security-roadmap.md))
- Penetration testing (Track 4)
- Big-4 technology risk audit (Track 6)
- Mainnet Readiness Framework completion

---

## Dimension 2 — Mathematical

**Owner:** Risk Committee / Quantitative Analysis Team
**Status:** SUBSTANTIALLY COMPLETE

### Scope

- Invariant proofs (5 absolute invariants, 12 formally verified)
- Simulation validation (Monte Carlo, 100,000+ paths)
- Stress testing (20 Constitutional Stress Laboratory scenarios)
- Model validation (per Article XII)
- Assumptions register (per Article XVI)

### Evidence

- Mathematical Verification Report (`/docs/verification/mathematical-verification-report.md`)
- Constitutional Stress Master Report (`/docs/verification/constitutional-stress-master-report.md`)
- Formal Verification Report (`/docs/verification/formal-verification-report.md`)
- Constitutional Audit Report (`/docs/verification/constitutional-audit-report.md`)
- Math Audit Report (`/docs/verification/math-audit-report.md`)

### Next Milestone

Independent mathematical review by a qualified academic / research reviewer; then external audit by a Big-4 firm.

### Blocking Items

- None currently identified.

---

## Dimension 3 — Security

**Owner:** Technical Committee / Audit Committee
**Status:** PARTIALLY SUPPORTED

### Scope

- Formal verification (Certora — 12 invariants)
- Penetration testing
- Bug bounty (continuous on Immunefi)
- Independent security audit
- Big-4 technology risk audit

### Evidence

See [Security Roadmap](security-roadmap.md) for full track-by-track status.

### Next Milestone

Complete Tracks 2, 4, 5, 6 of the Security Roadmap.

### Blocking Items

- Audit budget approval
- Final contract freeze for audit window

---

## Dimension 4 — Governance

**Owner:** Constitutional Council
**Status:** IN PROGRESS

### Scope

- Constitutional Council established
- Sub-committees established (Monetary, Risk, Technical, Audit, Sharia)
- Multi-signature procedures (Safe Multi-Sig, 3-of-5)
- Escalation procedures
- Succession planning (per Part 1 Article IX)

### Evidence

- Governance charter (in Blueprint Part 1 Article VIII)
- Multi-Sig configuration (referenced in Smart Contract Registry)
- Succession plan (per Part 1 Article IX)
- Constitutional Change Log (`/docs/blueprint/constitutional-change-log.md`)

### Next Milestone

Formal establishment of all sub-committees with documented charters; first independent governance review.

### Blocking Items

- Constitutional Council member selection
- Sharia Committee composition (AAOIFI-certified scholars)

---

## Dimension 5 — Documentation

**Owner:** Constitutional Council / Documentation Team
**Status:** SUBSTANTIALLY COMPLETE

### Scope

- Blueprint (50 articles across 5 layers) — COMPLETE
- Whitepaper — COMPLETE
- Architecture document — COMPLETE
- Smart Contract Registry — PENDING (Task 13-a)
- Evidence Ledger — PENDING (Task 13-a)
- Due Diligence Data Room — COMPLETE (this directory)
- FAQ — COMPLETE

### Evidence

- Blueprint v19 (28,832 lines)
- Whitepaper (`/docs/whitepaper.md`)
- [Architecture](architecture.md)
- [Due Diligence Data Room](README.md)
- [FAQ](faq.md)

### Next Milestone

Publication of Smart Contract Registry and Evidence Ledger; verification that every constitutional claim has a corresponding Evidence Ledger entry.

### Blocking Items

- Task 13-a deliverables (Smart Contract Registry, Evidence Ledger)

---

## Dimension 6 — Operational

**Owner:** Operations Team
**Status:** IN PROGRESS

### Scope

- Custodian agreements executed
- Treasury procedures documented
- Daily reconciliation procedure documented and tested
- Operational runbooks (minting, redemption, rebalancing, custodian interaction, incident response)
- Incident response plan
- Business continuity plan

### Evidence

- Operational runbooks (planned)
- Reconciliation procedure (planned)
- Incident response plan (planned)

### Next Milestone

Execute custodian agreements with at least 3 custodians (per Article XVII §12 diversification targets); complete operational runbooks; test incident response.

### Blocking Items

- Custodian selection (in progress)
- Treasury signatory identification
- Operational team hiring

---

## Dimension 7 — Legal

**Owner:** Constitutional Council / Legal Committee
**Status:** IN PROGRESS

### Scope

See [Legal Roadmap](legal-roadmap.md) for the six-stage framework.

### Evidence

- Jurisdiction Analysis (Stage 1) — IN PROGRESS
- External Counsel (Stage 2) — IN PROGRESS
- Legal Opinion (Stage 3) — PENDING

### Next Milestone

Complete Stages 1–3 in 5 priority jurisdictions.

### Blocking Items

- Selection of priority jurisdictions
- Engagement of external counsel

---

## Dimension 8 — Regulatory

**Owner:** Constitutional Council
**Status:** NOT STARTED

### Scope

See [Regulatory Roadmap](regulatory-roadmap.md) for the engagement plan.

### Evidence

- No regulator engagements initiated yet

### Next Milestone

Initiate Phase 2 (Initial Engagement) of the Regulatory Roadmap following Legal Roadmap Stage 3.

### Blocking Items

- Legal Roadmap Stages 1–3 (must inform regulatory engagement approach)

---

## Dimension 9 — Commercial

**Owner:** Constitutional Council / Business Development
**Status:** NOT STARTED

### Scope

- Minting demand assessment
- Redemption demand assessment
- Liquidity provision (market makers)
- Partnerships (banks, exchanges, payment processors)
- Commercial launch plan

### Evidence

- Commercial plan (planned)

### Next Milestone

Develop commercial plan; identify anchor participants; establish market maker relationships.

### Blocking Items

- Mainnet deployment (commercial activity follows technical readiness)
- Legal Roadmap Stage 6 (Constitutional Review) confirming commercial model consistency with legal environment

---

## Dimension 10 — Institutional

**Owner:** Constitutional Council
**Status:** NOT STARTED

### Scope

Per Article XVII §6 (Independent Review Policy):

- Big-4 Technology Risk Audit — PENDING
- Big-4 Financial Audit — PENDING
- Central Bank Technical Review — PENDING
- BIS Infrastructure Review — PENDING
- Sovereign Wealth Fund / Large Allocator Review — PENDING

### Evidence

- No institutional reviews initiated yet

### Next Milestone

Engage Big-4 firms for technology risk and financial audits (Q4 2026); initiate Central Bank and BIS engagement (2027).

### Blocking Items

- All prior dimensions (1–9) must be Substantially Complete before institutional reviews commence
- Mainnet Readiness Framework (Article XVII §9) must be Complete

---

## Mainnet Readiness Framework (Article XVII §9)

The Mainnet Readiness Framework is the constitutional gate for mainnet deployment. **No mainnet deployment shall proceed until all items are Complete with documentary evidence.** No item may be marked complete without evidence.

The 15 criteria are:

1. Formal Verification — ✅ COMPLETE (Certora, 12 invariants)
2. Independent Audit — IN PROGRESS
3. Legal Opinion — IN PROGRESS
4. Reserve Custody — IN PROGRESS
5. Oracle Redundancy — IN PROGRESS (3 of 8 families integrated on testnet)
6. Monitoring — IN PROGRESS
7. Incident Response — IN PROGRESS
8. Disaster Recovery — IN PROGRESS
9. Business Continuity — IN PROGRESS
10. Insurance — NOT STARTED
11. Operational Runbooks — IN PROGRESS
12. Reserve Reconciliation — IN PROGRESS
13. Custodian Agreements — IN PROGRESS
14. Treasury Procedures — IN PROGRESS
15. Multi-signature Procedures — IN PROGRESS

The Constitutional Council must review and approve the Mainnet Readiness Framework before any mainnet deployment.

---

## Path to Full Institutional Readiness

| Phase | Timeline | Focus |
|-------|----------|-------|
| Phase 1 — Foundation | 2026 Q3 | Complete Blueprint v19; establish data room; complete documentation |
| Phase 2 — Verification | 2026 Q3–Q4 | Formal verification (✅); independent security audit; penetration testing |
| Phase 3 — Legal & Regulatory | 2026 Q4 – 2027 Q2 | Legal opinions; regulatory engagement; licensing assessment |
| Phase 4 — Operational | 2027 Q1–Q2 | Custodian agreements; treasury procedures; runbooks; insurance |
| Phase 5 — Mainnet Deployment | 2027 Q3 | Subject to Mainnet Readiness Framework completion |
| Phase 6 — Institutional Review | 2027 Q3 – 2028 Q1 | Big-4 audits; central bank review; BIS review |
| Phase 7 — Full Institutional Maturity | 2028+ | Continuous assurance; recurring audits; expanded jurisdiction footprint |

---

## Constitutional Reference

This roadmap operationalizes **Blueprint Part 2 Article XVII §5 (Institutional Readiness Matrix), §6 (Independent Review Policy), and §9 (Mainnet Readiness Framework)** of the MITHQAL Constitutional Blueprint v19.

## Related Documents

- [Legal Roadmap](legal-roadmap.md)
- [Regulatory Roadmap](regulatory-roadmap.md)
- [Security Roadmap](security-roadmap.md)
- [Risk Register](risk-register.md)
- [Architecture](architecture.md)
- [FAQ](faq.md)
- [Executive Summary](executive-summary.md)
