# Multi-Network Architecture

**Document Date:** 2026-08-09
**Author:** Chief Enterprise Architect / Interoperability Architect (acting in concert)
**Status:** Architectural target — not yet implemented
**Authority:** §1, §9-§14, §30-§32, §38 of the multi-network architecture audit specification

---

## 1. Architectural Purpose

MITHQAL is **network-independent constitutional settlement infrastructure**. Blockchain networks serve as execution environments for MITHQAL deployments, but no individual blockchain constitutes the MITHQAL institution itself.

> **Monad is not MITHQAL.**
>
> **Arc is not MITHQAL.**
>
> **Anvil is not MITHQAL.**
>
> Future MITHQAL infrastructure must not depend constitutionally on any single blockchain.

The architecture described in this document is a **target** — not the current state. It defines how MITHQAL should evolve to become network-independent without becoming architecture-heavy prematurely. The current state is documented in `network-architecture-audit.md` and `network-contract-inventory.md`.

The strategic endpoint is:

> **MITHQAL is a constitutional settlement layer capable of operating across multiple approved execution environments and, eventually, institutional financial rails.**

Not:

> "MITHQAL is another blockchain."

---

## 2. Current Network Environments

MITHQAL is deployed across **three execution environments**. None of these is a production network; none is a mainnet; none constitutes the MITHQAL institution itself.

| Environment | Chain ID | Classification | Role | Status |
|---|---|---|---|---|
| **Monad Testnet** | 10143 | Primary Public Testnet | Public-facing testnet for institutional verification | Healthy |
| **Arc Network Testnet** | 5042002 | Secondary / Institutional Testnet | Cross-chain verification; secondary public testnet | Healthy |
| **Local Anvil Devnet** | 1337 | Local Development Network | Development, simulation, automated testing | Healthy (local only) |

**Total: 2 Public Testnets + 1 Local Development Network = 3 Supported Execution Environments**

---

## 3. Monad Role

**Classification:** Primary Public Testnet

