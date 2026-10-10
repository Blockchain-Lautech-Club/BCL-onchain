"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, NFTMintRecord, TaskSubmission, PointsLedgerItem, ProfileData } from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";
import {
  Loader2, CheckCircle2, Award, Flame, Edit3, ExternalLink,
  Layers, History, Shield, Save, X, Zap, Share2, Download, QrCode
} from "lucide-react";
import toast from "react-hot-toast";

const MOCK_BADGES = [
  { id: "b1", title: "First Event", sub: "BCL Inaugural Summit 2024", xp: 100, type: "Soulbound", emoji: "🎯" },
  { id: "b2", title: "7-Day Streak", sub: "Protocol Daily Consistency", xp: 250, type: "Active", emoji: "🔥" },
  { id: "b3", title: "Quiz Master", sub: "EVM Architecture Exam 100%", xp: 300, type: "Rare", emoji: "🧩" },
  { id: "b4", title: "Creative Mind", sub: "Designed Guild Design Kit", xp: 400, type: "Ecosystem", emoji: "🎨" },
  { id: "b5", title: "Community Helper", sub: "Answered 50+ Dev Queries", xp: 150, type: "Karma Lvl 3", emoji: "🤝" },
  { id: "b6", title: "First Smart Contract", sub: "Verified on Base Sepolia", xp: 500, type: "Milestone", emoji: "⚡" },
  { id: "b7", title: "Early BCL Pioneer", sub: "First 100 Onchain Citizens", xp: 1000, type: "Genesis", emoji: "🚀" },
  { id: "b8", title: "Protocol Architect", sub: "Deploy Mainnet DAO Vault", xp: 0, type: "Locked", locked: true, emoji: "🔒" },
];

