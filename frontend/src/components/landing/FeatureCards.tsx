"use client";

import React from "react";
import { CheckCircle2, Shield, Zap, Flame, Award, Globe } from "lucide-react";

export function FeatureCards() {
  const features = [
    {
      title: "Automated Activity Verification",
      desc: "Instant point distribution with automatic verification for club quests, workshop attendance, and developer contributions.",
      icon: CheckCircle2,
      badge: "Automated",
    },
    {
      title: "Milestone Achievement Badges",
      desc: "Earn permanent badges representing verified skills, completed workshop tracks, streak days, and club achievements.",
      icon: Award,
      badge: "Permanent",
    },
    {
      title: "Zero Network Fees",
      desc: "Never let transaction fees hold you back. The club platform covers 100% of network fees when you earn badges or claim your username.",
      icon: Zap,
      badge: "100% Free",
    },
    {
      title: "Custom .bcl Usernames",
      desc: "Claim your unique club username. Link your profile, portfolio, GitHub, and social channels under one clean handle.",
      icon: Globe,
      badge: "Web3 ID",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 my-20">
      <div className="text-center mb-12">
        <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-heading mb-2">
          Platform Highlights
        </h2>
        <h3 className="text-2xl sm:text-4xl font-bold font-heading text-white tracking-tight">
          Engineered for Practical Learning &amp; Reputation
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="glass-panel glass-panel-hover rounded-2xl p-7 border border-white/[0.07] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase text-zinc-400">
                    {f.badge}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{f.title}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
