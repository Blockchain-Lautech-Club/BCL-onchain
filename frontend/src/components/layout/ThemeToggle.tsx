"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

export const THEME_STORAGE_KEY = "bcl-theme";

/**
 * Flips <html class="dark"> and remembers the choice in localStorage.
 * The icon is swapped with Tailwind's `dark:` variant (no React state), so server and
 * client render identically — no hydration mismatch.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
    } catch {
      /* storage blocked (private mode) — theme still applies for this session */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-8 h-8 rounded-lg bg-ink/[0.04] border border-ink/[0.06] flex items-center justify-center text-ink-3 hover:text-ink transition cursor-pointer"
      aria-label="Toggle light / dark mode"
      title="Toggle light / dark mode"
    >
      <Sun className="w-3.5 h-3.5 hidden dark:block" />
      <Moon className="w-3.5 h-3.5 block dark:hidden" />
    </button>
  );
}
