#!/bin/bash
# =============================================================================
# MITHQAL Auto-Push Watchdog — protects against volatile sandbox filesystem
# =============================================================================
# The sandbox root filesystem is a `volatile` overlay (RAM, wiped on restart).
# This watchdog commits + pushes to GitHub every 5 minutes so no work is lost.
# On restart, run .zscripts/bootstrap-recover.sh to pull everything back.
# =============================================================================

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
ENV_FILE="$PROJECT_DIR/.env"
INTERVAL=300  # 5 minutes
LOG_FILE="$PROJECT_DIR/.zscripts/watchdog.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WATCHDOG] $*" >> "$LOG_FILE"; }

log "=== Auto-push watchdog started (interval: ${INTERVAL}s) ==="

# Load credentials
set -a; source "$ENV_FILE" 2>/dev/null; set +a

if [ -z "${GITHUB_TOKEN:-}" ] || [ -z "${GITHUB_REPO_URL:-}" ]; then
    log "FATAL: GITHUB_TOKEN or GITHUB_REPO_URL not set in .env. Cannot push."
    exit 1
fi

# Configure git remote with token (idempotent)
AUTH_URL=$(echo "$GITHUB_REPO_URL" | sed "s|https://github.com|https://x-access-token:${GITHUB_TOKEN}@github.com|")
cd "$PROJECT_DIR"
git remote set-url origin "$AUTH_URL" 2>/dev/null || git remote add origin "$AUTH_URL"

# Configure git user if not set
git config user.email 2>/dev/null || git config --global user.email "watchdog@mithqal.local"
git config user.name 2>/dev/null  || git config --global user.name "MITHQAL Watchdog"

PUSH_COUNT=0
while true; do
    sleep "$INTERVAL"
    log "Cycle started."

    cd "$PROJECT_DIR"

    # Check for changes (staged, unstaged, or untracked)
    if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
        log "No changes. Skipping."
        continue
    fi

    # Stage everything (node_modules and .env are in .gitignore)
    git add -A 2>/dev/null

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MSG="watchdog: auto-save at $TIMESTAMP"

    if git commit -m "$COMMIT_MSG" 2>/dev/null; then
        log "Committed: $COMMIT_MSG"
        BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
        if git push origin "$BRANCH" 2>&1 >> "$LOG_FILE"; then
            PUSH_COUNT=$((PUSH_COUNT + 1))
            log "Push #$PUSH_COUNT successful to $BRANCH."
        else
            log "WARNING: push failed. Will retry next cycle."
        fi
    else
        log "Nothing to commit (empty or hook-blocked)."
    fi
done
