#!/usr/bin/env bash
# Mithqal bootstrap — run this ONCE after a full sandbox wipe to restore
# everything: the watchdog mini-service, the .env, the mithqal source, and
# both long-running services (mithqal dev + discord bot).
#
# Usage:  bash /home/sync/start-mithqal.sh
#
# After this runs, the watchdog (auto-started by the sandbox on every boot
# via /home/z/my-project/mini-services/*) keeps everything alive.
set -euo pipefail

SYNC_DIR=/home/sync
PROJECT_ROOT=/home/z/my-project
WATCHDOG_SRC="$SYNC_DIR/mithqal-watchdog"
WATCHDOG_DST="$PROJECT_ROOT/mini-services/mithqal-watchdog"
ENV_BACKUP="$SYNC_DIR/mithqal.env"
MITHQAL_DIR="$PROJECT_ROOT/mithqal"

echo "=== Mithqal bootstrap ==="
echo "  persistent backup : $SYNC_DIR"
echo "  project root      : $PROJECT_ROOT"

# 1. Restore the watchdog mini-service (so the sandbox auto-starts it next boot)
if [ -d "$WATCHDOG_SRC" ]; then
  mkdir -p "$PROJECT_ROOT/mini-services"
  if [ ! -d "$WATCHDOG_DST" ]; then
    cp -r "$WATCHDOG_SRC" "$WATCHDOG_DST"
    echo "restored watchdog mini-service to $WATCHDOG_DST"
  else
    echo "watchdog mini-service already present"
  fi
else
  echo "WARNING: $WATCHDOG_SRC not found - watchdog source not backed up. Recreate manually."
fi

# 2. Restore .env
if [ -f "$ENV_BACKUP" ]; then
  mkdir -p "$MITHQAL_DIR"
  cp "$ENV_BACKUP" "$MITHQAL_DIR/.env"
  echo "restored $MITHQAL_DIR/.env from $ENV_BACKUP"
else
  echo "FATAL: $ENV_BACKUP not found - cannot restore .env. Tokens are lost."
  exit 1
fi

# 3. Re-clone mithqal if missing
if [ ! -f "$MITHQAL_DIR/package.json" ]; then
  TOKEN=$(grep '^GITHUB_TOKEN=' "$ENV_BACKUP" | cut -d= -f2-)
  if [ -z "$TOKEN" ]; then
    echo "FATAL: GITHUB_TOKEN not in $ENV_BACKUP - cannot re-clone mithqal."
    exit 1
  fi
  echo "mithqal source missing - re-cloning..."
  git clone "https://x-access-token:${TOKEN}@github.com/MITHQALMTQ/mithqal.git" "$MITHQAL_DIR"
  git -C "$MITHQAL_DIR" remote set-url origin https://github.com/MITHQALMTQ/mithqal.git
  echo "re-cloned mithqal"
fi

# 4. Install deps
echo "=== installing mithqal deps (this may take a minute) ==="
( cd "$MITHQAL_DIR" && bun install )
if [ -f "$MITHQAL_DIR/mini-services/discord-bot/package.json" ]; then
  echo "=== installing discord-bot deps ==="
  ( cd "$MITHQAL_DIR/mini-services/discord-bot" && bun install )
fi

# 5. Start the watchdog in the foreground (it will start mithqal + bot)
echo "=== starting watchdog (foreground - Ctrl+C to stop) ==="
echo "    the watchdog will start mithqal dev (port 3000) + discord bot (port 3004)"
exec bun run "$WATCHDOG_DST/index.ts"
