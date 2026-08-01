// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Algorithm} from "../src/Algorithm.sol";
import {Reserve} from "../src/Reserve.sol";
import {Oracle} from "../src/Oracle.sol";
import {MTQ} from "../src/MTQ.sol";

/**
 * @title Algorithm Unit + Fuzz Tests
 * @notice Covers the v19.0 settlement pipeline orchestrator.
 *
 * Algorithm coordinates: mint -> verify -> settle.
 *   - executeSettlement() verifies depositProof uniqueness, checks Reserve
 *     balance, calls Reserve.depositReserve() then MTQ.mint().
 *   - COUNCIL_ROLE + SETTLER_ROLE (deployer is both at construction).
 *   - getAlgorithmVersion() returns 1900 (v19.0).
 *
 * MTQ role bootstrapping (see MTQ.t.sol for the same pattern):
 *   MTQ has NO constructor — no role is granted at deploy. We grant
 *   COUNCIL_ROLE to the test contract directly in storage via vm.store,
 *   then use MTQ.grantRole() to grant MINTER_ROLE to the Algorithm.
 *
 *   _roles mapping is at storage slot 3. The slot for _roles[role][account]:
 *     keccak256(abi.encode(account, keccak256(abi.encode(role, 3))))
 */
contract AlgorithmTest is Test {
    MTQ public mtq;
    Reserve public reserve;
    Oracle public oracle;
    Algorithm public algorithm;

    // Test actors
    address public deployer = address(this);
    address public settler = address(0x5E7);
    address public nonSettler = address(0xBEEF);
    address public recipient = address(0xB0B);

    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // MTQ storage layout (see MTQ.t.sol).
    uint256 private constant MTQ_ROLES_SLOT = 3;

    // Seed reserve balance so executeSettlement's balance check passes.
    uint256 public constant SEED_AMOUNT = 1_000_000 ether;
    bytes32 public constant SEED_PROOF = bytes32(uint256(0x5EED));

    // Default oracle prices (Oracle.sol constructor sets these).
    uint256 public constant DEFAULT_GOLD = 1850_00000000;
    uint256 public constant DEFAULT_SILVER = 22_00000000;

    function setUp() public {
        mtq = new MTQ();
        // Bootstrap MTQ COUNCIL_ROLE on the test contract via vm.store.
        _grantMtgRoleRaw(COUNCIL_ROLE, address(this));

        reserve = new Reserve(); // test = Council + Minter + Redeemer + Oracle
        oracle = new Oracle(); // test = admin + provider
        algorithm = new Algorithm(address(mtq), address(reserve), address(oracle));

        // Algorithm needs MINTER_ROLE on MTQ (to call mtq.mint) and on
        // Reserve (to call reserve.depositReserve).
        mtq.grantRole(MINTER_ROLE, address(algorithm));
        reserve.grantRole(MINTER_ROLE, address(algorithm));

        // Seed the Reserve balance so Algorithm's reserve-balance check
        // (reserveBalance >= reserveDepositedUsd) passes for typical mints.
        vm.prank(deployer); // deployer holds MINTER_ROLE on Reserve
        reserve.depositReserve(SEED_AMOUNT, 1, SEED_PROOF);

        // Promote a secondary settler so we can test with a non-deployer actor.
        algorithm.grantRole(SETTLER_ROLE, settler);
    }

    // ---- MTQ storage helper (mirrors MTQ.t.sol) ----

    function _mtqRoleSlot(bytes32 role, address account) internal pure returns (bytes32) {
        bytes32 inner = keccak256(abi.encode(role, MTQ_ROLES_SLOT));
        return keccak256(abi.encode(account, inner));
    }

    function _grantMtgRoleRaw(bytes32 role, address account) internal {
        vm.store(address(mtq), _mtqRoleSlot(role, account), bytes32(uint256(1)));
    }

    // ---- Deployment + role assignment ----

    function test_Deployment_GrantsRolesToDeployer() public view {
        assertTrue(algorithm.hasRole(COUNCIL_ROLE, deployer), "council");
        assertTrue(algorithm.hasRole(SETTLER_ROLE, deployer), "settler");
    }

    function test_Deployment_SecondarySettlerGranted() public view {
        assertTrue(algorithm.hasRole(SETTLER_ROLE, settler), "settler");
        assertFalse(algorithm.hasRole(SETTLER_ROLE, nonSettler), "non-settler");
    }

    function test_Deployment_ImmutableRefsSet() public view {
        assertEq(address(algorithm.mtq()), address(mtq), "mtq ref");
        assertEq(address(algorithm.reserve()), address(reserve), "reserve ref");
        assertEq(address(algorithm.oracle()), address(oracle), "oracle ref");
    }

    function test_Deployment_RevertsOnZeroMTQ() public {
        vm.expectRevert(bytes("Algorithm: MTQ zero address"));
        new Algorithm(address(0), address(reserve), address(oracle));
    }

    function test_Deployment_RevertsOnZeroReserve() public {
        vm.expectRevert(bytes("Algorithm: Reserve zero address"));
        new Algorithm(address(mtq), address(0), address(oracle));
    }

    function test_Deployment_RevertsOnZeroOracle() public {
        vm.expectRevert(bytes("Algorithm: Oracle zero address"));
        new Algorithm(address(mtq), address(reserve), address(0));
    }

    function test_Deployment_InitialState() public view {
        assertEq(algorithm.totalSettlementsExecuted(), 0, "settlements");
        assertEq(algorithm.totalReserveVerifiedUsd(), 0, "verified");
        assertFalse(algorithm.isSettled(bytes32(uint256(1))), "not settled");
    }

    // ---- getAlgorithmVersion ----

    function test_GetAlgorithmVersion_ReturnsExpectedVersion() public view {
        assertEq(algorithm.getAlgorithmVersion(), 19_00, "v19.0");
    }

    // ---- executeSettlement: access control ----

    function test_ExecuteSettlement_RevertsWithoutSettlerRole() public {
        vm.prank(nonSettler);
        vm.expectRevert(bytes("Algorithm: unauthorized role"));
        algorithm.executeSettlement(recipient, 100 ether, 100 ether, 1, bytes32(uint256(1)));
    }

    // ---- executeSettlement: input validation ----

    function test_ExecuteSettlement_RevertsOnZeroRecipient() public {
        vm.expectRevert(bytes("Algorithm: zero recipient"));
        algorithm.executeSettlement(address(0), 100 ether, 100 ether, 1, bytes32(uint256(1)));
    }

    function test_ExecuteSettlement_RevertsOnZeroAmount() public {
        vm.expectRevert(bytes("Algorithm: zero amount"));
        algorithm.executeSettlement(recipient, 0, 100 ether, 1, bytes32(uint256(1)));
    }

    function test_ExecuteSettlement_RevertsOnZeroProof() public {
        vm.expectRevert(bytes("Algorithm: missing deposit proof"));
        algorithm.executeSettlement(recipient, 100 ether, 100 ether, 1, bytes32(0));
    }

    function test_ExecuteSettlement_RevertsOnInvalidTier(uint8 tier) public {
        vm.assume(tier == 0 || tier > 3);
        vm.expectRevert(bytes("Algorithm: invalid tier"));
        algorithm.executeSettlement(recipient, 100 ether, 100 ether, tier, bytes32(uint256(1)));
    }

    function test_ExecuteSettlement_RevertsOnInsufficientDeposit() public {
        // reserveDepositedUsd < amountMtq violates the 100%+ reserve mandate.
        vm.expectRevert(bytes("Algorithm: insufficient deposit for 100%+ reserve"));
        algorithm.executeSettlement(recipient, 100 ether, 99 ether, 1, bytes32(uint256(1)));
    }

    function test_ExecuteSettlement_RevertsOnReserveBalanceBelowDeposit() public {
        // Deposit exceeds the seeded Reserve balance.
        vm.expectRevert(bytes("Algorithm: Reserve balance below deposit value"));
        algorithm.executeSettlement(recipient, SEED_AMOUNT + 1, SEED_AMOUNT + 1, 1, bytes32(uint256(1)));
    }

    function test_ExecuteSettlement_RevertsOnDuplicateProof() public {
        bytes32 proof = bytes32(uint256(0xDEAD));
        algorithm.executeSettlement(recipient, 100 ether, 100 ether, 1, proof);
        assertTrue(algorithm.isSettled(proof), "settled first time");

        vm.expectRevert(bytes("Algorithm: deposit already settled"));
        algorithm.executeSettlement(recipient, 100 ether, 100 ether, 1, proof);
    }

    // ---- executeSettlement: success path ----

    function test_ExecuteSettlement_SucceedsWithDeployerAsSettler() public {
        uint256 amount = 100 ether;
        uint256 deposit = 100 ether;
        uint8 tier = 1;
        bytes32 proof = bytes32(uint256(0xCAFE));

        uint256 settlementsBefore = algorithm.totalSettlementsExecuted();
        uint256 verifiedBefore = algorithm.totalReserveVerifiedUsd();

        algorithm.executeSettlement(recipient, amount, deposit, tier, proof);

        assertEq(algorithm.totalSettlementsExecuted(), settlementsBefore + 1, "settlements");
        assertEq(algorithm.totalReserveVerifiedUsd(), verifiedBefore + deposit, "verified");
        assertTrue(algorithm.isSettled(proof), "settled flag");
        assertEq(mtq.balanceOf(recipient), amount, "recipient balance");
    }

    function test_ExecuteSettlement_SucceedsWithSecondarySettler() public {
        uint256 amount = 50 ether;
        bytes32 proof = bytes32(uint256(0x5E7));

        vm.prank(settler);
        algorithm.executeSettlement(recipient, amount, amount, 1, proof);

        assertEq(mtq.balanceOf(recipient), amount, "recipient balance");
        assertTrue(algorithm.isSettled(proof), "settled flag");
    }

    function test_ExecuteSettlement_RecordsReserveDeposit() public {
        // After settlement, the Reserve balance should have grown by the
        // deposit amount (Algorithm calls reserve.depositReserve).
        uint256 reserveBefore = reserve.getReserveBalance();
        uint256 deposit = 250 ether;

        algorithm.executeSettlement(recipient, deposit, deposit, 2, bytes32(uint256(0xE5)));

        assertEq(reserve.getReserveBalance(), reserveBefore + deposit, "reserve grew");
        assertEq(reserve.tier2Usd(), deposit, "tier2 grew");
    }

    // ---- Events ----

    function test_ExecuteSettlement_EmitsSettlementExecuted() public {
        uint256 amount = 100 ether;
        uint256 deposit = 100 ether;
        uint8 tier = 1;
        bytes32 proof = bytes32(uint256(0xEA7));

        vm.expectEmit(true, true, false, true, address(algorithm));
        emit Algorithm.SettlementExecuted(
            recipient,
            amount,
            deposit,
            tier,
            proof,
            DEFAULT_GOLD,
            DEFAULT_SILVER,
            uint64(block.timestamp)
        );

        algorithm.executeSettlement(recipient, amount, deposit, tier, proof);
    }

    function test_RoleManagement_EmitsEvents() public {
        vm.expectEmit(true, true, false, false, address(algorithm));
        emit Algorithm.RoleGranted(SETTLER_ROLE, nonSettler);
        algorithm.grantRole(SETTLER_ROLE, nonSettler);

        vm.expectEmit(true, true, false, false, address(algorithm));
        emit Algorithm.RoleRevoked(SETTLER_ROLE, nonSettler);
        algorithm.revokeRole(SETTLER_ROLE, nonSettler);
    }

    // ---- Role management ----

    function test_RoleManagement_OnlyCouncil() public {
        vm.prank(nonSettler);
        vm.expectRevert(bytes("Algorithm: only Council"));
        algorithm.grantRole(SETTLER_ROLE, nonSettler);

        algorithm.grantRole(SETTLER_ROLE, nonSettler);
        assertTrue(algorithm.hasRole(SETTLER_ROLE, nonSettler));

        vm.prank(nonSettler);
        vm.expectRevert(bytes("Algorithm: only Council"));
        algorithm.revokeRole(SETTLER_ROLE, nonSettler);

        algorithm.revokeRole(SETTLER_ROLE, nonSettler);
        assertFalse(algorithm.hasRole(SETTLER_ROLE, nonSettler));
    }

    // ---- Fuzz tests ----

    function testFuzz_ExecuteSettlement(uint256 amount, uint256 deposit, uint8 tier, bytes32 proof) public {
        // Bound: deposit >= amount (100%+ reserve), deposit <= SEED_AMOUNT
        // (Reserve balance check), tier in [1,3], proof non-zero and unique.
        amount = bound(amount, 1, 500_000 ether);
        deposit = bound(deposit, amount, SEED_AMOUNT);
        tier = uint8(bound(uint256(tier), 1, 3));
        vm.assume(proof != bytes32(0) && proof != SEED_PROOF);

        uint256 settlementsBefore = algorithm.totalSettlementsExecuted();
        uint256 verifiedBefore = algorithm.totalReserveVerifiedUsd();
        uint256 reserveBefore = reserve.getReserveBalance();

        algorithm.executeSettlement(recipient, amount, deposit, tier, proof);

        assertEq(algorithm.totalSettlementsExecuted(), settlementsBefore + 1, "settlements");
        assertEq(algorithm.totalReserveVerifiedUsd(), verifiedBefore + deposit, "verified");
        assertEq(mtq.balanceOf(recipient), amount, "recipient balance");
        assertTrue(algorithm.isSettled(proof), "settled flag");
        assertEq(reserve.getReserveBalance(), reserveBefore + deposit, "reserve grew");
    }

    function testFuzz_ExecuteSettlement_RevertIfNotSettler(address notSettler, uint256 amount) public {
        vm.assume(notSettler != deployer && notSettler != settler);
        amount = bound(amount, 1, 500_000 ether);
        vm.prank(notSettler);
        vm.expectRevert(bytes("Algorithm: unauthorized role"));
        algorithm.executeSettlement(recipient, amount, amount, 1, bytes32(uint256(1)));
    }

    function testFuzz_ExecuteSettlement_RejectsDuplicateProof(bytes32 proof) public {
        vm.assume(proof != bytes32(0) && proof != SEED_PROOF);
        // First call succeeds.
        algorithm.executeSettlement(recipient, 10 ether, 10 ether, 1, proof);
        // Second call with the same proof reverts.
        vm.expectRevert(bytes("Algorithm: deposit already settled"));
        algorithm.executeSettlement(recipient, 10 ether, 10 ether, 1, proof);
    }
}
