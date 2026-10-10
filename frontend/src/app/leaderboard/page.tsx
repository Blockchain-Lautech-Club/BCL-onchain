"use client";

import React, { useEffect, useState } from "react";
import { api, LeaderboardEntry } from "@/lib/api";
import { Loader2, Trophy, CheckCircle2, Zap, ArrowRight, Crown } from "lucide-react";

const TOP3 = [
  { rank: 2, handle: "amina.bcl", role: "Designer Guild Lead", level: 16, xp: 3650, quests: 39, poaps: 14, velocity: "+420 XP/wk" },
  { rank: 1, handle: "samuel.bcl", role: "Fullstack Protocol Engineer", level: 18, xp: 4120, quests: 46, poaps: 22, velocity: "+680 XP/wk", crown: true },
  { rank: 3, handle: "tobi.bcl", role: "Security & Audit Guild", level: 15, xp: 3110, quests: 34, poaps: 11, velocity: "+310 XP/wk" },
];

const REST = [
  { rank: 4, handle: "funke.bcl", focus: "DeFi Architect", level: 15, quests: 32, rep: 98.4, xp: 2990, momentum: "+248 XP" },
  { rank: 5, handle: "chidi.bcl", focus: "Campus Ambassador", level: 15, quests: 31, rep: 96.8, xp: 2940, momentum: "+198 XP" },
  { rank: 6, handle: "zainab.bcl", focus: "2K Cryptography", level: 14, quests: 29, rep: 95.2, xp: 2890, momentum: "+310 XP" },
  { rank: 7, handle: "david.bcl", focus: "Solidity Guild", level: 14, quests: 28, rep: 94.7, xp: 2875, momentum: "+110 XP" },
  { rank: 8, handle: "bola.bcl", focus: "Media & Storytelling", level: 14, quests: 26, rep: 92.9, xp: 2860, momentum: "+180 XP" },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Overall Standings");
  const [timeframe, setTimeframe] = useState("Season 02");

  useEffect(() => {
    api.getLeaderboard(50).then(d => setEntries(d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-amber">SEASON 02: GENESIS ACCELERATION</span>
            <span className="text-[10px] text-ink-5">· 18 DAYS LEFT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink tracking-tight">BCL Onchain Leaderboard</h1>
          <p className="text-sm text-ink-4 mt-1 max-w-xl">Recognizing consistent builders, creators, researchers, and campus ambassadors across LAUTECH.</p>
        </div>
        <div className="stat-card shrink-0">
          <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">Ecosystem Pool</div>
          <div className="text-xl font-extrabold text-accent-fg font-heading num-mono">14,250 BCL</div>
        </div>
      </div>

      {/* Current User Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-subtle to-surface border border-accent/15 p-5 grid sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 col-span-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-ink">philip.bcl</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" />
              <span className="badge-green">You</span>
            </div>
            <div className="text-[10px] text-ink-5">Level 14 Pioneer · Guild Core Developer</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 col-span-2">
          {[
            { label: "Current Rank", value: "#27" },
            { label: "Total XP", value: "2,840" },
            { label: "Streak Status", value: "7 Days 🔥" },
            { label: "Percentile", value: "Top 3%" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] text-ink-5 uppercase tracking-wider">{label}</div>
              <div className="text-sm font-bold text-ink font-heading num-mono">{value}</div>
            </div>
          ))}
          <button className="btn-green px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 col-span-3 sm:col-span-1 justify-center">
            <Zap className="w-3 h-3" /> Push Rank with a Quest
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4">
        {TOP3.map(({ rank, handle, role, level, xp, quests, poaps, velocity, crown }) => (
          <div
            key={rank}
            className={`quest-card p-5 flex flex-col items-center text-center gap-3 ${
              rank === 1 ? "rank-1 scale-[1.02]" : rank === 2 ? "rank-2" : "rank-3"
            }`}
          >
            {crown ? <Crown className="w-6 h-6 text-yellow-700 dark:text-yellow-400" /> : <div className="text-lg font-extrabold text-ink-3 num-mono">#{rank}</div>}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-700 border-2 border-white/10 mx-auto" />
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-white bg-brand rounded-full w-5 h-5 flex items-center justify-center">L{level}</span>
            </div>
            <div>
              <div className="font-heading font-bold text-ink flex items-center gap-1 justify-center text-sm">
                {handle} <CheckCircle2 className="w-3 h-3 text-accent-fg" />
              </div>
              <div className="text-[10px] text-ink-4">{role}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full text-center text-[10px]">
              <div><div className="font-bold text-ink num-mono text-sm">{xp.toLocaleString()}</div><div className="text-ink-5">XP</div></div>
              <div><div className="font-bold text-ink num-mono text-sm">{quests}</div><div className="text-ink-5">Quests</div></div>
              <div><div className="font-bold text-accent-fg num-mono text-sm">{poaps}</div><div className="text-ink-5">POAPs</div></div>
            </div>
            <div className="text-[10px] text-ink-4">{velocity} <span className="text-accent-fg">🔥</span></div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["Overall Standings", "Developers", "Creators & Designers", "Community & Ambassadors", "Learners & Researchers"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-ink/[0.08] text-ink" : "text-ink-4 hover:text-ink"}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {["All-Time", "Season 02", "This Week"].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 rounded-lg text-xs font-medium transition ${timeframe === t ? "bg-accent/15 text-accent-fg border border-accent/20" : "text-ink-4 hover:text-ink"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-ink/[0.07] rounded-xl px-4 py-2">
          <span className="text-ink-5 text-xs">🔍</span>
          <input type="text" placeholder="Search handles, ens, or guilds (e.g. 'smart contracts')..." className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-5 outline-none" />
          <span className="text-[10px] text-ink-5 border border-ink/[0.06] px-1.5 py-0.5 rounded font-mono">bk</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-ink-5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" /> 1,418 Active Citizens
          <span className="ml-2 badge-green">Onchain Attested XP</span>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-page border-b border-ink/[0.05]">
            <tr>
              {["RANK", "CITIZEN / CONTRIBUTOR", "GUILD FOCUS", "LEVEL", "QUESTS", "REP SCORE", "TOTAL XP", "MOMENTUM"].map(h => (
                <th key={h} className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-ink-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.04]">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-accent-fg" /></td></tr>
            ) : REST.map(({ rank, handle, focus, level, quests, rep, xp, momentum }) => {
              const isMe = handle === "philip.bcl";
              return (
                <tr key={rank} className={`hover:bg-ink/[0.02] transition ${isMe ? "bg-accent/[0.04] border-l-2 border-l-accent" : ""}`}>
                  <td className="py-3.5 px-4 font-bold text-ink-3 num-mono">#{rank}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {handle[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-ink">
                          {handle} <CheckCircle2 className="w-3 h-3 text-accent-fg" />
                          {isMe && <span className="badge-green">You</span>}
                        </div>
                        <div className="text-[10px] text-ink-5 font-mono">{`0x742d...44e`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-accent-fg bg-accent/[0.08] border border-accent/15 px-2 py-0.5 rounded-md">{focus}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] font-semibold text-ink-3 bg-ink/[0.04] border border-ink/[0.06] px-2 py-0.5 rounded-full">L{level}</span>
                  </td>
                  <td className="py-3.5 px-4 text-ink font-semibold num-mono">{quests}</td>
                  <td className="py-3.5 px-4 text-ink-3 num-mono">{rep}</td>
                  <td className="py-3.5 px-4 font-bold text-ink num-mono">{xp.toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-accent-fg num-mono">{momentum}</span>
                      <span className="badge-blue">Passport</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-ink/[0.05] flex items-center justify-between text-[10px] text-ink-5">
          <span>Showing ranks 1-8 and current tier (26-28) of 1,418 contributors</span>
          <div className="flex gap-2">
            <button className="btn-outline px-3 py-1 text-xs">Previous</button>
            <span className="text-xs text-ink px-3 py-1">Page 1 of 52</span>
            <button className="btn-outline px-3 py-1 text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Season Rewards */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-[#1a0e00] dark:to-[#0a0d14] border border-amber-500/20 p-6">
        <div className="badge-amber mb-3">SEASON 02 APEX REWARDS</div>
        <div className="grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-xl font-extrabold font-heading text-ink mb-2">Ecosystem Devcon Grants & Hardware Allocations</h3>
            <p className="text-xs text-ink-4">Top 10 contributors at Season 02 close receive fully-funded travel grants to Devcon, custom BCL Ledger hardware wallets, and dedicated quarterly ecosystem research stipends.</p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] text-ink-5 uppercase tracking-wider">Allocated Grant</div>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-heading num-mono">$12,500</div>
            </div>
            <div>
              <div className="text-[10px] text-ink-5 uppercase tracking-wider">Physical Badges</div>
              <div className="text-2xl font-extrabold text-ink font-heading">10 Ledgers</div>
            </div>
            <button className="btn-green px-4 py-2 text-xs font-bold">Review Prize Criteria</button>
          </div>
        </div>
      </div>
    </div>
  );
}
