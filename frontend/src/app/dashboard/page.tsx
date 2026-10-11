"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap, Flame, ArrowRight, Shield, CheckCircle2, Clock,
  Trophy, Calendar, Loader2, Terminal, Lock, Gift, 
  Star, Award, TrendingUp, ChevronRight, Code, Megaphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, TaskSubmission, PointsLedgerItem } from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function levelTitle(level: number): string {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Pioneer Elite";
  if (level >= 10) return "Pioneer Guildsman";
  if (level >= 5) return "Explorer";
  return "Newcomer";
}

export default function DashboardPage() {
  const { user, stats, walletAddress, connectWallet, isLoading } = useAuth();
  const [recentSubmissions, setRecentSubmissions] = useState<TaskSubmission[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsLedgerItem[]>([]);
  const [claimedDaily, setClaimedDaily] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;
    api.getMySubmissions().then(s => setRecentSubmissions(s.slice(0, 3))).catch(() => {});
    api.getMyPoints().then(p => setRecentPoints(p.slice(0, 5))).catch(() => {});
  }, [walletAddress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-fg" />
      </div>
    );
  }

  if (!user || !walletAddress) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ink/5 flex items-center justify-center mb-2">
          <Lock className="w-8 h-8 text-ink-4" />
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-ink tracking-tight">Access Your Dashboard</h1>
        <p className="text-sm text-ink-4 max-w-sm">Sign in with your wallet to track your progress, verify quests, and unlock sovereign rewards.</p>
        <button onClick={connectWallet} className="btn-green px-8 py-3 text-sm font-bold mt-4 flex items-center gap-2">
          Connect Wallet <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const displayName = user.username || `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const level = stats?.level ?? user.level ?? 0;
  const totalPoints = stats?.total_points ?? user.total_points ?? 0;
  const pointsToNext = stats?.points_to_next_level ?? 0;
  const nextThreshold = stats?.next_level_threshold ?? 0;
  const streakDays = stats?.streak_days ?? 0;
  const completedTasks = stats?.completed_tasks_count ?? 0;
  const activeNames = stats?.active_names_count ?? 0;
  
  const levelProgressPct = nextThreshold > 0 && pointsToNext > 0
    ? Math.min(100, Math.round(((nextThreshold - pointsToNext) / nextThreshold) * 100))
    : 0;

  const streakDays7 = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* 1. Top Welcome & Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-ink/5 p-6 md:p-10 shadow-sm">
        <div className="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink/5 text-accent-fg font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(0,245,160,0.8)] animate-pulse" />
                COHORT 04 ACTIVE
              </span>
              <span className="text-ink-4 text-[10px] font-bold">•</span>
              <span className="text-ink-4 text-[10px] font-bold tracking-wider">SEASON 2: ACCELERATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-ink tracking-tight">
              {greet()}, {displayName} <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="text-sm sm:text-base text-ink-4 mt-1">
              You're on a <span className="text-amber-500 font-bold">{streakDays}-day streak!</span> Complete today's daily quest to reach <span className="text-accent-fg font-bold">Level {level + 1} {levelTitle(level + 1)}</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button 
              onClick={() => setClaimedDaily(true)}
              disabled={claimedDaily}
              className={`px-5 py-2.5 rounded-full transition-all text-sm font-bold flex items-center gap-2 ${claimedDaily ? 'bg-accent/20 text-accent-fg' : 'bg-ink/5 text-ink hover:bg-ink/10 shadow-sm'}`}
            >
              {claimedDaily ? (
                <><CheckCircle2 className="w-4 h-4" /> Claimed (+20 XP)</>
              ) : (
                <><Flame className="w-4 h-4 text-amber-500" /> Claim Daily 20 XP</>
              )}
            </button>
            <Link href="/tasks" className="btn-green px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-accent/20">
              <Star className="w-4 h-4" /> Find Quests
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Ecosystem Tier</span>
              <span className="text-2xl font-heading font-bold text-ink mt-2">Level {level}</span>
              <span className="text-xs font-mono text-accent-fg font-semibold mt-0.5">{levelTitle(level)}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-accent-fg group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-[11px] font-mono">
              <span className="text-ink font-bold">{totalPoints.toLocaleString()} XP</span>
              <span className="text-ink-4">{pointsToNext.toLocaleString()} XP to L{level + 1}</span>
            </div>
            <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-accent to-green-400 h-full rounded-full shadow-[0_0_8px_rgba(0,245,160,0.5)] transition-all duration-1000" style={{ width: `${levelProgressPct}%` }} />
            </div>
            <span className="text-[10px] text-ink-4 text-right">{levelProgressPct}% Progress</span>
          </div>
        </div>

        {/* Cadence Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Cadence</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-heading font-bold text-ink leading-none">{streakDays}</span>
                <span className="text-sm font-heading font-bold text-amber-500">Days Streak</span>
              </div>
              {streakDays >= 7 && (
                <span className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3" /> 1.25x Multiplier Active
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-1">
            {streakDays7.map((d, i) => {
              const isActive = i < Math.min(streakDays, 7);
              const isToday = i === Math.min(streakDays - 1, 6);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isToday ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                    isActive ? 'bg-ink/10 text-ink' : 'bg-ink/5 text-ink-4'
                  }`}>
                    {d}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isToday ? 'bg-amber-500 animate-pulse' :
                    isActive ? 'bg-ink/20' : 'bg-transparent'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Verified Impact Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Verified Impact</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-heading font-bold text-ink leading-none">{completedTasks}</span>
                <span className="text-sm font-heading font-bold text-ink-4">Quests</span>
              </div>
              <span className="text-[10px] text-accent-fg mt-1.5 font-bold">Top 4% of BCL Peers</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-accent-fg group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <svg className="w-16 h-8 text-accent-fg opacity-80" fill="none" viewBox="0 0 64 32">
              <path d="M2 28L14 20L26 24L38 12L50 16L62 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink">Active Contributor</span>
              <span className="text-[10px] text-ink-4 mt-0.5">{activeNames} registered domains</span>
            </div>
          </div>
        </div>

        {/* Global Standing Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Global Standing</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-heading font-bold text-purple-500 leading-none">#27</span>
                <span className="text-sm font-mono text-ink-4 font-semibold">Overall</span>
              </div>
              <span className="text-[10px] text-ink-4 mt-1.5 font-medium">Among 1,420 Active Devs</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-purple-500" />
              <span className="text-[11px] font-mono font-bold text-ink">{totalPoints.toLocaleString()} XP</span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 font-bold uppercase tracking-wider">Master Rank</span>
          </div>
        </div>
      </div>

      {/* 3. Featured Daily Challenge Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ink/5 via-surface to-surface border border-ink/5 p-6 md:p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Terminal className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                  Daily Web3 Micro-Quiz
                </span>
                <span className="text-[10px] text-ink-4 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" /> 2 min quiz
                </span>
                <span className="text-[10px] text-accent-fg font-bold bg-ink/5 border border-ink/5 px-2.5 py-1 rounded-full">
                  +50 XP BONUS
                </span>
              </div>
              <h2 className="text-xl font-heading font-bold text-ink">Smart Contract Reentrancy Basics: Detection & Prevention</h2>
              <p className="text-sm text-ink-4 max-w-2xl leading-relaxed">
                Test your understanding of Checks-Effects-Interactions pattern, mutex guards, and fallback vulnerability surfaces before today's epoch concludes.
              </p>
            </div>
          </div>
          <button className="w-full lg:w-auto px-6 py-3 rounded-full bg-amber-500 text-white font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 shrink-0">
            Start Challenge <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Center Primary Action Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Recent Activity / Continue Journey */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_6px_rgba(0,245,160,0.8)]" />
                <h2 className="text-xl font-heading font-bold text-ink tracking-tight">Recent Activity</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink/5 text-ink-4 font-bold">{recentSubmissions.length} Tasks</span>
              </div>
              <Link href="/tasks" className="text-xs font-mono font-bold text-accent-fg hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {recentSubmissions.length === 0 ? (
                <div className="rounded-xl bg-surface border border-ink/5 p-10 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-2">
                    <Shield className="w-8 h-8 text-ink-4" />
                  </div>
                  <h3 className="font-heading font-bold text-ink text-lg">No active quests found</h3>
                  <p className="text-sm text-ink-4 max-w-sm">Dive into the ecosystem by completing your first onboarding or developer quest.</p>
                  <Link href="/tasks" className="btn-green px-6 py-2.5 rounded-full text-sm font-bold mt-2">Browse Quests</Link>
                </div>
              ) : (
                recentSubmissions.map(sub => (
                  <div key={sub.id} className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm hover:border-ink/10 transition-all flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          sub.status === 'verified' ? 'bg-accent/10 text-accent-fg' : 
                          sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {sub.status === 'verified' ? <CheckCircle2 className="w-6 h-6" /> : <Code className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 rounded bg-ink/5 text-ink text-[10px] font-bold uppercase tracking-wider">Quest #{sub.task_id}</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                              sub.status === 'verified' ? 'bg-accent/10 text-accent-fg' : 
                              sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {sub.status}
                            </span>
                            <span className="text-[10px] font-mono text-ink-4 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-heading font-bold text-ink mt-2">On-chain Quest Submission</h3>
                          <p className="text-sm text-ink-4 mt-1">
                            {sub.tx_hash ? `Transaction Hash: ${sub.tx_hash.slice(0, 12)}...${sub.tx_hash.slice(-10)}` : "Task submitted and awaiting manual or oracle verification."}
                          </p>
                        </div>
                      </div>
                      {sub.tx_hash && (
                        <a href={getExplorerUrl(sub.tx_hash)} target="_blank" rel="noopener noreferrer" className="shrink-0 px-4 py-2 rounded-full bg-ink/5 text-ink text-sm font-bold hover:bg-ink/10 transition-colors flex items-center gap-2">
                          View Explorer <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {/* Status Progress Bar */}
                    <div className="bg-ink/[0.02] rounded-lg p-4 flex flex-col gap-2 border border-ink/5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                        <span className="text-ink-4">Verification Pipeline</span>
                        <span className={
                          sub.status === 'verified' ? 'text-accent-fg' : 
                          sub.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                        }>{sub.status === 'verified' ? '100%' : '50%'}</span>
                      </div>
                      <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${
                          sub.status === 'verified' ? 'bg-accent w-full' : 
                          sub.status === 'rejected' ? 'bg-red-500 w-full' : 'bg-amber-500 w-1/2'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recommended (Static design placeholder as per prompt) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-xl font-heading font-bold text-ink tracking-tight">Recommended For You</h2>
                <span className="text-xs text-ink-4">Tailored to your Developer & Community guild pathways</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rec 1 */}
              <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm hover:border-ink/10 transition-all flex flex-col justify-between group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-accent/10 text-accent-fg text-[10px] font-bold uppercase tracking-wider">Dev Track</span>
                    <span className="text-[10px] font-mono text-accent-fg font-bold">+750 XP</span>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-ink group-hover:text-accent-fg transition-colors leading-tight">Build Your First DApp: Decentralized Voting</h3>
                  <p className="text-sm text-ink-4">Construct an end-to-end voting contract on Base Sepolia using Solidity and Next.js with Wagmi hooks.</p>
                </div>
                <div className="mt-6 pt-4 flex items-center justify-between border-t border-ink/5">
                  <span className="text-[10px] font-mono text-ink-4 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Intermediate
                  </span>
                  <Link href="/tasks" className="text-xs font-bold text-accent-fg hover:underline flex items-center gap-1">
                    Start Quest <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              {/* Rec 2 */}
              <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm hover:border-ink/10 transition-all flex flex-col justify-between group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-ink/10 text-ink text-[10px] font-bold uppercase tracking-wider">Community</span>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">+100 XP</span>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-ink group-hover:text-amber-500 transition-colors leading-tight">Attend Friday Tech Space: Web3 Careers</h3>
                  <p className="text-sm text-ink-4">Join our live audio session on X Spaces with founders from leading Ethereum and Layer-2 development teams.</p>
                </div>
                <div className="mt-6 pt-4 flex items-center justify-between border-t border-ink/5">
                  <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1 font-semibold">
                    <Megaphone className="w-3.5 h-3.5" /> Today, 7:00 PM
                  </span>
                  <button className="text-xs font-bold text-ink hover:underline">Set Reminder</button>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Feed (Recent Points) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between mt-2">
              <h2 className="text-xl font-heading font-bold text-ink tracking-tight">Recent Activity Feed</h2>
              <span className="text-[10px] font-mono text-ink-4 uppercase tracking-wider font-bold hidden sm:block">On-chain receipts & verifications</span>
            </div>
            <div className="rounded-xl bg-surface border border-ink/5 p-5 shadow-sm flex flex-col gap-2">
              {recentPoints.length === 0 ? (
                <div className="py-6 text-center text-sm text-ink-4">No recent point activities found. Complete a quest to start earning!</div>
              ) : (
                recentPoints.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-lg bg-ink/[0.02] border border-ink/5 flex items-center justify-between gap-4 hover:bg-ink/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        p.points_delta >= 0 ? 'bg-accent/10 text-accent-fg' : 'bg-red-500/10 text-red-500'
                      }`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-heading font-bold text-ink">{p.reason}</span>
                        <span className="text-[10px] font-mono text-ink-4 mt-0.5">{new Date(p.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded ${
                      p.points_delta >= 0 ? 'bg-accent/10 text-accent-fg' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {p.points_delta >= 0 ? "+" : ""}{p.points_delta} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right Side Telemetry Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Reward Vault Preview */}
          <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-heading font-bold text-ink">Reward Vault</h3>
              </div>
              <span className="text-[10px] font-mono text-ink-4 uppercase font-bold tracking-wider">Live Balance</span>
            </div>
            
            <div className="bg-ink/[0.03] border border-ink/5 p-5 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-mono text-ink-4 font-bold uppercase tracking-wider">Spendable Experience Points</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-4xl font-heading font-bold text-accent-fg">{totalPoints.toLocaleString()}</span>
                <span className="text-xs font-mono font-bold text-ink-4">BCL-XP</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink/5 text-[10px] font-mono font-bold text-amber-500">
                <Lock className="w-3.5 h-3.5" /> 3 Rewards Available for Unlock
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-ink/5 hover:bg-ink/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-ink/10 flex items-center justify-center text-ink"><Star className="w-4 h-4"/></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-heading font-bold text-ink">Exclusive BCL Hoodie</span>
                    <span className="text-[10px] font-mono text-ink-4 mt-0.5">2,500 XP required</span>
                  </div>
                </div>
                <button className="px-3.5 py-1.5 rounded-full bg-ink text-surface text-[10px] font-bold hover:bg-ink-3 transition-colors">Claim</button>
              </div>
              
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-ink/5 hover:bg-ink/5 transition-colors opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-ink/10 flex items-center justify-center text-ink"><Terminal className="w-4 h-4"/></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-heading font-bold text-ink">1-on-1 Mentorship</span>
                    <span className="text-[10px] font-mono text-ink-4 mt-0.5">3,000 XP (Locked)</span>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-ink-4" />
              </div>
            </div>
            
            <Link href="/reward" className="w-full py-2.5 rounded-full border border-ink/10 text-ink hover:bg-ink/5 text-center text-sm font-bold transition-all mt-1">
              Explore Reward Store
            </Link>
          </div>

          {/* Upcoming Events Widget */}
          <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-fg" />
                <h3 className="text-lg font-heading font-bold text-ink">Upcoming Events</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_6px_#00e293]" />
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-4 flex flex-col gap-2 hover:bg-ink/5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-accent/10 text-accent-fg font-bold uppercase">Sept 18 • 18:00 WAT</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500">+150 XP</span>
                </div>
                <span className="text-sm font-heading font-bold text-ink mt-1">Foundry Masterclass: Gas Optimization</span>
                <span className="text-xs text-ink-4">Live code-along with Senior EVM Auditor</span>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-ink/5">
                  <span className="text-[10px] font-mono text-ink-4 font-bold">98 Devs Registered</span>
                  <button className="text-[10px] text-accent-fg hover:underline font-bold flex items-center">RSVP Now <ArrowRight className="w-3 h-3 ml-1" /></button>
                </div>
              </div>
              
              <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-4 flex flex-col gap-2 hover:bg-ink/5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-purple-500/10 text-purple-500 font-bold uppercase">Oct 02 • 14:00 WAT</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500">+300 XP</span>
                </div>
                <span className="text-sm font-heading font-bold text-ink mt-1">Confluence Hackathon Showcase</span>
                <span className="text-xs text-ink-4">Campus Auditorium & Live Streaming</span>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-ink/5">
                  <span className="text-[10px] font-mono text-ink-4 font-bold">Hybrid Event</span>
                  <button className="text-[10px] text-accent-fg hover:underline font-bold flex items-center">RSVP Now <ArrowRight className="w-3 h-3 ml-1" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Guild Affiliation Card */}
          <div className="rounded-xl bg-surface border border-ink/5 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-4 font-mono font-bold uppercase tracking-wider">Guild Membership</span>
              <span className="px-2.5 py-1 rounded bg-accent/10 text-accent-fg text-[10px] font-bold uppercase tracking-wider">Active</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-ink/5 border border-ink/5 flex items-center justify-center text-accent-fg shrink-0">
                <Terminal className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-heading font-bold text-ink leading-tight">Fullstack Web3 Guild</span>
                <span className="text-xs font-mono font-bold text-ink-4 mt-1">Rank: Senior Contributor</span>
              </div>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed border-t border-ink/5 pt-4 mt-1">
              Your guild holds Rank #2 in the inter-cohort sprint. Next sync occurs Wednesday.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}