# Network Architecture Audit

**Audit Date:** 2026-08-09
**Auditor:** Chief Enterprise Architect / CTO / Chief Constitutional Engineer (acting in concert)
**Audit Scope:** Full repository + on-chain verification across all three execution environments
**Authority:** MITHQAL Constitution §Article IV; multi-network architecture audit mandate (§35 of the audit specification)
**Status:** COMPLETE — no architectural code changes were made before this audit was finalized (per §35)

---

## Executive Summary

MITHQAL is currently deployed across **three execution environments**: Monad Testnet (primary public), Arc Network Testnet (secondary institutional), and Local Anvil Devnet (development-only). A multi-chain configuration layer (`src/lib/chains.ts`) was introduced on 2026-08-09 and is consumed by five files; the remaining codebase still treats Monad as the implicit default through hard-coded literals and the legacy single-chain exports of `contract-reader.ts`.

The audit identified **no settlement router**, **no chain-adapter abstraction**, and **no cross-chain state synchronization mechanism** in the current implementation. The "Safe Multi-Sig Treasury" advertised as a 3-of-5 custodian in the UI is, on chain, a **1-of-1 Gnosis Safe v1.4.1 owned solely by the deployer EOA** — a founder-controlled configuration that materially diverges from the constitutional requirement (§Article IV mandates a 3-of-5 threshold with five named institutional signers).

No constitutional monetary logic, reserve framework, governance model, or organizational structure was modified by this audit. The audit is read-only with respect to the constitutional core.

---

## Audit Method

The audit combined:

1. **Static source review** of every `.ts`, `.tsx`, `.sol`, `.md`, `.sh`, `.json`, and `.yml` file in the repository (excluding `node_modules/`, `.next/`, `foundry/lib/`, and `foundry/out/`).
2. **On-chain verification** via `cast call` against all three RPC endpoints (`testnet-rpc.monad.xyz`, `rpc.testnet.arc.io`, `localhost:8545`), including Safe identity probes (`getThreshold()`, `getOwners()`, `VERSION()`).
3. **Documentation cross-reference** between `docs/contracts/CONTRACT_REGISTRY.md`, `docs/blueprint/blueprint.txt` (the constitutional text), and the `docs/verification/*` evidence ledger.
4. **Git history review** (`git log --all --oneline -i --grep=...`) for deployment provenance and Safe creation evidence.

---

## §35 Audit Questions — Answered

The audit specification (§35) mandates that the following 17 questions be answered **before any architectural code changes are made**. Each is answered below with concrete evidence (file paths + line numbers + on-chain results).

### Q1. What network abstraction already exists?

**Answer:** A single configuration module, `src/lib/chains.ts` (added 2026-08-09, commit `8bb0f17`), defines a `CHAINS` constant with three entries (`monad`, `arc`, `local`), a `ChainConfig` interface, and three helpers (`DEFAULT_CHAIN`, `ALL_CHAINS`, `chainById`, `chainByKey`). A factory function `getChainReader(chainKey)` in `src/lib/contract-reader.ts:78-130` returns a per-chain reader object exposing `getContractInfo()`, `getBalance()`, `getBlockNumber()`, and `contractExists()`.

**Adoption is narrow.** Only **5 files** import from `@/lib/chains`:

| File | Line | Imports |
|---|---|---|
| `src/lib/contract-reader.ts` | 16 | `CHAINS, DEFAULT_CHAIN, ChainConfig` |
| `src/app/api/status/route.ts` | 4 | `ALL_CHAINS` |
| `src/app/api/health/route.ts` | 3 | `ALL_CHAINS` |
| `src/components/testnet.tsx` | 29 | `CHAINS, ALL_CHAINS, ChainConfig` |
| `src/components/verify-on-chain.tsx` | 21 | `CHAINS` |

**No settlement router, no chain adapter abstraction, and no cross-chain dispatch exist.** The `getChainReader` factory is the only chain-routing primitive, and every legacy export in `contract-reader.ts` (`getContractInfo`, `getBalance`, `getBlockNumber`, `getTransactionReceipt`) calls it with the default `"monad"` argument — meaning Arc and Local are reachable only by direct `getChainReader("arc" | "local")` calls, which **no current caller makes** except `verify-on-chain.tsx` (UI) and the `/api/status` + `/api/health` enumerators.

### Q2. How does the frontend select networks?

