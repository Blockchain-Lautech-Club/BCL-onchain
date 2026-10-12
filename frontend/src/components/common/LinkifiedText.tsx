"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
  showIcon?: boolean;
}

// Regex to capture markdown links [label](url) OR raw URLs (https?://...)
const URL_REGEX = /(\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
const MARKDOWN_LINK_REGEX = /^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/;

export function LinkifiedText({
  text,
  className = "",
  linkClassName = "text-accent-fg hover:underline inline-flex items-center gap-1 font-semibold break-all transition-colors",
  showIcon = true,
}: LinkifiedTextProps) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Check if markdown link [title](url)
        const mdMatch = part.match(MARKDOWN_LINK_REGEX);
        if (mdMatch) {
          const label = mdMatch[1];
          const href = mdMatch[2];
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={linkClassName}
            >
              <span>{label}</span>
              {showIcon && <ExternalLink className="w-3 h-3 inline shrink-0" />}
            </a>
          );
        }

        // Check if raw URL (starts with http:// or https://)
        if (part.startsWith("http://") || part.startsWith("https://")) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={linkClassName}
            >
              <span>{part}</span>
              {showIcon && <ExternalLink className="w-3 h-3 inline shrink-0" />}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
