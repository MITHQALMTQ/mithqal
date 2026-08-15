# MITHQAL v25.0 — ARCHITECTURE LOCK

**Date:** 2026-08-14
**Authority:** Lead CTO + COO + Project Manager + Monetary Systems Architect + Banking Architect + Tokenomics Architect + Financial Risk Architect + Security Architect + Senior Auditor
**Status:** LOCKED — This document defines the normative v25.0 architecture. All subsequent remediation prompts MUST conform to this lock.

---

## 1. MITHQAL IDENTITY (LOCKED)

> **MITHQAL is a neutral wholesale settlement infrastructure connecting regulated monetary systems across jurisdictions.**

MITHQAL is NOT:
- A central bank
- A commercial bank
- A sovereign currency issuer
- A retail payment platform
- An exchange
- A brokerage
- A market maker
- A lending institution
- A trade-finance institution
- An investment fund
- A wealth manager
- A DeFi protocol
- A speculative vehicle
- A BRICS monetary instrument
- A Western monetary instrument
- An anti-dollar mechanism
- A sanctions-evasion mechanism
- A geopolitical settlement bloc

## 2. MTQ DEFINITION (LOCKED)

> **MTQ is a permissioned wholesale settlement instrument used by authorized regulated financial institutions and, where explicitly authorized, central banks or sovereign monetary authorities to transfer settlement value between participating monetary systems.**

MTQ IS:
- Neutral
- Wholesale
- Settlement-focused
- Reserve-disciplined
- Auditable
- Cryptographically secured
- Institutionally traceable
- Interoperable

MTQ is NOT:
- A retail stablecoin
- A consumer payment coin
- A replacement for USD/JPY/EUR/AED or any sovereign currency
- A CBDC
- A sovereign liability
- A geopolitical settlement instrument
- A BRICS currency
- A U.S. currency
- An investment product
- An exchange-traded speculative instrument

## 3. B2B / INSTITUTIONAL SCOPE (LOCKED)

**Direct MTQ participants (YES):**
- Regulated commercial banks (Class B)
- Approved regulated financial institutions (Class C)
- Central banks / monetary authorities ONLY where explicitly authorized (Class A)

**Underlying customers (YES, indirect):**
- Corporations (Class D) — through their regulated bank
- Institutional trade counterparties (Class D)

**Direct retail participation (NO — PROHIBITED):**
- Individual consumers ❌
- Personal bank accounts ❌
- Retail wallets ❌
- Public direct MTQ minting ❌
- Consumer direct wholesale settlement ❌

## 4. CORPORATE ACCESS THROUGH REGULATED BANKS (LOCKED)

> **Corporate customer → regulated bank → bank-linked corporate MTQ settlement account → MITHQAL neutral wholesale settlement → receiving bank → corporate account.**

The corporation is the **beneficial economic holder**; the bank is the **regulated access and security layer**; MITHQAL controls the **MTQ settlement protocol**.

### Division of Control

| Bank Controls | MITHQAL Controls |
|---------------|-----------------|
| Authentication | MTQ protocol |
| Key management (HSM/MPC) | Issuance rules |
| Corporate signatories | Supply |
| Transaction policy | Settlement state |
| Cybersecurity | Institutional permissions |
| Fraud controls | Reserve/monetary integrity |
| Account recovery | |
| Segregation of duties | |

## 5. BANK-LINKED CORPORATE MTQ SETTLEMENT ACCOUNTS (LOCKED)

- Bank-controlled institutional MTQ settlement account linked to corporate's regulated banking relationship
- Hybrid wallet: on-chain institutional wallet (bank-controlled) + internal bank subaccounts (corporate-level)
- Three-way reconciliation: canonical MITHQAL ledger = bank subledger = signed bank attestation
- Bank provides cryptographic attestation of wallet balance vs subaccount sum
- ZK proofs can verify sufficient backing without revealing individual balances

