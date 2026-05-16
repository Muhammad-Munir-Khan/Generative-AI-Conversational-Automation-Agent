"use client";

import { Zap } from "lucide-react";
import { formatLatency } from "@/lib/utils";

export function LatencyPill({ ms }: { ms: number }) {
  const { label, tier } = formatLatency(ms);
  const colors = {
    fast: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    medium: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
    slow: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  }[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[0.7rem] px-2.5 py-0.5 rounded-full border ${colors}`}
    >
      <Zap className="w-3 h-3" />
      {label}
    </span>
  );
}
