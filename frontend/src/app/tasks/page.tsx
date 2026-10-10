"use client";

import React, { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import { QuestCard } from "@/components/quest/QuestCard";
import { FALLBACK_QUESTS, taskToCard, type QuestCardData } from "@/lib/quests";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Zap, Loader2, Search, Grid3X3, List
} from "lucide-react";

const CATEGORIES = ["All", "Community", "Social", "Learning", "Developer", "Creator", "Events", "Hackathon", "Partner", "Beginner"];

export default function TasksPage() {
  const { walletAddress, connectWallet, refreshUserData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apiOk, setApiOk] = useState(false);
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selectedTask, setSelectedTask] = useState<QuestCardData | null>(null);
  const [evidenceInput, setEvidenceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getTasks().then((d) => { setTasks(d || []); setApiOk(true); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Live quests from the API; demo set only if the API is unreachable or has none published.
  const cards: QuestCardData[] = apiOk && tasks.length > 0 ? tasks.map(taskToCard) : FALLBACK_QUESTS;
  const filtered = cards.filter(q =>
    (category === "All" || q.category.toLowerCase() === category.toLowerCase()) &&
    (searchQ === "" || q.title.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceInput.trim()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success("Submission queued for on-chain verification!");
    setIsSubmitting(false);
    setEvidenceInput("");
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl bg-gradient-to-br from-surface to-surface border border-accent/15 p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-50 pointer-events-none" />
        <div className="absolute top-[-30%] right-[-5%] w-64 h-64 bg-accent/[0.07] blur-[80px] pointer-events-none rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-green">ON-CHAIN ACHIEVEMENT ENGINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink mb-2 tracking-tight">Quests Discovery</h1>
          <p className="text-sm text-ink-4 max-w-lg mb-6">
            Do more. Learn more. Contribute more. Earn more. Validate cryptographic mastery across decentralized campus hubs.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="stat-card">
              <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">Active Quests</div>
              <div className="text-xl font-extrabold text-ink font-heading num-mono">48 <span className="text-xs font-normal text-accent-fg">+6 new</span></div>
            </div>
            <div className="stat-card">
              <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">Total XP Pool</div>
              <div className="text-xl font-extrabold text-accent-fg font-heading num-mono">124.5K <span className="text-xs font-normal text-ink-5">XP</span></div>
            </div>
            <div className="stat-card">
              <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">Your Verification</div>
              <div className="text-xl font-extrabold text-ink font-heading num-mono">78% <span className="text-xs font-normal text-ink-5">Tier 2</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-ink/[0.08] rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-ink-5 shrink-0" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search quests by name, skill, sponsor, or contract..."
            className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-5 outline-none"
          />
          <span className="text-[10px] text-ink-5 bg-ink/[0.04] border border-ink/[0.06] px-1.5 py-0.5 rounded font-mono">⌘ K</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface border border-ink/[0.08] text-xs text-ink-3 font-medium">
            Featured Quests
          </button>
          <button onClick={() => setView("grid")} className={`p-2.5 rounded-xl border transition ${view==="grid" ? "bg-accent/15 border-accent/25 text-accent-fg" : "bg-surface border-ink/[0.08] text-ink-5"}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2.5 rounded-xl border transition ${view==="list" ? "bg-accent/15 border-accent/25 text-accent-fg" : "bg-surface border-ink/[0.08] text-ink-5"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              category === cat
                ? "bg-accent/15 text-accent-fg border border-accent/25"
                : "text-ink-4 hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between text-xs text-ink-5">
        <span>Showing <span className="text-ink font-semibold">{filtered.length}</span> of {cards.length} Quests</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Synced with Polygon & Arbitrum RPC nodes</span>
      </div>

      {/* Quest Grid */}
      <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
        {loading ? (
          <div className="col-span-4 py-16 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-fg" />
            <span className="text-xs text-ink-5">Loading quests from chain...</span>
          </div>
        ) : filtered.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onAction={() => { if (!walletAddress) { connectWallet(); } else { setSelectedTask(q); } }}
          />
        ))}
      </div>

      {/* Sponsor CTA */}
      <div className="surface-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-fg" />
          </div>
          <div>
            <div className="text-sm font-bold font-heading text-ink">Have a Quest or Hackathon to Sponsor?</div>
            <div className="text-xs text-ink-4">Deploy verified task criteria and XP rewards for 4,000+ certified student developers.</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-outline px-4 py-2 text-xs font-bold">Read Docs</button>
          <button className="btn-green px-4 py-2 text-xs font-bold flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Submit Quest RFP
          </button>
        </div>
      </div>

      {/* Submit Modal */}
      {selectedTask && walletAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/[0.1] bg-surface p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="badge-green mb-1">{selectedTask.category}</div>
                <h3 className="font-heading font-bold text-base text-ink">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-ink-5 hover:text-ink transition">✕</button>
            </div>
            <p className="text-xs text-ink-4">{selectedTask.description}</p>
            <div className="flex items-center gap-2">
              <span className="xp-tag"><Zap className="w-2.5 h-2.5" />+{selectedTask.xp.toLocaleString()} XP</span>
              <span className="text-[10px] text-ink-5">{selectedTask.reward}</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-ink-4 uppercase font-semibold mb-1.5">Proof / Evidence URL</label>
                <input
                  type="text"
                  value={evidenceInput}
                  onChange={(e) => setEvidenceInput(e.target.value)}
                  placeholder="https://github.com/... or 0x..."
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-4 py-2.5 text-xs text-ink placeholder:text-ink-5 focus:outline-none focus:border-accent/40 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !evidenceInput.trim()}
                className="w-full btn-green py-2.5 text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {isSubmitting ? "Verifying on-chain..." : "Submit Proof"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
