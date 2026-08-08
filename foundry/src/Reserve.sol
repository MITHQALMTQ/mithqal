// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Reserve Vault
 * @dev The on-chain ledger of the Mithqal Institution's reserve assets.
 *
 * Architectural role (v19.0 blueprint §22-26 — Reserve Tiering):
 *   - Tier 1: Physical gold & silver (allocated, audited quarterly)
 *   - Tier 2: Cash & cash equivalents (USDC, USDT, T-Bills)
 *   - Tier 3: Sovereign Islamic bonds (Sukuk, Sharia-compliant)
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ ⚠️  KNOWN DEFECT — ON-CHAIN TIER MISMATCH (F-HIGH-3)              │
 * │                                                                    │
 * │ The on-chain tier definitions above DIFFER from the                │
 * │ constitutional 4-tier model in docs/blueprint/blueprint.txt        │
 * │ §Article III (Reserve Principles):                                 │
 * │                                                                    │
 * │   Constitution Tier 1 = Central-Bank-Quality Cash                  │
 * │   Constitution Tier 2 = Short-Duration Sovereign Securities        │
 * │   Constitution Tier 3 = Allocated Physical Bullion (gold+silver)   │
 * │   Constitution Tier 4 = Operational Liquidity (stablecoins)        │
 * │                                                                    │
 * │   On-chain Tier 1    = Physical gold & silver  (≠ constitution)    │
 * │   On-chain Tier 2    = Cash & cash equivalents (≠ constitution)    │
 * │   On-chain Tier 3    = Sukuk                    (≠ constitution)    │
 * │   On-chain Tier 4    = (not present)                                │
 * │                                                                    │
 * │ This is a pre-existing defect documented in                        │
 * │ docs/blueprint/custody-framework-v2.md §11.3.                      │
 * │                                                                    │
 * │ RECONCILIATION PLAN:                                               │
 * │   The deployed bytecode CANNOT be changed without redeployment     │
 * │   (which would change the contract address and break the           │
 * │   existing 3-chain deployment). The reconciliation will happen     │
 * │   in a future contract upgrade (v2.0) after the Safe Multi-Sig     │
 * │   is operationalized (3-of-5 with 5 named institutional signers).  │
 * │                                                                    │
 * │   Until then, the off-chain application (src/lib/audit-data.ts,    │
 * │   src/lib/v19-infrastructure.ts) uses the constitutional 4-tier    │
 * │   model as the source of truth; the on-chain 3-tier model is a     │
 * │   simplified projection.                                           │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * This contract is the SINGLE SOURCE OF TRUTH for the reserve balance read
 * by the Algorithm, the Oracle (Proof-of-Reserves feed), and the off-chain
 * dashboard. It does NOT hold the assets themselves — those are held by
 * qualified custodians off-chain — but it maintains the cryptographic
 * attestation ledger that links each MTQ token to a verified reserve.
 *
 * Invariants (Constitution Article II, §22):
 *   - Only MINTER_ROLE can call depositReserve() (the Mint gateway, post-
 *     verified deposit)
 *   - Only REDEEMER_ROLE can call withdrawReserve() (the Redeem gateway,
 *     post-verified burn)
 *   - Reserve balance can NEVER go negative (Solidity 0.8.x checked arithmetic)
 *   - Tier composition must always sum to total reserve (conservation)
 *
 * Deployed at: 0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177 (Monad)
 *              0x27a1a201D6DF8215d0b0da3Be6211bE24ef4c471 (Arc)
 *              0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 (Local Anvil)
 * Network:     Multi-chain — see src/lib/chains.ts (Monad Testnet 10143, Arc Testnet 5042002, Local Anvil 1337)
 */

