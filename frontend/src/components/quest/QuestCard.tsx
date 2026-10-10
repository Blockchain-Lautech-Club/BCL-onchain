"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Users, Zap } from "lucide-react";
import { QuestImage } from "@/components/quest/QuestImage";
import { badgeClassForCategory, type QuestCardData } from "@/lib/quests";

interface QuestCardProps {
  quest: QuestCardData;
  /** Opens a modal / runs an action. If omitted the CTA links to the quest detail page. */
  onAction?: (quest: QuestCardData) => void;
  className?: string;
  /** "grid" = full card (default). "compact" = shorter cover, tighter body (dashboard / sidebars). */
  variant?: "grid" | "compact";
  children?: React.ReactNode; // extra body content (e.g. milestone progress)
}

export function QuestCard({ quest: q, onAction, className = "", variant = "grid", children }: QuestCardProps) {
  const href = `/tasks/${q.id}`;
  const compact = variant === "compact";
  const ctaClass = `w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
    q.ctaVariant === "green" ? "btn-green" : "btn-outline"
  }`;
  const ctaInner = (<>{q.cta ?? "Start Quest"} <ArrowRight className="w-3 h-3" /></>);

  return (
    <div className={`quest-card overflow-hidden flex flex-col ${q.featured ? "border-accent/30" : ""} ${className}`}>
      <Link href={href} aria-label={q.title} className="block">
        <QuestImage src={q.image} alt={q.title} heightClass={compact ? "h-24" : "h-32"}>
          {q.timer && (
            <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur ${q.featured ? "bg-amber-500/25 text-amber-300 border border-amber-500/30" : "bg-black/40 text-white/90 border border-white/15"}`}>
              <Clock className="w-2.5 h-2.5" /> {q.timer}
            </span>
          )}
          {q.status === "complete" && (
            <span className="absolute top-2 left-2 badge-green flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Complete
            </span>
          )}
        </QuestImage>
      </Link>

      <div className={`${compact ? "p-3.5 gap-2.5" : "p-4 gap-3"} flex flex-col flex-1`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={badgeClassForCategory(q.category)}>{q.category}</span>
          {q.difficulty && <span className="text-[10px] text-ink-5">{q.difficulty}</span>}
        </div>

        <Link href={href}>
          <h3 className="font-heading font-bold text-sm text-ink leading-snug hover:text-accent-fg transition">{q.title}</h3>
        </Link>
        <p className="text-[11px] text-ink-4 leading-relaxed flex-1 line-clamp-2">{q.description}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="xp-tag"><Zap className="w-2.5 h-2.5" />+{q.xp.toLocaleString()} XP</span>
          {q.reward && <span className="text-[10px] text-ink-5">{q.reward}</span>}
        </div>

        {q.participants && (
          <div className="flex items-center gap-1.5 text-[10px] text-ink-5">
            <Users className="w-3 h-3" /> <span>{q.participants}</span>
          </div>
        )}

        {q.progressPct !== undefined && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-ink-5 mb-1">
              <span>Progress</span><span className="text-accent-fg">{q.progressPct}%</span>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${q.progressPct}%` }} /></div>
          </div>
        )}

        {children}

        {onAction ? (
          <button onClick={() => onAction(q)} className={ctaClass}>{ctaInner}</button>
        ) : (
          <Link href={href} className={ctaClass}>{ctaInner}</Link>
        )}
      </div>
    </div>
  );
}
