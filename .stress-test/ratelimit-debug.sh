#!/usr/bin/env bash
# Diagnose whether /api/reserve-simulator rate-limit code is actually running
set -u
BASE="http://localhost:3000"

echo "=== curl with verbose headers — single request to /api/reserve-simulator ==="
curl -s -i -o /tmp/rsv-resp.txt --max-time 60 "${BASE}/api/reserve-simulator"
echo "--- response headers (first 15) ---"
head -15 /tmp/rsv-resp.txt
echo ""
echo "=== Compare with /api/mtq-final-reserve (which DOES rate-limit) ==="
curl -s -i -o /tmp/mfr-resp.txt --max-time 60 "${BASE}/api/mtq-final-reserve"
head -15 /tmp/mfr-resp.txt
echo ""
echo "=== Rapid-fire test: 35 parallel requests (xargs -P 5) on /api/reserve-simulator ==="
seq 1 35 | xargs -P 5 -I {} curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "${BASE}/api/reserve-simulator" | sort | uniq -c
