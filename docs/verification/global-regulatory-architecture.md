# Global Regulatory Architecture
## Cross-Jurisdiction Compatibility Analysis per v20 Canonical Blueprint

**Date:** 2026-08-11
**Authority:** v20 Canonical Blueprint (`docs/architecture/mithqal-canonical-v20.md`)
**Mode:** READ-ONLY — architecture vs regulatory framework comparison
**Critical disclaimer:** MITHQAL has **NOT** obtained regulatory approval, licensing, or legal opinion in ANY jurisdiction. This document maps the v20 architecture against published regulatory frameworks to identify (a) what is architecture-ready and (b) what requires external legal opinion. **No claim of regulatory approval is made or implied.**

---

## 0. Critical Reading Note

This document is **not** a legal opinion. It is an architecture-vs-framework compatibility analysis prepared by engineering. Every cell marked "Architecture-Ready" means the v20 blueprint design accommodates the relevant regulation; it does NOT mean MITHQAL is compliant, licensed, or approved.

Every cell marked "Requires Legal Opinion" means external counsel licensed in that jurisdiction must issue a written opinion before any institutional deployment. MITHQAL's current operating entity is **JOZOUR LLC (New Jersey, USA)** — a status-1 entity, not a regulated financial institution.

---

## 1. Jurisdiction Coverage

| # | Jurisdiction | Primary Regulator(s) | Applicable Frameworks | Architecture-Ready? | Legal Opinion Required? |
|---:|---|---|---|:---:|:---:|
| 1 | United States | OCC, SEC, CFTC, FinCEN, state regulators | GENIUS Act, Securities Act 1933, CEA, BSA | ⚠️ Partial | ✅ YES |
| 2 | European Union | ESMA, EBA, ECB | MiCA, DORA, AMLD6 | ⚠️ Partial | ✅ YES |
| 3 | United Kingdom | FCA, PRA | Payment Services Regs, FSMA, MLR 2017 | ⚠️ Partial | ✅ YES |
| 4 | Switzerland | FINMA | Blockchain Act, AMLO | ✅ High | ✅ YES |
| 5 | GCC (UAE/Saudi/Qatar) | CBUAE, SAMA, QFC | VARA, SAMA Stablecoin Framework, QFCRA | ⚠️ Partial | ✅ YES |
| 6 | Egypt | CBE, FRA | CBE Law 194, FRA Crypto Regs (proposed) | ⚠️ Partial | ✅ YES |
| 7 | Singapore | MAS | Payment Services Act, PSA | ✅ High | ✅ YES |
| 8 | Japan | FSA | Payment Services Act, FIEA | ✅ High | ✅ YES |
| 9 | Hong Kong | SFC, HKMA | Stablecoin Ordinance 2025, AMLO | ⚠️ Partial | ✅ YES |
| 10 | Sharia (cross-jurisdiction) | AAOIFI, national Sharia boards | AAOIFI Standards 17, 21, 60 | ⚠️ Architecture-Ready; Certification Required | ✅ YES |

---

## 2. United States of America

### 2.1 GENIUS Act (Guaranteed Enhanced Nailing-down of International Stablecoins Act, 2025)

The GENIUS Act establishes a federal framework for "payment stablecoins" issued by:
- Insured depository institutions (FDIC-insured banks)
- Federal credit unions (NCUA-insured)
- Subsidiaries of bank holding companies
- Non-bank issuers approved by OCC

**MITHQAL classification question:** Is MTQ a "payment stablecoin" under GENIUS Act?
- **Argument for:** PAR = $1.00 (face value), 1:1 redemption, USD-pegged, used for settlement.
- **Argument against:** MTQ is backed by multi-currency + bullion reserves (not just cash/sovereign); it is over-collateralized (RR ≥ 102%); it serves settlement (not payments); the Constitution explicitly says "not a payment processor" (v20 §2).
- **Likely classification:** **Hybrid** — MTQ has payment-stablecoin properties but its reserve composition and constitutional identity suggest it may be classified as a "digital asset" or a "sovereign-backed settlement token" requiring SEC/CFTC analysis.
- **Status:** ❌ Requires formal legal opinion. MITHQAL is NOT a GENIUS-Act-licensed issuer.

### 2.2 SEC Classification (Securities Act 1933 — Howey Test)

