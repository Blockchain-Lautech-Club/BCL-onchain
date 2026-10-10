"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, Award, Zap, ArrowRight, Flame } from "lucide-react";
import { api, Task } from "@/lib/api";

export function CampaignHero({ onSelectFeaturedTask }: { onSelectFeaturedTask: (task: Task) => void }) {
  const { walletAddress, user, stats, connectWallet } = useAuth();
  const [featuredTask, setFeaturedTask] = useState<Task | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const tasks = await api.getTasks();
        if (tasks && tasks.length > 0) {
          setFeaturedTask(tasks[0]);
        }
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-sans">
          BCL Community Hub &amp; Quests
        </h1>
        <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>Space: @bcl_lautech</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Featured Campaign Card (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-ink/[0.08] bg-gradient-to-br from-surface via-subtle to-page p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[220px] card-interactive">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand/20 blur-[90px] pointer-events-none rounded-full animate-pulse-glow" />

          {/* Top Bar of Featured Card */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand/20 border border-brand/40 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-brand">
                FEATURED SPRINT
              </span>
              <span className="text-[11px] font-medium text-ink-3 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-accent-fg" />
                100% Free
              </span>
            </div>

            {featuredTask && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 num-mono">
                <Award className="h-3 w-3" />
                +{featuredTask.points} PTS
              </span>
            )}
          </div>

          {/* Main Title & Space Issuer */}
          <div className="relative z-10 my-4 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-ink max-w-lg leading-snug">
              {featuredTask?.title || "Complete Quests & Claim Your .bcl Name"}
            </h2>
            <p className="text-xs text-ink-3 max-w-lg line-clamp-2">
              {featuredTask?.description ||
                "Participate in workshops, build projects on Celo, and earn milestone badges."}
            </p>
          </div>

          {/* Footer Bar: Space Avatar & CTA */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-ink/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg overflow-hidden border border-ink/[0.1] bg-surface p-0.5 shrink-0 flex items-center justify-center">
                <Image
                  src="/bcl-onchain_logo.PNG"
                  alt="BCL Space"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-ink-2">
                <span>Blockchain Club LAUTECH</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-brand fill-brand/20" />
              </div>
            </div>

            {featuredTask ? (
              <button
                onClick={() => onSelectFeaturedTask(featuredTask)}
                className="flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-hi px-4 py-2 text-xs font-bold text-white transition cursor-pointer shadow-md shadow-brand/25"
              >
                <span>Join Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href="/tasks"
                className="flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-hi px-4 py-2 text-xs font-bold text-white transition"
              >
                <span>Join Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Right: "My Assets" Panel (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-ink/[0.08] bg-surface p-5 sm:p-6 flex flex-col justify-between space-y-4 card-interactive">
          <div>
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-ink font-sans">My Assets</span>
              <Link href="/profile" className="text-xs text-brand hover:underline font-medium">
                Portfolio &rarr;
              </Link>
            </div>

            {walletAddress ? (
              <div className="space-y-4">
                {/* Level Asset */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center shrink-0 font-bold font-heading text-sm">
                    L{user?.level || 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">Level {user?.level || 1}</div>
                    <div className="text-xs text-ink-3">
                      {user?.total_points || 0} / {stats?.next_level_threshold || 1000} PTS to next level
                    </div>
                  </div>
                </div>

                {/* Points Asset */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">{user?.total_points || 0} Points</div>
                    <div className="text-xs text-ink-3">Earned from completed quests</div>
                  </div>
                </div>

                {/* Streak */}
                {stats && stats.streak_days > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink">{stats.streak_days} Day Streak</div>
                      <div className="text-xs text-ink-3">Consecutive active days</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 py-4 text-center">
                <div className="text-sm font-semibold text-ink">Connect to view your badges</div>
                <p className="text-xs text-ink-3">
                  Access your earned achievement badges, current level, and club points.
                </p>
                <button
                  onClick={connectWallet}
                  className="w-full rounded-lg bg-ink/[0.08] hover:bg-ink/[0.12] border border-ink/[0.1] py-2 text-xs font-bold text-ink transition cursor-pointer"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-ink/[0.06] flex items-center justify-between text-xs text-ink-3 font-medium">
            <span>Botchain Testnet</span>
            <span className="text-accent-fg">Free Claims Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
