#!/bin/bash
# Re-gather DOM metrics with robust double-parse
set -u
BASE="https://mithqal.vercel.app"

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

printf "%-14s %-8s %-8s %-8s %-6s %-6s %-8s %-7s %-5s %s\n" \
  "PAGE" "ERRORS" "HEIGHT" "HEADS" "CANVAS" "IMG" "LINKS" "FOOTER" "NAV" "TITLE"

for page in $ORDER; do
  url="$BASE${ROUTES[$page]}"
  agent-browser open "$url" >/dev/null 2>&1
  sleep 9
  errs=$(agent-browser errors 2>/dev/null | grep -c "Error\|error\|warn" || echo 0)
  raw=$(agent-browser eval "JSON.stringify({h:document.body.scrollHeight,hd:document.querySelectorAll('h1,h2,h3').length,cv:document.querySelectorAll('canvas').length,im:document.querySelectorAll('img').length,a:document.querySelectorAll('a').length,ft:document.querySelector('footer')?'yes':'no',nv:document.querySelector('nav')?'yes':'no',t:document.title})" 2>/dev/null)
  parsed=$(python3 -c "
import json,sys
raw = '''$raw'''
# eval output is JSON-stringified JSON string; try parsing once to get inner
try:
    inner = json.loads(raw)
    if isinstance(inner, str):
        d = json.loads(inner)
    else:
        d = inner
    print(d.get('h','?'),'|',d.get('hd','?'),'|',d.get('cv','?'),'|',d.get('im','?'),'|',d.get('a','?'),'|',d.get('ft','?'),'|',d.get('nv','?'),'|',d.get('t','?'))
except Exception as e:
    print('PARSE_FAIL', raw[:120])
")
  h=$(echo "$parsed" | cut -d'|' -f1 | tr -d ' ')
  hd=$(echo "$parsed" | cut -d'|' -f2 | tr -d ' ')
  cv=$(echo "$parsed" | cut -d'|' -f3 | tr -d ' ')
  im=$(echo "$parsed" | cut -d'|' -f4 | tr -d ' ')
  a=$(echo "$parsed" | cut -d'|' -f5 | tr -d ' ')
  ft=$(echo "$parsed" | cut -d'|' -f6 | tr -d ' ')
  nv=$(echo "$parsed" | cut -d'|' -f7 | tr -d ' ')
  t=$(echo "$parsed" | cut -d'|' -f8- | sed 's/^ *//')
  printf "%-14s %-8s %-8s %-8s %-6s %-6s %-8s %-7s %-5s %s\n" "$page" "$errs" "$h" "$hd" "$cv" "$im" "$a" "$ft" "$nv" "$t"
done
