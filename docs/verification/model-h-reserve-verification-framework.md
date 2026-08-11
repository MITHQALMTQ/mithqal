# MODEL H RESERVE VERIFICATION FRAMEWORK

## Institutional Proof-of-Reserves Architecture

**Document:** 5 of 7
**Mode:** READ-ONLY + SHADOW SIMULATION (design framework, no implementation)

---

## EXECUTIVE SUMMARY

This document designs the reserve verification framework that MITHQAL MUST implement before mainnet. The current system has **$0 in verified reserves** — every dollar is hardcoded. This framework defines 5 verification levels, 6 reserve statuses, and the proof-of-reserves architecture required for institutional credibility.

---

## 1. THE VERIFICATION GAP

### 1.1 Current state (verified by forensic audit)

| Reserve asset | Modeled value | Verified value | Gap |
|---|---|---|---|
| Cash $31M | $31,000,000 | $0 | ❌ Hardcoded, no bank attestation |
| Sovereign $13.5M | $13,500,000 | $0 | ❌ Hardcoded, no custodian statement |
| Gold 2,122.86 oz | $9,249,000 | $0 | ❌ Hardcoded, no vault attestation |
| Silver 36,758 oz | $2,385,000 | $0 | ❌ Hardcoded, no vault attestation |
| Stablecoin $2.7M | $2,700,000 | $0 | ❌ Hardcoded, no on-chain wallet |
| **TOTAL** | **$57.65M** | **$0** | **100% unverified** |

### 1.2 The two NAVs

| Metric | Value | Meaning |
|---|---|---|
| **MODELED NAV** | $1.0896 | What the software calculates from hardcoded values |
| **VERIFIED NAV** | **$0.0000** | What is independently proven to exist |

**If the hardcoded values are wrong, the entire system is a fiction.**

---

## 2. FIVE VERIFICATION LEVELS

### Level 0: Modeled Reserve
- **Definition:** A reserve value assumed/calculated by software
- **Evidence:** Source code constants, database entries
- **Current MITHQAL status:** ✅ All reserves are at Level 0
- **Trustworthiness:** ❌ None — can be changed by a developer

### Level 1: System-Reported Reserve
- **Definition:** Reserve value reported by the system's own API
- **Evidence:** `/api/nav` response, `/api/reserve/status` response
- **Current MITHQAL status:** ✅ The API reports $57.65M
- **Trustworthiness:** ⚠️ Low — same system that holds the reserves reports them

### Level 2: Custodian-Attested Reserve
- **Definition:** Reserve confirmed by an independent custodian
- **Evidence:** Bank statement, custodian attestation letter, vault receipt
- **Current MITHQAL status:** ❌ Not achieved
- **Trustworthiness:** ✅ Moderate — independent third party

### Level 3: Independently Audited Reserve
- **Definition:** Reserve verified by a qualified independent auditor
- **Evidence:** Audit report (Big 4 or qualified firm), signed opinion
- **Current MITHQAL status:** ❌ Not achieved
- **Trustworthiness:** ✅ High — professional auditor with liability

### Level 4: Continuously/Cryptographically Verifiable Reserve
- **Definition:** Reserve verifiable in real-time by anyone
- **Evidence:** On-chain wallet with signed custodian attestation, Proof of Reserves protocol
- **Current MITHQAL status:** ❌ Not achieved
- **Trustworthiness:** ✅ Highest — trustless verification

### 2.1 Current MITHQAL level

**Level 0 (Modeled).** All reserves are hardcoded in source code. No independent verification exists. This is unacceptable for mainnet.

---

## 3. SIX RESERVE STATUSES

Every reserve asset must have a status:

| Status | Definition | Counts toward verified NAV? |
|---|---|---|
| **UNVERIFIED** | No attestation exists | ❌ No |
| **PENDING** | Attestation requested, awaiting response | ❌ No |
| **VERIFIED** | Current, valid attestation from qualified party | ✅ Yes |
| **STALE** | Attestation older than threshold (e.g., >30 days) | ❌ No |
| **DISPUTED** | Attestation conflicts with system-reported value | ❌ No |
| **FAILED** | Attestation attempted and failed (reserve missing) | ❌ No |

### 3.1 Status transitions

```
UNVERIFIED → PENDING → VERIFIED → STALE → PENDING → VERIFIED
                ↓           ↓          ↓
              FAILED     DISPUTED   DISPUTED
```

---

## 4. VERIFICATION METHODS BY ASSET CLASS

### 4.1 Cash verification

| Method | Evidence | Level | Frequency |
|---|---|---|---|
| Bank API integration | Real-time balance from bank API | Level 4 | Continuous |
| Bank statement | Monthly statement from bank | Level 2 | Monthly |
| Custodian attestation | Signed letter from custodian | Level 2 | Monthly |
| Independent audit | Audit report | Level 3 | Annual |

