// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal non-custodial USDC share vault. This contract intentionally
/// does NOT route swaps or accept portfolio assets until an audited execution
/// design and verified asset addresses are supplied.
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract USDCVault {
    uint256 public constant MINIMUM_DEPOSIT = 25e6; // 25 USDC (USDC has 6 decimals)
    IERC20 public immutable usdc;
    address public immutable owner;
    uint256 public totalShares;
    uint256 public totalDepositors;
    mapping(address => uint256) public sharesOf;
    mapping(address => bool) public hasDeposited;

    event Deposited(address indexed account, uint256 usdcAmount, uint256 sharesMinted);
    event Withdrawn(address indexed account, uint256 usdcAmount, uint256 sharesBurned);

    error ZeroAmount();
    error TransferFailed();
    error InsufficientShares();
    error DepositBelowMinimum();

    constructor(address usdcAddress) {
        require(usdcAddress != address(0), "USDC address required");
        usdc = IERC20(usdcAddress);
        owner = msg.sender;
    }

    /// @notice Deposit USDC and receive pro-rata vault shares.
    /// @dev Assumes USDC uses its normal 6 decimals; no price conversion occurs.
    function deposit(uint256 usdcAmount) external returns (uint256 mintedShares) {
        if (usdcAmount < MINIMUM_DEPOSIT) revert DepositBelowMinimum();
        uint256 assetsBefore = totalAssets();
        mintedShares = totalShares == 0 ? usdcAmount : (usdcAmount * totalShares) / assetsBefore;
        if (!usdc.transferFrom(msg.sender, address(this), usdcAmount)) revert TransferFailed();
        if (!hasDeposited[msg.sender]) {
            hasDeposited[msg.sender] = true;
            totalDepositors += 1;
        }
        totalShares += mintedShares;
        sharesOf[msg.sender] += mintedShares;
        emit Deposited(msg.sender, usdcAmount, mintedShares);
    }

    /// @notice Redeem a stated number of vault shares for the matching USDC value.
    function withdraw(uint256 shareAmount) external returns (uint256 usdcAmount) {
        if (shareAmount == 0) revert ZeroAmount();
        if (shareAmount > sharesOf[msg.sender]) revert InsufficientShares();
        usdcAmount = (shareAmount * totalAssets()) / totalShares;
        sharesOf[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        if (!usdc.transfer(msg.sender, usdcAmount)) revert TransferFailed();
        emit Withdrawn(msg.sender, usdcAmount, shareAmount);
    }

    function totalAssets() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function previewWithdraw(address account) external view returns (uint256) {
        return totalShares == 0 ? 0 : (sharesOf[account] * totalAssets()) / totalShares;
    }
}