**Howey Test (4 prongs):**
1. Investment of money — ✅ (users deposit cash/bullion)
2. Common enterprise — ⚠️ (MITHQAL is a settlement institution, not a profit-seeking enterprise; the anti-platform clause may rebut this)
3. Expectation of profits — ❌ (PAR = $1.00 fixed; no profit distribution; no yield on MTQ itself; NAV premium is for solvency, not profit)
4. Efforts of others (promoter/sponsor) — ⚠️ (the Monetary Council manages reserves, but does not generate returns for holders)

**Likely SEC classification:** NOT a security (anti-platform clause, no expectation of profit, PAR-fixed redemption). However, the Yield Vehicle (Entity B, separate regulated fund) is a security — but that's a separate entity, not MTQ itself.

**Status:** ⚠️ Architecture-Ready (anti-platform clause, no-yield design). Requires SEC no-action letter or formal legal opinion.

### 2.3 CFTC Classification (Commodity Exchange Act)

MTQ may qualify as a "commodity" (backed by gold, silver, multi-currency reserves) but not as a "swap" or "derivative" (no leverage, no future settlement).

**Status:** ⚠️ Architecture-Ready. CFTC typically defers to SEC on stablecoin classification. Legal opinion required.

### 2.4 AML / KYC / BSA (Bank Secrecy Act + FinCEN)

**Required for institutional deployment:**
- Customer Identification Program (CIP) — ❌ NOT IMPLEMENTED (testnet only)
- Beneficial Ownership Identification — ❌ NOT IMPLEMENTED
- Suspicious Activity Reports (SARs) — ❌ NOT IMPLEMENTED
- Currency Transaction Reports (CTRs) — ❌ NOT IMPLEMENTED
- Travel Rule compliance (FATF Recommendation 16) — ❌ NOT IMPLEMENTED
- OFAC sanctions screening — ❌ NOT IMPLEMENTED (testnet only)
- BSA AML Compliance Officer designation — ❌ NOT DONE
- Independent AML audit — ❌ NOT DONE

**Status:** ❌ Architecture supports AML/KYC (deterministic, auditable, identity-claimable) but AML/KYC modules are NOT implemented. Requires build-out before US institutional deployment.

### 2.5 State-Level Money Transmitter Licenses (MTLs)

MTQ mint/redeem operations may trigger state MTL requirements (50-state patchwork). New York DFS BitLicense may apply if NY-resident users.

**Status:** ❌ No MTLs obtained. Requires 50-state analysis.

### 2.6 US Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| GENIUS Act payment-stablecoin classification | ⚠️ | ✅ | — |
| SEC Howey Test (security vs not) | ✅ (anti-platform) | ✅ | — |
| CFTC commodity classification | ⚠️ | ✅ | — |
| AML/KYC/BSA | ✅ (design) | ✅ | ✅ Build-out required |
| State MTLs | — | ✅ | ✅ Filing required |

---

## 3. European Union

### 3.1 MiCA (Markets in Crypto-Assets Regulation, effective Dec 2024 / Jun 2025)

MiCA classifies crypto-assets into 3 categories:
- **ART (Asset-Referenced Token):** backed by a basket of currencies, commodities, or both
- **EMT (Electronic Money Token):** backed by a single fiat currency
- **Other crypto-assets:** not ART/EMT (e.g., utility tokens)

**MITHQAL classification:** Most likely **ART** (backed by multi-currency + bullion basket). EMT requires single-fiat backing (MTQ is not single-fiat). ARTs face the strictest requirements:
- Capital reserve requirements (5% own funds for significant ARTs)
- Reserve asset composition rules (high-liquidity assets, no commingling)
- Daily reconciliation with custody
- Public reserve attestation (semi-annual for non-significant, quarterly for significant)
- ESMA + EBA + national competent authority authorization

**Architecture-Ready items (v20):**
- ✅ 100% reserve backing (RR ≥ 100%)
- ✅ No commingling (constitutional invariant 4)
- ✅ Daily reconciliation framework (§10.2)
- ✅ Public transparency API (`/api/transparency`)
- ✅ Independent custodian attestations (designed, not yet executed)

**Gaps vs MiCA:**
- ❌ Not authorized as ART issuer by any EU national competent authority
- ❌ No MiCA whitepaper (Article 5 requirements) published
- ❌ No 5% own-funds capital reserve established
- ❌ No MiCA-compliant marketing communications policy
- ❌ EU-authorized custodian not engaged

