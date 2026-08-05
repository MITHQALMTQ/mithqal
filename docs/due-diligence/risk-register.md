# MITHQAL — Risk Register

**Document status:** ✅ AVAILABLE
**Last updated:** 2026-07-19
**Constitutional basis:** Blueprint Part 2 Article X (Bullion Protection Rule), Article XI (Constitutional Risk Engineering), Article XIV (Reverse Stress Testing), Article XV (Constitutional Stress Laboratory), Article XVII (Institutional Assurance Framework)

---

## Overview

This Risk Register identifies the top risks facing MITHQAL and the mitigations in place or planned. Risks are categorized by type, rated by likelihood and impact, and mapped to the constitutional provisions that mitigate them.

**Likelihood scale:** Low / Medium / High
**Impact scale:** Low / Medium / High / Existential
**Risk rating:** Likelihood × Impact (Low / Medium / High / Critical)

---

## Top Risks

### R-01 — Reserve Insolvency (Reserve ratio falls below 100%)

| Attribute | Value |
|-----------|-------|
| **Type** | Monetary / Reserve |
| **Likelihood** | Low |
| **Impact** | Existential |
| **Rating** | Critical |
| **Description** | The reserve value falls below Supply × PAR, breaching the constitutional invariant of 100%+ reserve ratio. |
| **Mitigations** | (1) Minimum Constitutional Buffer ≥ 8% (Part 2 Article X); (2) 4-tier diversified reserve (cash, sovereigns, bullion, stablecoins); (3) Constitutional Liquidity Ladder (Article X) ensures gold sold only as last resort; (4) Daily reserve reconciliation; (5) Independent audit of reserve ratio; (6) Formal verification of reserve invariant (Certora — 12 invariants); (7) Constitutional Stress Laboratory — 20 scenarios (Article XV); (8) Reverse stress testing to identify break-conditions (Article XIV); (9) Custodian diversification ≤ 25% per custodian (Article XVII §12). |
| **Residual risk** | Low — multiple layers of protection. |

---

### R-02 — Single Custodian Failure

| Attribute | Value |
|-----------|-------|
| **Type** | Operational / Custody |
| **Likelihood** | Low |
| **Impact** | High |
| **Rating** | High |
| **Description** | A custodian holding MITHQAL reserves fails, becomes insolvent, or is unable to return reserve assets. |
| **Mitigations** | (1) Custodian diversification ≤ 25% per custodian (Article XVII §12); (2) At least 3 custodians (target); (3) Allocated (not unallocated) bullion — segregated and identifiable; (4) Custodian due diligence; (5) Custodian audit rights; (6) Custody insurance; (7) Daily reconciliation. |
| **Residual risk** | Low — concentration limit caps maximum single-custodian loss at 25%. |

---

### R-03 — Single Jurisdiction / Sovereign Action

| Attribute | Value |
|-----------|-------|
| **Type** | Geopolitical / Sovereign |
| **Likelihood** | Medium |
| **Impact** | High |
| **Rating** | High |
| **Description** | A jurisdiction in which MITHQAL operates takes action (regulatory, sanctions, capital controls) that affects MITHQAL's ability to operate or access reserves. |
| **Mitigations** | (1) Jurisdiction diversification ≤ 30% per jurisdiction (Article XVII §12); (2) At least 3 jurisdictions (target); (3) Legal Roadmap jurisdiction-by-jurisdiction analysis; (4) Regulatory Roadmap engagement with multiple regulators; (5) Constitutional Adaptability (Part 1 Article XI); (6) No political, economic, or jurisdictional alignment (Part 1 Article IV — Institutional Neutrality). |
| **Residual risk** | Medium — sovereign risk is partially mitigated by diversification but cannot be fully eliminated. |

---

### R-04 — Oracle Manipulation / Failure

