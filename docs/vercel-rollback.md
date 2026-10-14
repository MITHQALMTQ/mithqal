# MITHQAL Vercel Rollback Runbook

**Document ID:** MITHQAL-VERCEL-ROLLBACK
**Status:** DECISION (FULL-PLATFORM-BUILD)
**Truth state:** WIRED. Tags are immutable (per
`docs/github-policy.md` §3); rollback is by redeploying an earlier
signed tag. No tag is ever deleted.

## 1. Purpose

This runbook describes the canonical procedure for rolling back a
Vercel deployment to a previous signed git tag. The procedure
preserves the audit trail — the failed deployment's tag stays in
place; the rollback is a *new* deployment of an *earlier* tag.

## 2. When to roll back

Roll back when:

1. The deployed tag is producing SEV-0 or SEV-1 incidents
   (per `src/lib/incident-severity.ts`) and the root cause is
   unknown — rollback buys time to diagnose.
2. The deployed tag's `next build` succeeded but the runtime is
   broken (a runtime regression that did not surface in CI).
3. A regulator or bank design partner requests an immediate
   revert.

Do NOT roll back when:

1. The incident is SEV-2 (degrade) or SEV-3 (backlog) — these are
   handled by the incident-severity workflow, not by a rollback.
2. The root cause is in the database (Neon or Turso) — a code
   rollback does not revert the database. Use the database
   rollback procedure (per `BACKUP-AND-RECOVERY.md`).

## 3. Procedure

### 3.1 Identify the rollback target

```bash
git tag --list 'v*' --sort=-creatordate | head -10
```

Pick the most recent tag that was deployed successfully. The
`DEPLOYMENT-PROVENANCE-*.md` documents in the repo root record
every successful deployment — read them to find the last known
good state.

### 3.2 Verify the rollback target is signed + on origin/main

```bash
git tag -v <rollback-tag>            # MUST verify OK
git branch -r --contains <rollback-tag-commit> | grep origin/main  # MUST list origin/main
```

If either check fails, abort the rollback — the tag is not a
valid rollback target.

### 3.3 Trigger the deploy pipeline for the rollback tag

The `.github/workflows/deploy.yml` pipeline triggers on every
`refs/tags/v*` push. Re-running a deploy of an existing tag is
done via the GitHub Actions UI:

1. Open the GitHub repo → Actions → Deploy (signed tag → Vercel).
2. Click "Re-run all jobs" on the workflow run for the rollback
   tag.
3. The pipeline re-deploys the rollback tag to Vercel production.

Alternatively, force a re-trigger by deleting + re-pushing the
tag (which is FORBIDDEN per `docs/github-policy.md` §3 — tags are
immutable). The canonical path is the GitHub Actions re-run.

### 3.4 Verify the rollback

After the deploy pipeline completes:

1. Visit the production URL (`https://<project>.vercel.app`).
2. Confirm the status-bar shows the rollback tag's version.
3. Confirm the API surface is green:
   ```bash
   curl -s https://<project>.vercel.app/api/v1/health | jq .
   ```
   The response MUST include `mtqDisabled: true` + the rollback
   tag's `policyVersion`.
4. Commit a `ROLLBACK-PROVENANCE-v<tag>.md` document recording
   the rollback (the failed tag, the rollback tag, the timestamp,
   the operator, the root cause hypothesis).

### 3.5 Do NOT delete the failed tag

Per `docs/github-policy.md` §3, the failed tag stays in place as
an immutable historical record. The next deployment (the
rollback) is a *new* tag, not a replacement. The failed tag's
`DEPLOYMENT-PROVENANCE-*.md` document is updated with an
"ERRATA — rolled back to <rollback-tag>" note.

## 4. Database considerations

A code rollback does NOT revert the database. The Neon database
state at the time of the rollback is the *current* state — every
validation case, evidence event, exception, policy decision,
reconciliation case, idempotency record, outbox event, and
access audit event stays in place.

If the database state itself needs to be reverted (e.g. the
failed tag corrupted data):

1. Use the Neon snapshot/restore feature to restore the database
   to the pre-failed-tag state.
2. Use the Turso `turso-reconcile` Inngest function to verify
   the Turso projection is consistent with the restored Neon
   state.
3. Commit a `DATABASE-ROLLBACK-PROVENANCE-YYYY-MM-DD.md` document
   describing the restore + the verification.

## 5. Communication

After a rollback:

1. Notify the Constitutional Council (email + the
   `#mithqal-incidents` Slack channel).
2. Notify every bank design partner via the secure channel (per
   `src/lib/breach-notification.ts` if the rollback was triggered
   by a security incident).
3. Notify the regulator if the rollback affected a regulated
   workflow (e.g. a custody shortfall triggered the rollback —
   the regulator notification workflow is invoked).
4. Update the gap register (`docs/gap-register.md`) with the
   rollback record under §11.5.

## 6. References

- `.github/workflows/deploy.yml` — the deployment pipeline.
- `docs/github-policy.md` §3 — tag immutability policy.
- `docs/gap-register.md` §11.5 — rollback runbook gap-register
  entry.
- `BACKUP-AND-RECOVERY.md` — database backup + recovery.
- `DEPLOYMENT-PROVENANCE-*.md` — historical deployment records.
