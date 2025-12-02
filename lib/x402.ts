import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from 'x402-next';
import { createFacilitatorConfig } from '@coinbase/x402';

// x402 payment configuration
const X402_CONFIG = {
  walletAddress: process.env.X402_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
  network: (process.env.X402_NETWORK || 'base') as 'base-sepolia' | 'base',
};

// Create facilitator config with CDP API credentials
const facilitatorConfig = createFacilitatorConfig(
  process.env.CDP_API_KEY_ID,
  process.env.CDP_API_KEY_SECRET
);

console.log('🔧 x402 Configuration:', {
  walletAddress: X402_CONFIG.walletAddress,
  network: X402_CONFIG.network,
  facilitator: facilitatorConfig.url,
  cdpAuth: !!process.env.CDP_API_KEY_ID,
});

// Use x402-next wrapper for Next.js
export function withX402Payment(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: {
    price: string;
  }
) {
  // Use x402-next wrapper which is designed for Next.js
  return withX402(
    handler,
    X402_CONFIG.walletAddress as `0x${string}`,
    {
      price: config.price,
      network: X402_CONFIG.network,
    },
    facilitatorConfig // Use CDP Coinbase facilitator with auth
  );
}