**Answer:** The frontend has exactly one network selector: a three-button toggle in `src/components/testnet.tsx:816-850` (the `/testnet` view), backed by `useState<ChainKey>("monad")` at line 227. The toggle re-renders the deployed-contracts grid with the selected chain's addresses and updates the `chainKey` prop passed to `<VerifyOnChain>`.

**No other frontend view supports network selection.** The Operating System view, Transparency view, Demo view, Public Site view, FAQ, Admin Console, and all legal pages are hard-coded to Monad — they either embed Monad addresses as literals or import the legacy `CONTRACTS`/`NETWORK` constants from `contract-reader.ts` (which pin to Monad).

The wallet hook (`src/lib/use-wallet.ts:28-35`) is hard-coded to Monad: it can only add the Monad chain to MetaMask (`chainId: "0x27f7"`, `rpcUrls: ["https://testnet-rpc.monad.xyz"]`, `blockExplorerUrls: ["https://testnet.monadscan.com"]`). Users cannot connect their wallet to Arc or Local Anvil through the UI.

### Q3. How does the backend select networks?

**Answer:** The backend does not select networks dynamically. Every API route that performs on-chain reads either:

1. Imports `CONTRACTS`/`NETWORK` from `contract-reader.ts` (which re-exports `CHAINS.monad`), OR
2. Defines its own hard-coded Monad constants.

The only routes that acknowledge multi-chain are `/api/status` (returns a `networks[]` array via `ALL_CHAINS`) and `/api/health` (probes all three RPCs as informational checks). Neither accepts a `?chain=` query parameter — they always operate on all chains simultaneously.

The five files importing from `contract-reader.ts`:

| File | Line | Imported symbols | Effective chain |
|---|---|---|---|
| `src/app/api/balance/[address]/route.ts` | 2 | `getBalance, NETWORK` | Monad (default) |
| `src/app/api/reserve/status/route.ts` | 9 | `getContractInfo` | Monad (default) |
| `src/app/api/contract/info/route.ts` | 2 | `getContractInfo` | Monad (default) |
| `src/app/api/status/route.ts` | 3 | `CONTRACTS, NETWORK` | Monad (legacy field) + all chains (`networks[]`) |
| `src/components/operating-system.tsx` | 30 | `buildTransferCalldata` | Monad (default) |

### Q4. Where are chain IDs defined?

**Answer:** The canonical source of truth is `src/lib/chains.ts:27` — `export type ChainId = 10143 | 5042002 | 1337;`. Each `CHAINS.<key>.chainId` field carries the numeric value.

**However, the chain ID is also hard-coded as a literal in 7 active source files** (audit found 11 total occurrences, 7 of which are problematic):

| File | Line | Literal | Should use |
|---|---|---|---|
| `src/app/api/onchain-test/route.ts` | 188 | `chainId: 10143` | `CHAINS.monad.chainId` (or accept `?chain=`) |
| `src/app/api/admin/oracle/route.ts` | 50, 68 | `chainId: 10143` + `--chain-id 10143` | `CHAINS.monad.chainId` |
| `src/app/api/admin/update-price/route.ts` | 136, 171 | `0x27F7` + `chainId: 10143` | `CHAINS.monad.chainId` |
| `src/app/demo/page.tsx` | 63 | `const CHAIN_ID = "10143"` | `CHAINS.monad.chainId` |
| `src/components/operating-system.tsx` | 601, 1664 | `Chain ID 10143` (UI text) | `CHAINS.monad.chainId` |
| `src/lib/audit-data.ts` | 22, 181 | `chainId: "10143"` (×2) | `CHAINS.monad.chainId` |
| `src/lib/use-wallet.ts` | 29 | `const MONAD_CHAIN_ID = "0x27f7"` | `CHAINS.monad.chainId` (hex form) |

Arc (`5042002`) and Local (`1337`) chain IDs appear **only** in `chains.ts`, scripts, and comments — never as literals in active application logic.

### Q5. Where are contract addresses defined?

**Answer:** The canonical source of truth is `src/lib/chains.ts`, fields `CHAINS.{monad,arc,local}.contracts.{MTQ_TOKEN,GOVERNANCE,SAFE_MULTI_SIG,ALGORITHM,RESERVE,MINT,REDEEM,ORACLE,TAKAFUL,DEPLOYER}`.

