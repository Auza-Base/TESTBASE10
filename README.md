# Base Ten

A Base-mainnet website shell based on the supplied portfolio image. It connects a browser wallet and requests Base (`chainId 8453`). Deposits deliberately remain disabled until the asset token contract addresses, a vetted execution route, and a security review have been completed. The displayed minimum deposit is 50 USDC.

## Allocation

| Token label | Target weight |
| --- | ---: |
| NVDA | 18% |
| AAPL | 15% |
| GOOGL | 14% |
| META | 9% |
| AMZN | 11% |
| MSFT | 13% |
| MSTR | 5% |
| SNDK | 3% |
| SPCX | 5% |
| TSLA | 7% |

## Before enabling deposits

1. Verify that each asset is a legally available Base-mainnet tokenized-security token and record its official address.
2. Complete legal/compliance review for the jurisdictions and users served.
3. Have an independent smart-contract audit review the vault, price sources, slippage limits, and withdrawal liquidity.
4. Add the confirmed addresses and deployment address to the app, then test the complete transaction path on a test environment first.

## Swap engine: KyberSwap

The selected execution engine is KyberSwap Aggregator API v1 on Base (`base`, chain ID 8453). For every portfolio asset, the server must request a fresh route from `GET https://aggregator-api.kyberswap.com/base/api/v1/routes`, then send the returned `routeSummary` to `POST /base/api/v1/route/build`. The resulting calldata can be sent to KyberSwap's Base `MetaAggregationRouterV2` only after the application verifies all of the following:

1. `tokenIn` is official Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
2. `tokenOut` is one of the ten approved, verified asset contract addresses.
3. The requested amount equals the approved allocation share; the recipient is the vault; the deadline is short; and minimum output/slippage limits are enforced.
4. The router is the official Base KyberSwap router returned by the current API and independently checked against KyberSwap's deployment documentation.

Never expose a generic "swap arbitrary token" action from the vault and never execute unvalidated API calldata. A Kyber route only swaps ERC-20 tokens that exist and have liquidity on Base; it does not itself create access to ordinary brokerage shares.

## Personal-contract flow

`contracts/PersonalPortfolioFactory.sol` implements the requested personal-vault design:

1. The platform owner configures the fixed ten verified tokens and weights once, using basis points: `1800, 1500, 1400, 900, 1100, 1300, 500, 300, 500, 700`.
2. Each user calls `createVault()` to deploy their own contract, entirely owned by their wallet.
3. The owner calls `depositUSDC()` to put at least 25 USDC in their personal vault. The interface then obtains ten fresh KyberSwap routes and calls `rebalanceAllUSDC()` to split every USDC unit held by that vault into the exact fixed weights. `depositAndInvest()` remains available as a one-click alternative.
4. At any time the owner can call `rebalance()` using fresh Kyber routes, or withdraw any held token. To exit in USDC, the interface builds Kyber routes from assets back to USDC and then calls `withdrawToken(USDC, amount)`.

Kyber routes expire quickly and must be built for the individual vault address as the `sender` and `recipient`. This contract must receive an independent audit before any mainnet deployment. It cannot validate the fair market price or route choice on-chain; the `minAmountOut` checks enforce only the user-selected slippage protection.

### Enabling the user vault button

After the factory has been deployed and configured, set its checksummed Base-mainnet address as `factoryAddress` in `config.js`. The website's **Create my Base vault** button then asks the connected user's wallet to call `createVault()`. The user signs and pays the Base gas for their own vault deployment; the application never receives their private key.

## Configured Base assets

The factory now includes `configureBaseTenPortfolio()`, an owner-only convenience function that loads the exact Base assets below. It must be called after factory deployment and before users create vaults.

| Asset | Weight | Base contract |
| --- | ---: | --- |
| NVDAc | 18% | `0xb20000000000000000000078ee7ce2fE4908108C` |
| AAPLc | 15% | `0xb200000000000000000000C2e324d24d7eEcd1fb` |
| GOOGLc | 14% | `0xb2000000000000000000002D0BA3164cc74f58B7` |
| METAc | 9% | `0xb2000000000000000000008bC8786B856E61707C` |
| AMZNc | 11% | `0xb200000000000000000000d9192b6B456483C2E8` |
| MSFTc | 13% | `0xB200000000000000000000Ab99cFa739E253872B` |
| MSTRc | 5% | `0xb2000000000000000000004884b426556b92883d` |
| SNDKc | 3% | `0xb200000000000000000000397293Cb8cda9a10c5` |
| SPCXc | 5% | `0xb2000000000000000000007b9fcbd005511aCBd5` |
| TSLAc | 7% | `0xb2000000000000000000001e800a7f5189430cD0` |

The current published registry lists these stock tokens with 8 decimals. The vault does not make its own decimal assumptions because KyberSwap routes supply the executable token amounts.

## Withdrawals, rewards, and deposited-USDC counter

- Each personal vault can call `withdrawToken(token, amount)` to withdraw a single configured stock token or USDC directly to its owner wallet.
- Withdrawing a stock sets `rewardEligible` to `false`. The user must complete a non-empty KyberSwap `rebalance()` transaction to restore reward eligibility. The vault exposes this flag and `rebalanceCount` so a future reward distributor can use them.
- The factory records `totalUSDCDeposited`, a cumulative counter of all successful `depositAndInvest()` calls across its personal vaults. This is the requested deposited-USDC total, not mark-to-market TVL—live TVL needs an approved price oracle for the ten stocks.

`contracts/USDCVault.sol` is a deliberately limited deposit/withdraw share-vault reference. It enforces a 50-USDC minimum and records `totalDepositors` for a participant count. A production leaderboard should be calculated from its `Deposited` and `Withdrawn` events by an indexer; sorting all users inside a smart contract would be expensive and does not scale. It should not be deployed with real user funds without audit, legal review, and a complete asset-execution mechanism.
