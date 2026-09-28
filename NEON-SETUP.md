# Neon Database — Fallback Setup Runbook

**Owner:** Mithqal Platform Engineering
**Task origin:** `AI-FALLBACK-INNGEST-NEON`
**Status:** Not wired in. Turso (libsql) is the primary database. This
document is the runbook for promoting Neon to fallback if Turso becomes
unreachable.

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

The `NEON_DATABASE_URL` env var is intentionally **not** read by the
current `src/lib/db.ts` — it is a dormant secret that becomes live
only when the operator edits `db.ts` per section 6 below.

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

## 6. Step 4 — Modify `src/lib/db.ts` to fall back to Neon

When you need to actually switch (Turso is down), apply the following
patch to `src/lib/db.ts`. The switch is governed by the
`DATABASE_BACKEND` env var so you can flip back without a redeploy:

```typescript
// At the top of src/lib/db.ts, replace the existing imports:

import { createClient as createLibsqlClient, type Client, type Transaction as LibsqlTransaction } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

// If DATABASE_BACKEND === 'neon', use the Neon serverless driver.
// Otherwise stick with Turso (the default). This is a lazy import so
// the Neon driver is only pulled in when actually needed — keeps the
// cold-start path lean for the common (Turso) case.
async function createNeonClient(): Promise<Client> {
  const { neon, neonConfig } = await import('@neondatabase/serverless')
  neonConfig.poolQueryViaFetch = true  // workaround for Vercel edge
  const sql = neon(process.env.NEON_DATABASE_URL!)
  // Wrap the Neon `sql` tagged-template function in a thin adapter
  // that exposes the same `Client` interface as @libsql/client.
  // ... adapter implementation ...
}

function createDbClient(): Client {
  const backend = process.env.DATABASE_BACKEND ?? 'turso'
  if (backend === 'neon' && process.env.NEON_DATABASE_URL) {
    // Note: createNeonClient is async; either make createDbClient
    // async (and propagate) or pre-resolve the client into a global.
    // For simplicity in this runbook, see the adapter pattern below.
    throw new Error('Use the async Neon adapter — see NEON-SETUP.md §6')
  }
  // ... existing Turso path unchanged ...
}
```

**A simpler pattern** (recommended for the first fallback exercise):
keep `createDbClient()` synchronous and just swap the connection
string selection. libsql's HTTP gateway can talk to Neon too, via the
`?sslmode=require` parameter — though this is unsupported by Neon.

The cleanest path is the **adapter pattern** — write a small wrapper
that exposes the libsql `Client` interface but internally calls the
Neon serverless driver. ~80 lines of code; the application code in
`db.ts` does not need to change because it only uses
`client.execute()` and `client.transaction()`.

### Flip the switch

Once `db.ts` is patched and redeployed, flip the fallback in Vercel:

1. **Settings → Environment Variables → `DATABASE_BACKEND`** → edit
   → change value from `turso` to `neon` → Save.
2. Redeploy.
3. Hit `/api/status` to confirm the new DB is alive.
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
- [ ] Wrote the `@neondatabase/serverless` adapter for `db.ts`.
- [ ] Tested the adapter against a single read endpoint (e.g.
      `/api/formation-interest`).
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