**Recommended:** Bank API integration (Level 4) for real-time verification, plus annual audit (Level 3).

### 4.2 Sovereign securities verification

| Method | Evidence | Level | Frequency |
|---|---|---|---|
| Securities account statement | Monthly statement from custodian | Level 2 | Monthly |
| CUSIP/ISIN verification | Independent securities database | Level 3 | On-demand |
| Independent audit | Audit report | Level 3 | Annual |
| Direct Treasury verification | Treasury Direct API (US) | Level 4 | Continuous |

**Recommended:** Custodian statement (Level 2) monthly + annual audit (Level 3).

### 4.3 Gold verification

| Method | Evidence | Level | Frequency |
|---|---|---|---|
| Vault attestation | Signed letter from vault operator | Level 2 | Monthly |
| Serial number/bar list | LBMA bar serial numbers | Level 3 | On-demand |
| Independent assayer | Assayer report (metal content verification) | Level 3 | Annual |
| On-chain proof | Tokenized gold with on-chain attestation | Level 4 | Continuous |
| Physical audit | Independent auditor inspects vault | Level 3 | Annual |

**Recommended:** Vault attestation (Level 2) monthly + bar serial list (Level 3) + annual physical audit (Level 3).

### 4.4 Silver verification

Same as gold (Section 4.3).

### 4.5 FX (non-USD cash) verification

Same as cash (Section 4.1) — bank/custodian statement for each currency.

### 4.6 Stablecoin verification

| Method | Evidence | Level | Frequency |
|---|---|---|---|
| On-chain wallet balance | Public blockchain explorer | Level 4 | Continuous |
| Issuer attestation | Issuer's Proof of Reserves report | Level 3 | Monthly |
| Depeg monitoring | Price feed vs $1.00 | Level 4 | Continuous |
| Smart-contract audit | Audit of issuer's contract | Level 3 | Annual |

**Recommended:** On-chain wallet verification (Level 4) continuous + issuer attestation (Level 3) monthly.

---

## 5. PROOF-OF-RESERVES ARCHITECTURE

### 5.1 The PoR data model

Every reserve attestation must include:

| Field | Description | Example |
|---|---|---|
| `assetId` | Unique identifier for the reserve asset | "gold-vault-zurich-001" |
| `assetClass` | cash / sovereign / gold / silver / stablecoin | "gold" |
| `custodian` | Name of custodian/vault/bank | "Swiss Gold Safe" |
| `quantity` | Amount held | 2,122.86 oz |
| `fineness` | Metal purity (for bullion) | 0.9995 |
| `serialNumbers` | Bar serial numbers (for bullion) | ["SGS-12345", ...] |
| `valuationSource` | Price source | "multi-oracle-median" |
| `valuationTimestamp` | When the price was fetched | 2026-08-11T23:00:00Z |
| `ownershipConfirmation` | Proof MITHQAL owns the asset | Signed custodian letter |
| `encumbranceStatus` | owned / pledged / borrowed / encumbered | "owned" |
| `attestationTimestamp` | When custodian attested | 2026-08-11T23:00:00Z |
| `attestationHash` | Cryptographic hash of attestation | "0xabc..." |
| `verifier` | Who verified (custodian, auditor) | "KPMG AG" |
| `verificationLevel` | 0-4 | 3 |

### 5.2 Encumbrance classification

| Status | Definition | Counts toward RR? |
|---|---|---|
| **owned** | MITHQAL owns the asset outright | ✅ Yes |
| **pledged** | Asset pledged as collateral | ❌ No (encumbered) |
| **borrowed** | Asset borrowed (must be returned) | ❌ No (not owned) |
| **encumbered** | Asset subject to lien or restriction | ❌ No (encumbered) |
| **unverified** | Ownership not confirmed | ❌ No (unverified) |

**Only `owned` and `unencumbered` assets count toward constitutional reserve ratios.**

### 5.3 The PoR publication flow

```
1. Custodian attests reserves (monthly)
   ↓
2. System stores attestation in Turso (ProofAttestation table)
   ↓
3. System computes VERIFIED NAV (only verified, owned, unencumbered assets)
   ↓
4. System publishes PoR report (public API + transparency page)
   ↓
5. Independent auditor verifies annually (Level 3)
   ↓
6. Public can verify on-chain wallet balances (Level 4, stablecoins)
```

---

## 6. VERIFIED NAV vs MODELED NAV

### 6.1 The dual-NAV reporting

| Metric | Formula | Current value |
|---|---|---|
| **MODELED NAV** | R_m (all assets) / S | $1.0896 |
| **VERIFIED NAV** | R_m (verified, owned, unencumbered only) / S | $0.0000 |
| **VERIFIED RR** | R_a (verified) / (S × PAR) | 0.00% |

