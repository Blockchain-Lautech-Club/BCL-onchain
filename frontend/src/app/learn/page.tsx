"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen, CheckCircle2, Award, Zap, Lock, ExternalLink,
  ArrowRight, Play, Users, Clock, Shield, Star, ChevronDown, ChevronUp
} from "lucide-react";

const TRACKS = ["All Tracks", "Blockchain Basics", "Solidity & EVM", "Web3 Product & UI/UX", "Smart Contract Security", "Zero Knowledge & L2s", "Community Mgmt"];

const COURSES = [
  {
    id: "c1", track: "Blockchain Basics", level: "Beginner", xp: 250, time: "45 min",
    title: "Blockchain Fundamentals & Cryptographic Primitives",
    desc: "Deep dive into hash functions, Merkle trees, public/private keys, and state transition consensus engines from first principles.",
    grade: "98% (Exemplary)", soulbound: true, status: "complete",
    cta: "View Certificate Onchain", ctaIcon: <ExternalLink className="w-3.5 h-3.5" />,
    tags: ["Blockchain Basics"],
  },
  {
    id: "c2", track: "Web3 Product & UI/UX", level: "Intermediate", xp: 400, time: "2.5 hrs",
    title: "Building Responsive Web3 UIs with Tailwind & Wagmi",
    desc: "Connect browser wallets cleanly, manage multimodal transaction flows, listen to indexed contract events, and architect resilient mobile dApps.",
    prereq: "React hooks & CSS fundamentals", extra: "Includes Figma UI kit",
    status: "available", cta: "Start Track",
    tags: ["Design & Frontend"],
  },
  {
    id: "c3", track: "Solidity & EVM", level: "Beginner–Intermediate", xp: 450, time: "3 hrs",
    title: "Solidity 101: Syntax, Memory & Gas Optimization",
    desc: "Master storage slots, memory caching, custom errors versus require statements, and use the in-browser test harness for instant gas benchmarking.",
    extra: "Includes in-browser automated test runner (Foundry-Base)",
    status: "available", cta: "Start Track",
    tags: ["Solidity Core"],
  },
  {
    id: "c4", track: "Community Mgmt", level: "All Levels", xp: 100, time: "1.5 hrs",
    title: "Navigating DAOs, Governance & Tokenomics",
    desc: "Analyze emission schedules, quadratic voting math, multi-sig operations, and decentralized treasury preservation frameworks.",
    status: "available", cta: "Start Track",
    tags: ["Community & Economics"],
  },
  {
    id: "c5", track: "Smart Contract Security", level: "Advanced", xp: 800, time: "4 hrs",
    title: "Formal Verification & Invariant Testing with Foundry",
    desc: "Construct stateful fuzzing campaigns, write invariant rules, verify mathematical bounds of AMMs, and uncover complex edge-case liquidations.",
    status: "available", cta: "Start Track",
    tags: ["Auditing Guild"],
  },
  {
    id: "c6", track: "Zero Knowledge & L2s", level: "Advanced", xp: 700, time: "5 hrs",
    title: "ZK Circuits & SNARK Proof Construction",
    desc: "Build zero-knowledge circuits from scratch using Circom and SnarkJS. Understand Groth16, PLONK, and integrate proofs into Solidity verifiers.",
    status: "locked", cta: "Locked — Complete Solidity 101 first",
    tags: ["Zero Knowledge & L2s"],
  },
];

const ACTIVE_COURSE = {
  title: "Smart Contract Reentrancy & Security: Zero to Auditor",
  track: "Security Guild", level: "Intermediate", modules: 4, xp: 599,
  tags: ["Active Quests", "Security Guild"],
  desc: "Deconstruct high-profile exploits, master the Checks-Effects-Interactions pattern, and exploit realistic reentrancy honey-pots inside an isolated WebAssembly sandbox.",
  progress: 75, currentModule: 3, milestone: "Writing exploit payload for MockVault.sol",
};

const DIPLOMAS = [
  { name: "Cryptographic Primitives", token: "#0482", verified: true, color: "from-blue-600 to-cyan-500" },
  { name: "Onchain Governance L1", token: "#0219", verified: true, color: "from-purple-600 to-pink-500" },
];

