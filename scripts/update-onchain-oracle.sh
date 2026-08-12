#!/bin/bash
# update-onchain-oracle.sh — keep the on-chain Oracle fresh with live prices.
#
# The Oracle.sol contract has MAX_STALENESS = 1 hour. This script updates
# gold + silver prices every 30 minutes (well within the freshness window).
#
# Run as background daemon:
#   nohup bash scripts/update-onchain-oracle.sh > scripts/oracle-updater.log 2>&1 &
#
# Requires: foundry (cast) at ~/.foundry/bin/cast, Arc Network RPC reachable.

cd /home/z/my-project
export PATH="$HOME/.foundry/bin:$PATH"

RPC="https://rpc.testnet.arc.io"
ORACLE="0xbcA4c5Cc6eB49aa059Aaa2e4b8A905bAF130c4f7"
KEY="0xdbe17f8db187557b779a1a5c9b80f0eab4661938dc68e7c7eef7d63ddb7862d6"
INTERVAL="${1:-1800}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Oracle updater started (interval: ${INTERVAL}s)"

while true; do
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Fetch live prices (free API, no key)
  GOLD_USD=$(curl -s -m 10 https://api.gold-api.com/price/XAU 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('price',0))" 2>/dev/null || echo "0")
  SILVER_USD=$(curl -s -m 10 https://api.gold-api.com/price/XAG 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('price',0))" 2>/dev/null || echo "0")

  if [ "$GOLD_USD" = "0" ] || [ "$SILVER_USD" = "0" ]; then
    echo "[$TS] WARN: price fetch failed (gold=$GOLD_USD silver=$SILVER_USD) — retrying next cycle"
    sleep "$INTERVAL"
    continue
  fi

  GOLD_WEI=$(python3 -c "print(int(round($GOLD_USD * 1e8)))")
  SILVER_WEI=$(python3 -c "print(int(round($SILVER_USD * 1e8)))")

  # Send transactions (cast send returns JSON with status field)
  cast send --rpc-url "$RPC" --private-key "$KEY" "$ORACLE" "setGoldPrice(uint256)" "$GOLD_WEI" > /dev/null 2>&1
  GOLD_STATUS=$?
  cast send --rpc-url "$RPC" --private-key "$KEY" "$ORACLE" "setSilverPrice(uint256)" "$SILVER_WEI" > /dev/null 2>&1
  SILVER_STATUS=$?

  if [ "$GOLD_STATUS" -eq 0 ] && [ "$SILVER_STATUS" -eq 0 ]; then
    echo "[$TS] OK: gold=\$${GOLD_USD} silver=\$${SILVER_USD} — on-chain Oracle updated"
  else
    echo "[$TS] ERROR: tx failed (gold_status=$GOLD_STATUS silver_status=$SILVER_STATUS)"
  fi

  sleep "$INTERVAL"
done
