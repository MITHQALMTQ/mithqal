# MITHQAL — Institutional Reviewer FAQ

**Document status:** ✅ AVAILABLE
**Last updated:** 2026-07-19
**Audience:** Banks, regulators, sovereign wealth funds, independent auditors, central banks, BIS reviewers

---

## About MITHQAL

### Q1. What is MITHQAL?

MITHQAL is a **Constitutional Monetary Institution** — a neutral, fully-reserved settlement infrastructure that issues MTQ, a digital monetary unit backed 100%+ by a diversified reserve of central-bank-quality cash, short-duration sovereign securities, allocated physical bullion (gold and silver), and operational liquidity.

### Q2. What is MTQ?

MTQ is the digital settlement unit issued by MITHQAL. Each MTQ is backed 100%+ by reserve assets. MTQ is **not** a speculative asset, **not** a governance token, and **not** a yield-bearing security. MTQ is a settlement unit designed for institutional use.

### Q3. What is the Constitutional Blueprint?

The Constitutional Blueprint is a 50-article specification (28,832 lines in v19) that defines the Institution's identity, monetary rules, policies, technical architecture, and operations. It is binding on all governance bodies, officers, employees, and contractors.

### Q4. Is MITHQAL a bank?

No. MITHQAL is **not a bank** — it does not take deposits, does not lend, and does not perform banking activities. MITHQAL is a monetary institution that issues a fully-reserved settlement unit.

### Q5. Is MITHQAL a DeFi protocol?

No. MITHQAL is **not a DeFi protocol** — it has no governance token, no yield farming, no speculative features. MITHQAL is an institution governed by a Constitution, not a protocol governed by token holders.

---

## Reserves & Backing

### Q6. What backs MTQ?

MTQ is backed 100%+ by a 4-tier reserve:

| Tier | Asset | Policy Allocation |
|------|-------|-------------------|
| Tier 1 | Central-bank-quality cash | 35–45% |
| Tier 2 | Short-duration sovereign securities | 30–40% |
| Tier 3 | Allocated physical bullion (gold + silver) | 15–25% |
| Tier 4 | Operational liquidity (stablecoins) | 2–8% |

Plus a Minimum Constitutional Buffer of ≥ 8% above Supply × PAR.

### Q7. How is the 100%+ reserve ratio proven?

The reserve ratio is proven by:

1. **On-chain Reserve.sol state** — publicly readable at any time
2. **Off-chain custodian attestations** — bank and bullion custodian statements
3. **Daily reconciliation** — automated and audited
4. **Independent audit** — by a Big-4 audit firm (planned)
5. **Formal verification** — Certora Prover verifies the reserve invariant

Per Article XVII §2, the claim "reserve ratio is 100%" is classified **PROVEN** because it is supported by live on-chain runtime evidence.

### Q8. Are reserves lent out or rehypothecated?

**No.** "No lending of reserves" is a constitutional invariant (Part 2 Article I). Reserves are held, never lent, pledged, or rehypothecated. This invariant is specified in the Certora CVL specification (formal verification execution pending).

### Q9. Are reserves commingled with the Institution's own funds?

**No.** "No commingling" is a constitutional invariant (Part 2 Article I). Reserve assets are segregated and identifiable.

### Q10. What happens under mass redemption pressure?

Under redemption pressure, the Constitution (Article X — Bullion Protection Rule) mandates a strict liquidation order:

1. Tier 4 stablecoins (first line of defence)
2. Tier 1 cash
3. Tier 2 sovereign securities
4. Tier 3 silver
5. Tier 3 gold — **only as last resort**

Gold is designated **Constitutional Strategic Capital** and is sold only when all other liquidity is exhausted. Each step is documented and entered into the Constitutional Assumptions Register.

### Q11. How is bullion protected against single-custodian failure?

Per Article XVII §12, custodian diversification is binding:

- Maximum exposure per custodian: ≤ 25%
- Maximum jurisdiction concentration: ≤ 30%
- Maximum bullion vault concentration: ≤ 30%
- Maximum banking concentration: ≤ 25%

