#!/usr/bin/env bash
# Definitive sequential test: 50 rapid sequential requests, no parallelism
set -u
URL="http://localhost:3000/api/reserve-simulator"
echo "=== 50 sequential requests (with request timing in ms) ==="
codes_seen=""
for i in $(seq 1 50); do
  out=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$URL")
  codes_seen="${codes_seen}${out} "
  if [[ "$out" != "200" ]]; then
    echo "req $i: $out (non-200!)"
  fi
done
echo ""
echo "=== Code counts ==="
echo "$codes_seen" | tr ' ' '\n' | sort | uniq -c
