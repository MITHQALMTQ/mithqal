# Network Contract Inventory

**Audit Date:** 2026-08-09
**Auditor:** Chief Enterprise Architect / CTO (acting in concert)
**Scope:** Every MITHQAL contract deployed on each of the three execution environments
**Method:** Static source review + on-chain verification via `cast call` / `eth_getCode`
**Authority:** §7, §8 of the multi-network architecture audit specification

---

## Inventory Summary

| Environment | Chain ID | Protocol Smart Contracts | Safe Multi-Sig | Deployment Wallet (EOA) | Total On-Chain Addresses |
|---|---|---|---|---|---|
| Monad Testnet (Primary Public) | 10143 | 9 | 1 (Gnosis Safe v1.4.1, 1-of-1) | 1 (deployer EOA) | 11 |
| Arc Network Testnet (Secondary Institutional) | 5042002 | 9 | 1 (Gnosis Safe v1.4.1, 1-of-1, same address as Monad) | 1 (same deployer EOA) | 11 |
| Local Anvil Devnet (Development) | 1337 | 9 | 0 (placeholder: deployer EOA stands in for Safe) | 1 (Anvil account #0) | 10 |

**Total across all environments:** 27 unique contract deployments + 1 placeholder + 2 EOAs (one shared across Monad/Arc, one for Local) = 32 on-chain addresses.

---

## §8 Safe/Multi-Sig Inventory Question — Resolved

> "The local list does NOT visibly include Safe/Multi-Sig. Therefore: AUDIT THIS BEFORE MAKING ANY ARCHITECTURAL CLAIM."

### Resolution

**The Local Anvil deployment intentionally does NOT deploy a Safe.** This is documented in `scripts/deploy-local.sh:110-112`:

```bash
# Safe Multi-Sig Treasury is a Gnosis Safe — on a local chain we use the
# deployer address as a placeholder "1-of-1 Safe" so the registry is complete.
SAFE_ADDR="$DEPLOYER_ADDR"
```

And in `src/lib/chains.ts:111-113`:

```typescript
// Local dev only: Safe is a 1-of-1 placeholder using the deployer EOA.
// In production this is a real Gnosis Safe.
SAFE_MULTI_SIG: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
```

**This is intentional, not an oversight.** A real Gnosis Safe deployment requires a SafeProxyFactory + SafeSingleton setup that is excessive for local development. The local chain uses the deployer EOA as a stand-in so that the `chains.ts` config shape is consistent across all three environments.

### Answers to the 6 specific questions in §8

1. **Is Safe deployed locally?** No. The Local Anvil "Safe" is the deployer EOA (`0xf39F…b92266`), not a contract. `eth_getCode` returns `0x`.
2. **If not, is that intentional?** Yes. See `scripts/deploy-local.sh:110-112` and `chains.ts:111-113`.
3. **Is Safe external infrastructure?** Yes. Gnosis Safe is a third-party contract system (`@safe-global/safe-contracts`). It is not part of the MITHQAL Protocol Smart Contract set — it is Operational Governance infrastructure, per `docs/blueprint/blueprint.txt:8976-8979`.
4. **Is Safe required by the current constitutional architecture?** Yes — §Article IV mandates a 3-of-5 Safe Multi-Sig with five named institutional signers. The current 1-of-1 deployer-controlled configuration on Monad and Arc is a **constitutional violation** (see F-CRITICAL-1 in `network-architecture-audit.md`).
5. **Are all production/testnet deployments using the same governance/security assumptions?** No. Monad and Arc use a real (but 1-of-1) Gnosis Safe; Local Anvil uses an EOA placeholder. None of the three satisfies the 3-of-5 constitutional requirement.
6. **Are the documentation and UI contract counts accurate?** No. The UI (`testnet.tsx:47`) claims "3-of-5 custodian · refuses rule-violating actions" — false on all three chains. The CONTRACT_REGISTRY.md claims 11 addresses per chain — true for Monad and Arc, but Local Anvil has 10 (the EOA placeholder is counted as both "Safe" and "Deployer", which is the same address).

---

## Per-Environment Contract Inventory

### Environment 1 — Monad Testnet (Primary Public Testnet)

**Chain ID:** 10143
**RPC:** `https://testnet-rpc.monad.xyz`
**Explorer:** `https://testnet.monadscan.com`
**Deployer EOA:** `0x3C3932F865892EFabE45892f453f81B64f6c8d8c`
**Deployment Date:** 2026-07-26 (per `CONTRACT_REGISTRY.md`)

| # | Contract | Address | Deployment Status | Verification | Constructor State | Dependencies |
|---|---|---|---|---|---|---|
| 1 | MTQ.sol | `0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD` | ✅ Deployed | `eth_getCode` returns bytecode; `name()` returns `"MITHQAL"`, `symbol()` returns `"MTQ"`, `decimals()` returns `18`, `totalSupply()` returns `310.95 MTQ` | No constructor args (default init) | None |
| 2 | Governance.sol | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` | ✅ Deployed | `eth_getCode` returns bytecode | `address[] _initialCouncil` — deployed with deployer EOA as the sole member (1 of 7 slots; constitutional violation) | None |
| 3 | Algorithm.sol | `0x8839ce50e8D414005518769999c0A5b961D00CB2` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq, address _reserve, address _oracle)` — all Monad addresses | MTQ, Reserve, Oracle |
| 4 | Reserve.sol | `0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177` | ✅ Deployed | `eth_getCode` returns bytecode | `()` — no args; deployer receives all 4 roles (COUNCIL, MINTER, REDEEMER, ORACLE) | None |
| 5 | Mint.sol | `0x197e9CB28216dfe18a199b4c2930F74C2F460809` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq, address _reserve, address _takaful)` — all Monad addresses | MTQ, Reserve, Takaful |
| 6 | Redeem.sol | `0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq, address _reserve, address _takaful)` — all Monad addresses | MTQ, Reserve, Takaful |
| 7 | Oracle.sol | `0xDfcA66ac0450C9AB86307af1942E157C5A4DB713` | ✅ Deployed | `eth_getCode` returns bytecode | `()` — no args; deployer receives DEFAULT_ADMIN + ORACLE_PROVIDER roles | None |
| 8 | Takaful.sol | `0x3eC27BB283644eF0A98B9961E9FBED0583a02f19` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq)` — Monad MTQ address | MTQ |
| 9 | MockOracle.sol | (not deployed on Monad — test contract only) | N/A | N/A | N/A | N/A |
| 10 | Safe Multi-Sig Treasury | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` | ✅ Deployed (bytecode present, 171 bytes) | **VERIFIED 2026-08-09 via `cast call`:** `VERSION()` returns `"1.4.1"`; `getThreshold()` returns `1`; `getOwners()` returns `[0x3C39…c8d8c]` (deployer EOA, sole owner) | Gnosis Safe v1.4.1 — **1-of-1, deployer-controlled** (constitutional violation; should be 3-of-5) | None (Safe is standalone) |
| 11 | Deployment Wallet | `0x3C3932F865892EFabE45892f453f81B64f6c8d8c` | N/A (EOA, not a contract) | N/A | N/A | N/A |

**Deployment evidence:** `monad-testnet-addresses.json`, `docs/contracts/CONTRACT_REGISTRY.md`, `TESTNET-TEST-REPORT.md`, `VERSION-PROVENANCE.yml`. Git commit history: `49bbb24 [ARC/MONAD] Update contract addresses and config` (2026-08-07).

---

### Environment 2 — Arc Network Testnet (Secondary / Institutional Testnet)

**Chain ID:** 5042002
**RPC:** `https://rpc.testnet.arc.io`
**Explorer:** `https://testnet.arcscan.app`
**Deployer EOA:** `0x3C3932F865892EFabE45892f453f81B64f6c8d8c` (same as Monad)
**Deployment Date:** 2026-08-09 (per `CONTRACT_REGISTRY.md` v1.1)

