"use client";

import React, { useEffect, useState } from "react";
import { QuestCard } from "@/components/quest/QuestCard";
import { taskToCard } from "@/lib/quests";
import Link from "next/link";
import { api, Task } from "@/lib/api";
import {
  Globe2, Users, Zap, ArrowRight, Search,
  Code2, Palette, Megaphone, BookOpen, ShieldCheck, Cpu, Star,
} from "lucide-react";

// ── Static guild data (no backend model yet) ──────────────────────────────
const GUILDS = [
  {
    id: "smart-contracts",
    name: "Smart Contracts & Rust",
    description: "Deploy audited EVM and Rust contracts on mainnet. Weekly code reviews and Foundry workshops.",
    members: 340,
    status: "Full",
    statusCls: "badge-amber",
    category: "Developer",
    icon: <Code2 className="w-5 h-5 text-accent-fg" />,
    tags: ["Solidity", "Rust", "Foundry", "Audit"],
  },
  {
    id: "product-design",
    name: "Product Design & UX",
    description: "Craft Web3 interfaces, design systems, and tokenomics dashboards with a campus design community.",
    members: 182,
    status: "Join",
    statusCls: "badge-green",
    category: "Creator",
    icon: <Palette className="w-5 h-5 text-pink-400" />,
    tags: ["Figma", "UX Research", "Web3 UI"],
  },
  {
    id: "devrel-media",
    name: "Developer Relations & Media",
    description: "Write threads, record tutorials, run AMAs. Grow the BCL ecosystem through content and outreach.",
    members: 216,
    status: "Join",
    statusCls: "badge-green",
    category: "Community",
    icon: <Megaphone className="w-5 h-5 text-orange-400" />,
    tags: ["Content", "Twitter", "DevRel", "Spaces"],
  },
  {
    id: "zk-cryptography",
    name: "Zero Knowledge & Cryptography",
    description: "Explore ZK proofs, zkEVM circuits, and identity primitives. Theory-to-implementation track.",
    members: 97,
    status: "Join",
    statusCls: "badge-green",
    category: "Developer",
    icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
    tags: ["ZK", "Circom", "Noir", "STARKs"],
  },
  {
    id: "defi-governance",
    name: "DeFi & Onchain Governance",
    description: "Model AMMs, write DAO governance contracts, analyze tokenomics and quadratic voting mechanisms.",
    members: 154,
    status: "Join",
    statusCls: "badge-green",
    category: "Developer",
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    tags: ["DeFi", "DAO", "Tokenomics", "Governance"],
  },
  {
    id: "learning-research",
    name: "Learning & Research",
    description: "Curriculum contributors, peer tutors, and academic researchers. Publish papers and run study circles.",
    members: 263,
    status: "Join",
    statusCls: "badge-green",
    category: "Community",
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    tags: ["Research", "Curriculum", "Teaching"],
  },
];

const ECOSYSTEM_PARTNERS = [
  { name: "Base", role: "Coinbase L2", dot: "bg-blue-500" },
  { name: "Starknet", role: "Cairo Ecosystem", dot: "bg-purple-500" },
  { name: "Arbitrum", role: "Rollup DAO", dot: "bg-blue-400" },
  { name: "Ethereum", role: "Base Protocol", dot: "bg-indigo-500" },
  { name: "Polygon", role: "ZK Guild Partner", dot: "bg-violet-500" },
  { name: "Solana", role: "High Speed Grants", dot: "bg-green-500" },
  { name: "LAUTECH", role: "Core Hub", dot: "bg-accent" },
  { name: "Scroll Labs", role: "ZK Research", dot: "bg-amber-500" },
];

const GUILD_CATEGORIES = ["All", "Developer", "Creator", "Community"];

