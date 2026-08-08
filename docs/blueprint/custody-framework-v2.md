# MITHQAL Constitutional Custody Framework v2.0

**Document Date:** 2026-08-09
**Author:** Chief Constitutional Engineer / Institutional Infrastructure Architect / Interoperability Architect (acting in concert)
**Status:** CONSTITUTIONAL AMENDMENT PROPOSAL — pending Council ratification
**Authority:** §Article III (Reserve Principles), §Article IV (Monetary Metals), §Article XVII §12 (Operational Assurance Framework) of the MITHQAL Constitution
**Supersedes:** The flat (non-tiered) "Approved Custodian Banks" model described in `docs/legal/institutional-boundaries.md` and `src/lib/multi-custodian.ts` (which remain in force until this framework is ratified and operationally implemented)

---

## 0. Executive Summary

This document introduces a **tiered custody architecture** for MITHQAL's reserve assets. The existing flat multi-custodian fleet (where every approved custodian is treated as an equal peer) is preserved as the operational baseline, but a constitutional **custodian tier hierarchy** is layered on top to express institutional preference, eligibility, and risk seniority.

The framework is designed to make MITHQAL **eligible for central-bank / official-sector custody** — not to assume that a central bank will agree to custody MITHQAL reserves. A central bank cannot simply act as a private project's vault because MITHQAL asks it to. Its statutory mandate, laws, eligibility rules, balance-sheet treatment, and custody policies determine whether that relationship is permissible.

> **MITHQAL's Constitutional Reserve Framework is designed to permit custody by central banks, monetary authorities, BIS-type institutions, or other approved institutional custodians where legally authorized and contractually available.**

This is the institutional-grade formulation. It does not designate any central bank as a custodian. Each institution must separately approve the relationship.

---

## 1. Architectural Purpose

The objective is not merely to make MTQ functional, but to make it **institutionally defensible** to banks, regulators, central banks, auditors, and sovereign institutions. The strongest architecture is **institutional-grade, independent, multi-jurisdictional custody**, with central banks treated as a potential future class of official custodians where they are legally willing and eligible to provide the service.

### Design Principles

1. **Central-bank custody where actually available** — Tier 1 (official-sector) is the highest-trust target, where legally available.
2. **Tier-1 global bank custody as the practical backbone** — Tier 2 (regulated institutional custodians) is the primary practical institutional route.
3. **Independent vaults for geographic redundancy** — Tier 3 (specialized precious-metals custodians) provides geographic diversification.
4. **Allocated, identifiable physical bullion** — for physical gold and silver, allocated ownership with individually identifiable bars is the highest-quality reserve form.
5. **Multiple jurisdictions** — no single jurisdiction may hold more than 30% of total reserves (per §Article XVII §12).
6. **Independent reserve verification** — quarterly independent audit, daily cryptographic Proof of Reserves.
7. **Public bar-level reserve reporting** where legally and operationally appropriate.
8. **No operating-company ownership of reserves** — JOZOUR LLC (and any future operating entity) is completely outside the reserve ownership/custody chain.
9. **No Foundation custody of reserves** — the Mithqal Foundation provides oversight; it does not own or custody the metal.
10. **No single custodian capable of unilaterally controlling the system** — the 25% per-custodian cap (§Article XVII §12) is preserved and extended to all tiers.

---

## 2. The Custody Tier Hierarchy

MITHQAL's Constitution supports a **four-tier custody hierarchy**. The tiers express institutional preference and risk seniority — they are not a mandate that any specific tier must be used. The Constitution requires **independent, segregated, legally enforceable custody by an approved custodian**; it then states that **official-sector custody is the preferred highest institutional custody tier where legally available**.

This ensures MITHQAL does not become impossible to operate because one central bank says no. If no central bank is willing or eligible to custody MITHQAL reserves, the framework falls back to Tier 2 (regulated institutional custodians), which is fully sufficient for constitutional compliance.

```text
                 MITHQAL CONSTITUTION
                         │
                         ▼
          INDEPENDENT CONSTITUTIONAL
                   FOUNDATION
                         │
                CONSTITUTIONAL
                   OVERSIGHT
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
 OFFICIAL-SECTOR / CENTRAL       QUALIFIED INSTITUTIONAL
 BANK CUSTODIAN                   CUSTODIAN
 (where legally eligible)        (fallback / diversification)
 (Tier 1)                        (Tiers 2–4)
          │                             │
          └──────────────┬──────────────┘
                         ▼
              SEGREGATED RESERVE
                     CUSTODY
                         │
       ┌─────────┬───────┼────────┬─────────┐
       ▼         ▼       ▼        ▼         ▼
     GOLD     SILVER    CASH     SUKUK    OTHER
                                      APPROVED ASSETS
```