The Institution targets at least 3 custodians, 3 jurisdictions, 3 vaults, and 3 banking institutions.

---

## Governance

### Q12. Who governs MITHQAL?

MITHQAL is governed by the **Constitutional Council**, supported by sub-committees:

- Monetary Council (monetary policy within constitutional ranges)
- Risk Committee (risk tolerance, stress testing oversight)
- Technical Committee (smart contract upgrades, infrastructure)
- Audit Committee (Evidence Ledger, audit oversight)
- Sharia Committee (Sharia compliance)

### Q13. Can the Constitution be amended?

Yes, but only under strict conditions (Part 1 Article XII — Amendment Philosophy):

- Amendments must preserve identity, invariants, stability, trust, and redeemability
- Constitutional Council supermajority required
- 48-hour timelock
- Public disclosure in the Constitutional Change Log
- Five-year independent review (Part 1 Article XVII)

The 5 absolute monetary invariants (Article I of Part 2) cannot be amended — they are unamendable.

### Q14. What is the founder succession plan?

MITHQAL is designed to outlive its founder (Part 1 Article IX). The Constitution establishes governance bodies, multi-Sig control, and succession procedures that do not depend on any single individual.

### Q15. How is governance protected against capture?

Multiple layers:

- Constitutional Supremacy (Part 1 Article III)
- Multi-Sig (3-of-5) on all operational authority
- 48-hour timelock on governance actions
- Constitutional Council supermajority for amendments
- Anti-Platform principle (Part 1 Article V)
- Five-year independent review (Part 1 Article XVII)
- Constitutional invariants are unamendable

---

## Technical & Security

### Q16. What blockchain does MITHQAL use?

MITHQAL deploys on Ethereum Mainnet, with Layer-2 deployments planned on Base and Arbitrum.

### Q17. How many smart contracts are there?

There are **9 Protocol Smart Contracts**:

1. MTQ (token)
2. Mint
3. Redeem
4. Reserve
5. Algorithm
6. Oracle
7. Takaful
8. Governance
9. (Formal verification specification)

Plus an Operational Governance contract (Safe Multi-Sig) and Deployment EOAs (no operational authority post-deployment). See the Smart Contract Registry at `/docs/contracts/CONTRACT_REGISTRY.md` (Task 13-a).

### Q18. Are the smart contracts formally verified?

Yes. 12 invariants are verified with the **Certora Prover**, supplemented by Halmos symbolic execution, Foundry testing, and Echidna fuzzing. See `/docs/verification/formal-verification-report.md`.

### Q19. Have the smart contracts been audited?

**Not yet.** Independent security audit (Track 2 of the [Security Roadmap](security-roadmap.md)) is **PENDING EXTERNAL VALIDATION**. Engagement is planned for Q3 2026.

Per Article XVII §1, the Institution does **not** claim "audited" status where no audit has been performed. The audit status is publicly disclosed as PENDING EXTERNAL VALIDATION.

### Q20. Is there a bug bounty?

A bug bounty programme is being established on **Immunefi**, with target maximum reward of **$2,000,000**. See [Security Roadmap](security-roadmap.md) Track 5.

### Q21. What is the oracle architecture?

8 independent oracle families: Chainlink, Pyth, Chronicle, RedStone, LBMA, Central Bank FX, Internal Committee, and Constitutional TWAP. Each publication includes 10 quality fields and is permanently recorded in the Constitutional Assumptions Register. See [Architecture](architecture.md) §2.2.

### Q22. Is MITHQAL post-quantum ready?

The current signing uses ECDSA. A post-quantum roadmap (Falcon-512, Lamport signatures for emergency) is in place. See `/home/z/my-project/foundry/POST-QUANTUM-ROADMAP.md`.

---

## Legal & Regulatory

### Q23. Is MTQ a security?

The Institution's analysis (and the expected conclusion of external counsel) is that MTQ is **not a security** — it is a digital commodity / digital settlement asset. However, this is a legal determination that varies by jurisdiction. The [Legal Roadmap](legal-roadmap.md) tracks jurisdiction-by-jurisdiction analysis.

