"use client";

import React, { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import { taskToCard, type QuestCardData } from "@/lib/quests";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LinkifiedText } from "@/components/common/LinkifiedText";
import { 
  Zap, Loader2, Search, Grid3X3, List, X, 
  ChevronDown, CheckCircle2, Clock, Terminal, 
  Award, ArrowRight, Shield, Hexagon, Play, 
  Users, TrendingUp, Cpu, AlertCircle
} from "lucide-react";

const CATEGORIES = ["All", "Community", "Social", "Learning", "Developer", "Creator", "Events", "Hackathon", "Partner", "Beginner"];

export default function TasksPage() {
  const router = useRouter();
  const { walletAddress, connectWallet, refreshUserData, stats } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selectedTask, setSelectedTask] = useState<QuestCardData | null>(null);
  const [evidenceInput, setEvidenceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getTasks()
      .then((d) => setTasks(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  let cards: QuestCardData[] = tasks.map(taskToCard);

  let filtered = cards.filter((q) =>
    (category === "All" || q.category.toLowerCase() === category.toLowerCase()) &&
    (searchQ === "" || q.title.toLowerCase().includes(searchQ.toLowerCase()))
  );

  // Sorting
  if (sortBy === "highest-xp") {
    filtered.sort((a, b) => b.xp - a.xp);
  } else if (sortBy === "newest") {
    filtered.sort((a, b) => (b.id as number) - (a.id as number));
  }

  // Derived stats
  const totalXpPool = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
  const publishedCount = tasks.filter((t) => t.status === "published").length;
  const verifiedCount = stats?.completed_tasks_count ?? 0;
  const verificationRate = publishedCount > 0 ? Math.round((verifiedCount / publishedCount) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceInput.trim() || !selectedTask) return;
    setIsSubmitting(true);
    try {
      const taskId = typeof selectedTask.id === "string" ? parseInt(selectedTask.id, 10) : selectedTask.id;
      await api.submitTask(taskId, { url: evidenceInput.trim() });
      toast.success("Submission queued for on-chain verification!");
      setSelectedTask(null);
      setEvidenceInput("");
      await refreshUserData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to determine badge color based on category
  const getCategoryColor = (cat: string) => {
    switch(cat.toLowerCase()) {
      case 'developer': return 'text-purple-500 bg-purple-500/10';
      case 'learning': return 'text-amber-500 bg-amber-500/10';
      case 'hackathon': return 'text-red-500 bg-red-500/10';
      case 'community': return 'text-accent-fg bg-accent/10';
      case 'creator': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-ink bg-ink/5';
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 flex flex-col overflow-x-hidden">
      
      {/* 1. Discovery Hero & Metrics Header */}
      <section className="relative w-full rounded-2xl bg-surface border border-ink/5 p-4 sm:p-6 md:p-10 overflow-hidden shadow-sm mb-6 sm:mb-8">
        <div className="absolute -right-16 -top-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-24 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 text-accent-fg mb-3 sm:mb-4 shadow-sm border border-ink/5">
              <Hexagon className="w-4 h-4 shrink-0" />
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider">On-Chain Achievement Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-ink tracking-tight mb-2 sm:mb-3 break-words">
              Quests Discovery
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-ink-4 max-w-xl leading-relaxed">
              Do more. Learn more. Contribute more. Earn more. Validate cryptographic mastery across decentralized campus hubs.
            </p>
          </div>
          
          {/* High-Precision Telemetry Strips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3 sm:p-4 rounded-xl bg-ink/[0.03] border border-ink/5 flex flex-col justify-center">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold text-ink-4 tracking-wider">Active Quests</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-heading font-bold text-ink">{loading ? "..." : publishedCount}</span>
                <span className="font-mono text-[9px] sm:text-[10px] text-accent-fg font-bold">+6 new</span>
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-ink/[0.03] border border-ink/5 flex flex-col justify-center">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold text-ink-4 tracking-wider">Total XP Pool</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-heading font-bold text-amber-500">
                  {loading ? "..." : totalXpPool >= 1000 ? `${(totalXpPool / 1000).toFixed(1)}K` : totalXpPool}
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] text-amber-500 font-bold">XP</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl bg-ink/[0.03] border border-ink/5 flex flex-col justify-center">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold text-ink-4 tracking-wider">Your Verification</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-heading font-bold text-accent-fg">{loading ? "..." : `${verificationRate}%`}</span>
                <span className="font-mono text-[9px] sm:text-[10px] text-ink-4 font-bold">{verifiedCount} Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Quick Sort Command Bar */}
        <div className="relative z-10 mt-8 pt-6 border-t border-ink/5 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-4" />
            <input 
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full h-12 pl-12 pr-20 rounded-xl bg-ink/[0.03] border border-ink/5 text-ink placeholder:text-ink-4/60 text-sm outline-none focus:border-accent/40 focus:bg-surface transition-all"
              placeholder="Search quests by name, skill, sponsor, or contract..." 
              type="text"
            />
            {searchQ ? (
              <button onClick={() => setSearchQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-surface border border-ink/10 text-ink-4 font-mono text-[10px] font-bold">
                <span>⌘</span><span>K</span>
              </div>
            )}
          </div>
          
          <div className="relative w-full md:w-64 shrink-0">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-ink/[0.03] border border-ink/5 text-ink text-sm font-semibold outline-none cursor-pointer appearance-none focus:border-accent/40 focus:bg-surface pr-10"
            >
              <option value="featured">Featured Quests</option>
              <option value="highest-xp">Highest XP Reward</option>
              <option value="newest">Newest Releases</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-4 pointer-events-none" />
          </div>
        </div>

        {/* Filter Pills Strip */}
        <div className="relative z-10 mt-4 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-5 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider font-bold transition-all ${
                category === cat
                  ? "bg-ink text-surface shadow-md"
                  : "bg-ink/5 text-ink-4 hover:text-ink hover:bg-ink/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Live Status Filter Sub-Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 px-2">
        <div className="flex items-center gap-3 text-ink-4">
          <span className="font-mono text-sm text-ink font-bold">Showing {filtered.length} of {cards.length} Quests</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent-fg hidden sm:block" />
          <span className="text-xs hidden sm:inline text-ink-4">Synced with LAUTECH L2 Settlement RPC</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-ink/10 text-accent-fg" : "bg-transparent text-ink-4 hover:bg-ink/5 hover:text-ink"}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView("list")}
            className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-ink/10 text-accent-fg" : "bg-transparent text-ink-4 hover:bg-ink/5 hover:text-ink"}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Quests Grid */}
      {loading ? (
        <div className={`grid gap-6 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-surface border border-ink/5 h-[380px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-ink/5 p-16 text-center space-y-4">
          <div className="w-20 h-20 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-ink-4" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-ink">No quests match your criteria</h2>
          <p className="text-sm text-ink-4">Try adjusting your filters or checking back later for new drops.</p>
          <button onClick={() => { setCategory("All"); setSearchQ(""); }} className="px-6 py-2.5 rounded-full bg-ink/5 text-ink font-bold text-sm hover:bg-ink/10 transition-colors">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"}`}>
          {filtered.map((q) => {
            const catColor = getCategoryColor(q.category);
            const isCompleted = q.status === "complete";
            const isPending = q.status === "submitted" || q.status === "under_review";
            const isRejected = q.status === "rejected";

            return (
              <article 
                key={q.id} 
                className={`group relative flex flex-col justify-between rounded-2xl bg-surface border border-ink/5 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer ${isCompleted ? 'opacity-85' : ''}`}
                onClick={() => {
                  router.push(`/tasks/${q.id}`);
                }}
              >
                {q.category.toLowerCase() === 'hackathon' && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 rounded-t-2xl" />
                )}
                
                <div className="flex flex-col flex-1">
                  {/* Image/Header Area */}
                  <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-ink/5 border border-ink/5">
                    <img 
                      src={q.image || "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=1000"} 
                      alt={q.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Top Left Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-accent' : isPending ? 'bg-amber-500' : q.category.toLowerCase() === 'hackathon' ? 'bg-red-500' : 'bg-accent'}`} />
                      <span className="font-mono text-[10px] text-white font-bold uppercase tracking-wider">
                        {isCompleted ? 'Completed' : isPending ? 'In Review' : q.category.toLowerCase() === 'hackathon' ? 'Advanced' : 'Active'}
                      </span>
                    </div>
                    
                    {/* Top Right Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{q.timer || "7d left"}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${catColor}`}>
                      {q.category}
                    </span>
                    <div className="flex items-center gap-1 text-ink-4 font-mono text-[10px] font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>Skill Track</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-heading font-bold text-ink leading-tight group-hover:text-accent-fg transition-colors mb-2">
                    {q.title}
                  </h3>
                  <div className="text-sm text-ink-4 line-clamp-3 mb-2 leading-relaxed">
                    <LinkifiedText text={q.description} />
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="pt-4 mt-4 border-t border-ink/5">
                  <div className="p-3 rounded-xl bg-ink/[0.02] border border-ink/5 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Zap className="w-4 h-4 fill-amber-500" />
                      <span className="font-mono text-sm font-bold">+{q.xp.toLocaleString()} XP</span>
                    </div>
                    <span className="text-xs text-ink-4 font-semibold truncate max-w-[130px]">
                      {isCompleted ? '✓ Awarded' : q.category.toLowerCase() === 'hackathon' ? 'Major Reward' : 'Verification Badge'}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/tasks/${q.id}`);
                    }}
                    className={`w-full py-2.5 rounded-xl font-heading text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      isCompleted 
                        ? 'bg-accent/15 text-accent-fg border border-accent/20 hover:bg-accent/25'
                        : isPending
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20 hover:bg-amber-500/25'
                        : 'bg-ink/5 text-ink group-hover:bg-accent group-hover:text-surface'
                    }`}
                  >
                    <span>
                      {isCompleted 
                        ? 'View Quest (Completed)' 
                        : isPending 
                        ? 'View Submission (In Review)' 
                        : q.category.toLowerCase() === 'hackathon' 
                        ? 'Register Team' 
                        : 'Start Quest'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. Bottom Interactive Protocol Callout */}
      <section className="mt-12 sm:mt-16 rounded-2xl bg-gradient-to-br from-page via-surface to-page border border-ink/5 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10 text-center sm:text-left">
          <div className="w-13 h-13 sm:w-16 sm:h-16 p-3 rounded-2xl bg-surface border border-ink/10 flex items-center justify-center text-accent-fg shrink-0 shadow-sm">
            <Cpu className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl font-heading font-bold text-ink mb-1.5 sm:mb-2">Have a Quest or Hackathon to Sponsor?</h4>
            <p className="text-xs sm:text-sm text-ink-4 max-w-lg leading-relaxed">Deploy verified task criteria and XP rewards directly to the BCL ecosystem for 4,000+ certified student developers to solve.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto relative z-10">
          <button className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-full bg-surface border border-ink/10 text-ink hover:bg-ink/5 transition-all text-xs sm:text-sm font-bold">
            Read Docs
          </button>
          <button className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-full bg-ink text-surface hover:shadow-lg transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
            Submit Quest RFP <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5. Submit Modal */}
      {selectedTask && walletAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-ink/10 bg-surface p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-2xl relative">
            <button 
              onClick={() => { setSelectedTask(null); setEvidenceInput(""); }} 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-ink-4 hover:text-ink transition-colors bg-ink/5 p-2 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(selectedTask.category)}`}>
                  {selectedTask.category}
                </span>
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ink leading-tight mb-2 pr-8">{selectedTask.title}</h3>
              <div className="text-xs sm:text-sm text-ink-4 leading-relaxed">
                <LinkifiedText text={selectedTask.description} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit">
              <Zap className="w-4 h-4 fill-amber-500" />
              <span className="font-mono text-xs sm:text-sm font-bold">+{selectedTask.xp.toLocaleString()} XP</span>
            </div>

            {selectedTask.status === "complete" ? (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent-fg space-y-1">
                <div className="flex items-center gap-2 font-heading font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quest Completed</span>
                </div>
                <p className="text-xs text-ink-3">You have already completed this quest and received XP.</p>
              </div>
            ) : selectedTask.status === "under_review" || selectedTask.status === "submitted" ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 space-y-1">
                <div className="flex items-center gap-2 font-heading font-bold text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submission Under Review</span>
                </div>
                <p className="text-xs text-ink-3">Your proof has been submitted. Quests are limited to one submission per builder.</p>
              </div>
            ) : selectedTask.status === "rejected" ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 space-y-1">
                <div className="flex items-center gap-2 font-heading font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Submission Concluded</span>
                </div>
                <p className="text-xs text-ink-3">This quest has already been submitted and cannot be resubmitted.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-ink/5">
                <div>
                  <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-1.5 sm:mb-2">
                    Proof / Evidence URL
                  </label>
                  <input
                    type="text"
                    value={evidenceInput}
                    onChange={(e) => setEvidenceInput(e.target.value)}
                    placeholder="https://github.com/... or 0x..."
                    className="w-full bg-ink/[0.03] border border-ink/10 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-ink placeholder:text-ink-4/60 focus:outline-none focus:border-accent/50 focus:bg-surface transition-all font-mono"
                    required
                  />
                  <span className="block text-[11px] text-ink-4 mt-1">1 submission per builder. Please ensure proof is valid.</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !evidenceInput.trim()}
                  className="w-full py-3 sm:py-3.5 rounded-full bg-ink text-surface text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-ink-3 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>{isSubmitting ? "Verifying..." : "Submit Proof"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}