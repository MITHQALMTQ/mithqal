#!/bin/bash
# =============================================================================
# MITHQAL Local Dev Helper — fast iteration without deploying
# =============================================================================
# Commands for local development. Use these while working on changes.
# Nothing here pushes to GitHub/Turso/Vercel — those are deploy-*.sh scripts.
# =============================================================================

cd /home/z/my-project

case "${1:-status}" in

  status)
    bash .zscripts/status.sh
    ;;

  start)
    # Start all local services
    bash .zscripts/start-all.sh
    ;;

  stop)
    # Stop all local services
    pkill -f "next dev" 2>/dev/null
    pkill -f "discord-bot" 2>/dev/null
    pkill -f "notify-service" 2>/dev/null
    pkill -f "mithqal-watchdog" 2>/dev/null
    echo "✅ All services stopped."
    ;;

  restart)
    bash .zscripts/dev.sh stop
    sleep 2
    bash .zscripts/dev.sh start
    ;;

  lint)
    # Check code quality (no deploy)
    echo "Running ESLint..."
    bun run lint 2>&1
    ;;

  log)
    # Tail dev server log
    tail -f dev.log
    ;;

  logs)
    # Tail all logs
    echo "=== Dev server (port 3000) ==="
    tail -5 dev.log
    echo ""
    echo "=== Discord bot (port 3004) ==="
    tail -5 .zscripts/discord-bot.log 2>/dev/null
    echo ""
    echo "=== Notify service (port 3003) ==="
    tail -5 .zscripts/notify-service.log 2>/dev/null
    ;;

  nav)
    # Quick check of NAV/RR from Turso
    curl -s http://localhost:3000/api/nav 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f'NAV:     \${d[\"navM\"]:.4f}')
    print(f'RR:      {d[\"reserveRatio\"]:.2f}%')
    print(f'Supply:  {d[\"supply\"]:,} MTQ')
    print(f'Gold:    \${d[\"goldUsd\"]:.2f}')
    print(f'Silver:  \${d[\"silverUsd\"]:.2f}')
except:
    print('Dev server not responding. Run: bash .zscripts/dev.sh start')
" 2>/dev/null
    ;;

  db)
    # Query Turso directly
    echo "Turso tables:"
    bun -e "
import { createClient } from '@libsql/client';
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const t = await c.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\");
for (const r of t.rows) console.log('  -', r.name);
" 2>&1 | grep -v "^\["
    ;;

  deploy)
    # Controlled deploy to all targets
    shift
    bash .zscripts/deploy-all.sh "$@"
    ;;

  deploy-github)
    shift
    bash .zscripts/deploy-github.sh "$@"
    ;;

  deploy-turso)
    bash .zscripts/deploy-turso.sh
    ;;

  deploy-vercel)
    bash .zscripts/deploy-vercel.sh
    ;;

  *)
    echo "MITHQAL Local Dev Helper"
    echo ""
    echo "Usage: bash .zscripts/dev.sh <command>"
    echo ""
    echo "Local development (no deploy):"
    echo "  status          Show all service status"
    echo "  start           Start all local services"
    echo "  stop            Stop all local services"
    echo "  restart         Restart all services"
    echo "  lint            Run ESLint"
    echo "  log             Tail dev server log"
    echo "  logs            Show recent logs from all services"
    echo "  nav             Show NAV/RR from Turso"
    echo "  db              List Turso tables"
    echo ""
    echo "Controlled deploys (protects GitHub/Turso/Vercel):"
    echo "  deploy          Deploy to ALL (GitHub → Turso → Vercel)"
    echo "  deploy-github   Push to GitHub only"
    echo "  deploy-turso    Push schema to Turso only"
    echo "  deploy-vercel   Deploy to Vercel production only"
    echo ""
    echo "Recovery (after sandbox restart):"
    echo "  bootstrap       bash .zscripts/bootstrap-recover.sh"
    ;;
esac
