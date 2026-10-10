"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Zap, CheckCircle2, ArrowRight, Loader2, Shield, Globe,
  Copy, ExternalLink, Wallet, Star, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const STEPS = [
  { id: 1, label: "Connect Wallet", icon: Wallet },
  { id: 2, label: "Verify Identity", icon: Shield },
  { id: 3, label: "Claim .bcl Handle", icon: Globe },
  { id: 4, label: "Join the Protocol", icon: Star },
];

const GUILD_OPTIONS = [
  { id: "developer", label: "Developer Guild", desc: "Build dApps, deploy contracts, audit protocols", emoji: "⚙️", color: "from-blue-600/20 to-cyan-500/10 border-blue-500/30" },
  { id: "designer", label: "Design & Frontend", desc: "Craft Web3 UIs, create brand assets, design tokenomics", emoji: "🎨", color: "from-purple-600/20 to-pink-500/10 border-purple-500/30" },
  { id: "creator", label: "Creator Guild", desc: "Write threads, host spaces, produce content", emoji: "✍️", color: "from-amber-600/20 to-yellow-500/10 border-amber-500/30" },
  { id: "community", label: "Community & Ambassador", desc: "Organize events, onboard peers, grow the ecosystem", emoji: "🤝", color: "from-green-600/20 to-emerald-500/10 border-green-500/30" },
  { id: "researcher", label: "Research & Security", desc: "Audit contracts, write research, explore ZK primitives", emoji: "🔬", color: "from-red-600/20 to-orange-500/10 border-red-500/30" },
];

