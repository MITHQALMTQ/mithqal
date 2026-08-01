// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Redemption Gateway
 * @dev The user-facing redemption contract. Burns MTQ (the user's settlement
 *      token) then triggers a proportional withdrawal from the Reserve vault.
 *
 * Architectural role (v19.0 blueprint §38-41 — Redemption Gateway):
 *   - User approves this contract to spend their MTQ via MTQ.approve().
 *   - User calls redeemForBurn(amount, burnProof).
 *   - This contract pulls MTQ from the user via MTQ.transferFrom().
 *   - This contract burns the gross MTQ via MTQ.burn() (which is itself
 *     NEVER pausable — Constitution Invariant 5).
 *   - This contract computes the proportional USD value to return.
 *   - This contract calls Reserve.withdrawReserve() to release the
 *     corresponding reserves (off-chain custodian settles within T+2).
 *   - Redemption fee (0.05% default, capped at 0.50%) is routed to Takaful.
 *
 * CONSTITUTIONAL INVARIANT (Article II, Invariant 5):
 *   - Redemption is NEVER pausable. No role, no Council vote, no emergency
 *     custodian can suspend redemption. This contract has NO pause
 *     functionality by design. The user's right to redeem is absolute.
 *
 * Deployed at: 0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4
 * Network:     Monad Testnet, Chain ID 10143
 */

interface IMTQ {
    function burn(uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface IReserve {
    function withdrawReserve(uint256 amountUsd, bytes32 burnProof) external;
    function getReserveBalance() external view returns (uint256);
}

// slither-disable-next-line missing-inheritance
contract Redeem {
    // ---- Roles ----
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- External contract references ----
    IMTQ public immutable mtq;
    IReserve public immutable reserve;
    /// @dev Fee recipient — the Takaful insurance pool address.
    address public immutable takaful;

    // ---- Redemption parameters ----
    /// @dev Redemption fee in basis points. 100 = 1.00%.
    ///      Constitutional ceiling: 50 bps (0.50%) per Article VIII.
    uint16 public redemptionFeeBps = 5; // 0.05% default
    uint16 public constant MAX_REDEMPTION_FEE_BPS = 50; // 0.50% — constitutional ceiling

    // ---- Redemption state ----
    uint256 public totalRedeemed;
    uint256 public totalFeesCollected;
    mapping(bytes32 => bool) public burnProofProcessed;

    // ---- Events ----
    event RedeemedForBurn(
        address indexed redeemer,
        uint256 amountBurned,
        uint256 reserveReturnedUsd,
        uint256 feeUsd,
        bytes32 indexed burnProof,
        uint64 timestamp
    );
    event RedemptionFeeUpdated(uint16 oldBps, uint16 newBps);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyCouncil() {
        require(_roles[COUNCIL_ROLE][msg.sender], "Redeem: only Council");
        _;
    }

    // NOTE: There is NO `notPaused` modifier in this contract. Redemption
    // is NEVER pausable per Constitution § Invariant 5.

    constructor(address _mtq, address _reserve, address _takaful) {
        require(_mtq != address(0), "Redeem: MTQ zero address");
        require(_reserve != address(0), "Redeem: Reserve zero address");
        require(_takaful != address(0), "Redeem: Takaful zero address");
        mtq = IMTQ(_mtq);
        reserve = IReserve(_reserve);
        takaful = _takaful;
        _roles[COUNCIL_ROLE][msg.sender] = true;
        emit RoleGranted(COUNCIL_ROLE, msg.sender);
    }

    /**
     * @dev Redeem MTQ for proportional reserves.
     *
     * Flow:
     *   1. User approves this contract via MTQ.approve(Redeem, amount).
     *   2. User calls redeemForBurn(amount, burnProof).
     *   3. This contract pulls MTQ from the user via MTQ.transferFrom().
     *   4. This contract burns the gross amount via MTQ.burn() — burn is
     *      NEVER pausable (Constitution Invariant 5).
     *   5. Fee is taken from the reserve return (not the burn — burn is gross).
     *   6. Reserve.withdrawReserve() releases the net USD to the user
     *      (off-chain custodian settles within T+2).
     *
     * @param amount    Gross MTQ amount (18 decimals) to burn
     * @param burnProof Hash linking this redemption to the off-chain wire
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events,reentrancy-no-eth
    function redeemForBurn(uint256 amount, bytes32 burnProof) external {
        // Anyone holding MTQ can redeem — Constitution Invariant 5.
        // No role check here by design.
        require(amount > 0, "Redeem: zero amount");
        require(burnProof != bytes32(0), "Redeem: missing burn proof");
        require(!burnProofProcessed[burnProof], "Redeem: burn proof already used");
        require(
            mtq.balanceOf(msg.sender) >= amount,
            "Redeem: insufficient MTQ balance"
        );

        // Pull MTQ from the caller (user must have approved this contract).
        require(
            mtq.transferFrom(msg.sender, address(this), amount),
            "Redeem: transferFrom failed - check MTQ approval"
        );

        // Burn the MTQ. MTQ.burn() is NEVER pausable (Constitution Invariant 5).
        mtq.burn(amount);

        // Mark the burn proof as processed (replay protection).
        burnProofProcessed[burnProof] = true;

        // Calculate the fee and net reserve return. The fee is taken from
        // the reserve side (not the burn side) so that the user's full MTQ
        // is burned (clean accounting — burn = gross, return = net).
        uint256 feeUsd = (amount * redemptionFeeBps) / 10000;
        uint256 netReturnUsd = amount - feeUsd;

        // Trigger the reserve withdrawal for the net amount.
        reserve.withdrawReserve(netReturnUsd, burnProof);

        totalRedeemed += amount;
        totalFeesCollected += feeUsd;

        emit RedeemedForBurn(
            msg.sender,
            amount,
            netReturnUsd,
            feeUsd,
            burnProof,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Get the current redemption fee in basis points (100 = 1.00%).
     */
    function getRedemptionFee() external view returns (uint16) {
        return redemptionFeeBps;
    }

    // ---- Admin (Council-only) ----

    /**
     * @dev Update the redemption fee. Capped at MAX_REDEMPTION_FEE_BPS
     *      (constitutional ceiling). NOTE: this is the only Council power
     *      over redemption; the right to redeem itself is absolute.
     */
    function setRedemptionFee(uint16 newBps) external onlyCouncil {
        require(
            newBps <= MAX_REDEMPTION_FEE_BPS,
            "Redeem: fee exceeds constitutional ceiling (50 bps)"
        );
        uint16 oldBps = redemptionFeeBps;
        redemptionFeeBps = newBps;
        emit RedemptionFeeUpdated(oldBps, newBps);
    }

    // ---- Role management (Council-only) ----
    function grantRole(bytes32 role, address account) external onlyCouncil {
        _roles[role][account] = true;
        emit RoleGranted(role, account);
    }

    function revokeRole(bytes32 role, address account) external onlyCouncil {
        _roles[role][account] = false;
        emit RoleRevoked(role, account);
    }

    function hasRole(bytes32 role, address account) external view returns (bool) {
        return _roles[role][account];
    }
}
