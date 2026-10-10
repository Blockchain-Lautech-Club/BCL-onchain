"use client";

import React from "react";
import Link from "next/link";
import {
  Zap, Flame, ArrowRight, Shield, CheckCircle2, Clock,
  TrendingUp, Bell, Calendar, Users, BarChart3, Trophy
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { QuestImage } from "@/components/quest/QuestImage";

export default function DashboardPage() {
  const { user, stats, connectWallet } = useAuth();

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-subtle to-page border border-accent/15 px-6 py-7 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="absolute top-0 right-0 w-80 h-40 bg-accent/[0.07] blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-5 mb-2">
              <span>COHORT 04 ACTIVE</span><span>·</span><span className="text-accent-fg">SEASON 2: ACCELERATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink mb-1">
              Good morning, Philip 👋
            </h1>
            <p className="text-sm text-ink-4">
              You're on a <span className="text-orange-700 dark:text-orange-400 font-bold">7-day streak!</span> Complete today's daily quest to reach{" "}
              <span className="text-accent-fg font-bold">Level 15 Pioneer Elite.</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="btn-outline flex items-center gap-1.5 px-4 py-2 text-sm">
              <Zap className="w-3.5 h-3.5 text-accent-fg" /> Claim Daily 20 XP
            </button>
            <Link href="/tasks" className="btn-green flex items-center gap-1.5 px-4 py-2 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Find Quests
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider">Ecosystem Tier</div>
            <Zap className="w-3.5 h-3.5 text-ink-5" />
          </div>
          <div className="text-xl font-extrabold font-heading text-ink">Level 14</div>
          <div className="text-[11px] text-accent-fg font-semibold mb-2">Pioneer Guildsman</div>
          <div className="progress-track mb-1"><div className="progress-fill" style={{ width: "88%" }} /></div>
          <div className="text-[10px] text-ink-5">2,840 XP · 360 XP to L15 · 88% Progress</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider">Cadence</div>
            <Flame className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-ink">7 Days Streak</div>
          <div className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold mb-2">🔥 1.25x Multiplier Active</div>
          <div className="flex gap-1">
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={d+i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${i < 6 ? "bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30" : i === 6 ? "bg-accent/20 text-accent-fg border border-accent/30" : "bg-ink/[0.04] text-ink-5"}`}>{d}</div>
            ))}
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider">Ecosystem Trust</div>
            <Shield className="w-3.5 h-3.5 text-ink-5" />
          </div>
          <div className="text-2xl font-extrabold font-heading text-ink num-mono">92 <span className="text-sm text-ink-5">/100</span></div>
          <div className="text-[11px] text-accent-fg font-semibold">Top 4% of BCL Peers</div>
          <div className="text-[10px] text-ink-5">+6 pts this month · Audit & Reviewer score</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider">Global Standing</div>
            <BarChart3 className="w-3.5 h-3.5 text-ink-5" />
          </div>
          <div className="text-2xl font-extrabold font-heading text-ink num-mono">#27 <span className="text-sm text-ink-5">Overall</span></div>
          <div className="text-[10px] text-ink-5 mb-2">Among 1,420 Active Devs</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-5">12 Badges Earned</span>
            <span className="badge-purple">Master Rank</span>
          </div>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-white dark:from-[#1a1000] dark:to-[#0e0a00] border border-amber-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg">📝</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-amber">DAILY WEB3 MICRO-QUIZ</span>
              <span className="text-[10px] text-ink-5">· 2 min quiz</span>
              <span className="xp-tag text-[10px]">+50 XP BONUS</span>
            </div>
            <div className="font-heading font-bold text-sm text-ink">Smart Contract Reentrancy Basics: Detection & Prevention</div>
            <div className="text-xs text-ink-4 mt-0.5">Test your understanding of Checks-Effects-Interactions pattern, mutex guards, and fallback vulnerability surfaces before today's epoch concludes.</div>
          </div>
        </div>
        <button className="btn-green flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold shrink-0">
          Start Challenge <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Active Quests - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" /> Continue Your Journey
              <span className="badge-green">2 Active</span>
            </h2>
            <Link href="/tasks" className="text-xs text-accent-fg font-semibold flex items-center gap-1">View All Tasks <ArrowRight className="w-3 h-3" /></Link>
          </div>

          {/* Quest 1 */}
          <div className="quest-card overflow-hidden">
            <QuestImage src="/quests/confluence-hackathon.svg" alt="Confluence Hackathon Sprint" heightClass="h-24" />
            <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-blue">Developer Guild</span>
                <span className="xp-tag"><Zap className="w-2.5 h-2.5" />+1,000 XP</span>
                <span className="flex items-center gap-1 text-[10px] text-ink-5"><Clock className="w-3 h-3" /> 4 days left</span>
              </div>
              <Link href="/tasks" className="btn-green flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold shrink-0">Resume Quest</Link>
            </div>
            <h3 className="font-heading font-bold text-sm text-ink mb-1">Confluence Hackathon Sprint: Protocol Prototype</h3>
            <p className="text-xs text-ink-4 mb-3">Deploy an ERC-4337 Account Abstraction smart module to the Sepolia testbed and link verified verification telemetry.</p>
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] text-ink-5 mb-1">
                <span>Milestone Progress (3 of 5 completed)</span><span className="text-accent-fg">60%</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: "60%" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { done: true, label: "Initialize Hardhat scaffold" },
                { done: true, label: "Implement userOp validator" },
                { done: true, label: "Unit tests >90% coverage" },
                { done: false, label: "Deploy to testnet & submit tx hash" },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3 h-3 shrink-0 ${done ? "text-accent-fg" : "text-ink-5"}`} />
                  <span className={done ? "text-ink-3" : "text-ink-5"}>{label}</span>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* Quest 2 */}
          <div className="quest-card overflow-hidden">
            <QuestImage src="/quests/content-creator.svg" alt="BCL Content Creator Cohort" heightClass="h-24" />
            <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-green">Creator Guild</span>
                <span className="xp-tag"><Zap className="w-2.5 h-2.5" />+500 XP</span>
                <span className="flex items-center gap-1 text-[10px] text-ink-5"><Clock className="w-3 h-3" /> 9 days left</span>
              </div>
              <button className="btn-outline flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold shrink-0">Submit Link</button>
            </div>
            <h3 className="font-heading font-bold text-sm text-ink mb-1">BCL Content Creator Cohort: Educational Technical Thread</h3>
            <p className="text-xs text-ink-4 mb-3">Publish an in-depth visual thread breaking down zero-knowledge rollups and tag the official @BCL_Community account.</p>
            <div>
              <div className="flex items-center justify-between text-[10px] text-ink-5 mb-1">
                <span>Milestone Progress (1 of 3 completed)</span><span className="text-purple-700 dark:text-purple-400">33%</span>
              </div>
              <div className="progress-track"><div className="h-full rounded-full bg-purple-500" style={{ width: "33%" }} /></div>
            </div>
            </div>
          </div>

          {/* Recommended */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-ink text-sm">Recommended For You</h3>
              <span className="text-[10px] text-ink-5">Tailored to your Developer & Community guild pathways</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { image: "/quests/build-your-first-dapp.svg", tag: "Dev Track", xp: 750, title: "Build Your First DApp: Decentralized Voting System", desc: "Construct an end-to-end voting contract on Base Goerli using Solidity and Next.js with Wagmi hooks.", level: "Intermediate", cta: "Accept", ctaStyle: "btn-green" },
                { image: "/quests/community-space.svg", tag: "Community", xp: 100, title: "Attend BCL Friday Tech Space: Navigating Web3 Careers", desc: "Join our live audio session on X Spaces with founders from leading Ethereum and Layer-2 development teams.", time: "Today, 7:00 PM WAT", cta: "Set Reminder", ctaStyle: "btn-outline" },
              ].map(({ image, tag, xp, title, desc, level, time, cta, ctaStyle }) => (
                <div key={title} className="quest-card overflow-hidden flex flex-col">
                  <QuestImage src={image} alt={title} heightClass="h-24" />
                  <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={tag === "Dev Track" ? "badge-blue" : "badge-green"}>{tag}</span>
                    <span className="xp-tag text-[10px]">+{xp} XP</span>
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs text-ink mb-1">{title}</h4>
                    <p className="text-[11px] text-ink-4 line-clamp-2">{desc}</p>
                  </div>
                  {level && <div className="text-[10px] text-ink-5">{level}</div>}
                  {time && <div className="text-[10px] text-ink-5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" />{time}</div>}
                  <button className={`${ctaStyle} py-1.5 text-xs font-bold w-full flex items-center justify-center gap-1`}>{cta} <ArrowRight className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Reward Vault */}
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-ink text-sm flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> Reward Vault</h3>
              <span className="badge-green">Live Balance</span>
            </div>
            <div className="mb-1 text-[10px] text-ink-5 uppercase tracking-wider">Spendable Experience Points</div>
            <div className="text-3xl font-extrabold font-heading text-ink num-mono mb-1">2,840</div>
            <div className="text-xs text-ink-4 mb-3">BCL-XP · <span className="text-accent-fg">3 Rewards Available for Unlock</span></div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-ink/[0.06]">
                <div>
                  <div className="text-xs font-semibold text-ink">Exclusive BCL Hoodie</div>
                  <div className="text-[10px] text-ink-5">2,500 XP required</div>
                </div>
                <button className="badge-green cursor-pointer">Claim</button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-ink/[0.06] opacity-60">
                <div>
                  <div className="text-xs font-semibold text-ink">1-on-1 Mentorship Session</div>
                  <div className="text-[10px] text-ink-5">3,000 XP (160 needed)</div>
                </div>
                <Shield className="w-4 h-4 text-ink-5" />
              </div>
            </div>
            <Link href="/tasks" className="btn-outline w-full mt-3 py-2 text-xs font-bold flex items-center justify-center gap-1">Explore Reward Store <ArrowRight className="w-3 h-3" /></Link>
          </div>

          {/* Upcoming Events */}
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-ink text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-accent-fg" /> Upcoming Events</h3>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="space-y-3">
              {[
                { date: "Sept 10 · 18:00 WAT", xp: "+150 XP", title: "Foundry Masterclass: Gas Optimization", desc: "Live code-along with Senior EVM Auditor", enrolled: "96 Devs Registered" },
                { date: "Oct 02 · 14:00 WAT", xp: "+300 XP", title: "Confluence Hackathon Showcase", desc: "Campus Auditorium & Live Streaming", enrolled: "Hybrid Event" },
              ].map(({ date, xp, title, desc, enrolled }) => (
                <div key={title} className="p-3 rounded-xl bg-surface border border-ink/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{date}</span>
                    <span className="xp-tag text-[10px]">{xp}</span>
                  </div>
                  <div className="font-semibold text-xs text-ink font-heading">{title}</div>
                  <div className="text-[10px] text-ink-5">{desc}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-4">{enrolled}</span>
                    <button className="text-[10px] text-accent-fg font-bold hover:underline">RSVP Now ↗</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guild Membership */}
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-ink-5 uppercase tracking-wider">Current Guild Membership</div>
              <span className="badge-green">Active</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">⚡</div>
              <div>
                <div className="font-heading font-bold text-sm text-ink">Fullstack Web3 Guild</div>
                <div className="text-[10px] text-ink-4">Rank: Senior Contributor</div>
                <div className="text-[10px] text-accent-fg mt-0.5">Your guild holds Rank #2 in the inter-cohort sprint. Next sync occurs Wednesday.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-ink">Recent Unlocks & Activity Feed</h2>
          <span className="text-[10px] text-ink-5">On-chain receipts & verifications</span>
        </div>
        <div className="space-y-2">
          {[
            { icon: "🏅", label: "Unlocked Badge: 7-Day Streak Master", xp: "+100 XP", detail: "Minted via ERC-1155 Soulbound Token #8841 • 2 hours ago", color: "text-amber-700 dark:text-amber-400", action: "View Block" },
            { icon: "🎟️", label: "Redeemed: BCL Devcon Early Access Pass", xp: "-1,200 XP", detail: "VIP Entry Whitelist Ticket locked • Yesterday at 4:12 PM", color: "text-red-700 dark:text-red-400", action: "QR Ticket" },
            { icon: "✅", label: "Completed Quest: Solidity Syntax Lab III", xp: "+250 XP", detail: "Automated test runner passed 12/12 assertions • 3 days ago", color: "text-accent-fg", action: "Receipt" },
          ].map(({ icon, label, xp, detail, color, action }) => (
            <div key={label} className="surface-card rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <div className="text-xs font-semibold text-ink">{label}</div>
                  <div className="text-[10px] text-ink-5">{detail}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-bold text-xs num-mono ${color}`}>{xp}</span>
                <button className="btn-outline px-2.5 py-1 text-[10px] font-bold">{action}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
