"use client";

import React from "react";
import { Search, CheckCircle2 } from "lucide-react";

interface CampaignFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeFilter: string;
  onFilterChange: (val: string) => void;
  availableOnly: boolean;
  onToggleAvailable: (val: boolean) => void;
}

export function CampaignFilterBar({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  availableOnly,
  onToggleAvailable,
}: CampaignFilterBarProps) {
  const tabs = [
    { id: "all", label: "All Quests" },
    { id: "onchain_tx", label: "Project Builds" },
    { id: "nft_ownership", label: "Badges" },
    { id: "manual", label: "Workshops & Events" },
  ];

  return (
    <div className="w-full space-y-4 pt-4 border-t border-ink/[0.08]">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-sans">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`rounded-full px-4 py-1.5 font-medium transition cursor-pointer shrink-0 ${
              activeFilter === tab.id
                ? "bg-brand text-white font-semibold shadow-md shadow-brand/25"
                : "bg-ink/[0.05] text-ink-3 hover:text-ink hover:bg-ink/[0.08] border border-ink/[0.06]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Control Bar: Search + Filter Tools */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search active quests or rewards..."
            className="w-full rounded-xl border border-ink/[0.08] bg-surface pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand"
          />
        </div>

        {/* Available to Claim Toggle */}
        <button
          onClick={() => onToggleAvailable(!availableOnly)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium border transition cursor-pointer shrink-0 ${
            availableOnly
              ? "border-brand/40 bg-brand/15 text-brand"
              : "border-ink/[0.08] bg-surface text-ink-3 hover:text-ink"
          }`}
        >
          <CheckCircle2 className={`h-4 w-4 ${availableOnly ? "text-brand" : "text-ink-5"}`} />
          <span>Available to Claim</span>
        </button>
      </div>
    </div>
  );
}
