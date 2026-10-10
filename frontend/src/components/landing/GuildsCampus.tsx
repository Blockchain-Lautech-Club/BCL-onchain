import React from "react";
import { ArrowRight, Lock } from "lucide-react";

const GUILDS = [
  { name: "Smart Contracts & Rust", members: "140 Active Builders", status: "Guild Full", statusColor: "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20" },
  { name: "Product Design & UX", members: "102 UI Creators", status: "Join", statusColor: "text-accent-fg bg-accent/10 border-accent/20" },
  { name: "Developer Relations & Media", members: "210 Contributors", status: "Join", statusColor: "text-accent-fg bg-accent/10 border-accent/20" },
];

export function GuildsCampus() {
  return (
    <section className="py-6">
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-5 mb-1">// SPECIALIZATIONS</div>
        <h2 className="text-xl font-extrabold font-heading text-ink">Campus Guilds</h2>
        <p className="text-xs text-ink-4 mt-1">Collaborate with fellow LAUTECH engineers, designers, content writers, and community builders.</p>
      </div>
      <div className="space-y-2.5">
        {GUILDS.map(({ name, members, status, statusColor }) => (
          <div key={name} className="quest-card px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-accent/50" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink font-heading">{name}</div>
                <div className="text-[10px] text-ink-5">{members}</div>
              </div>
            </div>
            <span className={`text-xs font-bold border px-3 py-1 rounded-lg ${statusColor}`}>{status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
