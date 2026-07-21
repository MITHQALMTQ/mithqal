# Mithqal Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please report it responsibly.

**Do NOT report vulnerabilities in public issues.**

### Reporting Process

1. **Email:** security@mithqal.org (temporarily, use GitHub Security Advisory)
2. **GitHub Security Advisory:** Create a private security advisory
3. **Response Time:** We will acknowledge receipt within 48 hours
4. **Assessment:** We will assess the vulnerability and determine severity
5. **Disclosure:** We will coordinate disclosure with you

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

## Security Best Practices

### Smart Contracts
- All contracts are formally verified
- Contracts are audited by multiple independent firms
- Bug bounty program: $2,000,000

### Cryptography
- ECDSA for current signatures (secp256k1)
- Falcon-512 for post‑quantum security (planned)
- MPC for key management (3 of 5 threshold)
- HSMs for secure key storage (FIPS 140‑3 Level 3)

### Access Control
- Multi‑factor authentication required
- Role‑based access control
- Least privilege principle
- Regular access reviews

### Monitoring
- Continuous security monitoring
- 24/7 incident response team
- Regular security audits
- Vulnerability scanning

## Disclosure Policy

We follow responsible disclosure. Once a vulnerability is confirmed and fixed, we will:

1. Publish a security advisory
2. Credit the reporter (if desired)
3. Provide technical details (after sufficient time for remediation)

## Bug Bounty Program

We maintain a bug bounty program on Immunefi:

- **Total Reward Pool:** $2,000,000
- **Critical Severity:** Up to $500,000
- **High Severity:** Up to $100,000
- **Medium Severity:** Up to $25,000
- **Low Severity:** Up to $5,000

**Scope:** All smart contracts, oracle integration, and governance contracts.

---

**For questions about security, contact security@mithqal.org**
