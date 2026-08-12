// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Redeem is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IMTQ public immutable mtq;
    IReserve public reserve;
    IAlgorithm public algorithm;

    uint256 public constant FEE_RATE = 5;
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant FEE_CAP = 5000 * 1e18;

    event Redeemed(address indexed from, uint256 amount, uint256 fee, uint256 netClaim);
    event ReserveContractUpdated(address indexed newReserve);
    event AlgorithmContractUpdated(address indexed newAlgorithm);

    constructor(address _mtq, address _reserve, address _algorithm) {
        require(_mtq != address(0), "Redeem: invalid MTQ address");
        require(_reserve != address(0), "Redeem: invalid Reserve address");
        require(_algorithm != address(0), "Redeem: invalid Algorithm address");
        mtq = IMTQ(_mtq);
        reserve = IReserve(_reserve);
        algorithm = IAlgorithm(_algorithm);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function redeem(uint256 amount) external nonReentrant {
        require(amount > 0, "Redeem: amount must be > 0");
        require(mtq.balanceOf(msg.sender) >= amount, "Redeem: insufficient balance");

        uint256 nav = algorithm.getNAV();
        uint256 claimValue = (amount * nav) / 1e18; // Fixed: divide by 1e18

        uint256 fee = (claimValue * FEE_RATE) / FEE_DENOMINATOR;
        if (fee > FEE_CAP) fee = FEE_CAP;

        uint256 netClaim = claimValue - fee;

        mtq.transferFrom(msg.sender, address(this), amount);
        mtq.burn(amount);

        reserve.releaseReserves(msg.sender, netClaim);

        require(reserve.reserveRatio() >= 1e18, "Redeem: reserve ratio below 100%");

        emit Redeemed(msg.sender, amount, fee, netClaim);
    }

    function setReserve(address _reserve) external onlyRole(ADMIN_ROLE) {
        require(_reserve != address(0), "Redeem: invalid address");
        reserve = IReserve(_reserve);
        emit ReserveContractUpdated(_reserve);
    }

    function setAlgorithm(address _algorithm) external onlyRole(ADMIN_ROLE) {
        require(_algorithm != address(0), "Redeem: invalid address");
        algorithm = IAlgorithm(_algorithm);
        emit AlgorithmContractUpdated(_algorithm);
    }
}

interface IMTQ {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}

interface IReserve {
    function releaseReserves(address to, uint256 amount) external;
    function reserveRatio() external view returns (uint256);
}

interface IAlgorithm {
    function getNAV() external view returns (uint256);
}
