#!/bin/bash
# =============================================================================
# MITHQAL Service Supervisor — starts all services with proper detachment
# =============================================================================
# The sandbox reaps background processes started by interactive shells.
# This script uses nohup + setsid + full FD redirection to truly detach
# processes so they survive after the launching shell exits.
# =============================================================================

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

# Load .env
set -a; source .env 2>/dev/null; set +a

# Kill any existing processes
pkill -f "next dev" 2>/dev/null
pkill -f "discord-bot" 2>/dev/null
pkill -f "notify-service" 2>/dev/null
pkill -f "mithqal-watchdog/index" 2>/dev/null
pkill -f "auto-push-watchdog" 2>/dev/null
sleep 2

echo "[$(date)] Starting MITHQAL services..."

# ── 1. Dev server (port 3000) ────────────────────────────────────────────────
export NODE_OPTIONS="--max-old-space-size=768"
nohup setsid npx next dev -p 3000 > dev.log 2>&1 < /dev/null &
echo $! > .zscripts/dev.pid
disown $! 2>/dev/null
echo "  Dev server: PID $(cat .zscripts/dev.pid) → port 3000"

# ── 2. Auto-push watchdog ───────────────────────────────────────────────────
nohup setsid bash .zscripts/auto-push-watchdog.sh > .zscripts/watchdog-start.log 2>&1 < /dev/null &
echo $! > .zscripts/watchdog.pid
disown $! 2>/dev/null
echo "  Watchdog: PID $(cat .zscripts/watchdog.pid)"

# ── 3. Discord bot (port 3004) ──────────────────────────────────────────────
cd mini-services/discord-bot
nohup setsid bun --hot index.ts > $PROJECT_DIR/.zscripts/discord-bot.log 2>&1 < /dev/null &
echo $! > $PROJECT_DIR/.zscripts/discord-bot.pid
disown $! 2>/dev/null
cd "$PROJECT_DIR"
echo "  Discord bot: PID $(cat .zscripts/discord-bot.pid) → port 3004"

# ── 4. Notify service (port 3003) ───────────────────────────────────────────
cd mini-services/notify-service
nohup setsid bun --hot index.ts > $PROJECT_DIR/.zscripts/notify-service.log 2>&1 < /dev/null &
echo $! > $PROJECT_DIR/.zscripts/notify-service.pid
disown $! 2>/dev/null
cd "$PROJECT_DIR"
echo "  Notify service: PID $(cat .zscripts/notify-service.pid) → port 3003"

echo ""
echo "[$(date)] All services started. Use 'bash .zscripts/status.sh' to check."
