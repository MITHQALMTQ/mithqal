# Mithqal — Vercel Environment Setup (Fully Automated)

This guide shows how to push all your `.env` variables to Vercel in one command.

## Prerequisites (one-time, ~2 minutes)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Authenticate

```bash
vercel login
```

- Enter your email (the one tied to your Vercel account)
- Check your inbox for the verification code
- Paste the code → authenticated

### 3. Link the project

```bash
cd /home/z/my-project
vercel link
```

- It will detect the Next.js project
- Select your team (if applicable)
- Confirm the project name (`mithqal`)

This creates `.vercel/project.json` (gitignored) so the CLI knows which project to push to.

## Push all env vars (the automated part)

```bash
./scripts/push-env-to-vercel.sh
```

**What it does:**
1. Reads every `KEY=VALUE` from `.env`
2. For each variable:
   - Deletes the existing value in `production` / `preview` / `development` (if any)
   - Re-creates it in all 3 environments
3. Prints a summary of what was pushed
4. Reminds you to redeploy

**Variables pushed (12 total):**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Turso libsql connection string |
| `DATABASE_AUTH_TOKEN` | Turso database auth token |
| `NEXTAUTH_SECRET` | JWT signing secret (32 hex bytes) |
| `NEXTAUTH_URL` | Production URL (`https://mithqal.vercel.app`) |
| `ADMIN_EMAIL` | Operator login email |
| `ADMIN_PASSWORD_HASH` | scrypt hash of operator password |
| `ADMIN_NOTIFY_EMAIL` | Where notifications are sent |
| `SMTP_HOST` | `smtp.mail.me.com` (iCloud) |
| `SMTP_PORT` | `587` (STARTTLS) |
| `SMTP_USER` | iCloud email |
| `SMTP_PASS` | iCloud App-Specific Password |
| `SMTP_FROM` | `Mithqal <meltonsy@icloud.com>` |

## Options

```bash
# Preview what would be pushed (no changes)
./scripts/push-env-to-vercel.sh --dry-run

# Push a single variable
./scripts/push-env-to-vercel.sh DATABASE_URL

# Push a single variable
./scripts/push-env-to-vercel.sh SMTP_PASS
```

## After pushing — redeploy

New env vars don't take effect until you redeploy:

```bash
# Option A: Direct production deploy
vercel --prod

# Option B: Trigger via Git (auto-deploys on push)
git push origin main
```

Then verify at **https://mithqal.vercel.app**:
- `/api/status` → `database: "connected"`
- `/api/admin/smtp-test` (login first) → `sent: true`
- `/api/onchain-test` → 9/9 PASS

## Security notes

- All variables are pushed as **sensitive** (hidden in the Vercel dashboard — shown as `[Encrypted]`)
- The `.env` file is gitignored and never committed to Git
- The script never prints secret VALUES — only KEY names
- The `SMTP_PASS` is your iCloud App-Specific Password (NOT your Apple ID password)

## Troubleshooting

**"Project not linked to Vercel"**
→ Run `vercel link` first (one-time)

**"vercel: command not found"**
→ Install: `npm i -g vercel`

**"Authentication failed"**
→ Run `vercel login` again (token may have expired)

**Env var not taking effect**
→ You must redeploy after pushing. Run `vercel --prod` or `git push origin main`.

**SMTP returns 550 "From address is not one of your addresses"**
→ iCloud requires `SMTP_FROM` to match `SMTP_USER`. Both must be `meltonsy@icloud.com`.
