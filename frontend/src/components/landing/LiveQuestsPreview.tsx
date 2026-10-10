import React from "react";
import { QuestCard } from "@/components/quest/QuestCard";
import type { QuestCardData } from "@/lib/quests";

const FEATURED_QUESTS: QuestCardData[] = [
  { id: "m1", title: "Welcome to BCL Ecosystem", category: "Community", xp: 300, reward: "Genesis Member Badge", description: "Join the official Discord, follow the official X account, and set up your student sovereign profile handle.", image: "/quests/welcome-to-bcl.svg", progressPct: 67, cta: "Continue Quest", ctaVariant: "outline" },
  { id: "m3", title: "Blockchain 101 Interactive Quiz", category: "Learning", xp: 150, reward: "Quiz Scholar Badge", timer: "12 mins", description: "Demonstrate foundational knowledge of consensus algorithms, cryptographic hashes, and EVM architecture basics.", image: "/quests/blockchain-101-quiz.svg", cta: "Start Quiz", ctaVariant: "green" },
  { id: "m2", title: "Build Your First DApp on Mainnet", category: "Developer", xp: 750, reward: "Rare Builder NFT", description: "Deploy an audited smart contract, connect a front-end interface, and submit the verified repository hash.", image: "/quests/build-your-first-dapp.svg", cta: "Review Submission Criteria", ctaVariant: "outline" },
];

export function LiveQuestsPreview() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-5 mb-1">// MISSIONS AVAILABLE</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink tracking-tight">Featured Quests</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {["All Quests", "Beginner", "Developer", "Governance"].map((f, i) => (
            <button
              key={f}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                i === 0
                  ? "bg-accent/15 text-accent-fg border border-accent/25"
                  : "text-ink-4 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURED_QUESTS.map((q) => <QuestCard key={q.id} quest={q} />)}
      </div>
    </section>
  );
}
