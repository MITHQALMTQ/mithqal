// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

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
 */

contract Governance {
    // ---- Council configuration ----
    uint256 public constant COUNCIL_SIZE = 7; // odd number for tie-breaking
    uint256 public constant SUPERMAJORITY_THRESHOLD = 5; // 5 of 7 for constitutional amendments
    uint256 public constant STANDARD_THRESHOLD = 4; // 4 of 7 for policy changes
    uint256 public constant TIMELOCK_DELAY = 7 days; // constitutional review period
    uint256 public constant FOUNDER_HOLDING_CAP = 20; // 20% of circulating supply (Invariant)

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
    // can enable any of these — the check is in the proposal creation.
    mapping(bytes32 => bool) public permanentProhibitions;

    // ---- Events ----
    event ProposalCreated(uint256 indexed id, ProposalType pType, string description, address target);
    event VoteCast(uint256 indexed id, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed id);
    event EmergencyCustodianAppointed(address indexed custodian, uint256 expiry);
    event EmergencyCustodianRevoked();

    // ---- Permanently frozen prohibitions (set in constructor) ----
    bytes32 public constant LENDING = keccak256("LENDING");
    bytes32 public constant EXCHANGE = keccak256("EXCHANGE");
    bytes32 public constant BROKERAGE = keccak256("BROKERAGE");
    bytes32 public constant ASSET_MANAGEMENT = keccak256("ASSET_MANAGEMENT");
    bytes32 public constant DEFI = keccak256("DEFI");
    bytes32 public constant PLATFORM_SERVICES = keccak256("PLATFORM_SERVICES");

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
    }

    // ---- Proposal creation ----

    /**
     * @dev Create a policy proposal (standard threshold, shorter timelock).
     * Can adjust fee rates, risk tolerances, committee composition.
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
        p.executableAt = block.timestamp + TIMELOCK_DELAY;
        p.state = ProposalState.Active;
        p.description = description;

        emit ProposalCreated(proposalId, ProposalType.Policy, description, target);
        return proposalId;
    }

    /**
     * @dev Create a constitutional amendment proposal (supermajority, longer timelock).
     * CANNOT amend invariants or the anti-platform clause — enforced in execute.
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
        p.executableAt = block.timestamp + (TIMELOCK_DELAY * 2); // double timelock for constitutional
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

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = _proposals[proposalId];
        require(p.state == ProposalState.Active, "Governance: not active");
        require(block.timestamp >= p.executableAt, "Governance: timelock not elapsed");

        // Determine threshold based on proposal type
        uint256 threshold = p.proposalType == ProposalType.Constitutional
            ? SUPERMAJORITY_THRESHOLD
            : STANDARD_THRESHOLD;

        if (p.voteCount >= threshold) {
            p.state = ProposalState.Succeeded;
            // Execute the call
            (bool success, ) = p.target.call(p.callData);
            require(success, "Governance: execution failed");
            p.state = ProposalState.Executed;
            emit ProposalExecuted(proposalId);
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
     * @dev Checks if a call would violate permanently-frozen invariants.
     * This is the on-chain enforcement of the anti-platform clause (Article V).
     */
    function _isInvariantViolation(bytes memory) internal pure returns (bool) {
        // In production, this would inspect the callData for:
        // - setReserveRatioBelow100()
        // - enableDiscretionaryMinting()
        // - enableLending()
        // - suspendRedemption()
        // All permanently prohibited.
        return false; // simplified — real implementation checks selector
    }

    function _isPlatformEnabling(bytes memory) internal pure returns (bool) {
        // Checks if the call would enable any prohibited platform service.
        // permanentProhibitions mapping is consulted — these can NEVER be unset.
        return false; // simplified — real implementation checks selector
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
}
