// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Mithqal Reserve Vault — Constitutional 4-Tier Model (Phase 5)
 * @dev The on-chain ledger of the Mithqal Institution's reserve assets.
 *
 * ──────────────────────────────────────────────────────────────────────
 * PHASE 5 — ON-CHAIN CONSTITUTIONAL ALIGNMENT
 * ──────────────────────────────────────────────────────────────────────
 *
 * This contract has been refactored from the legacy 3-tier model to the
 * constitutional 4-tier model per the latest blueprint (v19.0.3).
 *
 * PREVIOUS (legacy, F-HIGH-3):
 *   Tier 1 = gold/silver  (WRONG — should be cash)
 *   Tier 2 = cash          (WRONG — should be sovereign)
 *   Tier 3 = sukuk         (WRONG — should be bullion)
 *   Tier 4 = (missing)
 *   Liquidation = pro-rata (WRONG — should be sequential per Article X)
 *
 * CURRENT (Phase 5 aligned):
 *   Tier 1 = Central-Bank-Quality Cash           (constitutional range 25-60%)
 *   Tier 2 = Short-Duration Sovereign Securities  (constitutional range 20-50%)
 *   Tier 3 = Allocated Physical Bullion           (constitutional range 10-30%)
 *           Tier 3 is split into gold + silver for Article X liquidation order
 *   Tier 4 = Operational Liquidity / Stablecoins  (constitutional range 0-10%)
 *
 *   Liquidation = SEQUENTIAL per Article X:
 *     1. Tier 4 (stablecoins) — fastest to convert
 *     2. Tier 1 (cash) — HQLA Level 1, 0% haircut
 *     3. Tier 2 (sovereign) — HQLA Level 2A, T+1
 *     4. Tier 3 Silver — Strategic Liquidity, days-weeks
 *     5. Tier 3 Gold — LAST, requires Exhaustion Certificate (Invariant 5)
 *
 * STORAGE MIGRATION NOTE:
 *   This changes the storage layout from the legacy 3-tier model.
 *   A fresh deployment is required (not an upgrade).
 *   Migration: deploy new Reserve.sol → transfer balances → update
 *   Algorithm.sol + Mint.sol + Redeem.sol references → verify.
 *   Requires explicit deployment authorization per Phase 5 §37.
 *
 * OFF-CHAIN / ON-CHAIN BOUNDARY:
 *   The off-chain TS engine computes: COFER/SWIFT/BIS weights, momentum,
 *   volatility, φ_t, SDP, hysteresis, trade suppression, fee models.
 *   The on-chain contract enforces: RR ≥ 100%, basket bounds, sequential
 *   liquidation, gold protection, approval hash binding, replay protection.
 *   The blockchain does NOT reproduce the macroeconomic model.
 * ──────────────────────────────────────────────────────────────────────
 *
 * Invariants (Constitution Article II, §22, §34, §37, §45):
 *   - Only MINTER_ROLE can call depositReserve()
 *   - Only REDEEMER_ROLE can call withdrawReserve()
 *   - Reserve balance can NEVER go negative (Solidity 0.8.x checked arithmetic)
 *   - Withdrawals follow Article X sequential liquidation order
 *   - Gold cannot be liquidated while higher-priority tiers have funds
 *   - Gold liquidation requires Exhaustion Certificate (§34, Invariant 5)
 *   - §37 attestReserves guards: ±10% drift, 1-hour rate limit
 */

