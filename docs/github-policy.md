# MITHQAL GitHub Policy — Branch Protection, Tag, and Archive Rules

**Document ID:** MITHQAL-GITHUB-POLICY
**Status:** DECISION (Correction 3 — FULL-PLATFORM-BUILD)
**Truth state:** WIRED. `origin/main` is at HEAD 9477c08. Tags are
immutable. No force-push, no tag deletion, no history rewriting.

## 1. Purpose

This document defines the canonical branch protection, tag, and
archive policy for the MITHQAL Assurance repository. The policy is
non-negotiable: it is the operational expression of the §2.1
"deployment provenance" + §D.3 "specified ≠ tested ≠ audited ≠
deployed ≠ legally approved ≠ production-authorized" truth-state
separation.

The policy exists so that an auditor reading the git history at any
future date can answer four questions deterministically:

1. **What** was deployed? — every production deployment is anchored to
   a signed tag.
2. **Who** authorised it? — every merge to `main` was reviewed +
   approved by the file's CODEOWNERS.
3. **When** did it ship? — every tag has a deployment-provenance
   document (`DEPLOYMENT-PROVENANCE-vXX.md`) committed at tag time.
4. **Could it have been tampered with?** — no, because tags are
   immutable and force-push is forbidden.

## 2. Branch protection rules (applied to `main`)

The following rules are enforced via GitHub's branch protection API
and MUST NOT be relaxed without a Constitutional Council sign-off
(see CODEOWNERS §1 — `/docs/blueprint/` is the highest-governance
path).

| Rule | Setting | Rationale |
|---|---|---|
| Require pull request before merging | ON | No direct commits to `main`. |
| Required approvals | 2 | CTO + COO, or Tech Lead + Security Officer. |
| Dismiss stale approvals on new push | ON | Re-review on every force-updates. |
| Require review from Code Owners | ON | Every changed file's CODEOWNERS must approve. |
| Require status checks to pass | ON | `lint`, `typecheck`, `unit`, `integration` must be green. |
| Require branches up to date before merging | ON | No merge-into-stale. |
| Require conversation resolution | ON | Every thread must be marked resolved. |
| Require signed commits | ON | GPG / SSH signing required (`git config commit.gpgsign true`). |
| Require linear history | ON | Rebase merges only (`--rebase-merges`); no merge commits. |
| Do not allow bypassing the above rules | ON | Even admins cannot bypass. |
| Restrict who can push to matching branches | admins only | Direct push to `main` is forbidden; PRs are the only path. |
| Allow force pushes | OFF | History is immutable. |
| Allow deletions | OFF | `main` cannot be deleted. |

### 2.1 Branch naming convention

| Branch prefix | Purpose | Example |
|---|---|---|
| `feat/` | New feature | `feat/security-mtls` |
| `fix/` | Bug fix | `fix/turbopack-crash` |
| `docs/` | Documentation | `docs/gap-register` |
| `chore/` | Tooling, deps, config | `chore/bump-deps` |
| `hotfix/` | Production hotfix (rare) | `hotfix/revert-bad-tag` |
| `release/` | Release prep | `release/v25.4.0` |

All branch names MUST be kebab-case and include the task ID from
worklog.md when one exists.

## 3. Tag policy — IMMUTABLE

### 3.1 Tags are NEVER deleted

This is the single most important rule in this document. A git tag is
the cryptographic anchor for a deployment's provenance. Deleting a tag
would invalidate every artifact (PDF audit reports, deployment
provenance docs, regulator submissions) that references the tag's
commit SHA.

The repository settings MUST have:
- "Allow users to delete tags" — OFF for all roles, including admins.
- "Allow force-push on tags" — OFF for all roles, including admins.

If a tag was created in error, the correct response is to leave the
tag in place and create a new tag with the correct name + a
`DEPLOYMENT-PROVENANCE-vXX-ERRATA.md` document explaining the
situation. The original tag stays as an immutable historical record.

### 3.2 Tag naming convention

Tags follow `vMAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]` per SemVer 2.0.

| Pattern | Meaning | Example |
|---|---|---|
| `v25.4.0` | GA release | `v25.4.0` |
| `v25.4.0-rc.1` | Release candidate | `v25.4.0-rc.1` |
| `v25.4.0-beta.2` | Beta build | `v25.4.0-beta.2` |
| `v25.4.0+20261014` | Build metadata | `v25.4.0+20261014` |

### 3.3 Tag creation checklist

Before pushing a tag, the release manager MUST:

1. Confirm `bun run lint` passes locally (0 errors).
2. Confirm `tsc --noEmit` passes locally (0 errors).
3. Confirm the working tree is clean (`git status` shows no
   modifications).
4. Confirm the commit being tagged is on `origin/main` (not a local
   branch).
