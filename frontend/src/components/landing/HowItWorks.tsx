"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, Code, Award, ArrowRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Connect Wallet",
      tagline: "ENGAGE",
      icon: KeyRound,
      desc: "Connect your Web3 wallet with one secure click. No passwords to remember, 100% safe and simple.",
      highlight: "Quick & Secure Login",
    },
    {
      num: "02",
      title: "Complete Club Quests",
      tagline: "EARN",
      icon: Code,
      desc: "Attend workshops, complete developer challenges, and submit your progress to earn club points.",
      highlight: "Automatic Progress Tracking",
    },
    {
      num: "03",
      title: "Earn Badges & .bcl Name",
      tagline: "BUILD",
      icon: Award,
      desc: "Level up to unlock exclusive milestone badges and claim your custom .bcl username—with zero fees.",
      highlight: "Permanent Badges • 100% Free",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <span className="text-[10px] font-semibold text-[#0052ff] uppercase tracking-wider">
            HOW IT WORKS
          </span>
          <h2 className="text-xl font-bold font-heading text-white tracking-tight">How BCL Onchain Works</h2>
        </div>
        <span className="text-xs font-medium text-zinc-500 hidden sm:inline tracking-wider">3 SIMPLE STEPS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="surface-card surface-hover rounded-xl p-5 flex flex-col justify-between space-y-4 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0052ff] num-mono">{s.num}.</span>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded tracking-wider">
                    {s.tagline}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#0052ff]/10 border border-[#0052ff]/20 text-[#0052ff] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-heading">{s.title}</h3>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{s.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/[0.04] text-[10px] font-medium text-zinc-500">
                {s.highlight}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
