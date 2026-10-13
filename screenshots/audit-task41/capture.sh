#!/bin/bash
# Task 41-FULL-UI-AUDIT — capture all 11 routes
set -u
BASE="https://mithqal.vercel.app"
OUT="/home/z/my-project/screenshots/audit-task41"
mkdir -p "$OUT"

declare -A ROUTES=(
  [home]="/"
  [features]="/features"
  [ecosystem]="/ecosystem"
  [roadmap]="/roadmap"
  [about]="/about"
  [architecture]="/architecture"
  [evidence]="/evidence"
  [pilot]="/pilot"
  [legal]="/legal"
  [contact]="/contact"
  [404]="/this-page-does-not-exist"
)

ORDER="home features ecosystem roadmap about architecture evidence pilot legal contact 404"

agent-browser set viewport 1440 900 >/dev/null 2>&1

printf "%-14s %-8s %-10s %-10s %-8s %-8s %-8s %-8s %-8s %s\n" \
  "PAGE" "ERRORS" "HEIGHT" "HEADINGS" "CANVAS" "IMG" "LINKS" "FOOTER" "NAV" "SCREENSHOT"

for page in $ORDER; do
  url="$BASE${ROUTES[$page]}"
  agent-browser open "$url" >/dev/null 2>&1
  sleep 10
  errs=$(agent-browser errors 2>/dev/null | wc -l)
  metrics=$(agent-browser eval "
    JSON.stringify({
      h: document.body.scrollHeight,
      hd: document.querySelectorAll('h1,h2,h3').length,
      cv: document.querySelectorAll('canvas').length,
      im: document.querySelectorAll('img').length,
      a: document.querySelectorAll('a').length,
      ft: document.querySelector('footer') ? 'yes' : 'no',
      nv: document.querySelector('nav') ? 'yes' : 'no'
    })
  " 2>/dev/null | tail -1)
  h=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['h'])" 2>/dev/null)
  hd=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['hd'])" 2>/dev/null)
  cv=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['cv'])" 2>/dev/null)
  im=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['im'])" 2>/dev/null)
  a=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['a'])" 2>/dev/null)
  ft=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['ft'])" 2>/dev/null)
  nv=$(echo "$metrics" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['nv'])" 2>/dev/null)
  shot="$OUT/audit-${page}.png"
  agent-browser screenshot --full "$shot" >/dev/null 2>&1
  sz=$(stat -c%s "$shot" 2>/dev/null || echo 0)
  printf "%-14s %-8s %-10s %-10s %-8s %-8s %-8s %-8s %-8s %s\n" \
    "$page" "$errs" "$h" "$hd" "$cv" "$im" "$a" "$ft" "$nv" "$((sz/1024))KB"
done