5. Confirm the commit is signed (`git log --show-signature -1`).
6. Create the tag with an annotated message:
   ```
   git tag -a -s v25.4.0 -m "MITHQAL v25.4.0 — see DEPLOYMENT-PROVENANCE-v25.4.0.md"
   ```
7. Push the tag: `git push origin v25.4.0`.
8. Create the `DEPLOYMENT-PROVENANCE-v25.4.0.md` document committed
   to `main` and tagged at the same SHA.
9. Trigger the `.github/workflows/deploy.yml` workflow which deploys
   from the signed tag (see `vercel.json` + `deployments/manifest.json`).

### 3.4 Tag signature

All tags MUST be GPG-signed (or SSH-signed with `git config
gpg.format=ssh`). The release manager's GPG key fingerprint MUST be
registered with the Constitutional Council and listed in
`docs/verification/git-governance-certification.md`. An unsigned tag is
rejected by the deployment workflow.

## 4. Archive-only policy

### 4.1 No history rewriting

The git history is the audit trail. There is no scenario in which
rewriting history is permitted:

- `git rebase` that rewrites published commits — FORBIDDEN.
- `git commit --amend` on a published commit — FORBIDDEN.
- `git push --force` — FORBIDDEN (branch protection enforces this).
- `git push --force` to a tag — FORBIDDEN (tag protection enforces
  this).
- `git filter-branch` / `git filter-repo` to remove secrets —
  FORBIDDEN post-publish. The correct response to a leaked secret is
  to rotate the secret (not to rewrite history) and to commit a
  `CRED-INCIDENT-XXX` document.

### 4.2 Secret leakage protocol

If a secret (API key, token, password) was committed and pushed:

1. **Rotate the secret immediately.** This is non-negotiable. The
   secret MUST be considered compromised regardless of how quickly
   the commit is "removed."
2. Update `.env` / Vercel env vars / GitHub secrets with the rotated
   value.
3. Commit a `CRED-INCIDENT-YYYY-MM-DD-NNN.md` document under
   `docs/verification/` describing the leak + the rotation + the
   root cause + the corrective action.
4. Update `docs/gap-register.md` to record the incident.
5. Do NOT rewrite history. The leaked commit stays in the repo as an
   immutable audit record. The rotated value is the only one that
   works; the leaked value is dead.

### 4.3 Branch archive

Branches that have been merged to `main` are deleted (per §2.1
"Delete head branches" GitHub setting) — they are not archived
because their commits are preserved on `main`. Long-lived feature
branches (e.g. `release/v25.4.0`) MAY be archived as
`archive/<original-name>` if a release manager needs to keep them
around; otherwise they are deleted after the release ships.

## 5. Pull request policy

### 5.1 Required reviewers

Every PR requires two (2) approvals from the file's CODEOWNERS. For
files in `/docs/blueprint/` (the highest-governance path), at least
one approval MUST come from the Constitutional Council
(`@mohamed-eltonsys` today; expanding as the council grows).

### 5.2 PR template

Every PR description MUST include:

```
## Task ID
FULL-PLATFORM-BUILD (or the worklog task ID).

## Truth-state impact
- [ ] This PR does not change production authorization (still false).
- [ ] This PR does not enable MTQ writes (still disabled).
- [ ] This PR is honest-state labelled.

## Files changed
<bullet list>

## Lint result
`bun run lint` → 0 errors.

## Test coverage
<bullet list of test scenarios covered>

## Rollback plan
<how to revert if something breaks>
```

### 5.3 Squash-merge convention

PRs are squash-merged into `main` with a conventional-commit message:

```
<type>(<scope>): <subject>

<body>

<Task-ID>: <FULL-PLATFORM-BUILD>
<Truth-state>: <VERIFIED|HYPOTHESIS|DECISION|UNRESOLVED|NOT AUTHORIZED>
```

`type` is one of `feat`, `fix`, `docs`, `chore`, `refactor`, `test`,
`ci`, `perf`. `scope` is the affected subsystem (`security`,
`turso`, `inngest`, etc.).

## 6. Repository settings summary

| Setting | Value |
|---|---|
| Default branch | `main` |
| Allow force pushes | OFF (all branches) |
| Allow branch deletion | OFF (`main`, `release/*`) |
| Allow tag deletion | OFF (all tags) |
| Allow tag force-push | OFF (all tags) |
| Require signed commits | ON |
| Require linear history | ON |
| Allow merge commits | OFF |
| Allow rebase merges | ON (default) |
| Allow squash merges | ON (default) |
| Automatically delete head branches | ON |

## 7. References

- `CODEOWNERS` — file ownership matrix.
- `.github/workflows/ci.yml` — CI pipeline that gates merges.
- `.github/workflows/deploy.yml` — deployment pipeline that ships
  from signed tags.
- `docs/verification/git-governance-certification.md` — historical
  record of git governance compliance.
- `docs/vercel-rollback.md` — rollback runbook (tags never deleted;
  rollback is by redeploying an earlier signed tag).
