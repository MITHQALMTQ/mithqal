// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MockOracle} from "../src/MockOracle.sol";

/**
 * @title MockOracle Invariant Tests (§38)
 *
 * @notice Handler-based invariant suite for the MockOracle price feed.
 *
 * Invariants covered:
 *   1. invariant_gold_price_always_positive
 *      goldPrice > 0 after any sequence of handler calls.
 *   2. invariant_silver_price_always_positive
 *      silverPrice > 0 after any sequence of handler calls.
 *   3. invariant_stablecoin_prices_always_positive
 *      Every known stablecoin price > 0. (Brief: "revert on 0" — enforced by
 *      the contract: setStablecoinPrice requires _price > 0.)
 *   4. invariant_gold_last_updated_monotonic
 *      lastUpdated["GOLD"] only increases over time.
 *
 * Handler design:
 *   - Wraps the three setters with bounded (>= 1) price inputs so all calls
 *     succeed (the contract never reverts on a valid update).
 *   - Includes a time-warp handler so freshness timestamps can advance.
 *   - Tracks the max `lastUpdated["GOLD"]` observed so the monotonic
 *     invariant can be checked against the contract's actual value.
 */
contract MockOracleHandler is Test {
    MockOracle public oracle;
    address public admin;

    /// @notice Known stablecoin symbols to cycle through during fuzzing.
    string[] public symbols;

    /// @notice Highest lastUpdated["GOLD"] we have observed so far.
    uint256 public maxObservedGoldTs;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(address _oracle, address _admin) {
        oracle = MockOracle(_oracle);
        admin = _admin;
        // Only track symbols that are registered at construction (USDC/USDT/DAI),
        // so initial prices are already > 0 before any handler call.
        symbols = ["USDC", "USDT", "DAI"];
    }

    /// @dev Set gold price to a bounded positive value.
    function call_setGoldPrice(uint256 price) external {
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        oracle.setGoldPrice(price);

        uint256 ts = oracle.lastUpdated("GOLD");
        if (ts > maxObservedGoldTs) maxObservedGoldTs = ts;
    }

    /// @dev Set silver price.
    function call_setSilverPrice(uint256 price) external {
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        oracle.setSilverPrice(price);
    }

    /// @dev Set a stablecoin price by symbol index.
    function call_setStablecoinPrice(uint256 symIdx, uint256 price) external {
        string memory sym = symbols[symIdx % symbols.length];
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        oracle.setStablecoinPrice(sym, price);
    }

    /// @dev Advance block.timestamp by a bounded delta.
    function call_warp(uint256 delta) external {
        delta = bound(delta, 1, 1e10); // up to ~317 years
        vm.warp(block.timestamp + delta);
    }

    /// @notice Read-only helper used by invariants.
    function allStablecoinPricesPositive() public view returns (bool) {
        for (uint256 i = 0; i < symbols.length; i++) {
            if (oracle.stablecoinPrices(symbols[i]) == 0) return false;
        }
        return true;
    }

    function getSymbols() external view returns (string[] memory) {
        return symbols;
    }
}

contract MockOracleInvariantTest is Test {
    MockOracle public oracle;
    MockOracleHandler public handler;

    address public admin = address(0xAD);
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    function setUp() public {
        oracle = new MockOracle(); // test contract becomes deployer-admin
        oracle.grantRole(ADMIN_ROLE, admin);

        handler = new MockOracleHandler(address(oracle), admin);

        targetContract(address(handler));
        excludeContract(address(this));
    }

    // =====================================================================
    //                              INVARIANTS
    // =====================================================================

    /// @dev Invariant 1: goldPrice > 0 always.
    function invariant_gold_price_always_positive() public view {
        assertGt(oracle.goldPrice(), 0, "gold price > 0");
    }

    /// @dev Invariant 2: silverPrice > 0 always.
    function invariant_silver_price_always_positive() public view {
        assertGt(oracle.silverPrice(), 0, "silver price > 0");
    }

    /// @dev Invariant 3: stablecoinPrices > 0 always (contract reverts on 0).
    function invariant_stablecoin_prices_always_positive() public view {
        assertTrue(handler.allStablecoinPricesPositive(), "stablecoin prices > 0");
    }

    /// @dev Invariant 3b: explicit per-symbol check.
    function invariant_each_stablecoin_price_positive() public view {
        string[] memory symbols = handler.getSymbols();
        for (uint256 i = 0; i < symbols.length; i++) {
            assertGt(oracle.stablecoinPrices(symbols[i]), 0, "each stablecoin > 0");
        }
    }

    /// @dev Invariant 4: lastUpdated["GOLD"] never decreases.
    function invariant_gold_last_updated_monotonic() public view {
        uint256 current = oracle.lastUpdated("GOLD");
        uint256 maxObserved = handler.maxObservedGoldTs();
        // current must be >= the max we ever observed.
        assertGe(current, maxObserved, "gold lastUpdated monotonic");
    }

    /// @dev Invariant 4b: lastUpdated["GOLD"] is always <= block.timestamp
    ///      (futures can't be recorded).
    function invariant_gold_last_updated_not_in_future() public view {
        assertLe(oracle.lastUpdated("GOLD"), block.timestamp, "gold ts not in future");
    }

    /// @dev Invariant 5: ADMIN_ROLE has at least the deployer and the admin
    ///      we set up — no handler call can revoke admin roles.
    function invariant_admin_roles_unchanged() public view {
        bytes32 adminRole = ADMIN_ROLE;
        assertTrue(oracle.hasRole(adminRole, address(this)), "deployer still admin");
        assertTrue(oracle.hasRole(adminRole, admin), "admin still admin");
    }
}
