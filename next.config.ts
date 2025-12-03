import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['koffi', '@reclaimprotocol/zk-fetch'],
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    X402_WALLET_ADDRESS: process.env.X402_WALLET_ADDRESS,
    X402_NETWORK: process.env.X402_NETWORK,
    CDP_API_KEY_ID: process.env.CDP_API_KEY_ID,
    CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET,
    RECLAIM_APP_ID: process.env.RECLAIM_APP_ID,
    RECLAIM_APP_SECRET: process.env.RECLAIM_APP_SECRET,
  },
};

export default nextConfig;
