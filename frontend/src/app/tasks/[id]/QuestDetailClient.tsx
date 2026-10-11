"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Task } from "@/lib/api";
import {
  CheckCircle2, Loader2, ArrowLeft, Zap, Shield, ExternalLink,
  Lock, Clock, Users, Award, ChevronRight, Copy, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { QuestImage } from "@/components/quest/QuestImage";
import { coverForCategory } from "@/lib/quests";

// ─── Mock Quest Detail Data ───────────────────────────────────────────────────
const QUEST_DETAIL: Record<string, {
  title: string; track: string; difficulty: string; xp: number; timeLeft: string;
  desc: string; authority: string; authorityRole: string; authorityTags: string[];
  rules: string[]; liveSupport: string;
  contenders: number; rewardNFT: string; stage: { current: number; total: number };
  checkpoints: {
    id: string; title: string; xp: number; status: "verified" | "active" | "locked";
    desc: string; verificationNote: string; address?: string; repo?: string; ciResult?: string;
    inputs?: { label: string; placeholder: string; type?: string }[];
  }[];
}> = {
  "m4": {
    title: "Confluence Hackathon 2025: Protocol Prototype",
    track: "Developer Guild · Hackathon Major Event",
    difficulty: "Intermediate", xp: 1000, timeLeft: "12d 8h remaining",
    desc: "Engineer, architect, and deploy an account-abstracted decentralized application using the BCL framework on Base Sepolia. Complete verification checkpoints to seal your entry.",
    authority: "BCL Hackathon Council", authorityRole: "Official Council",
    authorityTags: ["#BaseSepolia", "#ERC4337", "#PaymasterReady"],
    rules: [
      "Smart contracts must be fully open-source with MIT or Apache-2.0 licenses.",
      "All gas sponsorship logic must implement anti-drain protection guards.",
      "Anti-Sybil gating: Every team member requires verified BCL Student Pass.",
    ],
    liveSupport: "Discord Relay",
    contenders: 240, rewardNFT: "Contender SBT Genesis",
    stage: { current: 4, total: 5 },
    checkpoints: [
      {
        id: "cp1", title: "Fork the BCL Scaffold Repo on GitHub", xp: 150, status: "verified",
        desc: "Initialize an open fork under your authorized student team handle.",
        verificationNote: "Verified via GitHub OAuth",
        repo: "philip-arch/bcl-account-scaffold",
      },
      {
        id: "cp2", title: "Deploy ERC-4337 Account Factory to Base Sepolia", xp: 350, status: "verified",
        desc: "Instantiate the verified Account Factory on-chain and register the initialization salt.",
        verificationNote: "Verified via RPC Scanner", address: "0x72a9...d4b1",
      },
      {
        id: "cp3", title: "Automated userOp Bundler Suite (>90% Coverage)", xp: 200, status: "verified",
        desc: "Execute gas simulation vectors and bundler batching stress tests via Foundry.",
        verificationNote: "Automated CI runner confirmed", ciResult: "94.2% Passed",
      },
      {
        id: "cp4", title: "Submit Live Demo URL & Project Pitch Deck", xp: 200, status: "active",
        desc: "Deliver the production interface deployment (Vercel/IPFS) and an asynchronous Loom walkthrough explaining your paymaster logic and key architecture decisions.",
        verificationNote: "Oracle scanner validates repo commits within <15 seconds.",
        inputs: [
          { label: "Hosted Application URL (Vercel, Fleek, or IPFS)", placeholder: "https://confluence-bcl-demo.vercel.app", type: "url" },
          { label: "Loom Walkthrough or Pitch Deck URL", placeholder: "https://loom.com/share/9b18c0...", type: "url" },
        ],
      },
      {
        id: "cp5", title: "Community Peer Review & Mentor Feedback Session", xp: 100, status: "locked",
        desc: "Participate in the assigned discord review room with a designated council auditor.",
        verificationNote: "Unlocks automatically upon successful submission of Task 4.",
      },
    ],
  },
  "default": {
    title: "Build Your First DApp", track: "Developer · Lvl 2 Track",
    difficulty: "Intermediate", xp: 750, timeLeft: "6d left",
    desc: "Deploy a verified token contract on Sepolia testnet and hook it up to a live React/Vite frontend with Wagmi wallet connection and live event listening.",
    authority: "BCL Developer Guild", authorityRole: "Verified Guild",
    authorityTags: ["#Sepolia", "#ERC20", "#Wagmi"],
    rules: [
      "Contract must be open-source and verified on Sepolia Etherscan.",
      "Frontend must include a live balance display and transfer UI.",
      "Submit only from your registered BCL wallet address.",
    ],
    liveSupport: "Discord",
    contenders: 380, rewardNFT: "Web3 Builder NFT",
    stage: { current: 1, total: 3 },
    checkpoints: [
      {
        id: "cp1", title: "Deploy ERC-20 Token to Sepolia", xp: 300, status: "active",
        desc: "Write, test and deploy an ERC-20 contract. Verify it on Sepolia Etherscan.",
        verificationNote: "Verified via RPC contract-code scanner.",
        inputs: [{ label: "Deployed Contract Address (Sepolia)", placeholder: "0xAbCd…", type: "text" }],
      },
      {
        id: "cp2", title: "Build & Deploy Frontend", xp: 300, status: "locked",
        desc: "Connect your contract to a React/Vite app using Wagmi. Deploy to Vercel or IPFS.",
        verificationNote: "Verified via live URL scan.",
        inputs: [{ label: "Live App URL", placeholder: "https://my-dapp.vercel.app", type: "url" }],
      },
      {
        id: "cp3", title: "Submit Demo Video", xp: 150, status: "locked",
        desc: "Record a 2-minute Loom showing wallet connect, token transfer, and live balance update.",
        verificationNote: "Reviewed within 24 hours.",
        inputs: [{ label: "Loom URL", placeholder: "https://loom.com/share/…", type: "url" }],
      },
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function QuestDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { walletAddress, connectWallet } = useAuth();
  const id = typeof params?.id === "string" ? params.id : "default";

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const quest = QUEST_DETAIL[id] ?? QUEST_DETAIL["default"];

  useEffect(() => {
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      api.getTask(numId).then(setTask).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const completedCheckpoints = quest.checkpoints.filter((c) => c.status === "verified").length;
  const totalCheckpoints = quest.checkpoints.length;
  const progressPct = Math.round((completedCheckpoints / totalCheckpoints) * 100);
  const allDone = completedCheckpoints === totalCheckpoints;

  const handleSubmit = async (cpId: string) => {
    if (!walletAddress) { await connectWallet(); return; }
    const cp = quest.checkpoints.find((c) => c.id === cpId);
    if (!cp) return;
    setSubmitting(cpId);
    try {
      const evidence: Record<string, unknown> = { checkpoint: cpId };
      (cp.inputs ?? []).forEach((inp) => {
        evidence[inp.label] = inputs[`${cpId}__${inp.label}`] || "";
      });
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await api.submitTask(numId, evidence);
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
      setSubmitted((prev) => new Set([...prev, cpId]));
      toast.success("Submission sent! Oracle scanning…");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-5">
        <button onClick={() => router.push("/tasks")} className="hover:text-ink transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Quests
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink-4">Quest Details</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quest Header */}
          <div className="rounded-2xl bg-surface border border-white/8 overflow-hidden">
            <QuestImage
              src={task?.image_url || (id === "m4" ? "/quests/confluence-hackathon.svg" : coverForCategory(task?.category ?? "developer"))}
              alt={quest.title}
              heightClass="h-44"
            />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-300 font-semibold">Developer Guild</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">Hackathon Major Event</span>
                <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                  <Clock className="w-3 h-3" /> {quest.timeLeft}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold font-heading text-ink">{quest.title}</h1>
                <p className="text-sm text-ink-4 mt-2">{quest.desc}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-5">Checkpoint Synchronization</span>
                  <span className="text-accent-fg font-semibold">{completedCheckpoints} of {totalCheckpoints} Tasks Completed ({progressPct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Protocol */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold font-heading text-ink flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-fg" /> Verification Protocol
              </h2>
              <span className="text-[10px] text-ink-5 font-mono">All tasks require cryptographic proof</span>
            </div>

            {quest.checkpoints.map((cp, idx) => {
              const isSubmitted = submitted.has(cp.id);
              const effectiveStatus = isSubmitted ? "verified" : cp.status;

              return (
                <div
                  key={cp.id}
                  className={`rounded-2xl border p-5 space-y-3 transition-all ${
                    effectiveStatus === "verified"
                      ? "bg-surface border-green-500/20"
                      : effectiveStatus === "active"
                      ? "bg-surface border-accent/30 ring-1 ring-accent/20"
                      : "bg-surface/60 border-white/6 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        effectiveStatus === "verified" ? "bg-green-500/20" : effectiveStatus === "active" ? "bg-accent/20" : "bg-white/8"
                      }`}>
                        {effectiveStatus === "verified" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : effectiveStatus === "locked" ? (
                          <Lock className="w-3.5 h-3.5 text-ink-5" />
                        ) : (
                          <span className="text-[10px] font-bold text-accent-fg">{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${effectiveStatus === "active" ? "text-accent-fg" : "text-ink"}`}>
                            {cp.title}
                          </span>
                          {effectiveStatus === "active" && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-[10px] text-accent-fg font-semibold">● ACTIVE CHECKPOINT</span>
                          )}
                        </div>
                        <p className="text-xs text-ink-4 mt-1">{cp.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                        <Zap className="w-3 h-3" />+{cp.xp} XP
                      </span>
                      {effectiveStatus === "verified" && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-[10px] text-green-400 font-semibold">Validated</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-ink-5">
                    <Shield className="w-3 h-3 shrink-0" />
                    <span>{cp.verificationNote}</span>
                    {cp.address && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(cp.address!); toast.success("Copied"); }}
                        className="flex items-center gap-1 text-accent-fg hover:underline ml-1"
                      >
                        {cp.address} <Copy className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {cp.repo && (
                      <a href={`https://github.com/${cp.repo}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-accent-fg hover:underline">
                        repo: {cp.repo} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {cp.ciResult && (
                      <span className="text-green-400 font-semibold">· {cp.ciResult}</span>
                    )}
                  </div>

                  {effectiveStatus === "active" && cp.inputs && (
                    <div className="space-y-3 pt-1">
                      {cp.inputs.map((inp) => (
                        <div key={inp.label} className="space-y-1">
                          <label className="text-[10px] text-ink-5 uppercase tracking-wider">{inp.label}</label>
                          <input
                            type={inp.type ?? "text"}
                            value={inputs[`${cp.id}__${inp.label}`] ?? ""}
                            onChange={(e) => setInputs((prev) => ({ ...prev, [`${cp.id}__${inp.label}`]: e.target.value }))}
                            placeholder={inp.placeholder}
                            className="w-full rounded-xl bg-subtle border border-white/10 px-3 py-2.5 text-sm text-ink placeholder:text-ink-5/50 focus:outline-none focus:border-accent/50 font-mono"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => handleSubmit(cp.id)}
                        disabled={!!submitting || isSubmitted}
                        className="btn-primary flex items-center gap-2 disabled:opacity-60"
                      >
                        {submitting === cp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {submitting === cp.id ? "Verifying…" : isSubmitted ? "Submitted" : "Verify Submission"}
                      </button>
                    </div>
                  )}

                  {effectiveStatus === "locked" && (
                    <div className="flex items-center gap-2 text-xs text-ink-5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {cp.verificationNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final Audit CTA */}
          <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${
            allDone ? "bg-accent/10 border-accent/30" : "bg-surface/60 border-white/6 opacity-60"
          }`}>
            <div>
              <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">
                Terminal Action · Stage {quest.stage.current} / {quest.stage.total}
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-accent-fg" />
                <span className="font-bold text-ink">{quest.rewardNFT}</span>
              </div>
              <p className="text-xs text-ink-4 mt-0.5">Mintable directly to your verified smart wallet upon final review pass.</p>
            </div>
            <button
              disabled={!allDone}
              className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allDone
                ? <><Zap className="w-4 h-4" /> Submit for Final Audit</>
                : <><Lock className="w-4 h-4" /> Submit Quest for Final Audit</>
              }
            </button>
          </div>
          {!allDone && (
            <p className="text-center text-[11px] text-ink-5">
              Unlocked when all {totalCheckpoints} checkpoints register valid state.
            </p>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface border border-white/8 p-5 space-y-3">
            <h3 className="font-bold font-heading text-ink text-sm flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-accent-fg" /> Reward Payload
            </h3>
            {[
              { label: "Experience", value: `+${quest.xp} XP`, color: "text-yellow-400" },
              { label: "Soulbound Credential", value: "Contender NFT", color: "text-purple-300" },
              { label: "Gas Subsidies", value: "BCL Sponsored", color: "text-accent-fg" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-ink-5 text-xs">{r.label}</span>
                <span className={`font-semibold text-xs ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-surface border border-white/8 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs text-ink-5 uppercase tracking-wider">Quest Authority</h3>
              <span className="badge-green text-[10px]">Official Council</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-ink text-sm">{quest.authority}</div>
                <div className="text-[10px] text-ink-5">In coalition with Base Ecosystem & Arbitrum Guilds</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quest.authorityTags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-ink-5">{t}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-white/8 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-heading text-ink text-sm flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Contender Roster
              </h3>
              <span className="badge-amber text-[10px]">{quest.contenders} Teams</span>
            </div>
            <p className="text-xs text-ink-4">Pioneers collaborating across campus hubs and international dev relays.</p>
            <div className="flex items-center gap-1.5">
              {["🟣", "🟢", "🔵", "🟡"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-xs border-2 border-surface">
                  {c}
                </div>
              ))}
              <span className="text-xs text-ink-5 ml-1">+{quest.contenders - 4}</span>
            </div>
            <div className="space-y-2 text-xs">
              {["team-lagos-zero", "arch-solvers"].map((team, i) => (
                <div key={team} className="flex items-center justify-between py-1.5 border-b border-white/6 last:border-0">
                  <span className="text-ink-4 font-mono">{team}</span>
                  <span className="text-accent-fg">Task {i + 3} Verified {i === 0 ? "3m" : "14m"} ago</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-white/8 p-5 space-y-3">
            <h3 className="font-bold font-heading text-ink text-sm flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Rules & Audit Guidelines
            </h3>
            <div className="space-y-2">
              {quest.rules.map((r) => (
                <div key={r} className="flex items-start gap-2 text-xs text-ink-4">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#0d1a0d] to-surface border border-green-500/15 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-heading text-ink text-sm">Live Support Desk</h3>
              <span className="badge-green text-[10px]">{quest.liveSupport}</span>
            </div>
            <p className="text-xs text-ink-4">Stuck on bundler errors? Join the dedicated hackathon warroom or schedule an audit slot.</p>
            <div className="flex gap-2">
              <button className="flex-1 btn-primary text-xs">#hackathon-support</button>
              <button className="flex-1 btn-outline text-xs">Office Hours (Today 18:00)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}