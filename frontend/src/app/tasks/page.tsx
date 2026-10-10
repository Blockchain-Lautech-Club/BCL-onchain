"use client";

import React, { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Shield,
  FileCheck,
} from "lucide-react";

export default function TasksPage() {
  const { walletAddress, connectWallet, refreshUserData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form
  const [evidenceInput, setEvidenceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const data = await api.getTasks();
        setTasks(data || []);
        if (data && data.length > 0) {
          setSelectedTask(data[0]);
        } else {
          setSelectedTask(null);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setTasks([]);
        setSelectedTask(null);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !evidenceInput.trim()) return;

    try {
      setIsSubmitting(true);
      setSubmitResult(null);

      let evidenceObj: Record<string, unknown> = { text: evidenceInput.trim() };
      if (selectedTask.verification_type === "onchain_tx") {
        evidenceObj = { tx_hash: evidenceInput.trim() };
      }

      const res = await api.submitTask(selectedTask.id, evidenceObj);
      if (res.status === "verified") {
        const msg = "Task verified! Points credited to your profile.";
        setSubmitResult({ success: true, message: msg });
        toast.success(msg);
      } else if (res.status === "under_review") {
        const msg = "Submitted! In review queue.";
        setSubmitResult({ success: true, message: msg });
        toast.success(msg);
      } else {
        const msg = res.reason || "Rejected.";
        setSubmitResult({ success: false, message: msg });
        toast.error(msg);
      }

      await refreshUserData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setSubmitResult({
        success: false,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = tasks.filter((t) => filterType === "all" || t.verification_type === filterType);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tasks &amp; Quests</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">Active Club Quests</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#10141c] border border-white/[0.08] p-1 rounded-xl text-xs">
          {[
            { id: "all", label: "All" },
            { id: "onchain_tx", label: "Project Builds" },
            { id: "nft_ownership", label: "Badges" },
            { id: "manual", label: "Workshops" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === tab.id
                  ? "bg-white/[0.1] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Task Ledger & Submission Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          {loading ? (
            <div className="surface-card rounded-2xl p-12 text-center text-zinc-500 text-xs">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <span>Fetching quests...</span>
            </div>
          ) : (
            filtered.map((t) => {
              const isSelected = selectedTask?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTask(t);
                    setSubmitResult(null);
                    setEvidenceInput("");
                  }}
                  className={`surface-card surface-hover rounded-xl p-4 cursor-pointer transition flex items-center justify-between gap-4 ${
                    isSelected ? "border-emerald-500/50 bg-[#141a24]" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                        {t.verification_type === "onchain_tx" ? "Project" : t.verification_type === "nft_ownership" ? "Badge" : "Workshop"}
                      </span>
                      {t.repeatable && (
                        <span className="text-[10px] font-semibold text-zinc-400 tracking-wider">REPEATABLE</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{t.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-emerald-400 num-mono">
                      +{t.points} PTS
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500">Select</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Inspector (5 cols) */}
        <div className="lg:col-span-5">
          <div className="surface-card rounded-2xl p-5 space-y-5 sticky top-20">
            {selectedTask ? (
              <>
                <div className="border-b border-white/[0.06] pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Quest Details</span>
                    <span className="text-xs font-bold text-emerald-400 num-mono">
                      +{selectedTask.points} PTS
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-heading text-white">{selectedTask.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{selectedTask.description}</p>
                </div>

                {/* Criteria */}
                <div className="border border-white/[0.06] bg-[#0c0e14] rounded-xl p-3.5 text-xs text-zinc-400 space-y-1">
                  <div className="text-zinc-200 font-semibold text-[11px] uppercase tracking-wider">Requirement</div>
                  {selectedTask.verification_type === "onchain_tx" && (
                    <p className="text-[11px] text-zinc-400">
                      Submit your transaction hash to verify activity completion.
                    </p>
                  )}
                  {selectedTask.verification_type === "nft_ownership" && (
                    <p className="text-[11px] text-zinc-400">
                      Automatically checks your connected wallet for the required badge or pass.
                    </p>
                  )}
                  {selectedTask.verification_type === "manual" && (
                    <p className="text-[11px] text-zinc-400">
                      Submit PR URL, attendance code, or screenshot link for verification.
                    </p>
                  )}
                </div>

                {/* Form */}
                {walletAddress ? (
                  <form onSubmit={handleSubmitProof} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-zinc-400 uppercase font-semibold mb-1">
                        {selectedTask.verification_type === "onchain_tx" ? "Transaction Hash" : "Proof Evidence"}
                      </label>
                      <input
                        type="text"
                        required
                        value={evidenceInput}
                        onChange={(e) => setEvidenceInput(e.target.value)}
                        placeholder={
                          selectedTask.verification_type === "onchain_tx"
                            ? "0x1234567890abcdef..."
                            : "https://github.com/..."
                        }
                        className="w-full bg-[#08090d] border border-white/[0.1] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#0052ff] font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !evidenceInput.trim()}
                      className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 text-xs transition cursor-pointer disabled:opacity-40 shadow-sm"
                    >
                      {isSubmitting ? "VERIFYING..." : "SUBMIT PROOF"}
                    </button>
                  </form>
                ) : (
                  <div className="border border-white/[0.08] bg-[#08090d] rounded-xl p-4 text-center text-xs space-y-2">
                    <p className="text-zinc-400">Please connect your wallet first</p>
                    <button
                      onClick={connectWallet}
                      className="w-full rounded-lg bg-white text-black font-semibold py-2 text-xs transition cursor-pointer"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}

                {/* Feedback */}
                {submitResult && (
                  <div
                    className={`rounded-xl p-3 text-xs border ${
                      submitResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {submitResult.message}
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Select a task to inspect
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
