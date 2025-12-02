import { NextResponse } from 'next/server';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  supports_streaming: boolean;
  supports_vision?: boolean;
}

// Anthropic models - based on official documentation
const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'anthropic/claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    context_length: 200000,
    supports_streaming: true,
    supports_vision: true,
  },
  {
    id: 'anthropic/claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    context_length: 200000,
    supports_streaming: true,
    supports_vision: false,
  },
  {
    id: 'anthropic/claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    context_length: 200000,
    supports_streaming: true,
    supports_vision: true,
  },
  {
    id: 'anthropic/claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    context_length: 200000,
    supports_streaming: true,
    supports_vision: true,
  },
  {
    id: 'anthropic/claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    context_length: 200000,
    supports_streaming: true,
    supports_vision: true,
  },
];

// Google Gemini models - based on official documentation
const GOOGLE_MODELS: ModelInfo[] = [
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    provider: 'google',
    context_length: 1048576,
    supports_streaming: true,
    supports_vision: true,
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    context_length: 2097152,
    supports_streaming: true,
    supports_vision: true,
  },
  {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    context_length: 1048576,
    supports_streaming: true,
    supports_vision: true,
  },
  {
    id: 'google/gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    provider: 'google',
    context_length: 1048576,
    supports_streaming: true,
    supports_vision: true,
  },
];

// Fetch OpenAI models using REST API
async function fetchOpenAIModels(): Promise<ModelInfo[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, skipping OpenAI models');
      return [];
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch OpenAI models');
      return [];
    }

    const data = await response.json();

    // Filter for chat completion models and map to our format
    const chatModels = data.data
      .filter((model: any) =>
        model.id.includes('gpt') ||
        model.id.includes('o1') ||
        model.id.includes('o3')
      )
      .map((model: any) => {
        const modelId = model.id;
        const supportsVision = modelId.includes('gpt-4o') ||
                               modelId.includes('gpt-4-turbo') ||
                               modelId.includes('vision') ||
                               modelId.includes('o1') ||
                               modelId.includes('o3');

        const supportsStreaming = !modelId.includes('o1');

        // Determine context length based on model
        let contextLength = 4096;
        if (modelId.includes('gpt-4o') || modelId.includes('gpt-4-turbo')) {
          contextLength = 128000;
        } else if (modelId.includes('gpt-3.5-turbo-16k')) {
          contextLength = 16385;
        } else if (modelId.includes('gpt-3.5-turbo')) {
          contextLength = 16385;
        } else if (modelId.includes('gpt-4-32k')) {
          contextLength = 32768;
        } else if (modelId.includes('gpt-4')) {
          contextLength = 8192;
        } else if (modelId.includes('o1') || modelId.includes('o3')) {
          contextLength = 200000;
        }

        return {
          id: `openai/${modelId}`,
          name: `OpenAI: ${modelId}`,
          provider: 'openai',
          context_length: contextLength,
          supports_streaming: supportsStreaming,
          supports_vision: supportsVision,
        };
      });

    return chatModels;
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch OpenAI models dynamically
    const openaiModels = await fetchOpenAIModels();

    // Combine all models
    const allModels = [
      ...ANTHROPIC_MODELS,
      ...openaiModels,
      ...GOOGLE_MODELS,
    ].sort((a, b) => {
      // Sort by provider, then by name
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      data: allModels,
      object: 'list',
    });
  } catch (error) {
    console.error('Error in supported-models endpoint:', error);

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch models',
          type: 'api_error',
        },
      },
      { status: 500 }
    );
  }
}
