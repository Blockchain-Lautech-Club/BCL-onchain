"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api, Task, CommunityEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Users, Zap, Clock, ArrowRight,
  Loader2, Bell, Radio, ExternalLink, CheckCircle2, Shield,
} from "lucide-react";

// Fallback events if server has not responded yet
const FALLBACK_EVENTS: CommunityEvent[] = [
  {
    id: 1,
    title: "BCL Friday Tech Space: Navigating Web3 Careers",
    description: "Join our weekly live audio space on X with leading builders, founders, and devs across Ethereum, Base, and L2 ecosystems.",
    event_type: "X Space",
    mode: "Online · X Spaces",
    location_url: "https://x.com/i/spaces",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    xp_reward: 100,
    registered_count: 610,
    is_live: true,
    status: "live",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Foundry Masterclass: Gas Optimization",
    description: "Live code-along with Senior EVM Auditor. Deep dive into storage packing, batching patterns, and Yul assembly for gas efficiency.",
    event_type: "Workshop",
    mode: "Online · Discord Stage",
    location_url: "https://discord.gg/blockchain-lautech",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    xp_reward: 150,
    registered_count: 56,
    is_live: false,
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Confluence Hackathon Showcase & Demo Day",
    description: "Final project demos from all competing teams at the BCL Confluence Hackathon. Campus Auditorium + live global streaming.",
    event_type: "Hackathon",
    mode: "Hybrid · Auditorium & Stream",
    location_url: "https://youtube.com",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    xp_reward: 300,
    registered_count: 240,
    is_live: false,
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: "Product Design & UX Sprint for Web3 Apps",
    description: "Interactive session on wallet connection flows, transaction signing heuristics, and onboarding UX for non-technical users.",
    event_type: "Workshop",
    mode: "Online · Google Meet",
    location_url: "https://meet.google.com",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    xp_reward: 120,
    registered_count: 85,
    is_live: false,
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const PAST_EVENTS = [
  { title: "Blockchain Basics Bootcamp", date: "Aug 12", attendees: 214, xp: 150, poap: true },
  { title: "BCL x Base: ERC-4337 Sprint", date: "Jul 28", attendees: 98, xp: 300, poap: true },
  { title: "Smart Contract Security AMA", date: "Jul 14", attendees: 320, xp: 100, poap: false },
  { title: "Web3 Product Design Jam", date: "Jun 30", attendees: 145, xp: 200, poap: true },
];

const FILTERS = ["All", "Workshop", "Hackathon", "X Space", "Seminar", "Onboarding", "Meetup"];

function getEventTypeBadge(type: string): string {
  switch (type?.toLowerCase()) {
    case "workshop":
      return "badge-blue";
    case "hackathon":
      return "badge-amber";
    case "x space":
      return "badge-purple";
    case "onboarding":
      return "badge-green";
    case "seminar":
      return "badge-blue";
    default:
      return "badge-purple";
  }
}

function parseEventDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { month: "TBA", day: "--", time: "", display: dateStr };
    }
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate().toString();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return { month, day, time, display: `${month} ${day} · ${time}` };
  } catch {
    return { month: "TBA", day: "--", time: "", display: dateStr };
  }
}

