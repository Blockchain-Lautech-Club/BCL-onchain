"use client";

import React, { useState } from "react";
import { CampaignHero } from "@/components/community/CampaignHero";
import { CampaignFilterBar } from "@/components/community/CampaignFilterBar";
import { QuestGrid } from "@/components/community/QuestGrid";
import { CampaignDrawer } from "@/components/community/CampaignDrawer";
import { Task } from "@/lib/api";

export function CommunityHub() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  return (
    <section className="w-full space-y-6">
      <CampaignHero onSelectFeaturedTask={(task) => setActiveTask(task)} />

      <div className="space-y-4 pt-4">
        <CampaignFilterBar
          search={search}
          onSearchChange={setSearch}
          activeFilter={filter}
          onFilterChange={setFilter}
          availableOnly={availableOnly}
          onToggleAvailable={(val) => setAvailableOnly(val)}
        />

        <QuestGrid
          filter={filter}
          search={search}
          availableOnly={availableOnly}
          onSelectTask={(task) => setActiveTask(task)}
        />
      </div>

      <CampaignDrawer
        task={activeTask}
        onClose={() => setActiveTask(null)}
        onSuccess={() => {
          setActiveTask(null);
        }}
      />
    </section>
  );
}
