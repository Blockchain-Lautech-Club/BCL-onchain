"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, NFTMintRecord, Milestone } from "@/lib/api";
import { getExplorerUrl, CONTRACT_ADDRESSES, botchainPublicClient } from "@/lib/contracts";
import { parseAbi } from "viem";
import { useWalletClient } from "wagmi";
import toast from "react-hot-toast";
import {
  Award, Loader2, ExternalLink, Zap, Shield, CheckCircle2,
  Clock, RefreshCw, AlertCircle, Trophy, Star, Lock,
  Receipt, QrCode, Search, ChevronDown, Package, History
} from "lucide-react";

// ── ABI for the user-side claim() function on BCLRewards ──────────────────
const REWARDS_ABI = parseAbi([
  "function claim(uint256 tokenId) external",
  "function isWhitelisted(address wallet, uint256 tokenId) external view returns (bool)",
  "function hasClaimed(address wallet, uint256 tokenId) external view returns (bool)",
]);

// ── Helpers ───────────────────────────────────────────────────────────────
function milestoneEmoji(type: string): string {
  switch (type?.toLowerCase()) {
    case "level":     return "⚡";
    case "task":      return "✅";
    case "streak":    return "🔥";
    case "community": return "🤝";
    default:          return "🏅";
  }
}

function getCategoryColors(type: string) {
  switch (type?.toLowerCase()) {
    case "level":     return { text: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  };
    case "task":      return { text: "text-accent-fg",  bg: "bg-accent/10",     border: "border-accent/20"     };
    case "streak":    return { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    case "community": return { text: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    default:          return { text: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function RewardsPage() {
  const { walletAddress, connectWallet, user, stats } = useAuth();
  const { data: walletClient } = useWalletClient();

  const [myMints, setMyMints] = useState<NFTMintRecord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  
  const [tab, setTab] = useState<"all" | "ready" | "pending">("all");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const load = useCallback(async () => {
    if (!walletAddress) { setLoading(false); return; }
    setLoading(true);
    try {
      const [mints, allMilestones] = await Promise.all([
        api.getMyNFTs().catch(() => [] as NFTMintRecord[]),
        api.getMilestones().catch(() => [] as Milestone[]),
      ]);
      setMyMints(mints);
      setMilestones(allMilestones);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { load(); }, [load]);

  // ── Claim a whitelisted token ──────────────────────────────────────────
  async function handleClaim(mint: NFTMintRecord) {
    if (!walletClient || !walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      setClaimingId(mint.id);

      const stillWhitelisted = await botchainPublicClient.readContract({
        address: CONTRACT_ADDRESSES.REWARDS,
        abi: REWARDS_ABI,
        functionName: "isWhitelisted",
        args: [walletAddress as `0x${string}`, BigInt(mint.token_id)],
      });

      if (!stillWhitelisted) {
        toast.error("No longer whitelisted for this token — refresh and try again.");
        return;
      }

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.REWARDS,
        abi: REWARDS_ABI,
        functionName: "claim",
        args: [BigInt(mint.token_id)],
      });

      toast.success(
        <span>
          Claim submitted!{" "}
          <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent-fg">
            View tx
          </a>
        </span>
      );

      setMyMints((prev) =>
        prev.map((m) => (m.id === mint.id ? { ...m, status: "pending" } : m))
      );
      setTimeout(load, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Claim failed";
      if (!msg.toLowerCase().includes("rejected")) toast.error(msg);
    } finally {
      setClaimingId(null);
    }
  }

  // ── Unauthenticated state ──────────────────────────────────────────────
  if (!walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <div className="rounded-2xl bg-surface border border-ink/5 p-10 space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-ink/5 flex items-center justify-center mx-auto text-accent-fg">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-ink">Connect to View Rewards</h2>
          <p className="text-sm text-ink-4 leading-relaxed">
            Connect your wallet to see your milestone NFTs, claim pending rewards, and browse the full BCL badge registry.
          </p>
          <button onClick={connectWallet} className="btn-green w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-4">
            <Zap className="w-4 h-4" /> Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────
  const currentPoints = stats?.total_points ?? user?.total_points ?? 0;
  const currentLevel  = stats?.level ?? user?.level ?? 0;

  const claimable  = myMints.filter((m) => m.status === "whitelisted");
  const confirmed  = myMints.filter((m) => m.status === "confirmed");
  const inProgress = myMints.filter((m) => m.status === "queued" || m.status === "pending");
  const failed     = myMints.filter((m) => m.status === "failed");

  // Build a lookup map from token_id → Milestone
  const milestoneMap = Object.fromEntries(milestones.map(m => [m.token_id, m]));

  // Filter milestones for the grid
  let gridMilestones = milestones;
  if (tab === "ready") {
    const claimableIds = new Set(claimable.map(m => m.token_id));
    gridMilestones = milestones.filter(m => claimableIds.has(m.token_id));
  } else if (tab === "pending") {
    const pendingIds = new Set([...inProgress, ...failed].map(m => m.token_id));
    gridMilestones = milestones.filter(m => pendingIds.has(m.token_id));
  }

  if (searchQ) {
    gridMilestones = gridMilestones.filter(m =>
      m.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQ.toLowerCase())
    );
  }

  if (sortBy === "xp-low") {
    gridMilestones = [...gridMilestones].sort((a, b) => (a.points_threshold ?? 0) - (b.points_threshold ?? 0));
  } else if (sortBy === "xp-high") {
    gridMilestones = [...gridMilestones].sort((a, b) => (b.points_threshold ?? 0) - (a.points_threshold ?? 0));
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

      {/* ── Hero Telemetry & Balance Banner ─────────────────────────────────────────── */}
      <section className="relative w-full rounded-2xl bg-surface border border-ink/5 p-6 md:p-10 overflow-hidden shadow-sm">
        <div className="absolute -right-16 -top-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Titles & Narrative */}
          <div className="max-w-2xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 text-ink w-fit shadow-sm border border-ink/5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-fg shadow-[0_0_8px_rgba(0,245,160,0.8)] animate-pulse" />
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Treasury Synced</span>
              <span className="text-ink-4 text-[10px] font-bold">/ ERC-1155 Validated</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-ink tracking-tight">
              Reward Vault & Milestones
            </h1>
            <p className="text-sm md:text-base text-ink-4 max-w-xl leading-relaxed">
              Convert your verified on-chain effort and XP into cryptographic milestone badges. All NFTs are soulbound to your identity.
            </p>
          </div>
          
          {/* Quick Metrics HUD Card */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch gap-4 bg-surface/80 backdrop-blur-xl border border-ink/5 p-4 rounded-2xl shadow-sm">
            
            {/* Total XP */}
            <div className="flex flex-col justify-between p-4 bg-ink/[0.03] rounded-xl min-w-[170px] border border-ink/5">
              <div className="flex items-center justify-between text-ink-4 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Accumulated XP</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-heading font-bold text-amber-500">{currentPoints.toLocaleString()}</span>
                <span className="font-mono text-[10px] text-ink-4 font-bold">BCL-XP</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-fg" />
                <span className="font-mono text-[10px] font-bold text-accent-fg">{claimable.length} Items Eligible Now</span>
              </div>
            </div>
            
            {/* Tier */}
            <div className="flex flex-col justify-between p-4 bg-ink/[0.03] rounded-xl min-w-[190px] border border-ink/5">
              <div className="flex items-center justify-between text-ink-4 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Current Tier</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-heading font-bold text-ink">Level {currentLevel}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded bg-ink/5 text-ink font-mono text-[10px] font-bold w-fit">
                <Star className="w-3 h-3 text-purple-500" />
                <span>Pioneer Status</span>
              </div>
            </div>

          </div>
        </div>
        
        {/* Callout Pill */}
        <div className="relative z-10 mt-8 pt-6 border-t border-ink/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-fg shrink-0" />
            <span className="text-sm text-ink-4">
              Milestone claims permanently bind soulbound credentials to your identity.
            </span>
          </div>
          <a href="#vouchers-drawer" className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-fg hover:underline flex items-center gap-1.5">
            View Claimed History ({confirmed.length}) <ChevronDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* ── Filter, Search & Category Matrix ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Horizontal Scrollable Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {[
              { id: "all",     label: `All Milestones (${milestones.length})` },
              { id: "ready",   label: `Ready to Claim (${claimable.length})` },
              { id: "pending", label: `In Progress (${inProgress.length + failed.length})` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as "all" | "ready" | "pending")}
                className={`shrink-0 px-5 py-2.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                  tab === t.id
                    ? "bg-accent/20 text-accent-fg border border-accent/30"
                    : "bg-surface border border-ink/5 text-ink-4 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" />
              <input 
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full bg-surface border border-ink/10 text-ink pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-accent/40 transition-colors shadow-inner font-mono placeholder:text-ink-4/50" 
                placeholder="Search milestones..." 
                type="text" 
              />
            </div>
            <div className="relative shrink-0">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface border border-ink/10 text-ink text-sm font-semibold pl-4 pr-10 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-accent/40 shadow-inner"
              >
                <option value="featured">Sort: Featured</option>
                <option value="xp-low">XP: Low to High</option>
                <option value="xp-high">XP: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4 pointer-events-none" />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 rounded-xl bg-surface border border-ink/10 text-ink-4 hover:text-ink transition-colors shadow-inner"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-accent-fg" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 3-Column Reward Marketplace Grid ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch min-h-[400px]">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="rounded-2xl bg-surface border border-ink/5 h-[420px] animate-pulse" />)
        ) : gridMilestones.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-surface border border-ink/5 p-16 text-center space-y-4 shadow-sm">
            <Trophy className="w-12 h-12 text-ink-4 mx-auto mb-2" />
            <h3 className="text-2xl font-heading font-bold text-ink">No milestones found</h3>
            <p className="text-sm text-ink-4">Adjust your filters or complete more quests to unlock new rewards.</p>
          </div>
        ) : (
          gridMilestones.map((m) => {
            const myMintRecord = myMints.find((mint) => mint.token_id === m.token_id);
            const isClaimable = myMintRecord?.status === "whitelisted";
            const isPending   = myMintRecord?.status === "pending" || myMintRecord?.status === "queued";
            const isFailed    = myMintRecord?.status === "failed";
            const isConfirmed = myMintRecord?.status === "confirmed";
            const isClaiming  = claimingId === myMintRecord?.id;
            const locked      = !myMintRecord;

            const styles = getCategoryColors(m.milestone_type);
            const emoji  = milestoneEmoji(m.milestone_type);
            
            // Calculate progress if locked — guard against undefined threshold
            const required = m.points_threshold ?? 0;
            const progress  = required > 0 ? Math.min(100, Math.round((currentPoints / required) * 100)) : 0;

            return (
              <article key={m.token_id} className={`group flex flex-col justify-between bg-surface border border-ink/5 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${isConfirmed ? 'opacity-80' : ''}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-accent/10" />
                
                <div className="flex flex-col flex-1">
                  {/* Visual Media / Gradient Area */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gradient-to-br from-ink/5 to-surface border border-ink/5 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ink/5 via-transparent to-transparent opacity-50" />
                    <span className="text-6xl z-10 group-hover:scale-110 transition-transform duration-500">{emoji}</span>
                    
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${styles.bg} ${styles.text} ${styles.border}`}>
                        {m.milestone_type} Milestone
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface/80 border border-ink/10 text-ink-4 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                        Token #{m.token_id}
                      </span>
                    </div>
                  </div>

                  {/* Meta Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-xl font-heading font-bold text-ink leading-tight group-hover:text-accent-fg transition-colors">
                      {m.name}
                    </h2>
                    {m.points_threshold != null && (
                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink/5 text-ink font-mono font-bold">
                        <span>{m.points_threshold.toLocaleString()}</span>
                        <span className="text-[10px] text-ink-4">XP</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-ink-4 mb-4 line-clamp-2">
                    {m.description || "A cryptographic proof of your achievement on the BCL network."}
                  </p>

                  {/* Progress Meter for Locked items */}
                  {locked && required > 0 && (
                    <div className="flex flex-col gap-1.5 mb-4 mt-auto">
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-ink-4">Your XP: {currentPoints.toLocaleString()} / {required.toLocaleString()}</span>
                        <span className="text-ink">{progress}%</span>
                      </div>
                      <div className="w-full bg-ink/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-ink h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Failure note */}
                  {isFailed && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 mb-4 mt-auto">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-wider">{myMintRecord?.failure_reason || "Minting Failed"}</span>
                    </div>
                  )}
                </div>

                {/* Action Area */}
                <div className="pt-4 border-t border-ink/5 flex items-center gap-3">
                  {isClaimable ? (
                    <button 
                      onClick={() => handleClaim(myMintRecord!)}
                      disabled={isClaiming}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-surface font-bold text-sm hover:shadow-[0_0_18px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      <span>{isClaiming ? "Processing Tx..." : "Claim NFT"}</span>
                    </button>
                  ) : isPending ? (
                    <button className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-amber-500/20">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Minting in progress...</span>
                    </button>
                  ) : isConfirmed ? (
                    <div className="flex-1 flex items-center gap-2">
                      <button disabled className="flex-1 py-2.5 px-4 rounded-xl bg-ink/5 text-ink-4 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-ink/5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Claimed</span>
                      </button>
                      {myMintRecord?.transaction_hash && (
                        <a 
                          href={getExplorerUrl(myMintRecord.transaction_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 rounded-xl bg-ink/5 text-ink hover:bg-ink/10 flex items-center justify-center transition-colors border border-ink/5"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <button disabled className="flex-1 py-2.5 px-4 rounded-xl bg-ink/5 text-ink-4 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-ink/5">
                      <Lock className="w-4 h-4" />
                      <span>{required > 0 ? `Locked (Need ${required.toLocaleString()} XP)` : "Locked"}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* ── Redemption History & Active Vouchers Tray ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 bg-surface border border-ink/5 p-6 md:p-10 rounded-2xl shadow-sm mt-8" id="vouchers-drawer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-ink flex items-center gap-2">
              <Receipt className="w-6 h-6 text-accent-fg" />
              <span>Your Claimed Vouchers & History</span>
            </h2>
            <p className="text-sm text-ink-4 mt-1">
              Cryptographically signed digital claims and tracking identifiers.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">Redeemed: {confirmed.length} items</span>
            <button className="px-4 py-2 rounded-xl bg-ink/5 text-ink font-bold text-xs hover:bg-ink/10 transition-colors flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>All Records</span>
            </button>
          </div>
        </div>

        {/* Vouchers List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {confirmed.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-ink-5 font-medium border border-ink/5 rounded-xl bg-ink/[0.02]">
              No claimed rewards found in your history.
            </div>
          ) : (
            confirmed.map((mint) => {
              const meta = milestoneMap[mint.token_id];
              return (
                <div key={mint.id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-ink/10 shadow-sm hover:border-ink/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center text-2xl shrink-0 border border-ink/5">
                      {milestoneEmoji(mint.milestone_type)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-heading font-bold text-ink leading-tight">{meta?.name || `Token #${mint.token_id}`}</span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent-fg border border-accent/20">Claimed</span>
                      </div>
                      <span className="font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">
                        {new Date(mint.created_at).toLocaleDateString()} • Token #{mint.token_id}
                      </span>
                    </div>
                  </div>
                  {mint.transaction_hash && (
                    <a 
                      href={getExplorerUrl(mint.transaction_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View Tx</span>
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}