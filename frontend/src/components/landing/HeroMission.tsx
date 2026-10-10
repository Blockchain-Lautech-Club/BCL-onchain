"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, Terminal, CheckCircle2, ChevronRight, Layers } from "lucide-react";

export function HeroMission() {
  const [activeTab, setActiveTab] = useState<"overview" | "why" | "gas">("overview");

  return (
    <section className="space-y-6 pt-2">
      {/* Top Banner with Logo */}
      <div className="surface-card rounded-lg p-6 sm:p-8 border border-ink/[0.08] relative overflow-hidden">
        {/* Subtle radial ambient blue */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/15 blur-[110px] pointer-events-none rounded-full animate-pulse-glow" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-ink/[0.06] pb-8">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-ink/[0.12] bg-page p-1.5 shrink-0 flex items-center justify-center shadow-lg shadow-brand/20 animate-float-slow transition-transform hover:scale-105 duration-300">
              <Image
                src="/bcl-onchain_logo.PNG"
                alt="BCL Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">
                  BLOCKCHAIN CLUB LAUTECH
                </span>
                <span className="text-ink-5">·</span>
                <span className="text-[11px] font-medium text-ink-3">COMMUNITY PROTOCOL</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-ink">
                Verifiable Proof of Work for Web3 Builders
              </h1>
              <p className="text-sm text-ink-2 max-w-xl font-normal leading-relaxed pt-1">
                BCL Onchain turns your real technical contributions—smart contract deployments, workshop participation,
                and protocol builds—into immutable, tamper-proof credentials and a custom .bcl domain.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Link
              href="/tasks"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand hover:bg-brand-hi px-5 py-2.5 text-xs font-bold text-white transition shadow-sm hover:shadow-lg hover:shadow-brand/30 duration-200"
            >
              <span>START BUILDING</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/domains"
              className="flex items-center justify-center gap-2 rounded-lg border border-ink/[0.12] bg-subtle px-5 py-2.5 text-xs font-semibold text-ink-2 hover:bg-raised transition"
            >
              <span>CLAIM .BCL NAME</span>
            </Link>
          </div>
        </div>

        {/* Interactive "What is this for?" Tab Selector */}
        <div className="pt-6">
          <div className="flex items-center gap-2 border-b border-ink/[0.06] pb-3 mb-4 overflow-x-auto">
            <span className="text-[11px] font-semibold text-ink-3 uppercase mr-2">Learn:</span>
            {[
              { id: "overview", label: "What is BCL Onchain?" },
              { id: "why", label: "Why Permanent Badges?" },
              { id: "gas", label: "Who Pays the Fees?" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-ink/[0.1] text-ink font-semibold border border-ink/[0.12]"
                    : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="text-xs text-ink-2 leading-relaxed font-sans">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-ink/[0.04] bg-surface p-3.5 rounded space-y-1 card-interactive">
                  <div className="font-bold text-ink flex items-center gap-1.5">
                    <span className="text-brand">01.</span> Web3 Identity
                  </div>
                  <p className="text-[11px] text-ink-3 font-sans">
                    Every member registers a simple <code className="text-ink-2">.bcl</code> username to replace long, confusing wallet addresses.
                  </p>
                </div>

                <div className="border border-ink/[0.04] bg-surface p-3.5 rounded space-y-1 card-interactive">
                  <div className="font-bold text-ink flex items-center gap-1.5">
                    <span className="text-brand">02.</span> Verifiable Proof
                  </div>
                  <p className="text-[11px] text-ink-3 font-sans">
                    Tasks and contributions are verified automatically—no manual guesswork or unreliable honor systems.
                  </p>
                </div>

                <div className="border border-ink/[0.04] bg-surface p-3.5 rounded space-y-1 card-interactive">
                  <div className="font-bold text-ink flex items-center gap-1.5">
                    <span className="text-brand">03.</span> Career Reputation
                  </div>
                  <p className="text-[11px] text-ink-3 font-sans">
                    Your points, completed quests, and level tiers act as a verified portfolio for hackathons, bounties, and Web3 careers.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "why" && (
              <div className="border border-ink/[0.04] bg-surface p-4 rounded space-y-2">
                <div className="font-bold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Permanent Achievement Credentials</span>
                </div>
                <p className="text-xs text-ink-3 font-sans leading-relaxed">
                  Unlike ordinary certificates or tradable items, BCL milestone badges are permanently tied to your profile.
                  They represent real skills and workshops you completed, and can never be bought, transferred, or faked.
                </p>
              </div>
            )}

            {activeTab === "gas" && (
              <div className="border border-ink/[0.04] bg-surface p-4 rounded space-y-2">
                <div className="font-bold text-ink flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-brand" />
                  <span>100% Free to Join &amp; Build</span>
                </div>
                <p className="text-xs text-ink-3 font-sans leading-relaxed">
                  You don&apos;t need cryptocurrency to earn credentials or claim your names. The platform
                  automatically sponsors and covers all network transaction fees for you, making your experience 100% free and seamless.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
