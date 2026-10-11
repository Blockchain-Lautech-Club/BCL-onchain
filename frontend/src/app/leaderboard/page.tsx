"use client";

import React, { useEffect, useState } from "react";
import { api, LeaderboardEntry } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { 
  Loader2, CheckCircle2, Zap, Crown, Search, 
  ChevronDown, Trophy, Medal, Shield, Star, Flame
} from "lucide-react";
import Link from "next/link";

function renderAvatar(
  avatar: string | null | undefined,
  fallbackText: string,
  sizeClass = "w-10 h-10 text-xl",
  fallbackGradient = "from-purple-600 to-blue-700"
) {
  if (avatar) {
    if (avatar.startsWith("http") || avatar.startsWith("/")) {
      return (
        <img
          src={avatar}
          alt={fallbackText}
          className={`${sizeClass} rounded-full object-cover shadow-md border-2 border-surface select-none shrink-0`}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-surface border-2 border-surface shadow-md flex items-center justify-center select-none shrink-0`}>
        <span className="leading-none">{avatar}</span>
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center text-white font-heading font-bold shadow-md border-2 border-surface select-none shrink-0`}>
      {fallbackText.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const { walletAddress, user, stats } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    api.getLeaderboard(50)
      .then((d) => setEntries(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filtering
  const filtered = entries.filter((e) => 
    searchQ === "" || 
    e.username?.toLowerCase().includes(searchQ.toLowerCase()) || 
    e.wallet_address.toLowerCase().includes(searchQ.toLowerCase())
  );

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const gold = top3[0];
  const silver = top3[1];
  const bronze = top3[2];

  const userPts = Math.max(stats?.total_points ?? 0, user?.total_points ?? 0);
  const userLvl = Math.max(stats?.level ?? 0, user?.level ?? 0, 1);
  const myEntry = walletAddress
    ? (() => {
        const found = entries.find((e) => e.wallet_address.toLowerCase() === walletAddress.toLowerCase());
        if (found) {
          return {
            ...found,
            avatar_url: found.avatar_url || user?.avatar_url,
            total_points: Math.max(found.total_points, userPts),
            level: Math.max(found.level, userLvl),
          };
        }
        if (userPts > 0 || user?.username) {
          return {
            rank: entries.length + 1,
            wallet_address: walletAddress,
            username: user?.username || `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`,
            avatar_url: user?.avatar_url,
            level: userLvl,
            total_points: userPts,
            completed_tasks: stats?.completed_tasks_count ?? 0,
            active_names: stats?.active_names_count ?? 0,
          };
        }
        return null;
      })()
    : null;

  const totalMembers = entries.length || 1;
  const percentile = myEntry ? Math.max(1, Math.round((myEntry.rank / totalMembers) * 100)) : 0;

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
      
      {/* 1. Header Section */}
      <section className="relative z-10 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-ink/5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-accent-fg animate-pulse" />
              <span className="font-mono text-[10px] text-accent-fg font-bold uppercase tracking-wider">Season 02: Genesis Acceleration • Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-ink tracking-tight">BCL Onchain Leaderboard</h1>
            <p className="text-sm md:text-base text-ink-4 leading-relaxed max-w-xl">
              Recognizing consistent builders, creators, researchers, and campus ambassadors across the LAUTECH ecosystem.
            </p>
          </div>
          
          {/* Telemetry Pill */}
          <div className="flex items-center gap-4 bg-surface border border-ink/5 px-6 py-4 rounded-2xl shadow-sm">
            <div className="text-right">
              <p className="font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider">Ecosystem Pool</p>
              <p className="text-xl font-heading font-bold text-accent-fg">14,250 BCL</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center text-accent-fg shadow-inner border border-ink/5">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* User Current Standing Pinned Banner */}
        {walletAddress && myEntry && (
          <div className="mt-8 rounded-2xl bg-surface border border-ink/5 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  {renderAvatar(
                    myEntry.avatar_url || (walletAddress && myEntry.wallet_address.toLowerCase() === walletAddress.toLowerCase() ? user?.avatar_url : null),
                    myEntry.username || myEntry.wallet_address,
                    "w-14 h-14 text-2xl",
                    "from-purple-600 to-blue-700"
                  )}
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-surface flex items-center justify-center font-mono text-[10px] font-bold border-2 border-surface">
                    {myEntry.level}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-heading font-bold text-ink">{myEntry.username || `${myEntry.wallet_address.slice(0, 6)}…${myEntry.wallet_address.slice(-4)}`}</span>
                    <CheckCircle2 className="w-4 h-4 text-accent-fg" />
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-fg font-mono text-[10px] font-bold">You</span>
                  </div>
                  <p className="text-xs text-ink-4">Level {myEntry.level} Pioneer • Ecosystem Contributor</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto flex-1 max-w-2xl mx-auto">
                <div className="bg-ink/[0.03] border border-ink/5 px-4 py-2 rounded-xl">
                  <span className="font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider block mb-1">Current Rank</span>
                  <span className="text-xl font-heading text-accent-fg font-bold">#{myEntry.rank}</span>
                </div>
                <div className="bg-ink/[0.03] border border-ink/5 px-4 py-2 rounded-xl">
                  <span className="font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider block mb-1">Total XP</span>
                  <span className="text-xl font-heading text-ink font-bold">{myEntry.total_points.toLocaleString()}</span>
                </div>
                <div className="bg-ink/[0.03] border border-ink/5 px-4 py-2 rounded-xl">
                  <span className="font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider block mb-1">Streak Status</span>
                  <span className="text-xl font-heading text-amber-500 font-bold flex items-center gap-1">{stats?.streak_days ?? 0}d <Flame className="w-4 h-4"/></span>
                </div>
                <div className="bg-ink/[0.03] border border-ink/5 px-4 py-2 rounded-xl">
                  <span className="font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider block mb-1">Percentile</span>
                  <span className="text-xl font-heading text-purple-500 font-bold">Top {percentile}%</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto shrink-0 justify-between lg:justify-end">
                <Link href="/tasks" className="px-6 py-3 rounded-full bg-accent text-surface font-bold text-sm hover:shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
                  <Zap className="w-4 h-4" /> Push Rank with Quests
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Podium View: Top 3 High Tier Contributors */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent-fg" /></div>
      ) : top3.length > 0 ? (
        <section className="py-8">
          <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-10">
            
            {/* #2 Silver */}
            {silver && (
              <div className="w-full md:w-1/3 order-2 md:order-1 bg-surface border border-ink/5 rounded-2xl p-6 relative shadow-sm flex flex-col items-center text-center transform transition-transform hover:-translate-y-1">
                <div className="absolute -top-6 w-12 h-12 rounded-full bg-surface border border-ink/10 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-heading text-ink font-bold">#2</span>
                </div>
                <div className="mt-4 relative">
                  {renderAvatar(
                    silver.avatar_url || (walletAddress && silver.wallet_address.toLowerCase() === walletAddress.toLowerCase() ? user?.avatar_url : null),
                    silver.username || silver.wallet_address,
                    "w-20 h-20 text-3xl",
                    "from-slate-400 to-slate-600"
                  )}
                  <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink-4 font-mono text-[10px] font-bold">L{silver.level}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-lg font-heading text-ink font-bold">{silver.username || `${silver.wallet_address.slice(0, 6)}…`}</span>
                    <CheckCircle2 className="w-4 h-4 text-accent-fg" />
                  </div>
                </div>
                <div className="w-full bg-ink/[0.03] border border-ink/5 rounded-xl p-3 mt-5 grid grid-cols-2 gap-2 text-center shadow-inner">
                  <div>
                    <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Total XP</span>
                    <span className="text-lg font-heading text-ink font-bold">{silver.total_points.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Rank</span>
                    <span className="text-lg font-heading text-accent-fg font-bold">Silver</span>
                  </div>
                </div>
              </div>
            )}

            {/* #1 Gold */}
            {gold && (
              <div className="w-full md:w-1/3 order-1 md:order-2 bg-surface border border-amber-500/20 rounded-2xl p-8 relative shadow-lg flex flex-col items-center text-center -mt-6 transform transition-transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-2xl pointer-events-none" />
                <div className="absolute -top-8 w-16 h-16 rounded-full bg-amber-500 text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] border-4 border-surface">
                  <Crown className="w-5 h-5 -mb-1" />
                  <span className="text-xl font-heading font-bold leading-none">#1</span>
                </div>
                <div className="mt-4 relative">
                  {renderAvatar(
                    gold.avatar_url || (walletAddress && gold.wallet_address.toLowerCase() === walletAddress.toLowerCase() ? user?.avatar_url : null),
                    gold.username || gold.wallet_address,
                    "w-24 h-24 text-4xl shadow-xl shadow-amber-500/20",
                    "from-amber-400 to-amber-600"
                  )}
                  <span className="absolute bottom-0 right-1 px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink-4 font-mono text-[10px] font-bold">L{gold.level}</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-2xl font-heading text-ink font-bold tracking-tight">{gold.username || `${gold.wallet_address.slice(0, 6)}…`}</span>
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider">Apex Contributor</span>
                </div>
                <div className="w-full bg-ink/[0.03] border border-ink/5 rounded-xl p-4 mt-6 grid grid-cols-2 gap-2 text-center shadow-inner">
                  <div>
                    <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Total XP</span>
                    <span className="text-xl font-heading text-amber-500 font-bold">{gold.total_points.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Rank</span>
                    <span className="text-xl font-heading text-ink font-bold">Gold</span>
                  </div>
                </div>
              </div>
            )}

            {/* #3 Bronze */}
            {bronze && (
              <div className="w-full md:w-1/3 order-3 bg-surface border border-ink/5 rounded-2xl p-6 relative shadow-sm flex flex-col items-center text-center transform transition-transform hover:-translate-y-1">
                <div className="absolute -top-6 w-12 h-12 rounded-full bg-surface border border-ink/10 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-heading text-orange-500 font-bold">#3</span>
                </div>
                <div className="mt-4 relative">
                  {renderAvatar(
                    bronze.avatar_url || (walletAddress && bronze.wallet_address.toLowerCase() === bronze.wallet_address.toLowerCase() ? user?.avatar_url : null),
                    bronze.username || bronze.wallet_address,
                    "w-20 h-20 text-3xl",
                    "from-orange-400 to-red-500"
                  )}
                  <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink-4 font-mono text-[10px] font-bold">L{bronze.level}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-lg font-heading text-ink font-bold">{bronze.username || `${bronze.wallet_address.slice(0, 6)}…`}</span>
                    <CheckCircle2 className="w-4 h-4 text-accent-fg" />
                  </div>
                </div>
                <div className="w-full bg-ink/[0.03] border border-ink/5 rounded-xl p-3 mt-5 grid grid-cols-2 gap-2 text-center shadow-inner">
                  <div>
                    <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Total XP</span>
                    <span className="text-lg font-heading text-ink font-bold">{bronze.total_points.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Rank</span>
                    <span className="text-lg font-heading text-orange-500 font-bold">Bronze</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 3. Dynamic Category Filter & Search Section */}
      <section className="flex flex-col gap-4">
        <div className="bg-surface border border-ink/5 p-4 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <button onClick={() => setCategory("all")} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${category === 'all' ? 'bg-ink text-surface shadow-md' : 'bg-ink/5 text-ink-4 hover:text-ink'}`}>Overall Standings</button>
              <button onClick={() => setCategory("dev")} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${category === 'dev' ? 'bg-ink text-surface shadow-md' : 'bg-ink/5 text-ink-4 hover:text-ink'}`}>Developers</button>
              <button onClick={() => setCategory("creator")} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${category === 'creator' ? 'bg-ink text-surface shadow-md' : 'bg-ink/5 text-ink-4 hover:text-ink'}`}>Creators</button>
            </div>

            <div className="flex items-center gap-2 bg-ink/[0.03] p-1 rounded-xl shrink-0 border border-ink/5">
              <button className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider bg-surface text-accent-fg shadow-sm border border-ink/5">All-Time</button>
              <button className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4 hover:text-ink">Season 02</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-ink/5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" />
              <input 
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full h-11 pl-10 pr-12 rounded-xl bg-ink/[0.03] text-ink placeholder:text-ink-4/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all border border-ink/5 font-mono" 
                placeholder="Search handles or addresses..." 
              />
            </div>
            <div className="flex items-center justify-end gap-6 text-ink-4 font-mono text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-fg" />
                <span>{entries.length} Active Citizens</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Onchain Attested XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Comprehensive Leaderboard Table */}
      <section className="mb-10">
        <div className="w-full overflow-hidden rounded-2xl bg-surface border border-ink/5 shadow-sm">
          
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-ink/[0.02] border-b border-ink/5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Citizen</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-right">Total XP</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-ink/5">
            {rest.length === 0 && !loading && (
              <div className="py-12 text-center text-sm text-ink-5">No entries found matching your criteria.</div>
            )}
            {rest.map((entry) => {
              const isMe = walletAddress && entry.wallet_address.toLowerCase() === walletAddress.toLowerCase();
              return (
                <div key={entry.rank} className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-center px-6 lg:px-8 py-5 hover:bg-ink/[0.02] transition-colors relative ${isMe ? "bg-accent/[0.03]" : ""}`}>
                  {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-fg" />}
                  
                  {/* Rank */}
                  <div className="flex items-center justify-between lg:col-span-1">
                    <span className="text-xl font-heading font-bold text-ink">#{entry.rank}</span>
                  </div>

                  {/* Citizen */}
                  <div className="lg:col-span-5 flex items-center gap-4">
                    {renderAvatar(
                      entry.avatar_url || (isMe ? user?.avatar_url : null),
                      entry.username || entry.wallet_address,
                      "w-10 h-10 text-lg",
                      "from-slate-600 to-slate-800"
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base font-heading font-bold text-ink truncate">{entry.username || `${entry.wallet_address.slice(0, 6)}…`}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg shrink-0" />
                        {isMe && <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-accent/10 text-accent-fg ml-1">You</span>}
                      </div>
                      <span className="font-mono text-[10px] text-ink-4 block truncate">{entry.wallet_address.slice(0, 10)}...{entry.wallet_address.slice(-4)}</span>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="flex items-center justify-between lg:justify-center lg:col-span-2">
                    <span className="lg:hidden text-xs text-ink-4 font-bold uppercase">Level:</span>
                    <span className="px-3 py-1 rounded-full bg-ink/5 font-mono text-[11px] font-bold text-ink">L{entry.level}</span>
                  </div>

                  {/* XP */}
                  <div className="flex items-center justify-between lg:justify-end lg:col-span-2">
                    <span className="lg:hidden text-xs text-ink-4 font-bold uppercase">XP:</span>
                    <span className="text-lg font-heading font-bold text-ink">{entry.total_points.toLocaleString()}</span>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end lg:col-span-2">
                    <button className="px-4 py-2 rounded-xl bg-ink/5 hover:bg-ink/10 text-ink text-xs font-bold transition-colors">
                      Passport
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 lg:px-8 py-4 bg-ink/[0.02] border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">
              Showing ranks 1-{Math.min(50, entries.length)} of {entries.length} contributors
            </span>
          </div>
        </div>
      </section>

      {/* 5. Gamified Season Rewards Teaser Banner */}
      <section className="mb-10">
        <div className="rounded-2xl bg-gradient-to-r from-surface via-surface to-surface border border-ink/5 p-6 md:p-10 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
              <Star className="w-3.5 h-3.5" /> Season 02 Apex Rewards
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">Ecosystem Devcon Grants & Hardware Allocations</h2>
            <p className="text-sm text-ink-4 leading-relaxed">
              Top 10 contributors at Season 02 close receive fully-funded travel grants to Devcon, custom BCL Ledger hardware wallets, and dedicated ecosystem research stipends.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 shrink-0 relative z-10 w-full lg:w-auto">
            <div className="bg-surface border border-ink/5 px-5 py-3 rounded-xl shadow-sm text-center flex-1 lg:flex-none">
              <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Allocated Grant</span>
              <span className="text-xl font-heading text-amber-500 font-bold">$12,500</span>
            </div>
            <div className="bg-surface border border-ink/5 px-5 py-3 rounded-xl shadow-sm text-center flex-1 lg:flex-none">
              <span className="font-mono text-[10px] text-ink-4 block uppercase font-bold mb-1">Physical Badges</span>
              <span className="text-xl font-heading text-accent-fg font-bold">10 Ledgers</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}