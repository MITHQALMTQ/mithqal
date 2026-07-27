# Post-Quantum Migration Roadmap — Mithqal Constitution §39

> **Status**: Living document — maintained by the Formation Committee
> **Owner**: Council Custodian (Safe Multi-Sig `0xE718…7a7D0`)
> **Constitutional Mandate**: §39 — Falcon-512 by 2029
> **Last Updated**: 2026 (initial publication)

---

## 1. Current State

| Item | Value |
|---|---|
| **Signature scheme** | ECDSA on secp256k1 (standard Ethereum) |
| **Public key size** | 33 bytes (compressed) / 64 bytes (uncompressed) |
| **Signature size** | 65 bytes (r, s, v) |
| **Verification gas** | ~3,000 gas (ecrecover precompile) |
| **Vulnerability** | Shor's algorithm (quantum) breaks ECDSA in polynomial time |
| **Quantum threat timeline** | Cryptographically-relevant quantum computers (CRQCs) expected 2030–2035 |
| **Constitution §39 mandate** | Falcon-512 signature support by 2029 |

The Mithqal Settlement Token (MTQ), the Governance contract, and the Reserve
Oracle all currently rely on standard ECDSA signatures verified by the
`ecrecover` precompile. This is the same scheme used by every Ethereum
Externally Owned Account (EOA). Any quantum adversary with a sufficiently
large fault-tolerant quantum computer (est. 6,000+ logical qubits) can derive
the private key from a public key using Shor's algorithm in polynomial time,
forging signatures and seizing token balances.

The Constitution (§39) requires that **all signature verification surfaces
migrate to Falcon-512 (NIST FIPS 206) by 2029**. This document is the plan
to meet that mandate without compromising any of the 5 constitutional
invariants — in particular, Invariant 5 (redemption never suspends): the
migration MUST NOT introduce any pause window on `burn()`.

---

## 2. Migration Strategy: UUPS Proxy Pattern

Mithqal's core contracts are **deliberately non-upgradeable** — the
Constitution enshrines immutability for the MTQ token logic, the reserve
ratio guard, and the burn() non-pausability invariant. The Council cannot
rewrite the Constitution.

**Exception**: The *signature verification layer* — the only component that
must change to support post-quantum signatures — will use a **UUPS
(ERC-1822) proxy**. This allows swapping the signature verification
implementation (ECDSA → Falcon-512) without redeploying the core MTQ
contract or touching any of its constitutional invariants.

```
                       ┌─────────────────────────────┐
                       │      MTQ Token (immutable)  │
                       │  · ERC-20 logic             │
                       │  · burn() — NEVER pausable  │
                       │  · Reserve ratio guard      │
                       └──────────────┬──────────────┘
                                      │
                       ┌──────────────▼──────────────┐
                       │   UUPS Proxy (ERC-1822)     │
                       │   · forwards calls          │
                       │   · upgrade authority =     │
                       │     Safe Multi-Sig (Council)│
                       └──────────────┬──────────────┘
                                      │
                       ┌──────────────▼──────────────┐
                       │  SignatureVerifier impl     │
                       │   · v1: ECDSA (ecrecover)   │
                       │   · v2: Falcon-512 (2029)   │
                       │   · v3: dual-mode (2030+)   │
                       └─────────────────────────────┘
```

**Upgrade authority**: The Safe Multi-Sig (`0xE718…7a7D0`) — same key
that holds the Council's COUNCIL_ROLE on MTQ. Any upgrade requires a
supermajority (§45) AND a 48-hour timelock window (so redemption holders
can react if they disagree with the upgrade).

**Rollback path**: Every upgrade ships with a known-good rollback
implementation hash. If the new implementation fails its post-upgrade
health check (a burned-in invariant test that exercises all 5
constitutional invariants), the timelock auto-rolls back within 1 hour.

---

## 3. Falcon-512 Overview

