import { NextRequest, NextResponse } from 'next/server';
import { paymentMiddleware } from 'x402-express';

// x402 payment configuration
const X402_CONFIG = {
  walletAddress: process.env.X402_WALLET_ADDRESS || '',
  network: (process.env.X402_NETWORK || 'base-sepolia') as 'base-sepolia' | 'base',
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
};

// Convert Express middleware to Next.js compatible handler
export function withX402Payment(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: {
    price: string;
    description: string;
    inputSchema?: object;
    outputSchema?: object;
  }
) {
  return async (req: NextRequest) => {
    try {
      // Clone the request to read body without consuming it
      const clonedReq = req.clone();
      const body = await clonedReq.json().catch(() => ({}));

      // Create Express-like req/res objects from Next.js request
      const expressReq: any = {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        body: body,
        get: (header: string) => {
          return Object.fromEntries(req.headers.entries())[header.toLowerCase()];
        },
      };

      const expressRes: any = {
        status: (code: number) => {
          expressRes.statusCode = code;
          return expressRes;
        },
        json: (data: any) => {
          expressRes.data = data;
          expressRes.headersSent = true;
          return expressRes;
        },
        set: (key: string, value: string) => {
          if (!expressRes.headers) expressRes.headers = {};
          expressRes.headers[key] = value;
          return expressRes;
        },
        setHeader: (key: string, value: string) => {
          if (!expressRes.headers) expressRes.headers = {};
          expressRes.headers[key] = value;
          return expressRes;
        },
        send: (data: any) => {
          expressRes.data = data;
          expressRes.headersSent = true;
          return expressRes;
        },
        statusCode: 200,
        headers: {},
        data: null,
        headersSent: false,
      };

      // Set up payment middleware
      const middleware = paymentMiddleware(
        X402_CONFIG.walletAddress,
        {
          [`${req.method} ${new URL(req.url).pathname}`]: {
            price: config.price,
            network: X402_CONFIG.network,
            config: {
              description: config.description,
              inputSchema: config.inputSchema,
              outputSchema: config.outputSchema,
            },
          },
        },
        {
          url: X402_CONFIG.facilitatorUrl,
        }
      );

      // Run middleware
      let nextCalled = false;
      const next = (err?: any) => {
        nextCalled = true;
        if (err) throw err;
      };

      await new Promise<void>((resolve, reject) => {
        try {
          middleware(expressReq, expressRes, (err?: any) => {
            if (err) {
              reject(err);
            } else {
              next();
              resolve();
            }
          });
        } catch (err) {
          reject(err);
        }
      });

      // If middleware responded (402 payment required), return that response
      if (expressRes.headersSent || expressRes.statusCode === 402) {
        return NextResponse.json(
          expressRes.data || {},
          {
            status: expressRes.statusCode,
            headers: expressRes.headers,
          }
        );
      }

      // Payment verified, proceed with handler
      return await handler(req);
    } catch (error) {
      console.error('x402 payment error:', error);
      return NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : 'Payment verification failed',
            type: 'payment_error',
          },
        },
        { status: 500 }
      );
    }
  };
}
