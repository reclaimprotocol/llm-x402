#!/usr/bin/env node

import { createWallet } from './create-wallet.js';

// Only run wallet creation if not in CI environment
const isCIEnvironment = process.env.CI === 'true' || process.env.CI === '1';

if (!isCIEnvironment) {
  console.log('\n🎉 Thank you for installing llm-client-x402!\n');
  console.log('Generating a wallet for x402 payments...\n');

  createWallet(true);
} else {
  console.log('Skipping wallet creation in CI environment.');
}