// slither-disable-next-line missing-inheritance
contract Reserve {
    // ---- Roles ----
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE"); // Reserve Oracle (attestations)

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- Reserve tiers (v19.0 blueprint §22) ----
    // Tier values stored in USD with 18 decimals (matches MTQ).
    uint256 public tier1Usd; // Physical gold & silver
    uint256 public tier2Usd; // Cash & cash equivalents
    uint256 public tier3Usd; // Sukuk (Sharia-compliant sovereign bonds)

    uint256 public totalReserveUsd;
    uint256 public lastAttestationTimestamp;
    bytes32 public lastPorHash; // Proof-of-Reserves report hash

    // ---- Events ----
    event ReserveDeposited(address indexed minter, uint256 amountUsd, uint8 tier, bytes32 depositProof);
    event ReserveWithdrawn(address indexed redeemer, uint256 amountUsd, bytes32 burnProof);
    event ReserveAttested(uint256 totalReserveUsd, bytes32 indexed porHash, uint64 timestamp);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    // ---- Modifiers ----
    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender], "Reserve: unauthorized role");
        _;
    }

    modifier onlyCouncil() {
        require(_roles[COUNCIL_ROLE][msg.sender], "Reserve: only Council");
        _;
    }

    constructor() {
        // Deployer is the initial Council + Minter + Redeemer + Oracle
        // (transferred to the Mint/Redeem contracts + Safe Multi-Sig post-deploy).
        _roles[COUNCIL_ROLE][msg.sender] = true;
        _roles[MINTER_ROLE][msg.sender] = true;
        _roles[REDEEMER_ROLE][msg.sender] = true;
        _roles[ORACLE_ROLE][msg.sender] = true;
        emit RoleGranted(COUNCIL_ROLE, msg.sender);
        emit RoleGranted(MINTER_ROLE, msg.sender);
        emit RoleGranted(REDEEMER_ROLE, msg.sender);
        emit RoleGranted(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Deposit reserves against a verified deposit.
     *      Called by the Mint contract (MINTER_ROLE) after a physical/cash
     *      deposit has been verified by the off-chain custodian.
     * @param amountUsd     USD value of the deposit (18 decimals)
     * @param tier          1 = gold/silver, 2 = cash, 3 = sukuk
     * @param depositProof  Oracle attestation hash linking deposit <-> mint
     */
    function depositReserve(uint256 amountUsd, uint8 tier, bytes32 depositProof)
        external
        onlyRole(MINTER_ROLE)
    {
        require(amountUsd > 0, "Reserve: zero deposit");
        require(tier >= 1 && tier <= 3, "Reserve: invalid tier");
        require(depositProof != bytes32(0), "Reserve: missing proof");

        if (tier == 1) {
            tier1Usd += amountUsd;
        } else if (tier == 2) {
            tier2Usd += amountUsd;
        } else {
            tier3Usd += amountUsd;
        }

        totalReserveUsd += amountUsd;
        emit ReserveDeposited(msg.sender, amountUsd, tier, depositProof);
    }

    /**
     * @dev Withdraw reserves against a verified burn.
     *      Called by the Redeem contract (REDEEMER_ROLE) after MTQ has been
     *      burned. Withdrawals are taken pro-rata from all tiers to preserve
     *      tier composition (conservation invariant).
     * @param amountUsd    USD value to withdraw (18 decimals)
     * @param burnProof    Hash linking the burn tx to this withdrawal
     */
    function withdrawReserve(uint256 amountUsd, bytes32 burnProof) external onlyRole(REDEEMER_ROLE) {
        require(amountUsd > 0, "Reserve: zero withdrawal");
        require(burnProof != bytes32(0), "Reserve: missing burn proof");
        require(totalReserveUsd >= amountUsd, "Reserve: insufficient balance");

        // Pro-rata withdrawal across all tiers (preserves composition).
        uint256 fromTier1 = (tier1Usd * amountUsd) / totalReserveUsd;
        uint256 fromTier2 = (tier2Usd * amountUsd) / totalReserveUsd;
        uint256 fromTier3 = amountUsd - fromTier1 - fromTier2; // remainder to tier 3

        tier1Usd -= fromTier1;
        tier2Usd -= fromTier2;
        tier3Usd -= fromTier3;
        totalReserveUsd -= amountUsd;

        emit ReserveWithdrawn(msg.sender, amountUsd, burnProof);
    }

    /**
     * @dev Attest reserves — called by the Reserve Oracle (ORACLE_ROLE) to
     *      update the Proof-of-Reserves hash. The off-chain custodian
     *      signs the quarterly audit report; the Oracle relays the hash.
     * @param porHash  Hash of the Proof-of-Reserves audit report
     */
    function attestReserves(bytes32 porHash) external onlyRole(ORACLE_ROLE) {
        require(porHash != bytes32(0), "Reserve: missing PoR hash");
        lastAttestationTimestamp = block.timestamp;
        lastPorHash = porHash;
        emit ReserveAttested(totalReserveUsd, porHash, uint64(block.timestamp));
    }

    /**
     * @notice Get the total reserve balance (USD, 18 decimals).
     */
    function getReserveBalance() external view returns (uint256) {
        return totalReserveUsd;
    }

    /**
     * @notice Get the tier composition (Tier1, Tier2, Tier3, Total).
     * @dev Used by the dashboard's reserve-tiering breakdown chart.
     */
    function getTierComposition()
        external
        view
        returns (uint256 t1, uint256 t2, uint256 t3, uint256 total)
    {
        return (tier1Usd, tier2Usd, tier3Usd, totalReserveUsd);
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
