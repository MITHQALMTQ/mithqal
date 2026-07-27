import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOracleSnapshot, priceToWei } from "@/lib/oracle-client";

/**
 * GET /api/admin/oracle — auth-gated oracle status + admin UI data.
 *
 * Returns:
 *   - Current oracle snapshot (prices + source)
 *   - Contract address (if deployed)
 *   - Calldata templates for the admin to construct update transactions
 *     (the admin signs these via MetaMask — the backend never holds the
 *     deployer private key)
 *   - Deployment instructions (if not yet deployed)
 *
 * The admin UI uses this to:
 *   1. Show current prices + source (on-chain vs fallback)
 *   2. Show a form to set new prices
 *   3. Display the calldata + contract address for the admin to copy into
 *      MetaMask or cast send
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snapshot = await getOracleSnapshot();
    const oracleAddress = process.env.MOCK_ORACLE_ADDRESS;

    // Function selectors for setGoldPrice, setSilverPrice, setStablecoinPrice
    // These are the first 4 bytes of keccak256(signature). Pre-computed:
    const selectors = {
      setGoldPrice: "0x2e7c0f93", // setGoldPrice(uint256)
      setSilverPrice: "0x2f5e3d76", // setSilverPrice(uint256)
      setStablecoinPrice: "0x6f3a3e2a", // setStablecoinPrice(string,uint256)
    };

    // Build calldata examples for the admin to use with `cast send` or ethers.js
    const currentGoldWei = priceToWei(snapshot.goldUsd);

    return NextResponse.json({
      snapshot,
      oracleAddress: oracleAddress ?? null,
      deployed: !!oracleAddress && oracleAddress !== "0x0",
      network: {
        name: "Monad Testnet",
        chainId: 10143,
        rpcUrl: "https://testnet-rpc.monad.xyz",
        explorer: "https://testnet.monadscan.com",
      },
      adminRoles: {
        // The deployer wallet that holds DEFAULT_ADMIN_ROLE + ADMIN_ROLE
        deployer: "0x3C3932F865892EFabE45892f453f81B64f6c8d8c",
        // The Safe Multi-Sig that should receive ADMIN_ROLE for production
        safeMultiSig: "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0",
      },
      selectors,
      // Example calldata for setting gold price to current value (demo)
      calldataExamples: {
        setGoldPrice: `${selectors.setGoldPrice}${currentGoldWei.padStart(64, "0")}`,
        setSilverPrice: `${selectors.setSilverPrice}${priceToWei(snapshot.silverUsd).padStart(64, "0")}`,
      },
      deploymentInstructions: !oracleAddress
        ? {
            command: `forge create src/contracts/oracle/MockOracle.sol:MockOracle --rpc-url https://testnet-rpc.monad.xyz --chain-id 10143 --private-key <DEPLOYER_PRIVATE_KEY> --broadcast`,
            afterDeploy: "Set MOCK_ORACLE_ADDRESS env var on Vercel + in .env, then redeploy.",
            contractSource: "src/contracts/oracle/MockOracle.sol",
          }
        : null,
      // Example commands for the admin to update prices via cast
      updateCommands: {
        gold: `cast send ${oracleAddress ?? "<ORACLE_ADDR>"} "setGoldPrice(uint256)" <PRICE_8DEC> --rpc-url https://testnet-rpc.monad.xyz --private-key <KEY>`,
        silver: `cast send ${oracleAddress ?? "<ORACLE_ADDR>"} "setSilverPrice(uint256)" <PRICE_8DEC> --rpc-url https://testnet-rpc.monad.xyz --private-key <KEY>`,
        stablecoin: `cast send ${oracleAddress ?? "<ORACLE_ADDR>"} "setStablecoinPrice(string,uint256)" "USDC" <PRICE_8DEC> --rpc-url https://testnet-rpc.monad.xyz --private-key <KEY>`,
      },
      // 8-decimal encoding helper: $4053.50 → 405350000000
      encodingNote: "Prices are uint256 with 8 decimals. $1.00 = 100000000. $4053.50 = 405350000000.",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("admin oracle status failed:", err);
    return NextResponse.json(
      { error: "Could not fetch oracle status.", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
