"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "genai-agent-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"; // SSR default
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Fall back to OS preference
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme(): {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  ready: boolean;
} {
  // Start as null so SSR and first client render match (avoids hydration mismatch).
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
  }, []);

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme: theme ?? "dark",
    toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    setTheme: setThemeState,
    ready: theme !== null,
  };
}