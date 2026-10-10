"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Wallet,
  LogOut,
  Layers,
  Globe,
  BarChart2,
  User,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const { walletAddress, user, connectWallet, disconnectWallet, isConnecting } = useAuth();

  const links = [
    { label: "Quests", href: "/tasks", icon: Layers },
    { label: ".bcl Names", href: "/domains", icon: Globe },
    { label: "Leaderboard", href: "/leaderboard", icon: BarChart2 },
    { label: "Portfolio", href: "/profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06080e]/95 backdrop-blur-sm">
      {/* Protocol Ticker Strip */}
      <div className="border-b border-white/[0.04] bg-[#04050a] px-4 py-1 text-[11px] font-medium tracking-wide text-zinc-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0052ff] animate-pulse" />
              <span>BOTCHAIN TESTNET</span>
            </span>
            <span className="hidden sm:inline text-zinc-700">|</span>
            <span className="hidden sm:inline text-zinc-400">ENGAGE • EARN • BUILD</span>
            <span className="hidden md:inline text-zinc-700">|</span>
            <span className="hidden md:inline text-zinc-500">ZERO NETWORK FEES</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-500 font-semibold tracking-wider text-[10px]">BLOCKCHAIN LAUTECH</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand with official Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 rounded overflow-hidden border border-white/[0.1] bg-[#0c101a] flex items-center justify-center p-0.5 group-hover:border-[#0052ff]/60 transition">
              <Image
                src="/bcl-onchain_logo.PNG"
                alt="BCL Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-heading">
                <span className="font-extrabold text-white text-base tracking-tight">BCL</span>
                <span className="font-extrabold text-[#0052ff] text-base tracking-tight">ONCHAIN</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase -mt-0.5">
                Engage • Earn • Build
              </span>
            </div>
          </Link>

          {/* Segmented Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-white/[0.08] text-white border border-white/[0.12] font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User State / Connect */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2">
              {/* Points badge */}
              <div className="hidden sm:flex items-center gap-2 border border-white/[0.08] bg-[#0c101a] px-2.5 py-1 rounded-lg text-xs font-medium">
                <span className="text-zinc-400 text-[11px]">LVL {user?.level || 1}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-[#0052ff] font-bold num-mono">{user?.total_points || 0} PTS</span>
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Wallet Address button */}
              <Link
                href="/profile"
                className="flex items-center gap-2 border border-white/[0.08] bg-[#0c101a] hover:bg-[#121827] px-3 py-1 rounded-lg text-xs font-mono text-zinc-300 transition"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#0052ff]" />
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </Link>

              {/* Logout button */}
              <button
                onClick={disconnectWallet}
                title="Disconnect"
                className="p-1.5 rounded-lg border border-white/[0.08] bg-[#0c101a] text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-1.5 rounded-lg bg-[#0052ff] hover:bg-[#1a68ff] px-4 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-sm hover:shadow-md hover:shadow-[#0052ff]/20 disabled:opacity-50"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{isConnecting ? "CONNECTING..." : "CONNECT"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
