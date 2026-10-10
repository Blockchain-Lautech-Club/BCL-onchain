"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Zap, ArrowRight, Loader2 } from "lucide-react";
import { api, Task } from "@/lib/api";

export function LiveQuestsPreview() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const data = await api.getTasks();
        setTasks(data?.slice(0, 3) || []);
      } catch (err) {
        console.error("Failed to load featured quests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const fallbackTasks = [
    {
      id: 1,
      title: "Deploy Your First Smart Contract on Botchain",
      description: "Write and deploy a simple Counter or ERC-20 contract on Botchain Testnet. Submit your transaction hash for instant verification.",
      points: 150,
      verification_type: "onchain_tx",
    },
    {
      id: 2,
      title: "Claim Your Sovereign .bcl Web3 Username",
      description: "Register your personalized .bcl Web3 handle using the club registrar. Automatically verified through your connected wallet.",
      points: 100,
      verification_type: "nft_ownership",
    },
    {
      id: 3,
      title: "Attend the Saturday Solidity Developer Workshop",
      description: "Participate in the hands-on Saturday developer session. Submit proof of attendance or your session PR link.",
      points: 80,
      verification_type: "manual",
    },
  ];

  const displayTasks = tasks.length > 0 ? tasks : fallbackTasks;

  return (
    <section className="space-y-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <span className="text-[11px] font-semibold text-[#0052ff] uppercase tracking-wider">
            HANDS-ON LEARNING
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mt-1">
            Featured Active Quests
          </h2>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1.5 text-xs font-bold text-[#0052ff] hover:text-[#1a68ff] transition"
        >
          <span>View All Quests &rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayTasks.map((t) => (
          <div
            key={t.id}
            className="surface-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-5 card-interactive"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <Award className="h-3 w-3" />
                  <span className="num-mono font-bold">+{t.points}</span> PTS
                </span>

                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                  {t.verification_type === "onchain_tx" ? "Project" : t.verification_type === "nft_ownership" ? "Badge" : "Workshop"}
                </span>
              </div>

              <h3 className="text-base font-bold font-heading text-white leading-snug line-clamp-2">
                {t.title}
              </h3>

              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-sans">
                {t.description}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <Link
                href={`/tasks?id=${t.id}`}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-white/[0.08] hover:bg-[#0052ff] hover:text-white text-zinc-200 py-2.5 text-xs font-semibold transition"
              >
                <span>Start Quest</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
