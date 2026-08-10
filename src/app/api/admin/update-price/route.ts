import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { priceToWei } from "@/lib/oracle-client";

/**
 * POST /api/admin/update-price — Returns calldata for updating MockOracle prices.
 *
 * Constitutional context (§30-33 of v19.0.3):
 *   - The Constitution requires a multi-oracle consensus. The MockOracle is
 *     the testnet single-source stand-in. On mainnet, this will be replaced
 *     by a MultiOracleConsensus adapter (Chainlink + Pyth + Chronicle).
 *   - Price updates MUST be signed by the operator (DEFAULT_ADMIN_ROLE +
 *     ADMIN_ROLE holder) — the backend never holds the deployer private key.
 *
 * Trust model:
 *   - This endpoint ONLY builds calldata; it does NOT submit a transaction.
 *   - The admin receives the calldata + MetaMask transaction object, then
 *     signs & broadcasts client-side. The resulting tx_hash can later be
 *     recorded via /api/admin/oracle (or future /api/admin/oracle/update).
 *
 * Request body:
 *   { asset: "gold" | "silver" | "stablecoin", price: number, symbol?: string }
 *
 * Returns:
 *   - calldata: hex string ready for `eth_sendTransaction`
 *   - oracleAddress, selector, asset, price, priceWei
 *   - command: cast send one-liner for the operator's terminal
 *   - metamask: { to, data, from, chainId } for the frontend to feed into
 *               window.ethereum.request({ method: "eth_sendTransaction" })
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const asset = typeof data.asset === "string" ? data.asset.trim().toLowerCase() : "";
  const price =
    typeof data.price === "number" ? data.price : Number(data.price);
  const symbol =
    typeof data.symbol === "string" ? data.symbol.trim().toUpperCase() : "";

  // ---- Validation ----
  if (!["gold", "silver", "stablecoin"].includes(asset)) {
    return NextResponse.json(
      { error: "asset must be one of: gold, silver, stablecoin." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: "price must be a positive number (USD)." },
      { status: 400 }
    );
  }
  if (price > 1_000_000_000) {
    return NextResponse.json(
      { error: "price exceeds the 1B sanity cap." },
      { status: 400 }
    );
  }
  if (asset === "stablecoin" && !symbol) {
    return NextResponse.json(
      { error: "symbol is required when asset=stablecoin (e.g. USDC, USDT, DAI)." },
      { status: 400 }
    );
  }

  const oracleAddress = process.env.MOCK_ORACLE_ADDRESS;
  if (!oracleAddress || oracleAddress === "0x0") {
    return NextResponse.json(
      {
        error:
          "MOCK_ORACLE_ADDRESS env var is not set. Deploy MockOracle.sol first, then set the env var.",
      },
      { status: 503 }
    );
  }

  // Function selectors (first 4 bytes of keccak256(signature)). Pre-computed.
  const SELECTORS = {
    setGoldPrice: "0x2e7c0f93", // setGoldPrice(uint256)
    setSilverPrice: "0x2f5e3d76", // setSilverPrice(uint256)
    setStablecoinPrice: "0x6f3a3e2a", // setStablecoinPrice(string,uint256)
  } as const;

  // ---- Build calldata ----
  const priceWei = priceToWei(price); // 8-decimal uint256 string (no 0x prefix)
  const priceWeiPadded = priceWei.padStart(64, "0");

  let selector: string;
  let calldata: string;
  let signature: string;

  try {
    if (asset === "gold") {
      selector = SELECTORS.setGoldPrice;
      signature = "setGoldPrice(uint256)";
      calldata = selector + priceWeiPadded;
    } else if (asset === "silver") {
      selector = SELECTORS.setSilverPrice;
      signature = "setSilverPrice(uint256)";
      calldata = selector + priceWeiPadded;
    } else {
      // stablecoin — setStablecoinPrice(string,uint256)
      // ABI encoding for (string, uint256):
      //   selector + offset(64) + priceWei(64) + length(64) + data(64+)
      // The offset points to the start of the string data (after the
      // offset slot AND the price slot = 0x40 = 64 bytes from arg region start).
      selector = SELECTORS.setStablecoinPrice;
      signature = "setStablecoinPrice(string,uint256)";
      const stringEncoded = encodeStringForCalldata(symbol); // offset+length+data, no 0x
      calldata = selector + stringEncoded + priceWeiPadded;
    }
  } catch (err) {
    console.error("calldata construction failed:", err);
    return NextResponse.json(
      { error: "Could not construct calldata." },
      { status: 500 }
    );
  }

  // The deployer wallet holds DEFAULT_ADMIN_ROLE + ADMIN_ROLE on the
  // MockOracle contract. The operator signs with this wallet via MetaMask.
  const deployerAddress = "0x3C3932F865892EFabE45892f453f81B64f6c8d8c";

  // Monad Testnet chainId = 10143 = 0x27F7.
  const chainIdHex = "0x27f7";

  // Build the cast send one-liner for the operator's terminal.
  const rpcUrl = "https://testnet-rpc.monad.xyz";
  const explorer = "https://testnet.monadscan.com";
  const command =
    asset === "stablecoin"
      ? `cast send ${oracleAddress} "${signature}" "${symbol}" ${priceWei} --rpc-url ${rpcUrl} --private-key <KEY>`
      : `cast send ${oracleAddress} "${signature}" ${priceWei} --rpc-url ${rpcUrl} --private-key <KEY>`;

  // MetaMask transaction object — the frontend feeds this into
  // window.ethereum.request({ method: "eth_sendTransaction", params: [tx] }).
  const metamaskTx = {
    to: oracleAddress,
    data: calldata,
    from: deployerAddress,
    chainId: chainIdHex,
    // gas/gasPrice are intentionally omitted — let MetaMask estimate them.
  };

  return NextResponse.json({
    ok: true,
    calldata,
    oracleAddress,
    selector,
    signature,
    asset,
    price,
    priceWei,
    symbol: asset === "stablecoin" ? symbol : null,
    command,
    metamask: metamaskTx,
    network: {
      name: "Monad Testnet",
      chainId: 10143,
      chainIdHex,
      rpcUrl,
      explorer,
    },
    explainerLink: `${explorer}/address/${oracleAddress}`,
    fetchedAt: new Date().toISOString(),
  });
}

/**
 * ABI-encode a string for use as a function argument — WITHOUT the "0x" prefix
 * (so it can be appended directly after a selector that already has "0x").
 *
 * Returns: offset(64 hex) + length(64 hex) + data(padded to 32-byte multiple).
 *
 * Matches the encodeString() in src/lib/oracle-client.ts (used for
 * getStablecoinPrice(string) reads), minus the leading "0x".
 *
 * NOTE: for setStablecoinPrice(string,uint256) the offset points to the
 * string data, which comes AFTER the offset slot AND the uint256 price slot.
 * The current encodeString helper hardcodes offset=32, so we override it to
 * 64 here (two slots before the string data).
 */
function encodeStringForCalldata(str: string): string {
  const strBytes = Buffer.from(str, "utf-8");
  const paddedLen = Math.ceil(strBytes.length / 32) * 32;
  const padded = Buffer.alloc(paddedLen);
  strBytes.copy(padded);
  // Offset = 64 (0x40) because two 32-byte slots precede the string data:
  //   slot 0: offset to string data (this slot)
  //   slot 1: uint256 price
  //   slot 2: string length  <-- string data starts here, 64 bytes after start
  const offset = 64;
  const length = strBytes.length;
  return (
    offset.toString(16).padStart(64, "0") +
    length.toString(16).padStart(64, "0") +
    padded.toString("hex")
  );
}