| # | Contract | Address | Deployment Status | Verification | Constructor State | Dependencies |
|---|---|---|---|---|---|---|
| 1 | MTQ.sol | `0x237c3Aa2B79248f86f6523D3890095BCd1996601` | ✅ Deployed | `eth_getCode` returns 3,474 bytes of bytecode (verified 2026-08-09) | No constructor args | None |
| 2 | Governance.sol | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` | ✅ Deployed | `eth_getCode` returns 13,129 bytes | `address[] _initialCouncil` — deployed with deployer EOA as sole member (1 of 7) | None |
| 3 | Algorithm.sol | `0x62f8E5243f32eE5C87a14A7896C61104aD9e7727` | ✅ Deployed | `eth_getCode` returns 1,237 bytes | `(address _mtq, address _reserve, address _oracle)` — all Arc addresses | MTQ, Reserve, Oracle |
| 4 | Reserve.sol | `0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471` | ✅ Deployed | `eth_getCode` returns 2,897 bytes | `()` — deployer receives all 4 roles | None |
| 5 | Mint.sol | `0x0dd8b4F8DA7fB6E3eE04ea9F24f853647F84c3aa` | ✅ Deployed | `eth_getCode` returns 2,847 bytes | `(address _mtq, address _reserve, address _takaful)` — all Arc addresses | MTQ, Reserve, Takaful |
| 6 | Redeem.sol | `0xcAde4594177829597882555Ff57d0e34092daF8e` | ✅ Deployed | `eth_getCode` returns 3,037 bytes | `(address _mtq, address _reserve, address _takaful)` — all Arc addresses | MTQ, Reserve, Takaful |
| 7 | Oracle.sol | `0xFd2B8d176bf059287638Db30D02C6651dA02861e` | ✅ Deployed | `eth_getCode` returns 2,601 bytes | `()` — deployer receives DEFAULT_ADMIN + ORACLE_PROVIDER roles | None |
| 8 | Takaful.sol | `0xA3B89FfdE28577A7D30E2c22503dB33509044EF0` | ✅ Deployed | `eth_getCode` returns 3,033 bytes | `(address _mtq)` — Arc MTQ address | MTQ |
| 9 | MockOracle.sol | (not deployed on Arc — test contract only) | N/A | N/A | N/A | N/A |
| 10 | Safe Multi-Sig Treasury | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` | ✅ Deployed (bytecode present, 171 bytes — same as Monad) | **VERIFIED 2026-08-09 via `cast call`:** `VERSION()` returns `"1.4.1"`; `getThreshold()` returns `1`; `getOwners()` returns `[0x3C39…c8d8c]` (deployer EOA, sole owner) | Gnosis Safe v1.4.1 — **1-of-1, deployer-controlled** (same as Monad) | None |
| 11 | Deployment Wallet | `0x3C3932F865892EFabE45892f453f81B64f6c8d8c` | N/A (EOA, same as Monad) | N/A | N/A | N/A |

