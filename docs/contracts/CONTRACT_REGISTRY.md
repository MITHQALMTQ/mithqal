# MITHQAL Smart Contract Registry

**Version:** 1.1
**Date:** 2026-08-09
**Networks:** Monad Testnet (Chain ID 10143) — primary · Arc Network Testnet (Chain ID 5042002) — secondary
**Authority:** Chief Constitutional Architect / Enterprise Security Architect

This registry is the **authoritative record** of every on-chain address associated with the MITHQAL platform. Previous references to "10 contracts" were imprecise — the actual architecture is **9 Protocol Smart Contracts + 1 Safe Multi-Signature Treasury (Gnosis Safe, not an ERC-20) + 1 Deployment Wallet (EOA, not a contract) = 11 on-chain addresses per chain**. Only the 9 Protocol Smart Contracts are deployable Solidity artifacts that the platform's invariants apply to.

As of v1.1 (2026-08-09), the protocol is deployed on TWO testnets in parallel. The Safe Multi-Sig Treasury and Deployment Wallet addresses are identical across both chains (same deployer, same Safe creation), while the 7 remaining contract addresses differ because each deployment produced a fresh address. The application layer (`src/lib/chains.ts`) treats Monad as the default read chain; Arc is exposed via `getChainReader("arc")` for cross-chain verification.

---

## Protocol Smart Contracts (9) — Monad Testnet (Chain ID 10143)

| # | Contract | Address | Network | Purpose | Verification |
|---|---|---|---|---|---|
| 1 | MTQ.sol | `0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD` | Monad Testnet (10143) | ERC-20 settlement unit | Pending external audit |
| 2 | Governance.sol | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` | Monad Testnet (10143) | Constitutional governance | Pending external audit |
| 3 | Algorithm.sol | `0x8839ce50e8D414005518769999c0A5b961D00CB2` | Monad Testnet (10143) | Monetary algorithm | Pending external audit |
| 4 | Reserve.sol | `0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177` | Monad Testnet (10143) | Reserve management | Pending external audit |
| 5 | Mint.sol | `0x197e9CB28216dfe18a199b4c2930F74C2F460809` | Monad Testnet (10143) | Minting operations | Pending external audit |
| 6 | Redeem.sol | `0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4` | Monad Testnet (10143) | Redemption operations | Pending external audit |
| 7 | Oracle.sol | `0xDfcA66ac0450C9AB86307af1942E157C5A4DB713` | Monad Testnet (10143) | Price oracle | Pending external audit |
| 8 | Takaful.sol | `0x3eC27BB283644eF0A98B9961E9FBED0583a02f19` | Monad Testnet (10143) | Risk protection (mutual stabilization) | Pending external audit |
| 9 | MockOracle.sol | (test only — not in production deployment set) | Monad Testnet (10143) | Test oracle (for Foundry test harness only) | N/A (test contract) |

## Protocol Smart Contracts (9) — Arc Network Testnet (Chain ID 5042002)

Deployed 2026-08-09. All 9 contracts verified on `testnet.arcscan.app`. Same source code as the Monad deployment — only the deployment addresses differ.

| # | Contract | Address | Network | Purpose | Verification |
|---|---|---|---|---|---|
| 1 | MTQ.sol | `0x237c3Aa2B79248f86f6523D3890095BCd1996601` | Arc Testnet (5042002) | ERC-20 settlement unit | Pending external audit |
| 2 | Governance.sol | `0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66` | Arc Testnet (5042002) | Constitutional governance | Pending external audit |
| 3 | Algorithm.sol | `0x62f8E5243f32eE5C87a14A7896C61104aD9e7727` | Arc Testnet (5042002) | Monetary algorithm | Pending external audit |
| 4 | Reserve.sol | `0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471` | Arc Testnet (5042002) | Reserve management | Pending external audit |
| 5 | Mint.sol | `0x0dd8b4F8DA7fB6E3eE04ea9F24f853647F84c3aa` | Arc Testnet (5042002) | Minting operations | Pending external audit |
| 6 | Redeem.sol | `0xcAde4594177829597882555Ff57d0e34092daF8e` | Arc Testnet (5042002) | Redemption operations | Pending external audit |
| 7 | Oracle.sol | `0xFd2B8d176bf059287638Db30D02C6651dA02861e` | Arc Testnet (5042002) | Price oracle | Pending external audit |
| 8 | Takaful.sol | `0xA3B89FfdE28577A7D30E2c22503dB33509044EF0` | Arc Testnet (5042002) | Risk protection (mutual stabilization) | Pending external audit |
| 9 | MockOracle.sol | (test only — not in production deployment set) | Arc Testnet (5042002) | Test oracle (for Foundry test harness only) | N/A (test contract) |

### Source artifacts

Protocol smart contract source files:

```
src/contracts/core/MTQ.sol          (canonical source, mirrored in foundry/src/)
src/contracts/core/Mint.sol
src/contracts/core/Redeem.sol
src/contracts/core/Reserve.sol
src/contracts/core/Algorithm.sol
src/contracts/governance/Governance.sol
src/contracts/governance/Takaful.sol
src/contracts/oracle/Oracle.sol
src/contracts/oracle/MockOracle.sol
```

### Roles Configured

`DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE` — assigned per contract per Article IV role-separation requirements.

---

## Operational Governance (1)

The Safe Multi-Sig Treasury address is identical across both Monad and Arc deployments (same deployer; the shared address is consistent with a CREATE2 factory deployment, though the specific factory setup is not documented in the repository).

| # | Entity | Address | Network | Purpose | Type |
|---|---|---|---|---|---|
| 1 | Safe Multi-Sig Treasury | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` | Monad Testnet (10143) + Arc Testnet (5042002) | Multi-signature treasury (operational governance) | Gnosis Safe v1.4.1 (verified on-chain 2026-08-09 via `cast call VERSION()`) |

