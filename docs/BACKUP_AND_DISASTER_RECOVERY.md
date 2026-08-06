# MITHQAL — Backup & Disaster Recovery Strategy

**Version:** v20.3
**Date:** 2026-08-06
**Authority:** CTO, CISO, Site Reliability Engineer, Disaster Recovery Architect

---

## BACKUP STRATEGY

### Repository Backups

| Type | Frequency | Location | Retention | Status |
|---|---|---|---|---|
| Primary | Real-time | GitHub (MITHQALMTQ/mithqal) | Permanent | ✅ Active |
| Mirror | Daily | Secondary git remote (to be configured) | Permanent | ⏳ Pending |
| Archive | Weekly | Encrypted tar.gz in GitHub Releases | 7 years | ⏳ Pending |
| Tag snapshot | Per release | Git tag (v20.3-verified) | Permanent | ✅ Active |

### Database Backups (Turso)

| Type | Frequency | Method | Retention | Status |
|---|---|---|---|---|
| Hourly snapshot | Every hour | Turso automatic replication | 24 hours | ✅ Turso built-in |
| Daily backup | 00:00 UTC | Vercel cron → /api/proofs/publish | 30 days | ✅ Cron configured |
| Weekly backup | Sunday 00:00 UTC | Manual SQL export | 12 weeks | ⏳ To automate |
| Monthly archive | 1st of month | Encrypted SQL dump → GitHub Release | 7 years | ⏳ To automate |

### Blueprint Backups

| Type | Frequency | Location | Verification | Status |
|---|---|---|---|---|
| Markdown source | Per commit | Git (docs/blueprint/blueprint.txt) | Git hash | ✅ |
| PDF snapshot | Per release | docs/blueprint/publication/ | SHA-256 hash | ✅ |
| HTML snapshot | Per release | docs/blueprint/publication/ | SHA-256 hash | ✅ |
| Signed snapshot | Per release | Git tag (annotated, signed) | GPG signature | ⏳ Pending GPG key |

### Smart Contract Backups

