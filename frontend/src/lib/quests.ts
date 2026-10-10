import type { Task } from "@/lib/api";

/** Normalised shape rendered by <QuestCard/> on every page (tasks, dashboard, landing, community hub). */
export interface QuestCardData {
  id: string | number;
  title: string;
  description: string;
  category: string;
  xp: number;
  image: string;
  difficulty?: string;
  reward?: string;
  participants?: string;
  timer?: string;
  status?: "complete" | "submitted" | "under_review" | "rejected" | "expired";
  featured?: boolean;
  cta?: string;
  ctaVariant?: "green" | "outline";
  progressPct?: number;
}

const COVER_BY_CATEGORY: Record<string, string> = {
  community: "/quests/welcome-to-bcl.svg",
  developer: "/quests/build-your-first-dapp.svg",
  learning: "/quests/blockchain-101-quiz.svg",
  hackathon: "/quests/confluence-hackathon.svg",
  creator: "/quests/content-creator.svg",
  events: "/quests/community-space.svg",
  security: "/quests/contract-security-audit.svg",
  partner: "/quests/campus-ambassador.svg",
};

export const DEFAULT_QUEST_COVER = "/quests/default.svg";

/** Cover used when a quest has no image_url (or the image fails to load). Never an icon/emoji. */
export function coverForCategory(category?: string): string {
  return COVER_BY_CATEGORY[(category ?? "").toLowerCase()] ?? DEFAULT_QUEST_COVER;
}

export function badgeClassForCategory(category: string): string {
  switch (category.toLowerCase()) {
    case "community":
    case "creator":
      return "badge-green";
    case "developer":
      return "xp-tag-blue text-[11px]";
    case "learning":
    case "events":
      return "badge-amber";
    case "hackathon":
      return "badge-purple";
    default:
      return "badge-blue";
  }
}

function timeLeft(deadline?: string | null): string | undefined {
  if (!deadline) return undefined;
  const ms = new Date(deadline).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return undefined;
  const d = Math.floor(ms / 86_400_000);
  if (d >= 1) return `${d}d left`;
  return `${Math.max(1, Math.floor(ms / 3_600_000))}h left`;
}

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Backend Task -> card data. Uses task.image_url, falling back to a category cover. */
export function taskToCard(t: Task): QuestCardData {
  const category = titleCase(t.category || "general");
  const state = t.my_state;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category,
    xp: t.points,
    image: t.image_url || coverForCategory(t.category),
    timer: timeLeft(t.deadline),
    status: state === "verified" ? "complete" : state && state !== "not_started" ? state : undefined,
    cta: state === "verified" ? "View Credentials" : state === "submitted" || state === "under_review" ? "Under Review" : "Start Quest",
    ctaVariant: state === "verified" || state === "under_review" || state === "submitted" ? "outline" : "green",
  };
}

/** Shown only when the API returns no published tasks (fresh DB / offline dev). */
export const FALLBACK_QUESTS: QuestCardData[] = [
  { id: "m1", title: "Welcome to BCL", category: "Community", difficulty: "Easy Meter", xp: 300, reward: "Genesis Member Badge", participants: "1,420 joined", description: "Join the official Discord, link your student ENS identity, and claim your genesis badge.", status: "complete", image: "/quests/welcome-to-bcl.svg", cta: "View Credentials", ctaVariant: "outline" },
  { id: "m2", title: "Build Your First DApp", category: "Developer", difficulty: "Lvl 2 Track", xp: 750, reward: "Web3 Builder NFT", participants: "380 Participants", timer: "6d left", description: "Deploy a verified token contract on Sepolia testnet and hook it up to a live React/Vite frontend.", image: "/quests/build-your-first-dapp.svg", cta: "Start Quest", ctaVariant: "green" },
  { id: "m3", title: "Blockchain 101 Quiz", category: "Learning", difficulty: "Self-Paced", xp: 150, reward: "Quiz Scholar Badge", participants: "890 Participants", timer: "15 Mins", description: "Answer 10 multiple-choice questions regarding consensus mechanisms, hashing and the EVM.", image: "/quests/blockchain-101-quiz.svg", cta: "Take Quiz", ctaVariant: "outline" },
  { id: "m4", title: "Confluence Hackathon 2025", category: "Hackathon", difficulty: "Major Guild Event", xp: 1000, reward: "Contender + Pool", participants: "240 Contenders", timer: "12d left", description: "Team up and architect an on-chain identity or DeFi module. Includes live mentorship.", image: "/quests/confluence-hackathon.svg", cta: "Register Team", ctaVariant: "green", featured: true },
  { id: "m5", title: "BCL Content Creator", category: "Creator", xp: 500, reward: "Amplification Master", participants: "195 Participants", description: "Author an X thread or Medium breakdown detailing modular rollups and tag @BCL_Community.", image: "/quests/content-creator.svg", cta: "Submit Thread Link", ctaVariant: "outline" },
  { id: "m6", title: "Attend BCL Community Space", category: "Events", xp: 100, reward: "Attendance POAP", participants: "610 RSVP'd", timer: "Tonight 7 PM", description: "Tune into the weekly ecosystem sync on X Spaces for 45+ minutes to receive an attendance POAP.", image: "/quests/community-space.svg", cta: "Set Reminder", ctaVariant: "outline" },
  { id: "m7", title: "Contract Security Audit", category: "Developer", xp: 1200, reward: "Guardian Sentinel", participants: "85 Auditing", description: "Identify reentrancy vulnerabilities and gas inefficiencies inside the mock treasury.", image: "/quests/contract-security-audit.svg", cta: "Fork Repository", ctaVariant: "outline" },
  { id: "m8", title: "Campus Ambassador Outreach", category: "Community", xp: 600, reward: "Community Anchor", participants: "110 Ambassadors", description: "Host a 30-minute introductory peer workshop inside your faculty lecture hall.", image: "/quests/campus-ambassador.svg", cta: "Apply as Host", ctaVariant: "outline" },
];
