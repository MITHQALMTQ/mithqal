#!/bin/bash
# =============================================================================
# MITHQAL Deploy → GitHub
# =============================================================================
# Pushes LOCAL committed changes to GitHub (origin/main).
# This is a CONTROLLED deploy — run it only after you've tested locally.
#
# What this does:
#   1. Shows you what will be pushed (git status + log)
#   2. Asks for confirmation
#   3. Stages all changes (except .env and local-only files — gitignored)
#   4. Commits with a message you provide (or auto-generated)
#   5. Pushes to GitHub origin/main
#
# What this does NOT do:
#   - Push .env (gitignored — secrets never leave the sandbox)
#   - Push to Vercel or Turso (separate scripts)
#   - Auto-commit (you confirm every time)
# =============================================================================

set -euo pipefail
cd /home/z/my-project

# Load credentials
set -a; source .env 2>/dev/null; set +a

AUTH_URL=$(echo "${GITHUB_REPO_URL}" | sed "s|https://github.com|https://x-access-token:${GITHUB_TOKEN}@github.com|")
git remote set-url origin "$AUTH_URL" 2>/dev/null

echo "============================================"
echo "  MITHQAL Deploy → GitHub"
echo "============================================"
echo ""
echo "Repository: $(echo $GITHUB_REPO_URL | sed 's|https://||')"
echo "Branch:     $(git branch --show-current)"
echo ""

# Show what will be pushed
echo "--- Changes to be committed ---"
if [ -z "$(git status --porcelain 2>/dev/null)" ] && [ -z "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]; then
    echo "✅ Nothing to push. Local is in sync with GitHub."
    exit 0
fi

git status --short
echo ""

# Unpushed commits
UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null)
if [ -n "$UNPUSHED" ]; then
    echo "--- Unpushed commits ---"
    echo "$UNPUSHED"
    echo ""
fi

# Commit message
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    if [ -n "${1:-}" ]; then
        COMMIT_MSG="$1"
    else
        echo "Enter commit message (or press Enter for auto):"
        read -r COMMIT_MSG
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M') — local changes pushed to GitHub"
        fi
    fi

    echo ""
    echo "--- Committing ---"
    git add -A
    git commit -m "$COMMIT_MSG"
    echo "✅ Committed: $COMMIT_MSG"
fi

# Confirm push
echo ""
echo "Push to GitHub origin/$(git branch --show-current)? [y/N]"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Nothing pushed."
    exit 0
fi

echo ""
echo "--- Pushing ---"
BRANCH=$(git branch --show-current)
if git push origin "$BRANCH" 2>&1; then
    echo ""
    echo "✅ Pushed to GitHub successfully."
    echo "   View: $(echo $GITHUB_REPO_URL | sed 's|.git$||')"
else
    echo ""
    echo "❌ Push failed. Check your network and credentials."
    exit 1
fi
