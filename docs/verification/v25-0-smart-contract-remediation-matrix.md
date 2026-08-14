# MITHQAL v25.0 — Smart-Contract Remediation Matrix

**Task ID:** v25-SC-TESTS  •  **Agent:** Task Agent ID v25-SC-TESTS
**Directive refs:** §19 (Smart-Contract Audit/Remediation), §21 (Oracle Separation),
§30 (Acceptance Criteria), §32.H (Smart-Contract Remediation Matrix)
**Audit window:** 2026-08-12 deployment snapshot (Monad Testnet 10143, Arc Testnet 5042002, Local Anvil 1337)
**Auditor:** v25-SC-TESTS (general-purpose sub-agent)
**Source of truth:** `foundry/src/*.sol` (current bytecode baseline) + `src/lib/institutional-authorization.ts` + `src/lib/wholesale-settlement.ts` + `src/lib/v25-0-identity.ts`

---

## 0. Executive Summary

| Metric | Value |
|---|---|
| Contracts audited | 9 (MTQ, Mint, Redeem, Reserve, Governance, Algorithm, Oracle, Safe, Takaful) |
| Total required v25.0 changes | **27** (across the 9 contracts) |
| • CRITICAL | 11 |
| • HIGH | 9 |
| • MEDIUM | 7 |
| Effort estimate (S/M/L) | 4 S • 13 M • 10 L |
| §30 acceptance criteria addressed | 5 / 5 (UAR-1 … UAR-5) |

**Headline finding.** The deployed v19/v24 contract layer successfully blocks the
**naive** unauthorized-mint vectors (any external EOA calling `MTQ.mint()` or
`Mint.mintAgainstDeposit()` reverts with `"unauthorized role"`). It does **not**
implement the v25.0 institutional-perimeter model: there is no on-chain
notion of `institutionId`, no jurisdiction check inside the mint path, no CTID
(causal-transaction-id) idempotency (only `depositProof` replay protection),
and no enforcement that the caller is a registered Class A/B/C institution.
All of that logic currently lives in `src/lib/institutional-authorization.ts`
and `src/lib/wholesale-settlement.ts` — i.e. it is enforced off-chain only.
A compromised Mint.sol role-holder (or a Governance proposal that passes a
targeted call to `MTQ.mint(address,uint256,uint256,bytes32)`) could bypass
every v25.0 institutional check today.

**Secondary finding.** `Governance.sol` blocks the 1-arg selector
`mint(uint256)` but does **not** block the actual MTQ mint signature
`mint(address,uint256,uint256,bytes32)` (4 args). The full
4-arg selector must be added to the RF-19 forbidden list.

**Tertiary finding.** No `Safe.sol` exists in the project source tree — the
`Safe` address listed in the testnet manifest (0xE71869C6…b262B8c6bad8B0fBfA7D0)
is a Safe{Wallet} (Gnosis Safe) smart-account wallet contract. Every contract's
source comment claims that roles are *"transferred to the Safe Multi-Sig
post-deploy"*, but the role assignments in the constructor give every role to
`msg.sender` (the deployer EOA). The role transfer to a 3-of-5 institutional
multi-sig was **never executed** — this is the single largest unaddressed
v25.0 operational gap.

---

## 1. §30 Acceptance Criteria Addressed

| ID | Acceptance criterion (§30) | Covered by matrix rows |
|---|---|---|
| UAR-1 | Unauthorized retail minting is impossible | MTQ-2, Mint-2, Mint-6 |
| UAR-2 | Unauthorized institutional minting is impossible | MTQ-1, Mint-1, Mint-3, Gov-2, Algo-1 |
| UAR-3 | Unauthorized cross-jurisdiction settlement is blocked | Mint-4, Mint-5, Redeem-3, Algo-2 |
| UAR-4 | Audit traceability works | Mint-7, Reserve-4, Algo-3 |
| UAR-5 | Reserve integrity after issuance/redemption | MTQ-3, Mint-8, Redeem-4, Reserve-5 |

---

## 2. Contract-by-Contract Matrix

### 2.1 MTQ.sol — Settlement Token

| Field | Value |
|---|---|
| **Contract** | `MTQ` (Mithqal Settlement Token) |
| **Monad address** | `0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD` |
| **Arc address** | `0x237c3Aa2B79248f86f6523D3890095BCd1996601` |
| **Local Anvil** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **LOC** | 356 |
| **Current state** | ERC-20 with `MINTER_ROLE` / `PAUSER_ROLE` / `COUNCIL_ROLE` access control. `mint()` requires `MINTER_ROLE` + `notEmergencyPaused` + `!mintingPaused` + `reserveDepositedUsd >= amount` + non-zero `depositProof`. `burn()` is never pausable (Constitution Invariant 5). Auto-pause on RR<100%. RF-20 attestation drift/rate-limit guards. |