**Status:** ❌ Architecture partially aligns with MiCA ART requirements, but no authorization sought. Requires legal opinion + MiCA whitepaper + capital reserve.

### 3.2 DORA (Digital Operational Resilience Act, effective Jan 2025)

DORA imposes ICT risk management requirements on financial entities including crypto-asset service providers.

**Required:**
- ICT risk management framework — ❌ Not documented
- Major ICT incident reporting — ❌ Not implemented
- Digital operational resilience testing (annual) — ❌ Not performed
- Third-party ICT services risk — ❌ Not assessed
- Threat-led penetration testing (TLPT) — ❌ Not performed

**Status:** ❌ Architecture-Ready (deterministic engine, immutable audit trail) but DORA-specific compliance not implemented. Requires DORA compliance program.

### 3.3 AMLD6 (6th Anti-Money Laundering Directive, effective Dec 2025)

Extended AML obligations to crypto-asset service providers under the EU AML framework.

**Required:**
- Customer due diligence (CDD) — ❌ Not implemented
- Enhanced due diligence (EDD) for high-risk customers — ❌ Not implemented
- UBO (Ultimate Beneficial Owner) registration — ❌ Not done
- Transaction monitoring — ❌ Not implemented

**Status:** ❌ Same as US AML/KYC: architecture supports but module not built.

### 3.4 EU Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| MiCA ART classification | ⚠️ Partial | ✅ | ✅ Whitepaper + authorization |
| MiCA reserve/capital rules | ✅ Design aligns | ✅ | ✅ Capital reserve + EU custodian |
| DORA ICT resilience | ⚠️ Partial | ✅ | ✅ DORA program |
| AMLD6 | ✅ Design supports | ✅ | ✅ AML module build-out |

---

## 4. United Kingdom

### 4.1 FCA (Financial Conduct Authority) — Cryptoasset Framework

FCA classifies crypto-assets into:
- **E-money tokens:** regulated under Electronic Money Regulations 2011
- **Security tokens:** regulated under FSMA
- **Unregulated tokens:** utility tokens, exchange tokens (e.g., Bitcoin)

**MITHQAL classification:** Likely a **regulated token** — either e-money (if single-fiat pegged) or a new "systemic stablecoin" under the Bank of England's emerging stablecoin regime (post-2023 Financial Services and Markets Act amendments).

**Status:** ❌ Not FCA-registered. Requires FCA cryptoasset registration (under MLR 2017) plus potential BoE systemic-stablecoin designation.

### 4.2 Payment Services Regulations 2017 (PSRs)

If MTQ is classified as a payment instrument, PSR compliance is required:
- Authorization as a payment institution (or registration as small PI)
- Safeguarding of user funds (segregation)
- Capital requirements
- Operational resilience

**Architecture-Ready (v20):**
- ✅ Reserve segregation (operating entity ≠ reserve assets)
- ✅ No rehypothecation (constitutional invariant 3)
- ✅ 100% reserve backing

**Status:** ❌ Not authorized as PI. Requires FCA authorization.

### 4.3 MLR 2017 (Money Laundering Regulations)

Cryptoasset businesses must register with FCA under MLR 2017. Same AML/KYC gaps as US (§2.4).

### 4.4 UK Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| FCA cryptoasset registration | ⚠️ Partial | ✅ | ✅ FCA registration |
| BoE systemic stablecoin designation | ⚠️ | ✅ | ✅ Engagement with BoE |
| PSR authorization | ✅ Design aligns | ✅ | ✅ FCA PI authorization |
| MLR 2017 AML | ✅ Design supports | ✅ | ✅ AML module build-out |

---

## 5. Switzerland

### 5.1 FINMA (Swiss Financial Market Supervisory Authority)

Switzerland's Blockchain Act (DLT Act, effective Feb 2021) provides one of the most comprehensive crypto frameworks globally. FINMA classifies tokens into:
- **Payment tokens:** cryptocurrencies (BTC, ETH)
- **Utility tokens:** digital access to a service
- **Asset tokens:** equity/debt analogs (often securities)

**MITHQAL classification:** Likely a **payment token with asset backing** — the closest Swiss category to MTQ's design. Swiss law is more flexible than EU MiCA on multi-asset backing.