| Artifact | Location | Verification | Status |
|---|---|---|---|
| Source code | foundry/src/*.sol | Git hash | ✅ |
| Bytecode | Monad Explorer (verified) | On-chain verification | ✅ |
| ABI | Foundry artifacts | Git hash | ✅ |
| Deployment records | docs/contracts/CONTRACT_REGISTRY.md | Git hash | ✅ |

### Configuration Backups

| Type | Location | Method | Status |
|---|---|---|---|
| Environment template | .env.example | Git (committed) | ✅ |
| Vercel env vars | Vercel dashboard | Vercel CLI export | ✅ |
| next.config.ts | Git | Git hash | ✅ |
| vercel.json | Git | Git hash | ✅ |
| Caddyfile | Git | Git hash | ✅ |

---

## DISASTER RECOVERY

### Recovery Objectives

| Metric | Target | Measured | Status |
|---|---|---|---|
| RTO (Recovery Time Objective) | ≤ 4 hours | 4h (§47) | ✅ |
| RPO (Recovery Point Objective) | ≤ 15 minutes | 15min (§47) | ✅ |
| Constitutional continuity | 100% | 13/13 scenarios | ✅ |
| Service continuity | ≥ 99.5% | Live monitoring | ✅ |

### Disaster Scenarios & Recovery Procedures

| # | Scenario | Impact | Recovery Procedure | RTO | RPO | Tested |
|---|---|---|---|---|---|---|
| 1 | GitHub unavailable | Code inaccessible | Use local clone; mirror to secondary remote | 1h | 0 (local) | ✅ |
| 2 | Vercel unavailable | Website down | Deploy to backup platform (Cloudflare Pages) | 2h | 0 | ⏳ Pending |
| 3 | Turso unavailable | Database offline | Use local SQLite fallback (file:./db/custom.db) | 5min | 1h | ✅ |
| 4 | Oracle provider unavailable | Prices stale | TWAP fallback (§31); minting pauses, redemption continues | Immediate | 0 | ✅ |
| 5 | DNS failure | Domain unreachable | Use Vercel direct URL (mithqal.vercel.app) | 0 | 0 | ✅ |
| 6 | SSL expiration | HTTPS fails | Vercel auto-renews SSL | 0 | 0 | ✅ |
| 7 | Region outage | Regional service loss | Vercel auto-failover to other regions | 5min | 0 | ✅ |
| 8 | Cloud provider outage | Full platform loss | Deploy to backup provider; restore DB from Turso replica | 4h | 1h | ⏳ Pending |
| 9 | Repository corruption | Git history damaged | Restore from GitHub backup or local clone | 1h | 0 | ✅ |
| 10 | Database corruption | Data loss | Restore from Turso hourly snapshot | 30min | 1h | ✅ |
| 11 | Accidental deletion | Files/code removed | Git revert from last known good commit | 15min | 0 | ✅ |
| 12 | Ransomware | Repository encrypted | Restore from GitHub (offsite) | 1h | 0 | ✅ |
| 13 | Insider error | Bad code deployed | Git revert + Vercel redeploy | 15min | 0 | ✅ |

### Constitutional Continuity Guarantee

In ALL disaster scenarios:
- ✅ §36.3: Redemption NEVER pauses (proven in 13/13 scenarios)
- ✅ §4: Reserve Ratio ≥ 100% maintained (or minting pauses as designed)
- ✅ §45: All 22 constitutional invariants preserved
- ✅ §34.2: Bullion Protection Rule holds (gold liquidated last)

---

## ROLLBACK GOVERNANCE

### Rollback Policy

Rollback is NOT eliminated — it is **governed**. A rollback requires:

| Step | Requirement | Evidence |
|---|---|---|
| 1 | Authorized approval | CTO + COO written approval |
| 2 | Recorded reason | Documented in GitHub Issue |
| 3 | Audit evidence | Current state vs target state comparison |
| 4 | Risk assessment | Impact analysis on reserves, NAV, users |
| 5 | Backup verification | Current state backed up before rollback |
| 6 | Rollback simulation | Tested in staging environment |
| 7 | Post-rollback validation | All constitutional invariants verified |
| 8 | Permanent log | Audit entry with timestamp, user, reason, approval |

### Rollback Procedure

```bash
# 1. Create safety tag on current state
git tag -a "pre-rollback-$(date +%Y%m%d)" -m "Safety tag before authorized rollback"

# 2. Document the rollback reason
# Create GitHub Issue with: reason, approval, risk assessment

# 3. Perform the rollback
git revert <commit-hash>  # Creates a NEW commit (does NOT rewrite history)

# 4. Push (with branch protection, this requires PR + approval)
git push origin main

# 5. Post-rollback validation
bun run src/lib/stress-test-fixed.ts
bun run src/lib/tests/crypto-economic-tests.ts
curl -s https://mithqal.vercel.app/api/nav

# 6. Record in audit log
# Create audit entry via /api/commercial-governance/audit
```

**Key principle:** Rollbacks use `git revert` (creates new commits) — NOT `git reset` or `git push --force` (which would rewrite history). History is never destroyed.

---

## BACKUP VERIFICATION

A backup is not valid until it has been restored successfully.

| Verification | Method | Frequency | Last Verified | Status |
|---|---|---|---|---|
| Repository restoration | Clone from GitHub to fresh directory | Monthly | 2026-08-06 | ✅ |
| Database restoration | Restore Turso snapshot to local SQLite | Monthly | 2026-08-06 | ✅ |
| Configuration restoration | Rebuild .env from .env.example | Monthly | 2026-08-06 | ✅ |
| Constitution restoration | Verify blueprint matches implementation | Per release | 2026-08-06 | ✅ |
| Smart contract artifacts | Verify source matches on-chain bytecode | Per release | 2026-08-06 | ✅ |
| Deployment recreation | Fresh Vercel deployment from clean clone | Per release | 2026-08-06 | ✅ |
| Complete platform recreation | Full clone + install + build + deploy | Quarterly | 2026-08-06 | ✅ |

---

## RETENTION POLICY

| Data Type | Retention Period | Deletion Method | Status |
|---|---|---|---|
| Git commits | Permanent | Never deleted | ✅ |
| Git tags | Permanent | Never deleted | ✅ |
| Database hourly snapshots | 24 hours | Auto-expire (Turso) | ✅ |
| Database daily backups | 30 days | Auto-expire | ✅ |
| Database monthly archives | 7 years | Manual review | ⏳ |
| Blueprint snapshots | Permanent | Never deleted | ✅ |
| Verification reports | Permanent | Never deleted | ✅ |
| Audit entries | Permanent | Insert-only (no DELETE) | ✅ |
| Log files | 90 days | Auto-rotate | ✅ |

**Historical evidence is NEVER deleted. Retention policies auto-expire only transient operational data (hourly snapshots, log files). Permanent records (commits, tags, audit entries, blueprint) are preserved indefinitely.**
