# RESERVE VERIFICATION READINESS

## From Level 0 (Hardcoded) to Level 4 (Institutional Proof-of-Reserves)

**Document:** 5 of 8
**Mode:** READ-ONLY — framework design, no implementation

---

## EXECUTIVE SUMMARY

**Current verification level: LEVEL 0 (Hardcoded).** Every dollar of the $57.65M R_a is hardcoded in source code. Verified reserves = $0. This is the #1 institutional risk and the primary blocker for real-capital readiness.

This document defines the 5-level verification framework, the evidence required for each level, and the roadmap to achieve Level 4 (institutional proof-of-reserves).

---

## 1. THE 5 VERIFICATION LEVELS

### Level 0 — Hardcoded / Documented
- **Definition:** Reserve value exists only in source code or documentation
- **Evidence:** Source code constants (e.g., `CASH_USD = 31_000_000`)
- **Trustworthiness:** ❌ None — can be changed by any developer
- **Current MITHQAL status:** ✅ All reserves at Level 0
- **VERIFIED NAV contribution:** $0

### Level 1 — System-Reported
- **Definition:** Reserve value reported by the system's own API
- **Evidence:** `/api/nav` response, `/api/reserve/status` response
- **Trustworthiness:** ⚠️ Low — same system that holds the reserves reports them
- **Current MITHQAL status:** ✅ API reports $57.65M
- **VERIFIED NAV contribution:** $0 (still self-reported)

### Level 2 — Custodian-Attested
- **Definition:** Reserve confirmed by an independent custodian
- **Evidence:** Bank statement, custodian attestation letter, vault receipt
- **Trustworthiness:** ✅ Moderate — independent third party with liability
- **Current MITHQAL status:** ❌ Not achieved
- **VERIFIED NAV contribution:** Full value of attested assets

### Level 3 — Independently Audited
- **Definition:** Reserve verified by a qualified independent auditor
- **Evidence:** Audit report (Big 4 or qualified firm), signed opinion
- **Trustworthiness:** ✅ High — professional auditor with legal liability
- **Current MITHQAL status:** ❌ Not achieved
- **VERIFIED NAV contribution:** Full value of audited assets

### Level 4 — Cryptographically Verifiable
- **Definition:** Reserve verifiable in real-time by anyone
- **Evidence:** On-chain wallet with signed custodian attestation, Proof-of-Reserves protocol, merkle tree of liabilities
- **Trustworthiness:** ✅ Highest — trustless verification
- **Current MITHQAL status:** ❌ Not achieved
- **VERIFIED NAV contribution:** Full value of on-chain verifiable assets

---

## 2. CURRENT STATE (Level 0)

### 2.1 Every reserve classified

| Reserve asset | Modeled value | Verification level | Evidence | VERIFIED value |
|---|---|---|---|---|
| Cash $31M USD | $31,000,000 | Level 0 | `nav-compute.ts:46` hardcoded | $0 |
| Sovereign $13.5M | $13,500,000 | Level 0 | `nav-compute.ts:47` hardcoded | $0 |
| Gold 2,122.86 oz | $9,249,000 | Level 0 | `nav-compute.ts:48` hardcoded | $0 |
| Silver 36,758 oz | $2,385,000 | Level 0 | `nav-compute.ts:49` hardcoded | $0 |
| Stablecoin $2.7M | $2,700,000 | Level 0 | `nav-compute.ts:50` hardcoded | $0 |
| **TOTAL** | **$57,65M** | **Level 0** | **Source code** | **$0** |

### 2.2 The two NAVs

| Metric | Value | Meaning |
|---|---|---|
| **MODELED NAV** | $1.0896 | What the software calculates from hardcoded values |
| **VERIFIED NAV** | **$0.0000** | What is independently proven to exist |

**If the hardcoded values are wrong (intentionally or accidentally), the entire system is a fiction.** This is why Level 0 is unacceptable for real capital.

---

## 3. EVIDENCE REQUIRED PER LEVEL

### 3.1 Cash verification

| Level | Evidence | Frequency | Provider |
|---|---|---|---|
| 0 | Source code constant | N/A | Developer |
| 1 | API response | Real-time | MITHQAL system |
| 2 | Bank statement or custodian attestation | Monthly | Qualified custodian (JP Morgan, BNY, State Street) |
| 3 | Audit report | Annual | Big 4 auditor (Deloitte, PwC, EY, KPMG) |
| 4 | Bank API integration (real-time balance) | Continuous | Bank API + cryptographic attestation |

### 3.2 Sovereign securities verification

| Level | Evidence | Frequency |
|---|---|---|
| 0 | Source code constant | N/A |
| 1 | API response | Real-time |
| 2 | Custodian statement (securities account) | Monthly |
| 3 | CUSIP/ISIN verification + audit | Annual |
| 4 | Direct Treasury verification (Treasury Direct API for US) | Continuous |

