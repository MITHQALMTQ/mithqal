# Neon Database — Fallback Setup Runbook

**Owner:** Mithqal Platform Engineering
**Task origin:** `AI-FALLBACK-INNGEST-NEON`
**Status:** WIRED (Task E2-B, release v25.6). Turso (libsql) is the
primary database. This document is the runbook for engaging the Neon
fallback if Turso becomes unreachable. The `DATABASE_BACKEND=neon`
branch is implemented in `src/lib/db.ts` — operators no longer need
to hand-edit code to switch backends.

---

## 1. Why this document exists

The Mithqal platform currently uses **Turso (libsql)** as its only
production database. Turso has been stable, but every dependency is a
single point of failure. **Neon** (serverless Postgres) is a
managed-service alternative that we keep warm as a fallback target so
that an operator can switch database backends in a single PR if Turso
has a regional outage, a libsql protocol regression, or an auth-token
expiry.

This is a **manual fallback**, not an automatic failover. The reason
is deliberate: a silent database switch could mask an underlying issue
(e.g. Turso token expiry, which is the most common cause of a Turso
outage in our experience). The operator should know the moment the
fallback is engaged.

---

## 2. Prerequisites

- A Neon account (https://neon.tech — free tier is sufficient for
  fallback; scale-out plan recommended for production traffic).
- Vercel project owner access for the Mithqal project (so you can add
  env vars).
- A current snapshot of the Turso database (the schema + a recent data
  export — see section 5).

---

## 3. Step 1 — Provision a Neon project

1. Sign in to https://console.neon.tech.
2. Click **New Project**.
3. Name it `mithqal-fallback`.
4. Pick the **AWS us-east-2** region (closest to Vercel's default
   `iad1` region — same region minimises RTT to the Vercel serverless
   functions).
5. Pick **Postgres 17** (latest stable as of this writing; older
   versions work too, but 17 has the best cold-start perf).
6. Click **Create project**. Neon will display a connection string
   that looks like:
   ```
   postgresql://mithqal_owner:AbCdEf...@ep-cool-leaf-123456.us-east-2.aws.neon.tech/mithqal?sslmode=require
   ```
7. Copy this string. **Treat it as a production secret** — it grants
   full DB owner rights.

> **Branching:** Neon supports database branches. For the fallback
> scenario you want the `main` branch only — branching is great for
> preview environments, but a fallback database should be a single
> authoritative copy of the primary.

---

## 4. Step 2 — Add `NEON_DATABASE_URL` to Vercel env vars

1. Open the Mithqal project on https://vercel.com.
2. **Settings → Environment Variables**.
3. Add a new variable:
   - **Key:** `NEON_DATABASE_URL`
   - **Value:** the full `postgresql://...` connection string from
     step 1.6 above.
   - **Environments:** select **Production**, **Preview**, and
     **Development**. (Preview/Dev need it only if you want to test
     the fallback locally — if not, leave them unchecked.)
4. Click **Save**.
5. (Optional but recommended) Add a second variable:
   - **Key:** `DATABASE_BACKEND`
   - **Value:** `turso` (this is the default — see section 6 below
     for the switch value).
6. Trigger a redeploy so the new env var is picked up: **Deployments →
   ⋮ on the latest deployment → Redeploy**.

The `NEON_DATABASE_URL` env var IS read by `src/lib/db.ts` (Task E2-B,
release v25.6). It is a dormant secret that becomes live only when the
operator also sets `DATABASE_BACKEND=neon` in the same env-var panel —
see section 6 below.

---

## 5. Step 3 — Migrate the schema + data from Turso to Neon

### 5.1. Schema

The Mithqal schema is defined in `src/lib/db.ts` (look for the
`initSchema()` function — it runs `CREATE TABLE IF NOT EXISTS` for
every table). The schema is plain SQL with **one** libsql-ism: it uses
SQLite's `INTEGER PRIMARY KEY` for the id column, while Postgres
prefers `BIGSERIAL` or `UUID`-shaped ids.

Two options:

