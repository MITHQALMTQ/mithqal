#!/usr/bin/env bash
# Tier 2 — POST endpoint stress tests
# For each POST endpoint: valid request, missing fields, wrong types, oversized, malformed JSON, empty body, SQL/XSS
set -u
BASE="http://localhost:3000"

# Generate unique txHashes (32-byte hex) using openssl
gen_txhash() { printf "0x%s" "$(openssl rand -hex 32)"; }
gen_addr() { printf "0x%s" "$(openssl rand -hex 20)"; }

CAPTURE() {
  local label="$1"; shift
  local code=$(curl -s -o /tmp/_resp -w "%{http_code}" --max-time 60 "$@")
  local body=$(head -c 300 /tmp/_resp | tr -d '\n' | tr -d '\r')
  printf "  [%s] status=%s body=%s\n" "$label" "$code" "$body" | tee -a /tmp/stress-test.log
}

echo "=========================================="
echo "=== /api/mint (rate limit: 10/min) ==="
echo "=========================================="
# valid mint
VALID_TX=$(gen_txhash)
VALID_ADDR=$(gen_addr)
echo "Test 1: valid mint"
CAPTURE "valid" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":1000,\"currency\":\"USD\",\"toAddress\":\"${VALID_ADDR}\",\"txHash\":\"${VALID_TX}\",\"blockNumber\":12345}"

