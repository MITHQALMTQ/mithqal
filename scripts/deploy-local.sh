#!/usr/bin/env bash
# Deploy all 9 Mithqal Protocol Smart Contracts to a local Anvil testnet.
#
# Uses Anvil's first pre-funded account as deployer.
# Uses --constructor-args-path (workaround for forge 1.7.1's --constructor-args
# parser, which splits hex addresses into multiple tokens).
#
# After successful deployment: saves addresses + dumps Anvil state to disk.
set -e

export PATH="$HOME/.foundry/bin:$PATH"

REPO_ROOT="/home/z/my-project/repos/mithqal"
FOUNDRY_DIR="$REPO_ROOT/foundry"
ADDRESSES_FILE="$REPO_ROOT/local-testnet-addresses.json"
STATE_FILE="$REPO_ROOT/.anvil/state.json"
TMP_DIR="${TMPDIR:-/tmp}/mithqal-deploy"
mkdir -p "$TMP_DIR"

RPC_URL="http://localhost:8545"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Sanity checks
if ! curl -s --max-time 3 -X POST "$RPC_URL" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null | grep -q "result"; then
  echo "ERROR: Anvil is not running at $RPC_URL"
  echo "Start it with: bash scripts/start-anvil.sh"
  exit 1
fi

if [ ! -d "$FOUNDRY_DIR/lib/forge-std" ] || [ ! -d "$FOUNDRY_DIR/lib/openzeppelin-contracts" ]; then
  echo "ERROR: Foundry libs missing."
  exit 1
fi

echo "=============================================="
echo "  Mithqal — Local Anvil Testnet Deployment"
echo "=============================================="
echo "  RPC:        $RPC_URL"
echo "  Chain ID:   1337"
echo "  Deployer:   $DEPLOYER_ADDR"
echo ""

cd "$FOUNDRY_DIR"

# Deploy a contract and write the resulting address to a tmp file.
# Usage: deploy <path> <name> [arg1 arg2 ...]
deploy() {
  local contract_path="$1"
  local contract_name="$2"
  shift 2
  local args=("$@")
  local out_file="$TMP_DIR/${contract_name}.addr"
  local args_file="$TMP_DIR/${contract_name}.args"

  echo "▶ Deploying $contract_name..."

  # Write args to a file (space-separated, one line).
  # --constructor-args-path reads this and parses each token as one arg.
  # This works around forge 1.7.1's --constructor-args parser which
  # incorrectly splits hex addresses into multiple tokens.
  printf '%s\n' "${args[@]}" > "$args_file"

  local output
  output=$(forge create "$contract_path:$contract_name" \
    --constructor-args-path "$args_file" \
    --rpc-url "$RPC_URL" \
    --private-key "$DEPLOYER_KEY" \
    --broadcast 2>&1)

  local addr
  addr=$(echo "$output" | grep -oE "Deployed to: 0x[0-9a-fA-F]{40}" | head -1 | awk '{print $3}')

  if [ -z "$addr" ]; then
    echo "✗ Failed to deploy $contract_name"
    echo "$output" | tail -15
    return 1
  fi

  echo "$addr" > "$out_file"
  echo "  ✓ $contract_name → $addr"
}

# Deployment order — respects constructor dependencies.
# Args layout (one per line in the args file):
deploy "src/MTQ.sol"        "MTQ"
deploy "src/Reserve.sol"    "Reserve"
MTQ_ADDR=$(cat "$TMP_DIR/MTQ.addr")
deploy "src/Takaful.sol"    "Takaful"    "$MTQ_ADDR"
deploy "src/Oracle.sol"     "Oracle"
RESERVE_ADDR=$(cat "$TMP_DIR/Reserve.addr")
TAKAFUL_ADDR=$(cat "$TMP_DIR/Takaful.addr")
deploy "src/Mint.sol"       "Mint"       "$MTQ_ADDR" "$RESERVE_ADDR" "$TAKAFUL_ADDR"
deploy "src/Redeem.sol"     "Redeem"     "$MTQ_ADDR" "$RESERVE_ADDR" "$TAKAFUL_ADDR"
ORACLE_ADDR=$(cat "$TMP_DIR/Oracle.addr")
deploy "src/Algorithm.sol"  "Algorithm"  "$MTQ_ADDR" "$RESERVE_ADDR" "$ORACLE_ADDR"
# Governance takes an array of 7 initial council addresses (COUNCIL_SIZE=7).
# Use the first 7 Anvil pre-funded accounts.
COUNCIL="[0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0x70997970C51812dc3A010C7d01B50e0d17dc79C8,0x3C44CdDdB6a900FA2B585dd299e03d12FA4293BC,0x90F79bf6EB2C4f870365E785982E1f101E93b906,0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65,0x9965507D1a55bcC2695C58Ba16FB37d819b0A4dc,0x976EA74026E726554DB657fa54763abd0C3a0Aa9]"
deploy "src/Governance.sol" "Governance" "$COUNCIL"

# Read final addresses
MINT_ADDR=$(cat "$TMP_DIR/Mint.addr")
REDEEM_ADDR=$(cat "$TMP_DIR/Redeem.addr")
ALGORITHM_ADDR=$(cat "$TMP_DIR/Algorithm.addr")
GOVERNANCE_ADDR=$(cat "$TMP_DIR/Governance.addr")

# Safe Multi-Sig Treasury is a Gnosis Safe — on a local chain we use the
# deployer address as a placeholder "1-of-1 Safe" so the registry is complete.
SAFE_ADDR="$DEPLOYER_ADDR"

echo ""
echo "=============================================="
echo "  All 9 contracts deployed"
echo "=============================================="

# Save addresses to JSON
cat > "$ADDRESSES_FILE" <<EOF
{
  "MTQ": "$MTQ_ADDR",
  "Governance": "$GOVERNANCE_ADDR",
  "Safe": "$SAFE_ADDR",
  "Algorithm": "$ALGORITHM_ADDR",
  "Reserve": "$RESERVE_ADDR",
  "Mint": "$MINT_ADDR",
  "Redeem": "$REDEEM_ADDR",
  "Oracle": "$ORACLE_ADDR",
  "Takaful": "$TAKAFUL_ADDR"
}
EOF

echo ""
echo "Addresses saved to: $ADDRESSES_FILE"
cat "$ADDRESSES_FILE"

# Dump Anvil state to disk (persists across restarts)
echo ""
echo "Dumping Anvil state to $STATE_FILE..."
curl -s --max-time 10 -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_dumpState","params":[],"id":1}' \
  | python3 -c "import sys, json; r=json.load(sys.stdin); open('$STATE_FILE','w').write(json.dumps(r['result']))" 2>&1

STATE_SIZE=$(wc -c < "$STATE_FILE" 2>/dev/null || echo 0)
echo "✓ State saved ($STATE_SIZE bytes)"
echo ""
echo "Done. Local testnet is ready."
