# Test LLM Client

This is a test Next.js application that demonstrates the usage of `llm-client-x402` SDK.

## Setup

1. **Build the SDK first:**
   ```bash
   cd ../llm-client-sdk
   npm run build
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate a wallet:**
   ```bash
   npx create-wallet
   ```

   Copy the private key to `.env.local`:
   ```env
   X402_WALLET_PRIVATE_KEY=0x...
   ```

4. **Configure environment:**

   Edit `.env.local` and add:
   ```env
   LLM_API_URL=http://localhost:3000/api/call-llm
   X402_WALLET_PRIVATE_KEY=0x... (from step 3)
   X402_NETWORK=base-sepolia
   ```

5. **Make sure the main LLM API is running:**
   ```bash
   cd ../
   npm run dev  # Should run on port 3000
   ```

6. **Run the test app:**
   ```bash
   npm run dev  # Runs on port 3001
   ```

7. **Open browser:**
   Visit http://localhost:3001

## Features

- Simple web UI to test LLM calls
- Model selection (Anthropic, OpenAI, Google)
- Automatic x402 payment handling via the SDK
- Displays response with usage stats
- Shows if ZK proof was included

## How it works

1. User enters a message and selects a model
2. Frontend sends request to `/api/test-llm`
3. API route uses `LLMClient` from `llm-client-x402`
4. SDK handles x402 payment automatically
5. Response is returned with ZK proof from Reclaim Protocol

## Troubleshooting

### "X402_WALLET_PRIVATE_KEY not configured"
Run `npx create-wallet` and add the private key to `.env.local`

### "LLM_API_URL not configured"
Make sure `.env.local` has `LLM_API_URL=http://localhost:3000/api/call-llm`

### "Failed to connect"
Ensure the main LLM API server is running on port 3000

### SDK not found
Make sure you built the SDK first: `cd ../llm-client-sdk && npm run build`
