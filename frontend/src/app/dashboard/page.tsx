"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap, Flame, ArrowRight, Shield, CheckCircle2, Clock,
  Trophy, Calendar, Loader2, Terminal, Lock, Gift,
  Star, Award, TrendingUp, ChevronRight, Code, Megaphone,
  Globe
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  TaskSubmission,
  PointsLedgerItem,
  DomainRecord,
  LeaderboardEntry,
  DailyQuiz,
} from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";
import toast from "react-hot-toast";

function levelTitle(level: number): string {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Pioneer Elite";
  if (level >= 10) return "Pioneer Guildsman";
  if (level >= 5) return "Explorer";
  return "Newcomer";
}

interface WeekDayItem {
  initial: string;
  label: string;
  dayNum: number;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isActive: boolean;
}

const DEFAULT_QUIZ: DailyQuiz = {
  id: 0,
  quiz_date: "",
  title: "Smart Contract Reentrancy Basics: Detection & Prevention",
  topic: "Smart Contract Security",
  description: "Test your understanding of Checks-Effects-Interactions pattern, mutex guards, and fallback vulnerability surfaces.",
  question: "Which design pattern or guard is considered the canonical standard in Solidity to safely prevent recursive external reentrancy exploits?",
  options: [
    { id: 0, text: "Checks-Effects-Interactions (CEI) pattern + OpenZeppelin ReentrancyGuard" },
    { id: 1, text: "Using tx.origin == msg.sender verification" },
    { id: 2, text: "Transferring ETH before deducting user internal balance" },
    { id: 3, text: "Using call() with unlimited gas forwarded to arbitrary addresses" },
  ],
  points: 50,
  is_active: true,
  explanation: "Checks-Effects-Interactions (CEI) pattern ensures internal state variables are updated before invoking external untrusted contracts, eliminating recursive reentrancy.",
};

