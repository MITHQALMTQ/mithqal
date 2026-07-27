# Mithqal — Backup & Recovery Runbook

**Last updated:** 26 July 2026
**Owner:** COO/CTO (operator)

This runbook documents how the Mithqal project is backed up, how to recover
from accidental data loss, and the anti-rollback policy that prevents the
main branch from being silently rewritten.

---

## 1. What is backed up

| Artifact | Location | Cadence | Purpose |
|---|---|---|---|
| Git history (all branches + tags) | `backups/mithqal-backup-*.bundle` | Every COO session | Full state recovery |
| `.env` (secrets) | Operator-only filesystem | Manual | Restored if lost |
| Local SQLite DB | `db/custom.db` | Auto (dev only) | Dev convenience |
| Production DB (Neon Postgres) | Vercel env var `DATABASE_URL` | Continuous | Production data |
| Uploaded files | `/home/z/my-project/upload/` | Persistent | Operator-only |
| Public legal artifacts | `public/legal/` | Git-tracked | Public verification |

Git bundles are full, self-contained repositories. They include every commit,
every branch, every tag — even dangling commits. To recover from a bundle:

```bash
git clone backups/mithqal-backup-<timestamp>.bundle recovered-mithqal
cd recovered-mithqal
git log --oneline                    # verify history
git fsck --lost-found                # recover any dangling commits
```

---

## 2. Anti-rollback protection

### 2.1 Annotated tags (immutable anchors)

Every stable release is marked with an annotated tag of the form
`v19.0-stable`, `v19.0-stable-2`, etc. Once pushed to `origin`, these tags
**cannot be moved or deleted** without admin override on GitHub.

- `v19.0-stable` — 26 July 2026, anchors the verified state:
  - §13 structural weight normalization (Σ C_i = 100.0000%)
  - 30/30 stability tests PASS
  - SMTP configured (smtp.mail.me.com:587 + STARTTLS)
  - Legal entity verified (JOZOUR LLC, EIN 84-3470275)

Verify integrity at any time:

```bash
git tag -v v19.0-stable                # verify tag signature
git log --oneline v19.0-stable         # show anchored history
git diff v19.0-stable..HEAD --stat     # see what's changed since anchor
```

### 2.2 Pre-push hook (local safety net)

`.git/hooks/pre-push` is installed locally and blocks:

1. **Force-push / non-fast-forward to `main`** — prevents rewriting history.
   To undo a specific change, use `git revert <commit>` instead, which
   creates a new commit that reverses the previous one.
2. **Deletion of `main`** — refuses to delete the branch.
3. **Deletion of any `v19.0-*` tag** — protects anti-rollback anchors.

### 2.3 GitHub remote enforcement (must be configured by operator)

The local hook is a convenience; **GitHub branch protection rules are the
authoritative enforcement**. Configure in the GitHub repo:

**Settings → Branches → Add rule for `main`:**
- ☑ Require a pull request before merging
- ☑ Require approvals (set to 1+)
- ☑ Require status checks to pass before merging
- ☑ Require branches to be up to date before merging
- ☑ Do not allow bypassing the above settings

**Settings → Tags → Add rule for `v19.0-*`:**
- ☑ Restrict who can create, update, or delete tags (admin only)

Without these remote rules, anyone with push access could bypass the local
hook by running `git push --no-verify` or by using a different machine.

---

## 3. Recovery procedures

### 3.1 "I lost some work — how do I get it back?"

Dangling commits (lost during a `git rebase` abort or `git reset --hard`)
are recoverable for up to 90 days (default reflog expiry):

```bash
git fsck --lost-found                   # list all dangling commits
git show <dangling-sha> --stat           # inspect content
git cherry-pick <dangling-sha>           # restore to current branch
```

The 26 Jul 2026 incident (lost §13 normalization fix from `f478afd`) was
recovered exactly this way.

### 3.2 "I need to roll back main — what's the policy?"

**Rolling back `main` is forbidden by policy.** Instead:

1. **To undo a specific change:** `git revert <commit>` creates a new commit
   that reverses the change. This preserves history and the anti-rollback tag.
2. **To mark a new stable point:** `git tag -a v19.0-stable-2 -m "..."`
   and push with `git push origin v19.0-stable-2`. The previous anchor
   (`v19.0-stable`) remains intact.
