// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Oracle} from "../src/Oracle.sol";

/**
 * @title Oracle Unit + Fuzz Tests
 * @notice Covers §30-33 price-oracle freshness + access-control invariants.
 *
 * Oracle is the production price oracle (upgrade from MockOracle.sol):
 *   - ORACLE_PROVIDER_ROLE replaces MockOracle's ADMIN_ROLE
 *   - Multi-asset price feeds via setPrice(symbol, price)
 *   - MAX_STALENESS = 1 hour enforced on getPrice() (§31.4)
 *
 * Role model (simplified AccessControl, no OZ import):
 *   - DEFAULT_ADMIN_ROLE     : deployer; can grant/revoke roles
 *   - ORACLE_PROVIDER_ROLE   : deployer initially; can call all setters
 *
 * Initial state per constructor:
 *   goldPrice    = 1850_00000000  ($1850.00, 8 decimals)
 *   silverPrice  = 22_00000000    ($22.00)
 *   prices["USDC"|"USDT"|"DAI"] = 1_00000000  ($1.00)
 *   lastUpdated[each] = block.timestamp
 */
contract OracleTest is Test {
    Oracle public oracle;

    address public deployer = address(this);
    address public provider = address(0xAD); // second ORACLE_PROVIDER_ROLE holder
    address public nonProvider = address(0xBEEF);

    bytes32 public constant DEFAULT_ADMIN_ROLE = bytes32(0);
    bytes32 public constant ORACLE_PROVIDER_ROLE = keccak256("ORACLE_PROVIDER_ROLE");

    uint256 public constant MAX_STALENESS = 1 hours;

    function setUp() public {
        oracle = new Oracle(); // deployer becomes admin + provider
        oracle.grantRole(ORACLE_PROVIDER_ROLE, provider);
    }

    // ---- Deployment + role assignment ----

    function test_Deployment_GrantsRolesToDeployer() public view {
        assertTrue(oracle.hasRole(DEFAULT_ADMIN_ROLE, deployer), "admin");
        assertTrue(oracle.hasRole(ORACLE_PROVIDER_ROLE, deployer), "provider");
    }

    function test_Deployment_GrantsProviderToSecondary() public view {
        assertTrue(oracle.hasRole(ORACLE_PROVIDER_ROLE, provider), "provider");
        assertFalse(oracle.hasRole(ORACLE_PROVIDER_ROLE, nonProvider), "non-provider");
    }

    function test_Deployment_InitialPrices() public view {
        assertEq(oracle.goldPrice(), 1850_00000000, "gold");
        assertEq(oracle.silverPrice(), 22_00000000, "silver");
        assertEq(oracle.prices("USDC"), 1_00000000, "USDC");
        assertEq(oracle.prices("USDT"), 1_00000000, "USDT");
        assertEq(oracle.prices("DAI"), 1_00000000, "DAI");
    }

    function test_Deployment_LastUpdatedInitialized() public view {
        uint256 ts = block.timestamp;
        assertEq(oracle.lastUpdated("GOLD"), ts, "GOLD");
        assertEq(oracle.lastUpdated("SILVER"), ts, "SILVER");
        assertEq(oracle.lastUpdated("USDC"), ts, "USDC");
        assertEq(oracle.lastUpdated("USDT"), ts, "USDT");
        assertEq(oracle.lastUpdated("DAI"), ts, "DAI");
    }

    function test_Deployment_MaxStalenessIsOneHour() public view {
        assertEq(oracle.MAX_STALENESS(), 1 hours, "max staleness");
    }

    // ---- setGoldPrice ----

    function test_SetGoldPrice_RevertsWithoutProviderRole() public {
        vm.prank(nonProvider);
        vm.expectRevert(bytes("Oracle: unauthorized role"));
        oracle.setGoldPrice(2000_00000000);
    }

    function test_SetGoldPrice_RevertsOnZeroPrice() public {
        vm.prank(provider);
        vm.expectRevert(bytes("Oracle: price must be > 0"));
        oracle.setGoldPrice(0);
    }

    function test_SetGoldPrice_SucceedsAndUpdatesTimestamp() public {
        uint256 tsBefore = oracle.lastUpdated("GOLD");
        vm.warp(block.timestamp + 100);

        vm.prank(provider);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit Oracle.PriceUpdated("GOLD", 2000_00000000, block.timestamp, provider);
        oracle.setGoldPrice(2000_00000000);

        assertEq(oracle.goldPrice(), 2000_00000000, "price");
        assertGt(oracle.lastUpdated("GOLD"), tsBefore, "ts advanced");
        assertEq(oracle.lastUpdated("GOLD"), block.timestamp, "ts == block");
    }

    // ---- setSilverPrice ----

    function test_SetSilverPrice_RevertsWithoutProviderRole() public {
        vm.prank(nonProvider);
        vm.expectRevert(bytes("Oracle: unauthorized role"));
        oracle.setSilverPrice(25_00000000);
    }

    function test_SetSilverPrice_Succeeds() public {
        vm.prank(provider);
        oracle.setSilverPrice(25_00000000);
        assertEq(oracle.silverPrice(), 25_00000000, "silver");
    }

    // ---- setPrice (arbitrary asset) ----

    function test_SetPrice_RevertsWithoutProviderRole() public {
        vm.prank(nonProvider);
        vm.expectRevert(bytes("Oracle: unauthorized role"));
        oracle.setPrice("EUR", 1_08000000);
    }

    function test_SetPrice_RevertsOnZeroPrice() public {
        vm.prank(provider);
        vm.expectRevert(bytes("Oracle: price must be > 0"));
        oracle.setPrice("EUR", 0);
    }

    function test_SetPrice_RevertsOnEmptySymbol() public {
        vm.prank(provider);
        vm.expectRevert(bytes("Oracle: symbol required"));
        oracle.setPrice("", 1_00000000);
    }

    function test_SetPrice_SucceedsForNewAsset() public {
        vm.prank(provider);
        oracle.setPrice("EUR", 1_08000000);
        assertEq(oracle.prices("EUR"), 1_08000000, "EUR price");
        assertEq(oracle.lastUpdated("EUR"), block.timestamp, "EUR ts");
    }

    // ---- getPrice ----

    function test_GetPrice_ReturnsGoldPrice() public view {
        assertEq(oracle.getPrice("GOLD"), 1850_00000000, "gold");
    }

    function test_GetPrice_ReturnsSilverPrice() public view {
        assertEq(oracle.getPrice("SILVER"), 22_00000000, "silver");
    }

    function test_GetPrice_ReturnsStablecoinPrice() public view {
        assertEq(oracle.getPrice("USDC"), 1_00000000, "USDC");
    }

    function test_GetPrice_RevertsIfPriceNotSet() public {
        vm.expectRevert(bytes("Oracle: price not set"));
        oracle.getPrice("UNKNOWN");
    }

    function test_GetPrice_RevertsWhenStale() public {
        // Warp past MAX_STALENESS (1 hour).
        vm.warp(block.timestamp + 1 hours + 1 seconds);
        vm.expectRevert(bytes("Oracle: price stale (> 1 hour) - refresh required"));
        oracle.getPrice("GOLD");
    }

    function test_GetPrice_SucceedsAtExactStalenessBoundary() public {
        // Warp to exactly MAX_STALENESS — should still be fresh (<=).
        vm.warp(block.timestamp + 1 hours);
        assertEq(oracle.getPrice("GOLD"), 1850_00000000, "gold fresh at boundary");
    }

    function test_GetPrice_RefreshesAfterUpdate() public {
        // Warp past staleness.
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert(bytes("Oracle: price stale (> 1 hour) - refresh required"));
        oracle.getPrice("GOLD");

        // Refresh — now getPrice works again.
        vm.prank(provider);
        oracle.setGoldPrice(1900_00000000);
        assertEq(oracle.getPrice("GOLD"), 1900_00000000, "gold after refresh");
    }

    // ---- getLastUpdate ----

    function test_GetLastUpdate_ReturnsRecentTimestamp() public {
        uint256 ts = oracle.getLastUpdate("GOLD");
        assertEq(ts, block.timestamp, "fresh timestamp");
        assertLe(block.timestamp - ts, MAX_STALENESS, "within staleness");
    }

    function test_GetLastUpdate_AdvancesOnUpdate() public {
        uint256 before = oracle.getLastUpdate("GOLD");
        vm.warp(block.timestamp + 500);
        vm.prank(provider);
        oracle.setGoldPrice(2000_00000000);
        uint256 afterTs = oracle.getLastUpdate("GOLD");
        assertGt(afterTs, before, "timestamp advanced");
        assertEq(afterTs, block.timestamp, "timestamp == block");
    }

    // ---- Backwards-compat aliases ----

    function test_GetGoldPrice_AliasMatchesStateVar() public view {
        assertEq(oracle.getGoldPrice(), oracle.goldPrice());
    }

    function test_GetSilverPrice_AliasMatchesStateVar() public view {
        assertEq(oracle.getSilverPrice(), oracle.silverPrice());
    }

    // ---- Role management ----

    function test_RoleManagement_OnlyDefaultAdmin() public {
        // Non-admin cannot grant.
        vm.prank(nonProvider);
        vm.expectRevert(bytes("Oracle: unauthorized role"));
        oracle.grantRole(ORACLE_PROVIDER_ROLE, nonProvider);

        // Admin (deployer) grants.
        oracle.grantRole(ORACLE_PROVIDER_ROLE, nonProvider);
        assertTrue(oracle.hasRole(ORACLE_PROVIDER_ROLE, nonProvider));

        // Non-admin cannot revoke.
        vm.prank(nonProvider);
        vm.expectRevert(bytes("Oracle: unauthorized role"));
        oracle.revokeRole(ORACLE_PROVIDER_ROLE, nonProvider);

        // Admin revokes.
        oracle.revokeRole(ORACLE_PROVIDER_ROLE, nonProvider);
        assertFalse(oracle.hasRole(ORACLE_PROVIDER_ROLE, nonProvider));
    }

    // ---- Fuzz tests ----

    function testFuzz_SetGoldPrice(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(provider);
        oracle.setGoldPrice(price);
        assertEq(oracle.goldPrice(), price, "price");
        assertEq(oracle.lastUpdated("GOLD"), block.timestamp, "ts");
        assertEq(oracle.getPrice("GOLD"), price, "getPrice");
    }

    function testFuzz_SetSilverPrice(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(provider);
        oracle.setSilverPrice(price);
        assertEq(oracle.silverPrice(), price, "price");
    }

    function testFuzz_SetPrice_ArbitrarySymbol(string memory symbol, uint256 price) public {
        // Exclude "GOLD" and "SILVER" — those are special-cased in getPrice()
        // to read from the dedicated state variables (goldPrice / silverPrice),
        // NOT from the prices[] mapping. setPrice() writes to the mapping, so
        // getPrice() would return the state variable (the old default), not the
        // value we just set. This is a deliberate contract design choice.
        bytes32 symHash = keccak256(bytes(symbol));
        vm.assume(
            bytes(symbol).length > 0 && bytes(symbol).length <= 8
                && symHash != keccak256(bytes("GOLD")) && symHash != keccak256(bytes("SILVER"))
        );
        price = bound(price, 1, type(uint256).max);
        vm.prank(provider);
        oracle.setPrice(symbol, price);
        assertEq(oracle.prices(symbol), price, "price stored");
        assertEq(oracle.getPrice(symbol), price, "getPrice returns");
    }

    function testFuzz_SetGoldPrice_RevertIfNotProvider(address notProvider, uint256 price) public {
        vm.assume(notProvider != provider && notProvider != deployer);
        price = bound(price, 1, type(uint256).max);
        vm.prank(notProvider);
        vm.expectRevert(bytes("Oracle: unauthorized role"));
        oracle.setGoldPrice(price);
    }

    function testFuzz_GetPrice_FreshWithinStaleness(uint256 warpDelta) public {
        // Warp to within [0, MAX_STALENESS] — getPrice must succeed.
        warpDelta = bound(warpDelta, 0, MAX_STALENESS);
        vm.warp(block.timestamp + warpDelta);
        assertEq(oracle.getPrice("GOLD"), 1850_00000000, "fresh");
    }

    function testFuzz_GetPrice_StalePastMaxStaleness(uint256 warpDelta) public {
        // Warp beyond MAX_STALENESS — getPrice must revert.
        warpDelta = bound(warpDelta, MAX_STALENESS + 1, type(uint256).max - block.timestamp - 1);
        vm.warp(block.timestamp + warpDelta);
        vm.expectRevert(bytes("Oracle: price stale (> 1 hour) - refresh required"));
        oracle.getPrice("GOLD");
    }

    function testFuzz_PriceUpdatedEvent_Gold(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(provider);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit Oracle.PriceUpdated("GOLD", price, block.timestamp, provider);
        oracle.setGoldPrice(price);
    }
}
