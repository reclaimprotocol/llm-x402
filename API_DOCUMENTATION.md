# LLM Router API Documentation

## Overview

This API provides a unified interface for calling multiple LLM providers (Anthropic, OpenAI, Google Gemini) with an OpenRouter-compatible format.

**⚡ This is a paid API using x402 protocol on Base Sepolia testnet. Payment is required per request ($0.01).**

## Endpoints

### Chat Completions
```
POST /api/call-llm
```

### Supported Models
```
GET /api/supported-models
```
Returns a list of all available models with their specifications.

## Setup

### Server Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys and x402 configuration to `.env`:
   ```env
   # LLM Provider API Keys
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here

   # x402 Payment Configuration
   X402_WALLET_ADDRESS=your_base_sepolia_wallet_address
   X402_NETWORK=base-sepolia
   X402_FACILITATOR_URL=https://x402.org/facilitator
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Client Setup

To use this API, you need an x402-compatible client that can handle the payment flow. The API will respond with `402 Payment Required` on the first request, including payment details. Your client must complete the payment and retry the request with payment proof.

## Request Format

The API follows the OpenRouter chat completions format. Models must be specified in the `provider/model` format:

```json
{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 1,
  "stream": false
}
```

### Required Parameters

- `model` (string): The model to use
- `messages` (array): Array of message objects with `role` and `content`

### Optional Parameters

- `temperature` (number): Controls randomness (0-2)
- `max_tokens` (number): Maximum tokens to generate
- `top_p` (number): Nucleus sampling parameter
- `frequency_penalty` (number): OpenAI only
- `presence_penalty` (number): OpenAI only
- `stream` (boolean): Enable streaming responses

## Supported Models

All models must be specified with the `provider/model` format.

To get the current list of supported models:

```bash
curl http://localhost:3000/api/supported-models
```

This endpoint returns all available models, including:
- **Anthropic** models (Claude 3.x series)
- **OpenAI** models (fetched dynamically from OpenAI API)
- **Google** models (Gemini 1.5 and 2.0 series)

Each model includes:
- Model ID (in `provider/model` format)
- Display name
- Context length
- Streaming support
- Vision support

**Note:** OpenAI models are fetched dynamically using the OpenAI SDK. Anthropic and Google models are based on their official documentation.

## Response Format

### Non-streaming Response

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! I'm doing well, thank you for asking."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 12,
    "total_tokens": 25
  }
}
```

### Streaming Response

When `stream: true`, the API returns Server-Sent Events (SSE):

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## Payment Flow

This API uses the x402 protocol for micropayments:

1. **Initial Request**: Client makes request to `/api/call-llm`
2. **402 Response**: Server responds with `402 Payment Required` and payment details
3. **Payment**: Client completes payment on Base Sepolia network
4. **Retry**: Client retries request with payment proof
5. **Success**: Server verifies payment and returns API response

**Pricing**: $0.01 USD per request (paid in cryptocurrency on Base Sepolia testnet)

## Example Usage

### With x402 Client

You'll need an x402-compatible client library to handle the payment flow automatically. Example using a hypothetical x402 client:

```typescript
import { X402Client } from '@coinbase/x402'; // or similar

const client = new X402Client({
  wallet: yourWallet, // Base Sepolia wallet
});

const response = await client.post('http://localhost:3000/api/call-llm', {
  model: 'openai/gpt-4',
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
});
```

### Manual cURL (First Request - Will Return 402)

```bash
curl -X POST http://localhost:3000/api/call-llm \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

This will return a 402 response with payment instructions.

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/call-llm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4',
    messages: [
      { role: 'user', content: 'What is the capital of France?' }
    ],
    temperature: 0.7,
    max_tokens: 100,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### Streaming Example

```typescript
const response = await fetch('http://localhost:3000/api/call-llm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3-5-sonnet-20241022',
    messages: [
      { role: 'user', content: 'Tell me a story' }
    ],
    stream: true,
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

if (reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = JSON.parse(line.slice(6));
        const content = data.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      }
    }
  }
}
```

## Error Handling

The API returns standard error responses:

```json
{
  "error": {
    "message": "Error description",
    "type": "invalid_request_error"
  }
}
```

### Error Types

- `invalid_request_error`: Missing or invalid parameters
- `authentication_error`: Missing or invalid API key
- `api_error`: Error from the underlying LLM provider

## Provider Selection

The API routes requests based on the provider prefix in the model name:

- `anthropic/` or `claude/` → Anthropic API
- `openai/` → OpenAI API
- `google/` or `gemini/` → Google Gemini API

**Note:** All model names must include the provider prefix (e.g., `openai/gpt-4`, not just `gpt-4`).

## Getting Supported Models

Retrieve the full list of supported models and their capabilities:

```bash
curl http://localhost:3000/api/supported-models
```

Response format:
```json
{
  "data": [
    {
      "id": "openai/gpt-4o",
      "name": "GPT-4o",
      "provider": "openai",
      "context_length": 128000,
      "supports_streaming": true,
      "supports_vision": true,
      "pricing": {
        "prompt": "0.0000025",
        "completion": "0.00001"
      }
    },
    ...
  ],
  "object": "list"
}
```

**Note:** OpenAI models are fetched dynamically from the OpenAI API when you call this endpoint.
