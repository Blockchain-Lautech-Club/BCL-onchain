import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-ink/[0.05] mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-accent to-brand flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs text-ink-5 font-medium">
            © 2025 Blockchain Community LAUTECH
          </span>
        </div>

        <div className="flex items-center gap-5">
          {["Ecosystem Guilds", "Leaderboard", "Smart Contracts", "Governance"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-xs text-ink-5 hover:text-ink-3 transition"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