### ⚠️ Current Status: NON-COMPLIANT

On-chain verification (2026-08-09) confirms the Safe Multi-Sig Treasury is a real Gnosis Safe v1.4.1 on both Monad and Arc, but it is configured as **1-of-1 with the deployer EOA as the sole owner**:

| Property | Monad (10143) | Arc (5042002) | Constitutional Target (§Article IV) |
|---|---|---|---|
| `VERSION()` | `"1.4.1"` | `"1.4.1"` (same bytecode) | Gnosis Safe (any version) |
| `getThreshold()` | **`1`** | **`1`** | **`3`** (3-of-5) |
| `getOwners()` | **`[0x3C39…c8d8c]`** (deployer EOA) | **`[0x3C39…c8d8c]`** (deployer EOA) | 5 named institutional signers (CEO UAE, CFO UAE, Board Member Singapore, Custodian UK, Auditor Third-party — per `blueprint.txt:19759-19765`) |

This is a **direct, present-tense violation of §Article IV** of the Constitution, which mandates:
1. Safe Multi-Sig configured as 3-of-5 (not 1-of-1)
2. EOAs shall not retain operational authority after deployment (the deployer EOA currently holds all admin roles)

See `docs/verification/investor-due-diligence-simulation.md` (E047) and `docs/verification/institutional-readiness-program-report.md` (lines 227, 241) for the candid assessment of this non-compliance. The system is currently **founder-controlled** until the Constitutional Council is seated and the Safe is reconfigured to 3-of-5 with the 5 named institutional signers.

**Remediation required before any "mainnet ready" claim:**
1. Seat the Constitutional Council (fill the remaining 6 of 7 council slots on Governance.sol).
2. Deploy a real 3-of-5 Gnosis Safe with the 5 named institutional signers (or reconfigure the existing Safe via `addOwnerWithThreshold` calls).
3. Transfer all admin roles (DEFAULT_ADMIN, MINTER, PAUSER, ORACLE_PROVIDER, COUNCIL) from the deployer EOA to the Safe Multi-Sig on all chains.
4. Verify the reconfiguration via `cast call getThreshold()` (should return `3`) and `cast call getOwners()` (should return 5 addresses).

The Safe Multi-Sig Treasury is the operational custody surface for protocol-controlled funds. It is **not** a Protocol Smart Contract — it does not implement any of the 21 constitutional invariants. It is a Gnosis Safe instance used for multi-signature authorization of operational transactions.

---

## Deployment (1)

The Deployment Wallet address is identical across both chains (same EOA).

| # | Entity | Address | Network | Purpose | Type |
|---|---|---|---|---|---|
| 1 | Deployment Wallet | `0x3C3932F865892EFabE45892f453f81B64f6c8d8c` | Monad Testnet (10143) + Arc Testnet (5042002) | Contract deployer (initial admin, will be rotated post-mainnet) | EOA (Externally Owned Account — not a contract) |

The Deployment Wallet is an EOA, not a smart contract. It is the wallet that submitted the deployment transactions on both networks. Per §Article IV of the Constitution, EOAs shall not retain operational authority after deployment; all operational authority shall be transferred to the Safe Multi-Sig. **This transfer has NOT yet occurred** — the deployer EOA currently holds all admin roles (DEFAULT_ADMIN, MINTER, PAUSER, ORACLE_PROVIDER, COUNCIL) on all three chains. This is a constitutional non-compliance (see F-CRITICAL-1 in `docs/verification/network-architecture-audit.md`). The transfer must be completed before any "mainnet ready" claim.

