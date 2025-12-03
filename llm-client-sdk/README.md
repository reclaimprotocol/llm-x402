# x402 zkTLS LLM Router
An [OpenRouter](https://openrouter.ai) alternative, where you have guarantee that you are getting responses from the model you requested, and not a cheaper/smaller model. With proofs of correct model being called provided by [Reclaim Protocol](https://reclaimprotocol.org)

You can pay for each request, without having to buy a subscription or credits using USDC on Base Network.

## Quickstart 
### Installation
Install the LLM x402 client
```
npm install @reclaimprotocol/llm-x402-client
```
### Usage
```
import { LLMClient } from '@reclaimprotocol/llm-x402-client';
```

Call the LLM
```
    const client = new LLMClient({
      apiUrl: "https://llm-x402.reclaimprotocol.org",
      walletPrivateKey: process.env.X402_WALLET_PRIVATE_KEY,
      network: 'base',
    });
    const result = await client.callLlm({
      model,
      messages: [
        { role: 'user', content: message }
      ],
    });
```

### Wallet private key
You can use a private key that you own on Base Network.
If you don't own one, you can create one using 
```
npx create-wallet
```

You must then send USDC and some ETH to the above wallet. 
Make sure you add the private key to your `.env.local` file 
```
LLM_API_URL=https://llm-x402.reclaimprotocol.org/api/call-llm
X402_NETWORK=base
X402_WALLET_PRIVATE_KEY=0x...
```

### Models
Currently supports Anthropic, OpenAI and Google (soon)
You can see supported models on [Supported Models page](/supported-models)

## Self Hosting
When initializing `LLMClient`, you can pass your own self hosted x402 server as `apiUrl`.

To self host,
### Clone
```
$ git clone https://github.com/reclaimprotocol/llm-x402.git
```

### Env variables
Set these in the `.env` file
```
# API Keys for LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AI...

# x402 Payment Configuration
X402_WALLET_ADDRESS=0x...
X402_NETWORK=base

# CDP API Keys for mainnet facilitator
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...

# Reclaim Protocol zkFetch Configuration
RECLAIM_APP_ID=...
RECLAIM_APP_SECRET=...
```
#### Where to get the API Keys
LLM API Keys :
- [`ANTHROPIC_API_KEY`](https://console.anthropic.com/settings/keys)
- [`OPENAI_API_KEY`](https://platform.openai.com/settings/)
- [`GOOGLE_API_KEY`](https://aistudio.google.com/app/api-keys)

Payment configuration
- [`X402_WALLET_ADDRESS`](https://ethereum.org/wallets/) 

CDP API Keys
- [`CDP_API_KEY_ID` & `CDP_API_KEY_SECRET`](https://portal.cdp.coinbase.com/projects/overview)

Reclaim API Keys
- [`RECLAIM_APP_ID` and `RECLAIM_APP_SECRET`](https://dev.reclaimprotocol.org)

#### Run it
```
$ npm run build && npm run start
```