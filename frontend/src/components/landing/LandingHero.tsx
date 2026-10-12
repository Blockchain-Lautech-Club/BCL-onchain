"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Task, LeaderboardEntry } from "@/lib/api";
import { 
  Zap, 
  Compass, 
  Users, 
  Terminal, 
  Award, 
  Gift, 
  CheckCircle2, 
  Calendar,
  IdCard,
  Code,
  Medal,
  TrendingUp,
  ArrowRight,
  Palette,
  Megaphone,
  Landmark,
  Layers,
  Hexagon,
  Network,
  Fingerprint,
  Loader2,
  FileText
} from "lucide-react";
import { LinkifiedText } from "@/components/common/LinkifiedText";
import { useAuth } from "@/context/AuthContext";

export function LandingHero() {
  const { walletAddress, connectWallet, user, stats } = useAuth();
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [claimStatus, setClaimStatus] = useState("");
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [platformStats, setPlatformStats] = useState<{
    total_users: number;
    total_points_awarded: number;
    total_tasks_completed: number;
    total_active_tasks?: number;
    total_domains_registered: number;
  } | null>(null);

  useEffect(() => {
    api.getTasks().then(t => setTasks((t || []).slice(0, 3))).catch(() => {});
    api.getLeaderboard(5).then(l => setLeaderboard(l || [])).catch(() => {});
    api.getPlatformStats().then(s => setPlatformStats(s)).catch(() => {});
  }, []);

  const handleClaim = async () => {
    const clean = handle.trim().toLowerCase().replace(".bcl", "");
    if (!clean) {
      setClaimStatus("Please enter a valid handle to claim.");
      return;
    }
    setIsCheckingHandle(true);
    setClaimStatus("");
    try {
      const res = await api.checkNameAvailability(clean);
      if (res.available) {
        setClaimStatus(`✓ ${clean}.bcl is open! Redirecting to claim console...`);
        setTimeout(() => {
          router.push(`/domains?name=${encodeURIComponent(clean)}`);
        }, 500);
      } else {
        setClaimStatus(`✕ ${clean}.bcl is already registered or unavailable.`);
      }
    } catch {
      router.push(`/domains?name=${encodeURIComponent(clean)}`);
    } finally {
      setIsCheckingHandle(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 md:space-y-32 pb-16 sm:pb-24 w-full overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 md:pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] md:w-[700px] h-[250px] sm:h-[400px] bg-accent/[0.06] blur-[100px] sm:blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-0 sm:right-10 w-[180px] sm:w-[300px] h-[150px] sm:h-[200px] bg-brand/[0.05] blur-[80px] sm:blur-[100px] pointer-events-none rounded-full" />

        <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left - Hero Pitch */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-accent/20 bg-surface shadow-sm max-w-full overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 whitespace-nowrap">EPOCH 04 ACTIVE</span>
              <span className="text-ink-4 text-[10px] shrink-0">•</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-fg truncate">GASLESS SOVEREIGN IDENTITY</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-ink leading-[1.1] sm:leading-[1.05] tracking-tight break-words">
              Turn your BCL participation into{" "}
              <span className="text-gradient-bcl">reputation.</span>
            </h1>

            <p className="text-sm sm:text-base text-ink-3 leading-relaxed max-w-xl">
              Complete quests, earn XP, collect achievements, unlock rewards, and build your sovereign Web3 identity across design, writing, community growth, development, and research.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
              <button
                onClick={!walletAddress ? connectWallet : undefined}
                className="btn-green flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-green-500/20 transition-all w-full sm:w-auto"
              >
                <Fingerprint className="w-4 h-4 shrink-0" />
                <span>Get Started</span>
              </button>
              <Link href="/tasks" className="btn-outline flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold w-full sm:w-auto">
                <Compass className="w-4 h-4 text-accent-fg shrink-0" />
                <span>Explore Quests</span>
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
              <div className="flex -space-x-2.5 sm:-space-x-3 shrink-0">
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm ring-2 ring-page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-sQYGniCul46McM9xf_HWT-3jfnmOlpkkQDJVJh03qiPQlO7VEIuvu8kKqQonfq-YBmxrV3aan9plLZPTI2O4TIBEIvMUq0I6rQWf66rzYXVU_31JnL-LLXinwYFP_2j4pE4a8exRm6LPwnm7VH-AmDPk003WdZxnIygNX1Ccx6NsKvVnc3VB_HV89dWlbp6r8G8_q6PtpwjN_3szEivpGfNIW_o-fX3f4m776GLZlZrnAaq5Yf_E" alt="User" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm ring-2 ring-page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBD0rOS_6KEK1wtn4A4kCgl7MXw8qCl3ogigyMiEJARVJt9U8G7eqLNhRx1bpnHjbQPAQ9Isp9Vfxe0aUFYJqRxLvprcAu-ZGqCcK2zzl5MEFX7A2RPpJnqQZ5pUW9w14vX4d5n2rQkLR8pztxQLtijGmgOYB0fo6c3tj-Iqw3BTMaBEuyfD7Q_C3Dmf0L26tXp6lWeioxa2nED6LJFKMRl4NLHFCdA4YDM8_TUIV2gI7-AzP8YuINm" alt="User" />
                <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm ring-2 ring-page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhzu9AtkhkCVcS5Zh2ZSNCCGbZeuYujUspOsRuOkxmkG06zWPpdn-wFhr887EuWDOHccHhUJ6OIe4YjzLJUUfcc6zGeHLVL7qQb6Jx8nJgdYuRQAAhnW7cgSrxSZF2-u2ERvVzIFU8oms6KJxg1SlISw83M35Tobc2mlot9541K3bDAdg4xpYaH-eF1C3kMRjh3pgibQ7yDechAHofq-9IYBQ-YuET4yzCxlDbwGBkUU2NRQD83PVm" alt="User" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-ink truncate">
                  {platformStats?.total_domains_registered 
                    ? `${platformStats.total_domains_registered} Registered .bcl Handles` 
                    : platformStats?.total_users 
                    ? `${platformStats.total_users} Contributors Enrolled` 
                    : "Zero-Gas Sovereign Identity"}
                </span>
                <span className="text-[10px] text-accent-fg truncate">Decentralized campus identity</span>
              </div>
            </div>
          </div>

          {/* Right — BCL ID Card */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-brand/40 to-purple-500/20 rounded-2xl blur-xl transition-all duration-700 group-hover:blur-2xl" />
            <div className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface/90 backdrop-blur-xl p-4 sm:p-6 overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-4 sm:space-y-5">
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-8 rounded-lg bg-ink-5/10 flex items-center justify-center border border-ink/5 shrink-0">
                      <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-ink-3" />
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-ink-3 uppercase tracking-wider truncate">BCL ID PASS // V2.4</div>
                  </div>
                  <span className="badge-green flex items-center gap-1 text-[10px] shrink-0">
                    <Zap className="w-3 h-3" /> SOVEREIGN NFC
                  </span>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-tr from-accent/30 to-brand/30 border border-white/10 flex items-center justify-center font-heading font-extrabold text-xl sm:text-2xl text-ink">
                      BU
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-surface border border-accent/20 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-fg" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-base sm:text-lg text-ink truncate">
                      builder.bcl
                    </div>
                    <div className="text-[11px] sm:text-xs text-ink-4 font-medium mb-1">Example Pass // Level 3 Pioneer</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-accent-fg">
                        {(stats?.total_points ?? user?.total_points ?? 250).toLocaleString()} XP
                      </span>
                      <span className="text-[11px] sm:text-xs text-ink-4">/ {(stats?.next_level_threshold ?? 500).toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="progress-track">
                    <div 
                      className="progress-fill shadow-[0_0_10px_rgba(0,245,160,0.5)]" 
                      style={{ 
                        width: `${Math.min(100, Math.round(((stats?.total_points ?? user?.total_points ?? 0) / Math.max(1, stats?.next_level_threshold ?? 100)) * 100))}%` 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-4">
                    <span>Progress to Level {(stats?.level ?? user?.level ?? 1) + 1}</span>
                    <span className="text-accent-fg font-bold">
                      {Math.min(100, Math.round(((stats?.total_points ?? user?.total_points ?? 0) / Math.max(1, stats?.next_level_threshold ?? 100)) * 100))}%
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="badge-blue text-[10px]">Developer Guild</span>
                  <span className="badge-green text-[10px]">Community Contributor</span>
                  <span className="badge-amber text-[10px]">Core Mentor</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-ink/5 bg-ink/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-ink-4 uppercase tracking-wider mb-1">Achievements</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg sm:text-xl font-bold font-heading text-ink num-mono">
                        {stats?.completed_tasks_count ?? 0}
                      </span>
                      <Medal className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-ink-4 uppercase tracking-wider mb-1">Reputation XP</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg sm:text-xl font-bold font-heading text-accent-fg num-mono">
                        {(stats?.total_points ?? user?.total_points ?? 0).toLocaleString()}
                      </span>
                      <TrendingUp className="w-4 h-4 text-accent-fg" />
                    </div>
                  </div>
                </div>

                {/* Footer Hash */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-ink/10 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-4 mb-0.5">Proof Identity</div>
                    <div className="font-mono text-[10px] sm:text-[11px] text-ink font-bold truncate">
                      {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : "Connect Wallet"}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-accent-fg/80 mt-0.5 truncate">BCL L2 Registry Verified</div>
                  </div>
                  <div className="p-1.5 bg-ink text-surface rounded-lg shrink-0">
                    <Code className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS TELEMETRY */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { 
            label: "Active Cohort", 
            value: platformStats?.total_users != null ? `${platformStats.total_users}` : "...", 
            desc: "Verified builders", 
            icon: Users, 
            color: "text-accent-fg" 
          },
          { 
            label: "Quests Available", 
            value: platformStats?.total_active_tasks != null ? `${platformStats.total_active_tasks}` : tasks.length > 0 ? `${tasks.length}` : "0", 
            desc: "Onchain quests", 
            icon: CheckCircle2, 
            color: "text-purple-500" 
          },
          { 
            label: "XP Distributed", 
            value: platformStats?.total_points_awarded != null ? `${platformStats.total_points_awarded.toLocaleString()} XP` : "0 XP", 
            desc: "Sovereign points", 
            icon: Zap, 
            color: "text-amber-500" 
          },
          { 
            label: "Domains Claimed", 
            value: platformStats?.total_domains_registered != null ? `${platformStats.total_domains_registered}` : "0", 
            desc: "BCL Domains Claimed", 
            icon: Calendar, 
            color: "text-blue-500" 
          }
        ].map((stat, i) => (
          <div key={i} className="flex flex-col p-3.5 sm:p-5 rounded-xl border border-ink/5 bg-surface shadow-sm hover:border-ink/10 transition-colors min-w-0">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
              <span className="text-[9px] sm:text-[10px] text-ink-4 uppercase tracking-wider font-bold truncate">{stat.label}</span>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${stat.color}`} />
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl text-ink font-bold font-heading tracking-tight mb-0.5 sm:mb-1 break-words">{stat.value}</span>
            <span className="text-[11px] sm:text-xs text-ink-4 truncate">{stat.desc}</span>
          </div>
        ))}
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] text-accent-fg uppercase tracking-widest font-bold mb-1.5">// Protocol Mechanics</div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-ink">How BCL Onchain Works</h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-3 max-w-md">
            A seamless 4-tier loop converting everyday university and web3 actions into permanent cryptographic accolades.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { num: "01", title: "Claim Your Identity", desc: "Reserve your unique yourname.bcl subdomain with zero gas fees. Pair your student ID and EVM wallet securely.", icon: IdCard, link: "Mint Identity pass", color: "text-accent-fg" },
            { num: "02", title: "Complete Quests", desc: "Design graphics, write deep-dive threads, host community spaces, test protocols, or push code commits.", icon: Layers, link: "Explore open bounties", color: "text-purple-500" },
            { num: "03", title: "Earn XP & Badges", desc: "Receive verifiable soulbound badges directly to your identity. Watch your global tier ascend dynamically onchain.", icon: Award, link: "Verify badge ledger", color: "text-amber-500" },
            { num: "04", title: "Unlock Rewards", desc: "Convert hard-earned XP into ecosystem grants, hardware stipends, international summit sponsorships, and exclusive swag.", icon: Gift, link: "View rewards vault", color: "text-blue-500" }
          ].map((step, i) => (
            <div key={i} className="flex flex-col p-5 sm:p-6 rounded-xl border border-ink/5 bg-surface shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className={`text-2xl sm:text-3xl font-heading font-bold opacity-30 ${step.color}`}>{step.num}</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink/5 flex items-center justify-center border border-ink/10">
                  <step.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${step.color}`} />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-ink mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-ink-4 mb-4 sm:mb-6 flex-1 leading-relaxed">{step.desc}</p>
              <button className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${step.color} hover:opacity-80 transition-opacity w-fit`}>
                {step.link} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED QUESTS */}
      <section className="space-y-6 sm:space-y-8" id="featured-quests">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] text-purple-500 uppercase tracking-widest font-bold mb-1.5">// Missions Available</div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-ink">Featured Quests</h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full max-w-full">
            <button className="px-3.5 sm:px-4 py-1.5 rounded-full bg-ink text-surface text-xs font-bold whitespace-nowrap">All Quests</button>
            <button className="px-3.5 sm:px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Community</button>
            <button className="px-3.5 sm:px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Design</button>
            <button className="px-3.5 sm:px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Content</button>
            <button className="px-3.5 sm:px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Developer</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="flex flex-col rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="badge-green capitalize text-xs">{task.category || "Quest"}</span>
                  <span className="px-2 py-0.5 sm:py-1 rounded bg-accent/10 text-accent-fg font-mono text-xs font-bold">+{task.points} XP</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-ink group-hover:text-accent-fg transition-colors">{task.title}</h3>
                <div className="text-xs sm:text-sm text-ink-4 mt-2 mb-4 sm:mb-6 flex-1 line-clamp-3 leading-relaxed">
                  <LinkifiedText text={task.description} />
                </div>
                <Link href={`/tasks/${task.id}`} className="w-full py-2.5 rounded-lg bg-ink/5 text-ink text-xs sm:text-sm font-semibold hover:bg-ink/10 transition-colors flex items-center justify-center gap-2">
                  View Quest <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 sm:p-8 text-center rounded-xl bg-surface border border-ink/5 space-y-3">
              <div className="text-xs sm:text-sm text-ink-4">Missions will populate as soon as protocol milestones are published.</div>
              <Link href="/tasks" className="btn-green inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 text-xs font-bold">
                Go to Quest Console <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. LEADERBOARD & GUILDS */}
      <section className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left: Leaderboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-accent-fg uppercase tracking-widest font-bold mb-1">// Verified Standings</div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-ink">Top Contributors</h3>
            </div>
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-accent-fg hover:underline shrink-0">
              View All <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
          
          <div className="flex flex-col space-y-2">
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 4).map((entry) => {
                const isMe = walletAddress && entry.wallet_address.toLowerCase() === walletAddress.toLowerCase();
                const avatar = entry.avatar_url || (isMe ? user?.avatar_url : null);

                return (
                  <div key={entry.rank} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg hover:bg-ink/5 transition-colors gap-2.5">
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/15 text-accent-fg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                        {entry.rank}
                      </div>

                      {/* PFP / Avatar */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-ink/10 flex items-center justify-center shrink-0 bg-surface shadow-sm">
                        {avatar ? (
                          avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:") ? (
                            <img
                              src={avatar}
                              alt={entry.username || "PFP"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm sm:text-base select-none leading-none">{avatar}</span>
                          )
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-600 to-accent text-white flex items-center justify-center font-heading font-bold text-xs sm:text-sm select-none">
                            {(entry.username || entry.wallet_address).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-semibold text-ink text-xs sm:text-sm truncate">
                            {entry.username ? (entry.username.endsWith(".bcl") ? entry.username : `${entry.username}.bcl`) : `${entry.wallet_address.slice(0, 6)}…${entry.wallet_address.slice(-4)}`}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg shrink-0" />
                        </div>
                        <span className="text-[11px] sm:text-xs text-ink-4 block truncate">Level {entry.level} Pioneer</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <span className="font-mono text-xs sm:text-sm font-bold text-accent-fg whitespace-nowrap">{entry.total_points.toLocaleString()} XP</span>
                      <span className="text-[9px] sm:text-[10px] text-ink-4 uppercase">Rank #{entry.rank}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs sm:text-sm text-ink-4">
                No contributors ranked yet. Complete quests to take rank #1!
              </div>
            )}
          </div>
        </div>

        {/* Right: Guilds (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div>
            <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-1">// Specializations</div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-ink">Campus Guilds</h3>
            <p className="text-xs sm:text-sm text-ink-4 mt-1.5 leading-relaxed">Collaborate directly with fellow LAUTECH engineers, designers, content writers, and community builders.</p>
          </div>
          
          <div className="space-y-2.5 sm:space-y-3">
            {[
              { name: "Smart Contracts & Protocols", desc: "Solidity & Cairo Bounties", icon: Terminal, color: "text-accent-fg", bg: "bg-accent/20", cat: "Developer" },
              { name: "Product Design & UX", desc: "Interface & Web3 Systems", icon: Palette, color: "text-purple-500", bg: "bg-purple-500/20", cat: "Design" },
              { name: "Content, Research & Threads", desc: "Deep Dives, Articles & Guides", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/20", cat: "Content" },
              { name: "Media, Spaces & Community", desc: "Outreach & Campus Engagement", icon: Megaphone, color: "text-amber-500", bg: "bg-amber-500/20", cat: "Community" },
            ].map((guild, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-xl border border-ink/5 bg-ink/5 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${guild.bg} ${guild.color} flex items-center justify-center shrink-0`}>
                    <guild.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-ink truncate">{guild.name}</h4>
                    <span className="text-[11px] sm:text-xs text-ink-4 block truncate">{guild.desc}</span>
                  </div>
                </div>
                <Link href={`/tasks?category=${guild.cat}`} className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-ink text-surface text-xs font-bold hover:bg-ink-3 transition-colors shrink-0">
                  Explore
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ECOSYSTEM PARTNERS */}
      <section className="space-y-6 sm:space-y-8">
        <div className="text-center max-w-xl mx-auto px-2">
          <div className="text-[10px] text-ink-4 uppercase tracking-widest font-bold mb-1.5">// Multi-Chain Network</div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-ink mb-2 sm:mb-3">Backed by Ecosystem Giants</h2>
          <p className="text-xs sm:text-sm text-ink-3 leading-relaxed">LAUTECH student attestations and credentials are recognized and verifiable across global Layer-1 and Layer-2 blockchains.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {[
            { name: "LAUTECH Hub", desc: "Campus Anchor", icon: Landmark, color: "text-accent-fg" },
            { name: "Ethereum", desc: "Base Protocol", icon: Layers, color: "text-purple-500" },
            { name: "Starknet", desc: "Cairo Ecosystem", icon: Hexagon, color: "text-amber-500" },
            { name: "Solana", desc: "High Speed Grants", icon: Network, color: "text-blue-500" },
            { name: "Base", desc: "Coinbase L2", icon: Hexagon, color: "text-blue-400" },
            { name: "Arbitrum", desc: "Rollup DAO", icon: Layers, color: "text-indigo-400" },
          ].map((partner, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-3.5 sm:p-6 rounded-xl border border-ink/5 bg-surface shadow-sm hover:border-ink/10 transition-colors text-center group">
              <partner.icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 opacity-80 group-hover:opacity-100 transition-opacity ${partner.color}`} />
              <span className="text-xs sm:text-sm font-bold text-ink truncate max-w-full">{partner.name}</span>
              <span className="text-[9px] sm:text-[10px] text-ink-4 uppercase mt-0.5 sm:mt-1 truncate max-w-full">{partner.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA CONVERSION */}
      <section className="relative rounded-2xl bg-gradient-to-br from-page via-surface to-page border border-ink/10 p-5 sm:p-8 lg:p-12 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10">
          <div className="flex flex-col text-left max-w-xl">
            <span className="text-xs font-bold font-mono text-accent-fg uppercase tracking-wider mb-2 sm:mb-3">// Ready to leave your mark?</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-ink mb-3 sm:mb-4">Claim your verified .bcl name and kickstart your Web3 portfolio today.</h2>
            <p className="text-xs sm:text-sm text-ink-3 leading-relaxed">Instant onboarding in 30 seconds. Connect your university email or EVM wallet to reserve credentials before global mint caps close.</p>
          </div>
          
          <div className="w-full lg:max-w-md flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row rounded-xl sm:rounded-lg bg-page border border-ink/10 p-1.5 sm:p-1 shadow-inner gap-2 sm:gap-0">
              <div className="flex items-center flex-1 min-w-0">
                <input 
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-transparent px-3 sm:px-4 py-2 text-ink font-mono text-sm focus:outline-none placeholder:text-ink/30 min-w-0" 
                  placeholder="yourhandle" 
                  type="text"
                />
                <span className="pr-3 flex items-center font-mono text-sm text-accent-fg font-bold shrink-0">.bcl</span>
              </div>
              <button 
                onClick={handleClaim}
                disabled={isCheckingHandle}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-2 rounded-lg sm:rounded-md bg-ink text-surface text-sm font-bold hover:bg-ink-3 transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isCheckingHandle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  "Claim"
                )}
              </button>
            </div>
            {claimStatus && (
              <span className={`text-xs font-mono font-medium ${claimStatus.includes('✓') ? 'text-accent-fg' : 'text-red-500'}`}>
                {claimStatus}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}