import React from "react";
import { Users, CheckCircle2, Zap, Calendar } from "lucide-react";

const STATS = [
  { icon: Users, value: "4,800+", label: "Active Cohort", sub: "Students, developers & researchers" },
  { icon: CheckCircle2, value: "38,400+", label: "Quests Verified", sub: "Code submissions & attestations" },
  { icon: Zap, value: "1.2M+", label: "XP Distributed", sub: "Sovereign reputation tokens" },
  { icon: Calendar, value: "140+", label: "Community Events", sub: "Campus buildathons & Twitter Spaces" },
];

export function StatsBar() {
  return (
    <section className="py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ icon: Icon, value, label, sub }) => (
          <div key={label} className="stat-card flex flex-col gap-1">
            <Icon className="w-4 h-4 text-accent-fg mb-1" />
            <div className="text-2xl font-extrabold font-heading text-ink num-mono">{value}</div>
            <div className="text-xs font-semibold text-ink-3">{label}</div>
            <div className="text-[10px] text-ink-5">{sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