**Architecture-Ready (v20):**
- ✅ 100% reserve backing
- ✅ No lending/leverage (anti-platform clause)
- ✅ Allocated physical bullion (Swiss banking standard)
- ✅ Independent custodian attestations
- ✅ Transparent governance (Monetary Council)

**Gaps:**
- ❌ No FINMA authorization sought
- ❌ No Swiss banking license
- ❌ No Swiss AML license (SRO membership required)

**Status:** ✅ High architecture-readiness. Requires FINMA authorization + SRO membership.

### 5.2 Swiss AML (AMLO — Anti-Money Laundering Ordinance)

Requires SRO (Self-Regulatory Organization) membership and AML compliance program. Same AML/KYC module gaps.

### 5.3 Switzerland Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| FINMA DLT framework | ✅ High | ✅ | ✅ Authorization |
| Swiss banking license (optional) | — | ✅ | ✅ Capital + governance |
| AMLO SRO membership | ✅ Design supports | ✅ | ✅ SRO + AML module |

---

## 6. GCC (Gulf Cooperation Council)

### 6.1 UAE — CBUAE (Central Bank of UAE) + VARA (Virtual Assets Regulatory Authority)

UAE has a dual-framework: CBUAE regulates payment tokens (Payment Token Services Regulation, 2024); VARA regulates virtual assets in Dubai.

**MITHQAL classification:** Likely a CBUAE payment token (if single-fiat pegged) or VARA virtual asset (if multi-asset).

**Architecture-Ready (v20):**
- ✅ 100% reserve backing
- ✅ AAOIFI-aligned Sharia design (gold/silver allocated, no riba, no gharar)
- ✅ Multi-currency reserves

**Gaps:**
- ❌ No CBUAE or VARA license
- ❌ No UAE-based custodian (geographic custody strategy identifies UAE as a target region — see `geographic-custody-strategy.md`)

### 6.2 Saudi Arabia — SAMA (Saudi Arabian Monetary Authority)

SAMA issued a stablecoin framework (2024) restricting stablecoin issuance to SAMA-licensed banks. Foreign stablecoins require SAMA approval.

**Status:** ❌ Not SAMA-approved. Requires SAMA engagement.

### 6.3 Qatar — QFC (Qatar Financial Centre) + QFCRA

Qatar is developing its crypto framework. QFCRA (Qatar Financial Centre Regulatory Authority) has issued digital assets regulations (2023) for QFC-licensed firms.

**Status:** ❌ Not QFC-licensed.

### 6.4 GCC Summary

| Country | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| UAE (CBUAE/VARA) | ✅ High | ✅ | ✅ License + UAE custodian |
| Saudi Arabia (SAMA) | ⚠️ | ✅ | ✅ SAMA approval |
| Qatar (QFCRA) | ⚠️ | ✅ | ✅ QFC license |

---

## 7. Egypt

### 7.1 CBE (Central Bank of Egypt) — Banking Law 194 (2020)

CBE has exclusive authority over digital currencies in Egypt. Banking Law 194 (Article 206) prohibits issuance or trading of virtual currencies without CBE approval. (Note: the term "virtual currencies" was originally introduced in 2020 and is being refined in draft regulations.)

**MITHQAL classification:** Requires CBE approval as a digital settlement instrument. CBE has not yet issued a comprehensive stablecoin framework (as of the audit date).

**Architecture-Ready (v20):**
- ✅ Egyptian Pound (EGP) is not currently in the 8-currency basket (the basket is USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD per v20 §6.2)
- ✅ However, the engine is currency-agnostic — adding EGP would be a policy decision

**Gaps:**
- ❌ No CBE approval
- ❌ No Egyptian custodian
- ❌ No Arabic-language legal documentation

### 7.2 FRA (Financial Regulatory Authority)

FRA oversees non-banking financial activities in Egypt. Crypto-asset activities may fall under FRA jurisdiction if classified as securities or commodities.

### 7.3 Egypt Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| CBE Banking Law 194 | ⚠️ | ✅ | ✅ CBE engagement |
| FRA oversight | ⚠️ | ✅ | ✅ FRA classification |
| Egyptian custodian | — | — | ✅ Required for Egyptian operations |

---

## 8. Singapore

