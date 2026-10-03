# Rollback Prevention Policy (v25.5)

**Owner**: COO + CTO + Project Manager
**Effective**: 2026-09-28 (Africa/Cairo)
**Scope**: All git refs (branches, tags) under the Mithqal repository

## 1. Immutable Tags

Every release is tagged with a signed annotated tag (`git tag -a v<X> -m "..."`).
Tags matching `v\d+\.\d+.*` are **immutable**:
- Force-push to any tag is blocked (branch protection + GitHub setting)
- Tag deletion is blocked
- Any attempt to move a tag to an older commit is logged + rejected

## 2. Branch Protection

The `main` branch is protected:
- `enforce_admins: true` — protection rules apply to administrators too
- `required_pull_request_reviews: 1` — at least one approving review required
- `required_status_checks: ["lint", "build"]` — must pass CI
- `required_linear_history: true` — no merge commits, only squash/rebase
- `allow_force_pushes: false` — no force-push to main
- `allow_deletions: false` — main cannot be deleted

## 3. Backup Branches

Before every release push, an immutable backup branch is created:
- `backup/v<X>-pre-push` — captures the exact HEAD before the push
- These branches are also protected (same rules as `main`)
- They serve as the recovery point if a push goes wrong

## 4. Operator Override (Break-Glass)

In a critical production incident, an operator may force-push to roll back.
This requires:
1. Two-person authorization (COO + CTO)
2. The force-push is logged to `audit/rollback-log.jsonl` with timestamp,
   operator IDs, justification, before/after SHAs
3. The tag `v<X>` is NOT moved — a new tag `v<X>.rollback.<n>` is created
   pointing at the rolled-back commit, preserving the full history

## 5. Verification

After every push, the following commands must succeed:
```bash
git fetch --tags --force
git tag --list 'v*' | sort -V | tail -5
git log --oneline -5
git branch --list 'backup/*'
```

If any of these returns an unexpected result, the push is considered failed
and the operator must invoke the break-glass procedure.

## 6. Application

This policy is enforced via:
- `.github/branch-protection.json` (machine-readable config)
- GitHub API branch-protection rules (applied via `gh api` or web UI)
- Local git hooks (`.githooks/pre-push`) — informational, not authoritative
