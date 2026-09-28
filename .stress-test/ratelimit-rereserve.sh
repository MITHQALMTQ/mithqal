#!/usr/bin/env bash
# Focused rate-limit test on /api/reserve-simulator with timing + headers
set -u
URL="http://localhost:3000/api/reserve-simulator"
echo "=== 35 sequential requests to /api/reserve-simulator with timestamps ==="
START=$(date +%s.%N)
for i in $(seq 1 35); do
  now=$(date +%H:%M:%S.%N | cut -c1-12)
  out=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 60 "$URL")
  printf "req %02d | %s | %s\n" "$i" "$now" "$out"
done
END=$(date +%s.%N)
ELAPSED=$(awk -v s="$START" -v e="$END" 'BEGIN{printf "%.2f", e-s}')
echo "=== total wall-clock: ${ELAPSED}s ==="

echo ""
echo "=== headers check — capture X-RateLimit-* headers on req 1, 31 ==="
curl -s -D /tmp/headers-1.txt -o /dev/null --max-time 60 "$URL"
echo "--- req 1 headers (rate-limit relevant) ---"
grep -i -E 'ratelimit|retry-after|http' /tmp/headers-1.txt | head -10
