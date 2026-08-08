#!/usr/bin/env bash
# MITHQAL — Comprehensive backup + sync script
#
# Backs up: Turso DB, Anvil state, .env, repo (git bundle).
# Then syncs: GitHub push, Vercel deploy, env re-sync, Turso↔Vercel health check.
#
# Usage:
#   bash scripts/backup-and-sync.sh
#   bash scripts/backup-and-sync.sh --no-deploy    # skip Vercel deploy
#   bash/scripts/backup-and-sync.sh --no-push      # skip git push
set -e

REPO_ROOT="/home/z/my-project/repos/mithqal"
BACKUP_DIR="/home/z/my-project/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/mithqal-$TIMESTAMP"

NO_DEPLOY=false
NO_PUSH=false
for arg in "$@"; do
  case "$arg" in
    --no-deploy) NO_DEPLOY=true ;;
    --no-push) NO_PUSH=true ;;
  esac
done

mkdir -p "$BACKUP_PATH"
cd "$REPO_ROOT"

echo "=============================================="
echo "  MITHQAL — Backup & Sync"
echo "  Timestamp: $TIMESTAMP"
echo "  Backup:    $BACKUP_PATH"
echo "=============================================="
echo ""

# ---- 1. Turso DB backup ----
echo "▶ 1/8  Backing up Turso database..."
python3 "$REPO_ROOT/scripts/backup_turso.py" "$BACKUP_PATH/turso-backup.sql" 2>&1 | sed 's/^/  /' || echo "  ⚠️ Turso backup failed"
echo ""

# ---- 2. Anvil state backup ----
echo "▶ 2/8  Backing up Anvil state..."
if [ -f ".anvil/state.json" ]; then
  cp .anvil/state.json "$BACKUP_PATH/anvil-state.json"
  ANVIL_SIZE=$(wc -c < "$BACKUP_PATH/anvil-state.json")
  echo "  ✓ Anvil state: $BACKUP_PATH/anvil-state.json ($ANVIL_SIZE bytes)"
else
  echo "  ⚠️  .anvil/state.json not found — skipping"
fi
if [ -f ".anvil/anvil.log" ]; then
  cp .anvil/anvil.log "$BACKUP_PATH/anvil.log" 2>/dev/null || true
fi
echo ""

# ---- 3. .env backup ----
echo "▶ 3/8  Backing up .env..."
if [ -f ".env" ]; then
  cp .env "$BACKUP_PATH/.env"
  ENV_LINES=$(wc -l < "$BACKUP_PATH/.env")
  echo "  ✓ .env: $BACKUP_PATH/.env ($ENV_LINES lines)"
else
  echo "  ⚠️  .env not found"
fi
echo ""

# ---- 4. Repo backup (git bundle + worklog + addresses) ----
echo "▶ 4/8  Backing up repo state..."
git bundle create "$BACKUP_PATH/mithqal-git.bundle" --all 2>/dev/null && \
  echo "  ✓ Git bundle: $BACKUP_PATH/mithqal-git.bundle" || \
  echo "  ⚠️  Git bundle failed"

cp worklog.md "$BACKUP_PATH/worklog.md" 2>/dev/null && echo "  ✓ worklog.md" || true
cp monad-testnet-addresses.json "$BACKUP_PATH/" 2>/dev/null && echo "  ✓ monad-testnet-addresses.json" || true
cp arc-testnet-addresses.json "$BACKUP_PATH/" 2>/dev/null && echo "  ✓ arc-testnet-addresses.json" || true
cp local-testnet-addresses.json "$BACKUP_PATH/" 2>/dev/null && echo "  ✓ local-testnet-addresses.json" || true
cp .vercel/project.json "$BACKUP_PATH/vercel-project.json" 2>/dev/null && echo "  ✓ vercel-project.json" || true
echo ""

# ---- 5. Git status + commit count ----
echo "▶ 5/8  Repo status..."
git rev-parse HEAD > "$BACKUP_PATH/git-head.txt"
git log --oneline -20 > "$BACKUP_PATH/git-log-recent.txt"
echo "  ✓ HEAD: $(git rev-parse --short HEAD)"
echo "  ✓ Branch: $(git branch --show-current)"
echo "  ✓ Total commits: $(git rev-list --count HEAD)"
echo "  ✓ Uncommitted changes: $(git status --porcelain | wc -l) files"
echo ""

# ---- 6. Push to GitHub ----
if [ "$NO_PUSH" = true ]; then
  echo "▶ 6/8  Push to GitHub — SKIPPED (--no-push)"
else
  echo "▶ 6/8  Pushing to GitHub..."
  git push origin main 2>&1 | tail -5 | sed 's/^/  /'
  echo "  ✓ Pushed to GitHub"
fi
echo ""

# ---- 7. Deploy to Vercel ----
if [ "$NO_DEPLOY" = true ]; then
  echo "▶ 7/8  Vercel deploy — SKIPPED (--no-deploy)"
else
  echo "▶ 7/8  Deploying to Vercel production..."
  VERCEL_TOKEN=$(grep "^VERCEL_TOKEN=" .env | cut -d= -f2-)
  if [ -z "$VERCEL_TOKEN" ]; then
    echo "  ⚠️  VERCEL_TOKEN not set in .env — skipping deploy"
  else
    vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>&1 | tail -8 | sed 's/^/  /'
    echo "  ✓ Deployed to Vercel production"
  fi
fi
echo ""

# ---- 8. Verify Turso ↔ Vercel link ----
echo "▶ 8/8  Verifying Turso ↔ Vercel link..."
sleep 5  # let the deploy propagate
VERCEL_URL="https://mithqal.vercel.app"
HEALTH=$(curl -s --max-time 30 "$VERCEL_URL/api/health" 2>/dev/null)
if [ -z "$HEALTH" ]; then
  echo "  ⚠️  Vercel health check failed (no response)"
else
  STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null)
  DB_OK=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('checks',{}).get('db',{}).get('ok',False))" 2>/dev/null)
  RPC_OK=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('checks',{}).get('rpc',{}).get('ok',False))" 2>/dev/null)
  echo "  ✓ Vercel status: $STATUS"
  echo "  ✓ Turso DB link: $([ "$DB_OK" = "True" ] && echo "✓ connected" || echo "✗ disconnected")"
  echo "  ✓ Monad RPC:     $([ "$RPC_OK" = "True" ] && echo "✓ healthy" || echo "✗ unhealthy")"
fi
echo ""

# ---- Summary ----
echo "=============================================="
echo "  Backup & Sync Complete"
echo "=============================================="
echo "  Backup location: $BACKUP_PATH"
echo "  Files:"
ls -la "$BACKUP_PATH" 2>&1 | tail -20 | sed 's/^/    /'
echo ""
echo "  To restore Turso from backup:"
echo "    sqlite3 prisma/prisma.db < $BACKUP_PATH/turso-backup.sql"
echo "  To restore Anvil state:"
echo "    cp $BACKUP_PATH/anvil-state.json .anvil/state.json"
echo "  To restore git history:"
echo "    git clone $BACKUP_PATH/mithqal-git.bundle mithqal-restored"
echo "=============================================="
