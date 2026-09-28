#!/usr/bin/env bash
# Tier 1 — Test 1 (Baseline) + Test 2 (Sequential burst) for all GET endpoints
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

printf "endpoint|baseline_status|baseline_latency_s|seq_avg_s|seq_max_s|seq_status_consistency\n"
for ep in "${ENDPOINTS[@]}"; do
  url="${BASE}${ep}"
  b_out=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 60 "$url")
  b_status="${b_out%|*}"
  b_lat="${b_out#*|}"

  seq_lats=()
  seq_codes=()
  for i in $(seq 1 10); do
    out=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 60 "$url")
    seq_codes+=("${out%|*}")
    seq_lats+=("${out#*|}")
  done
  sum=0; max=0
  for l in "${seq_lats[@]}"; do
    sum=$(awk -v s="$sum" -v l="$l" 'BEGIN{printf "%.4f", s+l}')
    if awk -v m="$max" -v l="$l" 'BEGIN{exit !(l>m)}'; then max="$l"; fi
  done
  seq_avg=$(awk -v s="$sum" 'BEGIN{printf "%.4f", s/10}')
  first="${seq_codes[0]}"
  consistent="all=${first}"
  for c in "${seq_codes[@]}"; do
    if [[ "$c" != "$first" ]]; then consistent="MIXED"; break; fi
  done

  printf "%s|%s|%s|%s|%s|%s\n" "$ep" "$b_status" "$b_lat" "$seq_avg" "$max" "$consistent" | tee -a /tmp/stress-test.log
done
