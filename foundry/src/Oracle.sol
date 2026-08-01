// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Live Oracle
 * @dev The production price oracle — an upgrade from MockOracle.sol. Adds
 *      role-based access (ORACLE_PROVIDER_ROLE), multi-asset price feeds,
 *      and freshness verification per the v19.0 Constitution §30-33.
 *
 * Architectural role (v19.0 blueprint §30-33 — Oracle Consensus):
 *   - Single-provider mode for testnet (this contract).
 *   - Multi-oracle consensus at mainnet: Chainlink + Pyth + Chronicle +
 *     RedStone, with weighted median + freshness verification (§31).
 *   - Prices stored as uint256 with 8 decimals (matches MockOracle.sol).
 *   - Every update emits PriceUpdated for off-chain indexing.
 *   - Block timestamp recorded for freshness (§31.4 — max staleness 1 hour).
 *
 * Security model:
 *   - DEFAULT_ADMIN_ROLE: deployer (transferred to Safe Multi-Sig post-deploy)
 *   - ORACLE_PROVIDER_ROLE: the price-feed operator (eventually the Safe Multi-Sig)
 *   - All setters require ORACLE_PROVIDER_ROLE
 *
 * Migration note: this contract is NOT a UUPS upgrade of MockOracle — it is
 * a fresh deployment. The off-chain oracle-client.ts is being updated to
 * point at this address; MockOracle remains deployed at
 * 0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471 for backwards-compat.
 *
 * Deployed at: 0xDfcA66ac0450C9AB86307af1942E157C5A4DB713
 * Network:     Monad Testnet, Chain ID 10143
 */