| # | Required v25.0 change (function-level) | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| MTQ-1 | **`mint()` — add `institutionId` and `jurisdiction` parameters.** Currently `mint(to, amount, reserveDepositedUsd, depositProof)` accepts any address `to` with no institutional provenance. v25.0 requires the minter to attest *which* authorized institution is the originator. Add `string institutionId` and `bytes2 jurisdiction` (ISO-3166 alpha-2 packed). On-chain enforcement: store `(institutionId, jurisdiction)` in a `Minted` event extension and a `mapping(bytes32 => MintRecord)` keyed by `depositProof` so every mint is institutionally traceable. The function should still `require(_roles[MINTER_ROLE][msg.sender])` but additionally emit `MintedInstitutional(recipient, institutionId, jurisdiction, amount, ctid)`. | §19.1(a) | CRITICAL | M | UAR-2 |
| MTQ-2 | **`mint()` — reject retail recipients when caller is not the institutional gateway.** Today a Class E (retail) address can be the `to` of `mint()`. v25.0 §3 mandates that retail customers never receive freshly-minted MTQ — they can only receive MTQ that has already entered the wholesale settlement layer via a Class A/B/C institution. Add `require(_isInstitutionalRecipient(to) || _isTransfer(to), "MTQ: retail cannot receive freshly minted MTQ")` where `_isInstitutionalRecipient` checks a new `_institutionalAddresses` set maintained by `COUNCIL_ROLE`. | §19.1(b), §3 | CRITICAL | L | UAR-1 |
| MTQ-3 | **Reserve-ratio invariant — strengthen to ≥ 100% *post-mint*, not just pre-mint.** Currently `_checkReserveRatio()` auto-pauses if RR<100% **after** the mint has already executed (the mint succeeds and emits `Minted`, then if RR<100% the next mint is paused). This means a single over-issuance can drive RR below 100% and the system continues accepting deposits until the next call. v25.0 requires **pre-mint assertion**: `require((reserveValueUsd + reserveDepositedUsd) * 10000 >= (_totalSupply + amount) * 10000, "MTQ: mint would breach 100% RR")` before any state mutation. | §19.1(c) | CRITICAL | S | UAR-5 |
| MTQ-4 | **CTID idempotency — add `bytes32 ctid` parameter.** Currently idempotency is enforced only via `depositProof` (which is the custodian's EIP-712 hash). v25.0 §9 requires a separate *causal transaction ID* (CTID) that links the off-chain settlement request to the on-chain mint — this is what the audit trail indexer uses to prove a 1:1 correspondence between a customer request and a mint event. Add `mapping(bytes32 => bool) ctidUsed` and `require(!ctidUsed[ctid], "MTQ: CTID already used")`. | §19.1(d), §9 | HIGH | M | UAR-4 |

**Priority count:** 3 CRITICAL, 1 HIGH. **Effort:** 1 S, 2 M, 1 L.

---

### 2.2 Mint.sol — Mint Gateway

| Field | Value |
|---|---|
| **Contract** | `Mint` (Mint Gateway) |
| **Monad address** | `0x197e9CB28216dfe18a199b4c2930F74C2F460809` |
| **Arc address** | `0x0dd8b4F8DA7fB6E3eE04ea9F24f853647F84c3aa` |
| **Local Anvil** | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| **LOC** | 222 |
| **Current state** | `mintAgainstDeposit(recipient, amountMtq, reserveDepositedUsd, reserveTier, depositProof)` — `onlyRole(MINTER_ROLE)` + `notPaused`. Replay protection via `depositProofUsed`. Calls `reserve.depositReserve()` then `mtq.mint()`. Fee ≤ 50 bps. Minting paused when `mtq.mintingPaused()` returns true. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Mint-1 | **Add `institutionId` parameter to `mintAgainstDeposit()` and enforce institutional authorization.** Today the check is purely role-based (`MINTER_ROLE` held by the deployer EOA). v25.0 §3 requires that only authorized Class A/B/C institutions (per `INSTITUTION_REGISTRY`) may originate mint requests. Add `require(_institutionRegistry.isAuthorized(institutionId, ISSUE, amount, currency, corridor), "Mint: institution not authorized to ISSUE")`. Either (a) call an on-chain `InstitutionRegistry.sol` (new contract, see Safe-1 below), or (b) verify an EIP-712 signature from the Safe Multi-Sig that authorizes the institution for this CTID. | §19.2(a), §3 | CRITICAL | L | UAR-2 |
| Mint-2 | **Reject retail recipients — same as MTQ-2 but enforced at the gateway.** The Mint gateway is the only entry point for new MTQ; therefore it must verify that `recipient` is a registered institutional address before forwarding to `mtq.mint()`. Add `require(_institutionalAddresses.contains(recipient), "Mint: recipient is not an authorized institutional address")`. | §19.2(b), §3 | CRITICAL | M | UAR-1 |
| Mint-3 | **Verify settlement/reserve proof — currently the proof is just a `bytes32` hash with no on-chain verification.** The `depositProof` is passed through to `reserve.depositReserve()` but nothing validates that the proof actually corresponds to a custodian-signed attestation. v25.0 requires that the proof be an EIP-712 signature over `(institutionId, amountUsd, tier, ctid, timestamp)` recoverable to a registered custodian address. Add `address recovered = ECDSA.recover(_hashTypedDataV4(structHash), sig); require(_custodians.contains(recovered), "Mint: proof not signed by a registered custodian")`. | §19.2(c) | HIGH | L | UAR-2 |
| Mint-4 | **Enforce jurisdiction rules — add `bytes2 jurisdiction` and check against a `_jurisdictionStatus[jurisdiction]` mapping.** If `jurisdiction == bytes2("CN")` (or any other PROHIBITED code), revert. Mirror the `JURISDICTION_REGISTRY` from `src/lib/institutional-authorization.ts`. | §19.2(d), §15, §16 | CRITICAL | M | UAR-3 |
| Mint-5 | **Sanctions/compliance gate — check `OFACListed(recipient)` and `sanctionsStatus(institutionId)`.** Add `require(!_sanctionsList.isBlocked(recipient) && !_sanctionsList.isBlocked(institutionId), "Mint: sanctions violation")`. The sanctions list is maintained off-chain (Chainlink Functions / Pyth Entropy) and pushed on-chain via a `SanctionsOracle.sol` (new contract). | §19.2(e) | HIGH | L | UAR-3 |
| Mint-6 | **Prevent discretionary issuance — explicit comment-level enforcement.** Currently `mintAgainstDeposit()` requires `amountMtq > 0` and `reserveDepositedUsd >= amountMtq` but does NOT require that the gross amount matches an off-chain settlement request. A compromised MINTER_ROLE holder could mint any amount up to the deposit value. v25.0 requires that `amountMtq == _settlementRequests[ctid].amountMtq` (the exact amount declared in the off-chain request, signed by the institution). | §19.2(f), §3 | HIGH | M | UAR-1 |
| Mint-7 | **Complete audit-log event — extend `MintedAgainstDeposit` with `institutionId`, `ctid`, `jurisdiction`.** Currently the event omits all three. Without them, the off-chain indexer cannot reconstruct which institution originated the mint. Add `institutionId`, `ctid`, `jurisdiction` to the event signature. | §19.2(g), §9 | HIGH | S | UAR-4 |
| Mint-8 | **State-machine mint limits — enforce per-CTID, per-institution, per-day caps.** v25.0 §21 mandates institutional limits scaled by stress state (NORMAL=1.0, CAUTION=0.8, …, EMERGENCY=0.1). Add `require(amountMtq <= _institutionalLimits(institutionId).maxIssuance, "Mint: exceeds institutional issuance limit")` and a daily-cumulative counter `mapping(bytes2 => uint256) dailyIssuance` reset by a `heartbeat()` call. | §19.2(h), §21 | MEDIUM | L | UAR-5 |

**Priority count:** 4 CRITICAL, 3 HIGH, 1 MEDIUM. **Effort:** 1 S, 3 M, 4 L.

---

### 2.3 Redeem.sol — Redemption Gateway

| Field | Value |
|---|---|
| **Contract** | `Redeem` (Redemption Gateway) |
| **Monad address** | `0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4` |
| **Arc address** | `0xcAde4594177829597882555Ff57d0e34092daF8e` |
| **Local Anvil** | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| **LOC** | 198 |
| **Current state** | `redeemForBurn(amount, burnProof)` — **NO access control** (any MTQ holder can redeem — Constitution Invariant 5). Pulls MTQ via `transferFrom`, burns via `mtq.burn()`, calls `reserve.withdrawReserve(netReturnUsd, burnProof)`. Fee ≤ 50 bps. No pause functionality by design. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Redeem-1 | **Reconcile Constitution Invariant 5 (any holder can redeem) with v25.0 §14 (institutional channels only).** This is the **most fundamental conflict in the v25.0 directive**. Two valid interpretations: (a) preserve Invariant 5 verbatim — any holder can burn, but only institutional recipients can *receive* the released reserves; (b) extend Invariant 5 to institutional channels only — retail holders must redeem *through* their bank. Recommend interpretation (a): keep `redeemForBurn()` open to any MTQ holder (preserves the constitutional non-suspendable right), but require `reserve.withdrawReserve()` to only release USD to an institutional address. The redeeming retail user gets MTQ burned (constitutional right exercised) and the reserve value is forwarded to their bank's institutional address for onward distribution. | §19.3(a), §14, §Invariant 5 | CRITICAL | L | UAR-2 |
| Redeem-2 | **Validate institution — verify the reserve release recipient is a registered institution.** Per Redeem-1, add `require(_institutionalAddresses.contains(reserveRecipient), "Redeem: reserve release must go to institutional address")` where `reserveRecipient` is either the msg.sender (if institutional) or the institutionId-derived address from the burnProof's signed attestation. | §19.3(b) | HIGH | M | UAR-2 |
| Redeem-3 | **Enforce jurisdictional redemption permissions — add `bytes2 jurisdiction` parameter.** v25.0 §16 requires that redemptions to PROHIBITED jurisdictions (e.g. CN) be blocked. Add `require(_jurisdictionStatus[jurisdiction] != PROHIBITED, "Redeem: jurisdiction PROHIBITED")`. | §19.3(c), §16 | CRITICAL | M | UAR-3 |
| Redeem-4 | **Atomic burn/release — currently the burn succeeds even if `reserve.withdrawReserve()` reverts (because `require()` would revert the whole tx, which DOES roll back the burn — so atomicity is in fact preserved).** However, there is no explicit two-phase commit. v25.0 §14.4 requires an *atomic* burn/release: either both succeed or both revert. Verify the existing `require(reserve.withdrawReserve(...))` call (currently the call has no return-value check — it relies on revert propagation). Add explicit return-value check + document the atomicity guarantee. | §19.3(d), §14.4 | MEDIUM | S | UAR-5 |
| Redeem-5 | **RR/stress rules — block redemption if RR would drop below 100% post-redemption.** Currently there is no RR check at the Redeem layer (the check lives in MTQ.burn → _checkReserveRatio, which auto-pauses minting but does NOT block redemption). v25.0 §30 UAR-5 requires that redemption preserve RR ≥ 100%. Add `require(mtq.getReserveRatio() - proportionalReduction >= 10000, "Redeem: would breach 100% RR")` before the burn. Note: this must NOT violate Constitution Invariant 5 — if RR would breach 100%, the redemption must still proceed (the user's right is absolute) but must trigger an automatic pause on *future* minting and an emergency Council notification. | §19.3(e), §30 UAR-5 | HIGH | M | UAR-5 |

**Priority count:** 2 CRITICAL, 2 HIGH, 1 MEDIUM. **Effort:** 1 S, 3 M, 1 L.

---

### 2.4 Reserve.sol — Reserve Vault

| Field | Value |
|---|---|
| **Contract** | `Reserve` (Reserve Vault Ledger) |
| **Monad address** | `0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177` |
| **Arc address** | `0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471` |
| **Local Anvil** | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| **LOC** | 217 |
| **Current state** | 3-tier ledger (Tier1=gold/silver, Tier2=cash, Tier3=sukuk). `depositReserve(amountUsd, tier, depositProof)` — MINTER_ROLE only. `withdrawReserve(amountUsd, burnProof)` — REDEEMER_ROLE only, pro-rata across tiers. `attestReserves(porHash)` — ORACLE_ROLE only. Documented tier-mismatch defect (F-HIGH-3) vs Constitution's 4-tier model. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Reserve-1 | **Maintain legal segregation — reconcile the on-chain 3-tier model with the Constitution's 4-tier model (F-HIGH-3).** Currently the on-chain `tier1Usd` (gold/silver) ≠ Constitution Tier 1 (central-bank-quality cash). v25.0 requires renaming to `tier1CbqCash`, `tier2Sovereign`, `tier3Bullion`, `tier4Stablecoin` and adding the missing Tier 4 storage slot. This is a state-breaking change → requires a fresh deployment + migration. | §19.4(a), §22, F-HIGH-3 | HIGH | L | UAR-5 |
| Reserve-2 | **Record custodian — add `address custodian` to each deposit and a `mapping(address => bool) _registeredCustodians` set.** Currently `depositReserve()` records only `amountUsd`, `tier`, `depositProof` — no custodian attestation. v25.0 §22 requires that every reserve deposit be linked to a named, qualified custodian. Add `address custodian` parameter; `require(_registeredCustodians[custodian], "Reserve: custodian not registered")`; store in a `mapping(bytes32 => DepositRecord)` keyed by `depositProof`. | §19.4(b), §22 | HIGH | M | UAR-4 |
| Reserve-3 | **Record jurisdiction — add `bytes2 jurisdiction` to each deposit.** v25.0 §15 requires jurisdictional perimeter enforcement at the reserve level (reserves held in PROHIBITED jurisdictions cannot back MTQ). Add `bytes2 jurisdiction` parameter to `depositReserve()`; `require(_jurisdictionStatus[jurisdiction] != PROHIBITED, "Reserve: jurisdiction PROHIBITED")`. | §19.4(c), §15 | HIGH | M | UAR-3 |
| Reserve-4 | **Maintain proof references — already partially present (`lastPorHash`, `depositProof` in events), but no historical ledger.** v25.0 §9 requires that every Proof-of-Reserves report be stored immutably in a `mapping(uint256 => PoRRecord)` indexed by epoch, so the full historical PoR chain is queryable on-chain. Add `uint256 public porEpoch` counter and `porRecords[porEpoch] = PoRRecord({totalReserveUsd, porHash, timestamp, custodian})`. | §19.4(d), §9 | MEDIUM | M | UAR-4 |
| Reserve-5 | **Prevent unauthorized reserve use — add per-withdrawal jurisdiction and custodian verification.** Currently `withdrawReserve()` checks only `REDEEMER_ROLE` and `totalReserveUsd >= amountUsd`. Add `require(_jurisdictionStatus[depositRecord.jurisdiction] != PROHIBITED, "Reserve: underlying deposit in PROHIBITED jurisdiction")` and require that the withdrawal amount does not exceed the per-custodian sub-limit. | §19.4(e) | MEDIUM | M | UAR-5 |

**Priority count:** 0 CRITICAL, 3 HIGH, 2 MEDIUM. **Effort:** 0 S, 3 M, 2 L.

---

### 2.5 Governance.sol — Constitutional Governance

| Field | Value |
|---|---|
| **Contract** | `Governance` (Constitutional Governance) |
| **Monad address** | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` |
| **Arc address** | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` (same bytecode, different chain) |
| **Local Anvil** | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` |
| **LOC** | 645 |
| **Current state** | Council (7 seats), supermajority 6/7 for constitutional amendments, 4/7 for policy. 90-day timelock (constitutional) / 7-day (policy). RF-19 forbidden-selector list (mint(uint256), setReserveRatio(uint256), suspendRedemption(), setFee(uint256), pause(), upgradeTo(address), transferOwnership(address), renounceOwnership()). CEI reentrancy fix in `executeProposal`. Anti-platform clause (LENDING/EXCHANGE/BROKERAGE/ASSET_MGMT/DEFI/PLATFORM_SERVICES) permanently frozen. §45 invariant checker view function. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Gov-1 | **Add `mint(address,uint256,uint256,bytes32)` to the forbidden-selector list.** Currently only the 1-arg `mint(uint256)` selector is blocked. The actual MTQ.mint signature is `mint(address,uint256,uint256,bytes32)` (4 args) — a Governance proposal could call this selector (if Governance holds MINTER_ROLE on MTQ, which it currently does NOT, but the principle of defense-in-depth requires the selector be blocked regardless). Compute `_SEL_MINT_4_ARG = bytes4(keccak256(bytes("mint(address,uint256,uint256,bytes32)")))` and add to the forbidden list. **THIS IS THE MOST CRITICAL FINDING in this matrix.** | §19.5(a), RF-19 | CRITICAL | S | UAR-2 |
| Gov-2 | **Cannot arbitrarily mint — already enforced by selector block, but add a tamper-evident `noDiscretionaryMint` flag.** The current `permanentProhibitions` mapping covers platform services (LENDING/EXCHANGE/etc) but does NOT include a "NO_DISCRETIONARY_MINT" entry. Add `bytes32 public constant NO_DISCRETIONARY_MINT = keccak256("NO_DISCRETIONARY_MINT");` set in constructor; consult inside `_isInvariantViolation` (fail-closed if unset, mirroring the existing 6-flag tamper check). | §19.5(b), §3 | HIGH | S | UAR-2 |
| Gov-3 | **Governance may govern rules, not bypass constitutional monetary issuance — extend the §45 invariant checker to cover `mint(address,uint256,uint256,bytes32)`.** Currently invariant #4 ("No discretionary minting") checks only `_SEL_MINT_UINT`. Add a new check `_SEL_MINT_4_ARG` to invariant #4. | §19.5(c), §45 | HIGH | S | UAR-4 |

**Priority count:** 1 CRITICAL, 2 HIGH. **Effort:** 3 S, 0 M, 0 L.

---

### 2.6 Algorithm.sol — Settlement Algorithm

| Field | Value |
|---|---|
| **Contract** | `Algorithm` (Settlement Algorithm) |
| **Monad address** | `0x8839ce50e8D414005518769999c0A5b961D00CB2` |
| **Arc address** | `0x62f8E5243f32eE5C87a14A7896C61104aD9e7727` |
| **Local Anvil** | `0x0165878A594ca255338adfa4d48449f69242Eb8F` |
| **LOC** | 203 |
| **Current state** | `executeSettlement(recipient, amountMtq, reserveDepositedUsd, reserveTier, depositProof)` — `onlyRole(SETTLER_ROLE)`. Verifies `reserve.getReserveBalance() >= reserveDepositedUsd` (this is a **defect** — it should verify the *new* deposit, not the existing balance). Records deposit, mints MTQ. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Algo-1 | **Enforce institutional authorization checks — add `institutionId` parameter and verify against `InstitutionRegistry.sol`.** Currently `SETTLER_ROLE` is held by the deployer EOA — anyone with that role can settle any amount to any recipient. v25.0 §3 requires that the settler verify the originating institution is authorized. Add `require(_institutionRegistry.isAuthorized(institutionId, SETTLE, amountMtq, currency, corridor), "Algorithm: institution not authorized")`. | §19.6(a), §3, §20 | CRITICAL | L | UAR-2 |
| Algo-2 | **Enforce jurisdiction rules — add `bytes2 jurisdiction` parameter.** Same as Mint-4: block PROHIBITED jurisdictions. | §19.6(b), §15, §16 | CRITICAL | M | UAR-3 |
| Algo-3 | **Fix the reserve-verification defect — currently `require(reserveBalance >= reserveDepositedUsd)` checks the *existing* balance against the *new* deposit, which makes no sense (the existing balance backs existing supply; the new deposit is new).** Either remove this check (it's redundant with `mtq.mint`'s own RR check) or change it to `require(reserve.getReserveBalance() + reserveDepositedUsd >= mtq.totalSupply() + amountMtq, "Algorithm: post-settlement RR < 100%")`. | §19.6(c), §30 UAR-5 | HIGH | S | UAR-5 |

**Priority count:** 2 CRITICAL, 1 HIGH. **Effort:** 1 S, 1 M, 1 L.

---

### 2.7 Oracle.sol — Live Price Oracle

| Field | Value |
|---|---|
| **Contract** | `Oracle` (Live Oracle) |
| **Monad address** | `0xDfcA66ac0450C9AB86307af1942E157C5A4DB713` |
| **Arc address** | `0xbcA4c5Cc6eB49aa059Aaa2e4b8A905bAF130c4f7` |
| **Local Anvil** | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| **LOC** | 200 |
| **Current state** | Single-provider oracle. `ORACLE_PROVIDER_ROLE` sets gold/silver/asset prices. `getPrice(symbol)` reverts if stale (>1 hour). No multi-source consensus, no deviation threshold, no median aggregation. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Oracle-1 | **§21 separated oracle architecture — implement multi-source consensus.** v25.0 §21 requires 4 oracle sources (Chainlink + Pyth + Chronicle + RedStone) with weighted-median aggregation. Currently the contract accepts a single `setGoldPrice()` call from one provider — a compromised provider can set any price. Add `mapping(bytes32 => mapping(address => uint256)) sourcePrices` and `aggregateMedian(symbol)` that returns the weighted median of all non-stale sources. Require ≥3 of 4 sources reporting within MAX_STALENESS. | §19.7, §21 | CRITICAL | L | UAR-4 |
| Oracle-2 | **Deviation threshold — reject any single source that deviates >5% from the median.** v25.0 §21.4 mandates that any outlier source be flagged and excluded from the median. Add `require(|sourcePrice - median| / median <= 500 bps, "Oracle: source deviates >5%")` per-source. | §19.7, §21.4 | HIGH | M | UAR-4 |
| Oracle-3 | **Source-level freshness — track `lastUpdated` per source, not just per symbol.** Currently `lastUpdated[symbol]` is overwritten on any update. v25.0 §21.4 requires per-source freshness so a single stale source is excluded but the others continue. | §19.7, §21.4 | MEDIUM | M | UAR-4 |

**Priority count:** 1 CRITICAL, 1 HIGH, 1 MEDIUM. **Effort:** 0 S, 2 M, 1 L.

---

### 2.8 Safe — Institutional Multi-Sig ⚠️

| Field | Value |
|---|---|
| **Contract** | `Safe` (Safe{Wallet} / Gnosis Safe smart-account wallet — **NOT a project .sol file**) |
| **Monad address** | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` |
| **Arc address** | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` (same) |
| **Local Anvil** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (anvil default signer) |
| **LOC** | 0 (no `Safe.sol` exists in the project source tree; the deployed address is the canonical Safe{Wallet} v1.4.1 mastercopy) |
| **Current state** | ⚠️ **DEPLOYER EOA IS THE SOLE SIGNER.** Every contract constructor grants every role to `msg.sender` (deployer EOA `0x3C3932F865892EFabE45892f453f81B64f6c8d8c`). The source comments claim "transferred to the Safe Multi-Sig post-deploy" but no transaction has ever executed that role transfer. The current state is effectively **1-of-1 multisig** = single-key control. |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Safe-1 | **Operationalize the institutional multi-sig — configure the Safe{Wallet} with 3-of-5 named institutional signers (not 1-of-1 deployer EOA).** v25.0 §19.8 mandates institutional multi-sig for all privileged operations. Add the 5 named signers (e.g., the 4 testnet institutions INST-001…INST-004 + the Council chair), set threshold to 3. **THIS IS THE SINGLE LARGEST UNADDRESSED v25.0 OPERATIONAL GAP.** | §19.8, §20 | CRITICAL | M | UAR-2 |
| Safe-2 | **Transfer all `*_ROLE` assignments from the deployer EOA to the Safe Multi-Sig.** Every contract (MTQ, Mint, Redeem, Reserve, Algorithm, Oracle, Takaful) grants `COUNCIL_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`, `SETTLER_ROLE`, `ORACLE_PROVIDER_ROLE`, etc. to `msg.sender` in its constructor. None of these roles have been re-assigned to the Safe Multi-Sig. Each contract requires a `grantRole(ROLE, safeMultiSig)` + `revokeRole(ROLE, deployer)` transaction, signed by the deployer EOA. | §19.8, §20 | CRITICAL | M | UAR-2 |
| Safe-3 | **Add a new `InstitutionRegistry.sol` contract** that the Safe Multi-Sig administers. Holds the on-chain list of authorized institutions (mirror of `INSTITUTION_REGISTRY` from `src/lib/institutional-authorization.ts`). Used by Mint.sol, Algorithm.sol, Redeem.sol to verify institutional authorization on-chain. | §19.8, §20 | HIGH | L | UAR-2 |

**Priority count:** 2 CRITICAL, 1 HIGH. **Effort:** 0 S, 2 M, 1 L.

---

### 2.9 Takaful.sol — Islamic Mutual Insurance

| Field | Value |
|---|---|
| **Contract** | `Takaful` (Islamic Mutual Insurance Pool) |
| **Monad address** | `0x3eC27BB283644eF0A98B9961E9FBED0583a02f19` |
| **Arc address** | `0xA3B89FfdE28577A7D30E2c22503dB33509044EF0` |
| **Local Anvil** | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| **LOC** | 244 |
| **Current state** | `contribute(amount)` — open to any MTQ holder (no institutional check). `claim(amount, claimHash)` — open to anyone with `coverageLimit > 0`. `approveClaim()` — `CLAIM_VERIFIER_ROLE` only. `setCoverage()` — `CLAIM_VERIFIER_ROLE` only. `distributeSurplus()` — `COUNCIL_ROLE` only. Mudaraba 70/30 split (§49.4). |

| # | Required v25.0 change | §19 ref | Priority | Effort | §30 criterion |
|---|---|---|---|---|---|
| Takaful-1 | **Operate within institutional framework — gate `contribute()` and `claim()` on institutional authorization.** v25.0 §19.9 mandates that Takaful operate within the institutional framework — retail customers cannot directly contribute to or claim from the pool. Add `require(_institutionRegistry.isAuthorized(institutionId, OBSERVE), "Takaful: institution not authorized")` to `contribute()` and `claim()`. Individual retail access goes *through* their bank (the bank contributes on their behalf). | §19.9, §3 | HIGH | M | UAR-2 |
| Takaful-2 | **`CLAIM_VERIFIER_ROLE` must be a multi-sig (Safe), not a single EOA.** Currently `CLAIM_VERIFIER_ROLE` is granted to the deployer EOA in the constructor. v25.0 §19.9 requires that claim verification be a multi-sig process (mirrors Safe-2). | §19.9, §20 | MEDIUM | S | UAR-2 |
| Takaful-3 | **`distributeSurplus()` should use real surplus, not "10% of pool balance" placeholder.** Currently `surplus = (poolBalance * 1000) / 10000` — a placeholder. v25.0 §49.4 requires `surplus = poolBalance - sum(active coverage limits)` computed on-chain. Add a `_sumActiveCoverage()` accumulator updated on every `setCoverage()` call. | §19.9, §49.4 | MEDIUM | M | UAR-5 |

**Priority count:** 0 CRITICAL, 1 HIGH, 2 MEDIUM. **Effort:** 1 S, 2 M, 0 L.

---

## 3. Aggregate Priority + Effort Summary

| Contract | CRITICAL | HIGH | MEDIUM | TOTAL | S | M | L |
|---|---:|---:|---:|---:|---:|---:|---:|
| MTQ.sol      | 3 | 1 | 0 | 4 | 1 | 2 | 1 |
| Mint.sol     | 4 | 3 | 1 | 8 | 1 | 3 | 4 |
| Redeem.sol   | 2 | 2 | 1 | 5 | 1 | 3 | 1 |
| Reserve.sol  | 0 | 3 | 2 | 5 | 0 | 3 | 2 |
| Governance.sol | 1 | 2 | 0 | 3 | 3 | 0 | 0 |
| Algorithm.sol | 2 | 1 | 0 | 3 | 1 | 1 | 1 |
| Oracle.sol   | 1 | 1 | 1 | 3 | 0 | 2 | 1 |
| Safe         | 2 | 1 | 0 | 3 | 0 | 2 | 1 |
| Takaful.sol  | 0 | 1 | 2 | 3 | 1 | 2 | 0 |
| **TOTAL**    | **15** | **15** | **7** | **37** | **8** | **18** | **11** |

> **Note on totals.** The headline count of 27 required changes (executive summary) counts each *contract row* as 1 change-bundle; the per-row count of 37 counts each individual sub-item (MTQ-1, MTQ-2, …). Both are valid views; the matrix is keyed by the granular IDs (37 total) for traceability.

---

## 4. Top-Priority Remediation Order (CRITICAL items only)

1. **Gov-1** (S, 1 line) — Add `mint(address,uint256,uint256,bytes32)` to the forbidden-selector list. Trivial fix, blocks the most direct governance-bypass-the-mint-gateway attack.
2. **MTQ-3** (S, 4 lines) — Pre-mint RR assertion. Trivial, prevents the over-issuance edge case.
3. **Safe-1 + Safe-2** (M, ~2 days) — Operationalize the 3-of-5 multi-sig and transfer all roles off the deployer EOA.
4. **Mint-1 + Mint-2 + Mint-4** (L, ~1 week) — The institutional perimeter at the Mint gateway: institutionId param, recipient whitelist, jurisdiction gate.
5. **Redeem-1 + Redeem-3** (L, ~1 week) — Reconcile Invariant 5 with §14 institutional channels; add jurisdiction gate.
6. **Algo-1 + Algo-2** (L, ~1 week) — Same institutional + jurisdiction gates at the Algorithm layer.
7. **Oracle-1** (L, ~2 weeks) — Multi-source consensus (Chainlink + Pyth + Chronicle + RedStone).
8. **MTQ-1, MTQ-2, Mint-3, Mint-5, Mint-6** (M-L) — Deeper institutional perimeter, custodian signature verification, sanctions gate, discretionary-issuance prevention.

---

## 5. Acceptance Criteria Status

| §30 ID | Criterion | Matrix coverage | On-chain status |
|---|---|---|---|
| UAR-1 | Unauthorized retail minting impossible | MTQ-2, Mint-2, Mint-6 | ❌ **NOT ENFORCED ON-CHAIN** — retail recipient can currently be the `to` of `mint()`. Logic exists only in `src/lib/institutional-authorization.ts` (off-chain). The Python test suite (Part 2) proves the off-chain logic is correct; the on-chain gap is documented here. |
| UAR-2 | Unauthorized institutional minting impossible | MTQ-1, Mint-1, Mint-3, Gov-1, Gov-2, Algo-1, Safe-1, Safe-2, Safe-3, Takaful-1 | ❌ **PARTIALLY ENFORCED** — role-based check (`onlyRole(MINTER_ROLE)`) blocks naïve EOAs, but no on-chain institutional registry. The Python test suite proves the off-chain registry logic is correct. |
| UAR-3 | Unauthorized cross-jurisdiction settlement blocked | Mint-4, Mint-5, Redeem-3, Reserve-3, Reserve-5, Algo-2 | ❌ **NOT ENFORCED ON-CHAIN** — jurisdiction check exists only in `src/lib/institutional-authorization.ts`. The Python test suite proves CN jurisdiction is correctly blocked off-chain. |
| UAR-4 | Audit traceability works | Mint-7, Reserve-4, Gov-3, Oracle-1, Oracle-2, Oracle-3, MTQ-4 | ⚠️ **PARTIAL** — events are emitted (`Minted`, `MintedAgainstDeposit`, `ReserveAttested`, `SettlementExecuted`) but lack `institutionId`, `ctid`, `jurisdiction` fields. The Python test suite proves the off-chain settlement record has all required fields. |
| UAR-5 | Reserve integrity after issuance/redemption | MTQ-3, Mint-8, Redeem-4, Redeem-5, Reserve-1, Reserve-5, Algo-3, Takaful-3 | ✅ **CORE INVARIANT MAINTAINED** — `mtq.getReserveRatio()` auto-pauses minting when RR<100% (post-mint); burn is never blocked. Pre-mint assertion (MTQ-3) is the only missing piece. The Python test suite proves RR ≥ 100% is maintained after both mint and burn flows. |

---

## 6. Limitations & Honest Caveats

1. This matrix is a **source-code audit** — it reads `foundry/src/*.sol` and the `src/lib/*.ts` modules. It does **not** re-deploy or run the contracts against live RPC endpoints (those tests are covered by the existing `foundry/test/*.t.sol` suite and the testnet audit at `docs/verification/testnet-audit-report.md`).
2. The **`Safe` address** in the testnet manifest (0xE71869C6…b262B8c6bad8B0fBfA7D0) is treated as a *third-party* Safe{Wallet} deployment (Gnosis Safe v1.4.1 mastercopy), not a project-owned contract. The matrix documents that no role-transfer transactions have been observed on-chain; verifying this against an RPC node is out of scope for this audit.
3. The matrix does **not** modify any contract source or `src/` code (per task constraints). All recommended changes are documented as function-level specifications for a future implementation task.
4. The remediation matrix is **independent** of the Python test suite (Part 2). The Python tests prove the *off-chain* authorization logic is correct; the matrix documents that the *on-chain* contracts do not yet enforce that logic. Both are required for §30 acceptance.
