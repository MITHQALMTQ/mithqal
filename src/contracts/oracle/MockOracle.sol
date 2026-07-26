// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @author Mithqal Formation Committee
 * @notice Testnet mock price oracle — admin-controlled price feed for gold,
 *         silver, and stablecoins. Used by the MTQ monetary engine on
 *         Monad Testnet (Chain ID 10143) until real oracles (Chainlink /
 *         Pyth) are integrated at mainnet.
 *
 * @dev Constitutional context (§30-33 v19.0):
 *      The Constitution requires a multi-oracle consensus with weighted
 *      median, freshness verification, and TWAP fallback. This mock
 *      implements the ADMIN_ROLE-controlled single-source variant for
 *      testnet validation only. On mainnet, it will be replaced by a
 *      MultiOracleConsensus contract that aggregates Chainlink + Pyth +
 *      Chronicle + RedStone per §31.
 *
 * Security model:
 *   - DEFAULT_ADMIN_ROLE: can grant/revoke roles (deployer initially)
 *   - ADMIN_ROLE: can update prices (the operator wallet, eventually the
 *                 Safe Multi-Sig 0xE718...7a7D0)
 *   - Prices stored as uint256 with 8 decimals (e.g., 1850_00000000 = $1850.00)
 *   - Every update emits PriceUpdated for off-chain indexing
 *   - Block timestamp recorded for freshness verification (§31.4)
 *
 * Integration:
 *   - Backend reads getGoldPrice(), getSilverPrice(), getStablecoinPrice()
 *   - Computes NAV = R_m / S using on-chain reserve value
 *   - Dashboard displays live NAV + reserve ratio
 *   - Admin UI (auth-gated) calls setGoldPrice() etc. via the deployer wallet
 *
 * Deployed at: TBD (will be added to CONTRACT_ADDRESSES in audit-data.ts)
 */
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MockOracle is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Gold price in USD with 8 decimals (e.g., 4053_50000000 = $4053.50/oz)
    uint256 public goldPrice = 1850_00000000;

    /// @notice Silver price in USD with 8 decimals
    uint256 public silverPrice = 22_00000000;

    /// @notice Stablecoin prices by symbol (8 decimals, $1 = 1_00000000)
    mapping(string => uint256) public stablecoinPrices;

    /// @notice Last update timestamp per asset (block.timestamp) — for freshness (§31.4)
    mapping(string => uint256) public lastUpdated;

    /// @notice Emitted on every price update — off-chain indexers use this
    ///         to maintain a historical price ledger.
    event PriceUpdated(string indexed asset, uint256 newPrice, uint256 timestamp, address indexed updater);

    /// @notice Emitted when a new stablecoin symbol is registered
    event StablecoinRegistered(string symbol, uint256 initialPrice);

    constructor() {
        // Deployer is the initial DEFAULT_ADMIN + ADMIN
        // In production, ADMIN_ROLE will be transferred to the Safe Multi-Sig
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Initialize stablecoins to $1.00 (8 decimals)
        stablecoinPrices["USDC"] = 1_00000000;
        stablecoinPrices["USDT"] = 1_00000000;
        stablecoinPrices["DAI"] = 1_00000000;

        lastUpdated["GOLD"] = block.timestamp;
        lastUpdated["SILVER"] = block.timestamp;
        lastUpdated["USDC"] = block.timestamp;
        lastUpdated["USDT"] = block.timestamp;
        lastUpdated["DAI"] = block.timestamp;

        emit PriceUpdated("GOLD", goldPrice, block.timestamp, msg.sender);
        emit PriceUpdated("SILVER", silverPrice, block.timestamp, msg.sender);
        emit StablecoinRegistered("USDC", 1_00000000);
        emit StablecoinRegistered("USDT", 1_00000000);
        emit StablecoinRegistered("DAI", 1_00000000);
    }

    // ---- Admin: price setters ----

    /// @notice Update the gold price (USD/oz, 8 decimals)
    /// @dev Only callable by ADMIN_ROLE. In production, this is the Safe Multi-Sig.
    function setGoldPrice(uint256 _price) external onlyRole(ADMIN_ROLE) {
        require(_price > 0, "MockOracle: price must be > 0");
        goldPrice = _price;
        lastUpdated["GOLD"] = block.timestamp;
        emit PriceUpdated("GOLD", _price, block.timestamp, msg.sender);
    }

    /// @notice Update the silver price (USD/oz, 8 decimals)
    function setSilverPrice(uint256 _price) external onlyRole(ADMIN_ROLE) {
        require(_price > 0, "MockOracle: price must be > 0");
        silverPrice = _price;
        lastUpdated["SILVER"] = block.timestamp;
        emit PriceUpdated("SILVER", _price, block.timestamp, msg.sender);
    }

    /// @notice Update a stablecoin price (8 decimals, $1 = 1_00000000)
    function setStablecoinPrice(string calldata _symbol, uint256 _price) external onlyRole(ADMIN_ROLE) {
        require(_price > 0, "MockOracle: price must be > 0");
        require(bytes(_symbol).length > 0, "MockOracle: symbol required");
        bool exists = stablecoinPrices[_symbol] != 0;
        stablecoinPrices[_symbol] = _price;
        lastUpdated[_symbol] = block.timestamp;
        emit PriceUpdated(_symbol, _price, block.timestamp, msg.sender);
        if (!exists) {
            emit StablecoinRegistered(_symbol, _price);
        }
    }

    // ---- Read functions (view) ----

    /// @notice Get the current gold price (USD/oz, 8 decimals)
    function getGoldPrice() external view returns (uint256) {
        return goldPrice;
    }

    /// @notice Get the current silver price (USD/oz, 8 decimals)
    function getSilverPrice() external view returns (uint256) {
        return silverPrice;
    }

    /// @notice Get a stablecoin price by symbol (8 decimals)
    function getStablecoinPrice(string calldata _symbol) external view returns (uint256) {
        return stablecoinPrices[_symbol];
    }

    /// @notice Get the last update timestamp for an asset (for freshness check §31.4)
    function getLastUpdated(string calldata _asset) external view returns (uint256) {
        return lastUpdated[_asset];
    }

    /// @notice Batch read — returns gold, silver, and a list of stablecoin prices
    ///         in a single call (saves RPC round-trips for the dashboard).
    /// @return gold Gold price (8 decimals)
    /// @return silver Silver price (8 decimals)
    /// @return symbols Stablecoin symbols queried
    /// @return prices Corresponding stablecoin prices (8 decimals)
    /// @return timestamps Last update timestamps for [gold, silver, ...stablecoins]
    function batchGetPrices(string[] calldata symbols)
        external
        view
        returns (
            uint256 gold,
            uint256 silver,
            string[] memory symbolsOut,
            uint256[] memory prices,
            uint256[] memory timestamps
        )
    {
        gold = goldPrice;
        silver = silverPrice;
        uint256 n = symbols.length;
        symbolsOut = new string[](n);
        prices = new uint256[](n);
        timestamps = new uint256[](n + 2);
        timestamps[0] = lastUpdated["GOLD"];
        timestamps[1] = lastUpdated["SILVER"];
        for (uint256 i = 0; i < n; i++) {
            symbolsOut[i] = symbols[i];
            prices[i] = stablecoinPrices[symbols[i]];
            timestamps[i + 2] = lastUpdated[symbols[i]];
        }
    }

    // ---- Role management ----

    /// @notice Convenience: grant ADMIN_ROLE to the Safe Multi-Sig
    /// @dev Only DEFAULT_ADMIN_ROLE can call this. Call after deployment,
    ///      once the Safe Multi-Sig is verified operational.
    function grantAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
    }

    /// @notice Renounce DEFAULT_ADMIN_ROLE — makes the contract non-upgradable
    ///         by any single party. Call only after ADMIN_ROLE has been
    ///         transferred to the Safe Multi-Sig.
    function renounceDefaultAdmin() external onlyRole(DEFAULT_ADMIN_ROLE) {
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