### 3.3 Gold verification

| Level | Evidence | Frequency |
|---|---|---|
| 0 | Source code constant (oz) | N/A |
| 1 | API response (oz × live price) | Real-time |
| 2 | Vault attestation (signed letter) | Monthly |
| 3 | LBMA bar serial number list + independent assayer | On-demand |
| 4 | Tokenized gold with on-chain attestation OR live vault audit feed | Continuous |

### 3.4 Silver verification

Same as gold (Section 3.3).

### 3.5 Stablecoin verification

| Level | Evidence | Frequency |
|---|---|---|
| 0 | Source code constant ($1.00) | N/A |
| 1 | API response ($1.00 hardcoded) | Real-time |
| 2 | On-chain wallet balance (public blockchain) | Continuous |
| 3 | Issuer Proof-of-Reserves report | Monthly |
| 4 | On-chain balance + issuer attestation + depeg monitoring | Continuous |

---

## 4. RESERVE STATUS TRACKING

Every reserve asset must have a status:

| Status | Definition | Counts toward VERIFIED NAV? |
|---|---|---|
| **UNVERIFIED** | No attestation exists | ❌ No |
| **PENDING** | Attestation requested, awaiting response | ❌ No |
| **VERIFIED** | Current, valid attestation (Level 2+) | ✅ Yes |
| **STALE** | Attestation older than threshold (>30 days) | ❌ No |
| **DISPUTED** | Attestation conflicts with system-reported value | ❌ No |
| **FAILED** | Attestation attempted and failed (reserve missing) | ❌ No |

### Status transition rules

```
UNVERIFIED → PENDING → VERIFIED → STALE → PENDING → VERIFIED
                ↓           ↓          ↓
              FAILED     DISPUTED   DISPUTED
```

- **STALE threshold:** 30 days for cash/sovereign, 7 days for stablecoin (on-chain)
- **DISPUTED:** If attestation differs from system by >0.5%, flag as DISPUTED
- **FAILED:** If custodian confirms asset is missing, flag as FAILED → emergency mode

---

## 5. PROOF-OF-RESERVES (PoR) ARCHITECTURE

### 5.1 PoR data model

Every attestation must include:

| Field | Description | Example |
|---|---|---|
| `assetId` | Unique identifier | "gold-vault-zurich-001" |
| `assetClass` | cash / sovereign / gold / silver / stablecoin | "gold" |
| `custodian` | Name of custodian | "Swiss Gold Safe" |
| `quantity` | Amount held | 2,122.86 oz |
| `fineness` | Metal purity (bullion) | 0.9995 |
| `serialNumbers` | Bar serials (bullion) | ["SGS-12345", ...] |
| `valuationSource` | Price source | "multi-oracle-median" |
| `valuationTimestamp` | When price was fetched | 2026-08-12T00:00:00Z |
| `ownershipConfirmation` | Proof of ownership | Signed custodian letter |
| `encumbranceStatus` | owned / pledged / borrowed / encumbered | "owned" |
| `attestationTimestamp` | When custodian attested | 2026-08-12T00:00:00Z |
| `attestationHash` | Cryptographic hash | "0xabc..." |
| `verifier` | Who verified | "KPMG AG" |
| `verificationLevel` | 0-4 | 3 |

### 5.2 Encumbrance classification

| Status | Definition | Counts toward RR? |
|---|---|---|
| **owned** | MITHQAL owns outright | ✅ Yes |
| **pledged** | Pledged as collateral | ❌ No (encumbered) |
| **borrowed** | Borrowed (must return) | ❌ No (not owned) |
| **encumbered** | Subject to lien/restriction | ❌ No (encumbered) |
| **unverified** | Ownership not confirmed | ❌ No (unverified) |

**Only `owned` and `unencumbered` assets count toward constitutional reserve ratios.**

### 5.3 PoR publication flow

```
1. Custodian attests reserves (monthly)
   ↓
2. System stores attestation in Turso (ProofAttestation table)
   ↓
3. System computes VERIFIED NAV (verified, owned, unencumbered only)
   ↓
4. System publishes PoR report (public API + transparency page)
   ↓
5. Independent auditor verifies annually (Level 3)
   ↓
6. Public verifies on-chain wallet balances (Level 4, stablecoins)
```

---

## 6. VERIFICATION GATES

### 6.1 Per-phase requirements

| Phase | Min verification level | Min VERIFIED NAV | Attestation freshness |
|---|---|---|---|
| Testnet (current) | Level 0 | $0 | N/A |
| Shadow implementation | Level 0 | $0 | N/A |
| Testnet with real reserves | Level 2 | 100% of MODELED | <30 days |
| Institutional pilot | Level 2 | 100% of MODELED | <30 days |
| Mainnet (limited) | Level 3 | 100% of MODELED | <30 days + annual audit |
| Mainnet (full) | Level 4 (where possible) | 100% of MODELED | Continuous (stablecoins) + <30 days (physical) |

