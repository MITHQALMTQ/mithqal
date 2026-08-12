# Network Capability Matrix

**Audit Date:** 2026-08-09
**Auditor:** Chief Enterprise Architect / Interoperability Architect (acting in concert)
**Scope:** Per-environment capability verification across all three execution environments
**Method:** Static source review + on-chain verification + runtime behavior probing
**Authority:** §18 of the multi-network architecture audit specification

---

## How to Read This Matrix

Each cell is one of:

| Marker | Meaning |
|---|---|
| **Yes** | Capability is present and verified |
| **No** | Capability is absent by design |
| **Verify** | Capability is *claimed* but not independently verified by this audit — needs follow-up |
| **N/A** | Capability does not apply to this environment |
| **⚠️** | Capability is present but in a non-compliant state (see notes) |

Per §18 of the audit specification: *"Do not fill 'Yes' unless verified from the repository/deployment state."* Every **Yes** below is backed by concrete evidence (file path, line number, or on-chain probe result).

---

## Capability Matrix

| Capability | Monad (10143) | Arc (5042002) | Local Anvil (1337) | Evidence |
|---|---|---|---|---|
| **Public** | Yes | Yes | No | Monad + Arc have public RPCs + explorers; Local is `localhost:8545` only |
| **Local** | No | No | Yes | Local Anvil runs on `localhost:8545`; Monad + Arc are remote |
| **Testnet** | Yes | Yes | No | Monad + Arc are public testnets; Local is a devnet |
| **Production** | No | No | No | None of the three is a production/mainnet deployment. All are testnet/devnet only. |
| **Explorer** | Yes | Yes | No | `testnet.monadscan.com`, `testnet.arcscan.app`; Local has no explorer |
| **Contract Verification (explorer)** | Verify | Verify | N/A | No Sourcify/Etherscan verification record found in repo for any chain — needs operator action |
| **Contract Verification (on-chain)** | Yes | Yes | Yes | `eth_getCode` returns non-empty bytecode for all 9 contracts on all 3 chains (verified 2026-08-09) |
| **MTQ Token** | Yes | Yes | Yes | `name()`, `symbol()`, `decimals()`, `totalSupply()` all return valid values on Monad (probed); bytecode present on Arc + Local |
| **Mint** | Yes (simulated only) | Yes (simulated only) | Yes (simulated only) | `Mint.sol` deployed on all 3 chains; but the application layer (`testnet-engine.ts`) only simulates mints — no real `Mint.mint()` tx has been broadcast via the UI |
| **Redemption** | Yes (simulated only) | Yes (simulated only) | Yes (simulated only) | `Redeem.sol` deployed on all 3 chains; but the application layer only simulates redeems — no real `Redeem.redeem()` tx has been broadcast via the UI |
| **Oracle** | Yes | Yes | Yes | `Oracle.sol` deployed on all 3 chains; `/api/oracle` queries Monad's MockOracle (or falls back to `gold-api.com`); Arc + Local Oracles are deployed but not queried by the app |
| **Governance** | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | `Governance.sol` deployed on all 3 chains; Monad + Arc have 1/7 council members (deployer EOA only — constitutional violation); Local has 7/7 (Anvil accounts, not institutional signers) |
| **Safe/Multi-Sig** | ⚠️ Deployed but non-compliant | ⚠️ Deployed but non-compliant | No (EOA placeholder) | Monad + Arc have a real Gnosis Safe v1.4.1 but configured 1-of-1 with deployer as sole owner (should be 3-of-5); Local has no Safe (deployer EOA stands in) |
| **Algorithm** | Yes | Yes | Yes | `Algorithm.sol` deployed on all 3 chains; wired to MTQ + Reserve + Oracle on each chain |
| **Reserve** | Yes | Yes | Yes | `Reserve.sol` deployed on all 3 chains; deployer holds all 4 roles (COUNCIL, MINTER, REDEEMER, ORACLE) |
| **Takaful** | Yes | Yes | Yes | `Takaful.sol` deployed on all 3 chains; wired to MTQ on each chain |
| **Wallet Integration** | Yes (Monad only) | No | No | `use-wallet.ts` hard-codes Monad chain params; MetaMask cannot connect to Arc or Local via the UI |
| **On-Chain Read Path** | Yes | Yes (via `getChainReader("arc")`) | Yes (via `getChainReader("local")`) | `contract-reader.ts:78-130` exposes per-chain readers; but only `/api/status` + `/api/health` enumerate all chains; all other readers default to Monad |
| **On-Chain Write Path** | No | No | No | No application route constructs or broadcasts a real write transaction. The wallet hook can sign transfers (Monad only), but no mint/redeem/governance write path is wired through the app |
| **Block Explorer Links** | Yes | Yes (via `verify-on-chain.tsx` chain toggle) | No (renders as non-clickable badge) | `verify-on-chain.tsx` supports all 3 chains; 11 other components hard-code Monad explorer URLs |
| **Health Check** | Yes (gating) | Yes (informational) | Yes (informational) | `/api/health` probes all 3 RPCs; Monad gates the overall status, Arc + Local are informational |
| **Network Status Reporting** | Yes | Yes | Yes | `/api/status` returns a `networks[]` array with all 3 chains |
| **Cross-Chain Settlement** | No | No | No | No settlement router exists; no cross-chain mint/redeem/transfer capability |
| **Cross-Chain State Sync** | No | No | No | No bridge, no message-passing, no state synchronization between chains |
| **Reserve Custody** | No | No | No | Reserve assets are held off-chain by approved custodians under the Constitutional Reserve Framework; no blockchain holds reserve assets |
| **Constitutional Compliance** | ⚠️ Non-compliant | ⚠️ Non-compliant | ⚠️ Non-compliant | All 3 chains violate §Article IV (Safe must be 3-of-5 with 5 named institutional signers; deployer EOA must not retain operational authority after deployment) |