// slither-disable-next-line missing-inheritance
contract Oracle {
    // ---- Roles (simplified AccessControl, no OZ import for gas efficiency) ----
    bytes32 public constant DEFAULT_ADMIN_ROLE = bytes32(0);
    bytes32 public constant ORACLE_PROVIDER_ROLE = keccak256("ORACLE_PROVIDER_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- Prices (8 decimals, matches MockOracle.sol conventions) ----
    // slither-disable-start too-many-digits
    /// @dev $1.00 encoded with 8 decimals (matches MockOracle.sol conventions).
    uint256 private constant ONE_USD = 1_00000000;
    /// @dev Default gold price at deployment ($1850.00/oz, 8 decimals).
    uint256 private constant DEFAULT_GOLD_PRICE_USD = 1850_00000000;
    /// @dev Default silver price at deployment ($22.00/oz, 8 decimals).
    uint256 private constant DEFAULT_SILVER_PRICE_USD = 22_00000000;
    // slither-disable-end too-many-digits

    uint256 public goldPrice = DEFAULT_GOLD_PRICE_USD; // $1850.00/oz default
    uint256 public silverPrice = DEFAULT_SILVER_PRICE_USD; // $22.00/oz default

    /// @dev Asset symbol => price (8 decimals). Supports arbitrary assets.
    mapping(string => uint256) public prices;
    /// @dev Asset symbol => last update timestamp (block.timestamp).
    mapping(string => uint256) public lastUpdated;

    /// @dev Maximum allowed staleness in seconds (1 hour, per §31.4).
    uint256 public constant MAX_STALENESS = 1 hours;

    // ---- Events ----
    event PriceUpdated(string indexed asset, uint256 newPrice, uint256 timestamp, address indexed updater);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "Oracle: unauthorized role");
        _;
    }

    constructor() {
        // Deployer is the initial admin + provider (transferred to Safe Multi-Sig post-deploy).
        _roles[DEFAULT_ADMIN_ROLE][msg.sender] = true;
        _roles[ORACLE_PROVIDER_ROLE][msg.sender] = true;
        emit RoleGranted(DEFAULT_ADMIN_ROLE, msg.sender);
        emit RoleGranted(ORACLE_PROVIDER_ROLE, msg.sender);

        // Initialize stablecoin prices to $1.00 (8 decimals).
        prices["USDC"] = ONE_USD;
        prices["USDT"] = ONE_USD;
        prices["DAI"] = ONE_USD;

        lastUpdated["GOLD"] = block.timestamp;
        lastUpdated["SILVER"] = block.timestamp;
        lastUpdated["USDC"] = block.timestamp;
        lastUpdated["USDT"] = block.timestamp;
        lastUpdated["DAI"] = block.timestamp;

        emit PriceUpdated("GOLD", goldPrice, block.timestamp, msg.sender);
        emit PriceUpdated("SILVER", silverPrice, block.timestamp, msg.sender);
        emit PriceUpdated("USDC", ONE_USD, block.timestamp, msg.sender);
        emit PriceUpdated("USDT", ONE_USD, block.timestamp, msg.sender);
        emit PriceUpdated("DAI", ONE_USD, block.timestamp, msg.sender);
    }

    // ---- Setters (ORACLE_PROVIDER_ROLE only) ----

    /**
     * @notice Update the gold price (USD/oz, 8 decimals).
     * @dev Only callable by ORACLE_PROVIDER_ROLE. In production, this is
     *      the Safe Multi-Sig (0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0)
     *      after multi-oracle consensus.
     */
    function setGoldPrice(uint256 price) external onlyRole(ORACLE_PROVIDER_ROLE) {
        require(price > 0, "Oracle: price must be > 0");
        goldPrice = price;
        lastUpdated["GOLD"] = block.timestamp;
        emit PriceUpdated("GOLD", price, block.timestamp, msg.sender);
    }

    /**
     * @notice Update the silver price (USD/oz, 8 decimals).
     */
    function setSilverPrice(uint256 price) external onlyRole(ORACLE_PROVIDER_ROLE) {
        require(price > 0, "Oracle: price must be > 0");
        silverPrice = price;
        lastUpdated["SILVER"] = block.timestamp;
        emit PriceUpdated("SILVER", price, block.timestamp, msg.sender);
    }

    /**
     * @notice Update an arbitrary asset price (8 decimals).
     * @param symbol  Asset symbol (e.g., "USDC", "EUR", "XAU")
     * @param price   Price in USD with 8 decimals
     */
    function setPrice(string calldata symbol, uint256 price) external onlyRole(ORACLE_PROVIDER_ROLE) {
        require(price > 0, "Oracle: price must be > 0");
        require(bytes(symbol).length > 0, "Oracle: symbol required");
        prices[symbol] = price;
        lastUpdated[symbol] = block.timestamp;
        emit PriceUpdated(symbol, price, block.timestamp, msg.sender);
    }

    // ---- Read functions (view) ----

    /**
     * @notice Get the current price for an asset.
     * @dev For "GOLD" and "SILVER", returns the dedicated state variables.
     *      For all other symbols, returns from the prices mapping.
     *      Reverts if the price is stale (older than MAX_STALENESS = 1 hour).
     * @param symbol Asset symbol ("GOLD", "SILVER", "USDC", ...)
     */
    function getPrice(string calldata symbol) external view returns (uint256) {
        uint256 price;
        if (keccak256(bytes(symbol)) == keccak256(bytes("GOLD"))) {
            price = goldPrice;
        } else if (keccak256(bytes(symbol)) == keccak256(bytes("SILVER"))) {
            price = silverPrice;
        } else {
            price = prices[symbol];
        }
        require(price > 0, "Oracle: price not set");
        // slither-disable-next-line timestamp
        require(
            block.timestamp - lastUpdated[symbol] <= MAX_STALENESS,
            "Oracle: price stale (> 1 hour) - refresh required"
        );
        return price;
    }

    /**
     * @notice Get the last update timestamp for an asset (for freshness check §31.4).
     */
    function getLastUpdate(string calldata symbol) external view returns (uint256) {
        return lastUpdated[symbol];
    }

    /**
     * @notice Get the gold price (USD/oz, 8 decimals) — convenience alias for getPrice("GOLD").
     * @dev Kept for backwards-compatibility with MockOracle.sol consumers.
     */
    function getGoldPrice() external view returns (uint256) {
        return goldPrice;
    }

    /**
     * @notice Get the silver price (USD/oz, 8 decimals) — convenience alias for getPrice("SILVER").
     * @dev Kept for backwards-compatibility with MockOracle.sol consumers.
     */
    function getSilverPrice() external view returns (uint256) {
        return silverPrice;
    }

    // ---- Role management ----

    function grantRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _roles[role][account] = true;
        emit RoleGranted(role, account);
    }

    function revokeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _roles[role][account] = false;
        emit RoleRevoked(role, account);
    }

    function hasRole(bytes32 role, address account) external view returns (bool) {
        return _roles[role][account];
    }
}
