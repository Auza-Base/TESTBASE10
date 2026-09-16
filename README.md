# Base Ten

Base Ten is a local Base-mainnet portfolio interface powered by Glider.

## What it does

- Connects a Base-compatible wallet.
- Uses Glider strategy `01KZY1G56YFYWKS8AH0PR1YMQX`.
- Creates at most one Glider portfolio per wallet and strategy, then reuses its Base smart-account address for later deposits.
- Transfers official Base USDC directly from the user wallet to the Glider-provided Base smart account.
- Requests rebalancing and withdrawals through Glider's signed B2B API flows.

The application does not use KyberSwap. Glider handles strategy execution and rebalancing.

## Setup

1. Copy `.env.example` to `.env`.
2. Put your Glider API key only in `.env`:

   ```text
   GLIDER_API_KEY=your_key_here
   ```

3. Start the app:

   ```powershell
   node server-glider-v2.js
   ```

4. Open the localhost URL printed by the server.

## Important

- `.env` is intentionally ignored by Git. Never commit an API key.
- Deposits and withdrawals are real Base-mainnet transactions and require wallet confirmation.
- Glider indexing may take a few minutes after a transfer before rebalancing or withdrawal is available.
- This project is not investment, legal, or tax advice.
