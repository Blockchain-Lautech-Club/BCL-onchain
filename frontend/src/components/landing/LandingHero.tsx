"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, CheckCircle2, XCircle, ArrowRight, Loader2, Shield, Award, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { checkOnchainNameAvailability } from "@/lib/contracts";

export function LandingHero() {
  const [searchLabel, setSearchLabel] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    name: string;
    available: boolean;
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchLabel.trim().toLowerCase().replace(".bcl", "");
    if (!clean || clean.length < 3) return;

    try {
      setIsSearching(true);
      setSearchResult(null);
      let res;
      try {
        res = await api.checkNameAvailability(clean);
      } catch {
        res = await checkOnchainNameAvailability(clean);
      }
      setSearchResult(res);
    } catch (err) {
      console.error("Availability check failed:", err);
      // Fallback
      setSearchResult({
        name: clean.endsWith(".bcl") ? clean : `${clean}.bcl`,
        available: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="relative w-full pt-6 pb-12 sm:pt-10 sm:pb-16 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#0052ff]/12 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/8 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-7">
        {/* Official Badge Pill */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.1] bg-[#0c101a]/80 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-md shadow-sm">
          <div className="h-4 w-4 rounded overflow-hidden relative shrink-0">
            <Image
              src="/bcl-onchain_logo.PNG"
              alt="BCL Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-white">Blockchain Club LAUTECH</span>
          <span className="text-zinc-600">·</span>
          <span className="text-[#0052ff] font-semibold">Official On-Chain Platform</span>
        </div>

        {/* Master Heading */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] font-heading">
            Your On-Chain Web3 Identity &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052ff] via-[#4d86ff] to-[#00d26a]">
              Proof of Work
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            BCL Onchain turns your hands-on learning, smart contract deployments, and technical contributions
            into permanent, verifiable credentials. Claim your custom <span className="text-white font-semibold">.bcl</span> identity
            and build a real on-chain portfolio open to anyone.
          </p>
        </div>

        {/* Central .bcl Domain Search & Claim Widget */}
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-white/[0.12] bg-[#0c101a]/95 p-2 sm:p-2.5 shadow-xl shadow-black/40 backdrop-blur-md">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchLabel}
                  onChange={(e) => {
                    setSearchLabel(e.target.value);
                    if (searchResult) setSearchResult(null);
                  }}
                  placeholder="Find your handle (e.g. adebayo, builder)"
                  className="w-full bg-transparent pl-10 pr-14 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
                <span className="absolute right-3.5 text-xs font-bold text-zinc-400">
                  .bcl
                </span>
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchLabel.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-[#0052ff] hover:bg-[#1a68ff] px-4 sm:px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-md shadow-[#0052ff]/25 shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Check Availability</span>
                )}
              </button>
            </form>

            {/* Instant Search Result Feedback */}
            {searchResult && (
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] px-2 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-heading text-sm">{searchResult.name}</span>
                  {searchResult.available ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Available to Claim
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-semibold text-[11px] bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                      <XCircle className="h-3 w-3" />
                      Taken / Claimed
                    </span>
                  )}
                </div>

                {searchResult.available && (
                  <Link
                    href={`/domains?name=${searchResult.name}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#0052ff] hover:text-[#1a68ff] transition"
                  >
                    <span>Claim Free &rarr;</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-4 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% Free on Botchain
            </span>
            <span>•</span>
            <span>Zero Network Fees</span>
            <span>•</span>
            <span>Permanent On-Chain Ownership</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/tasks"
            className="flex items-center gap-2 rounded-xl bg-[#0052ff] hover:bg-[#1a68ff] px-6 py-3 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-[#0052ff]/25"
          >
            <Award className="h-4 w-4" />
            <span>Explore Quests &amp; Sprints</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/domains"
            className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#0c101a] hover:bg-[#141a28] px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-200 transition"
          >
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Browse .bcl Registry</span>
          </Link>
        </div>

        {/* Feature Highlights Strip */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="border border-white/[0.06] bg-[#0a0d14]/70 p-3.5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-heading">
              <span className="h-2 w-2 rounded-full bg-[#0052ff]" />
              <span>Web3 Identity</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Replace 0x wallet addresses with your name.bcl
            </p>
          </div>

          <div className="border border-white/[0.06] bg-[#0a0d14]/70 p-3.5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-heading">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Practical Quests</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Smart contract deployments &amp; workshop bounties
            </p>
          </div>

          <div className="border border-white/[0.06] bg-[#0a0d14]/70 p-3.5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-heading">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span>Milestone Badges</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Permanent credentials for proven technical skills
            </p>
          </div>

          <div className="border border-white/[0.06] bg-[#0a0d14]/70 p-3.5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-heading">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Zero Network Fees</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Club members claim and verify completely free
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
