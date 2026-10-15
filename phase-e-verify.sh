#!/usr/bin/env bash
# Phase E: Restart server + verify live data + cross-tab nav + commit + push
set -u
cd /home/z/my-project
mkdir -p screenshots/live

echo "=== [1] Start fresh dev server ==="
pkill -9 -f "next" 2>/dev/null
sleep 2
rm -rf .next 2>/dev/null
setsid node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 60); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  [ "$CODE" = "200" ] && { echo "READY at $i s"; break; }
  sleep 1
done
echo "Server: HTTP $CODE"

echo ""
echo "=== [2] Test all 7 live API routes ==="
for ep in cases events exceptions scenarios metrics results institutions health; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/v1/$ep" 2>/dev/null)
  BODY=$(curl -s "http://127.0.0.1:3000/api/v1/$ep" 2>/dev/null | head -c 80)
  echo "  /api/v1/$ep -> $C | $BODY"
done
# Also test /api/health
C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/health" 2>/dev/null)
echo "  /api/health -> $C"

echo ""
echo "=== [3] Test filtered API routes ==="
curl -s "http://127.0.0.1:3000/api/v1/cases?status=CLOSED" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'cases?status=CLOSED -> count={d.get(\"count\")}')" 2>&1
curl -s "http://127.0.0.1:3000/api/v1/events?caseId=VC-DEMO-2001" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'events?caseId=VC-DEMO-2001 -> count={d.get(\"count\")}')" 2>&1
curl -s "http://127.0.0.1:3000/api/v1/exceptions?severity=CRITICAL" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'exceptions?severity=CRITICAL -> count={d.get(\"count\")}')" 2>&1

echo ""
echo "=== [4] All 9 dashboard tabs — live data check ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
for tab in dashboard timeline evidence exceptions reconciliation replay corridor mtq-sigma settings; do
  agent-browser open "http://127.0.0.1:3000/$tab" --timeout 45000 >/dev/null 2>&1
  agent-browser wait --load networkidle --timeout 25000 >/dev/null 2>&1
  sleep 3
  TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
  C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/$tab" 2>/dev/null)
  echo "  /$tab -> HTTP $C | text=$TXT"
  agent-browser screenshot "screenshots/live/$tab.png" >/dev/null 2>&1
done

echo ""
echo "=== [5] Cross-tab navigation test ==="
# Navigate to /dashboard, click a case ID link, verify it goes to /timeline?caseId=
agent-browser open "http://127.0.0.1:3000/dashboard" --timeout 40000 >/dev/null 2>&1
agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/live/dashboard-before-click.png 2>&1 | tail -1
# Find and click a case ID link
agent-browser eval "document.querySelector('a[href*=\"/timeline?caseId=\"]')?.click()" 2>&1 | tail -1
sleep 3
URL=$(agent-browser get url 2>&1 | tail -1)
echo "After clicking case link, URL: $URL"
agent-browser screenshot screenshots/live/timeline-from-dashboard.png 2>&1 | tail -1

echo ""
echo "=== [6] Test filtered timeline (direct URL) ==="
agent-browser open "http://127.0.0.1:3000/timeline?caseId=VC-DEMO-2001" --timeout 40000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/live/timeline-filtered.png 2>&1 | tail -1
FTXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "Filtered timeline text=$FTXT"

echo ""
echo "=== [7] Test exceptions with filter ==="
agent-browser open "http://127.0.0.1:3000/exceptions?severity=CRITICAL" --timeout 40000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/live/exceptions-filtered.png 2>&1 | tail -1
ETXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "Filtered exceptions text=$ETXT"

echo ""
echo "=== [8] Browser errors ==="
agent-browser errors 2>&1 | tail -5

echo ""
echo "=== [9] Server alive + dev.log ==="
echo "Server alive: $(kill -0 $SRV 2>/dev/null && echo YES || echo NO)"
tail -8 dev.log | grep -iE "200|404|500|error" | head -8
echo ""
echo "=== DONE ==="
echo "Screenshots: $(ls screenshots/live/*.png | wc -l)"