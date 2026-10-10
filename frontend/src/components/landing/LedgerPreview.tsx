"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, CheckCircle2 } from "lucide-react";
import { api, Task } from "@/lib/api";

export function LedgerPreview() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getTasks();
        if (data && data.length > 0) {
          setTasks(data.slice(0, 4));
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error("Failed to load tasks for ledger preview:", err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="surface-card rounded p-5 space-y-4 card-interactive">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Active Quests</span>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
        >
          <span>ALL TASKS</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-zinc-500 text-xs">
          Loading active quests...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-xs">
          No active quests found at this time.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-zinc-500 border-b border-white/[0.04]">
              <tr>
                <th className="pb-2">Task Description</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Reward</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-white/[0.01]">
                  <td className="py-2.5 pr-2">
                    <div className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{task.title}</div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="text-[10px] text-zinc-400 uppercase bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {task.verification_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right num-mono text-emerald-400 font-bold">
                    +{task.points} PTS
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/tasks?id=${task.id}`}
                      className="text-[11px] text-zinc-300 hover:text-white underline underline-offset-2"
                    >
                      Start
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
