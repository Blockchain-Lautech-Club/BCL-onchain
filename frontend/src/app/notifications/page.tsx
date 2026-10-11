"use client";

import React, { useEffect, useState } from "react";
import { api, NotificationItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Bell, CheckCheck, Award, CheckCircle2, XCircle, Zap,
  Shield, Loader2, Filter, Inbox, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { getExplorerUrl } from "@/lib/contracts";

const KIND_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  task_verified:   { icon: <CheckCircle2 className="w-4 h-4" />, label: "Quest Verified",  color: "text-green-400 bg-green-400/10" },
  task_rejected:   { icon: <XCircle className="w-4 h-4" />,      label: "Quest Rejected",  color: "text-red-400 bg-red-400/10" },
  milestone_mint:  { icon: <Award className="w-4 h-4" />,        label: "NFT Minted",      color: "text-purple-400 bg-purple-400/10" },
  nft_status:      { icon: <Award className="w-4 h-4" />,        label: "NFT Update",      color: "text-purple-400 bg-purple-400/10" },
  streak_nft_queued: { icon: <Zap className="w-4 h-4" />,        label: "Streak NFT",      color: "text-amber-400 bg-amber-400/10" },
  points_awarded:  { icon: <Zap className="w-4 h-4" />,          label: "XP Awarded",      color: "text-yellow-400 bg-yellow-400/10" },
  admin_action:    { icon: <Shield className="w-4 h-4" />,        label: "Admin Action",    color: "text-blue-400 bg-blue-400/10" },
  level_up:        { icon: <Award className="w-4 h-4" />,         label: "Level Up!",       color: "text-accent-fg bg-accent/10" },
  streak_bonus:    { icon: <Zap className="w-4 h-4" />,           label: "Streak Bonus",    color: "text-amber-400 bg-amber-400/10" },
  domain_registered: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Name Registered", color: "text-green-400 bg-green-400/10" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type FilterType = "all" | "unread" | "task_verified" | "milestone_mint" | "points_awarded";

export default function NotificationsPage() {
  const { walletAddress, connectWallet } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!walletAddress) { setLoading(false); return; }
    setLoading(true);
    api.getNotifications()
      .then((data) => { setNotifications(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "all") return true;
    return n.kind === filter;
  });

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setMarking(false);
    }
  };

  const handleMarkOne = (id: number) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  if (!walletAddress) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Bell className="w-12 h-12 text-ink-5 mx-auto" />
        <h2 className="text-xl font-bold font-heading text-ink">Connect to view notifications</h2>
        <p className="text-sm text-ink-4">Sign in with your wallet to see your BCL activity feed.</p>
        <button onClick={connectWallet} className="btn-green px-6 py-2.5 text-sm font-bold">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-accent-fg" />
            <h1 className="text-2xl font-extrabold font-heading text-ink">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-4">On-chain receipts, quest updates, and protocol alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="btn-outline flex items-center gap-2 shrink-0 text-sm"
          >
            {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-ink-5" />
        {([
          { id: "all",            label: "All" },
          { id: "unread",         label: `Unread (${unreadCount})` },
          { id: "task_verified",  label: "Quests" },
          { id: "milestone_mint", label: "NFTs" },
          { id: "points_awarded", label: "XP" },
        ] as { id: FilterType; label: string }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === f.id
                ? "bg-accent text-white"
                : "bg-subtle border border-white/8 text-ink-4 hover:border-accent/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent-fg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Inbox className="w-10 h-10 text-ink-5 mx-auto" />
          <p className="text-ink-4 text-sm">
            {notifications.length === 0
              ? "No notifications yet — complete a quest to get started!"
              : "No notifications match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = KIND_META[n.kind] ?? {
              icon: <Bell className="w-4 h-4" />,
              label: n.kind,
              color: "text-ink-4 bg-white/5",
            };
            const txHash = (n.data as Record<string, string>)?.tx_hash;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.read) handleMarkOne(n.id); }}
                className={`rounded-xl border p-4 flex items-start gap-4 transition-all cursor-default ${
                  !n.read
                    ? "bg-accent/5 border-accent/20 hover:bg-accent/8"
                    : "bg-surface border-white/6 hover:border-white/12"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                  {meta.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.color.split(" ")[0]}`}>
                      {meta.label}
                    </span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                  </div>
                  <p className="text-sm text-ink leading-snug">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-ink-5">{timeAgo(n.created_at)}</span>
                    {txHash && (
                      <a
                        href={getExplorerUrl(txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-accent-fg hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-ink-5">
          Showing {filtered.length} of {notifications.length} notifications
        </p>
      )}
    </div>
  );
}