const PARTNERS = ["Base LAU", "Scroll Labs", "Polygon Guild"];

export default function LearnPage() {
  const { walletAddress } = useAuth();
  const [activeTrack, setActiveTrack] = useState("All Tracks");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const filtered = COURSES.filter(
    (c) => activeTrack === "All Tracks" || c.track === activeTrack
  );

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#111827] via-surface to-[#0a0e1a] border border-white/8 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),_transparent_60%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-green text-[10px]">BCL VERIFIED CURRICULUM</span>
            <span className="text-[10px] text-ink-5">· Cohort 2025</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink mb-2">
            BCL Learning Academy
          </h1>
          <p className="text-sm text-ink-4 max-w-xl mb-6">
            Interactive Web3 curriculum built for campus minds. Master development, design,
            tokenomics, and security through hands-on quests.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { v: "18", l: "Modules Open", icon: <BookOpen className="w-4 h-4" /> },
              { v: "4", l: "Courses Cleared", icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
              { v: "2", l: "Diplomas SBTs", icon: <Award className="w-4 h-4 text-purple-400" /> },
              { v: "1,150", l: "Academic XP", icon: <Zap className="w-4 h-4 text-yellow-400" /> },
            ].map((s) => (
              <div key={s.l} className="stat-card">
                <div className="flex items-center gap-1.5 text-ink-5 text-[10px] uppercase tracking-wider mb-1">
                  {s.icon} {s.l}
                </div>
                <div className="text-2xl font-extrabold text-ink font-heading num-mono">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main: Tracks + Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Track Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold font-heading text-ink flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-fg" /> Explore Learning Tracks
              </h2>
              <span className="text-[10px] text-ink-5">Updated every Monday at 08:00 UTC</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTrack(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeTrack === t
                      ? "bg-accent text-white"
                      : "bg-subtle border border-white/8 text-ink-4 hover:border-accent/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Active Quest Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0d1a0d] to-surface border border-green-500/20 p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-green text-[10px]">● Active Quests</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-semibold">Security Guild</span>
              <span className="text-[10px] text-ink-5">Intermediate · 4 Modules</span>
              <span className="badge-amber text-[10px]">+{ACTIVE_COURSE.xp} XP</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold font-heading text-ink">{ACTIVE_COURSE.title}</h3>
              <p className="text-sm text-ink-4 mt-1">{ACTIVE_COURSE.desc}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-5">
                <span>Module {ACTIVE_COURSE.currentModule} of {ACTIVE_COURSE.modules} in progress</span>
                <span className="text-accent-fg font-semibold">{ACTIVE_COURSE.progress}% Complete</span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all"
                  style={{ width: `${ACTIVE_COURSE.progress}%` }}
                />
              </div>
              <div className="text-[11px] text-ink-5">Current milestone: {ACTIVE_COURSE.milestone}</div>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Play className="w-4 h-4" /> Resume Interactive Sandbox
            </button>
          </div>

          {/* Course Catalog */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold font-heading text-ink">Course Catalog</h2>
              <span className="text-xs text-ink-5">Showing {filtered.length} of {COURSES.length} courses</span>
            </div>
            <div className="space-y-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-2xl border transition-all ${
                    c.status === "complete"
                      ? "bg-surface border-green-500/15"
                      : c.status === "locked"
                      ? "bg-surface/60 border-white/6 opacity-70"
                      : "bg-surface border-white/8 hover:border-accent/20"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {c.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] text-accent-fg font-semibold">{tag}</span>
                          ))}
                          <span className="text-[10px] text-ink-5">{c.level}</span>
                          <span className="flex items-center gap-1 text-[10px] text-ink-5"><Clock className="w-3 h-3" />{c.time}</span>
                          <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-semibold"><Zap className="w-3 h-3" />+{c.xp} XP</span>
                        </div>
                        <h3 className="font-bold text-ink text-sm">{c.title}</h3>
                        <p className="text-xs text-ink-4 mt-1">{c.desc}</p>
                        {c.grade && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs text-green-400 font-semibold">Grade: {c.grade}</span>
                          </div>
                        )}
                        {c.prereq && (
                          <div className="text-[11px] text-ink-5 mt-1.5 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Prerequisite: {c.prereq}
                          </div>
                        )}
                        {c.extra && (
                          <div className="text-[11px] text-accent-fg mt-0.5 font-mono">&#8249;/&#8250; {c.extra}</div>
                        )}
                      </div>
                      {c.soulbound && (
                        <span className="px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/25 text-[10px] text-purple-300 font-semibold shrink-0">
                          Soulbound Issued
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      {c.status === "locked" ? (
                        <button disabled className="btn-outline flex items-center gap-2 opacity-50 cursor-not-allowed text-sm">
                          <Lock className="w-3.5 h-3.5" /> {c.cta}
                        </button>
                      ) : c.status === "complete" ? (
                        <button className="btn-outline flex items-center gap-2 text-sm">
                          {c.ctaIcon} {c.cta}
                        </button>
                      ) : (
                        <button className="btn-primary flex items-center gap-2 text-sm">
                          <ArrowRight className="w-3.5 h-3.5" /> {c.cta}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
                        className="ml-auto text-ink-5 hover:text-ink transition-colors"
                      >
                        {expandedCourse === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {expandedCourse === c.id && (
                    <div className="border-t border-white/6 px-5 py-4 space-y-2 text-xs text-ink-4">
                      <p>This course issues a verifiable Soulbound Credential upon completion, recognised by BCL ecosystem partners for internship and fellowship opportunities.</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {["Self-paced", "WASM Sandbox", "Auto-graded", "NFT Certificate"].map((f) => (
                          <span key={f} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-ink-5 text-[10px]">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contribute CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-subtle to-surface border border-white/8 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold font-heading text-ink">Ready to teach or contribute a module?</h3>
              <p className="text-xs text-ink-4 mt-1">BCL curriculum is community-driven. Submit course PRs, earn reviewer grants in USDC, and establish campus technical leadership.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn-outline text-sm">Read Syllabus Specs</button>
              <button className="btn-primary text-sm">Submit Course Proposal</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Verified Credentials */}
          <div className="rounded-2xl bg-surface border border-white/8 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-fg" />
              <h3 className="font-bold font-heading text-ink text-sm">Verified Credentials</h3>
            </div>
            <p className="text-xs text-ink-4">
              Every completed course issues a verifiable Soulbound Credential directly bound to your{" "}
              <span className="text-accent-fg font-semibold">.bcl</span> handle, recognized by partner companies for internships and fellowships.
            </p>
            <div className="rounded-xl bg-subtle border border-white/6 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-5 uppercase tracking-wider">Ecosystem Guild Partners</span>
                <span className="text-[10px] text-accent-fg font-semibold">12 Hiring</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PARTNERS.map((p) => (
                  <span key={p} className="px-2 py-1 rounded-lg bg-accent/10 border border-accent/15 text-[10px] text-accent-fg font-semibold">{p}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-ink-5">
              <Lock className="w-3 h-3" /> ERC-5192 Non-Transferable Token Standard
            </div>
          </div>

          {/* My Active Diplomas */}
          <div className="rounded-2xl bg-surface border border-white/8 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-heading text-ink text-sm">My Active Diplomas</h3>
              <span className="badge-green text-[10px]">{DIPLOMAS.length} Claimed</span>
            </div>
            {DIPLOMAS.map((d) => (
              <div key={d.token} className="flex items-center gap-3 p-3 rounded-xl bg-subtle border border-white/6">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${d.color} flex items-center justify-center shrink-0`}>
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">{d.name}</div>
                  <div className="text-[10px] text-ink-5">Token {d.token}</div>
                </div>
                {d.verified && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              </div>
            ))}
            <button className="w-full btn-outline text-xs flex items-center justify-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> View All in Explorer
            </button>
          </div>

          {/* Need Tutoring */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/30 to-surface border border-purple-500/20 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">❓</span>
              <h3 className="font-bold font-heading text-ink text-sm">Need Tutoring?</h3>
            </div>
            <p className="text-xs text-ink-4">Get unblocked directly on Discord with peer office hours held Tuesday & Thursday at the campus lab.</p>
            <button className="w-full btn-primary text-sm flex items-center justify-center gap-2">
              <Users className="w-3.5 h-3.5" /> Join Dev Office Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