### 8.1 MAS (Monetary Authority of Singapore) — Payment Services Act (PSA, 2019, amended 2024)

PSA classifies payment services into 7 categories. Stablecoins fall under:
- **Digital Payment Token (DPT) services** — issuance, dealing, custody
- **MAS Stablecoin Framework (2023)** — single-currency stablecoins (SCS) issued in Singapore

**MITHQAL classification:** Multi-currency backing means MTQ does not fit SCS (single-currency stablecoin) definition. Most likely falls under DPT services.

**Architecture-Ready (v20):**
- ✅ 100% reserve backing
- ✅ Multi-currency reserves
- ✅ Allocated bullion
- ✅ Transparent governance
- ✅ Custody segregation

**Gaps:**
- ❌ No MAS DPT license
- ❌ No Singapore-based custodian

### 8.2 Singapore Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| MAS PSA DPT license | ✅ High | ✅ | ✅ MAS application |
| MAS Stablecoin Framework (SCS) | ❌ Not applicable (multi-currency) | — | — |
| AML/CFT (MAS Notice PSN01) | ✅ Design supports | ✅ | ✅ AML module build-out |

---

## 9. Japan

### 9.1 FSA (Financial Services Agency) — Payment Services Act (PSA, amended 2023)

Japan's amended PSA (effective Jun 2023) classifies crypto-assets into:
- **Type 1 crypto-assets:** traditional cryptocurrencies
- **Type 2 crypto-assets:** stablecoins (fiat-pegged)

Type 2 stablecoins can only be issued by:
- Japanese banks
- Japanese trust companies
- Registered money transfer agents (for overseas-issued stablecoins)

**MITHQAL classification:** MTQ would likely be a Type 2 crypto-asset (stablecoin). Issuance in Japan would require partnership with a Japanese bank or trust company.

**Architecture-Ready (v20):**
- ✅ 100% reserve backing
- ✅ Bank-grade custody design (4-tier custodian hierarchy)
- ✅ Redemption never paused

**Gaps:**
- ❌ No Japanese partner bank/trust company
- ❌ No FSA registration

### 9.2 Japan Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| FSA PSA Type 2 stablecoin | ✅ High | ✅ | ✅ Japanese bank partner |
| AML/CFT (Act on Prevention of Transfer of Criminal Proceeds) | ✅ Design supports | ✅ | ✅ AML module build-out |

---

## 10. Hong Kong

### 10.1 SFC (Securities and Futures Commission) + HKMA (Hong Kong Monetary Authority)

The **Stablecoin Ordinance 2025** (effective Aug 2025) establishes a licensing regime for stablecoin issuers in Hong Kong. Key requirements:
- HKMA license for fiat-referenced stablecoin (FRS) issuance
- Reserve assets held in HKMA-approved custodians (segregated, bankruptcy-remote)
- Redemption at face value within 1 business day
- Minimum paid-up capital of HK$250M (~US$32M)
- High-quality liquid asset reserves (cash, sovereign ≤1yr)

**MITHQAL classification:** MTQ is multi-asset backed (not single-fiat FRS), so it may not fit the FRS definition. May fall under SFC's digital asset framework instead.

**Architecture-Ready (v20):**
- ✅ 100% reserve backing
- ✅ Redemption never paused
- ✅ Segregated custody
- ✅ High-quality liquid assets (cash, sovereign)

**Gaps:**
- ❌ No HKMA license
- ❌ No HK-based custodian
- ❌ Multi-asset backing may complicate FRS classification

### 10.2 Hong Kong Summary

| Item | Architecture-Ready? | Legal Opinion Required? | Implementation Required? |
|---|:---:|:---:|:---:|
| HKMA Stablecoin Ordinance | ⚠️ Partial (multi-asset backing) | ✅ | ✅ HKMA license |
| SFC digital asset framework | ⚠️ | ✅ | ✅ SFC Type 1 license |
| AMLO (AML/CFT) | ✅ Design supports | ✅ | ✅ AML module build-out |

---

## 11. Sharia Compliance (Cross-Jurisdiction)

### 11.1 AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) Standards

The relevant AAOIFI standards for MITHQAL:

