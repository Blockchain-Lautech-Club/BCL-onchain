"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, CheckCircle2, XCircle, ArrowRight, Loader2, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { checkOnchainNameAvailability } from "@/lib/contracts";

export function DomainSearchCompact() {
  const [label, setLabel] = useState("");
  const [years, setYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    available: boolean;
    price_per_year_bcl_wei: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = label.trim().toLowerCase().replace(".bcl", "");
    if (!clean || clean.length < 3) return;

    try {
      setLoading(true);
      setResult(null);
      setError(null);
      
      let res;
      try {
        res = await api.checkNameAvailability(clean);
      } catch {
        res = await checkOnchainNameAvailability(clean);
      }
      setResult(res);
    } catch (err) {
      console.error("Availability check failed:", err);
      setError("Unable to query domain registrar at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card rounded p-5 space-y-4 card-interactive">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-heading font-bold text-white uppercase tracking-wider">.bcl Username Search</span>
        </div>
        <span className="text-[10px] font-medium text-zinc-400">Web3 Handle</span>
      </div>

      <p className="text-xs text-zinc-400 leading-normal font-sans">
        Check username availability and claim your custom handle.
      </p>

      {/* Input Module */}
      <form onSubmit={handleLookup} className="space-y-3 font-sans">
        <div className="relative">
          <input
            type="text"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (result) setResult(null);
            }}
            placeholder="e.g. philip, builder, ada"
            className="w-full bg-[#08090d] border border-white/[0.1] rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0052ff]"
          />
          <span className="absolute right-3.5 top-2.5 text-[11px] text-zinc-400 font-bold">.bcl</span>
        </div>

        <button
          type="submit"
          disabled={loading || !label.trim()}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] py-2.5 text-xs font-semibold text-zinc-200 transition cursor-pointer disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          <span>CHECK AVAILABILITY</span>
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg p-2.5 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Result Module */}
      {result && (
        <div className="border border-white/[0.08] bg-[#090b10] rounded-lg p-3.5 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-heading">{result.name}</span>
            {result.available ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                AVAILABLE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
                <XCircle className="h-3.5 w-3.5" />
                TAKEN
              </span>
            )}
          </div>

          {result.available && (
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between font-sans">
              <span className="text-[11px] text-zinc-400">Rate: 10 BCL / year</span>
              <Link
                href={`/domains?name=${encodeURIComponent(label.trim())}`}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
              >
                <span>CLAIM NOW</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