## 6. BANK-MEDIATED ISSUANCE (LOCKED)

> **Only authorized institutional issuance channels may originate MTQ.**

15-step institutional issuance pipeline:
1. Underlying Customer (Corporate) → 2. Regulated Bank → 3. Institutional Issuance Request → 4. Institution Authentication → 5. Authority Check → 6. Reserve/Funding Verification → 7. Custody Verification → 8. NAV Calculation → 9. RR/Stress-RR/Constitutional Checks → 10. Proof of Reserves → 11. Proof of Solvency → 12. Deterministic Issuance Authorization → 13. Mint.sol → 14. MTQ.sol → 15. MTQ enters wholesale settlement layer → Corporate Bank-Linked MTQ Settlement Account

No discretionary minting (8 prohibited types: executive, council, emergency arbitrary, treasury, compensation, operational funding, governance, promotional).

## 7. CENTRAL-BANK PARTICIPATION (LOCKED)

Three modes:
- **Mode 1 (Bank-Only):** Commercial/regulated institutions interact with MTQ. Default.
- **Mode 2 (Central-Bank-Connected):** Banks settle through CB/wholesale-CBDC interface. Requires explicit authorization.
- **Mode 3 (Direct CB Participation):** CB directly participates. Only where formally authorized.

> **Never claim a central bank is an MTQ participant unless formally approved.**

## 8. SINGLE CANONICAL MTQ SUPPLY (LOCKED)

> **TotalAuthorizedOutstanding = MonadOutstanding + ArcOutstanding + SolanaOutstanding + LockedBridgeRepresentation**

- No unrestricted cross-chain supply
- Each chain's supply must be verifiable and reconciled
- Bridge contracts must use locked-canonical accounting
- Solana supply anomaly (UINT64_MAX) must be capped for mainnet
- Cross-chain invariant must be VERIFIED (not just compositional)

## 9. NO UNRESTRICTED CROSS-CHAIN SUPPLY (LOCKED)

- No "unlocked MTQ on chain A + unlocked duplicate MTQ on chain B" without corresponding locked/canonical accounting
- Bridge activation requires locked-canonical accounting deployed
- Each chain maintains INDEPENDENT verifiable supply
- Reconciliation: canonical MITHQAL ledger = sum of chain supplies = sum of bank attestations

## 10. PRIVACY-PRESERVING INSTITUTIONAL TRACEABILITY (LOCKED)

> **Privacy by default. Traceability by authorization. Disclosure by law.**

3-Layer Privacy Architecture:
- **Layer 1 (Bank Identity Vault):** Customer identity, UBO, KYC/KYB — bank retains, MITHQAL has NO access by default
- **Layer 2 (MITHQAL Institutional):** Bank ID, corporate reference (pseudonymous), KYC/AML status, sanctions, jurisdiction — MITHQAL has FULL access
- **Layer 3 (Authorized Disclosure):** Underlying customer identity — regulator/CB access only where law permits

ZK architecture: Real privacy mechanisms (zk-SNARKs, verifiable credentials, selective disclosure) — NOT marketing.

## 11. JURISDICTIONAL GATEWAYS (LOCKED)

Every participating jurisdiction connects through a **Jurisdictional Settlement Gateway (JSG)**:
- US-JSG, JP-JSG, AE-JSG, IN-JSG, BR-JSG, EU-JSG, SG-JSG, HK-JSG, BRICS-JSG (pending)
- Each JSG enforces 17 rules (institutions, counterparties, currencies, CBDCs, sanctions, AML/CFT, limits, disclosure, data residency, privacy, capital controls, corridors, licensing, CB authorization, prohibited transactions)
- UNKNOWN = CONSERVATIVE BLOCK
- No jurisdiction connects directly to MTQ core without passing through its JSG

## 12. NO EXCHANGE (LOCKED)

MITHQAL does NOT operate an exchange. No order books. No market making. No brokerage.