3. **To recover a deleted file:** `git log --all --full-history -- <path>`
   shows every commit that touched the path. Then `git checkout <sha> -- <path>`.

### 3.3 "`.env` was lost after a server restart"

The `.env` file is gitignored (intentionally — secrets must never be
committed). To restore:

1. Open the previous `.env` from a recent `backups/` snapshot, OR
2. Regenerate fresh secrets using `.env.example` as a template:

```bash
cp .env.example .env
# Generate NEXTAUTH_SECRET:
openssl rand -hex 32
# Generate ADMIN_PASSWORD_HASH (replace YOUR_PASSWORD):
node -e "const {scryptSync,randomBytes}=require('crypto');const p=process.argv[1];const s=randomBytes(16);const h=scryptSync(p,s,64);console.log(s.toString('hex')+':'+h.toString('hex'))" 'YOUR_PASSWORD'
```

If `ADMIN_PASSWORD_HASH` is regenerated, the old operator password no
longer works. Update the Vercel env vars and notify any other operators.

### 3.4 "Vercel production env vars"

Set via the Vercel dashboard or CLI:

```bash
vercel env add NEXTAUTH_SECRET production
vercel env add ADMIN_PASSWORD_HASH production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_NOTIFY_EMAIL production
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add SMTP_FROM production
vercel env add DATABASE_URL production
```

After updating env vars, **trigger a redeploy** for them to take effect.

---

## 4. SMTP configuration

Production SMTP is **Apple iCloud** (`smtp.mail.me.com:587`):

| Var | Value |
|---|---|
| `SMTP_HOST` | `smtp.mail.me.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `meltonsy@icloud.com` (operator's iCloud email) |
| `SMTP_PASS` | iCloud **App-Specific Password** (NOT the Apple ID password) |
| `SMTP_FROM` | `Mithqal <noreply@mithqal.io>` |

**Generating the App-Specific Password (one-time):**

1. Sign in at https://account.apple.com with the Apple ID `meltonsy@icloud.com`
2. Sign-In & Security → App-Specific Passwords → Generate
3. Label it "Mithqal SMTP"
4. Copy the 16-character password (lowercase letters only, no spaces)
5. Set `SMTP_PASS=<16-char-password>` in `.env` and on Vercel

**Connectivity test:**

```bash
# After setting SMTP_PASS, login to the Admin console at
# https://mithqal.vercel.app/?view=admin and click "Test SMTP".
# This calls POST /api/admin/smtp-test which sends a test email
# to ADMIN_NOTIFY_EMAIL and reports success/failure.
```

The transporter is configured with `requireTLS: true` (see
`src/lib/email.ts`), which forces STARTTLS upgrade and fails closed if
STARTTLS is unavailable — credentials are never sent over plaintext.

---

## 5. Daily verification checklist

Before considering the system healthy, verify:

- [ ] `git log --oneline -1` shows the expected latest commit
- [ ] `git tag -l v19.0-*` lists the expected anchor tags
- [ ] `git status` reports a clean working tree (or known modifications)
- [ ] `bun run src/lib/stability-tests.ts` → 30/30 PASS
- [ ] Production responds 200 at https://mithqal.vercel.app
- [ ] `/api/transparency` returns 200 with live oracle data
- [ ] `/api/admin` returns 401 without auth (auth-gated)
- [ ] SMTP test email arrives in the operator inbox

---

## 6. Lessons learned (incident log)

### 2026-07-26 — Lost §13 normalization fix

**Symptom:** The structural weight normalization fix (commit `f478afd`)
was not present in `main`, despite being implemented earlier.

**Root cause:** A `git rebase` was attempted and aborted. The rebase
abort left `f478afd` as a dangling commit (recoverable for 90 days via
`git fsck --lost-found`), but `main` was reset to its pre-rebase state
(`2114723`).

**Resolution:**
1. Identified the dangling commit via `git fsck --lost-found`.
2. Re-applied the changes via `Edit` (not `git cherry-pick` — to keep
   the diff small and reviewable).
3. Added Test 11 (regression guard) to `stability-tests.ts` so this
   specific fix can never be silently lost again.
4. Created `v19.0-stable` annotated tag as an immutable anchor.
5. Installed `.git/hooks/pre-push` to block future force-push attempts.
6. Wrote this runbook.

**Prevention:** The pre-push hook now blocks any force-push to `main`,
making accidental rollback impossible without explicit override.

— COO/CTO, 26 July 2026
