"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Cpu, Zap, Lock } from "lucide-react";

export function ProtocolExplainer() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const items = [
    {
      q: "What are BCL achievement badges?",
      icon: Shield,
      a: "Milestone badges and certificates are permanent and earned by solving challenges, attending workshops, and contributing to club projects. Once earned, they are permanently linked to your profile as proof of your skills and achievements.",
    },
    {
      q: "Do I need to pay transaction or gas fees?",
      icon: Zap,
      a: "No! You never have to pay network fees. When you level up, earn a badge, or claim a .bcl username, our system automatically sponsors and covers 100% of the network costs for you.",
    },
    {
      q: "How does the platform ensure points and rankings are fair?",
      icon: Lock,
      a: "Every quest submission is automatically verified and recorded. The system ensures points are credited accurately and prevents duplicate claims, keeping club leaderboards fair and trustworthy.",
    },
    {
      q: "What can I do with a .bcl name?",
      icon: Cpu,
      a: "Your .bcl name acts as your unified club username (like alex.bcl). It replaces long, complicated addresses and links directly to your club profile, workshop achievements, portfolio, and social links.",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <span className="text-[11px] font-semibold text-[#0052ff] uppercase tracking-wider">
            COMMUNITY &amp; PLATFORM
          </span>
          <h2 className="text-xl font-extrabold font-heading text-white tracking-tight">Frequently Asked Questions</h2>
        </div>
        <span className="text-xs font-medium text-zinc-400 hidden sm:inline">EVERYTHING YOU NEED TO KNOW</span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="surface-card rounded-xl overflow-hidden border border-white/[0.08] transition"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#0052ff] shrink-0" />
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 pt-0 border-t border-white/[0.04] text-xs text-zinc-400 font-sans leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
