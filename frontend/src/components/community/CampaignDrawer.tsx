"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Loader2, Award, Zap } from "lucide-react";
import { api, Task } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface CampaignDrawerProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CampaignDrawer({ task, onClose, onSuccess }: CampaignDrawerProps) {
  const { walletAddress, connectWallet } = useAuth();
  const [evidence, setEvidence] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!task) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (task.verification_type !== "nft_ownership" && !evidence.trim()) return;

    try {
      setIsVerifying(true);
      setResult(null);

      let payload: Record<string, unknown> = { text: evidence.trim() };
      if (task.verification_type === "onchain_tx") {
        payload = { tx_hash: evidence.trim() };
      } else if (task.verification_type === "nft_ownership") {
        payload = { check: true };
      }

      const res = await api.submitTask(task.id, payload);
      if (res.status === "verified") {
        const msg = `Reward Claimed! +${task.points} Points & Milestone Badge Unlocked.`;
        setResult({ success: true, message: msg });
        toast.success(msg);
        onSuccess();
      } else if (res.status === "under_review") {
        const msg = "Proof submitted. In review queue.";
        setResult({ success: true, message: msg });
        toast.success(msg);
        onSuccess();
      } else {
        const msg = res.reason || "Verification could not be confirmed.";
        setResult({ success: false, message: msg });
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setResult({
        success: false,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0c101a] p-6 space-y-6 shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#0052ff]/15 border border-[#0052ff]/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#0052ff]">
                COMMUNITY SPRINT
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                {task.verification_type === "onchain_tx" ? "Project" : task.verification_type === "nft_ownership" ? "Badge" : "Workshop"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{task.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Campaign Description & Rewards Pill */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{task.description}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <Award className="h-3.5 w-3.5" />
              <span className="num-mono font-bold">+{task.points}</span> Club Points
            </span>
            <span className="flex items-center gap-1 rounded-md bg-[#0052ff]/10 border border-[#0052ff]/25 px-2.5 py-1 text-xs font-semibold text-[#0052ff]">
              <Zap className="h-3.5 w-3.5" />
              Milestone Badge
            </span>
            <span className="rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-1 text-xs font-medium text-zinc-400">
              Free to Claim
            </span>
          </div>
        </div>

        {/* Task Checklist */}
        <div className="border border-white/[0.08] bg-[#080b12] rounded-xl p-4 space-y-3 text-xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Task Requirement
          </div>

          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-[#0052ff]/10 border border-[#0052ff]/30 text-[#0052ff] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
              1
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-white font-semibold">
                {task.verification_type === "onchain_tx"
                  ? "Submit On-Chain Transaction Hash"
                  : task.verification_type === "nft_ownership"
                  ? "Hold Required Club Badge or Pass"
                  : "Submit Proof of Attendance / Contribution Link"}
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                {task.verification_type === "onchain_tx"
                  ? "Enter the transaction hash of your activity on Botchain."
                  : "We'll verify your connected wallet automatically."}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {walletAddress ? (
          <form onSubmit={handleVerify} className="space-y-3 text-xs">
            {task.verification_type !== "nft_ownership" ? (
              <div>
                <label className="block text-[11px] text-zinc-400 uppercase font-semibold mb-1">
                  {task.verification_type === "onchain_tx" ? "Transaction Hash" : "Proof URL / Reference"}
                </label>
                <input
                  type="text"
                  required
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder={task.verification_type === "onchain_tx" ? "0x7a8b...12cd" : "https://github.com/..."}
                  className="w-full bg-[#080b12] border border-white/[0.1] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#0052ff] font-mono"
                />
              </div>
            ) : (
              <div className="border border-purple-500/20 bg-purple-500/10 rounded-xl p-3 text-xs text-purple-300">
                Connected wallet: <span className="font-mono text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span> will be checked for holding the required badge on Botchain.
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || (task.verification_type !== "nft_ownership" && !evidence.trim())}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0052ff] hover:bg-[#1a68ff] py-2.5 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-lg shadow-[#0052ff]/20"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>
                {task.verification_type === "nft_ownership"
                  ? "VERIFY WALLET BADGE"
                  : "VERIFY & CLAIM REWARD"}
              </span>
            </button>
          </form>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full rounded-lg bg-[#0052ff] hover:bg-[#1a68ff] py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            CONNECT WALLET TO PARTICIPATE
          </button>
        )}

        {/* Result Message */}
        {result && (
          <div
            className={`rounded-lg p-3 text-xs border ${
              result.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
