"use client";

import React, { useEffect, useState } from "react";
import { api, NotificationItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Bell, CheckCheck, Award, CheckCircle2, XCircle, Zap,
  Shield, Loader2, Filter, Inbox, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

type NotificationWithTx = NotificationItem & { tx_hash?: string };

const KIND_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  task_verified: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Quest Verified", color: "text-green-400 bg-green-400/10" },
  task_rejected: { icon: <XCircle className="w-4 h-4" />, label: "Quest Rejected", color: "text-red-400 bg-red-400/10" },
  milestone_mint: { icon: <Award className="w-4 h-4" />, label: "NFT Minted", color: "text-purple-400 bg-purple-400/10" },
  points_awarded: { icon: <Zap className="w-4 h-4" />, label: "XP Awarded", color: "text-yellow-400 bg-yellow-400/10" },
  admin_action: { icon: <Shield className="w-4 h-4" />, label: "Admin Action", color: "text-blue-400 bg-blue-400/10" },
  level_up: { icon: <Award className="w-4 h-4" />, label: "Level Up!", color: "text-accent-fg bg-accent/10" },
  streak_bonus: { icon: <Zap className="w-4 h-4" />, label: "Streak Bonus", color: "text-amber-400 bg-amber-400/10" },
};

// Mock data uses relative offsets so no clock is read at module load.
const MOCK_BASE: (Omit<NotificationWithTx, "created_at"> & { minsAgo: number })[] = [
  { id: 1, kind: "task_verified", message: "Your submission for 'Automated userOp Bundler Suite' has been verified. +200 XP awarded.", read: false, minsAgo: 3, data: {} },
  { id: 2, kind: "level_up", message: "🎉 You reached Level 14 Pioneer! New rewards are now unlocked in your vault.", read: false, minsAgo: 45, data: {} },
  { id: 3, kind: "streak_bonus", message: "7-Day Protocol Streak achieved! +250 XP Soulbound token minted to 0x742d...44e.", read: false, minsAgo: 120, data: {} },
  { id: 4, kind: "milestone_mint", message: "Your '7-Day Streak Master' NFT has been minted and confirmed on-chain. View on explorer.", read: true, minsAgo: 300, data: {}, tx_hash: "0xabc123..." },
  { id: 5, kind: "task_rejected", message: "Submission for 'BCL Content Creator' was returned: Please tag @BCL_Community in your thread.", read: true, minsAgo: 60 * 24, data: {} },
  { id: 6, kind: "points_awarded", message: "Admin granted 100 XP for attending Foundry Masterclass: Gas Optimization.", read: true, minsAgo: 60 * 30, data: {} },
  { id: 7, kind: "task_verified", message: "Deploy ERC-4337 Account Factory to Base Sepolia verified. +350 XP. Great work!", read: true, minsAgo: 60 * 48, data: {} },
  { id: 8, kind: "admin_action", message: "Your Devcon Global Travel Raffle ticket has been activated. Check your Reward Vault.", read: true, minsAgo: 60 * 72, data: {} },
];

function buildMock(now: number): NotificationItem[] {
  return MOCK_BASE.map(({ minsAgo, ...rest }) => ({
    ...rest,
    created_at: new Date(now - minsAgo * 60_000).toISOString(),
  }));
}

// `now` is null until after mount, so server and first client render match.
function timeAgo(iso: string, now: number | null): string {
  if (now === null) return "";
  const m = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type FilterType = "all" | "unread" | "task_verified" | "milestone_mint" | "points_awarded";

export default function NotificationsPage() {
  const { walletAddress } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  // Seed mock data and start the clock after mount (declared before the API effect
  // so real data, if any, overrides the mocks).
  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setNotifications((prev) => (prev.length ? prev : buildMock(t)));
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    api.getNotifications()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setNotifications(data); })
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
          { id: "all", label: "All" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "task_verified", label: "Quests" },
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
          <p className="text-ink-4 text-sm">No notifications here yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = KIND_META[n.kind] ?? { icon: <Bell className="w-4 h-4" />, label: n.kind, color: "text-ink-4 bg-white/5" };
            const txHash = (n as NotificationWithTx).tx_hash;
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
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.color.split(" ")[0]}`}>
                      {meta.label}
                    </span>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-ink leading-snug">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-ink-5" suppressHydrationWarning>
                      {timeAgo(n.created_at, now)}
                    </span>
                    {txHash && (
                      <a
                        href={`https://basescan.org/tx/${txHash}`}
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

      {/* Pagination hint */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-ink-5">
          Showing {filtered.length} of {notifications.length} notifications · Older activity visible on-chain
        </p>
      )}
    </div>
  );
}