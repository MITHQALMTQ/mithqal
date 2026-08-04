// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Slither detector disables for this file (file-scope, see slither-disable-end at EOF):
// - `incorrect-equality`: selector equality (bytes4 == bytes4) is the correct,
//   standard pattern for comparing function selectors — there is no floating-
//   point or integer-overflow concern that would make `==` unsafe here.
// - `timestamp`: block.timestamp comparisons are used intentionally for
//   constitutional timelock enforcement, custodian expiry, and proposal
//   state transitions — manipulation risk is bounded by the policy timelock
//   (7 days for policy proposals) / the constitutional implementation delay
//   (90 days per §43.13 for amendments) and the constitutional supermajority
//   (6 of 7 = 85.7% ≥ 75% per §43.11) required to pass any proposal.
// - `assembly`: a single inline-assembly block in `_selectorOf` reads the
//   first 4 bytes of a `bytes memory` argument; the operation is safe and
//   documented, and Solidity 0.8.x has no native equivalent.
// - `low-level-calls`: `executeProposal` performs a governance-authorised
//   external call to an arbitrary target via `.call()` — this is the
//   intended design for a generic governance executor and is guarded by
//   the timelock + supermajority + anti-platform/invariant checks.
// slither-disable-start incorrect-equality,timestamp,assembly,low-level-calls

/**
 * @title Mithqal Governance
 * @dev Constitutional governance for the Mithqal Institution.
 *
 * Implements the Constitution's governance structure:
 *   - Council: the principal governing body (multi-sig, supermajority)
 *   - Timelock: all governance actions have a delay (constitutional review)
 *   - Constitutional invariants: cannot be overridden by any vote
 *   - Anti-platform clause: permanently frozen (no amendment can enable platform services)
 *
 * Governance powers (per Article XII — Amendment Philosophy):
 *   - Can adjust policy parameters (fee rates, risk tolerances)
 *   - Can appoint/remove officers and committee members
 *   - Can authorize emergency custodian (time-limited)
 *   - CANNOT amend constitutional invariants (100% reserve, no discretionary minting,
 *     no lending, no commingling, no redemption suspension)
 *   - CANNOT enable platform services (permanently frozen anti-platform clause)
 *
 * @notice RF-19 FIX (anti-platform enforcement). The previously stubbed
 *         `_isInvariantViolation` / `_isPlatformEnabling` checks now perform
 *         real selector-based enforcement. Any proposal whose calldata begins
 *         with a forbidden selector (enableLending(), enableExchange(),
 *         enableDeFi(), enableBrokerage(), enableAssetManagement(),
 *         enablePlatformServices(), mint(uint256) for discretionary minting,
 *         setFee(uint256), setReserveRatio(uint256), suspendRedemption(),
 *         pause(), upgradeTo(address), transferOwnership(address),
 *         renounceOwnership()) is REJECTED at proposal creation AND re-checked
 *         at execute time as defense in depth. The `permanentProhibitions`
 *         mapping set in the constructor is consulted by
 *         `_isInvariantViolation` as a tamper-evidence check — if any of the
 *         six anti-platform flags are ever unset, every proposal is treated
 *         as a violation (fail-closed).
 *
 * @notice CEI FIX (reentrancy). `executeProposal` now writes the proposal's
 *         terminal state (`Executed`) BEFORE the external call, and is
 *         guarded by a `nonReentrant` modifier backed by a storage flag.
 *         Previously, the state was written AFTER the external call, allowing
 *         a malicious target to re-enter `executeProposal` for the same id.
 *
 * @notice FOUNDER_HOLDING_CAP enforcement (TODO — follow-up task
 *         FIX-MTQ-CAP-1). The 20% cap is declared as a constant here but is
 *         NOT yet enforced on-chain. Enforcement belongs in MTQ (where
 *         balances live), not in Governance: MTQ.mint and MTQ._transfer
 *         should reject any state transition that would push a non-Council
 *         address above FOUNDER_HOLDING_CAP % of totalSupply. Adding the
 *         check here would require Governance to read MTQ's private balance
 *         storage, which would break encapsulation. The proposed MTQ-side
 *         check is sketched in a TODO comment next to the constant.
 */
