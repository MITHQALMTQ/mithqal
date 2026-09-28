#!/usr/bin/env bash
# Tier 1 — Tests 5, 6, 7 (malformed inputs, HTTP methods, header injection)
set -u
BASE="http://localhost:3000"
ENDPOINTS=(
  /api/status /api/health /api/brain /api/mtq-final-reserve /api/mtq-finality-before-mint
  /api/reserve-simulator /api/institutional-stress-tests /api/data-source-health /api/real-market-feeds
  /api/oracle /api/nav /api/governance /api/compliance /api/custody /api/transparency /api/proofs
  /api/reserve-verification /api/mtq-systemic-exposure-engine /api/mtq-protected-backing-cell
  /api/mtq-three-book-separation /api/mtq-licensing-entity-matrix /api/mtq-legal-liability-framework
  /api/sanctions-screening /api/contract /api/transactions /api/balance /api/inngest
)

LONGQS=$(python3 -c "print('a=' + 'x'*10000)")
SQLINJ="?id=%27%20OR%20%271%27%3D%271"
XSSQS="?name=%3Cscript%3Ealert(1)%3C/script%3E"

printf "endpoint|empty_qs|invalid_params|long_qs|sql_inj|xss|POST|DELETE|PUT|HEAD|OPTIONS|Host_evil\n"
for ep in "${ENDPOINTS[@]}"; do
  url="${BASE}${ep}"
  # Test 5: Malformed inputs (GET with various query strings)
  empty_qs=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}?" )
  invalid_params=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}?foo=bar&baz=qux")
  long_qs=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}?${LONGQS}")
  sql_inj=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}${SQLINJ}")
  xss=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}${XSSQS}")

  # Test 6: HTTP method verification
  post=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X POST "$url")
  delete=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X DELETE "$url")
  put=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X PUT "$url")
  head=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -I "$url")
  options=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X OPTIONS "$url")

  # Test 7: Header injection (Host: evil.com)
  host_evil=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -H "Host: evil.com" "$url")

  printf "%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s\n" \
    "$ep" "$empty_qs" "$invalid_params" "$long_qs" "$sql_inj" "$xss" \
    "$post" "$delete" "$put" "$head" "$options" "$host_evil" | tee -a /tmp/stress-test.log
done
