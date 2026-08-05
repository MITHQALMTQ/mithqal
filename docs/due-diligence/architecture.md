# MITHQAL — System Architecture

**Document status:** ✅ AVAILABLE
**Last updated:** 2026-07-19
**Constitutional basis:** Blueprint Part 2 Article XVII §8 (Smart Contract Registry); Part 4 (Technical Framework)

---

## 1. Architectural Principles

MITHQAL's architecture is governed by five constitutional principles:

1. **Constitutional Supremacy** — every architectural component shall implement a constitutional rule; no component may violate a constitutional invariant
2. **Defense in Depth** — multiple independent layers of security, monitoring, and recovery
3. **Zero Trust** — no component is trusted by default; every interaction is authenticated, authorized, and logged
4. **Least Privilege** — every component, signer, and operator has only the privileges necessary for its function
5. **Formal Verification** — every protocol smart contract is formally verified; no contract is deployed without verification

## 2. System Layers

### 2.1 Settlement Layer (On-Chain)

The settlement layer consists of 9 Protocol Smart Contracts deployed on Ethereum Mainnet (with Layer-2 deployments planned on Base and Arbitrum):

| # | Contract | Role |
|---|----------|------|
| 1 | MTQ | ERC-20 token; mint/burn/transfer |
| 2 | Mint | Verifies reserve receipt; mints MTQ to participant |
| 3 | Redeem | Burns MTQ; releases reserve asset to participant |
| 4 | Reserve | Holds reserve invariant (Tier 1–4 accounting); enforces 100%+ ratio |
| 5 | Algorithm | Monetary engine: structural weighting, bounded momentum, mean reversion, macro overlays, shock absorber |
| 6 | Oracle | 8-family medianized price feed with outlier exclusion and circuit breakers |
| 7 | Takaful | Mutual stabilization fund; participant-contributed capital for systemic shocks |
| 8 | Governance | Proposal submission, voting, timelock execution |
| 9 | (Specification) | Certora formal verification specification covering 12 invariants |

**Upgradeability:** UUPS proxy pattern. Upgrade authority is the Safe Multi-Sig (3-of-5 signers), gated by a 48-hour timelock and Constitutional Council approval.

**Operational Governance:** A Safe Multi-Sig contract (Gnosis Safe) administers proxy upgrades, emergency pauses, and parameter changes. Operational authority is held by the Multi-Sig; deployment EOAs have no operational authority post-deployment.

### 2.2 Oracle Layer

The oracle layer is a constitutional component (Blueprint Part 4 Article III). It consists of 8 independent oracle families:

1. Chainlink (decentralized oracle network)
2. Pyth Network (high-frequency financial data)
3. Chronicle Labs (optimistic oracle)
4. RedStone (modular oracle)
5. LBMA (London Bullion Market Association — off-chain attestation)
6. Central Bank FX feeds (for currency rates)
7. Internal Committee oracle (operational fallback)
8. Constitutional TWAP (time-weighted average price — on-chain fallback)

Each oracle publication includes 10 quality fields: Price, Confidence, Quality, Missing Values, Volatility, Outlier Score, Data Freshness, Source Agreement, Reliability, Confidence Interval. All publications are permanently recorded in the Constitutional Assumptions Register.

### 2.3 Off-Chain Infrastructure

| Component | Technology |
|-----------|------------|
| Application servers | Next.js 16 / Node.js (TypeScript) |
| Database | PostgreSQL + TimescaleDB (time-series) |
| Cache | Redis |
| Object storage | S3-compatible |
| Orchestration | Kubernetes, multi-cloud (AWS + GCP) |
| Regions | Multi-region (US, EU, Asia) |
| Monitoring | Prometheus, Grafana, OpenTelemetry |
| Logging | Structured JSON, centralized |
| Alerting | PagerDuty, on-call rotation |

### 2.4 Custody Layer

The custody layer is operated by qualified custodians (e.g., regulated bullion custodians, regulated banks for cash and stablecoins):

- **Allocated bullion** — physical gold and silver bars held in segregated, serialized vaults
- **Cash and stablecoins** — held at regulated banking institutions
- **Sovereign securities** — held at regulated custodians / CSDs

Custody is governed by Article XVII §12 (Operational Assurance Framework) concentration limits: ≤ 25% per custodian, ≤ 30% per jurisdiction, ≤ 30% per vault, ≤ 25% per bank.

### 2.5 Governance Layer

| Body | Role |
|------|------|
| Constitutional Council | Supreme governance; constitutional amendments, risk parameter approval |
| Monetary Council | Monetary policy within constitutional ranges |
| Risk Committee | Risk tolerance, stress testing oversight |
| Technical Committee | Smart contract upgrades, infrastructure |
| Audit Committee | Evidence Ledger, audit oversight |
| Sharia Committee | Sharia compliance |

### 2.6 Verification Layer

The verification layer provides independent assurance:

- **Certora Prover** — formal verification of 12 invariants
- **Halmos** — symbolic execution
- **Foundry** — unit, integration, fuzz testing
- **Echidna** — property-based fuzzing
- **Independent security firms** — manual review, penetration testing
- **Big-4 audit firms** — technology risk audit, financial audit
- **Independent mathematical reviewers** — academic / research review