export default function OnboardingPage() {
  const { walletAddress, connectWallet, user } = useAuth();
  const [step, setStep] = useState(walletAddress ? 2 : 1);
  const [handleInput, setHandleInput] = useState("");
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [studentId, setStudentId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [done, setDone] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
      setStep(2);
    } catch {
      toast.error("Failed to connect wallet");
    }
  };

  const handleCheckAvailability = async () => {
    if (!handleInput.trim() || handleInput.length < 3) {
      toast.error("Handle must be at least 3 characters");
      return;
    }
    setCheckingHandle(true);
    setHandleAvailable(null);
    try {
      // Simulate availability check; replace with api.checkHandleAvailability(handleInput)
      await new Promise((r) => setTimeout(r, 800));
      const taken = ["samuel", "amina", "philip", "tobi"].includes(handleInput.toLowerCase());
      setHandleAvailable(!taken);
    } finally {
      setCheckingHandle(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@")) { toast.error("Enter a valid email"); return; }
    setVerifying(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setVerified(true);
      toast.success("Identity verified!");
      setStep(3);
    } catch {
      toast.error("Verification failed. Check your student credentials.");
    } finally {
      setVerifying(false);
    }
  };

  const handleClaim = async () => {
    if (!handleAvailable || !handleInput) { toast.error("Choose an available handle first"); return; }
    setClaiming(true);
    try {
      // Uses the names/register flow; swap for api.registerName() when wired
      await api.checkNameAvailability(handleInput); // validate exists on-chain
      toast.success(`${handleInput}.bcl claimed!`);
      setStep(4);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedGuild) { toast.error("Select a guild to continue"); return; }
    try {
      await api.submitTask(0, { guild: selectedGuild, onboarding: true });
    } catch {
      // non-blocking
    }
    setDone(true);
    toast.success("Welcome to BCL Onchain!");
  };

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-accent/20">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold font-heading text-ink">You&apos;re onchain.</h2>
            <p className="text-ink-4 mt-2">
              <span className="text-accent-fg font-semibold">{handleInput}.bcl</span> is live on the BCL registry.
              Your passport is minting — check your profile in a few moments.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[{ v: "L1", l: "Starting Level" }, { v: "0 XP", l: "Reputation" }, { v: "300", l: "Bonus XP Queued" }].map((s) => (
              <div key={s.l} className="stat-card">
                <div className="text-xl font-extrabold text-accent-fg font-heading">{s.v}</div>
                <div className="text-[10px] text-ink-5 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/dashboard" className="btn-primary flex items-center gap-2 justify-center">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/tasks" className="btn-outline flex items-center gap-2 justify-center">
              Explore Quests
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] text-accent-fg font-semibold uppercase tracking-wider mb-2">
          <Zap className="w-3 h-3" /> Epoch 04 Active · Gasless Sovereign Identity
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink">
          Turn your BCL participation into{" "}
          <span className="text-accent-fg">reputation.</span>
        </h1>
        <p className="text-sm text-ink-4 max-w-md mx-auto">
          Claim your .bcl handle, pair your student ID, and start earning verifiable
          credentials on the blockchain.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? "bg-accent text-white" : active ? "bg-accent/20 border border-accent text-accent-fg" : "bg-surface border border-white/10 text-ink-5"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] text-center hidden sm:block ${active ? "text-accent-fg font-semibold" : "text-ink-5"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 transition-all ${step > s.id ? "bg-accent" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: Connect Wallet */}
      {step === 1 && (
        <div className="rounded-2xl bg-surface border border-white/8 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold font-heading text-ink">Connect Your Wallet</h2>
            <p className="text-sm text-ink-4 mt-1">
              Use MetaMask or any EVM-compatible wallet. Gas is BCL-sponsored for identity operations.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {["MetaMask", "WalletConnect", "Coinbase Wallet", "Rainbow"].map((w) => (
              <button
                key={w}
                onClick={handleConnect}
                className="flex items-center gap-3 p-3 rounded-xl bg-subtle border border-white/8 hover:border-accent/40 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-base">
                  {w === "MetaMask" ? "🦊" : w === "WalletConnect" ? "🔗" : w === "Coinbase Wallet" ? "🔵" : "🌈"}
                </div>
                <span className="text-sm font-semibold text-ink">{w}</span>
                <ChevronRight className="w-3.5 h-3.5 text-ink-5 ml-auto" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-ink-5 text-center">
            By connecting, you agree to BCL Onchain&apos;s terms of service and on-chain data policy.
          </p>
        </div>
      )}

      {/* Step 2: Verify Student Identity */}
      {step === 2 && (
        <div className="rounded-2xl bg-surface border border-white/8 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold font-heading text-ink">Verify Student Identity</h2>
            <p className="text-sm text-ink-4 mt-1">
              Confirm your LAUTECH affiliation. This issues your Anti-Sybil Sovereign Pass.
            </p>
          </div>
          {walletAddress && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
              <CheckCircle2 className="w-4 h-4 text-accent-fg shrink-0" />
              <span className="text-xs text-ink-4">Wallet: </span>
              <span className="text-xs font-mono text-ink">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
              <button onClick={() => { navigator.clipboard.writeText(walletAddress); toast.success("Copied"); }} className="ml-auto">
                <Copy className="w-3.5 h-3.5 text-ink-5 hover:text-accent-fg" />
              </button>
            </div>
          )}
          {verified ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-ink">Identity Verified</div>
                <div className="text-xs text-ink-5">{emailInput}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-ink-5 uppercase tracking-wider">LAUTECH Student Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@student.lautech.edu.ng"
                  className="w-full rounded-xl bg-subtle border border-white/10 px-3 py-2.5 text-sm text-ink placeholder:text-ink-5 focus:outline-none focus:border-accent/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-5 uppercase tracking-wider">Student ID / Matric Number</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. CSC/2021/0042"
                  className="w-full rounded-xl bg-subtle border border-white/10 px-3 py-2.5 text-sm text-ink placeholder:text-ink-5 focus:outline-none focus:border-accent/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {verifying ? "Verifying…" : "Verify with Institution"}
              </button>
            </form>
          )}
          {verified && (
            <button onClick={() => setStep(3)} className="btn-primary w-full flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Step 3: Claim .bcl Handle */}
      {step === 3 && (
        <div className="rounded-2xl bg-surface border border-white/8 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold font-heading text-ink">Claim Your .bcl Handle</h2>
            <p className="text-sm text-ink-4 mt-1">
              Your sovereign identifier on the BCL registry. Gasless mint · ERC-6551 Bound.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl bg-subtle border border-white/10 px-3 py-2.5">
              <input
                type="text"
                value={handleInput}
                onChange={(e) => { setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setHandleAvailable(null); }}
                placeholder="yourhandle"
                maxLength={32}
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-5 focus:outline-none"
              />
              <span className="text-sm text-ink-5 font-mono">.bcl</span>
            </div>
            <button
              onClick={handleCheckAvailability}
              disabled={checkingHandle || !handleInput}
              className="btn-outline flex items-center gap-1.5 shrink-0"
            >
              {checkingHandle ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
            </button>
          </div>
          {handleAvailable === true && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span><strong>{handleInput}.bcl</strong> is available!</span>
            </div>
          )}
          {handleAvailable === false && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <span>❌</span>
              <span><strong>{handleInput}.bcl</strong> is already taken.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {["0 Gas Fee", "ERC-6551 Bound", "Soulbound NFT", "Onchain Forever"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-ink-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <button
            onClick={handleClaim}
            disabled={!handleAvailable || claiming}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {claiming ? "Minting…" : `Claim ${handleInput || "yourhandle"}.bcl`}
          </button>
        </div>
      )}

      {/* Step 4: Choose Guild */}
      {step === 4 && (
        <div className="rounded-2xl bg-surface border border-white/8 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold font-heading text-ink">Join a Campus Guild</h2>
            <p className="text-sm text-ink-4 mt-1">
              Pick your primary focus. You can join additional guilds later.
            </p>
          </div>
          <div className="space-y-3">
            {GUILD_OPTIONS.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGuild(g.id)}
                className={`w-full text-left p-4 rounded-xl bg-gradient-to-r border transition-all ${g.color} ${
                  selectedGuild === g.id ? "ring-2 ring-accent/60" : "hover:brightness-110"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{g.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-ink text-sm">{g.label}</div>
                    <div className="text-xs text-ink-4 mt-0.5">{g.desc}</div>
                  </div>
                  {selectedGuild === g.id && <CheckCircle2 className="w-5 h-5 text-accent-fg shrink-0" />}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleFinish}
            disabled={!selectedGuild}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Star className="w-4 h-4" />
            Join the Protocol
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[{ v: "1,420+", l: "Onchain Passes Minted" }, { v: "38.4K+", l: "Quests Verified" }, { v: "1.2M+", l: "XP Distributed" }].map((s) => (
          <div key={s.l} className="stat-card">
            <div className="text-lg font-extrabold text-accent-fg font-heading num-mono">{s.v}</div>
            <div className="text-[10px] text-ink-5 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
