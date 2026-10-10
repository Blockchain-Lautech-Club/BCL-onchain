import React from "react";
import Link from "next/link";
import { ArrowRight, Trophy, CheckCircle2 } from "lucide-react";

const TOP = [
  { rank: 1, handle: "samuel.bcl", role: "Fullstack Protocol Engineer", xp: 4120, quests: 46, poaps: 22, color: "rank-1", crown: true },
  { rank: 2, handle: "amina.bcl", role: "Designer Guild Lead", xp: 3650, quests: 39, poaps: 14, color: "rank-2" },
  { rank: 3, handle: "tobi.bcl", role: "Security & Audit Guild", xp: 3110, quests: 34, poaps: 11, color: "rank-3" },
];

const TABLE = [
  { rank: 4, handle: "funke.bcl", focus: "DeFi Architect", level: 15, xp: 2990 },
  { rank: 5, handle: "chidi.bcl", focus: "Campus Ambassador", level: 15, xp: 2940 },
  { rank: 6, handle: "zainab.bcl", focus: "ZK Cryptography", level: 14, xp: 2890 },
  { rank: 7, handle: "david.bcl", focus: "Solidity Guild", level: 14, xp: 2875 },
];

export function LeaderboardSpotlight() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-5 mb-1">// VERIFIED STANDINGS</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink tracking-tight">Top Contributors</h2>
        </div>
        <Link href="/leaderboard" className="flex items-center gap-1 text-xs text-accent-fg font-semibold hover:gap-2 transition-all">
          View All 500+ <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {TOP.map(({ rank, handle, role, xp, quests, poaps, color, crown }) => (
          <div key={rank} className={`quest-card ${color} p-4 flex flex-col items-center text-center gap-2`}>
            {crown && <Trophy className="w-5 h-5 text-yellow-700 dark:text-yellow-400 mb-1" />}
            {!crown && <div className="text-sm font-bold text-ink-3">#{rank}</div>}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 border border-white/10" />
            <div>
              <div className="font-heading font-bold text-xs text-ink flex items-center gap-1 justify-center">
                {handle} <CheckCircle2 className="w-3 h-3 text-accent-fg" />
              </div>
              <div className="text-[10px] text-ink-4">{role}</div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span><span className="text-ink font-bold num-mono">{xp}</span> <span className="text-ink-5">XP</span></span>
              <span><span className="text-ink font-bold">{quests}</span> <span className="text-ink-5">Quests</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="surface-card rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-page border-b border-ink/[0.05]">
            <tr>
              <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-ink-5">Rank</th>
              <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-ink-5">Citizen</th>
              <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-ink-5 hidden sm:table-cell">Guild Focus</th>
              <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-ink-5 text-center">Lvl</th>
              <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-ink-5 text-right">Total XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.04]">
            {TABLE.map(({ rank, handle, focus, level, xp }) => (
              <tr key={rank} className="hover:bg-ink/[0.02] transition">
                <td className="py-3 px-4 text-ink-3 font-bold num-mono">#{rank}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 shrink-0" />
                    <span className="font-semibold text-ink">{handle}</span>
                    <CheckCircle2 className="w-3 h-3 text-accent-fg" />
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <span className="text-[11px] text-accent-fg bg-accent/10 border border-accent/15 px-2 py-0.5 rounded-md">{focus}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-[10px] font-semibold text-ink-3 bg-ink/[0.04] border border-ink/[0.06] px-2 py-0.5 rounded-full">L{level}</span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-ink num-mono">{xp.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
