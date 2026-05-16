/**
 * Small utilities shared across components.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatLatency(ms: number): { label: string; tier: "fast" | "medium" | "slow" } {
  const display = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms} ms`;
  const tier = ms < 2000 ? "fast" : ms < 8000 ? "medium" : "slow";
  return { label: display, tier };
}
