#!/usr/bin/env bash
# Tier 1 — Test 3 (Concurrent burst — 20 parallel requests per endpoint)
set -u
BASE="http://localhost:3000"
ENDPOINTS=(
  /api/status
  /api/health
  /api/brain
  /api/mtq-final-reserve
  /api/mtq-finality-before-mint
  /api/reserve-simulator
  /api/institutional-stress-tests
  /api/data-source-health
  /api/real-market-feeds
  /api/oracle
  /api/nav
  /api/governance
  /api/compliance
  /api/custody
  /api/transparency
  /api/proofs
  /api/reserve-verification
  /api/mtq-systemic-exposure-engine
  /api/mtq-protected-backing-cell
  /api/mtq-three-book-separation
  /api/mtq-licensing-entity-matrix
  /api/mtq-legal-liability-framework
  /api/sanctions-screening
  /api/contract
  /api/transactions
  /api/balance
  /api/inngest
)

printf "endpoint|conc_ok|conc_fail|conc_avg_s|conc_p95_s|conc_status_set\n"
for ep in "${ENDPOINTS[@]}"; do
  url="${BASE}${ep}"
  tmpf=$(mktemp)
  # 20 parallel curls with timing captured
  seq 1 20 | xargs -P 20 -I {} curl -s -o /dev/null -w "%{http_code}|%{time_total}\n" --max-time 60 "$url" > "$tmpf"
  ok=0; fail=0
  lats_sorted=$(awk -F'|' '{print $2}' "$tmpf" | sort -n)
  total=$(wc -l < "$tmpf")
  while IFS= read -r line; do
    code="${line%|*}"
    if [[ "$code" == "200" ]]; then ok=$((ok+1)); else fail=$((fail+1)); fi
  done < "$tmpf"
  # avg + p95
  n=$(echo "$lats_sorted" | wc -l)
  avg=$(awk -v lats_file="$tmpf" 'BEGIN{
    s=0; n=0;
    while((getline line < lats_file) > 0){ split(line,a,"|"); s+=a[2]; n++; }
    close(lats_file);
    printf "%.4f", s/n;
  }')
  # p95: pick element at index ceil(0.95 * n)
  idx=$(awk -v n="$n" 'BEGIN{printf "%d", int((0.95*n)+0.999)}')
  p95=$(echo "$lats_sorted" | sed -n "${idx}p")
  # status set
  set_codes=$(awk -F'|' '{print $1}' "$tmpf" | sort -u | tr '\n' ',' | sed 's/,$//')
  printf "%s|%s|%s|%s|%s|%s\n" "$ep" "$ok" "$fail" "$avg" "$p95" "$set_codes" | tee -a /tmp/stress-test.log
  rm -f "$tmpf"
done