### Q24. Is MITHQAL regulated?

MITHQAL's regulatory status varies by jurisdiction. The Institution is conducting jurisdiction-by-jurisdiction analysis (Legal Roadmap) and engaging with regulators (Regulatory Roadmap). **No claim of regulatory approval is made.** See [Regulatory Roadmap](regulatory-roadmap.md).

### Q25. Has any regulator approved MITHQAL?

**No.** Per Article XVII §1, no public statement shall imply regulatory approval where only engagement has occurred. Status of each regulator engagement is publicly disclosed in the Evidence Ledger.

### Q26. What AML/KYC obligations apply?

MITHQAL applies comprehensive KYC/KYB procedures, sanctions screening (OFAC, UN, EU), transaction monitoring, and SAR/STR filing per Part 5 Article IV. The Institution complies with applicable AML/CFT obligations in each operating jurisdiction.

### Q27. Is MITHQAL Sharia-compliant?

MITHQAL is designed for Sharia compliance from inception:

- No lending of reserves (constitutional invariant)
- No interest-bearing instruments in reserves (subject to ongoing review)
- Yield Separation principle (Part 2 Article VIII)
- Internal Sharia Committee (Part 3 Article II)
- External AAOIFI-certified scholar review (planned)

The claim "MTQ is Sharia-compliant" is currently classified **PARTIALLY SUPPORTED** — internal review complete; external scholar opinion PENDING EXTERNAL VALIDATION.

### Q28. In which jurisdictions will MITHQAL operate?

Initial target jurisdictions: United States, European Union, United Kingdom, United Arab Emirates, Singapore, Switzerland, Saudi Arabia, Bahrain, Malaysia. The Institution shall not operate in any jurisdiction where the legal classification of MTQ has not been established by external counsel.

---

## Assurance & Evidence

### Q29. How can I verify MITHQAL's claims?

Every claim is classified by evidence level (Article XVII §2):

- **PROVEN** — supported by live runtime evidence
- **SUPPORTED** — supported by independently reviewed documentary evidence
- **PARTIALLY SUPPORTED** — some components supported, others pending
- **PENDING EXTERNAL VALIDATION** — internal evidence, awaiting independent review
- **UNVERIFIED** — no evidence presented
- **FALSE** — claim demonstrated false, publicly retracted

Every claim has a corresponding entry in the Evidence Ledger (`/docs/evidence/EVIDENCE_LEDGER.md`). The Evidence Ledger is the single source of truth.

### Q30. What is the Evidence Ledger?

The Evidence Ledger is a permanent, immutable repository at `/docs/evidence/` containing every constitutional claim with: Claim ID, Blueprint Article, Implementation, Tests, Mathematical Proof, Runtime Verification, Status, Evidence Source, Evidence Date, Reviewer. See Article XVII §4.

### Q31. What is the Due Diligence Data Room?

The Due Diligence Data Room (this directory) is the canonical location for all documents required by institutional reviewers. It contains: Executive Summary, Blueprint, Whitepaper, Architecture, Smart Contract Registry, Reserve Framework, Governance, Mathematical Proofs, Evidence Ledger, Stress Testing, Security Roadmap, Legal Roadmap, Regulatory Roadmap, Institutional Roadmap, Risk Register, FAQ. See [README](README.md).

### Q32. What independent reviews are planned?

Per Article XVII §6:

1. Big-4 Technology Risk Audit
2. Big-4 Financial Audit
3. Central Bank Technical Review
4. BIS Infrastructure Review
5. Formal Verification (✅ partially complete — Certora, 12 invariants)
6. Penetration Testing
7. Bug Bounty (in progress)

### Q33. What is the Mainnet Readiness Framework?

A constitutional checklist (Article XVII §9) with 15 objective, evidence-based completion criteria that must be met before mainnet deployment:

1. Formal Verification
2. Independent Audit
3. Legal Opinion
4. Reserve Custody
5. Oracle Redundancy
6. Monitoring
7. Incident Response
8. Disaster Recovery
9. Business Continuity
10. Insurance
11. Operational Runbooks
12. Reserve Reconciliation
13. Custodian Agreements
14. Treasury Procedures
15. Multi-signature Procedures

**No item may be marked complete without documentary evidence.** See [Institutional Roadmap](institutional-roadmap.md).

---

## Operations

### Q34. How do I mint MTQ?

1. Complete KYC/KYB
2. Wire reserve assets (cash or accepted stablecoins) to Treasury
3. Treasury verifies receipt; Reserve.sol updates tiers
4. Mint.sol verifies reserve; MTQ.mint(to: participant)
5. On-chain mint event; daily reconciliation; transparency disclosure

### Q35. How do I redeem MTQ?

1. Submit redeem request
2. Redeem.sol burns MTQ
3. Reserve.sol releases tier assets (per Constitutional Liquidity Ladder)
4. Treasury executes release (wire / transfer / physical)
5. On-chain burn event; daily reconciliation; transparency disclosure

### Q36. Is physical redemption available?

Yes. Physical redemption of bullion is available per Part 3 Article VIII: minimum 1kg gold, premiums (1–2% processing, 1–3% delivery, 1–2% market).

### Q37. What are the fees?

Per Part 3 Article III:

- Minting: 0.05%
- Redemption: 0.05%
- Transfer: 0.01%
- Custody: 0.10% p.a.

---

## Why MITHQAL

### Q38. Why does the world need MITHQAL?

Existing monetary infrastructure has limitations: bank deposits carry counterparty risk (banks lend deposits), stablecoins have opaque reserves and single-point-of-failure custodians, and CBDCs are jurisdictionally limited. MITHQAL provides a neutral, fully-reserved, Sharia-compliant, constitutionally-governed settlement unit designed for central banks, sovereign wealth funds, and global trade.

### Q39. How is MITHQAL different from a stablecoin?

| Attribute | Stablecoin | MITHQAL |
|-----------|------------|---------|
| Reserve ratio | Often <100% or opaque | 100%+ (proven on-chain) |
| Reserve composition | Often single-asset (USD cash, T-bills) | 4-tier diversified (cash, sovereigns, bullion, stablecoins) |
| Governance | Often centralized corporate | Constitutional, multi-body |
| Lending of reserves | Often yes (rehypothecation) | No (constitutional invariant) |
| Bullion backing | Usually no | Yes (Tier 3) |
| Formal verification | Rare | Yes (Certora, 12 invariants) |
| Constitutional framework | No | Yes (50 articles) |

### Q40. How is MITHQAL different from a CBDC?

| Attribute | CBDC | MITHQAL |
|-----------|------|---------|
| Issuer | Central bank | Constitutional monetary institution |
| Jurisdiction | Single jurisdiction | Multi-jurisdiction (neutral) |
| Reserve | Central bank balance sheet | Diversified 4-tier reserve |
| Political alignment | Yes (sovereign) | No (institutionally neutral) |
| Cross-border | Limited | Designed for cross-border |

### Q41. What is the long-term vision?

MITHQAL is designed to endure for centuries — to outlive its founders, to weather financial crises, to adapt to technological change, and to remain a neutral, fully-reserved settlement infrastructure for global trade. The Constitution is designed for permanence; the Framework is designed for adaptability; the Operations are designed for excellence.

---

## Contact

For questions not covered here, contact the Constitutional Council through the Institution's official channel. For confidential documents (e.g., specific custodian agreements), NDA arrangements are available.

---

**This FAQ is maintained continuously. Last updated: 2026-07-19.**

## Related Documents

- [Executive Summary](executive-summary.md)
- [Blueprint](../blueprint/blueprint.txt)
- [Architecture](architecture.md)
- [Security Roadmap](security-roadmap.md)
- [Legal Roadmap](legal-roadmap.md)
- [Regulatory Roadmap](regulatory-roadmap.md)
- [Institutional Roadmap](institutional-roadmap.md)
- [Risk Register](risk-register.md)
- [README](README.md)
