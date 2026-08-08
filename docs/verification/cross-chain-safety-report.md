# Cross-Chain Safety Report

**Report Date:** 2026-08-09
**Author:** Chief Systems Architect / Smart Contract Architect (acting in concert)
**Status:** NO CROSS-CHAIN OPERATIONS EXIST — report documents the safety requirements for any future cross-chain feature
**Authority:** §21-§23, §37, §40 of the multi-network architecture audit specification

---

## Executive Summary

**No cross-chain settlement exists in MITHQAL today.** Each of the three execution environments (Monad, Arc, Local Anvil) operates as an independent deployment with its own contract state. There is no bridge, no message-passing layer, no state synchronization mechanism, and no cross-chain mint/redeem/transfer capability.

This is the **correct state** for the current phase. Cross-chain settlement is a future architectural decision that requires formal security and constitutional review. This report documents the safety requirements that any future cross-chain feature must satisfy.

---

## Current Cross-Chain State

### What Exists

| Capability | Status | Evidence |
|---|---|---|
| Same source code deployed on 3 chains | ✅ Yes | `src/contracts/**/*.sol` deployed identically on Monad, Arc, Local Anvil |
| Per-chain contract addresses recorded | ✅ Yes | `src/lib/chains.ts` + 3 registry JSON files |
| Per-chain RPC + explorer recorded | ✅ Yes | `src/lib/chains.ts` |
| Per-chain health probing | ✅ Yes | `/api/health` probes all 3 RPCs |
| Per-chain contract reads (via `getChainReader`) | ✅ Yes | `contract-reader.ts:78-130` |
| Per-chain UI toggle (deployed contracts view) | ✅ Yes | `testnet.tsx` chain toggle |

### What Does NOT Exist

| Capability | Status | Why |
|---|---|---|
| Cross-chain mint | ❌ No | No settlement router; no cross-chain mint authority; no synchronization |
| Cross-chain redeem | ❌ No | Same |
| Cross-chain transfer | ❌ No | No bridge; no message-passing layer |
| Cross-chain governance | ❌ No | Each chain has its own Governance contract with its own council |
| Cross-chain state synchronization | ❌ No | Each chain's contract state is independent |
| Cross-chain oracle synchronization | ❌ No | Each chain's Oracle contract is independent |
| Cross-chain Safe Multi-Sig coordination | ❌ No | The Safe on Monad and Arc is the same address but operates independently on each chain |
| Bridge contract | ❌ No | Per §22, §40 of the audit specification — no bridge |
| Message-passing layer | ❌ No | None implemented |
| Cross-chain replay protection | ❌ No | Not needed (no cross-chain transactions) but would be required if cross-chain were added |

### Per-Chain State Independence

The MTQ token supply is **independent** on each chain:

| Chain | MTQ Total Supply | Notes |
|---|---|---|
| Monad | 310.95 MTQ | Some minting has occurred (likely via direct contract interaction, not the app) |
| Arc | Not probed (likely 0) | Fresh deployment, no minting via the app |
| Local Anvil | 0 MTQ | Fresh deployment, no minting |

**This is not a bug — it is the correct state.** Each chain has its own MTQ token contract with its own supply. The supplies are not meant to be equal. MITHQAL is not (yet) a cross-chain monetary system; it is a multi-chain deployment of the same protocol.

---

## §22 Audit Questions — Answered

The audit specification (§22) mandates that the following be audited before implementing cross-chain settlement. Each is answered below.

### 1. Nonce handling

**Status:** N/A — no cross-chain transactions exist.

**Future requirement:** If cross-chain transactions are added, the nonce model must be defined. Options:
- **Per-chain nonces** (simplest; each chain has its own nonce space) — no cross-chain nonce coordination needed.
- **Global nonces** (complex; requires a cross-chain nonce coordinator) — needed only if transactions must be ordered globally.

**Recommendation:** Per-chain nonces. The settlement router should not attempt to coordinate nonces across chains.

