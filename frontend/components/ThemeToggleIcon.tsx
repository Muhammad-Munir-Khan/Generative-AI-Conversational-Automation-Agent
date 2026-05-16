"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";

/**
 * Compact icon-only theme toggle for headers and nav bars.
 *
 * Uses the same useTheme() hook as the sidebar's full-size ThemeToggle so
 * both stay in perfect sync (clicking either updates the same localStorage
 * key and document class, and any other useTheme() consumer re-renders).
 */
export function ThemeToggleIcon() {
  const { theme, toggle, ready } = useTheme();

  // Render a same-size placeholder until the hook hydrates so the nav
  // doesn't shift when the icon swaps in.
  if (!ready) {
    return <div className="w-9 h-9" aria-hidden />;
  }

  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition"
    >
      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}