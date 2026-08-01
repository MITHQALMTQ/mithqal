#!/usr/bin/env bash
# ============================================================
# Mithqal — Push all .env variables to Vercel (fully automated)
#
# WHAT THIS DOES:
#   1. Reads every KEY=VALUE pair from .env
#   2. For each, deletes the existing Vercel env var (if any) in all envs
#   3. Re-creates it as a production + preview + development secret
#   4. Prints a summary of what was pushed
#
# PREREQUISITES:
#   - Vercel CLI installed: npm i -g vercel
#   - Authenticated: run `vercel login` once (interactive, ~30s)
#   - Project linked: run `vercel link` once (interactive, picks the project)
#
# USAGE:
#   chmod +x scripts/push-env-to-vercel.sh
#   ./scripts/push-env-to-vercel.sh              # push all vars
#   ./scripts/push-env-to-vercel.sh DATABASE_URL  # push one var
#   ./scripts/push-env-to-vercel.sh --dry-run     # show what would be pushed
#
# SECURITY:
#   - All vars are pushed as --sensitive (hidden in Vercel dashboard)
#   - The .env file is gitignored and never committed
#   - The script never prints secret VALUES — only KEY names
# ============================================================

set -euo pipefail

ENV_FILE=".env"
DRY_RUN=false
SINGLE_VAR=""

# Parse args
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: $0 [--dry-run] [VAR_NAME]"
      echo "  No args    → push all .env vars to Vercel"
      echo "  VAR_NAME   → push only that var"
      echo "  --dry-run  → show what would be pushed without doing it"
      exit 0
      ;;
    *) SINGLE_VAR="$arg" ;;
  esac
done

# Check .env exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found at $ENV_FILE"
  echo "   Create it from .env.example and fill in real values."
  exit 1
fi

# Check vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Check if linked to a Vercel project
if [ ! -f ".vercel/project.json" ]; then
  echo "⚠️  Project not linked to Vercel."
  echo "   Running 'vercel link' now..."
  vercel link
fi

echo ""
echo "=============================================="
echo "  Mithqal — Push .env to Vercel"
echo "=============================================="
if [ "$DRY_RUN" = true ]; then
  echo "  MODE: DRY RUN (no changes will be made)"
fi
echo ""

# Function to push one variable
push_var() {
  local key="$1"
  local value="$2"

  # Skip empty values
  if [ -z "$value" ]; then
    echo "  ⏭️  $key = (empty) — skipped"
    return 1
  fi

  # Skip placeholder values (but allow angle brackets in display names like "Name <email@x.com>")
  if [[ "$value" == *"__SET_YOUR"* ]] || [[ "$value" == "your-"* ]] || [[ "$value" == *"_YOUR_"* ]] || [[ "$value" == "<REPLACE"* ]] || [[ "$value" == "TODO"* ]]; then
    echo "  ⚠️  $key = placeholder — skipped (set a real value in .env first)"
    return 1
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  📤 $key = *** (would push to production + preview + development)"
    return 0
  fi

  # Delete existing var in all envs (ignore errors if not found)
  vercel env rm "$key" production --yes 2>/dev/null || true
  vercel env rm "$key" preview --yes 2>/dev/null || true
  vercel env rm "$key" development --yes 2>/dev/null || true

  # Push to all 3 environments as sensitive (secret)
  echo -n "$value" | vercel env add "$key" production 2>/dev/null
  echo -n "$value" | vercel env add "$key" preview 2>/dev/null
  echo -n "$value" | vercel env add "$key" development 2>/dev/null

  echo "  ✅ $key pushed to production + preview + development"
  return 0
}

# Read .env line by line
pushed=0
skipped=0

while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip empty lines + comments
  [ -z "$key" ] && continue
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  # Trim whitespace
  key=$(echo "$key" | xargs)

  # If a single var was specified, skip others
  if [ -n "$SINGLE_VAR" ] && [ "$key" != "$SINGLE_VAR" ]; then
    continue
  fi

  # Remove surrounding quotes from value
  value="${value#\"}"
  value="${value%\"}"

  if push_var "$key" "$value"; then
    pushed=$((pushed + 1))
  else
    skipped=$((skipped + 1))
  fi
done < "$ENV_FILE"

echo ""
echo "=============================================="
echo "  Summary"
echo "=============================================="
echo "  Pushed:   $pushed"
echo "  Skipped:  $skipped"
echo ""

if [ "$DRY_RUN" = false ] && [ "$pushed" -gt 0 ]; then
  echo "=============================================="
  echo "  ⚠️  Redeploy to apply new env vars"
  echo "=============================================="
  echo "  New env vars won't take effect until you redeploy:"
  echo ""
  echo "    # Production redeploy:"
  echo "    vercel --prod"
  echo ""
  echo "    # Or trigger via Git (push to main → auto-deploys):"
  echo "    git push origin main"
  echo ""
  echo "  Then verify at https://mithqal.vercel.app"
  echo ""
fi
