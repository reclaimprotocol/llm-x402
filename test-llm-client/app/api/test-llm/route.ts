import { NextRequest, NextResponse } from 'next/server';
import { LLMClient } from '@reclaimprotocol/llm-x402-client';

export async function POST(req: NextRequest) {
  try {
    const { model, message } = await req.json();

    // Validate environment variables
    if (!process.env.X402_WALLET_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'X402_WALLET_PRIVATE_KEY not configured. Run: npx create-wallet' },
        { status: 500 }
      );
    }

    if (!process.env.LLM_API_URL) {
      return NextResponse.json(
        { error: 'LLM_API_URL not configured' },
        { status: 500 }
      );
    }

    // Initialize the LLM client
    console.log('🔧 Initializing LLM Client...', {
      apiUrl: process.env.LLM_API_URL,
      network: process.env.X402_NETWORK,
    });
    const client = new LLMClient({
      apiUrl: process.env.LLM_API_URL,
      walletPrivateKey: process.env.X402_WALLET_PRIVATE_KEY,
      network: process.env.X402_NETWORK as 'base' | 'base-sepolia' || 'base',
    });

    console.log('🔑 Wallet:', client.getWalletAddress());
    console.log('💰 Balance:', await client.getBalance(), 'wei');

    // Make the LLM API call
    const result = await client.callLlm({
      model,
      messages: [
        { role: 'user', content: message }
      ],
      max_tokens: 1024,
    });

    return NextResponse.json({
      response: result.choices[0].message.content,
      model: result.model,
      usage: result.usage,
      hasProof: !!result.proof,
    });

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}
