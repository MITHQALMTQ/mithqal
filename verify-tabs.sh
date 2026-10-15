#!/usr/bin/env bash
# Start server + screenshot all 9 dashboard tabs + verify content
set -u
cd /home/z/my-project
mkdir -p screenshots/verify/tabs

echo "=== [1] Start dev server ==="
pkill -9 -f "next-server" 2>/dev/null; pkill -9 -f "next dev" 2>/dev/null
sleep 2
rm -rf .next 2>/dev/null
setsid node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 50); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  [ "$CODE" = "200" ] && { echo "READY at $i"; break; }
  sleep 1
done
echo "Server: HTTP $CODE"

echo ""
echo "=== [2] Verify all 9 dashboard tabs render with content ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
TABS=(dashboard timeline evidence exceptions reconciliation replay corridor mtq-sigma settings)
for tab in "${TABS[@]}"; do
  agent-browser open "http://127.0.0.1:3000/$tab" --timeout 45000 2>&1 | tail -1
  agent-browser wait --load networkidle --timeout 25000 2>&1 | tail -1
  sleep 3
  TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/$tab" 2>/dev/null)
  echo "  /$tab -> HTTP $CODE | visible-text-chars=$TXT"
  agent-browser screenshot "screenshots/verify/tabs/$tab.png" 2>&1 | tail -1
done

echo ""
echo "=== [3] Browser errors ==="
agent-browser errors 2>&1 | tail -5

echo ""
echo "=== [4] dev.log tail ==="
tail -8 dev.log
echo ""
echo "=== Server alive: $(kill -0 $SRV 2>/dev/null && echo YES || echo NO) ==="
