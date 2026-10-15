#!/usr/bin/env bash
# Phase 3: Start server + screenshot all + verify flagship features
set -u
cd /home/z/my-project
mkdir -p screenshots/upgrade

echo "=== [1] Start fresh dev server ==="
pkill -9 -f "next-server" 2>/dev/null; pkill -9 -f "next dev" 2>/dev/null
sleep 2
rm -rf .next 2>/dev/null
setsid node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 60); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  [ "$CODE" = "200" ] && { echo "READY at $i s"; break; }
  sleep 1
done
echo "Server: HTTP $CODE, PID $SRV"

echo ""
echo "=== [2] Lint check ==="
bun run lint 2>&1 | tail -5

echo ""
echo "=== [3] API endpoint check ==="
for ep in v1/health v1/mtq-sigma v1/explain inngest; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/$ep" 2>/dev/null)
  echo "  /api/$ep -> $C"
done

echo ""
echo "=== [4] Desktop screenshots — all 9 dashboard tabs ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
TABS=(dashboard timeline evidence exceptions reconciliation replay corridor mtq-sigma settings)
for tab in "${TABS[@]}"; do
  agent-browser open "http://127.0.0.1:3000/$tab" --timeout 45000 >/dev/null 2>&1
  agent-browser wait --load networkidle --timeout 25000 >/dev/null 2>&1
  sleep 3
  TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
  agent-browser screenshot "screenshots/upgrade/$tab.png" >/dev/null 2>&1
  echo "  /$tab -> text-chars=$TXT"
done

echo ""
echo "=== [5] Flagship: AI Explainer on /exceptions ==="
agent-browser open "http://127.0.0.1:3000/exceptions" --timeout 45000 >/dev/null 2>&1
agent-browser wait --load networkidle --timeout 25000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/upgrade/exceptions-with-ai-buttons.png 2>&1 | tail -1
# Click the first AI explain button (Sparkles icon)
agent-browser eval "document.querySelector('button[aria-label*=AI i], button[aria-label*=explain i]')?.click()" 2>&1 | tail -1
sleep 2
agent-browser screenshot screenshots/upgrade/ai-explainer-loading.png 2>&1 | tail -1
sleep 8
agent-browser screenshot screenshots/upgrade/ai-explainer-result.png 2>&1 | tail -1
echo "AI explainer screenshots captured"

echo ""
echo "=== [6] Command Palette (⌘K) ==="
agent-browser open "http://127.0.0.1:3000/dashboard" --timeout 40000 >/dev/null 2>&1
sleep 2
# Press Cmd+K / Ctrl+K
agent-browser eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,bubbles:true}))" 2>&1 | tail -1
sleep 1
# Also try clicking the search trigger button
agent-browser eval "document.querySelector('button[aria-label*=search i], [role=combobox]')?.click()" 2>&1 | tail -1
sleep 2
agent-browser screenshot screenshots/upgrade/command-palette.png 2>&1 | tail -1
echo "Command palette captured"

echo ""
echo "=== [7] Theme toggle ==="
agent-browser open "http://127.0.0.1:3000/dashboard" --timeout 40000 >/dev/null 2>&1
sleep 2
agent-browser screenshot screenshots/upgrade/theme-dark.png 2>&1 | tail -1
# Click theme toggle
agent-browser eval "document.querySelector('button[aria-label*=theme i], button[aria-label*=toggle i]')?.click()" 2>&1 | tail -1
sleep 1
agent-browser screenshot screenshots/upgrade/theme-light.png 2>&1 | tail -1
echo "Theme toggle captured"

echo ""
echo "=== [8] Mobile (375x812) — topbar + nav + content ==="
agent-browser set viewport 375 812 2>&1 | tail -1
agent-browser open "http://127.0.0.1:3000/dashboard" --timeout 40000 >/dev/null 2>&1
agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/upgrade/mobile-dashboard.png 2>&1 | tail -1
MTXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "Mobile /dashboard text-chars=$MTXT"

echo ""
echo "=== [9] Home + landing ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
agent-browser open "http://127.0.0.1:3000/" --timeout 40000 >/dev/null 2>&1
sleep 3
agent-browser screenshot screenshots/upgrade/home.png 2>&1 | tail -1
HTXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "Home text-chars=$HTXT"

echo ""
echo "=== [10] Browser errors ==="
agent-browser errors 2>&1 | tail -5

echo ""
echo "=== DONE ==="
echo "Screenshots: $(ls screenshots/upgrade/*.png | wc -l)"
echo "Server alive: $(kill -0 $SRV 2>/dev/null && echo YES || echo NO)"
tail -5 dev.log