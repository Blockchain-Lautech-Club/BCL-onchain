import { LandingHero } from "@/components/landing/LandingHero";
import { WhatIsBclOnchain } from "@/components/landing/WhatIsBclOnchain";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LiveQuestsPreview } from "@/components/landing/LiveQuestsPreview";
import { LeaderboardSpotlight } from "@/components/landing/LeaderboardSpotlight";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingCta } from "@/components/landing/LandingCta";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-16">
        {/* Hero Section with .bcl Domain Claim */}
        <LandingHero />

        {/* Core Mission & Purpose: What is BCL Onchain For? */}
        <WhatIsBclOnchain />

        {/* How It Works in 3 Steps */}
        <HowItWorksSection />

        {/* Live Active Quests & Hands-on Challenges */}
        <LiveQuestsPreview />

        {/* Top Builders Leaderboard Spotlight */}
        <LeaderboardSpotlight />

        {/* Frequently Asked Questions */}
        <LandingFaq />

        {/* Final Call to Action */}
        <LandingCta />
      </main>
    </div>
  );
}
