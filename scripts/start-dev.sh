#!/usr/bin/env bash
# Persistent launcher for Mithqal dev server.
# Uses setsid + nohup + disown to fully detach from the parent shell,
# and NODE_OPTIONS to bound memory so the compile doesn't OOM on 4GB boxes.
set -e

cd /home/z/my-project/repos/mithqal

# Kill any previous dev server
pkill -f "next dev" 2>/dev/null || true
sleep 1

# Clear old log
: > dev.log

# Launch with bounded memory + detached session
NODE_OPTIONS="--max-old-space-size=2048" \
  nohup setsid \
    /usr/bin/node \
    /home/z/my-project/repos/mithqal/node_modules/.bin/next \
    dev -p 3000 \
    > /home/z/my-project/repos/mithqal/dev.log 2>&1 &

DEV_PID=$!
disown $DEV_PID 2>/dev/null || true

echo "Dev server launched (PID=$DEV_PID)"
echo "Log: /home/z/my-project/repos/mithqal/dev.log"
echo "URL: http://localhost:3000"
echo ""
echo "Waiting up to 60s for server to become responsive..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null; then
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/)
    echo "✓ Server responding (HTTP $CODE) after ${i}s"
    exit 0
  fi
  # Check if process died
  if ! kill -0 $DEV_PID 2>/dev/null; then
    echo "✗ Process died after ${i}s. Last 30 log lines:"
    tail -30 /home/z/my-project/repos/mithqal/dev.log
    exit 1
  fi
  sleep 1
done

echo "Timed out after 60s. Last 30 log lines:"
tail -30 /home/z/my-project/repos/mithqal/dev.log
exit 1