**However, Monad contract addresses are also hard-coded as literals in 8 source files:**

| File | Lines | Hard-coded addresses |
|---|---|---|
| `src/app/api/onchain-test/route.ts` | 11, 26-34, 20 | All 9 Monad contracts + deployer |
| `src/app/demo/page.tsx` | 71-78 | All 9 Monad contracts |
| `src/components/command-palette.tsx` | 102, 107, 112 | MTQ, Governance, Safe (Monad) |
| `src/components/transparency.tsx` | 210, 215, 220 | MTQ, Governance, Safe (Monad) |
| `src/components/operating-system.tsx` | 94, 1643-1652 | MTQ + all 9 Monad contracts |
| `src/components/public-site.tsx` | 185, 189, 1452, 1458, 1464 | MTQ, Governance, Safe (Monad) |
| `src/components/site-footer.tsx` | 79 | MTQ (Monad) |
| `src/lib/audit-data.ts` | 170-179 | All 9 Monad contracts + deployer |

**Arc and Local contract addresses are never hard-coded outside `chains.ts`** — they appear only in the config, the registry JSON files (`arc-testnet-addresses.json`, `local-testnet-addresses.json`), and documentation. This asymmetry confirms that the multi-chain layer was added on top of a Monad-only codebase without refactoring the existing callers.

### Q6. Where are network assumptions hard-coded?

**Answer:** Network assumptions are hard-coded in four distinct layers:

1. **API route response payloads** — `/api/onchain-test`, `/api/admin/oracle`, `/api/admin/update-price`, and `/api/contract/info` return `network: "Monad Testnet"` and `chainId: 10143` as literals in their JSON responses.
2. **UI component text** — 37 occurrences of the literal string `"Monad Testnet"` across 17 `.ts`/`.tsx` files (full list in the hard-coding audit, §4 of the parallel findings report).
3. **RPC URL literals** — `https://testnet-rpc.monad.xyz` appears as a literal string in 8 source files (excluding `chains.ts`, scripts, and CSP allowlist); `https://testnet.monadscan.com` appears in 11 source files.
4. **Wallet hook parameters** — `src/lib/use-wallet.ts:28-35` hard-codes the entire MetaMask `wallet_addEthereumChain` parameter object (chain ID hex, RPC URL, explorer URL, chain name, native currency symbol).
5. **Solidity NatSpec comments** — 14 `.sol` files (7 in `src/contracts/`, 7 mirrored in `foundry/src/`) carry the comment `* Network: Monad Testnet, Chain ID 10143` in their file headers. These are now factually inaccurate (the contracts are deployed on three chains).

### Q7. Where does minting depend on a specific network?

**Answer:** The on-chain mint logic (`Mint.sol`) is **network-agnostic** — the contract takes an MTQ address, a Reserve address, and a Takaful address in its constructor and never references a chain ID or RPC URL at runtime. The same source code is deployed identically on all three chains.

**However, the application-layer mint path (`/api/testnet/mint`, `src/lib/testnet-engine.ts`, and the `operating-system.tsx` mint UI) implicitly assumes Monad:**

- The testnet simulator does not broadcast real mint transactions; it records simulated operations in the local Turso database with a synthesized "simulator reference" (not a real tx hash). The simulator is therefore network-agnostic in the sense that it touches no chain — but it also means no real minting is happening on any chain via the application.
- The wallet hook (`use-wallet.ts`) that *would* sign a real `Mint.mint()` transaction is hard-coded to Monad. If a user wanted to mint on Arc, the hook would refuse to add the Arc chain to MetaMask.
- The `buildTransferCalldata()` helper in `contract-reader.ts` uses `CONTRACTS.MTQ_TOKEN` (Monad) — so any transfer signed via the UI would target the Monad MTQ, not Arc's.

**Conclusion:** Minting has no on-chain network dependency, but the application layer funnels all real (non-simulated) mint intents to Monad by default.

### Q8. Where does redemption depend on a specific network?

**Answer:** Same as Q7. The on-chain `Redeem.sol` is network-agnostic (constructor takes MTQ + Reserve + Takaful addresses). The application-layer redeem path (`/api/testnet/redeem`, `testnet-engine.ts`, `operating-system.tsx` redeem UI) is simulated and does not broadcast real burn transactions. The wallet hook is Monad-only.

### Q9. Where does Oracle depend on a specific network?

