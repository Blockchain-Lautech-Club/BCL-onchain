"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

export function CampaignTopBanner() {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#002f99] via-brand to-[#002f99] px-4 py-2 text-xs font-sans text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-2 text-center">
          <span className="font-semibold">BCL Onchain is live on Botchain Testnet</span>
          <span className="hidden sm:inline opacity-75">— Free milestone badges &amp; .bcl usernames.</span>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:opacity-90 ml-1"
          >
            <span>Explore Quests</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <button
          onClick={() => setClosed(true)}
          className="opacity-75 hover:opacity-100 p-0.5 cursor-pointer shrink-0 ml-2"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