| Attribute | Value |
|-----------|-------|
| **Type** | Technical / Oracle |
| **Likelihood** | Low |
| **Impact** | High |
| **Rating** | High |
| **Description** | Oracle prices are manipulated or fail, leading to incorrect minting/redeeming or incorrect monetary engine inputs. |
| **Mitigations** | (1) 8 independent oracle families (Chainlink, Pyth, Chronicle, RedStone, LBMA, Central Bank FX, Internal Committee, Constitutional TWAP); (2) Medianized consensus with outlier exclusion; (3) 10 quality fields per publication (Price, Confidence, Quality, Missing Values, Volatility, Outlier Score, Data Freshness, Source Agreement, Reliability, Confidence Interval); (4) Circuit breakers on outlier detection; (5) Formal verification of oracle invariant; (6) Constitutional TWAP as on-chain fallback; (7) Oracle publications permanently recorded in Constitutional Assumptions Register. |
| **Residual risk** | Low — 8-family medianization with outlier exclusion is highly resilient. |

---

### R-05 — Smart Contract Vulnerability

| Attribute | Value |
|-----------|-------|
| **Type** | Technical / Smart Contract |
| **Likelihood** | Medium |
| **Impact** | High |
| **Rating** | High |
| **Description** | A vulnerability in a Protocol Smart Contract is exploited, leading to loss of funds or unauthorized minting. |
| **Mitigations** | (1) Formal verification (Certora — 12 invariants); (2) Halmos symbolic execution; (3) Foundry unit/integration/fuzz testing; (4) Echidna property-based fuzzing; (5) Independent security audit (Track 2 of Security Roadmap); (6) Penetration testing (Track 4); (7) Continuous bug bounty on Immunefi (max reward $2,000,000); (8) Multi-Sig (3-of-5) on all operational authority; (9) 48-hour timelock on governance actions; (10) Circuit breakers; (11) UUPS upgradeable proxy with constrained upgrade authority. |
| **Residual risk** | Low — multiple layers of verification, audit, and live monitoring. |

---

### R-06 — Governance Capture / Governance Failure

| Attribute | Value |
|-----------|-------|
| **Type** | Governance |
| **Likelihood** | Low |
| **Impact** | Existential |
| **Rating** | Critical |
| **Description** | Governance is captured by a malicious or incompetent actor, leading to unconstitutional actions. |
| **Mitigations** | (1) Constitutional Supremacy (Part 1 Article III — Decision Hierarchy); (2) Multi-Sig (3-of-5) on all operational authority; (3) 48-hour timelock on governance actions; (4) Constitutional Council supermajority for amendments (Part 1 Article XII); (5) Five-year independent review (Part 1 Article XVII); (6) Anti-Platform / No Constitutional Drift principle (Part 1 Article V); (7) Founder succession (Part 1 Article IX); (8) Constitutional invariants cannot be amended even by governance (Article I). |
| **Residual risk** | Low — constitutional invariants are unamendable. |

---

### R-07 — Liquidity Run (Mass Redemption)

| Attribute | Value |
|-----------|-------|
| **Type** | Liquidity |
| **Likelihood** | Medium |
| **Impact** | High |
| **Rating** | High |
| **Description** | A mass redemption event exceeds available liquidity, forcing asset fire-sales at unfavorable prices. |
| **Mitigations** | (1) Liquidity Readiness Ratio (LRR) ≥ 1.0, strong ≥ 1.2 (Article XIII); (2) 4-tier reserve with Tier 4 stablecoins and Tier 1 cash as first line of defence; (3) Constitutional Liquidity Ladder (Article X); (4) Stress testing under 20 scenarios (Article XV); (5) Reverse stress testing (Article XIV); (6) Daily LRR disclosure; (7) Takaful stabilization fund. |
| **Residual risk** | Medium — even with high LRR, extreme scenarios may force asset sales. |

---

### R-08 — Regulatory Enforcement / Misclassification

| Attribute | Value |
|-----------|-------|
| **Type** | Legal / Regulatory |
| **Likelihood** | Medium |
| **Impact** | High |
| **Rating** | High |
| **Description** | A regulator determines that MTQ is misclassified (e.g., should be a security, not a commodity), leading to enforcement action. |
| **Mitigations** | (1) Legal Roadmap — six-stage validation per jurisdiction; (2) External counsel opinions; (3) Proactive regulatory engagement (Regulatory Roadmap); (4) Constitutional Adaptability (Part 1 Article XI); (5) Jurisdiction diversification; (6) No operation in jurisdictions without established legal classification. |
| **Residual risk** | Medium — regulatory risk is partially mitigated but cannot be fully eliminated. |

