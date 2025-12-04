import { NextRequest, NextResponse } from 'next/server';
import { withX402Payment } from '@/lib/x402';
import { ReclaimClient } from '@reclaimprotocol/zk-fetch';


// API endpoints
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Types for OpenRouter-compatible format
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

// Helper function to determine provider from model name
function getProvider(model: string): 'anthropic' | 'openai' | 'google' {
  // Check if model uses provider/model format
  if (model.includes('/')) {
    const provider = model.split('/')[0].toLowerCase();

    if (provider === 'anthropic' || provider === 'claude') {
      return 'anthropic';
    }

    if (provider === 'openai') {
      return 'openai';
    }

    if (provider === 'google' || provider === 'gemini') {
      return 'google';
    }
  }

  return 'openai';
}

// Utility function to decode chunked transfer encoding and clean zkFetch artifacts
function decodeChunkedResponse(chunkedData: string): string {
  // Remove chunk size markers (hex number + \r\n)
  // and trailing \r\n markers and zkFetch regex capture artifacts
  return chunkedData
    .replace(/^[0-9a-fA-F]+\r\n/, '') // Remove initial chunk size
    .replace(/\r\n0\r\n\r\n$/, '') // Remove final chunk marker
    .replace(/\r\n[0-9a-fA-F]+\r\n/g, '') // Remove any intermediate chunk markers
    .replace(/\*+$/, ''); // Remove trailing asterisks from regex capture
}

// Handle Anthropic API calls
async function callAnthropic(request: ChatCompletionRequest) {
  const { messages, temperature, max_tokens, top_p, stream } = request;
  const modelId = request.model.includes('/') ? request.model.split('/')[1] : request.model;

  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content;
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const requestBody = {
    model: modelId,
    max_tokens: max_tokens || 1024,
    temperature: temperature,
    top_p: top_p,
    system: systemMessage,
    messages: anthropicMessages,
    stream: stream || false,
  };

  // Use zkFetch for Anthropic API calls with zero-knowledge proofs
  const reclaimClient = new ReclaimClient(
    process.env.RECLAIM_APP_ID || '',
    process.env.RECLAIM_APP_SECRET || ''
  );

  const publicOptions = {
    method: 'POST',
    useTee: true,
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  };

  const privateOptions = {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
    },
  };

  const proof = await reclaimClient.zkFetch(
    ANTHROPIC_API_URL,
    publicOptions,
    privateOptions
  );

  console.log('Anthropic Proof:', proof);
  // Extract and decode the response from the proof
  const rawData = proof?.extractedParameterValues?.data || '';
  const cleanedData = decodeChunkedResponse(rawData);
  const data = JSON.parse(cleanedData);
  const textContent = data.content.find((c: any) => c.type === 'text');

  return NextResponse.json({
    id: data.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: request.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: textContent?.text || '',
      },
      finish_reason: data.stop_reason || 'stop',
    }],
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
    proof
  });
}

// Handle OpenAI API calls
async function callOpenAI(request: ChatCompletionRequest) {
  const { messages, temperature, max_tokens, top_p, frequency_penalty, presence_penalty } = request;
  const modelId = request.model.includes('/') ? request.model.split('/')[1] : request.model;

  const requestBody = {
    model: modelId,
    messages: messages,
    temperature,
    max_tokens,
    top_p,
    frequency_penalty,
    presence_penalty,
  };

  // Use zkFetch for OpenAI API calls with zero-knowledge proofs
  const reclaimClient = new ReclaimClient(
    process.env.RECLAIM_APP_ID || '',
    process.env.RECLAIM_APP_SECRET || ''
  );

  const publicOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };

  const privateOptions = {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  };

  const proof = await reclaimClient.zkFetch(
    OPENAI_API_URL,
    publicOptions,
    privateOptions
  );

  console.log('OpenAI Proof:', proof);
  // Extract and decode the response from the proof
  const rawData = proof?.extractedParameterValues?.data || '';
  const cleanedData = decodeChunkedResponse(rawData);
  const data = JSON.parse(cleanedData);

  return NextResponse.json({
    ...data,
    proof
  });
}

