#!/bin/bash
# Quick status check for all MITHQAL services
PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

echo "============================================"
echo "  MITHQAL Service Status — $(date '+%H:%M:%S')"
echo "============================================"

# Dev server
DEV_PID=$(cat .zscripts/dev.pid 2>/dev/null)
if [ -n "$DEV_PID" ] && kill -0 "$DEV_PID" 2>/dev/null; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  echo "✅ Dev Server   (port 3000, PID $DEV_PID) — HTTP $HTTP"
else
  echo "❌ Dev Server   (port 3000) — DOWN"
fi

# Discord bot
DISCORD_PID=$(cat .zscripts/discord-bot.pid 2>/dev/null)
if [ -n "$DISCORD_PID" ] && kill -0 "$DISCORD_PID" 2>/dev/null; then
  echo "✅ Discord Bot   (port 3004, PID $DISCORD_PID)"
else
  echo "❌ Discord Bot   (port 3004) — DOWN"
fi

# Notify service
NOTIFY_PID=$(cat .zscripts/notify-service.pid 2>/dev/null)
if [ -n "$NOTIFY_PID" ] && kill -0 "$NOTIFY_PID" 2>/dev/null; then
  echo "✅ Notify Service (port 3003, PID $NOTIFY_PID)"
else
  echo "❌ Notify Service (port 3003) — DOWN"
fi

# Watchdog
WATCHDOG_PID=$(cat .zscripts/watchdog.pid 2>/dev/null)
if [ -n "$WATCHDOG_PID" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
  echo "✅ Auto-Push Watchdog (PID $WATCHDOG_PID)"
else
  echo "❌ Auto-Push Watchdog — DOWN"
fi

# Turso check
NAV=$(curl -s http://localhost:3000/api/nav 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'NAV=\${d[\"navM\"]:.4f} RR={d[\"reserveRatio\"]:.2f}%')" 2>/dev/null)
if [ -n "$NAV" ]; then
  echo "✅ Turso DB      — $NAV"
else
  echo "⚠️  Turso DB      — no data (dev server may be down)"
fi

echo ""
echo "Memory: $(free -m | awk '/Mem/{printf "%dMB used / %dMB total", $3, $2}')"