// ── Page ──────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [guildFilter, setGuildFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [featuredTasks, setFeaturedTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.getTasks().then((d) => {
      const all = d || [];
      setTasks(all);
      setFeaturedTasks(all.slice(0, 3));
    }).catch(() => {});
  }, []);

  const filteredGuilds = GUILDS.filter((g) => {
    const matchCat = guildFilter === "All" || g.category === guildFilter;
    const matchSearch = searchQ === "" || g.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalMembers = GUILDS.reduce((s, g) => s + g.members, 0);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-subtle to-page border border-accent/15 px-6 py-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-48 bg-brand/[0.06] blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-5 mb-3">
            <Globe2 className="w-3 h-3" />
            <span>BCL ECOSYSTEM</span>
            <span>·</span>
            <span className="text-accent-fg">{totalMembers.toLocaleString()} ACTIVE MEMBERS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink tracking-tight mb-2">
            Explore the BCL Ecosystem
          </h1>
          <p className="text-sm text-ink-4 leading-relaxed">
            Collaborate with fellow LAUTECH engineers, designers, content writers, and community
            builders across specialised campus guilds. Join a guild, ship projects, earn reputation.
          </p>
        </div>
      </div>

      {/* ── Platform Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Cohort",    value: "4,800+",  sub: "Students, developers & researchers" },
          { label: "Quests Verified",  value: "38,400+", sub: "Code submissions & attestations" },
          { label: "XP Distributed",  value: "1.2M+",   sub: "Sovereign reputation tokens" },
          { label: "Community Events", value: "140+",    sub: "Campus buildathons & X Spaces" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-extrabold font-heading text-ink num-mono">{value}</div>
            <div className="text-[10px] text-ink-5 mt-1 leading-snug">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Campus Guilds ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-xl text-ink">Campus Guilds</h2>
            <p className="text-xs text-ink-4 mt-0.5">
              Specialised cohorts where builders collaborate, ship, and earn guild XP together.
            </p>
          </div>
          {/* Search + filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-5" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search guilds…"
                className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-lg text-ink placeholder:text-ink-5 focus:outline-none focus:border-accent/40 w-48"
              />
            </div>
            <div className="flex gap-1">
              {GUILD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGuildFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    guildFilter === cat
                      ? "bg-accent/15 text-accent-fg border border-accent/25"
                      : "text-ink-5 hover:text-ink border border-transparent hover:border-border-subtle"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuilds.map((guild) => (
            <div key={guild.id} className="surface-card rounded-xl p-5 flex flex-col gap-3 hover:border-accent/25 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink/[0.04] border border-border-subtle flex items-center justify-center shrink-0">
                  {guild.icon}
                </div>
                <span className={guild.statusCls}>{guild.status}</span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-sm text-ink mb-1">{guild.name}</h3>
                <p className="text-xs text-ink-4 leading-relaxed">{guild.description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {guild.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-ink/[0.04] border border-border-subtle px-2 py-0.5 rounded-full text-ink-5 font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border-subtle mt-auto">
                <div className="flex items-center gap-1 text-[10px] text-ink-5">
                  <Users className="w-3 h-3" />
                  <span>{guild.members} members</span>
                </div>
                <Link
                  href={`/tasks?category=${guild.category}`}
                  className="flex items-center gap-1 text-[10px] font-semibold text-accent-fg hover:underline"
                >
                  View Quests <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Quests from backend ─────────────────────────── */}
      {featuredTasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl text-ink flex items-center gap-2">
              <Star className="w-4 h-4 text-accent-fg" />
              Featured Quests
            </h2>
            <Link href="/tasks" className="text-xs text-accent-fg font-semibold flex items-center gap-1 hover:underline">
              See all 48 quests <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {featuredTasks.map((task) => (
              <QuestCard key={task.id} quest={taskToCard(task)} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {/* ── Ecosystem Partners ────────────────────────────────────── */}
      <section className="surface-card rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <div className="text-[10px] text-ink-5 uppercase tracking-wider font-bold mb-1">
            // MULTI-CHAIN NETWORK
          </div>
          <h2 className="font-heading font-bold text-xl text-ink">Backed by Ecosystem Giants</h2>
          <p className="text-xs text-ink-4 mt-1">
            LAUTECH student attestations and credentials are recognised and verifiable across global Layer-1 and Layer-2 blockchains.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ECOSYSTEM_PARTNERS.map((p) => (
            <div key={p.name} className="flex items-center gap-2.5 bg-ink/[0.03] border border-border-subtle rounded-xl px-3 py-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
              <div>
                <div className="text-xs font-bold text-ink">{p.name}</div>
                <div className="text-[10px] text-ink-5">{p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-brand/5 border border-accent/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-ink mb-1">
            Claim your verified .bcl name and kickstart your builder portfolio.
          </h3>
          <p className="text-xs text-ink-4">
            Instant onboarding in 30 seconds. Connect your university email or EVM wallet.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/domains" className="btn-outline px-4 py-2 text-sm flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5" /> Search Names
          </Link>
          <Link href="/tasks" className="btn-green px-4 py-2 text-sm flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Explore Quests
          </Link>
        </div>
      </div>
    </div>
  );
}
