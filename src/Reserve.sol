// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Reserve is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IMTQ public immutable mtq;
    IAlgorithm public algorithm;

    uint256 public totalReserveValue;
    mapping(bytes32 => uint256) public assetBalances;

    event DepositAdded(bytes32 indexed assetType, uint256 amount);
    event DepositRemoved(bytes32 indexed assetType, uint256 amount);
    event ReserveRatioUpdated(uint256 ratio);
    event AlgorithmUpdated(address indexed newAlgorithm);

    constructor(address _mtq, address _algorithm) {
        require(_mtq != address(0), "Reserve: invalid MTQ");
        mtq = IMTQ(_mtq);
        algorithm = IAlgorithm(_algorithm);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function verifyDeposit(bytes calldata proof) external view returns (bool) {
        return proof.length > 0;
    }

    function addReserve(bytes calldata proof) external onlyRole(MINTER_ROLE) {
        (bytes32 assetType, uint256 amount) = _parseDepositProof(proof);
        require(amount > 0, "Reserve: amount must be > 0");
        assetBalances[assetType] += amount;
        totalReserveValue += amount;
        emit DepositAdded(assetType, amount);
    }

    function removeReserve(bytes32 assetType, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(assetBalances[assetType] >= amount, "Reserve: insufficient balance");
        assetBalances[assetType] -= amount;
        totalReserveValue -= amount;
        emit DepositRemoved(assetType, amount);
    }

    function releaseReserves(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount <= totalReserveValue, "Reserve: insufficient total reserve");
        // Here we would distribute the reserves proportionally, but for simplicity we just reduce total.
        totalReserveValue -= amount;
        // In a real implementation, we would transfer assets to 'to'.
        emit DepositRemoved(0x00, amount);
    }

    // Public function to get reserve ratio
    function reserveRatio() external view returns (uint256) {
        uint256 supply = mtq.totalSupply();
        if (supply == 0) return 1e18;
        uint256 nav = algorithm.getNAV();
        uint256 required = (supply * nav) / 1e18;
        if (required == 0) return 1e18;
        return (totalReserveValue * 1e18) / required;
    }

    function setAlgorithm(address _algorithm) external onlyRole(ADMIN_ROLE) {
        require(_algorithm != address(0), "Reserve: invalid address");
        algorithm = IAlgorithm(_algorithm);
        emit AlgorithmUpdated(_algorithm);
    }

    function _parseDepositProof(bytes calldata proof) internal pure returns (bytes32 assetType, uint256 amount) {
        (assetType, amount) = abi.decode(proof, (bytes32, uint256));
        return (assetType, amount);
    }
}

interface IMTQ {
    function totalSupply() external view returns (uint256);
}

interface IAlgorithm {
    function getNAV() external view returns (uint256);
}
