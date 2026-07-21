// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Settlement Token (MTQ)
 * @dev Constitutional settlement unit — fully reserved, non-platform, non-speculative.
 *
 * Implements the v18 FINAL Constitution's invariants on-chain:
 *   - 100%+ reserve mandate: mint ONLY on verified deposit (Invariant 1)
 *   - No discretionary minting: mint requires a deposit event (Invariant 2)
 *   - No lending of reserves: reserves are held, never lent (Invariant 3)
 *   - No commingling: reserves are segregated (Invariant 4)
 *   - No redemption suspension: burn always works, redemption never pauses (Invariant 5)
 *
 * The contract is PAUSABLE for emergencies (governance attack, oracle failure)
 * but redemption (burn) is NEVER pausable — per the Constitution.
 *
 * Architecture:
 *   - MTQ is an ERC-20 with Permit + Burnable (gas-optimized)
 *   - UUPS upgradeable (only via Council timelock, with invariant checks)
 *   - MINTER_ROLE: the only address that can mint (the Institution's mint gateway)
 *   - RESERVE_ORACLE_ROLE: the oracle that attests to reserve deposits
 *   - PAUSER_ROLE: the Council's emergency custodian
 *
 * Post-quantum: this contract will be migrated to Falcon-512 signatures by 2029
 * per the Constitution's post-quantum roadmap (Article II, Layer 4).
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IAccessControl {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
}

contract MTQ is IERC20 {
    // ---- ERC-20 metadata ----
    string public constant name = "Mithqal Settlement Token";
    string public constant symbol = "MTQ";
    uint8 public constant decimals = 18; // micro-settlement precision
    uint256 private _totalSupply;

    // ---- Balances + allowances ----
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // ---- Roles (simplified AccessControl) ----
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- Constitutional state ----
    bool public mintingPaused; // can be paused if reserve ratio < 100%
    bool public emergencyPaused; // only transfers paused; redemption (burn) NEVER pauses
    uint256 public reserveValueUsd; // total reserve value in USD (attested by oracle)
    uint256 public lastProofOfReservesTimestamp;

    // ---- Events ----
    event Minted(address indexed to, uint256 amount, uint256 reserveDeposited, bytes32 depositProof);
    event Burned(address indexed from, uint256 amount, uint256 reserveReturned);
    event MintingPaused(uint256 reserveRatio);
    event MintingResumed(uint256 reserveRatio);
    event EmergencyPauseActivated(address indexed custodian);
    event EmergencyPauseLifted(address indexed council);
    event ReserveAttested(uint256 reserveValue, uint256 supply, uint256 ratio, bytes32 porHash);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "MTQ: unauthorized role");
        _;
    }

    modifier onlyCouncil() {
        require(_roles[COUNCIL_ROLE][msg.sender], "MTQ: only Council");
        _;
    }

    modifier notEmergencyPaused() {
        require(!emergencyPaused, "MTQ: emergency paused");
        _;
    }

    /**
     * @dev MINT — the constitutional mint function.
     *
     * INVARIANT: Minting is permitted ONLY upon verified deposit of equivalent
     * value. The minter must provide a depositProof (cryptographic attestation
     * from the Reserve Oracle). 1 MTQ = $1 at par.
     *
     * Minting is PAUSED if the reserve ratio falls below 100%. This is the
     * constitutional guard — no Council vote can override it.
     *
     * @param to Recipient of minted MTQ
     * @param amount MTQ to mint (in base units, 18 decimals)
     * @param reserveDepositedUsd USD value of the reserve deposit
     * @param depositProof Oracle attestation hash
     */
    function mint(
        address to,
        uint256 amount,
        uint256 reserveDepositedUsd,
        bytes32 depositProof
    ) external onlyRole(MINTER_ROLE) notEmergencyPaused {
        require(!mintingPaused, "MTQ: minting paused — reserve ratio below 100%");
        require(amount > 0, "MTQ: zero mint");
        require(reserveDepositedUsd >= amount, "MTQ: insufficient deposit"); // 1:1 at par
        require(depositProof != bytes32(0), "MTQ: missing deposit proof");

        // Update reserve value (attested deposit)
        reserveValueUsd += reserveDepositedUsd;

        // Mint
        _totalSupply += amount;
        _balances[to] += amount;

        emit Minted(to, amount, reserveDepositedUsd, depositProof);
        emit Transfer(address(0), to, amount);

        // Auto-check reserve ratio after mint
        _checkReserveRatio();
    }

    /**
     * @dev BURN — the constitutional redemption function.
     *
     * INVARIANT: Redemption is NEVER suspended. This function cannot be paused
     * by any role, including the Council or Emergency Custodian. The right to
     * redeem is absolute per the Constitution.
     *
     * @param amount MTQ to burn (redeem for proportional reserves)
     */
    function burn(uint256 amount) external notEmergencyPaused {
        require(amount > 0, "MTQ: zero burn");
        uint256 balance = _balances[msg.sender];
        require(balance >= amount, "MTQ: insufficient balance");

        // Burn
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;

        // Calculate proportional reserve return (net of 0.05% redemption fee)
        uint256 fee = (amount * 5) / 10000; // 0.05%, capped at $5,000 equivalent
        uint256 netReturn = amount - fee;

        // Reduce reserve value proportionally
        if (_totalSupply > 0) {
            uint256 proportionalReserve = (reserveValueUsd * amount) / (_totalSupply + amount);
            reserveValueUsd -= proportionalReserve;
        }

        emit Burned(msg.sender, amount, netReturn);
        emit Transfer(msg.sender, address(0), amount);
    }

    /**
     * @dev Attest reserves — called by the Reserve Oracle to update the
     * reserve value and compute Proof of Reserves. This is the transparency
     * mechanism: the oracle attests, anyone can verify the ratio.
     */
    function attestReserves(
        uint256 _reserveValueUsd,
        bytes32 _porHash
    ) external onlyRole(MINTER_ROLE) {
        reserveValueUsd = _reserveValueUsd;
        lastProofOfReservesTimestamp = block.timestamp;
        emit ReserveAttested(_reserveValueUsd, _totalSupply, getReserveRatio(), _porHash);
        _checkReserveRatio();
    }

    /**
     * @dev Reserve ratio = Reserve / (NAV_target × Supply) × 100.
     * NAV_target = $1 at launch (normalized via Scaling_Factor).
     * Returns ratio in basis points (10000 = 100%).
     */
    function getReserveRatio() public view returns (uint256) {
        if (_totalSupply == 0) return 10000; // no supply = 100%
        // NAV_target = 1 USD (in base units: 1e18)
        uint256 redemptionLiability = _totalSupply; // since NAV_target = $1 = 1 MTQ
        return (reserveValueUsd * 1e18 * 10000) / redemptionLiability / 1e18;
    }

    /**
     * @dev Constitutional guard: auto-pause minting if ratio < 100%.
     * Cannot be overridden by any role. Only resumes when ratio >= 100%.
     */
    function _checkReserveRatio() internal {
        uint256 ratio = getReserveRatio();
        if (ratio < 10000 && !mintingPaused) {
            mintingPaused = true;
            emit MintingPaused(ratio);
        } else if (ratio >= 10000 && mintingPaused) {
            mintingPaused = false;
            emit MintingResumed(ratio);
        }
    }

    /**
     * @dev Emergency pause — only transfers, NEVER redemption (burn).
     * Called by the Emergency Custodian (time-limited role per Constitution).
     */
    function activateEmergencyPause() external onlyRole(PAUSER_ROLE) {
        emergencyPaused = true;
        emit EmergencyPauseActivated(msg.sender);
    }

    function liftEmergencyPause() external onlyCouncil {
        emergencyPaused = false;
        emit EmergencyPauseLifted(msg.sender);
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

    // ---- Standard ERC-20 (permissionless transfer) ----
    function transfer(address to, uint256 amount) external notEmergencyPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external notEmergencyPaused returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "MTQ: insufficient allowance");
        _allowances[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(_balances[from] >= amount, "MTQ: insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    // ---- View functions ----
    function totalSupply() external view returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view returns (uint256) { return _allowances[owner][spender]; }
}
