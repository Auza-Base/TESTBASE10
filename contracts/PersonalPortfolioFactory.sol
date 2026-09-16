// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Each deployed vault has exactly one owner. No investor funds are pooled.
/// @dev Kyber calldata is generated off-chain from a fresh route quote. The owner
///      supplies it, while the vault limits input/output tokens and min output.
interface IERC20Portfolio {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
}

interface IPortfolioDepositTracker {
    function recordDeposit(uint256 usdcAmount) external;
}

contract PersonalPortfolioVault {
    uint256 public constant MINIMUM_DEPOSIT = 25e6; // Base USDC: 6 decimals

    struct SwapInstruction {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        bytes data; // KyberSwap API v1 route/build data
    }

    address public immutable owner;
    address public immutable factory;
    address public immutable kyberRouter;
    IERC20Portfolio public immutable usdc;
    address[] public assets;
    uint16[] public targetWeightsBps;
    uint256 private unlocked = 1;
    bool public rewardEligible = true;
    uint256 public rebalanceCount;

    error NotOwner();
    error ReentrantCall();
    error BelowMinimum();
    error InvalidToken();
    error InvalidPlan();
    error TransferFailed();
    error SlippageExceeded();
    error KyberCallFailed();

    event Deposited(address indexed owner, uint256 usdcAmount);
    event KyberSwap(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event Withdrawn(address indexed token, uint256 amount);
    event RewardEligibilityChanged(bool eligible);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier nonReentrant() { if (unlocked != 1) revert ReentrantCall(); unlocked = 2; _; unlocked = 1; }

    constructor(address vaultOwner, address factoryAddress, address usdcAddress, address router, address[] memory tokens, uint16[] memory weights) {
        owner = vaultOwner;
        factory = factoryAddress;
        usdc = IERC20Portfolio(usdcAddress);
        kyberRouter = router;
        assets = tokens;
        targetWeightsBps = weights;
    }

    /// @notice Deposits USDC into this user's personal vault. Stocks remain in this vault, not a shared pool.
    function depositUSDC(uint256 usdcAmount) external onlyOwner nonReentrant {
        if (usdcAmount < MINIMUM_DEPOSIT) revert BelowMinimum();
        if (!usdc.transferFrom(msg.sender, address(this), usdcAmount)) revert TransferFailed();
        IPortfolioDepositTracker(factory).recordDeposit(usdcAmount);
        emit Deposited(msg.sender, usdcAmount);
    }

    /// @notice Deposits USDC then atomically buys each configured asset at its target weight.
    /// @dev Kept as a one-click alternative to depositUSDC() + rebalanceAllUSDC().
    function depositAndInvest(uint256 usdcAmount, SwapInstruction[] calldata plan) external onlyOwner nonReentrant {
        if (usdcAmount < MINIMUM_DEPOSIT) revert BelowMinimum();
        if (!usdc.transferFrom(msg.sender, address(this), usdcAmount)) revert TransferFailed();
        IPortfolioDepositTracker(factory).recordDeposit(usdcAmount);
        _investAllUSDC(usdcAmount, plan);
        emit Deposited(msg.sender, usdcAmount);
    }

    /// @notice Splits every USDC unit currently held by this vault into the configured 10-asset weights.
    /// @dev The interface obtains one fresh Kyber route for each asset immediately before this call.
    function rebalanceAllUSDC(SwapInstruction[] calldata plan) external onlyOwner nonReentrant {
        uint256 usdcAmount = usdc.balanceOf(address(this));
        if (usdcAmount == 0) revert InvalidPlan();
        _investAllUSDC(usdcAmount, plan);
        _restoreRewardEligibility();
    }

    function _investAllUSDC(uint256 usdcAmount, SwapInstruction[] calldata plan) internal {
        if (plan.length != assets.length) revert InvalidPlan();

        uint256 allocated;
        for (uint256 i; i < plan.length; ++i) {
            if (plan[i].tokenIn != address(usdc) || plan[i].tokenOut != assets[i]) revert InvalidPlan();
            // Requires the exact 10 target percentages, allowing rounding dust only on the final trade.
            uint256 expected = i + 1 == plan.length ? usdcAmount - allocated : (usdcAmount * targetWeightsBps[i]) / 10_000;
            if (plan[i].amountIn != expected) revert InvalidPlan();
            allocated += expected;
            _swap(plan[i]);
        }
    }

    /// @notice Rebalance at any time with current Kyber quotes. Input/output must stay inside this portfolio or USDC.
    function rebalance(SwapInstruction[] calldata plan) external onlyOwner nonReentrant {
        if (plan.length == 0) revert InvalidPlan();
        for (uint256 i; i < plan.length; ++i) _swap(plan[i]);
        _restoreRewardEligibility();
    }

    function _restoreRewardEligibility() internal {
        rebalanceCount += 1;
        if (!rewardEligible) {
            rewardEligible = true;
            emit RewardEligibilityChanged(true);
        }
    }

    /// @notice Withdraw any held portfolio token directly. To exit in USDC, rebalance assets to USDC first, then withdraw USDC.
    function withdrawToken(address token, uint256 amount) external onlyOwner nonReentrant {
        if (!_allowed(token) || amount == 0) revert InvalidToken();
        if (!IERC20Portfolio(token).transfer(owner, amount)) revert TransferFailed();
        if (token != address(usdc) && rewardEligible) {
            rewardEligible = false;
            emit RewardEligibilityChanged(false);
        }
        emit Withdrawn(token, amount);
    }

    function assetCount() external view returns (uint256) { return assets.length; }

    function _swap(SwapInstruction calldata trade) internal {
        if (!_allowed(trade.tokenIn) || !_allowed(trade.tokenOut) || trade.tokenIn == trade.tokenOut || trade.amountIn == 0) revert InvalidToken();
        IERC20Portfolio output = IERC20Portfolio(trade.tokenOut);
        uint256 beforeBalance = output.balanceOf(address(this));
        IERC20Portfolio input = IERC20Portfolio(trade.tokenIn);
        if (!input.approve(kyberRouter, 0) || !input.approve(kyberRouter, trade.amountIn)) revert TransferFailed();
        (bool success,) = kyberRouter.call(trade.data);
        if (!input.approve(kyberRouter, 0)) revert TransferFailed();
        if (!success) revert KyberCallFailed();
        uint256 amountOut = output.balanceOf(address(this)) - beforeBalance;
        if (amountOut < trade.minAmountOut) revert SlippageExceeded();
        emit KyberSwap(trade.tokenIn, trade.tokenOut, trade.amountIn, amountOut);
    }

    function _allowed(address token) internal view returns (bool) {
        if (token == address(usdc)) return true;
        for (uint256 i; i < assets.length; ++i) if (assets[i] == token) return true;
        return false;
    }
}

/// @notice Admin configures one vetted, fixed ten-asset portfolio; users create their own vault from it.
contract PersonalPortfolioFactory {
    address public immutable owner;
    address public immutable usdc;
    address public immutable kyberRouter;
    address[] public portfolioAssets;
    uint16[] public portfolioWeightsBps;
    mapping(address => address[]) public vaultsOf;
    mapping(address => bool) public isVault;
    uint256 public totalUSDCDeposited;

    error NotOwner();
    error InvalidPortfolio();
    event PortfolioConfigured(address[] assets, uint16[] weightsBps);
    event VaultCreated(address indexed user, address indexed vault);
    event USDCDepositRecorded(address indexed vault, uint256 amount, uint256 totalUSDCDeposited);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }

    constructor(address usdcAddress, address routerAddress) {
        owner = msg.sender;
        usdc = usdcAddress;
        kyberRouter = routerAddress;
    }

    /// @notice Call only after independently verifying all ten Base token addresses.
    function setPortfolio(address[] calldata tokens, uint16[] calldata weights) external onlyOwner {
        _setPortfolio(tokens, weights);
    }

    /// @notice Configures the exact Base Ten portfolio supplied for this application.
    /// @dev Token order is NVDAc, AAPLc, GOOGLc, METAc, AMZNc, MSFTc, MSTRc, SNDKc, SPCXc, TSLAc.
    function configureBaseTenPortfolio() external onlyOwner {
        address[] memory tokens = new address[](10);
        tokens[0] = 0xb20000000000000000000078ee7ce2fe4908108c;
        tokens[1] = 0xb200000000000000000000c2e324d24d7eecd1fb;
        tokens[2] = 0xb2000000000000000000002d0ba3164cc74f58b7;
        tokens[3] = 0xb2000000000000000000008bc8786b856e61707c;
        tokens[4] = 0xb200000000000000000000d9192b6b456483c2e8;
        tokens[5] = 0xb200000000000000000000ab99cfa739e253872b;
        tokens[6] = 0xb2000000000000000000004884b426556b92883d;
        tokens[7] = 0xb200000000000000000000397293cb8cda9a10c5;
        tokens[8] = 0xb2000000000000000000007b9fcbd005511acbd5;
        tokens[9] = 0xb2000000000000000000001e800a7f5189430cd0;
        uint16[] memory weights = new uint16[](10);
        weights[0] = 1800; weights[1] = 1500; weights[2] = 1400; weights[3] = 900; weights[4] = 1100;
        weights[5] = 1300; weights[6] = 500; weights[7] = 300; weights[8] = 500; weights[9] = 700;
        _setPortfolio(tokens, weights);
    }

    function _setPortfolio(address[] memory tokens, uint16[] memory weights) internal {
        if (tokens.length != 10 || weights.length != 10) revert InvalidPortfolio();
        uint256 total;
        for (uint256 i; i < 10; ++i) {
            if (tokens[i] == address(0) || weights[i] == 0) revert InvalidPortfolio();
            for (uint256 j; j < i; ++j) if (tokens[i] == tokens[j]) revert InvalidPortfolio();
            total += weights[i];
        }
        if (total != 10_000) revert InvalidPortfolio();
        portfolioAssets = tokens;
        portfolioWeightsBps = weights;
        emit PortfolioConfigured(tokens, weights);
    }

    function createVault() external returns (address vault) {
        if (portfolioAssets.length != 10) revert InvalidPortfolio();
        vault = address(new PersonalPortfolioVault(msg.sender, address(this), usdc, kyberRouter, portfolioAssets, portfolioWeightsBps));
        vaultsOf[msg.sender].push(vault);
        isVault[vault] = true;
        emit VaultCreated(msg.sender, vault);
    }

    /// @notice Cumulative USDC deposited by all personal vaults. This is not a mark-to-market portfolio value.
    function recordDeposit(uint256 usdcAmount) external {
        if (!isVault[msg.sender]) revert NotOwner();
        totalUSDCDeposited += usdcAmount;
        emit USDCDepositRecorded(msg.sender, usdcAmount, totalUSDCDeposited);
    }
}
