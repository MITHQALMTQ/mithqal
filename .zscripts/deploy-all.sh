#!/bin/bash
# =============================================================================
# MITHQAL Deploy → ALL (GitHub + Turso + Vercel)
# =============================================================================
# One-command controlled deploy to all three protected targets.
# Run this after you've tested locally and are ready to publish.
#
# Order: GitHub → Turso → Vercel
#   1. GitHub  — source of truth (code)
#   2. Turso   — database schema (if changed)
#   3. Vercel  — production deployment (last, so it deploys the synced code)
#
# Each step asks for confirmation. You can abort at any point.
# =============================================================================

set -euo pipefail
cd /home/z/my-project

echo "============================================"
echo "  MITHQAL Deploy → ALL TARGETS"
echo "  GitHub → Turso → Vercel"
echo "============================================"
echo ""
echo "This deploys your LOCAL changes to all three protected targets."
echo "Each step will ask for confirmation."
echo ""
echo "Have you tested your changes locally? [y/N]"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Test locally first, then deploy."
    exit 0
fi

echo ""
echo "========== Step 1/3: GitHub =========="
bash .zscripts/deploy-github.sh "$@" || { echo "GitHub deploy failed. Stopping."; exit 1; }

echo ""
echo "========== Step 2/3: Turso =========="
echo "Push schema to Turso? (only needed if prisma/schema.prisma changed) [y/N]"
read -r CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    bash .zscripts/deploy-turso.sh || { echo "Turso deploy failed. Stopping."; exit 1; }
else
    echo "⏭️  Skipping Turso (schema unchanged)."
fi

echo ""
echo "========== Step 3/3: Vercel =========="
echo "Deploy to Vercel production? [y/N]"
read -r CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    bash .zscripts/deploy-vercel.sh || { echo "Vercel deploy failed."; exit 1; }
else
    echo "⏭️  Skipping Vercel."
fi

echo ""
echo "============================================"
echo "  Deploy Complete"
echo "============================================"
echo "✅ GitHub: $(git remote get-url origin | sed 's|https://.*@||')"
echo "✅ Turso:  $TURSO_DATABASE_URL"
echo "✅ Vercel: ${VERCEL_PROJECT_URL:-https://mithqal-kpkqed3sr-tonsy.vercel.app}"