### 6.2 What this means

**The current system reports MODELED NAV = $1.09 but VERIFIED NAV = $0.00.**

- If the hardcoded values are accurate → MODELED NAV is correct, VERIFIED NAV will match once custodians attest
- If the hardcoded values are inaccurate → MODELED NAV is a fiction, VERIFIED NAV reveals the truth

**For mainnet: VERIFIED NAV must equal or exceed MODELED NAV.** If VERIFIED < MODELED, the system is over-reporting and must correct.

---

## 7. RESERVE VERIFICATION GATE

### 7.1 The hard gate

**Before mainnet launch, ALL of the following must be true:**

1. ✅ Every reserve asset has a custodian attestation (Level 2+)
2. ✅ Every bullion holding has serial number/bar list (Level 3)
3. ✅ Every stablecoin holding is verifiable on-chain (Level 4)
4. ✅ Annual independent audit completed (Level 3)
5. ✅ VERIFIED NAV ≥ MODELED NAV (no over-reporting)
6. ✅ VERIFIED RR ≥ 100% (constitutional floor met with verified reserves)
7. ✅ PoR report published publicly
8. ✅ Attestation freshness < 30 days for all assets

### 7.2 What happens if verification fails

| Failure | Action |
|---|---|
| Attestation stale (>30 days) | Flag asset as STALE, exclude from VERIFIED NAV |
| Attestation conflicts with system | Flag as DISPUTED, pause minting, investigate |
| Attestation fails (asset missing) | Flag as FAILED, emergency mode, Council convened |
| Custodian unavailable | Use backup custodian, flag as PENDING |
| Audit reveals shortfall | Emergency mode, public disclosure, redemption throttle |

---

## 8. CUSTODIAN REQUIREMENTS

### 8.1 Qualified custodian criteria

| Criterion | Requirement |
|---|---|
| Regulatory status | Regulated financial institution (bank, trust, vault) |
| Independence | Not affiliated with MITHQAL operating entity |
| Insurance | Custodian insurance covering held assets |
| Audit history | Clean audit history (no material findings) |
| Geography | Located in GREEN/YELLOW jurisdiction (per regulatory analysis) |
| Capacity | Able to hold the asset class (gold vault, securities account, etc.) |
| Reporting | Able to provide monthly attestations |

### 8.2 Recommended custodian diversification

| Asset class | Custodian 1 | Custodian 2 | Custodian 3 |
|---|---|---|---|
| Cash (USD) | JP Morgan | BNY Mellon | State Street |
| Cash (EUR) | Deutsche Bank | UBS | — |
| Cash (CHF) | UBS | Julius Baer | — |
| Sovereign | BNY Mellon | State Street | — |
| Gold | Brink's | Loomis | Malca-Amit |
| Silver | Brink's | Loomis | — |
| Stablecoin | Fireblocks | Coinbase Custody | BitGo |

**Per-custodian cap: 25% of total reserves (§10). Minimum 3 custodians.**

---

## 9. IMPLEMENTATION ROADMAP (after management approval)

### Phase 1: Custodian engagement (Months 1-3)
- Select qualified custodians for each asset class
- Negotiate custody agreements and attestation frequency
- Transfer reserves to custodian accounts

### Phase 2: Attestation integration (Months 3-4)
- Build custodian API integrations (where available)
- Build attestation storage in Turso (ProofAttestation table)
- Implement VERIFIED NAV computation
- Implement status tracking (UNVERIFIED → PENDING → VERIFIED → STALE)

### Phase 3: PoR publication (Months 4-5)
- Build public PoR report (transparency page)
- Publish attestations with cryptographic hashes
- Enable on-chain verification for stablecoins

### Phase 4: Independent audit (Months 5-6)
- Engage Big 4 auditor (Deloitte, PwC, EY, KPMG)
- Complete annual audit
- Publish audit report

### Phase 5: Continuous verification (Ongoing)
- Monthly custodian attestations
- Continuous on-chain verification (stablecoins)
- Annual independent audit
- Real-time depeg monitoring (stablecoins)

---

## 10. CONCLUSION

The current MITHQAL system has **$0 in verified reserves.** Every dollar is hardcoded in source code. This is the single largest risk to institutional credibility.

The verification framework defined in this document provides a clear path from Level 0 (Modeled) to Level 4 (Cryptographically Verifiable). The implementation roadmap requires 6 months of focused work after management approval.

**Without this framework, MITHQAL cannot claim institutional credibility. No central bank, commercial bank, or sophisticated institutional investor will accept unverified reserves.**

The next document (Institutional Readiness) evaluates the full institutional readiness picture.