## 13. NO BROKERAGE (LOCKED)

MITHQAL does NOT provide brokerage services. No trade execution for customers. No portfolio management.

## 14. NO SPECULATIVE TOKENOMICS (LOCKED)

- MTQ has NO floating price (PAR = $1.00 fixed)
- MTQ has NO yield, NO staking, NO speculative return
- MTQ is NOT an investment product
- Reserve management exists to preserve settlement integrity, NOT to generate speculative profit
- No de-dollarization infrastructure, no anti-Western infrastructure, no BRICS monetary infrastructure, no sanctions-evasion infrastructure

## 15. NO DISCRETIONARY MINTING (LOCKED)

> **No MTQ may exist without corresponding verified reserve backing.**

8 prohibited minting types: executive, council, emergency arbitrary, treasury, compensation, operational funding, governance, promotional.

Governance may govern **rules**, NOT bypass constitutional monetary issuance requirements.

## 16. NEUTRALITY DOCTRINE (LOCKED — IMMUTABLE)

> **MITHQAL shall not compete with sovereign monetary systems.**

> **MTQ sits between monetary systems, not instead of monetary systems.**

10 explicit rules: USD remains USD, JPY remains JPY, EUR remains EUR, AED remains AED, RMB remains RMB, CBDCs remain CB liabilities, MTQ does not replace domestic monetary systems, MTQ does not establish monetary policy, MITHQAL does not set sovereign interest rates, MITHQAL does not displace any sovereign currency.

## 17. BRICS NEUTRALITY (LOCKED)

- MTQ is NOT BRICS money
- MTQ is NOT U.S. money
- MTQ is the neutral settlement layer between authorized monetary systems
- BRICS interoperability through jurisdictional-gateway model (not MTQ core)
- BRICS Settlement Interoperability Adapter (BSIA) is modular, optional, replaceable
- Disabling BSIA does NOT disable MTQ
- MTQ remains independently functional regardless of BRICS existence

## 18. SANCTIONS NEUTRALITY (LOCKED)

> **MITHQAL neutrality shall never be interpreted as sanctions neutrality.**

> **Neutral infrastructure is not law-free infrastructure.**

## 19. CONSTITUTIONAL SPINE (LOCKED — PRESERVED FROM v24.2)

| Invariant | Value |
|-----------|-------|
| PAR | $1.00 USD |
| RR_floor | 100% |
| RR_policy | 105% |
| RR_strategic | 120% |
| Reserve conservation | B + F + D = 100% |
| Bullion range | 15-25% |
| Fiat range | 70-85% |
| Digital range | 0-5% |
| No discretionary minting | ENFORCED |
| No lending | ENFORCED |
| Reserve segregation | ENFORCED |
| Gold strategic anchor | 15%+ (Portfolio B) |
| Anti-double-counting | PROVEN (32/32 PASS) |
| Article X liquidation | Tokenized before physical |
| OFAC fail-closed | ENFORCED |
| China geo-fence | ENFORCED |
| Sharia governance | REQUIRED (independent board) |

## 20. CALM STATE MACHINE (LOCKED — CORRECTED)

6-state machine (NOT 5-state):
- NORMAL (RR_target=1.20)
- CAUTION (RR_target=1.22)
- DEFENSIVE (RR_target=1.23)
- STRESS (RR_target=1.25)
- EMERGENCY (RR_target=1.30, minting DISABLED)
- RECOVERY (RR_target=1.21)

Monotonic invariant: Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓

S_max = R_a / (RR_target × PAR) — DIVISION, not multiplication.

## 21. FINAL LOCKED STATEMENT

> **Customers continue to use banks; banks use MITHQAL; MITHQAL uses MTQ to settle value between monetary systems.**

---

*This architecture lock is IMMUTABLE for the v25.0 remediation series. All subsequent prompts MUST conform to this lock. No deviation is permitted without explicit governance approval.*