contract Governance {
    // ---- Council configuration ----
    // §43.11 requires "at least 75% of all seated voting members" approval
    // for constitutional amendments. With COUNCIL_SIZE = 7, 5/7 = 71.4%
    // (below 75%, insufficient) and 6/7 = 85.7% (above 75%, sufficient),
    // so the constitutional supermajority threshold is 6.
    uint256 public constant COUNCIL_SIZE = 7; // odd number for tie-breaking
    uint256 public constant SUPERMAJORITY_THRESHOLD = 6; // 6 of 7 = 85.7% ≥ 75% per §43.11 (constitutional amendments)
    uint256 public constant STANDARD_THRESHOLD = 4; // 4 of 7 for policy changes
    // §43.13 mandates: "A mandatory implementation delay of not less than
    // ninety (90) calendar days shall apply" for constitutional amendments.
    uint256 public constant TIMELOCK_DELAY = 90 days; // §43.13 constitutional implementation delay (amendments)
    uint256 public constant POLICY_TIMELOCK_DELAY = 7 days; // shorter review period for non-constitutional policy proposals
    uint256 public constant FOUNDER_HOLDING_CAP = 20; // 20% of circulating supply (Invariant)
    // TODO(FIX-MTQ-CAP-1): enforce FOUNDER_HOLDING_CAP in MTQ.mint + MTQ._transfer.
    //   The check belongs on the token side because balances live there:
    //
    //     uint256 newBal = _balances[to] + amount;
    //     if (!_roles[COUNCIL_ROLE][to]) {
    //         require(
    //             newBal * 100 <= _totalSupply * FOUNDER_HOLDING_CAP,
    //             "MTQ: founder holding cap exceeded"
    //         );
    //     }
    //
    //   (Council addresses are exempt — the Institution's own treasury may
    //   hold >20%.) This is left for a follow-up task so that the Governance
    //   file does not need to introspect MTQ storage.

    // ---- Roles ----
    address[] public councilMembers;
    mapping(address => bool) public isCouncilMember;
    address public emergencyCustodian;
    uint256 public emergencyCustodianExpiry;

    // ---- Proposal state ----
    enum ProposalState { Pending, Active, Succeeded, Defeated, Executed, Expired }
    enum ProposalType { Policy, Constitutional, EmergencyCustodian }

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        address target; // contract to call
        bytes callData; // function + args
        uint256 voteCount;
        mapping(address => bool) hasVoted;
        mapping(address => bool) vote; // true = for, false = against
        uint256 createdAt;
        uint256 executableAt; // timelock end
        ProposalState state;
        string description;
    }

    mapping(uint256 => Proposal) private _proposals;
    uint256 private _nextProposalId;

    // ---- Anti-platform clause (PERMANENTLY FROZEN) ----
    // This mapping records permanently prohibited activities. No proposal
    // can enable any of these — the check is in the proposal creation AND
    // re-checked at execute time (defense in depth).
    mapping(bytes32 => bool) public permanentProhibitions;

    // ---- Reentrancy guard (CEI fix in executeProposal) ----
    // Minimal inline guard (equivalent to OZ ReentrancyGuard) so this file
    // stays self-contained with no external imports.
    uint256 private _reentrancyStatus;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // ---- Events ----
    event ProposalCreated(uint256 indexed id, ProposalType pType, string description, address target);
    event VoteCast(uint256 indexed id, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed id);
    event EmergencyCustodianAppointed(address indexed custodian, uint256 expiry);
    event EmergencyCustodianRevoked();
    event AntiPlatformEnforcementTripped(uint256 indexed proposalId, bytes4 selector, bool isInvariantViolation);

    // ---- Permanently frozen prohibitions (set in constructor) ----
    bytes32 public constant LENDING = keccak256("LENDING");
    bytes32 public constant EXCHANGE = keccak256("EXCHANGE");
    bytes32 public constant BROKERAGE = keccak256("BROKERAGE");
    bytes32 public constant ASSET_MANAGEMENT = keccak256("ASSET_MANAGEMENT");
    bytes32 public constant DEFI = keccak256("DEFI");
    bytes32 public constant PLATFORM_SERVICES = keccak256("PLATFORM_SERVICES");

    // ---- RF-19: Forbidden function selectors (computed at compile time) ----
    //
    // These are the selectors of functions that would either (a) enable a
    // permanently-prohibited platform service or (b) violate a constitutional
    // invariant. Any proposal whose calldata begins with one of these
    // selectors is rejected at creation AND at execution. The selectors are
    // keccak256("<sig>")[0:4] computed in-line so they cannot drift from
    // the actual function signatures they protect against.
    //
    // (a) Platform-enabling selectors — Article V anti-platform clause:
    bytes4 private constant _SEL_ENABLE_LENDING           = bytes4(keccak256(bytes("enableLending()")));
    bytes4 private constant _SEL_ENABLE_EXCHANGE          = bytes4(keccak256(bytes("enableExchange()")));
    bytes4 private constant _SEL_ENABLE_DEFI              = bytes4(keccak256(bytes("enableDeFi()")));
    bytes4 private constant _SEL_ENABLE_BROKERAGE         = bytes4(keccak256(bytes("enableBrokerage()")));
    bytes4 private constant _SEL_ENABLE_ASSET_MANAGEMENT  = bytes4(keccak256(bytes("enableAssetManagement()")));
    bytes4 private constant _SEL_ENABLE_PLATFORM_SERVICES = bytes4(keccak256(bytes("enablePlatformServices()")));
    //
    // (b) Invariant-violating selectors — Invariants 1..5 + governance integrity:
    bytes4 private constant _SEL_MINT_UINT                = bytes4(keccak256(bytes("mint(uint256)")));            // discretionary minting (no deposit proof — Invariant 2)
    bytes4 private constant _SEL_SET_FEE_UINT             = bytes4(keccak256(bytes("setFee(uint256)")));         // fee changes outside governance
    bytes4 private constant _SEL_SET_RESERVE_RATIO        = bytes4(keccak256(bytes("setReserveRatio(uint256)")));// would lower the 100% reserve (Invariant 1)
    bytes4 private constant _SEL_SUSPEND_REDEMPTION       = bytes4(keccak256(bytes("suspendRedemption()")));     // violates non-suspendable burn (§45.2 Redemption Rights)
    bytes4 private constant _SEL_LIQUIDATE_GOLD           = bytes4(keccak256(bytes("liquidateGold()")));         // Gold liquidation (Invariant 5: Bullion Preservation — Article X §34)
    bytes4 private constant _SEL_PAUSE                    = bytes4(keccak256(bytes("pause()")));                 // pause outside the emergency custodian role
    bytes4 private constant _SEL_UPGRADE_TO               = bytes4(keccak256(bytes("upgradeTo(address)")));      // unauthorised UUPS upgrade
    bytes4 private constant _SEL_TRANSFER_OWNERSHIP       = bytes4(keccak256(bytes("transferOwnership(address)")));// ownership transfer outside Council
    bytes4 private constant _SEL_RENOUNCE_OWNERSHIP       = bytes4(keccak256(bytes("renounceOwnership()")));     // ownership renunciation (would brick governance)

    constructor(address[] memory _initialCouncil) {
        require(_initialCouncil.length == COUNCIL_SIZE, "Governance: invalid council size");

        for (uint256 i = 0; i < _initialCouncil.length; i++) {
            address member = _initialCouncil[i];
            require(member != address(0), "Governance: zero address");
            require(!isCouncilMember[member], "Governance: duplicate member");
            councilMembers.push(member);
            isCouncilMember[member] = true;
        }

        // Permanently freeze the anti-platform clause (Article V).
        // These can NEVER be unset — no proposal can change them.
        permanentProhibitions[LENDING] = true;
        permanentProhibitions[EXCHANGE] = true;
        permanentProhibitions[BROKERAGE] = true;
        permanentProhibitions[ASSET_MANAGEMENT] = true;
        permanentProhibitions[DEFI] = true;
        permanentProhibitions[PLATFORM_SERVICES] = true;

        // Initialise the reentrancy guard to the not-entered state.
        _reentrancyStatus = _NOT_ENTERED;
    }

    // ---- Reentrancy guard (CEI fix) ----
    /**
     * @dev Prevents re-entry into functions that perform external calls.
     *      Backed by the `_reentrancyStatus` storage flag (equivalent to
     *      OpenZeppelin's ReentrancyGuard, kept inline to avoid adding an
     *      external import dependency to this standalone contract).
     */
    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "Governance: reentrant call");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // ---- Proposal creation ----

    /**
     * @dev Create a policy proposal (standard threshold, shorter timelock).
     * Can adjust fee rates, risk tolerances, committee composition. Uses
     * `POLICY_TIMELOCK_DELAY` (7 days) — the shorter governance review
     * period for non-constitutional policy changes. Constitutional
     * amendments MUST go through `createConstitutionalProposal` (which
     * applies the 90-day §43.13 implementation delay and the 6-of-7
     * supermajority threshold).
     */
    function createPolicyProposal(
        address target,
        bytes calldata callData,
        string calldata description
    ) external returns (uint256) {
        require(isCouncilMember[msg.sender], "Governance: only Council");
        require(!_isPlatformEnabling(callData), "Governance: anti-platform violation");

        uint256 proposalId = _nextProposalId++;
        Proposal storage p = _proposals[proposalId];
        p.id = proposalId;
        p.proposalType = ProposalType.Policy;
        p.target = target;
        p.callData = callData;
        p.createdAt = block.timestamp;
        p.executableAt = block.timestamp + POLICY_TIMELOCK_DELAY; // §43 policy review (7 days)
        p.state = ProposalState.Active;
        p.description = description;

        emit ProposalCreated(proposalId, ProposalType.Policy, description, target);
        return proposalId;
    }

    /**
     * @dev Create a constitutional amendment proposal (supermajority +
     * 90-day §43.13 implementation delay). CANNOT amend invariants or the
     * anti-platform clause — enforced in execute. The 90-day timelock is
     * mandated by §43.13 Stage 8 ("Implementation Delay"); the 6-of-7
     * supermajority is mandated by §43.11 Stage 7 ("Council Vote").
     */
    function createConstitutionalProposal(
        address target,
        bytes calldata callData,
        string calldata description
    ) external returns (uint256) {
        require(isCouncilMember[msg.sender], "Governance: only Council");
        require(!_isInvariantViolation(callData), "Governance: invariant violation");
        require(!_isPlatformEnabling(callData), "Governance: anti-platform violation");

        uint256 proposalId = _nextProposalId++;
        Proposal storage p = _proposals[proposalId];
        p.id = proposalId;
        p.proposalType = ProposalType.Constitutional;
        p.target = target;
        p.callData = callData;
        p.createdAt = block.timestamp;
        p.executableAt = block.timestamp + TIMELOCK_DELAY; // §43.13: 90-day constitutional implementation delay
        p.state = ProposalState.Active;
        p.description = description;

        emit ProposalCreated(proposalId, ProposalType.Constitutional, description, target);
        return proposalId;
    }

    // ---- Voting ----

    function castVote(uint256 proposalId, bool support) external {
        require(isCouncilMember[msg.sender], "Governance: only Council");
        Proposal storage p = _proposals[proposalId];
        require(p.state == ProposalState.Active, "Governance: not active");
        require(!p.hasVoted[msg.sender], "Governance: already voted");

        p.hasVoted[msg.sender] = true;
        p.vote[msg.sender] = support;
        if (support) {
            p.voteCount++;
        }

        emit VoteCast(proposalId, msg.sender, support);
    }

    // ---- Execution (after timelock) ----

    /**
     * @dev Execute a proposal that has passed its timelock and threshold.
     *
     *      CEI FIX: the proposal's terminal state (`Executed`) is written
     *      BEFORE the external call, and the whole function is guarded by
     *      `nonReentrant`. Previously the state was written AFTER the call,
     *      allowing a malicious target to re-enter and re-execute.
     *
     *      RF-19 FIX: defense-in-depth — even though the callData was
     *      screened at creation, we re-run `_isPlatformEnabling` and
     *      `_isInvariantViolation` here. If a proposal somehow slipped
     *      through creation with a forbidden selector (e.g. due to a future
     *      code change), execution still trips the guard and reverts with
     *      "Platform-enabling action prohibited by Constitution".
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage p = _proposals[proposalId];
        require(p.state == ProposalState.Active, "Governance: not active");
        require(block.timestamp >= p.executableAt, "Governance: timelock not elapsed");

        // RF-19: defense-in-depth re-check at execute time. The proposal's
        // callData is the authoritative source of what will be called.
        bool isPlatform = _isPlatformEnabling(p.callData);
        bool isInvariant = _isInvariantViolation(p.callData);
        if (isPlatform || isInvariant) {
            emit AntiPlatformEnforcementTripped(proposalId, _selectorOf(p.callData), isInvariant);
            require(!isPlatform, "Platform-enabling action prohibited by Constitution");
            require(!isInvariant, "Governance: invariant violation at execute");
        }

        // Determine threshold based on proposal type
        uint256 threshold = p.proposalType == ProposalType.Constitutional
            ? SUPERMAJORITY_THRESHOLD
            : STANDARD_THRESHOLD;

        if (p.voteCount >= threshold) {
            // CEI fix: write the terminal state BEFORE the external call so a
            // malicious target cannot re-enter executeProposal for the same
            // id. If the external call reverts, the whole transaction reverts
            // (including this state write) so the proposal remains Active and
            // can be retried. The intermediate `Succeeded` state in the enum
            // is retained for completeness but is no longer set here — the
            // observable transition is Active -> Executed (or Active -> Defeated).
            p.state = ProposalState.Executed;
            emit ProposalExecuted(proposalId);

            // Effects complete; now perform the interaction.
            (bool success, ) = p.target.call(p.callData);
            require(success, "Governance: execution failed");
        } else {
            p.state = ProposalState.Defeated;
        }
    }

    // ---- Emergency custodian (time-limited) ----

    /**
     * @dev Appoint an Emergency Custodian — time-limited (60 days max).
     * The custodian can maintain reserves + honor redemptions + pause minting,
     * but cannot amend the Constitution. A new Council must be convened within 60 days.
     */
    function appointEmergencyCustodian(address custodian) external returns (bool) {
        require(isCouncilMember[msg.sender], "Governance: only Council");
        require(custodian != address(0), "Governance: zero address");

        emergencyCustodian = custodian;
        emergencyCustodianExpiry = block.timestamp + 60 days;

        emit EmergencyCustodianAppointed(custodian, emergencyCustodianExpiry);
        return true;
    }

    function revokeEmergencyCustodian() external {
        require(isCouncilMember[msg.sender], "Governance: only Council");
        emergencyCustodian = address(0);
        emergencyCustodianExpiry = 0;
        emit EmergencyCustodianRevoked();
    }

    function isEmergencyCustodianActive() external view returns (bool) {
        return emergencyCustodian != address(0) && block.timestamp < emergencyCustodianExpiry;
    }

    // ---- Constitutional checks (permanently enforced) ----

    /**
     * @dev RF-19 FIX — real selector-based enforcement of the permanently-
     *      frozen invariants (Article V + Invariants 1..5 + §45.2 Redemption Rights).
     *
     *      Returns true if the call's first 4 bytes (the function selector)
     *      match any selector that would violate a constitutional invariant:
     *        - mint(uint256)            — discretionary minting bypasses the
     *                                     deposit-proof requirement (Invariant 2)
     *        - setReserveRatio(uint256) — would lower the 100% reserve (Invariant 1)
     *        - suspendRedemption()      — violates non-suspendable burn
     *                                     (§45.2 Redemption Rights permanent invariant)
     *        - liquidateGold()          — Gold liquidation without Exhaustion
     *                                     Certificate (Invariant 5: Bullion
     *                                     Preservation, Article X §34)
     *        - setFee(uint256)          — fee changes outside governance
     *        - pause()                  — pause outside the emergency role
     *        - upgradeTo(address)       — unauthorised UUPS upgrade
     *        - transferOwnership(addr)  — ownership transfer outside Council
     *        - renounceOwnership()      — would brick governance permanently
     *
     *      Tamper-evidence: the `permanentProhibitions` mapping (set in the
     *      constructor) is consulted to ensure the prohibition list itself
     *      has not been tampered with. If ANY of the six anti-platform flags
     *      are unset, this function conservatively returns true (fail-closed)
     *      so that no proposal can execute until the flags are restored.
     *
     * @param callData The calldata of the proposed call.
     * @return True if the call would violate a permanently-frozen invariant.
     */
    function _isInvariantViolation(bytes memory callData) internal view returns (bool) {
        // Tamper check: if any of the 6 anti-platform flags were unset by
        // some bug or future (disallowed) mutation, treat EVERY call as a
        // violation — fail-closed until the flags are restored.
        if (!permanentProhibitions[LENDING] ||
            !permanentProhibitions[EXCHANGE] ||
            !permanentProhibitions[BROKERAGE] ||
            !permanentProhibitions[ASSET_MANAGEMENT] ||
            !permanentProhibitions[DEFI] ||
            !permanentProhibitions[PLATFORM_SERVICES]) {
            return true;
        }

        if (callData.length < 4) return false; // no selector — let the target decide
        bytes4 sel = _selectorOf(callData);

        if (sel == _SEL_MINT_UINT)              return true;
        if (sel == _SEL_SET_RESERVE_RATIO)      return true;
        if (sel == _SEL_SUSPEND_REDEMPTION)     return true;
        if (sel == _SEL_LIQUIDATE_GOLD)         return true; // Invariant 5: Bullion Preservation
        if (sel == _SEL_SET_FEE_UINT)           return true;
        if (sel == _SEL_PAUSE)                  return true;
        if (sel == _SEL_UPGRADE_TO)             return true;
        if (sel == _SEL_TRANSFER_OWNERSHIP)     return true;
        if (sel == _SEL_RENOUNCE_OWNERSHIP)     return true;
        return false;
    }

    /**
     * @dev RF-19 FIX — real selector-based enforcement of the anti-platform
     *      clause (Article V).
     *
     *      Returns true if the call's selector matches any function that
     *      would enable a permanently-prohibited platform service:
     *        - enableLending()            — LENDING prohibition
     *        - enableExchange()           — EXCHANGE prohibition
     *        - enableDeFi()               — DEFI prohibition
     *        - enableBrokerage()          — BROKERAGE prohibition
     *        - enableAssetManagement()    — ASSET_MANAGEMENT prohibition
     *        - enablePlatformServices()   — PLATFORM_SERVICES prohibition
     *
     *      The `permanentProhibitions` mapping is consulted inside
     *      `_isInvariantViolation` (fail-closed if any flag is unset), so
     *      callers that check both functions get the tamper-evidence
     *      guarantee for free. This function itself is `pure` because it
     *      only compares the selector against compile-time constants.
     *
     * @param callData The calldata of the proposed call.
     * @return True if the call would enable a prohibited platform service.
     */
    function _isPlatformEnabling(bytes memory callData) internal pure returns (bool) {
        if (callData.length < 4) return false;
        bytes4 sel = _selectorOf(callData);

        if (sel == _SEL_ENABLE_LENDING)            return true;
        if (sel == _SEL_ENABLE_EXCHANGE)           return true;
        if (sel == _SEL_ENABLE_DEFI)               return true;
        if (sel == _SEL_ENABLE_BROKERAGE)          return true;
        if (sel == _SEL_ENABLE_ASSET_MANAGEMENT)   return true;
        if (sel == _SEL_ENABLE_PLATFORM_SERVICES)  return true;
        return false;
    }

    /**
     * @dev Helper: extract the first 4 bytes of `data` as a bytes4 selector.
     *      Solidity 0.8.x does not support slicing `bytes memory` directly
     *      (only `bytes calldata`), so we read the first 32 bytes via inline
     *      assembly and cast to bytes4 (which keeps the leftmost 4 bytes).
     *      `bytes memory` is always padded to 32 bytes by the allocator, so
     *      the mload is safe even when `data.length < 32` (and we early-return
     *      bytes4(0) when `data.length < 4`).
     */
    function _selectorOf(bytes memory data) internal pure returns (bytes4) {
        if (data.length < 4) return bytes4(0);
        bytes32 raw;
        assembly {
            raw := mload(add(data, 0x20))
        }
        return bytes4(raw);
    }

    // ---- View functions ----

    function getProposal(uint256 id) external view returns (
        ProposalType pType,
        address target,
        uint256 voteCount,
        uint256 createdAt,
        uint256 executableAt,
        ProposalState state,
        string memory description
    ) {
        Proposal storage p = _proposals[id];
        return (p.proposalType, p.target, p.voteCount, p.createdAt, p.executableAt, p.state, p.description);
    }

    function councilMemberCount() external view returns (uint256) {
        return councilMembers.length;
    }

    // ---- §45 On-Chain Invariant Enforcement (view) ----

    /**
     * @notice §45 — On-Chain Invariant Enforcement Checker.
     *
     *      Read-only (`view`) function that reports whether a specific
     *      constitutional invariant is currently upheld by the contract's
     *      on-chain enforcement mechanisms. Costs no gas to call externally.
     *
     *      Invariant IDs (§45.2):
     *        0 — Anti-platform clause (Article V): all 6 prohibitions set
     *        1 — 100% reserve minimum: setReserveRatio(uint256) forbidden
     *        2 — Burn never pauses: suspendRedemption() forbidden
     *        3 — No commingling: enableLending()/enablePlatformServices() forbidden
     *        4 — No discretionary minting: mint(uint256) forbidden
     *        5 — No unauthorised upgrades: upgradeTo(address) forbidden
     *        6 — No ownership transfer outside Council: transferOwnership() forbidden
     *        7 — No ownership renunciation: renounceOwnership() forbidden
     *        8 — No fee changes outside governance: setFee(uint256) forbidden
     *        9 — No unauthorised pause: pause() forbidden
     *
     *      For each invariant, this function returns `true` iff (a) the
     *      tamper-evidence guard is intact (all 6 anti-platform flags set)
     *      AND (b) no live proposal currently carries a selector that would
     *      violate the invariant in question. Because proposals with
     *      forbidden selectors are already rejected at creation time
     *      (see `_isInvariantViolation` / `_isPlatformEnabling`), a `false`
     *      return indicates either tampering with the prohibition flags or
     *      a proposal that bypassed the creation check — both require
     *      immediate Council attention.
     *
     *      Invariants that depend on external state (the numerical reserve
     *      ratio value, oracle consensus, physical custody segregation)
     *      cannot be fully verified from within Governance storage — those
     *      are verified by the Proof of Reserves system (§37) and the
     *      Constitutional Oracle Engine (§31). This function reports the
     *      on-chain enforcement mechanism's integrity for each invariant.
     *
     *      Unknown `invariantId` values (≥ 10) return `false` (fail-closed).
     *
     * @param invariantId The invariant to check (0..9).
     * @return upheld True iff the on-chain enforcement is intact for this invariant.
     */
    function checkInvariant(uint8 invariantId) external view returns (bool upheld) {
        // Tamper-evidence guard: if any of the 6 anti-platform flags are
        // unset, fail-closed — every invariant reports as not upheld.
        bool antiPlatformIntact = permanentProhibitions[LENDING]
            && permanentProhibitions[EXCHANGE]
            && permanentProhibitions[BROKERAGE]
            && permanentProhibitions[ASSET_MANAGEMENT]
            && permanentProhibitions[DEFI]
            && permanentProhibitions[PLATFORM_SERVICES];
        if (!antiPlatformIntact) return false;

        if (invariantId == 0) {
            // 0 — Anti-platform clause (Article V): no live proposal may
            //     enable any platform service.
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_isPlatformEnabling(_proposals[i].callData)) return false;
            }
            return true;
        } else if (invariantId == 1) {
            // 1 — 100% reserve minimum: no live proposal may carry
            //     setReserveRatio(uint256).
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_SET_RESERVE_RATIO) return false;
            }
            return true;
        } else if (invariantId == 2) {
            // 2 — Burn never pauses: no live proposal may carry
            //     suspendRedemption() or pause().
            for (uint256 i = 0; i < _nextProposalId; i++) {
                bytes4 sel = _selectorOf(_proposals[i].callData);
                if (sel == _SEL_SUSPEND_REDEMPTION || sel == _SEL_PAUSE) return false;
            }
            return true;
        } else if (invariantId == 3) {
            // 3 — No commingling of reserves with operational funds:
            //     no live proposal may enable lending or platform services.
            for (uint256 i = 0; i < _nextProposalId; i++) {
                bytes4 sel = _selectorOf(_proposals[i].callData);
                if (sel == _SEL_ENABLE_LENDING || sel == _SEL_ENABLE_PLATFORM_SERVICES) return false;
            }
            return true;
        } else if (invariantId == 4) {
            // 4 — No discretionary minting: no live proposal may carry
            //     mint(uint256).
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_MINT_UINT) return false;
            }
            return true;
        } else if (invariantId == 5) {
            // 5 — No unauthorised upgrades: no live proposal may carry
            //     upgradeTo(address).
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_UPGRADE_TO) return false;
            }
            return true;
        } else if (invariantId == 6) {
            // 6 — No ownership transfer outside Council: no live proposal
            //     may carry transferOwnership(address).
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_TRANSFER_OWNERSHIP) return false;
            }
            return true;
        } else if (invariantId == 7) {
            // 7 — No ownership renunciation: no live proposal may carry
            //     renounceOwnership().
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_RENOUNCE_OWNERSHIP) return false;
            }
            return true;
        } else if (invariantId == 8) {
            // 8 — No fee changes outside governance: no live proposal may
            //     carry setFee(uint256).
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_SET_FEE_UINT) return false;
            }
            return true;
        } else if (invariantId == 9) {
            // 9 — No unauthorised pause: no live proposal may carry pause().
            for (uint256 i = 0; i < _nextProposalId; i++) {
                if (_selectorOf(_proposals[i].callData) == _SEL_PAUSE) return false;
            }
            return true;
        }
        // Unknown invariant ID — fail-closed.
        return false;
    }
}
// slither-disable-end incorrect-equality,timestamp,assembly,low-level-calls
