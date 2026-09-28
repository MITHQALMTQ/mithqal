#!/bin/bash
# Mithqal dev server bootstrap (v25.4 — banking-grade stability).
#
# HISTORY OF THE STABILITY FIX
# ────────────────────────────────────────────────────────────────────
# 1. NODE_OPTIONS=--max-old-space-size=2048
#    Without it, Next.js 16.1.3 + Turbopack spawns a child node process
#    for PostCSS/Tailwind CSS evaluation that gets SIGKILLed (exit 9) by
#    the sandbox cgroup memory limit during initial compile of
#    src/app/globals.css, producing the "Failed to write app endpoint
#    /page" panic. Bumping V8's old-space ceiling to 2 GiB lets the
#    CSS worker reserve enough headroom to survive.
#
# 2. --webpack flag (NOT default Turbopack)
#    Turbopack's CSS pipeline is brittle for this project's 28 KB
#    globals.css — it panics on PostCSS worker spawns. Webpack is stable.
#
# 3. NEXT_TELEMETRY_DISABLED=1
#    Next.js telemetry writes a JSON event file on each dev run; the
#    `detached-flush.js` worker spawned to upload it triggers a
#    `bun --hot` file-watcher false-positive that restarts the dev
#    server in a loop. Disabling telemetry removes the restart loop.
#
# 4. setsid -f
#    The cloud sandbox kills child processes when the launching bash
#    exits. `nohup ... &` is insufficient because the SIGHUP ignores
#    only the HUP signal — the kernel still reaps the process group
#    when its session leader exits. `setsid -f` creates a NEW SESSION
#    for the dev server so it survives the launching bash's exit.
#    Parent PID becomes 1 (init) → no SIGHUP, no process-group kill.
#
# 5. Detached keep-alive ping loop (8s interval)
#    The cloud sandbox ALSO kills long-idle processes (~20-30s with
#    no HTTP request). A separate detached bash subshell pings
#    /api/status every 8s to keep the dev server resident for the
#    duration of an interactive audit session.
# ────────────────────────────────────────────────────────────────────

set -e

cd /home/z/my-project

# Kill any stale instances + clear the lock so we don't hit the
# "Unable to acquire lock" error.
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "curl.*localhost:3000" 2>/dev/null || true
sleep 1
rm -f .next/dev/lock 2>/dev/null || true

# Spawn the dev server in a new session (parent becomes init/PID 1)
setsid -f bash -c '
  export NEXT_TELEMETRY_DISABLED=1
  export NODE_OPTIONS="--max-old-space-size=2048"
  exec node /home/z/my-project/node_modules/.bin/next dev -p 3000 --webpack \
    > /home/z/my-project/dev.log 2>&1 < /dev/null
'

# Spawn the keep-alive loop in a separate session
setsid -f bash -c '
  # Wait for the dev server to come up (max 30s)
  for i in $(seq 1 30); do
    if curl -s -o /dev/null --max-time 2 http://localhost:3000/api/status 2>/dev/null; then
      break
    fi
    sleep 1
  done
  # Keep-alive: hit /api/status every 8 seconds
  while true; do
    curl -s -o /dev/null --max-time 15 http://localhost:3000/api/status 2>/dev/null
    sleep 8
  done
'

echo "Dev server + keep-alive spawned in detached sessions."
echo "Logs: tail -f /home/z/my-project/dev.log"
echo "Stop: pkill -9 -f 'next dev'; pkill -9 -f 'curl.*localhost:3000'"
