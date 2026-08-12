// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Oracle is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct PriceFeed {
        address provider;
        bool active;
    }

    PriceFeed[] public priceFeeds;
    mapping(bytes32 => uint256) public latestPrices;
    mapping(bytes32 => uint256) public lastUpdate;

    uint256 public constant MIN_SOURCES = 5;
    uint256 public constant DEVIATION_THRESHOLD = 200; // 2% in basis points

    event PriceUpdated(bytes32 indexed asset, uint256 price);
    event FeedAdded(address provider);
    event FeedRemoved(uint256 index);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function addFeed(address provider) external onlyRole(ADMIN_ROLE) {
        require(provider != address(0), "Oracle: invalid address");
        priceFeeds.push(PriceFeed({provider: provider, active: true}));
        emit FeedAdded(provider);
    }

    function removeFeed(uint256 index) external onlyRole(ADMIN_ROLE) {
        require(index < priceFeeds.length, "Oracle: invalid index");
        priceFeeds[index].active = false;
        emit FeedRemoved(index);
    }

    function updatePrice(bytes32 asset, uint256 price) external {
        require(price > 0, "Oracle: invalid price");
        latestPrices[asset] = price;
        lastUpdate[asset] = block.timestamp;
        emit PriceUpdated(asset, price);
    }

    function getPrice(bytes32 asset) external view returns (uint256) {
        uint256[] memory prices = new uint256[](priceFeeds.length);
        uint256 count = 0;
        for (uint i = 0; i < priceFeeds.length; i++) {
            if (priceFeeds[i].active) {
                prices[count] = latestPrices[asset];
                count++;
            }
        }
        require(count >= MIN_SOURCES, "Oracle: insufficient sources");
        // Simple median (sort and take middle)
        uint256[] memory sorted = sort(prices, count);
        return sorted[count / 2];
    }

    function sort(uint256[] memory arr, uint256 len) internal pure returns (uint256[] memory) {
        for (uint i = 0; i < len; i++) {
            for (uint j = i + 1; j < len; j++) {
                if (arr[i] > arr[j]) {
                    uint256 temp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = temp;
                }
            }
        }
        return arr;
    }
}
