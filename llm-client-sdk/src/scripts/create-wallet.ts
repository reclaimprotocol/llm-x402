#!/usr/bin/env node

import { Wallet } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const DEFAULT_NETWORK = 'base';

function createWallet(isPostInstall: boolean = false) {
  // Generate a new random wallet
  const wallet = Wallet.createRandom();

  console.log('\n' + '='.repeat(70));
  console.log('  🔐 New Ethereum Wallet Created');
  console.log('='.repeat(70) + '\n');

  console.log('📝 Wallet Details:\n');
  console.log(`   Address (Public Key):  ${wallet.address}`);
  console.log(`   Private Key:           ${wallet.privateKey}\n`);

  console.log('⚠️  SECURITY WARNING:');
  console.log('   Keep your private key secure and never share it with anyone!\n');

  console.log('📋 Add to your .env file:\n');
  console.log('   X402_WALLET_PRIVATE_KEY=' + wallet.privateKey);
  console.log('   X402_NETWORK=' + DEFAULT_NETWORK + '\n');

  console.log('💰 Fund your wallet:');
  console.log(`   1. Get USDC on ${DEFAULT_NETWORK} network`);
  console.log(`   2. Send USDC to: ${wallet.address}`);
  console.log('   3. Minimum amount: ~$1 USDC (for testing)\n');

  console.log('🔗 Get USDC on Base mainnet:');
  if (DEFAULT_NETWORK === 'base') {
    console.log('   • Buy USDC on Coinbase: https://www.coinbase.com/');
    console.log('   • Bridge from Ethereum to Base: https://bridge.base.org/');
    console.log('   • Swap ETH for USDC on Base using Uniswap or other DEXs\n');
  } else if (DEFAULT_NETWORK === 'base-sepolia') {
    console.log('   • Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
    console.log('   • Bridge testnet ETH to Base Sepolia: https://bridge.base.org/');
    console.log('   • Swap testnet ETH for USDC on Uniswap or other DEXs\n');
  } else {
    console.log(`   • Get USDC on ${DEFAULT_NETWORK} network from an exchange\n`);
  }

  if (isPostInstall) {
    console.log('ℹ️  Note: You can use this wallet address or use one of your own.\n');
    console.log('   To generate a new wallet later, run: npx create-wallet\n');
  }

  console.log('='.repeat(70) + '\n');
}

// Check if this is being run as a script (ES module way)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('create-wallet') || process.argv[1].endsWith('create-wallet.js'));

if (isMainModule) {
  const isPostInstall = process.argv.includes('--postinstall');
  createWallet(isPostInstall);
}

export { createWallet };
