"use client";

import React, { useState, useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "viem";
import { celoAlfajores, celo } from "@reown/appkit/networks";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

// Botchain Testnet Configuration
export const botchainTestnet = defineChain({
  id: 968,
  name: "Botchain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "Botchain Scan",
      url: "https://scan.bohr.life",
    },
  },
  testnet: true,
});

// 1. Get Project ID strictly from environment variable
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

// 2. Set up Networks (Botchain Testnet is primary)
export const networks = [botchainTestnet, celoAlfajores, celo] as const;

// 3. Set up Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [botchainTestnet, celoAlfajores, celo],
});

// 4. Configure AppKit metadata
const metadata = {
  name: "BCL Onchain",
  description: "Blockchain Club LAUTECH - Engage • Earn • Build",
  url: "https://bcl-onchain.org",
  icons: ["/bcl-onchain_logo.PNG"],
};

// 5. Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet, celoAlfajores, celo],
  defaultNetwork: botchainTestnet,
  projectId,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#0052FF",
    "--w3m-border-radius-master": "12px",
    "--w3m-color-mix": "#06080E",
    "--w3m-color-mix-strength": 30,
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Suppress unhandled promise rejections from third-party browser wallet extensions
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || "");
      if (
        reason.includes("has not been authorized yet") ||
        reason.includes("chrome-extension://") ||
        reason.includes("Extension context invalidated")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0c101a",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "12px",
                padding: "12px 16px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6)",
              },
              success: {
                iconTheme: {
                  primary: "#00d26a",
                  secondary: "#0c101a",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#0c101a",
                },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
