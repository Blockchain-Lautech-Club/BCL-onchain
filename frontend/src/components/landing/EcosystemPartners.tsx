import React from "react";

const PARTNERS = ["LAUTECH", "Ethereum", "Starknet", "Solana", "Base", "Arbitrum"];

export function EcosystemPartners() {
  return (
    <section className="py-8 border-t border-ink/[0.05]">
      <div className="text-center mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-5 mb-2">// MULTI-CHAIN NETWORK</div>
        <h2 className="text-xl font-extrabold font-heading text-ink">Backed by Ecosystem Giants</h2>
        <p className="text-xs text-ink-5 mt-1">LAUTECH student attestations and credentials are recognized and verifiable across global Layer-1 and Layer-2 blockchains.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {PARTNERS.map((p) => (
          <div key={p} className="flex items-center gap-2 bg-ink/[0.03] border border-ink/[0.06] px-4 py-2.5 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent/40 to-brand/40" />
            <span className="text-xs font-semibold text-ink-4">{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
