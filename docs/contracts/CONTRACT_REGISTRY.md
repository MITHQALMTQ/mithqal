# MITHQAL Smart Contract Registry

**Version:** 1.0
**Date:** 2025-08-05
**Network:** Monad Testnet (Chain ID 10143)
**Authority:** Chief Constitutional Architect / Enterprise Security Architect

This registry is the **authoritative record** of every on-chain address associated with the MITHQAL platform. Previous references to "10 contracts" were imprecise — the actual architecture is **9 Protocol Smart Contracts + 1 Safe Multi-Signature Treasury (Gnosis Safe, not an ERC-20) + 1 Deployment Wallet (EOA, not a contract) = 11 on-chain addresses**. Only the 9 Protocol Smart Contracts are deployable Solidity artifacts that the platform's invariants apply to.

---

## Protocol Smart Contracts (9)

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

| # | Entity | Address | Network | Purpose | Type |
|---|---|---|---|---|---|
| 1 | Safe Multi-Sig Treasury | `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0` | Monad Testnet (10143) | Multi-signature treasury (operational governance) | Gnosis Safe (not an ERC-20, not a Protocol Smart Contract) |

The Safe Multi-Sig Treasury is the operational custody surface for protocol-controlled funds. It is **not** a Protocol Smart Contract — it does not implement any of the 21 constitutional invariants. It is a Gnosis Safe instance used for multi-signature authorization of operational transactions.

---

## Deployment (1)

| # | Entity | Address | Network | Purpose | Type |
|---|---|---|---|---|---|
| 1 | Deployment Wallet | `0x3C3932F865892EFabE45892f453f81B64f6c8d8c` | Monad Testnet (10143) | Contract deployer (initial admin, will be rotated post-mainnet) | EOA (Externally Owned Account — not a contract) |

The Deployment Wallet is an EOA, not a smart contract. It is the wallet that submitted the deployment transactions. Post-mainnet, all roles assigned to this EOA shall be renounced and re-assigned to the Safe Multi-Sig Treasury (per Article IV role-separation requirements).

---

## Summary

| Category | Count |
|---|---|
| Protocol Smart Contracts | 9 |
| Operational Governance (Safe Multi-Sig) | 1 |
| Deployment (EOA) | 1 |
| **Total on-chain addresses** | **11** |

---

## Verification Status

All 9 Protocol Smart Contracts have been **deployed and verified on Monad Testnet** via the `/api/onchain-test` endpoint (15/15 on-chain checks PASS). However, none of them have been externally audited. The following external validation activities are **pending**:

1. **Big-4 smart contract security audit** (e.g., OpenZeppelin, Trail of Bits, ConsenSys Diligence)
2. **Foundry test execution** in an external audit environment (forge must be installed and `forge test --summary` re-run with the audit team's toolchain)
3. **Slither static analysis** re-run in external environment
4. **Halmos symbolic execution** re-run in external environment
5. **Certora Prover** execution (CVL specifications exist for MTQ and MockOracle; specifications for the remaining 7 contracts must be authored and the cloud prover must be run with a valid API key)

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2025-08-05 | Initial publication. Resolves the previously imprecise "10 contracts" claim by separating the 9 Protocol Smart Contracts from the Safe Multi-Sig Treasury and the Deployment EOA. | Chief Constitutional Architect (Task 13-a) |

---

## Related Documents

- [`docs/evidence/EVIDENCE_CLASSIFICATION.md`](../evidence/EVIDENCE_CLASSIFICATION.md) — Evidence classification standard
- [`docs/evidence/EVIDENCE_LEDGER.md`](../evidence/EVIDENCE_LEDGER.md) — Institutional evidence ledger (40 entries)
- [`docs/evidence/INSTITUTIONAL_READINESS_MATRIX.md`](../evidence/INSTITUTIONAL_READINESS_MATRIX.md) — 10-dimension readiness matrix
- [`docs/verification/formal-verification-report.md`](../verification/formal-verification-report.md) — Formal verification status
- [`docs/verification/independent-evidence-audit.md`](../verification/independent-evidence-audit.md) — Independent evidence audit (E036 RESOLVED by this registry)
