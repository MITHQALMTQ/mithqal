// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MTQ — Mithqal Settlement Token
 * @dev Core ERC-20 token implementing constitutional invariants.
 * 
 * This token is the settlement unit of the Mithqal Institution.
 * It enforces 100%+ reserve backing, no discretionary minting,
 * and redemption rights.
 */
contract MTQ {
    string public name = "Mithqal Settlement Token";
    string public symbol = "MTQ";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Placeholder: Full implementation will include:
    // - Reserve ratio enforcement
    // - Minting with proof of deposit
    // - Burning on redemption
    // - Governance controls
    // - Upgradeable proxy pattern

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