export default function DashboardPage() {
  const { user, stats, walletAddress, connectWallet, isLoading, awardClaimedXp, refreshUserData } = useAuth();
  const [greeting, setGreeting] = useState("Welcome");
  const [recentSubmissions, setRecentSubmissions] = useState<TaskSubmission[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsLedgerItem[]>([]);
  const [myDomains, setMyDomains] = useState<DomainRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [claimedDaily, setClaimedDaily] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [currentQuiz, setCurrentQuiz] = useState<DailyQuiz>(DEFAULT_QUIZ);
  const [realTimeWeekDays, setRealTimeWeekDays] = useState<WeekDayItem[]>([]);

  const activeAddr = (walletAddress || user?.wallet_address)?.toLowerCase();

  // Fetch admin-configured daily quiz from backend
  useEffect(() => {
    api.getDailyQuiz()
      .then((q) => {
        if (q && q.title) {
          setCurrentQuiz(q);
        }
      })
      .catch((err) => {
        console.error("Could not fetch admin daily quiz:", err);
      });
  }, []);

  // Compute real-time week days client-side to prevent SSR prerender date divergence
  useEffect(() => {
    const now = new Date();
    const currentDayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const distToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - distToMonday));
    const todayStr = now.toISOString().slice(0, 10);

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayInitials = ["M", "T", "W", "T", "F", "S", "S"];

    const days: WeekDayItem[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;
      const hasPoints = (stats?.active_dates?.includes(dateStr) ?? false) || (isToday && (claimedDaily || quizCompleted));

      return {
        initial: dayInitials[i],
        label: dayLabels[i],
        dayNum: d.getUTCDate(),
        dateStr,
        isToday,
        isPast,
        isFuture,
        isActive: hasPoints,
      };
    });

    setRealTimeWeekDays(days);
  }, [stats?.active_dates, claimedDaily, quizCompleted]);

  // Live ticking countdown to next daily reset at 00:00:00 UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diffMs = nextUtcMidnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        refreshUserData();
        setClaimedDaily(false);
        setQuizCompleted(false);
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilReset(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [refreshUserData]);

  // Sync claim statuses from stats
  useEffect(() => {
    if (stats?.daily_claimed !== undefined) {
      setClaimedDaily(stats.daily_claimed);
    }
    if (stats?.quiz_claimed !== undefined) {
      setQuizCompleted(stats.quiz_claimed);
    }
  }, [stats?.daily_claimed, stats?.quiz_claimed]);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    api.getLeaderboard(100).then(l => setLeaderboard(l || [])).catch(() => {});

    if (!activeAddr) return;
    const todayStr = new Date().toISOString().slice(0, 10);

    api.getMyPoints().then(p => {
      setRecentPoints(p.slice(0, 5));
      const hasDaily = p.some(item => item.reason?.includes("Daily streak") && item.created_at?.startsWith(todayStr));
      if (hasDaily) setClaimedDaily(true);
      const hasQuiz = p.some(item => item.reason?.includes("Micro-Quiz") && item.created_at?.startsWith(todayStr));
      if (hasQuiz) setQuizCompleted(true);
    }).catch(() => {
      api.getUserPoints(activeAddr).then(p => {
        setRecentPoints(p.slice(0, 5));
        const hasDaily = p.some(item => item.reason?.includes("Daily streak") && item.created_at?.startsWith(todayStr));
        if (hasDaily) setClaimedDaily(true);
        const hasQuiz = p.some(item => item.reason?.includes("Micro-Quiz") && item.created_at?.startsWith(todayStr));
        if (hasQuiz) setQuizCompleted(true);
      }).catch(() => {});
    });

    api.getMySubmissions().then(s => setRecentSubmissions(s.slice(0, 3))).catch(() => {});
    api.getMyNames().then(d => setMyDomains(d || [])).catch(() => {});
  }, [activeAddr]);

  const handleClaimDaily = async () => {
    try {
      await api.claimDaily();
      setClaimedDaily(true);
      await refreshUserData();
      const points = await api.getMyPoints().catch(() => []);
      setRecentPoints(points.slice(0, 5));
      toast.success("Daily streak recorded! +20 XP added 🔥");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Claim failed";
      if (msg.includes("already") || (err as { status?: number }).status === 409) {
        setClaimedDaily(true);
        toast("Daily streak already claimed today!", { icon: "ℹ️" });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleCompleteQuiz = async () => {
    if (quizAnswer === null || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const res = await api.claimDailyQuiz(quizAnswer, currentQuiz.id > 0 ? currentQuiz.id : undefined);
      setQuizCompleted(true);
      await refreshUserData();
      const points = await api.getMyPoints().catch(() => []);
      setRecentPoints(points.slice(0, 5));
      toast.success(
        `Correct! +${res.points_delta || currentQuiz.points} XP bonus earned 🎉${currentQuiz.explanation ? `\n${currentQuiz.explanation}` : ""}`,
        { duration: 5000 }
      );
      setTimeout(() => setShowQuizModal(false), 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Quiz claim failed";
      if (msg.includes("already") || (err as { status?: number }).status === 409) {
        setQuizCompleted(true);
        toast("Quiz already completed today!", { icon: "ℹ️" });
        setShowQuizModal(false);
      } else if (msg.includes("Incorrect") || (err as { status?: number }).status === 400) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-fg" />
      </div>
    );
  }

  // Not connected — prompt user to connect wallet
  if (!walletAddress) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ink/5 flex items-center justify-center mb-2">
          <Lock className="w-8 h-8 text-ink-4" />
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-ink tracking-tight">Access Your Dashboard</h1>
        <p className="text-sm text-ink-4 max-w-sm">Sign in with your wallet to track your progress, verify quests, and unlock sovereign rewards.</p>
        <button onClick={connectWallet} className="btn-green px-8 py-3 text-sm font-bold mt-4 flex items-center gap-2">
          Connect Wallet <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const displayName = user?.username || `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const level = stats?.level ?? user?.level ?? 1;
  const totalPoints = stats?.total_points ?? user?.total_points ?? 0;
  const pointsToNext = stats?.points_to_next_level ?? 100;
  const nextThreshold = stats?.next_level_threshold ?? 100;
  const streakDays = stats?.streak_days ?? 0;
  const completedTasks = stats?.completed_tasks_count ?? 0;
  const activeNames = stats?.active_names_count ?? 0;

  const userRankIndex = leaderboard.findIndex(
    e => e.wallet_address.toLowerCase() === activeAddr
  );
  const myRank = userRankIndex >= 0 ? userRankIndex + 1 : (totalPoints > 0 ? (leaderboard.length > 0 ? leaderboard.length : 1) : null);
  const totalDevs = Math.max(leaderboard.length, totalPoints > 0 ? 1 : 0);

  const levelProgressPct = nextThreshold > 0 && pointsToNext > 0
    ? Math.min(100, Math.round(((nextThreshold - pointsToNext) / nextThreshold) * 100))
    : 0;

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">

      {/* 0. Prompt Banner for New Users */}
      {(!user || !user.username) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/15 via-purple-500/10 to-accent/5 border border-accent/25 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-fg font-mono text-[10px] font-bold uppercase">
                 New Builder Detected
              </div>
              <h3 className="text-base sm:text-lg font-heading font-bold text-ink">
                Complete Your Sovereign Profile
              </h3>
              <p className="text-xs sm:text-sm text-ink-3 max-w-xl">
                Claim your username, set your bio, and initialize your on-chain reputation to track tasks, badges, and rewards.
              </p>
            </div>
            <Link
              href="/profile"
              className="btn-green w-full sm:w-auto justify-center px-5 py-2.5 text-xs font-bold shrink-0 flex items-center gap-2 shadow-sm"
            >
              Create Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 1. Top Welcome & Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-ink/5 p-4 sm:p-6 md:p-10 shadow-sm">
        <div className="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-ink/5 text-accent-fg font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(0,245,160,0.8)] animate-pulse" />
                COHORT 04 ACTIVE
              </span>
              <span className="text-ink-4 text-[10px] font-bold">•</span>
              <span className="text-ink-4 text-[10px] font-bold tracking-wider">SEASON 2: ACCELERATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight break-words">
              {greeting}, {displayName} <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-ink-4 mt-1 leading-relaxed">
              You're on a <span className="text-amber-500 font-bold">{streakDays}-day streak!</span> Complete today's daily quest to reach{" "}
              <span className="text-accent-fg font-bold">Level {level + 1} {levelTitle(level + 1)}</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleClaimDaily}
              disabled={claimedDaily}
              className={`w-full sm:w-auto justify-center px-5 py-2.5 rounded-full transition-all text-xs sm:text-sm font-bold flex items-center gap-2 ${
                claimedDaily
                  ? "bg-accent/20 text-accent-fg cursor-default"
                  : "bg-amber-500 hover:bg-amber-400 text-white shadow-lg hover:shadow-amber-500/25"
              }`}
            >
              {claimedDaily ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Claimed (+20 XP)</span>
                  {timeUntilReset && (
                    <span className="text-[11px] font-mono opacity-80 ml-1">• Next in {timeUntilReset}</span>
                  )}
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>Claim Daily 20 XP</span>
                </>
              )}
            </button>
            <Link href="/domains" className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-full border border-ink/10 text-ink text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-ink/5 transition-colors">
              <Globe className="w-4 h-4 text-accent-fg shrink-0" /> .bcl Domains
            </Link>
            <Link href="/tasks" className="btn-green w-full sm:w-auto justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-accent/20">
              <Star className="w-4 h-4 shrink-0" /> Find Quests
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Tier Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Ecosystem Tier</span>
              <span className="text-xl sm:text-2xl font-heading font-bold text-ink mt-1.5 sm:mt-2">Level {level}</span>
              <span className="text-xs font-mono text-accent-fg font-semibold mt-0.5">{levelTitle(level)}</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink/5 flex items-center justify-center text-accent-fg group-hover:scale-110 transition-transform shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-5 sm:mt-6 flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-[11px] font-mono">
              <span className="text-ink font-bold">{totalPoints.toLocaleString()} XP</span>
              <span className="text-ink-4">{pointsToNext.toLocaleString()} XP to L{level + 1}</span>
            </div>
            <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-accent to-green-400 h-full rounded-full shadow-[0_0_8px_rgba(0,245,160,0.5)] transition-all duration-1000"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
            <span className="text-[10px] text-ink-4 text-right">{levelProgressPct}% Progress</span>
          </div>
        </div>

        {/* Cadence Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Cadence</span>
                {timeUntilReset && (
                  <span className="text-[9px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {timeUntilReset}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1.5 sm:mt-2">
                <span className="text-2xl sm:text-3xl font-heading font-bold text-ink leading-none">{streakDays}</span>
                <span className="text-xs sm:text-sm font-heading font-bold text-amber-500">Days Streak</span>
              </div>
              {streakDays >= 7 ? (
                <span className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3" /> 1.25x Multiplier Active
                </span>
              ) : (
                <span className="text-[10px] text-ink-4 mt-1.5 font-medium truncate">
                  {streakDays === 0 ? "Claim today to start streak" : `${7 - (streakDays % 7)}d until 1.25x`}
                </span>
              )}
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink/5 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-4 sm:mt-5 flex items-center justify-between gap-1">
            {realTimeWeekDays.map((d) => (
              <div key={d.dateStr} className="flex flex-col items-center gap-1 flex-1">
                <span className={`text-[9px] font-mono uppercase font-semibold ${
                  d.isToday ? "text-amber-500 font-bold" : "text-ink-4"
                }`}>
                  <span className="hidden xs:inline">{d.label.slice(0, 2)}</span>
                  <span className="xs:hidden">{d.initial}</span>
                </span>
                <div
                  title={`${d.label} (${d.dateStr})${d.isToday ? " • TODAY" : ""}${d.isActive ? " • Active" : ""}`}
                  className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all relative ${
                    d.isToday
                      ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-surface bg-amber-500/20 text-amber-500 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                      : d.isActive
                      ? "bg-accent/20 text-accent-fg border border-accent/40 font-extrabold"
                      : d.isPast
                      ? "bg-ink/5 text-ink-4 opacity-60"
                      : "bg-ink/[0.03] text-ink-4 border border-dashed border-ink/15"
                  }`}
                >
                  <span>{d.dayNum}</span>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  d.isToday ? "bg-amber-500 animate-pulse" :
                  d.isActive ? "bg-accent" : "bg-transparent"
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Verified Impact Card */}
        <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Verified Impact</span>
              <div className="flex items-baseline gap-2 mt-1.5 sm:mt-2">
                <span className="text-2xl sm:text-3xl font-heading font-bold text-ink leading-none">{completedTasks}</span>
                <span className="text-xs sm:text-sm font-heading font-bold text-ink-4">Quests</span>
              </div>
              <span className="text-[10px] text-accent-fg mt-1.5 font-bold">
                {completedTasks > 0 ? `${completedTasks} verified submissions` : "Active Contributor"}
              </span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink/5 flex items-center justify-center text-accent-fg group-hover:scale-110 transition-transform shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-5 sm:mt-6 flex items-center gap-3">
            <svg className="w-14 sm:w-16 h-7 sm:h-8 text-accent-fg opacity-80 shrink-0" fill="none" viewBox="0 0 64 32">
              <path d="M2 28L14 20L26 24L38 12L50 16L62 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-ink truncate">{user?.bcl_domain || (activeNames > 0 ? `${activeNames} domain` : "BCL Pioneer")}</span>
              <span className="text-[10px] text-ink-4 mt-0.5 truncate">{activeNames} registered domains</span>
            </div>
          </div>
        </div>

        {/* Global Standing Card */}
        <Link href="/leaderboard" className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:bg-ink/[0.02] transition-colors group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-4 uppercase tracking-wider font-bold">Global Standing</span>
              <div className="flex items-baseline gap-1 mt-1.5 sm:mt-2">
                <span className="text-2xl sm:text-3xl font-heading font-bold text-purple-500 leading-none">
                  {myRank ? `#${myRank}` : "—"}
                </span>
                <span className="text-xs sm:text-sm font-mono text-ink-4 font-semibold">Overall</span>
              </div>
              <span className="text-[10px] text-ink-4 mt-1.5 font-medium">
                {myRank ? `Rank #${myRank} of ${totalDevs} on Leaderboard` : `Among ${totalDevs} active citizens`}
              </span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink/5 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-5 sm:mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-ink">{totalPoints.toLocaleString()} XP</span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 font-bold uppercase tracking-wider">
              {myRank === 1 ? "Rank #1 Gold" : myRank && myRank <= 3 ? "Podium" : levelTitle(level)}
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Featured Daily Challenge Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ink/5 via-surface to-surface border border-ink/5 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="flex items-start gap-3.5 sm:gap-5 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Terminal className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                  Daily Micro-Quiz • {currentQuiz.topic}
                </span>
                <span className="text-[10px] text-ink-4 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-amber-500 shrink-0" /> 2 min quiz
                  {timeUntilReset && <span className="text-ink-4 ml-1 hidden xs:inline">• Resets in {timeUntilReset}</span>}
                </span>
                <span className="text-[10px] text-accent-fg font-bold bg-ink/5 border border-ink/5 px-2 py-0.5 rounded-full">
                  +{currentQuiz.points} XP BONUS
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-heading font-bold text-ink break-words">{currentQuiz.title}</h2>
              <p className="text-xs sm:text-sm text-ink-4 max-w-2xl leading-relaxed">
                {currentQuiz.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (quizCompleted) {
                toast("You've already completed today's quiz! Resets at 00:00 UTC", { icon: "✅" });
              } else {
                setQuizAnswer(null);
                setShowQuizModal(true);
              }
            }}
            className={`w-full lg:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 ${
              quizCompleted
                ? "bg-accent/20 text-accent-fg cursor-default"
                : "bg-amber-500 hover:bg-amber-400 text-white shadow-lg hover:shadow-amber-500/25"
            }`}
          >
            {quizCompleted ? (
              <><CheckCircle2 className="w-4 h-4 shrink-0" /> Quiz Completed (+50 XP)</>
            ) : (
              <>Start Challenge <ArrowRight className="w-4 h-4 shrink-0" /></>
            )}
          </button>
        </div>
      </div>

      {/* 4. Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* Left / Center Primary Action Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">

          {/* Recent Activity */}
          <section className="flex flex-col gap-3.5 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_6px_rgba(0,245,160,0.8)] shrink-0" />
                <h2 className="text-lg sm:text-xl font-heading font-bold text-ink tracking-tight">Recent Activity</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink/5 text-ink-4 font-bold">{recentSubmissions.length} Tasks</span>
              </div>
              <Link href="/tasks" className="text-xs font-mono font-bold text-accent-fg hover:underline flex items-center gap-1 shrink-0">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
              {recentSubmissions.length === 0 ? (
                <div className="rounded-xl bg-surface border border-ink/5 p-6 sm:p-10 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ink/5 flex items-center justify-center mb-1">
                    <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-ink-4" />
                  </div>
                  <h3 className="font-heading font-bold text-ink text-base sm:text-lg">No active quests found</h3>
                  <p className="text-xs sm:text-sm text-ink-4 max-w-sm">Dive into the ecosystem by completing your first onboarding or developer quest.</p>
                  <Link href="/tasks" className="btn-green w-full sm:w-auto px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold mt-2 justify-center flex items-center">Browse Quests</Link>
                </div>
              ) : (
                recentSubmissions.map(sub => (
                  <div key={sub.id} className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm hover:border-ink/10 transition-all flex flex-col gap-4 sm:gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          sub.status === "verified" ? "bg-accent/10 text-accent-fg" :
                          sub.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {sub.status === "verified" ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Code className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="px-2 py-0.5 rounded bg-ink/5 text-ink text-[10px] font-bold uppercase tracking-wider">Quest #{sub.task_id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                              sub.status === "verified" ? "bg-accent/10 text-accent-fg" :
                              sub.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {sub.status}
                            </span>
                            <span className="text-[10px] font-mono text-ink-4 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-heading font-bold text-ink mt-1.5 break-words">On-chain Quest Submission</h3>
                          <p className="text-xs sm:text-sm text-ink-4 mt-0.5 break-words">
                            {sub.tx_hash
                              ? `Transaction Hash: ${sub.tx_hash.slice(0, 10)}...${sub.tx_hash.slice(-8)}`
                              : "Task submitted and awaiting manual or oracle verification."}
                          </p>
                        </div>
                      </div>
                      {sub.tx_hash && (
                        <a href={getExplorerUrl(sub.tx_hash)} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto justify-center px-4 py-2 rounded-full bg-ink/5 text-ink text-xs sm:text-sm font-bold hover:bg-ink/10 transition-colors flex items-center gap-2 shrink-0">
                          View Explorer <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="bg-ink/[0.02] rounded-lg p-3 sm:p-4 flex flex-col gap-2 border border-ink/5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                        <span className="text-ink-4">Verification Pipeline</span>
                        <span className={
                          sub.status === "verified" ? "text-accent-fg" :
                          sub.status === "rejected" ? "text-red-500" : "text-amber-500"
                        }>{sub.status === "verified" ? "100%" : "50%"}</span>
                      </div>
                      <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${
                          sub.status === "verified" ? "bg-accent w-full" :
                          sub.status === "rejected" ? "bg-red-500 w-full" : "bg-amber-500 w-1/2"
                        }`} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recommended */}
          <section className="flex flex-col gap-3.5 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-heading font-bold text-ink tracking-tight">Recommended For You</h2>
                <span className="text-xs text-ink-4">Tailored to your Developer & Community guild pathways</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm hover:border-ink/10 transition-all flex flex-col justify-between group">
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-accent/10 text-accent-fg text-[10px] font-bold uppercase tracking-wider">Dev Track</span>
                    <span className="text-[10px] font-mono text-accent-fg font-bold">+750 XP</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-ink group-hover:text-accent-fg transition-colors leading-tight">Build Your First DApp: Decentralized Voting</h3>
                  <p className="text-xs sm:text-sm text-ink-4 leading-relaxed">Construct an end-to-end voting contract on Base Sepolia using Solidity and Next.js with Wagmi hooks.</p>
                </div>
                <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 flex items-center justify-between border-t border-ink/5">
                  <span className="text-[10px] font-mono text-ink-4 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Intermediate
                  </span>
                  <Link href="/tasks" className="text-xs font-bold text-accent-fg hover:underline flex items-center gap-1">
                    Start Quest <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm hover:border-ink/10 transition-all flex flex-col justify-between group">
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-ink/10 text-ink text-[10px] font-bold uppercase tracking-wider">Community</span>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">+100 XP</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-ink group-hover:text-amber-500 transition-colors leading-tight">Attend Friday Tech Space: Web3 Careers</h3>
                  <p className="text-xs sm:text-sm text-ink-4 leading-relaxed">Join our live audio session on X Spaces with founders from leading Ethereum and Layer-2 development teams.</p>
                </div>
                <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 flex items-center justify-between border-t border-ink/5">
                  <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1 font-semibold">
                    <Megaphone className="w-3.5 h-3.5" /> Today, 7:00 PM
                  </span>
                  <button className="text-xs font-bold text-ink hover:underline">Set Reminder</button>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Feed */}
          <section className="flex flex-col gap-3.5 sm:gap-4">
            <div className="flex items-center justify-between mt-1 sm:mt-2">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-ink tracking-tight">Recent Activity Feed</h2>
              <span className="text-[10px] font-mono text-ink-4 uppercase tracking-wider font-bold hidden sm:block">On-chain receipts & verifications</span>
            </div>
            <div className="rounded-xl bg-surface border border-ink/5 p-3.5 sm:p-5 shadow-sm flex flex-col gap-2">
              {recentPoints.length === 0 ? (
                <div className="py-6 text-center text-xs sm:text-sm text-ink-4">No recent point activities found. Complete a quest to start earning!</div>
              ) : (
                recentPoints.map(p => (
                  <div key={p.id} className="p-3 sm:p-3.5 rounded-lg bg-ink/[0.02] border border-ink/5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-ink/5 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                        p.points_delta >= 0 ? "bg-accent/10 text-accent-fg" : "bg-red-500/10 text-red-500"
                      }`}>
                        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-heading font-bold text-ink truncate">{p.reason}</span>
                        <span className="text-[10px] font-mono text-ink-4 mt-0.5">{new Date(p.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 sm:px-2.5 py-1 rounded shrink-0 ${
                      p.points_delta >= 0 ? "bg-accent/10 text-accent-fg" : "bg-red-500/10 text-red-500"
                    }`}>
                      {p.points_delta >= 0 ? "+" : ""}{p.points_delta} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Telemetry Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">

          {/* Reward Vault */}
          <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-base sm:text-lg font-heading font-bold text-ink">Reward Vault</h3>
              </div>
              <span className="text-[10px] font-mono text-ink-4 uppercase font-bold tracking-wider">Live Balance</span>
            </div>

            <div className="bg-ink/[0.03] border border-ink/5 p-4 sm:p-5 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-mono text-ink-4 font-bold uppercase tracking-wider">Spendable Experience Points</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl sm:text-4xl font-heading font-bold text-accent-fg">{totalPoints.toLocaleString()}</span>
                <span className="text-xs font-mono font-bold text-ink-4">BCL-XP</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink/5 text-[10px] font-mono font-bold text-amber-500">
                <Lock className="w-3.5 h-3.5 shrink-0" /> 3 Rewards Available for Unlock
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-ink/5 hover:bg-ink/5 transition-colors gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-ink/10 flex items-center justify-center text-ink shrink-0"><Star className="w-4 h-4" /></div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-heading font-bold text-ink truncate">Exclusive BCL Hoodie</span>
                    <span className="text-[10px] font-mono text-ink-4 mt-0.5">2,500 XP required</span>
                  </div>
                </div>
                <Link href="/market" className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-ink text-surface text-[10px] font-bold hover:bg-ink-3 transition-colors shrink-0">
                  Redeem
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-ink/5 hover:bg-ink/5 transition-colors opacity-70 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-ink/10 flex items-center justify-center text-ink shrink-0"><Terminal className="w-4 h-4" /></div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-heading font-bold text-ink truncate">1-on-1 Mentorship</span>
                    <span className="text-[10px] font-mono text-ink-4 mt-0.5">3,000 XP (Locked)</span>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-ink-4 shrink-0" />
              </div>
            </div>

            <Link href="/reward" className="w-full py-2.5 rounded-full border border-ink/10 text-ink hover:bg-ink/5 text-center text-xs sm:text-sm font-bold transition-all mt-1">
              Explore Reward Store
            </Link>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-fg shrink-0" />
                <h3 className="text-base sm:text-lg font-heading font-bold text-ink">Upcoming Events</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_6px_#00e293]" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-3.5 sm:p-4 flex flex-col gap-2 hover:bg-ink/5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent-fg font-bold uppercase">Sept 18 • 18:00 WAT</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500">+150 XP</span>
                </div>
                <span className="text-xs sm:text-sm font-heading font-bold text-ink mt-0.5">Foundry Masterclass: Gas Optimization</span>
                <span className="text-xs text-ink-4">Live code-along with Senior EVM Auditor</span>
                <div className="flex items-center justify-between mt-1.5 pt-2.5 border-t border-ink/5">
                  <span className="text-[10px] font-mono text-ink-4 font-bold">98 Devs Registered</span>
                  <button className="text-[10px] text-accent-fg hover:underline font-bold flex items-center">RSVP Now <ArrowRight className="w-3 h-3 ml-1" /></button>
                </div>
              </div>

              <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-3.5 sm:p-4 flex flex-col gap-2 hover:bg-ink/5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold uppercase">Oct 02 • 14:00 WAT</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500">+300 XP</span>
                </div>
                <span className="text-xs sm:text-sm font-heading font-bold text-ink mt-0.5">Confluence Hackathon Showcase</span>
                <span className="text-xs text-ink-4">Campus Auditorium & Live Streaming</span>
                <div className="flex items-center justify-between mt-1.5 pt-2.5 border-t border-ink/5">
                  <span className="text-[10px] font-mono text-ink-4 font-bold">Hybrid Event</span>
                  <button className="text-[10px] text-accent-fg hover:underline font-bold flex items-center">RSVP Now <ArrowRight className="w-3 h-3 ml-1" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Sovereign Domains (.bcl) */}
          <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent-fg shrink-0" />
                <h3 className="text-base sm:text-lg font-heading font-bold text-ink">Sovereign Domains</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent-fg font-bold uppercase">
                {myDomains.length} Active
              </span>
            </div>

            {myDomains.length === 0 ? (
              <div className="rounded-xl bg-ink/[0.02] border border-dashed border-ink/10 p-4 text-center flex flex-col items-center gap-2">
                <p className="text-xs text-ink-4">You have not registered a .bcl domain yet.</p>
                <Link
                  href="/domains"
                  className="btn-green w-full sm:w-auto justify-center px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm"
                >
                  Claim Your .bcl Name <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {myDomains.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-ink/[0.02] border border-ink/5 hover:bg-ink/5 transition-colors gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-fg font-mono text-xs font-bold shrink-0">
                        .bcl
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-heading font-bold text-ink truncate">{d.normalized_name}</span>
                        <span className="text-[10px] font-mono text-ink-4 truncate">Expires: {new Date(d.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-mono text-[10px] font-bold uppercase shrink-0">Active</span>
                  </div>
                ))}
                <Link
                  href="/domains"
                  className="w-full py-2 rounded-lg border border-ink/10 text-ink hover:bg-ink/5 text-center text-xs font-bold transition-all mt-1 flex items-center justify-center gap-1.5"
                >
                  Manage All Domains <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Guild Affiliation */}
          <div className="rounded-xl bg-surface border border-ink/5 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-4 font-mono font-bold uppercase tracking-wider">Guild Membership</span>
              <span className="px-2.5 py-0.5 rounded bg-accent/10 text-accent-fg text-[10px] font-bold uppercase tracking-wider">Active</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-ink/5 border border-ink/5 flex items-center justify-center text-accent-fg shrink-0">
                <Terminal className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-base font-heading font-bold text-ink leading-tight truncate">Fullstack Web3 Guild</span>
                <span className="text-xs font-mono font-bold text-ink-4 mt-1">Rank: Senior Contributor</span>
              </div>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed border-t border-ink/5 pt-3 sm:pt-4 mt-0.5">
              Your guild holds Rank #2 in the inter-cohort sprint. Next sync occurs Wednesday.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Web3 Micro-Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-ink/10 p-4 sm:p-6 md:p-8 shadow-2xl space-y-5 sm:space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[10px] font-bold uppercase">
                    Daily Challenge • +{currentQuiz.points} XP
                  </span>
                  {timeUntilReset && (
                    <span className="text-[10px] font-mono text-ink-4 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-500" /> Resets in {timeUntilReset}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-ink break-words">
                  {currentQuiz.title}
                </h3>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink-4 hover:text-ink transition-colors font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-ink-3 leading-relaxed">
              {currentQuiz.question}
            </p>

            <div className="space-y-2 sm:space-y-2.5">
              {currentQuiz.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setQuizAnswer(opt.id)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                    quizAnswer === opt.id
                      ? "border-accent bg-accent/10 text-ink font-bold shadow-sm"
                      : "border-ink/10 hover:border-ink/20 hover:bg-ink/[0.02] text-ink-3"
                  }`}
                >
                  <span className="font-mono text-xs text-ink-4 mr-2">{String.fromCharCode(65 + opt.id)}.</span>
                  {opt.text}
                </button>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-ink/5">
              <button
                onClick={() => setShowQuizModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold text-ink-4 hover:text-ink transition-colors text-center justify-center flex items-center"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteQuiz}
                disabled={quizAnswer === null || isSubmittingQuiz}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  quizAnswer !== null
                    ? "bg-brand hover:bg-brand-hi text-white shadow-brand/20 cursor-pointer"
                    : "bg-ink/10 text-ink-4 cursor-not-allowed opacity-60"
                }`}
              >
                {isSubmittingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Answer (+{currentQuiz.points} XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}