| Property | ECDSA (secp256k1) | Falcon-512 |
|---|---|---|
| Security assumption | Discrete logarithm (broken by Shor) | Shortest integer solution (SIS) over NTRU lattices |
| Security level | ~128-bit classical, **0-bit quantum** | NIST Level 1 (~AES-128 equivalent, **quantum-safe**) |
| Public key size | 33 bytes (compressed) | **896 bytes** (~27× larger) |
| Signature size | 65 bytes (r, s, v) | **~666 bytes** (~10× larger) |
| Verification gas (EVM) | ~3,000 (precompile) | ~3,000,000 (Solidity verifier, est.) — drops to ~50,000 with native precompile |
| Signing speed | Microseconds | Slower (FFT-based) — acceptable for client-side wallets |
| Verification speed | Microseconds | Slower but parallelizable |
| Standardization | secp256k1 (SEC2) | NIST FIPS 206 (final, 2024) |
| EIP support | EIP-2 (built-in) | EIP-7212 is P-256, NOT Falcon — Falcon has no EIP yet |

**Why Falcon over Dilithium?** Both were NIST-selected. Dilithium has
simpler implementation but ~2.7 KB signatures. Falcon's ~666-byte
signatures are critical for an on-chain token where calldata is the
dominant gas cost. The trade-off is implementation complexity (Falcon
uses floating-point FFT, harder to implement in constant time).

**Note on EIP-7212**: EIP-7212 is a precompile for **secp256r1 (P-256)**,
not Falcon. P-256 is a classical elliptic curve — also broken by Shor.
EIP-7212 is a stepping stone (cheaper signature verification for WebAuthn
passkeys), NOT a post-quantum solution. It is mentioned here only to
clarify that it does NOT satisfy §39.

---

## 4. Implementation Phases

### Phase 1: Preparation (2026 Q4 — 2027 Q1)

**Goal**: Architectural readiness — no behavioral change.

- [ ] Deploy a `MTQProxy` UUPS wrapper contract on Monad testnet that
      forwards all calls to the existing MTQ token (v1 = ECDSA verifier).
- [ ] Wire the proxy's upgrade authority to the Council's Safe Multi-Sig.
- [ ] Implement the 48-hour timelock + 1-hour auto-rollback circuit.
- [ ] Write an on-chain `invariant()` test that runs the 5 constitutional
      invariants (esp. burn non-pausability) after every upgrade.
- [ ] Run a full upgrade + rollback drill on testnet.

**Exit criteria**: Proxy deployed, upgrade + rollback tested end-to-end,
zero changes to user-facing behavior.

**Honest assessment**: This is implementable today with OpenZeppelin's
`UUPSUpgradeable` (already vendored in `/foundry/lib/openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol`).
No novel cryptography required.

---

### Phase 2: Signature Abstraction (2027 Q2 — Q3)

**Goal**: Decouple signature verification from the token contract.

- [ ] Deploy an ERC-4337 (Account Abstraction) bundler for Mithqal users.
- [ ] Allow wallets to use ANY signature scheme via the bundler —
      ECDSA today, Falcon/PQC tomorrow.
- [ ] Users with PQ wallets can interact with MTQ without any changes to
      the token contract itself.
- [ ] Document a "Mithqal-compatible PQ wallet" spec: which Falcon
      implementations we accept, how the signature is encoded in
      `UserOperation.signature`.

**Exit criteria**: At least one Falcon-512 wallet (e.g., a modified
Safe wallet) can hold and transfer MTQ on testnet via the bundler.

**Honest assessment**: ERC-4337 is live on Ethereum mainnet; the
infrastructure exists. The novel work is (a) writing a Falcon-512
validator module for the bundler and (b) coordinating with Monad on
native precompile support. Both are tractable in 2027.

---

### Phase 3: Falcon-512 Integration (2027 Q4 — 2028 Q1)

**Goal**: Falcon-512 is a first-class signature scheme on MTQ.

- [ ] Deploy a `Falcon512Verifier` contract (Solidity implementation
      reading the public key + signature from calldata).
- [ ] Add a `verifyFalconSignature()` function to the UUPS proxy.
- [ ] Allow governance proposals (Governance.sol) to be signed with
      Falcon-512 — i.e., Council members can vote from a PQ wallet.
- [ ] Coordinate with Monad on a native Falcon precompile (cuts
      verification gas from ~3M to ~50K). If unavailable, fall back to
      the Solidity verifier.
- [ ] Publish the Falcon public key registry: every MTQ holder who has
      migrated has their Falcon pubkey associated with their EOA.

**Exit criteria**: Council can pass a governance proposal using only
Falcon-512 signatures. Token holders can optionally migrate.

**Honest assessment**: A pure-Solidity Falcon verifier is the hard part.
Open-source implementations exist (e.g., `falcon-solidity` by various
academic groups) but most are un-audited and consume 3–5M gas. A native
precompile is the right long-term answer — we will petition Monad for
this. If Monad declines, we will petition Ethereum via a new EIP.

