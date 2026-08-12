# MITHQAL Development & Deployment Workflow

**Goal:** Develop and test changes **locally** on the sandbox for speed. Push to **GitHub, Turso, and Vercel only when changes are tested and ready** — protecting the verified working versions on each target.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  LOCAL SANDBOX (active development — fast iteration) │
│  • Edit code                                          │
│  • Test via dev server (port 3000)                   │
│  • Lint, verify                                      │
│  • All changes stay local until you deploy           │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │  deploy-all.sh      │  (manual, with confirmation)
        │  1. GitHub (code)   │──→  PROTECTED GitHub repo
        │  2. Turso (schema)  │──→  PROTECTED Turso database
        │  3. Vercel (prod)   │──→  PRODUCTION Vercel site
        └─────────────────────┘
```

**Key principle:** The sandbox is your active workspace. GitHub/Turso/Vercel are **protected** targets that only receive changes when you explicitly deploy them.

---

## Daily Workflow

### 1. Starting work (after a sandbox restart)

```bash
bash .zscripts/bootstrap-recover.sh
```
This restores the full project from GitHub + Turso and starts all services. Run this once at the start of each session.

### 2. Making changes (local only)

Edit files normally. The dev server (port 3000) hot-reloads automatically. Test your changes in the browser.

```bash
# Check status anytime
bash .zscripts/dev.sh status

# Check NAV/RR (live Turso data)
bash .zscripts/dev.sh nav

# Run linter
bash .zscripts/dev.sh lint

# View logs
bash .zscripts/dev.sh logs
```

**Nothing you do here touches GitHub, Turso, or Vercel.** You're working entirely locally.

### 3. Deploying (when changes are tested and ready)

**Deploy to all three targets (recommended):**
```bash
bash .zscripts/dev.sh deploy "your commit message"
```
This runs GitHub → Turso → Vercel in sequence, with confirmation at each step.

**Or deploy individually:**
```bash
# Push code to GitHub only
bash .zscripts/dev.sh deploy-github "fix: updated reserve calculation"

# Push schema to Turso only (only if prisma/schema.prisma changed)
bash .zscripts/dev.sh deploy-turso

# Deploy to Vercel production only
bash .zscripts/dev.sh deploy-vercel
```

Each deploy script:
- Shows you exactly what will be deployed
- Asks for confirmation (`[y/N]`)
- Never pushes `.env` (secrets stay local)
- Never pushes `.pid`/`.log`/screenshot files (gitignored)

---

## Reference: All Commands

```bash
bash .zscripts/dev.sh <command>
```

| Command | What it does | Deploys? |
|---|---|---|
| `status` | Show all service status | No |
| `start` | Start all local services | No |
| `stop` | Stop all local services | No |
| `restart` | Restart all services | No |
| `lint` | Run ESLint | No |
| `log` | Tail dev server log | No |
| `logs` | Show recent logs from all services | No |
| `nav` | Show NAV/RR from Turso (read-only) | No |
| `db` | List Turso tables (read-only) | No |
| `deploy` | Deploy to ALL (GitHub → Turso → Vercel) | **Yes** |
| `deploy-github` | Push to GitHub only | **Yes** |
| `deploy-turso` | Push schema to Turso only | **Yes** |
| `deploy-vercel` | Deploy to Vercel production only | **Yes** |

---

## What is Protected

| Target | What's there | When it changes |
|---|---|---|
| **GitHub** (`MITHQALMTQ/mithqal`) | Source code, docs, scripts | Only when you run `deploy-github` |
| **Turso** (`mithqal-db-fortleem`) | Database schema + data | Only when you run `deploy-turso` |
| **Vercel** (`mithqal-kpkqed3sr-tonsy.vercel.app`) | Production website | Only when you run `deploy-vercel` |

**Nothing auto-pushes.** The auto-push watchdog has been **stopped** — it was pushing untested changes every 5 minutes, which risks corrupting the protected targets. Now every push is manual and confirmed.

---

## What Stays Local (never deployed)

These files are gitignored and never leave the sandbox:
- `.env` — all credentials (Turso, GitHub, Vercel, Discord, SMTP, API keys)
- `.zscripts/*.pid` — process ID files
- `.zscripts/*.log` — runtime logs
- `.zscripts/*.png` — screenshots
- `db/custom.db` — local SQLite fallback (Turso is used in production)
- `node_modules/`, `.next/` — build artifacts

---

## If the Sandbox Restarts

The sandbox filesystem is volatile (wiped on restart). To recover:

```bash
bash .zscripts/bootstrap-recover.sh
```

This pulls everything back from GitHub + Turso. Your `.env` needs to be re-created (copy from your password manager, or decrypt `.env.encrypted` using the SHA-256 of your GitHub token per `RESTORE-ENV.md`).

---

## Emergency: Reverting a Bad Deploy

If you deploy something broken to a protected target:

**GitHub:**
```bash
git log --oneline -5              # find the last good commit
git revert HEAD                   # create a revert commit
bash .zscripts/deploy-github.sh   # push the revert
```

**Vercel:** Vercel keeps every deployment. Go to the Vercel dashboard → find the last working deployment → "Promote to Production". Or:
```bash
vercel ls                          # list recent deployments
vercel promote <deployment-url>    # promote a previous one
```

**Turso:** Turso has point-in-time recovery. Go to https://app.turso.tech → your database → "Restore" → pick a timestamp before the bad schema push.

---

## Quick Command Reference Card

```bash
# ── Daily ──
bash .zscripts/bootstrap-recover.sh    # after restart
bash .zscripts/dev.sh status           # check services
bash .zscripts/dev.sh nav              # check NAV/RR
bash .zscripts/dev.sh lint             # check code

# ── Deploy (when ready) ──
bash .zscripts/dev.sh deploy "msg"     # all 3 targets
bash .zscripts/dev.sh deploy-github    # GitHub only
bash .zscripts/dev.sh deploy-turso     # Turso only
bash .zscripts/dev.sh deploy-vercel    # Vercel only

# ── Recovery ──
bash .zscripts/bootstrap-recover.sh    # restore after restart
```
