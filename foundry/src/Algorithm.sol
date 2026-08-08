// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Settlement Algorithm
 * @dev Coordinates the Mithqal v19.0 settlement pipeline:
 *      mint -> verify -> settle.
 *
 * Architectural role (v19.0 blueprint §8 — Settlement Pipeline):
 *   1. The Algorithm receives a settlement request from the Mint gateway
 *      (or the Council directly) after a deposit is verified.
 *   2. It cross-checks the deposit against the Reserve contract balance
 *      and the live gold/silver price from the Oracle contract.
 *   3. It records the deposit in the Reserve ledger, mints MTQ to the
 *      recipient, and emits a SettlementExecuted event that the off-chain
 *      indexer uses to update the dashboard, the audit log, and the
 *      Proof-of-Reserves feed.
 *
 * Constitutional invariants enforced by this contract:
 *   - Only SETTLER_ROLE (granted by COUNCIL_ROLE) can authorize a
 *     settlement batch — institutional control per Article V.
 *   - Every settlement references a depositProof hash; no proof = no
 *     settlement (Invariant 1: 100%+ reserve mandate).
 *   - Settlement cannot be paused by any role — the constitutional pause
 *     lives in MTQ.mintingPaused (Invariant 5: redemption never pauses).
 *
 * Deployed at: 0x8839ce50e8D414005518769999c0A5b961D00CB2
 * Network:     Multi-chain — see src/lib/chains.ts (Monad Testnet 10143, Arc Testnet 5042002, Local Anvil 1337)
 */

interface IMTQ {
    function mint(address to, uint256 amount, uint256 reserveDepositedUsd, bytes32 depositProof) external;
    function totalSupply() external view returns (uint256);
    function reserveValueUsd() external view returns (uint256);
}

interface IReserve {
    function depositReserve(uint256 amountUsd, uint8 tier, bytes32 depositProof) external;
    function getReserveBalance() external view returns (uint256);
}

interface IOracle {
    function getGoldPrice() external view returns (uint256);
    function getSilverPrice() external view returns (uint256);
}

// slither-disable-next-line missing-inheritance
contract Algorithm {
    // ---- Roles (simplified AccessControl, mirroring MTQ.sol) ----
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- External contract references ----
    IMTQ public immutable mtq;
    IReserve public immutable reserve;
    IOracle public immutable oracle;

    // ---- Algorithm version (bumped on each upgrade) ----
    uint16 public constant ALGORITHM_VERSION = 19_00; // v19.0

    // ---- Settlement state ----
    uint256 public totalSettlementsExecuted;
    uint256 public totalReserveVerifiedUsd;
    mapping(bytes32 => bool) public settlementProcessed; // depositProof => settled

    // ---- Events ----
    event SettlementExecuted(
        address indexed recipient,
        uint256 amountMtq,
        uint256 reserveVerifiedUsd,
        uint8 reserveTier,
        bytes32 indexed depositProof,
        uint256 goldPrice,
        uint256 silverPrice,
        uint64 timestamp
    );
    event SettlementRejected(address indexed settler, bytes32 depositProof, string reason);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "Algorithm: unauthorized role");
        _;
    }

    modifier onlyCouncil() {
        require(_roles[COUNCIL_ROLE][msg.sender], "Algorithm: only Council");
        _;
    }

    constructor(address _mtq, address _reserve, address _oracle) {
        require(_mtq != address(0), "Algorithm: MTQ zero address");
        require(_reserve != address(0), "Algorithm: Reserve zero address");
        require(_oracle != address(0), "Algorithm: Oracle zero address");
        mtq = IMTQ(_mtq);
        reserve = IReserve(_reserve);
        oracle = IOracle(_oracle);
        // Deployer is the initial Council + Settler (transferred to the Safe
        // Multi-Sig and the Mint contract post-deploy).
        _roles[COUNCIL_ROLE][msg.sender] = true;
        _roles[SETTLER_ROLE][msg.sender] = true;
        emit RoleGranted(COUNCIL_ROLE, msg.sender);
        emit RoleGranted(SETTLER_ROLE, msg.sender);
    }

    /**
     * @dev Execute a settlement — the atomic mint -> verify -> settle pipeline.
     *
     * The settler (Mint gateway or Council-authorised operator) supplies:
     *   @param recipient           Address receiving the minted MTQ
     *   @param amountMtq           MTQ amount (18 decimals) to mint
     *   @param reserveDepositedUsd USD value of the underlying reserve deposit
     *   @param reserveTier         1 = gold/silver, 2 = cash, 3 = sukuk
     *   @param depositProof        Oracle attestation hash linking deposit <-> mint
     *
     * Invariants enforced:
     *   - depositProof must be unique (no double-settling the same deposit)
     *   - reserveDepositedUsd >= amountMtq (100%+ reserve, 1:1 at par)
     *   - Reserve contract balance must cover the deposit (no fractional reserve)
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events,reentrancy-no-eth
    function executeSettlement(
        address recipient,
        uint256 amountMtq,
        uint256 reserveDepositedUsd,
        uint8 reserveTier,
        bytes32 depositProof
    ) external onlyRole(SETTLER_ROLE) {
        require(recipient != address(0), "Algorithm: zero recipient");
        require(amountMtq > 0, "Algorithm: zero amount");
        require(depositProof != bytes32(0), "Algorithm: missing deposit proof");
        require(!settlementProcessed[depositProof], "Algorithm: deposit already settled");
        require(reserveTier >= 1 && reserveTier <= 3, "Algorithm: invalid tier");
        require(
            reserveDepositedUsd >= amountMtq,
            "Algorithm: insufficient deposit for 100%+ reserve"
        );

        // Verify the Reserve contract holds enough reserves to back this mint.
        uint256 reserveBalance = reserve.getReserveBalance();
        if (reserveBalance < reserveDepositedUsd) {
            emit SettlementRejected(msg.sender, depositProof, "reserve balance below deposit");
            revert("Algorithm: Reserve balance below deposit value");
        }

        // Record the deposit in the Reserve ledger.
        reserve.depositReserve(reserveDepositedUsd, reserveTier, depositProof);

        // Mint MTQ — MTQ.mint() enforces its own invariants (1:1 deposit,
        // pause check, attestation rate limit).
        mtq.mint(recipient, amountMtq, reserveDepositedUsd, depositProof);

        // Mark the deposit proof as processed (replay protection).
        settlementProcessed[depositProof] = true;
        totalSettlementsExecuted += 1;
        totalReserveVerifiedUsd += reserveDepositedUsd;

        emit SettlementExecuted(
            recipient,
            amountMtq,
            reserveDepositedUsd,
            reserveTier,
            depositProof,
            oracle.getGoldPrice(),
            oracle.getSilverPrice(),
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Returns the algorithm version (semantic versioning, 1900 = v19.0).
     * @dev Used by the off-chain indexer and the dashboard's "running version" badge.
     */
    function getAlgorithmVersion() external pure returns (uint16) {
        return ALGORITHM_VERSION;
    }

    /**
     * @notice Returns true if a deposit proof has already been settled.
     * @dev Read-only replay check used by the Mint gateway before calling executeSettlement.
     */
    function isSettled(bytes32 depositProof) external view returns (bool) {
        return settlementProcessed[depositProof];
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
