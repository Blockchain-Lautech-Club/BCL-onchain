"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function LandingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is BCL Onchain?",
      a: "BCL Onchain is the official decentralized identity and reputation system for Blockchain Club LAUTECH. It enables members to claim human-readable .bcl usernames, complete hands-on technical quests, and build a permanent on-chain portfolio of achievements recognized across the Web3 ecosystem.",
    },
    {
      q: "Is claiming a .bcl handle really free?",
      a: "Yes! All .bcl handle registrations and quest verifications operate on the Botchain Testnet with sponsored zero gas fees for club members. You never have to spend real money to participate.",
    },
    {
      q: "How do I earn club points and level up?",
      a: "You earn points by completing practical quests: writing smart contracts, building decentralized frontends, attending workshops, and collaborating on community projects. Once verified, points are credited to your profile immediately.",
    },
    {
      q: "What are milestone badges and can they be traded?",
      a: "Milestone badges are non-transferable, tamper-proof credentials awarded when you achieve major milestones. Because they cannot be transferred, sold, or faked, they serve as authentic proof of your real skills.",
    },
    {
      q: "Who can join Blockchain Club LAUTECH on-chain?",
      a: "Anyone interested in Web3, blockchain technology, smart contracts, and decentralized systems can connect their wallet and join immediately.",
    },
  ];

  return (
    <section className="space-y-6 py-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <span className="text-[11px] font-semibold text-[#0052ff] uppercase tracking-wider">
          COMMON QUESTIONS
        </span>
        <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-zinc-400 font-sans">
          Everything you need to know about BCL Onchain, identity, and verifiable credentials.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className="surface-card rounded-xl border border-white/[0.08] overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold font-heading text-white hover:text-[#0052ff] transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-3 ${
                    isOpen ? "rotate-180 text-[#0052ff]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-zinc-400 leading-relaxed font-sans border-t border-white/[0.04]">
                  <p className="pt-2">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
