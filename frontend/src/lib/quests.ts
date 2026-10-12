import type { Task } from "@/lib/api";

/** Normalised shape rendered by <QuestCard/> on every page. */
export interface QuestCardData {
  id: string | number;
  title: string;
  description: string;
  category: string;
  xp: number;
  image: string;
  verification_type?: string;
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
  community:  "/quests/welcome-to-bcl.svg",
  developer:  "/quests/build-your-first-dapp.svg",
  learning:   "/quests/blockchain-101-quiz.svg",
  hackathon:  "/quests/confluence-hackathon.svg",
  creator:    "/quests/content-creator.svg",
  events:     "/quests/community-space.svg",
  security:   "/quests/contract-security-audit.svg",
  partner:    "/quests/campus-ambassador.svg",
};

export const DEFAULT_QUEST_COVER = "/quests/default.svg";

/** Cover used when a quest has no image_url (or the image fails to load). */
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

/** Backend Task → card data. */
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
    verification_type: t.verification_type,
    timer: timeLeft(t.deadline),
    status:
      state === "verified"
        ? "complete"
        : state && state !== "not_started"
        ? state
        : undefined,
    cta:
      state === "verified"
        ? "View Credentials"
        : state === "submitted" || state === "under_review"
        ? "Under Review"
        : "Start Quest",
    ctaVariant:
      state === "verified" || state === "under_review" || state === "submitted"
        ? "outline"
        : "green",
  };
}

/**
 * Shown only when the API is unreachable (dev/offline mode).
 * These are never shown when the backend returns data.
 */
export const FALLBACK_QUESTS: QuestCardData[] = [
  {
    id: "demo-1",
    title: "Welcome to BCL",
    category: "Community",
    difficulty: "Beginner",
    xp: 300,
    reward: "Genesis Member Badge",
    description: "Join the official Discord, link your student identity, and claim your genesis badge.",
    image: "/quests/welcome-to-bcl.svg",
    cta: "Start Quest",
    ctaVariant: "green",
  },
  {
    id: "demo-2",
    title: "Build Your First DApp",
    category: "Developer",
    difficulty: "Intermediate",
    xp: 750,
    reward: "Web3 Builder NFT",
    timer: "6d left",
    description: "Deploy a verified token contract on Celo Alfajores and hook it up to a React frontend.",
    image: "/quests/build-your-first-dapp.svg",
    cta: "Start Quest",
    ctaVariant: "green",
  },
  {
    id: "demo-3",
    title: "Blockchain 101 Quiz",
    category: "Learning",
    difficulty: "Beginner",
    xp: 150,
    reward: "Quiz Scholar Badge",
    description: "Answer 10 questions on consensus mechanisms, hashing and the EVM.",
    image: "/quests/blockchain-101-quiz.svg",
    cta: "Take Quiz",
    ctaVariant: "outline",
  },
  {
    id: "demo-4",
    title: "BCL Content Creator",
    category: "Creator",
    xp: 500,
    reward: "Amplification Badge",
    description: "Write a thread or article on Web3 and tag @BCL_Community.",
    image: "/quests/content-creator.svg",
    cta: "Submit Link",
    ctaVariant: "outline",
  },
];