export default function EventsPage() {
  const { walletAddress, isAdmin } = useAuth();
  const [events, setEvents] = useState<CommunityEvent[]>(FALLBACK_EVENTS);
  const [eventTasks, setEventTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpingId, setRsvpingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [fetchedEvents, fetchedTasks] = await Promise.allSettled([
          api.getEvents(walletAddress || undefined),
          api.getTasks(),
        ]);

        if (isMounted && fetchedEvents.status === "fulfilled" && fetchedEvents.value && fetchedEvents.value.length > 0) {
          setEvents(fetchedEvents.value);
        }

        if (isMounted && fetchedTasks.status === "fulfilled" && fetchedTasks.value) {
          setEventTasks(
            fetchedTasks.value.filter(
              (t) => t.category?.toLowerCase() === "events" || t.category?.toLowerCase() === "event"
            )
          );
        }
      } catch (err) {
        console.error("Failed to load events page data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  const handleRsvp = async (ev: CommunityEvent) => {
    if (!walletAddress) {
      toast.error("Connect your wallet to RSVP");
      return;
    }

    try {
      setRsvpingId(ev.id);
      const res = await api.rsvpEvent(ev.id);
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id
            ? {
                ...item,
                is_rsvpd: true,
                registered_count: res.registered_count || item.registered_count + (res.already_registered ? 0 : 1),
              }
            : item
        )
      );

      if (res.already_registered) {
        toast("You are already registered for this event!");
      } else {
        toast.success(`RSVP confirmed for "${ev.title}"! Notification set.`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to RSVP");
    } finally {
      setRsvpingId(null);
    }
  };

  const liveEvents = events.filter((e) => e.is_live && e.status !== "cancelled");
  const upcomingFiltered = events.filter((e) => {
    if (e.is_live || e.status === "cancelled" || e.status === "concluded") return false;
    if (activeFilter === "All") return true;
    return e.event_type?.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8 overflow-x-hidden">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-subtle to-page border border-accent/15 px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="absolute top-0 right-0 w-80 h-40 bg-accent/[0.07] blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-5 mb-2">
              <Calendar className="w-3 h-3" />
              <span>BCL COMMUNITY CALENDAR</span>
              <span>·</span>
              <span className="text-accent-fg">COHORT 04 ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink mb-1">
              Events &amp; Community Sessions
            </h1>
            <p className="text-sm text-ink-4 max-w-xl">
              Workshops, X Spaces, hackathons, and campus buildathons. Attend, earn XP, and collect
              attendance POAPs verified on-chain.
            </p>

            {isAdmin && (
              <div className="mt-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent-fg text-xs font-bold border border-accent/25 transition shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin: Set / Host Community Events &amp; Spaces &rarr;</span>
                </Link>
              </div>
            )}
          </div>
          <div className="stat-card shrink-0 w-full sm:w-auto min-w-0 sm:min-w-[140px]">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">XP This Month</div>
            <div className="text-2xl font-extrabold font-heading text-accent-fg num-mono">+1,300</div>
            <div className="text-[10px] text-ink-5 mt-0.5">From attending events</div>
          </div>
        </div>
      </div>

      {/* ── Live Now banner ─────────────────────────────────────── */}
      {liveEvents.map((ev) => {
        const dateInfo = parseEventDate(ev.event_date);
        return (
          <div
            key={ev.id}
            className="rounded-2xl bg-gradient-to-r from-red-950/40 to-surface border border-red-500/25 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 relative">
                <Radio className="w-5 h-5 text-red-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">● LIVE NOW</span>
                  <span className="text-[10px] text-ink-5">· {dateInfo.display}</span>
                  <span className="xp-tag text-[10px]">+{ev.xp_reward} XP</span>
                </div>
                <div className="font-heading font-bold text-sm text-ink">{ev.title}</div>
                <div className="text-xs text-ink-4 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {ev.mode}
                </div>
              </div>
            </div>
            {ev.location_url ? (
              <a
                href={ev.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Join Session Now
              </a>
            ) : (
              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                In Progress
              </span>
            )}
          </div>
        );
      })}

      {/* ── Upcoming Events ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-heading font-bold text-xl text-ink">Upcoming Events</h2>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeFilter === f
                    ? "bg-accent/15 text-accent-fg border border-accent/25"
                    : "text-ink-5 hover:text-ink border border-transparent hover:border-border-subtle"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="surface-card rounded-xl p-8 text-center text-xs text-ink-4 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent-fg" />
            <span>Loading community events...</span>
          </div>
        ) : upcomingFiltered.length === 0 ? (
          <div className="surface-card rounded-xl p-8 text-center text-xs text-ink-4">
            No upcoming events found for &quot;{activeFilter}&quot;. Check back soon or tune into our weekly spaces!
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingFiltered.map((ev) => {
              const isRsvpd = ev.is_rsvpd;
              const dateInfo = parseEventDate(ev.event_date);
              const badgeClass = getEventTypeBadge(ev.event_type);

              return (
                <div key={ev.id} className="surface-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date column */}
                  <div className="w-16 shrink-0 text-center hidden sm:block">
                    <div className="text-[10px] text-ink-5 uppercase font-bold">
                      {dateInfo.month}
                    </div>
                    <div className="text-2xl font-extrabold font-heading text-ink num-mono leading-none">
                      {dateInfo.day}
                    </div>
                    <div className="text-[10px] text-ink-5">{dateInfo.time}</div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-14 bg-border-subtle shrink-0" />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={badgeClass}>{ev.event_type}</span>
                      <span className="text-[10px] text-ink-5 sm:hidden">{dateInfo.display}</span>
                      <span className="xp-tag flex items-center gap-1 text-[10px]">
                        <Zap className="w-2.5 h-2.5" />+{ev.xp_reward} XP
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-ink mb-1">{ev.title}</h3>
                    <p className="text-xs text-ink-4 leading-relaxed line-clamp-2">{ev.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-ink-5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.mode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ev.registered_count || 0} RSVP&apos;d
                      </span>
                      {ev.location_url && (
                        <a
                          href={ev.location_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-accent-fg hover:underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Space / Venue Link
                        </a>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0">
                    {isRsvpd ? (
                      <button
                        disabled
                        className="btn-outline flex items-center gap-1.5 px-4 py-2 text-xs font-bold opacity-90 cursor-default"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" /> RSVP&apos;d
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRsvp(ev)}
                        disabled={rsvpingId === ev.id}
                        className="btn-green flex items-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {rsvpingId === ev.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                        <span>RSVP Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Event quests from backend ─────────────────────────────── */}
      {!loading && eventTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading font-bold text-xl text-ink flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-fg" />
            Event Quests
            <span className="badge-green">{eventTasks.length} Active</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {eventTasks.map((task) => (
              <div key={task.id} className="surface-card rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="badge-purple capitalize">{task.category}</span>
                  {task.deadline && (
                    <span className="text-[10px] text-ink-5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-bold text-sm text-ink">{task.title}</h3>
                <p className="text-xs text-ink-4 leading-relaxed line-clamp-2">{task.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle mt-auto">
                  <span className="xp-tag flex items-center gap-1 text-[10px]">
                    <Zap className="w-2.5 h-2.5" />+{task.points} XP
                  </span>
                  <Link href="/tasks" className="btn-green px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                    Start Quest <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Past Events ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-ink">Past Events</h2>
        <div className="surface-card rounded-xl divide-y divide-border-subtle">
          {PAST_EVENTS.map((ev, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-ink/[0.04] border border-border-subtle flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-ink-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink">{ev.title}</div>
                  <div className="text-[10px] text-ink-5 flex items-center gap-2 mt-0.5">
                    <span>{ev.date}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{ev.attendees} attended</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="xp-tag text-[10px]">+{ev.xp} XP</span>
                {ev.poap && <span className="badge-purple text-[10px]">POAP Issued</span>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-5 text-center">
          Missed an event? Some past events award XP for watching the recording. Check the{" "}
          <Link href="/tasks" className="text-accent-fg hover:underline">Quests page</Link>.
        </p>
      </section>

      {/* ── Sponsor CTA ──────────────────────────────────────────── */}
      <div className="surface-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-base text-ink mb-1">
            Have a Quest, Hackathon, or Bounty to Sponsor?
          </h3>
          <p className="text-xs text-ink-4">
            Deploy verified campaign criteria, grant bounties, and reward 4,000+ on-chain student builders, creators, and innovators across all Web3 domains.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-outline px-4 py-2 text-sm">Read Docs</button>
          <button className="btn-green px-4 py-2 text-sm flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Submit Event RFP
          </button>
        </div>
      </div>
    </div>
  );
}