---

### R-09 — AML / Sanctions Violation

| Attribute | Value |
|-----------|-------|
| **Type** | Compliance |
| **Likelihood** | Low |
| **Impact** | High |
| **Rating** | High |
| **Description** | MITHQAL is used for money laundering, terrorism financing, or sanctions evasion. |
| **Mitigations** | (1) KYC/KYB procedures for all participants (Part 5 Article IV); (2) Sanctions screening (OFAC, UN, EU); (3) Transaction monitoring; (4) SAR/STR filing; (5) Regulatory reporting; (6) Independent audit of compliance program. |
| **Residual risk** | Low — comprehensive compliance program. |

---

### R-10 — Sharia Non-Compliance Finding

| Attribute | Value |
|-----------|-------|
| **Type** | Sharia / Religious |
| **Likelihood** | Low |
| **Impact** | Medium |
| **Rating** | Medium |
| **Description** | A subsequent Sharia review identifies a non-compliance in the MITHQAL structure. |
| **Mitigations** | (1) Internal Sharia Committee (Part 3 Article II); (2) External AAOIFI-certified scholar review (planned); (3) Yield Separation principle (Part 2 Article VIII); (4) No lending of reserves (constitutional invariant); (5) No interest-bearing instruments in reserves (Tier 1 cash, Tier 2 short-duration sovereigns — analyzed for Sharia compliance); (6) Constitutional amendment if non-compliance identified (Part 1 Article XII). |
| **Residual risk** | Low — structure is designed for Sharia compliance from inception. |

---

### R-11 — Bullion Loss (Physical)

| Attribute | Value |
|-----------|-------|
| **Type** | Operational / Physical |
| **Likelihood** | Low |
| **Impact** | High |
| **Rating** | High |
| **Description** | Physical bullion is lost, stolen, or destroyed (fire, flood, theft, siege). |
| **Mitigations** | (1) Vault diversification ≤ 30% per vault (Article XVII §12); (2) At least 3 vaults (target); (3) Allocated (not unallocated) bullion — segregated and serialized; (4) Vault due diligence; (5) Physical bullion insurance; (6) Independent physical verification; (7) Daily reconciliation. |
| **Residual risk** | Low — diversification and insurance. |

---

### R-12 — Concentration in Banking Partner

| Attribute | Value |
|-----------|-------|
| **Type** | Banking / Counterparty |
| **Likelihood** | Low |
| **Impact** | High |
| **Rating** | High |
| **Description** | A banking partner holding Tier 1 cash or Tier 4 stablecoins fails, freezing operational liquidity. |
| **Mitigations** | (1) Banking diversification ≤ 25% per bank (Article XVII §12); (2) At least 3 banking institutions (target); (3) Use of systemically important banks; (4) Banking due diligence; (5) Daily reconciliation; (6) Banking insurance (where available). |
| **Residual risk** | Low — concentration limit caps maximum single-bank loss at 25%. |

---

### R-13 — Key Person Risk

| Attribute | Value |
|-----------|-------|
| **Type** | Operational / Personnel |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Rating** | Medium |
| **Description** | Loss of key personnel (founder, lead engineer, lead quant) disrupts operations. |
| **Mitigations** | (1) Founder succession plan (Part 1 Article IX); (2) Documentation (Blueprint, runbooks, Evidence Ledger); (3) Multi-person multi-Sig (3-of-5); (4) Committee-based governance (not single-person); (5) Business continuity plan; (6) Key-person insurance (planned). |
| **Residual risk** | Medium — documentation and committee governance reduce but do not eliminate key-person risk. |

---

### R-14 — Technological Obsolescence

| Attribute | Value |
|-----------|-------|
| **Type** | Technical / Long-term |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Rating** | Medium |
| **Description** | Technological change (e.g., post-quantum cryptography migration, blockchain migration) requires substantial re-engineering. |
| **Mitigations** | (1) Post-quantum roadmap (Falcon-512, Lamport signatures — emergency); (2) Predictably Adaptive principle (Part 1 Article VI); (3) Constitutional Adaptability (Part 1 Article XI); (4) Five-year independent review (Part 1 Article XVII); (5) Smart contract upgradeability (UUPS proxy). |
| **Residual risk** | Medium — long-term technological change is inevitable. |

