# Settlement Router Readiness Report

**Report Date:** 2026-08-09
**Author:** Chief Systems Architect / Release-Governance Engineer (acting in concert)
**Status:** NOT READY — implementation deferred pending Safe Multi-Sig operationalization
**Authority:** §11, §36 (Phase D) of the multi-network architecture audit specification

---

## Executive Summary

The Universal Settlement Router is **not ready for implementation**. Three blocking prerequisites are unmet:

1. The Safe Multi-Sig is 1-of-1 deployer-controlled (should be 3-of-5 with 5 named institutional signers).
2. The Constitutional Council is not seated on any chain (Monad + Arc have 1/7 members; Local has 7 Anvil accounts, not institutional signers).
3. All admin roles remain on the deployer EOA (should be transferred to the Safe Multi-Sig).

Until these are resolved, implementing the router would create a non-compliant settlement layer that bypasses the constitutional authority structure. The router's design (documented in `multi-network-architecture.md` §7-§8) is sound; its implementation must wait.

---

## Router Design Recap

The Universal Settlement Router sits between the Constitutional Core and the network-specific RPC clients. It accepts high-level settlement intents (mint, redeem, transfer, govern), resolves the target chain, enforces constitutional invariants, and dispatches to the appropriate chain adapter.

**Authority limits (per §37 of the audit specification):**
- The router must NOT mint, redeem, alter reserves, alter constitutional parameters, bypass Governance, bypass Safe/Multi-Sig, bypass Oracle controls, or bypass reserve requirements.
- The router routes settlement operations. It does not become a monetary authority.

---

## Readiness Checklist

| Prerequisite | Status | Evidence |
|---|---|---|
| Safe Multi-Sig operationalized (3-of-5, 5 institutional signers) | ❌ **NOT READY** | `cast call getThreshold()` returns `1` on Monad + Arc; `getOwners()` returns `[deployerEOA]` |
| Constitutional Council seated (7 members on each chain) | ❌ **NOT READY** | Monad + Arc have 1/7 council members (deployer EOA only); Local has 7 Anvil accounts (not institutional signers) |
| Admin roles transferred from deployer EOA to Safe Multi-Sig | ❌ **NOT READY** | Deployer EOA holds DEFAULT_ADMIN, MINTER, PAUSER, ORACLE_PROVIDER, COUNCIL roles on all 3 chains |
| Cross-chain safety report approved | ❌ **NOT READY** | `cross-chain-safety-report.md` documents the gaps; no formal security review has been conducted |
| Network adapter abstraction designed | ⚠️ **PARTIAL** | `ChainConfig` interface in `chains.ts:29-55` covers identity + connectivity + contracts; `capabilities`, `health`, `provenance`, and write operations are not yet designed |
| Settlement router interface designed | ⚠️ **PARTIAL** | Target interface sketched in `multi-network-architecture.md` §8; not yet implemented in code |
| Constitutional invariants formally specified for router enforcement | ❌ **NOT READY** | The 21 constitutional invariants are documented in `docs/blueprint/blueprint.txt` but not formalized as router-enforceable rules |
| Reserve accounting consistency mechanism designed | ❌ **NOT READY** | No cross-chain reserve accounting design exists |
| Oracle consistency mechanism designed | ❌ **NOT READY** | No cross-chain oracle synchronization design exists |
| Emergency pause coordination mechanism designed | ❌ **NOT READY** | No multi-chain emergency pause design exists |

**Verdict: 0 of 10 prerequisites fully met. 2 of 10 partially met. Router implementation is BLOCKED.**

---

## What the Router Would Do (If Implemented Today)

If the router were implemented today without the prerequisites, it would:

1. **Bypass the Safe Multi-Sig** — because the Safe is 1-of-1 deployer-controlled, the router would effectively route through the deployer EOA, creating a single point of failure and a constitutional violation.
2. **Bypass the Constitutional Council** — because the Council is not seated, governance proposals routed through the router would be authorized by the deployer EOA alone.
3. **Create inconsistent state** — because there is no cross-chain synchronization mechanism, the router could mint on chain A while the reserve accounting on chain B is unaware, leading to double-counting.
4. **Be unaccountable** — because there is no formal logging or audit trail for router decisions, constitutional violations would be undetectable.

**These outcomes are unacceptable. The router must not be implemented until the prerequisites are met.**

---

## Recommended Implementation Sequence (Future)

Once the prerequisites are met, the router should be implemented in this order:

