#!/bin/bash
# =============================================================================
# MITHQAL Deploy → Vercel (production)
# =============================================================================
# Deploys the LOCAL codebase to Vercel production.
# Run this only after you've pushed to GitHub AND tested locally.
#
# What this does:
#   1. Confirms you've pushed to GitHub first (safety check)
#   2. Asks for confirmation
#   3. Deploys to Vercel using the Vercel CLI
#   4. Outputs the production URL
#
# Prerequisites:
#   - VERCEL_TOKEN set in .env
#   - vercel CLI installed (npm i -g vercel) OR use npx
# =============================================================================

set -euo pipefail
cd /home/z/my-project

set -a; source .env 2>/dev/null; set +a

echo "============================================"
echo "  MITHQAL Deploy → Vercel (production)"
echo "============================================"
echo ""
echo "Project URL: ${VERCEL_PROJECT_URL:-https://mithqal-kpkqed3sr-tonsy.vercel.app}"
echo ""

# Safety check: have you pushed to GitHub?
UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null || echo "")
if [ -n "$UNPUSHED" ]; then
    echo "⚠️  WARNING: You have unpushed commits on GitHub:"
    echo "$UNPUSHED"
    echo ""
    echo "Vercel deploys from your LOCAL files (not GitHub), but it's best practice"
    echo "to push to GitHub first so your repo and production stay in sync."
    echo ""
    echo "Continue with Vercel deploy anyway? [y/N]"
    read -r CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Run .zscripts/deploy-github.sh first."
        exit 0
    fi
fi

echo ""
echo "⚠️  This deploys the LOCAL codebase to PRODUCTION Vercel."
echo "   Production users will see the changes immediately."
echo ""
echo "Proceed with Vercel deploy? [y/N]"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Vercel unchanged."
    exit 0
fi

echo ""
echo "--- Deploying to Vercel ---"

# Set env vars for non-interactive Vercel CLI
export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

# Try vercel CLI, fall back to npx
if command -v vercel &>/dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel"
fi

# Deploy to production with token auth
if $VERCEL_CMD deploy --prod --token "$VERCEL_TOKEN" --yes 2>&1; then
    echo ""
    echo "✅ Deployed to Vercel production successfully."
    echo "   URL: ${VERCEL_PROJECT_URL:-https://mithqal-kpkqed3sr-tonsy.vercel.app}"
else
    echo ""
    echo "❌ Vercel deploy failed."
    echo "   Common issues:"
    echo "   - Need to run 'vercel link' first (or set VERCEL_PROJECT_ID)"
    echo "   - Token may be expired"
    echo "   - Build errors in code"
    exit 1
fi
