"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, Award, FileCode2, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function WhatIsBclOnchain() {
  const pillars = [
    {
      num: "01",
      title: "Decentralized Web3 Identity",
      badge: ".bcl Handles",
      description:
        "Replace complex 42-character wallet addresses with a memorable, personalized handle like 'adebayo.bcl'. It serves as your official Web3 passport for hackathons, community governance, and ecosystem events.",
      benefits: [
        "Human-readable username on Botchain",
        "100% free registration for all members",
        "Permanent, self-sovereign digital identity",
      ],
      linkText: "Find your .bcl name",
      linkHref: "/domains",
      accentColor: "text-[#0052ff]",
      borderColor: "border-[#0052ff]/20",
      bgColor: "bg-[#0052ff]/10",
    },
    {
      num: "02",
      title: "Practical Proof of Work",
      badge: "Real Quests",
      description:
        "Traditional resumes can be exaggerated, but on-chain activity is transparent and verifiable. Complete hands-on coding tasks, deploy smart contracts, attend workshops, and submit real transaction proof to earn community points.",
      benefits: [
        "Hands-on smart contract deployments",
        "Workshop attendance & hackathon bounties",
        "Automated cryptographic verification",
      ],
      linkText: "Explore active quests",
      linkHref: "/tasks",
      accentColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      bgColor: "bg-emerald-500/10",
    },
    {
      num: "03",
      title: "Verifiable Career Credentials",
      badge: "Milestone Badges",
      description:
        "As you complete quests and level up, you unlock permanent, non-transferable milestone badges. When Web3 companies, protocols, and sponsors scout talent, your on-chain track record speaks for itself.",
      benefits: [
        "Tamper-proof digital credentials",
        "Public portfolio link for recruiters",
        "Real-time global leaderboard ranking",
      ],
      linkText: "View leaderboard",
      linkHref: "/leaderboard",
      accentColor: "text-purple-400",
      borderColor: "border-purple-500/20",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <section className="space-y-10 py-6">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[11px] font-semibold text-[#0052ff] uppercase tracking-wider bg-[#0052ff]/10 border border-[#0052ff]/20 px-3 py-1 rounded-full">
          PURPOSE &amp; MISSION
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          What is BCL Onchain For?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans max-w-2xl mx-auto">
          Early achievements, technical skills, and developer contributions are often scattered across chats and unverified resumes.
          BCL Onchain solves this by recording your technical skills, workshop attendance, and code contributions directly on the blockchain.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <div
            key={p.num}
            className="surface-card rounded-2xl p-6 sm:p-7 border border-white/[0.08] flex flex-col justify-between space-y-6 card-interactive relative overflow-hidden"
          >
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${p.accentColor} font-heading tracking-wider`}>
                  {p.num}.
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
                  {p.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading text-white tracking-tight">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {p.description}
                </p>
              </div>

              {/* Checkmark Benefits */}
              <div className="pt-2 space-y-2 border-t border-white/[0.06]">
                {p.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${p.accentColor} shrink-0 mt-0.5`} />
                    <span className="text-[11px] leading-tight">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom link */}
            <div className="pt-4 border-t border-white/[0.06]">
              <Link
                href={p.linkHref}
                className={`flex items-center gap-1.5 text-xs font-bold ${p.accentColor} hover:underline transition`}
              >
                <span>{p.linkText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Value Comparison Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0c101a] via-[#101626] to-[#0c101a] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h4 className="text-base font-bold font-heading text-white">
              Built for Builders, Recognized by Industry
            </h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Whether you are preparing for international Web3 hackathons, building decentralized tools, or interviewing for developer roles,
            your BCL Onchain profile gives you undeniable, verifiable evidence of your capabilities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/tasks"
            className="rounded-xl bg-[#0052ff] hover:bg-[#1a68ff] px-5 py-2.5 text-xs font-bold text-white transition shadow-md shadow-[#0052ff]/20"
          >
            Start Your First Quest
          </Link>
          <Link
            href="/domains"
            className="rounded-xl border border-white/[0.12] bg-[#0c101a] hover:bg-[#141a28] px-5 py-2.5 text-xs font-semibold text-zinc-300 transition"
          >
            Claim Username
          </Link>
        </div>
      </div>
    </section>
  );
}