### Phase D.1 — Read-only router (low risk)
- Implement `src/lib/settlement-router.ts` with read-only operations (chain selection, capability checks, contract reads).
- No state-changing operations.
- Add `/api/settlement/status` endpoint that reports router state.
- Add `/api/settlement/read?chain=monad&contract=MTQ&method=totalSupply` endpoint.

### Phase D.2 — Write router with Safe Multi-Sig authorization (medium risk)
- Implement write operations (`buildMintTx`, `buildRedeemTx`, `buildTransferTx`) that construct calldata for the specified chain.
- The router does NOT sign or broadcast — it returns the calldata for the Safe Multi-Sig (or the user's wallet) to sign.
- All write operations require Safe Multi-Sig authorization (verified on-chain via `Safe.isOwner(msg.sender)`).

### Phase D.3 — Cross-chain settlement (high risk — requires formal security review)
- Implement cross-chain settlement (e.g., mint on Monad, redeem on Arc).
- Requires the cross-chain safety mechanism (`cross-chain-safety-report.md`) to be formally reviewed and approved.
- Requires a constitutional amendment if the monetary state is to be shared across chains.

**Phase D.3 is NOT authorized by this audit. It requires a separate constitutional/security review.**

---

## Current State of Related Components

### `getChainReader(chainKey)` — the closest existing primitive

The `getChainReader` factory in `src/lib/contract-reader.ts:78-130` is the only chain-routing primitive in the codebase. It exposes:

- `getContractInfo()` — reads MTQ token metadata (name, symbol, decimals, totalSupply)
- `getBalance(address)` — reads MTQ balance of an address
- `getBlockNumber()` — reads the latest block number
- `contractExists(address)` — checks if a contract is deployed at an address

This is a **read-only reader factory**, not a settlement router. It cannot mint, redeem, transfer, or govern. It is consumed by:

- `/api/status` (enumerates all chains)
- `/api/health` (probes all RPCs)
- `testnet.tsx` (UI chain toggle)
- `verify-on-chain.tsx` (per-chain explorer links)

No caller passes a `chainKey` other than the default `"monad"` via the legacy exports.

### `buildTransferCalldata()` — the closest existing write primitive

The `buildTransferCalldata(toAddress, amountWei)` function in `contract-reader.ts:148` constructs ERC-20 transfer calldata for the MTQ token. It is consumed by `operating-system.tsx` to display the calldata in the UI — the actual signing and broadcast happen client-side via MetaMask.

This function:
- Is hard-coded to Monad (uses `CONTRACTS.MTQ_TOKEN`, which is `CHAINS.monad.contracts.MTQ_TOKEN`)
- Only supports ERC-20 `transfer(address,uint256)` — no mint, redeem, or governance calldata
- Does not enforce any constitutional invariants (e.g., it would happily construct a transfer that violates the reserve ratio, if such a transfer were possible)

A future router would replace this with a chain-aware, invariant-enforcing calldata builder.

---

## Risks of Premature Implementation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Router bypasses Safe Multi-Sig | High (certain, given current Safe state) | Critical — constitutional violation | Do not implement Phase D.2 until Safe is 3-of-5 |
| Router creates inconsistent cross-chain state | High (no synchronization mechanism exists) | Critical — double minting, reserve mismatch | Do not implement Phase D.3 until cross-chain safety report is approved |
| Router becomes a single point of failure | Medium | High — router outage blocks all settlement | Design router as stateless; deploy multiple instances; use consensus for router state |
| Router introduces a new attack surface | Medium | High — router bugs could allow unauthorized minting | Formal security audit of router code before deployment; bug bounty |
| Router is over-engineered for current needs | Medium | Medium — unnecessary complexity, slower development | Implement only Phase D.1 (read-only) until write operations are demonstrably needed |

---

## Recommendation

**Do not implement the Universal Settlement Router in this audit cycle.**

The router is a future architectural phase (Phase D in §36 of the audit specification) that depends on:

1. Safe Multi-Sig operationalization (F-CRITICAL-1 in `network-architecture-audit.md`)
2. Constitutional Council seating (F-CRITICAL-1)
3. Role transfer from deployer EOA to Safe Multi-Sig (F-CRITICAL-1)
4. Cross-chain safety report approval (`cross-chain-safety-report.md`)

The current `getChainReader(chainKey)` factory is sufficient for the current phase (read-only multi-chain verification). When the prerequisites are met, implement Phase D.1 (read-only router) first, then Phase D.2 (write router with Safe authorization), and only consider Phase D.3 (cross-chain settlement) after a separate constitutional/security review.

---

## No Code Changes Made

This report is **read-only**. No router code was implemented. No existing code was modified. The report documents the readiness state and informs the implementation sequencing.
