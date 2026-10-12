"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, Task, TaskSubmission, NFTMintRecord } from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";
import {
  Loader2, CheckCircle2, Award, Zap, Terminal, Shield, Lock,
  Clock, Play, ExternalLink, Filter, HelpCircle, Users,
  BookOpen, Code, Share, GraduationCap
} from "lucide-react";

export default function LearnPage() {
  const { walletAddress, user, stats, connectWallet } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [nfts, setNfts] = useState<NFTMintRecord[]>([]);
  const [activeTrack, setActiveTrack] = useState("All Tracks");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getTasks().catch(() => []),
      walletAddress ? api.getMySubmissions().catch(() => []) : Promise.resolve([]),
      walletAddress ? api.getMyNFTs().catch(() => []) : Promise.resolve([])
    ]).then(([fetchedTasks, fetchedSubs, fetchedNfts]) => {
      setTasks(fetchedTasks || []);
      setSubmissions(fetchedSubs || []);
      setNfts(fetchedNfts || []);
      setLoading(false);
    });
  }, [walletAddress]);

  // Derived Data & Filtering
  const tracks = ["All Tracks", ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean)))];
  const filteredTasks = tasks.filter(t => activeTrack === "All Tracks" || t.category === activeTrack);
  
  const completedSubs = submissions.filter(s => s.status === 'verified');
  const diplomas = nfts.filter(n => n.status === 'confirmed');
  const academicXp = stats?.total_points || user?.total_points || 0;

  const activeSub = submissions.find(s => s.status === 'submitted' || s.status === 'under_review');
  const featuredTask = activeSub 
    ? tasks.find(t => t.id === activeSub.task_id) 
    : (tasks.length > 0 ? tasks[0] : null);

  const getCategoryStyles = (cat?: string) => {
    switch(cat?.toLowerCase()) {
      case 'developer': return { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      case 'learning':  return { text: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  };
      case 'hackathon': return { text: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    };
      case 'community': return { text: 'text-accent-fg',  bg: 'bg-accent/10',     border: 'border-accent/20'     };
      case 'creator':   return { text: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   };
      default:          return { text: 'text-accent-fg',  bg: 'bg-accent/10',     border: 'border-accent/20'     };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-fg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-10 overflow-x-hidden">
      
      {/* 1. Hero Banner */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface border border-ink/5 p-4 sm:p-6 md:p-10 shadow-sm">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 border border-ink/5 text-accent-fg">
              <GraduationCap className="w-4 h-4" />
              <span className="font-mono text-[10px] font-bold tracking-wider uppercase">BCL Verified Curriculum</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-mono text-[10px] font-bold text-ink-4 uppercase">Cohort 2025</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-ink tracking-tight">BCL Learning Academy</h1>
            <p className="text-sm md:text-base text-ink-4 max-w-2xl leading-relaxed">
              Interactive Web3 curriculum built for campus minds. Master development, design, tokenomics, and security through hands-on quests.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start lg:self-end">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-gradient-to-br from-accent to-blue-500" />
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-gradient-to-br from-purple-500 to-pink-500" />
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-gradient-to-br from-amber-500 to-red-500" />
            </div>
            <span className="font-mono text-[10px] font-bold text-ink-4 uppercase tracking-wider">
              <strong className="text-ink">1,420+</strong> campus builders active
            </span>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-ink/5">
          <div className="bg-ink/[0.03] border border-ink/5 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-ink-4 mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Catalog</span>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-ink">{tasks.length}</span>
              <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">Modules Open</span>
            </div>
          </div>
          <div className="bg-ink/[0.03] border border-ink/5 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-accent-fg mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Finished</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-accent-fg">{completedSubs.length}</span>
              <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">Courses Cleared</span>
            </div>
          </div>
          <div className="bg-ink/[0.03] border border-ink/5 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Diplomas</span>
              <Award className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-amber-500">{diplomas.length}</span>
              <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">Soulbound SBTs</span>
            </div>
          </div>
          <div className="bg-ink/[0.03] border border-ink/5 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-purple-500 mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Earned</span>
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-purple-500">{academicXp.toLocaleString()}</span>
              <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">Academic XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Track Filters */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-accent-fg" />
            <h3 className="text-xl font-heading font-bold text-ink tracking-tight">Explore Learning Tracks</h3>
          </div>
          <span className="font-mono text-[10px] font-bold text-ink-4 uppercase tracking-wider hidden sm:block">Updated every Monday at 00:00 UTC</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tracks.map((track) => (
            <button
              key={track}
              onClick={() => setActiveTrack(track)}
              className={`shrink-0 px-4 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                activeTrack === track
                  ? "bg-accent/20 text-accent-fg border border-accent/30"
                  : "bg-surface border border-ink/5 text-ink-4 hover:text-ink hover:bg-ink/5"
              }`}
            >
              {track}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Featured / Active Course Banner */}
      {featuredTask && (
        <div className="relative w-full rounded-2xl bg-surface border border-ink/5 overflow-hidden shadow-sm mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/40 z-10" />
          <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-35 mix-blend-screen pointer-events-none">
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: `url('${featuredTask.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRadfkGy2ScXV6dNw8GyCo7N-elvRynYFskdcf99sUFCtBV8lqhOHpvGkVRLD9QlSD4r53S0SCjrZgOOJgdi_Ql1OuHObDQ_FIMRC677CZX8QIlga8J4C7xexGIdSctdVxjAaPj3E7rnm01bGpg3fq_t_hgHL65AGlcl15LP_nt5KIpp6HT-pELQzWc0SHffL40s5cWJIkOgAy3rK70zcrJfJwn7FlW7Ie6zWCtdJNsBeriQy5VelX'}')` }} 
            />
          </div>
          <div className="relative z-20 p-6 md:p-10 flex flex-col justify-between min-h-[340px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Active Course
              </span>
              <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${getCategoryStyles(featuredTask.category).bg} ${getCategoryStyles(featuredTask.category).text} ${getCategoryStyles(featuredTask.category).border}`}>
                {featuredTask.category || "Ecosystem"} Guild
              </span>
              <span className="font-mono text-[10px] font-bold text-ink-4 uppercase tracking-wider">Intermediate • Interactive</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                +{featuredTask.points?.toLocaleString()} XP
              </span>
            </div>
            
            <div className="my-6 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight mb-3">
                {featuredTask.title}
              </h2>
              <p className="text-sm md:text-base text-ink-4 leading-relaxed">
                {featuredTask.description}
              </p>
            </div>
            
            <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-md p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-3xl">
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between text-ink">
                  <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">Module 1 of 1 in progress</span>
                  <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">0% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ink/5 overflow-hidden">
                  <div className="h-full rounded-full bg-accent shadow-[0_0_12px_rgba(0,245,160,0.5)] w-[10%]" />
                </div>
                <span className="text-xs font-semibold text-ink-4 block">Current milestone: Task Initialization</span>
              </div>
              <button 
                onClick={() => {
                  if (!walletAddress) connectWallet();
                  else window.location.href = `/tasks/${featuredTask.id}`;
                }}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-surface font-bold text-sm hover:shadow-[0_0_24px_rgba(0,245,160,0.4)] transition-all"
              >
                <Terminal className="w-4 h-4" />
                <span>Resume Sandbox</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Course Catalog Grid & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Left: Catalog */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-heading font-bold text-ink tracking-tight">Course Catalog</h3>
            <span className="font-mono text-[10px] font-bold text-ink-4 uppercase tracking-wider">Showing {filteredTasks.length} of {tasks.length} modules</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-ink/5 bg-surface p-16 text-center">
              <BookOpen className="w-10 h-10 text-ink-4 mx-auto mb-4" />
              <h4 className="text-xl font-heading font-bold text-ink">No tracks found</h4>
              <p className="text-sm text-ink-4 mt-1">Try selecting a different category or check back later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task, idx) => {
                const sub = submissions.find(s => s.task_id === task.id);
                const isCompleted = sub?.status === 'verified';
                const styles = getCategoryStyles(task.category);

                return (
                  <div key={task.id} className="group bg-surface border border-ink/5 hover:border-accent/20 rounded-2xl p-6 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${styles.bg} ${styles.text} ${styles.border}`}>
                            {task.category || 'General'}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-ink-4 uppercase tracking-wider">Self-Paced</span>
                          <span className="text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 rounded-full">+{task.points?.toLocaleString()} XP</span>
                        </div>
                        <h4 className="text-xl font-heading font-bold text-ink group-hover:text-accent-fg transition-colors">
                          {idx + 1}. {task.title}
                        </h4>
                      </div>
                      
                      {isCompleted ? (
                        <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-fg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Soulbound Issued</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            if (!walletAddress) connectWallet();
                            else window.location.href = `/tasks/${task.id}`;
                          }}
                          className="shrink-0 px-6 py-2.5 rounded-full bg-ink/5 text-ink hover:bg-ink hover:text-surface font-bold text-sm transition-all"
                        >
                          Start Track
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-ink-4 mb-4 leading-relaxed">
                      {task.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-ink/5">
                      {isCompleted ? (
                        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-fg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Grade: 100% (Verified)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-ink-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                          <Code className="w-3.5 h-3.5" />
                          <span>Interactive Sandbox Environment</span>
                        </div>
                      )}
                      
                      {isCompleted && sub?.tx_hash && (
                        <a 
                          href={getExplorerUrl(sub.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-full bg-ink/5 text-ink hover:bg-ink/10 font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" /> View Certificate Onchain
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Verified Credentials */}
          <div className="bg-surface border border-ink/5 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-accent/5 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-amber-500 mb-4">
              <Shield className="w-6 h-6" />
              <h4 className="text-lg font-heading font-bold text-ink">Verified Credentials</h4>
            </div>
            <p className="text-sm text-ink-4 mb-5 leading-relaxed">
              Every completed course issues a verifiable Soulbound Credential directly bound to your <span className="font-mono font-bold text-accent-fg">.bcl</span> handle, recognized by partner companies for internships and fellowships.
            </p>
            
            <div className="bg-ink/[0.02] border border-ink/5 rounded-xl p-4 space-y-3 mb-5">
              <div className="flex items-center justify-between text-ink">
                <span className="text-xs font-bold">Ecosystem Partners</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-fg bg-accent/10 px-2 py-0.5 rounded">12 Hiring</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface border border-ink/5 p-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4">Base LAU</div>
                <div className="bg-surface border border-ink/5 p-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4">Scroll Labs</div>
                <div className="bg-surface border border-ink/5 p-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4">Polygon</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-ink-4 font-mono text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-accent-fg" />
              <span>ERC-5192 Non-Transferable</span>
            </div>
          </div>

          {/* Active Diplomas */}
          <div className="bg-surface border border-ink/5 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-lg font-heading font-bold text-ink">My Active Diplomas</h4>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-fg bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">{diplomas.length} Claimed</span>
            </div>
            
            {diplomas.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink-4 bg-ink/[0.02] rounded-xl border border-ink/5">
                No diplomas earned yet. Complete courses to build your on-chain CV.
              </div>
            ) : (
              <div className="space-y-3">
                {diplomas.slice(0, 3).map(nft => (
                  <div key={nft.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5 hover:border-ink/10 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Award className="text-purple-500 w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-heading font-bold text-ink truncate">Token #{nft.token_id}</p>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4">{nft.milestone_type} Milestone • Verified</span>
                    </div>
                    <Share className="w-4 h-4 text-accent-fg opacity-50 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
            
            <button className="w-full mt-5 py-2.5 rounded-xl bg-ink/5 hover:bg-ink/10 text-ink font-bold text-xs text-center transition-colors">
              View All in Explorer
            </button>
          </div>

          {/* Office Hours */}
          <div className="bg-gradient-to-br from-purple-500/10 to-surface border border-purple-500/20 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="text-purple-500 w-6 h-6" />
              <h4 className="text-lg font-heading font-bold text-ink">Need Tutoring?</h4>
            </div>
            <p className="text-sm text-ink-4 mb-5 leading-relaxed">
              Get unblocked directly on Discord with peer office hours held Tuesday & Thursday at the campus lab.
            </p>
            <button className="w-full py-3 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 font-bold text-sm hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> Join Dev Office Hours
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bottom Callout */}
      <div className="w-full bg-surface border border-ink/5 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm mt-4">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-heading font-bold text-ink">Ready to teach or contribute a module?</h3>
          <p className="text-sm text-ink-4 max-w-xl">
            BCL curriculum is community-driven. Submit course PRs, earn reviewer grants in USDC, and establish campus technical leadership.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-ink/5 hover:bg-ink/10 text-ink font-bold text-sm transition-colors">
            Read Syllabus Specs
          </button>
          <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-accent text-surface font-bold text-sm hover:shadow-[0_0_20px_rgba(0,245,160,0.4)] transition-all">
            Submit Course Proposal
          </button>
        </div>
      </div>

    </div>
  );
}