"use client";
import React, { useState } from "react";
import Link from "next/link";
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
  Fingerprint
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LandingHero() {
  const { walletAddress, connectWallet } = useAuth();
  const [handle, setHandle] = useState("");
  const [claimStatus, setClaimStatus] = useState("");

  const handleClaim = () => {
    if (handle.trim()) {
      setClaimStatus(`✓ ${handle}.bcl is available! Verification dispatched to contract.`);
    } else {
      setClaimStatus("Please enter a valid handle to claim.");
    }
  };

  return (
    <div className="space-y-20 md:space-y-32 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 md:pt-16">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent/[0.06] blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-10 w-[300px] h-[200px] bg-brand/[0.05] blur-[100px] pointer-events-none rounded-full" />

        <div className="relative grid lg:grid-cols-12 gap-12 items-center">
          {/* Left - Hero Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border border-accent/20 bg-surface shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-3">EPOCH 04 ACTIVE</span>
              <span className="text-ink-4 text-[10px]">•</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-fg">GASLESS SOVEREIGN IDENTITY</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-ink leading-[1.05] tracking-tight">
              Turn your BCL participation into{" "}
              <span className="text-gradient-bcl">reputation.</span>
            </h1>

            <p className="text-sm sm:text-base text-ink-3 leading-relaxed max-w-xl">
              Complete quests, earn XP, collect achievements, unlock rewards, and build your sovereign, verifiable builder identity in the Blockchain Community LAUTECH ecosystem.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={!walletAddress ? connectWallet : undefined}
                className="btn-green flex items-center gap-2 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-green-500/20 transition-all"
              >
                <Fingerprint className="w-4 h-4" />
                Get Started
              </button>
              <Link href="/tasks" className="btn-outline flex items-center gap-2 px-6 py-3 text-sm font-semibold">
                <Compass className="w-4 h-4 text-accent-fg" />
                Explore Quests
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-sQYGniCul46McM9xf_HWT-3jfnmOlpkkQDJVJh03qiPQlO7VEIuvu8kKqQonfq-YBmxrV3aan9plLZPTI2O4TIBEIvMUq0I6rQWf66rzYXVU_31JnL-LLXinwYFP_2j4pE4a8exRm6LPwnm7VH-AmDPk003WdZxnIygNX1Ccx6NsKvVnc3VB_HV89dWlbp6r8G8_q6PtpwjN_3szEivpGfNIW_o-fX3f4m776GLZlZrnAaq5Yf_E" alt="User" />
                <img className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBD0rOS_6KEK1wtn4A4kCgl7MXw8qCl3ogigyMiEJARVJt9U8G7eqLNhRx1bpnHjbQPAQ9Isp9Vfxe0aUFYJqRxLvprcAu-ZGqCcK2zzl5MEFX7A2RPpJnqQZ5pUW9w14vX4d5n2rQkLR8pztxQLtijGmgOYB0fo6c3tj-Iqw3BTMaBEuyfD7Q_C3Dmf0L26tXp6lWeioxa2nED6LJFKMRl4NLHFCdA4YDM8_TUIV2gI7-AzP8YuINm" alt="User" />
                <img className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhzu9AtkhkCVcS5Zh2ZSNCCGbZeuYujUspOsRuOkxmkG06zWPpdn-wFhr887EuWDOHccHhUJ6OIe4YjzLJUUfcc6zGeHLVL7qQb6Jx8nJgdYuRQAAhnW7cgSrxSZF2-u2ERvVzIFU8oms6KJxg1SlISw83M35Tobc2mlot9541K3bDAdg4xpYaH-eF1C3kMRjh3pgibQ7yDechAHofq-9IYBQ-YuET4yzCxlDbwGBkUU2NRQD83PVm" alt="User" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-ink">1,420+ Onchain Passes Minted</span>
                <span className="text-[10px] text-accent-fg">Zero knowledge proofs enabled</span>
              </div>
            </div>
          </div>

          {/* Right — BCL ID Card */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-brand/40 to-purple-500/20 rounded-2xl blur-xl transition-all duration-700 group-hover:blur-2xl" />
            <div className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface/90 backdrop-blur-xl p-6 overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-5">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-8 rounded-lg bg-ink-5/10 flex items-center justify-center border border-ink/5">
                      <Terminal className="w-5 h-5 text-ink-3" />
                    </div>
                    <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">BCL ID PASS // V2.4</div>
                  </div>
                  <span className="badge-green flex items-center gap-1">
                    <Zap className="w-3 h-3" /> SOVEREIGN NFC
                  </span>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img className="w-20 h-20 rounded-xl object-cover border border-white/10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4tQpTETNo4xosVkCSylV1WC_D84A6fazWNUS3cMuSiCMqq-Y9cve-ZWxFguehJFc1TkpCEdhJ_y_-MeRRMMyMfzy69ACgm86SD8i1cZ6ZRbtdt88ZSGZuZliXYXNTDuzNfMO3swbTxAmg33PUa6g1kK28BtfjVSb8ayEq-3AJP3s608uQ1TDEIxBWUJKA-yHgtPuvCSwRuJp9sepk3BzVBCTCCHXEAlhAJEcsLXhM-rKNkx5wTm7G" alt="lautech avatar" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-surface border border-accent/20 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-lg text-ink truncate">lautech.bcl</div>
                    <div className="text-xs text-ink-4 font-medium mb-1">Level 14 Pioneer</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-accent-fg">2,840 XP</span>
                      <span className="text-xs text-ink-4">/ 3,200 XP</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="progress-track">
                    <div className="progress-fill shadow-[0_0_10px_rgba(0,245,160,0.5)]" style={{ width: "78%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-4">
                    <span>Progress to Tier 15</span>
                    <span className="text-accent-fg font-bold">78%</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="badge-blue">Developer Guild</span>
                  <span className="badge-green">Community Contributor</span>
                  <span className="badge-amber">Core Mentor</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-ink/5 bg-ink/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-ink-4 uppercase tracking-wider mb-1">Achievements</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-bold font-heading text-ink num-mono">12</span>
                      <Medal className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-ink-4 uppercase tracking-wider mb-1">Reputation Score</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-bold font-heading text-accent-fg num-mono">92<span className="text-sm text-ink-4">/100</span></span>
                      <TrendingUp className="w-4 h-4 text-accent-fg" />
                    </div>
                  </div>
                </div>

                {/* Footer Hash */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-ink/10">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-4 mb-0.5">Proof Hash</div>
                    <div className="font-mono text-[11px] text-ink font-bold">0x4b78...9a2e</div>
                    <div className="text-[10px] text-accent-fg/80 mt-0.5">LAUTECH L2 Settlement</div>
                  </div>
                  <div className="p-1.5 bg-ink text-surface rounded-lg">
                    <Code className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS TELEMETRY */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Cohort", value: "4,800+", desc: "Students & developers", icon: Users, color: "text-accent-fg" },
          { label: "Quests Verified", value: "38,400+", desc: "Code submissions", icon: CheckCircle2, color: "text-purple-500" },
          { label: "XP Distributed", value: "1.2M+", desc: "Sovereign tokens", icon: Zap, color: "text-amber-500" },
          { label: "Community Events", value: "140+", desc: "Campus buildathons", icon: Calendar, color: "text-blue-500" }
        ].map((stat, i) => (
          <div key={i} className="flex flex-col p-5 rounded-xl border border-ink/5 bg-surface shadow-sm hover:border-ink/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-3xl text-ink font-bold font-heading tracking-tight mb-1">{stat.value}</span>
            <span className="text-xs text-ink-4">{stat.desc}</span>
          </div>
        ))}
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] text-accent-fg uppercase tracking-widest font-bold mb-2">// Protocol Mechanics</div>
            <h2 className="text-3xl font-heading font-bold text-ink">How BCL Onchain Works</h2>
          </div>
          <p className="text-sm text-ink-3 max-w-md">
            A seamless 4-tier loop converting everyday university and web3 actions into permanent cryptographic accolades.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { num: "01", title: "Claim Your Identity", desc: "Reserve your unique yourname.bcl subdomain with zero gas fees. Pair your student ID and EVM wallet securely.", icon: IdCard, link: "Mint Identity pass", color: "text-accent-fg" },
            { num: "02", title: "Complete Quests", desc: "Solve algorithmic tasks, push commits to BCL GitHub repos, attend campus hack nights, or host developer spaces.", icon: Terminal, link: "Explore open bounties", color: "text-purple-500" },
            { num: "03", title: "Earn XP & Badges", desc: "Receive verifiable soulbound badges directly to your identity. Watch your global tier ascend dynamically onchain.", icon: Award, link: "Verify badge ledger", color: "text-amber-500" },
            { num: "04", title: "Unlock Rewards", desc: "Convert hard-earned XP into ecosystem grants, hardware stipends, international summit sponsorships, and exclusive swag.", icon: Gift, link: "View rewards vault", color: "text-blue-500" }
          ].map((step, i) => (
            <div key={i} className="flex flex-col p-6 rounded-xl border border-ink/5 bg-surface shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-3xl font-heading font-bold opacity-30 ${step.color}`}>{step.num}</span>
                <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center border border-ink/10">
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">{step.title}</h3>
              <p className="text-sm text-ink-4 mb-6 flex-1">{step.desc}</p>
              <button className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${step.color} hover:opacity-80 transition-opacity w-fit`}>
                {step.link} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED QUESTS */}
      <section className="space-y-8" id="featured-quests">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] text-purple-500 uppercase tracking-widest font-bold mb-2">// Missions Available</div>
            <h2 className="text-3xl font-heading font-bold text-ink">Featured Quests</h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button className="px-4 py-1.5 rounded-full bg-ink text-surface text-xs font-bold whitespace-nowrap">All Quests</button>
            <button className="px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Beginner</button>
            <button className="px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Developer</button>
            <button className="px-4 py-1.5 rounded-full bg-surface border border-ink/10 text-ink-3 text-xs font-bold whitespace-nowrap hover:bg-ink/5">Governance</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quest 1 */}
          <div className="flex flex-col rounded-xl bg-surface border border-ink/5 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="badge-green">Onboarding</span>
              <span className="px-2 py-1 rounded bg-accent/10 text-accent-fg font-mono text-xs font-bold">+300 XP</span>
            </div>
            <h3 className="text-lg font-semibold text-ink group-hover:text-accent-fg transition-colors">Welcome to BCL Ecosystem</h3>
            <p className="text-sm text-ink-4 mt-2 mb-6 flex-1">Join the community Discord, follow the official X account, and set up your student sovereign profile handle.</p>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-ink-4">
                <span>Completion rate</span>
                <span className="text-accent-fg font-semibold">2/3 Done</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-ink/10">
                <div className="h-full bg-accent-fg rounded-full w-2/3" />
              </div>
            </div>
            <button className="w-full py-2.5 rounded-lg bg-ink/5 text-ink text-sm font-semibold hover:bg-ink/10 transition-colors flex items-center justify-center gap-2">
              Continue Quest <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Quest 2 */}
          <div className="flex flex-col rounded-xl bg-surface border border-ink/5 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="badge-amber">Fundamentals</span>
              <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 font-mono text-xs font-bold">+150 XP</span>
            </div>
            <h3 className="text-lg font-semibold text-ink group-hover:text-amber-500 transition-colors">Blockchain 101 Interactive Quiz</h3>
            <p className="text-sm text-ink-4 mt-2 mb-6 flex-1">Demonstrate foundational knowledge of consensus algorithms, cryptographic hashes, and EVM architecture basics.</p>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-ink-4">
                <span>Estimated time</span>
                <span className="text-ink font-semibold">12 mins</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-ink/10" />
            </div>
            <button className="btn-green w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
              Start Quiz
            </button>
          </div>

          {/* Quest 3 */}
          <div className="flex flex-col rounded-xl bg-surface border border-ink/5 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="badge-blue">Engineering</span>
              <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 font-mono text-xs font-bold">+750 XP</span>
            </div>
            <h3 className="text-lg font-semibold text-ink group-hover:text-purple-500 transition-colors">Build Your First DApp</h3>
            <p className="text-sm text-ink-4 mt-2 mb-6 flex-1">Deploy an audited smart contract, connect a front-end interface, and submit the verified repository hash.</p>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-ink-4">
                <span>Reward item</span>
                <span className="text-purple-500 font-semibold">Rare Builder NFT</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-ink/10">
                <div className="h-full bg-purple-500 rounded-full w-1/4" />
              </div>
            </div>
            <button className="w-full py-2.5 rounded-lg bg-ink/5 text-ink text-sm font-semibold hover:bg-ink/10 transition-colors flex items-center justify-center gap-2">
              Review Criteria <Code className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. LEADERBOARD & GUILDS */}
      <section className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Leaderboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl bg-surface border border-ink/5 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-accent-fg uppercase tracking-widest font-bold mb-1">// Verified Standings</div>
              <h3 className="text-2xl font-heading font-bold text-ink">Top Contributors</h3>
            </div>
            <Link href="/leaderboard" className="flex items-center gap-1 text-sm font-semibold text-accent-fg hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex flex-col space-y-2">
            {[
              { rank: 1, name: "samuel.bcl", level: "L18 • 46 Quests", xp: "4,120 XP", role: "Top Dev Guild", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoAenEh4xab8qcLXXgGypPFko5EoCpoXqmcupK2zz7-NC0gBqxxcddzFRUtKnDrGoDks51mADnldW1O2aTaWV7TpzZyCQin7ZefZ2w5TA8krOotc0MDqfaqKFEM04AhzVwtCXpxFbRINJ52g0LJnKEJKmESMIRyivUck6RIUllLN3w9j5DR3pqU9tpyB2hZ6I72ZlQs0vYJIG9jVtCZioZ1CjKCuepESuyBUDXfcf-pF1f_W67UG7r", color: "text-amber-500", bg: "bg-amber-500/10" },
              { rank: 2, name: "amina.bcl", level: "L16 • 39 Quests", xp: "3,650 XP", role: "Lead Designer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHyVm8V_Sj-ibN4pe1npL6Nwl0Yqpe8slkhKBYlSROKyX47kjd5oY_hPgp7OeUFXUY5gdun2yUO4c93L0FaTsvgKPdwWd4ad1LBSfT4nAqigLmSvtBIvUCENXrvG9lnHufWZjMAqT6ID5fQh-7cIc9V6Y1WUFNXBc5Lz_x5L8PoC4VcDXyFdg8Kxlt0cWqLCdi_MPKn8AQ4bLhN8XQA0dqECJ9UVR17BSK2vMdS7YIbtxZSdthikm6", color: "text-ink-3", bg: "bg-ink/5" },
              { rank: 3, name: "tobi.bcl", level: "L15 • 34 Quests", xp: "3,110 XP", role: "Smart Contracts", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBs7XnzeU2-tPsOBUVXMnPTTQ83B6AGmN3UW2ZguOoQmyfN7oIZjw0ifL9yTk_OVQsOgQ0BTstinEggqG9-49tb6mcMAAbi3sZ5HHUDeHKuXY_qT8cpMuX7k7Dw6OqaSDmZ5jJa3ryCBegqwsUEjhVFNhjH8D_S8wtwEl62WPBs63BCobSJ-dDLxp0Re-NCHH3GAzEaI-nHquMLWhcXPUFLwkOInNG9qqm3h2ZTg08xVofBPC1NVoxT", color: "text-orange-400", bg: "bg-orange-400/10" },
            ].map((user) => (
              <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg hover:bg-ink/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full ${user.bg} ${user.color} flex items-center justify-center font-bold text-sm shrink-0`}>
                    {user.rank}
                  </div>
                  <img src={user.img} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink">{user.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" />
                    </div>
                    <span className="text-xs text-ink-4">{user.level}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-mono text-sm font-bold ${user.color}`}>{user.xp}</span>
                  <span className="text-[10px] text-ink-4 uppercase">{user.role}</span>
                </div>
              </div>
            ))}
            
            {/* You (lautech) row */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20 mt-2">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent-fg flex items-center justify-center font-bold text-sm shrink-0">4</div>
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4tQpTETNo4xosVkCSylV1WC_D84A6fazWNUS3cMuSiCMqq-Y9cve-ZWxFguehJFc1TkpCEdhJ_y_-MeRRMMyMfzy69ACgm86SD8i1cZ6ZRbtdt88ZSGZuZliXYXNTDuzNfMO3swbTxAmg33PUa6g1kK28BtfjVSb8ayEq-3AJP3s608uQ1TDEIxBWUJKA-yHgtPuvCSwRuJp9sepk3BzVBCTCCHXEAlhAJEcsLXhM-rKNkx5wTm7G" alt="lautech" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-accent-fg">lautech.bcl (You)</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" />
                  </div>
                  <span className="text-xs text-ink-4">L14 • 28 Quests Done</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-sm font-bold text-accent-fg">2,840 XP</span>
                <span className="text-[10px] text-amber-500 uppercase">360 XP to Top 3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Guilds (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl bg-surface border border-ink/5 p-6 shadow-sm space-y-6">
          <div>
            <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-1">// Specializations</div>
            <h3 className="text-2xl font-heading font-bold text-ink">Campus Guilds</h3>
            <p className="text-sm text-ink-4 mt-2">Collaborate directly with fellow LAUTECH engineers, designers, content writers, and community builders.</p>
          </div>
          
          <div className="space-y-3">
            {[
              { name: "Smart Contracts & Rust", count: "340 Active Builders", icon: Terminal, color: "text-accent-fg", bg: "bg-accent/20", btn: "Full" },
              { name: "Product Design & UX", count: "185 UI Creators", icon: Palette, color: "text-purple-500", bg: "bg-purple-500/20", btn: "Join" },
              { name: "DevRel & Media", count: "210 Contributors", icon: Megaphone, color: "text-amber-500", bg: "bg-amber-500/20", btn: "Join" },
            ].map((guild, i) => (
              <div key={i} className="p-4 rounded-xl border border-ink/5 bg-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${guild.bg} ${guild.color} flex items-center justify-center`}>
                    <guild.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{guild.name}</h4>
                    <span className="text-xs text-ink-4">{guild.count}</span>
                  </div>
                </div>
                {guild.btn === "Full" ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-ink-4 bg-ink/10 px-3 py-1.5 rounded-full">Full</span>
                ) : (
                  <button className="px-4 py-1.5 rounded-full bg-ink text-surface text-xs font-bold hover:bg-ink-3 transition-colors">Join</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ECOSYSTEM PARTNERS */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="text-[10px] text-ink-4 uppercase tracking-widest font-bold mb-2">// Multi-Chain Network</div>
          <h2 className="text-3xl font-heading font-bold text-ink mb-3">Backed by Ecosystem Giants</h2>
          <p className="text-sm text-ink-3">LAUTECH student attestations and credentials are recognized and verifiable across global Layer-1 and Layer-2 blockchains.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "LAUTECH Hub", desc: "Campus Anchor", icon: Landmark, color: "text-accent-fg" },
            { name: "Ethereum", desc: "Base Protocol", icon: Layers, color: "text-purple-500" },
            { name: "Starknet", desc: "Cairo Ecosystem", icon: Hexagon, color: "text-amber-500" },
            { name: "Solana", desc: "High Speed Grants", icon: Network, color: "text-blue-500" },
            { name: "Base", desc: "Coinbase L2", icon: Hexagon, color: "text-blue-400" },
            { name: "Arbitrum", desc: "Rollup DAO", icon: Layers, color: "text-indigo-400" },
          ].map((partner, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-6 rounded-xl border border-ink/5 bg-surface shadow-sm hover:border-ink/10 transition-colors text-center group">
              <partner.icon className={`w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity ${partner.color}`} />
              <span className="text-sm font-bold text-ink">{partner.name}</span>
              <span className="text-[10px] text-ink-4 uppercase mt-1">{partner.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA CONVERSION */}
      <section className="relative rounded-2xl bg-gradient-to-br from-page via-surface to-page border border-ink/10 p-8 lg:p-12 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex flex-col text-left max-w-xl">
            <span className="text-xs font-bold font-mono text-accent-fg uppercase tracking-wider mb-3">// Ready to leave your mark?</span>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-ink mb-4">Claim your verified .bcl name and kickstart your builder portfolio today.</h2>
            <p className="text-sm text-ink-3">Instant onboarding in 30 seconds. Connect your university email or EVM wallet to reserve credentials before global mint caps close.</p>
          </div>
          
          <div className="w-full lg:w-auto min-w-[320px] max-w-md flex flex-col space-y-3">
           <div className="flex rounded-lg bg-page border border-ink/10 p-1 shadow-inner">
              <input 
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-transparent px-4 py-2 text-ink font-mono text-sm focus:outline-none placeholder:text-ink/30" 
                placeholder="yourhandle" 
                type="text"
              />
              <span className="px-3 flex items-center font-mono text-sm text-accent-fg font-bold">.bcl</span>
              <button 
                onClick={handleClaim}
                className="px-6 py-2 rounded-md bg-ink text-surface text-sm font-bold hover:bg-ink-3 transition-colors shrink-0"
              >
                Claim
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