- **Quickest:** keep the existing column type and let Postgres accept
  `INTEGER PRIMARY KEY` (it will, just with a smaller max id space —
  fine for a fallback). Then the only edit is swapping the libsql
  driver for the Neon driver.
- **Cleanest:** rename `INTEGER PRIMARY KEY` → `BIGSERIAL PRIMARY KEY`
  in `initSchema()` and re-run on Neon. The application code reads
  `id` as a string in both cases (the Turso driver returns bigint as
  string), so no application-level change is needed.

### 5.2. Data dump

Use `turso db shell` to dump Turso data to SQL:

```bash
# Install the Turso CLI if you don't have it:
curl -sSfL https://get.tur.so/install.sh | bash

# Log in and select the Mithqal database:
turso auth login
turso db shell mithqal-db-fortleem

# Inside the shell, dump every table to /tmp/mithqal-dump.sql:
.dump
# Then exit the shell with Ctrl-D.
```

Load that SQL into Neon with `psql`:

```bash
# psql comes with the Postgres client tools. On macOS:
brew install libpq && brew link --force libpq

# Pipe the dump into Neon:
psql "postgresql://mithqal_owner:AbCdEf...@ep-cool-leaf-123456.us-east-2.aws.neon.tech/mithqal?sslmode=require" \
  -f /tmp/mithqal-dump.sql
```

If `.dump` produces SQLite-flavored SQL that Postgres rejects (e.g.
`INSERT INTO ... VALUES (... '2024-01-01T...')` with no explicit
casts), use `turso db shell`'s `.dump --postgres` flag instead, or
hand-patch the dump file. SQLite's datetime strings are accepted by
Postgres's `TIMESTAMP` columns without casts in most cases.

### 5.3. Verify

Connect to the Neon database and confirm row counts match Turso:

```bash
psql "$NEON_DATABASE_URL" -c "
  SELECT 'formation_interest' AS t, COUNT(*) FROM formation_interest
  UNION ALL
  SELECT 'testnet_operation', COUNT(*) FROM testnet_operation
  -- add every table in src/lib/db.ts's initSchema()
  ORDER BY t;
"
```

Compare with Turso:

```bash
turso db shell mithqal-db-fortleem \
  "SELECT 'formation_interest', COUNT(*) FROM formation_interest
   UNION ALL
   SELECT 'testnet_operation', COUNT(*) FROM testnet_operation
   ORDER BY 1;"
```

If counts match, the Neon fallback is warm and ready.

---

## 6. Step 4 — `src/lib/db.ts` DATABASE_BACKEND=neon triggers the wired Neon fallback

The `DATABASE_BACKEND=neon` branch IS NOW WIRED in `src/lib/db.ts`
(Task E2-B, release v25.6). Operators no longer need to hand-edit the
file. The switch is governed by the `DATABASE_BACKEND` env var so you
can flip back with a single env-var change + redeploy:

```typescript
// src/lib/db.ts — current shape (post-E2-B):

function createDbClient(): Client {
  // ---- Neon fallback branch (Task E2-B / release v25.6) ----
  // GATED on DATABASE_BACKEND === 'neon' AND NEON_DATABASE_URL.
  if (process.env.DATABASE_BACKEND === 'neon') {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error(
        'DATABASE_BACKEND=neon but NEON_DATABASE_URL is not set. See NEON-SETUP.md',
      )
    }
    // Surface the active-failover switch in the operator's logs.
    console.warn(
      '[db] DATABASE_BACKEND=neon — using Neon fallback (manual switch). ' +
      'Turso is the primary. See NEON-SETUP.md.',
    )
    return new NeonLibsqlAdapter(process.env.NEON_DATABASE_URL)
  }

  // ---- Default (Turso / libsql) branch — unchanged ----
  const url = process.env.DATABASE_URL || 'file:./db/custom.db'
  // ... existing Turso path ...
}
```

The `NeonLibsqlAdapter` class (defined in the same file) is a thin
shim that implements the libsql `Client` interface but internally
calls `@neondatabase/serverless`'s `sql` tagged-template function.
Key properties:

