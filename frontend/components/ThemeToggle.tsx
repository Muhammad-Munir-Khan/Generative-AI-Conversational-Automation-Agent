"use client";

import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/lib/theme";

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-[var(--fg-secondary)] group-hover:text-cyan-400 transition">
        {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        {isDark ? "Dark mode" : "Light mode"}
      </span>
      <span className="relative inline-block w-9 h-5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
        <span
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${
            isDark
              ? "right-0.5 bg-cyan-400 shadow-[0_0_6px_rgb(6_182_212/0.6)]"
              : "left-0.5 bg-amber-400 shadow-[0_0_6px_rgb(251_191_36/0.6)]"
          }`}
        />
      </span>
    </button>
  );
}