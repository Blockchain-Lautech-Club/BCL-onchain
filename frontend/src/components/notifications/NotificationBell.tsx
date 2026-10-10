"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Award, CheckCircle2, XCircle, Zap, Shield, Loader2 } from "lucide-react";
import { api, NotificationItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function NotificationBell() {
  const { walletAddress } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      const list = await api.getNotifications();
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch {
      // Ignore if unauthenticated or offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [walletAddress]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      setMarkingRead(true);
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    } finally {
      setMarkingRead(false);
    }
  };

  if (!walletAddress) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.08] bg-[#0c101a] hover:bg-[#141a28] text-zinc-300 hover:text-white transition cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0052ff] text-[10px] font-bold text-white shadow-sm ring-2 ring-[#06080e]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/[0.1] bg-[#0a0d15] shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] p-3.5 px-4 bg-[#080b12]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-heading text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-[#0052ff]/20 text-[#4d86ff] border border-[#0052ff]/30 px-2 py-0.2 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                {markingRead ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-[#0052ff]" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-[#0052ff]" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-30 text-zinc-400" />
                <p className="font-semibold text-zinc-400">All caught up!</p>
                <p className="text-[11px]">No notifications to review right now.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isNft = item.kind.includes("nft") || item.kind.includes("mint");
                const isVerified = item.kind.includes("verified") || item.kind.includes("approved");
                const isRejected = item.kind.includes("rejected");

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 px-4 flex items-start gap-3 transition ${
                      item.read ? "bg-transparent opacity-75" : "bg-white/[0.02]"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isNft ? (
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                          <Award className="h-3.5 w-3.5" />
                        </div>
                      ) : isVerified ? (
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : isRejected ? (
                        <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                          <XCircle className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-[#0052ff]/10 border border-[#0052ff]/20 text-[#0052ff] flex items-center justify-center">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs text-zinc-200 leading-snug font-sans break-words">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!item.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0052ff]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
