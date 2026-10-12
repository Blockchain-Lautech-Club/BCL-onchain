"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, MarketReward } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Zap,
  Shield,
  Search,
  ChevronDown,
  RefreshCw,
  Receipt,
  Nfc,
  Ticket,
  Lock,
  ExternalLink,
  ShoppingBag,
  Star,
  Rocket,
  QrCode,
  Truck,
  CheckCircle2,
  Loader2,
  Tag,
  ArrowRight,
} from "lucide-react";

function getBadgeColor(color?: string) {
  switch (color) {
    case "amber":
      return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    case "purple":
    case "violet":
      return { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    case "sky":
      return { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" };
    case "fuchsia":
      return { text: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" };
    case "brand":
      return { text: "text-brand", bg: "bg-brand/10", border: "border-brand/20" };
    case "emerald":
    default:
      return { text: "text-accent-fg", bg: "bg-accent/10", border: "border-accent/20" };
  }
}

export default function MarketPage() {
  const { walletAddress, connectWallet, user, stats, awardClaimedXp, isAdmin } = useAuth();
  const [rewards, setRewards] = useState<MarketReward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const [activeCategory, setActiveCategory] = useState("All Rewards");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [vouchers, setVouchers] = useState<
    Array<{
      id: number;
      title: string;
      badge: string;
      badgeColor: string;
      meta: string;
      code: string;
      ctaLabel: string;
    }>
  >([]);

  const spendableXp = Math.max(stats?.total_points ?? 0, user?.total_points ?? 0);
  const lifetimeXp = spendableXp;
  const level = Math.max(stats?.level ?? 0, user?.level ?? 0, 1);

  const activeAddr = (walletAddress || user?.wallet_address)?.toLowerCase();

  const loadRewards = async () => {
    try {
      setLoadingRewards(true);
      const data = await api.getMarketRewards();
      setRewards(data || []);
    } catch (err) {
      console.error("Failed to load market rewards:", err);
    } finally {
      setLoadingRewards(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  useEffect(() => {
    if (!activeAddr) {
      setVouchers([]);
      return;
    }

    const loadUserVouchers = async () => {
      try {
        const remoteVouchers = await api.getMyVouchers();
        const mappedRemote = remoteVouchers.map((v) => ({
          id: v.id,
          title: v.reward_title,
          badge: v.status === "active" ? "Claimed" : v.status,
          badgeColor: "bg-accent/10 text-accent-fg border-accent/20",
          meta: `Claimed for ${v.xp_cost.toLocaleString()} XP • Code: ${v.voucher_code}`,
          code: v.voucher_code,
          ctaLabel: "Show Code",
        }));

        const saved = localStorage.getItem(`bcl_vouchers_${activeAddr}`);
        const localVouchers = saved ? JSON.parse(saved) : [];

        // Combine unique by code
        const combined = [...mappedRemote];
        for (const lv of localVouchers) {
          if (!combined.some((c) => c.code === lv.code)) {
            combined.push(lv);
          }
        }
        setVouchers(combined);
      } catch {
        const saved = localStorage.getItem(`bcl_vouchers_${activeAddr}`);
        if (saved) {
          try {
            setVouchers(JSON.parse(saved));
          } catch {
            setVouchers([]);
          }
        }
      }
    };

    loadUserVouchers();
  }, [activeAddr]);

  const handleRedeem = async (reward: MarketReward) => {
    if (!walletAddress) {
      toast("Please connect your wallet first", { icon: "🔌" });
      connectWallet();
      return;
    }

    if (level < reward.min_level) {
      toast.error(`Level ${reward.min_level}+ required. You are currently Level ${level}.`);
      return;
    }

    if (spendableXp < reward.xp_cost) {
      toast.error(
        `You need ${(reward.xp_cost - spendableXp).toLocaleString()} more XP to redeem ${reward.title}.`
      );
      return;
    }

    if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }

    try {
      setRedeemingId(reward.id);
      const res = await api.redeemMarketReward(reward.id);
      const code = res.voucher_code;

      const newVoucher = {
        id: res.id || Date.now(),
        title: reward.title,
        badge: "Claimed",
        badgeColor: "bg-accent/10 text-accent-fg border-accent/20",
        meta: `Claimed for ${reward.xp_cost.toLocaleString()} XP • Code: ${code}`,
        code,
        ctaLabel: "Show Code",
      };

      const updated = [newVoucher, ...vouchers];
      setVouchers(updated);
      if (activeAddr) {
        localStorage.setItem(`bcl_vouchers_${activeAddr}`, JSON.stringify(updated));
      }
      awardClaimedXp(-reward.xp_cost, `Voucher Redemption: ${reward.title}`);
      toast.success(`Successfully redeemed ${reward.title}! Voucher saved below.`);
      await loadRewards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to redeem reward");
    } finally {
      setRedeemingId(null);
    }
  };

  // Extract unique categories
  const dynamicCategories = ["All Rewards"];
  rewards.forEach((r) => {
    if (r.category && !dynamicCategories.includes(r.category)) {
      dynamicCategories.push(r.category);
    }
  });

  const computedRewards = rewards.map((r) => {
    const isLevelLocked = level < r.min_level;
    const isShortfall = !isLevelLocked && spendableXp < r.xp_cost;
    const isOutOfStock = r.stock !== null && r.stock !== undefined && r.stock <= 0;
    const status = isOutOfStock
      ? "out_of_stock"
      : isLevelLocked
      ? "locked"
      : isShortfall
      ? "shortfall"
      : "eligible";

    const progressPct = Math.min(100, Math.round((spendableXp / Math.max(1, r.xp_cost)) * 100));
    const progressLabel = `Your XP: ${spendableXp.toLocaleString()} / ${r.xp_cost.toLocaleString()}`;

    return {
      ...r,
      status,
      progressPct,
      progressLabel,
      badgeColorObj: getBadgeColor(r.badge_color),
      ctaLabel:
        status === "eligible"
          ? r.cta_label || "Redeem Now"
          : status === "out_of_stock"
          ? "Out of Stock"
          : status === "shortfall"
          ? `Need ${(r.xp_cost - spendableXp).toLocaleString()} more XP`
          : `Locked to Level ${r.min_level} (Current: L${level})`,
      infoBox:
        r.min_level > 1
          ? {
              label: "Required Rank:",
              value: `Level ${r.min_level} (${Math.max(0, r.min_level - level)} levels left)`,
            }
          : undefined,
    };
  });

  const eligibleCount = computedRewards.filter((r) => r.status === "eligible").length;

  // Filter + sort
  let displayRewards = computedRewards.filter(
    (r) =>
      (activeCategory === "All Rewards" || r.category === activeCategory) &&
      (!searchQ ||
        r.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQ.toLowerCase()))
  );

  if (sortBy === "xp-low") displayRewards = [...displayRewards].sort((a, b) => a.xp_cost - b.xp_cost);
  if (sortBy === "xp-high") displayRewards = [...displayRewards].sort((a, b) => b.xp_cost - a.xp_cost);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-10 overflow-x-hidden">
      {/* ── Admin Shortcut Banner (if admin) ───────────────────────────── */}
      {isAdmin && (
        <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">Admin Reward Controls</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  LIVE CATALOG SYNC
                </span>
              </div>
              <p className="text-xs text-ink-3">
                You are logged in as an administrator. You can add, edit, stock, and pause rewards anytime.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hi text-white font-bold text-xs transition shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manage Market in Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative w-full rounded-2xl bg-surface border border-ink/5 p-4 sm:p-6 md:p-10 overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-24 w-96 h-96 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-purple-500/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
          {/* Titles */}
          <div className="max-w-2xl flex flex-col gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 border border-ink/5 w-fit">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,245,160,0.8)]" />
              <span className="font-mono text-[10px] font-bold text-accent-fg uppercase tracking-wider">
                Treasury Synced
              </span>
              <span className="text-ink-4 font-mono text-[10px]">/ Verified Rewards</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-ink tracking-tight break-words">
              Reward Vault & Marketplace
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-ink-4 max-w-xl leading-relaxed">
              Convert your verified on-chain effort and XP into real-world gear, event tickets, grants, domains, and mentorship across all Web3 tracks.
            </p>
          </div>

          {/* Metrics HUD */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 bg-surface/90 backdrop-blur-xl border border-ink/5 p-3.5 sm:p-4 rounded-2xl shadow-lg">
            {/* Spendable */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4 bg-ink/[0.03] rounded-xl flex-1 sm:min-w-[170px] border border-ink/5">
              <div className="flex items-center justify-between text-ink-4 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  Spendable Balance
                </span>
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
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  Lifetime Accumulated
                </span>
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
                <span>Pioneer Status (Lvl {level})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Burn policy pill */}
        <div className="relative z-10 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-ink/5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-ink/[0.02] px-3.5 sm:px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-fg shrink-0" />
            <span className="text-xs sm:text-sm text-ink-4">
              XP redemptions safely burn spendable points while preserving your lifetime reputation score and guild rank.
            </span>
          </div>
          <a
            href="#vouchers-drawer"
            className="font-mono text-[10px] font-bold text-accent-fg hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            View My Active Vouchers ({vouchers.length})
            <ChevronDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* ── Filter, Search & Sort ────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                  activeCategory === cat
                    ? "bg-accent/20 text-accent-fg border border-accent/30 shadow-[0_0_16px_rgba(0,245,160,0.2)]"
                    : "bg-surface border border-ink/5 text-ink-4 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {cat}
                {cat === "All Rewards" ? ` (${rewards.length})` : ""}
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full bg-surface border border-ink/10 text-ink pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono placeholder:text-ink-4/50 focus:outline-none focus:border-accent/40 transition-colors shadow-inner"
                placeholder="Search rewards..."
                type="text"
              />
            </div>
            <div className="relative shrink-0 flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-surface border border-ink/10 text-ink text-xs sm:text-sm font-semibold pl-3.5 pr-9 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-accent/40 shadow-inner"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="xp-low">XP: Low to High</option>
                  <option value="xp-high">XP: High to Low</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4 pointer-events-none" />
              </div>
              <button
                onClick={loadRewards}
                disabled={loadingRewards}
                className="p-2.5 rounded-xl bg-surface border border-ink/10 text-ink-4 hover:text-ink hover:bg-ink/5 transition cursor-pointer"
                title="Refresh market rewards"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRewards ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reward Grid ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {loadingRewards ? (
          <div className="col-span-full rounded-2xl bg-surface border border-ink/5 p-16 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-accent-fg mx-auto" />
            <h3 className="text-lg font-heading font-bold text-ink">Syncing Marketplace Catalog...</h3>
            <p className="text-xs text-ink-4">Loading real-time rewards and inventory allocations.</p>
          </div>
        ) : displayRewards.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-surface border border-ink/5 p-16 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-ink-4 mx-auto" />
            <h3 className="text-xl font-heading font-bold text-ink">No items found</h3>
            <p className="text-sm text-ink-4">Try a different category or clear your search.</p>
          </div>
        ) : (
          displayRewards.map((reward) => (
            <article
              key={reward.id}
              className={`group flex flex-col justify-between bg-surface border border-ink/5 hover:border-ink/10 rounded-2xl p-5 transition-all duration-200 shadow-lg relative overflow-hidden ${
                reward.status === "locked" || reward.status === "out_of_stock" ? "opacity-80" : ""
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-accent/10" />

              {/* Level-lock badge */}
              {reward.min_level > 1 && level < reward.min_level && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold">
                  <Lock className="w-3 h-3" /> Level {reward.min_level}+ Required
                </div>
              )}

              <div className="flex flex-col flex-1">
                {/* Image */}
                <div
                  className={`relative w-full h-52 rounded-xl overflow-hidden bg-ink/5 mb-4 flex items-center justify-center ${
                    reward.status === "locked" ? "opacity-75" : ""
                  }`}
                >
                  {reward.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-ink-4">
                      <ShoppingBag className="w-12 h-12 opacity-40" />
                      <span className="font-mono text-xs uppercase">{reward.category}</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold backdrop-blur-md shadow-sm border ${reward.badgeColorObj.bg} ${reward.badgeColorObj.text} ${reward.badgeColorObj.border}`}
                    >
                      {reward.badge || reward.category}
                    </span>
                  </div>

                  {reward.meta_info && (
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface/80 border border-ink/10 text-ink-4 font-mono text-[10px] font-bold backdrop-blur-md">
                        {reward.meta_info}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title + cost */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2
                    className={`text-lg font-heading font-bold text-ink leading-tight transition-colors ${
                      reward.status !== "locked" ? "group-hover:text-accent-fg" : ""
                    }`}
                  >
                    {reward.title}
                  </h2>
                  <div
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold ${
                      reward.status === "locked" ? "bg-ink/5 text-ink-4" : "bg-ink/5 text-ink"
                    }`}
                  >
                    <span>{reward.xp_cost.toLocaleString()}</span>
                    <span className="text-[10px] text-ink-4">XP</span>
                  </div>
                </div>

                <p className="text-sm text-ink-4 mb-4 line-clamp-2 leading-relaxed">
                  {reward.description}
                </p>

                {/* Stock indicator */}
                {reward.stock !== null && reward.stock !== undefined && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-4 mb-3">
                    <span>Available Inventory:</span>
                    <span className="font-bold text-ink">
                      {reward.stock > 0 ? `${reward.stock} remaining` : "Out of stock"}
                    </span>
                  </div>
                )}

                {/* XP progress bar (shortfall) */}
                {reward.status === "shortfall" && (
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
                {reward.infoBox && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-ink/[0.03] border border-ink/5 mb-4 font-mono text-[10px] font-bold">
                    <span className="text-ink-4">{reward.infoBox.label}</span>
                    <span className={`${reward.status === "locked" ? "text-red-400" : "text-ink"}`}>
                      {reward.infoBox.value}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-ink/5 flex items-center gap-3">
                {reward.status === "eligible" ? (
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={redeemingId === reward.id}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-surface font-bold text-sm hover:shadow-[0_0_18px_rgba(0,245,160,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {redeemingId === reward.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{redeemingId === reward.id ? "Redeeming..." : reward.ctaLabel}</span>
                  </button>
                ) : reward.status === "shortfall" ? (
                  <button
                    onClick={() => handleRedeem(reward)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-ink/5 text-ink hover:bg-ink/10 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-ink/5 cursor-pointer"
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
            {vouchers.map((v) => (
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
                      <span className="text-base font-heading font-bold text-ink leading-tight">
                        {v.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${v.badgeColor}`}
                      >
                        {v.badge}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">
                      {v.meta}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toast(`Redemption Code: ${v.code}`, { icon: "🎟️" })}
                  className="px-3 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 border border-ink/5 cursor-pointer"
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
            <p className="text-xs text-ink-4">
              Earn XP by completing quests on Botchain to unlock real merchandise, grants, and event passes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}