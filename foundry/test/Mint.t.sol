// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Mint} from "../src/Mint.sol";
import {Reserve} from "../src/Reserve.sol";
import {MTQ} from "../src/MTQ.sol";

/**
 * @title Mint Gateway Unit + Fuzz Tests
 * @notice Covers the user-facing mint gateway (§34-37).
 *
 * Mint.mintAgainstDeposit():
 *   1. Verifies depositProof uniqueness (replay protection).
 *   2. Calls Reserve.depositReserve() to record the deposit.
 *   3. Mints net MTQ to the recipient.
 *   4. Mints fee MTQ (default 10 bps = 0.10%) to the Takaful pool.
 *
 * Mint fee is capped at MAX_MINT_FEE_BPS = 50 bps (constitutional ceiling,
 * Article VIII). Mint is pausable via PAUSER_ROLE (mirrors MTQ.mintingPaused).
 *
 * MTQ role bootstrapping (see MTQ.t.sol / Algorithm.t.sol for the same
 * pattern): MTQ has NO constructor — we grant COUNCIL_ROLE to the test
 * contract directly in storage via vm.store, then use MTQ.grantRole() to
 * grant MINTER_ROLE to the Mint contract.
 */
contract MintTest is Test {
    MTQ public mtq;
    Reserve public reserve;
    Mint public mint;

    // The Takaful address — Mint only stores it (doesn't call into it),
    // so a plain address is sufficient.
    address public takaful = address(0x7A4A);
    address public deployer = address(this);
    address public minter = address(0xA11CE);
    address public pauser = address(0xBA5E);
    address public council = address(0xC0FFEE);
    address public recipient = address(0xB0B);
    address public nonAuthorized = address(0xBEEF);

    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 private constant MTQ_ROLES_SLOT = 3;

    function setUp() public {
        mtq = new MTQ();
        _grantMtgRoleRaw(COUNCIL_ROLE, address(this)); // bootstrap test as MTQ council

        reserve = new Reserve(); // test = Council + Minter + Redeemer + Oracle
        mint = new Mint(address(mtq), address(reserve), takaful); // test = Council + Minter + Pauser

        // Mint needs MINTER_ROLE on MTQ (to call mtq.mint) and on Reserve
        // (to call reserve.depositReserve).
        mtq.grantRole(MINTER_ROLE, address(mint));
        reserve.grantRole(MINTER_ROLE, address(mint));

        // Promote secondary actors.
        mint.grantRole(MINTER_ROLE, minter);
        mint.grantRole(PAUSER_ROLE, pauser);
        mint.grantRole(COUNCIL_ROLE, council);
    }

    // ---- MTQ storage helper ----

    function _mtqRoleSlot(bytes32 role, address account) internal pure returns (bytes32) {
        bytes32 inner = keccak256(abi.encode(role, MTQ_ROLES_SLOT));
        return keccak256(abi.encode(account, inner));
    }

    function _grantMtgRoleRaw(bytes32 role, address account) internal {
        vm.store(address(mtq), _mtqRoleSlot(role, account), bytes32(uint256(1)));
    }

    // ---- Deployment + role assignment ----

    function test_Deployment_GrantsRolesToDeployer() public view {
        assertTrue(mint.hasRole(COUNCIL_ROLE, deployer), "council");
        assertTrue(mint.hasRole(MINTER_ROLE, deployer), "minter");
        assertTrue(mint.hasRole(PAUSER_ROLE, deployer), "pauser");
    }

    function test_Deployment_SecondaryRolesGranted() public view {
        assertTrue(mint.hasRole(MINTER_ROLE, minter), "minter");
        assertTrue(mint.hasRole(PAUSER_ROLE, pauser), "pauser");
        assertTrue(mint.hasRole(COUNCIL_ROLE, council), "council");
        assertFalse(mint.hasRole(MINTER_ROLE, nonAuthorized), "non-minter");
    }

    function test_Deployment_ImmutableRefsSet() public view {
        assertEq(address(mint.mtq()), address(mtq), "mtq ref");
        assertEq(address(mint.reserve()), address(reserve), "reserve ref");
        assertEq(mint.takaful(), takaful, "takaful ref");
    }

    function test_Deployment_RevertsOnZeroMTQ() public {
        vm.expectRevert(bytes("Mint: MTQ zero address"));
        new Mint(address(0), address(reserve), takaful);
    }

    function test_Deployment_RevertsOnZeroReserve() public {
        vm.expectRevert(bytes("Mint: Reserve zero address"));
        new Mint(address(mtq), address(0), takaful);
    }

    function test_Deployment_RevertsOnZeroTakaful() public {
        vm.expectRevert(bytes("Mint: Takaful zero address"));
        new Mint(address(mtq), address(reserve), address(0));
    }

    function test_Deployment_InitialState() public view {
        assertFalse(mint.mintPaused(), "not paused");
        assertEq(mint.mintFeeBps(), 10, "default fee 10 bps");
        assertEq(mint.MAX_MINT_FEE_BPS(), 50, "max fee 50 bps");
        assertEq(mint.totalMinted(), 0, "total minted");
        assertEq(mint.totalFeesCollected(), 0, "total fees");
    }

    // ---- getMintFee ----

    function test_GetMintFee_ReturnsDefault() public view {
        assertEq(mint.getMintFee(), 10, "default 10 bps = 0.10%");
    }

    // ---- mintAgainstDeposit: access control ----

    function test_MintAgainstDeposit_RevertsWithoutMinterRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Mint: unauthorized role"));
        mint.mintAgainstDeposit(recipient, 100 ether, 100 ether, 1, bytes32(uint256(1)));
    }

    function test_MintAgainstDeposit_RevertsWhenPaused() public {
        vm.prank(pauser);
        mint.pauseMint();
        assertTrue(mint.mintPaused());

        vm.prank(minter);
        vm.expectRevert(bytes("Mint: paused"));
        mint.mintAgainstDeposit(recipient, 100 ether, 100 ether, 1, bytes32(uint256(1)));
    }

    // ---- mintAgainstDeposit: input validation ----

    function test_MintAgainstDeposit_RevertsOnZeroRecipient() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Mint: zero recipient"));
        mint.mintAgainstDeposit(address(0), 100 ether, 100 ether, 1, bytes32(uint256(1)));
    }

    function test_MintAgainstDeposit_RevertsOnZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Mint: zero amount"));
        mint.mintAgainstDeposit(recipient, 0, 100 ether, 1, bytes32(uint256(1)));
    }

    function test_MintAgainstDeposit_RevertsOnZeroProof() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Mint: missing deposit proof"));
        mint.mintAgainstDeposit(recipient, 100 ether, 100 ether, 1, bytes32(0));
    }

    function test_MintAgainstDeposit_RevertsOnDuplicateProof() public {
        bytes32 proof = bytes32(uint256(0xDEAD));
        vm.prank(minter);
        mint.mintAgainstDeposit(recipient, 100 ether, 100 ether, 1, proof);

        vm.prank(minter);
        vm.expectRevert(bytes("Mint: deposit proof already used"));
        mint.mintAgainstDeposit(recipient, 100 ether, 100 ether, 1, proof);
    }

    function test_MintAgainstDeposit_RevertsOnInvalidTier(uint8 tier) public {
        vm.assume(tier == 0 || tier > 3);
        vm.prank(minter);
        vm.expectRevert(bytes("Mint: invalid tier"));
        mint.mintAgainstDeposit(recipient, 100 ether, 100 ether, tier, bytes32(uint256(1)));
    }

    function test_MintAgainstDeposit_RevertsOnInsufficientDeposit() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Mint: insufficient deposit for 100%+ reserve"));
        mint.mintAgainstDeposit(recipient, 100 ether, 99 ether, 1, bytes32(uint256(1)));
    }

    // ---- mintAgainstDeposit: success path ----

    function test_MintAgainstDeposit_SucceedsWithVerifiedDeposit() public {
        uint256 amount = 1000 ether;
        uint256 deposit = 1000 ether;
        uint8 tier = 1;
        bytes32 proof = bytes32(uint256(0xCAFE));

        uint256 expectedFee = (amount * 10) / 10000; // 10 bps = 0.10%
        uint256 expectedNet = amount - expectedFee;

        uint256 mintedBefore = mint.totalMinted();
        uint256 feesBefore = mint.totalFeesCollected();

        vm.prank(minter);
        mint.mintAgainstDeposit(recipient, amount, deposit, tier, proof);

        assertEq(mtq.balanceOf(recipient), expectedNet, "recipient net");
        assertEq(mtq.balanceOf(takaful), expectedFee, "takaful fee");
        assertEq(mint.totalMinted(), mintedBefore + amount, "total minted");
        assertEq(mint.totalFeesCollected(), feesBefore + expectedFee, "total fees");
        assertTrue(mint.depositProofUsed(proof), "proof used");

        // Reserve balance should have grown by the deposit amount.
        assertEq(reserve.getReserveBalance(), deposit, "reserve grew");
        assertEq(reserve.tier1Usd(), deposit, "tier1 grew");
    }

    function test_MintAgainstDeposit_SucceedsWithZeroFee() public {
        // Council sets fee to 0 — entire amount goes to recipient.
        vm.prank(council);
        mint.setMintFee(0);
        assertEq(mint.getMintFee(), 0);

        uint256 amount = 500 ether;
        vm.prank(minter);
        mint.mintAgainstDeposit(recipient, amount, amount, 2, bytes32(uint256(0x2E80)));

        assertEq(mtq.balanceOf(recipient), amount, "recipient gets full amount");
        assertEq(mtq.balanceOf(takaful), 0, "no fee");
        assertEq(mint.totalFeesCollected(), 0, "no fees collected");
    }

    function test_MintAgainstDeposit_SucceedsAtMaxFee() public {
        vm.prank(council);
        mint.setMintFee(50); // constitutional ceiling
        assertEq(mint.getMintFee(), 50);

        uint256 amount = 1000 ether;
        uint256 expectedFee = (amount * 50) / 10000; // 0.50%
        uint256 expectedNet = amount - expectedFee;

        vm.prank(minter);
        mint.mintAgainstDeposit(recipient, amount, amount, 1, bytes32(uint256(0xAA1)));

        assertEq(mtq.balanceOf(recipient), expectedNet, "recipient net at max fee");
        assertEq(mtq.balanceOf(takaful), expectedFee, "takaful fee at max fee");
    }

    // ---- Events ----

    function test_MintAgainstDeposit_EmitsMintedAgainstDeposit() public {
        uint256 amount = 100 ether;
        uint256 deposit = 100 ether;
        uint8 tier = 2;
        bytes32 proof = bytes32(uint256(0xE1));

        uint256 expectedFee = (amount * 10) / 10000;
        uint256 expectedNet = amount - expectedFee;

        vm.prank(minter);
        vm.expectEmit(true, true, false, true, address(mint));
        emit Mint.MintedAgainstDeposit(
            recipient,
            expectedNet,
            expectedFee,
            deposit,
            tier,
            proof,
            uint64(block.timestamp)
        );
        mint.mintAgainstDeposit(recipient, amount, deposit, tier, proof);
    }

    function test_PauseMint_EmitsEvent() public {
        vm.prank(pauser);
        vm.expectEmit(true, true, false, false, address(mint));
        emit Mint.MintPaused(pauser);
        mint.pauseMint();
    }

    function test_ResumeMint_EmitsEvent() public {
        vm.prank(pauser);
        mint.pauseMint();

        vm.prank(council);
        vm.expectEmit(true, true, false, false, address(mint));
        emit Mint.MintResumed(council);
        mint.resumeMint();
        assertFalse(mint.mintPaused());
    }

    function test_SetMintFee_EmitsEvent() public {
        vm.prank(council);
        vm.expectEmit(true, true, true, true, address(mint));
        emit Mint.MintFeeUpdated(10, 25);
        mint.setMintFee(25);
        assertEq(mint.getMintFee(), 25);
    }

    // ---- setMintFee: access control + ceiling ----

    function test_SetMintFee_RevertsWithoutCouncilRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Mint: only Council"));
        mint.setMintFee(20);
    }

    function test_SetMintFee_RevertsAboveConstitutionalCeiling(uint16 newBps) public {
        vm.assume(newBps > 50);
        vm.prank(council);
        vm.expectRevert(bytes("Mint: fee exceeds constitutional ceiling (50 bps)"));
        mint.setMintFee(newBps);
    }

    // ---- Pause / Resume ----

    function test_PauseMint_RevertsWithoutPauserRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Mint: unauthorized role"));
        mint.pauseMint();
    }

    function test_ResumeMint_RevertsWithoutCouncilRole() public {
        vm.prank(pauser);
        mint.pauseMint();

        vm.prank(minter); // minter is NOT council
        vm.expectRevert(bytes("Mint: only Council"));
        mint.resumeMint();
    }

    // ---- Role management ----

    function test_RoleManagement_OnlyCouncil() public {
        bytes32 NEW_ROLE = keccak256("AUDITOR_ROLE");

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Mint: only Council"));
        mint.grantRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        mint.grantRole(NEW_ROLE, nonAuthorized);
        assertTrue(mint.hasRole(NEW_ROLE, nonAuthorized));

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Mint: only Council"));
        mint.revokeRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        mint.revokeRole(NEW_ROLE, nonAuthorized);
        assertFalse(mint.hasRole(NEW_ROLE, nonAuthorized));
    }

    // ---- Fuzz tests ----

    function testFuzz_MintAgainstDeposit(uint256 amount, uint8 tier, bytes32 proof) public {
        amount = bound(amount, 1, 1e36);
        tier = uint8(bound(uint256(tier), 1, 3));
        vm.assume(proof != bytes32(0));

        uint256 fee = (amount * 10) / 10000;
        uint256 net = amount - fee;

        vm.prank(minter);
        mint.mintAgainstDeposit(recipient, amount, amount, tier, proof);

        assertEq(mtq.balanceOf(recipient), net, "recipient net");
        assertEq(mtq.balanceOf(takaful), fee, "takaful fee");
        assertEq(mint.totalMinted(), amount, "total minted");
        assertEq(mint.totalFeesCollected(), fee, "total fees");
        assertTrue(mint.depositProofUsed(proof), "proof used");
    }

    function testFuzz_MintAgainstDeposit_RevertIfNotMinter(address notMinter, uint256 amount) public {
        vm.assume(notMinter != minter && notMinter != deployer);
        amount = bound(amount, 1, 1e36);
        vm.prank(notMinter);
        vm.expectRevert(bytes("Mint: unauthorized role"));
        mint.mintAgainstDeposit(recipient, amount, amount, 1, bytes32(uint256(1)));
    }

    function testFuzz_SetMintFee_WithinCeiling(uint16 newBps) public {
        newBps = uint16(bound(uint256(newBps), 0, 50));
        vm.prank(council);
        mint.setMintFee(newBps);
        assertEq(mint.getMintFee(), newBps, "fee updated");
    }
}