## 3. Data Flow

### 3.1 Minting Flow

```
Participant → KYC/KYB → Wire funds to Treasury → Treasury verifies receipt →
Reserve.sol updates tiers → Mint.sol verifies reserve → MTQ.mint(to: participant) →
On-chain mint event → Daily reconciliation → Transparency disclosure
```

### 3.2 Redemption Flow

```
Participant → Redeem request → Redeem.sol burns MTQ → Reserve.sol releases tier assets →
Treasury executes release → Settlement (wire / transfer / physical) →
On-chain burn event → Daily reconciliation → Transparency disclosure
```

### 3.3 Reserve Liquidation Order (Article X — Bullion Protection Rule)

Under redemption pressure, the Constitution mandates the following liquidation order:
1. Tier 4 stablecoins
2. Tier 1 cash
3. Tier 2 sovereign securities
4. Tier 3 silver
5. Tier 3 gold — **only as last resort** (Gold is Constitutional Strategic Capital)

Each step is documented, signed, and entered into the Constitutional Assumptions Register.

## 4. Security Architecture

- **Multi-signature** — Safe Multi-Sig (3-of-5) for all operational authority
- **Timelock** — 48-hour timelock on governance actions
- **Circuit breakers** — automatic pause on oracle outlier detection, reserve ratio breach, or governance anomaly
- **Rate limiting** — API rate limits, minting/redeeming velocity limits
- **Anomaly detection** — real-time monitoring of mint/redeem/oracle patterns
- **Penetration testing** — annual by qualified firm
- **Bug bounty** — continuous on Immunefi (max reward $2,000,000)

## 5. Disaster Recovery

- **RTO** (Recovery Time Objective): 4 hours for critical systems; 24 hours for non-critical
- **RPO** (Recovery Point Objective): 5 minutes for transactional data; 1 hour for analytical data
- **Backup strategy**: continuous WAL replication; daily snapshots; cross-region replication
- **Failover**: automated for stateless services; manual approval for stateful services
- **Incident response**: documented runbooks; on-call rotation; escalation procedures

## 6. Interoperability

- **ISO 20022** messaging for institutional settlement
- **REST APIs** for participant integration
- **SDKs** (TypeScript, Python, Java) for programmatic access
- **SWIFT integration** for bank-to-bank settlement
- **CBDC interoperability** for future central bank digital currency integration

## 7. Architecture Diagrams (Conceptual)

### 7.1 High-Level System Boundary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MITHQAL INSTITUTIONAL BOUNDARY                    │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐    │
│  |  Participants |   |  Custodians   |   |  Regulators / BIS    |    │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘    │
│         │                   │                       │                │
│  ┌──────▼───────────────────▼───────────────────────▼───────────┐    │
│  |            OFF-CHAIN INFRASTRUCTURE                          |    │
│  |  App servers · DB · Cache · Storage · Monitoring             |    │
│  └──────┬───────────────────────────────────────────────────────┘    │
│         │                                                            │
│  ┌──────▼───────────────────────────────────────────────────────┐    │
│  |            ON-CHAIN SETTLEMENT LAYER                          |    │
│  |  MTQ · Mint · Redeem · Reserve · Algorithm · Oracle          |    │
│  |  Takaful · Governance · (Certora spec)                        |    │
│  └──────┬───────────────────────────────────────────────────────┘    │
│         │                                                            │
│  ┌──────▼───────────────────────────────────────────────────────┐    │
│  |            VERIFICATION LAYER                                 |    │
│  |  Certora · Halmos · Foundry · Echidna · External audits      |    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Reserve Tier Stack

```
                  Supply × PAR × (1 + Buffer)
                 ┌────────────────────────────┐
                 │   Buffer (≥ 8% excess)    │
                 ├────────────────────────────┤
                 │   Tier 4 (2–8% stablecoins)│  ← first line of redemption defence
                 ├────────────────────────────┤
                 │   Tier 3 (15–25% bullion)  │  ← silver first, gold last (Article X)
                 ├────────────────────────────┤
                 │   Tier 2 (30–40% sovereigns)│
                 ├────────────────────────────┤
                 │   Tier 1 (35–45% cash)     │
                 └────────────────────────────┘
```

## 8. References

- Blueprint: `/docs/blueprint/blueprint.txt` (Part 4 — Technical Framework; Part 2 Article X — Bullion Protection Rule; Part 2 Article XVII — Institutional Assurance Framework)
- Whitepaper: `/docs/whitepaper.md`
- Smart Contract Registry: `/docs/contracts/CONTRACT_REGISTRY.md` (Task 13-a)
- Evidence Ledger: `/docs/evidence/EVIDENCE_LEDGER.md` (Task 13-a)
- Formal Verification Report: `/docs/verification/formal-verification-report.md`
- Mathematical Verification Report: `/docs/verification/mathematical-verification-report.md`
- Constitutional Stress Master Report: `/docs/verification/constitutional-stress-master-report.md`