| Standard | Topic | MITHQAL Alignment |
|---|---|---|
| AAOIFI 17 — Investment Sukuk | Sukuk structuring | ✅ Sharia-compliant sukuk eligible for Tier 2 reserves (2% haircut per v20 §3.5) |
| AAOIFI 21 — Islamic Financial Institutions | Governance | ⚠️ Monetary Council design aligns; requires formal Sharia board establishment |
| AAOIFI 60 — Custody of Islamic Financial Assets | Custody | ✅ Allocated physical bullion custody aligns; no commingling, no rehypothecation |
| AAOIFI Sharia Standard on Gold | Gold trading rules | ✅ Allocated physical gold (not paper gold); settlement on spot; no leverage |
| AAOIFI Sharia Standard on Silver | Silver trading rules | ✅ Allocated physical silver; same rules as gold |

### 11.2 Sharia Compatibility Assessment (per `master-monetary-reserve-audit.md` §8)

| Item | Classification | Rationale |
|---|---|---|
| Gold ownership (allocated physical) | Likely compatible | Allocated, segregated, LBMA Good Delivery |
| Silver ownership | Likely compatible | Same as gold |
| Settlement mechanics | Likely compatible | Mint on verified deposit, redeem on burn |
| Custody | Likely compatible | Segregated, bankruptcy-remote, no rehypothecation |
| Redemption | Likely compatible | Never paused, proportional |
| Yield vehicle (Entity B) | Requires scholarly review | Separate regulated fund; fiat subscriptions; never holds MTQ |
| Leverage | Likely incompatible (prohibited) | Constitution prohibits lending, leverage, derivatives |
| Uncertainty (Gharar) | Likely compatible | Full transparency, deterministic engine |
| Speculation | Likely incompatible (prohibited) | Anti-platform clause; no trading, no DeFi |
| Interest (Riba) | Likely incompatible (prohibited) | No lending, no interest-bearing instruments |
| Takaful | Likely compatible | Mutual risk-sharing, tabarru' principle |

### 11.3 Sharia Certification

- ❌ **No AAOIFI certification obtained.** Architecture aligns but formal Sharia board review + AAOIFI certification required.
- ❌ **No national Sharia board opinion** (e.g., Dallah Al-Baraka, International Islamic Fiqh Academy)
- ❌ **No Sharia supervisory board established** for the Monetary Council

### 11.4 Sharia Summary

| Item | Architecture-Ready? | Certification Required? |
|---|:---:|:---:|
| AAOIFI 17 Sukuk eligibility | ✅ | ✅ |
| AAOIFI 21 Governance | ⚠️ | ✅ |
| AAOIFI 60 Custody | ✅ | ✅ |
| Gold/Silver standards | ✅ | ✅ |
| Leverage prohibition | ✅ Constitutional | ✅ Confirm |
| Riba prohibition | ✅ Constitutional | ✅ Confirm |
| Gharar (uncertainty) elimination | ✅ Deterministic | ✅ Confirm |
| Yield Vehicle (Entity B) | — | ✅ Separate scholarly review |

---

## 12. What Requires Legal Opinion vs What's Architecture-Ready

### 12.1 Architecture-Ready (No Code Change Needed for Compliance)

| Item | v20 Reference |
|---|---|
| 100% reserve backing (RR ≥ 100%) | §1.5, §13.1 |
| No lending/leverage/derivatives (anti-platform clause) | §2 |
| No commingling of reserves | §13.1 (Invariant 4) |
| Allocated physical bullion (LBMA Good Delivery) | §10.1 |
| Redemption never paused | §8.3 |
| Independent custodian attestations (framework designed) | §10, custody-framework-v2 |
| Transparent governance (Monetary Council, supermajority) | §12 |
| Public transparency API | `/api/transparency` |
| Multi-currency reserve composition | §6 |
| Daily reconciliation framework | §10.2 |
| Sharia-compatible design (no riba, no gharar, no speculation) | §2, §8 (Sharia §11 above) |
| Deterministic monetary engine (auditable) | §14 |
| Immutable audit trail | §15 |

### 12.2 Requires Legal Opinion (External Counsel)

