"use client";

import React, { useState } from "react";
import { DEFAULT_QUEST_COVER } from "@/lib/quests";

interface QuestImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Tailwind height class, e.g. "h-28". Width is always 100%. */
  heightClass?: string;
  children?: React.ReactNode; // overlay badges (timer, complete, etc.)
}

/**
 * The single quest cover used on every page. Plain <img> so admin-supplied
 * remote URLs work without next.config image domains. Falls back to the
 * default cover (never an emoji/icon) if the URL is missing or broken.
 */
export function QuestImage({ src, alt, className = "", heightClass = "h-28", children }: QuestImageProps) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? DEFAULT_QUEST_COVER : src;
  return (
    <div className={`relative w-full overflow-hidden bg-subtle ${heightClass} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
