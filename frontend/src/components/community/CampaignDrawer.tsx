"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Loader2, Award, Zap } from "lucide-react";
import { api, Task } from "@/lib/api";
import { QuestImage } from "@/components/quest/QuestImage";
import { coverForCategory } from "@/lib/quests";
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
    const isInstant = task.verification_type === "instant" || (task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus"));
    if (!isInstant && task.verification_type !== "nft_ownership" && !evidence.trim()) return;

    try {
      setIsVerifying(true);
      setResult(null);

      let payload: Record<string, unknown> = isInstant
        ? { claim_type: "instant_bonus" }
        : { text: evidence.trim(), url: evidence.trim() };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-ink/[0.12] bg-surface p-6 space-y-6 shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto">
        <QuestImage src={task.image_url || coverForCategory(task.category)} alt={task.title} heightClass="h-32" className="rounded-xl" />
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand/15 border border-brand/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand">
                COMMUNITY SPRINT
              </span>
              <span className="text-[10px] font-semibold text-ink-4 uppercase tracking-wider">
                {task.verification_type === "onchain_tx" ? "Project" : task.verification_type === "nft_ownership" ? "Badge" : "Workshop"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-ink tracking-tight">{task.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-ink-3 hover:text-ink hover:bg-ink/[0.06] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Campaign Description & Rewards Pill */}
        <div className="space-y-3">
          <p className="text-xs text-ink-2 leading-relaxed font-sans">{task.description}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Award className="h-3.5 w-3.5" />
              <span className="num-mono font-bold">+{task.points}</span> Club Points
            </span>
            <span className="flex items-center gap-1 rounded-md bg-brand/10 border border-brand/25 px-2.5 py-1 text-xs font-semibold text-brand">
              <Zap className="h-3.5 w-3.5" />
              Milestone Badge
            </span>
            <span className="rounded-md bg-ink/[0.04] border border-ink/[0.08] px-2 py-1 text-xs font-medium text-ink-3">
              Free to Claim
            </span>
          </div>
        </div>

        {/* Task Checklist */}
        <div className="border border-ink/[0.08] bg-page rounded-xl p-4 space-y-3 text-xs">
          <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
            Task Requirement
          </div>

          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-brand/10 border border-brand/30 text-brand flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
              1
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-ink font-semibold">
                {task.verification_type === "instant" || (task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus"))
                  ? "Instant Bonus Reward"
                  : task.verification_type === "onchain_tx"
                  ? "Submit On-Chain Transaction Hash"
                  : task.verification_type === "nft_ownership"
                  ? "Hold Required Club Badge or Pass"
                  : task.verification_type === "social_api"
                  ? "Submit X Proof (Screenshot or Quote Tweet Link)"
                  : "Submit Proof of Contribution Link"}
              </div>
              <p className="text-[11px] text-ink-3 font-sans">
                {task.verification_type === "instant" || (task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus"))
                  ? "No proof required. Claim + points instantly to your passport."
                  : task.verification_type === "onchain_tx"
                  ? "Enter the transaction hash of your activity on Botchain."
                  : task.verification_type === "social_api"
                  ? "Enter quote tweet link, post URL, or image proof."
                  : "We'll verify your submission for credential issuance."}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {walletAddress ? (
          <form onSubmit={handleVerify} className="space-y-3 text-xs">
            {task.verification_type === "instant" || (task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus")) ? (
              <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-300">
                ⚡ Instant Claim: Click below to receive +{task.points} XP directly.
              </div>
            ) : task.verification_type !== "nft_ownership" ? (
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-semibold mb-1">
                  {task.verification_type === "onchain_tx"
                    ? "Transaction Hash"
                    : task.verification_type === "social_api"
                    ? "Proof: Image URL or Quote Tweet Link"
                    : "Proof URL / Reference"}
                </label>
                <input
                  type="text"
                  required
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder={
                    task.verification_type === "onchain_tx"
                      ? "0x7a8b...12cd"
                      : task.verification_type === "social_api"
                      ? "https://x.com/... or image link"
                      : "https://github.com/..."
                  }
                  className="w-full bg-page border border-ink/[0.1] rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-5 focus:outline-none focus:border-brand font-mono"
                />
              </div>
            ) : (
              <div className="border border-purple-500/20 bg-purple-500/10 rounded-xl p-3 text-xs text-purple-700 dark:text-purple-300">
                Connected wallet: <span className="font-mono text-ink">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span> will be checked for holding the required badge on Botchain.
              </div>
            )}

            <button
              type="submit"
              disabled={
                isVerifying ||
                (task.verification_type !== "nft_ownership" &&
                  task.verification_type !== "instant" &&
                  !((task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus"))) &&
                  !evidence.trim())
              }
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand hover:bg-brand-hi py-2.5 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-lg shadow-brand/20"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>
                {task.verification_type === "instant" || (task.verification_type === "manual" && (task.title || "").toLowerCase().includes("welcome bonus"))
                  ? `CLAIM INSTANT BONUS (+${task.points} PTS)`
                  : task.verification_type === "nft_ownership"
                  ? "VERIFY WALLET BADGE"
                  : "VERIFY & CLAIM REWARD"}
              </span>
            </button>
          </form>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full rounded-lg bg-brand hover:bg-brand-hi py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            CONNECT WALLET TO PARTICIPATE
          </button>
        )}

        {/* Result Message */}
        {result && (
          <div
            className={`rounded-lg p-3 text-xs border ${
              result.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
