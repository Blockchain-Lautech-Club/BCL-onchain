"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  NFTMintRecord,
  TaskSubmission,
  PointsLedgerItem,
  ProfileData,
} from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";
import {
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Flame,
  Edit3,
  ExternalLink,
  Layers,
  History,
  Shield,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { walletAddress, user, stats, connectWallet } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nfts, setNfts] = useState<NFTMintRecord[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"badges" | "ledger" | "submissions">("badges");
  const [badgeFilter, setBadgeFilter] = useState<"all" | "level" | "task" | "streak" | "community">("all");

  // Edit Profile modal state
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!walletAddress) return;
      try {
        setLoading(true);
        const [profData, nftData, subData, ptsData] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getMyNFTs().catch(() => []),
          api.getMySubmissions().catch(() => []),
          api.getMyPoints().catch(() => []),
        ]);
        if (profData) {
          setProfile(profData);
          setUsernameInput(profData.username || "");
          setBioInput(profData.bio || "");
        }
        setNfts(nftData || []);
        setSubmissions(subData || []);
        setPointsHistory(ptsData || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [walletAddress]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await api.updateProfile({
        username: usernameInput.trim() || undefined,
        bio: bioInput.trim() || undefined,
      });
      setProfile(updated);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-20 text-center font-sans">
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold font-heading text-white">Sign In Required</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Connect and sign in with your wallet to view your profile, milestone badges, and club points.
          </p>
          <button
            onClick={connectWallet}
            className="w-full rounded-lg bg-[#0052ff] hover:bg-[#1a68ff] text-white font-semibold py-2.5 text-xs transition cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const currentLevel = profile?.level || user?.level || 1;
  const currentPoints = profile?.total_points || user?.total_points || 0;
  const nextThreshold = profile?.next_level_threshold || stats?.next_level_threshold || 1000;
  const levelProgress = Math.min(100, Math.round((currentPoints / nextThreshold) * 100));

  const filteredBadges = nfts.filter((nft) => {
    if (badgeFilter === "all") return true;
    return nft.milestone_type?.toLowerCase() === badgeFilter;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Portfolio Header Bar */}
      <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Connected Builder
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-sans font-semibold">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
                {profile?.username ? `@${profile.username}` : "Anonymous Builder"}
              </h1>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/[0.16] bg-[#0c101a] px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit Profile</span>
              </button>
            </div>

            <p className="text-xs font-mono text-zinc-400">
              {walletAddress}
            </p>

            {profile?.bio && (
              <p className="text-xs text-zinc-300 max-w-xl font-sans pt-1">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-5 text-xs font-sans shrink-0">
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Level</span>
              <span className="text-base font-bold font-heading text-white">LVL {currentLevel}</span>
            </div>
            <div className="h-7 w-px bg-white/[0.08]" />
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Reputation</span>
              <span className="text-base font-bold text-emerald-400 num-mono">{currentPoints.toLocaleString()} PTS</span>
            </div>
            <div className="h-7 w-px bg-white/[0.08]" />
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Daily Streak</span>
              <span className="text-base font-bold text-amber-400 flex items-center gap-1 num-mono">
                <Flame className="h-4 w-4" />
                {stats?.streak_days || 1} DAYS
              </span>
            </div>
          </div>
        </div>

        {/* Level Progression */}
        <div className="space-y-1.5 text-xs font-sans">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Level {currentLevel} &rarr; Level {currentLevel + 1}</span>
            <span className="text-white num-mono">
              {currentPoints.toLocaleString()} / {nextThreshold.toLocaleString()} PTS ({levelProgress}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/[0.04]">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        {[
          { id: "badges", label: "Milestone Badges", icon: Award, count: nfts.length + 1 },
          { id: "ledger", label: "Points History", icon: History, count: pointsHistory.length },
          { id: "submissions", label: "Quest Submissions", icon: Layers, count: submissions.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-heading transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/25"
                  : "bg-[#0c101a] text-zinc-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span className="ml-1 text-[10px] opacity-75 font-mono">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      {loading ? (
        <div className="surface-card rounded-2xl p-16 text-center text-zinc-500 text-xs">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#0052ff]" />
          <span>Loading portfolio data from Botchain...</span>
        </div>
      ) : activeTab === "badges" ? (
        /* 1. Milestone Badges by Category */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {(["all", "level", "task", "streak", "community"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setBadgeFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                    badgeFilter === filter
                      ? "bg-white/[0.1] text-white border border-white/[0.15]"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-zinc-400">
              Soulbound credentials recorded on Botchain
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Level 1 Founding Badge (Always Present) */}
            {(badgeFilter === "all" || badgeFilter === "level") && (
              <div className="surface-card rounded-xl p-4 border border-white/[0.08] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      LEVEL MILESTONE
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">#1000001</span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-white">Level 1: Pioneer Initiate</h4>
                  <p className="text-xs text-zinc-400 font-sans">
                    Awarded upon authenticating and connecting to the BCL Onchain network.
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>CONFIRMED</span>
                </div>
              </div>
            )}

            {filteredBadges.map((nft) => (
              <div
                key={nft.id}
                className="surface-card rounded-xl p-4 border border-white/[0.08] flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0052ff] bg-[#0052ff]/10 border border-[#0052ff]/20 px-2 py-0.5 rounded-full">
                      {nft.milestone_type || "TASK"} MILESTONE
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">#{nft.token_id}</span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-white capitalize">
                    {nft.milestone_type} Achievement
                  </h4>
                  <p className="text-xs text-zinc-400 font-sans">
                    Status: <span className="text-zinc-200 capitalize font-medium">{nft.status}</span>
                  </p>
                  {nft.transaction_hash && (
                    <a
                      href={getExplorerUrl(nft.transaction_hash, "tx")}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#0052ff] hover:underline font-mono pt-1"
                    >
                      <span>View on Botchain Scan</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <span
                  className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    nft.status === "confirmed"
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : nft.status === "whitelisted"
                      ? "text-purple-400 bg-purple-500/10 border border-purple-500/20"
                      : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  {nft.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "ledger" ? (
        /* 2. Points Transaction Ledger Table */
        <div className="surface-card rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-heading text-white">Points History Ledger</h3>
              <p className="text-xs text-zinc-400 font-sans">
                Immutable activity log of all earned, rewarded, and adjusted reputation points.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Total: +{currentPoints.toLocaleString()} PTS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="text-[10px] uppercase text-zinc-400 font-semibold border-b border-white/[0.04] bg-[#080b12]">
                <tr>
                  <th className="py-3 px-4">Event / Reason</th>
                  <th className="py-3 px-4 text-center">Source</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pointsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-500">
                      No points transactions recorded yet. Complete your first quest!
                    </td>
                  </tr>
                ) : (
                  pointsHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {item.reason}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                        {item.source_task_id ? `Quest #${item.source_task_id}` : "System / Admin"}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {new Date(item.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold num-mono">
                        {item.points_delta > 0 ? (
                          <span className="text-emerald-400">+{item.points_delta.toLocaleString()} PTS</span>
                        ) : (
                          <span className="text-red-400">{item.points_delta.toLocaleString()} PTS</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 3. Quest Submissions History */
        <div className="surface-card rounded-2xl border border-white/[0.08] p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-heading text-white">Submitted Quest History</h3>
            <p className="text-xs text-zinc-400 font-sans">
              Track the review and on-chain verification status of your challenges.
            </p>
          </div>

          <div className="space-y-3">
            {submissions.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-500">
                You haven&apos;t submitted any quests yet. Browse active quests to start earning.
              </p>
            ) : (
              submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-white/[0.06] bg-[#090c14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-heading">
                        Quest #{sub.task_id}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {sub.tx_hash && (
                      <div className="text-xs text-emerald-400 font-mono truncate max-w-md">
                        Tx: {sub.tx_hash}
                      </div>
                    )}
                    {sub.reason && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Feedback: &quot;{sub.reason}&quot;
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      sub.status === "verified"
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : sub.status === "under_review"
                        ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        : "text-red-400 bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c101a] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-base font-bold font-heading text-white">Edit Builder Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] text-zinc-400 uppercase font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. adebayo_dev"
                  pattern="^[a-zA-Z0-9_]{3,32}$"
                  title="3-32 alphanumeric characters and underscores"
                  className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0052ff]"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  3-32 letters, numbers, or underscores.
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 uppercase font-medium mb-1">
                  Bio / Focus Area
                </label>
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="e.g. Smart contract developer & DeFi contributor on Botchain."
                  maxLength={500}
                  className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0052ff]"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  {bioInput.length} / 500 characters
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0052ff] hover:bg-[#1a68ff] text-white font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