**Answer:** Two distinct concerns:

1. **On-chain Oracle** (`Oracle.sol`, `MockOracle.sol`) — network-agnostic. The contract stores prices in storage and exposes setters; no chain ID or RPC reference in the bytecode.
2. **Application-layer Oracle** (`src/lib/oracle-client.ts`, `src/app/api/oracle/route.ts`, `src/app/api/admin/oracle/route.ts`, `src/app/api/admin/update-price/route.ts`) — **Monad-only**:
   - `src/lib/oracle-client.ts:19` defines `const MONAD_RPC = "https://testnet-rpc.monad.xyz";` and implements its own parallel RPC client (duplicating the one in `contract-reader.ts`).
   - `src/app/api/admin/oracle/route.ts:51,52` hard-code the Monad RPC URL, explorer URL, and chain ID in the response payload and in the `forge create` / `cast send` instruction strings shown to operators.
   - `src/app/api/admin/update-price/route.ts:134-141` hard-code the deployer address, RPC URL, chain ID (hex), and explorer URL — all Monad.
   - The `/api/oracle` route falls back to the live free `gold-api.com` endpoint if `MOCK_ORACLE_ADDRESS` is unset; otherwise it queries the MockOracle on Monad via `oracle-client.ts`. It cannot query the MockOracle on Arc or Local.

### Q10. Where does Governance depend on a specific network?

**Answer:**

1. **On-chain Governance** (`Governance.sol`) — network-agnostic in source. Constructor takes `address[] memory _initialCouncil` (7 members required by `COUNCIL_SIZE = 7`). The contract is deployed identically on all three chains.
   - **Monad + Arc**: deployed with the deployer EOA as the sole initial council member (1 of 7 slots filled — a constitutional violation; see Q11 below).
   - **Local Anvil**: deployed with 7 Anvil pre-funded accounts as council members (per `scripts/deploy-local.sh:99-102`).
2. **Application-layer Governance** (`src/app/api/governance/proposals/route.ts:56`) — hard-codes `const EXPLORER_BASE = "https://testnet.monadscan.com";` for proposal link generation. The proposals themselves are stored in Turso (chain-agnostic), but the explorer links always point to Monad.

### Q11. Where does Safe depend on a specific network?

**Answer:** This is the most consequential finding of the audit.

**The "Safe Multi-Sig Treasury" is deployed on Monad and Arc at the same address `0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0`, and on Local Anvil it is a 1-of-1 placeholder using the deployer EOA.** On-chain verification (performed 2026-08-09 via `cast call`) confirms:

| Property | Monad (10143) | Arc (5042002) | Local Anvil (1337) |
|---|---|---|---|
| Address | `0xE718…7a7D0` | `0xE718…7a7D0` | `0xf39F…b92266` (EOA) |
| `eth_getCode` length | 344 hex chars (171 bytes) | 344 hex chars (171 bytes) | 0 (EOA — no code) |
| `VERSION()` | `"1.4.1"` | `"1.4.1"` (not directly probed, same bytecode) | N/A |
| `getThreshold()` | **1** | **1** | N/A |
| `getOwners()` | **`[0x3C39…c8d8c]`** (deployer EOA) | **`[0x3C39…c8d8c]`** (deployer EOA) | N/A |

**The Safe is a real Gnosis Safe v1.4.1 on Monad and Arc, but it is configured as 1-of-1 with the deployer EOA as the sole owner.** This contradicts:

1. The UI label in `src/components/testnet.tsx:47` — `"3-of-5 custodian · refuses rule-violating actions"` — which is **factually false**.
2. The CONTRACT_REGISTRY.md assertion of "Gnosis Safe (not an ERC-20, not a Protocol Smart Contract)" — technically true (it is a Gnosis Safe), but the "3-of-5 custodian" implication is false.
3. The constitutional mandate (`docs/blueprint/blueprint.txt:8979, 8997, 19759-19765`) — requires a **3-of-5 threshold** with five named institutional signers (CEO UAE, CFO UAE, Board Member Singapore, Custodian UK, Auditor Third-party). The current 1-of-1 deployer-controlled configuration is a **direct, present-tense violation** of §Article IV.

The candid verification docs (`docs/verification/investor-due-diligence-simulation.md:53, 1171` and `docs/verification/institutional-readiness-program-report.md:227, 241`) already admit this — they label the system "founder-controlled" and flag it as vulnerability E047. The CONTRACT_REGISTRY.md and UI have not been updated to match.

