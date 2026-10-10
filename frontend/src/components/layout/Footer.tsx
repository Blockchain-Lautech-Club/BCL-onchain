"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#04050a] py-8 text-zinc-500 font-sans text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded overflow-hidden border border-white/[0.1] bg-[#0c101a] p-0.5 shrink-0 flex items-center justify-center">
              <Image
                src="/bcl-onchain_logo.PNG"
                alt="BCL Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="font-bold text-white">BCL/ONCHAIN</span>
              <span>—</span>
              <span className="text-[#0052ff] font-semibold">ENGAGE • EARN • BUILD</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <Link href="/tasks" className="hover:text-white transition">Quests</Link>
            <Link href="/domains" className="hover:text-white transition">.bcl Names</Link>
            <Link href="/leaderboard" className="hover:text-white transition">Leaderboard</Link>
            <Link href="/profile" className="hover:text-white transition">Portfolio</Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-600">
          <div>
            Powered by Botchain • Zero Network Fees for Members
          </div>
          <div>
            © 2026 Blockchain LAUTECH Club. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
