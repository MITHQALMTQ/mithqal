#!/bin/bash
# Audit helper for a single view: open, capture, inspect, return structured summary
# Usage: ./audit-view.sh <view_id> <screenshot_path>
set -u
VIEW="$1"
SHOT="$2"
URL="http://localhost:3000/?view=${VIEW}"

echo "===VIEW:${VIEW}==="
agent-browser console --clear >/dev/null 2>&1
agent-browser errors --clear >/dev/null 2>&1
agent-browser open "${URL}" --timeout 30000 2>&1 | tail -2
sleep 4
agent-browser wait --load networkidle --timeout 20000 2>&1 | tail -1
echo "---URL---"
agent-browser get url 2>&1 | tail -1
echo "---TITLE---"
agent-browser get title 2>&1 | tail -1
echo "---SHOT---"
agent-browser screenshot "${SHOT}" --full 2>&1 | tail -1
echo "---ERRORS---"
agent-browser errors 2>&1 | head -20
echo "---CONSOLE---"
agent-browser console 2>&1 | head -30
echo "---COUNTS---"
for s in "h1" "h2" "h3" "button" "a" "footer" "main" "table" "img" "form" "input"; do
  c=$(agent-browser get count "$s" 2>&1 | tail -1)
  echo "${s}: ${c}"
done
echo "---SPINNERS---"
agent-browser eval "Array.from(document.querySelectorAll('[class*=animate-spin]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0 && r.height>0}).length" 2>&1 | tail -1
echo "---TODO---"
agent-browser eval "(document.body.innerText.match(/TODO|FIXME|placeholder text|coming soon|lorem ipsum|not yet implemented|TBD/gi)||[]).slice(0,5).join(' | ')" 2>&1 | tail -1
echo "---BROKEN-IMGS---"
agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.naturalWidth===0 && !i.src.includes('svg')).length" 2>&1 | tail -1
echo "---BODY-LEN---"
agent-browser eval "document.body.innerText.length" 2>&1 | tail -1
echo "---BODY-HEAD---"
agent-browser eval "document.body.innerText.slice(0,1500)" 2>&1 | tail -40
echo "===END:${VIEW}==="
