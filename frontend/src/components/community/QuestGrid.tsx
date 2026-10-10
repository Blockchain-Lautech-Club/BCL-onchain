"use client";

import React, { useEffect, useState } from "react";
import { Award, Loader2 } from "lucide-react";
import { api, Task } from "@/lib/api";
import { QuestCard } from "@/components/quest/QuestCard";
import { taskToCard } from "@/lib/quests";

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
      <div className="py-20 text-center text-ink-4 text-xs flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand mb-2" />
        <span>Loading quests...</span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/[0.08] bg-surface p-12 text-center text-ink-3 space-y-2">
        <Award className="h-8 w-8 mx-auto opacity-40 text-brand" />
        <div className="text-sm font-semibold text-ink">No active quests found</div>
        <p className="text-xs text-ink-4">
          No quests match this filter. Check back soon for new activities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filtered.map((task) => (
        <QuestCard
          key={task.id}
          quest={taskToCard(task)}
          onAction={() => onSelectTask(task)}
        />
      ))}
    </div>
  );
}
