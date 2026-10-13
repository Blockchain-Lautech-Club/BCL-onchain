"use client";

/**
 * Web3Provider — Reown AppKit removed; using wagmi with injected connector.
 *
 * For wallet login/auth the custom embedded wallet backend (walletApi.ts)
 * is used.  Wagmi is kept only to provide a web3 signer for on-chain
 * transactions in domains/page.tsx and reward/page.tsx.
 */

import React, { useState, useEffect } from "react";
import { createConfig, WagmiProvider, http, injected } from "wagmi";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

// ── Chain definitions ─────────────────────────────────────────────────────

export const botchainTestnet = defineChain({
  id: 968,
  name: "Botchain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.bohr.life"] },
  },
  blockExplorers: {
    default: { name: "Botchain Scan", url: "https://scan.bohr.life" },
  },
  testnet: true,
});

// ── Wagmi config (injected connector only — MetaMask, Coinbase, etc.) ────

export const wagmiConfig = createConfig({
  chains:      [botchainTestnet],
  connectors:  [injected()],
  transports:  { [botchainTestnet.id]: http("https://rpc.bohr.life") },
});

// ── Provider tree ─────────────────────────────────────────────────────────

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
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
    <WagmiProvider config={wagmiConfig}>
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
              success: { iconTheme: { primary: "#00d26a", secondary: "#0c101a" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#0c101a" } },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
