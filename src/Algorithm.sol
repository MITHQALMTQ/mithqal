// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Algorithm is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant NAV = 1e18;
    event NAVUpdated(uint256 newNAV);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function getNAV() external view returns (uint256) {
        return NAV;
    }

    function setNAV(uint256 newNAV) external onlyRole(ADMIN_ROLE) {
        emit NAVUpdated(newNAV);
    }
}