### Tier 1 — Official-Sector Custody

**Definition:** Custody by a central bank, monetary authority, BIS-type institution, or other official-sector institution authorized under applicable law to provide custody, safekeeping, settlement, or reserve-management services.

**Institutional preference:** Highest. Tier 1 is the preferred custody tier where legally available.

**Eligibility:** See §3 below (Official Reserve Custodian class). Critically, MITHQAL does not automatically designate any central bank as a custodian. Each institution must separately approve the relationship.

**Concentration cap:** Subject to the 25% per-custodian cap (§Article XVII §12). No central bank may hold more than 25% of total reserves, even if legally eligible.

**Examples (illustrative — not designations):**
- Bank for International Settlements (BIS) — distinguishes allocated/earmarked gold custody, where the depositor retains beneficial ownership and the specific bars are identified.
- Federal Reserve Bank of New York — explicitly limits its gold-vault customers to governments, central banks, and official international institutions, excluding private-sector entities. MITHQAL would need to qualify as an eligible official/institutional customer, which is not realistic in the near term.
- Bank of England — primarily provides gold accounts to central banks; can consider certain commercial firms under specific criteria.
- Central Bank of the UAE (CBUAE) — its rulebook expressly gives it powers including purchasing, selling, and taking gold and precious metals into custody, as well as maintaining accounts for banks, monetary authorities, and financial institutions.
- Saudi Central Bank (SAMA) — subject to eligibility and regulatory approval.

**Important caveat:** The fact that a central bank may be an excellent custodian for official reserve institutions does not mean it will accept custody for a private/project entity. MITHQAL must not represent any central bank as a custodian until that institution actually agrees to the role.

### Tier 2 — Regulated Institutional Custodians

**Definition:** Custody by a systemically important bank, major regulated international bank, or specialized institutional custodian.

**Institutional preference:** Primary practical institutional route. This is the backbone of MITHQAL's custody architecture in the operational phase.

**Eligibility:** Must satisfy all 12 eligibility criteria in §4 below. Must be a regulated institution in good standing in its home jurisdiction.

**Concentration cap:** 25% per custodian (§Article XVII §12); 25% per banking institution (§Article XVII §12).

**Examples (illustrative — not designations):**
- J.P. Morgan — large global custody infrastructure; reports custody coverage across 50 markets; established gold custodian (SEC-filed documentation identifies JPMorgan as custodian for allocated gold bullion).
- HSBC — one of the world's largest precious-metals custodians; provides trading, financing, vaulting, and physical-metal services across major markets including London, New York, and Hong Kong.
- BNY Mellon — major institutional custodian (referenced in investor due-diligence simulation).
- State Street — major institutional custodian (referenced in default fleet and investor simulation).
- UBS — Swiss custody (referenced in default fleet).
- Deutsche Bank — Frankfurt custody (referenced in default fleet as backup).

### Tier 3 — Specialized Precious-Metals Custodians / Vaults

**Definition:** Custody by an independent institutional precious-metals vault or specialized bullion custodian.

**Institutional preference:** Geographic diversification and physical-bullion specialization. Tier 3 is the primary tier for allocated physical gold and silver.

**Eligibility:** Must satisfy all 12 eligibility criteria in §4 below. For bullion, must be an LBMA-registered vault operator (per existing §Article IV requirements).

**Concentration cap:** 30% per vault (§Article XVII §12).

**Examples (illustrative — not designations):**
- Brink's — global bullion vault operator (referenced in default fleet and Vendor Management examples).
- Loomis — global bullion vault operator (referenced in default fleet).
- Malca-Amit — global bullion vault operator, Singapore presence (referenced in default fleet).

### Tier 4 — Contingency Custodian

**Definition:** A pre-approved replacement institution that can be activated if a Tier 1, 2, or 3 custodian becomes unavailable, compromised, or fails.

**Institutional preference:** Operational resilience. Tier 4 is not used for primary custody; it is a contingency facility.

**Eligibility:** Must satisfy all 12 eligibility criteria in §4 below. Must be pre-approved by the Constitutional Council before activation.

**Concentration cap:** 0% in normal operations (Tier 4 custodians do not hold reserves unless activated). Upon activation, the 25% per-custodian cap applies.

