import React from "react";
import Link from "next/link";
import { ArrowRight, AtSign, Compass, Zap, Gift } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: AtSign,
    title: "Claim Your Identity",
    desc: "Reserve your unique username.bcl subdomain with zero gas fees. Pair your student ID and EVM wallet securely.",
    cta: "Mint Identity pass",
    href: "/domains",
  },
  {
    num: "02",
    icon: Compass,
    title: "Complete Quests",
    desc: "Solve algorithmic tasks, push commits to BCL GitHub repos, attend campus hack nights, or host developer spaces.",
    cta: "Explore open bounties",
    href: "/tasks",
  },
  {
    num: "03",
    icon: Zap,
    title: "Earn XP & Badges",
    desc: "Receive verifiable soulbound badges directly to your identity. Watch your global tier ascend dynamically onchain.",
    cta: "Verify badge ledger",
    href: "/profile",
  },
  {
    num: "04",
    icon: Gift,
    title: "Unlock Rewards",
    desc: "Convert hard-earned XP into ecosystem grants, hardware stipends, international summit sponsorships, and exclusive swag.",
    cta: "View rewards vault",
    href: "/profile",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-5 mb-1">// PROTOCOL MECHANICS</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink tracking-tight">How BCL Onchain Works</h2>
        </div>
        <p className="hidden sm:block text-xs text-ink-4 max-w-xs text-right leading-relaxed">
          A seamless 4-tier loop converting everyday university and web3 actions into permanent cryptographic accolades.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map(({ num, icon: Icon, title, desc, cta, href }) => (
          <div key={num} className="quest-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold font-heading text-ink/[0.07] num-mono">{num}</span>
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-accent-fg" />
              </div>
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-ink mb-1.5">{title}</h3>
              <p className="text-xs text-ink-4 leading-relaxed">{desc}</p>
            </div>
            <Link href={href} className="flex items-center gap-1 text-xs text-accent-fg font-semibold mt-auto hover:gap-2 transition-all">
              {cta} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