---

### Phase 4: Migration + Deprecation (2028 Q2 — 2029 Q1)

**Goal**: All active governance participants migrated to Falcon-512.

- [ ] Announce ECDSA deprecation timeline (6-month notice) via a
      constitutional announcement signed by the Council with BOTH
      ECDSA and Falcon-512 keys (so users can verify the announcement
      with either scheme during the transition).
- [ ] Ship a migration tool: a user signs a one-time message with both
      their ECDSA key and their new Falcon-512 key, registering the
      Falcon pubkey against their EOA in the on-chain registry.
- [ ] After the migration window, reject ECDSA signatures on
      governance proposals (require Falcon-512 for voting).
- [ ] Token transfers remain ECDSA-compatible (backward compat) —
      users who never migrated can still transfer and burn. This is
      required by Invariant 5: redemption never suspends.

**Exit criteria**: 95%+ of governance voting weight is on Falcon-512
wallets. ECDSA is deprecated for governance, still works for transfers.

**Honest assessment**: This is the riskiest phase — it requires
coordinated user action. The 6-month window is generous; if adoption
lags, the Council may extend by amendment (§45, supermajority).

---

### Phase 5: Full Post-Quantum (2029 Q2+)

**Goal**: All new governance activity is quantum-safe.

- [ ] All new governance proposals require Falcon-512 signatures
      to vote.
- [ ] ECDSA remains supported ONLY for token transfers and burns
      (backward compat for unmigrated holders — Invariant 5 forbids
      blocking redemption).
- [ ] Monitor quantum computing advances monthly. If a credible
      Shor-style attack on secp256k1 is published, accelerate the
      remaining transfer-migration (this would require a §45
      amendment to make Falcon mandatory for transfers too).

**Exit criteria**: §39 satisfied. Mithqal's governance layer is
fully quantum-resistant.

**Honest assessment**: "Full" post-quantum (including transfers) may
not be achievable without breaking backward compatibility — and the
Constitution forbids breaking Invariant 5. So "full" means
"governance is PQ; transfers remain ECDSA until quantum computers
materially threaten ECDSA", at which point a §45 amendment
authorizes mandatory transfer migration.

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Quantum threat materializes before 2029 | LOW | CATASTROPHIC | Phases 1–3 are pre-emptive; if threat accelerates, Phase 4 timeline compresses (still requires §45 supermajority) |
| Migration complexity | MEDIUM | MEDIUM | UUPS + ERC-4337 are well-understood patterns; existing OZ libraries used |
| User impact (Phase 4) | LOW | MEDIUM | Backward compat maintained — ECDSA still works for transfers/burns |
| Gas cost impact | HIGH | MEDIUM | Falcon sigs are ~10× larger → ~10× calldata cost. Native precompile on Monad would cut verification gas 60×. Without precompile, governance voting becomes expensive. |
| Falcon implementation bug | MEDIUM | HIGH | Use only audited Falcon libraries; require formal verification of the Solidity verifier; timelock + rollback on every upgrade |
| User loses Falcon private key | MEDIUM | HIGH | Social recovery via ERC-4337 + Council-approved guardians; document migration to a new Falcon key |
| UUPS upgrade key compromise | LOW | CATASTROPHIC | Multi-Sig (supermajority); 48h timelock; 1h auto-rollback on invariant failure |

---

## 6. Monitoring Triggers

The Formation Committee reviews the following signals quarterly. Any of
these triggers a roadmap acceleration review (which may propose a §45
amendment to compress timelines):

- **IBM Quantum roadmap announcements**: any machine with ≥1,000 physical
  qubits AND ≥100 logical qubits triggers a review. (Current state as of
  2026: IBM has ~1,100 physical qubits, ~10 logical — no threat yet.)
- **NIST post-quantum standardization updates**: any revision to
  FIPS 206 (Falcon) or withdrawal/replacement of Falcon triggers a
  re-evaluation of the target scheme.
- **Ethereum EIPs for PQ signature verification**: any EIP proposing
  a Falcon precompile (or a generic PQ precompile) at the Ethereum
  protocol level — would dramatically reduce our gas cost.
