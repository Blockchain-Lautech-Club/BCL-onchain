import { LandingHero } from "@/components/landing/LandingHero";

export default function Home() {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 overflow-x-hidden space-y-2">
      <LandingHero />
    </div>
  );
}
