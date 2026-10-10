"use client";
import React, { useState } from "react";
import { Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LandingCTA() {
  const { connectWallet } = useAuth();
  const [handle, setHandle] = useState("");

  return (
    <section className="py-8 border-t border-ink/[0.05]">
      <div className="relative rounded-2xl bg-gradient-to-br from-surface to-surface border border-accent/15 p-8 sm:p-14 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent/[0.08] blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-5 mb-3">// READY TO LEAVE YOUR MARK?</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink mb-3 leading-tight">
              Claim your verified .bcl name and kickstart your builder portfolio today.
            </h2>
            <p className="text-sm text-ink-4 leading-relaxed">
              Instant onboarding in 30 seconds. Connect your university email or EVM wallet to reserve credentials before global mint caps close.
            </p>
          </div>

          <div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-page border border-ink/[0.1] rounded-xl px-4 py-2.5">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourhandle"
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-5 outline-none"
                />
                <span className="text-xs font-bold text-ink-4">.bcl</span>
              </div>
              <button onClick={connectWallet} className="btn-green px-5 py-2.5 text-sm shrink-0 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Claim
              </button>
            </div>
            <p className="text-[10px] text-ink-5 mt-2">Connect BCL Global Network · Join conversations, weekly AMAs, and code sprint channels.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
