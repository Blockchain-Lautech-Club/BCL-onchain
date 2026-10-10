"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Award, CheckCircle2, Globe, Users } from "lucide-react";

export function StatsSection() {
  const [stats, setStats] = useState({
    total_users: 128,
    total_points_awarded: 45200,
    total_tasks_completed: 342,
    total_domains_registered: 64,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getPlatformStats();
        if (res) setStats(res);
      } catch {
        // Fallback demo stats
      }
    }
    loadStats();
  }, []);

  const items = [
    {
      label: "Active Builders",
      value: stats.total_users.toLocaleString(),
      icon: Users,
      desc: "Verified community members",
    },
    {
      label: "Points Distributed",
      value: stats.total_points_awarded.toLocaleString(),
      icon: Award,
      desc: "Earned by club members",
    },
    {
      label: "Tasks Verified",
      value: stats.total_tasks_completed.toLocaleString(),
      icon: CheckCircle2,
      desc: "Completed challenges",
    },
    {
      label: ".bcl Names Claimed",
      value: stats.total_domains_registered.toLocaleString(),
      icon: Globe,
      desc: "Custom Web3 handles",
    },
  ];

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="glass-panel rounded-xl p-5 border border-white/[0.06] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{item.label}</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight num-mono">
                  {item.value}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
