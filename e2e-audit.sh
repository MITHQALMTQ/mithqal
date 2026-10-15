#!/usr/bin/env bash
# Combined: start server + full E2E audit in same session
set -u
cd /home/z/my-project
mkdir -p screenshots/audit

echo "=== [0] Start dev server ==="
pkill -9 -f "next-server" 2>/dev/null; pkill -9 -f "next dev" 2>/dev/null
sleep 2
rm -rf .next 2>/dev/null
setsid node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 50); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  [ "$CODE" = "200" ] && { echo "READY at $i s"; break; }
  sleep 1
done
echo "Server: HTTP $CODE, PID $SRV"

echo ""
echo "=== [1] E2E Browser Audit — all screens ==="
agent-browser set viewport 1440 900 2>&1 | tail -1

ROUTES=(
  "/:Home"
  "/dashboard:Dashboard"
  "/timeline:Timeline"
  "/evidence:Evidence"
  "/exceptions:Exceptions"
  "/reconciliation:Reconciliation"
  "/replay:Replay"
  "/corridor:Corridor"
  "/mtq-sigma:MTQ-Sigma"
  "/settings:Settings"
  "/os:OS"
  "/status:Status"
  "/video:Video"
  "/demo:Demo"
  "/api-docs:ApiDocs"
  "/institutional-engagement:InstEngagement"
  "/institutional-readiness:InstReadiness"
  "/legal/privacy:Legal-Privacy"
  "/legal/terms:Legal-Terms"
  "/legal/cookies:Legal-Cookies"
  "/legal/risk-disclosure:Legal-RiskDisclosure"
)

printf "%-32s | %-5s | %-10s | %-8s\n" "ROUTE" "HTTP" "TEXT-CHARS" "TIME-ms"
echo "-----------------------------------------------------------"

for entry in "${ROUTES[@]}"; do
  path="${entry%%:*}"
  label="${entry##*:}"
  START=$(date +%s%N)
  agent-browser open "http://127.0.0.1:3000$path" --timeout 40000 >/dev/null 2>&1
  agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
  sleep 2
  END=$(date +%s%N)
  ELAPSED=$(( (END - START) / 1000000 ))
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000$path" 2>/dev/null)
  TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
  agent-browser screenshot "screenshots/audit/${label}.png" >/dev/null 2>&1
  printf "%-32s | %-5s | %-10s | %-8s\n" "$path" "$CODE" "$TXT" "$ELAPSED"
done

echo ""
echo "=== [2] Mobile audit (375x812) — nav + content ==="
agent-browser set viewport 375 812 2>&1 | tail -1
agent-browser open "http://127.0.0.1:3000/dashboard" --timeout 40000 >/dev/null 2>&1
agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/audit/mobile-dashboard.png 2>&1 | tail -1
SIDEBAR=$(agent-browser eval "document.querySelector('nav[aria-label=Sidebar]') ? getComputedStyle(document.querySelector('nav[aria-label=Sidebar]')).display : 'NOT FOUND'" 2>&1 | tail -1)
MTXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "Mobile /dashboard: sidebar=$SIDEBAR, text-chars=$MTXT"

echo ""
echo "=== [3] Broken fetch detection — /status and /os ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
agent-browser open "http://127.0.0.1:3000/status" --timeout 40000 >/dev/null 2>&1
sleep 4
agent-browser screenshot screenshots/audit/status-broken-fetch.png 2>&1 | tail -1
STXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "/status text-chars=$STXT (likely shows loading/error from broken /api/health fetch)"

echo ""
echo "=== [4] API endpoint audit ==="
for ep in v1/health v1/mtq-sigma inngest nav oracle status reserve-simulator mtq-os corridor; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/$ep" 2>/dev/null)
  printf "  /api/%-20s -> %s\n" "$ep" "$C"
done

echo ""
echo "=== [5] Server alive check ==="
echo "PID $SRV alive: $(kill -0 $SRV 2>/dev/null && echo YES || echo NO)"
tail -5 dev.log
