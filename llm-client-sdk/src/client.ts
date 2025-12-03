import { createWalletClient, createPublicClient, http, WalletClient, PublicClient, Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';
import type { Chain } from 'viem/chains';
import axios, { AxiosInstance } from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import type { ClientConfig, LLMRequest, LLMResponse } from './types.js';

export class LLMClient {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private account: Account;
  private apiUrl: string;
  private network: 'base-sepolia' | 'base';
  private chain: Chain;
  private axiosClient: AxiosInstance;

  constructor(config: ClientConfig) {
    this.apiUrl = config.apiUrl;
    this.network = config.network || 'base';

    // Create account from private key
    this.account = privateKeyToAccount(config.walletPrivateKey as `0x${string}`);

    // Get chain config
    this.chain = this.network === 'base' ? base : baseSepolia;

    // Create wallet client
    this.walletClient = createWalletClient({
      account: this.account,
      transport: http(),
      chain: this.chain,
    });

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      transport: http(),
      chain: this.chain,
    });

    // Create axios client with x402 payment interceptor
    // x402-axios expects a viem wallet client
    this.axiosClient = withPaymentInterceptor(
      axios.create({
        baseURL: this.apiUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      this.walletClient as any
    );
  }


  /**
   * Call the LLM API with automatic x402 payment handling
   * The x402-axios interceptor handles the entire payment flow automatically
   */
  async callLlm(request: LLMRequest): Promise<LLMResponse> {
    try {
      console.log('🚀 Making LLM API call...', {
        apiUrl: this.apiUrl,
        network: this.network,
        wallet: this.account.address,
      });

      // Make the request - x402-axios will automatically:
      // 1. Send the initial request
      // 2. If 402 response, create payment with wallet
      // 3. Retry request with X-PAYMENT header
      // 4. Return the final response
      const response = await this.axiosClient.post('', request);

      console.log('✅ LLM API call successful');

      return response.data as LLMResponse;
    } catch (error: any) {
      console.error('❌ LLM API call failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      if (error instanceof Error) {
        throw new Error(`Failed to call LLM API: ${error.message}`);
      }
      throw error;
    }
  }


  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.account.address;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });
    return balance.toString();
  }
}
