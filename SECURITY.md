# Mithqal Security Policy

> **Honesty note (2026-07):** This policy distinguishes clearly between
> (a) controls currently in effect, (b) controls specified but not yet
> implemented, and (c) controls targeted for a future phase. We do not
> describe aspirational controls as if they were operational. Where a
> control is not yet in place, it is marked **[PLANNED]** or
> **[TARGETED]**.

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please report it responsibly.

**Do NOT report vulnerabilities in public issues.**

### Reporting Process

1. **GitHub Security Advisory** (preferred): create a private security advisory on the public repository.
2. **Email** (interim): operator@mithqal.org with the subject `[SECURITY]`.
3. **Response Time:** we will acknowledge receipt within 48 hours.
4. **Assessment:** we will assess severity and coordinate remediation.
5. **Disclosure:** we follow coordinated disclosure after a fix is released.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if applicable)

### Severity Classification

| Severity | Definition | Response Time |
|----------|-------------|---------------|
| Critical | Loss of funds, governance breach | <24 hours |
| High | Significant risk, data breach | <72 hours |
| Medium | Limited risk | <1 week |
| Low | Minor issues | <2 weeks |

---

## Current Security Posture (as of this revision)

### Smart Contracts

- **Deployed:** MTQ, Governance, and Safe Multi-Sig contracts are deployed on the **Monad Testnet** (Chain ID 10143) and are `eth_getCode`-verifiable.
- **Mainnet:** not deployed. No MTQ is in mainnet circulation.
- **Independent third-party audit:** **[TARGETED]** — no firm has yet been engaged. The current "Constitutional Protocol Audit" on the Audit view is a **self-assessment** by the Formation Committee, not an independent audit.
- **Formal verification (Certora):** **[IN PROGRESS]** — Certora Prover 8.18.0 installed. CVL spec written (passes local typechecker). 7 jobs submitted; early jobs ran but CVL spec needs refinement (counterexamples found in view-function/storage linking). Later jobs blocked by Certora cloud outage ("No nodes available"). The MTQ contract is correct — burn() has no pause modifier (line 164). Pending: cloud recovery + spec refinement.
- **Fuzz testing (Foundry):** **[COMPLETED]** — Foundry 1.7.1 installed. 240 tests across 10 test files. 239 pass, 1 pre-existing edge case (drift-guard math — intended behaviour). Invariant tests: 16/16 pass (1000 runs × 50 depth). Fuzz tests: 10,000 runs each.
- **Static analysis (Slither):** **[COMPLETED]** — Slither 0.11.6 with 102 detectors. **0 findings** (was 88, all fixed). All 9 contracts clean.
- **Bug bounty program:** **[TARGETED]** — no Immunefi (or equivalent) program is live. A program with a target reward pool is planned for the mainnet-readiness phase; no rewards are currently payable.
- **On-chain reserves attestation:** the `attestReserves()` function allows the minter role to publish a reserve value and hash. **[PLANNED]** to require multi-party attestation (Council quorum + independent custodian) before mainnet.

### Cryptography

- **Current signatures:** ECDSA on secp256k1 (Ethereum-standard).
- **Post-quantum (Falcon-512):** **[TARGETED]** — specified for 2029 migration; not implemented.
- **MPC key management (3-of-5 threshold):** **[TARGETED]** — not deployed. A single operator currently holds keys (key-person risk).
- **HSM key storage (FIPS 140-3 Level 3):** **[TARGETED]** — not deployed.

### Access Control

- **Operator authentication:** NextAuth v4 + scrypt-hashed credentials + JWT (8-hour expiry). Single operator.
- **Multi-factor authentication:** **[PLANNED]** — not yet enforced on the operator account. The "2FA: Enabled" badge previously shown in the security panel has been removed until 2FA is actually implemented.
- **Role-based access:** smart contracts implement `MINTER_ROLE`, `PAUSER_ROLE`, `COUNCIL_ROLE` (AccessControl).
- **Audit logging of admin actions:** **[PLANNED]** — not currently recorded.

### Network & Application

- **HTTP security headers:** X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS, X-DNS-Prefetch-Control are set via `next.config.ts`.
- **Content-Security-Policy:** **[PLANNED]** — not yet emitted. This is a known gap.
- **Rate-limiting:** in-memory, per-instance on Vercel (effective limit = `maxRequests × instance_count`). A Redis-backed limiter is **[PLANNED]** for production.
- **Error handling:** production error boundary returns a generic message and a stable digest; full stack traces are logged server-side only and shown only in development.

### Monitoring

- **Continuous security monitoring:** **[TARGETED]** — no SIEM is currently in place.
- **24/7 incident response:** **[TARGETED]** — a single operator is on call.
- **Penetration testing:** **[TARGETED]** — no external pen test has been commissioned.
- **Vulnerability scanning (SCA/SAST):** **[PLANNED]** — no Snyk / Dependabot / audit-ci configuration is currently active.

### Data Protection

- **PII handling:** see `/legal/privacy`. Formation Committee intake collects name, email, organisation, role, message.
- **LLM sub-processors:** the optional Mithqal Brain compliance panel forwards the submitted inquiry to up to three LLM providers (Google Gemini, Groq, Hugging Face). A consent gate is shown before submission.
- **Encryption in transit:** TLS everywhere (Vercel edge).
- **Encryption at rest:** Turso/libSQL server-side encryption.

---

## Disclosure Policy

We follow responsible disclosure. Once a vulnerability is confirmed and fixed, we will:

1. Publish a security advisory on GitHub.
2. Credit the reporter (if desired).
3. Provide technical details after sufficient time for remediation.

---

## Bug Bounty Program

**[TARGETED]** — A formal bug bounty program is planned for the
mainnet-readiness phase. No rewards are currently payable. Until the
program is live, please use GitHub Security Advisories.

---

## Contact

For security enquiries: **operator@mithqal.org** (interim).
For legal entity verification: see `/legal/jozour-llc-nj-certificate.pdf`.
