"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api, Task } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Users, Zap, Clock, ArrowRight,
  Loader2, Bell, Radio, ExternalLink, CheckCircle2,
} from "lucide-react";

// ── Static upcoming events (no backend events model yet) ──────────────────
// These mirror the dashboard's Upcoming Events widget from the design.
const UPCOMING_EVENTS = [
  {
    id: "e1",
    date: "Sept 10 · 18:00 WAT",
    title: "Foundry Masterclass: Gas Optimization",
    description: "Live code-along with Senior EVM Auditor. Deep dive into storage packing, batching patterns, and Yul assembly for gas efficiency.",
    xp: 150,
    type: "Workshop",
    typeCls: "badge-blue",
    registered: 56,
    mode: "Online · X Spaces",
    cta: "RSVP Now",
    ctaCls: "btn-green",
    live: false,
  },
  {
    id: "e2",
    date: "Oct 02 · 14:00 WAT",
    title: "Confluence Hackathon Showcase",
    description: "Final project demos from all competing teams at the BCL Confluence Hackathon. Campus Auditorium + Live Streaming.",
    xp: 300,
    type: "Hackathon",
    typeCls: "badge-amber",
    registered: 240,
    mode: "Hybrid · Auditorium & Stream",
    cta: "RSVP Now",
    ctaCls: "btn-green",
    live: false,
  },
  {
    id: "e3",
    date: "Oct 10 · 19:00 WAT",
    title: "BCL Friday Tech Space: Navigating Web3 Careers",
    description: "Join our live audio session on X Spaces with founders from leading Ethereum and Layer-2 development teams.",
    xp: 100,
    type: "X Space",
    typeCls: "badge-purple",
    registered: 610,
    mode: "Online · X Spaces",
    cta: "Set Reminder",
    ctaCls: "btn-outline",
    live: true,
  },
  {
    id: "e4",
    date: "Oct 17 · 10:00 WAT",
    title: "ZK Workshop: Intro to Noir & Barretenberg",
    description: "Hands-on session building your first ZK circuit with Noir. Covers constraint systems, proof generation, and on-chain verification.",
    xp: 250,
    type: "Workshop",
    typeCls: "badge-blue",
    registered: 42,
    mode: "Online · Discord Stage",
    cta: "RSVP Now",
    ctaCls: "btn-green",
    live: false,
  },
  {
    id: "e5",
    date: "Oct 24 · 16:00 WAT",
    title: "Cohort 04 Onboarding & Identity Claim Sprint",
    description: "New members claim their .bcl handles, link student IDs, and get assigned to guild tracks. Mentors available onsite.",
    xp: 200,
    type: "Onboarding",
    typeCls: "badge-green",
    registered: 188,
    mode: "Hybrid · Campus Lab",
    cta: "Register",
    ctaCls: "btn-green",
    live: false,
  },
  {
    id: "e6",
    date: "Nov 05 · 18:00 WAT",
    title: "DeFi Deep Dive: AMM Invariants & Flash Loans",
    description: "Mathematical analysis of Uniswap v3, Curve, and Balancer invariant systems. Includes a live exploit demo on a fork.",
    xp: 200,
    type: "Seminar",
    typeCls: "badge-blue",
    registered: 73,
    mode: "Online · Discord Stage",
    cta: "RSVP Now",
    ctaCls: "btn-outline",
    live: false,
  },
];

const PAST_EVENTS = [
  { title: "Blockchain Basics Bootcamp", date: "Aug 12", attendees: 214, xp: 150, poap: true },
  { title: "BCL x Base: ERC-4337 Sprint", date: "Jul 28", attendees: 98, xp: 300, poap: true },
  { title: "Smart Contract Security AMA", date: "Jul 14", attendees: 320, xp: 100, poap: false },
  { title: "Web3 Product Design Jam", date: "Jun 30", attendees: 145, xp: 200, poap: true },
];

