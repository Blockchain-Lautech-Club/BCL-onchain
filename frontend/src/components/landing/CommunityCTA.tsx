"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function CommunityCTA() {
  const { walletAddress, connectWallet } = useAuth();

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 my-20">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-surface to-surface p-8 sm:p-14 text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Open Web3 Ecosystem</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink mb-4 tracking-tight">
            Ready to Build Your On-Chain Proof of Work?
          </h2>

          <p className="text-sm sm:text-base text-ink-3 mb-8 leading-relaxed">
            Connect your wallet to earn reputation points, unlock verified developer badges, and claim your custom .bcl domain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {walletAddress ? (
              <Link
                href="/tasks"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
              >
                <span>Browse Active Quests</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet to Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