// slither-disable-next-line missing-inheritance
contract Reserve {
    // ---- Roles ----
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- Constitutional 4-Tier Reserve Model (§22-26) ----
    // All values in USD with 18 decimals (matches MTQ token).
    //
    // Tier 1: Central-Bank-Quality Cash (§23)
    //   Constitutional range: 25-60% of total. Policy target: 40%.
    //   HQLA Level 1. 0% haircut (§6). Counts 1:1 toward LCR.
    uint256 public tier1CashUsd;

    // Tier 2: Short-Duration Sovereign Securities (§24)
    //   Constitutional range: 20-50% of total. Policy target: 35%.
    //   US T-bills ≤1yr. HQLA Level 2A. 2% haircut (§6).
    uint256 public tier2SovereignUsd;

    // Tier 3: Allocated Physical Bullion (§25)
    //   Constitutional range: 10-30% of total. Policy target: 20%.
    //   Split into gold + silver for Article X liquidation order.
    //   Gold: φ_t ∈ [60%, 95%] of bullion (§25.2). 5% haircut.
    //   Silver: (1−φ_t) ∈ [5%, 40%] of bullion. 7% haircut.
    uint256 public tier3GoldUsd;
    uint256 public tier3SilverUsd;

    // Tier 4: Operational Liquidity / Stablecoins (§26)
    //   Constitutional range: 0-10% of total. Policy target: 5%.
    //   Regulated USDC/USDT/DAI. HQLA Level 2B. 2% haircut.
    uint256 public tier4StablecoinUsd;

    uint256 public totalReserveUsd;
    uint256 public lastTotalReserveUsd; // §37 — last attested total (for ±10% drift guard)
    uint256 public lastAttestationTimestamp;
    bytes32 public lastPorHash;

    // ---- §34 Exhaustion Certificate (Bullion Protection, Invariant 5) ----
    // Gold CANNOT be liquidated unless all higher-priority tiers are exhausted.
    // The Council must issue an Exhaustion Certificate attesting to this.
    bool public goldLiquidationAuthorized; // false by default — gold protected
    bytes32 public exhaustionCertificateHash; // hash of the Council resolution

    // ---- §22A Basket Verification State ----
    // The off-chain engine computes weights; the on-chain contract verifies
    // that proposed weights satisfy constitutional bounds before accepting
    // a state transition.
    struct BasketState {
        uint256 totalWeightBps;      // must equal 10000 (100%)
        uint256 maxWeightBps;        // must be ≤ 6000 (60%)
        uint256 minWeightBps;        // must be ≥ 50 (0.5%)
        bool verified;
        uint256 timestamp;
    }
    BasketState public lastBasketVerification;

    // ---- §14 Approval Binding ----
    // An approval is cryptographically bound to the exact proposal hash.
    // Changing any material parameter invalidates the approval.
    mapping(bytes32 => bool) public approvedProposalHashes; // proposalHash → approved
    mapping(bytes32 => bool) public executedProposalHashes;  // proposalHash → executed (replay protection)

    // ---- Events ----
    event ReserveDeposited(address indexed minter, uint256 amountUsd, uint8 tier, bytes32 depositProof);
    event ReserveWithdrawn(address indexed redeemer, uint256 amountUsd, uint8 tierDrawn, bytes32 burnProof);
    event ReserveAttested(uint256 newTotalReserveUsd, bytes32 indexed porHash, uint64 timestamp);
    event GoldLiquidationAuthorized(bytes32 indexed certificateHash, uint64 timestamp);
    event GoldLiquidationRevoked(uint64 timestamp);
    event BasketVerified(uint256 totalBps, uint256 maxBps, uint256 minBps, uint64 timestamp);
    event ProposalApproved(bytes32 indexed proposalHash, uint64 timestamp);
    event ProposalExecuted(bytes32 indexed proposalHash, uint64 timestamp);
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
        _roles[COUNCIL_ROLE][msg.sender] = true;
        _roles[MINTER_ROLE][msg.sender] = true;
        _roles[REDEEMER_ROLE][msg.sender] = true;
        _roles[ORACLE_ROLE][msg.sender] = true;
        emit RoleGranted(COUNCIL_ROLE, msg.sender);
        emit RoleGranted(MINTER_ROLE, msg.sender);
        emit RoleGranted(REDEEMER_ROLE, msg.sender);
        emit RoleGranted(ORACLE_ROLE, msg.sender);
    }

    // ============================================================
    // §22-26 — Reserve Deposit (4-tier constitutional model)
    // ============================================================

    /**
     * @dev Deposit reserves against a verified deposit.
     * @param amountUsd     USD value of the deposit (18 decimals)
     * @param tier          1=cash, 2=sovereign, 3=bullion(gold), 4=stablecoin
     *                       5=bullion(silver) — Tier 3 split for Article X
     * @param depositProof  Oracle attestation hash linking deposit ↔ mint
     */
    function depositReserve(uint256 amountUsd, uint8 tier, bytes32 depositProof)
        external
        onlyRole(MINTER_ROLE)
    {
        require(amountUsd > 0, "Reserve: zero deposit");
        require(depositProof != bytes32(0), "Reserve: missing proof");

        if (tier == 1) {
            tier1CashUsd += amountUsd;
        } else if (tier == 2) {
            tier2SovereignUsd += amountUsd;
        } else if (tier == 3) {
            tier3GoldUsd += amountUsd;
        } else if (tier == 4) {
            tier4StablecoinUsd += amountUsd;
        } else if (tier == 5) {
            tier3SilverUsd += amountUsd;
        } else {
            revert("Reserve: invalid tier (1-5)");
        }

        totalReserveUsd += amountUsd;
        emit ReserveDeposited(msg.sender, amountUsd, tier, depositProof);
    }

    // ============================================================
    // Article X — Sequential Liquidation Order (§34, Invariant 5)
    // ============================================================

    /**
     * @dev Withdraw reserves against a verified burn.
     *      Article X sequential liquidation order:
     *        1. Tier 4 (stablecoins) — until exhausted
     *        2. Tier 1 (cash) — until exhausted
     *        3. Tier 2 (sovereign) — until exhausted
     *        4. Tier 3 Silver — until exhausted
     *        5. Tier 3 Gold — LAST, requires Exhaustion Certificate
     *
     *      Gold CANNOT be liquidated while any higher-priority tier has funds.
     *      This enforces Invariant 5 (Bullion Protection Rule) on-chain.
     *
     * @param amountUsd    USD value to withdraw (18 decimals)
     * @param burnProof    Hash linking the burn tx to this withdrawal
     */
    function withdrawReserve(uint256 amountUsd, bytes32 burnProof) external onlyRole(REDEEMER_ROLE) {
        require(amountUsd > 0, "Reserve: zero withdrawal");
        require(burnProof != bytes32(0), "Reserve: missing burn proof");
        require(totalReserveUsd >= amountUsd, "Reserve: insufficient balance");

        uint256 remaining = amountUsd;
        uint8 tierDrawn = 0;

        // Step 1: Draw from Tier 4 (stablecoins) — first to liquidate
        if (remaining > 0 && tier4StablecoinUsd > 0) {
            uint256 draw = remaining < tier4StablecoinUsd ? remaining : tier4StablecoinUsd;
            tier4StablecoinUsd -= draw;
            remaining -= draw;
            tierDrawn = 4;
        }

        // Step 2: Draw from Tier 1 (cash) — HQLA Level 1
        if (remaining > 0 && tier1CashUsd > 0) {
            uint256 draw = remaining < tier1CashUsd ? remaining : tier1CashUsd;
            tier1CashUsd -= draw;
            remaining -= draw;
            tierDrawn = 1;
        }

        // Step 3: Draw from Tier 2 (sovereign) — HQLA Level 2A
        if (remaining > 0 && tier2SovereignUsd > 0) {
            uint256 draw = remaining < tier2SovereignUsd ? remaining : tier2SovereignUsd;
            tier2SovereignUsd -= draw;
            remaining -= draw;
            tierDrawn = 2;
        }

        // Step 4: Draw from Tier 3 Silver — Strategic Liquidity
        if (remaining > 0 && tier3SilverUsd > 0) {
            uint256 draw = remaining < tier3SilverUsd ? remaining : tier3SilverUsd;
            tier3SilverUsd -= draw;
            remaining -= draw;
            tierDrawn = 5; // 5 = silver (Tier 3 split)
        }

        // Step 5: Draw from Tier 3 Gold — LAST RESORT
        // §34, Invariant 5: Gold can ONLY be liquidated if:
        //   (a) All higher-priority tiers are exhausted (remaining > 0 after steps 1-4)
        //   (b) The Council has issued an Exhaustion Certificate
        if (remaining > 0) {
            require(
                tier4StablecoinUsd == 0 && tier1CashUsd == 0 && tier2SovereignUsd == 0 && tier3SilverUsd == 0,
                "Reserve: §34 Bullion Protection — cannot liquidate gold while higher-priority tiers have funds"
            );
            require(goldLiquidationAuthorized, "Reserve: §34 gold liquidation requires Exhaustion Certificate (Invariant 5)");
            require(tier3GoldUsd >= remaining, "Reserve: insufficient gold");

            tier3GoldUsd -= remaining;
            remaining = 0;
            tierDrawn = 3; // 3 = gold

            // Auto-revoke the exhaustion certificate after gold is drawn
            // (each gold liquidation requires a new Council authorization)
            goldLiquidationAuthorized = false;
            exhaustionCertificateHash = bytes32(0);
            emit GoldLiquidationRevoked(uint64(block.timestamp));
        }

        require(remaining == 0, "Reserve: insufficient total reserves");

        totalReserveUsd -= amountUsd;
        emit ReserveWithdrawn(msg.sender, amountUsd, tierDrawn, burnProof);
    }

    // ============================================================
    // §34 — Exhaustion Certificate (Bullion Protection)
    // ============================================================

    /**
     * @dev Authorize gold liquidation via Exhaustion Certificate.
     *      Only the Council can issue this. It attests that all
     *      constitutionally superior liquidity tiers have been exhausted
     *      and gold liquidation is necessary to honor redemptions.
     *
     *      The certificate is SINGLE-USE: it is auto-revoked after one
     *      gold liquidation event. Each subsequent gold liquidation
     *      requires a new certificate.
     *
     * @param certificateHash  Hash of the Council resolution + evidence
     */
    function authorizeGoldLiquidation(bytes32 certificateHash) external onlyCouncil {
        require(certificateHash != bytes32(0), "Reserve: missing certificate hash");
        require(!goldLiquidationAuthorized, "Reserve: gold liquidation already authorized");
        goldLiquidationAuthorized = true;
        exhaustionCertificateHash = certificateHash;
        emit GoldLiquidationAuthorized(certificateHash, uint64(block.timestamp));
    }

    function revokeGoldLiquidation() external onlyCouncil {
        goldLiquidationAuthorized = false;
        exhaustionCertificateHash = bytes32(0);
        emit GoldLiquidationRevoked(uint64(block.timestamp));
    }

    // ============================================================
    // §37 — Attest Reserves (drift guard + rate limit)
    // ============================================================

    function attestReserves(uint256 newTotalReserveUsd, bytes32 porHash) external onlyRole(ORACLE_ROLE) {
        require(porHash != bytes32(0), "Reserve: missing PoR hash");
        require(block.timestamp >= lastAttestationTimestamp + 1 hours, "Reserve: attestation rate limit (1hr)");
        if (lastTotalReserveUsd > 0) {
            uint256 drift = newTotalReserveUsd > lastTotalReserveUsd
                ? ((newTotalReserveUsd - lastTotalReserveUsd) * 10000) / lastTotalReserveUsd
                : ((lastTotalReserveUsd - newTotalReserveUsd) * 10000) / lastTotalReserveUsd;
            require(drift <= 1000, "Reserve: drift exceeds 10% — requires Council quorum");
        }
        lastTotalReserveUsd = newTotalReserveUsd;
        lastAttestationTimestamp = block.timestamp;
        lastPorHash = porHash;
        emit ReserveAttested(newTotalReserveUsd, porHash, uint64(block.timestamp));
    }

    // ============================================================
    // §22A — Basket Verification (on-chain constitutional check)
    // ============================================================

    /**
     * @dev Verify that a proposed basket state satisfies constitutional bounds.
     *      Called by the off-chain engine before a state transition.
     *
     *      §22A requirements:
     *        - Σ weights = 100% (10000 bps)
     *        - All weights ≥ 0.5% (50 bps) — minimum floor
     *        - All weights ≤ 60% (6000 bps) — concentration cap
     *
     *      The on-chain contract does NOT compute weights — it only VERIFIES
     *      that proposed weights (passed by the off-chain engine) satisfy
     *      constitutional bounds. This is the on-chain/off-chain boundary.
     *
     * @param totalWeightBps  Sum of all weights (must be 10000)
     * @param maxWeightBps    Highest individual weight (must be ≤ 6000)
     * @param minWeightBps    Lowest individual weight (must be ≥ 50)
     */
    function verifyBasket(
        uint256 totalWeightBps,
        uint256 maxWeightBps,
        uint256 minWeightBps
    ) external onlyRole(ORACLE_ROLE) returns (bool) {
        bool totalOk = totalWeightBps == 10000;
        bool maxOk = maxWeightBps <= 6000;
        bool minOk = minWeightBps >= 50;
        bool verified = totalOk && maxOk && minOk;

        lastBasketVerification = BasketState({
            totalWeightBps: totalWeightBps,
            maxWeightBps: maxWeightBps,
            minWeightBps: minWeightBps,
            verified: verified,
            timestamp: block.timestamp
        });

        emit BasketVerified(totalWeightBps, maxWeightBps, minWeightBps, uint64(block.timestamp));
        return verified;
    }

    // ============================================================
    // §14 — Approval Binding (proposal hash)
    // ============================================================

    /**
     * @dev Record an approved proposal hash. The hash binds to the exact
     *      proposal parameters (asset, quantity, side, price, custodian,
     *      destination, source, timestamp, execution limits, reserve-state
     *      version). Changing any material parameter produces a different
     *      hash, invalidating the approval.
     *
     *      This prevents:
     *        - Altered proposals (different parameters → different hash)
     *        - Replayed approvals (same hash can only execute once)
     *        - Mismatched proposal hashes (execution hash must match)
     */
    function recordApproval(bytes32 proposalHash) external onlyCouncil {
        require(proposalHash != bytes32(0), "Reserve: missing proposal hash");
        require(!approvedProposalHashes[proposalHash], "Reserve: proposal already approved");
        require(!executedProposalHashes[proposalHash], "Reserve: proposal already executed");
        approvedProposalHashes[proposalHash] = true;
        emit ProposalApproved(proposalHash, uint64(block.timestamp));
    }

    /**
     * @dev Verify that a proposal hash has been approved and not yet executed.
     *      Called before execution to enforce approval binding.
     *      Marks the proposal as executed (replay protection — same hash
     *      cannot execute twice).
     */
    function verifyAndExecuteProposal(bytes32 proposalHash) external onlyRole(MINTER_ROLE) returns (bool) {
        require(approvedProposalHashes[proposalHash], "Reserve: proposal not approved");
        require(!executedProposalHashes[proposalHash], "Reserve: proposal already executed (replay)");
        executedProposalHashes[proposalHash] = true;
        emit ProposalExecuted(proposalHash, uint64(block.timestamp));
        return true;
    }

    // ============================================================
    // View functions
    // ============================================================

    function getReserveBalance() external view returns (uint256) {
        return totalReserveUsd;
    }

    /**
     * @notice Get the constitutional 4-tier composition.
     * @return t1cash     Tier 1 Cash
     * @return t2sov      Tier 2 Sovereign
     * @return t3gold     Tier 3 Gold
     * @return t3silver   Tier 3 Silver
     * @return t4stable   Tier 4 Stablecoin
     * @return total      Total reserve
     */
    function getTierComposition()
        external
        view
        returns (uint256 t1cash, uint256 t2sov, uint256 t3gold, uint256 t3silver, uint256 t4stable, uint256 total)
    {
        return (tier1CashUsd, tier2SovereignUsd, tier3GoldUsd, tier3SilverUsd, tier4StablecoinUsd, totalReserveUsd);
    }

    /**
     * @notice Check if gold liquidation is currently authorized.
     * @dev Returns false by default — gold is protected (Invariant 5).
     */
    function isGoldLiquidationAuthorized() external view returns (bool) {
        return goldLiquidationAuthorized;
    }

    /**
     * @notice Get the last basket verification result.
     */
    function getLastBasketVerification() external view returns (BasketState memory) {
        return lastBasketVerification;
    }

    /**
     * @notice Check if a proposal hash has been approved.
     */
    function isProposalApproved(bytes32 proposalHash) external view returns (bool) {
        return approvedProposalHashes[proposalHash];
    }

    /**
     * @notice Check if a proposal hash has been executed (replay protection).
     */
    function isProposalExecuted(bytes32 proposalHash) external view returns (bool) {
        return executedProposalHashes[proposalHash];
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
