"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Compass, Globe2, Calendar, Trophy, Gift, User,
  Flame, Bell, Zap, Menu, X, BookOpen
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Quests", icon: Compass },
  { href: "/explore", label: "Explore", icon: Globe2 },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/reward", label: "Rewards", icon: Gift },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { walletAddress, connectWallet, user, stats } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleClaimIdentity = () => {
    router.push("/onboarding");
  };

  return (
    <header className="navbar-glass sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Logo & Network */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="BCL Onchain Logo" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </Link>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-accent-fg bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Mainnet Connected
          </span>
        </div>

        {/* Center: Desktop Nav Pill */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface border border-ink/[0.06] rounded-full p-1.5 shadow-sm">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href) && (href !== "/" || pathname === "/");
            return (
              <Link
                key={label}
                href={href}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-brand text-white shadow-md shadow-brand/20"
                    : "text-ink-3 hover:text-ink hover:bg-ink/[0.04]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/profile"
            className={`hidden sm:flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              pathname === "/profile"
                ? "bg-accent/15 text-accent-fg border border-accent/20"
                : "text-ink-3 hover:text-ink hover:bg-ink/[0.04]"
            }`}
          >
            Profile
          </Link>

          <ThemeToggle />

          {walletAddress ? (
            <>
              {/* Streak */}
              <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 num-mono">
                  {stats?.streak_days || 7}d
                </span>
              </div>

              {/* Notification Bell */}
              <Link
                href="/notifications"
                className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                  pathname === "/notifications"
                    ? "bg-accent/10 border-accent/25 text-accent-fg"
                    : "bg-ink/[0.04] border-ink/[0.06] text-ink-3 hover:text-ink"
                }`}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
              </Link>

              {/* User Avatar */}
              <div className="flex items-center gap-2 bg-ink/[0.04] border border-ink/[0.06] px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-brand-soft flex items-center justify-center shadow-inner">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="hidden sm:block text-xs font-medium text-ink">
                  {user?.bcl_domain || shortAddr || "philip.bcl"}
                </span>
              </div>
            </>
          ) : (
            <button
              onClick={handleClaimIdentity}
              className="btn-primary flex items-center gap-1.5 px-5 py-2 text-xs rounded-full"
            >
              <Zap className="w-3.5 h-3.5" />
              Claim Identity
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-8 h-8 rounded-full bg-ink/[0.04] border border-ink/[0.06] flex items-center justify-center text-ink-3"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-ink/[0.06] bg-surface/95 backdrop-blur-xl px-4 py-3 space-y-1 shadow-xl">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive(href)
                  ? "bg-brand/10 text-brand"
                  : "text-ink-3 hover:text-ink hover:bg-ink/[0.03]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-3 hover:text-ink hover:bg-ink/[0.03] transition"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <button
            onClick={() => { setMobileOpen(false); router.push("/onboarding"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand-hi transition shadow-md"
          >
            <Zap className="w-4 h-4" />
            Claim Identity
          </button>
        </div>
      )}
    </header>
  );
}