**Application-layer Safe usage:** Purely display. The Safe address appears in `chains.ts`, `audit-data.ts`, `/api/onchain-test` (existence check only — `safeCode.length > 4`), `/api/admin/oracle` (informational metadata with the comment "should receive ADMIN_ROLE for production" — future tense), `/api/status`, and 5 UI components. **No transaction is ever constructed to the Safe. No role has been transferred to the Safe. The Safe is a label, not a working component.**

### Q12. Does any contract assume Monad?

**Answer:** No contract bytecode references Monad, the chain ID 10143, the Monad RPC URL, or any Monad-specific address. The 14 NatSpec comments in the `.sol` files (`* Network: Monad Testnet, Chain ID 10143`) are documentation, not runtime code — they are stale but functionally inert.

### Q13. Does any contract assume Arc?

**Answer:** No. There are zero Arc-specific references in any `.sol` file (the audit found no matches for `Arc`, `5042002`, or `rpc.testnet.arc.io` in `src/contracts/` or `foundry/src/`).

### Q14. Does any code treat one network as constitutionally canonical?

**Answer:** **Yes — implicitly.** The entire application layer treats Monad as the canonical chain:

1. The legacy `CONTRACTS` and `NETWORK` exports in `contract-reader.ts` pin to `CHAINS.monad`.
2. `/api/onchain-test` performs its 15-check verification suite exclusively against Monad contracts.
3. The wallet hook can only connect to Monad.
4. The legal pages (`/legal/terms`, `/legal/privacy`, `/legal/risk-disclosure`) describe the system as "deployed on Monad Testnet" without mentioning Arc or Local.
5. The Demo page video script (`src/app/demo/page.tsx`) repeatedly tells viewers "nine verified smart contracts on Monad Testnet, Chain ID 10143" — implying Arc and Local do not exist.

**Constitutionally, no chain should be canonical** — MITHQAL is network-independent settlement infrastructure per §1 of the audit specification. The current code violates this principle in spirit (if not in letter) by treating Monad as the "real" deployment and Arc/Local as secondary curiosities.

### Q15. Does the system currently have a settlement router?

**Answer:** **No.** A repo-wide search for `router`, `adapter`, `settlement routing`, `chainRouter`, `networkAdapter`, `routeByChain`, `selectChain`, `chainSelection` found:

- **Zero** matches for any settlement-router or chain-adapter abstraction in `.ts` files.
- The word `settlement` appears 60+ times, but **always** refers to the institutional settlement *concept* (MTQ as a settlement unit, §35 Settlement Finality, settlement volume tracker) — never to multi-chain settlement routing.
- The word `router` appears only in `next/navigation`'s `useRouter` (unrelated React routing).
- The word `adapter` appears once, in a doc comment in `src/app/api/admin/update-price/route.ts:12` referencing a *future* `MultiOracleConsensus adapter` for Chainlink + Pyth + Chronicle — not implemented.

The closest thing to a chain-routing primitive is `getChainReader(chainKey)` in `contract-reader.ts:78-130`, but it is a reader factory, not a settlement router — it cannot mint, redeem, transfer, or execute governance actions across chains.

### Q16. Where should a settlement router be introduced?

**Answer:** A Universal Settlement Router should sit **between the Constitutional Core and the network-specific RPC clients**, as depicted in §1 of the audit specification. Concretely, it should be a new module at `src/lib/settlement-router.ts` (or `src/lib/settlement/router.ts`) that:

1. Accepts a high-level settlement intent (e.g., `mint { amount, recipient, chain? }`).
2. Resolves the target chain (explicit `chain` parameter, or a policy-based default).
3. Dispatches to the appropriate chain reader/writer (via `getChainReader(chainKey)` for reads; via a new `getChainWriter(chainKey)` for writes — which does not yet exist).
4. Enforces constitutional invariants (reserve ratio, mint authority, redemption authority) **before** dispatch — independent of the target chain.
5. Records the settlement intent + outcome in the canonical state ledger (Turso) for audit trail.

**The router must NOT:**
- Hold mint authority, redeem authority, or admin roles (those stay with the Safe Multi-Sig once operationalized).
- Bypass the Safe Multi-Sig for any state-changing operation.
- Introduce cross-chain minting or redemption without formal security review (per §22, §37 of the audit specification).