---

## Capability Notes

### Production

**No** for all three environments. MITHQAL is not deployed on any mainnet. The Monad and Arc deployments are testnets; the Local Anvil deployment is a devnet. Any claim of "production" or "mainnet" status would be false.

### Contract Verification (explorer)

**Verify** for Monad and Arc. The 9 Protocol Smart Contracts are deployed and verifiable via `eth_getCode`, but no Sourcify, Etherscan, or MonadScan/ArcScan source verification record exists in the repository. The `/api/onchain-test` route performs 15 runtime checks (calling `name()`, `symbol()`, `decimals()`, `totalSupply()`, etc.) which prove the contracts behave correctly — but this is not the same as explorer-side source code verification. Operators should submit the source code to MonadScan and ArcScan for public verification.

### Mint / Redemption

**Yes (simulated only)** for all three chains. The `Mint.sol` and `Redeem.sol` contracts are deployed and callable, but the application layer (`src/lib/testnet-engine.ts`, `/api/testnet/mint`, `/api/testnet/redeem`) only **simulates** mint and redeem operations — it records the intent in the Turso database with a synthesized "simulator reference" (not a real transaction hash). No real `Mint.mint()` or `Redeem.redeem()` transaction has ever been broadcast through the UI.

This is by design for the testnet phase: real minting would require (a) a funded Reserve contract on each chain, (b) the deployer EOA or Safe Multi-Sig to hold the MINTER_ROLE, and (c) a deposit flow that verifies incoming funds before minting. None of these are wired up.

### Governance

**⚠️ Partial** for all three chains. The `Governance.sol` contract is deployed and callable, but:

- **Monad + Arc**: The `initialCouncil` array was set to `[deployerEOA]` at deployment — only 1 of 7 slots filled. The contract's `COUNCIL_SIZE = 7` constant is satisfied (the array length matches), but the deployer is the sole council member, making the system founder-controlled.
- **Local Anvil**: The `initialCouncil` array was set to 7 Anvil pre-funded accounts (per `scripts/deploy-local.sh:99-102`) — all 7 slots filled, but with synthetic Anvil accounts, not the constitutionally-mandated institutional signers (CEO UAE, CFO UAE, Board Member Singapore, Custodian UK, Auditor Third-party).

No Governance proposal has been submitted or executed on any chain via the application layer.

### Safe/Multi-Sig

**⚠️ Deployed but non-compliant** for Monad and Arc; **No** for Local Anvil.

- **Monad + Arc**: A real Gnosis Safe v1.4.1 is deployed at `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` (verified via `cast call VERSION()` → `"1.4.1"`). However, `getThreshold()` returns `1` and `getOwners()` returns `[deployerEOA]` — a 1-of-1 configuration. The Constitution (§Article IV, `blueprint.txt:8997, 19759-19765`) mandates a 3-of-5 threshold with 5 named institutional signers. **The current configuration is a direct constitutional violation.**
- **Local Anvil**: No Safe is deployed. The deployer EOA (`0xf39F…b92266`) stands in as a placeholder, recorded in `chains.ts:113` as `SAFE_MULTI_SIG` with a comment explaining it is a 1-of-1 placeholder for local dev.

### Wallet Integration

**Yes (Monad only)**. The wallet hook (`src/lib/use-wallet.ts:28-35`) hard-codes the Monad chain parameters for MetaMask's `wallet_addEthereumChain`:

```typescript
const MONAD_CHAIN_ID = "0x27f7"; // 10143 in hex
// ...
chainName: "Monad Testnet",
rpcUrls: ["https://testnet-rpc.monad.xyz"],
blockExplorerUrls: ["https://testnet.monadscan.com"],
```

