#!/usr/bin/env bash
# Verify rate limit on all 4 designated routes after dev server restart
set -u
BASE="http://localhost:3000"
ROUTES=(
  /api/mtq-final-reserve
  /api/mtq-finality-before-mint
  /api/reserve-simulator
  /api/institutional-stress-tests
)

printf "endpoint|code_counts (35 parallel P 10)|429_count\n"
for ep in "${ROUTES[@]}"; do
  url="${BASE}${ep}"
  results=$(seq 1 35 | xargs -P 10 -I {} curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "$url" | sort | uniq -c | tr '\n' ';' )
  count_429=$(seq 1 35 | xargs -P 10 -I {} curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "$url" | grep -c 429 || echo "0")
  printf "%s|%s|%s\n" "$ep" "$results" "$count_429" | tee -a /tmp/stress-test.log
  sleep 65  # wait for window to reset
done