### 6.2 Hard gate: VERIFIED NAV ≥ MODELED NAV

**Before mainnet launch, VERIFIED NAV must equal or exceed MODELED NAV.**

If VERIFIED < MODELED:
- The system is over-reporting
- Minting must pause
- Public disclosure required
- Governance investigation

---

## 7. CUSTODIAN REQUIREMENTS

### 7.1 Qualified custodian criteria

| Criterion | Requirement |
|---|---|
| Regulatory status | Regulated financial institution (bank, trust, vault) |
| Independence | Not affiliated with MITHQAL operating entity |
| Insurance | Custodian insurance covering held assets |
| Audit history | Clean audit history (no material findings) |
| Geography | Located in GREEN/YELLOW jurisdiction |
| Capacity | Able to hold the asset class |
| Reporting | Monthly attestations + ad-hoc on-demand |
| Technology | API integration (where possible) for Level 4 |

### 7.2 Recommended custodian diversification

| Asset class | Custodian 1 | Custodian 2 | Custodian 3 |
|---|---|---|---|
| Cash (USD) | JP Morgan | BNY Mellon | State Street |
| Cash (EUR) | Deutsche Bank | UBS | — |
| Cash (CHF) | UBS | Julius Baer | — |
| Cash (SGD) | DBS | UOB | — |
| Sovereign | BNY Mellon | State Street | — |
| Gold | Brink's | Loomis | Malca-Amit |
| Silver | Brink's | Loomis | — |
| Stablecoin | Fireblocks | Coinbase Custody | BitGo |

**Per-custodian cap: 25%. Minimum 3 custodians.**

---

## 8. ROADMAP TO LEVEL 4

### Phase 1: Custodian engagement (Months 1-3)
- Select qualified custodians for each asset class
- Negotiate custody agreements (attestation frequency, API access)
- Transfer reserves to custodian accounts
- **Achieves:** Level 2 for all assets

### Phase 2: Attestation integration (Months 3-4)
- Build custodian API integrations
- Build attestation storage in Turso (ProofAttestation table — already exists)
- Implement VERIFIED NAV computation
- Implement status tracking (UNVERIFIED → PENDING → VERIFIED → STALE)
- **Achieves:** Automated Level 2 with status tracking

### Phase 3: PoR publication (Months 4-5)
- Build public PoR report (transparency page)
- Publish attestations with cryptographic hashes
- Enable on-chain verification for stablecoins (Level 4 for stablecoins)
- **Achieves:** Level 2 public + Level 4 for stablecoins

### Phase 4: Independent audit (Months 5-6)
- Engage Big 4 auditor
- Complete annual audit
- Publish audit report
- **Achieves:** Level 3 for all assets

### Phase 5: Continuous verification (Ongoing)
- Monthly custodian attestations
- Continuous on-chain verification (stablecoins)
- Annual independent audit
- Real-time depeg monitoring (stablecoins)
- Bank API integration for cash (where available)
- **Achieves:** Level 3+ for all assets, Level 4 for stablecoins and bank-API cash

---

## 9. THE CRITICAL DISTINCTION

### 9.1 What this audit found

**REPORTED RESERVES ≠ VERIFIED RESERVES**

| Metric | Value | Status |
|---|---|---|
| REPORTED (MODELED) reserves | $57,650,424 | Hardcoded in source code |
| VERIFIED reserves | $0 | No custodian attestation, no audit, no on-chain proof |
| VERIFIED NAV | $0.00 | $0 verified / 54M supply |
| MODELED NAV | $1.0896 | $57.65M modeled / 54M supply |

### 9.2 What must NEVER happen

- ❌ Never report "reserves exist" unless independently verified
- ❌ Never report "oracle is live" unless actually queried successfully
- ❌ Never report "contract is deployed" unless bytecode exists on-chain
- ❌ Never report "currency basket is implemented" unless actual reserves use those currencies
- ❌ Never report "mainnet ready" unless all institutional, legal, custody, security, and operational requirements are independently satisfied
- ❌ Never convert documented reserves → verified reserves
- ❌ Never convert simulation → certainty
- ❌ Never convert regulatory compatibility → regulatory approval

---

## 10. CONCLUSION

**The current system is at Level 0 (Hardcoded). VERIFIED NAV = $0. This is the #1 blocker for real capital.**

The roadmap to Level 4 requires:
1. **6 months** of custodian engagement + attestation integration (Level 2)
2. **1 month** of PoR publication (Level 2 public + Level 4 stablecoins)
3. **1 month** of independent audit (Level 3)
4. **Ongoing** continuous verification (Level 3+ / Level 4)

**Total time to Level 4: 8-12 months after management approval.**

**Without this framework, no central bank, commercial bank, or institutional investor will accept MITHQAL reserves.** The verified reserve requirement is non-negotiable for institutional credibility.
