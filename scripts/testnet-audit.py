#!/usr/bin/env python3
"""
MITHQAL v24.2.1 — Comprehensive Testnet Audit
================================================
Honest verification of all 3 testnets:
  1. Monad Testnet (chain 10143) — 9 contracts
  2. Arc Network Testnet (chain 5042002) — 9 contracts
  3. Solana Devnet — MTQ SPL token

For each EVM network:
  - RPC reachability (eth_blockNumber)
  - Chain ID verification (eth_chainId)
  - Contract deployment (eth_getCode for all 9 contracts)
  - On-chain reads (MTQ name/symbol/decimals/supply, Oracle goldPrice/silverPrice)
  - 15-test suite: PASS/FAIL per test

For Solana:
  - RPC reachability (getHealth)
  - Token existence (getAccountInfo for mint)
  - Supply read

HONEST: no test forced to pass. Failures reported transparently.
"""
import json
import sys
import urllib.request
import time
from datetime import datetime, timezone

# ============================================================
# Configuration
# ============================================================

MONAD_RPC = "https://testnet-rpc.monad.xyz"
MONAD_CHAIN_ID = 10143
MONAD_CONTRACTS = {
    "MTQ": "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD",
    "Governance": "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66",
    "Safe": "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0",
    "Algorithm": "0x8839ce50e8D414005518769999c0A5b961D00CB2",
    "Reserve": "0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177",
    "Mint": "0x197e9CB28216dfe18a199b4c2930F74C2F460809",
    "Redeem": "0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4",
    "Oracle": "0xDfcA66ac0450C9AB86307af1942E157C5A4DB713",
    "Takaful": "0x3eC27BB283644eF0A98B9961E9FBED0583a02f19",
}

ARC_RPC = "https://rpc.testnet.arc.io"
ARC_CHAIN_ID = 5042002
ARC_CONTRACTS = {
    "MTQ": "0x237c3Aa2B79248f86f6523D3890095BCd1996601",
    "Governance": "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66",
    "Safe": "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0",
    "Algorithm": "0x62f8E5243f32eE5C87a14A7896C61104aD9e7727",
    "Reserve": "0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471",
    "Mint": "0x0dd8b4F8DA7fB6E3eE04ea9F24f853647F84c3aa",
    "Redeem": "0xcAde4594177829597882555Ff57d0e34092daF8e",
    "Oracle": "0xbcA4c5Cc6eB49aa059Aaa2e4b8A905bAF130c4f7",
    "Takaful": "0xA3B89FfdE28577A7D30E2c22503dB33509044EF0",
}

SOLANA_RPC = "https://api.devnet.solana.com"
SOLANA_MINT = "GAGRdrY6jcRTmD7A9KzvXA5sGMpNAkkRXwDoXBrEjxS4"

# ERC-20 function selectors (first 4 bytes of keccak256)
SELECTORS = {
    "name": "0x06fdde03",
    "symbol": "0x95d89b41",
    "decimals": "0x313ce567",
    "totalSupply": "0x18160ddd",
    "balanceOf": "0x70a08231",  # + 32-byte address
    "goldPrice": "0x44501404",
    "silverPrice": "0xeb423aa7",
}

TIMEOUT = 15

# ============================================================
# JSON-RPC helpers
# ============================================================

