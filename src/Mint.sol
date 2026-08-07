// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Mint is AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IMTQ public immutable mtq;
    IReserve public reserve;

    uint256 public constant FEE_RATE = 5;
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant FEE_CAP = 5000 * 1e18;

    event Minted(address indexed to, uint256 amount, uint256 fee);
    event ReserveContractUpdated(address indexed newReserve);

    constructor(address _mtq, address _reserve) {
        require(_mtq != address(0), "Mint: invalid MTQ address");
        mtq = IMTQ(_mtq);
        reserve = IReserve(_reserve);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(bytes calldata depositProof, uint256 amount)
        external
        nonReentrant
        onlyRole(MINTER_ROLE)
    {
        require(amount > 0, "Mint: amount must be > 0");
        require(reserve.verifyDeposit(depositProof), "Mint: invalid deposit proof");

        reserve.addReserve(depositProof);
        require(reserve.reserveRatio() >= 1e18, "Mint: reserve ratio below 100%");

        uint256 fee = (amount * FEE_RATE) / FEE_DENOMINATOR;
        if (fee > FEE_CAP) fee = FEE_CAP;

        uint256 mintAmount = amount - fee;

        mtq.mint(msg.sender, mintAmount);

        emit Minted(msg.sender, mintAmount, fee);
    }

    function setReserve(address _reserve) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_reserve != address(0), "Mint: invalid address");
        reserve = IReserve(_reserve);
        emit ReserveContractUpdated(_reserve);
    }
}

interface IMTQ {
    function mint(address to, uint256 amount) external;
}

interface IReserve {
    function verifyDeposit(bytes calldata proof) external view returns (bool);
    function reserveRatio() external view returns (uint256);
    function addReserve(bytes calldata proof) external;
}
