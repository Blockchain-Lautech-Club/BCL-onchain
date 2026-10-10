"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Compass, Users, CheckCircle2, Shield, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LandingHero() {
  const { walletAddress, connectWallet } = useAuth();
  const [handle, setHandle] = useState("");

  return (
    <section className="relative pt-10 pb-16 md:pt-16 md:pb-24">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent/[0.06] blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-20 right-10 w-[300px] h-[200px] bg-brand/[0.05] blur-[100px] pointer-events-none rounded-full" />

      <div className="relative grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 w-fit">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-3">EPOCH 04 ACTIVE</span>
            <span className="w-1 h-1 rounded-full bg-ink-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-fg">SEASON 2: ACCELERATION</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-ink leading-[1.05] tracking-tight">
            Turn your BCL participation into{" "}
            <span className="text-gradient-bcl">reputation.</span>
          </h1>

          <p className="text-sm sm:text-base text-ink-3 leading-relaxed max-w-xl">
            Complete quests, earn XP, collect achievements, unlock rewards, and build your sovereign, verifiable builder identity in the Blockchain Community LAUTECH ecosystem.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={!walletAddress ? connectWallet : undefined}
              className="btn-green flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Zap className="w-4 h-4" />
              Get Started
            </button>
            <Link href="/tasks" className="btn-outline flex items-center gap-2 px-5 py-2.5 text-sm">
              <Compass className="w-4 h-4 text-accent-fg" />
              Explore Quests
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-page bg-gradient-to-br from-purple-500 to-blue-600" />
              ))}
            </div>
            <span className="text-xs text-ink-4">
              <span className="text-ink font-semibold">1,420+</span> Onchain Passes Minted
            </span>
            <span className="text-[10px] text-accent-fg">Zero knowledge proofs enabled</span>
          </div>
        </div>

        {/* Right — BCL ID Card */}
        <div className="relative">
          <div className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface p-5 overflow-hidden">
            {/* Glow inside card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/[0.08] blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand/[0.08] blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">BCL ID PASS // V2.4</div>
                </div>
                <span className="badge-green">SOVEREIGN NYC</span>
              </div>

              {/* Profile */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center border border-white/10 shrink-0">
                  <Users className="w-7 h-7 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-lg text-ink">philip.bcl</div>
                  <div className="text-xs text-ink-3">Level 14 Pioneer · 2,840 XP</div>
                  <div className="progress-track mt-2">
                    <div className="progress-fill" style={{ width: "78%" }} />
                  </div>
                  <div className="text-[10px] text-ink-5 mt-1">Progress to Tier 15 — 78%</div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="badge-blue">Developer Guild</span>
                    <span className="badge-green">Community Contributor</span>
                    <span className="badge-amber">Core Mentor</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="stat-card">
                  <div className="text-xl font-bold font-heading text-ink num-mono">12</div>
                  <div className="text-[10px] text-ink-4 uppercase tracking-wider">Achievements</div>
                </div>
                <div className="stat-card">
                  <div className="text-xl font-bold font-heading text-accent-fg num-mono">92</div>
                  <div className="text-[10px] text-ink-4 uppercase tracking-wider">Reputation Score</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-0.5">Proof Hash</div>
                  <div className="font-mono text-[11px] text-ink-3">0x4e78...5a1c</div>
                </div>
                <div className="w-12 h-12 border border-ink/10 rounded-lg bg-ink/5 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-[2px]">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-[1px] ${i % 3 === 0 ? 'bg-accent' : 'bg-ink/20'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
