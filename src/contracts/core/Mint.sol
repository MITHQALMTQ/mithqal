// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Mint Gateway
 * @dev The user-facing mint contract. Verifies a deposit via the Reserve
 *      contract, applies the mint fee, then calls MTQ.mint().
 *
 * Architectural role (v19.0 blueprint §34-37 — Mint Gateway):
 *   - User deposits USD (stablecoin or wire) to the off-chain custodian.
 *   - Custodian issues an attestation (depositProof) and notifies the Mint.
 *   - Mint gateway calls Reserve.depositReserve() with the depositProof.
 *   - Mint gateway calls MTQ.mint() to mint the equivalent MTQ to the
 *     user's wallet.
 *   - Mint fee (0.10% default, capped at 0.50% per Article VIII) is
 *     routed to the Takaful insurance pool.
 *
 * Invariants:
 *   - Mint can ONLY proceed if the depositProof has not been used (replay)
 *   - Mint fee is capped at 0.50% (constitutional ceiling per Article VIII)
 *   - Mint is pausable (mirrors MTQ.mintingPaused) — but burn is NOT
 *
 * Deployed at: 0x197e9CB28216dfe18a199b4c2930F74C2F460809
 * Network:     Multi-chain — see src/lib/chains.ts (Monad Testnet 10143, Arc Testnet 5042002, Local Anvil 1337)
 */

interface IMTQ {
    function mint(address to, uint256 amount, uint256 reserveDepositedUsd, bytes32 depositProof) external;
    function mintingPaused() external view returns (bool);
}

interface IReserve {
    function depositReserve(uint256 amountUsd, uint8 tier, bytes32 depositProof) external;
    function getReserveBalance() external view returns (uint256);
}

