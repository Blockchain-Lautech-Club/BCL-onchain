"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Award, Zap, Loader2 } from "lucide-react";
import { api, Task } from "@/lib/api";

interface QuestGridProps {
  filter: string;
  search: string;
  availableOnly: boolean;
  onSelectTask: (task: Task) => void;
}

export function QuestGrid({ filter, search, availableOnly, onSelectTask }: QuestGridProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const data = await api.getTasks();
        setTasks(data || []);
      } catch (err) {
        console.error("Failed to load tasks from API:", err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter !== "all" && t.verification_type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 text-xs flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0052ff] mb-2" />
        <span>Loading quests...</span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-12 text-center text-zinc-400 space-y-2">
        <Award className="h-8 w-8 mx-auto opacity-40 text-[#0052ff]" />
        <div className="text-sm font-semibold text-white">No active quests found</div>
        <p className="text-xs text-zinc-500">
          No quests match this filter. Check back soon for new activities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filtered.map((task) => (
        <div
          key={task.id}
          onClick={() => onSelectTask(task)}
          className="rounded-2xl border border-white/[0.08] hover:border-[#0052ff]/40 bg-[#0c101a] hover:bg-[#101624] p-5 flex flex-col justify-between space-y-4 cursor-pointer group shadow-md shadow-black/40 card-interactive"
        >
          {/* Top Row: Reward Pills */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                <Award className="h-3 w-3" />
                <span className="num-mono font-bold">+{task.points}</span> Points
              </span>

              <span className="flex items-center gap-1 rounded-md bg-[#0052ff]/10 border border-[#0052ff]/20 px-2 py-0.5 text-[11px] font-semibold text-[#0052ff]">
                <Zap className="h-3 w-3 text-[#00d26a]" />
                Badge
              </span>
            </div>

            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
              {task.verification_type === "onchain_tx" ? "Project" : task.verification_type === "nft_ownership" ? "Badge" : "Workshop"}
            </span>
          </div>

          {/* Campaign Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white group-hover:text-[#0052ff] transition leading-snug line-clamp-2">
              {task.title}
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md overflow-hidden border border-white/[0.1] bg-[#0c101a] p-0.5 shrink-0 flex items-center justify-center">
                <Image
                  src="/bcl-onchain_logo.PNG"
                  alt="BCL"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-zinc-300 text-xs">BCL Space</span>
              <CheckCircle2 className="h-3 w-3 text-[#0052ff] fill-[#0052ff]/20" />
            </div>

            <span className="text-[11px] font-medium text-[#00d26a] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00d26a] animate-pulse" />
              Active
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
