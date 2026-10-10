"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Users, Award, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export function SpaceHeader() {
  const { walletAddress, user, connectWallet } = useAuth();
  const [stats, setStats] = useState<{ total_users: number; total_points_awarded: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getPlatformStats();
        if (s) setStats(s);
      } catch {
        // keep null
      }
    }
    load();
  }, []);

  return (
    <div className="w-full border-b border-ink/[0.08] bg-page/60 backdrop-blur-md pt-4 pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Banner with BCL Cover Gradient */}
        <div className="relative h-32 sm:h-40 w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-[#001844] via-[#002b80] to-brand p-5 flex flex-col justify-end">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.12] via-transparent to-black/60 pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-brand/30 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

          {/* Top Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="rounded-full bg-black/40 backdrop-blur-md border border-white/[0.15] px-3 py-1 text-[11px] font-semibold tracking-wider text-white flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              <span>COMMUNITY SPACE</span>
            </span>

            <span className="rounded-full bg-black/40 backdrop-blur-md border border-white/[0.1] px-3 py-1 text-[11px] font-medium text-zinc-300">
              BOTCHAIN TESTNET
            </span>
          </div>
        </div>

        {/* Space Profile Card */}
        <div className="relative -mt-10 sm:-mt-12 flex flex-col md:flex-row md:items-end justify-between gap-5 px-2 sm:px-3">
          {/* Avatar + Space Info */}
          <div className="flex items-end gap-4 sm:gap-5">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 border-brand bg-surface p-1 shrink-0 shadow-2xl shadow-brand/40 animate-float-slow transition-transform hover:scale-105 duration-300">
              <Image
                src="/bcl-onchain_logo.PNG"
                alt="BCL Space Logo"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-ink tracking-tight">
                  Blockchain Club LAUTECH
                </h1>
                <CheckCircle2 className="h-5 w-5 text-brand fill-brand/20 shrink-0" />
              </div>

              <p className="text-xs text-ink-3 font-medium">
                @bcl_lautech • Engage • Earn • Build
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-3 pt-1 font-medium">
                {stats && (
                  <>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-ink-4" />
                      <strong className="text-ink num-mono">{stats.total_users.toLocaleString()}</strong> Builders
                    </span>
                    <span className="text-ink-5">·</span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-brand" />
                      <strong className="text-ink num-mono">{stats.total_points_awarded.toLocaleString()}</strong> Points Earned
                    </span>
                    <span className="text-ink-5">·</span>
                  </>
                )}
                <span className="flex items-center gap-1 text-accent-fg">
                  <Zap className="h-3.5 w-3.5 text-accent-fg" />
                  <span>Zero Network Fees</span>
                </span>
              </div>
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-2 shrink-0 text-xs font-semibold">
            {walletAddress ? (
              <div className="flex items-center gap-2 border border-ink/[0.1] bg-subtle px-3.5 py-2 rounded-lg font-medium">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-ink font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                <span className="text-ink-4">·</span>
                <span className="text-brand font-bold num-mono">{user?.total_points || 0} PTS</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="rounded-lg bg-brand hover:bg-brand-hi px-4 py-2 font-bold text-white transition cursor-pointer shadow-lg shadow-brand/25"
              >
                CONNECT WALLET
              </button>
            )}

            <Link
              href="/domains"
              className="rounded-lg border border-ink/[0.12] bg-subtle hover:bg-raised px-3.5 py-2 text-ink-2 transition"
            >
              CLAIM .BCL NAME
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