---

### R-15 — Reputational Risk

| Attribute | Value |
|-----------|-------|
| **Type** | Reputational |
| **Likelihood** | Medium |
| **Impact** | High |
| **Rating** | High |
| **Description** | Negative publicity, misinformation, or association with controversial actors damages institutional credibility. |
| **Mitigations** | (1) Institutional Neutrality (Part 1 Article IV — no political, economic, or jurisdictional alignment); (2) Anti-Platform principle (Part 1 Article V); (3) Language Standards (Part 1 Article XVI — prohibiting hype); (4) Evidence Classification Standard (Article XVII §2 — preventing silent overstatement); (5) Transparency disclosures (Part 2 Article VII); (6) External Assurance Policy (Article XVII §1). |
| **Residual risk** | Medium — reputational risk is partially mitigated by institutional discipline. |

---

## Reverse Stress Testing (Article XIV)

In addition to the risk register above, the Institution conducts reverse stress testing per Article XIV to identify the break-conditions under which each risk materializes into failure. The reverse stress testing covers:

- Reserve failure (what shock causes reserve insolvency?)
- Liquidity failure (what redemption wave exceeds available liquidity?)
- Redemption failure (what conditions prevent redemption?)
- Collateral failure (what conditions impair Tier 2 sovereign securities?)
- Governance failure (what governance action would breach the Constitution?)
- Operational failure (what operational failure halts minting/redeeming?)
- Settlement failure (what conditions prevent settlement?)

Results are documented in the Constitutional Stress Master Report (`/docs/verification/constitutional-stress-master-report.md`) and recorded in the Constitutional Assumptions Register.

---

## Risk Governance

| Body | Role |
|------|------|
| Constitutional Council | Ultimate risk governance; approval of risk parameter changes |
| Risk Committee | Day-to-day risk management; risk tolerance setting |
| Audit Committee | Independent risk oversight; Evidence Ledger governance |
| Technical Committee | Technical risk management; security operations |
| Sharia Committee | Sharia risk oversight |

The Risk Register is reviewed at least quarterly by the Risk Committee and at least annually by the Constitutional Council.

---

## Constitutional Reference

This Risk Register operationalizes multiple constitutional provisions:

- **Part 2 Article X** — Bullion Protection Rule (R-01, R-07, R-11)
- **Part 2 Article XI** — Constitutional Risk Engineering (all risks)
- **Part 2 Article XII** — Constitutional Model Validation Framework (R-01, R-04, R-05)
- **Part 2 Article XIII** — Liquidity Readiness Ratio (R-07)
- **Part 2 Article XIV** — Reverse Stress Testing (all risks)
- **Part 2 Article XV** — Constitutional Stress Laboratory (all risks)
- **Part 2 Article XVII §12** — Operational Assurance Framework concentration limits (R-02, R-03, R-11, R-12)
- **Part 4 Article V** — Security (R-05)
- **Part 1 Article III** — Decision Hierarchy (R-06)
- **Part 1 Article IV** — Institutional Neutrality (R-15)
- **Part 1 Article V** — Anti-Platform / No Constitutional Drift (R-15)
- **Part 1 Article IX** — Founder Succession (R-13)
- **Part 1 Article XI** — Regulatory Adaptability (R-08, R-14)
- **Part 5 Article IV** — Compliance Execution (R-09)

## Related Documents

- [Executive Summary](executive-summary.md)
- [Architecture](architecture.md)
- [Security Roadmap](security-roadmap.md)
- [Legal Roadmap](legal-roadmap.md)
- [Regulatory Roadmap](regulatory-roadmap.md)
- [Institutional Roadmap](institutional-roadmap.md)
- [FAQ](faq.md)
- Constitutional Stress Master Report: `/docs/verification/constitutional-stress-master-report.md`
- Mathematical Verification Report: `/docs/verification/mathematical-verification-report.md`
