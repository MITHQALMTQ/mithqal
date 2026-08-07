// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Takaful is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CONTRIBUTOR_ROLE = keccak256("CONTRIBUTOR_ROLE");

    IERC20 public immutable mtq;
    uint256 public totalFund;
    mapping(address => uint256) public contributions;
    mapping(address => bool) public isMember;

    uint256 public constant MIN_CONTRIBUTION = 1e18; // 1 MTQ
    uint256 public constant MAX_CONTRIBUTION = 1000e18; // 1000 MTQ

    event Contribution(address indexed contributor, uint256 amount);
    event Payout(address indexed recipient, uint256 amount);
    event MemberJoined(address indexed member);
    event MemberLeft(address indexed member);

    constructor(address _mtq) {
        require(_mtq != address(0), "Takaful: invalid MTQ address");
        mtq = IERC20(_mtq);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function join() external {
        require(!isMember[msg.sender], "Takaful: already member");
        isMember[msg.sender] = true;
        emit MemberJoined(msg.sender);
    }

    function leave() external {
        require(isMember[msg.sender], "Takaful: not member");
        uint256 balance = contributions[msg.sender];
        if (balance > 0) {
            mtq.transfer(msg.sender, balance);
            totalFund -= balance;
            contributions[msg.sender] = 0;
        }
        isMember[msg.sender] = false;
        emit MemberLeft(msg.sender);
    }

    function contribute(uint256 amount) external nonReentrant {
        require(isMember[msg.sender], "Takaful: not member");
        require(amount >= MIN_CONTRIBUTION && amount <= MAX_CONTRIBUTION, "Takaful: invalid amount");
        mtq.transferFrom(msg.sender, address(this), amount);
        contributions[msg.sender] += amount;
        totalFund += amount;
        emit Contribution(msg.sender, amount);
    }

    function requestPayout(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount <= totalFund, "Takaful: insufficient funds");
        totalFund -= amount;
        mtq.transfer(msg.sender, amount);
        emit Payout(msg.sender, amount);
    }

    function getMemberBalance(address member) external view returns (uint256) {
        return contributions[member];
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