**Deployment evidence:** `arc-testnet-addresses.json`, `docs/contracts/CONTRACT_REGISTRY.md` v1.1, `worklog.md` task `arc-network-integration`.

**Note on Safe address sharing:** The Safe Multi-Sig Treasury address `0xE718…7a7D0` is identical on Monad and Arc. This is technically possible via CREATE2 (same factory + same salt + same initialization calldata = same address on any chain), but **no CREATE2 factory setup is documented anywhere in the repository**. The on-chain verification confirms both Safes are real v1.4.1 instances with the same threshold (1) and sole owner (deployer EOA), so the shared address is consistent — but the deployment mechanism is undocumented.

---

### Environment 3 — Local Anvil Devnet (Development Network)

**Chain ID:** 1337
**RPC:** `http://localhost:8545`
**Explorer:** None (local devnet — no public explorer)
**Deployer EOA:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Anvil account #0, pre-funded with 10,000 ETH)
**Deployment Date:** 2026-08-09 (per `worklog.md` task `triple-chain-rollout`)
**State Persistence:** `.anvil/state.json` (458KB — survives `scripts/start-anvil.sh` restarts)

| # | Contract | Address | Deployment Status | Verification | Constructor State | Dependencies |
|---|---|---|---|---|---|---|
| 1 | MTQ.sol | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | ✅ Deployed | `eth_getCode` returns bytecode; `name()` returns `"Mithqal Settlement Token"`, `symbol()` returns `"MTQ"`, `totalSupply()` returns `0` | No constructor args | None |
| 2 | Governance.sol | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` | ✅ Deployed | `eth_getCode` returns bytecode | `address[] _initialCouncil` — deployed with **7 Anvil pre-funded accounts** as council members (full 7-of-7; constitutional size satisfied, though signers are not the institutional ones) | None |
| 3 | Algorithm.sol | `0x0165878A594ca255338adfa4d48449f69242Eb8F` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq, address _reserve, address _oracle)` — all Local addresses | MTQ, Reserve, Oracle |
| 4 | Reserve.sol | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` | ✅ Deployed | `eth_getCode` returns bytecode | `()` — deployer (Anvil #0) receives all 4 roles | None |
| 5 | Mint.sol | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq, address _reserve, address _takaful)` — all Local addresses | MTQ, Reserve, Takaful |
| 6 | Redeem.sol | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq, address _reserve, address _takaful)` — all Local addresses | MTQ, Reserve, Takaful |
| 7 | Oracle.sol | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` | ✅ Deployed | `eth_getCode` returns bytecode | `()` — deployer (Anvil #0) receives DEFAULT_ADMIN + ORACLE_PROVIDER roles | None |
| 8 | Takaful.sol | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` | ✅ Deployed | `eth_getCode` returns bytecode | `(address _mtq)` — Local MTQ address | MTQ |
| 9 | MockOracle.sol | (not deployed on Local — test contract only) | N/A | N/A | N/A | N/A |
| 10 | Safe Multi-Sig Treasury | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | ⚠️ **Placeholder** (EOA, not a contract) | `eth_getCode` returns `0x` — no bytecode; this is the deployer EOA, not a real Safe | N/A — no Safe deployed | N/A |
| 11 | Deployment Wallet | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | N/A (Anvil account #0, same as "Safe" placeholder) | N/A | N/A | N/A |

**Deployment evidence:** `local-testnet-addresses.json`, `scripts/deploy-local.sh`, `worklog.md` task `triple-chain-rollout`, `.anvil/state.json` (persisted Anvil state).

**Note on Local Governance:** The Local Anvil deployment is the **only** environment where the Governance contract was deployed with a full 7-member council (the 7 Anvil pre-funded accounts). Monad and Arc were deployed with the deployer EOA as the sole council member (1 of 7 slots). This means Local Anvil is the **only** environment that satisfies the `COUNCIL_SIZE = 7` requirement on paper — though the 7 Anvil signers are not the constitutionally-mandated institutional signers.

---

## Cross-Environment Comparison

### Address Sharing

| Address | Monad | Arc | Local | Notes |
|---|---|---|---|---|
| Deployer EOA | `0x3C39…c8d8c` | `0x3C39…c8d8c` | `0xf39F…b92266` | Monad + Arc share the same deployer; Local uses Anvil account #0 |
| Safe Multi-Sig | `0xE718…7a7D0` | `0xE718…7a7D0` | `0xf39F…b92266` (placeholder) | Monad + Arc share the same Safe address (likely via CREATE2, undocumented); Local uses deployer EOA as placeholder |
| MTQ Token | `0x9e6E…53aD` | `0x237c…6601` | `0x5FbD…0aa3` | Different on every chain (standard CREATE behavior) |
| All other contracts | Different | Different | Different | Each deployment produced fresh addresses |

### Constructor State Comparison

| Contract | Monad | Arc | Local |
|---|---|---|---|
| MTQ | No args | No args | No args |
| Governance | 1 council member (deployer) | 1 council member (deployer) | **7 council members (Anvil accounts #0-6)** |
| Reserve | Deployer = all 4 roles | Deployer = all 4 roles | Deployer (Anvil #0) = all 4 roles |
| Oracle | Deployer = ADMIN + PROVIDER | Deployer = ADMIN + PROVIDER | Deployer (Anvil #0) = ADMIN + PROVIDER |
| Mint | Wired to Monad MTQ/Reserve/Takaful | Wired to Arc MTQ/Reserve/Takaful | Wired to Local MTQ/Reserve/Takaful |
| Redeem | Wired to Monad MTQ/Reserve/Takaful | Wired to Arc MTQ/Reserve/Takaful | Wired to Local MTQ/Reserve/Takaful |
| Algorithm | Wired to Monad MTQ/Reserve/Oracle | Wired to Arc MTQ/Reserve/Oracle | Wired to Local MTQ/Reserve/Oracle |
| Takaful | Wired to Monad MTQ | Wired to Arc MTQ | Wired to Local MTQ |
| Safe Multi-Sig | 1-of-1, owner = deployer EOA | 1-of-1, owner = deployer EOA | Not deployed (EOA placeholder) |

### On-Chain State Comparison (MTQ token)

| Property | Monad | Arc | Local |
|---|---|---|---|
| `name()` | `"MITHQAL"` | (not probed — same source) | `"Mithqal Settlement Token"` |
| `symbol()` | `"MTQ"` | (same source) | `"MTQ"` |
| `decimals()` | `18` | (same source) | `18` |
| `totalSupply()` | `310.95 MTQ` | (not probed) | `0 MTQ` (fresh deployment, no minting yet) |

**Discrepancy:** The Monad MTQ returns `name()` = `"MITHQAL"` while the Local Anvil MTQ returns `name()` = `"Mithqal Settlement Token"`. This suggests the Monad deployment used an older version of `MTQ.sol` (or a different constructor path) that set the name to `"MITHQAL"`, while the current source code (`src/contracts/core/MTQ.sol`) sets it to `"Mithqal Settlement Token"`. **The Arc deployment should be probed to determine which name it returns** — this will indicate whether Arc was deployed from the current source or an older version.

---

## Recommendations

1. **Probe Arc MTQ `name()`** to determine whether Arc was deployed from the current source (`"Mithqal Settlement Token"`) or an older version (`"MITHQAL"`). If Arc returns `"MITHQAL"`, both Monad and Arc are running stale bytecode and should be redeployed from the current source after the Safe Multi-Sig is operationalized.

2. **Document the Safe deployment mechanism.** The shared Safe address on Monad + Arc implies a CREATE2 factory was used, but no factory address, salt, or initialization calldata is recorded. Add a `scripts/deploy-safe.sh` (or Foundry `SafeDeployment.s.sol`) that reproduces the deployment, and record the factory address + salt in `monad-testnet-addresses.json` and `arc-testnet-addresses.json`.

3. **Reconcile the contract count.** The CONTRACT_REGISTRY.md claims "11 on-chain addresses per chain" — true for Monad and Arc, but Local Anvil has 10 unique addresses (the EOA placeholder is counted as both Safe and Deployer). Update the registry to reflect this.

4. **Operationalize the Safe Multi-Sig.** This is the single most important remediation. Until the Safe is reconfigured to 3-of-5 with five named institutional signers (per `docs/blueprint/blueprint.txt:19759-19765`), the system remains founder-controlled and in violation of §Article IV.

5. **Add a Local Anvil Safe deployment.** Optionally, deploy a real 1-of-1 Gnosis Safe on Local Anvil (using `@safe-global/safe-contracts`) so that local development can exercise the full Safe interaction flow. This is not required for the architecture audit, but would improve developer experience.

---

## No Changes Made by This Inventory

This inventory is **read-only**. No contracts were deployed, redeployed, modified, or abandoned. No addresses were changed. The inventory documents the current state as of 2026-08-09 and informs the architecture audit (`network-architecture-audit.md`) and the capability matrix (`network-capability-matrix.md`).