### 2. Replay protection

**Status:** N/A — no cross-chain transactions exist.

**Future requirement:** If cross-chain transactions are added, replay protection must ensure that a transaction signed for chain A cannot be replayed on chain B. Standard EVM replay protection (EIP-155 chain ID in the signature) already handles this for EVM-to-EVM transactions. For non-EVM rails (bank, CBDC), a separate replay protection mechanism would be needed.

**Recommendation:** Rely on EIP-155 for EVM-to-EVM. Do not implement cross-chain transactions to non-EVM rails without a separate replay protection design.

### 3. Message authentication

**Status:** N/A — no message-passing layer exists.

**Future requirement:** If a bridge or message-passing layer is introduced (e.g., for cross-chain governance proposals), message authentication must verify:
- The message originated from an authorized sender (the Safe Multi-Sig or the Constitutional Council).
- The message was not tampered with in transit.
- The message is being executed on the correct target chain.

**Recommendation:** Do not introduce a message-passing layer without a formal security review of the authentication mechanism.

### 4. Finality

**Status:** Each chain has its own finality model. The application does not wait for finality — it reads the latest block and assumes it is final (acceptable for testnets; not acceptable for mainnet).

**Future requirement:** The settlement router must define, for each chain, when a transaction is considered "final":
- **Monad Testnet:** block time ~0.5s, finality assumption = "latest block" (testnet only; mainnet would need a finality threshold).
- **Arc Testnet:** block time ~2s, finality assumption = "latest block" (same caveat).
- **Local Anvil:** block time 1s (per `--block-time 1`), finality assumption = "latest block" (instant finality; Anvil does not reorg).

**Recommendation:** For mainnet, define a per-chain finality threshold (e.g., N confirmations) and do not consider a transaction final until that threshold is met.

### 5. Canonical transaction identity

**Status:** Each chain has its own transaction hashes. There is no cross-chain transaction identity.

**Future requirement:** If cross-chain settlement is added, each settlement must have a canonical identity that is unique across all chains. Options:
- **Settlement ID** — a UUID generated by the router, stored in the Turso ledger, and referenced in the on-chain transaction's calldata or event log.
- **Cross-chain tx hash** — a hash of (source chain ID, source tx hash, target chain ID, target tx hash). Complex; not recommended.

**Recommendation:** Settlement ID (UUID) generated by the router. The on-chain transaction's `data` field or an event log should include this ID for traceability.

### 6. Cross-chain state synchronization

**Status:** None. Each chain's state is independent.

**Future requirement:** If cross-chain settlement is added, the state synchronization model must define:
- Which state is **canonical** (the authoritative source of truth).
- Which state is **mirrored** (a read-only copy of the canonical state).
- Which state is **local** (chain-specific, not synchronized).