def rpc_call(rpc_url, method, params=None, id=1):
    payload = json.dumps({"jsonrpc": "2.0", "method": method, "params": params or [], "id": id}).encode()
    req = urllib.request.Request(rpc_url, data=payload, headers={
        "Content-Type": "application/json",
        "User-Agent": "MithqalAudit/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}

def eth_call(rpc_url, to, data):
    """eth_call with from=0x0, to=contract, data=selector."""
    payload = {
        "from": "0x0000000000000000000000000000000000000000",
        "to": to,
        "data": data,
    }
    return rpc_call(rpc_url, "eth_call", [payload, "latest"])

def decode_hex_string(hex_str):
    """Decode a hex string returned by eth_call (strip 0x prefix)."""
    if not hex_str or hex_str == "0x":
        return None
    return hex_str[2:] if hex_str.startswith("0x") else hex_str

def hex_to_int(hex_str):
    """Convert hex string to int."""
    s = decode_hex_string(hex_str)
    if not s:
        return None
    try:
        return int(s, 16)
    except ValueError:
        return None

def decode_string_param(hex_str):
    """Decode a Solidity string return (offset(32) + length(32) + data)."""
    s = decode_hex_string(hex_str)
    if not s or len(s) < 128:
        return None
    try:
        # offset at 0, length at 64, data at 128
        length = int(s[64:128], 16)
        data_hex = s[128:128 + length * 2]
        return bytes.fromhex(data_hex).decode("utf-8", errors="replace")
    except Exception:
        return None

def hex_addr_to_checksum(hex_str):
    """Just return the lowercase address from a 32-byte return."""
    s = decode_hex_string(hex_str)
    if not s or len(s) < 64:
        return None
    # Address is in the last 40 hex chars (20 bytes) of the 32-byte word
    addr_hex = s[24:64]
    return "0x" + addr_hex

# ============================================================
# Test runner
# ============================================================

class TestNet:
    def __init__(self, name, rpc, chain_id, contracts):
        self.name = name
        self.rpc = rpc
        self.chain_id = chain_id
        self.contracts = contracts
        self.results = []
        self.block_number = None

    def check(self, test_name, condition, detail=""):
        status = "PASS" if condition else "FAIL"
        self.results.append({"test": test_name, "status": status, "detail": detail})
        flag = "✓" if condition else "✗"
        print(f"  [{flag}] {test_name}")
        if not condition and detail:
            print(f"        → {detail}")
        return condition

    def run(self):
        print(f"\n{'='*70}")
        print(f"  {self.name}")
        print(f"  RPC: {self.rpc}")
        print(f"  Expected Chain ID: {self.chain_id}")
        print(f"{'='*70}")

        # Test 1: RPC reachability
        resp = rpc_call(self.rpc, "eth_blockNumber")
        if "result" in resp:
            self.block_number = int(resp["result"], 16)
            self.check("RPC reachability (eth_blockNumber)", True, f"block={resp['result']}")
        else:
            self.check("RPC reachability (eth_blockNumber)", False, str(resp.get("error", "unknown")))
            return self.results

        # Test 2: Chain ID
        resp = rpc_call(self.rpc, "eth_chainId")
        if "result" in resp:
            actual_chain = int(resp["result"], 16)
            self.check(f"Chain ID = {self.chain_id}", actual_chain == self.chain_id,
                       f"actual={actual_chain}")

        # Tests 3-11: Contract deployments (eth_getCode)
        deployed = {}
        for name, addr in self.contracts.items():
            resp = rpc_call(self.rpc, "eth_getCode", [addr, "latest"])
            if "result" in resp:
                code = resp["result"]
                # "0x" means no code (empty)
                code_len = len(code) - 2 if code.startswith("0x") else 0
                ok = code_len > 2  # at least 1 byte
                deployed[name] = ok
                self.check(f"Contract deployed: {name} ({addr[:10]}...)", ok,
                           f"bytecode={code_len} bytes" if ok else "NO CODE — contract not deployed")
            else:
                deployed[name] = False
                self.check(f"Contract deployed: {name} ({addr[:10]}...)", False,
                           str(resp.get("error", "unknown")))

        # Test 12: MTQ name
        if deployed.get("MTQ"):
            resp = eth_call(self.rpc, self.contracts["MTQ"], SELECTORS["name"])
            name = decode_string_param(resp.get("result", ""))
            self.check("MTQ.name() returns string", name is not None, f"name='{name}'")
        else:
            self.check("MTQ.name() returns string", False, "MTQ not deployed")

        # Test 13: MTQ symbol
        if deployed.get("MTQ"):
            resp = eth_call(self.rpc, self.contracts["MTQ"], SELECTORS["symbol"])
            symbol = decode_string_param(resp.get("result", ""))
            self.check("MTQ.symbol() returns string", symbol is not None, f"symbol='{symbol}'")
        else:
            self.check("MTQ.symbol() returns string", False, "MTQ not deployed")

        # Test 14: MTQ decimals
        if deployed.get("MTQ"):
            resp = eth_call(self.rpc, self.contracts["MTQ"], SELECTORS["decimals"])
            decimals = hex_to_int(resp.get("result", ""))
            self.check("MTQ.decimals() = 18", decimals == 18, f"decimals={decimals}")
        else:
            self.check("MTQ.decimals() = 18", False, "MTQ not deployed")

        # Test 15: MTQ totalSupply > 0
        if deployed.get("MTQ"):
            resp = eth_call(self.rpc, self.contracts["MTQ"], SELECTORS["totalSupply"])
            supply_raw = hex_to_int(resp.get("result", ""))
            if supply_raw is not None:
                supply = supply_raw / 1e18  # assuming 18 decimals
                self.check("MTQ.totalSupply() > 0", supply > 0, f"supply={supply:.2f} MTQ")
            else:
                self.check("MTQ.totalSupply() > 0", False, "no return data")
        else:
            self.check("MTQ.totalSupply() > 0", False, "MTQ not deployed")

        # Bonus: Oracle goldPrice / silverPrice (if Oracle deployed)
        if deployed.get("Oracle"):
            resp = eth_call(self.rpc, self.contracts["Oracle"], SELECTORS["goldPrice"])
            gold = hex_to_int(resp.get("result", ""))
            if gold is not None:
                # Oracle stores price as USD * 1e8 typically, but try raw
                gold_usd = gold / 1e8 if gold > 1e6 else gold
                self.check("Oracle.goldPrice() > 0", gold > 0,
                           f"gold=${gold_usd:.2f}/oz (raw={gold})")
            else:
                self.check("Oracle.goldPrice() > 0", False,
                           "Oracle bytecode may not match source (no return data)")
        else:
            self.check("Oracle.goldPrice() > 0", False, "Oracle not deployed")

        if deployed.get("Oracle"):
            resp = eth_call(self.rpc, self.contracts["Oracle"], SELECTORS["silverPrice"])
            silver = hex_to_int(resp.get("result", ""))
            if silver is not None:
                silver_usd = silver / 1e8 if silver > 1e4 else silver
                self.check("Oracle.silverPrice() > 0", silver > 0,
                           f"silver=${silver_usd:.2f}/oz (raw={silver})")
            else:
                self.check("Oracle.silverPrice() > 0", False, "no return data")
        else:
            self.check("Oracle.silverPrice() > 0", False, "Oracle not deployed")

        return self.results

def run_solana_audit():
    """Audit Solana Devnet."""
    print(f"\n{'='*70}")
    print(f"  Solana Devnet (non-EVM)")
    print(f"  RPC: {SOLANA_RPC}")
    print(f"  MTQ Mint: {SOLANA_MINT}")
    print(f"{'='*70}")

    results = []

    def check(test_name, condition, detail=""):
        status = "PASS" if condition else "FAIL"
        results.append({"test": test_name, "status": status, "detail": detail})
        flag = "✓" if condition else "✗"
        print(f"  [{flag}] {test_name}")
        if not condition and detail:
            print(f"        → {detail}")
        return condition

    # Test 1: RPC health
    resp = rpc_call(SOLANA_RPC, "getHealth")
    healthy = resp.get("result") == "ok"
    check("Solana getHealth = ok", healthy, str(resp.get("result", resp.get("error"))))

    # Test 2: Recent block (slot)
    resp = rpc_call(SOLANA_RPC, "getSlot")
    if "result" in resp:
        slot = resp["result"]
        check("getSlot returns a slot", isinstance(slot, int) and slot > 0, f"slot={slot}")
    else:
        check("getSlot returns a slot", False, str(resp.get("error")))

    # Test 3: MTQ token account exists
    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getAccountInfo",
        "params": [SOLANA_MINT, {"encoding": "jsonParsed"}],
    }).encode()
    req = urllib.request.Request(SOLANA_RPC, data=payload, headers={
        "Content-Type": "application/json",
        "User-Agent": "MithqalAudit/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            resp = json.loads(r.read().decode())
        info = resp.get("result", {}).get("value", {})
        if info and isinstance(info, dict):
            data = info.get("data", {})
            if isinstance(data, dict) and "parsed" in data:
                parsed = data["parsed"]
                mint_info = parsed.get("info", {})
                supply_raw = int(mint_info.get("supply", "0"))
                decimals = int(mint_info.get("decimals", 0))
                supply = supply_raw / (10 ** decimals) if decimals else supply_raw
                check("MTQ SPL token exists (getAccountInfo)", True,
                      f"supply={supply:.2f} MTQ, decimals={decimals}")
                check("MTQ supply > 0", supply > 0, f"supply={supply:.2f} MTQ")
                check("MTQ decimals = 18", decimals == 18, f"decimals={decimals}")
            else:
                check("MTQ SPL token exists (getAccountInfo)", False, "account exists but no parsed data")
        else:
            check("MTQ SPL token exists (getAccountInfo)", False, "account not found (may be closed)")
    except Exception as e:
        check("MTQ SPL token exists (getAccountInfo)", False, str(e))

    return results

# ============================================================
# Main
# ============================================================

def main():
    print(f"MITHQAL v24.2.1 — Comprehensive Testnet Audit")
    print(f"Date: {datetime.now(timezone.utc).isoformat()}")
    print(f"HONEST: no test forced to pass. Failures reported transparently.")

    all_results = {}

    # EVM networks
    monad = TestNet("Monad Testnet (Chain ID: 10143)", MONAD_RPC, MONAD_CHAIN_ID, MONAD_CONTRACTS)
    all_results["monad"] = monad.run()

    arc = TestNet("Arc Network Testnet (Chain ID: 5042002)", ARC_RPC, ARC_CHAIN_ID, ARC_CONTRACTS)
    all_results["arc"] = arc.run()

    # Solana
    all_results["solana"] = run_solana_audit()

    # Summary
    print(f"\n{'='*70}")
    print("AUDIT SUMMARY")
    print(f"{'='*70}")
    total = 0
    passed = 0
    failed = 0
    for net, results in all_results.items():
        net_total = len(results)
        net_pass = sum(1 for r in results if r["status"] == "PASS")
        net_fail = net_total - net_pass
        total += net_total
        passed += net_pass
        failed += net_fail
        print(f"  {net:12} : {net_pass:2}/{net_total:2} PASS  ({net_fail} FAIL)")
    print(f"  {'TOTAL':12} : {passed:2}/{total:2} PASS  ({failed} FAIL)")
    print(f"\nHonest result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")

    # Save JSON
    output = {
        "date": datetime.now(timezone.utc).isoformat(),
        "version": "v24.2.1",
        "audit": "Comprehensive Testnet Verification",
        "honest": True,
        "forced_to_pass": False,
        "networks": {
            "monad": {"rpc": MONAD_RPC, "chain_id": MONAD_CHAIN_ID, "results": all_results["monad"]},
            "arc": {"rpc": ARC_RPC, "chain_id": ARC_CHAIN_ID, "results": all_results["arc"]},
            "solana": {"rpc": SOLANA_RPC, "results": all_results["solana"]},
        },
        "summary": {"total": total, "passed": passed, "failed": failed, "pass_rate_pct": round(passed/total*100, 1)},
    }
    out_path = "/home/z/my-project/docs/verification/v24.2.1-testnet-audit.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nResults saved to: {out_path}")

    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
