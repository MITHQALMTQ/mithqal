#!/usr/bin/env bash
# Tier 1 — Test 4 — Rate-limit verification on 4 designated routes
# Per IMPL-RECOMMENDATIONS: 30 req/min per IP. Run 35 rapid requests; verify 31-35 → 429.
set -u
BASE="http://localhost:3000"
ROUTES=(
  /api/mtq-final-reserve
  /api/mtq-finality-before-mint
  /api/reserve-simulator
  /api/institutional-stress-tests
)

printf "endpoint|req1_status|req30_status|req31_status|req35_status|429_count|non_429_after_30\n"
for ep in "${ROUTES[@]}"; do
  url="${BASE}${ep}"
  codes=()
  for i in $(seq 1 35); do
    out=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$url")
    codes+=("$out")
  done
  # count 429s overall
  count_429=0
  for c in "${codes[@]}"; do [[ "$c" == "429" ]] && count_429=$((count_429+1)); done
  # count non-429 among requests 31-35 (indices 30-34)
  non_429_after=0
  for idx in 30 31 32 33 34; do
    c="${codes[$idx]}"
    [[ "$c" != "429" ]] && non_429_after=$((non_429_after+1))
  done
  printf "%s|%s|%s|%s|%s|%s|%s\n" "$ep" "${codes[0]}" "${codes[29]}" "${codes[30]}" "${codes[34]}" "$count_429" "$non_429_after" | tee -a /tmp/stress-test.log
done
