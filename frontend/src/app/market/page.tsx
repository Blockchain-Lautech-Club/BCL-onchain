"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Zap, Shield, Search, ChevronDown, RefreshCw, Receipt,
  History, Nfc, Ticket, Lock, ExternalLink, ShoppingBag,
  Star, Rocket, QrCode, Truck, CheckCircle2
} from "lucide-react";

// ── Static reward catalogue ───────────────────────────────────────────────
const REWARDS = [
  {
    id: 1,
    title: "Exclusive BCL Cyber Hoodie",
    description: "Heavyweight custom oversized black hoodie with embroidered BCL Onchain identity patch and cryptographic NFC tag.",
    category: "Merchandise & Swag",
    xpCost: 2500,
    badge: "Physical Swag",
    badgeColor: { text: "text-accent-fg", bg: "bg-accent/10", border: "border-accent/20" },
    meta: "Batch 02 • 12/50 left",
    inventoryPct: 24,
    status: "eligible",
    ctaLabel: "Redeem Hoodie",
    ctaIcon: <Nfc className="w-4 h-4" />,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPG5V-58RHghQ_Ij9_GYpdJxHHnfpUTK41--uNFfn8Wop5GIjCev2ogiaiP8F1-EesM6jUSo7trNm0JXE5YUYSwo-hlncZMXkB8aPBIy7lAzEQPfrcgmYJP8p6FwLFkVynB074Mtv6wqeDwgjBNE84492XYamFpRdGqwMHxSHvvbsv2m2Z3Tg1vyppZMM9FwBc7ETec-WYZvRH8e1rgY3LQSRRAB36DvgTwXoIdHRXKuyihl428Fwg",
  },
  {
    id: 2,
    title: "1-on-1 Contract Audit Session",
    description: "60-minute deep architectural audit and portfolio critique conducted by a Senior Protocol Engineer at Base.",
    category: "Mentorship & Career",
    xpCost: 3000,
    badge: "Mentorship",
    badgeColor: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    meta: "Base Protocol Eng",
    progressPct: 95,
    progressLabel: "Your XP: 2,840 / 3,000",
    status: "shortfall",
    ctaLabel: "Earn 160 more XP",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwTaEOONZD0rUjqDVtE3bbIQndZFIqHqIEi616m9s_f3zaUUd__qKt3cEWURPGHM7SVCE3FJ4xheDlKw-350uomIkmM2RISPzk8VO9UsUjv1b7GJy8cRBFoaTUYKfceYPnvKu4jqA17ybDl60fIxTKp8npH4VGBK__ZNSje5avWVi1CxjlFuZxsBmNC9lLMw4pWUVAULR4rkwRBM9NC9Q7ftiHaAuhZ78_HXNc6hm26641hm4tzKcs",
  },
  {
    id: 3,
    title: "Devcon Global Travel Raffle",
    description: "Entry to an all-expenses-paid travel and lodging sponsorship pass for Devcon Bangkok representing the BCL community.",
    category: "Event Passes & VIP",
    xpCost: 1500,
    badge: "Grant & Travel",
    badgeColor: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    meta: "184 Entries Pooled",
    infoBox: { label: "Your Active Entries:", value: "1 Ticket Active" },
    status: "eligible",
    ctaLabel: "Redeem Ticket",
    ctaIcon: <Ticket className="w-4 h-4" />,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1mbOr3CKK1eEGlT2o71KCacB9kcNs4L-425yLw2rlo1vuZV2Ws06eAs8ojh7OG4YItC4v-_3rXH1tHla4dd6kEZ4h5JjnkwcVZsJRimaBO5twh3Ch-icMGzxthUa69NSS_PwOoe7RJJUbbeohiFf4UVBu4TPe8IgvW9qvUO_37SmQSWB_XquROwU7dZSAQWRusGjrEm8JefMac1MXequPgC1fuTsd08LsYWXU0rRBCpj4yWTGyTWd",
  },
  {
    id: 4,
    title: "Ledger Nano X: BCL Edition",
    description: "Precision laser-engraved cryptographic hardware wallet loaded with bespoke campus firmware badges and key backup cards.",
    category: "Hardware & Tools",
    xpCost: 4000,
    badge: "Hardware",
    badgeColor: { text: "text-ink-4", bg: "bg-ink/10", border: "border-ink/10" },
    meta: "Level 15+ Required",
    lockBadge: true,
    infoBox: { label: "Your rank:", value: "Level 14 (360 XP to unlock)" },
    status: "locked",
    ctaLabel: "Locked to Level 15",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkS7RxkQ4Dhy-YH1-MtHmZcXcq-sEd9nt-bJouSAfFPy5tppvt3r_pmBp5mzbCxA-uP_ebhZeKX-OQEQKDrUEB54eEKs9OzDUAESwEshlsTtZDFgqtzQ_BdlwUbpDJByw7wpZYLzSYMrfQCUTD0TtjEs6qCzHnohtC0alTJBIeGYCJMP4dJWwktAX5VbZoG1_4rCR9dXjxXDjhPxhxQGizUvASTXg-6HTAKcbFDzz4vP6zWwDcozqv",
  },
  {
    id: 5,
    title: "BCL Annual Summit VIP Pass",
    description: "Complimentary priority seating + speaker green-room networking access at the 2025 LAUTECH Onchain Developers Summit.",
    category: "Event Passes & VIP",
    xpCost: 800,
    badge: "Event VIP",
    badgeColor: { text: "text-accent-fg", bg: "bg-accent/10", border: "border-accent/20" },
    meta: "Instant Issuance",
    infoBox: { label: "Includes:", value: "VIP Merch Pack + Catered Lunch" },
    status: "eligible",
    ctaLabel: "Redeem Now",
    ctaIcon: <CheckCircle2 className="w-4 h-4" />,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxlgqTstIPJvueW_TBRq1HchuPr9B9H2Mt6iBb98NNwIpGStemGwRLaa0LdXuSLK1LdYHKLNLDOI1bdevQwCEUUmNG02HBlLrIRn91vs5IH2OaymWzgt5xhEajC5uaDcQ9hkqW1t1tR1S6X03aMix28_so8VztDWlCpuU8Vetzmyma3rVAxteMK1VRGOohNy8QoC3TSLp9nZ_vm_t55kXSmD7FPNaUkHHUa_ZqOVfh5S6cFMTGvFT9",
  },
  {
    id: 6,
    title: "Web3 Career Fast-Track",
    description: "Direct interview pipeline with partner protocols (Starknet, Base, Arbitrum) bypassing standard applicant screening.",
    category: "Mentorship & Career",
    xpCost: 2200,
    badge: "Career",
    badgeColor: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    meta: "3 Partner Protocols",
    tags: ["Starknet", "Base", "Arbitrum"],
    status: "eligible",
    ctaLabel: "Submit for Placement",
    ctaIcon: <Rocket className="w-4 h-4" />,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjWbingXG3fUwE8cGNxKKfZT6SuCbDp3KqWQ51enIB6PkgN_3rrTPagqPLXWFA5Q4bKb26cgrTHJGT85C-Xf22rpfQ45DYCOCF6rKFTunDvsqtYGMCd3inLo0bv-CXDpUKWUhjkI7DdhD5UPHlrp6BaiwZE1yLD5WlMFHCHx4E1t16hlustIe37dmvmQTp5t4HuFktGQEowBzvMlgPCH2Jl9vnL2Zogu9pFdZvUXPLB0r47edkRBB4",
  },
];