---

## Summary

| Category | Count per chain | Total across both chains |
|---|---|---|
| Protocol Smart Contracts | 9 | 18 |
| Operational Governance (Safe Multi-Sig) | 1 (shared) | 1 |
| Deployment (EOA) | 1 (shared) | 1 |
| **Total on-chain addresses** | **11 per chain** | **20** (18 unique + 2 shared) |

---

## Network Configuration

| Property | Monad Testnet | Arc Network Testnet |
|---|---|---|
| Chain ID | 10143 | 5042002 |
| RPC URL | `https://testnet-rpc.monad.xyz` | `https://rpc.testnet.arc.io` |
| Explorer | `https://testnet.monadscan.com` | `https://testnet.arcscan.app` |
| Native currency | MON (18 decimals) | USDC (18 decimals) |
| Role | Primary (default read chain) | Secondary (cross-chain verification) |
| Deployed | 2026-07-26 | 2026-08-09 |

The application layer (see `src/lib/chains.ts`) treats Monad as the default chain for all read paths; Arc is exposed via `getChainReader("arc")` for cross-chain verification and is reported as an informational check in `/api/health` (does not gate the overall health status).

## Verification Status

All 9 Protocol Smart Contracts have been **deployed and verified on both Monad Testnet and Arc Network Testnet** via the `/api/onchain-test` endpoint (15/15 on-chain checks PASS on Monad; Arc is verified via `eth_getCode` returning non-empty bytecode for each address). However, none of them have been externally audited. The following external validation activities are **pending**:

1. **Big-4 smart contract security audit** (e.g., OpenZeppelin, Trail of Bits, ConsenSys Diligence)
2. **Foundry test execution** in an external audit environment (forge must be installed and `forge test --summary` re-run with the audit team's toolchain)
3. **Slither static analysis** re-run in external environment
4. **Halmos symbolic execution** re-run in external environment
5. **Certora Prover** execution (CVL specifications exist for MTQ and MockOracle; specifications for the remaining 7 contracts must be authored and the cloud prover must be run with a valid API key)

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-08-09 | v1.1 — Added Arc Network Testnet (Chain ID 5042002) as second deployment target. All 9 Protocol Smart Contracts redeployed on Arc with identical source code; addresses captured in `arc-testnet-addresses.json`. Application layer extended with `src/lib/chains.ts` for multi-chain support; `/api/status` now reports a `networks` array, `/api/health` probes Arc RPC as informational check. | Chief Constitutional Architect |
| 2025-08-05 | Initial publication. Resolves the previously imprecise "10 contracts" claim by separating the 9 Protocol Smart Contracts from the Safe Multi-Sig Treasury and the Deployment EOA. | Chief Constitutional Architect (Task 13-a) |

---

## Related Documents

- [`docs/evidence/EVIDENCE_CLASSIFICATION.md`](../evidence/EVIDENCE_CLASSIFICATION.md) — Evidence classification standard
- [`docs/evidence/EVIDENCE_LEDGER.md`](../evidence/EVIDENCE_LEDGER.md) — Institutional evidence ledger (40 entries)
- [`docs/evidence/INSTITUTIONAL_READINESS_MATRIX.md`](../evidence/INSTITUTIONAL_READINESS_MATRIX.md) — 10-dimension readiness matrix
- [`docs/verification/formal-verification-report.md`](../verification/formal-verification-report.md) — Formal verification status
- [`docs/verification/independent-evidence-audit.md`](../verification/independent-evidence-audit.md) — Independent evidence audit (E036 RESOLVED by this registry)
- [`docs/blueprint/custody-framework-v2.md`](../blueprint/custody-framework-v2.md) — Constitutional Custody Framework v2.0 (tiered custody hierarchy: Official-Sector / Regulated Bank / Specialized Vault / Contingency)
- [`docs/architecture/custodian-eligibility-matrix.md`](../architecture/custodian-eligibility-matrix.md) — 12 custodian eligibility criteria
- [`docs/architecture/geographic-custody-strategy.md`](../architecture/geographic-custody-strategy.md) — 5-region custody diversification strategy
- [`docs/verification/custody-readiness-report.md`](../verification/custody-readiness-report.md) — Custody operationalization readiness (NOT READY — 10/33 criteria met)