- **Lazy load.** The Neon driver is `await import()`-ed on the
  FIRST query, NOT at module load. The constructor kicks off the
  dynamic import as a side effect, but the actual `sql` function is
  constructed lazily on first use. The Turso path (default) never
  loads `@neondatabase/serverless`.
- **Placeholder translation.** libsql uses `?` positional placeholders;
  Postgres uses `$1, $2, ...`. The adapter translates on the fly.
- **Result shaping.** Neon (with `{ fullResults: true }`) returns
  `{ fields, rows, rowCount }`. The adapter maps this to libsql's
  `ResultSet` (`{ columns, columnTypes, rows, rowsAffected,
  lastInsertRowid }`) so all 50+ `_rawClient.execute(...)` call sites
  work unchanged.
- **Interactive transactions.** Neon's HTTP serverless driver does
  NOT support interactive (mid-flight-branching) transactions — only
  callback-style `sql.transaction([...])`. The adapter runs queries
  eagerly on the underlying connection (no atomicity) and `rollback()`
  throws so the operator knows atomicity is unavailable. The app's
  exported `transaction()` helper (the only caller) is unused in
  production today — if you wire a caller that needs atomic
  transactions on Neon, use `batch()` (which IS atomic).

### Flip the switch

To engage the fallback (assuming steps 1–3 above are done):

1. **Settings → Environment Variables → `DATABASE_BACKEND`** → edit
   → change value from `turso` to `neon` → Save.
2. Redeploy. On boot, `createDbClient()` logs the active-failover
   warning: `[db] DATABASE_BACKEND=neon — using Neon fallback (manual
   switch). Turso is the primary. See NEON-SETUP.md.`
3. Hit `/api/status` to confirm the new DB is alive (`database:
   connected` in the JSON response).
4. Roll back to Turso the same way (flip `DATABASE_BACKEND` back to
   `turso` and redeploy).

---

## 7. Operational checklist

- [ ] Provisioned `mithqal-fallback` Neon project in `us-east-2`.
- [ ] Copied the connection string into 1Password / Vault.
- [ ] Added `NEON_DATABASE_URL` to Vercel (all 3 environments).
- [ ] Added `DATABASE_BACKEND=turso` to Vercel (default).
- [ ] Ran schema migration → confirmed tables exist on Neon.
- [ ] Ran data dump from Turso → loaded into Neon → counts match.
- [x] Wired the `@neondatabase/serverless` adapter in `src/lib/db.ts`
      (Task E2-B, release v25.6). The `DATABASE_BACKEND=neon` branch
      is live; the adapter (`NeonLibsqlAdapter` class) lazy-imports
      `@neondatabase/serverless` on first query so the default Turso
      cold-start path stays lean.
- [ ] Tested the adapter against a single read endpoint (e.g.
      `/api/formation-interest`) — to be done the next time the
      fallback is engaged for a real Turso outage.
- [ ] Documented the rollback procedure in the on-call runbook.

---

## 8. Why NOT auto-failover

Auto-failover to Neon would require:

1. A health-check that distinguishes "Turso is briefly rate-limited"
   from "Turso is genuinely down". We don't have a reliable heuristic.
2. A bidirectional data-sync to keep Turso and Neon in lockstep so
   the fallback is current. Bidirectional sync to a backup database is
   a known source of split-brain bugs; it is NOT worth it for a
   platform that's been 100% Turso-healthy.

The manual-fallback design trades a few minutes of operator response
time for a much smaller blast radius and a much simpler mental model.
When Turso has an incident, the operator flips a single env var and
redeploys; the page comes back within ~3 minutes of a Vercel
redeploy.

---

## 9. References

- Turso CLI: https://docs.turso.tech/cli
- libsql client (TypeScript): https://github.com/tursodatabase/libsql-client-ts
- Neon serverless driver: https://neon.tech/docs/serverless/serverless-driver
- Neon connection pooling: https://neon.tech/docs/connect/connection-pooling
- Vercel env vars: https://vercel.com/docs/projects/environment-variables
- Mithqal db client source: `src/lib/db.ts`
- Mithqal schema (in `initSchema()`): `src/lib/db.ts`
