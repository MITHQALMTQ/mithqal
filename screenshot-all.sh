#!/usr/bin/env bash
# All-in-one: start server + capture all screenshots in same shell session.
set -u
cd /home/z/my-project
mkdir -p screenshots/verify

echo "=== [1] Kill stale next only (not all node) ==="
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "node_modules/.bin/next" 2>/dev/null
sleep 2

echo "=== [2] Start dev server ==="
setsid node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  [ "$CODE" = "200" ] && { echo "READY at $i"; break; }
  sleep 1
done
echo "Server HTTP=$CODE, alive=$(kill -0 $SRV 2>/dev/null && echo yes || echo no)"

echo "=== [3] Quick API check ==="
for ep in nav oracle status reserve-simulator mtq-finality-before-mint institutional-stress-tests; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/$ep" 2>/dev/null)
  echo "  /api/$ep -> $C"
done

echo "=== [4] Desktop viewport + hero ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
agent-browser open http://127.0.0.1:3000/ --timeout 60000 2>&1 | tail -1
agent-browser wait --load networkidle --timeout 30000 2>&1 | tail -1
sleep 4
agent-browser screenshot screenshots/verify/01-hero-desktop.png 2>&1 | tail -1
agent-browser get title 2>&1 | tail -1

echo "=== [5] 18 nav sections ==="
SECTIONS=(mtq-value identity hero reserve currency gold digital finality p1 status simulator corridor stress feeds legal-register sanctions observations visual-analytics)
LABELS=(MTQ-Value Identity Live-State Reserve-Architecture Currency-Engine Gold-Bullion Digital-Liquidity Finality-Gate P1-Frameworks Implementation-Status Reserve-Simulator Corridor-Simulator Stress-Tests Market-Feeds Legal-Register Sanctions Observations Visual-Analytics)
i=0
for sid in "${SECTIONS[@]}"; do
  i=$((i+1))
  agent-browser eval "document.getElementById('$sid')?.scrollIntoView({behavior:'instant',block:'start'})" >/dev/null 2>&1
  sleep 2
  agent-browser screenshot "screenshots/verify/$(printf '%02d' $i)-section-${LABELS[$((i-1))]}.png" 2>&1 | tail -1
  echo "  $sid done"
done

echo "=== [6] Full page ==="
agent-browser eval "window.scrollTo(0,0)" >/dev/null 2>&1
sleep 1
agent-browser screenshot --full screenshots/verify/00-full-page-desktop.png 2>&1 | tail -1

echo "=== [7] Sub-routes ==="
for sr in os status video demo api-docs institutional-engagement institutional-readiness; do
  agent-browser open "http://127.0.0.1:3000/$sr" --timeout 45000 2>&1 | tail -1
  agent-browser wait --load networkidle --timeout 20000 2>&1 | tail -1
  sleep 3
  agent-browser screenshot "screenshots/verify/sub-${sr}.png" 2>&1 | tail -1
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/$sr" 2>/dev/null)
  echo "  /$sr -> $CODE"
done

echo "=== [8] Legal sub-pages ==="
for sub in privacy terms cookies risk-disclosure; do
  agent-browser open "http://127.0.0.1:3000/legal/$sub" --timeout 40000 2>&1 | tail -1
  agent-browser wait --load networkidle --timeout 20000 2>&1 | tail -1
  sleep 2
  agent-browser screenshot "screenshots/verify/sub-Legal-${sub}.png" 2>&1 | tail -1
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/legal/$sub" 2>/dev/null)
  echo "  /legal/$sub -> $CODE"
done

echo "=== [9] Mobile hero + footer ==="
agent-browser set viewport 375 812 2>&1 | tail -1
agent-browser open http://127.0.0.1:3000/ --timeout 40000 2>&1 | tail -1
agent-browser wait --load networkidle --timeout 20000 2>&1 | tail -1
sleep 3
agent-browser screenshot screenshots/verify/mobile-hero.png 2>&1 | tail -1
agent-browser eval "window.scrollTo(0,document.body.scrollHeight)" >/dev/null 2>&1
sleep 2
agent-browser screenshot screenshots/verify/mobile-footer.png 2>&1 | tail -1

echo "=== [10] Desktop footer on /os ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
agent-browser open http://127.0.0.1:3000/os --timeout 40000 2>&1 | tail -1
agent-browser wait --load networkidle --timeout 20000 2>&1 | tail -1
sleep 3
agent-browser screenshot screenshots/verify/desktop-footer-shortpage.png 2>&1 | tail -1

echo "=== [11] 404 page ==="
agent-browser open "http://127.0.0.1:3000/nonexistent-xyz" --timeout 20000 2>&1 | tail -1
sleep 2
agent-browser screenshot screenshots/verify/404-not-found.png 2>&1 | tail -1

echo "=== [12] Browser errors check ==="
agent-browser errors 2>&1 | tail -10

echo "=== DONE ==="
echo "Total screenshots: $(ls screenshots/verify/*.png 2>/dev/null | wc -l)"
echo "Server alive: $(kill -0 $SRV 2>/dev/null && echo YES || echo NO)"
tail -8 dev.log