// Handle Google Gemini API calls
async function callGoogle(request: ChatCompletionRequest) {
  const { messages, temperature, max_tokens, top_p } = request;
  const modelId = request.model.includes('/') ? request.model.split('/')[1] : request.model;

  // Convert messages to Google format
  const systemMessage = messages.find(m => m.role === 'system')?.content;
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const requestBody: any = {
    contents: contents,
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: max_tokens,
      topP: top_p,
    },
  };

  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage }],
    };
  }

  // Use zkFetch for Google API calls with zero-knowledge proofs
  const reclaimClient = new ReclaimClient(
    process.env.RECLAIM_APP_ID || '',
    process.env.RECLAIM_APP_SECRET || ''
  );

  const endpoint = `${GOOGLE_API_URL}/${modelId}:generateContent`;

  const publicOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };

  const privateOptions = {
    headers: {
      'x-goog-api-key': process.env.GOOGLE_API_KEY || '',
    },
  };

  const proof = await reclaimClient.zkFetch(
    endpoint,
    publicOptions,
    privateOptions
  );

  // Extract and decode the response from the proof
  const rawData = proof?.extractedParameterValues?.data || '';
  const cleanedData = decodeChunkedResponse(rawData);
  const data = JSON.parse(cleanedData);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return NextResponse.json({
    id: 'chatcmpl-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: request.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: text,
      },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0,
    },
    proof
  });
}

// Main POST handler with x402 payment
async function handlePOST(req: NextRequest) {
  try {
    const body: ChatCompletionRequest = await req.json();

    // Validate required fields
    if (!body.model) {
      return NextResponse.json(
        { error: { message: 'Model is required', type: 'invalid_request_error' } },
        { status: 400 }
      );
    }

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: { message: 'Messages array is required and must not be empty', type: 'invalid_request_error' } },
        { status: 400 }
      );
    }

    // Determine provider and route request
    const provider = getProvider(body.model);

    switch (provider) {
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          return NextResponse.json(
            { error: { message: 'Anthropic API key not configured', type: 'authentication_error' } },
            { status: 401 }
          );
        }
        return await callAnthropic(body);

      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json(
            { error: { message: 'OpenAI API key not configured', type: 'authentication_error' } },
            { status: 401 }
          );
        }
        return await callOpenAI(body);

      case 'google':
        if (!process.env.GOOGLE_API_KEY) {
          return NextResponse.json(
            { error: { message: 'Google API key not configured', type: 'authentication_error' } },
            { status: 401 }
          );
        }
        return await callGoogle(body);

      default:
        return NextResponse.json(
          { error: { message: 'Unsupported model provider', type: 'invalid_request_error' } },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error('API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: { message: errorMessage, type: 'api_error' } },
      { status: 500 }
    );
  }
}

// Export POST handler wrapped with x402 payment
export const POST = withX402Payment(handlePOST, {
  price: '$0.01', // $0.01 per request
  config: {
    description: 'LLM API call - Supports Anthropic Claude, OpenAI GPT, and Google Gemini models',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'Model ID in format provider/model (e.g., openai/gpt-4, anthropic/claude-3-5-sonnet-20241022)',
        },
        messages: {
          type: 'array',
          description: 'Array of message objects with role and content',
        },
        temperature: {
          type: 'number',
          description: 'Sampling temperature (0-2)',
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens to generate',
        },
      },
      required: ['model', 'messages'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        object: { type: 'string' },
        created: { type: 'number' },
        model: { type: 'string' },
        choices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              message: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  content: { type: 'string' },
                },
              },
              finish_reason: { type: 'string' },
            },
          },
        },
        usage: {
          type: 'object',
          properties: {
            prompt_tokens: { type: 'number' },
            completion_tokens: { type: 'number' },
            total_tokens: { type: 'number' },
          },
        },
      },
    },
  },
});

// Also export GET for x402 payment discovery
export const GET = withX402Payment(
  async (req: NextRequest) => {
    return NextResponse.json({ message: 'Use POST to call LLM API' }, { status: 200 });
  },
  {
    price: '$0.01',
    config: {
      description: 'LLM API information endpoint',
    },
  }
);
