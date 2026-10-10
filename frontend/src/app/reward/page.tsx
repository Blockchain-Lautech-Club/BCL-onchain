"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, NFTMintRecord, Milestone } from "@/lib/api";
import { getExplorerUrl, CONTRACT_ADDRESSES, botchainPublicClient } from "@/lib/contracts";
import { parseAbi } from "viem";
import { useWalletClient } from "wagmi";
import toast from "react-hot-toast";
import {
  Award, Loader2, ExternalLink, Zap, Shield, CheckCircle2,
  Clock, RefreshCw, AlertCircle, Trophy, Star,
} from "lucide-react";

// ── ABI for the user-side claim() function on BCLRewards ──────────────────
const REWARDS_ABI = parseAbi([
  "function claim(uint256 tokenId) external",
  "function isWhitelisted(address wallet, uint256 tokenId) external view returns (bool)",
  "function hasClaimed(address wallet, uint256 tokenId) external view returns (bool)",
]);

// ── Helpers ───────────────────────────────────────────────────────────────
function milestoneEmoji(type: string): string {
  switch (type) {
    case "level":     return "⚡";
    case "task":      return "✅";
    case "streak":    return "🔥";
    case "community": return "🤝";
    default:          return "🏅";
  }
}

function statusLabel(status: NFTMintRecord["status"]) {
  switch (status) {
    case "queued":      return { text: "Queued",      cls: "badge-blue" };
    case "pending":     return { text: "Minting…",    cls: "badge-amber" };
    case "whitelisted": return { text: "Ready",       cls: "badge-green" };
    case "confirmed":   return { text: "Claimed",     cls: "badge-purple" };
    case "failed":      return { text: "Failed",      cls: "bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full" };
    default:            return { text: status,        cls: "badge-blue" };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function RewardsPage() {
  const { walletAddress, connectWallet } = useAuth();
  const { data: walletClient } = useWalletClient();

  const [myMints, setMyMints] = useState<NFTMintRecord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"earned" | "all">("earned");

  const load = useCallback(async () => {
    if (!walletAddress) { setLoading(false); return; }
    setLoading(true);
    try {
      const [mints, allMilestones] = await Promise.all([
        api.getMyNFTs().catch(() => [] as NFTMintRecord[]),
        api.getMilestones().catch(() => [] as Milestone[]),
      ]);
      setMyMints(mints);
      setMilestones(allMilestones);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { load(); }, [load]);

  // ── Claim a whitelisted token ──────────────────────────────────────────
  async function handleClaim(mint: NFTMintRecord) {
    if (!walletClient || !walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      setClaimingId(mint.id);

      // Verify still whitelisted onchain before sending tx
      const stillWhitelisted = await botchainPublicClient.readContract({
        address: CONTRACT_ADDRESSES.REWARDS,
        abi: REWARDS_ABI,
        functionName: "isWhitelisted",
        args: [walletAddress as `0x${string}`, BigInt(mint.token_id)],
      });

      if (!stillWhitelisted) {
        toast.error("No longer whitelisted for this token — refresh and try again.");
        return;
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.REWARDS,
        abi: REWARDS_ABI,
        functionName: "claim",
        args: [BigInt(mint.token_id)],
      });

      toast.success(
        <span>
          Claim submitted!{" "}
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View tx
          </a>
        </span>
      );

      // Optimistically mark as pending in UI, then reload
      setMyMints((prev) =>
        prev.map((m) => (m.id === mint.id ? { ...m, status: "pending" } : m))
      );
      setTimeout(load, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Claim failed";
      if (!msg.toLowerCase().includes("rejected")) toast.error(msg);
    } finally {
      setClaimingId(null);
    }
  }

  // ── Unauthenticated state ──────────────────────────────────────────────
  if (!walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <div className="surface-card rounded-2xl p-8 space-y-4">
          <Award className="w-10 h-10 text-accent-fg mx-auto" />
          <h2 className="text-base font-bold font-heading text-ink">Connect to View Rewards</h2>
          <p className="text-xs text-ink-4 leading-relaxed">
            Connect your wallet to see your milestone NFTs, claim pending rewards, and
            browse the full BCL badge registry.
          </p>
          <button
            onClick={connectWallet}
            className="btn-green w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────
  const claimable  = myMints.filter((m) => m.status === "whitelisted");
  const confirmed  = myMints.filter((m) => m.status === "confirmed");
  const inProgress = myMints.filter((m) => m.status === "queued" || m.status === "pending");
  const failed     = myMints.filter((m) => m.status === "failed");

  // Map token_id → milestone metadata for the "all milestones" tab
  const milestoneMap = Object.fromEntries(milestones.map((m) => [m.token_id, m]));

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-subtle to-page border border-accent/15 px-6 py-7 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="absolute top-0 right-0 w-80 h-40 bg-accent/[0.07] blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-5 mb-2">
              <Trophy className="w-3 h-3" />
              <span>BCL MILESTONE VAULT</span>
              <span>·</span>
              <span className="text-accent-fg">ERC-1155 SOULBOUND</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink mb-1">
              Rewards & Milestones
            </h1>
            <p className="text-sm text-ink-4 max-w-xl">
              Onchain proof of your BCL journey. Milestone NFTs are soulbound — they live
              in your wallet permanently.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-outline flex items-center gap-1.5 px-4 py-2 text-sm shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Claimed NFTs",   value: confirmed.length,  icon: <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" /> },
          { label: "Ready to Claim", value: claimable.length,  icon: <Star className="w-3.5 h-3.5 text-amber-500" />,        highlight: claimable.length > 0 },
          { label: "In Progress",    value: inProgress.length, icon: <Clock className="w-3.5 h-3.5 text-ink-5" /> },
          { label: "Total Milestones", value: milestones.length, icon: <Trophy className="w-3.5 h-3.5 text-ink-5" /> },
        ].map(({ label, value, icon, highlight }) => (
          <div
            key={label}
            className={`stat-card ${highlight ? "border-amber-500/30 bg-amber-500/5" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-ink-5 uppercase tracking-wider">{label}</div>
              {icon}
            </div>
            <div className={`text-2xl font-extrabold font-heading num-mono ${highlight ? "text-amber-500" : "text-ink"}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Claimable banner ────────────────────────────────────────── */}
      {claimable.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-white dark:from-[#1a1000] dark:to-[#0e0a00] border border-amber-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-ink">
                {claimable.length} reward{claimable.length > 1 ? "s" : ""} ready to claim
              </div>
              <div className="text-xs text-ink-4 mt-0.5">
                Your wallet has been whitelisted. Claim below to mint your soulbound NFTs.
              </div>
            </div>
          </div>
          <span className="badge-amber shrink-0">ACTION REQUIRED</span>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border-subtle">
        {(["earned", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              tab === t
                ? "border-accent-fg text-accent-fg"
                : "border-transparent text-ink-5 hover:text-ink"
            }`}
          >
            {t === "earned" ? `My NFTs (${myMints.length})` : `All Milestones (${milestones.length})`}
          </button>
        ))}
      </div>

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-ink-5 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading rewards…</span>
        </div>
      )}

      {/* ── MY NFTs tab ──────────────────────────────────────────────── */}
      {!loading && tab === "earned" && (
        <div className="space-y-4">
          {myMints.length === 0 ? (
            <div className="surface-card rounded-2xl p-10 text-center space-y-3">
              <Shield className="w-10 h-10 text-ink-5 mx-auto" />
              <p className="font-heading font-bold text-ink">No rewards yet</p>
              <p className="text-xs text-ink-4 max-w-xs mx-auto">
                Complete tasks, reach level milestones, and maintain streaks to earn
                soulbound NFT badges.
              </p>
            </div>
          ) : (
            <>
              {/* Group by status: claimable first, then confirmed, then others */}
              {[
                { heading: "Ready to Claim", items: claimable },
                { heading: "Claimed",        items: confirmed },
                { heading: "In Progress",    items: inProgress },
                { heading: "Failed",         items: failed },
              ]
                .filter(({ items }) => items.length > 0)
                .map(({ heading, items }) => (
                  <div key={heading}>
                    <h2 className="font-heading font-bold text-xs text-ink-5 uppercase tracking-wider mb-3">
                      {heading}
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((mint) => {
                        const meta    = milestoneMap[mint.token_id];
                        const { text, cls } = statusLabel(mint.status);
                        const isClaiming = claimingId === mint.id;

                        return (
                          <div key={mint.id} className="surface-card rounded-xl p-4 flex flex-col gap-3">
                            {/* Icon + name */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl shrink-0">
                                  {milestoneEmoji(mint.milestone_type)}
                                </div>
                                <div>
                                  <div className="font-heading font-bold text-sm text-ink leading-tight">
                                    {meta?.name || `Token #${mint.token_id}`}
                                  </div>
                                  <div className="text-[10px] text-ink-5 capitalize mt-0.5">
                                    {mint.milestone_type} milestone · Token #{mint.token_id}
                                  </div>
                                </div>
                              </div>
                              <span className={cls}>{text}</span>
                            </div>

                            {/* Description */}
                            {meta?.description && (
                              <p className="text-xs text-ink-4 leading-relaxed">{meta.description}</p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-auto pt-1 border-t border-border-subtle gap-2">
                              <span className="text-[10px] text-ink-5">
                                {new Date(mint.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-2">
                                {mint.transaction_hash && (
                                  <a
                                    href={getExplorerUrl(mint.transaction_hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-accent-fg font-semibold hover:underline"
                                  >
                                    Tx <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {mint.status === "whitelisted" && (
                                  <button
                                    onClick={() => handleClaim(mint)}
                                    disabled={isClaiming}
                                    className="btn-green flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                                  >
                                    {isClaiming ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Award className="w-3 h-3" />
                                    )}
                                    {isClaiming ? "Claiming…" : "Claim NFT"}
                                  </button>
                                )}
                                {mint.status === "failed" && (
                                  <div className="flex items-center gap-1 text-[10px] text-red-500">
                                    <AlertCircle className="w-3 h-3" />
                                    {mint.failure_reason || "Contact admin"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* ── ALL MILESTONES tab ───────────────────────────────────────── */}
      {!loading && tab === "all" && (
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="surface-card rounded-2xl p-10 text-center space-y-3">
              <Trophy className="w-10 h-10 text-ink-5 mx-auto" />
              <p className="font-heading font-bold text-ink">No milestones configured yet</p>
              <p className="text-xs text-ink-4">Admins can add milestones from the admin panel.</p>
            </div>
          ) : (
            <>
              {(["level", "task", "streak", "community"] as const).map((type) => {
                const group = milestones.filter((m) => m.milestone_type === type);
                if (group.length === 0) return null;
                const earnedTokenIds = new Set(confirmed.map((m) => m.token_id));
                return (
                  <div key={type}>
                    <h2 className="font-heading font-bold text-xs text-ink-5 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>{milestoneEmoji(type)}</span>
                      <span>{type} milestones</span>
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.map((m) => {
                        const earned = earnedTokenIds.has(m.token_id);
                        return (
                          <div
                            key={m.token_id}
                            className={`surface-card rounded-xl p-4 flex flex-col gap-2 ${earned ? "border-accent/30" : "opacity-70"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${earned ? "bg-accent/10 border border-accent/20" : "bg-ink/[0.04] border border-border-subtle"}`}>
                                  {earned ? milestoneEmoji(type) : "🔒"}
                                </div>
                                <div>
                                  <div className="font-heading font-bold text-sm text-ink">{m.name}</div>
                                  <div className="text-[10px] text-ink-5">Token #{m.token_id}</div>
                                </div>
                              </div>
                              {earned && <span className="badge-green shrink-0">Earned</span>}
                            </div>
                            {m.description && (
                              <p className="text-xs text-ink-4 leading-relaxed">{m.description}</p>
                            )}
                            {m.points_threshold != null && (
                              <div className="text-[10px] text-ink-5 mt-auto pt-1 border-t border-border-subtle">
                                Requires {m.points_threshold.toLocaleString()} XP
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
