import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Client Test",
  description: "Testing llm-client-x402 SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
