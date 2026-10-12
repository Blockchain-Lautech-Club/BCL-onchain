"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Task, TaskSubmission } from "@/lib/api";
import {
  CheckCircle2, Loader2, ArrowLeft, Zap, Shield, ExternalLink,
  Lock, Clock, Users, Award, ChevronRight, Copy, AlertCircle,
  Terminal, Flame, Folder, PlayCircle, Gavel, Headset, MessageSquare, Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import { QuestImage } from "@/components/quest/QuestImage";
import { coverForCategory } from "@/lib/quests";
import { getExplorerUrl } from "@/lib/contracts";

export function QuestDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { walletAddress, connectWallet, refreshUserData } = useAuth();
  const id = typeof params?.id === "string" ? params.id : "";

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceInput, setEvidenceInput] = useState("");

  useEffect(() => {
    const fetchQuestData = async () => {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) {
        setLoading(false);
        return;
      }
      try {
        const [taskData, subsData] = await Promise.all([
          api.getTask(numId),
          walletAddress ? api.getMySubmissions() : Promise.resolve([])
        ]);
        setTask(taskData);
        const userSub = subsData.find(s => s.task_id === numId);
        if (userSub) setSubmission(userSub);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestData();
  }, [id, walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) { 
      await connectWallet(); 
      return; 
    }
    if (!evidenceInput.trim() || !task) return;
    
    setIsSubmitting(true);
    try {
      await api.submitTask(task.id, { url: evidenceInput.trim() });
      toast.success("Submission sent! Oracle scanning initialization...");
      // Optimistic update — use "submitted" which is a valid status in the union
      setSubmission({
        id: Math.random(),
        task_id: task.id,
        user_id: 0,
        wallet: walletAddress,
        evidence: { url: evidenceInput.trim() },
        status: "submitted",
        created_at: new Date().toISOString(),
      });
      await refreshUserData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-fg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold text-ink">Quest Not Found</h1>
        <p className="text-ink-4 mt-2 mb-6">The quest you are looking for does not exist or has been archived.</p>
        <button onClick={() => router.push("/tasks")} className="btn-outline px-6 py-2">Return to Discovery</button>
      </div>
    );
  }

  const isVerified = submission?.status === "verified";
  const isPending  = submission?.status === "submitted" || submission?.status === "under_review";
  const isRejected = submission?.status === "rejected";
  const hasSubmitted = !!submission;

  // Calculate dynamic progress to mirror the HTML design
  const progressPct  = isVerified ? 100 : hasSubmitted ? 80 : 50;
  const currentStage = isVerified ? 3 : hasSubmitted ? 2 : 1;

  // Helper for category styles
  const getCategoryStyles = (cat: string) => {
    switch(cat?.toLowerCase()) {
      case 'developer': return { text: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'learning':  return { text: 'text-amber-500',  bg: 'bg-amber-500/10'  };
      case 'hackathon': return { text: 'text-red-500',    bg: 'bg-red-500/10'    };
      case 'community': return { text: 'text-accent-fg',  bg: 'bg-accent/10'     };
      case 'creator':   return { text: 'text-blue-500',   bg: 'bg-blue-500/10'   };
      default:          return { text: 'text-accent-fg',  bg: 'bg-accent/10'     };
    }
  };
  const catStyles = getCategoryStyles(task.category);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 overflow-x-hidden">
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-ink-4 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
        <button onClick={() => router.push("/tasks")} className="hover:text-ink transition-colors flex items-center gap-1">
          <Folder className="w-4 h-4" /> Quests
        </button>
        <span className="text-ink/20">/</span>
        <span className="text-ink-4">{task.category || "General"}</span>
        <span className="text-ink/20">/</span>
        <span className="text-accent-fg font-medium">Quest Details</span>
      </nav>

      {/* Hero Banner: Cyber-Glass Surface */}
      <section className="relative w-full rounded-2xl bg-surface border border-ink/5 shadow-sm overflow-hidden p-4 sm:p-6 md:p-10">
        {/* Ambient Specular Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          {/* Title & Tags */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full ${catStyles.bg} ${catStyles.text} font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-ink/5`}>
                <Terminal className="w-3.5 h-3.5" />
                <span>{task.category || "Ecosystem"} Guild</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Active Campaign</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-ink/5 text-ink-4 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-ink/5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-4 animate-ping" />
                <span>Epoch Open</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-extrabold text-ink tracking-tight">
              {task.title}
            </h1>
            <p className="text-sm md:text-base text-ink-4 max-w-2xl leading-relaxed">
              {task.description}
            </p>
            
            {/* Dynamic Overall Progress Meter */}
            <div className="space-y-2 pt-2 max-w-md">
              <div className="flex justify-between items-center font-mono text-[10px] font-bold uppercase tracking-wider">
                <span className="text-ink-4">Checkpoint Synchronization</span>
                <span className="text-accent-fg">{currentStage} of 3 Tasks Completed ({progressPct}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink/5 overflow-hidden p-[1px]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-accent transition-all duration-700 shadow-[0_0_12px_rgba(0,245,160,0.5)]" 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Rewards Summary Metric Cluster */}
          <div className="w-full lg:w-auto shrink-0 bg-surface/90 border border-ink/5 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col gap-4 min-w-0 sm:min-w-[280px] backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-ink/5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4">Reward Payload</span>
              <Shield className="text-accent-fg w-4 h-4" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink flex items-center gap-2 font-semibold">
                  <Zap className="text-amber-500 w-4 h-4" /> Experience
                </span>
                <span className="font-mono text-sm text-amber-500 font-bold">+{task.points?.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink flex items-center gap-2 font-semibold">
                  <Award className="text-purple-500 w-4 h-4" /> Soulbound Credential
                </span>
                <span className="font-mono text-[10px] font-bold px-2.5 py-1 bg-purple-500/10 text-purple-500 rounded uppercase tracking-wider">Milestone NFT</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink flex items-center gap-2 font-semibold">
                  <Lock className="text-accent-fg w-4 h-4" /> Gas Subsidies
                </span>
                <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">BCL Sponsored</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Verification Flow & Checklist (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-heading font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="text-accent-fg w-5 h-5" />
              <span>Verification Protocol</span>
            </h2>
            <span className="font-mono text-[10px] text-ink-4 uppercase tracking-wider font-bold hidden sm:block">All tasks require cryptographic proof</span>
          </div>

          {/* Flow Step 1: Quest Initialization */}
          <div className="p-6 rounded-2xl bg-surface border border-ink/5 shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent-fg flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,245,160,0.3)]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-heading font-bold text-ink">Quest Initialization & Requirements</h3>
                    <span className="font-mono text-[10px] text-amber-500 font-bold uppercase tracking-wider">Unlocked</span>
                  </div>
                  <p className="text-sm text-ink-4">Quest parameters loaded. Your wallet is authorized to interact with this protocol challenge.</p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="font-mono text-[10px] text-ink-4 font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Shield className="w-3.5 h-3.5 text-accent-fg" /> Authenticated via Web3 Provider
                    </span>
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-ink/5 font-mono text-[10px] font-bold text-ink-4 uppercase tracking-wider">Validated</span>
            </div>
          </div>

          {/* Flow Step 2: Proof Submission */}
          <div className={`relative p-6 md:p-8 rounded-2xl transition-all shadow-sm ${
            isVerified ? "bg-surface border border-ink/5" : "bg-surface border border-accent/20 shadow-[0_0_20px_rgba(0,245,160,0.05)]"
          }`}>
            {!isVerified && (
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-accent text-surface font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-surface animate-pulse" />
                ACTIVE CHECKPOINT
              </div>
            )}
            
            <div className={`space-y-4 ${!isVerified ? 'pt-2' : ''}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-3">
                  {isVerified && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 text-accent-fg flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,245,160,0.3)]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  <h3 className="text-xl font-heading font-bold text-ink">Submit Protocol Proof of Work</h3>
                </div>
                <span className="font-mono text-sm text-amber-500 font-bold">+{task.points?.toLocaleString()} XP</span>
              </div>
              
              <p className="text-sm text-ink-4 leading-relaxed">
                {isVerified 
                  ? "Your submission has been successfully processed and recorded on-chain by the oracle consensus."
                  : "Deliver the production interface deployment, transaction hash, or repository link required to satisfy this quest's parameters."}
              </p>

              {isVerified ? (
                <div className="mt-4 pt-4 border-t border-ink/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-ink-4 font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-accent-fg" /> Automated CI runner confirmed
                    </span>
                    <span className="text-ink/20">•</span>
                    {submission?.tx_hash ? (
                      <a href={getExplorerUrl(submission.tx_hash)} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-1 uppercase tracking-wider">
                        {submission.tx_hash.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">100% Passed</span>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] text-ink uppercase font-bold tracking-wider" htmlFor="proof-url">
                      Hosted Application, Tx Hash, or Repository URL
                    </label>
                    <div className="relative flex items-center">
                      <PlayCircle className="absolute left-4 w-5 h-5 text-ink-4" />
                      <input 
                        id="proof-url"
                        value={evidenceInput}
                        onChange={(e) => setEvidenceInput(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-ink/5 text-ink font-mono text-sm placeholder:text-ink-4/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                        placeholder="https://github.com/..." 
                        required 
                        disabled={isPending || isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-ink/5">
                    <span className="text-xs text-ink-4 font-medium">
                      Oracle scanner validates commits within <span className="font-bold text-ink">{"<15 seconds"}</span>.
                    </span>
                    <button 
                      type="submit"
                      disabled={isSubmitting || isPending}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-accent text-surface font-bold text-sm hover:shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      <span>{isSubmitting ? "Verifying..." : isPending ? "Pending Audit" : "Verify Submission"}</span>
                    </button>
                  </div>

                  {isPending && (
                    <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Triggering consensus RPC verification... Validating submission hash.</span>
                    </div>
                  )}
                  {isRejected && (
                    <div className="p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      <span>Verification failed. Please review guidelines and submit valid proof.</span>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Flow Step 3: Locked / Final Protocol */}
          <div className={`p-6 rounded-2xl flex flex-col gap-4 shadow-sm transition-all ${
            isVerified ? "bg-surface border border-ink/5" : "bg-ink/[0.02] border border-ink/5 opacity-60"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-ink/5 text-ink-4 flex items-center justify-center shrink-0 mt-0.5">
                  {isVerified ? <CheckCircle2 className="w-5 h-5 text-accent-fg" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-lg font-heading font-bold ${isVerified ? 'text-ink' : 'text-ink-4'}`}>Ecosystem Consensus & Settlement</h3>
                    {!isVerified && <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">+ Bonus XP</span>}
                  </div>
                  <p className="text-sm text-ink-4">Finalize the quest parameters and mint your respective Soulbound token directly to your identity.</p>
                  
                  {!isVerified && (
                    <div className="pt-2">
                      <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Unlocks automatically upon successful submission of Proof of Work
                      </span>
                    </div>
                  )}
                  {isVerified && (
                    <div className="pt-2">
                      <span className="font-mono text-[10px] text-accent-fg font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> Consensus Achieved. Rewards Dispatched.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quest Metadata, Contenders, Rules (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Host & Ecosystem Sponsorship */}
          <div className="p-6 rounded-2xl bg-surface border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-4 uppercase tracking-wider font-bold">Quest Authority</span>
              <span className="font-mono text-[10px] text-accent-fg uppercase tracking-wider font-bold">Official Guild</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 border border-ink/5">
                <Shield className="w-7 h-7 text-ink" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-heading font-bold text-ink">{task.category || "Ecosystem"} Guild</h4>
                <p className="text-xs text-ink-4 leading-tight">In coalition with Campus DAOs & Layer-2 Ecosystem Partners</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-ink/5">
              {["#Verification", "#Onchain", "#Build"].map(tag => (
                <span key={tag} className="px-2 py-1 rounded bg-ink/5 font-mono text-[10px] font-bold text-ink-4">{tag}</span>
              ))}
            </div>
          </div>

          {/* Contenders Activity Roster */}
          <div className="p-6 rounded-2xl bg-surface border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
                <Users className="text-purple-500 w-5 h-5" />
                <span>Contender Roster</span>
              </h4>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 font-bold tracking-wider uppercase">Active</span>
            </div>
            <p className="text-sm text-ink-4">
              Pioneers collaborating across campus hubs and international dev relays.
            </p>
            
            <div className="flex items-center -space-x-3 overflow-hidden py-1">
              <div className="w-10 h-10 rounded-full border-2 border-surface bg-gradient-to-br from-accent to-blue-500" />
              <div className="w-10 h-10 rounded-full border-2 border-surface bg-gradient-to-br from-purple-500 to-pink-500" />
              <div className="w-10 h-10 rounded-full border-2 border-surface bg-gradient-to-br from-amber-500 to-red-500" />
              <div className="w-10 h-10 rounded-full border-2 border-surface bg-ink/10 flex items-center justify-center font-mono text-[10px] text-ink font-bold backdrop-blur-sm">
                +42
              </div>
            </div>
            
            <div className="space-y-2 pt-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded-lg bg-ink/5 border border-ink/5">
                <span className="text-ink font-bold font-mono text-xs">campus-lead.bcl</span>
                <span className="font-mono text-[10px] text-accent-fg font-bold uppercase">Verified 3m ago</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-ink/5 border border-ink/5">
                <span className="text-ink font-bold font-mono text-xs">arch-solvers.bcl</span>
                <span className="font-mono text-[10px] text-ink-4 font-bold uppercase">Verified 14m ago</span>
              </div>
            </div>
          </div>

          {/* Eligibility & Criteria Protocol */}
          <div className="p-6 rounded-2xl bg-surface border border-ink/5 shadow-sm space-y-4">
            <h4 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
              <Gavel className="text-amber-500 w-5 h-5" />
              <span>Rules & Audit Guidelines</span>
            </h4>
            <ul className="space-y-3 text-sm text-ink-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-accent-fg w-4 h-4 mt-0.5 shrink-0" />
                <span>Submissions must link to accessible, open-source repositories or valid on-chain transaction hashes.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-accent-fg w-4 h-4 mt-0.5 shrink-0" />
                <span>Plagiarism or submitting unmodified template code will result in immediate rejection by the oracle.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-accent-fg w-4 h-4 mt-0.5 shrink-0" />
                <span>Ensure your connected wallet matches your established student BCL passport identity.</span>
              </li>
            </ul>
          </div>

          {/* Support & Office Hours Card */}
          <div className="p-6 rounded-2xl bg-surface border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
                <Headset className="text-blue-500 w-5 h-5" />
                <span>Live Support Desk</span>
              </h4>
              <span className="font-mono text-[10px] text-blue-500 font-bold uppercase tracking-wider">Discord Relay</span>
            </div>
            <p className="text-sm text-ink-4">
              Stuck on bundler errors or require a manual review? Join the dedicated quest war room or schedule an audit slot.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="flex-1 px-4 py-2.5 rounded-xl bg-ink/5 text-ink text-xs font-bold hover:bg-ink/10 transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> #quest-support
              </button>
              <button className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Office Hours
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}