| Item | Jurisdiction |
|---|---|
| GENIUS Act payment-stablecoin classification | USA |
| SEC Howey Test (security vs not) | USA |
| CFTC commodity classification | USA |
| State Money Transmitter Licenses (50-state analysis) | USA |
| MiCA ART classification + authorization | EU |
| MiCA whitepaper (Article 5) | EU |
| DORA ICT resilience program | EU |
| FCA cryptoasset registration | UK |
| BoE systemic stablecoin designation | UK |
| FINMA DLT authorization | Switzerland |
| CBUAE payment token license | UAE |
| VARA virtual asset license | UAE (Dubai) |
| SAMA stablecoin approval | Saudi Arabia |
| QFCRA digital asset license | Qatar |
| CBE Banking Law 194 approval | Egypt |
| MAS PSA DPT license | Singapore |
| FSA PSA Type 2 stablecoin (Japanese bank partner) | Japan |
| HKMA Stablecoin Ordinance license | Hong Kong |
| SFC Type 1 license (digital asset dealing) | Hong Kong |
| AAOIFI Sharia certification | Cross-jurisdiction |
| National Sharia board opinions | Cross-jurisdiction |

### 12.3 Requires Implementation Build-Out (Code/Infrastructure)

| Item | v20 Reference | Priority |
|---|---|---|
| AML/KYC/BSA module (CIP, EDD, SAR, CTR, Travel Rule, OFAC) | §12 (Governance) | P1 (institutional sandbox) |
| Beneficial Ownership Identification | §12 | P1 |
| MiCA-compliant whitepaper (machine-readable + human-readable) | — | P2 (EU institutional) |
| DORA ICT risk framework + TLPT | §11 (Oracle), §15 (Audit) | P2 (EU institutional) |
| Per-jurisdiction custodian integration (signed attestations) | §10, custody-framework-v2 | P2 (mainnet) |
| Multi-oracle consensus (regulatory resilience) | §11.1 | P1 |
| Independent security audit (Foundry/Slither/Certora) | §38 | P2 (mainnet) |
| Localized legal documentation (Arabic, Japanese, etc.) | — | P2 |

---

## 13. Critical Compliance Caveats

### 13.1 No Claim of Approval

MITHQAL has **NOT** obtained:
- ❌ Any regulatory license or registration
- ❌ Any legal opinion from external counsel
- ❌ Any AAOIFI Sharia certification
- ❌ Any central bank approval
- ❌ Any MiCA ART authorization
- ❌ Any FCA registration
- ❌ Any MAS DPT license
- ❌ Any FINMA authorization
- ❌ Any HKMA stablecoin license
- ❌ Any CBE approval

### 13.2 Current Operating Entity

The current operating entity is **JOZOUR LLC (New Jersey, USA)** — a status-1 entity, NOT a regulated financial institution. The future constitutional entity (Foundation + Holding + Operations + Markets) is **planned, not yet incorporated**.

Any institutional deployment requires:
1. Incorporation of the planned constitutional entities
2. Regulatory licensing in target jurisdictions
3. External legal opinion from licensed counsel in each jurisdiction
4. AAOIFI Sharia certification
5. Independent security audit

### 13.3 Architecture ≠ Compliance

The v20 architecture is **designed to be compatible with** the regulatory frameworks listed above. Compatibility in design is NOT the same as compliance in operation. The gap between architecture and compliance is approximately:
- 6–12 months of legal work (per jurisdiction)
- 3–6 months of AML/KYC module build-out
- 2–4 months of security audit
- 6–12 months of custodian onboarding

**Total estimated time to institutional deployment: 12–24 months** assuming P0+P1 items are prioritized.

---

## 14. Cross-Reference

| Topic | Document |
|---|---|
| v20 Canonical Blueprint | `docs/architecture/mithqal-canonical-v20.md` |
| Institutional principles + planned entities | `docs/legal/institutional-principles.md` |
| Organizational roadmap (current → planned) | `docs/roadmap/organizational-roadmap.md` |
| Custody framework v2 (4-tier hierarchy) | `docs/blueprint/custody-framework-v2.md` |
| Geographic custody strategy (5 regions) | `docs/architecture/geographic-custody-strategy.md` |
| Full forensic audit | `docs/verification/full-blueprint-engineering-audit.md` |
| Currency reserve policy | `docs/architecture/institutional-currency-reserve-policy.md` |
| Mathematical validation | `docs/verification/mathematical-reserve-validation.md` |
| Final mainnet readiness | `docs/verification/final-mainnet-readiness-certification.md` |

---

**This regulatory architecture analysis is complete. It does NOT claim regulatory approval where none exists. All jurisdictions require external legal opinion before institutional deployment.**