**Recommendation:** The canonical state is the Turso database (the application's off-chain ledger). The on-chain state is a **projection** of the canonical state, not the canonical state itself. This avoids the need for on-chain cross-chain synchronization.

**Critical rule (per §23 of the audit specification):**
> The constitutional state must remain singular. Do not allow `Monad state ≠ Arc state` without an explicit constitutional synchronization mechanism.

### 7. Oracle consistency

**Status:** Each chain's Oracle contract is independent. The `/api/oracle` route queries the Monad MockOracle (or falls back to `gold-api.com`); it does not query Arc or Local Oracles.

**Future requirement:** If cross-chain settlement is added, oracle prices must be consistent across chains. Options:
- **Single canonical oracle** — one chain's Oracle is canonical; other chains' Oracles mirror it via a bridge.
- **Multi-oracle consensus** — each chain's Oracle is queried; the median (or weighted average) is used.
- **Off-chain oracle** — the application reads from an off-chain oracle (e.g., `gold-api.com`) and writes the price to each chain's Oracle contract.

**Recommendation:** Off-chain oracle (the application reads from `gold-api.com` and writes to each chain's Oracle via the Safe Multi-Sig). This is the simplest model and avoids cross-chain oracle synchronization.

### 8. Mint authority

**Status:** The deployer EOA holds the MINTER_ROLE on all 3 chains. No minting has been done via the application.

**Future requirement:** Mint authority must be transferred to the Safe Multi-Sig on each chain. The settlement router must verify that the Safe Multi-Sig has authorized the mint before constructing the mint transaction.

**Critical rule:** The router must NOT mint directly. It must construct the calldata and return it for the Safe Multi-Sig to sign.

### 9. Redemption authority

**Status:** Same as mint authority — deployer EOA holds the REDEEMER_ROLE on all 3 chains. No redemption has been done via the application.

**Future requirement:** Same as mint authority — transfer to Safe Multi-Sig; router constructs calldata; Safe signs.

### 10. Reserve accounting

**Status:** Each chain's Reserve contract is independent. The application's reserve accounting (in Turso) is separate from the on-chain Reserve contracts.

**Future requirement:** The canonical reserve ledger is the Turso database (off-chain). The on-chain Reserve contracts are projections. The settlement router must ensure that any on-chain reserve operation (deposit, withdraw) is reflected in the Turso ledger.

**Critical rule:** The on-chain Reserve contracts do NOT own the reserve assets. They are accounting abstractions. The actual assets are in approved custodian custody.

### 11. Emergency controls

**Status:** Each chain's contracts have independent pause functionality (the PAUSER_ROLE on each chain's MTQ contract). There is no coordinated emergency pause across chains.

**Future requirement:** The settlement router must support a coordinated emergency pause — when the Safe Multi-Sig declares an emergency, all chains' PAUSER_ROLE should be invoked simultaneously.

**Recommendation:** The router should expose a `pauseAllChains()` function that constructs pause transactions for each chain and submits them to the Safe Multi-Sig for signature.

### 12. Safe/multisig authorization

**Status:** The Safe Multi-Sig is 1-of-1 deployer-controlled on Monad and Arc; not deployed on Local Anvil.

**Future requirement:** The Safe Multi-Sig must be operationalized as 3-of-5 with 5 named institutional signers on each chain. The settlement router must verify Safe authorization for every state-changing operation.

**Critical rule (per §37 of the audit specification):**
> The Settlement Router must NOT have authority to arbitrarily mint MTQ, arbitrarily redeem MTQ, alter reserves, alter constitutional parameters, bypass Governance, bypass Safe/Multi-Sig, bypass Oracle controls, or bypass reserve requirements.

---

## §21 Network Failure Model — Safety Analysis

### Scenario: Monad Becomes Unavailable

If Monad's RPC becomes unreachable:

1. `/api/health` reports `rpc: ✗` (Monad check fails).
2. The overall health status becomes `degraded` (Monad gates the status).
3. `/api/onchain-test` fails (it queries Monad).
4. `/api/contract/info` and `/api/balance/[address]` fail (they use `getContractInfo()` / `getBalance()` which default to Monad).
5. The wallet hook cannot connect (it only knows Monad).
6. The UI's `/testnet` view still works for Arc and Local (the chain toggle is independent of Monad's availability).
7. `/api/status` still reports all 3 chains (it doesn't probe RPCs).
8. `/api/oracle` falls back to `gold-api.com` if the Monad MockOracle is unreachable.

**What does NOT happen (correctly):**
- No automatic failover to Arc or Local (per §21 of the audit specification).
- No state migration.
- No cross-chain minting to "compensate" for Monad being down.
- No reserve accounting changes.

**What SHOULD happen (future, after Phase E):**
- The application should detect Monad's failure and inform the user that Arc or Local is available as an alternative read source.
- The user should be able to manually switch the wallet to Arc (after Phase E refactoring).
- No automatic write failover — write operations should remain paused until Monad recovers or the Safe Multi-Sig explicitly authorizes a cross-chain alternative.

### Scenario: Arc Becomes Unavailable

If Arc's RPC becomes unreachable:

1. `/api/health` reports `rpcArc: ✗` (informational; does NOT gate the overall status).
2. The overall health status remains `healthy` (Monad is still up).
3. The UI's `/testnet` view still works for Monad and Local.
4. No application functionality breaks (Arc is not used by any active read/write path).

**This is the correct behavior.** Arc is a secondary testnet; its unavailability should not affect the primary application.

### Scenario: Local Anvil Becomes Unavailable

If the local Anvil node stops:

1. `/api/health` reports `rpcLocal: ✗` (informational; does NOT gate the overall status).
2. The overall health status remains `healthy` (Monad is still up).
3. The UI's `/testnet` view still works for Monad and Arc.
4. No application functionality breaks (Local is not used by any active read/write path).

**This is the correct behavior.** Local Anvil is a devnet; its unavailability should not affect the production application.

### Scenario: Safe Multi-Sig Becomes Compromised

If the Safe Multi-Sig (currently 1-of-1 deployer-controlled) is compromised:

1. The attacker can call any function that requires DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE, ORACLE_PROVIDER_ROLE, or COUNCIL_ROLE on any chain.
2. The attacker can mint unlimited MTQ, pause the contract, change oracle prices, and approve governance proposals.
3. There is no emergency pause mechanism (the deployer EOA holds the PAUSER_ROLE, but if the Safe is compromised, the deployer EOA is likely compromised too).

**This is the critical risk identified by the audit.** The 1-of-1 Safe configuration is a single point of failure. Remediation: operationalize the Safe as 3-of-5 with 5 named institutional signers (F-CRITICAL-1 in `network-architecture-audit.md`).

---

## §23 Single Source of Truth — Analysis

> **The constitutional state must remain singular.**

### Current State

The constitutional state IS singular — it lives in the Turso database (off-chain). The on-chain contract state is a projection:

- **Canonical:** Turso database (operations ledger, reserve accounting, governance proposals)
- **Projection:** On-chain contract state (MTQ supply, Reserve deposits, Oracle prices)

Each chain has its own projection. The projections are **not synchronized** — they are independent deployments. This is acceptable because:
1. No cross-chain settlement exists.
2. The canonical state (Turso) is the source of truth for the application.
3. The on-chain state is verifiable but not authoritative for the application's reserve accounting.

### Future Requirement

If cross-chain settlement is added, the canonical state must remain singular. Options:
- **Turso remains canonical** — the application's off-chain ledger is the source of truth; on-chain state is a projection.
- **On-chain canonical** — one chain's contract state is canonical; others mirror it. (Complex; not recommended.)

**Recommendation:** Turso remains canonical. The settlement router reads from Turso to verify state consistency before authorizing any cross-chain operation.

---

## Critical Non-Goals (per §40 of the audit specification)

The following are **explicitly prohibited** without a separate approved architectural decision:

- ❌ Create a bridge
- ❌ Introduce cross-chain minting
- ❌ Introduce cross-chain redemption
- ❌ Allow automatic failover that creates double minting, duplicate redemption, reserve mismatch, replay, double settlement, inconsistent state, or oracle inconsistency

---

## Conclusion

**No cross-chain operations exist. No cross-chain safety issues exist.** Each chain operates independently. The constitutional state is singular (Turso). The on-chain state is a projection.

Cross-chain settlement is a **future architectural decision** that requires:
1. Safe Multi-Sig operationalization (3-of-5 with 5 named institutional signers).
2. Constitutional Council seating.
3. Role transfer from deployer EOA to Safe Multi-Sig.
4. Formal security review of the cross-chain safety mechanism.
5. Constitutional amendment if the monetary state is to be shared across chains.

**This report documents the requirements. It does not authorize implementation.**

---

## No Code Changes Made

This report is **read-only**. No cross-chain code was implemented. No existing code was modified. The report documents the safety requirements for any future cross-chain feature.
