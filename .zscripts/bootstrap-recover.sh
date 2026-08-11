#!/bin/bash
# =============================================================================
# MITHQAL Bootstrap Recovery — pull everything from GitHub + Turso on restart
# =============================================================================
# The sandbox filesystem is VOLATILE (wiped on every restart).
# This script restores the full project from external durable sources.
#
# PREREQUISITE: .env must contain GITHUB_TOKEN, GITHUB_REPO_URL,
#               TURSO_DATABASE_URL, TURSO_AUTH_TOKEN.
# USAGE: bash .zscripts/bootstrap-recover.sh
# =============================================================================

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
ENV_FILE="$PROJECT_DIR/.env"
LOG_FILE="$PROJECT_DIR/.zscripts/bootstrap.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BOOTSTRAP] $*" | tee -a "$LOG_FILE"; }
fail() { echo "[BOOTSTRAP] FATAL: $*" | tee -a "$LOG_FILE"; exit 1; }

mkdir -p "$PROJECT_DIR/.zscripts"
: > "$LOG_FILE"
log "=== MITHQAL Bootstrap Recovery ==="

# 1. Load + validate credentials
[ -f "$ENV_FILE" ] || fail ".env not found at $ENV_FILE."
set -a; source "$ENV_FILE"; set +a

MISSING=()
[ -z "${GITHUB_REPO_URL:-}" ] && MISSING+=("GITHUB_REPO_URL")
[ -z "${GITHUB_TOKEN:-}" ]    && MISSING+=("GITHUB_TOKEN")
[ -z "${TURSO_DATABASE_URL:-}" ] && MISSING+=("TURSO_DATABASE_URL")
[ -z "${TURSO_AUTH_TOKEN:-}" ]   && MISSING+=("TURSO_AUTH_TOKEN")
if [ ${#MISSING[@]} -gt 0 ]; then
    fail "Missing credentials: ${MISSING[*]}. Fill .env and re-run."
fi
log "Credentials OK."

# 2. Clone or pull from GitHub
AUTH_URL=$(echo "$GITHUB_REPO_URL" | sed "s|https://github.com|https://x-access-token:${GITHUB_TOKEN}@github.com|")
cd "$PROJECT_DIR"
git remote set-url origin "$AUTH_URL" 2>/dev/null || git remote add origin "$AUTH_URL"
log "Fetching from GitHub..."
git fetch origin --force 2>&1 | tail -3
# Preserve local .env, reset the rest
git stash -u 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
git stash drop 2>/dev/null || true
log "Source restored from GitHub."

# 3. Ensure DATABASE_URL points to Turso
export DATABASE_URL="$TURSO_DATABASE_URL"
export DATABASE_AUTH_TOKEN="$TURSO_AUTH_TOKEN"

# 4. Install dependencies
log "Installing dependencies..."
bun install 2>&1 | tail -3
log "Dependencies installed."

# 5. Generate Prisma client
log "Generating Prisma client..."
bunx prisma generate 2>&1 | tail -3 || log "WARNING: prisma generate issue (non-fatal)."

# 6. Verify Turso connection
log "Verifying Turso connection..."
bun -e "
import { createClient } from '@libsql/client';
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const r = await c.execute('SELECT 1 as ok');
console.log('Turso OK:', r.rows[0].ok === 1 ? 'connected' : 'FAILED');
" 2>&1 | tail -2

# 7. Start watchdog
log "Starting auto-push watchdog..."
nohup bash "$PROJECT_DIR/.zscripts/auto-push-watchdog.sh" >> "$LOG_FILE" 2>&1 &
echo $! > "$PROJECT_DIR/.zscripts/watchdog.pid"
log "Watchdog started (PID: $(cat $PROJECT_DIR/.zscripts/watchdog.pid))."

# 8. Start mini-services
if [ -d "$PROJECT_DIR/mini-services" ]; then
    log "Starting mini-services..."
    bash "$PROJECT_DIR/.zscripts/mini-services-start.sh" 2>&1 | tail -5 || true
fi

# 9. Start dev server
log "Starting Next.js dev server on port 3000..."
cd "$PROJECT_DIR"
nohup bun run dev >> "$PROJECT_DIR/dev.log" 2>&1 &
echo $! > "$PROJECT_DIR/.zscripts/dev.pid"
for i in $(seq 1 30); do
    curl -s http://localhost:3000 > /dev/null 2>&1 && { log "Dev server ready."; break; }
    sleep 2
done

log "=== Bootstrap Recovery Complete ==="
log "Dev: http://localhost:3000 | DB: Turso | Source: GitHub"
