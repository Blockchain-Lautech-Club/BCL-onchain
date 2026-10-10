"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Terminal, Globe, Award, Shield, Check, Zap, Code, Users } from "lucide-react";
import { api } from "@/lib/api";

export function HeroEditorial() {
  const [stats, setStats] = useState({
    total_users: 142,
    total_points_awarded: 48900,
    total_tasks_completed: 386,
    total_domains_registered: 71,
  });

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getPlatformStats();
        if (s) setStats(s);
      } catch {
        // use default state
      }
    }
    load();
  }, []);

  return (
    <section className="space-y-8 pt-4">
      {/* Brand Hero Card with Logo */}
      <div className="surface-card rounded p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden">
        {/* Subtle radial glow in logo cobalt blue */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-[#0052ff]/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* High-res Logo Display */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-white/[0.12] bg-[#06080e] p-1.5 shrink-0 flex items-center justify-center shadow-lg shadow-[#0052ff]/10">
              <Image
                src="/bcl-onchain_logo.PNG"
                alt="BCL Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#0052ff] uppercase tracking-wider">
                  BLOCKCHAIN LAUTECH CLUB
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-[11px] font-medium text-zinc-400">OFFICIAL PROTOCOL</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
                BCL <span className="text-[#0052ff]">ONCHAIN</span>
              </h1>
              <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300 tracking-wide">
                <span>ENGAGE</span>
                <span className="text-[#0052ff]">●</span>
                <span>EARN</span>
                <span className="text-[#0052ff]">●</span>
                <span>BUILD</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <Link
              href="/tasks"
              className="flex items-center gap-1.5 rounded-lg bg-[#0052ff] hover:bg-[#1a68ff] px-4 py-2 font-bold text-white transition shadow-sm"
            >
              <span>EXPLORE QUESTS</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <Link
              href="/domains"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#121827] px-4 py-2 font-medium text-zinc-200 hover:bg-[#1a2338] transition"
            >
              <span>MINT .BCL</span>
            </Link>
          </div>
        </div>

        {/* 3 Brand Pillars: Engage • Earn • Build */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/[0.06] text-xs">
          <div className="border border-white/[0.04] bg-[#080b12] p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-white font-bold font-heading">
              <Users className="h-3.5 w-3.5 text-[#0052ff]" />
              <span>1. ENGAGE</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Join technical meetups, active coding workshops, and claim your verified Web3 identity.
            </p>
          </div>

          <div className="border border-white/[0.04] bg-[#080b12] p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-white font-bold font-heading">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span>2. EARN</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Earn reward points, BCL tokens, and milestone achievement badges.
            </p>
          </div>

          <div className="border border-white/[0.04] bg-[#080b12] p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-white font-bold font-heading">
              <Code className="h-3.5 w-3.5 text-cyan-400" />
              <span>3. BUILD</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Deploy verified smart contracts on Botchain, ship open-source tools, and lead community projects.
            </p>
          </div>
        </div>
      </div>

      {/* Protocol Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="bg-[#090d16] p-3.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Points Awarded</span>
          <div className="text-xl font-bold text-white num-mono mt-0.5">
            {stats.total_points_awarded.toLocaleString()} <span className="text-xs text-zinc-500 font-normal">PTS</span>
          </div>
        </div>

        <div className="bg-[#090d16] p-3.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Verified Quests</span>
          <div className="text-xl font-bold text-white num-mono mt-0.5">
            {stats.total_tasks_completed.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#090d16] p-3.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Active .bcl Names</span>
          <div className="text-xl font-bold text-[#0052ff] num-mono mt-0.5">
            {stats.total_domains_registered.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#090d16] p-3.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Active Builders</span>
          <div className="text-xl font-bold text-white num-mono mt-0.5">
            {stats.total_users.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}
