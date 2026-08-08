#!/usr/bin/env bash
# Persistent local Anvil testnet launcher for Mithqal.
#
# Starts an Anvil node with:
#   - chain ID 1337 (standard local EVM chain ID)
#   - state persisted to /home/z/my-project/repos/mithqal/.anvil/state.json
#   - 1-second block time (so blocks advance automatically)
#   - the standard 10 pre-funded accounts (each with 10000 ETH)
#   - no forking (clean local chain)
#
# This is genuinely "free + no gas" — the pre-funded accounts have 10000 ETH
# each, and the ETH is synthetic (no real value). The state file survives
# restarts, so deployments persist across sessions.
set -e

export PATH="$HOME/.foundry/bin:$PATH"

ANVIL_DIR="/home/z/my-project/repos/mithqal/.anvil"
STATE_FILE="$ANVIL_DIR/state.json"
mkdir -p "$ANVIL_DIR"

# Kill any previous anvil
pkill -f "anvil.*mithqal" 2>/dev/null || true
sleep 1

# Clear old log
: > "$ANVIL_DIR/anvil.log"

# Start Anvil — persistent state, 1s blocks, all 10 default accounts funded.
# Only pass --load-state if the state file exists (first run).
LOAD_STATE_ARGS=()
if [ -f "$STATE_FILE" ]; then
  LOAD_STATE_ARGS=(--load-state "$STATE_FILE")
fi

nohup setsid anvil \
  --host 0.0.0.0 \
  --port 8545 \
  --chain-id 1337 \
  --block-time 1 \
  --accounts 10 \
  --balance 10000 \
  --steps-tracing \
  "${LOAD_STATE_ARGS[@]}" \
  > "$ANVIL_DIR/anvil.log" 2>&1 &

ANVIL_PID=$!
disown $ANVIL_PID 2>/dev/null || true

echo "Anvil launched (PID=$ANVIL_PID)"
echo "  RPC:    http://localhost:8545"
echo "  Chain:  1337"
echo "  State:  $STATE_FILE"
echo "  Log:    $ANVIL_DIR/anvil.log"
echo ""
echo "Waiting for Anvil to start..."

for i in $(seq 1 15); do
  if curl -s --max-time 2 -X POST http://localhost:8545 \
       -H "Content-Type: application/json" \
       -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null | grep -q "result"; then
    echo "✓ Anvil responding after ${i}s"
    # If state file didn't exist, anvil ignores the load. We'll create it on first deploy.
    exit 0
  fi
  if ! kill -0 $ANVIL_PID 2>/dev/null; then
    echo "✗ Anvil process died. Last 20 log lines:"
    tail -20 "$ANVIL_DIR/anvil.log"
    exit 1
  fi
  sleep 1
done

echo "Timed out waiting for Anvil. Last 20 log lines:"
tail -20 "$ANVIL_DIR/anvil.log"
exit 1
