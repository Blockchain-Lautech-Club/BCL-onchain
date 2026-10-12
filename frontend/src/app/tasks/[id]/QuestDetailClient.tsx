"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Task, TaskSubmission } from "@/lib/api";
import {
  CheckCircle2, Loader2, ArrowLeft, Zap, Shield, ExternalLink,
  Lock, Clock, Users, Award, ChevronRight, Copy, AlertCircle,
  Terminal, Flame, Folder, PlayCircle, Gavel, Headset, MessageSquare, Calendar,
  Upload, Image as ImageIcon, X, Link2
} from "lucide-react";
import toast from "react-hot-toast";
import { QuestImage } from "@/components/quest/QuestImage";
import { coverForCategory } from "@/lib/quests";
import { getExplorerUrl } from "@/lib/contracts";
import { LinkifiedText } from "@/components/common/LinkifiedText";

const processProofImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload a valid image file (PNG, JPG, WebP)"));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Image size should be smaller than 12MB"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to parse image file"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

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
  const [imageProof, setImageProof] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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
        if (userSub) {
          setSubmission(userSub);
        } else if (taskData.my_state && taskData.my_state !== "not_started" && taskData.my_state !== "expired") {
          setSubmission({
            id: 0,
            task_id: numId,
            wallet: walletAddress || "",
            status: taskData.my_state as "submitted" | "under_review" | "verified" | "rejected",
            evidence: {},
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestData();
  }, [id, walletAddress]);

  const isInstantClaim = Boolean(
    task &&
      (task.verification_type === "instant" ||
        (task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus")))
  );
  const isSocialQuest = Boolean(
    task &&
      (task.verification_type === "social_api" ||
        /twitter|x\.com|follow|retweet|repost|like|xspace|space/i.test(`${task.title} ${task.description}`))
  );
  const isOnchainQuest = task?.verification_type === "onchain_tx";
  const isNftQuest = task?.verification_type === "nft_ownership";

  const socialLinkMatch = (task?.description || "").match(/https?:\/\/(x\.com|twitter\.com)\/[^\s)>]+/i);
  const socialLink = socialLinkMatch ? socialLinkMatch[0] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) { 
      await connectWallet(); 
      return; 
    }
    if (!task) return;
    if (!isInstantClaim && !isNftQuest && !evidenceInput.trim() && !imageProof) {
      toast.error(isSocialQuest ? "Please upload a screenshot or provide a quote/post link" : "Please provide valid proof or reference");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = isInstantClaim
        ? { claim_type: "instant_bonus" }
        : isNftQuest
        ? { claim_type: "nft_ownership", wallet: walletAddress }
        : {
            url: evidenceInput.trim() || undefined,
            image: imageProof || undefined,
            evidence: evidenceInput.trim() || (imageProof ? "Screenshot uploaded" : "Proof submitted"),
            verification_type: task.verification_type,
          };

      const res = await api.submitTask(task.id, payload);
      if (res.status === "verified") {
        toast.success(`Success! +${task.points} XP claimed instantly.`);
      } else {
        toast.success("Proof submitted successfully! Review initialized...");
      }
      setSubmission(res || {
        id: Math.random(),
        task_id: task.id,
        user_id: 0,
        wallet: walletAddress,
        evidence: payload,
        status: isInstantClaim ? "verified" : "submitted",
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
            <div className="text-sm md:text-base text-ink-4 max-w-2xl leading-relaxed">
              <LinkifiedText text={task.description} />
            </div>
            
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
                  <Lock className="text-accent-fg w-4 h-4" /> Submission Limit
                </span>
                <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">1 Per Builder</span>
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
                {hasSubmitted ? "STATUS" : "ACTIVE CHECKPOINT"}
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
                  <h3 className="text-xl font-heading font-bold text-ink">Protocol Proof of Work</h3>
                </div>
                <span className="font-mono text-sm text-amber-500 font-bold">+{task.points?.toLocaleString()} XP</span>
              </div>
              
              <p className="text-sm text-ink-4 leading-relaxed">
                {isVerified 
                  ? "Your submission has been successfully processed and recorded on-chain by the oracle consensus."
                  : isPending
                  ? "Your proof has been submitted and is currently in the verification pipeline. Each quest can only be submitted once."
                  : isRejected
                  ? "Your submission for this quest has concluded. Submissions cannot be made more than once."
                  : "Deliver the production interface deployment, transaction hash, or repository link required to satisfy this quest's parameters."}
              </p>

              {isVerified ? (
                <div className="mt-4 pt-4 border-t border-ink/5 space-y-3">
                  <div className="flex items-center gap-2 text-accent-fg font-heading font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Consensus Achieved • Quest Completed</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-ink-4 font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-accent-fg" /> Verified & Logged
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
              ) : isPending ? (
                <div className="mt-4 pt-4 border-t border-ink/5 space-y-3">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 space-y-2">
                    <div className="flex items-center gap-2 font-heading font-bold text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submission Awaiting Review</span>
                    </div>
                    <p className="text-xs text-ink-3">
                      You have already submitted proof for this quest. Quests are limited to one submission per builder. Your submission is in the review queue.
                    </p>
                    {submission?.evidence && (
                      <div className="pt-2 space-y-2 border-t border-amber-500/10">
                        {Boolean((submission.evidence as Record<string, unknown>).image) && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase text-ink-4 font-bold block">Attached Screenshot:</span>
                            <img
                              src={(submission.evidence as Record<string, unknown>).image as string}
                              alt="Submitted proof screenshot"
                              className="max-h-48 max-w-full rounded-xl border border-ink/10 object-contain bg-black/5"
                            />
                          </div>
                        )}
                        {Boolean((submission.evidence as Record<string, unknown>).url) && (
                          <div className="font-mono text-[11px] text-ink-3 truncate">
                            <span className="text-ink-4 uppercase text-[10px] font-bold mr-1">Link:</span>
                            <a
                              href={(submission.evidence as Record<string, unknown>).url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-fg hover:underline font-semibold"
                            >
                              {(submission.evidence as Record<string, unknown>).url as string}
                            </a>
                          </div>
                        )}
                        {!((submission.evidence as Record<string, unknown>).image || (submission.evidence as Record<string, unknown>).url) && (
                          <div className="pt-1 font-mono text-[11px] text-ink-4 truncate">
                            Evidence: <span className="text-ink font-semibold">{String(submission.evidence.text || submission.evidence.evidence || JSON.stringify(submission.evidence))}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : isRejected ? (
                <div className="mt-4 pt-4 border-t border-ink/5 space-y-3">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 space-y-2">
                    <div className="flex items-center gap-2 font-heading font-bold text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Submission Concluded • Verification Not Approved</span>
                    </div>
                    <p className="text-xs text-ink-3">
                      {submission?.reason || "This submission did not satisfy the verification guidelines."}
                    </p>
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-4">
                      Each quest can only be submitted once.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  {isInstantClaim ? (
                    <div className="space-y-4">
                      <div className="p-4 sm:p-5 rounded-2xl bg-accent/10 border border-accent/20 space-y-2">
                        <div className="flex items-center gap-2 text-accent-fg font-heading font-bold text-sm">
                          <Zap className="w-4 h-4" />
                          <span>Instant Bonus Claim</span>
                        </div>
                        <p className="text-xs text-ink-3 leading-relaxed">
                          This is an instant bonus quest! No GitHub PR or external proof is required. Click below to claim +{task.points?.toLocaleString()} XP immediately into your citizen profile.
                        </p>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-ink/5">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-accent text-surface font-heading font-bold text-sm hover:shadow-[0_0_25px_rgba(0,245,160,0.35)] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          <span>Claim Instant Bonus (+{task.points?.toLocaleString()} XP)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isSocialQuest && socialLink && (
                        <div className="p-3.5 rounded-xl bg-ink/[0.03] border border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] text-accent-fg font-bold uppercase tracking-wider block">Step 1: Complete Action on X</span>
                            <span className="text-xs text-ink font-semibold">Join Space, Follow, Like, Quote, or Retweet on X</span>
                          </div>
                          <a
                            href={socialLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-surface text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
                          >
                            <span>Open on X (Twitter)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Social Image Proof Upload Zone */}
                      {isSocialQuest && (
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-ink uppercase font-bold tracking-wider">
                            Upload Proof Screenshot (Follow, Space Attendance, or Like / Repost)
                          </label>
                          {imageProof ? (
                            <div className="relative p-3 rounded-2xl bg-ink/[0.03] border border-ink/10 flex flex-col sm:flex-row items-center gap-3">
                              <img
                                src={imageProof}
                                alt="Proof preview"
                                className="h-28 w-auto rounded-xl object-contain border border-ink/10 bg-black/5"
                              />
                              <div className="flex-1 space-y-1 text-center sm:text-left">
                                <span className="text-xs font-bold text-ink flex items-center justify-center sm:justify-start gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-accent-fg" /> Screenshot Attached
                                </span>
                                <span className="text-[11px] text-ink-4 block">Ready for administrator review</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setImageProof(null)}
                                className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition flex items-center gap-1 shrink-0"
                              >
                                <X className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-ink/15 hover:border-accent/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-ink/[0.01] hover:bg-ink/[0.03]">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                className="hidden"
                                disabled={isProcessingImage}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsProcessingImage(true);
                                  try {
                                    const dataUrl = await processProofImage(file);
                                    setImageProof(dataUrl);
                                    toast.success("Screenshot attached successfully!");
                                  } catch (err: unknown) {
                                    toast.error(err instanceof Error ? err.message : "Failed to process image");
                                  } finally {
                                    setIsProcessingImage(false);
                                  }
                                }}
                              />
                              <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-ink-3">
                                {isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                              </div>
                              <div className="text-center">
                                <span className="text-xs font-bold text-ink block">Click or drag screenshot to upload</span>
                                <span className="text-[10px] text-ink-4 font-mono">PNG, JPG, WebP up to 10MB</span>
                              </div>
                            </label>
                          )}
                        </div>
                      )}

                      {/* Link / Text Proof Input */}
                      <div className="space-y-2">
                        <label className="block font-mono text-[10px] text-ink uppercase font-bold tracking-wider" htmlFor="proof-url">
                          {isSocialQuest
                            ? "Quote Tweet / Post Link or X @Handle (Optional if screenshot attached)"
                            : isOnchainQuest
                            ? "Bohr Testnet / Mainnet Transaction Hash"
                            : isNftQuest
                            ? "Connected Wallet Verification"
                            : "Hosted Application, Tx Hash, or Repository URL"}
                        </label>
                        <div className="relative flex items-center">
                          <PlayCircle className="absolute left-4 w-5 h-5 text-ink-4" />
                          <input 
                            id="proof-url"
                            value={evidenceInput}
                            onChange={(e) => setEvidenceInput(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-ink/5 text-ink font-mono text-sm placeholder:text-ink-4/50 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                            placeholder={
                              isSocialQuest
                                ? "https://x.com/username/status/... or @your_x_handle"
                                : isOnchainQuest
                                ? "0x..."
                                : isNftQuest
                                ? walletAddress || "Connect wallet to verify"
                                : "https://github.com/... or 0x..."
                            }
                            required={!isNftQuest && !isSocialQuest}
                            disabled={isSubmitting || isNftQuest}
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-ink/5">
                        <span className="text-xs text-ink-4 font-medium">
                          {isSocialQuest ? "Submit screenshot and/or quote tweet link." : "One submission per builder. Please confirm details."}
                        </span>
                        <button 
                          type="submit"
                          disabled={isSubmitting || (!isNftQuest && !isSocialQuest && !evidenceInput.trim()) || (isSocialQuest && !evidenceInput.trim() && !imageProof)}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-accent text-surface font-bold text-sm hover:shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          <span>
                            {isSocialQuest
                              ? "Submit Proof for Review"
                              : isOnchainQuest
                              ? "Verify Tx Hash"
                              : isNftQuest
                              ? "Verify NFT Badge"
                              : "Verify Submission"}
                          </span>
                        </button>
                      </div>
                    </>
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

          {/* Protocol Specifications */}
          <div className="p-6 rounded-2xl bg-surface border border-ink/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
                <Terminal className="text-accent-fg w-5 h-5" />
                <span>Quest Specifications</span>
              </h4>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent-fg font-bold tracking-wider uppercase">Enforced</span>
            </div>
            
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-ink/5 border border-ink/5">
                <span className="text-ink-4 uppercase font-mono font-bold text-[10px]">Verification Model</span>
                <span className="text-ink font-bold font-mono uppercase">
                  {isInstantClaim
                    ? "Instant Claim (Bonus)"
                    : isSocialQuest
                    ? "Social (X / Space)"
                    : isOnchainQuest
                    ? "Onchain Tx"
                    : isNftQuest
                    ? "NFT Ownership"
                    : "GitHub / Manual Review"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-ink/5 border border-ink/5">
                <span className="text-ink-4 uppercase font-mono font-bold text-[10px]">Submission Policy</span>
                <span className="text-accent-fg font-bold font-mono">1 Submission Per Builder</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-ink/5 border border-ink/5">
                <span className="text-ink-4 uppercase font-mono font-bold text-[10px]">XP Reward</span>
                <span className="text-amber-500 font-bold font-mono">+{task.points?.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-ink/5 border border-ink/5">
                <span className="text-ink-4 uppercase font-mono font-bold text-[10px]">Replay Protection</span>
                <span className="text-purple-500 font-bold font-mono">Cryptographic Hash Check</span>
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