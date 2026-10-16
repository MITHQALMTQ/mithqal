#!/usr/bin/env bash
# Comprehensive end-to-end audit: all routes, all tabs, all screens
set -u
cd /home/z/my-project
mkdir -p screenshots/audit-final

echo "=== [1] List ALL routes (blueprint alignment check) ==="
echo "--- All page.tsx files ---"
find src/app -name "page.tsx" | sort
echo ""
echo "--- Total pages ---"
find src/app -name "page.tsx" | wc -l
echo ""
echo "--- All API v1 routes ---"
find src/app/api/v1 -name "route.ts" | sort
echo ""
echo "--- Total API v1 routes ---"
find src/app/api/v1 -name "route.ts" | wc -l

echo ""
echo "=== [2] Start dev server ==="
pkill -9 -f "next" 2>/dev/null; sleep 2
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
echo "=== [3] Test ALL pages (local dev) ==="
PAGES=("" dashboard timeline evidence exceptions reconciliation replay corridor mtq-sigma settings os status video demo api-docs institutional-engagement institutional-readiness legal/privacy legal/terms legal/cookies legal/risk-disclosure)
printf "%-35s | %-5s | %-10s\n" "PAGE" "HTTP" "TEXT-CHARS"
echo "-----------------------------------------------------------"
for page in "${PAGES[@]}"; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/$page" 2>/dev/null)
  TXT=$(curl -s "http://127.0.0.1:3000/$page" 2>/dev/null | sed 's/<[^>]*>//g' | tr -s ' \n\t' ' ' | wc -c)
  printf "%-35s | %-5s | %-10s\n" "/$page" "$C" "$TXT"
done

echo ""
echo "=== [4] Test ALL API v1 routes ==="
for ep in cases events exceptions scenarios metrics results institutions health ai/status explain; do
  if [ "$ep" = "explain" ]; then
    C=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:3000/api/v1/$ep" -H "Content-Type: application/json" -d '{"exceptionId":"E1","code":"X","severity":"HIGH"}' 2>/dev/null)
  else
    C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/v1/$ep" 2>/dev/null)
  fi
  printf "  /api/v1/%-20s -> %s\n" "$ep" "$C"
done

echo ""
echo "=== [5] Browser: screenshot all 9 dashboard tabs + test cross-tab nav ==="
agent-browser set viewport 1440 900 2>&1 | tail -1
TABS=(dashboard timeline evidence exceptions reconciliation replay corridor mtq-sigma settings)
for tab in "${TABS[@]}"; do
  agent-browser open "http://127.0.0.1:3000/$tab" --timeout 40000 >/dev/null 2>&1
  agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
  sleep 2
  TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
  agent-browser screenshot "screenshots/audit-final/$tab.png" >/dev/null 2>&1
  echo "  /$tab -> text=$TXT"
done

echo ""
echo "=== [6] Cross-tab navigation tests ==="
# Test 1: dashboard → click case → timeline?caseId=
agent-browser open "http://127.0.0.1:3000/dashboard" --timeout 40000 >/dev/null 2>&1
agent-browser wait --load networkidle --timeout 20000 >/dev/null 2>&1
sleep 3
LINKS=$(agent-browser eval "document.querySelectorAll('a[href*=\"?caseId=\"]').length" 2>&1 | tail -1)
echo "  /dashboard has $LINKS cross-tab case links"
if [ "$LINKS" != "0" ]; then
  agent-browser eval "document.querySelector('a[href*=\"?caseId=\"]')?.click()" 2>&1 | tail -1
  sleep 2
  URL=$(agent-browser get url 2>&1 | tail -1)
  echo "  After click -> $URL"
fi

# Test 2: timeline filtered by caseId
agent-browser open "http://127.0.0.1:3000/timeline?caseId=VC-DEMO-2001" --timeout 40000 >/dev/null 2>&1
sleep 2
TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "  /timeline?caseId=VC-DEMO-2001 -> text=$TXT (filtered)"

# Test 3: exceptions filtered by severity
agent-browser open "http://127.0.0.1:3000/exceptions?severity=CRITICAL" --timeout 40000 >/dev/null 2>&1
sleep 2
TXT=$(agent-browser eval "document.body.innerText.length" 2>&1 | tail -1)
echo "  /exceptions?severity=CRITICAL -> text=$TXT (filtered)"

echo ""
echo "=== [7] Test live Vercel site ==="
for page in "" dashboard timeline exceptions corridor; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "https://mithqal.vercel.app/$page" 2>/dev/null)
  echo "  https://mithqal.vercel.app/$page -> HTTP $C"
done
echo "  Live AI status: $(curl -s -o /dev/null -w '%{http_code}' https://mithqal.vercel.app/api/v1/ai/status 2>/dev/null)"
echo "  Live /api/v1/cases: $(curl -s -o /dev/null -w '%{http_code}' https://mithqal.vercel.app/api/v1/cases 2>/dev/null)"

echo ""
echo "=== [8] Browser errors ==="
agent-browser errors 2>&1 | tail -5

echo ""
echo "=== [9] Lint ==="
bun run lint 2>&1 | tail -3

echo ""
echo "=== DONE ==="
echo "Server alive: $(kill -0 $SRV 2>/dev/null && echo YES || echo NO)"
echo "Screenshots: $(ls screenshots/audit-final/*.png | wc -l)"
tail -5 dev.log