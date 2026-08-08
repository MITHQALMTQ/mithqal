#!/usr/bin/env bash
# Push every KEY=VALUE pair from .env to Vercel (production, preview, development).
# Re-running is safe: existing values are deleted first, then re-created.
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env"
TOKEN="${VERCEL_TOKEN:-$(grep -E '^VERCEL_TOKEN=' "$ENV_FILE" | cut -d= -f2-)}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN not found"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

if [ ! -f ".vercel/project.json" ]; then
  echo "ERROR: project not linked to Vercel. Run: vercel link"
  exit 1
fi

echo "=============================================="
echo "  Mithqal — Push .env to Vercel (all 3 envs)"
echo "=============================================="
echo ""

# Read .env, skip comments and blank lines
pushed=0
skipped=0
while IFS= read -r line || [ -n "$line" ]; do
  # Skip blank lines and comments
  case "$line" in
    ''|\#*) continue ;;
  esac

  key="${line%%=*}"
  value="${line#*=}"

  # Skip if key contains whitespace (malformed)
  if [[ "$key" =~ [[:space:]] ]]; then
    continue
  fi

  # Skip lines that have no value (empty)
  if [ -z "$value" ]; then
    echo "  ⊘  $key  (empty — skipped)"
    skipped=$((skipped+1))
    continue
  fi

  # Strip surrounding quotes if any (vercel env add handles raw values)
  if [[ "$value" =~ ^\"(.*)\"$ ]]; then
    value="${BASH_REMATCH[1]}"
  fi

  echo "  ▶  Pushing $key..."

  # Delete in all envs first (ignore errors if not present)
  for env in production preview development; do
    vercel env rm "$key" "$env" --token "$TOKEN" --yes >/dev/null 2>&1 || true
  done

  # Add to all 3 envs as sensitive (encrypted) — pipe value via stdin
  printf "%s" "$value" | vercel env add "$key" production   --token "$TOKEN" --sensitive </dev/stdin >/dev/null 2>&1 || true
  printf "%s" "$value" | vercel env add "$key" preview      --token "$TOKEN" --sensitive </dev/stdin >/dev/null 2>&1 || true
  printf "%s" "$value" | vercel env add "$key" development  --token "$TOKEN" --sensitive </dev/stdin >/dev/null 2>&1 || true

  pushed=$((pushed+1))
done < "$ENV_FILE"

echo ""
echo "=============================================="
echo "  Done: $pushed variables pushed, $skipped skipped"
echo "  Next: trigger a redeploy to apply them:"
echo "    vercel --prod --token \$VERCEL_TOKEN"
echo "=============================================="