Monad is the primary public testnet for MITHQAL. It is the default read chain for the application layer (`contract-reader.ts`'s legacy exports pin to Monad) and the only chain the wallet hook can connect to. The 9 Protocol Smart Contracts + 1 Gnosis Safe v1.4.1 + 1 deployer EOA are deployed on Monad.

**What Monad is:**
- An EVM-compatible testnet with public RPC and explorer
- The chain where the most thorough on-chain verification has been performed (15/15 checks PASS via `/api/onchain-test`)
- The chain referenced in the legal pages, demo video, and public-facing documentation

**What Monad is NOT:**
- The MITHQAL institution itself
- A production settlement network
- A mainnet
- The reserve custodian
- The constitutional authority

**Future state:** Monad remains one of multiple supported execution environments. The application layer's Monad-default behavior should be replaced by explicit chain selection (via the settlement router or a `?chain=` parameter on API routes).

---

## 4. Arc Role

**Classification:** Secondary / Institutional Testnet

Arc Network Testnet is the secondary public testnet. It exists to provide cross-chain verification — proving that the MITHQAL contracts can be deployed on multiple EVM-compatible chains without modification. The same 9 Protocol Smart Contracts + 1 Gnosis Safe v1.4.1 (same address as Monad) + 1 deployer EOA are deployed on Arc.

**What Arc is:**
- An EVM-compatible testnet with public RPC and explorer
- A secondary deployment target for cross-chain verification
- The chain referenced in the multi-chain `networks[]` array returned by `/api/status`

**What Arc is NOT:**
- The MITHQAL institution itself
- A production settlement network
- A mainnet
- The "real" deployment (Monad is not "real" either — both are testnets)
- A backup for Monad (Arc is not a failover target; see §11 below)

**Future state:** Arc remains a secondary public testnet. The application layer should treat Arc as a first-class citizen — not as a "secondary" curiosity. This means the wallet hook, admin routes, and on-chain test should all accept Arc as a target.

---

## 5. Anvil Role

**Classification:** Local Development Network

Local Anvil Devnet is the development environment. It runs on `localhost:8545` and is used for development, simulation, and automated testing. The 9 Protocol Smart Contracts are deployed on Anvil; the Safe Multi-Sig is a 1-of-1 EOA placeholder (no real Gnosis Safe is deployed locally).

**What Anvil is:**
- A local EVM node (Anvil) with persistent state (`.anvil/state.json`)
- A genuinely "free + no gas" environment — synthetic ETH pre-funded into 10 accounts (10,000 ETH each)
- The only environment where the Governance contract was deployed with a full 7-member council (7 Anvil accounts, not institutional signers)

**What Anvil is NOT:**
- A public network
- A production network
- An institutional network
- A live settlement network
- A failover target for Monad or Arc

**Future state:** Anvil remains the local development network. It should never be presented as public or production. The UI must clearly mark it as "Local Development" (already done in `testnet.tsx` via the `CHAIN_META.local` tagline).

---

## 6. Network Independence Principle

> **MITHQAL is network-independent constitutional settlement infrastructure. Blockchain networks may serve as execution environments for MITHQAL deployments, but no individual blockchain constitutes the MITHQAL institution itself.**

This principle has three implications:

1. **No chain is canonical.** The application layer must not treat any single chain as the "real" deployment. The current Monad-default behavior is a transitional state, not the target architecture.

2. **No chain is irreplaceable.** If Monad, Arc, or Anvil becomes unavailable, MITHQAL continues to exist — its constitutional identity, reserve framework, and governance model are independent of any chain.

3. **No chain defines MITHQAL.** Adding a new chain (e.g., a future institutional EVM, a bank settlement rail, a CBDC adapter) does not change what MITHQAL is. Removing a chain does not change what MITHQAL is.

The network independence principle does **not** mean:
- All chains are equivalent (they have different capabilities, finality, and trust assumptions).
- Cross-chain settlement is automatic (it requires formal design and security review).
- MITHQAL must deploy on every possible chain (deployment is a deliberate decision, not a default).

---

## 7. Settlement Router Target Architecture

The Universal Settlement Router is the architectural target for routing settlement operations across multiple chains. It sits between the Constitutional Core and the network-specific RPC clients.

```text
                         MITHQAL
                Constitutional Institution
                           │
                           ▼
                 MITHQAL Constitution
                           │
                           ▼
                  Constitutional Core
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Reserve          Governance       Monetary
       Framework          Engine           Rules
          └────────────────┼────────────────┘
                           ▼
                    Settlement Core
                           │
                           ▼
             Universal Settlement Router
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 Monad Adapter         Arc Adapter        Future Adapter
       │                   │                   │
       ▼                   ▼                   ▼
 Monad Testnet          Arc Testnet       Institutional
                                           / Bank / CBDC
                                           / Other Rails
```

### Router Responsibilities

The router should be capable of determining:

- **Supported networks** — which chains MITHQAL is deployed on
- **Chain ID** — EIP-155 chain ID for each supported network
- **Contract addresses** — per-chain addresses for each Protocol Smart Contract
- **Settlement capabilities** — what each chain can do (mint, redeem, transfer, govern)
- **Asset support** — what assets each chain supports (native, ERC-20, etc.)
- **Transaction capabilities** — whether the router can submit transactions or only read
- **Confirmation/finality characteristics** — block time, finality threshold, reorg risk
- **Oracle availability** — whether a fresh oracle feed is available on each chain
- **Mint capability** — whether the mint path is operational on each chain
- **Redemption capability** — whether the redeem path is operational on each chain
- **Governance requirements** — whether the Constitutional Council is seated on each chain
- **Reserve-related constraints** — whether the reserve accounting is consistent across chains
- **Network health** — RPC availability, block height progression, contract code presence
- **Deployment version** — which source commit + compiler version produced the deployed bytecode

### Router Authority Limits (per §37 of the audit specification)

The Settlement Router must **NOT** have authority to:

- Arbitrarily mint MTQ
- Arbitrarily redeem MTQ
- Alter reserves
- Alter constitutional parameters
- Bypass Governance
- Bypass Safe/Multi-Sig
- Bypass Oracle controls
- Bypass reserve requirements

> **The router routes settlement operations. It does not become a monetary authority.**

The router is an implementation layer. It does not become a constitutional authority. All state-changing operations must still be authorized by the Safe Multi-Sig (once operationalized) and executed through the appropriate chain's contracts.

### Current State

**The router does not exist.** The closest thing is `getChainReader(chainKey)` in `contract-reader.ts:78-130`, which is a read-only factory — it cannot mint, redeem, transfer, or execute governance actions. Implementing the router is a future architectural phase (Phase D in §36 of the audit specification) and should not begin until:

1. The Safe Multi-Sig is operationalized (3-of-5 with 5 named institutional signers).
2. The Constitutional Council is seated on each chain.
3. All admin roles are transferred from the deployer EOA to the Safe Multi-Sig.
4. The cross-chain safety report (`cross-chain-safety-report.md`) is reviewed and approved.

---

## 8. Network Adapter Model

Each chain has a **MITHQAL Settlement Network Adapter** — an implementation abstraction that encapsulates the chain-specific details (RPC URL, contract addresses, explorer URL, native currency, finality characteristics) behind a uniform interface.

```text
MITHQAL Settlement Core
          │
          ▼
Universal Settlement Router
          │
 ┌────────┼────────┐
 │        │        │
 ▼        ▼        ▼
Monad    Arc     Future
Adapter  Adapter  Adapter
```

### Adapter Interface (Target)

Each adapter should expose:

```typescript
interface SettlementNetworkAdapter {
  // Identity
  chainKey: "monad" | "arc" | "local" | string;  // extensible for future chains
  chainId: number;
  name: string;
  environment: "public-testnet" | "local-devnet" | "institutional" | "mainnet";

  // Connectivity
  rpcUrl: string;
  explorer: string | null;  // null for local devnet
  nativeCurrency: { name: string; symbol: string; decimals: number };

  // Contracts (per-chain addresses)
  contracts: {
    MTQ_TOKEN: string;
    GOVERNANCE: string;
    SAFE_MULTI_SIG: string;
    ALGORITHM: string;
    RESERVE: string;
    MINT: string;
    REDEEM: string;
    ORACLE: string;
    TAKAFUL: string;
    DEPLOYER: string;
  };

  // Capabilities (what this chain can do)
  capabilities: {
    public: boolean;
    explorerAvailable: boolean;
    walletIntegration: boolean;
    mintOperational: boolean;
    redeemOperational: boolean;
    oracleOperational: boolean;
    governanceOperational: boolean;
    safeOperational: boolean;
  };

  // Health
  health: {
    rpcReachable: boolean;
    blockHeight: number | null;
    contractCodePresent: Record<string, boolean>;
    lastCheckedAt: string;
  };

  // Deployment provenance
  provenance: {
    deploymentDate: string;
    sourceCommit: string;
    compilerVersion: string;
    deploymentScript: string;
    deploymentVersion: string;
  };

  // Read operations
  getContractInfo(): Promise<ContractInfo>;
  getBalance(address: string): Promise<Balance>;
  getBlockNumber(): Promise<number>;
  contractExists(address: string): Promise<boolean>;

  // Write operations (Phase E+ — not yet implemented)
  // buildMintTx(amount, recipient): Promise<TxRequest>;
  // buildRedeemTx(amount, redeemer): Promise<TxRequest>;
  // buildTransferTx(to, amount): Promise<TxRequest>;
}
```

### Current State

The `ChainConfig` interface in `src/lib/chains.ts:29-55` already defines the identity, connectivity, contracts, and native currency fields. The `getChainReader(chainKey)` factory in `contract-reader.ts:78-130` exposes the four read operations. The adapter interface is **partially implemented** — the capabilities, health, provenance, and write operations are missing.

### Future Adapter Categories (per §19 of the audit specification)

These are architectural possibilities only. **Do not implement unsupported integrations.**

```text
Public EVM Network Adapter        — Monad, Arc, future public EVM testnets/mainnets
Institutional EVM Adapter         — permissioned EVM chains for institutional settlement
Bank Settlement Adapter           — traditional bank settlement rails
CBDC Adapter                      — Central Bank Digital Currency rails
Payment Rail Adapter              — ISO 20022, SWIFT, SEPA, etc.
Permissioned Network Adapter      — consortium chains, BFT networks
Future MITHQAL Network Adapter    — if a proprietary MITHQAL network is ever justified (see §10)
```

---

## 9. Reserve Independence

The reserve architecture is **completely separate** from the network architecture. Reserve assets are held off-chain by approved custodian institutions under the Constitutional Reserve Framework.

```text
                MITHQAL CONSTITUTION
                         │
                         ▼
                  Reserve Framework
                         │
                         ▼
               Approved Custodians
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
           Gold        Silver     Cash/Sukuk
```

Separately:

```text
                MITHQAL SETTLEMENT
                         │
                         ▼
              Universal Settlement
                     Router
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Monad         Arc       Future Rail
```

These systems interact according to constitutional rules, but must not be represented as the same legal or custody layer.

### Reserve Asset Rule (per §14 of the audit specification)

The network architecture must not introduce any assumption that:

- Blockchain tokens are physical gold
- Smart contracts custody physical gold
- MITHQAL owns physical gold merely because an on-chain balance exists
- The operating company owns reserves
- The blockchain is a reserve custodian

> **Reserve assets are held in segregated custody under the Constitutional Reserve Framework through approved custodian institutions for the exclusive benefit of the MITHQAL reserve system. They are never operating assets and never corporate assets of JOZOUR LLC or any future operating entity.**

The blockchain does NOT own the reserves. Monad does NOT own the reserves. Arc does NOT own the reserves. Anvil does NOT own the reserves. The Settlement Router does NOT own the reserves. Smart contracts do NOT become legal custodians merely because they represent or enforce settlement logic.

---

## 10. Cross-Chain Safety

Before implementing actual cross-chain settlement, the following must be audited and formally designed (per §22 of the audit specification):

- Nonce handling (per-chain vs. global)
- Replay protection (cross-chain transaction replay)
- Message authentication (if a bridge or message-passing layer is introduced)
- Finality (when is a transaction considered final on each chain?)
- Canonical transaction identity (how to uniquely identify a settlement across chains)
- Cross-chain state synchronization (how to keep state consistent without a single source of truth)
- Oracle consistency (how to ensure oracle prices are consistent across chains)
- Mint authority (which chain's Safe Multi-Sig can authorize mints?)
- Redemption authority (which chain's Safe Multi-Sig can authorize redeems?)
- Reserve accounting (how to keep the reserve ledger consistent across chains)
- Emergency controls (how to pause all chains simultaneously in an emergency)
- Safe/multisig authorization (how to coordinate Safe actions across chains)

### Critical Rule (per §23 of the audit specification)

> **The constitutional state must remain singular.**

Do not allow:

```text
Monad state ≠ Arc state
```

without an explicit constitutional synchronization mechanism.

If multi-network deployment eventually represents the same monetary system, define exactly which state is:

- **Canonical** — the authoritative source of truth
- **Mirrored** — a read-only copy of the canonical state
- **Local** — chain-specific state (e.g., block number, gas price)
- **Pending** — state that has been proposed but not finalized
- **Finalized** — state that has reached finality and cannot be reverted

> **Do not assume that deploying identical contracts to two chains automatically creates one monetary system.**

### Current State

**No cross-chain settlement exists.** Each chain operates as an independent deployment with its own contract state. The MTQ total supply on Monad (310.95 MTQ) is independent of the MTQ total supply on Arc (not probed) and Local Anvil (0 MTQ). There is no bridge, no message-passing layer, and no state synchronization mechanism.

This is the correct state for the current phase. Cross-chain settlement is a future architectural decision that requires formal security and constitutional review.

---

## 11. Network Failure Model

The architecture must be resilient to an individual network becoming unavailable.

```text
Monad unavailable
       │
       ▼
Router detects failure
       │
       ▼
Do NOT alter constitutional state
       │
       ▼
Determine whether another approved
settlement environment is available
```

### Critical Rule (per §21 of the audit specification)

> **DO NOT automatically route monetary transactions across networks merely because one network fails.**

Any failover mechanism involving MTQ, reserves, minting, redemption, or monetary state must respect the existing constitutional rules.

No automatic failover may create:

- Double minting (minting on chain B because chain A is down, then minting again when chain A recovers)
- Duplicate redemption
- Reserve mismatch
- Replay
- Double settlement
- Inconsistent state
- Oracle inconsistency

**Design failover only after a full audit of the current monetary state model.**

### Current State

There is no failover mechanism. If Monad becomes unavailable, the application's read paths (which default to Monad) will return errors. The `/api/health` endpoint will report `rpc: ✗` and the overall status will be `degraded`. Users cannot manually switch to Arc or Local because the wallet hook and most API routes are Monad-only.

This is acceptable for the testnet phase. Failover design is a future architectural phase that depends on the settlement router (§7) and cross-chain safety mechanism (§10) being in place.

---

## 12. Future Institutional Rails

The architecture is designed to accommodate future institutional settlement rails — traditional bank settlement, CBDCs, payment rails (ISO 20022, SWIFT, SEPA), and permissioned consortium chains.

```text
             Universal Settlement Router
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 Monad Adapter         Arc Adapter        Future Adapter
       │                   │                   │
       ▼                   ▼                   ▼
 Monad Testnet          Arc Testnet       Institutional
                                           / Bank / CBDC
                                           / Other Rails
```

### Future Adapter Categories

These are architectural possibilities only. **Do not implement unsupported integrations.**

| Adapter Category | Example Targets | Status |
|---|---|---|
| Public EVM Network Adapter | Monad, Arc, Ethereum Sepolia, Polygon Amoy, Base Sepolia | 2 implemented (Monad, Arc); others are future |
| Institutional EVM Adapter | Permissioned EVM chains for institutional settlement | Future |
| Bank Settlement Adapter | Traditional bank settlement rails (ISO 20022, SWIFT) | Future |
| CBDC Adapter | Central Bank Digital Currency rails | Future |
| Payment Rail Adapter | SEPA, FedNow, TARGET2, FPS | Future |
| Permissioned Network Adapter | Consortium chains, BFT networks | Future |
| Future MITHQAL Network Adapter | A proprietary MITHQAL institutional network (see §13) | Future — decision gate required |

### Integration Principles

1. **Audit before integration.** Each new adapter requires a capability assessment, security review, and constitutional compliance check before implementation.
2. **No automatic integration.** Adding a new chain is a deliberate decision, not a default. The Constitutional Council must approve each new adapter.
3. **No chain is privileged.** A future institutional rail is not "more MITHQAL" than Monad or Arc — it is another execution environment.
4. **Reserve independence is preserved.** Adding a new adapter does not change the reserve framework or custody arrangements.

---

## 13. Future MITHQAL Network Decision Gate

A proprietary MITHQAL institutional network may only be considered when one or more objectively demonstrated requirements cannot be efficiently satisfied by existing networks.

### Possible Triggers

- **Institutional volume** — settlement volume exceeds what public testnets/mainnets can handle
- **Settlement latency** — sub-second finality is required for specific use cases
- **Privacy** — institutional settlement requires transaction privacy not available on public chains
- **Validator control** — MITHQAL needs to control validator participation for compliance
- **Institutional identity** — on-chain identity verification for institutional participants
- **Compliance requirements** — regulatory requirements that cannot be met on public chains
- **Interoperability** — specific interoperability requirements with other institutional networks
- **Predictable execution economics** — gas price stability for institutional settlement
- **Institutional finality** — stronger finality guarantees than public chains offer
- **Sovereignty requirements** — jurisdictional sovereignty over settlement infrastructure

### Decision Rule

> **Until those requirements are demonstrated:**
>
> **No proprietary MITHQAL blockchain should be built.**

This is a future architectural decision. **Do not implement it now.** The current architecture (3 supported execution environments, no proprietary chain) is the correct state for the current phase.

### What This Means Concretely

- Do NOT create a "MITHQAL Chain"
- Do NOT create a "MITHQAL L1" or "MITHQAL L2"
- Do NOT create a proprietary validator network
- Do NOT create a proprietary consensus mechanism
- Do NOT create a proprietary blockchain

The architectural principle is:

> **Network independence first. Proprietary network only if future institutional requirements objectively justify it.**

---

## 14. Constitutional Boundary

The network architecture evolution does **NOT** modify the existing constitutional architecture. The following remain protected:

- Reserve segregation (gold/silver/cash in approved custodian custody)
- Approved custody (Constitutional Reserve Framework)
- Constitutional governance (Council + Safe Multi-Sig + 4-role access control)
- Foundation independence (Mithqal Foundation's constitutional role)
- Commercial/constitutional separation (JOZOUR LLC operates commercial services; the Foundation holds the constitutional infrastructure)
- Current JOZOUR LLC operating structure
- Future Holding/Operations/Markets architecture (per the blueprint)
- Constitutional monetary rules (100%+ reserve, no discretionary minting, gold discipline)
- Minting rules (demand-driven, deposit-verified)
- Redemption rules (burn never pauses, physical gold redemption 1kg minimum)
- Governance rules (3-of-5 Safe, 7-member Council, 4-role access control)

> **The Settlement Router is an implementation layer. It does not become a constitutional authority.**

---

## 15. Legal / Institutional Language

Use the following language in all public-facing documentation, website copy, and legal disclosures:

> **MITHQAL is network-independent constitutional settlement infrastructure. Blockchain networks may serve as execution environments for MITHQAL deployments, but no individual blockchain constitutes the MITHQAL institution itself.**

> **The current Monad and Arc deployments are testnet implementations. Anvil is a local development environment. These environments do not by themselves constitute production institutional settlement infrastructure.**

**Do not claim:**
- Regulatory approval
- Institutional adoption
- Production settlement
- Custody relationships
- Mainnet deployment

**unless independently documented.**

---

## 16. Website Architecture Diagram

The website should present the following architecture diagram, clearly distinguishing **CURRENT** from **FUTURE**:

```text
                 MITHQAL
          Constitutional Layer
                    │
                    ▼
             Settlement Core
                    │
                    ▼
        Universal Settlement Router
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
    Monad          Arc        Future Rails
   Testnet       Testnet      (Bank / CBDC /
       │            │         Payment Rail /
       └────────────┼────────┘ Permissioned /
                    │         Proprietary)
              Local Anvil
             Development     ← CURRENT (Future Rails are NOT operational)
```

**Current state (operational):**
- Monad Testnet (Primary Public Testnet)
- Arc Network Testnet (Secondary / Institutional Testnet)
- Local Anvil Devnet (Local Development Network)

**Future state (architectural target — NOT operational):**
- Universal Settlement Router
- Network Adapters (formal abstraction)
- Future Institutional Rails (Bank, CBDC, Payment Rail, Permissioned, Proprietary)

> **Do not make future institutional rails appear operational.**

---

## 17. Implementation Phases (per §36 of the audit specification)

### Phase A — Correct terminology and classification ✅ (this audit cycle)
- Update `CONTRACT_REGISTRY.md` to reflect the 1-of-1 Safe reality
- Update UI labels to remove false "3-of-5 custodian" claim
- Update Solidity NatSpec comments to multi-chain language
- Update legal pages to acknowledge multi-chain
- Create the 7 audit/design documents (this commit)

### Phase B — Centralize network configuration ✅ (already done in `chains.ts`)
- `src/lib/chains.ts` is the single source of truth for chain config
- `getChainReader(chainKey)` factory in `contract-reader.ts`
- `/api/status` returns `networks[]` array
- `/api/health` probes all 3 RPCs

### Phase C — Introduce network adapter abstraction (future)
- Extend `ChainConfig` with `capabilities`, `health`, `provenance` fields
- Refactor `getChainReader` into a formal `SettlementNetworkAdapter` interface
- Add per-chain capability reporting to `/api/status`

### Phase D — Introduce Settlement Router interfaces (future)
- Design `src/lib/settlement-router.ts`
- Implement read-only routing (chain selection, capability checks)
- Do NOT implement write routing until the Safe Multi-Sig is operationalized

### Phase E — Connect existing Monad and Arc implementations (future)
- Refactor `/api/onchain-test` to accept `?chain=` parameter
- Refactor `/api/admin/oracle` and `/api/admin/update-price` to accept `chain` parameter
- Refactor `use-wallet.ts` to support multi-chain wallet connection
- Refactor UI components to consume `CHAINS` instead of hard-coded Monad literals

### Phase F — Keep Anvil as development adapter (ongoing)
- `scripts/start-anvil.sh` and `scripts/deploy-local.sh` are the devnet tooling
- Anvil state persists in `.anvil/state.json`
- Anvil is never presented as public or production

### Phase G — Add automated network capability and health checks (future)
- CI validates network classification (no code/doc claims Anvil is public/production)
- CI validates contract inventory (no undocumented deployments)
- CI validates address integrity (no malformed or duplicated cross-network addresses)
- CI validates architecture (no individual blockchain is described as MITHQAL itself)
- CI validates reserve independence (no network/contract is described as reserve owner/custodian)
- CI validates constitutional integrity (no network abstraction modifies constitutional principles)

### Critical Constraint

> **Do not implement actual cross-chain monetary transfers unless separately approved by a constitutional/security review.**

---

## 18. Success Criteria (per §39 of the audit specification)

The architecture evolution is successful only if:

- ✅ Monad remains operational
- ✅ Arc remains operational
- ✅ Anvil remains operational
- ✅ Existing contracts are preserved
- ✅ Contract addresses remain traceable
- ⚠️ Network classification is accurate (terminology corrections in Phase A will address this)
- ✅ Anvil is never presented as public/production
- ⚠️ Monad is not represented as MITHQAL itself (Phase A will correct remaining hard-coded "Monad Testnet" references)
- ⚠️ Arc is not represented as MITHQAL itself (same)
- ✅ No proprietary blockchain is created
- ✅ Network configuration is clean (`chains.ts` is the single source of truth)
- ⚠️ Network-specific assumptions are documented (this audit documents them; remediation in Phase E)
- ✅ Settlement Router architecture is clearly defined (this document)
- ✅ Existing constitutional logic remains unchanged
- ✅ Reserve ownership remains unchanged
- ✅ Custody remains independent
- ✅ No cross-chain minting is introduced without formal security review
- ✅ No duplicate monetary state is created
- ✅ No bridge is introduced merely for architectural appearance
- ✅ Existing Git governance remains intact
- ✅ Existing backup/disaster recovery remains intact
- ✅ Version provenance remains intact
- ⚠️ CI validates institutional/network integrity (Phase G — future)
- ⚠️ Website accurately describes the architecture (Phase A — terminology corrections)
- ⚠️ Documentation accurately describes the architecture (this commit + Phase A)
- ✅ An institutional reviewer can understand what exists today versus what is future architecture

---

## 19. Critical Non-Goals (per §40 of the audit specification)

Do NOT:

- Build MITHQAL Chain
- Build a validator network
- Create a new consensus mechanism
- Create a bridge
- Introduce cross-chain minting
- Introduce cross-chain redemption
- Change reserve ownership
- Change the Foundation's role
- Change the organizational structure
- Replace Monad
- Replace Arc
- Remove Anvil
- Claim mainnet
- Claim production settlement
- Claim institutional adoption
- Claim custody
- Claim regulatory approval

**unless a separate approved architectural decision explicitly authorizes it.**

---

## 20. Related Documents

- [`docs/verification/network-architecture-audit.md`](../verification/network-architecture-audit.md) — the audit that informs this architecture
- [`docs/verification/network-contract-inventory.md`](../verification/network-contract-inventory.md) — per-chain contract inventory
- [`docs/architecture/network-capability-matrix.md`](./network-capability-matrix.md) — per-chain capability matrix
- [`docs/verification/settlement-router-readiness-report.md`](../verification/settlement-router-readiness-report.md) — router implementation readiness
- [`docs/verification/network-independence-report.md`](../verification/network-independence-report.md) — network independence verification
- [`docs/verification/cross-chain-safety-report.md`](../verification/cross-chain-safety-report.md) — cross-chain safety analysis
- [`docs/verification/final-network-architecture-certification.md`](../verification/final-network-architecture-certification.md) — final certification
- [`docs/contracts/CONTRACT_REGISTRY.md`](../contracts/CONTRACT_REGISTRY.md) — authoritative contract registry
- [`docs/blueprint/blueprint.txt`](../blueprint/blueprint.txt) — the constitutional text (§Article IV)
- [`docs/blueprint/custody-framework-v2.md`](../blueprint/custody-framework-v2.md) — Constitutional Custody Framework v2.0 (tiered custody hierarchy)
- [`docs/architecture/custodian-eligibility-matrix.md`](./custodian-eligibility-matrix.md) — 12 custodian eligibility criteria
- [`docs/architecture/geographic-custody-strategy.md`](./geographic-custody-strategy.md) — 5-region custody diversification strategy
- [`docs/verification/custody-readiness-report.md`](../verification/custody-readiness-report.md) — custody operationalization readiness assessment
