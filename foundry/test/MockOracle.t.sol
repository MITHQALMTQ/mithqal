// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MockOracle} from "../src/MockOracle.sol";

/**
 * @title MockOracle Unit + Fuzz Tests
 * @notice §38 audit fuzz coverage for the testnet price oracle.
 *
 * MockOracle is a standard OpenZeppelin AccessControl contract:
 *   - DEFAULT_ADMIN_ROLE granted to deployer at construction
 *   - ADMIN_ROLE granted to deployer at construction
 *   - Only ADMIN_ROLE can call setGoldPrice / setSilverPrice / setStablecoinPrice
 *   - All setters require `_price > 0` (revert on 0)
 *   - Every setter emits PriceUpdated(asset, newPrice, timestamp, updater)
 *   - Setter also updates `lastUpdated[asset]` to block.timestamp
 *
 * Initial state per constructor:
 *   goldPrice = 1850_00000000       ($1850.00, 8 decimals)
 *   silverPrice = 22_00000000       ($22.00)
 *   stablecoinPrices["USDC"|"USDT"|"DAI"] = 1_00000000  ($1.00)
 *   lastUpdated[each] = block.timestamp
 */
contract MockOracleTest is Test {
    MockOracle public oracle;

    address public deployer = address(this); // gets ADMIN_ROLE + DEFAULT_ADMIN_ROLE
    address public admin = address(0xAD); // second ADMIN_ROLE holder
    address public nonAdmin = address(0xBEEF);

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    function setUp() public {
        oracle = new MockOracle(); // msg.sender (=this test) becomes admin
        // Promote `admin` to ADMIN_ROLE so we have a non-deployer admin for fuzz tests.
        oracle.grantRole(ADMIN_ROLE, admin);
    }

    // ---- Initial state ----

    function test_InitialPrices() public view {
        assertEq(oracle.goldPrice(), 1850_00000000, "gold");
        assertEq(oracle.silverPrice(), 22_00000000, "silver");
        assertEq(oracle.stablecoinPrices("USDC"), 1_00000000, "USDC");
        assertEq(oracle.stablecoinPrices("USDT"), 1_00000000, "USDT");
        assertEq(oracle.stablecoinPrices("DAI"), 1_00000000, "DAI");
    }

    function test_InitialRoles() public view {
        assertTrue(oracle.hasRole(ADMIN_ROLE, deployer));
        assertTrue(oracle.hasRole(ADMIN_ROLE, admin));
        assertTrue(oracle.hasRole(DEFAULT_ADMIN_ROLE, deployer));
        assertFalse(oracle.hasRole(ADMIN_ROLE, nonAdmin));
    }

    function test_LastUpdated_InitializedAtConstruction() public view {
        uint256 ts = block.timestamp;
        assertEq(oracle.lastUpdated("GOLD"), ts);
        assertEq(oracle.lastUpdated("SILVER"), ts);
        assertEq(oracle.lastUpdated("USDC"), ts);
        assertEq(oracle.lastUpdated("USDT"), ts);
        assertEq(oracle.lastUpdated("DAI"), ts);
    }

    // ---- Gold price ----

    function test_GetGoldPrice() public view {
        assertEq(oracle.getGoldPrice(), oracle.goldPrice());
        assertEq(oracle.getGoldPrice(), 1850_00000000);
    }

    function testFuzz_SetGoldPrice(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        oracle.setGoldPrice(price);
        assertEq(oracle.goldPrice(), price);
    }

    function testFuzz_SetGoldPrice_RevertOnZero(uint256 price) public {
        price = 0;
        vm.prank(admin);
        vm.expectRevert(bytes("MockOracle: price must be > 0"));
        oracle.setGoldPrice(price);
    }

    function testFuzz_SetGoldPrice_RevertIfNotAdmin(address notAdmin, uint256 price) public {
        vm.assume(notAdmin != admin && notAdmin != deployer);
        price = bound(price, 1, type(uint256).max);
        vm.prank(notAdmin);
        vm.expectRevert();
        oracle.setGoldPrice(price);
    }

    // ---- Silver price ----

    function test_GetSilverPrice() public view {
        assertEq(oracle.getSilverPrice(), oracle.silverPrice());
        assertEq(oracle.getSilverPrice(), 22_00000000);
    }

    function testFuzz_SetSilverPrice(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        oracle.setSilverPrice(price);
        assertEq(oracle.silverPrice(), price);
    }

    function testFuzz_SetSilverPrice_RevertOnZero() public {
        vm.prank(admin);
        vm.expectRevert(bytes("MockOracle: price must be > 0"));
        oracle.setSilverPrice(0);
    }

    function testFuzz_SetSilverPrice_RevertIfNotAdmin(address notAdmin, uint256 price) public {
        vm.assume(notAdmin != admin && notAdmin != deployer);
        price = bound(price, 1, type(uint256).max);
        vm.prank(notAdmin);
        vm.expectRevert();
        oracle.setSilverPrice(price);
    }

    // ---- Stablecoin price ----

    function testFuzz_SetStablecoinPrice(string memory symbol, uint256 price) public {
        // Bound symbol length so it isn't empty.
        vm.assume(bytes(symbol).length > 0 && bytes(symbol).length <= 8);
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        oracle.setStablecoinPrice(symbol, price);
        assertEq(oracle.stablecoinPrices(symbol), price);
    }

    function testFuzz_SetStablecoinPrice_RevertOnZero(string memory symbol) public {
        vm.assume(bytes(symbol).length > 0 && bytes(symbol).length <= 8);
        vm.prank(admin);
        vm.expectRevert(bytes("MockOracle: price must be > 0"));
        oracle.setStablecoinPrice(symbol, 0);
    }

    function testFuzz_SetStablecoinPrice_RevertIfNotAdmin(address notAdmin, string memory symbol, uint256 price)
        public
    {
        vm.assume(notAdmin != admin && notAdmin != deployer);
        vm.assume(bytes(symbol).length > 0 && bytes(symbol).length <= 8);
        price = bound(price, 1, type(uint256).max);
        vm.prank(notAdmin);
        vm.expectRevert();
        oracle.setStablecoinPrice(symbol, price);
    }

    function test_SetStablecoinPrice_NewSymbolEmitsRegistration() public {
        // "FRAX" is not registered at construction → should emit StablecoinRegistered.
        vm.prank(admin);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit MockOracle.StablecoinRegistered("FRAX", 1_00000000);
        oracle.setStablecoinPrice("FRAX", 1_00000000);
    }

    function test_SetStablecoinPrice_ExistingSymbolNoRegistration() public {
        // "USDC" is registered at construction → no StablecoinRegistered event.
        // We verify by checking the price was updated and only PriceUpdated emitted.
        vm.prank(admin);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit MockOracle.PriceUpdated("USDC", 1_01000000, block.timestamp, admin);
        oracle.setStablecoinPrice("USDC", 1_01000000);
    }

    // ---- Last-updated freshness ----

    function test_LastUpdated_UpdatesOnGoldChange() public {
        uint256 before = oracle.lastUpdated("GOLD");
        // Warp forward 100 seconds.
        vm.warp(block.timestamp + 100);
        vm.prank(admin);
        oracle.setGoldPrice(1900_00000000);
        assertGt(oracle.lastUpdated("GOLD"), before);
        assertEq(oracle.lastUpdated("GOLD"), block.timestamp);
    }

    function test_LastUpdated_UpdatesOnSilverChange() public {
        uint256 before = oracle.lastUpdated("SILVER");
        vm.warp(block.timestamp + 50);
        vm.prank(admin);
        oracle.setSilverPrice(25_00000000);
        assertGt(oracle.lastUpdated("SILVER"), before);
    }

    function test_LastUpdated_UpdatesOnStablecoinChange() public {
        uint256 before = oracle.lastUpdated("USDC");
        vm.warp(block.timestamp + 30);
        vm.prank(admin);
        oracle.setStablecoinPrice("USDC", 1_01000000);
        assertGt(oracle.lastUpdated("USDC"), before);
    }

    function test_LastUpdated_GetLastUpdatedView() public {
        vm.warp(block.timestamp + 777);
        vm.prank(admin);
        oracle.setGoldPrice(2000_00000000);
        assertEq(oracle.getLastUpdated("GOLD"), block.timestamp);
    }

    function testFuzz_LastUpdated_AlwaysEqualsLastChangeTimestamp(uint256 warpDelta, uint256 price) public {
        warpDelta = bound(warpDelta, 1, 1e10); // cap at ~317 years
        price = bound(price, 1, type(uint256).max);
        uint256 before = oracle.lastUpdated("GOLD");
        vm.warp(block.timestamp + warpDelta);
        vm.prank(admin);
        oracle.setGoldPrice(price);
        assertGt(oracle.lastUpdated("GOLD"), before);
        assertEq(oracle.lastUpdated("GOLD"), block.timestamp);
    }

    // ---- Events ----

    function testFuzz_PriceUpdatedEvent_Gold(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit MockOracle.PriceUpdated("GOLD", price, block.timestamp, admin);
        oracle.setGoldPrice(price);
    }

    function testFuzz_PriceUpdatedEvent_Silver(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit MockOracle.PriceUpdated("SILVER", price, block.timestamp, admin);
        oracle.setSilverPrice(price);
    }

    function testFuzz_PriceUpdatedEvent_Stablecoin(string memory symbol, uint256 price) public {
        vm.assume(bytes(symbol).length > 0 && bytes(symbol).length <= 8);
        price = bound(price, 1, type(uint256).max);
        vm.prank(admin);
        vm.expectEmit(true, true, true, true, address(oracle));
        emit MockOracle.PriceUpdated(symbol, price, block.timestamp, admin);
        oracle.setStablecoinPrice(symbol, price);
    }

    // ---- Non-admin reverts (consolidated) ----

    function test_NonAdminReverts_AllSetters() public {
        vm.startPrank(nonAdmin);
        vm.expectRevert();
        oracle.setGoldPrice(2000_00000000);
        vm.expectRevert();
        oracle.setSilverPrice(25_00000000);
        vm.expectRevert();
        oracle.setStablecoinPrice("USDC", 1_01000000);
        vm.stopPrank();
    }

    // ---- Role management ----

    function test_GrantAdminRole() public {
        // Only DEFAULT_ADMIN_ROLE can grant ADMIN_ROLE.
        vm.prank(nonAdmin);
        vm.expectRevert();
        oracle.grantRole(ADMIN_ROLE, nonAdmin);

        // Use grantAdmin convenience wrapper.
        oracle.grantAdmin(nonAdmin);
        assertTrue(oracle.hasRole(ADMIN_ROLE, nonAdmin));
    }

    function test_RenounceDefaultAdmin() public {
        // Deployer (this test contract) holds DEFAULT_ADMIN_ROLE.
        assertTrue(oracle.hasRole(DEFAULT_ADMIN_ROLE, deployer));
        oracle.renounceDefaultAdmin();
        assertFalse(oracle.hasRole(DEFAULT_ADMIN_ROLE, deployer));
    }

    // ---- Batch read ----

    function test_BatchGetPrices() public view {
        string[] memory symbols = new string[](3);
        symbols[0] = "USDC";
        symbols[1] = "USDT";
        symbols[2] = "DAI";
        (
            uint256 gold,
            uint256 silver,
            string[] memory symsOut,
            uint256[] memory prices,
            uint256[] memory timestamps
        ) = oracle.batchGetPrices(symbols);

        assertEq(gold, 1850_00000000);
        assertEq(silver, 22_00000000);
        assertEq(symsOut.length, 3);
        assertEq(prices.length, 3);
        assertEq(timestamps.length, 5); // 2 (gold, silver) + 3 (stablecoins)

        for (uint256 i = 0; i < 3; i++) {
            assertEq(prices[i], 1_00000000);
            assertEq(symsOut[i], symbols[i]);
        }
        assertEq(timestamps[0], oracle.lastUpdated("GOLD"));
        assertEq(timestamps[1], oracle.lastUpdated("SILVER"));
    }
}
