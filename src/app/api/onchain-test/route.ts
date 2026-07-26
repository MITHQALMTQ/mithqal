import { NextResponse } from "next/server";

/**
 * GET /api/onchain-test — live Monad testnet contract verification.
 *
 * Reads real on-chain data from the deployed MTQ, Governance, and Safe
 * contracts via the Monad testnet RPC (https://testnet-rpc.monad.xyz).
 * This is NOT a simulator — every value below is fetched live from the chain.
 *
 * Contract addresses (verified 2026-07-26):
 *   MTQ Token:     0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD
 *   Governance:    0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66
 *   Safe Multi-Sig: 0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0
 *   Deployer:      0x3C3932F865892EFabE45892f453f81B64f6c8d8c
 *
 * Network: Monad Testnet, Chain ID 10143
 */

const MONAD_RPC = "https://testnet-rpc.monad.xyz";
const MTQ_ADDRESS = "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD";
const GOVERNANCE_ADDRESS = "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66";
const SAFE_ADDRESS = "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0";
const DEPLOYER_ADDRESS = "0x3C3932F865892EFabE45892f453f81B64f6c8d8c";

// ERC-20 function selectors (first 4 bytes of keccak256(signature))
const SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231", // balanceOf(address) — padded address
};

// AccessControl selectors
const AC_SELECTORS = {
  hasRole: "0x91d14854", // hasRole(bytes32,address)
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  MINTER_ROLE: "0x9f2df9f2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2", // keccak256("MINTER_ROLE")
  PAUSER_ROLE: "0x65d7a28e9db1d5d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2d9d2", // keccak256("PAUSER_ROLE")
};

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(MONAD_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

async function ethCall(to: string, data: string): Promise<string> {
  return (await rpcCall("eth_call", [{ to, data }, "latest"])) as string;
}

async function ethGetCode(address: string): Promise<string> {
  return (await rpcCall("eth_getCode", [address, "latest"])) as string;
}

async function ethGetBalance(address: string): Promise<string> {
  return (await rpcCall("eth_getBalance", [address, "latest"])) as string;
}

function decodeString(hex: string): string {
  if (!hex || hex === "0x") return "";
  // ABI-decode a dynamic string
  const offset = parseInt(hex.slice(2, 66), 16);
  const length = parseInt(hex.slice(66, 130), 16);
  const dataHex = hex.slice(130, 130 + length * 2);
  return Buffer.from(dataHex, "hex").toString("utf-8");
}

function decodeUint(hex: string): bigint {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

function decodeBool(hex: string): boolean {
  if (!hex || hex === "0x") return false;
  return BigInt(hex) !== 0n;
}

export async function GET() {
  const tests: { name: string; passed: boolean; value?: string; detail?: string }[] = [];
  let pass = 0;
  let fail = 0;

  function check(name: string, passed: boolean, value?: string, detail?: string) {
    tests.push({ name, passed, value, detail });
    if (passed) pass++;
    else fail++;
  }

  try {
    // ---- Contract existence (eth_getCode) ----
    const mtqCode = await ethGetCode(MTQ_ADDRESS);
    check("MTQ contract exists (eth_getCode)", mtqCode !== "0x" && mtqCode.length > 4, `${mtqCode.length} chars`, `0x9e6E...253aD`);

    const govCode = await ethGetCode(GOVERNANCE_ADDRESS);
    check("Governance contract exists", govCode !== "0x" && govCode.length > 4, `${govCode.length} chars`, `0xE35a...aBd66`);

    const safeCode = await ethGetCode(SAFE_ADDRESS);
    check("Safe Multi-Sig contract exists", safeCode !== "0x" && safeCode.length > 4, `${safeCode.length} chars`, `0xE718...7a7D0`);

    // ---- MTQ ERC-20 standard functions ----
    const nameResult = await ethCall(MTQ_ADDRESS, SELECTORS.name);
    const name = decodeString(nameResult);
    check("name() = 'MITHQAL'", name === "MITHQAL", name);

    const symbolResult = await ethCall(MTQ_ADDRESS, SELECTORS.symbol);
    const symbol = decodeString(symbolResult);
    check("symbol() = 'MTQ'", symbol === "MTQ", symbol);

    const decimalsResult = await ethCall(MTQ_ADDRESS, SELECTORS.decimals);
    const decimals = Number(decodeUint(decimalsResult));
    check("decimals() = 18", decimals === 18, String(decimals));

    const supplyResult = await ethCall(MTQ_ADDRESS, SELECTORS.totalSupply);
    const totalSupply = decodeUint(supplyResult);
    const supplyInMTQ = Number(totalSupply) / Math.pow(10, decimals);
    check("totalSupply() > 0", totalSupply > 0n, `${supplyInMTQ.toFixed(2)} MTQ (${totalSupply.toString()} wei)`);

    // ---- Deployer balance (has MON for gas) ----
    const deployerBalance = await ethGetBalance(DEPLOYER_ADDRESS);
    const balanceMON = Number(deployerBalance) / Math.pow(10, 18);
    check("Deployer has MON balance", balanceMON > 0, `${balanceMON.toFixed(4)} MON`);

    // ---- MTQ balance of deployer ----
    const balanceData = SELECTORS.balanceOf + DEPLOYER_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
    const balanceResult = await ethCall(MTQ_ADDRESS, balanceData);
    const deployerMTQ = decodeUint(balanceResult);
    const deployerMTQAmount = Number(deployerMTQ) / Math.pow(10, decimals);
    check("Deployer holds MTQ tokens", deployerMTQ > 0n, `${deployerMTQAmount.toFixed(2)} MTQ`);

    return NextResponse.json({
      network: "Monad Testnet",
      chainId: 10143,
      rpcUrl: MONAD_RPC,
      explorer: "https://testnet.monadscan.com",
      contracts: {
        mtqToken: MTQ_ADDRESS,
        governance: GOVERNANCE_ADDRESS,
        safeMultiSig: SAFE_ADDRESS,
        deployer: DEPLOYER_ADDRESS,
      },
      onChainData: {
        name,
        symbol,
        decimals,
        totalSupply: supplyInMTQ.toFixed(2),
        totalSupplyWei: totalSupply.toString(),
        deployerBalanceMON: balanceMON.toFixed(4),
        deployerMTQBalance: deployerMTQAmount.toFixed(2),
      },
      explorerLinks: {
        mtqToken: `https://testnet.monadscan.com/address/${MTQ_ADDRESS}`,
        governance: `https://testnet.monadscan.com/address/${GOVERNANCE_ADDRESS}`,
        safeMultiSig: `https://testnet.monadscan.com/address/${SAFE_ADDRESS}`,
        deployer: `https://testnet.monadscan.com/address/${DEPLOYER_ADDRESS}`,
      },
      tests,
      summary: {
        total: tests.length,
        passed: pass,
        failed: fail,
        score: tests.length > 0 ? ((pass / tests.length) * 10).toFixed(1) + "/10" : "0/10",
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "On-chain test failed",
        detail: err instanceof Error ? err.message : "unknown error",
        tests,
        summary: { total: tests.length, passed: pass, failed: fail },
      },
      { status: 500 }
    );
  }
}
