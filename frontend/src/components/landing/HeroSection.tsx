"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Compass, Globe, Terminal, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function HeroSection() {
  const { walletAddress, connectWallet } = useAuth();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/[0.08] blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[200px] bg-emerald-600/[0.04] blur-[90px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Blockchain LAUTECH Club • Onchain Protocol</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink mb-6 leading-[1.1] font-heading">
          The On-Chain Identity &amp;{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400">
            Reputation Protocol
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-ink-3 leading-relaxed mb-10 font-normal">
          Complete club quests, unlock verified milestone badges, and claim your custom{" "}
          <span className="text-ink-2 font-bold">.bcl</span> username with zero network fees.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tasks"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Quests</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/domains"
            className="flex items-center gap-2 rounded-xl border border-ink/[0.12] bg-ink/[0.04] px-6 py-3 text-sm font-semibold text-ink-2 hover:bg-ink/[0.08] hover:border-emerald-500/40 transition"
          >
            <Globe className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <span>Claim .bcl Domain</span>
          </Link>
        </div>

        {/* Micro Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-ink-3 font-medium">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <span>Permanent Milestone Badges</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <span>Zero Network Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <span>Automated Activity Verification</span>
          </div>
        </div>
      </div>
    </section>
  );
}