**Activation trigger:** Custodian failure (per §Article XV Disaster Recovery, Scenario #10), custodian compromise, or regulatory event requiring substitution. The Constitution's 7-day Recovery Time Objective (RTO) for custodian substitution applies.

---

## 3. The Official Reserve Custodian Class

The Constitution defines a new eligibility class:

> **Official Reserve Custodian** — An eligible central bank, monetary authority, international financial institution, or other official-sector institution authorized under applicable law to provide custody, safekeeping, settlement, or reserve-management services.

### Key Rules

1. **No automatic designation.** MITHQAL does not automatically designate any central bank as a custodian. Each institution must separately approve the relationship.
2. **Legal eligibility required.** The institution must have statutory authority to provide custody to MITHQAL. Many central banks (e.g., NY Fed) explicitly limit their customers to governments, central banks, and official international institutions, excluding private-sector entities.
3. **Contractual availability required.** Even if legally eligible, the institution must contractually agree to the MITHQAL custody arrangement, including the constitutional requirements (segregation, no rehypothecation, independent audit, etc.).
4. **No marketing claim without agreement.** MITHQAL must not represent any central bank as a custodian until that institution actually agrees to the role. The dashboard may show "Reserve Custody: Official-Sector Custodian" only when that is actually true and independently documented.
5. **Tier 1 is preferred, not mandatory.** The Constitution does not require central-bank custody. It requires independent, segregated, legally enforceable custody by an approved custodian. Official-sector custody is the preferred highest institutional custody tier where legally available.

### Why This Class Matters

Central-bank custody of gold is not conceptually unusual. The BIS's own legal framework expressly contemplates accepting custody of gold for central banks, and BIS describes gold safekeeping and settlement services for central-bank customers. The BIS also distinguishes allocated/earmarked gold custody, where the depositor retains beneficial ownership and the specific bars are identified.

For Egypt specifically, the CBE states that Egypt's official international reserves include gold, foreign-currency assets, deposits, securities, and SDRs, and that reserves are managed according to safety, liquidity, and return principles. The CBE and Afreximbank announced a 2025 MoU for a proposed pan-African Gold Bank ecosystem involving secure vaulting facilities, an internationally accredited refinery, and financial/trading services. The concept is therefore not strange to the institutional environment.

**However**, the CBE currently manages Egypt's official national international reserves. That does not mean the CBE would be legally able or willing to custody a private project's reserves. MITHQAL must not put forward "The Central Bank of Egypt will be our custodian." Instead, MITHQAL's Constitutional Reserve Framework is designed to permit custody by central banks, monetary authorities, BIS-type institutions, or other approved institutional custodians where legally authorized and contractually available.

---

## 4. Custodian Eligibility Requirements

A custodian at any tier must satisfy **all 12 eligibility criteria** below. These are constitutional requirements — no custodian may be approved without meeting every criterion.

| # | Criterion | Requirement | Verification |
|---|---|---|---|
| 1 | **Legal authority** | The institution must have statutory authority to provide custody services to MITHQAL. | Legal opinion from a qualified law firm in the custodian's home jurisdiction. |
| 2 | **Regulatory authorization** | The institution must hold all required licenses, registrations, and regulatory approvals to operate as a custodian. | Regulatory license verification; ongoing monitoring of license status. |
| 3 | **Institutional standing** | The institution must be a recognized institutional custodian (central bank, systemically important bank, specialized vault, or other approved institution). | Independent industry ranking (e.g., Fitch, S&P, Moody's); minimum credit rating of A- or equivalent for Tier 2; LBMA registration for Tier 3 bullion custodians. |
| 4 | **Segregation capability** | The institution must be able to hold MITHQAL reserve assets in segregated accounts, bankruptcy-remote from the custodian's own assets. | Custody agreement must specify allocated, segregated custody; legal opinion confirming bankruptcy-remote status. |
| 5 | **Operational resilience** | The institution must demonstrate operational resilience (business continuity, disaster recovery, cyber security, physical security for vaults). | SOC 2 Type II report (or equivalent); ISO 27001 certification for information security; independent operational resilience assessment. |
| 6 | **Auditability** | The institution must permit independent audit of MITHQAL reserve assets held in its custody. | Custody agreement must grant MITHQAL (and its independent auditors) audit rights; quarterly audit cycle. |
| 7 | **AML/CFT requirements** | The institution must comply with all applicable anti-money-laundering and counter-financing-of-terrorism requirements. | AML/CFT policy review; ongoing sanctions screening. |
| 8 | **Sanctions compliance** | The institution must implement sanctions screening consistent with MITHQAL's sanctions policy. | Sanctions screening procedures review; OFAC/UN/EU sanctions list screening. |
| 9 | **Reporting capability** | The institution must be able to report holdings, transactions, and custody attestations to MITHQAL on a daily basis. | Custody agreement must specify daily reporting; API or SWIFT MT54x/ISO 20022 reporting capability. |
| 10 | **Disaster recovery** | The institution must have a documented and tested disaster recovery plan. | DR plan review; annual DR test results. |
| 11 | **Independent verification** | The institution must permit independent third-party verification of reserve assets (physical bar counts for bullion, account confirmations for cash). | Custody agreement must grant MITHQAL (and its independent verifiers) verification rights; annual physical bar count for bullion. |
| 12 | **Contractual enforceability** | The custody arrangement must be governed by a legally enforceable contract that includes all constitutional requirements (segregation, no rehypothecation, audit rights, withdrawal rights, substitution rights). | Legal opinion confirming enforceability under the governing law. |

### Critical Rule

> **MITHQAL does not automatically designate any central bank as a custodian. Each institution must separately approve the relationship.**

The 12 eligibility criteria apply equally to all tiers. A central bank (Tier 1) must satisfy the same criteria as a regulated bank (Tier 2) or a specialized vault (Tier 3). The tier classification expresses institutional preference, not a relaxation of eligibility requirements.

---

## 5. Physical Gold Custody Requirements

For physical gold, MITHQAL requires **allocated ownership with individually identifiable bars**, rather than simply "MITHQAL owns X dollars of gold."

### Allocation Hierarchy

```text
Custodian
    ↓
MITHQAL Reserve Custody Account
    ↓
Allocated Gold
    ↓
Bar/lot identification (serial number)
    ↓
Weight
    ↓
Purity (≥99.5% for gold, ≥99.9% for silver — LBMA Good Delivery standard)
    ↓
Assay (independent refiner certificate)
    ↓
Vault location (specific vault, specific compartment)
    ↓
Independent verification (quarterly physical bar count)
```

### Constitutional Requirements for Physical Gold

These requirements are **already established** in §Article IV (Monetary Metals) of the existing Constitution and are reaffirmed by this framework:

1. **Allocated physical custody** — the customer (MITHQAL) retains title to specific bars, not merely a claim against the custodian.
2. **Segregated from custodian assets** — no commingling with the custodian's own assets or other clients' assets.
3. **No commingling** — each bar is identified and accounted for separately.
4. **No rehypothecation or lending** — the custodian may not lend, pledge, or rehypothecate the gold.
5. **Independent verification** — quarterly physical bar count by an independent verifier.
6. **LBMA Good Delivery standard** — gold bars must meet the LBMA Good Delivery standard (≥99.5% purity, unique serial numbers).
7. **London Good Delivery bars preferred** — per the World Gold Council's 2026 central-bank survey, London Good Delivery bars are the preferred option when purchasing and holding physical gold.

### ETF / Paper Gold Treatment

**ETF/stock-market gold is NOT treated as equivalent to physical allocated gold.**

The Constitution (§Article IV) explicitly prohibits:
- Gold/silver derivatives
- Gold/silver futures
- Gold ETFs
- Unallocated gold claims
- Gold certificates (unless fully backed and independently verified)

ETF/stock-market gold may potentially be a liquidity/investment sleeve, if the Constitution permits it, but it is **not counted 1:1 as MITHQAL's core physical-metal reserve**. The highest reserve integrity is allocated Good Delivery Gold; ETFs are explicitly subordinated.

### Bank of England Benchmark

The Bank of England's model is a useful benchmark: allocated gold means the customer retains title to specific bars rather than merely having a claim against the custodian. The BIS's description of allocated gold is exactly the kind of conceptual custody model MITHQAL adopts: the depositor retains beneficial ownership and the specific bars are identified.

---

## 6. Reserve Integrity Hierarchy

The custody framework establishes a **reserve integrity hierarchy** — the quality ranking of reserve asset forms from highest integrity to lowest:

```text
Highest reserve integrity
  ↓
Allocated Good Delivery Gold (LBMA-standard, individually identifiable bars)
  ↓
Allocated Silver (LBMA-standard, individually identifiable bars)
  ↓
Cash / high-quality liquid reserves (central-bank-quality, Tier 1 reserve asset)
  ↓
Eligible Sukuk (Sharia-compliant sovereign bonds, Tier 2 reserve asset)
  ↓
Other constitutionally approved reserve assets (Tier 4 operational liquidity — regulated stablecoins)
  ↓
Lowest reserve integrity (still constitutionally permitted, but not equivalent to physical allocated bullion)
```

### Key Rules

1. **Allocated physical bullion is the highest-quality reserve form.** It is not equivalent to ETF or paper gold.
2. **Central banks predominantly manage gold separately from other reserve assets** (per the World Gold Council's 2026 survey). MITHQAL follows this practice — gold and silver are managed as Tier 3 reserve assets, separate from Tier 1 cash and Tier 2 sovereign securities.
3. **London Good Delivery bars are the preferred option** when purchasing and holding physical gold.
4. **ETF/stock-market gold is not counted 1:1 as core physical-metal reserve.** It may serve as a liquidity sleeve if the Constitution permits, but it does not satisfy the Tier 3 allocated-bullion requirement.

---

## 7. Custody Tier ↔ Reserve Asset Mapping

Each reserve asset class is mapped to one or more custodian tiers. This mapping is illustrative — the actual custodian selection depends on eligibility, availability, and contractual agreement.

| Reserve Asset Class | Constitutional Tier | Permitted Custodian Tiers | Preferred Tier | Notes |
|---|---|---|---|---|
| Cash (central-bank-quality) | Tier 1 | Tier 1 (central bank), Tier 2 (regulated bank) | Tier 1 if available, else Tier 2 | Central-bank custody (e.g., NY Fed) is the highest-trust target for cash; regulated bank custody (e.g., JPMorgan) is the practical route. |
| Sovereign Securities (incl. Sukuk) | Tier 2 | Tier 2 (regulated bank / CSD) | Tier 2 | Held at a CSD (e.g., DTCC, Euroclear) via a regulated bank custodian. |
| Allocated Physical Gold | Tier 3 | Tier 1 (central bank), Tier 2 (bullion bank), Tier 3 (specialized vault) | Tier 1 if available, else Tier 3 | Bank of England or BIS for official-sector; Brink's/Loomis/Malca-Amit for specialized vault. |
| Allocated Physical Silver | Tier 3 | Tier 2 (bullion bank), Tier 3 (specialized vault) | Tier 3 | Specialized vault is the primary tier for silver. |
| Operational Liquidity (stablecoins) | Tier 4 | Tier 2 (regulated custodian), specialized digital-asset custodian | Tier 2 | Regulated stablecoin issuers (Circle, Tether, MakerDAO) via a regulated custodian. |

### Liquidation Order (Preserved)

The Constitutional Liquidation Order (§Article X — Bullion Protection Rule) is preserved unchanged:

```text
Tier 4 (stablecoins) → Tier 1 (cash) → Tier 2 (sovereign) → Tier 3 (silver) → Tier 3 (gold, LAST)
```

Gold is **Constitutional Strategic Capital** — it may only be liquidated when all superior tiers are exhausted. This rule is independent of the custodian tier hierarchy.

---

## 8. Geographic Diversification Strategy

MITHQAL pursues geographic diversification across **five regions** to eliminate single-jurisdiction concentration risk. The constitutional cap (§Article XVII §12) is 30% per jurisdiction; the operational target is more conservative.

Detailed strategy is documented in `docs/architecture/geographic-custody-strategy.md`. Summary:

| Region | Primary Targets | Practical Layer | Physical Layer | Strategic Note |
|---|---|---|---|---|
| 🇺🇸 United States | NY Fed (long-term official possibility) | JPMorgan / equivalent | Brink's / Loomis US vaults | NY Fed excludes private-sector entities; JPMorgan is the practical route. |
| 🇬🇧 Europe / London | Bank of England | HSBC / JPMorgan | Independent London vaults | Bank of England is the most popular gold-vaulting location (57% of WGC 2026 survey respondents). |
| 🇦🇪 UAE | CBUAE (strategic/official possibility) | Major UAE bank | Independent UAE vault | CBUAE rulebook expressly permits gold custody. Important for MITHQAL's institutional positioning. |
| 🇸🇦 Saudi Arabia | SAMA (subject to eligibility) | Major Saudi institutional bank | Internationally recognized KSA vault | Do not put a particular Saudi commercial bank into the constitutional blueprint as "the custodian" — select after due diligence. |
| 🌏 Asia (Singapore + Hong Kong) | — | Major international bank custody | Singapore / Hong Kong vaults | HSBC identifies Hong Kong, London, and New York among its principal precious-metals centres. |

### Constitutional Geographic Caps (Preserved + Clarified)

The existing §Article XVII §12 caps are preserved:
- **Maximum 30% per jurisdiction** (binding)
- **At least 3 jurisdictions**, with no single jurisdiction holding more than 30% and the top 2 jurisdictions holding no more than 60% combined
- **Tier 3 bullion special rule**: held in vaults across three jurisdictions, with no single jurisdiction holding more than 8% of total reserves

> **Defect identified during audit:** The current Constitution has conflicting concentration thresholds — 25% in §Article XVII §12, 30% in Article V Credit Risk, 40% in Article V intro and Article I, and 40% in `whitepaper.md`. **This framework adopts the 25% per-custodian / 30% per-jurisdiction binding cap from §Article XVII §12 as the authoritative number** and recommends a constitutional cleanup pass to reconcile the others. See §11 below.

---

## 9. The Custody Trust Proposition

This framework changes the MTQ trust proposition from a simple "we have gold backing" to an institutional-grade, multi-layered verification chain:

```text
Constitution
  → independent oversight (Foundation)
  → independent custody (tiered custodian hierarchy)
  → identified reserve assets (allocated, bar-level)
  → independent verification (quarterly physical bar count, daily cryptographic PoR)
  → on-chain MTQ supply (verifiable on any supported chain)
  → continuous reconciliation (daily custody attestation vs. on-chain supply)
```

### The Institutional-Grade Statement

Eventually, MITHQAL will be able to tell an institutional bank:

> "MTQ reserves are not held on the balance sheet of the operating company. Eligible reserve assets are maintained in constitutionally segregated custody with approved institutional or official-sector custodians. Where legally permissible, MITHQAL may utilize central-bank or other official-sector custody arrangements for designated reserve assets."

This is a far stronger statement than "We have gold backing." It establishes:
- Constitutional authority (the rules are codified, not discretionary)
- Independent oversight (the Foundation, not the operating company)
- Independent custody (tiered custodian hierarchy, not a single custodian)
- Identified reserve assets (allocated, bar-level, not paper claims)
- Independent verification (quarterly physical bar count, daily cryptographic PoR)
- On-chain MTQ supply (verifiable on any supported chain)
- Continuous reconciliation (daily custody attestation vs. on-chain supply)

---

## 10. Reserve Custody Status Reporting

The dashboard will eventually show a **Reserve Custody Status** indicator, reflecting the actual custody tier achieved (not a marketing claim):

| Status | Meaning | When to Display |
|---|---|---|
| **Tier A — Official-Sector Custody** | At least one Tier 1 custodian (central bank / monetary authority / BIS-type institution) is actively holding reserves. | Only when independently documented — no premature claims. |
| **Tier B — Regulated Bank Custody** | Reserves held by Tier 2 regulated institutional custodians (e.g., JPMorgan, HSBC, BNY Mellon). | When custodian agreements are executed and operational. |
| **Tier C — Specialized Custody** | Reserves held by Tier 3 specialized precious-metals vaults (e.g., Brink's, Loomis, Malca-Amit). | When vault agreements are executed and operational. |
| **Tier D — Contingency** | Tier 4 contingency custodian activated due to primary custodian failure. | Only during active contingency operations. |
| **Pending** | Custodian agreements in negotiation; no operational custody yet. | Current status as of 2026-08-09. |

### Critical Rule

> **No premature claims.** The dashboard may show "Reserve Custody: Official-Sector Custodian" only when that is actually true and independently documented. Central-bank participation is a trust tier, not a marketing claim.

---

## 11. Pre-Existing Defects Identified During Audit

The custody documentation audit (performed alongside this framework) identified several pre-existing defects in the constitutional text and codebase. These must be addressed in a constitutional cleanup pass — they are not introduced by this framework, but they should be resolved before this framework is ratified.

### Critical Defects

1. **Git merge conflict marker in `blueprint.txt` at lines 9138–9380** — leftover from a prior merge. The §XX.16 Multi-Custodian Diversification Doctrine (referenced by `src/lib/multi-custodian.ts`) may have been lost here. **Remediation:** Resolve the merge conflict; recover or re-author §XX.16.

2. **Single-custodian operational violation** — 52% concentration (per Evidence Ledger E048), breaches §Article XVII §12's 25% cap. Publicly disclosed. **Remediation:** Engage 3+ custodians (BNY Mellon, State Street, JPMorgan for cash; Brink's/Loomis/Malca-Amit for bullion); reduce concentration below 25%.

3. **On-chain `Reserve.sol` tier definitions contradict the Constitution** — on-chain Tier 1 = bullion, constitution Tier 1 = cash; on-chain has no Tier 4. **Remediation:** Update `Reserve.sol` to match the constitution (Tier 1 = cash, Tier 2 = sovereign, Tier 3 = bullion, Tier 4 = stablecoins); add a Tier 4 storage slot.

4. **Conflicting concentration thresholds** — 25% in §Article XVII §12, 30% in Article V Credit Risk, 40% in Article V intro and Article I, 40% in `whitepaper.md`, 30% in `transparency/route.ts:798`. **Remediation:** Adopt 25% per-custodian / 30% per-jurisdiction (§Article XVII §12) as the authoritative binding cap; reconcile all other references.

### Material Defects

5. **§XX.16 referenced by `multi-custodian.ts` does not exist in `blueprint.txt`** — likely orphaned by the merge conflict. **Remediation:** Author §XX.16 or update `multi-custodian.ts` to reference the correct section.

6. **"Emergency Custodian" terminology collision** — used for both the §Article X *governance* custodian (a temporary caretaker role) and asset custodians in general. **Remediation:** Rename the Article X role to "Emergency Steward" or "Emergency Trustee".

7. **"Four constitutional custody tiers" label in `v19-infrastructure.ts:4334`** refers to cryptographic key storage, not asset custody — misleading. **Remediation:** Rename to "four constitutional key-storage tiers".

8. **CRI custody component is hardcoded, not stressed** — `BASE_CRI_INPUTS = {liquidity:20, fx:30, custody:25, counterparty:40, operational:15}` is never re-computed under stress. **Remediation:** Make the CRI custody component dynamic; stress-test it under custodian-failure scenarios.

### Cosmetic Defects

9. **`public-site.tsx:753` says "Reserves are held in custody across a four-tier structure of central-bank-quality assets"** — ambiguous wording that will be confused with the new four-tier custodian framework. **Remediation:** Reword to "four-tier reserve asset structure" (referring to reserve-asset tiers, not custodian tiers).

10. **`AUDIT.md:34` says "4-tier structure (cash/T-bills, sovereign bonds, allocated gold, strategic gold)"** — splits Tier 3 into "allocated gold" and "strategic gold", contradicting the constitution's 4-tier model. **Remediation:** Correct to match the constitution.

---

## 12. Constitutional Boundary

This custody framework does **NOT** modify the existing constitutional architecture beyond the custody tier hierarchy. The following remain protected:

- ✅ Reserve segregation (gold/silver/cash in approved custodian custody) — preserved and strengthened
- ✅ Approved custody (Constitutional Reserve Framework) — preserved
- ✅ Constitutional governance (Council + Safe Multi-Sig + 4-role access control) — preserved
- ✅ Foundation independence (Mithqal Foundation's constitutional role) — preserved
- ✅ Commercial/constitutional separation (JOZOUR LLC operates commercial services; the Foundation holds the constitutional infrastructure) — preserved
- ✅ Current JOZOUR LLC operating structure — preserved
- ✅ Future Holding/Operations/Markets architecture (per the blueprint) — preserved
- ✅ Constitutional monetary rules (100%+ reserve, no discretionary minting, gold discipline) — preserved
- ✅ Minting rules (demand-driven, deposit-verified) — preserved
- ✅ Redemption rules (burn never pauses, physical gold redemption 1kg minimum) — preserved
- ✅ Governance rules (3-of-5 Safe, 7-member Council, 4-role access control) — preserved

### What This Framework Does NOT Do

- ❌ Does not designate any specific central bank as a custodian
- ❌ Does not make central-bank custody a constitutional requirement
- ❌ Does not change the reserve asset tier structure (Tier 1 cash / Tier 2 sovereign / Tier 3 bullion / Tier 4 stablecoin)
- ❌ Does not change the Constitutional Liquidation Order
- ❌ Does not modify the on-chain `Reserve.sol` contract (that is a separate remediation task — see §11.3)
- ❌ Does not change the Safe Multi-Sig configuration (that is a separate operationalization task — see `network-architecture-audit.md` F-CRITICAL-1)
- ❌ Does not claim regulatory approval, institutional adoption, production settlement, or custody relationships unless independently documented

---

## 13. Implementation Phases

### Phase C-1 — Constitutional Ratification (future)
- This document is ratified by the Constitutional Council (once seated).
- The constitutional text in `blueprint.txt` is amended to add the custody tier hierarchy as a new article (or new sections to §Article XVII).
- The pre-existing defects in §11 are resolved in the same amendment.

### Phase C-2 — Custodian Eligibility Policy (future)
- The 12 eligibility criteria in §4 are codified as a formal Custodian Eligibility Policy.
- An independent Custodian Eligibility Committee is established (under the Foundation's oversight) to evaluate and approve custodian candidates.

### Phase C-3 — Custodian Engagement (future)
- Tier 2 regulated institutional custodians are engaged first (practical backbone).
- Tier 3 specialized vaults are engaged for physical bullion.
- Tier 1 official-sector custody is explored where legally available (long-term objective).

### Phase C-4 — Operational Implementation (future)
- `src/lib/multi-custodian.ts` is extended with a `tier: 1 | 2 | 3 | 4` field.
- Tier-specific caps are enforced in `evaluateCustodianHealth` and `computeCustodianAllocation`.
- The dashboard Reserve Custody Status indicator is implemented.
- The single-custodian 52% concentration violation (E048) is resolved.

### Phase C-5 — Official-Sector Engagement (long-term)
- Engagement with central banks (NY Fed, Bank of England, CBUAE, SAMA) where legally eligible.
- BIS engagement for cross-border settlement infrastructure.
- No public claims until agreements are executed.

---

## 14. Success Criteria

The custody framework evolution is successful only if:

- ✅ The flat multi-custodian fleet is preserved (no existing custodian relationships are abandoned)
- ✅ The custody tier hierarchy is formally documented (this document)
- ✅ The 12 eligibility criteria are codified
- ✅ The geographic diversification strategy is documented
- ✅ The physical gold allocation requirements are reaffirmed
- ✅ The reserve integrity hierarchy is established
- ✅ No central bank is designated as a custodian without agreement
- ✅ No premature claims of official-sector custody
- ✅ The pre-existing defects in §11 are identified for remediation
- ✅ The constitutional boundary (§12) is respected
- ⚠️ The Constitutional Council is seated (pending — F-CRITICAL-1)
- ⚠️ The framework is ratified (pending — Phase C-1)
- ⚠️ The custodian engagement is operationalized (pending — Phase C-3)

---

## 15. Related Documents

- [`docs/architecture/custodian-eligibility-matrix.md`](../architecture/custodian-eligibility-matrix.md) — the 12 eligibility criteria as a verification matrix
- [`docs/architecture/geographic-custody-strategy.md`](../architecture/geographic-custody-strategy.md) — the 5-region diversification strategy
- [`docs/verification/custody-readiness-report.md`](../verification/custody-readiness-report.md) — readiness assessment for custody operationalization
- [`docs/legal/institutional-principles.md`](../legal/institutional-principles.md) — canonical Principle 4 wording (preserved)
- [`docs/legal/institutional-boundaries.md`](../legal/institutional-boundaries.md) — institutional responsibility matrix (to be updated post-ratification)
- [`docs/contracts/CONTRACT_REGISTRY.md`](../contracts/CONTRACT_REGISTRY.md) — contract registry (to add Custody Arrangements section post-ratification)
- [`docs/architecture/multi-network-architecture.md`](../architecture/multi-network-architecture.md) — multi-network architecture (reserve independence section)
- [`docs/blueprint/blueprint.txt`](../blueprint/blueprint.txt) — the constitutional text (to be amended in Phase C-1)
- [`src/lib/multi-custodian.ts`](../../lib/multi-custodian.ts) — the multi-custodian fleet implementation (to be extended in Phase C-4)
- [`src/contracts/core/Reserve.sol`](../../contracts/core/Reserve.sol) — the on-chain reserve accounting contract (defect remediation in Phase C-1)

---

## 16. Final Statement

> **MITHQAL's Constitutional Reserve Framework is designed to permit custody by central banks, monetary authorities, BIS-type institutions, or other approved institutional custodians where legally authorized and contractually available.**

> **No central bank is designated as a custodian by this framework. Each institution must separately approve the relationship. MITHQAL does not represent any central bank as a custodian until that institution actually agrees to the role.**

> **The strongest architecture is institutional-grade, independent, multi-jurisdictional custody, with central banks treated as a potential future class of official custodians where they are legally willing and eligible to provide the service.**

> **No constitutional monetary principle was modified by this framework. The reserve asset tier structure, the Constitutional Liquidation Order, the 100%+ reserve mandate, and the no-discretionary-minting rule are all preserved unchanged.**