export default function ProfilePage() {
  const { walletAddress, user, stats, connectWallet } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nfts, setNfts] = useState<NFTMintRecord[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"badges" | "quests" | "skills" | "poaps">("badges");
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!walletAddress) { setLoading(false); return; }
    Promise.all([
      api.getProfile().catch(() => null),
      api.getMyNFTs().catch(() => []),
      api.getMySubmissions().catch(() => []),
      api.getMyPoints().catch(() => []),
    ]).then(([profData, nftData, subData, ptsData]) => {
      if (profData) { setProfile(profData); setUsernameInput(profData.username || ""); setBioInput(profData.bio || ""); }
      setNfts(nftData || []); setSubmissions(subData || []); setPointsHistory(ptsData || []);
    }).finally(() => setLoading(false));
  }, [walletAddress]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await api.updateProfile({ username: usernameInput.trim() || undefined, bio: bioInput.trim() || undefined });
      setProfile(updated); setIsEditing(false);
      toast.success("Profile updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally { setSavingProfile(false); }
  };

  if (!walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <div className="surface-card rounded-2xl p-8 space-y-4">
          <Shield className="w-10 h-10 text-accent-fg mx-auto" />
          <h2 className="text-base font-bold font-heading text-ink">Connect to View Profile</h2>
          <p className="text-xs text-ink-4 leading-relaxed">Connect your wallet to view your BCL identity, milestone badges, and on-chain reputation.</p>
          <button onClick={connectWallet} className="btn-green w-full py-2.5 text-sm flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const currentLevel = profile?.level || user?.level || 14;
  const currentPoints = profile?.total_points || user?.total_points || 2840;
  const nextThreshold = profile?.next_level_threshold || stats?.next_level_threshold || 3200;
  const levelProgress = Math.min(100, Math.round((currentPoints / nextThreshold) * 100));
  const shortAddr = `0x71C...4e8B`;

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] text-ink-5 font-mono">
        <span>NETWORK</span><span>/</span><span>IDENTITY</span><span>/</span>
        <span className="text-accent-fg font-bold">PHILIP.BCL</span>
        <span className="badge-blue">ERC-6551 Bound</span>
        <span className="ml-auto">• Synced Block #19,482,104</span>
      </div>

      {/* Main Identity Card */}
      <div className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-700 border border-white/10 flex items-center justify-center shrink-0 relative">
            <div className="text-2xl">👤</div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent border-2 border-page flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-on-accent" />
            </div>
          </div>

          {/* Identity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-extrabold font-heading text-ink">
                    {profile?.username ? profile.username.toUpperCase() + ".BCL" : "PHILIP.BCL"}
                  </h1>
                  <span className="badge-green">VERIFIED CITIZEN</span>
                </div>
                <div className="text-xs text-ink-4 font-mono mb-2">{shortAddr} · Level {currentLevel} Pioneer · {currentPoints.toLocaleString()} XP</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge-blue">Developer</span>
                  <span className="badge-green">Community Contributor</span>
                  <span className="badge-amber">Hackathon Finalist</span>
                </div>
              </div>

              {/* Reputation */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-accent/40 flex items-center justify-center bg-accent/5">
                    <div>
                      <div className="text-xl font-extrabold text-ink font-heading num-mono">92</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-ink-4 mt-1">Reputation</div>
                  <div className="text-[10px] text-accent-fg">Top 3% of Campuses</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">PASSPORT ID</div>
                  <div className="text-sm font-bold text-ink font-heading">#BCL-94021</div>
                  <div className="text-[10px] text-ink-5 font-mono">philip.bcl</div>
                  <QrCode className="w-4 h-4 text-ink-5 mt-1 mx-auto" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={() => setIsEditing(true)} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <Share2 className="w-3 h-3" /> Share Profile
              </button>
              <button onClick={() => setIsEditing(true)} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <Edit3 className="w-3 h-3" /> Edit Bio
              </button>
              <button className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <Download className="w-3 h-3" /> Export Onchain Passport
              </button>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-accent-fg">
                <Flame className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
                Active Daily Protocol Streak: <span className="font-bold">7 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Quests Cleared", value: "23", sub: "+3 this wk", icon: CheckCircle2 },
          { label: "Achievements", value: "12", sub: "Tier II", icon: Award, highlight: true },
          { label: "Events Attended", value: "8", sub: "POAP Badged", icon: Zap },
          { label: "Projects Shipped", value: "5", sub: "2 Mainnet", icon: Layers },
          { label: "Contributions", value: "17", sub: "Guild Karma", icon: Shield },
        ].map(({ label, value, sub, icon: Icon, highlight }) => (
          <div key={label} className="stat-card flex flex-col gap-1">
            <Icon className={`w-3.5 h-3.5 ${highlight ? "text-accent-fg" : "text-ink-5"}`} />
            <div className={`text-2xl font-extrabold font-heading num-mono ${highlight ? "text-accent-fg" : "text-ink"}`}>{value}</div>
            <div className="text-[10px] text-ink-4 uppercase tracking-wider">{label}</div>
            <div className="text-[10px] text-ink-5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Claim Sub-Identity */}
      <div className="surface-card rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <span className="text-base">@</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-ink font-heading">Claim Sub-Identity or Custom BCL Handle</div>
          <div className="text-xs text-ink-4">Mint your custom vanity address directly tied to your student or developer ENS node.</div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 flex-1 sm:flex-initial bg-page border border-ink/[0.1] rounded-xl px-3 py-2">
            <input type="text" defaultValue="solidity-lead" className="bg-transparent text-xs text-ink outline-none w-24" />
            <span className="text-xs text-ink-4">.bcl</span>
          </div>
          <button className="btn-green flex items-center gap-1.5 px-4 py-2 text-xs font-bold shrink-0">
            <Zap className="w-3 h-3" /> Instant Mint
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ink/[0.06] pb-1 overflow-x-auto">
        {[
          { id: "badges", label: "Badges & Achievements", count: 12 },
          { id: "quests", label: "Quest History & Proofs", count: 23 },
          { id: "skills", label: "Skills & Endorsements", count: 4 },
          { id: "poaps", label: "Event POAPs", count: 8 },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === id
                ? "bg-ink/[0.07] text-ink border border-ink/[0.1]"
                : "text-ink-4 hover:text-ink"
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full num-mono ${activeTab === id ? "bg-accent/15 text-accent-fg" : "bg-ink/[0.04] text-ink-5"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-accent-fg" /></div>
      ) : activeTab === "badges" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-ink">Digital Passport Crests</h2>
              <p className="text-xs text-ink-4">Verifiable credential credentials bound to this citizen's Soulbound token registry.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-ink-5">Filter:</span>
              <button className="btn-outline px-3 py-1 text-xs">All (12)</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MOCK_BADGES.map(({ id, title, sub, xp, type, locked, emoji }) => (
              <div key={id} className={`quest-card p-4 flex flex-col items-center text-center gap-3 ${locked ? "opacity-40" : ""}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${locked ? "bg-ink/[0.04] border border-ink/[0.06]" : "bg-gradient-to-br from-subtle to-surface border border-accent/15"}`}>
                  {emoji}
                </div>
                <div>
                  <div className="font-heading font-bold text-xs text-ink">{title}</div>
                  <div className="text-[10px] text-ink-4 mt-0.5">{sub}</div>
                </div>
                <div className="flex items-center justify-between w-full text-[10px]">
                  {xp > 0 && <span className="xp-tag text-[10px]">+{xp} XP</span>}
                  {xp === 0 && <span className="text-[10px] text-ink-5">Progress: 1/2</span>}
                  <span className={`font-bold ${type === "Soulbound" ? "text-brand-soft" : type === "Active" ? "text-orange-700 dark:text-orange-400" : type === "Rare" ? "text-purple-700 dark:text-purple-400" : type === "Genesis" ? "text-amber-700 dark:text-amber-400" : type === "Locked" ? "text-ink-5" : "text-accent-fg"}`}>
                    {type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface-card rounded-2xl p-6 text-center text-xs text-ink-5">
          <div className="mb-2 text-2xl">📋</div>
          {activeTab === "quests" ? "Quest history synced from Botchain · 23 submissions recorded" :
           activeTab === "skills" ? "4 verified skills and endorsements from guild members" :
           "8 Event POAPs claimed across campus and online events"}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/[0.1] bg-surface p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-base font-bold font-heading text-ink">Edit Builder Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-ink-5 hover:text-ink transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] text-ink-4 uppercase font-semibold mb-1.5">Username</label>
                <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="e.g. adebayo_dev" className="w-full bg-page border border-ink/[0.1] rounded-xl px-4 py-2.5 text-xs text-ink placeholder:text-ink-5 focus:outline-none focus:border-accent/40" />
              </div>
              <div>
                <label className="block text-[11px] text-ink-4 uppercase font-semibold mb-1.5">Bio</label>
                <textarea rows={3} value={bioInput} onChange={e => setBioInput(e.target.value)} placeholder="Smart contract developer & DeFi contributor..." className="w-full bg-page border border-ink/[0.1] rounded-xl px-4 py-2.5 text-xs text-ink placeholder:text-ink-5 focus:outline-none focus:border-accent/40 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs text-ink-4 hover:text-ink transition">Cancel</button>
                <button type="submit" disabled={savingProfile} className="btn-green flex items-center gap-1.5 px-5 py-2 text-xs disabled:opacity-50">
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