Users cannot connect their wallet to Arc or Local Anvil through the UI. To support multi-chain wallet interaction, the hook must be parameterized over `CHAINS`.

### On-Chain Write Path

**No** for all three chains. The application has no route that constructs and broadcasts a real write transaction (mint, redeem, transfer, governance proposal, role grant, etc.). The only on-chain interaction is read-only (`eth_call` for contract reads, `eth_getCode` for existence checks, `eth_blockNumber` for health probes).

The `buildTransferCalldata()` helper in `contract-reader.ts:148` constructs ERC-20 transfer calldata, but it is only used by `operating-system.tsx` to display the calldata in the UI — the actual signing and broadcast happen client-side via MetaMask, and only for Monad (per the wallet hook limitation above).

### Cross-Chain Settlement / State Sync

**No** for all three chains. There is no settlement router, no bridge, no message-passing layer, and no state synchronization mechanism between chains. Each chain operates as an independent deployment with its own contract state.

This is intentional per §22, §37, §40 of the audit specification: cross-chain monetary movement requires formal security and constitutional review, and must not be introduced merely for architectural appearance.

### Reserve Custody

**No** for all three chains — by design. Reserve assets (gold, silver, cash/sukuk) are held off-chain by approved custodian institutions under the Constitutional Reserve Framework. No blockchain, smart contract, or settlement router owns or custodies reserve assets. The on-chain `Reserve.sol` contract manages a 3-tier reserve *accounting* abstraction (recording deposits, withdrawals, and target weights) — it does not hold the assets themselves.

### Constitutional Compliance

**⚠️ Non-compliant** for all three chains. The Constitution (§Article IV) requires:

1. Safe Multi-Sig configured as 3-of-5 with 5 named institutional signers — **violated** (Monad + Arc: 1-of-1 deployer-controlled; Local: no Safe).
2. EOAs shall not retain operational authority after deployment — **violated** (deployer EOA holds all admin roles on all 3 chains).
3. Constitutional Council seated — **violated** (Monad + Arc: only deployer as council member; Local: 7 Anvil accounts, not institutional signers).

These violations are documented in `docs/verification/investor-due-diligence-simulation.md` (E047) and `docs/verification/institutional-readiness-program-report.md` (lines 227, 241), but are not reflected in the CONTRACT_REGISTRY.md or the UI.

---

## Environment Classification (per §5 of the audit specification)

| Environment | Correct Classification | Not To Be Called |
|---|---|---|
| **Monad** | Primary Public Testnet | "MITHQAL Network", "Production network" |
| **Arc** | Secondary / Institutional Testnet | "MITHQAL Network", "Production network" |
| **Anvil** | Local Development Network | "Public network", "Production network", "Institutional network", "Live settlement network" |

**Total: 2 Public Testnets + 1 Local Development Network = 3 Supported Execution Environments**

This is **not** "3 production settlement networks" and **not** "3 chains live" (the previous framing). The correct framing is "3 supported execution environments" — 2 public testnets for institutional verification + 1 local devnet for development and automated testing.

---

## Capability Gaps (Priority Order)

### Critical Gaps (block any "mainnet ready" claim)

1. **Safe Multi-Sig operationalization** — reconfigure to 3-of-5 with 5 named institutional signers on Monad + Arc; deploy a real Safe on Local Anvil.
2. **Constitutional Council seating** — fill the remaining 6 council slots on Monad + Arc with the constitutionally-mandated institutional signers.
3. **Role transfer** — transfer all admin roles (DEFAULT_ADMIN, MINTER, PAUSER, ORACLE_PROVIDER, COUNCIL) from the deployer EOA to the Safe Multi-Sig on all chains.

### High-Priority Gaps (architectural debt)

4. **Multi-chain wallet integration** — parameterize `use-wallet.ts` over `CHAINS` so users can connect to Arc or Local.
5. **Multi-chain on-chain test** — `/api/onchain-test` should accept `?chain=monad|arc|local` and run its 15 checks against the specified chain (currently Monad-only).
6. **Multi-chain admin routes** — `/api/admin/oracle` and `/api/admin/update-price` should accept a `chain` parameter.
7. **Explorer-side source verification** — submit contract source to MonadScan and ArcScan.

### Medium-Priority Gaps (future work)

8. **Settlement router** — design per §9-§11 of the audit specification; implement only after gaps 1-3 are resolved.
9. **Chain-adapter abstraction** — design per §19 of the audit specification.
10. **Cross-chain safety mechanism** — design per §22 of the audit specification; implement only with formal security review.

---

## No Changes Made by This Matrix

This matrix is **read-only**. No capabilities were added, removed, or modified. The matrix documents the current state as of 2026-08-09 and informs the architecture design (`multi-network-architecture.md`) and the final certification (`final-network-architecture-certification.md`).