- **Academic papers on ECDSA-breaking algorithms**: any algorithm that
  reduces the qubit count needed to break secp256k1 by >50% vs. the
  current best (2024 state of the art) triggers a review.
- **NSA / CNSA 2.0 guidance updates**: any revision to the timeline
  for mandatory PQ adoption in financial infrastructure.

---

## 7. Governance

- This roadmap is a **living document** — updated quarterly by the
  Formation Committee and ratified by the Council.
- Any acceleration of the timeline (compressing phases or moving
  deadlines earlier) requires a constitutional amendment under §45
  (supermajority of the Council + a 7-day public review window).
- Any deceleration (pushing deadlines later than 2029) is **forbidden**
  by §39 — the 2029 deadline is a hard constitutional mandate.
- The UUPS proxy upgrade key is held by the **Safe Multi-Sig
  (`0xE718…7a7D0`)**. Signers are the Council members; M-of-N threshold
  is set per §45.
- Every UUPS upgrade MUST pass an on-chain invariant test that
  exercises all 5 constitutional invariants (esp. `burn()` non-pausability)
  before the upgrade is finalized. Failure triggers automatic rollback
  within the 1-hour window.

---

## 8. References

- **Constitution §39**: Post-Quantum Migration mandate (Falcon-512 by 2029)
- **Constitution § Invariant 5**: "burn never pauses — redemption is a
  non-suspendable constitutional right" (the migration MUST NOT break this)
- **Constitution §45**: Amendment procedure (supermajority required for
  any timeline change)
- **NIST FIPS 206**: Falcon — post-quantum signature scheme
  (https://csrc.nist.gov/pubs/fips/206/final)
- **EIP-4337**: Account Abstraction — bundler-based signature
  abstraction (https://eips.ethereum.org/EIPS/eip-4337)
- **ERC-1822**: UUPS — Universal Upgradeable Proxy Standard
  (https://eips.ethereum.org/EIPS/eip-1822)
- **EIP-7212**: Precompile for secp256r1 (P-256) — NOT Falcon, but
  related infrastructure (https://eips.ethereum.org/EIPS/eip-7212)
- **OpenZeppelin UUPSUpgradeable**: vendored at
  `/foundry/lib/openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol`

---

## Appendix A — What's Implementable Today vs. Future Work

**Implementable today (2026)**:
- UUPS proxy wrapper around MTQ (Phase 1) — uses existing OpenZeppelin
  library, no novel crypto.
- On-chain invariant test that auto-rolls back failed upgrades.
- ERC-4337 bundler integration (Phase 2) — bundlers are live on
  Ethereum mainnet; the work is integration, not invention.

**Requires future work (2027+)**:
- Audited Solidity Falcon-512 verifier (Phase 3). Open-source
  implementations exist but are unaudited as of 2026. We will need
  to commission a formal audit (estimated $200K–$400K) or wait for
  the community to produce an audited implementation.
- Native Falcon precompile on Monad (Phase 3). We will petition Monad
  in 2027 Q1.
- Native Falcon precompile on Ethereum (Phase 5 stretch). Would require
  a new EIP; we will support any community effort.

**NOT implementable (constitutional impossibility)**:
- Mandatory Falcon-512 for token transfers and burns (would break
  Invariant 5 — backward compat for unmigrated holders). Only
  achievable if a credible quantum threat to ECDSA materializes AND
  the Council passes a §45 amendment.

---

## Appendix B — Relationship to the MTQ.sol Burn() Fix

This roadmap was written alongside a fix to `MTQ.burn()`. The Foundry
fuzz tests (Task ID 1) discovered that `burn()` carried a
`notEmergencyPaused` modifier, violating § Invariant 5. The fix removes
that modifier — `burn()` is now truly non-pausable.

This matters for the post-quantum migration because Phase 5 mandates
that **burn remains ECDSA-compatible for backward compatibility**.
If `burn()` were pausable (the pre-fix state), a future Council could
theoretically pause redemption to force users to migrate. That is
constitutionally forbidden, and now the on-chain code enforces it.

The MTQ.sol fix is therefore not just a bug fix — it is a precondition
for the post-quantum migration plan to be constitutional. Without it,
Phase 5 would create a de-facto pause-on-redemption pathway via the
upgrade authority. With the fix, the upgrade authority can change
*signature verification* but can NEVER change *burn non-pausability*,
because that property is enforced in the immutable MTQ token contract,
not in the upgradeable proxy.