// slither-disable-next-line missing-inheritance
contract Mint {
    // ---- Roles ----
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- External contract references ----
    IMTQ public immutable mtq;
    IReserve public immutable reserve;
    /// @dev Fee recipient — the Takaful insurance pool address. The Mint
    ///      contract does NOT call into Takaful; it just mints fee MTQ
    ///      directly to this address. Takaful reads its own balance.
    address public immutable takaful;

    // ---- Mint parameters ----
    /// @dev Mint fee in basis points. 100 = 1.00%.
    ///      Constitutional ceiling: 50 bps (0.50%) per Article VIII.
    uint16 public mintFeeBps = 5; // 0.05% per v20 Blueprint §18 (was 10 — P0 fix)
    uint16 public constant MAX_MINT_FEE_BPS = 50; // 0.50% — constitutional ceiling

    // ---- Mint state ----
    bool public mintPaused;
    uint256 public totalMinted;
    uint256 public totalFeesCollected;
    mapping(bytes32 => bool) public depositProofUsed;

    // ---- Events ----
    event MintedAgainstDeposit(
        address indexed recipient,
        uint256 netAmountMtq,
        uint256 feeMtq,
        uint256 reserveDepositedUsd,
        uint8 reserveTier,
        bytes32 indexed depositProof,
        uint64 timestamp
    );
    event MintPaused(address indexed pauser);
    event MintResumed(address indexed council);
    event MintFeeUpdated(uint16 oldBps, uint16 newBps);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "Mint: unauthorized role");
        _;
    }

    modifier onlyCouncil() {
        require(_roles[COUNCIL_ROLE][msg.sender], "Mint: only Council");
        _;
    }

    modifier notPaused() {
        require(!mintPaused, "Mint: paused");
        _;
    }

    constructor(address _mtq, address _reserve, address _takaful) {
        require(_mtq != address(0), "Mint: MTQ zero address");
        require(_reserve != address(0), "Mint: Reserve zero address");
        require(_takaful != address(0), "Mint: Takaful zero address");
        mtq = IMTQ(_mtq);
        reserve = IReserve(_reserve);
        takaful = _takaful;
        _roles[COUNCIL_ROLE][msg.sender] = true;
        _roles[MINTER_ROLE][msg.sender] = true;
        _roles[PAUSER_ROLE][msg.sender] = true;
        emit RoleGranted(COUNCIL_ROLE, msg.sender);
        emit RoleGranted(MINTER_ROLE, msg.sender);
        emit RoleGranted(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Mint MTQ against a verified deposit.
     *
     * Flow:
     *   1. Custodian verifies the user's USD deposit off-chain.
     *   2. Custodian issues depositProof (EIP-712 hash) and sends to the Mint.
     *   3. Mint gateway calls Reserve.depositReserve() to record the deposit.
     *   4. Mint gateway applies the fee and calls MTQ.mint() for the net amount.
     *   5. Fee portion is minted to the Takaful insurance pool.
     *
     * @param recipient           Address receiving minted MTQ
     * @param amountMtq           Gross MTQ amount (18 decimals) to mint against
     * @param reserveDepositedUsd USD value of the deposit (must be >= amountMtq)
     * @param reserveTier         1 = gold/silver, 2 = cash, 3 = sukuk
     * @param depositProof        EIP-712 attestation hash from the custodian
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function mintAgainstDeposit(
        address recipient,
        uint256 amountMtq,
        uint256 reserveDepositedUsd,
        uint8 reserveTier,
        bytes32 depositProof
    ) external onlyRole(MINTER_ROLE) notPaused {
        require(recipient != address(0), "Mint: zero recipient");
        require(amountMtq > 0, "Mint: zero amount");
        require(depositProof != bytes32(0), "Mint: missing deposit proof");
        require(!depositProofUsed[depositProof], "Mint: deposit proof already used");
        require(reserveTier >= 1 && reserveTier <= 5, "Mint: invalid tier (1-5 per v20 4-tier model)");
        require(
            reserveDepositedUsd >= amountMtq,
            "Mint: insufficient deposit for 100%+ reserve"
        );
        require(!mtq.mintingPaused(), "Mint: MTQ minting paused (reserve ratio < 100%)");

        // Mark the deposit proof as used (replay protection).
        depositProofUsed[depositProof] = true;

        // Record the deposit in the Reserve ledger.
        reserve.depositReserve(reserveDepositedUsd, reserveTier, depositProof);

        // Calculate the fee: netAmount = gross * (10000 - feeBps) / 10000
        uint256 fee = (amountMtq * mintFeeBps) / 10000;
        uint256 netMint = amountMtq - fee;

        // Mint net MTQ to the recipient.
        mtq.mint(recipient, netMint, reserveDepositedUsd, depositProof);

        // Mint the fee portion to the Takaful pool (insurance fund).
        if (fee > 0) {
            mtq.mint(takaful, fee, reserveDepositedUsd, depositProof);
            totalFeesCollected += fee;
        }

        totalMinted += amountMtq;
        emit MintedAgainstDeposit(
            recipient,
            netMint,
            fee,
            reserveDepositedUsd,
            reserveTier,
            depositProof,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Get the current mint fee in basis points (100 = 1.00%).
     */
    function getMintFee() external view returns (uint16) {
        return mintFeeBps;
    }

    // ---- Admin (Council-only) ----

    /**
     * @dev Update the mint fee. Capped at MAX_MINT_FEE_BPS (constitutional ceiling).
     */
    function setMintFee(uint16 newBps) external onlyCouncil {
        require(newBps <= MAX_MINT_FEE_BPS, "Mint: fee exceeds constitutional ceiling (50 bps)");
        uint16 oldBps = mintFeeBps;
        mintFeeBps = newBps;
        emit MintFeeUpdated(oldBps, newBps);
    }

    function pauseMint() external onlyRole(PAUSER_ROLE) {
        mintPaused = true;
        emit MintPaused(msg.sender);
    }

    function resumeMint() external onlyCouncil {
        mintPaused = false;
        emit MintResumed(msg.sender);
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
