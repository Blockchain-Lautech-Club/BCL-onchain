"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, Code2, Trophy, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "1",
      icon: UserPlus,
      title: "Claim Your .bcl Name",
      description:
        "Connect your MetaMask or preferred Web3 wallet and mint your personalized .bcl identity for free on Botchain. No gas fees, no credit cards.",
      actionText: "Claim Name",
      actionHref: "/domains",
    },
    {
      num: "2",
      icon: Code2,
      title: "Conquer Quests & Sprints",
      description:
        "Choose from active coding tasks, smart contract tutorials, workshop check-ins, and hackathons. Submit your on-chain transaction hash or work link.",
      actionText: "Browse Quests",
      actionHref: "/tasks",
    },
    {
      num: "3",
      icon: Trophy,
      title: "Level Up & Prove Your Skills",
      description:
        "Earn club points, unlock official milestone NFT badges, rank on the club leaderboard, and share your public portfolio with recruiters.",
      actionText: "View Leaderboard",
      actionHref: "/leaderboard",
    },
  ];

  return (
    <section className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <span className="text-[11px] font-semibold text-[#0052ff] uppercase tracking-wider">
            GETTING STARTED
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mt-1">
            How BCL Onchain Works
          </h2>
        </div>
        <p className="text-xs text-zinc-400 font-sans max-w-sm">
          Get started in under 2 minutes. Build your verified developer credentials on Botchain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="surface-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-5 card-interactive relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[#0052ff]/10 border border-[#0052ff]/25 text-[#0052ff] flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-extrabold font-heading text-white/20">
                    0{s.num}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold font-heading text-white tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {s.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06]">
                <Link
                  href={s.actionHref}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052ff] hover:text-[#1a68ff] transition"
                >
                  <span>{s.actionText}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
