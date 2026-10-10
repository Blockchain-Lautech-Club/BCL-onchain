"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Shield, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LandingCta() {
  const { walletAddress, connectWallet } = useAuth();

  return (
    <section className="py-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0c101a] via-[#101728] to-[#080b12] p-8 sm:p-14 text-center space-y-6">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#0052ff]/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Open Web3 Ecosystem</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Ready to Build Your On-Chain Proof of Work?
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans max-w-xl mx-auto">
            Connect your wallet today to claim your free <span className="text-white font-semibold">.bcl</span> username,
            complete hands-on technical challenges, and level up with Blockchain Club LAUTECH.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {walletAddress ? (
              <Link
                href="/tasks"
                className="flex items-center gap-2 rounded-xl bg-[#0052ff] hover:bg-[#1a68ff] px-6 py-3 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-[#0052ff]/25"
              >
                <span>Browse Active Quests</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 rounded-xl bg-[#0052ff] hover:bg-[#1a68ff] px-6 py-3 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-[#0052ff]/25 cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                <span>Connect Wallet to Get Started</span>
              </button>
            )}

            <Link
              href="/domains"
              className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#0c101a] hover:bg-[#141a28] px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-200 transition"
            >
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Claim .bcl Handle</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
