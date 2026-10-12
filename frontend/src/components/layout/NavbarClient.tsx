"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Compass, Globe, Globe2, Calendar, Trophy, Gift, User,
  Flame, Bell, Zap, Menu, X, BookOpen, ShoppingBag,
  BadgeCheck, LogOut, Copy, ExternalLink, ChevronDown, Wallet, Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import toast from "react-hot-toast";

const NAV_LINKS = [
  { href: "/",            label: "Home",        icon: Home        },
  { href: "/tasks",       label: "Quests",      icon: Compass     },
  { href: "/domains",     label: "Domains",     icon: Globe       },
  { href: "/explore",     label: "Explore",     icon: Globe2      },
  { href: "/learn",       label: "Learn",       icon: BookOpen    },
  { href: "/events",      label: "Events",      icon: Calendar    },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy      },
  { href: "/reward",      label: "Rewards",     icon: Gift        },
  { href: "/market",      label: "Market",      icon: ShoppingBag },
];

export function NavbarClient() {
  const pathname = usePathname();
  const router   = useRouter();
  const { walletAddress, connectWallet, disconnectWallet, user, stats } = useAuth();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Redirect "/" based on wallet connection state
  useEffect(() => {
    if (pathname === "/") {
      router.replace(walletAddress ? "/dashboard" : "/");
    }
  }, [walletAddress, pathname, router]);

  // Close profile popup on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  // Real display name: use registered .bcl domain if owned onchain, otherwise profile username or address
  const displayName = user?.bcl_domain || user?.username || shortAddr || "Citizen";

  // Resolve nav href: Home goes to /dashboard if connected, /landing if not
  const resolveHref = (href: string) => {
    if (href === "/") return walletAddress ? "/dashboard" : "/";
    return href;
  };

  const isActive = (href: string) => {
    const resolved = resolveHref(href);
    if (resolved === "/dashboard" || resolved === "/") {
      return pathname === "/dashboard" || pathname === "/" || pathname === "/";
    }
    return pathname.startsWith(resolved);
  };

  // XP / level data
  const level         = stats?.level ?? user?.level ?? 0;
  const totalXp       = stats?.total_points ?? user?.total_points ?? 0;
  const xpToNext      = stats?.points_to_next_level ?? 0;
  const nextThreshold = stats?.next_level_threshold ?? 1;
  const progressPct   = nextThreshold > 0
    ? Math.min(100, Math.round(((nextThreshold - xpToNext) / nextThreshold) * 100))
    : 75;

  const handleCopyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied!");
  };

  const handleDisconnect = async () => {
    setProfileOpen(false);
    try {
      await disconnectWallet?.();
    } catch {
      // fallback
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.3)] border-b border-ink/[0.06] w-full overflow-x-hidden">
      <div className="h-16 sm:h-20 max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between gap-2 sm:gap-4">

        {/* ── Logo → always goes to landing page ─────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.png" alt="BCL Onchain Logo" width={30} height={30} className="object-contain shrink-0" />
            <span className="font-heading text-sm sm:text-base md:text-lg font-bold text-ink tracking-tight truncate">BCL Onchain</span>
          </Link>
          <span className="hidden xl:flex items-center gap-1.5 text-[10px] font-semibold text-accent-fg bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_rgba(0,245,160,0.8)]" />
            Mainnet Connected
          </span>
        </div>

        {/* ── Desktop Nav ─────────────────────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-ink/[0.04] border border-ink/[0.06] rounded-full px-1.5 py-1.5 shadow-sm">
          {NAV_LINKS.map(({ href, label }) => {
            const resolvedHref = resolveHref(href);
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={resolvedHref}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-ink/[0.10] text-accent-fg font-semibold shadow-sm"
                    : "text-ink-3 hover:text-ink hover:bg-ink/[0.04]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Side ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {walletAddress ? (
            <>
              {/* Streak */}
              <div className="hidden xs:flex items-center gap-1 sm:gap-1.5 bg-ink/[0.05] border border-ink/[0.08] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-[inset_0_0_10px_rgba(249,189,34,0.1)]">
                <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold text-orange-500 font-mono">
                  {stats?.streak_days ?? 7}d
                </span>
              </div>

              {/* XP Level block — 2xl only */}
              <div className="hidden 2xl:flex flex-col justify-center px-3 py-1.5 rounded-lg bg-ink/[0.04] border border-ink/[0.06] min-w-[148px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-ink font-mono">L{level} Pioneer</span>
                  <span className="text-[11px] font-bold text-accent-fg font-mono">
                    {totalXp.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full bg-ink/10 h-1 rounded-full overflow-hidden my-1">
                  <div
                    className="bg-accent h-full rounded-full shadow-[0_0_6px_rgba(0,245,160,0.6)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-4 font-mono">
                  {xpToNext.toLocaleString()} XP to L{level + 1}
                </span>
              </div>

              {/* Notification bell */}
              <Link
                href="/notifications"
                className={`hidden sm:flex relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border items-center justify-center transition-colors ${
                  pathname === "/notifications"
                    ? "bg-accent/10 border-accent/25 text-accent-fg"
                    : "bg-ink/[0.04] border-ink/[0.06] text-ink-3 hover:text-ink hover:bg-ink/[0.08]"
                }`}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_rgba(0,245,160,0.8)]" />
              </Link>

              {/* ── User avatar + profile popup ────────────────────────── */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-ink/[0.04] border border-ink/[0.06] p-0.5 sm:pl-1 sm:pr-2.5 sm:py-1 rounded-full hover:bg-ink/[0.08] transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center border border-ink/10 shrink-0">
                    {user?.avatar_url ? (
                      user.avatar_url.startsWith("http") || user.avatar_url.startsWith("/") || user.avatar_url.startsWith("data:") ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm sm:text-base select-none leading-none">{user.avatar_url}</span>
                      )
                    ) : (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface" />
                    )}
                  </div>
                  <span className="hidden md:block text-[13px] font-medium text-ink max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <BadgeCheck className="hidden xs:block w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-fg shrink-0" />
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-ink-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Popup */}
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-2xl bg-surface border border-ink/10 shadow-2xl shadow-black/30 overflow-hidden z-50">

                    {/* Header */}
                    <div className="px-4 py-4 border-b border-ink/5 bg-ink/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shrink-0 overflow-hidden border border-ink/10">
                          {user?.avatar_url ? (
                            user.avatar_url.startsWith("http") || user.avatar_url.startsWith("/") || user.avatar_url.startsWith("data:") ? (
                              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg select-none leading-none">{user.avatar_url}</span>
                            )
                          ) : (
                            <User className="w-5 h-5 text-surface" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-ink text-sm truncate">{user?.username || shortAddr}</span>
                            <BadgeCheck className="w-4 h-4 text-accent-fg shrink-0" />
                          </div>
                          {user?.bcl_domain ? (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-accent-fg font-semibold mt-0.5">
                              <Globe2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{user.bcl_domain}</span>
                            </div>
                          ) : (
                            <Link
                              href="/domains"
                              onClick={() => setProfileOpen(false)}
                              className="text-[11px] font-mono text-accent-fg/80 hover:text-accent-fg hover:underline font-medium flex items-center gap-1 mt-0.5"
                            >
                              <Globe2 className="w-3 h-3 shrink-0" />
                              Claim .bcl domain →
                            </Link>
                          )}
                          <span className="font-mono text-[10px] text-ink-4 truncate block mt-0.5">{shortAddr}</span>
                        </div>
                      </div>

                      {/* XP bar inside popup */}
                      <div className="mt-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-ink-4">L{level} Pioneer</span>
                          <span className="text-accent-fg">{totalXp.toLocaleString()} XP</span>
                        </div>
                        <div className="w-full bg-ink/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-accent h-full rounded-full shadow-[0_0_6px_rgba(0,245,160,0.6)]"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-4 font-mono">{xpToNext.toLocaleString()} XP to L{level + 1}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      {typeof window !== "undefined" && !localStorage.getItem("bcl_auth_token") && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            connectWallet();
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-accent-fg bg-accent/10 hover:bg-accent/20 transition-colors w-full text-left mb-1"
                        >
                          <Shield className="w-4 h-4 text-accent-fg" />
                          Sign In Session
                        </button>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-ink/5 transition-colors w-full"
                      >
                        <User className="w-4 h-4 text-ink-4" />
                        View Profile
                      </Link>

                      <button
                        onClick={handleCopyAddress}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-ink/5 transition-colors w-full text-left"
                      >
                        <Copy className="w-4 h-4 text-ink-4" />
                        Copy Address
                      </button>

                      <a
                        href={`https://explorer.botchain.io/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-ink/5 transition-colors w-full"
                      >
                        <ExternalLink className="w-4 h-4 text-ink-4" />
                        View on Explorer
                      </a>
                    </div>

                    {/* Disconnect */}
                    <div className="p-2 pt-0 border-t border-ink/5">
                      <button
                        onClick={handleDisconnect}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* ─────────────────────────────────────────────────────────── */}

            </>
          ) : (
            /* ── Not connected ─ */
            <button
              onClick={connectWallet}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent text-surface text-xs sm:text-[13px] font-bold hover:shadow-[0_0_20px_rgba(0,245,160,0.4)] transition-all shrink-0"
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-full bg-ink/[0.04] border border-ink/[0.06] flex items-center justify-center text-ink-3"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-ink/[0.06] bg-surface/95 backdrop-blur-xl px-4 py-3 space-y-1 shadow-xl">

          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const resolvedHref = resolveHref(href);
            return (
              <Link
                key={label}
                href={resolvedHref}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive(href)
                    ? "bg-accent/10 text-accent-fg"
                    : "text-ink-3 hover:text-ink hover:bg-ink/[0.04]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}

          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-3 hover:text-ink hover:bg-ink/[0.04] transition"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

          <div className="border-t border-ink/5 pt-2 mt-2 space-y-1">
            {walletAddress ? (
              <>
                <div className="px-3 py-2 font-mono text-[10px] text-ink-4 font-bold uppercase tracking-wider">
                  {shortAddr}
                </div>
                <button
                  onClick={() => { setMobileOpen(false); handleDisconnect(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); connectWallet(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-bold bg-accent text-surface hover:shadow-[0_0_16px_rgba(0,245,160,0.3)] transition"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}