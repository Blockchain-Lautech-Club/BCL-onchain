"use client";

import React, { useEffect, useState } from "react";
import { api, LeaderboardEntry } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getLeaderboard(50);
        setEntries(data || []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rankings</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">Club Leaderboard</h1>
        </div>

        <div className="text-xs font-medium text-zinc-500 tracking-wide">
          RANKED BY TOTAL CLUB POINTS
        </div>
      </div>

      <div className="surface-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
            <span>Loading leaderboard...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 px-4 text-center text-zinc-400 text-xs space-y-2">
            <div className="text-white font-semibold text-sm">No Builders on the Leaderboard Yet</div>
            <p className="text-zinc-500 max-w-md mx-auto">
              Be the first to complete quests, earn badges, and claim the #1 ranking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold border-b border-white/[0.06] bg-[#0c0f16]">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4">Member / Handle</th>
                  <th className="py-3 px-4">Wallet</th>
                  <th className="py-3 px-4 text-center">Level</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {entries.map((e) => (
                  <tr key={e.rank} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 text-center text-zinc-400 font-bold num-mono">
                      {e.rank <= 3 ? (
                        <span className="text-emerald-400">#{e.rank}</span>
                      ) : (
                        `#${e.rank}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-heading">
                      {e.bcl_domain ? (
                        <span className="text-emerald-400">{e.bcl_domain}</span>
                      ) : (
                        e.username || "Anonymous"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {e.wallet_address.slice(0, 8)}...{e.wallet_address.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] font-medium bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full text-zinc-300">
                        LVL {e.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white num-mono">
                      +{e.total_points.toLocaleString()} PTS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
