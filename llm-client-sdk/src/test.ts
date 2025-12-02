import { LLMClient } from './client.js';

async function test() {
  // Check for required environment variables
  if (!process.env.X402_WALLET_PRIVATE_KEY) {
    console.error('❌ X402_WALLET_PRIVATE_KEY not set in environment');
    console.log('   Run: npx create-wallet');
    process.exit(1);
  }

  if (!process.env.LLM_API_URL) {
    console.error('❌ LLM_API_URL not set in environment');
    console.log('   Set it to your LLM API endpoint (e.g., http://localhost:3000/api/call-llm)');
    process.exit(1);
  }

  console.log('🧪 Testing LLM Client SDK\n');

  try {
    // Initialize client
    const client = new LLMClient({
      apiUrl: process.env.LLM_API_URL,
      walletPrivateKey: process.env.X402_WALLET_PRIVATE_KEY,
      network: (process.env.X402_NETWORK as any) || 'base',
    });

    console.log(`✅ Client initialized`);
    console.log(`   Wallet: ${client.getWalletAddress()}`);
    console.log(`   Balance: ${await client.getBalance()} wei\n`);

    // Test a simple call
    console.log('📞 Making test LLM call...\n');

    const response = await client.callLlm({
      model: 'anthropic/claude-3-haiku-20240307',
      messages: [
        { role: 'user', content: 'Say "Hello from llm-client-x402!" in exactly 5 words.' }
      ],
      max_tokens: 50,
    });

    console.log('✅ Response received:\n');
    console.log(`   Model: ${response.model}`);
    console.log(`   Content: ${response.choices[0].message.content}`);
    console.log(`   Tokens: ${response.usage.total_tokens}`);

    if (response.proof) {
      console.log('   ✅ ZK Proof included\n');
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
test();