// ── Page ──────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { walletAddress } = useAuth();
  const [eventTasks, setEventTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    // Pull tasks tagged as Events from the backend
    api.getTasks().then((d) => {
      const all = d || [];
      setEventTasks(all.filter((t) =>
        t.category?.toLowerCase() === "events" || t.category?.toLowerCase() === "event"
      ));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (walletAddress) {
      const saved = localStorage.getItem(`bcl_rsvps_${walletAddress}`);
      if (saved) {
        try {
          setRsvpd(new Set(JSON.parse(saved)));
        } catch {}
      }
    }
  }, [walletAddress]);

  const handleRsvp = (eventId: string, title: string) => {
    if (!walletAddress) {
      toast.error("Connect your wallet to RSVP");
      return;
    }
    setRsvpd((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        toast("RSVP removed");
      } else {
        next.add(eventId);
        toast.success(`RSVP confirmed for "${title}"! Notification set.`);
      }
      localStorage.setItem(`bcl_rsvps_${walletAddress}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const liveEvents  = UPCOMING_EVENTS.filter((e) => e.live);
  const upcomingFiltered = UPCOMING_EVENTS.filter((e) => {
    if (activeFilter === "All") return true;
    return e.type === activeFilter;
  });

  const FILTERS = ["All", "Workshop", "Hackathon", "X Space", "Seminar", "Onboarding"];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-subtle to-page border border-accent/15 px-6 py-8 overflow-hidden">
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
              Events & Community Sessions
            </h1>
            <p className="text-sm text-ink-4 max-w-xl">
              Workshops, X Spaces, hackathons, and campus buildathons. Attend, earn XP, and collect
              attendance POAPs verified on-chain.
            </p>
          </div>
          <div className="stat-card shrink-0 min-w-[140px]">
            <div className="text-[10px] text-ink-5 uppercase tracking-wider mb-1">XP This Month</div>
            <div className="text-2xl font-extrabold font-heading text-accent-fg num-mono">+1,300</div>
            <div className="text-[10px] text-ink-5 mt-0.5">From attending events</div>
          </div>
        </div>
      </div>

      {/* ── Live Now banner ─────────────────────────────────────── */}
      {liveEvents.map((ev) => (
        <div key={ev.id} className="rounded-2xl bg-gradient-to-r from-red-950/40 to-surface border border-red-500/25 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 relative">
              <Radio className="w-5 h-5 text-red-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">● LIVE NOW</span>
                <span className="text-[10px] text-ink-5">· {ev.date}</span>
                <span className="xp-tag text-[10px]">+{ev.xp} XP</span>
              </div>
              <div className="font-heading font-bold text-sm text-ink">{ev.title}</div>
              <div className="text-xs text-ink-4 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {ev.mode}
              </div>
            </div>
          </div>
          <a
            href="https://twitter.com/i/spaces"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-green flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Join Space Now
          </a>
        </div>
      ))}

      {/* ── Upcoming Events ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-heading font-bold text-xl text-ink">Upcoming Events</h2>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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

        <div className="space-y-3">
          {upcomingFiltered.map((ev) => {
            const isRsvpd = rsvpd.has(ev.id);
            return (
              <div key={ev.id} className="surface-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Date column */}
                <div className="w-16 shrink-0 text-center hidden sm:block">
                  <div className="text-[10px] text-ink-5 uppercase font-bold">
                    {ev.date.split(" · ")[0].split(" ")[0]}
                  </div>
                  <div className="text-2xl font-extrabold font-heading text-ink num-mono leading-none">
                    {ev.date.split(" ")[1]}
                  </div>
                  <div className="text-[10px] text-ink-5">{ev.date.split("·")[1]?.trim()}</div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-14 bg-border-subtle shrink-0" />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={ev.typeCls}>{ev.type}</span>
                    <span className="text-[10px] text-ink-5 sm:hidden">{ev.date}</span>
                    <span className="xp-tag flex items-center gap-1 text-[10px]">
                      <Zap className="w-2.5 h-2.5" />+{ev.xp} XP
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-ink mb-1">{ev.title}</h3>
                  <p className="text-xs text-ink-4 leading-relaxed line-clamp-2">{ev.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-ink-5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {ev.mode}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {ev.registered} RSVP'd
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="shrink-0">
                  {isRsvpd ? (
                    <button
                      onClick={() => handleRsvp(ev.id, ev.title)}
                      className="btn-outline flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" /> RSVP'd
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRsvp(ev.id, ev.title)}
                      className={`${ev.ctaCls} flex items-center gap-1.5 px-4 py-2 text-xs font-bold`}
                    >
                      {ev.cta === "Set Reminder"
                        ? <><Bell className="w-3.5 h-3.5" /> {ev.cta}</>
                        : <><Calendar className="w-3.5 h-3.5" /> {ev.cta}</>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

      {loading && (
        <div className="flex items-center gap-2 text-ink-5 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading event quests…
        </div>
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
            Have a Quest or Hackathon to Sponsor?
          </h3>
          <p className="text-xs text-ink-4">
            Deploy verified event criteria and XP rewards for 4,000+ certified student developers.
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