echo "Test 2: missing field (no amount)"
CAPTURE "missing amount" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{\"currency\":\"USD\",\"toAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 3: wrong type (amount as string)"
CAPTURE "amount string" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":\"not-a-number\",\"currency\":\"USD\",\"toAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 4: malformed JSON"
CAPTURE "malformed JSON" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{invalid json"

echo "Test 5: empty body"
CAPTURE "empty body" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d ""

echo "Test 6: SQL injection in currency field"
CAPTURE "SQL in currency" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":1000,\"currency\":\"'; DROP TABLE users;--\",\"toAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 7: XSS in toAddress"
CAPTURE "XSS in toAddress" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":1000,\"currency\":\"USD\",\"toAddress\":\"<script>alert(1)</script>\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 8: oversized payload (1MB body)"
BIG=$(head -c 1000000 /dev/zero | tr '\0' 'a')
CAPTURE "1MB body" \
  -X POST "${BASE}/api/mint" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":1000,\"currency\":\"USD\",\"toAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\",\"junk\":\"${BIG}\"}"

echo ""
echo "=========================================="
echo "=== /api/redeem (rate limit: 10/min) ==="
echo "=========================================="
VALID_TX=$(gen_txhash)
VALID_ADDR=$(gen_addr)
echo "Test 1: valid redeem"
CAPTURE "valid" \
  -X POST "${BASE}/api/redeem" \
  -H "Content-Type: application/json" \
  -d "{\"mtqAmount\":100,\"fromAddress\":\"${VALID_ADDR}\",\"txHash\":\"${VALID_TX}\",\"currency\":\"USD\"}"

echo "Test 2: missing field (no mtqAmount)"
CAPTURE "missing mtqAmount" \
  -X POST "${BASE}/api/redeem" \
  -H "Content-Type: application/json" \
  -d "{\"fromAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\",\"currency\":\"USD\"}"

echo "Test 3: negative mtqAmount"
CAPTURE "negative mtqAmount" \
  -X POST "${BASE}/api/redeem" \
  -H "Content-Type: application/json" \
  -d "{\"mtqAmount\":-100,\"fromAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\",\"currency\":\"USD\"}"

echo "Test 4: malformed JSON"
CAPTURE "malformed JSON" \
  -X POST "${BASE}/api/redeem" \
  -H "Content-Type: application/json" \
  -d "{invalid"

echo "Test 5: empty body"
CAPTURE "empty body" \
  -X POST "${BASE}/api/redeem" \
  -H "Content-Type: application/json" \
  -d ""

echo "Test 6: SQL injection in currency"
CAPTURE "SQL in currency" \
  -X POST "${BASE}/api/redeem" \
  -H "Content-Type: application/json" \
  -d "{\"mtqAmount\":100,\"fromAddress\":\"${VALID_ADDR}\",\"txHash\":\"$(gen_txhash)\",\"currency\":\"'; DROP TABLE users;--\"}"

echo ""
echo "=========================================="
echo "=== /api/transfer (rate limit: 20/min) ==="
echo "=========================================="
FROM_ADDR=$(gen_addr)
TO_ADDR=$(gen_addr)
echo "Test 1: valid transfer"
CAPTURE "valid" \
  -X POST "${BASE}/api/transfer" \
  -H "Content-Type: application/json" \
  -d "{\"fromAddress\":\"${FROM_ADDR}\",\"toAddress\":\"${TO_ADDR}\",\"amount\":\"1000000000000000000\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 2: same fromAddress and toAddress"
CAPTURE "same from/to" \
  -X POST "${BASE}/api/transfer" \
  -H "Content-Type: application/json" \
  -d "{\"fromAddress\":\"${FROM_ADDR}\",\"toAddress\":\"${FROM_ADDR}\",\"amount\":\"1000000000000000000\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 3: amount=0"
CAPTURE "amount zero" \
  -X POST "${BASE}/api/transfer" \
  -H "Content-Type: application/json" \
  -d "{\"fromAddress\":\"${FROM_ADDR}\",\"toAddress\":\"${TO_ADDR}\",\"amount\":\"0\",\"txHash\":\"$(gen_txhash)\"}"

echo "Test 4: malformed JSON"
CAPTURE "malformed JSON" \
  -X POST "${BASE}/api/transfer" \
  -H "Content-Type: application/json" \
  -d "{invalid"

echo "Test 5: empty body"
CAPTURE "empty body" \
  -X POST "${BASE}/api/transfer" \
  -H "Content-Type: application/json" \
  -d ""

echo "Test 6: XSS in fromAddress"
CAPTURE "XSS in from" \
  -X POST "${BASE}/api/transfer" \
  -H "Content-Type: application/json" \
  -d "{\"fromAddress\":\"<script>alert(1)</script>\",\"toAddress\":\"${TO_ADDR}\",\"amount\":\"1000000000000000000\",\"txHash\":\"$(gen_txhash)\"}"

echo ""
echo "=========================================="
echo "=== /api/formation-interest (rate limit: 5/HOUR) ==="
echo "=========================================="
# Only 5 requests per hour — pick carefully
echo "Test 1: valid submission"
CAPTURE "valid" \
  -X POST "${BASE}/api/formation-interest" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test User\",\"email\":\"test@example.com\",\"org\":\"Acme Corp\",\"role\":\"investor\",\"message\":\"Interest in formation\"}"

echo "Test 2: missing fullName"
CAPTURE "missing fullName" \
  -X POST "${BASE}/api/formation-interest" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test2@example.com\",\"role\":\"investor\"}"

echo "Test 3: invalid email"
CAPTURE "invalid email" \
  -X POST "${BASE}/api/formation-interest" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test User 2\",\"email\":\"not-an-email\",\"role\":\"investor\"}"

echo "Test 4: invalid role"
CAPTURE "invalid role" \
  -X POST "${BASE}/api/formation-interest" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test User 3\",\"email\":\"test3@example.com\",\"role\":\"admin\"}"

echo "Test 5: malformed JSON"
CAPTURE "malformed JSON" \
  -X POST "${BASE}/api/formation-interest" \
  -H "Content-Type: application/json" \
  -d "{invalid"

echo ""
echo "=========================================="
echo "=== /api/onchain-test (GET only — POST returns 405) ==="
echo "=========================================="
echo "Test 1: valid GET"
CAPTURE "GET" "${BASE}/api/onchain-test?network=monad"
echo "Test 2: POST (should 405)"
CAPTURE "POST 405 expected" -X POST "${BASE}/api/onchain-test"
echo "Test 3: unknown network"
CAPTURE "unknown network" "${BASE}/api/onchain-test?network=evilchain"
echo "Test 4: SQL injection in network"
CAPTURE "SQL in network" "${BASE}/api/onchain-test?network='; DROP TABLE chains;--"
echo "Test 5: XSS in network"
CAPTURE "XSS in network" "${BASE}/api/onchain-test?network=<script>alert(1)</script>"

echo ""
echo "=========================================="
echo "=== /api/rebalance/plan (POST — auth may be required) ==="
echo "=========================================="
echo "Test 1: valid POST (auth bypass in SIMULATION mode)"
CAPTURE "valid" \
  -X POST "${BASE}/api/rebalance/plan" \
  -H "Content-Type: application/json" \
  -d "{\"actions\":[]}"

echo "Test 2: malformed JSON"
CAPTURE "malformed JSON" \
  -X POST "${BASE}/api/rebalance/plan" \
  -H "Content-Type: application/json" \
  -d "{invalid"

echo "Test 3: empty body"
CAPTURE "empty body" \
  -X POST "${BASE}/api/rebalance/plan" \
  -H "Content-Type: application/json" \
  -d ""

echo "Test 4: GET (should 200 with list)"
CAPTURE "GET" "${BASE}/api/rebalance/plan"

echo "Test 5: SQL injection in actions field"
CAPTURE "SQL in actions" \
  -X POST "${BASE}/api/rebalance/plan" \
  -H "Content-Type: application/json" \
  -d "{\"actions\":[{\"assetClass\":\"'; DROP TABLE reserves;--\",\"action\":\"sell\",\"quantity\":1,\"unit\":\"oz\",\"reason\":\"test\"}]}"