### Q17. What should remain untouched?

**Answer:** The following must **not** be modified by the network architecture evolution:

1. **Constitutional monetary logic** — the on-chain `MTQ.sol`, `Algorithm.sol`, `Reserve.sol`, `Mint.sol`, `Redeem.sol`, `Oracle.sol`, `Takaful.sol`, `Governance.sol` source code. Network abstraction is an application-layer concern; the contracts are already network-agnostic.
2. **Reserve framework** — the constitutional reserve model (gold/silver/cash segregated custody under approved custodians) is independent of any blockchain. The router does not own, custody, or route reserves.
3. **Governance model** — the Constitutional Council, the 3-of-5 Safe Multi-Sig threshold, and the four-role access control (`COUNCIL_ROLE`, `MINTER_ROLE`, `REDEEMER_ROLE`, `ORACLE_ROLE`) are constitutional invariants.
4. **Organizational structure** — JOZOUR LLC as the current operating entity; the future Holding/Operations/Markets architecture described in the blueprint.
5. **Existing deployments** — the Monad, Arc, and Local Anvil contract deployments must be preserved. No redeployment, no address changes, no abandonment of testnet infrastructure.
6. **Git governance** — CODEOWNERS, branch protection, CI, release manifest, version provenance, backup policy, disaster recovery policy, rollback governance.
7. **The `.env` configuration** — secrets, tokens, and database credentials.
8. **The Foundry test suite** — 10 test files in `foundry/test/` are network-agnostic (use Foundry's local test chain 31337) and must continue to pass.

---

## Findings Summary

### Critical Findings (must address before any "mainnet ready" claim)

| ID | Finding | Evidence | Remediation |
|---|---|---|---|
| **F-CRITICAL-1** | Safe Multi-Sig is 1-of-1 deployer-controlled, not 3-of-5 | `cast call getThreshold()` returns `1` on Monad and Arc; `getOwners()` returns `[0x3C39…c8d8c]` | Seat the Constitutional Council; reconfigure Safe to 3-of-5 with 5 named institutional signers; transfer all admin roles from deployer EOA to Safe |
| **F-CRITICAL-2** | UI falsely labels Safe as "3-of-5 custodian · refuses rule-violating actions" | `src/components/testnet.tsx:47` | Correct the label to reflect the actual 1-of-1 configuration, or remove the claim until the Safe is operationalized |
| **F-CRITICAL-3** | CONTRACT_REGISTRY.md implies Safe is fully operational | `docs/contracts/CONTRACT_REGISTRY.md:68,72,74` | Add a "Current Status: NON-COMPLIANT" note; reference `investor-due-diligence-simulation.md` E047 |

### High-Severity Findings (architectural debt)

| ID | Finding | Count | Remediation |
|---|---|---|---|
| **F-HIGH-1** | Monad contract addresses hard-coded as literals in 8 source files | ~21 occurrences | Refactor to import from `CHAINS.monad.contracts.*` (or accept `?chain=` param) |
| **F-HIGH-2** | "Monad Testnet" hard-coded as a string in 17 source files | 37 occurrences | Replace with `CHAINS.monad.name` (or chain-aware equivalent) |
| **F-HIGH-3** | Monad RPC URL hard-coded in 8 source files | 18 occurrences | Route through `getChainReader(chainKey)` |
| **F-HIGH-4** | Monad explorer URL hard-coded in 11 source files | 25+ occurrences | Route through `CHAINS.<key>.explorer` |
| **F-HIGH-5** | Wallet hook (`use-wallet.ts`) is Monad-only | 1 file (8 hard-codings) | Parameterize over `CHAINS` |
| **F-HIGH-6** | `/api/onchain-test` reimplements its own RPC client + hard-codes all 10 Monad addresses | 1 file | Refactor to use `getChainReader(chainKey)` + accept `?chain=` param |
| **F-HIGH-7** | 14 Solidity NatSpec comments claim `Network: Monad Testnet, Chain ID 10143` | 14 `.sol` files | Update to `Multi-chain: see src/lib/chains.ts` |

### Medium-Severity Findings (documentation/consistency)

| ID | Finding | Remediation |
|---|---|---|
| **F-MED-1** | CONTRACT_REGISTRY.md claims "same Safe creation transaction" on Monad + Arc — technically possible only via CREATE2 factory, which is undocumented | Either document the CREATE2 setup or correct the language to "Safe address reserved identically on both chains" |
| **F-MED-2** | `independent-evidence-audit.md:104` marks the Safe claim as "PROVEN" based on `eth_getCode` length only | Downgrade to "UNVERIFIED — bytecode present; threshold and signers not confirmed" |
| **F-MED-3** | `TESTNET-TEST-REPORT.md:17` marks Safe as "✅ Deployed" based on 344-char code length | Change to "⚠️ Bytecode present (344 chars) — Safe identity verified 2026-08-09 as v1.4.1, but threshold=1 and sole owner=deployer EOA" |
| **F-MED-4** | Solidity contracts carry stale `Network: Monad Testnet, Chain ID 10143` NatSpec | Update to multi-chain language |
| **F-MED-5** | Legal pages (`/legal/terms`, `/legal/privacy`, `/legal/risk-disclosure`) describe the system as Monad-only | Update to acknowledge multi-chain (or qualify: "currently deployed on Monad Testnet, Arc Network Testnet, and a local development network") |

### Low-Severity Findings (cosmetic / future work)

| ID | Finding | Remediation |
|---|---|---|
| **F-LOW-1** | No settlement router abstraction exists | Design per §9-§11 of the audit specification; implement only after F-CRITICAL-1 is resolved |
| **F-LOW-2** | No chain-adapter pattern exists | Design per §19 of the audit specification |
| **F-LOW-3** | No formal network capability matrix exists | Create `docs/architecture/network-capability-matrix.md` (delivered as part of this audit) |
| **F-LOW-4** | No formal cross-chain safety report exists | Create `docs/verification/cross-chain-safety-report.md` (delivered as part of this audit) |

---

## Changes Required

1. **Correct the Safe Multi-Sig documentation** (F-CRITICAL-2, F-CRITICAL-3, F-MED-1, F-MED-2, F-MED-3) — documentation-only, no code changes.
2. **Refactor hard-coded Monad references** (F-HIGH-1 through F-HIGH-7) — code changes, but mechanical (replace literals with `CHAINS.monad.*` references). No constitutional logic touched.
3. **Update Solidity NatSpec comments** (F-HIGH-7, F-MED-4) — comment-only changes, no bytecode change, no redeployment.
4. **Create the four remaining audit/design documents** (this commit) — `network-contract-inventory.md`, `network-capability-matrix.md`, `multi-network-architecture.md`, and the three verification reports.

## Changes NOT Required

1. **No redeployment of any contract on any chain.** The on-chain bytecode is correct and network-agnostic; only the application layer and documentation need updating.
2. **No settlement router implementation in this cycle.** Per §11 of the audit specification, the router is a future architectural target — it should not be coded until the audit is fully reviewed and the Safe Multi-Sig is operationalized (F-CRITICAL-1).
3. **No cross-chain minting or redemption.** Per §22, §37 of the audit specification, cross-chain monetary movement requires formal security and constitutional review.
4. **No proprietary MITHQAL blockchain.** Per §10, §40 of the audit specification.
5. **No bridge.** Per §22, §40 of the audit specification.
6. **No changes to the constitutional monetary logic, reserve framework, governance model, or organizational structure.**

---

## Conclusion

The MITHQAL codebase has a clean separation between constitutional logic (network-agnostic Solidity contracts) and application logic (currently Monad-leaning TypeScript). The multi-chain configuration layer introduced on 2026-08-09 is correct in design but narrow in adoption — only 5 of ~40 relevant files consume it. The most urgent remediation is **correcting the Safe Multi-Sig misrepresentation**: the on-chain reality (1-of-1, deployer-controlled) must be reflected honestly in the UI, the CONTRACT_REGISTRY, and the evidence ledger until the Constitutional Council is seated and the Safe is reconfigured to 3-of-5.

No constitutional principle was modified by this audit. No deployment was altered. The audit is read-only with respect to the constitutional core, and the recommended changes are limited to (a) documentation corrections, (b) mechanical refactoring of hard-coded literals to use the existing `chains.ts` config, and (c) future architectural design documents for the settlement router and chain-adapter pattern.

The architecture is **prepared for** but **not yet implementing** network-independent settlement. The next phase (Phase A: terminology corrections) is documented in §36 of the audit specification and may proceed.
