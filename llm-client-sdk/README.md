# llm-client-x402

A TypeScript/JavaScript client SDK for calling LLM APIs with automatic x402 payment handling.

## Features

- 🔐 Automatic wallet generation for x402 payments
- 💳 Seamless payment handling for LLM API calls
- 🤖 Support for multiple LLM providers (OpenAI, Anthropic, Google Gemini)
- 🔒 Zero-knowledge proofs via Reclaim Protocol
- ⚡ Simple, easy-to-use API

## Installation

```bash
npm install llm-client-x402
```

Upon installation, a wallet will be automatically generated for you. You can use this wallet or provide your own.

## Quick Start

### 1. Set Up Environment Variables

After installation, add the generated wallet credentials to your `.env` file:

```env
X402_WALLET_PRIVATE_KEY=0x...
X402_NETWORK=base-sepolia
LLM_API_URL=http://localhost:3000/api/call-llm
```

### 2. Fund Your Wallet

Send USDC to your wallet address on the Base Sepolia network (for testing) or Base mainnet (for production).

**For Base Sepolia (testnet):**
- Get test ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Bridge to Base Sepolia: https://bridge.base.org/
- Swap for USDC on a DEX

### 3. Use the Client

```typescript
import { LLMClient } from 'llm-client-x402';

// Initialize the client
const client = new LLMClient({
  apiUrl: process.env.LLM_API_URL!,
  walletPrivateKey: process.env.X402_WALLET_PRIVATE_KEY!,
  network: 'base-sepolia', // or 'base' for mainnet
});

// Make an LLM API call with automatic payment
const response = await client.callLlm({
  model: 'anthropic/claude-3-haiku-20240307',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
  temperature: 0.7,
  max_tokens: 1024,
});

console.log(response.choices[0].message.content);
```

## API Reference

### `LLMClient`

#### Constructor

```typescript
new LLMClient(config: ClientConfig)
```

**Parameters:**
- `config.apiUrl` (string): URL of your LLM API endpoint
- `config.walletPrivateKey` (string): Private key for x402 payments
- `config.network` (string, optional): Network to use ('base-sepolia' or 'base', defaults to 'base-sepolia')

#### Methods

##### `callLlm(request: LLMRequest): Promise<LLMResponse>`

Make an LLM API call with automatic payment handling.

**Parameters:**
- `request.model` (string): Model identifier (e.g., 'openai/gpt-4', 'anthropic/claude-3-haiku-20240307')
- `request.messages` (Message[]): Array of conversation messages
- `request.temperature` (number, optional): Sampling temperature (0-2)
- `request.max_tokens` (number, optional): Maximum tokens to generate
- `request.top_p` (number, optional): Nucleus sampling parameter
- `request.frequency_penalty` (number, optional): Frequency penalty (OpenAI only)
- `request.presence_penalty` (number, optional): Presence penalty (OpenAI only)

**Returns:** Promise resolving to LLM response with content, usage stats, and zero-knowledge proof

##### `getWalletAddress(): string`

Get the wallet address being used for payments.

##### `getBalance(): Promise<string>`

Get the current wallet balance in wei.

## CLI Tools

### Generate a New Wallet

```bash
npx create-wallet
```

This will generate a new Ethereum wallet and display:
- Public address (for receiving funds)
- Private key (add to your .env file)
- Instructions for funding the wallet

## Examples

### OpenAI GPT-4

```typescript
const response = await client.callLlm({
  model: 'openai/gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms.' }
  ],
  temperature: 0.8,
  max_tokens: 500,
});
```

### Anthropic Claude

```typescript
const response = await client.callLlm({
  model: 'anthropic/claude-3-5-sonnet-20241022',
  messages: [
    { role: 'user', content: 'Write a haiku about programming.' }
  ],
  max_tokens: 100,
});
```

### Google Gemini

```typescript
const response = await client.callLlm({
  model: 'google/gemini-1.5-flash',
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
});
```

### Check Wallet Balance

```typescript
const address = client.getWalletAddress();
const balance = await client.getBalance();

console.log(`Wallet: ${address}`);
console.log(`Balance: ${balance} wei`);
```

## Supported Models

### Anthropic Claude
- `anthropic/claude-3-5-sonnet-20241022`
- `anthropic/claude-3-5-haiku-20241022`
- `anthropic/claude-3-opus-20240229`
- `anthropic/claude-3-sonnet-20240229`
- `anthropic/claude-3-haiku-20240307`

### OpenAI
- `openai/gpt-4o`
- `openai/gpt-4-turbo`
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- And more...

### Google Gemini
- `google/gemini-2.0-flash-exp`
- `google/gemini-1.5-pro`
- `google/gemini-1.5-flash`
- `google/gemini-1.5-flash-8b`

## How It Works

1. **Payment Protocol**: Uses x402 payment protocol for micropayments
2. **Zero-Knowledge Proofs**: API responses include cryptographic proofs via Reclaim Protocol
3. **Automatic Payment**: The SDK handles payment negotiation automatically
   - First request returns 402 Payment Required
   - SDK processes payment using your wallet
   - Request is retried with payment proof
   - Response is returned with ZK proof

## Security

- **Private Keys**: Never share your private key. Store it securely in environment variables.
- **Testnet First**: Always test on Base Sepolia before using Base mainnet.
- **Wallet Isolation**: Consider using a dedicated wallet for API payments.
- **Monitor Spending**: Regularly check your wallet balance and transaction history.

## Troubleshooting

### "Insufficient funds" error

Make sure your wallet has enough USDC to cover the API call cost plus gas fees.

### "Payment failed" error

Check that:
- Your wallet has sufficient USDC balance
- You're on the correct network (base-sepolia vs base)
- The API URL is correct and accessible

### "Invalid private key" error

Ensure your private key:
- Starts with '0x'
- Is a valid Ethereum private key (64 hex characters after '0x')
- Is properly set in your environment variables

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Generate a test wallet
npm run create-wallet

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

## Links

- [x402 Protocol Documentation](https://docs.cdp.coinbase.com/x402/)
- [Reclaim Protocol](https://reclaimprotocol.org/)
- [Base Network](https://base.org/)

---

**Note:** This SDK is designed to work with APIs that support x402 payment protocol and Reclaim Protocol zkFetch for zero-knowledge proofs.
