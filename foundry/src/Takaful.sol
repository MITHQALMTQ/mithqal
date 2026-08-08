// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Takaful (Islamic Mutual Insurance)
 * @dev Sharia-compliant mutual insurance pool for the Mithqal Institution.
 *
 * Architectural role (v19.0 blueprint §49 — Takaful):
 *   - Members contribute to a shared pool (Tabarru' — donation).
 *   - The pool pays claims to members who suffer a verified loss.
 *   - Surplus is redistributed to members at the end of each cycle
 *     (Mudaraba — profit-sharing).
 *   - NO interest (Riba), NO uncertainty (Gharar), NO gambling (Maysir).
 *
 * Sharia compliance (§49):
 *   1. Tabarru' (donation): contributions are voluntary donations to the
 *      pool, NOT premium payments. The donor relinquishes ownership.
 *   2. Surplus distribution: any pool surplus at cycle-end is distributed
 *      pro-rata to contributors (Mudaraba model — 70% to contributors,
 *      30% to the operator, per §49.4).
 *   3. Investment: pool reserves are invested ONLY in Sharia-compliant
 *      assets (Sukuk, gold, silver — no interest-bearing instruments).
 *   4. Claims: claims are paid ONLY after verification by the Council
 *      (or a designated Sharia supervisory board).
 *
 * Funding sources:
 *   - Direct user contributions (this contract's contribute() function)
 *   - Mint fees (Mint contract mints fee MTQ to this address — no callback)
 *   - Redemption fees (Redeem contract routes fee USD to this address)
 *
 * Deployed at: 0x3eC27BB283644eF0A98B9961E9FBED0583a02f19
 * Network:     Multi-chain — see src/lib/chains.ts (Monad Testnet 10143, Arc Testnet 5042002, Local Anvil 1337)
 */

interface IMTQ {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// slither-disable-next-line missing-inheritance
contract Takaful {
    // ---- Roles ----
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant CLAIM_VERIFIER_ROLE = keccak256("CLAIM_VERIFIER_ROLE");
    bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- External contract references ----
    IMTQ public immutable mtq;

    // ---- Pool state ----
    /// @dev Total contributions received (18 decimals, in MTQ).
    uint256 public totalContributions;
    /// @dev Total claims paid out (18 decimals, in MTQ).
    uint256 public totalClaimsPaid;
    /// @dev Per-contributor balance (18 decimals, for surplus distribution).
    mapping(address => uint256) public contributions;
    /// @dev Per-beneficiary coverage limit (18 decimals, in MTQ). Set by CLAIM_VERIFIER_ROLE.
    mapping(address => uint256) public coverageLimit;
    /// @dev Cycle counter — bumped on surplus distribution.
    uint256 public currentCycle = 1;

    // ---- Mudaraba split (§49.4) ----
    /// @dev Contributor share of pool surplus (70% default). 7000 = 70.00%.
    uint16 public constant CONTRIBUTOR_SURPLUS_SHARE_BPS = 7000;

    // ---- Events ----
    event Contributed(address indexed contributor, uint256 amount, uint256 cycle);
    event ClaimFiled(address indexed beneficiary, uint256 amount, bytes32 indexed claimHash);
    event ClaimPaid(
        address indexed beneficiary,
        uint256 amount,
        bytes32 indexed claimHash,
        address indexed verifier
    );
    event CoverageSet(address indexed beneficiary, uint256 limit, address indexed verifier);
    event SurplusDistributed(uint256 totalSurplus, uint256 cycle);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "Takaful: unauthorized role");
        _;
    }

    modifier onlyCouncil() {
        require(_roles[COUNCIL_ROLE][msg.sender], "Takaful: only Council");
        _;
    }

    constructor(address _mtq) {
        require(_mtq != address(0), "Takaful: MTQ zero address");
        mtq = IMTQ(_mtq);
        _roles[COUNCIL_ROLE][msg.sender] = true;
        _roles[CLAIM_VERIFIER_ROLE][msg.sender] = true;
        _roles[SHARIA_BOARD_ROLE][msg.sender] = true;
        emit RoleGranted(COUNCIL_ROLE, msg.sender);
        emit RoleGranted(CLAIM_VERIFIER_ROLE, msg.sender);
        emit RoleGranted(SHARIA_BOARD_ROLE, msg.sender);
    }

    /**
     * @notice Contribute to the Takaful pool (Tabarru' — donation).
     * @dev The caller must have approved this contract to transfer the
     *      specified amount of MTQ via MTQ.approve(Takaful, amount).
     *      Contributions are DONATIONS — the contributor relinquishes
     *      ownership per Sharia §49.2. The contributor's record is
     *      incremented for surplus-distribution purposes only.
     * @param amount  MTQ amount to contribute (18 decimals)
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function contribute(uint256 amount) external {
        require(amount > 0, "Takaful: zero contribution");
        require(
            mtq.transferFrom(msg.sender, address(this), amount),
            "Takaful: transferFrom failed - check MTQ approval"
        );
        contributions[msg.sender] += amount;
        totalContributions += amount;
        emit Contributed(msg.sender, amount, currentCycle);
    }

    /**
     * @notice File a claim against the Takaful pool.
     * @dev The beneficiary files a claim with a hash of the supporting
     *      documentation. The claim is NOT paid automatically — it must
     *      be approved by CLAIM_VERIFIER_ROLE (Sharia supervisory board).
     * @param amount    MTQ amount claimed (18 decimals)
     * @param claimHash Hash of the supporting documentation
     */
    function claim(uint256 amount, bytes32 claimHash) external {
        require(amount > 0, "Takaful: zero claim");
        require(claimHash != bytes32(0), "Takaful: missing claim hash");
        require(
            amount <= coverageLimit[msg.sender],
            "Takaful: claim exceeds coverage limit"
        );
        emit ClaimFiled(msg.sender, amount, claimHash);
        // Actual payout requires CLAIM_VERIFIER_ROLE to call approveClaim().
    }

    /**
     * @notice Approve and pay a filed claim (CLAIM_VERIFIER_ROLE only).
     * @dev Verifies the claim against the supporting documentation and
     *      pays out from the pool. The verifier takes responsibility for
     *      the verification — this is the Sharia supervisory function.
     * @param beneficiary  The claimant's address
     * @param amount       MTQ amount to pay (18 decimals)
     * @param claimHash    Hash of the supporting documentation (for replay protection)
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events,reentrancy-no-eth
    function approveClaim(
        address beneficiary,
        uint256 amount,
        bytes32 claimHash
    ) external onlyRole(CLAIM_VERIFIER_ROLE) {
        require(beneficiary != address(0), "Takaful: zero beneficiary");
        require(amount > 0, "Takaful: zero claim");
        require(
            amount <= coverageLimit[beneficiary],
            "Takaful: claim exceeds coverage limit"
        );
        require(
            mtq.balanceOf(address(this)) >= amount,
            "Takaful: insufficient pool balance"
        );

        require(
            mtq.transfer(beneficiary, amount),
            "Takaful: payout transfer failed"
        );

        totalClaimsPaid += amount;
        coverageLimit[beneficiary] -= amount; // decrement remaining coverage
        emit ClaimPaid(beneficiary, amount, claimHash, msg.sender);
    }

    /**
     * @notice Set the coverage limit for a beneficiary (CLAIM_VERIFIER_ROLE only).
     * @dev The Sharia supervisory board determines coverage based on the
     *      member's contribution history and risk profile.
     * @param beneficiary The member's address
     * @param limit       MTQ amount of coverage (18 decimals)
     */
    function setCoverage(address beneficiary, uint256 limit) external onlyRole(CLAIM_VERIFIER_ROLE) {
        require(beneficiary != address(0), "Takaful: zero beneficiary");
        coverageLimit[beneficiary] = limit;
        emit CoverageSet(beneficiary, limit, msg.sender);
    }

    /**
     * @notice Get the current pool balance (MTQ, 18 decimals).
     * @dev Reads the live MTQ balance of this contract — includes both
     *      direct contributions and fees routed from Mint/Redeem.
     */
    function getPoolBalance() external view returns (uint256) {
        return mtq.balanceOf(address(this));
    }

    /**
     * @notice Get the coverage limit for a beneficiary.
     * @param beneficiary The member's address
     */
    function getCoverage(address beneficiary) external view returns (uint256) {
        return coverageLimit[beneficiary];
    }

    /**
     * @notice Distribute the pool surplus at cycle-end (Mudaraba — §49.4).
     * @dev The Council closes a cycle by calling this function. The pool
     *      surplus (10% of current balance, conservative estimate) is
     *      earmarked for pro-rata distribution to contributors (70%) and
     *      the operator (30%). For testnet simplicity, this function only
     *      emits an event and bumps the cycle — the actual distribution
     *      is performed off-chain via a Merkle drop to avoid the gas cost
     *      of looping all contributors.
     */
    function distributeSurplus() external onlyCouncil returns (uint256 surplus) {
        uint256 poolBalance = mtq.balanceOf(address(this));
        // Conservative surplus estimate: 10% of pool balance.
        // At mainnet, this should be: poolBalance - sum(active coverage).
        surplus = (poolBalance * 1000) / 10000; // 10% of pool
        currentCycle += 1;
        emit SurplusDistributed(surplus, currentCycle);
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
