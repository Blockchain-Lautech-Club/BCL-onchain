"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, NFTMintRecord, TaskSubmission, PointsLedgerItem, ProfileData } from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";
import {
  Loader2, CheckCircle2, Award, Flame, Edit3, ExternalLink,
  Shield, Save, X, Zap, Globe2, Copy, Trophy, ListChecks,
  History, Share2, Download, Rocket, Fingerprint, AtSign,
  Link2, MapPin, Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

const AVATAR_OPTIONS = ["🧑‍💻","👾","🦊","🐉","🤖","⚡","🔮","🛸","🧬","🌐","🏴‍☠️","🎭","🦁","🐺","🦅","🧙","🥷","👨‍🚀","🦸","🎯"];
const ROLE_OPTIONS   = ["builder","developer","designer","researcher","investor","community","founder","student","auditor","advocate"];

export default function ProfilePage() {
  const { walletAddress, user, stats, connectWallet } = useAuth();

  // Data state
  const [profile,       setProfile]       = useState<ProfileData | null>(null);
  const [nfts,          setNfts]          = useState<NFTMintRecord[]>([]);
  const [submissions,   setSubmissions]   = useState<TaskSubmission[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsLedgerItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<"badges" | "quests" | "points">("badges");

  // Edit modal state
  const [isEditing,     setIsEditing]     = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit form fields
  const [usernameInput, setUsernameInput] = useState("");
  const [bioInput,      setBioInput]      = useState("");
  const [avatarEmoji,   setAvatarEmoji]   = useState("🧑‍💻");
  const [roleInput,     setRoleInput]     = useState("builder");
  const [locationInput, setLocationInput] = useState("");
  const [twitterInput,  setTwitterInput]  = useState("");
  const [githubInput,   setGithubInput]   = useState("");
  const [websiteInput,  setWebsiteInput]  = useState("");
  const [skillsInput,   setSkillsInput]   = useState<string[]>([]);
  const [skillDraft,    setSkillDraft]    = useState("");

  useEffect(() => {
    if (!walletAddress) { setLoading(false); return; }
    Promise.all([
      api.getProfile().catch(() => null),
      api.getMyNFTs().catch(() => [] as NFTMintRecord[]),
      api.getMySubmissions().catch(() => [] as TaskSubmission[]),
      api.getMyPoints().catch(() => [] as PointsLedgerItem[]),
    ]).then(([profData, nftData, subData, ptsData]) => {
      if (profData) {
        setProfile(profData);
        setUsernameInput(profData.username    || "");
        setBioInput(     profData.bio         || "");
        setAvatarEmoji(  profData.avatar_emoji || "🧑‍💻");
        setRoleInput(    profData.role         || "builder");
        setLocationInput(profData.location    || "");
        setTwitterInput( profData.twitter     || "");
        setGithubInput(  profData.github      || "");
        setWebsiteInput( profData.website     || "");
        setSkillsInput(  profData.skills      || []);
      }
      setNfts(nftData || []);
      setSubmissions(subData || []);
      setPointsHistory(ptsData || []);
    }).finally(() => setLoading(false));
  }, [walletAddress]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await api.updateProfile({
        username:     usernameInput.trim() || undefined,
        bio:          bioInput.trim()      || undefined,
        avatar_emoji: avatarEmoji,
        role:         roleInput,
        location:     locationInput.trim() || undefined,
        twitter:      twitterInput.trim()  || undefined,
        github:       githubInput.trim()   || undefined,
        website:      websiteInput.trim()  || undefined,
        skills:       skillsInput,
      });
      setProfile(updated);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const addSkill = () => {
    const tag = skillDraft.trim().replace(/,/g, "");
    if (tag && !skillsInput.includes(tag) && skillsInput.length < 12) {
      setSkillsInput(s => [...s, tag]);
      setSkillDraft("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <div className="rounded-2xl bg-surface border border-ink/5 p-10 space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-ink/5 flex items-center justify-center mx-auto text-accent-fg">
            <Fingerprint className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-ink">Identity Verification</h2>
          <p className="text-sm text-ink-4 leading-relaxed">
            Connect your wallet to view your sovereign BCL identity, verifiable credentials, and on-chain reputation dashboard.
          </p>
          <button onClick={connectWallet} className="btn-green w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-4">
            <Zap className="w-4 h-4" /> Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const currentLevel    = profile?.level          ?? user?.level          ?? 0;
  const currentPoints   = profile?.total_points   ?? user?.total_points   ?? 0;
  const pointsToNext    = profile?.points_to_next ?? stats?.points_to_next_level ?? 0;
  const nextThreshold   = profile?.next_level_threshold ?? stats?.next_level_threshold ?? 0;
  const levelProgress   = nextThreshold > 0 ? Math.min(100, Math.round(((nextThreshold - pointsToNext) / nextThreshold) * 100)) : 0;
  const displayName     = profile?.username || user?.username || `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const shortAddr       = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const confirmedNfts   = nfts.filter(n => n.status === "confirmed");
  const streakDays      = stats?.streak_days ?? 0;
  const completedTasks  = submissions.filter(s => s.status === "verified").length;
  const displayAvatar   = profile?.avatar_emoji || "🧑‍💻";

  // SVG Reputation Dial
  const radius           = 30;
  const circumference    = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (levelProgress / 100) * circumference;

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

      {/* 1. Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-ink-4 font-bold uppercase tracking-wider">
          <span>Network</span>
          <span className="text-ink/20">/</span>
          <span className="text-accent-fg">{displayName}</span>
          <span className="px-2 py-0.5 rounded-full bg-ink/5 text-ink ml-2 shadow-sm border border-ink/5 hidden sm:inline-block">ERC-6551 Bound</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-fg animate-ping" />
          <span className="font-mono text-[10px] text-ink-4 font-bold uppercase">Synched L2 Node</span>
        </div>
      </div>

      {/* 2. Hero Passport Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-ink/5 p-6 md:p-10 shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-center">

          {/* Left: Avatar + Identity */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative shrink-0">
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl p-1 bg-gradient-to-tr from-accent via-purple-500 to-amber-500 shadow-[0_0_24px_rgba(0,245,160,0.2)]">
                <div className="w-full h-full rounded-xl bg-surface flex items-center justify-center overflow-hidden">
                  <span className="text-6xl">{displayAvatar}</span>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-ink/10 text-accent-fg shadow-md">
                <CheckCircle2 className="w-6 h-6 fill-accent-fg text-surface" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight uppercase">{displayName}</h1>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent-fg font-mono text-[10px] font-bold tracking-wider uppercase border border-accent/20">
                  <Shield className="w-3 h-3" /> VERIFIED CITIZEN
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-ink-4 font-semibold flex-wrap">
                <span className="text-ink">{shortAddr}</span>
                <button onClick={() => copyToClipboard(walletAddress)} className="p-1 hover:text-ink transition-colors" title="Copy Address">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <span className="w-1 h-1 rounded-full bg-ink/20 mx-1" />
                <span className="text-accent-fg">Level {currentLevel} Pioneer</span>
                <span className="text-ink/20 mx-1">·</span>
                <span className="text-amber-500">{currentPoints.toLocaleString()} XP</span>
              </div>

              {/* Role + location */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {profile?.role && (
                  <span className="px-3 py-1 rounded-full bg-ink/5 text-ink font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-ink/5">
                    <Briefcase className="w-3 h-3 text-accent-fg" /> {profile.role}
                  </span>
                )}
                {profile?.location && (
                  <span className="px-3 py-1 rounded-full bg-ink/5 text-ink font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-ink/5">
                    <MapPin className="w-3 h-3 text-purple-400" /> {profile.location}
                  </span>
                )}
                {profile?.is_admin && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Protocol Admin
                  </span>
                )}
                {streakDays >= 7 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20">
                    <Flame className="w-3 h-3" /> Consistency Elite
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-ink-4 max-w-md mt-1 leading-relaxed">{profile.bio}</p>
              )}

              {/* Social links */}
              {(profile?.twitter || profile?.github || profile?.website) && (
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {profile.twitter && (
                    <a href={`https://twitter.com/${profile.twitter.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ink-4 hover:text-ink transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> {profile.twitter}
                    </a>
                  )}
                  {profile.github && (
                    <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ink-4 hover:text-ink transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg> {profile.github}
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ink-4 hover:text-ink transition-colors">
                      <Link2 className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.skills.map(skill => (
                    <span key={skill} className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent-fg font-mono text-[10px] font-bold border border-accent/20">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Reputation Dial + Passport */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-ink/[0.02] border border-ink/5 shadow-sm">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                  <circle className="text-ink/5" cx="36" cy="36" fill="transparent" r="30" stroke="currentColor" strokeWidth="5" />
                  <circle className="text-accent-fg transition-all duration-1000 ease-out" cx="36" cy="36" fill="transparent" r="30" stroke="currentColor"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset || 0} strokeLinecap="round" strokeWidth="5" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-heading font-bold text-ink leading-none">{levelProgress}</span>
                  <span className="font-mono text-[8px] text-ink-4 uppercase font-bold tracking-widest mt-0.5">%</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-heading font-bold text-ink">Level Progress</span>
                <span className="font-mono text-[10px] text-accent-fg font-bold uppercase mt-1">{pointsToNext.toLocaleString()} XP to Next</span>
                <span className="text-[10px] text-ink-4 mt-0.5">Threshold: {nextThreshold.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-ink/[0.02] border border-ink/5 shadow-sm">
              <div className="w-16 h-16 rounded-lg bg-surface border border-ink/5 p-2 flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-full h-full text-ink" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M0 0h36v36H0zm8 8v20h20V8zm8 8h4v4h-4zM64 0h36v36H64zm8 8v20h20V8zm8 8h4v4h-4zM0 64h36v36H0zm8 8v20h20V72zm8 8h4v4h-4zM44 8h12v12H44zm0 20h12v12H44zm12 16h8v8h-8zm16 8h12v12H72zm8 16h16v16H80zm-36 0h8v16h-8zm12 8h8v16h-8zm-8-24h12v8H48zm16-16h8v8h-8zm-8 8h8v8h-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider mb-1">Passport ID</span>
                <span className="font-mono text-sm text-accent-fg font-bold truncate max-w-[110px]">#BCL-{walletAddress.slice(-5)}</span>
                <button onClick={() => copyToClipboard(`https://bcl.com/p/${displayName}`)} className="font-mono text-[10px] text-ink-4 hover:text-ink transition-colors flex items-center gap-1 mt-0.5 font-bold">
                  {displayName.toLowerCase()}.bcl <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 pt-6 border-t border-ink/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => copyToClipboard(`https://bcl.com/p/${displayName}`)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-ink/5 text-ink hover:bg-ink/10 transition-colors text-xs font-bold">
              <Share2 className="w-3.5 h-3.5" /> Share Profile
            </button>
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-ink/5 text-ink hover:bg-ink/10 transition-colors text-xs font-bold">
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 transition-colors text-xs font-bold">
              <Download className="w-3.5 h-3.5" /> Export Onchain Passport
            </button>
          </div>
          <div className="flex items-center gap-2 text-ink-4 font-mono text-[10px] font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Active Streak: <strong className="text-ink">{streakDays} Days</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Quests Cleared",  value: completedTasks,                  icon: CheckCircle2, color: "text-accent-fg", meta: "+3 this wk" },
          { label: "Achievements",    value: confirmedNfts.length,             icon: Award,        color: "text-amber-500", meta: `Tier ${currentLevel > 5 ? "II" : "I"}` },
          { label: "Streak Days",     value: streakDays,                       icon: Flame,        color: "text-orange-500", meta: "Consistency" },
          { label: "Active Domains",  value: stats?.active_names_count ?? 0,   icon: Globe2,       color: "text-purple-500", meta: "Verified" },
          { label: "Total XP",        value: currentPoints,                    icon: Zap,          color: "text-ink",        meta: "Lifetime" },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl bg-surface border border-ink/5 flex flex-col justify-between shadow-sm hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between text-ink-4 mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-ink">{stat.value.toLocaleString()}</span>
              <span className={`font-mono text-[10px] font-bold ${stat.color}`}>{stat.meta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Identity CTA Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-ink/[0.02] border border-ink/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-ink/5 flex items-center justify-center text-accent-fg shrink-0 shadow-sm">
            <AtSign className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-heading font-bold text-ink">Customize Sovereign Identity</span>
            <p className="text-sm text-ink-4 max-w-md leading-relaxed">Update your on-chain profile metadata, bio, social links, skills, and visual representations.</p>
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-8 py-3.5 rounded-full bg-accent text-surface font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-accent/20 transition-all shrink-0">
          <Edit3 className="w-4 h-4" /> Update Profile
        </button>
      </div>

      {/* 5. Tabs */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-ink/5 no-scrollbar">
          {[
            { id: "badges", label: "Badges & Achievements", count: confirmedNfts.length,  icon: Award      },
            { id: "quests", label: "Quest History & Proofs", count: submissions.length,   icon: ListChecks },
            { id: "points", label: "Points Ledger",          count: pointsHistory.length, icon: History    },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-surface border border-ink/10 text-accent-fg shadow-sm"
                  : "bg-transparent text-ink-4 hover:text-ink hover:bg-ink/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${activeTab === tab.id ? "bg-accent/10 text-accent-fg" : "bg-ink/5 text-ink-4"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-fg" /></div>
        ) : (
          <div className="min-h-[300px]">

            {/* Badges */}
            {activeTab === "badges" && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-heading font-bold text-ink">Digital Passport Crests</h2>
                  <p className="text-sm text-ink-4 mt-1">Verifiable credentials bound to your Soulbound token registry.</p>
                </div>
                {confirmedNfts.length === 0 ? (
                  <div className="rounded-2xl border border-ink/5 bg-surface p-16 text-center space-y-4">
                    <Trophy className="w-12 h-12 text-ink-4 mx-auto mb-4" />
                    <h3 className="text-xl font-heading font-bold text-ink">No Crests Unlocked</h3>
                    <p className="text-sm text-ink-4 max-w-sm mx-auto">Complete quests, reach milestone levels, and maintain streaks to earn permanent soulbound NFTs.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {confirmedNfts.map(nft => (
                      <div key={nft.id} className="group relative p-6 rounded-2xl bg-surface border border-ink/5 hover:border-accent/30 hover:shadow-md transition-all flex flex-col items-center text-center cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-ink/5 border-4 border-surface shadow-sm flex items-center justify-center mb-5 relative overflow-hidden group-hover:scale-105 transition-transform">
                          <span className="text-4xl">
                            {nft.milestone_type === "level" ? "⚡" : nft.milestone_type === "streak" ? "🔥" : nft.milestone_type === "task" ? "🏅" : "🏆"}
                          </span>
                        </div>
                        <span className="text-base font-heading font-bold text-ink capitalize mb-1">{nft.milestone_type} Milestone</span>
                        <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider mb-5">Token #{nft.token_id}</span>
                        <div className="w-full flex items-center justify-between pt-4 border-t border-ink/5">
                          <span className="px-2 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent-fg">Soulbound</span>
                          {nft.transaction_hash && (
                            <a href={getExplorerUrl(nft.transaction_hash)} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-4 hover:text-ink flex items-center gap-1">
                              View Tx <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quests */}
            {activeTab === "quests" && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-heading font-bold text-ink">Verifiable Onchain Attestations</h2>
                  <p className="text-sm text-ink-4 mt-1">Every completed quest is permanently logged and verified.</p>
                </div>
                {submissions.length === 0 ? (
                  <div className="rounded-2xl border border-ink/5 bg-surface p-16 text-center text-sm text-ink-5 font-medium">No quest history found.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {submissions.map(sub => (
                      <div key={sub.id} className="p-5 rounded-2xl bg-surface border border-ink/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-ink/10 transition-colors shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            sub.status === "verified" ? "bg-accent/10 text-accent-fg" :
                            sub.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {sub.status === "verified" ? <CheckCircle2 className="w-6 h-6" /> : <Rocket className="w-6 h-6" />}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-base font-heading font-bold text-ink">Quest #{sub.task_id} Submission</span>
                              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${
                                sub.status === "verified" ? "bg-accent/10 text-accent-fg" :
                                sub.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                              }`}>{sub.status.replace("_", " ")}</span>
                            </div>
                            <span className="text-sm text-ink-4">Task completed and submitted for cryptographic verification.</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t border-ink/5 md:border-0">
                          <div className="flex flex-col text-left md:text-right">
                            <span className="font-mono text-[10px] text-ink-4 font-bold uppercase mb-1">Submitted On</span>
                            <span className="text-sm font-bold text-ink">{new Date(sub.created_at).toLocaleDateString()}</span>
                          </div>
                          {sub.tx_hash && (
                            <a href={getExplorerUrl(sub.tx_hash)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink/5 text-ink hover:bg-ink/10 text-xs font-bold transition-colors">
                              View Tx <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Points */}
            {activeTab === "points" && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-heading font-bold text-ink">Experience Points Ledger</h2>
                  <p className="text-sm text-ink-4 mt-1">Immutable track record of your earned reputation and multipliers.</p>
                </div>
                {pointsHistory.length === 0 ? (
                  <div className="rounded-2xl border border-ink/5 bg-surface p-16 text-center text-sm text-ink-5 font-medium">No point transactions found.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pointsHistory.map(p => (
                      <div key={p.id} className="p-5 rounded-2xl bg-surface border border-ink/5 flex items-center justify-between gap-4 hover:border-ink/10 transition-colors shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.points_delta >= 0 ? "bg-accent/10 text-accent-fg" : "bg-red-500/10 text-red-500"}`}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-heading font-bold text-ink mb-1">{p.reason}</span>
                            <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">{new Date(p.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`font-mono text-lg font-bold px-3 py-1.5 rounded-lg ${p.points_delta >= 0 ? "bg-accent/10 text-accent-fg" : "bg-red-500/10 text-red-500"}`}>
                          {p.points_delta >= 0 ? "+" : ""}{p.points_delta} XP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ──────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-ink/10 bg-surface p-8 space-y-6 shadow-2xl relative my-auto">

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-ink/5 pb-4">
              <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-ink">Edit Sovereign Identity</h3>
                <p className="text-xs text-ink-4 mt-0.5">Your profile is stored onchain and synced across the ecosystem.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 text-ink-4 hover:text-ink bg-ink/5 p-2 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">

              {/* Avatar Picker */}
              <div>
                <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-3">Avatar Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setAvatarEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        avatarEmoji === e
                          ? "bg-accent/20 border-2 border-accent/60 scale-110"
                          : "bg-ink/5 border border-ink/10 hover:bg-ink/10"
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              {/* Builder Role */}
              <div>
                <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-3">Builder Role</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(r => (
                    <button key={r} type="button" onClick={() => setRoleInput(r)}
                      className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                        roleInput === r
                          ? "bg-accent/20 text-accent-fg border border-accent/40"
                          : "bg-ink/5 text-ink-4 border border-ink/10 hover:bg-ink/10 hover:text-ink"
                      }`}
                    >{r}</button>
                  ))}
                </div>
              </div>

              {/* Handle + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-2">Display Handle</label>
                  <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)}
                    placeholder="e.g. jerydam" pattern="^[a-zA-Z0-9_]{3,32}$"
                    className="w-full bg-ink/[0.03] border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-4/60 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all font-mono"
                  />
                  <p className="text-[10px] text-ink-5 mt-1.5 ml-1">3–32 chars, letters/numbers/underscores.</p>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-2">Location</label>
                  <input type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                    placeholder="e.g. Lagos, NG"
                    className="w-full bg-ink/[0.03] border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-4/60 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-2">Developer Bio</label>
                <textarea rows={3} value={bioInput} onChange={e => setBioInput(e.target.value)}
                  placeholder="Smart contract developer & Web3 contributor building on BCL..."
                  className="w-full bg-ink/[0.03] border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-4/60 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-none font-mono"
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-3">Social Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 bg-ink/[0.03] border border-ink/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                      <svg className="w-3.5 h-3.5 text-ink-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                    <input type="text" value={twitterInput} onChange={e => setTwitterInput(e.target.value)}
                      placeholder="@handle"
                      className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4/50 focus:outline-none font-mono min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-ink/[0.03] border border-ink/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                      <svg className="w-3.5 h-3.5 text-ink-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                    <input type="text" value={githubInput} onChange={e => setGithubInput(e.target.value)}
                      placeholder="username"
                      className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4/50 focus:outline-none font-mono min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-ink/[0.03] border border-ink/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                    <Link2 className="w-3.5 h-3.5 text-ink-4 shrink-0" />
                    <input type="text" value={websiteInput} onChange={e => setWebsiteInput(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4/50 focus:outline-none font-mono min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block font-mono text-[10px] text-ink-4 uppercase font-bold tracking-wider mb-2">
                  Skills / Stack
                  <span className="ml-2 text-ink-5 normal-case tracking-normal font-normal">({skillsInput.length}/12)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                  {skillsInput.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent-fg font-mono text-xs font-bold border border-accent/20">
                      {skill}
                      <button type="button" onClick={() => setSkillsInput(s => s.filter(x => x !== skill))} className="hover:text-red-400 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {skillsInput.length === 0 && (
                    <span className="text-xs text-ink-5 font-mono italic">No skills added yet.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={skillDraft}
                    onChange={e => setSkillDraft(e.target.value)}
                    onKeyDown={e => {
                      if ((e.key === "Enter" || e.key === ",") && skillDraft.trim()) {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type skill + Enter (e.g. Solidity, React, Rust...)"
                    className="flex-1 bg-ink/[0.03] border border-ink/10 rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-4/50 focus:outline-none focus:ring-2 focus:ring-accent/40 font-mono"
                  />
                  <button type="button" onClick={addSkill}
                    className="px-4 py-2.5 rounded-xl bg-ink/5 border border-ink/10 text-ink-4 hover:text-ink hover:bg-ink/10 transition-colors font-mono text-xs font-bold shrink-0"
                  >Add</button>
                </div>
                <p className="text-[10px] text-ink-5 mt-1.5 ml-1">Up to 12 tags. Press Enter or comma to add.</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-ink/5">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-6 py-3 rounded-full text-sm font-bold text-ink-4 hover:text-ink hover:bg-ink/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile}
                  className="px-8 py-3 rounded-full bg-accent text-surface text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-accent/20 transition-all disabled:opacity-50">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Identity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}