const CATEGORIES = [
  "All Rewards",
  "Merchandise & Swag",
  "Event Passes & VIP",
  "Mentorship & Career",
  "Hardware & Tools",
  "Partner Whitelists",
];

const VOUCHERS = [
  {
    id: 1,
    icon: <QrCode className="w-6 h-6" />,
    iconColor: "text-accent-fg",
    title: "Early Access Pass #0412",
    badge: "Claimed",
    badgeColor: "bg-accent/10 text-accent-fg border-accent/20",
    meta: "Burned 1,000 XP • Mar 02, 2025",
    ctaLabel: "Show QR",
  },
  {
    id: 2,
    icon: <Truck className="w-6 h-6" />,
    iconColor: "text-amber-400",
    title: "NFC Sticker Pack (5x)",
    badge: "Shipped",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    meta: "Burned 400 XP • Tracking: #LAU-77918",
    ctaLabel: "Track",
    ctaIcon: <ExternalLink className="w-3.5 h-3.5" />,
  },
];

export default function MarketPage() {
  const { walletAddress, connectWallet, user, stats, awardClaimedXp } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All Rewards");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [vouchers, setVouchers] = useState<Array<{
    id: number;
    title: string;
    badge: string;
    badgeColor: string;
    meta: string;
    code: string;
    ctaLabel: string;
  }>>([]);

  const spendableXp = Math.max(stats?.total_points ?? 0, user?.total_points ?? 0);
  const lifetimeXp = spendableXp;
  const level = Math.max(stats?.level ?? 0, user?.level ?? 0, 1);

  const activeAddr = (walletAddress || user?.wallet_address)?.toLowerCase();

  useEffect(() => {
    if (!activeAddr) {
      setVouchers([]);
      return;
    }
    const saved = localStorage.getItem(`bcl_vouchers_${activeAddr}`);
    if (saved) {
      try {
        setVouchers(JSON.parse(saved));
      } catch {
        setVouchers([]);
      }
    } else {
      setVouchers([]);
    }
  }, [activeAddr]);

  const handleRedeem = (reward: { id: number; title: string; xpCost: number }) => {
    if (!walletAddress) {
      toast("Please connect your wallet first", { icon: "🔌" });
      connectWallet();
      return;
    }

    if (reward.id === 4 && level < 15) {
      toast.error(`Level 15 required. You are currently Level ${level}.`);
      return;
    }

    if (spendableXp < reward.xpCost) {
      toast.error(`You need ${(reward.xpCost - spendableXp).toLocaleString()} more XP to redeem ${reward.title}.`);
      return;
    }

    const code = `BCL-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const newVoucher = {
      id: Date.now(),
      title: reward.title,
      badge: "Redeemed",
      badgeColor: "bg-accent/10 text-accent-fg border-accent/20",
      meta: `Claimed for ${reward.xpCost.toLocaleString()} XP • Code: ${code}`,
      code,
      ctaLabel: "Show Code",
    };

    const updated = [newVoucher, ...vouchers];
    setVouchers(updated);
    if (activeAddr) {
      localStorage.setItem(`bcl_vouchers_${activeAddr}`, JSON.stringify(updated));
    }
    awardClaimedXp(-reward.xpCost, `Voucher Redemption: ${reward.title}`);
    toast.success(`Successfully redeemed ${reward.title}! Voucher saved below.`);
  };

  const computedRewards = REWARDS.map((r) => {
    const isLocked = r.id === 4 && level < 15;
    const isShortfall = !isLocked && spendableXp < r.xpCost;
    const status = isLocked ? "locked" : isShortfall ? "shortfall" : "eligible";
    const progressPct = Math.min(100, Math.round((spendableXp / Math.max(1, r.xpCost)) * 100));
    const progressLabel = `Your XP: ${spendableXp.toLocaleString()} / ${r.xpCost.toLocaleString()}`;
    
    return {
      ...r,
      status,
      progressPct,
      progressLabel,
      ctaLabel: status === "eligible" 
        ? (r.ctaLabel || "Redeem Now")
        : status === "shortfall"
        ? `Need ${(r.xpCost - spendableXp).toLocaleString()} more XP`
        : `Locked to Level 15 (Current: L${level})`,
      infoBox: r.id === 4 
        ? { label: "Your rank:", value: `Level ${level} (${Math.max(0, 15 - level)} levels left)` }
        : r.infoBox,
    };
  });

  const eligibleCount = computedRewards.filter(r => r.status === "eligible").length;

  // Filter + sort
  let displayRewards = computedRewards.filter(r =>
    (activeCategory === "All Rewards" || r.category === activeCategory) &&
    (!searchQ || r.title.toLowerCase().includes(searchQ.toLowerCase()) || r.description.toLowerCase().includes(searchQ.toLowerCase()))
  );
  if (sortBy === "xp-low")  displayRewards = [...displayRewards].sort((a, b) => a.xpCost - b.xpCost);
  if (sortBy === "xp-high") displayRewards = [...displayRewards].sort((a, b) => b.xpCost - a.xpCost);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-10 overflow-x-hidden">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative w-full rounded-2xl bg-surface border border-ink/5 p-4 sm:p-6 md:p-10 overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-24 w-96 h-96 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-purple-500/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">

          {/* Titles */}
          <div className="max-w-2xl flex flex-col gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 border border-ink/5 w-fit">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,245,160,0.8)]" />
              <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">Treasury Synced</span>
              <span className="text-ink-4 font-mono text-[10px]">/ Block #19820412</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-ink tracking-tight break-words">
              Reward Vault & Marketplace
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-ink-4 max-w-xl leading-relaxed">
              Convert your verified on-chain effort and XP into real-world gear, event tickets, hardware, and mentorship.
            </p>
          </div>

          {/* Metrics HUD */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 bg-surface/90 backdrop-blur-xl border border-ink/5 p-3.5 sm:p-4 rounded-2xl shadow-lg">

            {/* Spendable */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4 bg-ink/[0.03] rounded-xl flex-1 sm:min-w-[170px] border border-ink/5">
              <div className="flex items-center justify-between text-ink-4 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Spendable Balance</span>
                <Zap className="w-4 h-4 text-accent-fg" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-heading font-bold text-accent-fg tracking-tight">
                  {spendableXp.toLocaleString()}
                </span>
                <span className="font-mono text-[10px] text-ink-4 font-bold ml-1">BCL-XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-fg shrink-0" />
                <span className="font-mono text-[10px] font-bold text-accent-fg truncate">
                  {eligibleCount} items eligible now
                </span>
              </div>
            </div>

            {/* Lifetime & Tier */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4 bg-ink/[0.03] rounded-xl flex-1 sm:min-w-[190px] border border-ink/5">
              <div className="flex items-center justify-between text-ink-4 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Lifetime Accumulated</span>
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-heading font-bold text-ink tracking-tight">
                  {lifetimeXp.toLocaleString()}
                </span>
                <span className="font-mono text-[10px] text-ink-4 font-bold ml-1">XP</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ink/5 border border-ink/5 font-mono text-[10px] font-bold text-amber-400 w-fit">
                <Star className="w-3 h-3" />
                <span>Pioneer (5% Discount)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Burn policy pill */}
        <div className="relative z-10 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-ink/5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-ink/[0.02] px-3.5 sm:px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-fg shrink-0" />
            <span className="text-xs sm:text-sm text-ink-4">
              XP redemptions safely burn spendable XP while preserving your lifetime reputation score and guild level status.
            </span>
          </div>
          <a href="#vouchers-drawer" className="font-mono text-[10px] font-bold text-accent-fg hover:underline flex items-center gap-1 uppercase tracking-wider">
            View My Active Vouchers ({VOUCHERS.length})
            <ChevronDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* ── Filter, Search & Sort ────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                  activeCategory === cat
                    ? "bg-accent/20 text-accent-fg border border-accent/30 shadow-[0_0_16px_rgba(0,245,160,0.2)]"
                    : "bg-surface border border-ink/5 text-ink-4 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {cat}{cat === "All Rewards" ? ` (${REWARDS.length})` : ""}
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full bg-surface border border-ink/10 text-ink pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono placeholder:text-ink-4/50 focus:outline-none focus:border-accent/40 transition-colors shadow-inner"
                placeholder="Search vault items..."
                type="text"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-surface border border-ink/10 text-ink text-xs sm:text-sm font-semibold pl-3.5 pr-9 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-accent/40 shadow-inner"
              >
                <option value="featured">Sort: Featured</option>
                <option value="xp-low">XP: Low to High</option>
                <option value="xp-high">XP: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Reward Grid ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {displayRewards.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-surface border border-ink/5 p-16 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-ink-4 mx-auto" />
            <h3 className="text-xl font-heading font-bold text-ink">No items found</h3>
            <p className="text-sm text-ink-4">Try a different category or clear your search.</p>
          </div>
        ) : (
          displayRewards.map(reward => (
            <article
              key={reward.id}
              className={`group flex flex-col justify-between bg-surface border border-ink/5 hover:border-ink/10 rounded-2xl p-5 transition-all duration-200 shadow-lg relative overflow-hidden ${reward.status === "locked" ? "opacity-80" : ""}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-accent/10" />

              {/* Level-lock badge */}
              {reward.lockBadge && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold">
                  <Lock className="w-3 h-3" /> Level 15+ Required
                </div>
              )}

              <div className="flex flex-col flex-1">
                {/* Image */}
                <div className={`relative w-full h-52 rounded-xl overflow-hidden bg-ink/5 mb-4 ${reward.status === "locked" ? "opacity-75" : ""}`}>
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold backdrop-blur-md shadow-sm border ${reward.badgeColor.bg} ${reward.badgeColor.text} ${reward.badgeColor.border}`}>
                      {reward.badge}
                    </span>
                  </div>
                  {reward.meta && !reward.lockBadge && (
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface/80 border border-ink/10 text-ink-4 font-mono text-[10px] font-bold backdrop-blur-md">
                        {reward.meta}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title + cost */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className={`text-lg font-heading font-bold text-ink leading-tight transition-colors ${reward.status !== "locked" ? "group-hover:text-accent-fg" : ""}`}>
                    {reward.title}
                  </h2>
                  <div className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold ${reward.status === "locked" ? "bg-ink/5 text-ink-4" : "bg-ink/5 text-ink"}`}>
                    <span>{reward.xpCost.toLocaleString()}</span>
                    <span className="text-[10px] text-ink-4">XP</span>
                  </div>
                </div>

                <p className="text-sm text-ink-4 mb-4 line-clamp-2 leading-relaxed">
                  {reward.description}
                </p>

                {/* Inventory bar */}
                {"inventoryPct" in reward && reward.inventoryPct !== undefined && (
                  <div className="w-full bg-ink/5 h-1.5 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-accent h-full rounded-full shadow-[0_0_8px_rgba(0,245,160,0.5)]"
                      style={{ width: `${reward.inventoryPct}%` }}
                    />
                  </div>
                )}

                {/* XP progress bar (shortfall) */}
                {"progressPct" in reward && reward.progressPct !== undefined && (
                  <div className="flex flex-col gap-1.5 mb-4">
                    <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-ink-4">{reward.progressLabel}</span>
                      <span className="text-purple-400">{reward.progressPct}%</span>
                    </div>
                    <div className="w-full bg-ink/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                        style={{ width: `${reward.progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Info box */}
                {"infoBox" in reward && reward.infoBox && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-ink/[0.03] border border-ink/5 mb-4 font-mono text-[10px] font-bold">
                    <span className="text-ink-4">{reward.infoBox.label}</span>
                    <span className={`${reward.status === "locked" ? "text-red-400" : "text-ink"}`}>{reward.infoBox.value}</span>
                  </div>
                )}

                {/* Partner tags */}
                {"tags" in reward && reward.tags && (
                  <div className="flex items-center gap-2 mb-4">
                    {reward.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-ink/5 border border-ink/5 font-mono text-[10px] font-bold text-ink">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-ink/5 flex items-center gap-3">
                {reward.status === "eligible" ? (
                  <>
                    <button
                      onClick={() => handleRedeem(reward)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-surface font-bold text-sm hover:shadow-[0_0_18px_rgba(0,245,160,0.35)] transition-all flex items-center justify-center gap-2"
                    >
                      {reward.ctaIcon}
                      <span>{reward.ctaLabel}</span>
                    </button>
                    {reward.id === 1 && (
                      <button
                        className="w-11 h-11 rounded-xl bg-ink/5 text-ink-4 hover:text-ink flex items-center justify-center transition-colors border border-ink/5"
                        title="Inspect NFC Specs"
                      >
                        <Nfc className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : reward.status === "shortfall" ? (
                  <button 
                    onClick={() => handleRedeem(reward)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-ink/5 text-ink hover:bg-ink/10 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-ink/5"
                  >
                    <Lock className="w-4 h-4 text-ink-4" />
                    <span>{reward.ctaLabel}</span>
                  </button>
                ) : (
                  <button 
                    disabled 
                    className="flex-1 py-2.5 px-4 rounded-xl bg-ink/5 text-ink-4/40 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-ink/5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{reward.ctaLabel}</span>
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      {/* ── Vouchers & History Tray ──────────────────────────────────────── */}
      <section
        id="vouchers-drawer"
        className="flex flex-col gap-6 bg-surface border border-ink/5 p-6 md:p-10 rounded-2xl shadow-xl mt-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-ink flex items-center gap-2">
              <Receipt className="w-6 h-6 text-accent-fg" />
              <span>Your Claimed Vouchers & History</span>
            </h2>
            <p className="text-sm text-ink-4 mt-1">
              Cryptographically signed digital claims and tracking identifiers for physical fulfillment.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">
              Redeemed: {vouchers.length} items
            </span>
          </div>
        </div>

        {vouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map(v => (
              <div
                key={v.id}
                className="flex items-center justify-between p-4 rounded-xl bg-ink/[0.02] border border-ink/10 shadow-sm hover:border-ink/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 border border-ink/5 text-accent-fg">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-heading font-bold text-ink leading-tight">{v.title}</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${v.badgeColor}`}>
                        {v.badge}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">{v.meta}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toast(`Redemption Code: ${v.code}`, { icon: "🎟️" })}
                  className="px-3 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 border border-ink/5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{v.ctaLabel}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl border border-dashed border-ink/10 space-y-2">
            <ShoppingBag className="w-8 h-8 text-ink-4 mx-auto" />
            <p className="text-sm font-bold text-ink">No vouchers redeemed yet</p>
            <p className="text-xs text-ink-4">Earn XP by completing quests on Botchain to unlock real merchandise and event passes.</p>
          </div>
        )}
      </section>

    </div>
  );
}