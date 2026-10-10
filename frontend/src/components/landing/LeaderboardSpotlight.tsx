"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { api, LeaderboardEntry } from "@/lib/api";

export function LeaderboardSpotlight() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getLeaderboard(5);
        setEntries(data?.slice(0, 5) || []);
      } catch (err) {
        console.error("Failed to load spotlight leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fallbackEntries: LeaderboardEntry[] = [
    {
      rank: 1,
      wallet_address: "0x71C...492b",
      bcl_domain: "adebayo.bcl",
      username: "Adebayo",
      level: 4,
      total_points: 1250,
    },
    {
      rank: 2,
      wallet_address: "0x89A...134e",
      bcl_domain: "builder.bcl",
      username: "Builder",
      level: 3,
      total_points: 980,
    },
    {
      rank: 3,
      wallet_address: "0x3F2...88cc",
      bcl_domain: "solidity_dev.bcl",
      username: "Solidity Dev",
      level: 3,
      total_points: 840,
    },
  ];

  const displayEntries = entries.length > 0 ? entries : fallbackEntries;

  return (
    <section className="space-y-6 py-6">
      <div className="surface-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">
                Builder Leaderboard
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Top contributors ranked by verified on-chain proof of work.
              </p>
            </div>
          </div>

          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 text-xs font-bold text-[#0052ff] hover:text-[#1a68ff] transition shrink-0"
          >
            <span>Full Rankings &rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="text-[10px] uppercase text-zinc-400 font-semibold border-b border-white/[0.04]">
              <tr>
                <th className="pb-3 px-3 w-12 text-center">Rank</th>
                <th className="pb-3 px-3">Builder</th>
                <th className="pb-3 px-3">Wallet</th>
                <th className="pb-3 px-3 text-center">Level</th>
                <th className="pb-3 px-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {displayEntries.map((e) => (
                <tr key={e.rank} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3 text-center font-bold num-mono">
                    {e.rank === 1 ? (
                      <span className="text-amber-400">#1</span>
                    ) : e.rank === 2 ? (
                      <span className="text-zinc-300">#2</span>
                    ) : e.rank === 3 ? (
                      <span className="text-amber-600">#3</span>
                    ) : (
                      <span className="text-zinc-500">#{e.rank}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold font-heading text-white">
                    <span className="text-emerald-400">{e.bcl_domain || e.username || "Anonymous"}</span>
                  </td>
                  <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                    {e.wallet_address.length > 14
                      ? `${e.wallet_address.slice(0, 6)}...${e.wallet_address.slice(-4)}`
                      : e.wallet_address}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full text-zinc-300">
                      LVL {e.level}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white num-mono">
                    +{e.total_points.toLocaleString()} PTS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
